import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  Collection,
  ColorResolvable,
  EmbedBuilder,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  Role,
  TextChannel,
  UserSelectMenuBuilder,
  VoiceChannel
} from 'discord.js';
import { storage } from '../../storage';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/logger';
import { Console } from 'console';

// تنظیم کلاینت دیسکورد
let client: Client;
export function setClient(discordClient: Client) {
  client = discordClient;
}

// مدل جلسه بازی جرأت یا حقیقت
interface TruthOrDareSession {
  id: string;
  guildId: string;
  channelId: string;
  hostId: string;
  players: string[];
  status: 'waiting' | 'active' | 'ended';
  currentPlayerIndex: number;
  scores: Record<string, number>;
  voiceChannelId?: string;
  categoryId?: string;
  roleId?: string;
  sessionNumber: number;
  startedAt?: Date;
  endedAt?: Date;
  lastActionTime: Date;
  settings: {
    timePerTurn: number;       // زمان هر نوبت (ثانیه)
    isPrivate: boolean;        // آیا بازی خصوصی است؟
    allowSpectators: boolean;  // آیا تماشاچی مجاز است؟
    maxPlayers: number;        // حداکثر تعداد بازیکنان
    minPlayers: number;        // حداقل تعداد بازیکنان برای شروع
    prizeCoin: number;         // جایزه سکه برای برنده
    language: 'fa' | 'en';     // زبان بازی
  };
}

// ذخیره جلسات فعال
const activeSessions = new Collection<string, TruthOrDareSession>();

// بانک سوالات حقیقت به فارسی
const truthQuestionsFa = [
  "آخرین باری که به یکی دروغ گفتی کی بود و چه دروغی بود؟ 🤥",
  "بزرگ‌ترین رازت چیه که تا حالا به کسی نگفتی؟ 🕵️",
  "خجالت‌آورترین لحظه زندگیت چی بوده؟ 😳",
  "به چه کسی علاقه داشتی و هرگز بهش نگفتی؟ 💔",
  "آخرین باری که گریه کردی چه زمانی بود و چرا؟ 😢",
  "بدترین اشتباهی که تا به حال مرتکب شدی چه بوده؟ 😬",
  "آیا تا به حال چیزی دزدیدی؟ اگر بله، چه چیزی؟ 👀",
  "بزرگترین ترس تو چیه؟ 🫣",
  "آیا تا به حال کسی رو بوسیدی؟ اگر بله، اولین بار کی بود؟ 💋",
  "تا حالا تقلب کردی؟ اگر بله، در چه موردی و چطور؟ 📝",
  "آیا تا به حال کسی رو دوست داشتی که در رابطه بود؟ 💔",
  "آیا تا به حال به کسی که دوست‌اش داری اعتراف کردی و جواب رد شنیدی؟ 💔",
  "از بین افراد حاضر در این بازی، با چه کسی بیشتر راحتی؟ 👥",
  "اگر یک روز نامرئی می‌شدی، چه کاری انجام می‌دادی؟ 🫥",
  "آخرین باری که خودت رو خیس کردی کی بود؟ 💦",
  "شرم‌آورترین عادت تو چیه؟ 😅",
  "از بین افراد حاضر در این بازی، با چه کسی حاضر نیستی در یک اتاق تنها بمونی؟ 👀",
  "آخرین باری که کسی رو دوست داشتی کی بود؟ 💘",
  "از همه افراد این گروه چه کسی رو بیشتر از همه دوست داری؟ 👥",
  "فکر می‌کنی در بین حاضرین چه کسی بیشتر از همه دروغ میگه؟ 🤥",
  "اولین قرار عاشقانه‌ات چطور بود؟ 💕",
  "شرمآورترین پیامی که تا به حال فرستادی چی بوده؟ 📱",
  "اگه یک دقیقه فرصت داشته باشی هر چی دلت می‌خواد بگی، چی میگی؟ 🗣️",
  "شخصیت مورد علاقه‌ت در فیلم یا سریال کیه و چرا؟ 🎬",
  "اولین کلمه‌ای که با دیدن نفر سمت راستت به ذهنت میاد چیه؟ 👤",
  "بیشترین پولی که تا به حال خرج کردی برای چی بوده؟ 💰",
  "چیزی که همیشه دوست داشتی به یکی از افراد اینجا بگی ولی نتونستی چیه؟ 🤐",
  "از یک تا ده، به خودت چه نمره‌ای میدی از نظر جذابیت؟ چرا؟ 🔟",
  "تا حالا تو زندگیت از کسی متنفر بودی؟ چرا؟ 😡",
  "اگه بتونی یکی از افراد حاضر در این گروه رو با خودت به یه سفر ببری، کی رو انتخاب می‌کنی؟ 🧳"
];

// بانک چالش‌های جرأت به فارسی
const dareChallengesFa = [
  "یه آهنگ رو با صدای بلند تو کانال ویس بخون! 🎤",
  "به یکی از دوستات یه پیام خنده‌دار بفرست و اسکرین‌شاتش رو بفرست! 📱",
  "10 ثانیه با صدای یه شخصیت کارتونی حرف بزن! 🦁",
  "یه شعر کوتاه درباره یکی از بازیکنا بگو! ✍️",
  "بلندترین خنده‌ای که می‌تونی بکن! 😂",
  "از رو صندلی بلند شو و یه حرکت رقص انجام بده! 💃",
  "به مدت 30 ثانیه مثل یه حیوون رفتار کن! 🐒",
  "با حرکت دست اسم یکی از فیلم‌های معروف رو نشون بده تا بقیه حدس بزنن! 🎬",
  "یه جوک بگو که همه رو بخندونه! 😄",
  "به آخرین فردی که بهش پیام دادی زنگ بزن و بگو دوستت دارم! ❤️",
  "با یکی از بازیکنا جای صندلی‌ات رو عوض کن! 🪑",
  "یه مسابقه زل زدن با یکی از بازیکنا شروع کن! 👁️",
  "خودت رو معرفی کن ولی همه کلمات باید با یه حرف خاص شروع بشه! 🔤",
  "سعی کن بقیه رو با یه داستان ترسناک بترسونی! 👻",
  "یه تصویر سلفی از خودت بگیر با یه صورت خنده‌دار! 🤳",
  "با چشم‌های بسته سعی کن یه نقاشی از کسی که سمت راستت نشسته بکشی! 🖌️",
  "زشت‌ترین عکسی که داری از خودت رو به گروه نشون بده! 📸",
  "تا 30 ثانیه فقط برعکس صحبت کن! ⏱️",
  "بلند شو و ادای یکی از بازیکنا رو دربیار! 🎭",
  "بذار یکی از بازیکنا آرایشت کنه! 💄",
  "بذار یکی از بازیکنا از صورتت عکس بگیره و تو پروفایلت بذاره! 📱",
  "پنج دقیقه تلفنت رو به یکی از بازیکنا بده تا هر کاری می‌خواد بکنه! 📲",
  "بلند شو و 10 تا شنا برو! 💪",
  "با دهن بسته سعی کن یه آهنگ بخونی، بقیه باید حدس بزنن چیه! 🎵",
  "با کسی که روبروی تو نشسته جای خودت رو عوض کن و تا آخر بازی همونجا بمون! 🔄",
  "سعی کن 3 تا شکلک مختلف با صورتت درست کنی! 😜",
  "یه پیام خنده‌دار برای یکی از مخاطبین گوشیت بنویس و برای همه بخون! 📝",
  "تا 5 دقیقه آینده هر حرفی بقیه میزنن، باید با «بله استاد» جواب بدی! 👨‍🏫",
  "یه ویدیو از خودت بگیر که داری بلند می‌خونی «من یه ستاره ام»! ⭐",
  "مثل یه نوجوان لوس برای 2 دقیقه رفتار کن! 👶"
];

/**
 * مدیریت دستور اسلش برای شروع بازی جرأت یا حقیقت
 * @param interaction دستور اسلش
 */
export async function handleTruthOrDareCommand(interaction: ChatInputCommandInteraction) {
  try {
    // بررسی وجود بازی فعال در کانال فعلی
    const existingSession = findSessionInChannel(interaction.guildId!, interaction.channelId);
    if (existingSession) {
      return await interaction.reply({
        content: '❌ یک بازی جرأت یا حقیقت در حال حاضر در این کانال در حال اجراست!',
        ephemeral: true
      });
    }
    
    // ایجاد جلسه بازی جدید
    const sessionId = uuidv4();
    const sessionNumber = await getNextSessionNumber(interaction.guildId!);
    
    const newSession: TruthOrDareSession = {
      id: sessionId,
      guildId: interaction.guildId!,
      channelId: interaction.channelId,
      hostId: interaction.user.id,
      players: [interaction.user.id],
      status: 'waiting',
      currentPlayerIndex: 0,
      scores: { [interaction.user.id]: 0 },
      sessionNumber,
      lastActionTime: new Date(),
      settings: {
        timePerTurn: 60, // 1 دقیقه
        isPrivate: false,
        allowSpectators: true,
        maxPlayers: 10,
        minPlayers: 3,
        prizeCoin: 100,
        language: 'fa'
      }
    };
    
    // ذخیره جلسه بازی
    activeSessions.set(sessionId, newSession);
    await saveSession(newSession);
    
    // ایجاد Embed منوی بازی
    const embed = await createGameMenuEmbed(newSession);
    
    // ایجاد دکمه‌های منوی بازی
    const row = createMenuButtons(newSession);
    
    // ارسال منوی بازی
    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
    
  } catch (error) {
    log(`Error handling truth or dare command: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مدیریت کلیک روی دکمه‌های بازی جرأت یا حقیقت
 * @param interaction تعامل دکمه
 */
export async function handleTruthOrDareButton(interaction: ButtonInteraction) {
  try {
    const buttonId = interaction.customId;
    
    // کلیک روی دکمه قوانین بازی
    if (buttonId === 'truthdare_rules') {
      await showRules(interaction);
      return;
    }
    
    // بازگشت به منوی بازی
    if (buttonId === 'back_to_truthdare_menu') {
      await backToMenu(interaction);
      return;
    }
    
    // بازگشت به منوی اصلی بازی‌ها
    if (buttonId === 'back_to_menu') {
      await backToMainMenu(interaction);
      return;
    }
    
    // کلیک روی دکمه ورود به بازی
    if (buttonId === 'join_truthdare') {
      await joinGame(interaction);
      return;
    }
    
    // کلیک روی دکمه شروع بازی
    if (buttonId === 'start_truthdare') {
      await startGame(interaction);
      return;
    }
    
    // کلیک روی دکمه تنظیمات بازی
    if (buttonId === 'settings_truthdare') {
      await showSettings(interaction);
      return;
    }
    
    // کلیک روی دکمه حقیقت
    if (buttonId === 'truth') {
      await chooseTruth(interaction);
      return;
    }
    
    // کلیک روی دکمه جرأت
    if (buttonId === 'dare') {
      await chooseDare(interaction);
      return;
    }
    
    // کلیک روی دکمه جواب دادن به حقیقت
    if (buttonId === 'truth_answered') {
      await answerTruth(interaction);
      return;
    }
    
    // کلیک روی دکمه انجام چالش جرأت
    if (buttonId === 'dare_completed') {
      await completeDare(interaction);
      return;
    }
    
    // کلیک روی دکمه پایان بازی
    if (buttonId === 'end_truthdare') {
      await endGame(interaction);
      return;
    }
    
    // کلیک روی دکمه رد کردن نوبت بازیکن فعلی
    if (buttonId === 'skip_player') {
      await skipCurrentPlayer(interaction);
      return;
    }
    
    // کلیک روی دکمه‌های تنظیمات بازی
    if (buttonId.startsWith('setting_')) {
      await handleSettingButton(interaction);
      return;
    }
    
  } catch (error) {
    log(`Error handling truth or dare button: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در پردازش عملیات رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * نمایش قوانین بازی
 * @param interaction تعامل دکمه
 */
async function showRules(interaction: ButtonInteraction) {
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  
  const rulesEmbed = new EmbedBuilder()
    .setTitle("📜 قوانین بازی جرأت یا حقیقت")
    .setDescription("اینجا قوانین کامل بازی جرأت یا حقیقت رو می‌تونی بخونی! ❓")
    .setColor(0xE74C3C as ColorResolvable)
    .addFields(
      { 
        name: "👥 شروع بازی", 
        value: "🔹 بازیکنا تو کانال ویس مخصوص بازی جمع می‌شن و به نوبت انتخاب می‌شن.\n🔹 بازیکن انتخاب‌شده باید بین **حقیقت** یا **جرأت** یکی رو انتخاب کنه.", 
        inline: false 
      },
      { 
        name: "🗣️ انتخاب حقیقت", 
        value: "🔹 اگه بازیکن **حقیقت** رو انتخاب کنه، ربات یه سوال ازش می‌پرسه که باید صادقانه جواب بده.\n🔹 سوال‌ها می‌تونن خنده‌دار، شخصی یا چالش‌برانگیز باشن.\n🔹 بازیکن باید تو کانال ویس جوابش رو بگه تا بقیه بشنون.", 
        inline: false 
      },
      { 
        name: "💪 انتخاب جرأت", 
        value: "🔹 اگه بازیکن **جرأت** رو انتخاب کنه، ربات یه چالش بهش می‌ده که باید انجامش بده.\n🔹 چالش‌ها می‌تونن خنده‌دار یا هیجان‌انگیز باشن.\n🔹 بازیکن باید تو کانال ویس یا با ارسال مدرک نشون بده که چالش رو انجام داده.", 
        inline: false 
      },
      { 
        name: "⏳ زمان‌بندی", 
        value: `🔹 هر بازیکن ${session?.settings.timePerTurn || 60} ثانیه وقت داره تا جواب بده یا چالش رو انجام بده.\n🔹 اگه تو این زمان جواب نده یا چالش رو انجام نده، یه امتیاز منفی می‌گیره.`, 
        inline: false 
      },
      { 
        name: "🏁 پایان بازی", 
        value: `🔹 بازی تا وقتی ادامه داره که بازیکنا خسته بشن یا بخوایین تمومش کنین.\n🔹 بازیکنی که بیشترین چالش‌ها رو انجام داده یا صادقانه‌ترین جواب‌ها رو داده، به عنوان برنده انتخاب می‌شه.\n🔹 جایزه (${session?.settings.prizeCoin || 100} کوین) به برنده داده می‌شه.`, 
        inline: false 
      }
    )
    .setFooter({ text: "برای بازگشت به منوی بازی، روی دکمه بازگشت کلیک کن! 🔙" });
    
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back_to_truthdare_menu')
        .setLabel('بازگشت 🔙')
        .setStyle(ButtonStyle.Secondary)
    );
    
  await interaction.reply({
    embeds: [rulesEmbed],
    components: [row],
    ephemeral: true
  });
}

/**
 * بازگشت به منوی بازی جرأت یا حقیقت
 * @param interaction تعامل دکمه
 */
async function backToMenu(interaction: ButtonInteraction) {
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session) {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  const embed = await createGameMenuEmbed(session);
  const row = createMenuButtons(session);
  
  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

/**
 * بازگشت به منوی اصلی بازی‌ها
 * @param interaction تعامل دکمه
 */
async function backToMainMenu(interaction: ButtonInteraction) {
  // این قسمت در ماژول اصلی بازی‌ها پیاده‌سازی شده است
  // اینجا فقط یک پیام برمی‌گردانیم
  await interaction.reply({
    content: 'در حال بازگشت به منوی اصلی بازی‌ها...',
    ephemeral: true
  });
}

/**
 * ورود به بازی جرأت یا حقیقت
 * @param interaction تعامل دکمه
 */
async function joinGame(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session) {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی وضعیت بازی
  if (session.status !== 'waiting') {
    return await interaction.reply({
      content: '❌ بازی قبلاً شروع شده است و نمی‌توانید به آن بپیوندید!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا کاربر قبلاً به بازی پیوسته است
  if (session.players.includes(interaction.user.id)) {
    return await interaction.reply({
      content: '✅ شما قبلاً به این بازی پیوسته‌اید!',
      ephemeral: true
    });
  }
  
  // بررسی ظرفیت بازی
  if (session.players.length >= session.settings.maxPlayers) {
    return await interaction.reply({
      content: '❌ ظرفیت بازی تکمیل است!',
      ephemeral: true
    });
  }
  
  // افزودن کاربر به لیست بازیکنان
  session.players.push(interaction.user.id);
  session.scores[interaction.user.id] = 0;
  session.lastActionTime = new Date();
  
  // به‌روزرسانی بازی در حافظه
  activeSessions.set(session.id, session);
  await saveSession(session);
  
  // به‌روزرسانی منوی بازی
  const embed = await createGameMenuEmbed(session);
  const row = createMenuButtons(session);
  
  try {
    // به‌روزرسانی پیام اصلی
    await interaction.message.edit({
      embeds: [embed],
      components: [row]
    });
  } catch (editError) {
    log(`Error updating game menu: ${editError}`, 'error');
  }
  
  // ایجاد یک Embed زیبا برای تأیید پیوستن به بازی
  const joinConfirmEmbed = new EmbedBuilder()
    .setTitle('✅ با موفقیت پیوستید!')
    .setDescription(`شما با موفقیت به بازی جرأت یا حقیقت پیوستید!`)
    .setColor(0x3BA55D as ColorResolvable)
    .addFields(
      { name: '🎮 جلسه بازی', value: `جرأت یا حقیقت #${session.sessionNumber}`, inline: true },
      { name: '👑 میزبان بازی', value: `<@${session.hostId}>`, inline: true },
      { name: '👥 تعداد بازیکنان', value: `${session.players.length}/${session.settings.maxPlayers}`, inline: true }
    )
    .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
    .setFooter({ text: `منتظر باشید تا میزبان بازی را شروع کند!` });
  
  await interaction.reply({
    embeds: [joinConfirmEmbed],
    ephemeral: true
  });
}

/**
 * شروع بازی جرأت یا حقیقت
 * @param interaction تعامل دکمه
 */
async function startGame(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session) {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی وضعیت بازی
  if (session.status !== 'waiting') {
    return await interaction.reply({
      content: '❌ بازی قبلاً شروع شده است!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا کاربر میزبان بازی است
  if (session.hostId !== interaction.user.id) {
    return await interaction.reply({
      content: '❌ فقط میزبان بازی می‌تواند بازی را شروع کند!',
      ephemeral: true
    });
  }
  
  // بررسی تعداد بازیکنان
  if (session.players.length < session.settings.minPlayers) {
    return await interaction.reply({
      content: `❌ برای شروع بازی حداقل به ${session.settings.minPlayers} بازیکن نیاز است!`,
      ephemeral: true
    });
  }
  
  // نمایش پیام "در حال آماده‌سازی" به کاربر
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // به‌روزرسانی وضعیت بازی
    session.status = 'active';
    session.startedAt = new Date();
    session.lastActionTime = new Date();
    
    // ذخیره تغییرات
    activeSessions.set(session.id, session);
    await saveSession(session);
    
    // ایجاد کتگوری و کانال ویس برای بازی
    const { category, voiceChannel, role } = await createVoiceChannels(interaction, session);
    
    // به‌روزرسانی اطلاعات جلسه با شناسه کانال‌ها
    session.categoryId = category.id;
    session.voiceChannelId = voiceChannel.id;
    session.roleId = role.id;
    
    // ذخیره تغییرات
    activeSessions.set(session.id, session);
    await saveSession(session);
    
    // به‌روزرسانی پیام اصلی برای نشان دادن وضعیت جدید
    const embed = new EmbedBuilder()
      .setTitle(`❓ جرأت یا حقیقت #${session.sessionNumber}`)
      .setDescription(`بازی شروع شد! 🎮\n\nهمه بازیکنان به کانال صوتی زیر بروید:\n<#${voiceChannel.id}>`)
      .setColor(0xE74C3C as ColorResolvable)
      .addFields(
        { name: '👑 میزبان بازی', value: `<@${session.hostId}>`, inline: true },
        { name: '👥 تعداد بازیکنان', value: `${session.players.length} نفر`, inline: true },
        { name: '⏱️ وضعیت بازی', value: 'در حال اجرا ✅', inline: true }
      )
      .setFooter({ text: 'بازی در کانال صوتی در حال انجام است. برای پایان بازی از دکمه‌های زیر استفاده کنید.' });
      
    const gameControlRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('end_truthdare')
          .setLabel('پایان بازی 🏁')
          .setStyle(ButtonStyle.Danger)
      );
      
    await interaction.message.edit({
      embeds: [embed],
      components: [gameControlRow]
    });
    
    // ایجاد یک Embed برای دعوت بازیکنان به کانال صوتی
    const inviteEmbed = new EmbedBuilder()
      .setTitle(`🎮 بازی جرأت یا حقیقت شروع شد!`)
      .setDescription(`بازی شروع شده است! 🎉\n\nهمه بازیکنان به کانال صوتی زیر بروید:\n**${voiceChannel.name}**`)
      .setColor(0xE74C3C as ColorResolvable)
      .addFields({ 
        name: '👥 بازیکنان', 
        value: session.players.map(id => `<@${id}>`).join('\n') 
      })
      .setImage('https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/truthordare_banner.png?width=915&height=147')
      .setFooter({ text: `برای پایان دادن به بازی از دکمه "پایان بازی" استفاده کنید` });
    
    // ارسال پیام دعوت به کانال متنی
    const inviteMessage = await (interaction.channel as TextChannel).send({
      embeds: [inviteEmbed]
    });
    
    // آغاز دور اول بازی
    await startFirstRound(interaction, session);
    
    // پاسخ به کاربر
    await interaction.editReply({
      content: '✅ بازی با موفقیت شروع شد! لطفاً به کانال ویس مخصوص بازی بروید.'
    });
    
  } catch (error) {
    log(`Error starting truth or dare game: ${error}`, 'error');
    
    // بازگشت به حالت انتظار در صورت خطا
    if (session) {
      session.status = 'waiting';
      activeSessions.set(session.id, session);
      await saveSession(session);
    }
    
    await interaction.editReply({
      content: '❌ خطایی در شروع بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.'
    });
  }
}

/**
 * ایجاد و تنظیم کانال‌های صوتی برای بازی
 * @param interaction تعامل دکمه
 * @param session جلسه بازی
 */
async function createVoiceChannels(interaction: ButtonInteraction, session: TruthOrDareSession) {
  const guild = interaction.guild!;
  
  // ایجاد نقش مخصوص بازیکنان
  const role = await guild.roles.create({
    name: `TD-Player-${session.sessionNumber}`,
    color: 0xE74C3C as ColorResolvable,
    reason: `نقش مخصوص بازی جرأت یا حقیقت #${session.sessionNumber}`
  });
  
  // اختصاص نقش به بازیکنان
  for (const playerId of session.players) {
    try {
      const member = await guild.members.fetch(playerId);
      await member.roles.add(role);
    } catch (error) {
      log(`Error assigning role to player ${playerId}: ${error}`, 'error');
    }
  }
  
  // ایجاد کتگوری برای بازی
  const category = await guild.channels.create({
    name: `🎮 جرأت یا حقیقت #${session.sessionNumber}`,
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.id, // @everyone
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel]
      }
    ]
  });
  
  // ایجاد کانال صوتی برای بازیکنان
  const voiceChannel = await guild.channels.create({
    name: `🎙️ اتاق #${session.sessionNumber}`,
    type: ChannelType.GuildVoice,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.id, // @everyone
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
      },
      {
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
      }
    ]
  });
  
  return { category, voiceChannel, role };
}

/**
 * شروع دور اول بازی
 * @param interaction تعامل دکمه
 * @param session جلسه بازی
 */
async function startFirstRound(interaction: ButtonInteraction, session: TruthOrDareSession) {
  // انتخاب بازیکن اول
  session.currentPlayerIndex = 0;
  
  // ایجاد پیام نوبت بازیکن
  const currentPlayerId = session.players[session.currentPlayerIndex];
  
  const playerTurnEmbed = new EmbedBuilder()
    .setTitle(`❓ دور اول - نوبت بازیکن`)
    .setDescription(`<@${currentPlayerId}>، نوبت توئه! یکی از گزینه‌ها رو انتخاب کن: **حقیقت** یا **جرأت**؟ ⏳`)
    .setColor(0xE74C3C as ColorResolvable)
    .setFooter({ text: `زمان پاسخ: ${session.settings.timePerTurn} ثانیه` });
  
  const choiceRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('truth')
        .setLabel('حقیقت 🗣️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('dare')
        .setLabel('جرأت 💪')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('skip_player')
        .setLabel('رد کردن نوبت ⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('end_truthdare')
        .setLabel('پایان بازی 🏁')
        .setStyle(ButtonStyle.Secondary)
    );
    
  await (interaction.channel as TextChannel).send({
    embeds: [playerTurnEmbed],
    components: [choiceRow]
  });
  
  // تنظیم تایمر برای رد کردن خودکار نوبت در صورت عدم پاسخ
  setTimeout(async () => {
    try {
      // بررسی اینکه آیا هنوز همان بازیکن در نوبت است
      const currentSession = activeSessions.get(session.id);
      if (currentSession && 
          currentSession.status === 'active' && 
          currentSession.currentPlayerIndex === session.currentPlayerIndex) {
        // رد کردن خودکار نوبت
        await autoSkipCurrentPlayer(interaction, currentSession);
      }
    } catch (error) {
      log(`Error in auto-skip timer: ${error}`, 'error');
    }
  }, session.settings.timePerTurn * 1000);
}

/**
 * رد کردن خودکار نوبت بازیکن فعلی در صورت عدم پاسخ
 * @param interaction تعامل دکمه (برای دسترسی به کانال)
 * @param session جلسه بازی
 */
async function autoSkipCurrentPlayer(interaction: ButtonInteraction, session: TruthOrDareSession) {
  try {
    const currentPlayerId = session.players[session.currentPlayerIndex];
    
    // کسر امتیاز
    session.scores[currentPlayerId] = (session.scores[currentPlayerId] || 0) - 1;
    
    // ارسال پیام رد شدن نوبت
    const skipEmbed = new EmbedBuilder()
      .setTitle(`⏭️ نوبت رد شد!`)
      .setDescription(`<@${currentPlayerId}> در زمان مقرر پاسخی نداد و نوبتش رد شد! (-1 امتیاز)`)
      .setColor(0xFF5555 as ColorResolvable);
      
    await (interaction.channel as TextChannel).send({
      embeds: [skipEmbed]
    });
    
    // رفتن به بازیکن بعدی
    session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
    session.lastActionTime = new Date();
    
    // به‌روزرسانی جلسه
    activeSessions.set(session.id, session);
    await saveSession(session);
    
    // شروع نوبت بازیکن بعدی
    await showNextPlayerTurn(interaction, session);
    
  } catch (error) {
    log(`Error in auto-skip player: ${error}`, 'error');
  }
}

/**
 * رد کردن نوبت بازیکن فعلی
 * @param interaction تعامل دکمه
 */
async function skipCurrentPlayer(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session || session.status !== 'active') {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا کاربر میزبان بازی است
  if (session.hostId !== interaction.user.id) {
    return await interaction.reply({
      content: '❌ فقط میزبان بازی می‌تواند نوبت بازیکنان را رد کند!',
      ephemeral: true
    });
  }
  
  const currentPlayerId = session.players[session.currentPlayerIndex];
  
  // کسر امتیاز
  session.scores[currentPlayerId] = (session.scores[currentPlayerId] || 0) - 1;
  
  // ارسال پیام رد شدن نوبت
  const skipEmbed = new EmbedBuilder()
    .setTitle(`⏭️ نوبت رد شد!`)
    .setDescription(`نوبت <@${currentPlayerId}> توسط میزبان رد شد! (-1 امتیاز)`)
    .setColor(0xFF5555 as ColorResolvable);
    
  await interaction.reply({
    embeds: [skipEmbed]
  });
  
  // رفتن به بازیکن بعدی
  session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
  session.lastActionTime = new Date();
  
  // به‌روزرسانی جلسه
  activeSessions.set(session.id, session);
  await saveSession(session);
  
  // شروع نوبت بازیکن بعدی
  await showNextPlayerTurn(interaction, session);
}

/**
 * نمایش نوبت بازیکن بعدی
 * @param interaction تعامل دکمه (برای دسترسی به کانال)
 * @param session جلسه بازی
 */
async function showNextPlayerTurn(interaction: ButtonInteraction, session: TruthOrDareSession) {
  const currentPlayerId = session.players[session.currentPlayerIndex];
  
  const playerTurnEmbed = new EmbedBuilder()
    .setTitle(`❓ نوبت بازیکن بعدی`)
    .setDescription(`<@${currentPlayerId}>، نوبت توئه! یکی از گزینه‌ها رو انتخاب کن: **حقیقت** یا **جرأت**؟ ⏳`)
    .setColor(0xE74C3C as ColorResolvable)
    .setFooter({ text: `زمان پاسخ: ${session.settings.timePerTurn} ثانیه` });
  
  const choiceRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('truth')
        .setLabel('حقیقت 🗣️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('dare')
        .setLabel('جرأت 💪')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('skip_player')
        .setLabel('رد کردن نوبت ⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('end_truthdare')
        .setLabel('پایان بازی 🏁')
        .setStyle(ButtonStyle.Secondary)
    );
    
  await (interaction.channel as TextChannel).send({
    embeds: [playerTurnEmbed],
    components: [choiceRow]
  });
  
  // تنظیم تایمر برای رد کردن خودکار نوبت در صورت عدم پاسخ
  setTimeout(async () => {
    try {
      // بررسی اینکه آیا هنوز همان بازیکن در نوبت است
      const currentSession = activeSessions.get(session.id);
      if (currentSession && 
          currentSession.status === 'active' && 
          currentSession.currentPlayerIndex === session.currentPlayerIndex) {
        // رد کردن خودکار نوبت
        await autoSkipCurrentPlayer(interaction, currentSession);
      }
    } catch (error) {
      log(`Error in auto-skip timer: ${error}`, 'error');
    }
  }, session.settings.timePerTurn * 1000);
}

/**
 * انتخاب حقیقت توسط بازیکن
 * @param interaction تعامل دکمه
 */
async function chooseTruth(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session || session.status !== 'active') {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا نوبت کاربر است
  const currentPlayerId = session.players[session.currentPlayerIndex];
  if (interaction.user.id !== currentPlayerId) {
    return await interaction.reply({
      content: '❌ الان نوبت شما نیست!',
      ephemeral: true
    });
  }
  
  // انتخاب یک سوال تصادفی
  const question = getTruthQuestion(session.settings.language);
  
  const truthEmbed = new EmbedBuilder()
    .setTitle(`🗣️ سوال حقیقت`)
    .setDescription(`<@${interaction.user.id}>، این سوال توئه:\n\n**${question}**\n\nلطفاً در کانال ویس پاسخ بده! ⏳`)
    .setColor(0x3498DB as ColorResolvable)
    .setFooter({ text: `بعد از پاسخ دادن، روی دکمه "جواب دادم" کلیک کن` });
  
  const answerRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('truth_answered')
        .setLabel('جواب دادم ✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('skip_player')
        .setLabel('رد کردن نوبت ⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('end_truthdare')
        .setLabel('پایان بازی 🏁')
        .setStyle(ButtonStyle.Secondary)
    );
    
  await interaction.reply({
    embeds: [truthEmbed],
    components: [answerRow]
  });
  
  // به‌روزرسانی زمان آخرین فعالیت
  session.lastActionTime = new Date();
  activeSessions.set(session.id, session);
  await saveSession(session);
}

/**
 * انتخاب جرأت توسط بازیکن
 * @param interaction تعامل دکمه
 */
async function chooseDare(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session || session.status !== 'active') {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا نوبت کاربر است
  const currentPlayerId = session.players[session.currentPlayerIndex];
  if (interaction.user.id !== currentPlayerId) {
    return await interaction.reply({
      content: '❌ الان نوبت شما نیست!',
      ephemeral: true
    });
  }
  
  // انتخاب یک چالش تصادفی
  const challenge = getDareChallenge(session.settings.language);
  
  const dareEmbed = new EmbedBuilder()
    .setTitle(`💪 چالش جرأت`)
    .setDescription(`<@${interaction.user.id}>، این چالش توئه:\n\n**${challenge}**\n\nلطفاً در کانال ویس یا با ارسال مدرک نشان بده که انجامش دادی! ⏳`)
    .setColor(0xE74C3C as ColorResolvable)
    .setFooter({ text: `بعد از انجام چالش، روی دکمه "چالش رو انجام دادم" کلیک کن` });
  
  const completeRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('dare_completed')
        .setLabel('چالش رو انجام دادم ✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('skip_player')
        .setLabel('رد کردن نوبت ⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('end_truthdare')
        .setLabel('پایان بازی 🏁')
        .setStyle(ButtonStyle.Secondary)
    );
    
  await interaction.reply({
    embeds: [dareEmbed],
    components: [completeRow]
  });
  
  // به‌روزرسانی زمان آخرین فعالیت
  session.lastActionTime = new Date();
  activeSessions.set(session.id, session);
  await saveSession(session);
}

/**
 * تأیید پاسخ به سوال حقیقت
 * @param interaction تعامل دکمه
 */
async function answerTruth(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session || session.status !== 'active') {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا نوبت کاربر است
  const currentPlayerId = session.players[session.currentPlayerIndex];
  if (interaction.user.id !== currentPlayerId) {
    return await interaction.reply({
      content: '❌ الان نوبت شما نیست!',
      ephemeral: true
    });
  }
  
  // افزایش امتیاز
  session.scores[interaction.user.id] = (session.scores[interaction.user.id] || 0) + 1;
  
  // ارسال پیام تأیید
  const answerConfirmEmbed = new EmbedBuilder()
    .setTitle(`✅ پاسخ ثبت شد!`)
    .setDescription(`<@${interaction.user.id}> به سوال حقیقت پاسخ داد و 1 امتیاز گرفت!`)
    .setColor(0x2ECC71 as ColorResolvable);
    
  await interaction.reply({
    embeds: [answerConfirmEmbed]
  });
  
  // رفتن به بازیکن بعدی
  session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
  session.lastActionTime = new Date();
  
  // به‌روزرسانی جلسه
  activeSessions.set(session.id, session);
  await saveSession(session);
  
  // شروع نوبت بازیکن بعدی
  await showNextPlayerTurn(interaction, session);
}

/**
 * تأیید انجام چالش جرأت
 * @param interaction تعامل دکمه
 */
async function completeDare(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session || session.status !== 'active') {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا نوبت کاربر است
  const currentPlayerId = session.players[session.currentPlayerIndex];
  if (interaction.user.id !== currentPlayerId) {
    return await interaction.reply({
      content: '❌ الان نوبت شما نیست!',
      ephemeral: true
    });
  }
  
  // افزایش امتیاز
  session.scores[interaction.user.id] = (session.scores[interaction.user.id] || 0) + 1;
  
  // ارسال پیام تأیید
  const dareConfirmEmbed = new EmbedBuilder()
    .setTitle(`✅ چالش انجام شد!`)
    .setDescription(`<@${interaction.user.id}> چالش جرأت را انجام داد و 1 امتیاز گرفت!`)
    .setColor(0x2ECC71 as ColorResolvable);
    
  await interaction.reply({
    embeds: [dareConfirmEmbed]
  });
  
  // رفتن به بازیکن بعدی
  session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
  session.lastActionTime = new Date();
  
  // به‌روزرسانی جلسه
  activeSessions.set(session.id, session);
  await saveSession(session);
  
  // شروع نوبت بازیکن بعدی
  await showNextPlayerTurn(interaction, session);
}

/**
 * پایان بازی جرأت یا حقیقت
 * @param interaction تعامل دکمه
 */
async function endGame(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session) {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا کاربر میزبان بازی است یا خیر
  if (session.hostId !== interaction.user.id) {
    return await interaction.reply({
      content: '❌ فقط میزبان بازی می‌تواند بازی را پایان دهد!',
      ephemeral: true
    });
  }
  
  try {
    // به‌روزرسانی وضعیت بازی
    session.status = 'ended';
    session.endedAt = new Date();
    session.lastActionTime = new Date();
    
    // محاسبه برنده
    let winner = { id: '', score: -Infinity };
    for (const [playerId, score] of Object.entries(session.scores)) {
      if (score > winner.score) {
        winner = { id: playerId, score: score as number };
      }
    }
    
    // ایجاد Embed نتایج بازی
    const resultsEmbed = new EmbedBuilder()
      .setTitle(`🏁 پایان بازی جرأت یا حقیقت #${session.sessionNumber}`)
      .setDescription(`بازی به پایان رسید! 🎉\n\nاطلاعات آماری بازی:`)
      .setColor(0xE74C3C as ColorResolvable)
      .addFields(
        { name: '👑 میزبان بازی', value: `<@${session.hostId}>`, inline: true },
        { name: '👥 تعداد بازیکنان', value: `${session.players.length} نفر`, inline: true },
        { name: '⏱️ زمان بازی', value: formatPlayTime(session.startedAt, session.endedAt), inline: true },
        { name: '🏆 برنده', value: winner.id ? `<@${winner.id}> با ${winner.score} امتیاز!` : 'بدون برنده', inline: false }
      )
      .setFooter({ text: `Game ID: ${session.id}` });
      
    // ایجاد جدول امتیازات
    const scoreboardText = Object.entries(session.scores)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([playerId, score], index) => {
        const medalEmoji = getMedalEmoji(index);
        return `${medalEmoji} <@${playerId}>: ${score} امتیاز`;
      })
      .join('\n');
      
    // افزودن فیلد جدول امتیازات
    resultsEmbed.addFields({
      name: '📊 جدول امتیازات',
      value: scoreboardText || 'بدون امتیاز',
      inline: false
    });
    
    // ارسال پیام پایان بازی
    await interaction.reply({
      embeds: [resultsEmbed]
    });
    
    // پاداش برای برنده
    if (winner.id) {
      try {
        await storage.addToWallet(parseInt(winner.id), session.settings.prizeCoin, 'truth_or_dare_prize', {
          sessionId: session.id,
          score: winner.score
        });
        
        // ارسال پیام تبریک به برنده
        const winnerMessage = new EmbedBuilder()
          .setTitle(`🎊 تبریک به برنده!`)
          .setDescription(`<@${winner.id}> برنده بازی جرأت یا حقیقت شد و ${session.settings.prizeCoin} کوین جایزه گرفت! 🎉`)
          .setColor(0xFFD700 as ColorResolvable);
          
        await (interaction.channel as TextChannel).send({
          embeds: [winnerMessage]
        });
      } catch (prizeError) {
        log(`Error giving prize to winner ${winner.id}: ${prizeError}`, 'error');
      }
    }
    
    // پاکسازی منابع بازی
    await cleanupGameResources(interaction.guild!, session);
    
    // به‌روزرسانی منوی اصلی بازی
    const embed = await createGameMenuEmbed({
      ...session,
      status: 'waiting',
      players: [],
      scores: {}
    });
    
    const row = createMenuButtons({
      ...session,
      status: 'waiting',
      players: [],
      scores: {}
    });
    
    try {
      // به‌روزرسانی پیام اصلی
      await interaction.message.edit({
        embeds: [embed],
        components: [row]
      });
    } catch (editError) {
      log(`Error updating game menu: ${editError}`, 'error');
    }
    
    // حذف جلسه بازی
    activeSessions.delete(session.id);
    
  } catch (error) {
    log(`Error ending truth or dare game: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در پایان بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * پاکسازی منابع بازی (کانال‌ها و نقش‌ها)
 * @param guild سرور
 * @param session جلسه بازی
 */
async function cleanupGameResources(guild: Guild, session: TruthOrDareSession) {
  try {
    // حذف نقش
    if (session.roleId) {
      const role = guild.roles.cache.get(session.roleId);
      if (role) {
        await role.delete(`پایان بازی جرأت یا حقیقت #${session.sessionNumber}`);
      }
    }
    
    // حذف کانال‌های صوتی
    if (session.voiceChannelId) {
      const voiceChannel = guild.channels.cache.get(session.voiceChannelId) as VoiceChannel;
      if (voiceChannel) {
        await voiceChannel.delete(`پایان بازی جرأت یا حقیقت #${session.sessionNumber}`);
      }
    }
    
    // حذف کتگوری
    if (session.categoryId) {
      const category = guild.channels.cache.get(session.categoryId);
      if (category) {
        await category.delete(`پایان بازی جرأت یا حقیقت #${session.sessionNumber}`);
      }
    }
  } catch (error) {
    log(`Error cleaning up game resources: ${error}`, 'error');
  }
}

/**
 * نمایش تنظیمات بازی جرأت یا حقیقت
 * @param interaction تعامل دکمه
 */
async function showSettings(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session) {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا کاربر میزبان بازی است
  if (session.hostId !== interaction.user.id) {
    return await interaction.reply({
      content: '❌ فقط میزبان بازی می‌تواند تنظیمات را تغییر دهد!',
      ephemeral: true
    });
  }
  
  // بررسی وضعیت بازی
  if (session.status !== 'waiting') {
    return await interaction.reply({
      content: '❌ تنظیمات فقط قبل از شروع بازی قابل تغییر است!',
      ephemeral: true
    });
  }
  
  // ایجاد Embed تنظیمات
  const settingsEmbed = new EmbedBuilder()
    .setTitle(`⚙️ تنظیمات بازی جرأت یا حقیقت #${session.sessionNumber}`)
    .setDescription(`تنظیمات فعلی بازی را در زیر مشاهده می‌کنید. برای تغییر هر کدام، روی دکمه مربوطه کلیک کنید.`)
    .setColor(0xE74C3C as ColorResolvable)
    .addFields(
      { name: '⏱️ زمان هر نوبت', value: `${session.settings.timePerTurn} ثانیه`, inline: true },
      { name: '👥 حداقل بازیکنان', value: `${session.settings.minPlayers} نفر`, inline: true },
      { name: '👥 حداکثر بازیکنان', value: `${session.settings.maxPlayers} نفر`, inline: true },
      { name: '🔒 بازی خصوصی', value: session.settings.isPrivate ? '✅ فعال' : '❌ غیرفعال', inline: true },
      { name: '👁️ اجازه تماشاچی', value: session.settings.allowSpectators ? '✅ فعال' : '❌ غیرفعال', inline: true },
      { name: '💰 جایزه برنده', value: `${session.settings.prizeCoin} کوین`, inline: true },
      { name: '🌐 زبان بازی', value: session.settings.language === 'fa' ? '🇮🇷 فارسی' : '🇺🇸 انگلیسی', inline: true }
    )
    .setFooter({ text: `برای بازگشت به منوی بازی، روی دکمه بازگشت کلیک کنید.` });
    
  // ایجاد دکمه‌های تنظیمات
  const settingsRow1 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setting_time_30')
        .setLabel('زمان: 30 ثانیه')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_time_60')
        .setLabel('زمان: 60 ثانیه')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_time_90')
        .setLabel('زمان: 90 ثانیه')
        .setStyle(ButtonStyle.Secondary)
    );
    
  const settingsRow2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setting_min_players_2')
        .setLabel('حداقل: 2 نفر')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_min_players_3')
        .setLabel('حداقل: 3 نفر')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_min_players_4')
        .setLabel('حداقل: 4 نفر')
        .setStyle(ButtonStyle.Secondary)
    );
    
  const settingsRow3 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setting_private_toggle')
        .setLabel(session.settings.isPrivate ? 'خصوصی: غیرفعال' : 'خصوصی: فعال')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_spectators_toggle')
        .setLabel(session.settings.allowSpectators ? 'تماشاچی: غیرفعال' : 'تماشاچی: فعال')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_language_toggle')
        .setLabel(session.settings.language === 'fa' ? 'زبان: انگلیسی' : 'زبان: فارسی')
        .setStyle(ButtonStyle.Secondary)
    );
    
  const settingsRow4 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setting_prize_100')
        .setLabel('جایزه: 100 کوین')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_prize_200')
        .setLabel('جایزه: 200 کوین')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_prize_300')
        .setLabel('جایزه: 300 کوین')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back_to_truthdare_menu')
        .setLabel('بازگشت 🔙')
        .setStyle(ButtonStyle.Danger)
    );
    
  await interaction.reply({
    embeds: [settingsEmbed],
    components: [settingsRow1, settingsRow2, settingsRow3, settingsRow4],
    ephemeral: true
  });
}

/**
 * مدیریت دکمه‌های تنظیمات بازی
 * @param interaction تعامل دکمه
 */
async function handleSettingButton(interaction: ButtonInteraction) {
  // یافتن جلسه بازی در کانال فعلی
  const session = findSessionInChannel(interaction.guildId!, interaction.channelId);
  if (!session) {
    return await interaction.reply({
      content: '❌ بازی فعالی یافت نشد!',
      ephemeral: true
    });
  }
  
  // بررسی اینکه آیا کاربر میزبان بازی است
  if (session.hostId !== interaction.user.id) {
    return await interaction.reply({
      content: '❌ فقط میزبان بازی می‌تواند تنظیمات را تغییر دهد!',
      ephemeral: true
    });
  }
  
  // بررسی وضعیت بازی
  if (session.status !== 'waiting') {
    return await interaction.reply({
      content: '❌ تنظیمات فقط قبل از شروع بازی قابل تغییر است!',
      ephemeral: true
    });
  }
  
  const settingId = interaction.customId.replace('setting_', '');
  
  // به‌روزرسانی تنظیمات بر اساس دکمه کلیک شده
  switch (settingId) {
    case 'time_30':
      session.settings.timePerTurn = 30;
      break;
    case 'time_60':
      session.settings.timePerTurn = 60;
      break;
    case 'time_90':
      session.settings.timePerTurn = 90;
      break;
    case 'min_players_2':
      session.settings.minPlayers = 2;
      break;
    case 'min_players_3':
      session.settings.minPlayers = 3;
      break;
    case 'min_players_4':
      session.settings.minPlayers = 4;
      break;
    case 'private_toggle':
      session.settings.isPrivate = !session.settings.isPrivate;
      break;
    case 'spectators_toggle':
      session.settings.allowSpectators = !session.settings.allowSpectators;
      break;
    case 'language_toggle':
      session.settings.language = session.settings.language === 'fa' ? 'en' : 'fa';
      break;
    case 'prize_100':
      session.settings.prizeCoin = 100;
      break;
    case 'prize_200':
      session.settings.prizeCoin = 200;
      break;
    case 'prize_300':
      session.settings.prizeCoin = 300;
      break;
    default:
      break;
  }
  
  // به‌روزرسانی جلسه بازی
  session.lastActionTime = new Date();
  activeSessions.set(session.id, session);
  await saveSession(session);
  
  // به‌روزرسانی منوی تنظیمات
  const settingsEmbed = new EmbedBuilder()
    .setTitle(`⚙️ تنظیمات بازی جرأت یا حقیقت #${session.sessionNumber}`)
    .setDescription(`تنظیمات به‌روزرسانی شد. تنظیمات فعلی بازی را در زیر مشاهده می‌کنید.`)
    .setColor(0xE74C3C as ColorResolvable)
    .addFields(
      { name: '⏱️ زمان هر نوبت', value: `${session.settings.timePerTurn} ثانیه`, inline: true },
      { name: '👥 حداقل بازیکنان', value: `${session.settings.minPlayers} نفر`, inline: true },
      { name: '👥 حداکثر بازیکنان', value: `${session.settings.maxPlayers} نفر`, inline: true },
      { name: '🔒 بازی خصوصی', value: session.settings.isPrivate ? '✅ فعال' : '❌ غیرفعال', inline: true },
      { name: '👁️ اجازه تماشاچی', value: session.settings.allowSpectators ? '✅ فعال' : '❌ غیرفعال', inline: true },
      { name: '💰 جایزه برنده', value: `${session.settings.prizeCoin} کوین`, inline: true },
      { name: '🌐 زبان بازی', value: session.settings.language === 'fa' ? '🇮🇷 فارسی' : '🇺🇸 انگلیسی', inline: true }
    )
    .setFooter({ text: `تنظیمات به‌روزرسانی شد. برای بازگشت به منوی بازی، روی دکمه بازگشت کلیک کنید.` });
    
  // ایجاد دکمه‌های تنظیمات
  const settingsRow1 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setting_time_30')
        .setLabel('زمان: 30 ثانیه')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_time_60')
        .setLabel('زمان: 60 ثانیه')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_time_90')
        .setLabel('زمان: 90 ثانیه')
        .setStyle(ButtonStyle.Secondary)
    );
    
  const settingsRow2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setting_min_players_2')
        .setLabel('حداقل: 2 نفر')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_min_players_3')
        .setLabel('حداقل: 3 نفر')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_min_players_4')
        .setLabel('حداقل: 4 نفر')
        .setStyle(ButtonStyle.Secondary)
    );
    
  const settingsRow3 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setting_private_toggle')
        .setLabel(session.settings.isPrivate ? 'خصوصی: غیرفعال' : 'خصوصی: فعال')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_spectators_toggle')
        .setLabel(session.settings.allowSpectators ? 'تماشاچی: غیرفعال' : 'تماشاچی: فعال')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_language_toggle')
        .setLabel(session.settings.language === 'fa' ? 'زبان: انگلیسی' : 'زبان: فارسی')
        .setStyle(ButtonStyle.Secondary)
    );
    
  const settingsRow4 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setting_prize_100')
        .setLabel('جایزه: 100 کوین')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_prize_200')
        .setLabel('جایزه: 200 کوین')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setting_prize_300')
        .setLabel('جایزه: 300 کوین')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back_to_truthdare_menu')
        .setLabel('بازگشت 🔙')
        .setStyle(ButtonStyle.Danger)
    );
    
  // به‌روزرسانی منوی اصلی بازی
  try {
    const mainEmbed = await createGameMenuEmbed(session);
    const mainRow = createMenuButtons(session);
    
    await interaction.message.edit({
      embeds: [mainEmbed],
      components: [mainRow]
    });
  } catch (editError) {
    log(`Error updating main game menu: ${editError}`, 'warn');
  }
    
  await interaction.reply({
    embeds: [settingsEmbed],
    components: [settingsRow1, settingsRow2, settingsRow3, settingsRow4],
    ephemeral: true
  });
}

/**
 * ایجاد Embed منوی بازی جرأت یا حقیقت
 * @param session جلسه بازی
 */
async function createGameMenuEmbed(session: TruthOrDareSession) {
  // دریافت اطلاعات بازیکنان
  const playersList = session.players.length > 0
    ? await getPlayersInfo(session.players)
    : '(هنوز بازیکنی وارد نشده)';
  
  const embed = new EmbedBuilder()
    .setTitle(`❓ بازی جرأت یا حقیقت #${session.sessionNumber}`)
    .setDescription(`یه بازی کلاسیک و هیجان‌انگیز! جرات می‌کنی یا حقیقت رو می‌گی؟ 😏 آماده باش که با دوستات لحظات باحال و خنده‌داری رو تجربه کنی!`)
    .setColor(0xE74C3C as ColorResolvable)
    .addFields(
      { name: '👥 تعداد بازیکنان', value: `${session.players.length}/${session.settings.maxPlayers}`, inline: true },
      { name: '⏱️ زمان هر نوبت', value: `${session.settings.timePerTurn} ثانیه`, inline: true },
      { name: '👤 حداقل بازیکنان', value: `${session.settings.minPlayers} نفر`, inline: true },
      { name: '💰 جایزه بازی', value: `برنده ${session.settings.prizeCoin} کوین 🤑`, inline: true },
      { name: '👑 میزبان بازی', value: `<@${session.hostId}>`, inline: true },
      { name: '🔒 بازی خصوصی', value: session.settings.isPrivate ? '✅ فعال' : '❌ غیرفعال', inline: true },
      { name: '👥 بازیکنان', value: playersList, inline: false }
    )
    .setFooter({ text: 'برای شرکت در بازی، روی دکمه ورود کلیک کن! 🎮' });
    
  return embed;
}

/**
 * ایجاد دکمه‌های منوی بازی جرأت یا حقیقت
 * @param session جلسه بازی
 */
function createMenuButtons(session: TruthOrDareSession) {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('join_truthdare')
        .setLabel('ورود به بازی')
        .setEmoji('🎮')
        .setStyle(ButtonStyle.Success)
    );
    
  // اضافه کردن دکمه شروع بازی فقط برای میزبان
  if (session.players.length >= session.settings.minPlayers) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('start_truthdare')
        .setLabel('شروع بازی')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
    );
  }
  
  // دکمه تنظیمات فقط برای میزبان در مرحله انتظار
  if (session.status === 'waiting') {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('settings_truthdare')
        .setLabel('تنظیمات بازی')
        .setEmoji('⚙️')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('truthdare_rules')
      .setLabel('قوانین بازی')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('back_to_menu')
      .setLabel('بازگشت')
      .setEmoji('🔙')
      .setStyle(ButtonStyle.Secondary)
  );
  
  return row;
}

/**
 * فرمت کردن زمان بازی
 * @param startDate زمان شروع بازی
 * @param endDate زمان پایان بازی
 */
function formatPlayTime(startDate?: Date, endDate?: Date): string {
  if (!startDate || !endDate) return 'نامشخص';
  
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  return `${diffMins} دقیقه و ${diffSecs} ثانیه`;
}

/**
 * دریافت نماد مدال برای رتبه
 * @param rank رتبه
 */
function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 0: return '🥇';
    case 1: return '🥈';
    case 2: return '🥉';
    default: return `${rank + 1}.`;
  }
}

/**
 * یافتن جلسه بازی در کانال مشخص
 * @param guildId شناسه سرور
 * @param channelId شناسه کانال
 */
function findSessionInChannel(guildId: string, channelId: string): TruthOrDareSession | undefined {
  return Array.from(activeSessions.values()).find(
    session => session.guildId === guildId && session.channelId === channelId
  );
}

/**
 * دریافت شماره جلسه بعدی برای سرور
 * @param guildId شناسه سرور
 */
async function getNextSessionNumber(guildId: string): Promise<number> {
  // یافتن بالاترین شماره جلسه در جلسات فعال
  const guildSessions = Array.from(activeSessions.values()).filter(
    session => session.guildId === guildId
  );
  
  const maxActiveSessionNumber = guildSessions.length > 0
    ? Math.max(...guildSessions.map(session => session.sessionNumber))
    : 0;
    
  // دریافت بالاترین شماره جلسه از دیتابیس
  const maxDbSessionNumber = await (storage.getMaxGameSessionNumber ? storage.getMaxGameSessionNumber(guildId, 'truth_or_dare') : 0);
  
  // استفاده از بالاترین شماره + 1
  return Math.max(maxActiveSessionNumber, maxDbSessionNumber) + 1;
}

/**
 * دریافت اطلاعات بازیکنان
 * @param playerIds شناسه‌های بازیکنان
 */
async function getPlayersInfo(playerIds: string[]): Promise<string> {
  if (playerIds.length === 0) return '(هنوز بازیکنی وارد نشده)';
  
  return playerIds.map(id => `<@${id}>`).join('\n');
}

/**
 * انتخاب یک سوال حقیقت تصادفی
 * @param language زبان سوال
 */
function getTruthQuestion(language: 'fa' | 'en'): string {
  // فعلاً فقط سوالات فارسی را پشتیبانی می‌کنیم
  const questions = truthQuestionsFa;
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * انتخاب یک چالش جرأت تصادفی
 * @param language زبان چالش
 */
function getDareChallenge(language: 'fa' | 'en'): string {
  // فعلاً فقط چالش‌های فارسی را پشتیبانی می‌کنیم
  const challenges = dareChallengesFa;
  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * ذخیره‌سازی جلسه بازی در دیتابیس
 * @param session جلسه بازی
 */
async function saveSession(session: TruthOrDareSession): Promise<void> {
  try {
    if (storage.saveGameSession) {
      await storage.saveGameSession({
        gameId: session.id,
        gameType: 'truth_or_dare',
        guildId: session.guildId,
        hostId: session.hostId,
        channelId: session.channelId,
        status: session.status,
        players: session.players,
        settings: session.settings,
        sessionNumber: session.sessionNumber,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        scores: Object.entries(session.scores).map(([id, score]) => ({ 
          playerId: id, 
          score: score as number
        }))
      });
    }
  } catch (error) {
    log(`Error saving game session: ${error}`, 'error');
  }
}

/**
 * تابع ریکاوری جلسات بازی از دیتابیس هنگام راه‌اندازی مجدد بات
 */
export async function recoverActiveSessions(): Promise<void> {
  try {
    const sessions = storage.getActiveGameSessionsByType ? 
      await storage.getActiveGameSessionsByType('truth_or_dare') : 
      await storage.getActiveGameSessions('truth_or_dare');
    
    for (const session of sessions) {
      // تبدیل فرمت برگشتی از دیتابیس به فرمت مورد نیاز
      const truthOrDareSession: TruthOrDareSession = {
        id: session.gameId,
        guildId: session.guildId,
        channelId: session.channelId,
        hostId: session.hostId,
        players: session.players,
        status: session.status as 'waiting' | 'active' | 'ended',
        currentPlayerIndex: 0,
        scores: session.scores.reduce((acc, score) => {
          acc[score.playerId] = score.score;
          return acc;
        }, {} as Record<string, number>),
        sessionNumber: session.sessionNumber || 1,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        lastActionTime: new Date(),
        settings: session.settings || {
          timePerTurn: 60,
          isPrivate: false,
          allowSpectators: true,
          maxPlayers: 10,
          minPlayers: 3,
          prizeCoin: 100,
          language: 'fa'
        }
      };
      
      activeSessions.set(truthOrDareSession.id, truthOrDareSession);
    }
    
    log(`Recovered ${activeSessions.size} active Truth or Dare sessions!`, 'info');
  } catch (error) {
    log(`Error recovering active sessions: ${error}`, 'error');
  }
}

/**
 * تابع پاکسازی جلسات قدیمی
 * این تابع به صورت دوره‌ای اجرا می‌شود تا جلسات غیرفعال را پاکسازی کند
 */
export function cleanupInactiveSessions(): void {
  const now = new Date();
  
  activeSessions.forEach(async (session, sessionId) => {
    // بررسی آخرین زمان فعالیت جلسه
    const inactiveTimeMs = now.getTime() - session.lastActionTime.getTime();
    
    // اگر بیش از 2 ساعت غیرفعال بوده، آن را پاکسازی کن
    if (inactiveTimeMs > 2 * 60 * 60 * 1000) {
      try {
        // پایان دادن به جلسه در دیتابیس
        await storage.endGameSession(session.id);
        
        // پاکسازی منابع در صورت نیاز
        if (session.status === 'active' && client) {
          const guild = client.guilds.cache.get(session.guildId);
          if (guild) {
            await cleanupGameResources(guild, session);
          }
        }
        
        // حذف از لیست جلسات فعال
        activeSessions.delete(sessionId);
        
        log(`Cleaned up inactive Truth or Dare session: ${sessionId}`, 'info');
      } catch (error) {
        log(`Error cleaning up inactive session ${sessionId}: ${error}`, 'error');
      }
    }
  });
}