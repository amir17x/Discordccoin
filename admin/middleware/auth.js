/**
 * میان‌افزار احراز هویت برای پنل ادمین
 */

/**
 * بررسی ورود کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function authMiddleware(req, res, next) {
  if (!req.session.user) {
    req.flash('error_msg', 'برای دسترسی به این صفحه باید وارد شوید');
    return res.redirect('/admin/login');
  }
  next();
}

/**
 * بررسی دسترسی ادمین
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'شما دسترسی کافی برای این عملیات را ندارید');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی عدم ورود (برای صفحات ورود)
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function guestMiddleware(req, res, next) {
  if (req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی به بخش کاربران
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkUsersAccess(req, res, next) {
  if (!req.session.user || (!req.session.user.permissions?.users && req.session.user.role !== 'admin')) {
    req.flash('error_msg', 'شما دسترسی کافی برای مدیریت کاربران را ندارید');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی به بخش اقتصاد
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkEconomyAccess(req, res, next) {
  if (!req.session.user || (!req.session.user.permissions?.economy && req.session.user.role !== 'admin')) {
    req.flash('error_msg', 'شما دسترسی کافی برای مدیریت اقتصاد را ندارید');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی به بخش بازی‌ها
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkGamesAccess(req, res, next) {
  if (!req.session.user || (!req.session.user.permissions?.games && req.session.user.role !== 'admin')) {
    req.flash('error_msg', 'شما دسترسی کافی برای مدیریت بازی‌ها را ندارید');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی به بخش هوش مصنوعی
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkAIAccess(req, res, next) {
  if (!req.session.user || (!req.session.user.permissions?.ai && req.session.user.role !== 'admin')) {
    req.flash('error_msg', 'شما دسترسی کافی برای مدیریت هوش مصنوعی را ندارید');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی به بخش رویدادها
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkEventsAccess(req, res, next) {
  if (!req.session.user || (!req.session.user.permissions?.events && req.session.user.role !== 'admin')) {
    req.flash('error_msg', 'شما دسترسی کافی برای مدیریت رویدادها را ندارید');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی به بخش فروشگاه
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkShopAccess(req, res, next) {
  if (!req.session.user || (!req.session.user.permissions?.shop && req.session.user.role !== 'admin')) {
    req.flash('error_msg', 'شما دسترسی کافی برای مدیریت فروشگاه را ندارید');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی به بخش لاگ‌ها
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkLogsAccess(req, res, next) {
  if (!req.session.user || (!req.session.user.permissions?.logs && req.session.user.role !== 'admin')) {
    req.flash('error_msg', 'شما دسترسی کافی برای مشاهده لاگ‌ها را ندارید');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی دسترسی به بخش تنظیمات (فقط ادمین)
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function checkSettingsAccess(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error_msg', 'فقط ادمین اصلی مجاز به تغییر تنظیمات است');
    return res.redirect('/admin/dashboard');
  }
  next();
}