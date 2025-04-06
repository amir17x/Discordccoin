/**
 * کنترلر صفحات Fluent UI
 * این کنترلر صفحات طراحی شده با Fluent UI را مدیریت می‌کند
 */

/**
 * نمایش صفحه ورود
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showLogin(req, res) {
  res.render('fluent/login', {
    title: 'ورود به پنل مدیریت',
    messages: req.flash(),
    layout: false // بدون استفاده از قالب اصلی
  });
}

/**
 * پردازش فرم ورود
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next اکسپرس
 */
export async function processLogin(req, res, next) {
  // استخراج داده‌های ورود
  const { username, password, remember } = req.body;
  
  // بررسی اطلاعات ورود
  try {
    // جستجوی کاربر در پایگاه داده (نمونه ساده)
    // برای پیاده‌سازی واقعی، جایگزین این کد با جستجو در پایگاه داده شود
    if (username === 'admin' && password === 'admin123') {
      // ذخیره اطلاعات کاربر در نشست
      req.session.user = {
        id: '1',
        username: username,
        role: 'admin'
      };
      
      // تنظیم وضعیت احراز هویت
      req.session.isAuthenticated = true;
      req.session.isAdmin = true;
      
      console.log('✅ کاربر با موفقیت وارد شد:', username);
      console.log('📝 اطلاعات نشست:', req.session);
      
      // تنظیم مدت زمان طولانی‌تر برای نشست در صورت انتخاب "مرا به خاطر بسپار"
      if (remember) {
        // 30 روز
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      }
      
      req.flash('success', 'ورود موفقیت‌آمیز! خوش آمدید.');
      res.redirect('/admin/dashboard');
    } else {
      req.flash('error', 'نام کاربری یا رمز عبور اشتباه است.');
      res.redirect('/admin/login');
    }
  } catch (error) {
    console.error('خطا در احراز هویت:', error);
    req.flash('error', 'خطا در سیستم. لطفاً بعداً دوباره امتحان کنید.');
    res.redirect('/admin/login');
  }
}

/**
 * نمایش داشبورد
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function showDashboard(req, res) {
  // نمونه داده‌های داشبورد
  // برای پیاده‌سازی واقعی، این داده‌ها از پایگاه داده بازیابی شوند
  const dashboardData = {
    // آمار
    stats: {
      totalServers: 125,
      totalUsers: 3842,
      totalTransactions: 287,
      totalCoins: 1429850
    },
    
    // فعالیت‌های اخیر
    activities: [
      {
        icon: 'fas fa-user-plus',
        time: '۱۰ دقیقه پیش',
        text: 'کاربر جدید "علی محمدی" ثبت‌نام کرد'
      },
      {
        icon: 'fas fa-coins',
        time: '۳۰ دقیقه پیش',
        text: 'تعداد ۵۰۰ سکه به کاربر "احمد رضایی" اضافه شد'
      },
      {
        icon: 'fas fa-shopping-cart',
        time: '۱ ساعت پیش',
        text: 'کاربر "مریم حسینی" آیتم "VIP مرتبه ۳" را خریداری کرد'
      },
      {
        icon: 'fas fa-server',
        time: '۲ ساعت پیش',
        text: 'سرور جدید "گیمرها" به سیستم اضافه شد'
      },
      {
        icon: 'fas fa-chart-line',
        time: '۳ ساعت پیش',
        text: 'قیمت سهام "CCOIN" به مقدار ۱۵٪ افزایش یافت'
      }
    ],
    
    // وضعیت سیستم
    systemStatus: {
      stockMarket: 'bull', // مقادیر ممکن: 'bull' (رونق)، 'bear' (رکود)، 'normal' (عادی)، 'crisis' (بحران)
      inflationRate: 2.5,
      bankStatus: 'healthy', // مقادیر ممکن: 'healthy' (سالم)، 'risky' (ریسکی)، 'critical' (بحرانی)
      botStatus: 'online', // مقادیر ممکن: 'online' (آنلاین)، 'offline' (آفلاین)
      lastUpdate: '۱۰ دقیقه پیش'
    },
    
    // اطلاعیه‌ها
    announcements: [
      {
        title: 'به‌روزرسانی سیستم',
        date: '۱۴۰۲/۰۱/۱۵',
        content: 'سیستم CCoin به نسخه ۲.۵.۰ به‌روزرسانی شد. برای اطلاعات بیشتر، لاگ تغییرات را مشاهده کنید.'
      },
      {
        title: 'تعمیرات سرور',
        date: '۱۴۰۲/۰۱/۱۰',
        content: 'در تاریخ ۲۰ فروردین، سرورها برای تعمیرات به مدت ۲ ساعت در دسترس نخواهند بود.'
      }
    ],
    
    // تراکنش‌های اخیر
    transactions: [
      {
        type: 'deposit',
        user: 'علی محمدی',
        amount: 1000,
        date: '۱۴۰۲/۰۱/۱۵ ۱۰:۳۰'
      },
      {
        type: 'withdraw',
        user: 'مریم حسینی',
        amount: 500,
        date: '۱۴۰۲/۰۱/۱۵ ۰۹:۴۵'
      },
      {
        type: 'transfer',
        user: 'احمد رضایی',
        amount: 750,
        date: '۱۴۰۲/۰۱/۱۴ ۲۲:۱۵'
      },
      {
        type: 'deposit',
        user: 'سارا کریمی',
        amount: 2000,
        date: '۱۴۰۲/۰۱/۱۴ ۱۸:۳۰'
      },
      {
        type: 'withdraw',
        user: 'محمد جعفری',
        amount: 300,
        date: '۱۴۰۲/۰۱/۱۴ ۱۶:۱۰'
      }
    ],
    
    // تغییرات قیمت سهام
    stocks: [
      {
        symbol: 'CCOIN',
        name: 'Ccoin Technologies',
        user: 'علی محمدی',
        price: 4567,
        date: '۱۴۰۲/۰۱/۱۵',
        change: 15.2
      },
      {
        symbol: 'PGOLD',
        name: 'Persian Gold Resources',
        user: 'مریم حسینی',
        price: 6433,
        date: '۱۴۰۲/۰۱/۱۵',
        change: 8.7
      },
      {
        symbol: 'OILCO',
        name: 'Oil Company of Persia',
        user: 'احمد رضایی',
        price: 15095,
        date: '۱۴۰۲/۰۱/۱۴',
        change: 4.3
      },
      {
        symbol: 'PBANK',
        name: 'Persian Banking Group',
        user: 'سارا کریمی',
        price: 31087,
        date: '۱۴۰۲/۰۱/۱۴',
        change: -2.1
      },
      {
        symbol: 'TECH',
        name: 'Persian Tech Solutions',
        user: 'محمد جعفری',
        price: 8995,
        date: '۱۴۰۲/۰۱/۱۴',
        change: 1.8
      }
    ]
  };
  
  // ارسال داده‌ها به قالب
  res.render('fluent/dashboard', {
    title: 'داشبورد',
    activePage: 'dashboard',
    user: req.session.user,
    stats: dashboardData.stats,
    activities: dashboardData.activities,
    systemStatus: dashboardData.systemStatus,
    announcements: dashboardData.announcements,
    transactions: dashboardData.transactions,
    stocks: dashboardData.stocks,
    flashMessages: req.flash()
  });
}

/**
 * خروج از سیستم
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function logout(req, res) {
  console.log('🔒 خروج کاربر از سیستم:', req.session.user ? req.session.user.username : 'ناشناس');
  
  // پاک کردن متغیرهای احراز هویت
  req.session.user = null;
  req.session.isAuthenticated = false;
  req.session.isAdmin = false;
  
  // پاک کردن کل نشست
  req.session.destroy(() => {
    req.flash('success', 'با موفقیت از سیستم خارج شدید.');
    res.redirect('/admin/login');
  });
}

/**
 * صفحه پروفایل کاربر
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showProfile(req, res) {
  res.render('fluent/profile', {
    title: 'پروفایل کاربری',
    activePage: 'profile',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه سرورها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showServers(req, res) {
  res.render('fluent/servers', {
    title: 'مدیریت سرورها',
    activePage: 'servers',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه کاربران
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showUsers(req, res) {
  res.render('fluent/users', {
    title: 'مدیریت کاربران',
    activePage: 'users',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه اقتصاد
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showEconomy(req, res) {
  res.render('fluent/economy', {
    title: 'مدیریت اقتصاد',
    activePage: 'economy',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه فروشگاه
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showShop(req, res) {
  res.render('fluent/shop', {
    title: 'مدیریت فروشگاه',
    activePage: 'shop',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه بازار سهام
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showStockMarket(req, res) {
  res.render('fluent/stock-market', {
    title: 'مدیریت بازار سهام',
    activePage: 'stock-market',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه قرعه‌کشی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showLottery(req, res) {
  res.render('fluent/lottery', {
    title: 'مدیریت قرعه‌کشی',
    activePage: 'lottery',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه بانک
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showBank(req, res) {
  res.render('fluent/bank', {
    title: 'مدیریت بانک',
    activePage: 'bank',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه گزارش‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showLogs(req, res) {
  res.render('fluent/logs', {
    title: 'گزارش‌های سیستم',
    activePage: 'logs',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه تنظیمات
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showSettings(req, res) {
  res.render('fluent/settings', {
    title: 'تنظیمات سیستم',
    activePage: 'settings',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * تازه‌سازی وضعیت سیستم (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function refreshStatus(req, res) {
  // شبیه‌سازی تازه‌سازی وضعیت
  // در حالت واقعی، این داده‌ها از سیستم‌های مختلف بازیابی می‌شوند
  setTimeout(() => {
    res.json({
      success: true,
      message: 'وضعیت سیستم با موفقیت به‌روزرسانی شد'
    });
  }, 1000);
}