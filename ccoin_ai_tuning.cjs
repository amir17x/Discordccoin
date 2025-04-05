#!/usr/bin/env node

/**
 * ابزار خط فرمان برای آموزش مدل CCOIN AI با استفاده از Gemini API
 * جایگزین اسکریپت Python با پیاده‌سازی JavaScript
 */

// بارگیری ماژول‌های مورد نیاز
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const axios = require('axios');
require('dotenv').config();

// تنظیم کلید API
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.CCOIN_AI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// ایجاد رابط خط فرمان
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * بارگیری داده‌های آموزشی از فایل CSV
 * @param {string} csvFilePath مسیر فایل CSV
 * @returns {Promise<Array>} داده‌های آموزشی
 */
async function loadTrainingDataFromCSV(csvFilePath) {
  try {
    // بررسی وجود فایل
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`فایل CSV در مسیر ${csvFilePath} یافت نشد`);
    }

    // خواندن فایل CSV
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // بررسی هدر
    const header = lines[0].split(',');
    const textInputIndex = header.findIndex(h => h.trim() === 'text_input');
    const outputIndex = header.findIndex(h => h.trim() === 'output');
    
    if (textInputIndex === -1 || outputIndex === -1) {
      throw new Error("فایل CSV باید دارای ستون‌های 'text_input' و 'output' باشد");
    }
    
    // پردازش داده‌ها
    const trainingData = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // پردازش خط با در نظر گرفتن کاما درون کوتیشن
      const row = parseCSVLine(lines[i]);
      
      if (row.length > Math.max(textInputIndex, outputIndex)) {
        trainingData.push({
          text_input: row[textInputIndex].trim(),
          output: row[outputIndex].trim()
        });
      }
    }
    
    console.log(`تعداد ${trainingData.length} نمونه آموزشی از CSV بارگیری شد`);
    
    return trainingData;
    
  } catch (error) {
    console.error(`خطا در بارگیری داده‌های آموزشی از CSV: ${error.message}`);
    throw error;
  }
}

/**
 * تجزیه خط CSV با در نظر گرفتن کاما درون کوتیشن
 * @param {string} line خط CSV
 * @returns {Array<string>} آرایه‌ای از مقادیر
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) {
    result.push(current);
  }
  
  return result.map(val => val.replace(/^"|"$/g, ''));
}

/**
 * بارگیری داده‌های آموزشی از فایل JSON
 * @param {string} jsonFilePath مسیر فایل JSON
 * @returns {Promise<Array>} داده‌های آموزشی
 */
async function loadTrainingDataFromJSON(jsonFilePath) {
  try {
    // بررسی وجود فایل
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`فایل JSON در مسیر ${jsonFilePath} یافت نشد`);
    }

    // خواندن فایل JSON
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (!Array.isArray(data)) {
      throw new Error('فایل JSON باید حاوی آرایه‌ای از نمونه‌های آموزشی باشد');
    }
    
    // بررسی ساختار داده‌ها
    const trainingData = data.map(item => {
      if (!item.text_input || !item.output) {
        throw new Error('هر نمونه آموزشی باید دارای فیلدهای text_input و output باشد');
      }
      
      return {
        text_input: item.text_input,
        output: item.output
      };
    });
    
    console.log(`تعداد ${trainingData.length} نمونه آموزشی از JSON بارگیری شد`);
    
    return trainingData;
    
  } catch (error) {
    console.error(`خطا در بارگیری داده‌های آموزشی از JSON: ${error.message}`);
    throw error;
  }
}

/**
 * ایجاد و شروع یک job آموزش
 * @param {Array} trainingData داده‌های آموزشی
 * @param {string} baseModel مدل پایه (پیش‌فرض: gemini-1.5-flash-001-tuning)
 * @param {string} displayName نام نمایشی مدل
 * @returns {Promise<Object>} اطلاعات job آموزش
 */
async function createTuningJob(
  trainingData,
  baseModel = 'gemini-1.5-flash-001-tuning', 
  displayName = 'CCoinAI'
) {
  try {
    if (!API_KEY) {
      throw new Error('کلید API تنظیم نشده است. لطفاً متغیر محیطی GOOGLE_AI_API_KEY یا CCOIN_AI_API_KEY را تنظیم کنید.');
    }
    
    if (!trainingData || trainingData.length === 0) {
      throw new Error('داده‌های آموزشی خالی است');
    }
    
    console.log(`شروع ایجاد job آموزش با ${trainingData.length} نمونه...`);
    
    // تبدیل داده‌ها به فرمت مورد نیاز API
    const examples = trainingData.map(item => ({
      text_input: item.text_input,
      output: item.output
    }));
    
    // استفاده از API REST برای ایجاد tuning job
    const response = await axios.post(
      `${BASE_URL}/tunedModels:create?key=${API_KEY}`,
      {
        tuningSpec: {
          baseModel,
          tuningData: {
            examples
          },
          hyperparameters: {
            batchSize: 4,
            learningRate: 0.001,
            epochCount: 5
          }
        },
        displayName: displayName,
        description: "مدل آموزش‌دیده CCoin برای پاسخگویی به سؤالات مرتبط با ربات دیسکورد"
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // بررسی پاسخ
    if (!response.data || !response.data.name) {
      throw new Error('پاسخ نامعتبر از API');
    }
    
    // استخراج شناسه job
    const jobId = response.data.name.split('/').pop();
    const createdAt = new Date().toISOString();
    const state = response.data.state || 'CREATING';
    const modelName = response.data.tunedModelName || `${baseModel}-tuned_${jobId}`;
    
    // ذخیره اطلاعات job
    const jobInfo = {
      jobId,
      modelName,
      displayName,
      createdAt,
      state
    };
    
    // ذخیره اطلاعات در فایل
    saveTuningJobInfo(jobInfo);
    
    console.log(`job آموزش با شناسه ${jobId} با موفقیت ایجاد شد`);
    
    return jobInfo;
    
  } catch (error) {
    console.error(`خطا در ایجاد job آموزش: ${error.message}`);
    
    // بررسی خطاهای خاص API
    if (error.response && error.response.data) {
      console.error(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`);
    }
    
    throw error;
  }
}

/**
 * ذخیره اطلاعات job آموزش در فایل
 * @param {Object} jobInfo اطلاعات job
 */
function saveTuningJobInfo(jobInfo) {
  try {
    fs.writeFileSync('tuned_model_info.json', JSON.stringify(jobInfo, null, 2), 'utf8');
    console.log(`اطلاعات مدل در فایل tuned_model_info.json ذخیره شد`);
  } catch (error) {
    console.error(`خطا در ذخیره اطلاعات job: ${error.message}`);
  }
}

/**
 * بارگیری اطلاعات job آموزش از فایل
 * @returns {Object|null} اطلاعات job یا null در صورت عدم وجود
 */
function loadTuningJobInfo() {
  try {
    if (!fs.existsSync('tuned_model_info.json')) {
      return null;
    }
    
    const fileContent = fs.readFileSync('tuned_model_info.json', 'utf8');
    return JSON.parse(fileContent);
    
  } catch (error) {
    console.error(`خطا در بارگیری اطلاعات job: ${error.message}`);
    return null;
  }
}

/**
 * بررسی وضعیت یک job آموزش
 * @param {string} jobId شناسه job
 * @returns {Promise<Object>} وضعیت job
 */
async function checkTuningJobStatus(jobId) {
  try {
    if (!API_KEY) {
      throw new Error('کلید API تنظیم نشده است');
    }
    
    // استفاده از API REST برای بررسی وضعیت
    const response = await axios.get(
      `${BASE_URL}/tunedModels/${jobId}?key=${API_KEY}`,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // بررسی پاسخ
    if (!response.data || !response.data.state) {
      throw new Error('پاسخ نامعتبر از API');
    }
    
    const state = response.data.state;
    const modelName = response.data.tunedModelName;
    
    console.log(`وضعیت job ${jobId}: ${state}`);
    
    if (state === 'SUCCEEDED' && modelName) {
      console.log(`مدل با نام ${modelName} با موفقیت آموزش دیده شد`);
      
      // به‌روزرسانی اطلاعات job در فایل
      const jobInfo = loadTuningJobInfo();
      if (jobInfo && jobInfo.jobId === jobId) {
        jobInfo.state = state;
        if (modelName) jobInfo.modelName = modelName;
        saveTuningJobInfo(jobInfo);
      }
    } else if (state === 'FAILED') {
      console.error(`job آموزش با شکست مواجه شد: ${response.data.error || 'دلیل نامشخص'}`);
    }
    
    return { state, modelName };
    
  } catch (error) {
    console.error(`خطا در بررسی وضعیت job: ${error.message}`);
    
    if (error.response && error.response.data) {
      console.error(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`);
    }
    
    throw error;
  }
}

/**
 * لیست کردن تمام مدل‌های آموزش‌دیده
 * @returns {Promise<Array>} لیست مدل‌های آموزش‌دیده
 */
async function listTunedModels() {
  try {
    if (!API_KEY) {
      throw new Error('کلید API تنظیم نشده است');
    }
    
    // استفاده از API REST برای دریافت لیست مدل‌ها
    const response = await axios.get(
      `${BASE_URL}/tunedModels?key=${API_KEY}`,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // بررسی پاسخ
    if (!response.data || !response.data.tunedModels) {
      return [];
    }
    
    const models = response.data.tunedModels;
    
    console.log(`تعداد ${models.length} مدل آموزش‌دیده یافت شد`);
    
    // نمایش جزئیات هر مدل در لاگ
    models.forEach((model, index) => {
      console.log(`مدل ${index + 1}: ${model.tunedModelName} (${model.state})`);
    });
    
    return models;
    
  } catch (error) {
    console.error(`خطا در دریافت لیست مدل‌ها: ${error.message}`);
    
    if (error.response && error.response.data) {
      console.error(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`);
    }
    
    throw error;
  }
}

/**
 * تست یک مدل آموزش‌دیده با چند پرسش نمونه
 * @param {string} modelName نام کامل مدل
 * @returns {Promise<Array>} نتایج تست
 */
async function testTunedModel(modelName) {
  try {
    if (!API_KEY) {
      throw new Error('کلید API تنظیم نشده است');
    }
    
    // چند سؤال نمونه برای تست
    const testQuestions = [
      "سلام! CCoin چیست؟",
      "چگونه می‌توانم سکه‌های بیشتری به دست بیاورم؟",
      "دستور /daily چه کاری انجام می‌دهد؟",
      "سیستم دوستی در CCoin چگونه کار می‌کند؟",
      "مینی‌گیم‌های CCoin کدام‌ها هستند؟"
    ];
    
    console.log(`تست مدل آموزش‌دیده ${modelName}...`);
    
    const results = [];
    
    // تست هر سؤال
    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      console.log(`تست سؤال ${i+1}: ${question}`);
      
      // استفاده از API REST برای تولید پاسخ
      const response = await axios.post(
        `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`,
        {
          contents: [{ parts: [{ text: question }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 40
          }
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      // بررسی پاسخ
      if (response.data && 
          response.data.candidates && 
          response.data.candidates[0] && 
          response.data.candidates[0].content && 
          response.data.candidates[0].content.parts &&
          response.data.candidates[0].content.parts[0]) {
        
        const answer = response.data.candidates[0].content.parts[0].text;
        console.log(`پاسخ: ${answer.substring(0, 100)}...`);
        
        results.push({ question, answer });
      } else {
        console.error(`خطا در دریافت پاسخ برای سؤال ${i+1}`);
        results.push({ question, answer: '(خطا در تولید پاسخ)' });
      }
    }
    
    console.log("تست مدل به پایان رسید.");
    
    return results;
    
  } catch (error) {
    console.error(`خطا در تست مدل: ${error.message}`);
    
    if (error.response && error.response.data) {
      console.error(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`);
    }
    
    throw error;
  }
}

/**
 * پرسیدن یک سوال و انتظار برای پاسخ کاربر
 * @param {string} question سوال
 * @returns {Promise<string>} پاسخ کاربر
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * تابع اصلی برنامه
 */
async function main() {
  console.log('🤖 سیستم آموزش CCOIN AI');
  console.log('=========================');
  
  if (!API_KEY) {
    console.error('⚠️ خطا: کلید API تنظیم نشده است');
    console.log('لطفاً مطمئن شوید که متغیر محیطی GOOGLE_AI_API_KEY یا CCOIN_AI_API_KEY در فایل .env تنظیم شده است');
    process.exit(1);
  }
  
  try {
    console.log('انتخاب عملیات:');
    console.log('1. آموزش مدل جدید (با CSV)');
    console.log('2. آموزش مدل جدید (با JSON)');
    console.log('3. بررسی وضعیت job آموزش');
    console.log('4. لیست مدل‌های آموزش‌دیده');
    console.log('5. تست مدل آموزش‌دیده');
    console.log('0. خروج');
    
    const answer = await askQuestion('\nلطفاً گزینه مورد نظر را انتخاب کنید: ');
    
    switch (answer.trim()) {
      case '1': {
        // آموزش مدل جدید با CSV
        const csvPath = await askQuestion('مسیر فایل CSV: ');
        if (!csvPath.trim()) {
          console.log('خطا: مسیر فایل CSV وارد نشده است');
          break;
        }
        
        const trainingData = await loadTrainingDataFromCSV(csvPath.trim());
        if (trainingData && trainingData.length > 0) {
          const baseModel = await askQuestion('مدل پایه (پیش‌فرض: gemini-1.5-flash-001-tuning): ');
          const displayName = await askQuestion('نام نمایشی مدل (پیش‌فرض: CCoinAI): ');
          
          const jobInfo = await createTuningJob(
            trainingData,
            baseModel.trim() || 'gemini-1.5-flash-001-tuning',
            displayName.trim() || 'CCoinAI'
          );
          
          console.log('\n✅ job آموزش با موفقیت ایجاد شد');
          console.log('اطلاعات job:');
          console.log(`شناسه job: ${jobInfo.jobId}`);
          console.log(`نام مدل: ${jobInfo.modelName}`);
          console.log(`وضعیت: ${jobInfo.state}`);
          console.log('\nتوجه: آموزش مدل چند دقیقه تا چند ساعت طول می‌کشد.');
          console.log('شما می‌توانید با انتخاب گزینه 3 در منوی اصلی، وضعیت job را بررسی کنید.');
        }
        break;
      }
      
      case '2': {
        // آموزش مدل جدید با JSON
        const jsonPath = await askQuestion('مسیر فایل JSON: ');
        if (!jsonPath.trim()) {
          console.log('خطا: مسیر فایل JSON وارد نشده است');
          break;
        }
        
        const trainingData = await loadTrainingDataFromJSON(jsonPath.trim());
        if (trainingData && trainingData.length > 0) {
          const baseModel = await askQuestion('مدل پایه (پیش‌فرض: gemini-1.5-flash-001-tuning): ');
          const displayName = await askQuestion('نام نمایشی مدل (پیش‌فرض: CCoinAI): ');
          
          const jobInfo = await createTuningJob(
            trainingData,
            baseModel.trim() || 'gemini-1.5-flash-001-tuning',
            displayName.trim() || 'CCoinAI'
          );
          
          console.log('\n✅ job آموزش با موفقیت ایجاد شد');
          console.log('اطلاعات job:');
          console.log(`شناسه job: ${jobInfo.jobId}`);
          console.log(`نام مدل: ${jobInfo.modelName}`);
          console.log(`وضعیت: ${jobInfo.state}`);
          console.log('\nتوجه: آموزش مدل چند دقیقه تا چند ساعت طول می‌کشد.');
          console.log('شما می‌توانید با انتخاب گزینه 3 در منوی اصلی، وضعیت job را بررسی کنید.');
        }
        break;
      }
      
      case '3': {
        // بررسی وضعیت job آموزش
        const jobInfo = loadTuningJobInfo();
        
        if (!jobInfo || !jobInfo.jobId) {
          console.log('⚠️ هیچ job آموزشی در سیستم ثبت نشده است');
          
          const customJobId = await askQuestion('آیا می‌خواهید شناسه job را دستی وارد کنید؟ (بله/خیر): ');
          
          if (customJobId.trim().toLowerCase() === 'بله' || customJobId.trim().toLowerCase() === 'yes' || customJobId.trim().toLowerCase() === 'y') {
            const jobId = await askQuestion('لطفاً شناسه job را وارد کنید: ');
            
            if (jobId.trim()) {
              const status = await checkTuningJobStatus(jobId.trim());
              console.log(`\n✅ وضعیت job با شناسه ${jobId.trim()}: ${status.state}`);
              
              if (status.modelName) {
                console.log(`نام مدل: ${status.modelName}`);
              }
            } else {
              console.log('خطا: شناسه job وارد نشده است');
            }
          }
          
        } else {
          console.log(`بررسی وضعیت job با شناسه ${jobInfo.jobId}...`);
          
          const status = await checkTuningJobStatus(jobInfo.jobId);
          console.log(`\n✅ وضعیت job: ${status.state}`);
          
          if (status.modelName) {
            console.log(`نام مدل: ${status.modelName}`);
          }
        }
        break;
      }
      
      case '4': {
        // لیست مدل‌های آموزش‌دیده
        const models = await listTunedModels();
        
        if (models.length === 0) {
          console.log('⚠️ هیچ مدل آموزش‌دیده‌ای یافت نشد');
        } else {
          console.log('\n📋 لیست مدل‌های آموزش‌دیده:');
          models.forEach((model, index) => {
            console.log(`${index + 1}. ${model.tunedModelName}`);
            console.log(`   وضعیت: ${model.state}`);
            console.log(`   تاریخ ایجاد: ${new Date(model.createTime).toLocaleString()}`);
            if (model.description) {
              console.log(`   توضیحات: ${model.description}`);
            }
            console.log('---');
          });
        }
        break;
      }
      
      case '5': {
        // تست مدل آموزش‌دیده
        const jobInfo = loadTuningJobInfo();
        
        if (!jobInfo || !jobInfo.modelName) {
          console.log('⚠️ هیچ مدل آموزش‌دیده‌ای در سیستم ثبت نشده است');
          
          const customModelName = await askQuestion('آیا می‌خواهید نام مدل را دستی وارد کنید؟ (بله/خیر): ');
          
          if (customModelName.trim().toLowerCase() === 'بله' || customModelName.trim().toLowerCase() === 'yes' || customModelName.trim().toLowerCase() === 'y') {
            const modelName = await askQuestion('لطفاً نام کامل مدل را وارد کنید: ');
            
            if (modelName.trim()) {
              await testTunedModel(modelName.trim());
            } else {
              console.log('خطا: نام مدل وارد نشده است');
            }
          }
          
        } else {
          console.log(`تست مدل آموزش‌دیده با نام ${jobInfo.modelName}...`);
          
          await testTunedModel(jobInfo.modelName);
          
          console.log('\n✅ تست مدل به پایان رسید');
        }
        break;
      }
      
      case '0':
        console.log('خروج از برنامه');
        break;
        
      default:
        console.log('گزینه نامعتبر است');
    }
    
  } catch (error) {
    console.error(`خطا: ${error.message}`);
  } finally {
    rl.close();
  }
}

/**
 * تابع تست مدل آموزش‌دیده با آرگومان خط فرمان
 * @param {string} modelName نام کامل مدل
 */
async function runTestWithModelName(modelName) {
  try {
    if (!modelName) {
      console.error('نام مدل باید مشخص شود');
      process.exit(1);
    }
    
    await testTunedModel(modelName);
    process.exit(0);
  } catch (error) {
    console.error(`خطا: ${error.message}`);
    process.exit(1);
  }
}

// پردازش آرگومان‌های خط فرمان
const args = process.argv.slice(2);

if (args.length > 0 && args[0] === 'test' && args[1]) {
  // اجرای تست با نام مدل مشخص شده
  runTestWithModelName(args[1]);
} else {
  // اجرای منوی اصلی
  main();
}