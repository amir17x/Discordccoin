/**
 * کنترلر احراز هویت پنل ادمین
 * 
 * این کنترلر مسئول مدیریت ورود، خروج و سایر عملیات مرتبط با احراز هویت است.
 */

import bcrypt from 'bcryptjs';
import { getAdminByUsername, updateAdminPassword } from '../services/adminService.js';

/**
 * نمایش صفحه ورود
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showLoginPage = (req, res) => {
  // اگر کاربر قبلاً وارد شده باشد، به داشبورد هدایت می‌شود
  if (req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  
  res.render('login', { 
    title: 'ورود به پنل مدیریت',
    layout: 'auth-layout'
  });
};

/**
 * پردازش فرم ورود
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // بررسی وجود نام کاربری و رمز عبور
    if (!username || !password) {
      req.flash('error', 'لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return res.redirect('/admin/login');
    }
    
    // دریافت اطلاعات ادمین از پایگاه داده
    const admin = await getAdminByUsername(username);
    
    // بررسی وجود ادمین
    if (!admin) {
      req.flash('error', 'نام کاربری یا رمز عبور اشتباه است.');
      return res.redirect('/admin/login');
    }
    
    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      req.flash('error', 'نام کاربری یا رمز عبور اشتباه است.');
      return res.redirect('/admin/login');
    }
    
    // ذخیره اطلاعات کاربر در جلسه
    req.session.user = {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions || [],
      name: admin.name || admin.username
    };
    
    // ثبت رویداد ورود
    console.log(`Admin login: ${username} at ${new Date().toISOString()}`);
    
    // هدایت به داشبورد
    req.flash('success', `${admin.name || admin.username} عزیز، خوش آمدید!`);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'خطا در فرآیند ورود. لطفاً دوباره تلاش کنید.');
    res.redirect('/admin/login');
  }
};

/**
 * خروج از پنل مدیریت
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const logout = (req, res) => {
  const username = req.session.user?.username;
  
  // پاک کردن جلسه
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
    } else {
      console.log(`Admin logout: ${username} at ${new Date().toISOString()}`);
    }
    
    res.redirect('/admin/login');
  });
};

/**
 * نمایش صفحه تغییر رمز عبور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showChangePasswordPage = (req, res) => {
  res.render('change-password', { 
    title: 'تغییر رمز عبور',
    user: req.session.user
  });
};

/**
 * پردازش فرم تغییر رمز عبور
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;
  
  try {
    // بررسی وجود تمام فیلدها
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash('error', 'لطفاً تمام فیلدها را پر کنید.');
      return res.redirect('/admin/change-password');
    }
    
    // بررسی تطابق رمز عبور جدید و تأیید آن
    if (newPassword !== confirmPassword) {
      req.flash('error', 'رمز عبور جدید و تأیید آن مطابقت ندارند.');
      return res.redirect('/admin/change-password');
    }
    
    // دریافت اطلاعات ادمین از پایگاه داده
    const admin = await getAdminByUsername(req.session.user.username);
    
    // بررسی رمز عبور فعلی
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isCurrentPasswordValid) {
      req.flash('error', 'رمز عبور فعلی اشتباه است.');
      return res.redirect('/admin/change-password');
    }
    
    // رمزنگاری رمز عبور جدید
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // بروزرسانی رمز عبور
    await updateAdminPassword(userId, hashedPassword);
    
    req.flash('success', 'رمز عبور با موفقیت تغییر یافت.');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Change password error:', error);
    req.flash('error', 'خطا در تغییر رمز عبور. لطفاً دوباره تلاش کنید.');
    res.redirect('/admin/change-password');
  }
};

export const authController = {
  showLoginPage,
  login,
  logout,
  showChangePasswordPage,
  changePassword
};