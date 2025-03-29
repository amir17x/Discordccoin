import path from 'path';
import fs from 'fs';
import { botConfig } from '../utils/config';
import { generateGoogleAIResponse, googleAIService } from './googleai';
import { generateVertexAIResponse, vertexAIService } from './vertexai';
import { generateGeminiAltResponse, geminiAltService } from './geminiAltService';

// مسیر فایل آمار هوش مصنوعی
const AI_STATS_FILE = path.resolve(process.cwd(), 'ai_stats.json');

// تعریف انواع سرویس‌های هوش مصنوعی
export type AIService = 'googleai' | 'vertexai' | 'geminialt';

// ساختار داده آمار هوش مصنوعی
interface AIStats {
  service: AIService;
  lastUsed: string | null;
  requestCount: number;
  providerStats: {
    googleai: number;
    vertexai: number;
    geminialt?: number;
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
    googleai: 0,
    vertexai: 0
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
  provider: AIService = 'googleai'
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
    } else if (provider === 'geminialt') {
      if (!stats.providerStats.geminialt) {
        stats.providerStats.geminialt = 0;
      }
      stats.providerStats.geminialt++;
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
    
    // بررسی سرویس فعال
    const aiSettings = botConfig.getAISettings();
    const activeService = aiSettings.service || 'googleai';
    
    if (activeService === 'geminialt') {
      try {
        // استفاده از GeminiAlt
        const response = await generateGeminiAltResponse(prompt, responseStyle);
        
        // محاسبه زمان پاسخگویی
        const latency = Date.now() - startTime;
        
        // بروزرسانی آمار - فقط برای درخواست‌های جدید (غیرکش شده)
        if (latency > 50) {
          updateAIStats(usageType, latency, 'geminialt');
        }
        
        return response;
      } catch (geminiError) {
        console.error('Error with Gemini Alt, fallback to Google AI:', geminiError);
        // ادامه به روش فالبک
      }
    }
    
    // اگر سرویس فعال Vertex AI باشد یا Gemini Alt خطا داده باشد، تلاش می‌کنیم با Vertex AI پاسخ بگیریم
    if (activeService === 'vertexai' || activeService === 'geminialt') {
      try {
        const response = await generateVertexAIResponse(prompt, responseStyle);
        
        // محاسبه زمان پاسخگویی
        const latency = Date.now() - startTime;
        
        // بروزرسانی آمار - فقط برای درخواست‌های جدید (غیرکش شده)
        if (latency > 50) {
          updateAIStats(usageType, latency, 'vertexai');
        }
        
        return response;
      } catch (vertexError) {
        console.error('Error with Vertex AI, fallback to Google AI:', vertexError);
        // ادامه به روش فالبک
      }
    }
    
    // در صورت خطا یا اگر سرویس فعال Google AI باشد، از آن استفاده می‌کنیم
    const response = await generateGoogleAIResponse(prompt, responseStyle);
    
    // محاسبه زمان پاسخگویی
    const latency = Date.now() - startTime;
    
    // بروزرسانی آمار - فقط برای درخواست‌های جدید (غیرکش شده)
    if (latency > 50) {
      updateAIStats(usageType, latency, 'googleai');
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
  service?: AIService;
}> {
  try {
    const startTime = Date.now();
    
    // استفاده از سبک پاسخگویی مشخص شده
    const aiSettings = botConfig.getAISettings();
    const style = responseStyle || aiSettings.responseStyle || 'متعادل';
    const activeService = aiSettings.service || 'googleai';
    
    // اگر سرویس فعال GeminiAlt باشد، ابتدا آن را آزمایش می‌کنیم
    if (activeService === 'geminialt') {
      try {
        const response = await generateGeminiAltResponse(prompt, style);
        
        // محاسبه زمان پاسخگویی
        const latency = Date.now() - startTime;
        
        return {
          success: true,
          response,
          latency,
          style,
          service: 'geminialt'
        };
      } catch (geminiAltError) {
        console.log('Failed to use Gemini Alt for test, trying Vertex AI:', geminiAltError);
        // ادامه به مرحله بعدی
      }
    }
    
    // آزمایش Vertex AI
    if (activeService === 'vertexai' || activeService === 'geminialt') {
      try {
        const response = await generateVertexAIResponse(prompt, style);
        
        // محاسبه زمان پاسخگویی
        const latency = Date.now() - startTime;
        
        return {
          success: true,
          response,
          latency,
          style,
          service: 'vertexai'
        };
      } catch (vertexError) {
        console.log('Failed to use Vertex AI for test, fallback to Google AI:', vertexError);
        // ادامه به مرحله بعدی
      }
    }
    
    // استفاده از Google AI به عنوان آخرین گزینه
    const response = await generateGoogleAIResponse(prompt, style);
    
    // محاسبه زمان پاسخگویی
    const latency = Date.now() - startTime;
    
    return {
      success: true,
      response,
      latency,
      style,
      service: 'googleai'
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
    const pingWithTimeout = async (pingFunc: () => Promise<number>, service: string, timeout: number = 5000): Promise<number> => {
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
    
    // بررسی سرویس فعال
    const aiSettings = botConfig.getAISettings();
    const activeService = aiSettings.service || 'googleai';
    
    // اگر سرویس فعال GeminiAlt باشد، ابتدا آن را امتحان می‌کنیم
    if (activeService === 'geminialt') {
      try {
        const geminiAltResult = await pingWithTimeout(() => geminiAltService.pingGeminiAlt(), 'geminialt');
        if (geminiAltResult > 0 || geminiAltResult === -429) {
          return geminiAltResult;
        }
        
        // اگر GeminiAlt مشکل داشت، از Vertex AI استفاده می‌کنیم
        console.log('Gemini Alt ping failed, trying Vertex AI');
      } catch (geminiAltError) {
        console.error('Error pinging Gemini Alt:', geminiAltError);
      }
    }
    
    // اگر سرویس فعال Vertex AI باشد یا GeminiAlt خطا داده باشد
    if (activeService === 'vertexai' || activeService === 'geminialt') {
      try {
        const vertexResult = await pingWithTimeout(() => vertexAIService.pingVertexAI(), 'vertexai');
        if (vertexResult > 0 || vertexResult === -429) {
          return vertexResult;
        }
        
        // اگر Vertex AI مشکل داشت، از Google AI استفاده می‌کنیم
        console.log('Vertex AI ping failed, trying Google AI');
      } catch (vertexError) {
        console.error('Error pinging Vertex AI:', vertexError);
      }
    }
    
    // فالبک به Google AI
    return await pingWithTimeout(() => googleAIService.pingGoogleAI(), 'googleai');
  } catch (error) {
    console.error('Error pinging AI services:', error);
    return -1; // خطای نامشخص
  }
}