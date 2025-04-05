/**
 * سرویس مدیریت کاربران
 * 
 * این سرویس مسئول مدیریت کاربران دیسکورد و عملیات مرتبط با آن‌ها است.
 */

import { getDiscordClient } from '../utils/discord.js';

// فرض می‌کنیم کاربران ما اینجا ذخیره می‌شوند (در محیط واقعی این داده‌ها از دیتابیس می‌آیند)
let users = [];

/**
 * دریافت کاربر با شناسه مشخص
 * 
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Object|null>} اطلاعات کاربر یا null در صورت عدم وجود
 */
export async function getUserById(userId) {
  try {
    // ابتدا در کش محلی جستجو می‌کنیم
    let user = users.find(u => u.id === userId);
    
    if (user) {
      return user;
    }
    
    // اگر در کش نبود، از دیسکورد می‌گیریم
    const discordClient = getDiscordClient();
    
    if (!discordClient) {
      throw new Error('Discord client not available');
    }
    
    const discordUser = await discordClient.users.fetch(userId).catch(() => null);
    
    if (!discordUser) {
      return null;
    }
    
    // ساخت اطلاعات کاربر
    user = {
      id: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.displayAvatarURL({ dynamic: true }),
      bot: discordUser.bot,
      createdAt: discordUser.createdAt.toISOString(),
      discriminator: discordUser.discriminator || '0',
      wallet: 0, // مقدار پیش‌فرض
      crystals: 0, // مقدار پیش‌فرض
      lastActivity: new Date().toISOString()
    };
    
    // افزودن به کش
    users.push(user);
    
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * دریافت کاربر با نام کاربری
 * 
 * @param {string} username نام کاربری
 * @returns {Promise<Object|null>} اطلاعات کاربر یا null در صورت عدم وجود
 */
export async function getUserByUsername(username) {
  try {
    // ابتدا در کش محلی جستجو می‌کنیم
    const user = users.find(u => u.username === username);
    
    if (user) {
      return user;
    }
    
    // در محیط واقعی باید از دیتابیس جستجو کنیم
    // اما فعلاً null برمی‌گردانیم
    return null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

/**
 * دریافت همه کاربران با اعمال فیلترها
 * 
 * @param {Object} options گزینه‌های جستجو
 * @param {number} options.limit تعداد نتایج
 * @param {number} options.offset ایندکس شروع
 * @param {Object} options.filter فیلترهای جستجو
 * @param {Object} options.sort ترتیب نتایج
 * @returns {Promise<Array>} لیست کاربران
 */
export async function getAllUsers(options = {}) {
  try {
    const {
      limit = 20,
      offset = 0,
      filter = {},
      sort = { username: 1 }
    } = options;
    
    // در محیط واقعی از دیتابیس با فیلترها و سورت می‌گیریم
    // اما فعلاً یک فیلتر ساده پیاده می‌کنیم
    let filteredUsers = [...users];
    
    // اعمال فیلترها
    if (filter.username) {
      filteredUsers = filteredUsers.filter(u => 
        u.username.toLowerCase().includes(filter.username.toLowerCase())
      );
    }
    
    if (filter.bot !== undefined) {
      filteredUsers = filteredUsers.filter(u => u.bot === filter.bot);
    }
    
    // اعمال سورت
    filteredUsers.sort((a, b) => {
      const sortField = Object.keys(sort)[0];
      const sortDirection = sort[sortField];
      
      if (a[sortField] < b[sortField]) return -1 * sortDirection;
      if (a[sortField] > b[sortField]) return 1 * sortDirection;
      return 0;
    });
    
    // اعمال limit و offset
    return filteredUsers.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * تعداد کل کاربران
 * 
 * @returns {Promise<number>} تعداد کاربران
 */
export async function getUsersCount() {
  try {
    // در محیط واقعی از دیتابیس می‌گیریم
    return users.length;
  } catch (error) {
    console.error('Error getting users count:', error);
    return 0;
  }
}

/**
 * تعداد کاربران فعال
 * 
 * @param {number} days تعداد روزهای اخیر
 * @returns {Promise<number>} تعداد کاربران فعال
 */
export async function getActiveUsersCount(days = 7) {
  try {
    const now = new Date();
    const timeThreshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    
    // شمارش کاربرانی که در x روز اخیر فعال بوده‌اند
    return users.filter(user => user.lastActivity > timeThreshold).length;
  } catch (error) {
    console.error('Error getting active users count:', error);
    return 0;
  }
}

/**
 * بروزرسانی اطلاعات کاربر
 * 
 * @param {string} userId شناسه کاربر
 * @param {Object} updateData اطلاعات جدید
 * @returns {Promise<Object|null>} اطلاعات بروزرسانی شده یا null در صورت عدم وجود
 */
export async function updateUser(userId, updateData) {
  try {
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return null;
    }
    
    // بروزرسانی اطلاعات
    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      // اطمینان از عدم تغییر شناسه
      id: users[userIndex].id
    };
    
    return users[userIndex];
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

/**
 * افزودن سکه به کیف پول کاربر
 * 
 * @param {string} userId شناسه کاربر
 * @param {number} amount مقدار سکه
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
export async function addCoinsToUser(userId, amount) {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // بروزرسانی کیف پول
    await updateUser(userId, {
      wallet: (user.wallet || 0) + amount
    });
    
    return true;
  } catch (error) {
    console.error('Error adding coins to user:', error);
    return false;
  }
}

/**
 * افزودن کریستال به کاربر
 * 
 * @param {string} userId شناسه کاربر
 * @param {number} amount مقدار کریستال
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
export async function addCrystalsToUser(userId, amount) {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // بروزرسانی کریستال‌ها
    await updateUser(userId, {
      crystals: (user.crystals || 0) + amount
    });
    
    return true;
  } catch (error) {
    console.error('Error adding crystals to user:', error);
    return false;
  }
}

/**
 * دریافت لیست سرورهای کاربر
 * 
 * @param {string} userId شناسه کاربر
 * @returns {Promise<Array>} لیست سرورها
 */
export async function getUserGuilds(userId) {
  try {
    const discordClient = getDiscordClient();
    
    if (!discordClient) {
      throw new Error('Discord client not available');
    }
    
    // دریافت تمام سرورها
    const guilds = [...discordClient.guilds.cache.values()];
    
    // فیلتر سرورهایی که کاربر در آن‌ها عضو است
    const userGuilds = [];
    
    for (const guild of guilds) {
      try {
        const member = await guild.members.fetch(userId).catch(() => null);
        
        if (member) {
          userGuilds.push({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ dynamic: true }),
            memberCount: guild.memberCount,
            joinedAt: member.joinedAt.toISOString()
          });
        }
      } catch (error) {
        console.error(`Error fetching member from guild ${guild.id}:`, error);
      }
    }
    
    return userGuilds;
  } catch (error) {
    console.error('Error getting user guilds:', error);
    return [];
  }
}

/**
 * مسدود کردن کاربر
 * 
 * @param {string} userId شناسه کاربر
 * @param {string} reason دلیل مسدودیت
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
export async function banUser(userId, reason = '') {
  try {
    // بروزرسانی وضعیت کاربر
    await updateUser(userId, {
      banned: true,
      banReason: reason,
      banDate: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error banning user:', error);
    return false;
  }
}

/**
 * رفع مسدودیت کاربر
 * 
 * @param {string} userId شناسه کاربر
 * @returns {Promise<boolean>} آیا عملیات موفق بود؟
 */
export async function unbanUser(userId) {
  try {
    // بروزرسانی وضعیت کاربر
    await updateUser(userId, {
      banned: false,
      banReason: null,
      banDate: null
    });
    
    return true;
  } catch (error) {
    console.error('Error unbanning user:', error);
    return false;
  }
}