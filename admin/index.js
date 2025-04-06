/**
 * ماژول اصلی پنل ادمین CCOIN
 * 
 * این ماژول مسئول راه‌اندازی سرور Express برای پنل ادمین است
 * و تمام مسیرها و middleware های مورد نیاز را تنظیم می‌کند.
 */

import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import expressLayouts from 'express-ejs-layouts';

// میدلورها
import { checkAuth, setLocals } from './middleware/auth.js';
import { handleError } from './middleware/error.js';

// مسیرهای Fluent UI
import fluentRoutes from './routes/fluent.js';

// مسیرها - فعلاً غیرفعال تا زمان پیاده سازی مجدد با Fluent UI
// import indexRoutes from './routes/index.js';
// import authRoutes from './routes/auth.js';
// import dashboardRoutes from './routes/dashboard.js';
// import serversRoutes from './routes/servers.js';
// import shopRoutes from './routes/shop.js';

// تنظیم مسیر فعلی
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تنظیمات منتقل شده از متغیرهای محیطی
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ccoin';
const SESSION_SECRET = process.env.SESSION_SECRET || 'ccoin-admin-secret';
const PORT = process.env.ADMIN_PORT || 5000;

// اتصال به پایگاه داده
let db;

/**
 * اتصال به پایگاه داده و تنظیم اولیه
 * @returns {Promise<Object>} اتصال به پایگاه داده
 */
export async function connectToDatabase() {
  if (db) return db;
  
  try {
    const client = await MongoClient.connect(MONGO_URI);
    console.log('🗄️ اتصال به MongoDB با موفقیت برقرار شد');
    db = client.db();
    return db;
  } catch (error) {
    console.error('خطا در اتصال به پایگاه داده:', error);
    throw error;
  }
}

/**
 * راه‌اندازی پنل مدیریت
 * @param {Express} app اپلیکیشن اکسپرس
 */
export function setupAdminPanel(app) {
  // تنظیم مسیر فایل‌های استاتیک
  app.use('/admin/static', express.static(path.join(__dirname, 'public')));
  
  // تنظیم موتور قالب
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  
  // تنظیم layouts
  app.use(expressLayouts);
  app.set('layout', 'layouts/fluent/main');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);
  
  // میدلورهای عمومی
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // تنظیم سشن
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 24 * 60 * 60 * 1000,  // ۱ روز
      secure: process.env.NODE_ENV === 'production'
    }
  }));
  
  // تنظیم فلش مسیج
  app.use(flash());
  
  // تنظیم متغیرهای locals
  app.use('/admin', setLocals);
  
  // مسیرهای پنل مدیریت Fluent UI
  app.use('/admin', fluentRoutes);
  
  // تنظیم مسیر فایل‌های استاتیک Fluent UI
  app.use('/admin', express.static(path.join(__dirname, 'public')));
  
  // مسیرهای پنل مدیریت قدیمی - موقتاً غیرفعال
  // app.use('/admin', indexRoutes);
  // app.use('/admin/auth', authRoutes);
  // app.use('/admin/dashboard', checkAuth, dashboardRoutes);
  // app.use('/admin/servers', checkAuth, serversRoutes);
  // app.use('/admin/shop', checkAuth, shopRoutes);
  
  // تغییر مسیر صفحه اصلی به صفحه ورود Fluent UI
  app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
  });
  
  // مدیریت خطاها
  app.use('/admin', handleError);
  
  console.log('✅ پنل مدیریت با موفقیت راه‌اندازی شد');
}

/**
 * اجرای مستقل پنل ادمین (در صورتی که به عنوان ماژول استفاده نشود)
 * این قسمت در صورتی اجرا می‌شود که ماژول به صورت مستقیم اجرا شود
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = express();
  
  setupAdminPanel(app);
  
  app.listen(PORT, () => {
    console.log(`🚀 پنل مدیریت روی پورت ${PORT} راه‌اندازی شد`);
  });
}