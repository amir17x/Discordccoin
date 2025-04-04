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
 * Log and display messages with category prefixes and emojis
 * @param message Log message
 * @param level Log level
 * @param category Optional category for grouping related logs
 */
export function log(message: string, level: LogLevel = 'info', category?: string): void {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  // Color and emoji mapping for log levels
  const levelConfig = {
    'info': { color: '\x1b[36m', emoji: '📝' },     // Cyan
    'success': { color: '\x1b[32m', emoji: '✅' },  // Green
    'warn': { color: '\x1b[33m', emoji: '⚠️' },     // Yellow
    'error': { color: '\x1b[31m', emoji: '❌' },    // Red
    'debug': { color: '\x1b[35m', emoji: '🔍' }     // Magenta
  };
  
  // Category emoji mapping
  const categoryEmoji = category ? getCategoryEmoji(category) : '';
  
  // Format: [Time] [Emoji+Level] [CategoryEmoji+Category] Message
  const prefix = `${levelConfig[level].color}[${levelConfig[level].emoji} ${level}]\x1b[0m`;
  const categoryPrefix = category ? ` ${categoryEmoji} [${category}]` : '';
  
  console.log(`${timestamp} ${prefix}${categoryPrefix} ${message}`);
}

/**
 * Get appropriate emoji for log category
 * @param category Log category name
 * @returns Emoji character representing the category
 */
function getCategoryEmoji(category: string): string {
  const categoryMap: Record<string, string> = {
    'startup': '🚀',
    'shutdown': '🛑',
    'discord': '💬',
    'ai': '🤖',
    'economy': '💰',
    'bank': '🏦',
    'game': '🎮',
    'mafia': '🎭',
    'werewolf': '🐺',
    'secret_spy': '🕵️',
    'truth_or_dare': '🎯',
    'word_chain': '🔤',
    'bingo': '🎲',
    'duel': '⚔️',
    'robbery': '💰',
    'user': '👤',
    'clan': '🛡️',
    'admin': '👑',
    'stock': '📈',
    'transaction': '💸',
    'job': '💼',
    'quest': '📜',
    'inventory': '🎒',
    'friend': '👥',
    'moderation': '🔨',
    'command': '⌨️',
    'api': '🌐',
    'database': '🗃️'
  };
  
  return categoryMap[category.toLowerCase()] || '🔹';
}

/**
 * Discord Logger Class
 * Sends logs to Discord channels with categorized formatting and emojis
 */
class DiscordLogger {
  private client: Client;
  private channelMap: Map<LogType, string> = new Map();
  private defaultChannelId: string | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Set default channel for logs
   * @param channelId Discord channel ID
   */
  setDefaultChannel(channelId: string): void {
    this.defaultChannelId = channelId;
    log(`Default log channel set to ${channelId}`, 'info', 'config');
  }

  /**
   * Set different channels for log types
   * @param channels Mapping of log type to channel ID
   */
  setChannels(channels: Partial<Record<LogType, string>>): void {
    for (const [type, channelId] of Object.entries(channels)) {
      this.channelMap.set(type as LogType, channelId);
      log(`Log channel for ${type} set to ${channelId}`, 'info', 'config');
    }
  }

  /**
   * Get channel for log type
   * @param type Log type
   * @returns Text channel or null
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
   * Log admin actions in the system
   * @param adminId Admin's ID
   * @param adminName Admin's name
   * @param action Action performed
   * @param targetId Target ID (optional)
   * @param targetName Target name (optional)
   * @param details Additional details (optional)
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
      log(`No admin log channel configured, action not logged: ${action}`, 'warn', 'admin');
      return;
    }

    const logEmbed = new EmbedBuilder()
      .setColor('#FF9900' as ColorResolvable)
      .setTitle('👑 Admin Action Log')
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
    log(`Admin ${adminName} (${adminId}) performed ${action}${targetId ? ` on ${targetName} (${targetId})` : ''}${details ? `: ${details}` : ''}`, 'info', 'admin');
  }

  /**
   * Log system information
   * @param title Title of the log
   * @param description Description/details
   * @param fields Additional fields for the embed
   */
  logSystem(
    title: string,
    description: string,
    fields?: Array<{ name: string; value: string; inline?: boolean }>
  ): void {
    const channel = this.getChannel(LogType.SYSTEM);
    if (!channel) {
      log(`No system log channel configured, log not sent: ${title}`, 'warn', 'system');
      return;
    }

    const logEmbed = new EmbedBuilder()
      .setColor('#3498db' as ColorResolvable)
      .setTitle(`🚀 ${title}`)
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
    log(`${title} - ${description}`, 'info', 'system');
  }

  /**
   * Log economic transactions
   * @param userId User's ID
   * @param username User's name
   * @param action Action performed
   * @param amount Transaction amount
   * @param details Additional details (optional)
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
      log(`No economy log channel configured, log not sent: ${action}`, 'warn', 'economy');
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
    log(`User ${username} (${userId}) ${action} ${isPositive ? '+' : ''}${amount} Ccoin${details ? ` - ${details}` : ''}`, 'info', 'economy');
  }

  /**
   * Log errors in the system
   * @param title Error title
   * @param error Error object or message
   * @param source Error source
   */
  logError(
    title: string,
    error: Error | string,
    source?: string
  ): void {
    const channel = this.getChannel(LogType.ERROR);
    if (!channel) {
      log(`No error log channel configured, error not sent: ${title}`, 'warn', 'error');
      return;
    }

    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : null;

    const logEmbed = new EmbedBuilder()
      .setColor('#e74c3c' as ColorResolvable)
      .setTitle(`⚠️ ${title}`)
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
    log(`${title} - ${errorMessage}`, 'error', 'error');
    if (errorStack) {
      console.error(errorStack);
    }
  }

  /**
   * Log game activities
   * @param gameType Type of game
   * @param action Action performed
   * @param playerName Player's name
   * @param playerId Player's ID
   * @param details Additional details (optional)
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
      log(`No game log channel configured, log not sent: ${gameType} ${action}`, 'warn', 'game');
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
    log(`${gameType} - ${playerName} (${playerId}) ${action}${details ? ` - ${details}` : ''}`, 'info', 'game');
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