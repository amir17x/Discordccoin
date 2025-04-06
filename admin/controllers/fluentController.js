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
  try {
    // واردات سرویس‌های MongoDB
    const { 
      getSystemStats, 
      getRecentActivities, 
      getSystemStatus, 
      getAnnouncements, 
      getRecentTransactions, 
      getStockInfo 
    } = await import('../services/mongoService.js');
    
    // دریافت داده‌های واقعی از پایگاه داده
    const [
      stats,
      activities,
      systemStatus,
      announcements,
      recentTransactions,
      stocks
    ] = await Promise.all([
      getSystemStats(),
      getRecentActivities(5),
      getSystemStatus(),
      getAnnouncements(),
      getRecentTransactions(5),
      getStockInfo(5)
    ]);
    
    console.log('📊 داده‌های داشبورد با موفقیت از پایگاه داده دریافت شدند');
    
    // تبدیل تراکنش‌ها به فرمت مورد نیاز نمایش
    const transactions = recentTransactions.map(tx => {
      // تبدیل تاریخ به فرمت فارسی
      const txDate = new Date(tx.timestamp);
      const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      };
      const persianDate = txDate.toLocaleDateString('fa-IR', options);
      
      return {
        type: tx.type,
        user: tx.username || 'نامشخص',
        amount: tx.amount,
        date: persianDate
      };
    });
    
    // ارسال داده‌ها به قالب
    res.render('fluent/dashboard', {
      title: 'داشبورد',
      activePage: 'dashboard',
      user: req.session.user,
      stats,
      activities,
      systemStatus,
      announcements,
      transactions,
      stocks,
      flashMessages: req.flash()
    });
  } catch (error) {
    console.error('خطا در بارگذاری داشبورد:', error);
    
    // در صورت خطا، نمایش صفحه با پیام خطا
    res.render('fluent/dashboard', {
      title: 'داشبورد',
      activePage: 'dashboard',
      user: req.session.user,
      error: 'خطا در دریافت اطلاعات از پایگاه داده. لطفاً صفحه را دوباره بارگذاری کنید.',
      stats: { totalUsers: 0, totalTransactions: 0, totalCoins: 0, totalServers: 0 },
      activities: [],
      systemStatus: { stockMarket: 'normal', inflationRate: 0, bankStatus: 'unknown', botStatus: 'unknown', lastUpdate: 'نامشخص' },
      announcements: [],
      transactions: [],
      stocks: [],
      flashMessages: req.flash('error', 'خطا در بارگذاری اطلاعات از پایگاه داده')
    });
  }
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
export async function showUsers(req, res) {
  try {
    // واردات سرویس‌های MongoDB
    const { getUsers } = await import('../services/mongoService.js');
    
    // دریافت پارامترهای صفحه‌بندی از query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // دریافت لیست کاربران از پایگاه داده
    const { users, pagination } = await getUsers(page, limit);
    
    console.log(`📊 تعداد ${users.length} کاربر با موفقیت از پایگاه داده دریافت شدند`);
    
    // ارسال داده‌ها به قالب
    res.render('fluent/users', {
      title: 'مدیریت کاربران',
      activePage: 'users',
      user: req.session.user,
      users,
      pagination,
      flashMessages: req.flash()
    });
  } catch (error) {
    console.error('خطا در بارگذاری صفحه کاربران:', error);
    
    // در صورت خطا، نمایش صفحه با پیام خطا
    res.render('fluent/users', {
      title: 'مدیریت کاربران',
      activePage: 'users',
      user: req.session.user,
      error: 'خطا در دریافت اطلاعات کاربران از پایگاه داده. لطفاً صفحه را دوباره بارگذاری کنید.',
      users: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      flashMessages: req.flash('error', 'خطا در بارگذاری اطلاعات کاربران از پایگاه داده')
    });
  }
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
export async function showShop(req, res) {
  try {
    // واردات سرویس‌های MongoDB
    const { getShopItems } = await import('../services/mongoService.js');
    
    // دریافت لیست آیتم‌های فروشگاه از پایگاه داده
    const items = await getShopItems();
    
    console.log(`📊 تعداد ${items.length} آیتم فروشگاه با موفقیت از پایگاه داده دریافت شدند`);
    
    // ارسال داده‌ها به قالب
    res.render('fluent/shop', {
      title: 'مدیریت فروشگاه',
      activePage: 'shop',
      user: req.session.user,
      items,
      flashMessages: req.flash()
    });
  } catch (error) {
    console.error('خطا در بارگذاری صفحه فروشگاه:', error);
    
    // در صورت خطا، نمایش صفحه با پیام خطا
    res.render('fluent/shop', {
      title: 'مدیریت فروشگاه',
      activePage: 'shop',
      user: req.session.user,
      error: 'خطا در دریافت اطلاعات فروشگاه از پایگاه داده. لطفاً صفحه را دوباره بارگذاری کنید.',
      items: [],
      flashMessages: req.flash('error', 'خطا در بارگذاری اطلاعات فروشگاه از پایگاه داده')
    });
  }
}

/**
 * نمایش صفحه بازار سهام
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function showStockMarket(req, res) {
  try {
    // واردات سرویس‌های MongoDB
    const { 
      getStockInfo, 
      getSystemStatus, 
      getStockTransactions,
      getStockMarketStats
    } = await import('../services/mongoService.js');
    
    // دریافت لیست سهام، وضعیت سیستم، تراکنش‌های مربوط به بازار سهام، و آمار بازار سهام از پایگاه داده
    const [
      stocks,
      systemStatus,
      stockTransactions,
      marketStats
    ] = await Promise.all([
      getStockInfo(20), // دریافت حداکثر 20 سهام
      getSystemStatus(),
      getStockTransactions(10), // دریافت 10 تراکنش اخیر مربوط به سهام
      getStockMarketStats()
    ]);
    
    console.log(`📊 تعداد ${stocks.length} سهام با موفقیت از پایگاه داده دریافت شدند`);
    
    // دریافت تنظیمات فعلی بازار سهام
    const marketSettings = {
      updateInterval: 60, // پیش‌فرض: 60 دقیقه
      volatility: systemStatus.inflationRate || 0
    };
    
    // ارسال داده‌ها به قالب
    res.render('fluent/stock-market', {
      title: 'مدیریت بازار سهام',
      activePage: 'stock-market',
      user: req.session.user,
      stocks,
      systemStatus,
      transactions: stockTransactions,
      marketStats,
      marketSettings,
      flashMessages: req.flash()
    });
  } catch (error) {
    console.error('خطا در بارگذاری صفحه بازار سهام:', error);
    
    // در صورت خطا، نمایش صفحه با پیام خطا
    res.render('fluent/stock-market', {
      title: 'مدیریت بازار سهام',
      activePage: 'stock-market',
      user: req.session.user,
      error: 'خطا در دریافت اطلاعات بازار سهام از پایگاه داده. لطفاً صفحه را دوباره بارگذاری کنید.',
      stocks: [],
      systemStatus: { stockMarket: 'normal', inflationRate: 0 },
      transactions: [],
      marketStats: { totalVolume: 0, activeTraders: 0 },
      marketSettings: { updateInterval: 60, volatility: 0 },
      flashMessages: req.flash('error', 'خطا در بارگذاری اطلاعات بازار سهام از پایگاه داده')
    });
  }
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
export async function showBank(req, res) {
  try {
    // واردات سرویس‌های MongoDB
    const { getLoans, getSystemStatus } = await import('../services/mongoService.js');
    
    // دریافت پارامترهای صفحه‌بندی از query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // دریافت لیست وام‌ها و وضعیت سیستم از پایگاه داده
    const [{ loans, pagination }, systemStatus] = await Promise.all([
      getLoans(page, limit),
      getSystemStatus()
    ]);
    
    console.log(`📊 تعداد ${loans.length} وام با موفقیت از پایگاه داده دریافت شدند`);
    
    // ارسال داده‌ها به قالب
    res.render('fluent/bank', {
      title: 'مدیریت بانک',
      activePage: 'bank',
      user: req.session.user,
      loans,
      pagination,
      bankStatus: systemStatus.bankStatus,
      flashMessages: req.flash()
    });
  } catch (error) {
    console.error('خطا در بارگذاری صفحه بانک:', error);
    
    // در صورت خطا، نمایش صفحه با پیام خطا
    res.render('fluent/bank', {
      title: 'مدیریت بانک',
      activePage: 'bank',
      user: req.session.user,
      error: 'خطا در دریافت اطلاعات بانک از پایگاه داده. لطفاً صفحه را دوباره بارگذاری کنید.',
      loans: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      bankStatus: 'unknown',
      flashMessages: req.flash('error', 'خطا در بارگذاری اطلاعات بانک از پایگاه داده')
    });
  }
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
export async function refreshStatus(req, res) {
  try {
    // واردات سرویس‌های MongoDB
    const { 
      getSystemStats, 
      getSystemStatus, 
      getRecentActivities, 
      getRecentTransactions, 
      getStockInfo 
    } = await import('../services/mongoService.js');
    
    // دریافت اطلاعات مختلف از پایگاه داده
    const [
      stats,
      systemStatus,
      activities,
      transactions,
      stocks
    ] = await Promise.all([
      getSystemStats(),
      getSystemStatus(),
      getRecentActivities(5),
      getRecentTransactions(5),
      getStockInfo(5)
    ]);
    
    // ارسال داده‌های به‌روز شده
    res.json({
      success: true,
      message: 'وضعیت سیستم با موفقیت به‌روزرسانی شد',
      data: {
        stats,
        systemStatus,
        activities,
        transactions,
        stocks
      }
    });
  } catch (error) {
    console.error('خطا در تازه‌سازی وضعیت سیستم:', error);
    
    // در صورت خطا، ارسال پیام خطا
    res.status(500).json({
      success: false,
      message: 'خطا در تازه‌سازی وضعیت سیستم',
      error: error.message
    });
  }
}

/**
 * دریافت اطلاعات یک سهام خاص (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function getStockBySymbol(req, res) {
  try {
    // واردات سرویس‌های MongoDB
    const { Stock } = await import('../services/modelHelpers.js');
    
    const { symbol } = req.params;
    
    // بررسی و یافتن سهام با نماد مشخص شده
    const stock = await Stock.findOne({ symbol }).lean();
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `سهام با نماد ${symbol} یافت نشد`
      });
    }
    
    // ارسال اطلاعات سهام
    res.json({
      success: true,
      stock
    });
  } catch (error) {
    console.error(`خطا در دریافت اطلاعات سهام:`, error);
    
    // در صورت خطا، ارسال پیام خطا
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات سهام',
      error: error.message
    });
  }
}

/**
 * به‌روزرسانی قیمت سهام (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function forceUpdateStock(req, res) {
  try {
    // واردات سرویس‌های MongoDB و utils مربوط به دیسکورد
    const { Stock } = await import('../services/modelHelpers.js');
    const { updateStockPrice } = await import('../utils/discord.js');
    
    const { symbol } = req.params;
    
    // بررسی و یافتن سهام با نماد مشخص شده
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `سهام با نماد ${symbol} یافت نشد`
      });
    }
    
    // به‌روزرسانی قیمت سهام با استفاده از تابع مرتبط با دیسکورد بات
    try {
      const result = await updateStockPrice(symbol, req.session.user.username);
      
      if (result.success) {
        return res.json({
          success: true,
          message: `قیمت سهام ${symbol} با موفقیت به‌روزرسانی شد (قیمت جدید: ${result.newPrice})`,
          stock: result.stock
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || `خطا در به‌روزرسانی قیمت سهام ${symbol}`
        });
      }
    } catch (updateError) {
      console.error(`خطا در به‌روزرسانی قیمت سهام ${symbol}:`, updateError);
      return res.status(500).json({
        success: false,
        message: `خطا در به‌روزرسانی قیمت سهام ${symbol}`,
        error: updateError.message
      });
    }
  } catch (error) {
    console.error(`خطا در به‌روزرسانی قیمت سهام:`, error);
    
    // در صورت خطا، ارسال پیام خطا
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی قیمت سهام',
      error: error.message
    });
  }
}

/**
 * ایجاد یا به‌روزرسانی سهام (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function createOrUpdateStock(req, res) {
  try {
    // واردات سرویس‌های MongoDB و utils مربوط به دیسکورد
    const { Stock } = await import('../services/modelHelpers.js');
    const { addNewStock, updateStock } = await import('../utils/discord.js');
    
    const { id, symbol, name, price, volatility, maxDaily } = req.body;
    
    // بررسی داده‌های ورودی
    if (!symbol || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً تمام فیلدهای الزامی را پر کنید'
      });
    }
    
    if (id) {
      // به‌روزرسانی سهام موجود
      try {
        const result = await updateStock(id, {
          symbol,
          name,
          price: Number(price),
          volatility: Number(volatility),
          maxDailyChange: Number(maxDaily)
        }, req.session.user.username);
        
        if (result.success) {
          return res.json({
            success: true,
            message: `سهام ${symbol} با موفقیت به‌روزرسانی شد`,
            stock: result.stock
          });
        } else {
          return res.status(400).json({
            success: false,
            message: result.message || `خطا در به‌روزرسانی سهام ${symbol}`
          });
        }
      } catch (updateError) {
        console.error(`خطا در به‌روزرسانی سهام ${symbol}:`, updateError);
        return res.status(500).json({
          success: false,
          message: `خطا در به‌روزرسانی سهام ${symbol}`,
          error: updateError.message
        });
      }
    } else {
      // ایجاد سهام جدید
      try {
        const result = await addNewStock({
          symbol,
          name,
          initialPrice: Number(price),
          volatility: Number(volatility),
          maxDailyChange: Number(maxDaily)
        }, req.session.user.username);
        
        if (result.success) {
          return res.json({
            success: true,
            message: `سهام ${symbol} با موفقیت ایجاد شد`,
            stock: result.stock
          });
        } else {
          return res.status(400).json({
            success: false,
            message: result.message || `خطا در ایجاد سهام ${symbol}`
          });
        }
      } catch (createError) {
        console.error(`خطا در ایجاد سهام ${symbol}:`, createError);
        return res.status(500).json({
          success: false,
          message: `خطا در ایجاد سهام ${symbol}`,
          error: createError.message
        });
      }
    }
  } catch (error) {
    console.error(`خطا در ایجاد یا به‌روزرسانی سهام:`, error);
    
    // در صورت خطا، ارسال پیام خطا
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد یا به‌روزرسانی سهام',
      error: error.message
    });
  }
}

/**
 * به‌روزرسانی تنظیمات بازار سهام (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function updateMarketSettings(req, res) {
  try {
    // واردات سرویس‌های MongoDB و utils مربوط به دیسکورد
    const { GlobalSettings } = await import('../services/modelHelpers.js');
    const { updateMarketCondition } = await import('../utils/discord.js');
    
    const { status, volatility, updateInterval } = req.body;
    
    // بررسی داده‌های ورودی
    if (!status || !volatility || !updateInterval) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً تمام فیلدهای الزامی را پر کنید'
      });
    }
    
    // به‌روزرسانی وضعیت بازار با استفاده از تابع مرتبط با دیسکورد بات
    try {
      const inflationRate = (volatility - 1) * 100;
      
      // به‌روزرسانی وضعیت بازار
      const result = await updateMarketCondition(status, inflationRate, req.session.user.username);
      
      if (result.success) {
        // ذخیره تنظیمات به‌روزرسانی خودکار
        await GlobalSettings.findOneAndUpdate(
          { category: 'market' },
          { 
            $set: { 
              'settings.updateInterval': Number(updateInterval)
            }
          },
          { upsert: true, new: true }
        );
        
        return res.json({
          success: true,
          message: 'تنظیمات بازار سهام با موفقیت به‌روزرسانی شد',
          marketSettings: {
            status,
            inflationRate,
            updateInterval
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || 'خطا در به‌روزرسانی تنظیمات بازار سهام'
        });
      }
    } catch (updateError) {
      console.error('خطا در به‌روزرسانی تنظیمات بازار سهام:', updateError);
      return res.status(500).json({
        success: false,
        message: 'خطا در به‌روزرسانی تنظیمات بازار سهام',
        error: updateError.message
      });
    }
  } catch (error) {
    console.error('خطا در به‌روزرسانی تنظیمات بازار سهام:', error);
    
    // در صورت خطا، ارسال پیام خطا
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی تنظیمات بازار سهام',
      error: error.message
    });
  }
}
/**
 * نمایش صفحه ماموریت‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showQuests(req, res) {
  res.render('fluent/quests', {
    title: 'مدیریت ماموریت‌ها',
    activePage: 'quests',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه کلن‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showClans(req, res) {
  res.render('fluent/clans', {
    title: 'مدیریت کلن‌ها',
    activePage: 'clans',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه آمار ربات
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showStats(req, res) {
  res.render('fluent/stats', {
    title: 'آمار ربات',
    activePage: 'stats',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه اطلاع‌رسانی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showBroadcast(req, res) {
  res.render('fluent/broadcast', {
    title: 'اطلاع‌رسانی',
    activePage: 'broadcast',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه پشتیبان‌گیری
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showBackup(req, res) {
  res.render('fluent/backup', {
    title: 'پشتیبان‌گیری',
    activePage: 'backup',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * نمایش صفحه تنظیمات هوش مصنوعی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export function showAISettings(req, res) {
  res.render('fluent/ai-settings', {
    title: 'تنظیمات هوش مصنوعی',
    activePage: 'ai-settings',
    user: req.session.user,
    flashMessages: req.flash()
  });
}

/**
 * افزودن سکه به کاربر (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function addCoins(req, res) {
  try {
    const { userId, amount, reason } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کاربر و مقدار سکه الزامی است'
      });
    }
    
    // واردات سرویس‌های لازم
    const { updateUserBalance, getUserByDiscordId } = await import('../services/mongoService.js');
    const { addUserCoins } = await import('../utils/discord.js');
    
    // دریافت اطلاعات کاربر
    const user = await getUserByDiscordId(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر مورد نظر یافت نشد'
      });
    }
    
    // افزودن سکه با استفاده از تابع دیسکورد بات
    const result = await addUserCoins(userId, parseInt(amount), reason);
    
    if (result.success) {
      return res.json({
        success: true,
        message: `مقدار ${amount} سکه با موفقیت به کاربر ${user.username} اضافه شد`,
        user: result.user
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در افزودن سکه به کاربر'
      });
    }
  } catch (error) {
    console.error('خطا در افزودن سکه به کاربر:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در افزودن سکه به کاربر',
      error: error.message
    });
  }
}

/**
 * کاهش سکه کاربر (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function removeCoins(req, res) {
  try {
    const { userId, amount, reason } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کاربر و مقدار سکه الزامی است'
      });
    }
    
    // واردات سرویس‌های لازم
    const { updateUserBalance, getUserByDiscordId } = await import('../services/mongoService.js');
    const { removeUserCoins } = await import('../utils/discord.js');
    
    // دریافت اطلاعات کاربر
    const user = await getUserByDiscordId(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر مورد نظر یافت نشد'
      });
    }
    
    // کاهش سکه با استفاده از تابع دیسکورد بات
    const result = await removeUserCoins(userId, parseInt(amount), reason);
    
    if (result.success) {
      return res.json({
        success: true,
        message: `مقدار ${amount} سکه با موفقیت از کاربر ${user.username} کم شد`,
        user: result.user
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در کاهش سکه کاربر'
      });
    }
  } catch (error) {
    console.error('خطا در کاهش سکه کاربر:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در کاهش سکه کاربر',
      error: error.message
    });
  }
}

/**
 * افزودن آیتم جدید به فروشگاه (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function addItem(req, res) {
  try {
    const { name, description, type, emoji, price } = req.body;
    
    if (!name || !description || !type || !emoji || !price) {
      return res.status(400).json({
        success: false,
        message: 'تمامی فیلدهای نام، توضیحات، نوع، ایموجی و قیمت الزامی هستند'
      });
    }
    
    // واردات سرویس‌های لازم
    const { addShopItem } = await import('../utils/discord.js');
    
    // افزودن آیتم با استفاده از تابع دیسکورد بات
    const result = await addShopItem({
      name,
      description,
      type,
      emoji,
      price: parseInt(price),
      addedBy: req.session.user.username
    });
    
    if (result.success) {
      return res.json({
        success: true,
        message: `آیتم "${name}" با موفقیت به فروشگاه اضافه شد`,
        item: result.item
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در افزودن آیتم به فروشگاه'
      });
    }
  } catch (error) {
    console.error('خطا در افزودن آیتم به فروشگاه:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در افزودن آیتم به فروشگاه',
      error: error.message
    });
  }
}

/**
 * ویرایش آیتم موجود در فروشگاه (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function editItem(req, res) {
  try {
    const { id } = req.params;
    const { name, description, type, emoji, price } = req.body;
    
    if (!name || !description || !type || !emoji || !price) {
      return res.status(400).json({
        success: false,
        message: 'تمامی فیلدهای نام، توضیحات، نوع، ایموجی و قیمت الزامی هستند'
      });
    }
    
    // واردات سرویس‌های لازم
    const { editShopItem } = await import('../utils/discord.js');
    
    // ویرایش آیتم با استفاده از تابع دیسکورد بات
    const result = await editShopItem(id, {
      name,
      description,
      type,
      emoji,
      price: parseInt(price),
      editedBy: req.session.user.username
    });
    
    if (result.success) {
      return res.json({
        success: true,
        message: `آیتم "${name}" با موفقیت ویرایش شد`,
        item: result.item
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در ویرایش آیتم فروشگاه'
      });
    }
  } catch (error) {
    console.error('خطا در ویرایش آیتم فروشگاه:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در ویرایش آیتم فروشگاه',
      error: error.message
    });
  }
}

/**
 * حذف آیتم از فروشگاه (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    
    // واردات سرویس‌های لازم
    const { deleteShopItem } = await import('../utils/discord.js');
    
    // حذف آیتم با استفاده از تابع دیسکورد بات
    const result = await deleteShopItem(id, req.session.user.username);
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'آیتم با موفقیت از فروشگاه حذف شد',
        itemId: id
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در حذف آیتم از فروشگاه'
      });
    }
  } catch (error) {
    console.error('خطا در حذف آیتم از فروشگاه:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در حذف آیتم از فروشگاه',
      error: error.message
    });
  }
}

/**
 * ارسال پیام همگانی (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function sendBroadcast(req, res) {
  try {
    const { message, title, color, image, targetType, targetIds } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'متن پیام الزامی است'
      });
    }
    
    // واردات سرویس‌های لازم
    const { sendBroadcastMessage } = await import('../utils/discord.js');
    
    // ارسال پیام با استفاده از تابع دیسکورد بات
    const result = await sendBroadcastMessage({
      message,
      title: title || 'اطلاعیه',
      color: color || '#0099ff',
      image,
      targetType: targetType || 'all',
      targetIds,
      sentBy: req.session.user.username
    });
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'پیام با موفقیت ارسال شد',
        recipients: result.recipients
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در ارسال پیام'
      });
    }
  } catch (error) {
    console.error('خطا در ارسال پیام همگانی:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در ارسال پیام همگانی',
      error: error.message
    });
  }
}

/**
 * به‌روزرسانی تنظیمات (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function updateSettings(req, res) {
  try {
    const { section, settings } = req.body;
    
    if (!section || !settings) {
      return res.status(400).json({
        success: false,
        message: 'بخش و تنظیمات الزامی هستند'
      });
    }
    
    // واردات سرویس‌های لازم
    const { updateBotSettings } = await import('../utils/discord.js');
    
    // به‌روزرسانی تنظیمات با استفاده از تابع دیسکورد بات
    const result = await updateBotSettings(section, settings, req.session.user.username);
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'تنظیمات با موفقیت به‌روزرسانی شدند',
        settings: result.settings
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در به‌روزرسانی تنظیمات'
      });
    }
  } catch (error) {
    console.error('خطا در به‌روزرسانی تنظیمات:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در به‌روزرسانی تنظیمات',
      error: error.message
    });
  }
}

/**
 * ایجاد نسخه پشتیبان (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function createBackup(req, res) {
  try {
    const { type, description } = req.body;
    
    // واردات سرویس‌های لازم
    const { createBackupFile } = await import('../utils/discord.js');
    
    // ایجاد نسخه پشتیبان با استفاده از تابع دیسکورد بات
    const result = await createBackupFile(type || 'full', description, req.session.user.username);
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'نسخه پشتیبان با موفقیت ایجاد شد',
        backup: result.backup
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در ایجاد نسخه پشتیبان'
      });
    }
  } catch (error) {
    console.error('خطا در ایجاد نسخه پشتیبان:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در ایجاد نسخه پشتیبان',
      error: error.message
    });
  }
}

/**
 * بازیابی نسخه پشتیبان (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function restoreBackup(req, res) {
  try {
    const { backupId } = req.body;
    
    if (!backupId) {
      return res.status(400).json({
        success: false,
        message: 'شناسه نسخه پشتیبان الزامی است'
      });
    }
    
    // واردات سرویس‌های لازم
    const { restoreBackupFile } = await import('../utils/discord.js');
    
    // بازیابی نسخه پشتیبان با استفاده از تابع دیسکورد بات
    const result = await restoreBackupFile(backupId, req.session.user.username);
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'نسخه پشتیبان با موفقیت بازیابی شد',
        details: result.details
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در بازیابی نسخه پشتیبان'
      });
    }
  } catch (error) {
    console.error('خطا در بازیابی نسخه پشتیبان:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در بازیابی نسخه پشتیبان',
      error: error.message
    });
  }
}

/**
 * افزودن ماموریت جدید (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function addQuest(req, res) {
  try {
    const { title, description, reward, type, requirements, expiresIn } = req.body;
    
    if (!title || !description || !reward || !type) {
      return res.status(400).json({
        success: false,
        message: 'عنوان، توضیحات، پاداش و نوع ماموریت الزامی هستند'
      });
    }
    
    // واردات سرویس‌های لازم
    const { addQuestItem } = await import('../utils/discord.js');
    
    // افزودن ماموریت با استفاده از تابع دیسکورد بات
    const result = await addQuestItem({
      title,
      description,
      reward: parseInt(reward),
      type,
      requirements: requirements || {},
      expiresIn: expiresIn ? parseInt(expiresIn) : null,
      addedBy: req.session.user.username
    });
    
    if (result.success) {
      return res.json({
        success: true,
        message: `ماموریت "${title}" با موفقیت اضافه شد`,
        quest: result.quest
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در افزودن ماموریت'
      });
    }
  } catch (error) {
    console.error('خطا در افزودن ماموریت:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در افزودن ماموریت',
      error: error.message
    });
  }
}

/**
 * ویرایش ماموریت (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function editQuest(req, res) {
  try {
    const { id } = req.params;
    const { title, description, reward, type, requirements, expiresIn, active } = req.body;
    
    // واردات سرویس‌های لازم
    const { editQuestItem } = await import('../utils/discord.js');
    
    // ویرایش ماموریت با استفاده از تابع دیسکورد بات
    const result = await editQuestItem(id, {
      title,
      description,
      reward: reward ? parseInt(reward) : undefined,
      type,
      requirements,
      expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
      active: active !== undefined ? Boolean(active) : undefined,
      editedBy: req.session.user.username
    });
    
    if (result.success) {
      return res.json({
        success: true,
        message: `ماموریت با موفقیت ویرایش شد`,
        quest: result.quest
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در ویرایش ماموریت'
      });
    }
  } catch (error) {
    console.error('خطا در ویرایش ماموریت:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در ویرایش ماموریت',
      error: error.message
    });
  }
}

/**
 * حذف ماموریت (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function deleteQuest(req, res) {
  try {
    const { id } = req.params;
    
    // واردات سرویس‌های لازم
    const { deleteQuestItem } = await import('../utils/discord.js');
    
    // حذف ماموریت با استفاده از تابع دیسکورد بات
    const result = await deleteQuestItem(id, req.session.user.username);
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'ماموریت با موفقیت حذف شد',
        questId: id
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در حذف ماموریت'
      });
    }
  } catch (error) {
    console.error('خطا در حذف ماموریت:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در حذف ماموریت',
      error: error.message
    });
  }
}

/**
 * افزودن کلن جدید (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function addClan(req, res) {
  try {
    const { name, description, owner, icon, color } = req.body;
    
    if (!name || !owner) {
      return res.status(400).json({
        success: false,
        message: 'نام و مالک کلن الزامی هستند'
      });
    }
    
    // واردات سرویس‌های لازم
    const { addClanItem } = await import('../utils/discord.js');
    
    // افزودن کلن با استفاده از تابع دیسکورد بات
    const result = await addClanItem({
      name,
      description: description || '',
      owner,
      icon: icon || '🏰',
      color: color || '#0099ff',
      addedBy: req.session.user.username
    });
    
    if (result.success) {
      return res.json({
        success: true,
        message: `کلن "${name}" با موفقیت اضافه شد`,
        clan: result.clan
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در افزودن کلن'
      });
    }
  } catch (error) {
    console.error('خطا در افزودن کلن:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در افزودن کلن',
      error: error.message
    });
  }
}

/**
 * ویرایش کلن (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function editClan(req, res) {
  try {
    const { id } = req.params;
    const { name, description, owner, icon, color, members, roles } = req.body;
    
    // واردات سرویس‌های لازم
    const { editClanItem } = await import('../utils/discord.js');
    
    // ویرایش کلن با استفاده از تابع دیسکورد بات
    const result = await editClanItem(id, {
      name,
      description,
      owner,
      icon,
      color,
      members,
      roles,
      editedBy: req.session.user.username
    });
    
    if (result.success) {
      return res.json({
        success: true,
        message: `کلن با موفقیت ویرایش شد`,
        clan: result.clan
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در ویرایش کلن'
      });
    }
  } catch (error) {
    console.error('خطا در ویرایش کلن:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در ویرایش کلن',
      error: error.message
    });
  }
}

/**
 * حذف کلن (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function deleteClan(req, res) {
  try {
    const { id } = req.params;
    
    // واردات سرویس‌های لازم
    const { deleteClanItem } = await import('../utils/discord.js');
    
    // حذف کلن با استفاده از تابع دیسکورد بات
    const result = await deleteClanItem(id, req.session.user.username);
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'کلن با موفقیت حذف شد',
        clanId: id
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در حذف کلن'
      });
    }
  } catch (error) {
    console.error('خطا در حذف کلن:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در حذف کلن',
      error: error.message
    });
  }
}

/**
 * به‌روزرسانی تنظیمات هوش مصنوعی (API)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
export async function updateAISettings(req, res) {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'تنظیمات الزامی هستند'
      });
    }
    
    // واردات سرویس‌های لازم
    const { updateAISettings: updateAI } = await import('../utils/discord.js');
    
    // به‌روزرسانی تنظیمات با استفاده از تابع دیسکورد بات
    const result = await updateAI(settings, req.session.user.username);
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'تنظیمات هوش مصنوعی با موفقیت به‌روزرسانی شدند',
        settings: result.settings
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'خطا در به‌روزرسانی تنظیمات هوش مصنوعی'
      });
    }
  } catch (error) {
    console.error('خطا در به‌روزرسانی تنظیمات هوش مصنوعی:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در به‌روزرسانی تنظیمات هوش مصنوعی',
      error: error.message
    });
  }
}
