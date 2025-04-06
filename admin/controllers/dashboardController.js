/**
 * کنترلر داشبورد
 */

import * as userService from '../services/userService.js';
import * as economyService from '../services/economyService.js';

/**
 * نمایش صفحه داشبورد
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showDashboard(req, res) {
  try {
    console.log('🚀 نمایش داشبورد');
    
    // آمار کاربران
    let usersStats = {
      total: 0,
      active: 0,
      new: 0
    };
    
    try {
      console.log('👥 دریافت آمار کاربران اخیر...');
      usersStats = await userService.getUsersStats();
    } catch (error) {
      console.error('❌ خطا در دریافت کاربران اخیر:', error);
    }
    
    // تراکنش‌های اخیر
    let recentTransactions = [];
    
    try {
      console.log('💰 دریافت تراکنش‌های اخیر...');
      recentTransactions = await economyService.getRecentTransactions(5);
    } catch (error) {
      console.error('❌ خطا در دریافت تراکنش‌های اخیر:', error);
    }
    
    // رویدادهای اخیر
    let recentEvents = [];
    
    try {
      console.log('📅 دریافت رویدادهای اخیر...');
      // اینجا می‌تواند از سرویس رویدادها استفاده شود
      // recentEvents = await eventService.getRecentEvents(5);
    } catch (error) {
      console.error('❌ خطا در دریافت رویدادهای اخیر:', error);
    }
    
    // آمار بازار سهام
    let stockMarket = {
      totalStocks: 0,
      marketStatus: 'neutral',
      recentTrades: 0
    };
    
    try {
      console.log('📈 دریافت آمار بازار سهام...');
      const stocksOverview = await economyService.getStockMarketOverview();
      
      if (stocksOverview) {
        stockMarket = {
          totalStocks: stocksOverview.stocks ? stocksOverview.stocks.length : 0,
          marketStatus: stocksOverview.marketCondition || 'neutral',
          recentTrades: stocksOverview.recentTradesCount || 0
        };
      }
    } catch (error) {
      console.error('❌ خطا در دریافت آمار بازار سهام:', error);
    }
    
    // فعالیت‌های اخیر بات
    let botActivities = [];
    
    try {
      console.log('🤖 دریافت فعالیت‌های اخیر بات...');
      // اینجا می‌تواند از سرویس بات استفاده شود
      // botActivities = await botService.getRecentActivities(5);
    } catch (error) {
      console.error('❌ خطا در دریافت فعالیت‌های اخیر بات:', error);
    }
    
    console.log('✅ رندر نمایش داشبورد با داده‌های آماده...');
    
    // آماده‌سازی داده‌ها برای نمایش در قالب قدیمی
    const baseViewData = {
      title: 'داشبورد',
      currentRoute: req.path, // افزودن مسیر فعلی برای استفاده در منوی ناوبری
      usersStats,
      recentTransactions,
      recentEvents,
      stockMarket,
      botActivities,
      getEventIcon: (type) => {
        const icons = {
          'giveaway': 'gift',
          'lottery': 'ticket',
          'tournament': 'trophy',
          'market_crash': 'trending-down',
          'market_boom': 'trending-up',
          'special_bonus': 'award',
          'bank_interest': 'percent',
          'game': 'play',
          'stock': 'bar-chart-2',
          'admin': 'shield'
        };
        
        return icons[type] || 'activity';
      }
    };
    
    // استفاده از قالب Fluent UI برای صفحه داشبورد
    if (process.env.USE_FLUENT_UI === 'true') {
      console.log('🎨 استفاده از رابط کاربری Fluent برای صفحه داشبورد');
      
      // ایجاد داده‌های اضافی مورد نیاز برای قالب Fluent UI
      const stats = {
        // آمار کلی
        totalUsers: usersStats.total || 0,
        totalServers: 120, // مقدار پیش‌فرض
        totalTransactions: recentTransactions.length > 0 ? 2500 : 0, // مقدار پیش‌فرض
        totalGames: 45, // مقدار پیش‌فرض
        
        // درصد رشد
        userGrowth: 12, // مقدار پیش‌فرض
        serverGrowth: 8, // مقدار پیش‌فرض
        transactionGrowth: 15, // مقدار پیش‌فرض
        gameGrowth: 5, // مقدار پیش‌فرض
        
        // کاربران فعال اخیر (نمونه)
        recentActiveUsers: [
          {
            id: '1',
            username: 'user1',
            userID: '123456789',
            lastActive: new Date(),
            status: 'online',
            avatar: null
          },
          {
            id: '2',
            username: 'user2',
            userID: '987654321',
            lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 دقیقه قبل
            status: 'away',
            avatar: null
          },
          {
            id: '3',
            username: 'user3',
            userID: '555555555',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ساعت قبل
            status: 'offline',
            avatar: null
          }
        ],
        
        // رویدادهای اخیر (نمونه)
        recentEvents: [
          {
            type: 'economy',
            title: 'بازار سهام رشد کرد',
            description: 'بازار سهام با رشد 5 درصدی همراه بود',
            date: new Date(),
            status: 'موفق'
          },
          {
            type: 'game',
            title: 'مسابقه هفتگی برگزار شد',
            description: 'مسابقه هفتگی با شرکت 120 کاربر برگزار شد',
            date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 ساعت قبل
            status: 'پایان یافته'
          }
        ],
        
        // داده‌های نمودار کاربران
        userChartLabels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        userChartData: {
          newUsers: [120, 150, 180, 220, 250, 300],
          activeUsers: [80, 100, 130, 150, 200, 240]
        },
        
        // داده‌های نمودار اقتصاد
        economyChartLabels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        economyChartData: {
          income: [5000, 6000, 7500, 8000, 9500, 11000],
          expense: [2000, 2200, 3000, 3500, 4000, 4500],
          profit: [3000, 3800, 4500, 4500, 5500, 6500]
        }
      };
      
      // ترکیب داده‌های پایه با داده‌های اضافی Fluent UI
      const fluentViewData = {
        ...baseViewData,
        layout: 'layouts/fluent-main',
        stats, // اضافه کردن آمار Fluent UI
        user: req.session.user // ارسال اطلاعات کاربر به قالب
      };
      
      res.render('fluent-dashboard', fluentViewData);
    } else {
      res.render('dashboard/index', baseViewData);
    }
  } catch (error) {
    console.error('❌ خطا در نمایش داشبورد:', error);
    // آماده سازی داده‌های خطا برای قالب قدیمی
    const baseErrorData = {
      title: 'داشبورد',
      currentRoute: req.path, // افزودن مسیر فعلی برای استفاده در منوی ناوبری
      usersStats: { total: 0, active: 0, new: 0 },
      recentTransactions: [],
      recentEvents: [],
      stockMarket: { totalStocks: 0, marketStatus: 'neutral', recentTrades: 0 },
      botActivities: [],
      getEventIcon: () => 'activity',
      error: 'خطا در بارگیری داده‌های داشبورد'
    };
    
    if (process.env.USE_FLUENT_UI === 'true') {
      console.log('🎨 استفاده از رابط کاربری Fluent برای صفحه خطای داشبورد');
      
      // ایجاد داده‌های خطا برای قالب Fluent UI
      const stats = {
        // آمار کلی با مقادیر خالی
        totalUsers: 0,
        totalServers: 0,
        totalTransactions: 0,
        totalGames: 0,
        
        // درصد رشد
        userGrowth: 0,
        serverGrowth: 0,
        transactionGrowth: 0,
        gameGrowth: 0,
        
        // لیست‌های خالی
        recentActiveUsers: [],
        recentEvents: [],
        
        // داده‌های نمودار خالی
        userChartLabels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        userChartData: {
          newUsers: [0, 0, 0, 0, 0, 0],
          activeUsers: [0, 0, 0, 0, 0, 0]
        },
        
        economyChartLabels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
        economyChartData: {
          income: [0, 0, 0, 0, 0, 0],
          expense: [0, 0, 0, 0, 0, 0],
          profit: [0, 0, 0, 0, 0, 0]
        }
      };
      
      // ترکیب داده‌های پایه با داده‌های Fluent UI
      const fluentErrorData = {
        ...baseErrorData,
        layout: 'layouts/fluent-main',
        stats,
        user: req.session.user,
        error: 'خطا در بارگیری داده‌های داشبورد' // پیام خطا
      };
      
      res.render('fluent-dashboard', fluentErrorData);
    } else {
      res.render('dashboard/index', baseErrorData);
    }
  }
}

/**
 * API آمار داشبورد
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function getDashboardStats(req, res) {
  try {
    console.log('📊 API آمار داشبورد');
    
    // آمار کاربران
    const usersStats = await userService.getUsersStats();
    
    // آمار اقتصادی
    const economyStats = await economyService.getEconomyStats();
    
    // آمار بازار سهام
    const stocksOverview = await economyService.getStockMarketOverview();
    
    const stockMarket = {
      totalStocks: stocksOverview.stocks ? stocksOverview.stocks.length : 0,
      marketStatus: stocksOverview.marketCondition || 'neutral',
      recentTrades: stocksOverview.recentTradesCount || 0
    };
    
    // ارسال نتیجه
    res.json({
      usersStats,
      economyStats,
      stockMarket
    });
  } catch (error) {
    console.error('❌ خطا در API آمار داشبورد:', error);
    res.status(500).json({ error: 'خطای سرور داخلی' });
  }
}

/**
 * API آمار لحظه‌ای داشبورد
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function getRealtimeStats(req, res) {
  try {
    console.log('⏱️ API آمار لحظه‌ای داشبورد');
    
    // آمار آنلاین کاربران
    let onlineUsers = 0;
    try {
      onlineUsers = await userService.getOnlineUsersCount();
    } catch (error) {
      console.error('خطا در دریافت تعداد کاربران آنلاین:', error);
    }
    
    // تراکنش‌های امروز
    let todayTransactions = {
      count: 0,
      volume: 0
    };
    try {
      todayTransactions = await economyService.getTodayTransactionStats();
    } catch (error) {
      console.error('خطا در دریافت آمار تراکنش‌های امروز:', error);
    }
    
    // وضعیت لحظه‌ای بازار
    let marketStatus = {
      status: 'neutral',
      volatility: 'low'
    };
    try {
      const stocksOverview = await economyService.getStockMarketOverview();
      if (stocksOverview) {
        marketStatus = {
          status: stocksOverview.marketCondition || 'neutral',
          volatility: stocksOverview.volatility || 'low'
        };
      }
    } catch (error) {
      console.error('خطا در دریافت وضعیت لحظه‌ای بازار:', error);
    }
    
    // ارسال نتیجه
    res.json({
      timestamp: new Date(),
      onlineUsers,
      todayTransactions,
      marketStatus
    });
  } catch (error) {
    console.error('❌ خطا در API آمار لحظه‌ای داشبورد:', error);
    res.status(500).json({ error: 'خطای سرور داخلی' });
  }
}
