/**
 * منوی ارتقاء حساب بانکی Ccoin
 * امکان ارتقاء حساب بانکی با استفاده از کریستال و دریافت مزایای مختلف
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

// تعریف سطوح حساب بانکی و مشخصات هر سطح
const BANK_ACCOUNT_TIERS = [
  { 
    id: 0, 
    name: 'معمولی', 
    emoji: '🟢', 
    color: 0x2ECC71, 
    interestRate: 0.02,
    transferLimit: 5000,
    upgradeCost: 0,
    description: 'حساب پایه با امکانات اولیه'
  },
  { 
    id: 1, 
    name: 'نقره‌ای', 
    emoji: '🥈', 
    color: 0x95a5a6, 
    interestRate: 0.05,
    transferLimit: 10000,
    upgradeCost: 500,
    description: 'سقف تراکنش بالاتر، سود ۵٪ روزانه و نقش ویژه در سرور'
  },
  { 
    id: 2, 
    name: 'طلایی', 
    emoji: '🥇', 
    color: 0xf1c40f, 
    interestRate: 0.10,
    transferLimit: 50000,
    upgradeCost: 1500,
    description: 'سقف تراکنش بالا، سود ۱۰٪ روزانه و دسترسی به کانال ویژه'
  },
  { 
    id: 3, 
    name: 'الماسی', 
    emoji: '💎', 
    color: 0x3498db, 
    interestRate: 0.15,
    transferLimit: 200000,
    upgradeCost: 3000,
    description: 'سقف تراکنش بسیار بالا، سود ۱۵٪ روزانه و نشان اختصاصی'
  },
  { 
    id: 4, 
    name: 'افسانه‌ای', 
    emoji: '🌟', 
    color: 0x9b59b6, 
    interestRate: 0.20,
    transferLimit: Infinity,
    upgradeCost: 5000,
    description: 'سقف تراکنش نامحدود، سود ۲۰٪ روزانه و ایموجی اختصاصی'
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
    
    // ایجاد Embed اصلی منو
    const embed = new EmbedBuilder()
      .setColor(currentTierInfo.color)
      .setTitle(`🌟 ارتقاء حساب بانکی شما 🌟`)
      .setDescription(`با ارتقاء حساب بانکی، به امکانات ویژه و سود بیشتر دسترسی پیدا کنید!
      
سطح فعلی حساب شما: **${currentTierInfo.emoji} حساب ${currentTierInfo.name}**
مقدار کریستال شما: **${user.crystals} 💎**`)
      .setThumbnail('https://img.icons8.com/fluency/96/bank-building.png')
      .setFooter({ 
        text: `${interaction.user.username} | برای ارتقاء حساب به کریستال نیاز دارید`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();
    
    // افزودن فیلدهای مربوط به سطوح مختلف حساب
    for (const tier of BANK_ACCOUNT_TIERS) {
      if (tier.id === 0) continue; // سطح پایه را نمایش نمی‌دهیم
      
      const alreadyUpgraded = currentTier >= tier.id;
      const canUpgrade = currentTier === tier.id - 1;
      const hasEnoughCrystals = user.crystals >= tier.upgradeCost;
      
      let statusText = '';
      if (alreadyUpgraded) {
        statusText = '✅ فعال شده';
      } else if (canUpgrade) {
        statusText = hasEnoughCrystals ? '🔓 قابل ارتقاء' : `❌ کریستال ناکافی (نیاز: ${tier.upgradeCost})`;
      } else {
        statusText = '🔒 قفل (ابتدا سطح قبلی را ارتقاء دهید)';
      }
      
      embed.addFields({
        name: `${tier.emoji} حساب ${tier.name}`,
        value: `**مزایا:**
- سقف تراکنش: ${tier.transferLimit.toLocaleString('fa-IR')} Ccoin
- سود روزانه: ${(tier.interestRate * 100)}٪
- ${tier.description}

**هزینه ارتقاء:** ${tier.upgradeCost} کریستال 💎
**وضعیت:** ${statusText}`,
        inline: false
      });
    }
    
    // ایجاد دکمه‌های ارتقاء
    const buttons: ButtonBuilder[] = [];
    
    // دکمه‌های ارتقاء برای هر سطح
    for (let i = 1; i < BANK_ACCOUNT_TIERS.length; i++) {
      const tier = BANK_ACCOUNT_TIERS[i];
      const canUpgrade = currentTier === tier.id - 1;
      const hasEnoughCrystals = user.crystals >= tier.upgradeCost;
      
      if (canUpgrade) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`upgrade_bank_${tier.id}`)
            .setLabel(`ارتقاء به ${tier.name} ${tier.emoji}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!hasEnoughCrystals)
        );
      }
    }
    
    // اگر هیچ دکمه‌ای نداریم، یک دکمه غیرفعال اضافه می‌کنیم
    if (buttons.length === 0 && currentTier >= BANK_ACCOUNT_TIERS.length - 1) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId('bank_upgrade_max')
          .setLabel('🌟 شما به بالاترین سطح حساب رسیده‌اید!')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      );
    } else if (buttons.length === 0) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId('bank_upgrade_unavailable')
          .setLabel('❌ ارتقاء در دسترس نیست')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }
    
    // دکمه بازگشت
    buttons.push(
      new ButtonBuilder()
        .setCustomId('bank_menu')
        .setLabel('🔙 بازگشت')
        .setStyle(ButtonStyle.Secondary)
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
    
    // بررسی شرایط ارتقاء
    if (currentTier >= targetTier) {
      await interaction.reply({
        content: `⚠️ حساب شما قبلاً به سطح ${currentTierInfo.emoji} ${currentTierInfo.name} ارتقاء یافته است!`,
        ephemeral: true
      });
      return;
    }
    
    if (currentTier < targetTier - 1) {
      await interaction.reply({
        content: `❌ شما باید ابتدا به سطح ${getBankAccountTierInfo(targetTier - 1).name} ارتقاء دهید!`,
        ephemeral: true
      });
      return;
    }
    
    if (user.crystals < targetTierInfo.upgradeCost) {
      await interaction.reply({
        content: `❌ کریستال کافی برای ارتقاء ندارید!
شما به ${targetTierInfo.upgradeCost} کریستال نیاز دارید، اما فقط ${user.crystals} کریستال دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // انجام ارتقاء
    const updatedUser = await storage.upgradeUserBankAccount(user.id, targetTier);
    
    if (!updatedUser) {
      await interaction.reply({
        content: '❌ متأسفانه در فرآیند ارتقاء حساب خطایی رخ داد!',
        ephemeral: true
      });
      return;
    }
    
    // ارسال پیام موفقیت
    await interaction.reply({
      content: `🎉 تبریک! حساب بانکی شما با موفقیت به **${targetTierInfo.emoji} حساب ${targetTierInfo.name}** ارتقاء یافت!
      
💰 از مزایای جدید حساب خود لذت ببرید:
- سقف تراکنش: ${targetTierInfo.transferLimit.toLocaleString('fa-IR')} Ccoin
- سود روزانه: ${(targetTierInfo.interestRate * 100)}٪
- ${targetTierInfo.description}

💎 از حساب شما ${targetTierInfo.upgradeCost} کریستال کسر شد.`,
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
    await interaction.reply({
      content: '❌ متأسفانه در فرآیند ارتقاء حساب خطایی رخ داد!',
      ephemeral: true
    });
  }
}