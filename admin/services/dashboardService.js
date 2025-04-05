/**
 * سرویس داشبورد پنل ادمین
 * 
 * این سرویس مسئول دریافت داده‌ها و آمار مورد نیاز برای داشبورد است.
 */

import { getDiscordClient } from '../utils/discord.js';
import { 
  getAllUsers,
  getUsersCount,
  getActiveUsersCount
} from './userService.js';
import {
  getAllTransactions,
  getTotalCoins,
  getTotalCrystals,
  getBankBalance
} from './economyService.js';
import {
  getItems,
  getShopItemsCount
} from './shopService.js';
import {
  getLogsCount,
  getSystemLogs,
  getSystemErrors
} from './logService.js';

/**
 * دریافت آمار دیسکورد
 * 
 * @returns {Promise<Object>} آمار دیسکورد
 */
export async function getDiscordStats() {
  try {
    const client = getDiscordClient();
    
    // اگر کلاینت دیسکورد در دسترس نیست، مقادیر پیش‌فرض برگردانده می‌شود
    if (!client) {
      return {
        servers: 0,
        users: 0,
        activeUsers: 0,
        commands: 0
      };
    }
    
    const serversCount = client.guilds.cache.size;
    const usersCount = await getUsersCount();
    const activeUsersCount = await getActiveUsersCount();
    const commandsUsed = await getLogsCount('command');
    
    return {
      servers: serversCount,
      users: usersCount,
      activeUsers: activeUsersCount,
      commands: commandsUsed
    };
  } catch (error) {
    console.error('Error getting Discord stats:', error);
    return {
      servers: 0,
      users: 0,
      activeUsers: 0,
      commands: 0
    };
  }
}

/**
 * دریافت آمار اقتصادی
 * 
 * @returns {Promise<Object>} آمار اقتصادی
 */
export async function getEconomyStats() {
  try {
    const totalCoins = await getTotalCoins();
    const totalCrystals = await getTotalCrystals();
    const bankBalance = await getBankBalance();
    const shopItems = await getShopItemsCount();
    
    return {
      totalCoins,
      totalCrystals,
      bankBalance,
      shopItems
    };
  } catch (error) {
    console.error('Error getting economy stats:', error);
    return {
      totalCoins: 0,
      totalCrystals: 0,
      bankBalance: 0,
      shopItems: 0
    };
  }
}

/**
 * دریافت تراکنش‌های اخیر
 * 
 * @param {number} limit تعداد تراکنش‌ها
 * @returns {Promise<Array>} لیست تراکنش‌ها
 */
export async function getRecentTransactions(limit = 10) {
  try {
    const transactions = await getAllTransactions({ limit, sort: { timestamp: -1 } });
    
    return transactions.map(transaction => ({
      id: transaction.id,
      userId: transaction.userId,
      username: transaction.username,
      type: transaction.type,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      description: transaction.description
    }));
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    return [];
  }
}

/**
 * دریافت کاربران برتر
 * 
 * @param {number} limit تعداد کاربران
 * @returns {Promise<Array>} لیست کاربران
 */
export async function getTopUsers(limit = 5) {
  try {
    const users = await getAllUsers({ limit, sort: { wallet: -1 } });
    
    return users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      username: user.username,
      wallet: user.wallet,
      crystals: user.crystals,
      totalValue: user.wallet + (user.crystals * 1000) // فرض ارزش هر کریستال 1000 سکه
    }));
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
}

/**
 * دریافت فعالیت‌های اخیر
 * 
 * @param {number} limit تعداد فعالیت‌ها
 * @returns {Promise<Array>} لیست فعالیت‌ها
 */
export async function getRecentActivities(limit = 10) {
  try {
    const logs = await getSystemLogs(limit);
    
    return logs.map(log => ({
      id: log.id,
      userId: log.userId,
      username: log.username || 'ناشناس',
      type: log.type,
      timestamp: log.timestamp,
      details: log.details
    }));
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}

/**
 * دریافت هشدارهای سیستم
 * 
 * @param {number} limit تعداد هشدارها
 * @returns {Promise<Array>} لیست هشدارها
 */
export async function getSystemAlerts(limit = 5) {
  try {
    const errors = await getSystemErrors(limit);
    
    return errors.map(error => ({
      id: error.id,
      type: error.type,
      severity: error.severity || 'error',
      message: error.message,
      timestamp: error.timestamp
    }));
  } catch (error) {
    console.error('Error getting system alerts:', error);
    return [];
  }
}