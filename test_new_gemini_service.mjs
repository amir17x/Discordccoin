/**
 * اسکریپت تست برای سرویس جدید Gemini با استفاده از ES modules
 */
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testNewGeminiSDK() {
  console.log('🧪 شروع تست SDK جدید Gemini...');
  
  // بررسی کلید API
  const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('❌ خطا: کلید API گوگل تنظیم نشده است. لطفاً متغیر محیطی GOOGLE_AI_API_KEY را تنظیم کنید.');
    process.exit(1);
  }
  
  try {
    // ایجاد نمونه از API
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log('📡 تست اتصال به سرویس...');
    
    // تست تولید محتوا
    console.log('📝 تست تولید محتوا...');
    const prompt = "لطفاً یک داستان کوتاه طنز به زبان فارسی در حداکثر 100 کلمه درباره یک گربه و یک سگ بنویس.";
    
    console.log(`💬 ارسال پرامپت: "${prompt}"`);
    const startTime = Date.now();
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const endTime = Date.now();
    
    console.log('\n📊 نتایج:');
    console.log('----------------------------');
    console.log('🤖 پاسخ دریافتی:\n');
    console.log(text);
    console.log('\n----------------------------');
    
    const responseTime = endTime - startTime;
    console.log(`⏱️ زمان پاسخگویی: ${responseTime}ms`);
    console.log(`🔢 تعداد کاراکترهای پاسخ: ${text.length}`);
    
    console.log('✅ تست SDK جدید Gemini با موفقیت انجام شد!');
    
  } catch (error) {
    console.error('❌ خطا در تست SDK Gemini:', error);
  }
}

// اجرای تست
testNewGeminiSDK();