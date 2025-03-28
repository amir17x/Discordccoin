/**
 * سیستم تولید جملات طنز و سرگرم‌کننده توسط هوش مصنوعی
 * این ماژول برای تولید جملات طنز و سرگرم‌کننده برای نمایش در بخش Watching ربات استفاده می‌شود
 */

import { generateAIResponse } from '../services/aiService';
import { log } from '../../vite';

/**
 * لیست جملات پیش‌فرض کوتاه برای استفاده در صورت خطا در هوش مصنوعی
 */
const defaultFunnyStatuses = [
  "پاتک به رخت‌ها! 🧦",
  "لایک کردن استوری‌ها! ❤️",
  "نرخ‌ها رفت بالا! 📈",
  "غرق در سکه‌ها! 🌊",
  "برج‌سازی با سکه! 🏢",
  "اینهمه سکه! 🤑",
  "سکه‌های چشمک‌زن! ✨",
  "رقص با گاو‌های بورس! 🐂",
  "شاه کیف پول‌ها! 👑",
  "قلعه‌سازی با سکه! 🏰",
  "نوبت شماست! 🎯",
  "ساخت اقتصاد نو! 🌍",
  "جستجوی گنج! 🗺️",
  "تعیین قیمت کوین! 📊",
  "در ماموریت! 🕵️‍♂️",
  "کیسه سکه پیدا کردم! 🤫",
  "مضاعف کردن سکه‌ها! 🎰",
  "نرخ‌ها رفت پایین! 📉",
  "شمارش حساب‌ها! 🧮",
  "چرت زدن با الگوریتم‌ها! 😴",
  "سقوط آزاد قیمت‌ها! 🎢",
  "شکار لحظه‌های طلایی! 💰",
  "بیت‌کوین دزدیدم! 🏃‍♂️",
  "به دنبال ایردراپ‌ها! 🪂",
  "تجارت با کلاهبرداران! 🎭",
  "دست کردن تو جیب NFTها! 🖼️",
  "هنگ کردن صرافی‌ها! 🧠",
  "پول‌شویی با سیکوین! 🧼",
  "فرار از مالیات! 🏃‍♀️",
  "سکه‌ها را قایم کردم! 🙈",
  "دزدکی می‌بینمتون! 👀",
  "در حال دفاع از گاو بازار! 🛡️",
  "شارژ کیف پول‌های شما! 🔋",
  "دفتر یادداشت نهنگ‌ها! 🐋",
  "قیمت‌گذاری سیکوین! 💎",
  "ماینینگ با پلی‌استیشن! 🎮",
  "NFT میم‌ها را می‌خرم! 🤣",
  "با شورت بیت‌کوین اومدم! 🩳",
  "پامپ قیمت‌ها! 💉",
  "کف بازار می‌خرم! 📊"
];

/**
 * تم‌های مختلف برای تولید جملات
 */
export const messageThemes = [
  'طنز اقتصادی',
  'بازی و سرگرمی',
  'شوخی‌های اینترنتی',
  'طنز روزمره',
  'رقابت و چالش',
  'میم‌های کریپتو',
  'ثروت و پول',
  'عبارات نامتعارف',
  'دزدی و سرقت',
  'شوخی‌های گیمری',
  'بورس و سهام',
  'معاملات روزانه',
  'کوین‌های دیجیتال',
  'قمار و شرط‌بندی',
  'کسب درآمد اینترنتی',
  'ماموریت‌های مخفی',
  'فروشگاه و خرید',
  'امتیازات ویژه',
  'جوایز روزانه',
  'رتبه‌بندی بازیکنان',
  'دستورات اسلش',
  'منوی اقتصادی',
  'تیم‌ها و کلن‌ها',
  'جنگ و رقابت',
  'لاتاری و شانس'
];

/**
 * ذخیره‌سازی پیام‌های طنز برای کاهش تعداد درخواست‌ها به هوش مصنوعی
 * هر تم حداکثر 5 پیام ذخیره شده دارد
 */
const themeCachedMessages: { [key: string]: string[] } = {};

/**
 * حداکثر تعداد پیام ذخیره شده برای هر تم
 */
const MAX_CACHED_MESSAGES_PER_THEME = 5;

/**
 * تولید یک جمله طنز با استفاده از هوش مصنوعی
 * @returns یک جمله طنز تولید شده توسط هوش مصنوعی
 */
export async function generateFunnyStatusMessage(): Promise<string> {
  try {
    // انتخاب یک تم اتفاقی
    const randomTheme = messageThemes[Math.floor(Math.random() * messageThemes.length)];
    
    // اگر از این تم پیام‌های کش شده داریم، یکی را برگردانیم
    if (themeCachedMessages[randomTheme] && themeCachedMessages[randomTheme].length > 0) {
      // انتخاب یک پیام تصادفی از کش
      const randomIndex = Math.floor(Math.random() * themeCachedMessages[randomTheme].length);
      const message = themeCachedMessages[randomTheme][randomIndex];
      
      // حذف پیام استفاده شده از کش
      themeCachedMessages[randomTheme].splice(randomIndex, 1);
      
      log(`استفاده از پیام کش شده برای تم "${randomTheme}": "${message}"`, 'info');
      return message;
    }
    
    // ساخت پرامپت بهینه شده برای همه سرویس‌های هوش مصنوعی
    const prompt = `سیستم: تو یک ربات تولیدکننده جملات طنز و کوتاه برای نمایش در وضعیت (Watching Status) یک ربات دیسکورد هستی. بر اساس موضوع داده شده، چند جمله طنز و جذاب به زبان فارسی تولید کن.

کاربر: پنج جمله خیلی کوتاه، طنز و بامزه فارسی (هر کدام دقیقاً کمتر از ۵۰ کاراکتر) برای نمایش در بخش "Watching" در ربات Ccoin (یک بازی اقتصادی دیسکورد) تولید کن. هر جمله را در یک خط جداگانه بنویس.

موضوع: ${randomTheme}

شرایط مهم:
- هر جمله دقیقاً کمتر از ۵۰ کاراکتر باشد
- حتماً فارسی باشد و لحن طنز داشته باشد
- حتماً در هر جمله یک یا دو ایموجی مناسب استفاده کن
- کلمات و اصطلاحات رایج میان گیمرها و جوانان ایرانی استفاده کن
- فقط و فقط ۵ جمله نهایی را بنویس، هر کدام در یک خط جداگانه، بدون شماره‌گذاری و بدون هیچ توضیح اضافه‌ای
- جملات باید بامزه و خلاقانه باشند اما توهین‌آمیز نباشند

مهم: فقط ۵ جمله را هر کدام در یک خط جداگانه بنویس. بدون هیچ توضیح و مقدمه و علامت نقل قول.`;

    // دریافت پاسخ از هوش مصنوعی
    const generatedMessages = await generateAIResponse(prompt, "statusMessages");
    
    // تقسیم پاسخ به خطوط جداگانه
    const messageLines = generatedMessages.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length <= 50);
    
    // اگر هیچ پیامی دریافت نشد، از پیام‌های پیش‌فرض استفاده می‌کنیم
    if (messageLines.length === 0) {
      const fallbackMessage = defaultFunnyStatuses[Math.floor(Math.random() * defaultFunnyStatuses.length)];
      log(`هیچ پیامی دریافت نشد. استفاده از پیام پیش‌فرض: "${fallbackMessage}"`, 'info');
      return fallbackMessage;
    }
    
    // ذخیره پیام‌ها در کش
    themeCachedMessages[randomTheme] = messageLines.slice(1); // ذخیره همه پیام‌ها به جز اولی
    
    // محدود کردن تعداد پیام‌های ذخیره شده
    if (themeCachedMessages[randomTheme].length > MAX_CACHED_MESSAGES_PER_THEME) {
      themeCachedMessages[randomTheme] = themeCachedMessages[randomTheme].slice(0, MAX_CACHED_MESSAGES_PER_THEME);
    }
    
    // استفاده از اولین پیام
    const selectedMessage = messageLines[0];
    log(`تولید پیام طنز برای تم "${randomTheme}": "${selectedMessage}"`, 'success');
    return selectedMessage;
    
  } catch (error) {
    log(`خطا در تولید پیام طنز: ${error}`, 'error');
    
    // در صورت خطا، یک پیام پیش‌فرض بازگشت می‌دهیم
    const fallbackMessage = defaultFunnyStatuses[Math.floor(Math.random() * defaultFunnyStatuses.length)];
    log(`استفاده از پیام پیش‌فرض: "${fallbackMessage}"`, 'success');
    return fallbackMessage;
  }
}

/**
 * تنظیم زمانبندی برای به‌روزرسانی خودکار پیام وضعیت
 * @param client کلاینت دیسکورد
 * @param intervalMinutes فاصله زمانی به‌روزرسانی (به دقیقه)
 */
export function setupAutoStatusUpdater(client: any, intervalMinutes: number = 30) {
  // به‌روزرسانی اولیه پس از راه‌اندازی
  setTimeout(async () => {
    try {
      updateBotStatus(client);
    } catch (e) {
      log(`خطا در به‌روزرسانی اولیه وضعیت: ${e}`, 'error');
    }
  }, 10000); // 10 ثانیه پس از راه‌اندازی
  
  // تنظیم به‌روزرسانی دوره‌ای
  setInterval(async () => {
    try {
      updateBotStatus(client);
    } catch (e) {
      log(`خطا در به‌روزرسانی دوره‌ای وضعیت: ${e}`, 'error');
    }
  }, intervalMinutes * 60 * 1000);
  
  log(`سیستم به‌روزرسانی خودکار وضعیت با فاصله ${intervalMinutes} دقیقه راه‌اندازی شد`, 'info');
}

/**
 * به‌روزرسانی وضعیت نمایشی ربات
 * @param client کلاینت دیسکورد
 */
async function updateBotStatus(client: any) {
  try {
    const statusMessage = await generateFunnyStatusMessage();
    
    // تنظیم وضعیت جدید با استفاده از ActivityType
    client.user.setActivity(statusMessage, { type: 3 }); // 3 = WATCHING
    
    log(`وضعیت ربات به‌روزرسانی شد: ${statusMessage}`, 'info');
  } catch (error) {
    log(`خطا در به‌روزرسانی وضعیت ربات: ${error}`, 'error');
    
    // استفاده از یک پیام پیش‌فرض در صورت خطا
    try {
      const fallbackMessage = defaultFunnyStatuses[Math.floor(Math.random() * defaultFunnyStatuses.length)];
      client.user.setActivity(fallbackMessage, { type: 3 }); // 3 = WATCHING
      log(`استفاده از پیام پیش‌فرض: ${fallbackMessage}`, 'info');
    } catch (e) {
      log(`خطا در تنظیم پیام پیش‌فرض: ${e}`, 'error');
    }
  }
}

/**
 * به‌روزرسانی فوری وضعیت ربات
 * @param client کلاینت دیسکورد
 */
export async function forceUpdateStatus(client: any) {
  try {
    await updateBotStatus(client);
    return true;
  } catch (error) {
    log(`خطا در به‌روزرسانی فوری وضعیت: ${error}`, 'error');
    return false;
  }
}