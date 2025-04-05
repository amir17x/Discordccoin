/**
 * مسیرهای مدیریت کاربران پنل ادمین
 */

import express from 'express';
import { 
  showUsersList, 
  showUserDetails, 
  showUserEdit, 
  processUserEdit, 
  addCoins,
  removeCoins,
  addItem,
  banUser,
  unbanUser,
  resetUser,
  exportUsers
} from '../controllers/usersController.js';
import { checkUsersAccess } from '../middleware/auth.js';

const router = express.Router();

// اعمال میان‌افزار دسترسی به همه مسیرها
router.use(checkUsersAccess);

// لیست کاربران
router.get('/', showUsersList);

// خروجی CSV از لیست کاربران
router.get('/export', exportUsers);

// جزئیات کاربر
router.get('/details/:id', showUserDetails);

// ویرایش کاربر
router.get('/edit/:id', showUserEdit);
router.post('/edit/:id', processUserEdit);

// افزودن سکه به کاربر
router.post('/add-coins/:id', addCoins);

// کم کردن سکه از کاربر
router.post('/remove-coins/:id', removeCoins);

// افزودن آیتم به کاربر
router.post('/add-item/:id', addItem);

// مسدود کردن کاربر
router.post('/ban/:id', banUser);

// رفع مسدودیت کاربر
router.post('/unban/:id', unbanUser);

// ریست کردن اطلاعات کاربر
router.post('/reset/:id', resetUser);

export default router;