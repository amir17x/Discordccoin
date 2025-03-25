/**
 * میدلور احراز هویت
 * برای محافظت از مسیرهای پنل مدیریت استفاده می‌شود
 */

/**
 * بررسی اینکه آیا کاربر احراز هویت شده است یا خیر
 * در صورتی که کاربر احراز هویت نشده باشد، به صفحه ورود هدایت می‌شود
 * 
 * @param {object} req - شیء درخواست
 * @param {object} res - شیء پاسخ
 * @param {function} next - تابع ادامه پردازش درخواست
 */
const isAuthenticated = (req, res, next) => {
    // بررسی وجود کاربر در سشن
    if (req.session && req.session.user) {
        return next();
    }
    
    // ذخیره مسیر اصلی برای بازگشت بعد از ورود
    if (req.originalUrl !== '/auth/login' && !req.originalUrl.startsWith('/auth/') && req.method === 'GET') {
        req.session.returnTo = req.originalUrl;
    }
    
    // هدایت به صفحه ورود
    res.redirect('/auth/login');
};

/**
 * بررسی نقش کاربر
 * 
 * @param {string|string[]} roles - نقش یا نقش‌های مجاز
 * @returns {function} میدلور بررسی نقش
 */
const hasRole = (roles) => {
    return (req, res, next) => {
        // بررسی احراز هویت کاربر
        if (!req.session || !req.session.user) {
            req.flash('error', 'لطفاً ابتدا وارد شوید');
            return res.redirect('/auth/login');
        }
        
        // تبدیل roles به آرایه اگر آرایه نباشد
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        // بررسی نقش کاربر
        if (allowedRoles.includes(req.session.user.role)) {
            return next();
        }
        
        // عدم دسترسی
        req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
        res.redirect('/dashboard');
    };
};

module.exports = {
    isAuthenticated,
    hasRole
};