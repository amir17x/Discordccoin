/**
 * سرویس اتصال به MongoDB و دسترسی به مدل‌های سرور
 * 
 * این سرویس برای اتصال به پایگاه داده MongoDB و دسترسی به مدل‌های مختلف استفاده می‌شود.
 * از مدل‌های اصلی بات دیسکورد در پوشه server/models استفاده می‌کند.
 */

import mongoose from 'mongoose';
import { 
  User, 
  Transaction, 
  Stock, 
  MarketListing, 
  Loan, 
  GlobalSettings 
} from './modelHelpers.js';

// مسیر اتصال به MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ccoin';

let isConnected = false;

/**
 * اتصال به پایگاه داده MongoDB
 * @returns {Promise<boolean>} وضعیت اتصال
 */
export async function connectToMongoDB() {
  if (isConnected) return true;

  try {
    // بررسی وضعیت اتصال فعلی
    if (mongoose.connection.readyState === 1) {
      console.log('🌿 اتصال به MongoDB از قبل برقرار شده است');
      isConnected = true;
      return true;
    }
    
    // اگر در حال اتصال هستیم، منتظر می‌مانیم
    if (mongoose.connection.readyState === 2) {
      console.log('⏳ در حال اتصال به MongoDB...');
      await new Promise(resolve => mongoose.connection.once('connected', resolve));
      isConnected = true;
      return true;
    }
    
    // ایجاد اتصال جدید
    await mongoose.connect(MONGO_URI, {});
    console.log('🌿 اتصال به MongoDB (Mongoose) با موفقیت برقرار شد');
    isConnected = true;
    return true;
  } catch (error) {
    console.error('خطا در اتصال به MongoDB (Mongoose):', error);
    throw error;
  }
}

/**
 * دریافت آمار کلی سیستم
 * @returns {Promise<Object>} آمار سیستم
 */
export async function getSystemStats() {
  try {
    await connectToMongoDB();

    // شمارش کاربران
    const totalUsers = await User.countDocuments();
    
    // دریافت مجموع تراکنش‌ها
    const totalTransactions = await Transaction.countDocuments();
    
    // محاسبه مجموع سکه‌ها در سیستم
    const totalCoinsQuery = await User.aggregate([
      {
        $group: {
          _id: null,
          totalWallet: { $sum: '$wallet' },
          totalBank: { $sum: '$bank' }
        }
      }
    ]);
    
    const totalCoins = totalCoinsQuery.length > 0 
      ? (totalCoinsQuery[0].totalWallet + totalCoinsQuery[0].totalBank) 
      : 0;
    
    // دریافت تعداد سرورها (ممکن است مدل‌های متفاوتی وجود داشته باشد)
    const totalServers = 0; // این مقدار باید از مدل مناسب دریافت شود
    
    return {
      totalUsers,
      totalTransactions,
      totalCoins,
      totalServers
    };
  } catch (error) {
    console.error('خطا در دریافت آمار سیستم:', error);
    return {
      totalUsers: 0,
      totalTransactions: 0,
      totalCoins: 0,
      totalServers: 0
    };
  }
}

/**
 * دریافت تراکنش‌های اخیر
 * @param {number} limit تعداد تراکنش‌ها
 * @returns {Promise<Array>} لیست تراکنش‌ها
 */
export async function getRecentTransactions(limit = 5) {
  try {
    await connectToMongoDB();

    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    // برای هر تراکنش، دریافت نام کاربر
    const transactionsWithUsernames = await Promise.all(
      transactions.map(async (transaction) => {
        let username = 'نامشخص';
        
        if (transaction.userId) {
          const user = await User.findOne({ discordId: transaction.userId });
          if (user) username = user.username;
        }
        
        return {
          ...transaction,
          username
        };
      })
    );

    return transactionsWithUsernames;
  } catch (error) {
    console.error('خطا در دریافت تراکنش‌های اخیر:', error);
    return [];
  }
}

/**
 * دریافت فعالیت‌های اخیر (ترکیبی از انواع مختلف رویدادها)
 * @param {number} limit تعداد فعالیت‌ها
 * @returns {Promise<Array>} لیست فعالیت‌ها
 */
export async function getRecentActivities(limit = 5) {
  try {
    await connectToMongoDB();

    // دریافت تراکنش‌های اخیر
    const recentTransactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
      
    // تبدیل تراکنش‌ها به فعالیت‌ها
    const activities = await Promise.all(
      recentTransactions.map(async (transaction) => {
        const user = transaction.userId ? await User.findOne({ discordId: transaction.userId }) : null;
        const username = user ? user.username : 'نامشخص';
        
        // تبدیل نوع تراکنش به آیکون مناسب
        let icon = 'fas fa-money-bill-wave';
        let text = '';
        
        switch (transaction.type) {
          case 'deposit':
            icon = 'fas fa-arrow-down';
            text = `کاربر "${username}" مبلغ ${transaction.amount} سکه را به حساب بانکی واریز کرد`;
            break;
          case 'withdraw':
            icon = 'fas fa-arrow-up';
            text = `کاربر "${username}" مبلغ ${transaction.amount} سکه را از حساب بانکی برداشت کرد`;
            break;
          case 'transfer':
          case 'transfer_sent':
            icon = 'fas fa-exchange-alt';
            text = `کاربر "${username}" مبلغ ${transaction.amount} سکه را به کاربر دیگری منتقل کرد`;
            break;
          case 'market_purchase':
          case 'shop_purchase':
            icon = 'fas fa-shopping-cart';
            text = `کاربر "${username}" خریدی به ارزش ${transaction.amount} سکه انجام داد`;
            break;
          case 'daily':
          case 'weekly':
          case 'monthly':
            icon = 'fas fa-calendar-check';
            text = `کاربر "${username}" جایزه ${transaction.type} به مقدار ${transaction.amount} سکه دریافت کرد`;
            break;
          case 'work':
          case 'job_income':
            icon = 'fas fa-briefcase';
            text = `کاربر "${username}" از کار کردن ${transaction.amount} سکه دریافت کرد`;
            break;
          default:
            text = `کاربر "${username}" یک تراکنش ${transaction.type} به مقدار ${transaction.amount} سکه انجام داد`;
        }
        
        // تبدیل تاریخ به فرمت مناسب
        const now = new Date();
        const txTime = new Date(transaction.timestamp);
        const diffMs = now - txTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        let time;
        if (diffMins < 60) {
          time = `${diffMins} دقیقه پیش`;
        } else if (diffHours < 24) {
          time = `${diffHours} ساعت پیش`;
        } else {
          time = `${diffDays} روز پیش`;
        }
        
        return {
          icon,
          text,
          time,
          raw: transaction
        };
      })
    );
    
    return activities;
  } catch (error) {
    console.error('خطا در دریافت فعالیت‌های اخیر:', error);
    return [];
  }
}

/**
 * دریافت وضعیت سیستم
 * @returns {Promise<Object>} وضعیت سیستم
 */
export async function getSystemStatus() {
  try {
    // زمان شروع پردازش برای محاسبه پینگ دیتابیس
    const dbStartTime = Date.now();
    await connectToMongoDB();
    const dbPingTime = Date.now() - dbStartTime;
    
    // دریافت تنظیمات بازار سهام
    const stockStatus = await Stock.findOne().sort({ updatedAt: -1 });
    
    // محاسبه نرخ تورم با توجه به وضعیت قیمت‌ها
    // - در حالت واقعی، این مقدار از الگوریتم‌های پیچیده‌تری محاسبه می‌شود
    const inflationRate = stockStatus ? (stockStatus.multiplier - 1) * 100 : 0;
    
    // وضعیت بازار
    let stockMarket = 'normal';
    if (stockStatus) {
      if (stockStatus.multiplier > 1.1) {
        stockMarket = 'bull'; // بازار صعودی
      } else if (stockStatus.multiplier < 0.9) {
        stockMarket = 'bear'; // بازار نزولی
      } else if (stockStatus.multiplier < 0.7) {
        stockMarket = 'crisis'; // بحران اقتصادی
      }
    }
    
    // وضعیت بانک
    // - بررسی نسبت وام‌های پرداخت نشده به کل وام‌ها
    const totalLoans = await Loan.countDocuments();
    const unpaidLoans = await Loan.countDocuments({ isPaid: false, isOverdue: true });
    const loanRatio = totalLoans > 0 ? unpaidLoans / totalLoans : 0;
    
    let bankStatus = 'healthy';
    if (loanRatio > 0.2) {
      bankStatus = 'risky';
    } else if (loanRatio > 0.5) {
      bankStatus = 'critical';
    }
    
    // فرض می‌کنیم بات آنلاین است
    const botStatus = 'online';
    
    // دریافت زمان آنلاین بودن سیستم از تنظیمات عمومی
    let uptimeMs = 0;
    let uptime = "نامشخص";
    
    try {
      const settings = await GlobalSettings.getGlobalSettings();
      if (settings && settings.botStartTime) {
        const startTime = new Date(settings.botStartTime);
        const now = new Date();
        uptimeMs = now - startTime;
        
        // تبدیل به فرمت مناسب: روز، ساعت، دقیقه
        const days = Math.floor(uptimeMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor((uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((uptimeMs % (60 * 60 * 1000)) / (60 * 1000));
        
        uptime = `${days} روز، ${hours} ساعت، ${minutes} دقیقه`;
      }
    } catch (err) {
      console.error('خطا در دریافت زمان آنلاین بودن ربات:', err);
    }
    
    // محاسبه پینگ سرویس‌های مختلف
    // 1. پینگ دیتابیس - از قبل محاسبه شده
    let dbPing = dbPingTime;
    
    // 2. پینگ دیسکورد - مقدار نمونه
    let discordPing = 50; // میلی‌ثانیه
    try {
      // سعی می‌کنیم از ربات دیسکورد پینگ را بخوانیم
      const { getDiscordPing } = await import('../utils/discord.js').catch(() => ({ getDiscordPing: null }));
      if (typeof getDiscordPing === 'function') {
        const ping = await getDiscordPing();
        discordPing = ping || discordPing;
      }
    } catch (err) {
      console.warn('خطا در دریافت پینگ دیسکورد:', err);
    }
    
    // 3. پینگ هوش مصنوعی - مقدار نمونه
    let aiPing = 150; // میلی‌ثانیه
    try {
      // سعی می‌کنیم از سرویس هوش مصنوعی پینگ را بخوانیم
      const { getAIPing } = await import('../utils/ai.js').catch(() => ({ getAIPing: null }));
      if (typeof getAIPing === 'function') {
        const ping = await getAIPing();
        aiPing = ping || aiPing;
      }
    } catch (err) {
      console.warn('خطا در دریافت پینگ هوش مصنوعی:', err);
    }
    
    // وضعیت پینگ‌ها
    const getPingStatus = (ping) => {
      if (ping < 100) return 'excellent';
      if (ping < 200) return 'good';
      if (ping < 400) return 'average';
      return 'poor';
    };
    
    // زمان آخرین به‌روزرسانی
    const lastUpdate = new Date();
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffMins = Math.floor(diffMs / 60000);
    let lastUpdateStr;
    
    if (diffMins < 60) {
      lastUpdateStr = `${diffMins} دقیقه پیش`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      lastUpdateStr = `${diffHours} ساعت پیش`;
    }
    
    // بررسی وضعیت سرویس‌ها
    const servicesStatus = {
      bot: true,              // ربات دیسکورد
      database: dbPingTime < 1000,  // دیتابیس
      ai: aiPing < 500,       // هوش مصنوعی
      stockMarket: true,      // بازار سهام
      bank: bankStatus !== 'critical' // بانک
    };
    
    return {
      stockMarket,
      inflationRate: parseFloat(inflationRate.toFixed(1)),
      bankStatus,
      botStatus,
      lastUpdate: lastUpdateStr,
      // اطلاعات جدید
      uptime,
      uptimeMs,
      ping: {
        discord: {
          value: discordPing,
          status: getPingStatus(discordPing)
        },
        database: {
          value: dbPing,
          status: getPingStatus(dbPing)
        },
        ai: {
          value: aiPing,
          status: getPingStatus(aiPing)
        }
      },
      services: servicesStatus
    };
  } catch (error) {
    console.error('خطا در دریافت وضعیت سیستم:', error);
    return {
      stockMarket: 'normal',
      inflationRate: 0,
      bankStatus: 'healthy',
      botStatus: 'unknown',
      lastUpdate: 'نامشخص'
    };
  }
}

/**
 * دریافت اطلاعات بازار سهام
 * @param {number} limit تعداد سهام
 * @returns {Promise<Array>} لیست سهام
 */
export async function getStockInfo(limit = 5) {
  try {
    await connectToMongoDB();
    
    const stocks = await Stock.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
      
    // تبدیل اطلاعات سهام به فرمت مورد نیاز
    return stocks.map(stock => {
      const now = new Date();
      const updateDate = new Date(stock.updatedAt);
      
      // تبدیل تاریخ به فرمت شمسی ساده
      const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
      const persianDate = updateDate.toLocaleDateString('fa-IR', options);
      
      return {
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        price: stock.currentPrice,
        change: stock.percentChange,
        date: persianDate,
        user: stock.lastUpdatedBy || 'سیستم'
      };
    });
  } catch (error) {
    console.error('خطا در دریافت اطلاعات بازار سهام:', error);
    return [];
  }
}

/**
 * دریافت اطلاعیه‌های سیستم
 * @returns {Promise<Array>} لیست اطلاعیه‌ها
 */
export async function getAnnouncements() {
  try {
    await connectToMongoDB();
    
    // در این نسخه، اطلاعیه‌ها از یک منبع ثابت دریافت می‌شوند
    // در نسخه‌های بعدی، می‌توان از یک مدل اختصاصی استفاده کرد
    
    const announcements = [
      {
        title: 'به‌روزرسانی سیستم',
        date: '۱۴۰۲/۰۱/۱۵',
        content: 'سیستم CCoin به نسخه ۲.۵.۰ به‌روزرسانی شد. برای اطلاعات بیشتر، لاگ تغییرات را مشاهده کنید.'
      },
      {
        title: 'تعمیرات سرور',
        date: '۱۴۰۲/۰۱/۱۰',
        content: 'در تاریخ ۲۰ فروردین، سرورها برای تعمیرات به مدت ۲ ساعت در دسترس نخواهند بود.'
      }
    ];
    
    return announcements;
  } catch (error) {
    console.error('خطا در دریافت اطلاعیه‌ها:', error);
    return [];
  }
}

/**
 * دریافت لیست کاربران
 * @param {number} page شماره صفحه
 * @param {number} limit تعداد در هر صفحه
 * @returns {Promise<Object>} لیست کاربران و اطلاعات صفحه‌بندی
 */
export async function getUsers(page = 1, limit = 20) {
  try {
    await connectToMongoDB();
    
    const skip = (page - 1) * limit;
    
    // شمارش کل کاربران
    const total = await User.countDocuments();
    
    // دریافت کاربران با صفحه‌بندی
    const users = await User.find()
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('خطا در دریافت لیست کاربران:', error);
    return {
      users: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    };
  }
}

/**
 * دریافت اطلاعات یک کاربر با شناسه دیسکورد
 * @param {string} discordId شناسه دیسکورد کاربر
 * @returns {Promise<Object|null>} اطلاعات کاربر یا null در صورت عدم وجود
 */
export async function getUserByDiscordId(discordId) {
  try {
    await connectToMongoDB();
    
    const user = await User.findOne({ discordId }).lean();
    return user;
  } catch (error) {
    console.error(`خطا در دریافت اطلاعات کاربر با شناسه ${discordId}:`, error);
    return null;
  }
}

/**
 * دریافت لیست تراکنش‌های یک کاربر
 * @param {string} discordId شناسه دیسکورد کاربر
 * @param {number} limit تعداد تراکنش‌ها
 * @returns {Promise<Array>} لیست تراکنش‌ها
 */
export async function getUserTransactions(discordId, limit = 50) {
  try {
    await connectToMongoDB();
    
    const transactions = await Transaction.find({ userId: discordId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
      
    return transactions;
  } catch (error) {
    console.error(`خطا در دریافت تراکنش‌های کاربر با شناسه ${discordId}:`, error);
    return [];
  }
}

/**
 * به‌روزرسانی موجودی یک کاربر (سکه‌ها)
 * @param {string} discordId شناسه دیسکورد کاربر
 * @param {number} wallet موجودی کیف پول
 * @param {number} bank موجودی بانک
 * @returns {Promise<boolean>} وضعیت عملیات
 */
export async function updateUserBalance(discordId, wallet, bank) {
  try {
    await connectToMongoDB();
    
    const result = await User.updateOne(
      { discordId },
      { $set: { wallet, bank } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`خطا در به‌روزرسانی موجودی کاربر با شناسه ${discordId}:`, error);
    return false;
  }
}

/**
 * دریافت اطلاعات فروشگاه
 * @param {number} limit تعداد آیتم‌ها
 * @returns {Promise<Array>} لیست آیتم‌های فروشگاه
 */
export async function getShopItems(limit = 20) {
  try {
    await connectToMongoDB();
    
    const items = await MarketListing.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
      
    return items;
  } catch (error) {
    console.error('خطا در دریافت اطلاعات فروشگاه:', error);
    return [];
  }
}

/**
 * دریافت اطلاعات وام‌ها
 * @param {number} page شماره صفحه
 * @param {number} limit تعداد در هر صفحه
 * @returns {Promise<Object>} لیست وام‌ها و اطلاعات صفحه‌بندی
 */
export async function getLoans(page = 1, limit = 20) {
  try {
    await connectToMongoDB();
    
    const skip = (page - 1) * limit;
    
    // شمارش کل وام‌ها
    const total = await Loan.countDocuments();
    
    // دریافت وام‌ها با صفحه‌بندی
    const loans = await Loan.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    // افزودن اطلاعات کاربران به وام‌ها
    const loansWithUserInfo = await Promise.all(
      loans.map(async (loan) => {
        const user = await User.findOne({ discordId: loan.userId });
        return {
          ...loan,
          username: user ? user.username : 'نامشخص'
        };
      })
    );
      
    return {
      loans: loansWithUserInfo,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('خطا در دریافت اطلاعات وام‌ها:', error);
    return {
      loans: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    };
  }
}

/**
 * دریافت تراکنش‌های مرتبط با بازار سهام
 * @param {number} limit تعداد تراکنش‌ها
 * @returns {Promise<Array>} لیست تراکنش‌های مرتبط با بازار سهام
 */
export async function getStockTransactions(limit = 10) {
  try {
    await connectToMongoDB();

    // دریافت تراکنش‌های مرتبط با خرید و فروش سهام
    const transactions = await Transaction.find({
      $or: [
        { type: 'stock_buy' },
        { type: 'stock_sell' },
        { type: 'stock_dividend' }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    // برای هر تراکنش، دریافت نام کاربر
    const transactionsWithUsernames = await Promise.all(
      transactions.map(async (transaction) => {
        let username = 'نامشخص';
        
        if (transaction.userId) {
          const user = await User.findOne({ discordId: transaction.userId });
          if (user) username = user.username;
        }
        
        // تبدیل تاریخ به فرمت فارسی
        const txDate = new Date(transaction.timestamp);
        const options = { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        };
        const persianDate = txDate.toLocaleDateString('fa-IR', options);
        
        // تبدیل نوع تراکنش به فرمت مناسب
        let type = 'other';
        if (transaction.type === 'stock_buy') type = 'buy';
        else if (transaction.type === 'stock_sell') type = 'sell';
        else if (transaction.type === 'stock_dividend') type = 'dividend';
        
        return {
          ...transaction,
          username,
          timestamp: persianDate,
          type,
          stockSymbol: transaction.stockSymbol || 'نامشخص',
          quantity: transaction.stockQuantity || 1,
          price: transaction.amount || 0
        };
      })
    );

    return transactionsWithUsernames;
  } catch (error) {
    console.error('خطا در دریافت تراکنش‌های بازار سهام:', error);
    return [];
  }
}

/**
 * دریافت آمار بازار سهام
 * @returns {Promise<Object>} آمار بازار سهام
 */
export async function getStockMarketStats() {
  try {
    await connectToMongoDB();
    
    // محاسبه حجم معاملات امروز
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalVolumeQuery = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { type: 'stock_buy' },
            { type: 'stock_sell' }
          ],
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalVolume = totalVolumeQuery.length > 0 ? totalVolumeQuery[0].totalVolume : 0;
    
    // دریافت تعداد معامله‌گران فعال (کاربرانی که امروز معامله‌ای انجام داده‌اند)
    const activeTradersQuery = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { type: 'stock_buy' },
            { type: 'stock_sell' }
          ],
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$userId'
        }
      },
      {
        $count: 'activeTraders'
      }
    ]);
    
    const activeTraders = activeTradersQuery.length > 0 ? activeTradersQuery[0].activeTraders : 0;
    
    return {
      totalVolume,
      activeTraders
    };
  } catch (error) {
    console.error('خطا در دریافت آمار بازار سهام:', error);
    return {
      totalVolume: 0,
      activeTraders: 0
    };
  }
}