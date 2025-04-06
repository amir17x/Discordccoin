/**
 * مسیرهای مربوط به قالب Fluent UI
 */

import express from 'express';
import * as fluentController from '../controllers/fluentController.js';
import { checkAuth, redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// مسیرهای عمومی
router.get('/login', redirectIfAuthenticated, fluentController.showLogin);
router.post('/login', redirectIfAuthenticated, fluentController.processLogin);
router.get('/logout', fluentController.logout);

// مسیرهای نیازمند احراز هویت
router.get('/dashboard', checkAuth, fluentController.showDashboard);
router.get('/profile', checkAuth, fluentController.showProfile);

// مسیرهای منوی سایدبار
router.get('/servers', checkAuth, fluentController.showServers);
router.get('/users', checkAuth, fluentController.showUsers);
router.get('/economy', checkAuth, fluentController.showEconomy);
router.get('/shop', checkAuth, fluentController.showShop);
router.get('/stock-market', checkAuth, fluentController.showStockMarket);
router.get('/lottery', checkAuth, fluentController.showLottery);
router.get('/bank', checkAuth, fluentController.showBank);
router.get('/logs', checkAuth, fluentController.showLogs);
router.get('/settings', checkAuth, fluentController.showSettings);

// مسیرهای جدید مطابق با پنل ادمین دیسکورد
router.get('/quests', checkAuth, fluentController.showQuests);
router.get('/clans', checkAuth, fluentController.showClans);
router.get('/stats', checkAuth, fluentController.showStats);
router.get('/broadcast', checkAuth, fluentController.showBroadcast);
router.get('/backup', checkAuth, fluentController.showBackup);
router.get('/ai-settings', checkAuth, fluentController.showAISettings);

// API های عمومی
router.get('/api/refresh-status', checkAuth, fluentController.refreshStatus);

// API های بازار سهام
router.get('/api/stocks/:symbol', checkAuth, fluentController.getStockBySymbol);
router.post('/api/stocks/:symbol/force-update', checkAuth, fluentController.forceUpdateStock);
router.post('/api/stocks', checkAuth, fluentController.createOrUpdateStock);
router.put('/api/stocks', checkAuth, fluentController.createOrUpdateStock);
router.post('/api/market-settings', checkAuth, fluentController.updateMarketSettings);

// API های جدید برای همگام‌سازی با دیسکورد
router.post('/api/economy/add-coins', checkAuth, fluentController.addCoins);
router.post('/api/economy/remove-coins', checkAuth, fluentController.removeCoins);
router.post('/api/items/add', checkAuth, fluentController.addItem);
router.post('/api/items/edit/:id', checkAuth, fluentController.editItem);
router.post('/api/items/delete/:id', checkAuth, fluentController.deleteItem);
router.post('/api/broadcast/send', checkAuth, fluentController.sendBroadcast);
router.post('/api/settings/update', checkAuth, fluentController.updateSettings);
router.post('/api/backup/create', checkAuth, fluentController.createBackup);
router.post('/api/backup/restore', checkAuth, fluentController.restoreBackup);
router.post('/api/quests/add', checkAuth, fluentController.addQuest);
router.post('/api/quests/edit/:id', checkAuth, fluentController.editQuest);
router.post('/api/quests/delete/:id', checkAuth, fluentController.deleteQuest);
router.post('/api/clans/add', checkAuth, fluentController.addClan);
router.post('/api/clans/edit/:id', checkAuth, fluentController.editClan);
router.post('/api/clans/delete/:id', checkAuth, fluentController.deleteClan);
router.post('/api/ai-settings/update', checkAuth, fluentController.updateAISettings);

export default router;
