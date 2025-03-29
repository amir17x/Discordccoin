import { botConfig } from '../utils/config';
import { createGeminiPrompt, createShortGeminiPrompt } from '../utils/botGeminiPrompt';

// کلید Google AI API
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';

// کش برای ذخیره تعاملات API و کاهش تعداد درخواست‌ها
interface CacheItem {
  prompt: string;
  response: string;
  timestamp: number;
}

// اندازه کش و زمان نگهداری
const CACHE_SIZE = 100; // حداکثر تعداد آیتم‌های کش شده
const CACHE_TTL = 30 * 60 * 1000; // 30 دقیقه به میلی‌ثانیه

// آرایه کش
const responseCache: CacheItem[] = [];

/**
 * بررسی کش برای یافتن پاسخ قبلی به یک پرامپت مشابه
 * @param prompt متن پرامپت
 * @returns پاسخ کش شده یا null
 */
function getCachedResponse(prompt: string): string | null {
  const now = Date.now();
  // حذف آیتم‌های منقضی شده
  while (responseCache.length > 0 && (now - responseCache[0].timestamp) > CACHE_TTL) {
    responseCache.shift();
  }
  
  // یافتن پرامپت مشابه در کش
  const cachedItem = responseCache.find(item => item.prompt === prompt);
  return cachedItem ? cachedItem.response : null;
}

/**
 * افزودن پاسخ به کش
 * @param prompt متن پرامپت
 * @param response پاسخ تولید شده
 */
function addToCache(prompt: string, response: string): void {
  // اگر کش پر است، قدیمی‌ترین آیتم را حذف می‌کنیم
  if (responseCache.length >= CACHE_SIZE) {
    responseCache.shift();
  }
  
  // افزودن آیتم جدید به کش
  responseCache.push({
    prompt,
    response,
    timestamp: Date.now()
  });
}

/**
 * تولید پاسخ با استفاده از مدل Google AI (Gemini) با کش و بهینه‌سازی
 * @param prompt متن پرامپت
 * @returns پاسخ تولید شده
 */
export async function generateGoogleAIResponse(prompt: string, customStyle?: string): Promise<string> {
  try {
    // ابتدا کش را بررسی می‌کنیم
    const cachedResponse = getCachedResponse(prompt);
    if (cachedResponse) {
      console.log('Using cached Google AI response');
      return cachedResponse;
    }
    
    // اگر کلید API موجود نیست، خطا ایجاد می‌کنیم
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('کلید API برای Google AI تنظیم نشده است.');
    }

    // مدل پیش‌فرض یا مدل تنظیم شده در تنظیمات
    const aiSettings = botConfig.getAISettings();
    const model = aiSettings.googleModel || 'gemini-1.5-pro';
    
    // URL API - استفاده از نسخه v1 به جای v1beta
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;
    
    // تنظیمات درخواست با بهینه‌سازی، راهنمای Gemini و سبک پاسخگویی
    // تنظیم دما و توکن‌ها بر اساس سبک پاسخگویی
    let temperature = 0.7;
    let maxOutputTokens = 500;
    
    // تنظیم پارامترها بر اساس سبک پاسخگویی
    // اولویت با سبک سفارشی است، در غیر این صورت از تنظیمات کلی استفاده می‌شود
    const responseStyle = customStyle || aiSettings.responseStyle || 'متعادل';
    if (responseStyle === 'خلاقانه') {
      temperature = 0.9;
      maxOutputTokens = 600;
    } else if (responseStyle === 'دقیق') {
      temperature = 0.3;
      maxOutputTokens = 450;
    } else if (responseStyle === 'طنزآمیز') {
      temperature = 0.85;
      maxOutputTokens = 550;
    }
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: createGeminiPrompt(prompt, responseStyle)
            }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxOutputTokens,
        topP: 0.9
      },
      // تنظیمات کارایی - بهینه سازی سرعت
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    console.log(`Sending request to Google AI (model: ${model})`);
    
    // ارسال درخواست به API با تایم‌اوت
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // تایم‌اوت 7 ثانیه
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // پاک کردن تایمر تایم‌اوت
      
      // بررسی موفقیت‌آمیز بودن درخواست
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`خطای API (${response.status}): ${errorText}`);
      }

      // استخراج پاسخ
      const responseData = await response.json();
      const generatedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const result = generatedText.trim() || 'پاسخی دریافت نشد.';
      
      // افزودن پاسخ به کش
      addToCache(prompt, result);
      
      return result;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError && fetchError.name === 'AbortError') {
        throw new Error('درخواست به Google AI به دلیل تایم‌اوت لغو شد.');
      }
      throw fetchError;
    }
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
   * @param customStyle سبک پاسخگویی سفارشی (اختیاری)
   * @returns پاسخ تولید شده
   */
  async generateResponse(prompt: string, customStyle?: string): Promise<string> {
    // اگر سبک سفارشی ارائه شده باشد از آن استفاده می‌کنیم، در غیر این صورت 
    // از تنظیمات پیش‌فرض استفاده می‌شود
    const aiSettings = botConfig.getAISettings();
    const responseStyle = customStyle || aiSettings.responseStyle;
    
    // تغییر شکل متن ورودی برای حذف کاراکترهای غیرمجاز و بهبود جریان مکالمه
    const cleanPrompt = prompt.trim();
    
    console.log(`Generating AI response with style: ${responseStyle || 'default'}`);
    return generateGoogleAIResponse(cleanPrompt, responseStyle);
  }
  
  /**
   * تست سرعت پاسخگویی سرویس Google AI با تایم‌اوت و بهینه‌سازی سرعت
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا (مقدار منفی)
   */
  async pingGoogleAI(): Promise<number> {
    try {
      if (!GOOGLE_AI_API_KEY) {
        return -401; // خطای احراز هویت
      }
      
      const aiSettings = botConfig.getAISettings();
      const model = aiSettings.googleModel || 'gemini-1.5-pro';
      const startTime = Date.now();
      
      // URL API - استفاده از API بررسی وضعیت مدل به جای تولید محتوا برای سرعت بیشتر
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}?key=${GOOGLE_AI_API_KEY}`;
      
      // ایجاد تایم‌اوت برای جلوگیری از انتظار طولانی
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // تایم‌اوت 5 ثانیه
      
      try {
        // ارسال درخواست به API - فقط بررسی وضعیت مدل
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // پاک کردن تایمر تایم‌اوت
        
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError && fetchError.name === 'AbortError') {
          return -2; // کد برای تایم‌اوت
        }
        throw fetchError;
      }
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