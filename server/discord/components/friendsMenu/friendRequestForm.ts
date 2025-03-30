import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { storage } from '../../../storage';

/**
 * نمایش فرم ارسال درخواست دوستی
 * @param interaction برهم‌کنش با کاربر
 */
export async function showFriendRequestForm(interaction: MessageComponentInteraction) {
  try {
    // ایجاد فرم مودال برای ارسال درخواست دوستی
    const modal = new ModalBuilder()
      .setCustomId('friend_request_modal')
      .setTitle('🤝 ارسال درخواست دوستی');
      
    // ایجاد فیلد آیدی عددی کاربر
    const userIdInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('آیدی عددی کاربر مورد نظر را وارد کنید')
      .setPlaceholder('مثال: 123456789012345678')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(17)
      .setMaxLength(19);
      
    // ایجاد فیلد پیام شخصی (اختیاری)
    const messageInput = new TextInputBuilder()
      .setCustomId('message')
      .setLabel('پیام شخصی (اختیاری)')
      .setPlaceholder('سلام! من [نام شما] هستم. دوست دارم با هم دوست باشیم!')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(100);
      
    // افزودن فیلدها به فرم
    const idActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    const messageActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
    
    modal.addComponents(idActionRow, messageActionRow);
    
    // نمایش فرم به کاربر
    await interaction.showModal(modal);
  } catch (error) {
    console.error("Error in showFriendRequestForm:", error);
    await interaction.reply({
      content: "❌ خطایی در نمایش فرم ارسال درخواست دوستی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * پردازش فرم ارسال درخواست دوستی
 * @param interaction برهم‌کنش با کاربر
 */
export async function processFriendRequestForm(interaction: any) {
  try {
    // دریافت مقادیر وارد شده توسط کاربر
    const userId = interaction.fields.getTextInputValue('user_id');
    const message = interaction.fields.getTextInputValue('message') || "درخواست دوستی جدید";
    
    // دریافت اطلاعات کاربر فرستنده
    const sender = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!sender) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد! لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // اعتبارسنجی آیدی وارد شده
    if (!/^\d{17,19}$/.test(userId)) {
      return await interaction.reply({
        content: "❌ آیدی کاربر نامعتبر است! آیدی باید فقط شامل اعداد و بین 17 تا 19 رقم باشد.",
        ephemeral: true
      });
    }
    
    // بررسی اینکه کاربر درخواست به خودش نداده باشد
    if (userId === interaction.user.id) {
      return await interaction.reply({
        content: "❌ نمی‌توانید به خودتان درخواست دوستی بفرستید!",
        ephemeral: true
      });
    }
    
    // دریافت اطلاعات کاربر مقصد
    const receiver = await storage.getUserByDiscordId(userId);
    
    // بررسی وجود کاربر مقصد
    if (!receiver) {
      return await interaction.reply({
        content: "❌ کاربر مورد نظر در سیستم یافت نشد! لطفاً آیدی را بررسی کنید.",
        ephemeral: true
      });
    }
    
    // بررسی اینکه کاربر مقصد، فرستنده را بلاک نکرده باشد
    const isBlocked = await storage.isUserBlocked(receiver.id, sender.id);
    if (isBlocked) {
      return await interaction.reply({
        content: "❌ امکان ارسال درخواست دوستی به این کاربر وجود ندارد! ممکن است شما را مسدود کرده باشد.",
        ephemeral: true
      });
    }
    
    // بررسی اینکه کاربران از قبل دوست نباشند
    const existingFriendship = await storage.getFriendship(sender.id, receiver.id);
    if (existingFriendship) {
      return await interaction.reply({
        content: `⚠️ شما و ${receiver.username} در حال حاضر دوست هستید!`,
        ephemeral: true
      });
    }
    
    // بررسی اینکه درخواست تکراری نباشد
    const pendingRequest = await storage.getPendingFriendRequest(sender.id, receiver.id);
    if (pendingRequest) {
      return await interaction.reply({
        content: `⚠️ شما قبلاً به ${receiver.username} درخواست دوستی فرستاده‌اید که هنوز در انتظار پاسخ است.`,
        ephemeral: true
      });
    }
    
    // ایجاد درخواست دوستی
    const requestResult = await storage.createFriendRequest(sender.id, receiver.id, message);
    
    if (!requestResult) {
      return await interaction.reply({
        content: "❌ خطایی در ارسال درخواست دوستی رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
    
    // ارسال پاسخ موفقیت‌آمیز به فرستنده
    await interaction.reply({
      content: `✅ درخواست دوستی شما با موفقیت برای ${receiver.username} ارسال شد!`,
      ephemeral: true
    });
    
    // ارسال اعلان به کاربر مقصد
    try {
      const targetDiscordUser = await interaction.client.users.fetch(userId);
      
      if (targetDiscordUser) {
        const requestEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🤝 درخواست دوستی جدید')
          .setDescription(`کاربر **${sender.username}** به شما درخواست دوستی فرستاده است!`)
          .addFields(
            { name: '💬 پیام', value: message || "*بدون پیام*" },
            { name: '⏱️ زمان', value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
          )
          .setThumbnail('https://img.icons8.com/fluency/48/add-user-male.png');
          
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`accept_friend_${sender.discordId}`)
              .setLabel('✅ قبول درخواست')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`reject_friend_${sender.discordId}`)
              .setLabel('❌ رد درخواست')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('friend_requests')
              .setLabel('👥 همه درخواست‌ها')
              .setStyle(ButtonStyle.Primary)
          );
          
        await targetDiscordUser.send({
          embeds: [requestEmbed],
          components: [buttonRow]
        }).catch(() => {
          // اگر نتوانستیم پیام خصوصی بفرستیم، اطلاع می‌دهیم
          console.log(`Could not send DM to user ${targetDiscordUser.tag}`);
        });
      }
    } catch (error) {
      console.error("Error sending friend request notification:", error);
    }
    
  } catch (error) {
    console.error("Error in processFriendRequestForm:", error);
    await interaction.reply({
      content: "❌ خطایی در پردازش درخواست دوستی رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * جستجوی کاربر برای ارسال درخواست دوستی (جایگزین مدال)
 * این تابع برای دسترسی بهتر به کاربرانی است که نمی‌توانند از فرم مدال استفاده کنند
 * @param interaction برهم‌کنش با کاربر
 */
export async function searchUserForFriendRequest(interaction: MessageComponentInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: "❌ حساب کاربری شما یافت نشد! لطفاً با دستور `/start` یک حساب بسازید.",
        ephemeral: true
      });
    }
    
    // ایجاد Embed برای جستجوی کاربر
    const searchEmbed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('🔍 جستجوی کاربر برای ارسال درخواست دوستی')
      .setDescription('لطفاً نام کاربری یا آیدی عددی کاربر مورد نظر را وارد کنید:')
      .setFooter({ text: '⏱️ 60 ثانیه فرصت دارید.' });
    
    // ساخت دکمه لغو
    const cancelRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('cancel_friend_search')
          .setLabel('❌ لغو جستجو')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پیام اولیه
    await interaction.reply({
      embeds: [searchEmbed],
      components: [cancelRow],
      ephemeral: true
    });
    
    // اطلاع‌رسانی به کاربر که منتظر پیام بعدی او هستیم
    await interaction.followUp({
      content: "⌨️ لطفاً پیام بعدی خود را وارد کنید...",
      ephemeral: true
    });
    
    // ایجاد کلکتور برای دریافت پیام کاربر
    const filter = (m: any) => m.author.id === interaction.user.id && !m.author.bot;
    const channel = await interaction.channel!;
    
    const collector = channel.createMessageCollector({ 
      filter, 
      time: 60000, // 1 دقیقه زمان
      max: 1 
    });
    
    // هنگام دریافت پیام
    collector.on('collect', async (message) => {
      const searchQuery = message.content.trim();
      
      // حذف پیام کاربر برای حفظ حریم خصوصی
      if (message.deletable) {
        await message.delete().catch(() => {});
      }
      
      // جستجوی کاربر
      let foundUser = null;
      
      // سعی می‌کنیم ابتدا به عنوان آیدی عددی بررسی کنیم
      if (/^\d{17,19}$/.test(searchQuery)) {
        foundUser = await storage.getUserByDiscordId(searchQuery);
      }
      
      // اگر کاربر پیدا نشد، با نام کاربری جستجو می‌کنیم
      if (!foundUser) {
        const allUsers = await storage.getAllUsers();
        foundUser = allUsers.find(u => 
          u.username.toLowerCase() === searchQuery.toLowerCase() || 
          u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // بررسی نتیجه جستجو
      if (!foundUser) {
        // کاربر پیدا نشد
        await interaction.editReply({
          content: "❌ کاربر مورد نظر یافت نشد! لطفاً نام یا آیدی را بررسی کنید.",
          embeds: [],
          components: []
        });
        return;
      }
      
      // بررسی اینکه کاربر خودش را جستجو نکرده باشد
      if (foundUser.discordId === interaction.user.id) {
        await interaction.editReply({
          content: "❌ نمی‌توانید به خودتان درخواست دوستی بفرستید!",
          embeds: [],
          components: []
        });
        return;
      }
      
      // بررسی اینکه کاربر مقصد، کاربر فعلی را بلاک نکرده باشد
      const isBlocked = await storage.isUserBlocked(foundUser.id, user.id);
      if (isBlocked) {
        await interaction.editReply({
          content: "❌ امکان ارسال درخواست دوستی به این کاربر وجود ندارد! ممکن است شما را مسدود کرده باشد.",
          embeds: [],
          components: []
        });
        return;
      }
      
      // بررسی اینکه قبلاً دوست نباشند
      const existingFriendship = await storage.getFriendship(user.id, foundUser.id);
      if (existingFriendship) {
        await interaction.editReply({
          content: `⚠️ شما و ${foundUser.username} در حال حاضر دوست هستید!`,
          embeds: [],
          components: []
        });
        return;
      }
      
      // بررسی اینکه درخواست تکراری نباشد
      const pendingRequest = await storage.getPendingFriendRequest(user.id, foundUser.id);
      if (pendingRequest) {
        await interaction.editReply({
          content: `⚠️ شما قبلاً به ${foundUser.username} درخواست دوستی فرستاده‌اید که هنوز در انتظار پاسخ است.`,
          embeds: [],
          components: []
        });
        return;
      }
      
      // نمایش تأیید ارسال درخواست دوستی
      const confirmEmbed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('🤝 ارسال درخواست دوستی')
        .setDescription(`آیا مطمئن هستید که می‌خواهید به **${foundUser.username}** درخواست دوستی بفرستید؟`)
        .setThumbnail('https://img.icons8.com/fluency/48/add-user-male.png');
      
      const confirmRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_friend_request_${foundUser.discordId}`)
            .setLabel('✅ بله، درخواست بفرست')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('cancel_friend_request')
            .setLabel('❌ خیر، لغو')
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.editReply({
        embeds: [confirmEmbed],
        components: [confirmRow]
      });
    });
    
    // پایان زمان جمع‌آوری
    collector.on('end', collected => {
      if (collected.size === 0) {
        // زمان به پایان رسید و پیامی دریافت نشد
        interaction.editReply({
          content: "⏱️ زمان جستجوی کاربر به پایان رسید!",
          embeds: [],
          components: []
        }).catch(() => {});
      }
    });
    
  } catch (error) {
    console.error("Error in searchUserForFriendRequest:", error);
    await interaction.reply({
      content: "❌ خطایی در جستجوی کاربر رخ داد! لطفاً دوباره تلاش کنید.",
      ephemeral: true
    });
  }
}

/**
 * ارسال درخواست دوستی با تأیید کاربر
 * @param interaction برهم‌کنش با کاربر
 * @param targetUserId شناسه کاربر مقصد
 */
export async function sendFriendRequest(interaction: MessageComponentInteraction, targetUserId: string) {
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
    
    // ایجاد درخواست دوستی با پیام پیش‌فرض
    const requestResult = await storage.createFriendRequest(user.id, targetUser.id, "می‌خواهم با شما دوست شوم!");
    
    if (!requestResult) {
      await interaction.update({
        content: "❌ خطایی در ارسال درخواست دوستی رخ داد!",
        embeds: [],
        components: []
      });
      return;
    }
    
    // ارسال پیام موفقیت
    const successEmbed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('✅ درخواست دوستی ارسال شد')
      .setDescription(`درخواست دوستی شما با موفقیت برای **${targetUser.username}** ارسال شد.`)
      .setThumbnail('https://img.icons8.com/fluency/48/checkmark.png');
    
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('friend_requests_sent')
          .setLabel('👥 درخواست‌های ارسال شده')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('friends_menu')
          .setLabel('🔙 بازگشت به منوی دوستان')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.update({
      embeds: [successEmbed],
      components: [buttonRow]
    });
    
    // ارسال اعلان به کاربر مقصد
    try {
      const targetDiscordUser = await interaction.client.users.fetch(targetUserId);
      
      if (targetDiscordUser) {
        const requestEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🤝 درخواست دوستی جدید')
          .setDescription(`کاربر **${user.username}** به شما درخواست دوستی فرستاده است!`)
          .addFields(
            { name: '💬 پیام', value: "می‌خواهم با شما دوست شوم!" },
            { name: '⏱️ زمان', value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
          )
          .setThumbnail('https://img.icons8.com/fluency/48/add-user-male.png');
          
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`accept_friend_${user.discordId}`)
              .setLabel('✅ قبول درخواست')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`reject_friend_${user.discordId}`)
              .setLabel('❌ رد درخواست')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('friend_requests')
              .setLabel('👥 همه درخواست‌ها')
              .setStyle(ButtonStyle.Primary)
          );
          
        await targetDiscordUser.send({
          embeds: [requestEmbed],
          components: [buttonRow]
        }).catch(() => {
          // اگر نتوانستیم پیام خصوصی بفرستیم، می‌توانیم به کاربر اطلاع دهیم
          console.log(`Could not send DM to user ${targetDiscordUser.tag}`);
        });
      }
    } catch (error) {
      console.error("Error sending friend request notification:", error);
    }
    
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    await interaction.update({
      content: "❌ خطایی در ارسال درخواست دوستی رخ داد!",
      embeds: [],
      components: []
    });
  }
}

/**
 * تابع کمکی برای تبدیل emoji سطح دوستی
 * @param level سطح دوستی
 * @returns emoji مناسب
 */
function getLevelEmoji(level: number): string {
  switch (level) {
    case 1: return '🥉';
    case 2: return '🥈';
    case 3: return '🥇';
    case 4: return '💎';
    case 5: return '👑';
    default: return '👤';
  }
}