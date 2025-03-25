import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { storage } from '../../../storage';
import { formatNumber, formatDate, formatRelativeTime } from '../../utils/formatter';
import * as anonymousChatMenu from '../anonymousChatMenu/anonymousChatMenu';
import { friendshipLevelMenu, handleFriendshipLevelInteraction } from './friendshipLevelMenu';
import { giftToFriendMenu, handleGiftMenuInteraction } from './giftMenu';
import { interestsAndSuggestionsMenu, handleInterestsMenuInteraction } from './friendInterestsMenu';

/**
 * منوی اصلی سیستم دوستان
 * @param interaction برهم‌کنش با کاربر
 */
export async function friendsMainMenu(interaction: MessageComponentInteraction) {
  try {
    const userId = interaction.user.id;
    const user = await storage.getUserByDiscordId(userId);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // ایجاد Embed اصلی
    const embed = new EmbedBuilder()
      .setColor('#4E5D94') // رنگ آبی متمایل به بنفش
      .setTitle('👥 سیستم دوستان و چت')
      .setDescription(`${interaction.user.username} عزیز، به سیستم دوستان و چت ناشناس Ccoin خوش آمدید!\n\nدر این بخش می‌توانید دوستان خود را مدیریت کنید، با آن‌ها چت کنید، یا به صورت ناشناس با دیگران گفتگو کنید.`)
      .setThumbnail(interaction.user.displayAvatarURL() || interaction.client.user?.displayAvatarURL())
      .addFields(
        { name: '💬 چت ناشناس', value: 'گفتگوی ناشناس با کاربران دیگر', inline: true },
        { name: '👥 دوستان', value: 'مدیریت لیست دوستان', inline: true },
        { name: '🔍 جستجو', value: 'یافتن دوستان جدید', inline: true }
      )
      .setFooter({ text: '🌟 با بروزرسانی جدید، امکان چت ناشناس و سیستم دوستان اضافه شده است!' });
    
    // ایجاد دکمه‌های منو
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friends_list')
          .setLabel('👥 لیست دوستان')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('friend_requests')
          .setLabel('📩 درخواست‌های دوستی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('add_friend')
          .setLabel('➕ افزودن دوست')
          .setStyle(ButtonStyle.Success)
      );
      
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('anonymous_chat')
          .setLabel('🎭 چت ناشناس')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('blocked_users')
          .setLabel('🚫 کاربران مسدود')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🏠 بازگشت به منوی اصلی')
          .setStyle(ButtonStyle.Secondary)
      );
      
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    }
  } catch (error) {
    console.error("Error in friendsMainMenu:", error);
    if (interaction.deferred) {
      await interaction.editReply({ content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید." });
    } else {
      await interaction.reply({ content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.", ephemeral: true });
    }
  }
}

/**
 * نمایش لیست دوستان کاربر
 * @param interaction برهم‌کنش با کاربر
 */
export async function friendsList(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // دریافت لیست دوستان
    const friends = await storage.getFriends(user.id);
    
    if (!friends || friends.length === 0) {
      // اگر دوستی وجود نداشت
      const noFriendsEmbed = new EmbedBuilder()
        .setColor('#8A8A8A') // خاکستری
        .setTitle('👥 لیست دوستان')
        .setDescription('شما هنوز دوستی اضافه نکرده‌اید!')
        .setThumbnail('https://img.icons8.com/fluency/48/group.png')
        .addFields(
          { name: '💭 پیشنهاد', value: 'برای افزودن دوست جدید، از دکمه «افزودن دوست» استفاده کنید یا به چت ناشناس بروید و افراد جدید را ملاقات کنید.' }
        );
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_friend')
            .setLabel('➕ افزودن دوست')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('anonymous_chat')
            .setLabel('🎭 چت ناشناس')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({ embeds: [noFriendsEmbed], components: [row] });
    }
    
    // ایجاد Embed برای لیست دوستان
    const friendsEmbed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('👥 لیست دوستان')
      .setDescription(`شما ${friends.length} دوست دارید!`)
      .setThumbnail('https://img.icons8.com/fluency/48/group.png');
    
    // افزودن فیلد برای هر دوست (حداکثر 10 دوست)
    const maxDisplayed = Math.min(friends.length, 10);
    for (let i = 0; i < maxDisplayed; i++) {
      const friend = friends[i];
      const friendUser = await storage.getUserByDiscordId(friend.friendId);
      
      if (friendUser) {
        const level = friend.friendshipLevel;
        const levelEmoji = getLevelEmoji(level);
        
        friendsEmbed.addFields({
          name: `${levelEmoji} ${friendUser.username}`,
          value: `سطح دوستی: ${level} | آخرین تعامل: ${formatRelativeTime(friend.lastInteraction)}`,
          inline: false
        });
      }
    }
    
    // اگر تعداد دوستان بیشتر از 10 نفر بود
    if (friends.length > 10) {
      friendsEmbed.addFields({
        name: '🔍 موارد بیشتر',
        value: `و ${friends.length - 10} دوست دیگر...`,
        inline: false
      });
    }
    
    // ساخت منوی کشویی برای انتخاب دوست
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_friend')
      .setPlaceholder('یک دوست را انتخاب کنید...')
      .setMinValues(1)
      .setMaxValues(1);
    
    // افزودن گزینه‌ها به منوی کشویی
    for (const friend of friends) {
      const friendUser = await storage.getUserByDiscordId(friend.friendId);
      if (friendUser) {
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(friendUser.username)
            .setDescription(`سطح دوستی: ${friend.friendshipLevel}`)
            .setValue(friend.friendId)
            .setEmoji(getLevelEmoji(friend.friendshipLevel))
        );
      }
    }
    
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
    
    // دکمه‌های عملیات
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('add_friend')
          .setLabel('➕ افزودن دوست')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [friendsEmbed],
      components: [selectRow, buttonRow]
    });
  } catch (error) {
    console.error("Error in friendsList:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * نمایش درخواست‌های دوستی
 * @param interaction برهم‌کنش با کاربر
 */
export async function friendRequests(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // دریافت درخواست‌های دوستی
    const allRequests = await storage.getFriendRequests(user.id);
    
    // فیلتر کردن درخواست‌های دریافتی در حالت انتظار
    const incomingRequests = allRequests.filter(req => 
      req.toUserId === user.discordId && req.status === 'pending'
    );
    
    // فیلتر کردن درخواست‌های ارسالی در حالت انتظار
    const outgoingRequests = allRequests.filter(req => 
      req.fromUserId === user.discordId && req.status === 'pending'
    );
    
    if (incomingRequests.length === 0 && outgoingRequests.length === 0) {
      // اگر درخواستی وجود نداشت
      const noRequestsEmbed = new EmbedBuilder()
        .setColor('#8A8A8A')
        .setTitle('📩 درخواست‌های دوستی')
        .setDescription('شما درخواست دوستی فعالی ندارید!')
        .setThumbnail('https://img.icons8.com/fluency/48/add-user-male.png')
        .addFields(
          { name: '💭 پیشنهاد', value: 'برای افزودن دوست جدید، از دکمه «افزودن دوست» استفاده کنید.' }
        );
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_friend')
            .setLabel('➕ افزودن دوست')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({ embeds: [noRequestsEmbed], components: [row] });
    }
    
    // ایجاد Embed برای درخواست‌ها
    const requestsEmbed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('📩 درخواست‌های دوستی')
      .setThumbnail('https://img.icons8.com/fluency/48/add-user-male.png');
    
    // بخش درخواست‌های دریافتی
    if (incomingRequests.length > 0) {
      let incomingDescription = '';
      
      for (const request of incomingRequests) {
        const fromUser = await storage.getUserByDiscordId(request.fromUserId);
        if (fromUser) {
          incomingDescription += `👤 **${fromUser.username}** - `;
          incomingDescription += `_${formatRelativeTime(request.timestamp)}_\n`;
          if (request.message) {
            incomingDescription += `💬 پیام: ${request.message}\n`;
          }
          incomingDescription += `_شناسه: \`${request.fromUserId}_${request.toUserId}\`_\n\n`;
        }
      }
      
      requestsEmbed.addFields({
        name: `📥 درخواست‌های دریافتی (${incomingRequests.length})`,
        value: incomingDescription || '---',
        inline: false
      });
    }
    
    // بخش درخواست‌های ارسالی
    if (outgoingRequests.length > 0) {
      let outgoingDescription = '';
      
      for (const request of outgoingRequests) {
        const toUser = await storage.getUserByDiscordId(request.toUserId);
        if (toUser) {
          outgoingDescription += `👤 **${toUser.username}** - `;
          outgoingDescription += `_${formatRelativeTime(request.timestamp)}_\n`;
          if (request.message) {
            outgoingDescription += `💬 پیام: ${request.message}\n`;
          }
          outgoingDescription += `_شناسه: \`${request.fromUserId}_${request.toUserId}\`_\n\n`;
        }
      }
      
      requestsEmbed.addFields({
        name: `📤 درخواست‌های ارسالی (${outgoingRequests.length})`,
        value: outgoingDescription || '---',
        inline: false
      });
    }
    
    // اگر درخواست دریافتی وجود دارد، فرم قبول/رد اضافه می‌شود
    if (incomingRequests.length > 0) {
      requestsEmbed.addFields({
        name: '⚠️ راهنما',
        value: 'برای قبول یا رد درخواست، از دکمه‌های زیر استفاده کنید و شناسه درخواست را وارد کنید.',
        inline: false
      });
      
      // دکمه‌های عملیات
      const rowAction = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('accept_friend_request')
            .setLabel('✅ قبول درخواست')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('reject_friend_request')
            .setLabel('❌ رد درخواست')
            .setStyle(ButtonStyle.Danger)
        );
      
      const rowNav = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_friend')
            .setLabel('➕ ارسال درخواست جدید')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // ارسال پاسخ
      await interaction.update({
        embeds: [requestsEmbed],
        components: [rowAction, rowNav]
      });
    } else {
      // فقط درخواست‌های ارسالی دارد
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_friend')
            .setLabel('➕ ارسال درخواست جدید')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // ارسال پاسخ
      await interaction.update({
        embeds: [requestsEmbed],
        components: [row]
      });
    }
  } catch (error) {
    console.error("Error in friendRequests:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
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
 * جستجوی کاربر برای ارسال درخواست دوستی
 * @param interaction برهم‌کنش با کاربر
 */
export async function searchUserForFriendRequest(interaction: MessageComponentInteraction) {
  try {
    // ایجاد Embed برای فرم جستجو
    const searchEmbed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('🔍 جستجوی کاربر')
      .setDescription('لطفاً نام کاربری یا شناسه دیسکورد شخص مورد نظر را وارد کنید.')
      .addFields(
        { name: '⚠️ راهنما', value: 'برای ارسال درخواست دوستی، باید نام کاربری دقیق یا شناسه دیسکورد فرد را وارد کنید.' }
      );
    
    // دکمه بازگشت
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [searchEmbed],
      components: [row]
    });
    
    // ایجاد فیلتر برای دریافت پاسخ کاربر
    const filter = (m: any) => m.author.id === interaction.user.id;
    const collector = interaction.channel?.createMessageCollector({ filter, time: 60000, max: 1 });
    
    collector?.on('collect', async (message) => {
      try {
        // حذف پیام کاربر برای تمیزی چت
        if (message.deletable) {
          await message.delete().catch(() => {});
        }
        
        const query = message.content.trim();
        
        // بررسی اینکه آیا ورودی شناسه دیسکورد است یا نام کاربری
        let targetUser;
        if (/^\d{17,19}$/.test(query)) {
          // اگر شناسه دیسکورد است
          targetUser = await storage.getUserByDiscordId(query);
        } else {
          // جستجو بر اساس نام کاربری
          const allUsers = await storage.getAllUsers();
          targetUser = allUsers.find(u => u.username.toLowerCase() === query.toLowerCase());
        }
        
        if (!targetUser) {
          // کاربر یافت نشد
          const notFoundEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ کاربر یافت نشد')
            .setDescription('کاربری با این نام کاربری یا شناسه دیسکورد یافت نشد!')
            .addFields(
              { name: '💡 راهنمایی', value: 'لطفاً مطمئن شوید که نام کاربری یا شناسه دیسکورد به درستی وارد شده است.' }
            );
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('add_friend')
                .setLabel('🔍 جستجوی مجدد')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🔙 بازگشت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          await interaction.followUp({
            embeds: [notFoundEmbed],
            components: [row],
            ephemeral: true
          });
          return;
        }
        
        // بررسی اینکه کاربر خودش نباشد
        if (targetUser.discordId === interaction.user.id) {
          const selfEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ خطا')
            .setDescription('شما نمی‌توانید به خودتان درخواست دوستی ارسال کنید!')
            .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('add_friend')
                .setLabel('🔍 جستجوی مجدد')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🔙 بازگشت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          await interaction.followUp({
            embeds: [selfEmbed],
            components: [row],
            ephemeral: true
          });
          return;
        }
        
        // بررسی اینکه کاربر از قبل دوست نباشد
        const currentUser = await storage.getUserByDiscordId(interaction.user.id);
        if (!currentUser) return;
        
        const friends = await storage.getFriends(currentUser.id);
        if (friends.some(f => f.friendId === targetUser.discordId)) {
          const alreadyFriendEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ خطا')
            .setDescription(`شما در حال حاضر با **${targetUser.username}** دوست هستید!`)
            .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('add_friend')
                .setLabel('🔍 جستجوی مجدد')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🔙 بازگشت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          await interaction.followUp({
            embeds: [alreadyFriendEmbed],
            components: [row],
            ephemeral: true
          });
          return;
        }
        
        // بررسی اینکه درخواست قبلی در انتظار نباشد
        const requests = await storage.getFriendRequests(currentUser.id);
        if (requests.some(r => 
          (r.fromUserId === currentUser.discordId && r.toUserId === targetUser.discordId) || 
          (r.fromUserId === targetUser.discordId && r.toUserId === currentUser.discordId)
        )) {
          const pendingRequestEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ خطا')
            .setDescription(`قبلاً یک درخواست دوستی بین شما و **${targetUser.username}** ارسال شده است!`)
            .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('friend_requests')
                .setLabel('📩 مشاهده درخواست‌ها')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🔙 بازگشت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          await interaction.followUp({
            embeds: [pendingRequestEmbed],
            components: [row],
            ephemeral: true
          });
          return;
        }
        
        // نمایش فرم ارسال درخواست
        const sendRequestEmbed = new EmbedBuilder()
          .setColor('#4E5D94')
          .setTitle('✉️ ارسال درخواست دوستی')
          .setDescription(`آیا می‌خواهید به **${targetUser.username}** درخواست دوستی ارسال کنید؟`)
          .setThumbnail(targetUser.avatar || 'https://img.icons8.com/fluency/48/user.png')
          .addFields(
            { name: '💬 پیام (اختیاری)', value: 'می‌توانید پیامی همراه درخواست دوستی ارسال کنید. برای این کار، متن پیام خود را در کانال بنویسید.' }
          );
        
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`send_friend_request_${targetUser.id}`)
              .setLabel('✅ ارسال درخواست')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('add_friend')
              .setLabel('🔍 جستجوی مجدد')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('friends_menu')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Secondary)
          );
        
        await interaction.followUp({
          embeds: [sendRequestEmbed],
          components: [actionRow],
          ephemeral: true
        });
      } catch (error) {
        console.error("Error processing search:", error);
        await interaction.followUp({
          content: "❌ خطایی در جستجوی کاربر رخ داد!",
          ephemeral: true
        });
      }
    });
    
    collector?.on('end', (collected) => {
      if (collected.size === 0) {
        // تایم‌اوت جستجو
        interaction.followUp({
          content: "⏱️ زمان جستجو به پایان رسید!",
          ephemeral: true
        }).catch(() => {});
      }
    });
  } catch (error) {
    console.error("Error in searchUserForFriendRequest:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * ارسال درخواست دوستی
 * @param interaction برهم‌کنش با کاربر
 * @param targetUserId شناسه کاربر مقصد
 */
export async function sendFriendRequest(interaction: MessageComponentInteraction, targetUserId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) return;
    
    // دریافت پیام اختیاری
    const messageEmbed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('💬 ارسال پیام همراه درخواست')
      .setDescription('لطفاً پیامی که می‌خواهید همراه درخواست دوستی ارسال شود، وارد کنید.\nیا برای ارسال بدون پیام، "بدون پیام" را بنویسید.')
      .setFooter({ text: '⏱️ 60 ثانیه فرصت دارید.' });
    
    await interaction.update({
      embeds: [messageEmbed],
      components: []
    });
    
    // ایجاد فیلتر برای دریافت پیام
    const filter = (m: any) => m.author.id === interaction.user.id;
    const collector = interaction.channel?.createMessageCollector({ filter, time: 60000, max: 1 });
    
    collector?.on('collect', async (message) => {
      try {
        // حذف پیام کاربر
        if (message.deletable) {
          await message.delete().catch(() => {});
        }
        
        const messageContent = message.content.trim();
        let requestMessage = messageContent;
        
        // اگر "بدون پیام" وارد شده، پیامی ارسال نمی‌شود
        if (messageContent.toLowerCase() === 'بدون پیام') {
          requestMessage = undefined;
        }
        
        // ارسال درخواست
        const targetUser = await storage.getUser(targetUserId);
        const result = await storage.sendFriendRequest(user.id, targetUserId, requestMessage);
        
        if (result) {
          // موفقیت آمیز بود
          const successEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ درخواست دوستی ارسال شد')
            .setDescription(`درخواست دوستی شما به **${targetUser?.username}** با موفقیت ارسال شد!`)
            .setThumbnail('https://img.icons8.com/fluency/48/checkmark.png')
            .addFields(
              { name: '⏳ وضعیت', value: 'منتظر پاسخ', inline: true },
              { name: '📩 پیام', value: requestMessage || 'بدون پیام', inline: true }
            );
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('friend_requests')
                .setLabel('📩 مشاهده درخواست‌ها')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🔙 بازگشت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          await interaction.followUp({
            embeds: [successEmbed],
            components: [row],
            ephemeral: true
          });
        } else {
          // خطا رخ داد
          const errorEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ خطا در ارسال درخواست')
            .setDescription('متأسفانه در ارسال درخواست دوستی خطایی رخ داد!')
            .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('add_friend')
                .setLabel('🔍 جستجوی مجدد')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🔙 بازگشت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          await interaction.followUp({
            embeds: [errorEmbed],
            components: [row],
            ephemeral: true
          });
        }
      } catch (error) {
        console.error("Error sending friend request:", error);
        await interaction.followUp({
          content: "❌ خطایی در ارسال درخواست دوستی رخ داد!",
          ephemeral: true
        });
      }
    });
    
    collector?.on('end', (collected) => {
      if (collected.size === 0) {
        // تایم‌اوت
        interaction.followUp({
          content: "⏱️ زمان ارسال پیام به پایان رسید! درخواست دوستی ارسال نشد.",
          ephemeral: true
        }).catch(() => {});
      }
    });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * قبول یا رد درخواست دوستی
 * @param interaction برهم‌کنش با کاربر
 * @param action عملیات (accept یا reject)
 */
export async function handleFriendRequest(interaction: MessageComponentInteraction, action: 'accept' | 'reject') {
  try {
    // دریافت شناسه درخواست
    const requestIdEmbed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle(action === 'accept' ? '✅ قبول درخواست دوستی' : '❌ رد درخواست دوستی')
      .setDescription('لطفاً شناسه درخواست را که در بخش درخواست‌ها نمایش داده شده است، وارد کنید.')
      .setFooter({ text: '⏱️ 60 ثانیه فرصت دارید.' });
    
    await interaction.update({
      embeds: [requestIdEmbed],
      components: []
    });
    
    // ایجاد فیلتر برای دریافت شناسه
    const filter = (m: any) => m.author.id === interaction.user.id;
    const collector = interaction.channel?.createMessageCollector({ filter, time: 60000, max: 1 });
    
    collector?.on('collect', async (message) => {
      try {
        // حذف پیام کاربر
        if (message.deletable) {
          await message.delete().catch(() => {});
        }
        
        const requestId = message.content.trim();
        
        // اجرای عملیات مورد نظر
        let result = false;
        if (action === 'accept') {
          result = await storage.acceptFriendRequest(requestId);
        } else {
          result = await storage.rejectFriendRequest(requestId);
        }
        
        if (result) {
          // موفقیت آمیز بود
          const successEmbed = new EmbedBuilder()
            .setColor(action === 'accept' ? '#2ECC71' : '#E74C3C')
            .setTitle(action === 'accept' ? '✅ درخواست دوستی قبول شد' : '❌ درخواست دوستی رد شد')
            .setDescription(`درخواست دوستی با موفقیت ${action === 'accept' ? 'قبول' : 'رد'} شد!`)
            .setThumbnail(action === 'accept' ? 'https://img.icons8.com/fluency/48/checkmark.png' : 'https://img.icons8.com/fluency/48/cancel.png');
          
          if (action === 'accept') {
            successEmbed.addFields({
              name: '🎉 تبریک', 
              value: 'شما یک دوست جدید اضافه کردید! می‌توانید از طریق لیست دوستان با او چت کنید.'
            });
          }
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(action === 'accept' ? 'friends_list' : 'friend_requests')
                .setLabel(action === 'accept' ? '👥 لیست دوستان' : '📩 درخواست‌های دیگر')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🔙 بازگشت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          await interaction.followUp({
            embeds: [successEmbed],
            components: [row],
            ephemeral: true
          });
        } else {
          // خطا رخ داد
          const errorEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ خطا')
            .setDescription(`متأسفانه در ${action === 'accept' ? 'قبول' : 'رد'} درخواست دوستی خطایی رخ داد!`)
            .addFields(
              { name: '💡 دلیل احتمالی', value: 'شناسه درخواست اشتباه یا نامعتبر است، یا درخواست قبلاً پاسخ داده شده است.' }
            )
            .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('friend_requests')
                .setLabel('📩 درخواست‌های دوستی')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🔙 بازگشت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          await interaction.followUp({
            embeds: [errorEmbed],
            components: [row],
            ephemeral: true
          });
        }
      } catch (error) {
        console.error(`Error ${action}ing friend request:`, error);
        await interaction.followUp({
          content: `❌ خطایی در ${action === 'accept' ? 'قبول' : 'رد'} درخواست دوستی رخ داد!`,
          ephemeral: true
        });
      }
    });
    
    collector?.on('end', (collected) => {
      if (collected.size === 0) {
        // تایم‌اوت
        interaction.followUp({
          content: "⏱️ زمان وارد کردن شناسه به پایان رسید!",
          ephemeral: true
        }).catch(() => {});
      }
    });
  } catch (error) {
    console.error(`Error in handleFriendRequest (${action}):`, error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * نمایش لیست کاربران مسدود شده
 * @param interaction برهم‌کنش با کاربر
 */
export async function blockedUsersList(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // دریافت لیست کاربران مسدود شده
    const blockedUsers = await storage.getBlockedUsers(user.id);
    
    if (!blockedUsers || blockedUsers.length === 0) {
      // اگر کاربر مسدودی وجود نداشت
      const noBlockedUsersEmbed = new EmbedBuilder()
        .setColor('#8A8A8A')
        .setTitle('🚫 کاربران مسدود شده')
        .setDescription('شما هیچ کاربری را مسدود نکرده‌اید!')
        .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('block_user')
            .setLabel('🚫 مسدود کردن کاربر')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({ embeds: [noBlockedUsersEmbed], components: [row] });
    }
    
    // ایجاد Embed برای لیست کاربران مسدود شده
    const blockedUsersEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 کاربران مسدود شده')
      .setDescription(`شما ${blockedUsers.length} کاربر را مسدود کرده‌اید.`)
      .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
    
    // افزودن فیلد برای هر کاربر مسدود شده
    for (const blockedUser of blockedUsers) {
      const blockedUserObj = await storage.getUserByDiscordId(blockedUser.userId);
      
      if (blockedUserObj) {
        blockedUsersEmbed.addFields({
          name: `🚫 ${blockedUserObj.username}`,
          value: `تاریخ مسدود شدن: ${formatDate(blockedUser.timestamp)}\n` +
                 `دلیل: ${blockedUser.reason || 'دلیلی ثبت نشده'}\n` +
                 `شناسه: \`${blockedUser.userId}\``,
          inline: false
        });
      }
    }
    
    // ساخت دکمه‌های عملیات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('block_user')
          .setLabel('🚫 مسدود کردن کاربر جدید')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('unblock_user')
          .setLabel('✅ رفع مسدودیت کاربر')
          .setStyle(ButtonStyle.Success)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [blockedUsersEmbed],
      components: [row1, row2]
    });
  } catch (error) {
    console.error("Error in blockedUsersList:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * مدیریت سیستم دوستان
 * @param interaction برهم‌کنش با کاربر
 */
export async function handleFriendsSystem(interaction: MessageComponentInteraction) {
  try {
    const customId = interaction.customId;
    
    switch (customId) {
      case 'friends_menu':
        await friendsMainMenu(interaction);
        break;
      
      case 'friends_list':
        await friendsList(interaction);
        break;
      
      case 'friend_requests':
        await friendRequests(interaction);
        break;
      
      case 'add_friend':
        await searchUserForFriendRequest(interaction);
        break;
      
      case 'blocked_users':
        await blockedUsersList(interaction);
        break;
      
      case 'anonymous_chat':
        // منوی چت ناشناس
        await anonymousChatMenu.AnonymousChatMenu.showMainMenu(interaction);
        break;
      
      case 'accept_friend_request':
        await handleFriendRequest(interaction, 'accept');
        break;
      
      case 'reject_friend_request':
        await handleFriendRequest(interaction, 'reject');
        break;
      
      default:
        // بررسی اینکه آیا دکمه برای ارسال درخواست دوستی است
        if (customId.startsWith('send_friend_request_')) {
          const targetUserId = parseInt(customId.split('_').pop() || '0');
          if (targetUserId > 0) {
            await sendFriendRequest(interaction, targetUserId);
          }
        } 
        // اگر دکمه برای انتخاب دوست از منوی کشویی است
        else if (customId === 'select_friend') {
          // پردازش انتخاب دوست (نمایش پروفایل یا چت)
          const selectedFriendId = interaction.values[0];
          await showFriendProfile(interaction, selectedFriendId);
        }
        // سایر موارد که در این فایل پشتیبانی نمی‌شوند
        else {
          await interaction.reply({
            content: "⚠️ عملیات نامعتبر یا پشتیبانی نشده!",
            ephemeral: true
          });
        }
        break;
    }
  } catch (error) {
    console.error("Error in handleFriendsSystem:", error);
    await interaction.reply({
      content: "❌ خطایی در سیستم دوستان رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * نمایش پروفایل دوست
 * @param interaction برهم‌کنش با کاربر
 * @param friendDiscordId شناسه دیسکورد دوست
 */
async function showFriendProfile(interaction: MessageComponentInteraction, friendDiscordId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    const friend = await storage.getUserByDiscordId(friendDiscordId);
    
    if (!user || !friend) {
      return await interaction.update({
        content: "❌ کاربر مورد نظر یافت نشد!",
        components: []
      });
    }
    
    // دریافت اطلاعات دوستی
    const userFriends = await storage.getFriends(user.id);
    const friendship = userFriends.find(f => f.friendId === friendDiscordId);
    
    if (!friendship) {
      return await interaction.update({
        content: "❌ این کاربر در لیست دوستان شما نیست!",
        components: []
      });
    }
    
    // ایجاد Embed برای پروفایل دوست
    const levelEmoji = getLevelEmoji(friendship.friendshipLevel);
    
    const profileEmbed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle(`👤 پروفایل ${friend.username}`)
      .setDescription(`اطلاعات دوستی شما با ${friend.username}`)
      .setThumbnail(interaction.client.user?.displayAvatarURL() || 'https://img.icons8.com/fluency/48/user.png')
      .addFields(
        { name: '🔄 سطح دوستی', value: `${levelEmoji} سطح ${friendship.friendshipLevel}`, inline: true },
        { name: '⭐ امتیاز دوستی', value: `${friendship.friendshipXP} XP`, inline: true },
        { name: '📅 تاریخ افزودن', value: formatDate(friendship.addedAt), inline: true },
        { name: '⏱️ آخرین تعامل', value: formatRelativeTime(friendship.lastInteraction), inline: true },
        { name: '❤️ وضعیت', value: friendship.favoriteStatus ? '⭐ دوست مورد علاقه' : 'معمولی', inline: true }
      )
      .setFooter({ text: 'با چت کردن و تعامل بیشتر، سطح دوستی خود را افزایش دهید!' });
    
    // ساخت دکمه‌های عملیات
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`start_private_chat_${friend.id}`)
          .setLabel('💬 چت خصوصی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`gift_to_friend_${friend.id}`)
          .setLabel('🎁 هدیه دادن')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`friendship_details_${friend.discordId}`)
          .setLabel('🌟 سطح دوستی')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`remove_friend_${friend.id}`)
          .setLabel('🗑️ حذف دوست')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('block_user')
          .setLabel('🚫 مسدود کردن')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('friends_list')
          .setLabel('🔙 بازگشت به لیست')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [profileEmbed],
      components: [row1, row2]
    });
  } catch (error) {
    console.error("Error in showFriendProfile:", error);
    await interaction.update({
      content: "❌ خطایی در نمایش پروفایل دوست رخ داد!",
      components: []
    });
  }
}