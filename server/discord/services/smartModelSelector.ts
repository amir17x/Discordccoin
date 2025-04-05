/**
 * سیستم انتخاب هوشمند مدل مناسب برای درخواست‌های هوش مصنوعی
 * این سیستم براساس پیچیدگی درخواست، بهترین مدل را انتخاب می‌کند
 */

import { log } from '../../vite';
import ccoinAIService from './ccoinAIService';

export type ComplexityLevel = 'high' | 'medium' | 'low';

export type ModelType = 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-pro' | 'tuned-model';

// کلیدواژه‌هایی که نشان‌دهنده پیچیدگی بالا هستند
const HIGH_COMPLEXITY_KEYWORDS = [
  'explain', 'analyze', 'compare', 'contrast', 'evaluate', 
  'research', 'توضیح', 'تحلیل', 'آنالیز', 'بررسی', 'مقایسه',
  'detail', 'comprehensive', 'complex', 'جزئیات', 'کامل', 'پیچیده',
  'technical', 'فنی', 'تخصصی', 'code', 'programming', 'برنامه‌نویسی', 'کد',
  'develop', 'create', 'توسعه', 'ساخت', 'ایجاد'
];

// کلیدواژه‌هایی که نشان‌دهنده پیچیدگی متوسط هستند
const MEDIUM_COMPLEXITY_KEYWORDS = [
  'summarize', 'describe', 'خلاصه', 'توصیف', 'شرح',
  'define', 'تعریف', 'history', 'تاریخچه', 'story', 'داستان',
  'guide', 'راهنما', 'howto', 'آموزش', 'چگونه', 'چطور'
];

/**
 * تولید پاسخ با استفاده از مدل هوشمند متناسب با پیچیدگی درخواست
 * @param prompt پرامپت ورودی
 * @param maxTokens حداکثر تعداد توکن‌های خروجی
 * @param temperature دمای تولید پاسخ
 * @returns پاسخ تولید شده
 */
export async function generateContentWithSmartModel(
  prompt: string,
  maxTokens: number = 1000,
  temperature: number = 0.7,
  userId?: string,
  preferTunedModel: boolean = false
): Promise<string> {
  // تشخیص اگر درخواست مربوط به سوالات CCoin باشد
  const isCCoinQuestion = detectCCoinRelatedQuery(prompt);
  
  // اگر درخواست مربوط به CCoin است و مدل آموزش‌دیده در دسترس است، از آن استفاده می‌کنیم
  if ((isCCoinQuestion || preferTunedModel) && ccoinAIService.hasTunedModelAvailable()) {
    log(`استفاده از مدل آموزش‌دیده CCOIN AI برای درخواست مرتبط با CCoin 🔮`, 'info');
    return await ccoinAIService.generateContentWithTunedModel(prompt, maxTokens, 
      Math.min(temperature, 0.3), // محدود کردن temperature برای پاسخ‌های دقیق‌تر
      userId
    );
  }
  
  // تخمین پیچیدگی درخواست
  const complexity = estimatePromptComplexity(prompt);
  
  // انتخاب مدل مناسب براساس پیچیدگی
  let modelName: ModelType;
  
  switch (complexity) {
    case 'high':
      modelName = 'gemini-1.5-pro';
      log(`استفاده از مدل پیشرفته (${modelName}) برای درخواست پیچیده 🧠`, 'info');
      break;
    case 'medium':
      if (prompt.length > 200) {
        modelName = 'gemini-1.5-pro';
        log(`استفاده از مدل پیشرفته (${modelName}) برای درخواست متوسط اما بلند 📝`, 'info');
      } else {
        modelName = 'gemini-1.5-flash';
        log(`استفاده از مدل سریع (${modelName}) برای درخواست متوسط 📝`, 'info');
      }
      break;
    case 'low':
    default:
      modelName = 'gemini-1.5-flash';
      log(`استفاده از مدل سریع (${modelName}) برای درخواست ساده ⚡`, 'info');
      break;
  }
  
  // استفاده از مدل انتخاب شده برای تولید پاسخ
  try {
    if (modelName === 'gemini-1.5-flash') {
      // از متد سریع استفاده می‌کنیم
      return await ccoinAIService.generateContentFast(prompt, maxTokens, userId);
    } else {
      // از متد استاندارد استفاده می‌کنیم
      return await ccoinAIService.generateContent(prompt, maxTokens, temperature, userId);
    }
  } catch (error) {
    log(`خطا در استفاده از مدل هوشمند (${modelName}): ${error}`, 'error');
    // در صورت خطا، به مدل پیش‌فرض برمی‌گردیم
    return await ccoinAIService.generateContent(prompt, maxTokens, temperature, userId);
  }
}

/**
 * تشخیص اینکه آیا درخواست مربوط به CCoin است
 * @param prompt متن ورودی
 * @returns آیا درخواست مربوط به CCoin است
 */
function detectCCoinRelatedQuery(prompt: string): boolean {
  const normalizedPrompt = prompt.toLowerCase();
  
  // کلیدواژه‌های مرتبط با CCoin
  const ccoinKeywords = [
    'ccoin', 'c-coin', 'سی-کوین', 'سی کوین', 'سکه',
    'دستور', 'کامند', 'command', '/daily', '/work', '/profile',
    'چت ناشناس', 'anonymous chat', 'بلک جک', 'blackjack',
    'روبری', 'robbery', 'دوئل', 'duel', 'سطح', 'level',
    'کلن', 'clan', 'دوست', 'friend', 'بازی', 'گیم',
    'مینی گیم', 'minigame', 'ربات دیسکورد', 'discord bot'
  ];
  
  // بررسی حضور کلیدواژه‌ها در پرامپت
  for (const keyword of ccoinKeywords) {
    if (normalizedPrompt.includes(keyword)) {
      return true;
    }
  }
  
  // بررسی اگر درخواست شبیه به یک سوال راهنما درباره ربات باشد
  if (
    (normalizedPrompt.includes('چطور') || normalizedPrompt.includes('چگونه') || 
     normalizedPrompt.includes('how') || normalizedPrompt.includes('what')) &&
    (normalizedPrompt.includes('ربات') || normalizedPrompt.includes('bot') || 
     normalizedPrompt.includes('کار') || normalizedPrompt.includes('استفاده') ||
     normalizedPrompt.includes('use') || normalizedPrompt.includes('work'))
  ) {
    return true;
  }
  
  return false;
}

/**
 * تخمین پیچیدگی پرامپت برای انتخاب مدل مناسب
 * @param prompt پرامپت ورودی
 * @returns سطح پیچیدگی (high, medium, low)
 */
export function estimatePromptComplexity(prompt: string): ComplexityLevel {
  const normalizedPrompt = prompt.toLowerCase();
  
  // بررسی طول پرامپت
  if (prompt.length > 500) {
    return 'high';
  }
  
  // بررسی کلیدواژه‌ها برای پیچیدگی بالا
  for (const keyword of HIGH_COMPLEXITY_KEYWORDS) {
    if (normalizedPrompt.includes(keyword.toLowerCase())) {
      return 'high';
    }
  }
  
  // بررسی کلیدواژه‌ها برای پیچیدگی متوسط
  for (const keyword of MEDIUM_COMPLEXITY_KEYWORDS) {
    if (normalizedPrompt.includes(keyword.toLowerCase())) {
      return 'medium';
    }
  }
  
  // بررسی تعداد سوالات
  const questionMarks = (prompt.match(/\?/g) || []).length;
  if (questionMarks > 2) {
    return 'medium';
  }
  
  // بررسی پیچیدگی جملات
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = prompt.split(/\s+/).length / Math.max(1, sentences.length);
  
  if (avgWordsPerSentence > 15) {
    return 'medium';
  }
  
  // پیش‌فرض: پیچیدگی کم
  return 'low';
}

/**
 * پیشنهاد مدل مناسب براساس پیچیدگی پرامپت
 * @param prompt پرامپت ورودی
 * @returns نام مدل پیشنهادی
 */
export function suggestModelForPrompt(prompt: string): ModelType {
  // اگر سوال مرتبط با CCoin است و مدل آموزش‌دیده در دسترس است، آن را پیشنهاد می‌دهیم
  if (detectCCoinRelatedQuery(prompt) && ccoinAIService.hasTunedModelAvailable()) {
    return 'tuned-model';
  }
  
  const complexity = estimatePromptComplexity(prompt);
  
  switch (complexity) {
    case 'high':
      return 'gemini-1.5-pro';
    case 'medium':
      return prompt.length > 200 ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
    case 'low':
    default:
      return 'gemini-1.5-flash';
  }
}