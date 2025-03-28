// سیستم ساده کش برای کاهش فراخوانی‌های مکرر پایگاه داده
// این سیستم از Map برای ذخیره موقت داده‌ها استفاده می‌کند

// مدت زمان اعتبار کش (5 دقیقه)
const CACHE_TTL = 5 * 60 * 1000;

// کش اصلی با ساختار دو سطحی
const cache = new Map<string, Map<string, { data: any, expires: number }>>();

/**
 * ذخیره داده در کش
 * @param category دسته‌بندی داده (مثل 'users', 'items', و غیره)
 * @param key کلید یکتا برای داده 
 * @param data داده مورد نظر
 * @param ttl مدت زمان اعتبار (پیش‌فرض: 5 دقیقه)
 */
export function setCache<T>(category: string, key: string, data: T, ttl: number = CACHE_TTL): void {
  if (!cache.has(category)) {
    cache.set(category, new Map());
  }
  
  const categoryCache = cache.get(category)!;
  categoryCache.set(key, {
    data,
    expires: Date.now() + ttl
  });
}

/**
 * دریافت داده از کش
 * @param category دسته‌بندی داده
 * @param key کلید یکتا
 * @returns داده ذخیره شده یا undefined اگر وجود نداشته باشد یا منقضی شده باشد
 */
export function getCache<T>(category: string, key: string): T | undefined {
  const categoryCache = cache.get(category);
  if (!categoryCache) return undefined;
  
  const entry = categoryCache.get(key);
  if (!entry) return undefined;
  
  // بررسی انقضا
  if (entry.expires < Date.now()) {
    categoryCache.delete(key);
    return undefined;
  }
  
  return entry.data as T;
}

/**
 * حذف داده از کش
 * @param category دسته‌بندی داده
 * @param key کلید یکتا
 */
export function deleteCache(category: string, key: string): void {
  const categoryCache = cache.get(category);
  if (categoryCache) {
    categoryCache.delete(key);
  }
}

/**
 * حذف تمام داده‌های یک دسته‌بندی از کش
 * @param category دسته‌بندی داده
 */
export function clearCategoryCache(category: string): void {
  cache.delete(category);
}

/**
 * حذف تمام داده‌های کش
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * بازیابی تعداد آیتم‌های موجود در کش
 * @returns تعداد آیتم‌های کش
 */
export function getCacheStats(): { categories: number, totalEntries: number } {
  let totalEntries = 0;
  cache.forEach(categoryCache => {
    totalEntries += categoryCache.size;
  });
  
  return {
    categories: cache.size,
    totalEntries
  };
}

// پاکسازی خودکار موارد منقضی شده هر دقیقه
setInterval(() => {
  const now = Date.now();
  cache.forEach((categoryCache, category) => {
    categoryCache.forEach((entry, key) => {
      if (entry.expires < now) {
        categoryCache.delete(key);
      }
    });
    
    // اگر دسته‌بندی خالی شد، آن را حذف کنیم
    if (categoryCache.size === 0) {
      cache.delete(category);
    }
  });
}, 60000); // هر یک دقیقه