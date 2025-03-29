import axios from 'axios';
import { botConfig } from '../utils/config';

/**
 * تولید پاسخ با استفاده از مدل OpenRouter
 * @param prompt متن پرامپت
 * @returns پاسخ تولید شده
 */
export async function generateOpenRouterResponse(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('کلید API برای OpenRouter تنظیم نشده است');
    }

    const aiSettings = botConfig.getAISettings();
    const modelName = aiSettings.openrouter?.model || 'anthropic/claude-3-opus';
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ccoin.app', // جایگزین با دامنه واقعی
          'X-Title': 'Ccoin Discord Bot'
        }
      }
    );

    // بررسی پاسخ و استخراج متن
    if (response.data && 
        response.data.choices && 
        response.data.choices.length > 0 && 
        response.data.choices[0].message && 
        response.data.choices[0].message.content) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('پاسخ معتبری از OpenRouter دریافت نشد');
    }
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('OpenRouter API response status:', error.response.status);
      console.error('OpenRouter API response data:', error.response.data);
    }
    throw new Error(`خطا در ارتباط با OpenRouter: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
  }
}

/**
 * کلاس سرویس OpenRouter
 */
export class OpenRouterService {
  /**
   * تولید پاسخ با استفاده از مدل OpenRouter
   * @param prompt متن پرامپت
   * @returns پاسخ تولید شده
   */
  async generateResponse(prompt: string): Promise<string> {
    return generateOpenRouterResponse(prompt);
  }
  
  /**
   * تست سرعت پاسخگویی سرویس OpenRouter
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا (مقدار منفی)
   */
  async pingOpenRouter(): Promise<number> {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return -401; // خطای احراز هویت
      }
      
      const aiSettings = botConfig.getAISettings();
      const modelName = aiSettings.openrouter?.model || 'anthropic/claude-3-opus';
      const startTime = Date.now();
      
      // ارسال یک درخواست کوتاه برای تست سرعت
      try {
        await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: modelName,
            messages: [{ role: 'user', content: 'سلام' }],
            max_tokens: 5
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://ccoin.app',
              'X-Title': 'Ccoin Discord Bot'
            }
          }
        );
        
        return Date.now() - startTime;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // تشخیص نوع خطا بر اساس کد وضعیت HTTP
          const statusCode = error.response?.status;
          
          if (statusCode === 429) {
            return -429; // محدودیت تعداد درخواست
          } else if (statusCode === 401 || statusCode === 403) {
            return -401; // خطای احراز هویت
          } else if (statusCode && statusCode >= 500 && statusCode < 600) {
            return -500; // خطای سرور
          }
        }
        
        throw error; // پرتاب خطا برای پردازش در بلوک catch بیرونی
      }
    } catch (error) {
      console.error('Error in OpenRouter ping test:', error);
      
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

export const openRouterService = new OpenRouterService();