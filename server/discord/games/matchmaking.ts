import { ButtonInteraction, 
  ModalSubmitInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageComponentInteraction,
  TextChannel,
  User } from 'discord.js';
import { storage } from '../../storage';
import { client } from '../client';
import { BET_AMOUNT, PLAYER_HEALTH, WEAPON_DAMAGE } from './duel';

/**
 * ساختار داده‌ای برای نگهداری اطلاعات تایمرها
 */
interface CountdownTimer {
  id: string;            // شناسه منحصر به فرد تایمر
  intervalId: NodeJS.Timeout;  // شناسه اینتروال برای پاکسازی
  startTime: number;     // زمان شروع تایمر به میلی‌ثانیه
  duration: number;      // مدت زمان کل تایمر به ثانیه
  onTick: (remainingSeconds: number) => Promise<void>;  // تابع فراخوانی در هر تیک
  onComplete: () => Promise<void>;  // تابع فراخوانی در پایان زمان
}

// نگهداری لیست تایمرهای فعال
const activeTimers = new Map<string, CountdownTimer>();

/**
 * راه‌اندازی یک تایمر شمارنده معکوس
 * @param userId شناسه کاربر
 * @param totalSeconds کل ثانیه‌های تایمر
 * @param onTick تابعی که در هر ثانیه فراخوانی می‌شود
 * @param onComplete تابعی که در پایان تایمر فراخوانی می‌شود
 * @returns شناسه تایمر
 */
function startCountdownTimer(
  userId: string,
  totalSeconds: number,
  onTick: (remainingSeconds: number) => Promise<void>,
  onComplete: () => Promise<void>
): string {
  // تولید یک شناسه منحصر به فرد برای تایمر
  const timerId = `timer_${userId}_${Date.now()}`;
  const startTime = Date.now();
  
  // راه‌اندازی اینتروال برای به روزرسانی هر ثانیه
  const intervalId = setInterval(async () => {
    try {
      // محاسبه زمان سپری شده و باقیمانده
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      
      if (remainingSeconds <= 0) {
        // پاکسازی تایمر اگر زمان تمام شده
        clearInterval(intervalId);
        activeTimers.delete(timerId);
        
        // فراخوانی تابع اتمام زمان
        await onComplete();
      } else {
        // فراخوانی تابع تیک با زمان باقیمانده
        await onTick(remainingSeconds);
      }
    } catch (error) {
      console.error(`Error in countdown timer ${timerId}:`, error);
      
      // در صورت بروز خطا تایمر را پاک می‌کنیم
      clearInterval(intervalId);
      activeTimers.delete(timerId);
    }
  }, 1000);
  
  // ذخیره اطلاعات تایمر
  activeTimers.set(timerId, {
    id: timerId,
    intervalId,
    startTime,
    duration: totalSeconds,
    onTick,
    onComplete
  });
  
  return timerId;
}

/**
 * توقف و پاکسازی یک تایمر با شناسه
 * @param timerId شناسه تایمر
 */
function clearCountdownTimer(timerId: string): void {
  const timer = activeTimers.get(timerId);
  if (timer) {
    clearInterval(timer.intervalId);
    activeTimers.delete(timerId);
  }
}

/**
 * شروع مستقیم بازی دوئل بدون استفاده از تعامل
 * @param channelId شناسه کانال
 * @param player1Id شناسه بازیکن اول
 * @param player2Id شناسه بازیکن دوم
 * @param gameId شناسه بازی
 */
async function startDuelGameDirectly(channelId: string, player1Id: string, player2Id: string, gameId: string): Promise<void> {
  try {
    // ذخیره اطلاعات بازی با استفاده از ماژول duel
    const duelModule = await import('./duel');
    
    // استفاده از تابع جدید createDuelGameDirectly اگر موجود باشد
    if (typeof duelModule.createDuelGameDirectly === 'function') {
      const createdGameId = await duelModule.createDuelGameDirectly(player1Id, player2Id, channelId);
      if (createdGameId) {
        console.log(`Duel game created successfully with ID: ${createdGameId}`);
        return;
      }
    }
    
    // اگر تابع createDuelGameDirectly موجود نبود یا با خطا مواجه شد، روش قبلی را استفاده می‌کنیم
    console.log("Falling back to legacy duel game creation method");
    
    // دریافت کانال
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      console.error("Invalid channel for duel game");
      return;
    }

    // دریافت اطلاعات کاربران
    const player1 = await storage.getUserByDiscordId(player1Id);
    const player2 = await storage.getUserByDiscordId(player2Id);

    if (!player1 || !player2) {
      console.error("Players not found for duel game");
      return;
    }

    // بررسی موجودی کافی
    if (player1.wallet < BET_AMOUNT || player2.wallet < BET_AMOUNT) {
      console.error("Insufficient balance for duel game");
      return;
    }

    // کسر هزینه از بازیکنان
    await storage.addToWallet(player1.id, -BET_AMOUNT, 'game_bet', { gameType: 'duel' });
    await storage.addToWallet(player2.id, -BET_AMOUNT, 'game_bet', { gameType: 'duel' });

    // ایجاد رابط بازی
    const gameEmbed = new EmbedBuilder()
      .setColor('#F1C40F')
      .setTitle('⚔️ بازی دوئل')
      .setDescription(`بازی بین <@${player1Id}> و <@${player2Id}> شروع شد!`)
      .addFields(
        { name: '📊 وضعیت', value: 'انتخاب اسلحه توسط بازیکنان', inline: false },
        { name: `❤️ <@${player1Id}>`, value: `${PLAYER_HEALTH} / ${PLAYER_HEALTH}`, inline: true },
        { name: `❤️ <@${player2Id}>`, value: `${PLAYER_HEALTH} / ${PLAYER_HEALTH}`, inline: true },
        { name: '🔄 دور', value: '1', inline: false }
      )
      .setFooter({ text: 'هر بازیکن باید یک اسلحه انتخاب کند!' })
      .setTimestamp();

    // دکمه‌های انتخاب اسلحه
    const weaponButtonsRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`game:duel:weapon:${gameId}:sword`)
          .setLabel('🗡️ شمشیر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`game:duel:weapon:${gameId}:axe`)
          .setLabel('🪓 تبر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`game:duel:weapon:${gameId}:dagger`)
          .setLabel('🔪 خنجر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`game:duel:weapon:${gameId}:hammer`)
          .setLabel('🔨 چکش')
          .setStyle(ButtonStyle.Primary)
      );

    // ارسال پیام به کانال
    const message = await channel.send({
      content: `<@${player1Id}> <@${player2Id}>`,
      embeds: [gameEmbed],
      components: [weaponButtonsRow]
    });

    // ایجاد یک تعامل مصنوعی برای اتصال به handleDuel
    const channelObj = await client.channels.fetch(channelId);
    if (channelObj && channelObj instanceof TextChannel) {
      try {
        // استفاده از API مستقیم برای ذخیره بازی
        const gameData = {
          player1: player1Id,
          player2: player2Id,
          health1: PLAYER_HEALTH,
          health2: PLAYER_HEALTH,
          round: 1,
          channel: channelId,
          message: message.id,
          timestamp: Date.now(),
          lastAction: Date.now()
        };
        
        // استفاده از API داخلی برای اضافه کردن بازی به لیست بازی‌های فعال
        if (typeof duelModule.addActiveGame === 'function') {
          duelModule.addActiveGame(gameId, gameData);
        } else {
          console.error("addActiveGame function is not available in duel module");
          
          // یک روش جایگزین برای ارسال به کانال در صورت عدم وجود تابع
          channelObj.send({
            content: `⚠️ خطا در شروع بازی دوئل بین <@${player1Id}> و <@${player2Id}>. لطفاً دوباره تلاش کنید.`
          });
          
          // برگرداندن سکه‌ها به بازیکنان
          if (player1 && player2) {
            await storage.addToWallet(player1.id, BET_AMOUNT, 'game_refund', { gameType: 'duel' });
            await storage.addToWallet(player2.id, BET_AMOUNT, 'game_refund', { gameType: 'duel' });
          }
        }
      } catch (error) {
        console.error("Failed to initialize duel game:", error);
      }
    }

  } catch (error) {
    console.error("Error in startDuelGameDirectly:", error);
  }
}

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
        { name: '💰 ورودی بازی', value: `**\`${getGameEntryFee(gameType)} Ccoin\`**`, inline: true },
        { name: '🏆 جایزه برنده', value: `**\`${getGameReward(gameType)} Ccoin\`**`, inline: true },
        { name: '👥 بازیکنان در صف', value: `**\`${matchmaking.getQueueLength(gameType)}\` نفر**`, inline: true },
        { name: '⏱️ زمان انتظار', value: '**\`30 ثانیه\`**', inline: true }
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
      // تعریف زمان کل انتظار (30 ثانیه)
      const TOTAL_WAIT_TIME_SECONDS = 30;
      
      // رقیب پیدا نشد - منتظر می‌مانیم
      // ایجاد امبد برای نمایش وضعیت انتظار با تایمر دیسکورد استایل
      const embed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('🔍 در حال جستجوی رقیب...')
        .setDescription(`در حال یافتن رقیب برای بازی ${getGameDisplayName(gameType)} هستیم. لطفاً صبر کنید...`)
        .addFields(
          { name: '⏱️ زمان انتظار', value: `**\`${TOTAL_WAIT_TIME_SECONDS} ثانیه\`** باقیمانده`, inline: true },
          { name: '👥 بازیکنان در صف', value: `**\`${matchmaking.getQueueLength(gameType)}\`** نفر`, inline: true }
        )
        .setFooter({ text: 'اگر رقیبی پیدا نشود، از صف خارج خواهید شد' })
        .setTimestamp();
      
      // دکمه لغو جستجو
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`matchmaking:cancel:${gameType}`)
            .setLabel('❌ لغو جستجو')
            .setStyle(ButtonStyle.Danger)
        );
      
      // ارسال پاسخ اولیه
      const reply = await interaction.reply({ 
        embeds: [embed], 
        components: [row], 
        ephemeral: true,
        fetchReply: true  // برای دریافت پاسخ کامل
      });
      
      // ثبت زمان شروع
      const startTime = Date.now();
      let timerId: string | null = null;
      let isGameStarted = false;  // برای جلوگیری از اجرای همزمان چندین تابع
      
      // تابع به‌روزرسانی تایمر در هر ثانیه
      const updateTimer = async (remainingSeconds: number): Promise<void> => {
        try {
          // بررسی برای پیدا کردن رقیب
          const matchedOpponent = matchmaking.findOpponent(gameType, interaction.user.id);
          
          // اگر رقیب پیدا شد، بازی را شروع کن
          if (matchedOpponent && !isGameStarted) {
            isGameStarted = true;
            
            // پاکسازی تایمر
            if (timerId) {
              clearCountdownTimer(timerId);
              timerId = null;
            }
            
            // اعلام پیدا شدن رقیب
            await interaction.editReply({
              content: `🎮 رقیب پیدا شد! شما با <@${matchedOpponent.userId}> مچ شدید. بازی در حال شروع...`,
              embeds: [],
              components: []
            });
            
            // شروع بازی
            await startGame(interaction, gameType, interaction.user.id, matchedOpponent.userId);
            return;
          }
          
          // به‌روزرسانی امبد با زمان باقیمانده جدید و تعداد بازیکنان در صف
          // تعیین رنگ تایمر بر اساس زمان باقیمانده
          let timerColor = '🟢';
          if (remainingSeconds <= 10) {
            timerColor = '🔴';
          } else if (remainingSeconds <= 20) {
            timerColor = '🟡';
          }
          
          // فرمت نمایش تایمر با هاله سیاه
          const timeDisplay = `${timerColor} **\`${remainingSeconds} ثانیه\`** باقیمانده`;
          
          // دریافت تعداد واقعی کاربران در صف برای نمایش زنده
          const currentQueueLength = matchmaking.getQueueLength(gameType);
          
          // تغییر رنگ تایمر بر اساس زمان باقیمانده
          const updatedEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('🔍 در حال جستجوی رقیب...')
            .setDescription(`در حال یافتن رقیب برای بازی ${getGameDisplayName(gameType)} هستیم. لطفاً صبر کنید...`)
            .addFields(
              { name: '⏱️ زمان انتظار', value: timeDisplay, inline: true },
              { name: '👥 بازیکنان در صف', value: `**\`${currentQueueLength}\`** نفر`, inline: true }
            )
            .setFooter({ text: 'اگر رقیبی پیدا نشود، از صف خارج خواهید شد' })
            .setTimestamp();
          
          await interaction.editReply({ embeds: [updatedEmbed], components: [row] });
        } catch (error) {
          console.error("Error updating countdown:", error);
        }
      };
      
      // تابع اجرای پایان زمان
      const onTimerComplete = async (): Promise<void> => {
        // اگر بازی قبلاً شروع شده، کاری انجام نده
        if (isGameStarted) return;
        
        try {
          // بررسی نهایی برای پیدا کردن رقیب
          const finalOpponent = matchmaking.findOpponent(gameType, interaction.user.id);
          
          if (finalOpponent) {
            // در آخرین لحظه رقیب پیدا شد
            isGameStarted = true;
            
            await interaction.editReply({
              content: `🎮 رقیب پیدا شد! شما با <@${finalOpponent.userId}> مچ شدید. بازی در حال شروع...`,
              embeds: [],
              components: []
            });
            
            // شروع بازی
            await startGame(interaction, gameType, interaction.user.id, finalOpponent.userId);
          } else {
            // رقیبی پیدا نشد - خروج از صف
            matchmaking.removeFromQueue(interaction.user.id, gameType);
            
            const timeoutEmbed = new EmbedBuilder()
              .setColor('#E74C3C')
              .setTitle('⏰ زمان جستجو به پایان رسید')
              .setDescription(`متأسفانه رقیبی برای بازی ${getGameDisplayName(gameType)} پیدا نشد.`)
              .addFields(
                { name: '⏱️ زمان انتظار', value: `🔴 **\`0 ثانیه\`** باقیمانده`, inline: true },
                { name: '👥 بازیکنان در صف', value: `**\`${matchmaking.getQueueLength(gameType)}\`** نفر`, inline: true },
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
          }
        } catch (error) {
          console.error("Error in timer completion:", error);
        }
      };
      
      // راه‌اندازی تایمر شمارنده معکوس
      timerId = startCountdownTimer(
        interaction.user.id,
        TOTAL_WAIT_TIME_SECONDS,
        updateTimer,
        onTimerComplete
      );
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
      .addFields(
        { name: '⏱️ وضعیت', value: `**\`جستجو لغو شد\`**`, inline: true },
        { name: '👥 بازیکنان در صف', value: `**\`${matchmaking.getQueueLength(gameType)}\`** نفر`, inline: true }
      )
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
  
  try {
    // بررسی اینکه آیا بازی پیاده‌سازی شده است یا خیر
    let isImplemented = true;
    
    switch (gameType) {
      case 'dice_duel':
        // نمایش پیام بازی در حال توسعه
        isImplemented = false;
        // این قسمت بعداً تکمیل خواهد شد
        break;
      case 'duel':
        // بازی دوئل پیاده‌سازی شده است
        isImplemented = true;
        
        try {
          // فراخوانی بازی دوئل
          const { handleDuel } = await import('./duel');
          // ارسال یک پیام اولیه قبل از شروع بازی
          await interaction.followUp({
            content: `🎮 در حال آماده‌سازی بازی ${getGameDisplayName(gameType)} بین <@${player1Id}> و <@${player2Id}>...`,
            ephemeral: true
          });
          
          // راه‌اندازی بازی با کمی تأخیر برای جلوگیری از تداخل
          setTimeout(async () => {
            try {
              // به جای استفاده از تعامل اصلی، یک پیام جدید به کانال ارسال می‌کنیم
              // و از آن برای راه‌اندازی بازی استفاده می‌کنیم
              if (interaction.channel) {
                // ایجاد یک بازی دوئل جدید بدون استفاده از تعامل قبلی
                // برای حل مشکل ایجاد دو بازی موازی، همیشه ID کوچکتر را اول قرار می‌دهیم
                const sortedPlayers = [player1Id, player2Id].sort();
                const gameId = `duel_${sortedPlayers[0]}_${sortedPlayers[1]}`;
                
                // قبل از ایجاد بازی، بررسی کنیم که آیا بازی با این شناسه قبلاً ایجاد شده است
                const duelModule = await import('./duel');
                // اگر تابع بررسی وجود بازی وجود دارد، از آن استفاده می‌کنیم
                if (typeof duelModule.isGameActive === 'function' && duelModule.isGameActive(gameId)) {
                  console.log(`Game with ID ${gameId} is already active, skipping creation.`);
                } else {
                  // ایجاد بازی جدید
                  await startDuelGameDirectly(interaction.channel.id, player1Id, player2Id, gameId);
                }
              } else {
                console.error("Channel not found for starting the game");
              }
            } catch (error) {
              console.error(`Error starting duel game:`, error);
              // در صورت خطا، بازگرداندن Ccoin به هر دو بازیکن
              const player1 = await storage.getUserByDiscordId(player1Id);
              const player2 = await storage.getUserByDiscordId(player2Id);
              
              if (player1) {
                await storage.addToWallet(player1.id, getGameEntryFee(gameType), 'game_refund', { gameType: gameType });
              }
              
              if (player2) {
                await storage.addToWallet(player2.id, getGameEntryFee(gameType), 'game_refund', { gameType: gameType });
              }
              
              try {
                // تلاش برای ارسال پیام خطا
                await interaction.followUp({
                  content: `⚠️ خطایی در شروع بازی ${getGameDisplayName(gameType)} رخ داد. مبلغ ${getGameEntryFee(gameType)} Ccoin به کیف پول شما برگردانده شد. لطفاً دوباره تلاش کنید.`,
                  ephemeral: true
                });
              } catch (innerError) {
                console.error("Failed to send error message:", innerError);
              }
            }
          }, 1000);
        } catch (error) {
          console.error(`Error preparing duel game:`, error);
          isImplemented = false;
        }
        break;
      case 'rps':
        // handleRockPaperScissors(interaction, 'match', player1Id, player2Id);
        // فعلاً پیاده‌سازی نشده
        isImplemented = false;
        break;
      // سایر بازی‌ها...
      default:
        isImplemented = false;
        console.log(`Game type ${gameType} is not fully implemented yet`);
    }
    
    if (isImplemented) {
      // اگر بازی پیاده‌سازی شده بود، پیام شروع بازی نمایش داده می‌شود
      await interaction.followUp({
        content: `🎮 بازی ${getGameDisplayName(gameType)} بین <@${player1Id}> و <@${player2Id}> آغاز شد! به زودی نتیجه اعلام خواهد شد.`,
        ephemeral: true
      });
    } else {
      // اگر بازی هنوز پیاده‌سازی نشده بود، پیام خطا نمایش داده می‌شود
      console.log(`Game type ${gameType} is not fully implemented yet`);
      
      // برگرداندن Ccoin به هر دو بازیکن
      const player1 = await storage.getUserByDiscordId(player1Id);
      const player2 = await storage.getUserByDiscordId(player2Id);
      
      if (player1) {
        await storage.addToWallet(player1.id, getGameEntryFee(gameType), 'game_refund', { gameType: gameType });
      }
      
      if (player2) {
        await storage.addToWallet(player2.id, getGameEntryFee(gameType), 'game_refund', { gameType: gameType });
      }
      
      // نمایش پیام خطا به کاربران
      await interaction.followUp({
        content: `⚠️ متأسفانه بازی ${getGameDisplayName(gameType)} هنوز به طور کامل پیاده‌سازی نشده است. مبلغ ${getGameEntryFee(gameType)} Ccoin به کیف پول شما برگردانده شد. لطفاً بعداً مجدداً تلاش کنید.`,
        ephemeral: false
      });
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