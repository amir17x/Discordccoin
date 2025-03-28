import OpenAI from 'openai';
import { botConfig } from '../utils/config';

// کلید OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ایجاد نمونه از OpenAI API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

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
    const model = botConfig.ai?.openaiModel || 'gpt-3.5-turbo';
    
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