/**
 * میدلور مدیریت خطاها
 * 
 * این میدلور برای مدیریت خطاهای رخ داده در برنامه استفاده می‌شود.
 */

/**
 * مدیریت خطاهای برنامه
 * 
 * @param {Error} err خطای رخ داده
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 * @param {Function} next تابع next اکسپرس
 */
export function handleError(err, req, res, next) {
  console.error('خطای سرور:', err);
  
  // ثبت خطا در سیستم لاگ (اگر باشد)
  if (req.app.locals.logger) {
    req.app.locals.logger.error(err);
  }
  
  // نمایش خطا بر اساس محیط
  const isDev = process.env.NODE_ENV !== 'production';
  const errorMessage = isDev ? err.message : 'خطای سرور رخ داده است';
  const errorStack = isDev ? err.stack : null;
  
  // تعیین کد وضعیت HTTP
  const statusCode = err.statusCode || 500;
  
  // پاسخ بر اساس نوع درخواست
  if (req.xhr || req.headers.accept.includes('application/json')) {
    // پاسخ JSON برای درخواست‌های AJAX
    return res.status(statusCode).json({
      error: true,
      message: errorMessage,
      ...(isDev && { stack: errorStack })
    });
  }
  
  // نمایش صفحه خطا
  if (process.env.USE_FLUENT_UI === 'true') {
    // استفاده از قالب Fluent UI
    return res.status(statusCode).render('fluent-error', {
      title: 'خطای سرور',
      currentRoute: req.path,
      layout: 'layouts/fluent-main',
      user: req.session.user,
      error: {
        statusCode,
        message: errorMessage,
        stack: errorStack
      }
    });
  } 
  
  // استفاده از قالب پیش‌فرض
  return res.status(statusCode).render('error', {
    title: 'خطای سرور',
    statusCode,
    message: errorMessage,
    stack: errorStack
  });
}