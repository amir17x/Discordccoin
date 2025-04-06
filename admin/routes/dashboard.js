/**
 * مسیرهای داشبورد پنل ادمین
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// اعمال میدلویر احراز هویت برای تمام مسیرها
router.use(authMiddleware);

// نمایش صفحه داشبورد
router.get('/', dashboardController.showDashboard);

// آمار لحظه‌ای
router.get('/stats', dashboardController.getRealtimeStats);

export default router;