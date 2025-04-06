/**
 * مسیرهای احراز هویت پنل ادمین
 */

import express from 'express';
import * as authController from '../controllers/authController.js';
import { redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// اعمال میدلویر هدایت به داشبورد اگر کاربر قبلاً لاگین کرده باشد
router.use('/login', redirectIfAuthenticated);
router.use('/forgot-password', redirectIfAuthenticated);
router.use('/reset-password', redirectIfAuthenticated);

// صفحه ورود
router.get('/login', authController.showLogin);
router.post('/login', authController.processLogin);

// خروج از حساب کاربری
router.get('/logout', authController.logout);

// فراموشی رمز عبور
router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', authController.processForgotPassword);

// بازنشانی رمز عبور
router.get('/reset-password/:token', authController.showResetPassword);
router.post('/reset-password/:token', authController.processResetPassword);

export default router;
