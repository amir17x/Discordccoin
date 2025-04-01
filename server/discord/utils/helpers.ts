/**
 * این فایل شامل توابع کمکی مختلف برای استفاده در سرتاسر پروژه است
 */
import { User } from '@shared/schema';

/**
 * تبدیل اطلاعات کاربر به شکل استاندارد
 * @param user اطلاعات کاربر
 * @returns کاربر با فرمت استاندارد
 */
export function convertToUser(user: any): User {
  if (!user) return null as any;
  
  return {
    id: user.id || 0,
    discordId: user.discordId || '',
    username: user.username || '',
    displayName: user.displayName || user.username || '',
    wallet: user.wallet || 0,
    bank: user.bank || 0,
    level: user.level || 1,
    experience: user.experience || 0,
    points: user.points || 0,
    economyLevel: user.economyLevel || 1,
    crystals: user.crystals || 0,
    lastActivity: user.lastActivity || null,
    createdAt: user.createdAt || new Date()
  };
}

/**
 * دریافت اموجی آیتم براساس نوع آیتم
 * @param itemType نوع آیتم
 * @returns اموجی مناسب برای آیتم
 */
export function getItemEmoji(itemType: string): string {
  switch(itemType?.toLowerCase()) {
    case 'role':
      return '🎭';
    case 'badge':
      return '🏅';
    case 'booster':
      return '🚀';
    case 'pet':
      return '🐶';
    case 'ticket':
      return '🎟️';
    case 'key':
      return '🔑';
    case 'box':
      return '📦';
    case 'consumable':
      return '🍹';
    case 'collectible':
      return '💎';
    case 'weapon':
      return '⚔️';
    case 'armor':
      return '🛡️';
    case 'tool':
      return '🔨';
    case 'special':
      return '✨';
    default:
      return '❓';
  }
}

/**
 * محاسبه شانس موفقیت در دزدی
 * @param robberLevel سطح دزد
 * @param targetLevel سطح هدف
 * @param targetCoins سکه‌های هدف
 * @returns درصد شانس موفقیت
 */
export function calculateRobChance(robberLevel: number, targetLevel: number, targetCoins: number): number {
  // پایه شانس موفقیت: 50%
  let successChance = 50;
  
  // تعدیل براساس اختلاف سطح
  // هر سطح بالاتر دزد = +5% شانس
  // هر سطح بالاتر هدف = -5% شانس
  const levelDifference = robberLevel - targetLevel;
  successChance += levelDifference * 5;
  
  // تعدیل براساس میزان سکه هدف
  // هر 1000 سکه = -1% شانس (حداکثر -20%)
  const coinPenalty = Math.min(20, Math.floor(targetCoins / 1000));
  successChance -= coinPenalty;
  
  // محدود کردن شانس بین 10% تا 90%
  return Math.max(10, Math.min(90, successChance));
}

/**
 * انجام فرآیند دزدی
 * @param robberLevel سطح دزد
 * @param targetLevel سطح هدف
 * @param targetCoins سکه‌های هدف
 * @returns نتیجه: {success: boolean, amount: number, message: string}
 */
export function doUserRob(robberLevel: number, targetLevel: number, targetCoins: number): {success: boolean, amount: number, message: string} {
  // محاسبه شانس موفقیت
  const successChance = calculateRobChance(robberLevel, targetLevel, targetCoins);
  
  // تصمیم‌گیری براساس شانس
  const roll = Math.random() * 100;
  const success = roll <= successChance;
  
  // اگر موفق بود، محاسبه مقدار دزدی
  let message = '';
  let amount = 0;
  
  if (success) {
    // حداقل 10% و حداکثر 30% پول هدف
    const minAmount = Math.floor(targetCoins * 0.1);
    const maxAmount = Math.floor(targetCoins * 0.3);
    amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    
    // محدود کردن به حداکثر 2000 سکه
    amount = Math.min(2000, amount);
    
    message = `شما با موفقیت ${amount} سکه دزدیدید! (شانس: ${successChance}%)`;
  } else {
    message = `دزدی شما ناموفق بود. (شانس: ${successChance}%)`;
  }
  
  return { success, amount, message };
}

/**
 * فرمت کردن زمان نسبی (مثلاً "3 دقیقه پیش")
 * @param date تاریخ مورد نظر
 * @returns زمان نسبی به فارسی
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const inputDate = new Date(date);
  const diff = now.getTime() - inputDate.getTime();
  
  // تبدیل به ثانیه
  const seconds = Math.floor(diff / 1000);
  
  // کمتر از یک دقیقه
  if (seconds < 60) {
    return `${seconds} ثانیه پیش`;
  }
  
  // کمتر از یک ساعت
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} دقیقه پیش`;
  }
  
  // کمتر از یک روز
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ساعت پیش`;
  }
  
  // کمتر از یک هفته
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} روز پیش`;
  }
  
  // کمتر از یک ماه
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} هفته پیش`;
  }
  
  // کمتر از یک سال
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ماه پیش`;
  }
  
  // بیشتر از یک سال
  const years = Math.floor(days / 365);
  return `${years} سال پیش`;
}