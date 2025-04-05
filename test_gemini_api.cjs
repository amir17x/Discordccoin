/**
 * اسکریپت تست ساده API Gemini
 * این اسکریپت یک درخواست ساده به Gemini API ارسال می‌کند تا از صحت کارکرد API اطمینان حاصل شود
 */

const axios = require('axios');
require('dotenv').config();

// دریافت کلید API از متغیرهای محیطی
const API_KEY = process.env.GOOGLE_AI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * تست ساده مدل Gemini
 */
async function testGeminiAPI() {
  try {
    if (!API_KEY) {
      console.error('❌ کلید API تنظیم نشده است');
      console.log('لطفاً مطمئن شوید که متغیر محیطی GOOGLE_AI_API_KEY در فایل .env تنظیم شده است');
      return;
    }
    
    console.log('🔍 تست ساده API Gemini...');
    console.log(`🔑 استفاده از کلید API: ${API_KEY.substring(0, 4)}...${API_KEY.slice(-4)}`);

    // تست ساده با یک درخواست generateContent به مدل استاندارد
    const response = await axios.post(
      `${BASE_URL}/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        contents: [{ parts: [{ text: "سلام! لطفاً خودت را معرفی کن." }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log("\n✅ تست API موفقیت‌آمیز بود");
    console.log("پاسخ API:");
    console.log("--------------------------");
    
    if (response.data && 
        response.data.candidates && 
        response.data.candidates[0] && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0]) {
      
      const answer = response.data.candidates[0].content.parts[0].text;
      console.log(answer);
    } else {
      console.log("پاسخ API:", JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error(`❌ خطا در تست API: ${error.message}`);
    
    if (error.response) {
      console.error(`📌 کد وضعیت HTTP: ${error.response.status}`);
      console.error(`📌 پیام خطا: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// اجرای اسکریپت
testGeminiAPI();