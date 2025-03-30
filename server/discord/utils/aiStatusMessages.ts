/**
 * سیستم پیام‌های وضعیت خودکار با هوش مصنوعی و کتابخانه محلی
 * 
 * این ماژول برای تولید پیام‌های وضعیت خودکار و طنزآمیز برای ربات با استفاده از هوش مصنوعی
 * و یا کتابخانه محلی پیام‌ها طراحی شده است. هدف ایجاد محتوای سرگرم‌کننده و جذاب برای کاربران است.
 */

import { Client, ActivityType } from 'discord.js';
import { generateAIResponse } from '../services/aiService';
import { log } from '../../vite';
import * as fs from 'fs';
import * as path from 'path';
import {
  getRandomStatusMessage,
  getRandomStatusMessageByTheme,
  mapDefaultThemeToLibraryTheme,
  StatusMessage
} from './statusMessageLibrary';

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

// نوع داده برای تنظیمات وضعیت
interface StatusConfig {
  useAI: boolean;
}

// متغیر برای تعیین اینکه آیا از هوش مصنوعی استفاده شود یا از کتابخانه محلی
// ابتدا از هوش مصنوعی استفاده می‌کنیم و در صورت خطا به کتابخانه محلی تغییر می‌کنیم
let useAI = true;
// تعداد خطاهای متوالی هوش مصنوعی
let aiFailureCount = 0;
// حداکثر تعداد خطاهای مجاز قبل از تغییر به کتابخانه محلی
const MAX_AI_FAILURES = 3;

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
    
    let statusMessage: string;
    
    if (useAI) {
      try {
        // تولید پیام طنزآمیز با هوش مصنوعی
        statusMessage = await generateStatusWithAI(theme);
        // ریست کردن شمارنده خطا در صورت موفقیت
        aiFailureCount = 0;
      } catch (error) {
        // افزایش شمارنده خطا
        aiFailureCount++;
        
        // اگر تعداد خطاها از حد مجاز بیشتر شد، به کتابخانه محلی تغییر می‌کنیم
        if (aiFailureCount >= MAX_AI_FAILURES) {
          useAI = false;
          log(`تغییر به استفاده از کتابخانه محلی پیام‌ها به دلیل ${aiFailureCount} خطای متوالی در هوش مصنوعی`, 'warning');
        }
        
        // استفاده از کتابخانه محلی در صورت خطا
        statusMessage = generateStatusFromLibrary(theme);
      }
    } else {
      // استفاده از کتابخانه محلی
      statusMessage = generateStatusFromLibrary(theme);
    }
    
    // تنظیم وضعیت جدید
    client.user?.setActivity(statusMessage, { type: ActivityType.Watching });
    
    log(`وضعیت ربات به‌روزرسانی شد: ${statusMessage}`, 'info');
    
    return statusMessage;
  } catch (error) {
    log(`خطا در تولید پیام وضعیت: ${error}`, 'error');
    
    // استفاده از پیام پیش‌فرض در صورت خطا
    const fallbackMsg = generateStatusFromLibrary();
    client.user?.setActivity(fallbackMsg, { type: ActivityType.Watching });
    
    log(`استفاده از پیام پیش‌فرض: ${fallbackMsg}`, 'info');
    return fallbackMsg;
  }
}

/**
 * تولید پیام وضعیت با استفاده از هوش مصنوعی
 * @param theme تم پیام
 * @returns پیام تولید شده
 */
async function generateStatusWithAI(theme: string): Promise<string> {
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
  
  log(`تولید پیام طنز برای تم "${theme}" با هوش مصنوعی: "${statusMessage}"`, 'success');
  
  return statusMessage;
}

/**
 * تولید پیام وضعیت از کتابخانه محلی
 * @param theme تم پیام (اختیاری)
 * @returns پیام تولید شده
 */
function generateStatusFromLibrary(theme?: string): string {
  let statusMessage: StatusMessage;
  
  if (theme) {
    // تبدیل تم ربات به تم کتابخانه
    const libraryTheme = mapDefaultThemeToLibraryTheme(theme);
    
    // دریافت پیام از کتابخانه بر اساس تم
    const message = getRandomStatusMessageByTheme(libraryTheme);
    
    // اگر پیامی با این تم پیدا نشد، یک پیام تصادفی برمی‌گردانیم
    statusMessage = message || getRandomStatusMessage();
  } else {
    // دریافت یک پیام تصادفی از کتابخانه
    statusMessage = getRandomStatusMessage();
  }
  
  log(`تولید پیام طنز برای تم "${statusMessage.theme}" از کتابخانه محلی: "${statusMessage.text}"`, 'success');
  
  return statusMessage.text;
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

/**
 * تغییر روش تولید پیام وضعیت (استفاده از هوش مصنوعی یا کتابخانه محلی)
 * @param useArtificialIntelligence آیا از هوش مصنوعی استفاده شود
 */
export function setStatusGenerationMethod(useArtificialIntelligence: boolean): void {
  useAI = useArtificialIntelligence;
  
  log(`روش تولید پیام وضعیت تغییر کرد: ${useAI ? 'هوش مصنوعی' : 'کتابخانه محلی'}`, 'info');
  
  // ریست کردن شمارنده خطا
  if (useAI) {
    aiFailureCount = 0;
  }
}

/**
 * دریافت روش فعلی تولید پیام وضعیت
 * @returns وضعیت استفاده از هوش مصنوعی یا کتابخانه محلی
 */
export function getStatusGenerationMethod(): boolean {
  return useAI;
}