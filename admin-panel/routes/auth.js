/**
 * مسیرهای احراز هویت
 * این فایل شامل مسیرهای لازم برای احراز هویت و مدیریت کاربران پنل ادمین است
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { isAuthenticated } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// مسیر فایل کاربران ادمین
const ADMINS_PATH = process.env.ADMINS_PATH || path.join(__dirname, '..', 'data', 'admins.json');

// اطمینان از وجود دایرکتوری داده
const ensureDataDir = () => {
    const dataDir = path.dirname(ADMINS_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

// هش کردن پسورد
const hashPassword = (password, salt) => {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { hash, salt };
};

// بررسی صحت پسورد
const verifyPassword = (password, hash, salt) => {
    const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
};

// دریافت لیست کاربران ادمین
const getAdmins = () => {
    ensureDataDir();
    if (!fs.existsSync(ADMINS_PATH)) {
        return [];
    }
    const data = fs.readFileSync(ADMINS_PATH, 'utf8');
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('خطا در خواندن فایل کاربران ادمین:', e);
        return [];
    }
};

// ذخیره لیست کاربران ادمین
const saveAdmins = (admins) => {
    ensureDataDir();
    fs.writeFileSync(ADMINS_PATH, JSON.stringify(admins, null, 2), 'utf8');
};

// ایجاد کاربر ادمین پیش‌فرض اگر هیچ کاربری وجود نداشته باشد
const createDefaultAdmin = () => {
    const admins = getAdmins();
    if (admins.length === 0) {
        const { hash, salt } = hashPassword('admin');
        admins.push({
            id: 1,
            username: 'admin',
            passwordHash: hash,
            passwordSalt: salt,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        saveAdmins(admins);
        console.log('کاربر ادمین پیش‌فرض ایجاد شد (نام کاربری: admin، رمز عبور: admin)');
    }
};

// صفحه ورود
router.get('/login', (req, res) => {
    // اگر کاربر احراز هویت شده است، او را به داشبورد هدایت کن
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    
    createDefaultAdmin();
    
    res.render('auth/login', { 
        title: 'ورود به پنل مدیریت',
        layout: 'layouts/auth'
    });
});

// پردازش ورود
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // بررسی وجود نام کاربری و رمز عبور
    if (!username || !password) {
        req.flash('error', 'نام کاربری و رمز عبور الزامی است');
        return res.redirect('/auth/login');
    }
    
    // پیدا کردن کاربر
    const admins = getAdmins();
    const user = admins.find(u => u.username === username);
    
    if (!user) {
        req.flash('error', 'نام کاربری یا رمز عبور اشتباه است');
        return res.redirect('/auth/login');
    }
    
    // بررسی صحت رمز عبور
    if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
        req.flash('error', 'نام کاربری یا رمز عبور اشتباه است');
        return res.redirect('/auth/login');
    }
    
    // ذخیره اطلاعات کاربر در سشن
    req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
    };
    
    // بروزرسانی زمان آخرین ورود
    user.lastLogin = new Date().toISOString();
    saveAdmins(admins);
    
    // ثبت رویداد ورود
    console.log(`کاربر ${username} وارد پنل مدیریت شد`);
    
    res.redirect('/dashboard');
});

// خروج
router.get('/logout', (req, res) => {
    // ثبت رویداد خروج
    if (req.session.user) {
        console.log(`کاربر ${req.session.user.username} از پنل مدیریت خارج شد`);
    }
    
    // پاک کردن سشن
    req.session.destroy((err) => {
        if (err) {
            console.error('خطا در خروج از سیستم:', err);
        }
        res.redirect('/auth/login');
    });
});

// پروفایل کاربر
router.get('/profile', isAuthenticated, (req, res) => {
    res.render('auth/profile', { 
        title: 'پروفایل کاربری',
        user: req.session.user,
        active: 'profile'
    });
});

// پردازش تغییر رمز عبور
router.post('/change-password', isAuthenticated, (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // بررسی وجود تمام فیلدها
    if (!currentPassword || !newPassword || !confirmPassword) {
        req.flash('error', 'تمام فیلدها الزامی است');
        return res.redirect('/auth/profile');
    }
    
    // بررسی تطابق رمز عبور جدید با تکرار آن
    if (newPassword !== confirmPassword) {
        req.flash('error', 'رمز عبور جدید با تکرار آن مطابقت ندارد');
        return res.redirect('/auth/profile');
    }
    
    // بررسی طول رمز عبور جدید
    if (newPassword.length < 6) {
        req.flash('error', 'رمز عبور جدید باید حداقل 6 کاراکتر باشد');
        return res.redirect('/auth/profile');
    }
    
    // پیدا کردن کاربر
    const admins = getAdmins();
    const user = admins.find(u => u.id === req.session.user.id);
    
    if (!user) {
        req.flash('error', 'کاربر یافت نشد');
        return res.redirect('/auth/profile');
    }
    
    // بررسی صحت رمز عبور فعلی
    if (!verifyPassword(currentPassword, user.passwordHash, user.passwordSalt)) {
        req.flash('error', 'رمز عبور فعلی اشتباه است');
        return res.redirect('/auth/profile');
    }
    
    // تغییر رمز عبور
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.updatedAt = new Date().toISOString();
    
    // ذخیره تغییرات
    saveAdmins(admins);
    
    req.flash('success', 'رمز عبور با موفقیت تغییر یافت');
    res.redirect('/auth/profile');
});

// مدیریت کاربران ادمین (فقط برای کاربران با نقش ادمین)
router.get('/admins', isAuthenticated, (req, res) => {
    // بررسی نقش کاربر
    if (req.session.user.role !== 'admin') {
        req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
        return res.redirect('/dashboard');
    }
    
    const admins = getAdmins().map(user => ({
        ...user,
        passwordHash: undefined,
        passwordSalt: undefined
    }));
    
    res.render('auth/admins', { 
        title: 'مدیریت کاربران ادمین',
        admins,
        active: 'admins'
    });
});

// صفحه ایجاد کاربر ادمین جدید
router.get('/admins/create', isAuthenticated, (req, res) => {
    // بررسی نقش کاربر
    if (req.session.user.role !== 'admin') {
        req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
        return res.redirect('/dashboard');
    }
    
    res.render('auth/create-admin', { 
        title: 'ایجاد کاربر ادمین جدید',
        active: 'admins'
    });
});

// پردازش ایجاد کاربر ادمین جدید
router.post('/admins/create', isAuthenticated, (req, res) => {
    // بررسی نقش کاربر
    if (req.session.user.role !== 'admin') {
        req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
        return res.redirect('/dashboard');
    }
    
    const { username, password, confirmPassword, role } = req.body;
    
    // بررسی وجود تمام فیلدها
    if (!username || !password || !confirmPassword || !role) {
        req.flash('error', 'تمام فیلدها الزامی است');
        return res.redirect('/auth/admins/create');
    }
    
    // بررسی تطابق رمز عبور با تکرار آن
    if (password !== confirmPassword) {
        req.flash('error', 'رمز عبور با تکرار آن مطابقت ندارد');
        return res.redirect('/auth/admins/create');
    }
    
    // بررسی طول رمز عبور
    if (password.length < 6) {
        req.flash('error', 'رمز عبور باید حداقل 6 کاراکتر باشد');
        return res.redirect('/auth/admins/create');
    }
    
    // بررسی تکراری نبودن نام کاربری
    const admins = getAdmins();
    if (admins.some(u => u.username === username)) {
        req.flash('error', 'این نام کاربری قبلاً ثبت شده است');
        return res.redirect('/auth/admins/create');
    }
    
    // ایجاد کاربر جدید
    const { hash, salt } = hashPassword(password);
    const newAdmin = {
        id: admins.length > 0 ? Math.max(...admins.map(u => u.id)) + 1 : 1,
        username,
        passwordHash: hash,
        passwordSalt: salt,
        role,
        createdAt: new Date().toISOString(),
        createdBy: req.session.user.username
    };
    
    admins.push(newAdmin);
    saveAdmins(admins);
    
    req.flash('success', 'کاربر ادمین جدید با موفقیت ایجاد شد');
    res.redirect('/auth/admins');
});

// پردازش حذف کاربر ادمین
router.post('/admins/delete/:id', isAuthenticated, (req, res) => {
    // بررسی نقش کاربر
    if (req.session.user.role !== 'admin') {
        req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
        return res.redirect('/dashboard');
    }
    
    const id = parseInt(req.params.id);
    
    // عدم امکان حذف خود کاربر
    if (id === req.session.user.id) {
        req.flash('error', 'شما نمی‌توانید حساب کاربری خود را حذف کنید');
        return res.redirect('/auth/admins');
    }
    
    // پیدا کردن و حذف کاربر
    const admins = getAdmins();
    const index = admins.findIndex(u => u.id === id);
    
    if (index === -1) {
        req.flash('error', 'کاربر مورد نظر یافت نشد');
        return res.redirect('/auth/admins');
    }
    
    const deletedAdmin = admins.splice(index, 1)[0];
    saveAdmins(admins);
    
    req.flash('success', `کاربر ${deletedAdmin.username} با موفقیت حذف شد`);
    res.redirect('/auth/admins');
});

module.exports = router;