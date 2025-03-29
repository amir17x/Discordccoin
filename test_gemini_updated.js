/**
 * اسکریپت تست برای سرویس Gemini API با استفاده از SDK جدید
 * این اسکریپت بر اساس مستندات جدید Google AI برای Gemini 1.5 ساخته شده است
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// مقداردهی اولیه با کلید API
const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('❌ خطا: کلید API گوگل تنظیم نشده است. لطفاً متغیر محیطی GOOGLE_AI_API_KEY را تنظیم کنید.');
  process.exit(1);
}

// ایجاد نمونه از کلاس GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * تابع اصلی تست Gemini API
 */
async function testGeminiAPI() {
  try {
    console.log('🧪 شروع تست سرویس Gemini API...');
    
    // تست ارتباط با سرویس و دریافت پاسخ
    console.log('📡 تست اتصال به سرویس Gemini...');
    
    // 1. انتخاب مدل Gemini 1.5 Flash - سریع‌تر و کارآمدتر از لحاظ منابع
    const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // 2. ارسال یک پرامپت ساده به مدل
    const prompt = "لطفاً یک معرفی کوتاه درباره خودت به زبان فارسی ارائه بده";
    console.log(`📝 ارسال پرامپت به Gemini: "${prompt}"`);
    
    // 3. زمان‌سنجی برای بررسی سرعت پاسخگویی
    const startTime = Date.now();
    const result = await modelFlash.generateContent(prompt);
    const endTime = Date.now();
    
    // 4. استخراج و نمایش پاسخ
    const response = await result.response;
    console.log('\n📊 نتایج آزمایش:');
    console.log('----------------------------');
    console.log('🤖 پاسخ دریافتی:\n');
    console.log(response.text());
    console.log('\n----------------------------');
    
    // 5. نمایش آمار پاسخگویی
    const responseTime = endTime - startTime;
    console.log(`⏱️ زمان پاسخگویی: ${responseTime}ms`);
    console.log(`🔢 تعداد کاراکترهای پاسخ: ${response.text().length}`);
    
    // 6. تست کامل شد
    console.log('✅ تست سرویس Gemini با موفقیت انجام شد!');
    
    return {
      success: true,
      responseTime,
      responseLength: response.text().length,
      model: "gemini-1.5-flash"
    };
    
  } catch (error) {
    // نمایش جزئیات خطا
    console.error('❌ خطا در تست سرویس Gemini:', error);
    
    // تشخیص نوع خطا
    let errorType = "UNKNOWN";
    let errorMessage = error.message;
    
    if (error.message.includes("invalid api key")) {
      errorType = "INVALID_API_KEY";
      errorMessage = "کلید API نامعتبر است. لطفاً کلید را بررسی و تصحیح کنید.";
    } else if (error.message.includes("429") || error.message.includes("quota")) {
      errorType = "QUOTA_EXCEEDED";
      errorMessage = "سهمیه استفاده از API به پایان رسیده است.";
    } else if (error.message.includes("500") || error.message.includes("server")) {
      errorType = "SERVER_ERROR";
      errorMessage = "خطای سرور گوگل. لطفاً بعداً دوباره تلاش کنید.";
    } else if (error.message.includes("timeout") || error.message.includes("ECONNREFUSED")) {
      errorType = "CONNECTION_ERROR";
      errorMessage = "خطا در برقراری ارتباط با سرویس Google AI.";
    }
    
    return {
      success: false,
      errorType,
      errorMessage,
      originalError: error.message
    };
  }
}

/**
 * اجرای تست
 */
(async () => {
  console.log('🤖 شروع آزمایش سرویس Google Gemini API...');
  const result = await testGeminiAPI();
  
  if (result.success) {
    console.log(`\n🎉 تست با موفقیت انجام شد. زمان پاسخگویی: ${result.responseTime}ms`);
  } else {
    console.error(`\n⚠️ تست ناموفق بود: ${result.errorType} - ${result.errorMessage}`);
  }
  
  console.log('\n📋 نتایج کامل:');
  console.log(JSON.stringify(result, null, 2));
})();