/**
 * سیستم کش LRU برای سرویس CCOIN AI
 * این سیستم کش باعث کاهش تعداد درخواست‌ها به API و افزایش سرعت پاسخگویی می‌شود
 */

/**
 * کلاس مدیریت کش LRU برای CCOIN AI
 * Least Recently Used (LRU) caching strategy
 */
export class CCOINAICache {
  private cache: Map<string, { response: string, timestamp: number }>;
  private readonly MAX_SIZE: number = 100;
  private readonly EXPIRY_TIME: number = 24 * 60 * 60 * 1000; // 24 ساعت

  constructor() {
    this.cache = new Map();
  }

  /**
   * هش کردن پرامپت برای استفاده به عنوان کلید
   * @param prompt پرامپت درخواستی
   * @param temperature میزان خلاقیت
   * @param maxTokens حداکثر تعداد توکن‌ها
   * @returns کلید هش شده
   */
  private hashPrompt(prompt: string, temperature: number, maxTokens: number = 0): string {
    // ترکیب پارامترها برای ایجاد یک کلید منحصر به فرد
    return `${prompt}_${temperature.toFixed(2)}_${maxTokens}`;
  }

  /**
   * ذخیره پاسخ در کش
   * @param prompt پرامپت درخواستی
   * @param response پاسخ دریافتی
   * @param temperature میزان خلاقیت
   * @param maxTokens حداکثر تعداد توکن‌ها
   */
  set(prompt: string, response: string, temperature: number, maxTokens: number = 0): void {
    const key = this.hashPrompt(prompt, temperature, maxTokens);
    
    // اگر اندازه کش به حداکثر رسیده، قدیمی‌ترین آیتم را حذف می‌کنیم
    if (this.cache.size >= this.MAX_SIZE) {
      let oldestTime = Date.now();
      let oldestKey = '';
      
      this.cache.forEach((value, k) => {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestKey = k;
        }
      });
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    // افزودن آیتم جدید به کش
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * دریافت پاسخ از کش (در صورت وجود)
   * @param prompt پرامپت درخواستی
   * @param temperature میزان خلاقیت
   * @param maxTokens حداکثر تعداد توکن‌ها
   * @returns پاسخ کش شده یا null
   */
  get(prompt: string, temperature: number, maxTokens: number = 0): string | null {
    const key = this.hashPrompt(prompt, temperature, maxTokens);
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // بررسی اعتبار زمانی کش
    const now = Date.now();
    if (now - item.timestamp > this.EXPIRY_TIME) {
      // حذف آیتم منقضی شده
      this.cache.delete(key);
      return null;
    }
    
    // به‌روزرسانی زمان آیتم برای استراتژی LRU
    item.timestamp = now;
    this.cache.set(key, item);
    
    return item.response;
  }

  /**
   * پاک کردن کل کش
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * حذف موارد منقضی شده از کش
   * @returns تعداد موارد حذف شده
   */
  cleanExpired(): number {
    const now = Date.now();
    let deletedCount = 0;
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.EXPIRY_TIME) {
        this.cache.delete(key);
        deletedCount++;
      }
    });
    
    return deletedCount;
  }

  /**
   * دریافت اندازه فعلی کش
   * @returns تعداد موارد کش شده
   */
  size(): number {
    return this.cache.size;
  }
}

// ایجاد یک نمونه سینگلتون از کش برای استفاده در کل برنامه
const aiCache = new CCOINAICache();
export default aiCache;