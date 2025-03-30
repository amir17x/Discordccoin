import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { storage } from '../../../storage';
import { formatNumber, formatDate, formatRelativeTime } from '../../utils/formatter';
import * as anonymousChatMenu from '../anonymousChatMenu/anonymousChatMenu';
import { friendshipLevelMenu, handleFriendshipLevelInteraction } from './friendshipLevelMenu';
import { giftToFriendMenu, handleGiftMenuInteraction } from './giftMenu';
import { interestsAndSuggestionsMenu, handleInterestsMenuInteraction } from './friendInterestsMenu';
import { showFriendRequestForm, processFriendRequestForm } from './friendRequestForm';

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
    
    // شمارش دوستان و درخواست‌های دوستی
    const friends = await storage.getFriends(user.id);
    const friendRequests = await storage.getFriendRequests(user.id);
    const pendingRequests = friendRequests.filter(req => req.toUserId === user.discordId && req.status === 'pending');
    
    // ایجاد Embed اصلی با استایل جذاب‌تر
    const embed = new EmbedBuilder()
      .setColor('#7661EE') // رنگ بنفش جذاب
      .setTitle('✨ سیستم دوستی و چت Ccoin ✨')
      .setDescription(`🎭 **${interaction.user.username}** عزیز، به دنیای ارتباطات Ccoin خوش آمدید!\n\n🌈 در این بخش می‌توانید:\n💫 دوستان خود را مدیریت کنید\n💌 با آن‌ها ارتباط برقرار کنید\n🎲 یا به صورت ناشناس با دیگر کاربران گفتگو کنید`)
      .setThumbnail(interaction.user.displayAvatarURL() || interaction.client.user?.displayAvatarURL())
      .addFields(
        { name: `👥 دوستان (${friends?.length || 0})`, value: '🤝 ارتباط با دوستان فعلی', inline: true },
        { name: `📩 درخواست‌ها (${pendingRequests.length})`, value: '📝 مدیریت درخواست‌های دوستی', inline: true },
        { name: '💬 چت ناشناس', value: '👁️‍🗨️ گفتگوی مخفیانه با کاربران', inline: true }
      )
      .setFooter({ text: '💖 از طریق سیستم دوستی، می‌توانید هدایا و امتیازات ویژه دریافت کنید!' });
    
    // ایجاد دکمه‌های منو با طراحی جذاب‌تر و چینش بر اساس اولویت و اهمیت
    // ردیف اول: دکمه‌های اصلی و پر استفاده
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friends_list')
          .setLabel(`👥 لیست دوستان (${friends?.length || 0})`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('friend_request_form')
          .setLabel('✉️ ارسال درخواست دوستی')
          .setStyle(ButtonStyle.Success)
      );
      
    // ردیف دوم: درخواست‌ها و چت ناشناس
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friend_requests')
          .setLabel(`📨 درخواست‌های دریافتی ${pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}`)
          .setStyle(pendingRequests.length > 0 ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('anonymous_chat')
          .setLabel('🎭 چت ناشناس')
          .setStyle(ButtonStyle.Secondary)
      );
      
    // ردیف سوم: ویژگی‌های تکمیلی و بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('blocked_users')
          .setLabel('🚫 کاربران مسدود شده')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('friendship_levels')
          .setLabel('🏆 راهنمای سطوح دوستی')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🏠 بازگشت به منوی اصلی')
          .setStyle(ButtonStyle.Secondary)
      );
      
    // ارسال پاسخ با بررسی وضعیت interaction
    try {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
      } else if (interaction.replied) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
      }
    } catch (responseError) {
      console.error("Error responding in friendsMainMenu:", responseError);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: "📱 سیستم دوستی با موفقیت بارگذاری شد. لطفاً از منوی زیر استفاده کنید.", 
          embeds: [embed], 
          components: [row1, row2, row3], 
          ephemeral: true 
        });
      }
    }
  } catch (error) {
    console.error("Error in friendsMainMenu:", error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.", 
          ephemeral: true 
        });
      } else {
        await interaction.followUp({ 
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.", 
          ephemeral: true 
        });
      }
    } catch (finalError) {
      console.error("Fatal error in friendsMainMenu:", finalError);
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
      // اگر دوستی وجود نداشت - طراحی جذاب‌تر
      const noFriendsEmbed = new EmbedBuilder()
        .setColor('#9C7BFF') // بنفش روشن
        .setTitle('🌟 دوستان شما')
        .setDescription('✨ هنوز هیچ دوستی اضافه نکرده‌اید! ✨')
        .setThumbnail('https://img.icons8.com/color/96/group-task.png')
        .addFields(
          { 
            name: '💡 پیشنهادات ویژه', 
            value: '👋 برای افزودن دوست جدید، از یکی از روش‌های زیر استفاده کنید:\n\n' +
                  '🔍 **جستجوی کاربران**: با استفاده از دکمه "افزودن دوست جدید" دوستان را پیدا کنید\n' +
                  '🎭 **چت ناشناس**: با کاربران جدید آشنا شوید و آنها را به دوستان اضافه کنید\n' +
                  '🎮 **بازی‌های گروهی**: در بازی‌های مشارکتی شرکت کنید و با بازیکنان دیگر دوست شوید'
          },
          {
            name: '✨ مزایای داشتن دوست',
            value: '🎁 امکان ارسال هدیه روزانه\n💰 تخفیف در برخی معاملات\n🤝 امکان تبادل آیتم‌ها\n🏆 امتیازات ویژه برای دوستی‌های سطح بالا'
          }
        );
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_friend')
            .setLabel('✨ افزودن دوست جدید')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('anonymous_chat')
            .setLabel('🎭 یافتن دوست در چت ناشناس')
            .setStyle(ButtonStyle.Primary)
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('friendship_levels')
            .setLabel('🏆 راهنمای سطوح دوستی')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی اصلی')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({ embeds: [noFriendsEmbed], components: [row1, row2] });
    }
    
    // ایجاد Embed برای لیست دوستان با طراحی جذاب‌تر
    const friendsEmbed = new EmbedBuilder()
      .setColor('#7661EE') // استفاده از همان رنگ منوی اصلی برای یکپارچگی
      .setTitle('👥 دوستان شما')
      .setDescription(`🌈 شما ${friends.length} دوست دارید! می‌توانید با آنها در ارتباط باشید، هدیه بفرستید و از مزایای ویژه لذت ببرید.`)
      .setThumbnail('https://img.icons8.com/color/96/group-task.png')
      .addFields(
        { 
          name: '💎 مزایای دوستی', 
          value: '• 🎁 ارسال هدیه روزانه\n• 💌 چت خصوصی\n• 🤝 فعالیت‌های مشترک\n• 🏆 ارتقای سطح دوستی', 
          inline: true 
        },
        { 
          name: '🔝 سطوح دوستی', 
          value: '• ⚪ **سطح 1**: آشنایی\n• 🔵 **سطح 2**: دوستی\n• 🔷 **سطح 3**: صمیمیت\n• 💎 **سطح 4**: حرفه‌ای\n• 🌟 **سطح 5**: استاد دوستی', 
          inline: true 
        }
      );
    
    // افزودن فیلد برای هر دوست (حداکثر 8 دوست) با طراحی فانتزی‌تر
    const maxDisplayed = Math.min(friends.length, 8);
    
    let friendsList = '';
    
    for (let i = 0; i < maxDisplayed; i++) {
      const friend = friends[i];
      const friendUser = await storage.getUserByDiscordId(friend.friendId);
      
      if (friendUser) {
        const level = friend.friendshipLevel;
        const levelEmoji = getLevelEmoji(level);
        const levelName = getFriendshipLevelName(level);
        
        friendsList += `${levelEmoji} **${friendUser.username}** • ${levelName}\n`;
        friendsList += `┗━ 📅 آخرین تعامل: ${formatRelativeTime(friend.lastInteraction)}\n\n`;
      }
    }
    
    // اگر تعداد دوستان بیشتر از 8 نفر بود
    if (friends.length > 8) {
      friendsList += `🔍 و ${friends.length - 8} دوست دیگر...`;
    }
    
    friendsEmbed.addFields({ name: '✨ لیست دوستان شما', value: friendsList || 'در حال بارگذاری...', inline: false });
    
    // ساخت منوی کشویی برای انتخاب دوست با ظاهر بهتر
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_friend')
      .setPlaceholder('🤝 یک دوست را برای مشاهده جزئیات انتخاب کنید...')
      .setMinValues(1)
      .setMaxValues(1);
    
    // افزودن گزینه‌ها به منوی کشویی با توضیحات بیشتر
    for (const friend of friends) {
      const friendUser = await storage.getUserByDiscordId(friend.friendId);
      if (friendUser) {
        const level = friend.friendshipLevel;
        const levelName = getFriendshipLevelName(level);
        
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(friendUser.username)
            .setDescription(`${levelName} | سطح دوستی: ${level}`)
            .setValue(friend.friendId)
            .setEmoji(getLevelEmoji(level))
        );
      }
    }
    
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
    
    // دکمه‌های عملیات جذاب‌تر
    const buttonRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('sort_friends_by_level')
          .setLabel('🔝 مرتب‌سازی بر اساس سطح')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('sort_friends_by_activity')
          .setLabel('⏱️ مرتب‌سازی بر اساس فعالیت')
          .setStyle(ButtonStyle.Secondary)
      );
      
    const buttonRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('add_friend')
          .setLabel('✨ افزودن دوست جدید')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('friendship_levels')
          .setLabel('🏆 راهنمای سطوح')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ با بررسی وضعیت interaction
    try {
      await interaction.update({
        embeds: [friendsEmbed],
        components: [selectRow, buttonRow1, buttonRow2]
      });
    } catch (error) {
      console.error("Error updating friends list:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی در نمایش لیست دوستان رخ داد!",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی در نمایش لیست دوستان رخ داد!",
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error("Error in friendsList:", error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    } catch (finalError) {
      console.error("Fatal error in friendsList:", finalError);
    }
  }
}

/**
 * دریافت نام سطح دوستی
 * @param level سطح دوستی
 * @returns نام مناسب برای سطح دوستی
 */
function getFriendshipLevelName(level: number): string {
  switch (level) {
    case 5: return 'استاد دوستی';
    case 4: return 'دوست حرفه‌ای';
    case 3: return 'دوست صمیمی';
    case 2: return 'دوست معمولی';
    case 1:
    default: return 'آشنا';
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
      // اگر درخواستی وجود نداشت - طراحی جذاب‌تر
      const noRequestsEmbed = new EmbedBuilder()
        .setColor('#9C7BFF') // بنفش روشن
        .setTitle('✉️ درخواست‌های دوستی')
        .setDescription('🌟 در حال حاضر درخواست دوستی فعالی ندارید! 🌟')
        .setThumbnail('https://img.icons8.com/color/96/group-task.png')
        .addFields(
          { 
            name: '💌 چرا دوستان بیشتری اضافه نمی‌کنید؟', 
            value: '👋 با دوستان بیشتر، تجربه شما در Ccoin متفاوت خواهد بود!\n' +
                  '🎁 هدایای روزانه بیشتری دریافت کنید\n' +
                  '🤝 در فعالیت‌های گروهی شرکت کنید\n' +
                  '💬 چت خصوصی داشته باشید\n' +
                  '🏆 امتیازات و جوایز ویژه کسب کنید'
          }
        );
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_friend')
            .setLabel('✨ ارسال درخواست دوستی جدید')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('anonymous_chat')
            .setLabel('🎭 یافتن دوست در چت ناشناس')
            .setStyle(ButtonStyle.Primary)
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      return await interaction.update({ embeds: [noRequestsEmbed], components: [row1, row2] });
    }
    
    // ایجاد Embed برای درخواست‌ها با طراحی جذاب‌تر
    const requestsEmbed = new EmbedBuilder()
      .setColor('#7661EE') // رنگ بنفش هماهنگ با سایر منوها
      .setTitle('💌 درخواست‌های دوستی')
      .setDescription('مدیریت درخواست‌های دوستی دریافتی و ارسالی')
      .setThumbnail('https://img.icons8.com/color/96/add-user-male.png');
    
    // بخش درخواست‌های دریافتی با طراحی بهتر
    if (incomingRequests.length > 0) {
      let incomingDescription = '';
      
      for (const request of incomingRequests) {
        const fromUser = await storage.getUserByDiscordId(request.fromUserId);
        if (fromUser) {
          incomingDescription += `👤 **${fromUser.username}**\n`;
          incomingDescription += `⏱️ زمان: ${formatRelativeTime(request.timestamp)}\n`;
          if (request.message) {
            incomingDescription += `💬 پیام: ${request.message}\n`;
          }
          incomingDescription += `🪪 شناسه: \`${request.fromUserId}_${request.toUserId}\`\n`;
          incomingDescription += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
        }
      }
      
      requestsEmbed.addFields({
        name: `📥 درخواست‌های دریافتی (${incomingRequests.length})`,
        value: incomingDescription || '---',
        inline: false
      });
    }
    
    // بخش درخواست‌های ارسالی با طراحی بهتر
    if (outgoingRequests.length > 0) {
      let outgoingDescription = '';
      
      for (const request of outgoingRequests) {
        const toUser = await storage.getUserByDiscordId(request.toUserId);
        if (toUser) {
          outgoingDescription += `👤 **${toUser.username}**\n`;
          outgoingDescription += `⏱️ زمان: ${formatRelativeTime(request.timestamp)}\n`;
          if (request.message) {
            outgoingDescription += `💬 پیام: ${request.message}\n`;
          }
          outgoingDescription += `🪪 شناسه: \`${request.fromUserId}_${request.toUserId}\`\n`;
          outgoingDescription += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
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
        name: '🔔 راهنمای پاسخ به درخواست‌ها',
        value: 'برای قبول یا رد درخواست، از دکمه‌های زیر استفاده کنید و شناسه درخواست را وارد کنید.\n' +
               '✨ با قبول درخواست دوستی، هر دو طرف هدیه‌ای ویژه دریافت می‌کنند!',
        inline: false
      });
      
      // دکمه‌های عملیات با طراحی بهتر
      const rowAction = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('accept_all_requests')
            .setLabel('✅ قبول همه درخواست‌ها')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('accept_friend_request')
            .setLabel('🤝 قبول درخواست')
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
            .setLabel('✨ ارسال درخواست جدید')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // ارسال پاسخ با بررسی وضعیت interaction
      try {
        await interaction.update({
          embeds: [requestsEmbed],
          components: [rowAction, rowNav]
        });
      } catch (error) {
        console.error("Error updating friend requests:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ خطایی در نمایش درخواست‌های دوستی رخ داد!",
            ephemeral: true
          });
        } else {
          await interaction.followUp({
            content: "❌ خطایی در نمایش درخواست‌های دوستی رخ داد!",
            ephemeral: true
          });
        }
      }
    } else {
      // فقط درخواست‌های ارسالی دارد - طراحی بهتر
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('cancel_friend_request')
            .setLabel('🚫 لغو درخواست')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('add_friend')
            .setLabel('✨ ارسال درخواست جدید')
            .setStyle(ButtonStyle.Primary)
        );
        
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('anonymous_chat')
            .setLabel('🎭 چت ناشناس')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // ارسال پاسخ با بررسی وضعیت interaction
      try {
        await interaction.update({
          embeds: [requestsEmbed],
          components: [row1, row2]
        });
      } catch (error) {
        console.error("Error updating friend requests:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ خطایی در نمایش درخواست‌های دوستی رخ داد!",
            ephemeral: true
          });
        } else {
          await interaction.followUp({
            content: "❌ خطایی در نمایش درخواست‌های دوستی رخ داد!",
            ephemeral: true
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in friendRequests:", error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    } catch (finalError) {
      console.error("Fatal error in friendRequests:", finalError);
    }
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
    // ابتدا وضعیت interaction را بررسی می‌کنیم
    let responseMethod: 'reply' | 'editReply' | 'followUp' = 'reply';
    
    if (interaction.deferred) {
      responseMethod = 'editReply';
    } else if (interaction.replied) {
      responseMethod = 'followUp';
    } else {
      try {
        await interaction.deferUpdate();
        responseMethod = 'editReply';
      } catch (deferError) {
        console.error("Error deferring update in searchUserForFriendRequest:", deferError);
        responseMethod = 'reply';
      }
    }

    // ایجاد Embed برای فرم جستجو
    const searchEmbed = new EmbedBuilder()
      .setColor('#4E5D94')
      .setTitle('🔍 جستجوی کاربر')
      .setDescription('لطفاً نام کاربری یا شناسه دیسکورد شخص مورد نظر را وارد کنید.')
      .addFields(
        { name: '⚠️ راهنما', value: 'برای ارسال درخواست دوستی، باید نام کاربری دقیق یا شناسه دیسکورد فرد را وارد کنید.' },
        { name: '✏️ دستورالعمل', value: 'پیام خود را در چت اصلی وارد کنید، نه به صورت پاسخ به این پیام.' }
      );
    
    // دکمه بازگشت
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ با توجه به وضعیت interaction
    try {
      let sentMessage: Message | InteractionResponse;
      
      switch (responseMethod) {
        case 'editReply':
          await interaction.editReply({
            embeds: [searchEmbed],
            components: [row]
          });
          sentMessage = await interaction.fetchReply();
          break;
        
        case 'followUp':
          sentMessage = await interaction.followUp({
            embeds: [searchEmbed],
            components: [row],
            ephemeral: true
          });
          break;
        
        case 'reply':
        default:
          sentMessage = await interaction.reply({
            embeds: [searchEmbed],
            components: [row],
            ephemeral: true,
            fetchReply: true
          });
          break;
      }
    } catch (responseError) {
      console.error("Error responding in searchUserForFriendRequest:", responseError);
      try {
        if (!interaction.replied) {
          await interaction.reply({
            embeds: [searchEmbed],
            components: [row],
            ephemeral: true
          });
        } else {
          await interaction.followUp({
            embeds: [searchEmbed],
            components: [row],
            ephemeral: true
          });
        }
      } catch (finalError) {
        console.error("Final error responding in searchUserForFriendRequest:", finalError);
        return; // خروج از تابع در صورت بروز خطای نهایی
      }
    }
    
    // ایجاد فیلتر برای دریافت پاسخ کاربر
    const filter = (m: any) => m.author.id === interaction.user.id;
    
    try {
      // استفاده از awaitMessages به جای collector برای کاهش خطا
      const collected = await interaction.channel?.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ['time']
      });
      
      if (!collected || collected.size === 0) {
        await interaction.followUp({
          content: "⏱️ زمان جستجو به پایان رسید!",
          ephemeral: true
        }).catch(() => {});
        return;
      }
      
      const message = collected.first();
      if (!message) {
        await interaction.followUp({
          content: "❌ خطایی در دریافت پاسخ شما رخ داد!",
          ephemeral: true
        });
        return;
      }
      
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
      if (!currentUser) {
        await interaction.followUp({
          content: "❌ خطایی در بارگذاری اطلاعات کاربری شما رخ داد!",
          ephemeral: true
        });
        return;
      }
      
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
      const pendingRequest = requests.find(r => 
        (r.fromUserId === currentUser.discordId && r.toUserId === targetUser.discordId) || 
        (r.fromUserId === targetUser.discordId && r.toUserId === currentUser.discordId)
      );
      
      if (pendingRequest) {
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
      
    } catch (awaitError) {
      if (awaitError instanceof Error && awaitError.message === 'time') {
        // تایم‌اوت جستجو
        interaction.followUp({
          content: "⏱️ زمان جستجو به پایان رسید!",
          ephemeral: true
        }).catch(() => {});
      } else {
        console.error("Error awaiting message in searchUserForFriendRequest:", awaitError);
        await interaction.followUp({
          content: "❌ خطایی در جستجوی کاربر رخ داد!",
          ephemeral: true
        }).catch(() => {});
      }
    }
    
  } catch (error) {
    console.error("Error in searchUserForFriendRequest:", error);
    try {
      // بررسی اینکه آیا قبلاً پاسخی داده شده است
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    } catch (finalError) {
      console.error("Fatal error in searchUserForFriendRequest:", finalError);
    }
  }
}

/**
 * ارسال درخواست دوستی
 * @param interaction برهم‌کنش با کاربر
 * @param targetUserId شناسه کاربر مقصد
 */
/**
 * این تابع به friendRequestForm.ts منتقل شده است
 * به عنوان بخشی از بهبود سیستم ارسال درخواست‌های دوستی
 * و استفاده از فرم‌های مودال به جای جمع‌آوری پیام‌ها
 *
 * @deprecated - Use friendRequestForm.ts version instead
 */

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
    try {
      // بررسی اینکه آیا قبلاً پاسخی داده شده است
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    } catch (finalError) {
      console.error(`Fatal error in handleFriendRequest (${action}):`, finalError);
    }
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
      // اگر کاربر مسدودی وجود نداشت - طراحی جذاب‌تر
      const noBlockedUsersEmbed = new EmbedBuilder()
        .setColor('#7661EE') // رنگ بنفش هماهنگ با سایر منوها
        .setTitle('🛡️ مدیریت کاربران مسدود شده')
        .setDescription('✨ شما هیچ کاربری را مسدود نکرده‌اید! ✨')
        .setThumbnail('https://img.icons8.com/color/96/security-shield-green.png')
        .addFields(
          { 
            name: '💡 درباره سیستم مسدودسازی', 
            value: '🚫 **مسدود کردن کاربران** به شما امکان می‌دهد:\n' +
                  '• از دریافت پیام و درخواست دوستی جلوگیری کنید\n' +
                  '• تعاملات ناخواسته را محدود کنید\n' +
                  '• حریم خصوصی خود را حفظ کنید\n\n' +
                  '✅ می‌توانید در هر زمان کاربران را از لیست مسدودی خارج کنید.'
          }
        );
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('block_user')
            .setLabel('🛑 مسدود کردن کاربر')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // ارسال پاسخ با بررسی وضعیت interaction
      try {
        await interaction.update({ embeds: [noBlockedUsersEmbed], components: [row] });
      } catch (error) {
        console.error("Error updating blocked users list:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            embeds: [noBlockedUsersEmbed], 
            components: [row],
            ephemeral: true
          });
        } else {
          await interaction.followUp({
            embeds: [noBlockedUsersEmbed], 
            components: [row],
            ephemeral: true
          });
        }
      }
      return;
    }
    
    // ایجاد Embed برای لیست کاربران مسدود شده - طراحی جذاب‌تر
    const blockedUsersEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🛡️ کاربران مسدود شده')
      .setDescription(`شما **${blockedUsers.length}** کاربر را مسدود کرده‌اید. این کاربران نمی‌توانند به شما پیام بفرستند یا درخواست دوستی ارسال کنند.`)
      .setThumbnail('https://img.icons8.com/color/96/shield.png');
    
    // معرفی کوتاه در ابتدا
    blockedUsersEmbed.addFields({
      name: '🔄 مدیریت لیست مسدود شده‌ها',
      value: 'برای رفع مسدودیت، ابتدا روی دکمه «رفع مسدودیت» کلیک کنید و سپس شناسه کاربر را وارد کنید.',
      inline: false
    });
    
    // ایجاد یک رشته برای نمایش کاربران مسدود شده
    let blockedUsersList = '';
    
    // افزودن هر کاربر مسدود شده با فرمت جذاب‌تر
    for (const blockedUser of blockedUsers) {
      const blockedUserObj = await storage.getUserByDiscordId(blockedUser.userId);
      
      if (blockedUserObj) {
        blockedUsersList += `🚫 **${blockedUserObj.username}**\n`;
        blockedUsersList += `⏱️ از تاریخ: ${formatRelativeTime(blockedUser.timestamp)}\n`;
        if (blockedUser.reason) {
          blockedUsersList += `📝 دلیل: ${blockedUser.reason}\n`;
        }
        blockedUsersList += `🪪 شناسه: \`${blockedUser.userId}\`\n`;
        blockedUsersList += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
      }
    }
    
    // افزودن لیست کاربران به Embed
    blockedUsersEmbed.addFields({
      name: '📋 لیست کاربران مسدود شده',
      value: blockedUsersList || 'اطلاعات در حال بارگذاری...',
      inline: false
    });
    
    // ساخت دکمه‌های عملیات با طراحی بهتر
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
          .setCustomId('unblock_all')
          .setLabel('🔓 رفع مسدودیت همه')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ با بررسی وضعیت interaction
    try {
      await interaction.update({
        embeds: [blockedUsersEmbed],
        components: [row1, row2]
      });
    } catch (error) {
      console.error("Error updating blocked users list:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [blockedUsersEmbed],
          components: [row1, row2],
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          embeds: [blockedUsersEmbed],
          components: [row1, row2],
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error("Error in blockedUsersList:", error);
    try {
      // بررسی وضعیت interaction و ارسال پاسخ مناسب
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی در بارگذاری لیست کاربران مسدود شده رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی در بارگذاری لیست کاربران مسدود شده رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    } catch (finalError) {
      console.error("Fatal error in blockedUsersList:", finalError);
    }
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
      
      case 'unblock_user':
        await handleUnblockUser(interaction);
        break;
        
      case 'unblock_all':
        await handleUnblockAllUsers(interaction);
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
          const targetUserId = customId.split('_').pop() || '0';
          if (targetUserId) {
            // استفاده از تابع sendFriendRequest از فایل friendRequestForm.ts
            await showFriendRequestForm(interaction);
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
    try {
      // بررسی اینکه آیا قبلاً پاسخی داده شده است
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی در سیستم دوستان رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی در سیستم دوستان رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    } catch (finalError) {
      console.error("Fatal error in handleFriendsSystem:", finalError);
    }
  }
}

/**
 * نمایش پروفایل دوست
 * @param interaction برهم‌کنش با کاربر
 * @param friendDiscordId شناسه دیسکورد دوست
 */
/**
 * پردازش درخواست رفع مسدودیت کاربر
 * @param interaction برهم‌کنش با کاربر
 */
async function handleUnblockUser(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // ارسال پرامپت برای دریافت شناسه کاربر مورد نظر
    const promptEmbed = new EmbedBuilder()
      .setColor('#7661EE')
      .setTitle('✅ رفع مسدودیت کاربر')
      .setDescription('لطفاً شناسه کاربری که می‌خواهید رفع مسدودیت کنید را وارد کنید.')
      .setThumbnail('https://img.icons8.com/color/96/unlock.png')
      .addFields({
        name: '🔍 راهنما',
        value: '• شناسه کاربر را از لیست کاربران مسدود شده کپی کنید\n' +
              '• شناسه را در چت وارد کنید\n' +
              '• برای لغو عملیات، عبارت "cancel" را تایپ کنید'
      });
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('blocked_users')
          .setLabel('🔙 بازگشت به لیست مسدود شده‌ها')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پیام و انتظار برای پاسخ کاربر
    await interaction.update({
      embeds: [promptEmbed],
      components: [row]
    });
    
    // ایجاد کالکتور برای دریافت پیام کاربر
    const filter = (m: Message) => m.author.id === interaction.user.id;
    const channel = interaction.channel as TextChannel;
    
    const collector = channel.createMessageCollector({ filter, time: 60000, max: 1 });
    
    collector.on('collect', async (message) => {
      try {
        // حذف پیام کاربر برای تمیز نگه داشتن چت
        try {
          await message.delete();
        } catch (deleteError) {
          console.error("Could not delete user message:", deleteError);
        }
        
        const targetUserId = message.content.trim();
        
        // بررسی درخواست لغو
        if (targetUserId.toLowerCase() === 'cancel') {
          return await interaction.followUp({
            content: "🛑 عملیات رفع مسدودیت لغو شد.",
            ephemeral: true
          });
        }
        
        // بررسی اعتبار شناسه
        if (!targetUserId) {
          return await interaction.followUp({
            content: "❌ شناسه وارد شده نامعتبر است!",
            ephemeral: true
          });
        }
        
        // رفع مسدودیت کاربر
        const unblockResult = await storage.unblockUser(user.id, targetUserId);
        
        if (unblockResult) {
          // موفقیت آمیز بود
          const successEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ رفع مسدودیت با موفقیت انجام شد')
            .setDescription(`کاربر با موفقیت از لیست مسدود شده‌های شما حذف شد.`)
            .setThumbnail('https://img.icons8.com/color/96/unlock.png');
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('blocked_users')
                .setLabel('🔙 بازگشت به لیست مسدود شده‌ها')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('🏠 بازگشت به منوی دوستان')
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
            .setTitle('❌ خطا در رفع مسدودیت')
            .setDescription(`رفع مسدودیت کاربر با خطا مواجه شد!`)
            .addFields(
              { name: '💡 دلیل احتمالی', value: 'شناسه کاربر اشتباه است یا کاربر در لیست مسدود شده‌های شما نیست.' }
            )
            .setThumbnail('https://img.icons8.com/color/96/cancel.png');
          
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('blocked_users')
                .setLabel('🔙 بازگشت به لیست مسدود شده‌ها')
                .setStyle(ButtonStyle.Primary)
            );
          
          await interaction.followUp({
            embeds: [errorEmbed],
            components: [row],
            ephemeral: true
          });
        }
      } catch (error) {
        console.error("Error in unblock user collector:", error);
        await interaction.followUp({
          content: "❌ خطایی در رفع مسدودیت کاربر رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    });
    
    collector.on('end', (collected) => {
      if (collected.size === 0) {
        // تایم‌اوت
        interaction.followUp({
          content: "⏱️ زمان وارد کردن شناسه کاربر به پایان رسید!",
          ephemeral: true
        }).catch(() => {});
      }
    });
  } catch (error) {
    console.error("Error in handleUnblockUser:", error);
    try {
      // بررسی اینکه آیا قبلاً پاسخی داده شده است
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی در پردازش درخواست رفع مسدودیت رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی در پردازش درخواست رفع مسدودیت رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    } catch (finalError) {
      console.error("Fatal error in handleUnblockUser:", finalError);
    }
  }
}

/**
 * پردازش درخواست رفع مسدودیت همه کاربران
 * @param interaction برهم‌کنش با کاربر
 */
async function handleUnblockAllUsers(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // ارسال پرامپت تأیید برای رفع مسدودیت همه کاربران
    const confirmEmbed = new EmbedBuilder()
      .setColor('#F1C40F') // زرد هشدار
      .setTitle('⚠️ تأیید رفع مسدودیت همه کاربران')
      .setDescription('آیا مطمئن هستید که می‌خواهید مسدودیت تمام کاربران را بردارید؟')
      .setThumbnail('https://img.icons8.com/color/96/question-mark.png')
      .addFields({
        name: '🔍 راهنما',
        value: 'با انتخاب گزینه «تایید» مسدودیت تمام کاربران برداشته می‌شود و دیگر قابل بازگشت نیست!'
      });
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_unblock_all')
          .setLabel('✅ تایید رفع مسدودیت همه')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('blocked_users')
          .setLabel('🔙 انصراف')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ذخیره message برای حذف در مراحل بعدی
    const reply = await interaction.update({
      embeds: [confirmEmbed],
      components: [row]
    });
    
    // ایجاد کالکتور برای دریافت کلیک کاربر
    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id && i.customId === 'confirm_unblock_all';
    const collector = (interaction.channel as TextChannel).createMessageComponentCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', async (i) => {
      try {
        // رفع مسدودیت همه کاربران
        const unblockResult = await storage.unblockAllUsers(user.id);
        
        // نمایش نتیجه به کاربر
        const resultEmbed = new EmbedBuilder()
          .setColor('#2ECC71')
          .setTitle('✅ رفع مسدودیت همه کاربران')
          .setDescription(`مسدودیت تمام کاربران با موفقیت برداشته شد.`)
          .setThumbnail('https://img.icons8.com/color/96/ok.png')
          .addFields({
            name: '🔄 وضعیت', 
            value: unblockResult ? `✅ عملیات با موفقیت انجام شد.` : `⚠️ هیچ کاربر مسدود شده‌ای یافت نشد.`
          });
        
        const resultRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('friends_menu')
              .setLabel('🏠 بازگشت به منوی دوستان')
              .setStyle(ButtonStyle.Primary)
          );
        
        await i.update({
          embeds: [resultEmbed],
          components: [resultRow]
        });
      } catch (error) {
        console.error("Error in unblock all confirmation:", error);
        await i.update({
          content: "❌ خطایی در رفع مسدودیت همه کاربران رخ داد! لطفاً دوباره تلاش کنید.",
          embeds: [],
          components: []
        });
      }
    });
    
    collector.on('end', (collected) => {
      if (collected.size === 0) {
        // تایم‌اوت یا انصراف
        interaction.editReply({
          content: "⌛ عملیات رفع مسدودیت همه کاربران لغو شد.",
          embeds: [],
          components: []
        }).catch(() => {});
        
        // بازگشت به لیست کاربران مسدود شده بعد از مدت کوتاهی
        setTimeout(() => {
          blockedUsersList(interaction).catch(console.error);
        }, 2000);
      }
    });
  } catch (error) {
    console.error("Error in handleUnblockAllUsers:", error);
    try {
      // بررسی اینکه آیا قبلاً پاسخی داده شده است
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی در پردازش درخواست رفع مسدودیت همه کاربران رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: "❌ خطایی در پردازش درخواست رفع مسدودیت همه کاربران رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
      }
    } catch (finalError) {
      console.error("Fatal error in handleUnblockAllUsers:", finalError);
    }
  }
}

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