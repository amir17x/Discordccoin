/**
 * سرور دمو برای تست صفحات پنل مدیریت با داده‌های ساختگی
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { demoData } from './demo-data.js';

// تبدیل __dirname برای ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// تنظیمات ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// مسیرهای استاتیک
app.use('/admin/public', express.static(path.join(__dirname, 'public')));

// روت اصلی - ریدایرکت به داشبورد
app.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

// روت داشبورد
app.get('/admin/dashboard', (req, res) => {
  res.render('dashboard', {
    title: 'داشبورد',
    currentPath: '/admin/dashboard',
    user: demoData.user,
    userStats: demoData.userStats,
    systemStats: demoData.systemStats,
    alerts: demoData.alerts,
    recentActivities: demoData.recentActivities,
    scheduledTasks: demoData.scheduledTasks
  });
});

// روت لایوت اصلی
app.get('/admin/layout', (req, res) => {
  res.render('layouts/main', {
    title: 'لایوت اصلی',
    currentPath: '/admin/layout',
    user: demoData.user,
    messages: { 
      success: 'این یک پیام موفقیت‌آمیز است!',
      error: 'این یک پیام خطا است!',
      info: 'این یک پیام اطلاعات است!',
      warning: 'این یک پیام هشدار است!' 
    },
    body: '<h1>محتوای نمونه</h1>'
  });
});

// شروع سرور
app.listen(PORT, () => {
  console.log(`سرور دمو در پورت ${PORT} در حال اجراست...`);
});