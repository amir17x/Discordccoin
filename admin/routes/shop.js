/**
 * مسیرهای مدیریت فروشگاه پنل ادمین
 */

import express from 'express';

const router = express.Router();

/**
 * صفحه اصلی مدیریت فروشگاه
 */
router.get('/', async (req, res) => {
  try {
    res.render('shop/index', {
      title: 'مدیریت فروشگاه',
      items: []
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری اطلاعات فروشگاه: ${error.message}`);
    res.redirect('/admin/dashboard');
  }
});

/**
 * صفحه ایجاد آیتم جدید
 */
router.get('/create', (req, res) => {
  res.render('shop/create', {
    title: 'ایجاد آیتم جدید'
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