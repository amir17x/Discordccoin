/**
 * فرمت‌کننده اعداد به صورت خوانا با جداکننده هزارگان
 * @param num عدد مورد نظر
 * @param options تنظیمات اختیاری
 * @returns رشته فرمت شده
 */
export function formatNumber(num: number, options: { currency?: boolean } = {}): string {
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = parts.join('.');
  
  return options.currency ? `${formatted} Ccoin` : formatted;
}

/**
 * فرمت‌کننده تاریخ به صورت خوانا
 * @param date تاریخ مورد نظر
 * @param includeTime آیا زمان هم نمایش داده شود
 * @returns رشته فرمت شده
 */
export function formatDate(date: Date | string | null, includeTime: boolean = true): string {
  if (!date) return "هیچوقت";
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // تبدیل به فرمت فارسی
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('fa-IR', options).format(d);
}

/**
 * فرمت کردن زمان نسبی (مثلاً "3 روز پیش")
 * @param date تاریخ مورد نظر
 * @returns زمان نسبی
 */
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "هیچوقت";
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return "همین الان";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} دقیقه پیش`;
  } else if (diffHours < 24) {
    return `${diffHours} ساعت پیش`;
  } else if (diffDays < 30) {
    return `${diffDays} روز پیش`;
  } else {
    return formatDate(d, false);
  }
}

/**
 * ایجاد نوار پیشرفت متنی با طراحی زیبا
 * @param percent درصد پیشرفت (0 تا 100)
 * @param length طول نوار
 * @param showPercent نمایش درصد
 * @param style سبک نوار پیشرفت
 * @returns رشته نوار پیشرفت
 */
export function createProgressBar(
  percent: number, 
  length: number = 10, 
  showPercent: boolean = true,
  style: 'default' | 'elegant' | 'colorful' | 'emoji' = 'elegant'
): string {
  percent = Math.max(0, Math.min(100, percent));
  const filledLength = Math.round(length * percent / 100);
  const emptyLength = length - filledLength;
  
  let filled: string;
  let empty: string;
  let prefix: string = '';
  let suffix: string = '';
  
  switch (style) {
    case 'default':
      filled = '█'.repeat(filledLength);
      empty = '░'.repeat(emptyLength);
      break;
    case 'elegant':
      filled = '■'.repeat(filledLength);
      empty = '□'.repeat(emptyLength);
      break;
    case 'colorful':
      filled = '🟩'.repeat(filledLength);
      empty = '⬜'.repeat(emptyLength);
      break;
    case 'emoji':
      // برای درصدهای مختلف ایموجی‌های متفاوت نمایش می‌دهیم
      if (percent <= 20) {
        prefix = '😟 ';
      } else if (percent <= 40) {
        prefix = '🙂 ';
      } else if (percent <= 60) {
        prefix = '😊 ';
      } else if (percent <= 80) {
        prefix = '😄 ';
      } else {
        prefix = '🌟 ';
      }
      filled = '✅'.repeat(filledLength);
      empty = '⬜'.repeat(emptyLength);
      break;
    default:
      filled = '█'.repeat(filledLength);
      empty = '░'.repeat(emptyLength);
  }
  
  // در صورت تکمیل بودن پیشرفت، پسوند انتخاب می‌کنیم
  if (percent >= 100) {
    suffix = style === 'emoji' ? ' 🎉' : ' ✓';
  }
  
  const percentText = showPercent ? ` ${percent}%` : '';
  return `${prefix}${filled}${empty}${percentText}${suffix}`;
}

/**
 * فرمت کردن اعشاری
 * @param num عدد
 * @param precision تعداد رقم اعشار
 * @returns عدد فرمت شده
 */
export function formatDecimal(num: number, precision: number = 2): string {
  return num.toFixed(precision);
}

/**
 * تبدیل ثانیه به فرمت زمانی خوانا
 * @param seconds ثانیه
 * @returns زمان فرمت شده
 */
export function formatTimeFromSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ثانیه`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes} دقیقه و ${remainingSeconds} ثانیه` 
      : `${minutes} دقیقه`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0 
      ? `${hours} ساعت و ${remainingMinutes} دقیقه` 
      : `${hours} ساعت`;
  }
}

/**
 * سانسور کردن بخشی از یک متن (مثلاً برای نمایش شماره کارت)
 * @param text متن اصلی
 * @param visibleChars تعداد کاراکترهای قابل مشاهده از انتها
 * @param mask کاراکتر جایگزین
 * @returns متن سانسور شده
 */
export function maskText(text: string, visibleChars: number = 4, mask: string = '*'): string {
  if (!text) return '';
  if (text.length <= visibleChars) return text;
  
  const visible = text.slice(-visibleChars);
  const masked = mask.repeat(text.length - visibleChars);
  
  return masked + visible;
}

/**
 * ایجاد آیکون متناسب با مقدار
 * @param value مقدار کمی (عددی)
 * @param max حداکثر مقدار مورد انتظار
 * @param theme مجموعه آیکون‌ها
 * @returns ایموجی متناسب
 */
export function getValueIcon(
  value: number, 
  max: number = 100,
  theme: 'money' | 'transaction' | 'status' | 'rating' | 'level' = 'status'
): string {
  const percent = Math.min(100, (value / max) * 100);
  
  if (theme === 'money') {
    if (percent >= 90) return '💰';
    if (percent >= 70) return '💵';
    if (percent >= 50) return '💸';
    if (percent >= 30) return '🪙';
    return '💲';
  }
  
  if (theme === 'transaction') {
    if (percent >= 90) return '📊';
    if (percent >= 70) return '📈';
    if (percent >= 50) return '🔄';
    if (percent >= 30) return '💱';
    return '💹';
  }
  
  if (theme === 'rating') {
    if (percent >= 90) return '⭐⭐⭐⭐⭐';
    if (percent >= 70) return '⭐⭐⭐⭐';
    if (percent >= 50) return '⭐⭐⭐';
    if (percent >= 30) return '⭐⭐';
    return '⭐';
  }
  
  if (theme === 'level') {
    if (percent >= 90) return '🏆';
    if (percent >= 70) return '🥇';
    if (percent >= 50) return '🥈';
    if (percent >= 30) return '🥉';
    return '🔰';
  }
  
  // حالت پیش‌فرض - وضعیت عمومی
  if (percent >= 90) return '🌟';
  if (percent >= 70) return '✨';
  if (percent >= 50) return '⭐';
  if (percent >= 30) return '🔆';
  return '✧';
}

/**
 * ایجاد تصویر هنر اسکی مرتبط با موضوع
 * @param theme موضوع هنر
 * @returns متن هنر اسکی
 */
export function getThemeAsciiArt(theme: 'economic' | 'bank' | 'job' | 'stock' | 'loan'): string {
  switch (theme) {
    case 'economic':
      return `
╭━━━━━━━━━━╮
┃   💰 💎   ┃
┃  💲 💼 💵  ┃
╰━━━━━━━━━━╯`;
    case 'bank':
      return `
╭━━━━━━━━━━╮
┃   🏦 💰   ┃
┃  💲 💳 💵  ┃
╰━━━━━━━━━━╯`;
    case 'job':
      return `
╭━━━━━━━━━━╮
┃   👨‍💼 👩‍💼   ┃
┃  📝 🛠️ 💼  ┃
╰━━━━━━━━━━╯`;
    case 'stock':
      return `
╭━━━━━━━━━━╮
┃   📊 📈   ┃
┃  📉 💹 📑  ┃
╰━━━━━━━━━━╯`;
    case 'loan':
      return `
╭━━━━━━━━━━╮
┃   💳 💸   ┃
┃  📝 🏦 ⏰  ┃
╰━━━━━━━━━━╯`;
    default:
      return '';
  }
}