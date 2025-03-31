import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, EmbedBuilder, Message, StringSelectMenuBuilder } from 'discord.js';
import { AchievementModel, UserAchievementModel } from '../../models/Achievement';
import { getUserById } from '../utils/userUtils';
import { formatNumber } from '../utils/formatters';

// مپ رنگ‌های مربوط به سطح کمیابی دستاوردها
const RARITY_COLORS = {
  1: 0x7F8C8D, // خاکستری - معمولی
  2: 0x3498DB, // آبی - غیرمعمول
  3: 0x9B59B6, // بنفش - کمیاب
  4: 0xF1C40F, // طلایی - خیلی کمیاب
  5: 0xE74C3C, // قرمز - افسانه‌ای
};

// توضیحات سطح کمیابی
const RARITY_NAMES = {
  1: '🔹 معمولی',
  2: '🔷 غیرمعمول',
  3: '🔮 کمیاب',
  4: '✨ خیلی کمیاب',
  5: '🌟 افسانه‌ای',
};

// دسته‌بندی‌های دستاوردها
const CATEGORIES = {
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
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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
      await interaction.followUp({ embeds: [embed], components: [selectRow, controlRow], ephemeral: true });
    } else if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ embeds: [embed], components: [selectRow, controlRow] });
      } catch (e) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: [selectRow, controlRow], ephemeral: true });
        } else {
          await interaction.followUp({ embeds: [embed], components: [selectRow, controlRow], ephemeral: true });
        }
      }
    } else {
      await interaction.reply({ embeds: [embed], components: [selectRow, controlRow], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in achievements menu:', error);
    
    const errorMessage = '❌ متأسفانه در نمایش منوی دستاوردها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
    
    if (interaction instanceof Message) {
      await interaction.reply({ content: errorMessage });
    } else if (interaction.deferred) {
      await interaction.editReply({ content: errorMessage });
    } else if (interaction.replied) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
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

    // در اینجا منطق واقعی برای نمایش دستاوردهای در حال پیشرفت قرار می‌گیرد
    // اما برای نمونه یک امبد ساده نمایش می‌دهیم

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('📊 دستاوردهای در حال پیشرفت')
      .setDescription(
        'در این بخش می‌توانید دستاوردهایی که در حال پیشرفت به سمت آنها هستید را مشاهده کنید:\n\n' +
        '🎮 **قهرمان بازی‌ها**\n' +
        '> برنده شدن در 10 بازی مختلف\n' +
        '> پیشرفت: `3/10` (30%)\n\n' +
        '💰 **سرمایه‌گذار حرفه‌ای**\n' +
        '> خرید 5 سهام مختلف\n' +
        '> پیشرفت: `2/5` (40%)\n\n' +
        '👥 **مردم‌دار**\n' +
        '> افزودن 20 دوست\n' +
        '> پیشرفت: `7/20` (35%)'
      );

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