import path from 'path';
import fs from 'fs';
import { botConfig } from '../utils/config';
import { generateGoogleAIResponse, googleAIService } from './googleai';

// مسیر فایل آمار هوش مصنوعی
const AI_STATS_FILE = path.resolve(process.cwd(), 'ai_stats.json');

// تعریف انواع سرویس‌های هوش مصنوعی
export type AIService = 'googleai';

// ساختار داده آمار هوش مصنوعی
interface AIStats {
  service: AIService;
  lastUsed: string | null;
  requestCount: number;
  providerStats: {
    googleai: number;
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
  service: 'googleai',
  lastUsed: null,
  requestCount: 0,
  providerStats: {
    googleai: 0
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
  latency: number
): void {
  try {
    const stats = loadAIStats();
    
    // بروزرسانی آمار کلی
    stats.requestCount++;
    stats.lastUsed = new Date().toISOString();
    
    // فقط آمار سرویس گوگل را به‌روز می‌کنیم
    stats.providerStats.googleai++;
    
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
    
    // استفاده از سیستم کش‌شده گوگل AI با سبک پاسخگویی مشخص شده
    const response = await generateGoogleAIResponse(prompt, responseStyle);
    
    // محاسبه زمان پاسخگویی
    const latency = Date.now() - startTime;
    
    // بروزرسانی آمار - فقط برای درخواست‌های جدید (غیرکش شده)
    // زمان پاسخگویی کمتر از 50ms احتمالاً نشان‌دهنده استفاده از کش است
    if (latency > 50) {
      updateAIStats(usageType, latency);
    }
    
    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'متأسفانه در تولید پاسخ هوش مصنوعی خطایی رخ داد.';
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
}> {
  try {
    const startTime = Date.now();
    
    // استفاده از سبک پاسخگویی مشخص شده
    const aiSettings = botConfig.getAISettings();
    const style = responseStyle || aiSettings.responseStyle || 'متعادل';
    
    // فقط از سرویس گوگل استفاده می‌کنیم
    const response = await generateGoogleAIResponse(prompt, style);
    
    // محاسبه زمان پاسخگویی
    const latency = Date.now() - startTime;
    
    return {
      success: true,
      response,
      latency,
      style
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
    // همیشه از سرویس گوگل استفاده می‌کنیم
    const service = 'googleai';
    
    // تابع کمکی برای اعمال تایم‌اوت روی پینگ
    const pingWithTimeout = async (pingFunc: () => Promise<number>, timeout: number = 5000): Promise<number> => {
      return new Promise<number>((resolve) => {
        // تنظیم تایمر برای تایم‌اوت
        const timer = setTimeout(() => {
          console.log(`Ping timeout after ${timeout}ms for service ${service}`);
          resolve(-2); // کد -2 برای تایم‌اوت
        }, timeout);
        
        // اجرای تابع پینگ
        pingFunc().then(result => {
          clearTimeout(timer); // لغو تایمر
          resolve(result);
        }).catch(error => {
          clearTimeout(timer); // لغو تایمر
          console.error(`Error in ping function for ${service}:`, error);
          resolve(-1); // خطای نامشخص
        });
      });
    };
    
    // فقط از سرویس گوگل استفاده می‌کنیم
    return await pingWithTimeout(() => googleAIService.pingGoogleAI());
  } catch (error) {
    console.error('Error pinging AI service:', error);
    return -1; // خطای نامشخص
  }
}