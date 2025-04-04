/**
 * منوی ارتقاء حساب بانکی Ccoin
 * امکان ارتقاء حساب بانکی با استفاده از کریستال و دریافت مزایای مختلف
 * طراحی شیک و جذاب با ایموجی‌های متنوع برای تجربه کاربری بهتر
 */

import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// تعریف سطوح حساب بانکی و مشخصات هر سطح با طراحی بهبود یافته
const BANK_ACCOUNT_TIERS = [
  { 
    id: 0, 
    name: 'معمولی', 
    emoji: '🟢', 
    color: 0x2ECC71, 
    interestRate: 0.02,
    transferLimit: 5000,
    upgradeCost: 0,
    description: 'حساب پایه با امکانات اولیه',
    benefits: ['💵 سود روزانه ۲٪', '💸 سقف تراکنش ۵,۰۰۰ سکه', '📊 امکانات اولیه بانکی']
  },
  { 
    id: 1, 
    name: 'نقره‌ای', 
    emoji: '🥈', 
    color: 0x95a5a6, 
    interestRate: 0.05,
    transferLimit: 10000,
    upgradeCost: 500,
    description: 'سقف تراکنش بالاتر، سود ۵٪ روزانه و نقش ویژه در سرور',
    benefits: ['💵 سود روزانه ۵٪', '💸 سقف تراکنش ۱۰,۰۰۰ سکه', '🏅 نقش ویژه نقره‌ای در سرور', '✨ پروفایل ویژه با نشان نقره‌ای']
  },
  { 
    id: 2, 
    name: 'طلایی', 
    emoji: '🥇', 
    color: 0xf1c40f, 
    interestRate: 0.10,
    transferLimit: 50000,
    upgradeCost: 1500,
    description: 'سقف تراکنش بالا، سود ۱۰٪ روزانه و دسترسی به کانال ویژه',
    benefits: ['💵 سود روزانه ۱۰٪', '💸 سقف تراکنش ۵۰,۰۰۰ سکه', '🏅 نقش ویژه طلایی در سرور', '🔒 دسترسی به کانال VIP', '📱 اطلاعیه‌های ویژه بازار']
  },
  { 
    id: 3, 
    name: 'الماسی', 
    emoji: '💎', 
    color: 0x3498db, 
    interestRate: 0.15,
    transferLimit: 200000,
    upgradeCost: 3000,
    description: 'سقف تراکنش بسیار بالا، سود ۱۵٪ روزانه و نشان اختصاصی',
    benefits: ['💵 سود روزانه ۱۵٪', '💸 سقف تراکنش ۲۰۰,۰۰۰ سکه', '🏅 نقش ویژه الماسی در سرور', '🔒 دسترسی به کانال‌های VIP', '👑 نشان اختصاصی الماسی کنار نام', '🎁 هدایای ماهانه اختصاصی']
  },
  { 
    id: 4, 
    name: 'افسانه‌ای', 
    emoji: '🌟', 
    color: 0x9b59b6, 
    interestRate: 0.20,
    transferLimit: Infinity,
    upgradeCost: 5000,
    description: 'سقف تراکنش نامحدود، سود ۲۰٪ روزانه و ایموجی اختصاصی',
    benefits: ['💵 سود روزانه ۲۰٪', '💸 سقف تراکنش نامحدود ♾️', '👑 نقش افسانه‌ای انحصاری', '🔒 دسترسی به تمام کانال‌های VIP', '🎭 ایموجی اختصاصی شخصی', '🎯 اولویت در رویدادهای ویژه', '🏆 نام در تالار مشاهیر']
  }
];

/**
 * تابع کمکی برای دریافت مشخصات سطح حساب
 * @param tier شماره سطح حساب
 * @returns مشخصات سطح حساب
 */
export function getBankAccountTierInfo(tier: number) {
  const validTier = Math.max(0, Math.min(tier, BANK_ACCOUNT_TIERS.length - 1));
  return BANK_ACCOUNT_TIERS[validTier];
}

/**
 * نمایش منوی ارتقاء حساب بانکی
 * @param interaction تعامل کاربر
 * @param followUp آیا به عنوان پیام جدید ارسال شود
 */
export async function bankUpgradeMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // دریافت اطلاعات کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // دریافت اطلاعات سطح فعلی حساب
    const currentTier = user.bankAccountTier || 0;
    const currentTierInfo = getBankAccountTierInfo(currentTier);
    
    // ایجاد Embed اصلی منو با طراحی بهتر
    const embed = new EmbedBuilder()
      .setColor(currentTierInfo.color)
      .setTitle(`✨🏛️ ارتقاء حساب بانکی شما 🏛️✨`)
      .setDescription(`
🔹 با ارتقاء حساب بانکی، به **امکانات VIP** و **سودهای شگفت‌انگیز** دسترسی پیدا کنید! 💰
      
${currentTierInfo.emoji} **سطح فعلی شما:** حساب **${currentTierInfo.name}**
💎 **کریستال‌های شما:** ${user.crystals.toLocaleString('fa-IR')} 💎
💹 **سود روزانه فعلی:** ${(currentTierInfo.interestRate * 100)}٪
🧧 **سقف انتقال وجه:** ${currentTierInfo.transferLimit.toLocaleString('fa-IR')} سکه
      
🎯 **انتخاب حساب جدید با مزایای ویژه!** 👇`)
      .setThumbnail('https://img.icons8.com/fluency/96/bank-building.png')
      .setFooter({ 
        text: `${interaction.user.username} | با ارتقاء حساب، امکانات بیشتری دریافت کنید`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();
    
    // افزودن فیلدهای مربوط به سطوح مختلف حساب با طراحی زیباتر
    for (const tier of BANK_ACCOUNT_TIERS) {
      if (tier.id === 0) continue; // سطح پایه را نمایش نمی‌دهیم
      
      const alreadyUpgraded = currentTier >= tier.id;
      const canUpgrade = currentTier === tier.id - 1;
      const hasEnoughCrystals = user.crystals >= tier.upgradeCost;
      
      let statusEmoji, statusText, statusColor;
      if (alreadyUpgraded) {
        statusEmoji = '✅';
        statusText = 'فعال شده';
        statusColor = '';
      } else if (canUpgrade) {
        if (hasEnoughCrystals) {
          statusEmoji = '🔓';
          statusText = 'قابل ارتقاء';
          statusColor = '`قابل خرید`';
        } else {
          statusEmoji = '❌';
          statusText = `کریستال ناکافی (نیاز: ${tier.upgradeCost})`;
          statusColor = '`ناکافی`';
        }
      } else {
        statusEmoji = '🔒';
        statusText = 'قفل (ابتدا سطح قبلی را ارتقاء دهید)';
        statusColor = '';
      }
      
      // قیمت را فرمت می‌کنیم
      const costFormatted = tier.upgradeCost.toLocaleString('fa-IR');
      
      // ایجاد نوار پیشرفت برای نمایش فاصله تا خرید
      let progressBar = '';
      if (!alreadyUpgraded && canUpgrade) {
        const progressPercent = Math.min(100, Math.floor((user.crystals / tier.upgradeCost) * 100));
        const filledBars = Math.floor(progressPercent / 10);
        const emptyBars = 10 - filledBars;
        progressBar = `\n[${'▰'.repeat(filledBars)}${'▱'.repeat(emptyBars)}] ${progressPercent}٪`;
      }
      
      // متن مزایا با ایموجی‌های زیبا
      const benefitsList = tier.benefits.map(benefit => `➤ ${benefit}`).join('\n');
      
      embed.addFields({
        name: `${tier.emoji} حساب ${tier.name} ${statusEmoji}`,
        value: `\`\`\`\n● مزایای ویژه:\n\`\`\`
${benefitsList}

${canUpgrade ? `**💰 هزینه ارتقاء:** ${costFormatted} کریستال 💎 ${statusColor}${progressBar}` : `**💰 هزینه ارتقاء:** ${costFormatted} کریستال 💎`}
**📊 وضعیت:** ${statusEmoji} ${statusText}`,
        inline: false
      });
    }
    
    // ایجاد دکمه‌های ارتقاء با طراحی زیباتر
    const buttons: ButtonBuilder[] = [];
    
    // دکمه‌های ارتقاء برای هر سطح با طراحی مناسب با رنگ و ایموجی متناسب
    for (let i = 1; i < BANK_ACCOUNT_TIERS.length; i++) {
      const tier = BANK_ACCOUNT_TIERS[i];
      const canUpgrade = currentTier === tier.id - 1;
      const hasEnoughCrystals = user.crystals >= tier.upgradeCost;
      
      if (canUpgrade) {
        // انتخاب استایل دکمه بر اساس سطح حساب
        let buttonStyle: ButtonStyle;
        if (tier.id === 1) buttonStyle = ButtonStyle.Secondary; // نقره‌ای
        else if (tier.id === 2) buttonStyle = ButtonStyle.Primary; // طلایی
        else if (tier.id === 3) buttonStyle = ButtonStyle.Primary; // الماسی
        else buttonStyle = ButtonStyle.Success; // افسانه‌ای
        
        // تنظیم متن دکمه با ایموجی‌های مناسب
        let buttonLabel = `ارتقاء به ${tier.name} ${tier.emoji}`;
        if (hasEnoughCrystals) {
          buttonLabel = `${buttonLabel} ✅`;
        } else {
          buttonLabel = `${buttonLabel} (نیاز: ${tier.upgradeCost} 💎)`;
        }
        
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`upgrade_bank_${tier.id}`)
            .setLabel(buttonLabel)
            .setStyle(buttonStyle)
            .setDisabled(!hasEnoughCrystals)
        );
      }
    }
    
    // اگر کاربر به بالاترین سطح رسیده باشد، یک دکمه تبریک نمایش می‌دهیم
    if (buttons.length === 0 && currentTier >= BANK_ACCOUNT_TIERS.length - 1) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId('bank_upgrade_max')
          .setLabel('🎖️ شما به بالاترین سطح حساب رسیده‌اید! 🌟')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      );
    } 
    // اگر کاربر قابلیت ارتقا ندارد ولی هنوز به بالاترین سطح نرسیده است
    else if (buttons.length === 0) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId('bank_upgrade_unavailable')
          .setLabel('🔒 ابتدا سطح قبلی را ارتقاء دهید')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }
    
    // دکمه بازگشت با طراحی بهتر
    buttons.push(
      new ButtonBuilder()
        .setCustomId('bank_menu')
        .setLabel('🔙 بازگشت به منوی اصلی')
        .setStyle(ButtonStyle.Danger)
    );
    
    // ایجاد ردیف‌های دکمه (حداکثر 5 دکمه در هر ردیف)
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < buttons.length; i += 3) {
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttons.slice(i, i + 3));
      rows.push(row);
    }
    
    // ارسال پیام
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components: rows, ephemeral: true });
    } else {
      if ('update' in interaction && typeof interaction.update === 'function') {
        await interaction.update({ embeds: [embed], components: rows });
      } else {
        await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
      }
    }
    
  } catch (error) {
    console.error('Error in bank upgrade menu:', error);
    try {
      if (followUp) {
        await interaction.followUp({
          content: '❌ متأسفانه در نمایش منوی ارتقاء حساب بانکی خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        if ('update' in interaction && typeof interaction.update === 'function') {
          await interaction.update({
            content: '❌ متأسفانه در نمایش منوی ارتقاء حساب بانکی خطایی رخ داد!',
            components: [],
            embeds: []
          });
        } else {
          await interaction.reply({
            content: '❌ متأسفانه در نمایش منوی ارتقاء حساب بانکی خطایی رخ داد!',
            ephemeral: true
          });
        }
      }
    } catch (e) {
      console.error('Error handling bank upgrade menu failure:', e);
    }
  }
}

/**
 * پردازش ارتقاء حساب بانکی
 * @param interaction تعامل کاربر با دکمه ارتقاء
 * @param targetTier سطح هدف برای ارتقاء
 */
export async function processBankAccountUpgrade(
  interaction: ButtonInteraction | MessageComponentInteraction,
  targetTier: number
) {
  try {
    // دریافت اطلاعات کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ حساب کاربری شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی اینکه آیا سطح هدف معتبر است
    if (targetTier < 1 || targetTier >= BANK_ACCOUNT_TIERS.length) {
      await interaction.reply({
        content: '❌ سطح حساب انتخاب شده نامعتبر است!',
        ephemeral: true
      });
      return;
    }
    
    // دریافت اطلاعات سطح فعلی و هدف
    const currentTier = user.bankAccountTier || 0;
    const currentTierInfo = getBankAccountTierInfo(currentTier);
    const targetTierInfo = getBankAccountTierInfo(targetTier);
    
    // بررسی شرایط ارتقاء و ایجاد پیام‌های خطا زیبا با Embed
    if (currentTier >= targetTier) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FFA500') // نارنجی
        .setTitle(`⚠️ خطا در ارتقاء حساب`)
        .setDescription(`حساب شما قبلاً به سطح **${currentTierInfo.emoji} ${currentTierInfo.name}** ارتقاء یافته است!`)
        .setThumbnail('https://img.icons8.com/fluency/96/warning-shield.png')
        .setFooter({ 
          text: interaction.user.username, 
          iconURL: interaction.user.displayAvatarURL() 
        });
      
      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
      return;
    }
    
    if (currentTier < targetTier - 1) {
      const previousTierInfo = getBankAccountTierInfo(targetTier - 1);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000') // قرمز
        .setTitle(`❌ خطا در ارتقاء حساب`)
        .setDescription(`شما باید ابتدا به سطح **${previousTierInfo.emoji} ${previousTierInfo.name}** ارتقاء دهید!
        
🔄 **روند صحیح ارتقاء:**
${getBankAccountTierInfo(currentTier).emoji} ${getBankAccountTierInfo(currentTier).name} ➡️ ${previousTierInfo.emoji} ${previousTierInfo.name} ➡️ ${targetTierInfo.emoji} ${targetTierInfo.name}`)
        .setThumbnail('https://img.icons8.com/fluency/96/cancel.png')
        .setFooter({ 
          text: interaction.user.username, 
          iconURL: interaction.user.displayAvatarURL() 
        });
      
      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
      return;
    }
    
    if (user.crystals < targetTierInfo.upgradeCost) {
      // محاسبه درصد کریستال‌های موجود
      const crystalPercentage = Math.floor((user.crystals / targetTierInfo.upgradeCost) * 100);
      const crystalsNeeded = targetTierInfo.upgradeCost - user.crystals;
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000') // قرمز
        .setTitle(`💎 کریستال ناکافی`)
        .setDescription(`شما کریستال کافی برای ارتقاء به **${targetTierInfo.emoji} ${targetTierInfo.name}** ندارید!
        
**💰 وضعیت موجودی شما:**
▪️ کریستال‌های فعلی: **${user.crystals.toLocaleString('fa-IR')}** 💎
▪️ کریستال مورد نیاز: **${targetTierInfo.upgradeCost.toLocaleString('fa-IR')}** 💎
▪️ کمبود: **${crystalsNeeded.toLocaleString('fa-IR')}** 💎
        
**پیشرفت شما:** ${crystalPercentage}%
[${'▰'.repeat(Math.floor(crystalPercentage / 10))}${'▱'.repeat(10 - Math.floor(crystalPercentage / 10))}]`)
        .setThumbnail('https://img.icons8.com/fluency/96/gem-stone.png')
        .setFooter({ 
          text: `${interaction.user.username} | برای کسب کریستال می‌توانید در سرگرمی‌ها و مینی‌گیم‌ها شرکت کنید`, 
          iconURL: interaction.user.displayAvatarURL() 
        });
      
      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
      return;
    }
    
    // انجام ارتقاء
    const updatedUser = await storage.upgradeUserBankAccount(user.id, targetTier);
    
    if (!updatedUser) {
      // ایجاد پیام خطای سیستمی زیبا با امبد
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000') // قرمز
        .setTitle(`⚠️ خطای سیستمی`)
        .setDescription(`متأسفانه در فرآیند ارتقاء حساب خطایی رخ داد! لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.`)
        .setThumbnail('https://img.icons8.com/fluency/96/error.png')
        .setFooter({ 
          text: `${interaction.user.username} | خطای سیستمی با کد: ERR-BANK-UPG-${Date.now().toString().slice(-6)}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();
      
      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
      return;
    }
    
    // ایجاد پیام موفقیت زیبا با اموجی‌های بیشتر و تصویر
    const successEmbed = new EmbedBuilder()
      .setColor(targetTierInfo.color)
      .setTitle(`✨🎉 ارتقاء حساب با موفقیت انجام شد 🎉✨`)
      .setDescription(`
🎯 **تبریک!** حساب بانکی شما با موفقیت به **${targetTierInfo.emoji} حساب ${targetTierInfo.name}** ارتقاء یافت!
      
🔸 **مزایای جدید حساب شما:**`)
      .setThumbnail('https://img.icons8.com/fluency/96/bank-building.png') // افزودن تصویر بانک
      .addFields([
        ...targetTierInfo.benefits.map((benefit, index) => ({
          name: index === 0 ? '💫 ویژگی‌های حساب جدید' : '\u200B',
          value: benefit,
          inline: true
        })),
        {
          name: '💹 اطلاعات مالی',
          value: `
💸 **سقف تراکنش:** ${targetTierInfo.transferLimit.toLocaleString('fa-IR')} سکه
💰 **سود روزانه:** ${(targetTierInfo.interestRate * 100)}٪
💎 **هزینه ارتقاء:** ${targetTierInfo.upgradeCost.toLocaleString('fa-IR')} کریستال
`,
          inline: false
        }
      ])
      .setFooter({
        text: `${interaction.user.username} | از حساب شما ${targetTierInfo.upgradeCost.toLocaleString('fa-IR')} کریستال کسر شد`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    // ارسال پیام موفقیت
    await interaction.reply({
      embeds: [successEmbed],
      ephemeral: true
    });
    
    // به‌روزرسانی منوی ارتقاء پس از چند ثانیه
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await bankUpgradeMenu(interaction, true);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error processing bank account upgrade:', error);
    
    // ایجاد پیام خطای سیستمی زیبا با امبد در بخش catch
    const errorEmbed = new EmbedBuilder()
      .setColor('#FF0000') // قرمز
      .setTitle(`❌ خطای غیرمنتظره`)
      .setDescription(`متأسفانه در فرآیند ارتقاء حساب خطای غیرمنتظره‌ای رخ داد! لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.`)
      .setThumbnail('https://img.icons8.com/fluency/96/cancel.png')
      .setFooter({ 
        text: `${interaction.user.username} | خطای سیستمی با کد: ERR-BANK-UPG-${Date.now().toString().slice(-6)}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();
    
    await interaction.reply({
      embeds: [errorEmbed],
      ephemeral: true
    });
  }
}