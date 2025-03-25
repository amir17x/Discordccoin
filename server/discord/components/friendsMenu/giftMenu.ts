import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { storage } from '../../../storage';
import { formatNumber, formatDate, formatRelativeTime } from '../../utils/formatter';

/**
 * منوی هدیه دادن به دوستان
 * @param interaction برهم‌کنش با کاربر
 * @param friendId شناسه دوست
 */
export async function giftToFriendMenu(interaction: MessageComponentInteraction, friendId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    const friend = await storage.getUser(friendId);
    
    if (!user || !friend) {
      return await interaction.reply({
        content: "❌ کاربر یا دوست مورد نظر یافت نشد!",
        ephemeral: true
      });
    }
    
    // دریافت اطلاعات دوستی
    const friends = await storage.getFriends(user.id);
    const friendship = friends.find(f => f.friendId === friend.discordId);
    
    if (!friendship) {
      return await interaction.reply({
        content: "❌ این کاربر در لیست دوستان شما نیست!",
        ephemeral: true
      });
    }
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#E74C3C') // قرمز
      .setTitle(`🎁 هدیه دادن به ${friend.username}`)
      .setDescription(`${user.username} عزیز، شما می‌توانید به دوست خود هدیه بدهید و XP دوستی کسب کنید!`)
      .setThumbnail('https://img.icons8.com/fluency/48/gift.png');
    
    // اضافه کردن اطلاعات موجودی
    embed.addFields(
      { name: '💰 موجودی سکه شما', value: `${formatNumber(user.wallet)} Ccoin`, inline: true },
      { name: '💎 موجودی کریستال شما', value: `${formatNumber(user.crystals)}`, inline: true }
    );
    
    // اضافه کردن اطلاعات XP دوستی
    embed.addFields(
      { name: '✨ امتیاز دوستی فعلی', value: `${friendship.friendshipXP} XP (سطح ${friendship.friendshipLevel})`, inline: false },
      { name: '💡 راهنمای XP', value: '• هدیه سکه: 10 XP\n• هدیه کریستال: 20 XP\n• هدیه روزانه: 5 XP', inline: false }
    );
    
    // بررسی آیا هدیه روزانه قبلاً فرستاده شده است
    const dailyGiftSent = await hasUserSentDailyGift(user.id, friend.id);
    const dailyButtonStyle = dailyGiftSent ? ButtonStyle.Secondary : ButtonStyle.Success;
    const dailyButtonLabel = dailyGiftSent ? '✅ هدیه روزانه ارسال شده' : '🌟 ارسال هدیه روزانه';
    const dailyButtonDisabled = dailyGiftSent;
    
    // دکمه‌های انواع هدیه
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gift_coin_${friendId}`)
          .setLabel('💰 هدیه سکه')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`gift_crystal_${friendId}`)
          .setLabel('💎 هدیه کریستال')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`gift_daily_${friendId}`)
          .setLabel(dailyButtonLabel)
          .setStyle(dailyButtonStyle)
          .setDisabled(dailyButtonDisabled)
      );
    
    // دکمه‌های مقادیر سکه
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gift_coin_${friendId}_100`)
          .setLabel('100 Ccoin')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`gift_coin_${friendId}_500`)
          .setLabel('500 Ccoin')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`gift_coin_${friendId}_1000`)
          .setLabel('1000 Ccoin')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // دکمه‌های مقادیر کریستال
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gift_crystal_${friendId}_1`)
          .setLabel('1 کریستال')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`gift_crystal_${friendId}_5`)
          .setLabel('5 کریستال')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`gift_crystal_${friendId}_10`)
          .setLabel('10 کریستال')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // دکمه بازگشت
    const row4 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`friendship_details_${friend.discordId}`)
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row1, row2, row3, row4]
    });
    
  } catch (error) {
    console.error("Error in giftToFriendMenu:", error);
    await interaction.reply({
      content: "❌ خطایی در نمایش منوی هدیه رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * ارسال فرم هدیه سکه
 * @param interaction برهم‌کنش با کاربر
 * @param friendId شناسه دوست
 */
export async function showCoinGiftModal(interaction: MessageComponentInteraction, friendId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    const friend = await storage.getUser(friendId);
    
    if (!user || !friend) {
      return await interaction.reply({
        content: "❌ کاربر یا دوست مورد نظر یافت نشد!",
        ephemeral: true
      });
    }
    
    // ایجاد فرم مودال
    const modal = new ModalBuilder()
      .setCustomId(`modal_gift_coin_${friendId}`)
      .setTitle(`هدیه سکه به ${friend.username}`);
    
    // ایجاد فیلد ورودی مقدار سکه
    const coinAmountInput = new TextInputBuilder()
      .setCustomId('coin_amount')
      .setLabel('مقدار سکه')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مقدار سکه را وارد کنید (مثلاً: 100)')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(10);
    
    // ایجاد فیلد ورودی پیام اختیاری
    const messageInput = new TextInputBuilder()
      .setCustomId('message')
      .setLabel('پیام (اختیاری)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('پیام دلخواه برای دوست خود بنویسید')
      .setRequired(false)
      .setMaxLength(200);
    
    // اضافه کردن فیلدها به فرم
    const coinAmountRow = new ActionRowBuilder<TextInputBuilder>().addComponents(coinAmountInput);
    const messageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
    
    modal.addComponents(coinAmountRow, messageRow);
    
    // نمایش فرم
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error("Error in showCoinGiftModal:", error);
    await interaction.reply({
      content: "❌ خطایی در نمایش فرم هدیه سکه رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * ارسال فرم هدیه کریستال
 * @param interaction برهم‌کنش با کاربر
 * @param friendId شناسه دوست
 */
export async function showCrystalGiftModal(interaction: MessageComponentInteraction, friendId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    const friend = await storage.getUser(friendId);
    
    if (!user || !friend) {
      return await interaction.reply({
        content: "❌ کاربر یا دوست مورد نظر یافت نشد!",
        ephemeral: true
      });
    }
    
    // ایجاد فرم مودال
    const modal = new ModalBuilder()
      .setCustomId(`modal_gift_crystal_${friendId}`)
      .setTitle(`هدیه کریستال به ${friend.username}`);
    
    // ایجاد فیلد ورودی مقدار کریستال
    const crystalAmountInput = new TextInputBuilder()
      .setCustomId('crystal_amount')
      .setLabel('مقدار کریستال')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مقدار کریستال را وارد کنید (مثلاً: 5)')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(3);
    
    // ایجاد فیلد ورودی پیام اختیاری
    const messageInput = new TextInputBuilder()
      .setCustomId('message')
      .setLabel('پیام (اختیاری)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('پیام دلخواه برای دوست خود بنویسید')
      .setRequired(false)
      .setMaxLength(200);
    
    // اضافه کردن فیلدها به فرم
    const crystalAmountRow = new ActionRowBuilder<TextInputBuilder>().addComponents(crystalAmountInput);
    const messageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
    
    modal.addComponents(crystalAmountRow, messageRow);
    
    // نمایش فرم
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error("Error in showCrystalGiftModal:", error);
    await interaction.reply({
      content: "❌ خطایی در نمایش فرم هدیه کریستال رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * ارسال هدیه سکه به دوست
 * @param interaction برهم‌کنش با کاربر
 * @param friendId شناسه دوست
 * @param amount مقدار سکه
 * @param message پیام اختیاری
 */
export async function sendCoinGift(interaction: MessageComponentInteraction, friendId: number, amount: number, message?: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    const friend = await storage.getUser(friendId);
    
    if (!user || !friend) {
      return await interaction.reply({
        content: "❌ کاربر یا دوست مورد نظر یافت نشد!",
        ephemeral: true
      });
    }
    
    // بررسی موجودی کافی
    if (user.wallet < amount) {
      return await interaction.reply({
        content: "❌ موجودی شما کافی نیست!",
        ephemeral: true
      });
    }
    
    // بررسی مقدار معتبر
    if (amount <= 0) {
      return await interaction.reply({
        content: "❌ مقدار هدیه باید بیشتر از صفر باشد!",
        ephemeral: true
      });
    }
    
    // انتقال سکه به دوست
    const success = await storage.transferCoin(user.id, friend.id, amount);
    
    if (!success) {
      return await interaction.reply({
        content: "❌ خطایی در ارسال هدیه رخ داد!",
        ephemeral: true
      });
    }
    
    // محاسبه XP دوستی
    const xpAmount = 10; // مقدار ثابت برای هدیه سکه
    
    // افزایش XP دوستی
    await increaseFriendshipXP(user.id, friend.id, xpAmount);
    
    // ثبت فعالیت دوستی
    await storage.recordFriendshipActivity(user.id, friend.id, 'gift', `${amount} سکه هدیه داد`, xpAmount);
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#2ECC71') // سبز
      .setTitle('✅ هدیه با موفقیت ارسال شد')
      .setDescription(`شما با موفقیت ${formatNumber(amount)} سکه به ${friend.username} هدیه دادید!`)
      .setThumbnail('https://img.icons8.com/fluency/48/gift.png')
      .addFields(
        { name: '✨ امتیاز دوستی دریافتی', value: `${xpAmount} XP`, inline: true }
      );
    
    if (message) {
      embed.addFields({ name: '💬 پیام شما', value: message, inline: false });
    }
    
    // دکمه‌های عملیات
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gift_menu_${friendId}`)
          .setLabel('🎁 ارسال هدیه دیگر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`friendship_details_${friend.discordId}`)
          .setLabel('🔙 بازگشت به جزئیات دوستی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
    // اطلاع‌رسانی به دوست
    const guild = interaction.guild;
    const member = guild?.members.cache.get(friend.discordId);
    
    if (member) {
      try {
        const notificationEmbed = new EmbedBuilder()
          .setColor('#E74C3C') // قرمز
          .setTitle('🎁 هدیه جدید دریافت کردید!')
          .setDescription(`${user.username} به شما ${formatNumber(amount)} سکه هدیه داد!`)
          .setThumbnail('https://img.icons8.com/fluency/48/gift.png');
        
        if (message) {
          notificationEmbed.addFields({ name: '💬 پیام دوست شما', value: message, inline: false });
        }
        
        await member.send({ embeds: [notificationEmbed] }).catch(() => {});
      } catch (error) {
        console.error("Error sending notification to friend:", error);
      }
    }
    
  } catch (error) {
    console.error("Error in sendCoinGift:", error);
    await interaction.reply({
      content: "❌ خطایی در ارسال هدیه سکه رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * ارسال هدیه کریستال به دوست
 * @param interaction برهم‌کنش با کاربر
 * @param friendId شناسه دوست
 * @param amount مقدار کریستال
 * @param message پیام اختیاری
 */
export async function sendCrystalGift(interaction: MessageComponentInteraction, friendId: number, amount: number, message?: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    const friend = await storage.getUser(friendId);
    
    if (!user || !friend) {
      return await interaction.reply({
        content: "❌ کاربر یا دوست مورد نظر یافت نشد!",
        ephemeral: true
      });
    }
    
    // بررسی موجودی کافی
    if (user.crystals < amount) {
      return await interaction.reply({
        content: "❌ موجودی کریستال شما کافی نیست!",
        ephemeral: true
      });
    }
    
    // بررسی مقدار معتبر
    if (amount <= 0) {
      return await interaction.reply({
        content: "❌ مقدار هدیه باید بیشتر از صفر باشد!",
        ephemeral: true
      });
    }
    
    // کم کردن کریستال از کاربر
    await storage.addCrystals(user.id, -amount);
    
    // اضافه کردن کریستال به دوست
    await storage.addCrystals(friend.id, amount);
    
    // محاسبه XP دوستی
    const xpAmount = 20; // مقدار ثابت برای هدیه کریستال
    
    // افزایش XP دوستی
    await increaseFriendshipXP(user.id, friend.id, xpAmount);
    
    // ثبت فعالیت دوستی
    await storage.recordFriendshipActivity(user.id, friend.id, 'gift', `${amount} کریستال هدیه داد`, xpAmount);
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#2ECC71') // سبز
      .setTitle('✅ هدیه با موفقیت ارسال شد')
      .setDescription(`شما با موفقیت ${formatNumber(amount)} کریستال به ${friend.username} هدیه دادید!`)
      .setThumbnail('https://img.icons8.com/fluency/48/gift.png')
      .addFields(
        { name: '✨ امتیاز دوستی دریافتی', value: `${xpAmount} XP`, inline: true }
      );
    
    if (message) {
      embed.addFields({ name: '💬 پیام شما', value: message, inline: false });
    }
    
    // دکمه‌های عملیات
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gift_menu_${friendId}`)
          .setLabel('🎁 ارسال هدیه دیگر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`friendship_details_${friend.discordId}`)
          .setLabel('🔙 بازگشت به جزئیات دوستی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
    // اطلاع‌رسانی به دوست
    const guild = interaction.guild;
    const member = guild?.members.cache.get(friend.discordId);
    
    if (member) {
      try {
        const notificationEmbed = new EmbedBuilder()
          .setColor('#E74C3C') // قرمز
          .setTitle('🎁 هدیه جدید دریافت کردید!')
          .setDescription(`${user.username} به شما ${formatNumber(amount)} کریستال هدیه داد!`)
          .setThumbnail('https://img.icons8.com/fluency/48/gift.png');
        
        if (message) {
          notificationEmbed.addFields({ name: '💬 پیام دوست شما', value: message, inline: false });
        }
        
        await member.send({ embeds: [notificationEmbed] }).catch(() => {});
      } catch (error) {
        console.error("Error sending notification to friend:", error);
      }
    }
    
  } catch (error) {
    console.error("Error in sendCrystalGift:", error);
    await interaction.reply({
      content: "❌ خطایی در ارسال هدیه کریستال رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * ارسال هدیه روزانه به دوست
 * @param interaction برهم‌کنش با کاربر
 * @param friendId شناسه دوست
 */
export async function sendDailyGift(interaction: MessageComponentInteraction, friendId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    const friend = await storage.getUser(friendId);
    
    if (!user || !friend) {
      return await interaction.reply({
        content: "❌ کاربر یا دوست مورد نظر یافت نشد!",
        ephemeral: true
      });
    }
    
    // بررسی آیا هدیه روزانه قبلاً فرستاده شده است
    const dailyGiftSent = await hasUserSentDailyGift(user.id, friend.id);
    
    if (dailyGiftSent) {
      return await interaction.reply({
        content: "❌ شما امروز قبلاً هدیه روزانه به این دوست فرستاده‌اید!",
        ephemeral: true
      });
    }
    
    // مقدار هدیه روزانه
    const coinAmount = 10;
    const crystalAmount = 1;
    
    // اضافه کردن سکه و کریستال به دوست
    await storage.addToWallet(friend.id, coinAmount, 'daily_gift', { from_user_id: user.id });
    await storage.addCrystals(friend.id, crystalAmount);
    
    // محاسبه XP دوستی
    const xpAmount = 5; // مقدار ثابت برای هدیه روزانه
    
    // افزایش XP دوستی
    await increaseFriendshipXP(user.id, friend.id, xpAmount);
    
    // ثبت ارسال هدیه روزانه
    await storage.recordDailyGift(user.id, friend.id);
    
    // ثبت فعالیت دوستی
    await storage.recordFriendshipActivity(user.id, friend.id, 'gift', `هدیه روزانه ارسال کرد (${coinAmount} سکه + ${crystalAmount} کریستال)`, xpAmount);
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#2ECC71') // سبز
      .setTitle('✅ هدیه روزانه با موفقیت ارسال شد')
      .setDescription(`شما با موفقیت هدیه روزانه به ${friend.username} ارسال کردید!`)
      .setThumbnail('https://img.icons8.com/fluency/48/gift.png')
      .addFields(
        { name: '🎁 مقدار هدیه', value: `${coinAmount} سکه + ${crystalAmount} کریستال`, inline: true },
        { name: '✨ امتیاز دوستی دریافتی', value: `${xpAmount} XP`, inline: true }
      );
    
    // دکمه‌های عملیات
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gift_menu_${friendId}`)
          .setLabel('🎁 منوی هدیه')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`friendship_details_${friend.discordId}`)
          .setLabel('🔙 بازگشت به جزئیات دوستی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
    // اطلاع‌رسانی به دوست
    const guild = interaction.guild;
    const member = guild?.members.cache.get(friend.discordId);
    
    if (member) {
      try {
        const notificationEmbed = new EmbedBuilder()
          .setColor('#E74C3C') // قرمز
          .setTitle('🎁 هدیه روزانه دریافت کردید!')
          .setDescription(`${user.username} به شما هدیه روزانه ارسال کرد!`)
          .setThumbnail('https://img.icons8.com/fluency/48/gift.png')
          .addFields({ 
            name: '🎁 مقدار هدیه', 
            value: `${coinAmount} سکه + ${crystalAmount} کریستال`, 
            inline: true 
          });
        
        await member.send({ embeds: [notificationEmbed] }).catch(() => {});
      } catch (error) {
        console.error("Error sending notification to friend:", error);
      }
    }
    
  } catch (error) {
    console.error("Error in sendDailyGift:", error);
    await interaction.reply({
      content: "❌ خطایی در ارسال هدیه روزانه رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * افزایش XP دوستی بین دو کاربر
 * @param userId شناسه کاربر
 * @param friendId شناسه دوست
 * @param xpAmount مقدار XP
 */
export async function increaseFriendshipXP(userId: number, friendId: number, xpAmount: number) {
  try {
    const user = await storage.getUser(userId);
    const friend = await storage.getUser(friendId);
    
    if (!user || !friend) {
      return false;
    }
    
    // افزایش XP دوستی برای هر دو کاربر
    const updateResult1 = await storage.updateFriendshipXP(userId, friend.discordId, xpAmount);
    const updateResult2 = await storage.updateFriendshipXP(friendId, user.discordId, xpAmount);
    
    // بررسی آیا افزایش سطح دوستی رخ داده است
    if (updateResult1.leveledUp || updateResult2.leveledUp) {
      // اگر سطح دوستی افزایش یافته باشد، منطق اختصاصی اینجا اضافه می‌شود
      const newLevel = updateResult1.newLevel || updateResult2.newLevel;
      
      // اعطای پاداش سطح دوستی به هر دو کاربر
      await grantFriendshipLevelRewards(userId, friendId, newLevel);
      
      // ثبت فعالیت افزایش سطح دوستی
      await storage.recordFriendshipActivity(userId, friendId, 'level_up', `سطح دوستی به ${newLevel} رسید`, 0);
    }
    
    return true;
  } catch (error) {
    console.error("Error in increaseFriendshipXP:", error);
    return false;
  }
}

/**
 * اعطای پاداش‌های سطح دوستی
 * @param userId شناسه کاربر
 * @param friendId شناسه دوست
 * @param level سطح دوستی جدید
 */
export async function grantFriendshipLevelRewards(userId: number, friendId: number, level: number) {
  try {
    let coinReward = 0;
    let crystalReward = 0;
    
    switch (level) {
      case 2:
        coinReward = 100;
        crystalReward = 5;
        break;
      case 3:
        coinReward = 200;
        crystalReward = 10;
        break;
      case 4:
        coinReward = 300;
        // اینجا منطق اعطای رول "دوست صمیمی" اضافه می‌شود
        break;
      case 5:
        coinReward = 500;
        // اینجا منطق اعطای افکت پروفایل "دوستی درخشان" اضافه می‌شود
        break;
    }
    
    if (coinReward > 0) {
      await storage.addToWallet(userId, coinReward, 'friendship_level_reward', { level });
      await storage.addToWallet(friendId, coinReward, 'friendship_level_reward', { level });
    }
    
    if (crystalReward > 0) {
      await storage.addCrystals(userId, crystalReward);
      await storage.addCrystals(friendId, crystalReward);
    }
    
    return true;
  } catch (error) {
    console.error("Error in grantFriendshipLevelRewards:", error);
    return false;
  }
}

/**
 * بررسی آیا کاربر امروز هدیه روزانه به دوست ارسال کرده است
 * @param userId شناسه کاربر
 * @param friendId شناسه دوست
 * @returns نتیجه بررسی
 */
export async function hasUserSentDailyGift(userId: number, friendId: number): Promise<boolean> {
  try {
    // این متد باید در storage.ts پیاده‌سازی شود
    return await storage.hasSentDailyGift(userId, friendId);
  } catch (error) {
    console.error("Error in hasUserSentDailyGift:", error);
    return false;
  }
}

/**
 * مدیریت تعاملات با منوی هدیه
 * @param interaction برهم‌کنش با کاربر
 */
export async function handleGiftMenuInteraction(interaction: MessageComponentInteraction) {
  try {
    const customId = interaction.customId;
    
    // بررسی آیا این تعامل مربوط به منوی هدیه است
    if (customId.startsWith('gift_menu_')) {
      const friendId = parseInt(customId.replace('gift_menu_', ''));
      await giftToFriendMenu(interaction, friendId);
      return;
    }
    
    // بررسی آیا این تعامل مربوط به هدیه سکه است
    if (customId.startsWith('gift_coin_')) {
      const remainingId = customId.replace('gift_coin_', '');
      
      // بررسی آیا این هدیه با مقدار از پیش تعیین شده است
      if (remainingId.includes('_')) {
        const [friendIdStr, amountStr] = remainingId.split('_');
        const friendId = parseInt(friendIdStr);
        const amount = parseInt(amountStr);
        
        if (!isNaN(friendId) && !isNaN(amount)) {
          await sendCoinGift(interaction, friendId, amount);
          return;
        }
      } else {
        // نمایش فرم هدیه سکه
        const friendId = parseInt(remainingId);
        
        if (!isNaN(friendId)) {
          await showCoinGiftModal(interaction, friendId);
          return;
        }
      }
    }
    
    // بررسی آیا این تعامل مربوط به هدیه کریستال است
    if (customId.startsWith('gift_crystal_')) {
      const remainingId = customId.replace('gift_crystal_', '');
      
      // بررسی آیا این هدیه با مقدار از پیش تعیین شده است
      if (remainingId.includes('_')) {
        const [friendIdStr, amountStr] = remainingId.split('_');
        const friendId = parseInt(friendIdStr);
        const amount = parseInt(amountStr);
        
        if (!isNaN(friendId) && !isNaN(amount)) {
          await sendCrystalGift(interaction, friendId, amount);
          return;
        }
      } else {
        // نمایش فرم هدیه کریستال
        const friendId = parseInt(remainingId);
        
        if (!isNaN(friendId)) {
          await showCrystalGiftModal(interaction, friendId);
          return;
        }
      }
    }
    
    // بررسی آیا این تعامل مربوط به هدیه روزانه است
    if (customId.startsWith('gift_daily_')) {
      const friendId = parseInt(customId.replace('gift_daily_', ''));
      
      if (!isNaN(friendId)) {
        await sendDailyGift(interaction, friendId);
        return;
      }
    }
    
    // بررسی آیا این تعامل مربوط به هدیه دادن به دوست است
    if (customId.startsWith('gift_to_friend_')) {
      const friendId = parseInt(customId.replace('gift_to_friend_', ''));
      
      if (!isNaN(friendId)) {
        await giftToFriendMenu(interaction, friendId);
        return;
      }
    }
    
  } catch (error) {
    console.error("Error in handleGiftMenuInteraction:", error);
    await interaction.reply({
      content: "❌ خطایی در پردازش تعامل رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}