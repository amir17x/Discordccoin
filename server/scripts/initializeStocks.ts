/**
 * این اسکریپت برای اضافه کردن سهام‌های اولیه به سیستم استفاده می‌شود
 * این برای جلوگیری از خطای "هیچ سهمی یافت نشد" اجرا می‌شود
 */

import { storage } from '../storage';
import { log } from '../vite';

// تعریف داده‌های سهام پایه برای اضافه کردن به دیتابیس
const initialStocks = [
  {
    symbol: 'CCIN',
    name: 'Ccoin Technologies',
    description: 'شرکت اصلی فناوری Ccoin که در زمینه پلتفرم‌های اجتماعی و مالی فعالیت می‌کند',
    currentPrice: 1000,
    previousPrice: 950,
    volatility: 5,
    trend: 2,
    sector: 'technology',
    totalShares: 10000,
    availableShares: 9000
  },
  {
    symbol: 'PGRS',
    name: 'Persian Gold Resources',
    description: 'شرکت استخراج و فروش معادن طلا در ایران',
    currentPrice: 2500,
    previousPrice: 2450,
    volatility: 7,
    trend: 1,
    sector: 'mining',
    totalShares: 5000,
    availableShares: 4800
  },
  {
    symbol: 'OILC',
    name: 'Oil Company of Persia',
    description: 'بزرگترین شرکت استخراج و صادرات نفت ایران',
    currentPrice: 3500,
    previousPrice: 3700,
    volatility: 8,
    trend: -1,
    sector: 'energy',
    totalShares: 7000,
    availableShares: 6500
  },
  {
    symbol: 'BANK',
    name: 'Persian Banking Group',
    description: 'گروه بانکی با شعبه‌های متعدد در سراسر ایران',
    currentPrice: 1500,
    previousPrice: 1500,
    volatility: 3,
    trend: 0,
    sector: 'finance',
    totalShares: 15000,
    availableShares: 14000
  },
  {
    symbol: 'TECH',
    name: 'Persian Tech Solutions',
    description: 'شرکت توسعه نرم‌افزار و راهکارهای فناوری اطلاعات',
    currentPrice: 800,
    previousPrice: 750,
    volatility: 6,
    trend: 1,
    sector: 'technology',
    totalShares: 20000,
    availableShares: 18000
  },
  {
    symbol: 'FOOD',
    name: 'Persian Food Industries',
    description: 'تولید و توزیع مواد غذایی با برندهای متنوع',
    currentPrice: 600,
    previousPrice: 580,
    volatility: 2,
    trend: 1,
    sector: 'consumer',
    totalShares: 25000,
    availableShares: 23000
  },
  {
    symbol: 'AUTO',
    name: 'Persian Automotive',
    description: 'بزرگترین تولیدکننده خودرو در ایران',
    currentPrice: 1200,
    previousPrice: 1300,
    volatility: 5,
    trend: -1,
    sector: 'automotive',
    totalShares: 12000,
    availableShares: 11000
  }
];

/**
 * اضافه کردن سهام‌های اولیه به سیستم
 */
export async function initializeStocks() {
  try {
    // بررسی وجود سهام در سیستم
    const existingStocks = await storage.getAllStocks();
    
    if (existingStocks.length === 0) {
      log('سیستم بازار سهام: هیچ سهمی یافت نشد. در حال اضافه کردن سهام‌های اولیه...', 'info');
      
      // اضافه کردن سهام‌های اولیه
      let addedCount = 0;
      for (const stockData of initialStocks) {
        await storage.createStock(stockData);
        addedCount++;
      }
      
      log(`سیستم بازار سهام: ${addedCount} سهم اولیه با موفقیت اضافه شد.`, 'success');
      return true;
    } else {
      log(`سیستم بازار سهام: ${existingStocks.length} سهم در سیستم یافت شد.`, 'info');
      return false;
    }
  } catch (error) {
    log(`خطا در راه‌اندازی سهام‌های اولیه: ${error}`, 'error');
    return false;
  }
}