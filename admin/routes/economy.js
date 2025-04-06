/**
 * مسیرهای بخش اقتصادی
 */
import express from 'express';
import * as economyController from '../controllers/economyController.js';

const router = express.Router();

// مسیر اصلی - داشبورد اقتصادی
router.get('/', economyController.showEconomyDashboard);

// مسیرهای API
router.get('/api/realtime-stats', economyController.getRealtimeStats);

// مسیرهای تراکنش‌ها
router.get('/transactions', economyController.listTransactions);
router.get('/transactions/export', economyController.exportTransactions);
router.get('/transactions/:id', economyController.viewTransaction);

// مسیرهای بازار سهام
router.get('/stocks', economyController.listStocks);
router.get('/stocks/create', economyController.createStockForm);
router.post('/stocks/create', economyController.saveNewStock);
router.get('/stocks/:id', economyController.viewStock);
router.get('/stocks/:id/edit', economyController.editStockForm);
router.post('/stocks/:id/edit', economyController.updateStock);
router.get('/stocks/:id/activate', economyController.toggleStockStatus);
router.get('/stocks/:id/deactivate', economyController.toggleStockStatus);
router.get('/stocks/:id/trades', economyController.stockTrades);

// مسیرهای بانک‌ها
router.get('/banks', economyController.showBanks);
router.get('/banks/create', economyController.createBankForm);
router.post('/banks/create', economyController.saveNewBank);
router.get('/banks/:id', economyController.viewBank);
router.get('/banks/:id/edit', economyController.editBankForm);
router.post('/banks/:id/edit', economyController.updateBank);
router.get('/banks/:id/activate', economyController.toggleBankStatus);
router.get('/banks/:id/deactivate', economyController.toggleBankStatus);

// مسیرهای فروشگاه‌ها
router.get('/shops', economyController.listShops);

// مسیرهای آیتم‌ها
router.get('/items', economyController.listItems);

// مسیرهای تنظیمات اقتصادی
router.get('/settings', economyController.showEconomySettings);
router.post('/settings', economyController.saveEconomySettings);

export default router;
