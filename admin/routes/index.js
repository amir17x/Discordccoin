/**
 * مسیرهای اصلی پنل ادمین
 */
import dashboardRoutes from './dashboard.js';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import economyRoutes from './economy.js';

/**
 * راه‌اندازی مسیرهای اپلیکیشن
 * @param {Express} app اپلیکیشن اکسپرس
 */
export function setupRoutes(app) {
  // مسیرهای احراز هویت
  app.use('/admin', authRoutes);
  
  // مسیرهای داشبورد
  app.use('/admin/dashboard', dashboardRoutes);
  
  // مسیرهای کاربران
  app.use('/admin/users', usersRoutes);
  
  // مسیرهای اقتصادی
  app.use('/admin/economy', economyRoutes);
  
  // ریدایرکت صفحه اصلی به داشبورد
  app.get('/admin', (req, res) => {
    res.redirect('/admin/dashboard');
  });
  
  // مسیر API آمار آنلاین
  app.get('/admin/api/realtime-stats', async (req, res) => {
    try {
      const economyController = await import('../controllers/economyController.js');
      economyController.getRealtimeStats(req, res);
    } catch (error) {
      console.error('خطا در API آمار آنلاین:', error);
      res.status(500).json({ error: 'خطای سرور داخلی' });
    }
  });
  
  // مسیر 404 برای مسیرهای نامعتبر
  app.use('/admin/*', (req, res) => {
    res.status(404).render('errors/404', { 
      title: 'صفحه مورد نظر یافت نشد',
      returnUrl: '/admin/dashboard'
    });
  });
}
