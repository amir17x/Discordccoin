import { ButtonInteraction, 
  ModalSubmitInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageComponentInteraction,
  User } from 'discord.js';
import { storage } from '../../storage';

/**
 * کلاس مدیریت رقیب‌یابی (Matchmaking) برای بازی‌های رقابتی
 * این کلاس امکانات جستجوی رقیب تصادفی و دعوت مستقیم رقیب را فراهم می‌کند
 */
class MatchmakingSystem {
  // ذخیره‌سازی صف‌های انتظار برای بازی‌های مختلف
  private queues: Map<string, Array<{userId: string, username: string, timestamp: number}>> = new Map();
  
  // ذخیره‌سازی اطلاعات دعوت‌ها
  private invites: Map<string, {
    inviterId: string,
    inviterName: string,
    targetId: string,
    targetName: string,
    gameType: string,
    timestamp: number
  }> = new Map();
  
  // یک نمونه (singleton) از سیستم رقیب‌یابی
  private static instance: MatchmakingSystem;
  
  private constructor() {
    // راه‌اندازی قابلیت تمیز کردن خودکار صف‌ها و دعوت‌ها
    setInterval(() => this.cleanupQueuesAndInvites(), 60000); // هر یک دقیقه
  }
  
  /**
   * دریافت نمونه سیستم رقیب‌یابی (Singleton pattern)
   */
  public static getInstance(): MatchmakingSystem {
    if (!MatchmakingSystem.instance) {
      MatchmakingSystem.instance = new MatchmakingSystem();
    }
    return MatchmakingSystem.instance;
  }
  
  /**
   * اضافه کردن کاربر به صف انتظار برای جستجوی تصادفی
   * @param userId شناسه کاربر
   * @param username نام کاربری
   * @param gameType نوع بازی
   * @returns آیا به صف اضافه شد یا نه
   */
  public addToQueue(userId: string, username: string, gameType: string): boolean {
    // اطمینان از اینکه صف برای این بازی وجود دارد
    if (!this.queues.has(gameType)) {
      this.queues.set(gameType, []);
    }
    
    // بررسی کنیم که کاربر قبلا در صف نباشد
    const queue = this.queues.get(gameType)!;
    if (queue.some(item => item.userId === userId)) {
      return false;
    }
    
    // اضافه کردن کاربر به صف
    queue.push({
      userId,
      username,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  /**
   * حذف کاربر از صف انتظار
   * @param userId شناسه کاربر
   * @param gameType نوع بازی (اختیاری - اگر مشخص نشود از همه صف‌ها حذف می‌شود)
   */
  public removeFromQueue(userId: string, gameType?: string): void {
    if (gameType) {
      // حذف از صف مشخص شده
      if (this.queues.has(gameType)) {
        const queue = this.queues.get(gameType)!;
        this.queues.set(gameType, queue.filter(item => item.userId !== userId));
      }
    } else {
      // حذف از همه صف‌ها
      // از Array.from برای تبدیل Map entries به آرایه استفاده می‌کنیم تا مشکل عدم پشتیبانی از Iterator حل شود
      Array.from(this.queues.entries()).forEach(([type, queue]) => {
        this.queues.set(type, queue.filter((item: {userId: string, username: string, timestamp: number}) => item.userId !== userId));
      });
    }
  }
  
  /**
   * بررسی وجود رقیب در صف انتظار
   * @param gameType نوع بازی
   * @param userId شناسه کاربر فعلی که باید با آن مچ نشود
   * @returns اطلاعات رقیب یا null اگر رقیبی پیدا نشد
   */
  public findOpponent(gameType: string, userId: string): {userId: string, username: string} | null {
    if (!this.queues.has(gameType)) {
      return null;
    }
    
    const queue = this.queues.get(gameType)!;
    // پیدا کردن اولین کاربر در صف که کاربر فعلی نباشد
    const opponentIndex = queue.findIndex(item => item.userId !== userId);
    
    if (opponentIndex === -1) {
      return null; // رقیبی پیدا نشد
    }
    
    // برداشتن رقیب از صف
    const opponent = queue.splice(opponentIndex, 1)[0];
    
    return {
      userId: opponent.userId,
      username: opponent.username
    };
  }
  
  /**
   * ایجاد یک دعوت بازی جدید
   * @param inviterId شناسه دعوت‌کننده
   * @param inviterName نام دعوت‌کننده
   * @param targetId شناسه کاربر هدف
   * @param targetName نام کاربر هدف
   * @param gameType نوع بازی
   * @returns شناسه دعوت
   */
  public createInvite(inviterId: string, inviterName: string, targetId: string, targetName: string, gameType: string): string {
    // ایجاد شناسه منحصر به فرد برای دعوت
    const inviteId = `${gameType}_${inviterId}_${targetId}_${Date.now()}`;
    
    // ذخیره اطلاعات دعوت
    this.invites.set(inviteId, {
      inviterId,
      inviterName,
      targetId,
      targetName,
      gameType,
      timestamp: Date.now()
    });
    
    return inviteId;
  }
  
  /**
   * دریافت اطلاعات یک دعوت با شناسه
   * @param inviteId شناسه دعوت
   * @returns اطلاعات دعوت یا undefined اگر دعوت وجود نداشته باشد
   */
  public getInvite(inviteId: string) {
    return this.invites.get(inviteId);
  }
  
  /**
   * حذف یک دعوت (بعد از پذیرش یا رد)
   * @param inviteId شناسه دعوت
   */
  public removeInvite(inviteId: string): void {
    this.invites.delete(inviteId);
  }
  
  /**
   * حذف دعوت‌ها و کاربران منقضی شده از صف‌ها
   * این متد به طور خودکار دعوت‌های قدیمی‌تر از 2 دقیقه و کاربران در صف‌های قدیمی‌تر از 1 دقیقه را حذف می‌کند
   */
  private cleanupQueuesAndInvites(): void {
    const now = Date.now();
    const INVITE_TIMEOUT = 120000; // 2 دقیقه
    const QUEUE_TIMEOUT = 60000; // 1 دقیقه
    
    // پاکسازی دعوت‌های منقضی شده
    this.invites.forEach((invite, inviteId) => {
      if (now - invite.timestamp > INVITE_TIMEOUT) {
        this.invites.delete(inviteId);
      }
    });
    
    // پاکسازی کاربران منقضی شده در صف‌ها
    this.queues.forEach((queue, gameType) => {
      this.queues.set(
        gameType, 
        queue.filter(item => now - item.timestamp <= QUEUE_TIMEOUT)
      );
    });
  }
  
  /**
   * دریافت تعداد کاربران در صف انتظار برای یک بازی
   * @param gameType نوع بازی
   * @returns تعداد کاربران در صف
   */
  public getQueueLength(gameType: string): number {
    if (!this.queues.has(gameType)) {
      return 0;
    }
    return this.queues.get(gameType)!.length;
  }
}

// دسترسی به نمونه سیستم رقیب‌یابی
export const matchmaking = MatchmakingSystem.getInstance();

/**
 * نمایش منوی جستجوی رقیب برای بازی‌های رقابتی
 * @param interaction برهم‌کنش با کاربر
 * @param gameType نوع بازی (مثلاً dice_duel, rps, و غیره)
 * @param gameName نام نمایشی بازی
 */
export async function showMatchmakingMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  gameType: string,
  gameName: string
): Promise<void> {
  try {
    // بررسی کنیم که کاربر در دیتابیس وجود داشته باشد
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // ساخت Embed برای نمایش منوی جستجوی رقیب
    const embed = new EmbedBuilder()
      .setColor('#E74C3C') // رنگ قرمز برای بازی‌های رقابتی
      .setTitle(`🔍 جستجوی رقیب برای ${gameName}`)
      .setDescription('یک روش برای پیدا کردن رقیب انتخاب کنید. می‌توانید به صورت تصادفی با بازیکنان دیگر مچ شوید یا یک بازیکن مشخص را دعوت کنید!')
      .addFields(
        { name: '💰 ورودی بازی', value: `${getGameEntryFee(gameType)} Ccoin`, inline: true },
        { name: '🏆 جایزه برنده', value: `${getGameReward(gameType)} Ccoin`, inline: true },
        { name: '👥 بازیکنان در صف', value: `${matchmaking.getQueueLength(gameType)} نفر`, inline: true },
        { name: '⏱️ زمان انتظار', value: 'حداکثر 30 ثانیه', inline: true }
      )
      .setFooter({ text: 'برای شروع بازی باید Ccoin کافی داشته باشید' })
      .setTimestamp();
    
    // ایجاد دکمه‌های منوی جستجوی رقیب
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`matchmaking:random:${gameType}`)
          .setLabel('🔎 جستجوی تصادفی')
          .setStyle(ButtonStyle.Success)
          .setDisabled(user.wallet < getGameEntryFee(gameType)), // غیرفعال کردن اگر پول کافی نباشد
        new ButtonBuilder()
          .setCustomId(`matchmaking:invite:${gameType}`)
          .setLabel('📩 دعوت رقیب')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet < getGameEntryFee(gameType)), // غیرفعال کردن اگر پول کافی نباشد
        new ButtonBuilder()
          .setCustomId('competitive_games')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  } catch (error) {
    console.error(`Error in showing matchmaking menu for ${gameType}:`, error);
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ خطایی در نمایش منوی جستجوی رقیب رخ داد! لطفاً دوباره تلاش کنید.' });
    } else {
      await interaction.reply({ content: '❌ خطایی در نمایش منوی جستجوی رقیب رخ داد! لطفاً دوباره تلاش کنید.', ephemeral: true });
    }
  }
}

/**
 * شروع فرآیند جستجوی تصادفی رقیب
 * @param interaction برهم‌کنش با کاربر
 * @param gameType نوع بازی
 */
export async function startRandomMatchmaking(
  interaction: ButtonInteraction | MessageComponentInteraction,
  gameType: string
): Promise<void> {
  try {
    // بررسی کنیم که کاربر در دیتابیس وجود داشته باشد
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // بررسی موجودی کافی
    if (user.wallet < getGameEntryFee(gameType)) {
      await interaction.reply({
        content: `❌ موجودی شما برای این بازی کافی نیست! شما به ${getGameEntryFee(gameType)} Ccoin نیاز دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // حذف کاربر از تمام صف‌ها (برای جلوگیری از تداخل)
    matchmaking.removeFromQueue(interaction.user.id);
    
    // قرار دادن کاربر در صف انتظار
    matchmaking.addToQueue(interaction.user.id, interaction.user.username, gameType);
    
    // بررسی وجود رقیب در صف
    const opponent = matchmaking.findOpponent(gameType, interaction.user.id);
    
    if (opponent) {
      // رقیب پیدا شد - شروع بازی
      await interaction.reply({
        content: `🎮 رقیب پیدا شد! شما با <@${opponent.userId}> مچ شدید. بازی در حال شروع...`,
        ephemeral: true
      });
      
      // اینجا بازی را شروع می‌کنیم - با توجه به نوع بازی تابع مربوطه را صدا می‌زنیم
      await startGame(interaction, gameType, interaction.user.id, opponent.userId);
    } else {
      // رقیب پیدا نشد - منتظر می‌مانیم
      // ایجاد امبد برای نمایش وضعیت انتظار
      const embed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('🔍 در حال جستجوی رقیب...')
        .setDescription(`در حال یافتن رقیب برای بازی ${getGameDisplayName(gameType)} هستیم. لطفاً صبر کنید...`)
        .addFields(
          { name: '⏱️ زمان انتظار', value: 'حداکثر 30 ثانیه', inline: true },
          { name: '👥 وضعیت', value: 'در صف انتظار', inline: true }
        )
        .setFooter({ text: 'اگر تا 30 ثانیه رقیبی پیدا نشود، از صف خارج خواهید شد' })
        .setTimestamp();
      
      // دکمه لغو جستجو
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`matchmaking:cancel:${gameType}`)
            .setLabel('❌ لغو جستجو')
            .setStyle(ButtonStyle.Danger)
        );
      
      // ارسال پاسخ
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      
      // تنظیم تایمر برای بررسی مجدد صف بعد از 10 ثانیه
      setTimeout(async () => {
        try {
          // بررسی مجدد برای پیدا کردن رقیب
          const newOpponent = matchmaking.findOpponent(gameType, interaction.user.id);
          if (newOpponent) {
            // رقیب پیدا شد
            try {
              await interaction.editReply({
                content: `🎮 رقیب پیدا شد! شما با <@${newOpponent.userId}> مچ شدید. بازی در حال شروع...`,
                embeds: [],
                components: []
              });
              
              // شروع بازی
              await startGame(interaction, gameType, interaction.user.id, newOpponent.userId);
            } catch (e) {
              console.error("Error updating matchmaking result:", e);
            }
          } else {
            // هنوز رقیبی پیدا نشده
            try {
              const updatedEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🔍 همچنان در حال جستجو...')
                .setDescription(`هنوز رقیبی برای بازی ${getGameDisplayName(gameType)} پیدا نشده است. باز هم صبر می‌کنیم...`)
                .addFields(
                  { name: '⏱️ زمان انتظار باقیمانده', value: 'حداکثر 20 ثانیه', inline: true },
                  { name: '👥 وضعیت', value: 'در صف انتظار', inline: true }
                )
                .setFooter({ text: 'اگر تا 20 ثانیه رقیبی پیدا نشود، از صف خارج خواهید شد' })
                .setTimestamp();
              
              await interaction.editReply({ embeds: [updatedEmbed], components: [row] });
            } catch (e) {
              console.error("Error updating matchmaking status:", e);
            }
            
            // تایمر نهایی برای بررسی بعد از 20 ثانیه دیگر
            setTimeout(async () => {
              // آیا کاربر هنوز در صف است؟
              const finalOpponent = matchmaking.findOpponent(gameType, interaction.user.id);
              if (finalOpponent) {
                // در نهایت رقیب پیدا شد
                try {
                  await interaction.editReply({
                    content: `🎮 رقیب پیدا شد! شما با <@${finalOpponent.userId}> مچ شدید. بازی در حال شروع...`,
                    embeds: [],
                    components: []
                  });
                  
                  // شروع بازی
                  await startGame(interaction, gameType, interaction.user.id, finalOpponent.userId);
                } catch (e) {
                  console.error("Error updating final matchmaking result:", e);
                }
              } else {
                // رقیبی پیدا نشد - خروج از صف
                matchmaking.removeFromQueue(interaction.user.id, gameType);
                
                try {
                  const timeoutEmbed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('⏰ زمان جستجو به پایان رسید')
                    .setDescription(`متأسفانه رقیبی برای بازی ${getGameDisplayName(gameType)} پیدا نشد.`)
                    .addFields(
                      { name: '🔄 پیشنهاد', value: 'می‌توانید دوباره تلاش کنید یا یک بازیکن را مستقیماً دعوت کنید', inline: false }
                    )
                    .setFooter({ text: 'شما از صف خارج شدید' })
                    .setTimestamp();
                  
                  const retryRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                      new ButtonBuilder()
                        .setCustomId(`matchmaking:random:${gameType}`)
                        .setLabel('🔄 تلاش مجدد')
                        .setStyle(ButtonStyle.Success),
                      new ButtonBuilder()
                        .setCustomId(`matchmaking:invite:${gameType}`)
                        .setLabel('📩 دعوت رقیب')
                        .setStyle(ButtonStyle.Primary),
                      new ButtonBuilder()
                        .setCustomId('competitive_games')
                        .setLabel('🔙 بازگشت')
                        .setStyle(ButtonStyle.Secondary)
                    );
                  
                  await interaction.editReply({ embeds: [timeoutEmbed], components: [retryRow] });
                } catch (e) {
                  console.error("Error updating matchmaking timeout:", e);
                }
              }
            }, 20000);
          }
        } catch (error) {
          console.error("Error in matchmaking follow-up:", error);
        }
      }, 10000);
    }
  } catch (error) {
    console.error(`Error in random matchmaking for ${gameType}:`, error);
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ خطایی در فرآیند جستجوی رقیب رخ داد! لطفاً دوباره تلاش کنید.' });
    } else {
      await interaction.reply({ content: '❌ خطایی در فرآیند جستجوی رقیب رخ داد! لطفاً دوباره تلاش کنید.', ephemeral: true });
    }
  }
}

/**
 * نمایش منوی انتخاب رقیب برای دعوت به بازی
 * @param interaction برهم‌کنش با کاربر
 * @param gameType نوع بازی
 */
export async function showInviteOpponentMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  gameType: string
): Promise<void> {
  try {
    // در اینجا باید لیستی از کاربران آنلاین یا در دسترس را نمایش دهیم
    // برای سادگی، فعلاً یک پیام نمایش می‌دهیم که این قابلیت به زودی اضافه می‌شود
    
    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('📩 دعوت رقیب')
      .setDescription(`برای دعوت به بازی ${getGameDisplayName(gameType)}، لطفاً نام کاربری رقیب خود را وارد کنید. 
        شما می‌توانید آیدی دیسکورد کاربر را وارد کنید یا از منشن استفاده کنید.`)
      .addFields(
        { name: '💡 راهنمایی', value: 'می‌توانید از فرمت `@username` یا آیدی عددی کاربر استفاده کنید.', inline: false },
        { name: '⚠️ توجه', value: 'کاربر مورد نظر باید در سرور حضور داشته باشد و حساب Ccoin داشته باشد.', inline: false }
      )
      .setFooter({ text: 'دعوت شما برای 2 دقیقه معتبر خواهد بود' })
      .setTimestamp();
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`game:${gameType}:start`)
          .setLabel('🔙 بازگشت به منوی بازی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    
    // پیام توضیحی اضافه
    setTimeout(async () => {
      try {
        await interaction.followUp({
          content: '🔜 امکان دعوت مستقیم رقیب به زودی اضافه خواهد شد! فعلاً می‌توانید از جستجوی تصادفی استفاده کنید.',
          ephemeral: true
        });
      } catch (e) {
        console.error("Error sending follow-up message:", e);
      }
    }, 1000);
  } catch (error) {
    console.error(`Error in showing invite menu for ${gameType}:`, error);
    await interaction.reply({
      content: '❌ خطایی در نمایش منوی دعوت رقیب رخ داد! لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * لغو جستجوی رقیب
 * @param interaction برهم‌کنش با کاربر
 * @param gameType نوع بازی
 */
export async function cancelMatchmaking(
  interaction: ButtonInteraction,
  gameType: string
): Promise<void> {
  try {
    // حذف کاربر از صف بازی
    matchmaking.removeFromQueue(interaction.user.id, gameType);
    
    // ارسال پیام تأیید
    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('❌ جستجو لغو شد')
      .setDescription(`جستجوی رقیب برای بازی ${getGameDisplayName(gameType)} با موفقیت لغو شد.`)
      .setFooter({ text: 'شما از صف خارج شدید' })
      .setTimestamp();
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`game:${gameType}:start`)
          .setLabel('🔙 بازگشت به منوی بازی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.update({ embeds: [embed], components: [row] });
  } catch (error) {
    console.error(`Error in canceling matchmaking for ${gameType}:`, error);
    await interaction.reply({
      content: '❌ خطایی در لغو جستجوی رقیب رخ داد! لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * شروع یک بازی بین دو کاربر
 * @param interaction برهم‌کنش با کاربر
 * @param gameType نوع بازی
 * @param player1Id شناسه بازیکن اول
 * @param player2Id شناسه بازیکن دوم
 */
async function startGame(
  interaction: ButtonInteraction | MessageComponentInteraction,
  gameType: string,
  player1Id: string,
  player2Id: string
): Promise<void> {
  // بر اساس نوع بازی، تابع مربوطه را صدا می‌زنیم
  // این بخش در آینده با پیاده‌سازی کامل همه بازی‌ها تکمیل می‌شود
  
  // فعلاً به صورت پیش‌فرض یک پیام نمایش می‌دهیم
  try {
    await interaction.followUp({
      content: `🎮 بازی ${getGameDisplayName(gameType)} بین <@${player1Id}> و <@${player2Id}> آغاز شد! به زودی نتیجه اعلام خواهد شد.`,
      ephemeral: true
    });
    
    // در اینجا بر اساس نوع بازی، تابع مربوطه را صدا می‌زنیم
    // این بخش با پیاده‌سازی کامل بازی‌ها تکمیل می‌شود
    switch (gameType) {
      case 'dice_duel':
        // handleDiceDuel(interaction, 'match', player1Id, player2Id);
        break;
      case 'rps':
        // handleRockPaperScissors(interaction, 'match', player1Id, player2Id);
        break;
      // سایر بازی‌ها...
      default:
        console.log(`Game type ${gameType} is not fully implemented yet`);
    }
  } catch (error) {
    console.error(`Error starting game ${gameType}:`, error);
  }
}

/**
 * دریافت ورودی بازی بر اساس نوع بازی
 * @param gameType نوع بازی
 * @returns مقدار ورودی (به Ccoin)
 */
function getGameEntryFee(gameType: string): number {
  switch (gameType) {
    case 'dice_duel':
      return 50;
    case 'duel':
      return 50;
    case 'quick_poker':
      return 100;
    case 'type_race':
      return 20;
    case 'dart':
      return 30;
    case 'mafia':
      return 50;
    case 'bomb':
      return 40;
    case 'penalty':
      return 30;
    case 'archery':
      return 25;
    default:
      return 50; // مقدار پیش‌فرض
  }
}

/**
 * دریافت جایزه بازی بر اساس نوع بازی
 * @param gameType نوع بازی
 * @returns مقدار جایزه (به Ccoin)
 */
function getGameReward(gameType: string): number {
  switch (gameType) {
    case 'dice_duel':
      return 80;
    case 'duel':
      return 80;
    case 'quick_poker':
      return 180;
    case 'type_race':
      return 50;
    case 'dart':
      return 50;
    case 'mafia':
      return 80;
    case 'bomb':
      return 70;
    case 'penalty':
      return 50;
    case 'archery':
      return 40;
    default:
      return 80; // مقدار پیش‌فرض
  }
}

/**
 * دریافت نام نمایشی بازی بر اساس نوع بازی
 * @param gameType نوع بازی
 * @returns نام نمایشی
 */
function getGameDisplayName(gameType: string): string {
  switch (gameType) {
    case 'dice_duel':
      return '🎲 تاس دو نفره';
    case 'duel':
      return '⚔️ دوئل';
    case 'quick_poker':
      return '🃏 پوکر سریع';
    case 'type_race':
      return '⌨️ مسابقه سرعت تایپ';
    case 'dart':
      return '🎯 دارت رقابتی';
    case 'mafia':
      return '🕵️‍♂️ مافیا';
    case 'bomb':
      return '💣 بمب زمان‌دار';
    case 'penalty':
      return '⚽ پنالتی شانس';
    case 'archery':
      return '🏹 تیراندازی هدف';
    default:
      return gameType; // مقدار پیش‌فرض
  }
}