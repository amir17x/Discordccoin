import OpenAI from 'openai';
import { botConfig } from '../utils/config';

// کلید OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ایجاد نمونه از OpenAI API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

/**
 * کلاس سرویس OpenAI
 */
export class OpenAIService {
  /**
   * تولید پاسخ با استفاده از مدل OpenAI
   * @param prompt متن پرامپت
   * @returns پاسخ تولید شده
   */
  async generateResponse(prompt: string): Promise<string> {
    return generateOpenAIResponse(prompt);
  }
  
  /**
   * تست سرعت پاسخگویی سرویس OpenAI
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا (مقدار منفی)
   */
  async pingOpenAI(): Promise<number> {
    try {
      if (!OPENAI_API_KEY) {
        return -401; // خطای احراز هویت
      }
      
      const aiSettings = botConfig.getAISettings();
      const model = aiSettings.openaiModel || 'gpt-3.5-turbo';
      const startTime = Date.now();
      
      // ارسال یک درخواست کوتاه برای تست سرعت
      await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: "سلام"
          }
        ],
        temperature: 0.7,
        max_tokens: 5,
      });
      
      return Date.now() - startTime;
    } catch (error) {
      console.error('Error in OpenAI ping test:', error);
      
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

// ایجاد نمونه از سرویس OpenAI برای استفاده در سراسر برنامه
export const openAIService = new OpenAIService();

/**
 * تولید پاسخ با استفاده از مدل OpenAI
 * @param prompt متن پرامپت
 * @returns پاسخ تولید شده
 */
export async function generateOpenAIResponse(prompt: string): Promise<string> {
  try {
    // اگر کلید API موجود نیست، خطا ایجاد می‌کنیم
    if (!OPENAI_API_KEY) {
      throw new Error('کلید API برای OpenAI تنظیم نشده است.');
    }

    // مدل پیش‌فرض یا مدل تنظیم شده در تنظیمات
    const aiSettings = botConfig.getAISettings();
    const model = aiSettings.openaiModel || 'gpt-3.5-turbo';
    
    // ارسال درخواست به API
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "شما یک دستیار هوشمند فارسی‌زبان هستید. پاسخ‌های شما باید خلاصه و مفید باشند و از زبان فارسی استفاده کنید. سعی کنید پاسخ‌های طنزآمیز و سرگرم‌کننده بدهید."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9
    });

    // استخراج پاسخ
    const generatedText = response.choices[0]?.message?.content || '';

    return generatedText.trim() || 'پاسخی دریافت نشد.';

  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    
    // اگر خطا مربوط به عدم وجود کلید API است، پیام مناسب را برگردانیم
    if ((error as Error).message.includes('API')) {
      throw new Error('کلید API برای OpenAI تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.');
    }
    
    // در صورت خطا، یک پیام مناسب برمی‌گردانیم
    throw new Error(`خطا در ارتباط با OpenAI: ${(error as Error).message}`);
  }
}