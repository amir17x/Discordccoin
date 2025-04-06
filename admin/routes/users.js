/**
 * مسیرهای مدیریت کاربران
 */
import express from 'express';
import * as usersController from '../controllers/usersController.js';

const router = express.Router();

// لیست کاربران
router.get('/', usersController.listUsers);

// افزودن سکه به کاربر
router.post('/add-coins', usersController.addCoinsToUser);

// کسر سکه از کاربر
router.post('/remove-coins', usersController.removeCoinsFromUser);

// خروجی اکسل کاربران
router.get('/export', usersController.exportUsers);

// مشاهده کاربر
router.get('/:id', usersController.viewUser);

// فرم ویرایش کاربر
router.get('/:id/edit', usersController.editUserForm);

// ذخیره تغییرات کاربر
router.post('/:id/edit', usersController.updateUser);

// مسدود کردن کاربر
router.get('/:id/ban', usersController.banUser);

// رفع مسدودیت کاربر
router.get('/:id/unban', usersController.unbanUser);

// حذف کاربر
router.get('/:id/delete', usersController.deleteUserConfirmation);
router.post('/:id/delete', usersController.deleteUser);

// تراکنش‌های کاربر
router.get('/:id/transactions', usersController.getUserTransactions);

export default router;
