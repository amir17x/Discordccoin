/**
 * اسکریپت ایجاد کاربر ادمین به صورت دستی
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './lib/database.js';

async function createAdminUser() {
  try {
    // اتصال به دیتابیس
    await connectToDatabase();
    
    // بارگذاری مدل‌های مورد نیاز
    const { AdminUser } = await import('./models/adminUser.js');
    const { AdminRole } = await import('./models/adminRole.js');
    
    // حذف کاربر ادمین قبلی (اگر وجود داشته باشد)
    await AdminUser.deleteOne({ username: 'admin' });
    
    // ایجاد نقش مدیر ارشد اگر وجود نداشته باشد
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
    
    // ایجاد کاربر ادمین جدید
    console.log('👤 در حال ایجاد کاربر ادمین...');
    
    // هش کردن پسورد به صورت دستی
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('ccoin123456', salt);
    
    const admin = new AdminUser({
      username: 'admin',
      password: hashedPassword,
      name: 'مدیر سیستم',
      email: 'admin@example.com',
      role: superAdminRole._id,
      permissions: superAdminRole.permissions,
      active: true
    });
    
    await admin.save();
    console.log('✅ کاربر ادمین با موفقیت ایجاد شد');
    console.log('👤 نام کاربری: admin');
    console.log('🔑 رمز عبور: ccoin123456');
    
    // بستن اتصال به دیتابیس
    await mongoose.connection.close();
    console.log('🔌 اتصال به دیتابیس بسته شد');
    
  } catch (error) {
    console.error('❌ خطا در ایجاد کاربر ادمین:', error);
  }
}

// اجرای اسکریپت
createAdminUser();