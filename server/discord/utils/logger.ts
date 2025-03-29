import {
  Client, 
  TextChannel, 
  EmbedBuilder, 
  ColorResolvable,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType
} from 'discord.js';

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

// LogType enum for channel types
export enum LogType {
  SYSTEM = 'system',
  ECONOMY = 'economy',
  ADMIN = 'admin',
  ERROR = 'error',
  GAME = 'game',
  USER = 'user',
  CLAN = 'clan',
  QUEST = 'quest',
  MODERATION = 'moderation'
}

/**
 * ثبت و نمایش لاگ‌ها
 * @param message پیام لاگ
 * @param level سطح لاگ
 */
export function log(message: string, level: LogLevel = 'info'): void {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  let prefix = '';
  switch (level) {
    case 'info':
      prefix = '\x1b[36m[info]\x1b[0m'; // Cyan
      break;
    case 'success':
      prefix = '\x1b[32m[success]\x1b[0m'; // Green
      break;
    case 'warn':
      prefix = '\x1b[33m[warn]\x1b[0m'; // Yellow
      break;
    case 'error':
      prefix = '\x1b[31m[error]\x1b[0m'; // Red
      break;
    case 'debug':
      prefix = '\x1b[35m[debug]\x1b[0m'; // Magenta
      break;
  }

  console.log(`${timestamp} ${prefix} ${message}`);
}

/**
 * Discord Logger Class
 * این کلاس برای ارسال لاگ‌ها به کانال‌های دیسکورد استفاده می‌شود
 */
class DiscordLogger {
  private client: Client;
  private channelMap: Map<LogType, string> = new Map();
  private defaultChannelId: string | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * تنظیم کانال پیش‌فرض برای لاگ‌ها
   * @param channelId شناسه کانال دیسکورد
   */
  setDefaultChannel(channelId: string): void {
    this.defaultChannelId = channelId;
    log(`Default log channel set to ${channelId}`, 'info');
  }

  /**
   * تنظیم کانال‌های مختلف برای انواع لاگ
   * @param channels نگاشت نوع لاگ به شناسه کانال
   */
  setChannels(channels: Partial<Record<LogType, string>>): void {
    for (const [type, channelId] of Object.entries(channels)) {
      this.channelMap.set(type as LogType, channelId);
      log(`Log channel for ${type} set to ${channelId}`, 'info');
    }
  }

  /**
   * Get channel for log type
   * @param type نوع لاگ
   * @returns کانال متنی یا null
   */
  private getChannel(type: LogType): TextChannel | null {
    try {
      // First try to get the specific channel for this type
      const specificChannelId = this.channelMap.get(type);
      if (specificChannelId) {
        const channel = this.client.channels.cache.get(specificChannelId);
        if (channel && channel.isTextBased() && !channel.isDMBased()) {
          return channel as TextChannel;
        }
      }

      // Fallback to default channel
      if (this.defaultChannelId) {
        const channel = this.client.channels.cache.get(this.defaultChannelId);
        if (channel && channel.isTextBased() && !channel.isDMBased()) {
          return channel as TextChannel;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting log channel:', error);
      return null;
    }
  }

  /**
   * ثبت اقدام ادمین در سیستم
   * @param adminId شناسه ادمین
   * @param adminName نام ادمین
   * @param action عملیات انجام شده
   * @param targetId شناسه هدف (اختیاری)
   * @param targetName نام هدف (اختیاری)
   * @param details جزئیات بیشتر (اختیاری)
   */
  logAdminAction(
    adminId: string, 
    adminName: string, 
    action: string, 
    targetId?: string, 
    targetName?: string, 
    details?: string
  ): void {
    const channel = this.getChannel(LogType.ADMIN);
    if (!channel) {
      log(`No admin log channel configured, action not logged: ${action}`, 'warn');
      return;
    }

    const logEmbed = new EmbedBuilder()
      .setColor('#FF9900' as ColorResolvable)
      .setTitle('🛡️ Admin Action Log')
      .setDescription(`Admin **${adminName}** performed action: **${action}**`)
      .addFields(
        { name: 'Admin ID', value: adminId, inline: true }
      )
      .setTimestamp();

    if (targetId && targetName) {
      logEmbed.addFields(
        { name: 'Target', value: targetName, inline: true },
        { name: 'Target ID', value: targetId, inline: true }
      );
    }

    if (details) {
      logEmbed.addFields({ name: 'Details', value: details, inline: false });
    }

    // Generate a unique ID for this log entry
    const logId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Add a button to view more details (if needed in the future)
    const detailsButton = new ButtonBuilder()
      .setCustomId(`log_details_${logId}`)
      .setLabel('View Details')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔍');
    
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(detailsButton);

    channel.send({ embeds: [logEmbed], components: [row] })
      .catch(error => {
        console.error('Failed to send admin log to Discord channel:', error);
      });
    
    // Also log to console
    log(`ADMIN ACTION: ${adminName} (${adminId}) performed ${action}${targetId ? ` on ${targetName} (${targetId})` : ''}${details ? `: ${details}` : ''}`, 'info');
  }

  /**
   * ثبت لاگ سیستم
   * @param title عنوان
   * @param description توضیحات
   * @param fields فیلدهای اضافی
   */
  logSystem(
    title: string,
    description: string,
    fields?: Array<{ name: string; value: string; inline?: boolean }>
  ): void {
    const channel = this.getChannel(LogType.SYSTEM);
    if (!channel) {
      log(`No system log channel configured, log not sent: ${title}`, 'warn');
      return;
    }

    const logEmbed = new EmbedBuilder()
      .setColor('#3498db' as ColorResolvable)
      .setTitle(`🖥️ ${title}`)
      .setDescription(description)
      .setTimestamp();

    if (fields && fields.length > 0) {
      logEmbed.addFields(...fields);
    }

    channel.send({ embeds: [logEmbed] })
      .catch(error => {
        console.error('Failed to send system log to Discord channel:', error);
      });

    // Also log to console
    log(`SYSTEM: ${title} - ${description}`, 'info');
  }

  /**
   * ثبت لاگ اقتصادی
   * @param userId شناسه کاربر
   * @param username نام کاربر
   * @param action عملیات انجام شده
   * @param amount مقدار
   * @param details جزئیات بیشتر
   */
  logEconomy(
    userId: string,
    username: string,
    action: string,
    amount: number,
    details?: string
  ): void {
    const channel = this.getChannel(LogType.ECONOMY);
    if (!channel) {
      log(`No economy log channel configured, log not sent: ${action}`, 'warn');
      return;
    }

    const isPositive = amount >= 0;
    const logEmbed = new EmbedBuilder()
      .setColor(isPositive ? '#2ecc71' : '#e74c3c' as ColorResolvable)
      .setTitle('💰 Economy Transaction')
      .setDescription(`**${username}** ${action}`)
      .addFields(
        { name: 'User ID', value: userId, inline: true },
        { name: 'Amount', value: `${isPositive ? '+' : ''}${amount.toLocaleString()} Ccoin`, inline: true }
      )
      .setTimestamp();

    if (details) {
      logEmbed.addFields({ name: 'Details', value: details, inline: false });
    }

    channel.send({ embeds: [logEmbed] })
      .catch(error => {
        console.error('Failed to send economy log to Discord channel:', error);
      });

    // Also log to console
    log(`ECONOMY: ${username} (${userId}) ${action} ${isPositive ? '+' : ''}${amount} Ccoin${details ? ` - ${details}` : ''}`, 'info');
  }

  /**
   * ثبت لاگ خطا
   * @param title عنوان خطا
   * @param error خطای رخ داده
   * @param source منبع خطا
   */
  logError(
    title: string,
    error: Error | string,
    source?: string
  ): void {
    const channel = this.getChannel(LogType.ERROR);
    if (!channel) {
      log(`No error log channel configured, error not sent: ${title}`, 'warn');
      return;
    }

    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : null;

    const logEmbed = new EmbedBuilder()
      .setColor('#e74c3c' as ColorResolvable)
      .setTitle(`❌ ${title}`)
      .setDescription(`\`\`\`\n${errorMessage}\n\`\`\``)
      .setTimestamp();

    if (source) {
      logEmbed.addFields({ name: 'Source', value: source, inline: false });
    }

    if (errorStack) {
      // Truncate stack trace if too long
      const truncatedStack = errorStack.length > 1000 
        ? errorStack.substring(0, 997) + '...' 
        : errorStack;
      
      logEmbed.addFields({ 
        name: 'Stack Trace', 
        value: `\`\`\`\n${truncatedStack}\n\`\`\``, 
        inline: false 
      });
    }

    channel.send({ embeds: [logEmbed] })
      .catch(error => {
        console.error('Failed to send error log to Discord channel:', error);
      });

    // Always log errors to console
    log(`ERROR: ${title} - ${errorMessage}`, 'error');
    if (errorStack) {
      console.error(errorStack);
    }
  }

  /**
   * ثبت لاگ بازی
   * @param gameType نوع بازی
   * @param action عملیات انجام شده
   * @param playerName نام بازیکن
   * @param playerId شناسه بازیکن
   * @param details جزئیات بیشتر
   */
  logGame(
    gameType: string,
    action: string,
    playerName: string,
    playerId: string,
    details?: string
  ): void {
    const channel = this.getChannel(LogType.GAME);
    if (!channel) {
      log(`No game log channel configured, log not sent: ${gameType} ${action}`, 'warn');
      return;
    }

    const logEmbed = new EmbedBuilder()
      .setColor('#9b59b6' as ColorResolvable)
      .setTitle(`🎮 Game Activity: ${gameType}`)
      .setDescription(`**${playerName}** ${action}`)
      .addFields(
        { name: 'Player ID', value: playerId, inline: true },
        { name: 'Game', value: gameType, inline: true }
      )
      .setTimestamp();

    if (details) {
      logEmbed.addFields({ name: 'Details', value: details, inline: false });
    }

    channel.send({ embeds: [logEmbed] })
      .catch(error => {
        console.error('Failed to send game log to Discord channel:', error);
      });

    // Also log to console
    log(`GAME: ${gameType} - ${playerName} (${playerId}) ${action}${details ? ` - ${details}` : ''}`, 'info');
  }
}

/**
 * Get a Discord logger instance
 * @param client Discord.js client instance
 * @returns DiscordLogger instance
 */
export function getLogger(client: Client): DiscordLogger {
  return new DiscordLogger(client);
}