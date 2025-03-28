import mongoose from 'mongoose';
import UserModel from './models/User';
import ItemModel from './models/Item';
import QuestModel from './models/Quest';
import ClanModel from './models/Clan';
import TipChannelModel from './models/TipChannel';
import { QuizQuestionModel } from './models/QuizQuestion';
import { QuizReviewerModel } from './models/QuizReviewer';
import { GameSessionModel } from './models/GameSession';

// تعریف اینترفیس برای کش
interface CacheItem {
  value: any;
  expiry: number;
}

// تعریف اینترفیس برای آبجکت کش
interface CacheStore {
  [key: string]: Map<string, CacheItem>;
}

// کش سازی در حافظه برای افزایش کارایی
const cache: CacheStore = {
  users: new Map<string, CacheItem>(),
  items: new Map<string, CacheItem>(),
  clans: new Map<string, CacheItem>(),
  quests: new Map<string, CacheItem>(),
  tipChannels: new Map<string, CacheItem>(),
  quizQuestions: new Map<string, CacheItem>(),
  gameSessions: new Map<string, CacheItem>(),
  quizReviewers: new Map<string, CacheItem>()
};

// مدت زمان اعتبار کش به میلی‌ثانیه (5 دقیقه)
const CACHE_TTL = 5 * 60 * 1000;

// صادر کردن مدل‌ها برای استفاده در سایر ماژول‌ها
export { 
  UserModel, 
  ItemModel, 
  QuestModel, 
  ClanModel, 
  TipChannelModel,
  QuizQuestionModel,
  GameSessionModel,
  QuizReviewerModel,
  cache
};

/**
 * پاکسازی تمامی کش‌های ذخیره شده
 */
export function clearAllCache(): void {
  Object.values(cache).forEach(cacheMap => cacheMap.clear());
  console.log('🧹 تمامی کش‌ها پاکسازی شدند');
}

/**
 * راه‌اندازی اتصال به دیتابیس MongoDB با بهینه‌سازی‌های لازم
 * @returns Promise که با اتصال موفق به دیتابیس حل می‌شود
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  try {
    // بررسی وجود URI اتصال به MongoDB
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ متغیر محیطی MONGODB_URI پیدا نشد. از قابلیت‌های پایگاه داده استفاده نمی‌شود.');
      throw new Error('لطفاً متغیر محیطی MONGODB_URI را تنظیم کنید');
    }

    // بررسی اتصال موجود - جلوگیری از اتصال‌های تکراری
    if (mongoose.connection.readyState === 1) {
      console.log('🔄 اتصال به MongoDB قبلاً برقرار شده است');
      return mongoose;
    }

    // تنظیم گزینه‌های اتصال با بهینه‌سازی
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      connectTimeoutMS: 10000,
      maxPoolSize: 100, // افزایش تعداد اتصال‌ها برای عملکرد بهتر
      minPoolSize: 5, // حداقل اتصال‌های فعال
      socketTimeoutMS: 45000, // زمان انتظار طولانی‌تر برای عملیات‌های سنگین
      keepAlive: true, // حفظ اتصال
      keepAliveInitialDelay: 300000, // تأخیر اولیه برای حفظ اتصال (5 دقیقه)
      autoIndex: false, // غیرفعال کردن ایندکس خودکار در محیط تولید
      maxIdleTimeMS: 60000 // حداکثر زمان بیکار بودن یک اتصال (1 دقیقه)
    };

    // اتصال به دیتابیس
    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('🗄️ اتصال به MongoDB با موفقیت برقرار شد');
    
    // تنظیم پیام اتصال
    mongoose.connection.on('connected', () => {
      console.log('🔄 اتصال به MongoDB مجدداً برقرار شد');
    });
    
    // تنظیم پیام قطع اتصال
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ اتصال به MongoDB قطع شد');
      // پاکسازی کش هنگام قطع اتصال
      clearAllCache();
    });
    
    // تنظیم پیام خطا با تلاش مجدد خودکار
    mongoose.connection.on('error', (err) => {
      console.error('❌ خطا در اتصال به MongoDB:', err);
      // تلاش مجدد برای اتصال بعد از 5 ثانیه
      setTimeout(() => {
        console.log('🔄 تلاش مجدد برای اتصال به MongoDB...');
        if (process.env.MONGODB_URI) {
          mongoose.connect(process.env.MONGODB_URI, options).catch(err => {
            console.error('❌ خطا در تلاش مجدد برای اتصال:', err);
          });
        }
      }, 5000);
    });
    
    return connection;
  } catch (error) {
    console.error('❌ خطا در اتصال به MongoDB:', error);
    throw error;
  }
}

/**
 * بستن اتصال به دیتابیس MongoDB
 * @returns Promise که با بستن موفق اتصال حل می‌شود
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('🔌 اتصال به MongoDB بسته شد');
    // پاکسازی کش هنگام بستن اتصال
    clearAllCache();
  } catch (error) {
    console.error('❌ خطا در بستن اتصال به MongoDB:', error);
    throw error;
  }
}

/**
 * ذخیره یک مورد در کش
 * @param cacheName نام کش (users, items, etc)
 * @param key کلید مورد
 * @param value مقدار برای ذخیره
 * @param ttl مدت زمان اعتبار (پیش‌فرض: CACHE_TTL)
 */
export function setCache<T>(cacheName: keyof CacheStore, key: string, value: T, ttl: number = CACHE_TTL): void {
  if (!cache[cacheName]) {
    console.warn(`⚠️ کش با نام ${cacheName} وجود ندارد`);
    return;
  }
  
  const expiry = Date.now() + ttl;
  cache[cacheName].set(key, { value, expiry });
}

/**
 * دریافت یک مورد از کش
 * @param cacheName نام کش (users, items, etc)
 * @param key کلید مورد
 * @returns مقدار ذخیره شده یا undefined در صورت نبودن یا منقضی شدن
 */
export function getCache<T>(cacheName: keyof CacheStore, key: string): T | undefined {
  if (!cache[cacheName]) {
    console.warn(`⚠️ کش با نام ${cacheName} وجود ندارد`);
    return undefined;
  }
  
  const item = cache[cacheName].get(key);
  
  if (!item) return undefined;
  
  // بررسی انقضای مورد
  if (Date.now() > item.expiry) {
    cache[cacheName].delete(key);
    return undefined;
  }
  
  return item.value as T;
}

/**
 * حذف یک مورد از کش
 * @param cacheName نام کش (users, items, etc)
 * @param key کلید مورد
 */
export function deleteCache(cacheName: keyof CacheStore, key: string): void {
  if (!cache[cacheName]) {
    console.warn(`⚠️ کش با نام ${cacheName} وجود ندارد`);
    return;
  }
  
  cache[cacheName].delete(key);
}

/**
 * پاکسازی یک کش مشخص
 * @param cacheName نام کش (users, items, etc)
 */
export function clearCache(cacheName: keyof CacheStore): void {
  if (!cache[cacheName]) {
    console.warn(`⚠️ کش با نام ${cacheName} وجود ندارد`);
    return;
  }
  
  cache[cacheName].clear();
  console.log(`🧹 کش ${cacheName} پاکسازی شد`);
}

// برنامه‌ریزی برای پاکسازی دوره‌ای کش (هر 30 دقیقه)
setInterval(() => {
  // حذف موارد منقضی شده از تمام کش‌ها
  Object.entries(cache).forEach(([cacheName, cacheMap]) => {
    cacheMap.forEach((item, key) => {
      if (Date.now() > item.expiry) {
        cacheMap.delete(key);
      }
    });
  });
  console.log('🧹 موارد منقضی شده از کش پاکسازی شدند');
}, 30 * 60 * 1000);

// تنظیم واکنش به سیگنال‌های پایان برنامه برای بستن مناسب اتصال‌ها
process.on('SIGINT', async () => {
  try {
    await disconnectFromDatabase();
    console.log('👋 برنامه با موفقیت خاتمه یافت');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا در خاتمه برنامه:', error);
    process.exit(1);
  }
});