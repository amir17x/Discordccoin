/**
 * سیستم اعلانات هوشمند و شخصی‌سازی شده با Gemini
 * این ماژول برای تولید اعلانات شخصی‌سازی شده برای هر کاربر با توجه به وضعیت آن‌ها استفاده می‌شود
 */

import { generateAIResponse } from '../services/aiService';
import { log } from '../../vite';
import { storage } from '../../storage';

// نوع اطلاعات کاربر برای تولید اعلانات شخصی
interface UserNotificationContext {
  userId: string;
  username: string;
  balance: number;
  bankBalance: number;
  // کلن و وضعیت جنگ
  isInClan: boolean;
  clanName?: string;
  isInWar: boolean;
  // سهام و سرمایه‌گذاری
  hasStocks: boolean;
  stocks?: { name: string; quantity: number; currentPrice: number; purchased: number }[];
  // تورنمنت
  isInTournament: boolean;
  tournamentName?: string;
  // کوئست‌ها
  hasActiveQuests: boolean;
  quests?: { name: string; progress: number; total: number; reward: number }[];
  // سایر
  dailyStreak: number;
  itemCount: number;
  lastActivity?: Date;
}

/**
 * دسته‌بندی‌های اعلانات برای کاربران
 */
export enum NotificationCategory {
  ECONOMY = 'economy',      // اقتصادی
  CLAN_WAR = 'clan_war',    // کلن و جنگ
  STOCKS = 'stocks',        // سهام
  TOURNAMENT = 'tournament', // تورنمنت
  QUESTS = 'quests',        // ماموریت‌ها
  DAILY = 'daily',          // روزانه
  GENERAL = 'general'       // عمومی
}

/**
 * اولویت‌های مختلف برای اعلانات
 */
export enum NotificationPriority {
  HIGH = 'high',     // اولویت بالا
  MEDIUM = 'medium', // اولویت متوسط
  LOW = 'low'        // اولویت پایین
}

/**
 * اعلانات پیش‌فرض برای هر دسته‌بندی
 */
const defaultNotifications: Record<NotificationCategory, string[]> = {
  [NotificationCategory.ECONOMY]: [
    "موجودی کیف پول خود را چک کنید! 💰",
    "استراتژی اقتصادی خود را بروز کنید! 📊",
    "برای افزایش سرمایه، به ماموریت‌ها سر بزنید! 🧾"
  ],
  [NotificationCategory.CLAN_WAR]: [
    "کلن‌ها منتظر شما هستند! 🛡️",
    "در یک کلن عضو شوید و از مزایای آن بهره‌مند شوید! 🏰",
    "جنگ کلن‌ها به زودی آغاز می‌شود! ⚔️"
  ],
  [NotificationCategory.STOCKS]: [
    "قیمت سهام در حال تغییر است! 📈",
    "فرصت‌های سرمایه‌گذاری جدید! 💹",
    "سبد سهام خود را متنوع کنید! 📉"
  ],
  [NotificationCategory.TOURNAMENT]: [
    "تورنمنت جدید در راه است! 🏆",
    "برای شرکت در تورنمنت آماده شوید! 🎮",
    "جوایز ویژه تورنمنت را از دست ندهید! 🎁"
  ],
  [NotificationCategory.QUESTS]: [
    "ماموریت‌های جدید منتظر شماست! 📝",
    "ماموریت‌های خود را تکمیل کنید! ✅",
    "پاداش‌های ویژه در انتظار شماست! 🎯"
  ],
  [NotificationCategory.DAILY]: [
    "جایزه روزانه خود را دریافت کنید! 🎁",
    "استریک روزانه خود را از دست ندهید! ⏰",
    "هر روز وارد شوید و پاداش بگیرید! 📅"
  ],
  [NotificationCategory.GENERAL]: [
    "به Ccoin خوش آمدید! ✨",
    "برای دریافت راهنمایی، دستور /help را استفاده کنید! ℹ️",
    "دستورات جدید را بررسی کنید! 🆕"
  ]
};

/**
 * دریافت داده‌های کاربر برای تولید اعلانات شخصی
 * @param userId شناسه کاربر در دیسکورد
 * @returns اطلاعات کاربر برای تولید اعلان
 */
async function getUserNotificationContext(userId: string): Promise<UserNotificationContext | null> {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const user = await storage.getUserByDiscordId(userId);
    
    if (!user) {
      return null;
    }
    
    // دریافت کلن کاربر (اگر عضو کلن باشد)
    let clanData = null;
    if (user.clanId) {
      clanData = await storage.getClan(user.clanId);
    }
    
    // دریافت سهام‌های کاربر
    let userStocks: any[] = [];
    try {
      // تبدیل ID به عدد
      userStocks = await storage.getUserStocks(Number(user.id));
      // دریافت اطلاعات کامل هر سهم
      for (let i = 0; i < userStocks.length; i++) {
        const stockData = await storage.getStockById(userStocks[i].stockId);
        if (stockData) {
          userStocks[i].name = stockData.name;
          userStocks[i].currentPrice = stockData.currentPrice;
        }
      }
    } catch (e) {
      log(`خطا در دریافت سهام کاربر: ${e}`, 'error');
    }
    
    // دریافت کوئست‌های فعال کاربر
    let activeQuests: any[] = [];
    try {
      const userQuests = await storage.getUserQuests(Number(user.id));
      activeQuests = userQuests
        .filter(uq => uq.userQuest.progress < uq.quest.targetAmount) // فقط کوئست‌های ناتمام
        .map(uq => ({
          name: uq.quest.title,
          progress: uq.userQuest.progress,
          total: uq.quest.targetAmount,
          reward: uq.quest.reward
        }));
    } catch (e) {
      log(`خطا در دریافت کوئست‌های کاربر: ${e}`, 'error');
    }
    
    // بررسی وضعیت تورنمنت کاربر (در نسخه فعلی، فقط بررسی می‌کنیم آیا کاربر در تورنمنت است یا خیر)
    const isInTournament = false; // به‌طور پیش‌فرض فرض می‌کنیم کاربر در تورنمنت نیست
    const tournamentName = ''; // نام تورنمنت
    
    // ساخت و بازگرداندن اطلاعات کاربر
    return {
      userId,
      username: user.username || 'کاربر',
      balance: user.wallet || 0,
      bankBalance: user.bank || 0,
      isInClan: !!user.clanId,
      clanName: clanData?.name || '',
      isInWar: clanData ? (clanData.warWins > 0 || clanData.warLosses > 0) : false,
      hasStocks: userStocks.length > 0,
      stocks: userStocks.map(stock => ({
        name: stock.name || 'سهم',
        quantity: stock.quantity,
        currentPrice: stock.currentPrice || 0,
        purchased: stock.purchasePrice
      })),
      isInTournament,
      tournamentName,
      hasActiveQuests: activeQuests.length > 0,
      quests: activeQuests,
      dailyStreak: user.dailyStreak || 0,
      itemCount: (await storage.getInventoryItems(Number(user.id))).length,
      lastActivity: user.lastActive || new Date()
    };
  } catch (error) {
    log(`خطا در دریافت اطلاعات کاربر برای اعلانات: ${error}`, 'error');
    return null;
  }
}

/**
 * تشخیص اولویت اعلانات برای کاربر
 * @param userContext اطلاعات کاربر
 * @returns دسته‌بندی‌های اعلان با اولویت‌های مختلف
 */
function determineNotificationPriorities(userContext: UserNotificationContext): Record<NotificationPriority, NotificationCategory[]> {
  // نگهداری دسته‌بندی‌های اعلان بر اساس اولویت
  const priorities: Record<NotificationPriority, NotificationCategory[]> = {
    [NotificationPriority.HIGH]: [],
    [NotificationPriority.MEDIUM]: [],
    [NotificationPriority.LOW]: []
  };
  
  // اعلانات با اولویت بالا
  
  // جنگ کلن
  if (userContext.isInClan && userContext.isInWar) {
    priorities[NotificationPriority.HIGH].push(NotificationCategory.CLAN_WAR);
  }
  
  // تورنمنت
  if (userContext.isInTournament) {
    priorities[NotificationPriority.HIGH].push(NotificationCategory.TOURNAMENT);
  }
  
  // کوئست‌های نزدیک به تکمیل
  if (userContext.hasActiveQuests && userContext.quests?.some(q => q.progress / q.total >= 0.75)) {
    priorities[NotificationPriority.HIGH].push(NotificationCategory.QUESTS);
  }
  
  // استریک روزانه
  if (userContext.dailyStreak >= 5) {
    priorities[NotificationPriority.HIGH].push(NotificationCategory.DAILY);
  }
  
  // اعلانات با اولویت متوسط
  
  // سهام (اگر کاربر سهام دارد)
  if (userContext.hasStocks) {
    priorities[NotificationPriority.MEDIUM].push(NotificationCategory.STOCKS);
  }
  
  // کوئست‌های فعال
  if (userContext.hasActiveQuests && !priorities[NotificationPriority.HIGH].includes(NotificationCategory.QUESTS)) {
    priorities[NotificationPriority.MEDIUM].push(NotificationCategory.QUESTS);
  }
  
  // کلن (اگر کاربر در کلن است اما در جنگ نیست)
  if (userContext.isInClan && !userContext.isInWar) {
    priorities[NotificationPriority.MEDIUM].push(NotificationCategory.CLAN_WAR);
  }
  
  // اعلانات با اولویت پایین
  
  // اقتصادی (همیشه با اولویت پایین)
  priorities[NotificationPriority.LOW].push(NotificationCategory.ECONOMY);
  
  // عمومی (همیشه با اولویت پایین)
  priorities[NotificationPriority.LOW].push(NotificationCategory.GENERAL);
  
  // سهام (اگر کاربر سهام ندارد)
  if (!userContext.hasStocks) {
    priorities[NotificationPriority.LOW].push(NotificationCategory.STOCKS);
  }
  
  // کلن (اگر کاربر در کلن نیست)
  if (!userContext.isInClan) {
    priorities[NotificationPriority.LOW].push(NotificationCategory.CLAN_WAR);
  }
  
  // تورنمنت (اگر کاربر در تورنمنت نیست)
  if (!userContext.isInTournament) {
    priorities[NotificationPriority.LOW].push(NotificationCategory.TOURNAMENT);
  }
  
  return priorities;
}

/**
 * انتخاب تصادفی یک اعلان از لیست اعلانات با اولویت
 * @param priorities اولویت‌های اعلانات
 * @returns دسته‌بندی انتخاب شده
 */
function selectNotificationCategory(priorities: Record<NotificationPriority, NotificationCategory[]>): NotificationCategory {
  // اول از اعلانات با اولویت بالا
  if (priorities[NotificationPriority.HIGH].length > 0) {
    const highPriorityIndex = Math.floor(Math.random() * priorities[NotificationPriority.HIGH].length);
    return priorities[NotificationPriority.HIGH][highPriorityIndex];
  }
  
  // سپس از اعلانات با اولویت متوسط
  if (priorities[NotificationPriority.MEDIUM].length > 0) {
    const mediumPriorityIndex = Math.floor(Math.random() * priorities[NotificationPriority.MEDIUM].length);
    return priorities[NotificationPriority.MEDIUM][mediumPriorityIndex];
  }
  
  // در نهایت از اعلانات با اولویت پایین
  if (priorities[NotificationPriority.LOW].length > 0) {
    const lowPriorityIndex = Math.floor(Math.random() * priorities[NotificationPriority.LOW].length);
    return priorities[NotificationPriority.LOW][lowPriorityIndex];
  }
  
  // اگر هیچ دسته‌بندی یافت نشد، از دسته‌بندی عمومی استفاده می‌کنیم
  return NotificationCategory.GENERAL;
}

/**
 * سیستم کش اعلانات برای کاهش تعداد درخواست‌ها به API هوش مصنوعی
 * ساختار: { userId_category: { notifications: string[], timestamp: number } }
 */
const notificationsCache: { [key: string]: { notifications: string[], timestamp: number } } = {};

// مدت زمان اعتبار کش (15 دقیقه)
const CACHE_TTL = 15 * 60 * 1000;

/**
 * تولید اعلانات شخصی برای کاربر با استفاده از Gemini
 * @param userContext اطلاعات کاربر
 * @param category دسته‌بندی اعلان
 * @returns لیست اعلانات شخصی‌سازی شده
 */
async function generatePersonalizedNotifications(
  userContext: UserNotificationContext,
  category: NotificationCategory
): Promise<string[]> {
  try {
    // بررسی کش برای کاهش تعداد درخواست‌ها
    const cacheKey = `${userContext.userId}_${category}`;
    const now = Date.now();
    const cachedData = notificationsCache[cacheKey];
    
    // اگر داده در کش موجود است و هنوز معتبر است، از آن استفاده می‌کنیم
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      log(`استفاده از اعلانات کش شده برای کاربر ${userContext.userId} در دسته ${category}`, 'info');
      return cachedData.notifications;
    }
    
    // تولید اعلانات متناسب با دسته‌بندی و وضعیت کاربر
    let notifications: string[] = [];
    
    // ابتدا تلاش می‌کنیم از هوش مصنوعی استفاده کنیم
    try {
      // ساخت پرامپت برای Gemini با توجه به اطلاعات کاربر
      const prompt = buildNotificationPrompt(userContext, category);
      
      // دریافت پاسخ از Gemini با سبک طنزآمیز
      const aiResponse = await generateAIResponse(prompt, 'notifications', 'طنزآمیز');
      
      // تبدیل پاسخ به آرایه‌ای از اعلانات
      if (aiResponse) {
        notifications = aiResponse
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && line.length <= 70);
      }
    } catch (aiError) {
      log(`خطا در دریافت پاسخ از هوش مصنوعی: ${aiError}`, 'warning');
      // در صورت خطا، از تولید هوشمند دست‌ساز استفاده می‌کنیم
      notifications = generateSmartNotifications(userContext, category);
    }
    
    // اگر هیچ اعلان معتبری از هر دو روش به دست نیامد، از اعلانات پیش‌فرض استفاده می‌کنیم
    if (notifications.length === 0) {
      notifications = defaultNotifications[category];
    }
    
    // ذخیره در کش
    notificationsCache[cacheKey] = {
      notifications,
      timestamp: now
    };
    
    return notifications;
  } catch (error) {
    log(`خطا در تولید اعلانات شخصی: ${error}`, 'error');
    // در صورت خطا، از اعلانات پیش‌فرض استفاده می‌کنیم
    return defaultNotifications[category];
  }
}

/**
 * تولید هوشمند اعلانات بدون استفاده از هوش مصنوعی (جایگزین)
 * @param userContext اطلاعات کاربر
 * @param category دسته‌بندی اعلان
 */
function generateSmartNotifications(userContext: UserNotificationContext, category: NotificationCategory): string[] {
  // اعلانات متناسب با وضعیت کاربر
  const notifications: string[] = [];
  
  switch (category) {
    case NotificationCategory.ECONOMY:
      // اعلانات اقتصادی بر اساس وضعیت کیف پول و موجودی بانکی
      if (userContext.balance < 1000) {
        notifications.push(`فقط ${userContext.balance} سکه تو کیف پولت داری! 😱 یه ماموریت انجام بده!`);
        notifications.push(`موجودی کیف پولت خطرناک کمه! 💸 وقت کاره!`);
      } else if (userContext.balance > 5000) {
        notifications.push(`${userContext.balance} سکه تو کیف پولت داری! 🤑 یکم سرمایه‌گذاری کن!`);
        notifications.push(`کیف پول پر از سکه! 💰 یکم خرج کن قبل از دزدی!`);
      }
      
      if (userContext.bankBalance > 10000) {
        notifications.push(`${userContext.bankBalance} سکه تو بانک داری! 🏦 سودش رو حساب کردی؟`);
      }
      break;
      
    case NotificationCategory.CLAN_WAR:
      // اعلانات کلن و جنگ بر اساس وضعیت عضویت کاربر
      if (userContext.isInClan) {
        if (userContext.isInWar) {
          notifications.push(`کلن ${userContext.clanName} در حال جنگه! ⚔️ برو کمکشون کن!`);
          notifications.push(`جنگ کلن داره ادامه پیدا می‌کنه! 🔥 امتیاز بگیر!`);
        } else {
          notifications.push(`عضو کلن ${userContext.clanName} هستی! 🛡️ امروز چه کمکی کردی؟`);
          notifications.push(`کلن ${userContext.clanName} منتظر فعالیت توست! 🏰`);
        }
      } else {
        notifications.push(`هنوز عضو هیچ کلنی نشدی! 🏯 یه کلن پیدا کن یا بساز!`);
        notifications.push(`تنهایی سخته! 👥 به یه کلن بپیوند و قدرتمند شو!`);
      }
      break;
      
    case NotificationCategory.STOCKS:
      // اعلانات سهام بر اساس سبد سهام کاربر
      if (userContext.hasStocks && userContext.stocks && userContext.stocks.length > 0) {
        const totalStocks = userContext.stocks.length;
        notifications.push(`${totalStocks} نوع سهام داری! 📈 بازار رو چک کردی امروز؟`);
        
        // بررسی سودآوری سهام
        const profitableStocks = userContext.stocks.filter(s => s.currentPrice > s.purchased);
        if (profitableStocks.length > 0) {
          notifications.push(`${profitableStocks.length} سهام سودده داری! 💹 وقت فروشه؟`);
        } else {
          notifications.push(`بازار خرسی شده انگار! 📉 صبور باش، سهامت برمی‌گرده!`);
        }
      } else {
        notifications.push(`هنوز هیچ سهامی نخریدی! 📊 سرمایه‌گذاری کن و پولدار شو!`);
        notifications.push(`سرمایه‌گذاری تو سهام یادت نره! 📋 ریسک = سود بیشتر!`);
      }
      break;
      
    case NotificationCategory.TOURNAMENT:
      // اعلانات تورنمنت
      if (userContext.isInTournament) {
        notifications.push(`در تورنمنت ${userContext.tournamentName} شرکت کردی! 🏆 برو برای برد!`);
        notifications.push(`رقابت تورنمنت داغه! 🔥 وقتشه جایزه بزرگ رو ببری!`);
      } else {
        notifications.push(`تورنمنت‌های هفتگی پر از جایزه هستن! 🏆 شرکت کن!`);
        notifications.push(`مسابقات در حال برگزاریه! 🎮 مهارتت رو نشون بده!`);
      }
      break;
      
    case NotificationCategory.QUESTS:
      // اعلانات ماموریت‌ها بر اساس پیشرفت کوئست‌های کاربر
      if (userContext.hasActiveQuests && userContext.quests && userContext.quests.length > 0) {
        const nearlyCompleteQuests = userContext.quests.filter(q => q.progress / q.total >= 0.75);
        if (nearlyCompleteQuests.length > 0) {
          const quest = nearlyCompleteQuests[0];
          notifications.push(`ماموریت "${quest.name}" نزدیک به اتمامه! 🏁 تمومش کن!`);
          notifications.push(`فقط ${quest.total - quest.progress} مرحله تا پایان "${quest.name}"! 🎯`);
        } else {
          const randomQuest = userContext.quests[Math.floor(Math.random() * userContext.quests.length)];
          notifications.push(`پیشرفت ماموریت "${randomQuest.name}": ${Math.round((randomQuest.progress / randomQuest.total) * 100)}%! 📝`);
        }
      } else {
        notifications.push(`هیچ ماموریت فعالی نداری! 📜 برو چندتا قبول کن!`);
        notifications.push(`ماموریت‌ها = سکه‌های بیشتر! 💰 چندتا انتخاب کن!`);
      }
      break;
      
    case NotificationCategory.DAILY:
      // اعلانات روزانه بر اساس استریک کاربر
      if (userContext.dailyStreak > 5) {
        notifications.push(`استریک روزانه: ${userContext.dailyStreak} روز! 🔥 عالی ادامه بده!`);
        notifications.push(`${userContext.dailyStreak} روز پشت سر هم آنلاین شدی! 🌟 افسانه‌ای!`);
      } else {
        notifications.push(`استریک فعلی: ${userContext.dailyStreak} روز! ⏰ هر روز لاگین نره یادت!`);
        notifications.push(`فردا رو یادت نره لاگین کنی! 📅 استریک = جایزه بیشتر!`);
      }
      break;
      
    case NotificationCategory.GENERAL:
      // اعلانات عمومی
      if (userContext.itemCount > 0) {
        notifications.push(`${userContext.itemCount} آیتم تو کوله‌پشتیت داری! 🎒 بد نیست چک کنی!`);
      }
      
      const lastActivityDays = userContext.lastActivity
        ? Math.floor((Date.now() - userContext.lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
        
      if (lastActivityDays >= 2) {
        notifications.push(`${lastActivityDays} روزه که فعالیت نداشتی! 😱 دلمون برات تنگ شده!`);
      } else {
        notifications.push(`امروزم مثل همیشه عالی بازی کن! 🌈 موفق باشی!`);
      }
      break;
  }
  
  // اگر هیچ اعلان مناسبی نداشتیم، برگرداندن اعلانات پیش‌فرض
  if (notifications.length === 0) {
    return defaultNotifications[category];
  }
  
  return notifications;
}

/**
 * ساخت پرامپت برای Gemini با توجه به اطلاعات کاربر
 * @param userContext اطلاعات کاربر
 * @param category دسته‌بندی اعلان
 * @returns پرامپت برای Gemini
 */
function buildNotificationPrompt(userContext: UserNotificationContext, category: NotificationCategory): string {
  // پرامپت پایه
  let basePrompt = `تو یک سیستم اعلانات هوشمند برای بازی اقتصادی دیسکورد به نام Ccoin هستی. وظیفه تو تولید اعلانات شخصی‌سازی شده، کوتاه و بامزه (همراه با ایموجی) برای کاربران با توجه به وضعیت فعلی آن‌هاست.

اطلاعات کاربر:
- نام: ${userContext.username}
- موجودی کیف پول: ${userContext.balance} Ccoin
- موجودی بانک: ${userContext.bankBalance} Ccoin
- استریک روزانه: ${userContext.dailyStreak} روز
- تعداد آیتم‌ها: ${userContext.itemCount}`;

  // اضافه کردن اطلاعات مرتبط با دسته‌بندی
  switch (category) {
    case NotificationCategory.CLAN_WAR:
      basePrompt += `
- عضو کلن: ${userContext.isInClan ? 'بله' : 'خیر'}`;
      if (userContext.isInClan) {
        basePrompt += `
- نام کلن: ${userContext.clanName}
- در حال جنگ: ${userContext.isInWar ? 'بله' : 'خیر'}`;
      }
      break;
      
    case NotificationCategory.STOCKS:
      basePrompt += `
- دارای سهام: ${userContext.hasStocks ? 'بله' : 'خیر'}`;
      if (userContext.hasStocks && userContext.stocks && userContext.stocks.length > 0) {
        basePrompt += `
- سهام‌ها:`;
        userContext.stocks.forEach(stock => {
          const profit = (stock.currentPrice - stock.purchased) * stock.quantity;
          basePrompt += `
  • ${stock.name}: ${stock.quantity} سهم، قیمت فعلی: ${stock.currentPrice}، سود/زیان: ${profit > 0 ? '+' : ''}${profit}`;
        });
      }
      break;
      
    case NotificationCategory.TOURNAMENT:
      basePrompt += `
- در تورنمنت: ${userContext.isInTournament ? 'بله' : 'خیر'}`;
      if (userContext.isInTournament) {
        basePrompt += `
- نام تورنمنت: ${userContext.tournamentName}`;
      }
      break;
      
    case NotificationCategory.QUESTS:
      basePrompt += `
- کوئست فعال: ${userContext.hasActiveQuests ? 'بله' : 'خیر'}`;
      if (userContext.hasActiveQuests && userContext.quests && userContext.quests.length > 0) {
        basePrompt += `
- کوئست‌ها:`;
        userContext.quests.forEach(quest => {
          const progressPercent = Math.round((quest.progress / quest.total) * 100);
          basePrompt += `
  • ${quest.name}: ${quest.progress}/${quest.total} (${progressPercent}%)، پاداش: ${quest.reward} Ccoin`;
        });
      }
      break;
  }
  
  // اضافه کردن درخواست برای تولید اعلانات با توجه به دسته‌بندی
  basePrompt += `

با توجه به این اطلاعات، 3 اعلان کوتاه، شخصی‌سازی شده و بامزه در دسته‌بندی "${getCategoryPersianName(category)}" تولید کن. هر اعلان باید:
1. حداکثر 70 کاراکتر باشد
2. حاوی حداقل یک ایموجی مرتبط باشد
3. مرتبط با وضعیت فعلی کاربر باشد
4. به زبان فارسی باشد
5. لحن طنزآمیز و دوستانه داشته باشد
6. به طور دقیق به اطلاعات کاربر اشاره کند

فقط اعلان‌ها را هر کدام در یک خط بنویس، بدون شماره‌گذاری یا توضیح اضافه.`;

  return basePrompt;
}

/**
 * تبدیل نام انگلیسی دسته‌بندی به فارسی
 * @param category دسته‌بندی اعلان
 * @returns نام فارسی دسته‌بندی
 */
function getCategoryPersianName(category: NotificationCategory): string {
  switch (category) {
    case NotificationCategory.ECONOMY:
      return 'اقتصادی';
    case NotificationCategory.CLAN_WAR:
      return 'کلن و جنگ';
    case NotificationCategory.STOCKS:
      return 'سهام و بازار';
    case NotificationCategory.TOURNAMENT:
      return 'تورنمنت و رقابت';
    case NotificationCategory.QUESTS:
      return 'ماموریت‌ها';
    case NotificationCategory.DAILY:
      return 'فعالیت روزانه';
    case NotificationCategory.GENERAL:
      return 'عمومی';
    default:
      return 'عمومی';
  }
}

/**
 * تولید اعلانات شخصی‌سازی شده برای کاربر
 * @param userId شناسه کاربر
 * @param count تعداد اعلانات مورد نیاز
 * @returns لیست اعلانات شخصی‌سازی شده
 */
export async function generateUserNotifications(userId: string, count: number = 3): Promise<string[]> {
  try {
    // دریافت اطلاعات کاربر
    const userContext = await getUserNotificationContext(userId);
    
    if (!userContext) {
      // اگر اطلاعات کاربر یافت نشد، از اعلانات پیش‌فرض استفاده می‌کنیم
      log(`اطلاعات کاربر ${userId} برای اعلانات یافت نشد. استفاده از اعلانات پیش‌فرض.`, 'warning');
      
      // انتخاب تصادفی از همه دسته‌بندی‌ها
      const allCategories = Object.values(NotificationCategory);
      const notifications: string[] = [];
      
      for (let i = 0; i < count; i++) {
        const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
        const categoryNotifications = defaultNotifications[randomCategory];
        const randomNotification = categoryNotifications[Math.floor(Math.random() * categoryNotifications.length)];
        notifications.push(randomNotification);
      }
      
      return notifications;
    }
    
    // تعیین اولویت‌های اعلانات برای کاربر
    const priorities = determineNotificationPriorities(userContext);
    
    // ساخت لیست اعلانات
    const notifications: string[] = [];
    const selectedCategories: NotificationCategory[] = [];
    
    // انتخاب دسته‌بندی‌های متفاوت برای اعلانات
    for (let i = 0; i < count; i++) {
      // کپی اولویت‌ها برای حذف دسته‌بندی‌های استفاده شده
      const currentPriorities: Record<NotificationPriority, NotificationCategory[]> = {
        [NotificationPriority.HIGH]: [...priorities[NotificationPriority.HIGH]].filter(c => !selectedCategories.includes(c)),
        [NotificationPriority.MEDIUM]: [...priorities[NotificationPriority.MEDIUM]].filter(c => !selectedCategories.includes(c)),
        [NotificationPriority.LOW]: [...priorities[NotificationPriority.LOW]].filter(c => !selectedCategories.includes(c))
      };
      
      // اگر همه دسته‌بندی‌ها استفاده شده‌اند، اجازه استفاده مجدد می‌دهیم
      if (
        currentPriorities[NotificationPriority.HIGH].length === 0 &&
        currentPriorities[NotificationPriority.MEDIUM].length === 0 &&
        currentPriorities[NotificationPriority.LOW].length === 0
      ) {
        currentPriorities[NotificationPriority.HIGH] = [...priorities[NotificationPriority.HIGH]];
        currentPriorities[NotificationPriority.MEDIUM] = [...priorities[NotificationPriority.MEDIUM]];
        currentPriorities[NotificationPriority.LOW] = [...priorities[NotificationPriority.LOW]];
      }
      
      // انتخاب یک دسته‌بندی
      const category = selectNotificationCategory(currentPriorities);
      selectedCategories.push(category);
      
      // تولید اعلانات شخصی برای دسته‌بندی انتخاب شده
      const categoryNotifications = await generatePersonalizedNotifications(userContext, category);
      
      // انتخاب یک اعلان تصادفی از این دسته‌بندی
      const randomIndex = Math.floor(Math.random() * categoryNotifications.length);
      notifications.push(categoryNotifications[randomIndex]);
    }
    
    log(`${notifications.length} اعلان شخصی‌سازی شده برای کاربر ${userId} تولید شد.`, 'success');
    return notifications;
  } catch (error) {
    log(`خطا در تولید اعلانات شخصی‌سازی شده: ${error}`, 'error');
    
    // در صورت خطا، از اعلانات پیش‌فرض استفاده می‌کنیم
    const fallbackNotifications: string[] = [];
    const allCategories = Object.values(NotificationCategory);
    
    for (let i = 0; i < count; i++) {
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
      const categoryNotifications = defaultNotifications[randomCategory];
      const randomNotification = categoryNotifications[Math.floor(Math.random() * categoryNotifications.length)];
      fallbackNotifications.push(randomNotification);
    }
    
    return fallbackNotifications;
  }
}