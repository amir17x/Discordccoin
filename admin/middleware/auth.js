/**
 * میدلورهای احراز هویت
 */

import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../index.js';

/**
 * بررسی احراز هویت کاربر
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 * @param {Function} next تابع بعدی
 */
export function isAuthenticated(req, res, next) {
  console.log('🔒 بررسی احراز هویت کاربر...');
  
  if (req.session && req.session.user) {
    console.log('📝 اطلاعات نشست:', req.session);
    console.log(`✅ کاربر احراز هویت شده است: ${req.session.user.username}`);
    return next();
  }
  
  console.log('❌ کاربر احراز هویت نشده است.');
  
  // اگر درخواست API است، کد 401 برگردان
  if (req.path.startsWith('/admin/api/')) {
    return res.status(401).json({ error: 'دسترسی غیرمجاز' });
  }
  
  // در غیر این صورت، به صفحه ورود هدایت کن
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
    const { db } = await connectToDatabase();
    
    // بررسی وجود کاربر ادمین
    const adminUsersCount = await db.collection('admin_users').countDocuments();
    
    if (adminUsersCount === 0) {
      console.log('⚠️ هیچ کاربر ادمینی یافت نشد. در حال ایجاد کاربر پیش‌فرض...');
      
      // ایجاد کاربر پیش‌فرض
      const defaultAdmin = {
        username: 'admin',
        password: 'ccoin123456', // در محیط واقعی باید هش شود
        name: 'مدیر سیستم',
        role: new ObjectId(),
        permissions: [
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
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('admin_users').insertOne(defaultAdmin);
      console.log('✅ کاربر ادمین پیش‌فرض ایجاد شد');
      
      defaultAdmin._id = result.insertedId;
      return defaultAdmin;
    }
    
    return null;
  } catch (error) {
    console.error('❌ خطا در بررسی کاربر ادمین:', error);
    throw error;
  }
}
