/**
 * مسیرهای داشبورد پنل ادمین
 * 
 * این فایل شامل مسیرهای مربوط به صفحه داشبورد اصلی است.
 */

import express from 'express';
import { dashboardController } from '../controllers/dashboardController.js';

const router = express.Router();

// صفحه اصلی داشبورد
router.get('/', dashboardController.showDashboard);

// داده‌های آمار
router.get('/stats', dashboardController.getStats);

// داده‌های نمودار فعالیت کاربران
router.get('/charts/user-activity', dashboardController.getUserActivityChart);

// داده‌های نمودار اقتصادی
router.get('/charts/economy', dashboardController.getEconomyChart);

// داده‌های نمودار بازی‌ها
router.get('/charts/games', dashboardController.getGamesChart);

export default router;