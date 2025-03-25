import express, { type Express, Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import FileStore from "session-file-store";
import flash from "connect-flash";
import ejsLayouts from "express-ejs-layouts";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { log } from "./vite";

// Получение текущей директории в режиме ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ایجاد نمونه از FileStore برای سشن‌ها
const SessionStore = FileStore(session);

// میدلور‌های احراز هویت
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "برای دسترسی به این صفحه باید وارد شوید");
  res.redirect("/admin/login");
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user as any).role === "admin") {
    return next();
  }
  req.flash("error", "شما دسترسی ادمین ندارید");
  res.redirect("/admin/dashboard");
};

// تابع اصلی راه‌اندازی پنل مدیریت
export function setupAdminPanel(app: Express) {
  // تنظیمات موتور قالب
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "../admin-panel/views"));
  app.use(ejsLayouts);
  app.set("layout", "layouts/main");

  // تنظیمات سشن
  app.use(session({
    store: new SessionStore({
      path: path.join(__dirname, "../admin-panel/data/sessions"),
      ttl: 86400,
      retries: 0
    }),
    secret: process.env.SESSION_SECRET || "ccoin-admin-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // تنظیمات پیام‌های فلش
  app.use(flash());

  // تنظیمات پاسپورت برای احراز هویت
  app.use(passport.initialize());
  app.use(passport.session());

  // تعریف استراتژی احراز هویت لوکال
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      // چک کردن اطلاعات کاربر ادمین (فعلاً به صورت هاردکد)
      // در نسخه نهایی باید از دیتابیس استخراج شود
      if (username === "admin" && password === "admin123") {
        const user = {
          id: 1,
          username: "admin",
          role: "admin",
          name: "مدیر سیستم"
        };
        return done(null, user);
      }
      
      return done(null, false, { message: "نام کاربری یا رمز عبور اشتباه است" });
    } catch (error) {
      console.error("خطا در احراز هویت:", error);
      return done(error);
    }
  }));

  // سریالایز کاربر در سشن
  passport.serializeUser((user, done) => {
    done(null, (user as any).id);
  });

  // دیسریالایز کاربر از سشن
  passport.deserializeUser(async (id, done) => {
    try {
      // در نسخه نهایی باید از دیتابیس استخراج شود
      if (id === 1) {
        const user = {
          id: 1,
          username: "admin",
          role: "admin",
          name: "مدیر سیستم"
        };
        done(null, user);
      } else {
        done(new Error("کاربر یافت نشد"));
      }
    } catch (error) {
      console.error("خطا در بازیابی کاربر:", error);
      done(error);
    }
  });

  // میدلور سراسری برای متغیرهای مشترک
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.user = req.user;
    res.locals.messages = {
      success: req.flash("success"),
      error: req.flash("error"),
      info: req.flash("info")
    };
    
    // تابع‌های کمکی رندر
    res.locals.helpers = {
      formatDate: (date: Date | string) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("fa-IR");
      },
      formatNumber: (num: number) => {
        if (!num) return "0";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      },
      timeAgo: (datetime: Date | string) => {
        if (!datetime) return "نامشخص";
        
        const now = new Date();
        const date = new Date(datetime);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
          return interval + " سال پیش";
        }
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
          return interval + " ماه پیش";
        }
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
          return interval + " روز پیش";
        }
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
          return interval + " ساعت پیش";
        }
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
          return interval + " دقیقه پیش";
        }
        
        return "چند لحظه پیش";
      }
    };
    
    next();
  });

  // فایل‌های استاتیک پنل مدیریت
  app.use("/admin/assets", express.static(path.join(__dirname, "../admin-panel/public")));

  // ثبت روت‌های پنل مدیریت
  registerAdminRoutes(app);
}

// تابع ثبت روت‌های پنل مدیریت
function registerAdminRoutes(app: Express) {
  // روت‌های احراز هویت
  app.get("/admin/login", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      return res.redirect("/admin/dashboard");
    }
    
    res.render("auth/login", {
      title: "ورود به پنل مدیریت",
      layout: false
    });
  });

  app.post("/admin/login", passport.authenticate("local", {
    successRedirect: "/admin/dashboard",
    failureRedirect: "/admin/login",
    failureFlash: true
  }));

  app.get("/admin/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("خطا در خروج از سیستم:", err);
        req.flash("error", "خطا در خروج از سیستم");
      } else {
        req.flash("success", "با موفقیت خارج شدید");
      }
      res.redirect("/admin/login");
    });
  });

  // روت داشبورد
  app.get("/admin/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // دریافت آمار کلی از طریق API
      const allUsers = await storage.getAllUsers();
      const allClans = await storage.getAllClans();
      const allItems = await storage.getAllItems();
      
      const stats = {
        totalUsers: allUsers.length,
        newUsers24h: 0, // باید محاسبه شود
        activeUsers: 0, // باید محاسبه شود
        totalClans: allClans.length,
        totalCcoin: allUsers.reduce((sum, user) => sum + user.wallet + user.bank, 0),
        activeQuests: 0, // باید محاسبه شود
        completedQuests7d: 0 // باید محاسبه شود
      };
      
      // بررسی کاربران جدید و فعال در 24 ساعت گذشته
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      stats.newUsers24h = allUsers.filter(user => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= twentyFourHoursAgo;
      }).length;
      
      stats.activeUsers = allUsers.filter(user => {
        if (!user.lastSeen) return false;
        const lastSeen = new Date(user.lastSeen);
        return lastSeen >= twentyFourHoursAgo;
      }).length;
      
      // دریافت اطلاعات بازی‌ها
      const gameStats = {
        coinflip: 0,
        rps: 0,
        numberguess: 0,
        dice: 0,
        other: 0
      };
      
      // دریافت کاربران فعال اخیر
      const recentUsers = allUsers
        .filter(u => u.lastSeen)
        .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
        .slice(0, 10);
      
      // دریافت رویدادهای اخیر
      const recentEvents = [];
      
      res.render("dashboard/index", {
        title: "داشبورد",
        active: "dashboard",
        stats: stats,
        activeUsersHistory: [],
        gameStats: gameStats,
        recentUsers: recentUsers,
        recentEvents: recentEvents,
        botStatus: {
          status: "online",
          version: "1.0.0",
          uptime: Math.floor(process.uptime() / 60) + " دقیقه"
        }
      });
    } catch (error) {
      console.error("خطا در بارگذاری داشبورد:", error);
      req.flash("error", "خطا در بارگذاری داشبورد");
      res.status(500).render("error", {
        title: "خطا",
        error: "خطا در بارگذاری اطلاعات داشبورد"
      });
    }
  });

  // روت‌های کاربران
  app.get("/admin/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // دریافت همه کاربران
      const allUsers = await storage.getAllUsers();
      
      // فیلتر و صفحه‌بندی
      const totalUsers = allUsers.length;
      const users = allUsers.slice(offset, offset + limit);
      
      res.render("users/index", {
        title: "مدیریت کاربران",
        active: "users",
        users: users,
        totalUsers: totalUsers,
        page: page,
        limit: limit,
        stats: {
          totalUsers: totalUsers,
          newUsers24h: 0, // باید محاسبه شود
          activeUsers: 0 // باید محاسبه شود
        }
      });
    } catch (error) {
      console.error("خطا در بارگذاری لیست کاربران:", error);
      req.flash("error", "خطا در بارگذاری لیست کاربران");
      res.status(500).render("error", {
        title: "خطا",
        error: "خطا در بارگذاری لیست کاربران"
      });
    }
  });

  // روت مشاهده کاربر
  app.get("/admin/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // دریافت اطلاعات کاربر
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.flash("error", "کاربر مورد نظر یافت نشد");
        return res.redirect("/admin/users");
      }
      
      // دریافت آیتم‌های کاربر
      const inventory = await storage.getInventoryItems(userId);
      
      // دریافت کوئست‌های کاربر
      const quests = await storage.getUserQuests(userId);
      
      // دریافت بازی‌های کاربر
      const games = await storage.getUserGames(userId);
      
      // دریافت تراکنش‌های کاربر
      const transactions = [];
      
      res.render("users/view", {
        title: `کاربر: ${user.username}`,
        active: "users",
        user: user,
        inventory: inventory,
        transactions: transactions,
        games: games,
        quests: quests,
        activities: [] // فعلاً خالی
      });
    } catch (error) {
      console.error("خطا در بارگذاری اطلاعات کاربر:", error);
      req.flash("error", "خطا در بارگذاری اطلاعات کاربر");
      res.status(500).render("error", {
        title: "خطا",
        error: "خطا در بارگذاری اطلاعات کاربر"
      });
    }
  });

  // روت‌های کلن‌ها
  app.get("/admin/clans", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      const offset = (page - 1) * limit;
      
      // دریافت همه کلن‌ها
      const allClans = await storage.getAllClans();
      
      // فیلتر و صفحه‌بندی
      const totalClans = allClans.length;
      const clans = allClans.slice(offset, offset + limit);
      
      // دریافت کاربران برای مدال ایجاد کلن
      const users = await storage.getAllUsers();
      
      res.render("clans/index", {
        title: "مدیریت کلن‌ها",
        active: "clans",
        clans: clans,
        totalClans: totalClans,
        page: page,
        limit: limit,
        users: users,
        stats: {
          totalClans: totalClans,
          newClans24h: 0,
          avgClanMembers: 0,
          totalClanTreasury: 0,
          activeClanWars: 0,
          maxClanCapacity: 20,
          completedClanWars7d: 0
        }
      });
    } catch (error) {
      console.error("خطا در بارگذاری لیست کلن‌ها:", error);
      req.flash("error", "خطا در بارگذاری لیست کلن‌ها");
      res.status(500).render("error", {
        title: "خطا",
        error: "خطا در بارگذاری لیست کلن‌ها"
      });
    }
  });

  // روت‌های آیتم‌ها
  app.get("/admin/items", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 16;
      const offset = (page - 1) * limit;
      
      // دریافت همه آیتم‌ها
      const allItems = await storage.getAllItems();
      
      // فیلتر و صفحه‌بندی
      const totalItems = allItems.length;
      const items = allItems.slice(offset, offset + limit);
      
      res.render("items/index", {
        title: "مدیریت آیتم‌ها",
        active: "items",
        items: items,
        totalItems: totalItems,
        page: page,
        limit: limit,
        stats: {
          totalItems: totalItems,
          newItems24h: 0,
          itemCategories: 0,
          rareItems: 0,
          itemPurchases24h: 0,
          itemPurchasesAmount24h: 0,
          mostPopularCategory: "booster"
        }
      });
    } catch (error) {
      console.error("خطا در بارگذاری لیست آیتم‌ها:", error);
      req.flash("error", "خطا در بارگذاری لیست آیتم‌ها");
      res.status(500).render("error", {
        title: "خطا",
        error: "خطا در بارگذاری لیست آیتم‌ها"
      });
    }
  });

  // صفحه اصلی (ریدایرکت به داشبورد یا لاگین)
  app.get("/admin", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      return res.redirect("/admin/dashboard");
    }
    res.redirect("/admin/login");
  });

  // صفحه 404 برای پنل مدیریت
  app.use("/admin/*", (req: Request, res: Response) => {
    res.status(404).render("error", {
      title: "صفحه یافت نشد",
      error: "صفحه مورد نظر یافت نشد"
    });
  });

  log("Admin panel routes registered");
}