/**
 * ماژول نکات هوشمند - این فایل صرفاً برای سازگاری با کد موجود حفظ شده و
 * قابلیت‌های اصلی آن به فایل ccoinAiTipService منتقل شده است
 */

import { log } from "../../vite";
import { ccoinAiTipService, tipTopics } from "../services/ccoinAiTipService";

// صادر کردن مجموعه موضوعات از سرویس
export { tipTopics };

/**
 * تولید یک نکته اتفاقی با استفاده از CCOIN AI
 * @returns قول برای دریافت یک نکته تولید شده توسط هوش مصنوعی
 */
export async function generateAITip(): Promise<string> {
  try {
    // استفاده از سرویس CCOIN AI برای تولید نکته اتفاقی
    return await ccoinAiTipService.generateRandomTip();
  } catch (error) {
    log(`Error generating AI tip: ${error}`, 'error');
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
    // استفاده از سرویس CCOIN AI برای تولید نکته با موضوع مشخص
    return await ccoinAiTipService.generateTopicTip(topic);
  } catch (error) {
    log(`Error generating AI topic tip: ${error}`, 'error');
    return `💡 ${topic} یکی از ویژگی‌های مهم ربات Ccoin است که به شما کمک می‌کند تجربه بهتری داشته باشید. برای اطلاعات بیشتر از دستور /help استفاده کنید!`;
  }
}