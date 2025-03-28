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

/**
 * تابع کمکی بهینه‌سازی شده برای فرمت تاریخ
 * از کش استفاده می‌کند تا از ایجاد مکرر فرمتر جلوگیری کند
 */
const dateFormatterCache: Record<string, Intl.DateTimeFormat> = {};

function formatDate(date: Date, full: boolean = true): string {
  const cacheKey = full ? 'full' : 'simple';
  
  // اگر فرمتر در کش نباشد، آن را ایجاد و ذخیره کنید
  if (!dateFormatterCache[cacheKey]) {
    dateFormatterCache[cacheKey] = full 
      ? new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      : new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
  }
  
  // استفاده از فرمتر کش شده
  return dateFormatterCache[cacheKey].format(date);
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

// رنگ‌ها و آیکون‌های مختلف برای هر نوع لاگ - بهینه‌سازی با ترکیب دو آبجکت در یک آبجکت
interface LogFormatOptions {
  color: ColorResolvable;
  icon: string;
}

// ترکیب رنگ و آیکون در یک آبجکت واحد برای پردازش سریع‌تر
const LOG_FORMAT: { [key in LogType]: LogFormatOptions } = {
  [LogType.TRANSACTION]: { color: '#2ECC71', icon: '💰' }, // سبز
  [LogType.GAME]: { color: '#3498DB', icon: '🎮' },        // آبی
  [LogType.USER]: { color: '#9B59B6', icon: '👤' },        // بنفش
  [LogType.ADMIN]: { color: '#F1C40F', icon: '⚙️' },       // زرد
  [LogType.SECURITY]: { color: '#E74C3C', icon: '🔒' },    // قرمز
  [LogType.SYSTEM]: { color: '#1ABC9C', icon: '🤖' },      // فیروزه‌ای
  [LogType.ERROR]: { color: '#E74C3C', icon: '⚠️' },       // قرمز
};

// حذف توابع و متغیرهای تکراری

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
  // کش کانال‌ها برای کاهش جستجوهای مکرر
  private channelCache: Map<string, TextChannel> = new Map();

  constructor(client: Client) {
    this.client = client;
  }
  
  /**
   * ارسال لاگ اطلاعاتی
   * @param message پیام لاگ
   */
  public info(message: string): void {
    console.log(`[INFO] ${message}`);
    this.log(LogType.SYSTEM, 'اطلاعات سیستم', message).catch(err => {
      console.error(`Error logging info: ${err}`);
    });
  }

  /**
   * ارسال لاگ هشدار
   * @param message پیام لاگ
   */
  public warn(message: string): void {
    console.warn(`[WARN] ${message}`);
    this.log(LogType.SYSTEM, 'هشدار سیستم', message).catch(err => {
      console.error(`Error logging warning: ${err}`);
    });
  }

  /**
   * ارسال لاگ خطا
   * @param message پیام لاگ
   */
  public error(message: string): void {
    console.error(`[ERROR] ${message}`);
    this.log(LogType.ERROR, 'خطای سیستم', message).catch(err => {
      console.error(`Error logging error: ${err}`);
    });
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
   * ارسال یک لاگ به کانال مربوطه - بهینه‌سازی شده برای عملکرد بهتر
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
    footer?: string,
    includeViewDetailsButton: boolean = false
  ): Promise<void> {
    // بررسی سریع شرایط لازم - از بررسی‌های متوالی استفاده کنید تا عملیات سنگین را به تأخیر بیندازید
    if (!this.isEnabled) return;

    // بررسی کانال در یک خط
    const channelId = this.logChannels[type] || this.defaultChannel;
    if (!channelId) return;

    try {
      // استفاده از کش داخلی برای دسترسی سریع‌تر به کانال‌ها و کاهش فراخوانی‌های API دیسکورد
      let channel: TextChannel | undefined;
      
      // بررسی کش داخلی
      if (this.channelCache.has(channelId)) {
        channel = this.channelCache.get(channelId);
      } else {
        // اگر در کش نباشد، آن را از دیسکورد دریافت و ذخیره کنیم
        channel = this.client.channels.cache.get(channelId) as TextChannel;
        if (channel?.isTextBased()) {
          this.channelCache.set(channelId, channel);
        }
      }
      
      // بررسی معتبر بودن کانال
      if (!channel?.isTextBased()) return;

      // استفاده از فرمت‌های ترکیبی از پیش تعریف شده
      const format = LOG_FORMAT[type];
      const logId = `log_${Date.now().toString(36)}`;
      
      // ساخت امبد با کمترین عملیات ممکن
      const embed = new EmbedBuilder()
        .setColor(format.color)
        .setTitle(`${format.icon} ${title}`)
        .setDescription(description)
        .setTimestamp();
      
      // افزودن مستقیم فیلدها اگر وجود داشته باشند - حذف بررسی‌های اضافه
      if (fields.length > 0) {
        // افزودن تمام فیلدها در یک عملیات
        embed.addFields(
          { name: '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄', value: '**جزئیات**', inline: false },
          ...fields
        );
      }

      // افزودن پاورقی - ترکیب عملیات‌های رشته‌ای
      embed.setFooter({ 
        text: footer ? `${footer} • ${logId.substring(4, 10)}` : `${logId.substring(4, 10)}`
      });

      // ساخت کامپوننت‌ها فقط در صورت نیاز با عملیات مشروط کوتاه
      const components = includeViewDetailsButton ? [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`log_details_${logId}`)
            .setLabel('مشاهده جزئیات بیشتر')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔍')
        )
      ] : undefined;

      // ارسال به کانال با یک عملیات واحد
      await channel.send({ embeds: [embed], components });
    } catch {
      // کاهش لاگ - فقط در محیط توسعه لاگ خواهیم کرد
      if (process.env.NODE_ENV === 'development') {
        console.error(`خطا در لاگ ${type}`);
      }
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
    // Operation icons for different transaction types
    const operationIcons = {
      'deposit': '⬆️',
      'withdraw': '⬇️',
      'transfer_in': '↙️',
      'transfer_out': '↗️',
      'game_win': '🎮',
      'game_loss': '🎮',
      'quest_reward': '📝',
      'steal_success': '🦹‍♂️',
      'steal_victim': '😱',
      'steal_failed': '🚫',
      'item_purchase': '🛒',
      'item_purchase_crystal': '💎',
      'welcome_bonus': '🎁',
      'daily_reward': '📅',
    };
    
    // Format amount based on whether it's positive or negative
    const formattedAmount = amount >= 0 
      ? `+${amount.toLocaleString('fa-IR')} Ccoin` 
      : `${amount.toLocaleString('fa-IR')} Ccoin`;
    
    // Get the icon, or use a default if not found
    const opIcon = operationIcons[operation as keyof typeof operationIcons] || '💰';
    const timestampMs = Date.now();
    const transactionId = `TX_${timestampMs.toString(36)}`;
    
    // استفاده از تابع formatDate برای کاهش سربار فرمت‌کننده تاریخ
    const persianDate = formatDate(new Date(), true);
    
    // Color the amount based on whether it's positive or negative
    const amountDisplay = amount >= 0 
      ? `\`\`\`diff\n+ ${amount.toLocaleString('fa-IR')} Ccoin\n\`\`\`` 
      : `\`\`\`diff\n- ${Math.abs(amount).toLocaleString('fa-IR')} Ccoin\n\`\`\``;
      
    // More detailed description with emoji
    const enrichedDescription = `${opIcon} کاربر **${username}** (${userId}) ${details}`;
    
    // Standard fields for all transactions
    const standardFields = [
      { name: '💰 مقدار', value: amountDisplay, inline: false },
      { name: '🕒 زمان', value: persianDate, inline: true },
      { name: '📊 نوع تراکنش', value: operation, inline: true }
    ];
    
    // Combine standard fields with additional fields
    await this.log(
      LogType.TRANSACTION,
      `تراکنش مالی: ${operation}`,
      enrichedDescription,
      [
        ...standardFields,
        ...additionalFields
      ],
      `شناسه تراکنش: ${transactionId}`,
      true // Add view details button
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
    // Game type icons
    const gameIcons: {[key: string]: string} = {
      'coinflip': '🪙',
      'rps': '✂️',
      'numberguess': '🔢',
      'wheel': '🎡'
    };
    
    // Format the game icon
    const gameIcon = gameIcons[gameType] || '🎮';
    
    // Format the outcome with emoji
    const outcomeWithEmoji = outcome.toLowerCase().includes('برد') ? 
      `✅ ${outcome}` : outcome.toLowerCase().includes('باخت') ? 
      `❌ ${outcome}` : `⚖️ ${outcome}`;
    
    // استفاده از تابع formatDate برای کاهش سربار
    const persianDate = formatDate(new Date(), false);
    
    // Format the bet amount
    const betFormatted = bet.toLocaleString('fa-IR');
    
    // Format the winnings with color and sign
    const winningsDisplay = winnings >= 0 
      ? `\`\`\`diff\n+ ${winnings.toLocaleString('fa-IR')} Ccoin\n\`\`\`` 
      : `\`\`\`diff\n- ${Math.abs(winnings).toLocaleString('fa-IR')} Ccoin\n\`\`\``;
    
    // Create a more descriptive title
    const gameTitle = gameType === 'coinflip' ? 'شیر یا خط' :
                      gameType === 'rps' ? 'سنگ کاغذ قیچی' :
                      gameType === 'numberguess' ? 'حدس عدد' :
                      gameType === 'wheel' ? 'چرخ شانس' : gameType;
    
    // Create a unique game ID
    const gameId = `GAME_${Date.now().toString(36)}`;
    
    // Custom description based on outcome
    const customDescription = outcome.toLowerCase().includes('برد')
      ? `کاربر **${username}** (${userId}) در بازی ${gameIcon} **${gameTitle}** برنده شد!`
      : outcome.toLowerCase().includes('باخت')
      ? `کاربر **${username}** (${userId}) در بازی ${gameIcon} **${gameTitle}** باخت!`
      : `کاربر **${username}** (${userId}) در بازی ${gameIcon} **${gameTitle}** شرکت کرد.`;
    
    await this.log(
      LogType.GAME,
      `بازی: ${gameTitle}`,
      customDescription,
      [
        { name: '🎲 نتیجه', value: outcomeWithEmoji, inline: true },
        { name: '💰 شرط‌بندی', value: `${betFormatted} Ccoin`, inline: true },
        { name: '💵 برد/باخت', value: winningsDisplay, inline: false },
        { name: '📊 نوع بازی', value: gameType, inline: true },
        { name: '🕒 زمان', value: persianDate, inline: true }
      ],
      `شناسه بازی: ${gameId}`,
      true // Add view details button
    );
  }

  /**
   * لاگ فعالیت کاربران
   */
  public async logUserActivity(
    userId: string,
    username: string,
    action: string,
    details: string,
    additionalFields: { name: string; value: string; inline?: boolean }[] = []
  ): Promise<void> {
    // Action icons for different user activities
    const actionIcons: {[key: string]: string} = {
      'login': '🔑',
      'register': '📝',
      'profile_update': '✏️',
      'achievement': '🏆',
      'quest_completed': '📋',
      'level_up': '⬆️',
      'item_used': '🧰',
      'clan_joined': '🛡️',
      'clan_left': '🚪',
      'clan_created': '⚔️',
      'daily_claimed': '📅',
      'streak': '🔥'
    };
    
    // Get the icon, or use a default if not found
    const actionIcon = actionIcons[action] || '👤';
    
    // استفاده از تابع formatDate برای کاهش سربار
    const persianDate = formatDate(new Date(), false);
    
    // Create a unique activity ID
    const activityId = `ACT_${Date.now().toString(36)}`;
    
    // Create a more descriptive and visually appealing description
    const enrichedDescription = `${actionIcon} کاربر **${username}** (${userId}) ${details}`;
    
    // Format the action title with more descriptive Persian text
    const actionTitle = action === 'login' ? 'ورود به سیستم' :
                        action === 'register' ? 'ثبت نام' :
                        action === 'profile_update' ? 'بروزرسانی پروفایل' :
                        action === 'achievement' ? 'دستاورد' :
                        action === 'quest_completed' ? 'تکمیل کوئست' :
                        action === 'level_up' ? 'افزایش سطح' :
                        action === 'item_used' ? 'استفاده از آیتم' :
                        action === 'clan_joined' ? 'عضویت در کلن' :
                        action === 'clan_left' ? 'خروج از کلن' :
                        action === 'clan_created' ? 'ایجاد کلن' :
                        action === 'daily_claimed' ? 'دریافت جایزه روزانه' :
                        action === 'streak' ? 'استریک' : action;
    
    // Standard fields for all user activities
    const standardFields = [
      { name: '🕒 زمان', value: persianDate, inline: true },
      { name: '📊 نوع فعالیت', value: actionTitle, inline: true }
    ];
    
    // Combine standard fields with additional fields
    await this.log(
      LogType.USER,
      `فعالیت کاربر: ${actionTitle}`,
      enrichedDescription,
      [
        ...standardFields,
        ...additionalFields
      ],
      `شناسه فعالیت: ${activityId}`
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
    details: string,
    additionalFields: { name: string; value: string; inline?: boolean }[] = []
  ): Promise<void> {
    // Admin action icons
    const actionIcons: {[key: string]: string} = {
      'coin_add': '💰',
      'coin_remove': '💸',
      'ban': '🔨',
      'unban': '🔓',
      'role_add': '⭐',
      'role_remove': '❌',
      'settings_change': '⚙️',
      'channel_settings': '📢',
      'item_give': '🎁',
      'reset_user': '🔄',
      'boost_user': '🚀',
      'mute': '🔇',
      'unmute': '🔊'
    };
    
    // Get the icon, or use a default if not found
    const actionIcon = actionIcons[action] || '⚙️';
    
    // استفاده از تابع formatDate برای کاهش سربار
    const persianDate = formatDate(new Date(), true);
    
    // Create a unique admin action ID
    const adminActionId = `ADMIN_${Date.now().toString(36)}`;
    
    // Create a more descriptive title based on the action
    const actionTitle = action === 'coin_add' ? 'افزایش سکه' :
                        action === 'coin_remove' ? 'کاهش سکه' :
                        action === 'ban' ? 'مسدود کردن' :
                        action === 'unban' ? 'رفع مسدودیت' :
                        action === 'role_add' ? 'اعطای نقش' :
                        action === 'role_remove' ? 'حذف نقش' :
                        action === 'settings_change' ? 'تغییر تنظیمات' :
                        action === 'channel_settings' ? 'تنظیم کانال' :
                        action === 'item_give' ? 'اعطای آیتم' :
                        action === 'reset_user' ? 'بازنشانی کاربر' :
                        action === 'boost_user' ? 'بوست کاربر' :
                        action === 'mute' ? 'بی‌صدا کردن' :
                        action === 'unmute' ? 'رفع بی‌صدا' : action;
    
    // Enhanced description with emoji
    const enrichedDescription = `${actionIcon} مدیر **${adminName}** (${adminId}) ${details}`;
    
    // Standard fields for all admin actions
    const standardFields = [
      { name: '👤 کاربر هدف', value: `${targetName} (${targetId})`, inline: true },
      { name: '🕒 زمان', value: persianDate, inline: true },
      { name: '🔑 نوع عملیات', value: actionTitle, inline: true }
    ];
    
    // Combine standard fields with additional fields
    await this.log(
      LogType.ADMIN,
      `عملیات ادمین: ${actionTitle}`,
      enrichedDescription,
      [
        ...standardFields,
        ...additionalFields
      ],
      `شناسه عملیات: ${adminActionId}`,
      true // Add view details button
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
    details: string,
    additionalFields: { name: string; value: string; inline?: boolean }[] = []
  ): Promise<void> {
    // Security action icons
    const actionIcons: {[key: string]: string} = {
      'spam': '📨',
      'abuse': '⚠️',
      'exploit': '🕵️',
      'suspicious_transfer': '💸',
      'multiple_accounts': '👥',
      'rate_limit': '⏱️',
      'hack_attempt': '🔓',
      'bot_detection': '🤖',
      'vpn_detection': '🌐'
    };
    
    // Risk color indicators using Discord code blocks
    const riskIndicator = risk === 'زیاد' ? 
      '```diff\n- ریسک بالا ⚠️⚠️⚠️\n```' : 
      risk === 'متوسط' ? 
      '```fix\n! ریسک متوسط ⚠️⚠️\n```' : 
      '```yaml\n# ریسک پایین ⚠️\n```';
    
    // Get the icon, or use a default if not found
    const actionIcon = actionIcons[action] || '🔒';
    
    // Create a unique security alert ID
    const alertId = `SEC_${Date.now().toString(36)}`;
    
    // Format timestamp with more detail
    const timestamp = new Date();
    const persianDate = timestamp.toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Create a more descriptive title based on the action
    const actionTitle = action === 'spam' ? 'اسپم' :
                        action === 'abuse' ? 'سوء استفاده' :
                        action === 'exploit' ? 'سوء استفاده از باگ' :
                        action === 'suspicious_transfer' ? 'انتقال مشکوک' :
                        action === 'multiple_accounts' ? 'اکانت‌های متعدد' :
                        action === 'rate_limit' ? 'محدودیت نرخ' :
                        action === 'hack_attempt' ? 'تلاش برای هک' :
                        action === 'bot_detection' ? 'تشخیص بات' :
                        action === 'vpn_detection' ? 'استفاده از VPN' : action;
    
    // Enhanced description with emoji
    const enrichedDescription = `${actionIcon} فعالیت مشکوک از کاربر **${username}** (${userId}) شناسایی شد`;
    
    // Standard fields for all security alerts
    const standardFields = [
      { name: '⚠️ سطح ریسک', value: riskIndicator, inline: false },
      { name: '🕒 زمان', value: persianDate, inline: true },
      { name: '🔑 نوع هشدار', value: actionTitle, inline: true },
      { name: '📝 جزئیات', value: details, inline: false }
    ];
    
    // Combine standard fields with additional fields
    await this.log(
      LogType.SECURITY,
      `هشدار امنیتی: ${actionTitle}`,
      enrichedDescription,
      [
        ...standardFields,
        ...additionalFields
      ],
      `شناسه هشدار: ${alertId}`,
      true // Add view details button for important security alerts
    );
  }

  /**
   * لاگ خطاها
   */
  public async logError(
    error: Error | string,
    source: string,
    userId?: string,
    username?: string,
    additionalFields: { name: string; value: string; inline?: boolean }[] = []
  ): Promise<void> {
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : error;
    const errorStack = error instanceof Error && error.stack ? error.stack.split('\n').slice(1).join('\n') : '';
    
    // Create a unique error ID
    const errorId = `ERR_${Date.now().toString(36)}`;
    
    // Format timestamp with more detail
    const timestamp = new Date();
    const persianDate = timestamp.toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Enhanced description with emoji
    let description = `⚠️ خطایی در سیستم رخ داد: \`${source}\``;
    if (userId && username) {
      description += `\nکاربر مرتبط: **${username}** (${userId})`;
    }
    
    // Format error message with appropriate syntax highlighting
    const formattedError = `\`\`\`ansi\n[0;31m${errorMessage}[0m\n\`\`\``;
    
    // Create standard fields for all errors
    const standardFields = [
      { name: '❌ پیام خطا', value: formattedError, inline: false }
    ];
    
    // Add stack trace if available
    if (errorStack) {
      standardFields.push({ 
        name: '📚 جزئیات خطا', 
        value: `\`\`\`js\n${errorStack.substring(0, 1000)}${errorStack.length > 1000 ? '...' : ''}\n\`\`\``, 
        inline: false 
      });
    }
    
    // Add source and time info
    standardFields.push({ name: '📂 منبع', value: source, inline: true });
    standardFields.push({ name: '🕒 زمان', value: persianDate, inline: true });
    
    // Combine standard fields with additional fields
    await this.log(
      LogType.ERROR,
      `خطای سیستمی: ${source}`,
      description,
      [
        ...standardFields,
        ...additionalFields
      ],
      `شناسه خطا: ${errorId}`,
      true // Add view details button
    );
  }

  /**
   * لاگ سیستمی
   */
  public async logSystem(
    event: string,
    details: string,
    additionalFields: { name: string; value: string; inline?: boolean }[] = [],
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): Promise<void> {
    // System event icons
    const eventIcons: {[key: string]: string} = {
      'startup': '🚀',
      'shutdown': '🛑',
      'config_change': '⚙️',
      'backup': '💾',
      'maintenance': '🔧',
      'update': '🔄',
      'performance': '📊',
      'database': '🗄️',
      'api': '🔌'
    };
    
    // Get the icon, or use a default if not found
    const eventIcon = eventIcons[event] || '🤖';
    
    // Create a unique system event ID
    const eventId = `SYS_${Date.now().toString(36)}`;
    
    // Format timestamp with more detail
    const timestamp = new Date();
    const persianDate = timestamp.toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Apply appropriate severity indicator
    const severityIcon = severity === 'critical' ? '🔴' : 
                         severity === 'warning' ? '🟠' : '🟢';
    
    // Format the event title with more descriptive Persian text
    const eventTitle = event === 'startup' ? 'راه‌اندازی سیستم' :
                      event === 'shutdown' ? 'خاموش شدن سیستم' :
                      event === 'config_change' ? 'تغییر پیکربندی' :
                      event === 'backup' ? 'پشتیبان‌گیری' :
                      event === 'maintenance' ? 'تعمیر و نگهداری' :
                      event === 'update' ? 'بروزرسانی' :
                      event === 'performance' ? 'عملکرد سیستم' :
                      event === 'database' ? 'پایگاه داده' :
                      event === 'api' ? 'رابط برنامه‌نویسی' : event;
    
    // Enhanced description with emoji
    const enrichedDescription = `${eventIcon} ${severityIcon} ${details}`;
    
    // Standard fields for all system events
    const standardFields = [
      { name: '🕒 زمان', value: persianDate, inline: true },
      { name: '🔍 وضعیت', value: severity === 'critical' ? 'بحرانی' : severity === 'warning' ? 'هشدار' : 'اطلاعات', inline: true }
    ];
    
    // Combine standard fields with additional fields
    await this.log(
      LogType.SYSTEM,
      `رویداد سیستمی: ${eventTitle}`,
      enrichedDescription,
      [
        ...standardFields,
        ...additionalFields
      ],
      `شناسه رویداد: ${eventId}`,
      severity === 'critical' // Only add view details button for critical events
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