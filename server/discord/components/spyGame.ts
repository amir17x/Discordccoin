/**
 * بازی جاسوس مخفی (Secret Spy)
 * 
 * در این بازی، یک نفر به عنوان جاسوس انتخاب می‌شود و بقیه بازیکنان نقش‌های عادی دارند.
 * همه بازیکنان به جز جاسوس از مکان بازی آگاه هستند. جاسوس باید با سوال پرسیدن و دقت،
 * مکان را حدس بزند و بقیه بازیکنان باید جاسوس را شناسایی کنند.
 * 
 * @module spyGame
 * @requires discord.js
 * @requires ../../storage
 */

import { 
  ButtonInteraction, 
  ChatInputCommandInteraction,
  Client, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  ModalSubmitInteraction, 
  TextInputBuilder,
  TextInputStyle,
  User,
  TextChannel,
  DMChannel,
  PartialDMChannel
} from 'discord.js';
import { storage } from '../../storage';
import { log } from '../../vite';
import { v4 as uuidv4 } from 'uuid';
import GameSessionModel from '../../models/GameSession';
import type { GameSession as DBGameSession } from '../../models/GameSession';
 
// تعریف client برای دسترسی به Discord API
let client: Client;

/**
 * تنظیم نمونه کلاینت دیسکورد برای استفاده در این ماژول
 * @param discordClient نمونه کلاینت دیسکورد
 */
export function setClient(discordClient: Client) {
  client = discordClient;
  log('Spy game client initialized successfully', 'success');
}

// تعریف مکان‌های بازی
interface Location {
  name: string;
  roles: string[];
  emoji: string;
}

// لیست مکان‌های پیش‌فرض بازی
const DEFAULT_LOCATIONS: Location[] = [
  {
    name: 'هواپیما',
    emoji: '✈️',
    roles: ['خلبان', 'مهماندار', 'مسافر', 'مهندس پرواز', 'خدمه امنیتی']
  },
  {
    name: 'بیمارستان',
    emoji: '🏥',
    roles: ['پزشک', 'پرستار', 'بیمار', 'جراح', 'داروساز']
  },
  {
    name: 'مدرسه',
    emoji: '🏫',
    roles: ['معلم', 'دانش‌آموز', 'مدیر', 'معاون', 'سرایدار']
  },
  {
    name: 'رستوران',
    emoji: '🍽️',
    roles: ['سرآشپز', 'گارسون', 'مشتری', 'صندوقدار', 'ظرفشور']
  },
  {
    name: 'استخر',
    emoji: '🏊',
    roles: ['شناگر', 'نجات‌غریق', 'مربی شنا', 'غواص', 'کارمند پذیرش']
  },
  {
    name: 'سینما',
    emoji: '🎬',
    roles: ['بازیگر', 'کارگردان', 'تماشاگر', 'فروشنده بلیط', 'فیلمبردار']
  },
  {
    name: 'فروشگاه',
    emoji: '🛒',
    roles: ['فروشنده', 'مشتری', 'مدیر فروشگاه', 'انباردار', 'حسابدار']
  },
  {
    name: 'پارک',
    emoji: '🌳',
    roles: ['باغبان', 'کودک', 'دونده', 'نگهبان', 'هنرمند خیابانی']
  },
  {
    name: 'کتابخانه',
    emoji: '📚',
    roles: ['کتابدار', 'دانشجو', 'نویسنده', 'محقق', 'مطالعه‌کننده']
  }
];

// تعریف وضعیت‌های بازی
enum SpyGameState {
  LOBBY = 'lobby',     // لابی قبل از شروع بازی
  PLAYING = 'playing', // در حال بازی
  VOTING = 'voting',   // در حال رای‌گیری
  GUESSING = 'guessing', // حدس زدن مکان توسط جاسوس
  ENDED = 'ended'      // بازی تمام شده
}

// تعریف اطلاعات بازیکن
interface SpyPlayer {
  id: string;         // شناسه دیسکورد
  username: string;   // نام کاربری
  isAlive: boolean;   // آیا زنده است
  role: string;       // نقش (یا "spy" برای جاسوس)
  votes: number;      // تعداد آرا علیه این بازیکن
  votedFor?: string;  // به چه کسی رای داده
}

// تعریف اطلاعات بازی جاسوس مخفی
interface SpyGameData {
  id: string;                      // شناسه بازی
  channelId: string;               // کانال بازی
  guildId: string;                 // سرور بازی
  hostId: string;                  // میزبان بازی
  players: Record<string, SpyPlayer>; // بازیکنان
  state: SpyGameState;             // وضعیت بازی
  location?: Location;             // مکان انتخاب شده
  spyId?: string;                  // شناسه جاسوس
  round: number;                   // دور فعلی
  startTime?: Date;                // زمان شروع
  endTime?: Date;                  // زمان پایان
  winners: string[];               // برندگان
  timePerRound: number;            // زمان هر دور به ثانیه
  timer?: NodeJS.Timeout;          // تایمر بازی
  messages: {
    main?: string;                 // پیام اصلی بازی
    roundAnnouncement?: string;    // پیام اعلام دور
  };
  lastActionTime: Date;            // زمان آخرین اقدام

  // فیلدهای مرتبط با سیستم مدیریت جلسه
  status: 'waiting' | 'active' | 'ended';
  createdAt: Date;
  invitedPlayers: string[];        // بازیکنان دعوت شده
  autoStartTime: Date | null;      // زمان شروع خودکار
  settings: {
    maxPlayers: number;            // حداکثر تعداد بازیکنان
    minPlayers: number;            // حداقل تعداد بازیکنان 
    timePerRound: number;          // زمان هر دور به دقیقه
    autoStartEnabled: boolean;     // فعال بودن شروع خودکار
    autoStartDelay: number;        // تاخیر شروع خودکار به دقیقه
    inviteOnly: boolean;           // آیا بازی فقط با دعوت قابل پیوستن است
    prizeCoin: number;             // جایزه سکه برنده
    customLocations?: Location[];  // مکان‌های سفارشی
  };
  timers: {
    round?: NodeJS.Timeout;         // تایمر دور
    autoStart?: NodeJS.Timeout;     // تایمر شروع خودکار
    idle?: NodeJS.Timeout;          // تایمر بررسی غیرفعالی
  };
}

// کش داخلی برای ذخیره بازی‌های فعال
const activeGames = new Map<string, SpyGameData>();

/**
 * ایجاد بازی جاسوس مخفی جدید
 * @param interaction برهم‌کنش کاربر
 */
export async function createSpyGame(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی کانال
    if (!interaction.channel) {
      await interaction.reply({ content: '❌ این دستور باید در یک کانال اجرا شود.', ephemeral: true });
      return;
    }

    // بررسی وجود بازی فعال در کانال
    const existingGame = Array.from(activeGames.values()).find(
      game => game.channelId === interaction.channelId && game.status !== 'ended'
    );

    if (existingGame) {
      await interaction.reply({
        content: '❌ یک بازی جاسوس مخفی در این کانال در حال انجام است. ابتدا آن را تمام کنید.',
        ephemeral: true
      });
      return;
    }

    // ایجاد شناسه جدید برای بازی
    const gameId = uuidv4();

    // تنظیمات پیش‌فرض بازی
    const newGame: SpyGameData = {
      id: gameId,
      channelId: interaction.channelId,
      guildId: interaction.guildId || '',
      hostId: interaction.user.id,
      players: {},
      state: SpyGameState.LOBBY,
      round: 0,
      winners: [],
      timePerRound: 180, // 3 دقیقه هر دور
      messages: {},
      lastActionTime: new Date(),
      
      // مقادیر مربوط به سیستم مدیریت جلسه
      status: 'waiting',
      createdAt: new Date(),
      invitedPlayers: [],
      autoStartTime: null,
      settings: {
        maxPlayers: 10,
        minPlayers: 3,
        timePerRound: 3, // 3 دقیقه
        autoStartEnabled: true,
        autoStartDelay: 5, // 5 دقیقه
        inviteOnly: false,
        prizeCoin: 100
      },
      timers: {}
    };

    // اضافه کردن میزبان به لیست بازیکنان
    newGame.players[interaction.user.id] = {
      id: interaction.user.id,
      username: interaction.user.username,
      isAlive: true,
      role: '',
      votes: 0
    };

    // ذخیره بازی در کش
    activeGames.set(gameId, newGame);

    // ایجاد جلسه بازی در پایگاه داده
    try {
      const gameSession: DBGameSession = {
        gameId: gameId,
        gameType: 'spy',
        guildId: interaction.guildId || '',
        channelId: interaction.channelId,
        hostId: interaction.user.id,
        players: [interaction.user.id],
        scores: [],
        status: 'waiting',
        invitedPlayers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          maxPlayers: newGame.settings.maxPlayers,
          minPlayers: newGame.settings.minPlayers,
          prizeCoin: newGame.settings.prizeCoin,
          timeLimit: newGame.settings.timePerRound * 60, // به ثانیه
          autoStartEnabled: newGame.settings.autoStartEnabled,
          autoStartDelay: newGame.settings.autoStartDelay * 60, // به ثانیه
          inviteOnly: newGame.settings.inviteOnly
        },
        data: newGame
      };

      await storage.saveGameSession(gameSession, true);
      log(`Created new spy game session: ${gameId}`, 'info');
    } catch (dbError) {
      log(`Error saving spy game session to database: ${dbError}`, 'error');
      // ادامه می‌دهیم حتی اگر ذخیره در دیتابیس با خطا مواجه شود
    }

    // تنظیم تایمر بررسی شروع خودکار
    if (newGame.settings.autoStartEnabled) {
      setupAutoStartCheck(gameId);
    }

    // تنظیم تایمر بررسی غیرفعالی
    setupInactivityCheck(gameId);

    // ایجاد امبد نمایش بازی
    const embed = await createGameMenuEmbed(newGame);

    // ایجاد دکمه‌های کنترل بازی
    const buttons = createGameButtons(newGame);

    // ارسال پیام به کانال
    const reply = await interaction.reply({
      embeds: [embed],
      components: [buttons],
      fetchReply: true
    });

    // ذخیره شناسه پیام برای بروزرسانی‌های بعدی
    if ('id' in reply) {
      newGame.messages.main = reply.id;
      
      // بروزرسانی بازی در کش
      activeGames.set(gameId, newGame);
      
      // بروزرسانی جلسه در پایگاه داده
      try {
        await storage.updateGameSession(gameId, { 
          data: newGame,
          updatedAt: new Date()
        });
      } catch (error) {
        log(`Error updating spy game session in database: ${error}`, 'error');
      }
    }

  } catch (error) {
    log(`Error creating spy game: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در ایجاد بازی جاسوس مخفی رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * تنظیم سیستم بررسی شروع خودکار بازی
 * @param gameId شناسه بازی
 */
function setupAutoStartCheck(gameId: string) {
  const game = activeGames.get(gameId);
  if (!game) return;

  // پاکسازی تایمر قبلی اگر وجود دارد
  if (game.timers.autoStart) {
    clearTimeout(game.timers.autoStart);
  }

  // اگر تعداد بازیکنان به حداقل رسیده، تایمر را تنظیم می‌کنیم
  const playerCount = Object.keys(game.players).length;
  if (playerCount >= game.settings.minPlayers && game.status === 'waiting') {
    // محاسبه زمان شروع خودکار
    const autoStartTime = new Date();
    autoStartTime.setMinutes(autoStartTime.getMinutes() + game.settings.autoStartDelay);
    game.autoStartTime = autoStartTime;

    // تنظیم تایمر
    game.timers.autoStart = setTimeout(async () => {
      // بررسی دوباره وضعیت بازی
      const currentGame = activeGames.get(gameId);
      if (!currentGame || currentGame.status !== 'waiting') return;

      // بررسی تعداد بازیکنان
      const currentPlayerCount = Object.keys(currentGame.players).length;
      if (currentPlayerCount >= currentGame.settings.minPlayers) {
        try {
          // شناسایی کانال
          const channel = await client.channels.fetch(currentGame.channelId) as TextChannel;
          if (!channel) return;

          // شروع خودکار بازی
          await startGame(currentGame, null);

          // اطلاع‌رسانی به کانال
          await channel.send({
            content: `🎮 **شروع خودکار بازی جاسوس مخفی**\nحداقل تعداد بازیکنان (${currentGame.settings.minPlayers}) به مدت ${currentGame.settings.autoStartDelay} دقیقه حاضر بودند. بازی به صورت خودکار شروع شد.`
          });
        } catch (error) {
          log(`Error in auto-starting spy game: ${error}`, 'error');
        }
      }
    }, game.settings.autoStartDelay * 60 * 1000); // تبدیل دقیقه به میلی‌ثانیه

    // بروزرسانی بازی در کش
    activeGames.set(gameId, game);
  }
}

/**
 * پیوستن به بازی جاسوس مخفی
 * @param interaction برهم‌کنش کاربر
 */
export async function joinSpyGame(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی از شناسه دکمه
    const gameId = interaction.customId.replace('join_spy_', '');
    
    // بررسی وجود بازی
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت بازی
    if (game.status !== 'waiting') {
      await interaction.reply({
        content: '❌ این بازی قبلاً شروع شده و نمی‌توانید به آن بپیوندید.',
        ephemeral: true
      });
      return;
    }

    // بررسی تعداد بازیکنان
    if (Object.keys(game.players).length >= game.settings.maxPlayers) {
      await interaction.reply({
        content: `❌ این بازی به حداکثر ظرفیت (${game.settings.maxPlayers} بازیکن) رسیده است.`,
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا بازی خصوصی است
    if (game.settings.inviteOnly && !game.invitedPlayers.includes(interaction.user.id) && game.hostId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ این بازی خصوصی است و فقط افراد دعوت شده می‌توانند به آن بپیوندند.',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر قبلاً در بازی است
    if (game.players[interaction.user.id]) {
      await interaction.reply({
        content: '❌ شما قبلاً به این بازی پیوسته‌اید!',
        ephemeral: true
      });
      return;
    }

    // اضافه کردن کاربر به بازی
    game.players[interaction.user.id] = {
      id: interaction.user.id,
      username: interaction.user.username,
      isAlive: true,
      role: '',
      votes: 0
    };

    // به‌روزرسانی زمان آخرین فعالیت
    game.lastActionTime = new Date();

    // بروزرسانی لیست بازیکنان در جلسه بازی
    try {
      await storage.updateGameSession(gameId, {
        players: Object.keys(game.players),
        data: game,
        updatedAt: new Date()
      });
    } catch (error) {
      log(`Error updating spy game session in database: ${error}`, 'error');
    }

    // اگر تعداد بازیکنان به حداقل رسیده، تایمر شروع خودکار را تنظیم می‌کنیم
    if (Object.keys(game.players).length >= game.settings.minPlayers && game.settings.autoStartEnabled) {
      setupAutoStartCheck(gameId);
    }

    // بروزرسانی بازی در کش
    activeGames.set(gameId, game);

    // به‌روزرسانی پیام اصلی بازی
    await updateGameMenu(game);

    // ارسال پیام موفقیت
    await interaction.reply({
      content: '✅ شما با موفقیت به بازی جاسوس مخفی پیوستید!',
      ephemeral: true
    });

  } catch (error) {
    log(`Error joining spy game: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در پیوستن به بازی جاسوس مخفی رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * نمایش قوانین بازی جاسوس مخفی
 * @param interaction برهم‌کنش کاربر
 */
export async function showSpyRules(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.replace('rules_spy_', '');
    
    const embed = new EmbedBuilder()
      .setTitle('🕵️‍♂️ قوانین بازی جاسوس مخفی')
      .setColor(0x8855FF)
      .setDescription('بازی جاسوس مخفی یک بازی گروهی مبتنی بر حدس و استراتژی است.')
      .addFields(
        { name: '📜 قوانین اصلی', value: 
          '1. یک بازیکن به طور تصادفی به عنوان جاسوس انتخاب می‌شود.\n' +
          '2. تمام بازیکنان به جز جاسوس از مکان بازی آگاه می‌شوند.\n' +
          '3. هر بازیکن یک نقش مرتبط با آن مکان دریافت می‌کند.\n' +
          '4. بازیکنان به نوبت از یکدیگر سوال می‌پرسند تا جاسوس را شناسایی کنند.'
        },
        { name: '🎮 روند بازی', value:
          '1. بازی در دورهای متوالی پرسش و پاسخ انجام می‌شود.\n' +
          '2. در هر دور، بازیکنان می‌توانند از یکدیگر سوال بپرسند.\n' +
          '3. سوالات باید مرتبط با مکان و نقش‌ها باشد.\n' +
          '4. جاسوس باید تلاش کند بدون لو رفتن، مکان را حدس بزند.'
        },
        { name: '🏆 شرایط پیروزی', value:
          '1. اگر بازیکنان جاسوس را شناسایی کنند، آنها برنده می‌شوند.\n' +
          '2. اگر جاسوس مکان را به درستی حدس بزند، او برنده می‌شود.\n' +
          '3. اگر جاسوس شناسایی نشود و زمان تمام شود، جاسوس برنده می‌شود.'
        }
      )
      .setFooter({ text: 'با دقت بازی کنید و به جزئیات توجه کنید!' });

    // ایجاد دکمه بازگشت به منوی بازی
    const backButton = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`back_to_spy_${gameId}`)
          .setLabel('بازگشت به منوی بازی')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⬅️')
      );

    await interaction.reply({
      embeds: [embed],
      components: [backButton],
      ephemeral: true
    });

  } catch (error) {
    log(`Error showing spy game rules: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در نمایش قوانین بازی رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * بازگشت به منوی اصلی بازی جاسوس مخفی
 * @param interaction برهم‌کنش کاربر
 */
export async function backToSpyMenu(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.replace('back_to_spy_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // ایجاد امبد منوی بازی
    const embed = await createGameMenuEmbed(game);

    // ایجاد دکمه‌های کنترل بازی
    const buttons = createGameButtons(game);

    // ارسال پیام به کاربر
    await interaction.reply({
      embeds: [embed],
      components: [buttons],
      ephemeral: true
    });

  } catch (error) {
    log(`Error returning to spy game menu: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در بازگشت به منوی بازی رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * لغو بازی جاسوس مخفی
 * @param interaction برهم‌کنش کاربر
 */
export async function cancelSpyGame(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.replace('cancel_spy_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر میزبان بازی است
    if (game.hostId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ فقط میزبان بازی می‌تواند آن را لغو کند!',
        ephemeral: true
      });
      return;
    }

    // پاکسازی تایمرها
    if (game.timers.round) clearTimeout(game.timers.round);
    if (game.timers.autoStart) clearTimeout(game.timers.autoStart);
    if (game.timers.idle) clearTimeout(game.timers.idle);

    // تغییر وضعیت بازی
    game.status = 'ended';
    game.state = SpyGameState.ENDED;
    
    // بروزرسانی جلسه در پایگاه داده
    try {
      await storage.updateGameSession(gameId, {
        status: 'ended',
        data: game,
        updatedAt: new Date()
      });
    } catch (error) {
      log(`Error updating spy game session in database: ${error}`, 'error');
    }

    // حذف بازی از کش
    activeGames.delete(gameId);

    // ارسال پیام لغو به کانال
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ بازی جاسوس مخفی لغو شد')
        .setDescription(`بازی توسط میزبان (${interaction.user.username}) لغو شد.`)
        .setColor(0xFF0000)
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }

    // پاسخ به کاربر
    await interaction.reply({
      content: '✅ بازی جاسوس مخفی با موفقیت لغو شد.',
      ephemeral: true
    });

  } catch (error) {
    log(`Error canceling spy game: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در لغو بازی رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * شروع بازی جاسوس مخفی
 * @param interaction برهم‌کنش کاربر یا null در صورت شروع خودکار
 */
export async function startSpyGame(interaction: ButtonInteraction | null) {
  try {
    let gameId;
    
    if (interaction) {
      gameId = interaction.customId.replace('start_spy_', '');
    } else {
      // اگر تابع بدون تعامل فراخوانی شده، آن را نادیده می‌گیریم
      return;
    }
    
    const game = activeGames.get(gameId);
    if (!game) {
      if (interaction) {
        await interaction.reply({
          content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
          ephemeral: true
        });
      }
      return;
    }

    // بررسی اینکه آیا کاربر میزبان بازی است
    if (interaction && game.hostId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ فقط میزبان بازی می‌تواند آن را شروع کند!',
        ephemeral: true
      });
      return;
    }

    // بررسی تعداد بازیکنان
    if (Object.keys(game.players).length < game.settings.minPlayers) {
      if (interaction) {
        await interaction.reply({
          content: `❌ حداقل ${game.settings.minPlayers} بازیکن برای شروع بازی لازم است.`,
          ephemeral: true
        });
      }
      return;
    }

    // شروع بازی
    await startGame(game, interaction);

  } catch (error) {
    log(`Error starting spy game: ${error}`, 'error');
    if (interaction && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در شروع بازی رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * فرآیند شروع بازی
 * @param game اطلاعات بازی
 * @param interaction برهم‌کنش کاربر (می‌تواند null باشد)
 */
async function startGame(game: SpyGameData, interaction: ButtonInteraction | null) {
  try {
    // پاکسازی تایمر شروع خودکار
    if (game.timers.autoStart) {
      clearTimeout(game.timers.autoStart);
      game.timers.autoStart = undefined;
    }

    // تغییر وضعیت بازی
    game.status = 'active';
    game.state = SpyGameState.PLAYING;
    game.startTime = new Date();
    game.round = 1;

    // انتخاب مکان بازی
    const locations = game.settings.customLocations || DEFAULT_LOCATIONS;
    game.location = locations[Math.floor(Math.random() * locations.length)];

    // انتخاب جاسوس
    const playerIds = Object.keys(game.players);
    game.spyId = playerIds[Math.floor(Math.random() * playerIds.length)];

    // انتخاب نقش‌ها برای بقیه بازیکنان
    const roles = [...game.location.roles];
    shuffleArray(roles);
    
    let roleIndex = 0;
    for (const playerId of playerIds) {
      if (playerId === game.spyId) {
        game.players[playerId].role = 'spy';
      } else {
        // اگر نقش‌ها تمام شوند، از اول شروع می‌کنیم
        if (roleIndex >= roles.length) roleIndex = 0;
        game.players[playerId].role = roles[roleIndex++];
      }
    }

    // بروزرسانی بازی در کش
    activeGames.set(game.id, game);

    // بروزرسانی جلسه در پایگاه داده
    try {
      await storage.updateGameSession(game.id, {
        status: 'active',
        data: game,
        updatedAt: new Date()
      });
    } catch (error) {
      log(`Error updating spy game session in database: ${error}`, 'error');
    }

    // ارسال پیام اعلام شروع بازی به کانال
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ بازی جاسوس مخفی شروع شد!')
        .setDescription(
          `**بازی با ${Object.keys(game.players).length} بازیکن شروع شد**\n\n` +
          `هر بازیکن نقش و اطلاعات خود را در پیام خصوصی دریافت خواهد کرد.\n` +
          `زمان هر دور: ${game.settings.timePerRound} دقیقه\n\n` +
          `**قوانین مهم:**\n` +
          `- یک نفر از بازیکنان، جاسوس است و باید مکان را حدس بزند\n` +
          `- بقیه بازیکنان باید با سوال پرسیدن، جاسوس را شناسایی کنند\n` +
          `- سوالات باید با مکان و نقش‌ها مرتبط باشد`
        )
        .setColor(0x8855FF)
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }

    // ارسال پیام خصوصی به هر بازیکن
    for (const playerId in game.players) {
      try {
        const player = game.players[playerId];
        const user = await client.users.fetch(playerId);
        
        const embed = new EmbedBuilder()
          .setTitle('🕵️‍♂️ بازی جاسوس مخفی')
          .setColor(0x8855FF);

        if (playerId === game.spyId) {
          // پیام برای جاسوس
          embed.setDescription(
            `**شما جاسوس هستید!** 🕴️\n\n` +
            `هدف شما حدس زدن مکان بازی است. با دقت به سوالات و پاسخ‌های بقیه گوش کنید\n` +
            `و تلاش کنید بدون لو رفتن، مکان را شناسایی کنید.\n\n` +
            `**نکات مهم:**\n` +
            `- طوری رفتار کنید که انگار از مکان بازی اطلاع دارید\n` +
            `- به پاسخ‌های دیگران دقت کنید تا سرنخ‌هایی درباره مکان بیابید\n` +
            `- سوالات خود را هوشمندانه انتخاب کنید`
          );
        } else {
          // پیام برای بازیکنان عادی
          embed.setDescription(
            `**شما یک بازیکن عادی هستید**\n\n` +
            `**مکان:** ${game.location?.name} ${game.location?.emoji}\n` +
            `**نقش شما:** ${player.role}\n\n` +
            `هدف شما شناسایی جاسوس است. با دقت سوال بپرسید و پاسخ دهید.\n` +
            `جاسوس سعی می‌کند خود را مخفی کند، پس به رفتار بازیکنان توجه کنید.\n\n` +
            `**نکات مهم:**\n` +
            `- سوالات باید مرتبط با مکان و نقش‌ها باشد\n` +
            `- مستقیماً مکان را نام نبرید\n` +
            `- به پاسخ‌های مشکوک دقت کنید`
          );
        }

        await user.send({ embeds: [embed] });
      } catch (error) {
        log(`Error sending DM to player ${playerId}: ${error}`, 'error');
      }
    }

    // تنظیم تایمر برای پایان دور
    game.timers.round = setTimeout(() => {
      endRoundAndStartVoting(game);
    }, game.settings.timePerRound * 60 * 1000); // تبدیل دقیقه به میلی‌ثانیه

    // بروزرسانی پیام اصلی بازی
    await updateGameMenu(game);

    // پاسخ به تعامل اگر وجود دارد
    if (interaction) {
      await interaction.reply({
        content: '✅ بازی جاسوس مخفی با موفقیت شروع شد! نقش‌ها برای بازیکنان ارسال شد.',
        ephemeral: true
      });
    }

  } catch (error) {
    log(`Error in start game process: ${error}`, 'error');
    throw error;
  }
}

/**
 * پایان دور و شروع رای‌گیری
 * @param game اطلاعات بازی
 */
async function endRoundAndStartVoting(game: SpyGameData) {
  try {
    // تغییر وضعیت بازی به رای‌گیری
    game.state = SpyGameState.VOTING;
    
    // پاکسازی تایمر دور
    if (game.timers.round) {
      clearTimeout(game.timers.round);
      game.timers.round = undefined;
    }

    // صفر کردن آرای بازیکنان
    for (const playerId in game.players) {
      game.players[playerId].votes = 0;
      game.players[playerId].votedFor = undefined;
    }

    // بروزرسانی بازی در کش
    activeGames.set(game.id, game);

    // بروزرسانی در پایگاه داده
    try {
      await storage.updateGameSession(game.id, {
        data: game,
        updatedAt: new Date()
      });
    } catch (error) {
      log(`Error updating spy game session in database: ${error}`, 'error');
    }

    // ارسال پیام اعلام شروع رای‌گیری به کانال
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ مرحله رای‌گیری بازی جاسوس مخفی')
        .setDescription(
          `زمان رای‌گیری فرا رسیده است! هر بازیکن باید به فردی که فکر می‌کند جاسوس است رای دهد.\n\n` +
          `**روش رای‌گیری:**\n` +
          `1. روی دکمه "رای‌گیری" کلیک کنید\n` +
          `2. بازیکن مورد نظر خود را انتخاب کنید\n` +
          `3. رای شما ثبت خواهد شد\n\n` +
          `پس از پایان رای‌گیری، نتایج اعلام می‌شود.`
        )
        .setColor(0xFF5500)
        .setTimestamp();

      // ایجاد دکمه رای‌گیری
      const voteButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`spy_vote_${game.id}`)
            .setLabel('رای دادن')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🗳️')
        );

      const message = await channel.send({
        embeds: [embed],
        components: [voteButton]
      });

      // تنظیم تایمر برای پایان رای‌گیری (2 دقیقه)
      game.timers.round = setTimeout(() => {
        endVotingAndProcessResults(game);
      }, 2 * 60 * 1000);

      // بروزرسانی بازی در کش
      activeGames.set(game.id, game);
    }
  } catch (error) {
    log(`Error ending round and starting voting: ${error}`, 'error');
  }
}

/**
 * نمایش منوی رای‌گیری
 * @param interaction برهم‌کنش کاربر
 */
export async function showVotingMenu(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.replace('spy_vote_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت بازی
    if (game.state !== SpyGameState.VOTING) {
      await interaction.reply({
        content: '❌ در حال حاضر امکان رای‌گیری وجود ندارد!',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر در بازی شرکت دارد
    if (!game.players[interaction.user.id]) {
      await interaction.reply({
        content: '❌ شما بازیکن این بازی نیستید!',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا قبلاً رای داده
    if (game.players[interaction.user.id].votedFor) {
      await interaction.reply({
        content: '❌ شما قبلاً رای خود را ثبت کرده‌اید!',
        ephemeral: true
      });
      return;
    }

    // ایجاد منوی انتخاب بازیکنان
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`spy_vote_select_${gameId}`)
      .setPlaceholder('بازیکنی که فکر می‌کنید جاسوس است را انتخاب کنید')
      .setMinValues(1)
      .setMaxValues(1);

    // اضافه کردن بازیکنان زنده به جز خود کاربر
    for (const playerId in game.players) {
      if (playerId !== interaction.user.id && game.players[playerId].isAlive) {
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(game.players[playerId].username)
            .setValue(playerId)
        );
      }
    }

    // ایجاد سطر اجزا
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    // ارسال منوی رای‌گیری
    await interaction.reply({
      content: '🗳️ لطفاً بازیکنی که فکر می‌کنید جاسوس است را انتخاب کنید:',
      components: [row],
      ephemeral: true
    });

  } catch (error) {
    log(`Error showing voting menu: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در نمایش منوی رای‌گیری رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * ثبت رای بازیکن
 * @param interaction تعامل منوی انتخاب
 */
export async function processVote(interaction: StringSelectMenuInteraction) {
  try {
    const gameId = interaction.customId.replace('spy_vote_select_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت بازی
    if (game.state !== SpyGameState.VOTING) {
      await interaction.reply({
        content: '❌ در حال حاضر امکان رای‌گیری وجود ندارد!',
        ephemeral: true
      });
      return;
    }

    // دریافت بازیکن هدف
    const targetPlayerId = interaction.values[0];
    
    // ثبت رای
    game.players[interaction.user.id].votedFor = targetPlayerId;
    game.players[targetPlayerId].votes += 1;
    
    // بروزرسانی بازی در کش
    activeGames.set(game.id, game);

    // بروزرسانی در پایگاه داده
    try {
      await storage.updateGameSession(game.id, {
        data: game,
        updatedAt: new Date()
      });
    } catch (error) {
      log(`Error updating spy game session in database: ${error}`, 'error');
    }

    // بررسی اینکه آیا همه بازیکنان رای داده‌اند
    let allVoted = true;
    for (const playerId in game.players) {
      if (game.players[playerId].isAlive && !game.players[playerId].votedFor) {
        allVoted = false;
        break;
      }
    }

    // اگر همه رای داده‌اند، به مرحله بعد می‌رویم
    if (allVoted) {
      // پاکسازی تایمر رای‌گیری
      if (game.timers.round) {
        clearTimeout(game.timers.round);
        game.timers.round = undefined;
      }
      
      // پردازش نتایج رای‌گیری
      setTimeout(() => {
        endVotingAndProcessResults(game);
      }, 1000); // تاخیر کوچک برای اطمینان از ثبت پاسخ
    }

    // ارسال پاسخ به کاربر
    await interaction.reply({
      content: `✅ رای شما به **${game.players[targetPlayerId].username}** با موفقیت ثبت شد.`,
      ephemeral: true
    });

  } catch (error) {
    log(`Error processing vote: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در ثبت رای رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * پایان رای‌گیری و پردازش نتایج
 * @param game اطلاعات بازی
 */
async function endVotingAndProcessResults(game: SpyGameData) {
  try {
    // یافتن بازیکن با بیشترین رای
    let maxVotes = 0;
    let suspectedPlayers: string[] = [];
    
    for (const playerId in game.players) {
      const player = game.players[playerId];
      if (player.votes > maxVotes) {
        maxVotes = player.votes;
        suspectedPlayers = [playerId];
      } else if (player.votes === maxVotes && maxVotes > 0) {
        suspectedPlayers.push(playerId);
      }
    }

    // انتخاب تصادفی در صورت تساوی
    const suspectedPlayerId = suspectedPlayers[Math.floor(Math.random() * suspectedPlayers.length)];
    const isSpy = suspectedPlayerId === game.spyId;

    // ارسال پیام نتیجه به کانال
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    if (channel) {
      let embed;
      
      if (isSpy) {
        // جاسوس پیدا شده است
        embed = new EmbedBuilder()
          .setTitle('🕵️‍♂️ نتیجه رای‌گیری بازی جاسوس مخفی')
          .setDescription(
            `**بازیکنان موفق شدند جاسوس را پیدا کنند!**\n\n` +
            `👤 **جاسوس:** ${game.players[suspectedPlayerId].username}\n` +
            `🗳️ **تعداد آرا:** ${maxVotes}\n\n` +
            `مکان واقعی بازی: **${game.location?.name}** ${game.location?.emoji}\n\n` +
            `تبریک به تمام بازیکنان عادی! شما برنده شدید! 🎉`
          )
          .setColor(0x00FF00)
          .setTimestamp();
        
        // برنده‌ها: همه به جز جاسوس
        for (const playerId in game.players) {
          if (playerId !== game.spyId) {
            game.winners.push(playerId);
          }
        }
        
        // پایان بازی
        finalizeGame(game, 'city');
      } else {
        // به جاسوس مشکوک نبوده‌اند، پس حالا جاسوس فرصت حدس زدن مکان را دارد
        embed = new EmbedBuilder()
          .setTitle('🕵️‍♂️ نتیجه رای‌گیری بازی جاسوس مخفی')
          .setDescription(
            `**بازیکن اشتباهی به عنوان جاسوس انتخاب شد!**\n\n` +
            `👤 **بازیکن مشکوک:** ${game.players[suspectedPlayerId].username}\n` +
            `🗳️ **تعداد آرا:** ${maxVotes}\n\n` +
            `حالا جاسوس فرصت دارد تا مکان بازی را حدس بزند...`
          )
          .setColor(0xFF0000)
          .setTimestamp();
        
        // تغییر وضعیت بازی به مرحله حدس
        game.state = SpyGameState.GUESSING;
      }
      
      await channel.send({ embeds: [embed] });
      
      // اگر جاسوس پیدا نشده، به جاسوس فرصت حدس می‌دهیم
      if (!isSpy) {
        await giveSpyChanceToGuess(game);
      }
    }
  } catch (error) {
    log(`Error ending voting and processing results: ${error}`, 'error');
  }
}

/**
 * دادن فرصت به جاسوس برای حدس مکان
 * @param game اطلاعات بازی
 */
async function giveSpyChanceToGuess(game: SpyGameData) {
  try {
    // ایجاد منوی انتخاب مکان
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`spy_guess_location_${game.id}`)
      .setPlaceholder('مکان بازی را حدس بزنید')
      .setMinValues(1)
      .setMaxValues(1);

    // افزودن تمام مکان‌های ممکن
    const locations = game.settings.customLocations || DEFAULT_LOCATIONS;
    for (const location of locations) {
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(location.name)
          .setValue(location.name)
          .setEmoji(location.emoji)
      );
    }

    // ایجاد سطر اجزا
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    // ارسال پیام خصوصی به جاسوس
    try {
      const spy = await client.users.fetch(game.spyId!);
      
      const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ حدس مکان بازی')
        .setDescription(
          `شما فرصت دارید مکان بازی را حدس بزنید!\n\n` +
          `اگر به درستی حدس بزنید، شما برنده می‌شوید. در غیر این صورت، بقیه بازیکنان برنده می‌شوند.\n\n` +
          `**از منوی زیر، مکان مورد نظر خود را انتخاب کنید:**`
        )
        .setColor(0x8855FF)
        .setTimestamp();
      
      await spy.send({
        embeds: [embed],
        components: [row]
      });

      // اطلاع به کانال
      const channel = await client.channels.fetch(game.channelId) as TextChannel;
      if (channel) {
        await channel.send({
          content: `🕵️‍♂️ یک پیام خصوصی برای جاسوس ارسال شده است تا مکان را حدس بزند.`
        });
      }

      // تنظیم تایمر برای پایان زمان حدس (30 ثانیه)
      game.timers.round = setTimeout(() => {
        timeoutSpyGuess(game);
      }, 30 * 1000);

      // بروزرسانی بازی در کش
      activeGames.set(game.id, game);
    } catch (error) {
      log(`Error sending location guess DM to spy: ${error}`, 'error');
      
      // در صورت خطا، بازی را تمام می‌کنیم
      for (const playerId in game.players) {
        if (playerId !== game.spyId) {
          game.winners.push(playerId);
        }
      }
      
      finalizeGame(game, 'city');
    }
  } catch (error) {
    log(`Error giving spy chance to guess: ${error}`, 'error');
  }
}

/**
 * پردازش حدس جاسوس
 * @param interaction تعامل منوی انتخاب
 */
export async function processSpyGuess(interaction: StringSelectMenuInteraction) {
  try {
    const gameId = interaction.customId.replace('spy_guess_location_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت بازی
    if (game.state !== SpyGameState.GUESSING) {
      await interaction.reply({
        content: '❌ در حال حاضر امکان حدس مکان وجود ندارد!',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر جاسوس است
    if (interaction.user.id !== game.spyId) {
      await interaction.reply({
        content: '❌ فقط جاسوس می‌تواند مکان را حدس بزند!',
        ephemeral: true
      });
      return;
    }

    // پاکسازی تایمر
    if (game.timers.round) {
      clearTimeout(game.timers.round);
      game.timers.round = undefined;
    }

    // بررسی درستی حدس
    const guessedLocation = interaction.values[0];
    const isCorrect = game.location?.name === guessedLocation;

    // ارسال نتیجه به کانال
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    if (channel) {
      let embed;
      
      if (isCorrect) {
        // جاسوس برنده شده
        embed = new EmbedBuilder()
          .setTitle('🕵️‍♂️ نتیجه حدس جاسوس')
          .setDescription(
            `**جاسوس موفق شد مکان را درست حدس بزند!**\n\n` +
            `👤 **جاسوس:** ${game.players[game.spyId!].username}\n` +
            `🎯 **مکان واقعی:** ${game.location?.name} ${game.location?.emoji}\n` +
            `🎮 **حدس جاسوس:** ${guessedLocation}\n\n` +
            `تبریک به جاسوس! شما برنده شدید! 🎉`
          )
          .setColor(0xFF0000)
          .setTimestamp();
        
        // برنده: فقط جاسوس
        game.winners.push(game.spyId!);
        
        // پایان بازی
        finalizeGame(game, 'spy');
      } else {
        // جاسوس اشتباه حدس زده
        embed = new EmbedBuilder()
          .setTitle('🕵️‍♂️ نتیجه حدس جاسوس')
          .setDescription(
            `**جاسوس نتوانست مکان را درست حدس بزند!**\n\n` +
            `👤 **جاسوس:** ${game.players[game.spyId!].username}\n` +
            `🎯 **مکان واقعی:** ${game.location?.name} ${game.location?.emoji}\n` +
            `❌ **حدس جاسوس:** ${guessedLocation}\n\n` +
            `تبریک به بازیکنان عادی! شما برنده شدید! 🎉`
          )
          .setColor(0x00FF00)
          .setTimestamp();
        
        // برنده‌ها: همه به جز جاسوس
        for (const playerId in game.players) {
          if (playerId !== game.spyId) {
            game.winners.push(playerId);
          }
        }
        
        // پایان بازی
        finalizeGame(game, 'city');
      }
      
      await channel.send({ embeds: [embed] });
    }

    // پاسخ به جاسوس
    await interaction.reply({
      content: isCorrect ? 
        '✅ تبریک! شما مکان را درست حدس زدید و برنده شدید!' : 
        '❌ متاسفانه حدس شما اشتباه بود. بازیکنان عادی برنده شدند!',
      ephemeral: true
    });

  } catch (error) {
    log(`Error processing spy guess: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در پردازش حدس رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * پایان زمان حدس جاسوس
 * @param game اطلاعات بازی
 */
async function timeoutSpyGuess(game: SpyGameData) {
  try {
    // ارسال پیام به کانال
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ پایان زمان حدس جاسوس')
        .setDescription(
          `**جاسوس نتوانست در زمان مقرر مکان را حدس بزند!**\n\n` +
          `👤 **جاسوس:** ${game.players[game.spyId!].username}\n` +
          `🎯 **مکان واقعی:** ${game.location?.name} ${game.location?.emoji}\n\n` +
          `تبریک به بازیکنان عادی! شما برنده شدید! 🎉`
        )
        .setColor(0x00FF00)
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    }

    // برنده‌ها: همه به جز جاسوس
    for (const playerId in game.players) {
      if (playerId !== game.spyId) {
        game.winners.push(playerId);
      }
    }
    
    // پایان بازی
    finalizeGame(game, 'city');
  } catch (error) {
    log(`Error handling spy guess timeout: ${error}`, 'error');
  }
}

/**
 * نهایی کردن بازی و اعطای جوایز
 * @param game اطلاعات بازی
 * @param winnerTeam تیم برنده: 'spy' یا 'city'
 */
async function finalizeGame(game: SpyGameData, winnerTeam: 'spy' | 'city') {
  try {
    // تغییر وضعیت بازی
    game.status = 'ended';
    game.state = SpyGameState.ENDED;
    game.endTime = new Date();

    // پاکسازی تایمرها
    if (game.timers.round) clearTimeout(game.timers.round);
    if (game.timers.autoStart) clearTimeout(game.timers.autoStart);
    if (game.timers.idle) clearTimeout(game.timers.idle);
    game.timers = {};

    // اعطای جایزه به برندگان
    const prizePerWinner = Math.floor(game.settings.prizeCoin / game.winners.length);
    const winnerUsernames: string[] = [];
    
    for (const winnerId of game.winners) {
      try {
        const user = await storage.getUserByDiscordId(winnerId);
        if (user) {
          await storage.addToWallet(user.id, prizePerWinner, 'game_reward', {
            gameType: 'spy',
            result: 'win',
            team: winnerTeam,
            prizePool: game.settings.prizeCoin
          });

          winnerUsernames.push(game.players[winnerId].username);
        }
      } catch (error) {
        log(`Error awarding prize to winner ${winnerId}: ${error}`, 'error');
      }
    }

    // بروزرسانی جلسه در پایگاه داده
    try {
      await storage.updateGameSession(game.id, {
        status: 'ended',
        data: game,
        winners: game.winners,
        updatedAt: new Date()
      });
    } catch (error) {
      log(`Error updating spy game session in database: ${error}`, 'error');
    }

    // ارسال پیام اطلاعات پایان بازی به کانال
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ اطلاعات پایان بازی جاسوس مخفی')
        .setDescription(
          `**بازی به پایان رسید**\n\n` +
          `👤 **جاسوس:** ${game.players[game.spyId!].username}\n` +
          `🏆 **تیم برنده:** ${winnerTeam === 'spy' ? 'جاسوس' : 'شهروندان'}\n` +
          `🎯 **مکان بازی:** ${game.location?.name} ${game.location?.emoji}\n\n` +
          `**برندگان:**\n${winnerUsernames.join('\n')}\n\n` +
          `**جایزه هر برنده:** ${prizePerWinner} سکه 💰`
        )
        .setColor(0x8855FF)
        .setFooter({ text: 'برای بازی جدید، دستور /game را استفاده کنید' })
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    }

    // حذف بازی از کش
    activeGames.delete(game.id);
  } catch (error) {
    log(`Error finalizing spy game: ${error}`, 'error');
  }
}

/**
 * راه‌اندازی سیستم بررسی زمان غیرفعالی
 * @param gameId شناسه بازی
 */
function setupInactivityCheck(gameId: string) {
  const game = activeGames.get(gameId);
  if (!game) return;

  // پاکسازی تایمر قبلی اگر وجود دارد
  if (game.timers.idle) {
    clearTimeout(game.timers.idle);
  }

  // تنظیم تایمر جدید برای بررسی غیرفعالی (30 دقیقه)
  game.timers.idle = setTimeout(async () => {
    const currentGame = activeGames.get(gameId);
    if (!currentGame) return;

    // محاسبه زمان سپری شده از آخرین فعالیت
    const now = new Date();
    const lastAction = new Date(currentGame.lastActionTime);
    const minutesPassed = (now.getTime() - lastAction.getTime()) / (60 * 1000);

    // اگر بیشتر از 30 دقیقه غیرفعال بوده، بازی را لغو می‌کنیم
    if (minutesPassed > 30 && currentGame.status !== 'ended') {
      // پاکسازی تایمرها
      if (currentGame.timers.round) clearTimeout(currentGame.timers.round);
      if (currentGame.timers.autoStart) clearTimeout(currentGame.timers.autoStart);
      if (currentGame.timers.idle) clearTimeout(currentGame.timers.idle);
      currentGame.timers = {};

      // تغییر وضعیت بازی
      currentGame.status = 'ended';
      currentGame.state = SpyGameState.ENDED;
      
      // بروزرسانی جلسه در پایگاه داده
      try {
        await storage.updateGameSession(gameId, {
          status: 'ended',
          data: currentGame,
          updatedAt: new Date()
        });
      } catch (error) {
        log(`Error updating inactive spy game in database: ${error}`, 'error');
      }

      // ارسال پیام به کانال
      try {
        const channel = await client.channels.fetch(currentGame.channelId) as TextChannel;
        if (channel) {
          await channel.send({
            content: '⚠️ **بازی جاسوس مخفی به دلیل عدم فعالیت به مدت طولانی لغو شد.**'
          });
        }
      } catch (channelError) {
        log(`Error sending inactivity message to channel: ${channelError}`, 'error');
      }

      // حذف بازی از کش
      activeGames.delete(gameId);
    } else {
      // تنظیم مجدد تایمر برای بررسی بعدی
      setupInactivityCheck(gameId);
    }
  }, 10 * 60 * 1000); // بررسی هر 10 دقیقه

  // بروزرسانی بازی در کش
  activeGames.set(gameId, game);
}

/**
 * مدیریت دعوت از بازیکنان به بازی جاسوس مخفی
 * @param interaction برهم‌کنش کاربر
 */
export async function inviteToSpyGame(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.replace('invite_spy_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر میزبان بازی است
    if (game.hostId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ فقط میزبان بازی می‌تواند بازیکنان را دعوت کند!',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت بازی
    if (game.status !== 'waiting') {
      await interaction.reply({
        content: '❌ فقط می‌توان قبل از شروع بازی، بازیکنان را دعوت کرد.',
        ephemeral: true
      });
      return;
    }

    // ایجاد مودال دعوت
    const modal = new ModalBuilder()
      .setCustomId(`spy_invite_modal_${gameId}`)
      .setTitle('دعوت به بازی جاسوس مخفی');

    // ورودی کاربر برای دعوت
    const userIdInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('آیدی کاربر برای دعوت')
      .setPlaceholder('آیدی عددی کاربر را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // ایجاد سطر اجزا
    const firstRow = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(userIdInput);

    // اضافه کردن سطر به مودال
    modal.addComponents(firstRow);

    // نمایش مودال
    await interaction.showModal(modal);

  } catch (error) {
    log(`Error showing invite modal: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در نمایش فرم دعوت رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * پردازش فرم دعوت از کاربر به بازی جاسوس مخفی
 * @param interaction برهم‌کنش فرم ارسالی
 */
export async function processSpyInviteModal(interaction: ModalSubmitInteraction) {
  try {
    const gameId = interaction.customId.replace('spy_invite_modal_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت بازی
    if (game.status !== 'waiting') {
      await interaction.reply({
        content: '❌ فقط می‌توان قبل از شروع بازی، بازیکنان را دعوت کرد.',
        ephemeral: true
      });
      return;
    }

    // دریافت آیدی کاربر
    const userId = interaction.fields.getTextInputValue('user_id');
    
    // بررسی معتبر بودن آیدی
    if (!userId.match(/^\d+$/)) {
      await interaction.reply({
        content: '❌ آیدی کاربر باید عددی باشد.',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر قبلاً در بازی است
    if (game.players[userId]) {
      await interaction.reply({
        content: '❌ این کاربر قبلاً در بازی شرکت دارد!',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر قبلاً دعوت شده
    if (game.invitedPlayers.includes(userId)) {
      await interaction.reply({
        content: '❌ این کاربر قبلاً به بازی دعوت شده است!',
        ephemeral: true
      });
      return;
    }

    // اضافه کردن کاربر به لیست دعوت شده‌ها
    game.invitedPlayers.push(userId);
    
    // به‌روزرسانی زمان آخرین فعالیت
    game.lastActionTime = new Date();

    // بروزرسانی بازی در کش
    activeGames.set(gameId, game);

    // بروزرسانی جلسه در پایگاه داده
    try {
      await storage.updateGameSession(gameId, {
        invitedPlayers: game.invitedPlayers,
        data: game,
        updatedAt: new Date()
      });
    } catch (error) {
      log(`Error updating spy game session in database: ${error}`, 'error');
    }

    // ارسال پیام دعوت به کاربر
    try {
      const user = await client.users.fetch(userId);
      
      const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ دعوت به بازی جاسوس مخفی')
        .setDescription(
          `شما توسط ${interaction.user.username} به یک بازی جاسوس مخفی دعوت شده‌اید!\n\n` +
          `برای پیوستن به بازی، به کانال <#${game.channelId}> مراجعه کنید و دکمه "ورود به بازی" را بزنید.`
        )
        .setColor(0x8855FF)
        .setTimestamp();
      
      await user.send({ embeds: [embed] });
    } catch (error) {
      log(`Error sending invitation DM to user ${userId}: ${error}`, 'error');
    }

    // پاسخ به کاربر
    await interaction.reply({
      content: '✅ دعوت‌نامه با موفقیت ارسال شد! کاربر می‌تواند با مراجعه به کانال بازی، به بازی بپیوندد.',
      ephemeral: true
    });

  } catch (error) {
    log(`Error processing spy invite modal: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در پردازش فرم دعوت رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * مدیریت اخراج بازیکن از بازی جاسوس مخفی
 * @param interaction برهم‌کنش کاربر
 */
export async function kickFromSpyGame(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.replace('kick_spy_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی اینکه آیا کاربر میزبان بازی است
    if (game.hostId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ فقط میزبان بازی می‌تواند بازیکنان را اخراج کند!',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت بازی
    if (game.status !== 'waiting') {
      await interaction.reply({
        content: '❌ فقط می‌توان قبل از شروع بازی، بازیکنان را اخراج کرد.',
        ephemeral: true
      });
      return;
    }

    // بررسی تعداد بازیکنان
    const playerIds = Object.keys(game.players).filter(id => id !== game.hostId);
    if (playerIds.length === 0) {
      await interaction.reply({
        content: '❌ هیچ بازیکنی برای اخراج وجود ندارد!',
        ephemeral: true
      });
      return;
    }

    // ایجاد منوی انتخاب بازیکن
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`spy_kick_select_${gameId}`)
      .setPlaceholder('بازیکن مورد نظر برای اخراج را انتخاب کنید')
      .setMinValues(1)
      .setMaxValues(1);

    // اضافه کردن بازیکنان به منو
    for (const playerId of playerIds) {
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(game.players[playerId].username)
          .setValue(playerId)
      );
    }

    // ایجاد سطر اجزا
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    // ارسال منو
    await interaction.reply({
      content: '👤 لطفاً بازیکن مورد نظر برای اخراج را انتخاب کنید:',
      components: [row],
      ephemeral: true
    });

  } catch (error) {
    log(`Error showing kick menu: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در نمایش منوی اخراج رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * پردازش انتخاب بازیکن برای اخراج از بازی جاسوس مخفی
 * @param interaction برهم‌کنش منوی انتخاب
 */
export async function processSpyKickSelection(interaction: StringSelectMenuInteraction) {
  try {
    const gameId = interaction.customId.replace('spy_kick_select_', '');
    
    const game = activeGames.get(gameId);
    if (!game) {
      await interaction.reply({
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }

    // بررسی وضعیت بازی
    if (game.status !== 'waiting') {
      await interaction.reply({
        content: '❌ فقط می‌توان قبل از شروع بازی، بازیکنان را اخراج کرد.',
        ephemeral: true
      });
      return;
    }

    // دریافت کاربر انتخاب شده
    const selectedUserId = interaction.values[0];
    const playerName = game.players[selectedUserId]?.username || 'کاربر ناشناس';
    
    // حذف کاربر از لیست بازیکنان
    delete game.players[selectedUserId];

    // حذف کاربر از لیست دعوت شده‌ها (اگر وجود داشت)
    const inviteIndex = game.invitedPlayers.indexOf(selectedUserId);
    if (inviteIndex !== -1) {
      game.invitedPlayers.splice(inviteIndex, 1);
    }

    // به‌روزرسانی زمان آخرین فعالیت
    game.lastActionTime = new Date();

    // بروزرسانی بازی در کش
    activeGames.set(gameId, game);

    // بروزرسانی جلسه در پایگاه داده
    try {
      await storage.updateGameSession(gameId, {
        players: Object.keys(game.players),
        invitedPlayers: game.invitedPlayers,
        data: game,
        updatedAt: new Date()
      });
    } catch (error) {
      log(`Error updating spy game session in database: ${error}`, 'error');
    }

    // بروزرسانی منوی بازی
    await updateGameMenu(game);

    // پاسخ به کاربر
    await interaction.reply({
      content: `✅ بازیکن ${playerName} با موفقیت از بازی اخراج شد.`,
      ephemeral: true
    });

  } catch (error) {
    log(`Error processing spy kick selection: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در اخراج بازیکن رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * به‌روزرسانی منوی بازی
 * @param game اطلاعات بازی
 */
async function updateGameMenu(game: SpyGameData) {
  try {
    // بررسی وجود پیام اصلی
    if (!game.messages.main) return;

    // شناسایی کانال
    const channel = await client.channels.fetch(game.channelId) as TextChannel;
    if (!channel) return;

    // تلاش برای یافتن پیام
    try {
      const message = await channel.messages.fetch(game.messages.main);
      
      // ایجاد امبد به‌روزرسانی شده
      const embed = await createGameMenuEmbed(game);
      
      // ایجاد دکمه‌های به‌روزرسانی شده
      const buttons = createGameButtons(game);
      
      // به‌روزرسانی پیام
      await message.edit({
        embeds: [embed],
        components: [buttons]
      });
    } catch (messageError) {
      log(`Error fetching message to update spy game menu: ${messageError}`, 'error');
    }
  } catch (error) {
    log(`Error updating spy game menu: ${error}`, 'error');
  }
}

/**
 * ایجاد Embed منوی بازی
 * @param game اطلاعات بازی
 * @returns EmbedBuilder منوی بازی
 */
async function createGameMenuEmbed(game: SpyGameData): Promise<EmbedBuilder> {
  // ایجاد لیست بازیکنان
  let playersList = '';
  for (const playerId in game.players) {
    const player = game.players[playerId];
    const isHost = playerId === game.hostId;
    playersList += `${isHost ? '👑 ' : '👤 '}${player.username}\n`;
  }

  // محاسبه زمان باقی‌مانده تا شروع خودکار (اگر فعال باشد)
  let autoStartInfo = '';
  if (game.settings.autoStartEnabled && game.autoStartTime && game.status === 'waiting') {
    const now = new Date();
    const autoStartTime = new Date(game.autoStartTime);
    if (autoStartTime > now) {
      const minutesRemaining = Math.ceil((autoStartTime.getTime() - now.getTime()) / (60 * 1000));
      autoStartInfo = `⏱️ شروع خودکار در ${minutesRemaining} دقیقه دیگر\n`;
    }
  }

  // ایجاد امبد
  const embed = new EmbedBuilder()
    .setTitle('🕵️‍♂️ جاسوس مخفی')
    .setColor(0x8855FF)
    .setDescription(
      `**بازی جاسوس مخفی**\n\n` +
      `👑 **میزبان:** ${game.players[game.hostId]?.username || 'نامشخص'}\n` +
      `👥 **بازیکنان (${Object.keys(game.players).length}/${game.settings.maxPlayers}):**\n${playersList}\n` +
      `${autoStartInfo}` +
      `⏳ **حداقل بازیکن لازم برای شروع:** ${game.settings.minPlayers}\n` +
      `💰 **جایزه:** ${game.settings.prizeCoin} سکه\n` +
      `⏱️ **زمان هر دور:** ${game.settings.timePerRound} دقیقه\n\n` +
      `بازیکنان می‌توانند با کلیک بر دکمه "ورود به بازی" به این بازی بپیوندند.`
    )
    .setTimestamp()
    .setFooter({ text: `شناسه بازی: ${game.id}` });

  return embed;
}

/**
 * ایجاد دکمه‌های کنترل بازی
 * @param game اطلاعات بازی
 * @returns ActionRowBuilder دکمه‌های بازی
 */
function createGameButtons(game: SpyGameData): ActionRowBuilder<ButtonBuilder> {
  // بررسی امکان شروع بازی
  const canStartGame = Object.keys(game.players).length >= game.settings.minPlayers;
  
  // ایجاد دکمه‌ها
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`join_spy_${game.id}`)
        .setLabel('ورود به بازی')
        .setEmoji('🎮')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`start_spy_${game.id}`)
        .setLabel('شروع بازی')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!canStartGame),
      new ButtonBuilder()
        .setCustomId(`rules_spy_${game.id}`)
        .setLabel('قوانین بازی')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`invite_spy_${game.id}`)
        .setLabel('دعوت بازیکن')
        .setEmoji('📧')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`kick_spy_${game.id}`)
        .setLabel('اخراج بازیکن')
        .setEmoji('🚫')
        .setStyle(ButtonStyle.Danger)
    );

  return row;
}

/**
 * بهم ریختن تصادفی آرایه
 * @param array آرایه ورودی
 * @returns آرایه بهم‌ریخته شده
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// تعریف لیست handlers برای پردازش دکمه‌ها
export const spyHandlers = [
  { customId: 'create_spy_session', handler: createSpyGame },
  { id: 'join_spy', handler: joinSpyGame, regex: true },
  { id: 'rules_spy', handler: showSpyRules, regex: true },
  { id: 'back_to_spy', handler: backToSpyMenu, regex: true },
  { id: 'cancel_spy', handler: cancelSpyGame, regex: true },
  { id: 'start_spy', handler: startSpyGame, regex: true },
  { id: 'invite_spy', handler: inviteToSpyGame, regex: true },
  { id: 'kick_spy', handler: kickFromSpyGame, regex: true },
  { id: 'spy_vote', handler: showVotingMenu, regex: true }
];