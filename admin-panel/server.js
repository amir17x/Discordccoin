/**
 * سرور اصلی پنل مدیریت Ccoin
 * این فایل نقطه ورودی اصلی برنامه است
 */

// وابستگی‌ها
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const ejs = require('ejs');
const { format } = require('date-fns-jalali');

// ایجاد اپلیکیشن express
const app = express();

// تنظیمات محیط
const PORT = process.env.ADMIN_PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'ccoin-admin-secret-key';
const NODE_ENV = process.env.NODE_ENV || 'development';

// تنظیم دایرکتوری views و موتور قالب
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// میدلورهای عمومی
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// میدلور امنیتی
app.use(helmet({
  contentSecurityPolicy: false, // برای سادگی در توسعه غیرفعال می‌شود
}));

// فشرده‌سازی پاسخ‌ها
app.use(compression());

// مدیریت لاگ‌ها
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// تنظیم لاگ‌های دسترسی
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);

// فرمت سفارشی برای لاگ‌ها
morgan.token('jdate', () => format(new Date(), 'yyyy/MM/dd HH:mm:ss'));
const logFormat = ':jdate [:method] :url :status :response-time ms - :res[content-length] - :remote-addr';

// میدلور لاگ
if (NODE_ENV === 'production') {
  app.use(morgan(logFormat, { stream: accessLogStream }));
} else {
  app.use(morgan(logFormat));
}

// تنظیم سشن
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // یک روز
  }
}));

// میدلور پیام‌های فلش
app.use(flash());

// میدلور متغیرهای محلی
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success') || null;
  res.locals.error = req.flash('error') || null;
  res.locals.warning = req.flash('warning') || null;
  res.locals.info = req.flash('info') || null;
  next();
});

// تنظیم تاریخ برای استفاده در قالب‌ها
app.locals.formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
};

// تنظیم توابع کمکی برای قالب‌ها
app.locals.helpers = {
  // تبدیل عدد به فرمت پول با جداکننده هزارگان
  formatNumber: (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  // کوتاه کردن متن
  truncate: (text, length) => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },
  // تبدیل تاریخ به زمان نسبی (مثلاً "۳ ساعت پیش")
  timeAgo: (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 30) {
      return format(date, 'yyyy/MM/dd');
    } else if (diffDay > 0) {
      return `${diffDay} روز پیش`;
    } else if (diffHour > 0) {
      return `${diffHour} ساعت پیش`;
    } else if (diffMin > 0) {
      return `${diffMin} دقیقه پیش`;
    } else {
      return 'لحظاتی پیش';
    }
  }
};

// بارگذاری مسیرها
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const clansRoutes = require('./routes/clans');
const itemsRoutes = require('./routes/items');
const questsRoutes = require('./routes/quests');
const logsRoutes = require('./routes/logs');
const settingsRoutes = require('./routes/settings');

// تنظیم مسیرها
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/users', usersRoutes);
app.use('/clans', clansRoutes);
app.use('/items', itemsRoutes);
app.use('/quests', questsRoutes);
app.use('/logs', logsRoutes);
app.use('/settings', settingsRoutes);

// صفحه اصلی - ریدایرکت به داشبورد
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/auth/login');
});

// صفحه ۴۰۴
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'صفحه مورد نظر یافت نشد',
    message: 'صفحه مورد نظر یافت نشد',
    error: { status: 404 },
    user: req.session.user || null
  });
});

// میدلور مدیریت خطا
app.use((err, req, res, next) => {
  console.error('خطای سرور:', err);
  
  // ثبت خطا در فایل لاگ
  const errorLogStream = fs.createWriteStream(
    path.join(logDirectory, 'error.log'),
    { flags: 'a' }
  );
  errorLogStream.write(`${format(new Date(), 'yyyy/MM/dd HH:mm:ss')} - ${err.stack || err}\n`);
  
  res.status(err.status || 500).render('error', {
    title: 'خطای سرور',
    message: NODE_ENV === 'production' ? 'خطایی در سرور رخ داده است' : err.message,
    error: NODE_ENV === 'production' ? {} : err,
    user: req.session.user || null
  });
});

// شروع سرور
app.listen(PORT, () => {
  console.log(`پنل مدیریت Ccoin در پورت ${PORT} در حال اجراست`);
});

module.exports = app;