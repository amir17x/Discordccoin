/**
 * سرویس تولید نکات با استفاده از CCOIN AI
 * این فایل جایگزین هاگینگ فیس شده و از سرویس CCOIN AI (Gemini) استفاده می‌کند
 */

import { generateAIResponse } from './aiService';
import { log } from '../../vite';

// مجموعه موضوعات تخصصی برای تولید نکات
export const tipTopics = [
  "اقتصاد و مدیریت Ccoin",
  "استراتژی‌های بازی و رقابت",
  "ویژگی‌های پنهان ربات",
  "قابلیت‌های جدید",
  "راهکارهای افزایش درآمد",
  "منابع کسب Ccoin",
  "مدیریت کلن‌ها",
  "شخصی‌سازی پروفایل",
  "رازهای موفقیت در بازی‌های گروهی",
  "نکات امنیتی و محافظت از حساب",
  "ترفندهای معاملات",
  "مزایای عضویت در کلن‌ها",
  "نکاتی برای تازه‌واردان",
  "استفاده بهینه از فروشگاه",
  "آیتم‌های ویژه و کاربرد آن‌ها"
];

/**
 * سرویس نکات CCOIN AI
 */
export class CcoinAiTipService {
  /**
   * تولید یک نکته اتفاقی با استفاده از CCOIN AI
   * @returns قول برای دریافت یک نکته تولید شده توسط هوش مصنوعی
   */
  async generateRandomTip(): Promise<string> {
    try {
      // انتخاب یک موضوع اتفاقی از لیست موضوعات
      const randomTopic = tipTopics[Math.floor(Math.random() * tipTopics.length)];
      
      return this.generateTopicTip(randomTopic);
    } catch (error) {
      log(`Error generating AI tip: ${error}`, 'error');
      
      // در صورت خطا، یک نکته پیش‌فرض برگردان
      return "💡 با استفاده از دستور `/daily` می‌توانید هر ۲۴ ساعت یکبار جایزه روزانه خود را دریافت کنید. با حفظ استریک ۷ روزه، جوایز ویژه‌ای دریافت خواهید کرد!";
    }
  }

  /**
   * تولید یک نکته در مورد موضوع مشخص
   * @param topic موضوع برای تولید نکته
   * @returns قول برای دریافت یک نکته تولید شده توسط هوش مصنوعی
   */
  async generateTopicTip(topic: string): Promise<string> {
    try {
      // ساخت پرامپت برای CCOIN AI با لحن خودمانی و انرژیک
      const prompt = `به عنوان CCOIN AI که دستیار هوشمند و کول ربات Ccoin هستی (یک ربات دیسکورد با سیستم اقتصادی، کلن‌ها، بازی‌های گروهی)، 
        یک نکته جذاب، خودمانی و کاربردی (حداکثر ۳ جمله) با موضوع "${topic}" ارائه بده.
        
        شرایط مهم:
        1. پاسخ حتماً باید به زبان فارسی و کاملاً خودمانی و صمیمی باشد
        2. حتماً از ایموجی‌های متنوع و زیاد استفاده کن (حداقل 3-5 ایموجی)
        3. لحن پاسخ خیلی خودمانی و جوان‌پسند باشد، مثلاً "بچه‌ها!"، "رفقا"، "داداش" و غیره استفاده کن
        4. پاسخ فقط شامل متن نکته باشد، بدون عنوان یا مقدمه اضافی
        5. از اصطلاحات محاوره‌ای و جوانانه استفاده کن (مثل "خفن"، "باحال"، "ایول" و غیره)
        6. سعی کن نکته خیلی جذاب، پرانرژی و خفن باشد
        7. هیچوقت لحن رسمی و خشک نداشته باش`;
      
      // دریافت پاسخ از CCOIN AI
      const response = await generateAIResponse(prompt, 'other', 'خلاقانه');
      
      log(`AI topic tip generated successfully for topic: ${topic}`, 'discord');
      log(`🤖 نکته هوشمند با موضوع ${topic} با استفاده از CCOIN AI تولید شد.`);
      
      return response;
    } catch (error) {
      log(`Error generating AI topic tip: ${error}`, 'error');
      
      // در صورت خطا، یک نکته پیش‌فرض برگردان
      return `💡 ${topic} یکی از ویژگی‌های مهم ربات Ccoin است که به شما کمک می‌کند تجربه بهتری داشته باشید. برای اطلاعات بیشتر از دستور /help استفاده کنید!`;
    }
  }

  /**
   * بررسی وضعیت اتصال به سرویس CCOIN AI
   * @returns وضعیت اتصال به سرویس
   */
  async checkConnectionStatus(): Promise<{
    isAvailable: boolean;
    message: string;
    statusCode: number;
  }> {
    try {
      // تست اتصال به سرویس با یک پرامپت ساده
      const prompt = "لطفاً پاسخ خیلی کوتاهی بده: 1+1 چند می‌شود؟";
      const startTime = Date.now();
      
      const response = await generateAIResponse(prompt, 'other', 'دقیق');
      const latency = Date.now() - startTime;
      
      if (response) {
        return {
          isAvailable: true,
          message: `سرویس CCOIN AI در دسترس است. (زمان پاسخ: ${latency}ms)`,
          statusCode: 200
        };
      } else {
        return {
          isAvailable: false,
          message: 'پاسخی از سرویس CCOIN AI دریافت نشد.',
          statusCode: 500
        };
      }
    } catch (error) {
      console.error('Error checking CCOIN AI connectivity:', error);
      return {
        isAvailable: false,
        message: 'خطا در بررسی وضعیت اتصال به سرویس CCOIN AI.',
        statusCode: 500
      };
    }
  }
}

// ایجاد نمونه از سرویس CCOIN AI برای استفاده در سراسر برنامه
export const ccoinAiTipService = new CcoinAiTipService();

export default ccoinAiTipService;