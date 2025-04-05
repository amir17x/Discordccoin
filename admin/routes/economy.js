/**
 * مسیرهای مدیریت اقتصاد
 * 
 * این فایل شامل مسیرهای مربوط به مدیریت سیستم اقتصادی و تنظیمات آن است.
 */

import express from 'express';
import { economyController } from '../controllers/economyController.js';

const router = express.Router();

// صفحه اصلی مدیریت اقتصاد
router.get('/', economyController.showDashboard);

// مدیریت سکه‌ها
router.get('/coins', economyController.showCoinsManagement);
router.post('/coins/add', economyController.addCoins);
router.post('/coins/deduct', economyController.deductCoins);
router.post('/coins/reset', economyController.resetCoins);

// مدیریت کریستال‌ها
router.get('/crystals', economyController.showCrystalsManagement);
router.post('/crystals/add', economyController.addCrystals);
router.post('/crystals/deduct', economyController.deductCrystals);
router.post('/crystals/reset', economyController.resetCrystals);

// مدیریت بانک‌ها
router.get('/banks', economyController.showBanks);
router.get('/banks/new', economyController.showCreateBank);
router.post('/banks/new', economyController.createBank);
router.get('/banks/:id', economyController.showBank);
router.post('/banks/:id', economyController.updateBank);
router.post('/banks/:id/delete', economyController.deleteBank);

// مدیریت تراکنش‌ها
router.get('/transactions', economyController.showTransactions);
router.get('/transactions/export', economyController.exportTransactions);
router.get('/transactions/:id', economyController.showTransaction);

// مدیریت فروشگاه‌ها
router.get('/shops', economyController.showShops);
router.get('/shops/new', economyController.showCreateShop);
router.post('/shops/new', economyController.createShop);
router.get('/shops/:id', economyController.showShop);
router.post('/shops/:id', economyController.updateShop);
router.post('/shops/:id/delete', economyController.deleteShop);

// مدیریت آیتم‌ها
router.get('/items', economyController.showItems);
router.get('/items/new', economyController.showCreateItem);
router.post('/items/new', economyController.createItem);
router.get('/items/:id', economyController.showItem);
router.post('/items/:id', economyController.updateItem);
router.post('/items/:id/delete', economyController.deleteItem);

// مدیریت بازار سهام
router.get('/stocks', economyController.showStocks);
router.get('/stocks/new', economyController.showCreateStock);
router.post('/stocks/new', economyController.createStock);
router.get('/stocks/:id', economyController.showStock);
router.post('/stocks/:id', economyController.updateStock);
router.post('/stocks/:id/delete', economyController.deleteStock);
router.post('/stocks/:id/price', economyController.updateStockPrice);
router.post('/stocks/:id/simulate', economyController.simulateStockMarket);

// تنظیمات اقتصادی
router.get('/settings', economyController.showSettings);
router.post('/settings', economyController.updateSettings);

// آمار و گزارشات
router.get('/reports', economyController.showReports);
router.get('/reports/daily', economyController.getDailyReport);
router.get('/reports/weekly', economyController.getWeeklyReport);
router.get('/reports/monthly', economyController.getMonthlyReport);
router.get('/reports/custom', economyController.getCustomReport);

export default router;