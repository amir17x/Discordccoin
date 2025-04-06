/**
 * ماژول اتصال به پایگاه داده
 * 
 * این ماژول امکان اتصال به پایگاه داده MongoDB را فراهم می‌کند.
 */

import mongoose from 'mongoose';

// تنظیمات اتصال به دیتابیس
const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin';

/**
 * اتصال به پایگاه داده MongoDB
 * @returns {Promise<Object>} اتصال به پایگاه داده
 */
export async function connectToDatabase() {
  try {
    // بررسی اینکه آیا قبلاً به دیتابیس متصل شده‌ایم
    if (mongoose.connection.readyState === 1) {
      console.log('💾 قبلاً به دیتابیس متصل شده‌ایم');
      return mongoose.connection;
    }

    // اتصال به دیتابیس مونگو
    await mongoose.connect(DATABASE_URI, {
      serverSelectionTimeoutMS: 5000, // زمان انتظار برای انتخاب سرور
      socketTimeoutMS: 45000, // زمان انتظار برای عملیات socket
    });

    console.log('💾 اتصال به دیتابیس با موفقیت انجام شد');
    
    // ثبت رویدادهای مختلف مونگوس برای مدیریت خطاها
    mongoose.connection.on('error', (err) => {
      console.error('❌ خطا در اتصال به مونگو:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ اتصال به مونگو قطع شد');
    });

    // مدیریت بستن اتصال هنگام خروج از برنامه
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('💾 اتصال به مونگو بسته شد');
      process.exit(0);
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ خطا در اتصال به دیتابیس:', error);
    throw error;
  }
}

/**
 * ایجاد یک کاربر ادمین اولیه در صورت عدم وجود
 */
export async function setupInitialAdmin() {
  try {
    const { AdminUser } = await import('../models/adminUser.js');
    const { AdminRole } = await import('../models/adminRole.js');
    
    // ایجاد نقش پیش‌فرض مدیر ارشد اگر وجود نداشته باشد
    let superAdminRole = await AdminRole.findOne({ name: 'مدیر ارشد' });
    
    if (!superAdminRole) {
      console.log('👑 در حال ایجاد نقش مدیر ارشد...');
      
      superAdminRole = new AdminRole({
        name: 'مدیر ارشد',
        description: 'دسترسی کامل به تمام بخش‌های سیستم',
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
        isDefault: true
      });
      
      await superAdminRole.save();
      console.log('✅ نقش مدیر ارشد با موفقیت ایجاد شد');
    }
    
    // بررسی وجود کاربر ادمین
    const adminExists = await AdminUser.findOne({ username: 'admin' });
    
    if (!adminExists) {
      console.log('👤 در حال ایجاد کاربر ادمین پیش‌فرض...');
      
      // ایجاد یک کاربر ادمین با دسترسی‌های کامل
      const admin = new AdminUser({
        username: 'admin',
        password: 'ccoin123456', // این پسورد به صورت خودکار هش می‌شود
        name: 'مدیر سیستم',
        email: 'admin@ccoin.local',
        role: superAdminRole._id,
        permissions: superAdminRole.permissions,
        active: true
      });
      
      await admin.save();
      console.log('✅ کاربر ادمین پیش‌فرض با موفقیت ایجاد شد');
      console.log('👤 نام کاربری: admin');
      console.log('🔑 رمز عبور: ccoin123456');
    } else {
      console.log('👤 کاربر ادمین پیش‌فرض از قبل وجود دارد');
    }
  } catch (error) {
    console.error('❌ خطا در ایجاد کاربر ادمین پیش‌فرض:', error);
  }
}
