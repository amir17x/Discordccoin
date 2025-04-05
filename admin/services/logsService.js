/**
 * سرویس مدیریت لاگ‌ها
 * 
 * این سرویس مسئول بارگیری و مدیریت لاگ‌های سیستم است.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbClient } from '../lib/database.js';

// تبدیل مسیر نسبی به مسیر مطلق
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_SETTINGS_PATH = path.join(__dirname, '../../config/log-settings.json');

/**
 * دریافت تنظیمات لاگ
 * @returns {Promise<Object>} تنظیمات لاگ
 */
export async function getLogSettings() {
  try {
    if (!fs.existsSync(LOG_SETTINGS_PATH)) {
      // ایجاد تنظیمات پیش‌فرض اگر فایل وجود ندارد
      const defaultSettings = {
        systemLogs: {
          enabled: true,
          level: 'info',
          maxEntries: 10000,
          retention: 30 // روز
        },
        userLogs: {
          enabled: true,
          retention: 60 // روز
        },
        transactionLogs: {
          enabled: true,
          retention: 90 // روز
        },
        gameLogs: {
          enabled: true,
          retention: 30 // روز
        },
        adminLogs: {
          enabled: true,
          retention: 120 // روز
        },
        aiLogs: {
          enabled: true,
          retention: 60 // روز
        },
        errorLogs: {
          enabled: true,
          retention: 90 // روز
        }
      };
      
      fs.writeFileSync(LOG_SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    
    const settings = JSON.parse(fs.readFileSync(LOG_SETTINGS_PATH, 'utf8'));
    return settings;
  } catch (error) {
    console.error('Error loading log settings:', error);
    throw new Error('خطا در بارگیری تنظیمات لاگ');
  }
}

/**
 * بروزرسانی تنظیمات لاگ
 * @param {Object} settings تنظیمات جدید
 * @returns {Promise<Object>} تنظیمات بروزرسانی شده
 */
export async function updateLogSettings(settings) {
  try {
    // اطمینان از وجود مسیر فایل
    const dir = path.dirname(LOG_SETTINGS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // ذخیره تنظیمات جدید
    fs.writeFileSync(LOG_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return settings;
  } catch (error) {
    console.error('Error updating log settings:', error);
    throw new Error('خطا در بروزرسانی تنظیمات لاگ');
  }
}

/**
 * دریافت لاگ‌های سیستم
 * @param {Object} options گزینه‌های فیلتر لاگ‌ها
 * @returns {Promise<Array>} لاگ‌های سیستم
 */
export async function getSystemLogs(options = {}) {
  try {
    const { page = 1, limit = 50, level, startDate, endDate } = options;
    
    // ایجاد فیلتر برای جستجو
    const filter = {};
    if (level) filter.level = level;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // تنظیم صفحه‌بندی
    const skip = (page - 1) * limit;
    const limitValue = limit > 0 ? parseInt(limit) : 0;
    
    // دریافت لاگ‌ها از پایگاه داده
    const logs = await dbClient.collection('system_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitValue)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return [];
  }
}

/**
 * دریافت لاگ‌های کاربران
 * @param {Object} options گزینه‌های فیلتر لاگ‌ها
 * @returns {Promise<Array>} لاگ‌های کاربران
 */
export async function getUserLogs(options = {}) {
  try {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = options;
    
    // ایجاد فیلتر برای جستجو
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // تنظیم صفحه‌بندی
    const skip = (page - 1) * limit;
    const limitValue = limit > 0 ? parseInt(limit) : 0;
    
    // دریافت لاگ‌ها از پایگاه داده
    const logs = await dbClient.collection('user_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitValue)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error('Error fetching user logs:', error);
    return [];
  }
}

/**
 * دریافت لاگ‌های تراکنش‌ها
 * @param {Object} options گزینه‌های فیلتر لاگ‌ها
 * @returns {Promise<Array>} لاگ‌های تراکنش‌ها
 */
export async function getTransactionLogs(options = {}) {
  try {
    const { page = 1, limit = 50, userId, type, startDate, endDate } = options;
    
    // ایجاد فیلتر برای جستجو
    const filter = {};
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // تنظیم صفحه‌بندی
    const skip = (page - 1) * limit;
    const limitValue = limit > 0 ? parseInt(limit) : 0;
    
    // دریافت لاگ‌ها از پایگاه داده
    const logs = await dbClient.collection('transaction_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitValue)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error('Error fetching transaction logs:', error);
    return [];
  }
}

/**
 * دریافت لاگ‌های بازی‌ها
 * @param {Object} options گزینه‌های فیلتر لاگ‌ها
 * @returns {Promise<Array>} لاگ‌های بازی‌ها
 */
export async function getGameLogs(options = {}) {
  try {
    const { page = 1, limit = 50, userId, gameType, result, startDate, endDate } = options;
    
    // ایجاد فیلتر برای جستجو
    const filter = {};
    if (userId) filter.userId = userId;
    if (gameType) filter.gameType = gameType;
    if (result) filter.result = result;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // تنظیم صفحه‌بندی
    const skip = (page - 1) * limit;
    const limitValue = limit > 0 ? parseInt(limit) : 0;
    
    // دریافت لاگ‌ها از پایگاه داده
    const logs = await dbClient.collection('game_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitValue)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error('Error fetching game logs:', error);
    return [];
  }
}

/**
 * دریافت لاگ‌های ادمین
 * @param {Object} options گزینه‌های فیلتر لاگ‌ها
 * @returns {Promise<Array>} لاگ‌های ادمین
 */
export async function getAdminLogs(options = {}) {
  try {
    const { page = 1, limit = 50, adminId, action, startDate, endDate } = options;
    
    // ایجاد فیلتر برای جستجو
    const filter = {};
    if (adminId) filter.adminId = adminId;
    if (action) filter.action = action;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // تنظیم صفحه‌بندی
    const skip = (page - 1) * limit;
    const limitValue = limit > 0 ? parseInt(limit) : 0;
    
    // دریافت لاگ‌ها از پایگاه داده
    const logs = await dbClient.collection('admin_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitValue)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }
}

/**
 * دریافت لاگ‌های هوش مصنوعی
 * @param {Object} options گزینه‌های فیلتر لاگ‌ها
 * @returns {Promise<Array>} لاگ‌های هوش مصنوعی
 */
export async function getAILogs(options = {}) {
  try {
    const { page = 1, limit = 50, userId, model, startDate, endDate } = options;
    
    // ایجاد فیلتر برای جستجو
    const filter = {};
    if (userId) filter.userId = userId;
    if (model) filter.model = model;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // تنظیم صفحه‌بندی
    const skip = (page - 1) * limit;
    const limitValue = limit > 0 ? parseInt(limit) : 0;
    
    // دریافت لاگ‌ها از پایگاه داده
    const logs = await dbClient.collection('ai_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitValue)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error('Error fetching AI logs:', error);
    return [];
  }
}

/**
 * دریافت لاگ‌های خطا
 * @param {Object} options گزینه‌های فیلتر لاگ‌ها
 * @returns {Promise<Array>} لاگ‌های خطا
 */
export async function getErrorLogs(options = {}) {
  try {
    const { page = 1, limit = 50, module, severity, startDate, endDate } = options;
    
    // ایجاد فیلتر برای جستجو
    const filter = {};
    if (module) filter.module = module;
    if (severity) filter.severity = severity;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // تنظیم صفحه‌بندی
    const skip = (page - 1) * limit;
    const limitValue = limit > 0 ? parseInt(limit) : 0;
    
    // دریافت لاگ‌ها از پایگاه داده
    const logs = await dbClient.collection('error_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitValue)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return [];
  }
}

/**
 * پاکسازی لاگ‌ها
 * @param {string} logType نوع لاگ
 * @returns {Promise<boolean>} نتیجه عملیات
 */
export async function clearLogs(logType) {
  try {
    let collectionName;
    
    // تعیین نام مجموعه بر اساس نوع لاگ
    switch (logType) {
      case 'system':
        collectionName = 'system_logs';
        break;
      case 'user':
        collectionName = 'user_logs';
        break;
      case 'transaction':
        collectionName = 'transaction_logs';
        break;
      case 'game':
        collectionName = 'game_logs';
        break;
      case 'admin':
        collectionName = 'admin_logs';
        break;
      case 'ai':
        collectionName = 'ai_logs';
        break;
      case 'error':
        collectionName = 'error_logs';
        break;
      default:
        throw new Error('نوع لاگ نامعتبر است');
    }
    
    // پاکسازی مجموعه
    await dbClient.collection(collectionName).deleteMany({});
    
    return true;
  } catch (error) {
    console.error(`Error clearing ${logType} logs:`, error);
    throw new Error(`خطا در پاکسازی لاگ‌های ${logType}`);
  }
}

/**
 * ثبت یک تراکنش
 * @param {Object} data داده‌های تراکنش
 * @returns {Promise<Object>} تراکنش ثبت شده
 */
export async function logTransaction(userId, username, type, amount, description) {
  try {
    const transaction = {
      userId,
      username,
      type,
      amount,
      description,
      timestamp: new Date()
    };
    
    await dbClient.collection('transaction_logs').insertOne(transaction);
    return transaction;
  } catch (error) {
    console.error('Error logging transaction:', error);
    return null;
  }
}

/**
 * ثبت یک بازی
 * @param {Object} data داده‌های بازی
 * @returns {Promise<Object>} بازی ثبت شده
 */
export async function logGame(userId, username, gameType, result, bet, reward) {
  try {
    const game = {
      userId,
      username,
      gameType,
      result,
      bet,
      reward,
      timestamp: new Date()
    };
    
    await dbClient.collection('game_logs').insertOne(game);
    return game;
  } catch (error) {
    console.error('Error logging game:', error);
    return null;
  }
}

/**
 * ثبت فعالیت کاربر
 * @param {Object} data داده‌های فعالیت
 * @returns {Promise<Object>} فعالیت ثبت شده
 */
export async function logUserActivity(userId, username, activity, details) {
  try {
    const userActivity = {
      userId,
      username,
      activity,
      details,
      timestamp: new Date()
    };
    
    await dbClient.collection('user_logs').insertOne(userActivity);
    return userActivity;
  } catch (error) {
    console.error('Error logging user activity:', error);
    return null;
  }
}

/**
 * ثبت فعالیت ادمین
 * @param {Object} data داده‌های فعالیت
 * @returns {Promise<Object>} فعالیت ثبت شده
 */
export async function logAdminActivity(adminId, adminName, action, targetId, targetName, details) {
  try {
    const adminActivity = {
      adminId,
      adminName,
      action,
      targetId,
      targetName,
      details,
      timestamp: new Date()
    };
    
    await dbClient.collection('admin_logs').insertOne(adminActivity);
    return adminActivity;
  } catch (error) {
    console.error('Error logging admin activity:', error);
    return null;
  }
}

/**
 * ثبت درخواست هوش مصنوعی
 * @param {Object} data داده‌های درخواست
 * @returns {Promise<Object>} درخواست ثبت شده
 */
export async function logAI(userId, username, model, prompt, tokens, processingTime) {
  try {
    const aiRequest = {
      userId,
      username,
      model,
      prompt,
      tokens,
      processingTime,
      timestamp: new Date()
    };
    
    await dbClient.collection('ai_logs').insertOne(aiRequest);
    return aiRequest;
  } catch (error) {
    console.error('Error logging AI request:', error);
    return null;
  }
}

/**
 * ثبت خطا
 * @param {Object} data داده‌های خطا
 * @returns {Promise<Object>} خطای ثبت شده
 */
export async function logError(error, module, userId, username, stackTrace = '') {
  try {
    const errorLog = {
      error: error.message || String(error),
      module,
      userId,
      username,
      stackTrace,
      timestamp: new Date()
    };
    
    await dbClient.collection('error_logs').insertOne(errorLog);
    return errorLog;
  } catch (err) {
    console.error('Error logging error:', err);
    return null;
  }
}

/**
 * ثبت پیام سیستم
 * @param {string} level سطح پیام
 * @param {string} message متن پیام
 * @returns {Promise<Object>} پیام ثبت شده
 */
export async function logSystem(level, message) {
  try {
    const systemLog = {
      level,
      message,
      timestamp: new Date()
    };
    
    await dbClient.collection('system_logs').insertOne(systemLog);
    return systemLog;
  } catch (error) {
    console.error('Error logging system message:', error);
    return null;
  }
}

/**
 * ثبت رویداد
 * @param {Object} data داده‌های رویداد
 * @returns {Promise<Object>} رویداد ثبت شده
 */
export async function logEvent(userId, username, eventType, severity, details) {
  try {
    const event = {
      userId,
      username,
      eventType,
      severity,
      details,
      timestamp: new Date()
    };
    
    await dbClient.collection('event_logs').insertOne(event);
    return event;
  } catch (error) {
    console.error('Error logging event:', error);
    return null;
  }
}

/**
 * ثبت لاگ اختصاصی
 * @param {string} collectionName نام مجموعه
 * @param {Object} data داده‌های لاگ
 * @returns {Promise<Object>} لاگ ثبت شده
 */
export async function logCustom(eventType, details, fields = {}) {
  try {
    const customLog = {
      eventType,
      details,
      ...fields,
      timestamp: new Date()
    };
    
    await dbClient.collection('custom_logs').insertOne(customLog);
    return customLog;
  } catch (error) {
    console.error('Error logging custom data:', error);
    return null;
  }
}