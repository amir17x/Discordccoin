/**
 * سیستم ثبت آمار و تحلیل استفاده از CCOIN AI
 * این سیستم آمار استفاده کاربران از قابلیت‌های مختلف AI را ثبت و تحلیل می‌کند
 */

import * as fs from 'fs';
import * as path from 'path';
import { log } from '../../vite';
import { AIStats, UsageType } from '../types/aiTypes';

// مسیر ذخیره آمار
const STATS_FILE_PATH = path.join(process.cwd(), 'ai_stats.json');

export type AIFeatureType = 'chat' | 'image_analysis' | 'content_generation' | 'code_assistant' | 'learning_assistant';

// آمار پیش‌فرض برای زمانی که فایل آمار وجود ندارد
const DEFAULT_STATS: AIStats = {
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
  modelStats: {
    'gemini-1.5-pro': 0,
    'gemini-1.5-flash': 0,
    'gemini-pro': 0
  },
  featureStats: {
    chat: 0,
    image_analysis: 0,
    content_generation: 0,
    code_assistant: 0,
    learning_assistant: 0
  },
  averageLatency: 0,
  totalLatency: 0
};

/**
 * ثبت آمار استفاده از سرویس CCOIN AI
 * @param userId شناسه کاربر
 * @param featureType نوع قابلیت مورد استفاده
 * @param responseTime زمان پاسخگویی به میلی‌ثانیه
 * @param modelUsed مدل استفاده شده (اختیاری)
 */
export async function logAIUsage(
  userId: string,
  featureType: AIFeatureType,
  responseTime: number,
  modelUsed?: string
): Promise<void> {
  try {
    // در نسخه واقعی، این آمار در دیتابیس ذخیره می‌شود
    // در این نسخه، فقط آمار کلی را به‌روزرسانی می‌کنیم
    
    log(`ثبت استفاده از CCOIN AI توسط کاربر ${userId} (قابلیت: ${featureType}, زمان: ${responseTime}ms)`, 'info');
    
    // به‌روزرسانی آمار کلی
    updateGlobalAIStats(featureType, responseTime, modelUsed);
    
    // در نسخه واقعی، آمار کاربر نیز به‌روزرسانی می‌شود
    // به عنوان مثال:
    // await updateUserAIStats(userId, featureType, responseTime);
  } catch (error) {
    log(`خطا در ثبت آمار استفاده از CCOIN AI: ${error}`, 'error');
  }
}

/**
 * به‌روزرسانی آمار کلی سیستم CCOIN AI
 * @param featureType نوع قابلیت مورد استفاده
 * @param responseTime زمان پاسخگویی به میلی‌ثانیه
 * @param modelUsed مدل استفاده شده (اختیاری)
 */
function updateGlobalAIStats(
  featureType: AIFeatureType,
  responseTime: number,
  modelUsed?: string
): void {
  try {
    // بارگذاری آمار فعلی
    const stats = loadAIStats();
    
    // به‌روزرسانی آمار عمومی
    stats.requestCount += 1;
    stats.lastUsed = new Date().toISOString();
    stats.providerStats.ccoinai = (stats.providerStats.ccoinai || 0) + 1;
    
    // به‌روزرسانی آمار استفاده براساس نوع
    const usageType = featureTypeToUsageType(featureType);
    stats.usageCounts[usageType] += 1;
    
    // به‌روزرسانی آمار مدل استفاده شده
    if (modelUsed && stats.modelStats) {
      stats.modelStats[modelUsed] = (stats.modelStats[modelUsed] || 0) + 1;
    }
    
    // به‌روزرسانی آمار نوع قابلیت
    if (stats.featureStats) {
      stats.featureStats[featureType] = (stats.featureStats[featureType] || 0) + 1;
    }
    
    // به‌روزرسانی آمار زمان پاسخگویی
    stats.totalLatency += responseTime;
    stats.averageLatency = stats.totalLatency / stats.requestCount;
    
    // ذخیره آمار به‌روزشده
    saveAIStats(stats);
    
  } catch (error) {
    log(`خطا در به‌روزرسانی آمار کلی CCOIN AI: ${error}`, 'error');
  }
}

/**
 * بارگذاری آمار استفاده از سرویس‌های هوش مصنوعی
 * @returns آمار هوش مصنوعی
 */
export function loadAIStats(): AIStats {
  try {
    // بررسی وجود فایل آمار
    if (fs.existsSync(STATS_FILE_PATH)) {
      // خواندن و پارس کردن فایل
      const fileContent = fs.readFileSync(STATS_FILE_PATH, 'utf-8');
      const stats = JSON.parse(fileContent) as AIStats;
      
      // اطمینان از کامل بودن ساختار آمار
      return {
        ...DEFAULT_STATS,
        ...stats
      };
    }
    
    // اگر فایل وجود نداشت، آمار پیش‌فرض را برمی‌گردانیم
    return { ...DEFAULT_STATS };
    
  } catch (error) {
    log(`خطا در بارگذاری آمار CCOIN AI: ${error}`, 'error');
    // در صورت خطا، آمار پیش‌فرض را برمی‌گردانیم
    return { ...DEFAULT_STATS };
  }
}

/**
 * ذخیره آمار استفاده از سرویس‌های هوش مصنوعی
 * @param stats آمار به‌روزشده
 */
function saveAIStats(stats: AIStats): void {
  try {
    // تبدیل آمار به JSON با فرمت خوانا
    const jsonStats = JSON.stringify(stats, null, 2);
    
    // ذخیره در فایل
    fs.writeFileSync(STATS_FILE_PATH, jsonStats, 'utf-8');
    
  } catch (error) {
    log(`خطا در ذخیره آمار CCOIN AI: ${error}`, 'error');
  }
}

/**
 * تبدیل نوع قابلیت به نوع استفاده برای آمار کلی
 * @param featureType نوع قابلیت
 * @returns نوع استفاده برای آمار کلی
 */
function featureTypeToUsageType(
  featureType: AIFeatureType
): UsageType {
  switch (featureType) {
    case 'chat':
      return 'aiAssistant';
    case 'image_analysis':
      return 'marketAnalysis';
    case 'content_generation':
      return 'statusMessages';
    case 'code_assistant':
      return 'aiAssistant';
    case 'learning_assistant':
      return 'questStories';
    default:
      return 'other';
  }
}

/**
 * دریافت آمار استفاده از CCOIN AI
 * @returns آمار کلی سیستم
 */
export function getAIUsageStats(): {
  totalRequests: number;
  averageLatency: number;
  popularFeatures: Record<string, number>;
  modelsUsage: Record<string, number>;
} {
  const stats = loadAIStats();
  
  return {
    totalRequests: stats.requestCount,
    averageLatency: parseFloat(stats.averageLatency.toFixed(2)),
    popularFeatures: stats.featureStats || {},
    modelsUsage: stats.modelStats || {}
  };
}

/**
 * دریافت آمار استفاده کاربر از CCOIN AI
 * @param userId شناسه کاربر
 * @returns آمار استفاده کاربر
 */
export async function getUserAIStats(userId: string): Promise<{
  totalUsage: number;
  lastUsed: string | null;
  favoriteFeatures: string[];
}> {
  try {
    // در نسخه واقعی، این اطلاعات از دیتابیس بازیابی می‌شود
    // در اینجا داده‌های ساختگی برمی‌گردانیم
    
    return {
      totalUsage: 15,
      lastUsed: new Date().toISOString(),
      favoriteFeatures: ['chat', 'content_generation']
    };
    
  } catch (error) {
    log(`خطا در دریافت آمار استفاده کاربر از CCOIN AI: ${error}`, 'error');
    
    return {
      totalUsage: 0,
      lastUsed: null,
      favoriteFeatures: []
    };
  }
}

/**
 * دریافت گزارش عملکرد ماهانه سیستم CCOIN AI
 * @returns گزارش عملکرد ماهانه
 */
export function getMonthlyAIReport(): {
  requestsCount: number;
  userCount: number;
  averageResponseTime: number;
  topFeatures: string[];
} {
  try {
    const stats = loadAIStats();
    
    // در نسخه واقعی، این اطلاعات از دیتابیس محاسبه می‌شود
    return {
      requestsCount: stats.requestCount,
      userCount: 0, // در نسخه واقعی از دیتابیس استخراج می‌شود
      averageResponseTime: parseFloat(stats.averageLatency.toFixed(2)),
      topFeatures: getTopFeatures(stats)
    };
    
  } catch (error) {
    log(`خطا در تهیه گزارش ماهانه CCOIN AI: ${error}`, 'error');
    
    return {
      requestsCount: 0,
      userCount: 0,
      averageResponseTime: 0,
      topFeatures: []
    };
  }
}

/**
 * دریافت لیست پرکاربردترین قابلیت‌ها
 * @param stats آمار سیستم
 * @returns لیست پرکاربردترین قابلیت‌ها
 */
function getTopFeatures(stats: AIStats): string[] {
  if (!stats.featureStats) {
    return [];
  }
  
  // تبدیل فیچرها به آرایه
  const features: Array<[string, number]> = Object.entries(stats.featureStats || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number));
  
  // بازگرداندن سه قابلیت پرکاربرد
  return features.slice(0, 3).map(([feature]) => feature);
}