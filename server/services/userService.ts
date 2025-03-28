import { User, IUser } from '../models';

/**
 * یافتن یا ایجاد کاربر جدید در دیتابیس
 * @param discordId آیدی کاربر در دیسکورد
 * @param username نام کاربری
 * @param displayName نام نمایشی (اختیاری)
 * @returns اطلاعات کاربر از دیتابیس
 */
export const findOrCreateUser = async (
  discordId: string,
  username: string,
  displayName?: string
): Promise<IUser> => {
  try {
    // جستجوی کاربر بر اساس آیدی دیسکورد
    let user = await User.findOne({ discordId });

    // اگر کاربر وجود نداشت، یک کاربر جدید ایجاد می‌کنیم
    if (!user) {
      console.log(`Creating new user for Discord ID: ${discordId}`);
      
      // ایجاد کاربر جدید
      user = new User({
        discordId,
        username,
        displayName: displayName || null,
        wallet: 100, // 100 سکه اولیه
        bank: 0,
        crystals: 0,
        economyLevel: 1,
        level: 1,
        experience: 0,
        joinedAt: new Date(),
        lastActivity: new Date()
      });
      
      // ذخیره کاربر در دیتابیس
      await user.save();
      console.log(`New user created for Discord ID: ${discordId}`);
    } else {
      // به‌روزرسانی زمان آخرین فعالیت
      user.lastActivity = new Date();
      
      // به‌روزرسانی نام کاربری و نام نمایشی اگر تغییر کرده باشند
      if (user.username !== username) {
        user.username = username;
      }
      
      // به‌روزرسانی نام نمایشی فقط در صورتی که ارسال شده باشد
      if (displayName && user.displayName !== displayName) {
        user.displayName = displayName;
      }
      
      await user.save();
    }
    
    return user;
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
};

/**
 * افزایش موجودی کیف پول کاربر
 * @param discordId آیدی کاربر در دیسکورد
 * @param amount مقدار افزایش موجودی
 * @returns اطلاعات به‌روز شده کاربر
 */
export const addCoins = async (
  discordId: string,
  amount: number
): Promise<IUser> => {
  try {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    const user = await User.findOne({ discordId });
    if (!user) {
      throw new Error(`User not found with Discord ID: ${discordId}`);
    }
    
    // افزایش موجودی
    user.wallet += amount;
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error in addCoins:', error);
    throw error;
  }
};

/**
 * کاهش موجودی کیف پول کاربر
 * @param discordId آیدی کاربر در دیسکورد
 * @param amount مقدار کاهش موجودی
 * @returns اطلاعات به‌روز شده کاربر
 * @throws خطا در صورت ناکافی بودن موجودی
 */
export const removeCoins = async (
  discordId: string,
  amount: number
): Promise<IUser> => {
  try {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    const user = await User.findOne({ discordId });
    if (!user) {
      throw new Error(`User not found with Discord ID: ${discordId}`);
    }
    
    // بررسی کافی بودن موجودی
    if (user.wallet < amount) {
      throw new Error('Insufficient coins in wallet');
    }
    
    // کاهش موجودی
    user.wallet -= amount;
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error in removeCoins:', error);
    throw error;
  }
};