/**
 * سیستم تولید جملات طنز و سرگرم‌کننده توسط هوش مصنوعی
 * این ماژول برای تولید جملات طنز و سرگرم‌کننده برای نمایش در بخش Watching ربات استفاده می‌شود
 */

import { aiService } from '../services/aiService';
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
  "نرخ‌ها رفت بالا! 📉",
  "شمارش حساب‌ها! 🧮",
  "چرت زدن با الگوریتم‌ها! 😴"
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
  'شوخی‌های گیمری'
];

/**
 * تولید یک جمله طنز با استفاده از هوش مصنوعی
 * @returns یک جمله طنز تولید شده توسط هوش مصنوعی
 */
export async function generateFunnyStatusMessage(): Promise<string> {
  try {
    // انتخاب یک تم اتفاقی
    const randomTheme = messageThemes[Math.floor(Math.random() * messageThemes.length)];
    
    // ساخت پرامپت برای Hugging Face
    const prompt = `یک جمله خیلی کوتاه، طنز و بامزه فارسی (حداکثر ۵۰ کاراکتر) برای نمایش در بخش "Watching" یک ربات دیسکورد مخصوص بازی Ccoin (یک بازی اقتصادی) تولید کن.
    
    شرایط مهم:
    - جمله باید حتماً کوتاه باشد (حداکثر ۵۰ کاراکتر)
    - جمله باید حتما به فارسی و با لحن طنز و شوخ باشد
    - از ایموجی مناسب استفاده کن (فقط یک یا دو ایموجی)
    - موضوع: ${randomTheme}
    - خیلی خلاقانه و کوتاه و مختصر باشد
    - میتونه به سبک جملات میم فارسی باشه
    - از کلمات و اصطلاحات رایج میان گیمرها و نوجوانان و جوانان ایرانی استفاده کن
    - میتونه کمی شیطنت‌آمیز باشه ولی نباید توهین‌آمیز یا نامناسب باشه
    
    مهم: فقط جمله نهایی رو بنویس بدون هیچ توضیح اضافه‌ای، و حتماً کوتاه باشد (کمتر از ۵۰ کاراکتر).`;

    // دریافت پاسخ از هوش مصنوعی
    const generatedMessage = await aiService.getAIResponse(prompt, {
      maxTokens: 100,
      temperature: 0.9 // خلاقیت بالاتر
    });
    
    // پاکسازی پاسخ از کاراکترهای اضافی
    let cleanedMessage = generatedMessage.trim();
    
    // اطمینان از اینکه پیام خیلی طولانی نیست - پیام باید کوتاه‌تر باشد (حداکثر 50 کاراکتر)
    if (cleanedMessage.length > 50) {
      cleanedMessage = cleanedMessage.substring(0, 47) + '...';
    }
    
    log(`تولید پیام طنز: "${cleanedMessage}"`, 'success');
    
    return cleanedMessage;
  } catch (error) {
    log(`خطا در تولید پیام طنز: ${error}`, 'error');
    
    // استفاده از پیام‌های پیش‌فرض در صورت خطا
    const fallbackMessage = defaultFunnyStatuses[Math.floor(Math.random() * defaultFunnyStatuses.length)];
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
  }
}