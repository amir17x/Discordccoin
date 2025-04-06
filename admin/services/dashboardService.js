/**
 * سرویس داشبورد
 * 
 * این ماژول شامل توابع مدیریت داشبورد و آمار کلی سیستم است.
 */

import { Server } from '../models/server.js';
import { Log } from '../models/log.js';

/**
 * سرویس داشبورد
 */
export const dashboardService = {
  /**
   * دریافت آمار کلی سیستم
   * @returns {Promise<Object>} آمار کلی
   */
  getSystemStats: async () => {
    try {
      // تعداد سرورهای فعال
      const activeServersCount = await Server.countDocuments({ isActive: true });
      
      // تعداد اعضای تمام سرورها
      const memberCountAggregate = await Server.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$memberCount' } } }
      ]);
      const totalMembers = memberCountAggregate.length > 0 ? memberCountAggregate[0].total : 0;
      
      // تعداد سرورهای پرمیوم
      const premiumServersCount = await Server.countDocuments({ isActive: true, isPremium: true });
      
      // لاگ‌های 24 ساعت اخیر
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentLogs = await Log.countDocuments({ timestamp: { $gte: oneDayAgo } });
      
      // لاگ‌های خطا در 24 ساعت اخیر
      const recentErrors = await Log.countDocuments({
        level: { $in: ['error', 'critical'] },
        timestamp: { $gte: oneDayAgo }
      });
      
      return {
        serversCount: activeServersCount,
        membersCount: totalMembers,
        premiumServersCount,
        logsCount: recentLogs,
        errorsCount: recentErrors,
        serverId: process.env.DISCORD_SERVER_ID || '-',
        botVersion: process.env.BOT_VERSION || '1.0.0',
        botUptime: process.uptime()
      };
    } catch (error) {
      console.error('Error in getSystemStats:', error);
      throw error;
    }
  },
  
  /**
   * دریافت آمار روزانه
   * @param {number} days تعداد روزهای مورد نظر (پیش‌فرض: 7)
   * @returns {Promise<Object>} آمار روزانه
   */
  getDailyStats: async (days = 7) => {
    try {
      const dailyStats = [];
      
      // محاسبه آمار برای هر روز
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // کل دستورات استفاده شده در این روز
        const commandsUsed = await Log.countDocuments({
          category: 'discord',
          timestamp: { $gte: date, $lt: nextDate }
        });
        
        // تعداد خطاها در این روز
        const errors = await Log.countDocuments({
          level: { $in: ['error', 'critical'] },
          timestamp: { $gte: date, $lt: nextDate }
        });
        
        // تعداد تراکنش‌های اقتصادی در این روز
        const economyTransactions = await Log.countDocuments({
          category: 'economy',
          timestamp: { $gte: date, $lt: nextDate }
        });
        
        // تعداد بازی‌های انجام شده در این روز
        const gamesPlayed = await Log.countDocuments({
          category: 'game',
          timestamp: { $gte: date, $lt: nextDate }
        });
        
        dailyStats.push({
          date: date.toISOString().split('T')[0],
          commandsUsed,
          errors,
          economyTransactions,
          gamesPlayed
        });
      }
      
      return {
        dailyStats
      };
    } catch (error) {
      console.error('Error in getDailyStats:', error);
      throw error;
    }
  },
  
  /**
   * دریافت آمار دیسکورد
   * @returns {Promise<Object>} آمار دیسکورد
   */
  getDiscordStats: async () => {
    try {
      // دریافت 5 سرور با بیشترین تعداد اعضا
      const topServers = await Server.find({ isActive: true })
        .sort({ memberCount: -1 })
        .limit(5)
        .select('name memberCount serverId isPremium');
      
      // دریافت 5 سرور با بیشترین تعداد دستورات استفاده شده
      const mostActiveServers = await Server.find({ isActive: true })
        .sort({ 'analytics.totalCommands': -1 })
        .limit(5)
        .select('name analytics.totalCommands serverId');
      
      // دریافت 5 سرور با بیشترین تراکنش اقتصادی
      const mostEconomyActiveServers = await Server.find({ isActive: true })
        .sort({ 'analytics.economyTransactions': -1 })
        .limit(5)
        .select('name analytics.economyTransactions serverId');
      
      // دریافت 5 سرور با بیشترین بازی انجام شده
      const mostGamesPlayedServers = await Server.find({ isActive: true })
        .sort({ 'analytics.gamesPlayed': -1 })
        .limit(5)
        .select('name analytics.gamesPlayed serverId');
      
      return {
        topServers,
        mostActiveServers,
        mostEconomyActiveServers,
        mostGamesPlayedServers,
        total: {
          servers: await Server.countDocuments({ isActive: true }),
          premium: await Server.countDocuments({ isActive: true, isPremium: true }),
          members: (await Server.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: '$memberCount' } } }
          ]))[0]?.total || 0
        }
      };
    } catch (error) {
      console.error('Error in getDiscordStats:', error);
      throw error;
    }
  },
  
  /**
   * دریافت آمار سرور
   * @param {string} serverId شناسه سرور
   * @returns {Promise<Object>} آمار سرور
   */
  getServerStats: async (serverId) => {
    try {
      // دریافت اطلاعات سرور
      const server = await Server.findOne({ serverId });
      
      if (!server) {
        throw new Error(`سرور با شناسه ${serverId} یافت نشد`);
      }
      
      // دریافت 10 دستور پراستفاده در این سرور
      const commandUsage = [];
      for (const [command, count] of Object.entries(server.analytics.commandUsage || {})) {
        commandUsage.push({ command, count });
      }
      
      commandUsage.sort((a, b) => b.count - a.count);
      
      // دریافت 10 لاگ اخیر این سرور
      const recentLogs = await Log.find({ serverId })
        .sort({ timestamp: -1 })
        .limit(10);
      
      return {
        server,
        stats: {
          commandUsage: commandUsage.slice(0, 10),
          totalCommands: server.analytics.totalCommands || 0,
          activeUsers: server.analytics.activeUsers || 0,
          economyTransactions: server.analytics.economyTransactions || 0,
          gamesPlayed: server.analytics.gamesPlayed || 0,
          totalCoins: server.analytics.totalCoins || 0
        },
        recentLogs
      };
    } catch (error) {
      console.error('Error in getServerStats:', error);
      throw error;
    }
  }
};