/**
 * اسکریپت راه‌اندازی پنل ادمین CCOIN به صورت مستقل
 * 
 * توجه: این فایل دیگر استفاده نمی‌شود.
 * پنل ادمین اکنون از طریق server/index.ts روی پورت 5000 راه‌اندازی می‌شود.
 * در صورت نیاز به اجرای مجدد سرور مستقل، کد زیر را از حالت کامنت خارج کنید.
 */

import express from 'express';
import { setupAdminPanel, connectToDatabase } from './admin/index.js';

/*
async function startAdminServer() {
  try {
    // اتصال به پایگاه داده
    console.log('🔄 در حال اتصال به پایگاه داده...');
    await connectToDatabase();
    
    // راه‌اندازی سرور Express
    console.log('🚀 در حال راه‌اندازی سرور پنل ادمین...');
    const app = express();
    setupAdminPanel(app);
    
    // شروع به کار سرور
    const PORT = 5000; // تنظیم پورت ثابت 5000
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ پنل ادمین روی پورت ${PORT} در حال اجراست`);
      console.log(`🌐 آدرس دسترسی: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('❌ خطا در راه‌اندازی پنل ادمین:', error);
  }
}

// اجرای سرور
// startAdminServer();
*/

// نمایش پیام راهنما
console.log('⚠️ توجه: فایل admin_server.js دیگر استفاده نمی‌شود.');
console.log('✅ پنل ادمین اکنون از طریق server/index.ts روی پورت 5000 راه‌اندازی می‌شود.');
console.log('🌐 آدرس دسترسی: http://localhost:5000/admin');
