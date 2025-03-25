/**
 * مسیرهای داشبورد
 * این فایل شامل مسیرهای لازم برای داشبورد مدیریت است
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../db');

/**
 * صفحه اصلی داشبورد
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // آمار کلی
        const stats = {
            totalUsers: await db.getUsersCount(),
            totalClans: await db.getClansCount(),
            totalCcoin: await db.getTotalCcoin(),
            newUsers24h: await db.getNewUsersCount(24),
            economyChange: await db.getEconomyChange(24),
            activeQuests: await db.getActiveQuestsCount(),
            completedQuests7d: await db.getCompletedQuestsCount(7)
        };
        
        // آمار بازی‌ها
        const gameStats = await db.getGameStats();
        
        // تاریخچه کاربران فعال (7 روز اخیر)
        const activeUsersHistory = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            activeUsersHistory.push({
                date: date.toISOString().split('T')[0],
                count: await db.getActiveUsersCountByDate(date)
            });
        }
        
        // تراکنش‌های روزانه (7 روز اخیر)
        const transactionsHistory = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dailyTransactions = await db.getDailyTransactions(date);
            transactionsHistory.push({
                date: date.toISOString().split('T')[0],
                deposits: dailyTransactions.deposits,
                withdrawals: dailyTransactions.withdrawals
            });
        }
        
        // کاربران فعال اخیر
        const recentUsers = await db.getRecentActiveUsers(5);
        
        // رویدادهای اخیر
        const recentEvents = await db.getRecentEvents(5);
        
        res.render('dashboard/index', {
            title: 'داشبورد',
            stats,
            gameStats,
            activeUsersHistory,
            transactionsHistory,
            recentUsers,
            recentEvents,
            active: 'dashboard'
        });
    } catch (error) {
        console.error('خطا در نمایش داشبورد:', error);
        req.flash('error', 'خطا در دریافت اطلاعات داشبورد');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات داشبورد',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * نمودار کاربران فعال
 */
router.get('/charts/active-users', isAuthenticated, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const activeUsersHistory = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            activeUsersHistory.push({
                date: date.toISOString().split('T')[0],
                count: await db.getActiveUsersCountByDate(date)
            });
        }
        
        res.json(activeUsersHistory);
    } catch (error) {
        console.error('خطا در دریافت نمودار کاربران فعال:', error);
        res.status(500).json({ error: 'خطا در دریافت نمودار کاربران فعال' });
    }
});

/**
 * نمودار تراکنش‌ها
 */
router.get('/charts/transactions', isAuthenticated, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const transactionsHistory = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dailyTransactions = await db.getDailyTransactions(date);
            transactionsHistory.push({
                date: date.toISOString().split('T')[0],
                deposits: dailyTransactions.deposits,
                withdrawals: dailyTransactions.withdrawals
            });
        }
        
        res.json(transactionsHistory);
    } catch (error) {
        console.error('خطا در دریافت نمودار تراکنش‌ها:', error);
        res.status(500).json({ error: 'خطا در دریافت نمودار تراکنش‌ها' });
    }
});

/**
 * نمودار بازی‌ها
 */
router.get('/charts/games', isAuthenticated, async (req, res) => {
    try {
        const gameStats = await db.getGameStats();
        
        const chartData = [
            { name: 'پرتاب سکه', value: gameStats.coinflip },
            { name: 'سنگ کاغذ قیچی', value: gameStats.rps },
            { name: 'حدس عدد', value: gameStats.numberguess },
            { name: 'تاس', value: gameStats.dice },
            { name: 'سایر', value: gameStats.other }
        ];
        
        res.json(chartData);
    } catch (error) {
        console.error('خطا در دریافت نمودار بازی‌ها:', error);
        res.status(500).json({ error: 'خطا در دریافت نمودار بازی‌ها' });
    }
});

/**
 * صفحه رویدادهای اخیر
 */
router.get('/events', isAuthenticated, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        // رویدادهای اخیر
        const recentEvents = await db.getRecentEvents(limit);
        
        res.render('dashboard/events', {
            title: 'رویدادهای اخیر',
            events: recentEvents,
            active: 'dashboard'
        });
    } catch (error) {
        console.error('خطا در نمایش رویدادهای اخیر:', error);
        req.flash('error', 'خطا در دریافت رویدادهای اخیر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت رویدادهای اخیر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه تنظیمات ویژگی‌ها
 */
router.get('/features', isAuthenticated, async (req, res) => {
    try {
        let features = {
            title: 'تنظیمات ویژگی‌ها',
            active: 'dashboard'
        };
        
        // افزودن اطلاعات ویژگی‌ها
        // خواندن تنظیمات ربات
        const fs = require('fs');
        const path = require('path');
        const BOT_CONFIG_PATH = process.env.BOT_CONFIG_PATH || path.join(__dirname, '..', '..', 'bot_config.json');
        
        if (fs.existsSync(BOT_CONFIG_PATH)) {
            const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
            const botConfig = JSON.parse(configContent);
            features.botFeatures = botConfig.features || {};
        }
        
        res.render('dashboard/features', features);
    } catch (error) {
        console.error('خطا در نمایش تنظیمات ویژگی‌ها:', error);
        req.flash('error', 'خطا در دریافت تنظیمات ویژگی‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت تنظیمات ویژگی‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه وضعیت ربات
 */
router.get('/bot-status', isAuthenticated, async (req, res) => {
    try {
        // دریافت اطلاعات وضعیت ربات از API
        const axios = require('axios');
        const apiUrl = `http://localhost:5000/api/bot/status`;
        
        let botStatus = { 
            status: 'unknown',
            uptime: 0,
            version: 'unknown',
            users: 0,
            servers: 0,
            channels: 0,
            commands: 0
        };
        
        try {
            const response = await axios.get(apiUrl);
            if (response.data) {
                botStatus = response.data;
            }
        } catch (err) {
            console.error('خطا در دریافت وضعیت ربات از API:', err);
        }
        
        res.render('dashboard/bot-status', {
            title: 'وضعیت ربات',
            botStatus,
            active: 'dashboard'
        });
    } catch (error) {
        console.error('خطا در نمایش وضعیت ربات:', error);
        req.flash('error', 'خطا در دریافت وضعیت ربات');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت وضعیت ربات',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;