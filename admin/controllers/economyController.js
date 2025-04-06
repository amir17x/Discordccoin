/**
 * کنترلر مدیریت اقتصادی
 */

import * as economyService from '../services/economyService.js';
import * as userService from '../services/userService.js';

/**
 * نمایش صفحه اصلی بخش اقتصادی
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showEconomyDashboard(req, res) {
  try {
    console.log('📊 نمایش داشبورد اقتصادی');
    
    // دریافت آمار اقتصادی
    const economyStats = await economyService.getEconomyStats();
    
    // دریافت تراکنش‌های اخیر
    const recentTransactions = await economyService.getRecentTransactions(5);
    
    // دریافت آمار بازار سهام
    const stockMarketStats = await economyService.getStockMarketOverview();
    
    res.render('economy/dashboard', {
      title: 'داشبورد اقتصادی',
      economyStats,
      recentTransactions,
      stockMarketStats,
      formatCurrency: (amount) => {
        if (typeof amount !== 'number') {
          amount = parseInt(amount || 0);
        }
        return amount.toLocaleString('fa-IR');
      },
      formatDate: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fa-IR');
      }
    });
  } catch (error) {
    console.error('❌ خطا در نمایش داشبورد اقتصادی:', error);
    req.flash('error', 'خطایی در بارگیری داشبورد اقتصادی رخ داده است');
    res.redirect('/admin/dashboard');
  }
}

/**
 * نمایش لیست تراکنش‌ها
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function listTransactions(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const query = req.query.q || '';
    const type = req.query.type || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    
    console.log(`💰 دریافت لیست تراکنش‌ها: صفحه ${page}، تعداد ${limit}، جستجو: "${query}", نوع: "${type}"`);
    
    // تبدیل تاریخ‌ها به شی Date
    const dateFilter = {};
    if (startDate) {
      dateFilter.start = new Date(startDate);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1); // شامل روز انتخاب شده
      dateFilter.end = endDateObj;
    }
    
    // فیلترها
    const filters = {};
    
    if (type) {
      filters.type = type;
    }
    
    if (Object.keys(dateFilter).length > 0) {
      filters.date = dateFilter;
    }
    
    const result = await economyService.getTransactions({
      page,
      limit,
      query,
      filters
    });
    
    res.render('economy/transactions/index', {
      title: 'مدیریت تراکنش‌ها',
      transactions: result.transactions || [],
      query,
      type,
      startDate,
      endDate,
      pagination: {
        page,
        limit,
        totalPages: result.totalPages || 1,
        totalTransactions: result.total || 0
      },
      formatCurrency: (amount) => {
        if (typeof amount !== 'number') {
          amount = parseInt(amount || 0);
        }
        return amount.toLocaleString('fa-IR');
      },
      formatDate: (date, includeTime = false) => {
        if (!date) return '-';
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        
        if (includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
        }
        
        return new Date(date).toLocaleDateString('fa-IR', options);
      }
    });
  } catch (error) {
    console.error('❌ خطا در نمایش لیست تراکنش‌ها:', error);
    req.flash('error', 'خطایی در بارگیری لیست تراکنش‌ها رخ داده است');
    res.redirect('/admin/economy');
  }
}

/**
 * نمایش جزئیات یک تراکنش
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function viewTransaction(req, res) {
  try {
    const transactionId = req.params.id;
    console.log(`💰 نمایش جزئیات تراکنش: ${transactionId}`);
    
    const transaction = await economyService.getTransactionById(transactionId);
    if (!transaction) {
      req.flash('error', 'تراکنش مورد نظر یافت نشد');
      return res.redirect('/admin/economy/transactions');
    }
    
    // دریافت اطلاعات کاربر
    const user = await userService.getUserById(transaction.userId);
    
    res.render('economy/transactions/view', {
      title: `جزئیات تراکنش #${transaction._id.toString().substr(-6)}`,
      transaction,
      user,
      formatCurrency: (amount) => {
        if (typeof amount !== 'number') {
          amount = parseInt(amount || 0);
        }
        return amount.toLocaleString('fa-IR');
      },
      formatDate: (date, includeTime = false) => {
        if (!date) return '-';
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        
        if (includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
        }
        
        return new Date(date).toLocaleDateString('fa-IR', options);
      }
    });
  } catch (error) {
    console.error(`❌ خطا در نمایش جزئیات تراکنش ${req.params.id}:`, error);
    req.flash('error', 'خطایی در بارگیری اطلاعات تراکنش رخ داده است');
    res.redirect('/admin/economy/transactions');
  }
}

/**
 * خروجی اکسل تراکنش‌ها
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function exportTransactions(req, res) {
  try {
    const query = req.query.q || '';
    const type = req.query.type || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    
    console.log(`📋 خروجی اکسل تراکنش‌ها - جستجو: "${query}", نوع: "${type}"`);
    
    // تبدیل تاریخ‌ها به شی Date
    const dateFilter = {};
    if (startDate) {
      dateFilter.start = new Date(startDate);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1); // شامل روز انتخاب شده
      dateFilter.end = endDateObj;
    }
    
    // فیلترها
    const filters = {};
    
    if (type) {
      filters.type = type;
    }
    
    if (Object.keys(dateFilter).length > 0) {
      filters.date = dateFilter;
    }
    
    // دریافت تمام تراکنش‌ها بدون صفحه‌بندی
    const transactions = await economyService.getAllTransactions({
      query,
      filters
    });
    
    // تنظیم هدرهای پاسخ برای دانلود فایل
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    
    // عناوین ستون‌ها
    res.write('شناسه,کاربر,شناسه دیسکورد,نوع,مبلغ,توضیحات,تاریخ\n');
    
    // تبدیل نوع تراکنش به فارسی
    const getTransactionTypeInPersian = (type) => {
      const types = {
        'transfer': 'انتقال',
        'purchase': 'خرید',
        'sale': 'فروش',
        'game_reward': 'پاداش بازی',
        'game_loss': 'باخت بازی',
        'admin_add': 'افزایش توسط ادمین',
        'admin_remove': 'کاهش توسط ادمین',
        'interest': 'سود بانکی',
        'gift': 'هدیه',
        'other': 'سایر'
      };
      
      return types[type] || 'نامشخص';
    };
    
    // داده‌های تراکنش‌ها
    transactions.forEach(transaction => {
      const createdAt = new Date(transaction.createdAt).toLocaleDateString('fa-IR');
      const type = getTransactionTypeInPersian(transaction.type);
      const amount = transaction.amount.toString();
      const reason = transaction.reason || '';
      
      res.write(`${transaction._id},${transaction.username || 'نامشخص'},${transaction.discordId || 'نامشخص'},${type},${amount},"${reason}",${createdAt}\n`);
    });
    
    res.end();
  } catch (error) {
    console.error('❌ خطا در خروجی اکسل تراکنش‌ها:', error);
    req.flash('error', 'خطایی در تهیه خروجی اکسل تراکنش‌ها رخ داده است');
    res.redirect('/admin/economy/transactions');
  }
}

/**
 * نمایش لیست سهام
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function listStocks(req, res) {
  try {
    console.log('📈 دریافت لیست سهام');
    
    // دریافت سهام
    const stocksResult = await economyService.getStocks();
    const stocks = stocksResult.stocks || [];
    
    // دریافت آمار معاملات
    const tradeStats = {
      dailyVolume: 0,
      dailyTrades: 0,
      activeTraders: 0
    };
    
    try {
      const statsResult = await economyService.getStockTradeStats();
      Object.assign(tradeStats, statsResult);
    } catch (error) {
      console.error('⚠️ خطا در دریافت آمار معاملات سهام:', error);
    }
    
    // تعیین وضعیت کلی بازار
    let marketStatus = 'neutral';
    let marketTrend = 0;
    
    if (stocks.length > 0) {
      // محاسبه میانگین تغییرات قیمت
      const totalChange = stocks.reduce((sum, stock) => sum + (stock.change || 0), 0);
      marketTrend = Math.round((totalChange / stocks.length) * 100) / 100;
      
      if (marketTrend > 1) {
        marketStatus = 'up';
      } else if (marketTrend < -1) {
        marketStatus = 'down';
      }
    }
    
    res.render('economy/stocks/index', {
      title: 'مدیریت بازار سهام',
      stocks,
      tradeStats,
      marketStatus,
      marketTrend,
      formatCurrency: (amount) => {
        if (typeof amount !== 'number') {
          amount = parseInt(amount || 0);
        }
        return amount.toLocaleString('fa-IR');
      }
    });
  } catch (error) {
    console.error('❌ خطا در نمایش لیست سهام:', error);
    req.flash('error', 'خطایی در بارگیری لیست سهام رخ داده است');
    res.redirect('/admin/economy');
  }
}

/**
 * نمایش فرم ایجاد سهام جدید
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function createStockForm(req, res) {
  try {
    console.log('📈 نمایش فرم ایجاد سهام جدید');
    
    res.render('economy/stocks/create', {
      title: 'ایجاد سهام جدید',
      stock: {
        name: '',
        symbol: '',
        description: '',
        price: 100,
        minPrice: 10,
        maxPrice: 1000,
        volatility: 5,
        active: true
      }
    });
  } catch (error) {
    console.error('❌ خطا در نمایش فرم ایجاد سهام:', error);
    req.flash('error', 'خطایی در بارگیری فرم ایجاد سهام رخ داده است');
    res.redirect('/admin/economy/stocks');
  }
}

/**
 * ذخیره سهام جدید
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function saveNewStock(req, res) {
  try {
    const stockData = req.body;
    console.log('📈 ذخیره سهام جدید:', stockData.name);
    
    // تبدیل مقادیر عددی
    stockData.price = parseFloat(stockData.price);
    stockData.minPrice = parseFloat(stockData.minPrice);
    stockData.maxPrice = parseFloat(stockData.maxPrice);
    stockData.volatility = parseFloat(stockData.volatility);
    
    // تبدیل وضعیت فعال بودن
    stockData.active = stockData.active === 'on' || stockData.active === true;
    
    // اضافه کردن داده‌های پیش‌فرض
    stockData.volume = 0;
    stockData.change = 0;
    stockData.createdAt = new Date();
    stockData.updatedAt = new Date();
    
    const result = await economyService.createStock(stockData);
    
    if (result.success) {
      req.flash('success', 'سهام جدید با موفقیت ایجاد شد');
      return res.redirect('/admin/economy/stocks');
    } else {
      req.flash('error', result.message || 'خطایی در ایجاد سهام رخ داده است');
      return res.redirect('/admin/economy/stocks/create');
    }
  } catch (error) {
    console.error('❌ خطا در ذخیره سهام جدید:', error);
    req.flash('error', 'خطایی در ایجاد سهام رخ داده است');
    res.redirect('/admin/economy/stocks/create');
  }
}

/**
 * نمایش جزئیات سهام
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function viewStock(req, res) {
  try {
    const stockId = req.params.id;
    console.log(`📈 نمایش جزئیات سهام: ${stockId}`);
    
    const stock = await economyService.getStockById(stockId);
    if (!stock) {
      req.flash('error', 'سهام مورد نظر یافت نشد');
      return res.redirect('/admin/economy/stocks');
    }
    
    // دریافت تاریخچه قیمت
    const priceHistory = await economyService.getStockPriceHistory(stockId);
    
    // دریافت معاملات اخیر
    const recentTrades = await economyService.getStockRecentTrades(stockId, 10);
    
    // دریافت لیست سهامداران برتر
    const topHolders = await economyService.getStockTopHolders(stockId, 10);
    
    res.render('economy/stocks/view', {
      title: `سهام ${stock.name}`,
      stock,
      priceHistory: priceHistory || [],
      recentTrades: recentTrades || [],
      topHolders: topHolders || [],
      formatCurrency: (amount) => {
        if (typeof amount !== 'number') {
          amount = parseInt(amount || 0);
        }
        return amount.toLocaleString('fa-IR');
      },
      formatDate: (date, includeTime = false) => {
        if (!date) return '-';
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        
        if (includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
        }
        
        return new Date(date).toLocaleDateString('fa-IR', options);
      }
    });
  } catch (error) {
    console.error(`❌ خطا در نمایش جزئیات سهام ${req.params.id}:`, error);
    req.flash('error', 'خطایی در بارگیری اطلاعات سهام رخ داده است');
    res.redirect('/admin/economy/stocks');
  }
}

/**
 * نمایش فرم ویرایش سهام
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function editStockForm(req, res) {
  try {
    const stockId = req.params.id;
    console.log(`📈 نمایش فرم ویرایش سهام: ${stockId}`);
    
    const stock = await economyService.getStockById(stockId);
    if (!stock) {
      req.flash('error', 'سهام مورد نظر یافت نشد');
      return res.redirect('/admin/economy/stocks');
    }
    
    res.render('economy/stocks/edit', {
      title: `ویرایش سهام ${stock.name}`,
      stock
    });
  } catch (error) {
    console.error(`❌ خطا در نمایش فرم ویرایش سهام ${req.params.id}:`, error);
    req.flash('error', 'خطایی در بارگیری اطلاعات سهام رخ داده است');
    res.redirect('/admin/economy/stocks');
  }
}

/**
 * به‌روزرسانی سهام
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function updateStock(req, res) {
  try {
    const stockId = req.params.id;
    const updateData = req.body;
    
    console.log(`📈 به‌روزرسانی سهام: ${stockId}`);
    
    // تبدیل مقادیر عددی
    updateData.price = parseFloat(updateData.price);
    updateData.minPrice = parseFloat(updateData.minPrice);
    updateData.maxPrice = parseFloat(updateData.maxPrice);
    updateData.volatility = parseFloat(updateData.volatility);
    
    // تبدیل وضعیت فعال بودن
    updateData.active = updateData.active === 'on' || updateData.active === true;
    
    // به‌روزرسانی زمان
    updateData.updatedAt = new Date();
    
    const result = await economyService.updateStock(stockId, updateData);
    
    if (result.success) {
      req.flash('success', 'سهام با موفقیت به‌روزرسانی شد');
    } else {
      req.flash('error', result.message || 'خطایی در به‌روزرسانی سهام رخ داده است');
    }
    
    res.redirect(`/admin/economy/stocks/${stockId}/edit`);
  } catch (error) {
    console.error(`❌ خطا در به‌روزرسانی سهام ${req.params.id}:`, error);
    req.flash('error', 'خطایی در به‌روزرسانی سهام رخ داده است');
    res.redirect(`/admin/economy/stocks/${req.params.id}/edit`);
  }
}

/**
 * فعال/غیرفعال کردن سهام
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function toggleStockStatus(req, res) {
  try {
    const stockId = req.params.id;
    const activate = req.path.endsWith('/activate');
    
    console.log(`📈 ${activate ? 'فعال' : 'غیرفعال'} کردن سهام: ${stockId}`);
    
    const result = await economyService.updateStock(stockId, {
      active: activate,
      updatedAt: new Date()
    });
    
    if (result.success) {
      req.flash('success', `سهام با موفقیت ${activate ? 'فعال' : 'غیرفعال'} شد`);
    } else {
      req.flash('error', result.message || `خطایی در ${activate ? 'فعال' : 'غیرفعال'} کردن سهام رخ داده است`);
    }
    
    res.redirect('/admin/economy/stocks');
  } catch (error) {
    console.error(`❌ خطا در تغییر وضعیت سهام ${req.params.id}:`, error);
    req.flash('error', 'خطایی در تغییر وضعیت سهام رخ داده است');
    res.redirect('/admin/economy/stocks');
  }
}

/**
 * نمایش معاملات یک سهام
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function stockTrades(req, res) {
  try {
    const stockId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    console.log(`📈 نمایش معاملات سهام: ${stockId}, صفحه ${page}, تعداد ${limit}`);
    
    const stock = await economyService.getStockById(stockId);
    if (!stock) {
      req.flash('error', 'سهام مورد نظر یافت نشد');
      return res.redirect('/admin/economy/stocks');
    }
    
    const result = await economyService.getStockTradesPaginated(stockId, page, limit);
    
    res.render('economy/stocks/trades', {
      title: `معاملات سهام ${stock.name}`,
      stock,
      trades: result.trades || [],
      pagination: {
        page,
        limit,
        totalPages: result.totalPages || 1,
        totalTrades: result.total || 0
      },
      formatCurrency: (amount) => {
        if (typeof amount !== 'number') {
          amount = parseInt(amount || 0);
        }
        return amount.toLocaleString('fa-IR');
      },
      formatDate: (date, includeTime = false) => {
        if (!date) return '-';
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        
        if (includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
        }
        
        return new Date(date).toLocaleDateString('fa-IR', options);
      }
    });
  } catch (error) {
    console.error(`❌ خطا در نمایش معاملات سهام ${req.params.id}:`, error);
    req.flash('error', 'خطایی در بارگیری معاملات سهام رخ داده است');
    res.redirect('/admin/economy/stocks');
  }
}

/**
 * نمایش لیست بانک‌ها
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showBanks(req, res) {
  try {
    console.log('🏦 دریافت لیست بانک‌ها');
    
    // دریافت بانک‌ها
    const banks = await economyService.getBanks();
    
    // دریافت آمار بانک‌ها
    let bankStats = {
      totalBanks: banks.length,
      totalDeposits: 0,
      totalDepositors: 0,
      depositGrowth: 0
    };
    
    try {
      const statsResult = await economyService.getBankStats();
      Object.assign(bankStats, statsResult);
    } catch (error) {
      console.error('⚠️ خطا در دریافت آمار بانک‌ها:', error);
    }
    
    res.render('economy/banks/index', {
      title: 'مدیریت بانک‌ها',
      banks,
      bankStats,
      formatCurrency: (amount) => {
        if (typeof amount !== 'number') {
          amount = parseInt(amount || 0);
        }
        return amount.toLocaleString('fa-IR');
      }
    });
  } catch (error) {
    console.error('❌ خطای پنل ادمین:', error);
    req.flash('error', 'خطایی در بارگیری لیست بانک‌ها رخ داده است');
    res.redirect('/admin/economy');
  }
}

/**
 * نمایش فرم ایجاد بانک جدید
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function createBankForm(req, res) {
  try {
    console.log('🏦 نمایش فرم ایجاد بانک جدید');
    
    res.render('economy/banks/create', {
      title: 'ایجاد بانک جدید',
      bank: {
        name: '',
        description: '',
        interestRate: 2.5,
        minDeposit: 100,
        maxDeposit: 100000,
        active: true
      }
    });
  } catch (error) {
    console.error('❌ خطا در نمایش فرم ایجاد بانک:', error);
    req.flash('error', 'خطایی در بارگیری فرم ایجاد بانک رخ داده است');
    res.redirect('/admin/economy/banks');
  }
}

/**
 * ذخیره بانک جدید
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function saveNewBank(req, res) {
  try {
    const bankData = req.body;
    console.log('🏦 ذخیره بانک جدید:', bankData.name);
    
    // تبدیل مقادیر عددی
    bankData.interestRate = parseFloat(bankData.interestRate);
    bankData.minDeposit = parseInt(bankData.minDeposit);
    bankData.maxDeposit = parseInt(bankData.maxDeposit);
    
    // تبدیل وضعیت فعال بودن
    bankData.active = bankData.active === 'on' || bankData.active === true;
    
    // اضافه کردن داده‌های پیش‌فرض
    bankData.createdAt = new Date();
    bankData.updatedAt = new Date();
    
    const result = await economyService.createBank(bankData);
    
    if (result.success) {
      req.flash('success', 'بانک جدید با موفقیت ایجاد شد');
      return res.redirect('/admin/economy/banks');
    } else {
      req.flash('error', result.message || 'خطایی در ایجاد بانک رخ داده است');
      return res.redirect('/admin/economy/banks/create');
    }
  } catch (error) {
    console.error('❌ خطا در ذخیره بانک جدید:', error);
    req.flash('error', 'خطایی در ایجاد بانک رخ داده است');
    res.redirect('/admin/economy/banks/create');
  }
}

/**
 * نمایش جزئیات بانک
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function viewBank(req, res) {
  try {
    const bankId = req.params.id;
    console.log(`🏦 نمایش جزئیات بانک: ${bankId}`);
    
    const bank = await economyService.getBankById(bankId);
    if (!bank) {
      req.flash('error', 'بانک مورد نظر یافت نشد');
      return res.redirect('/admin/economy/banks');
    }
    
    // دریافت سپرده‌های اخیر
    const recentDeposits = await economyService.getBankRecentDeposits(bankId, 10);
    
    // دریافت پرداخت‌های سود اخیر
    const recentInterestPayments = await economyService.getBankRecentInterestPayments(bankId, 10);
    
    // دریافت لیست سپرده‌گذاران برتر
    const topDepositors = await economyService.getBankTopDepositors(bankId, 10);
    
    res.render('economy/banks/view', {
      title: `بانک ${bank.name}`,
      bank,
      recentDeposits: recentDeposits || [],
      recentInterestPayments: recentInterestPayments || [],
      topDepositors: topDepositors || [],
      formatCurrency: (amount) => {
        if (typeof amount !== 'number') {
          amount = parseInt(amount || 0);
        }
        return amount.toLocaleString('fa-IR');
      },
      formatDate: (date, includeTime = false) => {
        if (!date) return '-';
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        
        if (includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
        }
        
        return new Date(date).toLocaleDateString('fa-IR', options);
      }
    });
  } catch (error) {
    console.error(`❌ خطا در نمایش جزئیات بانک ${req.params.id}:`, error);
    req.flash('error', 'خطایی در بارگیری اطلاعات بانک رخ داده است');
    res.redirect('/admin/economy/banks');
  }
}

/**
 * نمایش فرم ویرایش بانک
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function editBankForm(req, res) {
  try {
    const bankId = req.params.id;
    console.log(`🏦 نمایش فرم ویرایش بانک: ${bankId}`);
    
    const bank = await economyService.getBankById(bankId);
    if (!bank) {
      req.flash('error', 'بانک مورد نظر یافت نشد');
      return res.redirect('/admin/economy/banks');
    }
    
    res.render('economy/banks/edit', {
      title: `ویرایش بانک ${bank.name}`,
      bank
    });
  } catch (error) {
    console.error(`❌ خطا در نمایش فرم ویرایش بانک ${req.params.id}:`, error);
    req.flash('error', 'خطایی در بارگیری اطلاعات بانک رخ داده است');
    res.redirect('/admin/economy/banks');
  }
}

/**
 * به‌روزرسانی بانک
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function updateBank(req, res) {
  try {
    const bankId = req.params.id;
    const updateData = req.body;
    
    console.log(`🏦 به‌روزرسانی بانک: ${bankId}`);
    
    // تبدیل مقادیر عددی
    updateData.interestRate = parseFloat(updateData.interestRate);
    updateData.minDeposit = parseInt(updateData.minDeposit);
    updateData.maxDeposit = parseInt(updateData.maxDeposit);
    
    // تبدیل وضعیت فعال بودن
    updateData.active = updateData.active === 'on' || updateData.active === true;
    
    // به‌روزرسانی زمان
    updateData.updatedAt = new Date();
    
    const result = await economyService.updateBank(bankId, updateData);
    
    if (result.success) {
      req.flash('success', 'بانک با موفقیت به‌روزرسانی شد');
    } else {
      req.flash('error', result.message || 'خطایی در به‌روزرسانی بانک رخ داده است');
    }
    
    res.redirect(`/admin/economy/banks/${bankId}/edit`);
  } catch (error) {
    console.error(`❌ خطا در به‌روزرسانی بانک ${req.params.id}:`, error);
    req.flash('error', 'خطایی در به‌روزرسانی بانک رخ داده است');
    res.redirect(`/admin/economy/banks/${req.params.id}/edit`);
  }
}

/**
 * فعال/غیرفعال کردن بانک
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function toggleBankStatus(req, res) {
  try {
    const bankId = req.params.id;
    const activate = req.path.endsWith('/activate');
    
    console.log(`🏦 ${activate ? 'فعال' : 'غیرفعال'} کردن بانک: ${bankId}`);
    
    const result = await economyService.updateBank(bankId, {
      active: activate,
      updatedAt: new Date()
    });
    
    if (result.success) {
      req.flash('success', `بانک با موفقیت ${activate ? 'فعال' : 'غیرفعال'} شد`);
    } else {
      req.flash('error', result.message || `خطایی در ${activate ? 'فعال' : 'غیرفعال'} کردن بانک رخ داده است`);
    }
    
    res.redirect('/admin/economy/banks');
  } catch (error) {
    console.error(`❌ خطا در تغییر وضعیت بانک ${req.params.id}:`, error);
    req.flash('error', 'خطایی در تغییر وضعیت بانک رخ داده است');
    res.redirect('/admin/economy/banks');
  }
}

/**
 * نمایش لیست فروشگاه‌ها
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function listShops(req, res) {
  try {
    console.log('🛒 دریافت لیست فروشگاه‌ها');
    
    // دریافت فروشگاه‌ها
    const shops = await economyService.getShops();
    
    res.render('economy/shops/index', {
      title: 'مدیریت فروشگاه‌ها',
      shops
    });
  } catch (error) {
    console.error('❌ خطا در نمایش لیست فروشگاه‌ها:', error);
    req.flash('error', 'خطایی در بارگیری لیست فروشگاه‌ها رخ داده است');
    res.redirect('/admin/economy');
  }
}

/**
 * نمایش لیست آیتم‌ها
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function listItems(req, res) {
  try {
    console.log('🎁 دریافت لیست آیتم‌ها');
    
    // دریافت آیتم‌ها
    const items = await economyService.getItems();
    
    res.render('economy/items/index', {
      title: 'مدیریت آیتم‌ها',
      items
    });
  } catch (error) {
    console.error('❌ خطا در نمایش لیست آیتم‌ها:', error);
    req.flash('error', 'خطایی در بارگیری لیست آیتم‌ها رخ داده است');
    res.redirect('/admin/economy');
  }
}

/**
 * API برای دریافت آمار آنلاین
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function getRealtimeStats(req, res) {
  try {
    console.log('📊 دریافت آمار آنلاین');
    
    // دریافت آمار اقتصادی
    const economyStats = await economyService.getEconomyStats();
    
    res.json({
      totalCoins: economyStats.totalCoins || 0,
      dailyTransactions: economyStats.dailyTransactions || 0,
      weeklyTransactions: economyStats.weeklyTransactions || 0,
      activeUsers: economyStats.activeUsers || 0,
      inflationRate: economyStats.inflationRate || 0
    });
  } catch (error) {
    console.error('❌ خطا در API آمار آنلاین:', error);
    res.json({
      totalCoins: 0,
      dailyTransactions: 0,
      weeklyTransactions: 0,
      activeUsers: 0,
      inflationRate: 0
    });
  }
}

/**
 * نمایش صفحه تنظیمات اقتصادی
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function showEconomySettings(req, res) {
  try {
    console.log('⚙️ نمایش تنظیمات اقتصادی');
    
    // دریافت تنظیمات اقتصادی
    const settings = await economyService.getEconomySettings();
    
    res.render('economy/settings', {
      title: 'تنظیمات اقتصادی',
      settings
    });
  } catch (error) {
    console.error('❌ خطا در نمایش تنظیمات اقتصادی:', error);
    req.flash('error', 'خطایی در بارگیری تنظیمات اقتصادی رخ داده است');
    res.redirect('/admin/economy');
  }
}

/**
 * ذخیره تنظیمات اقتصادی
 * @param {Object} req درخواست
 * @param {Object} res پاسخ
 */
export async function saveEconomySettings(req, res) {
  try {
    const settingsData = req.body;
    console.log('⚙️ ذخیره تنظیمات اقتصادی');
    
    // تبدیل مقادیر عددی
    settingsData.startingBalance = parseInt(settingsData.startingBalance);
    settingsData.dailyBonus = parseInt(settingsData.dailyBonus);
    settingsData.transferFeePercent = parseFloat(settingsData.transferFeePercent);
    settingsData.minTransferAmount = parseInt(settingsData.minTransferAmount);
    
    // تبدیل وضعیت‌های بولین
    settingsData.transferEnabled = settingsData.transferEnabled === 'on' || settingsData.transferEnabled === true;
    settingsData.dailyBonusEnabled = settingsData.dailyBonusEnabled === 'on' || settingsData.dailyBonusEnabled === true;
    settingsData.giftEnabled = settingsData.giftEnabled === 'on' || settingsData.giftEnabled === true;
    
    const result = await economyService.updateEconomySettings(settingsData);
    
    if (result.success) {
      req.flash('success', 'تنظیمات اقتصادی با موفقیت به‌روزرسانی شد');
    } else {
      req.flash('error', result.message || 'خطایی در به‌روزرسانی تنظیمات اقتصادی رخ داده است');
    }
    
    res.redirect('/admin/economy/settings');
  } catch (error) {
    console.error('❌ خطا در ذخیره تنظیمات اقتصادی:', error);
    req.flash('error', 'خطایی در به‌روزرسانی تنظیمات اقتصادی رخ داده است');
    res.redirect('/admin/economy/settings');
  }
}
