/**
 * مسیرهای API آمار
 */
import express from 'express';
import { getRealtimeStats } from '../../controllers/dashboardController.js';
import { isAuthenticated } from '../../middleware/auth.js';

const router = express.Router();

// مسیر API برای دریافت آمار لحظه‌ای
router.get('/realtime-stats', isAuthenticated, getRealtimeStats);

export default router;
