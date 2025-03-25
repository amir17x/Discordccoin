import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { storage } from '../../../storage';
import { formatNumber, formatDate, formatRelativeTime } from '../../utils/formatter';
import * as anonymousChatMenu from '../anonymousChatMenu/anonymousChatMenu';

/**
 * منوی علایق و پیشنهاد دوستان
 * @param interaction برهم‌کنش با کاربر
 */
export async function interestsAndSuggestionsMenu(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // دریافت علایق کاربر
    const userInterests = await storage.getUserInterests(user.id);
    
    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('🔍 پیشنهاد دوستان و علایق')
      .setDescription(`${interaction.user.username} عزیز، در این بخش می‌توانید علایق خود را مدیریت کنید و کاربران مشابه را پیدا کنید.`)
      .setThumbnail('https://img.icons8.com/fluency/48/search.png');
    
    // اضافه کردن علایق فعلی کاربر
    if (userInterests && userInterests.topics && userInterests.topics.length > 0) {
      const interestsString = userInterests.topics.join('، ');
      embed.addFields({ 
        name: '🎯 علایق شما', 
        value: interestsString,
        inline: false 
      });
    } else {
      embed.addFields({ 
        name: '🎯 علایق شما', 
        value: 'شما هنوز علاقه‌ای ثبت نکرده‌اید.',
        inline: false 
      });
    }
    
    // اضافه کردن بخش پیشنهادات
    embed.addFields({ 
      name: '👥 پیشنهادات دوستان', 
      value: 'برای دیدن پیشنهادات دوستان بر اساس علایق مشترک، از دکمه‌های زیر استفاده کنید.',
      inline: false 
    });
    
    // دکمه‌های علایق
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('update_interests')
          .setLabel('🔄 بروزرسانی علایق')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('find_similar_users')
          .setLabel('🔍 یافتن کاربران مشابه')
          .setStyle(ButtonStyle.Success)
      );
    
    // دکمه‌های پیشنهادات
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('suggest_by_level')
          .setLabel('📊 پیشنهاد بر اساس سطح')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('suggest_by_clan')
          .setLabel('🏰 پیشنهاد از کلن شما')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('👥 بازگشت به منوی دوستان')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row1, row2]
    });
    
  } catch (error) {
    console.error("Error in interestsAndSuggestionsMenu:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * منوی بروزرسانی علایق
 * @param interaction برهم‌کنش با کاربر
 */
export async function updateInterestsMenu(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد.",
        ephemeral: true
      });
    }
    
    // دریافت علایق فعلی کاربر
    const userInterests = await storage.getUserInterests(user.id);
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('🎯 بروزرسانی علایق')
      .setDescription('لطفاً علایق خود را انتخاب کنید تا بتوانیم دوستان مناسب را به شما پیشنهاد دهیم.')
      .setThumbnail('https://img.icons8.com/fluency/48/edit.png');
    
    // اضافه کردن علایق فعلی
    if (userInterests && userInterests.topics && userInterests.topics.length > 0) {
      const interestsString = userInterests.topics.join('، ');
      embed.addFields({ 
        name: '📝 علایق فعلی شما', 
        value: interestsString,
        inline: false
      });
    }
    
    // ایجاد منوی کشویی برای انتخاب علایق
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_interests')
      .setPlaceholder('علایق خود را انتخاب کنید...')
      .setMinValues(1)
      .setMaxValues(5) // حداکثر 5 علاقه
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('وار کلن')
          .setValue('clan_war')
          .setDescription('علاقه به شرکت در جنگ‌های کلن')
          .setEmoji('⚔️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('ماموریت‌ها')
          .setValue('quests')
          .setDescription('علاقه به انجام ماموریت‌های متنوع')
          .setEmoji('📜'),
        new StringSelectMenuOptionBuilder()
          .setLabel('بازی‌ها')
          .setValue('games')
          .setDescription('علاقه به بازی‌های مختلف')
          .setEmoji('🎮'),
        new StringSelectMenuOptionBuilder()
          .setLabel('تجارت و اقتصاد')
          .setValue('economy')
          .setDescription('علاقه به فعالیت‌های اقتصادی و تجارت')
          .setEmoji('💰'),
        new StringSelectMenuOptionBuilder()
          .setLabel('سرمایه‌گذاری')
          .setValue('investment')
          .setDescription('علاقه به سرمایه‌گذاری')
          .setEmoji('📈'),
        new StringSelectMenuOptionBuilder()
          .setLabel('چت و گفتگو')
          .setValue('chat')
          .setDescription('علاقه به گفتگو با دیگران')
          .setEmoji('💬'),
        new StringSelectMenuOptionBuilder()
          .setLabel('جمع‌آوری آیتم‌ها')
          .setValue('collecting')
          .setDescription('علاقه به جمع‌آوری آیتم‌های مختلف')
          .setEmoji('🎁'),
      ]);
    
    // اضافه کردن منوی کشویی به اکشن رو
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
    
    // دکمه بازگشت
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('interests_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [selectRow, buttonRow]
    });
    
  } catch (error) {
    console.error("Error in updateInterestsMenu:", error);
    await interaction.reply({
      content: "❌ خطایی در بروزرسانی علایق رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * پردازش انتخاب علایق
 * @param interaction برهم‌کنش با کاربر
 */
export async function processInterestsSelection(interaction: MessageComponentInteraction) {
  try {
    if (!('values' in interaction)) {
      return await interaction.reply({
        content: "❌ خطا در دریافت علایق انتخابی!",
        ephemeral: true
      });
    }
    
    const selectedInterests = interaction.values as string[];
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد.",
        ephemeral: true
      });
    }
    
    // تبدیل مقادیر به نام‌های قابل نمایش
    const interestNames: Record<string, string> = {
      'clan_war': 'وار کلن',
      'quests': 'ماموریت‌ها',
      'games': 'بازی‌ها',
      'economy': 'تجارت و اقتصاد',
      'investment': 'سرمایه‌گذاری',
      'chat': 'چت و گفتگو',
      'collecting': 'جمع‌آوری آیتم‌ها'
    };
    
    const selectedInterestNames = selectedInterests.map(interest => interestNames[interest] || interest);
    
    // ذخیره علایق در پایگاه داده
    const userInterests = {
      topics: selectedInterests,
      updatedAt: new Date().toISOString()
    };
    
    await storage.updateUserInterests(user.id, userInterests);
    
    // ایجاد Embed برای نمایش نتیجه
    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('✅ علایق شما بروزرسانی شد')
      .setDescription('علایق شما با موفقیت بروزرسانی شد. اکنون می‌توانید دوستان مناسب را پیدا کنید.')
      .addFields({
        name: '🎯 علایق انتخاب شده',
        value: selectedInterestNames.join('، ') || 'بدون علاقه',
        inline: false
      })
      .setThumbnail('https://img.icons8.com/fluency/48/ok.png');
    
    // دکمه‌های عملیات
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('find_similar_users')
          .setLabel('🔍 یافتن کاربران مشابه')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('interests_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
  } catch (error) {
    console.error("Error in processInterestsSelection:", error);
    await interaction.reply({
      content: "❌ خطایی در ذخیره علایق رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * نمایش کاربران مشابه بر اساس علایق
 * @param interaction برهم‌کنش با کاربر
 */
export async function findSimilarUsers(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد.",
        ephemeral: true
      });
    }
    
    // بررسی آیا کاربر علایقی دارد
    const userInterests = await storage.getUserInterests(user.id);
    
    if (!userInterests || !userInterests.topics || userInterests.topics.length === 0) {
      // اگر علایقی ثبت نشده، به منوی بروزرسانی علایق هدایت شود
      const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('⚠️ علایق ثبت نشده')
        .setDescription('شما هنوز علایق خود را ثبت نکرده‌اید. لطفاً ابتدا علایق خود را مشخص کنید.')
        .setThumbnail('https://img.icons8.com/fluency/48/warning-shield.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('update_interests')
            .setLabel('🔄 ثبت علایق')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('interests_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({
        embeds: [embed],
        components: [row]
      });
    }
    
    // یافتن کاربران مشابه
    const similarUsers = await storage.findSimilarUsers(user.id, 5);
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('🔍 کاربران با علایق مشابه')
      .setThumbnail('https://img.icons8.com/fluency/48/find-user-male.png');
    
    if (!similarUsers || similarUsers.length === 0) {
      embed.setDescription('متأسفانه هیچ کاربری با علایق مشابه شما پیدا نشد.');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('interests_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({
        embeds: [embed],
        components: [row]
      });
    }
    
    // افزودن لیست کاربران مشابه
    let description = 'کاربران زیر علایق مشابه شما دارند:\n\n';
    
    for (let i = 0; i < similarUsers.length; i++) {
      const similarUser = similarUsers[i];
      // بررسی آیا کاربر در لیست دوستان است
      const friends = await storage.getFriends(user.id);
      const isFriend = friends.some(friend => friend.friendId === similarUser.discordId);
      
      // بررسی علایق مشترک
      const similarUserInterests = await storage.getUserInterests(similarUser.id);
      const commonInterests = userInterests.topics.filter(interest => 
        similarUserInterests?.topics?.includes(interest)
      );
      
      // تبدیل مقادیر به نام‌های قابل نمایش
      const interestNames: Record<string, string> = {
        'clan_war': 'وار کلن',
        'quests': 'ماموریت‌ها',
        'games': 'بازی‌ها',
        'economy': 'تجارت و اقتصاد',
        'investment': 'سرمایه‌گذاری',
        'chat': 'چت و گفتگو',
        'collecting': 'جمع‌آوری آیتم‌ها'
      };
      
      const commonInterestNames = commonInterests.map(interest => interestNames[interest] || interest);
      
      const friendStatus = isFriend ? '👥 (دوست شما)' : '';
      description += `**${i+1}. ${similarUser.username}** (سطح ${similarUser.level}) ${friendStatus}\n`;
      description += `🔄 علایق مشترک: ${commonInterestNames.join('، ')}\n`;
      if (!isFriend) {
        description += `🆔 شناسه: ${similarUser.id}\n`;
      }
      description += '\n';
    }
    
    embed.setDescription(description);
    
    // دکمه‌های عملیات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('add_friend_from_similar')
          .setLabel('➕ ارسال درخواست دوستی')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('refresh_similar_users')
          .setLabel('🔄 بروزرسانی لیست')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('find_by_level')
          .setLabel('📊 پیشنهاد بر اساس سطح')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('interests_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row1, row2]
    });
    
  } catch (error) {
    console.error("Error in findSimilarUsers:", error);
    await interaction.reply({
      content: "❌ خطایی در یافتن کاربران مشابه رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * نمایش کاربران بر اساس سطح
 * @param interaction برهم‌کنش با کاربر
 */
export async function findUsersByLevel(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد.",
        ephemeral: true
      });
    }
    
    // دریافت کاربران در محدوده سطح مشابه
    const currentLevel = user.level || 1;
    const minLevel = Math.max(1, currentLevel - 2);
    const maxLevel = currentLevel + 2;
    
    const allUsers = await storage.getAllUsers();
    const similarLevelUsers = allUsers.filter(u => 
      u.id !== user.id && 
      u.level >= minLevel && 
      u.level <= maxLevel
    ).slice(0, 5); // حداکثر 5 کاربر
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('📊 کاربران با سطح مشابه')
      .setThumbnail('https://img.icons8.com/fluency/48/leaderboard.png');
    
    if (similarLevelUsers.length === 0) {
      embed.setDescription('متأسفانه هیچ کاربری با سطح مشابه شما پیدا نشد.');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('interests_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({
        embeds: [embed],
        components: [row]
      });
    }
    
    // افزودن لیست کاربران با سطح مشابه
    let description = `کاربران زیر سطح مشابه شما (${currentLevel}) دارند:\n\n`;
    
    for (let i = 0; i < similarLevelUsers.length; i++) {
      const similarUser = similarLevelUsers[i];
      // بررسی آیا کاربر در لیست دوستان است
      const friends = await storage.getFriends(user.id);
      const isFriend = friends.some(friend => friend.friendId === similarUser.discordId);
      
      const friendStatus = isFriend ? '👥 (دوست شما)' : '';
      description += `**${i+1}. ${similarUser.username}** (سطح ${similarUser.level}) ${friendStatus}\n`;
      if (similarUser.clan) {
        description += `🏰 کلن: ${similarUser.clan}\n`;
      }
      if (!isFriend) {
        description += `🆔 شناسه: ${similarUser.id}\n`;
      }
      description += '\n';
    }
    
    embed.setDescription(description);
    
    // دکمه‌های عملیات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('add_friend_from_similar')
          .setLabel('➕ ارسال درخواست دوستی')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('refresh_level_users')
          .setLabel('🔄 بروزرسانی لیست')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('find_similar_users')
          .setLabel('🔍 کاربران با علایق مشابه')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('interests_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row1, row2]
    });
    
  } catch (error) {
    console.error("Error in findUsersByLevel:", error);
    await interaction.reply({
      content: "❌ خطایی در یافتن کاربران با سطح مشابه رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * نمایش کاربران از کلن کاربر
 * @param interaction برهم‌کنش با کاربر
 */
export async function findUsersFromClan(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد.",
        ephemeral: true
      });
    }
    
    // بررسی آیا کاربر در کلن است
    if (!user.clanId) {
      const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('⚠️ شما عضو کلنی نیستید')
        .setDescription('برای دیدن اعضای کلن، ابتدا باید به یک کلن بپیوندید.')
        .setThumbnail('https://img.icons8.com/fluency/48/warning-shield.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('interests_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({
        embeds: [embed],
        components: [row]
      });
    }
    
    // دریافت کلن کاربر
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      return await interaction.reply({
        content: "❌ کلن شما یافت نشد!",
        ephemeral: true
      });
    }
    
    // دریافت تمام کاربران
    const allUsers = await storage.getAllUsers();
    
    // فیلتر کردن اعضای کلن
    const clanMembers = allUsers.filter(u => 
      u.id !== user.id && 
      u.clanId === user.clanId
    ).slice(0, 10); // حداکثر 10 عضو
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle(`🏰 اعضای کلن ${clan.name}`)
      .setThumbnail('https://img.icons8.com/fluency/48/castle.png');
    
    if (clanMembers.length === 0) {
      embed.setDescription('شما تنها عضو این کلن هستید.');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('interests_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({
        embeds: [embed],
        components: [row]
      });
    }
    
    // افزودن لیست اعضای کلن
    let description = `اعضای دیگر کلن ${clan.name}:\n\n`;
    
    for (let i = 0; i < clanMembers.length; i++) {
      const clanMember = clanMembers[i];
      // بررسی آیا کاربر در لیست دوستان است
      const friends = await storage.getFriends(user.id);
      const isFriend = friends.some(friend => friend.friendId === clanMember.discordId);
      
      const friendStatus = isFriend ? '👥 (دوست شما)' : '';
      description += `**${i+1}. ${clanMember.username}** (سطح ${clanMember.level}) ${friendStatus}\n`;
      if (!isFriend) {
        description += `🆔 شناسه: ${clanMember.id}\n`;
      }
      description += '\n';
    }
    
    embed.setDescription(description);
    
    // دکمه‌های عملیات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('add_friend_from_clan')
          .setLabel('➕ ارسال درخواست دوستی')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('refresh_clan_users')
          .setLabel('🔄 بروزرسانی لیست')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('interests_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row1, row2]
    });
    
  } catch (error) {
    console.error("Error in findUsersFromClan:", error);
    await interaction.reply({
      content: "❌ خطایی در یافتن اعضای کلن رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * مدیریت تعاملات با منوی علایق و پیشنهادات
 * @param interaction برهم‌کنش با کاربر
 */
export async function handleInterestsMenuInteraction(interaction: MessageComponentInteraction) {
  try {
    const customId = interaction.customId;
    
    switch (customId) {
      case 'interests_menu':
        await interestsAndSuggestionsMenu(interaction);
        break;
        
      case 'update_interests':
        await updateInterestsMenu(interaction);
        break;
        
      case 'select_interests':
        await processInterestsSelection(interaction);
        break;
        
      case 'find_similar_users':
        await findSimilarUsers(interaction);
        break;
        
      case 'suggest_by_level':
      case 'find_by_level':
        await findUsersByLevel(interaction);
        break;
        
      case 'suggest_by_clan':
        await findUsersFromClan(interaction);
        break;
        
      case 'refresh_similar_users':
        await findSimilarUsers(interaction);
        break;
        
      case 'refresh_level_users':
        await findUsersByLevel(interaction);
        break;
        
      case 'refresh_clan_users':
        await findUsersFromClan(interaction);
        break;
        
      default:
        // برای سایر تعاملات، به منوی اصلی بازگردیم
        await interestsAndSuggestionsMenu(interaction);
        break;
    }
  } catch (error) {
    console.error("Error in handleInterestsMenuInteraction:", error);
    await interaction.reply({
      content: "❌ خطایی در پردازش تعامل رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}