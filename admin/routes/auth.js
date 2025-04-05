/**
 * مسیرهای احراز هویت پنل ادمین
 */

import express from 'express';
import { showLogin, processLogin, processLogout } from '../controllers/authController.js';
import { guestMiddleware } from '../middleware/auth.js';

const router = express.Router();

// صفحه ورود
router.get('/login', guestMiddleware, showLogin);

// پردازش فرم ورود
router.post('/login', guestMiddleware, processLogin);

// خروج از سیستم
router.post('/logout', processLogout);

export default router;