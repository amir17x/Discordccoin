/**
 * مسیرهای مدیریت بازی‌ها
 * 
 * این فایل شامل مسیرهای مربوط به مدیریت بازی‌ها و تنظیمات آن‌ها است.
 */

import express from 'express';
import { gamesController } from '../controllers/gamesController.js';

const router = express.Router();

// صفحه اصلی مدیریت بازی‌ها
router.get('/', gamesController.showDashboard);

// مدیریت بازی‌های قمار
router.get('/gambling', gamesController.showGamblingGames);
router.get('/gambling/:id', gamesController.showGamblingGame);
router.post('/gambling/:id', gamesController.updateGamblingGame);
router.post('/gambling/:id/toggle', gamesController.toggleGamblingGame);

// مدیریت بازی‌های کارتی
router.get('/card-games', gamesController.showCardGames);
router.get('/card-games/:id', gamesController.showCardGame);
router.post('/card-games/:id', gamesController.updateCardGame);
router.post('/card-games/:id/toggle', gamesController.toggleCardGame);

// مدیریت بازی رولت
router.get('/roulette', gamesController.showRouletteSettings);
router.post('/roulette', gamesController.updateRouletteSettings);

// مدیریت بازی اسلات
router.get('/slots', gamesController.showSlotsSettings);
router.post('/slots', gamesController.updateSlotsSettings);
router.get('/slots/symbols', gamesController.showSlotSymbols);
router.post('/slots/symbols/new', gamesController.createSlotSymbol);
router.post('/slots/symbols/:id', gamesController.updateSlotSymbol);
router.post('/slots/symbols/:id/delete', gamesController.deleteSlotSymbol);

// مدیریت بازی بلک جک
router.get('/blackjack', gamesController.showBlackjackSettings);
router.post('/blackjack', gamesController.updateBlackjackSettings);

// مدیریت بازی حکم
router.get('/hokm', gamesController.showHokmSettings);
router.post('/hokm', gamesController.updateHokmSettings);

// مدیریت بازی‌های گروهی
router.get('/group-games', gamesController.showGroupGames);
router.get('/group-games/:id', gamesController.showGroupGame);
router.post('/group-games/:id', gamesController.updateGroupGame);
router.post('/group-games/:id/toggle', gamesController.toggleGroupGame);

// مدیریت جایزه‌ها و پاداش‌ها
router.get('/rewards', gamesController.showRewards);
router.get('/rewards/new', gamesController.showCreateReward);
router.post('/rewards/new', gamesController.createReward);
router.get('/rewards/:id', gamesController.showReward);
router.post('/rewards/:id', gamesController.updateReward);
router.post('/rewards/:id/delete', gamesController.deleteReward);

// دستی‌کاری و تقلب (فقط برای آزمایش)
router.get('/cheats', gamesController.showCheats);
router.post('/cheats/win-rate', gamesController.setCheatsWinRate);
router.post('/cheats/reset', gamesController.resetCheats);

// آمار بازی‌ها
router.get('/stats', gamesController.showStats);
router.get('/stats/:gameId', gamesController.showGameStats);
router.get('/stats/user/:userId', gamesController.showUserStats);
router.get('/stats/exports', gamesController.exportStats);

// تنظیمات بازی‌ها
router.get('/settings', gamesController.showSettings);
router.post('/settings', gamesController.updateSettings);

export default router;