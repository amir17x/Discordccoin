/**
 * سرویس مدیریت اقتصادی
 */

import { getUserById } from './userService.js';

/**
 * دریافت آمار اقتصادی
 * @returns {Object} آمار اقتصادی
 */
export async function getEconomyStats() {
  try {
    // در حالت واقعی باید از دیتابیس خوانده شود
    return {
      totalCoins: 12500000,
      totalCrystals: 25000,
      totalTransactions: 45678,
      averageUserBalance: 9876,
      richestUsers: 32,
      topTransactionAmount: 50000,
      dailyVolume: 250000,
      weeklyVolume: 1750000,
      coinInflationRate: 2.5, // درصد تورم در ماه اخیر
      exchangeRate: 100 // تعداد سکه برای هر کریستال
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
    // در حالت واقعی باید از دیتابیس خوانده شود
    const transactionTypes = [
      'daily', 'transfer', 'game_win', 'game_lose', 'shop_purchase', 
      'admin_add', 'admin_remove', 'work', 'bank_interest', 'robbery'
    ];
    
    const transactions = Array.from({ length: limit }, (_, i) => {
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const amount = Math.floor(Math.random() * 5000) * (type.includes('lose') || type.includes('remove') || type === 'robbery' ? -1 : 1);
      const userId = `user_${Math.floor(Math.random() * 100) + 1}`;
      
      // برای تراکنش‌های انتقال، گیرنده هم داریم
      const recipientId = type === 'transfer' ? `user_${Math.floor(Math.random() * 100) + 1}` : null;
      
      return {
        id: `tx_${Date.now() - i * 1000}`,
        userId,
        username: `user${userId.split('_')[1]}`,
        type,
        amount,
        recipientId,
        recipientName: recipientId ? `user${recipientId.split('_')[1]}` : null,
        description: generateTransactionDescription(type, amount, recipientId),
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString()
      };
    });
    
    return transactions;
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
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;
    
    // ساخت تراکنش‌های نمونه
    const sampleTransactions = [];
    const transactionTypes = [
      'daily', 'transfer', 'game_win', 'game_lose', 'shop_purchase', 
      'admin_add', 'admin_remove', 'work', 'bank_interest', 'robbery'
    ];
    
    // ساخت داده نمونه
    for (let i = 0; i < 100; i++) {
      const txType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const txAmount = Math.floor(Math.random() * 5000) * (txType.includes('lose') || txType.includes('remove') || txType === 'robbery' ? -1 : 1);
      const txUserId = `user_${Math.floor(Math.random() * 100) + 1}`;
      const txRecipientId = txType === 'transfer' ? `user_${Math.floor(Math.random() * 100) + 1}` : null;
      const randomDaysAgo = Math.floor(Math.random() * 30);
      
      sampleTransactions.push({
        id: `tx_${i}`,
        userId: txUserId,
        username: `user${txUserId.split('_')[1]}`,
        type: txType,
        amount: txAmount,
        recipientId: txRecipientId,
        recipientName: txRecipientId ? `user${txRecipientId.split('_')[1]}` : null,
        description: generateTransactionDescription(txType, txAmount, txRecipientId),
        timestamp: new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // اعمال فیلترها
    let filteredTransactions = [...sampleTransactions];
    
    if (userId) {
      filteredTransactions = filteredTransactions.filter(tx => tx.userId === userId || tx.recipientId === userId);
    }
    
    if (type) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
    }
    
    if (minAmount !== null) {
      filteredTransactions = filteredTransactions.filter(tx => tx.amount >= minAmount);
    }
    
    if (maxAmount !== null) {
      filteredTransactions = filteredTransactions.filter(tx => tx.amount <= maxAmount);
    }
    
    if (startDate) {
      const startDateObj = new Date(startDate);
      filteredTransactions = filteredTransactions.filter(tx => new Date(tx.timestamp) >= startDateObj);
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter(tx => new Date(tx.timestamp) <= endDateObj);
    }
    
    // مرتب‌سازی
    filteredTransactions.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (sortBy === 'timestamp') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    // صفحه‌بندی
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    return {
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        totalTransactions: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / limit)
      }
    };
  } catch (error) {
    console.error('خطا در دریافت تراکنش‌ها:', error);
    return { transactions: [], pagination: { page: 1, limit: 20, totalTransactions: 0, totalPages: 0 } };
  }
}

/**
 * تنظیم نرخ تبدیل سکه به کریستال
 * @param {number} rate نرخ تبدیل (تعداد سکه برای هر کریستال)
 * @returns {Object} نتیجه عملیات
 */
export async function setExchangeRate(rate) {
  try {
    if (!rate || isNaN(rate) || rate <= 0) {
      throw new Error('نرخ تبدیل باید عددی مثبت باشد');
    }
    
    // در حالت واقعی باید در دیتابیس ذخیره شود
    console.log(`نرخ تبدیل سکه به کریستال به ${rate} تغییر یافت`);
    
    return {
      success: true,
      oldRate: 100, // نرخ قبلی - در حالت واقعی باید از دیتابیس خوانده شود
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
 * @returns {Object} نتیجه عملیات
 */
export async function setDailyReward(amount) {
  try {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('مقدار پاداش روزانه باید عددی مثبت باشد');
    }
    
    // در حالت واقعی باید در دیتابیس ذخیره شود
    console.log(`پاداش روزانه به ${amount} تغییر یافت`);
    
    return {
      success: true,
      oldAmount: 1000, // مقدار قبلی - در حالت واقعی باید از دیتابیس خوانده شود
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
 * @returns {Object} نتیجه عملیات
 */
export async function setBankInterestRate(rate) {
  try {
    if (isNaN(rate) || rate < 0) {
      throw new Error('نرخ بهره باید عددی غیرمنفی باشد');
    }
    
    // در حالت واقعی باید در دیتابیس ذخیره شود
    console.log(`نرخ بهره بانکی به ${rate}% تغییر یافت`);
    
    return {
      success: true,
      oldRate: 2, // نرخ قبلی - در حالت واقعی باید از دیتابیس خوانده شود
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
 * @returns {Object} نتیجه عملیات
 */
export async function setTransferFee(fee) {
  try {
    if (isNaN(fee) || fee < 0 || fee > 100) {
      throw new Error('کارمزد باید عددی بین 0 تا 100 باشد');
    }
    
    // در حالت واقعی باید در دیتابیس ذخیره شود
    console.log(`کارمزد انتقال سکه به ${fee}% تغییر یافت`);
    
    return {
      success: true,
      oldFee: 5, // کارمزد قبلی - در حالت واقعی باید از دیتابیس خوانده شود
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
    
    // در حالت واقعی باید از دیتابیس خوانده شود
    const transactionTypes = [
      'daily', 'transfer', 'game_win', 'game_lose', 'shop_purchase', 
      'admin_add', 'admin_remove', 'work', 'bank_interest', 'robbery'
    ];
    
    const transactions = Array.from({ length: limit }, (_, i) => {
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const amount = Math.floor(Math.random() * 5000) * (type.includes('lose') || type.includes('remove') || txType === 'robbery' ? -1 : 1);
      const recipientId = type === 'transfer' ? `user_${Math.floor(Math.random() * 100) + 1}` : null;
      
      return {
        id: `tx_${Date.now() - i * 1000}`,
        userId,
        username: user.username,
        type,
        amount,
        recipientId,
        recipientName: recipientId ? `user${recipientId.split('_')[1]}` : null,
        description: generateTransactionDescription(type, amount, recipientId),
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
      };
    });
    
    return transactions;
  } catch (error) {
    console.error(`خطا در دریافت تراکنش‌های کاربر ${userId}:`, error);
    throw error;
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
    default:
      return 'تراکنش';
  }
}