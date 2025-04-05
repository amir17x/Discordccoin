/**
 * اسکریپت تست ساده برای بررسی وضعیت مدل آموزش‌دیده در سرویس CCOIN AI
 * این اسکریپت، منطق موجود در ccoinAIService.ts را شبیه‌سازی می‌کند
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// تنظیمات
const CCOIN_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.CCOIN_AI_API_KEY;
const TUNED_MODEL_INFO_FILE = path.resolve(process.cwd(), 'tuned_model_info.json');

// کلاس ساده‌سازی شده سرویس CCOIN AI
class SimpleCcoinAIService {
  constructor() {
    this.apiKey = CCOIN_AI_API_KEY || '';
    this.hasTunedModel = false;
    this.tunedModel = null;
    this.modelInfo = null;
    
    if (this.apiKey) {
      console.log(`🔑 کلید API موجود است: ${this.apiKey.substring(0, 4)}...${this.apiKey.slice(-4)}`);
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.loadTunedModel();
    } else {
      console.error('❌ کلید API تنظیم نشده است');
    }
  }
  
  loadTunedModel() {
    try {
      console.log(`🔍 بررسی وجود فایل اطلاعات مدل در مسیر: ${TUNED_MODEL_INFO_FILE}`);
      
      if (fs.existsSync(TUNED_MODEL_INFO_FILE)) {
        console.log('✅ فایل اطلاعات مدل آموزش‌دیده یافت شد');
        const modelInfo = JSON.parse(fs.readFileSync(TUNED_MODEL_INFO_FILE, 'utf8'));
        
        if (modelInfo && modelInfo.modelName) {
          this.modelInfo = modelInfo;
          console.log(`📝 اطلاعات مدل: ${JSON.stringify(modelInfo, null, 2)}`);
          
          try {
            console.log(`🔄 تلاش برای بارگیری مدل آموزش‌دیده با نام ${modelInfo.modelName}...`);
            
            this.tunedModel = this.genAI.getGenerativeModel({
              model: modelInfo.modelName,
              systemInstruction: "تو دستیار هوشمند CCOIN AI برای بازی Ccoin هستی و برای پاسخگویی به سؤالات کاربران آموزش دیده‌ای."
            });
            
            this.hasTunedModel = true;
            console.log(`✅ مدل آموزش‌دیده CCOIN AI با نام ${modelInfo.modelName} بارگیری شد`);
          } catch (error) {
            console.error(`❌ خطا در بارگیری مدل آموزش‌دیده: ${error.message}`);
            if (error.stack) console.error(error.stack);
            this.hasTunedModel = false;
          }
        } else {
          console.error('❌ اطلاعات مدل ناقص است (نام مدل یافت نشد)');
        }
      } else {
        console.log('❌ فایل اطلاعات مدل آموزش‌دیده یافت نشد');
      }
    } catch (error) {
      console.error(`❌ خطا در بارگیری مدل آموزش‌دیده: ${error.message}`);
      if (error.stack) console.error(error.stack);
      this.hasTunedModel = false;
    }
  }
  
  hasTunedModelAvailable() {
    return this.hasTunedModel && this.tunedModel !== null;
  }
  
  async testTunedModel() {
    if (!this.hasTunedModelAvailable()) {
      console.log('❌ مدل آموزش‌دیده در دسترس نیست، تست انجام نمی‌شود');
      return false;
    }
    
    try {
      console.log('🧪 در حال تست مدل آموزش‌دیده با یک پرسش نمونه...');
      const prompt = "سلام! CCoin چیست؟";
      
      const result = await this.tunedModel.generateContent(prompt, {
        temperature: 0.2,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 40
      });
      
      const response = await result.response;
      const generatedText = response.text();
      
      console.log(`✅ پاسخ مدل آموزش‌دیده: \n${generatedText}`);
      return true;
    } catch (error) {
      console.error(`❌ خطا در تست مدل آموزش‌دیده: ${error.message}`);
      if (error.stack) console.error(error.stack);
      return false;
    }
  }
  
  async testStandardModel() {
    if (!this.apiKey) {
      console.log('❌ کلید API تنظیم نشده است، تست انجام نمی‌شود');
      return false;
    }
    
    try {
      console.log('🧪 در حال تست مدل استاندارد با یک پرسش نمونه...');
      const prompt = "سلام! CCoin چیست؟";
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt, {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.9,
        topK: 40
      });
      
      const response = await result.response;
      const generatedText = response.text();
      
      console.log(`✅ پاسخ مدل استاندارد: \n${generatedText}`);
      return true;
    } catch (error) {
      console.error(`❌ خطا در تست مدل استاندارد: ${error.message}`);
      if (error.stack) console.error(error.stack);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 شروع تست سرویس CCOIN AI...');
  console.log('===============================');
  
  const service = new SimpleCcoinAIService();
  
  console.log('\n📋 خلاصه وضعیت:');
  console.log(`🔑 کلید API موجود است: ${service.apiKey ? '✅ بله' : '❌ خیر'}`);
  console.log(`📂 فایل اطلاعات مدل موجود است: ${fs.existsSync(TUNED_MODEL_INFO_FILE) ? '✅ بله' : '❌ خیر'}`);
  console.log(`🔄 مدل آموزش‌دیده بارگیری شده است: ${service.hasTunedModel ? '✅ بله' : '❌ خیر'}`);
  
  if (service.modelInfo) {
    console.log('\n📊 اطلاعات مدل آموزش‌دیده:');
    console.log(`🆔 شناسه job: ${service.modelInfo.jobId || 'نامشخص'}`);
    console.log(`📝 نام مدل: ${service.modelInfo.modelName || 'نامشخص'}`);
    console.log(`🏷️ نام نمایشی: ${service.modelInfo.displayName || 'نامشخص'}`);
    console.log(`⏱️ تاریخ ایجاد: ${service.modelInfo.createdAt || 'نامشخص'}`);
    console.log(`🚦 وضعیت: ${service.modelInfo.state || 'نامشخص'}`);
  }
  
  console.log('\n🧪 اجرای تست‌ها:');
  
  // تست مدل استاندارد
  await service.testStandardModel();
  
  // تست مدل آموزش‌دیده
  if (service.hasTunedModelAvailable()) {
    await service.testTunedModel();
  } else {
    console.log('\n⚠️ برای استفاده از مدل آموزش‌دیده، باید:');
    console.log('1. ابتدا یک پروژه آموزش مدل ایجاد کنید (node ccoin_ai_tuning.cjs)');
    console.log('2. منتظر اتمام آموزش باشید (چند ساعت طول می‌کشد)');
    console.log('3. فایل tuned_model_info.json در مسیر اصلی پروژه ایجاد خواهد شد');
  }
  
  console.log('\n✨ پایان تست');
}

// اجرای اسکریپت
main().catch(error => {
  console.error(`❌ خطا در اجرای اسکریپت: ${error.message}`);
  if (error.stack) console.error(error.stack);
});