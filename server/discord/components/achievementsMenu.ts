import { 
  MessageComponentInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { storage } from '../../storage';

/**
 * سیستم دستاوردهای Ccoin
 * دستاوردهایی برای انگیزه‌ی بیشتر کاربران و حس پیشرفت
 */
export async function achievementsMenu(
  interaction: MessageComponentInteraction
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس - اصلاح مشکل ObjectId
    // در اینجا interaction.user.id را مستقیم به عنوان string به تابع getUserByDiscordId می‌دهیم
    const discordId = interaction.user.id;
    const user = await storage.getUserByDiscordId(discordId);
    
    if (!user) {
      // در صورت عدم موفقیت، تلاش دوم با متد getUser با تبدیل به عدد
      const userId = parseInt(discordId);
      const userById = await storage.getUser(userId);
      
      if (!userById) {
        if ('update' in interaction && typeof interaction.update === 'function') {
          try {
            await interaction.update({ 
              content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
              embeds: [], 
              components: [] 
            });
          } catch (e) {
            await interaction.reply({ 
              content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
              ephemeral: true 
            });
          }
        } else {
          await interaction.reply({ 
            content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
            ephemeral: true 
          });
        }
        return;
      }
    }
    
    // دریافت دستاوردهای کاربر از دیتابیس - نیاز به استفاده از شناسه کاربر
    let userId = parseInt(discordId);
    
    // بررسی کاربر با استفاده از getUserByDiscordId
    const userCheck = await storage.getUserByDiscordId(discordId);
    if (userCheck) {
      // اگر کاربر با شناسه دیسکورد پیدا شد، از آیدی آن استفاده می‌کنیم
      userId = userCheck.id;
    }
    
    const userAchievements = await storage.getUserAchievements(userId);
    
    // محاسبه آمار کلی دستاوردها
    const totalAchievements = userAchievements.length;
    const completedAchievements = userAchievements.filter(a => a.userAchievement.progress >= a.achievement.targetAmount).length;
    const completionRate = totalAchievements > 0 ? Math.round((completedAchievements / totalAchievements) * 100) : 0;
    
    // دسته‌بندی دستاوردها
    const categories = {
      'general': { title: '🌟 عمومی', count: 0, completed: 0 },
      'economy': { title: '💰 اقتصادی', count: 0, completed: 0 },
      'games': { title: '🎮 بازی‌ها', count: 0, completed: 0 },
      'social': { title: '👥 اجتماعی', count: 0, completed: 0 },
      'adventure': { title: '🗺️ ماجراجویی', count: 0, completed: 0 },
      'seasonal': { title: '🎭 فصلی', count: 0, completed: 0 }
    };
    
    // شمارش دستاوردها به تفکیک دسته
    userAchievements.forEach(a => {
      const category = a.achievement.category as keyof typeof categories;
      if (categories[category]) {
        categories[category].count++;
        if (a.userAchievement.progress >= a.achievement.targetAmount) {
          categories[category].completed++;
        }
      }
    });
    
    // ایجاد Embed برای نمایش خلاصه دستاوردها
    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🏆 دستاوردهای Ccoin')
      .setDescription('نشان‌های افتخاری که با فعالیت در سیستم Ccoin کسب کرده‌اید!')
      .setThumbnail('https://img.icons8.com/fluency/96/medal2.png')
      .addFields(
        { 
          name: '📊 آمار کلی دستاوردهای شما', 
          value: `تکمیل شده: ${completedAchievements}/${totalAchievements} (${completionRate}%)`,
          inline: false
        }
      );
    
    // افزودن فیلدهای دسته‌بندی
    Object.values(categories).forEach(category => {
      const percent = category.count > 0 ? Math.round((category.completed / category.count) * 100) : 0;
      embed.addFields({
        name: category.title,
        value: `${category.completed}/${category.count} (${percent}%) تکمیل شده`,
        inline: true
      });
    });
    
    // تعیین جایزه کلی بر اساس درصد تکمیل
    let totalReward = '';
    if (completionRate >= 100) totalReward = '🏆 مدال طلای دستاوردها + 10,000 سکه';
    else if (completionRate >= 75) totalReward = '🥈 مدال نقره دستاوردها + 5,000 سکه';
    else if (completionRate >= 50) totalReward = '🥉 مدال برنز دستاوردها + 2,500 سکه';
    else if (completionRate >= 25) totalReward = '1,000 سکه';
    else totalReward = '250 سکه';
    
    embed.addFields({
      name: '🎁 جایزه فعلی پیشرفت دستاوردها',
      value: totalReward,
      inline: false
    });
    
    // دکمه‌های تعاملی
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements_general')
          .setLabel('🌟 عمومی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('achievements_economy')
          .setLabel('💰 اقتصادی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('achievements_games')
          .setLabel('🎮 بازی‌ها')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements_social')
          .setLabel('👥 اجتماعی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('achievements_adventure')
          .setLabel('🗺️ ماجراجویی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('achievements_seasonal')
          .setLabel('🎭 فصلی')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements_claim')
          .setLabel('🎁 دریافت جایزه پیشرفت')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت به منوی اصلی')
          .setStyle(ButtonStyle.Danger)
      );
    
    // ارسال یا بروزرسانی پیام
    if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ 
          embeds: [embed], 
          components: [row1, row2, row3] 
        });
      } catch (e) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2, row3], 
            ephemeral: true 
          });
        } else {
          await interaction.followUp({ 
            embeds: [embed], 
            components: [row1, row2, row3], 
            ephemeral: true 
          });
        }
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          embeds: [embed], 
          components: [row1, row2, row3], 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          embeds: [embed], 
          components: [row1, row2, row3], 
          ephemeral: true 
        });
      }
    }
    
  } catch (error) {
    console.error('Error in achievements menu:', error);
    
    try {
      const errorMessage = 'خطایی در نمایش منوی دستاوردها رخ داد! لطفاً دوباره تلاش کنید.';
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ content: errorMessage, embeds: [], components: [] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: errorMessage, ephemeral: true });
          } else {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        }
      }
    } catch (e) {
      console.error('Error handling achievements menu failure:', e);
    }
  }
}

/**
 * نمایش دستاوردهای دسته‌بندی خاص
 */
export async function showCategoryAchievements(
  interaction: MessageComponentInteraction,
  category: string
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس - اصلاح مشکل ObjectId
    // در اینجا interaction.user.id را مستقیم به عنوان string به تابع getUserByDiscordId می‌دهیم
    const discordId = interaction.user.id;
    const user = await storage.getUserByDiscordId(discordId);
    
    if (!user) {
      // در صورت عدم موفقیت، تلاش دوم با متد getUser با تبدیل به عدد
      const userId = parseInt(discordId);
      const userById = await storage.getUser(userId);
      
      if (!userById) {
        await interaction.reply({ 
          content: 'حساب شما در سیستم یافت نشد! لطفاً با دستور `/start` ثبت نام کنید.', 
          ephemeral: true 
        });
        return;
      }
    }
    
    // دریافت دستاوردهای کاربر در دسته مورد نظر
    let userId = parseInt(discordId);
    
    // بررسی کاربر با استفاده از getUserByDiscordId
    const userCheck = await storage.getUserByDiscordId(discordId);
    if (userCheck) {
      // اگر کاربر با شناسه دیسکورد پیدا شد، از آیدی آن استفاده می‌کنیم
      userId = userCheck.id;
    }
    
    const userAchievements = await storage.getUserAchievements(userId);
    const categoryAchievements = userAchievements.filter(a => a.achievement.category === category);
    
    if (categoryAchievements.length === 0) {
      await interaction.reply({ 
        content: 'هیچ دستاوردی در این دسته یافت نشد!', 
        ephemeral: true 
      });
      return;
    }
    
    // عنوان دسته
    const categoryTitles: { [key: string]: string } = {
      'general': '🌟 دستاوردهای عمومی',
      'economy': '💰 دستاوردهای اقتصادی',
      'games': '🎮 دستاوردهای بازی‌ها',
      'social': '👥 دستاوردهای اجتماعی',
      'adventure': '🗺️ دستاوردهای ماجراجویی',
      'seasonal': '🎭 دستاوردهای فصلی'
    };
    
    // ایجاد Embed برای نمایش دستاوردهای دسته
    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle(categoryTitles[category] || '🏆 دستاوردهای Ccoin')
      .setDescription('پیشرفت شما در دستاوردهای این دسته')
      .setThumbnail('https://img.icons8.com/fluency/96/medal2.png');
    
    // افزودن فیلد برای هر دستاورد
    categoryAchievements.forEach(achievement => {
      const a = achievement.achievement;
      const ua = achievement.userAchievement;
      
      // محاسبه درصد پیشرفت
      const progress = Math.min(ua.progress, a.targetAmount);
      const percent = Math.round((progress / a.targetAmount) * 100);
      
      // ایجاد نوار پیشرفت
      let progressBar = '';
      const filledSquares = Math.floor(percent / 10);
      const emptySquares = 10 - filledSquares;
      progressBar = '█'.repeat(filledSquares) + '░'.repeat(emptySquares);
      
      // وضعیت تکمیل
      const status = progress >= a.targetAmount ? '✅ تکمیل شده' : `⏳ در حال پیشرفت (${percent}%)`;
      
      embed.addFields({
        name: a.title,
        value: `${a.description}\n${status}\n${progressBar} ${progress}/${a.targetAmount}\n💰 جایزه: ${a.reward}`,
        inline: false
      });
    });
    
    // دکمه بازگشت به منوی دستاوردها
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements')
          .setLabel('🔙 بازگشت به لیست دستاوردها')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [row], 
      ephemeral: true 
    });
    
  } catch (error) {
    console.error(`Error in show ${category} achievements:`, error);
    
    await interaction.reply({ 
      content: 'خطایی در نمایش دستاوردها رخ داد! لطفاً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}