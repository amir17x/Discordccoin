import axios from 'axios';
import { log } from '../../vite';
import { botConfig } from '../utils/config';

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

/**
 * سرویس جایگزین برای Gemini API که به طور مستقیم با REST API کار می‌کند
 * این سرویس برای زمانی طراحی شده است که سرویس‌های دیگر Google AI با خطا مواجه می‌شوند
 */
export class GeminiAltService {
  private apiKey: string;
  private apiUrl: string;
  
  constructor() {
    this.apiKey = GEMINI_API_KEY || '';
    this.apiUrl = GEMINI_API_URL;
    
    if (!this.apiKey) {
      log('سرویس Gemini جایگزین: کلید API تنظیم نشده است', 'warn');
    } else {
      log('سرویس Gemini جایگزین با موفقیت راه‌اندازی شد', 'info');
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
    if (!this.apiKey) {
      throw new Error('کلید API برای سرویس Gemini جایگزین تنظیم نشده است');
    }
    
    try {
      log(`ارسال درخواست به سرویس Gemini جایگزین: ${prompt.substring(0, 50)}...`, 'info');
      
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.8,
            topK: 40
          }
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const generatedText = response.data.candidates[0].content.parts[0].text;
        log(`پاسخ از سرویس Gemini جایگزین دریافت شد (${generatedText.length} کاراکتر)`, 'info');
        return generatedText;
      } else {
        log('ساختار پاسخ سرویس Gemini جایگزین غیرمنتظره است: ' + JSON.stringify(response.data), 'error');
        throw new Error('ساختار پاسخ API غیرمنتظره');
      }
    } catch (error) {
      log('خطا در فراخوانی سرویس Gemini جایگزین: ' + error, 'error');
      
      // پردازش خطاهای خاص
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          throw new Error('خطای احراز هویت در سرویس Gemini جایگزین: کلید API نامعتبر است');
        } else if (status === 429) {
          throw new Error('محدودیت نرخ سرویس Gemini جایگزین: تعداد درخواست‌ها بیش از حد مجاز است');
        } else if (status >= 500) {
          throw new Error(`خطای سرور سرویس Gemini جایگزین (${status}): ${JSON.stringify(data)}`);
        } else {
          throw new Error(`خطای سرویس Gemini جایگزین (${status}): ${JSON.stringify(data)}`);
        }
      }
      
      throw new Error(`خطا در سرویس Gemini جایگزین: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    }
  }
  
  /**
   * بررسی اینکه آیا سرویس قابل استفاده است یا خیر
   * @returns وضعیت سرویس
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  /**
   * آزمایش اتصال به سرویس
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateContent('سلام، لطفاً پاسخ خیلی کوتاهی بده: 1+1 چند می‌شود؟', 10, 0.1);
      return true;
    } catch (error) {
      log('تست اتصال سرویس Gemini جایگزین با شکست مواجه شد: ' + error, 'error');
      return false;
    }
  }
}

// ایجاد نمونه واحد از سرویس
const geminiAltService = new GeminiAltService();
export default geminiAltService;