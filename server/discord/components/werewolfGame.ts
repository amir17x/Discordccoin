import { 
  ButtonInteraction, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Guild,
  GuildMember,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Colors
} from 'discord.js';

import { WEREWOLF_EMOJI, GENERAL_EMOJI, ECONOMY_EMOJI, TIME_EMOJI, GAME_EMOJI, ADMIN_EMOJI, AI_EMOJI, ITEM_EMOJI } from '../utils/emojiUtils';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../storage';
import { log } from '../../vite';
import { GameSession } from '../../models/GameSession';

// کلاینت دیسکورد

let client: Client;

// Define interface for Werewolf game roles
interface WerewolfRole {
  name: string;
  description: string;
  emoji: string;
  team: 'village' | 'werewolf' | 'solo';
  nightAction?: boolean;
}

// Define interface for Werewolf player
interface WerewolfPlayer {
  id: string;
  username: string;
  role: string;
  isAlive: boolean;
  votedFor?: string;
  protectedBy?: string;
  wasInvestigated?: boolean;
  voteCount?: number;
}

// Define interface for Werewolf game data
interface WerewolfGameData {
  gameId: string;
  players: WerewolfPlayer[];
  phase: 'lobby' | 'day' | 'night' | 'ended';
  day: number;
  messageId?: string;
  channelId: string;
  hostId: string;
  voiceGeneralId?: string;
  voiceWerewolvesId?: string;
  voiceCategoryId?: string;
  dayVotes: Record<string, string>;  // playerId -> votedForId
  nightActions: Record<string, string>; // roleId_playerId -> targetId
  werewolfVotes: Record<string, string>; // werewolfId -> victimId
  seerChecks: Record<string, string>; // night_playerId -> checkedId
  doctorProtects: Record<string, string>; // night_playerId -> protectedId
  killedTonight?: string;
}

// Define available roles with enhanced emojis and descriptions 
const werewolfRoles: Record<string, WerewolfRole> = {
  villager: {
    name: `${WEREWOLF_EMOJI.VILLAGER} روستایی`,
    description: `${WEREWOLF_EMOJI.ALIVE} با هوش و استدلال خود همراه دیگر روستاییان تلاش کن تا گرگینه‌های مخفی را شناسایی کنی.`,
    emoji: WEREWOLF_EMOJI.VILLAGER,
    team: 'village'
  },
  werewolf: {
    name: `${WEREWOLF_EMOJI.WEREWOLF} گرگینه`,
    description: `${WEREWOLF_EMOJI.NIGHT} شب‌ها با گرگینه‌های دیگر همدست شو و روستاییان را یکی‌یکی حذف کن. روزها هویت خود را مخفی نگه دار!`,
    emoji: WEREWOLF_EMOJI.WEREWOLF,
    team: 'werewolf',
    nightAction: true
  },
  seer: {
    name: `${WEREWOLF_EMOJI.SEER} پیشگو`,
    description: `${WEREWOLF_EMOJI.CHECK} قدرت دیدن حقیقت را داری! هر شب می‌توانی هویت واقعی یک بازیکن را ببینی و متوجه شوی آیا گرگینه است یا نه.`,
    emoji: WEREWOLF_EMOJI.SEER,
    team: 'village',
    nightAction: true
  },
  doctor: {
    name: `${WEREWOLF_EMOJI.DOCTOR} پزشک`,
    description: `${WEREWOLF_EMOJI.HEAL} تخصص تو نجات جان روستاییان است! هر شب می‌توانی یک نفر را از حمله‌ی مرگبار گرگینه‌ها نجات دهی.`,
    emoji: WEREWOLF_EMOJI.DOCTOR,
    team: 'village',
    nightAction: true
  },
  hunter: {
    name: `${WEREWOLF_EMOJI.HUNTER} شکارچی`,
    description: `${WEREWOLF_EMOJI.KILL} حتی مرگ هم نمی‌تواند جلوی تو را بگیرد! اگر کشته شوی، می‌توانی در آخرین لحظه یک نفر را با خود به دیار مرگ ببری.`,
    emoji: WEREWOLF_EMOJI.HUNTER,
    team: 'village'
  },
  bodyguard: {
    name: `${WEREWOLF_EMOJI.GUARD} محافظ`,
    description: `${WEREWOLF_EMOJI.PROTECT} جان خود را فدای دیگران می‌کنی! هر شب می‌توانی از یک بازیکن محافظت کنی و اگر گرگینه‌ها به او حمله کنند، به جای او می‌میری.`,
    emoji: WEREWOLF_EMOJI.GUARD,
    team: 'village',
    nightAction: true
  }
};

// Store active games
const activeWerewolfGames = new Map<string, WerewolfGameData>();

/**
 * ایجاد بازی جدید گرگینه
 * @param interaction برهم‌کنش دکمه
 */
export async function createWerewolfGame(interaction: ButtonInteraction) {
  try {
    // بررسی دسترسی‌های لازم
    const channel = interaction.channel as TextChannel;
    
    // بررسی آیا قبلاً بازی فعالی در این کانال وجود دارد یا خیر
    const activeSessions = await storage.getActiveGameSessions();
    const existingSession = activeSessions.find(session => session.channelId === channel.id);
    if (existingSession) {
      await interaction.reply({ 
        content: '❌ یک بازی در حال اجرا در این کانال وجود دارد. لطفاً منتظر بمانید تا آن بازی به پایان برسد.', 
        ephemeral: true 
      });
      return;
    }
    
    // ایجاد شناسه یکتا برای بازی
    const gameId = `werewolf_${uuidv4().slice(0, 8)}`;
    
    // ایجاد داده‌های بازی گرگینه
    const werewolfGame: WerewolfGameData = {
      gameId,
      players: [],
      phase: 'lobby',
      day: 0,
      channelId: channel.id,
      hostId: interaction.user.id,
      dayVotes: {},
      nightActions: {},
      werewolfVotes: {},
      seerChecks: {},
      doctorProtects: {}
    };
    
    // ایجاد جلسه بازی در دیتابیس
    const gameSession: GameSession = {
      gameId: gameId,
      gameType: 'werewolf',
      guildId: interaction.guildId || "",
      channelId: channel.id,
      hostId: interaction.user.id,
      players: [interaction.user.id],
      scores: [],
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
      data: werewolfGame,
      settings: {
        timePerTurn: 60,
        isPrivate: false,
        allowSpectators: true,
        minPlayers: 6,
        maxPlayers: 12,
        prizeCoin: 500,
        language: 'fa',
        dayDuration: 300,
        nightDuration: 180,
        votingSystem: 'majority'
      }
    };
    
    // ذخیره در حافظه و دیتابیس
    activeWerewolfGames.set(gameId, werewolfGame);
    
    // افزودن هاست به لیست بازیکنان
    werewolfGame.players.push({
      id: interaction.user.id,
      username: interaction.user.username,
      role: '',
      isAlive: true
    });
    
    // ساخت embed برای نمایش اطلاعات بازی
    const embed = new EmbedBuilder()
      .setTitle(`${WEREWOLF_EMOJI.WEREWOLF} بازی گرگینه`)
      .setDescription(`تو یه دهکده پر از گرگینه‌ها گیر افتادی! باید با شهروندا همکاری کنی تا گرگینه‌ها رو پیدا کنی، یا اگه گرگینه هستی، شب‌ها شکار کنی! ${WEREWOLF_EMOJI.NIGHT}`)
      .setColor(Colors.DarkBlue)
      .addFields(
        { name: `${WEREWOLF_EMOJI.ROLES} تعداد بازیکنان`, value: `1/${gameSession.settings.maxPlayers}`, inline: true },
        { name: `${TIME_EMOJI.CLOCK} زمان هر روز`, value: '5 دقیقه', inline: true },
        { name: `${WEREWOLF_EMOJI.NIGHT} زمان هر شب`, value: '3 دقیقه', inline: true },
        { name: `${GENERAL_EMOJI.INFO} حداقل بازیکنان`, value: `${gameSession.settings.minPlayers} نفر`, inline: true },
        { name: `${ECONOMY_EMOJI.COIN} جایزه بازی`, value: 'برنده 500 کوین 🤑', inline: true },
        { name: `${WEREWOLF_EMOJI.HOST} میزبان`, value: `${interaction.user.username}`, inline: true }
      )
      .setFooter({ text: `برای شرکت تو بازی، روی دکمه ورود کلیک کن! ${WEREWOLF_EMOJI.JOIN}` });
    
    // دکمه‌های کنترل بازی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`join_werewolf_${gameId}`)
          .setLabel('ورود به بازی')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`start_werewolf_${gameId}`)
          .setLabel('شروع بازی')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true), // فعلاً غیرفعال است تا به حداقل تعداد بازیکن برسیم
        new ButtonBuilder()
          .setCustomId(`rules_werewolf_${gameId}`)
          .setLabel('قوانین بازی')
          .setEmoji('📜')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`cancel_werewolf_${gameId}`)
          .setLabel('لغو بازی')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Danger)
      );
    
    // ارسال پیام و ذخیره شناسه آن
    const message = await channel.send({ 
      embeds: [embed], 
      components: [row] 
    });
    
    // ذخیره شناسه پیام
    werewolfGame.messageId = message.id;
    activeWerewolfGames.set(gameId, werewolfGame);
    
    // ذخیره در دیتابیس
    try {
      await storage.createGameSession(gameSession);
    } catch (error) {
      log(`Error creating game session: ${error}`, 'error');
    }
    
    // پاسخ به تعامل
    await interaction.reply({ 
      content: '✅ بازی گرگینه با موفقیت ایجاد شد. بازیکنان می‌توانند با دکمه ورود به این بازی بپیوندند.', 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error creating werewolf game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در ایجاد بازی گرگینه رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * پیوستن به بازی گرگینه
 * @param interaction برهم‌کنش دکمه
 */
export async function joinWerewolfGame(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی از شناسه دکمه
    const gameId = interaction.customId.replace('join_werewolf_', '');
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    const gameSession = await storage.getGameSession(gameId);
    
    if (!gameData || !gameSession) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (gameData.phase !== 'lobby') {
      await interaction.reply({ 
        content: '❌ این بازی قبلاً شروع شده است و نمی‌توانید به آن بپیوندید.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی تعداد بازیکنان
    if (gameData.players.length >= gameSession.settings.maxPlayers) {
      await interaction.reply({ 
        content: `❌ حداکثر تعداد بازیکنان (${gameSession.settings.maxPlayers} نفر) به این بازی پیوسته‌اند.`, 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا کاربر قبلاً به بازی پیوسته است
    if (gameData.players.some(p => p.id === interaction.user.id)) {
      await interaction.reply({ 
        content: '❌ شما قبلاً به این بازی پیوسته‌اید.', 
        ephemeral: true 
      });
      return;
    }
    
    // افزودن کاربر به بازی
    gameData.players.push({
      id: interaction.user.id,
      username: interaction.user.username,
      role: '',
      isAlive: true
    });
    
    // به‌روزرسانی حافظه
    activeWerewolfGames.set(gameId, gameData);
    
    // به‌روزرسانی دیتابیس
    await storage.updateGameSession(gameId, {
      players: gameData.players.map(p => p.id),
      data: gameData
    });
    
    // بازیابی پیام فعلی بازی
    const channel = interaction.channel as TextChannel;
    const message = await channel.messages.fetch(gameData.messageId!);
    
    if (!message) {
      await interaction.reply({ 
        content: '❌ پیام بازی یافت نشد. لطفاً یک بازی جدید ایجاد کنید.', 
        ephemeral: true 
      });
      return;
    }
    
    // به‌روزرسانی Embed با اطلاعات جدید
    const embed = EmbedBuilder.from(message.embeds[0])
      .setFields(
        { name: `${WEREWOLF_EMOJI.ROLES} تعداد بازیکنان`, value: `${gameData.players.length}/${gameSession.settings.maxPlayers}`, inline: true },
        { name: `${TIME_EMOJI.CLOCK} زمان هر روز`, value: '5 دقیقه', inline: true },
        { name: `${WEREWOLF_EMOJI.NIGHT} زمان هر شب`, value: '3 دقیقه', inline: true },
        { name: `${GENERAL_EMOJI.INFO} حداقل بازیکنان`, value: `${gameSession.settings.minPlayers} نفر`, inline: true },
        { name: `${ECONOMY_EMOJI.COIN} جایزه بازی`, value: 'برنده 500 کوین 🤑', inline: true },
        { name: `${WEREWOLF_EMOJI.HOST} میزبان`, value: `${(await interaction.guild?.members.fetch(gameData.hostId))?.user.username || 'نامشخص'}`, inline: true }
      );
    
    // بازسازی دکمه‌ها با توجه به تعداد بازیکنان
    const canStartGame = gameData.players.length >= gameSession.settings.minPlayers;
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`join_werewolf_${gameId}`)
          .setLabel('ورود به بازی')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`start_werewolf_${gameId}`)
          .setLabel('شروع بازی')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!canStartGame), // فقط وقتی به حداقل تعداد بازیکن رسیدیم فعال شود
        new ButtonBuilder()
          .setCustomId(`rules_werewolf_${gameId}`)
          .setLabel('قوانین بازی')
          .setEmoji('📜')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`cancel_werewolf_${gameId}`)
          .setLabel('لغو بازی')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Danger)
      );
    
    // به‌روزرسانی پیام
    await message.edit({ embeds: [embed], components: [row] });
    
    // پاسخ به تعامل
    await interaction.reply({ 
      content: '✅ شما با موفقیت به بازی گرگینه پیوستید.', 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error joining werewolf game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در پیوستن به بازی گرگینه رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * نمایش قوانین بازی گرگینه
 * @param interaction برهم‌کنش دکمه
 */
export async function showWerewolfRules(interaction: ButtonInteraction) {
  try {
    const rulesEmbed = new EmbedBuilder()
      .setTitle(`${WEREWOLF_EMOJI.RULES} قوانین بازی گرگینه ${WEREWOLF_EMOJI.WEREWOLF}`)
      .setDescription(`${GENERAL_EMOJI.SPARKLES} یک بازی هیجان‌انگیز استراتژیک و نقش‌بازی که مهارت‌های بداهه‌گویی، استدلال و تحلیل شما را به چالش می‌کشد! ${ITEM_EMOJI.ROLE}`)
      .setColor(Colors.DarkBlue)
      .addFields(
        { 
          name: `${GENERAL_EMOJI.INFO} مقدمه بازی`, 
          value: '```در دهکده‌ای دورافتاده، گرگینه‌ها در میان روستاییان مخفی شده‌اند. شب‌ها برای شکار بیرون می‌آیند و روزها خود را پنهان می‌کنند. روستاییان باید با همکاری یکدیگر گرگینه‌ها را پیدا کنند قبل از آنکه همه را نابود کنند!```', 
          inline: false 
        },
        { 
          name: `${WEREWOLF_EMOJI.ROLES} نقش‌های بازی و توانایی‌های ویژه`, 
          value: `${WEREWOLF_EMOJI.WEREWOLF} **گرگینه**: شب‌ها بیدار می‌شوند و با همفکری یکی از روستاییان را شکار می‌کنند. روزها باید هویت خود را مخفی نگه دارند.\n\n${WEREWOLF_EMOJI.VILLAGER} **روستایی**: تنها با استدلال، مشاهده و رأی‌گیری می‌توانند گرگینه‌ها را پیدا کنند.\n\n${WEREWOLF_EMOJI.SEER} **پیشگو**: هر شب می‌تواند هویت واقعی یک بازیکن را ببیند و متوجه شود آیا گرگینه است یا نه.\n\n${WEREWOLF_EMOJI.DOCTOR} **پزشک**: قدرت نجات دارد! هر شب می‌تواند یک نفر را از حمله گرگینه‌ها محافظت کند.\n\n${WEREWOLF_EMOJI.HUNTER} **شکارچی**: قدرت انتقامی دارد! اگر کشته شود، می‌تواند در لحظه مرگ یک نفر دیگر را نیز با خود ببرد.\n\n${WEREWOLF_EMOJI.GUARD} **محافظ**: جان خود را فدای دیگران می‌کند! اگر از شخصی محافظت کند و گرگینه‌ها به او حمله کنند، محافظ به جای او کشته می‌شود.`,
          inline: false 
        },
        { 
          name: `${WEREWOLF_EMOJI.NIGHT} چرخه بازی - فاز شب`, 
          value: `\`\`\`${WEREWOLF_EMOJI.NIGHT} شب فرا می‌رسد و همه به خواب می‌روند...\`\`\`\n\n${WEREWOLF_EMOJI.WEREWOLF} **گرگینه‌ها**: در کانال ویس مخصوص خود جمع می‌شوند و پس از مشورت، قربانی خود را انتخاب می‌کنند.\n\n${WEREWOLF_EMOJI.SEER} **پیشگو**: در پیام خصوصی، یک نفر را انتخاب می‌کند تا هویت واقعی او را ببیند.\n\n${WEREWOLF_EMOJI.DOCTOR} **پزشک**: در پیام خصوصی، یک نفر را برای محافظت در برابر حمله گرگینه‌ها انتخاب می‌کند.\n\n${WEREWOLF_EMOJI.GUARD} **محافظ**: در پیام خصوصی، یک نفر را برای محافظت انتخاب می‌کند.`, 
          inline: false 
        },
        { 
          name: `${WEREWOLF_EMOJI.DAY} چرخه بازی - فاز روز`, 
          value: `\`\`\`${TIME_EMOJI.SUNRISE} صبح می‌شود و بازیکنان از خواب بیدار می‌شوند...\`\`\`\n\n${GENERAL_EMOJI.MESSAGE} **بحث و گفتگو**: همه بازیکنان در کانال ویس عمومی جمع می‌شوند و درباره اتفاقات شب گذشته و اینکه چه کسی ممکن است گرگینه باشد، بحث می‌کنند.\n\n${WEREWOLF_EMOJI.VOTE} **رأی‌گیری**: پس از بحث، همه بازیکنان به یک نفر که فکر می‌کنند گرگینه است رأی می‌دهند.\n\n${ADMIN_EMOJI.BAN} **اجرای عدالت**: شخصی که بیشترین رأی را بیاورد، از بازی حذف می‌شود. آیا او واقعاً گرگینه بود؟`, 
          inline: false 
        },
        { 
          name: `${WEREWOLF_EMOJI.WIN} شرایط پیروزی`, 
          value: `\`\`\`${WEREWOLF_EMOJI.DEAD} بازی ادامه می‌یابد تا یکی از دو گروه به هدف خود برسد...\`\`\`\n\n${WEREWOLF_EMOJI.WEREWOLF} **پیروزی گرگینه‌ها**: زمانی که تعداد گرگینه‌ها با تعداد روستاییان باقی‌مانده برابر شود.\n\n${WEREWOLF_EMOJI.VILLAGER} **پیروزی روستاییان**: زمانی که تمام گرگینه‌ها شناسایی و از بازی حذف شوند.\n\n${ECONOMY_EMOJI.COIN} **جایزه بازی**: تیم برنده 500 کوین دریافت می‌کند!`, 
          inline: false 
        },
        { 
          name: `${GENERAL_EMOJI.IDEA} نکات استراتژیک`, 
          value: `• ${GENERAL_EMOJI.SEARCH} به رفتار مشکوک بازیکنان توجه کنید!\n• ${GENERAL_EMOJI.MESSAGE} از دفاعیات و استدلال‌های خود به خوبی استفاده کنید.\n• ${WEREWOLF_EMOJI.WEREWOLF} اگر گرگینه هستید، سعی کنید نقش دیگری را بازی کنید.\n• ${GAME_EMOJI.PUZZLE} اطلاعات پراکنده را کنار هم بگذارید تا به یک نتیجه منطقی برسید.\n• ${FRIENDSHIP_EMOJI.FRIEND} اتحاد بین روستاییان کلید پیروزی است!`,
          inline: false 
        }
      )
      .setFooter({ text: `${GENERAL_EMOJI.BACK} برای بازگشت به منوی بازی، روی دکمه بازگشت کلیک کن! ${WEREWOLF_EMOJI.GAME}` });
    
    // ایجاد دکمه بازگشت
    const gameId = interaction.customId.replace('rules_werewolf_', '');
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`back_to_werewolf_${gameId}`)
          .setLabel(`بازگشت ${GENERAL_EMOJI.BACK}`)
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.reply({ 
      embeds: [rulesEmbed], 
      components: [row], 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error showing werewolf rules: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در نمایش قوانین بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * بازگشت به منوی اصلی بازی
 * @param interaction برهم‌کنش دکمه
 */
export async function backToWerewolfMenu(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی
    const gameId = interaction.customId.replace('back_to_werewolf_', '');
    
    // بررسی وجود بازی و پیام آن
    const gameData = activeWerewolfGames.get(gameId);
    if (!gameData || !gameData.messageId) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // دریافت پیام اصلی بازی
    const channel = interaction.channel as TextChannel;
    try {
      const message = await channel.messages.fetch(gameData.messageId);
      
      // رد کردن تعامل بدون پاسخ عمومی
      await interaction.deferUpdate();
      
      if ('ephemeral' in interaction.message) {
        await interaction.deleteReply();
      }
    } catch (error) {
      log(`Error getting werewolf game message: ${error}`, 'error');
      
      await interaction.reply({ 
        content: '❌ پیام اصلی بازی قابل دسترسی نیست. ممکن است حذف شده باشد.',
        ephemeral: true
      });
    }
    
  } catch (error) {
    log(`Error returning to werewolf menu: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در بازگشت به منوی بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * لغو و پاکسازی بازی گرگینه
 * @param interaction برهم‌کنش دکمه
 */
export async function cancelWerewolfGame(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی
    const gameId = interaction.customId.replace('cancel_werewolf_', '');
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    if (!gameData) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا قبلاً به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // فقط میزبان یا ادمین می‌تواند بازی را لغو کند
    if (gameData.hostId !== interaction.user.id && 
        !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({ 
        content: '❌ فقط میزبان بازی یا مدیران سرور می‌توانند بازی را لغو کنند.', 
        ephemeral: true 
      });
      return;
    }
    
    // پاکسازی کانال‌های صوتی اگر ایجاد شده‌اند
    if (gameData.voiceCategoryId || gameData.voiceGeneralId || gameData.voiceWerewolvesId) {
      try {
        const guild = interaction.guild!;
        
        if (gameData.voiceWerewolvesId) {
          const werewolfVoice = await guild.channels.fetch(gameData.voiceWerewolvesId);
          if (werewolfVoice) await werewolfVoice.delete();
        }
        
        if (gameData.voiceGeneralId) {
          const generalVoice = await guild.channels.fetch(gameData.voiceGeneralId);
          if (generalVoice) await generalVoice.delete();
        }
        
        if (gameData.voiceCategoryId) {
          const category = await guild.channels.fetch(gameData.voiceCategoryId);
          if (category) await category.delete();
        }
      } catch (error) {
        log(`Error deleting werewolf voice channels: ${error}`, 'warn');
      }
    }
    
    // به‌روزرسانی پیام با اطلاع از لغو بازی
    if (gameData.messageId) {
      try {
        const channel = interaction.channel as TextChannel;
        const message = await channel.messages.fetch(gameData.messageId);
        
        const cancelEmbed = new EmbedBuilder()
          .setTitle(`${GENERAL_EMOJI.CANCEL} بازی گرگینه لغو شد ${WEREWOLF_EMOJI.WEREWOLF}`)
          .setDescription(`این بازی توسط ${interaction.user.username} لغو شد.`)
          .setColor(Colors.Red)
          .setTimestamp();
        
        await message.edit({ embeds: [cancelEmbed], components: [] });
      } catch (error) {
        log(`Error updating werewolf game message: ${error}`, 'warn');
      }
    }
    
    // حذف از حافظه
    activeWerewolfGames.delete(gameId);
    
    // به‌روزرسانی در دیتابیس
    await storage.updateGameSession(gameId, {
      status: 'ended',
      endedAt: new Date(),
      data: {
        ...gameData,
        phase: 'ended'
      }
    });
    
    // پاسخ به تعامل
    await interaction.reply({ 
      content: '✅ بازی گرگینه با موفقیت لغو شد.', 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error canceling werewolf game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در لغو بازی گرگینه رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * شروع بازی گرگینه
 * @param interaction برهم‌کنش دکمه
 */
export async function startWerewolfGame(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی
    const gameId = interaction.customId.replace('start_werewolf_', '');
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    const gameSession = await storage.getGameSession(gameId);
    
    if (!gameData || !gameSession) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا کاربر میزبان بازی است
    if (gameData.hostId !== interaction.user.id) {
      await interaction.reply({ 
        content: '❌ فقط میزبان بازی می‌تواند بازی را شروع کند.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی تعداد بازیکنان
    if (gameData.players.length < gameSession.settings.minPlayers) {
      await interaction.reply({ 
        content: `❌ حداقل ${gameSession.settings.minPlayers} بازیکن برای شروع بازی نیاز است.`, 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (gameData.phase !== 'lobby') {
      await interaction.reply({ 
        content: '❌ این بازی قبلاً شروع شده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // نمایش پیام در حال پردازش
    await interaction.deferReply({ ephemeral: true });
    
    // ایجاد کتگوری و کانال‌های صوتی برای بازی
    try {
      const guild = interaction.guild!;
      
      // ایجاد کتگوری
      const category = await guild.channels.create({
        name: `🐺 گرگینه ${gameData.players[0].username}`,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id, // میزبان دسترسی مدیریت دارد
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels]
          }
        ]
      });
      
      // ایجاد کانال صوتی عمومی
      const generalVoice = await guild.channels.create({
        name: '🏠 روستا',
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
      
      // ایجاد کانال صوتی گرگینه‌ها
      const werewolfVoice = await guild.channels.create({
        name: '🐺 گرگینه‌ها',
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
      
      // ذخیره شناسه کانال‌ها
      gameData.voiceCategoryId = category.id;
      gameData.voiceGeneralId = generalVoice.id;
      gameData.voiceWerewolvesId = werewolfVoice.id;
      
      // تخصیص نقش‌ها به بازیکنان
      assignRoles(gameData);
      
      // تنظیم مجوزهای دسترسی به کانال‌های صوتی بر اساس نقش‌ها
      for (const player of gameData.players) {
        try {
          const member = await guild.members.fetch(player.id);
          
          // دسترسی به کانال عمومی برای همه
          await generalVoice.permissionOverwrites.create(member, {
            ViewChannel: true,
            Connect: true,
            Speak: true
          });
          
          // فقط گرگینه‌ها به کانال گرگینه‌ها دسترسی دارند
          if (player.role === 'werewolf') {
            await werewolfVoice.permissionOverwrites.create(member, {
              ViewChannel: true,
              Connect: true,
              Speak: true
            });
          }
          
          // اطلاع‌رسانی نقش به بازیکنان
          await member.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(`🎭 نقش شما در بازی گرگینه: ${werewolfRoles[player.role].emoji} ${werewolfRoles[player.role].name}`)
                .setDescription(`${werewolfRoles[player.role].description}`)
                .setColor(werewolfRoles[player.role].team === 'village' ? Colors.Green : (werewolfRoles[player.role].team === 'werewolf' ? Colors.Red : Colors.Yellow))
                .addFields(
                  { name: '🎯 هدف', value: werewolfRoles[player.role].team === 'village' ? 'پیدا کردن و از بین بردن تمام گرگینه‌ها' : 'کشتن روستایی‌ها تا زمانی که تعداد گرگینه‌ها با روستایی‌ها برابر شود' },
                  { name: '👥 تیم', value: werewolfRoles[player.role].team === 'village' ? 'روستا' : (werewolfRoles[player.role].team === 'werewolf' ? 'گرگینه‌ها' : 'مستقل') }
                )
            ]
          });
        } catch (error) {
          log(`Error setting permissions for player ${player.username}: ${error}`, 'warn');
        }
      }
      
      // تغییر فاز به شب
      gameData.phase = 'night';
      gameData.day = 1;
      
      // به‌روزرسانی بازی در حافظه
      activeWerewolfGames.set(gameId, gameData);
      
      // به‌روزرسانی در دیتابیس
      await storage.updateGameSession(gameId, {
        status: 'active',
        data: gameData
      });
      
      // به‌روزرسانی پیام اصلی بازی
      await updateGameMessage(gameData);
      
      // شروع فاز شب
      await startNightPhase(gameData, interaction);
      
      // پاسخ به تعامل
      await interaction.editReply({ 
        content: '✅ بازی گرگینه با موفقیت شروع شد! به کاربران پیام خصوصی ارسال شد و فاز شب آغاز شد.' 
      });
    
    } catch (error) {
      log(`Error starting werewolf game: ${error}`, 'error');
      await interaction.editReply({ 
        content: '❌ خطایی در شروع بازی گرگینه رخ داد. لطفاً بعداً دوباره تلاش کنید.' 
      });
    }
    
  } catch (error) {
    log(`Error starting werewolf game: ${error}`, 'error');
    if (interaction.deferred) {
      await interaction.editReply({ 
        content: '❌ خطایی در شروع بازی گرگینه رخ داد. لطفاً بعداً دوباره تلاش کنید.'
      });
    } else {
      await interaction.reply({ 
        content: '❌ خطایی در شروع بازی گرگینه رخ داد. لطفاً بعداً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}

/**
 * تخصیص نقش‌ها به بازیکنان
 * @param gameData داده‌های بازی گرگینه
 */
function assignRoles(gameData: WerewolfGameData) {
  const playerCount = gameData.players.length;
  const rolePool: string[] = [];
  
  // تعیین تعداد گرگینه‌ها بر اساس تعداد بازیکنان
  const werewolfCount = Math.max(1, Math.floor(playerCount / 4));
  
  // افزودن نقش‌های اصلی
  for (let i = 0; i < werewolfCount; i++) {
    rolePool.push('werewolf');
  }
  
  // همیشه یک پیشگو و یک پزشک داریم
  rolePool.push('seer');
  rolePool.push('doctor');
  
  // اگر تعداد بازیکنان کافی باشد، یک شکارچی اضافه می‌کنیم
  if (playerCount >= 7) {
    rolePool.push('hunter');
  }
  
  // اگر تعداد بازیکنان خیلی زیاد باشد، یک محافظ اضافه می‌کنیم
  if (playerCount >= 9) {
    rolePool.push('bodyguard');
  }
  
  // بقیه بازیکنان روستایی هستند
  while (rolePool.length < playerCount) {
    rolePool.push('villager');
  }
  
  // مخلوط کردن نقش‌ها
  shuffleArray(rolePool);
  
  // تخصیص نقش‌ها به بازیکنان
  for (let i = 0; i < gameData.players.length; i++) {
    gameData.players[i].role = rolePool[i];
  }
}

/**
 * بر هم زدن نظم تصادفی آرایه
 * @param array آرایه ورودی
 */
function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * به‌روزرسانی پیام اصلی بازی
 * @param gameData داده‌های بازی گرگینه
 */
async function updateGameMessage(gameData: WerewolfGameData) {
  try {
    const guild = await client.guilds.fetch(client.guilds.cache.first()!.id);
    const channel = await guild.channels.fetch(gameData.channelId) as TextChannel;
    
    if (!channel || !gameData.messageId) {
      log(`Cannot update game message: Channel or message ID not found for game ${gameData.gameId}`, 'error');
      return;
    }
    
    try {
      const message = await channel.messages.fetch(gameData.messageId);
      
      // محتوای پیام بر اساس فاز بازی
      let embed = new EmbedBuilder();
      
      if (gameData.phase === 'lobby') {
        // پیام لابی (در این حالت انتظار نداریم به این تابع برسیم)
        embed = new EmbedBuilder()
          .setTitle('🐺 بازی گرگینه')
          .setDescription('در حال انتظار برای شروع بازی...')
          .setColor(Colors.Blue);
      } else if (gameData.phase === 'night') {
        // فاز شب
        embed = new EmbedBuilder()
          .setTitle(`🌙 شب ${gameData.day}`)
          .setDescription('شب فرا رسیده است. گرگینه‌ها در حال انتخاب قربانی هستند و نقش‌های ویژه در حال انجام اقدامات خود هستند.')
          .setColor(Colors.DarkBlue)
          .addFields(
            { name: '👥 بازیکنان زنده', value: gameData.players.filter(p => p.isAlive).map(p => p.username).join('\n'), inline: true },
            { name: '💀 بازیکنان مرده', value: gameData.players.filter(p => !p.isAlive).length > 0 ? gameData.players.filter(p => !p.isAlive).map(p => p.username).join('\n') : 'هیچ کس', inline: true }
          )
          .setFooter({ text: 'صبر کنید تا فاز شب به پایان برسد...' })
          .setTimestamp();
      } else if (gameData.phase === 'day') {
        // فاز روز
        const lastNightEvents = getLastNightEvents(gameData);
        
        embed = new EmbedBuilder()
          .setTitle(`☀️ روز ${gameData.day}`)
          .setDescription(lastNightEvents)
          .setColor(Colors.Gold)
          .addFields(
            { name: '👥 بازیکنان زنده', value: gameData.players.filter(p => p.isAlive).map(p => p.username).join('\n'), inline: true },
            { name: '💀 بازیکنان مرده', value: gameData.players.filter(p => !p.isAlive).length > 0 ? gameData.players.filter(p => !p.isAlive).map(p => p.username).join('\n') : 'هیچ کس', inline: true }
          )
          .setFooter({ text: `زمان بحث و رای‌گیری! روز ${gameData.day} بازی گرگینه` })
          .setTimestamp();
      } else if (gameData.phase === 'ended') {
        // بازی به پایان رسیده
        const winningTeam = checkWinCondition(gameData);
        
        embed = new EmbedBuilder()
          .setTitle('🏁 بازی گرگینه به پایان رسید!')
          .setDescription(winningTeam === 'village' ? 
            '🎉 روستاییان پیروز شدند! تمام گرگینه‌ها از بین رفتند.' : 
            '🐺 گرگینه‌ها پیروز شدند! آن‌ها توانستند به تعداد برابر با روستاییان برسند.')
          .setColor(winningTeam === 'village' ? Colors.Green : Colors.Red)
          .addFields(
            { 
              name: '🧩 نقش بازیکنان', 
              value: gameData.players.map(p => `${p.username}: ${werewolfRoles[p.role]?.emoji || '❓'} ${werewolfRoles[p.role]?.name || 'نامشخص'}`).join('\n'), 
              inline: false 
            },
            { 
              name: '👑 تیم برنده', 
              value: winningTeam === 'village' ? 'روستاییان' : 'گرگینه‌ها', 
              inline: true 
            },
            { 
              name: '💰 جایزه', 
              value: '500 Ccoin برای هر بازیکن تیم برنده', 
              inline: true 
            }
          )
          .setFooter({ text: 'ممنون از شرکت در بازی گرگینه! برای بازی جدید از /menu استفاده کنید.' })
          .setTimestamp();
      }
      
      // دکمه‌ها بر اساس فاز بازی
      const components: ActionRowBuilder<ButtonBuilder>[] = [];
      
      if (gameData.phase === 'day') {
        const voteRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`vote_day_${gameData.gameId}`)
              .setLabel('رای‌گیری')
              .setEmoji('🗳️')
              .setStyle(ButtonStyle.Primary)
          );
        
        components.push(voteRow);
      }
      
      // به‌روزرسانی پیام
      await message.edit({ embeds: [embed], components });
      
    } catch (error) {
      log(`Error fetching game message: ${error}`, 'error');
    }
    
  } catch (error) {
    log(`Error updating game message: ${error}`, 'error');
  }
}

/**
 * دریافت اتفاقات شب گذشته
 * @param gameData داده‌های بازی گرگینه
 * @returns متن توضیحی اتفاقات شب
 */
function getLastNightEvents(gameData: WerewolfGameData): string {
  let events = '';
  
  if (gameData.killedTonight) {
    const victim = gameData.players.find(p => p.id === gameData.killedTonight);
    if (victim) {
      events += `☠️ دیشب ${victim.username} توسط گرگینه‌ها کشته شد.\n\n`;
    }
  } else {
    events += '🛡️ دیشب هیچ کس کشته نشد! پزشک یا محافظ موفق شدند از هدف گرگینه‌ها محافظت کنند.\n\n';
  }
  
  events += 'اکنون زمان بحث است! درباره اینکه چه کسی می‌تواند گرگینه باشد صحبت کنید و با دکمه رای‌گیری، به مشکوک‌ترین فرد رای دهید.';
  
  return events;
}

/**
 * بررسی شرایط پایان بازی
 * @param gameData داده‌های بازی گرگینه
 * @returns تیم برنده یا null اگر بازی هنوز ادامه دارد
 */
function checkWinCondition(gameData: WerewolfGameData): 'village' | 'werewolf' | null {
  const alivePlayers = gameData.players.filter(p => p.isAlive);
  const aliveWerewolves = alivePlayers.filter(p => p.role === 'werewolf');
  const aliveVillagers = alivePlayers.filter(p => p.role !== 'werewolf');
  
  // گرگینه‌ها برنده می‌شوند اگر تعدادشان با بقیه بازیکنان برابر شود
  if (aliveWerewolves.length >= aliveVillagers.length && aliveWerewolves.length > 0) {
    return 'werewolf';
  }
  
  // روستاییان برنده می‌شوند اگر همه گرگینه‌ها از بین بروند
  if (aliveWerewolves.length === 0 && aliveVillagers.length > 0) {
    return 'village';
  }
  
  // بازی هنوز ادامه دارد
  return null;
}

/**
 * شروع فاز شب
 * @param gameData داده‌های بازی گرگینه
 * @param interaction برهم‌کنش اصلی
 */
async function startNightPhase(gameData: WerewolfGameData, interaction: ButtonInteraction) {
  try {
    // دریافت کانال و گیلد
    const guild = interaction.guild!;
    const channel = guild.channels.cache.get(gameData.channelId) as TextChannel;
    
    // ارسال پیام شروع شب
    const nightEmbed = new EmbedBuilder()
      .setTitle(`${WEREWOLF_EMOJI.NIGHT} شب ${gameData.day} فرا رسید!`)
      .setDescription(`همه به خواب رفتند. ${WEREWOLF_EMOJI.WEREWOLF} گرگینه‌ها بیدار شدند و در حال انتخاب قربانی هستند...`)
      .setColor(Colors.DarkBlue)
      .setFooter({ text: `کاربران با نقش‌های ویژه پیام خصوصی دریافت می‌کنند. ${GENERAL_EMOJI.MESSAGE}` })
      .setTimestamp();
    
    await channel.send({ embeds: [nightEmbed] });
    
    // به‌روزرسانی پیام اصلی بازی
    await updateGameMessage(gameData);
    
    // ارسال پیام‌های خصوصی به نقش‌های ویژه
    const aliveWerewolves = gameData.players.filter(p => p.isAlive && p.role === 'werewolf');
    const aliveSeer = gameData.players.find(p => p.isAlive && p.role === 'seer');
    const aliveDoctor = gameData.players.find(p => p.isAlive && p.role === 'doctor');
    const aliveBodyguard = gameData.players.find(p => p.isAlive && p.role === 'bodyguard');
    
    // پاکسازی اقدامات شب قبل
    gameData.nightActions = {};
    gameData.werewolfVotes = {};
    gameData.seerChecks = {};
    gameData.doctorProtects = {};
    gameData.killedTonight = undefined;
    
    // لیست بازیکنان زنده
    const alivePlayers = gameData.players.filter(p => p.isAlive);
    
    // پیام به گرگینه‌ها
    for (const werewolf of aliveWerewolves) {
      try {
        const member = await guild.members.fetch(werewolf.id);
        
        const targetOptions = alivePlayers
          .filter(p => p.role !== 'werewolf') // گرگینه‌ها نمی‌توانند به یکدیگر حمله کنند
          .map(p => ({
            label: p.username,
            value: p.id,
            description: `انتخاب ${p.username} به عنوان قربانی`
          }));
        
        const werewolfEmbed = new EmbedBuilder()
          .setTitle('🐺 انتخاب قربانی')
          .setDescription(`شب ${gameData.day}: شما یک گرگینه هستید. با سایر گرگینه‌ها در کانال ویس اختصاصی مشورت کنید و یک قربانی انتخاب کنید.`)
          .setColor(Colors.Red)
          .addFields({
            name: '🐺 گرگینه‌های دیگر',
            value: aliveWerewolves.length > 1 ? 
              aliveWerewolves.filter(w => w.id !== werewolf.id).map(w => w.username).join('\n') : 
              'شما تنها گرگینه هستید!'
          })
          .setFooter({ text: 'قربانی خود را با استفاده از منوی زیر انتخاب کنید.' });
        
        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`werewolf_kill_${gameData.gameId}`)
              .setPlaceholder('قربانی را انتخاب کنید...')
              .addOptions(targetOptions)
          );
        
        await member.send({ embeds: [werewolfEmbed], components: [selectMenu] });
      } catch (error) {
        log(`Error sending werewolf message to ${werewolf.username}: ${error}`, 'warn');
      }
    }
    
    // پیام به پیشگو
    if (aliveSeer) {
      try {
        const member = await guild.members.fetch(aliveSeer.id);
        
        const targetOptions = alivePlayers
          .filter(p => p.id !== aliveSeer.id) // پیشگو نمی‌تواند خودش را بررسی کند
          .map(p => ({
            label: p.username,
            value: p.id,
            description: `بررسی نقش ${p.username}`
          }));
        
        const seerEmbed = new EmbedBuilder()
          .setTitle('🔮 پیشگویی')
          .setDescription(`شب ${gameData.day}: شما پیشگو هستید. می‌توانید هویت واقعی یک بازیکن را ببینید.`)
          .setColor(Colors.Purple)
          .setFooter({ text: 'بازیکن مورد نظر را با استفاده از منوی زیر انتخاب کنید.' });
        
        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`seer_check_${gameData.gameId}`)
              .setPlaceholder('بازیکن را انتخاب کنید...')
              .addOptions(targetOptions)
          );
        
        await member.send({ embeds: [seerEmbed], components: [selectMenu] });
      } catch (error) {
        log(`Error sending seer message to ${aliveSeer.username}: ${error}`, 'warn');
      }
    }
    
    // پیام به پزشک
    if (aliveDoctor) {
      try {
        const member = await guild.members.fetch(aliveDoctor.id);
        
        const targetOptions = alivePlayers
          .map(p => ({
            label: p.username,
            value: p.id,
            description: `محافظت از ${p.username}`
          }));
        
        const doctorEmbed = new EmbedBuilder()
          .setTitle('💉 محافظت')
          .setDescription(`شب ${gameData.day}: شما پزشک هستید. می‌توانید یک بازیکن را از حمله گرگینه‌ها محافظت کنید (از جمله خودتان).`)
          .setColor(Colors.Green)
          .setFooter({ text: 'بازیکن مورد نظر را با استفاده از منوی زیر انتخاب کنید.' });
        
        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`doctor_save_${gameData.gameId}`)
              .setPlaceholder('بازیکن را انتخاب کنید...')
              .addOptions(targetOptions)
          );
        
        await member.send({ embeds: [doctorEmbed], components: [selectMenu] });
      } catch (error) {
        log(`Error sending doctor message to ${aliveDoctor.username}: ${error}`, 'warn');
      }
    }
    
    // پیام به محافظ
    if (aliveBodyguard) {
      try {
        const member = await guild.members.fetch(aliveBodyguard.id);
        
        const targetOptions = alivePlayers
          .filter(p => p.id !== aliveBodyguard.id) // محافظ نمی‌تواند از خودش محافظت کند
          .map(p => ({
            label: p.username,
            value: p.id,
            description: `محافظت از ${p.username}`
          }));
        
        const bodyguardEmbed = new EmbedBuilder()
          .setTitle('🛡️ محافظت')
          .setDescription(`شب ${gameData.day}: شما محافظ هستید. می‌توانید یک بازیکن را از حمله گرگینه‌ها محافظت کنید. اگر آن‌ها هدف حمله قرار بگیرند، شما به جای آن‌ها کشته می‌شوید.`)
          .setColor(Colors.Grey)
          .setFooter({ text: 'بازیکن مورد نظر را با استفاده از منوی زیر انتخاب کنید.' });
        
        const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`bodyguard_protect_${gameData.gameId}`)
              .setPlaceholder('بازیکن را انتخاب کنید...')
              .addOptions(targetOptions)
          );
        
        await member.send({ embeds: [bodyguardEmbed], components: [selectMenu] });
      } catch (error) {
        log(`Error sending bodyguard message to ${aliveBodyguard.username}: ${error}`, 'warn');
      }
    }
    
    // تنظیم تایمر برای پایان فاز شب
    setTimeout(() => {
      processNightActions(gameData);
    }, gameData.day === 1 ? 180000 : 120000); // 3 دقیقه برای شب اول، 2 دقیقه برای شب‌های بعدی
    
  } catch (error) {
    log(`Error starting night phase: ${error}`, 'error');
  }
}

/**
 * پردازش اقدامات شب و انتقال به فاز روز
 * @param gameData داده‌های بازی گرگینه
 */
async function processNightActions(gameData: WerewolfGameData) {
  try {
    // تعیین قربانی گرگینه‌ها
    let werewolfTarget: string | undefined;
    
    // اگر رای‌های گرگینه‌ها ثبت شده باشد
    if (Object.keys(gameData.werewolfVotes).length > 0) {
      // شمارش رای‌ها
      const voteCount: Record<string, number> = {};
      
      for (const voterId in gameData.werewolfVotes) {
        const targetId = gameData.werewolfVotes[voterId];
        voteCount[targetId] = (voteCount[targetId] || 0) + 1;
      }
      
      // پیدا کردن بیشترین رای
      let maxVotes = 0;
      for (const targetId in voteCount) {
        if (voteCount[targetId] > maxVotes) {
          maxVotes = voteCount[targetId];
          werewolfTarget = targetId;
        }
      }
    } else {
      // اگر هیچ رایی ثبت نشده، یک قربانی تصادفی انتخاب می‌شود
      const potentialTargets = gameData.players.filter(p => p.isAlive && p.role !== 'werewolf');
      
      if (potentialTargets.length > 0) {
        const randomIndex = Math.floor(Math.random() * potentialTargets.length);
        werewolfTarget = potentialTargets[randomIndex].id;
      }
    }
    
    // بررسی محافظت توسط پزشک یا محافظ
    let isProtected = false;
    let bodyguardDied = false;
    let bodyguardId: string | undefined;
    
    // یافتن بازیکن محافظت شده توسط پزشک
    const doctorTargets = Object.values(gameData.doctorProtects);
    if (doctorTargets.length > 0 && doctorTargets[0] === werewolfTarget) {
      isProtected = true;
    }
    
    // یافتن بازیکن محافظت شده توسط محافظ
    const bodyguardPlayer = gameData.players.find(p => p.isAlive && p.role === 'bodyguard');
    if (bodyguardPlayer) {
      bodyguardId = bodyguardPlayer.id;
      
      // بررسی اقدام محافظ
      const bodyguardAction = Object.entries(gameData.nightActions)
        .find(([key, value]) => key.includes(`bodyguard_${bodyguardPlayer.id}`) && value);
      
      if (bodyguardAction && bodyguardAction[1] === werewolfTarget) {
        isProtected = true;
        bodyguardDied = true;
      }
    }
    
    // پردازش نتیجه حمله گرگینه‌ها
    if (werewolfTarget && !isProtected) {
      // قربانی کشته می‌شود
      const victim = gameData.players.find(p => p.id === werewolfTarget);
      if (victim) {
        victim.isAlive = false;
        gameData.killedTonight = victim.id;
        
        // بررسی اگر قربانی شکارچی است
        if (victim.role === 'hunter') {
          // شکارچی می‌تواند یک نفر را با خود ببرد
          const alivePlayersExceptHunter = gameData.players.filter(p => p.isAlive && p.id !== victim.id);
          
          if (alivePlayersExceptHunter.length > 0) {
            // انتخاب قربانی تصادفی برای شکارچی
            const randomIndex = Math.floor(Math.random() * alivePlayersExceptHunter.length);
            const hunterTarget = alivePlayersExceptHunter[randomIndex];
            hunterTarget.isAlive = false;
          }
        }
      }
    } else if (bodyguardDied && bodyguardId) {
      // محافظ به جای قربانی کشته می‌شود
      const bodyguard = gameData.players.find(p => p.id === bodyguardId);
      if (bodyguard) {
        bodyguard.isAlive = false;
        gameData.killedTonight = bodyguard.id;
      }
    }
    
    // تغییر به فاز روز
    gameData.phase = 'day';
    
    // بررسی شرایط پایان بازی
    const winningTeam = checkWinCondition(gameData);
    
    if (winningTeam) {
      // بازی به پایان رسیده است
      await endGame(gameData, winningTeam);
    } else {
      // ادامه بازی - شروع فاز روز
      await startDayPhase(gameData);
    }
    
  } catch (error) {
    log(`Error processing night actions: ${error}`, 'error');
  }
}

/**
 * شروع فاز روز
 * @param gameData داده‌های بازی گرگینه
 */
async function startDayPhase(gameData: WerewolfGameData) {
  try {
    // دریافت کانال و گیلد
    const guild = client.guilds.cache.first()!;
    const channel = guild.channels.cache.get(gameData.channelId) as TextChannel;
    
    // پاکسازی رای‌های روز قبل
    gameData.dayVotes = {};
    
    // به‌روزرسانی داده‌های بازی
    activeWerewolfGames.set(gameData.gameId, gameData);
    
    // به‌روزرسانی در دیتابیس
    await storage.updateGameSession(gameData.gameId, { data: gameData });
    
    // ارسال پیام شروع روز
    const dayEmbed = new EmbedBuilder()
      .setTitle(`${WEREWOLF_EMOJI.DAY} روز ${gameData.day} فرا رسید!`)
      .setDescription(getLastNightEvents(gameData))
      .setColor(Colors.Gold)
      .setFooter({ text: `اکنون زمان بحث و رای‌گیری است! ${WEREWOLF_EMOJI.VOTE}` })
      .setTimestamp();
    
    await channel.send({ embeds: [dayEmbed] });
    
    // به‌روزرسانی پیام اصلی بازی
    await updateGameMessage(gameData);
    
    // تنظیم تایمر برای پایان فاز روز
    setTimeout(() => {
      processDayVotes(gameData);
    }, 300000); // 5 دقیقه
    
  } catch (error) {
    log(`Error starting day phase: ${error}`, 'error');
  }
}

/**
 * پردازش رای‌های روز و انتقال به فاز شب
 * @param gameData داده‌های بازی گرگینه
 */
async function processDayVotes(gameData: WerewolfGameData) {
  try {
    // دریافت کانال و گیلد
    const guild = client.guilds.cache.first()!;
    const channel = guild.channels.cache.get(gameData.channelId) as TextChannel;
    
    // شمارش رای‌ها
    const voteCount: Record<string, number> = {};
    
    for (const voterId in gameData.dayVotes) {
      const targetId = gameData.dayVotes[voterId];
      voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    }
    
    // پیدا کردن بیشترین رای
    let maxVotes = 0;
    let targetId: string | undefined;
    
    for (const playerId in voteCount) {
      if (voteCount[playerId] > maxVotes) {
        maxVotes = voteCount[playerId];
        targetId = playerId;
      }
    }
    
    // بررسی آیا رای‌ها به حد نصاب رسیده‌اند
    const alivePlayers = gameData.players.filter(p => p.isAlive);
    const requiredVotes = Math.ceil(alivePlayers.length / 2); // نیاز به اکثریت آرا
    
    let votingResult = '';
    
    if (maxVotes >= requiredVotes && targetId) {
      // رای کافی - بازیکن حذف می‌شود
      const target = gameData.players.find(p => p.id === targetId);
      
      if (target) {
        target.isAlive = false;
        
        // نمایش پیغام مناسب
        votingResult = `🗳️ با ${maxVotes} رای از ${alivePlayers.length} رای ممکن، ${target.username} اعدام شد!\n`;
        votingResult += `🎭 نقش واقعی ${target.username}: ${werewolfRoles[target.role].emoji} ${werewolfRoles[target.role].name}`;
        
        // اگر شکارچی اعدام شد
        if (target.role === 'hunter') {
          // شکارچی می‌تواند یک نفر را با خود ببرد
          const alivePlayersExceptHunter = gameData.players.filter(p => p.isAlive && p.id !== target.id);
          
          if (alivePlayersExceptHunter.length > 0) {
            // انتخاب قربانی تصادفی برای شکارچی
            const randomIndex = Math.floor(Math.random() * alivePlayersExceptHunter.length);
            const hunterTarget = alivePlayersExceptHunter[randomIndex];
            hunterTarget.isAlive = false;
            
            votingResult += `\n\n🏹 ${target.username} به عنوان شکارچی، ${hunterTarget.username} را با خود برد!`;
          }
        }
      }
    } else {
      // رای ناکافی - هیچ کس حذف نمی‌شود
      votingResult = '🗳️ رای‌ها به حد نصاب نرسید و هیچ کس اعدام نشد.';
    }
    
    // ارسال نتیجه رای‌گیری
    const voteResultEmbed = new EmbedBuilder()
      .setTitle(`${WEREWOLF_EMOJI.VOTE} نتیجه رای‌گیری روز ${gameData.day}`)
      .setDescription(votingResult)
      .setColor(Colors.Yellow)
      .setTimestamp();
    
    await channel.send({ embeds: [voteResultEmbed] });
    
    // بررسی شرایط پایان بازی
    const winningTeam = checkWinCondition(gameData);
    
    if (winningTeam) {
      // بازی به پایان رسیده است
      await endGame(gameData, winningTeam);
    } else {
      // ادامه بازی - شروع شب بعدی
      gameData.day++;
      gameData.phase = 'night';
      
      // به‌روزرسانی داده‌های بازی
      activeWerewolfGames.set(gameData.gameId, gameData);
      
      // به‌روزرسانی در دیتابیس
      await storage.updateGameSession(gameData.gameId, { data: gameData });
      
      // شروع فاز شب
      const dummyInteraction = { guild } as ButtonInteraction; // ساخت یک شبه-تعامل
      await startNightPhase(gameData, dummyInteraction);
    }
    
  } catch (error) {
    log(`Error processing day votes: ${error}`, 'error');
  }
}

/**
 * پایان بازی و اعلام برنده
 * @param gameData داده‌های بازی گرگینه
 * @param winningTeam تیم برنده
 */
async function endGame(gameData: WerewolfGameData, winningTeam: 'village' | 'werewolf') {
  try {
    // دریافت کانال و گیلد
    const guild = client.guilds.cache.first()!;
    const channel = guild.channels.cache.get(gameData.channelId) as TextChannel;
    
    // تغییر وضعیت بازی
    gameData.phase = 'ended';
    
    // به‌روزرسانی داده‌های بازی
    activeWerewolfGames.set(gameData.gameId, gameData);
    
    // به‌روزرسانی در دیتابیس
    await storage.updateGameSession(gameData.gameId, {
      status: 'ended',
      endedAt: new Date(),
      data: gameData
    });
    
    // تعیین برندگان و پرداخت جایزه
    const winners = gameData.players.filter(p => 
      (winningTeam === 'village' && p.role !== 'werewolf') || 
      (winningTeam === 'werewolf' && p.role === 'werewolf')
    );
    
    const winnersList = winners.map(w => w.username).join(', ');
    
    // پرداخت جایزه
    for (const winner of winners) {
      try {
        const user = await storage.getUserByDiscordId(winner.id);
        if (user) {
          // افزودن 500 سکه به کیف پول و ثبت تراکنش
          await storage.addToWallet(user.id, 500, 'game_win', {
            game: 'werewolf',
            role: winner.role
          });
          
          // ثبت پیروزی در بازی
          await storage.incrementTotalGamesWon(user.id);
        }
      } catch (error) {
        log(`Error rewarding player ${winner.username}: ${error}`, 'warn');
      }
    }
    
    // ثبت شرکت در بازی برای همه بازیکنان
    for (const player of gameData.players) {
      try {
        const user = await storage.getUserByDiscordId(player.id);
        if (user) {
          await storage.incrementTotalGamesPlayed(user.id);
        }
      } catch (error) {
        log(`Error updating game stats for player ${player.username}: ${error}`, 'warn');
      }
    }
    
    // ارسال پیام پایان بازی
    const endGameEmbed = new EmbedBuilder()
      .setTitle('🏁 بازی گرگینه به پایان رسید!')
      .setDescription(winningTeam === 'village' ? 
        '🎉 روستاییان پیروز شدند! تمام گرگینه‌ها از بین رفتند.' : 
        '🐺 گرگینه‌ها پیروز شدند! آن‌ها توانستند به تعداد برابر با روستاییان برسند.')
      .setColor(winningTeam === 'village' ? Colors.Green : Colors.Red)
      .addFields(
        { 
          name: '🧩 نقش بازیکنان', 
          value: gameData.players.map(p => `${p.username}: ${werewolfRoles[p.role]?.emoji || '❓'} ${werewolfRoles[p.role]?.name || 'نامشخص'}`).join('\n'), 
          inline: false 
        },
        { 
          name: '👑 تیم برنده', 
          value: winningTeam === 'village' ? 'روستاییان' : 'گرگینه‌ها', 
          inline: true 
        },
        { 
          name: '🏆 برندگان', 
          value: winnersList || 'هیچ کس', 
          inline: true 
        },
        { 
          name: '💰 جایزه', 
          value: '500 Ccoin برای هر بازیکن تیم برنده', 
          inline: true 
        }
      )
      .setFooter({ text: 'ممنون از شرکت در بازی گرگینه! برای بازی جدید از /menu استفاده کنید.' })
      .setTimestamp();
    
    await channel.send({ embeds: [endGameEmbed] });
    
    // به‌روزرسانی پیام اصلی بازی
    await updateGameMessage(gameData);
    
    // پاکسازی کانال‌های صوتی
    if (gameData.voiceCategoryId || gameData.voiceGeneralId || gameData.voiceWerewolvesId) {
      try {
        if (gameData.voiceWerewolvesId) {
          const werewolfVoice = await guild.channels.fetch(gameData.voiceWerewolvesId);
          if (werewolfVoice) await werewolfVoice.delete();
        }
        
        if (gameData.voiceGeneralId) {
          const generalVoice = await guild.channels.fetch(gameData.voiceGeneralId);
          if (generalVoice) await generalVoice.delete();
        }
        
        if (gameData.voiceCategoryId) {
          const category = await guild.channels.fetch(gameData.voiceCategoryId);
          if (category) await category.delete();
        }
      } catch (error) {
        log(`Error deleting werewolf voice channels: ${error}`, 'warn');
      }
    }
    
  } catch (error) {
    log(`Error ending werewolf game: ${error}`, 'error');
  }
}

/**
 * مدیریت رای‌گیری در فاز روز
 * @param interaction برهم‌کنش دکمه
 */
export async function werewolfDayVoting(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی
    const gameId = interaction.customId.replace('werewolf_vote_day_', '');
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    if (!gameData) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (gameData.phase !== 'day') {
      await interaction.reply({ 
        content: '❌ رای‌گیری فقط در فاز روز امکان‌پذیر است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا کاربر بازیکن زنده است
    const player = gameData.players.find(p => p.id === interaction.user.id);
    if (!player || !player.isAlive) {
      await interaction.reply({ 
        content: '❌ فقط بازیکنان زنده می‌توانند رای دهند.', 
        ephemeral: true 
      });
      return;
    }
    
    // ایجاد منوی انتخاب بازیکن برای رای
    const alivePlayers = gameData.players.filter(p => p.isAlive && p.id !== interaction.user.id);
    
    if (alivePlayers.length === 0) {
      await interaction.reply({ 
        content: '❌ هیچ بازیکن زنده‌ای برای رای دادن وجود ندارد.', 
        ephemeral: true 
      });
      return;
    }
    
    const targetOptions = alivePlayers.map(p => ({
      label: p.username,
      value: p.id,
      description: `رای به ${p.username} برای اعدام`
    }));
    
    const voteEmbed = new EmbedBuilder()
      .setTitle(`${WEREWOLF_EMOJI.VOTE} رای‌گیری`)
      .setDescription(`${WEREWOLF_EMOJI.DAY} روز ${gameData.day}: به کسی که فکر می‌کنید گرگینه است رای دهید.`)
      .setColor(Colors.Yellow)
      .setFooter({ text: `رای شما مخفیانه است. شما فقط یک بار می‌توانید رای دهید، اما می‌توانید رای خود را تغییر دهید. ${GENERAL_EMOJI.INFO}` });
    
    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`werewolf_vote_player_${gameId}`)
          .setPlaceholder('به یک بازیکن رای دهید...')
          .addOptions(targetOptions)
      );
    
    await interaction.reply({ 
      embeds: [voteEmbed], 
      components: [selectMenu], 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error handling day voting: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در رای‌گیری رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مدیریت رای به بازیکن در فاز روز
 * @param interaction برهم‌کنش منوی انتخاب
 */
export async function werewolfVotePlayer(interaction: StringSelectMenuInteraction) {
  try {
    // استخراج شناسه بازی و بازیکن هدف
    const gameId = interaction.customId.replace('werewolf_vote_player_', '');
    const targetId = interaction.values[0];
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    if (!gameData) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (gameData.phase !== 'day') {
      await interaction.reply({ 
        content: '❌ رای‌گیری فقط در فاز روز امکان‌پذیر است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا کاربر بازیکن زنده است
    const player = gameData.players.find(p => p.id === interaction.user.id);
    if (!player || !player.isAlive) {
      await interaction.reply({ 
        content: '❌ فقط بازیکنان زنده می‌توانند رای دهند.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا هدف بازیکن زنده است
    const target = gameData.players.find(p => p.id === targetId && p.isAlive);
    if (!target) {
      await interaction.reply({ 
        content: '❌ بازیکن هدف یافت نشد یا زنده نیست.', 
        ephemeral: true 
      });
      return;
    }
    
    // ثبت رای
    gameData.dayVotes[interaction.user.id] = targetId;
    
    // به‌روزرسانی داده‌های بازی
    activeWerewolfGames.set(gameId, gameData);
    
    // به‌روزرسانی در دیتابیس
    await storage.updateGameSession(gameId, { data: gameData });
    
    // پاسخ به تعامل
    await interaction.reply({ 
      content: `✅ رای شما به ${target.username} با موفقیت ثبت شد.`, 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error handling player vote: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در ثبت رای رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مدیریت اقدام پیشگو
 * @param interaction برهم‌کنش منوی انتخاب
 */
export async function handleSeerCheck(interaction: StringSelectMenuInteraction) {
  try {
    // استخراج شناسه بازی و بازیکن هدف
    const gameId = interaction.customId.replace('seer_check_', '');
    const targetId = interaction.values[0];
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    if (!gameData) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (gameData.phase !== 'night') {
      await interaction.reply({ 
        content: '❌ پیشگویی فقط در فاز شب امکان‌پذیر است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا کاربر پیشگو است
    const seer = gameData.players.find(p => p.id === interaction.user.id && p.role === 'seer' && p.isAlive);
    if (!seer) {
      await interaction.reply({ 
        content: '❌ فقط پیشگوی زنده می‌تواند از این قابلیت استفاده کند.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا هدف بازیکن زنده است
    const target = gameData.players.find(p => p.id === targetId && p.isAlive);
    if (!target) {
      await interaction.reply({ 
        content: '❌ بازیکن هدف یافت نشد یا زنده نیست.', 
        ephemeral: true 
      });
      return;
    }
    
    // ثبت اقدام پیشگو
    gameData.seerChecks[`night_${gameData.day}_${seer.id}`] = targetId;
    gameData.nightActions[`seer_${seer.id}`] = targetId;
    
    // به‌روزرسانی داده‌های بازی
    activeWerewolfGames.set(gameId, gameData);
    
    // به‌روزرسانی در دیتابیس
    await storage.updateGameSession(gameId, { data: gameData });
    
    // پاسخ به تعامل
    const isWerewolf = target.role === 'werewolf';
    
    const resultEmbed = new EmbedBuilder()
      .setTitle(`${WEREWOLF_EMOJI.SEER} نتیجه پیشگویی`)
      .setDescription(`شما هویت ${target.username} را بررسی کردید.`)
      .setColor(isWerewolf ? Colors.Red : Colors.Green)
      .addFields({
        name: `${WEREWOLF_EMOJI.CHECK} نتیجه`,
        value: isWerewolf ? 
          `${target.username} یک ${WEREWOLF_EMOJI.WEREWOLF} **گرگینه** است!` : 
          `${target.username} یک ${WEREWOLF_EMOJI.VILLAGER} روستایی است (نه گرگینه).`
      })
      .setFooter({ text: `این اطلاعات فقط برای شما قابل مشاهده است. ${GENERAL_EMOJI.LOCK}` });
    
    await interaction.reply({ 
      embeds: [resultEmbed], 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error handling seer check: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در انجام پیشگویی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مدیریت اقدام پزشک
 * @param interaction برهم‌کنش منوی انتخاب
 */
export async function handleDoctorSave(interaction: StringSelectMenuInteraction) {
  try {
    // استخراج شناسه بازی و بازیکن هدف
    const gameId = interaction.customId.replace('doctor_save_', '');
    const targetId = interaction.values[0];
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    if (!gameData) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (gameData.phase !== 'night') {
      await interaction.reply({ 
        content: '❌ محافظت فقط در فاز شب امکان‌پذیر است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا کاربر پزشک است
    const doctor = gameData.players.find(p => p.id === interaction.user.id && p.role === 'doctor' && p.isAlive);
    if (!doctor) {
      await interaction.reply({ 
        content: '❌ فقط پزشک زنده می‌تواند از این قابلیت استفاده کند.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا هدف بازیکن زنده است
    const target = gameData.players.find(p => p.id === targetId && p.isAlive);
    if (!target) {
      await interaction.reply({ 
        content: '❌ بازیکن هدف یافت نشد یا زنده نیست.', 
        ephemeral: true 
      });
      return;
    }
    
    // ثبت اقدام پزشک
    gameData.doctorProtects[`night_${gameData.day}_${doctor.id}`] = targetId;
    gameData.nightActions[`doctor_${doctor.id}`] = targetId;
    
    // به‌روزرسانی داده‌های بازی
    activeWerewolfGames.set(gameId, gameData);
    
    // به‌روزرسانی در دیتابیس
    await storage.updateGameSession(gameId, { data: gameData });
    
    // پاسخ به تعامل
    await interaction.reply({ 
      content: `✅ شما تصمیم گرفتید از ${target.username} محافظت کنید. اگر گرگینه‌ها به او حمله کنند، زنده خواهد ماند.`, 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error handling doctor save: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در انجام محافظت رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مدیریت اقدام محافظ
 * @param interaction برهم‌کنش منوی انتخاب
 */
export async function handleBodyguardProtect(interaction: StringSelectMenuInteraction) {
  try {
    // استخراج شناسه بازی و بازیکن هدف
    const gameId = interaction.customId.replace('bodyguard_protect_', '');
    const targetId = interaction.values[0];
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    if (!gameData) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (gameData.phase !== 'night') {
      await interaction.reply({ 
        content: '❌ محافظت فقط در فاز شب امکان‌پذیر است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا کاربر محافظ است
    const bodyguard = gameData.players.find(p => p.id === interaction.user.id && p.role === 'bodyguard' && p.isAlive);
    if (!bodyguard) {
      await interaction.reply({ 
        content: '❌ فقط محافظ زنده می‌تواند از این قابلیت استفاده کند.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا هدف بازیکن زنده است
    const target = gameData.players.find(p => p.id === targetId && p.isAlive);
    if (!target) {
      await interaction.reply({ 
        content: '❌ بازیکن هدف یافت نشد یا زنده نیست.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا هدف خود محافظ نیست
    if (target.id === bodyguard.id) {
      await interaction.reply({ 
        content: '❌ شما نمی‌توانید از خودتان محافظت کنید.', 
        ephemeral: true 
      });
      return;
    }
    
    // ثبت اقدام محافظ
    gameData.nightActions[`bodyguard_${bodyguard.id}`] = targetId;
    
    // به‌روزرسانی داده‌های بازی
    activeWerewolfGames.set(gameId, gameData);
    
    // به‌روزرسانی در دیتابیس
    await storage.updateGameSession(gameId, { data: gameData });
    
    // پاسخ به تعامل
    await interaction.reply({ 
      content: `✅ شما تصمیم گرفتید از ${target.username} محافظت کنید. اگر گرگینه‌ها به او حمله کنند، شما به جای او کشته خواهید شد.`, 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error handling bodyguard protection: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در انجام محافظت رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مدیریت اقدام گرگینه برای کشتن
 * @param interaction برهم‌کنش منوی انتخاب
 */
export async function handleWerewolfKill(interaction: StringSelectMenuInteraction) {
  try {
    // استخراج شناسه بازی و بازیکن هدف
    const gameId = interaction.customId.replace('werewolf_kill_', '');
    const targetId = interaction.values[0];
    
    // بررسی وجود بازی
    const gameData = activeWerewolfGames.get(gameId);
    if (!gameData) {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (gameData.phase !== 'night') {
      await interaction.reply({ 
        content: '❌ حمله گرگینه فقط در فاز شب امکان‌پذیر است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا کاربر گرگینه است
    const werewolf = gameData.players.find(p => p.id === interaction.user.id && p.role === 'werewolf' && p.isAlive);
    if (!werewolf) {
      await interaction.reply({ 
        content: '❌ فقط گرگینه‌های زنده می‌توانند از این قابلیت استفاده کنند.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی آیا هدف بازیکن زنده است
    const target = gameData.players.find(p => p.id === targetId && p.isAlive);
    if (!target) {
      await interaction.reply({ 
        content: '❌ بازیکن هدف یافت نشد یا زنده نیست.', 
        ephemeral: true 
      });
      return;
    }
    
    // ثبت رای گرگینه
    gameData.werewolfVotes[interaction.user.id] = targetId;
    
    // به‌روزرسانی داده‌های بازی
    activeWerewolfGames.set(gameId, gameData);
    
    // به‌روزرسانی در دیتابیس
    await storage.updateGameSession(gameId, { data: gameData });
    
    // بررسی تعداد رای‌های ثبت شده
    const aliveWerewolves = gameData.players.filter(p => p.isAlive && p.role === 'werewolf');
    const votesCount = Object.keys(gameData.werewolfVotes).length;
    
    // پاسخ به تعامل
    if (votesCount >= aliveWerewolves.length) {
      // همه گرگینه‌ها رای داده‌اند
      await interaction.reply({ 
        content: `✅ رای شما به ${target.username} ثبت شد. تمام گرگینه‌ها رای داده‌اند.`, 
        ephemeral: true 
      });
    } else {
      // هنوز همه گرگینه‌ها رای نداده‌اند
      await interaction.reply({ 
        content: `✅ رای شما به ${target.username} ثبت شد. ${aliveWerewolves.length - votesCount} گرگینه دیگر هنوز رای نداده‌اند.`, 
        ephemeral: true 
      });
    }
    
  } catch (error) {
    log(`Error handling werewolf kill: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در ثبت رای گرگینه رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * تنظیم نمونه کلاینت دیسکورد برای استفاده در این ماژول
 * @param discordClient نمونه کلاینت دیسکورد
 */
export function setWerewolfClient(discordClient: Client) {
  client = discordClient;
}