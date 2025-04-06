/**
 * کنترلر داشبورد پنل ادمین
 */
import * as userService from '../services/userService.js';
import * as economyService from '../services/economyService.js';
import * as aiService from '../services/aiService.js';
import * as statsService from '../services/statsService.js';

/**
 * تابع کمکی برای دریافت آیکون مناسب برای هر نوع رویداد
 * @param {string} eventType نوع رویداد
 * @returns {string} کلاس آیکون متناسب با نوع رویداد
 */
export function getEventIcon(eventType) {
  switch (eventType) {
    case 'login':
      return 'fa-sign-in-alt';
    case 'transaction':
      return 'fa-exchange-alt';
    case 'game':
      return 'fa-gamepad';
    case 'admin':
      return 'fa-user-shield';
    case 'system':
      return 'fa-cogs';
    case 'error':
      return 'fa-exclamation-triangle';
    case 'warning':
      return 'fa-exclamation-circle';
    case 'success':
      return 'fa-check-circle';
    case 'info':
      return 'fa-info-circle';
    default:
      return 'fa-bell';
  }
}

/**
 * نمایش صفحه داشبورد
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showDashboard(req, res) {
  try {
    console.log('🔍 نمایش داشبورد برای کاربر:', req.session.user?.username);
    
    // داده‌های پیش‌فرض برای جلوگیری از خطا
    const defaultStats = {
      onlineUsers: 0,
      totalCommands: 0,
      coinsCirculation: 0,
      serverLoad: 0,
      userActivity: {
        labels: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"],
        values: [0, 0, 0, 0, 0, 0, 0]
      },
      economy: {
        labels: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"],
        transactions: [0, 0, 0, 0, 0, 0, 0]
      },
      recentEvents: [],
      recentActivities: []
    };
    
    // آمار عمومی سیستم
    console.log('📊 دریافت آمار عمومی سیستم...');
    let stats;
    try {
      stats = await getSystemStats();
    } catch (statsError) {
      console.error('❌ خطا در دریافت آمار سیستم:', statsError);
      stats = defaultStats;
    }
    
    // آمار کاربران اخیر
    console.log('👥 دریافت آمار کاربران اخیر...');
    let recentUsers;
    try {
      recentUsers = await userService.getRecentUsers(5);
    } catch (usersError) {
      console.error('❌ خطا در دریافت کاربران اخیر:', usersError);
      recentUsers = [];
    }
    
    // تراکنش‌های اخیر
    console.log('💰 دریافت تراکنش‌های اخیر...');
    let recentTransactions;
    try {
      recentTransactions = await economyService.getRecentTransactions(10);
    } catch (transactionsError) {
      console.error('❌ خطا در دریافت تراکنش‌های اخیر:', transactionsError);
      recentTransactions = [];
    }
    
    // رویدادهای اخیر
    console.log('📅 دریافت رویدادهای اخیر...');
    let recentEvents;
    try {
      recentEvents = await getRecentEvents(5);
    } catch (eventsError) {
      console.error('❌ خطا در دریافت رویدادهای اخیر:', eventsError);
      recentEvents = [];
    }
    
    // آمار بازار سهام
    console.log('📈 دریافت آمار بازار سهام...');
    let stockMarketStats;
    try {
      stockMarketStats = await economyService.getStockMarketOverview();
    } catch (stockError) {
      console.error('❌ خطا در دریافت آمار بازار سهام:', stockError);
      stockMarketStats = {};
    }
    
    // فعالیت‌های اخیر در بات
    console.log('🤖 دریافت فعالیت‌های اخیر بات...');
    let recentActivities;
    try {
      recentActivities = await getRecentActivities(10);
    } catch (activitiesError) {
      console.error('❌ خطا در دریافت فعالیت‌های اخیر بات:', activitiesError);
      recentActivities = [];
    }
    
    // آماده سازی داده‌های نهایی
    const viewData = {
      title: 'داشبورد',
      stats: {
        ...defaultStats,
        ...stats,
        recentEvents,
        recentActivities
      },
      recentUsers,
      recentTransactions,
      recentEvents,
      stockMarketStats,
      recentActivities,
    };
    
    console.log('✅ رندر نمایش داشبورد با داده‌های آماده...');
    res.render('dashboard/index', viewData);
  } catch (error) {
    console.error('❌ خطای کلی در نمایش داشبورد:', error);
    req.flash('error', 'خطایی در بارگذاری داشبورد رخ داده است');
    
    // داده‌های پیش‌فرض برای رندر داشبورد در صورت خطا
    const defaultStats = {
      onlineUsers: 0,
      totalCommands: 0,
      coinsCirculation: 0,
      serverLoad: 0,
      userActivity: {
        labels: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"],
        values: [0, 0, 0, 0, 0, 0, 0]
      },
      economy: {
        labels: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"],
        transactions: [0, 0, 0, 0, 0, 0, 0]
      },
      recentEvents: [],
      recentActivities: []
    };
    
    res.render('dashboard/index', {
      title: 'داشبورد',
      stats: defaultStats,
      recentUsers: [],
      recentTransactions: [],
      recentEvents: [],
      stockMarketStats: {},
      recentActivities: [],
    });
  }
}

/**
 * دریافت آمار لحظه‌ای
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function getRealtimeStats(req, res) {
  try {
    // آمار عمومی سیستم
    const stats = await getSystemStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('خطا در دریافت آمار لحظه‌ای:', error);
    res.status(500).json({
      success: false,
      error: 'خطایی در دریافت آمار لحظه‌ای رخ داده است',
    });
  }
}

/**
 * دریافت آمار عمومی سیستم
 * @returns {Promise<Object>} آمار سیستم
 */
async function getSystemStats() {
  try {
    // آمار کاربران
    const usersStats = await userService.getUsersStats();
    
    // آمار اقتصادی
    const economyStats = await economyService.getEconomyStats();
    
    // آمار هوش مصنوعی
    const aiStats = await getAIStats();
    
    // آمار سرور
    const serverStats = await getServerStats();
    
    // آمار بازی‌ها
    const gamesStats = await statsService.getGamesStats();
    
    return {
      users: usersStats,
      economy: economyStats,
      ai: aiStats,
      server: serverStats,
      games: gamesStats,
    };
  } catch (error) {
    console.error('خطا در دریافت آمار سیستم:', error);
    return {};
  }
}

/**
 * دریافت آمار هوش مصنوعی
 * @returns {Promise<Object>} آمار هوش مصنوعی
 */
async function getAIStats() {
  try {
    // TODO: پیاده‌سازی دریافت آمار هوش مصنوعی
    return {
      totalRequests: 1250,
      dailyRequests: 47,
      responseTimes: {
        avg: 1.2,
        min: 0.5,
        max: 3.1,
      },
      modelsUsage: {
        'gemini-1.5-flash': 723,
        'gemini-1.5-pro': 425,
        'ccoin-tuned-model': 102,
      },
    };
  } catch (error) {
    console.error('خطا در دریافت آمار هوش مصنوعی:', error);
    return {};
  }
}

/**
 * دریافت آمار سرور
 * @returns {Promise<Object>} آمار سرور
 */
async function getServerStats() {
  try {
    // TODO: پیاده‌سازی دریافت آمار سرور
    return {
      uptime: 15.2, // روز
      ramUsage: 68, // درصد
      cpuUsage: 42, // درصد
      ping: 24, // میلی‌ثانیه
      storage: {
        total: 50, // گیگابایت
        used: 23, // گیگابایت
        percentage: 46, // درصد
      },
      guilds: 12,
      shards: 1,
    };
  } catch (error) {
    console.error('خطا در دریافت آمار سرور:', error);
    return {};
  }
}

/**
 * دریافت رویدادهای اخیر
 * @param {Number} limit محدودیت تعداد
 * @returns {Promise<Array>} رویدادهای اخیر
 */
async function getRecentEvents(limit = 5) {
  try {
    // TODO: پیاده‌سازی دریافت رویدادهای اخیر
    return [
      {
        id: 1,
        title: 'مسابقه بینگو',
        type: 'contest',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        participants: 24,
        prizePool: 10000,
        status: 'active',
      },
      {
        id: 2,
        title: 'کد هدیه هفتگی',
        type: 'gift_code',
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
        participants: 89,
        prizePool: 5000,
        status: 'active',
      },
      {
        id: 3,
        title: 'قرعه‌کشی ویژه',
        type: 'giveaway',
        startTime: new Date(Date.now() - 86400000),
        endTime: new Date(Date.now() + 172800000),
        participants: 152,
        prizePool: 25000,
        status: 'active',
      },
    ];
  } catch (error) {
    console.error('خطا در دریافت رویدادهای اخیر:', error);
    return [];
  }
}

/**
 * دریافت فعالیت‌های اخیر در بات
 * @param {Number} limit محدودیت تعداد
 * @returns {Promise<Array>} فعالیت‌های اخیر
 */
async function getRecentActivities(limit = 10) {
  try {
    // TODO: پیاده‌سازی دریافت فعالیت‌های اخیر
    return [
      {
        id: 1,
        type: 'user_join',
        user: {
          id: '123456789',
          name: 'کاربر جدید',
        },
        timestamp: new Date(),
        details: 'کاربر جدید به سرور پیوست',
      },
      {
        id: 2,
        type: 'game_played',
        user: {
          id: '987654321',
          name: 'رضا احمدی',
        },
        timestamp: new Date(Date.now() - 300000),
        details: 'بازی پوکر انجام شد، برنده: رضا احمدی (1200 CC)',
      },
      {
        id: 3,
        type: 'transaction',
        user: {
          id: '456123789',
          name: 'امیر محمدی',
        },
        timestamp: new Date(Date.now() - 600000),
        details: 'انتقال 500 CC به علی رضایی',
      },
    ];
  } catch (error) {
    console.error('خطا در دریافت فعالیت‌های اخیر:', error);
    return [];
  }
}

// حذف export اضافی که باعث تداخل می‌شود