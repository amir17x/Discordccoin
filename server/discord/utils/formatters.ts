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
 * دریافت اطلاعات کامل مربوط به نوع تراکنش
 * @param transactionType نوع تراکنش
 * @returns اطلاعات نمایشی تراکنش شامل عنوان، ایموجی، توضیحات و رنگ
 */
export function getTransactionTypeInfo(transactionType: string): {
  label: string;
  emoji: string;
  description: string;
  color: string;
  category: 'bank' | 'transfer' | 'game' | 'shop' | 'investment' | 'crime' | 'daily' | 'job' | 'clan' | 'admin' | 'lottery' | 'other';
} {
  const types: Record<string, {
    label: string;
    emoji: string;
    description: string;
    color: string;
    category: 'bank' | 'transfer' | 'game' | 'shop' | 'investment' | 'crime' | 'daily' | 'job' | 'clan' | 'admin' | 'lottery' | 'other';
  }> = {
    // بانک و انتقال
    'deposit': {
      label: 'واریز به بانک',
      emoji: '💰',
      description: 'واریز سکه به حساب بانکی',
      color: '🟢',
      category: 'bank'
    },
    'withdraw': {
      label: 'برداشت از بانک',
      emoji: '💸',
      description: 'برداشت سکه از حساب بانکی',
      color: '🔴',
      category: 'bank'
    },
    'bank_interest': {
      label: 'سود بانکی',
      emoji: '✨',
      description: 'دریافت سود سپرده بانکی',
      color: '🟢',
      category: 'bank'
    },
    'transfer_sent': {
      label: 'ارسال سکه',
      emoji: '📤',
      description: 'ارسال سکه به کاربر دیگر',
      color: '🔴',
      category: 'transfer'
    },
    'transfer_received': {
      label: 'دریافت سکه',
      emoji: '📥',
      description: 'دریافت سکه از کاربر دیگر',
      color: '🟢',
      category: 'transfer'
    },
    'transfer_in': {
      label: 'دریافت حواله',
      emoji: '📥',
      description: 'دریافت حواله از کاربر دیگر',
      color: '🟢',
      category: 'transfer'
    },
    'transfer_out': {
      label: 'ارسال حواله',
      emoji: '📤',
      description: 'ارسال حواله به کاربر دیگر',
      color: '🔴',
      category: 'transfer'
    },
    
    // بازی و سرگرمی
    'game_win': {
      label: 'برد در بازی',
      emoji: '🎮',
      description: 'برنده شدن در بازی و دریافت جایزه',
      color: '🟢',
      category: 'game'
    },
    'game_loss': {
      label: 'باخت در بازی',
      emoji: '🎮',
      description: 'باختن در بازی و از دست دادن سکه',
      color: '🔴',
      category: 'game'
    },
    'game_bet': {
      label: 'شرط‌بندی',
      emoji: '🎲',
      description: 'شرط‌بندی در بازی',
      color: '🔴',
      category: 'game'
    },
    'game_reward': {
      label: 'جایزه بازی',
      emoji: '🏆',
      description: 'دریافت جایزه بازی',
      color: '🟢',
      category: 'game'
    },
    'wheel_spin': {
      label: 'چرخ شانس',
      emoji: '🎡',
      description: 'دریافت جایزه از چرخ شانس',
      color: '🟢',
      category: 'game'
    },
    
    // ماموریت و پاداش روزانه
    'quest_reward': {
      label: 'جایزه ماموریت',
      emoji: '🏆',
      description: 'دریافت پاداش تکمیل ماموریت',
      color: '🟢',
      category: 'daily'
    },
    'daily': {
      label: 'پاداش روزانه',
      emoji: '🎁',
      description: 'دریافت پاداش روزانه',
      color: '🟢',
      category: 'daily'
    },
    'weekly': {
      label: 'پاداش هفتگی',
      emoji: '🎁',
      description: 'دریافت پاداش هفتگی',
      color: '🟢',
      category: 'daily'
    },
    'monthly': {
      label: 'پاداش ماهانه',
      emoji: '🎁',
      description: 'دریافت پاداش ماهانه',
      color: '🟢',
      category: 'daily'
    },
    
    // دزدی و جرم
    'steal_success': {
      label: 'دزدی موفق',
      emoji: '🦹‍♂️',
      description: 'دزدی موفقیت‌آمیز از کاربر دیگر',
      color: '🟢',
      category: 'crime'
    },
    'steal_victim': {
      label: 'قربانی دزدی',
      emoji: '😱',
      description: 'سرقت سکه توسط کاربر دیگر',
      color: '🔴',
      category: 'crime'
    },
    'steal_failed': {
      label: 'دزدی ناموفق',
      emoji: '🚓',
      description: 'تلاش ناموفق برای دزدی و پرداخت جریمه',
      color: '🔴',
      category: 'crime'
    },
    'robbed': {
      label: 'سرقت شده',
      emoji: '💸',
      description: 'سکه‌های دزدیده شده',
      color: '🔴',
      category: 'crime'
    },
    
    // فروشگاه و بازار
    'item_purchase': {
      label: 'خرید آیتم',
      emoji: '🛒',
      description: 'خرید آیتم از فروشگاه',
      color: '🔴',
      category: 'shop'
    },
    'item_sold': {
      label: 'فروش آیتم',
      emoji: '💼',
      description: 'فروش آیتم به فروشگاه',
      color: '🟢',
      category: 'shop'
    },
    'shop_purchase': {
      label: 'خرید از فروشگاه',
      emoji: '🛍️',
      description: 'خرید کالا از فروشگاه',
      color: '🔴',
      category: 'shop'
    },
    'shop_sale': {
      label: 'فروش به فروشگاه',
      emoji: '💵',
      description: 'فروش کالا به فروشگاه',
      color: '🟢',
      category: 'shop'
    },
    'market_purchase': {
      label: 'خرید از بازار',
      emoji: '🏪',
      description: 'خرید کالا از بازار آزاد',
      color: '🔴',
      category: 'shop'
    },
    'market_sale': {
      label: 'فروش در بازار',
      emoji: '💹',
      description: 'فروش کالا در بازار آزاد',
      color: '🟢',
      category: 'shop'
    },
    
    // شغل و درآمد
    'job_income': {
      label: 'درآمد شغلی',
      emoji: '💼',
      description: 'دریافت حقوق از شغل',
      color: '🟢',
      category: 'job'
    },
    'work': {
      label: 'درآمد کار',
      emoji: '⚒️',
      description: 'درآمد حاصل از کار کردن',
      color: '🟢',
      category: 'job'
    },
    
    // وام و اعتبار
    'loan': {
      label: 'دریافت وام',
      emoji: '📝',
      description: 'دریافت وام از بانک',
      color: '🟢',
      category: 'bank'
    },
    'loan_repayment': {
      label: 'بازپرداخت وام',
      emoji: '📋',
      description: 'پرداخت قسط وام',
      color: '🔴',
      category: 'bank'
    },
    'loan_received': {
      label: 'دریافت وام',
      emoji: '💳',
      description: 'دریافت وام از بانک',
      color: '🟢',
      category: 'bank'
    },
    
    // لاتاری و شانس
    'lottery_ticket': {
      label: 'خرید بلیط لاتاری',
      emoji: '🎟️',
      description: 'خرید بلیط لاتاری',
      color: '🔴',
      category: 'lottery'
    },
    'lottery_win': {
      label: 'برنده لاتاری',
      emoji: '🎯',
      description: 'برنده شدن در قرعه‌کشی لاتاری',
      color: '🟢',
      category: 'lottery'
    },
    
    // سرمایه‌گذاری و سهام
    'investment': {
      label: 'سرمایه‌گذاری',
      emoji: '📈',
      description: 'سرمایه‌گذاری در صندوق',
      color: '🔴',
      category: 'investment'
    },
    'investment_return': {
      label: 'بازگشت سرمایه',
      emoji: '💹',
      description: 'دریافت اصل و سود سرمایه‌گذاری',
      color: '🟢',
      category: 'investment'
    },
    'stock_buy': {
      label: 'خرید سهام',
      emoji: '📊',
      description: 'خرید سهام از بازار بورس',
      color: '🔴',
      category: 'investment'
    },
    'stock_sell': {
      label: 'فروش سهام',
      emoji: '📊',
      description: 'فروش سهام در بازار بورس',
      color: '🟢',
      category: 'investment'
    },
    'stock_dividend': {
      label: 'سود سهام',
      emoji: '💲',
      description: 'دریافت سود سهام',
      color: '🟢',
      category: 'investment'
    },
    
    // کلن و گروه
    'clan_contribution': {
      label: 'کمک به کلن',
      emoji: '🏰',
      description: 'پرداخت سکه به خزانه کلن',
      color: '🔴',
      category: 'clan'
    },
    'clan_withdrawal': {
      label: 'برداشت از کلن',
      emoji: '🏰',
      description: 'برداشت سکه از خزانه کلن',
      color: '🟢',
      category: 'clan'
    },
    'clan_reward': {
      label: 'پاداش کلن',
      emoji: '🏆',
      description: 'دریافت پاداش از کلن',
      color: '🟢',
      category: 'clan'
    },
    
    // اجتماعی
    'gift_received': {
      label: 'هدیه دریافتی',
      emoji: '🎁',
      description: 'دریافت هدیه از کاربر دیگر',
      color: '🟢',
      category: 'transfer'
    },
    'gift_sent': {
      label: 'هدیه ارسالی',
      emoji: '🎁',
      description: 'ارسال هدیه به کاربر دیگر',
      color: '🔴',
      category: 'transfer'
    },
    'friend_bonus': {
      label: 'پاداش دوستی',
      emoji: '👥',
      description: 'پاداش فعالیت با دوستان',
      color: '🟢',
      category: 'daily'
    },
    
    // حراج و مزایده
    'auction_bid': {
      label: 'پیشنهاد در حراجی',
      emoji: '🔨',
      description: 'پیشنهاد قیمت در حراجی',
      color: '🔴',
      category: 'shop'
    },
    'auction_win': {
      label: 'برنده حراجی',
      emoji: '🏆',
      description: 'برنده شدن در حراجی',
      color: '🟢',
      category: 'shop'
    },
    'auction_refund': {
      label: 'بازگشت وجه حراجی',
      emoji: '💱',
      description: 'بازگشت وجه پیشنهاد شده در حراجی',
      color: '🟢',
      category: 'shop'
    },
    'auction_sale': {
      label: 'فروش در حراجی',
      emoji: '💰',
      description: 'فروش آیتم در حراجی',
      color: '🟢',
      category: 'shop'
    },
    
    // اشتراک و ویژه
    'premium_purchase': {
      label: 'خرید اشتراک ویژه',
      emoji: '⭐',
      description: 'خرید اشتراک ویژه',
      color: '🔴',
      category: 'shop'
    },
    'subscription_purchase': {
      label: 'خرید اشتراک',
      emoji: '📱',
      description: 'خرید اشتراک سرویس',
      color: '🔴',
      category: 'shop'
    },
    
    // مدیریتی
    'admin_add': {
      label: 'افزایش توسط ادمین',
      emoji: '👑',
      description: 'افزایش موجودی توسط ادمین',
      color: '🟢',
      category: 'admin'
    },
    'admin_remove': {
      label: 'کاهش توسط ادمین',
      emoji: '👑',
      description: 'کاهش موجودی توسط ادمین',
      color: '🔴',
      category: 'admin'
    },
    'admin_adjustment': {
      label: 'تنظیم توسط ادمین',
      emoji: '🔧',
      description: 'تنظیم موجودی توسط ادمین',
      color: '🟡',
      category: 'admin'
    },
    
    // متفرقه
    'tax': {
      label: 'مالیات',
      emoji: '💲',
      description: 'پرداخت مالیات',
      color: '🔴',
      category: 'other'
    },
    'penalty': {
      label: 'جریمه',
      emoji: '⚠️',
      description: 'پرداخت جریمه',
      color: '🔴',
      category: 'other'
    },
    'refund': {
      label: 'بازپرداخت',
      emoji: '🔄',
      description: 'بازپرداخت وجه',
      color: '🟢',
      category: 'other'
    },
    'crystal_exchange': {
      label: 'تبدیل کریستال',
      emoji: '💎',
      description: 'تبدیل کریستال به سکه یا برعکس',
      color: '🟡',
      category: 'other'
    },
    'system': {
      label: 'تراکنش سیستمی',
      emoji: '⚙️',
      description: 'تراکنش خودکار سیستم',
      color: '⚪',
      category: 'other'
    }
  };
  
  // اگر نوع تراکنش موجود نبود، نوع پیش‌فرض را برمی‌گردانیم
  if (!types[transactionType]) {
    return {
      label: transactionType,
      emoji: '❓',
      description: 'تراکنش نامشخص',
      color: '⚪',
      category: 'other'
    };
  }
  
  return types[transactionType];
}

/**
 * نوع تراکنش به همراه ایموجی مناسب (نسخه ساده‌شده)
 * @param transactionType نوع تراکنش
 * @returns نوع تراکنش فارسی به همراه ایموجی
 */
export function formatTransactionType(transactionType: string): string {
  const typeInfo = getTransactionTypeInfo(transactionType);
  return `${typeInfo.emoji} ${typeInfo.label}`;
}

/**
 * فرمت کردن مبلغ تراکنش (مثبت یا منفی) با فرمت و رنگ مناسب
 * @param amount مبلغ تراکنش
 * @param transactionType نوع تراکنش (برای تعیین جهت تراکنش)
 * @param currency واحد پول (پیش‌فرض: Ccoin)
 * @returns مبلغ فرمت شده
 */
export function formatTransactionAmount(
  amount: number, 
  transactionType?: string, 
  currency: string = 'Ccoin'
): string {
  // تراکنش‌هایی که منفی هستند (کاهش موجودی)
  const negativeTransactions = [
    'withdraw', 'transfer_sent', 'transfer_out', 'game_loss',
    'steal_failed', 'item_purchase', 'item_purchase_crystal',
    'shop_purchase', 'market_purchase', 'tax', 'penalty',
    'loan_repayment', 'investment', 'stock_buy', 'lottery_ticket',
    'auction_bid', 'premium_purchase', 'subscription_purchase',
    'clan_contribution', 'gift_sent', 'admin_remove'
  ];
  
  // تراکنش‌هایی که مثبت هستند (افزایش موجودی)
  const positiveTransactions = [
    'deposit', 'transfer_received', 'transfer_in', 'game_win',
    'quest_reward', 'steal_success', 'daily', 'weekly', 'monthly',
    'bank_interest', 'loan_received', 'job_income', 'work',
    'investment_return', 'stock_sell', 'stock_dividend', 'lottery_win',
    'auction_refund', 'auction_sale', 'refund', 'gift_received',
    'clan_withdrawal', 'clan_reward', 'friend_bonus', 'admin_add',
    'welcome_bonus'
  ];
  
  const absAmount = Math.abs(amount);
  const formattedNumber = formatNumber(absAmount);
  
  // اگر نوع تراکنش مشخص شده باشد، بر اساس آن تعیین می‌کنیم
  if (transactionType) {
    if (negativeTransactions.includes(transactionType)) {
      return `-${formattedNumber} ${currency}`;
    } else if (positiveTransactions.includes(transactionType)) {
      return `+${formattedNumber} ${currency}`;
    }
  }
  
  // اگر نوع تراکنش مشخص نشده باشد، بر اساس مقدار عددی تصمیم می‌گیریم
  if (amount > 0) {
    return `+${formattedNumber} ${currency}`;
  } else if (amount < 0) {
    return `-${formattedNumber} ${currency}`;
  } else {
    return `${formattedNumber} ${currency}`;
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