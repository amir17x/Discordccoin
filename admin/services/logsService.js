/**
 * سرویس مدیریت لاگ‌ها
 * 
 * این ماژول شامل توابع مورد نیاز برای مدیریت لاگ‌ها و گزارش‌های سیستم است.
 */

import { Log } from '../models/log.js';
import { Server } from '../models/server.js';

/**
 * دریافت لیست لاگ‌ها با امکان فیلتر و صفحه‌بندی
 * @param {Object} params پارامترهای جستجو
 * @returns {Promise<Object>} لیست لاگ‌ها و اطلاعات صفحه‌بندی
 */
export async function getLogs(params) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      level = '',
      category = '',
      startDate = null,
      endDate = null,
      serverId = null,
      userId = null,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = params;
    
    // ساخت شرایط جستجو
    const query = {};
    
    // جستجو در پیام
    if (search) {
      query.message = { $regex: search, $options: 'i' };
    }
    
    // فیلتر سطح لاگ
    if (level) {
      if (Array.isArray(level)) {
        query.level = { $in: level };
      } else {
        query.level = level;
      }
    }
    
    // فیلتر دسته
    if (category) {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }
    
    // فیلتر بازه زمانی
    if (startDate) {
      query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query.timestamp = { ...query.timestamp, $lte: endDateObj };
    }
    
    // فیلتر سرور
    if (serverId) {
      query.serverId = serverId;
    }
    
    // فیلتر کاربر
    if (userId) {
      query.userId = userId;
    }
    
    // محاسبه تعداد کل رکوردها برای صفحه‌بندی
    const totalLogs = await Log.countDocuments(query);
    
    // محاسبه تعداد صفحات
    const totalPages = Math.ceil(totalLogs / limit);
    
    // ترتیب بندی
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // دریافت لاگ‌ها
    const logs = await Log.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      logs,
      pagination: {
        page,
        limit,
        totalPages,
        totalLogs
      }
    };
  } catch (error) {
    console.error('خطا در دریافت لیست لاگ‌ها:', error);
    throw error;
  }
}

/**
 * دریافت اطلاعات یک لاگ با شناسه
 * @param {string} logId شناسه لاگ
 * @returns {Promise<Object>} اطلاعات لاگ
 */
export async function getLogById(logId) {
  try {
    return await Log.findById(logId);
  } catch (error) {
    console.error(`خطا در دریافت اطلاعات لاگ با شناسه ${logId}:`, error);
    throw error;
  }
}

/**
 * دریافت لاگ‌های یک سرور
 * @param {string} serverId شناسه سرور
 * @param {Object} params پارامترهای فیلتر و صفحه‌بندی
 * @returns {Promise<Object>} لیست لاگ‌ها و اطلاعات صفحه‌بندی
 */
export async function getServerLogs(serverId, params = {}) {
  try {
    if (!serverId) {
      throw new Error('شناسه سرور الزامی است');
    }
    
    // بررسی وجود سرور
    const server = await Server.findOne({ serverId });
    if (!server) {
      throw new Error('سرور یافت نشد');
    }
    
    // اضافه کردن شناسه سرور به پارامترها
    params.serverId = serverId;
    
    return await getLogs(params);
  } catch (error) {
    console.error(`خطا در دریافت لاگ‌های سرور ${serverId}:`, error);
    throw error;
  }
}

/**
 * دریافت لاگ‌های یک کاربر
 * @param {string} userId شناسه کاربر
 * @param {Object} params پارامترهای فیلتر و صفحه‌بندی
 * @returns {Promise<Object>} لیست لاگ‌ها و اطلاعات صفحه‌بندی
 */
export async function getUserLogs(userId, params = {}) {
  try {
    if (!userId) {
      throw new Error('شناسه کاربر الزامی است');
    }
    
    // اضافه کردن شناسه کاربر به پارامترها
    params.userId = userId;
    
    return await getLogs(params);
  } catch (error) {
    console.error(`خطا در دریافت لاگ‌های کاربر ${userId}:`, error);
    throw error;
  }
}

/**
 * دریافت خلاصه لاگ‌ها
 * @returns {Promise<Object>} خلاصه وضعیت لاگ‌ها
 */
export async function getLogsOverview() {
  try {
    // تعداد لاگ‌ها به تفکیک سطح
    const logsByLevel = await Log.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // تعداد لاگ‌ها به تفکیک دسته
    const logsByCategory = await Log.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // تعداد لاگ‌های هر روز در 7 روز اخیر
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const logsByDay = await Log.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // تعداد لاگ‌های خطا در 24 ساعت اخیر
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentErrors = await Log.countDocuments({
      level: { $in: ['error', 'critical'] },
      timestamp: { $gte: oneDayAgo }
    });
    
    // 10 لاگ خطای اخیر
    const recentErrorLogs = await Log.find({
      level: { $in: ['error', 'critical'] }
    })
      .sort({ timestamp: -1 })
      .limit(10);
    
    return {
      totalLogs: await Log.countDocuments(),
      logsByLevel,
      logsByCategory,
      logsByDay,
      recentErrors,
      recentErrorLogs
    };
  } catch (error) {
    console.error('خطا در دریافت خلاصه لاگ‌ها:', error);
    throw error;
  }
}

/**
 * پاک کردن لاگ‌های قدیمی
 * @param {number} days تعداد روز (لاگ‌های قدیمی‌تر از این تعداد روز حذف می‌شوند)
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function clearOldLogs(days) {
  try {
    if (!days || isNaN(days) || days <= 0) {
      throw new Error('تعداد روز باید عددی مثبت باشد');
    }
    
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const result = await Log.deleteMany({ timestamp: { $lt: date } });
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} لاگ قدیمی‌تر از ${days} روز با موفقیت حذف شد`
    };
  } catch (error) {
    console.error('خطا در پاک کردن لاگ‌های قدیمی:', error);
    throw error;
  }
}

/**
 * ثبت لاگ جدید
 * @param {Object} logData اطلاعات لاگ
 * @returns {Promise<Object>} لاگ ثبت شده
 */
export async function createLog(logData) {
  try {
    const {
      level = 'info',
      category = 'system',
      message,
      userId = null,
      serverId = null,
      details = {}
    } = logData;
    
    if (!message) {
      throw new Error('پیام لاگ الزامی است');
    }
    
    const newLog = new Log({
      level,
      category,
      message,
      userId,
      serverId,
      details,
      timestamp: new Date()
    });
    
    await newLog.save();
    
    return newLog;
  } catch (error) {
    console.error('خطا در ثبت لاگ جدید:', error);
    throw error;
  }
}

/**
 * خروجی CSV از لاگ‌ها
 * @param {Object} params پارامترهای فیلتر
 * @returns {Promise<string>} محتوای CSV
 */
export async function exportLogsToCsv(params) {
  try {
    // محدود کردن تعداد رکوردها
    params.limit = params.limit || 1000;
    
    // دریافت لاگ‌ها
    const { logs } = await getLogs(params);
    
    // تعریف هدر CSV
    let csv = 'ID,Timestamp,Level,Category,Message,UserID,ServerID,Details\n';
    
    // افزودن رکوردها به CSV
    for (const log of logs) {
      // پیام و جزئیات را برای CSV آماده می‌کنیم
      const message = log.message?.replace(/,/g, ' ').replace(/"/g, '""');
      const details = log.details ? JSON.stringify(log.details).replace(/,/g, ' ').replace(/"/g, '""') : '';
      
      csv += `${log._id},"${new Date(log.timestamp).toISOString()}",${log.level},${log.category},"${message}",${log.userId || ''},${log.serverId || ''},"${details}"\n`;
    }
    
    return csv;
  } catch (error) {
    console.error('خطا در خروجی CSV از لاگ‌ها:', error);
    throw error;
  }
}

/**
 * سرویس لاگ
 */
export const logsService = {
  getLogs,
  getLogById,
  getServerLogs,
  getUserLogs,
  getLogsOverview,
  clearOldLogs,
  createLog,
  exportLogsToCsv
};