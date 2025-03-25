/**
 * مسیرهای مدیریت آیتم‌ها
 * این فایل شامل مسیرهای لازم برای مدیریت آیتم‌های بازی است
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../db');

// تعداد نتیجه در هر صفحه
const PAGE_SIZE = 10;

/**
 * صفحه لیست آیتم‌ها
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;
        
        // دریافت تعداد کل آیتم‌ها
        const totalItems = await db.getItemsCount();
        
        // محاسبه تعداد کل صفحات
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        
        // دریافت لیست آیتم‌ها با پاگینیشن
        const items = await db.getAllItems(skip, PAGE_SIZE);
        
        // اطلاعات پاگینیشن
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        res.render('items/index', { 
            title: 'مدیریت آیتم‌ها',
            items,
            pagination,
            active: 'items'
        });
    } catch (error) {
        console.error('خطا در دریافت لیست آیتم‌ها:', error);
        req.flash('error', 'خطا در دریافت لیست آیتم‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت لیست آیتم‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه جستجوی آیتم‌ها
 */
router.get('/search', isAuthenticated, async (req, res) => {
    try {
        const searchTerm = req.query.term || '';
        
        if (!searchTerm.trim()) {
            return res.redirect('/items');
        }
        
        // جستجوی آیتم‌ها
        const items = await db.searchItems(searchTerm);
        
        res.render('items/search', { 
            title: 'جستجوی آیتم‌ها',
            items,
            searchTerm,
            active: 'items'
        });
    } catch (error) {
        console.error('خطا در جستجوی آیتم‌ها:', error);
        req.flash('error', 'خطا در جستجوی آیتم‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در جستجوی آیتم‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه ایجاد آیتم جدید
 */
router.get('/create', isAuthenticated, async (req, res) => {
    try {
        res.render('items/create', { 
            title: 'ایجاد آیتم جدید',
            active: 'items'
        });
    } catch (error) {
        console.error('خطا در نمایش صفحه ایجاد آیتم:', error);
        req.flash('error', 'خطا در نمایش صفحه ایجاد آیتم');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در نمایش صفحه ایجاد آیتم',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش ایجاد آیتم جدید
 */
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const { 
            name, 
            description, 
            type, 
            price, 
            crystalPrice, 
            duration, 
            effects,
            icon,
            rarity
        } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!name || !type) {
            req.flash('error', 'نام و نوع آیتم الزامی است');
            return res.redirect('/items/create');
        }
        
        // ایجاد آیتم جدید
        const itemEffects = {};
        
        // پردازش افکت‌های آیتم
        if (effects) {
            try {
                // اگر افکت‌ها به صورت JSON ارسال شده باشند
                const parsedEffects = JSON.parse(effects);
                Object.assign(itemEffects, parsedEffects);
            } catch (e) {
                // اگر به صورت JSON نباشد، ممکن است به صورت فرم ارسال شده باشد
                if (req.body.robberyChance) {
                    itemEffects.robberyChance = parseFloat(req.body.robberyChance);
                }
                if (req.body.shopDiscount) {
                    itemEffects.shopDiscount = parseFloat(req.body.shopDiscount);
                }
                if (req.body.dailyBonus) {
                    itemEffects.dailyBonus = parseFloat(req.body.dailyBonus);
                }
                if (req.body.wheelChance) {
                    itemEffects.wheelChance = parseFloat(req.body.wheelChance);
                }
            }
        }
        
        const newItem = await db.createItem({
            name,
            description,
            type,
            price: parseInt(price) || 0,
            crystalPrice: parseInt(crystalPrice) || 0,
            duration: parseInt(duration) || 0,
            effects: itemEffects,
            icon: icon || 'default_icon.png',
            rarity: rarity || 'common'
        });
        
        req.flash('success', 'آیتم جدید با موفقیت ایجاد شد');
        res.redirect(`/items/${newItem.id}`);
    } catch (error) {
        console.error('خطا در ایجاد آیتم جدید:', error);
        req.flash('error', 'خطا در ایجاد آیتم جدید');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در ایجاد آیتم جدید',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه مشاهده جزئیات آیتم
 */
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        
        // دریافت اطلاعات آیتم
        const item = await db.getItem(itemId);
        
        if (!item) {
            req.flash('error', 'آیتم مورد نظر یافت نشد');
            return res.redirect('/items');
        }
        
        // دریافت کاربرانی که این آیتم را دارند
        const itemOwners = await db.getItemOwners(itemId);
        
        res.render('items/view', { 
            title: `آیتم ${item.name}`,
            item,
            itemOwners,
            active: 'items'
        });
    } catch (error) {
        console.error('خطا در دریافت اطلاعات آیتم:', error);
        req.flash('error', 'خطا در دریافت اطلاعات آیتم');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات آیتم',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه ویرایش آیتم
 */
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        
        // دریافت اطلاعات آیتم
        const item = await db.getItem(itemId);
        
        if (!item) {
            req.flash('error', 'آیتم مورد نظر یافت نشد');
            return res.redirect('/items');
        }
        
        res.render('items/edit', { 
            title: `ویرایش آیتم ${item.name}`,
            item,
            active: 'items'
        });
    } catch (error) {
        console.error('خطا در دریافت اطلاعات آیتم برای ویرایش:', error);
        req.flash('error', 'خطا در دریافت اطلاعات آیتم');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات آیتم برای ویرایش',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش ویرایش آیتم
 */
router.post('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        const { 
            name, 
            description, 
            type, 
            price, 
            crystalPrice, 
            duration, 
            effects,
            icon,
            rarity
        } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!name || !type) {
            req.flash('error', 'نام و نوع آیتم الزامی است');
            return res.redirect(`/items/${itemId}/edit`);
        }
        
        // پردازش افکت‌های آیتم
        const itemEffects = {};
        
        if (effects) {
            try {
                // اگر افکت‌ها به صورت JSON ارسال شده باشند
                const parsedEffects = JSON.parse(effects);
                Object.assign(itemEffects, parsedEffects);
            } catch (e) {
                // اگر به صورت JSON نباشد، ممکن است به صورت فرم ارسال شده باشد
                if (req.body.robberyChance) {
                    itemEffects.robberyChance = parseFloat(req.body.robberyChance);
                }
                if (req.body.shopDiscount) {
                    itemEffects.shopDiscount = parseFloat(req.body.shopDiscount);
                }
                if (req.body.dailyBonus) {
                    itemEffects.dailyBonus = parseFloat(req.body.dailyBonus);
                }
                if (req.body.wheelChance) {
                    itemEffects.wheelChance = parseFloat(req.body.wheelChance);
                }
            }
        }
        
        // بروزرسانی اطلاعات آیتم
        await db.updateItem(itemId, {
            name,
            description,
            type,
            price: parseInt(price) || 0,
            crystalPrice: parseInt(crystalPrice) || 0,
            duration: parseInt(duration) || 0,
            effects: itemEffects,
            icon: icon || 'default_icon.png',
            rarity: rarity || 'common'
        });
        
        req.flash('success', 'اطلاعات آیتم با موفقیت بروزرسانی شد');
        res.redirect(`/items/${itemId}`);
    } catch (error) {
        console.error('خطا در بروزرسانی اطلاعات آیتم:', error);
        req.flash('error', 'خطا در بروزرسانی اطلاعات آیتم');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی اطلاعات آیتم',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش حذف آیتم
 */
router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        
        // دریافت اطلاعات آیتم قبل از حذف (برای نمایش پیام)
        const item = await db.getItem(itemId);
        
        if (!item) {
            req.flash('error', 'آیتم مورد نظر یافت نشد');
            return res.redirect('/items');
        }
        
        // حذف آیتم
        await db.deleteItem(itemId);
        
        req.flash('success', `آیتم "${item.name}" با موفقیت حذف شد`);
        res.redirect('/items');
    } catch (error) {
        console.error('خطا در حذف آیتم:', error);
        req.flash('error', 'خطا در حذف آیتم');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در حذف آیتم',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش آپلود آیکون آیتم
 */
router.post('/:id/upload-icon', isAuthenticated, async (req, res) => {
    // در صورتی که از multer برای آپلود استفاده می‌کنید
    try {
        const itemId = parseInt(req.params.id);
        
        if (!req.file) {
            req.flash('error', 'فایلی برای آپلود انتخاب نشده است');
            return res.redirect(`/items/${itemId}`);
        }
        
        // در این نمونه فرض می‌کنیم که فایل با multer آپلود شده و در req.file قرار دارد
        const iconPath = req.file.filename;
        
        // بروزرسانی آیکون آیتم
        await db.updateItem(itemId, { icon: iconPath });
        
        req.flash('success', 'آیکون آیتم با موفقیت بروزرسانی شد');
        res.redirect(`/items/${itemId}`);
    } catch (error) {
        console.error('خطا در آپلود آیکون آیتم:', error);
        req.flash('error', 'خطا در آپلود آیکون آیتم');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در آپلود آیکون آیتم',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;