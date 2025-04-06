/**
 * مسیرهای احراز هویت پنل ادمین
 */

import express from 'express';
import * as authController from '../controllers/authController.js';
import { redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// اعمال میدلویر هدایت به داشبورد فقط برای کاربرانی که لاگین کرده‌اند
// بدون اعمال در مسیرهای مختلف به صورت router.use
// ما بهتر است آن را مستقیماً به مسیرها اضافه کنیم

// صفحه ورود
router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', authController.processLogin);

// خروج از حساب کاربری
router.get('/logout', authController.logout);

// فراموشی رمز عبور
router.get('/forgot-password', redirectIfAuthenticated, authController.showForgotPassword);
router.post('/forgot-password', authController.processForgotPassword);

// بازنشانی رمز عبور
router.get('/reset-password/:token', redirectIfAuthenticated, authController.showResetPassword);
router.post('/reset-password/:token', authController.processResetPassword);

export default router;
