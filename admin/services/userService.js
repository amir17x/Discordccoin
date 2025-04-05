/**
 * سرویس مدیریت کاربران
 */

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { getDiscordBot } from '../../server/discord/bot.js';

/**
 * دریافت آمار کلی کاربران
 * @returns {Object} آمار کاربران
 */
export async function getUserStats() {
  try {
    // در حالت واقعی باید از دیتابیس خوانده شود
    return {
      totalUsers: 1250,
      activeUsers: 420,
      newUsersToday: 15,
      newUsersThisWeek: 87,
      bannedUsers: 23,
      verifiedUsers: 983,
      premiumUsers: 47,
      growthRate: 5.2 // درصد رشد در ماه اخیر
    };
  } catch (error) {
    console.error('خطا در دریافت آمار کاربران:', error);
    return {};
  }
}

/**
 * دریافت لیست کاربران با فیلتر و صفحه‌بندی
 * @param {Object} options گزینه‌های فیلتر و صفحه‌بندی
 * @returns {Object} لیست کاربران و اطلاعات صفحه‌بندی
 */
export async function getAllUsers(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filter = {}
    } = options;
    
    // در حالت واقعی باید از دیتابیس خوانده شود
    // اینجا داده‌های نمونه ارائه می‌شود
    
    const sampleUsers = [];
    
    // تولید داده‌های نمونه
    for (let i = 1; i <= 100; i++) {
      sampleUsers.push({
        id: `user_${i}`,
        username: `user${i}`,
        displayName: `کاربر ${i}`,
        coins: Math.floor(Math.random() * 10000),
        crystals: Math.floor(Math.random() * 100),
        level: Math.floor(Math.random() * 50) + 1,
        xp: Math.floor(Math.random() * 1000),
        isActive: Math.random() > 0.2,
        isBanned: Math.random() > 0.9,
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // اعمال جستجو
    let filteredUsers = sampleUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = sampleUsers.filter(user => 
        user.username.toLowerCase().includes(searchLower) || 
        user.displayName.toLowerCase().includes(searchLower)
      );
    }
    
    // اعمال فیلتر
    if (filter.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === filter.isActive);
    }
    
    if (filter.isBanned !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isBanned === filter.isBanned);
    }
    
    if (filter.minCoins !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.coins >= filter.minCoins);
    }
    
    if (filter.maxCoins !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.coins <= filter.maxCoins);
    }
    
    if (filter.minLevel !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.level >= filter.minLevel);
    }
    
    if (filter.maxLevel !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.level <= filter.maxLevel);
    }
    
    // مرتب‌سازی
    filteredUsers.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    // صفحه‌بندی
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        totalUsers: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    };
  } catch (error) {
    console.error('خطا در دریافت لیست کاربران:', error);
    return { users: [], pagination: { page: 1, limit: 20, totalUsers: 0, totalPages: 0 } };
  }
}

/**
 * دریافت اطلاعات یک کاربر با شناسه
 * @param {string} userId شناسه کاربر
 * @returns {Object|null} اطلاعات کاربر یا null
 */
export async function getUserById(userId) {
  try {
    // در حالت واقعی باید از دیتابیس خوانده شود
    if (!userId) return null;
    
    // جستجوی اطلاعات کاربر از دیسکورد
    const bot = getDiscordBot();
    let discordUser = null;
    
    if (bot) {
      try {
        discordUser = await bot.users.fetch(userId);
      } catch (discordError) {
        console.warn(`کاربر دیسکورد با شناسه ${userId} یافت نشد:`, discordError.message);
      }
    }
    
    // در اینجا به صورت موقت یک نمونه کاربر برمی‌گردانیم
    return {
      id: userId,
      username: discordUser?.username || `user_${userId.substring(0, 5)}`,
      displayName: discordUser?.displayName || `کاربر ${userId.substring(0, 5)}`,
      avatar: discordUser?.displayAvatarURL() || null,
      coins: Math.floor(Math.random() * 10000),
      crystals: Math.floor(Math.random() * 100),
      level: Math.floor(Math.random() * 50) + 1,
      xp: Math.floor(Math.random() * 1000),
      bankBalance: Math.floor(Math.random() * 5000),
      bankLevel: Math.floor(Math.random() * 5) + 1,
      items: Array.from({ length: Math.floor(Math.random() * 10) }, (_, i) => ({
        id: `item_${i}`,
        name: `آیتم ${i}`,
        quantity: Math.floor(Math.random() * 5) + 1
      })),
      stats: {
        gamesPlayed: Math.floor(Math.random() * 100),
        gamesWon: Math.floor(Math.random() * 50),
        robberiesAttempted: Math.floor(Math.random() * 30),
        robberiesSuccessful: Math.floor(Math.random() * 15)
      },
      isActive: true,
      isBanned: false,
      banReason: '',
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error(`خطا در دریافت اطلاعات کاربر ${userId}:`, error);
    return null;
  }
}

/**
 * دریافت کاربر با نام کاربری
 * @param {string} username نام کاربری
 * @returns {Object|null} اطلاعات کاربر یا null
 */
export async function getUserByUsername(username) {
  try {
    // در حالت واقعی باید از دیتابیس خوانده شود
    if (!username) return null;
    
    // در اینجا به صورت موقت یک کاربر ادمین برمی‌گردانیم
    if (username === 'admin') {
      return {
        id: 'admin_id',
        username: 'admin',
        displayName: 'مدیر سیستم',
        password: '$2a$10$yCzWp8qwNIBgJ5Fs3qMz6eXrwRVyWb/jPprX9dQh3OM6fd2rzm8Ki', // 'admin123'
        role: 'admin',
        isAdmin: true,
        avatar: null,
        permissions: {
          users: true,
          economy: true,
          games: true,
          ai: true,
          events: true,
          shop: true,
          logs: true,
          settings: true
        },
        lastActive: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`خطا در دریافت کاربر با نام کاربری ${username}:`, error);
    return null;
  }
}

/**
 * به‌روزرسانی اطلاعات کاربر
 * @param {string} userId شناسه کاربر
 * @param {Object} userData اطلاعات جدید کاربر
 * @returns {Object|null} کاربر به‌روزرسانی شده یا null
 */
export async function updateUser(userId, userData) {
  try {
    // در حالت واقعی باید در دیتابیس به‌روزرسانی شود
    if (!userId) return null;
    
    const user = await getUserById(userId);
    if (!user) return null;
    
    // به‌روزرسانی فیلدهای مجاز
    const updatedUser = { ...user };
    
    // فیلدهای قابل به‌روزرسانی
    const allowedFields = ['displayName', 'isActive', 'isBanned', 'banReason'];
    
    for (const field of allowedFields) {
      if (userData[field] !== undefined) {
        updatedUser[field] = userData[field];
      }
    }
    
    // در اینجا به صورت موقت کاربر به‌روزرسانی شده را برمی‌گردانیم
    return updatedUser;
  } catch (error) {
    console.error(`خطا در به‌روزرسانی کاربر ${userId}:`, error);
    return null;
  }
}

/**
 * مسدود کردن کاربر
 * @param {string} userId شناسه کاربر
 * @param {string} reason دلیل مسدودیت
 * @returns {Object} نتیجه عملیات
 */
export async function banUser(userId, reason = '') {
  try {
    // در حالت واقعی باید در دیتابیس به‌روزرسانی شود
    if (!userId) throw new Error('شناسه کاربر الزامی است');
    
    const user = await getUserById(userId);
    if (!user) throw new Error('کاربر یافت نشد');
    
    // در اینجا به صورت موقت نتیجه عملیات را برمی‌گردانیم
    return {
      success: true,
      user: {
        ...user,
        isBanned: true,
        banReason: reason
      }
    };
  } catch (error) {
    console.error(`خطا در مسدود کردن کاربر ${userId}:`, error);
    throw error;
  }
}

/**
 * رفع مسدودیت کاربر
 * @param {string} userId شناسه کاربر
 * @returns {Object} نتیجه عملیات
 */
export async function unbanUser(userId) {
  try {
    // در حالت واقعی باید در دیتابیس به‌روزرسانی شود
    if (!userId) throw new Error('شناسه کاربر الزامی است');
    
    const user = await getUserById(userId);
    if (!user) throw new Error('کاربر یافت نشد');
    
    // در اینجا به صورت موقت نتیجه عملیات را برمی‌گردانیم
    return {
      success: true,
      user: {
        ...user,
        isBanned: false,
        banReason: ''
      }
    };
  } catch (error) {
    console.error(`خطا در رفع مسدودیت کاربر ${userId}:`, error);
    throw error;
  }
}

/**
 * افزودن سکه به کاربر
 * @param {string} userId شناسه کاربر
 * @param {number} amount مقدار سکه
 * @param {string} description توضیحات
 * @returns {Object} نتیجه عملیات
 */
export async function addUserCoins(userId, amount, description = '') {
  try {
    // در حالت واقعی باید در دیتابیس به‌روزرسانی شود
    if (!userId) throw new Error('شناسه کاربر الزامی است');
    if (!amount || amount <= 0) throw new Error('مقدار سکه باید بیشتر از صفر باشد');
    
    const user = await getUserById(userId);
    if (!user) throw new Error('کاربر یافت نشد');
    
    const newCoins = user.coins + amount;
    
    // در اینجا به صورت موقت نتیجه عملیات را برمی‌گردانیم
    return {
      success: true,
      user: {
        ...user,
        coins: newCoins
      },
      transaction: {
        id: `tx_${Date.now()}`,
        userId,
        type: 'admin_add',
        amount,
        oldBalance: user.coins,
        newBalance: newCoins,
        description: description || 'افزودن سکه توسط ادمین',
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error(`خطا در افزودن سکه به کاربر ${userId}:`, error);
    throw error;
  }
}

/**
 * کم کردن سکه از کاربر
 * @param {string} userId شناسه کاربر
 * @param {number} amount مقدار سکه
 * @param {string} description توضیحات
 * @returns {Object} نتیجه عملیات
 */
export async function removeUserCoins(userId, amount, description = '') {
  try {
    // در حالت واقعی باید در دیتابیس به‌روزرسانی شود
    if (!userId) throw new Error('شناسه کاربر الزامی است');
    if (!amount || amount <= 0) throw new Error('مقدار سکه باید بیشتر از صفر باشد');
    
    const user = await getUserById(userId);
    if (!user) throw new Error('کاربر یافت نشد');
    
    if (user.coins < amount) throw new Error('سکه کاربر کافی نیست');
    
    const newCoins = user.coins - amount;
    
    // در اینجا به صورت موقت نتیجه عملیات را برمی‌گردانیم
    return {
      success: true,
      user: {
        ...user,
        coins: newCoins
      },
      transaction: {
        id: `tx_${Date.now()}`,
        userId,
        type: 'admin_remove',
        amount: -amount,
        oldBalance: user.coins,
        newBalance: newCoins,
        description: description || 'کسر سکه توسط ادمین',
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error(`خطا در کم کردن سکه از کاربر ${userId}:`, error);
    throw error;
  }
}

/**
 * افزودن آیتم به کاربر
 * @param {string} userId شناسه کاربر
 * @param {string|number} itemId شناسه آیتم
 * @param {number} quantity تعداد
 * @returns {Object} نتیجه عملیات
 */
export async function addUserItem(userId, itemId, quantity = 1) {
  try {
    // در حالت واقعی باید در دیتابیس به‌روزرسانی شود
    if (!userId) throw new Error('شناسه کاربر الزامی است');
    if (!itemId) throw new Error('شناسه آیتم الزامی است');
    if (!quantity || quantity <= 0) throw new Error('تعداد باید بیشتر از صفر باشد');
    
    const user = await getUserById(userId);
    if (!user) throw new Error('کاربر یافت نشد');
    
    // در اینجا به صورت موقت نتیجه عملیات را برمی‌گردانیم
    return {
      success: true,
      message: `${quantity} عدد آیتم ${itemId} به کاربر ${user.username} اضافه شد`
    };
  } catch (error) {
    console.error(`خطا در افزودن آیتم به کاربر ${userId}:`, error);
    throw error;
  }
}

/**
 * ریست کردن اطلاعات کاربر
 * @param {string} userId شناسه کاربر
 * @param {Object} options گزینه‌های ریست
 * @returns {Object} نتیجه عملیات
 */
export async function resetUserData(userId, options = {}) {
  try {
    // در حالت واقعی باید در دیتابیس به‌روزرسانی شود
    if (!userId) throw new Error('شناسه کاربر الزامی است');
    
    const user = await getUserById(userId);
    if (!user) throw new Error('کاربر یافت نشد');
    
    // گزینه‌های ریست
    const { resetCoins, resetCrystals, resetItems, resetLevel, resetBank } = options;
    
    const resetOperations = [];
    if (resetCoins) resetOperations.push('سکه‌ها');
    if (resetCrystals) resetOperations.push('کریستال‌ها');
    if (resetItems) resetOperations.push('آیتم‌ها');
    if (resetLevel) resetOperations.push('سطح و XP');
    if (resetBank) resetOperations.push('حساب بانکی');
    
    // در اینجا به صورت موقت نتیجه عملیات را برمی‌گردانیم
    return {
      success: true,
      message: `اطلاعات ${resetOperations.join('، ')} کاربر ${user.username} با موفقیت ریست شد`,
      resetOptions: options
    };
  } catch (error) {
    console.error(`خطا در ریست اطلاعات کاربر ${userId}:`, error);
    throw error;
  }
}

/**
 * خروجی CSV از لیست کاربران
 * @param {string} search عبارت جستجو
 * @param {Object} filter فیلترها
 * @param {Object} sort نوع مرتب‌سازی
 * @returns {string} فایل CSV
 */
export async function exportUsersToCsv(search, filter, sort) {
  try {
    // دریافت لیست کاربران با حداکثر تعداد
    const result = await getAllUsers({
      limit: 1000,
      search,
      filter,
      sortBy: sort?.field || 'createdAt',
      sortOrder: sort?.order || 'desc'
    });
    
    const { users } = result;
    
    if (users.length === 0) {
      throw new Error('هیچ کاربری برای خروجی یافت نشد');
    }
    
    // ساخت هدر CSV
    const headers = [
      'شناسه',
      'نام کاربری',
      'نام نمایشی',
      'سکه',
      'کریستال',
      'سطح',
      'XP',
      'وضعیت',
      'آخرین فعالیت',
      'تاریخ ثبت‌نام'
    ];
    
    // ساخت ردیف‌ها
    const rows = users.map(user => [
      user.id,
      user.username,
      user.displayName,
      user.coins,
      user.crystals,
      user.level,
      user.xp,
      user.isActive ? 'فعال' : 'غیرفعال',
      user.lastActive,
      user.createdAt
    ]);
    
    // ساخت محتوای CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  } catch (error) {
    console.error('خطا در خروجی CSV کاربران:', error);
    throw error;
  }
}

/**
 * دریافت کاربران برتر
 * @param {number} limit تعداد رکورد
 * @returns {Array} لیست کاربران برتر
 */
export async function getTopUsers(limit = 10) {
  try {
    // در حالت واقعی باید از دیتابیس خوانده شود
    const sampleUsers = Array.from({ length: limit }, (_, i) => ({
      id: `user_${i+1}`,
      username: `user${i+1}`,
      displayName: `کاربر ${i+1}`,
      coins: Math.floor(Math.random() * 50000) + 10000,
      crystals: Math.floor(Math.random() * 500) + 50,
      level: Math.floor(Math.random() * 50) + 20
    }));
    
    // مرتب‌سازی بر اساس سکه
    sampleUsers.sort((a, b) => b.coins - a.coins);
    
    return sampleUsers;
  } catch (error) {
    console.error('خطا در دریافت کاربران برتر:', error);
    return [];
  }
}

/**
 * دریافت کاربران اخیر
 * @param {number} limit تعداد رکورد
 * @returns {Array} لیست کاربران اخیر
 */
export async function getRecentUsers(limit = 5) {
  try {
    // در حالت واقعی باید از دیتابیس خوانده شود
    const sampleUsers = Array.from({ length: limit }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      return {
        id: `user_recent_${i+1}`,
        username: `newuser${i+1}`,
        displayName: `کاربر جدید ${i+1}`,
        createdAt: date.toISOString()
      };
    });
    
    return sampleUsers;
  } catch (error) {
    console.error('خطا در دریافت کاربران اخیر:', error);
    return [];
  }
}

/**
 * ایجاد کاربر ادمین جدید
 * @param {Object} adminData اطلاعات ادمین
 * @returns {Object|null} ادمین ایجاد شده یا null
 */
export async function createAdmin(adminData) {
  try {
    const { username, password, displayName, role, permissions } = adminData;
    
    // هش کردن رمز عبور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // در حالت واقعی باید در دیتابیس ذخیره شود
    const newAdmin = {
      id: `admin_${Date.now()}`,
      username,
      password: hashedPassword,
      displayName: displayName || username,
      role: role || 'admin',
      isAdmin: true,
      permissions: permissions || {},
      createdAt: new Date().toISOString()
    };
    
    console.log('ادمین جدید ایجاد شد:', { ...newAdmin, password: '[HIDDEN]' });
    
    return newAdmin;
  } catch (error) {
    console.error('خطا در ایجاد ادمین:', error);
    return null;
  }
}