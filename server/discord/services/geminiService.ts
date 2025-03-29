import { GoogleGenerativeAI } from '@google/generative-ai';
import { log } from '../../vite';
import { botConfig } from '../utils/config';

// Using GOOGLE_AI_API_KEY but referred to as CCOIN_AI_API_KEY in our codebase
const CCOIN_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

/**
 * سرویس CCOIN AI با استفاده از SDK گوگل
 * این سرویس از کتابخانه رسمی @google/generative-ai استفاده می‌کند
 */
export class GeminiService {
  private apiKey: string;
  private genAI: any;
  private model: any;
  
  constructor() {
    this.apiKey = CCOIN_AI_API_KEY || '';
    
    // مقداردهی اولیه
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      log('سرویس CCOIN AI با موفقیت راه‌اندازی شد', 'info');
    } else {
      log('سرویس CCOIN AI: کلید API تنظیم نشده است', 'warn');
    }
  }
  
  /**
   * ارسال درخواست به CCOIN AI با استفاده از SDK
   * @param prompt متن ورودی
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContent(prompt: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    try {
      log(`ارسال درخواست به CCOIN AI: ${prompt.substring(0, 50)}...`, 'info');
      
      // تنظیم پارامترهای تولید محتوا
      // با توجه به خطاها، از نوع any برای جلوگیری از خطاهای تایپ استفاده می‌کنیم
      const result = await (this.model as any).generateContent(prompt, {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 40
      });
      
      const response = await result.response;
      const generatedText = response.text();
      
      log(`پاسخ از CCOIN AI دریافت شد (${generatedText.length} کاراکتر)`, 'info');
      return generatedText;
      
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
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    try {
      log(`ارسال درخواست چندرسانه‌ای به CCOIN AI: ${textPrompt.substring(0, 50)}...`, 'info');
      
      // سرویس مدل چندوجهی - از مدل Pro استفاده می‌کنیم که برای تصاویر بهتر است
      const visionModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // ایجاد اجزای درخواست مطابق با مستندات
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType
        }
      };
      
      // ارسال درخواست به صورت آرایه‌ای از اجزا
      // با توجه به خطاها، از نوع any برای جلوگیری از خطاهای تایپ استفاده می‌کنیم
      const result = await (visionModel as any).generateContent([textPrompt, imagePart], {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 40
      });
      
      const response = await result.response;
      const generatedText = response.text();
      
      log(`پاسخ چندرسانه‌ای از CCOIN AI دریافت شد (${generatedText.length} کاراکتر)`, 'info');
      return generatedText;
      
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
          topP: 0.8,
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
      await this.generateContent('سلام، لطفاً پاسخ خیلی کوتاهی بده: 1+1 چند می‌شود؟', 10, 0.1);
      return true;
    } catch (error) {
      log('تست اتصال سرویس CCOIN AI با شکست مواجه شد: ' + error, 'error');
      return false;
    }
  }
}

// ایجاد نمونه واحد از سرویس
const geminiService = new GeminiService();
export default geminiService;