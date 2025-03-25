import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { storage } from '../../../storage';
import { formatNumber, formatDate, formatRelativeTime } from '../../utils/formatter';

/**
 * سیستم لِوِل دوستی (Friendship Level)
 * این منو امکان مشاهده سطح دوستی، تاریخچه تعاملات و پاداش‌های دوستی را فراهم می‌کند
 * @param interaction برهم‌کنش با کاربر
 * @param friendDiscordId شناسه دیسکورد دوست (اختیاری)
 */
export async function friendshipLevelMenu(interaction: MessageComponentInteraction, friendDiscordId?: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // اگر شناسه دوست مشخص نشده، منوی کلی سطح دوستی نمایش داده می‌شود
    if (!friendDiscordId) {
      // دریافت لیست دوستان
      const friends = await storage.getFriends(user.id);
      
      // ایجاد Embed اصلی
      const embed = new EmbedBuilder()
        .setColor('#8E44AD') // بنفش
        .setTitle('🌟 سیستم سطح دوستی')
        .setDescription(`${interaction.user.username} عزیز، به سیستم سطح دوستی Ccoin خوش آمدید!\n\nبا تعامل با دوستان خود، XP دوستی کسب کنید و به سطوح بالاتر دوستی برسید. با افزایش سطح دوستی، پاداش‌های ویژه‌ای دریافت خواهید کرد.`)
        .setThumbnail('https://img.icons8.com/fluency/48/like.png');
      
      // اضافه کردن اطلاعات دوستان
      if (friends && friends.length > 0) {
        embed.addFields({
          name: '👥 تعداد دوستان',
          value: `${friends.length}`,
          inline: true
        });
        
        // محاسبه امتیاز کل دوستی
        const totalXP = friends.reduce((sum, friend) => sum + friend.friendshipXP, 0);
        embed.addFields({
          name: '✨ امتیاز کل دوستی',
          value: `${totalXP} XP`,
          inline: true
        });
        
        // پیدا کردن بالاترین سطح دوستی
        const highestLevel = Math.max(...friends.map(friend => friend.friendshipLevel));
        embed.addFields({
          name: '🏆 بالاترین سطح دوستی',
          value: `سطح ${highestLevel}`,
          inline: true
        });
        
        // نمایش دوستان با بالاترین امتیاز
        const topFriends = [...friends]
          .sort((a, b) => b.friendshipXP - a.friendshipXP)
          .slice(0, 3);
        
        if (topFriends.length > 0) {
          let topFriendsText = '';
          
          for (const friend of topFriends) {
            const friendUser = await storage.getUserByDiscordId(friend.friendId);
            if (friendUser) {
              topFriendsText += `**${friendUser.username}**: سطح ${friend.friendshipLevel} (${friend.friendshipXP} XP)\n`;
            }
          }
          
          embed.addFields({
            name: '🥇 دوستان برتر',
            value: topFriendsText || 'هیچ دوستی یافت نشد',
            inline: false
          });
        }
      } else {
        embed.addFields({
          name: '👥 تعداد دوستان',
          value: '0',
          inline: true
        });
        
        embed.addFields({
          name: '✨ امتیاز کل دوستی',
          value: '0 XP',
          inline: true
        });
        
        embed.addFields({
          name: '🏆 بالاترین سطح دوستی',
          value: 'بدون دوست',
          inline: true
        });
      }
      
      // اضافه کردن راهنمای سیستم لِوِل دوستی
      embed.addFields({
        name: '💡 راهنمای سیستم لِوِل دوستی',
        value: 
          '• سطح 1: 0-100 XP\n' +
          '• سطح 2: 100-250 XP\n' +
          '• سطح 3: 250-500 XP\n' +
          '• سطح 4: 500-1000 XP\n' +
          '• سطح 5: 1000+ XP (حداکثر)',
        inline: false
      });
      
      embed.addFields({
        name: '💰 روش‌های کسب XP دوستی',
        value: 
          '• هدیه دادن سکه: 10 XP\n' +
          '• هدیه دادن کریستال: 20 XP\n' +
          '• چت خصوصی (هر 10 پیام): 5 XP\n' +
          '• انجام ماموریت گروهی: 50 XP\n' +
          '• شرکت در وار کلن با دوست: 40 XP',
        inline: false
      });
      
      // دکمه‌های عملیات
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('friends_list')
            .setLabel('👥 مشاهده لیست دوستان')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friendship_rewards')
            .setLabel('🎁 پاداش‌های دوستی')
            .setStyle(ButtonStyle.Primary)
        );
      
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('friendship_leaderboard')
            .setLabel('🏆 برترین دوستی‌ها')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // ارسال پاسخ
      await interaction.update({
        embeds: [embed],
        components: [row1, row2]
      });
      
    } else {
      // نمایش اطلاعات سطح دوستی برای یک دوست خاص
      await showFriendshipDetails(interaction, friendDiscordId);
    }
    
  } catch (error) {
    console.error("Error in friendshipLevelMenu:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * نمایش جزئیات دوستی با یک دوست خاص
 * @param interaction برهم‌کنش با کاربر
 * @param friendDiscordId شناسه دیسکورد دوست
 */
export async function showFriendshipDetails(interaction: MessageComponentInteraction, friendDiscordId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    const friend = await storage.getUserByDiscordId(friendDiscordId);
    
    if (!user || !friend) {
      return await interaction.reply({
        content: "❌ کاربر یا دوست مورد نظر یافت نشد!",
        ephemeral: true
      });
    }
    
    // دریافت اطلاعات دوستی
    const friends = await storage.getFriends(user.id);
    const friendship = friends.find(f => f.friendId === friendDiscordId);
    
    if (!friendship) {
      return await interaction.reply({
        content: "❌ این کاربر در لیست دوستان شما نیست!",
        ephemeral: true
      });
    }
    
    // محاسبه اطلاعات سطح دوستی
    const currentLevel = friendship.friendshipLevel;
    const currentXP = friendship.friendshipXP;
    
    let nextLevelXP = 0;
    switch (currentLevel) {
      case 1: nextLevelXP = 100; break;
      case 2: nextLevelXP = 250; break;
      case 3: nextLevelXP = 500; break;
      case 4: nextLevelXP = 1000; break;
      case 5: nextLevelXP = -1; break; // سطح حداکثر
    }
    
    // ایجاد نوار پیشرفت
    let progressBar = '';
    let progressPercentage = 0;
    
    if (currentLevel < 5) {
      const previousLevelXP = getLevelMinXP(currentLevel);
      const xpInCurrentLevel = currentXP - previousLevelXP;
      const xpNeededForNextLevel = nextLevelXP - previousLevelXP;
      progressPercentage = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100));
      
      const filledBars = Math.floor(progressPercentage / 10);
      progressBar = '▓'.repeat(filledBars) + '░'.repeat(10 - filledBars);
    } else {
      // سطح حداکثر
      progressBar = '▓'.repeat(10);
      progressPercentage = 100;
    }
    
    // ایجاد Embed
    const levelEmoji = getLevelEmoji(currentLevel);
    
    const embed = new EmbedBuilder()
      .setColor('#8E44AD') // بنفش
      .setTitle(`${levelEmoji} دوستی با ${friend.username}`)
      .setDescription(`اطلاعات سطح دوستی شما با ${friend.username}`)
      .setThumbnail('https://img.icons8.com/fluency/48/like.png');
    
    embed.addFields(
      { name: '🌟 سطح دوستی', value: `${currentLevel}`, inline: true },
      { name: '✨ امتیاز دوستی', value: `${currentXP} XP`, inline: true }
    );
    
    if (currentLevel < 5) {
      embed.addFields(
        { name: '📊 تا سطح بعدی', value: `${nextLevelXP - currentXP} XP مانده`, inline: true },
        { name: '📈 پیشرفت', value: `${progressBar} ${progressPercentage}%`, inline: false }
      );
    } else {
      embed.addFields(
        { name: '📊 وضعیت', value: 'حداکثر سطح رسیده!', inline: true },
        { name: '📈 پیشرفت', value: `${progressBar} سطح حداکثر!`, inline: false }
      );
    }
    
    // اضافه کردن تاریخ شروع دوستی
    embed.addFields({ 
      name: '📅 تاریخ شروع دوستی', 
      value: formatDate(friendship.addedAt), 
      inline: false 
    });
    
    // اضافه کردن آخرین تعامل
    embed.addFields({ 
      name: '⏱️ آخرین تعامل', 
      value: formatRelativeTime(friendship.lastInteraction), 
      inline: false 
    });
    
    // اضافه کردن وضعیت بهترین دوست
    const bestFriendStatus = friendship.isBestFriend ? 
      '✅ این کاربر بهترین دوست شما است' : 
      '❌ این کاربر بهترین دوست شما نیست';
    
    embed.addFields({ 
      name: '💖 وضعیت بهترین دوست', 
      value: bestFriendStatus, 
      inline: false 
    });
    
    // اضافه کردن دکمه‌های عملیات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gift_to_friend_${friend.id}`)
          .setLabel('🎁 هدیه دادن')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`friendship_history_${friend.id}`)
          .setLabel('📜 تاریخچه دوستی')
          .setStyle(ButtonStyle.Primary)
      );
    
    // دکمه تنظیم/حذف بهترین دوست
    const bestFriendButton = new ButtonBuilder()
      .setCustomId(`set_best_friend_${friend.discordId}`)
      .setLabel(friendship.isBestFriend ? '💔 حذف بهترین دوست' : '💖 انتخاب به‌عنوان بهترین دوست')
      .setStyle(friendship.isBestFriend ? ButtonStyle.Danger : ButtonStyle.Success);
    
    // برای انتخاب بهترین دوست، لول دوستی باید حداقل 3 باشد
    if (currentLevel < 3 && !friendship.isBestFriend) {
      bestFriendButton.setDisabled(true)
        .setLabel('💖 نیاز به لول دوستی 3 یا بالاتر');
    }
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`chat_with_friend_${friend.id}`)
          .setLabel('💬 چت خصوصی')
          .setStyle(ButtonStyle.Secondary),
        bestFriendButton
      );
      
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friendship_level_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row1, row2, row3]
    });
    
  } catch (error) {
    console.error("Error in showFriendshipDetails:", error);
    await interaction.reply({
      content: "❌ خطایی در نمایش جزئیات دوستی رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * نمایش تاریخچه دوستی با یک دوست خاص
 * @param interaction برهم‌کنش با کاربر
 * @param friendId شناسه دوست
 */
export async function showFriendshipHistory(interaction: MessageComponentInteraction, friendId: number) {
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
    
    // دریافت تاریخچه فعالیت‌های دوستی
    // این متد باید در storage.ts پیاده‌سازی شود
    const activities = await storage.getFriendshipActivities(user.id, friendId, 10);
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#8E44AD') // بنفش
      .setTitle(`📜 تاریخچه دوستی با ${friend.username}`)
      .setDescription(`فعالیت‌های اخیر شما با ${friend.username}`)
      .setThumbnail('https://img.icons8.com/fluency/48/activity-history.png');
    
    // اضافه کردن تاریخ شروع دوستی
    embed.addFields({ 
      name: '🎉 شروع دوستی', 
      value: formatDate(friendship.addedAt), 
      inline: false 
    });
    
    // اضافه کردن فعالیت‌ها
    if (activities && activities.length > 0) {
      let historyText = '';
      
      for (const activity of activities) {
        const activityEmoji = getActivityEmoji(activity.type);
        historyText += `${activityEmoji} **${formatDate(activity.timestamp)}**: ${activity.details} (${activity.xpEarned} XP)\n`;
      }
      
      embed.addFields({ 
        name: '📝 فعالیت‌های اخیر', 
        value: historyText, 
        inline: false 
      });
    } else {
      embed.addFields({ 
        name: '📝 فعالیت‌های اخیر', 
        value: 'هنوز فعالیتی ثبت نشده است.', 
        inline: false 
      });
    }
    
    // اضافه کردن راهنمای کسب XP
    embed.addFields({ 
      name: '💡 روش‌های افزایش XP دوستی', 
      value: 
        '• هدیه دادن سکه: 10 XP\n' +
        '• هدیه دادن کریستال: 20 XP\n' +
        '• چت خصوصی (هر 10 پیام): 5 XP\n' +
        '• انجام ماموریت گروهی: 50 XP\n' +
        '• شرکت در وار کلن با دوست: 40 XP',
      inline: false 
    });
    
    // دکمه‌های عملیات
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gift_to_friend_${friendId}`)
          .setLabel('🎁 هدیه دادن')
          .setStyle(ButtonStyle.Success),
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
    
  } catch (error) {
    console.error("Error in showFriendshipHistory:", error);
    await interaction.reply({
      content: "❌ خطایی در نمایش تاریخچه دوستی رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * نمایش پاداش‌های دوستی
 * @param interaction برهم‌کنش با کاربر
 */
export async function showFriendshipRewards(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد!",
        ephemeral: true
      });
    }
    
    // دریافت لیست دوستان
    const friends = await storage.getFriends(user.id);
    
    // محاسبه امتیاز کل دوستی
    const totalXP = friends.reduce((sum, friend) => sum + friend.friendshipXP, 0);
    
    // پیدا کردن بالاترین سطح دوستی
    const highestLevel = friends.length > 0 ? Math.max(...friends.map(friend => friend.friendshipLevel)) : 0;
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#8E44AD') // بنفش
      .setTitle('🎁 پاداش‌های دوستی')
      .setDescription('با افزایش سطح دوستی و گسترش روابط اجتماعی، پاداش‌های ویژه‌ای دریافت کنید.')
      .setThumbnail('https://img.icons8.com/fluency/48/gift.png');
    
    // اضافه کردن اطلاعات پاداش‌های سطح دوستی
    embed.addFields({ 
      name: '🌟 پاداش‌های سطح دوستی', 
      value: 
        '• سطح 2: 100 Ccoin + 5 کریستال\n' +
        '• سطح 3: 200 Ccoin + 10 کریستال\n' +
        '• سطح 4: 300 Ccoin + رول "دوست صمیمی"\n' +
        '• سطح 5: 500 Ccoin + افکت پروفایل "دوستی درخشان"',
      inline: false 
    });
    
    // اضافه کردن اطلاعات پاداش‌های تعداد دوستان
    embed.addFields({ 
      name: '👥 پاداش‌های تعداد دوستان', 
      value: 
        '• 5 دوست: 500 Ccoin\n' +
        '• 10 دوست: رول "اجتماعی"\n' +
        '• 20 دوست: 50 کریستال\n' +
        '• 50 دوست: لقب "محبوب"\n' +
        '• 100 دوست: پت ویژه "دوستدار"',
      inline: false 
    });
    
    // اضافه کردن اطلاعات پاداش‌های امتیاز کل دوستی
    embed.addFields({ 
      name: '✨ پاداش‌های امتیاز کل دوستی', 
      value: 
        '• 1000 XP: افکت پروفایل "دوستی درخشان"\n' +
        '• 2500 XP: 100 کریستال\n' +
        '• 5000 XP: رول "اسطوره دوستی"\n' +
        '• 10000 XP: لقب "افسانه دوستی"',
      inline: false 
    });
    
    // اضافه کردن وضعیت پاداش‌های کاربر
    let rewardsStatus = '';
    
    // تعداد دوستان
    if (friends.length >= 5) {
      rewardsStatus += '✅ 5 دوست: 500 Ccoin (دریافت شده)\n';
    } else {
      rewardsStatus += `❌ 5 دوست: 500 Ccoin (${friends.length}/5)\n`;
    }
    
    if (friends.length >= 10) {
      rewardsStatus += '✅ 10 دوست: رول "اجتماعی" (دریافت شده)\n';
    } else {
      rewardsStatus += `❌ 10 دوست: رول "اجتماعی" (${friends.length}/10)\n`;
    }
    
    // بالاترین سطح دوستی
    if (highestLevel >= 3) {
      rewardsStatus += '✅ سطح 3 دوستی: 200 Ccoin + 10 کریستال (دریافت شده)\n';
    } else if (highestLevel > 0) {
      rewardsStatus += `❌ سطح 3 دوستی: 200 Ccoin + 10 کریستال (سطح ${highestLevel}/3)\n`;
    } else {
      rewardsStatus += '❌ سطح 3 دوستی: 200 Ccoin + 10 کریستال (سطح 0/3)\n';
    }
    
    // امتیاز کل دوستی
    if (totalXP >= 1000) {
      rewardsStatus += '✅ 1000 XP دوستی: افکت پروفایل "دوستی درخشان" (دریافت شده)\n';
    } else {
      rewardsStatus += `❌ 1000 XP دوستی: افکت پروفایل "دوستی درخشان" (${totalXP}/1000)\n`;
    }
    
    embed.addFields({ 
      name: '📊 وضعیت پاداش‌های شما', 
      value: rewardsStatus,
      inline: false 
    });
    
    // دکمه‌های عملیات
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('claim_friendship_rewards')
          .setLabel('🎁 دریافت پاداش‌های آماده')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('friendship_level_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
  } catch (error) {
    console.error("Error in showFriendshipRewards:", error);
    await interaction.reply({
      content: "❌ خطایی در نمایش پاداش‌های دوستی رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * دریافت پاداش‌های دوستی آماده
 * @param interaction برهم‌کنش با کاربر
 */
export async function claimFriendshipRewards(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد!",
        ephemeral: true
      });
    }
    
    // دریافت لیست دوستان
    const friends = await storage.getFriends(user.id);
    
    // محاسبه امتیاز کل دوستی
    const totalXP = friends.reduce((sum, friend) => sum + friend.friendshipXP, 0);
    
    // پیدا کردن بالاترین سطح دوستی
    const highestLevel = friends.length > 0 ? Math.max(...friends.map(friend => friend.friendshipLevel)) : 0;
    
    // بررسی پاداش‌های قابل دریافت
    let claimableRewards: {type: string, description: string, claimed: boolean}[] = [];
    let rewardsClaimed = false;
    
    // پاداش تعداد دوستان
    if (friends.length >= 5) {
      // بررسی آیا این پاداش قبلاً دریافت شده است
      if (!user.claimedRewards || !user.claimedRewards['friends_5']) {
        claimableRewards.push({
          type: 'friends_5',
          description: '5 دوست: 500 Ccoin',
          claimed: false
        });
        
        // اعطای پاداش
        await storage.addToWallet(user.id, 500, 'friendship_reward', {reward_type: 'friends_5'});
        // ثبت پاداش به عنوان دریافت شده
        await storage.updateClaimedRewards(user.id, 'friends_5');
        
        rewardsClaimed = true;
      } else {
        claimableRewards.push({
          type: 'friends_5',
          description: '5 دوست: 500 Ccoin',
          claimed: true
        });
      }
    }
    
    if (friends.length >= 10) {
      if (!user.claimedRewards || !user.claimedRewards['friends_10']) {
        claimableRewards.push({
          type: 'friends_10',
          description: '10 دوست: رول "اجتماعی"',
          claimed: false
        });
        
        // اعطای پاداش
        // اینجا باید کد اعطای رول به کاربر اضافه شود
        // ثبت پاداش به عنوان دریافت شده
        await storage.updateClaimedRewards(user.id, 'friends_10');
        
        rewardsClaimed = true;
      } else {
        claimableRewards.push({
          type: 'friends_10',
          description: '10 دوست: رول "اجتماعی"',
          claimed: true
        });
      }
    }
    
    // پاداش بالاترین سطح دوستی
    if (highestLevel >= 3) {
      if (!user.claimedRewards || !user.claimedRewards['friendship_level_3']) {
        claimableRewards.push({
          type: 'friendship_level_3',
          description: 'سطح 3 دوستی: 200 Ccoin + 10 کریستال',
          claimed: false
        });
        
        // اعطای پاداش
        await storage.addToWallet(user.id, 200, 'friendship_reward', {reward_type: 'friendship_level_3'});
        await storage.addCrystals(user.id, 10);
        // ثبت پاداش به عنوان دریافت شده
        await storage.updateClaimedRewards(user.id, 'friendship_level_3');
        
        rewardsClaimed = true;
      } else {
        claimableRewards.push({
          type: 'friendship_level_3',
          description: 'سطح 3 دوستی: 200 Ccoin + 10 کریستال',
          claimed: true
        });
      }
    }
    
    // پاداش امتیاز کل دوستی
    if (totalXP >= 1000) {
      if (!user.claimedRewards || !user.claimedRewards['friendship_xp_1000']) {
        claimableRewards.push({
          type: 'friendship_xp_1000',
          description: '1000 XP دوستی: افکت پروفایل "دوستی درخشان"',
          claimed: false
        });
        
        // اعطای پاداش
        // اینجا باید کد اعطای افکت پروفایل به کاربر اضافه شود
        // ثبت پاداش به عنوان دریافت شده
        await storage.updateClaimedRewards(user.id, 'friendship_xp_1000');
        
        rewardsClaimed = true;
      } else {
        claimableRewards.push({
          type: 'friendship_xp_1000',
          description: '1000 XP دوستی: افکت پروفایل "دوستی درخشان"',
          claimed: true
        });
      }
    }
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor(rewardsClaimed ? '#2ECC71' : '#E74C3C') // سبز یا قرمز
      .setTitle(rewardsClaimed ? '🎉 پاداش‌های دوستی دریافت شدند' : '❌ پاداشی برای دریافت وجود ندارد')
      .setThumbnail('https://img.icons8.com/fluency/48/gift.png');
    
    if (rewardsClaimed) {
      // نمایش پاداش‌های دریافت شده
      let rewardsText = '';
      
      for (const reward of claimableRewards) {
        if (!reward.claimed) {
          rewardsText += `✅ **${reward.description}** - دریافت شد!\n`;
        }
      }
      
      embed.setDescription('تبریک! شما پاداش‌های دوستی زیر را دریافت کردید:');
      embed.addFields({ 
        name: '🏆 پاداش‌های دریافت شده', 
        value: rewardsText,
        inline: false 
      });
    } else {
      // نمایش پیام عدم وجود پاداش
      embed.setDescription('در حال حاضر هیچ پاداش جدیدی برای دریافت ندارید. با گسترش روابط دوستی خود، پاداش‌های بیشتری کسب کنید.');
      
      if (claimableRewards.length > 0) {
        let alreadyClaimedText = '';
        
        for (const reward of claimableRewards) {
          alreadyClaimedText += `✓ **${reward.description}** - قبلاً دریافت شده\n`;
        }
        
        embed.addFields({ 
          name: '🏆 پاداش‌های قبلی', 
          value: alreadyClaimedText,
          inline: false 
        });
      }
      
      // نمایش پاداش‌های بعدی
      let nextRewardsText = '';
      
      if (friends.length < 5) {
        nextRewardsText += `👥 5 دوست: 500 Ccoin (${friends.length}/5)\n`;
      } else if (friends.length < 10) {
        nextRewardsText += `👥 10 دوست: رول "اجتماعی" (${friends.length}/10)\n`;
      } else if (friends.length < 20) {
        nextRewardsText += `👥 20 دوست: 50 کریستال (${friends.length}/20)\n`;
      }
      
      if (highestLevel < 3) {
        nextRewardsText += `🌟 سطح 3 دوستی: 200 Ccoin + 10 کریستال (سطح ${highestLevel}/3)\n`;
      } else if (highestLevel < 4) {
        nextRewardsText += `🌟 سطح 4 دوستی: 300 Ccoin + رول "دوست صمیمی" (سطح ${highestLevel}/4)\n`;
      }
      
      if (totalXP < 1000) {
        nextRewardsText += `✨ 1000 XP دوستی: افکت پروفایل "دوستی درخشان" (${totalXP}/1000)\n`;
      } else if (totalXP < 2500) {
        nextRewardsText += `✨ 2500 XP دوستی: 100 کریستال (${totalXP}/2500)\n`;
      }
      
      if (nextRewardsText) {
        embed.addFields({ 
          name: '🎯 پاداش‌های بعدی', 
          value: nextRewardsText,
          inline: false 
        });
      }
    }
    
    // دکمه‌های عملیات
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friendship_rewards')
          .setLabel('🔙 بازگشت به پاداش‌های دوستی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
  } catch (error) {
    console.error("Error in claimFriendshipRewards:", error);
    await interaction.reply({
      content: "❌ خطایی در دریافت پاداش‌های دوستی رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * نمایش برترین دوستی‌ها
 * @param interaction برهم‌کنش با کاربر
 */
export async function showFriendshipLeaderboard(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد!",
        ephemeral: true
      });
    }
    
    // دریافت برترین دوستی‌ها (بر اساس امتیاز دوستی)
    const leaderboard = await storage.getFriendshipLeaderboard(10);
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setColor('#8E44AD') // بنفش
      .setTitle('🏆 برترین دوستی‌ها')
      .setDescription('لیست برترین دوستی‌ها بر اساس امتیاز دوستی')
      .setThumbnail('https://img.icons8.com/fluency/48/leaderboard.png');
    
    if (leaderboard && leaderboard.length > 0) {
      let leaderboardText = '';
      
      for (let i = 0; i < leaderboard.length; i++) {
        const friendship = leaderboard[i];
        const user1 = await storage.getUser(friendship.user1Id);
        const user2 = await storage.getUser(friendship.user2Id);
        
        if (user1 && user2) {
          const medalEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
          const levelEmoji = getLevelEmoji(friendship.level);
          
          leaderboardText += `${medalEmoji} **${user1.username} & ${user2.username}**\n`;
          leaderboardText += `${levelEmoji} سطح ${friendship.level} (${friendship.xp} XP)\n`;
          leaderboardText += `⏱️ از ${formatDate(friendship.startDate)}\n\n`;
        }
      }
      
      embed.addFields({ 
        name: '📊 برترین دوستی‌ها', 
        value: leaderboardText || 'هیچ دوستی یافت نشد',
        inline: false 
      });
    } else {
      embed.addFields({ 
        name: '📊 برترین دوستی‌ها', 
        value: 'هیچ دوستی یافت نشد',
        inline: false 
      });
    }
    
    // دکمه‌های عملیات
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friendship_level_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
  } catch (error) {
    console.error("Error in showFriendshipLeaderboard:", error);
    await interaction.reply({
      content: "❌ خطایی در نمایش برترین دوستی‌ها رخ داد!",
      ephemeral: true
    });
  }
}

/**
 * دریافت حداقل XP مورد نیاز برای یک سطح
 * @param level سطح دوستی
 * @returns حداقل XP مورد نیاز
 */
function getLevelMinXP(level: number): number {
  switch (level) {
    case 1: return 0;
    case 2: return 100;
    case 3: return 250;
    case 4: return 500;
    case 5: return 1000;
    default: return 0;
  }
}

/**
 * دریافت ایموجی مناسب برای سطح دوستی
 * @param level سطح دوستی
 * @returns ایموجی مناسب
 */
function getLevelEmoji(level: number): string {
  switch (level) {
    case 5: return '🌟'; // استاد دوستی
    case 4: return '💎'; // حرفه‌ای
    case 3: return '🔷'; // پیشرفته
    case 2: return '🔵'; // متوسط
    case 1: 
    default: return '⚪'; // مبتدی
  }
}

/**
 * دریافت ایموجی مناسب برای نوع فعالیت
 * @param activityType نوع فعالیت
 * @returns ایموجی مناسب
 */
function getActivityEmoji(activityType: string): string {
  switch (activityType) {
    case 'gift': return '🎁'; // هدیه
    case 'chat': return '💬'; // چت
    case 'quest': return '📜'; // ماموریت
    case 'clan_war': return '⚔️'; // وار کلن
    case 'level_up': return '🌟'; // افزایش سطح
    default: return '📝'; // پیش‌فرض
  }
}

/**
 * مدیریت تعاملات با منوی سطح دوستی
 * @param interaction برهم‌کنش با کاربر
 */
export async function handleFriendshipLevelInteraction(interaction: MessageComponentInteraction) {
  try {
    const customId = interaction.customId;
    
    if (customId === 'friendship_level_menu') {
      await friendshipLevelMenu(interaction);
      return;
    }
    
    if (customId === 'friendship_rewards') {
      await showFriendshipRewards(interaction);
      return;
    }
    
    if (customId === 'claim_friendship_rewards') {
      await claimFriendshipRewards(interaction);
      return;
    }
    
    if (customId === 'friendship_leaderboard') {
      await showFriendshipLeaderboard(interaction);
      return;
    }
    
    // بررسی آیا این تعامل مربوط به جزئیات دوستی است
    if (customId.startsWith('friendship_details_')) {
      const friendDiscordId = customId.replace('friendship_details_', '');
      await showFriendshipDetails(interaction, friendDiscordId);
      return;
    }
    
    // بررسی آیا این تعامل مربوط به تاریخچه دوستی است
    if (customId.startsWith('friendship_history_')) {
      const friendId = parseInt(customId.replace('friendship_history_', ''));
      await showFriendshipHistory(interaction, friendId);
      return;
    }
    
    // سایر موارد
    await friendshipLevelMenu(interaction);
    
  } catch (error) {
    console.error("Error in handleFriendshipLevelInteraction:", error);
    await interaction.reply({
      content: "❌ خطایی در پردازش تعامل رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}