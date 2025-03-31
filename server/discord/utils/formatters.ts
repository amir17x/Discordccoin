/**
 * توابع کمکی برای فرمت‌کردن داده‌ها برای نمایش در رابط کاربری
 */

/**
 * فرمت‌کردن اعداد با جداکننده هزارگان
 * @param number عدد مورد نظر
 * @returns عدد فرمت‌شده با جداکننده هزارگان
 */
export function formatNumber(number: number): string {
  return number.toLocaleString('fa-IR');
}

/**
 * فرمت‌کردن تاریخ به شکل خوانا
 * @param date تاریخ مورد نظر
 * @returns تاریخ فرمت‌شده
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * کوتاه‌کردن متن طولانی
 * @param text متن مورد نظر
 * @param maxLength حداکثر طول مجاز
 * @returns متن کوتاه‌شده
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * تبدیل زمان به متن نسبی (مثلاً "۳ دقیقه پیش")
 * @param date تاریخ مورد نظر
 * @returns متن نشان‌دهنده زمان نسبی
 */
export function timeAgo(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} روز پیش`;
  } else if (hours > 0) {
    return `${hours} ساعت پیش`;
  } else if (minutes > 0) {
    return `${minutes} دقیقه پیش`;
  } else {
    return 'همین الان';
  }
}

/**
 * فرمت‌کردن مبلغ به شکل رایج
 * @param amount مبلغ مورد نظر
 * @param currency نوع ارز
 * @returns متن فرمت‌شده
 */
export function formatCurrency(amount: number, currency: 'coin' | 'crystal' = 'coin'): string {
  const formatted = formatNumber(amount);
  if (currency === 'coin') {
    return `${formatted} سکه`;
  } else {
    return `${formatted} کریستال`;
  }
}