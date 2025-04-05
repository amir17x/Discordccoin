/**
 * مسیرهای مدیریت اقتصادی پنل ادمین
 */

import express from 'express';
import { getEconomyStats, getRecentTransactions, getAllTransactions, 
         setExchangeRate, setDailyReward, setBankInterestRate, 
         setTransferFee, getUserTransactions } from '../services/economyService.js';

const router = express.Router();

/**
 * صفحه اصلی مدیریت اقتصادی
 */
router.get('/', async (req, res) => {
  try {
    const stats = await getEconomyStats();
    const transactions = await getRecentTransactions(5);
    
    res.render('economy/index', {
      title: 'مدیریت اقتصادی',
      stats,
      transactions
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری اطلاعات اقتصادی: ${error.message}`);
    res.redirect('/admin/dashboard');
  }
});

/**
 * صفحه مدیریت تراکنش‌ها
 */
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || '';
    const userId = req.query.userId || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    
    const options = {
      page,
      limit,
      type,
      userId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };
    
    const result = await getAllTransactions(options);
    
    res.render('economy/transactions', {
      title: 'مدیریت تراکنش‌ها',
      transactions: result.transactions,
      pagination: result.pagination,
      filters: {
        type,
        userId,
        startDate,
        endDate
      }
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری تراکنش‌ها: ${error.message}`);
    res.redirect('/admin/economy');
  }
});

/**
 * صفحه تنظیمات اقتصادی
 */
router.get('/settings', async (req, res) => {
  try {
    const stats = await getEconomyStats();
    
    res.render('economy/settings', {
      title: 'تنظیمات اقتصادی',
      settings: {
        exchangeRate: stats.exchangeRate,
        dailyReward: stats.dailyReward,
        bankInterestRate: stats.bankInterestRate,
        transferFee: stats.transferFee
      }
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری تنظیمات اقتصادی: ${error.message}`);
    res.redirect('/admin/economy');
  }
});

/**
 * تنظیم نرخ تبدیل سکه به کریستال
 */
router.post('/settings/exchange-rate', async (req, res) => {
  const { rate } = req.body;
  
  try {
    if (!rate || isNaN(rate) || rate <= 0) {
      req.flash('error_msg', 'نرخ تبدیل باید عددی مثبت باشد');
      return res.redirect('/admin/economy/settings');
    }
    
    await setExchangeRate(parseFloat(rate));
    req.flash('success_msg', 'نرخ تبدیل سکه به کریستال با موفقیت به‌روزرسانی شد');
    res.redirect('/admin/economy/settings');
  } catch (error) {
    req.flash('error_msg', `خطا در به‌روزرسانی نرخ تبدیل: ${error.message}`);
    res.redirect('/admin/economy/settings');
  }
});

/**
 * تنظیم پاداش روزانه
 */
router.post('/settings/daily-reward', async (req, res) => {
  const { amount } = req.body;
  
  try {
    if (!amount || isNaN(amount) || amount < 0) {
      req.flash('error_msg', 'مقدار پاداش روزانه باید عددی مثبت یا صفر باشد');
      return res.redirect('/admin/economy/settings');
    }
    
    await setDailyReward(parseInt(amount));
    req.flash('success_msg', 'مقدار پاداش روزانه با موفقیت به‌روزرسانی شد');
    res.redirect('/admin/economy/settings');
  } catch (error) {
    req.flash('error_msg', `خطا در به‌روزرسانی پاداش روزانه: ${error.message}`);
    res.redirect('/admin/economy/settings');
  }
});

/**
 * تنظیم نرخ بهره بانکی
 */
router.post('/settings/bank-interest', async (req, res) => {
  const { rate } = req.body;
  
  try {
    if (!rate || isNaN(rate) || rate < 0 || rate > 100) {
      req.flash('error_msg', 'نرخ بهره باید عددی بین 0 تا 100 باشد');
      return res.redirect('/admin/economy/settings');
    }
    
    await setBankInterestRate(parseFloat(rate));
    req.flash('success_msg', 'نرخ بهره بانکی با موفقیت به‌روزرسانی شد');
    res.redirect('/admin/economy/settings');
  } catch (error) {
    req.flash('error_msg', `خطا در به‌روزرسانی نرخ بهره: ${error.message}`);
    res.redirect('/admin/economy/settings');
  }
});

/**
 * تنظیم کارمزد انتقال سکه
 */
router.post('/settings/transfer-fee', async (req, res) => {
  const { fee } = req.body;
  
  try {
    if (!fee || isNaN(fee) || fee < 0 || fee > 100) {
      req.flash('error_msg', 'کارمزد انتقال باید عددی بین 0 تا 100 باشد');
      return res.redirect('/admin/economy/settings');
    }
    
    await setTransferFee(parseFloat(fee));
    req.flash('success_msg', 'کارمزد انتقال سکه با موفقیت به‌روزرسانی شد');
    res.redirect('/admin/economy/settings');
  } catch (error) {
    req.flash('error_msg', `خطا در به‌روزرسانی کارمزد انتقال: ${error.message}`);
    res.redirect('/admin/economy/settings');
  }
});

/**
 * تاریخچه تراکنش‌های یک کاربر
 */
router.get('/user-transactions/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const transactions = await getUserTransactions(userId, 50);
    
    res.render('economy/user-transactions', {
      title: 'تراکنش‌های کاربر',
      userId,
      transactions
    });
  } catch (error) {
    req.flash('error_msg', `خطا در بارگیری تراکنش‌های کاربر: ${error.message}`);
    res.redirect('/admin/economy/transactions');
  }
});

export default router;