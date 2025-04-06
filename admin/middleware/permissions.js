/**
 * میدلور مدیریت دسترسی‌های کاربران
 * 
 * این ماژول میدلورهای مربوط به بررسی دسترسی‌های کاربران را ارائه می‌دهد.
 */

/**
 * بررسی وجود دسترسی خاص برای کاربر
 * @param {string} permission دسترسی مورد نیاز
 * @returns {Function} میدلور اکسپرس
 */
export function checkPermission(permission) {
  return (req, res, next) => {
    // بررسی وجود کاربر و دسترسی مورد نظر
    if (!req.user) {
      return res.redirect('/admin/login');
    }
    
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
      return res.redirect('/admin/dashboard');
    }
    
    next();
  };
}

/**
 * بررسی وجود یکی از دسترسی‌های مورد نظر
 * @param {Array<string>} permissions لیست دسترسی‌های مورد نیاز
 * @returns {Function} میدلور اکسپرس
 */
export function checkAnyPermission(permissions) {
  return (req, res, next) => {
    // بررسی وجود کاربر و دسترسی مورد نظر
    if (!req.user) {
      return res.redirect('/admin/login');
    }
    
    // بررسی وجود حداقل یکی از دسترسی‌ها
    const hasAccess = permissions.some(permission => 
      req.user.permissions && req.user.permissions.includes(permission)
    );
    
    if (!hasAccess) {
      req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
      return res.redirect('/admin/dashboard');
    }
    
    next();
  };
}

/**
 * بررسی وجود همه دسترسی‌های مورد نظر
 * @param {Array<string>} permissions لیست دسترسی‌های مورد نیاز
 * @returns {Function} میدلور اکسپرس
 */
export function checkAllPermissions(permissions) {
  return (req, res, next) => {
    // بررسی وجود کاربر و دسترسی مورد نظر
    if (!req.user) {
      return res.redirect('/admin/login');
    }
    
    // بررسی وجود تمام دسترسی‌ها
    const hasAllAccess = permissions.every(permission => 
      req.user.permissions && req.user.permissions.includes(permission)
    );
    
    if (!hasAllAccess) {
      req.flash('error', 'شما تمام دسترسی‌های لازم برای این عملیات را ندارید');
      return res.redirect('/admin/dashboard');
    }
    
    next();
  };
}

/**
 * افزودن وضعیت دسترسی‌ها به res.locals
 * این تابع به عنوان یک میدلور عمومی قابل استفاده است
 */
export function setPermissionStatus(req, res, next) {
  if (req.user && req.user.permissions) {
    // ایجاد تابع کمکی برای بررسی دسترسی در قالب‌ها
    res.locals.hasPermission = (permission) => req.user.permissions.includes(permission);
    res.locals.hasAnyPermission = (permissions) => permissions.some(p => req.user.permissions.includes(p));
    res.locals.hasAllPermissions = (permissions) => permissions.every(p => req.user.permissions.includes(p));
    
    // افزودن دسترسی‌های کاربر به locals
    res.locals.userPermissions = req.user.permissions;
  } else {
    // در صورت عدم وجود کاربر، توابع را به صورت false برمی‌گردانیم
    res.locals.hasPermission = () => false;
    res.locals.hasAnyPermission = () => false;
    res.locals.hasAllPermissions = () => false;
    res.locals.userPermissions = [];
  }
  
  next();
}