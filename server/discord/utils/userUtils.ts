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
  return user ? user.isBanned : false;
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