/**
 * اسکریپت بررسی وجود و اطلاعات مدل آموزش‌دیده
 * این اسکریپت به بررسی فایل اطلاعات مدل آموزش‌دیده و نمایش آن می‌پردازد
 */

const fs = require('fs');
const path = require('path');

// مسیر فایل اطلاعات مدل آموزش‌دیده
const TUNED_MODEL_INFO_FILE = path.resolve(process.cwd(), 'tuned_model_info.json');

console.log('🔍 بررسی اطلاعات مدل آموزش‌دیده CCOIN AI');
console.log('=========================================');

// بررسی وجود فایل
if (fs.existsSync(TUNED_MODEL_INFO_FILE)) {
  console.log(`✅ فایل اطلاعات مدل در مسیر ${TUNED_MODEL_INFO_FILE} یافت شد`);
  
  try {
    // خواندن و نمایش محتوای فایل
    const fileContent = fs.readFileSync(TUNED_MODEL_INFO_FILE, 'utf8');
    const modelInfo = JSON.parse(fileContent);
    
    console.log('\n📊 اطلاعات مدل آموزش‌دیده:');
    console.log('--------------------------');
    console.log(`🆔 شناسه job: ${modelInfo.jobId || 'نامشخص'}`);
    console.log(`📋 نام مدل: ${modelInfo.modelName || 'نامشخص'}`);
    console.log(`🏷️ نام نمایشی: ${modelInfo.displayName || 'نامشخص'}`);
    console.log(`⏱️ تاریخ ایجاد: ${modelInfo.createdAt || 'نامشخص'}`);
    console.log(`🚦 وضعیت: ${modelInfo.state || 'نامشخص'}`);
    
    console.log('\n✅ مدل آموزش‌دیده در سیستم ثبت شده و آماده استفاده است');
    
  } catch (error) {
    console.error(`❌ خطا در خواندن یا پردازش فایل: ${error.message}`);
  }
} else {
  console.log('❌ فایل اطلاعات مدل آموزش‌دیده یافت نشد');
  console.log('\nبرای استفاده از مدل آموزش‌دیده، باید ابتدا یک job آموزش ایجاد کنید:');
  console.log('1. اجرای اسکریپت ccoin_ai_tuning.cjs');
  console.log('2. انتخاب گزینه 1 یا 2 برای آموزش مدل جدید');
  console.log('3. منتظر اتمام آموزش باشید (چند ساعت طول می‌کشد)');
}

// بررسی فایل‌های آموزشی
console.log('\n📚 بررسی فایل‌های آموزشی:');
console.log('-----------------------');

const trainingFiles = [
  'ccoin_ai_training.csv',
  'ccoin_ai_training.json',
  'ccoin_ai_training_updated.csv',
  'ccoin_ai_training_updated.json'
];

trainingFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  
  if (exists) {
    try {
      const stats = fs.statSync(file);
      console.log(`   📏 اندازه: ${(stats.size / 1024).toFixed(2)} کیلوبایت`);
      console.log(`   🕒 آخرین تغییر: ${stats.mtime.toLocaleString()}`);
      
      // تعداد خطوط فایل CSV
      if (file.endsWith('.csv')) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        console.log(`   📊 تعداد نمونه: ${lines.length - 1}`); // منهای هدر
      }
      
      // تعداد آیتم‌های فایل JSON
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          console.log(`   📊 تعداد نمونه: ${data.length}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ خطا در خواندن اطلاعات فایل: ${error.message}`);
    }
  }
});

console.log('\n✨ پایان بررسی');