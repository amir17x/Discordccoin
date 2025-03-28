/**
 * سرویس Hugging Face برای تعامل با API Hugging Face
 * این فایل شامل توابع مورد نیاز برای ارتباط با API هوش مصنوعی Hugging Face است
 */

import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

// بارگیری متغیرهای محیطی
dotenv.config();

// تابع لاگ برای ثبت پیام‌های مربوط به این سرویس
const log = (message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [${level}] ${message}`);
};

/**
 * سرویس Hugging Face برای تعامل با API Hugging Face
 * این کلاس امکان ارسال درخواست به مدل‌های Hugging Face و دریافت پاسخ را فراهم می‌کند
 */
class HuggingFaceService {
  private client: HfInference | null = null;
  // استفاده از مدل چندزبانه با پشتیبانی بهتر از زبان فارسی
  private defaultModel = 'mistralai/Mistral-7B-Instruct-v0.2'; // مدل پیشفرض مناسب برای زبان فارسی
  
  /**
   * مقداردهی اولیه سرویس Hugging Face
   */
  constructor() {
    this.initialize();
  }

  /**
   * راه‌اندازی و مقداردهی اولیه کلاینت Hugging Face
   */
  private initialize() {
    try {
      const apiKey = process.env.HUGGINGFACE_API_KEY;
      
      if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY not found in environment variables');
      }
      
      this.client = new HfInference(apiKey);
      log('Hugging Face service initialized successfully', 'success');
    } catch (error) {
      log(`Error initializing Hugging Face service: ${error}`, 'error');
      this.client = null;
    }
  }

  /**
   * بررسی وضعیت اتصال به سرویس Hugging Face
   * @returns وضعیت اتصال: آیا سرویس در دسترس است یا خیر و کد وضعیت
   */
  async checkConnectionStatus(): Promise<{ isAvailable: boolean; statusCode: number; message: string }> {
    try {
      if (!this.client) {
        return { 
          isAvailable: false, 
          statusCode: -1, 
          message: 'کلاینت Hugging Face راه‌اندازی نشده است' 
        };
      }

      // انجام یک تست ساده برای بررسی وضعیت اتصال
      await this.client.textGeneration({
        model: this.defaultModel,
        inputs: 'test',
        parameters: {
          max_new_tokens: 5
        }
      });

      // اگر به اینجا برسیم، یعنی اتصال برقرار است
      return { 
        isAvailable: true, 
        statusCode: 200, 
        message: 'اتصال به سرویس Hugging Face برقرار است' 
      };
    } catch (error: any) {
      log(`Error checking Hugging Face connection: ${error}`, 'error');
      
      // بررسی نوع خطا و بازگرداندن وضعیت مناسب
      if (error.status === 429) {
        return { 
          isAvailable: false, 
          statusCode: 429, 
          message: 'محدودیت استفاده از سرویس Hugging Face به پایان رسیده است' 
        };
      } else if (error.status === 401 || error.status === 403) {
        return { 
          isAvailable: false, 
          statusCode: 401, 
          message: 'خطا در دسترسی به سرویس Hugging Face (احراز هویت)' 
        };
      } else if (error.status >= 500) {
        return { 
          isAvailable: false, 
          statusCode: 500, 
          message: 'خطای سرور Hugging Face' 
        };
      } else {
        return { 
          isAvailable: false, 
          statusCode: -1, 
          message: 'خطای نامشخص در اتصال به سرویس Hugging Face' 
        };
      }
    }
  }

  /**
   * ارسال پیام به مدل هوش مصنوعی Hugging Face و دریافت پاسخ
   * @param prompt متن درخواست
   * @param options تنظیمات اختیاری
   * @returns پاسخ دریافتی از هوش مصنوعی
   */
  async getAIResponse(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}): Promise<string> {
    try {
      if (!this.client) {
        throw new Error('Hugging Face client not initialized');
      }

      // تنظیمات پیش‌فرض
      const model = options.model || this.defaultModel;
      const maxTokens = options.maxTokens || 150;
      const temperature = options.temperature !== undefined ? options.temperature : 0.7;

      // اضافه کردن دستورالعمل زبان فارسی به ابتدای پرامپت با تأکید بیشتر
      const enhancedPrompt = `[دستورالعمل مهم: شما یک دستیار هوشمند برای کاربران ایرانی هستید]
[شما باید در هر شرایطی فقط به زبان فارسی (پارسی) پاسخ دهید - نه عربی، نه انگلیسی]
[حتی اگر سوال به زبان دیگری پرسیده شده باشد، پاسخ را به فارسی روان و قابل فهم ارائه دهید]
[از کلمات و اصطلاحات رایج در زبان فارسی استاندارد استفاده کنید]
[اگر ضرورت دارد از کلمات تخصصی انگلیسی استفاده کنید، معادل فارسی آن را در پرانتز ذکر کنید]

${prompt}`;

      // ارسال درخواست به Hugging Face
      const response = await this.client.textGeneration({
        model: model,
        inputs: enhancedPrompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: temperature,
          return_full_text: false
        }
      });

      // بازگرداندن متن پاسخ
      return response.generated_text || 'پاسخی دریافت نشد.';
    } catch (error: any) {
      log(`Error in Hugging Face request: ${error}`, 'error');
      
      // بررسی نوع خطا و ارائه پیام های مناسب
      if (error.status === 429) {
        return `⚠️ محدودیت استفاده از سرویس Hugging Face به پایان رسیده است. لطفاً این موضوع را به مدیر سیستم اطلاع دهید.`;
      } else if (error.status === 401 || error.status === 403) {
        return `⚠️ خطا در دسترسی به سرویس Hugging Face. کلید API نامعتبر است یا دسترسی ندارد.`;
      } else if (error.status >= 500) {
        return `⚠️ سرورهای Hugging Face در حال حاضر با مشکل مواجه هستند. لطفاً بعداً دوباره تلاش کنید.`;
      } else {
        return `متأسفانه خطایی در ارتباط با Hugging Face رخ داد. لطفاً بعداً دوباره تلاش کنید.`;
      }
    }
  }

  /**
   * تست سرعت اتصال به Hugging Face
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا
   */
  async pingHuggingFace(): Promise<number> {
    try {
      if (!this.client) {
        log('Hugging Face client not initialized', 'error');
        return -1; // کد خطای عمومی
      }

      const startTime = Date.now();
      await this.client.textGeneration({
        model: this.defaultModel,
        inputs: 'پینگ',
        parameters: {
          max_new_tokens: 5,
          temperature: 0.1
        }
      });
      const endTime = Date.now();
      
      return endTime - startTime;
    } catch (error: any) {
      log(`Error in Hugging Face ping test: ${error}`, 'error');
      
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
export const huggingFaceService = new HuggingFaceService();