import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { storage } from '../../../storage';
import { formatDate, formatRelativeTime } from '../../utils/formatter';

/**
 * کلاس مدیریت چت ناشناس
 * این کلاس امکان برقراری چت ناشناس بین کاربران را فراهم می‌کند
 */
export class AnonymousChatMenu {
  // مپ برای نگهداری چت‌های فعال
  private static activeChats = new Map<string, AnonymousChat>();
  
  // مپ برای نگهداری کاربران در صف انتظار
  private static waitingUsers = new Map<string, Date>();
  
  /**
   * نمایش منوی اصلی چت ناشناس
   * @param interaction برهم‌کنش با کاربر
   */
  public static async showMainMenu(interaction: MessageComponentInteraction) {
    try {
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        return await interaction.reply({
          content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
          ephemeral: true
        });
      }
      
      // بررسی آیا کاربر در یک چت فعال حضور دارد
      const userActiveChat = this.findUserActiveChat(user.discordId);
      
      // ایجاد Embed اصلی
      const embed = new EmbedBuilder()
        .setColor('#5865F2') // آبی دیسکورد
        .setTitle('🎭 چت ناشناس')
        .setDescription(`${interaction.user.username} عزیز، به سیستم چت ناشناس Ccoin خوش آمدید!\n\nدر این بخش می‌توانید به صورت ناشناس با کاربران دیگر گفتگو کنید. هویت شما فاش نخواهد شد مگر اینکه خودتان بخواهید.`)
        .setThumbnail('https://img.icons8.com/fluency/48/anonymous-mask.png');
      
      // افزودن فیلدهای مختلف بسته به وضعیت کاربر
      if (userActiveChat) {
        // کاربر در یک چت فعال حضور دارد
        embed.addFields(
          { name: '🔴 وضعیت', value: 'شما در حال حاضر در یک چت فعال هستید.', inline: false },
          { 
            name: '⏱️ زمان شروع', 
            value: formatRelativeTime(userActiveChat.createdAt), 
            inline: true 
          },
          { 
            name: '💬 تعداد پیام‌ها', 
            value: `${userActiveChat.messages.length}`, 
            inline: true 
          }
        );
        
        // دکمه‌های عملیات چت فعال
        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('view_anonymous_chat')
              .setLabel('💬 مشاهده چت')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('end_anonymous_chat')
              .setLabel('❌ پایان چت')
              .setStyle(ButtonStyle.Danger)
          );
        
        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('reveal_identity')
              .setLabel('🔍 فاش کردن هویت')
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
      } else {
        // کاربر در چت فعال نیست
        
        // بررسی آیا کاربر در صف انتظار است
        const isWaiting = this.waitingUsers.has(user.discordId);
        
        if (isWaiting) {
          const waitingSince = this.waitingUsers.get(user.discordId);
          
          embed.addFields(
            { name: '🟡 وضعیت', value: 'شما در صف انتظار هستید.', inline: false },
            { 
              name: '⏱️ زمان انتظار', 
              value: waitingSince ? formatRelativeTime(waitingSince) : 'نامشخص', 
              inline: true 
            },
            { 
              name: '💡 راهنمایی', 
              value: 'به محض یافتن هم‌صحبت مناسب، چت شروع خواهد شد.', 
              inline: false 
            }
          );
          
          // دکمه‌های عملیات صف انتظار
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('cancel_anonymous_wait')
                .setLabel('❌ لغو جستجو')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('👥 بازگشت به منوی دوستان')
                .setStyle(ButtonStyle.Secondary)
            );
          
          // ارسال پاسخ
          await interaction.update({
            embeds: [embed],
            components: [row]
          });
        } else {
          // کاربر در هیچ چت یا صفی نیست
          embed.addFields(
            { name: '🟢 وضعیت', value: 'آماده برای شروع چت جدید', inline: false },
            { 
              name: '💡 راهنمایی', 
              value: 'می‌توانید به صورت تصادفی با یک کاربر ناشناس چت کنید.', 
              inline: false 
            },
            { 
              name: '⚠️ توجه', 
              value: 'هویت شما فاش نخواهد شد مگر اینکه خودتان بخواهید. لطفاً قوانین را رعایت کنید.', 
              inline: false 
            }
          );
          
          // دکمه‌های شروع چت جدید
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('start_anonymous_chat')
                .setLabel('🔍 شروع چت ناشناس')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('friends_menu')
                .setLabel('👥 بازگشت به منوی دوستان')
                .setStyle(ButtonStyle.Secondary)
            );
          
          // ارسال پاسخ
          await interaction.update({
            embeds: [embed],
            components: [row]
          });
        }
      }
    } catch (error) {
      console.error("Error in AnonymousChatMenu.showMainMenu:", error);
      await interaction.reply({
        content: "❌ خطایی رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * شروع جستجو برای چت ناشناس
   * @param interaction برهم‌کنش با کاربر
   */
  public static async startChatSearch(interaction: MessageComponentInteraction) {
    try {
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        return await interaction.reply({
          content: "❌ حساب کاربری شما یافت نشد.",
          ephemeral: true
        });
      }
      
      // بررسی آیا کاربر در یک چت فعال حضور دارد
      if (this.findUserActiveChat(user.discordId)) {
        return await interaction.update({
          content: "⚠️ شما در حال حاضر در یک چت فعال هستید! ابتدا آن را پایان دهید.",
          components: []
        });
      }
      
      // بررسی آیا کاربر قبلاً در صف انتظار است
      if (this.waitingUsers.has(user.discordId)) {
        return await interaction.update({
          content: "⚠️ شما قبلاً در صف انتظار قرار دارید!",
          components: []
        });
      }
      
      // جستجو برای کاربر دیگری که در انتظار است
      let matchedUserId: string | null = null;
      
      for (const [waitingUserId, waitTime] of this.waitingUsers) {
        // بررسی اینکه کاربر منتظر هنوز فعال باشد و بلاک نشده باشد
        const waitingUser = await storage.getUserByDiscordId(waitingUserId);
        if (!waitingUser) continue;
        
        // بررسی اینکه کاربران یکدیگر را بلاک نکرده باشند
        const userBlockedWaiting = await storage.isUserBlocked(user.id, waitingUser.id);
        const waitingBlockedUser = await storage.isUserBlocked(waitingUser.id, user.id);
        
        if (!userBlockedWaiting && !waitingBlockedUser) {
          matchedUserId = waitingUserId;
          break;
        }
      }
      
      if (matchedUserId) {
        // یک کاربر منتظر پیدا شد
        const matchedUser = await storage.getUserByDiscordId(matchedUserId);
        if (!matchedUser) {
          // کاربر یافت شده معتبر نیست
          this.waitingUsers.delete(matchedUserId);
          
          // اضافه کردن کاربر فعلی به صف انتظار
          this.waitingUsers.set(user.discordId, new Date());
          
          // نمایش پیام انتظار
          await this.showWaitingMessage(interaction);
          return;
        }
        
        // حذف کاربر از صف انتظار
        this.waitingUsers.delete(matchedUserId);
        
        // ایجاد چت جدید بین دو کاربر
        const chatId = `anonymous_${Date.now()}`;
        const newChat: AnonymousChat = {
          chatId,
          user1Id: matchedUserId,
          user2Id: user.discordId,
          messages: [],
          createdAt: new Date().toISOString(),
          status: 'active',
          lastMessageAt: new Date().toISOString()
        };
        
        // ذخیره چت جدید
        this.activeChats.set(chatId, newChat);
        
        // اطلاع‌رسانی به کاربر فعلی
        const userEmbed = new EmbedBuilder()
          .setColor('#2ECC71')
          .setTitle('✅ هم‌صحبت پیدا شد!')
          .setDescription('یک هم‌صحبت برای شما پیدا شد! اکنون می‌توانید گفتگو کنید.')
          .setThumbnail('https://img.icons8.com/fluency/48/chatbot.png')
          .addFields(
            { name: '🔍 هویت', value: 'هویت شما و طرف مقابل ناشناس است.', inline: false },
            { name: '💬 نحوه گفتگو', value: 'پیام خود را در کانال بنویسید تا ارسال شود.', inline: false }
          );
        
        const userRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('view_anonymous_chat')
              .setLabel('💬 شروع گفتگو')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('end_anonymous_chat')
              .setLabel('❌ پایان چت')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({
          embeds: [userEmbed],
          components: [userRow]
        });
        
        // تلاش برای اطلاع‌رسانی به کاربر دیگر
        try {
          // ممکن است کاربر مقابل دسترسی برای پیام دریافت نکند
          const matchedUserEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ هم‌صحبت پیدا شد!')
            .setDescription('هم‌صحبت مورد نظر برای شما پیدا شد! اکنون می‌توانید گفتگو کنید.')
            .setThumbnail('https://img.icons8.com/fluency/48/chatbot.png')
            .addFields(
              { name: '🔍 هویت', value: 'هویت شما و طرف مقابل ناشناس است.', inline: false },
              { name: '💬 نحوه گفتگو', value: 'پیام خود را در کانال بنویسید تا ارسال شود.', inline: false }
            );
          
          const matchedUserRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('view_anonymous_chat')
                .setLabel('💬 شروع گفتگو')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('end_anonymous_chat')
                .setLabel('❌ پایان چت')
                .setStyle(ButtonStyle.Danger)
            );
          
          // سعی می‌کنیم به کاربر مقابل اطلاع دهیم
          const guild = interaction.guild;
          const member = guild?.members.cache.get(matchedUserId);
          
          if (member) {
            try {
              await member.send({
                content: '🎭 **چت ناشناس جدید**',
                embeds: [matchedUserEmbed],
                components: [matchedUserRow]
              });
            } catch (dmError) {
              console.log(`Could not send DM to matched user: ${matchedUserId}`);
              // اگر پیام مستقیم ارسال نشد، می‌توان از روش‌های دیگر استفاده کرد
            }
          }
        } catch (notifyError) {
          console.error("Error notifying matched user:", notifyError);
          // خطا در اطلاع‌رسانی به کاربر مقابل
        }
      } else {
        // کاربر مناسبی در انتظار نیست، به صف اضافه می‌شود
        this.waitingUsers.set(user.discordId, new Date());
        
        // نمایش پیام انتظار
        await this.showWaitingMessage(interaction);
      }
    } catch (error) {
      console.error("Error in AnonymousChatMenu.startChatSearch:", error);
      await interaction.reply({
        content: "❌ خطایی در جستجوی هم‌صحبت رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * نمایش پیام انتظار برای کاربر
   * @param interaction برهم‌کنش با کاربر
   */
  private static async showWaitingMessage(interaction: MessageComponentInteraction) {
    try {
      const waitingEmbed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('⏳ در حال جستجوی هم‌صحبت...')
        .setDescription('لطفاً صبر کنید، در حال یافتن یک هم‌صحبت مناسب برای شما هستیم.')
        .setThumbnail('https://img.icons8.com/fluency/48/hourglass.png')
        .addFields(
          { name: '🔍 وضعیت', value: 'در صف انتظار', inline: true },
          { name: '⏱️ زمان انتظار', value: 'تازه شروع شده', inline: true },
          { name: '💡 راهنمایی', value: 'می‌توانید با کلیک روی دکمه «لغو جستجو»، از صف انتظار خارج شوید.', inline: false }
        )
        .setFooter({ text: 'به محض یافتن هم‌صحبت مناسب به شما اطلاع داده خواهد شد.' });
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('cancel_anonymous_wait')
            .setLabel('❌ لغو جستجو')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('anonymous_chat_menu')
            .setLabel('🔄 بررسی وضعیت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({
        embeds: [waitingEmbed],
        components: [row]
      });
    } catch (error) {
      console.error("Error showing waiting message:", error);
    }
  }
  
  /**
   * لغو جستجوی هم‌صحبت
   * @param interaction برهم‌کنش با کاربر
   */
  public static async cancelChatSearch(interaction: MessageComponentInteraction) {
    try {
      const userId = interaction.user.id;
      
      // حذف کاربر از صف انتظار
      if (this.waitingUsers.has(userId)) {
        this.waitingUsers.delete(userId);
        
        const cancelEmbed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ جستجو لغو شد')
          .setDescription('جستجوی هم‌صحبت با موفقیت لغو شد.')
          .setThumbnail('https://img.icons8.com/fluency/48/cancel.png');
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('anonymous_chat_menu')
              .setLabel('🔙 بازگشت به منوی چت ناشناس')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('friends_menu')
              .setLabel('👥 بازگشت به منوی دوستان')
              .setStyle(ButtonStyle.Secondary)
          );
        
        await interaction.update({
          embeds: [cancelEmbed],
          components: [row]
        });
      } else {
        // کاربر در صف نیست
        await interaction.update({
          content: "⚠️ شما در صف انتظار نیستید!",
          components: []
        });
        
        // بازگشت به منوی اصلی بعد از مدتی
        setTimeout(() => {
          this.showMainMenu(interaction).catch(console.error);
        }, 3000);
      }
    } catch (error) {
      console.error("Error in AnonymousChatMenu.cancelChatSearch:", error);
      await interaction.reply({
        content: "❌ خطایی در لغو جستجو رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * نمایش چت فعال کاربر
   * @param interaction برهم‌کنش با کاربر
   */
  public static async viewActiveChat(interaction: MessageComponentInteraction) {
    try {
      const userId = interaction.user.id;
      const chat = this.findUserActiveChat(userId);
      
      if (!chat) {
        return await interaction.update({
          content: "⚠️ شما چت فعالی ندارید!",
          components: []
        });
      }
      
      // تعیین اینکه کاربر فعلی کدام طرف چت است
      const isUser1 = chat.user1Id === userId;
      
      // ایجاد Embed برای نمایش چت
      const chatEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('💬 چت ناشناس')
        .setDescription('شما در حال چت با یک کاربر ناشناس هستید.')
        .setThumbnail('https://img.icons8.com/fluency/48/anonymous-mask.png')
        .addFields(
          { name: '⏱️ زمان شروع', value: formatDate(chat.createdAt), inline: true },
          { name: '💬 تعداد پیام‌ها', value: `${chat.messages.length}`, inline: true }
        )
        .setFooter({ text: 'می‌توانید پیام خود را در چت بنویسید تا به طرف مقابل ارسال شود.' });
      
      // نمایش پیام‌های موجود
      if (chat.messages.length > 0) {
        let messagesText = '';
        
        // فقط 10 پیام آخر را نشان می‌دهیم
        const startIndex = Math.max(0, chat.messages.length - 10);
        
        for (let i = startIndex; i < chat.messages.length; i++) {
          const message = chat.messages[i];
          const isFromCurrentUser = (isUser1 && message.sender === 'user1') || 
                                (!isUser1 && message.sender === 'user2');
          
          if (isFromCurrentUser) {
            messagesText += `**شما**: ${message.content}\n`;
          } else {
            messagesText += `**ناشناس**: ${message.content}\n`;
          }
          
          // افزودن زمان پیام اگر آخرین پیام است
          if (i === chat.messages.length - 1) {
            messagesText += `_${formatRelativeTime(message.timestamp)}_\n`;
          }
        }
        
        // اگر پیام‌ها از 10 بیشتر بود، اشاره می‌کنیم
        if (chat.messages.length > 10) {
          chatEmbed.addFields({
            name: '💭 پیام‌ها',
            value: `*${chat.messages.length - 10} پیام قدیمی‌تر نمایش داده نمی‌شود*\n\n${messagesText}`
          });
        } else {
          chatEmbed.addFields({
            name: '💭 پیام‌ها',
            value: messagesText || '- هنوز پیامی ارسال نشده -'
          });
        }
      } else {
        chatEmbed.addFields({
          name: '💭 پیام‌ها',
          value: '- هنوز پیامی ارسال نشده -'
        });
      }
      
      // دکمه‌های عملیات
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('refresh_anonymous_chat')
            .setLabel('🔄 بروزرسانی')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('end_anonymous_chat')
            .setLabel('❌ پایان چت')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('reveal_identity')
            .setLabel('🔍 فاش کردن هویت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({
        embeds: [chatEmbed],
        components: [row]
      });
      
      // ایجاد کالکتور برای دریافت پیام‌های کاربر
      const filter = (m: any) => m.author.id === userId;
      const collector = interaction.channel?.createMessageCollector({ filter, time: 300000 }); // 5 دقیقه
      
      if (collector) {
        collector.on('collect', async (message) => {
          try {
            // حذف پیام کاربر برای حفظ محرمانگی
            if (message.deletable) {
              await message.delete().catch(() => {});
            }
            
            // بررسی وضعیت چت
            const currentChat = this.findUserActiveChat(userId);
            if (!currentChat || currentChat.status !== 'active') {
              collector.stop();
              return;
            }
            
            // افزودن پیام به چت
            const newMessage = {
              sender: isUser1 ? 'user1' : 'user2',
              content: message.content,
              timestamp: new Date().toISOString()
            };
            
            currentChat.messages.push(newMessage);
            currentChat.lastMessageAt = newMessage.timestamp;
            
            // بروزرسانی چت در مپ
            this.activeChats.set(currentChat.chatId, currentChat);
            
            // ارسال پاسخ تأیید به کاربر
            const confirmEmbed = new EmbedBuilder()
              .setColor('#2ECC71')
              .setTitle('✅ پیام ارسال شد')
              .setDescription(`پیام شما با موفقیت به طرف مقابل ارسال شد.`)
              .addFields(
                { name: '💬 پیام شما', value: message.content }
              );
            
            const refreshRow = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('refresh_anonymous_chat')
                  .setLabel('🔄 بروزرسانی چت')
                  .setStyle(ButtonStyle.Primary)
              );
            
            // ارسال تأیید به کاربر
            await interaction.followUp({
              embeds: [confirmEmbed],
              components: [refreshRow],
              ephemeral: true
            });
            
            // تلاش برای اطلاع‌رسانی به کاربر مقابل
            try {
              const otherUserId = isUser1 ? currentChat.user2Id : currentChat.user1Id;
              const guild = interaction.guild;
              const member = guild?.members.cache.get(otherUserId);
              
              if (member) {
                const notificationEmbed = new EmbedBuilder()
                  .setColor('#5865F2')
                  .setTitle('💬 پیام جدید در چت ناشناس')
                  .setDescription('شما یک پیام جدید در چت ناشناس دریافت کرده‌اید!')
                  .addFields(
                    { name: '💭 پیام', value: message.content }
                  );
                
                const notificationRow = new ActionRowBuilder<ButtonBuilder>()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('view_anonymous_chat')
                      .setLabel('💬 مشاهده چت')
                      .setStyle(ButtonStyle.Primary)
                  );
                
                try {
                  await member.send({
                    embeds: [notificationEmbed],
                    components: [notificationRow]
                  });
                } catch (dmError) {
                  console.log(`Could not send DM to chat partner: ${otherUserId}`);
                }
              }
            } catch (notifyError) {
              console.error("Error notifying chat partner:", notifyError);
            }
          } catch (error) {
            console.error("Error processing chat message:", error);
          }
        });
        
        // وقتی زمان کالکتور تمام شد
        collector.on('end', () => {
          // می‌توانیم بعد از اتمام زمان کالکتور، اطلاع‌رسانی کنیم یا عملیات دیگری انجام دهیم
        });
        
        // ذخیره کالکتور فعال
        global.anonymousChatCollectors = global.anonymousChatCollectors || {};
        global.anonymousChatCollectors[userId] = collector;
      }
    } catch (error) {
      console.error("Error in AnonymousChatMenu.viewActiveChat:", error);
      await interaction.reply({
        content: "❌ خطایی در نمایش چت رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * پایان دادن به چت فعال
   * @param interaction برهم‌کنش با کاربر
   */
  public static async endActiveChat(interaction: MessageComponentInteraction) {
    try {
      const userId = interaction.user.id;
      const chat = this.findUserActiveChat(userId);
      
      if (!chat) {
        return await interaction.update({
          content: "⚠️ شما چت فعالی ندارید!",
          components: []
        });
      }
      
      // متوقف کردن کالکتور پیام‌ها
      if (global.anonymousChatCollectors && global.anonymousChatCollectors[userId]) {
        global.anonymousChatCollectors[userId].stop();
        delete global.anonymousChatCollectors[userId];
      }
      
      // تغییر وضعیت چت به پایان یافته
      chat.status = 'ended';
      
      // حذف چت از لیست چت‌های فعال
      this.activeChats.delete(chat.chatId);
      
      // ایجاد Embed برای پایان چت
      const endEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('❌ چت پایان یافت')
        .setDescription('شما به چت ناشناس پایان دادید.')
        .setThumbnail('https://img.icons8.com/fluency/48/cancel.png')
        .addFields(
          { name: '⏱️ مدت چت', value: `از ${formatDate(chat.createdAt)} تا کنون`, inline: true },
          { name: '💬 تعداد پیام‌ها', value: `${chat.messages.length}`, inline: true }
        );
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('start_anonymous_chat')
            .setLabel('🔄 شروع چت جدید')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('anonymous_chat_menu')
            .setLabel('🔙 بازگشت به منوی چت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({
        embeds: [endEmbed],
        components: [row]
      });
      
      // اطلاع‌رسانی به کاربر مقابل
      try {
        const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
        const guild = interaction.guild;
        const member = guild?.members.cache.get(otherUserId);
        
        if (member) {
          const partnerEndEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ چت پایان یافت')
            .setDescription('کاربر ناشناس به چت پایان داد.')
            .setThumbnail('https://img.icons8.com/fluency/48/cancel.png')
            .addFields(
              { name: '⏱️ مدت چت', value: `از ${formatDate(chat.createdAt)} تا کنون`, inline: true },
              { name: '💬 تعداد پیام‌ها', value: `${chat.messages.length}`, inline: true }
            );
          
          const partnerRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('start_anonymous_chat')
                .setLabel('🔄 شروع چت جدید')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('anonymous_chat_menu')
                .setLabel('🔙 بازگشت به منوی چت')
                .setStyle(ButtonStyle.Secondary)
            );
          
          try {
            await member.send({
              embeds: [partnerEndEmbed],
              components: [partnerRow]
            });
          } catch (dmError) {
            console.log(`Could not send DM to chat partner: ${otherUserId}`);
          }
          
          // متوقف کردن کالکتور پیام‌های کاربر مقابل
          if (global.anonymousChatCollectors && global.anonymousChatCollectors[otherUserId]) {
            global.anonymousChatCollectors[otherUserId].stop();
            delete global.anonymousChatCollectors[otherUserId];
          }
        }
      } catch (notifyError) {
        console.error("Error notifying chat partner about end:", notifyError);
      }
    } catch (error) {
      console.error("Error in AnonymousChatMenu.endActiveChat:", error);
      await interaction.reply({
        content: "❌ خطایی در پایان دادن به چت رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * فاش کردن هویت در چت ناشناس
   * @param interaction برهم‌کنش با کاربر
   */
  public static async revealIdentity(interaction: MessageComponentInteraction) {
    try {
      const userId = interaction.user.id;
      const chat = this.findUserActiveChat(userId);
      
      if (!chat) {
        return await interaction.update({
          content: "⚠️ شما چت فعالی ندارید!",
          components: []
        });
      }
      
      // ایجاد Embed برای تأیید فاش کردن هویت
      const confirmEmbed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('⚠️ فاش کردن هویت')
        .setDescription('آیا مطمئن هستید که می‌خواهید هویت خود را برای کاربر مقابل فاش کنید؟')
        .setThumbnail('https://img.icons8.com/fluency/48/info.png')
        .addFields(
          { name: '🔍 مزایا', value: 'امکان ارسال درخواست دوستی و ادامه ارتباط به صورت عادی', inline: true },
          { name: '⚠️ توجه', value: 'این عمل غیرقابل بازگشت است!', inline: true }
        );
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('confirm_reveal_identity')
            .setLabel('✅ بله، هویتم فاش شود')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('view_anonymous_chat')
            .setLabel('❌ خیر، بازگشت به چت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({
        embeds: [confirmEmbed],
        components: [row]
      });
    } catch (error) {
      console.error("Error in AnonymousChatMenu.revealIdentity:", error);
      await interaction.reply({
        content: "❌ خطایی در فرآیند فاش کردن هویت رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * تأیید فاش کردن هویت در چت ناشناس
   * @param interaction برهم‌کنش با کاربر
   */
  public static async confirmRevealIdentity(interaction: MessageComponentInteraction) {
    try {
      const userId = interaction.user.id;
      const user = await storage.getUserByDiscordId(userId);
      const chat = this.findUserActiveChat(userId);
      
      if (!chat || !user) {
        return await interaction.update({
          content: "⚠️ شما چت فعالی ندارید یا حساب کاربری شما یافت نشد!",
          components: []
        });
      }
      
      // تعیین هویت کاربر و کاربر مقابل
      const isUser1 = chat.user1Id === userId;
      const otherUserId = isUser1 ? chat.user2Id : chat.user1Id;
      
      // دریافت اطلاعات کاربر مقابل
      const otherUser = await storage.getUserByDiscordId(otherUserId);
      
      if (!otherUser) {
        return await interaction.update({
          content: "⚠️ اطلاعات کاربر مقابل یافت نشد!",
          components: []
        });
      }
      
      // ایجاد Embed برای تأیید فاش شدن هویت
      const revealedEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔍 هویت شما فاش شد')
        .setDescription(`شما هویت خود را برای طرف مقابل فاش کردید. اکنون او می‌تواند شما را به عنوان دوست اضافه کند.`)
        .setThumbnail(interaction.user.displayAvatarURL() || 'https://img.icons8.com/fluency/48/user.png')
        .addFields(
          { name: '👤 هویت شما', value: `${user.username}`, inline: true },
          { name: '👤 هویت طرف مقابل', value: otherUser.username, inline: true }
        );
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`send_friend_request_${otherUser.id}`)
            .setLabel('➕ ارسال درخواست دوستی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('view_anonymous_chat')
            .setLabel('💬 بازگشت به چت')
            .setStyle(ButtonStyle.Primary)
        );
      
      await interaction.update({
        embeds: [revealedEmbed],
        components: [row]
      });
      
      // اطلاع‌رسانی به کاربر مقابل
      try {
        const guild = interaction.guild;
        const member = guild?.members.cache.get(otherUserId);
        
        if (member) {
          const otherUserEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔍 هویت طرف مقابل فاش شد')
            .setDescription(`کاربر ناشناس در چت، هویت خود را فاش کرد.`)
            .setThumbnail(interaction.user.displayAvatarURL() || 'https://img.icons8.com/fluency/48/user.png')
            .addFields(
              { name: '👤 هویت فاش شده', value: `${user.username}`, inline: true }
            );
          
          const otherUserRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`send_friend_request_${user.id}`)
                .setLabel('➕ ارسال درخواست دوستی')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('view_anonymous_chat')
                .setLabel('💬 بازگشت به چت')
                .setStyle(ButtonStyle.Primary)
            );
          
          try {
            await member.send({
              embeds: [otherUserEmbed],
              components: [otherUserRow]
            });
          } catch (dmError) {
            console.log(`Could not send DM to chat partner: ${otherUserId}`);
          }
        }
      } catch (notifyError) {
        console.error("Error notifying chat partner about identity reveal:", notifyError);
      }
    } catch (error) {
      console.error("Error in AnonymousChatMenu.confirmRevealIdentity:", error);
      await interaction.reply({
        content: "❌ خطایی در فاش کردن هویت رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * بروزرسانی نمایش چت
   * @param interaction برهم‌کنش با کاربر
   */
  public static async refreshChat(interaction: MessageComponentInteraction) {
    try {
      // استفاده از همان متد viewActiveChat برای بروزرسانی
      await this.viewActiveChat(interaction);
    } catch (error) {
      console.error("Error in AnonymousChatMenu.refreshChat:", error);
      await interaction.reply({
        content: "❌ خطایی در بروزرسانی چت رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * یافتن چت فعال کاربر
   * @param userId شناسه کاربر
   */
  private static findUserActiveChat(userId: string): AnonymousChat | undefined {
    for (const [_, chat] of this.activeChats) {
      if ((chat.user1Id === userId || chat.user2Id === userId) && chat.status === 'active') {
        return chat;
      }
    }
    
    return undefined;
  }
  
  /**
   * مدیریت تعاملات با منوی چت ناشناس
   * @param interaction برهم‌کنش با کاربر
   */
  public static async handleInteraction(interaction: MessageComponentInteraction) {
    try {
      const customId = interaction.customId;
      
      switch (customId) {
        case 'anonymous_chat_menu':
          await this.showMainMenu(interaction);
          break;
        
        case 'start_anonymous_chat':
          await this.startChatSearch(interaction);
          break;
        
        case 'cancel_anonymous_wait':
          await this.cancelChatSearch(interaction);
          break;
        
        case 'view_anonymous_chat':
          await this.viewActiveChat(interaction);
          break;
        
        case 'end_anonymous_chat':
          await this.endActiveChat(interaction);
          break;
        
        case 'reveal_identity':
          await this.revealIdentity(interaction);
          break;
        
        case 'confirm_reveal_identity':
          await this.confirmRevealIdentity(interaction);
          break;
        
        case 'refresh_anonymous_chat':
          await this.refreshChat(interaction);
          break;
        
        default:
          // برای سایر تعاملات، می‌توانیم به منوی اصلی برگردیم
          if (customId.startsWith('anonymous_')) {
            await this.showMainMenu(interaction);
          }
          break;
      }
    } catch (error) {
      console.error("Error in AnonymousChatMenu.handleInteraction:", error);
      await interaction.reply({
        content: "❌ خطایی در پردازش تعامل رخ داد! لطفاً دوباره تلاش کنید.",
        ephemeral: true
      });
    }
  }
  
  /**
   * پاکسازی چت‌های قدیمی و کاربران منتظر
   * این متد می‌تواند به صورت دوره‌ای اجرا شود
   */
  public static cleanupOldChats() {
    try {
      const now = new Date();
      
      // پاکسازی کاربران در انتظار بیش از 30 دقیقه
      for (const [userId, waitTime] of this.waitingUsers) {
        const waitMinutes = (now.getTime() - waitTime.getTime()) / (1000 * 60);
        
        if (waitMinutes > 30) {
          this.waitingUsers.delete(userId);
          console.log(`Removed user ${userId} from waiting queue after 30 minutes`);
        }
      }
      
      // پاکسازی چت‌های بی‌تحرک بیش از 2 ساعت
      for (const [chatId, chat] of this.activeChats) {
        const lastMessageDate = chat.lastMessageAt ? new Date(chat.lastMessageAt) : new Date(chat.createdAt);
        const inactiveHours = (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60);
        
        if (inactiveHours > 2) {
          this.activeChats.delete(chatId);
          chat.status = 'ended';
          console.log(`Ended inactive chat ${chatId} after 2 hours of inactivity`);
          
          // می‌توان به کاربران اطلاع داد که چت به دلیل عدم فعالیت پایان یافته است
        }
      }
    } catch (error) {
      console.error("Error in AnonymousChatMenu.cleanupOldChats:", error);
    }
  }
}

// تعریف یک تایمر برای پاکسازی دوره‌ای
// هر 30 دقیقه یکبار چت‌های قدیمی و کاربران منتظر پاکسازی می‌شوند
setInterval(() => {
  AnonymousChatMenu.cleanupOldChats();
}, 30 * 60 * 1000);

// تعریف اینترفیس AnonymousChat برای استفاده در کلاس
interface AnonymousMessage {
  sender: 'user1' | 'user2';
  content: string;
  timestamp: string;
}

interface AnonymousChat {
  chatId: string;
  user1Id: string;
  user2Id: string;
  messages: AnonymousMessage[];
  createdAt: string;
  status: 'active' | 'ended';
  lastMessageAt: string;
}