/**
 * مسیرهای داشبورد پنل ادمین
 */

import express from 'express';
import { showDashboard, showProfile, updateProfile, showSettings } from '../controllers/dashboardController.js';

const router = express.Router();

// صفحه اصلی داشبورد
router.get('/', showDashboard);

// پروفایل کاربر
router.get('/profile', showProfile);
router.post('/profile', updateProfile);

// تنظیمات داشبورد
router.get('/settings', showSettings);

export default router;