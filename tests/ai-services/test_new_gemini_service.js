/**
 * اسکریپت تست برای سرویس جدید Gemini
 */
require('dotenv').config();
const { GeminiService } = require('./server/discord/services/geminiService');

async function testNewGeminiService() {
  console.log('🧪 شروع تست سرویس جدید Gemini...');
  
  // بررسی کلید API
  const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('❌ خطا: کلید API گوگل تنظیم نشده است. لطفاً متغیر محیطی GOOGLE_AI_API_KEY را تنظیم کنید.');
    process.exit(1);
  }
  
  // ایجاد نمونه از سرویس
  const geminiService = new GeminiService();
  
  try {
    console.log('📡 تست اتصال به سرویس...');
    const isConnected = await geminiService.testConnection();
    
    if (!isConnected) {
      console.error('❌ تست اتصال ناموفق بود.');
      process.exit(1);
    }
    
    console.log('✅ اتصال به سرویس موفقیت‌آمیز بود.');
    
    // تست تولید محتوا
    console.log('📝 تست تولید محتوا...');
    const prompt = "لطفاً یک داستان کوتاه طنز به زبان فارسی در حداکثر 100 کلمه درباره یک گربه و یک سگ بنویس.";
    
    console.log(`💬 ارسال پرامپت: "${prompt}"`);
    const startTime = Date.now();
    const response = await geminiService.generateContent(prompt, 500, 0.7);
    const endTime = Date.now();
    
    console.log('\n📊 نتایج:');
    console.log('----------------------------');
    console.log('🤖 پاسخ دریافتی:\n');
    console.log(response);
    console.log('\n----------------------------');
    
    const responseTime = endTime - startTime;
    console.log(`⏱️ زمان پاسخگویی: ${responseTime}ms`);
    console.log(`🔢 تعداد کاراکترهای پاسخ: ${response.length}`);
    
    console.log('✅ تست سرویس جدید Gemini با موفقیت انجام شد!');
    
  } catch (error) {
    console.error('❌ خطا در تست سرویس Gemini:', error);
  }
}

// اجرای تست
testNewGeminiService();