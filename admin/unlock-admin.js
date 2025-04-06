/**
 * اسکریپت خارج کردن کاربر ادمین از حالت قفل
 * 
 * این اسکریپت برای خارج کردن کاربر ادمین از حالت قفل استفاده می‌شود.
 * در صورتی که کاربر ادمین به هر دلیلی قفل شده باشد، با اجرای این اسکریپت می‌توانید آن را از حالت قفل خارج کنید.
 */

import mongoose from 'mongoose';
import { AdminUser } from './models/adminUser.js';

const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin';

async function unlockAdmin() {
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
    console.log(`👤 وضعیت کاربر قبل از تغییر:`);
    console.log(` - فعال: ${admin.active}`);
    console.log(` - قفل: ${admin.locked}`);
    console.log(` - تعداد تلاش‌های ناموفق: ${admin.failedLoginAttempts || 0}`);
    
    // آنلاک کردن کاربر
    admin.locked = false;
    admin.failedLoginAttempts = 0;
    await admin.save();
    
    console.log('✅ کاربر ادمین با موفقیت از حالت قفل خارج شد');
    console.log(`👤 وضعیت کاربر بعد از تغییر:`);
    console.log(` - فعال: ${admin.active}`);
    console.log(` - قفل: ${admin.locked}`);
    console.log(` - تعداد تلاش‌های ناموفق: ${admin.failedLoginAttempts || 0}`);
    
    // بستن اتصال به پایگاه داده
    await mongoose.connection.close();
    console.log('✅ اتصال به پایگاه داده بسته شد');
  } catch (error) {
    console.error('❌ خطا در اجرای اسکریپت:', error);
  }
}

// اجرای تابع اصلی
unlockAdmin();