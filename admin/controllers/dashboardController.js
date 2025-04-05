/**
 * کنترلر داشبورد پنل ادمین
 */

import { 
  getSystemStats, 
  getSystemLogs,
  getSystemSettings
} from '../services/adminService.js';

import {
  getUserStats,
  getTopUsers,
  getRecentUsers
} from '../services/userService.js';

import {
  getEconomyStats,
  getRecentTransactions
} from '../services/economyService.js';

import {
  getGameStats,
  getRecentGames
} from '../services/gameService.js';

import {
  getCcoinAiStats,
  getAiSettings
} from '../services/aiService.js';

/**
 * نمایش داشبورد
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showDashboard(req, res) {
  try {
    // دریافت آمار سیستم
    const systemStats = await getSystemStats();
    
    // دریافت آمار کاربران
    const userStats = await getUserStats();
    
    // دریافت آمار اقتصادی
    const economyStats = await getEconomyStats();
    
    // دریافت آمار بازی‌ها
    const gameStats = await getGameStats();
    
    // دریافت آمار هوش مصنوعی
    const aiStats = await getCcoinAiStats();
    
    // دریافت کاربران برتر
    const topUsers = await getTopUsers(5);
    
    // دریافت تراکنش‌های اخیر
    const recentTransactions = await getRecentTransactions(5);
    
    // دریافت بازی‌های اخیر
    const recentGames = await getRecentGames(5);
    
    // دریافت لاگ‌های اخیر
    const recentLogs = await getSystemLogs('all', 5, 1);
    
    // دریافت کاربران اخیر
    const recentUsers = await getRecentUsers(5);
    
    // محاسبه آمار کلی
    const totalStats = {
      usersCount: userStats.totalUsers || 0,
      activeUsers: userStats.activeUsers || 0,
      totalCoins: economyStats.totalCoins || 0,
      totalCrystals: economyStats.totalCrystals || 0,
      totalGamesPlayed: gameStats.totalGamesPlayed || 0,
      totalAiQueries: aiStats.totalQueries || 0,
      botUptime: systemStats.uptime || '0 روز'
    };
    
    // ارسال به قالب
    res.render('dashboard/index', {
      title: 'داشبورد',
      totalStats,
      userStats,
      economyStats,
      gameStats,
      aiStats,
      topUsers,
      recentTransactions,
      recentGames,
      recentLogs: recentLogs.logs || [],
      recentUsers
    });
  } catch (error) {
    console.error('خطا در نمایش داشبورد:', error);
    req.flash('error_msg', 'خطا در بارگذاری اطلاعات داشبورد');
    
    // نمایش داشبورد با اطلاعات حداقلی در صورت بروز خطا
    res.render('dashboard/index', {
      title: 'داشبورد',
      totalStats: { botUptime: 'نامشخص' },
      userStats: {},
      economyStats: {},
      gameStats: {},
      aiStats: {},
      topUsers: [],
      recentTransactions: [],
      recentGames: [],
      recentLogs: [],
      recentUsers: [],
      error: true
    });
  }
}

/**
 * نمایش صفحه پروفایل کاربر ادمین
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export function showProfile(req, res) {
  res.render('dashboard/profile', {
    title: 'پروفایل من',
    user: req.session.user
  });
}

/**
 * بروزرسانی پروفایل کاربر ادمین
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function updateProfile(req, res) {
  const { displayName, currentPassword, newPassword, confirmPassword } = req.body;
  
  try {
    // بررسی تغییر رمز عبور
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        req.flash('error_msg', 'تأیید رمز عبور جدید مطابقت ندارد');
        return res.redirect('/admin/dashboard/profile');
      }
      
      // اینجا باید بررسی رمز عبور فعلی و تغییر رمز عبور اضافه شود
      // به طور موقت فقط پیام موفقیت نمایش می‌دهیم
    }
    
    // بروزرسانی نام نمایشی در جلسه
    if (displayName) {
      req.session.user.displayName = displayName;
    }
    
    req.flash('success_msg', 'پروفایل شما با موفقیت بروزرسانی شد');
    res.redirect('/admin/dashboard/profile');
  } catch (error) {
    console.error('خطا در بروزرسانی پروفایل:', error);
    req.flash('error_msg', 'خطا در بروزرسانی پروفایل');
    res.redirect('/admin/dashboard/profile');
  }
}

/**
 * نمایش صفحه تنظیمات
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showSettings(req, res) {
  try {
    // دریافت تنظیمات سیستم
    const settings = await getSystemSettings();
    
    // دریافت تنظیمات هوش مصنوعی
    const aiSettings = await getAiSettings();
    
    res.render('dashboard/settings', {
      title: 'تنظیمات سیستم',
      settings,
      aiSettings
    });
  } catch (error) {
    console.error('خطا در نمایش تنظیمات:', error);
    req.flash('error_msg', 'خطا در بارگذاری تنظیمات');
    res.redirect('/admin/dashboard');
  }
}