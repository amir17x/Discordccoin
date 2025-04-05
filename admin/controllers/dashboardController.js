/**
 * کنترلر داشبورد پنل ادمین
 * 
 * این کنترلر مسئول نمایش داشبورد و ارائه آمار و اطلاعات کلی است.
 */

import { 
  getDiscordStats,
  getEconomyStats,
  getRecentTransactions,
  getTopUsers,
  getRecentActivities,
  getSystemAlerts
} from '../services/dashboardService.js';

/**
 * نمایش صفحه اصلی داشبورد
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showDashboard = async (req, res) => {
  try {
    // دریافت آمار دیسکورد
    const discordStats = await getDiscordStats();
    
    // دریافت آمار اقتصادی
    const economyStats = await getEconomyStats();
    
    // دریافت لیست تراکنش‌های اخیر
    const recentTransactions = await getRecentTransactions(10);
    
    // دریافت لیست کاربران برتر
    const topUsers = await getTopUsers(5);
    
    // دریافت فعالیت‌های اخیر
    const recentActivities = await getRecentActivities(10);
    
    // دریافت هشدارهای سیستم
    const systemAlerts = await getSystemAlerts(5);
    
    res.render('dashboard', {
      title: 'داشبورد',
      discordStats,
      economyStats,
      recentTransactions,
      topUsers,
      recentActivities,
      systemAlerts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'خطا در بارگذاری داشبورد');
    res.render('dashboard', {
      title: 'داشبورد',
      discordStats: { servers: 0, users: 0, activeUsers: 0, commands: 0 },
      economyStats: { totalCoins: 0, totalCrystals: 0, bankBalance: 0, shopItems: 0 },
      recentTransactions: [],
      topUsers: [],
      recentActivities: [],
      systemAlerts: []
    });
  }
};

/**
 * دریافت آمار کلی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getStats = async (req, res) => {
  try {
    // دریافت آمار دیسکورد
    const discordStats = await getDiscordStats();
    
    // دریافت آمار اقتصادی
    const economyStats = await getEconomyStats();
    
    res.json({
      success: true,
      data: {
        discord: discordStats,
        economy: economyStats
      }
    });
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت آمار'
    });
  }
};

/**
 * دریافت داده‌های نمودار فعالیت کاربران
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getUserActivityChart = async (req, res) => {
  try {
    // در یک محیط واقعی، این داده‌ها از پایگاه داده دریافت می‌شوند
    const data = {
      labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
      datasets: [{
        label: 'کاربران فعال',
        data: [65, 78, 90, 82, 96, 110]
      }]
    };
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('User activity chart error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت داده‌های نمودار'
    });
  }
};

/**
 * دریافت داده‌های نمودار اقتصادی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getEconomyChart = async (req, res) => {
  try {
    // در یک محیط واقعی، این داده‌ها از پایگاه داده دریافت می‌شوند
    const data = {
      labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
      datasets: [{
        label: 'سکه‌های وارد شده',
        data: [12000, 19000, 15000, 21000, 25000, 18000]
      }, {
        label: 'سکه‌های خارج شده',
        data: [8000, 14000, 11000, 16000, 19000, 15000]
      }]
    };
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Economy chart error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت داده‌های نمودار'
    });
  }
};

/**
 * دریافت داده‌های نمودار بازی‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const getGamesChart = async (req, res) => {
  try {
    // در یک محیط واقعی، این داده‌ها از پایگاه داده دریافت می‌شوند
    const data = {
      labels: ['قمار', 'رولت', 'اسلات', 'حکم', 'بلک جک', 'سایر'],
      data: [35, 20, 15, 10, 15, 5]
    };
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Games chart error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت داده‌های نمودار'
    });
  }
};

export const dashboardController = {
  showDashboard,
  getStats,
  getUserActivityChart,
  getEconomyChart,
  getGamesChart
};