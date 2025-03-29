import OpenAI from 'openai';
import { log } from '../utils/logger';
import { botConfig } from '../utils/config';

// کلید API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * سرویس OpenAI برای تولید متن با استفاده از هوش مصنوعی
 */
export class OpenAIService {
  private openai: OpenAI | null = null;
  private available: boolean = false;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * راه‌اندازی کلاینت OpenAI
   */
  private initialize(): void {
    try {
      if (!OPENAI_API_KEY) {
        log('کلید API برای OpenAI تنظیم نشده است', 'warn');
        this.available = false;
        return;
      }
      
      this.openai = new OpenAI({
        apiKey: OPENAI_API_KEY
      });
      
      this.available = true;
      log('سرویس OpenAI با موفقیت راه‌اندازی شد', 'info');
    } catch (error) {
      log('خطا در راه‌اندازی سرویس OpenAI:' + (error instanceof Error ? error.message : String(error)), 'error');
      this.available = false;
    }
  }
  
  /**
   * تولید پاسخ با استفاده از OpenAI
   * @param prompt متن ورودی
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContent(prompt: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
    if (!this.available || !this.openai) {
      throw new Error('کلید API برای OpenAI تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.');
    }
    
    try {
      log(`ارسال درخواست به OpenAI: ${prompt.substring(0, 50)}...`, 'info');
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "شما یک دستیار هوشمند، مفید و دقیق هستید که به فارسی روان پاسخ می‌دهد. پاسخ‌های شما باید همیشه مرتبط و واقعی باشند." },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: 0.8
      });
      
      if (response.choices && response.choices.length > 0) {
        const generatedText = response.choices[0].message.content || '';
        log(`پاسخ از OpenAI دریافت شد (${generatedText.length} کاراکتر)`, 'info');
        return generatedText;
      } else {
        log('ساختار پاسخ OpenAI غیرمنتظره است: ' + JSON.stringify(response).substring(0, 100) + '...', 'error');
        throw new Error('ساختار پاسخ API غیرمنتظره');
      }
    } catch (error) {
      log('خطا در فراخوانی OpenAI: ' + (error instanceof Error ? error.message : String(error)), 'error');
      
      if (error instanceof OpenAI.APIError) {
        // خطاهای خاص OpenAI
        if (error.status === 401) {
          throw new Error('خطای احراز هویت در OpenAI: کلید API نامعتبر است');
        } else if (error.status === 429) {
          throw new Error('محدودیت نرخ OpenAI: تعداد درخواست‌ها بیش از حد مجاز است');
        } else if (error.status >= 500) {
          throw new Error(`خطای سرور OpenAI (${error.status}): ${error.message}`);
        } else {
          throw new Error(`خطای سرویس OpenAI (${error.status}): ${error.message}`);
        }
      }
      
      throw new Error(`خطا در سرویس OpenAI: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    }
  }
  
  /**
   * بررسی اینکه آیا سرویس قابل استفاده است یا خیر
   * @returns وضعیت سرویس
   */
  isAvailable(): boolean {
    return this.available;
  }
  
  /**
   * آزمایش اتصال به سرویس
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateContent('سلام، لطفاً پاسخ خیلی کوتاهی بده: 1+1 چند می‌شود؟', 10, 0.1);
      return true;
    } catch (error) {
      log('تست اتصال OpenAI با شکست مواجه شد: ' + (error instanceof Error ? error.message : String(error)), 'error');
      return false;
    }
  }
}

// ایجاد نمونه واحد از سرویس
const openaiService = new OpenAIService();
export default openaiService;