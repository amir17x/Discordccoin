/**
 * منوی وضعیت اقتصادی کاربر
 * این منو اطلاعات مربوط به وضعیت اقتصادی کاربر را نمایش می‌دهد
 * و پیشرفت به سطح بعدی را با جزئیات نشان می‌دهد
 */

import { ButtonInteraction, MessageComponentInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ColorResolvable } from 'discord.js';
import { storage } from '../../storage';
import { EconomicStatus, calculateNextLevelProgress, determineEconomicStatus } from '../utils/economyStatusCalculator';
import { formatNumber, createProgressBar, getValueIcon, getThemeAsciiArt, formatTimeFromSeconds } from '../utils/formatter';
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
        icon: '🔰',
        name: 'تازه‌کار',
        description: 'شما در ابتدای مسیر اقتصادی خود هستید.'
      },
      [EconomicStatus.INTERMEDIATE]: { 
        color: '#FFC107', 
        emoji: '🟡',
        icon: '🥈',
        name: 'متوسط',
        description: 'شما تجربه خوبی در فعالیت‌های اقتصادی کسب کرده‌اید.'
      },
      [EconomicStatus.PROFESSIONAL]: { 
        color: '#FF9800', 
        emoji: '🟠',
        icon: '🥇',
        name: 'حرفه‌ای',
        description: 'شما یک متخصص اقتصادی با تجربه هستید.'
      },
      [EconomicStatus.WEALTHY]: { 
        color: '#2196F3', 
        emoji: '💎',
        icon: '👑',
        name: 'ثروتمند',
        description: 'شما به بالاترین سطح اقتصادی دست یافته‌اید!'
      }
    };
    
    // اطلاعات کمّی کاربر
    const economicScore = user.economyScore || 0;
    const transactionVolume = user.transactionVolume || 0;
    const economyLevel = user.economyLevel || 1;
    const punctualityRate = user.loanRepaymentHistory?.punctualityRate || 0;
    const tasksCompleted = user.jobActivity?.totalTasksCompleted || 0;
    const jobEarnings = user.jobActivity?.totalJobEarnings || 0;
    const totalJobs = user.jobActivity?.totalJobsHeld || 0;
    
    // اضافه کردن یک تصویر زیبا با اسکی آرت
    const asciiArt = getThemeAsciiArt('economic');
    
    // ایجاد Embed اصلی با طراحی جدید
    const embed = new EmbedBuilder()
      .setColor(statusDetails[currentStatus].color as ColorResolvable)
      .setTitle(`${statusDetails[currentStatus].icon} وضعیت اقتصادی: ${statusDetails[currentStatus].name}`)
      .setDescription(`${asciiArt}\n\n${statusDetails[currentStatus].description}`)
      .setThumbnail('https://img.icons8.com/fluency/96/economic-improvement.png')
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setFooter({
        text: `CCoin Economic Status System • ${new Date().toLocaleDateString('fa-IR')}`,
        iconURL: interaction.client.user?.displayAvatarURL()
      })
      .setTimestamp();
    
    // اضافه کردن اطلاعات آماری با آیکون‌های متناسب
    embed.addFields(
      { 
        name: `${getValueIcon(economicScore, 2000, 'money')} امتیاز اقتصادی`, 
        value: formatNumber(economicScore), 
        inline: true 
      },
      { 
        name: `${getValueIcon(transactionVolume, 1000000, 'transaction')} گردش مالی`, 
        value: formatNumber(transactionVolume), 
        inline: true 
      },
      { 
        name: `${getValueIcon(economyLevel, 4, 'level')} سطح اقتصادی`, 
        value: `${economyLevel}/4`, 
        inline: true 
      }
    );
    
    // اضافه کردن اطلاعات دارایی کلی
    embed.addFields({ 
      name: '💰 دارایی و منابع مالی', 
      value: `${getValueIcon(user.wallet, 10000, 'money')} کیف پول: ${formatNumber(user.wallet)} Ccoin\n` +
             `${getValueIcon(user.bank, 100000, 'money')} حساب بانکی: ${formatNumber(user.bank)} Ccoin\n` +
             `${getValueIcon(user.wallet + user.bank, 110000, 'money')} ثروت کل: ${formatNumber(user.wallet + user.bank)} Ccoin`,
      inline: false 
    });
    
    // اضافه کردن اطلاعات خوش‌حسابی در وام‌ها با طراحی بهتر
    if (user.loanRepaymentHistory) {
      // استفاده از نوار پیشرفت با استایل ایموجی برای نمایش بهتر
      const punctualityBar = createProgressBar(punctualityRate, 7, true, 'emoji');
      
      embed.addFields({ 
        name: '💳 خوش‌حسابی در پرداخت وام‌ها', 
        value: `${punctualityBar}\n` +
               `📊 آمار وام‌ها: ${user.loanRepaymentHistory.totalLoans || 0} وام دریافتی\n` +
               `✅ پرداخت به موقع: ${user.loanRepaymentHistory.onTimePayments || 0} مورد\n` +
               `⏰ پرداخت با تأخیر: ${user.loanRepaymentHistory.latePayments || 0} مورد`,
        inline: false 
      });
    }
    
    // اضافه کردن اطلاعات فعالیت شغلی با فرمت بهتر
    if (user.jobActivity) {
      // استفاده از نوار پیشرفت و ایموجی‌های مناسب
      const jobProgressBar = createProgressBar((tasksCompleted / 100) * 100, 7, true, 'colorful');
      
      embed.addFields({ 
        name: '👷 فعالیت‌های شغلی و کسب درآمد', 
        value: `${jobProgressBar}\n` +
               `📋 کارهای انجام شده: ${tasksCompleted} مورد\n` +
               `💵 درآمد کل: ${formatNumber(jobEarnings)} Ccoin\n` +
               `👔 تعداد شغل‌ها: ${totalJobs} شغل مختلف`,
        inline: false 
      });
    }
    
    // افزودن بخش پیشرفت به سطح بعدی با طراحی زیباتر
    if (nextLevelProgress.nextStatus) {
      const nextStatusName = statusDetails[nextLevelProgress.nextStatus].name;
      const nextStatusIcon = statusDetails[nextLevelProgress.nextStatus].icon;
      
      // استفاده از استایل‌های مختلف برای هر نوار پیشرفت
      const scoreBar = createProgressBar(nextLevelProgress.scoreProgress.percentage, 7, true, 'elegant');
      const transactionBar = createProgressBar(nextLevelProgress.transactionProgress.percentage, 7, true, 'elegant');
      const punctualityBar = createProgressBar(nextLevelProgress.punctualityProgress.percentage, 7, true, 'elegant');  
      const tasksBar = createProgressBar(nextLevelProgress.tasksProgress.percentage, 7, true, 'elegant');
      
      embed.addFields({ 
        name: `🔼 پیشرفت به سطح بعدی: ${nextStatusIcon} ${nextStatusName}`, 
        value: `💰 امتیاز اقتصادی:\n${scoreBar}\n(${nextLevelProgress.scoreProgress.current}/${nextLevelProgress.scoreProgress.required})\n\n` +
               `💱 گردش مالی:\n${transactionBar}\n(${formatNumber(nextLevelProgress.transactionProgress.current)}/${formatNumber(nextLevelProgress.transactionProgress.required)})\n\n` +
               `💳 خوش‌حسابی:\n${punctualityBar}\n(${nextLevelProgress.punctualityProgress.current}%/${nextLevelProgress.punctualityProgress.required}%)\n\n` +
               `👷 کارهای انجام شده:\n${tasksBar}\n(${nextLevelProgress.tasksProgress.current}/${nextLevelProgress.tasksProgress.required})`,
        inline: false 
      });
    } else {
      // پیام برای کاربرانی که در بالاترین سطح هستند
      embed.addFields({ 
        name: '🏆 تبریک!', 
        value: '```\n🌟 شما به بالاترین سطح اقتصادی دست یافته‌اید! 🌟\n```\n' +
               '💎 از تمام مزایای ویژه سطح ثروتمند بهره‌مند شوید!\n' +
               '👑 نام شما در میان ثروتمندترین‌های سرور ثبت شده است.',
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
    
    // اطلاعات کمّی کاربر
    const economicScore = user.economyScore || 0;
    const transactionVolume = user.transactionVolume || 0;
    const economyLevel = user.economyLevel || 1;
    const punctualityRate = user.loanRepaymentHistory?.punctualityRate || 0;
    const tasksCompleted = user.jobActivity?.totalTasksCompleted || 0;
    const jobEarnings = user.jobActivity?.totalJobEarnings || 0;
    
    // تنظیمات رنگ و نماد برای هر سطح
    const statusDetails = {
      [EconomicStatus.BEGINNER]: { 
        color: '#4CAF50', 
        emoji: '🟢',
        icon: '🔰',
        name: 'تازه‌کار',
        description: 'شما در ابتدای مسیر اقتصادی خود هستید.'
      },
      [EconomicStatus.INTERMEDIATE]: { 
        color: '#FFC107', 
        emoji: '🟡',
        icon: '🥈',
        name: 'متوسط',
        description: 'شما تجربه خوبی در فعالیت‌های اقتصادی کسب کرده‌اید.'
      },
      [EconomicStatus.PROFESSIONAL]: { 
        color: '#FF9800', 
        emoji: '🟠',
        icon: '🥇',
        name: 'حرفه‌ای',
        description: 'شما یک متخصص اقتصادی با تجربه هستید.'
      },
      [EconomicStatus.WEALTHY]: { 
        color: '#2196F3', 
        emoji: '💎',
        icon: '👑',
        name: 'ثروتمند',
        description: 'شما به بالاترین سطح اقتصادی دست یافته‌اید!'
      }
    };
    
    // توضیحات مزایای هر سطح - با طراحی بهتر و ایموجی‌های زیباتر
    const benefits = {
      [EconomicStatus.BEGINNER]: [
        '💵 سقف تراکنش کیف پول: ۱,۰۰۰ Ccoin',
        '📈 سود بانکی: ۱٪ روزانه',
        '💳 سقف وام: ۵,۰۰۰ Ccoin',
        '👷 دسترسی به شغل‌های پایه',
        '🔹 امکان خرید سهام (حداکثر ۳ سهم)'
      ],
      [EconomicStatus.INTERMEDIATE]: [
        '💵 سقف تراکنش کیف پول: ۵,۰۰۰ Ccoin',
        '📈 سود بانکی: ۳٪ روزانه',
        '💳 سقف وام: ۲۰,۰۰۰ Ccoin',
        '👷 دسترسی به شغل‌های سطح متوسط',
        '🔹 امکان خرید سهام (حداکثر ۵ سهم)',
        '🎰 امکان شرکت در قمارهای سطح متوسط'
      ],
      [EconomicStatus.PROFESSIONAL]: [
        '💵 سقف تراکنش کیف پول: ۲۰,۰۰۰ Ccoin',
        '📈 سود بانکی: ۵٪ روزانه',
        '💳 سقف وام: ۱۰۰,۰۰۰ Ccoin',
        '👷 دسترسی به شغل‌های سطح بالا',
        '🔹 امکان خرید سهام (حداکثر ۱۰ سهم)',
        '🎰 امکان شرکت در قمارهای سطح بالا',
        '🎖️ نقش ویژه: "Professional Trader"'
      ],
      [EconomicStatus.WEALTHY]: [
        '💵 سقف تراکنش کیف پول: ۱۰۰,۰۰۰ Ccoin',
        '📈 سود بانکی: ۱۰٪ روزانه',
        '💳 سقف وام: ۵۰۰,۰۰۰ Ccoin',
        '👷 دسترسی به تمام شغل‌ها',
        '🔹 امکان خرید نامحدود سهام',
        '🎰 امکان شرکت در تمامی قمارها',
        '🌟 نقش ویژه: "Wealthy Elite"',
        '🏆 نشان اختصاصی کنار نام',
        '💎 دریافت ۱۰,۰۰۰ Ccoin هدیه هفتگی'
      ]
    };
    
    // راهنمای ارتقا برای هر سطح با فرمت بهتر
    const upgradeGuide = {
      [EconomicStatus.BEGINNER]: [
        '💱 انجام تراکنش‌های مالی منظم (حداقل ۱۰,۰۰۰ Ccoin گردش مالی)',
        '💸 پرداخت به موقع وام‌ها (حداقل ۶۰٪ خوش‌حسابی)',
        '👨‍💼 انجام کارهای شغلی روزانه (حداقل ۱۰ کار)',
        '📊 سرمایه‌گذاری در بازار سهام برای افزایش امتیاز اقتصادی',
        '🏦 استفاده از خدمات بانکی برای سود بیشتر'
      ],
      [EconomicStatus.INTERMEDIATE]: [
        '📈 افزایش حجم معاملات سهام (حداقل ۱۰۰,۰۰۰ Ccoin گردش مالی)',
        '💳 دریافت و بازپرداخت وام‌های بزرگتر (حداقل ۸۰٪ خوش‌حسابی)',
        '👔 ارتقا به شغل‌های پردرآمدتر (حداقل ۵۰ کار انجام شده)',
        '🤝 انجام معاملات تجاری با سایر کاربران برای افزایش گردش مالی',
        '🏭 سرمایه‌گذاری در پروژه‌های کلان و افزایش امتیاز اقتصادی به ۵۰۰+'
      ],
      [EconomicStatus.PROFESSIONAL]: [
        '💎 خرید و فروش حجم بالای دارایی‌ها (حداقل ۱,۰۰۰,۰۰۰ Ccoin گردش مالی)',
        '📊 معاملات سهام با حجم بالا برای کسب امتیاز اقتصادی ۲,۰۰۰+',
        '🌐 گسترش شبکه تجاری با کاربران سطح بالا',
        '✨ بازپرداخت سریع وام‌ها (حداقل ۹۵٪ خوش‌حسابی)',
        '👨‍💼 تکمیل حداقل ۲۰۰ کار شغلی برای رسیدن به سطح ثروتمندی'
      ],
      [EconomicStatus.WEALTHY]: [
        '🏆 شما به بالاترین سطح اقتصادی دست یافته‌اید!',
        '✨ از مزایای ویژه و منحصر به فرد این سطح لذت ببرید',
        '🤝 به دیگران در مسیر پیشرفت اقتصادی کمک کنید',
        '💎 ثروت خود را حفظ کنید تا در این سطح باقی بمانید'
      ]
    };
    
    // اضافه کردن یک تصویر زیبا با اسکی آرت
    const asciiArt = getThemeAsciiArt('bank');
    
    // ایجاد Embed جزئیات با طراحی جدید
    const embed = new EmbedBuilder()
      .setColor(statusDetails[currentStatus].color as ColorResolvable)
      .setTitle(`${statusDetails[currentStatus].icon} جزئیات وضعیت اقتصادی: ${statusDetails[currentStatus].name}`)
      .setDescription(`${asciiArt}\n\nدر این بخش می‌توانید مزایای سطح فعلی و راهنمای ارتقا به سطح بعدی را مشاهده کنید.`)
      .setThumbnail('https://img.icons8.com/fluency/96/economic-development.png')
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setFooter({
        text: `CCoin Economic Status System • ${new Date().toLocaleDateString('fa-IR')}`,
        iconURL: interaction.client.user?.displayAvatarURL()
      })
      .setTimestamp();
    
    // اضافه کردن خلاصه وضعیت اقتصادی
    embed.addFields({
      name: '📊 خلاصه وضعیت اقتصادی',
      value: `${getValueIcon(economicScore, 2000, 'money')} امتیاز اقتصادی: ${formatNumber(economicScore)}\n` +
             `${getValueIcon(transactionVolume, 1000000, 'transaction')} گردش مالی: ${formatNumber(transactionVolume)}\n` +
             `${getValueIcon(economyLevel, 4, 'level')} سطح اقتصادی: ${economyLevel}/4\n` +
             `${getValueIcon(punctualityRate, 100, 'rating')} خوش‌حسابی: ${punctualityRate}%`,
      inline: false
    });
    
    // اضافه کردن بخش مزایای سطح فعلی با فرمت بهتر
    embed.addFields({
      name: `🎁 مزایای سطح ${statusDetails[currentStatus].emoji} ${statusDetails[currentStatus].name}`,
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