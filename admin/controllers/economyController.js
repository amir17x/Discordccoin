/**
 * کنترلر مدیریت اقتصاد
 * 
 * این ماژول شامل توابع مدیریت سیستم اقتصادی، سکه‌ها، کریستال‌ها، بانک‌ها،
 * تراکنش‌ها، فروشگاه‌ها، آیتم‌ها و بازار سهام است.
 */

import { Economy } from '../models/economy.js';
import { AdminStock } from '../models/stock.js';
import { Transaction } from '../models/transaction.js';
import { Bank } from '../models/bank.js';
import { Shop } from '../models/shop.js';
import { Item } from '../models/item.js';
import { User } from '../models/user.js';

/**
 * کنترلر اقتصاد
 */
export const economyController = {
  /**
   * نمایش داشبورد مدیریت اقتصاد
   */
  showDashboard: async (req, res) => {
    try {
      // آمار کلی اقتصاد
      const userCount = await User.countDocuments();
      const totalCoins = await Economy.aggregate([
        { $group: { _id: null, total: { $sum: "$coins" } } }
      ]);
      const totalCrystals = await Economy.aggregate([
        { $group: { _id: null, total: { $sum: "$crystals" } } }
      ]);
      const recentTransactions = await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId');
      
      res.render('economy/dashboard', {
        title: 'مدیریت اقتصاد',
        totalCoins: totalCoins.length > 0 ? totalCoins[0].total : 0,
        totalCrystals: totalCrystals.length > 0 ? totalCrystals[0].total : 0,
        userCount,
        recentTransactions
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری داشبورد اقتصاد: ${error.message}`);
      res.redirect('/admin/dashboard');
    }
  },

  /**
   * نمایش صفحه مدیریت سکه‌ها
   */
  showCoinsManagement: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;
      
      // یافتن کاربران و مقادیر سکه آنها
      const usersWithCoins = await Economy.find()
        .populate('userId')
        .sort({ coins: -1 })
        .skip(skip)
        .limit(limit);
        
      const total = await Economy.countDocuments();
      
      res.render('economy/coins', {
        title: 'مدیریت سکه‌ها',
        users: usersWithCoins,
        pagination: {
          page,
          pageCount: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری صفحه مدیریت سکه‌ها: ${error.message}`);
      res.redirect('/admin/economy');
    }
  },

  /**
   * افزودن سکه به کاربر
   */
  addCoins: async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      if (!userId || !amount) {
        req.flash('error', 'شناسه کاربر و مقدار سکه الزامی است');
        return res.redirect('/admin/economy/coins');
      }
      
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        req.flash('error', 'مقدار سکه باید عددی مثبت باشد');
        return res.redirect('/admin/economy/coins');
      }
      
      // افزودن سکه به کاربر
      await Economy.findOneAndUpdate(
        { userId },
        { $inc: { coins: amountNum } },
        { upsert: true }
      );
      
      // ثبت تراکنش
      await Transaction.create({
        userId,
        type: 'admin_add',
        amount: amountNum,
        currency: 'coin',
        description: reason || 'افزودن سکه توسط ادمین',
        adminId: req.session.user._id
      });
      
      req.flash('success', `${amountNum} سکه به کاربر با موفقیت اضافه شد`);
      res.redirect('/admin/economy/coins');
    } catch (error) {
      req.flash('error', `خطا در افزودن سکه: ${error.message}`);
      res.redirect('/admin/economy/coins');
    }
  },

  /**
   * کسر سکه از کاربر
   */
  deductCoins: async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      if (!userId || !amount) {
        req.flash('error', 'شناسه کاربر و مقدار سکه الزامی است');
        return res.redirect('/admin/economy/coins');
      }
      
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        req.flash('error', 'مقدار سکه باید عددی مثبت باشد');
        return res.redirect('/admin/economy/coins');
      }
      
      // کسر سکه از کاربر
      const economy = await Economy.findOne({ userId });
      if (!economy || economy.coins < amountNum) {
        req.flash('error', 'سکه‌های کاربر کافی نیست');
        return res.redirect('/admin/economy/coins');
      }
      
      await Economy.findOneAndUpdate(
        { userId },
        { $inc: { coins: -amountNum } }
      );
      
      // ثبت تراکنش
      await Transaction.create({
        userId,
        type: 'admin_deduct',
        amount: -amountNum,
        currency: 'coin',
        description: reason || 'کسر سکه توسط ادمین',
        adminId: req.session.user._id
      });
      
      req.flash('success', `${amountNum} سکه از کاربر با موفقیت کسر شد`);
      res.redirect('/admin/economy/coins');
    } catch (error) {
      req.flash('error', `خطا در کسر سکه: ${error.message}`);
      res.redirect('/admin/economy/coins');
    }
  },

  /**
   * ریست مقدار سکه کاربر
   */
  resetCoins: async (req, res) => {
    try {
      const { userId, reason } = req.body;
      if (!userId) {
        req.flash('error', 'شناسه کاربر الزامی است');
        return res.redirect('/admin/economy/coins');
      }
      
      // یافتن مقدار فعلی سکه‌ها
      const economy = await Economy.findOne({ userId });
      if (!economy) {
        req.flash('error', 'اطلاعات اقتصادی کاربر یافت نشد');
        return res.redirect('/admin/economy/coins');
      }
      
      const currentCoins = economy.coins;
      
      // ریست مقدار سکه‌ها
      await Economy.findOneAndUpdate(
        { userId },
        { $set: { coins: 0 } }
      );
      
      // ثبت تراکنش
      await Transaction.create({
        userId,
        type: 'admin_reset',
        amount: -currentCoins,
        currency: 'coin',
        description: reason || 'ریست سکه توسط ادمین',
        adminId: req.session.user._id
      });
      
      req.flash('success', `سکه‌های کاربر با موفقیت ریست شد`);
      res.redirect('/admin/economy/coins');
    } catch (error) {
      req.flash('error', `خطا در ریست سکه: ${error.message}`);
      res.redirect('/admin/economy/coins');
    }
  },

  /**
   * نمایش صفحه مدیریت کریستال‌ها
   */
  showCrystalsManagement: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;
      
      // یافتن کاربران و مقادیر کریستال آنها
      const usersWithCrystals = await Economy.find()
        .populate('userId')
        .sort({ crystals: -1 })
        .skip(skip)
        .limit(limit);
        
      const total = await Economy.countDocuments();
      
      res.render('economy/crystals', {
        title: 'مدیریت کریستال‌ها',
        users: usersWithCrystals,
        pagination: {
          page,
          pageCount: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری صفحه مدیریت کریستال‌ها: ${error.message}`);
      res.redirect('/admin/economy');
    }
  },

  /**
   * افزودن کریستال به کاربر
   */
  addCrystals: async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      if (!userId || !amount) {
        req.flash('error', 'شناسه کاربر و مقدار کریستال الزامی است');
        return res.redirect('/admin/economy/crystals');
      }
      
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        req.flash('error', 'مقدار کریستال باید عددی مثبت باشد');
        return res.redirect('/admin/economy/crystals');
      }
      
      // افزودن کریستال به کاربر
      await Economy.findOneAndUpdate(
        { userId },
        { $inc: { crystals: amountNum } },
        { upsert: true }
      );
      
      // ثبت تراکنش
      await Transaction.create({
        userId,
        type: 'admin_add',
        amount: amountNum,
        currency: 'crystal',
        description: reason || 'افزودن کریستال توسط ادمین',
        adminId: req.session.user._id
      });
      
      req.flash('success', `${amountNum} کریستال به کاربر با موفقیت اضافه شد`);
      res.redirect('/admin/economy/crystals');
    } catch (error) {
      req.flash('error', `خطا در افزودن کریستال: ${error.message}`);
      res.redirect('/admin/economy/crystals');
    }
  },

  /**
   * کسر کریستال از کاربر
   */
  deductCrystals: async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      if (!userId || !amount) {
        req.flash('error', 'شناسه کاربر و مقدار کریستال الزامی است');
        return res.redirect('/admin/economy/crystals');
      }
      
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        req.flash('error', 'مقدار کریستال باید عددی مثبت باشد');
        return res.redirect('/admin/economy/crystals');
      }
      
      // کسر کریستال از کاربر
      const economy = await Economy.findOne({ userId });
      if (!economy || economy.crystals < amountNum) {
        req.flash('error', 'کریستال‌های کاربر کافی نیست');
        return res.redirect('/admin/economy/crystals');
      }
      
      await Economy.findOneAndUpdate(
        { userId },
        { $inc: { crystals: -amountNum } }
      );
      
      // ثبت تراکنش
      await Transaction.create({
        userId,
        type: 'admin_deduct',
        amount: -amountNum,
        currency: 'crystal',
        description: reason || 'کسر کریستال توسط ادمین',
        adminId: req.session.user._id
      });
      
      req.flash('success', `${amountNum} کریستال از کاربر با موفقیت کسر شد`);
      res.redirect('/admin/economy/crystals');
    } catch (error) {
      req.flash('error', `خطا در کسر کریستال: ${error.message}`);
      res.redirect('/admin/economy/crystals');
    }
  },

  /**
   * ریست مقدار کریستال کاربر
   */
  resetCrystals: async (req, res) => {
    try {
      const { userId, reason } = req.body;
      if (!userId) {
        req.flash('error', 'شناسه کاربر الزامی است');
        return res.redirect('/admin/economy/crystals');
      }
      
      // یافتن مقدار فعلی کریستال‌ها
      const economy = await Economy.findOne({ userId });
      if (!economy) {
        req.flash('error', 'اطلاعات اقتصادی کاربر یافت نشد');
        return res.redirect('/admin/economy/crystals');
      }
      
      const currentCrystals = economy.crystals;
      
      // ریست مقدار کریستال‌ها
      await Economy.findOneAndUpdate(
        { userId },
        { $set: { crystals: 0 } }
      );
      
      // ثبت تراکنش
      await Transaction.create({
        userId,
        type: 'admin_reset',
        amount: -currentCrystals,
        currency: 'crystal',
        description: reason || 'ریست کریستال توسط ادمین',
        adminId: req.session.user._id
      });
      
      req.flash('success', `کریستال‌های کاربر با موفقیت ریست شد`);
      res.redirect('/admin/economy/crystals');
    } catch (error) {
      req.flash('error', `خطا در ریست کریستال: ${error.message}`);
      res.redirect('/admin/economy/crystals');
    }
  },

  // مدیریت بانک‌ها
  showBanks: async (req, res) => {
    try {
      const banks = await Bank.find().sort({ createdAt: -1 });
      res.render('economy/banks/index', {
        title: 'مدیریت بانک‌ها',
        banks
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری بانک‌ها: ${error.message}`);
      res.redirect('/admin/economy');
    }
  },

  showCreateBank: (req, res) => {
    res.render('economy/banks/create', {
      title: 'ایجاد بانک جدید'
    });
  },

  createBank: async (req, res) => {
    try {
      const { name, description, interestRate, minDeposit, maxDeposit } = req.body;
      await Bank.create({
        name,
        description,
        interestRate: parseFloat(interestRate) || 0,
        minDeposit: parseInt(minDeposit) || 0,
        maxDeposit: parseInt(maxDeposit) || 0
      });
      req.flash('success', 'بانک جدید با موفقیت ایجاد شد');
      res.redirect('/admin/economy/banks');
    } catch (error) {
      req.flash('error', `خطا در ایجاد بانک: ${error.message}`);
      res.redirect('/admin/economy/banks/new');
    }
  },

  showBank: async (req, res) => {
    try {
      const bank = await Bank.findById(req.params.id);
      if (!bank) {
        req.flash('error', 'بانک مورد نظر یافت نشد');
        return res.redirect('/admin/economy/banks');
      }
      res.render('economy/banks/edit', {
        title: `ویرایش بانک ${bank.name}`,
        bank
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات بانک: ${error.message}`);
      res.redirect('/admin/economy/banks');
    }
  },

  updateBank: async (req, res) => {
    try {
      const { name, description, interestRate, minDeposit, maxDeposit, active } = req.body;
      await Bank.findByIdAndUpdate(req.params.id, {
        name,
        description,
        interestRate: parseFloat(interestRate) || 0,
        minDeposit: parseInt(minDeposit) || 0,
        maxDeposit: parseInt(maxDeposit) || 0,
        active: active === 'on'
      });
      req.flash('success', 'بانک با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/economy/banks');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی بانک: ${error.message}`);
      res.redirect(`/admin/economy/banks/${req.params.id}`);
    }
  },

  deleteBank: async (req, res) => {
    try {
      await Bank.findByIdAndDelete(req.params.id);
      req.flash('success', 'بانک با موفقیت حذف شد');
      res.redirect('/admin/economy/banks');
    } catch (error) {
      req.flash('error', `خطا در حذف بانک: ${error.message}`);
      res.redirect('/admin/economy/banks');
    }
  },

  // مدیریت تراکنش‌ها
  showTransactions: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;
      
      const transactions = await Transaction.find()
        .populate('userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
      const total = await Transaction.countDocuments();
      
      res.render('economy/transactions/index', {
        title: 'مدیریت تراکنش‌ها',
        transactions,
        pagination: {
          page,
          pageCount: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تراکنش‌ها: ${error.message}`);
      res.redirect('/admin/economy');
    }
  },

  showTransaction: async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id)
        .populate('userId')
        .populate('adminId');
        
      if (!transaction) {
        req.flash('error', 'تراکنش مورد نظر یافت نشد');
        return res.redirect('/admin/economy/transactions');
      }
      
      res.render('economy/transactions/view', {
        title: 'جزئیات تراکنش',
        transaction
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات تراکنش: ${error.message}`);
      res.redirect('/admin/economy/transactions');
    }
  },

  exportTransactions: async (req, res) => {
    try {
      const { start, end, type, currency } = req.query;
      let query = {};
      
      if (start && end) {
        query.createdAt = {
          $gte: new Date(start),
          $lte: new Date(end)
        };
      }
      
      if (type) {
        query.type = type;
      }
      
      if (currency) {
        query.currency = currency;
      }
      
      const transactions = await Transaction.find(query)
        .populate('userId')
        .sort({ createdAt: -1 });
        
      // تبدیل به CSV
      let csv = 'تاریخ,کاربر,نوع,مقدار,واحد,توضیحات\n';
      transactions.forEach(t => {
        const date = new Date(t.createdAt).toLocaleDateString('fa-IR');
        const username = t.userId ? t.userId.username : 'ناشناس';
        csv += `${date},${username},${t.type},${t.amount},${t.currency},${t.description}\n`;
      });
      
      res.header('Content-Type', 'text/csv');
      res.attachment('transactions.csv');
      res.send(csv);
    } catch (error) {
      req.flash('error', `خطا در استخراج تراکنش‌ها: ${error.message}`);
      res.redirect('/admin/economy/transactions');
    }
  },

  // مدیریت فروشگاه‌ها
  showShops: async (req, res) => {
    try {
      const shops = await Shop.find().sort({ name: 1 });
      res.render('economy/shops/index', {
        title: 'مدیریت فروشگاه‌ها',
        shops
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری فروشگاه‌ها: ${error.message}`);
      res.redirect('/admin/economy');
    }
  },

  showCreateShop: (req, res) => {
    res.render('economy/shops/create', {
      title: 'ایجاد فروشگاه جدید'
    });
  },

  createShop: async (req, res) => {
    try {
      const { name, description, serverId, channels } = req.body;
      await Shop.create({
        name,
        description,
        serverId,
        channels: channels ? channels.split(',') : []
      });
      req.flash('success', 'فروشگاه جدید با موفقیت ایجاد شد');
      res.redirect('/admin/economy/shops');
    } catch (error) {
      req.flash('error', `خطا در ایجاد فروشگاه: ${error.message}`);
      res.redirect('/admin/economy/shops/new');
    }
  },

  showShop: async (req, res) => {
    try {
      const shop = await Shop.findById(req.params.id);
      if (!shop) {
        req.flash('error', 'فروشگاه مورد نظر یافت نشد');
        return res.redirect('/admin/economy/shops');
      }
      
      // دریافت آیتم‌های مرتبط با این فروشگاه
      const items = await Item.find({ shopId: shop._id });
      
      res.render('economy/shops/edit', {
        title: `ویرایش فروشگاه ${shop.name}`,
        shop,
        items
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات فروشگاه: ${error.message}`);
      res.redirect('/admin/economy/shops');
    }
  },

  updateShop: async (req, res) => {
    try {
      const { name, description, serverId, channels, active } = req.body;
      await Shop.findByIdAndUpdate(req.params.id, {
        name,
        description,
        serverId,
        channels: channels ? channels.split(',') : [],
        active: active === 'on'
      });
      req.flash('success', 'فروشگاه با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/economy/shops');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی فروشگاه: ${error.message}`);
      res.redirect(`/admin/economy/shops/${req.params.id}`);
    }
  },

  deleteShop: async (req, res) => {
    try {
      // بررسی وجود آیتم‌های وابسته
      const itemCount = await Item.countDocuments({ shopId: req.params.id });
      if (itemCount > 0) {
        req.flash('error', 'این فروشگاه دارای آیتم است و نمی‌تواند حذف شود');
        return res.redirect('/admin/economy/shops');
      }
      
      await Shop.findByIdAndDelete(req.params.id);
      req.flash('success', 'فروشگاه با موفقیت حذف شد');
      res.redirect('/admin/economy/shops');
    } catch (error) {
      req.flash('error', `خطا در حذف فروشگاه: ${error.message}`);
      res.redirect('/admin/economy/shops');
    }
  },

  // مدیریت آیتم‌ها
  showItems: async (req, res) => {
    try {
      const items = await Item.find().populate('shopId').sort({ name: 1 });
      const shops = await Shop.find().sort({ name: 1 });
      
      res.render('economy/items/index', {
        title: 'مدیریت آیتم‌ها',
        items,
        shops
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری آیتم‌ها: ${error.message}`);
      res.redirect('/admin/economy');
    }
  },

  showCreateItem: async (req, res) => {
    try {
      const shops = await Shop.find({ active: true }).sort({ name: 1 });
      res.render('economy/items/create', {
        title: 'ایجاد آیتم جدید',
        shops
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات: ${error.message}`);
      res.redirect('/admin/economy/items');
    }
  },

  createItem: async (req, res) => {
    try {
      const { 
        name, description, shopId, price, currency, 
        stock, maxPerUser, roles, commands, image 
      } = req.body;
      
      await Item.create({
        name,
        description,
        shopId,
        price: parseInt(price) || 0,
        currency: currency || 'coin',
        stock: parseInt(stock) || -1, // -1 برای نامحدود
        maxPerUser: parseInt(maxPerUser) || -1,
        roles: roles ? roles.split(',') : [],
        commands: commands ? commands.split('\n') : [],
        image: image || null
      });
      
      req.flash('success', 'آیتم جدید با موفقیت ایجاد شد');
      res.redirect('/admin/economy/items');
    } catch (error) {
      req.flash('error', `خطا در ایجاد آیتم: ${error.message}`);
      res.redirect('/admin/economy/items/new');
    }
  },

  showItem: async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) {
        req.flash('error', 'آیتم مورد نظر یافت نشد');
        return res.redirect('/admin/economy/items');
      }
      
      const shops = await Shop.find({ active: true }).sort({ name: 1 });
      
      res.render('economy/items/edit', {
        title: `ویرایش آیتم ${item.name}`,
        item,
        shops
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات آیتم: ${error.message}`);
      res.redirect('/admin/economy/items');
    }
  },

  updateItem: async (req, res) => {
    try {
      const { 
        name, description, shopId, price, currency, 
        stock, maxPerUser, roles, commands, image, active 
      } = req.body;
      
      await Item.findByIdAndUpdate(req.params.id, {
        name,
        description,
        shopId,
        price: parseInt(price) || 0,
        currency: currency || 'coin',
        stock: parseInt(stock) || -1,
        maxPerUser: parseInt(maxPerUser) || -1,
        roles: roles ? roles.split(',') : [],
        commands: commands ? commands.split('\n') : [],
        image: image || null,
        active: active === 'on'
      });
      
      req.flash('success', 'آیتم با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/economy/items');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی آیتم: ${error.message}`);
      res.redirect(`/admin/economy/items/${req.params.id}`);
    }
  },

  deleteItem: async (req, res) => {
    try {
      await Item.findByIdAndDelete(req.params.id);
      req.flash('success', 'آیتم با موفقیت حذف شد');
      res.redirect('/admin/economy/items');
    } catch (error) {
      req.flash('error', `خطا در حذف آیتم: ${error.message}`);
      res.redirect('/admin/economy/items');
    }
  },

  // مدیریت سهام
  showStocks: async (req, res) => {
    try {
      const stocks = await AdminStock.find().sort({ name: 1 });
      res.render('economy/stocks/index', {
        title: 'مدیریت بازار سهام',
        stocks
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات سهام: ${error.message}`);
      res.redirect('/admin/economy');
    }
  },

  showCreateStock: (req, res) => {
    res.render('economy/stocks/create', {
      title: 'ایجاد سهام جدید'
    });
  },

  createStock: async (req, res) => {
    try {
      const { name, symbol, description, initialPrice, volatility } = req.body;
      
      await AdminStock.create({
        name,
        symbol,
        description,
        currentPrice: parseInt(initialPrice) || 1000,
        initialPrice: parseInt(initialPrice) || 1000,
        volatility: parseFloat(volatility) || 5.0
      });
      
      req.flash('success', 'سهام جدید با موفقیت ایجاد شد');
      res.redirect('/admin/economy/stocks');
    } catch (error) {
      req.flash('error', `خطا در ایجاد سهام: ${error.message}`);
      res.redirect('/admin/economy/stocks/new');
    }
  },

  showStock: async (req, res) => {
    try {
      const stock = await AdminStock.findById(req.params.id);
      if (!stock) {
        req.flash('error', 'سهام مورد نظر یافت نشد');
        return res.redirect('/admin/economy/stocks');
      }
      
      res.render('economy/stocks/edit', {
        title: `ویرایش سهام ${stock.name}`,
        stock
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات سهام: ${error.message}`);
      res.redirect('/admin/economy/stocks');
    }
  },

  updateStock: async (req, res) => {
    try {
      const { name, symbol, description, volatility, active } = req.body;
      
      await AdminStock.findByIdAndUpdate(req.params.id, {
        name,
        symbol,
        description,
        volatility: parseFloat(volatility) || 5.0,
        active: active === 'on'
      });
      
      req.flash('success', 'سهام با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/economy/stocks');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی سهام: ${error.message}`);
      res.redirect(`/admin/economy/stocks/${req.params.id}`);
    }
  },

  updateStockPrice: async (req, res) => {
    try {
      const { price } = req.body;
      const newPrice = parseInt(price);
      
      if (isNaN(newPrice) || newPrice <= 0) {
        req.flash('error', 'قیمت باید عددی مثبت باشد');
        return res.redirect(`/admin/economy/stocks/${req.params.id}`);
      }
      
      const stock = await AdminStock.findById(req.params.id);
      if (!stock) {
        req.flash('error', 'سهام مورد نظر یافت نشد');
        return res.redirect('/admin/economy/stocks');
      }
      
      const oldPrice = stock.currentPrice;
      const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
      
      await AdminStock.findByIdAndUpdate(req.params.id, {
        currentPrice: newPrice,
        priceHistory: [
          ...stock.priceHistory,
          {
            price: newPrice,
            timestamp: new Date(),
            percentChange: percentChange.toFixed(2)
          }
        ]
      });
      
      req.flash('success', `قیمت سهام ${stock.name} به ${newPrice} تغییر کرد (${percentChange.toFixed(2)}%)`);
      res.redirect('/admin/economy/stocks');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی قیمت سهام: ${error.message}`);
      res.redirect(`/admin/economy/stocks/${req.params.id}`);
    }
  },

  deleteStock: async (req, res) => {
    try {
      await Stock.findByIdAndDelete(req.params.id);
      req.flash('success', 'سهام با موفقیت حذف شد');
      res.redirect('/admin/economy/stocks');
    } catch (error) {
      req.flash('error', `خطا در حذف سهام: ${error.message}`);
      res.redirect('/admin/economy/stocks');
    }
  },

  simulateStockMarket: async (req, res) => {
    try {
      const stocks = await Stock.find({ active: true });
      const marketCondition = req.body.marketCondition || 'normal'; // boom, normal, recession
      
      for (const stock of stocks) {
        let volatilityFactor = 1.0;
        
        // تنظیم ضریب نوسان براساس شرایط بازار
        if (marketCondition === 'boom') {
          volatilityFactor = 1.5; // نوسان بیشتر در شرایط رونق
        } else if (marketCondition === 'recession') {
          volatilityFactor = 2.0; // نوسان بیشتر در شرایط رکود
        }
        
        // محاسبه درصد تغییر قیمت
        const baseVolatility = stock.volatility * volatilityFactor;
        let percentChange = (Math.random() * 2 * baseVolatility) - baseVolatility;
        
        // اعمال گرایش بازار
        if (marketCondition === 'boom') {
          percentChange += 2; // گرایش مثبت در شرایط رونق
        } else if (marketCondition === 'recession') {
          percentChange -= 2; // گرایش منفی در شرایط رکود
        }
        
        // محدود کردن تغییرات به ±15%
        percentChange = Math.max(-15, Math.min(15, percentChange));
        
        // محاسبه قیمت جدید
        const oldPrice = stock.currentPrice;
        const newPrice = Math.round(oldPrice * (1 + (percentChange / 100)));
        
        // به‌روزرسانی قیمت
        await Stock.findByIdAndUpdate(stock._id, {
          currentPrice: newPrice,
          priceHistory: [
            ...stock.priceHistory,
            {
              price: newPrice,
              timestamp: new Date(),
              percentChange: percentChange.toFixed(2)
            }
          ]
        });
      }
      
      req.flash('success', `شبیه‌سازی بازار سهام با موفقیت انجام شد (${stocks.length} سهام به‌روزرسانی شد)`);
      res.redirect('/admin/economy/stocks');
    } catch (error) {
      req.flash('error', `خطا در شبیه‌سازی بازار سهام: ${error.message}`);
      res.redirect('/admin/economy/stocks');
    }
  },

  // تنظیمات اقتصادی
  showSettings: async (req, res) => {
    try {
      // دریافت تنظیمات فعلی از دیتابیس
      // این بخش بستگی به ساختار دیتابیس شما دارد
      
      res.render('economy/settings', {
        title: 'تنظیمات اقتصادی',
        settings: {} // تنظیمات پیش‌فرض
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات: ${error.message}`);
      res.redirect('/admin/economy');
    }
  },

  updateSettings: async (req, res) => {
    try {
      // به‌روزرسانی تنظیمات
      
      req.flash('success', 'تنظیمات با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/economy/settings');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات: ${error.message}`);
      res.redirect('/admin/economy/settings');
    }
  },

  // آمار و گزارشات
  showReports: (req, res) => {
    res.render('economy/reports/index', {
      title: 'گزارشات اقتصادی'
    });
  },

  getDailyReport: async (req, res) => {
    try {
      // محاسبه تاریخ شروع (ابتدای امروز)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // آمار تراکنش‌های امروز
      const transactions = await Transaction.find({
        createdAt: { $gte: today }
      });
      
      // محاسبه آمار
      const stats = calculateTransactionStats(transactions);
      
      res.render('economy/reports/daily', {
        title: 'گزارش روزانه',
        date: today.toLocaleDateString('fa-IR'),
        stats,
        transactions
      });
    } catch (error) {
      req.flash('error', `خطا در دریافت گزارش روزانه: ${error.message}`);
      res.redirect('/admin/economy/reports');
    }
  },

  getWeeklyReport: async (req, res) => {
    try {
      // محاسبه تاریخ شروع (7 روز قبل)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      
      // آمار تراکنش‌های هفته اخیر
      const transactions = await Transaction.find({
        createdAt: { $gte: startDate }
      });
      
      // محاسبه آمار
      const stats = calculateTransactionStats(transactions);
      
      res.render('economy/reports/weekly', {
        title: 'گزارش هفتگی',
        startDate: startDate.toLocaleDateString('fa-IR'),
        endDate: new Date().toLocaleDateString('fa-IR'),
        stats,
        transactions
      });
    } catch (error) {
      req.flash('error', `خطا در دریافت گزارش هفتگی: ${error.message}`);
      res.redirect('/admin/economy/reports');
    }
  },

  getMonthlyReport: async (req, res) => {
    try {
      // محاسبه تاریخ شروع (30 روز قبل)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      
      // آمار تراکنش‌های ماه اخیر
      const transactions = await Transaction.find({
        createdAt: { $gte: startDate }
      });
      
      // محاسبه آمار
      const stats = calculateTransactionStats(transactions);
      
      res.render('economy/reports/monthly', {
        title: 'گزارش ماهانه',
        startDate: startDate.toLocaleDateString('fa-IR'),
        endDate: new Date().toLocaleDateString('fa-IR'),
        stats,
        transactions
      });
    } catch (error) {
      req.flash('error', `خطا در دریافت گزارش ماهانه: ${error.message}`);
      res.redirect('/admin/economy/reports');
    }
  },

  getCustomReport: async (req, res) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.render('economy/reports/custom', {
          title: 'گزارش سفارشی',
          stats: null,
          transactions: null
        });
      }
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999); // پایان روز
      
      // آمار تراکنش‌های بازه زمانی
      const transactions = await Transaction.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      // محاسبه آمار
      const stats = calculateTransactionStats(transactions);
      
      res.render('economy/reports/custom', {
        title: 'گزارش سفارشی',
        startDate: startDate.toLocaleDateString('fa-IR'),
        endDate: endDate.toLocaleDateString('fa-IR'),
        stats,
        transactions
      });
    } catch (error) {
      req.flash('error', `خطا در دریافت گزارش سفارشی: ${error.message}`);
      res.redirect('/admin/economy/reports');
    }
  }
};

/**
 * محاسبه آمار تراکنش‌ها
 * @param {Array} transactions آرایه تراکنش‌ها
 * @returns {Object} آمار محاسبه شده
 */
function calculateTransactionStats(transactions) {
  const stats = {
    total: transactions.length,
    totalCoinsAdded: 0,
    totalCoinsDeducted: 0,
    totalCrystalsAdded: 0,
    totalCrystalsDeducted: 0,
    byType: {},
    byCurrency: {
      coin: 0,
      crystal: 0
    }
  };
  
  for (const tx of transactions) {
    // آمار براساس نوع تراکنش
    if (!stats.byType[tx.type]) {
      stats.byType[tx.type] = 0;
    }
    stats.byType[tx.type]++;
    
    // آمار براساس واحد پول
    stats.byCurrency[tx.currency]++;
    
    // محاسبه مجموع افزایش/کاهش
    if (tx.currency === 'coin') {
      if (tx.amount > 0) {
        stats.totalCoinsAdded += tx.amount;
      } else {
        stats.totalCoinsDeducted += Math.abs(tx.amount);
      }
    } else if (tx.currency === 'crystal') {
      if (tx.amount > 0) {
        stats.totalCrystalsAdded += tx.amount;
      } else {
        stats.totalCrystalsDeducted += Math.abs(tx.amount);
      }
    }
  }
  
  return stats;
}