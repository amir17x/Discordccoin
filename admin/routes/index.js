/**
 * مسیرهای اصلی پنل ادمین CCOIN
 * 
 * این ماژول همه مسیرهای پنل ادمین را تنظیم می‌کند.
 */

import express from 'express';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import usersRoutes from './users.js';
import economyRoutes from './economy.js';
import gamesRoutes from './games.js';
import eventsRoutes from './events.js';
import aiRoutes from './ai.js';
import settingsRoutes from './settings.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// مسیر صفحه اصلی - ریدایرکت به داشبورد
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// مسیرهای احراز هویت
router.use('/', authRoutes);

// اعمال میدلویر احراز هویت برای همه مسیرهای زیر
router.use(isAuthenticated);

// مسیرهای داشبورد
router.use('/dashboard', dashboardRoutes);

// مسیرهای مدیریت کاربران
router.use('/users', usersRoutes);

// مسیرهای مدیریت اقتصاد
router.use('/economy', economyRoutes);

// مسیرهای مدیریت بازی‌ها
router.use('/games', gamesRoutes);

// مسیرهای مدیریت رویدادها
router.use('/events', eventsRoutes);

// مسیرهای هوش مصنوعی
router.use('/ai', aiRoutes);

// مسیرهای تنظیمات
router.use('/settings', settingsRoutes);

// صفحه 404 برای مسیرهای نامعتبر
router.use((req, res) => {
  res.status(404).render('404', {
    title: 'صفحه یافت نشد',
    layout: false
  });
});

export default router;
