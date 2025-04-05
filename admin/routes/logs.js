/**
 * مسیرهای مدیریت لاگ‌ها
 * 
 * این فایل شامل مسیرهای مربوط به مدیریت لاگ‌ها و گزارش‌های سیستم است.
 */

import express from 'express';
import { logsController } from '../controllers/logsController.js';

const router = express.Router();

// داشبورد لاگ‌ها
router.get('/', logsController.showDashboard);

// مدیریت لاگ‌های سیستم
router.get('/system', logsController.showSystemLogs);
router.post('/system/filter', logsController.filterSystemLogs);
router.get('/system/export', logsController.exportSystemLogs);
router.post('/system/clear', logsController.clearSystemLogs);

// مدیریت لاگ‌های کاربران
router.get('/users', logsController.showUserLogs);
router.post('/users/filter', logsController.filterUserLogs);
router.get('/users/export', logsController.exportUserLogs);

// مدیریت لاگ‌های تراکنش‌ها
router.get('/transactions', logsController.showTransactionLogs);
router.post('/transactions/filter', logsController.filterTransactionLogs);
router.get('/transactions/export', logsController.exportTransactionLogs);

// مدیریت لاگ‌های بازی‌ها
router.get('/games', logsController.showGameLogs);
router.post('/games/filter', logsController.filterGameLogs);
router.get('/games/export', logsController.exportGameLogs);

// مدیریت لاگ‌های ادمین
router.get('/admin', logsController.showAdminLogs);
router.post('/admin/filter', logsController.filterAdminLogs);
router.get('/admin/export', logsController.exportAdminLogs);

// مدیریت لاگ‌های هوش مصنوعی
router.get('/ai', logsController.showAILogs);
router.post('/ai/filter', logsController.filterAILogs);
router.get('/ai/export', logsController.exportAILogs);

// مدیریت لاگ‌های خطا
router.get('/errors', logsController.showErrorLogs);
router.post('/errors/filter', logsController.filterErrorLogs);
router.get('/errors/export', logsController.exportErrorLogs);
router.post('/errors/clear', logsController.clearErrorLogs);

// تنظیمات لاگ
router.get('/settings', logsController.showLogSettings);
router.post('/settings', logsController.updateLogSettings);

export default router;