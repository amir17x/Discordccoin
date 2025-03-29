/**
 * سیستم پیام‌های وضعیت خودکار با هوش مصنوعی
 * 
 * این ماژول برای تولید پیام‌های وضعیت خودکار و طنزآمیز برای ربات با استفاده از هوش مصنوعی
 * طراحی شده است. هدف ایجاد محتوای سرگرم‌کننده و جذاب برای کاربران است.
 */

import { Client, ActivityType } from 'discord.js';
import { generateAIResponse } from '../services/aiService';
import { log } from '../../vite';

// تم‌های مختلف برای پیام‌های وضعیت
const statusThemes = [
  'بازی‌ها و سرگرمی',
  'اقتصاد و کسب درآمد',
  'دوستی و روابط اجتماعی',
  'تیم‌ها و کلن‌ها',
  'کسب درآمد اینترنتی',
  'سرمایه‌گذاری',
  'قدرت و رقابت',
  'هوش مصنوعی',
  'آینده دیجیتال',
  'فناوری‌های نوین'
];

/**
 * راه‌اندازی سیستم به‌روزرسانی خودکار وضعیت
 * @param client کلاینت دیسکورد
 * @param intervalMinutes فاصله زمانی به‌روزرسانی (دقیقه)
 */
export async function setupAutoStatusUpdater(client: Client, intervalMinutes: number = 20) {
  try {
    // به‌روزرسانی فوری در ابتدای راه‌اندازی
    await updateBotStatus(client);
    
    // تنظیم به‌روزرسانی دوره‌ای
    setInterval(async () => {
      try {
        await updateBotStatus(client);
      } catch (error) {
        log(`خطا در به‌روزرسانی وضعیت ربات: ${error}`, 'error');
      }
    }, intervalMinutes * 60 * 1000);
    
    log(`سیستم به‌روزرسانی خودکار وضعیت با فاصله ${intervalMinutes} دقیقه راه‌اندازی شد`, 'info');
    return true;
  } catch (error) {
    log(`خطا در راه‌اندازی سیستم به‌روزرسانی وضعیت: ${error}`, 'error');
    return false;
  }
}

/**
 * به‌روزرسانی وضعیت ربات با پیام طنزآمیز جدید
 * @param client کلاینت دیسکورد
 */
async function updateBotStatus(client: Client) {
  try {
    // انتخاب تم تصادفی
    const theme = statusThemes[Math.floor(Math.random() * statusThemes.length)];
    
    // تولید پیام طنزآمیز با هوش مصنوعی
    const prompt = `یک پیام کوتاه و طنزآمیز برای نمایش در وضعیت "در حال تماشای..." یک ربات دیسکورد بنویس. 
    
    تم پیام باید درباره "${theme}" باشد. این پیام باید خنده‌دار و جذاب باشد و نباید از ۳۰ کاراکتر بیشتر باشد.
    
    مثال‌ها:
    - "چطوری پولدار بشیم"
    - "دنبال یه دوست خوب"
    - "رویای رئیس کلن شدن"
    
    فقط متن پیام را بنویس، بدون هیچ توضیح اضافه و بدون علامت نقل قول.`;
    
    // دریافت پاسخ از هوش مصنوعی
    let statusMessage = await generateAIResponse(prompt, "statusMessages");
    
    // حذف علامت‌های نقل قول اگر وجود داشته باشد
    statusMessage = statusMessage.replace(/^["']|["']$/g, '');
    
    // اطمینان از کوتاه بودن پیام
    if (statusMessage.length > 50) {
      statusMessage = statusMessage.substring(0, 47) + '...';
    }
    
    // افزودن اموجی متناسب با موضوع
    statusMessage = addAppropriateEmoji(statusMessage, theme);
    
    // تنظیم وضعیت جدید
    client.user?.setActivity(statusMessage, { type: ActivityType.Watching });
    
    log(`تولید پیام طنز برای تم "${theme}": "${statusMessage}"`, 'success');
    log(`وضعیت ربات به‌روزرسانی شد: ${statusMessage}`, 'info');
    
    return statusMessage;
  } catch (error) {
    log(`خطا در تولید پیام وضعیت: ${error}`, 'error');
    
    // استفاده از پیام پیش‌فرض در صورت خطا
    const fallbackMessages = [
      'پول پارو کردن 💰',
      'تیم تشکیل دادن 🤝',
      'دنبال ایده‌های جدید 💡',
      'راه‌های کسب درآمد 💸',
      'بهترین بازی‌ها 🎮'
    ];
    
    const fallbackMsg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    client.user?.setActivity(fallbackMsg, { type: ActivityType.Watching });
    
    log(`استفاده از پیام پیش‌فرض: ${fallbackMsg}`, 'info');
    return fallbackMsg;
  }
}

/**
 * افزودن اموجی مناسب به پیام بر اساس تم
 * @param message پیام اصلی
 * @param theme تم پیام
 * @returns پیام با اموجی مناسب
 */
function addAppropriateEmoji(message: string, theme: string): string {
  // اگر پیام قبلاً اموجی دارد، آن را برنمی‌گردانیم
  // لیست برخی از معمول‌ترین اموجی‌ها برای بررسی
  const commonEmojis = [
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🙂', '🙄', '😐', '😑', '😶', '🙃', '😏',
    '💰', '💵', '💸', '📈', '🤑', '🏅', '🎮', '🎯', '🎲', '🎪', '🎨', '🤝', '👋', '🫂', '🤗', '❤️', '👥', '🛡️', '⚔️', '🏆', '👑',
    '💻', '📱', '🌐', '📊', '📈', '💹', '🏦', '💪', '⚡', '🔥', '👊', '🤖', '🧠', '💡', '🔮', '👾', '🚀', '🌠', '⚡'
  ];
  
  // بررسی وجود یکی از اموجی‌ها در متن
  if (commonEmojis.some(emoji => message.includes(emoji))) {
    return message;
  }
  
  // انتخاب اموجی مناسب بر اساس تم
  let emoji = '';
  
  switch (theme) {
    case 'بازی‌ها و سرگرمی':
      emoji = ['🎮', '🎯', '🎲', '🎪', '🎨'][Math.floor(Math.random() * 5)];
      break;
    case 'اقتصاد و کسب درآمد':
      emoji = ['💰', '💵', '💸', '📈', '🤑'][Math.floor(Math.random() * 5)];
      break;
    case 'دوستی و روابط اجتماعی':
      emoji = ['🤝', '👋', '🫂', '🤗', '❤️'][Math.floor(Math.random() * 5)];
      break;
    case 'تیم‌ها و کلن‌ها':
      emoji = ['👥', '🛡️', '⚔️', '🏆', '👑'][Math.floor(Math.random() * 5)];
      break;
    case 'کسب درآمد اینترنتی':
      emoji = ['💻', '📱', '💸', '🌐', '📊'][Math.floor(Math.random() * 5)];
      break;
    case 'سرمایه‌گذاری':
      emoji = ['📈', '💹', '💰', '💎', '🏦'][Math.floor(Math.random() * 5)];
      break;
    case 'قدرت و رقابت':
      emoji = ['💪', '🏆', '⚡', '🔥', '👊'][Math.floor(Math.random() * 5)];
      break;
    case 'هوش مصنوعی':
      emoji = ['🤖', '🧠', '💡', '🔮', '👾'][Math.floor(Math.random() * 5)];
      break;
    case 'آینده دیجیتال':
      emoji = ['🚀', '🌠', '🔮', '🌐', '⚡'][Math.floor(Math.random() * 5)];
      break;
    case 'فناوری‌های نوین':
      emoji = ['📱', '💻', '🔋', '📡', '🛰️'][Math.floor(Math.random() * 5)];
      break;
    default:
      emoji = ['💡', '✨', '🌟', '🔥', '⭐'][Math.floor(Math.random() * 5)];
  }
  
  // افزودن اموجی به انتهای پیام
  return `${message} ${emoji}`;
}

/**
 * تولید یک پیام وضعیت جدید به صورت دستی
 * @param client کلاینت دیسکورد
 * @param theme تم انتخابی (اختیاری)
 * @returns پیام وضعیت تولید شده
 */
export async function generateNewStatus(client: Client, theme?: string): Promise<string> {
  try {
    // اگر تم مشخص نشده باشد، یک تم تصادفی انتخاب می‌کنیم
    const selectedTheme = theme || statusThemes[Math.floor(Math.random() * statusThemes.length)];
    
    // به‌روزرسانی وضعیت و دریافت پیام تولید شده
    return await updateBotStatus(client);
  } catch (error) {
    log(`خطا در تولید دستی وضعیت جدید: ${error}`, 'error');
    throw error;
  }
}