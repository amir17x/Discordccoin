/**
 * سیستم پویای بازار سهام با هوش مصنوعی
 * 
 * این ماژول برای ایجاد تغییرات واقع‌گرایانه در قیمت سهام با استفاده از هوش مصنوعی
 * طراحی شده است. هدف ایجاد یک بازار پویا با نوسانات منطقی و واقعی‌تر است.
 */

import { generateAIResponse } from '../services/aiService';
import { log } from '../../vite';
import { storage } from '../../storage';
import { StockData } from '../../../shared/schema';

// وضعیت‌های مختلف بازار
const marketConditions = [
  'رونق شدید',     // Boom
  'رونق',          // Growth
  'ثبات',          // Stable
  'رکود',          // Recession
  'بحران'          // Crisis
];

// عوامل تأثیرگذار بر اخبار و بازار
const marketFactors = [
  'سیاست‌های دولتی',
  'اکتشافات جدید',
  'تغییرات مدیریتی',
  'رقابت داخلی',
  'وضعیت صادرات',
  'فناوری‌های جدید',
  'تحریم‌ها',
  'بلایای طبیعی',
  'شایعات بازار',
  'بحران‌های اقتصادی جهانی',
  'تغییرات نرخ بهره',
  'تغییرات قوانین',
  'جنگ‌های تجاری'
];

/**
 * پارامترهای مربوط به هر سهام برای تنظیم نوسانات
 */
export type StockMarketParams = {
  volatility: number;         // میزان نوسان از 0 تا 1
  baseGrowthRate: number;     // نرخ رشد پایه از -0.1 تا 0.1
  marketSensitivity: number;  // حساسیت به شرایط کلی بازار از 0 تا 1
  lastNewsImpact?: {          // تأثیر آخرین خبر
    content: string;          // متن خبر
    impact: number;           // میزان تأثیر از -1 تا 1
    timestamp: number;        // زمان انتشار خبر
  };
  relatedNews?: string[];     // لیست اخبار مرتبط با این سهام
};

// پارامترهای بازار سهام برای هر سهم
const stockMarketParams = new Map<number, StockMarketParams>();

// وضعیت کلی بازار
let globalMarketCondition = 'ثبات';

/**
 * راه‌اندازی سیستم پویای بازار سهام
 * @param updateIntervalMinutes فاصله زمانی به‌روزرسانی به دقیقه
 */
export async function setupAIMarketDynamics(updateIntervalMinutes: number = 60) {
  try {
    // مقداردهی اولیه پارامترهای بازار
    await initializeStockParams();
    
    // تنظیم به‌روزرسانی دوره‌ای
    setInterval(async () => {
      try {
        await updateStockPrices();
      } catch (e) {
        log(`Error updating stock prices: ${e}`, 'error');
      }
    }, updateIntervalMinutes * 60 * 1000);
    
    // تنظیم تولید اخبار تصادفی
    setInterval(async () => {
      try {
        await generateRandomStockNews();
      } catch (e) {
        log(`Error generating stock news: ${e}`, 'error');
      }
    }, (updateIntervalMinutes * 2) * 60 * 1000); // هر دو سیکل یک خبر
    
    // به‌روزرسانی اولیه
    setTimeout(async () => {
      try {
        await updateStockPrices();
      } catch (e) {
        log(`Error in initial stock price update: ${e}`, 'error');
      }
    }, 30000); // ۳۰ ثانیه پس از راه‌اندازی
    
    log(`AI Market dynamics system started with ${updateIntervalMinutes} minute intervals`, 'info');
    return true;
  } catch (error) {
    log(`Error in starting AI market dynamics system: ${error}`, 'error');
    return false;
  }
}

/**
 * مقداردهی اولیه پارامترهای بازار برای هر سهم
 */
async function initializeStockParams() {
  try {
    // استفاده از متد موجود در storage
    const stocks = await storage.getAllStocks();
    if (!stocks || stocks.length === 0) {
      log('No stocks found in the system.', 'error');
      return;
    }
    
    stocks.forEach(stock => {
      // تنظیم پارامترهای اختصاصی هر سهم
      stockMarketParams.set(stock.id, {
        // هر سهم نوسان مخصوص به خود را دارد (بین 0.05 تا 0.35)
        volatility: 0.05 + Math.random() * 0.3,
        
        // نرخ رشد پایه برای هر سهم متفاوت است (بین -0.05 تا 0.1)
        baseGrowthRate: -0.05 + Math.random() * 0.15,
        
        // حساسیت به شرایط بازار (بین 0.3 تا 0.9)
        marketSensitivity: 0.3 + Math.random() * 0.6,
        
        // بدون اخبار اولیه
        relatedNews: []
      });
    });
    
    // تنظیم وضعیت کلی بازار به صورت تصادفی
    globalMarketCondition = marketConditions[Math.floor(Math.random() * marketConditions.length)];
    
    log(`Market parameters initialized for ${stocks.length} stocks.`, 'info');
    log(`Current market condition: ${globalMarketCondition}`, 'info');
    
  } catch (error) {
    log(`Error in initializing market parameters: ${error}`, 'error');
  }
}

/**
 * به‌روزرسانی قیمت‌های سهام با استفاده از الگوریتم هوشمند
 */
async function updateStockPrices() {
  try {
    // تغییر احتمالی وضعیت کلی بازار
    updateGlobalMarketCondition();
    
    // دریافت اطلاعات سهام موجود
    const stocks = await storage.getAllStocks();
    if (!stocks || stocks.length === 0) {
      log('No stocks found for update.', 'error');
      return;
    }
    
    // به‌روزرسانی قیمت هر سهم
    for (const stock of stocks) {
      // دریافت پارامترهای بازار برای این سهم
      const params = stockMarketParams.get(stock.id);
      
      if (!params) {
        // اگر پارامترها وجود نداشت، پارامترهای پیش‌فرض ایجاد کن
        stockMarketParams.set(stock.id, {
          volatility: 0.15,
          baseGrowthRate: 0.01,
          marketSensitivity: 0.5,
          relatedNews: []
        });
        continue; // و به سهم بعدی برو
      }
      
      // محاسبه تغییر قیمت بر اساس عوامل مختلف
      let priceChange = calculatePriceChange(stock, params);
      
      // محاسبه قیمت جدید
      let newPrice = stock.currentPrice * (1 + priceChange);
      
      // بررسی محدودیت‌ها و اعمال قیمت جدید
      const minPrice = stock.minPrice || 50; // حداقل قیمت ۵۰
      const maxPrice = stock.maxPrice || 100000; // حداکثر قیمت ۱۰۰،۰۰۰
      
      newPrice = Math.max(newPrice, minPrice);
      newPrice = Math.min(newPrice, maxPrice);
      
      // گرد کردن قیمت به عدد صحیح
      newPrice = Math.round(newPrice);
      
      try {
        // استفاده از روش updateStock موجود در storage
        if (storage.updateStock) {
          await storage.updateStock(stock.id, {
            previousPrice: stock.currentPrice, 
            currentPrice: newPrice
          });
        } 
        // جایگزین: استفاده از updateStockPrice اگر موجود باشد
        else if (storage.updateStockPrice) {
          await storage.updateStockPrice(stock.id, newPrice);
        }
        else {
          log(`متد به‌روزرسانی قیمت سهام یافت نشد.`, 'error');
          continue;
        }
        
        // ثبت تغییر قیمت در لاگ
        const changePercent = ((newPrice - stock.currentPrice) / stock.currentPrice) * 100;
        log(`قیمت سهام ${stock.name} از ${stock.currentPrice} به ${newPrice} تغییر کرد (${changePercent.toFixed(2)}%)`, 'info');
      } 
      catch (updateError) {
        log(`Error updating stock price for ${stock.name}: ${updateError}`, 'error');
      }
    }
    
    log(`قیمت ${stocks.length} سهام به‌روزرسانی شد. وضعیت بازار: ${globalMarketCondition}`, 'info');
    
  } catch (error) {
    log(`Error updating stock prices: ${error}`, 'error');
  }
}

/**
 * تغییر احتمالی وضعیت کلی بازار
 */
function updateGlobalMarketCondition() {
  // احتمال 20 درصدی تغییر وضعیت بازار در هر به‌روزرسانی
  if (Math.random() < 0.2) {
    // انتخاب یک وضعیت جدید - با محدودیت حرکت فقط یک درجه به بالا یا پایین
    const currentIndex = marketConditions.indexOf(globalMarketCondition);
    let newIndex = currentIndex;
    
    // انتخاب حرکت به بالا یا پایین با احتمال مساوی
    if (Math.random() < 0.5) {
      // حرکت به سمت وضعیت بهتر (اگر امکان‌پذیر باشد)
      if (currentIndex < marketConditions.length - 1) {
        newIndex = currentIndex + 1;
      }
    } else {
      // حرکت به سمت وضعیت بدتر (اگر امکان‌پذیر باشد)
      if (currentIndex > 0) {
        newIndex = currentIndex - 1;
      }
    }
    
    // تنظیم وضعیت جدید بازار
    const newCondition = marketConditions[newIndex];
    
    if (newCondition !== globalMarketCondition) {
      log(`وضعیت بازار از "${globalMarketCondition}" به "${newCondition}" تغییر کرد`, 'info');
      globalMarketCondition = newCondition;
    }
  }
}

/**
 * محاسبه درصد تغییر قیمت بر اساس پارامترهای مختلف
 * @param stock اطلاعات سهام
 * @param params پارامترهای بازار برای این سهم
 * @returns درصد تغییر قیمت (مثال 0.05 برای 5 درصد افزایش)
 */
function calculatePriceChange(stock: StockData, params: StockMarketParams): number {
  // 1. تأثیر وضعیت کلی بازار
  const marketEffect = getMarketEffect(globalMarketCondition) * params.marketSensitivity;
  
  // 2. تأثیر نوسان ذاتی سهم
  const volatilityEffect = (Math.random() * 2 - 1) * params.volatility;
  
  // 3. تأثیر نرخ رشد پایه
  const baseEffect = params.baseGrowthRate;
  
  // 4. تأثیر آخرین خبر (اگر وجود داشته باشد)
  let newsEffect = 0;
  if (params.lastNewsImpact) {
    // کاهش اثر خبر با گذر زمان (اثر خبر پس از 24 ساعت کاملاً از بین می‌رود)
    const hoursElapsed = (Date.now() - params.lastNewsImpact.timestamp) / (1000 * 60 * 60);
    if (hoursElapsed < 24) {
      newsEffect = params.lastNewsImpact.impact * (1 - hoursElapsed / 24);
    }
  }
  
  // محاسبه درصد تغییر نهایی (مجموع تأثیرات مختلف)
  const totalChange = marketEffect + volatilityEffect + baseEffect + newsEffect;
  
  // محدود کردن تغییرات به محدوده منطقی (-15% تا +15% در هر سیکل)
  return Math.max(-0.15, Math.min(0.15, totalChange));
}

/**
 * تبدیل وضعیت بازار به ضریب تأثیر
 * @param condition وضعیت بازار
 * @returns ضریب تأثیر (بین -0.1 تا 0.1)
 */
function getMarketEffect(condition: string): number {
  switch (condition) {
    case 'رونق شدید':
      return 0.1;
    case 'رونق':
      return 0.05;
    case 'ثبات':
      return 0;
    case 'رکود':
      return -0.05;
    case 'بحران':
      return -0.1;
    default:
      return 0;
  }
}

/**
 * تولید یک خبر تصادفی مرتبط با یکی از سهام
 */
async function generateRandomStockNews() {
  try {
    // دریافت لیست سهام
    const stocks = await storage.getAllStocks();
    if (!stocks || stocks.length === 0) {
      log('No stocks found for news generation.', 'error');
      return;
    }
    
    // انتخاب یک سهم تصادفی
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    if (!randomStock) return;
    
    // انتخاب یک عامل تأثیرگذار تصادفی
    const randomFactor = marketFactors[Math.floor(Math.random() * marketFactors.length)];
    
    // تعیین تأثیر مثبت یا منفی (با احتمال مساوی)
    const isPositive = Math.random() > 0.5;
    
    // ساخت پرامپت برای هوش مصنوعی
    const prompt = `یک خبر کوتاه اقتصادی (حداکثر ۱۵۰ کاراکتر) به فارسی درباره شرکت "${randomStock.name}" که فعالیت آن "${randomStock.description}" است بنویس. 
    
    خبر باید درباره "${randomFactor}" باشد و تأثیر ${isPositive ? 'مثبت' : 'منفی'} بر ارزش سهام شرکت داشته باشد.
    خبر را به صورت یک جمله خبری بنویس و به حالت رسمی باشد. خبر فقط باید واقعیت‌های ممکن را شامل شود، نه ادعاهای غیرممکن.
    
    فقط متن خبر را بنویس، بدون هیچ توضیح دیگری.`;
    
    // دریافت پاسخ از هوش مصنوعی
    const newsContent = await generateAIResponse(prompt, "marketAnalysis");
    
    // تعیین میزان تأثیر خبر
    const impactValue = (isPositive ? 1 : -1) * (0.03 + Math.random() * 0.07); // بین 3% تا 10%
    
    // به‌روزرسانی پارامترهای بازار برای این سهم
    const params = stockMarketParams.get(randomStock.id);
    if (params) {
      params.lastNewsImpact = {
        content: newsContent,
        impact: impactValue,
        timestamp: Date.now()
      };
      
      // اضافه کردن به لیست اخبار
      if (!params.relatedNews) params.relatedNews = [];
      params.relatedNews.push(newsContent);
      
      // نگهداری فقط 5 خبر آخر
      if (params.relatedNews.length > 5) {
        params.relatedNews.shift();
      }
      
      try {
        // سازگاری با سیستم فعلی: تلاش برای استفاده از addStockNews اگر موجود باشد
        if (storage.addStockNews) {
          await storage.addStockNews(randomStock.id, {
            content: newsContent,
            effect: impactValue > 0 ? 'positive' : 'negative',
            timestamp: new Date()
          });
        } else {
          // جایگزین: به‌روزرسانی خود entity در صورتی که addStockNews موجود نباشد
          if (storage.updateStock) {
            await storage.updateStock(randomStock.id, {
              // اگر خبر قبلی وجود داشته باشد، آن را حفظ کرده و خبر جدید را اضافه کن
              news: randomStock.news 
                ? [...randomStock.news, {
                    content: newsContent,
                    effect: impactValue > 0 ? 'positive' : 'negative',
                    timestamp: new Date()
                  }]
                : [{
                    content: newsContent,
                    effect: impactValue > 0 ? 'positive' : 'negative',
                    timestamp: new Date()
                  }]
            });
          } else {
            log(`متد افزودن خبر سهام یافت نشد.`, 'warning');
          }
        }
        
        log(`خبر جدید برای ${randomStock.name}: ${newsContent}`, 'info');
        log(`تأثیر خبر: ${(impactValue * 100).toFixed(2)}%`, 'info');
      }
      catch (newsError) {
        log(`Error saving news for stock ${randomStock.name}: ${newsError}`, 'error');
      }
    }
    
  } catch (error) {
    log(`خطا در تولید خبر سهام: ${error}`, 'error');
  }
}

/**
 * ایجاد اخبار تأثیرگذار با توجه به درخواست کاربر
 * @param stockId شناسه سهام
 * @param requestType نوع درخواست (خرید یا فروش)
 * @returns متن خبر تولید شده
 */
export async function generateMarketManipulationNews(
  stockId: number,
  requestType: 'buy' | 'sell'
): Promise<string | null> {
  try {
    // دریافت اطلاعات سهام با استفاده از متد موجود
    const stock = storage.getStock ? await storage.getStock(stockId) : null;
    if (!stock) return null;
    
    // تنظیم پارامترهای درخواست
    const isPositive = requestType === 'buy'; // خبر مثبت برای خرید، منفی برای فروش
    
    // انتخاب یک عامل تأثیرگذار تصادفی
    const randomFactor = marketFactors[Math.floor(Math.random() * marketFactors.length)];
    
    // ساخت پرامپت برای هوش مصنوعی
    const prompt = `یک خبر اقتصادی کوتاه و ${isPositive ? 'مثبت' : 'منفی'} به فارسی (حداکثر ۱۵۰ کاراکتر) درباره شرکت "${stock.name}" که در زمینه "${stock.description}" فعالیت می‌کند بنویس.
    
    این خبر با هدف ${isPositive ? 'تشویق به خرید و افزایش قیمت' : 'ایجاد فروش و کاهش قیمت'} سهام نوشته می‌شود و باید درباره "${randomFactor}" باشد.
    خبر باید کاملاً باورپذیر و واقع‌بینانه باشد، اما در عین حال ${isPositive ? 'شور و اشتیاق ایجاد کند' : 'نگرانی و احتیاط ایجاد کند'}.
    
    فقط متن خبر را بنویس، بدون هیچ توضیح دیگری.`;
    
    // دریافت پاسخ از هوش مصنوعی
    const newsContent = await generateAIResponse(prompt, "marketAnalysis");
    
    // تعیین میزان تأثیر خبر (تأثیر بیشتر برای دستکاری بازار)
    const impactValue = (isPositive ? 1 : -1) * (0.05 + Math.random() * 0.1); // بین 5% تا 15%
    
    // به‌روزرسانی پارامترهای بازار برای این سهم
    const params = stockMarketParams.get(stock.id);
    if (params) {
      params.lastNewsImpact = {
        content: newsContent,
        impact: impactValue,
        timestamp: Date.now()
      };
      
      // اضافه کردن به لیست اخبار
      if (!params.relatedNews) params.relatedNews = [];
      params.relatedNews.push(newsContent);
      
      // نگهداری فقط 5 خبر آخر
      if (params.relatedNews.length > 5) {
        params.relatedNews.shift();
      }
      
      try {
        // سازگاری با سیستم فعلی: تلاش برای استفاده از addStockNews اگر موجود باشد
        if (storage.addStockNews) {
          await storage.addStockNews(stock.id, {
            content: newsContent,
            effect: impactValue > 0 ? 'positive' : 'negative',
            timestamp: new Date()
          });
        } else {
          // جایگزین: به‌روزرسانی خود entity در صورتی که addStockNews موجود نباشد
          if (storage.updateStock) {
            await storage.updateStock(stock.id, {
              // اگر خبر قبلی وجود داشته باشد، آن را حفظ کرده و خبر جدید را اضافه کن
              news: stock.news 
                ? [...stock.news, {
                    content: newsContent,
                    effect: impactValue > 0 ? 'positive' : 'negative',
                    timestamp: new Date()
                  }]
                : [{
                    content: newsContent,
                    effect: impactValue > 0 ? 'positive' : 'negative',
                    timestamp: new Date()
                  }]
            });
          }
        }
        
        log(`خبر دستکاری بازار برای ${stock.name}: ${newsContent}`, 'info');
        log(`تأثیر خبر: ${(impactValue * 100).toFixed(2)}%`, 'info');
        
        return newsContent;
      }
      catch (newsError) {
        log(`Error saving market manipulation news for stock ${stock.name}: ${newsError}`, 'error');
      }
    }
    
    return newsContent; // Return the news content even if it wasn't saved
  } catch (error) {
    log(`Error generating market manipulation news: ${error}`, 'error');
    return null;
  }
}

/**
 * Get intelligent analysis for a specific stock
 * @param stockId stock identifier
 * @returns intelligent stock analysis
 */
export async function getAIStockAnalysis(stockId: number): Promise<string | null> {
  try {
    // Get stock information using available method
    const stock = storage.getStock ? await storage.getStock(stockId) : null;
    if (!stock) return null;
    
    // Analyze price trend
    let trend = 'نامشخص'; // Unknown
    let performance = 'نامشخص'; // Unknown
    
    // Use internal price history instead of separate API call
    if (stock.priceHistory && stock.priceHistory.length >= 2) {
      // Calculate price changes over the period
      const latestPrice = stock.priceHistory[0].price;  // Latest price
      const oldestPrice = stock.priceHistory[stock.priceHistory.length - 1].price;  // Oldest price
      const changePercent = ((latestPrice - oldestPrice) / oldestPrice) * 100;
      
      // Determine trend
      if (changePercent > 10) trend = 'صعودی قوی'; // Strong upward
      else if (changePercent > 3) trend = 'صعودی ملایم'; // Mild upward
      else if (changePercent >= -3) trend = 'نسبتاً ثابت'; // Relatively stable
      else if (changePercent >= -10) trend = 'نزولی ملایم'; // Mild downward
      else trend = 'نزولی قوی'; // Strong downward
      
      // Determine performance
      if (changePercent > 15) performance = 'عالی'; // Excellent
      else if (changePercent > 5) performance = 'خوب'; // Good
      else if (changePercent >= -5) performance = 'متوسط'; // Average
      else if (changePercent >= -15) performance = 'ضعیف'; // Poor
      else performance = 'بسیار ضعیف'; // Very poor
    }
    
    // Prepare news text for prompt
    let newsText = '';
    if (stock.news && stock.news.length > 0) {
      newsText = 'اخبار اخیر:\n'; // Recent news
      stock.news.slice(0, 3).forEach((news, index) => {
        newsText += `${index + 1}. ${news.content} (تأثیر: ${news.effect === 'positive' ? 'مثبت' : 'منفی'})\n`; // Impact: positive/negative
      });
    } else {
      newsText = 'اخبار قابل توجهی برای این سهم وجود ندارد.'; // No significant news exists for this stock
    }
    
    // Get market parameters
    const params = stockMarketParams.get(stockId);
    const marketConditionText = `وضعیت کلی بازار: ${globalMarketCondition}`; // General market condition
    
    // Build AI prompt
    const prompt = `یک تحلیل کوتاه و تخصصی سهام به فارسی (حداکثر ۲۵۰ کاراکتر) برای شرکت "${stock.name}" که در زمینه "${stock.description}" فعالیت می‌کند ارائه بده.
    
    اطلاعات مهم:
    - قیمت فعلی: ${stock.currentPrice} Ccoin
    - روند قیمت: ${trend}
    - عملکرد: ${performance}
    - ${marketConditionText}
    - ${newsText}
    
    تحلیل باید شامل:
    1. ارزیابی وضعیت فعلی و روند آینده سهام با توجه به اطلاعات موجود
    2. توصیه سرمایه‌گذاری (خرید، فروش، یا نگهداری)
    3. سطح ریسک سرمایه‌گذاری
    
    لحن تحلیل حرفه‌ای، تخصصی و مختصر باشد.`;
    
    // Get response from AI
    const analysis = await generateAIResponse(prompt, "marketAnalysis");
    
    return analysis;
  } catch (error) {
    log(`Error generating intelligent stock analysis: ${error}`, 'error');
    return null;
  }
}