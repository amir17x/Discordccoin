import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BotConfigManager, BotConfig } from '../utils/config';
import { botConfig } from '../utils/config';
import { generateHuggingFaceResponse } from './huggingface';
import { generateOpenAIResponse } from './chatgpt';

// دریافت مسیر کنونی فایل
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// مسیر فایل آمار استفاده از سرویس‌های هوش مصنوعی
const AI_STATS_FILE = path.join(__dirname, '../../../ai_stats.json');

// فرمت داده‌های آماری
interface AIStats {
  service: 'openai' | 'huggingface';
  lastUsed: string | null;
  requestCount: number;
  providerStats: {
    openai: number;
    huggingface: number;
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
  service: botConfig.ai?.service || 'huggingface',
  lastUsed: null,
  requestCount: 0,
  providerStats: {
    openai: 0,
    huggingface: 0
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
export function switchAIProvider(service: 'openai' | 'huggingface'): boolean {
  try {
    // بروزرسانی تنظیمات ربات
    const configManager = new BotConfigManager();
    
    if (!botConfig.ai) {
      botConfig.ai = {
        service: service,
        openaiModel: 'gpt-3.5-turbo',
        huggingfaceModel: 'MBZUAI/LaMini-Flan-T5-783M'
      };
    } else {
      botConfig.ai.service = service;
    }
    
    // ذخیره تنظیمات در فایل
    configManager.saveConfig();
    
    // بروزرسانی آمار
    const stats = loadAIStats();
    stats.service = service;
    saveAIStats(stats);
    
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
    if (botConfig.ai?.service === 'openai') {
      stats.providerStats.openai++;
    } else {
      stats.providerStats.huggingface++;
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
    if (botConfig.ai?.service === 'openai') {
      response = await generateOpenAIResponse(prompt);
    } else {
      response = await generateHuggingFaceResponse(prompt);
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
    if (botConfig.ai?.service === 'openai') {
      response = await generateOpenAIResponse(prompt);
    } else {
      response = await generateHuggingFaceResponse(prompt);
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