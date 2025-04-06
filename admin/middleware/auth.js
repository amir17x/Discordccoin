/**
 * میدلورهای احراز هویت
 */

import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/adminUser.js';
import { AdminRole } from '../models/adminRole.js';

/**
 * هدایت کاربر به داشبورد اگر قبلاً وارد شده باشد
 * این میدلور برای صفحاتی مانند ورود استفاده می‌شود
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function redirectIfAuthenticated(req, res, next) {
  console.log('🔄 بررسی وضعیت ورود کاربر برای هدایت مجدد...');
  
  if (req.session && req.session.user) {
    console.log(`✅ کاربر قبلاً وارد شده است: ${req.session.user.username}. هدایت به داشبورد...`);
    return res.redirect('/admin/dashboard');
  }
  
  console.log('👉 کاربر وارد نشده، نمایش صفحه درخواست شده...');
  next();
}

/**
 * بررسی احراز هویت کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function isAuthenticated(req, res, next) {
  console.log('🔒 بررسی احراز هویت کاربر...');
  console.log('📝 مسیر درخواست شده:', req.originalUrl);
  
  // مسیرهایی که نیاز به احراز هویت ندارند
  const publicPaths = [
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/admin/public'
  ];
  
  // بررسی اینکه آیا مسیر درخواستی جزء مسیرهای عمومی است یا خیر
  const isPublicPath = publicPaths.some(path => req.originalUrl.startsWith(path));
  
  if (isPublicPath) {
    console.log(`✅ مسیر ${req.originalUrl} به احراز هویت نیاز ندارد (مطابقت با ${publicPaths.find(path => req.originalUrl.startsWith(path))})`);
    return next();
  }
  
  // بررسی احراز هویت کاربر
  if (req.session && req.session.user) {
    console.log('📝 اطلاعات نشست:', req.session.user.username);
    console.log(`✅ کاربر احراز هویت شده است: ${req.session.user.username}`);
    return next();
  }
  
  console.log('❌ کاربر احراز هویت نشده است.');
  
  // اگر درخواست API است، کد 401 برگردان
  if (req.originalUrl.includes('/api/')) {
    return res.status(401).json({ error: 'دسترسی غیرمجاز' });
  }
  
  req.flash('info', 'لطفا ابتدا وارد شوید');
  res.redirect('/admin/login');
}

/**
 * تنظیم اطلاعات کاربر در دسترس برای templates
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function setUser(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    res.locals.isAuthenticated = true;
  } else {
    res.locals.user = null;
    res.locals.isAuthenticated = false;
  }
  
  // تنظیم مسیر فعلی در locals
  res.locals.currentPath = req.path;
  
  next();
}

/**
 * بررسی سطح دسترسی کاربر
 * @param {String} permission دسترسی مورد نیاز
 * @returns {Function} میدلور
 */
export function hasPermission(permission) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      console.log('❌ کاربر احراز هویت نشده است.');
      req.flash('error', 'دسترسی غیرمجاز');
      return res.redirect('/admin/login');
    }
    
    // اگر کاربر دسترسی مورد نظر را دارد، اجازه عبور بده
    if (req.session.user.permissions && req.session.user.permissions.includes(permission)) {
      return next();
    }
    
    console.log(`❌ کاربر دسترسی ${permission} را ندارد.`);
    req.flash('error', 'شما دسترسی لازم برای انجام این عملیات را ندارید');
    res.redirect('/admin/dashboard');
  };
}

/**
 * بررسی احراز هویت کاربر برای API
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function apiAuth(req, res, next) {
  // بررسی API Key
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
    return next();
  }
  
  // در غیر این صورت، بررسی session
  if (req.session && req.session.user) {
    return next();
  }
  
  // هر دو روش ناموفق بود
  return res.status(401).json({ error: 'دسترسی غیرمجاز' });
}

/**
 * بررسی وجود کاربر ادمین
 * اگر هیچ کاربری وجود نداشته باشد، کاربر پیش‌فرض ساخته می‌شود
 * @returns {Promise<Object>} کاربر ادمین
 */
export async function ensureAdminUser() {
  try {
    // بررسی وجود کاربر ادمین
    const adminUsersCount = await AdminUser.countDocuments();
    console.log(`👤 تعداد کاربران ادمین: ${adminUsersCount}`);
    
    if (adminUsersCount === 0) {
      console.log('⚠️ هیچ کاربر ادمینی یافت نشد. در حال ایجاد کاربر پیش‌فرض...');
      
      // ابتدا یک نقش مدیریتی سیستم ایجاد می‌کنیم
      let adminRole = await AdminRole.findOne({ name: 'مدیر سیستم' });
      
      if (!adminRole) {
        console.log('⚠️ نقش مدیر سیستم یافت نشد. در حال ایجاد نقش پیش‌فرض...');
        
        // لیست همه دسترسی‌های ممکن
        const allPermissions = [
          'dashboard:view',
          'users:view', 'users:create', 'users:edit', 'users:delete',
          'economy:view', 'economy:edit',
          'servers:view', 'servers:edit',
          'settings:view', 'settings:edit',
          'logs:view', 'logs:delete',
          'admins:view', 'admins:create', 'admins:edit', 'admins:delete',
          'shop:view', 'shop:edit',
          'games:view', 'games:edit',
          'events:view', 'events:edit',
          'giftcodes:view', 'giftcodes:create', 'giftcodes:delete'
        ];
        
        // ایجاد نقش مدیر سیستم با تمام دسترسی‌ها
        adminRole = new AdminRole({
          name: 'مدیر سیستم',
          description: 'نقش مدیریت سیستم با تمام دسترسی‌ها',
          permissions: allPermissions,
          isDefault: true
        });
        
        await adminRole.save();
        console.log('✅ نقش مدیر سیستم با موفقیت ایجاد شد');
      }
      
      // هش کردن رمز عبور
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('ccoin123456', salt);
      
      // ایجاد کاربر ادمین
      const defaultAdmin = new AdminUser({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@ccoin.com',
        name: 'مدیر سیستم',
        role: adminRole._id, // استفاده از شناسه نقش ایجاد شده
        active: true,
        locked: false,
        failedLoginAttempts: 0,
        permissions: adminRole.permissions, // کپی دسترسی‌ها از نقش
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await defaultAdmin.save();
      console.log('✅ کاربر ادمین پیش‌فرض ایجاد شد');
      
      return defaultAdmin;
    }
    
    console.log('✅ کاربر ادمین در سیستم وجود دارد');
    return null;
  } catch (error) {
    console.error('❌ خطا در بررسی کاربر ادمین:', error);
    throw error;
  }
}
