/**
 * سرویس Vertex AI (Google Cloud) برای تولید محتوا با استفاده از هوش مصنوعی
 */

import { VertexAI } from '@google-cloud/vertexai';
import { botConfig } from '../utils/config';
import { createBotAIPrompt, createShortBotAIPrompt } from '../utils/botGeminiPrompt';
import axios from 'axios';

// تنظیمات پیش‌فرض
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'vortex-ai-project';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const API_KEY = process.env.VORTEX_AI_API_KEY || '';

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

// تنظیم اتصال به Vertex AI
let vertexai: VertexAI | null = null;

// ایجاد اتصال به Vertex AI
function setupVertexAI() {
  try {
    // ایجاد اتصال با استفاده از API key 
    vertexai = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
      apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
    });
    console.log('VertexAI connection established successfully');
    return true;
  } catch (error) {
    console.error('Error setting up VertexAI:', error);
    vertexai = null;
    return false;
  }
}

/**
 * تولید پاسخ با استفاده از مدل Vertex AI Gemini با کش و بهینه‌سازی
 * @param prompt متن پرامپت
 * @returns پاسخ تولید شده
 */
export async function generateVertexAIResponse(prompt: string, customStyle?: string): Promise<string> {
  try {
    // ابتدا کش را بررسی می‌کنیم
    const cachedResponse = getCachedResponse(prompt);
    if (cachedResponse) {
      console.log('Using cached Vertex AI response');
      return cachedResponse;
    }
    
    // اگر کلید API موجود نیست، خطا ایجاد می‌کنیم
    if (!API_KEY) {
      throw new Error('کلید API برای Vertex AI تنظیم نشده است.');
    }
    
    // مدل پیش‌فرض یا مدل تنظیم شده در تنظیمات
    const aiSettings = botConfig.getAISettings();
    const modelName = aiSettings.googleModel || 'gemini-1.5-pro';
    
    // تنظیم پارامترها بر اساس سبک پاسخگویی
    let temperature = 0.7;
    let maxOutputTokens = 500;
    
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
    
    console.log(`Sending direct API request to Gemini API (model: ${modelName})`);
    
    // تنظیم محتوای درخواست
    const formattedPrompt = createBotAIPrompt(prompt, responseStyle);
    
    // استفاده از Gemini API به جای Vertex AI
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    
    const requestData = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: formattedPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP: 0.9
      },
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
    
    // ارسال درخواست با تایم‌اوت
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('درخواست به Gemini API به دلیل تایم‌اوت لغو شد.')), 8000)
    );
    
    const responsePromise = axios.post(geminiURL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      const data = response.data;
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return generatedText.trim() || 'پاسخی دریافت نشد.';
    });
    
    // اجرای درخواست با تایم‌اوت
    const result = await Promise.race([responsePromise, timeoutPromise]);
    
    // افزودن پاسخ به کش
    addToCache(prompt, result);
    
    return result;
  } catch (error) {
    console.error('Error in Vertex AI API call:', error);
    
    // اگر خطا مربوط به عدم وجود کلید API است، پیام مناسب را برگردانیم
    if ((error as Error).message.includes('API')) {
      throw new Error('کلید API برای Vertex AI تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.');
    }
    
    // بررسی خطاهای HTTP
    if (axios.isAxiosError(error) && error.response) {
      console.error(`API Error: Status ${error.response.status}, Data:`, error.response.data);
      
      // خطای محدودیت سهمیه
      if (error.response.status === 429) {
        throw new Error('محدودیت سهمیه Gemini API فرا رسیده است. لطفاً کمی صبر کنید و دوباره تلاش کنید.');
      }
      
      // خطای احراز هویت
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('خطای احراز هویت در Gemini API. لطفاً کلید API را بررسی کنید.');
      }
    }
    
    // در صورت خطا، یک پیام مناسب برمی‌گردانیم
    throw new Error(`خطا در ارتباط با Gemini API: ${(error as Error).message}`);
  }
}

/**
 * کلاس سرویس Vertex AI
 */
export class VertexAIService {
  /**
   * تولید پاسخ با استفاده از مدل Vertex AI
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
    
    console.log(`Generating Vertex AI response with style: ${responseStyle || 'default'}`);
    return generateVertexAIResponse(cleanPrompt, responseStyle);
  }
  
  /**
   * تست سرعت پاسخگویی سرویس Vertex AI با تایم‌اوت و بهینه‌سازی سرعت
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا (مقدار منفی)
   */
  async pingVertexAI(): Promise<number> {
    try {
      if (!API_KEY) {
        return -401; // خطای احراز هویت
      }
      
      const startTime = Date.now();
      
      // ارسال یک درخواست ساده برای بررسی وضعیت سرویس
      const aiSettings = botConfig.getAISettings();
      const modelName = aiSettings.googleModel || 'gemini-1.5-pro';
      
      // URL برای پینگ Gemini API
      const pingURL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}?key=${API_KEY}`;
      
      // ایجاد تایم‌اوت برای جلوگیری از انتظار طولانی
      const timeoutPromise = new Promise<number>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 5000)
      );
      
      const responsePromise = axios.get(pingURL)
        .then(_ => Date.now() - startTime);
      
      // اجرای درخواست با تایم‌اوت
      return await Promise.race([responsePromise, timeoutPromise]);
    } catch (error) {
      console.error('Error in Gemini API ping test:', error);
      
      // بررسی خطاهای HTTP
      if (axios.isAxiosError(error) && error.response) {
        console.error(`Ping API Error: Status ${error.response.status}`);
        
        // خطای محدودیت سهمیه
        if (error.response.status === 429) {
          return -429;
        }
        
        // خطای احراز هویت
        if (error.response.status === 401 || error.response.status === 403) {
          return -401;
        }
        
        // خطای سرور
        if (error.response.status >= 500) {
          return -500;
        }
      }
      
      // تشخیص نوع خطا و برگرداندن کد خطای مناسب
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage === 'TIMEOUT') {
        return -2; // کد برای تایم‌اوت
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
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

// نصب اتصال اولیه به Vertex AI
setupVertexAI();

// ایجاد نمونه از سرویس Vertex AI برای استفاده در سراسر برنامه
export const vertexAIService = new VertexAIService();