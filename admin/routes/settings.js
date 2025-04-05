/**
 * مسیرهای مدیریت تنظیمات
 * 
 * این فایل شامل مسیرهای مربوط به مدیریت تنظیمات کلی سیستم است.
 */

import express from 'express';
import { settingsController } from '../controllers/settingsController.js';

const router = express.Router();

// صفحه اصلی تنظیمات
router.get('/', settingsController.showDashboard);

// تنظیمات عمومی
router.get('/general', settingsController.showGeneralSettings);
router.post('/general', settingsController.updateGeneralSettings);

// تنظیمات دیسکورد
router.get('/discord', settingsController.showDiscordSettings);
router.post('/discord', settingsController.updateDiscordSettings);

// تنظیمات ربات
router.get('/bot', settingsController.showBotSettings);
router.post('/bot', settingsController.updateBotSettings);

// تنظیمات زبان و ترجمه
router.get('/localization', settingsController.showLocalizationSettings);
router.post('/localization', settingsController.updateLocalizationSettings);
router.get('/localization/export', settingsController.exportTranslations);
router.post('/localization/import', settingsController.importTranslations);

// تنظیمات پایگاه داده
router.get('/database', settingsController.showDatabaseSettings);
router.post('/database', settingsController.updateDatabaseSettings);
router.post('/database/backup', settingsController.createDatabaseBackup);
router.post('/database/restore', settingsController.restoreDatabaseBackup);

// تنظیمات امنیتی
router.get('/security', settingsController.showSecuritySettings);
router.post('/security', settingsController.updateSecuritySettings);
router.post('/security/reset-tokens', settingsController.resetSecurityTokens);

// تنظیمات اعلان‌ها
router.get('/notifications', settingsController.showNotificationSettings);
router.post('/notifications', settingsController.updateNotificationSettings);
router.post('/notifications/test', settingsController.testNotification);

// مدیریت کاربران ادمین
router.get('/admins', settingsController.showAdminUsers);
router.post('/admins/new', settingsController.createAdminUser);
router.get('/admins/:id', settingsController.showAdminUser);
router.post('/admins/:id', settingsController.updateAdminUser);
router.post('/admins/:id/delete', settingsController.deleteAdminUser);

// مدیریت نقش‌های ادمین
router.get('/roles', settingsController.showAdminRoles);
router.post('/roles/new', settingsController.createAdminRole);
router.get('/roles/:id', settingsController.showAdminRole);
router.post('/roles/:id', settingsController.updateAdminRole);
router.post('/roles/:id/delete', settingsController.deleteAdminRole);

// ماژول‌ها
router.get('/modules', settingsController.showModules);
router.post('/modules/:id/toggle', settingsController.toggleModule);
router.post('/modules/:id/settings', settingsController.updateModuleSettings);

// پشتیبانی
router.get('/support', settingsController.showSupportPage);
router.post('/support/contact', settingsController.sendSupportMessage);

// تنظیمات نگهداری
router.get('/maintenance', settingsController.showMaintenanceSettings);
router.post('/maintenance/toggle', settingsController.toggleMaintenanceMode);
router.post('/maintenance/cache/clear', settingsController.clearCache);
router.post('/maintenance/restart', settingsController.restartServices);

export default router;