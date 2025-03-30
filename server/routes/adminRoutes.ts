/**
 * مسیرهای API ادمین
 * این فایل مسیرهای API ادمین را تعریف می‌کند
 */

import express from 'express';
import {
  getUsers,
  getUserDetails,
  updateUser,
  addCoins,
  removeCoins,
  resetUserEconomy,
  resetAllEconomy,
  distributeCoins,
  toggleUserBan,
  getUserTransactions,
  getTopUsers,
  getStats
} from '../controllers/adminController';
import { isAuthenticated, isAdmin } from '../middleware/auth';

const router = express.Router();

// همه مسیرها نیاز به احراز هویت و دسترسی ادمین دارند
// در حالت توسعه، احراز هویت و کنترل دسترسی موقتاً غیرفعال می‌شود
if (process.env.NODE_ENV === 'production') {
  router.use(isAuthenticated);
  router.use(isAdmin);
} else {
  // در محیط توسعه، میدلور ساده‌ای برای احراز هویت استفاده می‌شود
  router.use((req, res, next) => {
    // اضافه کردن اطلاعات کاربر مجازی به نشست برای محیط توسعه
    if (!req.session.user) {
      req.session.isAuthenticated = true;
      req.session.isAdmin = true;
      req.session.user = {
        id: 'test-admin-id',
        discordId: 'test-admin-discord-id',
        username: 'admin-test-user'
      };
    }
    next();
  });
}

// مسیرهای مدیریت کاربران
router.get('/users', getUsers);
router.get('/users/top', getTopUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId', updateUser);
router.get('/users/:userId/transactions', getUserTransactions);

// مسیرهای مدیریت اقتصاد
router.post('/economy/add-coins/:userId', addCoins);
router.post('/economy/remove-coins/:userId', removeCoins);
router.post('/economy/reset/:userId', resetUserEconomy);
router.post('/economy/reset-all', resetAllEconomy);
router.post('/economy/distribute', distributeCoins);

// مسیرهای مدیریت دسترسی
router.post('/users/:userId/toggle-ban', toggleUserBan);

// مسیرهای آماری
router.get('/stats', getStats);

export default router;