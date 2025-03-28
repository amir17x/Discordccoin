import { HfInference } from '@huggingface/inference';
import { botConfig } from '../utils/config';

// کلید Hugging Face API
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

// ایجاد نمونه از Hugging Face API
const hf = new HfInference(HUGGINGFACE_API_KEY);

/**
 * کلاس سرویس Hugging Face
 */
export class HuggingFaceService {
  /**
   * تولید پاسخ با استفاده از مدل Hugging Face
   * @param prompt متن پرامپت
   * @returns پاسخ تولید شده
   */
  async generateResponse(prompt: string): Promise<string> {
    return generateHuggingFaceResponse(prompt);
  }
  
  /**
   * بررسی وضعیت اتصال به سرویس هاگینگ فیس
   * @returns وضعیت اتصال به سرویس
   */
  async checkConnectionStatus(): Promise<{
    isAvailable: boolean;
    message: string;
    statusCode: number;
  }> {
    try {
      // تست اتصال به سرویس
      const pingResult = await this.pingHuggingFace();
      
      if (pingResult > 0) {
        return {
          isAvailable: true,
          message: 'سرویس هوش مصنوعی در دسترس است.',
          statusCode: 200
        };
      }
      
      // بررسی نوع خطا
      if (pingResult === -429) {
        return {
          isAvailable: false,
          message: 'محدودیت استفاده از API به پایان رسیده است.',
          statusCode: 429
        };
      } else if (pingResult === -401) {
        return {
          isAvailable: false,
          message: 'کلید API نامعتبر است یا تنظیم نشده است.',
          statusCode: 401
        };
      } else if (pingResult === -500) {
        return {
          isAvailable: false,
          message: 'خطای سرور در سرویس هاگینگ فیس.',
          statusCode: 500
        };
      } else {
        return {
          isAvailable: false,
          message: 'خطای ناشناخته در اتصال به سرویس هوش مصنوعی.',
          statusCode: 400
        };
      }
    } catch (error) {
      console.error('Error checking Hugging Face connectivity:', error);
      return {
        isAvailable: false,
        message: 'خطا در بررسی وضعیت اتصال به سرویس هوش مصنوعی.',
        statusCode: 500
      };
    }
  }
  
  /**
   * تولید پاسخ از هوش مصنوعی
   * @param prompt متن پرامپت
   * @param options تنظیمات اختیاری
   * @returns پاسخ تولید شده
   */
  async getAIResponse(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
  } = {}): Promise<string> {
    try {
      // استفاده از متد اصلی برای دریافت پاسخ
      return await generateHuggingFaceResponse(prompt);
    } catch (error) {
      console.error('Error in getAIResponse:', error);
      return `⚠️ خطا در دریافت پاسخ: ${error instanceof Error ? error.message : 'خطای نامشخص'}`;
    }
  }
  
  /**
   * تست سرعت پاسخگویی سرویس Hugging Face
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا (مقدار منفی)
   */
  async pingHuggingFace(): Promise<number> {
    try {
      if (!HUGGINGFACE_API_KEY) {
        return -401; // خطای احراز هویت
      }
      
      const aiSettings = botConfig.getAISettings();
      const model = aiSettings.huggingfaceModel || 'mistralai/Mistral-7B-Instruct-v0.2';
      const startTime = Date.now();
      
      // ارسال یک درخواست کوتاه برای تست سرعت
      await hf.textGeneration({
        model: model,
        inputs: '<s>[INST] سلام [/INST]',
        parameters: {
          max_new_tokens: 5,
          temperature: 0.7,
        }
      });
      
      return Date.now() - startTime;
    } catch (error) {
      console.error('Error in Hugging Face ping test:', error);
      
      // تشخیص نوع خطا و برگرداندن کد خطای مناسب
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return -429; // محدودیت تعداد درخواست
      } else if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
        return -401; // خطای احراز هویت
      } else if (errorMessage.includes('500') || errorMessage.includes('server error')) {
        return -500; // خطای سرور
      }
      
      return -1; // خطای نامشخص
    }
  }
}

// ایجاد نمونه از سرویس Hugging Face برای استفاده در سراسر برنامه
export const huggingFaceService = new HuggingFaceService();

/**
 * تولید پاسخ با استفاده از مدل Hugging Face
 * @param prompt متن پرامپت
 * @returns پاسخ تولید شده
 */
export async function generateHuggingFaceResponse(prompt: string): Promise<string> {
  try {
    // اگر کلید API موجود نیست، خطا ایجاد می‌کنیم
    if (!HUGGINGFACE_API_KEY) {
      throw new Error('کلید API برای Hugging Face تنظیم نشده است.');
    }

    // مدل پیش‌فرض یا مدل تنظیم شده در تنظیمات
    const aiSettings = botConfig.getAISettings();
    const model = aiSettings.huggingfaceModel || 'mistralai/Mistral-7B-Instruct-v0.2';
    
    // تنظیمات درخواست
    const payload = {
      inputs: `<s>[INST] ${prompt} [/INST]`,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      }
    };
    
    console.log(`Sending request to Hugging Face (model: ${model})`);
    
    // ارسال درخواست به API
    const response = await hf.textGeneration({
      model: model,
      inputs: payload.inputs,
      parameters: payload.parameters
    });

    // استخراج پاسخ
    const generatedText = response.generated_text;

    // حذف بخش پرامپت از ابتدای پاسخ
    let cleanedResponse = generatedText.replace(payload.inputs, '').trim();
    
    // حذف علامت‌های اضافی
    cleanedResponse = cleanedResponse.replace(/^\s*<\/s>\s*/, '');
    
    return cleanedResponse || 'پاسخی دریافت نشد.';

  } catch (error) {
    console.error('Error in Hugging Face API call:', error);
    
    // اگر خطا مربوط به عدم وجود کلید API است، پیام مناسب را برگردانیم
    if ((error as Error).message.includes('API')) {
      throw new Error('کلید API برای Hugging Face تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.');
    }
    
    // در صورت خطا، یک پیام مناسب برمی‌گردانیم
    throw new Error(`خطا در ارتباط با Hugging Face: ${(error as Error).message}`);
  }
}