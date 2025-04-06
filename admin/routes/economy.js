/**
 * مسیرهای مدیریت اقتصاد پنل ادمین
 */
import express from 'express';
import { authMiddleware, checkPermissions } from '../middleware/auth.js';
import * as economyController from '../controllers/economyController.js';

const router = express.Router();

// اعمال میدلویر احراز هویت برای تمام مسیرها
router.use(authMiddleware);
router.use(checkPermissions('economy'));

// نمایش داشبورد اقتصادی
router.get('/', economyController.showEconomyDashboard);

// مدیریت تراکنش‌ها
router.get('/transactions', economyController.showTransactions);

// مدیریت بازار سهام
router.get('/stocks', economyController.showStocks);

// مدیریت بانک‌ها
router.get('/banks', economyController.showBanks);

// مدیریت فروشگاه‌ها
router.get('/shops', economyController.showShops);

// مدیریت آیتم‌ها
router.get('/items', economyController.showItems);

// مدیریت کوپن‌ها و هدیه‌ها
router.get('/coupons', economyController.showCoupons);

// تنظیمات اقتصادی
router.get('/settings', economyController.showEconomySettings);

// ایجاد سهام جدید
router.post('/stocks/create', economyController.createStock);

// ویرایش سهام
router.post('/stocks/edit/:id', economyController.editStock);

// به‌روزرسانی قیمت سهام
router.post('/stocks/update-price/:id', economyController.updateStockPrice);

// ایجاد آیتم جدید
router.post('/items/create', economyController.createItem);

// ویرایش آیتم
router.post('/items/edit/:id', economyController.editItem);

// حذف آیتم
router.post('/items/delete/:id', economyController.deleteItem);

// گزارش وضعیت اقتصادی
router.get('/report', economyController.generateEconomyReport);

export default router;