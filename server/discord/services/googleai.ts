import { botConfig } from '../utils/config';

// کلید Google AI API
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';

/**
 * تولید پاسخ با استفاده از مدل Google AI (Gemini)
 * @param prompt متن پرامپت
 * @returns پاسخ تولید شده
 */
export async function generateGoogleAIResponse(prompt: string): Promise<string> {
  try {
    // اگر کلید API موجود نیست، خطا ایجاد می‌کنیم
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('کلید API برای Google AI تنظیم نشده است.');
    }

    // مدل پیش‌فرض یا مدل تنظیم شده در تنظیمات
    const aiSettings = botConfig.getAISettings();
    const model = aiSettings.googleModel || 'gemini-pro';
    
    // URL API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;
    
    // تنظیمات درخواست
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `شما یک دستیار هوشمند فارسی‌زبان هستید. پاسخ‌های شما باید خلاصه و مفید باشند و از زبان فارسی استفاده کنید. سعی کنید پاسخ‌های طنزآمیز و سرگرم‌کننده بدهید.\n\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.9
      }
    };

    console.log(`Sending request to Google AI (model: ${model})`);
    
    // ارسال درخواست به API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
    const generatedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return generatedText.trim() || 'پاسخی دریافت نشد.';

  } catch (error) {
    console.error('Error in Google AI API call:', error);
    
    // اگر خطا مربوط به عدم وجود کلید API است، پیام مناسب را برگردانیم
    if ((error as Error).message.includes('API')) {
      throw new Error('کلید API برای Google AI تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.');
    }
    
    // در صورت خطا، یک پیام مناسب برمی‌گردانیم
    throw new Error(`خطا در ارتباط با Google AI: ${(error as Error).message}`);
  }
}

/**
 * کلاس سرویس Google AI
 */
export class GoogleAIService {
  /**
   * تولید پاسخ با استفاده از مدل Google AI
   * @param prompt متن پرامپت
   * @returns پاسخ تولید شده
   */
  async generateResponse(prompt: string): Promise<string> {
    return generateGoogleAIResponse(prompt);
  }
  
  /**
   * تست سرعت پاسخگویی سرویس Google AI
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا (مقدار منفی)
   */
  async pingGoogleAI(): Promise<number> {
    try {
      if (!GOOGLE_AI_API_KEY) {
        return -401; // خطای احراز هویت
      }
      
      const aiSettings = botConfig.getAISettings();
      const model = aiSettings.googleModel || 'gemini-pro';
      const startTime = Date.now();
      
      // URL API
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;
      
      // تنظیمات درخواست - خیلی ساده برای تست سرعت
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "سلام"
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 5
        }
      };
      
      // ارسال درخواست به API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      console.error('Error in Google AI ping test:', error);
      
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

// ایجاد نمونه از سرویس Google AI برای استفاده در سراسر برنامه
export const googleAIService = new GoogleAIService();