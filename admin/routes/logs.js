/**
 * مسیرهای مدیریت لاگ‌ها و پشتیبان‌گیری پنل ادمین
 */

import express from 'express';

const router = express.Router();

/**
 * صفحه اصلی مدیریت لاگ‌ها
 */
router.get('/', async (req, res) => {
  try {
    res.render('logs/index', {
      title: 'مدیریت لاگ‌ها',
      logs: []
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری لاگ‌ها: ${error.message}`);
    res.redirect('/admin/dashboard');
  }
});

/**
 * صفحه پشتیبان‌گیری
 */
router.get('/backup', (req, res) => {
  res.render('logs/backup', {
    title: 'پشتیبان‌گیری'
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