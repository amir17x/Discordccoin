import { 
  Client, 
  TextChannel, 
  EmbedBuilder, 
  ColorResolvable 
} from 'discord.js';

// لاگ تایپ‌های مختلف برای دسته‌بندی لاگ‌ها
export enum LogType {
  TRANSACTION = 'transaction',
  GAME = 'game',
  USER = 'user',
  ADMIN = 'admin',
  SECURITY = 'security',
  SYSTEM = 'system',
  ERROR = 'error'
}

// تنظیمات پیش‌فرض برای کانال‌های لاگ
interface LogChannels {
  [LogType.TRANSACTION]: string | null;
  [LogType.GAME]: string | null;
  [LogType.USER]: string | null;
  [LogType.ADMIN]: string | null;
  [LogType.SECURITY]: string | null;
  [LogType.SYSTEM]: string | null;
  [LogType.ERROR]: string | null;
}

// رنگ‌های مختلف برای هر نوع لاگ
const LOG_COLORS: { [key in LogType]: ColorResolvable } = {
  [LogType.TRANSACTION]: '#2ECC71', // سبز
  [LogType.GAME]: '#3498DB',        // آبی
  [LogType.USER]: '#9B59B6',        // بنفش
  [LogType.ADMIN]: '#F1C40F',       // زرد
  [LogType.SECURITY]: '#E74C3C',    // قرمز
  [LogType.SYSTEM]: '#1ABC9C',      // فیروزه‌ای
  [LogType.ERROR]: '#E74C3C',       // قرمز
};

// آیکون‌ها برای هر نوع لاگ
const LOG_ICONS: { [key in LogType]: string } = {
  [LogType.TRANSACTION]: '💰',
  [LogType.GAME]: '🎮',
  [LogType.USER]: '👤',
  [LogType.ADMIN]: '⚙️',
  [LogType.SECURITY]: '🔒',
  [LogType.SYSTEM]: '🤖',
  [LogType.ERROR]: '⚠️',
};

/**
 * کلاس اصلی لاگر - برای ارسال لاگ‌ها به کانال‌های دیسکورد
 */
export class DiscordLogger {
  private client: Client;
  private logChannels: LogChannels = {
    [LogType.TRANSACTION]: null,
    [LogType.GAME]: null,
    [LogType.USER]: null,
    [LogType.ADMIN]: null,
    [LogType.SECURITY]: null,
    [LogType.SYSTEM]: null,
    [LogType.ERROR]: null,
  };
  private isEnabled: boolean = true;
  private defaultChannel: string | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * تنظیم کانال‌های لاگ
   * @param channels آبجکت حاوی آی‌دی کانال‌ها
   */
  public setChannels(channels: Partial<LogChannels>): void {
    this.logChannels = { ...this.logChannels, ...channels };
  }

  /**
   * تنظیم یک کانال پیش‌فرض برای تمام لاگ‌ها
   * @param channelId آی‌دی کانال
   */
  public setDefaultChannel(channelId: string): void {
    this.defaultChannel = channelId;
  }

  /**
   * فعال/غیرفعال کردن لاگر
   * @param enabled وضعیت فعال بودن
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * ارسال یک لاگ به کانال مربوطه
   * @param type نوع لاگ
   * @param title عنوان لاگ
   * @param description توضیحات لاگ
   * @param fields فیلدهای اضافی
   * @param footer پاورقی
   */
  public async log(
    type: LogType,
    title: string,
    description: string,
    fields: { name: string; value: string; inline?: boolean }[] = [],
    footer?: string
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // پیدا کردن کانال مناسب
      const channelId = this.logChannels[type] || this.defaultChannel;
      if (!channelId) {
        // Silent fail - only show debug messages in development
        if (process.env.NODE_ENV === 'development') {
          console.debug(`کانالی برای لاگ نوع ${type} تنظیم نشده است.`);
        }
        return;
      }

      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) {
        console.error(`کانال با آی‌دی ${channelId} یافت نشد.`);
        return;
      }

      // ساخت امبد
      const embed = new EmbedBuilder()
        .setColor(LOG_COLORS[type])
        .setTitle(`${LOG_ICONS[type]} ${title}`)
        .setDescription(description)
        .setTimestamp();

      // افزودن فیلدها
      if (fields.length > 0) {
        embed.addFields(fields);
      }

      // افزودن پاورقی
      if (footer) {
        embed.setFooter({ text: footer });
      }

      // ارسال به کانال
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`خطا در ارسال لاگ ${type}:`, error);
    }
  }

  /**
   * لاگ تراکنش‌های مالی
   */
  public async logTransaction(
    userId: string,
    username: string,
    operation: string,
    amount: number,
    details: string,
    additionalFields: { name: string; value: string; inline?: boolean }[] = []
  ): Promise<void> {
    await this.log(
      LogType.TRANSACTION,
      `تراکنش مالی: ${operation}`,
      `کاربر **${username}** (${userId}) ${details}`,
      [
        { name: '💰 مقدار', value: `${amount} Ccoin`, inline: true },
        { name: '🕒 زمان', value: new Date().toLocaleString('fa-IR'), inline: true },
        ...additionalFields
      ],
      `شناسه تراکنش: ${Date.now().toString(36)}`
    );
  }

  /**
   * لاگ بازی‌ها
   */
  public async logGame(
    userId: string,
    username: string,
    gameType: string,
    outcome: string,
    bet: number,
    winnings: number
  ): Promise<void> {
    await this.log(
      LogType.GAME,
      `بازی: ${gameType}`,
      `کاربر **${username}** (${userId}) یک بازی ${gameType} انجام داد`,
      [
        { name: '🎲 نتیجه', value: outcome, inline: true },
        { name: '💰 شرط‌بندی', value: `${bet} Ccoin`, inline: true },
        { name: '💵 برد/باخت', value: `${winnings} Ccoin`, inline: true },
        { name: '🕒 زمان', value: new Date().toLocaleString('fa-IR'), inline: true }
      ]
    );
  }

  /**
   * لاگ فعالیت کاربران
   */
  public async logUserActivity(
    userId: string,
    username: string,
    action: string,
    details: string
  ): Promise<void> {
    await this.log(
      LogType.USER,
      `فعالیت کاربر: ${action}`,
      `کاربر **${username}** (${userId}) ${details}`,
      [
        { name: '🕒 زمان', value: new Date().toLocaleString('fa-IR'), inline: true }
      ]
    );
  }

  /**
   * لاگ عملیات ادمینی
   */
  public async logAdminAction(
    adminId: string,
    adminName: string,
    action: string,
    targetId: string,
    targetName: string,
    details: string
  ): Promise<void> {
    await this.log(
      LogType.ADMIN,
      `عملیات ادمین: ${action}`,
      `مدیر **${adminName}** (${adminId}) ${details}`,
      [
        { name: '👤 کاربر هدف', value: `${targetName} (${targetId})`, inline: true },
        { name: '🕒 زمان', value: new Date().toLocaleString('fa-IR'), inline: true }
      ]
    );
  }

  /**
   * لاگ امنیتی
   */
  public async logSecurity(
    userId: string,
    username: string,
    action: string,
    risk: 'کم' | 'متوسط' | 'زیاد',
    details: string
  ): Promise<void> {
    await this.log(
      LogType.SECURITY,
      `هشدار امنیتی: ${action}`,
      `فعالیت مشکوک از کاربر **${username}** (${userId}) شناسایی شد`,
      [
        { name: '⚠️ سطح ریسک', value: risk, inline: true },
        { name: '📝 جزئیات', value: details, inline: false },
        { name: '🕒 زمان', value: new Date().toLocaleString('fa-IR'), inline: true }
      ]
    );
  }

  /**
   * لاگ خطاها
   */
  public async logError(
    error: Error | string,
    source: string,
    userId?: string,
    username?: string
  ): Promise<void> {
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : error;
    
    let description = `خطایی در سیستم رخ داد: \`${source}\``;
    if (userId && username) {
      description += `\nکاربر مرتبط: **${username}** (${userId})`;
    }
    
    await this.log(
      LogType.ERROR,
      `خطای سیستمی`,
      description,
      [
        { name: '❌ پیام خطا', value: `\`\`\`${errorMessage}\`\`\``, inline: false },
        { name: '🕒 زمان', value: new Date().toLocaleString('fa-IR'), inline: true }
      ]
    );
  }

  /**
   * لاگ سیستمی
   */
  public async logSystem(
    event: string,
    details: string,
    additionalFields: { name: string; value: string; inline?: boolean }[] = []
  ): Promise<void> {
    await this.log(
      LogType.SYSTEM,
      `رویداد سیستمی: ${event}`,
      details,
      [
        { name: '🕒 زمان', value: new Date().toLocaleString('fa-IR'), inline: true },
        ...additionalFields
      ]
    );
  }
}

// نمونه singleton از لاگر
let loggerInstance: DiscordLogger | null = null;

/**
 * دریافت نمونه لاگر
 * @param client کلاینت دیسکورد
 * @returns نمونه لاگر
 */
export function getLogger(client: Client): DiscordLogger {
  if (!loggerInstance) {
    loggerInstance = new DiscordLogger(client);
  }
  return loggerInstance;
}