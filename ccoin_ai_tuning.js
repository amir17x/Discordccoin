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
    
    console.log(`تعداد ${trainingData.length} نمونه آموزشی بارگیری شد`);
    
    // نمایش نمونه‌های ابتدایی
    const sampleCount = Math.min(3, trainingData.length);
    for (let i = 0; i < sampleCount; i++) {
      console.log(`\nنمونه ${i+1}:`);
      console.log(`سؤال: ${trainingData[i].text_input}`);
      console.log(`پاسخ: ${trainingData[i].output.substring(0, 100)}...`);
    }
    
    return trainingData;
    
  } catch (error) {
    console.error(`خطا در بارگیری داده‌های آموزشی: ${error.message}`);
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
    
    console.log(`تعداد ${trainingData.length} نمونه آموزشی بارگیری شد`);
    
    // نمایش نمونه‌های ابتدایی
    const sampleCount = Math.min(3, trainingData.length);
    for (let i = 0; i < sampleCount; i++) {
      console.log(`\nنمونه ${i+1}:`);
      console.log(`سؤال: ${trainingData[i].text_input}`);
      console.log(`پاسخ: ${trainingData[i].output.substring(0, 100)}...`);
    }
    
    return trainingData;
    
  } catch (error) {
    console.error(`خطا در بارگیری داده‌های آموزشی: ${error.message}`);
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
      throw new Error('کلید API تنظیم نشده است. لطفاً فایل .env را با کلید GEMINI_API_KEY تنظیم کنید.');
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
    console.log(`وضعیت فعلی: ${state}`);
    console.log(`این فرآیند ممکن است چند دقیقه تا چند ساعت طول بکشد`);
    
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
    const filePath = path.resolve(process.cwd(), 'tuned_model_info.json');
    fs.writeFileSync(filePath, JSON.stringify(jobInfo, null, 2), 'utf8');
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
    const filePath = path.resolve(process.cwd(), 'tuned_model_info.json');
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
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
    
    // نمایش جزئیات هر مدل
    models.forEach((model, index) => {
      console.log(`\nمدل ${index + 1}:`);
      console.log(`نام: ${model.tunedModelName}`);
      console.log(`نام نمایشی: ${model.displayName}`);
      console.log(`وضعیت: ${model.state}`);
      console.log(`تاریخ ایجاد: ${model.createTime}`);
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
    
    console.log(`\n===== تست مدل آموزش‌دیده ${modelName} =====`);
    
    const results = [];
    
    // تست هر سؤال
    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      console.log(`\nسؤال ${i+1}: ${question}`);
      
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
        console.log(`پاسخ: ${answer.substring(0, 200)}...`);
        console.log("-".repeat(50));
        
        results.push({ question, answer });
      } else {
        console.error(`خطا در دریافت پاسخ برای سؤال ${i+1}`);
        results.push({ question, answer: '(خطا در تولید پاسخ)' });
      }
    }
    
    console.log("\nتست مدل به پایان رسید.");
    
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
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

/**
 * تابع اصلی برنامه
 */
async function main() {
  console.log("===== آموزش مدل CCoinAI با استفاده از Google Gemini API =====\n");
  
  try {
    // بررسی وجود کلید API
    if (!API_KEY) {
      console.error('خطا: کلید API تنظیم نشده است. لطفاً فایل .env را با کلید GEMINI_API_KEY تنظیم کنید.');
      return;
    }
    
    // نمایش منوی اصلی
    console.log('گزینه‌های موجود:');
    console.log('1. شروع فرآیند آموزش با فایل CSV');
    console.log('2. شروع فرآیند آموزش با فایل JSON');
    console.log('3. بررسی وضعیت job آموزش');
    console.log('4. لیست مدل‌های آموزش‌دیده');
    console.log('5. تست مدل آموزش‌دیده');
    console.log('6. خروج');
    
    const option = await askQuestion('\nلطفاً گزینه مورد نظر را وارد کنید (1-6): ');
    
    switch (option) {
      case '1': {
        // آموزش با فایل CSV
        const csvPath = await askQuestion('مسیر فایل CSV (پیش‌فرض: ccoin_ai_training_updated.csv): ') || 'ccoin_ai_training_updated.csv';
        const trainingData = await loadTrainingDataFromCSV(csvPath);
        
        if (!trainingData || trainingData.length === 0) {
          console.error('بارگیری داده‌های آموزشی ناموفق بود. لطفاً فایل CSV را بررسی کنید.');
          break;
        }
        
        const proceed = await askQuestion('\nآیا می‌خواهید با آموزش مدل ادامه دهید؟ (بله/خیر): ');
        
        if (proceed.toLowerCase() !== 'بله' && proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
          console.log('فرآیند آموزش لغو شد.');
          break;
        }
        
        // دریافت پارامترهای آموزش
        const baseModel = await askQuestion('مدل پایه (پیش‌فرض: gemini-1.5-flash-001-tuning): ') || 'gemini-1.5-flash-001-tuning';
        const displayName = await askQuestion('نام نمایشی مدل (پیش‌فرض: CCoinAI): ') || 'CCoinAI';
        
        // ایجاد job آموزش
        const jobInfo = await createTuningJob(trainingData, baseModel, displayName);
        
        console.log('\nمدل با موفقیت ایجاد شد و فرآیند آموزش آغاز شد.');
        console.log('لطفاً به پنل Google AI Studio مراجعه کنید تا از وضعیت آموزش مطلع شوید.');
        
        // اطلاعات برای تست بعدی
        console.log('\n===== برای تست مدل پس از اتمام آموزش =====');
        console.log(`برای تست مدل، از فرمان زیر استفاده کنید:`);
        console.log(`node ccoin_ai_tuning.js --test ${jobInfo.modelName || `${baseModel}-tuned_${jobInfo.jobId}`}`);
        break;
      }
      
      case '2': {
        // آموزش با فایل JSON
        const jsonPath = await askQuestion('مسیر فایل JSON (پیش‌فرض: ccoin_ai_training_updated.json): ') || 'ccoin_ai_training_updated.json';
        const trainingData = await loadTrainingDataFromJSON(jsonPath);
        
        if (!trainingData || trainingData.length === 0) {
          console.error('بارگیری داده‌های آموزشی ناموفق بود. لطفاً فایل JSON را بررسی کنید.');
          break;
        }
        
        const proceed = await askQuestion('\nآیا می‌خواهید با آموزش مدل ادامه دهید؟ (بله/خیر): ');
        
        if (proceed.toLowerCase() !== 'بله' && proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
          console.log('فرآیند آموزش لغو شد.');
          break;
        }
        
        // دریافت پارامترهای آموزش
        const baseModel = await askQuestion('مدل پایه (پیش‌فرض: gemini-1.5-flash-001-tuning): ') || 'gemini-1.5-flash-001-tuning';
        const displayName = await askQuestion('نام نمایشی مدل (پیش‌فرض: CCoinAI): ') || 'CCoinAI';
        
        // ایجاد job آموزش
        const jobInfo = await createTuningJob(trainingData, baseModel, displayName);
        
        console.log('\nمدل با موفقیت ایجاد شد و فرآیند آموزش آغاز شد.');
        console.log('لطفاً به پنل Google AI Studio مراجعه کنید تا از وضعیت آموزش مطلع شوید.');
        
        // اطلاعات برای تست بعدی
        console.log('\n===== برای تست مدل پس از اتمام آموزش =====');
        console.log(`برای تست مدل، از فرمان زیر استفاده کنید:`);
        console.log(`node ccoin_ai_tuning.js --test ${jobInfo.modelName || `${baseModel}-tuned_${jobInfo.jobId}`}`);
        break;
      }
      
      case '3': {
        // بررسی وضعیت job
        const jobInfo = loadTuningJobInfo();
        
        if (!jobInfo || !jobInfo.jobId) {
          const jobId = await askQuestion('شناسه job آموزش را وارد کنید: ');
          
          if (!jobId) {
            console.error('شناسه job وارد نشده است.');
            break;
          }
          
          await checkTuningJobStatus(jobId);
        } else {
          console.log(`اطلاعات آخرین job آموزش:`);
          console.log(`شناسه: ${jobInfo.jobId}`);
          console.log(`نام مدل: ${jobInfo.modelName || 'نامشخص'}`);
          console.log(`نام نمایشی: ${jobInfo.displayName}`);
          console.log(`تاریخ ایجاد: ${jobInfo.createdAt}`);
          
          await checkTuningJobStatus(jobInfo.jobId);
        }
        break;
      }
      
      case '4': {
        // لیست مدل‌های آموزش‌دیده
        await listTunedModels();
        break;
      }
      
      case '5': {
        // تست مدل آموزش‌دیده
        const jobInfo = loadTuningJobInfo();
        let modelName;
        
        if (jobInfo && jobInfo.modelName) {
          const useLastModel = await askQuestion(`آیا می‌خواهید از آخرین مدل آموزش‌دیده (${jobInfo.modelName}) استفاده کنید؟ (بله/خیر): `);
          
          if (useLastModel.toLowerCase() === 'بله' || useLastModel.toLowerCase() === 'y' || useLastModel.toLowerCase() === 'yes') {
            modelName = jobInfo.modelName;
          }
        }
        
        if (!modelName) {
          modelName = await askQuestion('نام کامل مدل آموزش‌دیده را وارد کنید: ');
        }
        
        if (!modelName) {
          console.error('نام مدل وارد نشده است.');
          break;
        }
        
        await testTunedModel(modelName);
        break;
      }
      
      case '6': {
        // خروج
        console.log('برنامه با موفقیت پایان یافت.');
        break;
      }
      
      default: {
        console.error('گزینه وارد شده نامعتبر است.');
        break;
      }
    }
    
  } catch (error) {
    console.error(`خطا در اجرای برنامه: ${error.message}`);
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
    await testTunedModel(modelName);
  } catch (error) {
    console.error(`خطا در تست مدل: ${error.message}`);
  } finally {
    rl.close();
  }
}

// بررسی آرگومان‌های خط فرمان
if (process.argv.length > 3 && process.argv[2] === "--test") {
  const modelName = process.argv[3];
  runTestWithModelName(modelName);
} else {
  main();
}