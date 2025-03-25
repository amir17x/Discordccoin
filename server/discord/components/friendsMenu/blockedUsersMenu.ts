import { ButtonInteraction, MessageComponentInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { storage } from '../../../storage';
import { formatRelativeTime } from '../../utils/formatter';
import { friendsMainMenu } from './friendsMainMenu';

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
            .setCustomId('search_to_block')
            .setLabel('🔍 جستجوی کاربر برای مسدود کردن')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({
        embeds: [noBlockedUsersEmbed], 
        components: [row]
      });
      return;
    }
    
    // ایجاد Embed برای نمایش کاربران مسدود شده
    const blockedUsersEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 کاربران مسدود شده')
      .setDescription(`در حال حاضر شما ${blockedUsers.length} کاربر را مسدود کرده‌اید.`)
      .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
    
    // افزودن کاربران مسدود شده به Embed
    for (const blocked of blockedUsers.slice(0, 10)) {
      const blockedUser = await storage.getUserByDiscordId(blocked.userId);
      
      if (blockedUser) {
        blockedUsersEmbed.addFields({
          name: `👤 ${blockedUser.username}`,
          value: `📅 زمان مسدود شدن: ${formatRelativeTime(blocked.timestamp)}\n${blocked.reason ? `💬 دلیل: ${blocked.reason}` : ''}`,
          inline: false
        });
      }
    }
    
    // اگر تعداد کاربران مسدود شده بیشتر از 10 نفر بود
    if (blockedUsers.length > 10) {
      blockedUsersEmbed.addFields({
        name: '🔍 موارد بیشتر',
        value: `و ${blockedUsers.length - 10} کاربر دیگر...`,
        inline: false
      });
    }
    
    // ساخت منوی کشویی برای انتخاب کاربر برای رفع مسدودیت
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_blocked_user')
      .setPlaceholder('کاربری را برای رفع مسدودیت انتخاب کنید...')
      .setMinValues(1)
      .setMaxValues(1);
    
    // افزودن گزینه‌ها به منوی کشویی
    for (const blocked of blockedUsers) {
      const blockedUser = await storage.getUserByDiscordId(blocked.userId);
      if (blockedUser) {
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(blockedUser.username)
            .setDescription(`${blocked.reason ? `دلیل: ${blocked.reason}` : 'بدون دلیل'}`)
            .setValue(blocked.userId)
            .setEmoji('🚫')
        );
      }
    }
    
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
    
    // دکمه‌های عملیات
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('search_to_block')
          .setLabel('🔍 مسدود کردن کاربر جدید')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.update({
      embeds: [blockedUsersEmbed],
      components: [selectRow, buttonRow]
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
 * جستجوی کاربر برای مسدود کردن - نسخه جدید تعاملی با حفظ حریم خصوصی
 * @param interaction برهم‌کنش با کاربر
 */
export async function searchUserToBlock(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // ابتدا به کاربر اطلاع می‌دهیم که یک پیام خصوصی دریافت خواهد کرد
    await interaction.reply({
      content: "🔒 برای حفظ حریم خصوصی، فرآیند بلاک کردن در پیام خصوصی انجام می‌شود. لطفاً پیام خصوصی خود را چک کنید.",
      ephemeral: true
    });
    
    // دریافت لیست دوستان برای نمایش به کاربر
    const friends = await storage.getFriends(user.id);
    
    if (!friends || friends.length === 0) {
      // اگر کاربر دوستی ندارد
      const noFriendsEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('🚫 بلاک کردن کاربر')
        .setDescription('شما هیچ دوستی ندارید که بتوانید بلاک کنید!\n\nبرای بلاک کردن سایر کاربران، می‌توانید از دکمه زیر جستجو کنید.')
        .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
        
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('block_by_search')
            .setLabel('🔍 جستجوی کاربر برای بلاک')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // ارسال پیام خصوصی به کاربر
      await interaction.user.send({
        embeds: [noFriendsEmbed],
        components: [row]
      }).catch(() => {
        // اگر نتوانستیم پیام خصوصی بفرستیم
        interaction.followUp({
          content: "❌ امکان ارسال پیام خصوصی به شما وجود ندارد. لطفاً تنظیمات حریم خصوصی خود را بررسی کنید.",
          ephemeral: true
        });
      });
      
      return;
    }
    
    // ایجاد Embed برای نمایش لیست دوستان
    const blockFriendEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 بلاک کردن کاربر')
      .setDescription('یکی از دوستان خود را برای بلاک کردن انتخاب کنید، یا کاربر دیگری را جستجو کنید:')
      .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
    
    // ساخت دکمه‌ها برای انتخاب دوستان (حداکثر 5 دوست در یک ردیف)
    const actionRows: ActionRowBuilder<ButtonBuilder>[] = [];
    let currentRow = new ActionRowBuilder<ButtonBuilder>();
    let buttonCount = 0;
    
    for (let i = 0; i < Math.min(friends.length, 10); i++) {
      const friend = friends[i];
      const friendUser = await storage.getUserByDiscordId(friend.friendId);
      
      if (friendUser) {
        if (buttonCount % 3 === 0 && buttonCount > 0) {
          actionRows.push(currentRow);
          currentRow = new ActionRowBuilder<ButtonBuilder>();
        }
        
        currentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`block_user_${friendUser.discordId}`)
            .setLabel(`${getLevelEmoji(friend.friendshipLevel)} ${friendUser.username}`)
            .setStyle(ButtonStyle.Danger)
        );
        
        buttonCount++;
      }
    }
    
    if (buttonCount % 3 !== 0) {
      actionRows.push(currentRow);
    }
    
    // دکمه‌های اضافی
    const navigationRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('block_by_search')
          .setLabel('🔍 جستجوی کاربر دیگر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت به منوی دوستان')
          .setStyle(ButtonStyle.Secondary)
      );
    
    actionRows.push(navigationRow);
    
    // ارسال پیام خصوصی به کاربر
    await interaction.user.send({
      embeds: [blockFriendEmbed],
      components: actionRows
    }).catch(() => {
      // اگر نتوانستیم پیام خصوصی بفرستیم
      interaction.followUp({
        content: "❌ امکان ارسال پیام خصوصی به شما وجود ندارد. لطفاً تنظیمات حریم خصوصی خود را بررسی کنید.",
        ephemeral: true
      });
    });
    
  } catch (error) {
    console.error("Error in searchUserToBlock:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * جستجوی کاربر برای بلاک کردن با نام کاربری یا آیدی
 * @param interaction برهم‌کنش دکمه
 */
export async function searchUserToBlockByName(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد.",
        ephemeral: true
      });
    }
    
    // ایجاد Embed برای جستجوی کاربر
    const searchEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🔍 جستجوی کاربر برای بلاک کردن')
      .setDescription('لطفاً نام کاربری یا آیدی کاربر مورد نظر را وارد کنید:')
      .setFooter({ text: '⏱️ 60 ثانیه فرصت دارید.' });
    
    const cancelRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('cancel_block_search')
          .setLabel('❌ لغو جستجو')
          .setStyle(ButtonStyle.Secondary)
      );
    
    const message = await interaction.reply({
      embeds: [searchEmbed],
      components: [cancelRow],
      fetchReply: true
    });
    
    // به کاربر اطلاع دهیم که منتظر ورودی او هستیم
    await interaction.followUp({
      content: "⌨️ لطفاً نام یا شناسه کاربر مورد نظر را در پیام بعدی وارد کنید...",
      ephemeral: true
    });
    
    // دریافت پیام مستقیم کاربر از طریق DM
    try {
      // ایجاد کانال DM با کاربر
      const dmChannel = await interaction.user.createDM();
      
      // ارسال پیام درخواست جستجو
      const dmMessage = await dmChannel.send({
        content: '🔍 لطفاً نام یا شناسه کاربری که می‌خواهید بلاک کنید را وارد کنید:',
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('cancel_block_search')
                .setLabel('❌ لغو جستجو')
                .setStyle(ButtonStyle.Danger)
            )
        ]
      });
      
      // تنظیم فیلتر برای دریافت پیام فقط از کاربر اصلی
      const filter = (m: any) => m.author.id === interaction.user.id && !m.author.bot;
      
      // ایجاد collector برای دریافت پیام کاربر
      const collector = dmChannel.createMessageCollector({ 
        filter, 
        time: 60000, // 1 دقیقه زمان برای پاسخ
        max: 1 
      });
      
      // هنگام دریافت پیام
      collector.on('collect', async (collectedMessage) => {
        const searchQuery = collectedMessage.content.trim();
        
        // حذف پیام کاربر برای حفظ حریم خصوصی
        if (collectedMessage.deletable) {
          await collectedMessage.delete().catch(() => {});
        }
        
        // جستجوی کاربر با استفاده از تابع processUserSearch
        await processUserSearch(interaction, searchQuery, user, dmMessage);
      });
      
      // پایان زمان جمع‌آوری
      collector.on('end', collected => {
        if (collected.size === 0) {
          // اگر هیچ پیامی دریافت نشد (تایم‌اوت)
          dmChannel.send('⏱️ زمان جستجوی کاربر به پایان رسید!')
            .catch(() => {});
          
          // به روزرسانی پیام اصلی
          interaction.editReply({
            content: "⏱️ زمان جستجوی کاربر به پایان رسید!",
            components: [],
            embeds: []
          }).catch(() => {});
        }
      });
    } catch (error) {
      console.error("Error in DM channel:", error);
      await interaction.followUp({
        content: "❌ امکان ارسال پیام خصوصی به شما وجود ندارد. لطفاً DM خود را باز کنید.",
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Error in searchUserToBlockByName:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * تأیید بلاک کردن کاربر
 * @param interaction برهم‌کنش با کاربر
 * @param targetUser کاربر مورد نظر برای بلاک
 */
export async function confirmBlockUser(interaction: MessageComponentInteraction, targetUser: any) {
  try {
    const confirmEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 تأیید بلاک کردن')
      .setDescription(`مطمئنی می‌خوای **${targetUser.username}** رو بلاک کنی؟ 😕\nبعد از بلاک کردن، این کاربر نمی‌تونه باهات چت کنه یا درخواست دوستی بفرسته.`)
      .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_block_${targetUser.discordId}`)
          .setLabel('✅ بله، بلاک کن')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_block')
          .setLabel('❌ خیر، لغو')
          .setStyle(ButtonStyle.Success)
      );
    
    await interaction.editReply({
      embeds: [confirmEmbed],
      components: [row]
    });
  } catch (error) {
    console.error("Error in confirmBlockUser:", error);
    await interaction.editReply({
      content: "❌ خطایی در تأیید بلاک کردن رخ داد!",
      components: []
    });
  }
}

/**
 * پردازش نهایی بلاک کردن کاربر
 * @param interaction برهم‌کنش با کاربر
 * @param targetUserId شناسه کاربر مورد نظر
 */
export async function processBlockUser(interaction: MessageComponentInteraction, targetUserId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) return;
    
    const targetUser = await storage.getUserByDiscordId(targetUserId);
    if (!targetUser) {
      await interaction.update({
        content: "❌ کاربر مورد نظر یافت نشد!",
        embeds: [],
        components: []
      });
      return;
    }
    
    // بررسی مجدد اینکه کاربر قبلاً بلاک نشده باشد
    const isAlreadyBlocked = await storage.isUserBlocked(user.id, targetUser.id);
    if (isAlreadyBlocked) {
      await interaction.update({
        content: `⚠️ کاربر ${targetUser.username} قبلاً بلاک شده است!`,
        embeds: [],
        components: []
      });
      return;
    }
    
    // بلاک کردن کاربر با دلیل "درخواست کاربر"
    const result = await storage.blockUser(user.id, targetUser.id, "درخواست کاربر");
    
    if (result) {
      // موفقیت آمیز بود
      const successEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('✅ کاربر بلاک شد!')
        .setDescription(`کاربر **${targetUser.username}** با موفقیت بلاک شد. دیگه نمی‌تونه باهات تعامل داشته باشه.`)
        .setThumbnail('https://img.icons8.com/fluency/48/checkmark.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('blocked_users')
            .setLabel('👥 مشاهده لیست کاربران بلاک شده')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({
        embeds: [successEmbed],
        components: [row]
      });
      
      // اعلان به کاربر بلاک شده (اختیاری)
      try {
        const targetDiscordUser = await interaction.client.users.fetch(targetUser.discordId);
        
        if (targetDiscordUser) {
          const blockNotificationEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('🚫 اطلاعیه')
            .setDescription(`متأسفانه کاربر **${user.username}** شما را بلاک کرده است. دیگر نمی‌توانید با ایشان چت کنید یا درخواست دوستی بفرستید.`)
            .setTimestamp();
          
          await targetDiscordUser.send({ embeds: [blockNotificationEmbed] }).catch(() => {
            // اگر نتوانستیم به کاربر بلاک شده پیام بدهیم، اشکالی ندارد
          });
        }
      } catch (error) {
        // خطای ارسال اعلان را نادیده می‌گیریم
        console.error("Error sending block notification:", error);
      }
    } else {
      // خطا رخ داد
      await interaction.update({
        content: "❌ متأسفانه در بلاک کردن کاربر خطایی رخ داد!",
        embeds: [],
        components: []
      });
    }
  } catch (error) {
    console.error("Error in processBlockUser:", error);
    await interaction.update({
      content: "❌ خطایی در بلاک کردن کاربر رخ داد!",
      embeds: [],
      components: []
    });
  }
}

/**
 * لغو عملیات بلاک کردن
 * @param interaction برهم‌کنش با کاربر
 */
export async function cancelBlockProcess(interaction: MessageComponentInteraction) {
  try {
    const cancelEmbed = new EmbedBuilder()
      .setColor('#8A8A8A')
      .setTitle('⚠️ بلاک کردن لغو شد')
      .setDescription('عملیات بلاک کردن کاربر لغو شد.')
      .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت به منوی دوستان')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.update({
      embeds: [cancelEmbed],
      components: [row]
    });
  } catch (error) {
    console.error("Error in cancelBlockProcess:", error);
    await interaction.update({
      content: "❌ خطایی در لغو عملیات رخ داد!",
      embeds: [],
      components: []
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
    case 5: return '🌟';
    case 4: return '💎';
    case 3: return '🔷';
    case 2: return '🔵';
    case 1: 
    default: return '⚪';
  }
}

/**
 */
/**
 * تأیید رفع بلاک کاربر
 * @param interaction برهم‌کنش با کاربر
 * @param blockedUserId شناسه کاربر بلاک شده
 */
export async function confirmUnblockUser(interaction: MessageComponentInteraction, blockedUserId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // دریافت اطلاعات کاربر بلاک شده
    const blockedUser = await storage.getUserByDiscordId(blockedUserId);
    
    if (!blockedUser) {
      return await interaction.reply({
        content: "❌ کاربر مورد نظر یافت نشد.",
        ephemeral: true
      });
    }
    
    // نمایش صفحه تأیید
    const confirmEmbed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('⚠️ تأیید رفع بلاک')
      .setDescription(`آیا مطمئنید می‌خواهید **${blockedUser.username}** را از لیست بلاک خارج کنید؟\n\nبعد از رفع بلاک، این کاربر می‌تواند مجدداً با شما ارتباط برقرار کند.`)
      .setThumbnail('https://img.icons8.com/fluency/48/question-mark.png');
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_unblock_${blockedUser.discordId}`)
          .setLabel('✅ بله، رفع بلاک کن')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('cancel_unblock')
          .setLabel('❌ خیر، لغو')
          .setStyle(ButtonStyle.Danger)
      );
    
    await interaction.update({
      embeds: [confirmEmbed],
      components: [row]
    });
  } catch (error) {
    console.error("Error in confirmUnblockUser:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * رفع بلاک کاربر
 * @param interaction برهم‌کنش با کاربر
 * @param blockedUserId شناسه کاربر بلاک شده
 */
export async function unblockUser(interaction: MessageComponentInteraction, blockedUserId: string) {
  try {
    // نمایش صفحه تأیید
    await confirmUnblockUser(interaction, blockedUserId);
  } catch (error) {
    console.error("Error in unblockUser:", error);
    await interaction.reply({
      content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * پردازش نهایی رفع بلاک کاربر
 * @param interaction برهم‌کنش با کاربر
 * @param blockedUserId شناسه کاربر بلاک شده
 */
export async function processUnblockUser(interaction: MessageComponentInteraction, blockedUserId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) return;
    
    const blockedUser = await storage.getUserByDiscordId(blockedUserId);
    if (!blockedUser) {
      await interaction.update({
        content: "❌ کاربر مورد نظر یافت نشد!",
        embeds: [],
        components: []
      });
      return;
    }
    
    // رفع بلاک کاربر
    const result = await storage.unblockUser(user.id, blockedUser.id);
    
    if (result) {
      // موفقیت آمیز بود
      const successEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('✅ رفع بلاک انجام شد')
        .setDescription(`کاربر **${blockedUser.username}** با موفقیت از لیست بلاک‌شده‌ها خارج شد.`)
        .setThumbnail('https://img.icons8.com/fluency/48/checkmark.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('blocked_users')
            .setLabel('👥 مشاهده لیست کاربران بلاک شده')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({
        embeds: [successEmbed],
        components: [row]
      });
      
      // اعلان به کاربر رفع بلاک شده (اختیاری)
      try {
        const targetDiscordUser = await interaction.client.users.fetch(blockedUser.discordId);
        
        if (targetDiscordUser) {
          const unblockNotificationEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🎉 خبر خوب!')
            .setDescription(`کاربر **${user.username}** شما را از لیست بلاک خارج کرده است. اکنون می‌توانید با ایشان ارتباط برقرار کنید.`)
            .setTimestamp();
          
          await targetDiscordUser.send({ embeds: [unblockNotificationEmbed] }).catch(() => {
            // اگر نتوانستیم به کاربر رفع بلاک شده پیام بدهیم، اشکالی ندارد
          });
        }
      } catch (error) {
        // خطای ارسال اعلان را نادیده می‌گیریم
        console.error("Error sending unblock notification:", error);
      }
    } else {
      // خطا رخ داد
      const errorEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('❌ خطا')
        .setDescription('متأسفانه در رفع بلاک کاربر خطایی رخ داد!')
        .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('blocked_users')
            .setLabel('🔙 بازگشت به لیست بلاک‌شده‌ها')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({
        embeds: [errorEmbed],
        components: [row]
      });
    }
  } catch (error) {
    console.error("Error in processUnblockUser:", error);
    await interaction.update({
      content: "❌ خطایی در رفع بلاک کاربر رخ داد!",
      embeds: [],
      components: []
    });
  }
}

/**
 * پردازش جستجوی کاربر برای بلاک کردن
 * @param interaction برهم‌کنش با کاربر
 * @param searchQuery متن جستجو (نام کاربری یا شناسه دیسکورد)
 * @param user کاربر جستجوکننده
 * @param dmMessage پیام خصوصی ارسال شده به کاربر
 */
export async function processUserSearch(
  interaction: MessageComponentInteraction, 
  searchQuery: string, 
  user: any,
  dmMessage: any
) {
  try {
    // جستجوی کاربر (اول با آیدی دیسکورد، سپس با نام کاربری)
    let targetUser = await storage.getUserByDiscordId(searchQuery);
    
    if (!targetUser) {
      // تلاش برای جستجو بر اساس نام کاربری
      const allUsers = await storage.getAllUsers();
      targetUser = allUsers.find(u => u.username.toLowerCase() === searchQuery.toLowerCase());
    }
    
    // ارسال نتیجه جستجو به پیام خصوصی
    if (!targetUser) {
      // کاربر یافت نشد
      const notFoundEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('❌ کاربر یافت نشد')
        .setDescription(`کاربری با مشخصات "${searchQuery}" پیدا نشد.`)
        .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('block_by_search')
            .setLabel('🔍 جستجوی مجدد')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // به روزرسانی پیام خصوصی
      await dmMessage.edit({
        embeds: [notFoundEmbed],
        components: [row]
      });
      
      // به روزرسانی پیام در کانال اصلی
      await interaction.editReply({
        content: "⚠️ کاربری با این مشخصات یافت نشد. برای جستجوی مجدد به پیام خصوصی مراجعه کنید.",
        components: []
      });
      
      return;
    }
    
    // بررسی اینکه کاربر خودش نباشد
    if (targetUser.discordId === user.discordId) {
      const selfBlockEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('❌ خطا')
        .setDescription('شما نمی‌توانید خودتان را بلاک کنید!')
        .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('block_by_search')
            .setLabel('🔍 جستجوی کاربر دیگر')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await dmMessage.edit({
        embeds: [selfBlockEmbed],
        components: [row]
      });
      
      return;
    }
    
    // بررسی اینکه کاربر قبلاً مسدود نشده باشد
    const isAlreadyBlocked = await storage.isUserBlocked(user.id, targetUser.id);
    
    if (isAlreadyBlocked) {
      const alreadyBlockedEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('❌ کاربر قبلاً بلاک شده است')
        .setDescription(`کاربر ${targetUser.username} قبلاً توسط شما بلاک شده است.`)
        .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('block_by_search')
            .setLabel('🔍 جستجوی کاربر دیگر')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('friends_menu')
            .setLabel('🔙 بازگشت به منوی دوستان')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await dmMessage.edit({
        embeds: [alreadyBlockedEmbed],
        components: [row]
      });
      
      return;
    }
    
    // کاربر پیدا شد و می‌تواند بلاک شود - نمایش صفحه تأیید
    const confirmEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 تأیید بلاک کردن')
      .setDescription(`مطمئنی می‌خوای **${targetUser.username}** رو بلاک کنی؟ 😕\nبعد از بلاک کردن، این کاربر نمی‌تونه باهات چت کنه یا درخواست دوستی بفرسته.`)
      .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_block_${targetUser.discordId}`)
          .setLabel('✅ بله، بلاک کن')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_block')
          .setLabel('❌ خیر، لغو')
          .setStyle(ButtonStyle.Success)
      );
    
    await dmMessage.edit({
      embeds: [confirmEmbed],
      components: [row]
    });
    
    // به روزرسانی پیام اصلی
    await interaction.editReply({
      content: "✅ کاربر یافت شد. برای تأیید بلاک کردن به پیام خصوصی مراجعه کنید.",
      components: []
    });
    
  } catch (error) {
    console.error("Error in processUserSearch:", error);
    
    // در صورت خطا، پیام مناسب به کاربر نمایش داده می‌شود
    try {
      if (dmMessage) {
        await dmMessage.edit({
          content: "❌ خطایی در جستجوی کاربر رخ داد! لطفاً دوباره تلاش کنید.",
          embeds: [],
          components: []
        }).catch(() => {});
      }
    } catch (e) {
      // خطای ارسال پیام را نادیده می‌گیریم
    }
  }
}

/**
 * لغو عملیات رفع بلاک
 * @param interaction برهم‌کنش با کاربر
 */
export async function cancelUnblockProcess(interaction: MessageComponentInteraction) {
  try {
    const cancelEmbed = new EmbedBuilder()
      .setColor('#8A8A8A')
      .setTitle('⚠️ رفع بلاک لغو شد')
      .setDescription('عملیات رفع بلاک کاربر لغو شد.')
      .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('blocked_users')
          .setLabel('🔙 بازگشت به لیست بلاک‌شده‌ها')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.update({
      embeds: [cancelEmbed],
      components: [row]
    });
  } catch (error) {
    console.error("Error in cancelUnblockProcess:", error);
    await interaction.update({
      content: "❌ خطایی در لغو عملیات رخ داد!",
      embeds: [],
      components: []
    });
  }
}