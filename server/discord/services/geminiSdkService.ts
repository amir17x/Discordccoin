import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { log } from '../../vite';

// اینترفیس کمکی برای رفع خطای LSP
interface ExtendedRequestOptions {
  generationConfig?: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };
  signal?: AbortSignal;
  timeout?: number;
  apiVersion?: string;
}

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;

/**
 * سرویس CCOIN AI - موتور هوش مصنوعی اختصاصی ربات
 * این سرویس از کتابخانه رسمی @google/generative-ai استفاده می‌کند
 * با امکانات پیشرفته و تنظیمات مخصوص برای پاسخگویی هوشمندانه
 */
export class GeminiSdkService {
  private apiKey: string;
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  
  constructor() {
    this.apiKey = GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      log('سرویس CCOIN AI: کلید API تنظیم نشده است', 'warn');
    } else {
      try {
        // مقداردهی اولیه SDK
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        
        // انتخاب مدل پیشرفته برای پشتیبانی بهتر از فارسی و پاسخگویی هوشمندانه‌تر
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        log('سرویس CCOIN AI با موفقیت راه‌اندازی شد 🧠✨', 'info');
      } catch (error) {
        log(`خطا در راه‌اندازی سرویس CCOIN AI: ${error}`, 'error');
        this.genAI = null;
        this.model = null;
      }
    }
  }
  
  /**
   * ارسال درخواست به Gemini API
   * @param prompt متن ورودی
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContent(prompt: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    try {
      log(`ارسال درخواست به CCOIN AI: ${prompt.substring(0, 50)}...`, 'info');
      
      // تنظیم پیام با قالب خاص برای CCOIN AI
      const enhancedPrompt = this.enhancePrompt(prompt, temperature);
      
      // تنظیم پارامترهای تولید محتوا
      const generationConfig = {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 40
      };
      
      // ارسال درخواست به API
      const result = await this.model.generateContent(enhancedPrompt, {
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          topP: 0.8,
          topK: 40
        }
      } as ExtendedRequestOptions);
      
      // دریافت پاسخ
      const response = await result.response;
      let generatedText = response.text();
      
      // پردازش نهایی پاسخ برای اطمینان از سبک مناسب
      generatedText = this.postProcessResponse(generatedText);
      
      log(`پاسخ از CCOIN AI دریافت شد (${generatedText.length} کاراکتر) ✨`, 'info');
      return generatedText;
      
    } catch (error) {
      log('خطا در فراخوانی سرویس CCOIN AI: ' + error, 'error');
      
      // بررسی نوع خطا و ارائه پیام مناسب
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('401')) {
          throw new Error('خطای احراز هویت در سرویس CCOIN AI: کلید API نامعتبر است');
        } else if (errorMessage.includes('429')) {
          throw new Error('محدودیت نرخ سرویس CCOIN AI: تعداد درخواست‌ها بیش از حد مجاز است');
        } else if (errorMessage.includes('500')) {
          throw new Error(`خطای سرور سرویس CCOIN AI: ${errorMessage}`);
        } else {
          throw new Error(`خطای سرویس CCOIN AI: ${errorMessage}`);
        }
      }
      
      throw new Error(`خطا در سرویس CCOIN AI: خطای ناشناخته`);
    }
  }
  
  /**
   * بهبود پرامپت ورودی برای دریافت پاسخ‌های خلاقانه‌تر و شخصی‌تر
   * @param prompt متن درخواست اصلی
   * @param temperature میزان خلاقیت موردنظر
   * @returns پرامپت بهبود یافته
   */
  private enhancePrompt(prompt: string, temperature: number): string {
    // اگر دمای بالا (خلاقیت بالا) درخواست شده باشد
    if (temperature > 0.7) {
      return `تو یک دستیار هوشمند با نام CCOIN AI هستی. لطفا به سوال زیر با لحنی دوستانه، پر انرژی و خلاقانه پاسخ بده. از استفاده از ایموجی‌های مناسب و لحن صمیمی دریغ نکن. از ذکر نام Gemini یا Google خودداری کن.
      
درخواست کاربر: ${prompt}`;
    } 
    // برای حالت معمولی
    else if (temperature >= 0.4) {
      return `تو یک دستیار هوشمند با نام CCOIN AI هستی. لطفا به سوال زیر با لحنی متعادل و دوستانه پاسخ بده. از ایموجی‌های مناسب استفاده کن. از ذکر نام Gemini یا Google خودداری کن.
      
درخواست کاربر: ${prompt}`;
    } 
    // برای حالت دقیق (دمای پایین)
    else {
      return `تو یک دستیار هوشمند با نام CCOIN AI هستی. لطفا به سوال زیر با دقت و جامعیت پاسخ بده. از ذکر نام Gemini یا Google خودداری کن.
      
درخواست کاربر: ${prompt}`;
    }
  }
  
  /**
   * پردازش نهایی پاسخ برای اطمینان از سبک صحیح و حذف اشاره به Gemini
   * @param response پاسخ دریافتی از API
   * @returns پاسخ پردازش شده
   */
  private postProcessResponse(response: string): string {
    // حذف هرگونه اشاره به Gemini یا Google
    let processedResponse = response
      .replace(/Gemini/g, "CCOIN AI")
      .replace(/Google AI/g, "CCOIN AI")
      .replace(/Google Bard/g, "CCOIN AI")
      .replace(/Google's AI/g, "CCOIN AI")
      .replace(/I am an AI assistant/g, "من دستیار هوشمند CCOIN AI هستم");
      
    // اضافه کردن ایموجی به ابتدای پاسخ اگر ایموجی نداشته باشد
    if (!processedResponse.includes('🤖') && !processedResponse.includes('✨') && 
        !processedResponse.includes('🔮') && !processedResponse.includes('💫')) {
      const emojis = ['✨', '🤖', '🔮', '💫', '🧠', '🚀'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      processedResponse = `${randomEmoji} ${processedResponse}`;
    }
    
    return processedResponse;
  }
  
  /**
   * ارسال درخواست به Gemini API با استفاده از تصویر
   * @param prompt متن ورودی
   * @param imageBase64 تصویر به صورت Base64
   * @param maxTokens حداکثر تعداد توکن‌های خروجی
   * @param temperature دمای تولید پاسخ (0.0 تا 1.0)
   * @returns پاسخ تولید شده توسط مدل
   */
  async generateContentWithImage(prompt: string, imageBase64: string, mimeType: string = 'image/jpeg', maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
    if (!this.apiKey || !this.model) {
      throw new Error('سرویس CCOIN AI به درستی راه‌اندازی نشده است');
    }
    
    try {
      log(`ارسال درخواست با تصویر به CCOIN AI: ${prompt.substring(0, 50)}...`, 'info');
      
      // تنظیم پیام با قالب خاص برای CCOIN AI با تصویر
      const enhancedPrompt = `تو یک دستیار هوشمند با نام CCOIN AI هستی. لطفا به درخواست زیر با توجه به تصویر ارسالی پاسخ بده. سعی کن پاسخت دوستانه و کاربردی باشد. از استفاده از ایموجی‌های مناسب دریغ نکن. از ذکر نام Gemini یا Google خودداری کن.
      
درخواست کاربر: ${prompt}`;
      
      // تنظیم پارامترهای تولید محتوا
      const generationConfig = {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 40
      };
      
      // آماده سازی محتوای چندوجهی (متن و تصویر)
      const content = [
        { text: enhancedPrompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        }
      ];
      
      // ارسال درخواست چندوجهی (multimodal) به API با تنظیمات تولید
      const result = await this.model.generateContent(content, {
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          topP: 0.8,
          topK: 40
        }
      } as ExtendedRequestOptions);
      
      // دریافت پاسخ
      const response = await result.response;
      let generatedText = response.text();
      
      // پردازش نهایی پاسخ برای اطمینان از سبک مناسب
      generatedText = this.postProcessResponse(generatedText);
      
      log(`پاسخ از CCOIN AI با تصویر دریافت شد (${generatedText.length} کاراکتر) 🖼️✨`, 'info');
      return generatedText;
      
    } catch (error) {
      log('خطا در فراخوانی سرویس CCOIN AI با تصویر: ' + error, 'error');
      
      // مدیریت خطا مشابه متد generateContent
      if (error instanceof Error) {
        throw new Error(`خطای سرویس CCOIN AI: ${error.message}`);
      }
      
      throw new Error(`خطا در سرویس CCOIN AI: خطای ناشناخته`);
    }
  }
  
  /**
   * بررسی اینکه آیا سرویس قابل استفاده است یا خیر
   * @returns وضعیت سرویس
   */
  isAvailable(): boolean {
    return !!this.apiKey && !!this.model;
  }
  
  /**
   * آزمایش اتصال به سرویس
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateContent('سلام، لطفاً پاسخ خیلی کوتاهی بده: 1+1 چند می‌شود؟', 10, 0.1);
      return true;
    } catch (error) {
      log('تست اتصال سرویس CCOIN AI با شکست مواجه شد: ' + error, 'error');
      return false;
    }
  }
}

// ایجاد نمونه واحد از سرویس هوش مصنوعی CCOIN AI
const geminiSdkService = new GeminiSdkService();
export default geminiSdkService;