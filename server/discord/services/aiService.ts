/**
 * سرویس مدیریت هوش مصنوعی
 * این سرویس امکان انتخاب و جابجایی بین سرویس‌های مختلف هوش مصنوعی را فراهم می‌کند
 */

import { log } from '../../vite';
import { chatGPTService } from './chatgpt';
import { huggingFaceService } from './huggingface';
import fs from 'fs';
import path from 'path';

// نوع‌های سرویس هوش مصنوعی
export enum AIServiceType {
  HUGGINGFACE = 'huggingface',
  OPENAI = 'openai'
}

// مسیر فایل تنظیمات ربات
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_CONFIG_PATH = process.env.BOT_CONFIG_PATH || path.join(__dirname, '..', '..', '..', 'bot_config.json');

/**
 * کلاس مدیریت سرویس‌های هوش مصنوعی
 * این کلاس امکان انتخاب و استفاده از سرویس‌های مختلف هوش مصنوعی را فراهم می‌کند
 */
class AIService {
  private activeService: AIServiceType = AIServiceType.HUGGINGFACE;
  
  constructor() {
    this.initialize();
  }

  /**
   * مقداردهی اولیه سرویس
   */
  private initialize() {
    try {
      // خواندن تنظیمات ربات برای تعیین سرویس فعال
      if (fs.existsSync(BOT_CONFIG_PATH)) {
        const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
        const botConfig = JSON.parse(configContent);
        
        // بررسی وجود تنظیمات هوش مصنوعی
        if (botConfig.ai && botConfig.ai.service) {
          this.activeService = botConfig.ai.service;
        } else {
          // ایجاد بخش تنظیمات هوش مصنوعی اگر وجود ندارد
          botConfig.ai = {
            service: AIServiceType.HUGGINGFACE
          };
          
          // ذخیره تنظیمات
          fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf8');
        }
      }
      
      log(`سرویس هوش مصنوعی با سرویس پیش‌فرض ${this.activeService} راه‌اندازی شد`, 'success');
    } catch (error) {
      log(`خطا در مقداردهی اولیه سرویس هوش مصنوعی: ${error}`, 'error');
      // استفاده از Hugging Face به عنوان سرویس پیش‌فرض در صورت خطا
      this.activeService = AIServiceType.HUGGINGFACE;
    }
  }

  /**
   * تغییر سرویس هوش مصنوعی فعال
   * @param serviceType نوع سرویس هوش مصنوعی
   * @returns نتیجه تغییر سرویس
   */
  async changeActiveService(serviceType: AIServiceType): Promise<boolean> {
    try {
      // بررسی اعتبار و دسترسی‌پذیری سرویس جدید
      let isServiceAvailable = false;
      
      if (serviceType === AIServiceType.HUGGINGFACE) {
        const status = await huggingFaceService.checkConnectionStatus();
        isServiceAvailable = status.isAvailable;
      } else if (serviceType === AIServiceType.OPENAI) {
        const status = await chatGPTService.checkConnectionStatus();
        isServiceAvailable = status.isAvailable;
      }
      
      if (!isServiceAvailable) {
        log(`سرویس ${serviceType} در دسترس نیست و نمی‌تواند فعال شود`, 'error');
        return false;
      }
      
      // تغییر سرویس فعال
      this.activeService = serviceType;
      
      // بروزرسانی تنظیمات در فایل تنظیمات
      if (fs.existsSync(BOT_CONFIG_PATH)) {
        const configContent = fs.readFileSync(BOT_CONFIG_PATH, 'utf8');
        const botConfig = JSON.parse(configContent);
        
        // بروزرسانی یا ایجاد بخش تنظیمات هوش مصنوعی
        botConfig.ai = botConfig.ai || {};
        botConfig.ai.service = serviceType;
        
        // ذخیره تنظیمات
        fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf8');
      }
      
      log(`سرویس هوش مصنوعی فعال به ${serviceType} تغییر یافت`, 'success');
      return true;
    } catch (error) {
      log(`خطا در تغییر سرویس هوش مصنوعی: ${error}`, 'error');
      return false;
    }
  }

  /**
   * دریافت سرویس هوش مصنوعی فعال
   * @returns نوع سرویس هوش مصنوعی فعال
   */
  getActiveService(): AIServiceType {
    return this.activeService;
  }

  /**
   * بررسی وضعیت اتصال به سرویس هوش مصنوعی فعال
   * @returns وضعیت اتصال
   */
  async checkConnectionStatus(): Promise<{ isAvailable: boolean; statusCode: number; message: string }> {
    if (this.activeService === AIServiceType.HUGGINGFACE) {
      return await huggingFaceService.checkConnectionStatus();
    } else if (this.activeService === AIServiceType.OPENAI) {
      return await chatGPTService.checkConnectionStatus();
    } else {
      return {
        isAvailable: false,
        statusCode: -1,
        message: 'سرویس هوش مصنوعی نامعتبر'
      };
    }
  }
  
  /**
   * دریافت پاسخ از هوش مصنوعی فعال
   * @param prompt متن درخواست
   * @param options تنظیمات اختیاری
   * @returns پاسخ دریافتی از هوش مصنوعی
   */
  async getAIResponse(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}): Promise<string> {
    try {
      if (this.activeService === AIServiceType.HUGGINGFACE) {
        return await huggingFaceService.getAIResponse(prompt, options);
      } else if (this.activeService === AIServiceType.OPENAI) {
        return await chatGPTService.getChatGPTResponse(prompt, options);
      } else {
        throw new Error('سرویس هوش مصنوعی نامعتبر');
      }
    } catch (error) {
      log(`خطا در دریافت پاسخ از هوش مصنوعی: ${error}`, 'error');
      return 'متأسفانه خطایی در ارتباط با سرویس هوش مصنوعی رخ داد. لطفاً بعداً دوباره تلاش کنید.';
    }
  }
  
  /**
   * تست سرعت اتصال به سرویس هوش مصنوعی فعال
   * @returns زمان پاسخگویی به میلی‌ثانیه یا کد خطا
   */
  async pingAIService(): Promise<number> {
    try {
      if (this.activeService === AIServiceType.HUGGINGFACE) {
        return await huggingFaceService.pingHuggingFace();
      } else if (this.activeService === AIServiceType.OPENAI) {
        return await chatGPTService.pingChatGPT();
      } else {
        return -1; // کد خطای عمومی
      }
    } catch (error) {
      log(`خطا در تست سرعت اتصال به هوش مصنوعی: ${error}`, 'error');
      return -1; // کد خطای عمومی
    }
  }
  
  /**
   * دریافت اطلاعات وضعیت سرویس‌های هوش مصنوعی
   * @returns اطلاعات وضعیت سرویس‌ها
   */
  async getAIServicesStatus(): Promise<{
    activeService: AIServiceType;
    services: {
      [key in AIServiceType]: {
        isAvailable: boolean;
        responseTime?: number;
        statusMessage: string;
      }
    }
  }> {
    try {
      // بررسی وضعیت Hugging Face
      const hfStatus = await huggingFaceService.checkConnectionStatus();
      let hfResponseTime: number | undefined = undefined;
      if (hfStatus.isAvailable) {
        hfResponseTime = await huggingFaceService.pingHuggingFace();
      }
      
      // بررسی وضعیت OpenAI
      const openaiStatus = await chatGPTService.checkConnectionStatus();
      let openaiResponseTime: number | undefined = undefined;
      if (openaiStatus.isAvailable) {
        openaiResponseTime = await chatGPTService.pingChatGPT();
      }
      
      return {
        activeService: this.activeService,
        services: {
          [AIServiceType.HUGGINGFACE]: {
            isAvailable: hfStatus.isAvailable,
            responseTime: hfResponseTime,
            statusMessage: hfStatus.message
          },
          [AIServiceType.OPENAI]: {
            isAvailable: openaiStatus.isAvailable,
            responseTime: openaiResponseTime,
            statusMessage: openaiStatus.message
          }
        }
      };
    } catch (error) {
      log(`خطا در دریافت اطلاعات وضعیت سرویس‌های هوش مصنوعی: ${error}`, 'error');
      
      // بازگرداندن اطلاعات پیش‌فرض در صورت خطا
      return {
        activeService: this.activeService,
        services: {
          [AIServiceType.HUGGINGFACE]: {
            isAvailable: false,
            statusMessage: 'خطا در دریافت وضعیت'
          },
          [AIServiceType.OPENAI]: {
            isAvailable: false,
            statusMessage: 'خطا در دریافت وضعیت'
          }
        }
      };
    }
  }
}

// صادر کردن نمونه سینگلتون از سرویس
export const aiService = new AIService();