import path from 'path';
import fs from 'fs';
import { botConfig } from '../utils/config';
import { generateOpenAIResponse, openAIService } from './chatgpt';
import { generateHuggingFaceResponse, huggingFaceService } from './huggingface';
import { generateGoogleAIResponse, googleAIService } from './googleai';
import { generateGrokResponse, grokService } from './grok';
import { generateOpenRouterResponse, openRouterService } from './openrouter';

// مسیر فایل آمار هوش مصنوعی
const AI_STATS_FILE = path.resolve(process.cwd(), 'ai_stats.json');

// تعریف انواع سرویس‌های هوش مصنوعی
export type AIService = 'openai' | 'huggingface' | 'googleai' | 'grok' | 'openrouter';

// ساختار داده آمار هوش مصنوعی
interface AIStats {
  service: AIService;
  lastUsed: string | null;
  requestCount: number;
  providerStats: {
    openai: number;
    huggingface: number;
    googleai: number;
    grok: number;
    openrouter: number;
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
  service: botConfig.getActiveAIService() as AIService,
  lastUsed: null,
  requestCount: 0,
  providerStats: {
    openai: 0,
    huggingface: 0,
    googleai: 0,
    grok: 0,
    openrouter: 0
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
    
    // بروزرسانی آمار سرویس
    const service = botConfig.getActiveAIService() as AIService;
    switch(service) {
      case 'openai':
        stats.providerStats.openai++;
        break;
      case 'huggingface':
        stats.providerStats.huggingface++;
        break;
      case 'googleai':
        stats.providerStats.googleai++;
        break;
      case 'grok':
        stats.providerStats.grok++;
        break;
      case 'openrouter':
        stats.providerStats.openrouter++;
        break;
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
 * @returns پاسخ تولید شده
 */
export async function generateAIResponse(
  prompt: string,
  usageType: 'statusMessages' | 'marketAnalysis' | 'questStories' | 'aiAssistant' | 'other' = 'other'
): Promise<string> {
  try {
    const startTime = Date.now();
    let response: string;
    
    // انتخاب سرویس مناسب
    const aiSettings = botConfig.getAISettings();
    switch (aiSettings.service) {
      case 'openai':
        response = await generateOpenAIResponse(prompt);
        break;
      case 'googleai':
        response = await generateGoogleAIResponse(prompt);
        break;
      case 'grok':
        response = await generateGrokResponse(prompt);
        break;
      case 'openrouter':
        response = await generateOpenRouterResponse(prompt);
        break;
      default:
        // Hugging Face as default
        response = await generateHuggingFaceResponse(prompt);
        break;
    }
    
    // محاسبه زمان پاسخگویی
    const latency = Date.now() - startTime;
    
    // بروزرسانی آمار
    updateAIStats(usageType, latency);
    
    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'متأسفانه در تولید پاسخ هوش مصنوعی خطایی رخ داد.';
  }
}

/**
 * تست سرویس هوش مصنوعی با یک پرامپت ساده
 * @param prompt پرامپت تست
 * @returns نتیجه تست
 */
export async function testAIService(prompt: string = 'سلام. حالت چطوره؟'): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  latency: number;
}> {
  try {
    const startTime = Date.now();
    let response: string;
    
    // انتخاب سرویس مناسب
    const aiSettings = botConfig.getAISettings();
    switch (aiSettings.service) {
      case 'openai':
        response = await generateOpenAIResponse(prompt);
        break;
      case 'googleai':
        response = await generateGoogleAIResponse(prompt);
        break;
      case 'grok':
        response = await generateGrokResponse(prompt);
        break;
      case 'openrouter':
        response = await generateOpenRouterResponse(prompt);
        break;
      default:
        // Hugging Face as default
        response = await generateHuggingFaceResponse(prompt);
        break;
    }
    
    // محاسبه زمان پاسخگویی
    const latency = Date.now() - startTime;
    
    return {
      success: true,
      response,
      latency
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
    // انتخاب سرویس مناسب بر اساس تنظیمات فعلی
    const service = botConfig.getActiveAIService() as AIService;
    
    switch (service) {
      case 'openai':
        return await openAIService.pingOpenAI();
      
      case 'googleai':
        return await googleAIService.pingGoogleAI();
      
      case 'grok':
        return await grokService.pingGrok();
      
      case 'openrouter':
        return await openRouterService.pingOpenRouter();
      
      case 'huggingface':
      default:
        return await huggingFaceService.pingHuggingFace();
    }
  } catch (error) {
    console.error('Error pinging AI service:', error);
    return -1; // خطای نامشخص
  }
}