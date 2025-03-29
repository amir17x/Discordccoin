/**
 * بازی مافیا
 * 
 * در این بازی، بازیکنان به دو گروه شهروندان و مافیا تقسیم می‌شوند.
 * هدف مافیا از بین بردن شهروندان و هدف شهروندان شناسایی و حذف مافیا است.
 * بازی شامل دو فاز شب و روز است که در آن بازیکنان با نقش‌های مختلف فعالیت می‌کنند.
 * 
 * @module mafiaGame
 * @requires discord.js
 * @requires ../../storage
 */

import { 
  ButtonInteraction, 
  ChatInputCommandInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  User,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  TextChannel,
  PermissionsBitField,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  Collection,
  Message,
  CategoryChannel,
  VoiceChannel,
  Client,
  ColorResolvable
} from 'discord.js';
import { log } from '../utils/logger';
import { storage } from '../../storage';
import { v4 as uuidv4 } from 'uuid';
import { activeGames } from './groupGames';

// رنگ‌های بازی
const MAFIA_COLORS = {
  primary: 0x9B59B6, // بنفش
  secondary: 0x2C3E50, // سرمه‌ای تیره
  success: 0x2ECC71, // سبز
  danger: 0xE74C3C, // قرمز
  warning: 0xF39C12, // نارنجی
  info: 0x3498DB, // آبی
  night: 0x2C3E50, // رنگ شب
  day: 0xF1C40F // رنگ روز
};

// زمان‌های هر فاز (به میلی‌ثانیه)
const PHASE_TIMES = {
  night: 180000, // 3 دقیقه
  day: 300000 // 5 دقیقه
};

// تعریف نقش‌های بازی
interface MafiaRole {
  name: string;
  team: 'mafia' | 'village';
  description: string;
  emoji: string;
  ability: string;
}

const ROLES: Record<string, MafiaRole> = {
  mafia: {
    name: 'مافیا',
    team: 'mafia',
    description: 'شب‌ها یک نفر را حذف می‌کنید و روزها هویت خود را مخفی نگه می‌دارید.',
    emoji: '🕵️‍♂️',
    ability: 'حذف یک نفر در شب با همفکری سایر مافیاها'
  },
  citizen: {
    name: 'شهروند',
    team: 'village',
    description: 'با استدلال و همکاری، مافیا را شناسایی می‌کنید.',
    emoji: '👨‍💼',
    ability: 'رأی‌گیری در روز برای حذف مافیا'
  },
  detective: {
    name: 'کارآگاه',
    team: 'village',
    description: 'هر شب می‌توانید هویت یک نفر را بررسی کنید.',
    emoji: '🔍',
    ability: 'بررسی هویت یک بازیکن در شب (مافیا یا شهروند)'
  },
  doctor: {
    name: 'دکتر',
    team: 'village',
    description: 'هر شب می‌توانید یک نفر را نجات دهید.',
    emoji: '👨‍⚕️',
    ability: 'محافظت از یک بازیکن در برابر حمله مافیا'
  }
};

// تعریف اینترفیس بازی مافیا
interface MafiaGame {
  id: string;
  channelId: string;
  guildId: string;
  hostId: string;
  players: string[];
  status: 'waiting' | 'active' | 'ended';
  phase: 'lobby' | 'night' | 'day';
  day: number;
  roles: Record<string, string>; // playerId -> role
  votes: Record<string, string>; // voterId -> targetId
  nightActions: Record<string, string>; // playerId -> targetId
  mafiaVotes: Record<string, string>; // mafiaId -> targetId
  doctorSaves: string[]; // تاریخچه نجات‌های دکتر
  detectiveChecks: Record<string, { target: string, result: 'mafia' | 'village' }>; // تاریخچه بررسی‌های کارآگاه
  eliminatedPlayers: string[];
  category?: string; // کتگوری کانال‌های ویس
  generalVoice?: string; // کانال ویس عمومی
  mafiaVoice?: string; // کانال ویس مافیا
  roleAssigned: boolean;
  lastActionTime: Date;
  messages: {
    main?: string; // پیام اصلی لابی
    dayAnnouncement?: string; // پیام اعلام روز
    nightAnnouncement?: string; // پیام اعلام شب
  };
  settings: {
    maxPlayers: number;
    minPlayers: number;
    timePerDay: number;
    timePerNight: number;
    prizeCoin: number;
  };
  timers: {
    phase?: NodeJS.Timeout;
  };
}

// ذخیره‌سازی بازی‌های فعال
const activeMafiaGames = new Map<string, MafiaGame>();

/**
 * تنظیم کلاینت دیسکورد
 * @param discordClient نمونه کلاینت دیسکورد
 */
let client: Client;
export function setClient(discordClient: Client) {
  client = discordClient;
}

/**
 * ایجاد جلسه بازی مافیا جدید
 * @param interaction برهم‌کنش کاربر
 */
export async function createMafiaGame(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی وجود بازی فعال در کانال
    const existingGame = Array.from(activeGames.values()).find(
      game => game.channelId === interaction.channelId && 
      (game.status === 'waiting' || game.status === 'active') &&
      game.gameType === 'mafia'
    );

    if (existingGame) {
      return await interaction.reply({
        content: '❌ یک بازی مافیا در این کانال در حال اجراست. لطفاً صبر کنید تا آن بازی تمام شود یا به آن بپیوندید.',
        ephemeral: true
      });
    }

    // ایجاد شناسه منحصر به فرد برای بازی
    const gameId = uuidv4();
    
    // ذخیره اطلاعات کاربر برای استفاده بعدی
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      return await interaction.reply({
        content: '❌ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
    }

    // ایجاد اطلاعات بازی جدید
    const newGame: MafiaGame = {
      id: gameId,
      channelId: interaction.channelId,
      guildId: interaction.guildId as string,
      hostId: interaction.user.id,
      players: [interaction.user.id],
      status: 'waiting',
      phase: 'lobby',
      day: 0,
      roles: {},
      votes: {},
      nightActions: {},
      mafiaVotes: {},
      doctorSaves: [],
      detectiveChecks: {},
      eliminatedPlayers: [],
      roleAssigned: false,
      lastActionTime: new Date(),
      messages: {},
      settings: {
        maxPlayers: 12,
        minPlayers: 6,
        timePerDay: 5, // دقیقه
        timePerNight: 3, // دقیقه
        prizeCoin: 500
      },
      timers: {}
    };

    // ذخیره بازی جدید در حافظه
    activeMafiaGames.set(gameId, newGame);
    
    // اضافه کردن به لیست بازی‌های فعال
    activeGames.set(gameId, {
      id: gameId,
      gameType: 'mafia',
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      players: [interaction.user.id],
      status: 'waiting',
      startedAt: new Date(),
      data: newGame
    });

    // ارسال پیام تأیید به کاربر
    await interaction.reply({
      content: '✅ بازی مافیا با موفقیت ایجاد شد!',
      ephemeral: true
    });

    // ایجاد و ارسال منوی بازی مافیا
    const gameEmbed = new EmbedBuilder()
      .setTitle('🕵️‍♂️ بازی مافیا')
      .setDescription('به دنیای پر از رمز و راز مافیا خوش اومدی! تو این بازی باید با زیرکی و همکاری، مافیا رو شناسایی کنی یا اگه خودت مافیا هستی، همه رو گول بزنی! 🖤')
      .setColor(MAFIA_COLORS.primary)
      .addFields(
        { name: '👥 تعداد بازیکنان', value: `${newGame.players.length}/${newGame.settings.maxPlayers}`, inline: true },
        { name: '⏱️ زمان هر روز', value: `${newGame.settings.timePerDay} دقیقه`, inline: true },
        { name: '🌃 زمان هر شب', value: `${newGame.settings.timePerNight} دقیقه`, inline: true },
        { name: '👤 حداقل بازیکنان', value: `${newGame.settings.minPlayers} نفر`, inline: true },
        { name: '💰 جایزه بازی', value: `برنده ${newGame.settings.prizeCoin} کوین 🤑`, inline: true }
      )
      .setFooter({ text: 'برای شرکت تو بازی، روی دکمه ورود کلیک کن! 🎮' });

    // دکمه‌های کنترل بازی
    const gameButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`join_mafia_${gameId}`)
          .setLabel('ورود به بازی')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setCustomId(`start_mafia_${gameId}`)
          .setLabel('شروع بازی')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('▶️'),
        new ButtonBuilder()
          .setCustomId(`rules_mafia_${gameId}`)
          .setLabel('قوانین بازی')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📜'),
        new ButtonBuilder()
          .setCustomId(`cancel_mafia_${gameId}`)
          .setLabel('لغو بازی')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    // ارسال منوی بازی به کانال
    const channel = await client.channels.fetch(interaction.channelId) as TextChannel;
    const mainMessage = await channel.send({
      embeds: [gameEmbed],
      components: [gameButtons]
    });
    
    // ذخیره شناسه پیام برای استفاده بعدی
    newGame.messages.main = mainMessage.id;
    activeMafiaGames.set(gameId, newGame);

    // ذخیره در پایگاه داده
    await saveGame(newGame, true);

    // راه‌اندازی سیستم بررسی زمان غیرفعالی
    setupInactivityCheck(gameId);
    
    log(`بازی مافیا با شناسه ${gameId} توسط ${interaction.user.username} ایجاد شد.`, 'info');
  } catch (error) {
    log(`Error creating mafia game: ${error}`, 'error');
    
    // پاسخ به کاربر در صورت خطا
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در ایجاد بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * ورود کاربر به بازی مافیا
 * @param interaction برهم‌کنش کاربر
 */
export async function joinMafiaGame(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی از شناسه دکمه
    const gameId = interaction.customId.split('_')[2];
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی وضعیت بازی
    if (game.status !== 'waiting') {
      return await interaction.reply({
        content: '❌ این بازی قبلاً شروع شده و نمی‌توانید به آن بپیوندید.',
        ephemeral: true
      });
    }
    
    // بررسی عضویت قبلی
    if (game.players.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ شما قبلاً به این بازی پیوسته‌اید!',
        ephemeral: true
      });
    }
    
    // بررسی ظرفیت بازی
    if (game.players.length >= game.settings.maxPlayers) {
      return await interaction.reply({
        content: '❌ ظرفیت بازی تکمیل است!',
        ephemeral: true
      });
    }
    
    // افزودن کاربر به لیست بازیکنان
    game.players.push(interaction.user.id);
    game.lastActionTime = new Date();
    
    // به‌روزرسانی بازی در حافظه
    activeMafiaGames.set(gameId, game);
    
    // به‌روزرسانی لیست بازی‌های فعال
    const activeGame = activeGames.get(gameId);
    if (activeGame) {
      activeGame.players = game.players;
      activeGames.set(gameId, activeGame);
    }
    
    // به‌روزرسانی منوی بازی
    await updateGameMenu(game);
    
    // ذخیره در پایگاه داده
    await saveGame(game);
    
    // پاسخ به کاربر
    await interaction.reply({
      content: '✅ با موفقیت به بازی مافیا پیوستید!',
      ephemeral: true
    });
  } catch (error) {
    log(`Error joining mafia game: ${error}`, 'error');
    
    // پاسخ به کاربر در صورت خطا
    await interaction.reply({
      content: '❌ خطایی در پیوستن به بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * نمایش قوانین بازی مافیا
 * @param interaction برهم‌کنش کاربر
 */
export async function showMafiaRules(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    
    const rulesEmbed = new EmbedBuilder()
      .setTitle('📜 قوانین بازی مافیا')
      .setDescription('اینجا قوانین کامل بازی مافیا رو می‌تونی بخونی! 🕵️‍♂️')
      .setColor(MAFIA_COLORS.primary)
      .addFields(
        { 
          name: '👥 شروع بازی و تعیین نقش‌ها',
          value: '🔹 ربات به صورت تصادفی نقش‌ها رو بین بازیکنا پخش می‌کنه.\n🔹 **نقش‌ها:**\n- **مافیا:** شب‌ها یه نفر رو حذف می‌کنن و روزها هویتشون رو مخفی نگه می‌دارن.\n- **شهروند ساده:** با استدلال و همکاری، مافیا رو شناسایی می‌کنن.\n- **کارآگاه:** هر شب می‌تونه یه نفر رو بررسی کنه و بفهمه مافیا هست یا نه.\n- **دکتر:** هر شب می‌تونه یه نفر رو نجات بده.',
          inline: false
        },
        { 
          name: '🌃 فاز شب',
          value: '🔹 تمام بازیکنا به کانال ویس خصوصی خودشون هدایت می‌شن.\n🔹 **مافیا:** تو یه کانال ویس جداگونه با هم مشورت می‌کنن و یه نفر رو برای حذف انتخاب می‌کنن.\n🔹 **کارآگاه:** یه نفر رو انتخاب می‌کنه و ربات بهش می‌گه مافیا هست یا نه.\n🔹 **دکتر:** یه نفر رو برای نجات انتخاب می‌کنه.',
          inline: false
        },
        { 
          name: '☀️ فاز روز',
          value: '🔹 همه بازیکنا تو کانال ویس عمومی جمع می‌شن و درباره اتفاقات شب بحث می‌کنن.\n🔹 بازیکنا می‌تونن با دکمه رای‌گیری، یه نفر رو برای حذف انتخاب کنن.\n🔹 اگه تعداد رای‌ها به حد نصاب برسه، اون بازیکن حذف می‌شه.',
          inline: false
        },
        { 
          name: '🏁 پایان بازی',
          value: '🔹 **برد مافیا:** تعداد مافیا و شهروندا برابر بشه.\n🔹 **برد شهروندا:** تمام مافیا حذف بشن.\n🔹 جایزه (500 کوین) به تیم برنده داده می‌شه.',
          inline: false
        }
      )
      .setFooter({ text: 'برای بازگشت به منوی بازی، روی دکمه بازگشت کلیک کن! 🔙' });

    const backButton = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`back_to_mafia_${gameId}`)
          .setLabel('بازگشت به منوی بازی')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.reply({
      embeds: [rulesEmbed],
      components: [backButton],
      ephemeral: true
    });
  } catch (error) {
    log(`Error showing mafia rules: ${error}`, 'error');
    
    await interaction.reply({
      content: '❌ خطایی در نمایش قوانین رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * بازگشت به منوی اصلی بازی مافیا
 * @param interaction برهم‌کنش کاربر
 */
export async function backToMafiaMenu(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[3];
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    const updatedEmbed = await createGameMenuEmbed(game);
    const gameButtons = createGameButtons(game);
    
    await interaction.update({
      embeds: [updatedEmbed],
      components: [gameButtons]
    });
  } catch (error) {
    log(`Error returning to mafia menu: ${error}`, 'error');
    
    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ خطایی در بازگشت به منوی بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * لغو بازی مافیا
 * @param interaction برهم‌کنش کاربر
 */
export async function cancelMafiaGame(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی دسترسی کاربر (فقط میزبان یا ادمین می‌تواند بازی را لغو کند)
    if (game.hostId !== interaction.user.id && !interaction.memberPermissions?.has('ManageChannels')) {
      return await interaction.reply({
        content: '❌ فقط میزبان بازی یا مدیران سرور می‌توانند بازی را لغو کنند.',
        ephemeral: true
      });
    }
    
    // لغو تایمرها
    if (game.timers.phase) {
      clearTimeout(game.timers.phase);
    }
    
    // حذف کانال‌های ویس و کتگوری
    await cleanupVoiceChannels(game);
    
    // به‌روزرسانی وضعیت بازی
    game.status = 'ended';
    activeMafiaGames.delete(gameId);
    activeGames.delete(gameId);
    
    // ذخیره در پایگاه داده
    await storage.updateGameSession({
      gameId: game.id,
      gameType: 'mafia' as any,
      guildId: game.guildId,
      channelId: game.channelId,
      hostId: game.hostId,
      players: game.players,
      scores: [],
      status: 'ended',
      settings: {
        timePerTurn: game.settings.timePerDay * 60,
        isPrivate: false,
        allowSpectators: true,
        maxPlayers: game.settings.maxPlayers,
        minPlayers: game.settings.minPlayers,
        prizeCoin: game.settings.prizeCoin,
        language: 'fa' as 'fa'
      },
      startedAt: game.lastActionTime,
      endedAt: new Date(),
      updatedAt: new Date()
    });
    
    // به‌روزرسانی منوی بازی
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    const mainMessage = await channel.messages.fetch(game.messages.main as string).catch(() => null);
    
    if (mainMessage) {
      const cancelEmbed = new EmbedBuilder()
        .setTitle('🚫 بازی مافیا لغو شد')
        .setDescription(`این بازی توسط ${interaction.user.username} لغو شد.`)
        .setColor(MAFIA_COLORS.danger)
        .setTimestamp();
      
      await mainMessage.edit({
        embeds: [cancelEmbed],
        components: []
      });
    }
    
    // پاسخ به کاربر
    await interaction.reply({
      content: '✅ بازی مافیا با موفقیت لغو شد.',
      ephemeral: true
    });
  } catch (error) {
    log(`Error canceling mafia game: ${error}`, 'error');
    
    await interaction.reply({
      content: '❌ خطایی در لغو بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * شروع بازی مافیا
 * @param interaction برهم‌کنش کاربر
 */
export async function startMafiaGame(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی دسترسی کاربر (فقط میزبان یا ادمین می‌تواند بازی را شروع کند)
    if (game.hostId !== interaction.user.id && !interaction.memberPermissions?.has('ManageChannels')) {
      return await interaction.reply({
        content: '❌ فقط میزبان بازی یا مدیران سرور می‌توانند بازی را شروع کنند.',
        ephemeral: true
      });
    }
    
    // بررسی تعداد بازیکنان
    if (game.players.length < game.settings.minPlayers) {
      return await interaction.reply({
        content: `❌ حداقل ${game.settings.minPlayers} بازیکن برای شروع بازی لازم است.`,
        ephemeral: true
      });
    }
    
    // بررسی وضعیت بازی
    if (game.status !== 'waiting') {
      return await interaction.reply({
        content: '❌ این بازی قبلاً شروع شده است.',
        ephemeral: true
      });
    }
    
    // تغییر وضعیت بازی
    game.status = 'active';
    game.lastActionTime = new Date();
    
    // ایجاد کانال‌های ویس
    await createVoiceChannels(game, interaction);
    
    // تخصیص نقش‌ها
    await assignRoles(game);
    
    // شروع فاز شب
    await startNightPhase(game, interaction);
    
    // به‌روزرسانی بازی در حافظه
    activeMafiaGames.set(gameId, game);
    
    // به‌روزرسانی بازی در لیست بازی‌های فعال
    const activeGame = activeGames.get(gameId);
    if (activeGame) {
      activeGame.status = 'active';
      activeGames.set(gameId, activeGame);
    }
    
    // ذخیره در پایگاه داده
    await saveGame(game);
    
    // پاسخ به کاربر
    await interaction.reply({
      content: '✅ بازی مافیا با موفقیت شروع شد!',
      ephemeral: true
    });
  } catch (error) {
    log(`Error starting mafia game: ${error}`, 'error');
    
    await interaction.reply({
      content: '❌ خطایی در شروع بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * ایجاد کانال‌های ویس برای بازی مافیا
 * @param game اطلاعات بازی
 * @param interaction برهم‌کنش کاربر
 */
async function createVoiceChannels(game: MafiaGame, interaction: ButtonInteraction) {
  try {
    const guild = interaction.guild;
    if (!guild) return;
    
    // ایجاد نقش برای بازیکنان
    const mafiaRole = await guild.roles.create({
      name: `Mafia Game ${game.id.substring(0, 6)}`,
      color: 'Purple',
      reason: 'نقش برای بازیکنان مافیا'
    });
    
    // اختصاص نقش به بازیکنان
    for (const playerId of game.players) {
      const member = await guild.members.fetch(playerId).catch(() => null);
      if (member) {
        await member.roles.add(mafiaRole);
      }
    }
    
    // ایجاد کتگوری
    const category = await guild.channels.create({
      name: `Mafia Game #${game.id.substring(0, 6)}`,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: mafiaRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }
      ]
    });
    
    // ایجاد کانال ویس عمومی
    const generalVoice = await guild.channels.create({
      name: 'General Voice',
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: mafiaRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }
      ]
    });
    
    // ایجاد کانال ویس مافیا
    const mafiaVoice = await guild.channels.create({
      name: 'Mafia Voice',
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: mafiaRole.id, allow: [PermissionFlagsBits.ViewChannel] },
        // دسترسی‌های خاص برای این کانال بعداً بر اساس نقش‌ها تنظیم می‌شود
      ]
    });
    
    // ذخیره اطلاعات کانال‌ها
    game.category = category.id;
    game.generalVoice = generalVoice.id;
    game.mafiaVoice = mafiaVoice.id;
  } catch (error) {
    log(`Error creating voice channels for mafia game: ${error}`, 'error');
    throw error;
  }
}

/**
 * پاکسازی کانال‌های ویس در پایان بازی
 * @param game اطلاعات بازی
 */
async function cleanupVoiceChannels(game: MafiaGame) {
  try {
    if (!client || !game.guildId) return;
    
    const guild = await client.guilds.fetch(game.guildId).catch(() => null);
    if (!guild) return;
    
    // حذف کانال‌های ویس
    if (game.generalVoice) {
      const generalVoice = await guild.channels.fetch(game.generalVoice).catch(() => null);
      if (generalVoice) await generalVoice.delete('پایان بازی مافیا');
    }
    
    if (game.mafiaVoice) {
      const mafiaVoice = await guild.channels.fetch(game.mafiaVoice).catch(() => null);
      if (mafiaVoice) await mafiaVoice.delete('پایان بازی مافیا');
    }
    
    // حذف کتگوری
    if (game.category) {
      const category = await guild.channels.fetch(game.category).catch(() => null);
      if (category) await category.delete('پایان بازی مافیا');
    }
    
    // حذف نقش
    const mafiaRole = guild.roles.cache.find(role => role.name === `Mafia Game ${game.id.substring(0, 6)}`);
    if (mafiaRole) await mafiaRole.delete('پایان بازی مافیا');
  } catch (error) {
    log(`Error cleaning up voice channels for mafia game: ${error}`, 'error');
  }
}

/**
 * تخصیص نقش‌ها به بازیکنان
 * @param game اطلاعات بازی
 */
async function assignRoles(game: MafiaGame) {
  try {
    // تعیین تعداد مافیا بر اساس تعداد کل بازیکنان
    const totalPlayers = game.players.length;
    let numMafia = Math.floor(totalPlayers / 4); // یک چهارم بازیکنان مافیا هستند
    numMafia = Math.max(1, Math.min(numMafia, 3)); // حداقل 1 و حداکثر 3 مافیا
    
    // ایجاد لیست نقش‌ها
    const roles: string[] = Array(numMafia).fill('mafia'); // مافیا
    
    // اضافه کردن نقش‌های ویژه شهروندان
    if (totalPlayers >= 6) roles.push('detective'); // کارآگاه
    if (totalPlayers >= 7) roles.push('doctor'); // دکتر
    
    // پر کردن باقی نقش‌ها با شهروند ساده
    while (roles.length < totalPlayers) {
      roles.push('citizen');
    }
    
    // بر هم زدن ترتیب نقش‌ها
    const shuffledRoles = shuffleArray([...roles]);
    
    // تخصیص نقش‌ها به بازیکنان
    game.players.forEach((playerId, index) => {
      game.roles[playerId] = shuffledRoles[index];
    });
    
    // ارسال پیام خصوصی به هر بازیکن با نقشش
    for (const playerId of game.players) {
      const role = game.roles[playerId];
      const roleInfo = ROLES[role];
      
      try {
        const user = await client.users.fetch(playerId);
        
        const roleEmbed = new EmbedBuilder()
          .setTitle(`${roleInfo.emoji} نقش شما: ${roleInfo.name}`)
          .setDescription(`**${roleInfo.description}**\n\n**توانایی:** ${roleInfo.ability}`)
          .setColor(roleInfo.team === 'mafia' ? MAFIA_COLORS.danger : MAFIA_COLORS.info)
          .addFields(
            { name: '🎭 تیم', value: roleInfo.team === 'mafia' ? 'مافیا 🕵️‍♂️' : 'شهروندان 👨‍💼', inline: true }
          );
        
        // اضافه کردن لیست هم‌تیمی‌ها برای مافیا
        if (role === 'mafia') {
          const mafiaTeammates = game.players
            .filter(id => game.roles[id] === 'mafia' && id !== playerId)
            .map(id => `<@${id}>`)
            .join(', ');
          
          roleEmbed.addFields(
            { name: '🤝 هم‌تیمی‌های شما', value: mafiaTeammates || 'شما تنها مافیا هستید!', inline: false }
          );
        }
        
        await user.send({ embeds: [roleEmbed] });
      } catch (error) {
        log(`Error sending role to player ${playerId}: ${error}`, 'error');
      }
    }
    
    // تنظیم دسترسی‌های کانال ویس مافیا
    if (game.mafiaVoice && game.guildId) {
      const guild = await client.guilds.fetch(game.guildId);
      const mafiaVoice = await guild.channels.fetch(game.mafiaVoice) as VoiceChannel;
      
      // تنظیم دسترسی برای همه بازیکنان (پیش‌فرض همه نمی‌توانند وارد شوند)
      for (const playerId of game.players) {
        const member = await guild.members.fetch(playerId).catch(() => null);
        if (member) {
          // فقط مافیا می‌تواند وارد کانال مافیا شود
          if (game.roles[playerId] === 'mafia') {
            await mafiaVoice.permissionOverwrites.create(member, {
              ViewChannel: true,
              Connect: true,
              Speak: true
            });
          } else {
            await mafiaVoice.permissionOverwrites.create(member, {
              ViewChannel: false,
              Connect: false
            });
          }
        }
      }
    }
    
    game.roleAssigned = true;
  } catch (error) {
    log(`Error assigning roles for mafia game: ${error}`, 'error');
    throw error;
  }
}

/**
 * شروع فاز شب
 * @param game اطلاعات بازی
 * @param interaction برهم‌کنش کاربر (اختیاری)
 */
async function startNightPhase(game: MafiaGame, interaction?: ButtonInteraction) {
  try {
    // تنظیم فاز بازی
    game.phase = 'night';
    game.day++;
    game.lastActionTime = new Date();
    game.votes = {}; // پاک کردن رأی‌های روز قبل
    game.nightActions = {}; // پاک کردن اقدامات شب قبل
    game.mafiaVotes = {}; // پاک کردن رأی‌های مافیا
    
    // ارسال پیام اعلام شب
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    
    const nightEmbed = new EmbedBuilder()
      .setTitle(`🌃 شب ${game.day} شروع شد`)
      .setDescription('مافیا، کارآگاه و دکتر، لطفاً به کانال‌های ویس خودتون برید و تصمیماتتون رو بگیرید!')
      .setColor(MAFIA_COLORS.night)
      .setTimestamp();
    
    const nightActions = new ActionRowBuilder<ButtonBuilder>();
    
    // اضافه کردن دکمه‌های مخصوص هر نقش
    nightActions.addComponents(
      new ButtonBuilder()
        .setCustomId(`mafia_kill_${game.id}`)
        .setLabel('انتخاب قربانی (مافیا)')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔪'),
      new ButtonBuilder()
        .setCustomId(`detective_check_${game.id}`)
        .setLabel('بررسی هویت (کارآگاه)')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔍'),
      new ButtonBuilder()
        .setCustomId(`doctor_save_${game.id}`)
        .setLabel('محافظت (دکتر)')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💉')
    );
    
    const nightMessage = await channel.send({
      embeds: [nightEmbed],
      components: [nightActions]
    });
    
    game.messages.nightAnnouncement = nightMessage.id;
    
    // جابجایی بازیکنان مافیا به کانال ویس مافیا
    if (game.guildId && game.mafiaVoice) {
      const guild = await client.guilds.fetch(game.guildId);
      const mafiaVoice = await guild.channels.fetch(game.mafiaVoice) as VoiceChannel;
      
      // انتقال مافیاها به کانال مافیا
      for (const playerId of game.players) {
        if (game.roles[playerId] === 'mafia' && !game.eliminatedPlayers.includes(playerId)) {
          try {
            const member = await guild.members.fetch(playerId);
            if (member.voice.channel) {
              await member.voice.setChannel(mafiaVoice);
            }
          } catch (error) {
            log(`Error moving mafia player to mafia voice channel: ${error}`, 'error');
          }
        }
      }
    }
    
    // تنظیم تایمر برای پایان فاز شب
    if (game.timers.phase) {
      clearTimeout(game.timers.phase);
    }
    
    game.timers.phase = setTimeout(async () => {
      await endNightPhase(game);
    }, game.settings.timePerNight * 60 * 1000);
    
    // به‌روزرسانی بازی در حافظه
    activeMafiaGames.set(game.id, game);
    
    // ذخیره در پایگاه داده
    await saveGame(game);
  } catch (error) {
    log(`Error starting night phase for mafia game: ${error}`, 'error');
    
    if (interaction && !interaction.replied) {
      await interaction.reply({
        content: '❌ خطایی در شروع فاز شب رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * پایان فاز شب و شروع فاز روز
 * @param game اطلاعات بازی
 */
async function endNightPhase(game: MafiaGame) {
  try {
    // جمع‌بندی اقدامات شب
    let killedPlayerId: string | null = null;
    let savedPlayerId: string | null = null;
    
    // تعیین قربانی مافیا (بیشترین رأی)
    const mafiaVoteCounts: Record<string, number> = {};
    
    for (const targetId of Object.values(game.mafiaVotes)) {
      mafiaVoteCounts[targetId] = (mafiaVoteCounts[targetId] || 0) + 1;
    }
    
    let maxVotes = 0;
    let mafiaTarget: string | null = null;
    
    for (const [targetId, count] of Object.entries(mafiaVoteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        mafiaTarget = targetId;
      }
    }
    
    // اعمال تصمیم دکتر
    const doctorTargets = Object.keys(game.nightActions).filter(
      playerId => game.roles[playerId] === 'doctor' && !game.eliminatedPlayers.includes(playerId)
    ).map(doctorId => game.nightActions[doctorId]);
    
    if (doctorTargets.length > 0) {
      savedPlayerId = doctorTargets[0]; // فقط یک دکتر در بازی داریم
      game.doctorSaves.push(savedPlayerId);
    }
    
    // بررسی آیا قربانی مافیا نجات یافته است
    if (mafiaTarget && savedPlayerId !== mafiaTarget) {
      killedPlayerId = mafiaTarget;
      game.eliminatedPlayers.push(killedPlayerId);
    }
    
    // تغییر فاز بازی به روز
    game.phase = 'day';
    game.lastActionTime = new Date();
    
    // ارسال پیام اعلام روز
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    
    let dayDescription = `روز ${game.day} شروع شد. همه بازیکنان لطفاً به کانال ویس عمومی بیایند و درباره اتفاقات شب بحث کنند!`;
    
    // اضافه کردن گزارش حوادث شب
    if (killedPlayerId) {
      const killedUser = await client.users.fetch(killedPlayerId);
      dayDescription += `\n\n🔪 **${killedUser.username}** دیشب توسط مافیا کشته شد!`;
    } else {
      dayDescription += '\n\n😇 دیشب کسی کشته نشد!';
    }
    
    const dayEmbed = new EmbedBuilder()
      .setTitle(`☀️ روز ${game.day} شروع شد`)
      .setDescription(dayDescription)
      .setColor(MAFIA_COLORS.day)
      .setTimestamp();
    
    // اضافه کردن لیست بازیکنان زنده
    const alivePlayers = game.players
      .filter(id => !game.eliminatedPlayers.includes(id))
      .map((id, index) => `${index + 1}. <@${id}>`)
      .join('\n');
    
    dayEmbed.addFields(
      { name: '👥 بازیکنان زنده', value: alivePlayers, inline: false }
    );
    
    const voteButton = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`vote_day_${game.id}`)
          .setLabel('رأی‌گیری برای حذف')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🗳️')
      );
    
    const dayMessage = await channel.send({
      embeds: [dayEmbed],
      components: [voteButton]
    });
    
    game.messages.dayAnnouncement = dayMessage.id;
    
    // جابجایی همه بازیکنان به کانال ویس عمومی
    if (game.guildId && game.generalVoice) {
      const guild = await client.guilds.fetch(game.guildId);
      const generalVoice = await guild.channels.fetch(game.generalVoice) as VoiceChannel;
      
      // انتقال بازیکنان زنده به کانال عمومی
      for (const playerId of game.players) {
        if (!game.eliminatedPlayers.includes(playerId)) {
          try {
            const member = await guild.members.fetch(playerId);
            if (member.voice.channel) {
              await member.voice.setChannel(generalVoice);
            }
          } catch (error) {
            log(`Error moving player to general voice channel: ${error}`, 'error');
          }
        }
      }
    }
    
    // بررسی پایان بازی
    const gameStatus = checkGameEnd(game);
    if (gameStatus !== 'continue') {
      return await endGame(game, gameStatus);
    }
    
    // تنظیم تایمر برای پایان فاز روز
    if (game.timers.phase) {
      clearTimeout(game.timers.phase);
    }
    
    game.timers.phase = setTimeout(async () => {
      await endDayPhase(game);
    }, game.settings.timePerDay * 60 * 1000);
    
    // به‌روزرسانی بازی در حافظه
    activeMafiaGames.set(game.id, game);
    
    // ذخیره در پایگاه داده
    await saveGame(game);
  } catch (error) {
    log(`Error ending night phase for mafia game: ${error}`, 'error');
  }
}

/**
 * پایان فاز روز و شروع فاز شب بعدی
 * @param game اطلاعات بازی
 */
async function endDayPhase(game: MafiaGame) {
  try {
    // شمارش رأی‌ها
    const voteCounts: Record<string, number> = {};
    
    for (const targetId of Object.values(game.votes)) {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }
    
    let maxVotes = 0;
    let eliminatedPlayerId: string | null = null;
    
    for (const [targetId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedPlayerId = targetId;
      }
    }
    
    // اعلام نتیجه رأی‌گیری
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    
    // اضافه کردن حذف شده به لیست حذف شدگان
    if (eliminatedPlayerId && maxVotes >= Math.ceil(game.players.filter(id => !game.eliminatedPlayers.includes(id)).length / 2)) {
      game.eliminatedPlayers.push(eliminatedPlayerId);
      
      const eliminatedUser = await client.users.fetch(eliminatedPlayerId);
      const eliminatedRole = game.roles[eliminatedPlayerId];
      const roleInfo = ROLES[eliminatedRole];
      
      const resultEmbed = new EmbedBuilder()
        .setTitle('🗳️ نتیجه رأی‌گیری')
        .setDescription(`با ${maxVotes} رأی، **${eliminatedUser.username}** از بازی حذف شد!`)
        .setColor(MAFIA_COLORS.danger)
        .addFields(
          { name: '🎭 نقش', value: `${roleInfo.emoji} ${roleInfo.name}`, inline: true },
          { name: '🎭 تیم', value: roleInfo.team === 'mafia' ? 'مافیا 🕵️‍♂️' : 'شهروندان 👨‍💼', inline: true }
        )
        .setTimestamp();
      
      await channel.send({ embeds: [resultEmbed] });
    } else {
      const resultEmbed = new EmbedBuilder()
        .setTitle('🗳️ نتیجه رأی‌گیری')
        .setDescription('امروز هیچ کس از بازی حذف نشد! تعداد رأی‌ها به حد نصاب نرسید.')
        .setColor(MAFIA_COLORS.info)
        .setTimestamp();
      
      await channel.send({ embeds: [resultEmbed] });
    }
    
    // بررسی پایان بازی
    const gameStatus = checkGameEnd(game);
    if (gameStatus !== 'continue') {
      return await endGame(game, gameStatus);
    }
    
    // شروع فاز شب بعدی
    await startNightPhase(game);
  } catch (error) {
    log(`Error ending day phase for mafia game: ${error}`, 'error');
  }
}

/**
 * رأی‌گیری در فاز روز
 * @param interaction برهم‌کنش کاربر
 */
export async function dayVoting(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی فاز بازی
    if (game.phase !== 'day') {
      return await interaction.reply({
        content: '❌ رأی‌گیری فقط در فاز روز امکان‌پذیر است.',
        ephemeral: true
      });
    }
    
    // بررسی عضویت کاربر در بازی
    if (!game.players.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ فقط بازیکنان بازی می‌توانند رأی بدهند.',
        ephemeral: true
      });
    }
    
    // بررسی زنده بودن کاربر
    if (game.eliminatedPlayers.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ بازیکنان حذف شده نمی‌توانند رأی بدهند.',
        ephemeral: true
      });
    }
    
    // ایجاد منوی رأی‌گیری
    const alivePlayers = game.players.filter(id => !game.eliminatedPlayers.includes(id) && id !== interaction.user.id);
    
    const voteComponents = alivePlayers.map(playerId => {
      const user = client.users.cache.get(playerId);
      return {
        type: 2,
        style: ButtonStyle.Secondary,
        label: user?.username || playerId,
        custom_id: `vote_player_${gameId}_${playerId}`
      };
    });
    
    // تقسیم دکمه‌ها به گروه‌های 5تایی
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < voteComponents.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      row.addComponents(
        ...voteComponents.slice(i, i + 5).map(component => 
          new ButtonBuilder()
            .setCustomId(component.custom_id)
            .setLabel(component.label)
            .setStyle(component.style as ButtonStyle)
        )
      );
      rows.push(row);
    }
    
    const voteEmbed = new EmbedBuilder()
      .setTitle('🗳️ رأی‌گیری برای حذف')
      .setDescription('یکی از بازیکنان را برای حذف انتخاب کنید:')
      .setColor(MAFIA_COLORS.primary)
      .setFooter({ text: 'توجه: رأی شما محرمانه است و فقط برای خودتان نمایش داده می‌شود.' });
    
    await interaction.reply({
      embeds: [voteEmbed],
      components: rows,
      ephemeral: true
    });
  } catch (error) {
    log(`Error in day voting for mafia game: ${error}`, 'error');
    
    await interaction.reply({
      content: '❌ خطایی در رأی‌گیری رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * رأی دادن به یک بازیکن در فاز روز
 * @param interaction برهم‌کنش کاربر
 */
export async function votePlayer(interaction: ButtonInteraction) {
  try {
    const parts = interaction.customId.split('_');
    const gameId = parts[2];
    const targetId = parts[3];
    
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی فاز بازی
    if (game.phase !== 'day') {
      return await interaction.reply({
        content: '❌ رأی‌گیری فقط در فاز روز امکان‌پذیر است.',
        ephemeral: true
      });
    }
    
    // بررسی عضویت کاربر در بازی
    if (!game.players.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ فقط بازیکنان بازی می‌توانند رأی بدهند.',
        ephemeral: true
      });
    }
    
    // بررسی زنده بودن کاربر
    if (game.eliminatedPlayers.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ بازیکنان حذف شده نمی‌توانند رأی بدهند.',
        ephemeral: true
      });
    }
    
    // ثبت رأی
    game.votes[interaction.user.id] = targetId;
    game.lastActionTime = new Date();
    
    // به‌روزرسانی بازی در حافظه
    activeMafiaGames.set(gameId, game);
    
    // ذخیره در پایگاه داده
    await saveGame(game);
    
    // پاسخ به کاربر
    const target = await client.users.fetch(targetId);
    
    await interaction.update({
      content: `✅ رأی شما به **${target.username}** با موفقیت ثبت شد!`,
      embeds: [],
      components: []
    });
    
    // بررسی تعداد رأی‌ها (اگر همه رأی داده‌اند، فاز روز پایان می‌یابد)
    const alivePlayersCount = game.players.filter(id => !game.eliminatedPlayers.includes(id)).length;
    const votesCount = Object.keys(game.votes).length;
    
    if (votesCount >= alivePlayersCount) {
      // اگر همه بازیکنان زنده رأی داده باشند، فاز روز زودتر پایان می‌یابد
      if (game.timers.phase) {
        clearTimeout(game.timers.phase);
      }
      
      await endDayPhase(game);
    }
  } catch (error) {
    log(`Error voting for player in mafia game: ${error}`, 'error');
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در ثبت رأی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * انتخاب قربانی توسط مافیا
 * @param interaction برهم‌کنش کاربر
 */
export async function mafiaKill(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی فاز بازی
    if (game.phase !== 'night') {
      return await interaction.reply({
        content: '❌ انتخاب قربانی فقط در فاز شب امکان‌پذیر است.',
        ephemeral: true
      });
    }
    
    // بررسی نقش کاربر
    if (game.roles[interaction.user.id] !== 'mafia') {
      return await interaction.reply({
        content: '❌ فقط مافیا می‌تواند این عملیات را انجام دهد.',
        ephemeral: true
      });
    }
    
    // بررسی زنده بودن کاربر
    if (game.eliminatedPlayers.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ بازیکنان حذف شده نمی‌توانند قربانی انتخاب کنند.',
        ephemeral: true
      });
    }
    
    // ایجاد منوی انتخاب قربانی
    const alivePlayers = game.players.filter(id => 
      !game.eliminatedPlayers.includes(id) && 
      game.roles[id] !== 'mafia'
    );
    
    const targetComponents = alivePlayers.map(playerId => {
      const user = client.users.cache.get(playerId);
      return {
        type: 2,
        style: ButtonStyle.Danger,
        label: user?.username || playerId,
        custom_id: `kill_target_${gameId}_${playerId}`
      };
    });
    
    // تقسیم دکمه‌ها به گروه‌های 5تایی
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < targetComponents.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      row.addComponents(
        ...targetComponents.slice(i, i + 5).map(component => 
          new ButtonBuilder()
            .setCustomId(component.custom_id)
            .setLabel(component.label)
            .setStyle(component.style as ButtonStyle)
        )
      );
      rows.push(row);
    }
    
    const killEmbed = new EmbedBuilder()
      .setTitle('🔪 انتخاب قربانی')
      .setDescription('یکی از بازیکنان را برای حذف انتخاب کنید:')
      .setColor(MAFIA_COLORS.danger)
      .setFooter({ text: 'توجه: رأی شما با دیگر مافیاها جمع می‌شود و بیشترین رأی اعمال می‌شود.' });
    
    await interaction.reply({
      embeds: [killEmbed],
      components: rows,
      ephemeral: true
    });
  } catch (error) {
    log(`Error in mafia kill selection: ${error}`, 'error');
    
    await interaction.reply({
      content: '❌ خطایی در انتخاب قربانی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * انتخاب هدف برای کشتن توسط مافیا
 * @param interaction برهم‌کنش کاربر
 */
export async function killTarget(interaction: ButtonInteraction) {
  try {
    const parts = interaction.customId.split('_');
    const gameId = parts[2];
    const targetId = parts[3];
    
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی فاز بازی
    if (game.phase !== 'night') {
      return await interaction.reply({
        content: '❌ انتخاب قربانی فقط در فاز شب امکان‌پذیر است.',
        ephemeral: true
      });
    }
    
    // بررسی نقش کاربر
    if (game.roles[interaction.user.id] !== 'mafia') {
      return await interaction.reply({
        content: '❌ فقط مافیا می‌تواند این عملیات را انجام دهد.',
        ephemeral: true
      });
    }
    
    // بررسی زنده بودن کاربر
    if (game.eliminatedPlayers.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ بازیکنان حذف شده نمی‌توانند قربانی انتخاب کنند.',
        ephemeral: true
      });
    }
    
    // ثبت رأی مافیا
    game.mafiaVotes[interaction.user.id] = targetId;
    game.lastActionTime = new Date();
    
    // به‌روزرسانی بازی در حافظه
    activeMafiaGames.set(gameId, game);
    
    // ذخیره در پایگاه داده
    await saveGame(game);
    
    // پاسخ به کاربر
    const target = await client.users.fetch(targetId);
    
    await interaction.update({
      content: `✅ انتخاب شما برای کشتن **${target.username}** با موفقیت ثبت شد!`,
      embeds: [],
      components: []
    });
    
    // بررسی آیا همه مافیاها رأی داده‌اند
    const aliveMafias = game.players.filter(id => 
      !game.eliminatedPlayers.includes(id) && 
      game.roles[id] === 'mafia'
    );
    
    const mafiaVotesCount = Object.keys(game.mafiaVotes).filter(id => 
      aliveMafias.includes(id)
    ).length;
    
    if (mafiaVotesCount >= aliveMafias.length) {
      // اطلاع‌رسانی به همه مافیاها در مورد تصمیم نهایی
      const voteCounts: Record<string, number> = {};
      
      for (const targetId of Object.values(game.mafiaVotes)) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
      
      let maxVotes = 0;
      let finalTarget: string | null = null;
      
      for (const [targetId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          finalTarget = targetId;
        }
      }
      
      if (finalTarget) {
        const finalTargetUser = await client.users.fetch(finalTarget);
        
        for (const mafiaId of aliveMafias) {
          try {
            const mafia = await client.users.fetch(mafiaId);
            
            const finalDecisionEmbed = new EmbedBuilder()
              .setTitle('🔪 تصمیم نهایی مافیا')
              .setDescription(`بر اساس رأی‌گیری، **${finalTargetUser.username}** امشب حذف خواهد شد.`)
              .setColor(MAFIA_COLORS.danger)
              .setTimestamp();
            
            await mafia.send({ embeds: [finalDecisionEmbed] });
          } catch (error) {
            log(`Error sending final decision to mafia ${mafiaId}: ${error}`, 'error');
          }
        }
      }
    }
  } catch (error) {
    log(`Error selecting kill target in mafia game: ${error}`, 'error');
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در ثبت انتخاب رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * بررسی هویت توسط کارآگاه
 * @param interaction برهم‌کنش کاربر
 */
export async function detectiveCheck(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی فاز بازی
    if (game.phase !== 'night') {
      return await interaction.reply({
        content: '❌ بررسی هویت فقط در فاز شب امکان‌پذیر است.',
        ephemeral: true
      });
    }
    
    // بررسی نقش کاربر
    if (game.roles[interaction.user.id] !== 'detective') {
      return await interaction.reply({
        content: '❌ فقط کارآگاه می‌تواند این عملیات را انجام دهد.',
        ephemeral: true
      });
    }
    
    // بررسی زنده بودن کاربر
    if (game.eliminatedPlayers.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ بازیکنان حذف شده نمی‌توانند بررسی هویت انجام دهند.',
        ephemeral: true
      });
    }
    
    // ایجاد منوی انتخاب هدف بررسی
    const alivePlayers = game.players.filter(id => 
      !game.eliminatedPlayers.includes(id) && 
      id !== interaction.user.id
    );
    
    const targetComponents = alivePlayers.map(playerId => {
      const user = client.users.cache.get(playerId);
      return {
        type: 2,
        style: ButtonStyle.Primary,
        label: user?.username || playerId,
        custom_id: `check_target_${gameId}_${playerId}`
      };
    });
    
    // تقسیم دکمه‌ها به گروه‌های 5تایی
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < targetComponents.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      row.addComponents(
        ...targetComponents.slice(i, i + 5).map(component => 
          new ButtonBuilder()
            .setCustomId(component.custom_id)
            .setLabel(component.label)
            .setStyle(component.style as ButtonStyle)
        )
      );
      rows.push(row);
    }
    
    const checkEmbed = new EmbedBuilder()
      .setTitle('🔍 بررسی هویت')
      .setDescription('یکی از بازیکنان را برای بررسی هویت انتخاب کنید:')
      .setColor(MAFIA_COLORS.info)
      .setFooter({ text: 'توجه: نتیجه بررسی فقط برای شما نمایش داده می‌شود.' });
    
    await interaction.reply({
      embeds: [checkEmbed],
      components: rows,
      ephemeral: true
    });
  } catch (error) {
    log(`Error in detective check: ${error}`, 'error');
    
    await interaction.reply({
      content: '❌ خطایی در بررسی هویت رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * انتخاب هدف برای بررسی هویت توسط کارآگاه
 * @param interaction برهم‌کنش کاربر
 */
export async function checkTarget(interaction: ButtonInteraction) {
  try {
    const parts = interaction.customId.split('_');
    const gameId = parts[2];
    const targetId = parts[3];
    
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی فاز بازی
    if (game.phase !== 'night') {
      return await interaction.reply({
        content: '❌ بررسی هویت فقط در فاز شب امکان‌پذیر است.',
        ephemeral: true
      });
    }
    
    // بررسی نقش کاربر
    if (game.roles[interaction.user.id] !== 'detective') {
      return await interaction.reply({
        content: '❌ فقط کارآگاه می‌تواند این عملیات را انجام دهد.',
        ephemeral: true
      });
    }
    
    // بررسی زنده بودن کاربر
    if (game.eliminatedPlayers.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ بازیکنان حذف شده نمی‌توانند بررسی هویت انجام دهند.',
        ephemeral: true
      });
    }
    
    // تعیین نتیجه بررسی
    const targetRole = game.roles[targetId];
    const result = targetRole === 'mafia' ? 'mafia' : 'village';
    
    // ثبت اقدام کارآگاه
    game.nightActions[interaction.user.id] = targetId;
    game.detectiveChecks[game.day] = { target: targetId, result };
    game.lastActionTime = new Date();
    
    // به‌روزرسانی بازی در حافظه
    activeMafiaGames.set(gameId, game);
    
    // ذخیره در پایگاه داده
    await saveGame(game);
    
    // پاسخ به کاربر
    const target = await client.users.fetch(targetId);
    
    const resultEmbed = new EmbedBuilder()
      .setTitle('🔍 نتیجه بررسی هویت')
      .setColor(result === 'mafia' ? MAFIA_COLORS.danger : MAFIA_COLORS.success)
      .setDescription(`نتیجه بررسی هویت **${target.username}**:`)
      .addFields(
        { name: '🎭 تیم', value: result === 'mafia' ? '**مافیا** 🕵️‍♂️' : '**شهروندان** 👨‍💼', inline: true }
      )
      .setFooter({ text: 'این اطلاعات محرمانه است و فقط برای شما نمایش داده می‌شود.' })
      .setTimestamp();
    
    await interaction.update({
      embeds: [resultEmbed],
      components: []
    });
  } catch (error) {
    log(`Error selecting check target in mafia game: ${error}`, 'error');
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در ثبت بررسی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * محافظت توسط دکتر
 * @param interaction برهم‌کنش کاربر
 */
export async function doctorSave(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی فاز بازی
    if (game.phase !== 'night') {
      return await interaction.reply({
        content: '❌ محافظت فقط در فاز شب امکان‌پذیر است.',
        ephemeral: true
      });
    }
    
    // بررسی نقش کاربر
    if (game.roles[interaction.user.id] !== 'doctor') {
      return await interaction.reply({
        content: '❌ فقط دکتر می‌تواند این عملیات را انجام دهد.',
        ephemeral: true
      });
    }
    
    // بررسی زنده بودن کاربر
    if (game.eliminatedPlayers.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ بازیکنان حذف شده نمی‌توانند محافظت انجام دهند.',
        ephemeral: true
      });
    }
    
    // ایجاد منوی انتخاب هدف محافظت
    const alivePlayers = game.players.filter(id => 
      !game.eliminatedPlayers.includes(id)
    );
    
    const targetComponents = alivePlayers.map(playerId => {
      const user = client.users.cache.get(playerId);
      return {
        type: 2,
        style: ButtonStyle.Success,
        label: user?.username || playerId,
        custom_id: `save_target_${gameId}_${playerId}`
      };
    });
    
    // تقسیم دکمه‌ها به گروه‌های 5تایی
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < targetComponents.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      row.addComponents(
        ...targetComponents.slice(i, i + 5).map(component => 
          new ButtonBuilder()
            .setCustomId(component.custom_id)
            .setLabel(component.label)
            .setStyle(component.style as ButtonStyle)
        )
      );
      rows.push(row);
    }
    
    const saveEmbed = new EmbedBuilder()
      .setTitle('💉 محافظت از بازیکن')
      .setDescription('یکی از بازیکنان را برای محافظت انتخاب کنید:')
      .setColor(MAFIA_COLORS.success)
      .setFooter({ text: 'توجه: انتخاب شما فقط برای خودتان نمایش داده می‌شود.' });
    
    await interaction.reply({
      embeds: [saveEmbed],
      components: rows,
      ephemeral: true
    });
  } catch (error) {
    log(`Error in doctor save: ${error}`, 'error');
    
    await interaction.reply({
      content: '❌ خطایی در محافظت رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * انتخاب هدف برای محافظت توسط دکتر
 * @param interaction برهم‌کنش کاربر
 */
export async function saveTarget(interaction: ButtonInteraction) {
  try {
    const parts = interaction.customId.split('_');
    const gameId = parts[2];
    const targetId = parts[3];
    
    const game = activeMafiaGames.get(gameId);
    
    if (!game) {
      return await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
    }
    
    // بررسی فاز بازی
    if (game.phase !== 'night') {
      return await interaction.reply({
        content: '❌ محافظت فقط در فاز شب امکان‌پذیر است.',
        ephemeral: true
      });
    }
    
    // بررسی نقش کاربر
    if (game.roles[interaction.user.id] !== 'doctor') {
      return await interaction.reply({
        content: '❌ فقط دکتر می‌تواند این عملیات را انجام دهد.',
        ephemeral: true
      });
    }
    
    // بررسی زنده بودن کاربر
    if (game.eliminatedPlayers.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ بازیکنان حذف شده نمی‌توانند محافظت انجام دهند.',
        ephemeral: true
      });
    }
    
    // محدودیت محافظت از خود (نمی‌تواند دو بار پشت سر هم از خودش محافظت کند)
    const lastSavedSelf = game.day > 1 && 
                        game.doctorSaves[game.day - 2] === interaction.user.id && 
                        targetId === interaction.user.id;
    
    if (lastSavedSelf) {
      return await interaction.reply({
        content: '❌ شما نمی‌توانید دو شب پشت سر هم از خودتان محافظت کنید.',
        ephemeral: true
      });
    }
    
    // ثبت اقدام دکتر
    game.nightActions[interaction.user.id] = targetId;
    game.lastActionTime = new Date();
    
    // به‌روزرسانی بازی در حافظه
    activeMafiaGames.set(gameId, game);
    
    // ذخیره در پایگاه داده
    await saveGame(game);
    
    // پاسخ به کاربر
    const target = await client.users.fetch(targetId);
    
    await interaction.update({
      content: `✅ شما با موفقیت از **${target.username}** محافظت کردید!`,
      embeds: [],
      components: []
    });
  } catch (error) {
    log(`Error selecting save target in mafia game: ${error}`, 'error');
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در ثبت محافظت رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * بررسی پایان بازی
 * @param game اطلاعات بازی
 * @returns وضعیت بازی: 'continue', 'mafia_win', 'village_win'
 */
function checkGameEnd(game: MafiaGame): 'continue' | 'mafia_win' | 'village_win' {
  // شمارش بازیکنان زنده در هر تیم
  let mafiaCount = 0;
  let villageCount = 0;
  
  for (const playerId of game.players) {
    if (!game.eliminatedPlayers.includes(playerId)) {
      if (game.roles[playerId] === 'mafia') {
        mafiaCount++;
      } else {
        villageCount++;
      }
    }
  }
  
  // بررسی شرایط پایان بازی
  if (mafiaCount === 0) {
    return 'village_win'; // همه مافیاها حذف شده‌اند
  } else if (mafiaCount >= villageCount) {
    return 'mafia_win'; // تعداد مافیا با شهروندان برابر یا بیشتر شده است
  } else {
    return 'continue'; // بازی ادامه دارد
  }
}

/**
 * پایان بازی
 * @param game اطلاعات بازی
 * @param result نتیجه بازی: 'mafia_win' یا 'village_win'
 */
async function endGame(game: MafiaGame, result: 'mafia_win' | 'village_win') {
  try {
    // لغو تایمرها
    if (game.timers.phase) {
      clearTimeout(game.timers.phase);
    }
    
    // تغییر وضعیت بازی
    game.status = 'ended';
    game.lastActionTime = new Date();
    
    // ایجاد تیم‌های برنده و بازنده
    const winningTeam = result === 'mafia_win' ? 'mafia' : 'village';
    const winners = game.players.filter(id => game.roles[id] === (winningTeam === 'mafia' ? 'mafia' : game.roles[id] !== 'mafia'));
    
    // ارسال پیام پایان بازی
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    
    const endEmbed = new EmbedBuilder()
      .setTitle('🏁 پایان بازی مافیا')
      .setDescription(result === 'mafia_win' 
        ? '**مافیا برنده شد!** 🕵️‍♂️ تعداد مافیا و شهروندان برابر شد و مافیا کنترل شهر را به دست گرفت.'
        : '**شهروندان برنده شدند!** 👨‍💼 تمام مافیا از بین رفتند و شهر به آرامش بازگشت.'
      )
      .setColor(result === 'mafia_win' ? MAFIA_COLORS.danger : MAFIA_COLORS.success)
      .setTimestamp();
    
    // اضافه کردن لیست نقش‌های بازیکنان
    const rolesText = game.players.map(playerId => {
      const role = game.roles[playerId];
      const roleInfo = ROLES[role];
      return `<@${playerId}>: ${roleInfo.emoji} ${roleInfo.name}`;
    }).join('\n');
    
    endEmbed.addFields(
      { name: '🎭 نقش‌های بازیکنان', value: rolesText, inline: false }
    );
    
    // اگر برنده‌ای وجود داشت، جایزه بدهید
    if (winners.length > 0) {
      // محاسبه جایزه هر بازیکن
      const prizePerPlayer = Math.floor(game.settings.prizeCoin / winners.length);
      
      // اضافه کردن سکه به برندگان
      for (const winnerId of winners) {
        try {
          const user = await storage.getUserByDiscordId(winnerId);
          if (user) {
            await storage.updateUserBalance(user.id, user.balance + prizePerPlayer);
          }
        } catch (error) {
          log(`Error awarding prize to winner ${winnerId}: ${error}`, 'error');
        }
      }
      
      const winnersText = winners.map(id => `<@${id}>`).join(', ');
      endEmbed.addFields(
        { name: '🏆 برندگان', value: winnersText, inline: false },
        { name: '💰 جایزه', value: `هر بازیکن ${prizePerPlayer} کوین`, inline: false }
      );
    }
    
    await channel.send({ embeds: [endEmbed] });
    
    // حذف کانال‌های ویس و کتگوری
    await cleanupVoiceChannels(game);
    
    // حذف بازی از لیست‌های فعال
    activeMafiaGames.delete(game.id);
    activeGames.delete(game.id);
    
    // ذخیره در پایگاه داده
    await storage.updateGameSession({
      gameId: game.id,
      gameType: 'mafia' as any,
      guildId: game.guildId,
      channelId: game.channelId,
      hostId: game.hostId,
      players: game.players,
      scores: winners.map(id => ({ playerId: id, score: Math.floor(game.settings.prizeCoin / winners.length) })),
      status: 'ended',
      settings: {
        timePerTurn: game.settings.timePerDay * 60,
        isPrivate: false,
        allowSpectators: true,
        maxPlayers: game.settings.maxPlayers,
        minPlayers: game.settings.minPlayers,
        prizeCoin: game.settings.prizeCoin,
        language: 'fa' as 'fa'
      },
      startedAt: game.lastActionTime,
      endedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    log(`Error ending mafia game: ${error}`, 'error');
  }
}

/**
 * به‌روزرسانی منوی بازی
 * @param game اطلاعات بازی
 */
async function updateGameMenu(game: MafiaGame) {
  try {
    const embed = await createGameMenuEmbed(game);
    const buttons = createGameButtons(game);
    
    // به‌روزرسانی پیام اصلی
    if (game.messages.main && game.channelId) {
      const channel = await client.channels.fetch(game.channelId) as TextChannel;
      const message = await channel.messages.fetch(game.messages.main).catch(() => null);
      
      if (message) {
        await message.edit({
          embeds: [embed],
          components: [buttons]
        });
      }
    }
  } catch (error) {
    log(`Error updating mafia game menu: ${error}`, 'error');
  }
}

/**
 * ایجاد Embed منوی بازی
 * @param game اطلاعات بازی
 * @returns EmbedBuilder منوی بازی
 */
async function createGameMenuEmbed(game: MafiaGame): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setTitle('🕵️‍♂️ بازی مافیا')
    .setDescription('به دنیای پر از رمز و راز مافیا خوش اومدی! تو این بازی باید با زیرکی و همکاری، مافیا رو شناسایی کنی یا اگه خودت مافیا هستی، همه رو گول بزنی! 🖤')
    .setColor(MAFIA_COLORS.primary)
    .addFields(
      { name: '👥 تعداد بازیکنان', value: `${game.players.length}/${game.settings.maxPlayers}`, inline: true },
      { name: '⏱️ زمان هر روز', value: `${game.settings.timePerDay} دقیقه`, inline: true },
      { name: '🌃 زمان هر شب', value: `${game.settings.timePerNight} دقیقه`, inline: true },
      { name: '👤 حداقل بازیکنان', value: `${game.settings.minPlayers} نفر`, inline: true },
      { name: '💰 جایزه بازی', value: `برنده ${game.settings.prizeCoin} کوین 🤑`, inline: true }
    );
  
  // اضافه کردن لیست بازیکنان
  if (game.players.length > 0) {
    const playersList = await Promise.all(game.players.map(async (playerId, index) => {
      let username = 'ناشناس';
      try {
        const user = await client.users.fetch(playerId);
        username = user.username;
      } catch (error) {
        log(`Error fetching user ${playerId}: ${error}`, 'error');
      }
      
      return `${index + 1}. ${username}`;
    }));
    
    embed.addFields(
      { name: '👥 بازیکنان', value: playersList.join('\n'), inline: false }
    );
  }
  
  embed.setFooter({ text: 'برای شرکت تو بازی، روی دکمه ورود کلیک کن! 🎮' });
  
  return embed;
}

/**
 * ایجاد دکمه‌های کنترل بازی
 * @param game اطلاعات بازی
 * @returns ActionRowBuilder دکمه‌های بازی
 */
function createGameButtons(game: MafiaGame): ActionRowBuilder<ButtonBuilder> {
  const gameButtons = new ActionRowBuilder<ButtonBuilder>();
  
  if (game.status === 'waiting') {
    gameButtons.addComponents(
      new ButtonBuilder()
        .setCustomId(`join_mafia_${game.id}`)
        .setLabel('ورود به بازی')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮'),
      new ButtonBuilder()
        .setCustomId(`start_mafia_${game.id}`)
        .setLabel('شروع بازی')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('▶️'),
      new ButtonBuilder()
        .setCustomId(`rules_mafia_${game.id}`)
        .setLabel('قوانین بازی')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📜'),
      new ButtonBuilder()
        .setCustomId(`cancel_mafia_${game.id}`)
        .setLabel('لغو بازی')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );
  }
  
  return gameButtons;
}

/**
 * مخلوط کردن آرایه
 * @param array آرایه ورودی
 * @returns آرایه مخلوط شده
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * ذخیره بازی در پایگاه داده
 * @param game اطلاعات بازی
 * @param isNew آیا بازی جدید است
 */
async function saveGame(game: MafiaGame, isNew: boolean = false) {
  try {
    // تبدیل اطلاعات بازی به فرمت مناسب برای ذخیره‌سازی
    const gameData = {
      gameId: game.id,
      gameType: 'mafia' as any,
      guildId: game.guildId,
      channelId: game.channelId,
      hostId: game.hostId,
      players: game.players,
      scores: [],
      status: game.status,
      settings: {
        timePerTurn: game.settings.timePerDay * 60,
        isPrivate: false,
        allowSpectators: true,
        maxPlayers: game.settings.maxPlayers,
        minPlayers: game.settings.minPlayers,
        prizeCoin: game.settings.prizeCoin,
        language: 'fa' as 'fa'
      },
      startedAt: game.status === 'active' ? game.lastActionTime : undefined,
      endedAt: game.status === 'ended' ? game.lastActionTime : undefined,
      createdAt: game.lastActionTime,
      updatedAt: new Date()
    };
    
    if (isNew) {
      // ایجاد بازی جدید
      await storage.createGameSession(gameData);
    } else {
      // به‌روزرسانی بازی موجود
      await storage.updateGameSession(gameData);
    }
  } catch (error) {
    log(`Error saving mafia game to database: ${error}`, 'error');
  }
}

/**
 * راه‌اندازی سیستم بررسی زمان غیرفعالی
 * @param gameId شناسه بازی
 */
function setupInactivityCheck(gameId: string) {
  const CHECK_INTERVAL = 5 * 60 * 1000; // هر 5 دقیقه بررسی می‌کند
  const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 دقیقه بدون فعالیت
  
  const inactivityTimer = setInterval(async () => {
    const game = activeMafiaGames.get(gameId);
    
    if (!game || game.status === 'ended') {
      clearInterval(inactivityTimer);
      return;
    }
    
    const now = new Date();
    const timeSinceLastAction = now.getTime() - game.lastActionTime.getTime();
    
    if (timeSinceLastAction > INACTIVE_TIMEOUT) {
      // بازی بیش از حد غیرفعال بوده است
      try {
        // لغو تایمرها
        if (game.timers.phase) {
          clearTimeout(game.timers.phase);
        }
        
        // به‌روزرسانی وضعیت بازی
        game.status = 'ended';
        
        // پاکسازی کانال‌های ویس
        await cleanupVoiceChannels(game);
        
        // ارسال پیام اعلام پایان بازی به دلیل غیرفعالی
        const channel = await client.channels.fetch(game.channelId) as TextChannel;
        const inactiveEmbed = new EmbedBuilder()
          .setTitle('⏱️ بازی به دلیل غیرفعالی پایان یافت')
          .setDescription('این بازی به دلیل عدم فعالیت طولانی‌مدت به صورت خودکار پایان یافت.')
          .setColor(MAFIA_COLORS.warning)
          .setTimestamp();
        
        await channel.send({ embeds: [inactiveEmbed] });
        
        // حذف بازی از لیست‌های فعال
        activeMafiaGames.delete(gameId);
        activeGames.delete(gameId);
        
        // به‌روزرسانی بازی در پایگاه داده
        await storage.updateGameSession({
          gameId: game.id,
          gameType: 'mafia' as any,
          guildId: game.guildId,
          channelId: game.channelId,
          hostId: game.hostId,
          players: game.players,
          scores: [],
          status: 'ended',
          settings: {
            timePerTurn: game.settings.timePerDay * 60,
            isPrivate: false,
            allowSpectators: true,
            maxPlayers: game.settings.maxPlayers,
            minPlayers: game.settings.minPlayers,
            prizeCoin: game.settings.prizeCoin,
            language: 'fa' as 'fa'
          },
          startedAt: game.status === 'active' ? game.lastActionTime : undefined,
          endedAt: now,
          updatedAt: new Date()
        });
        
        // پایان تایمر بررسی غیرفعالی
        clearInterval(inactivityTimer);
      } catch (error) {
        log(`Error ending inactive mafia game: ${error}`, 'error');
      }
    }
  }, CHECK_INTERVAL);
}

// ثبت handler ها
export function registerHandler(customId: string, handler: (interaction: ButtonInteraction) => Promise<void>) {
  return { customId, handler };
}

export const handlers = [
  { customId: 'mafia', handler: createMafiaGame },
  { id: 'join_mafia', handler: joinMafiaGame, regex: true },
  { id: 'rules_mafia', handler: showMafiaRules, regex: true },
  { id: 'back_to_mafia', handler: backToMafiaMenu, regex: true },
  { id: 'cancel_mafia', handler: cancelMafiaGame, regex: true },
  { id: 'start_mafia', handler: startMafiaGame, regex: true },
  { id: 'vote_day', handler: dayVoting, regex: true },
  { id: 'vote_player', handler: votePlayer, regex: true },
  { id: 'mafia_kill', handler: mafiaKill, regex: true },
  { id: 'kill_target', handler: killTarget, regex: true },
  { id: 'detective_check', handler: detectiveCheck, regex: true },
  { id: 'check_target', handler: checkTarget, regex: true },
  { id: 'doctor_save', handler: doctorSave, regex: true },
  { id: 'save_target', handler: saveTarget, regex: true }
];