/**
 * اسکریپت تست برای سرویس آموزش CCOIN AI
 * این اسکریپت امکان تست سرویس آموزش و مدل‌های آموزش‌دیده را فراهم می‌کند
 */

import ccoinAITuningService, { TrainingExample } from './server/discord/services/ccoinAITuningService';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// بارگیری متغیرهای محیطی
dotenv.config();

/**
 * لود کردن داده‌های آموزشی نمونه
 * @returns داده‌های آموزشی
 */
function loadSampleTrainingData(): TrainingExample[] {
  // داده‌های آموزشی نمونه
  return [
    {
      text_input: "سلام! CCoin چیست؟",
      output: "سلام دوست من! CCoin یک ربات گیمینگ و اقتصادی پیشرفته برای دیسکورد است که با استفاده از هوش مصنوعی CCOIN AI طراحی شده است. این ربات سیستم اقتصادی کاملی با ارز دیجیتال داخلی، سیستم شغل، مینی‌گیم‌های متنوع و امکانات اجتماعی مانند سیستم دوستی، کلن‌ها و چت‌های خصوصی دارد. شما می‌توانید با انجام فعالیت‌های مختلف سکه جمع‌آوری کنید و از آن‌ها برای خرید آیتم‌ها، شرکت در قرعه‌کشی‌ها یا سرمایه‌گذاری در بازار سهام استفاده کنید."
    },
    {
      text_input: "چطور می‌توانم سکه بیشتری به دست بیاورم؟",
      output: "برای کسب سکه بیشتر در CCoin، می‌توانید این کارها را انجام دهید:\n\n1. دستور `/daily` را هر روز استفاده کنید تا جایزه روزانه خود را بگیرید\n2. در مینی‌گیم‌ها مثل `/blackjack`، `/slotemoji` یا `/crash` شرکت کنید\n3. با دستور `/work` کار کنید تا سکه دریافت کنید\n4. در بازار سهام با دستور `/stocks` سرمایه‌گذاری کنید\n5. در قرعه‌کشی‌ها با دستور `/lottery` شرکت کنید\n6. با افزایش سطح خود از طریق فعالیت مستمر، درآمد بیشتری کسب کنید\n7. در رویدادهای سرور شرکت کنید تا پاداش‌های ویژه دریافت کنید"
    },
    {
      text_input: "مینی‌گیم‌های CCoin کدام‌ها هستند؟",
      output: "CCoin دارای مینی‌گیم‌های متنوع و سرگرم‌کننده‌ای است که به شما امکان می‌دهد سکه بیشتری کسب کنید:\n\n- `/blackjack`: بازی کارتی بلک‌جک کلاسیک\n- `/slotemoji`: ماشین اسلات با شانس برنده شدن جایزه‌های بزرگ\n- `/crash`: پیش‌بینی کنید قبل از سقوط نمودار چه زمانی خارج شوید\n- `/coinflip`: شیر یا خط بازی کنید و شانس خود را امتحان کنید\n- `/bingo`: بازی بینگو با دیگر اعضای سرور\n- `/rps`: سنگ، کاغذ، قیچی بازی کنید\n- `/robbery`: تلاش کنید از دیگر کاربران سرقت کنید (اما مراقب باشید!)\n- `/duel`: با دیگر کاربران دوئل کنید\n- `/roulette`: در رولت شرط‌بندی کنید\n- `/wordgame`: بازی کلمات برای تست مهارت‌های لغوی شما\n\nهر بازی قوانین و پاداش‌های متفاوتی دارد، با دستور `/help [نام بازی]` می‌توانید راهنمای هر بازی را ببینید."
    }
  ];
}

/**
 * تست بارگیری داده‌های آموزشی
 */
async function testLoadTrainingData() {
  console.log("===== تست بارگیری داده‌های آموزشی =====");

  try {
    // تست بارگیری از CSV
    if (fs.existsSync('./ccoin_ai_training.csv')) {
      console.log("\n>> تست بارگیری از CSV:");
      const csvData = await ccoinAITuningService.loadTrainingDataFromCSV('./ccoin_ai_training.csv');
      console.log(`تعداد ${csvData.length} نمونه از CSV بارگیری شد`);
    } else {
      console.log("\n>> فایل CSV یافت نشد. تست رد شد.");
    }

    // تست بارگیری از JSON
    if (fs.existsSync('./ccoin_ai_training.json')) {
      console.log("\n>> تست بارگیری از JSON:");
      const jsonData = await ccoinAITuningService.loadTrainingDataFromJSON('./ccoin_ai_training.json');
      console.log(`تعداد ${jsonData.length} نمونه از JSON بارگیری شد`);
    } else {
      console.log("\n>> فایل JSON یافت نشد. تست رد شد.");
    }

    console.log("\n>> تست با داده‌های نمونه:");
    const sampleData = loadSampleTrainingData();
    console.log(`تعداد ${sampleData.length} نمونه آماده شد`);
    for (let i = 0; i < sampleData.length; i++) {
      console.log(`\nنمونه ${i+1}:`);
      console.log(`سؤال: ${sampleData[i].text_input}`);
      console.log(`پاسخ: ${sampleData[i].output.substring(0, 100)}...`);
    }

    return { success: true, data: sampleData };
  } catch (error) {
    console.error(`خطا در تست بارگیری داده‌ها: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    return { success: false, error };
  }
}

/**
 * تست لیست کردن مدل‌های آموزش‌دیده
 */
async function testListTunedModels() {
  console.log("\n===== تست لیست کردن مدل‌های آموزش‌دیده =====");

  try {
    if (!ccoinAITuningService.isAvailable()) {
      console.error("سرویس آموزش CCOIN AI در دسترس نیست. لطفاً کلید API را بررسی کنید.");
      return { success: false, error: "سرویس در دسترس نیست" };
    }

    // دریافت لیست مدل‌ها
    const models = await ccoinAITuningService.listTunedModels();
    console.log(`تعداد ${models.length} مدل آموزش‌دیده یافت شد`);

    return { success: true, models };
  } catch (error) {
    console.error(`خطا در لیست کردن مدل‌ها: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    return { success: false, error };
  }
}

/**
 * تست بررسی وضعیت job آموزش
 */
async function testCheckJobStatus() {
  console.log("\n===== تست بررسی وضعیت job آموزش =====");

  try {
    // بارگیری اطلاعات job از فایل
    const jobInfo = ccoinAITuningService.loadTuningJobInfo();

    if (!jobInfo || !jobInfo.jobId) {
      console.log("هیچ اطلاعاتی از job آموزش قبلی یافت نشد.");
      return { success: false, error: "اطلاعات job یافت نشد" };
    }

    console.log(`بررسی وضعیت job با شناسه ${jobInfo.jobId}...`);

    if (!ccoinAITuningService.isAvailable()) {
      console.error("سرویس آموزش CCOIN AI در دسترس نیست. لطفاً کلید API را بررسی کنید.");
      return { success: false, error: "سرویس در دسترس نیست" };
    }

    // بررسی وضعیت
    const status = await ccoinAITuningService.checkTuningJobStatus(jobInfo.jobId);
    console.log(`وضعیت job: ${status.state}`);

    if (status.modelName) {
      console.log(`نام مدل: ${status.modelName}`);
    }

    return { success: true, status };
  } catch (error) {
    console.error(`خطا در بررسی وضعیت job: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    return { success: false, error };
  }
}

/**
 * تست ایجاد job آموزش جدید
 * توجه: این تست واقعاً یک job آموزش جدید ایجاد می‌کند!
 */
async function testCreateTuningJob() {
  console.log("\n===== تست ایجاد job آموزش جدید =====");
  console.log("⚠️ هشدار: این تست واقعاً یک job آموزش جدید ایجاد می‌کند!");

  // دریافت تایید کاربر
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    return new Promise((resolve) => {
      readline.question('آیا می‌خواهید ادامه دهید؟ (بله/خیر): ', async (answer: string) => {
        if (answer.toLowerCase() !== 'بله' && answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log("تست لغو شد.");
          readline.close();
          resolve({ success: false, cancelled: true });
          return;
        }

        try {
          if (!ccoinAITuningService.isAvailable()) {
            console.error("سرویس آموزش CCOIN AI در دسترس نیست. لطفاً کلید API را بررسی کنید.");
            readline.close();
            resolve({ success: false, error: "سرویس در دسترس نیست" });
            return;
          }

          // دریافت داده‌های آموزشی
          const sampleData = loadSampleTrainingData();
          console.log(`استفاده از ${sampleData.length} نمونه آموزشی...`);

          // ایجاد job آموزش
          const result = await ccoinAITuningService.createTuningJob(
            sampleData,
            'gemini-1.5-flash-001-tuning',
            'CCoinAI_Test'
          );

          console.log(`job آموزش جدید با شناسه ${result.jobId} ایجاد شد`);
          console.log(`وضعیت: ${result.state}`);

          readline.close();
          resolve({ success: true, result });
        } catch (error) {
          console.error(`خطا در ایجاد job آموزش: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
          readline.close();
          resolve({ success: false, error });
        }
      });
    });
  } catch (error) {
    console.error(`خطا در اجرای تست: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    readline.close();
    return { success: false, error };
  }
}

/**
 * تست مدل آموزش‌دیده
 */
async function testTunedModel() {
  console.log("\n===== تست مدل آموزش‌دیده =====");

  // دریافت نام مدل از کاربر
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    return new Promise((resolve) => {
      // بارگیری اطلاعات job از فایل
      const jobInfo = ccoinAITuningService.loadTuningJobInfo();
      let modelNamePrompt = 'نام کامل مدل آموزش‌دیده را وارد کنید: ';

      if (jobInfo && jobInfo.modelName) {
        modelNamePrompt = `نام کامل مدل آموزش‌دیده را وارد کنید (پیش‌فرض: ${jobInfo.modelName}): `;
      }

      readline.question(modelNamePrompt, async (modelName: string) => {
        if (!modelName && jobInfo && jobInfo.modelName) {
          modelName = jobInfo.modelName;
        }

        if (!modelName) {
          console.error("نام مدل وارد نشده است.");
          readline.close();
          resolve({ success: false, error: "نام مدل وارد نشده است" });
          return;
        }

        try {
          if (!ccoinAITuningService.isAvailable()) {
            console.error("سرویس آموزش CCOIN AI در دسترس نیست. لطفاً کلید API را بررسی کنید.");
            readline.close();
            resolve({ success: false, error: "سرویس در دسترس نیست" });
            return;
          }

          // تست مدل
          console.log(`تست مدل ${modelName}...`);
          const results = await ccoinAITuningService.testTunedModel(modelName);

          readline.close();
          resolve({ success: true, results });
        } catch (error) {
          console.error(`خطا در تست مدل: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
          readline.close();
          resolve({ success: false, error });
        }
      });
    });
  } catch (error) {
    console.error(`خطا در اجرای تست: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    readline.close();
    return { success: false, error };
  }
}

/**
 * اجرای تست‌ها
 */
async function runTests() {
  console.log("===== تست سرویس آموزش CCOIN AI =====\n");

  // نمایش منوی تست
  console.log('لطفاً تست مورد نظر را انتخاب کنید:');
  console.log('1. بارگیری داده‌های آموزشی');
  console.log('2. لیست کردن مدل‌های آموزش‌دیده');
  console.log('3. بررسی وضعیت job آموزش');
  console.log('4. ایجاد job آموزش جدید');
  console.log('5. تست مدل آموزش‌دیده');
  console.log('6. اجرای همه تست‌ها');
  console.log('0. خروج');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('\nشماره تست را وارد کنید: ', async (option: string) => {
    readline.close();

    switch (option) {
      case '1':
        await testLoadTrainingData();
        break;
      case '2':
        await testListTunedModels();
        break;
      case '3':
        await testCheckJobStatus();
        break;
      case '4':
        await testCreateTuningJob();
        break;
      case '5':
        await testTunedModel();
        break;
      case '6':
        await testLoadTrainingData();
        await testListTunedModels();
        await testCheckJobStatus();
        await testCreateTuningJob();
        await testTunedModel();
        break;
      case '0':
        console.log('خروج از برنامه تست.');
        break;
      default:
        console.error('گزینه نامعتبر!');
        break;
    }
  });
}

// اجرای تست‌ها
runTests();