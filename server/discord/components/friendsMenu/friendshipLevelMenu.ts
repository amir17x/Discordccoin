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
      
      // اضافه کردن راهنمای سیستم لِوِل دوستی با طراحی جذاب‌تر
      embed.addFields({
        name: '✨ راهنمای سطوح دوستی ✨',
        value: 
          '⚪ **سطح 1: آشنایی** (0-100 XP)\n' +
          '    ┗━ امکان ارسال درخواست هدیه روزانه\n\n' +
          '🔵 **سطح 2: دوستی** (100-250 XP)\n' +
          '    ┗━ تخفیف 5% در معاملات + پاداش 100 سکه\n\n' +
          '🔷 **سطح 3: صمیمیت** (250-500 XP)\n' +
          '    ┗━ امکان انتخاب به عنوان بهترین دوست + 10 کریستال\n\n' +
          '💎 **سطح 4: حرفه‌ای** (500-1000 XP)\n' +
          '    ┗━ افزایش 50% شانس موفقیت در ماموریت‌های مشترک\n\n' +
          '🌟 **سطح 5: استاد دوستی** (1000+ XP)\n' +
          '    ┗━ دریافت افکت ویژه پروفایل "پیوند ابدی" + 500 سکه',
        inline: false
      });
      
      embed.addFields({
        name: '🎮 روش‌های کسب XP دوستی 🎮',
        value: 
          '🎁 **هدیه دادن سکه**: +10 XP\n' +
          '💎 **هدیه دادن کریستال**: +20 XP\n' +
          '💬 **چت خصوصی**: +5 XP (هر 10 پیام)\n' +
          '🏆 **ماموریت گروهی**: +50 XP\n' +
          '⚔️ **شرکت در وار کلن**: +40 XP\n' +
          '🎯 **انجام مینی‌گیم با دوست**: +15 XP\n' +
          '🎪 **شرکت در رویداد مشترک**: +25 XP\n' +
          '🔄 **تعامل روزانه**: +3 XP (حداکثر یک بار در روز)',
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
    
    // ایجاد نوار پیشرفت زیبا
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
    
    // عنوان‌های سطوح دوستی با توضیحات جذاب
    const levelTitles = [
      "🤝 آشنایی جدید",
      "👥 دوستان معمولی",
      "🫂 دوستان خوب",
      "💙 دوستان صمیمی",
      "🌟 دوستان ابدی"
    ];
    
    // رنگ‌های متناسب با سطح دوستی
    const levelColors = [
      '#5865F2', // آبی روشن - سطح 1
      '#57F287', // سبز - سطح 2
      '#FEE75C', // زرد - سطح 3
      '#EB459E', // صورتی - سطح 4
      '#ED4245'  // قرمز - سطح 5
    ];
    
    // ایموجی‌های متنوع برای نمایش پیشرفت سطح
    const progressEmojis = ["🌱", "🌿", "🌴", "🌳", "🌲"];
    
    // ایجاد Embed با طراحی زیبا و رنگ متناسب با سطح دوستی
    const levelEmoji = getLevelEmoji(currentLevel);
    
    const embed = new EmbedBuilder()
      .setColor(levelColors[currentLevel - 1])
      .setTitle(`${levelEmoji} دوستی با ${friend.username}`)
      .setDescription(`**${levelTitles[currentLevel - 1]}**\nشما و ${friend.username} در سطح ${currentLevel} دوستی هستید!`)
      .setThumbnail('https://img.icons8.com/fluency/96/like.png');
    
    // محاسبه طول دوستی
    const startDate = new Date(friendship.addedAt);
    const currentDate = new Date();
    const durationInDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const durationInMonths = Math.floor(durationInDays / 30);
    const durationInYears = Math.floor(durationInMonths / 12);
    
    let durationText = '';
    if (durationInYears > 0) {
      durationText = `${durationInYears} سال و ${durationInMonths % 12} ماه`;
    } else if (durationInMonths > 0) {
      durationText = `${durationInMonths} ماه و ${durationInDays % 30} روز`;
    } else {
      durationText = `${durationInDays} روز`;
    }
    
    // بخش 1: کارت اطلاعات اصلی
    let mainInfoText = '';
    mainInfoText += `📅 **تاریخ شروع دوستی**: ${formatDate(friendship.addedAt)}\n`;
    mainInfoText += `⏱️ **طول دوستی**: ${durationText}\n`;
    mainInfoText += `🕒 **آخرین تعامل**: ${formatRelativeTime(friendship.lastInteraction)}\n`;
    
    embed.addFields({ 
      name: '📊 اطلاعات دوستی', 
      value: mainInfoText,
      inline: false 
    });
    
    // بخش 2: نمایش پیشرفت سطح با نوار گرافیکی
    let levelText = '';
    levelText += `${progressEmojis[currentLevel - 1]} **سطح ${currentLevel}**: ${levelTitles[currentLevel - 1]}\n`;
    levelText += `🔮 **امتیاز فعلی**: ${currentXP} XP\n`;
    
    if (currentLevel < 5) {
      levelText += `📈 **پیشرفت تا سطح بعدی**: ${progressBar} (${progressPercentage}%)\n`;
      levelText += `✨ **نیاز به ${nextLevelXP - currentXP} XP دیگر برای ارتقا به سطح بعدی**\n`;
    } else {
      levelText += `🏆 **تبریک!** شما به بالاترین سطح دوستی رسیده‌اید! 🎉\n`;
    }
    
    embed.addFields({ 
      name: '🌟 وضعیت سطح دوستی', 
      value: levelText,
      inline: false 
    });
    
    // بخش 3: وضعیت دوست صمیمی با نمایش گرافیکی
    if (currentLevel >= 3) {
      let bestFriendText = '';
      
      if (friendship.isBestFriend) {
        bestFriendText += `💎 ${friend.username} **دوست صمیمی** شماست!\n`;
        bestFriendText += `▪️ امکان ارسال پیام مستقیم بدون مصرف سکه\n`;
        bestFriendText += `▪️ اطلاع از وضعیت آنلاین/آفلاین\n`;
        bestFriendText += `▪️ دریافت نوتیفیکیشن‌ها و اعلان‌های ویژه\n`;
      } else {
        bestFriendText += `💫 شما می‌توانید ${friend.username} را به عنوان **دوست صمیمی** خود انتخاب کنید!\n`;
        bestFriendText += `▪️ از مزایای ویژه دوستان صمیمی بهره‌مند شوید\n`;
        bestFriendText += `▪️ فقط می‌توانید یک دوست صمیمی داشته باشید\n`;
      }
      
      embed.addFields({ 
        name: '💎 وضعیت دوست صمیمی', 
        value: bestFriendText,
        inline: false 
      });
    }
    
    // بخش 4: علایق مشترک با نمایش جذاب
    const userInterests = await storage.getUserInterests(user.id);
    const friendInterests = await storage.getUserInterests(friend.id);
    
    if (userInterests && friendInterests) {
      const commonGames = (userInterests.games || []).filter(game => (friendInterests.games || []).includes(game));
      const commonActivities = (userInterests.activities || []).filter(activity => (friendInterests.activities || []).includes(activity));
      const commonTopics = (userInterests.topics || []).filter(topic => (friendInterests.topics || []).includes(topic));
      
      const totalCommon = commonGames.length + commonActivities.length + commonTopics.length;
      
      if (totalCommon > 0) {
        let interestsText = '';
        
        if (commonGames.length > 0) {
          interestsText += `🎮 **بازی‌ها (${commonGames.length})**: ${commonGames.join('، ')}\n`;
        }
        
        if (commonActivities.length > 0) {
          interestsText += `🏆 **فعالیت‌ها (${commonActivities.length})**: ${commonActivities.join('، ')}\n`;
        }
        
        if (commonTopics.length > 0) {
          interestsText += `📝 **موضوعات (${commonTopics.length})**: ${commonTopics.join('، ')}\n`;
        }
        
        embed.addFields({ 
          name: `🔮 علایق مشترک (${totalCommon})`, 
          value: interestsText,
          inline: false 
        });
      } else {
        embed.addFields({ 
          name: '🔮 علایق مشترک', 
          value: 'هنوز علایق مشترکی ثبت نشده است. از منوی علایق، علایق خود را اضافه کنید!',
          inline: false 
        });
      }
    }
    
    // بخش 5: نکات افزایش XP دوستی
    embed.addFields({ 
      name: '💡 راه‌های افزایش XP دوستی', 
      value: '• ارسال هدیه به دوست خود\n• چت کردن با یکدیگر\n• شرکت در ماموریت‌های مشترک\n• شرکت در جنگ کلن‌ها به عنوان هم‌تیمی',
      inline: false 
    });
    
    // اضافه کردن دکمه‌های عملیات با طراحی زیبا
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
    
    // دکمه تنظیم/حذف بهترین دوست با طراحی جذاب‌تر
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
 * نمایش تاریخچه دوستی با یک دوست خاص با طراحی جذاب و زیبا
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
    const activities = await storage.getFriendshipActivities(user.id, friendId, 10);
    
    // رنگ‌ها و ایموجی‌های متنوع برای نمایش جذاب‌تر
    const historyColors = {
      gift: '#E91E63', // صورتی برای هدیه
      chat: '#2196F3', // آبی برای چت
      mission: '#FF9800', // نارنجی برای ماموریت
      clanWar: '#F44336', // قرمز برای جنگ کلن
      game: '#4CAF50', // سبز برای بازی
      event: '#9C27B0', // بنفش برای رویداد
      daily: '#00BCD4', // فیروزه‌ای برای تعامل روزانه
      bestFriend: '#FFEB3B' // زرد برای دوست صمیمی
    };
    
    // ایجاد Embed با طراحی زیبا
    const embed = new EmbedBuilder()
      .setColor('#8E44AD') // بنفش
      .setTitle(`📜 تاریخچه دوستی با ${friend.username}`)
      .setDescription(`سفر دوستی شما و ${friend.username} - لحظات خاطره‌انگیز و تعاملات شما`)
      .setThumbnail('https://img.icons8.com/fluency/96/activity-history.png');
    
    // محاسبه طول دوستی
    const startDate = new Date(friendship.addedAt);
    const currentDate = new Date();
    const durationInDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const durationInMonths = Math.floor(durationInDays / 30);
    const durationInYears = Math.floor(durationInMonths / 12);
    
    let durationText = '';
    if (durationInYears > 0) {
      durationText = `${durationInYears} سال و ${durationInMonths % 12} ماه`;
    } else if (durationInMonths > 0) {
      durationText = `${durationInMonths} ماه و ${durationInDays % 30} روز`;
    } else {
      durationText = `${durationInDays} روز`;
    }
    
    // بخش 1: خلاصه دوستی
    let summaryText = '';
    summaryText += `🎉 **تاریخ شروع دوستی**: ${formatDate(friendship.addedAt)}\n`;
    summaryText += `⏱️ **طول دوستی**: ${durationText}\n`;
    summaryText += `🤝 **وضعیت دوستی**: ${friendship.isBestFriend ? '💎 دوست صمیمی' : '👥 دوست معمولی'}\n`;
    summaryText += `💫 **امتیاز فعلی XP**: ${friendship.friendshipXP} امتیاز\n`;
    summaryText += `🌟 **سطح دوستی**: ${getLevelEmoji(friendship.friendshipLevel)} سطح ${friendship.friendshipLevel}\n`;
    
    embed.addFields({ 
      name: '📊 خلاصه دوستی', 
      value: summaryText, 
      inline: false 
    });
    
    // بخش 2: رویدادهای مهم با تاریخ
    let milestonesText = '';
    milestonesText += `🎀 **اولین دوستی**: ${formatDate(friendship.addedAt)}\n`;
    
    if (friendship.friendshipLevel >= 2) {
      milestonesText += `🔵 **رسیدن به سطح 2**: ${formatDate(new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000))}\n`;
    }
    
    if (friendship.friendshipLevel >= 3) {
      milestonesText += `🔷 **رسیدن به سطح 3**: ${formatDate(new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000))}\n`;
    }
    
    if (friendship.friendshipLevel >= 4) {
      milestonesText += `💎 **رسیدن به سطح 4**: ${formatDate(new Date(startDate.getTime() + 45 * 24 * 60 * 60 * 1000))}\n`;
    }
    
    if (friendship.friendshipLevel >= 5) {
      milestonesText += `🌟 **رسیدن به سطح 5**: ${formatDate(new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000))}\n`;
    }
    
    if (friendship.isBestFriend) {
      milestonesText += `💖 **انتخاب به عنوان دوست صمیمی**: ${formatDate(new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000))}\n`;
    }
    
    embed.addFields({ 
      name: '🏆 رویدادهای مهم', 
      value: milestonesText, 
      inline: false 
    });
    
    // بخش 3: آمار کلی تعاملات
    let statsText = '';
    
    // محاسبه آمار از تاریخچه (این بخش را براساس داده‌های واقعی تنظیم کنید)
    const giftCount = activities?.filter(a => a.type === 'gift')?.length || 0;
    const chatCount = activities?.filter(a => a.type === 'chat')?.length || 0;
    const missionCount = activities?.filter(a => a.type === 'mission')?.length || 0;
    const gameCount = activities?.filter(a => a.type === 'game')?.length || 0;
    const clanWarCount = activities?.filter(a => a.type === 'clanWar')?.length || 0;
    
    statsText += `🎁 **هدایای ارسال شده**: ${giftCount} هدیه\n`;
    statsText += `💬 **چت‌های خصوصی**: ~${chatCount * 10} پیام\n`;
    statsText += `🏆 **ماموریت‌های مشترک**: ${missionCount} ماموریت\n`;
    statsText += `🎮 **بازی‌های دو نفره**: ${gameCount} بازی\n`;
    statsText += `⚔️ **جنگ‌های کلن**: ${clanWarCount} مبارزه\n`;
    
    embed.addFields({ 
      name: '📈 آمار تعاملات', 
      value: statsText, 
      inline: false 
    });
    
    // بخش 4: تاریخچه فعالیت‌های اخیر با طراحی جذاب
    if (activities && activities.length > 0) {
      let historyText = '';
      
      for (const activity of activities) {
        const activityEmoji = getActivityEmoji(activity.type);
        const date = formatDate(activity.timestamp);
        
        // نمایش با فرمت زیباتر و ایموجی‌های مناسب
        historyText += `${activityEmoji} **${date}**\n`;
        historyText += `┗━ ${activity.details} _(+${activity.xpEarned} XP)_\n\n`;
      }
      
      embed.addFields({ 
        name: '📝 فعالیت‌های اخیر', 
        value: historyText || 'فعالیتی ثبت نشده است.', 
        inline: false 
      });
    } else {
      embed.addFields({ 
        name: '📝 فعالیت‌های اخیر', 
        value: 'شروع به فعالیت کنید! با هدیه دادن، چت کردن یا شرکت در ماموریت‌های مشترک، تاریخچه دوستی خود را غنی کنید.', 
        inline: false 
      });
    }
    
    // بخش 5: راهنمای کسب XP با طراحی جذاب‌تر
    embed.addFields({ 
      name: '✨ روش‌های افزایش XP دوستی ✨', 
      value: 
        '🎁 **هدیه دادن سکه**: +10 XP\n' +
        '    ┗━ نشانه محبت و دوستی واقعی!\n\n' +
        '💎 **هدیه دادن کریستال**: +20 XP\n' +
        '    ┗━ بهترین هدیه برای تقویت پیوند دوستی!\n\n' +
        '💬 **چت خصوصی**: +5 XP (هر 10 پیام)\n' +
        '    ┗━ گفتگو، کلید دوستی‌های پایدار است!\n\n' +
        '🏆 **ماموریت گروهی**: +50 XP\n' +
        '    ┗━ با هم قوی‌تر هستیم!\n\n' +
        '⚔️ **شرکت در وار کلن**: +40 XP\n' +
        '    ┗━ جنگیدن کنار دوستان، افتخار بزرگی است!',
      inline: false 
    });
    
    // دکمه‌های عملیات با طراحی جذاب‌تر
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
    
    // اضافه کردن اطلاعات پاداش‌های سطح دوستی با طراحی جذاب‌تر
    embed.addFields({ 
      name: '✨ پاداش‌های سطح دوستی ✨', 
      value: 
        '🔵 **سطح 2: دوست خوب**\n' +
        '    ┣━ 💰 100 Ccoin\n' +
        '    ┗━ 💎 5 کریستال\n\n' +
        '🔷 **سطح 3: دوست صمیمی**\n' +
        '    ┣━ 💰 200 Ccoin\n' +
        '    ┗━ 💎 10 کریستال\n\n' +
        '💎 **سطح 4: دوست حرفه‌ای**\n' +
        '    ┣━ 💰 300 Ccoin\n' +
        '    ┗━ 🏅 رول "دوست صمیمی"\n\n' +
        '🌟 **سطح 5: دوست افسانه‌ای**\n' +
        '    ┣━ 💰 500 Ccoin\n' +
        '    ┗━ ✨ افکت پروفایل "پیوند ابدی"',
      inline: false 
    });
    
    // اضافه کردن اطلاعات پاداش‌های تعداد دوستان با طراحی جذاب‌تر
    embed.addFields({ 
      name: '👥 پاداش‌های تعداد دوستان 👥', 
      value: 
        '🥉 **5 دوست: دایره کوچک**\n' +
        '    ┗━ 💰 500 Ccoin\n\n' +
        '🥈 **10 دوست: شبکه‌ساز**\n' +
        '    ┗━ 🏅 رول "اجتماعی"\n\n' +
        '🥇 **20 دوست: محبوب**\n' +
        '    ┗━ 💎 50 کریستال\n\n' +
        '👑 **50 دوست: شخصیت اجتماعی**\n' +
        '    ┗━ 📛 لقب "محبوب"\n\n' +
        '🏆 **100 دوست: افسانه اجتماعی**\n' +
        '    ┗━ 🐾 پت ویژه "دوستدار"',
      inline: false 
    });
    
    // اضافه کردن اطلاعات پاداش‌های امتیاز کل دوستی با طراحی جذاب‌تر
    embed.addFields({ 
      name: '🌈 پاداش‌های امتیاز کل دوستی 🌈', 
      value: 
        '⭐ **1000 XP: دوست درخشان**\n' +
        '    ┗━ ✨ افکت پروفایل "دوستی درخشان"\n\n' +
        '⭐⭐ **2500 XP: دوست ارزشمند**\n' +
        '    ┗━ 💎 100 کریستال\n\n' +
        '⭐⭐⭐ **5000 XP: دوست اسطوره‌ای**\n' +
        '    ┗━ 🏅 رول "اسطوره دوستی"\n\n' +
        '⭐⭐⭐⭐ **10000 XP: افسانه دوستی**\n' +
        '    ┗━ 👑 لقب "افسانه دوستی"',
      inline: false 
    });
    
    // اضافه کردن وضعیت پاداش‌های کاربر با طراحی جذاب‌تر
    let rewardsStatus = '';
    
    // تعداد دوستان
    if (friends.length >= 5) {
      rewardsStatus += '✅ **5 دوست: 500 Ccoin**\n' +
        '    ┗━ 🎉 **دریافت شده!**\n\n';
    } else {
      const progressPercent = Math.min(100, Math.floor((friends.length / 5) * 100));
      const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
      rewardsStatus += `❌ **5 دوست: 500 Ccoin**\n` +
        `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
        `    ┗━ وضعیت: ${friends.length}/5 دوست\n\n`;
    }
    
    if (friends.length >= 10) {
      rewardsStatus += '✅ **10 دوست: رول "اجتماعی"**\n' +
        '    ┗━ 🎉 **دریافت شده!**\n\n';
    } else if (friends.length >= 5) {
      const progressPercent = Math.min(100, Math.floor(((friends.length - 5) / 5) * 100));
      const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
      rewardsStatus += `❌ **10 دوست: رول "اجتماعی"**\n` +
        `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
        `    ┗━ وضعیت: ${friends.length}/10 دوست\n\n`;
    }
    
    // بالاترین سطح دوستی
    if (highestLevel >= 3) {
      rewardsStatus += '✅ **سطح 3 دوستی: 200 Ccoin + 10 کریستال**\n' +
        '    ┗━ 🎉 **دریافت شده!**\n\n';
    } else if (highestLevel > 0) {
      const progressPercent = Math.min(100, Math.floor((highestLevel / 3) * 100));
      const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
      rewardsStatus += `❌ **سطح 3 دوستی: 200 Ccoin + 10 کریستال**\n` +
        `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
        `    ┗━ وضعیت: سطح ${highestLevel}/3\n\n`;
    } else {
      rewardsStatus += '❌ **سطح 3 دوستی: 200 Ccoin + 10 کریستال**\n' +
        '    ┣━ پیشرفت: ░░░░░░░░░░ 0%\n' + 
        '    ┗━ وضعیت: سطح 0/3\n\n';
    }
    
    // امتیاز کل دوستی
    if (totalXP >= 1000) {
      rewardsStatus += '✅ **1000 XP دوستی: افکت پروفایل "دوستی درخشان"**\n' +
        '    ┗━ 🎉 **دریافت شده!**\n\n';
    } else {
      const progressPercent = Math.min(100, Math.floor((totalXP / 1000) * 100));
      const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
      rewardsStatus += `❌ **1000 XP دوستی: افکت پروفایل "دوستی درخشان"**\n` +
        `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
        `    ┗━ وضعیت: ${totalXP}/1000 XP\n\n`;
    }
    
    embed.addFields({ 
      name: '📊 وضعیت پاداش‌های فعلی شما 📊', 
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
      // نمایش پاداش‌های دریافت شده با طراحی زیباتر
      let rewardsText = '';
      
      for (const reward of claimableRewards) {
        if (!reward.claimed) {
          // اضافه کردن ایموجی مناسب برای هر نوع پاداش
          let rewardEmoji = '🎁';
          if (reward.description.includes('Ccoin')) {
            rewardEmoji = '💰';
          } else if (reward.description.includes('کریستال')) {
            rewardEmoji = '💎';
          } else if (reward.description.includes('رول')) {
            rewardEmoji = '🏅';
          } else if (reward.description.includes('افکت')) {
            rewardEmoji = '✨';
          }
          
          rewardsText += `${rewardEmoji} **${reward.description}**\n` +
                       `    ┗━ 🎉 **با موفقیت دریافت شد!**\n\n`;
        }
      }
      
      embed.setDescription('🌟 **تبریک!** 🌟\n\nشما با موفقیت پاداش‌های زیر را برای فعالیت‌های دوستی خود دریافت کردید:');
      embed.addFields({ 
        name: '🏆 پاداش‌های دریافت شده 🏆', 
        value: rewardsText,
        inline: false 
      });
    } else {
      // نمایش پیام عدم وجود پاداش
      embed.setDescription('در حال حاضر هیچ پاداش جدیدی برای دریافت ندارید. با گسترش روابط دوستی خود، پاداش‌های بیشتری کسب کنید.');
      
      if (claimableRewards.length > 0) {
        let alreadyClaimedText = '';
        
        for (const reward of claimableRewards) {
          // اضافه کردن ایموجی مناسب برای هر نوع پاداش
          let rewardEmoji = '🎁';
          if (reward.description.includes('Ccoin')) {
            rewardEmoji = '💰';
          } else if (reward.description.includes('کریستال')) {
            rewardEmoji = '💎';
          } else if (reward.description.includes('رول')) {
            rewardEmoji = '🏅';
          } else if (reward.description.includes('افکت')) {
            rewardEmoji = '✨';
          }
          
          alreadyClaimedText += `${rewardEmoji} **${reward.description}**\n` +
                            `    ┗━ ✓ قبلاً دریافت شده\n\n`;
        }
        
        embed.addFields({ 
          name: '🏆 پاداش‌های قبلی شما', 
          value: alreadyClaimedText,
          inline: false 
        });
      }
      
      // نمایش پاداش‌های بعدی با طراحی جذاب‌تر
      let nextRewardsText = '';
      
      if (friends.length < 5) {
        const progressPercent = Math.min(100, Math.floor((friends.length / 5) * 100));
        const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
        nextRewardsText += `💰 **5 دوست: 500 Ccoin**\n` +
          `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
          `    ┗━ وضعیت: ${friends.length}/5 دوست\n\n`;
      } else if (friends.length < 10) {
        const progressPercent = Math.min(100, Math.floor(((friends.length - 5) / 5) * 100));
        const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
        nextRewardsText += `🏅 **10 دوست: رول "اجتماعی"**\n` +
          `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
          `    ┗━ وضعیت: ${friends.length}/10 دوست\n\n`;
      } else if (friends.length < 20) {
        const progressPercent = Math.min(100, Math.floor(((friends.length - 10) / 10) * 100));
        const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
        nextRewardsText += `💎 **20 دوست: 50 کریستال**\n` +
          `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
          `    ┗━ وضعیت: ${friends.length}/20 دوست\n\n`;
      }
      
      if (highestLevel < 3) {
        const progressPercent = Math.min(100, Math.floor((highestLevel / 3) * 100));
        const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
        nextRewardsText += `🌟 **سطح 3 دوستی: 200 Ccoin + 10 کریستال**\n` +
          `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
          `    ┗━ وضعیت: سطح ${highestLevel}/3\n\n`;
      } else if (highestLevel < 4) {
        const progressPercent = Math.min(100, Math.floor(((highestLevel - 3) / 1) * 100));
        const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
        nextRewardsText += `🌟 **سطح 4 دوستی: 300 Ccoin + رول "دوست صمیمی"**\n` +
          `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
          `    ┗━ وضعیت: سطح ${highestLevel}/4\n\n`;
      }
      
      if (totalXP < 1000) {
        const progressPercent = Math.min(100, Math.floor((totalXP / 1000) * 100));
        const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
        nextRewardsText += `✨ **1000 XP دوستی: افکت پروفایل "دوستی درخشان"**\n` +
          `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
          `    ┗━ وضعیت: ${totalXP}/1000 XP\n\n`;
      } else if (totalXP < 2500) {
        const progressPercent = Math.min(100, Math.floor(((totalXP - 1000) / 1500) * 100));
        const progressBar = '▓'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));
        nextRewardsText += `✨ **2500 XP دوستی: 100 کریستال**\n` +
          `    ┣━ پیشرفت: ${progressBar} ${progressPercent}%\n` + 
          `    ┗━ وضعیت: ${totalXP}/2500 XP\n\n`;
      }
      
      if (nextRewardsText) {
        embed.addFields({ 
          name: '🎯 پاداش‌های بعدی شما', 
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
    
    // ساخت رنگ‌های مختلف برای رتبه‌های مختلف برای جذابیت بیشتر
    const rankColors = [
      '#FFD700', // طلایی برای رتبه 1
      '#C0C0C0', // نقره‌ای برای رتبه 2
      '#CD7F32', // برنزی برای رتبه 3
      '#9C27B0', // بنفش برای سایر رتبه‌ها
    ];
    
    const color = leaderboard && leaderboard.length > 0 ? rankColors[0] : '#9C27B0';
    
    // ایجاد Embed با طراحی زیباتر
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🏆 برترین دوستی‌های سرور')
      .setDescription('🌟 **دوستی‌های برتر سرور ما** 🌟\nبهترین دوستی‌ها بر اساس میزان تعامل، هدیه دادن و فعالیت‌های مشترک')
      .setThumbnail('https://img.icons8.com/fluency/96/trophy.png');
    
    if (leaderboard && leaderboard.length > 0) {
      // بخش 1: جدول لیدربورد با فرمت زیباتر
      let leaderboardText = '';
      
      // اضافه کردن ردیف عنوان جدول با طراحی جذاب‌تر
      leaderboardText += '```ansi\n';
      leaderboardText += '┏━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━┓\n';
      leaderboardText += '┃ \u001b[1;33mرتبه\u001b[0m ┃ \u001b[1;36m          نام‌ها          \u001b[0m ┃ \u001b[1;32m  سطح  \u001b[0m ┃ \u001b[1;35m  XP   \u001b[0m ┃\n';
      leaderboardText += '┣━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━┫\n';
      
      for (let i = 0; i < leaderboard.length; i++) {
        const friendship = leaderboard[i];
        const user1 = await storage.getUser(friendship.user1Id);
        const user2 = await storage.getUser(friendship.user2Id);
        
        if (user1 && user2) {
          // رتبه‌های 1 تا 3 با ایموجی مدال، سایرین با شماره
          const medalEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1} `;
          const levelEmoji = getLevelEmoji(friendship.level);
          const names = `${user1.username} & ${user2.username}`;
          
          // مقادیر در جدول با padEnd برای تراز بندی مناسب
          const namesPadded = names.substring(0, 20).padEnd(21, ' ');
          const levelInfo = `${levelEmoji}${friendship.level}`.padEnd(7, ' ');
          const xpInfo = `${friendship.xp}`.padStart(6, ' ');
          
          // استفاده از رنگ‌های مختلف برای رتبه‌های متفاوت (ANSI colors)
          if (i === 0) {
            leaderboardText += `┃ \u001b[1;33m ${medalEmoji}\u001b[0m ┃ \u001b[1;33m${namesPadded}\u001b[0m┃ \u001b[1;33m${levelInfo}\u001b[0m┃ \u001b[1;33m${xpInfo}\u001b[0m ┃\n`;
          } else if (i === 1) {
            leaderboardText += `┃ \u001b[1;37m ${medalEmoji}\u001b[0m ┃ \u001b[1;37m${namesPadded}\u001b[0m┃ \u001b[1;37m${levelInfo}\u001b[0m┃ \u001b[1;37m${xpInfo}\u001b[0m ┃\n`;
          } else if (i === 2) {
            leaderboardText += `┃ \u001b[0;33m ${medalEmoji}\u001b[0m ┃ \u001b[0;33m${namesPadded}\u001b[0m┃ \u001b[0;33m${levelInfo}\u001b[0m┃ \u001b[0;33m${xpInfo}\u001b[0m ┃\n`;
          } else {
            leaderboardText += `┃  ${medalEmoji}  ┃ ${namesPadded}┃ ${levelInfo}┃ ${xpInfo} ┃\n`;
          }
        }
      }
      
      leaderboardText += '┗━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━┛\n';
      leaderboardText += '```\n\n';
      
      embed.addFields({ 
        name: '📊 جدول برترین دوستی‌ها', 
        value: leaderboardText,
        inline: false 
      });
      
      // بخش 2: اطلاعات رکوردداران و آمار جالب
      let statsText = '';
      
      // رکورد‌های دوستی
      const topFriendship = leaderboard[0];
      if (topFriendship) {
        const user1 = await storage.getUser(topFriendship.user1Id);
        const user2 = await storage.getUser(topFriendship.user2Id);
        
        if (user1 && user2) {
          statsText += `🏆 **برترین دوستی**: ${user1.username} و ${user2.username} با ${topFriendship.xp} XP\n`;
          
          // محاسبه طول دوستی
          const startDate = new Date(topFriendship.startDate);
          const currentDate = new Date();
          const durationInDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          statsText += `⏱️ **طول دوستی**: ${durationInDays} روز (از ${formatDate(topFriendship.startDate)})\n`;
          
          // امتیاز متوسط در روز
          const avgXpPerDay = Math.floor(topFriendship.xp / Math.max(1, durationInDays));
          statsText += `📈 **متوسط XP روزانه**: ${avgXpPerDay} XP\n\n`;
        }
      }
      
      // آمار کلی و رکوردها
      const highestLevel = Math.max(...leaderboard.map(f => f.level));
      const totalXP = leaderboard.reduce((sum, f) => sum + f.xp, 0);
      const avgXP = Math.floor(totalXP / leaderboard.length);
      
      statsText += `🔍 **آمار جالب دوستی‌ها**:\n`;
      statsText += `• بالاترین سطح دوستی: ${getLevelEmoji(highestLevel)} سطح ${highestLevel}\n`;
      statsText += `• میانگین XP دوستی‌ها: ${avgXP} XP\n`;
      statsText += `• تعداد دوستی‌های فعال: ${leaderboard.length}\n`;
      
      // جایگاه شما در لیدربورد (اگر وجود داشته باشد)
      const userFriendships = leaderboard.filter(f => 
        f.user1Id === user.id || f.user2Id === user.id
      );
      
      if (userFriendships.length > 0) {
        const highestUserFriendship = userFriendships.sort((a, b) => b.xp - a.xp)[0];
        const userRank = leaderboard.findIndex(f => 
          (f.user1Id === highestUserFriendship.user1Id && f.user2Id === highestUserFriendship.user2Id) ||
          (f.user1Id === highestUserFriendship.user2Id && f.user2Id === highestUserFriendship.user1Id)
        ) + 1;
        
        const friendId = highestUserFriendship.user1Id === user.id ? 
          highestUserFriendship.user2Id : highestUserFriendship.user1Id;
        const friend = await storage.getUser(friendId);
        
        if (friend) {
          statsText += `\n🌟 **جایگاه شما**: رتبه ${userRank} (دوستی با ${friend.username})\n`;
          statsText += `• امتیاز دوستی شما: ${highestUserFriendship.xp} XP\n`;
          statsText += `• سطح دوستی شما: ${getLevelEmoji(highestUserFriendship.level)} سطح ${highestUserFriendship.level}\n`;
        }
      }
      
      embed.addFields({ 
        name: '🌠 رکوردها و آمار', 
        value: statsText,
        inline: false 
      });
      
      // بخش 3: نکات افزایش XP دوستی
      embed.addFields({ 
        name: '💡 راه‌های افزایش رتبه دوستی', 
        value: 
          '• 🎁 **هدیه دادن سکه یا کریستال** به دوستان\n' +
          '• 💬 **چت خصوصی** با دوستان (هر 10 پیام)\n' +
          '• 🏆 **انجام ماموریت‌های مشترک** با دوستان\n' +
          '• ⚔️ **شرکت در وار کلن** به‌عنوان هم‌تیمی\n' +
          '• 🎮 **انجام مینی‌گیم‌ها** به صورت دوستانه',
        inline: false 
      });
      
    } else {
      // اگر هیچ دوستی وجود نداشت
      embed.addFields({ 
        name: '📊 برترین دوستی‌ها', 
        value: '💫 **هنوز هیچ دوستی در سرور ثبت نشده است**\n\n✨ اولین نفر باشید! با افزودن دوست جدید و برقراری تعامل، نام خود را در صدر این لیست قرار دهید!',
        inline: false 
      });
      
      // راهنمای اضافه کردن دوست
      embed.addFields({ 
        name: '🤝 چگونه دوست اضافه کنم؟', 
        value: '1️⃣ به منوی اصلی دوستان بروید\n2️⃣ گزینه "افزودن دوست" را انتخاب کنید\n3️⃣ نام کاربری یا شناسه دیسکورد دوست خود را وارد کنید\n4️⃣ بعد از پذیرش درخواست، می‌توانید با هدیه دادن و فعالیت مشترک XP دوستی کسب کنید!',
        inline: false 
      });
      
      // مزایای دوستی با امتیاز بالا
      embed.addFields({ 
        name: '✨ مزایای دوستی‌های برتر', 
        value: '• 💎 **پاداش‌های ویژه** در سطوح مختلف دوستی\n• 🏅 **نمایش در لیدربورد** برترین دوستی‌ها\n• 🎭 **دسترسی به امکانات منحصر به فرد** در سطوح بالاتر\n• 💰 **تخفیف در معاملات** با دوستان دارای سطح بالاتر',
        inline: false 
      });
    }
    
    // دکمه‌های عملیات با طراحی جذاب‌تر
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('👥 منوی دوستان')
          .setStyle(ButtonStyle.Primary),
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