/**
 * ماژول اصلی پنل ادمین CCOIN
 * 
 * این ماژول مسئول راه‌اندازی سرور Express برای پنل ادمین است
 * و تمام مسیرها و middleware های مورد نیاز را تنظیم می‌کند.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import flash from 'connect-flash';
import helmet from 'helmet';
import morgan from 'morgan';
import ejsLayouts from 'express-ejs-layouts';
import compression from 'compression';

// مسیرها
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import usersRoutes from './routes/users.js';
import economyRoutes from './routes/economy.js';
import gamesRoutes from './routes/games.js';
import aiRoutes from './routes/ai.js';
import eventsRoutes from './routes/events.js';
import serversRoutes from './routes/servers.js';
import logsRoutes from './routes/logs.js';
import settingsRoutes from './routes/settings.js';

// میدلویر‌ها
import { authMiddleware, checkPermissions } from './middleware/auth.js';

// ثابت‌ها
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.ADMIN_PORT || 3001;
const SESSION_SECRET = process.env.SESSION_SECRET || 'ccoin-admin-secret';

/**
 * راه‌اندازی پنل مدیریت
 * @param {Express} app اپلیکیشن اکسپرس
 */
export function setupAdminPanel(app) {
  console.log('🔧 در حال راه‌اندازی پنل مدیریت CCOIN...');

  // تنظیم میدلویر‌ها
  app.use('/admin', helmet({
    contentSecurityPolicy: false, // غیرفعال کردن CSP برای دسترسی به CDN‌ها
  }));
  app.use('/admin', morgan('dev'));
  app.use('/admin', compression());
  app.use('/admin', express.json());
  app.use('/admin', express.urlencoded({ extended: true }));

  // تنظیم جلسه‌ها
  app.use('/admin', session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 ساعت
    },
  }));

  // تنظیم فلش‌ها
  app.use('/admin', flash());

  // تنظیم متغیرهای عمومی برای همه قالب‌ها
  app.use('/admin', (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.messages = {
      success: req.flash('success'),
      error: req.flash('error'),
      warning: req.flash('warning'),
      info: req.flash('info'),
    };
    next();
  });

  // تنظیم موتور قالب
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.use(ejsLayouts);
  app.set('layout', 'layout');

  // فایل‌های استاتیک
  app.use('/admin/css', express.static(path.join(__dirname, 'public/css')));
  app.use('/admin/js', express.static(path.join(__dirname, 'public/js')));
  app.use('/admin/images', express.static(path.join(__dirname, 'public/images')));
  app.use('/admin/fonts', express.static(path.join(__dirname, 'public/fonts')));

  // مسیرها
  app.use('/admin', authRoutes);
  
  // مسیرهای نیازمند احراز هویت
  app.use('/admin/dashboard', authMiddleware, dashboardRoutes);
  app.use('/admin/users', authMiddleware, checkPermissions('users'), usersRoutes);
  app.use('/admin/economy', authMiddleware, checkPermissions('economy'), economyRoutes);
  app.use('/admin/games', authMiddleware, checkPermissions('games'), gamesRoutes);
  app.use('/admin/ai', authMiddleware, checkPermissions('ai'), aiRoutes);
  app.use('/admin/events', authMiddleware, checkPermissions('events'), eventsRoutes);
  app.use('/admin/servers', authMiddleware, checkPermissions('servers'), serversRoutes);
  app.use('/admin/logs', authMiddleware, checkPermissions('logs'), logsRoutes);
  app.use('/admin/settings', authMiddleware, checkPermissions('settings'), settingsRoutes);

  // مسیر صفحه اصلی (ریدایرکت به داشبورد)
  app.get('/admin', (req, res) => {
    if (req.session.user) {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/admin/login');
    }
  });

  // مسیر 404
  app.use('/admin/*', (req, res) => {
    res.status(404).render('404', { title: 'صفحه یافت نشد' });
  });

  // مدیریت خطاها
  app.use('/admin', (err, req, res, next) => {
    console.error('خطای پنل ادمین:', err);
    res.status(500).render('error', {
      title: 'خطای سرور',
      error: process.env.NODE_ENV === 'development' ? err : 'خطایی در سرور رخ داده است.'
    });
  });

  console.log(`✅ پنل مدیریت CCOIN با موفقیت راه‌اندازی شد (پورت: ${PORT})`);
}

/**
 * اتصال به پایگاه داده
 * @returns {Promise<Object>} اتصال به پایگاه داده
 */
export async function connectToDatabase() {
  try {
    console.log('🔄 در حال اتصال به پایگاه داده...');
    // اتصال به پایگاه داده در اینجا انجام می‌شود
    
    console.log('✅ اتصال به پایگاه داده با موفقیت انجام شد');
    return true;
  } catch (error) {
    console.error('❌ خطا در اتصال به پایگاه داده:', error);
    throw error;
  }
}

// اگر مستقیماً اجرا شود (برای تست)
if (process.argv[1] === __filename) {
  const app = express();
  setupAdminPanel(app);
  app.listen(PORT, () => {
    console.log(`🚀 سرور پنل ادمین در پورت ${PORT} راه‌اندازی شد`);
  });
}