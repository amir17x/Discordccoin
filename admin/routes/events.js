/**
 * مسیرهای مدیریت رویدادها پنل ادمین
 */

import express from 'express';

const router = express.Router();

/**
 * صفحه اصلی مدیریت رویدادها
 */
router.get('/', async (req, res) => {
  try {
    res.render('events/index', {
      title: 'مدیریت رویدادها',
      events: []
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری اطلاعات رویدادها: ${error.message}`);
    res.redirect('/admin/dashboard');
  }
});

/**
 * صفحه ایجاد رویداد جدید
 */
router.get('/create', (req, res) => {
  res.render('events/create', {
    title: 'ایجاد رویداد جدید'
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