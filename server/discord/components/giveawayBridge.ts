import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, ModalSubmitInteraction } from 'discord.js';
import { storage } from '../../storage';
import axios from 'axios';
import { config } from '../utils/giveawayConfig';

// آدرس API ربات گیواوی
const GIVEAWAY_API_URL = process.env.GIVEAWAY_API_URL || 'http://localhost:3000/api';
// کلید امنیتی برای ارتباط بین ربات‌ها
const GIVEAWAY_API_KEY = process.env.GIVEAWAY_API_KEY || 'default_secure_key_change_this';

/**
 * نمایش منوی اتصال به ربات گیواوی
 */
export async function giveawayBridgeMenu(
  interaction: MessageComponentInteraction
) {
  try {
    // بررسی وجود کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      return await interaction.reply({ 
        content: '❌ حساب کاربری شما یافت نشد. لطفا از منوی اصلی دوباره شروع کنید.', 
        ephemeral: true 
      });
    }

    // دریافت موجودی از ربات گیواوی
    let giveawayBalance = await getGiveawayBalance(interaction.user.id);
    let ticketCount = 0;

    if (giveawayBalance.success) {
      ticketCount = giveawayBalance.tickets || 0;
    }

    // ساخت امبد اطلاعات
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎟️ سیستم قرعه‌کشی')
      .setDescription(`به سیستم ارتباط با ربات قرعه‌کشی خوش آمدید.
      
با استفاده از این سیستم، می‌توانید سکه‌های Ccoin خود را به بلیط قرعه‌کشی تبدیل کنید و در قرعه‌کشی‌های ربات گیواوی شرکت کنید.

**💰 موجودی کیف پول شما:** ${user.wallet} Ccoin
**🎫 بلیط‌های قرعه‌کشی شما:** ${giveawayBalance.success ? ticketCount : '⚠️ خطا در دریافت'}

**💸 قیمت هر بلیط:** ${config.ticketPrice} Ccoin

با خرید بلیط قرعه‌کشی، شانس خود را برای برنده شدن جوایز افزایش دهید!`)
      .setThumbnail('https://img.icons8.com/fluency/48/gift.png') // آیکون gift برای گیواوی
      .setFooter({ text: 'ربات اقتصادی Ccoin' })
      .setTimestamp();

    // دکمه‌های منو
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_buy_tickets')
          .setLabel('🎫 خرید بلیط')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('giveaway_check_balance')
          .setLabel('💰 بررسی موجودی')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت به منوی اصلی')
          .setStyle(ButtonStyle.Danger)
      );

    // ارسال منو
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
  } catch (error) {
    console.error('Error in giveaway bridge menu:', error);
    await interaction.reply({ 
      content: '❌ خطایی در نمایش منوی ارتباط با ربات قرعه‌کشی رخ داد. لطفا دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * دریافت موجودی بلیط‌های کاربر از ربات گیواوی
 */
export async function getGiveawayBalance(userId: string) {
  try {
    // بررسی فعال بودن ارتباط با ربات گیواوی
    if (!config.enabled || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      console.log('Giveaway API is disabled or running in test/dev mode. Returning mock data.');
      return { success: true, tickets: 0, message: 'Test/disabled environment' };
    }

    // تلاش برای دریافت اطلاعات با تایم‌اوت کوتاه (3 ثانیه)
    const response = await axios.get(`${GIVEAWAY_API_URL}/user/${userId}/balance`, {
      headers: {
        'Authorization': `Bearer ${GIVEAWAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 3000 // 3 seconds timeout to prevent hanging
    });

    if (response.status === 200) {
      return { 
        success: true, 
        tickets: response.data.tickets || 0,
        message: 'اطلاعات با موفقیت دریافت شد'
      };
    } else {
      console.warn('Non-200 response from giveaway API:', response.status);
      return { success: false, message: 'خطا در دریافت اطلاعات از ربات قرعه‌کشی' };
    }
  } catch (error) {
    // برای جلوگیری از پر شدن لاگ در حالتی که سرور گیوی‌آوی در دسترس نیست، 
    // پیام خطا را به صورت کامل لاگ نمی‌کنیم
    console.warn('Error fetching giveaway balance. API might be unavailable.');
    return { success: false, message: 'خطا در برقراری ارتباط با ربات قرعه‌کشی' };
  }
}

/**
 * خرید بلیط قرعه‌کشی با سکه‌های Ccoin
 */
export async function buyGiveawayTickets(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
  amount: number
) {
  try {
    // بررسی وجود کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      return await interaction.reply({ 
        content: '❌ حساب کاربری شما یافت نشد.', 
        ephemeral: true 
      });
    }

    // محاسبه هزینه کل
    const totalCost = amount * config.ticketPrice;

    // بررسی کافی بودن موجودی
    if (user.wallet < totalCost) {
      return await interaction.reply({ 
        content: `❌ موجودی کافی نیست. شما به ${totalCost} Ccoin نیاز دارید اما فقط ${user.wallet} Ccoin در کیف پول خود دارید.`, 
        ephemeral: true 
      });
    }

    // کسر سکه از کیف پول کاربر
    await storage.addToWallet(user.id, -totalCost, 'lottery_ticket', {
      ticketAmount: amount,
      totalCost: totalCost
    });

    // بررسی فعال بودن ارتباط با ربات گیواوی
    if (!config.enabled || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      console.log('Giveaway API is disabled or running in test/dev mode. Simulating successful ticket purchase.');
      // در محیط تست، به صورت شبیه‌سازی عمل می‌کنیم
      return await interaction.reply({ 
        content: `✅ ${amount} بلیط قرعه‌کشی با موفقیت خریداری شد. (حالت تست)`, 
        ephemeral: true 
      });
    }
    
    // ارسال درخواست به API ربات گیواوی برای افزودن بلیط
    let ticketAdded = false;
    try {
      const response = await axios.post(`${GIVEAWAY_API_URL}/user/${interaction.user.id}/tickets/add`, {
        amount: amount,
        source: 'ccoin_bot',
        transactionId: Date.now().toString()
      }, {
        headers: {
          'Authorization': `Bearer ${GIVEAWAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000 // 3 seconds timeout to prevent hanging
      });

      ticketAdded = response.status === 200;
    } catch (apiError) {
      console.warn('Error connecting to giveaway API. It might be unavailable.');
      // در صورت خطا در API، سکه‌ها را به کاربر برمی‌گردانیم
      await storage.addToWallet(user.id, totalCost);
      
      return await interaction.reply({ 
        content: '❌ خطا در ارتباط با سرور قرعه‌کشی. سکه‌های شما برگردانده شد.', 
        ephemeral: true 
      });
    }

    if (ticketAdded) {
      // دریافت موجودی جدید از ربات گیواوی
      const newBalance = await getGiveawayBalance(interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF88')
        .setTitle('✅ خرید بلیط موفق')
        .setDescription(`شما با موفقیت ${amount} بلیط قرعه‌کشی خریداری کردید.`)
        .setThumbnail('https://img.icons8.com/fluency/48/task-completed.png') // آیکون task-completed برای موفقیت
        .addFields(
          { name: '💰 هزینه هر بلیط', value: `${config.ticketPrice} Ccoin`, inline: true },
          { name: '🔢 تعداد', value: `${amount} بلیط`, inline: true },
          { name: '💲 مبلغ کل', value: `${totalCost} Ccoin`, inline: true },
          { name: '🎫 بلیط‌های فعلی شما', value: `${newBalance.success ? newBalance.tickets : '⚠️ خطا در دریافت'}`, inline: true },
          { name: '💰 موجودی فعلی کیف پول', value: `${user.wallet - totalCost} Ccoin`, inline: true }
        )
        .setFooter({ text: 'ربات اقتصادی Ccoin' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('giveaway_bridge')
            .setLabel('🔙 بازگشت به منوی قرعه‌کشی')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    } else {
      // در صورت عدم موفقیت در افزودن بلیط، سکه‌ها را برمی‌گردانیم
      await storage.addToWallet(user.id, totalCost);
      
      await interaction.reply({ 
        content: '❌ خطا در خرید بلیط. سکه‌های شما برگردانده شد.', 
        ephemeral: true 
      });
    }
  } catch (error) {
    console.error('Error buying giveaway tickets:', error);
    await interaction.reply({ 
      content: '❌ خطایی در خرید بلیط رخ داد. لطفا دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * بررسی موجودی بلیط و سکه کاربر
 */
export async function checkGiveawayBalance(interaction: MessageComponentInteraction) {
  try {
    // بررسی وجود کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      return await interaction.reply({ 
        content: '❌ حساب کاربری شما یافت نشد.', 
        ephemeral: true 
      });
    }

    // دریافت موجودی از ربات گیواوی
    const giveawayBalance = await getGiveawayBalance(interaction.user.id);
    
    // متن بخش بلیط‌های قرعه‌کشی
    let ticketText = '⚠️ خطا در دریافت اطلاعات';
    
    if (giveawayBalance.success) {
      ticketText = `${giveawayBalance.tickets} بلیط`;
    } else if (!config.enabled) {
      ticketText = '0 بلیط (سیستم قرعه‌کشی غیرفعال است)';
    }

    const embed = new EmbedBuilder()
      .setColor('#00BFFF')
      .setTitle('💰 موجودی حساب شما')
      .setDescription('اطلاعات موجودی شما در سیستم Ccoin و قرعه‌کشی:')
      .setThumbnail('https://img.icons8.com/fluency/48/money-transfer.png') // آیکون money-transfer برای موجودی
      .addFields(
        { name: '💰 موجودی Ccoin', value: `کیف پول: ${user.wallet} Ccoin\nبانک: ${user.bank} Ccoin`, inline: false },
        { name: '💎 کریستال', value: `${user.crystals} کریستال`, inline: false },
        { name: '🎫 بلیط‌های قرعه‌کشی', value: ticketText, inline: false }
      )
      .setFooter({ text: 'ربات اقتصادی Ccoin' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_bridge')
          .setLabel('🔙 بازگشت به منوی قرعه‌کشی')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  } catch (error) {
    console.warn('Error checking giveaway balance:', error);
    await interaction.reply({ 
      content: '❌ خطایی در بررسی موجودی رخ داد. لطفا دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}