/**
 * کنترلر مدیریت لاگ‌ها
 * 
 * این کنترلر مسئول مدیریت لاگ‌ها و گزارش‌های سیستم است.
 */

import { 
  getSystemLogs, 
  getUserLogs, 
  getTransactionLogs, 
  getGameLogs,
  getAdminLogs,
  getAILogs,
  getErrorLogs,
  clearLogs,
  getLogSettings,
  updateLogSettings as updateLogSettingsService
} from '../services/logsService.js';

/**
 * نمایش داشبورد مدیریت لاگ‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showDashboard = async (req, res) => {
  try {
    const systemLogs = await getSystemLogs({ limit: 5 });
    const userLogs = await getUserLogs({ limit: 5 });
    const transactionLogs = await getTransactionLogs({ limit: 5 });
    const gameLogs = await getGameLogs({ limit: 5 });
    const adminLogs = await getAdminLogs({ limit: 5 });
    const aiLogs = await getAILogs({ limit: 5 });
    const errorLogs = await getErrorLogs({ limit: 5 });
    
    res.render('logs/dashboard', {
      title: 'مدیریت لاگ‌ها',
      systemLogs,
      userLogs,
      transactionLogs,
      gameLogs,
      adminLogs,
      aiLogs,
      errorLogs
    });
  } catch (error) {
    console.error('Logs dashboard error:', error);
    req.flash('error', 'خطا در بارگذاری داشبورد لاگ‌ها');
    res.render('logs/dashboard', {
      title: 'مدیریت لاگ‌ها',
      systemLogs: [],
      userLogs: [],
      transactionLogs: [],
      gameLogs: [],
      adminLogs: [],
      aiLogs: [],
      errorLogs: []
    });
  }
};

/**
 * نمایش لاگ‌های سیستم
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, level, startDate, endDate } = req.query;
    
    const logs = await getSystemLogs({ page, limit, level, startDate, endDate });
    
    res.render('logs/system', {
      title: 'لاگ‌های سیستم',
      logs,
      filters: { page, limit, level, startDate, endDate }
    });
  } catch (error) {
    console.error('System logs error:', error);
    req.flash('error', 'خطا در بارگذاری لاگ‌های سیستم');
    res.render('logs/system', {
      title: 'لاگ‌های سیستم',
      logs: [],
      filters: req.query
    });
  }
};

/**
 * فیلتر لاگ‌های سیستم
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const filterSystemLogs = async (req, res) => {
  try {
    const { level, startDate, endDate, limit } = req.body;
    
    // بازگشت به صفحه با پارامترهای جدید
    res.redirect(`/admin/logs/system?level=${level || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}&limit=${limit || 50}`);
  } catch (error) {
    console.error('Filter system logs error:', error);
    req.flash('error', 'خطا در فیلتر لاگ‌های سیستم');
    res.redirect('/admin/logs/system');
  }
};

/**
 * خروجی لاگ‌های سیستم
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const exportSystemLogs = async (req, res) => {
  try {
    const { format = 'csv', level, startDate, endDate } = req.query;
    
    // دریافت تمام لاگ‌ها بدون محدودیت
    const logs = await getSystemLogs({ level, startDate, endDate, limit: 0 });
    
    // تنظیم نوع محتوا بر اساس فرمت
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=system-logs.json');
      return res.json(logs);
    } else {
      // تبدیل به CSV
      let csv = 'timestamp,level,message\n';
      
      logs.forEach(log => {
        csv += `"${log.timestamp}","${log.level}","${log.message.replace(/"/g, '""')}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=system-logs.csv');
      return res.send(csv);
    }
  } catch (error) {
    console.error('Export system logs error:', error);
    req.flash('error', 'خطا در خروجی لاگ‌های سیستم');
    res.redirect('/admin/logs/system');
  }
};

/**
 * پاکسازی لاگ‌های سیستم
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const clearSystemLogs = async (req, res) => {
  try {
    // پاکسازی لاگ‌های سیستم
    await clearLogs('system');
    
    req.flash('success', 'لاگ‌های سیستم با موفقیت پاکسازی شدند');
    res.redirect('/admin/logs/system');
  } catch (error) {
    console.error('Clear system logs error:', error);
    req.flash('error', 'خطا در پاکسازی لاگ‌های سیستم');
    res.redirect('/admin/logs/system');
  }
};

/**
 * نمایش لاگ‌های کاربران
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showUserLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
    
    const logs = await getUserLogs({ page, limit, userId, action, startDate, endDate });
    
    res.render('logs/users', {
      title: 'لاگ‌های کاربران',
      logs,
      filters: { page, limit, userId, action, startDate, endDate }
    });
  } catch (error) {
    console.error('User logs error:', error);
    req.flash('error', 'خطا در بارگذاری لاگ‌های کاربران');
    res.render('logs/users', {
      title: 'لاگ‌های کاربران',
      logs: [],
      filters: req.query
    });
  }
};

/**
 * فیلتر لاگ‌های کاربران
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const filterUserLogs = async (req, res) => {
  try {
    const { userId, action, startDate, endDate, limit } = req.body;
    
    // بازگشت به صفحه با پارامترهای جدید
    res.redirect(`/admin/logs/users?userId=${userId || ''}&action=${action || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}&limit=${limit || 50}`);
  } catch (error) {
    console.error('Filter user logs error:', error);
    req.flash('error', 'خطا در فیلتر لاگ‌های کاربران');
    res.redirect('/admin/logs/users');
  }
};

/**
 * خروجی لاگ‌های کاربران
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const exportUserLogs = async (req, res) => {
  try {
    const { format = 'csv', userId, action, startDate, endDate } = req.query;
    
    // دریافت تمام لاگ‌ها بدون محدودیت
    const logs = await getUserLogs({ userId, action, startDate, endDate, limit: 0 });
    
    // تنظیم نوع محتوا بر اساس فرمت
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=user-logs.json');
      return res.json(logs);
    } else {
      // تبدیل به CSV
      let csv = 'timestamp,userId,username,action,details\n';
      
      logs.forEach(log => {
        csv += `"${log.timestamp}","${log.userId}","${log.username}","${log.action}","${log.details.replace(/"/g, '""')}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=user-logs.csv');
      return res.send(csv);
    }
  } catch (error) {
    console.error('Export user logs error:', error);
    req.flash('error', 'خطا در خروجی لاگ‌های کاربران');
    res.redirect('/admin/logs/users');
  }
};

/**
 * نمایش لاگ‌های تراکنش‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showTransactionLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, type, startDate, endDate } = req.query;
    
    const logs = await getTransactionLogs({ page, limit, userId, type, startDate, endDate });
    
    res.render('logs/transactions', {
      title: 'لاگ‌های تراکنش‌ها',
      logs,
      filters: { page, limit, userId, type, startDate, endDate }
    });
  } catch (error) {
    console.error('Transaction logs error:', error);
    req.flash('error', 'خطا در بارگذاری لاگ‌های تراکنش‌ها');
    res.render('logs/transactions', {
      title: 'لاگ‌های تراکنش‌ها',
      logs: [],
      filters: req.query
    });
  }
};

/**
 * فیلتر لاگ‌های تراکنش‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const filterTransactionLogs = async (req, res) => {
  try {
    const { userId, type, startDate, endDate, limit } = req.body;
    
    // بازگشت به صفحه با پارامترهای جدید
    res.redirect(`/admin/logs/transactions?userId=${userId || ''}&type=${type || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}&limit=${limit || 50}`);
  } catch (error) {
    console.error('Filter transaction logs error:', error);
    req.flash('error', 'خطا در فیلتر لاگ‌های تراکنش‌ها');
    res.redirect('/admin/logs/transactions');
  }
};

/**
 * خروجی لاگ‌های تراکنش‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const exportTransactionLogs = async (req, res) => {
  try {
    const { format = 'csv', userId, type, startDate, endDate } = req.query;
    
    // دریافت تمام لاگ‌ها بدون محدودیت
    const logs = await getTransactionLogs({ userId, type, startDate, endDate, limit: 0 });
    
    // تنظیم نوع محتوا بر اساس فرمت
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=transaction-logs.json');
      return res.json(logs);
    } else {
      // تبدیل به CSV
      let csv = 'timestamp,userId,username,type,amount,description\n';
      
      logs.forEach(log => {
        csv += `"${log.timestamp}","${log.userId}","${log.username}","${log.type}","${log.amount}","${log.description.replace(/"/g, '""')}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transaction-logs.csv');
      return res.send(csv);
    }
  } catch (error) {
    console.error('Export transaction logs error:', error);
    req.flash('error', 'خطا در خروجی لاگ‌های تراکنش‌ها');
    res.redirect('/admin/logs/transactions');
  }
};

/**
 * نمایش لاگ‌های بازی‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showGameLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, gameType, result, startDate, endDate } = req.query;
    
    const logs = await getGameLogs({ page, limit, userId, gameType, result, startDate, endDate });
    
    res.render('logs/games', {
      title: 'لاگ‌های بازی‌ها',
      logs,
      filters: { page, limit, userId, gameType, result, startDate, endDate }
    });
  } catch (error) {
    console.error('Game logs error:', error);
    req.flash('error', 'خطا در بارگذاری لاگ‌های بازی‌ها');
    res.render('logs/games', {
      title: 'لاگ‌های بازی‌ها',
      logs: [],
      filters: req.query
    });
  }
};

/**
 * فیلتر لاگ‌های بازی‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const filterGameLogs = async (req, res) => {
  try {
    const { userId, gameType, result, startDate, endDate, limit } = req.body;
    
    // بازگشت به صفحه با پارامترهای جدید
    res.redirect(`/admin/logs/games?userId=${userId || ''}&gameType=${gameType || ''}&result=${result || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}&limit=${limit || 50}`);
  } catch (error) {
    console.error('Filter game logs error:', error);
    req.flash('error', 'خطا در فیلتر لاگ‌های بازی‌ها');
    res.redirect('/admin/logs/games');
  }
};

/**
 * خروجی لاگ‌های بازی‌ها
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const exportGameLogs = async (req, res) => {
  try {
    const { format = 'csv', userId, gameType, result, startDate, endDate } = req.query;
    
    // دریافت تمام لاگ‌ها بدون محدودیت
    const logs = await getGameLogs({ userId, gameType, result, startDate, endDate, limit: 0 });
    
    // تنظیم نوع محتوا بر اساس فرمت
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=game-logs.json');
      return res.json(logs);
    } else {
      // تبدیل به CSV
      let csv = 'timestamp,userId,username,gameType,result,bet,reward\n';
      
      logs.forEach(log => {
        csv += `"${log.timestamp}","${log.userId}","${log.username}","${log.gameType}","${log.result}","${log.bet}","${log.reward}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=game-logs.csv');
      return res.send(csv);
    }
  } catch (error) {
    console.error('Export game logs error:', error);
    req.flash('error', 'خطا در خروجی لاگ‌های بازی‌ها');
    res.redirect('/admin/logs/games');
  }
};

/**
 * نمایش لاگ‌های ادمین
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showAdminLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, adminId, action, startDate, endDate } = req.query;
    
    const logs = await getAdminLogs({ page, limit, adminId, action, startDate, endDate });
    
    res.render('logs/admin', {
      title: 'لاگ‌های ادمین',
      logs,
      filters: { page, limit, adminId, action, startDate, endDate }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    req.flash('error', 'خطا در بارگذاری لاگ‌های ادمین');
    res.render('logs/admin', {
      title: 'لاگ‌های ادمین',
      logs: [],
      filters: req.query
    });
  }
};

/**
 * فیلتر لاگ‌های ادمین
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const filterAdminLogs = async (req, res) => {
  try {
    const { adminId, action, startDate, endDate, limit } = req.body;
    
    // بازگشت به صفحه با پارامترهای جدید
    res.redirect(`/admin/logs/admin?adminId=${adminId || ''}&action=${action || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}&limit=${limit || 50}`);
  } catch (error) {
    console.error('Filter admin logs error:', error);
    req.flash('error', 'خطا در فیلتر لاگ‌های ادمین');
    res.redirect('/admin/logs/admin');
  }
};

/**
 * خروجی لاگ‌های ادمین
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const exportAdminLogs = async (req, res) => {
  try {
    const { format = 'csv', adminId, action, startDate, endDate } = req.query;
    
    // دریافت تمام لاگ‌ها بدون محدودیت
    const logs = await getAdminLogs({ adminId, action, startDate, endDate, limit: 0 });
    
    // تنظیم نوع محتوا بر اساس فرمت
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=admin-logs.json');
      return res.json(logs);
    } else {
      // تبدیل به CSV
      let csv = 'timestamp,adminId,adminName,action,targetId,targetName,details\n';
      
      logs.forEach(log => {
        csv += `"${log.timestamp}","${log.adminId}","${log.adminName}","${log.action}","${log.targetId}","${log.targetName}","${log.details.replace(/"/g, '""')}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=admin-logs.csv');
      return res.send(csv);
    }
  } catch (error) {
    console.error('Export admin logs error:', error);
    req.flash('error', 'خطا در خروجی لاگ‌های ادمین');
    res.redirect('/admin/logs/admin');
  }
};

/**
 * نمایش لاگ‌های هوش مصنوعی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showAILogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, model, startDate, endDate } = req.query;
    
    const logs = await getAILogs({ page, limit, userId, model, startDate, endDate });
    
    res.render('logs/ai', {
      title: 'لاگ‌های هوش مصنوعی',
      logs,
      filters: { page, limit, userId, model, startDate, endDate }
    });
  } catch (error) {
    console.error('AI logs error:', error);
    req.flash('error', 'خطا در بارگذاری لاگ‌های هوش مصنوعی');
    res.render('logs/ai', {
      title: 'لاگ‌های هوش مصنوعی',
      logs: [],
      filters: req.query
    });
  }
};

/**
 * فیلتر لاگ‌های هوش مصنوعی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const filterAILogs = async (req, res) => {
  try {
    const { userId, model, startDate, endDate, limit } = req.body;
    
    // بازگشت به صفحه با پارامترهای جدید
    res.redirect(`/admin/logs/ai?userId=${userId || ''}&model=${model || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}&limit=${limit || 50}`);
  } catch (error) {
    console.error('Filter AI logs error:', error);
    req.flash('error', 'خطا در فیلتر لاگ‌های هوش مصنوعی');
    res.redirect('/admin/logs/ai');
  }
};

/**
 * خروجی لاگ‌های هوش مصنوعی
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const exportAILogs = async (req, res) => {
  try {
    const { format = 'csv', userId, model, startDate, endDate } = req.query;
    
    // دریافت تمام لاگ‌ها بدون محدودیت
    const logs = await getAILogs({ userId, model, startDate, endDate, limit: 0 });
    
    // تنظیم نوع محتوا بر اساس فرمت
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=ai-logs.json');
      return res.json(logs);
    } else {
      // تبدیل به CSV
      let csv = 'timestamp,userId,username,model,prompt,tokens,processingTime\n';
      
      logs.forEach(log => {
        csv += `"${log.timestamp}","${log.userId}","${log.username}","${log.model}","${log.prompt.replace(/"/g, '""')}","${log.tokens}","${log.processingTime}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ai-logs.csv');
      return res.send(csv);
    }
  } catch (error) {
    console.error('Export AI logs error:', error);
    req.flash('error', 'خطا در خروجی لاگ‌های هوش مصنوعی');
    res.redirect('/admin/logs/ai');
  }
};

/**
 * نمایش لاگ‌های خطا
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showErrorLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, module, severity, startDate, endDate } = req.query;
    
    const logs = await getErrorLogs({ page, limit, module, severity, startDate, endDate });
    
    res.render('logs/errors', {
      title: 'لاگ‌های خطا',
      logs,
      filters: { page, limit, module, severity, startDate, endDate }
    });
  } catch (error) {
    console.error('Error logs error:', error);
    req.flash('error', 'خطا در بارگذاری لاگ‌های خطا');
    res.render('logs/errors', {
      title: 'لاگ‌های خطا',
      logs: [],
      filters: req.query
    });
  }
};

/**
 * فیلتر لاگ‌های خطا
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const filterErrorLogs = async (req, res) => {
  try {
    const { module, severity, startDate, endDate, limit } = req.body;
    
    // بازگشت به صفحه با پارامترهای جدید
    res.redirect(`/admin/logs/errors?module=${module || ''}&severity=${severity || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}&limit=${limit || 50}`);
  } catch (error) {
    console.error('Filter error logs error:', error);
    req.flash('error', 'خطا در فیلتر لاگ‌های خطا');
    res.redirect('/admin/logs/errors');
  }
};

/**
 * خروجی لاگ‌های خطا
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const exportErrorLogs = async (req, res) => {
  try {
    const { format = 'csv', module, severity, startDate, endDate } = req.query;
    
    // دریافت تمام لاگ‌ها بدون محدودیت
    const logs = await getErrorLogs({ module, severity, startDate, endDate, limit: 0 });
    
    // تنظیم نوع محتوا بر اساس فرمت
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=error-logs.json');
      return res.json(logs);
    } else {
      // تبدیل به CSV
      let csv = 'timestamp,error,module,userId,username,stackTrace\n';
      
      logs.forEach(log => {
        csv += `"${log.timestamp}","${log.error.replace(/"/g, '""')}","${log.module}","${log.userId || ''}","${log.username || ''}","${log.stackTrace.replace(/"/g, '""')}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=error-logs.csv');
      return res.send(csv);
    }
  } catch (error) {
    console.error('Export error logs error:', error);
    req.flash('error', 'خطا در خروجی لاگ‌های خطا');
    res.redirect('/admin/logs/errors');
  }
};

/**
 * پاکسازی لاگ‌های خطا
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const clearErrorLogs = async (req, res) => {
  try {
    // پاکسازی لاگ‌های خطا
    await clearLogs('error');
    
    req.flash('success', 'لاگ‌های خطا با موفقیت پاکسازی شدند');
    res.redirect('/admin/logs/errors');
  } catch (error) {
    console.error('Clear error logs error:', error);
    req.flash('error', 'خطا در پاکسازی لاگ‌های خطا');
    res.redirect('/admin/logs/errors');
  }
};

/**
 * نمایش تنظیمات لاگ
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const showLogSettings = async (req, res) => {
  try {
    // دریافت تنظیمات لاگ
    const settings = await getLogSettings();
    
    res.render('logs/settings', {
      title: 'تنظیمات لاگ',
      settings
    });
  } catch (error) {
    console.error('Log settings error:', error);
    req.flash('error', 'خطا در بارگذاری تنظیمات لاگ');
    res.render('logs/settings', {
      title: 'تنظیمات لاگ',
      settings: {}
    });
  }
};

/**
 * بروزرسانی تنظیمات لاگ
 * 
 * @param {Request} req درخواست اکسپرس
 * @param {Response} res پاسخ اکسپرس
 */
const updateLogSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // بروزرسانی تنظیمات لاگ
    await updateLogSettingsService(settings);
    
    req.flash('success', 'تنظیمات لاگ با موفقیت بروزرسانی شدند');
    res.redirect('/admin/logs/settings');
  } catch (error) {
    console.error('Update log settings error:', error);
    req.flash('error', 'خطا در بروزرسانی تنظیمات لاگ');
    res.redirect('/admin/logs/settings');
  }
};

export const logsController = {
  showDashboard,
  showSystemLogs,
  filterSystemLogs,
  exportSystemLogs,
  clearSystemLogs,
  showUserLogs,
  filterUserLogs,
  exportUserLogs,
  showTransactionLogs,
  filterTransactionLogs,
  exportTransactionLogs,
  showGameLogs,
  filterGameLogs,
  exportGameLogs,
  showAdminLogs,
  filterAdminLogs,
  exportAdminLogs,
  showAILogs,
  filterAILogs,
  exportAILogs,
  showErrorLogs,
  filterErrorLogs,
  exportErrorLogs,
  clearErrorLogs,
  showLogSettings,
  updateLogSettings
};