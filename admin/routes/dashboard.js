/**
 * مسیرهای داشبورد پنل ادمین
 */

import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// نمایش صفحه داشبورد
router.get('/', dashboardController.showDashboard);

// API برای دریافت آمار لحظه‌ای
router.get('/api/realtime-stats', dashboardController.getRealtimeStats);

export default router;
