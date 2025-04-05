/**
 * میدل‌ویر احراز هویت و مجوزها
 * 
 * این میدل‌ویرها مسئول بررسی احراز هویت کاربر و مجوزهای دسترسی هستند.
 */

/**
 * بررسی احراز هویت کاربر
 * اگر کاربر وارد نشده باشد، به صفحه ورود هدایت می‌شود.
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {NextFunction} next تابع بعدی
 * @returns {void}
 */
export function authMiddleware(req, res, next) {
  // بررسی وجود کاربر در جلسه
  if (!req.session.user) {
    req.flash('error', 'برای دسترسی به این بخش، ابتدا وارد شوید.');
    return res.redirect('/admin/login');
  }
  
  next();
}

/**
 * بررسی مجوزهای دسترسی کاربر
 * 
 * @param {string} permission مجوز مورد نیاز
 * @returns {function} میدل‌ویر
 */
export function checkPermissions(permission) {
  return (req, res, next) => {
    // بررسی وجود کاربر در جلسه (اضافی برای اطمینان)
    if (!req.session.user) {
      req.flash('error', 'برای دسترسی به این بخش، ابتدا وارد شوید.');
      return res.redirect('/admin/login');
    }
    
    // بررسی وجود مجوز مورد نیاز
    const userPermissions = req.session.user.permissions || [];
    const isAdmin = req.session.user.role === 'admin';
    
    // اگر کاربر ادمین اصلی باشد، به همه‌چیز دسترسی دارد
    if (isAdmin) {
      return next();
    }
    
    // بررسی دسترسی
    if (userPermissions.includes(permission)) {
      return next();
    }
    
    // در صورت عدم دسترسی
    req.flash('error', 'شما مجوز دسترسی به این بخش را ندارید.');
    return res.redirect('/admin/dashboard');
  };
}

/**
 * بررسی نقش کاربر
 * 
 * @param {string[]} roles نقش‌های مجاز
 * @returns {function} میدل‌ویر
 */
export function checkRole(roles) {
  return (req, res, next) => {
    // بررسی وجود کاربر در جلسه
    if (!req.session.user) {
      req.flash('error', 'برای دسترسی به این بخش، ابتدا وارد شوید.');
      return res.redirect('/admin/login');
    }
    
    // بررسی نقش کاربر
    const userRole = req.session.user.role || 'user';
    
    if (roles.includes(userRole)) {
      return next();
    }
    
    // در صورت عدم دسترسی
    req.flash('error', 'شما مجوز دسترسی به این بخش را ندارید.');
    return res.redirect('/admin/dashboard');
  };
}