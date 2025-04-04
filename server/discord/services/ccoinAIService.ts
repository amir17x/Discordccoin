import { GoogleGenerativeAI } from '@google/generative-ai';
import { log } from '../../vite';
import { botConfig } from '../utils/config';
import axios from 'axios';

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
  // کش برای پاسخ‌های متداول
  private responseCache: Map<string, { response: string, timestamp: number }>;
  // زمان انقضای کش (30 دقیقه)
  private CACHE_EXPIRY = 30 * 60 * 1000;
  
  constructor() {
    this.apiKey = CCOIN_AI_API_KEY || '';
    this.responseCache = new Map();
    
    // مقداردهی اولیه
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      // ایجاد مدل‌ها از ابتدا برای جلوگیری از ایجاد مکرر
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "تو دستیار هوشمند CCOIN AI برای بازی Ccoin هستی. همیشه پاسخ‌های کوتاه، دقیق و مفید می‌دهی."
      });
      // پیش‌بارگذاری مدل برای تصاویر
      this.visionModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
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
    const cachedItem = this.responseCache.get(key);
    if (cachedItem) {
      const now = Date.now();
      // بررسی انقضای کش
      if (now - cachedItem.timestamp < this.CACHE_EXPIRY) {
        log(`پاسخ از کش بازیابی شد: ${key.substring(0, 20)}...`, 'info');
        return cachedItem.response;
      } else {
        // حذف آیتم منقضی شده
        this.responseCache.delete(key);
      }
    }
    return null;
  }
  
  /**
   * افزودن پاسخ به کش
   * @param key کلید کش
   * @param response پاسخ برای ذخیره
   */
  private cacheResponse(key: string, response: string): void {
    // افزودن آیتم جدید به کش با زمان فعلی
    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });
    
    // محدود کردن اندازه کش به 100 آیتم
    if (this.responseCache.size > 100) {
      // حذف 10 آیتم قدیمی برای کاهش اندازه کش
      // روش جایگزین بدون استفاده از entries() که نیاز به تنظیمات خاص دارد
      let keysToDelete: string[] = [];
      let oldestTimestamp = Date.now();
      let oldestKey = '';
      
      // حذف 10 آیتم قدیمی‌ترین
      for (let i = 0; i < 10; i++) {
        oldestTimestamp = Date.now();
        oldestKey = '';
        
        // پیدا کردن قدیمی‌ترین آیتم
        this.responseCache.forEach((value, key) => {
          if (value.timestamp < oldestTimestamp) {
            oldestTimestamp = value.timestamp;
            oldestKey = key;
          }
        });
        
        // اگر کلید قدیمی پیدا شد، آن را به لیست حذف اضافه می‌کنیم
        if (oldestKey) {
          keysToDelete.push(oldestKey);
        }
      }
      
      // حذف تمام کلیدهای قدیمی
      for (const key of keysToDelete) {
        this.responseCache.delete(key);
      }
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
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContent(
    prompt: string, 
    maxTokens: number = 1000, 
    temperature: number = 0.7
  ): Promise<string> {
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    // بررسی کش برای درخواست‌های تکراری
    const cacheKey = this.createCacheKey(prompt, maxTokens, temperature);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      log(`ارسال درخواست به CCOIN AI: ${prompt.substring(0, 50)}...`, 'info');
      
      // تلاش‌های مجدد برای افزایش اطمینان از پاسخگویی
      let lastError: any = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          // اگر تلاش مجدد است، کمی تاخیر ایجاد کنیم
          if (attempt > 0) {
            await this.delay(RETRY_DELAY * attempt);
            log(`تلاش مجدد ${attempt} از ${MAX_RETRIES}...`, 'info');
          }
          
          // استفاده از مدل SDK با تنظیمات بهینه
          const result = await (this.model as any).generateContent(prompt, {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.9,  // افزایش تنوع خروجی
            topK: 40
          });
          
          const response = await result.response;
          const generatedText = response.text();
          
          log(`پاسخ از CCOIN AI دریافت شد (${generatedText.length} کاراکتر) ✨`, 'info');
          
          // ذخیره پاسخ در کش برای استفاده آینده
          this.cacheResponse(cacheKey, generatedText);
          
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
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContentFast(prompt: string, maxTokens: number = 100): Promise<string> {
    if (!this.apiKey) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    // بررسی کش برای درخواست‌های تکراری
    const cacheKey = this.createCacheKey(prompt, maxTokens, 0.2);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
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
            temperature: 0.2,
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
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const text = response.data.candidates[0].content.parts[0].text;
        log(`پاسخ سریع از CCOIN AI دریافت شد (${text.length} کاراکتر، ${endTime - startTime}ms) ⚡`, 'info');
        
        // ذخیره پاسخ در کش
        this.cacheResponse(cacheKey, text);
        
        return text;
      } else {
        throw new Error('ساختار پاسخ نامعتبر است');
      }
      
    } catch (error: any) {
      log('خطا در فراخوانی سریع سرویس CCOIN AI: ' + error, 'error');
      
      // fallback به روش معمولی
      return this.generateContent(prompt, maxTokens, 0.2);
    }
  }
  
  /**
   * ارسال درخواست متنی و تصویری به CCOIN AI (multimodal)
   * @param textPrompt متن ورودی
   * @param imageBase64 تصویر به صورت رشته base64
   * @param mimeType نوع فایل تصویر (مثلاً 'image/jpeg')
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContentWithImage(
    textPrompt: string,
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    maxTokens: number = 1000,
    temperature: number = 0.7
  ): Promise<string> {
    if (!this.apiKey || !this.visionModel) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    try {
      log(`ارسال درخواست چندرسانه‌ای به CCOIN AI: ${textPrompt.substring(0, 50)}...`, 'info');
      
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
          
          log(`پاسخ چندرسانه‌ای از CCOIN AI دریافت شد (${generatedText.length} کاراکتر) ✨`, 'info');
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
    const size = this.responseCache.size;
    this.responseCache.clear();
    log(`کش سرویس CCOIN AI پاکسازی شد (${size} آیتم)`, 'info');
  }
}

// نمونه‌سازی از سرویس
const ccoinAIService = new OptimizedCcoinAIService();
export default ccoinAIService;

// صادر کردن کلاس با نام مناسب برای استفاده در جاهایی که نیاز به نمونه‌سازی جدید است
export { OptimizedCcoinAIService as CcoinAIService };