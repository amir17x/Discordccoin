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
    
    // آماده‌سازی داده‌ها برای نمایش
    const viewData = {
      title: 'داشبورد',
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
    
    res.render('dashboard/index', viewData);
  } catch (error) {
    console.error('❌ خطا در نمایش داشبورد:', error);
    res.render('dashboard/index', {
      title: 'داشبورد',
      usersStats: { total: 0, active: 0, new: 0 },
      recentTransactions: [],
      recentEvents: [],
      stockMarket: { totalStocks: 0, marketStatus: 'neutral', recentTrades: 0 },
      botActivities: [],
      getEventIcon: () => 'activity',
      error: 'خطا در بارگیری داده‌های داشبورد'
    });
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
