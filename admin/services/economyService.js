/**
 * سرویس مدیریت اقتصادی
 */

import { getUserById } from './userService.js';
import { Transaction } from '../models/transaction.js';
import { User } from '../models/user.js';
import { Bank } from '../models/bank.js';
import { Shop } from '../models/shop.js';
import { Item } from '../models/item.js';
import { Setting } from '../models/setting.js';
import { AdminStock } from '../models/stock.js';

/**
 * دریافت آمار اقتصادی
 * @returns {Object} آمار اقتصادی
 */
export async function getEconomyStats() {
  try {
    // دریافت آمار از دیتابیس
    const totalTransactions = await Transaction.countDocuments();
    
    // مجموع سکه‌ها و کریستال‌ها
    const coinStats = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$coins" }, avg: { $avg: "$coins" } } }
    ]);
    
    const crystalStats = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$crystals" }, avg: { $avg: "$crystals" } } }
    ]);
    
    // تعداد کاربران ثروتمند (بیش از 10000 سکه)
    const richUsers = await User.countDocuments({ coins: { $gt: 10000 } });
    
    // بزرگترین تراکنش
    const topTransaction = await Transaction.findOne({ currency: 'coin' })
      .sort({ amount: -1 })
      .limit(1);
    
    // تراکنش‌های روزانه و هفتگی
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const dailyVolume = await Transaction.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo }, currency: 'coin' } },
      { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
    ]);
    
    const weeklyVolume = await Transaction.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo }, currency: 'coin' } },
      { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
    ]);

    // دریافت تنظیمات از دیتابیس
    const exchangeRate = await Setting.getByKey('economy.exchange_rate', 100);
    const bankInterestRate = await Setting.getByKey('economy.bank_interest_rate', 2);
    const transferFee = await Setting.getByKey('economy.transfer_fee', 5);
    const dailyReward = await Setting.getByKey('economy.daily_reward', 1000);
    
    // محاسبه نرخ تورم - مقایسه میانگین قیمت کالاها در ماه اخیر با ماه قبل
    // این محاسبه در یک سیستم واقعی نیاز به تحلیل داده‌های بیشتری دارد
    // برای مثال: مقایسه حجم پول در گردش، تعداد تراکنش‌ها، و قیمت میانگین کالاها
    // در اینجا یک مقدار تقریبی استفاده می‌کنیم
    const coinInflationRate = 2.5;

    return {
      totalCoins: coinStats.length > 0 ? coinStats[0].total : 0,
      totalCrystals: crystalStats.length > 0 ? crystalStats[0].total : 0,
      totalTransactions,
      averageUserBalance: coinStats.length > 0 ? Math.floor(coinStats[0].avg) : 0,
      richestUsers: richUsers,
      topTransactionAmount: topTransaction ? Math.abs(topTransaction.amount) : 0,
      dailyVolume: dailyVolume.length > 0 ? dailyVolume[0].total : 0,
      weeklyVolume: weeklyVolume.length > 0 ? weeklyVolume[0].total : 0,
      coinInflationRate,
      exchangeRate,
      settings: {
        bankInterestRate,
        transferFee,
        dailyReward
      }
    };
  } catch (error) {
    console.error('خطا در دریافت آمار اقتصادی:', error);
    return {};
  }
}

/**
 * دریافت تراکنش‌های اخیر
 * @param {number} limit تعداد تراکنش‌ها
 * @returns {Array} لیست تراکنش‌ها
 */
export async function getRecentTransactions(limit = 10) {
  try {
    // دریافت تراکنش‌های اخیر از دیتابیس
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // افزودن اطلاعات کاربران
    const results = [];
    
    for (const tx of transactions) {
      try {
        // دریافت اطلاعات کاربر
        let user = null;
        if (tx.userId) {
          user = await User.findOne({ discordId: tx.userId }).lean();
        }
        
        // دریافت اطلاعات گیرنده برای تراکنش‌های انتقال
        let recipient = null;
        if (tx.details && tx.details.recipientId) {
          recipient = await User.findOne({ discordId: tx.details.recipientId }).lean();
        }
        
        results.push({
          id: tx._id.toString(),
          userId: tx.userId,
          username: user ? user.username : 'کاربر ناشناس',
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          recipientId: tx.details?.recipientId,
          recipientName: recipient ? recipient.username : null,
          description: tx.description || generateTransactionDescription(tx.type, tx.amount, tx.details?.recipientId),
          timestamp: tx.createdAt
        });
      } catch (err) {
        console.error('خطا در پردازش تراکنش:', err);
        // اگر در پردازش یک تراکنش خطا رخ داد، آن را نادیده می‌گیریم و به تراکنش بعدی می‌رویم
      }
    }
    
    return results;
  } catch (error) {
    console.error('خطا در دریافت تراکنش‌های اخیر:', error);
    return [];
  }
}

/**
 * دریافت همه تراکنش‌ها با فیلتر و صفحه‌بندی
 * @param {Object} options گزینه‌های فیلتر و صفحه‌بندی
 * @returns {Object} لیست تراکنش‌ها و اطلاعات صفحه‌بندی
 */
export async function getAllTransactions(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      userId = null,
      type = null,
      minAmount = null,
      maxAmount = null,
      startDate = null,
      endDate = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    // ساخت فیلتر
    const filter = {};
    
    if (userId) {
      filter.$or = [
        { userId },
        { 'details.recipientId': userId }
      ];
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (minAmount !== null) {
      filter.amount = filter.amount || {};
      filter.amount.$gte = minAmount;
    }
    
    if (maxAmount !== null) {
      filter.amount = filter.amount || {};
      filter.amount.$lte = maxAmount;
    }
    
    if (startDate) {
      filter.createdAt = filter.createdAt || {};
      filter.createdAt.$gte = new Date(startDate);
    }
    
    if (endDate) {
      filter.createdAt = filter.createdAt || {};
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDateTime;
    }
    
    // تعیین مرتب‌سازی
    const sort = {};
    sort[sortBy === 'timestamp' ? 'createdAt' : sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // شمارش کل تراکنش‌های مطابق با فیلتر
    const totalTransactions = await Transaction.countDocuments(filter);
    
    // دریافت تراکنش‌ها با صفحه‌بندی
    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // تبدیل به فرمت موردنظر
    const formattedTransactions = [];
    
    for (const tx of transactions) {
      try {
        // دریافت اطلاعات کاربر
        let user = null;
        if (tx.userId) {
          user = await User.findOne({ discordId: tx.userId }).lean();
        }
        
        // دریافت اطلاعات گیرنده برای تراکنش‌های انتقال
        let recipient = null;
        if (tx.details && tx.details.recipientId) {
          recipient = await User.findOne({ discordId: tx.details.recipientId }).lean();
        }
        
        formattedTransactions.push({
          id: tx._id.toString(),
          userId: tx.userId,
          username: user ? user.username : 'کاربر ناشناس',
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          recipientId: tx.details?.recipientId,
          recipientName: recipient ? recipient.username : null,
          description: tx.description || generateTransactionDescription(tx.type, tx.amount, tx.details?.recipientId),
          timestamp: tx.createdAt
        });
      } catch (err) {
        console.error('خطا در پردازش تراکنش:', err);
        // اگر در پردازش یک تراکنش خطا رخ داد، آن را نادیده می‌گیریم و به تراکنش بعدی می‌رویم
      }
    }
    
    return {
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        totalTransactions,
        totalPages: Math.ceil(totalTransactions / limit)
      }
    };
  } catch (error) {
    console.error('خطا در دریافت تراکنش‌ها:', error);
    return { 
      transactions: [], 
      pagination: { 
        page: 1, 
        limit: 20, 
        totalTransactions: 0, 
        totalPages: 0 
      } 
    };
  }
}

/**
 * تنظیم نرخ تبدیل سکه به کریستال
 * @param {number} rate نرخ تبدیل (تعداد سکه برای هر کریستال)
 * @param {Object} options گزینه‌های اضافی
 * @returns {Object} نتیجه عملیات
 */
export async function setExchangeRate(rate, options = {}) {
  try {
    if (!rate || isNaN(rate) || rate <= 0) {
      throw new Error('نرخ تبدیل باید عددی مثبت باشد');
    }
    
    // دریافت نرخ قبلی
    const oldRate = await Setting.getByKey('economy.exchange_rate', 100);
    
    // ذخیره نرخ جدید در دیتابیس
    await Setting.setByKey('economy.exchange_rate', rate, {
      category: 'economy',
      description: 'نرخ تبدیل سکه به کریستال',
      isPublic: true,
      updatedBy: options.adminId || null
    });
    
    console.log(`نرخ تبدیل سکه به کریستال به ${rate} تغییر یافت`);
    
    return {
      success: true,
      oldRate,
      newRate: rate,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('خطا در تنظیم نرخ تبدیل:', error);
    throw error;
  }
}

/**
 * تنظیم پاداش روزانه
 * @param {number} amount مقدار پاداش روزانه
 * @param {Object} options گزینه‌های اضافی
 * @returns {Object} نتیجه عملیات
 */
export async function setDailyReward(amount, options = {}) {
  try {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('مقدار پاداش روزانه باید عددی مثبت باشد');
    }
    
    // دریافت مقدار قبلی از دیتابیس
    const oldAmount = await Setting.getByKey('economy.daily_reward', 1000);
    
    // ذخیره مقدار جدید در دیتابیس
    await Setting.setByKey('economy.daily_reward', amount, {
      category: 'economy',
      description: 'مقدار پاداش روزانه',
      isPublic: true,
      updatedBy: options.adminId || null
    });
    
    console.log(`پاداش روزانه به ${amount} تغییر یافت`);
    
    return {
      success: true,
      oldAmount,
      newAmount: amount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('خطا در تنظیم پاداش روزانه:', error);
    throw error;
  }
}

/**
 * تنظیم نرخ بهره بانکی
 * @param {number} rate نرخ بهره (درصد)
 * @param {Object} options گزینه‌های اضافی
 * @returns {Object} نتیجه عملیات
 */
export async function setBankInterestRate(rate, options = {}) {
  try {
    if (isNaN(rate) || rate < 0) {
      throw new Error('نرخ بهره باید عددی غیرمنفی باشد');
    }
    
    // دریافت نرخ قبلی از دیتابیس
    const oldRate = await Setting.getByKey('economy.bank_interest_rate', 2);
    
    // ذخیره نرخ جدید در دیتابیس
    await Setting.setByKey('economy.bank_interest_rate', rate, {
      category: 'economy',
      description: 'نرخ بهره بانکی',
      isPublic: true,
      updatedBy: options.adminId || null
    });
    
    console.log(`نرخ بهره بانکی به ${rate}% تغییر یافت`);
    
    return {
      success: true,
      oldRate,
      newRate: rate,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('خطا در تنظیم نرخ بهره بانکی:', error);
    throw error;
  }
}

/**
 * تنظیم کارمزد انتقال سکه
 * @param {number} fee کارمزد (درصد)
 * @param {Object} options گزینه‌های اضافی
 * @returns {Object} نتیجه عملیات
 */
export async function setTransferFee(fee, options = {}) {
  try {
    if (isNaN(fee) || fee < 0 || fee > 100) {
      throw new Error('کارمزد باید عددی بین 0 تا 100 باشد');
    }
    
    // دریافت کارمزد قبلی از دیتابیس
    const oldFee = await Setting.getByKey('economy.transfer_fee', 5);
    
    // ذخیره کارمزد جدید در دیتابیس
    await Setting.setByKey('economy.transfer_fee', fee, {
      category: 'economy',
      description: 'کارمزد انتقال سکه (درصد)',
      isPublic: true,
      updatedBy: options.adminId || null
    });
    
    console.log(`کارمزد انتقال سکه به ${fee}% تغییر یافت`);
    
    return {
      success: true,
      oldFee,
      newFee: fee,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('خطا در تنظیم کارمزد انتقال سکه:', error);
    throw error;
  }
}

/**
 * دریافت تاریخچه تراکنش‌های یک کاربر
 * @param {string} userId شناسه کاربر
 * @param {number} limit تعداد رکورد
 * @returns {Array} لیست تراکنش‌ها
 */
export async function getUserTransactions(userId, limit = 10) {
  try {
    if (!userId) {
      throw new Error('شناسه کاربر الزامی است');
    }
    
    // بررسی وجود کاربر
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }
    
    // ایجاد فیلتر برای جستجوی تراکنش‌های کاربر
    const filter = {
      $or: [
        { userId },
        { 'details.recipientId': userId }
      ]
    };
    
    // دریافت تراکنش‌های کاربر از دیتابیس
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // تبدیل به فرمت مناسب برای نمایش
    const formattedTransactions = [];
    
    for (const tx of transactions) {
      try {
        // تعیین کاربر گیرنده برای تراکنش‌های انتقال
        let recipient = null;
        if (tx.details && tx.details.recipientId) {
          recipient = await User.findOne({ discordId: tx.details.recipientId }).lean();
        }
        
        formattedTransactions.push({
          id: tx._id.toString(),
          userId: tx.userId,
          username: user.username,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          recipientId: tx.details?.recipientId,
          recipientName: recipient ? recipient.username : null,
          description: tx.description || generateTransactionDescription(tx.type, tx.amount, tx.details?.recipientId),
          timestamp: tx.createdAt
        });
      } catch (err) {
        console.error('خطا در پردازش تراکنش:', err);
        // اگر در پردازش یک تراکنش خطا رخ داد، آن را نادیده می‌گیریم و به تراکنش بعدی می‌رویم
      }
    }
    
    return formattedTransactions;
  } catch (error) {
    console.error(`خطا در دریافت تراکنش‌های کاربر ${userId}:`, error);
    throw error;
  }
}

/**
 * دریافت آمار بازار سهام
 * @returns {Promise<Object>} آمار بازار سهام
 */
export async function getStockMarketOverview() {
  try {
    // دریافت سهام‌های فعال از دیتابیس
    const allStocks = await AdminStock.find({ active: true }).lean();
    
    // تبدیل به فرمت مناسب
    const stocks = allStocks.map(stock => {
      // محاسبه تغییر قیمت نسبت به آخرین قیمت ثبت شده
      let priceChange = 0;
      if (stock.priceHistory && stock.priceHistory.length > 1) {
        const previousPrice = stock.priceHistory[stock.priceHistory.length - 2].price;
        priceChange = ((stock.currentPrice - previousPrice) / previousPrice) * 100;
      }

      // محاسبه ارزش بازار (تعداد کل سهام * قیمت فعلی)
      // در حالت واقعی باید تعداد کل سهام موجود محاسبه شود
      const estimatedShares = 100000; // تخمین تعداد سهام
      const marketCap = stock.currentPrice * estimatedShares;
      
      // محاسبه حجم معاملات روزانه (از تراکنش‌های اخیر)
      // در حالت واقعی باید از جدول تراکنش‌ها محاسبه شود
      const volume = Math.floor(marketCap * 0.05); // تخمین 5٪ حجم روزانه
      
      return {
        id: stock.symbol,
        name: stock.name,
        price: stock.currentPrice,
        change: parseFloat(priceChange.toFixed(2)),
        volume,
        marketCap,
        description: stock.description,
        category: stock.category,
        volatility: stock.volatility,
        trend: stock.trend
      };
    });

    // محاسبه شاخص‌های کلی بازار
    const marketIndexes = {
      totalMarketCap: stocks.reduce((sum, stock) => sum + stock.marketCap, 0),
      totalVolume: stocks.reduce((sum, stock) => sum + stock.volume, 0),
      avgChange: stocks.length > 0 
        ? parseFloat((stocks.reduce((sum, stock) => sum + stock.change, 0) / stocks.length).toFixed(2)) 
        : 0,
      topGainer: stocks.reduce((top, stock) => stock.change > top.change ? stock : top, { change: -Infinity }),
      topLoser: stocks.reduce((bottom, stock) => stock.change < bottom.change ? stock : bottom, { change: Infinity })
    };

    // تاریخچه قیمت و حجم معاملات (برای 7 روز گذشته)
    const days = 7;
    const history = [];
    
    // در یک پیاده‌سازی واقعی، این داده‌ها از دیتابیس خوانده می‌شود
    // اما برای نمونه، می‌توانیم از داده‌های تاریخی سهام‌ها استفاده کنیم
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const dateStr = date.toISOString().split('T')[0];
      
      // استخراج داده‌های تاریخی برای این روز
      let totalVolume = 0;
      let totalValue = 0;
      let indexValue = 0;
      
      // در یک سیستم واقعی باید از دیتابیس استخراج شود
      // برای نمونه مقادیر تقریبی محاسبه می‌کنیم
      const dayVolume = marketIndexes.totalVolume * (0.8 + (Math.random() * 0.4));
      const dayValue = marketIndexes.totalMarketCap * (0.9 + (Math.random() * 0.2));
      const dayIndex = 100 + (((i / days) * 10) - 5 + (Math.random() * 3 - 1.5));
      
      history.push({
        date: dateStr,
        totalVolume: Math.floor(dayVolume),
        totalValue: Math.floor(dayValue),
        indexValue: parseFloat(dayIndex.toFixed(2))
      });
    }

    return {
      stocks,
      marketIndexes,
      history,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('خطا در دریافت آمار بازار سهام:', error);
    return {
      stocks: [],
      marketIndexes: {
        totalMarketCap: 0,
        totalVolume: 0,
        avgChange: 0
      },
      history: [],
      lastUpdate: new Date().toISOString()
    };
  }
}

/**
 * تولید توضیحات تراکنش بر اساس نوع تراکنش
 * @param {string} type نوع تراکنش
 * @param {number} amount مقدار
 * @param {string|null} recipientId شناسه گیرنده (برای انتقال)
 * @returns {string} توضیحات تراکنش
 */
function generateTransactionDescription(type, amount, recipientId) {
  const absAmount = Math.abs(amount);
  let recipientName = recipientId ? `user${recipientId.split('_')[1]}` : '';
  
  switch (type) {
    case 'daily':
      return 'پاداش روزانه';
    case 'transfer':
      return amount > 0 ? `دریافت از ${recipientName}` : `انتقال به ${recipientName}`;
    case 'game_win':
      return `برد در بازی - ${['قمار', 'اسلات', 'دوئل', 'بینگو'][Math.floor(Math.random() * 4)]}`;
    case 'game_lose':
      return `باخت در بازی - ${['قمار', 'اسلات', 'دوئل', 'بینگو'][Math.floor(Math.random() * 4)]}`;
    case 'shop_purchase':
      return `خرید آیتم - ${['آواتار ویژه', 'رول رنگی', 'مصونیت سرقت', 'کارت بانکی طلایی'][Math.floor(Math.random() * 4)]}`;
    case 'admin_add':
      return 'افزودن سکه توسط ادمین';
    case 'admin_remove':
      return 'کسر سکه توسط ادمین';
    case 'work':
      return `کار - ${['برنامه‌نویسی', 'فروشندگی', 'خدمات', 'آموزش'][Math.floor(Math.random() * 4)]}`;
    case 'bank_interest':
      return 'سود حساب بانکی';
    case 'robbery':
      return amount > 0 ? 'سرقت موفق' : 'سرقت ناموفق';
    case 'stock_buy':
      return 'خرید سهام';
    case 'stock_sell':
      return 'فروش سهام';
    case 'stock_dividend':
      return 'سود سهام';
    default:
      return 'تراکنش';
  }
}