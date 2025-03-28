import { botConfig } from '../utils/config';

// کلید Grok API
// معمولاً از OPENAI_API_KEY یا GROK_API_KEY استفاده می‌شود
// اگر GROK_API_KEY تعریف نشده باشد، می‌توانیم از کلید دیگری استفاده کنیم
const GROK_API_KEY = process.env.GROK_API_KEY || '';

/**
 * تولید پاسخ با استفاده از مدل Grok
 * @param prompt متن پرامپت
 * @returns پاسخ تولید شده
 */
export async function generateGrokResponse(prompt: string): Promise<string> {
  try {
    // اگر کلید API موجود نیست، خطا ایجاد می‌کنیم
    if (!GROK_API_KEY) {
      throw new Error('کلید API برای Grok تنظیم نشده است.');
    }

    // مدل پیش‌فرض یا مدل تنظیم شده در تنظیمات
    const model = botConfig.ai?.grokModel || 'grok-1';
    
    // URL API Grok (باید با توجه به مستندات Grok تنظیم شود)
    // این URL فرضی است و باید بر اساس مستندات واقعی Grok تغییر کند
    const apiUrl = `https://api.grok.x/v1/chat/completions`;
    
    // تنظیمات درخواست
    const requestBody = {
      model: model,
      messages: [
        {
          role: "system",
          content: "شما یک دستیار هوشمند فارسی‌زبان هستید. پاسخ‌های شما باید خلاصه و مفید باشند و از زبان فارسی استفاده کنید. لحن شما باید طنزآمیز و سرگرم‌کننده باشد، با کمی شوخی و شیطنت، در عین حال محترمانه و مفید."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
      top_p: 0.9
    };

    console.log(`Sending request to Grok AI (model: ${model})`);
    
    // ارسال درخواست به API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    // بررسی موفقیت‌آمیز بودن درخواست
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`خطای API (${response.status}): ${errorText}`);
    }

    // استخراج پاسخ
    const responseData = await response.json();
    const generatedText = responseData.choices?.[0]?.message?.content || '';

    return generatedText.trim() || 'پاسخی دریافت نشد.';

  } catch (error) {
    console.error('Error in Grok API call:', error);
    
    // اگر خطا مربوط به عدم وجود کلید API است، پیام مناسب را برگردانیم
    if ((error as Error).message.includes('API')) {
      throw new Error('کلید API برای Grok تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.');
    }
    
    // در صورت خطا، یک پیام مناسب برمی‌گردانیم
    throw new Error(`خطا در ارتباط با Grok: ${(error as Error).message}`);
  }
}

/**
 * کلاس سرویس Grok
 */
export class GrokService {
  /**
   * تولید پاسخ با استفاده از مدل Grok
   * @param prompt متن پرامپت
   * @returns پاسخ تولید شده
   */
  async generateResponse(prompt: string): Promise<string> {
    return generateGrokResponse(prompt);
  }
  
  /**
   * تست سرعت پاسخگویی سرویس Grok
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا (مقدار منفی)
   */
  async pingGrok(): Promise<number> {
    try {
      if (!GROK_API_KEY) {
        return -401; // خطای احراز هویت
      }
      
      const model = botConfig.ai?.grokModel || 'grok-1';
      const startTime = Date.now();
      
      // URL API
      const apiUrl = `https://api.grok.x/v1/chat/completions`;
      
      // تنظیمات درخواست - خیلی ساده برای تست سرعت
      const requestBody = {
        model: model,
        messages: [
          {
            role: "user",
            content: "سلام"
          }
        ],
        temperature: 0.7,
        max_tokens: 5
      };
      
      // ارسال درخواست به API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const statusCode = response.status;
        
        if (statusCode === 429) {
          return -429; // محدودیت تعداد درخواست
        } else if (statusCode === 401) {
          return -401; // خطای احراز هویت
        } else if (statusCode >= 500 && statusCode < 600) {
          return -500; // خطای سرور
        }
        
        return -1; // سایر خطاها
      }
      
      return Date.now() - startTime;
    } catch (error) {
      console.error('Error in Grok ping test:', error);
      
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

// ایجاد نمونه از سرویس Grok برای استفاده در سراسر برنامه
export const grokService = new GrokService();