/**
 * سرور پنل مدیریت Ccoin
 * این فایل شامل تنظیمات و راه‌اندازی سرور Express برای پنل مدیریت ربات Ccoin است
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const flash = require('connect-flash');
const { createClient } = require('@neondatabase/serverless');
const ejsLayouts = require('express-ejs-layouts');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// بارگذاری متغیرهای محیطی
dotenv.config();

// ایجاد اپلیکیشن اکسپرس
const app = express();
const port = process.env.PORT || 3000;

// تنظیمات امنیتی
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
      connectSrc: ["'self'"]
    }
  }
}));

// محدودکننده درخواست‌ها برای جلوگیری از حملات DDOS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 1000, // حداکثر 1000 درخواست
  message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
});
app.use(limiter);

// فشرده‌سازی پاسخ‌ها
app.use(compression());

// پارسر JSON و فرم
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مسیر فایل‌های استاتیک
app.use(express.static(path.join(__dirname, 'public')));

// تنظیمات لاگ
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// لاگ درخواست‌ها
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' })
}));

// تنظیمات موتور قالب‌
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layouts/main');

// تنظیمات سشن
app.use(session({
  store: new FileStore({
    path: path.join(__dirname, 'data/sessions'),
    ttl: 86400, // مدت زمان اعتبار سشن (به ثانیه) - 24 ساعت
    retries: 0
  }),
  secret: process.env.SESSION_SECRET || 'ccoin-admin-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 ساعت
  }
}));

// تنظیمات پیام‌های فلش
app.use(flash());

// تنظیمات پاسپورت برای احراز هویت
app.use(passport.initialize());
app.use(passport.session());

// اتصال به دیتابیس
const dbClient = createClient({
  connectionString: process.env.DATABASE_URL
});

// استراتژی احراز هویت لوکال
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const result = await dbClient.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return done(null, false, { message: 'نام کاربری یا رمز عبور اشتباه است' });
    }
    
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return done(null, false, { message: 'نام کاربری یا رمز عبور اشتباه است' });
    }
    
    // ثبت آخرین ورود
    await dbClient.query('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    return done(null, user);
  } catch (error) {
    console.error('خطا در احراز هویت:', error);
    return done(error);
  }
}));

// سریالایز کاربر در سشن
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// دیسریالایز کاربر از سشن
passport.deserializeUser(async (id, done) => {
  try {
    const result = await dbClient.query('SELECT * FROM admin_users WHERE id = $1', [id]);
    const user = result.rows[0];
    done(null, user);
  } catch (error) {
    console.error('خطا در بازیابی کاربر:', error);
    done(error);
  }
});

// میدلور سراسری برای متغیرهای مشترک
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error'),
    info: req.flash('info')
  };
  
  // تابع‌های کمکی رندر
  res.locals.helpers = {
    formatDate: (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('fa-IR');
    },
    formatNumber: (num) => {
      if (!num) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    timeAgo: (datetime) => {
      if (!datetime) return 'نامشخص';
      
      const now = new Date();
      const date = new Date(datetime);
      const seconds = Math.floor((now - date) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) {
        return interval + ' سال پیش';
      }
      
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) {
        return interval + ' ماه پیش';
      }
      
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        return interval + ' روز پیش';
      }
      
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) {
        return interval + ' ساعت پیش';
      }
      
      interval = Math.floor(seconds / 60);
      if (interval >= 1) {
        return interval + ' دقیقه پیش';
      }
      
      return 'چند لحظه پیش';
    }
  };
  
  next();
});

// میدلور بررسی احراز هویت
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  req.flash('error', 'برای دسترسی به این صفحه باید وارد شوید');
  res.redirect('/auth/login');
};

// میدلور بررسی دسترسی ادمین
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  
  req.flash('error', 'شما دسترسی ادمین ندارید');
  res.redirect('/dashboard');
};

// ثبت رویدادها در لاگ
const logEvent = async (userId, action, details) => {
  try {
    await dbClient.query(
      'INSERT INTO admin_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, action, details, req.ip]
    );
  } catch (error) {
    console.error('خطا در ثبت لاگ:', error);
  }
};

// روت‌های احراز هویت
app.get('/auth/login', (req, res) => {
  // اگر کاربر قبلاً لاگین کرده باشد
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  
  res.render('auth/login', {
    title: 'ورود به پنل مدیریت',
    layout: false
  });
});

app.post('/auth/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/auth/login',
  failureFlash: true
}));

app.get('/auth/logout', (req, res) => {
  if (req.user) {
    logEvent(req.user.id, 'logout', 'خروج از پنل مدیریت');
  }
  
  req.logout((err) => {
    if (err) {
      console.error('خطا در خروج از سیستم:', err);
      req.flash('error', 'خطا در خروج از سیستم');
    } else {
      req.flash('success', 'با موفقیت خارج شدید');
    }
    res.redirect('/auth/login');
  });
});

// روت‌های داشبورد
app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    // دریافت آمار کلی
    const statsQuery = await dbClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours') AS new_users_24h,
        (SELECT COUNT(*) FROM users WHERE last_seen >= NOW() - INTERVAL '24 hours') AS active_users,
        (SELECT COUNT(*) FROM clans) AS total_clans,
        (SELECT SUM(wallet + bank) FROM users) AS total_ccoin,
        (SELECT COUNT(*) FROM quests WHERE is_active = true) AS active_quests,
        (SELECT COUNT(*) FROM user_quests WHERE completed_at >= NOW() - INTERVAL '7 days') AS completed_quests_7d
    `);
    
    const stats = statsQuery.rows[0];
    
    // دریافت تاریخچه کاربران فعال
    const activeUsersHistoryQuery = await dbClient.query(`
      SELECT 
        TO_CHAR(day, 'YYYY-MM-DD') AS date,
        COUNT(DISTINCT user_id) AS count
      FROM 
        user_activities
      WHERE 
        day >= NOW() - INTERVAL '7 days'
      GROUP BY 
        day
      ORDER BY 
        day
    `);
    
    // دریافت آمار بازی‌ها
    const gameStatsQuery = await dbClient.query(`
      SELECT 
        type, 
        COUNT(*) AS count
      FROM 
        games
      WHERE 
        played_at >= NOW() - INTERVAL '30 days'
      GROUP BY 
        type
    `);
    
    // تبدیل به فرمت مناسب
    const gameStats = {
      coinflip: 0,
      rps: 0,
      numberguess: 0,
      dice: 0,
      other: 0
    };
    
    gameStatsQuery.rows.forEach(row => {
      if (gameStats.hasOwnProperty(row.type)) {
        gameStats[row.type] = parseInt(row.count);
      } else {
        gameStats.other += parseInt(row.count);
      }
    });
    
    // دریافت کاربران فعال اخیر
    const recentUsersQuery = await dbClient.query(`
      SELECT 
        u.id,
        u.username,
        u.wallet,
        u.bank,
        u.last_seen,
        u.is_banned AS "isBanned",
        u.is_premium AS "isPremium"
      FROM 
        users u
      WHERE 
        u.last_seen IS NOT NULL
      ORDER BY 
        u.last_seen DESC
      LIMIT 10
    `);
    
    // دریافت رویدادهای اخیر
    const recentEventsQuery = await dbClient.query(`
      SELECT 
        type,
        message,
        created_at AS timestamp
      FROM 
        system_logs
      ORDER BY 
        created_at DESC
      LIMIT 10
    `);
    
    res.render('dashboard/index', {
      title: 'داشبورد',
      active: 'dashboard',
      stats: stats,
      activeUsersHistory: activeUsersHistoryQuery.rows,
      gameStats: gameStats,
      recentUsers: recentUsersQuery.rows,
      recentEvents: recentEventsQuery.rows,
      botStatus: {
        status: 'online',
        version: '1.0.0',
        uptime: '6 ساعت 32 دقیقه'
      }
    });
  } catch (error) {
    console.error('خطا در بارگذاری داشبورد:', error);
    req.flash('error', 'خطا در بارگذاری داشبورد');
    res.status(500).render('error', {
      title: 'خطا',
      error: 'خطا در بارگذاری اطلاعات داشبورد'
    });
  }
});

// روت‌های کاربران
app.get('/users', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder || 'ASC';
    const query = req.query.query || '';
    
    // استخراج تعداد کل کاربران
    const countQuery = await dbClient.query(`
      SELECT COUNT(*) FROM users
      WHERE username ILIKE $1 OR discord_id ILIKE $1
    `, [`%${query}%`]);
    
    const totalUsers = parseInt(countQuery.rows[0].count);
    
    // استخراج کاربران با صفحه‌بندی
    const usersQuery = await dbClient.query(`
      SELECT 
        id, 
        username, 
        discord_id AS "discordId", 
        wallet, 
        bank, 
        crystals,
        level,
        xp,
        created_at AS "createdAt",
        last_seen AS "lastSeen",
        is_banned AS "isBanned",
        is_premium AS "isPremium"
      FROM users
      WHERE username ILIKE $1 OR discord_id ILIKE $1
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $2 OFFSET $3
    `, [`%${query}%`, limit, offset]);
    
    res.render('users/index', {
      title: 'مدیریت کاربران',
      active: 'users',
      users: usersQuery.rows,
      totalUsers: totalUsers,
      page: page,
      limit: limit,
      stats: {
        totalUsers: totalUsers,
        newUsers24h: 10, // این مقادیر باید از دیتابیس استخراج شوند
        activeUsers: 25
      }
    });
  } catch (error) {
    console.error('خطا در بارگذاری لیست کاربران:', error);
    req.flash('error', 'خطا در بارگذاری لیست کاربران');
    res.status(500).render('error', {
      title: 'خطا',
      error: 'خطا در بارگذاری لیست کاربران'
    });
  }
});

// روت مشاهده کاربر
app.get('/users/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // استخراج اطلاعات کاربر
    const userQuery = await dbClient.query(`
      SELECT 
        id, 
        username, 
        discord_id AS "discordId", 
        wallet, 
        bank, 
        crystals,
        level,
        xp,
        created_at AS "createdAt",
        last_seen AS "lastSeen",
        is_banned AS "isBanned",
        is_premium AS "isPremium",
        daily_streak AS "dailyStreak"
      FROM users
      WHERE id = $1
    `, [userId]);
    
    if (userQuery.rows.length === 0) {
      req.flash('error', 'کاربر مورد نظر یافت نشد');
      return res.redirect('/users');
    }
    
    const user = userQuery.rows[0];
    
    // استخراج آیتم‌های کاربر
    const inventoryQuery = await dbClient.query(`
      SELECT 
        i.name,
        i.description,
        i.id AS "itemId",
        ui.quantity,
        ui.expires,
        ui.active
      FROM user_inventory ui
      JOIN items i ON ui.item_id = i.id
      WHERE ui.user_id = $1
    `, [userId]);
    
    // استخراج تراکنش‌های کاربر
    const transactionsQuery = await dbClient.query(`
      SELECT 
        type,
        amount,
        timestamp,
        source_id AS "sourceId",
        target_id AS "targetId",
        source_name AS "sourceName",
        target_name AS "targetName",
        game_type AS "gameType",
        quest_id AS "questId",
        item_id AS "itemId",
        item_name AS "itemName"
      FROM transactions
      WHERE source_id = $1 OR target_id = $1
      ORDER BY timestamp DESC
      LIMIT 20
    `, [userId]);
    
    // استخراج بازی‌های کاربر
    const gamesQuery = await dbClient.query(`
      SELECT 
        id,
        type,
        bet,
        won,
        reward,
        timestamp
      FROM games
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT 20
    `, [userId]);
    
    // استخراج ماموریت‌های کاربر
    const questsQuery = await dbClient.query(`
      SELECT 
        q.id,
        q.title,
        q.description,
        q.reward,
        q.required_amount AS "requiredAmount",
        uq.progress,
        uq.is_completed AS "isCompleted",
        uq.completed_at AS "completedAt"
      FROM quests q
      JOIN user_quests uq ON q.id = uq.quest_id
      WHERE uq.user_id = $1
      ORDER BY uq.is_completed ASC, q.id ASC
    `, [userId]);
    
    // تبدیل به فرمت مناسب
    const inventory = inventoryQuery.rows.map(row => ({
      item: {
        id: row.itemId,
        name: row.name,
        description: row.description
      },
      inventoryItem: {
        quantity: row.quantity,
        expires: row.expires,
        active: row.active
      }
    }));
    
    const quests = questsQuery.rows.map(row => ({
      quest: {
        id: row.id,
        title: row.title,
        description: row.description,
        reward: row.reward,
        requiredAmount: row.requiredAmount
      },
      userQuest: {
        progress: row.progress,
        isCompleted: row.isCompleted,
        completedAt: row.completedAt
      }
    }));
    
    res.render('users/view', {
      title: `کاربر: ${user.username}`,
      active: 'users',
      user: user,
      inventory: inventory,
      transactions: transactionsQuery.rows,
      games: gamesQuery.rows,
      quests: quests,
      activities: [] // فعلاً خالی
    });
  } catch (error) {
    console.error('خطا در بارگذاری اطلاعات کاربر:', error);
    req.flash('error', 'خطا در بارگذاری اطلاعات کاربر');
    res.status(500).render('error', {
      title: 'خطا',
      error: 'خطا در بارگذاری اطلاعات کاربر'
    });
  }
});

// روت‌های کلن‌ها
app.get('/clans', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder || 'ASC';
    const query = req.query.query || '';
    
    // استخراج تعداد کل کلن‌ها
    const countQuery = await dbClient.query(`
      SELECT COUNT(*) FROM clans
      WHERE name ILIKE $1 OR description ILIKE $1
    `, [`%${query}%`]);
    
    const totalClans = parseInt(countQuery.rows[0].count);
    
    // استخراج کلن‌ها با صفحه‌بندی
    const clansQuery = await dbClient.query(`
      SELECT 
        id, 
        name, 
        tag,
        owner_id AS "ownerId",
        level,
        xp,
        max_members AS "maxMembers",
        treasury,
        description,
        created_at AS "createdAt",
        is_recruiting AS "isRecruiting",
        is_private AS "isPrivate"
      FROM clans
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $2 OFFSET $3
    `, [`%${query}%`, limit, offset]);
    
    // استخراج تعداد اعضای هر کلن
    const clanMembersQuery = await dbClient.query(`
      SELECT 
        clan_id,
        COUNT(*) AS members_count
      FROM users
      WHERE clan_id IS NOT NULL
      GROUP BY clan_id
    `);
    
    // ادغام اطلاعات کلن‌ها با تعداد اعضا
    const clans = clansQuery.rows.map(clan => {
      const memberInfo = clanMembersQuery.rows.find(row => row.clan_id === clan.id);
      return {
        ...clan,
        membersCount: memberInfo ? parseInt(memberInfo.members_count) : 0
      };
    });
    
    // استخراج کاربران برای مدال ایجاد کلن
    const usersQuery = await dbClient.query(`
      SELECT id, username FROM users
      ORDER BY username
      LIMIT 100
    `);
    
    // آمار کلن‌ها
    const statsQuery = await dbClient.query(`
      SELECT 
        COUNT(*) AS total_clans,
        (SELECT COUNT(*) FROM clans WHERE created_at >= NOW() - INTERVAL '24 hours') AS new_clans_24h,
        COALESCE(AVG(members_count), 0) AS avg_members,
        SUM(treasury) AS total_treasury
      FROM (
        SELECT 
          c.id,
          c.treasury,
          COUNT(u.id) AS members_count
        FROM clans c
        LEFT JOIN users u ON c.id = u.clan_id
        GROUP BY c.id
      ) AS clan_stats
    `);
    
    const stats = statsQuery.rows[0];
    
    res.render('clans/index', {
      title: 'مدیریت کلن‌ها',
      active: 'clans',
      clans: clans,
      totalClans: totalClans,
      page: page,
      limit: limit,
      users: usersQuery.rows,
      stats: {
        totalClans: totalClans,
        newClans24h: parseInt(stats.new_clans_24h) || 0,
        avgClanMembers: Math.round(parseFloat(stats.avg_members)) || 0,
        totalClanTreasury: parseInt(stats.total_treasury) || 0,
        activeClanWars: 0, // این مقادیر باید از دیتابیس استخراج شوند
        maxClanCapacity: 20, // مقدار پیش‌فرض یا از دیتابیس
        completedClanWars7d: 0
      }
    });
  } catch (error) {
    console.error('خطا در بارگذاری لیست کلن‌ها:', error);
    req.flash('error', 'خطا در بارگذاری لیست کلن‌ها');
    res.status(500).render('error', {
      title: 'خطا',
      error: 'خطا در بارگذاری لیست کلن‌ها'
    });
  }
});

// روت‌های آیتم‌ها
app.get('/items', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 16;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder || 'ASC';
    const query = req.query.query || '';
    const category = req.query.category || '';
    
    // شرط‌های فیلتر
    let whereConditions = "name ILIKE $1 OR description ILIKE $1";
    const params = [`%${query}%`];
    
    // افزودن فیلتر دسته‌بندی
    if (category) {
      whereConditions += " AND category = $" + (params.length + 1);
      params.push(category);
    }
    
    // استخراج تعداد کل آیتم‌ها
    const countQuery = await dbClient.query(`
      SELECT COUNT(*) FROM items
      WHERE ${whereConditions}
    `, params);
    
    const totalItems = parseInt(countQuery.rows[0].count);
    
    // استخراج آیتم‌ها با صفحه‌بندی
    const itemsQuery = await dbClient.query(`
      SELECT 
        id, 
        name, 
        description,
        price,
        crystal_price AS "crystalPrice",
        category,
        duration,
        effects,
        image_url AS "imageUrl",
        is_rare AS "isRare",
        is_limited AS "isLimited",
        created_at AS "createdAt"
      FROM items
      WHERE ${whereConditions}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    
    // آمار آیتم‌ها
    const statsQuery = await dbClient.query(`
      SELECT 
        COUNT(*) AS total_items,
        COUNT(DISTINCT category) AS categories,
        COUNT(*) FILTER (WHERE is_rare = true) AS rare_items,
        (SELECT COUNT(*) FROM items WHERE created_at >= NOW() - INTERVAL '24 hours') AS new_items_24h
    `);
    
    const stats = statsQuery.rows[0];
    
    res.render('items/index', {
      title: 'مدیریت آیتم‌ها',
      active: 'items',
      items: itemsQuery.rows,
      totalItems: totalItems,
      page: page,
      limit: limit,
      stats: {
        totalItems: parseInt(stats.total_items) || 0,
        newItems24h: parseInt(stats.new_items_24h) || 0,
        itemCategories: parseInt(stats.categories) || 0,
        rareItems: parseInt(stats.rare_items) || 0,
        itemPurchases24h: 15, // این مقادیر باید از دیتابیس استخراج شوند
        itemPurchasesAmount24h: 5000,
        mostPopularCategory: 'booster' // این باید از دیتابیس استخراج شود
      }
    });
  } catch (error) {
    console.error('خطا در بارگذاری لیست آیتم‌ها:', error);
    req.flash('error', 'خطا در بارگذاری لیست آیتم‌ها');
    res.status(500).render('error', {
      title: 'خطا',
      error: 'خطا در بارگذاری لیست آیتم‌ها'
    });
  }
});

// صفحه اصلی (ریدایرکت به داشبورد یا لاگین)
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.redirect('/auth/login');
});

// صفحه 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'صفحه یافت نشد',
    error: 'صفحه مورد نظر یافت نشد'
  });
});

// مدیریت خطاها
app.use((err, req, res, next) => {
  console.error('خطای سرور:', err);
  
  res.status(500).render('error', {
    title: 'خطای سرور',
    error: 'خطایی در سرور رخ داده است'
  });
});

// ایجاد کاربر ادمین اولیه (در صورت نیاز)
const createInitialAdmin = async () => {
  try {
    const adminResult = await dbClient.query('SELECT * FROM admin_users WHERE username = $1', ['admin']);
    
    if (adminResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await dbClient.query(`
        INSERT INTO admin_users (username, password, email, role, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, ['admin', hashedPassword, 'admin@example.com', 'admin']);
      
      console.log('کاربر ادمین اولیه با موفقیت ایجاد شد');
    }
  } catch (error) {
    console.error('خطا در ایجاد کاربر ادمین اولیه:', error);
  }
};

// اجرای سرور
const startServer = async () => {
  try {
    // اتصال به دیتابیس
    await dbClient.connect();
    console.log('اتصال به دیتابیس با موفقیت برقرار شد');
    
    // ایجاد کاربر ادمین اولیه
    await createInitialAdmin();
    
    // شروع سرور
    app.listen(port, () => {
      console.log(`سرور پنل مدیریت Ccoin در پورت ${port} در حال اجراست`);
    });
  } catch (error) {
    console.error('خطا در راه‌اندازی سرور:', error);
    process.exit(1);
  }
};

// شروع سرور
startServer();