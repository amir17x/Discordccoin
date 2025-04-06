/**
 * مسیرهای مدیریت سرورها
 * 
 * این فایل شامل مسیرهای مربوط به مدیریت سرورهای دیسکورد است.
 */

import express from 'express';
import * as serversController from '../controllers/serversController.js';

const router = express.Router();

// صفحه اصلی مدیریت سرورها
router.get('/', serversController.showDashboard);

// مدیریت سرورها
router.get('/list', serversController.showServersList);
router.get('/:id', serversController.showServerDetails);
router.post('/:id/update', serversController.updateServerSettings);
router.post('/:id/toggle', serversController.toggleServerEnabled);

// مدیریت ویژگی‌های سرور
router.get('/:id/features', serversController.showServerFeatures);
router.post('/:id/features', serversController.updateServerFeatures);

// مدیریت کانال‌ها
router.get('/:id/channels', serversController.showServerChannels);
router.post('/:id/channels/:channelId/update', serversController.updateChannelSettings);

// مدیریت رول‌ها
router.get('/:id/roles', serversController.showServerRoles);
router.post('/:id/roles/:roleId/update', serversController.updateRoleSettings);

// مدیریت کاربران سرور
router.get('/:id/members', serversController.showServerMembers);
router.get('/:id/members/:userId', serversController.showMemberDetails);
router.post('/:id/members/:userId/update', serversController.updateMemberSettings);

// مدیریت کامندها در سرور
router.get('/:id/commands', serversController.showServerCommands);
router.post('/:id/commands/update', serversController.updateServerCommands);

// مدیریت لاگ‌ها
router.get('/:id/logs', serversController.showServerLogs);
router.post('/:id/logs/settings', serversController.updateLogSettings);
router.post('/:id/logs/clear', serversController.clearServerLogs);

// آمار سرور
router.get('/:id/stats', serversController.showServerStats);
router.get('/:id/stats/export', serversController.exportServerStats);

// تنظیمات سرور
router.get('/:id/settings', serversController.showServerSettings);
router.post('/:id/settings', serversController.updateAdvancedSettings);

export default router;