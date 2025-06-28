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

// دریافت لیست آیتم‌ها
router.get('/items', async (req, res) => {
  try {
    const items = await storage.getAllItems();
    res.json(items);
  } catch (error) {
    console.error('Admin items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// اضافه کردن آیتم جدید
router.post('/add-item', async (req, res) => {
  try {
    const { name, price, description, type } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const newItem = await storage.createItem({
      name,
      price: parseInt(price),
      description: description || '',
      type: type || 'misc',
      emoji: '🎁'
    });

    res.json({ 
      success: true, 
      message: `آیتم ${name} با موفقیت اضافه شد`,
      item: newItem
    });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// مسدود/آزاد کردن کاربر
router.post('/toggle-ban', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await storage.getUserByDiscordId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBanStatus = !user.isBanned;
    const updatedUser = await storage.updateUser(userId, {
      isBanned: newBanStatus
    });

    res.json({ 
      success: true, 
      message: `کاربر ${newBanStatus ? 'مسدود' : 'آزاد'} شد`,
      user: {
        discordId: updatedUser.discordId,
        banned: updatedUser.banned
      }
    });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({ error: 'Failed to toggle ban status' });
  }
});

// آمار پیشرفته
router.get('/advanced-stats', async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    
    // محاسبه آمار پیشرفته
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.lastActive && 
      new Date(user.lastActive).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    ).length;
    const bannedUsers = users.filter(user => user.banned).length;
    
    const usersByLevel = users.reduce((acc, user) => {
      const level = user.level || 1;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const wealthDistribution = {
      poor: users.filter(user => (user.wallet || 0) + (user.bank || 0) < 1000).length,
      middle: users.filter(user => {
        const total = (user.wallet || 0) + (user.bank || 0);
        return total >= 1000 && total < 10000;
      }).length,
      rich: users.filter(user => (user.wallet || 0) + (user.bank || 0) >= 10000).length
    };

    res.json({
      totalUsers,
      activeUsers,
      bannedUsers,
      usersByLevel,
      wealthDistribution,
      avgWealth: users.reduce((sum, user) => sum + (user.wallet || 0) + (user.bank || 0), 0) / totalUsers
    });
  } catch (error) {
    console.error('Advanced stats error:', error);
    res.status(500).json({ error: 'Failed to fetch advanced stats' });
  }
});

export default router;