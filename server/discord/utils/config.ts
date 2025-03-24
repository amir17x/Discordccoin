import fs from 'fs';
import path from 'path';
import { LogType } from './logger';

// تعریف نوع تنظیمات بات
export interface BotConfig {
  // تنظیمات لاگ‌ها
  logChannels: {
    [LogType.TRANSACTION]?: string;
    [LogType.GAME]?: string;
    [LogType.USER]?: string;
    [LogType.ADMIN]?: string;
    [LogType.SECURITY]?: string;
    [LogType.SYSTEM]?: string;
    [LogType.ERROR]?: string;
    default?: string;
  };
  
  // تنظیمات اقتصادی
  economy: {
    bankInterestRate: number; // نرخ سود بانکی (درصد)
    transferFeeRate: number; // نرخ کارمزد انتقال سکه (درصد)
    initialBalance: number; // موجودی اولیه کاربران جدید
    dailyReward: number; // جایزه روزانه
    dailyStreakBonus: number; // بونوس استریک روزانه
  };
  
  // تنظیمات عمومی
  general: {
    prefix: string; // پیشوند دستورات متنی (اگر از اسلش کامند استفاده نشود)
    adminRoleId: string; // آی‌دی رول ادمین
    moderatorRoleId: string; // آی‌دی رول مدیریت
    guildId: string; // آی‌دی سرور اصلی
  };
  
  // تنظیمات بازی‌ها
  games: {
    minBet: number; // حداقل شرط‌بندی
    maxBet: number; // حداکثر شرط‌بندی
    disabledGames: string[]; // لیست بازی‌های غیرفعال
  };
  
  // تنظیمات امنیتی
  security: {
    antiSpam: boolean; // فعال/غیرفعال بودن آنتی اسپم
    maxTransferPerDay: number; // حداکثر انتقال روزانه
    maxTransferPerUser: number; // حداکثر انتقال به هر کاربر
    stealCooldown: number; // زمان بین دزدی‌ها (به دقیقه)
    maxStealPerDay: number; // حداکثر تعداد دزدی در روز
  };
}

// تنظیمات پیش‌فرض
const defaultConfig: BotConfig = {
  logChannels: {
    // تنظیم کانال پیش‌فرض برای لاگ‌ها (اگر کانال خاصی برای هر نوع لاگ تنظیم نشده باشد)
    default: undefined
  },
  economy: {
    bankInterestRate: 2, // 2%
    transferFeeRate: 1, // 1%
    initialBalance: 500,
    dailyReward: 50,
    dailyStreakBonus: 200, // برای 7 روز متوالی
  },
  general: {
    prefix: '!',
    adminRoleId: '1343981256949497988',
    moderatorRoleId: '',
    guildId: '',
  },
  games: {
    minBet: 10,
    maxBet: 1000,
    disabledGames: [],
  },
  security: {
    antiSpam: true,
    maxTransferPerDay: 5000,
    maxTransferPerUser: 2000,
    stealCooldown: 240, // 4 ساعت
    maxStealPerDay: 5,
  }
};

// مسیر فایل تنظیمات
const CONFIG_FILE = path.join(process.cwd(), 'bot_config.json');

// کلاس کانفیگ بات
export class BotConfigManager {
  private static instance: BotConfigManager;
  private config: BotConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  /**
   * دریافت نمونه مدیریت تنظیمات (Singleton)
   */
  public static getInstance(): BotConfigManager {
    if (!BotConfigManager.instance) {
      BotConfigManager.instance = new BotConfigManager();
    }
    return BotConfigManager.instance;
  }

  /**
   * بارگذاری تنظیمات از فایل
   */
  private loadConfig(): BotConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        const loadedConfig = JSON.parse(data);
        return this.mergeWithDefaults(loadedConfig);
      } else {
        this.saveConfig(defaultConfig);
        return { ...defaultConfig };
      }
    } catch (error) {
      console.error('خطا در بارگذاری تنظیمات:', error);
      this.saveConfig(defaultConfig);
      return { ...defaultConfig };
    }
  }

  /**
   * ادغام تنظیمات بارگذاری شده با مقادیر پیش‌فرض
   */
  private mergeWithDefaults(loadedConfig: Partial<BotConfig>): BotConfig {
    return {
      logChannels: { ...defaultConfig.logChannels, ...loadedConfig.logChannels },
      economy: { ...defaultConfig.economy, ...loadedConfig.economy },
      general: { ...defaultConfig.general, ...loadedConfig.general },
      games: { ...defaultConfig.games, ...loadedConfig.games },
      security: { ...defaultConfig.security, ...loadedConfig.security },
    };
  }

  /**
   * ذخیره تنظیمات در فایل
   */
  private saveConfig(config: BotConfig): void {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error);
    }
  }

  /**
   * دریافت تمام تنظیمات
   */
  public getConfig(): BotConfig {
    return { ...this.config };
  }

  /**
   * بروزرسانی بخشی از تنظیمات
   */
  public updateConfig(partialConfig: Partial<BotConfig>): void {
    this.config = this.mergeWithDefaults(partialConfig);
    this.saveConfig(this.config);
  }

  /**
   * تنظیم کانال لاگ
   */
  public setLogChannel(logType: LogType, channelId: string): void {
    this.config.logChannels[logType] = channelId;
    this.saveConfig(this.config);
  }

  /**
   * تنظیم کانال پیش‌فرض لاگ
   */
  public setDefaultLogChannel(channelId: string): void {
    this.config.logChannels.default = channelId;
    this.saveConfig(this.config);
  }

  /**
   * دریافت آی‌دی کانال لاگ
   */
  public getLogChannel(logType: LogType): string | undefined {
    return this.config.logChannels[logType] || this.config.logChannels.default;
  }

  /**
   * تنظیم نرخ سود بانکی
   */
  public setBankInterestRate(rate: number): void {
    this.config.economy.bankInterestRate = rate;
    this.saveConfig(this.config);
  }

  /**
   * تنظیم نرخ کارمزد انتقال
   */
  public setTransferFeeRate(rate: number): void {
    this.config.economy.transferFeeRate = rate;
    this.saveConfig(this.config);
  }

  /**
   * بروزرسانی تنظیمات امنیتی
   */
  public updateSecuritySettings(settings: Partial<BotConfig['security']>): void {
    this.config.security = { ...this.config.security, ...settings };
    this.saveConfig(this.config);
  }

  /**
   * بروزرسانی تنظیمات بازی‌ها
   */
  public updateGameSettings(settings: Partial<BotConfig['games']>): void {
    this.config.games = { ...this.config.games, ...settings };
    this.saveConfig(this.config);
  }
}

// اکسپورت کردن نمونه تنظیمات
export const botConfig = BotConfigManager.getInstance();