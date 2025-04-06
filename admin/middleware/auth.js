/**
 * میدلور احراز هویت
 * 
 * این میدلور برای مدیریت احراز هویت کاربران و بررسی دسترسی‌ها استفاده می‌شود.
 */

/**
 * هدایت به صفحه داشبورد در صورت احراز هویت قبلی کاربر
 * (برای صفحات ورود و ثبت‌نام)
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next اکسپرس
 */
export function redirectIfAuthenticated(req, res, next) {
  if (req.session.user && req.session.isAuthenticated) {
    console.log('🔄 کاربر قبلاً وارد سیستم شده است، هدایت به داشبورد...');
    return res.redirect('/admin/dashboard');
  }
  next();
}

/**
 * بررسی احراز هویت کاربر
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next اکسپرس
 */
export function checkAuth(req, res, next) {
  console.log('🔒 بررسی احراز هویت کاربر...');
  console.log('📝 مسیر درخواست شده:', req.path);
  console.log('📝 اطلاعات نشست:', req.session);
  
  // بررسی وجود کاربر و تأیید احراز هویت در نشست
  if (!req.session.user || !req.session.isAuthenticated) {
    console.log('❌ کاربر احراز هویت نشده است');
    req.flash('error', 'برای دسترسی به این صفحه، لطفاً وارد شوید');
    
    // اطمینان از پاک شدن اطلاعات نشست در صورت ناسازگاری
    req.session.user = null;
    req.session.isAuthenticated = false;
    req.session.isAdmin = false;
    
    return res.redirect('/admin/login');
  }
  
  console.log('✅ کاربر احراز هویت شده است:', req.session.user.username);
  
  // ادامه به صفحه بعدی
  next();
}

/**
 * بررسی مجوز دسترسی کاربر
 * 
 * @param {string} permission مجوز مورد نیاز
 * @returns {Function} میدلور اکسپرس
 */
export function checkPermission(permission) {
  return (req, res, next) => {
    // اگر کاربر وجود نداشت یا احراز هویت نشده بود، به صفحه ورود هدایت شود
    if (!req.session.user || !req.session.isAuthenticated) {
      req.flash('error', 'برای دسترسی به این صفحه، لطفاً وارد شوید');
      return res.redirect('/admin/login');
    }
    
    // بررسی وجود دسترسی مورد نیاز
    const userPermissions = req.session.user.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      console.log(`❌ کاربر "${req.session.user.username}" دسترسی "${permission}" را ندارد`);
      req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
      return res.redirect('/admin/dashboard');
    }
    
    console.log(`✅ کاربر "${req.session.user.username}" دسترسی "${permission}" را دارد`);
    
    // ادامه به صفحه بعدی
    next();
  };
}

/**
 * بررسی نقش کاربر
 * 
 * @param {string|Array<string>} roles نقش‌های مجاز
 * @returns {Function} میدلور اکسپرس
 */
export function checkRole(roles) {
  return (req, res, next) => {
    // اگر کاربر وجود نداشت یا احراز هویت نشده بود، به صفحه ورود هدایت شود
    if (!req.session.user || !req.session.isAuthenticated) {
      req.flash('error', 'برای دسترسی به این صفحه، لطفاً وارد شوید');
      return res.redirect('/admin/login');
    }
    
    // تبدیل به آرایه اگر یک رشته است
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // بررسی وجود نقش مورد نیاز
    const userRole = req.session.user.role || '';
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ کاربر "${req.session.user.username}" نقش "${userRole}" را ندارد (مجاز: ${allowedRoles.join(', ')})`);
      req.flash('error', 'شما دسترسی لازم برای این عملیات را ندارید');
      return res.redirect('/admin/dashboard');
    }
    
    console.log(`✅ کاربر "${req.session.user.username}" نقش "${userRole}" را دارد`);
    
    // ادامه به صفحه بعدی
    next();
  };
}

/**
 * بررسی وضعیت احراز هویت کاربر
 * این تابع کمکی است و میدلور نیست
 * 
 * @param {Request} req درخواست اکسپرس
 * @returns {boolean} وضعیت احراز هویت
 */
export function isAuthenticated(req) {
  return !!(req.session.user && req.session.isAuthenticated);
}

/**
 * تنظیم متغیرهای مشترک برای همه قالب‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next اکسپرس
 */
export function setLocals(req, res, next) {
  // تنظیم متغیرهای flash
  res.locals.messages = req.flash();
  
  // تنظیم اطلاعات کاربر
  res.locals.user = req.session.user || null;
  
  // تنظیم مسیر فعلی
  res.locals.currentRoute = req.path;
  
  // ادامه به صفحه بعدی
  next();
}