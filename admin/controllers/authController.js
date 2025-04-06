/**
 * کنترلر احراز هویت پنل ادمین
 */
import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/adminUser.js';

/**
 * نمایش صفحه ورود
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showLogin(req, res) {
  res.render('auth/login', {
    title: 'ورود به پنل مدیریت',
    layout: 'layouts/auth',
  });
}

/**
 * پردازش فرم ورود
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function processLogin(req, res) {
  try {
    console.log('🔐 شروع فرآیند ورود کاربر...');
    const { username, password } = req.body;
    console.log(`👤 نام کاربری وارد شده: ${username}`);
    
    // بررسی وجود نام کاربری و رمز عبور
    if (!username || !password) {
      console.log('❌ نام کاربری یا رمز عبور وارد نشده است');
      req.flash('error', 'لطفاً نام کاربری و رمز عبور را وارد کنید');
      return res.redirect('/admin/login');
    }
    
    // یافتن کاربر در پایگاه داده
    console.log(`🔍 جستجوی کاربر با نام کاربری: ${username}`);
    const user = await AdminUser.findOne({ username });
    
    // بررسی وجود کاربر
    if (!user) {
      console.log(`❌ کاربری با نام کاربری ${username} یافت نشد`);
      req.flash('error', 'نام کاربری یا رمز عبور اشتباه است');
      return res.redirect('/admin/login');
    }
    
    console.log(`✅ کاربر ${username} در پایگاه داده یافت شد`);
    console.log(`👤 اطلاعات کاربر: نام: ${user.name}, فعال: ${user.active}, قفل: ${user.locked}`);
    
    // بررسی فعال بودن کاربر
    if (!user.active) {
      console.log(`❌ حساب کاربری ${username} غیرفعال است`);
      req.flash('error', 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید');
      return res.redirect('/admin/login');
    }
    
    // بررسی قفل بودن کاربر
    if (user.locked) {
      console.log(`❌ حساب کاربری ${username} قفل شده است`);
      req.flash('error', 'حساب کاربری شما قفل شده است. لطفاً با مدیر سیستم تماس بگیرید');
      return res.redirect('/admin/login');
    }
    
    // بررسی صحت رمز عبور
    console.log('🔑 بررسی صحت رمز عبور...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // افزایش تعداد تلاش‌های ناموفق
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      console.log(`❌ رمز عبور نادرست است. تعداد تلاش‌های ناموفق: ${user.failedLoginAttempts}`);
      
      // قفل کردن کاربر بعد از 5 تلاش ناموفق
      if (user.failedLoginAttempts >= 5) {
        user.locked = true;
        user.lockedAt = new Date();
        await user.save();
        console.log(`🔒 حساب کاربری ${username} به دلیل 5 تلاش ناموفق قفل شد`);
        req.flash('error', 'حساب کاربری شما به دلیل 5 تلاش ناموفق قفل شده است');
        return res.redirect('/admin/login');
      }
      
      await user.save();
      req.flash('error', 'نام کاربری یا رمز عبور اشتباه است');
      return res.redirect('/admin/login');
    }
    
    // ریست کردن تعداد تلاش‌های ناموفق
    console.log('✅ رمز عبور صحیح است');
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();
    console.log('💾 اطلاعات آخرین ورود کاربر ذخیره شد');
    
    // ذخیره اطلاعات کاربر در جلسه
    console.log('🔑 در حال ذخیره اطلاعات کاربر در جلسه...');
    req.session.user = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };
    
    console.log('💾 اطلاعات جلسه ذخیره شد:', req.session.user);
    
    // ریدایرکت به داشبورد
    console.log('🔀 ریدایرکت به داشبورد...');
    req.flash('success', `${user.name} عزیز، خوش آمدید`);
    
    // ذخیره نشست قبل از ریدایرکت
    req.session.save(err => {
      if (err) {
        console.error('❌ خطا در ذخیره جلسه:', err);
      }
      res.redirect('/admin/dashboard');
    });
  } catch (error) {
    console.error('❌ خطا در پردازش فرم ورود:', error);
    req.flash('error', 'خطایی در سیستم رخ داده است');
    res.redirect('/admin/login');
  }
}

/**
 * خروج از حساب کاربری
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function logout(req, res) {
  // پاک کردن جلسه
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

/**
 * نمایش صفحه فراموشی رمز عبور
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showForgotPassword(req, res) {
  res.render('auth/forgot-password', {
    title: 'فراموشی رمز عبور',
    layout: 'layouts/auth',
  });
}

/**
 * پردازش فرم فراموشی رمز عبور
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function processForgotPassword(req, res) {
  try {
    const { email } = req.body;
    
    // بررسی وجود ایمیل
    if (!email) {
      req.flash('error', 'لطفاً ایمیل خود را وارد کنید');
      return res.redirect('/admin/forgot-password');
    }
    
    // یافتن کاربر با ایمیل
    const user = await AdminUser.findOne({ email });
    
    // عدم اطلاع رسانی به کاربر در صورت عدم وجود ایمیل (برای جلوگیری از حملات)
    if (!user) {
      req.flash('info', 'اگر ایمیل در سیستم ما ثبت شده باشد، لینک بازنشانی رمز عبور برای شما ارسال خواهد شد');
      return res.redirect('/admin/login');
    }
    
    // ایجاد توکن بازنشانی
    const resetToken = await generateResetToken();
    
    // ذخیره توکن در پایگاه داده
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // منقضی شدن بعد از 1 ساعت
    await user.save();
    
    // ارسال ایمیل بازنشانی رمز عبور
    // TODO: ارسال ایمیل
    console.log(`لینک بازنشانی رمز عبور: /admin/reset-password/${resetToken}`);
    
    req.flash('info', 'لینک بازنشانی رمز عبور به ایمیل شما ارسال شد');
    res.redirect('/admin/login');
  } catch (error) {
    console.error('خطا در پردازش فرم فراموشی رمز عبور:', error);
    req.flash('error', 'خطایی در سیستم رخ داده است');
    res.redirect('/admin/forgot-password');
  }
}

/**
 * نمایش صفحه بازنشانی رمز عبور
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showResetPassword(req, res) {
  try {
    const { token } = req.params;
    
    // یافتن کاربر با توکن بازنشانی
    const user = await AdminUser.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // توکن هنوز منقضی نشده باشد
    });
    
    // بررسی اعتبار توکن
    if (!user) {
      req.flash('error', 'لینک بازنشانی رمز عبور نامعتبر یا منقضی شده است');
      return res.redirect('/admin/forgot-password');
    }
    
    res.render('auth/reset-password', {
      title: 'بازنشانی رمز عبور',
      layout: 'layouts/auth',
      token,
    });
  } catch (error) {
    console.error('خطا در نمایش صفحه بازنشانی رمز عبور:', error);
    req.flash('error', 'خطایی در سیستم رخ داده است');
    res.redirect('/admin/forgot-password');
  }
}

/**
 * پردازش فرم بازنشانی رمز عبور
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function processResetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    // بررسی یکسان بودن رمز عبور و تکرار آن
    if (password !== confirmPassword) {
      req.flash('error', 'رمز عبور و تکرار آن یکسان نیستند');
      return res.redirect(`/admin/reset-password/${token}`);
    }
    
    // یافتن کاربر با توکن بازنشانی
    const user = await AdminUser.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // توکن هنوز منقضی نشده باشد
    });
    
    // بررسی اعتبار توکن
    if (!user) {
      req.flash('error', 'لینک بازنشانی رمز عبور نامعتبر یا منقضی شده است');
      return res.redirect('/admin/forgot-password');
    }
    
    // تغییر رمز عبور
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    req.flash('success', 'رمز عبور شما با موفقیت تغییر یافت');
    res.redirect('/admin/login');
  } catch (error) {
    console.error('خطا در پردازش فرم بازنشانی رمز عبور:', error);
    req.flash('error', 'خطایی در سیستم رخ داده است');
    res.redirect('/admin/forgot-password');
  }
}

/**
 * تولید توکن تصادفی برای بازنشانی رمز عبور
 * @returns {string} توکن تصادفی
 */
async function generateResetToken() {
  // فعلاً یک توکن تصادفی ساده تولید می‌کنیم
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// حذف export اضافی که باعث تداخل می‌شود