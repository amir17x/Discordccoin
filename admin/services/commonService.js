/**
 * سرویس عمومی برای کارهای مشترک
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * تبدیل آرایه به فایل CSV
 * @param {Array} data آرایه‌ای از اشیاء
 * @param {Array} fields فیلدهایی که باید در CSV قرار گیرند
 * @param {Object} options تنظیمات اضافی
 * @returns {String} محتوای فایل CSV
 */
export function arrayToCSV(data, fields, options = {}) {
  // تنظیمات پیش‌فرض
  const defaults = {
    delimiter: ',',
    includeHeaders: true,
    fieldsMap: {}
  };
  
  const settings = { ...defaults, ...options };
  
  // ساخت هدرها
  let csv = '';
  if (settings.includeHeaders) {
    const headers = fields.map(field => {
      const header = settings.fieldsMap[field] || field;
      return `"${header.replace(/"/g, '""')}"`;
    });
    csv += headers.join(settings.delimiter) + '\n';
  }
  
  // ساخت ردیف‌ها
  for (const item of data) {
    const row = fields.map(field => {
      const value = item[field] !== undefined && item[field] !== null ? item[field] : '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csv += row.join(settings.delimiter) + '\n';
  }
  
  return csv;
}

/**
 * تبدیل تاریخ به رشته فارسی
 * @param {Date} date تاریخ
 * @param {Boolean} includeTime آیا زمان هم نمایش داده شود
 * @returns {String} تاریخ فارسی شده
 */
export function toPersianDate(date, includeTime = false) {
  if (!date) return '';
  
  // تبدیل به تاریخ اگر رشته باشد
  const dateObj = new Date(date);
  
  // برای فعلاً از تاریخ میلادی استفاده می‌کنیم
  // TODO: تبدیل به تاریخ شمسی
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }
  
  return dateObj.toLocaleDateString('fa-IR', options);
}

/**
 * فرمت کردن عدد با جداکننده هزارگان
 * @param {Number} number عدد
 * @returns {String} عدد فرمت شده
 */
export function formatNumber(number) {
  if (number === undefined || number === null) return '';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * گرد کردن عدد اعشاری به تعداد مشخصی رقم اعشار
 * @param {Number} number عدد
 * @param {Number} decimals تعداد ارقام اعشار
 * @returns {Number} عدد گرد شده
 */
export function roundDecimal(number, decimals = 2) {
  if (number === undefined || number === null) return 0;
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * تبدیل رشته به slug (برای URL)
 * @param {String} text متن
 * @returns {String} slug
 */
export function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * فرمت کردن مدت زمان
 * @param {Number} duration مدت زمان به میلی‌ثانیه
 * @returns {String} مدت زمان فرمت شده
 */
export function formatDuration(duration) {
  // تبدیل به ثانیه
  let seconds = Math.floor(duration / 1000);
  
  // محاسبه روز، ساعت، دقیقه و ثانیه
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * 24 * 60 * 60;
  
  const hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;
  
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  
  // ساخت خروجی
  let result = '';
  
  if (days > 0) {
    result += `${days} روز `;
  }
  
  if (hours > 0 || days > 0) {
    result += `${hours} ساعت `;
  }
  
  if (minutes > 0 || hours > 0 || days > 0) {
    result += `${minutes} دقیقه `;
  }
  
  result += `${seconds} ثانیه`;
  
  return result.trim();
}

/**
 * تولید یک رشته تصادفی
 * @param {Number} length طول رشته
 * @param {String} chars کاراکترهای مجاز
 * @returns {String} رشته تصادفی
 */
export function generateRandomString(length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * بررسی معتبر بودن ایمیل
 * @param {String} email ایمیل
 * @returns {Boolean} آیا ایمیل معتبر است
 */
export function isValidEmail(email) {
  // یک regex ساده برای بررسی ایمیل
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * محدود کردن متن به تعداد مشخصی کاراکتر
 * @param {String} text متن
 * @param {Number} limit محدودیت کاراکتر
 * @param {String} suffix پسوند در صورت محدود شدن
 * @returns {String} متن محدود شده
 */
export function truncateText(text, limit = 100, suffix = '...') {
  if (!text) return '';
  
  if (text.length <= limit) {
    return text;
  }
  
  return text.substring(0, limit) + suffix;
}

/**
 * ثبت لاگ رویدادها
 * @param {String} level سطح لاگ (info, warn, error, debug)
 * @param {String} message پیام
 * @param {Object} details جزئیات اضافی
 */
export async function logEvent(level, message, details = {}) {
  const logEntry = {
    timestamp: new Date(),
    level,
    message,
    details
  };
  
  console.log(`[${level.toUpperCase()}] ${message}`, details);
  
  // در محیط توسعه، لاگ‌ها را در فایل ذخیره می‌کنیم
  if (process.env.NODE_ENV === 'development') {
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      
      // اطمینان از وجود پوشه logs
      await fs.mkdir(logsDir, { recursive: true });
      
      const logFile = path.join(logsDir, `${level}.log`);
      const logData = JSON.stringify(logEntry) + '\n';
      
      await fs.appendFile(logFile, logData);
    } catch (error) {
      console.error('خطا در ذخیره لاگ:', error);
    }
  }
}

export const commonService = {
  arrayToCSV,
  toPersianDate,
  formatNumber,
  roundDecimal,
  slugify,
  formatDuration,
  generateRandomString,
  isValidEmail,
  truncateText,
  logEvent
};