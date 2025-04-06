/**
 * سرویس اقتصادی
 */

import { MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

// نام پایگاه داده MongoDB
const DB_NAME = process.env.MONGO_DBNAME || 'ccoin';

// اتصال به مانگو
let client;
let db;

/**
 * اتصال به پایگاه داده
 * @returns {Promise<void>}
 */
async function connectToDatabase() {
  if (db) return db;
  
  try {
    if (mongoose.connection.readyState === 1) {
      // استفاده از اتصال موجود مانگوس
      db = mongoose.connection.db;
      return db;
    }
    
    // اتصال به صورت مستقیم
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ اتصال به دیتابیس MongoDB در سرویس اقتصادی برقرار شد');
    return db;
  } catch (error) {
    console.error('❌ خطا در اتصال به دیتابیس MongoDB در سرویس اقتصادی:', error);
    throw error;
  }
}

/**
 * افزودن سکه به کاربر
 * @param {Object} options گزینه‌های افزودن سکه
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function addCoinsToUser(options) {
  const {
    discordId,
    amount,
    reason,
    adminId
  } = options;
  
  if (!discordId || !amount || amount <= 0) {
    return {
      success: false,
      message: 'شناسه دیسکورد و مقدار سکه (مثبت) باید وارد شود'
    };
  }
  
  try {
    await connectToDatabase();
    
    // پیدا کردن کاربر با شناسه دیسکورد
    const user = await db.collection('users').findOne({ discordId });
    
    if (!user) {
      return {
        success: false,
        message: 'کاربری با این شناسه دیسکورد یافت نشد'
      };
    }
    
    // موجودی فعلی
    const currentBalance = user.balance || 0;
    
    // به‌روزرسانی موجودی
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          balance: currentBalance + amount,
          updatedAt: new Date()
        }
      }
    );
    
    // ثبت تراکنش
    await db.collection('transactions').insertOne({
      userId: user._id.toString(),
      discordId: user.discordId,
      amount,
      type: 'admin_add',
      reason,
      adminId,
      createdAt: new Date()
    });
    
    return {
      success: true,
      message: `${amount} سکه با موفقیت به کاربر اضافه شد`,
      newBalance: currentBalance + amount
    };
  } catch (error) {
    console.error('❌ خطا در افزودن سکه به کاربر:', error);
    return {
      success: false,
      message: 'خطایی در افزودن سکه به کاربر رخ داده است'
    };
  }
}

/**
 * کسر سکه از کاربر
 * @param {Object} options گزینه‌های کسر سکه
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function removeCoinsFromUser(options) {
  const {
    discordId,
    amount,
    reason,
    adminId
  } = options;
  
  if (!discordId || !amount || amount <= 0) {
    return {
      success: false,
      message: 'شناسه دیسکورد و مقدار سکه (مثبت) باید وارد شود'
    };
  }
  
  try {
    await connectToDatabase();
    
    // پیدا کردن کاربر با شناسه دیسکورد
    const user = await db.collection('users').findOne({ discordId });
    
    if (!user) {
      return {
        success: false,
        message: 'کاربری با این شناسه دیسکورد یافت نشد'
      };
    }
    
    // موجودی فعلی
    const currentBalance = user.balance || 0;
    
    if (currentBalance < amount) {
      return {
        success: false,
        message: 'موجودی کاربر کافی نیست'
      };
    }
    
    // به‌روزرسانی موجودی
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          balance: currentBalance - amount,
          updatedAt: new Date()
        }
      }
    );
    
    // ثبت تراکنش
    await db.collection('transactions').insertOne({
      userId: user._id.toString(),
      discordId: user.discordId,
      amount: -amount, // منفی برای کسر
      type: 'admin_remove',
      reason,
      adminId,
      createdAt: new Date()
    });
    
    return {
      success: true,
      message: `${amount} سکه با موفقیت از کاربر کسر شد`,
      newBalance: currentBalance - amount
    };
  } catch (error) {
    console.error('❌ خطا در کسر سکه از کاربر:', error);
    return {
      success: false,
      message: 'خطایی در کسر سکه از کاربر رخ داده است'
    };
  }
}

/**
 * دریافت تراکنش‌های اخیر
 * @param {Number} limit تعداد تراکنش‌ها
 * @returns {Promise<Array>} لیست تراکنش‌های اخیر
 */
export async function getRecentTransactions(limit = 10) {
  try {
    await connectToDatabase();
    
    const transactions = await db.collection('transactions')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    // افزودن اطلاعات کاربران
    const userIds = [...new Set(transactions.map(t => t.userId))];
    const users = await db.collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .toArray();
    
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });
    
    const enrichedTransactions = transactions.map(transaction => {
      const user = userMap[transaction.userId];
      return {
        ...transaction,
        username: user ? user.name : 'کاربر ناشناس'
      };
    });
    
    return enrichedTransactions;
  } catch (error) {
    console.error('❌ خطا در دریافت تراکنش‌های اخیر:', error);
    return [];
  }
}

/**
 * دریافت تراکنش‌های یک کاربر
 * @param {string} userId شناسه کاربر
 * @param {Number} limit تعداد تراکنش‌ها
 * @returns {Promise<Array>} لیست تراکنش‌های کاربر
 */
export async function getUserTransactions(userId, limit = 10) {
  try {
    await connectToDatabase();
    
    const transactions = await db.collection('transactions')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    return transactions;
  } catch (error) {
    console.error(`❌ خطا در دریافت تراکنش‌های کاربر ${userId}:`, error);
    return [];
  }
}

/**
 * دریافت تراکنش‌های یک کاربر با صفحه‌بندی
 * @param {string} userId شناسه کاربر
 * @param {Number} page شماره صفحه
 * @param {Number} limit تعداد در هر صفحه
 * @returns {Promise<Object>} تراکنش‌ها و اطلاعات صفحه‌بندی
 */
export async function getUserTransactionsPaginated(userId, page = 1, limit = 20) {
  try {
    await connectToDatabase();
    
    const skip = (page - 1) * limit;
    
    // شمارش تعداد کل تراکنش‌ها
    const total = await db.collection('transactions').countDocuments({ userId });
    
    const transactions = await db.collection('transactions')
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      transactions,
      total,
      totalPages,
      page,
      limit
    };
  } catch (error) {
    console.error(`❌ خطا در دریافت تراکنش‌های کاربر ${userId} با صفحه‌بندی:`, error);
    return {
      transactions: [],
      total: 0,
      totalPages: 0,
      page,
      limit
    };
  }
}

/**
 * دریافت آمار اقتصادی
 * @returns {Promise<Object>} آمار اقتصادی
 */
export async function getEconomyStats() {
  try {
    await connectToDatabase();
    
    // مجموع سکه‌های در گردش
    const totalCoinsResult = await db.collection('users').aggregate([
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$balance' }
        }
      }
    ]).toArray();
    
    const totalCoins = totalCoinsResult.length > 0 ? totalCoinsResult[0].totalCoins : 0;
    
    // تعداد تراکنش‌های روزانه
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyTransactionsCount = await db.collection('transactions').countDocuments({
      createdAt: { $gte: today }
    });
    
    // تعداد تراکنش‌های هفتگی
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyTransactionsCount = await db.collection('transactions').countDocuments({
      createdAt: { $gte: weekAgo }
    });
    
    // تعداد کاربران فعال اقتصادی (کاربرانی که در هفته گذشته تراکنش داشته‌اند)
    const activeUserIds = await db.collection('transactions')
      .distinct('userId', { createdAt: { $gte: weekAgo } });
    
    const activeUsers = activeUserIds.length;
    
    // تورم (مقدار فرضی)
    const inflationRate = 2.5;
    
    return {
      totalCoins,
      dailyTransactions: dailyTransactionsCount,
      weeklyTransactions: weeklyTransactionsCount,
      activeUsers,
      inflationRate
    };
  } catch (error) {
    console.error('❌ خطا در دریافت آمار اقتصادی:', error);
    return {
      totalCoins: 0,
      dailyTransactions: 0,
      weeklyTransactions: 0,
      activeUsers: 0,
      inflationRate: 0
    };
  }
}

/**
 * دریافت آمار تراکنش‌های امروز
 * @returns {Promise<Object>} آمار تراکنش‌های امروز
 */
export async function getTodayTransactionStats() {
  try {
    await connectToDatabase();
    
    // تنظیم محدوده زمانی (امروز)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // شمارش تعداد تراکنش‌های امروز
    const count = await db.collection('transactions').countDocuments({
      createdAt: { $gte: today }
    });
    
    // محاسبه حجم تراکنش‌ها (مجموع مقادیر مثبت)
    const volumeResult = await db.collection('transactions').aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          amount: { $gt: 0 } // فقط مقادیر مثبت
        }
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' }
        }
      }
    ]).toArray();
    
    const volume = volumeResult.length > 0 ? volumeResult[0].totalVolume : 0;
    
    // آمار انواع تراکنش‌ها
    const typeStats = await db.collection('transactions').aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // ساختن نتیجه نهایی
    return {
      count,
      volume,
      typeStats: typeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('❌ خطا در دریافت آمار تراکنش‌های امروز:', error);
    return {
      count: 0,
      volume: 0,
      typeStats: {}
    };
  }
}

/**
 * دریافت آمار بازار سهام
 * @returns {Promise<Object>} آمار بازار سهام
 */
export async function getStockMarketOverview() {
  try {
    await connectToDatabase();
    
    // دریافت همه سهام
    const stocks = await db.collection('stocks')
      .find({})
      .sort({ price: -1 })
      .toArray();
    
    // وضعیت کلی بازار
    let marketCondition;
    let volatility = 'low';
    
    if (stocks.length === 0) {
      marketCondition = 'neutral';
    } else {
      // محاسبه میانگین تغییرات قیمت
      const avgChange = stocks.reduce((sum, stock) => sum + (stock.change || 0), 0) / stocks.length;
      
      // محاسبه نوسان بازار (انحراف استاندارد تغییرات)
      const changeValues = stocks.map(stock => stock.change || 0);
      const mean = changeValues.reduce((sum, value) => sum + value, 0) / changeValues.length;
      const squaredDifferences = changeValues.map(value => Math.pow(value - mean, 2));
      const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / squaredDifferences.length;
      const stdDev = Math.sqrt(variance);
      
      // تعیین وضعیت بازار بر اساس میانگین تغییرات
      if (avgChange > 1) {
        marketCondition = 'up';
      } else if (avgChange < -1) {
        marketCondition = 'down';
      } else {
        marketCondition = 'neutral';
      }
      
      // تعیین نوسان بازار بر اساس انحراف استاندارد
      if (stdDev > 3) {
        volatility = 'high';
      } else if (stdDev > 1.5) {
        volatility = 'medium';
      } else {
        volatility = 'low';
      }
    }
    
    // تعداد معاملات اخیر
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentTradesCount = await db.collection('stock_trades')
      .countDocuments({ createdAt: { $gte: today } });
    
    return {
      stocks,
      marketCondition,
      volatility,
      recentTradesCount
    };
  } catch (error) {
    console.error('❌ خطا در دریافت آمار بازار سهام:', error);
    return {
      stocks: [],
      marketCondition: 'neutral',
      volatility: 'low',
      recentTradesCount: 0
    };
  }
}
