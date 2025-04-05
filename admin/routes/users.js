/**
 * مسیرهای مدیریت کاربران
 * 
 * این فایل شامل مسیرهای مربوط به مدیریت کاربران دیسکورد است.
 */

import express from 'express';
import { usersController } from '../controllers/usersController.js';

const router = express.Router();

// صفحه اصلی مدیریت کاربران
router.get('/', usersController.showDashboard);

// مدیریت کاربران
router.get('/list', usersController.showUsersList);
router.post('/list/filter', usersController.filterUsers);
router.get('/list/export', usersController.exportUsers);

// جزئیات کاربر
router.get('/:id', usersController.showUserDetails);
router.post('/:id/update', usersController.updateUser);
router.post('/:id/ban', usersController.banUser);
router.post('/:id/unban', usersController.unbanUser);

// مدیریت سکه‌های کاربر
router.get('/:id/economy', usersController.showUserEconomy);
router.post('/:id/economy/update', usersController.updateUserEconomy);
router.post('/:id/economy/transactions', usersController.addUserTransaction);
router.get('/:id/economy/transactions', usersController.showUserTransactions);

// مدیریت آمار کاربر
router.get('/:id/stats', usersController.showUserStats);
router.post('/:id/stats/reset', usersController.resetUserStats);

// مدیریت دوستان کاربر
router.get('/:id/friends', usersController.showUserFriends);
router.post('/:id/friends/add', usersController.addUserFriend);
router.post('/:id/friends/remove', usersController.removeUserFriend);

// مدیریت اقلام کاربر
router.get('/:id/inventory', usersController.showUserInventory);
router.post('/:id/inventory/add', usersController.addItemToInventory);
router.post('/:id/inventory/remove', usersController.removeItemFromInventory);

// مدیریت جوایز کاربر
router.get('/:id/rewards', usersController.showUserRewards);
router.post('/:id/rewards/add', usersController.addUserReward);
router.post('/:id/rewards/remove', usersController.removeUserReward);

// مدیریت نقش‌های کاربر
router.get('/:id/roles', usersController.showUserRoles);
router.post('/:id/roles/add', usersController.addUserRole);
router.post('/:id/roles/remove', usersController.removeUserRole);

// مدیریت ماشین‌ها و بانک‌های کاربر
router.get('/:id/bank', usersController.showUserBanks);
router.post('/:id/bank/update', usersController.updateUserBank);

// مدیریت شرکت‌های کاربر
router.get('/:id/stocks', usersController.showUserStocks);
router.post('/:id/stocks/update', usersController.updateUserStocks);

// مدیریت لاگ‌های کاربر
router.get('/:id/logs', usersController.showUserLogs);
router.post('/:id/logs/filter', usersController.filterUserLogs);
router.get('/:id/logs/export', usersController.exportUserLogs);

// تنظیمات کاربران
router.get('/settings', usersController.showSettings);
router.post('/settings', usersController.updateSettings);

export default router;