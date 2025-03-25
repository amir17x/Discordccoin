/**
 * مسیرهای مدیریت لاگ‌ها
 * این فایل شامل مسیرهای لازم برای مدیریت و مشاهده لاگ‌های سیستم است
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../db');
const fs = require('fs');
const path = require('path');

// تعداد نتیجه در هر صفحه
const PAGE_SIZE = 25;

// مسیر فایل‌های لاگ
const LOG_PATH = process.env.LOG_PATH || path.join(__dirname, '..', 'logs');

/**
 * صفحه اصلی لاگ‌ها
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // بررسی وجود دایرکتوری لاگ‌ها
        if (!fs.existsSync(LOG_PATH)) {
            fs.mkdirSync(LOG_PATH, { recursive: true });
        }
        
        // لیست فایل‌های لاگ
        const logFiles = fs.readdirSync(LOG_PATH)
            .filter(file => file.endsWith('.log'))
            .map(file => ({
                name: file,
                path: path.join(LOG_PATH, file),
                size: fs.statSync(path.join(LOG_PATH, file)).size,
                lastModified: fs.statSync(path.join(LOG_PATH, file)).mtime
            }))
            .sort((a, b) => b.lastModified - a.lastModified);
        
        // دریافت رویدادهای اخیر از دیتابیس
        const recentEvents = await db.getRecentEvents(10);
        
        res.render('logs/index', { 
            title: 'مدیریت لاگ‌ها',
            logFiles,
            recentEvents,
            active: 'logs'
        });
    } catch (error) {
        console.error('خطا در دریافت لیست لاگ‌ها:', error);
        req.flash('error', 'خطا در دریافت لیست لاگ‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت لیست لاگ‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه مشاهده محتوای یک فایل لاگ
 */
router.get('/view/:filename', isAuthenticated, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(LOG_PATH, filename);
        
        if (!fs.existsSync(filePath)) {
            req.flash('error', 'فایل لاگ مورد نظر یافت نشد');
            return res.redirect('/logs');
        }
        
        // خواندن محتوای فایل لاگ
        const content = fs.readFileSync(filePath, 'utf8');
        
        // تقسیم محتوا به خطوط
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // پاگینیشن
        const page = parseInt(req.query.page) || 1;
        const totalItems = lines.length;
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        const start = (page - 1) * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, totalItems);
        const paginatedLines = lines.slice(start, end);
        
        // اطلاعات پاگینیشن
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        // اطلاعات فایل
        const fileStats = fs.statSync(filePath);
        const fileInfo = {
            name: filename,
            size: fileStats.size,
            created: fileStats.birthtime,
            modified: fileStats.mtime
        };
        
        res.render('logs/view', { 
            title: `مشاهده لاگ ${filename}`,
            content: paginatedLines,
            fileInfo,
            pagination,
            active: 'logs'
        });
    } catch (error) {
        console.error('خطا در مشاهده محتوای فایل لاگ:', error);
        req.flash('error', 'خطا در مشاهده محتوای فایل لاگ');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در مشاهده محتوای فایل لاگ',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * دانلود فایل لاگ
 */
router.get('/download/:filename', isAuthenticated, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(LOG_PATH, filename);
        
        if (!fs.existsSync(filePath)) {
            req.flash('error', 'فایل لاگ مورد نظر یافت نشد');
            return res.redirect('/logs');
        }
        
        res.download(filePath);
    } catch (error) {
        console.error('خطا در دانلود فایل لاگ:', error);
        req.flash('error', 'خطا در دانلود فایل لاگ');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دانلود فایل لاگ',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * حذف فایل لاگ
 */
router.post('/delete/:filename', isAuthenticated, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(LOG_PATH, filename);
        
        if (!fs.existsSync(filePath)) {
            req.flash('error', 'فایل لاگ مورد نظر یافت نشد');
            return res.redirect('/logs');
        }
        
        // حذف فایل
        fs.unlinkSync(filePath);
        
        req.flash('success', `فایل لاگ ${filename} با موفقیت حذف شد`);
        res.redirect('/logs');
    } catch (error) {
        console.error('خطا در حذف فایل لاگ:', error);
        req.flash('error', 'خطا در حذف فایل لاگ');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در حذف فایل لاگ',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه جستجو در لاگ‌ها
 */
router.get('/search', isAuthenticated, async (req, res) => {
    try {
        const searchTerm = req.query.term || '';
        const fileFilter = req.query.file || 'all';
        
        if (!searchTerm.trim()) {
            return res.redirect('/logs');
        }
        
        // لیست فایل‌های لاگ
        const logFiles = fs.readdirSync(LOG_PATH)
            .filter(file => file.endsWith('.log'))
            .filter(file => fileFilter === 'all' || file === fileFilter);
        
        // جستجو در فایل‌های لاگ
        const results = [];
        
        for (const file of logFiles) {
            const filePath = path.join(LOG_PATH, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            const matchingLines = lines
                .map((line, index) => ({ line, index: index + 1 }))
                .filter(({ line }) => line.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (matchingLines.length > 0) {
                results.push({
                    file,
                    matches: matchingLines
                });
            }
        }
        
        res.render('logs/search', { 
            title: 'جستجو در لاگ‌ها',
            searchTerm,
            fileFilter,
            results,
            logFiles: logFiles.map(file => ({ name: file })),
            active: 'logs'
        });
    } catch (error) {
        console.error('خطا در جستجوی لاگ‌ها:', error);
        req.flash('error', 'خطا در جستجوی لاگ‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در جستجوی لاگ‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه لاگ‌های سیستم (از دیتابیس)
 */
router.get('/system', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;
        
        // دریافت تعداد کل لاگ‌های سیستم
        const totalItems = await db.getSystemLogsCount();
        
        // محاسبه تعداد کل صفحات
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        
        // دریافت لیست لاگ‌های سیستم با پاگینیشن
        const logs = await db.getSystemLogs(skip, PAGE_SIZE);
        
        // اطلاعات پاگینیشن
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        res.render('logs/system', { 
            title: 'لاگ‌های سیستم',
            logs,
            pagination,
            active: 'logs'
        });
    } catch (error) {
        console.error('خطا در دریافت لاگ‌های سیستم:', error);
        req.flash('error', 'خطا در دریافت لاگ‌های سیستم');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت لاگ‌های سیستم',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه لاگ‌های تراکنش (از دیتابیس)
 */
router.get('/transactions', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;
        
        // دریافت تعداد کل لاگ‌های تراکنش
        const totalItems = await db.getTransactionLogsCount();
        
        // محاسبه تعداد کل صفحات
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        
        // دریافت لیست لاگ‌های تراکنش با پاگینیشن
        const logs = await db.getTransactionLogs(skip, PAGE_SIZE);
        
        // اطلاعات پاگینیشن
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        res.render('logs/transactions', { 
            title: 'لاگ‌های تراکنش',
            logs,
            pagination,
            active: 'logs'
        });
    } catch (error) {
        console.error('خطا در دریافت لاگ‌های تراکنش:', error);
        req.flash('error', 'خطا در دریافت لاگ‌های تراکنش');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت لاگ‌های تراکنش',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه لاگ‌های بازی (از دیتابیس)
 */
router.get('/games', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;
        
        // دریافت تعداد کل لاگ‌های بازی
        const totalItems = await db.getGameLogsCount();
        
        // محاسبه تعداد کل صفحات
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        
        // دریافت لیست لاگ‌های بازی با پاگینیشن
        const logs = await db.getGameLogs(skip, PAGE_SIZE);
        
        // اطلاعات پاگینیشن
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        res.render('logs/games', { 
            title: 'لاگ‌های بازی',
            logs,
            pagination,
            active: 'logs'
        });
    } catch (error) {
        console.error('خطا در دریافت لاگ‌های بازی:', error);
        req.flash('error', 'خطا در دریافت لاگ‌های بازی');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت لاگ‌های بازی',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;