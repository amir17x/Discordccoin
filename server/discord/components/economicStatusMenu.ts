/**
 * منوی وضعیت اقتصادی کاربر
 * این منو اطلاعات مربوط به وضعیت اقتصادی کاربر را نمایش می‌دهد
 * و پیشرفت به سطح بعدی را با جزئیات نشان می‌دهد
 */

import { ButtonInteraction, MessageComponentInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ColorResolvable } from 'discord.js';
import { storage } from '../../storage';
import { EconomicStatus, calculateNextLevelProgress, determineEconomicStatus } from '../utils/economyStatusCalculator';
import { formatNumber, createProgressBar } from '../utils/formatter';
import { log } from '../utils/logger';

// Logger wrapper to match the expected format
const logger = {
  error: (message: string, error?: any) => {
    log(message + (error ? ` - ${error.message || error}` : ''), 'error', 'ECONOMY');
  }
};

/**
 * نمایش منوی وضعیت اقتصادی کاربر
 * @param interaction تعامل کاربر
 * @param followUp آیا پاسخ به صورت followUp ارسال شود
 */
export async function economicStatusMenu(
  interaction: MessageComponentInteraction,
  followUp: boolean = false
): Promise<void> {
  try {
    // بررسی وجود تعامل
    if (!interaction) {
      logger.error('تعامل در economicStatusMenu تعریف نشده است');
      return;
    }

    // برای اطمینان از عدم تایم‌اوت در عملیات طولانی
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }

    // دریافت اطلاعات کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      const errorMessage = '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور `/menu` استفاده نمایید.';
      if (followUp) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
      return;
    }

    // تعیین وضعیت اقتصادی فعلی کاربر
    const currentStatus = (user.economyStatus as EconomicStatus) || EconomicStatus.BEGINNER;
    
    // محاسبه پیشرفت به سطح بعدی
    const nextLevelProgress = calculateNextLevelProgress(user);
    
    // تعیین رنگ و نماد وضعیت
    const statusDetails = {
      [EconomicStatus.BEGINNER]: { 
        color: '#4CAF50', 
        emoji: '🟢',
        name: 'تازه‌کار',
        description: 'شما در ابتدای مسیر اقتصادی خود هستید.'
      },
      [EconomicStatus.INTERMEDIATE]: { 
        color: '#FFC107', 
        emoji: '🟡',
        name: 'متوسط',
        description: 'شما تجربه خوبی در فعالیت‌های اقتصادی کسب کرده‌اید.'
      },
      [EconomicStatus.PROFESSIONAL]: { 
        color: '#FF9800', 
        emoji: '🟠',
        name: 'حرفه‌ای',
        description: 'شما یک متخصص اقتصادی با تجربه هستید.'
      },
      [EconomicStatus.WEALTHY]: { 
        color: '#2196F3', 
        emoji: '💎',
        name: 'ثروتمند',
        description: 'شما به بالاترین سطح اقتصادی دست یافته‌اید!'
      }
    };
    
    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor(statusDetails[currentStatus].color as ColorResolvable)
      .setTitle(`${statusDetails[currentStatus].emoji} وضعیت اقتصادی: ${statusDetails[currentStatus].name}`)
      .setDescription(statusDetails[currentStatus].description)
      .setThumbnail('https://img.icons8.com/fluency/48/bank-building.png')
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setFooter({
        text: 'CCoin Economic Status System',
        iconURL: interaction.client.user?.displayAvatarURL()
      })
      .setTimestamp();
    
    // اضافه کردن اطلاعات آماری
    embed.addFields(
      { name: '💰 امتیاز اقتصادی', value: formatNumber(user.economyScore || 0), inline: true },
      { name: '💱 گردش مالی', value: formatNumber(user.transactionVolume || 0), inline: true },
      { name: '📊 سطح اقتصادی', value: `${user.economyLevel || 1}`, inline: true }
    );
    
    // اضافه کردن اطلاعات خوش‌حسابی در وام‌ها
    if (user.loanRepaymentHistory) {
      const punctualityRate = user.loanRepaymentHistory.punctualityRate || 0;
      const punctualityBar = createProgressBar(punctualityRate);
      
      embed.addFields({ 
        name: '💳 خوش‌حسابی در پرداخت وام‌ها', 
        value: `${punctualityBar} (${punctualityRate}%)\n` +
               `تعداد کل وام‌ها: ${user.loanRepaymentHistory.totalLoans || 0}\n` +
               `پرداخت به موقع: ${user.loanRepaymentHistory.onTimePayments || 0}\n` +
               `پرداخت با تأخیر: ${user.loanRepaymentHistory.latePayments || 0}`,
        inline: false 
      });
    }
    
    // اضافه کردن اطلاعات فعالیت شغلی
    if (user.jobActivity) {
      embed.addFields({ 
        name: '👷 فعالیت‌های شغلی', 
        value: `تعداد کارهای انجام شده: ${user.jobActivity.totalTasksCompleted || 0}\n` +
               `درآمد کل: ${formatNumber(user.jobActivity.totalJobEarnings || 0)} CCoin\n` +
               `تعداد شغل‌های داشته شده: ${user.jobActivity.totalJobsHeld || 0}`,
        inline: false 
      });
    }
    
    // افزودن بخش پیشرفت به سطح بعدی اگر در بالاترین سطح نباشد
    if (nextLevelProgress.nextStatus) {
      const nextStatusName = statusDetails[nextLevelProgress.nextStatus].name;
      const nextStatusEmoji = statusDetails[nextLevelProgress.nextStatus].emoji;
      
      embed.addFields({ 
        name: `🔼 پیشرفت به سطح بعدی: ${nextStatusEmoji} ${nextStatusName}`, 
        value: `امتیاز اقتصادی: ${createProgressBar(nextLevelProgress.scoreProgress.percentage)} (${nextLevelProgress.scoreProgress.current}/${nextLevelProgress.scoreProgress.required})\n` +
               `گردش مالی: ${createProgressBar(nextLevelProgress.transactionProgress.percentage)} (${formatNumber(nextLevelProgress.transactionProgress.current)}/${formatNumber(nextLevelProgress.transactionProgress.required)})\n` +
               `خوش‌حسابی: ${createProgressBar(nextLevelProgress.punctualityProgress.percentage)} (${nextLevelProgress.punctualityProgress.current}%/${nextLevelProgress.punctualityProgress.required}%)\n` +
               `کارهای انجام شده: ${createProgressBar(nextLevelProgress.tasksProgress.percentage)} (${nextLevelProgress.tasksProgress.current}/${nextLevelProgress.tasksProgress.required})`,
        inline: false 
      });
    } else {
      // پیام برای کاربرانی که در بالاترین سطح هستند
      embed.addFields({ 
        name: '🏆 تبریک!', 
        value: 'شما به بالاترین سطح اقتصادی دست یافته‌اید!',
        inline: false 
      });
    }
    
    // ایجاد دکمه‌های کنترلی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('economic_status_detail')
          .setLabel('📋 جزئیات بیشتر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت به منوی اقتصادی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
    } else if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
    
  } catch (error) {
    logger.error('خطا در نمایش منوی وضعیت اقتصادی:', error);
    try {
      const errorReply = '❌ متأسفانه در نمایش وضعیت اقتصادی شما خطایی رخ داد. لطفاً دوباره تلاش کنید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorReply });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorReply, ephemeral: true });
      } else {
        await interaction.reply({ content: errorReply, ephemeral: true });
      }
    } catch (e) {
      logger.error('خطا در ارسال پیام خطای منوی وضعیت اقتصادی:', e);
    }
  }
}

/**
 * نمایش جزئیات بیشتر وضعیت اقتصادی
 * @param interaction تعامل کاربر
 */
export async function economicStatusDetail(
  interaction: MessageComponentInteraction
): Promise<void> {
  try {
    // برای اطمینان از عدم تایم‌اوت در عملیات طولانی
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
    
    // دریافت اطلاعات کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      const errorMessage = '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور `/menu` استفاده نمایید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
      return;
    }
    
    // تعیین وضعیت اقتصادی فعلی کاربر
    const currentStatus = (user.economyStatus as EconomicStatus) || EconomicStatus.BEGINNER;
    
    // تنظیمات رنگ و نماد برای هر سطح
    const statusDetails = {
      [EconomicStatus.BEGINNER]: { 
        color: '#4CAF50', 
        emoji: '🟢',
        name: 'تازه‌کار'
      },
      [EconomicStatus.INTERMEDIATE]: { 
        color: '#FFC107', 
        emoji: '🟡',
        name: 'متوسط'
      },
      [EconomicStatus.PROFESSIONAL]: { 
        color: '#FF9800', 
        emoji: '🟠',
        name: 'حرفه‌ای'
      },
      [EconomicStatus.WEALTHY]: { 
        color: '#2196F3', 
        emoji: '💎',
        name: 'ثروتمند'
      }
    };
    
    // توضیحات مزایای هر سطح
    const benefits = {
      [EconomicStatus.BEGINNER]: [
        '💰 سقف تراکنش کیف پول: ۱,۰۰۰ Ccoin',
        '💹 سود بانکی: ۱٪',
        '💳 سقف وام: ۵,۰۰۰ Ccoin',
        '👷 دسترسی به شغل‌های پایه'
      ],
      [EconomicStatus.INTERMEDIATE]: [
        '💰 سقف تراکنش کیف پول: ۵,۰۰۰ Ccoin',
        '💹 سود بانکی: ۳٪',
        '💳 سقف وام: ۲۰,۰۰۰ Ccoin',
        '👷 دسترسی به شغل‌های سطح متوسط'
      ],
      [EconomicStatus.PROFESSIONAL]: [
        '💰 سقف تراکنش کیف پول: ۲۰,۰۰۰ Ccoin',
        '💹 سود بانکی: ۵٪',
        '💳 سقف وام: ۱۰۰,۰۰۰ Ccoin',
        '👷 دسترسی به شغل‌های سطح بالا',
        '🎖️ نقش ویژه: "Professional Trader"'
      ],
      [EconomicStatus.WEALTHY]: [
        '💰 سقف تراکنش کیف پول: ۱۰۰,۰۰۰ Ccoin',
        '💹 سود بانکی: ۱۰٪',
        '💳 سقف وام: ۵۰۰,۰۰۰ Ccoin',
        '👷 دسترسی به تمام شغل‌ها',
        '🌟 نقش ویژه: "Wealthy Elite"',
        '🏆 نشان اختصاصی کنار نام'
      ]
    };
    
    // راهنمای ارتقا برای هر سطح
    const upgradeGuide = {
      [EconomicStatus.BEGINNER]: [
        '🔄 انجام تراکنش‌های مالی منظم',
        '💸 پرداخت به موقع وام‌ها',
        '👨‍💼 انجام کارهای شغلی روزانه',
        '📊 سرمایه‌گذاری در بازار سهام',
        '🏦 استفاده از خدمات بانکی'
      ],
      [EconomicStatus.INTERMEDIATE]: [
        '📈 افزایش حجم معاملات سهام',
        '💳 دریافت و بازپرداخت وام‌های بزرگتر',
        '👔 ارتقا به شغل‌های پردرآمدتر',
        '🤝 انجام معاملات تجاری با سایر کاربران',
        '🏭 سرمایه‌گذاری در پروژه‌های کلان'
      ],
      [EconomicStatus.PROFESSIONAL]: [
        '💎 خرید و فروش حجم بالای دارایی‌های باارزش',
        '🌐 گسترش شبکه تجاری با کاربران سطح بالا',
        '💰 ایجاد فرصت‌های سرمایه‌گذاری برای دیگران',
        '🏢 مشارکت در پروژه‌های اقتصادی بزرگ',
        '📊 معاملات سهام با حجم بالا و سود مطمئن'
      ],
      [EconomicStatus.WEALTHY]: [
        '🏆 شما به بالاترین سطح اقتصادی رسیده‌اید!',
        '🌟 از مزایای ویژه این سطح لذت ببرید',
        '🤝 به دیگران در مسیر پیشرفت کمک کنید'
      ]
    };
    
    // ایجاد Embed جزئیات
    const embed = new EmbedBuilder()
      .setColor(statusDetails[currentStatus].color as ColorResolvable)
      .setTitle(`${statusDetails[currentStatus].emoji} جزئیات وضعیت اقتصادی: ${statusDetails[currentStatus].name}`)
      .setDescription('در این بخش می‌توانید مزایای سطح فعلی و راهنمای ارتقا به سطح بعدی را مشاهده کنید.')
      .setThumbnail('https://img.icons8.com/fluency/48/business-report.png')
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setFooter({
        text: 'CCoin Economic Status System',
        iconURL: interaction.client.user?.displayAvatarURL()
      })
      .setTimestamp();
    
    // اضافه کردن بخش مزایای فعلی
    embed.addFields({
      name: '🎁 مزایای سطح فعلی',
      value: benefits[currentStatus].join('\n'),
      inline: false
    });
    
    // اضافه کردن بخش راهنمای ارتقا
    embed.addFields({
      name: '🔼 راهنمای ارتقا',
      value: upgradeGuide[currentStatus].join('\n'),
      inline: false
    });
    
    // اگر در سطح بالاتر از تازه‌کار قرار دارد، مزایای سطح قبلی را نیز نشان دهیم
    if (currentStatus !== EconomicStatus.BEGINNER) {
      // تعیین سطح قبلی
      let previousStatus: EconomicStatus;
      if (currentStatus === EconomicStatus.INTERMEDIATE) {
        previousStatus = EconomicStatus.BEGINNER;
      } else if (currentStatus === EconomicStatus.PROFESSIONAL) {
        previousStatus = EconomicStatus.INTERMEDIATE;
      } else {
        previousStatus = EconomicStatus.PROFESSIONAL;
      }
      
      embed.addFields({
        name: `📜 مزایای حفظ شده از سطح ${statusDetails[previousStatus].emoji} ${statusDetails[previousStatus].name}`,
        value: benefits[previousStatus].join('\n'),
        inline: false
      });
    }
    
    // ایجاد دکمه‌های کنترلی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('economic_status')
          .setLabel('🔙 بازگشت به نمای کلی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت به منوی اقتصادی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
    
  } catch (error) {
    logger.error('خطا در نمایش جزئیات وضعیت اقتصادی:', error);
    try {
      const errorReply = '❌ متأسفانه در نمایش جزئیات وضعیت اقتصادی شما خطایی رخ داد. لطفاً دوباره تلاش کنید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorReply });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorReply, ephemeral: true });
      } else {
        await interaction.reply({ content: errorReply, ephemeral: true });
      }
    } catch (e) {
      logger.error('خطا در ارسال پیام خطای جزئیات وضعیت اقتصادی:', e);
    }
  }
}