/**
 * سرویس مدیریت کاربران
 * 
 * این ماژول شامل توابع مورد نیاز برای مدیریت کاربران است.
 */

import mongoose from 'mongoose';
import { createObjectCsvStringifier } from 'csv-writer';
import { Log } from '../models/log.js';
import { Transaction } from '../models/transaction.js';

// مدل کاربر از سرور اصلی
// در پروژه واقعی، این مدل در سرور اصلی برنامه تعریف شده و اینجا import می‌شود
const User = mongoose.models.User || mongoose.model('User');

/**
 * دریافت لیست کاربران با امکان فیلتر و صفحه‌بندی
 * @param {Object} params پارامترهای جستجو
 * @returns {Promise<Object>} لیست کاربران و اطلاعات صفحه‌بندی
 */
export async function getAllUsers(params) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filter = {}
    } = params;
    
    // ساخت شرایط جستجو
    const query = {};
    
    // جستجو در نام کاربری یا اسم نمایشی
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { discordTag: { $regex: search, $options: 'i' } }
      ];
    }
    
    // اعمال فیلترها
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    
    if (filter.isBanned !== undefined) {
      query.isBanned = filter.isBanned;
    }
    
    if (filter.minCoins !== undefined) {
      query.coins = { ...query.coins, $gte: filter.minCoins };
    }
    
    if (filter.maxCoins !== undefined) {
      query.coins = { ...query.coins, $lte: filter.maxCoins };
    }
    
    if (filter.minLevel !== undefined) {
      query.level = { ...query.level, $gte: filter.minLevel };
    }
    
    if (filter.maxLevel !== undefined) {
      query.level = { ...query.level, $lte: filter.maxLevel };
    }
    
    // محاسبه تعداد کل رکوردها برای صفحه‌بندی
    const totalUsers = await User.countDocuments(query);
    
    // محاسبه تعداد صفحات
    const totalPages = Math.ceil(totalUsers / limit);
    
    // ترتیب بندی
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // دریافت کاربران
    const users = await User.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      users,
      pagination: {
        page,
        limit,
        totalPages,
        totalUsers
      }
    };
  } catch (error) {
    console.error('خطا در دریافت لیست کاربران:', error);
    throw error;
  }
}

/**
 * دریافت اطلاعات یک کاربر با شناسه
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Object>} اطلاعات کاربر
 */
export async function getUserById(userId) {
  try {
    return await User.findById(userId);
  } catch (error) {
    console.error(`خطا در دریافت اطلاعات کاربر با شناسه ${userId}:`, error);
    throw error;
  }
}

/**
 * به‌روزرسانی اطلاعات کاربر
 * @param {string} userId شناسه کاربر
 * @param {Object} userData اطلاعات جدید کاربر
 * @returns {Promise<Object>} کاربر به‌روزرسانی شده
 */
export async function updateUser(userId, userData) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد');
    }
    
    // به‌روزرسانی فیلدهای مجاز
    if (userData.displayName !== undefined) {
      user.displayName = userData.displayName;
    }
    
    if (userData.isActive !== undefined) {
      user.isActive = userData.isActive;
    }
    
    // ذخیره تغییرات
    await user.save();
    
    // ثبت لاگ
    await Log.create({
      level: 'info',
      category: 'user',
      message: `ویرایش اطلاعات کاربر ${user.username}`,
      userId: user.userId,
      details: { updatedFields: Object.keys(userData) }
    });
    
    return user;
  } catch (error) {
    console.error(`خطا در به‌روزرسانی اطلاعات کاربر با شناسه ${userId}:`, error);
    throw error;
  }
}

/**
 * افزودن سکه به کاربر
 * @param {string} userId شناسه کاربر
 * @param {number} amount مقدار سکه
 * @param {string} description توضیحات تراکنش
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function addUserCoins(userId, amount, description) {
  try {
    if (!amount || amount <= 0) {
      throw new Error('مقدار سکه باید عددی بزرگتر از صفر باشد');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد');
    }
    
    // افزودن سکه به کاربر
    user.coins += amount;
    
    // ذخیره تغییرات
    await user.save();
    
    // ثبت تراکنش
    await Transaction.create({
      userId: user.userId,
      type: 'admin_add',
      amount,
      balance: user.coins,
      description: description || 'افزودن سکه توسط ادمین',
      details: {
        adminAction: true
      }
    });
    
    // ثبت لاگ
    await Log.create({
      level: 'info',
      category: 'economy',
      message: `افزودن ${amount} سکه به کاربر ${user.username}`,
      userId: user.userId,
      details: { amount, newBalance: user.coins, description }
    });
    
    return {
      success: true,
      message: `${amount} سکه با موفقیت به کاربر ${user.username} اضافه شد`,
      newBalance: user.coins
    };
  } catch (error) {
    console.error(`خطا در افزودن سکه به کاربر با شناسه ${userId}:`, error);
    throw error;
  }
}

/**
 * کم کردن سکه از کاربر
 * @param {string} userId شناسه کاربر
 * @param {number} amount مقدار سکه
 * @param {string} description توضیحات تراکنش
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function removeUserCoins(userId, amount, description) {
  try {
    if (!amount || amount <= 0) {
      throw new Error('مقدار سکه باید عددی بزرگتر از صفر باشد');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد');
    }
    
    // بررسی موجودی کافی
    if (user.coins < amount) {
      throw new Error('موجودی کاربر کافی نیست');
    }
    
    // کم کردن سکه از کاربر
    user.coins -= amount;
    
    // ذخیره تغییرات
    await user.save();
    
    // ثبت تراکنش
    await Transaction.create({
      userId: user.userId,
      type: 'admin_remove',
      amount: -amount,
      balance: user.coins,
      description: description || 'کم کردن سکه توسط ادمین',
      details: {
        adminAction: true
      }
    });
    
    // ثبت لاگ
    await Log.create({
      level: 'info',
      category: 'economy',
      message: `کم کردن ${amount} سکه از کاربر ${user.username}`,
      userId: user.userId,
      details: { amount, newBalance: user.coins, description }
    });
    
    return {
      success: true,
      message: `${amount} سکه با موفقیت از کاربر ${user.username} کم شد`,
      newBalance: user.coins
    };
  } catch (error) {
    console.error(`خطا در کم کردن سکه از کاربر با شناسه ${userId}:`, error);
    throw error;
  }
}

/**
 * افزودن آیتم به کاربر
 * @param {string} userId شناسه کاربر
 * @param {string} itemId شناسه آیتم
 * @param {number} quantity تعداد
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function addUserItem(userId, itemId, quantity) {
  try {
    if (!quantity || quantity <= 0) {
      throw new Error('تعداد آیتم باید عددی بزرگتر از صفر باشد');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد');
    }
    
    const Item = mongoose.models.Item || mongoose.model('Item');
    const item = await Item.findById(itemId);
    
    if (!item) {
      throw new Error('آیتم مورد نظر یافت نشد');
    }
    
    // بررسی وجود کوله‌پشتی کاربر
    if (!user.inventory) {
      user.inventory = [];
    }
    
    // بررسی وجود آیتم در کوله‌پشتی
    const existingItem = user.inventory.find(invItem => invItem.itemId.toString() === itemId);
    
    if (existingItem) {
      // به‌روزرسانی تعداد آیتم موجود
      existingItem.quantity += quantity;
    } else {
      // افزودن آیتم جدید به کوله‌پشتی
      user.inventory.push({
        itemId,
        quantity,
        purchasedAt: new Date()
      });
    }
    
    // ذخیره تغییرات
    await user.save();
    
    // ثبت لاگ
    await Log.create({
      level: 'info',
      category: 'item',
      message: `افزودن ${quantity} عدد آیتم ${item.name} به کاربر ${user.username}`,
      userId: user.userId,
      details: { itemId, itemName: item.name, quantity }
    });
    
    return {
      success: true,
      message: `${quantity} عدد ${item.name} با موفقیت به کاربر ${user.username} اضافه شد`
    };
  } catch (error) {
    console.error(`خطا در افزودن آیتم به کاربر با شناسه ${userId}:`, error);
    throw error;
  }
}

/**
 * مسدود کردن کاربر
 * @param {string} userId شناسه کاربر
 * @param {string} reason دلیل مسدودیت
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function banUser(userId, reason) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد');
    }
    
    // مسدود کردن کاربر
    user.isBanned = true;
    user.banReason = reason || 'نامشخص';
    user.bannedAt = new Date();
    
    // ذخیره تغییرات
    await user.save();
    
    // ثبت لاگ
    await Log.create({
      level: 'warning',
      category: 'user',
      message: `مسدود کردن کاربر ${user.username}`,
      userId: user.userId,
      details: { reason }
    });
    
    return {
      success: true,
      message: `کاربر ${user.username} با موفقیت مسدود شد`
    };
  } catch (error) {
    console.error(`خطا در مسدود کردن کاربر با شناسه ${userId}:`, error);
    throw error;
  }
}

/**
 * رفع مسدودیت کاربر
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function unbanUser(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد');
    }
    
    // رفع مسدودیت کاربر
    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;
    
    // ذخیره تغییرات
    await user.save();
    
    // ثبت لاگ
    await Log.create({
      level: 'info',
      category: 'user',
      message: `رفع مسدودیت کاربر ${user.username}`,
      userId: user.userId
    });
    
    return {
      success: true,
      message: `مسدودیت کاربر ${user.username} با موفقیت رفع شد`
    };
  } catch (error) {
    console.error(`خطا در رفع مسدودیت کاربر با شناسه ${userId}:`, error);
    throw error;
  }
}

/**
 * ریست کردن اطلاعات کاربر
 * @param {string} userId شناسه کاربر
 * @param {Object} options گزینه‌های ریست
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function resetUserData(userId, options) {
  try {
    const {
      resetCoins = false,
      resetCrystals = false,
      resetItems = false,
      resetLevel = false,
      resetBank = false
    } = options;
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد');
    }
    
    const resetFields = [];
    
    // ریست سکه‌ها
    if (resetCoins) {
      user.coins = 0;
      resetFields.push('سکه‌ها');
    }
    
    // ریست کریستال‌ها
    if (resetCrystals) {
      user.crystals = 0;
      resetFields.push('کریستال‌ها');
    }
    
    // ریست آیتم‌ها
    if (resetItems) {
      user.inventory = [];
      resetFields.push('آیتم‌ها');
    }
    
    // ریست سطح
    if (resetLevel) {
      user.level = 1;
      user.xp = 0;
      resetFields.push('سطح و تجربه');
    }
    
    // ریست اطلاعات بانکی
    if (resetBank) {
      user.bankBalance = 0;
      user.loanAmount = 0;
      user.loanDueDate = null;
      resetFields.push('اطلاعات بانکی');
    }
    
    // ذخیره تغییرات
    await user.save();
    
    // ثبت لاگ
    await Log.create({
      level: 'warning',
      category: 'user',
      message: `ریست کردن اطلاعات کاربر ${user.username}`,
      userId: user.userId,
      details: { resetFields }
    });
    
    return {
      success: true,
      message: `اطلاعات کاربر ${user.username} با موفقیت ریست شد (${resetFields.join(', ')})`
    };
  } catch (error) {
    console.error(`خطا در ریست کردن اطلاعات کاربر با شناسه ${userId}:`, error);
    throw error;
  }
}

/**
 * خروجی CSV از لیست کاربران
 * @param {string} search عبارت جستجو
 * @param {Object} filter فیلترها
 * @param {Object} sort ترتیب بندی
 * @returns {Promise<string>} محتوای CSV
 */
export async function exportUsersToCsv(search, filter, sort) {
  try {
    // ساخت شرایط جستجو
    const query = {};
    
    // جستجو در نام کاربری یا اسم نمایشی
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { discordTag: { $regex: search, $options: 'i' } }
      ];
    }
    
    // اعمال فیلترها
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    
    if (filter.isBanned !== undefined) {
      query.isBanned = filter.isBanned;
    }
    
    // ترتیب بندی
    const sortOption = {};
    sortOption[sort.field || 'createdAt'] = sort.order === 'asc' ? 1 : -1;
    
    // دریافت کاربران
    const users = await User.find(query).sort(sortOption);
    
    // تعریف ستون‌های CSV
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'username', title: 'نام کاربری' },
        { id: 'displayName', title: 'نام نمایشی' },
        { id: 'discordTag', title: 'تگ دیسکورد' },
        { id: 'coins', title: 'سکه' },
        { id: 'level', title: 'سطح' },
        { id: 'xp', title: 'تجربه' },
        { id: 'bankBalance', title: 'موجودی بانک' },
        { id: 'isActive', title: 'فعال' },
        { id: 'isBanned', title: 'مسدود' },
        { id: 'createdAt', title: 'تاریخ ثبت نام' },
        { id: 'lastLogin', title: 'آخرین ورود' }
      ]
    });
    
    // تبدیل داده‌ها به فرمت مناسب
    const csvData = users.map(user => ({
      username: user.username,
      displayName: user.displayName || '-',
      discordTag: user.discordTag || '-',
      coins: user.coins || 0,
      level: user.level || 1,
      xp: user.xp || 0,
      bankBalance: user.bankBalance || 0,
      isActive: user.isActive ? 'بله' : 'خیر',
      isBanned: user.isBanned ? 'بله' : 'خیر',
      createdAt: user.createdAt ? user.createdAt.toLocaleDateString('fa-IR') : '-',
      lastLogin: user.lastLogin ? user.lastLogin.toLocaleDateString('fa-IR') : '-'
    }));
    
    // ایجاد CSV
    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);
  } catch (error) {
    console.error('خطا در خروجی CSV از لیست کاربران:', error);
    throw error;
  }
}