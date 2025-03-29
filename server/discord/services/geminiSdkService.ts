import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { log } from '../../vite';

// اینترفیس کمکی برای رفع خطای LSP
interface ExtendedRequestOptions {
  generationConfig?: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };
  signal?: AbortSignal;
  timeout?: number;
  apiVersion?: string;
}

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;

/**
 * سرویس Gemini با استفاده از SDK رسمی Google
 * این سرویس از کتابخانه رسمی @google/generative-ai استفاده می‌کند
 */
export class GeminiSdkService {
  private apiKey: string;
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  
  constructor() {
    this.apiKey = GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      log('سرویس Gemini SDK: کلید API تنظیم نشده است', 'warn');
    } else {
      try {
        // مقداردهی اولیه SDK
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        
        // انتخاب مدل - از gemini-1.5-pro استفاده می‌کنیم برای پشتیبانی بهتر از فارسی
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        log('سرویس Gemini SDK با موفقیت راه‌اندازی شد', 'info');
      } catch (error) {
        log(`خطا در راه‌اندازی سرویس Gemini SDK: ${error}`, 'error');
        this.genAI = null;
        this.model = null;
      }
    }
  }
  
  /**
   * ارسال درخواست به Gemini API
   * @param prompt متن ورودی
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContent(prompt: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس Gemini SDK به درستی راه‌اندازی نشده است');
    }
    
    try {
      log(`ارسال درخواست به سرویس Gemini SDK: ${prompt.substring(0, 50)}...`, 'info');
      
      // تنظیم پارامترهای تولید محتوا
      const generationConfig = {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 40
      };
      
      // ارسال درخواست به API
      const result = await this.model.generateContent(prompt, {
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          topP: 0.8,
          topK: 40
        }
      } as ExtendedRequestOptions);
      
      // دریافت پاسخ
      const response = await result.response;
      const generatedText = response.text();
      
      log(`پاسخ از سرویس Gemini SDK دریافت شد (${generatedText.length} کاراکتر)`, 'info');
      return generatedText;
      
    } catch (error) {
      log('خطا در فراخوانی سرویس Gemini SDK: ' + error, 'error');
      
      // بررسی نوع خطا و ارائه پیام مناسب
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('401')) {
          throw new Error('خطای احراز هویت در سرویس Gemini SDK: کلید API نامعتبر است');
        } else if (errorMessage.includes('429')) {
          throw new Error('محدودیت نرخ سرویس Gemini SDK: تعداد درخواست‌ها بیش از حد مجاز است');
        } else if (errorMessage.includes('500')) {
          throw new Error(`خطای سرور سرویس Gemini SDK: ${errorMessage}`);
        } else {
          throw new Error(`خطای سرویس Gemini SDK: ${errorMessage}`);
        }
      }
      
      throw new Error(`خطا در سرویس Gemini SDK: خطای ناشناخته`);
    }
  }
  
  /**
   * ارسال درخواست به Gemini API با استفاده از تصویر
   * @param prompt متن ورودی
   * @param imageBase64 تصویر به صورت Base64
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContentWithImage(prompt: string, imageBase64: string, mimeType: string = 'image/jpeg', maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس Gemini SDK به درستی راه‌اندازی نشده است');
    }
    
    try {
      log(`ارسال درخواست با تصویر به سرویس Gemini SDK: ${prompt.substring(0, 50)}...`, 'info');
      
      // تنظیم پارامترهای تولید محتوا
      const generationConfig = {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 40
      };
      
      // آماده سازی محتوای چندوجهی (متن و تصویر)
      const content = [
        { text: prompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        }
      ];
      
      // ارسال درخواست چندوجهی (multimodal) به API با تنظیمات تولید
      const result = await this.model.generateContent(content, {
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          topP: 0.8,
          topK: 40
        }
      } as ExtendedRequestOptions);
      
      // دریافت پاسخ
      const response = await result.response;
      const generatedText = response.text();
      
      log(`پاسخ از سرویس Gemini SDK با تصویر دریافت شد (${generatedText.length} کاراکتر)`, 'info');
      return generatedText;
      
    } catch (error) {
      log('خطا در فراخوانی سرویس Gemini SDK با تصویر: ' + error, 'error');
      
      // مدیریت خطا مشابه متد generateContent
      if (error instanceof Error) {
        throw new Error(`خطای سرویس Gemini SDK: ${error.message}`);
      }
      
      throw new Error(`خطا در سرویس Gemini SDK: خطای ناشناخته`);
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
      await this.generateContent('سلام، لطفاً پاسخ خیلی کوتاهی بده: 1+1 چند می‌شود؟', 10, 0.1);
      return true;
    } catch (error) {
      log('تست اتصال سرویس Gemini SDK با شکست مواجه شد: ' + error, 'error');
      return false;
    }
  }
}

// ایجاد نمونه واحد از سرویس
const geminiSdkService = new GeminiSdkService();
export default geminiSdkService;