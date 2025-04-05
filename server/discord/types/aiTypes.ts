/**
 * تعاریف تایپ‌های مرتبط با سیستم هوش مصنوعی CCOIN AI
 */

/**
 * تعریف انواع سرویس‌های هوش مصنوعی
 * فعلاً فقط ccoinai به عنوان سرویس معتبر پذیرفته می‌شود
 */
export type AIService = 'ccoinai';

/**
 * تعریف انواع استفاده از هوش مصنوعی برای ثبت آمار
 */
export type UsageType = 'statusMessages' | 'marketAnalysis' | 'questStories' | 'aiAssistant' | 'other';

/**
 * ساختار آمار استفاده از هوش مصنوعی
 */
export interface AIStats {
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
  modelStats?: Record<string, number>;
  featureStats?: {
    chat: number;
    image_analysis: number;
    content_generation: number;
    code_assistant: number;
    learning_assistant: number;
  };
  averageLatency: number;
  totalLatency: number;
}

/**
 * تنظیمات هوش مصنوعی کاربر
 */
export interface UserAISettings {
  responseStyle?: 'متعادل' | 'خلاقانه' | 'دقیق' | 'طنزآمیز';
  preferredModel?: string;
  language?: 'fa' | 'en';
  usageLimit?: number;
  currentUsage?: number;
  lastReset?: string;
}

/**
 * آمار استفاده از هوش مصنوعی برای کاربر
 */
export interface UserAIStats {
  totalUsage: number;
  featureUsage: {
    chat: number;
    image_analysis: number;
    content_generation: number;
    code_assistant: number;
    learning_assistant: number;
  };
  lastUsed: string | null;
  averageResponseTime: number;
  totalResponseTime: number;
  freeUsagesRemaining?: number;
}