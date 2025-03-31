import { AchievementModel, IAchievement, IUserAchievement, UserAchievementModel } from '../../models/Achievement';
import { createTransaction } from './transactionUtils';
import { updateUserXP } from './userUtils';

/**
 * بررسی یک دستاورد
 * آیا کاربر شرایط کسب دستاورد را دارد؟
 * @param userId شناسه کاربر
 * @param achievementId شناسه دستاورد
 * @param context اطلاعات اضافی مورد نیاز برای بررسی
 * @returns آیا دستاورد قابل کسب است؟
 */
export async function checkAchievementEligibility(
  userId: string,
  achievementId: string,
  context: any = {}
): Promise<boolean> {
  try {
    // دریافت اطلاعات دستاورد
    const achievement = await AchievementModel.findOne({ id: achievementId }).lean();
    if (!achievement) return false;

    // بررسی آیا کاربر قبلاً این دستاورد را کسب کرده است
    const userAchievement = await UserAchievementModel.findOne({
      userId,
      achievementId
    });
    
    // اگر کاربر دستاورد را قبلاً کسب کرده، شرایط را ندارد
    if (userAchievement) return false;

    // در اینجا شرایط مختلف دستاوردها را بررسی می‌کنیم
    // این بخش باید براساس نوع دستاورد پیاده‌سازی شود
    // می‌توان از requirement و context استفاده کرد
    
    // این یک پیاده‌سازی ساده برای نمونه است
    // در واقعیت باید پیچیده‌تر باشد و شرایط را دقیق بررسی کند
    switch (achievement.requirement) {
      case 'login_first_time':
        return true; // اگر کاربر برای اولین بار وارد شده باشد
      
      case 'win_games_10':
        return context.gamesWon >= 10;
      
      case 'friend_count_20':
        return context.friendCount >= 20;
      
      case 'complete_daily_streak_7':
        return context.dailyStreak >= 7;
      
      case 'reached_level_10':
        return context.level >= 10;
      
      case 'deposit_bank_100000':
        return context.bankDeposit >= 100000;
      
      case 'buy_stocks_5':
        return context.stocksPurchased >= 5;
      
      // و دستاوردهای دیگر...
      
      default:
        // برای دستاوردهای پیچیده‌تر می‌توان از کد eval استفاده کرد
        // اما این روش باید با احتیاط استفاده شود
        try {
          if (achievement.requirement.startsWith('eval:')) {
            const code = achievement.requirement.substring(5);
            // اضافه کردن متغیرهای context به محیط اجرا
            const evalContext = { ...context, userId };
            // ایجاد یک تابع با پارامترهای context
            const evalFunction = new Function(...Object.keys(evalContext), `return ${code}`);
            return evalFunction(...Object.values(evalContext));
          }
        } catch (error) {
          console.error(`Error evaluating achievement requirement for ${achievementId}:`, error);
        }
        
        return false;
    }
  } catch (error) {
    console.error(`Error checking achievement eligibility:`, error);
    return false;
  }
}

/**
 * اعطای یک دستاورد به کاربر
 * @param userId شناسه کاربر
 * @param achievementId شناسه دستاورد
 * @returns نتیجه اعطای دستاورد
 */
export async function grantAchievement(
  userId: string,
  achievementId: string
): Promise<{ success: boolean; achievement?: IAchievement; message?: string }> {
  try {
    // دریافت اطلاعات دستاورد
    const achievement = await AchievementModel.findOne({ id: achievementId }).lean();
    if (!achievement) {
      return { success: false, message: 'دستاورد مورد نظر یافت نشد.' };
    }

    // بررسی آیا کاربر قبلاً این دستاورد را کسب کرده است
    const existingUserAchievement = await UserAchievementModel.findOne({
      userId,
      achievementId
    });

    if (existingUserAchievement) {
      return { success: false, message: 'شما قبلاً این دستاورد را کسب کرده‌اید.' };
    }

    // ایجاد رکورد جدید برای دستاورد کاربر
    const userAchievement = new UserAchievementModel({
      userId,
      achievementId,
      earnedAt: new Date(),
      progress: 100, // تکمیل شده
      count: 1 // اولین بار
    });

    await userAchievement.save();

    // اعطای پاداش‌های دستاورد
    await grantAchievementRewards(userId, achievement);

    return { 
      success: true, 
      achievement,
      message: `🎉 تبریک! شما دستاورد "${achievement.title}" را کسب کردید!` 
    };
  } catch (error) {
    console.error(`Error granting achievement:`, error);
    return { success: false, message: 'خطا در اعطای دستاورد. لطفاً دوباره تلاش کنید.' };
  }
}

/**
 * اعطای پاداش‌های یک دستاورد به کاربر
 * @param userId شناسه کاربر
 * @param achievement اطلاعات دستاورد
 */
async function grantAchievementRewards(userId: string, achievement: IAchievement): Promise<void> {
  try {
    const rewards = achievement.reward;
    if (!rewards) return;

    // اعطای سکه
    if (rewards.coins && rewards.coins > 0) {
      await createTransaction({
        userId: userId,
        amount: rewards.coins,
        type: 'achievement_reward',
        description: `پاداش دستاورد: ${achievement.title}`,
        ref: achievement.id
      });
    }

    // اعطای کریستال
    if (rewards.crystals && rewards.crystals > 0) {
      // فرض می‌کنیم تابعی برای اعطای کریستال داریم
      // await addCrystals(userId, rewards.crystals, `پاداش دستاورد: ${achievement.title}`);
    }

    // اعطای تجربه
    if (rewards.xp && rewards.xp > 0) {
      await updateUserXP(userId, rewards.xp);
    }

    // اعطای آیتم‌ها
    if (rewards.items && rewards.items.length > 0) {
      // فرض می‌کنیم تابعی برای اعطای آیتم داریم
      // for (const itemId of rewards.items) {
      //   await addItemToInventory(userId, itemId, 1);
      // }
    }
  } catch (error) {
    console.error(`Error granting achievement rewards:`, error);
  }
}

/**
 * به‌روزرسانی پیشرفت یک دستاورد
 * @param userId شناسه کاربر
 * @param achievementId شناسه دستاورد
 * @param progress میزان پیشرفت (0-100)
 * @returns نتیجه به‌روزرسانی
 */
export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  progress: number
): Promise<{ success: boolean; message?: string }> {
  try {
    // محدود کردن پیشرفت به 0-100
    progress = Math.max(0, Math.min(100, progress));

    // یافتن رکورد پیشرفت دستاورد کاربر
    let userAchievement = await UserAchievementModel.findOne({
      userId,
      achievementId
    });

    // اگر قبلاً وجود نداشت، ایجاد می‌کنیم
    if (!userAchievement) {
      userAchievement = new UserAchievementModel({
        userId,
        achievementId,
        earnedAt: progress >= 100 ? new Date() : null, // اگر کامل شده تاریخ را ثبت می‌کنیم
        progress,
        count: progress >= 100 ? 1 : 0 // اگر کامل شده یک بار شمارش می‌کنیم
      });
    } else {
      // به‌روزرسانی پیشرفت
      userAchievement.progress = progress;
      
      // اگر قبلاً کامل نشده بود و اکنون کامل شده
      if (userAchievement.progress < 100 && progress >= 100) {
        userAchievement.earnedAt = new Date();
        userAchievement.count = 1;
        
        // اعطای پاداش دستاورد
        const achievement = await AchievementModel.findOne({ id: achievementId }).lean();
        if (achievement) {
          await grantAchievementRewards(userId, achievement);
          
          return { 
            success: true, 
            message: `🎉 تبریک! شما دستاورد "${achievement.title}" را با تکمیل پیشرفت کسب کردید!` 
          };
        }
      }
    }

    await userAchievement.save();
    return { success: true };
  } catch (error) {
    console.error(`Error updating achievement progress:`, error);
    return { success: false, message: 'خطا در به‌روزرسانی پیشرفت دستاورد. لطفاً دوباره تلاش کنید.' };
  }
}

/**
 * افزایش شمارنده یک دستاورد
 * @param userId شناسه کاربر
 * @param event نوع رویداد
 * @param context اطلاعات اضافی
 */
export async function incrementAchievementCounter(
  userId: string,
  event: string,
  context: any = {}
): Promise<void> {
  try {
    // یافتن دستاوردهای مرتبط با این رویداد
    // این بخش باید براساس سیستم دستاوردها پیاده‌سازی شود
    // در یک سیستم واقعی، می‌توانیم یک مپینگ بین رویدادها و دستاوردها داشته باشیم
    
    // مثال ساده:
    switch (event) {
      case 'game_won':
        // بررسی دستاورد "برنده شدن در 10 بازی"
        await checkAndUpdateProgress(userId, 'win_games_10', { 
          current: context.totalWins || 1, 
          target: 10 
        });
        break;
      
      case 'friend_added':
        // بررسی دستاورد "افزودن 20 دوست"
        await checkAndUpdateProgress(userId, 'friend_count_20', { 
          current: context.totalFriends || 1, 
          target: 20 
        });
        break;
      
      case 'daily_claimed':
        // بررسی دستاورد "دریافت روزانه برای 7 روز متوالی"
        await checkAndUpdateProgress(userId, 'complete_daily_streak_7', { 
          current: context.streak || 1, 
          target: 7 
        });
        break;
        
      // و سایر رویدادها...
    }
  } catch (error) {
    console.error(`Error incrementing achievement counter:`, error);
  }
}

/**
 * بررسی و به‌روزرسانی پیشرفت یک دستاورد
 * @param userId شناسه کاربر
 * @param achievementId شناسه دستاورد
 * @param counts اطلاعات شمارنده
 */
async function checkAndUpdateProgress(
  userId: string,
  achievementId: string,
  counts: { current: number; target: number }
): Promise<void> {
  try {
    // بررسی آیا کاربر قبلاً این دستاورد را کسب کرده است
    const userAchievement = await UserAchievementModel.findOne({
      userId,
      achievementId,
      progress: 100 // فقط دستاوردهای کامل شده
    });
    
    // اگر قبلاً کسب شده، نیازی به بررسی نیست
    if (userAchievement) return;
    
    // محاسبه درصد پیشرفت
    const progress = Math.min(100, Math.round((counts.current / counts.target) * 100));
    
    // به‌روزرسانی پیشرفت دستاورد
    await updateAchievementProgress(userId, achievementId, progress);
    
    // اگر پیشرفت کامل شد، دستاورد را اعطا می‌کنیم
    if (progress >= 100) {
      await grantAchievement(userId, achievementId);
    }
  } catch (error) {
    console.error(`Error checking and updating achievement progress:`, error);
  }
}

/**
 * افزودن چندین دستاورد پایه به سیستم
 * این تابع فقط یک بار در زمان راه‌اندازی اولیه سیستم باید اجرا شود
 */
export async function seedDefaultAchievements(): Promise<void> {
  try {
    // بررسی آیا دستاوردی وجود دارد
    const count = await AchievementModel.countDocuments();
    if (count > 0) {
      console.log(`${count} دستاورد در سیستم وجود دارد. نیازی به افزودن دستاوردهای پایه نیست.`);
      return;
    }
    
    // دستاوردهای پایه
    const defaultAchievements: Partial<IAchievement>[] = [
      // دستاوردهای اقتصادی
      {
        id: 'economic_first_deposit',
        title: 'اولین پس‌انداز',
        description: 'برای اولین بار در بانک پس‌انداز کنید',
        emoji: '🏦',
        category: 'economic',
        requirement: 'first_deposit',
        reward: { coins: 500, xp: 50 },
        rarityLevel: 1,
        isHidden: false,
        isLegacy: false
      },
      {
        id: 'economic_millionaire',
        title: 'میلیونر',
        description: 'به موجودی بانکی 1,000,000 سکه برسید',
        emoji: '💰',
        category: 'economic',
        requirement: 'bank_balance_1000000',
        reward: { coins: 10000, xp: 500 },
        rarityLevel: 3,
        isHidden: false,
        isLegacy: false
      },
      {
        id: 'economic_stock_master',
        title: 'استاد بازار سهام',
        description: 'از معامله‌های سهام 100,000 سکه سود کنید',
        emoji: '📈',
        category: 'economic',
        requirement: 'stock_profit_100000',
        reward: { coins: 5000, xp: 300 },
        rarityLevel: 3,
        isHidden: false,
        isLegacy: false
      },
      
      // دستاوردهای اجتماعی
      {
        id: 'social_first_friend',
        title: 'اولین دوستی',
        description: 'یک دوست به لیست دوستان خود اضافه کنید',
        emoji: '👋',
        category: 'social',
        requirement: 'first_friend',
        reward: { coins: 300, xp: 30 },
        rarityLevel: 1,
        isHidden: false,
        isLegacy: false
      },
      {
        id: 'social_popular',
        title: 'محبوب',
        description: '20 دوست به لیست دوستان خود اضافه کنید',
        emoji: '🌟',
        category: 'social',
        requirement: 'friend_count_20',
        reward: { coins: 2000, xp: 200 },
        rarityLevel: 2,
        isHidden: false,
        isLegacy: false
      },
      
      // دستاوردهای بازی
      {
        id: 'gaming_first_win',
        title: 'اولین پیروزی',
        description: 'برای اولین بار در یک بازی برنده شوید',
        emoji: '🏆',
        category: 'gaming',
        requirement: 'first_game_win',
        reward: { coins: 300, xp: 30 },
        rarityLevel: 1,
        isHidden: false,
        isLegacy: false
      },
      {
        id: 'gaming_champion',
        title: 'قهرمان بازی‌ها',
        description: 'در 10 بازی مختلف برنده شوید',
        emoji: '👑',
        category: 'gaming',
        requirement: 'win_games_10',
        reward: { coins: 1000, xp: 100 },
        rarityLevel: 2,
        isHidden: false,
        isLegacy: false
      },
      
      // دستاوردهای ویژه
      {
        id: 'special_level_10',
        title: 'تجربه‌اندوز',
        description: 'به سطح 10 برسید',
        emoji: '⭐',
        category: 'special',
        requirement: 'reached_level_10',
        reward: { coins: 1000, crystals: 5, xp: 0 },
        rarityLevel: 2,
        isHidden: false,
        isLegacy: false
      },
      {
        id: 'special_daily_streak',
        title: 'وفادار',
        description: '7 روز متوالی جایزه روزانه دریافت کنید',
        emoji: '📆',
        category: 'special',
        requirement: 'complete_daily_streak_7',
        reward: { coins: 1000, xp: 100 },
        rarityLevel: 2,
        isHidden: false,
        isLegacy: false
      },
      
      // دستاوردهای مخفی
      {
        id: 'secret_big_spender',
        title: 'ولخرج بزرگ',
        description: '100,000 سکه در فروشگاه خرج کنید',
        emoji: '💸',
        category: 'secret',
        requirement: 'spend_shop_100000',
        reward: { coins: 5000, xp: 300 },
        rarityLevel: 3,
        isHidden: true,
        isLegacy: false
      }
    ];
    
    // افزودن دستاوردها به پایگاه داده
    for (const achievement of defaultAchievements) {
      const newAchievement = new AchievementModel({
        ...achievement,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newAchievement.save();
    }
    
    console.log(`${defaultAchievements.length} دستاورد پایه با موفقیت به سیستم اضافه شد.`);
  } catch (error) {
    console.error('Error seeding default achievements:', error);
  }
}