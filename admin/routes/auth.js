/**
 * مسیرهای احراز هویت
 * 
 * این فایل شامل مسیرهای مربوط به احراز هویت کاربران در پنل ادمین است.
 */

import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware, guestMiddleware } from '../middleware/auth.js';

const router = express.Router();

// صفحات مهمان
router.get('/login', guestMiddleware, authController.showLogin);
router.post('/login', guestMiddleware, authController.login);
router.get('/forgot-password', guestMiddleware, authController.showForgotPassword);
router.post('/forgot-password', guestMiddleware, authController.forgotPassword);
router.get('/reset-password/:token', guestMiddleware, authController.showResetPassword);
router.post('/reset-password/:token', guestMiddleware, authController.resetPassword);

// صفحات نیازمند احراز هویت
router.get('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.showProfile);
router.post('/profile', authMiddleware, authController.updateProfile);
router.get('/change-password', authMiddleware, authController.showChangePassword);
router.post('/change-password', authMiddleware, authController.changePassword);
router.get('/two-factor', authMiddleware, authController.showTwoFactor);
router.post('/two-factor/enable', authMiddleware, authController.enableTwoFactor);
router.post('/two-factor/disable', authMiddleware, authController.disableTwoFactor);
router.post('/two-factor/verify', authMiddleware, authController.verifyTwoFactor);

export default router;