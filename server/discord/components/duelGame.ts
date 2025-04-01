/**
 * بازی دوئل
 * 
 * در این بازی، دو بازیکن با یکدیگر مبارزه می‌کنند و با استفاده از توانایی‌های مختلف
 * تلاش می‌کنند یکدیگر را شکست دهند. هر بازیکن در هر نوبت می‌تواند حمله کند، دفاع کند،
 * یا از یک مهارت ویژه استفاده کند. برنده بازی جایزه‌ای دریافت می‌کند.
 * 
 * @module duelGame
 * @requires discord.js
 * @requires ../storage
 */

import { 
  ButtonInteraction, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  MessageComponentInteraction,
  User
} from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../storage';
import { log } from '../../vite';
import { convertToUser } from '../utils/helpers';
import { DUEL_EMOJI, ECONOMY_EMOJI, GENERAL_EMOJI, GAME_EMOJI, TIME_EMOJI } from '../utils/emojiUtils';

/**
 * انواع حملات در بازی دوئل
 */
enum AttackType {
  NORMAL = 'normal',
  HEAVY = 'heavy',
  RAPID = 'rapid',
  SPECIAL = 'special'
}

/**
 * انواع دفاع در بازی دوئل
 */
enum DefenseType {
  BLOCK = 'block',
  DODGE = 'dodge',
  COUNTER = 'counter',
  HEAL = 'heal'
}

/**
 * کلاس آیتم‌های قابل استفاده در دوئل
 */
interface DuelItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: {
    damage?: number;
    healing?: number;
    defense?: number;
    stamina?: number;
    stun?: boolean;
    bleed?: boolean;
    poison?: boolean;
    duration?: number;
  };
  type: 'weapon' | 'shield' | 'potion' | 'spell';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cooldown: number;
}

/**
 * کلاس بازیکن دوئل
 */
interface DuelPlayer {
  id: string;
  username: string;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  attack: number;
  defense: number;
  critChance: number;
  critMultiplier: number;
  items: DuelItem[];
  effects: {
    stunned?: number;
    bleeding?: number;
    poisoned?: number;
    strengthened?: number;
    weakened?: number;
  };
  lastAction?: {
    type: 'attack' | 'defense' | 'item';
    value: string;
  };
  isReady: boolean;
}

/**
 * مدل داده بازی دوئل
 */
interface DuelGame {
  id: string;
  channelId: string;
  player1: DuelPlayer;
  player2: DuelPlayer;
  turn: number;
  currentTurnPlayerId: string;
  status: 'waiting' | 'active' | 'completed';
  betAmount: number;
  messageId?: string;
  winner?: string;
  startTime: Date;
  lastActionTime: Date;
  actionHistory: string[];
}

// آیتم‌های پیش‌فرض برای بازی
const DEFAULT_ITEMS: DuelItem[] = [
  {
    id: 'sword',
    name: 'شمشیر فولادی',
    description: 'یک شمشیر تیز و برنده. حمله‌ی شما را افزایش می‌دهد.',
    icon: '⚔️',
    effects: {
      damage: 15,
    },
    type: 'weapon',
    rarity: 'common',
    cooldown: 0
  },
  {
    id: 'shield',
    name: 'سپر محافظ',
    description: 'یک سپر محکم. دفاع شما را افزایش می‌دهد.',
    icon: '🛡️',
    effects: {
      defense: 10,
    },
    type: 'shield',
    rarity: 'common',
    cooldown: 0
  },
  {
    id: 'health_potion',
    name: 'معجون سلامتی',
    description: 'جان شما را بازیابی می‌کند.',
    icon: '🧪',
    effects: {
      healing: 30,
    },
    type: 'potion',
    rarity: 'uncommon',
    cooldown: 2
  },
  {
    id: 'fire_spell',
    name: 'طلسم آتش',
    description: 'دشمن را در آتش می‌سوزاند و آسیب زیادی وارد می‌کند.',
    icon: '🔥',
    effects: {
      damage: 25,
      stamina: -20
    },
    type: 'spell',
    rarity: 'rare',
    cooldown: 3
  }
];

// ذخیره بازی‌های فعال
const activeDuelGames = new Map<string, DuelGame>();

/**
 * شروع یک دوئل جدید
 * @param interaction 
 */
export async function startDuel(interaction: ButtonInteraction) {
  try {
    // بررسی وجود کاربر در دیتابیس
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.reply({
        content: '❌ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور `/menu` استفاده نمایید.',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات بازی
    const gameSettings = await storage.getGameSettings();
    const duelBetAmount = gameSettings.duelBetAmount || 100;

    // بررسی موجودی کاربر
    if (user.wallet < duelBetAmount) {
      await interaction.reply({
        content: `❌ برای شروع دوئل، شما به حداقل ${duelBetAmount} سکه نیاز دارید.`,
        ephemeral: true
      });
      return;
    }

    // ایجاد مدل انتخاب حریف
    const modal = new ModalBuilder()
      .setCustomId('duel_opponent_modal')
      .setTitle('🎮 شروع دوئل جدید');

    // اضافه کردن فیلد برای وارد کردن آیدی حریف
    const opponentInput = new TextInputBuilder()
      .setCustomId('opponent_id')
      .setLabel('🎯 آیدی دیسکورد یا نام کاربری حریف')
      .setPlaceholder('لطفاً آیدی دیسکورد یا نام کاربری حریف را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const betAmountInput = new TextInputBuilder()
      .setCustomId('bet_amount')
      .setLabel('💰 مقدار شرط بندی (سکه)')
      .setPlaceholder(`پیشنهاد: ${duelBetAmount}`)
      .setValue(duelBetAmount.toString())
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // ایجاد اکشن‌رو برای فیلدها
    const opponentRow = new ActionRowBuilder<TextInputBuilder>().addComponents(opponentInput);
    const betAmountRow = new ActionRowBuilder<TextInputBuilder>().addComponents(betAmountInput);

    // افزودن اکشن‌رو به مدل
    modal.addComponents(opponentRow, betAmountRow);

    // نمایش مدل به کاربر
    await interaction.showModal(modal);

  } catch (error) {
    log(`Error starting duel: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در شروع دوئل رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * پردازش فرم انتخاب حریف
 * @param interaction 
 */
export async function handleDuelOpponentModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    // دریافت مقادیر وارد شده
    const opponentId = interaction.fields.getTextInputValue('opponent_id');
    const betAmountText = interaction.fields.getTextInputValue('bet_amount');
    
    // تبدیل مقدار شرط به عدد
    const betAmount = parseInt(betAmountText);
    if (isNaN(betAmount) || betAmount <= 0) {
      await interaction.editReply({
        content: '❌ مقدار شرط باید یک عدد مثبت باشد.'
      });
      return;
    }

    // بررسی اعتبار آیدی حریف
    let opponent;
    if (opponentId.match(/^\d+$/)) {
      // اگر آیدی عددی است، به عنوان آیدی دیسکورد در نظر گرفته می‌شود
      opponent = await storage.getUserByDiscordId(opponentId);
    } else {
      // در غیر این صورت، به عنوان نام کاربری در نظر گرفته می‌شود
      const allUsers = await storage.getAllUsers();
      opponent = allUsers.find(u => u.username.toLowerCase() === opponentId.toLowerCase());
    }

    // بررسی وجود کاربر
    if (!opponent) {
      await interaction.editReply({
        content: '❌ کاربر مورد نظر یافت نشد. لطفاً از صحت آیدی یا نام کاربری وارد شده اطمینان حاصل کنید.'
      });
      return;
    }

    // بررسی اینکه حریف خود کاربر نباشد
    if (opponent.discordId === interaction.user.id) {
      await interaction.editReply({
        content: '❌ شما نمی‌توانید با خودتان دوئل کنید!'
      });
      return;
    }

    // دریافت اطلاعات کاربر درخواست دهنده
    const challenger = await storage.getUserByDiscordId(interaction.user.id);
    if (!challenger) {
      await interaction.editReply({
        content: '❌ اطلاعات کاربری شما یافت نشد. لطفاً دوباره تلاش کنید.'
      });
      return;
    }

    // بررسی موجودی کاربر
    if (challenger.wallet < betAmount) {
      await interaction.editReply({
        content: `❌ موجودی شما کافی نیست. شما فقط ${challenger.wallet} سکه دارید.`
      });
      return;
    }

    // بررسی موجودی حریف
    if (opponent.wallet < betAmount) {
      await interaction.editReply({
        content: `❌ حریف شما فقط ${opponent.wallet} سکه دارد و نمی‌تواند در این مبلغ شرط‌بندی کند.`
      });
      return;
    }

    // ایجاد شناسه منحصر به فرد برای دوئل
    const duelId = uuidv4();

    // ایجاد آبجکت بازی
    const duelGame: DuelGame = {
      id: duelId,
      channelId: interaction.channelId,
      player1: createDuelPlayer(challenger.discordId, challenger.username),
      player2: createDuelPlayer(opponent.discordId, opponent.username),
      turn: 0,
      currentTurnPlayerId: challenger.discordId,
      status: 'waiting',
      betAmount: betAmount,
      startTime: new Date(),
      lastActionTime: new Date(),
      actionHistory: []
    };

    // ذخیره‌سازی در مپ
    activeDuelGames.set(duelId, duelGame);

    // ایجاد امبد دعوت به دوئل
    const inviteEmbed = new EmbedBuilder()
      .setTitle(`${DUEL_EMOJI.SWORD} دعوت به دوئل!`)
      .setDescription(`<@${challenger.discordId}> شما را به یک دوئل هیجان‌انگیز دعوت کرده است!`)
      .setColor(Colors.Gold)
      .addFields(
        { name: `${ECONOMY_EMOJI.COIN} مقدار شرط`, value: `${betAmount} سکه`, inline: true },
        { name: `${GAME_EMOJI.GAME} نوع بازی`, value: 'دوئل مبارزه‌ای', inline: true },
        { name: `${TIME_EMOJI.TIMER} زمان انقضا`, value: '2 دقیقه', inline: true }
      )
      .setFooter({ text: `برای شروع یا رد درخواست، از دکمه‌های زیر استفاده کنید. ${GENERAL_EMOJI.INFO}` })
      .setTimestamp();

    // ایجاد دکمه‌های پذیرش یا رد درخواست
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`duel_accept_${duelId}`)
          .setLabel('قبول دوئل')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`duel_decline_${duelId}`)
          .setLabel('رد درخواست')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Danger)
      );

    // ارسال پیام دعوت به کانال
    const message = await interaction.channel?.send({
      content: `<@${opponent.discordId}> - یک دعوت به دوئل دریافت کردی!`,
      embeds: [inviteEmbed],
      components: [row]
    });

    // ذخیره آیدی پیام
    if (message) {
      duelGame.messageId = message.id;
      activeDuelGames.set(duelId, duelGame);
    }

    // پاسخ به کاربر
    await interaction.editReply({
      content: `✅ درخواست دوئل با موفقیت برای ${opponent.username} ارسال شد.`
    });

    // تنظیم تایمر برای انقضای درخواست
    setTimeout(async () => {
      const game = activeDuelGames.get(duelId);
      if (game && game.status === 'waiting') {
        // اگر هنوز در حالت انتظار است، یعنی پاسخی داده نشده
        activeDuelGames.delete(duelId);

        try {
          // به‌روزرسانی پیام
          const expiredEmbed = new EmbedBuilder()
            .setTitle(`${TIME_EMOJI.TIMER} درخواست دوئل منقضی شد`)
            .setDescription(`درخواست دوئل از طرف <@${challenger.discordId}> به <@${opponent.discordId}> به دلیل عدم پاسخ منقضی شد.`)
            .setColor(Colors.Grey)
            .setFooter({ text: `زمان انتظار برای پاسخ به پایان رسید. ${GENERAL_EMOJI.INFO}` })
            .setTimestamp();

          if (game.messageId) {
            const channel = await interaction.client.channels.fetch(interaction.channelId);
            if (channel?.isTextBased()) {
              const message = await channel.messages.fetch(game.messageId);
              await message.edit({
                embeds: [expiredEmbed],
                components: []
              });
            }
          }
        } catch (error) {
          log(`Error updating expired duel invite: ${error}`, 'warn');
        }
      }
    }, 2 * 60 * 1000); // 2 دقیقه
  } catch (error) {
    log(`Error handling duel opponent modal: ${error}`, 'error');
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: '❌ خطایی در پردازش اطلاعات رخ داد. لطفاً دوباره تلاش کنید.'
      });
    } else {
      await interaction.reply({
        content: '❌ خطایی در پردازش اطلاعات رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * ایجاد یک بازیکن جدید برای دوئل
 * @param discordId آیدی دیسکورد بازیکن
 * @param username نام کاربری بازیکن
 * @returns بازیکن جدید
 */
function createDuelPlayer(discordId: string, username: string): DuelPlayer {
  return {
    id: discordId,
    username: username,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    attack: 15,
    defense: 10,
    critChance: 0.15,
    critMultiplier: 1.5,
    items: [...DEFAULT_ITEMS],
    effects: {},
    isReady: false
  };
}

/**
 * پذیرش درخواست دوئل
 * @param interaction 
 */
export async function acceptDuel(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه دوئل
    const duelId = interaction.customId.replace('duel_accept_', '');
    
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame) {
      await interaction.reply({
        content: '❌ دوئل مورد نظر یافت نشد یا منقضی شده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر همان حریف دعوت شده است
    if (interaction.user.id !== duelGame.player2.id) {
      await interaction.reply({
        content: '❌ فقط کاربر دعوت شده می‌تواند این درخواست را قبول کند.',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت دوئل
    if (duelGame.status !== 'waiting') {
      await interaction.reply({
        content: '❌ این دوئل قبلاً پذیرفته یا رد شده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی مجدد موجودی حریف
    const opponent = await storage.getUserByDiscordId(interaction.user.id);
    if (!opponent) {
      await interaction.reply({
        content: '❌ اطلاعات کاربری شما یافت نشد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
      return;
    }

    if (opponent.wallet < duelGame.betAmount) {
      await interaction.reply({
        content: `❌ موجودی شما کافی نیست. شما فقط ${opponent.wallet} سکه دارید.`,
        ephemeral: true
      });
      return;
    }

    // بررسی مجدد موجودی چلنجر
    const challenger = await storage.getUserByDiscordId(duelGame.player1.id);
    if (!challenger) {
      await interaction.reply({
        content: '❌ اطلاعات دعوت کننده یافت نشد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
      return;
    }

    if (challenger.wallet < duelGame.betAmount) {
      await interaction.reply({
        content: `❌ موجودی دعوت کننده کافی نیست. ایشان فقط ${challenger.wallet} سکه دارند.`,
        ephemeral: true
      });
      return;
    }

    // کسر هزینه دوئل از کیف پول هر دو نفر
    await storage.updateUserWallet(convertToUser(challenger), -duelGame.betAmount, 'game_loss', 'شرط‌بندی در دوئل');
    await storage.updateUserWallet(convertToUser(opponent), -duelGame.betAmount, 'game_loss', 'شرط‌بندی در دوئل');

    // به‌روزرسانی وضعیت بازی
    duelGame.status = 'active';
    duelGame.player1.isReady = true;
    duelGame.player2.isReady = true;
    duelGame.lastActionTime = new Date();
    activeDuelGames.set(duelId, duelGame);

    // آماده‌سازی امبد بازی
    const gameEmbed = createDuelGameEmbed(duelGame);

    // آماده‌سازی دکمه‌های اکشن برای بازیکن فعلی
    const actionButtons = createDuelActionButtons(duelGame, duelGame.currentTurnPlayerId);

    // به‌روزرسانی پیام دوئل
    await interaction.update({
      content: `${DUEL_EMOJI.DUEL} **دوئل شروع شد!** ${GENERAL_EMOJI.TURN} نوبت <@${duelGame.currentTurnPlayerId}> است.`,
      embeds: [gameEmbed],
      components: actionButtons
    });

    // افزودن به تاریخچه اکشن‌ها
    duelGame.actionHistory.push(`🎮 دوئل بین **${duelGame.player1.username}** و **${duelGame.player2.username}** آغاز شد!`);
    activeDuelGames.set(duelId, duelGame);

    // تنظیم تایمر برای اتمام خودکار بازی در صورت عدم فعالیت
    setTimeout(() => checkDuelTimeout(duelId), 5 * 60 * 1000); // 5 دقیقه
  } catch (error) {
    log(`Error accepting duel: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در پذیرش دوئل رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * رد درخواست دوئل
 * @param interaction 
 */
export async function declineDuel(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه دوئل
    const duelId = interaction.customId.replace('duel_decline_', '');
    
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame) {
      await interaction.reply({
        content: '❌ دوئل مورد نظر یافت نشد یا منقضی شده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر همان حریف دعوت شده است
    if (interaction.user.id !== duelGame.player2.id) {
      // اجازه می‌دهیم دعوت کننده هم بتواند درخواست را لغو کند
      if (interaction.user.id !== duelGame.player1.id) {
        await interaction.reply({
          content: '❌ فقط طرفین دوئل می‌توانند این درخواست را لغو کنند.',
          ephemeral: true
        });
        return;
      }
    }

    // بررسی وضعیت دوئل
    if (duelGame.status !== 'waiting') {
      await interaction.reply({
        content: '❌ این دوئل قبلاً پذیرفته یا رد شده است.',
        ephemeral: true
      });
      return;
    }

    // حذف دوئل از لیست بازی‌های فعال
    activeDuelGames.delete(duelId);

    // به‌روزرسانی پیام
    const declineEmbed = new EmbedBuilder()
      .setTitle(`${GENERAL_EMOJI.ERROR} درخواست دوئل رد شد`)
      .setDescription(`<@${duelGame.player2.id}> درخواست دوئل <@${duelGame.player1.id}> را رد کرد.`)
      .setColor(Colors.Red)
      .setFooter({ text: `درخواست دوئل توسط بازیکن رد شد. ${GENERAL_EMOJI.INFO}` })
      .setTimestamp();

    await interaction.update({
      content: null,
      embeds: [declineEmbed],
      components: []
    });
  } catch (error) {
    log(`Error declining duel: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در رد درخواست دوئل رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * ایجاد امبد نمایش وضعیت بازی
 * @param duelGame بازی دوئل
 * @returns امبد دیسکورد
 */
function createDuelGameEmbed(duelGame: DuelGame): EmbedBuilder {
  const { player1, player2 } = duelGame;
  
  // محاسبه وضعیت نوار سلامتی
  const healthBarLength = 20;
  const p1HealthBar = createProgressBar(player1.health, player1.maxHealth, healthBarLength, '🟩', '⬜');
  const p2HealthBar = createProgressBar(player2.health, player2.maxHealth, healthBarLength, '🟦', '⬜');
  
  // محاسبه وضعیت نوار استقامت
  const staminaBarLength = 10;
  const p1StaminaBar = createProgressBar(player1.stamina, player1.maxStamina, staminaBarLength, '🟨', '⬜');
  const p2StaminaBar = createProgressBar(player2.stamina, player2.maxStamina, staminaBarLength, '🟨', '⬜');

  // ایجاد لیست اثرات فعال
  const p1Effects = getEffectsText(player1.effects);
  const p2Effects = getEffectsText(player2.effects);

  // ایجاد متن آخرین اکشن‌ها
  const lastActions = duelGame.actionHistory.slice(-5).join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`${DUEL_EMOJI.DUEL} دوئل حماسی: ${player1.username} ${DUEL_EMOJI.VS} ${player2.username}`)
    .setDescription(`${ECONOMY_EMOJI.COIN} جایزه: **${duelGame.betAmount * 2} سکه**\n${TIME_EMOJI.CLOCK} نوبت فعلی: **${duelGame.turn + 1}**\n${GENERAL_EMOJI.USER} نوبت بازی: <@${duelGame.currentTurnPlayerId}>`)
    .setColor(Colors.Gold)
    .addFields(
      { 
        name: `${DUEL_EMOJI.PLAYER} ${player1.username}`,
        value: `${DUEL_EMOJI.HEALTH} جان: ${player1.health}/${player1.maxHealth} ${p1HealthBar}\n${DUEL_EMOJI.STAMINA} استقامت: ${player1.stamina}/${player1.maxStamina} ${p1StaminaBar}\n${DUEL_EMOJI.ATTACK} قدرت حمله: ${player1.attack}\n${DUEL_EMOJI.DEFENSE} قدرت دفاعی: ${player1.defense}\n${p1Effects}`,
        inline: true 
      },
      { 
        name: `${DUEL_EMOJI.PLAYER} ${player2.username}`,
        value: `${DUEL_EMOJI.HEALTH} جان: ${player2.health}/${player2.maxHealth} ${p2HealthBar}\n${DUEL_EMOJI.STAMINA} استقامت: ${player2.stamina}/${player2.maxStamina} ${p2StaminaBar}\n${DUEL_EMOJI.ATTACK} قدرت حمله: ${player2.attack}\n${DUEL_EMOJI.DEFENSE} قدرت دفاعی: ${player2.defense}\n${p2Effects}`,
        inline: true 
      },
      {
        name: `${GENERAL_EMOJI.HISTORY} تاریخچه نبرد`,
        value: lastActions || 'هنوز اقدامی انجام نشده است...'
      }
    )
    .setFooter({ text: `بازی‌های رقابتی ربات CCoin ${GENERAL_EMOJI.GAME}` })
    .setTimestamp();

  return embed;
}

/**
 * ایجاد دکمه‌های اکشن برای بازیکن
 * @param duelGame بازی دوئل
 * @param playerId آیدی بازیکن فعلی
 * @returns آرایه‌ای از اکشن‌روها
 */
function createDuelActionButtons(duelGame: DuelGame, playerId: string): ActionRowBuilder<ButtonBuilder>[] {
  // ردیف اول - حمله و دفاع
  const actionRow1 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`duel_attack_normal_${duelGame.id}`)
        .setLabel('حمله معمولی')
        .setEmoji('⚔️')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(duelGame.currentTurnPlayerId !== playerId),
      new ButtonBuilder()
        .setCustomId(`duel_attack_heavy_${duelGame.id}`)
        .setLabel('حمله سنگین')
        .setEmoji('🔪')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(duelGame.currentTurnPlayerId !== playerId),
      new ButtonBuilder()
        .setCustomId(`duel_defense_block_${duelGame.id}`)
        .setLabel('سپر دفاعی')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(duelGame.currentTurnPlayerId !== playerId),
      new ButtonBuilder()
        .setCustomId(`duel_defense_dodge_${duelGame.id}`)
        .setLabel('جاخالی')
        .setEmoji('💨')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(duelGame.currentTurnPlayerId !== playerId)
    );

  // ردیف دوم - آیتم‌ها و اکشن‌های پیشرفته
  const actionRow2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`duel_attack_special_${duelGame.id}`)
        .setLabel('حمله ویژه')
        .setEmoji('🔥')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(duelGame.currentTurnPlayerId !== playerId),
      new ButtonBuilder()
        .setCustomId(`duel_defense_heal_${duelGame.id}`)
        .setLabel('شفا')
        .setEmoji('💖')
        .setStyle(ButtonStyle.Success)
        .setDisabled(duelGame.currentTurnPlayerId !== playerId),
      new ButtonBuilder()
        .setCustomId(`duel_items_${duelGame.id}`)
        .setLabel('استفاده از آیتم')
        .setEmoji('🧪')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(duelGame.currentTurnPlayerId !== playerId),
      new ButtonBuilder()
        .setCustomId(`duel_surrender_${duelGame.id}`)
        .setLabel('تسلیم')
        .setEmoji('🏳️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(duelGame.currentTurnPlayerId !== playerId)
    );

  return [actionRow1, actionRow2];
}

/**
 * ایجاد نوار پیشرفت
 * @param current مقدار فعلی
 * @param max مقدار حداکثر
 * @param length طول نوار
 * @param fillChar کاراکتر پر
 * @param emptyChar کاراکتر خالی
 * @returns نوار پیشرفت
 */
function createProgressBar(current: number, max: number, length: number, fillChar: string, emptyChar: string): string {
  const percentage = Math.max(0, Math.min(1, current / max));
  const filledLength = Math.round(length * percentage);
  const emptyLength = length - filledLength;
  
  return fillChar.repeat(filledLength) + emptyChar.repeat(emptyLength);
}

/**
 * ایجاد متن اثرات فعال
 * @param effects اثرات بازیکن
 * @returns متن اثرات
 */
function getEffectsText(effects: any): string {
  const effectsText: string[] = [];
  
  if (effects.stunned) {
    effectsText.push(`⚡ گیج: ${effects.stunned} نوبت`);
  }
  if (effects.bleeding) {
    effectsText.push(`🩸 خونریزی: ${effects.bleeding} نوبت`);
  }
  if (effects.poisoned) {
    effectsText.push(`☠️ مسموم: ${effects.poisoned} نوبت`);
  }
  if (effects.strengthened) {
    effectsText.push(`💪 تقویت شده: ${effects.strengthened} نوبت`);
  }
  if (effects.weakened) {
    effectsText.push(`🤢 ضعیف شده: ${effects.weakened} نوبت`);
  }
  
  return effectsText.length > 0 ? effectsText.join('\n') : 'بدون اثر خاص';
}

/**
 * انجام حمله
 * @param interaction 
 */
export async function performAttack(interaction: ButtonInteraction) {
  try {
    // استخراج نوع حمله و شناسه دوئل
    const customId = interaction.customId;
    const attackType = customId.includes('normal') ? AttackType.NORMAL
                      : customId.includes('heavy') ? AttackType.HEAVY
                      : customId.includes('rapid') ? AttackType.RAPID
                      : AttackType.SPECIAL;
    const duelId = customId.split('_').pop()!;
    
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame) {
      await interaction.reply({
        content: '❌ دوئل مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی نوبت بازیکن
    if (interaction.user.id !== duelGame.currentTurnPlayerId) {
      await interaction.reply({
        content: '❌ نوبت شما نیست.',
        ephemeral: true
      });
      return;
    }

    // دریافت بازیکن فعلی و حریف
    const currentPlayer = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player1 : duelGame.player2;
    const opponent = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2 : duelGame.player1;

    // بررسی اثر گیجی
    if (currentPlayer.effects.stunned) {
      currentPlayer.effects.stunned--;
      duelGame.actionHistory.push(`😵 **${currentPlayer.username}** هنوز گیج است و نمی‌تواند حمله کند!`);
      
      // تغییر نوبت
      duelGame.turn++;
      duelGame.currentTurnPlayerId = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
      duelGame.lastActionTime = new Date();
      
      // ذخیره تغییرات
      activeDuelGames.set(duelId, duelGame);
      
      // به‌روزرسانی پیام
      const gameEmbed = createDuelGameEmbed(duelGame);
      const actionButtons = createDuelActionButtons(duelGame, duelGame.currentTurnPlayerId);
      
      await interaction.update({
        content: `⚔️ **دوئل در جریان است!** نوبت <@${duelGame.currentTurnPlayerId}> است.`,
        embeds: [gameEmbed],
        components: actionButtons
      });
      return;
    }

    // بررسی استقامت
    const staminaCost = attackType === AttackType.NORMAL ? 5
                      : attackType === AttackType.HEAVY ? 15
                      : attackType === AttackType.RAPID ? 10
                      : 20;
    
    if (currentPlayer.stamina < staminaCost) {
      await interaction.reply({
        content: `❌ استقامت شما کافی نیست. این حمله به ${staminaCost} استقامت نیاز دارد.`,
        ephemeral: true
      });
      return;
    }

    // محاسبه میزان آسیب
    let damage = calculateDamage(currentPlayer, opponent, attackType);
    
    // اعمال آسیب
    opponent.health = Math.max(0, opponent.health - damage);
    
    // کاهش استقامت
    currentPlayer.stamina = Math.max(0, currentPlayer.stamina - staminaCost);
    
    // افزودن اثر بر اساس نوع حمله
    let effectText = '';
    if (attackType === AttackType.HEAVY && Math.random() < 0.3) {
      opponent.effects.stunned = (opponent.effects.stunned || 0) + 1;
      effectText = ' و حریف دچار گیجی شد! 😵';
    } else if (attackType === AttackType.SPECIAL && Math.random() < 0.4) {
      opponent.effects.bleeding = (opponent.effects.bleeding || 0) + 2;
      effectText = ' و حریف دچار خونریزی شد! 🩸';
    }
    
    // ثبت آخرین اکشن
    currentPlayer.lastAction = {
      type: 'attack',
      value: attackType
    };
    
    // افزودن به تاریخچه
    const attackName = attackType === AttackType.NORMAL ? 'معمولی'
                      : attackType === AttackType.HEAVY ? 'سنگین'
                      : attackType === AttackType.RAPID ? 'سریع'
                      : 'ویژه';
                      
    const attackEmoji = attackType === AttackType.NORMAL ? '⚔️'
                      : attackType === AttackType.HEAVY ? '🔪'
                      : attackType === AttackType.RAPID ? '🌪️'
                      : '🔥';
                      
    duelGame.actionHistory.push(`${attackEmoji} **${currentPlayer.username}** یک حمله ${attackName} انجام داد و ${damage} آسیب وارد کرد${effectText}`);
    
    // بررسی پایان بازی
    if (opponent.health <= 0) {
      // پایان بازی با برد بازیکن فعلی
      return await endDuel(interaction, duelGame, currentPlayer.id);
    }
    
    // تغییر نوبت
    duelGame.turn++;
    duelGame.currentTurnPlayerId = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
    duelGame.lastActionTime = new Date();
    
    // بازیابی استقامت در شروع نوبت جدید
    const nextPlayer = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player1 : duelGame.player2;
    nextPlayer.stamina = Math.min(nextPlayer.maxStamina, nextPlayer.stamina + 10);
    
    // اعمال اثرات مستمر (DOT)
    applyDotEffects(duelGame);
    
    // ذخیره تغییرات
    activeDuelGames.set(duelId, duelGame);
    
    // به‌روزرسانی پیام
    const gameEmbed = createDuelGameEmbed(duelGame);
    const actionButtons = createDuelActionButtons(duelGame, duelGame.currentTurnPlayerId);
    
    await interaction.update({
      content: `⚔️ **دوئل در جریان است!** نوبت <@${duelGame.currentTurnPlayerId}> است.`,
      embeds: [gameEmbed],
      components: actionButtons
    });
  } catch (error) {
    log(`Error performing attack: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در انجام حمله رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * انجام دفاع
 * @param interaction 
 */
export async function performDefense(interaction: ButtonInteraction) {
  try {
    // استخراج نوع دفاع و شناسه دوئل
    const customId = interaction.customId;
    const defenseType = customId.includes('block') ? DefenseType.BLOCK
                      : customId.includes('dodge') ? DefenseType.DODGE
                      : customId.includes('counter') ? DefenseType.COUNTER
                      : DefenseType.HEAL;
    const duelId = customId.split('_').pop()!;
    
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame) {
      await interaction.reply({
        content: '❌ دوئل مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی نوبت بازیکن
    if (interaction.user.id !== duelGame.currentTurnPlayerId) {
      await interaction.reply({
        content: '❌ نوبت شما نیست.',
        ephemeral: true
      });
      return;
    }

    // دریافت بازیکن فعلی و حریف
    const currentPlayer = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player1 : duelGame.player2;
    const opponent = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2 : duelGame.player1;

    // بررسی اثر گیجی
    if (currentPlayer.effects.stunned) {
      currentPlayer.effects.stunned--;
      duelGame.actionHistory.push(`😵 **${currentPlayer.username}** هنوز گیج است و نمی‌تواند از خود دفاع کند!`);
      
      // تغییر نوبت
      duelGame.turn++;
      duelGame.currentTurnPlayerId = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
      duelGame.lastActionTime = new Date();
      
      // ذخیره تغییرات
      activeDuelGames.set(duelId, duelGame);
      
      // به‌روزرسانی پیام
      const gameEmbed = createDuelGameEmbed(duelGame);
      const actionButtons = createDuelActionButtons(duelGame, duelGame.currentTurnPlayerId);
      
      await interaction.update({
        content: `⚔️ **دوئل در جریان است!** نوبت <@${duelGame.currentTurnPlayerId}> است.`,
        embeds: [gameEmbed],
        components: actionButtons
      });
      return;
    }

    // بررسی استقامت
    const staminaCost = defenseType === DefenseType.BLOCK ? 5
                      : defenseType === DefenseType.DODGE ? 10
                      : defenseType === DefenseType.COUNTER ? 15
                      : 15;
    
    if (currentPlayer.stamina < staminaCost) {
      await interaction.reply({
        content: `❌ استقامت شما کافی نیست. این دفاع به ${staminaCost} استقامت نیاز دارد.`,
        ephemeral: true
      });
      return;
    }

    // کاهش استقامت
    currentPlayer.stamina = Math.max(0, currentPlayer.stamina - staminaCost);
    
    // اعمال اثر دفاعی
    let defenseText = '';
    let defenseEmoji = '';
    
    if (defenseType === DefenseType.BLOCK) {
      // افزایش دفاع برای نوبت بعدی
      currentPlayer.defense += 5;
      defenseText = 'سپر دفاعی به کار برد و دفاع خود را افزایش داد';
      defenseEmoji = '🛡️';
    } else if (defenseType === DefenseType.DODGE) {
      // افزایش شانس جاخالی برای نوبت بعدی
      currentPlayer.effects.dodge = (currentPlayer.effects.dodge || 0) + 1;
      defenseText = 'آماده جاخالی از حمله بعدی شد';
      defenseEmoji = '💨';
    } else if (defenseType === DefenseType.COUNTER) {
      // آماده ضد حمله
      currentPlayer.effects.counter = (currentPlayer.effects.counter || 0) + 1;
      defenseText = 'آماده ضد حمله شد';
      defenseEmoji = '↩️';
    } else if (defenseType === DefenseType.HEAL) {
      // شفا
      const healAmount = Math.floor(currentPlayer.maxHealth * 0.2);
      currentPlayer.health = Math.min(currentPlayer.maxHealth, currentPlayer.health + healAmount);
      defenseText = `از قدرت شفا استفاده کرد و ${healAmount} امتیاز سلامتی بازیابی نمود`;
      defenseEmoji = '💖';
    }
    
    // ثبت آخرین اکشن
    currentPlayer.lastAction = {
      type: 'defense',
      value: defenseType
    };
    
    // افزودن به تاریخچه
    duelGame.actionHistory.push(`${defenseEmoji} **${currentPlayer.username}** ${defenseText}!`);
    
    // تغییر نوبت
    duelGame.turn++;
    duelGame.currentTurnPlayerId = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
    duelGame.lastActionTime = new Date();
    
    // بازیابی استقامت در شروع نوبت جدید
    const nextPlayer = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player1 : duelGame.player2;
    nextPlayer.stamina = Math.min(nextPlayer.maxStamina, nextPlayer.stamina + 10);
    
    // اعمال اثرات مستمر (DOT)
    applyDotEffects(duelGame);
    
    // ذخیره تغییرات
    activeDuelGames.set(duelId, duelGame);
    
    // به‌روزرسانی پیام
    const gameEmbed = createDuelGameEmbed(duelGame);
    const actionButtons = createDuelActionButtons(duelGame, duelGame.currentTurnPlayerId);
    
    await interaction.update({
      content: `⚔️ **دوئل در جریان است!** نوبت <@${duelGame.currentTurnPlayerId}> است.`,
      embeds: [gameEmbed],
      components: actionButtons
    });
  } catch (error) {
    log(`Error performing defense: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در انجام دفاع رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * اعمال آسیب مستمر (DOT)
 * @param duelGame بازی دوئل
 */
function applyDotEffects(duelGame: DuelGame) {
  const currentPlayer = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player1 : duelGame.player2;
  
  // خونریزی
  if (currentPlayer.effects.bleeding) {
    const bleedDamage = 5;
    currentPlayer.health = Math.max(0, currentPlayer.health - bleedDamage);
    currentPlayer.effects.bleeding--;
    duelGame.actionHistory.push(`🩸 **${currentPlayer.username}** به خاطر خونریزی ${bleedDamage} آسیب دریافت کرد.`);
    
    // بررسی پایان بازی
    if (currentPlayer.health <= 0) {
      duelGame.winner = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
      duelGame.status = 'completed';
    }
  }
  
  // مسمومیت
  if (currentPlayer.effects.poisoned) {
    const poisonDamage = 3;
    currentPlayer.health = Math.max(0, currentPlayer.health - poisonDamage);
    currentPlayer.effects.poisoned--;
    duelGame.actionHistory.push(`☠️ **${currentPlayer.username}** به خاطر مسمومیت ${poisonDamage} آسیب دریافت کرد.`);
    
    // بررسی پایان بازی
    if (currentPlayer.health <= 0) {
      duelGame.winner = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
      duelGame.status = 'completed';
    }
  }
  
  // تقویت شده
  if (currentPlayer.effects.strengthened) {
    currentPlayer.effects.strengthened--;
    if (currentPlayer.effects.strengthened === 0) {
      currentPlayer.attack -= 5; // برگشت به حالت عادی
      duelGame.actionHistory.push(`💪 اثر تقویت **${currentPlayer.username}** پایان یافت.`);
    }
  }
  
  // ضعیف شده
  if (currentPlayer.effects.weakened) {
    currentPlayer.effects.weakened--;
    if (currentPlayer.effects.weakened === 0) {
      currentPlayer.attack += 5; // برگشت به حالت عادی
      duelGame.actionHistory.push(`🤢 اثر ضعف **${currentPlayer.username}** برطرف شد.`);
    }
  }
}

/**
 * محاسبه میزان آسیب حمله
 * @param attacker مهاجم
 * @param defender مدافع
 * @param attackType نوع حمله
 * @returns میزان آسیب
 */
function calculateDamage(attacker: DuelPlayer, defender: DuelPlayer, attackType: AttackType): number {
  // مقدار پایه آسیب بر اساس نوع حمله
  let baseDamage = attackType === AttackType.NORMAL ? attacker.attack
                  : attackType === AttackType.HEAVY ? attacker.attack * 1.5
                  : attackType === AttackType.RAPID ? attacker.attack * 0.8
                  : attacker.attack * 2;
  
  // اعمال تصادفی (±20%)
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 تا 1.2
  baseDamage *= randomFactor;
  
  // محاسبه کاهش آسیب ناشی از دفاع
  const defenseReduction = defender.defense / (defender.defense + 50); // فرمول کاهش صعودی با بازده نزولی
  baseDamage *= (1 - defenseReduction);
  
  // بررسی ضربه حیاتی (کریتیکال)
  let isCritical = false;
  if (Math.random() < attacker.critChance) {
    baseDamage *= attacker.critMultiplier;
    isCritical = true;
  }
  
  // افزودن گزارش ضربه حیاتی به تاریخچه
  if (isCritical) {
    const duelId = attacker.id === attacker.id ? attacker.id : defender.id;
    const duelGame = Array.from(activeDuelGames.values()).find(game => 
      game.player1.id === attacker.id || game.player2.id === attacker.id
    );
    
    if (duelGame) {
      duelGame.actionHistory.push(`💥 **ضربه حیاتی!** آسیب ${Math.round(baseDamage / attacker.critMultiplier)} به ${Math.round(baseDamage)} افزایش یافت!`);
    }
  }
  
  return Math.round(baseDamage);
}

/**
 * پایان دوئل و تعیین برنده
 * @param interaction اینتراکشن دیسکورد
 * @param duelGame بازی دوئل
 * @param winnerId آیدی برنده
 */
async function endDuel(interaction: ButtonInteraction, duelGame: DuelGame, winnerId: string) {
  try {
    // تنظیم وضعیت پایان بازی
    duelGame.status = 'completed';
    duelGame.winner = winnerId;
    
    // دریافت اطلاعات بازیکنان
    const winner = await storage.getUserByDiscordId(winnerId);
    const loserId = winnerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
    const loser = await storage.getUserByDiscordId(loserId);
    
    if (!winner || !loser) {
      log(`Error getting duel players: Winner or loser not found`, 'error');
      await interaction.update({
        content: '❌ خطایی در پایان دوئل رخ داد. لطفاً با مدیر سرور تماس بگیرید.',
        embeds: [],
        components: []
      });
      return;
    }
    
    // محاسبه جایزه
    const prize = duelGame.betAmount * 2;
    
    // اعطای جایزه به برنده
    await storage.updateUserWallet(convertToUser(winner), prize, 'game_win', 'برنده دوئل');
    
    // ایجاد امبد نتیجه
    const resultEmbed = new EmbedBuilder()
      .setTitle('🏆 پایان دوئل!')
      .setDescription(`**${winner.username}** در یک نبرد هیجان‌انگیز **${loser.username}** را شکست داد و برنده دوئل شد!`)
      .setColor(Colors.Gold)
      .addFields(
        { name: '👑 برنده', value: `<@${winner.discordId}>`, inline: true },
        { name: '💰 جایزه', value: `${prize} سکه`, inline: true },
        { name: '🏅 نوبت پایانی', value: `${duelGame.turn + 1}`, inline: true }
      )
      .setFooter({ text: 'برای شروع دوئل جدید، از دستور /menu استفاده کنید.' })
      .setTimestamp();
    
    // به‌روزرسانی پیام
    await interaction.update({
      content: `🎉 **دوئل پایان یافت!** <@${winner.discordId}> برنده شد و ${prize} سکه دریافت کرد!`,
      embeds: [resultEmbed],
      components: []
    });
    
    // حذف از لیست بازی‌های فعال
    activeDuelGames.delete(duelGame.id);
  } catch (error) {
    log(`Error ending duel: ${error}`, 'error');
    await interaction.update({
      content: '❌ خطایی در پایان دوئل رخ داد. لطفاً با مدیر سرور تماس بگیرید.',
      components: []
    });
  }
}

/**
 * تسلیم شدن در دوئل
 * @param interaction 
 */
export async function surrenderDuel(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه دوئل
    const duelId = interaction.customId.replace('duel_surrender_', '');
    
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame) {
      await interaction.reply({
        content: '❌ دوئل مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی مشارکت کاربر در دوئل
    if (interaction.user.id !== duelGame.player1.id && interaction.user.id !== duelGame.player2.id) {
      await interaction.reply({
        content: '❌ شما در این دوئل شرکت ندارید.',
        ephemeral: true
      });
      return;
    }

    // تعیین برنده (طرف مقابل)
    const winnerId = interaction.user.id === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
    
    // پایان بازی
    await endDuel(interaction, duelGame, winnerId);
    
    // افزودن به تاریخچه
    duelGame.actionHistory.push(`🏳️ **${interaction.user.username}** تسلیم شد و بازی را واگذار کرد!`);
  } catch (error) {
    log(`Error surrendering duel: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در تسلیم شدن رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * نمایش منوی آیتم‌ها
 * @param interaction 
 */
export async function showItemsMenu(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه دوئل
    const duelId = interaction.customId.replace('duel_items_', '');
    
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame) {
      await interaction.reply({
        content: '❌ دوئل مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی نوبت بازیکن
    if (interaction.user.id !== duelGame.currentTurnPlayerId) {
      await interaction.reply({
        content: '❌ نوبت شما نیست.',
        ephemeral: true
      });
      return;
    }

    // دریافت بازیکن فعلی
    const currentPlayer = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player1 : duelGame.player2;
    
    // ایجاد منوی انتخاب آیتم
    const itemOptions = currentPlayer.items.map(item => 
      new StringSelectMenuOptionBuilder()
        .setLabel(`${item.name}`)
        .setDescription(`${item.description}`)
        .setValue(item.id)
        .setEmoji(item.icon)
    );
    
    const itemsMenu = new StringSelectMenuBuilder()
      .setCustomId(`duel_use_item_${duelId}`)
      .setPlaceholder('یک آیتم انتخاب کنید...')
      .addOptions(itemOptions);
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(itemsMenu);
    
    // ایجاد دکمه بازگشت
    const cancelRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`duel_cancel_items_${duelId}`)
          .setLabel('بازگشت')
          .setEmoji('🔙')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ایجاد امبد آیتم‌ها
    const itemsEmbed = new EmbedBuilder()
      .setTitle('🎒 انتخاب آیتم')
      .setDescription(`**${currentPlayer.username}** یکی از آیتم‌های خود را برای استفاده انتخاب کنید.`)
      .setColor(Colors.Blue)
      .setFooter({ text: 'برای بازگشت به منوی اصلی، روی "بازگشت" کلیک کنید.' });
    
    await interaction.update({
      embeds: [itemsEmbed],
      components: [row, cancelRow]
    });
  } catch (error) {
    log(`Error showing items menu: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در نمایش منوی آیتم‌ها رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * استفاده از آیتم
 * @param interaction 
 */
export async function useItem(interaction: StringSelectMenuInteraction) {
  try {
    // استخراج شناسه دوئل و آیتم
    const duelId = interaction.customId.replace('duel_use_item_', '');
    const itemId = interaction.values[0];
    
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame) {
      await interaction.reply({
        content: '❌ دوئل مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی نوبت بازیکن
    if (interaction.user.id !== duelGame.currentTurnPlayerId) {
      await interaction.reply({
        content: '❌ نوبت شما نیست.',
        ephemeral: true
      });
      return;
    }

    // دریافت بازیکن فعلی و حریف
    const currentPlayer = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player1 : duelGame.player2;
    const opponent = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2 : duelGame.player1;
    
    // یافتن آیتم
    const item = currentPlayer.items.find(i => i.id === itemId);
    if (!item) {
      await interaction.reply({
        content: '❌ آیتم مورد نظر یافت نشد.',
        ephemeral: true
      });
      return;
    }
    
    // اعمال اثرات آیتم
    let itemEffectText = '';
    
    // آسیب
    if (item.effects.damage) {
      opponent.health = Math.max(0, opponent.health - item.effects.damage);
      itemEffectText += `و ${item.effects.damage} آسیب به حریف وارد کرد `;
    }
    
    // شفا
    if (item.effects.healing) {
      currentPlayer.health = Math.min(currentPlayer.maxHealth, currentPlayer.health + item.effects.healing);
      itemEffectText += `و ${item.effects.healing} سلامتی به خود بازگرداند `;
    }
    
    // دفاع
    if (item.effects.defense) {
      currentPlayer.defense += item.effects.defense;
      itemEffectText += `و ${item.effects.defense} به دفاع خود افزود `;
    }
    
    // استقامت
    if (item.effects.stamina) {
      if (item.effects.stamina > 0) {
        currentPlayer.stamina = Math.min(currentPlayer.maxStamina, currentPlayer.stamina + item.effects.stamina);
        itemEffectText += `و ${item.effects.stamina} استقامت بازیابی کرد `;
      } else {
        currentPlayer.stamina = Math.max(0, currentPlayer.stamina + item.effects.stamina);
        itemEffectText += `و ${Math.abs(item.effects.stamina)} استقامت از دست داد `;
      }
    }
    
    // گیجی
    if (item.effects.stun) {
      opponent.effects.stunned = (opponent.effects.stunned || 0) + 1;
      itemEffectText += `و حریف را گیج کرد `;
    }
    
    // خونریزی
    if (item.effects.bleed) {
      opponent.effects.bleeding = (opponent.effects.bleeding || 0) + 2;
      itemEffectText += `و باعث خونریزی حریف شد `;
    }
    
    // مسمومیت
    if (item.effects.poison) {
      opponent.effects.poisoned = (opponent.effects.poisoned || 0) + 3;
      itemEffectText += `و حریف را مسموم کرد `;
    }
    
    // ثبت آخرین اکشن
    currentPlayer.lastAction = {
      type: 'item',
      value: itemId
    };
    
    // افزودن به تاریخچه
    duelGame.actionHistory.push(`${item.icon} **${currentPlayer.username}** از آیتم ${item.name} استفاده کرد ${itemEffectText}!`);
    
    // بررسی پایان بازی
    if (opponent.health <= 0) {
      // پایان بازی با برد بازیکن فعلی
      return await endDuel(interaction, duelGame, currentPlayer.id);
    }
    
    // تغییر نوبت
    duelGame.turn++;
    duelGame.currentTurnPlayerId = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
    duelGame.lastActionTime = new Date();
    
    // بازیابی استقامت در شروع نوبت جدید
    const nextPlayer = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player1 : duelGame.player2;
    nextPlayer.stamina = Math.min(nextPlayer.maxStamina, nextPlayer.stamina + 10);
    
    // اعمال اثرات مستمر (DOT)
    applyDotEffects(duelGame);
    
    // ذخیره تغییرات
    activeDuelGames.set(duelId, duelGame);
    
    // به‌روزرسانی پیام
    const gameEmbed = createDuelGameEmbed(duelGame);
    const actionButtons = createDuelActionButtons(duelGame, duelGame.currentTurnPlayerId);
    
    await interaction.update({
      content: `⚔️ **دوئل در جریان است!** نوبت <@${duelGame.currentTurnPlayerId}> است.`,
      embeds: [gameEmbed],
      components: actionButtons
    });
  } catch (error) {
    log(`Error using item: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در استفاده از آیتم رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * لغو منوی آیتم‌ها و بازگشت به منوی اصلی
 * @param interaction 
 */
export async function cancelItemsMenu(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه دوئل
    const duelId = interaction.customId.replace('duel_cancel_items_', '');
    
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame) {
      await interaction.reply({
        content: '❌ دوئل مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی نوبت بازیکن
    if (interaction.user.id !== duelGame.currentTurnPlayerId) {
      await interaction.reply({
        content: '❌ نوبت شما نیست.',
        ephemeral: true
      });
      return;
    }

    // به‌روزرسانی پیام به حالت قبلی
    const gameEmbed = createDuelGameEmbed(duelGame);
    const actionButtons = createDuelActionButtons(duelGame, duelGame.currentTurnPlayerId);
    
    await interaction.update({
      content: `⚔️ **دوئل در جریان است!** نوبت <@${duelGame.currentTurnPlayerId}> است.`,
      embeds: [gameEmbed],
      components: actionButtons
    });
  } catch (error) {
    log(`Error canceling items menu: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در بازگشت از منوی آیتم‌ها رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * بررسی تایم‌اوت دوئل
 * @param duelId شناسه دوئل
 */
async function checkDuelTimeout(duelId: string) {
  try {
    // بررسی وجود دوئل
    const duelGame = activeDuelGames.get(duelId);
    if (!duelGame || duelGame.status !== 'active') {
      return;
    }
    
    // بررسی زمان آخرین اکشن
    const now = new Date();
    const timeSinceLastAction = now.getTime() - duelGame.lastActionTime.getTime();
    
    // اگر بیش از 5 دقیقه از آخرین اکشن گذشته باشد، دوئل را به نفع حریف تمام می‌کنیم
    if (timeSinceLastAction > 5 * 60 * 1000) {
      // تعیین برنده (طرف مقابل نوبت فعلی)
      const winnerId = duelGame.currentTurnPlayerId === duelGame.player1.id ? duelGame.player2.id : duelGame.player1.id;
      
      // تنظیم وضعیت پایان بازی
      duelGame.status = 'completed';
      duelGame.winner = winnerId;
      
      // دریافت اطلاعات بازیکنان
      const winner = await storage.getUserByDiscordId(winnerId);
      const loserId = duelGame.currentTurnPlayerId;
      const loser = await storage.getUserByDiscordId(loserId);
      
      if (!winner || !loser) {
        log(`Error getting duel players for timeout: Winner or loser not found`, 'error');
        return;
      }
      
      // محاسبه جایزه
      const prize = duelGame.betAmount * 2;
      
      // اعطای جایزه به برنده
      await storage.updateUserWallet(convertToUser(winner), prize, 'game_win', 'برنده دوئل (به دلیل عدم فعالیت حریف)');
      
      // افزودن به تاریخچه
      duelGame.actionHistory.push(`⏱️ **${loser.username}** به دلیل عدم فعالیت به مدت طولانی، بازی را به **${winner.username}** واگذار کرد!`);
      
      // ایجاد امبد نتیجه
      const resultEmbed = new EmbedBuilder()
        .setTitle('⏱️ پایان دوئل به دلیل عدم فعالیت!')
        .setDescription(`**${winner.username}** به دلیل عدم فعالیت **${loser.username}** به مدت طولانی، برنده دوئل شد!`)
        .setColor(Colors.Grey)
        .addFields(
          { name: '👑 برنده', value: `<@${winner.discordId}>`, inline: true },
          { name: '💰 جایزه', value: `${prize} سکه`, inline: true },
          { name: '🏅 نوبت پایانی', value: `${duelGame.turn + 1}`, inline: true }
        )
        .setFooter({ text: 'برای شروع دوئل جدید، از دستور /menu استفاده کنید.' })
        .setTimestamp();
      
      // به‌روزرسانی پیام
      try {
        // دریافت کانال و پیام
        const channel = await storage.client.channels.fetch(duelGame.channelId);
        if (channel?.isTextBased() && duelGame.messageId) {
          const message = await channel.messages.fetch(duelGame.messageId);
          await message.edit({
            content: `⏱️ **دوئل به دلیل عدم فعالیت پایان یافت!** <@${winner.discordId}> برنده شد و ${prize} سکه دریافت کرد!`,
            embeds: [resultEmbed],
            components: []
          });
        }
      } catch (error) {
        log(`Error updating timed out duel message: ${error}`, 'warn');
      }
      
      // حذف از لیست بازی‌های فعال
      activeDuelGames.delete(duelId);
    } else {
      // هنوز تایم‌اوت نشده، دوباره بررسی می‌کنیم
      setTimeout(() => checkDuelTimeout(duelId), 60 * 1000); // هر دقیقه بررسی می‌کنیم
    }
  } catch (error) {
    log(`Error checking duel timeout: ${error}`, 'error');
  }
}