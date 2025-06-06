import path from 'path';
import fs from 'fs';
import { botConfig } from '../utils/config';
import ccoinAIAltService from './ccoinAIAltService';
import ccoinAIService from './ccoinAIService'; // سرویس بهینه‌شده جدید
import ccoinAISDKService from './ccoinAISDKService';
import { log } from '../../vite';

// مسیر فایل آمار هوش مصنوعی
const AI_STATS_FILE = path.resolve(process.cwd(), 'ai_stats.json');

// تعریف انواع سرویس‌های هوش مصنوعی
// استفاده از یک سرویس کلی به نام CCOIN AI که زیر هود از گوگل استفاده می کند
export type AIService = 'ccoinai';

// ساختار داده آمار هوش مصنوعی
interface AIStats {
  service: AIService;
  lastUsed: string | null;
  requestCount: number;
  providerStats: {
    googleai: number;
    vertexai: number;
    ccoinai?: number;
  };
  usageCounts: {
    statusMessages: number;
    marketAnalysis: number;
    questStories: number;
    aiAssistant: number;
    other: number;
  };
  averageLatency: number;
  totalLatency: number;
}

// مقدار پیش‌فرض برای آمار
const defaultStats: AIStats = {
  service: 'ccoinai',
  lastUsed: null,
  requestCount: 0,
  providerStats: {
    googleai: 0,
    vertexai: 0,
    ccoinai: 0
  },
  usageCounts: {
    statusMessages: 0,
    marketAnalysis: 0,
    questStories: 0,
    aiAssistant: 0,
    other: 0
  },
  averageLatency: 0,
  totalLatency: 0
};

/**
 * تغییر سرویس هوش مصنوعی مورد استفاده
 * @param service نام سرویس جدید
 * @returns موفقیت‌آمیز بودن تغییر سرویس
 */
export function switchAIProvider(service: AIService): boolean {
  try {
    // بروزرسانی تنظیمات ربات با استفاده از متد جدید
    botConfig.switchAIService(service);
    
    // بروزرسانی آمار
    const stats = loadAIStats();
    stats.service = service;
    stats.lastUsed = new Date().toISOString();
    saveAIStats(stats);
    
    console.log(`سرویس هوش مصنوعی به ${service} تغییر یافت.`);
    return true;
  } catch (error) {
    console.error('Error switching AI provider:', error);
    return false;
  }
}

/**
 * بارگذاری آمار استفاده از سرویس‌های هوش مصنوعی
 * @returns آمار هوش مصنوعی
 */
function loadAIStats(): AIStats {
  try {
    if (fs.existsSync(AI_STATS_FILE)) {
      const data = fs.readFileSync(AI_STATS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading AI stats:', error);
  }
  
  // اگر فایل وجود نداشت یا خطایی رخ داد، مقدار پیش‌فرض را برمی‌گردانیم
  return { ...defaultStats };
}

/**
 * ذخیره آمار استفاده از سرویس‌های هوش مصنوعی
 * @param stats آمار به‌روزشده
 */
function saveAIStats(stats: AIStats): void {
  try {
    fs.writeFileSync(AI_STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving AI stats:', error);
  }
}

/**
 * بروزرسانی آمار استفاده از سرویس‌های هوش مصنوعی
 * @param usageType نوع استفاده
 * @param latency زمان پاسخگویی به میلی‌ثانیه
 */
function updateAIStats(
  usageType: 'statusMessages' | 'marketAnalysis' | 'questStories' | 'aiAssistant' | 'other',
  latency: number,
  provider: AIService = 'ccoinai'
): void {
  try {
    const stats = loadAIStats();
    
    // بروزرسانی آمار کلی
    stats.requestCount++;
    stats.lastUsed = new Date().toISOString();
    
    // بروزرسانی آمار سرویس‌ها
    // برای سازگاری با کد قبلی و ثبت آمار صحیح، همچنان ساختار را حفظ می‌کنیم
    // اما فقط ccoinai را به عنوان سرویس فعال در نظر می‌گیریم
    
    // بروزرسانی آمار سرویس CCOIN AI (در واقع Gemini)
    if (!stats.providerStats.ccoinai) {
      stats.providerStats.ccoinai = 0;
    }
    stats.providerStats.ccoinai++;
    
    // بروزرسانی نوع استفاده
    stats.usageCounts[usageType]++;
    
    // بروزرسانی زمان پاسخگویی
    stats.totalLatency += latency;
    stats.averageLatency = Math.round(stats.totalLatency / stats.requestCount);
    
    saveAIStats(stats);
  } catch (error) {
    console.error('Error updating AI stats:', error);
  }
}

/**
 * دریافت آمار سرویس‌های هوش مصنوعی
 * @returns آمار هوش مصنوعی
 */
export function getAIServiceStatus(): AIStats {
  return loadAIStats();
}

/**
 * تولید پاسخ با استفاده از هوش مصنوعی
 * @param prompt پرامپت ارسالی به هوش مصنوعی
 * @param usageType نوع استفاده (برای آمار)
 * @param responseStyle سبک پاسخگویی (اختیاری)
 * @returns پاسخ تولید شده
 */
export async function generateAIResponse(
  prompt: string,
  usageType: 'statusMessages' | 'marketAnalysis' | 'questStories' | 'aiAssistant' | 'other' = 'other',
  responseStyle?: string
): Promise<string> {
  try {
    const startTime = Date.now();
    
    // تبدیل سبک پاسخگویی به میزان خلاقیت مناسب
    const temperature = responseStyle ? 
      (responseStyle === 'خلاقانه' ? 0.9 : 
       responseStyle === 'دقیق' ? 0.3 : 
       responseStyle === 'طنزآمیز' ? 1.0 : 0.7) : 0.7;
    
    // بررسی سرویس فعلی
    const currentService = botConfig.getAISettings().service;
    let response: string;
    let serviceUsed: AIService = 'ccoinai';
    
    // سرویس‌های Gemini/CCOIN AI با بهینه‌سازی سرعت
    log(`ارسال درخواست به CCOIN AI: ${prompt.substring(0, 50)}...`, 'info');
    
    // بررسی اندازه درخواست - درخواست کوتاه زیر 200 کاراکتر است
    const isShortRequest = prompt.length < 200;
    
    // سعی می‌کنیم ابتدا از سرویس Gemini بهینه‌شده استفاده کنیم
    try {
      if (ccoinAIService.isAvailable()) {
        // برای درخواست‌های کوتاه از متد سریع استفاده می‌کنیم
        if (isShortRequest) {
          response = await ccoinAIService.generateContentFast(prompt, 1000);
        } else {
          response = await ccoinAIService.generateContent(prompt, 1000, temperature);
        }
      } 
      // fallback به سرویس SDK اصلی
      else if (ccoinAISDKService.isAvailable()) {
        response = await ccoinAISDKService.generateContent(prompt, 1000, temperature);
      } 
      // نهایتاً از سرویس جایگزین استفاده می‌کنیم
      else {
        response = await ccoinAIAltService.generateContent(prompt, 1000, temperature);
      }
    } catch (e) {
      // در صورت خطا در CCOIN AI به سرویس پشتیبان می‌رویم
      log(`خطا در سرویس CCOIN AI: ${e}. استفاده از سرویس پشتیبان CCOIN AI...`, 'warn');
      response = await ccoinAIAltService.generateContent(prompt, 1000, temperature);
    }
    
    // محاسبه زمان پاسخگویی
    const latency = Date.now() - startTime;
    
    // بروزرسانی آمار - فقط برای درخواست‌های جدید (غیرکش شده)
    if (latency > 50) {
      updateAIStats(usageType, latency, serviceUsed);
    }
    
    return response;
  } catch (error) {
    log(`Error generating AI response: ${error}`, 'error');
    // پیام‌های خطای جایگزین با محتوای مرتبط با ویژگی‌های ربات
    // هر پیام شامل یک اموجی متفاوت و پیشنهادی مرتبط با قابلیت‌های مختلف ربات است
    const errorResponses = [
      "🛌 استراحت کوتاه هوش مصنوعی",
      "🤔 هوش مصنوعی فعلاً در دسترس نیست",
      "⏳ CCOIN AI در حال بارگذاری مجدد",
      "🔄 به‌روزرسانی سیستم هوشمند",
      "😴 چرت کوتاه هوش مصنوعی",
      "🚧 دسترسی موقت به AI قطع شده",
      "🔋 شارژ باتری‌های هوش مصنوعی",
      "🛠️ بهینه‌سازی سیستم هوشمند",
      "🏝️ تعطیلات کوتاه مدت AI",
      "💤 خواب کوتاه مدت دستیار هوشمند",
      "🚀 ارتقای سیستم به نسخه جدید",
      "🧠 یادگیری مهارت‌های جدید AI",
      "🌬️ استراحت سرورهای هوشمند",
      "🌌 حل مسائل پیچیده کیهانی",
      "❄️ خواب زمستانی موقت هوش مصنوعی"
    ];
    
    return errorResponses[Math.floor(Math.random() * errorResponses.length)];
  }
}

/**
 * تست سرویس هوش مصنوعی با یک پرامپت ساده
 * @param prompt پرامپت تست
 * @param responseStyle سبک پاسخگویی (اختیاری)
 * @returns نتیجه تست
 */
export async function testAIService(
  prompt: string = 'سلام. حالت چطوره؟',
  responseStyle?: string
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  latency: number;
  style?: string;
  service?: AIService;
}> {
  try {
    const startTime = Date.now();
    
    // استفاده از سبک پاسخگویی مشخص شده
    const aiSettings = botConfig.getAISettings();
    const style = responseStyle || aiSettings.responseStyle || 'متعادل';
    
    // تبدیل سبک پاسخگویی به میزان خلاقیت مناسب
    const temperature = style === 'خلاقانه' ? 0.9 : 
                         style === 'دقیق' ? 0.3 : 
                         style === 'طنزآمیز' ? 1.0 : 0.7;
    
    let response: string;
    let serviceUsed: AIService = 'ccoinai';

    // بررسی سرویس فعلی
    const currentService = botConfig.getAISettings().service;
    
    // سرویس‌های Gemini/CCOIN AI با بهینه‌سازی سرعت
    try {
      // استفاده از سرویس بهینه‌شده با متد سریع برای تست
      if (ccoinAIService.isAvailable()) {
        response = await ccoinAIService.generateContentFast(prompt, 100);
      }
      // fallback به سرویس SDK اصلی
      else if (ccoinAISDKService.isAvailable()) {
        response = await ccoinAISDKService.generateContent(prompt, 100, temperature);
      } 
      // نهایتاً از سرویس جایگزین استفاده می‌کنیم
      else {
        response = await ccoinAIAltService.generateContent(prompt, 100, temperature);
      }
    } catch (e) {
      // در صورت خطا در CCOIN AI به سرویس پشتیبان می‌رویم
      log(`خطا در سرویس CCOIN AI: ${e}. استفاده از سرویس پشتیبان CCOIN AI...`, 'warn');
      response = await ccoinAIAltService.generateContent(prompt, 100, temperature);
    }
    
    // محاسبه زمان پاسخگویی
    const latency = Date.now() - startTime;
    
    return {
      success: true,
      response,
      latency,
      style,
      service: serviceUsed
    };
  } catch (error) {
    const latency = 0; // در صورت خطا، زمان پاسخگویی معنایی ندارد
    console.error('Error testing AI service:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطای نامشخص',
      latency
    };
  }
}

/**
 * تست سرعت سرویس هوش مصنوعی فعال
 * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا (مقدار منفی)
 */
export async function pingCurrentAIService(): Promise<number> {
  try {
    // تابع کمکی برای اعمال تایم‌اوت روی پینگ
    const pingWithTimeout = async (pingFunc: () => Promise<boolean>, service: string, timeout: number = 10000): Promise<number> => {
      return new Promise<number>((resolve) => {
        const startTime = performance.now(); // استفاده از performance.now برای دقت بیشتر
        
        // تنظیم تایمر برای تایم‌اوت - کاهش به 10 ثانیه
        const timer = setTimeout(() => {
          console.log(`Ping timeout after ${timeout}ms for service ${service}`);
          resolve(-2); // کد -2 برای تایم‌اوت
        }, timeout);
        
        // اجرای تابع پینگ
        pingFunc().then(success => {
          clearTimeout(timer); // لغو تایمر
          const pingTime = Math.round(performance.now() - startTime); // گرد کردن به عدد صحیح
          
          // حداقل مقدار پینگ را ۳۰ میلی‌ثانیه در نظر می‌گیریم
          // این کار برای جلوگیری از نمایش زمان‌های غیرواقعی نزدیک به صفر است
          const normalizedPingTime = Math.max(pingTime, 30);
          
          resolve(success ? normalizedPingTime : -1);
        }).catch(error => {
          clearTimeout(timer); // لغو تایمر
          console.error(`Error in ping function for ${service}:`, error);
          resolve(-1); // خطای نامشخص
        });
      });
    };
    
    // اگر درخواستی به تازگی انجام شده، آن را نادیده می‌گیریم و یک تست جدید انجام می‌دهیم
    // این کار باعث می‌شود همیشه یک پینگ واقعی نمایش داده شود
    
    // بررسی سرویس فعلی
    const currentService = botConfig.getAISettings().service;
    
    // ابتدا سرویس بهینه‌شده جدید را تست می‌کنیم
    if (ccoinAIService.isAvailable()) {
      // برای اطمینان از دور زدن کش، هیچ کاری نمی‌کنیم
      // تابع testConnection در ccoinAIService به درستی پیاده‌سازی شده است
      
      const optimizedResult = await pingWithTimeout(() => ccoinAIService.testConnection(), 'ccoinai-optimized', 8000);
      
      // اگر با موفقیت پاسخ داد، نتیجه را برمی‌گردانیم
      if (optimizedResult > 0) {
        return optimizedResult;
      }
    }
    
    // اگر سرویس بهینه‌شده در دسترس نبود، سرویس SDK را تست می‌کنیم
    if (ccoinAISDKService.isAvailable()) {
      const sdkResult = await pingWithTimeout(() => ccoinAISDKService.testConnection(), 'ccoinai-sdk');
      
      // اگر CCOIN AI با موفقیت پاسخ داد، نتیجه را برمی‌گردانیم
      if (sdkResult > 0) {
        return sdkResult;
      }
    }
    
    // اگر هر دو سرویس در دسترس نبودند یا با خطا مواجه شدند، از سرویس پشتیبان CCOIN AI استفاده می‌کنیم
    return await pingWithTimeout(() => ccoinAIAltService.testConnection(), 'ccoinai-backup');
  } catch (error) {
    console.error('Error pinging AI services:', error);
    return -1; // خطای نامشخص
  }
}