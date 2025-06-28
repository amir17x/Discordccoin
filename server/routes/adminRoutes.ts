/**
 * مسیرهای API ادمین
 * این فایل مسیرهای API ادمین را تعریف می‌کند
 */

import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// دریافت آمار کلی ادمین
router.get('/stats', async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    const totalUsers = users.length;
    const totalCoins = users.reduce((sum, user) => sum + (user.wallet || 0) + (user.bank || 0), 0);
    const totalCrystals = users.reduce((sum, user) => sum + (user.crystals || 0), 0);
    
    // محاسبه تعداد کلن‌ها
    const clans = users.filter(user => user.clanId).map(user => user.clanId);
    const totalClans = new Set(clans).size;

    res.json({
      totalUsers,
      totalCoins,
      totalCrystals,
      totalClans
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// دریافت لیست کاربران
router.get('/users', async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    const limitedUsers = users.slice(0, 50).map(user => ({
      discordId: user.discordId,
      username: user.username,
      wallet: user.wallet || 0,
      bank: user.bank || 0,
      crystals: user.crystals || 0,
      banned: user.banned || false,
      level: user.level || 1,
      clanId: user.clanId
    }));
    
    res.json(limitedUsers);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// اضافه کردن سکه به کاربر
router.post('/add-coins', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid userId or amount' });
    }

    const user = await storage.getUserByDiscordId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // اضافه کردن سکه به کیف پول کاربر
    const updatedUser = await storage.updateUser(userId, {
      wallet: (user.wallet || 0) + parseInt(amount)
    });

    res.json({ 
      success: true, 
      message: `${amount} سکه به کاربر ${userId} اضافه شد`,
      user: {
        discordId: updatedUser.discordId,
        wallet: updatedUser.wallet,
        bank: updatedUser.bank
      }
    });
  } catch (error) {
    console.error('Add coins error:', error);
    res.status(500).json({ error: 'Failed to add coins' });
  }
});

// بازنشانی کل اقتصاد
router.post('/reset-economy', async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    
    // بازنشانی اقتصاد تمام کاربران
    for (const user of users) {
      await storage.updateUser(user.discordId, {
        wallet: 100, // مقدار ابتدایی
        bank: 0,
        crystals: 0,
        level: 1
      });
    }

    res.json({ 
      success: true, 
      message: `اقتصاد ${users.length} کاربر بازنشانی شد`,
      resetCount: users.length
    });
  } catch (error) {
    console.error('Reset economy error:', error);
    res.status(500).json({ error: 'Failed to reset economy' });
  }
});

// حذف سکه از کاربر
router.post('/remove-coins', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid userId or amount' });
    }

    const user = await storage.getUserByDiscordId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newWallet = Math.max(0, (user.wallet || 0) - parseInt(amount));
    const updatedUser = await storage.updateUser(userId, {
      wallet: newWallet
    });

    res.json({ 
      success: true, 
      message: `${amount} سکه از کاربر ${userId} کم شد`,
      user: {
        discordId: updatedUser.discordId,
        wallet: updatedUser.wallet,
        bank: updatedUser.bank
      }
    });
  } catch (error) {
    console.error('Remove coins error:', error);
    res.status(500).json({ error: 'Failed to remove coins' });
  }
});

export default router;