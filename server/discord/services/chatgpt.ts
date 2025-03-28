import { OpenAI } from 'openai';
import { log } from '../../vite';

/**
 * سرویس ChatGPT برای تعامل با API OpenAI
 * این کلاس امکان ارسال پیام‌ها به OpenAI و دریافت پاسخ را فراهم می‌کند
 */
class ChatGPTService {
  private client: OpenAI | null = null;

  /**
   * مقداردهی اولیه سرویس ChatGPT
   */
  constructor() {
    this.initialize();
  }

  /**
   * راه‌اندازی و مقداردهی اولیه کلاینت OpenAI
   */
  private initialize() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        log('OpenAI API key is missing. ChatGPT service will not work.', 'error');
        return;
      }
      
      this.client = new OpenAI({
        apiKey: apiKey
      });
      
      log('ChatGPT service initialized successfully', 'success');
    } catch (error) {
      log(`Error initializing OpenAI client: ${error}`, 'error');
      this.client = null;
    }
  }

  /**
   * بررسی وضعیت اتصال به سرویس ChatGPT
   * @returns وضعیت اتصال: آیا سرویس در دسترس است یا خیر و کد وضعیت
   */
  async checkConnectionStatus(): Promise<{ isAvailable: boolean; statusCode: number; message: string }> {
    try {
      if (!this.client) {
        return { 
          isAvailable: false, 
          statusCode: -1, 
          message: 'کلاینت ChatGPT راه‌اندازی نشده است' 
        };
      }

      // انجام یک تست ساده برای بررسی وضعیت اتصال
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });

      // اگر به اینجا برسیم، یعنی اتصال برقرار است
      return { 
        isAvailable: true, 
        statusCode: 200, 
        message: 'اتصال به سرویس ChatGPT برقرار است' 
      };
    } catch (error: any) {
      log(`Error checking ChatGPT connection: ${error}`, 'error');
      
      // بررسی نوع خطا و بازگرداندن وضعیت مناسب
      if (error.status === 429) {
        return { 
          isAvailable: false, 
          statusCode: 429, 
          message: 'محدودیت استفاده از سرویس ChatGPT به پایان رسیده است' 
        };
      } else if (error.status === 401 || error.status === 403) {
        return { 
          isAvailable: false, 
          statusCode: 401, 
          message: 'خطا در دسترسی به سرویس ChatGPT (احراز هویت)' 
        };
      } else if (error.status >= 500) {
        return { 
          isAvailable: false, 
          statusCode: 500, 
          message: 'خطای سرور OpenAI' 
        };
      } else {
        return { 
          isAvailable: false, 
          statusCode: -1, 
          message: 'خطای نامشخص در اتصال به سرویس ChatGPT' 
        };
      }
    }
  }

  /**
   * ارسال پیام به ChatGPT و دریافت پاسخ
   * @param prompt متن درخواست
   * @param options تنظیمات اختیاری
   * @returns پاسخ دریافتی از ChatGPT
   */
  async getChatGPTResponse(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}) {
    try {
      if (!this.client) {
        throw new Error('ChatGPT client not initialized');
      }

      // تنظیمات پیش‌فرض
      const model = options.model || 'gpt-3.5-turbo';
      const maxTokens = options.maxTokens || 150;
      const temperature = options.temperature || 0.7;

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature
      });

      // بازگرداندن متن پاسخ
      return response.choices[0].message.content || 'پاسخی دریافت نشد.';
    } catch (error: any) {
      log(`Error in ChatGPT request: ${error}`, 'error');
      
      // بررسی نوع خطا و ارائه پیام های مناسب
      if (error.status === 429) {
        // خطای محدودیت تعداد درخواست‌ها یا اتمام اعتبار
        return `⚠️ محدودیت استفاده از سرویس ChatGPT به پایان رسیده است. لطفاً این موضوع را به مدیر سیستم اطلاع دهید.`;
      } else if (error.status === 401 || error.status === 403) {
        // خطای احراز هویت
        return `⚠️ خطا در دسترسی به سرویس ChatGPT. کلید API نامعتبر است یا دسترسی ندارد.`;
      } else if (error.status >= 500) {
        // خطاهای سمت سرور
        return `⚠️ سرورهای ChatGPT در حال حاضر با مشکل مواجه هستند. لطفاً بعداً دوباره تلاش کنید.`;
      } else {
        // سایر خطاها
        return `متأسفانه خطایی در ارتباط با ChatGPT رخ داد. لطفاً بعداً دوباره تلاش کنید.`;
      }
    }
  }

  /**
   * تست سرعت اتصال به ChatGPT
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا
   */
  async pingChatGPT(): Promise<number> {
    try {
      if (!this.client) {
        log('ChatGPT client not initialized', 'error');
        return -1; // کد خطای عمومی
      }

      const startTime = Date.now();
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'پینگ' }],
        max_tokens: 5,
        temperature: 0.1
      });
      const endTime = Date.now();
      
      return endTime - startTime;
    } catch (error: any) {
      log(`Error in ChatGPT ping test: ${error}`, 'error');
      
      // کدهای خطای خاص برای وضعیت‌های مختلف
      if (error.status === 429) {
        return -429; // خطای محدودیت تعداد درخواست‌ها یا اتمام اعتبار
      } else if (error.status === 401 || error.status === 403) {
        return -401; // خطای احراز هویت
      } else if (error.status >= 500) {
        return -500; // خطاهای سمت سرور
      } else {
        return -1; // سایر خطاها
      }
    }
  }
}

// صادر کردن نمونه سینگلتون از سرویس
export const chatGPTService = new ChatGPTService();