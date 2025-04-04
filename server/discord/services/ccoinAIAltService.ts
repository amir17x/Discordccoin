import axios from 'axios';
import { log } from '../../vite';
import { botConfig } from '../utils/config';

// Using GOOGLE_AI_API_KEY but referred to as CCOIN_AI_API_KEY in our codebase
const CCOIN_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const CCOIN_AI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

/**
 * سرویس جایگزین برای CCOIN AI که به طور مستقیم با REST API کار می‌کند
 * این سرویس برای زمانی طراحی شده است که سرویس‌های دیگر AI با خطا مواجه می‌شوند
 */
export class CcoinAIAltService {
  private apiKey: string;
  private apiUrl: string;
  
  constructor() {
    this.apiKey = CCOIN_AI_API_KEY || '';
    this.apiUrl = CCOIN_AI_API_URL;
    
    if (!this.apiKey) {
      log('سرویس CCOIN AI جایگزین: کلید API تنظیم نشده است', 'warn');
    } else {
      log('سرویس CCOIN AI جایگزین با موفقیت راه‌اندازی شد', 'info');
    }
  }
  
  /**
   * ارسال درخواست به CCOIN AI API
   * @param prompt متن ورودی
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContent(prompt: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
    if (!this.apiKey) {
      throw new Error('کلید API برای سرویس CCOIN AI جایگزین تنظیم نشده است');
    }
    
    try {
      log(`ارسال درخواست به سرویس CCOIN AI جایگزین: ${prompt.substring(0, 50)}...`, 'info');
      
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
        log(`پاسخ از سرویس CCOIN AI جایگزین دریافت شد (${generatedText.length} کاراکتر)`, 'info');
        return generatedText;
      } else {
        log('ساختار پاسخ سرویس CCOIN AI جایگزین غیرمنتظره است: ' + JSON.stringify(response.data), 'error');
        throw new Error('ساختار پاسخ API غیرمنتظره');
      }
    } catch (error) {
      log('خطا در فراخوانی سرویس CCOIN AI جایگزین: ' + error, 'error');
      
      // پردازش خطاهای خاص
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          throw new Error('خطای احراز هویت در سرویس CCOIN AI جایگزین: کلید API نامعتبر است');
        } else if (status === 429) {
          throw new Error('محدودیت نرخ سرویس CCOIN AI جایگزین: تعداد درخواست‌ها بیش از حد مجاز است');
        } else if (status >= 500) {
          throw new Error(`خطای سرور سرویس CCOIN AI جایگزین (${status}): ${JSON.stringify(data)}`);
        } else {
          throw new Error(`خطای سرویس CCOIN AI جایگزین (${status}): ${JSON.stringify(data)}`);
        }
      }
      
      throw new Error(`خطا در سرویس CCOIN AI جایگزین: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
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
      // استفاده از یک پرسش ساده‌تر با تنظیمات سخت‌گیرانه‌تر برای کاهش زمان پاسخگویی
      await this.generateContent('1+1', 5, 0.1);
      return true;
    } catch (error) {
      log('تست اتصال سرویس CCOIN AI جایگزین با شکست مواجه شد: ' + error, 'error');
      return false;
    }
  }
}

// ایجاد نمونه واحد از سرویس
const ccoinAIAltService = new CcoinAIAltService();
export default ccoinAIAltService;