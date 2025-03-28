import { HfInference } from '@huggingface/inference';
import { botConfig } from '../utils/config';

// کلید Hugging Face API
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

// ایجاد نمونه از Hugging Face API
const hf = new HfInference(HUGGINGFACE_API_KEY);

/**
 * تولید پاسخ با استفاده از مدل Hugging Face
 * @param prompt متن پرامپت
 * @returns پاسخ تولید شده
 */
export async function generateHuggingFaceResponse(prompt: string): Promise<string> {
  try {
    // اگر کلید API موجود نیست، خطا ایجاد می‌کنیم
    if (!HUGGINGFACE_API_KEY) {
      throw new Error('کلید API برای Hugging Face تنظیم نشده است.');
    }

    // مدل پیش‌فرض یا مدل تنظیم شده در تنظیمات
    const model = botConfig.ai?.huggingfaceModel || 'mistralai/Mistral-7B-Instruct-v0.2';
    
    // تنظیمات درخواست
    const payload = {
      inputs: `<s>[INST] ${prompt} [/INST]`,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      }
    };
    
    console.log(`Sending request to Hugging Face (model: ${model})`);
    
    // ارسال درخواست به API
    const response = await hf.textGeneration({
      model: model,
      inputs: payload.inputs,
      parameters: payload.parameters
    });

    // استخراج پاسخ
    const generatedText = response.generated_text;

    // حذف بخش پرامپت از ابتدای پاسخ
    let cleanedResponse = generatedText.replace(payload.inputs, '').trim();
    
    // حذف علامت‌های اضافی
    cleanedResponse = cleanedResponse.replace(/^\s*<\/s>\s*/, '');
    
    return cleanedResponse || 'پاسخی دریافت نشد.';

  } catch (error) {
    console.error('Error in Hugging Face API call:', error);
    
    // اگر خطا مربوط به عدم وجود کلید API است، پیام مناسب را برگردانیم
    if ((error as Error).message.includes('API')) {
      throw new Error('کلید API برای Hugging Face تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.');
    }
    
    // در صورت خطا، یک پیام مناسب برمی‌گردانیم
    throw new Error(`خطا در ارتباط با Hugging Face: ${(error as Error).message}`);
  }
}