import path from 'path';
import fs from 'fs';
import { botConfig } from '../utils/config';
import ccoinAIAltService from './ccoinAIAltService';
import geminiService from './geminiService';
import geminiSdkService from './geminiSdkService';
import { log } from '../../vite';

// مسیر فایل آمار هوش مصنوعی
const AI_STATS_FILE = path.resolve(process.cwd(), 'ai_stats.json');

// تعریف انواع سرویس‌های هوش مصنوعی
export type AIService = 'ccoinai' | 'googleai' | 'vertexai';

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
    if (provider === 'googleai') {
      stats.providerStats.googleai++;
    } else if (provider === 'vertexai') {
      if (!stats.providerStats.vertexai) {
        stats.providerStats.vertexai = 0;
      }
      stats.providerStats.vertexai++;
    } else if (provider === 'ccoinai') {
      if (!stats.providerStats.ccoinai) {
        stats.providerStats.ccoinai = 0;
      }
      stats.providerStats.ccoinai++;
    }
    
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
    
    // سرویس‌های Gemini/CCOIN AI
    log(`ارسال درخواست به CCOIN AI: ${prompt.substring(0, 50)}...`, 'info');
      
    // سعی می‌کنیم ابتدا از سرویس SDK استفاده کنیم
    try {
      if (geminiSdkService.isAvailable()) {
        response = await geminiSdkService.generateContent(prompt, 1000, temperature);
        serviceUsed = 'googleai';
      } else {
        // اگر SDK در دسترس نبود، از سرویس جایگزین استفاده می‌کنیم
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
    const errorResponses = [
      "اوپس! CCOIN AI در حال استراحته 🛌 تا برگرده، یه سری به منوی بازی‌ها بزن و کمی سکه جمع کن! 🎮💰",
      "هوش مصنوعی فعلاً در دسترس نیست 🤔 چه فرصت خوبی برای چرخوندن چرخ شانس و بردن جوایز! 🎡✨",
      "CCOIN AI داره نفس تازه می‌کنه! ⏳ اما نگران نباش، فروشگاه همیشه بازه - می‌تونی آیتم‌های جدید بخری! 🛍️",
      "سیستم هوش مصنوعی در حال به‌روزرسانیه 🔄 در این فاصله می‌تونی با دوستانت به گروه‌بازی‌های هیجان‌انگیز بپیوندی! 🎭",
      "ظاهراً CCOIN AI به استراحت نیاز داشت 😴 بهتره الان یه ماموریت جدید شروع کنی و سکه جمع کنی! 🎯",
      "هوش مصنوعی موقتاً در دسترس نیست 🚧 فرصت خوبیه که به کلنت سر بزنی یا یه کلن جدید بسازی! 🏰",
      "CCOIN AI داره شارژ میشه! 🔋 تا برگرده، یادت نره پاداش روزانه‌ات رو بگیری! 🎁",
      "سیستم هوش مصنوعی در حال بهینه‌سازیه 🛠️ چطوره توی این فاصله با قابلیت دزدی یکم سکه به دست بیاری؟ 🥷"
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
    
    // سرویس‌های Gemini/CCOIN AI
    try {
      if (geminiSdkService.isAvailable()) {
        response = await geminiSdkService.generateContent(prompt, 200, temperature);
        serviceUsed = 'googleai'; // SDK را به عنوان googleai در آمار نشان می‌دهیم
      } else {
        // اگر SDK در دسترس نبود، از سرویس جایگزین استفاده می‌کنیم
        response = await ccoinAIAltService.generateContent(prompt, 200, temperature);
      }
    } catch (e) {
      // در صورت خطا در CCOIN AI به سرویس پشتیبان می‌رویم
      log(`خطا در سرویس CCOIN AI: ${e}. استفاده از سرویس پشتیبان CCOIN AI...`, 'warn');
      response = await ccoinAIAltService.generateContent(prompt, 200, temperature);
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
    const pingWithTimeout = async (pingFunc: () => Promise<boolean>, service: string, timeout: number = 5000): Promise<number> => {
      return new Promise<number>((resolve) => {
        const startTime = Date.now();
        
        // تنظیم تایمر برای تایم‌اوت
        const timer = setTimeout(() => {
          console.log(`Ping timeout after ${timeout}ms for service ${service}`);
          resolve(-2); // کد -2 برای تایم‌اوت
        }, timeout);
        
        // اجرای تابع پینگ
        pingFunc().then(success => {
          clearTimeout(timer); // لغو تایمر
          const pingTime = Date.now() - startTime;
          resolve(success ? pingTime : -1);
        }).catch(error => {
          clearTimeout(timer); // لغو تایمر
          console.error(`Error in ping function for ${service}:`, error);
          resolve(-1); // خطای نامشخص
        });
      });
    };
    
    // بررسی سرویس فعلی
    const currentService = botConfig.getAISettings().service;
    
    // ابتدا سرویس CCOIN AI را تست می‌کنیم
    if (geminiSdkService.isAvailable()) {
      const sdkResult = await pingWithTimeout(() => geminiSdkService.testConnection(), 'ccoinai');
      
      // اگر CCOIN AI با موفقیت پاسخ داد، نتیجه را برمی‌گردانیم
      if (sdkResult > 0) {
        return sdkResult;
      }
    }
    
    // اگر CCOIN AI در دسترس نبود یا با خطا مواجه شد، از سرویس پشتیبان CCOIN AI استفاده می‌کنیم
    return await pingWithTimeout(() => ccoinAIAltService.testConnection(), 'ccoinai-backup');
  } catch (error) {
    console.error('Error pinging AI services:', error);
    return -1; // خطای نامشخص
  }
}