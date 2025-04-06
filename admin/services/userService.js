/**
 * سرویس مدیریت کاربران
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
    console.log('✅ اتصال به دیتابیس MongoDB در سرویس کاربران برقرار شد');
    return db;
  } catch (error) {
    console.error('❌ خطا در اتصال به دیتابیس MongoDB در سرویس کاربران:', error);
    throw error;
  }
}

/**
 * دریافت لیست کاربران با صفحه‌بندی
 * @param {Object} options گزینه‌های جستجو
 * @returns {Promise<Object>} لیست کاربران و اطلاعات صفحه‌بندی
 */
export async function getUsers(options = {}) {
  const {
    page = 1,
    limit = 10,
    query = '',
    filters = {},
    sort = { field: 'createdAt', direction: -1 }
  } = options;
  
  try {
    await connectToDatabase();
    
    const skip = (page - 1) * limit;
    
    // ساخت شرایط جستجو
    const searchConditions = {};
    
    // اضافه کردن فیلترهای وضعیت
    if (filters.banned !== undefined) {
      searchConditions.banned = filters.banned;
    }
    if (filters.inactive !== undefined) {
      searchConditions.inactive = filters.inactive;
    }
    
    // اضافه کردن شرط جستجوی متنی
    if (query) {
      searchConditions.$or = [
        { name: { $regex: query, $options: 'i' } },
        { discordId: { $regex: query, $options: 'i' } }
      ];
    }
    
    // شمارش تعداد کل کاربران منطبق با شرایط
    const total = await db.collection('users').countDocuments(searchConditions);
    
    // تنظیم مرتب‌سازی
    const sortOption = {};
    sortOption[sort.field] = sort.direction;
    
    // دریافت کاربران
    const users = await db.collection('users')
      .find(searchConditions)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      users,
      total,
      totalPages,
      page,
      limit
    };
  } catch (error) {
    console.error('❌ خطا در دریافت لیست کاربران:', error);
    return {
      users: [],
      total: 0,
      totalPages: 0,
      page,
      limit
    };
  }
}

/**
 * دریافت تمام کاربران بدون صفحه‌بندی (برای خروجی گرفتن)
 * @param {Object} options گزینه‌های جستجو
 * @returns {Promise<Array>} لیست کاربران
 */
export async function getAllUsers(options = {}) {
  const {
    query = '',
    filters = {},
    sort = { field: 'createdAt', direction: -1 }
  } = options;
  
  try {
    await connectToDatabase();
    
    // ساخت شرایط جستجو
    const searchConditions = {};
    
    // اضافه کردن فیلترهای وضعیت
    if (filters.banned !== undefined) {
      searchConditions.banned = filters.banned;
    }
    if (filters.inactive !== undefined) {
      searchConditions.inactive = filters.inactive;
    }
    
    // اضافه کردن شرط جستجوی متنی
    if (query) {
      searchConditions.$or = [
        { name: { $regex: query, $options: 'i' } },
        { discordId: { $regex: query, $options: 'i' } }
      ];
    }
    
    // تنظیم مرتب‌سازی
    const sortOption = {};
    sortOption[sort.field] = sort.direction;
    
    // دریافت تمام کاربران منطبق با شرایط
    const users = await db.collection('users')
      .find(searchConditions)
      .sort(sortOption)
      .toArray();
    
    return users;
  } catch (error) {
    console.error('❌ خطا در دریافت تمام کاربران:', error);
    return [];
  }
}

/**
 * دریافت کاربران اخیر
 * @param {Number} limit تعداد کاربران
 * @returns {Promise<Array>} لیست کاربران اخیر
 */
export async function getRecentUsers(limit = 5) {
  try {
    await connectToDatabase();
    
    const users = await db.collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    return users;
  } catch (error) {
    console.error('❌ خطا در دریافت کاربران اخیر:', error);
    return [];
  }
}

/**
 * دریافت اطلاعات یک کاربر با شناسه
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Object|null>} اطلاعات کاربر
 */
export async function getUserById(userId) {
  try {
    await connectToDatabase();
    
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });
    
    return user;
  } catch (error) {
    console.error(`❌ خطا در دریافت اطلاعات کاربر ${userId}:`, error);
    return null;
  }
}

/**
 * به‌روزرسانی اطلاعات کاربر
 * @param {string} userId شناسه کاربر
 * @param {Object} updateData داده‌های به‌روزرسانی
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function updateUser(userId, updateData) {
  try {
    await connectToDatabase();
    
    // فیلدهای مجاز برای به‌روزرسانی
    const allowedFields = ['name', 'avatar', 'banned', 'inactive', 'notes'];
    
    // داده‌های به‌روزرسانی نهایی
    const finalUpdateData = {};
    
    // فیلتر کردن فیلدهای مجاز
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'banned' || field === 'inactive') {
          // تبدیل مقادیر چک‌باکس به boolean
          finalUpdateData[field] = updateData[field] === 'on' || updateData[field] === true;
        } else {
          finalUpdateData[field] = updateData[field];
        }
      }
    });
    
    // به‌روزرسانی زمان ویرایش
    finalUpdateData.updatedAt = new Date();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: finalUpdateData }
    );
    
    if (result.matchedCount === 0) {
      return {
        success: false,
        message: 'کاربر مورد نظر یافت نشد'
      };
    }
    
    return {
      success: true,
      message: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد'
    };
  } catch (error) {
    console.error(`❌ خطا در به‌روزرسانی اطلاعات کاربر ${userId}:`, error);
    return {
      success: false,
      message: 'خطایی در به‌روزرسانی اطلاعات کاربر رخ داده است'
    };
  }
}

/**
 * حذف کاربر
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function deleteUser(userId) {
  try {
    await connectToDatabase();
    
    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(userId)
    });
    
    if (result.deletedCount === 0) {
      return {
        success: false,
        message: 'کاربر مورد نظر یافت نشد'
      };
    }
    
    return {
      success: true,
      message: 'کاربر با موفقیت حذف شد'
    };
  } catch (error) {
    console.error(`❌ خطا در حذف کاربر ${userId}:`, error);
    return {
      success: false,
      message: 'خطایی در حذف کاربر رخ داده است'
    };
  }
}

/**
 * مسدود کردن کاربر
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function banUser(userId) {
  try {
    await connectToDatabase();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          banned: true,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return {
        success: false,
        message: 'کاربر مورد نظر یافت نشد'
      };
    }
    
    return {
      success: true,
      message: 'کاربر با موفقیت مسدود شد'
    };
  } catch (error) {
    console.error(`❌ خطا در مسدود کردن کاربر ${userId}:`, error);
    return {
      success: false,
      message: 'خطایی در مسدود کردن کاربر رخ داده است'
    };
  }
}

/**
 * رفع مسدودیت کاربر
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Object>} نتیجه عملیات
 */
export async function unbanUser(userId) {
  try {
    await connectToDatabase();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          banned: false,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return {
        success: false,
        message: 'کاربر مورد نظر یافت نشد'
      };
    }
    
    return {
      success: true,
      message: 'مسدودیت کاربر با موفقیت برداشته شد'
    };
  } catch (error) {
    console.error(`❌ خطا در رفع مسدودیت کاربر ${userId}:`, error);
    return {
      success: false,
      message: 'خطایی در رفع مسدودیت کاربر رخ داده است'
    };
  }
}

/**
 * دریافت آمار کاربران
 * @returns {Promise<Object>} آمار کاربران
 */
export async function getUsersStats() {
  try {
    await connectToDatabase();
    
    // تعداد کل کاربران
    const totalUsers = await db.collection('users').countDocuments({});
    
    // تعداد کاربران فعال
    const activeUsers = await db.collection('users').countDocuments({
      banned: { $ne: true },
      inactive: { $ne: true }
    });
    
    // تعداد کاربران مسدود
    const bannedUsers = await db.collection('users').countDocuments({
      banned: true
    });
    
    // تعداد کاربران غیرفعال
    const inactiveUsers = await db.collection('users').countDocuments({
      inactive: true
    });
    
    // تعداد کاربران جدید در هفته جاری
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newUsers = await db.collection('users').countDocuments({
      createdAt: { $gt: oneWeekAgo }
    });
    
    // کاربران آنلاین (فرضی)
    const onlineUsers = Math.floor(activeUsers * 0.1); // فرض می‌کنیم 10% کاربران فعال آنلاین هستند
    
    return {
      total: totalUsers,
      active: activeUsers,
      banned: bannedUsers,
      inactive: inactiveUsers,
      newUsers,
      online: onlineUsers
    };
  } catch (error) {
    console.error('❌ خطا در دریافت آمار کاربران:', error);
    return {
      total: 0,
      active: 0,
      banned: 0,
      inactive: 0,
      newUsers: 0,
      online: 0
    };
  }
}

/**
 * دریافت تعداد کاربران آنلاین
 * @returns {Promise<number>} تعداد کاربران آنلاین
 */
export async function getOnlineUsersCount() {
  try {
    await connectToDatabase();
    
    // زمان آنلاین بودن (در 15 دقیقه گذشته)
    const onlineThreshold = new Date();
    onlineThreshold.setMinutes(onlineThreshold.getMinutes() - 15);
    
    // شمارش کاربران آنلاین
    const onlineUsers = await db.collection('users').countDocuments({
      lastActive: { $gte: onlineThreshold },
      banned: { $ne: true },
      inactive: { $ne: true }
    });
    
    return onlineUsers;
  } catch (error) {
    console.error('❌ خطا در دریافت تعداد کاربران آنلاین:', error);
    return 0;
  }
}

/**
 * دریافت آمار فعالیت کاربر
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Object>} آمار فعالیت کاربر
 */
export async function getUserStats(userId) {
  try {
    await connectToDatabase();
    
    // اطلاعات کاربر
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }
    
    // تعداد تراکنش‌ها
    const transactionsCount = await db.collection('transactions').countDocuments({
      userId: userId
    });
    
    // تعداد بازی‌ها
    const gamesCount = await db.collection('games').countDocuments({
      userId: userId
    });
    
    // تعداد تراکنش‌های روزانه در هفته گذشته
    const dailyActivity = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await db.collection('transactions').countDocuments({
        userId: userId,
        createdAt: {
          $gte: date,
          $lt: nextDate
        }
      });
      
      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    return {
      transactionsCount,
      gamesCount,
      dailyActivity,
      registrationDate: user.createdAt,
      lastActive: user.lastActive || user.updatedAt || user.createdAt
    };
  } catch (error) {
    console.error(`❌ خطا در دریافت آمار فعالیت کاربر ${userId}:`, error);
    return {
      transactionsCount: 0,
      gamesCount: 0,
      dailyActivity: [],
      registrationDate: null,
      lastActive: null
    };
  }
}
