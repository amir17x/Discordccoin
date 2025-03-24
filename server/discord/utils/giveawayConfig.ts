import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// برای سازگاری با ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ساختار تنظیمات ارتباط با ربات گیواوی
 */
export interface GiveawayConfig {
  // آدرس API ربات گیواوی
  apiUrl: string;
  // کلید امنیتی API
  apiKey: string;
  // قیمت هر بلیط به Ccoin
  ticketPrice: number;
  // نسبت دعوت به بلیط
  inviteRatio: {
    invites: number;  // تعداد دعوت لازم
    tickets: number;  // تعداد بلیط پاداش
  };
  // وضعیت اتصال
  enabled: boolean;
}

// تنظیمات پیش‌فرض
const defaultConfig: GiveawayConfig = {
  apiUrl: process.env.GIVEAWAY_API_URL || 'http://localhost:3000/api',
  apiKey: process.env.GIVEAWAY_API_KEY || 'default_secure_key_change_this',
  ticketPrice: 100,  // هر بلیط 100 سکه
  inviteRatio: {
    invites: 5,   // هر 5 دعوت
    tickets: 1    // 1 بلیط
  },
  enabled: true
};

/**
 * کلاس مدیریت تنظیمات ارتباط با ربات گیواوی
 */
class GiveawayConfigManager {
  private static instance: GiveawayConfigManager;
  private config: GiveawayConfig;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(__dirname, '../../../giveaway_config.json');
    this.config = this.loadConfig();
  }

  /**
   * دریافت نمونه مدیریت تنظیمات (Singleton)
   */
  public static getInstance(): GiveawayConfigManager {
    if (!GiveawayConfigManager.instance) {
      GiveawayConfigManager.instance = new GiveawayConfigManager();
    }
    return GiveawayConfigManager.instance;
  }

  /**
   * بارگذاری تنظیمات از فایل
   */
  private loadConfig(): GiveawayConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const loadedConfig = JSON.parse(configData);
        return this.mergeWithDefaults(loadedConfig);
      }
      
      // ایجاد فایل با تنظیمات پیش‌فرض اگر وجود ندارد
      this.saveConfig(defaultConfig);
      return defaultConfig;
    } catch (error) {
      console.error('Error loading giveaway config:', error);
      return defaultConfig;
    }
  }

  /**
   * ادغام تنظیمات بارگذاری شده با مقادیر پیش‌فرض
   */
  private mergeWithDefaults(loadedConfig: Partial<GiveawayConfig>): GiveawayConfig {
    return {
      ...defaultConfig,
      ...loadedConfig,
      inviteRatio: {
        ...defaultConfig.inviteRatio,
        ...(loadedConfig.inviteRatio || {})
      }
    };
  }

  /**
   * ذخیره تنظیمات در فایل
   */
  private saveConfig(config: GiveawayConfig): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving giveaway config:', error);
    }
  }

  /**
   * دریافت تمام تنظیمات
   */
  public getConfig(): GiveawayConfig {
    return { ...this.config };
  }

  /**
   * بروزرسانی بخشی از تنظیمات
   */
  public updateConfig(partialConfig: Partial<GiveawayConfig>): void {
    this.config = {
      ...this.config,
      ...partialConfig,
      inviteRatio: {
        ...this.config.inviteRatio,
        ...(partialConfig.inviteRatio || {})
      }
    };
    this.saveConfig(this.config);
  }

  /**
   * تنظیم قیمت بلیط
   */
  public setTicketPrice(price: number): void {
    if (price < 0) {
      throw new Error('قیمت بلیط نمی‌تواند منفی باشد');
    }
    
    this.config.ticketPrice = price;
    this.saveConfig(this.config);
  }

  /**
   * تنظیم نسبت دعوت به بلیط
   */
  public setInviteRatio(invites: number, tickets: number): void {
    if (invites <= 0 || tickets <= 0) {
      throw new Error('مقادیر باید مثبت باشند');
    }
    
    this.config.inviteRatio = { invites, tickets };
    this.saveConfig(this.config);
  }

  /**
   * فعال/غیرفعال کردن اتصال
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig(this.config);
  }

  /**
   * تنظیم آدرس API
   */
  public setApiUrl(url: string): void {
    this.config.apiUrl = url;
    this.saveConfig(this.config);
  }

  /**
   * تنظیم کلید API
   */
  public setApiKey(key: string): void {
    this.config.apiKey = key;
    this.saveConfig(this.config);
  }
}

export const giveawayConfigManager = GiveawayConfigManager.getInstance();
export const config = giveawayConfigManager.getConfig();