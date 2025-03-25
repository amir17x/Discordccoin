import { MessageComponentInteraction, ButtonInteraction } from 'discord.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { storage } from '../../storage';
import { NotificationSettings, NotificationType } from '../../../shared/schema';

/**
 * سیستم اعلان‌های شخصی Ccoin
 * این سیستم با هوش مصنوعی لوکال برای بهینه‌سازی اعلان‌ها استفاده می‌شود
 */
export async function personalNotificationsMenu(
  interaction: MessageComponentInteraction
) {
  try {
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return await interaction.reply({
        content: '❌ شما هنوز در سیستم ثبت نشده‌اید! لطفاً ابتدا با دستور `/start` ثبت نام کنید.',
        ephemeral: true
      });
    }

    // دریافت تنظیمات اعلان‌های کاربر
    const notificationSettings = await storage.getUserNotificationSettings(userId);
    const isEnabled = notificationSettings?.enabled ?? true;

    // ساخت امبد منوی اصلی
    const embed = new EmbedBuilder()
      .setColor(isEnabled ? '#2ecc71' : '#e74c3c')
      .setTitle('🔔 مدیریت اعلان‌های شخصی')
      .setDescription(`سلام ${user.username}! در این بخش می‌توانید اعلان‌های شخصی خود را مدیریت کنید. 🌟\n\n**وضعیت فعلی:** اعلان‌ها ${isEnabled ? '**فعال**' : '**غیرفعال**'} هستند.\n\n🧠 **هوش مصنوعی لوکال** اعلان‌ها را بر اساس رفتار شما بهینه می‌کند!`)
      .setFooter({ text: 'Ccoin Notifications System v2.0', iconURL: interaction.client.user?.displayAvatarURL() })
      .setTimestamp();

    // ساخت دکمه‌ها
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('enable_notifications')
        .setLabel('فعال کردن اعلان‌ها')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔔')
        .setDisabled(isEnabled),
      new ButtonBuilder()
        .setCustomId('disable_notifications')
        .setLabel('غیرفعال کردن اعلان‌ها')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔕')
        .setDisabled(!isEnabled),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('notification_settings')
        .setLabel('تنظیمات پیشرفته')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⚙️'),
      new ButtonBuilder()
        .setCustomId('test_notification')
        .setLabel('ارسال اعلان آزمایشی')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🧪')
        .setDisabled(!isEnabled),
    );
    
    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('main_menu')
        .setLabel('بازگشت به منو')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔙'),
    );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2, row3],
      ephemeral: true
    });

  } catch (error) {
    console.error('خطا در منوی اعلان‌های شخصی:', error);
    await interaction.reply({
      content: '❌ متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * تغییر وضعیت فعال/غیرفعال بودن اعلان‌ها
 */
export async function toggleNotifications(
  interaction: ButtonInteraction,
  enable: boolean
) {
  try {
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return await interaction.reply({
        content: '❌ شما هنوز در سیستم ثبت نشده‌اید!',
        ephemeral: true
      });
    }

    // به‌روزرسانی تنظیمات اعلان‌ها
    await storage.updateUserNotificationSettings(userId, { enabled: enable });

    // ساخت امبد پاسخ
    const embed = new EmbedBuilder()
      .setColor(enable ? '#2ecc71' : '#e74c3c')
      .setTitle(enable ? '🔔 اعلان‌ها فعال شدند!' : '🔕 اعلان‌ها غیرفعال شدند!')
      .setDescription(enable ? 
        'از حالا به بعد اعلان‌های مهم را در پیام خصوصی دریافت می‌کنید. 😊\n\n🧠 هوش مصنوعی لوکال اعلان‌ها را بر اساس رفتار شما بهینه می‌کند!' : 
        'دیگر اعلان‌ها را دریافت نمی‌کنید. اگر خواستید می‌توانید دوباره فعالشان کنید! 😊')
      .setFooter({ text: 'Ccoin Notifications System v2.0', iconURL: interaction.client.user?.displayAvatarURL() })
      .setTimestamp();

    // ساخت دکمه بازگشت
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('notifications_menu')
        .setLabel('بازگشت به تنظیمات اعلان‌ها')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔙'),
    );

    await interaction.update({
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error('خطا در تغییر وضعیت اعلان‌ها:', error);
    await interaction.reply({
      content: '❌ متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * نمایش تنظیمات پیشرفته اعلان‌ها
 */
export async function showAdvancedNotificationSettings(
  interaction: ButtonInteraction
) {
  try {
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return await interaction.reply({
        content: '❌ شما هنوز در سیستم ثبت نشده‌اید!',
        ephemeral: true
      });
    }

    // دریافت تنظیمات اعلان‌های کاربر
    const settings = await storage.getUserNotificationSettings(userId);
    const notifyPrivateChat = settings?.notifyPrivateChat ?? true;
    const notifyAnonymousChat = settings?.notifyAnonymousChat ?? true;
    const notifyFriendRequest = settings?.notifyFriendRequest ?? true;
    const notifyEconomy = settings?.notifyEconomy ?? true;

    // ساخت امبد تنظیمات پیشرفته
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('⚙️ تنظیمات پیشرفته اعلان‌ها')
      .setDescription(`انتخاب کنید که چه اعلان‌هایی را می‌خواهید دریافت کنید:

💬 **چت خصوصی**: ${notifyPrivateChat ? '**فعال**' : '**غیرفعال**'}
🕵️‍♂️ **چت ناشناس**: ${notifyAnonymousChat ? '**فعال**' : '**غیرفعال**'}
📩 **درخواست دوستی**: ${notifyFriendRequest ? '**فعال**' : '**غیرفعال**'}
💰 **رویدادهای اقتصادی**: ${notifyEconomy ? '**فعال**' : '**غیرفعال**'}

🧠 **هوش مصنوعی لوکال** اعلان‌ها را بر اساس رفتار شما بهینه می‌کند!`)
      .setFooter({ text: 'Ccoin Notifications System v2.0', iconURL: interaction.client.user?.displayAvatarURL() })
      .setTimestamp();

    // ساخت دکمه‌های تنظیمات
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_private_chat')
        .setLabel('چت خصوصی')
        .setStyle(notifyPrivateChat ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji('💬'),
      new ButtonBuilder()
        .setCustomId('toggle_anonymous_chat')
        .setLabel('چت ناشناس')
        .setStyle(notifyAnonymousChat ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji('🕵️‍♂️'),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_friend_request')
        .setLabel('درخواست دوستی')
        .setStyle(notifyFriendRequest ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji('📩'),
      new ButtonBuilder()
        .setCustomId('toggle_economy')
        .setLabel('رویدادهای اقتصادی')
        .setStyle(notifyEconomy ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji('💰'),
    );

    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('notifications_menu')
        .setLabel('بازگشت')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔙'),
    );

    await interaction.update({
      embeds: [embed],
      components: [row1, row2, row3]
    });

  } catch (error) {
    console.error('خطا در نمایش تنظیمات پیشرفته اعلان‌ها:', error);
    await interaction.reply({
      content: '❌ متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * تغییر تنظیمات یک نوع اعلان خاص
 */
export async function toggleNotificationType(
  interaction: ButtonInteraction,
  notificationType: NotificationType
) {
  try {
    const userId = parseInt(interaction.user.id);
    
    // دریافت تنظیمات فعلی
    const settings = await storage.getUserNotificationSettings(userId) || {
      enabled: true, 
      notifyPrivateChat: true,
      notifyAnonymousChat: true,
      notifyFriendRequest: true,
      notifyEconomy: true
    };
    
    // تغییر تنظیمات مورد نظر
    let updatedSettings: Partial<NotificationSettings> = {};
    let notificationTypeName = '';
    
    switch (notificationType) {
      case 'private_chat':
        updatedSettings.notifyPrivateChat = !settings.notifyPrivateChat;
        notificationTypeName = 'چت خصوصی';
        break;
      case 'anonymous_chat':
        updatedSettings.notifyAnonymousChat = !settings.notifyAnonymousChat;
        notificationTypeName = 'چت ناشناس';
        break;
      case 'friend_request':
        updatedSettings.notifyFriendRequest = !settings.notifyFriendRequest;
        notificationTypeName = 'درخواست دوستی';
        break;
      case 'economy':
        updatedSettings.notifyEconomy = !settings.notifyEconomy;
        notificationTypeName = 'رویدادهای اقتصادی';
        break;
    }
    
    // به‌روزرسانی تنظیمات
    await storage.updateUserNotificationSettings(userId, updatedSettings);
    
    // تنظیمات به‌روز شده را دریافت کنیم
    const updatedSettingsFull = await storage.getUserNotificationSettings(userId);
    
    // ساخت امبد نتیجه تغییر
    let statusText = "";
    switch (notificationType) {
      case 'private_chat':
        statusText = updatedSettings.notifyPrivateChat ? 'فعال' : 'غیرفعال';
        break;
      case 'anonymous_chat':
        statusText = updatedSettings.notifyAnonymousChat ? 'فعال' : 'غیرفعال';
        break;
      case 'friend_request':
        statusText = updatedSettings.notifyFriendRequest ? 'فعال' : 'غیرفعال';
        break;
      case 'economy':
        statusText = updatedSettings.notifyEconomy ? 'فعال' : 'غیرفعال';
        break;
    }
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ تنظیمات به‌روزرسانی شد!')
      .setDescription(`اعلان‌های **${notificationTypeName}** ${statusText} شد.`)
      .setFooter({ text: 'Ccoin Notifications System v2.0', iconURL: interaction.client.user?.displayAvatarURL() })
      .setTimestamp();
    
    // دکمه بازگشت
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('notification_settings')
        .setLabel('بازگشت به تنظیمات پیشرفته')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔙'),
    );
    
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
    
    // بعد از 2 ثانیه به صفحه تنظیمات پیشرفته برمی‌گردیم
    setTimeout(async () => {
      try {
        await showAdvancedNotificationSettings(interaction);
      } catch (error) {
        console.error('خطا در بازگشت به صفحه تنظیمات پیشرفته:', error);
      }
    }, 2000);
    
  } catch (error) {
    console.error(`خطا در تغییر تنظیمات اعلان ${notificationType}:`, error);
    await interaction.reply({
      content: '❌ متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * ارسال یک اعلان به کاربر با هوش مصنوعی لوکال
 */
export async function sendNotification(
  userId: number,
  notificationType: NotificationType,
  message: string,
  relatedEntityId?: string
): Promise<boolean> {
  try {
    // بررسی تنظیمات اعلان‌های کاربر
    const settings = await storage.getUserNotificationSettings(userId);
    
    // اگر اعلان‌ها غیرفعال باشند، اعلانی ارسال نمی‌شود
    if (!settings || !settings.enabled) {
      return false;
    }
    
    // بررسی تنظیمات نوع اعلان خاص
    let notificationTypeEnabled = true;
    switch (notificationType) {
      case 'private_chat':
        notificationTypeEnabled = settings.notifyPrivateChat;
        break;
      case 'anonymous_chat':
        notificationTypeEnabled = settings.notifyAnonymousChat;
        break;
      case 'friend_request':
        notificationTypeEnabled = settings.notifyFriendRequest;
        break;
      case 'economy':
        notificationTypeEnabled = settings.notifyEconomy;
        break;
    }
    
    if (!notificationTypeEnabled) {
      return false;
    }
    
    // محاسبه اولویت اعلان با استفاده از هوش مصنوعی لوکال
    const priority = await calculateNotificationPriority(userId, notificationType, relatedEntityId);
    
    // اگر اولویت از حد آستانه کمتر باشد، اعلان ارسال نمی‌شود
    if (priority < 5) {
      console.log(`اعلان با اولویت ${priority} برای کاربر ${userId} ارسال نشد (اولویت پایین).`);
      return false;
    }
    
    // ثبت اعلان در دیتابیس
    await storage.saveNotification({
      userId,
      type: notificationType,
      message,
      priority,
      relatedEntityId,
      sent: false,
      timestamp: new Date()
    });
    
    // ارسال اعلان به کاربر
    const user = await storage.getUser(userId);
    if (!user) {
      return false;
    }
    
    try {
      // دسترسی به کلاینت دیسکورد
      // از کلاینت موجود در discord/client استفاده می‌کنیم 
      const { client } = await import('../../discord/client');
      const discordUser = await client.users.fetch(user.discordId);
      
      if (!discordUser) {
        return false;
      }
      
      // ساخت امبد اعلان
      const embed = new EmbedBuilder()
        .setColor(getNotificationColor(notificationType))
        .setTitle(getNotificationTitle(notificationType))
        .setDescription(message)
        .setTimestamp()
        .setFooter({ text: 'Ccoin Notifications System v2.0', iconURL: client.user?.displayAvatarURL() });
      
      // اضافه کردن آیکون مناسب برای هر نوع اعلان
      if (notificationType === 'private_chat') {
        embed.setThumbnail('https://i.imgur.com/XeyJ3EO.png'); // آیکون چت خصوصی
      } else if (notificationType === 'anonymous_chat') {
        embed.setThumbnail('https://i.imgur.com/9WcUyV6.png'); // آیکون چت ناشناس
      } else if (notificationType === 'friend_request') {
        embed.setThumbnail('https://i.imgur.com/KMz5WhZ.png'); // آیکون درخواست دوستی
      } else if (notificationType === 'economy') {
        embed.setThumbnail('https://i.imgur.com/c1ezPMZ.png'); // آیکون اقتصادی
      }
      
      // ارسال پیام خصوصی
      await discordUser.send({ embeds: [embed] }).catch(console.error);
      
      // به‌روزرسانی وضعیت ارسال اعلان در دیتابیس
      await storage.updateNotificationStatus(userId, notificationType, relatedEntityId);
      
      return true;
    } catch (error) {
      console.error('خطا در ارسال پیام به کاربر دیسکورد:', error);
      return false;
    }
  } catch (error) {
    console.error('خطا در ارسال اعلان:', error);
    return false;
  }
}

/**
 * محاسبه اولویت اعلان با استفاده از هوش مصنوعی لوکال
 */
async function calculateNotificationPriority(
  userId: number,
  notificationType: NotificationType,
  relatedEntityId?: string
): Promise<number> {
  try {
    // اولویت پایه بر اساس نوع اعلان
    let basePriority = 0;
    switch (notificationType) {
      case 'private_chat':
        basePriority = 3;
        break;
      case 'anonymous_chat':
        basePriority = 2;
        break;
      case 'friend_request':
        basePriority = 4;
        break;
      case 'economy':
        basePriority = 3;
        break;
    }
    
    // امتیاز تعامل با دوست (برای چت خصوصی و درخواست دوستی)
    let interactionScore = 0;
    if ((notificationType === 'private_chat' || notificationType === 'friend_request') && relatedEntityId) {
      const interactionCount = await storage.getUserInteractionCount(userId, relatedEntityId);
      interactionScore = Math.min(interactionCount / 10, 5);
    }
    
    // امتیاز تازگی تعامل
    let recencyScore = 0;
    if ((notificationType === 'private_chat' || notificationType === 'friend_request') && relatedEntityId) {
      const lastInteraction = await storage.getLastUserInteraction(userId, relatedEntityId);
      if (lastInteraction) {
        const daysSinceLastInteraction = Math.max(0, (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
        recencyScore = 5 - (daysSinceLastInteraction / 2);
        recencyScore = Math.max(0, Math.min(5, recencyScore)); // حداقل 0 و حداکثر 5
      }
    }
    
    // امتیاز فعالیت اقتصادی (برای رویدادهای اقتصادی)
    let economicScore = 0;
    if (notificationType === 'economy') {
      const economicActivity = await storage.getUserEconomicActivity(userId);
      economicScore = Math.min(economicActivity / 5, 5);
    }
    
    // محاسبه اولویت نهایی
    let priority = basePriority + interactionScore + recencyScore + economicScore;
    
    // تنظیم اولویت در محدوده 1 تا 10
    priority = Math.max(1, Math.min(10, priority));
    
    return Math.round(priority);
  } catch (error) {
    console.error('خطا در محاسبه اولویت اعلان:', error);
    return 5; // مقدار پیش‌فرض در صورت خطا
  }
}

/**
 * گرفتن رنگ مناسب برای هر نوع اعلان
 */
function getNotificationColor(type: NotificationType): number {
  switch (type) {
    case 'private_chat':
      return 0x3498db; // آبی
    case 'anonymous_chat':
      return 0x9b59b6; // بنفش
    case 'friend_request':
      return 0x2ecc71; // سبز
    case 'economy':
      return 0xf1c40f; // زرد
    default:
      return 0x95a5a6; // خاکستری
  }
}

/**
 * گرفتن عنوان مناسب برای هر نوع اعلان
 */
function getNotificationTitle(type: NotificationType): string {
  switch (type) {
    case 'private_chat':
      return '💬 پیام جدید در چت خصوصی';
    case 'anonymous_chat':
      return '🕵️‍♂️ پیام جدید در چت ناشناس';
    case 'friend_request':
      return '📩 درخواست دوستی جدید';
    case 'economy':
      return '💰 اعلان اقتصادی';
    default:
      return '🔔 اعلان جدید';
  }
}

/**
 * گرفتن متن وضعیت (فعال/غیرفعال) برای نمایش در پیام‌ها
 */
function getToggleStatusText(settings: Partial<NotificationSettings>, type: NotificationType): string {
  switch (type) {
    case 'private_chat':
      return settings.notifyPrivateChat ? 'فعال' : 'غیرفعال';
    case 'anonymous_chat':
      return settings.notifyAnonymousChat ? 'فعال' : 'غیرفعال';
    case 'friend_request':
      return settings.notifyFriendRequest ? 'فعال' : 'غیرفعال';
    case 'economy':
      return settings.notifyEconomy ? 'فعال' : 'غیرفعال';
    default:
      return 'نامشخص';
  }
}

/**
 * ارسال یک اعلان آزمایشی برای کاربر
 * این تابع برای تست سیستم اعلان‌ها استفاده می‌شود
 */
export async function sendTestNotification(interaction: ButtonInteraction) {
  try {
    const userId = parseInt(interaction.user.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return await interaction.reply({
        content: '❌ شما هنوز در سیستم ثبت نشده‌اید!',
        ephemeral: true
      });
    }

    // دریافت تنظیمات اعلان‌های کاربر
    const settings = await storage.getUserNotificationSettings(userId);
    
    if (!settings || !settings.enabled) {
      return await interaction.reply({
        content: '⚠️ اعلان‌های شما غیرفعال است! ابتدا باید اعلان‌ها را فعال کنید.',
        ephemeral: true
      });
    }
    
    // ارسال اعلان تستی برای هر نوع اعلان که فعال است
    const notificationTypes: NotificationType[] = ['private_chat', 'anonymous_chat', 'friend_request', 'economy'];
    const enabledTypes = notificationTypes.filter(type => {
      switch (type) {
        case 'private_chat': return settings.notifyPrivateChat;
        case 'anonymous_chat': return settings.notifyAnonymousChat;
        case 'friend_request': return settings.notifyFriendRequest;
        case 'economy': return settings.notifyEconomy;
        default: return false;
      }
    });
    
    if (enabledTypes.length === 0) {
      return await interaction.reply({
        content: '⚠️ شما هیچ نوع اعلانی را فعال نکرده‌اید! ابتدا باید حداقل یک نوع اعلان را فعال کنید.',
        ephemeral: true
      });
    }
    
    // ارسال یک اعلان آزمایشی از نوع اول فعال
    const testType = enabledTypes[0];
    const testMessage = `🧪 این یک اعلان آزمایشی از نوع "${getNotificationTitle(testType)}" است. اگر این پیام را می‌بینید، سیستم اعلان‌های شما به درستی کار می‌کند! 🎉`;
    
    await sendNotification(userId, testType, testMessage, 'test_notification');
    
    // پاسخ به کاربر
    await interaction.reply({
      content: `✅ یک اعلان آزمایشی از نوع "${getNotificationTitle(testType)}" برای شما ارسال شد. لطفاً پیام‌های خصوصی خود را بررسی کنید.`,
      ephemeral: true
    });
    
  } catch (error) {
    console.error('خطا در ارسال اعلان آزمایشی:', error);
    await interaction.reply({
      content: '❌ متأسفانه خطایی در ارسال اعلان آزمایشی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}