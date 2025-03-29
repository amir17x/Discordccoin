import fs from 'fs';
import path from 'path';
import { LogType } from './logger';

// تعریف نوع تنظیمات بات
export interface BotConfig {
  // URI دیتابیس مونگو
  mongodbUri?: string;
  
  // تنظیمات لاگ‌ها
  logChannels: {
    transaction?: string;
    game?: string;
    user?: string;
    admin?: string;
    security?: string;
    system?: string;
    error?: string;
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
    token?: string; // توکن دیسکورد (اختیاری - ترجیحاً از متغیر محیطی استفاده شود)
    clientId?: string; // آیدی کلاینت دیسکورد (اختیاری - ترجیحاً از متغیر محیطی استفاده شود)
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

  // بخش‌های فعال/غیرفعال
  features: {
    economy: boolean; // بخش اقتصادی
    games: boolean; // بازی‌ها
    inventory: boolean; // انبار و آیتم‌ها
    quests: boolean; // کوئست‌ها
    clans: boolean; // کلن‌ها
    war: boolean; // جنگ کلن‌ها
    island: boolean; // جزیره کلن
    shop: boolean; // فروشگاه
    wheel: boolean; // چرخ شانس
    robbery: boolean; // دزدی
    lottery: boolean; // لاتاری
    stocks: boolean; // بازار سهام
    investments: boolean; // سرمایه‌گذاری
    achievements: boolean; // دستاوردها
    giveaways: boolean; // گیواوی
  };
  
  // تنظیمات هوش مصنوعی
  ai?: {
    service?: 'googleai' | 'vertexai' | 'geminialt'; // سرویس فعال هوش مصنوعی
    googleModel?: string; // مدل Google AI
    responseStyle?: string; // سبک پاسخگویی (متعادل، خلاقانه، دقیق، طنزآمیز)
  };
}

// تنظیمات پیش‌فرض
const defaultConfig: BotConfig = {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ccoin',
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
    token: '',
    clientId: '',
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
  },
  features: {
    economy: true,
    games: true,
    inventory: true,
    quests: true,
    clans: true,
    war: true,
    island: true,
    shop: true,
    wheel: true,
    robbery: true,
    lottery: true,
    stocks: true,
    investments: true,
    achievements: true,
    giveaways: true
  },
  ai: {
    service: 'googleai',
    googleModel: 'gemini-1.5-pro',
    responseStyle: 'متعادل'
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
    // تنظیمات هوش مصنوعی
    const aiConfig = loadedConfig.ai 
      ? {
          ...loadedConfig.ai
        } 
      : defaultConfig.ai;
    
    return {
      mongodbUri: loadedConfig.mongodbUri || defaultConfig.mongodbUri,
      logChannels: { ...defaultConfig.logChannels, ...loadedConfig.logChannels },
      economy: { ...defaultConfig.economy, ...loadedConfig.economy },
      general: { ...defaultConfig.general, ...loadedConfig.general },
      games: { ...defaultConfig.games, ...loadedConfig.games },
      security: { ...defaultConfig.security, ...loadedConfig.security },
      features: { ...defaultConfig.features, ...loadedConfig.features },
      ai: aiConfig
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
   * دریافت تنظیمات هوش مصنوعی
   */
  public getAISettings(): NonNullable<BotConfig['ai']> {
    const defaultAISettings: NonNullable<BotConfig['ai']> = {
      service: 'googleai',
      googleModel: 'gemini-1.5-pro',
      responseStyle: 'متعادل'
    };
    
    return this.config.ai ? { ...defaultAISettings, ...this.config.ai } : defaultAISettings;
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
    (this.config.logChannels as any)[logType] = channelId;
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
    // نام کانال مستقیماً از مقدار enum استفاده می‌شود
    return (this.config.logChannels as any)[logType] || this.config.logChannels.default;
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

  /**
   * بروزرسانی وضعیت فعال/غیرفعال بودن قابلیت‌های ربات
   */
  public updateFeatureSettings(settings: Partial<BotConfig['features']>): void {
    this.config.features = { ...this.config.features, ...settings };
    this.saveConfig(this.config);
  }

  /**
   * بررسی فعال بودن یک قابلیت خاص
   * @param featureName نام قابلیت
   * @returns آیا قابلیت فعال است یا خیر
   */
  public isFeatureEnabled(featureName: keyof BotConfig['features']): boolean {
    return this.config.features?.[featureName] ?? true; // اگر در تنظیمات نباشد، به طور پیش‌فرض فعال است
  }

  /**
   * فعال/غیرفعال کردن یک قابلیت خاص
   * @param featureName نام قابلیت
   * @param enabled فعال یا غیرفعال
   */
  public setFeatureEnabled(featureName: keyof BotConfig['features'], enabled: boolean): void {
    if (!this.config.features) {
      this.config.features = { ...defaultConfig.features };
    }
    this.config.features[featureName] = enabled;
    this.saveConfig(this.config);
  }
  
  /**
   * بروزرسانی تنظیمات هوش مصنوعی
   * @param settings تنظیمات جدید
   */
  public updateAISettings(settings: Partial<NonNullable<BotConfig['ai']>>): void {
    if (!this.config.ai) {
      this.config.ai = {};
    }
    
    // تنظیمات را به‌روز می‌کنیم
    this.config.ai = { ...this.config.ai, ...settings };
    
    this.saveConfig(this.config);
  }
  
  /**
   * تغییر سرویس هوش مصنوعی فعال
   * @param service نام سرویس
   */
  public switchAIService(service: NonNullable<BotConfig['ai']>['service']): void {
    if (!this.config.ai) {
      this.config.ai = {};
    }
    this.config.ai.service = service;
    this.saveConfig(this.config);
  }
  
  /**
   * دریافت سرویس هوش مصنوعی فعال
   * @returns نام سرویس فعال یا مقدار پیش‌فرض
   */
  public getActiveAIService(): string {
    return this.config.ai?.service || 'googleai';
  }
}

// اکسپورت کردن نمونه تنظیمات
export const botConfig = BotConfigManager.getInstance();