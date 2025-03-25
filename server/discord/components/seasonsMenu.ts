import { 
  MessageComponentInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { storage } from '../../storage';

/**
 * سیستم فصل‌های Ccoin
 * رقابت‌های ماهانه با جوایز ویژه
 */
export async function seasonsMenu(
  interaction: MessageComponentInteraction
) {
  try {
    // دریافت اطلاعات کاربر از دیتابیس
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
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
    
    // اطلاعات فصل فعلی (در پیاده‌سازی واقعی از دیتابیس خوانده می‌شود)
    const currentSeason = {
      id: 3,
      name: 'فصل بهار 1404',
      description: 'فصل بهار 1404 Ccoin - جایی که صدای سکه‌ها شکوفه می‌دهد!',
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // شروع 30 روز قبل
      endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // پایان 60 روز دیگر
      rewards: [
        {
          rank: '1',
          rewards: '👑 تاج قهرمانی فصل + 50,000 سکه + 500 کریستال + آیتم ویژه'
        },
        {
          rank: '2-3',
          rewards: '🥈 نشان نقره‌ای فصل + 30,000 سکه + 300 کریستال'
        },
        {
          rank: '4-10',
          rewards: '🥉 نشان برنزی فصل + 15,000 سکه + 150 کریستال'
        },
        {
          rank: '11-50',
          rewards: '5,000 سکه + 50 کریستال'
        },
        {
          rank: '51-100',
          rewards: '2,500 سکه + 25 کریستال'
        }
      ],
      leaderboard: [
        { userId: 123456789, username: 'کاربر فعال ۱', score: 12500, rank: 1 },
        { userId: 234567890, username: 'کاربر پیشرو', score: 10750, rank: 2 },
        { userId: 345678901, username: 'شکارچی سکه', score: 9800, rank: 3 },
        { userId: parseInt(interaction.user.id), username: interaction.user.username, score: 5600, rank: 12 }
      ]
    };
    
    // رتبه و امتیاز کاربر فعلی
    const userRankInfo = currentSeason.leaderboard.find(player => player.userId === userId) || 
                        { userId, username: interaction.user.username, score: 0, rank: currentSeason.leaderboard.length + 1 };
    
    // محاسبه زمان باقیمانده و درصد پیشرفت فصل
    const timeRemaining = getTimeRemaining(currentSeason.endTime);
    const seasonProgress = getSeasonProgress(currentSeason.startTime, currentSeason.endTime);
    
    // محاسبه فاصله امتیاز تا رتبه بالاتر
    const pointsGap = getCurrentGap(currentSeason, userId);
    
    // ایجاد Embed برای نمایش اطلاعات فصل
    const embed = new EmbedBuilder()
      .setColor('#00AAFF')
      .setTitle(`🌸 ${currentSeason.name}`)
      .setDescription(currentSeason.description)
      .setThumbnail('https://img.icons8.com/fluency/96/season-change.png')
      .addFields(
        { 
          name: '⏱️ وضعیت فصل', 
          value: `پیشرفت: ${seasonProgress}\nزمان باقیمانده: ${timeRemaining}`,
          inline: false
        },
        { 
          name: '🏅 رتبه فعلی شما', 
          value: `رتبه ${userRankInfo.rank} با ${userRankInfo.score} امتیاز`,
          inline: true
        },
        { 
          name: '📊 تا رتبه بعدی', 
          value: pointsGap > 0 ? `${pointsGap} امتیاز تا رتبه بالاتر` : 'شما در بالاترین رتبه هستید!',
          inline: true
        }
      );
    
    // افزودن بخش جوایز
    embed.addFields({
      name: '🎁 جوایز پایان فصل',
      value: currentSeason.rewards.map(reward => `رتبه ${reward.rank}: ${reward.rewards}`).join('\n'),
      inline: false
    });
    
    // افزودن برترین‌های لیدربورد
    const topThree = currentSeason.leaderboard.slice(0, 3);
    const topThreeText = topThree.map(player => 
      `${player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'} ${player.rank}. ${player.username}: ${player.score} امتیاز`
    ).join('\n');
    
    embed.addFields({
      name: '🏆 برترین‌های فعلی',
      value: topThreeText || 'هنوز هیچ کاربری در لیدربورد نیست!',
      inline: false
    });
    
    // دکمه‌های تعاملی
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('season_leaderboard')
          .setLabel('📊 مشاهده لیدربورد کامل')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('season_missions')
          .setLabel('📋 ماموریت‌های فصلی')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('season_shop')
          .setLabel('🛍️ فروشگاه فصلی')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('season_history')
          .setLabel('📜 تاریخچه فصل‌ها')
          .setStyle(ButtonStyle.Secondary)
      );
    
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
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
        // اگر بروزرسانی با خطا مواجه شد، پیام جدید ارسال کن
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
    console.error('Error in seasons menu:', error);
    
    try {
      const errorMessage = 'خطایی در نمایش منوی فصل‌ها رخ داد! لطفاً دوباره تلاش کنید.';
      
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
      console.error('Error handling seasons menu failure:', e);
    }
  }
}

/**
 * محاسبه زمان باقی‌مانده تا پایان فصل
 */
function getTimeRemaining(endTimeStr: Date | string): string {
  const endTime = new Date(endTimeStr).getTime();
  const now = Date.now();
  
  const timeRemaining = endTime - now;
  if (timeRemaining <= 0) return 'پایان یافته';
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} روز و ${hours} ساعت`;
  } else {
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعت و ${minutes} دقیقه`;
  }
}

/**
 * محاسبه درصد پیشرفت فصل
 */
function getSeasonProgress(startTimeStr: Date | string, endTimeStr: Date | string): string {
  const startTime = new Date(startTimeStr).getTime();
  const endTime = new Date(endTimeStr).getTime();
  const now = Date.now();
  
  const totalDuration = endTime - startTime;
  const elapsed = now - startTime;
  
  let percent = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
  percent = Math.max(0, percent); // اطمینان از مثبت بودن درصد
  
  // ایجاد نوار پیشرفت
  const filledSquares = Math.floor(percent / 10);
  const emptySquares = 10 - filledSquares;
  const progressBar = '█'.repeat(filledSquares) + '░'.repeat(emptySquares);
  
  return `${progressBar} ${percent}%`;
}

/**
 * محاسبه فاصله امتیاز تا رتبه بالاتر
 */
function getCurrentGap(season: any, userId: number): number {
  const userIndex = season.leaderboard.findIndex((player: any) => player.userId === userId);
  
  if (userIndex <= 0) return 0; // کاربر در رتبه اول است یا در لیدربورد نیست
  
  const userScore = season.leaderboard[userIndex].score;
  const higherRankScore = season.leaderboard[userIndex - 1].score;
  
  return higherRankScore - userScore;
}