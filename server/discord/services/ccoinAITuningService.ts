/**
 * سرویس آموزش و fine-tuning مدل CCOIN AI
 * این سرویس امکان آموزش مدل‌های سفارشی برای ربات را فراهم می‌کند
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { log } from '../../vite';

// تنظیم کلید API
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.CCOIN_AI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// تعداد تلاش‌های مجدد برای درخواست‌ها
const MAX_RETRIES = 2;
// فاصله بین هر تلاش (میلی‌ثانیه)
const RETRY_DELAY = 300;
// زمان timeout برای درخواست‌ها (میلی‌ثانیه)
const REQUEST_TIMEOUT = 8000;

// مسیر فایل اطلاعات مدل آموزش‌دیده
const TUNED_MODEL_INFO_FILE = path.resolve(process.cwd(), 'tuned_model_info.json');

// تعریف نوع داده برای نمونه‌های آموزشی
export interface TrainingExample {
  text_input: string;
  output: string;
}

// تعریف نوع داده برای اطلاعات job آموزش
export interface TuningJobInfo {
  jobId: string;
  modelName: string;
  displayName: string;
  createdAt: string;
  state: string;
}

// تعریف نوع داده برای وضعیت job آموزش
export interface TuningJobStatus {
  state: string;
  modelName?: string;
  error?: string;
}

// تعریف نوع داده برای نتیجه تست مدل
export interface ModelTestResult {
  question: string;
  answer: string;
}

/**
 * سرویس آموزش CCOIN AI
 * این کلاس امکان آموزش و fine-tuning مدل‌های CCOIN AI را فراهم می‌کند
 */
class CcoinAITuningService {
  /**
   * بررسی در دسترس بودن سرویس
   * @returns وضعیت در دسترس بودن سرویس
   */
  isAvailable(): boolean {
    return !!API_KEY;
  }

  /**
   * بارگیری داده‌های آموزشی از فایل CSV
   * @param csvFilePath مسیر فایل CSV
   * @returns داده‌های آموزشی
   */
  async loadTrainingDataFromCSV(csvFilePath: string): Promise<TrainingExample[]> {
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
      const trainingData: TrainingExample[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // پردازش خط با در نظر گرفتن کاما درون کوتیشن
        const row = this.parseCSVLine(lines[i]);
        
        if (row.length > Math.max(textInputIndex, outputIndex)) {
          trainingData.push({
            text_input: row[textInputIndex].trim(),
            output: row[outputIndex].trim()
          });
        }
      }
      
      log(`تعداد ${trainingData.length} نمونه آموزشی از CSV بارگیری شد`, 'info');
      
      return trainingData;
      
    } catch (error: any) {
      log(`خطا در بارگیری داده‌های آموزشی از CSV: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * تجزیه خط CSV با در نظر گرفتن کاما درون کوتیشن
   * @param line خط CSV
   * @returns آرایه‌ای از مقادیر
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
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
   * @param jsonFilePath مسیر فایل JSON
   * @returns داده‌های آموزشی
   */
  async loadTrainingDataFromJSON(jsonFilePath: string): Promise<TrainingExample[]> {
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
      const trainingData: TrainingExample[] = data.map(item => {
        if (!item.text_input || !item.output) {
          throw new Error('هر نمونه آموزشی باید دارای فیلدهای text_input و output باشد');
        }
        
        return {
          text_input: item.text_input,
          output: item.output
        };
      });
      
      log(`تعداد ${trainingData.length} نمونه آموزشی از JSON بارگیری شد`, 'info');
      
      return trainingData;
      
    } catch (error: any) {
      log(`خطا در بارگیری داده‌های آموزشی از JSON: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * ایجاد و شروع یک job آموزش
   * @param trainingData داده‌های آموزشی
   * @param baseModel مدل پایه (پیش‌فرض: gemini-1.5-flash-001-tuning)
   * @param displayName نام نمایشی مدل
   * @returns اطلاعات job آموزش
   */
  async createTuningJob(
    trainingData: TrainingExample[],
    baseModel: string = 'gemini-1.5-flash-001-tuning',
    displayName: string = 'CCoinAI'
  ): Promise<TuningJobInfo> {
    try {
      if (!API_KEY) {
        throw new Error('کلید API تنظیم نشده است. لطفاً متغیر محیطی GOOGLE_AI_API_KEY یا CCOIN_AI_API_KEY را تنظیم کنید.');
      }
      
      if (!trainingData || trainingData.length === 0) {
        throw new Error('داده‌های آموزشی خالی است');
      }
      
      log(`شروع ایجاد job آموزش با ${trainingData.length} نمونه...`, 'info');
      
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
      const jobId = response.data.name.split('/').pop() as string;
      const createdAt = new Date().toISOString();
      const state = response.data.state || 'CREATING';
      const modelName = response.data.tunedModelName || `${baseModel}-tuned_${jobId}`;
      
      // ذخیره اطلاعات job
      const jobInfo: TuningJobInfo = {
        jobId,
        modelName,
        displayName,
        createdAt,
        state
      };
      
      // ذخیره اطلاعات در فایل
      this.saveTuningJobInfo(jobInfo);
      
      log(`job آموزش با شناسه ${jobId} با موفقیت ایجاد شد`, 'info');
      
      return jobInfo;
      
    } catch (error: any) {
      log(`خطا در ایجاد job آموزش: ${error.message}`, 'error');
      
      // بررسی خطاهای خاص API
      if (error.response && error.response.data) {
        log(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`, 'error');
      }
      
      throw error;
    }
  }

  /**
   * ذخیره اطلاعات job آموزش در فایل
   * @param jobInfo اطلاعات job
   */
  saveTuningJobInfo(jobInfo: TuningJobInfo): void {
    try {
      fs.writeFileSync(TUNED_MODEL_INFO_FILE, JSON.stringify(jobInfo, null, 2), 'utf8');
      log(`اطلاعات مدل در فایل tuned_model_info.json ذخیره شد`, 'info');
    } catch (error: any) {
      log(`خطا در ذخیره اطلاعات job: ${error.message}`, 'error');
    }
  }

  /**
   * بارگیری اطلاعات job آموزش از فایل
   * @returns اطلاعات job یا null در صورت عدم وجود
   */
  loadTuningJobInfo(): TuningJobInfo | null {
    try {
      if (!fs.existsSync(TUNED_MODEL_INFO_FILE)) {
        return null;
      }
      
      const fileContent = fs.readFileSync(TUNED_MODEL_INFO_FILE, 'utf8');
      return JSON.parse(fileContent);
      
    } catch (error: any) {
      log(`خطا در بارگیری اطلاعات job: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * بررسی وضعیت یک job آموزش
   * @param jobId شناسه job
   * @returns وضعیت job
   */
  async checkTuningJobStatus(jobId: string): Promise<TuningJobStatus> {
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
      
      log(`وضعیت job ${jobId}: ${state}`, 'info');
      
      if (state === 'SUCCEEDED' && modelName) {
        log(`مدل با نام ${modelName} با موفقیت آموزش دیده شد`, 'info');
        
        // به‌روزرسانی اطلاعات job در فایل
        const jobInfo = this.loadTuningJobInfo();
        if (jobInfo && jobInfo.jobId === jobId) {
          jobInfo.state = state;
          if (modelName) jobInfo.modelName = modelName;
          this.saveTuningJobInfo(jobInfo);
        }
      } else if (state === 'FAILED') {
        log(`job آموزش با شکست مواجه شد: ${response.data.error || 'دلیل نامشخص'}`, 'error');
      }
      
      return { state, modelName };
      
    } catch (error: any) {
      log(`خطا در بررسی وضعیت job: ${error.message}`, 'error');
      
      if (error.response && error.response.data) {
        log(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`, 'error');
      }
      
      throw error;
    }
  }

  /**
   * لیست کردن تمام مدل‌های آموزش‌دیده
   * @returns لیست مدل‌های آموزش‌دیده
   */
  async listTunedModels(): Promise<any[]> {
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
      
      log(`تعداد ${models.length} مدل آموزش‌دیده یافت شد`, 'info');
      
      // نمایش جزئیات هر مدل در لاگ
      models.forEach((model: any, index: number) => {
        log(`مدل ${index + 1}: ${model.tunedModelName} (${model.state})`, 'info');
      });
      
      return models;
      
    } catch (error: any) {
      log(`خطا در دریافت لیست مدل‌ها: ${error.message}`, 'error');
      
      if (error.response && error.response.data) {
        log(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`, 'error');
      }
      
      throw error;
    }
  }

  /**
   * تست یک مدل آموزش‌دیده با چند پرسش نمونه
   * @param modelName نام کامل مدل
   * @returns نتایج تست
   */
  async testTunedModel(modelName: string): Promise<ModelTestResult[]> {
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
      
      log(`تست مدل آموزش‌دیده ${modelName}...`, 'info');
      
      const results: ModelTestResult[] = [];
      
      // تست هر سؤال
      for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];
        log(`تست سؤال ${i+1}: ${question}`, 'info');
        
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
          log(`پاسخ: ${answer.substring(0, 100)}...`, 'info');
          
          results.push({ question, answer });
        } else {
          log(`خطا در دریافت پاسخ برای سؤال ${i+1}`, 'error');
          results.push({ question, answer: '(خطا در تولید پاسخ)' });
        }
      }
      
      log("تست مدل به پایان رسید.", 'info');
      
      return results;
      
    } catch (error: any) {
      log(`خطا در تست مدل: ${error.message}`, 'error');
      
      if (error.response && error.response.data) {
        log(`جزئیات خطای API: ${JSON.stringify(error.response.data)}`, 'error');
      }
      
      throw error;
    }
  }
}

// ایجاد نمونه از سرویس و صادر کردن آن
const ccoinAITuningService = new CcoinAITuningService();
export default ccoinAITuningService;