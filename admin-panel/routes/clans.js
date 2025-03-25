const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../db');

// تعداد نتیجه در هر صفحه
const PAGE_SIZE = 10;

/**
 * صفحه لیست کلن‌ها
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;
        
        // دریافت تعداد کل کلن‌ها
        const totalItems = await db.getClansCount();
        
        // محاسبه تعداد کل صفحات
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        
        // دریافت لیست کلن‌ها با پاگینیشن
        const clans = await db.getClans(skip, PAGE_SIZE);
        
        // اطلاعات پاگینیشن
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        res.render('clans/index', { 
            title: 'مدیریت کلن‌ها',
            clans,
            pagination,
            active: 'clans'
        });
    } catch (error) {
        console.error('خطا در دریافت لیست کلن‌ها:', error);
        req.flash('error', 'خطا در دریافت لیست کلن‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت لیست کلن‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه جستجوی کلن‌ها
 */
router.get('/search', isAuthenticated, async (req, res) => {
    try {
        const searchTerm = req.query.term || '';
        
        if (!searchTerm.trim()) {
            return res.redirect('/clans');
        }
        
        // جستجوی کلن‌ها
        const clans = await db.searchClans(searchTerm);
        
        res.render('clans/search', { 
            title: 'جستجوی کلن‌ها',
            clans,
            searchTerm,
            active: 'clans'
        });
    } catch (error) {
        console.error('خطا در جستجوی کلن‌ها:', error);
        req.flash('error', 'خطا در جستجوی کلن‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در جستجوی کلن‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه مشاهده جزئیات کلن
 */
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const clanId = parseInt(req.params.id);
        
        // دریافت اطلاعات کلن
        const clan = await db.getClanById(clanId);
        
        if (!clan) {
            req.flash('error', 'کلن مورد نظر یافت نشد');
            return res.redirect('/clans');
        }
        
        // دریافت اطلاعات مالک کلن
        const owner = await db.getUserById(clan.ownerId);
        
        // دریافت اطلاعات اعضای کلن
        const members = await db.getClanMembers(clanId);
        
        res.render('clans/view', { 
            title: `کلن ${clan.name}`,
            clan,
            owner,
            members,
            active: 'clans'
        });
    } catch (error) {
        console.error('خطا در دریافت اطلاعات کلن:', error);
        req.flash('error', 'خطا در دریافت اطلاعات کلن');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات کلن',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه ویرایش کلن
 */
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const clanId = parseInt(req.params.id);
        
        // دریافت اطلاعات کلن
        const clan = await db.getClanById(clanId);
        
        if (!clan) {
            req.flash('error', 'کلن مورد نظر یافت نشد');
            return res.redirect('/clans');
        }
        
        res.render('clans/edit', { 
            title: `ویرایش کلن ${clan.name}`,
            clan,
            active: 'clans'
        });
    } catch (error) {
        console.error('خطا در دریافت اطلاعات کلن برای ویرایش:', error);
        req.flash('error', 'خطا در دریافت اطلاعات کلن');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات کلن برای ویرایش',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش ویرایش کلن
 */
router.post('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const clanId = parseInt(req.params.id);
        const { name, description, level, experience } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!name || !level || !experience) {
            req.flash('error', 'تمام فیلدهای ضروری باید پر شوند');
            return res.redirect(`/clans/${clanId}/edit`);
        }
        
        // بروزرسانی اطلاعات کلن
        await db.updateClan(clanId, {
            name,
            description,
            level: parseInt(level),
            experience: parseInt(experience)
        });
        
        req.flash('success', 'اطلاعات کلن با موفقیت بروزرسانی شد');
        res.redirect(`/clans/${clanId}`);
    } catch (error) {
        console.error('خطا در بروزرسانی اطلاعات کلن:', error);
        req.flash('error', 'خطا در بروزرسانی اطلاعات کلن');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی اطلاعات کلن',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش بروزرسانی منابع کلن
 */
router.post('/:id/edit-resources', isAuthenticated, async (req, res) => {
    try {
        const clanId = parseInt(req.params.id);
        const { coins, materials, energy } = req.body;
        
        // بروزرسانی منابع کلن
        await db.updateClanResources(clanId, {
            coins: parseInt(coins) || 0,
            materials: parseInt(materials) || 0,
            energy: parseInt(energy) || 0
        });
        
        req.flash('success', 'منابع کلن با موفقیت بروزرسانی شد');
        res.redirect(`/clans/${clanId}`);
    } catch (error) {
        console.error('خطا در بروزرسانی منابع کلن:', error);
        req.flash('error', 'خطا در بروزرسانی منابع کلن');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی منابع کلن',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش افزودن منابع به کلن
 */
router.post('/:id/add-resources', isAuthenticated, async (req, res) => {
    try {
        const clanId = parseInt(req.params.id);
        const { resourceType, amount } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!resourceType || !amount || amount < 1) {
            req.flash('error', 'نوع منبع و مقدار معتبر را وارد کنید');
            return res.redirect(`/clans/${clanId}`);
        }
        
        // افزودن منابع به کلن
        await db.addClanResource(clanId, resourceType, parseInt(amount));
        
        req.flash('success', `${amount} واحد ${resourceType === 'coins' ? 'سکه' : resourceType === 'materials' ? 'مواد اولیه' : 'انرژی'} با موفقیت به کلن اضافه شد`);
        res.redirect(`/clans/${clanId}`);
    } catch (error) {
        console.error('خطا در افزودن منابع به کلن:', error);
        req.flash('error', 'خطا در افزودن منابع به کلن');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در افزودن منابع به کلن',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش تغییر مالک کلن
 */
router.post('/:id/change-owner', isAuthenticated, async (req, res) => {
    try {
        const clanId = parseInt(req.params.id);
        const { newOwnerId } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!newOwnerId) {
            req.flash('error', 'کاربر جدید را انتخاب کنید');
            return res.redirect(`/clans/${clanId}/edit`);
        }
        
        // تغییر مالک کلن
        await db.changeClanOwner(clanId, parseInt(newOwnerId));
        
        req.flash('success', 'مالک کلن با موفقیت تغییر یافت');
        res.redirect(`/clans/${clanId}`);
    } catch (error) {
        console.error('خطا در تغییر مالک کلن:', error);
        req.flash('error', 'خطا در تغییر مالک کلن');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در تغییر مالک کلن',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش حذف کلن
 */
router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const clanId = parseInt(req.params.id);
        
        // دریافت اطلاعات کلن قبل از حذف (برای نمایش پیام)
        const clan = await db.getClanById(clanId);
        
        if (!clan) {
            req.flash('error', 'کلن مورد نظر یافت نشد');
            return res.redirect('/clans');
        }
        
        // حذف کلن
        await db.deleteClan(clanId);
        
        req.flash('success', `کلن "${clan.name}" با موفقیت حذف شد`);
        res.redirect('/clans');
    } catch (error) {
        console.error('خطا در حذف کلن:', error);
        req.flash('error', 'خطا در حذف کلن');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در حذف کلن',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش خارج کردن کاربر از کلن
 */
router.post('/:id/remove-member/:userId', isAuthenticated, async (req, res) => {
    try {
        const clanId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);
        
        // خارج کردن کاربر از کلن
        await db.removeMemberFromClan(clanId, userId);
        
        req.flash('success', 'کاربر با موفقیت از کلن خارج شد');
        res.redirect(`/clans/${clanId}`);
    } catch (error) {
        console.error('خطا در خارج کردن کاربر از کلن:', error);
        req.flash('error', 'خطا در خارج کردن کاربر از کلن');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در خارج کردن کاربر از کلن',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;