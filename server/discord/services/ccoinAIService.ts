import { GoogleGenerativeAI } from '@google/generative-ai';
import { log } from '../../vite';
import { botConfig } from '../utils/config';
import axios from 'axios';
import aiCache from './aiCache';
import { logAIUsage } from './aiAnalytics';
import { checkAIAccess } from './aiAccessManager';
import { ModelType } from './smartModelSelector';

// Using CCOIN_AI_API_KEY for authentication to our AI service
const CCOIN_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.CCOIN_AI_API_KEY;
const CCOIN_AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// تعداد تلاش‌های مجدد برای درخواست‌ها
const MAX_RETRIES = 2;
// فاصله بین هر تلاش (میلی‌ثانیه)
const RETRY_DELAY = 300;
// زمان timeout برای درخواست‌ها (میلی‌ثانیه)
const REQUEST_TIMEOUT = 8000;

/**
 * سرویس CCOIN AI با استفاده از SDK گوگل با بهینه‌سازی‌های جدید
 * این سرویس از کتابخانه رسمی @google/generative-ai استفاده می‌کند
 * همچنین از درخواست‌های REST مستقیم با کش و تلاش مجدد پشتیبانی می‌کند
 */
class OptimizedCcoinAIService {
  private apiKey: string;
  private genAI: any;
  private model: any;
  private visionModel: any;
  private proModel: any;
  
  constructor() {
    this.apiKey = CCOIN_AI_API_KEY || '';
    
    // مقداردهی اولیه
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      
      // ایجاد مدل‌ها از ابتدا برای جلوگیری از ایجاد مکرر
      // مدل سریع برای درخواست‌های ساده
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "تو دستیار هوشمند CCOIN AI برای بازی Ccoin هستی. همیشه پاسخ‌های کوتاه، دقیق و مفید می‌دهی."
      });
      
      // مدل پیشرفته برای درخواست‌های پیچیده
      this.proModel = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        systemInstruction: "تو دستیار هوشمند CCOIN AI برای بازی Ccoin هستی. پاسخ‌های کامل و جامع می‌دهی."
      });
      
      // مدل برای تصاویر (همان مدل پیشرفته)
      this.visionModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // پاکسازی کش در زمان راه‌اندازی
      aiCache.cleanExpired();
      
      log('سرویس CCOIN AI با موفقیت راه‌اندازی شد', 'info');
    } else {
      log('سرویس CCOIN AI: کلید API تنظیم نشده است', 'warn');
    }
  }
  
  /**
   * بررسی و بازیابی پاسخ از کش
   * @param key کلید کش
   * @returns پاسخ کش شده یا null
   */
  private getCachedResponse(key: string): string | null {
    // از کش سینگلتون جدید استفاده می‌کنیم که در فایل جداگانه تعریف شده
    const parts = key.split('_');
    if (parts.length >= 3) {
      const prompt = parts[0];
      const maxTokens = parseInt(parts[1], 10);
      const temperature = parseFloat(parts[2]);
      return aiCache.get(prompt, temperature, maxTokens);
    }
    return null;
  }
  
  /**
   * افزودن پاسخ به کش
   * @param key کلید کش
   * @param response پاسخ برای ذخیره
   */
  private cacheResponse(key: string, response: string): void {
    // از کش سینگلتون جدید استفاده می‌کنیم که در فایل جداگانه تعریف شده
    const parts = key.split('_');
    if (parts.length >= 3) {
      const prompt = parts[0];
      const maxTokens = parseInt(parts[1], 10);
      const temperature = parseFloat(parts[2]);
      aiCache.set(prompt, response, temperature, maxTokens);
    }
  }
  
  /**
   * ایجاد یک کلید کش بر اساس پارامترهای درخواست
   */
  private createCacheKey(prompt: string, maxTokens: number, temperature: number): string {
    return `${prompt}_${maxTokens}_${temperature}`;
  }
  
  /**
   * تاخیر برای مدت مشخص
   * @param ms میلی‌ثانیه
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * ارسال درخواست به CCOIN AI با پشتیبانی از کش و تلاش مجدد
   * @param prompt متن ورودی
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @param userId شناسه کاربر (اختیاری)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContent(
    prompt: string, 
    maxTokens: number = 1000, 
    temperature: number = 0.7,
    userId?: string
  ): Promise<string> {
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    // اگر شناسه کاربر ارائه شده، دسترسی را بررسی می‌کنیم
    if (userId) {
      const hasAccess = await checkAIAccess(userId);
      if (!hasAccess) {
        throw new Error('شما دسترسی کافی به CCOIN AI ندارید');
      }
    }
    
    // بررسی کش برای درخواست‌های تکراری
    const cachedResponse = aiCache.get(prompt, temperature, maxTokens);
    if (cachedResponse) {
      log(`پاسخ از کش بازیابی شد: ${prompt.substring(0, 20)}...`, 'info');
      
      // ثبت آمار استفاده از کش (زمان پاسخگویی صفر)
      if (userId) {
        logAIUsage(userId, 'chat', 0, 'cache');
      }
      
      return cachedResponse;
    }
    
    try {
      log(`ارسال درخواست به CCOIN AI: ${prompt.substring(0, 50)}...`, 'info');
      
      const startTime = Date.now();
      
      // تلاش‌های مجدد برای افزایش اطمینان از پاسخگویی
      let lastError: any = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          // اگر تلاش مجدد است، کمی تاخیر ایجاد کنیم
          if (attempt > 0) {
            await this.delay(RETRY_DELAY * attempt);
            log(`تلاش مجدد ${attempt} از ${MAX_RETRIES}...`, 'info');
          }
          
          // تصمیم‌گیری در مورد استفاده از مدل پیشرفته یا سریع
          let targetModel = this.model;
          let modelName: ModelType = 'gemini-1.5-flash';
          
          // اگر درخواست طولانی یا پیچیده است از مدل پیشرفته استفاده می‌کنیم
          if (prompt.length > 500 || temperature > 0.8 || maxTokens > 1500) {
            targetModel = this.proModel;
            modelName = 'gemini-1.5-pro';
            log(`استفاده از مدل پیشرفته (${modelName}) برای درخواست پیچیده`, 'info');
          }
          
          // استفاده از مدل SDK با تنظیمات بهینه
          const result = await targetModel.generateContent(prompt, {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.9,  // افزایش تنوع خروجی
            topK: 40
          });
          
          const response = await result.response;
          const generatedText = response.text();
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          log(`پاسخ از CCOIN AI دریافت شد (${generatedText.length} کاراکتر, ${responseTime}ms) ✨`, 'info');
          
          // ذخیره پاسخ در کش برای استفاده آینده
          aiCache.set(prompt, generatedText, temperature, maxTokens);
          
          // ثبت آمار استفاده
          if (userId) {
            logAIUsage(userId, 'chat', responseTime, modelName);
          }
          
          return generatedText;
        } catch (error: any) {
          lastError = error;
          // اگر خطا موقتی باشد، تلاش مجدد می‌کنیم
          if (!error.message.includes('API key') && 
              (error.message.includes('429') || 
               error.message.includes('500') || 
               error.message.includes('timeout'))) {
            continue;
          } else {
            // خطای دائمی، تلاش مجدد نمی‌کنیم
            throw error;
          }
        }
      }
      
      // اگر به اینجا رسیدیم، یعنی همه تلاش‌ها ناموفق بوده‌اند
      throw lastError;
      
    } catch (error: any) {
      log('خطا در فراخوانی سرویس CCOIN AI: ' + error, 'error');
      
      // پردازش خطاهای خاص
      if (error.message.includes('API key')) {
        throw new Error('خطای احراز هویت در سرویس CCOIN AI: کلید API نامعتبر است');
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        throw new Error('محدودیت نرخ سرویس CCOIN AI: تعداد درخواست‌ها بیش از حد مجاز است');
      } else if (error.message.includes('500') || error.message.includes('server')) {
        throw new Error(`خطای سرور سرویس CCOIN AI: ${error.message}`);
      }
      
      throw new Error(`خطا در سرویس CCOIN AI: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    }
  }
  
  /**
   * ارسال درخواست به API REST مستقیم CCOIN AI برای سرعت بیشتر
   * استفاده شده برای درخواست‌های ساده و کوتاه
   * @param prompt متن ورودی
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param userId شناسه کاربر (اختیاری)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContentFast(
    prompt: string, 
    maxTokens: number = 100,
    userId?: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    // اگر شناسه کاربر ارائه شده، دسترسی را بررسی می‌کنیم
    if (userId) {
      const hasAccess = await checkAIAccess(userId);
      if (!hasAccess) {
        throw new Error('شما دسترسی کافی به CCOIN AI ندارید');
      }
    }
    
    // بررسی کش برای درخواست‌های تکراری
    const temperature = 0.2; // دمای پایین برای پاسخ‌های سریع و قطعی
    const cachedResponse = aiCache.get(prompt, temperature, maxTokens);
    if (cachedResponse) {
      log(`پاسخ سریع از کش بازیابی شد: ${prompt.substring(0, 20)}...`, 'info');
      
      // ثبت آمار استفاده از کش (زمان پاسخگویی صفر)
      if (userId) {
        logAIUsage(userId, 'chat', 0, 'cache');
      }
      
      return cachedResponse;
    }
    
    try {
      log(`ارسال درخواست سریع به CCOIN AI: ${prompt.substring(0, 50)}...`, 'info');
      
      const startTime = Date.now();
      const response = await axios.post(
        `${CCOIN_AI_BASE_URL}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.9,
            topK: 16
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: REQUEST_TIMEOUT
        }
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const text = response.data.candidates[0].content.parts[0].text;
        log(`پاسخ سریع از CCOIN AI دریافت شد (${text.length} کاراکتر، ${responseTime}ms) ⚡`, 'info');
        
        // ذخیره پاسخ در کش
        aiCache.set(prompt, text, temperature, maxTokens);
        
        // ثبت آمار استفاده
        if (userId) {
          logAIUsage(userId, 'chat', responseTime, 'gemini-1.5-flash');
        }
        
        return text;
      } else {
        throw new Error('ساختار پاسخ نامعتبر است');
      }
      
    } catch (error: any) {
      log('خطا در فراخوانی سریع سرویس CCOIN AI: ' + error, 'error');
      
      // fallback به روش معمولی
      return this.generateContent(prompt, maxTokens, 0.2, userId);
    }
  }
  
  /**
   * ارسال درخواست متنی و تصویری به CCOIN AI (multimodal)
   * @param textPrompt متن ورودی
   * @param imageBase64 تصویر به صورت رشته base64
   * @param mimeType نوع فایل تصویر (مثلاً 'image/jpeg')
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @param userId شناسه کاربر (اختیاری)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContentWithImage(
    textPrompt: string,
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    maxTokens: number = 1000,
    temperature: number = 0.7,
    userId?: string
  ): Promise<string> {
    if (!this.apiKey || !this.visionModel) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    // اگر شناسه کاربر ارائه شده، دسترسی را بررسی می‌کنیم
    if (userId) {
      const hasAccess = await checkAIAccess(userId);
      if (!hasAccess) {
        throw new Error('شما دسترسی کافی به تحلیل تصویر CCOIN AI ندارید');
      }
    }
    
    try {
      log(`ارسال درخواست چندرسانه‌ای به CCOIN AI: ${textPrompt.substring(0, 50)}...`, 'info');
      
      const startTime = Date.now();
      
      // ایجاد اجزای درخواست مطابق با مستندات
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType
        }
      };
      
      // تلاش‌های مجدد برای افزایش اطمینان از پاسخگویی
      let lastError: any = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          // اگر تلاش مجدد است، کمی تاخیر ایجاد کنیم
          if (attempt > 0) {
            await this.delay(RETRY_DELAY * attempt);
            log(`تلاش مجدد ${attempt} از ${MAX_RETRIES}...`, 'info');
          }
          
          // ارسال درخواست به صورت آرایه‌ای از اجزا
          const result = await (this.visionModel as any).generateContent([textPrompt, imagePart], {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.9,
            topK: 40
          });
          
          const response = await result.response;
          const generatedText = response.text();
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          log(`پاسخ چندرسانه‌ای از CCOIN AI دریافت شد (${generatedText.length} کاراکتر, ${responseTime}ms) ✨`, 'info');
          
          // ثبت آمار استفاده
          if (userId) {
            logAIUsage(userId, 'image_analysis', responseTime, 'gemini-1.5-pro');
          }
          
          return generatedText;
        } catch (error: any) {
          lastError = error;
          // اگر خطا موقتی باشد، تلاش مجدد می‌کنیم
          if (!error.message.includes('API key') && 
              (error.message.includes('429') || 
               error.message.includes('500') || 
               error.message.includes('timeout'))) {
            continue;
          } else {
            // خطای دائمی، تلاش مجدد نمی‌کنیم
            throw error;
          }
        }
      }
      
      // اگر به اینجا رسیدیم، یعنی همه تلاش‌ها ناموفق بوده‌اند
      throw lastError;
      
    } catch (error: any) {
      log('خطا در فراخوانی چندرسانه‌ای سرویس CCOIN AI: ' + error, 'error');
      throw new Error(`خطا در سرویس چندرسانه‌ای CCOIN AI: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    }
  }
  
  /**
   * ایجاد یک چت با حافظه
   * @returns شیء چت برای تعاملات مداوم
   */
  createChat() {
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    try {
      const chat = this.model.startChat({
        history: [],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.9,
          topK: 40
        }
      });
      
      return chat;
    } catch (error) {
      log('خطا در ایجاد چت CCOIN AI: ' + error, 'error');
      throw new Error(`خطا در ایجاد چت CCOIN AI: ${error instanceof Error ? (error as Error).message : 'خطای ناشناخته'}`);
    }
  }
  
  /**
   * بررسی اینکه آیا سرویس قابل استفاده است یا خیر
   * @returns وضعیت سرویس
   */
  isAvailable(): boolean {
    return !!this.apiKey && !!this.model;
  }
  
  /**
   * آزمایش اتصال به سرویس
   */
  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      await this.generateContentFast('1+1', 10);
      const endTime = Date.now();
      log(`تست اتصال CCOIN AI موفقیت‌آمیز بود (${endTime - startTime}ms) ✨`, 'info');
      return true;
    } catch (error) {
      log('تست اتصال سرویس CCOIN AI با شکست مواجه شد: ' + error, 'error');
      return false;
    }
  }
  
  /**
   * پاکسازی کش برای آزاد کردن حافظه
   */
  clearCache(): void {
    try {
      const size = aiCache.size();
      aiCache.clear();
      log(`کش سرویس CCOIN AI پاکسازی شد (${size} آیتم)`, 'info');
    } catch (error) {
      log(`خطا در پاکسازی کش CCOIN AI: ${error}`, 'error');
    }
  }
}

// نمونه‌سازی از سرویس
const ccoinAIService = new OptimizedCcoinAIService();
export default ccoinAIService;

// صادر کردن کلاس با نام مناسب برای استفاده در جاهایی که نیاز به نمونه‌سازی جدید است
export { OptimizedCcoinAIService as CcoinAIService };