/**
 * رابط مدیریت بازی‌های دوئل برای استفاده در پنل ادمین
 * این فایل امکان کنترل و مدیریت بازی‌های دوئل را از طریق API فراهم می‌کند
 */

import { client } from '../client';
import { activeGames, createDuelGameDirectly, DuelGame } from './duel';
import { TextChannel } from 'discord.js';
import { matchmaking } from './matchmaking';

/**
 * دریافت لیست تمام بازی‌های فعال دوئل
 * @returns لیست بازی‌های فعال
 */
export function getAllActiveDuelGames(): Array<{id: string, game: DuelGame, timestamp: number}> {
  const games: Array<{id: string, game: DuelGame, timestamp: number}> = [];
  
  activeGames.forEach((game, id) => {
    games.push({
      id,
      game,
      timestamp: game.lastAction
    });
  });
  
  // مرتب‌سازی بر اساس آخرین فعالیت (جدیدترین‌ها اول)
  return games.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * دریافت اطلاعات یک بازی دوئل با شناسه
 * @param gameId شناسه بازی
 * @returns اطلاعات بازی یا null اگر بازی وجود نداشته باشد
 */
export function getDuelGameById(gameId: string): DuelGame | null {
  return activeGames.get(gameId) || null;
}

/**
 * ایجاد یک بازی دوئل جدید بین دو کاربر
 * @param player1Id شناسه کاربر اول
 * @param player2Id شناسه کاربر دوم
 * @param channelId شناسه کانال (اختیاری - اگر نباشد، کانال پیش‌فرض استفاده می‌شود)
 * @returns شناسه بازی ایجاد شده یا خطا
 */
export async function createDuelGame(player1Id: string, player2Id: string, channelId?: string): Promise<{success: boolean, gameId?: string, error?: string}> {
  try {
    // اگر کانال مشخص نشده، از کانال پیش‌فرض استفاده می‌کنیم
    let targetChannelId = channelId;
    
    if (!targetChannelId) {
      // کانال پیش‌فرض - می‌توانید این را تغییر دهید
      const defaultChannel = client.channels.cache.find(channel => 
        channel.type === 0 && (channel as TextChannel).name.includes('general')
      ) as TextChannel;
      
      if (defaultChannel) {
        targetChannelId = defaultChannel.id;
      } else {
        // اگر کانال پیش‌فرض پیدا نشد، اولین کانال متنی موجود را انتخاب می‌کنیم
        const firstTextChannel = client.channels.cache.find(channel => 
          channel.type === 0
        ) as TextChannel;
        
        if (firstTextChannel) {
          targetChannelId = firstTextChannel.id;
        } else {
          // هیچ کانال متنی پیدا نشد
          return { 
            success: false, 
            error: 'کانال متنی یافت نشد. لطفاً یک کانال مشخص کنید.' 
          };
        }
      }
    }
    
    // ایجاد بازی دوئل
    const gameId = await createDuelGameDirectly(player1Id, player2Id, targetChannelId);
    
    if (gameId) {
      return {
        success: true,
        gameId
      };
    } else {
      return {
        success: false,
        error: 'خطا در ایجاد بازی دوئل. ممکن است موجودی کاربران کافی نباشد یا کاربران در دیتابیس موجود نباشند.'
      };
    }
  } catch (error) {
    console.error('Error in createDuelGame interface:', error);
    return {
      success: false,
      error: `خطای داخلی: ${error.message || 'خطای ناشناخته'}`
    };
  }
}

/**
 * حذف یک بازی دوئل
 * @param gameId شناسه بازی
 * @param refundCoins آیا سکه‌ها به کاربران برگردانده شود؟
 * @returns نتیجه عملیات
 */
export async function cancelDuelGame(gameId: string, refundCoins: boolean = true): Promise<{success: boolean, error?: string}> {
  try {
    const game = activeGames.get(gameId);
    
    if (!game) {
      return {
        success: false,
        error: 'بازی با این شناسه یافت نشد.'
      };
    }
    
    // اطلاع به کاربران در کانال
    try {
      const channel = await client.channels.fetch(game.channel) as TextChannel;
      if (channel) {
        await channel.send({
          content: `⚠️ بازی دوئل بین <@${game.player1}> و <@${game.player2}> توسط ادمین لغو شد.`
        });
      }
    } catch (error) {
      console.error('Error sending cancellation message:', error);
      // ادامه می‌دهیم حتی اگر پیام ارسال نشد
    }
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(gameId);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in cancelDuelGame interface:', error);
    return {
      success: false,
      error: `خطای داخلی: ${error.message || 'خطای ناشناخته'}`
    };
  }
}

/**
 * بررسی کاربران در صف انتظار برای بازی دوئل
 * @returns لیست کاربران در صف
 */
export function getDuelQueueInfo(): {count: number} {
  return {
    count: matchmaking.getQueueLength('duel')
  };
}

/**
 * پاکسازی بازی‌های قدیمی و غیرفعال
 * @returns تعداد بازی‌های پاکسازی شده
 */
export function cleanupInactiveDuelGames(): {count: number} {
  const before = activeGames.size;
  
  const currentTime = Date.now();
  const timeLimit = 30 * 60 * 1000; // 30 دقیقه
  
  activeGames.forEach((game, gameId) => {
    if (currentTime - game.lastAction > timeLimit) {
      activeGames.delete(gameId);
    }
  });
  
  const after = activeGames.size;
  
  return {
    count: before - after
  };
}