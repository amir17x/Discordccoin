/**
 * مسیرهای اصلی پنل ادمین
 */

import express from 'express';
const router = express.Router();

// میدلورها
import { requireLogin, requireAdmin } from '../middleware/auth.js';

// کنترلرها 
// ممکن است در مراحل آینده این imports را بازبینی کنیم چون فعلاً همه کنترلرها را اضافه نکرده‌ایم
import * as authController from '../controllers/authController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as usersController from '../controllers/usersController.js';

// تعریف کنترلرهای مجازی تا زمانی که پیاده‌سازی شوند
const dummyController = {
  showStats: (req, res) => res.render('coming-soon', { title: 'آمار' }),
  showEconomyStats: (req, res) => res.render('coming-soon', { title: 'آمار اقتصادی' }),
  showGamesStats: (req, res) => res.render('coming-soon', { title: 'آمار بازی‌ها' }),
  showAIStats: (req, res) => res.render('coming-soon', { title: 'آمار هوش مصنوعی' }),
  exportStats: (req, res) => res.render('coming-soon', { title: 'خروجی آمار' }),
  showSettings: (req, res) => res.render('coming-soon', { title: 'تنظیمات' }),
  updateGeneralSettings: (req, res) => res.redirect('/admin/settings'),
  updateEconomySettings: (req, res) => res.redirect('/admin/settings'),
  updateGamesSettings: (req, res) => res.redirect('/admin/settings'),
  updateAISettings: (req, res) => res.redirect('/admin/settings'),
  showGamesList: (req, res) => res.render('coming-soon', { title: 'مدیریت بازی‌ها' }),
  showGameDetails: (req, res) => res.render('coming-soon', { title: 'جزئیات بازی' }),
  toggleGame: (req, res) => res.redirect('/admin/games'),
  updateGameSettings: (req, res) => res.redirect('/admin/games'),
  showShopItems: (req, res) => res.render('coming-soon', { title: 'مدیریت فروشگاه' }),
  showAddItem: (req, res) => res.render('coming-soon', { title: 'افزودن آیتم' }),
  processAddItem: (req, res) => res.redirect('/admin/shop'),
  showEditItem: (req, res) => res.render('coming-soon', { title: 'ویرایش آیتم' }),
  processEditItem: (req, res) => res.redirect('/admin/shop'),
  deleteItem: (req, res) => res.redirect('/admin/shop'),
  showEventsList: (req, res) => res.render('coming-soon', { title: 'مدیریت رویدادها' }),
  showAddEvent: (req, res) => res.render('coming-soon', { title: 'افزودن رویداد' }),
  processAddEvent: (req, res) => res.redirect('/admin/events'),
  showEditEvent: (req, res) => res.render('coming-soon', { title: 'ویرایش رویداد' }),
  processEditEvent: (req, res) => res.redirect('/admin/events'),
  toggleEvent: (req, res) => res.redirect('/admin/events'),
  deleteEvent: (req, res) => res.redirect('/admin/events'),
  showLogs: (req, res) => res.render('coming-soon', { title: 'لاگ‌ها' }),
  showTransactionLogs: (req, res) => res.render('coming-soon', { title: 'لاگ تراکنش‌ها' }),
  showGameLogs: (req, res) => res.render('coming-soon', { title: 'لاگ بازی‌ها' }),
  showAdminLogs: (req, res) => res.render('coming-soon', { title: 'لاگ ادمین' }),
  showErrorLogs: (req, res) => res.render('coming-soon', { title: 'لاگ خطاها' }),
  exportLogs: (req, res) => res.render('coming-soon', { title: 'خروجی لاگ‌ها' }),
  showBackupPage: (req, res) => res.render('coming-soon', { title: 'پشتیبان‌گیری' }),
  createBackup: (req, res) => res.redirect('/admin/backup'),
  showRestoreConfirmation: (req, res) => res.render('coming-soon', { title: 'بازیابی پشتیبان' }),
  restoreBackup: (req, res) => res.redirect('/admin/backup'),
  deleteBackup: (req, res) => res.redirect('/admin/backup')
};

// برای استفاده موقت تا زمانی که همه کنترلرها پیاده‌سازی شوند
const statsController = dummyController;
const settingsController = dummyController;
const gamesController = dummyController;
const shopController = dummyController;
const eventsController = dummyController;
const logsController = dummyController;
const backupController = dummyController;

/**
 * مسیرهای احراز هویت
 */
router.get('/login', authController.showLoginPage);
router.post('/login', authController.processLogin);
router.get('/logout', authController.logout);

/**
 * مسیرهای داشبورد
 */
router.get('/', requireLogin, dashboardController.redirectToDashboard);
router.get('/dashboard', requireLogin, dashboardController.showDashboard);

/**
 * مسیرهای مدیریت کاربران
 */
router.get('/users', requireLogin, usersController.showUsersList);
router.get('/users/:userId', requireLogin, usersController.showUserDetails);
router.get('/users/:userId/edit', requireLogin, usersController.showUserEdit);
router.post('/users/:userId/edit', requireLogin, usersController.processUserEdit);
router.post('/users/add-coins', requireLogin, usersController.addCoins);
router.post('/users/remove-coins', requireLogin, usersController.removeCoins);
router.post('/users/add-item', requireLogin, usersController.addItem);
router.get('/users/:userId/ban', requireLogin, usersController.banUser);
router.get('/users/:userId/unban', requireLogin, usersController.unbanUser);
router.post('/users/reset', requireLogin, usersController.resetUser);
router.get('/users/export', requireLogin, usersController.exportUsers);

/**
 * مسیرهای آمار و گزارشات
 */
router.get('/stats', requireLogin, statsController.showStats);
router.get('/stats/economy', requireLogin, statsController.showEconomyStats);
router.get('/stats/games', requireLogin, statsController.showGamesStats);
router.get('/stats/ai', requireLogin, statsController.showAIStats);
router.get('/stats/export/:type', requireLogin, statsController.exportStats);

/**
 * مسیرهای تنظیمات
 */
router.get('/settings', requireAdmin, settingsController.showSettings);
router.post('/settings/general', requireAdmin, settingsController.updateGeneralSettings);
router.post('/settings/economy', requireAdmin, settingsController.updateEconomySettings);
router.post('/settings/games', requireAdmin, settingsController.updateGamesSettings);
router.post('/settings/ai', requireAdmin, settingsController.updateAISettings);

/**
 * مسیرهای مدیریت بازی‌ها
 */
router.get('/games', requireLogin, gamesController.showGamesList);
router.get('/games/:gameId', requireLogin, gamesController.showGameDetails);
router.post('/games/:gameId/toggle', requireAdmin, gamesController.toggleGame);
router.post('/games/:gameId/settings', requireAdmin, gamesController.updateGameSettings);

/**
 * مسیرهای مدیریت فروشگاه
 */
router.get('/shop', requireLogin, shopController.showShopItems);
router.get('/shop/add', requireAdmin, shopController.showAddItem);
router.post('/shop/add', requireAdmin, shopController.processAddItem);
router.get('/shop/:itemId/edit', requireAdmin, shopController.showEditItem);
router.post('/shop/:itemId/edit', requireAdmin, shopController.processEditItem);
router.post('/shop/:itemId/delete', requireAdmin, shopController.deleteItem);

/**
 * مسیرهای مدیریت رویدادها
 */
router.get('/events', requireLogin, eventsController.showEventsList);
router.get('/events/add', requireAdmin, eventsController.showAddEvent);
router.post('/events/add', requireAdmin, eventsController.processAddEvent);
router.get('/events/:eventId/edit', requireAdmin, eventsController.showEditEvent);
router.post('/events/:eventId/edit', requireAdmin, eventsController.processEditEvent);
router.post('/events/:eventId/toggle', requireAdmin, eventsController.toggleEvent);
router.post('/events/:eventId/delete', requireAdmin, eventsController.deleteEvent);

/**
 * مسیرهای لاگ‌ها
 */
router.get('/logs', requireAdmin, logsController.showLogs);
router.get('/logs/transactions', requireAdmin, logsController.showTransactionLogs);
router.get('/logs/games', requireAdmin, logsController.showGameLogs);
router.get('/logs/admin', requireAdmin, logsController.showAdminLogs);
router.get('/logs/errors', requireAdmin, logsController.showErrorLogs);
router.get('/logs/export/:type', requireAdmin, logsController.exportLogs);

/**
 * مسیرهای پشتیبان‌گیری
 */
router.get('/backup', requireAdmin, backupController.showBackupPage);
router.post('/backup/create', requireAdmin, backupController.createBackup);
router.get('/backup/:backupId/restore', requireAdmin, backupController.showRestoreConfirmation);
router.post('/backup/:backupId/restore', requireAdmin, backupController.restoreBackup);
router.post('/backup/:backupId/delete', requireAdmin, backupController.deleteBackup);

/**
 * مسیر 404 برای آدرس‌های نامعتبر ادمین
 */
router.use((_req, res) => {
  res.status(404).render('404');
});

export default router;