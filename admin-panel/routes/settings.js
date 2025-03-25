/**
 * مسیرهای مدیریت تنظیمات
 * این فایل شامل مسیرهای لازم برای مدیریت تنظیمات ربات است
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { LogType } = require('../../server/discord/utils/logger');

// مسیر فایل تنظیمات ربات
const BOT_CONFIG_PATH = process.env.BOT_CONFIG_PATH || path.join(__dirname, '..', '..', 'bot_config.json');

// مسیر فایل تنظیمات گیواوی
const GIVEAWAY_CONFIG_PATH = process.env.GIVEAWAY_CONFIG_PATH || path.join(__dirname, '..', '..', 'giveaway_config.json');

/**
 * صفحه اصلی تنظیمات
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // خواندن تنظیمات ربات
        let botConfig = {};
        if (fs.existsSync(BOT_CONFIG_PATH)) {
            const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
            botConfig = JSON.parse(configContent);
        }
        
        // خواندن تنظیمات گیواوی
        let giveawayConfig = {};
        if (fs.existsSync(GIVEAWAY_CONFIG_PATH)) {
            const configContent = fs.readFileSync(GIVEAWAY_CONFIG_PATH, 'utf8');
            giveawayConfig = JSON.parse(configContent);
        }
        
        res.render('settings/index', { 
            title: 'تنظیمات ربات',
            botConfig,
            giveawayConfig,
            logTypes: Object.values(LogType),
            active: 'settings'
        });
    } catch (error) {
        console.error('خطا در دریافت تنظیمات ربات:', error);
        req.flash('error', 'خطا در دریافت تنظیمات ربات');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت تنظیمات ربات',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * بروزرسانی تنظیمات عمومی ربات
 */
router.post('/general', isAuthenticated, async (req, res) => {
    try {
        // خواندن تنظیمات ربات
        let botConfig = {};
        if (fs.existsSync(BOT_CONFIG_PATH)) {
            const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
            botConfig = JSON.parse(configContent);
        }
        
        // بروزرسانی تنظیمات عمومی
        botConfig.general = botConfig.general || {};
        botConfig.general.prefix = req.body.prefix || '!';
        botConfig.general.adminRoleId = req.body.adminRoleId || '';
        botConfig.general.moderatorRoleId = req.body.moderatorRoleId || '';
        botConfig.general.guildId = req.body.guildId || '';
        
        // ذخیره تنظیمات
        fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf8');
        
        req.flash('success', 'تنظیمات عمومی ربات با موفقیت بروزرسانی شد');
        res.redirect('/settings');
    } catch (error) {
        console.error('خطا در بروزرسانی تنظیمات عمومی ربات:', error);
        req.flash('error', 'خطا در بروزرسانی تنظیمات عمومی ربات');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی تنظیمات عمومی ربات',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * بروزرسانی تنظیمات اقتصادی ربات
 */
router.post('/economy', isAuthenticated, async (req, res) => {
    try {
        // خواندن تنظیمات ربات
        let botConfig = {};
        if (fs.existsSync(BOT_CONFIG_PATH)) {
            const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
            botConfig = JSON.parse(configContent);
        }
        
        // بروزرسانی تنظیمات اقتصادی
        botConfig.economy = botConfig.economy || {};
        botConfig.economy.bankInterestRate = parseFloat(req.body.bankInterestRate) || 0.05;
        botConfig.economy.transferFeeRate = parseFloat(req.body.transferFeeRate) || 0.02;
        botConfig.economy.initialBalance = parseInt(req.body.initialBalance) || 1000;
        botConfig.economy.dailyReward = parseInt(req.body.dailyReward) || 200;
        botConfig.economy.dailyStreakBonus = parseInt(req.body.dailyStreakBonus) || 50;
        
        // ذخیره تنظیمات
        fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf8');
        
        req.flash('success', 'تنظیمات اقتصادی ربات با موفقیت بروزرسانی شد');
        res.redirect('/settings');
    } catch (error) {
        console.error('خطا در بروزرسانی تنظیمات اقتصادی ربات:', error);
        req.flash('error', 'خطا در بروزرسانی تنظیمات اقتصادی ربات');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی تنظیمات اقتصادی ربات',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * بروزرسانی تنظیمات بازی‌ها
 */
router.post('/games', isAuthenticated, async (req, res) => {
    try {
        // خواندن تنظیمات ربات
        let botConfig = {};
        if (fs.existsSync(BOT_CONFIG_PATH)) {
            const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
            botConfig = JSON.parse(configContent);
        }
        
        // دریافت بازی‌های غیرفعال به صورت آرایه
        const disabledGames = [];
        if (req.body.disabledGames) {
            if (Array.isArray(req.body.disabledGames)) {
                disabledGames.push(...req.body.disabledGames);
            } else {
                disabledGames.push(req.body.disabledGames);
            }
        }
        
        // بروزرسانی تنظیمات بازی‌ها
        botConfig.games = botConfig.games || {};
        botConfig.games.minBet = parseInt(req.body.minBet) || 10;
        botConfig.games.maxBet = parseInt(req.body.maxBet) || 1000;
        botConfig.games.disabledGames = disabledGames;
        
        // ذخیره تنظیمات
        fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf8');
        
        req.flash('success', 'تنظیمات بازی‌ها با موفقیت بروزرسانی شد');
        res.redirect('/settings');
    } catch (error) {
        console.error('خطا در بروزرسانی تنظیمات بازی‌ها:', error);
        req.flash('error', 'خطا در بروزرسانی تنظیمات بازی‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی تنظیمات بازی‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * بروزرسانی تنظیمات امنیتی
 */
router.post('/security', isAuthenticated, async (req, res) => {
    try {
        // خواندن تنظیمات ربات
        let botConfig = {};
        if (fs.existsSync(BOT_CONFIG_PATH)) {
            const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
            botConfig = JSON.parse(configContent);
        }
        
        // بروزرسانی تنظیمات امنیتی
        botConfig.security = botConfig.security || {};
        botConfig.security.antiSpam = req.body.antiSpam === 'on' || req.body.antiSpam === true;
        botConfig.security.maxTransferPerDay = parseInt(req.body.maxTransferPerDay) || 10000;
        botConfig.security.maxTransferPerUser = parseInt(req.body.maxTransferPerUser) || 5000;
        botConfig.security.stealCooldown = parseInt(req.body.stealCooldown) || 30;
        botConfig.security.maxStealPerDay = parseInt(req.body.maxStealPerDay) || 3;
        
        // ذخیره تنظیمات
        fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf8');
        
        req.flash('success', 'تنظیمات امنیتی ربات با موفقیت بروزرسانی شد');
        res.redirect('/settings');
    } catch (error) {
        console.error('خطا در بروزرسانی تنظیمات امنیتی ربات:', error);
        req.flash('error', 'خطا در بروزرسانی تنظیمات امنیتی ربات');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی تنظیمات امنیتی ربات',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * بروزرسانی تنظیمات قابلیت‌های ربات
 */
router.post('/features', isAuthenticated, async (req, res) => {
    try {
        // خواندن تنظیمات ربات
        let botConfig = {};
        if (fs.existsSync(BOT_CONFIG_PATH)) {
            const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
            botConfig = JSON.parse(configContent);
        }
        
        // بروزرسانی تنظیمات قابلیت‌ها
        botConfig.features = botConfig.features || {};
        
        // تمام قابلیت‌ها را غیرفعال کن
        for (const key in botConfig.features) {
            botConfig.features[key] = false;
        }
        
        // فعال کردن قابلیت‌های انتخاب شده
        const enabledFeatures = req.body.features || [];
        
        if (Array.isArray(enabledFeatures)) {
            enabledFeatures.forEach(feature => {
                botConfig.features[feature] = true;
            });
        } else {
            botConfig.features[enabledFeatures] = true;
        }
        
        // اطمینان از وجود تمام قابلیت‌های ممکن در آبجکت
        const allFeatures = [
            'economy', 'games', 'inventory', 'quests', 'clans', 'war', 
            'island', 'shop', 'wheel', 'robbery', 'lottery', 'stocks', 
            'investments', 'achievements', 'giveaways'
        ];
        
        allFeatures.forEach(feature => {
            if (botConfig.features[feature] === undefined) {
                botConfig.features[feature] = false;
            }
        });
        
        // ذخیره تنظیمات
        fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf8');
        
        req.flash('success', 'تنظیمات قابلیت‌های ربات با موفقیت بروزرسانی شد');
        res.redirect('/settings');
    } catch (error) {
        console.error('خطا در بروزرسانی تنظیمات قابلیت‌های ربات:', error);
        req.flash('error', 'خطا در بروزرسانی تنظیمات قابلیت‌های ربات');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی تنظیمات قابلیت‌های ربات',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * بروزرسانی تنظیمات کانال‌های لاگ
 */
router.post('/log-channels', isAuthenticated, async (req, res) => {
    try {
        // خواندن تنظیمات ربات
        let botConfig = {};
        if (fs.existsSync(BOT_CONFIG_PATH)) {
            const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
            botConfig = JSON.parse(configContent);
        }
        
        // بروزرسانی تنظیمات کانال‌های لاگ
        botConfig.logChannels = botConfig.logChannels || {};
        
        // بروزرسانی کانال‌ها
        Object.values(LogType).forEach(logType => {
            botConfig.logChannels[logType] = req.body[`logChannel_${logType}`] || '';
        });
        
        // بروزرسانی کانال پیش‌فرض
        botConfig.logChannels.default = req.body.defaultLogChannel || '';
        
        // ذخیره تنظیمات
        fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf8');
        
        req.flash('success', 'تنظیمات کانال‌های لاگ با موفقیت بروزرسانی شد');
        res.redirect('/settings');
    } catch (error) {
        console.error('خطا در بروزرسانی تنظیمات کانال‌های لاگ:', error);
        req.flash('error', 'خطا در بروزرسانی تنظیمات کانال‌های لاگ');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی تنظیمات کانال‌های لاگ',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * بروزرسانی تنظیمات گیواوی
 */
router.post('/giveaway', isAuthenticated, async (req, res) => {
    try {
        // خواندن تنظیمات گیواوی
        let giveawayConfig = {};
        if (fs.existsSync(GIVEAWAY_CONFIG_PATH)) {
            const configContent = fs.readFileSync(GIVEAWAY_CONFIG_PATH, 'utf8');
            giveawayConfig = JSON.parse(configContent);
        }
        
        // بروزرسانی تنظیمات گیواوی
        giveawayConfig.apiUrl = req.body.apiUrl || '';
        giveawayConfig.apiKey = req.body.apiKey || '';
        giveawayConfig.ticketPrice = parseInt(req.body.ticketPrice) || 100;
        giveawayConfig.enabled = req.body.enabled === 'on' || req.body.enabled === true;
        
        // بروزرسانی نسبت دعوت به بلیط
        giveawayConfig.inviteRatio = giveawayConfig.inviteRatio || {};
        giveawayConfig.inviteRatio.invites = parseInt(req.body.inviteRatio_invites) || 1;
        giveawayConfig.inviteRatio.tickets = parseInt(req.body.inviteRatio_tickets) || 1;
        
        // ذخیره تنظیمات
        fs.writeFileSync(GIVEAWAY_CONFIG_PATH, JSON.stringify(giveawayConfig, null, 2), 'utf8');
        
        req.flash('success', 'تنظیمات گیواوی با موفقیت بروزرسانی شد');
        res.redirect('/settings');
    } catch (error) {
        console.error('خطا در بروزرسانی تنظیمات گیواوی:', error);
        req.flash('error', 'خطا در بروزرسانی تنظیمات گیواوی');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی تنظیمات گیواوی',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * بازنشانی تنظیمات به مقادیر پیش‌فرض
 */
router.post('/reset', isAuthenticated, async (req, res) => {
    try {
        const configType = req.body.configType;
        
        if (configType === 'bot') {
            // تنظیمات پیش‌فرض ربات
            const defaultBotConfig = {
                logChannels: {
                    default: ''
                },
                economy: {
                    bankInterestRate: 0.05,
                    transferFeeRate: 0.02,
                    initialBalance: 1000,
                    dailyReward: 200,
                    dailyStreakBonus: 50
                },
                general: {
                    prefix: '!',
                    adminRoleId: '',
                    moderatorRoleId: '',
                    guildId: ''
                },
                games: {
                    minBet: 10,
                    maxBet: 1000,
                    disabledGames: []
                },
                security: {
                    antiSpam: true,
                    maxTransferPerDay: 10000,
                    maxTransferPerUser: 5000,
                    stealCooldown: 30,
                    maxStealPerDay: 3
                },
                features: {
                    economy: true,
                    games: true,
                    inventory: true,
                    quests: true,
                    clans: true,
                    war: true,
                    island: true,
                    shop: true,
                    wheel: true,
                    robbery: true,
                    lottery: true,
                    stocks: true,
                    investments: true,
                    achievements: true,
                    giveaways: true
                }
            };
            
            // ذخیره تنظیمات پیش‌فرض
            fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(defaultBotConfig, null, 2), 'utf8');
            
            req.flash('success', 'تنظیمات ربات به مقادیر پیش‌فرض بازنشانی شد');
        } else if (configType === 'giveaway') {
            // تنظیمات پیش‌فرض گیواوی
            const defaultGiveawayConfig = {
                apiUrl: '',
                apiKey: '',
                ticketPrice: 100,
                enabled: false,
                inviteRatio: {
                    invites: 1,
                    tickets: 1
                }
            };
            
            // ذخیره تنظیمات پیش‌فرض
            fs.writeFileSync(GIVEAWAY_CONFIG_PATH, JSON.stringify(defaultGiveawayConfig, null, 2), 'utf8');
            
            req.flash('success', 'تنظیمات گیواوی به مقادیر پیش‌فرض بازنشانی شد');
        } else {
            req.flash('error', 'نوع تنظیمات نامعتبر است');
        }
        
        res.redirect('/settings');
    } catch (error) {
        console.error('خطا در بازنشانی تنظیمات:', error);
        req.flash('error', 'خطا در بازنشانی تنظیمات');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بازنشانی تنظیمات',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;