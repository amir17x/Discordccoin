/**
 * مسیرهای مدیریت کاربران پنل ادمین
 */
import express from 'express';
import { authMiddleware, checkPermissions } from '../middleware/auth.js';
import * as usersController from '../controllers/usersController.js';

const router = express.Router();

// اعمال میدلویر احراز هویت برای تمام مسیرها
router.use(authMiddleware);
router.use(checkPermissions('users'));

// نمایش لیست کاربران
router.get('/', usersController.showUsersList);

// نمایش جزئیات کاربر
router.get('/view/:id', usersController.showUserDetails);

// فرم ویرایش کاربر
router.get('/edit/:id', usersController.showUserEdit);

// پردازش فرم ویرایش کاربر
router.post('/edit/:id', usersController.processUserEdit);

// افزودن سکه به کاربر
router.post('/add-coins', usersController.addCoins);

// کم کردن سکه از کاربر
router.post('/remove-coins', usersController.removeCoins);

// افزودن آیتم به کاربر
router.post('/add-item', usersController.addItem);

// مسدود کردن کاربر
router.post('/ban/:id', usersController.banUser);

// رفع مسدودیت کاربر
router.post('/unban/:id', usersController.unbanUser);

// ریست کردن اطلاعات کاربر
router.post('/reset/:id', usersController.resetUser);

// خروجی لیست کاربران
router.get('/export', usersController.exportUsers);

export default router;