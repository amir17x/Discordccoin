/**
 * اسکریپت راه‌اندازی پنل ادمین CCOIN به صورت مستقل
 */

import express from 'express';
import { setupAdminPanel, connectToDatabase } from './admin/index.js';

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
    const PORT = process.env.ADMIN_PORT || 3001;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ پنل ادمین روی پورت ${PORT} در حال اجراست`);
      console.log(`🌐 آدرس دسترسی: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('❌ خطا در راه‌اندازی پنل ادمین:', error);
  }
}

// اجرای سرور
startAdminServer();
