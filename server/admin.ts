import path from 'path';
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { storage } from './storage';
import FileStore from 'session-file-store';
import flash from 'connect-flash';
import expressLayouts from 'express-ejs-layouts';
import { Transaction, User, Item, Clan, Friend, BlockedUser, PrivateChat } from '@shared/schema';

declare module 'express-session' {
  interface SessionData {
    isAuthenticated?: boolean;
    isAdmin?: boolean;
    user?: any;
    returnTo?: string;
  }
}

// تنظیمات ادمین پنل
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ccoin1234';
const SESSION_SECRET = process.env.SESSION_SECRET || 'ccoin-admin-secret';

const SessionStore = FileStore(session);

// میدلویر بررسی احراز هویت
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  
  // ذخیره مسیر فعلی برای بازگشت بعد از لاگین
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'لطفاً ابتدا وارد حساب کاربری خود شوید.');
  res.redirect('/admin/login');
};

// میدلویر بررسی دسترسی ادمینی
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  
  req.flash('error', 'شما دسترسی لازم برای این صفحه را ندارید.');
  res.redirect('/admin/dashboard');
};

/**
 * راه‌اندازی پنل مدیریت
 * @param app اپلیکیشن اکسپرس
 */
export function setupAdminPanel(app: Express) {
  // تنظیمات session
  app.use(session({
    store: new SessionStore({ path: './admin-panel/sessions' }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // یک روز
  }));
  
  // تنظیمات flash
  app.use(flash());
  
  // تنظیمات موتور قالب EJS
  app.set('views', path.join(process.cwd(), 'admin-panel', 'views'));
  app.set('view engine', 'ejs');
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');
  
  // فایل‌های استاتیک
  app.use('/admin/static', express.static(path.join(process.cwd(), 'admin-panel', 'public')));
  
  // میدلویر global variables
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.success_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');
    res.locals.user = req.session.user || null;
    res.locals.isAuthenticated = req.session.isAuthenticated || false;
    res.locals.isAdmin = req.session.isAdmin || false;
    res.locals.currentPage = 1;
    res.locals.totalPages = 1;
    next();
  });
  
  // ثبت روت‌های ادمین
  registerAdminRoutes(app);

  console.log('[express] Admin panel routes registered');
}

/**
 * ثبت روت‌های ادمین پنل
 * @param app اپلیکیشن اکسپرس
 */
function registerAdminRoutes(app: Express) {
  /**
   * صفحه ورود به پنل مدیریت
   */
  app.get("/admin/login", (req: Request, res: Response) => {
    // اگر قبلاً لاگین کرده، ریدایرکت به داشبورد
    if (req.session.isAuthenticated) {
      return res.redirect('/admin/dashboard');
    }
    
    res.render('login', { 
      title: 'ورود به پنل مدیریت',
      layout: false
    });
  });

  /**
   * پردازش فرم ورود
   */
  app.post("/admin/login", (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    // بررسی صحت اطلاعات ورود
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.isAuthenticated = true;
      req.session.isAdmin = true;
      req.session.user = {
        username: ADMIN_USERNAME,
        role: 'admin'
      };
      
      req.flash('success', `خوش آمدید، ${ADMIN_USERNAME}!`);
      
      // اگر URL بازگشت داشته باشیم به آن ریدایرکت می‌کنیم
      const returnTo = req.session.returnTo || '/admin/dashboard';
      delete req.session.returnTo;
      
      return res.redirect(returnTo);
    }
    
    req.flash('error', 'نام کاربری یا رمز عبور اشتباه است.');
    res.redirect('/admin/login');
  });

  /**
   * خروج از حساب کاربری
   */
  app.get("/admin/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('خطا در خروج از حساب کاربری:', err);
      }
      res.redirect('/admin/login');
    });
  });

  /**
   * داشبورد اصلی
   */
  app.get("/admin/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // دریافت آمار کلی
      const users = await storage.getAllUsers();
      const clans = await storage.getAllClans();
      const items = await storage.getAllItems();
      
      // محاسبه آمار
      const userCount = users.length;
      const activeUsers = users.filter(u => {
        const lastActive = new Date(u.lastActive || 0);
        return (new Date().getTime() - lastActive.getTime()) < (7 * 24 * 60 * 60 * 1000);
      }).length;
      
      const totalCcoin = users.reduce((sum, user) => sum + user.wallet + user.bank, 0);
      const totalCrystals = users.reduce((sum, user) => sum + user.crystals, 0);
      const totalClans = clans.length;
      const totalItems = items.length;
      
      // گراف فعالیت روزانه (۷ روز اخیر)
      const today = new Date();
      const activityData = [0, 0, 0, 0, 0, 0, 0]; // 7 روز
      
      users.forEach(user => {
        if (!user.lastActive) return;
        
        const lastActive = new Date(user.lastActive);
        const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000));
        
        if (diffDays >= 0 && diffDays < 7) {
          activityData[6 - diffDays]++;
        }
      });
      
      // اخرین تراکنش‌ها
      let latestTransactions: Transaction[] = [];
      for (const user of users.slice(0, 10)) { // فقط ۱۰ کاربر اخیر برای کارایی بهتر
        const userTransactions = await storage.getUserTransactions(user.id);
        if (userTransactions && userTransactions.length > 0) {
          latestTransactions = latestTransactions.concat(userTransactions);
        }
      }
      
      // مرتب‌سازی بر اساس تاریخ و محدود کردن به ۱۰ تراکنش اخیر
      latestTransactions = latestTransactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      // رویدادهای اخیر
      const recentEvents = [];
      
      // کاربران تازه ثبت نام کرده
      const newUsers = users
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);
      
      for (const user of newUsers) {
        recentEvents.push({
          type: 'new_user',
          timestamp: user.createdAt,
          data: {
            userId: user.id,
            username: user.username,
            discordId: user.discordId
          }
        });
      }
      
      // کلن‌های تازه تاسیس شده
      const newClans = clans
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 3);
      
      for (const clan of newClans) {
        recentEvents.push({
          type: 'new_clan',
          timestamp: clan.createdAt,
          data: {
            clanId: clan.id,
            name: clan.name,
            ownerId: clan.ownerId
          }
        });
      }
      
      // مرتب‌سازی رویدادها بر اساس تاریخ
      recentEvents.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      
      res.render('dashboard/index', {
        title: 'داشبورد مدیریت',
        stats: {
          userCount,
          activeUsers,
          totalCcoin,
          totalCrystals,
          totalClans,
          totalItems
        },
        activityData,
        activityLabels: Array(7).fill(0).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString('fa-IR', { weekday: 'short' });
        }),
        latestTransactions,
        recentEvents
      });
    } catch (error) {
      console.error('خطا در بارگیری داشبورد:', error);
      req.flash('error', 'خطا در بارگیری اطلاعات داشبورد');
      res.render('dashboard/index', { 
        title: 'داشبورد مدیریت',
        stats: {
          userCount: 0,
          activeUsers: 0,
          totalCcoin: 0,
          totalCrystals: 0,
          totalClans: 0,
          totalItems: 0
        },
        activityData: [0, 0, 0, 0, 0, 0, 0],
        activityLabels: ['', '', '', '', '', '', ''],
        latestTransactions: [],
        recentEvents: []
      });
    }
  });

  /**
   * لیست کاربران
   */
  app.get("/admin/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // مرتب‌سازی و فیلتر کردن کاربران بر اساس پارامترهای URL
      let filteredUsers = [...users];
      
      // جستجو
      const searchTerm = req.query.search as string;
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
          user.username.includes(searchTerm) || 
          user.discordId?.includes(searchTerm) || 
          user.displayName?.includes(searchTerm)
        );
      }
      
      // فیلتر
      const filter = req.query.filter as string;
      if (filter) {
        switch (filter) {
          case 'active':
            filteredUsers = filteredUsers.filter(user => {
              const lastActive = new Date(user.lastActive || 0);
              return (new Date().getTime() - lastActive.getTime()) < (7 * 24 * 60 * 60 * 1000);
            });
            break;
          case 'inactive':
            filteredUsers = filteredUsers.filter(user => {
              const lastActive = new Date(user.lastActive || 0);
              return (new Date().getTime() - lastActive.getTime()) >= (7 * 24 * 60 * 60 * 1000);
            });
            break;
          case 'banned':
            filteredUsers = filteredUsers.filter(user => user.banned);
            break;
        }
      }
      
      // مرتب‌سازی
      const sort = req.query.sort as string;
      if (sort) {
        switch (sort) {
          case 'name':
            filteredUsers.sort((a, b) => a.username.localeCompare(b.username));
            break;
          case 'coins':
            filteredUsers.sort((a, b) => (b.wallet + b.bank) - (a.wallet + a.bank));
            break;
          case 'created':
            filteredUsers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            break;
          case 'activity':
            filteredUsers.sort((a, b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime());
            break;
        }
      } else {
        // مرتب‌سازی پیش‌فرض بر اساس آیدی
        filteredUsers.sort((a, b) => b.id - a.id);
      }
      
      // صفحه‌بندی
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      const totalPages = Math.ceil(filteredUsers.length / limit);
      
      // دریافت لیست آیتم‌ها برای بخش افزودن آیتم در عملیات دسته‌جمعی
      const items = await storage.getAllItems();
      
      res.render('users/index', {
        title: 'مدیریت کاربران',
        users: paginatedUsers,
        items,
        currentPage: page,
        totalPages
      });
    } catch (error) {
      console.error('خطا در بارگیری لیست کاربران:', error);
      req.flash('error', 'خطا در بارگیری لیست کاربران');
      res.render('users/index', { 
        title: 'مدیریت کاربران',
        users: [],
        items: [],
        currentPage: 1,
        totalPages: 1
      });
    }
  });

  /**
   * نمایش جزئیات کاربر
   */
  app.get("/admin/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت تراکنش‌های کاربر
      const transactions = await storage.getUserTransactions(userId);
      
      // دریافت آیتم‌های انبار کاربر
      const inventory = await storage.getInventoryItems(userId);
      
      // دریافت کلن کاربر
      let clan: Clan | undefined = undefined;
      if (user.clanId) {
        clan = await storage.getClan(user.clanId);
      }
      
      // آمار کاربر
      const stats = {
        totalTransactions: transactions.length,
        totalItems: inventory.reduce((sum, item) => sum + item.inventoryItem.quantity, 0),
        totalDeposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
        totalWithdraws: transactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + t.amount, 0),
        totalGamesPlayed: transactions.filter(t => t.type === 'game_win' || t.type === 'game_loss').length,
        totalGamesWon: transactions.filter(t => t.type === 'game_win').length,
        registrationDays: Math.floor((new Date().getTime() - new Date(user.createdAt || 0).getTime()) / (24 * 60 * 60 * 1000))
      };
      
      // رخدادهای اخیر کاربر
      const userEvents = [];
      
      // لاگین‌های اخیر
      if (user.lastActive) {
        userEvents.push({
          type: 'login',
          timestamp: user.lastActive,
          description: 'آخرین ورود به اکانت'
        });
      }
      
      // تراکنش‌های اخیر
      for (const transaction of transactions.slice(0, 5)) {
        let description = '';
        
        switch (transaction.type) {
          case 'deposit':
            description = `افزایش ${transaction.amount} سکه به کیف پول`;
            break;
          case 'withdraw':
            description = `برداشت ${transaction.amount} سکه از کیف پول`;
            break;
          case 'transfer_in':
            description = `دریافت ${transaction.amount} سکه از ${transaction.sourceName || 'کاربر دیگر'}`;
            break;
          case 'transfer_out':
            description = `ارسال ${transaction.amount} سکه به ${transaction.targetName || 'کاربر دیگر'}`;
            break;
          case 'game_win':
            description = `برد ${transaction.amount} سکه در بازی ${transaction.gameType || ''}`;
            break;
          case 'game_loss':
            description = `باخت ${transaction.amount} سکه در بازی ${transaction.gameType || ''}`;
            break;
          default:
            description = `تراکنش ${transaction.type} به مقدار ${transaction.amount} سکه`;
        }
        
        userEvents.push({
          type: transaction.type,
          timestamp: transaction.timestamp,
          description
        });
      }
      
      // مرتب‌سازی رویدادها بر اساس تاریخ
      userEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.render('users/user-detail', {
        title: `پروفایل ${user.username}`,
        user,
        transactions: transactions.slice(0, 10), // فقط ۱۰ تراکنش اخیر
        inventory: inventory.slice(0, 10), // فقط ۱۰ آیتم
        clan,
        stats,
        userEvents
      });
    } catch (error) {
      console.error('خطا در بارگیری جزئیات کاربر:', error);
      req.flash('error', 'خطا در بارگیری جزئیات کاربر');
      res.redirect('/admin/users');
    }
  });

  /**
   * بروزرسانی اطلاعات کاربر
   */
  app.post("/admin/users/:id/update", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت داده‌های فرم
      const updates: Partial<User> = {
        username: req.body.username,
        displayName: req.body.displayName || null,
        discordId: req.body.discordId || null,
        wallet: parseInt(req.body.wallet),
        bank: parseInt(req.body.bank),
        crystals: parseInt(req.body.crystals),
        level: parseInt(req.body.level),
        xp: parseInt(req.body.xp),
        banned: req.body.banned === 'on'
      };
      
      // بروزرسانی کاربر
      await storage.updateUser(userId, updates);
      
      req.flash('success', `اطلاعات کاربر ${updates.username} با موفقیت بروز شد.`);
      res.redirect(`/admin/users/${userId}`);
    } catch (error) {
      console.error('خطا در بروزرسانی کاربر:', error);
      req.flash('error', 'خطا در بروزرسانی اطلاعات کاربر');
      res.redirect('/admin/users');
    }
  });

  /**
   * افزایش موجودی کاربر
   */
  app.post("/admin/users/add-coins", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      const type = req.body.type;
      const amount = parseInt(req.body.amount);
      const reason = req.body.reason || 'افزایش موجودی توسط ادمین';
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // افزایش موجودی بر اساس نوع
      if (type === 'wallet') {
        await storage.addToWallet(userId, amount, 'admin_add', { reason });
      } else if (type === 'bank') {
        await storage.addToBank(userId, amount, 'admin_add', { reason });
      } else if (type === 'crystals') {
        await storage.addCrystals(userId, amount);
      }
      
      req.flash('success', `${amount} ${type === 'crystals' ? 'کریستال' : 'سکه'} به حساب کاربر ${user.username} اضافه شد.`);
      res.redirect(`/admin/users/${userId}`);
    } catch (error) {
      console.error('خطا در افزایش موجودی کاربر:', error);
      req.flash('error', 'خطا در افزایش موجودی کاربر');
      res.redirect('/admin/users');
    }
  });

  /**
   * مسدودسازی کاربر
   */
  app.get("/admin/users/:id/ban", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // مسدودسازی کاربر
      await storage.updateUser(userId, { banned: true });
      
      req.flash('success', `کاربر ${user.username} با موفقیت مسدود شد.`);
      res.redirect(`/admin/users/${userId}`);
    } catch (error) {
      console.error('خطا در مسدودسازی کاربر:', error);
      req.flash('error', 'خطا در مسدودسازی کاربر');
      res.redirect('/admin/users');
    }
  });

  /**
   * رفع مسدودیت کاربر
   */
  app.get("/admin/users/:id/unban", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // رفع مسدودیت کاربر
      await storage.updateUser(userId, { banned: false });
      
      req.flash('success', `مسدودیت کاربر ${user.username} با موفقیت رفع شد.`);
      res.redirect(`/admin/users/${userId}`);
    } catch (error) {
      console.error('خطا در رفع مسدودیت کاربر:', error);
      req.flash('error', 'خطا در رفع مسدودیت کاربر');
      res.redirect('/admin/users');
    }
  });

  /**
   * نمایش تراکنش‌های کاربر
   */
  app.get("/admin/users/:id/transactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت تراکنش‌های کاربر
      const transactions = await storage.getUserTransactions(userId);
      
      // فیلتر کردن تراکنش‌ها بر اساس نوع
      let filteredTransactions = [...transactions];
      
      const typeFilter = req.query.type as string;
      if (typeFilter) {
        filteredTransactions = filteredTransactions.filter(tx => tx.type === typeFilter);
      }
      
      // مرتب‌سازی بر اساس تاریخ (جدیدترین ابتدا)
      filteredTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // صفحه‌بندی
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
      const totalPages = Math.ceil(filteredTransactions.length / limit);
      
      // محاسبه آمار مالی
      const stats = {
        totalIncome: transactions.filter(tx => ['deposit', 'transfer_in', 'game_win', 'quest_reward', 'lottery_win', 'bank_interest'].includes(tx.type))
          .reduce((sum, tx) => sum + tx.amount, 0),
        totalExpense: transactions.filter(tx => ['withdraw', 'transfer_out', 'game_loss', 'item_purchase', 'stock_buy'].includes(tx.type))
          .reduce((sum, tx) => sum + tx.amount, 0),
        totalFees: transactions.reduce((sum, tx) => sum + tx.fee, 0),
        totalGames: transactions.filter(tx => tx.type === 'game_win' || tx.type === 'game_loss').length,
        totalWins: transactions.filter(tx => tx.type === 'game_win').length,
        totalLosses: transactions.filter(tx => tx.type === 'game_loss').length
      };
      
      res.render('users/transactions', {
        title: `تراکنش‌های ${user.username}`,
        user,
        transactions: paginatedTransactions,
        stats,
        currentPage: page,
        totalPages,
        typeFilter
      });
    } catch (error) {
      console.error('خطا در بارگیری تراکنش‌های کاربر:', error);
      req.flash('error', 'خطا در بارگیری تراکنش‌های کاربر');
      res.redirect('/admin/users');
    }
  });

  /**
   * نمایش انبار کاربر
   */
  app.get("/admin/users/:id/inventory", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت آیتم‌های انبار کاربر
      const inventory = await storage.getInventoryItems(userId);
      
      // فیلتر کردن آیتم‌ها بر اساس نوع
      let filteredItems = [...inventory];
      
      const typeFilter = req.query.type as string;
      if (typeFilter) {
        filteredItems = filteredItems.filter(inv => inv.item.type === typeFilter);
      }
      
      // محاسبه آمار انبار
      const stats = {
        totalItems: inventory.reduce((sum, inv) => sum + inv.inventoryItem.quantity, 0),
        totalValue: inventory.reduce((sum, inv) => sum + (inv.item.price * inv.inventoryItem.quantity), 0),
        consumableItems: inventory.filter(inv => inv.item.type === 'consumable').length,
        equipmentItems: inventory.filter(inv => inv.item.type === 'equipment').length,
        collectibleItems: inventory.filter(inv => inv.item.type === 'collectible').length,
        specialItems: inventory.filter(inv => inv.item.type === 'special').length
      };
      
      res.render('users/inventory', {
        title: `انبار ${user.username}`,
        user,
        inventory: filteredItems,
        stats,
        typeFilter
      });
    } catch (error) {
      console.error('خطا در بارگیری انبار کاربر:', error);
      req.flash('error', 'خطا در بارگیری انبار کاربر');
      res.redirect('/admin/users');
    }
  });

  /**
   * افزودن آیتم به کاربر
   */
  app.post("/admin/users/:id/add-item", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const itemId = parseInt(req.body.itemId);
      const quantity = parseInt(req.body.quantity) || 1;
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت اطلاعات آیتم
      const item = await storage.getItem(itemId);
      
      if (!item) {
        req.flash('error', 'آیتم مورد نظر یافت نشد.');
        return res.redirect(`/admin/users/${userId}/inventory`);
      }
      
      // افزودن آیتم به انبار کاربر
      const success = await storage.addItemToInventory(userId, itemId, quantity);
      
      if (success) {
        req.flash('success', `${quantity} عدد ${item.name} به انبار کاربر ${user.username} اضافه شد.`);
      } else {
        req.flash('error', 'خطا در افزودن آیتم به انبار کاربر');
      }
      
      res.redirect(`/admin/users/${userId}/inventory`);
    } catch (error) {
      console.error('خطا در افزودن آیتم به کاربر:', error);
      req.flash('error', 'خطا در افزودن آیتم به کاربر');
      res.redirect('/admin/users');
    }
  });
  
  /**
   * حذف آیتم از انبار کاربر
   */
  app.post("/admin/users/:id/remove-item", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const itemId = parseInt(req.body.itemId);
      const quantity = parseInt(req.body.quantity) || 1;
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت اطلاعات آیتم
      const item = await storage.getItem(itemId);
      
      if (!item) {
        req.flash('error', 'آیتم مورد نظر یافت نشد.');
        return res.redirect(`/admin/users/${userId}/inventory`);
      }
      
      // دریافت انبار کاربر برای بررسی موجودی
      const inventory = await storage.getInventoryItems(userId);
      const userItem = inventory.find(inv => inv.item.id === itemId);
      
      if (!userItem) {
        req.flash('error', 'این آیتم در انبار کاربر وجود ندارد.');
        return res.redirect(`/admin/users/${userId}/inventory`);
      }
      
      if (userItem.inventoryItem.quantity < quantity) {
        req.flash('error', `تعداد آیتم درخواستی برای حذف (${quantity}) بیشتر از موجودی کاربر (${userItem.inventoryItem.quantity}) است.`);
        return res.redirect(`/admin/users/${userId}/inventory`);
      }
      
      // حذف آیتم از انبار کاربر - فعلاً یک تابع فرضی است که باید پیاده‌سازی شود
      // در صورتی که این تابع در storage.ts موجود نیست، باید آن را اضافه کنید
      const success = await storage.removeItemFromInventory(userId, itemId, quantity);
      
      if (success) {
        req.flash('success', `${quantity} عدد ${item.name} از انبار کاربر ${user.username} حذف شد.`);
      } else {
        req.flash('error', 'خطا در حذف آیتم از انبار کاربر');
      }
      
      res.redirect(`/admin/users/${userId}/inventory`);
    } catch (error) {
      console.error('خطا در حذف آیتم از کاربر:', error);
      req.flash('error', 'خطا در حذف آیتم از کاربر');
      res.redirect('/admin/users');
    }
  });

  /**
   * لیست کلن‌ها
   */
  app.get("/admin/clans", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clans = await storage.getAllClans();
      
      // مرتب‌سازی و فیلتر کردن کلن‌ها بر اساس پارامترهای URL
      let filteredClans = [...clans];
      
      // جستجو
      const searchTerm = req.query.search as string;
      if (searchTerm) {
        filteredClans = filteredClans.filter(clan => 
          clan.name.includes(searchTerm) || 
          clan.description?.includes(searchTerm)
        );
      }
      
      // مرتب‌سازی
      const sort = req.query.sort as string;
      if (sort) {
        switch (sort) {
          case 'name':
            filteredClans.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'members':
            filteredClans.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
            break;
          case 'created':
            filteredClans.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            break;
          case 'level':
            filteredClans.sort((a, b) => b.level - a.level);
            break;
        }
      } else {
        // مرتب‌سازی پیش‌فرض بر اساس آیدی
        filteredClans.sort((a, b) => b.id - a.id);
      }
      
      // صفحه‌بندی
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedClans = filteredClans.slice(startIndex, endIndex);
      const totalPages = Math.ceil(filteredClans.length / limit);
      
      // دریافت اطلاعات مالکان کلن‌ها
      const users = await storage.getAllUsers();
      const clanOwners = {};
      
      paginatedClans.forEach(clan => {
        const owner = users.find(user => user.id === clan.ownerId);
        if (owner) {
          clanOwners[clan.id] = owner;
        }
      });
      
      res.render('clans/index', {
        title: 'مدیریت کلن‌ها',
        clans: paginatedClans,
        clanOwners,
        currentPage: page,
        totalPages
      });
    } catch (error) {
      console.error('خطا در بارگیری لیست کلن‌ها:', error);
      req.flash('error', 'خطا در بارگیری لیست کلن‌ها');
      res.render('clans/index', { 
        title: 'مدیریت کلن‌ها',
        clans: [],
        clanOwners: {},
        currentPage: 1,
        totalPages: 1
      });
    }
  });

  /**
   * لیست آیتم‌ها
   */
  app.get("/admin/items", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const items = await storage.getAllItems();
      
      // مرتب‌سازی و فیلتر کردن آیتم‌ها بر اساس پارامترهای URL
      let filteredItems = [...items];
      
      // جستجو
      const searchTerm = req.query.search as string;
      if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
          item.name.includes(searchTerm) || 
          item.description?.includes(searchTerm)
        );
      }
      
      // فیلتر
      const filter = req.query.filter as string;
      if (filter) {
        filteredItems = filteredItems.filter(item => item.type === filter);
      }
      
      // مرتب‌سازی
      const sort = req.query.sort as string;
      if (sort) {
        switch (sort) {
          case 'name':
            filteredItems.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'price':
            filteredItems.sort((a, b) => b.price - a.price);
            break;
          case 'type':
            filteredItems.sort((a, b) => a.type.localeCompare(b.type));
            break;
        }
      } else {
        // مرتب‌سازی پیش‌فرض بر اساس آیدی
        filteredItems.sort((a, b) => b.id - a.id);
      }
      
      // صفحه‌بندی
      const page = parseInt(req.query.page as string) || 1;
      const limit = 12;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedItems = filteredItems.slice(startIndex, endIndex);
      const totalPages = Math.ceil(filteredItems.length / limit);
      
      res.render('items/index', {
        title: 'مدیریت آیتم‌ها',
        items: paginatedItems,
        currentPage: page,
        totalPages,
        filterType: filter
      });
    } catch (error) {
      console.error('خطا در بارگیری لیست آیتم‌ها:', error);
      req.flash('error', 'خطا در بارگیری لیست آیتم‌ها');
      res.render('items/index', { 
        title: 'مدیریت آیتم‌ها',
        items: [],
        currentPage: 1,
        totalPages: 1,
        filterType: null
      });
    }
  });

  /**
   * ایجاد آیتم جدید
   */
  app.post("/admin/items/create", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { name, description, price, crystalPrice, type, emoji, effects, maxQuantity } = req.body;
      
      // آماده‌سازی داده آیتم برای ذخیره
      const itemData = {
        name,
        description,
        price: parseInt(price),
        crystalPrice: crystalPrice ? parseInt(crystalPrice) : null,
        type,
        emoji: emoji || null,
        effects: effects ? JSON.parse(effects) : {},
        maxQuantity: maxQuantity ? parseInt(maxQuantity) : 0
      };
      
      // ایجاد آیتم جدید
      const newItem = await storage.createItem(itemData);
      
      req.flash('success', `آیتم جدید "${name}" با موفقیت ایجاد شد.`);
      res.redirect('/admin/items');
    } catch (error) {
      console.error('خطا در ایجاد آیتم جدید:', error);
      req.flash('error', 'خطا در ایجاد آیتم جدید');
      res.redirect('/admin/items');
    }
  });

  /**
   * صفحه اصلی ادمین
   */
  app.get("/admin", (req: Request, res: Response) => {
    res.redirect('/admin/dashboard');
  });

  /**
   * مدیریت دوستی‌ها
   */
  app.get("/admin/friendships", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // آمار دوستی‌ها
      let totalFriendships = 0;
      let friendshipLevels = [0, 0, 0, 0, 0]; // سطح 1 تا 5
      
      // کاربران با بیشترین دوست
      const userFriendCounts: { userId: number; username: string; friendCount: number }[] = [];
      
      for (const user of users) {
        const friends = await storage.getFriends(user.id);
        if (friends && friends.length > 0) {
          totalFriendships += friends.length;
          
          // محاسبه تعداد در هر سطح دوستی
          friends.forEach(friend => {
            if (friend.friendshipLevel >= 1 && friend.friendshipLevel <= 5) {
              friendshipLevels[friend.friendshipLevel - 1]++;
            }
          });
          
          userFriendCounts.push({
            userId: user.id,
            username: user.username,
            friendCount: friends.length
          });
        }
      }
      
      // مرتب‌سازی کاربران بر اساس تعداد دوستان
      userFriendCounts.sort((a, b) => b.friendCount - a.friendCount);
      
      // محاسبه متوسط دوستی‌ها
      const avgFriendships = users.length > 0 ? totalFriendships / users.length : 0;
      
      res.render('friendships/index', {
        title: 'مدیریت دوستی‌ها',
        stats: {
          totalFriendships,
          avgFriendships,
          friendshipLevels
        },
        topUsers: userFriendCounts.slice(0, 10) // 10 کاربر برتر
      });
    } catch (error) {
      console.error('خطا در بارگیری اطلاعات دوستی‌ها:', error);
      req.flash('error', 'خطا در بارگیری اطلاعات دوستی‌ها');
      res.render('friendships/index', { 
        title: 'مدیریت دوستی‌ها',
        stats: {
          totalFriendships: 0,
          avgFriendships: 0,
          friendshipLevels: [0, 0, 0, 0, 0]
        },
        topUsers: []
      });
    }
  });

  /**
   * مشاهده دوستان یک کاربر
   */
  app.get("/admin/users/:id/friends", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت لیست دوستان
      const friends = await storage.getFriends(userId);
      
      // دریافت اطلاعات کامل هر دوست
      const friendDetails = [];
      for (const friend of friends) {
        const friendUser = await storage.getUserByDiscordId(friend.friendId);
        if (friendUser) {
          friendDetails.push({
            ...friend,
            user: friendUser
          });
        }
      }
      
      // دریافت درخواست‌های دوستی
      const friendRequests = await storage.getFriendRequests(userId);
      const pendingRequests = friendRequests.filter(r => r.status === 'pending');
      
      // دریافت اطلاعات کامل برای هر درخواست
      const requestDetails = [];
      for (const request of pendingRequests) {
        let user;
        if (request.fromUserId === userId.toString()) {
          user = await storage.getUserByDiscordId(request.toUserId);
          if (user) {
            requestDetails.push({
              ...request,
              direction: 'sent',
              user
            });
          }
        } else {
          user = await storage.getUserByDiscordId(request.fromUserId);
          if (user) {
            requestDetails.push({
              ...request,
              direction: 'received',
              user
            });
          }
        }
      }
      
      res.render('friendships/user-friends', {
        title: `دوستان ${user.username}`,
        user,
        friends: friendDetails,
        requests: requestDetails
      });
    } catch (error) {
      console.error('خطا در بارگیری لیست دوستان:', error);
      req.flash('error', 'خطا در بارگیری لیست دوستان');
      res.redirect('/admin/users');
    }
  });

  /**
   * مدیریت کاربران بلاک شده
   */
  app.get("/admin/blocked-users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // جمع‌آوری آمار کاربران بلاک شده
      let totalBlockedUsers = 0;
      const userBlockCounts: { userId: number; username: string; blockCount: number }[] = [];
      
      for (const user of users) {
        const blockedUsers = await storage.getBlockedUsers(user.id);
        if (blockedUsers && blockedUsers.length > 0) {
          totalBlockedUsers += blockedUsers.length;
          userBlockCounts.push({
            userId: user.id,
            username: user.username,
            blockCount: blockedUsers.length
          });
        }
      }
      
      // مرتب‌سازی کاربران بر اساس تعداد بلاک‌ها
      userBlockCounts.sort((a, b) => b.blockCount - a.blockCount);
      
      res.render('blocked-users/index', {
        title: 'مدیریت کاربران بلاک شده',
        stats: {
          totalBlockedUsers,
          usersWithBlocks: userBlockCounts.length
        },
        topBlockers: userBlockCounts.slice(0, 10) // 10 کاربر برتر
      });
    } catch (error) {
      console.error('خطا در بارگیری اطلاعات کاربران بلاک شده:', error);
      req.flash('error', 'خطا در بارگیری اطلاعات کاربران بلاک شده');
      res.render('blocked-users/index', { 
        title: 'مدیریت کاربران بلاک شده',
        stats: {
          totalBlockedUsers: 0,
          usersWithBlocks: 0
        },
        topBlockers: []
      });
    }
  });

  /**
   * مشاهده کاربران بلاک شده توسط یک کاربر
   */
  app.get("/admin/users/:id/blocked", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت لیست کاربران بلاک شده
      const blockedUsers = await storage.getBlockedUsers(userId);
      
      // دریافت اطلاعات کامل هر کاربر بلاک شده
      const blockedDetails = [];
      for (const blocked of blockedUsers) {
        const blockedUser = await storage.getUserByDiscordId(blocked.userId);
        if (blockedUser) {
          blockedDetails.push({
            ...blocked,
            user: blockedUser
          });
        }
      }
      
      res.render('blocked-users/user-blocked', {
        title: `کاربران بلاک شده توسط ${user.username}`,
        user,
        blockedUsers: blockedDetails
      });
    } catch (error) {
      console.error('خطا در بارگیری لیست کاربران بلاک شده:', error);
      req.flash('error', 'خطا در بارگیری لیست کاربران بلاک شده');
      res.redirect('/admin/users');
    }
  });

  /**
   * رفع بلاک یک کاربر (توسط ادمین)
   */
  app.post("/admin/unblock-user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      const blockedUserId = parseInt(req.body.blockedUserId);
      
      // بررسی وجود کاربر
      const user = await storage.getUser(userId);
      const blockedUser = await storage.getUser(blockedUserId);
      
      if (!user || !blockedUser) {
        req.flash('error', 'یکی از کاربران یافت نشد.');
        return res.redirect('/admin/blocked-users');
      }
      
      // رفع بلاک
      const result = await storage.unblockUser(userId, blockedUserId);
      
      if (result) {
        req.flash('success', `کاربر ${blockedUser.username} با موفقیت از لیست بلاک ${user.username} حذف شد.`);
      } else {
        req.flash('error', 'خطا در رفع بلاک کاربر.');
      }
      
      // بازگشت به صفحه قبلی
      res.redirect(req.body.returnUrl || '/admin/blocked-users');
    } catch (error) {
      console.error('خطا در رفع بلاک کاربر:', error);
      req.flash('error', 'خطا در رفع بلاک کاربر');
      res.redirect('/admin/blocked-users');
    }
  });

  /**
   * مدیریت چت‌های خصوصی
   */
  app.get("/admin/private-chats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // جمع‌آوری آمار چت‌های خصوصی
      let totalChats = 0;
      let totalMessages = 0;
      const userChatCounts: { userId: number; username: string; chatCount: number }[] = [];
      
      for (const user of users.slice(0, 50)) { // محدود کردن به 50 کاربر برای کارایی بهتر
        const chats = await storage.getPrivateChats(user.id);
        if (chats && chats.length > 0) {
          totalChats += chats.length;
          totalMessages += chats.reduce((sum, chat) => sum + chat.messages.length, 0);
          
          userChatCounts.push({
            userId: user.id,
            username: user.username,
            chatCount: chats.length
          });
        }
      }
      
      // مرتب‌سازی کاربران بر اساس تعداد چت‌ها
      userChatCounts.sort((a, b) => b.chatCount - a.chatCount);
      
      // محاسبه میانگین پیام در هر چت
      const avgMessagesPerChat = totalChats > 0 ? Math.round(totalMessages / totalChats) : 0;
      
      res.render('chats/index', {
        title: 'مدیریت چت‌های خصوصی',
        stats: {
          totalChats,
          totalMessages,
          avgMessagesPerChat,
          usersWithChat: userChatCounts.length
        },
        topUsers: userChatCounts.slice(0, 10) // 10 کاربر برتر
      });
    } catch (error) {
      console.error('خطا در بارگیری اطلاعات چت‌های خصوصی:', error);
      req.flash('error', 'خطا در بارگیری اطلاعات چت‌های خصوصی');
      res.render('chats/index', { 
        title: 'مدیریت چت‌های خصوصی',
        stats: {
          totalChats: 0,
          totalMessages: 0,
          avgMessagesPerChat: 0,
          usersWithChat: 0
        },
        topUsers: []
      });
    }
  });

  /**
   * مشاهده چت‌های خصوصی یک کاربر
   */
  app.get("/admin/users/:id/chats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد.');
        return res.redirect('/admin/users');
      }
      
      // دریافت چت‌های خصوصی
      const chats = await storage.getPrivateChats(userId);
      
      // دریافت اطلاعات طرف مقابل هر چت
      const chatDetails = [];
      for (const chat of chats) {
        const otherParticipantId = chat.participants.find((p: string) => p !== user.discordId);
        if (otherParticipantId) {
          const otherUser = await storage.getUserByDiscordId(otherParticipantId);
          if (otherUser) {
            chatDetails.push({
              ...chat,
              otherUser,
              messageCount: chat.messages.length,
              lastActivity: chat.lastActivityAt
            });
          }
        }
      }
      
      // مرتب‌سازی بر اساس آخرین فعالیت
      chatDetails.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
      
      res.render('chats/user-chats', {
        title: `چت‌های خصوصی ${user.username}`,
        user,
        chats: chatDetails
      });
    } catch (error) {
      console.error('خطا در بارگیری چت‌های خصوصی:', error);
      req.flash('error', 'خطا در بارگیری چت‌های خصوصی');
      res.redirect('/admin/users');
    }
  });

  /**
   * مشاهده یک چت خصوصی
   */
  app.get("/admin/chats/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const chatId = req.params.id;
      
      // دریافت اطلاعات چت
      const chat = await storage.getPrivateChat(chatId);
      
      if (!chat) {
        req.flash('error', 'چت مورد نظر یافت نشد.');
        return res.redirect('/admin/private-chats');
      }
      
      // دریافت اطلاعات شرکت‌کنندگان
      const participants = [];
      for (const participantId of chat.participants) {
        const user = await storage.getUserByDiscordId(participantId);
        if (user) {
          participants.push(user);
        }
      }
      
      // مرتب‌سازی پیام‌ها بر اساس زمان
      const messages = [...chat.messages];
      messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // افزودن اطلاعات فرستنده به پیام‌ها
      const messagesWithSender = [];
      for (const message of messages) {
        const sender = participants.find(p => p.discordId === message.senderId);
        messagesWithSender.push({
          ...message,
          sender
        });
      }
      
      res.render('chats/chat-detail', {
        title: 'جزئیات چت خصوصی',
        chat,
        participants,
        messages: messagesWithSender
      });
    } catch (error) {
      console.error('خطا در بارگیری جزئیات چت:', error);
      req.flash('error', 'خطا در بارگیری جزئیات چت');
      res.redirect('/admin/private-chats');
    }
  });

  /**
   * صفحه 404 برای آدرس‌های نامعتبر ادمین
   */
  app.use("/admin/*", (req: Request, res: Response) => {
    res.status(404).render('error', {
      title: 'صفحه یافت نشد',
      error: {
        status: 404,
        message: 'صفحه مورد نظر یافت نشد'
      }
    });
  });
}