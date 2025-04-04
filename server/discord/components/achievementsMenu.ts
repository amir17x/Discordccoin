import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, EmbedBuilder, Message, StringSelectMenuBuilder, ColorResolvable, MessageFlags } from 'discord.js';
import { AchievementModel, UserAchievementModel, IAchievement, IUserAchievement } from '../../models/Achievement';
import { getUserById } from '../utils/userUtils';
import { formatNumber } from '../utils/formatters';
import { incrementAchievementCounter } from '../utils/achievementUtils';

// مپ رنگ‌های مربوط به سطح کمیابی دستاوردها
const RARITY_COLORS: Record<number, number> = {
  1: 0x7F8C8D, // خاکستری - معمولی
  2: 0x3498DB, // آبی - غیرمعمول
  3: 0x9B59B6, // بنفش - کمیاب
  4: 0xF1C40F, // طلایی - خیلی کمیاب
  5: 0xE74C3C, // قرمز - افسانه‌ای
};

// توضیحات سطح کمیابی
const RARITY_NAMES: Record<number, string> = {
  1: '🔹 معمولی',
  2: '🔷 غیرمعمول',
  3: '🔮 کمیاب',
  4: '✨ خیلی کمیاب',
  5: '🌟 افسانه‌ای',
};

// دسته‌بندی‌های دستاوردها
const CATEGORIES: Record<string, { name: string; emoji: string }> = {
  'economic': { name: '💰 اقتصادی', emoji: '💰' },
  'social': { name: '👥 اجتماعی', emoji: '👥' },
  'gaming': { name: '🎮 بازی', emoji: '🎮' },
  'special': { name: '🏆 ویژه', emoji: '🏆' },
  'event': { name: '🎉 رویداد', emoji: '🎉' },
  'secret': { name: '🔒 مخفی', emoji: '🔒' },
  'legacy': { name: '👑 افتخاری', emoji: '👑' },
};

/**
 * نمایش منوی دستاوردهای کاربر
 * @param interaction تعامل کاربر
 * @param followUp آیا به عنوان پیام دنباله‌دار ارسال شود؟
 */
export async function achievementsMenu(
  interaction: CommandInteraction | ButtonInteraction | Message,
  followUp = false
) {
  try {
    let userId: string;
    let discordId: string;
    
    // تشخیص نوع تعامل و استخراج شناسه کاربر
    if (interaction instanceof Message) {
      userId = interaction.author.id;
      discordId = interaction.author.id;
    } else {
      userId = interaction.user.id;
      discordId = interaction.user.id;
    }

    // دریافت اطلاعات کاربر از دیتابیس
    const user = await getUserById(discordId);
    if (!user) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ خطا در بارگذاری اطلاعات')
        .setDescription('متأسفانه اطلاعات کاربری شما یافت نشد. لطفاً مجدداً تلاش کنید.');
      
      if (interaction instanceof Message) {
        await interaction.reply({ embeds: [errorEmbed] });
      } else if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
      }
      return;
    }

    // دریافت تمام دستاوردهای سیستم
    const allAchievements = await AchievementModel.find({
      // دستاوردهای مخفی را نمایش نمی‌دهیم مگر اینکه کاربر آنها را کسب کرده باشد
      isHidden: false 
    }).sort({ category: 1, rarityLevel: 1 }).lean();

    // دریافت دستاوردهای کاربر
    const userAchievements = await UserAchievementModel.find({
      userId: userId
    }).lean();

    // شمارش تعداد دستاوردهای کسب شده و کل دستاوردها
    const earnedCount = userAchievements.length;
    const totalCount = allAchievements.length;
    const earnedPercentage = Math.round((earnedCount / totalCount) * 100);

    // نقشه‌ای از دستاوردهای کاربر برای دسترسی سریع‌تر
    const userAchievementMap = new Map();
    userAchievements.forEach(ua => {
      userAchievementMap.set(ua.achievementId, ua);
    });

    // ایجاد منوی دسته‌بندی‌ها
    const categoryMenu = new StringSelectMenuBuilder()
      .setCustomId('achievement_category')
      .setPlaceholder('🏆 انتخاب دسته‌بندی دستاوردها')
      .addOptions([
        {
          label: '🌟 همه دستاوردها',
          description: `نمایش تمام دستاوردهای سیستم`,
          value: 'all',
          default: true
        },
        ...Object.entries(CATEGORIES).map(([key, category]) => ({
          label: category.name,
          description: `نمایش دستاوردهای ${category.name}`,
          value: key,
          emoji: category.emoji,
          default: false
        }))
      ]);

    // ساخت امبد اصلی دستاوردها
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`🏆 دستاوردهای ${user.username}`)
      .setDescription(
        `در این بخش می‌توانید دستاوردهای خود را مشاهده کرده و برای کسب آنها تلاش کنید!\n` +
        `هر دستاورد به شما پاداش‌های مختلفی مانند سکه، کریستال و تجربه می‌دهد.`
      )
      .setThumbnail('https://cdn.discordapp.com/emojis/1001359395133456434.webp?size=96&quality=lossless')
      .addFields(
        { name: '🌟 پیشرفت کلی', value: `\`${earnedCount}/${totalCount}\` (${earnedPercentage}%)`, inline: true },
        { name: '💰 جمع پاداش‌ها', value: calculateTotalRewards(userAchievements, allAchievements), inline: true }
      )
      .setFooter({ text: 'با کلیک روی دکمه‌ها می‌توانید دستاوردهای بیشتری را مشاهده کنید!' });

    // ایجاد دکمه‌های کنترلی
    const controlRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements_earned')
          .setLabel(`🏆 دستاوردهای من (${earnedCount})`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('achievements_progress')
          .setLabel('📊 در حال پیشرفت')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );

    // دسته‌بندی منوی انتخاب
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(categoryMenu);

    // نمایش منو
    if (interaction instanceof Message) {
      await interaction.reply({ embeds: [embed], components: [selectRow, controlRow] });
    } else if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [selectRow, controlRow] });
    } else if (followUp) {
      await interaction.followUp({ embeds: [embed], components: [selectRow, controlRow], flags: MessageFlags.Ephemeral });
    } else if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ embeds: [embed], components: [selectRow, controlRow] });
      } catch (e) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: [selectRow, controlRow], flags: MessageFlags.Ephemeral });
        } else {
          await interaction.followUp({ embeds: [embed], components: [selectRow, controlRow], flags: MessageFlags.Ephemeral });
        }
      }
    } else {
      await interaction.reply({ embeds: [embed], components: [selectRow, controlRow], flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    console.error('Error in achievements menu:', error);
    
    const errorMessage = '❌ متأسفانه در نمایش منوی دستاوردها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
    
    if (interaction instanceof Message) {
      await interaction.reply({ content: errorMessage });
    } else if (interaction.deferred) {
      await interaction.editReply({ content: errorMessage });
    } else if (interaction.replied) {
      await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
    }
  }
}

/**
 * نمایش دستاوردهای یک دسته‌بندی خاص
 * @param interaction تعامل کاربر
 * @param category دسته‌بندی مورد نظر (یا 'all' برای همه)
 */
export async function showCategoryAchievements(
  interaction: ButtonInteraction,
  category: string = 'all'
) {
  try {
    const userId = interaction.user.id;
    
    // ساخت کوئری برای دریافت دستاوردها
    const query: any = {};
    if (category !== 'all') {
      query.category = category;
    }
    query.isHidden = false; // دستاوردهای مخفی را نمایش نمی‌دهیم مگر اینکه کاربر آنها را کسب کرده باشد

    // دریافت دستاوردهای دسته‌بندی
    const achievements = await AchievementModel.find(query)
      .sort({ rarityLevel: 1 })
      .lean();

    // دریافت دستاوردهای کاربر
    const userAchievements = await UserAchievementModel.find({
      userId: userId,
      achievementId: { $in: achievements.map(a => a.id) }
    }).lean();

    // نقشه‌ای از دستاوردهای کاربر برای دسترسی سریع‌تر
    const userAchievementMap = new Map();
    userAchievements.forEach(ua => {
      userAchievementMap.set(ua.achievementId, ua);
    });

    // ساخت امبد دستاوردها
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(category === 'all' 
        ? '🏆 همه دستاوردها' 
        : `${CATEGORIES[category]?.emoji || '🏆'} دستاوردهای ${CATEGORIES[category]?.name || category}`)
      .setDescription('لیست دستاوردهای قابل کسب در این دسته‌بندی:');

    // گروه‌بندی و افزودن دستاوردها به امبد
    const groupedByRarity = achievements.reduce((acc, achievement) => {
      const level = achievement.rarityLevel;
      if (!acc[level]) acc[level] = [];
      acc[level].push(achievement);
      return acc;
    }, {});

    // اضافه کردن دستاوردها به امبد براساس سطح کمیابی
    for (let rarity = 1; rarity <= 5; rarity++) {
      if (groupedByRarity[rarity]?.length > 0) {
        let fieldText = '';
        for (const achievement of groupedByRarity[rarity]) {
          const hasEarned = userAchievementMap.has(achievement.id);
          const prefix = hasEarned ? '✅' : '❌';
          fieldText += `${prefix} ${achievement.emoji} **${achievement.title}**\n`;
          
          // اگر کاربر دستاورد را کسب کرده، جزئیات بیشتر نشان می‌دهیم
          if (hasEarned) {
            const earnedAt = new Date(userAchievementMap.get(achievement.id).earnedAt);
            fieldText += `> ${achievement.description}\n`;
            fieldText += `> 📅 کسب شده: ${earnedAt.toLocaleDateString('fa-IR')}\n`;
          } else {
            fieldText += `> ${achievement.description}\n`;
          }
          fieldText += `> 🎁 پاداش: ${formatReward(achievement.reward)}\n\n`;
        }
        
        embed.addFields({ 
          name: RARITY_NAMES[rarity], 
          value: fieldText || 'هیچ دستاوردی در این سطح کمیابی یافت نشد.' 
        });
      }
    }

    // اگر دستاوردی وجود نداشت
    if (Object.keys(groupedByRarity).length === 0) {
      embed.addFields({ 
        name: '😔 دستاوردی یافت نشد', 
        value: 'در این دسته‌بندی هیچ دستاوردی وجود ندارد.' 
      });
    }
    
    // دکمه‌های کنترلی
    const controlRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements')
          .setLabel('🔙 بازگشت به منوی دستاوردها')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [controlRow] });
  } catch (error) {
    console.error('Error showing category achievements:', error);
    await interaction.update({ 
      content: '❌ متأسفانه در نمایش دستاوردهای این دسته‌بندی خطایی رخ داد! لطفاً دوباره تلاش کنید.',
      embeds: [],
      components: []
    });
  }
}

/**
 * نمایش دستاوردهای کسب شده کاربر
 * @param interaction تعامل کاربر
 */
export async function showEarnedAchievements(
  interaction: ButtonInteraction
) {
  try {
    const userId = interaction.user.id;

    // دریافت دستاوردهای کاربر
    const userAchievements = await UserAchievementModel.find({
      userId: userId
    }).lean();

    if (userAchievements.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xF1C40F)
        .setTitle('🏆 دستاوردهای من')
        .setDescription('شما هنوز هیچ دستاوردی کسب نکرده‌اید!\n\nبا استفاده از امکانات مختلف ربات می‌توانید دستاوردهای جدید را کسب کنید.');

      const controlRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('achievements')
            .setLabel('🔙 بازگشت به منوی دستاوردها')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.update({ embeds: [embed], components: [controlRow] });
      return;
    }

    // دریافت اطلاعات دستاوردهای کسب شده
    const achievementIds = userAchievements.map(ua => ua.achievementId);
    const achievements = await AchievementModel.find({
      id: { $in: achievementIds }
    }).lean();

    // نقشه‌ای از دستاوردها برای دسترسی سریع‌تر
    const achievementsMap = new Map();
    achievements.forEach(a => {
      achievementsMap.set(a.id, a);
    });

    // ساخت امبد دستاوردهای کسب شده
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('✅ دستاوردهای کسب شده')
      .setDescription(`شما تاکنون ${userAchievements.length} دستاورد را کسب کرده‌اید:`);

    // گروه‌بندی دستاوردها بر اساس دسته‌بندی
    const groupedByCategory = userAchievements.reduce((acc, ua) => {
      const achievement = achievementsMap.get(ua.achievementId);
      if (!achievement) return acc;
      
      const category = achievement.category;
      if (!acc[category]) acc[category] = [];
      
      acc[category].push({
        ...achievement,
        earnedAt: ua.earnedAt
      });
      
      return acc;
    }, {});

    // اضافه کردن دستاوردها به امبد براساس دسته‌بندی
    for (const [category, catAchievements] of Object.entries(groupedByCategory)) {
      const categoryInfo = CATEGORIES[category] || { name: category, emoji: '🏆' };
      let fieldText = '';
      
      for (const achievement of catAchievements) {
        const rarityName = RARITY_NAMES[achievement.rarityLevel] || '🔹 معمولی';
        fieldText += `${achievement.emoji} **${achievement.title}** (${rarityName})\n`;
        fieldText += `> ${achievement.description}\n`;
        fieldText += `> 📅 کسب شده: ${new Date(achievement.earnedAt).toLocaleDateString('fa-IR')}\n`;
        fieldText += `> 🎁 پاداش: ${formatReward(achievement.reward)}\n\n`;
      }
      
      embed.addFields({ 
        name: `${categoryInfo.emoji} ${categoryInfo.name} (${catAchievements.length})`, 
        value: fieldText 
      });
    }

    // دکمه‌های کنترلی
    const controlRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements')
          .setLabel('🔙 بازگشت به منوی دستاوردها')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [controlRow] });
  } catch (error) {
    console.error('Error showing earned achievements:', error);
    await interaction.update({ 
      content: '❌ متأسفانه در نمایش دستاوردهای کسب شده خطایی رخ داد! لطفاً دوباره تلاش کنید.',
      embeds: [],
      components: []
    });
  }
}

/**
 * نمایش دستاوردهای در حال پیشرفت کاربر
 * @param interaction تعامل کاربر
 */
export async function showProgressAchievements(
  interaction: ButtonInteraction
) {
  try {
    const userId = interaction.user.id;
    
    // دریافت اطلاعات کاربر
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('اطلاعات کاربر یافت نشد.');
    }
    
    // دریافت تمام دستاوردهای سیستم
    const allAchievements = await AchievementModel.find({
      isHidden: false
    }).lean();
    
    // دریافت پیشرفت‌های دستاوردهای کاربر
    const userAchievements = await UserAchievementModel.find({
      userId: userId
    }).lean();
    
    // نقشه‌ای از دستاوردهای کاربر برای دسترسی سریع‌تر
    const userAchievementMap = new Map();
    userAchievements.forEach(ua => {
      userAchievementMap.set(ua.achievementId, ua);
    });
    
    // ساخت لیست دستاوردهای در حال پیشرفت
    const inProgressAchievements = [];
    
    for (const achievement of allAchievements) {
      const userAchievement = userAchievementMap.get(achievement.id);
      
      // اگر کاربر این دستاورد را کامل کرده، از آن می‌گذریم
      if (userAchievement && userAchievement.progress >= 100) continue;
      
      // اگر کاربر این دستاورد را شروع کرده یا پیشرفت آن را می‌توانیم محاسبه کنیم
      if (userAchievement || shouldShowProgress(achievement, user)) {
        const progress = userAchievement ? userAchievement.progress : calculateProgress(achievement, user);
        
        if (progress > 0 && progress < 100) {
          inProgressAchievements.push({
            ...achievement,
            progress,
            userAchievement
          });
        }
      }
    }
    
    // مرتب‌سازی براساس میزان پیشرفت (نزولی)
    inProgressAchievements.sort((a, b) => b.progress - a.progress);
    
    // ساخت امبد نمایش دستاوردهای در حال پیشرفت
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('📊 دستاوردهای در حال پیشرفت')
      .setDescription('در این بخش می‌توانید دستاوردهایی که در حال پیشرفت به سمت آنها هستید را مشاهده کنید:');
    
    // اگر هیچ دستاوردی در حال پیشرفت نیست
    if (inProgressAchievements.length === 0) {
      embed.addFields({
        name: '😔 هیچ دستاوردی در حال پیشرفت نیست',
        value: 'شما هنوز در مسیر کسب هیچ دستاوردی قرار نگرفته‌اید. با استفاده از قابلیت‌های مختلف ربات، می‌توانید مسیر دستاوردهای جدید را آغاز کنید!'
      });
    } else {
      // نمایش دستاوردهای در حال پیشرفت (حداکثر 10 مورد)
      for (let i = 0; i < Math.min(10, inProgressAchievements.length); i++) {
        const achievement = inProgressAchievements[i];
        const progressBar = createProgressBar(achievement.progress);
        const target = getProgressTarget(achievement.requirement);
        const current = Math.round((achievement.progress * target) / 100);
        
        let fieldText = `> ${achievement.description}\n`;
        fieldText += `> ${progressBar} \`${current}/${target}\` (${achievement.progress}%)\n`;
        fieldText += `> 🎁 پاداش: ${formatReward(achievement.reward)}`;
        
        embed.addFields({
          name: `${achievement.emoji} ${achievement.title}`,
          value: fieldText
        });
      }
      
      // اگر بیش از 10 دستاورد در حال پیشرفت است
      if (inProgressAchievements.length > 10) {
        embed.setFooter({ 
          text: `و ${inProgressAchievements.length - 10} دستاورد دیگر در حال پیشرفت...` 
        });
      }
    }

    const controlRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements')
          .setLabel('🔙 بازگشت به منوی دستاوردها')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [controlRow] });
  } catch (error) {
    console.error('Error showing progress achievements:', error);
    await interaction.update({ 
      content: '❌ متأسفانه در نمایش دستاوردهای در حال پیشرفت خطایی رخ داد! لطفاً دوباره تلاش کنید.',
      embeds: [],
      components: []
    });
  }
}

/**
 * محاسبه مجموع پاداش‌های دریافتی از دستاوردها
 * @param userAchievements دستاوردهای کاربر
 * @param allAchievements همه دستاوردهای سیستم
 * @returns متن فرمت شده پاداش‌ها
 */
function calculateTotalRewards(userAchievements: any[], allAchievements: any[]): string {
  // نقشه‌ای از دستاوردها برای دسترسی سریع‌تر
  const achievementsMap = new Map();
  allAchievements.forEach(a => {
    achievementsMap.set(a.id, a);
  });

  // محاسبه مجموع پاداش‌ها
  let totalCoins = 0;
  let totalCrystals = 0;
  let totalXP = 0;

  userAchievements.forEach(ua => {
    const achievement = achievementsMap.get(ua.achievementId);
    if (!achievement) return;

    totalCoins += achievement.reward?.coins || 0;
    totalCrystals += achievement.reward?.crystals || 0;
    totalXP += achievement.reward?.xp || 0;
  });

  // ساخت متن نهایی
  let rewardText = '';
  if (totalCoins > 0) rewardText += `💰 ${formatNumber(totalCoins)} سکه `;
  if (totalCrystals > 0) rewardText += `💎 ${formatNumber(totalCrystals)} کریستال `;
  if (totalXP > 0) rewardText += `✨ ${formatNumber(totalXP)} تجربه`;

  return rewardText || 'هیچ پاداشی دریافت نشده';
}

/**
 * فرمت‌بندی پاداش دستاورد
 * @param reward اطلاعات پاداش
 * @returns متن فرمت شده پاداش
 */
function formatReward(reward: any): string {
  if (!reward) return 'بدون پاداش';

  let rewardText = '';
  if (reward.coins > 0) rewardText += `💰 ${formatNumber(reward.coins)} سکه `;
  if (reward.crystals > 0) rewardText += `💎 ${formatNumber(reward.crystals)} کریستال `;
  if (reward.xp > 0) rewardText += `✨ ${formatNumber(reward.xp)} تجربه `;
  if (reward.items?.length > 0) rewardText += `🎁 ${reward.items.length} آیتم `;

  return rewardText || 'بدون پاداش';
}

/**
 * بررسی آیا پیشرفت دستاورد برای نمایش مناسب است؟
 * @param achievement اطلاعات دستاورد
 * @param user اطلاعات کاربر
 * @returns آیا پیشرفت دستاورد قابل نمایش است؟
 */
function shouldShowProgress(achievement: any, user: any): boolean {
  // بر اساس نوع دستاورد بررسی می‌کنیم
  try {
    switch (achievement.requirement) {
      // دستاوردهای مربوط به سطح
      case 'reached_level_10':
      case 'reached_level_20':
      case 'reached_level_50':
        return user.level > 0;
      
      // دستاوردهای مربوط به دوستان
      case 'friend_count_20':
      case 'friend_count_50':
      case 'friend_count_100':
        return user.friendCount > 0;
      
      // دستاوردهای مربوط به بازی‌ها
      case 'win_games_10':
      case 'win_games_50':
      case 'win_games_100':
        return user.stats?.gamesWon > 0;
        
      // دستاوردهای مربوط به پول
      case 'bank_balance_1000000':
      case 'bank_balance_10000000':
        return user.bank > 0;
      
      // دستاوردهای مربوط به خرید سهام
      case 'buy_stocks_5':
        return user.stocks?.length > 0;
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error in shouldShowProgress:', error);
    return false;
  }
}

/**
 * محاسبه درصد پیشرفت یک دستاورد
 * @param achievement اطلاعات دستاورد
 * @param user اطلاعات کاربر
 * @returns درصد پیشرفت (0-100)
 */
function calculateProgress(achievement: any, user: any): number {
  try {
    // بر اساس نوع دستاورد محاسبه می‌کنیم
    switch (achievement.requirement) {
      // دستاوردهای مربوط به سطح
      case 'reached_level_10':
        return Math.min(100, Math.round((user.level / 10) * 100));
      case 'reached_level_20':
        return Math.min(100, Math.round((user.level / 20) * 100));
      case 'reached_level_50':
        return Math.min(100, Math.round((user.level / 50) * 100));
      
      // دستاوردهای مربوط به دوستان
      case 'friend_count_20':
        return Math.min(100, Math.round((user.friendCount / 20) * 100));
      case 'friend_count_50':
        return Math.min(100, Math.round((user.friendCount / 50) * 100));
      case 'friend_count_100':
        return Math.min(100, Math.round((user.friendCount / 100) * 100));
      
      // دستاوردهای مربوط به بازی‌ها
      case 'win_games_10':
        return Math.min(100, Math.round((user.stats?.gamesWon / 10) * 100)) || 0;
      case 'win_games_50':
        return Math.min(100, Math.round((user.stats?.gamesWon / 50) * 100)) || 0;
      case 'win_games_100':
        return Math.min(100, Math.round((user.stats?.gamesWon / 100) * 100)) || 0;
        
      // دستاوردهای مربوط به پول
      case 'bank_balance_1000000':
        return Math.min(100, Math.round((user.bank / 1000000) * 100));
      case 'bank_balance_10000000':
        return Math.min(100, Math.round((user.bank / 10000000) * 100));
      
      // دستاوردهای مربوط به خرید سهام
      case 'buy_stocks_5':
        return Math.min(100, Math.round((user.stocks?.length / 5) * 100)) || 0;
      
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error in calculateProgress:', error);
    return 0;
  }
}

/**
 * ایجاد نوار پیشرفت گرافیکی با ایموجی
 * @param progress درصد پیشرفت (0-100)
 * @returns نوار پیشرفت گرافیکی
 */
function createProgressBar(progress: number): string {
  const filledCount = Math.round((progress / 100) * 10);
  const emptyCount = 10 - filledCount;
  
  // نوار پیشرفت با ایموجی‌های مختلف
  const filled = '🟢'.repeat(filledCount);
  const empty = '⚪'.repeat(emptyCount);
  
  return filled + empty;
}

/**
 * دریافت هدف عددی پیشرفت براساس نوع دستاورد
 * @param requirement نوع دستاورد
 * @returns مقدار هدف
 */
function getProgressTarget(requirement: string): number {
  // استخراج عدد از انتهای رشته (مثلا win_games_10 -> 10)
  const match = requirement.match(/_(\d+)$/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  // در صورت عدم تطابق، مقادیر پیش‌فرض
  switch (requirement) {
    case 'bank_balance_1000000': return 1000000;
    case 'bank_balance_10000000': return 10000000;
    case 'daily_streak_7': return 7;
    case 'daily_streak_30': return 30;
    default: return 100; // مقدار پیش‌فرض
  }
}