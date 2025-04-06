/**
 * اسکریپت بازنشانی رمز عبور کاربر ادمین
 * 
 * این اسکریپت برای بازنشانی رمز عبور کاربر ادمین استفاده می‌شود.
 * در صورتی که رمز عبور کاربر ادمین را فراموش کرده‌اید یا به هر دلیلی نمی‌توانید وارد شوید، با اجرای این اسکریپت می‌توانید رمز عبور را بازنشانی کنید.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminUser } from './models/adminUser.js';

const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin';

// رمز عبور جدید
const NEW_PASSWORD = 'ccoin123456';

async function resetAdminPassword() {
  try {
    console.log('🔄 در حال اتصال به پایگاه داده...');
    
    await mongoose.connect(DATABASE_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ اتصال به پایگاه داده با موفقیت انجام شد');
    
    // یافتن کاربر ادمین
    const admin = await AdminUser.findOne({ username: 'admin' });
    
    if (!admin) {
      console.error('❌ کاربر ادمین یافت نشد');
      return;
    }
    
    console.log(`✅ کاربر ادمین یافت شد: ${admin.name}`);
    
    // تغییر رمز عبور
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(NEW_PASSWORD, salt);
    admin.locked = false;
    admin.failedLoginAttempts = 0;
    
    await admin.save();
    
    console.log('✅ رمز عبور کاربر ادمین با موفقیت بازنشانی شد');
    console.log(`👤 نام کاربری: admin`);
    console.log(`🔑 رمز عبور جدید: ${NEW_PASSWORD}`);
    
    // بستن اتصال به پایگاه داده
    await mongoose.connection.close();
    console.log('✅ اتصال به پایگاه داده بسته شد');
  } catch (error) {
    console.error('❌ خطا در اجرای اسکریپت:', error);
  }
}

// اجرای تابع اصلی
resetAdminPassword();