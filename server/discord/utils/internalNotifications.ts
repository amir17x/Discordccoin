/**
 * سیستم اعلانات داخلی شخصی‌سازی شده Ccoin
 * این سیستم بدون استفاده از API هوش مصنوعی، اعلانات هوشمند و شخصی‌سازی شده تولید می‌کند
 */

interface UserContext {
  wallet: number;
  bank: number;
  crystals: number;
  level: number;
  experience: number;
  dailyStreak: number;
  lastDaily: Date | null;
  clanId: string | null;
  points: number;
  totalMoney: number;
  dailyAvailable: boolean;
}

interface NotificationTemplate {
  id: string;
  text: string;
  priority: number; // 1 = کم، 2 = متوسط، 3 = زیاد
  condition: (user: UserContext) => boolean;
  category: 'economy' | 'daily' | 'clan' | 'level' | 'achievement' | 'general';
}

/**
 * قالب‌های اعلانات شخصی‌سازی شده
 */
const notificationTemplates: NotificationTemplate[] = [
  // اعلانات اقتصادی - اولویت بالا
  {
    id: 'low_wallet',
    text: 'فقط {wallet} سکه تو کیف پولت داری! 😱 یه ماموریت انجام بده!',
    priority: 3,
    condition: (user) => user.wallet < 1000,
    category: 'economy'
  },
  {
    id: 'rich_wallet',
    text: 'واو! {wallet} سکه داری! 🤑 یکم سرمایه‌گذاری کن!',
    priority: 2,
    condition: (user) => user.wallet > 10000,
    category: 'economy'
  },
  {
    id: 'medium_wallet',
    text: '{wallet} سکه‌ای که داری رو خوب مدیریت کن! 💰',
    priority: 1,
    condition: (user) => user.wallet >= 1000 && user.wallet <= 10000,
    category: 'economy'
  },
  {
    id: 'empty_bank',
    text: 'بانکت خالیه! 🏦 یکم پول توش بریز تا سود بگیری!',
    priority: 2,
    condition: (user) => user.bank === 0 && user.wallet > 5000,
    category: 'economy'
  },
  {
    id: 'rich_bank',
    text: '{bank} سکه تو بانکت داری! 🏛️ داری سود می‌گیری!',
    priority: 1,
    condition: (user) => user.bank > 50000,
    category: 'economy'
  },

  // اعلانات پاداش روزانه - اولویت بالا
  {
    id: 'daily_available',
    text: 'پاداش روزانه‌ات آماده دریافته! 🎁 زود بگیرش!',
    priority: 3,
    condition: (user) => user.dailyAvailable,
    category: 'daily'
  },
  {
    id: 'daily_streak_high',
    text: 'استریک {dailyStreak} روزه داری! 🔥 فردا هم فراموش نکن!',
    priority: 2,
    condition: (user) => user.dailyStreak >= 5,
    category: 'daily'
  },
  {
    id: 'daily_streak_medium',
    text: 'استریک {dailyStreak} روزه‌ات خوبه! 📅 ادامه بده!',
    priority: 1,
    condition: (user) => user.dailyStreak >= 3 && user.dailyStreak < 5,
    category: 'daily'
  },

  // اعلانات کلن - اولویت متوسط
  {
    id: 'no_clan',
    text: 'هنوز کلن نداری! 🏯 به یکی بپیوند یا خودت بساز!',
    priority: 2,
    condition: (user) => !user.clanId,
    category: 'clan'
  },
  {
    id: 'has_clan',
    text: 'عضو کلن هستی! 🏰 یادت نره به هم‌تیمی‌هات کمک کنی!',
    priority: 1,
    condition: (user) => !!user.clanId,
    category: 'clan'
  },

  // اعلانات سطح و تجربه - اولویت متوسط
  {
    id: 'low_level',
    text: 'هنوز سطح {level} هستی! 🌱 بازی کن و ارتقاء پیدا کن!',
    priority: 2,
    condition: (user) => user.level < 5,
    category: 'level'
  },
  {
    id: 'high_level',
    text: 'سطح {level}! 🏆 تو یکی از بهترین‌هایی!',
    priority: 1,
    condition: (user) => user.level >= 10,
    category: 'level'
  },

  // اعلانات کریستال - اولویت متوسط
  {
    id: 'no_crystals',
    text: 'کریستال نداری! 💎 از بازی‌ها کریستال بگیر!',
    priority: 2,
    condition: (user) => user.crystals === 0,
    category: 'economy'
  },
  {
    id: 'rich_crystals',
    text: '{crystals} کریستال داری! ✨ از فروشگاه ویژه خرید کن!',
    priority: 1,
    condition: (user) => user.crystals > 100,
    category: 'economy'
  },

  // اعلانات عمومی - اولویت پایین
  {
    id: 'play_games',
    text: 'در بازی‌ها شرکت کن و جایزه بگیر! 🎮 امتیازت: {points}',
    priority: 1,
    condition: () => true,
    category: 'general'
  },
  {
    id: 'daily_quests',
    text: 'ماموریت‌های جدید = سکه بیشتر! 🎯 چک کردی امروز؟',
    priority: 1,
    condition: () => true,
    category: 'general'
  },
  {
    id: 'stock_market',
    text: 'بازار سهام رو یادت نره! 📈 قیمت‌ها دائم تغییر می‌کنن!',
    priority: 1,
    condition: () => true,
    category: 'general'
  },
  {
    id: 'shop_items',
    text: 'از فروشگاه آیتم‌های جدید بخر! 🛍️ غنیمت و جایزه در انتظارته!',
    priority: 1,
    condition: () => true,
    category: 'general'
  },
  {
    id: 'luck_message',
    text: 'امروز روز شانس توئه! 🍀 یه بازی انجام بده!',
    priority: 1,
    condition: () => true,
    category: 'general'
  },
  {
    id: 'motivation',
    text: 'تو می‌تونی بهترین باشی! 🏆 به تلاشت ادامه بده!',
    priority: 1,
    condition: () => true,
    category: 'general'
  }
];

/**
 * جایگزینی متغیرها در متن اعلان
 */
function replaceVariables(text: string, user: UserContext): string {
  return text
    .replace('{wallet}', user.wallet.toLocaleString('fa-IR'))
    .replace('{bank}', user.bank.toLocaleString('fa-IR'))
    .replace('{crystals}', user.crystals.toLocaleString('fa-IR'))
    .replace('{level}', user.level.toString())
    .replace('{experience}', user.experience.toLocaleString('fa-IR'))
    .replace('{dailyStreak}', user.dailyStreak.toString())
    .replace('{points}', user.points.toLocaleString('fa-IR'))
    .replace('{totalMoney}', user.totalMoney.toLocaleString('fa-IR'));
}

/**
 * تولید اعلانات شخصی‌سازی شده بر اساس وضعیت کاربر
 */
export function generateInternalNotifications(userContext: UserContext, count: number = 3): string[] {
  // فیلتر کردن اعلانات بر اساس شرایط
  const validNotifications = notificationTemplates.filter(template => 
    template.condition(userContext)
  );

  // مرتب‌سازی بر اساس اولویت (اولویت بالا اول)
  validNotifications.sort((a, b) => b.priority - a.priority);

  // انتخاب اعلانات
  const selectedNotifications: string[] = [];
  const usedCategories = new Set<string>();

  // ابتدا اعلانات با اولویت بالا (3)
  for (const notification of validNotifications.filter(n => n.priority === 3)) {
    if (selectedNotifications.length >= count) break;
    if (!usedCategories.has(notification.category)) {
      selectedNotifications.push(replaceVariables(notification.text, userContext));
      usedCategories.add(notification.category);
    }
  }

  // سپس اعلانات با اولویت متوسط (2)
  for (const notification of validNotifications.filter(n => n.priority === 2)) {
    if (selectedNotifications.length >= count) break;
    if (!usedCategories.has(notification.category)) {
      selectedNotifications.push(replaceVariables(notification.text, userContext));
      usedCategories.add(notification.category);
    }
  }

  // در نهایت اعلانات با اولویت پایین (1)
  const lowPriorityNotifications = validNotifications.filter(n => n.priority === 1);
  while (selectedNotifications.length < count && lowPriorityNotifications.length > 0) {
    const randomIndex = Math.floor(Math.random() * lowPriorityNotifications.length);
    const notification = lowPriorityNotifications[randomIndex];
    
    selectedNotifications.push(replaceVariables(notification.text, userContext));
    lowPriorityNotifications.splice(randomIndex, 1);
  }

  return selectedNotifications;
}

/**
 * تولید پیام شخصی‌سازی شده بر اساس وضعیت کاربر
 */
export function generatePersonalizedMessage(userContext: UserContext): string {
  // پیام‌های بر اساس موجودی
  if (userContext.wallet < 100) {
    return "سکه‌هات کم شده! یه بازی کن یا ماموریت انجام بده! 💪";
  }
  
  if (userContext.wallet > 100000) {
    return "تو یه میلیونری! 🤑 انقدر پول داری که می‌تونی کل سرور رو بخری!";
  }
  
  if (userContext.bank > userContext.wallet * 5) {
    return "بانکت پر از سکه‌ست! 🏦 تو یه سرمایه‌گذار حرفه‌ای هستی!";
  }
  
  // پیام‌های بر اساس پاداش روزانه
  if (userContext.dailyAvailable) {
    return "پاداش روزانه‌ات منتظرته! 🎁 برو بگیرش!";
  }
  
  // پیام‌های بر اساس استریک
  if (userContext.dailyStreak > 10) {
    return `${userContext.dailyStreak} روز استریک! 🔥 تو واقعاً مداومی!`;
  }
  
  if (userContext.dailyStreak > 5) {
    return "استریک خوبی داری! 📅 ادامه بده تا جایزه‌های بیشتری بگیری!";
  }
  
  // پیام‌های بر اساس سطح
  if (userContext.level >= 15) {
    return "سطح بالایی داری! 🏆 تو یکی از قهرمان‌های این سرور هستی!";
  }
  
  if (userContext.level < 3) {
    return "تازه شروع کردی! 🌱 با هر بازی قوی‌تر می‌شی!";
  }
  
  // پیام‌های بر اساس کلن
  if (!userContext.clanId) {
    return "بدون کلن تنهایی! 🏯 به یه کلن بپیوند و با هم قدرتمند شو!";
  }
  
  // پیام‌های عمومی تصادفی
  const generalMessages = [
    "امروز روز شانس توئه! 🍀 یه بازی انجام بده!",
    "می‌خوای پولدار بشی؟ 💰 سهام بخر!",
    "تو می‌تونی بهترین باشی! 🏆 به تلاشت ادامه بده!",
    "یادت نره هر روز پاداش روزانه بگیری! ⏰",
    "از فروشگاه آیتم‌های جدید بخر! 🛍️"
  ];
  
  return generalMessages[Math.floor(Math.random() * generalMessages.length)];
}