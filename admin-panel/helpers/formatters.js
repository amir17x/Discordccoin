/**
 * توابع کمکی برای فرمت کردن داده‌ها در قالب‌های مختلف
 */

/**
 * فرمت کردن اعداد با جداکننده هزارگان
 * @param {Number} num عدد مورد نظر
 * @returns {String} متن فرمت شده
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * نمایش زمان سپری شده از یک تاریخ
 * @param {Date} date تاریخ مورد نظر
 * @returns {String} متن نمایشی مدت زمان
 */
export function timeAgo(date) {
  if (!date) return 'نامشخص';
  
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now - past) / 1000);
  
  if (diff < 60) return 'همین الان';
  if (diff < 3600) return Math.floor(diff / 60) + ' دقیقه پیش';
  if (diff < 86400) return Math.floor(diff / 3600) + ' ساعت پیش';
  if (diff < 604800) return Math.floor(diff / 86400) + ' روز پیش';
  if (diff < 2592000) return Math.floor(diff / 604800) + ' هفته پیش';
  if (diff < 31536000) return Math.floor(diff / 2592000) + ' ماه پیش';
  
  return Math.floor(diff / 31536000) + ' سال پیش';
}

/**
 * فرمت کردن تاریخ به صورت شمسی
 * @param {Date} date تاریخ میلادی
 * @returns {String} تاریخ شمسی
 */
export function formatDate(date) {
  if (!date) return 'نامشخص';
  
  const d = new Date(date);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Intl.DateTimeFormat('fa-IR', options).format(d);
  } catch (e) {
    return d.toLocaleString('fa-IR');
  }
}

/**
 * تبدیل ثانیه به فرمت زمانی خوانا
 * @param {Number} seconds ثانیه
 * @returns {String} زمان فرمت شده
 */
export function formatDuration(seconds) {
  if (!seconds) return '0 ثانیه';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  let result = '';
  if (days > 0) result += days + ' روز ';
  if (hours > 0) result += hours + ' ساعت ';
  if (minutes > 0) result += minutes + ' دقیقه ';
  if (secs > 0 && days === 0 && hours === 0) result += secs + ' ثانیه';
  
  return result.trim();
}

/**
 * ایجاد نوار پیشرفت متنی
 * @param {Number} percent درصد پیشرفت
 * @param {Number} length طول نوار
 * @returns {String} متن نوار پیشرفت
 */
export function progressBar(percent, length = 10) {
  percent = Math.min(100, Math.max(0, percent));
  const filled = Math.round(percent * length / 100);
  const empty = length - filled;
  
  return '█'.repeat(filled) + '▒'.repeat(empty) + ` ${percent}%`;
}

// Define a default export for convenience
export default {
  formatNumber,
  timeAgo,
  formatDate,
  formatDuration,
  progressBar
};