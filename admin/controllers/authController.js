/**
 * کنترلر احراز هویت پنل ادمین
 */

import bcrypt from 'bcryptjs';
import { getUserByUsername, createAdmin } from '../services/userService.js';

/**
 * نمایش صفحه ورود
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export function showLogin(req, res) {
  res.render('login', {
    title: 'ورود به پنل مدیریت',
    layout: 'layouts/auth'
  });
}

/**
 * پردازش فرم ورود
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function processLogin(req, res) {
  const { username, password } = req.body;
  
  try {
    // بررسی اعتبار ورودی‌ها
    if (!username || !password) {
      req.flash('error_msg', 'لطفاً نام کاربری و رمز عبور را وارد کنید');
      return res.redirect('/admin/login');
    }
    
    // جستجوی کاربر
    const user = await getUserByUsername(username);
    
    if (!user) {
      req.flash('error_msg', 'نام کاربری یا رمز عبور اشتباه است');
      return res.redirect('/admin/login');
    }
    
    // بررسی دسترسی ادمین
    if (!user.isAdmin && user.role !== 'admin' && user.role !== 'moderator') {
      req.flash('error_msg', 'شما دسترسی به پنل مدیریت را ندارید');
      return res.redirect('/admin/login');
    }
    
    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      req.flash('error_msg', 'نام کاربری یا رمز عبور اشتباه است');
      return res.redirect('/admin/login');
    }
    
    // ایجاد جلسه کاربر
    req.session.user = {
      id: user._id || user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      role: user.role || (user.isAdmin ? 'admin' : 'moderator'),
      avatar: user.avatar || '/admin/public/img/default-avatar.png',
      permissions: user.permissions || {}
    };
    
    req.flash('success_msg', `خوش آمدید ${user.displayName || user.username}!`);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('خطا در ورود به سیستم:', error);
    req.flash('error_msg', 'خطا در سیستم رخ داده است. لطفاً دوباره تلاش کنید');
    res.redirect('/admin/login');
  }
}

/**
 * پردازش خروج از سیستم
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export function processLogout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error('خطا در خروج از سیستم:', err);
    }
    res.redirect('/admin/login');
  });
}

/**
 * ایجاد کاربر ادمین در صورت عدم وجود
 * @returns {Promise<boolean>} وضعیت موفقیت
 */
export async function initializeAdmin() {
  try {
    // بررسی وجود ادمین
    const adminExists = await getUserByUsername(process.env.ADMIN_USERNAME || 'admin');
    
    if (!adminExists) {
      // ایجاد ادمین جدید
      const adminData = {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        displayName: 'مدیر سیستم',
        role: 'admin',
        isAdmin: true,
        permissions: {
          users: true,
          economy: true,
          games: true,
          ai: true,
          events: true,
          shop: true,
          logs: true,
          settings: true
        }
      };
      
      const result = await createAdmin(adminData);
      
      if (result) {
        console.log('ادمین پیش‌فرض با موفقیت ایجاد شد');
        return true;
      } else {
        console.error('خطا در ایجاد ادمین پیش‌فرض');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('خطا در بررسی یا ایجاد ادمین:', error);
    return false;
  }
}