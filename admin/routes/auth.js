/**
 * مسیرهای احراز هویت پنل ادمین
 */
import express from 'express';
import * as authController from '../controllers/authController.js';
import { guestMiddleware, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// صفحه ورود
router.get('/login', guestMiddleware, authController.showLogin);

// پردازش فرم ورود
router.post('/login', guestMiddleware, authController.processLogin);

// خروج از حساب کاربری
router.get('/logout', authMiddleware, authController.logout);

// صفحه فراموشی رمز عبور
router.get('/forgot-password', guestMiddleware, authController.showForgotPassword);

// پردازش فرم فراموشی رمز عبور
router.post('/forgot-password', guestMiddleware, authController.processForgotPassword);

// صفحه بازنشانی رمز عبور
router.get('/reset-password/:token', guestMiddleware, authController.showResetPassword);

// پردازش فرم بازنشانی رمز عبور
router.post('/reset-password/:token', guestMiddleware, authController.processResetPassword);

export default router;