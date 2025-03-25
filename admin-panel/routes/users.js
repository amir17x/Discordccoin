/**
 * مسیرهای مدیریت کاربران
 * این فایل شامل مسیرهای لازم برای مدیریت کاربران است
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../db');

// تعداد نتیجه در هر صفحه
const PAGE_SIZE = 10;

/**
 * صفحه لیست کاربران
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;
        
        // دریافت تعداد کل کاربران
        const totalItems = await db.getUsersCount();
        
        // محاسبه تعداد کل صفحات
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        
        // دریافت لیست کاربران با پاگینیشن
        const users = await db.getUsers(skip, PAGE_SIZE);
        
        // اطلاعات پاگینیشن
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        res.render('users/index', { 
            title: 'مدیریت کاربران',
            users,
            pagination,
            active: 'users'
        });
    } catch (error) {
        console.error('خطا در دریافت لیست کاربران:', error);
        req.flash('error', 'خطا در دریافت لیست کاربران');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت لیست کاربران',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه جستجوی کاربران
 */
router.get('/search', isAuthenticated, async (req, res) => {
    try {
        const searchTerm = req.query.term || '';
        
        if (!searchTerm.trim()) {
            return res.redirect('/users');
        }
        
        // جستجوی کاربران
        const users = await db.searchUsers(searchTerm);
        
        res.render('users/search', { 
            title: 'جستجوی کاربران',
            users,
            searchTerm,
            active: 'users'
        });
    } catch (error) {
        console.error('خطا در جستجوی کاربران:', error);
        req.flash('error', 'خطا در جستجوی کاربران');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در جستجوی کاربران',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه مشاهده جزئیات کاربر
 */
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // دریافت اطلاعات کاربر
        const user = await db.getUserById(userId);
        
        if (!user) {
            req.flash('error', 'کاربر مورد نظر یافت نشد');
            return res.redirect('/users');
        }
        
        // دریافت تراکنش‌های کاربر
        const transactions = await db.getUserTransactions(userId);
        
        // دریافت اطلاعات کلن کاربر (اگر در کلنی عضو باشد)
        let clan = null;
        if (user.clanId) {
            clan = await db.getClanById(user.clanId);
        }
        
        // دریافت بازی‌های کاربر
        const games = await db.getUserGames(userId, 10);
        
        // دریافت ماموریت‌های کاربر
        const quests = await db.getUserQuests(userId);
        
        // دریافت آیتم‌های کاربر
        const inventory = await db.getInventoryItems(userId);
        
        res.render('users/view', { 
            title: `کاربر ${user.username}`,
            user,
            transactions,
            clan,
            games,
            quests,
            inventory,
            active: 'users'
        });
    } catch (error) {
        console.error('خطا در دریافت اطلاعات کاربر:', error);
        req.flash('error', 'خطا در دریافت اطلاعات کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه ویرایش کاربر
 */
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // دریافت اطلاعات کاربر
        const user = await db.getUserById(userId);
        
        if (!user) {
            req.flash('error', 'کاربر مورد نظر یافت نشد');
            return res.redirect('/users');
        }
        
        // دریافت لیست کلن‌ها (برای تغییر کلن کاربر)
        const clans = await db.getClans(0, 100);
        
        res.render('users/edit', { 
            title: `ویرایش کاربر ${user.username}`,
            user,
            clans,
            active: 'users'
        });
    } catch (error) {
        console.error('خطا در دریافت اطلاعات کاربر برای ویرایش:', error);
        req.flash('error', 'خطا در دریافت اطلاعات کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات کاربر برای ویرایش',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش ویرایش کاربر
 */
router.post('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { username, wallet, bank, crystals, level, experience, clanId } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!username) {
            req.flash('error', 'نام کاربری نمی‌تواند خالی باشد');
            return res.redirect(`/users/${userId}/edit`);
        }
        
        // بروزرسانی اطلاعات کاربر
        await db.updateUser(userId, {
            username,
            wallet: parseFloat(wallet) || 0,
            bank: parseFloat(bank) || 0,
            crystals: parseInt(crystals) || 0,
            level: parseInt(level) || 1,
            experience: parseInt(experience) || 0,
            clanId: clanId ? parseInt(clanId) : null
        });
        
        req.flash('success', 'اطلاعات کاربر با موفقیت بروزرسانی شد');
        res.redirect(`/users/${userId}`);
    } catch (error) {
        console.error('خطا در بروزرسانی اطلاعات کاربر:', error);
        req.flash('error', 'خطا در بروزرسانی اطلاعات کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی اطلاعات کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش افزودن سکه/کریستال به کاربر
 */
router.post('/:id/add-currency', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { amount, type } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!amount || isNaN(parseInt(amount))) {
            req.flash('error', 'مقدار معتبری وارد کنید');
            return res.redirect(`/users/${userId}`);
        }
        
        const parsedAmount = parseInt(amount);
        
        // افزودن سکه/کریستال به کاربر
        if (type === 'wallet') {
            await db.addToWallet(userId, parsedAmount);
            req.flash('success', `${parsedAmount} سکه به کیف پول کاربر اضافه شد`);
        } else if (type === 'bank') {
            await db.addToBank(userId, parsedAmount);
            req.flash('success', `${parsedAmount} سکه به حساب بانکی کاربر اضافه شد`);
        } else if (type === 'crystals') {
            await db.addCrystals(userId, parsedAmount);
            req.flash('success', `${parsedAmount} کریستال به کاربر اضافه شد`);
        } else {
            req.flash('error', 'نوع ارز نامعتبر است');
        }
        
        res.redirect(`/users/${userId}`);
    } catch (error) {
        console.error('خطا در افزودن سکه/کریستال به کاربر:', error);
        req.flash('error', 'خطا در افزودن سکه/کریستال به کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در افزودن سکه/کریستال به کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش افزودن آیتم به کاربر
 */
router.post('/:id/add-item', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { itemId, quantity } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!itemId || isNaN(parseInt(itemId))) {
            req.flash('error', 'آیتم معتبری انتخاب کنید');
            return res.redirect(`/users/${userId}`);
        }
        
        const parsedItemId = parseInt(itemId);
        const parsedQuantity = parseInt(quantity) || 1;
        
        // افزودن آیتم به کاربر
        await db.addItemToInventory(userId, parsedItemId, parsedQuantity);
        
        // دریافت اطلاعات آیتم برای نمایش پیام
        const item = await db.getItem(parsedItemId);
        
        req.flash('success', `${parsedQuantity} عدد ${item.name} به انبار کاربر اضافه شد`);
        res.redirect(`/users/${userId}`);
    } catch (error) {
        console.error('خطا در افزودن آیتم به کاربر:', error);
        req.flash('error', 'خطا در افزودن آیتم به کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در افزودن آیتم به کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش تغییر وضعیت کاربر (فعال/غیرفعال)
 */
router.post('/:id/toggle-status', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // دریافت اطلاعات کاربر
        const user = await db.getUserById(userId);
        
        if (!user) {
            req.flash('error', 'کاربر مورد نظر یافت نشد');
            return res.redirect('/users');
        }
        
        // تغییر وضعیت کاربر
        const newStatus = !user.isActive;
        await db.updateUser(userId, { isActive: newStatus });
        
        req.flash('success', `وضعیت کاربر به ${newStatus ? 'فعال' : 'غیرفعال'} تغییر یافت`);
        res.redirect(`/users/${userId}`);
    } catch (error) {
        console.error('خطا در تغییر وضعیت کاربر:', error);
        req.flash('error', 'خطا در تغییر وضعیت کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در تغییر وضعیت کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش ریست کردن کاربر (پاک کردن سکه‌ها، آیتم‌ها و ...)
 */
router.post('/:id/reset', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // ریست کردن دارایی کاربر
        await db.resetUser(userId);
        
        req.flash('success', 'اطلاعات کاربر با موفقیت ریست شد');
        res.redirect(`/users/${userId}`);
    } catch (error) {
        console.error('خطا در ریست کردن کاربر:', error);
        req.flash('error', 'خطا در ریست کردن کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در ریست کردن کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش حذف کاربر
 */
router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // دریافت اطلاعات کاربر قبل از حذف (برای نمایش پیام)
        const user = await db.getUserById(userId);
        
        if (!user) {
            req.flash('error', 'کاربر مورد نظر یافت نشد');
            return res.redirect('/users');
        }
        
        // حذف کاربر
        await db.deleteUser(userId);
        
        req.flash('success', `کاربر "${user.username}" با موفقیت حذف شد`);
        res.redirect('/users');
    } catch (error) {
        console.error('خطا در حذف کاربر:', error);
        req.flash('error', 'خطا در حذف کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در حذف کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;