/**
 * میدلویر‌های احراز هویت پنل ادمین
 */

/**
 * بررسی احراز هویت کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next میدلویر بعدی
 */
export function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  // ذخیره URL درخواست شده برای بازگشت بعد از لاگین
  req.session.returnTo = req.originalUrl;
  
  req.flash('error', 'لطفاً ابتدا وارد حساب کاربری خود شوید');
  res.redirect('/admin/login');
}

/**
 * ریدایرکت کاربر احراز هویت شده به داشبورد
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next میدلویر بعدی
 */
export function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی‌های کاربر
 * @param {String} resource منبع مورد نیاز دسترسی
 * @param {String} action عملیات مورد نیاز (view, create, edit, delete)
 * @returns {Function} میدلویر بررسی دسترسی
 */
export function hasPermission(resource, action = 'view') {
  return (req, res, next) => {
    const user = req.session.user;
    
    if (!user) {
      req.flash('error', 'لطفاً ابتدا وارد حساب کاربری خود شوید');
      return res.redirect('/admin/login');
    }
    
    const requiredPermission = `${resource}:${action}`;
    
    // بررسی دسترسی کاربر
    if (user.permissions && user.permissions.includes(requiredPermission)) {
      return next();
    }
    
    req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
    return res.redirect('/admin/dashboard');
  };
}

/**
 * بررسی دسترسی‌های کاربر برای یک بخش
 * @param {String} resource منبع مورد نیاز دسترسی
 * @returns {Function} میدلویر بررسی دسترسی
 */
export function checkPermissions(resource) {
  return (req, res, next) => {
    const user = req.session.user;
    
    if (!user) {
      req.flash('error', 'لطفاً ابتدا وارد حساب کاربری خود شوید');
      return res.redirect('/admin/login');
    }
    
    // بررسی حداقل یک دسترسی برای این بخش
    const hasAnyPermission = user.permissions && user.permissions.some(p => p.startsWith(`${resource}:`));
    
    if (hasAnyPermission) {
      // اضافه کردن توابع کمکی بررسی دسترسی به res.locals
      res.locals.can = (action) => {
        const permission = `${resource}:${action}`;
        return user.permissions.includes(permission);
      };
      
      res.locals.hasPermission = (permission) => {
        return user.permissions && user.permissions.includes(permission);
      };
      
      res.locals.hasAnyPermission = (permissions) => {
        if (!user.permissions) return false;
        return permissions.some(permission => user.permissions.includes(permission));
      };
      
      res.locals.hasAllPermissions = (permissions) => {
        if (!user.permissions) return false;
        return permissions.every(permission => user.permissions.includes(permission));
      };
      
      return next();
    }
    
    req.flash('error', 'شما دسترسی لازم برای این بخش را ندارید');
    return res.redirect('/admin/dashboard');
  };
}

/**
 * بررسی اینکه کاربر مدیر ارشد است یا خیر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next میدلویر بعدی
 */
export function isSuperAdmin(req, res, next) {
  const user = req.session.user;
  
  if (!user) {
    req.flash('error', 'لطفاً ابتدا وارد حساب کاربری خود شوید');
    return res.redirect('/admin/login');
  }
  
  // بررسی دسترسی مدیر ارشد (مثلاً با برخی دسترسی‌های خاص)
  const superAdminPermissions = [
    'admins:view', 'admins:create', 'admins:edit', 'admins:delete',
    'settings:view', 'settings:edit'
  ];
  
  const isSuperAdmin = superAdminPermissions.every(permission => 
    user.permissions.includes(permission)
  );
  
  if (isSuperAdmin) {
    return next();
  }
  
  req.flash('error', 'این عملیات فقط توسط مدیر ارشد قابل انجام است');
  return res.redirect('/admin/dashboard');
}

// اکسپورت میدلویر اصلی برای استفاده به عنوان محافظ کلی مسیرها
export const authMiddleware = isAuthenticated;
