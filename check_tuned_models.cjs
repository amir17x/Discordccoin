/**
 * اسکریپت بررسی مدل‌های آموزش‌دیده CCOIN AI
 * این اسکریپت لیست مدل‌های آموزش‌دیده را دریافت می‌کند
 */

const axios = require('axios');
require('dotenv').config();

// دریافت کلید API از متغیرهای محیطی
const API_KEY = process.env.GOOGLE_AI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * لیست کردن تمام مدل‌های آموزش‌دیده
 */
async function listTunedModels() {
  try {
    if (!API_KEY) {
      console.error('❌ کلید API تنظیم نشده است');
      console.log('لطفاً مطمئن شوید که متغیر محیطی GOOGLE_AI_API_KEY در فایل .env تنظیم شده است');
      return;
    }
    
    console.log('🔍 در حال دریافت لیست مدل‌های آموزش‌دیده...');

    // استفاده از API REST برای دریافت لیست مدل‌ها
    const response = await axios.get(
      `${BASE_URL}/tunedModels?key=${API_KEY}`,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // بررسی پاسخ
    console.log("پاسخ API:", JSON.stringify(response.data, null, 2));
    
    if (!response.data || !response.data.tunedModels) {
      console.log('❌ هیچ مدل آموزش‌دیده‌ای یافت نشد یا پاسخ API نامعتبر است');
      return;
    }
    
    const models = response.data.tunedModels;
    
    console.log(`\n✅ تعداد ${models.length} مدل آموزش‌دیده یافت شد`);
    console.log('-----------------------------------------------------');
    
    // نمایش جزئیات هر مدل
    models.forEach((model, index) => {
      console.log(`\n🔹 مدل ${index + 1}:`);
      console.log(`   📝 نام کامل: ${model.tunedModelName}`);
      console.log(`   🏷️ نام نمایشی: ${model.displayName || 'نامشخص'}`);
      console.log(`   📊 وضعیت: ${model.state || 'نامشخص'}`);
      
      if (model.createTime) {
        const createDate = new Date(model.createTime);
        console.log(`   🕒 تاریخ ایجاد: ${createDate.toLocaleString()}`);
      }
      
      if (model.description) {
        console.log(`   📋 توضیحات: ${model.description}`);
      }
    });
    
  } catch (error) {
    console.error(`❌ خطا در دریافت لیست مدل‌ها: ${error.message}`);
    
    if (error.response && error.response.data) {
      console.error(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`);
    }
  }
}

// اجرای اسکریپت
listTunedModels();