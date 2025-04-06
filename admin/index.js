/**
 * ماژول اصلی پنل ادمین CCOIN
 * 
 * این ماژول مسئول راه‌اندازی سرور Express برای پنل ادمین است
 * و تمام مسیرها و middleware های مورد نیاز را تنظیم می‌کند.
 */

import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import path from 'path';
import flash from 'connect-flash';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import morgan from 'morgan';
import expressLayouts from 'express-ejs-layouts';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// تنظیم متغیرهای محیطی
dotenv.config();

// تنظیم __dirname در ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// راه‌اندازی مسیرها
import { setupRoutes } from './routes/index.js';
import { isAuthenticated, setUser } from './middleware/auth.js';

/**
 * راه‌اندازی پنل مدیریت
 * @param {Express} app اپلیکیشن اکسپرس
 */
export function setupAdminPanel(app) {
  // تنظیم موتور قالب
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  
  // استفاده از express-layouts
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');
  
  // تنظیم middleware های مورد نیاز
  app.use('/admin/public', express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride('_method'));
  app.use(morgan('dev'));
  
  // راه‌اندازی flash messages
  app.use(flash());
  
  // middleware برای دسترسی به متغیرهای عمومی در تمام قالب‌ها
  app.use((req, res, next) => {
    // اضافه کردن flash messages به locals
    res.locals.messages = req.flash();
    
    // اضافه کردن مسیر فعلی به locals
    res.locals.currentPath = req.path;
    
    // تبدیل اعداد به فرمت پول
    res.locals.formatCurrency = (amount) => {
      if (typeof amount !== 'number') {
        amount = parseInt(amount || 0);
      }
      return amount.toLocaleString('fa-IR');
    };
    
    // تبدیل تاریخ به فرمت فارسی
    res.locals.formatDate = (date, includeTime = false) => {
      if (!date) return '-';
      
      try {
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        
        if (includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
        }
        
        return new Date(date).toLocaleDateString('fa-IR', options);
      } catch (e) {
        return String(date);
      }
    };
    
    next();
  });
  
  // middleware برای بررسی احراز هویت کاربر و دسترسی به اطلاعات کاربر در قالب‌ها
  app.use('/admin', setUser);
  
  // مسیرهایی که نیاز به احراز هویت ندارند
  const publicPaths = ['/admin/login', '/admin/logout', '/admin/forgot-password', '/admin/reset-password'];
  
  // اعمال middleware احراز هویت برای مسیرهای خصوصی
  app.use('/admin', (req, res, next) => {
    // بررسی مسیر اصلی یا مسیر با پارامتر
    const fullUrl = req.originalUrl;
    
    // log برای کمک به اشکال‌زدایی
    console.log(`🔍 بررسی مسیر ${fullUrl}`);
    
    // بررسی مسیرهای عمومی
    for (const publicPath of publicPaths) {
      if (fullUrl === publicPath || fullUrl.startsWith(publicPath + '/')) {
        console.log(`✅ مسیر ${fullUrl} به احراز هویت نیاز ندارد (مطابقت با ${publicPath})`);
        return next();
      }
    }
    
    console.log(`🔒 مسیر ${fullUrl} به احراز هویت نیاز دارد`);
    isAuthenticated(req, res, next);
  });
  
  // راه‌اندازی مسیرهای برنامه
  setupRoutes(app);
  
  // مسیر پیش‌فرض برای مسیرهای نامعتبر
  app.use((req, res, next) => {
    // فقط برای مسیرهای admin
    if (req.path.startsWith('/admin')) {
      res.status(404).render('errors/404', { 
        title: 'صفحه مورد نظر یافت نشد',
        returnUrl: '/admin/dashboard'
      });
    } else {
      next();
    }
  });
  
  return app;
}

/**
 * اتصال به پایگاه داده و تنظیم اولیه
 * @returns {Promise<Object>} اتصال به پایگاه داده
 */
export async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin';
    const connection = await mongoose.connect(uri);
    
    console.log('✅ اتصال به دیتابیس MongoDB برقرار شد');
    return connection;
  } catch (error) {
    console.error('❌ خطا در اتصال به دیتابیس MongoDB:', error);
    throw error;
  }
}

/**
 * اجرای مستقل پنل ادمین (در صورتی که به عنوان ماژول استفاده نشود)
 * این قسمت در صورتی اجرا می‌شود که ماژول به صورت مستقیم اجرا شود
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    // اتصال به پایگاه داده
    await connectToDatabase();
    
    // راه‌اندازی سرور Express
    const app = express();
    setupAdminPanel(app);
    
    // شروع به کار سرور
    const PORT = process.env.ADMIN_PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 پنل ادمین روی پورت ${PORT} در حال اجراست`);
    });
  } catch (error) {
    console.error('❌ خطا در راه‌اندازی پنل ادمین:', error);
  }
}
