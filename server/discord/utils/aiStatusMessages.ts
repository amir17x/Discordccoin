/**
 * سیستم تولید جملات طنز و سرگرم‌کننده توسط هوش مصنوعی
 * این ماژول برای تولید جملات طنز و سرگرم‌کننده برای نمایش در بخش Watching ربات استفاده می‌شود
 */

import { huggingFaceService } from '../services/huggingface';
import { log } from '../../vite';

/**
 * لیست جملات پیش‌فرض برای استفاده در صورت خطا در هوش مصنوعی
 */
const defaultFunnyStatuses = [
  "تو رخت‌ها نشستم دارم پاتک میزنم! 🧦",
  "دارم استوری‌های اینستا رو لایک می‌کنم! ❤️",
  "نرخ‌ها رفت بالا؟ یکی منو بگیره! 📈",
  "توی بحر سکه‌ها غرق شدم! 🌊",
  "دارم با سکه‌هام برج می‌سازم! 🏢",
  "کی تا حالا اینهمه سکه دیده؟! 🤑",
  "سکه‌ها چشمک می‌زنن! ✨",
  "دارم با گاو‌های بورس می‌رقصم! 🐂💃",
  "شاه کیف پول‌ها منم! 👑",
  "دارم با سکه‌هام قلعه می‌سازم! 🏰",
  "به همه میرسم، نوبتی هم باشه نوبت شماست! 🎯",
  "تو فکر ساخت یه اقتصاد جدیدم! 🌍",
  "دنبال گنج توی بازار میگردم! 🗺️",
  "قیمت کوین رو من تعیین می‌کنم! 📊",
  "رفتم ماموریت، زود برمیگردم! 🕵️‍♂️",
  "یه کیسه سکه پیدا کردم، هیچکی نفهمه! 🤫",
  "دارم تو کازینو سکه‌ها رو دو برابر می‌کنم! 🎰",
  "نرخت‌ها رفت بالا؟ یکی منو بگیره! 📉",
  "میلیاردر شدم، دارم شماره حساب‌هام رو می‌شمارم! 🧮",
  "دارم با الگوریتم‌ها چرت می‌زنم! 😴"
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
    const prompt = `یک جمله کوتاه، طنز و بامزه فارسی (حداکثر ۱۰۰ کاراکتر) برای نمایش در بخش "Watching" یک ربات دیسکورد مخصوص بازی Ccoin (یک بازی اقتصادی) تولید کن.
    
    شرایط:
    - جمله باید حتما به فارسی و با لحن طنز و شوخ باشد
    - از ایموجی مناسب استفاده کن (فقط یک یا دو ایموجی)
    - موضوع: ${randomTheme}
    - نباید بیش از ۱۰۰ کاراکتر باشد
    - خیلی خلاقانه و غیرتکراری باشد
    - میتونه به سبک جملات میم فارسی باشه
    - از کلمات و اصطلاحات رایج میان گیمرها و نوجوانان و جوانان ایرانی استفاده کن
    - میتونه کمی شیطنت‌آمیز باشه ولی نباید توهین‌آمیز یا نامناسب باشه
    
    فقط جمله نهایی رو بنویس بدون هیچ توضیح اضافه‌ای.`;

    // دریافت پاسخ از هوش مصنوعی
    const generatedMessage = await huggingFaceService.getAIResponse(prompt, {
      maxTokens: 100,
      temperature: 0.9 // خلاقیت بالاتر
    });
    
    // پاکسازی پاسخ از کاراکترهای اضافی
    let cleanedMessage = generatedMessage.trim();
    
    // اطمینان از اینکه پیام خیلی طولانی نیست
    if (cleanedMessage.length > 100) {
      cleanedMessage = cleanedMessage.substring(0, 97) + '...';
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