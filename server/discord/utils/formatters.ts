/**
 * مجموعه توابع فرمت‌دهی برای استفاده در نمایش اطلاعات مختلف
 * این فایل شامل توابع مفید برای فرمت کردن اعداد، تاریخ‌ها، و سایر داده‌ها است
 */

/**
 * فرمت کردن اعداد با جداکننده هزارگان
 * مثال: 1000000 -> 1,000,000
 * @param num عدد برای فرمت کردن
 * @returns عدد فرمت شده با جداکننده هزارگان
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * فرمت کردن تاریخ به صورت خوانا
 * @param date تاریخ
 * @param locale زبان مورد نظر (پیش‌فرض: فارسی)
 * @returns تاریخ فرمت شده
 */
export function formatDate(date: Date | string, locale: string = 'fa-IR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateObj.toISOString().split('T')[0]; // فالبک به فرمت ساده‌تر
  }
}

/**
 * نمایش زمان سپری شده به صورت متنی
 * مثال: "۳ دقیقه پیش"، "۲ ساعت پیش"، "دیروز"
 * @param date تاریخ
 * @param locale زبان مورد نظر (پیش‌فرض: فارسی)
 * @returns متن زمان سپری شده
 */
export function timeAgo(date: Date | string, locale: string = 'fa-IR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (locale === 'fa-IR') {
    if (diffSec < 60) return 'همین الان';
    if (diffMin < 60) return `${diffMin} دقیقه پیش`;
    if (diffHour < 24) return `${diffHour} ساعت پیش`;
    if (diffDay === 1) return 'دیروز';
    if (diffDay < 7) return `${diffDay} روز پیش`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} هفته پیش`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} ماه پیش`;
    return `${Math.floor(diffDay / 365)} سال پیش`;
  } else {
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return 'yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} months ago`;
    return `${Math.floor(diffDay / 365)} years ago`;
  }
}

/**
 * نوع تراکنش به همراه ایموجی مناسب
 * @param transactionType نوع تراکنش
 * @returns نوع تراکنش فارسی به همراه ایموجی
 */
export function formatTransactionType(transactionType: string): string {
  const types: Record<string, string> = {
    'deposit': '💰 واریز به بانک',
    'withdraw': '💸 برداشت از بانک',
    'bank_interest': '✨ سود بانکی',
    'transfer_in': '📥 دریافت حواله',
    'transfer_out': '📤 ارسال حواله',
    'game_win': '🎮 برد در بازی',
    'game_loss': '🎮 باخت در بازی',
    'quest_reward': '🏆 جایزه ماموریت',
    'daily_reward': '🎁 جایزه روزانه',
    'steal_success': '🦹‍♂️ دزدی موفق',
    'steal_victim': '😱 قربانی دزدی',
    'steal_failed': '🚓 دزدی ناموفق',
    'item_purchase': '🛒 خرید آیتم',
    'item_sold': '💼 فروش آیتم',
    'job_income': '💼 درآمد شغلی',
    'loan_taken': '📝 دریافت وام',
    'loan_repayment': '📋 بازپرداخت وام',
    'lottery_ticket': '🎟️ خرید بلیط لاتاری',
    'lottery_win': '🎯 برنده لاتاری',
    'investment': '📈 سرمایه‌گذاری',
    'investment_return': '💹 سود سرمایه‌گذاری',
    'stock_buy': '📊 خرید سهام',
    'stock_sell': '📊 فروش سهام',
    'stock_dividend': '💲 سود سهام',
    'clan_contribution': '🏰 کمک به کلن',
    'clan_withdraw': '🏰 برداشت از کلن',
    'wheel_of_fortune': '🎡 چرخ شانس',
    'giveaway_ticket': '🎫 بلیط قرعه‌کشی',
    'premium_purchase': '⭐ خرید اشتراک ویژه',
    'auction_bid': '🔨 پیشنهاد در حراجی',
    'auction_win': '🏆 برنده حراجی',
    'auction_refund': '💱 بازگشت وجه حراجی',
    'crystal_exchange': '💎 تبدیل کریستال',
    'admin_add': '👑 افزایش توسط ادمین',
    'admin_remove': '👑 کاهش توسط ادمین',
    'subscription_purchase': '📱 خرید اشتراک',
    'gift_received': '🎁 هدیه دریافتی',
    'gift_sent': '🎁 هدیه ارسالی'
  };
  
  return types[transactionType] || `❓ ${transactionType}`;
}

/**
 * فرمت کردن مبلغ تراکنش (مثبت یا منفی) با فرمت و رنگ مناسب
 * @param amount مبلغ تراکنش
 * @param currency واحد پول (پیش‌فرض: Ccoin)
 * @returns مبلغ فرمت شده
 */
export function formatTransactionAmount(amount: number, currency: string = 'Ccoin'): string {
  if (amount > 0) {
    return `+${formatNumber(amount)} ${currency}`;
  } else if (amount < 0) {
    return `${formatNumber(amount)} ${currency}`;
  } else {
    return `${formatNumber(amount)} ${currency}`;
  }
}

/**
 * ایجاد نوار پیشرفت با ایموجی
 * @param current مقدار فعلی
 * @param max مقدار حداکثر
 * @param length طول نوار پیشرفت (پیش‌فرض: 10)
 * @param filledEmoji ایموجی برای قسمت‌های پر (پیش‌فرض: 🟩)
 * @param emptyEmoji ایموجی برای قسمت‌های خالی (پیش‌فرض: ⬜)
 * @returns نوار پیشرفت ایموجی
 */
export function createProgressBar(
  current: number, 
  max: number, 
  length: number = 10, 
  filledEmoji: string = '🟩', 
  emptyEmoji: string = '⬜'
): string {
  const percent = current / max;
  const filledLength = Math.round(percent * length);
  let progressBar = '';
  
  for (let i = 0; i < length; i++) {
    progressBar += i < filledLength ? filledEmoji : emptyEmoji;
  }
  
  return progressBar;
}

/**
 * فرمت کردن زمان به صورت ساعت:دقیقه:ثانیه
 * @param seconds زمان به ثانیه
 * @returns زمان فرمت شده
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} ساعت`);
  if (minutes > 0) parts.push(`${minutes} دقیقه`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} ثانیه`);
  
  return parts.join(' و ');
}

/**
 * دریافت ایموجی متناسب با صنعت سهام
 * @param sector صنعت سهام
 * @returns ایموجی مناسب
 */
export function getSectorEmoji(sector: string): string {
  const sectorEmojis: Record<string, string> = {
    'tech': '💻',
    'technology': '💻',
    'finance': '💹',
    'banking': '🏦',
    'energy': '⚡',
    'oil': '🛢️',
    'consumer': '🛒',
    'food': '🍔',
    'industrial': '🏭',
    'automotive': '🚗',
    'mining': '⛏️',
    'healthcare': '🩺',
    'telecom': '📱',
    'entertainment': '🎬',
    'retail': '🏪',
    'travel': '✈️',
    'media': '📺',
    'real_estate': '🏢'
  };
  
  return sectorEmojis[sector.toLowerCase()] || '🏢';
}

/**
 * دریافت نام فارسی صنعت سهام
 * @param sector صنعت سهام
 * @returns نام فارسی صنعت
 */
export function getSectorName(sector: string): string {
  const sectorNames: Record<string, string> = {
    'tech': 'فناوری',
    'technology': 'فناوری',
    'finance': 'امور مالی',
    'banking': 'بانکداری',
    'energy': 'انرژی',
    'oil': 'نفت',
    'consumer': 'مصرفی',
    'food': 'غذایی',
    'industrial': 'صنعتی',
    'automotive': 'خودروسازی',
    'mining': 'معدن',
    'healthcare': 'سلامت',
    'telecom': 'مخابرات',
    'entertainment': 'سرگرمی',
    'retail': 'خرده‌فروشی',
    'travel': 'گردشگری',
    'media': 'رسانه',
    'real_estate': 'املاک'
  };
  
  return sectorNames[sector.toLowerCase()] || sector;
}