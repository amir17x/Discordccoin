/**
 * مسیرهای مدیریت رویدادها
 * 
 * این فایل شامل مسیرهای مربوط به مدیریت رویدادها و قرعه‌کشی‌ها است.
 */

import express from 'express';
import { eventsController } from '../controllers/eventsController.js';

const router = express.Router();

// صفحه اصلی مدیریت رویدادها
router.get('/', eventsController.showDashboard);

// مدیریت قرعه‌کشی‌ها
router.get('/giveaways', eventsController.showGiveaways);
router.get('/giveaways/new', eventsController.showCreateGiveaway);
router.post('/giveaways/new', eventsController.createGiveaway);
router.get('/giveaways/:id', eventsController.showGiveaway);
router.post('/giveaways/:id', eventsController.updateGiveaway);
router.post('/giveaways/:id/delete', eventsController.deleteGiveaway);
router.post('/giveaways/:id/end', eventsController.endGiveaway);
router.post('/giveaways/:id/reroll', eventsController.rerollGiveaway);

// مدیریت رویدادهای زمانی
router.get('/time-events', eventsController.showTimeEvents);
router.get('/time-events/new', eventsController.showCreateTimeEvent);
router.post('/time-events/new', eventsController.createTimeEvent);
router.get('/time-events/:id', eventsController.showTimeEvent);
router.post('/time-events/:id', eventsController.updateTimeEvent);
router.post('/time-events/:id/delete', eventsController.deleteTimeEvent);
router.post('/time-events/:id/toggle', eventsController.toggleTimeEvent);

// مدیریت رویدادهای فصلی
router.get('/seasonal', eventsController.showSeasonalEvents);
router.get('/seasonal/new', eventsController.showCreateSeasonalEvent);
router.post('/seasonal/new', eventsController.createSeasonalEvent);
router.get('/seasonal/:id', eventsController.showSeasonalEvent);
router.post('/seasonal/:id', eventsController.updateSeasonalEvent);
router.post('/seasonal/:id/delete', eventsController.deleteSeasonalEvent);
router.post('/seasonal/:id/toggle', eventsController.toggleSeasonalEvent);

// مدیریت چالش‌ها
router.get('/challenges', eventsController.showChallenges);
router.get('/challenges/new', eventsController.showCreateChallenge);
router.post('/challenges/new', eventsController.createChallenge);
router.get('/challenges/:id', eventsController.showChallenge);
router.post('/challenges/:id', eventsController.updateChallenge);
router.post('/challenges/:id/delete', eventsController.deleteChallenge);
router.post('/challenges/:id/toggle', eventsController.toggleChallenge);

// مدیریت جوایز
router.get('/rewards', eventsController.showRewards);
router.get('/rewards/new', eventsController.showCreateReward);
router.post('/rewards/new', eventsController.createReward);
router.get('/rewards/:id', eventsController.showReward);
router.post('/rewards/:id', eventsController.updateReward);
router.post('/rewards/:id/delete', eventsController.deleteReward);

// مدیریت کدهای هدیه
router.get('/gift-codes', eventsController.showGiftCodes);
router.get('/gift-codes/new', eventsController.showCreateGiftCode);
router.post('/gift-codes/new', eventsController.createGiftCode);
router.get('/gift-codes/:id', eventsController.showGiftCode);
router.post('/gift-codes/:id', eventsController.updateGiftCode);
router.post('/gift-codes/:id/delete', eventsController.deleteGiftCode);
router.post('/gift-codes/bulk', eventsController.createBulkGiftCodes);
router.get('/gift-codes/export', eventsController.exportGiftCodes);

// مدیریت اعلانات
router.get('/announcements', eventsController.showAnnouncements);
router.get('/announcements/new', eventsController.showCreateAnnouncement);
router.post('/announcements/new', eventsController.createAnnouncement);
router.get('/announcements/:id', eventsController.showAnnouncement);
router.post('/announcements/:id', eventsController.updateAnnouncement);
router.post('/announcements/:id/delete', eventsController.deleteAnnouncement);
router.post('/announcements/:id/send', eventsController.sendAnnouncement);

// تنظیمات رویدادها
router.get('/settings', eventsController.showSettings);
router.post('/settings', eventsController.updateSettings);

export default router;