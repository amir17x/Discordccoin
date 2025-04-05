/**
 * ماژول اصلی پنل ادمین
 */

import express from 'express';
import path from 'path';
import session from 'express-session';
import flash from 'connect-flash';
import ejsLayouts from 'express-ejs-layouts';
import mongoose from 'mongoose';
import ConnectMongoDBSession from 'connect-mongodb-session';

// میان‌افزارها
import { authMiddleware, checkAdmin } from './middleware/auth.js';

// روت‌ها
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import usersRoutes from './routes/users.js';
import economyRoutes from './routes/economy.js';
import gamesRoutes from './routes/games.js';
import aiRoutes from './routes/ai.js';
import eventsRoutes from './routes/events.js';
import shopRoutes from './routes/shop.js';
import logsRoutes from './routes/logs.js';
import settingsRoutes from './routes/settings.js';

// مسیر فروشگاه
const ADMIN_PATH = '/admin';

// مدت زمان انقضای جلسه (30 روز)
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

// ذخیره‌سازی جلسه در مونگو دی‌بی
const MongoDBStore = ConnectMongoDBSession(session);

/**
 * راه‌اندازی پنل مدیریت
 * @param {Express} app اپلیکیشن اکسپرس
 */
export function setupAdminPanel(app) {
  // تنظیم موتور قالب
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'admin/views'));
  
  // استفاده از ejs-layouts
  app.use(ejsLayouts);
  app.set('layout', 'layouts/main');
  
  // میان‌افزارها
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  
  // مسیر فایل‌های استاتیک
  app.use(`${ADMIN_PATH}/public`, express.static(path.join(process.cwd(), 'admin/public')));
  
  // تنظیم جلسه
  const sessionStore = new MongoDBStore({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin',
    collection: 'admin_sessions'
  });

  // مدیریت خطاهای ذخیره‌سازی جلسه
  sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'ccoin-admin-secret',
    cookie: {
      maxAge: SESSION_MAX_AGE
    },
    store: sessionStore,
    resave: false,
    saveUninitialized: false
  }));
  
  // فلش پیام‌ها
  app.use(flash());
  
  // افزودن متغیرهای سراسری به قالب
  app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.info_msg = req.flash('info_msg');
    res.locals.warning_msg = req.flash('warning_msg');
    res.locals.errors = req.flash('errors');
    res.locals.currentPath = req.path;
    next();
  });
  
  // روت‌ها
  app.use(`${ADMIN_PATH}`, authRoutes);
  app.use(`${ADMIN_PATH}/dashboard`, authMiddleware, dashboardRoutes);
  app.use(`${ADMIN_PATH}/users`, authMiddleware, usersRoutes);
  app.use(`${ADMIN_PATH}/economy`, authMiddleware, economyRoutes);
  app.use(`${ADMIN_PATH}/games`, authMiddleware, gamesRoutes);
  app.use(`${ADMIN_PATH}/ai`, authMiddleware, aiRoutes);
  app.use(`${ADMIN_PATH}/events`, authMiddleware, eventsRoutes);
  app.use(`${ADMIN_PATH}/shop`, authMiddleware, shopRoutes);
  app.use(`${ADMIN_PATH}/logs`, authMiddleware, logsRoutes);
  app.use(`${ADMIN_PATH}/settings`, authMiddleware, checkAdmin, settingsRoutes);
  
  // مسیر صفحه اصلی - ریدایرکت به داشبورد
  app.get(ADMIN_PATH, (req, res) => {
    if (req.session.user) {
      return res.redirect(`${ADMIN_PATH}/dashboard`);
    } else {
      return res.redirect(`${ADMIN_PATH}/login`);
    }
  });
  
  // مدیریت خطای 404 برای پنل ادمین
  app.use(`${ADMIN_PATH}/*`, (req, res) => {
    res.status(404).render('404', { 
      title: 'صفحه یافت نشد',
      layout: 'layouts/main' 
    });
  });
}

// اتصال مستقیم به دیتابیس در صورت نیاز
export async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin');
    console.log('Admin panel connected to MongoDB');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
}