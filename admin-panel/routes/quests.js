/**
 * مسیرهای مدیریت ماموریت‌ها
 * این فایل شامل مسیرهای لازم برای مدیریت ماموریت‌ها است
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../db');

// تعداد نتیجه در هر صفحه
const PAGE_SIZE = 10;

/**
 * صفحه لیست ماموریت‌ها
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;
        
        // دریافت تعداد کل ماموریت‌ها
        const totalItems = await db.getQuestsCount();
        
        // محاسبه تعداد کل صفحات
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        
        // دریافت لیست ماموریت‌ها با پاگینیشن
        const quests = await db.getAllQuests(skip, PAGE_SIZE);
        
        // اطلاعات پاگینیشن
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        
        // دریافت آمار ماموریت‌ها
        const stats = {
            total: totalItems,
            active: await db.getActiveQuestsCount(),
            completed: await db.getCompletedQuestsCount(30),
            dailyCompleted: await db.getCompletedQuestsCount(1)
        };
        
        res.render('quests/index', { 
            title: 'مدیریت ماموریت‌ها',
            quests,
            pagination,
            stats,
            active: 'quests'
        });
    } catch (error) {
        console.error('خطا در دریافت لیست ماموریت‌ها:', error);
        req.flash('error', 'خطا در دریافت لیست ماموریت‌ها');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت لیست ماموریت‌ها',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه ایجاد ماموریت جدید
 */
router.get('/create', isAuthenticated, async (req, res) => {
    try {
        res.render('quests/create', { 
            title: 'ایجاد ماموریت جدید',
            active: 'quests'
        });
    } catch (error) {
        console.error('خطا در نمایش صفحه ایجاد ماموریت:', error);
        req.flash('error', 'خطا در نمایش صفحه ایجاد ماموریت');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در نمایش صفحه ایجاد ماموریت',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش ایجاد ماموریت جدید
 */
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const { title, description, type, minLevel, requirement, targetAmount, reward } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!title || !type || !targetAmount || !reward) {
            req.flash('error', 'تمام فیلدهای ضروری باید پر شوند');
            return res.redirect('/quests/create');
        }
        
        // ایجاد ماموریت جدید
        const newQuest = await db.createQuest({
            title,
            description,
            type,
            minLevel: parseInt(minLevel) || 1,
            requirement,
            targetAmount: parseInt(targetAmount),
            reward: parseInt(reward),
            active: true
        });
        
        req.flash('success', 'ماموریت جدید با موفقیت ایجاد شد');
        res.redirect(`/quests/${newQuest.id}`);
    } catch (error) {
        console.error('خطا در ایجاد ماموریت جدید:', error);
        req.flash('error', 'خطا در ایجاد ماموریت جدید');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در ایجاد ماموریت جدید',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه مشاهده جزئیات ماموریت
 */
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        
        // دریافت اطلاعات ماموریت
        const quest = await db.getQuest(questId);
        
        if (!quest) {
            req.flash('error', 'ماموریت مورد نظر یافت نشد');
            return res.redirect('/quests');
        }
        
        // دریافت کاربرانی که این ماموریت را دارند
        const userQuests = await db.getUsersWithQuest(questId);
        
        res.render('quests/view', { 
            title: `ماموریت ${quest.title}`,
            quest,
            userQuests,
            active: 'quests'
        });
    } catch (error) {
        console.error('خطا در دریافت اطلاعات ماموریت:', error);
        req.flash('error', 'خطا در دریافت اطلاعات ماموریت');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات ماموریت',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * صفحه ویرایش ماموریت
 */
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        
        // دریافت اطلاعات ماموریت
        const quest = await db.getQuest(questId);
        
        if (!quest) {
            req.flash('error', 'ماموریت مورد نظر یافت نشد');
            return res.redirect('/quests');
        }
        
        res.render('quests/edit', { 
            title: `ویرایش ماموریت ${quest.title}`,
            quest,
            active: 'quests'
        });
    } catch (error) {
        console.error('خطا در دریافت اطلاعات ماموریت برای ویرایش:', error);
        req.flash('error', 'خطا در دریافت اطلاعات ماموریت');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در دریافت اطلاعات ماموریت برای ویرایش',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش ویرایش ماموریت
 */
router.post('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        const { title, description, type, minLevel, requirement, targetAmount, reward, active } = req.body;
        
        // بررسی اعتبار داده‌ها
        if (!title || !type || !targetAmount || !reward) {
            req.flash('error', 'تمام فیلدهای ضروری باید پر شوند');
            return res.redirect(`/quests/${questId}/edit`);
        }
        
        // بروزرسانی اطلاعات ماموریت
        await db.updateQuest(questId, {
            title,
            description,
            type,
            minLevel: parseInt(minLevel) || 1,
            requirement,
            targetAmount: parseInt(targetAmount),
            reward: parseInt(reward),
            active: active === 'on' || active === true
        });
        
        req.flash('success', 'اطلاعات ماموریت با موفقیت بروزرسانی شد');
        res.redirect(`/quests/${questId}`);
    } catch (error) {
        console.error('خطا در بروزرسانی اطلاعات ماموریت:', error);
        req.flash('error', 'خطا در بروزرسانی اطلاعات ماموریت');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی اطلاعات ماموریت',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش تغییر وضعیت ماموریت (فعال/غیرفعال)
 */
router.post('/:id/toggle-status', isAuthenticated, async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        
        // دریافت اطلاعات ماموریت
        const quest = await db.getQuest(questId);
        
        if (!quest) {
            req.flash('error', 'ماموریت مورد نظر یافت نشد');
            return res.redirect('/quests');
        }
        
        // تغییر وضعیت ماموریت
        const newStatus = !quest.active;
        await db.updateQuest(questId, { active: newStatus });
        
        req.flash('success', `وضعیت ماموریت به ${newStatus ? 'فعال' : 'غیرفعال'} تغییر یافت`);
        res.redirect(`/quests/${questId}`);
    } catch (error) {
        console.error('خطا در تغییر وضعیت ماموریت:', error);
        req.flash('error', 'خطا در تغییر وضعیت ماموریت');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در تغییر وضعیت ماموریت',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش حذف ماموریت
 */
router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        
        // دریافت اطلاعات ماموریت قبل از حذف (برای نمایش پیام)
        const quest = await db.getQuest(questId);
        
        if (!quest) {
            req.flash('error', 'ماموریت مورد نظر یافت نشد');
            return res.redirect('/quests');
        }
        
        // حذف ماموریت
        await db.deleteQuest(questId);
        
        req.flash('success', `ماموریت "${quest.title}" با موفقیت حذف شد`);
        res.redirect('/quests');
    } catch (error) {
        console.error('خطا در حذف ماموریت:', error);
        req.flash('error', 'خطا در حذف ماموریت');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در حذف ماموریت',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش اختصاص ماموریت به کاربر
 */
router.post('/:id/assign', isAuthenticated, async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        const { userId } = req.body;
        
        if (!userId) {
            req.flash('error', 'کاربر مورد نظر انتخاب نشده است');
            return res.redirect(`/quests/${questId}`);
        }
        
        // اختصاص ماموریت به کاربر
        await db.assignQuestToUser(questId, parseInt(userId));
        
        req.flash('success', 'ماموریت با موفقیت به کاربر اختصاص داده شد');
        res.redirect(`/quests/${questId}`);
    } catch (error) {
        console.error('خطا در اختصاص ماموریت به کاربر:', error);
        req.flash('error', 'خطا در اختصاص ماموریت به کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در اختصاص ماموریت به کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

/**
 * پردازش بروزرسانی پیشرفت ماموریت کاربر
 */
router.post('/:questId/update-progress/:userId', isAuthenticated, async (req, res) => {
    try {
        const questId = parseInt(req.params.questId);
        const userId = parseInt(req.params.userId);
        const { progress, completed } = req.body;
        
        // بروزرسانی پیشرفت ماموریت کاربر
        await db.updateUserQuestProgress(
            userId, 
            questId, 
            parseInt(progress), 
            completed === 'on' || completed === true
        );
        
        req.flash('success', 'پیشرفت ماموریت کاربر با موفقیت بروزرسانی شد');
        res.redirect(`/quests/${questId}`);
    } catch (error) {
        console.error('خطا در بروزرسانی پیشرفت ماموریت کاربر:', error);
        req.flash('error', 'خطا در بروزرسانی پیشرفت ماموریت کاربر');
        res.status(500).render('error', { 
            title: 'خطای سرور',
            message: 'خطا در بروزرسانی پیشرفت ماموریت کاربر',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;