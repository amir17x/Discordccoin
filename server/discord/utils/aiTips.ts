import { huggingFaceService } from "../services/huggingface";
import { log } from "../../vite";

/**
 * مجموعه موضوعات تخصصی برای تولید نکات
 * هر موضوع به عنوان یک دسته‌بندی برای تولید نکات توسط هوش مصنوعی استفاده می‌شود
 */
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
 * تولید یک نکته اتفاقی با استفاده از Hugging Face
 * @returns قول برای دریافت یک نکته تولید شده توسط هوش مصنوعی
 */
export async function generateAITip(): Promise<string> {
  try {
    // انتخاب یک موضوع اتفاقی از لیست موضوعات
    const randomTopic = tipTopics[Math.floor(Math.random() * tipTopics.length)];
    
    // ساخت پرامپت برای Hugging Face
    const prompt = `به عنوان یک متخصص در ربات دیسکورد Ccoin که دارای سیستم اقتصادی، کلن‌ها، بازی‌های گروهی، و مدیریت آیتم‌هاست، 
      یک نکته جالب، کوتاه و کاربردی (حداکثر ۴ جمله) با موضوع "${randomTopic}" به فارسی بنویس.
      پاسخ باید فقط شامل متن نکته باشد، بدون عنوان یا مقدمه. از ایموجی‌های مناسب استفاده کن تا جذاب‌تر شود.`;
    
    // دریافت پاسخ از Hugging Face
    const response = await huggingFaceService.getAIResponse(prompt, {
      maxTokens: 150,
      temperature: 0.8 // کمی خلاقیت بیشتر برای تنوع در نکات
    });
    
    log(`AI tip generated successfully with topic: ${randomTopic}`, 'discord');
    
    return response;
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
export async function generateTopicTip(topic: string): Promise<string> {
  try {
    // ساخت پرامپت برای Hugging Face
    const prompt = `به عنوان یک متخصص در ربات دیسکورد Ccoin که دارای سیستم اقتصادی، کلن‌ها، بازی‌های گروهی، و مدیریت آیتم‌هاست، 
      یک نکته جالب، کوتاه و کاربردی (حداکثر ۴ جمله) با موضوع "${topic}" به فارسی بنویس.
      پاسخ باید فقط شامل متن نکته باشد، بدون عنوان یا مقدمه. از ایموجی‌های مناسب استفاده کن تا جذاب‌تر شود.`;
    
    // دریافت پاسخ از Hugging Face
    const response = await huggingFaceService.getAIResponse(prompt, {
      maxTokens: 150,
      temperature: 0.7
    });
    
    log(`AI topic tip generated successfully for topic: ${topic}`, 'discord');
    
    return response;
  } catch (error) {
    log(`Error generating AI topic tip: ${error}`, 'error');
    
    // در صورت خطا، یک نکته پیش‌فرض برگردان
    return `💡 ${topic} یکی از ویژگی‌های مهم ربات Ccoin است که به شما کمک می‌کند تجربه بهتری داشته باشید. برای اطلاعات بیشتر از دستور /help استفاده کنید!`;
  }
}