/**
 * میدل‌ور احراز هویت
 * 
 * این ماژول برای بررسی وضعیت احراز هویت کاربران در پنل ادمین استفاده می‌شود.
 */

/**
 * بررسی احراز هویت کاربر
 * اگر کاربر لاگین نکرده باشد، به صفحه لاگین هدایت می‌شود.
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next
 */
export function authMiddleware(req, res, next) {
  if (req.session && req.session.isAuthenticated && req.session.user) {
    // کاربر احراز هویت شده است
    res.locals.currentUser = req.session.user;
    return next();
  }
  
  // ذخیره URL اصلی برای بازگشت بعد از لاگین
  if (req.method === 'GET' && !req.path.startsWith('/auth')) {
    req.session.returnTo = req.originalUrl;
  }
  
  // کاربر احراز هویت نشده است، به صفحه لاگین هدایت می‌شود
  return res.redirect('/admin/auth/login');
}

/**
 * بررسی میهمان بودن کاربر
 * اگر کاربر لاگین کرده باشد، به داشبورد هدایت می‌شود.
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next
 */
export function guestMiddleware(req, res, next) {
  if (req.session && req.session.isAuthenticated && req.session.user) {
    // کاربر لاگین کرده است، به داشبورد هدایت می‌شود
    return res.redirect('/admin/dashboard');
  }
  
  // کاربر میهمان است، ادامه
  return next();
}

/**
 * بررسی دسترسی کاربر
 * 
 * @param {string|string[]} permissions مجوزهای مورد نیاز
 * @returns {Function} میدل‌ور بررسی دسترسی
 */
export function hasPermission(permissions) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/admin/auth/login');
    }
    
    const userPermissions = req.session.user.permissions || [];
    
    // اگر کاربر مدیر ارشد است، دسترسی کامل دارد
    if (req.session.user.isSuperAdmin) {
      return next();
    }
    
    // تبدیل مجوزهای تکی به آرایه
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    // بررسی وجود حداقل یکی از مجوزهای مورد نیاز
    const hasRequired = requiredPermissions.some(permission => userPermissions.includes(permission));
    
    if (hasRequired) {
      return next();
    }
    
    // عدم دسترسی
    req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
    return res.redirect('/admin/dashboard');
  };
}

/**
 * بررسی دسترسی کاربر به بخش خاص
 * این تابع به عنوان alias برای hasPermission استفاده می‌شود
 * 
 * @param {string} section بخش مورد نظر (users, economy, etc.)
 * @returns {Function} میدل‌ور بررسی دسترسی
 */
export function checkPermissions(section) {
  const permissionKey = `${section}:view`;
  return hasPermission(permissionKey);
}

/**
 * ثبت اطلاعات درخواست
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next
 */
export function logRequestMiddleware(req, res, next) {
  if (req.session && req.session.user) {
    const { method, originalUrl, ip } = req;
    const userId = req.session.user._id;
    
    // ثبت درخواست در لاگ سیستم
    // در حالت واقعی باید در دیتابیس ذخیره شود
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - User: ${userId} - IP: ${ip}`);
  }
  
  next();
}

/**
 * بررسی وضعیت کاربر (فعال بودن و قفل نبودن)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next
 */
export function checkUserStatusMiddleware(req, res, next) {
  if (req.session && req.session.user) {
    const { isActive, isLocked } = req.session.user;
    
    if (!isActive) {
      // حساب کاربری غیرفعال شده است
      req.session.destroy();
      return res.redirect('/admin/auth/login?error=account_inactive');
    }
    
    if (isLocked) {
      // حساب کاربری قفل شده است
      req.session.destroy();
      return res.redirect('/admin/auth/login?error=account_locked');
    }
  }
  
  next();
}

// صادر کردن میدل‌ورها
export default {
  authMiddleware,
  guestMiddleware,
  hasPermission,
  checkPermissions,
  logRequestMiddleware,
  checkUserStatusMiddleware
};