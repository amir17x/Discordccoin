/**
 * مسیرهای تنظیمات سیستم پنل ادمین
 */

import express from 'express';

const router = express.Router();

/**
 * صفحه اصلی تنظیمات سیستم
 */
router.get('/', async (req, res) => {
  try {
    res.render('settings/index', {
      title: 'تنظیمات سیستم',
      settings: {}
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری تنظیمات سیستم: ${error.message}`);
    res.redirect('/admin/dashboard');
  }
});

/**
 * صفحه تنظیمات دسترسی ادمین
 */
router.get('/access', (req, res) => {
  res.render('settings/access', {
    title: 'مدیریت دسترسی‌ها'
  });
});

/**
 * صفحه در دست ساخت
 */
router.get('*', (req, res) => {
  res.render('coming-soon', { 
    title: 'در دست ساخت',
    message: 'این بخش در حال توسعه است و به زودی در دسترس قرار می‌گیرد.'
  });
});

export default router;