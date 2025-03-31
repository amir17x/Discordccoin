/**
 * توابع کمکی برای مدیریت کاربران
 */

import { storage } from '../../storage';
import { User } from '../../../shared/schema';

/**
 * دریافت کاربر با استفاده از شناسه دیسکورد
 * @param discordId شناسه دیسکورد کاربر
 * @returns اطلاعات کاربر یا undefined در صورت عدم وجود
 */
export async function getUserByDiscordId(discordId: string): Promise<User | undefined> {
  return storage.getUserByDiscordId(discordId);
}

/**
 * دریافت کاربر با استفاده از شناسه دیسکورد (نام مستعار برای همسان‌سازی با کد دیگر)
 * @param discordId شناسه دیسکورد کاربر
 * @returns اطلاعات کاربر یا undefined در صورت عدم وجود
 */
export async function getUserById(discordId: string): Promise<User | undefined> {
  return getUserByDiscordId(discordId);
}

/**
 * بررسی اینکه آیا کاربر در سیستم ثبت نام کرده است
 * @param discordId شناسه دیسکورد کاربر
 * @returns آیا کاربر ثبت نام کرده است
 */
export async function isUserRegistered(discordId: string): Promise<boolean> {
  const user = await getUserByDiscordId(discordId);
  return !!user;
}

/**
 * بررسی اینکه آیا کاربر ممنوع‌الورود (بن) شده است
 * @param discordId شناسه دیسکورد کاربر
 * @returns آیا کاربر ممنوع‌الورود است
 */
export async function isUserBanned(discordId: string): Promise<boolean> {
  const user = await getUserByDiscordId(discordId);
  return user ? user.banned : false;
}

/**
 * دریافت رتبه کاربر بر اساس میزان دارایی
 * @param discordId شناسه دیسکورد کاربر
 * @returns رتبه کاربر یا -1 در صورت عدم وجود
 */
export async function getUserRank(discordId: string): Promise<number> {
  const user = await getUserByDiscordId(discordId);
  if (!user) return -1;
  
  // در پیاده‌سازی واقعی این تابع باید رتبه کاربر را از دیتابیس استخراج کند
  // این یک پیاده‌سازی ساده است
  const totalWealth = user.wallet + user.bank;
  // دریافت همه کاربران و مرتب‌سازی بر اساس ثروت
  // سپس یافتن جایگاه کاربر موردنظر
  
  // فعلاً یک مقدار تصادفی برمی‌گردانیم
  return Math.floor(Math.random() * 100) + 1;
}

/**
 * به‌روزرسانی تجربه (XP) کاربر
 * @param userId شناسه کاربر 
 * @param xpAmount مقدار تجربه
 * @returns کاربر به‌روزرسانی شده
 */
export async function updateUserXP(
  userId: string,
  xpAmount: number
): Promise<User | undefined> {
  try {
    const user = await getUserById(userId);
    if (!user) return undefined;

    // محاسبه تجربه و سطح جدید
    let { experience, level } = user;
    experience = (experience || 0) + xpAmount;
    
    // محاسبه سطح بر اساس تجربه
    // الگوریتم نمونه: هر سطح نیاز به تجربه‌ای برابر با 100 * سطح فعلی دارد
    const xpForNextLevel = (level || 0) * 100;
    let leveledUp = false;
    
    if (experience >= xpForNextLevel) {
      level = (level || 0) + 1;
      leveledUp = true;
    }
    
    // به‌روزرسانی کاربر
    const updatedUser = await storage.updateUser(parseInt(userId), {
      experience,
      level
    });
    
    // اگر کاربر ارتقا یافت، می‌توانیم پاداش‌های ویژه بدهیم
    if (leveledUp) {
      // مثلاً:
      // اعطای سکه‌های پاداش سطح
      // const levelReward = level * 100;
      // await updateUserBalance(userId, levelReward, 'level_reward', `پاداش ارتقا به سطح ${level}`);
      console.log(`🎉 User ${userId} leveled up to level ${level}!`);
    }
    
    return updatedUser;
  } catch (error) {
    console.error(`Error updating user XP:`, error);
    return undefined;
  }
}