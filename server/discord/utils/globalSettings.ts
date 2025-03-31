import { storage } from '../../storage';

/**
 * یک کلاس ابزاری برای مدیریت تنظیمات عمومی برنامه
 * این کلاس امکان ذخیره، بازیابی و حذف تنظیمات کلی را فراهم می‌کند
 */
export class GlobalSettingsManager {
  /**
   * دریافت یک تنظیم عمومی با کلید مشخص
   * @param key کلید تنظیم
   * @returns مقدار تنظیم یا null در صورت عدم وجود
   */
  static async get(key: string): Promise<string | null> {
    return await storage.getGlobalSetting(key);
  }

  /**
   * ذخیره یک تنظیم عمومی با کلید و مقدار مشخص
   * @param key کلید تنظیم
   * @param value مقدار تنظیم
   * @returns نتیجه عملیات به صورت boolean
   */
  static async set(key: string, value: string): Promise<boolean> {
    return await storage.setGlobalSetting(key, value);
  }

  /**
   * حذف یک تنظیم عمومی با کلید مشخص
   * @param key کلید تنظیم
   * @returns نتیجه عملیات به صورت boolean
   */
  static async delete(key: string): Promise<boolean> {
    return await storage.deleteGlobalSetting(key);
  }

  /**
   * دریافت یک تنظیم عمومی به صورت عدد
   * @param key کلید تنظیم
   * @param defaultValue مقدار پیش‌فرض در صورت عدم وجود تنظیم
   * @returns مقدار عددی تنظیم یا مقدار پیش‌فرض
   */
  static async getNumber(key: string, defaultValue: number = 0): Promise<number> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * دریافت یک تنظیم عمومی به صورت boolean
   * @param key کلید تنظیم
   * @param defaultValue مقدار پیش‌فرض در صورت عدم وجود تنظیم
   * @returns مقدار boolean تنظیم یا مقدار پیش‌فرض
   */
  static async getBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    
    return value.toLowerCase() === 'true';
  }

  /**
   * دریافت یک تنظیم عمومی به صورت آرایه
   * @param key کلید تنظیم
   * @returns آرایه‌ای از مقادیر یا آرایه خالی در صورت عدم وجود تنظیم
   */
  static async getArray(key: string): Promise<string[]> {
    const value = await this.get(key);
    if (value === null) return [];
    
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error parsing array setting for key ${key}:`, error);
      return [];
    }
  }

  /**
   * ذخیره یک آرایه به عنوان تنظیم عمومی
   * @param key کلید تنظیم
   * @param array آرایه‌ای از مقادیر
   * @returns نتیجه عملیات به صورت boolean
   */
  static async setArray(key: string, array: any[]): Promise<boolean> {
    try {
      const value = JSON.stringify(array);
      return await this.set(key, value);
    } catch (error) {
      console.error(`Error storing array setting for key ${key}:`, error);
      return false;
    }
  }

  /**
   * دریافت یک تنظیم عمومی به صورت شیء
   * @param key کلید تنظیم
   * @returns شیء بازیابی شده یا null در صورت عدم وجود تنظیم
   */
  static async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing object setting for key ${key}:`, error);
      return null;
    }
  }

  /**
   * ذخیره یک شیء به عنوان تنظیم عمومی
   * @param key کلید تنظیم
   * @param obj شیء مورد نظر
   * @returns نتیجه عملیات به صورت boolean
   */
  static async setObject<T>(key: string, obj: T): Promise<boolean> {
    try {
      const value = JSON.stringify(obj);
      return await this.set(key, value);
    } catch (error) {
      console.error(`Error storing object setting for key ${key}:`, error);
      return false;
    }
  }
}

/**
 * تعدادی از کلیدهای مهم تنظیمات سیستمی به صورت ثابت
 * برای استفاده در سرتاسر برنامه
 */
export const GlobalSettingKeys = {
  // تنظیمات سیستم اقتصادی
  TRANSACTION_FEE_PERCENT: 'transaction_fee_percent',
  DAILY_REWARD_BASE: 'daily_reward_base',
  DAILY_REWARD_STREAK_BONUS: 'daily_reward_streak_bonus',
  MIN_BANK_ACCOUNT_LEVEL: 'min_bank_account_level',
  INTEREST_RATE_PERCENT: 'interest_rate_percent',
  
  // تنظیمات سیستم دزدی
  ROBBERY_WINDOW_MINUTES: 'robbery_window_minutes',
  ROBBERY_CHANCE_BASE: 'robbery_chance_base',
  ROBBERY_MIN_AMOUNT: 'robbery_min_amount',
  ROBBERY_MAX_TARGETS: 'robbery_max_targets',
  ROBBERY_COOLDOWN_MINUTES: 'robbery_cooldown_minutes',
  
  // تنظیمات سیستم مسابقات و بازی‌ها
  QUIZ_REWARD_BASE: 'quiz_reward_base',
  DUEL_MIN_BET: 'duel_min_bet',
  DUEL_MAX_BET: 'duel_max_bet',
  
  // تنظیمات سیستم‌های اجتماعی
  MAX_FRIENDS: 'max_friends',
  BEST_FRIEND_MAX_COUNT: 'best_friend_max_count',
  
  // تنظیمات عمومی برنامه
  BOT_MAINTENANCE_MODE: 'bot_maintenance_mode',
  LAST_ANNOUNCEMENT: 'last_announcement',
  LATEST_VERSION: 'latest_version',
};