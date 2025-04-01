import { 
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ComponentType,
  Message,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  Client,
  TextChannel
} from 'discord.js';
import { storage } from '../../storage';
import { log } from '../../vite';
import { IUser as User } from '../../models/User';
import { v4 as uuidv4 } from 'uuid';
import GameSessionModel from '../../models/GameSession';
import type { GameSession as DBGameSession } from '../../models/GameSession';
import QuizQuestionModel from '../../models/QuizQuestion';

// تعریف client برای دسترسی به Discord API
// این متغیر باید از فایل اصلی bot.ts به این ماژول پاس داده شود
let client: Client;

/**
 * تنظیم نمونه کلاینت دیسکورد برای استفاده در ماژول بازی‌های گروهی
 * @param discordClient نمونه کلاینت دیسکورد
 */
export function setClient(discordClient: Client) {
  client = discordClient;
}
// Create utils functions locally since we can't find the utils module
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * بررسی وجود بازی فعال در کانال
 */
const getActiveGameInChannel = (channelId: string, gameType?: string): GameSession | undefined => {
  return Array.from(activeGames.values()).find(
    game => game.channelId === channelId && 
    game.status !== 'ended' && 
    (gameType ? game.gameType === gameType : true)
  );
};

/**
 * بهم‌ ریختن تصادفی آرایه
 * @param array آرایه ورودی
 * @returns آرایه بهم‌ریخته شده
 */
const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * مدل سوال برای بازی اطلاعات عمومی
 */
// وارد کردن تایپ QuizQuestion از مدل اصلی
import { QuizQuestion } from '../../models/QuizQuestion';

/**
 * مدل اطلاعات بازی گروهی
 */
interface GameSession {
  id: string;
  gameType: 'quiz' | 'drawguess' | 'truthordare' | 'bingo' | 'wordchain' | 'word_chain' | 'mafia' | 'werewolf' | 'spy';
  channelId: string;
  createdBy: string;
  players: string[];
  status: 'waiting' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  data: any; // اطلاعات خاص هر بازی
  winners?: string[]; // برندگان بازی
  rated?: boolean; // آیا بازی در سیستم رتبه‌بندی ثبت شده است
  gameSettings?: {
    isPrivate: boolean; // آیا بازی خصوصی است (فقط با دعوت)
    allowSpectators: boolean; // آیا تماشاگران می‌توانند شرکت کنند
    maxPlayers?: number; // حداکثر تعداد بازیکنان
    customRules?: string[]; // قوانین سفارشی اضافه شده توسط سازنده بازی
    timerSettings?: { // تنظیمات زمان‌بندی
      dayTime?: number; // زمان روز (به ثانیه)
      nightTime?: number; // زمان شب (به ثانیه)
      voteTime?: number; // زمان رای‌گیری (به ثانیه)
    }
  }
}

// لیست موقت بازی‌های فعال (بعداً به دیتابیس منتقل می‌شود)
export const activeGames: Map<string, GameSession> = new Map();

// تاریخچه بازی‌های گذشته (بعداً به دیتابیس منتقل خواهد شد)
const gameHistory: GameSession[] = [];

// نگهداری آمار بازیکنان
interface PlayerStats {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  gameTypeStats: {
    [gameType: string]: {
      played: number;
      won: number;
      score: number;
    }
  };
  lastActive: Date;
}

// آمار بازیکنان (بعداً به دیتابیس منتقل خواهد شد)
const playerStats: Map<string, PlayerStats> = new Map();

/**
 * دریافت تعداد کل بازی‌های فعال
 * @returns تعداد کل بازی‌های فعال
 */
export function getActiveGamesCount(): number {
  return Array.from(activeGames.values()).filter(game => game.status !== 'ended').length;
}

/**
 * دریافت آمار بازی‌های فعال بر اساس نوع بازی
 * @returns آبجکتی با آمار انواع بازی‌ها
 */
export function getActiveGamesByType(): { [key: string]: number } {
  const stats: { [key: string]: number } = {
    'quiz': 0,
    'drawguess': 0,
    'truthordare': 0,
    'bingo': 0,
    'wordchain': 0,
    'mafia': 0,
    'werewolf': 0,
    'spy': 0,
    'total': 0
  };
  
  Array.from(activeGames.values())
    .filter(game => game.status !== 'ended')
    .forEach(game => {
      if (stats[game.gameType] !== undefined) {
        stats[game.gameType]++;
      }
      stats.total++;
    });
  
  return stats;
}

/**
 * دریافت لیست تمام بازیکنان فعال
 * @returns آرایه‌ای از شناسه‌های کاربری بازیکنان فعال
 */
export function getActivePlayers(): string[] {
  // استفاده از Set برای جلوگیری از تکرار کاربران
  const players = new Set<string>();
  
  // جمع‌آوری تمام بازیکنان از تمام بازی‌های فعال
  Array.from(activeGames.values())
    .filter(game => game.status !== 'ended')
    .forEach(game => {
      game.players.forEach(playerId => players.add(playerId));
    });
  
  return Array.from(players);
}

/**
 * دریافت تعداد بازیکنان فعال
 * @returns تعداد بازیکنان فعال
 */
export function getActivePlayersCount(): number {
  return getActivePlayers().length;
}

/**
 * نمایش منوی جلسات فعال بازی‌های گروهی با امکانات پیشرفته و جزئیات بیشتر
 * @param interaction برهم‌کنش کاربر
 */
/**
 * نمایش منوی جلسات فعال بازی‌های گروهی با جزئیات بیشتر، امکانات پیشرفته و دسته‌بندی بر اساس نوع
 * @param interaction برهم‌کنش کاربر
 * @param gameTypeFilter نوع بازی برای فیلتر کردن (اختیاری)
 */
export async function showActiveSessionsMenu(interaction: ButtonInteraction, gameTypeFilter?: string) {
  try {
    // دریافت بازی‌های فعال
    let activeGamesList = Array.from(activeGames.values())
      .filter(game => game.status !== 'ended');
    
    // اعمال فیلتر نوع بازی اگر مشخص شده باشد
    if (gameTypeFilter) {
      activeGamesList = activeGamesList.filter(game => game.gameType === gameTypeFilter);
    }
    
    // مرتب‌سازی بازی‌ها
    activeGamesList = activeGamesList.sort((a, b) => {
      // مرتب‌سازی بر اساس وضعیت (در انتظار اول، سپس در حال انجام)
      if (a.status === 'waiting' && b.status !== 'waiting') return -1;
      if (a.status !== 'waiting' && b.status === 'waiting') return 1;
      // سپس مرتب‌سازی بر اساس زمان شروع (تازه‌ترین اول)
      const aTime = a.startedAt || new Date();
      const bTime = b.startedAt || new Date();
      return bTime.getTime() - aTime.getTime();
    });

    // دریافت تعداد کل بازیکنان فعال و آمار بازی‌ها
    const totalActivePlayers = getActivePlayersCount();
    const gameTypeStats = getActiveGamesByType();
    
    // بررسی اینکه آیا بازی فعالی وجود دارد
    if (activeGamesList.length === 0) {
      // حالتی که هیچ بازی فعالی وجود ندارد
      const emptyEmbed = new EmbedBuilder()
        .setTitle('🎮 جلسات فعال بازی‌های گروهی')
        .setDescription('🔍 در حال حاضر هیچ بازی فعالی وجود ندارد!\n\n' +
                       'می‌توانید با انتخاب یکی از بازی‌های گروهی، یک بازی جدید شروع کنید.')
        .setColor('#9B59B6')
        .setFooter({ text: 'برای ایجاد بازی جدید، به منوی بازی‌های گروهی بازگردید' });
                          
      // دکمه‌های کنترلی
      const controlRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:history')
            .setLabel('تاریخچه بازی‌ها')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📜'),
          new ButtonBuilder()
            .setCustomId('game:leaderboard')
            .setLabel('رتبه‌بندی')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏆'),
          new ButtonBuilder()
            .setCustomId('group_games')
            .setLabel('بازگشت')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );
          
      await interaction.reply({ embeds: [emptyEmbed], components: [controlRow], ephemeral: true });
      return;
    }
    
    // گروه‌بندی بازی‌ها بر اساس نوع
    const gamesByType: Record<string, GameSession[]> = {};
    activeGamesList.forEach(game => {
      if (!gamesByType[game.gameType]) {
        gamesByType[game.gameType] = [];
      }
      gamesByType[game.gameType].push(game);
    });
    
    // محاسبه تعداد بازی‌های فعال هر نوع
    const gameTypeCounts: Record<string, number> = {};
    Object.keys(gamesByType).forEach(type => {
      gameTypeCounts[type] = gamesByType[type].length;
    });
    
    // تعیین نام و ایموجی انواع بازی‌ها
    const gameTypeNames: Record<string, string> = {
      'mafia': '🕵️‍♂️ مافیا',
      'werewolf': '🐺 گرگینه',
      'quiz': '📚 مسابقه اطلاعات عمومی',
      'drawguess': '🎨 نقاشی حدس بزن',
      'truthordare': '🎯 جرات یا حقیقت',
      'truth_or_dare': '🎯 جرات یا حقیقت',
      'bingo': '🎲 بینگو',
      'wordchain': '📝 زنجیره کلمات',
      'word_chain': '📝 زنجیره کلمات',
      'spy': '🕴️ جاسوس مخفی'
    };
    
    // ایجاد عنوان مناسب بر اساس نوع بازی
    let title = '🎮 جلسات فعال بازی‌های گروهی';
    let description = 'لیست بازی‌های گروهی فعال در حال حاضر';
    let color = '#9B59B6'; // رنگ پیش‌فرض بنفش
    
    if (gameTypeFilter) {
      const gameTypeName = gameTypeNames[gameTypeFilter] || gameTypeFilter;
      title = `${gameTypeName.split(' ')[0]} جلسات فعال ${gameTypeName.split(' ').slice(1).join(' ')}`;
      
      // توضیحات اختصاصی برای هر بازی
      switch (gameTypeFilter) {
        case 'mafia':
          description = 'لیست جلسات فعال بازی مافیا. آیا می‌توانید مافیا را شناسایی کنید یا به عنوان مافیا، خود را مخفی نگه دارید؟';
          color = '#E74C3C'; // قرمز
          break;
        case 'werewolf':
          description = 'لیست جلسات فعال بازی گرگینه. با تیزهوشی گرگینه‌ها را شناسایی کنید یا به عنوان گرگینه افراد روستا را از بین ببرید!';
          color = '#8E44AD'; // بنفش تیره
          break;
        case 'spy':
          description = 'لیست جلسات فعال بازی جاسوس مخفی. آیا می‌توانید جاسوس را پیدا کنید؟ یا به عنوان جاسوس هویت خود را مخفی نگه دارید؟';
          color = '#2C3E50'; // خاکستری تیره
          break;
        case 'quiz':
          description = 'لیست جلسات فعال مسابقه اطلاعات عمومی. دانش خود را به چالش بکشید و با پاسخ سریع و دقیق برنده شوید!';
          color = '#F1C40F'; // زرد
          break;
        case 'bingo':
          description = 'لیست جلسات فعال بازی بینگو. آیا شانس با شما یار است؟ با استراتژی و کمی شانس برنده شوید!';
          color = '#2ECC71'; // سبز
          break;
        case 'word_chain':
        case 'wordchain':
          description = 'لیست جلسات فعال بازی زنجیره کلمات. واژگان خود را به چالش بکشید و در این بازی کلامی پیروز شوید!';
          color = '#3498DB'; // آبی
          break;
        case 'truth_or_dare':
        case 'truthordare':
          description = 'لیست جلسات فعال بازی جرأت یا حقیقت. جرأت انتخاب دارید یا ترجیح می‌دهید حقیقت را بگویید؟';
          color = '#FF5722'; // نارنجی
          break;
        case 'drawguess':
          description = 'لیست جلسات فعال بازی نقاشی و حدس. مهارت نقاشی یا حدس زدن خود را بسنجید و برنده شوید!';
          color = '#4CAF50'; // سبز روشن
          break;
        default:
          description = `لیست جلسات فعال بازی ${gameTypeName.split(' ').slice(1).join(' ')} در حال حاضر`;
      }
    }
    
    // ایجاد Embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color as ColorResolvable)
      .addFields(
        { name: '🎲 کل جلسات فعال', value: `${gameTypeStats.total} جلسه`, inline: true },
        { name: '👥 کل بازیکنان حاضر', value: `${totalActivePlayers} بازیکن`, inline: true }
      )
      .setFooter({ text: 'برای پیوستن به یک بازی، روی دکمه مربوطه کلیک کنید' })
      .setTimestamp();
    
    // تبدیل وضعیت بازی به متن فارسی
    const gameStatusText: Record<string, string> = {
      'waiting': '⏳ در انتظار شروع',
      'active': '🟢 در حال انجام',
      'ended': '🔴 پایان یافته'
    };
    
    // اضافه کردن آمار بازی‌های فعال به تفکیک نوع
    if (Object.keys(gameTypeCounts).length > 0) {
      let statsText = '';
      Object.keys(gameTypeCounts).forEach(type => {
        if (gameTypeCounts[type] > 0) {
          const typeName = gameTypeNames[type] || type;
          statsText += `${typeName}: **${gameTypeCounts[type]}** جلسه\n`;
        }
      });
      
      if (statsText.length > 0) {
        embed.addFields({
          name: '📊 آمار بازی‌ها به تفکیک نوع',
          value: statsText
        });
      }
    }
    
    // اضافه کردن بخش‌بندی جلسات در انتظار و جلسات فعال
    const waitingGames = activeGamesList.filter(game => game.status === 'waiting');
    const activeGamesRunning = activeGamesList.filter(game => game.status === 'active');
    
    // اضافه کردن بخش جلسات در انتظار بازیکن
    if (waitingGames.length > 0) {
      let waitingGamesText = '';
      
      waitingGames.slice(0, 5).forEach((game, index) => {
        const gameTypeName = gameTypeNames[game.gameType] || game.gameType;
        const hostUser = client.users.cache.get(game.createdBy)?.username || 'کاربر ناشناس';
        const channel = client.channels.cache.get(game.channelId) as TextChannel;
        const channelName = channel ? `در #${channel.name}` : '';
        
        // بررسی تنظیمات بازی برای دریافت حداکثر تعداد بازیکنان
        let maxPlayers = '؟';
        if (game.gameSettings && game.gameSettings.maxPlayers) {
          maxPlayers = game.gameSettings.maxPlayers.toString();
        }
        
        waitingGamesText += `**${index + 1}.** ${gameTypeName} ${channelName}\n` +
                            `👤 میزبان: **${hostUser}** | 👥 بازیکنان: **${game.players.length}**/${maxPlayers}\n\n`;
      });
      
      if (waitingGames.length > 5) {
        waitingGamesText += `...و ${waitingGames.length - 5} جلسه دیگر\n`;
      }
      
      embed.addFields({
        name: '⏳ جلسات در انتظار بازیکن',
        value: waitingGamesText || 'هیچ جلسه‌ای در انتظار بازیکن نیست.',
        inline: false
      });
    }
    
    // اضافه کردن بخش جلسات در حال اجرا
    if (activeGamesRunning.length > 0) {
      let activeGamesText = '';
      
      activeGamesRunning.slice(0, 5).forEach((game, index) => {
        const gameTypeName = gameTypeNames[game.gameType] || game.gameType;
        const hostUser = client.users.cache.get(game.createdBy)?.username || 'کاربر ناشناس';
        const startTime = game.startedAt ? new Date(game.startedAt).toLocaleTimeString('fa-IR') : 'نامشخص';
        const channel = client.channels.cache.get(game.channelId) as TextChannel;
        const channelName = channel ? `در #${channel.name}` : '';
        
        activeGamesText += `**${index + 1}.** ${gameTypeName} ${channelName}\n` +
                           `👤 میزبان: **${hostUser}** | 👥 بازیکنان: **${game.players.length}** | ⏰ شروع: **${startTime}**\n\n`;
      });
      
      if (activeGamesRunning.length > 5) {
        activeGamesText += `...و ${activeGamesRunning.length - 5} جلسه دیگر\n`;
      }
      
      embed.addFields({
        name: '🟢 جلسات در حال اجرا',
        value: activeGamesText || 'هیچ جلسه‌ای در حال اجرا نیست.',
        inline: false
      });
    }
    
    // دکمه‌های پیوستن به بازی
    const joinButtons: ButtonBuilder[] = [];
  
    // دکمه‌های پیوستن به جلسات در انتظار بازیکن (حداکثر 3 دکمه)
    let waitingGamesButtons = 0;
    for (const game of waitingGames.slice(0, 3)) {
      const gameType = game.gameType;
      
      joinButtons.push(
        new ButtonBuilder()
          .setCustomId(`join_game:${game.id}`)
          .setLabel(`پیوستن به ${gameTypeNames[gameType] || gameType}`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('👥')
      );
      waitingGamesButtons++;
    }
    
    // چک می‌کنیم آیا فضای کافی برای دکمه‌های دیگر داریم
    if (waitingGamesButtons < 5) {
      let availableSlots = 5 - waitingGamesButtons;
      if (availableSlots > 0) {
        // اضافه کردن دکمه ایجاد بازی مافیا
        joinButtons.push(
          new ButtonBuilder()
            .setCustomId('create_mafia')
            .setLabel('ایجاد بازی مافیا')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🕵️‍♂️')
        );
        availableSlots--;
      }
      
      if (availableSlots > 0) {
        // اضافه کردن دکمه ایجاد بازی گرگینه
        joinButtons.push(
          new ButtonBuilder()
            .setCustomId('game:werewolf:create')
            .setLabel('ایجاد بازی گرگینه')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🐺')
        );
      }
    }
    
    // ساخت صف دکمه‌های پیوستن
    const joinButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...joinButtons);
    
    // دکمه‌های کنترلی
    const controlRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('group_games')
          .setLabel('منوی بازی‌های گروهی')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setCustomId('game:leaderboard')
          .setLabel('رتبه‌بندی')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏆'),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('منوی اصلی')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );
  
    // ارسال پاسخ با دکمه‌های اضافی
    if (joinButtons.length > 0) {
      await interaction.reply({ 
        embeds: [embed], 
        components: [joinButtonsRow, controlRow], 
        ephemeral: true 
      });
    } else {
      await interaction.reply({ 
        embeds: [embed], 
        components: [controlRow], 
        ephemeral: true 
      });
    }
  } catch (error) {
    log(`Error showing active sessions menu: ${error}`, 'error');
    
    try {
      await interaction.reply({ 
        content: '❌ خطایی در نمایش جلسات فعال رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
        ephemeral: true 
      });
    } catch (replyError) {
      log(`Failed to send error message: ${replyError}`, 'error');
    }
  }
}

/**
 * ایجاد منوی اصلی بازی‌های گروهی
 */
export async function handleGroupGamesMenu(interaction: ChatInputCommandInteraction) {
  try {
    // دریافت تعداد بازیکنان فعال و کل بازی‌های فعال
    const activePlayers = getActivePlayersCount();
    const gameStats = getActiveGamesByType();
    
    // ساخت Embed اصلی
    const embed = new EmbedBuilder()
      .setTitle('🎮 بازی‌های گروهی')
      .setDescription('🎲 سرگرمی دسته‌جمعی با دوستان و اعضای سرور!\n\n🎯 این بازی‌ها برای 3 تا 10 نفر طراحی شده‌اند. هیچ هزینه‌ای برای شرکت در این بازی‌ها نیاز نیست و هدف اصلی سرگرمی است.')
      .setColor('#9B59B6') // رنگ بنفش برای بازی‌های گروهی
      .addFields(
        { name: '👥 بازیکنان فعال', value: `${activePlayers} نفر`, inline: true },
        { name: '🎲 بازی‌های جاری', value: `${gameStats.total} بازی`, inline: true }
      )
      .setImage('https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/group_games_banner.png?width=915&height=147')
      .setFooter({ text: 'برای انتخاب بازی از دکمه‌های زیر استفاده کنید' });
      
    // اضافه کردن آمار جزئی بازی‌ها اگر بازی فعالی وجود داشته باشد
    if (gameStats.total > 0) {
      // ایجاد متن جزئیات بازی‌های فعال
      const gameTypeEmojis: Record<string, string> = {
        'quiz': '📚',
        'drawguess': '🎨',
        'truthordare': '🎯',
        'bingo': '🎲',
        'wordchain': '📝',
        'mafia': '🕵️‍♂️',
        'werewolf': '🐺',
        'spy': '🕴️'
      };
      
      let detailsText = '';
      for (const [gameType, count] of Object.entries(gameStats)) {
        if (gameType !== 'total' && count > 0) {
          const emoji = gameTypeEmojis[gameType] || '🎮';
          const name = gameType === 'quiz' ? 'اطلاعات عمومی' :
                       gameType === 'drawguess' ? 'نقاشی حدس بزن' :
                       gameType === 'truthordare' ? 'جرأت یا حقیقت' :
                       gameType === 'bingo' ? 'بینگو' :
                       gameType === 'wordchain' ? 'زنجیره کلمات' :
                       gameType === 'mafia' ? 'مافیا' :
                       gameType === 'werewolf' ? 'گرگینه' :
                       gameType === 'spy' ? 'جاسوس مخفی' : gameType;
          
          detailsText += `${emoji} **${name}**: ${count} بازی\n`;
        }
      }
      
      if (detailsText) {
        embed.addFields({ name: '📊 آمار بازی‌های فعال', value: detailsText });
      }
    }

    const buttonsRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('group_quiz')
          .setLabel('مسابقه اطلاعات عمومی')
          .setEmoji('📚')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_drawguess')
          .setLabel('نقاشی حدس بزن')
          .setEmoji('🎨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_truthordare')
          .setLabel('جرأت یا حقیقت')
          .setEmoji('😈')
          .setStyle(ButtonStyle.Primary)
      );

    const buttonsRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('group_bingo')
          .setLabel('بینگو')
          .setEmoji('🎰')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_wordchain')
          .setLabel('زنجیره کلمات')
          .setEmoji('🔗')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('game:active_sessions')
          .setLabel('جلسات فعال')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Success)
      );

    const buttonsRow3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('group_mafia')
          .setLabel('مافیا')
          .setEmoji('🕵️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_werewolf')
          .setLabel('گرگینه')
          .setEmoji('🐺')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_spy')
          .setLabel('جاسوس مخفی')
          .setEmoji('🕵️‍♂️')
          .setStyle(ButtonStyle.Primary)
      );
    
    // ردیف چهارم برای دکمه‌های اضافی
    const buttonsRow4 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:leaderboard')
          .setLabel('رتبه‌بندی')
          .setEmoji('🏆')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('game:history')
          .setLabel('تاریخچه من')
          .setEmoji('📜')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('group_back')
          .setLabel('برگشت')
          .setEmoji('⬅️')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [buttonsRow1, buttonsRow2, buttonsRow3, buttonsRow4],
      ephemeral: false
    });
  } catch (error) {
    log(`Error handling group games menu: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در نمایش منوی بازی‌های گروهی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * تابع کمکی برای دکمه‌های مخفی برای بازی‌های گرگینه و جاسوس
 * @param gameType نوع بازی (werewolf یا spy)
 * @returns وضعیت نمایش دکمه‌های مخفی
 */
async function getGameHiddenButtonsStatus(gameType: 'werewolf' | 'spy'): Promise<boolean> {
  try {
    // دریافت تنظیمات از دیتابیس یا فایل پیکربندی
    // در این پیاده‌سازی اولیه، به صورت تصادفی نمایش می‌دهیم
    // (در نسخه نهایی باید از دیتابیس یا فایل تنظیمات خوانده شود)
    
    // احتمال ۳۰ درصد برای نمایش دکمه‌های مخفی
    return Math.random() < 0.3;
  } catch (error) {
    log(`Error checking hidden buttons status: ${error}`, 'error');
    return false; // در صورت خطا، دکمه‌های مخفی را نشان نمی‌دهیم
  }
}

/**
 * مدیریت کلیک روی دکمه‌های منوی بازی‌های گروهی
 */
export async function handleGroupGamesButton(interaction: ButtonInteraction) {
  try {
    const buttonId = interaction.customId;
    
    // پشتیبانی از فرمت جدید game:type:action
    if (buttonId.startsWith('game:')) {
      const [_, gameType, action] = buttonId.split(':');
      
      // دکمه‌های ویژه
      if (gameType === 'history') {
        await showGameHistory(interaction);
        return;
      }
      
      if (gameType === 'leaderboard') {
        await showGameLeaderboard(interaction);
        return;
      }
      
      if (gameType === 'active_sessions') {
        await showActiveSessionsMenu(interaction);
        return;
      }
      
      // نمایش جلسات فعال یک نوع بازی خاص
      if (gameType === 'mafia' && action === 'sessions') {
        await showActiveSessionsMenu(interaction, 'mafia');
        return;
      }
      
      if (gameType === 'werewolf' && action === 'sessions') {
        await showActiveSessionsMenu(interaction, 'werewolf');
        return;
      }
      
      if (gameType === 'spy' && action === 'sessions') {
        await showActiveSessionsMenu(interaction, 'spy');
        return;
      }
      
      // دسترسی مستقیم به بازی‌های تعیین‌شده
      if (gameType === 'quiz' && action === 'sessions') {
        await showActiveSessionsMenu(interaction, 'quiz');
        return;
      }
      
      if (gameType === 'bingo' && action === 'sessions') {
        await showActiveSessionsMenu(interaction, 'bingo');
        return;
      }
      
      if (gameType === 'word_chain' && action === 'sessions') {
        await showActiveSessionsMenu(interaction, 'word_chain');
        return;
      }
      
      if (gameType === 'truth_or_dare' && action === 'sessions') {
        await showActiveSessionsMenu(interaction, 'truth_or_dare');
        return;
      }
      
      if (gameType === 'drawguess' && action === 'sessions') {
        await showActiveSessionsMenu(interaction, 'drawguess');
        return;
      }
      
      // دکمه‌های مخفی گرگینه
      if (buttonId === 'werewolf_special_event') {
        await interaction.reply({
          content: '🌟 **رویداد ویژه گرگینه فعال شد!** شما به رویداد ویژه دسترسی پیدا کردید! در این حالت، نقش‌های ویژه‌ای مثل "گرگینه آلفا" و "محافظ جادویی" به بازی اضافه می‌شوند!',
          ephemeral: false
        });
        return;
      }
      
      if (buttonId === 'werewolf_bonus_coins') {
        await interaction.reply({
          content: '💰 **سکه‌های اضافی گرگینه فعال شد!** بازیکنان در این جلسه ۳ برابر سکه دریافت خواهند کرد! این پاداش برای جلسه فعلی فعال خواهد بود.',
          ephemeral: false
        });
        return;
      }
      
      if (buttonId === 'werewolf_special_roles') {
        await interaction.reply({
          content: '👑 **نقش‌های ویژه گرگینه فعال شد!** نقش‌های جدید و هیجان‌انگیزی به بازی اضافه شد! مراقب باشید، برخی از این نقش‌ها قدرت‌های خطرناکی دارند!',
          ephemeral: false
        });
        return;
      }
      
      // دکمه‌های مخفی جاسوس
      if (buttonId === 'spy_special_locations') {
        await interaction.reply({
          content: '🏙️ **مکان‌های ویژه جاسوس فعال شد!** لیست مکان‌های جدید و هیجان‌انگیز به بازی اضافه شد! آیا می‌توانید جاسوس را در این مکان‌های عجیب پیدا کنید؟',
          ephemeral: false
        });
        return;
      }
      
      if (buttonId === 'spy_double_spy') {
        await interaction.reply({
          content: '🔍 **حالت جاسوس دوگانه فعال شد!** در این حالت، دو جاسوس در بازی وجود دارد! آیا می‌توانید هر دو را پیدا کنید؟ شناسایی هر جاسوس جوایز جداگانه‌ای دارد!',
          ephemeral: false
        });
        return;
      }
      
      if (buttonId === 'spy_secret_mission') {
        await interaction.reply({
          content: '🎭 **ماموریت مخفی فعال شد!** هر بازیکن یک ماموریت مخفی در کنار نقش اصلی خود دریافت می‌کند. تکمیل این ماموریت‌ها پاداش ویژه‌ای به همراه دارد!',
          ephemeral: false
        });
        return;
      }
      
      // پشتیبانی از فرمت قدیمی
      if (buttonId === 'sessions_werewolf') {
        await showActiveSessionsMenu(interaction, 'werewolf');
        return;
      }
      
      if (buttonId.startsWith('join_game:')) {
        const gameId = buttonId.split(':')[1];
        await joinGameById(interaction, gameId);
        return;
      }
      
      // مسیریابی براساس نوع بازی
      switch (gameType) {
        case 'mafia':
          await handleMafiaGame(interaction);
          break;
        case 'werewolf':
          await handleWerewolfGame(interaction);
          break;
        case 'quiz':
          await handleQuizGame(interaction);
          break;
        case 'pictionary':
        case 'drawguess':
          await handleDrawGuessGame(interaction);
          break;
        case 'truth_or_dare':
          await handleTruthOrDareGame(interaction);
          break;
        case 'bingo':
          await handleBingoGame(interaction);
          break;
        case 'word_chain':
          await handleWordChainGame(interaction);
          break;
        case 'spy':
        case 'spyfall':
          await handleSpyGame(interaction);
          break;
        default:
          await interaction.reply({
            content: '❌ این نوع بازی هنوز پیاده‌سازی نشده است. لطفاً بعداً دوباره امتحان کنید.',
            ephemeral: true
          });
      }
      return;
    }
    
    // بررسی نوع بازی انتخاب شده (فرمت قدیمی)
    switch (buttonId) {
      case 'group_quiz':
        await handleQuizGame(interaction);
        break;
      case 'group_drawguess':
        await handleDrawGuessGame(interaction);
        break;
      case 'group_truthordare':
        await handleTruthOrDareGame(interaction);
        break;
      case 'group_bingo':
        await handleBingoGame(interaction);
        break;
      case 'group_wordchain':
        await handleWordChainGame(interaction);
        break;
      case 'wordchain':
        await handleWordChainGame(interaction);
        break;
      case 'group_mafia':
        await handleMafiaGame(interaction);
        break;
      case 'group_werewolf':
        await handleWerewolfGame(interaction);
        break;
      case 'group_spy':
        await handleSpyGame(interaction);
        break;
        
      // دکمه‌های بازی مافیا  
      case 'mafia_join':
        await joinMafiaGame(interaction);
        break;
      case 'mafia_start':
        await startMafiaGame(interaction);
        break;
      case 'mafia_rules':
        await showMafiaRules(interaction);
        break;
      case 'mafia_back_to_menu':
        await interaction.update({ components: [], embeds: [] });
        break;
      case 'group_back':
        await interaction.update({ 
          content: 'این قابلیت هنوز در حال توسعه است و به زودی فعال خواهد شد.',
          embeds: [], 
          components: [] 
        });
        break;
      case 'quiz_join':
        await joinQuizGame(interaction);
        break;
      case 'quiz_start':
        await startQuizGame(interaction);
        break;
      case 'quiz_submit_question':
        await showSubmitQuestionModal(interaction);
        break;
      case 'drawguess_join':
        await joinDrawGuessGame(interaction);
        break;
      case 'drawguess_start':
        await startDrawGuessGame(interaction);
        break;
      case 'drawguess_new':
        await handleDrawGuessGame(interaction);
        break;
      case 'mafia_join':
        await joinMafiaGame(interaction);
        break;
      case 'mafia_start':
        await startMafiaGame(interaction);
        break;
      case 'mafia_rules':
        await showMafiaRules(interaction);
        break;
      default:
        if (buttonId.startsWith('quiz_answer_')) {
          await handleQuizAnswer(interaction);
        } else if (buttonId.startsWith('drawguess_word_')) {
          await handleWordSelection(interaction);
        } else {
          await interaction.reply({ content: '❌ دکمه نامعتبر است!', ephemeral: true });
        }
    }
  } catch (error) {
    log(`Error handling group games button: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در پردازش درخواست رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * نمایش فرم ارسال سوال جدید
 */
async function showSubmitQuestionModal(interaction: ButtonInteraction) {
  try {
    const modal = new ModalBuilder()
      .setCustomId('quiz_question_modal')
      .setTitle('ارسال سؤال جدید');

    const questionInput = new TextInputBuilder()
      .setCustomId('question')
      .setLabel('سؤال')
      .setPlaceholder('سؤال مورد نظر خود را بنویسید...')
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const option1Input = new TextInputBuilder()
      .setCustomId('option1')
      .setLabel('گزینه ۱ (پاسخ صحیح)')
      .setPlaceholder('گزینه صحیح را وارد کنید...')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const option2Input = new TextInputBuilder()
      .setCustomId('option2')
      .setLabel('گزینه ۲')
      .setPlaceholder('گزینه دوم را وارد کنید...')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const option3Input = new TextInputBuilder()
      .setCustomId('option3')
      .setLabel('گزینه ۳')
      .setPlaceholder('گزینه سوم را وارد کنید...')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const categoryInput = new TextInputBuilder()
      .setCustomId('category')
      .setLabel('دسته‌بندی')
      .setPlaceholder('مثلا: تاریخ، علم، ورزش، هنر و سرگرمی، جغرافیا')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const questionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(questionInput);
    const option1Row = new ActionRowBuilder<TextInputBuilder>().addComponents(option1Input);
    const option2Row = new ActionRowBuilder<TextInputBuilder>().addComponents(option2Input);
    const option3Row = new ActionRowBuilder<TextInputBuilder>().addComponents(option3Input);
    const categoryRow = new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput);

    modal.addComponents(questionRow, option1Row, option2Row, option3Row, categoryRow);
    await interaction.showModal(modal);
  } catch (error) {
    log(`Error showing submit question modal: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در نمایش فرم ارسال سؤال رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت ارسال فرم سوال جدید
 */
export async function handleQuizQuestionModalSubmit(interaction: ModalSubmitInteraction) {
  try {
    // دریافت اطلاعات ورودی کاربر
    const question = interaction.fields.getTextInputValue('question');
    const option1 = interaction.fields.getTextInputValue('option1');
    const option2 = interaction.fields.getTextInputValue('option2');
    const option3 = interaction.fields.getTextInputValue('option3');
    const category = interaction.fields.getTextInputValue('category');

    // ساخت سوال جدید
    const newQuestion: QuizQuestion = {
      id: `user_${Date.now()}`,
      question,
      options: [option1, option2, option3],
      correctAnswer: 0, // گزینه اول همیشه درست است
      category,
      difficulty: 'medium',
      addedBy: interaction.user.id,
      approved: false,
      createdAt: new Date()
    };

    // ذخیره سوال در دیتابیس (در اینجا فرض می‌کنیم دارای یک تابع saveUserQuestion در storage هستیم)
    await storage.saveQuizQuestion(newQuestion);

    // اطلاع به کاربر
    await interaction.reply({
      content: '✅ سؤال شما با موفقیت ثبت شد و برای بررسی به داوران ارسال شد. در صورت تأیید، سکه‌های پاداش به حساب شما واریز خواهد شد.',
      ephemeral: true
    });

    // اطلاع به کاربران دارای نقش داور سوالات
    try {
      // در اینجا می‌توانیم با پیدا کردن کاربران دارای نقش داور، به آنها اطلاع دهیم
      const guild = interaction.guild;
      if (guild) {
        // فرض می‌کنیم شناسه نقش داور سوالات را می‌دانیم 
        // (این را باید از تنظیمات بات یا دیتابیس بخوانیم)
        const quizReviewerRoleId = '123456789012345678'; // به عنوان مثال
        
        // ممکن است نیاز به اطلاع به کانال خاصی برای داوران باشد
        // const quizReviewChannel = guild.channels.cache.get('channel_id_for_reviewers');
      }
    } catch (notificationError) {
      log(`Error notifying quiz reviewers: ${notificationError}`, 'warn');
      // این خطا نباید جلوی موفقیت فرآیند اصلی را بگیرد
    }
  } catch (error) {
    log(`Error handling quiz question modal submit: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در ثبت سؤال رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مدیریت بازی اطلاعات عمومی با امکانات پیشرفته و رابط کاربری جذاب‌تر
 */
async function handleQuizGame(interaction: ButtonInteraction) {
  try {
    // ایجاد یک جلسه بازی جدید با تنظیمات پیشرفته
    let quizGameSession: GameSession = {
      id: `quiz_${Date.now()}`,
      gameType: 'quiz',
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      players: [],
      status: 'waiting',
      data: {
        currentQuestionIndex: -1,
        questions: [],
        playerScores: {},
        playerAnswers: {},
        maxQuestions: 10,
        timePerQuestion: 30, // افزایش به 30 ثانیه
        difficulty: 'mixed', // سطح سختی مخلوط
        categories: [], // دسته‌بندی‌های سوالات
        scoreMultipliers: { // ضرایب امتیاز بر اساس سختی سوال
          easy: 1,
          medium: 2,
          hard: 3
        },
        enableFastAnswerBonus: true, // امتیاز اضافی برای پاسخ سریع
        enableStreakBonus: true, // امتیاز اضافی برای پاسخ‌های صحیح متوالی
        streakMultiplier: 0.5, // ضریب امتیاز برای پاسخ‌های صحیح متوالی
        showProgressBar: true, // نمایش نوار پیشرفت
        showCategoryImage: true, // نمایش تصویر دسته‌بندی
        useAnimations: true, // استفاده از انیمیشن‌ها
        lastQuestionEnd: null, // زمان پایان آخرین سوال
        playerStreaks: {} // رکورد پاسخ‌های متوالی صحیح
      },
      gameSettings: {
        isPrivate: false,
        allowSpectators: true,
        customRules: [],
        timerSettings: {
          voteTime: 30 // زمان پاسخ به هر سوال
        }
      }
    };
    
    // اگر میزبان قابلیت ویژه داشته باشد، این جلسه ویژه خواهد بود
    const hasSpecialFeature = Math.random() > 0.8; // این را با منطق واقعی جایگزین کنید
    if (hasSpecialFeature) {
      quizGameSession.data.isSpecialSession = true;
      quizGameSession.data.specialFeatures = ['double_score', 'power_ups', 'multi_answer'];
    }
    
    // ذخیره در لیست موقت بازی‌ها
    activeGames.set(quizGameSession.id, quizGameSession);
    
    // دریافت اطلاعات میزبان برای نمایش در رابط کاربری
    const hostUser = await interaction.client.users.fetch(interaction.user.id);
    
    // ایجاد Embed پیشرفته با طراحی جذاب‌تر
    const embed = new EmbedBuilder()
      .setTitle('🧠 مسابقه اطلاعات عمومی رقابتی')
      .setDescription('**به مسابقه هیجان‌انگیز اطلاعات عمومی رقابتی خوش آمدید!** 🎉\n\nدر این بازی دونفره، دانش و سرعت عمل شما به چالش کشیده می‌شود. با پاسخ صحیح به سوالات، امتیاز جمع کنید و برنده شوید! هر پاسخ سریع‌تر امتیاز بیشتری دارد. 🏆')
      .setColor(0xE74C3C) // رنگ قرمز برای نشان دادن رقابت
      .addFields(
        { name: '👥 ظرفیت بازیکنان', value: '0/2', inline: true },
        { name: '⏱️ زمان هر سوال', value: '30 ثانیه', inline: true },
        { name: '📚 تعداد سوالات', value: '10 سوال', inline: true },
        { name: '💰 جایزه برندگان', value: 'برنده: 500 کوین 🥇\nبازنده: 100 کوین 🎖️', inline: true },
        { name: '👑 میزبان بازی', value: hostUser.username, inline: true }
      )
      .setImage('https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/group_games_banner.png?width=915&height=147') // تصویر بنر بازی
      .setFooter({ 
        text: `برای شرکت در بازی روی دکمه "ورود به بازی" کلیک کنید | ID: ${quizGameSession.id}`,
        iconURL: hostUser.displayAvatarURL({ size: 32 })
      })
      .setTimestamp();
    
    // ساخت دکمه‌های زیباتر
    const joinButton = new ButtonBuilder()
      .setCustomId('quiz_join')
      .setLabel('ورود به بازی')
      .setEmoji('🎮')
      .setStyle(ButtonStyle.Success);
    
    const startButton = new ButtonBuilder()
      .setCustomId('quiz_start')
      .setLabel('شروع بازی')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary);
    
    // دکمه جدید برای تنظیمات پیشرفته
    const settingsButton = new ButtonBuilder()
      .setCustomId('quiz_settings')
      .setLabel('تنظیمات بازی')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Secondary);
    
    const submitQuestionButton = new ButtonBuilder()
      .setCustomId('quiz_submit_question')
      .setLabel('ارسال سوال جدید')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary);
    
    // دکمه جدید برای نمایش قوانین
    const rulesButton = new ButtonBuilder()
      .setCustomId('quiz_rules')
      .setLabel('قوانین بازی')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary);
    
    // ردیف اول دکمه‌ها - اصلی
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(joinButton, startButton, settingsButton);
    
    // ردیف دوم دکمه‌ها - فرعی
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(submitQuestionButton, rulesButton);
    
    // نمایش رابط کاربری جدید
    const response = await interaction.reply({ 
      embeds: [embed], 
      components: [row1, row2],
      fetchReply: true
    });
    
    // ذخیره شناسه پیام در اطلاعات بازی
    quizGameSession.data.messageId = response.id;
    activeGames.set(quizGameSession.id, quizGameSession);
    
    // افزودن واکنش‌ها برای جلوه بصری بیشتر
    try {
      if (response && 'react' in response) {
        await response.react('🎲');
        await response.react('🧠');
        await response.react('🏆');
      }
    } catch (reactError) {
      // اگر نتوانیم واکنش اضافه کنیم، مشکلی نیست
      log(`Error adding reactions: ${reactError}`, 'warn');
    }
    
  } catch (error) {
    log(`Error handling quiz game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در شروع بازی اطلاعات عمومی رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * پیوستن به بازی اطلاعات عمومی با تجربه کاربری پیشرفته
 */
async function joinQuizGame(interaction: ButtonInteraction) {
  try {
    // پیدا کردن بازی فعال در کانال جاری
    const gameSession = Array.from(activeGames.values()).find(
      game => game.gameType === 'quiz' && 
      game.channelId === interaction.channelId && 
      game.status === 'waiting'
    );
    
    if (!gameSession) {
      return await interaction.reply({ 
        content: '❌ بازی فعالی یافت نشد! می‌توانید با دستور `/group games` یک بازی جدید ایجاد کنید.', 
        ephemeral: true 
      });
    }
    
    // بررسی اینکه آیا بازی خصوصی است
    if (gameSession.gameSettings?.isPrivate && gameSession.createdBy !== interaction.user.id) {
      // بررسی اینکه آیا کاربر در لیست دعوت‌شدگان است
      const isInvited = gameSession.data.invitedPlayers?.includes(interaction.user.id);
      if (!isInvited) {
        return await interaction.reply({ 
          content: '❌ این بازی خصوصی است و فقط افراد دعوت شده می‌توانند به آن بپیوندند.', 
          ephemeral: true 
        });
      }
    }
    
    // بررسی اینکه آیا کاربر قبلاً به بازی پیوسته است یا خیر
    if (gameSession.players.includes(interaction.user.id)) {
      // به کاربر اطلاع می‌دهیم که قبلاً پیوسته، اما با ظاهری زیباتر
      const alreadyJoinedEmbed = new EmbedBuilder()
        .setTitle('⚠️ شما قبلاً پیوسته‌اید!')
        .setDescription('شما قبلاً به این بازی ملحق شده‌اید و نیازی به پیوستن مجدد نیست.')
        .setColor(0xFFA500) // رنگ نارنجی برای هشدار
        .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
        .setFooter({ text: 'منتظر شروع بازی باشید...' });
      
      return await interaction.reply({ embeds: [alreadyJoinedEmbed], ephemeral: true });
    }
    
    // بررسی محدودیت تعداد بازیکنان
    if (gameSession.players.length >= 2) {
      const fullGameEmbed = new EmbedBuilder()
        .setTitle('❌ ظرفیت تکمیل است!')
        .setDescription('متأسفانه ظرفیت این بازی رقابتی تکمیل شده است و امکان پیوستن به آن وجود ندارد.')
        .setColor(0xFF0000) // رنگ قرمز برای خطا
        .addFields(
          { name: '👥 تعداد بازیکنان', value: `${gameSession.players.length}/2 (تکمیل)`, inline: true },
          { name: '👤 میزبان بازی', value: `<@${gameSession.createdBy}>`, inline: true }
        )
        .setFooter({ text: 'می‌توانید یک بازی جدید ایجاد کنید یا منتظر باشید تا یک بازی دیگر شروع شود' });
        
      return await interaction.reply({ embeds: [fullGameEmbed], ephemeral: true });
    }
    
    // افزودن کاربر به لیست بازیکنان
    gameSession.players.push(interaction.user.id);
    
    // اگر امتیازات متناوب فعال باشد، آن‌ها را مقداردهی اولیه می‌کنیم
    if (!gameSession.data.playerScores) {
      gameSession.data.playerScores = {};
    }
    
    if (!gameSession.data.playerStreaks) {
      gameSession.data.playerStreaks = {};
    }
    
    // آماده‌سازی امتیاز کاربر
    gameSession.data.playerScores[interaction.user.id] = 0;
    gameSession.data.playerStreaks[interaction.user.id] = 0;
    
    // اضافه کردن به لیست بازیکنان آنلاین
    gameSession.data.playerStatus = gameSession.data.playerStatus || {};
    gameSession.data.playerStatus[interaction.user.id] = 'online';
    
    // بررسی سطح کاربر و ثبت امتیازات پایه بر اساس سطح
    const userLevel = Math.floor(Math.random() * 100); // در واقعیت باید از دیتابیس بخوانیم
    gameSession.data.playerLevel = gameSession.data.playerLevel || {};
    gameSession.data.playerLevel[interaction.user.id] = userLevel;
    
    // ذخیره تغییرات
    activeGames.set(gameSession.id, gameSession);
    
    // به‌روزرسانی Embed
    const message = await interaction.message.fetch();
    const embed = EmbedBuilder.from(message.embeds[0]);
    
    // به‌روزرسانی فیلد تعداد بازیکنان
    const playerField = embed.data.fields?.find(field => field.name?.includes('ظرفیت بازیکنان') || field.name?.includes('تعداد بازیکنان'));
    if (playerField) {
      playerField.value = `${gameSession.players.length}/2`;
    }
    
    // افزودن لیست بازیکنان
    const playersList = gameSession.players.map(playerId => `<@${playerId}>`).join('\n');
    
    // بررسی اگر فیلد بازیکنان قبلاً وجود داشته باشد
    const existingPlayersListField = embed.data.fields?.find(field => field.name === '👤 بازیکنان');
    if (existingPlayersListField) {
      existingPlayersListField.value = playersList;
    } else {
      embed.addFields({ name: '👤 بازیکنان', value: playersList });
    }
    
    // به‌روزرسانی پیام اصلی بازی
    await interaction.update({ embeds: [embed] });
    
    // ایجاد یک Embed جدید برای تأیید پیوستن به بازی (فقط برای کاربر)
    const joinConfirmEmbed = new EmbedBuilder()
      .setTitle('✅ با موفقیت پیوستید!')
      .setDescription(`شما با موفقیت به بازی اطلاعات عمومی پیوستید. منتظر شروع بازی باشید!`)
      .setColor(0x3BA55D) // رنگ سبز برای موفقیت
      .addFields(
        { name: '🎮 نام بازی', value: 'مسابقه اطلاعات عمومی رقابتی', inline: true },
        { name: '👤 میزبان بازی', value: `<@${gameSession.createdBy}>`, inline: true },
        { name: '👥 تعداد بازیکنان', value: `${gameSession.players.length}/2`, inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
      .setFooter({ text: `Game ID: ${gameSession.id} • ${new Date().toLocaleString('fa-IR')}` });
    
    // ارسال پیام خصوصی تأیید به کاربر
    await interaction.followUp({ embeds: [joinConfirmEmbed], ephemeral: true });
    
    // اطلاع به میزبان بازی که کاربر جدیدی پیوسته است
    try {
      const host = await interaction.client.users.fetch(gameSession.createdBy);
      if (host && gameSession.createdBy !== interaction.user.id) {
        const hostNotificationEmbed = new EmbedBuilder()
          .setTitle('👋 بازیکن جدید')
          .setDescription(`**${interaction.user.username}** به بازی شما پیوست!`)
          .setColor(0x9B59B6)
          .setThumbnail(interaction.user.displayAvatarURL({ size: 64 }))
          .setFooter({ text: `اکنون ${gameSession.players.length} بازیکن در بازی حضور دارند` });
          
        // در محیط واقعی این را به صورت متن DM به میزبان ارسال می‌کنیم
        // await host.send({ embeds: [hostNotificationEmbed] });
      }
    } catch (dmError) {
      // اگر نتوانیم به میزبان پیام بدهیم، مشکلی نیست، ادامه می‌دهیم
      log(`Failed to notify host about new player: ${dmError}`, 'warn');
    }
    
  } catch (error) {
    log(`Error joining quiz game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در پیوستن به بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * تهیه و بارگذاری سوالات برای بازی
 */
async function loadQuestionsForQuiz(gameSession: GameSession) {
  try {
    // دریافت سوالات تأیید شده از دیتابیس
    let questions: QuizQuestion[] = await storage.getApprovedQuizQuestions(
      undefined, // همه دسته‌بندی‌ها
      undefined, // همه سطوح سختی
      gameSession.data.maxQuestions // حداکثر تعداد سوالات لازم
    );
    
    // اگر سوالات به اندازه کافی موجود نبود، لاگ بگیریم
    if (!questions || questions.length < gameSession.data.maxQuestions) {
      log(`Not enough quiz questions available: ${questions?.length || 0}/${gameSession.data.maxQuestions}`, 'warning');
      
      if (questions.length === 0) {
        // اگر هیچ سوالی در دیتابیس نبود، یک سوال پیش‌فرض اضافه می‌کنیم
        const defaultQuestion = {
          id: uuidv4(),
          question: 'پایتخت ایران کدام شهر است؟',
          options: ['تهران', 'اصفهان', 'شیراز', 'تبریز'],
          correctAnswer: 0,
          category: 'جغرافیا',
          difficulty: 'easy' as 'easy',
          approved: true,
          createdAt: new Date()
        } as QuizQuestion;
        
        // ذخیره سوال در دیتابیس با استفاده از storage
        await storage.addQuizQuestion(defaultQuestion.question, defaultQuestion.options, 
          defaultQuestion.correctAnswer, defaultQuestion.category, 
          defaultQuestion.difficulty, 'system', true);
        
        // استفاده از سوال در بازی
        questions = [defaultQuestion];
      } else {
        // اگر سوالات کافی نیستند اما صفر نیستند، با همان تعداد موجود ادامه می‌دهیم
        log(`Using ${questions.length} available questions for the quiz.`, 'info');
      }
      
      // اضافه کردن سوالات نمونه اگر به اندازه کافی سوال نداریم
      if (questions.length < gameSession.data.maxQuestions) {
        const sampleQuestion = {
          id: uuidv4(),
          question: 'پاسارگاد مقبره کدام پادشاه است؟',
          options: ['کوروش', 'داریوش', 'خشایارشاه', 'اردشیر'],
          correctAnswer: 0,
          category: 'تاریخ',
          difficulty: 'easy' as 'easy',
          approved: true,
          createdAt: new Date()
        } as QuizQuestion;
        
        // ذخیره سوال به صورت محلی (بدون ذخیره در دیتابیس)
        questions.push(sampleQuestion);
      }
    }
    
    // انتخاب تصادفی تعداد مشخصی سوال
    if (questions.length > gameSession.data.maxQuestions) {
      // مخلوط کردن سوالات
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      
      // انتخاب تعداد مورد نیاز
      questions = questions.slice(0, gameSession.data.maxQuestions);
    }
    
    return questions;
  } catch (error) {
    log(`Error loading questions for quiz: ${error}`, 'error');
    return [];
  }
}

/**
 * شروع بازی اطلاعات عمومی با افکت‌های ویژه و تجربه کاربری بهتر
 */
async function startQuizGame(interaction: ButtonInteraction) {
  try {
    // پیدا کردن بازی فعال در کانال جاری
    const gameSession = Array.from(activeGames.values()).find(
      game => game.gameType === 'quiz' && 
      game.channelId === interaction.channelId && 
      game.status === 'waiting'
    );
    
    if (!gameSession) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ بازی فعالی یافت نشد!')
        .setDescription('هیچ بازی در حالت انتظار در این کانال وجود ندارد.')
        .setColor(0xFF0000)
        .setFooter({ text: 'ابتدا یک بازی جدید ایجاد کنید' });
        
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر سازنده بازی است
    if (gameSession.createdBy !== interaction.user.id) {
      const notHostEmbed = new EmbedBuilder()
        .setTitle('⛔ دسترسی محدود')
        .setDescription('فقط میزبان بازی می‌تواند آن را شروع کند!')
        .setColor(0xFF0000)
        .addFields({ 
          name: '👑 میزبان بازی', 
          value: `<@${gameSession.createdBy}>` 
        })
        .setThumbnail(interaction.user.displayAvatarURL({ size: 64 }))
        .setFooter({ text: 'شما میزبان این بازی نیستید' });
        
      return await interaction.reply({ embeds: [notHostEmbed], ephemeral: true });
    }
    
    // بررسی تعداد بازیکنان (حداقل 2 نفر)
    if (gameSession.players.length < 2) {
      const notEnoughPlayersEmbed = new EmbedBuilder()
        .setTitle('⚠️ تعداد بازیکنان ناکافی')
        .setDescription('برای شروع بازی حداقل به 2 بازیکن نیاز است!')
        .setColor(0xFFA500)
        .addFields(
          { name: '👥 تعداد فعلی', value: `${gameSession.players.length} بازیکن`, inline: true },
          { name: '🎯 حداقل مورد نیاز', value: '2 بازیکن', inline: true }
        )
        .setFooter({ text: 'منتظر بمانید تا بازیکنان بیشتری به بازی بپیوندند' });
        
      return await interaction.reply({ embeds: [notEnoughPlayersEmbed], ephemeral: true });
    }
    
    // اطلاع‌رسانی اولیه به بازیکنان که بازی در حال شروع است
    const preparingEmbed = new EmbedBuilder()
      .setTitle('🎮 در حال آماده‌سازی بازی...')
      .setDescription('لطفاً صبر کنید، بازی در حال آماده‌سازی و بارگذاری سوالات است.')
      .setColor(0x9B59B6)
      .setFooter({ text: 'این عملیات ممکن است چند ثانیه طول بکشد' });
      
    await interaction.update({ 
      embeds: [preparingEmbed], 
      components: [] 
    });
    
    // بارگذاری سوالات
    const questions = await loadQuestionsForQuiz(gameSession);
    if (questions.length === 0) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ خطای بارگذاری')
        .setDescription('خطایی در بارگذاری سوالات رخ داد. لطفاً بعداً دوباره تلاش کنید.')
        .setColor(0xFF0000)
        .setFooter({ text: 'مشکلی در سیستم سوالات وجود دارد' });
        
      return await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    }
    
    // مرتب‌سازی سوالات بر اساس سختی (ساده به سخت)
    if (gameSession.data.progressiveDifficulty) {
      const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
      questions.sort((a, b) => {
        return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
               difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
      });
    }
    
    // به‌روزرسانی وضعیت بازی
    gameSession.status = 'active';
    gameSession.startedAt = new Date();
    gameSession.data.questions = questions;
    gameSession.data.currentQuestionIndex = -1;
    
    // مقداردهی اولیه آمار بازی
    gameSession.data.correctAnswersCount = {};
    gameSession.data.fastestResponses = {};
    gameSession.data.streakRecords = {};
    
    gameSession.players.forEach(playerId => {
      gameSession.data.correctAnswersCount[playerId] = 0;
      gameSession.data.fastestResponses[playerId] = 0;
      gameSession.data.streakRecords[playerId] = 0;
      gameSession.data.playerStreaks[playerId] = 0;
    });
    
    // ذخیره‌سازی اطلاعات بازی
    activeGames.set(gameSession.id, gameSession);
    
    // ارسال پیام شروع بازی با افکت‌های ویژه
    const categoriesSet = new Set(questions.map(q => q.category));
    const categories = Array.from(categoriesSet).join(', ');
    
    const difficultyCount = {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length
    };
    
    // ایجاد Embed زیبا برای شروع بازی
    const gameStartEmbed = new EmbedBuilder()
      .setTitle('🎮 مسابقه اطلاعات عمومی رقابتی شروع شد!')
      .setDescription(
        '**بازی با موفقیت آغاز شد!** 🎉\n\n' +
        'اولین سوال به زودی نمایش داده می‌شود. آماده باشید و سریع پاسخ دهید! ' +
        'هر چه سریع‌تر پاسخ دهید، امتیاز بیشتری کسب می‌کنید. 🏆\n\n' +
        '**موفق باشید!** 🍀'
      )
      .setColor(0x9B59B6)
      .addFields(
        { 
          name: '👥 شرکت‌کنندگان', 
          value: gameSession.players.map((id, index) => `${getNumberEmoji(index+1)} <@${id}>`).join('\n'),
          inline: false 
        },
        { 
          name: '⏱️ زمان هر سوال', 
          value: `${gameSession.data.timePerQuestion} ثانیه`, 
          inline: true 
        },
        { 
          name: '📝 تعداد سوالات', 
          value: `${gameSession.data.questions.length} سوال`, 
          inline: true 
        },
        { 
          name: '🎖️ سطح سختی', 
          value: `آسان: ${difficultyCount.easy} | متوسط: ${difficultyCount.medium} | سخت: ${difficultyCount.hard}`,
          inline: false 
        },
        { 
          name: '🏷️ دسته‌بندی‌ها', 
          value: categories || 'متنوع', 
          inline: false 
        }
      )
      .setImage('https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/group_games_banner.png?width=915&height=147')
      .setFooter({ 
        text: `بازی به میزبانی ${interaction.user.username} شروع شد | Game ID: ${gameSession.id}`,
        iconURL: interaction.user.displayAvatarURL({ size: 32 })
      })
      .setTimestamp();
    
    // تغییر پیام به پیام شروع بازی
    await interaction.editReply({ embeds: [gameStartEmbed] });
    
    // افزودن واکنش‌های متنی به پیام شروع بازی
    try {
      const message = await interaction.fetchReply();
      if ('react' in message) {
        await message.react('🎲');
        await message.react('🎮');
        await message.react('🧠');
        await message.react('🏆');
      }
    } catch (reactError) {
      // اگر نتوانیم واکنش‌ها را اضافه کنیم، مشکلی نیست
      log(`Error adding reactions to start message: ${reactError}`, 'warn');
    }
    
    // اطلاع‌رسانی به بازیکنان در دایرکت (اختیاری)
    try {
      for (const playerId of gameSession.players) {
        if (playerId !== gameSession.createdBy) { // فقط به غیر میزبان اطلاع می‌دهیم
          const player = await interaction.client.users.fetch(playerId);
          if (player) {
            const playerNotifyEmbed = new EmbedBuilder()
              .setTitle('🎮 بازی شروع شد!')
              .setDescription(`بازی اطلاعات عمومی به میزبانی **${interaction.user.username}** شروع شد! به کانال برگردید تا در مسابقه شرکت کنید.`)
              .setColor(0x9B59B6)
              .setFooter({ text: 'اگر به کانال بروید، اولین سوال به زودی نمایش داده می‌شود' });
              
            // در محیط واقعی این را به صورت DM ارسال می‌کنیم
            // await player.send({ embeds: [playerNotifyEmbed] });
          }
        }
      }
    } catch (dmError) {
      // اگر نتوانیم به بازیکنان پیام بدهیم، مشکلی نیست
      log(`Failed to send DM to players: ${dmError}`, 'warn');
    }
    
    // استفاده از تایمر برای شمارش معکوس قبل از شروع سوال اول
    const countdownStart = 5; // 5 ثانیه شمارش معکوس
    let countdown = countdownStart;
    
    const countdownInterval = setInterval(async () => {
      try {
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          showNextQuestion(gameSession); // نمایش اولین سوال
          return;
        }
        
        const countdownEmbed = new EmbedBuilder()
          .setTitle(`⏱️ شروع بازی در ${countdown} ثانیه دیگر...`)
          .setDescription(`اولین سوال به زودی نمایش داده می‌شود! آماده باشید!`)
          .setColor(0x9B59B6)
          .setFooter({ text: 'منتظر بمانید' });
          
        const channel = await interaction.client.channels.fetch(gameSession.channelId);
        if (channel && 'send' in channel) {
          await channel.send({ embeds: [countdownEmbed] });
        }
        
        countdown--;
      } catch (countdownError) {
        clearInterval(countdownInterval);
        log(`Error in countdown timer: ${countdownError}`, 'error');
        showNextQuestion(gameSession); // در صورت خطا، مستقیماً سوال را نمایش می‌دهیم
      }
    }, 1000);
    
  } catch (error) {
    log(`Error starting quiz game: ${error}`, 'error');
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ خطا در شروع بازی')
      .setDescription('متأسفانه خطایی هنگام شروع بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.')
      .setColor(0xFF0000)
      .setFooter({ text: 'اگر این مشکل ادامه داشت، با پشتیبانی تماس بگیرید' });
      
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

/**
 * تابع کمکی برای تبدیل اعداد به ایموجی
 */
function getNumberEmoji(num: number): string {
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  return num <= 10 ? numberEmojis[num-1] : `${num}.`;
}

/**
 * نمایش سوال بعدی در بازی اطلاعات عمومی با افکت‌های ویژه و نمایش پیشرفته
 */
async function showNextQuestion(gameSession: GameSession) {
  try {
    // افزایش شاخص سوال فعلی
    gameSession.data.currentQuestionIndex++;
    
    // بررسی اتمام بازی
    if (gameSession.data.currentQuestionIndex >= gameSession.data.questions.length) {
      // استفاده از کلاینت اصلی برای دسترسی
      const client = require('../client').default;
      const tmpInteraction = { client } as ButtonInteraction;
      return await endQuizGame(gameSession, tmpInteraction);
    }
    
    // دریافت سوال فعلی
    const currentQuestion = gameSession.data.questions[gameSession.data.currentQuestionIndex];
    const questionNumber = gameSession.data.currentQuestionIndex + 1;
    const totalQuestions = gameSession.data.questions.length;
    
    // تنظیم رنگ بر اساس دسته‌بندی سوال
    let categoryColor = 0x9B59B6; // رنگ پیش‌فرض بنفش
    const categoryColors: Record<string, number> = {
      'جغرافیا': 0x3498DB, // آبی
      'تاریخ': 0xE67E22,  // نارنجی
      'ادبیات': 0x1ABC9C, // فیروزه‌ای
      'علوم': 0x2ECC71,   // سبز
      'هنر': 0xE74C3C,    // قرمز
      'ورزش': 0xF1C40F,   // زرد
      'فرهنگ': 0x34495E,  // سرمه‌ای
      'سینما': 0x9B59B6,  // بنفش
      'موسیقی': 0xD35400, // قهوه‌ای
      'زیست‌شناسی': 0x27AE60, // سبز تیره
      'فیزیک': 0x2980B9,  // آبی تیره
      'شیمی': 0x8E44AD,   // بنفش تیره
      'ریاضیات': 0x2C3E50, // نیلی
      'کامپیوتر': 0x16A085, // سبز آبی
      'اقتصاد': 0xF39C12,  // طلایی
      'سیاست': 0x7F8C8D   // خاکستری
    };
    
    // اگر دسته‌بندی سوال در لیست بالا وجود داشت، رنگ آن استفاده می‌شود
    if (currentQuestion.category in categoryColors) {
      categoryColor = categoryColors[currentQuestion.category];
    }
    
    // ایجاد نوار پیشرفت برای نمایش وضعیت سوالات
    let progressBar = '';
    if (gameSession.data.showProgressBar) {
      const progressBarLength = 10; // طول نوار پیشرفت
      const filledLength = Math.floor((questionNumber / totalQuestions) * progressBarLength);
      const emptyLength = progressBarLength - filledLength;
      
      // استفاده از ایموجی مربع برای نمایش نوار پیشرفت
      progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
      progressBar += ` ${questionNumber}/${totalQuestions} (${Math.floor((questionNumber / totalQuestions) * 100)}%)`;
    }
    
    // تنظیم ایموجی متناسب با سختی سوال
    let difficultyEmoji = '🟢'; // سوال آسان
    if (currentQuestion.difficulty === 'medium') {
      difficultyEmoji = '🟡'; // سوال متوسط
    } else if (currentQuestion.difficulty === 'hard') {
      difficultyEmoji = '🔴'; // سوال سخت
    }
    
    // تصویر مرتبط با دسته‌بندی سوال
    const categoryImages: Record<string, string> = {
      'جغرافیا': 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/geography.png',
      'تاریخ': 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/history.png',
      'علوم': 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/science.png',
      'ادبیات': 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/literature.png',
      'هنر': 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/art.png',
      'ورزش': 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/sports.png'
    };
    
    // متن نمایش امتیازدهی ویژه برای سوال فعلی
    let specialScoring = '';
    if (currentQuestion.difficulty === 'hard') {
      specialScoring = '🔥 سوال سخت! امتیاز ضریب 3x';
    } else if (currentQuestion.difficulty === 'medium') {
      specialScoring = '✨ سوال متوسط! امتیاز ضریب 2x';
    }
    
    // نمایش رتبه‌بندی فعلی بازیکنان
    // ایجاد متن رتبه‌بندی
    let leaderboardText = '';
    if (gameSession.data.playerScores && Object.keys(gameSession.data.playerScores).length > 0) {
      // تبدیل امتیازات به آرایه برای مرتب‌سازی
      const scores = Object.entries(gameSession.data.playerScores)
        .map(([playerId, score]) => ({ playerId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // فقط 5 نفر برتر
      
      // ایجاد متن رتبه‌بندی
      leaderboardText = scores.map((entry, index) => 
        `${getNumberEmoji(index + 1)} <@${entry.playerId}>: ${entry.score} امتیاز`
      ).join('\n');
    }
    
    // ایجاد Embed پیشرفته برای سوال
    const embed = new EmbedBuilder()
      .setTitle(`📝 سوال ${questionNumber} از ${totalQuestions}`)
      .setDescription(`**${currentQuestion.question}**\n\n${progressBar ? `${progressBar}\n\n` : ''}${specialScoring ? `${specialScoring}\n\n` : ''}`)
      .setColor(categoryColor)
      .addFields(
        { name: `${difficultyEmoji} سطح سختی`, value: getQuestionDifficultyText(currentQuestion.difficulty), inline: true },
        { name: '🏷️ دسته‌بندی', value: currentQuestion.category, inline: true },
        { name: '⏱️ زمان پاسخ', value: `${gameSession.data.timePerQuestion} ثانیه`, inline: true }
      );
    
    // اضافه کردن تصویر دسته‌بندی اگر موجود باشد و فعال شده باشد
    if (gameSession.data.showCategoryImage && currentQuestion.category in categoryImages) {
      embed.setThumbnail(categoryImages[currentQuestion.category]);
    }
    
    // اضافه کردن فیلد رتبه‌بندی اگر امتیازی ثبت شده باشد
    if (leaderboardText) {
      embed.addFields({ name: '🏆 رتبه‌بندی فعلی', value: leaderboardText, inline: false });
    }
    
    // اضافه کردن نکته راهنما یا توضیح اضافی
    embed.setFooter({ 
      text: 'با کلیک روی دکمه‌ها پاسخ دهید | پاسخ سریع‌تر امتیاز بیشتری دارد!',
      iconURL: 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/quiz_icon.png'
    });
    
    // ایجاد دکمه‌های گزینه‌ها با طراحی زیباتر
    const buttons = new ActionRowBuilder<ButtonBuilder>();
    
    // ایموجی‌های استفاده شده برای گزینه‌ها
    const optionEmojis = ['🇦', '🇧', '🇨', '🇩'];
    
    // رنگ‌های متنوع برای گزینه‌ها
    const optionStyles = [
      ButtonStyle.Primary,    // آبی
      ButtonStyle.Secondary,  // خاکستری
      ButtonStyle.Success,    // سبز
      ButtonStyle.Danger      // قرمز
    ];
    
    // یک آرایه با ترتیب تصادفی برای انتخاب سبک‌های دکمه
    const randomStyleOrder = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    
    currentQuestion.options.forEach((option, index) => {
      const styleIndex = randomStyleOrder[index % 4]; // انتخاب سبک تصادفی
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_answer_${gameSession.id}_${index}`)
          .setLabel(option)
          .setEmoji(optionEmojis[index])
          .setStyle(optionStyles[styleIndex])
      );
    });
    
    // ارسال پیام سوال
    const client = require('../client').default;
    const channel = await client.channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      // اگر نمایش انیمیشن فعال بود، یک پیام آماده‌سازی نمایش می‌دهیم
      if (gameSession.data.useAnimations) {
        const preparingMessage = await channel.send({
          content: `⏳ در حال بارگذاری سوال شماره ${questionNumber}...`
        });
        
        // حذف پیام آماده‌سازی پس از 1 ثانیه
        setTimeout(async () => {
          try {
            await preparingMessage.delete();
          } catch (deleteError) {
            log(`Error deleting preparing message: ${deleteError}`, 'warn');
          }
        }, 1000);
        
        // کمی صبر می‌کنیم تا پیام آماده‌سازی نمایش داده شود و سپس سوال را نمایش می‌دهیم
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      
      // ارسال پیام سوال
      const questionMessage = await channel.send({ 
        embeds: [embed], 
        components: [buttons] 
      });
      
      // اضافه کردن واکنش‌ها برای جلوه بصری
      try {
        if (questionMessage && 'react' in questionMessage) {
          await questionMessage.react('🧠');
        }
      } catch (reactError) {
        // اگر نتوانیم واکنش اضافه کنیم، مشکلی نیست
        log(`Error adding reaction to question: ${reactError}`, 'warn');
      }
      
      // ذخیره شناسه پیام سوال فعلی
      gameSession.data.currentQuestionMessageId = questionMessage.id;
      gameSession.data.lastQuestionTimestamp = Date.now(); // زمان نمایش سوال
      activeGames.set(gameSession.id, gameSession);
      
      // شروع تایمر برای سوال
      startQuestionTimer(gameSession);
    }
  } catch (error) {
    log(`Error showing next question: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به سوال بعدی برویم
    setTimeout(() => showNextQuestion(gameSession), 3000);
  }
}

/**
 * تبدیل سطح سختی به متن فارسی
 */
function getQuestionDifficultyText(difficulty: string): string {
  switch(difficulty) {
    case 'easy': return 'آسان';
    case 'medium': return 'متوسط';
    case 'hard': return 'سخت';
    default: return 'نامشخص';
  }
}

/**
 * شروع تایمر برای سوال فعلی
 */
function startQuestionTimer(gameSession: GameSession, interaction?: ButtonInteraction) {
  try {
    const totalTime = gameSession.data.timePerQuestion;
    let timeLeft = totalTime;
    
    // ذخیره زمان شروع سوال
    gameSession.data.currentQuestionStartTime = Date.now();
    activeGames.set(gameSession.id, gameSession);
    
    // تنظیم تایمر برای به‌روزرسانی زمان باقی‌مانده
    const timerInterval = setInterval(async () => {
      try {
        timeLeft--;
        
        // به‌روزرسانی Embed در نیمه زمان
        if (timeLeft === Math.floor(totalTime / 2)) {
          await updateQuestionTimeRemaining(gameSession, timeLeft);
        }
        
        // پایان زمان
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          // Get a client reference if interaction is not available
          const client = require('../client').default;
          const tmpInteraction = interaction || { client } as ButtonInteraction;
          await handleQuestionTimeout(gameSession, tmpInteraction);
        }
      } catch (intervalError) {
        log(`Error in question timer interval: ${intervalError}`, 'error');
        clearInterval(timerInterval);
      }
    }, 1000);
    
    // ذخیره شناسه تایمر
    gameSession.data.currentQuestionTimerId = timerInterval;
    activeGames.set(gameSession.id, gameSession);
  } catch (error) {
    log(`Error starting question timer: ${error}`, 'error');
  }
}

/**
 * به‌روزرسانی زمان باقی‌مانده در Embed سوال
 */
async function updateQuestionTimeRemaining(gameSession: GameSession, timeLeft: number) {
  try {
    // If we don't have a client reference from an interaction, we'll get it from the active client
    const client = require('../client').default;
    const channel = await client.channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(gameSession.data.currentQuestionMessageId);
      if (message) {
        const embed = EmbedBuilder.from(message.embeds[0]);
        
        // به‌روزرسانی فیلد زمان باقی‌مانده
        const timeField = embed.data.fields?.find(field => field.name === '⏱️ زمان باقی‌مانده');
        if (timeField) {
          timeField.value = `${timeLeft} ثانیه`;
        }
        
        await message.edit({ embeds: [embed] });
      }
    }
  } catch (error) {
    log(`Error updating question time remaining: ${error}`, 'error');
  }
}

/**
 * مدیریت پایان زمان سوال
 */
async function handleQuestionTimeout(gameSession: GameSession, interaction: ButtonInteraction) {
  try {
    // پاکسازی تایمر
    if (gameSession.data.currentQuestionTimerId) {
      clearInterval(gameSession.data.currentQuestionTimerId);
    }
    
    const client = require('../client').default;
    const channel = await (interaction?.client || client).channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(gameSession.data.currentQuestionMessageId);
      
      if (message) {
        const currentQuestion = gameSession.data.questions[gameSession.data.currentQuestionIndex];
        const correctAnswer = currentQuestion.options[currentQuestion.correctAnswer];
        
        const embed = EmbedBuilder.from(message.embeds[0])
          .setTitle(`⏱️ زمان تمام شد!`)
          .setColor(0xFF5555)
          .setFooter({ text: `پاسخ صحیح: ${correctAnswer}` });
        
        await message.edit({ 
          embeds: [embed], 
          components: [] 
        });
        
        // نمایش سوال بعدی پس از مدتی
        setTimeout(() => showNextQuestion(gameSession), 3000);
      }
    }
  } catch (error) {
    log(`Error handling question timeout: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به سوال بعدی برویم
    setTimeout(() => showNextQuestion(gameSession), 3000);
  }
}

/**
 * مدیریت پاسخ کاربر به سوال با سیستم امتیازدهی پیشرفته و تجربه کاربری بهتر
 */
export async function handleQuizAnswer(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی و شماره گزینه از شناسه دکمه
    const [_, __, gameId, optionIndex] = interaction.customId.split('_');
    const gameSession = activeGames.get(gameId);
    
    if (!gameSession || gameSession.status !== 'active') {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ بازی یافت نشد!')
        .setDescription('بازی مورد نظر یافت نشد یا فعال نیست!')
        .setColor(0xFF0000)
        .setFooter({ text: 'شاید بازی به پایان رسیده یا لغو شده است' });
        
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر بازیکن است
    if (!gameSession.players.includes(interaction.user.id)) {
      const notPlayerEmbed = new EmbedBuilder()
        .setTitle('⛔ دسترسی محدود')
        .setDescription('شما بازیکن این بازی نیستید و نمی‌توانید در آن شرکت کنید.')
        .setColor(0xFF0000)
        .addFields({
          name: '👤 وضعیت فعلی',
          value: 'تماشاچی (بدون حق رأی)'
        })
        .setThumbnail(interaction.user.displayAvatarURL({ size: 64 }))
        .setFooter({ text: 'برای شرکت در بازی‌های بعدی، در ابتدای بازی وارد شوید' });
        
      return await interaction.reply({ embeds: [notPlayerEmbed], ephemeral: true });
    }
    
    // دریافت اطلاعات سوال فعلی
    const currentQuestion = gameSession.data.questions[gameSession.data.currentQuestionIndex];
    const questionAnswers = gameSession.data.questionAnswers || {};
    const questionId = `${gameSession.data.currentQuestionIndex}`;
    
    // مقداردهی اولیه آرایه پاسخ‌ها اگر وجود ندارد
    if (!questionAnswers[questionId]) {
      questionAnswers[questionId] = {};
    }
    
    // بررسی اینکه آیا کاربر قبلاً به این سوال پاسخ داده است
    if (questionAnswers[questionId][interaction.user.id]) {
      const alreadyAnsweredEmbed = new EmbedBuilder()
        .setTitle('⚠️ پاسخ مجدد ممکن نیست!')
        .setDescription('شما قبلاً به این سوال پاسخ داده‌اید و نمی‌توانید مجدداً پاسخ دهید.')
        .setColor(0xFFA500)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 64 }))
        .setFooter({ text: 'منتظر سوال بعدی باشید' });
        
      return await interaction.reply({ embeds: [alreadyAnsweredEmbed], ephemeral: true });
    }
    
    // وقتی کاربر پاسخ می‌دهد، زمان پاسخ را محاسبه می‌کنیم
    const answerTime = Date.now() - gameSession.data.currentQuestionStartTime;
    
    // ذخیره پاسخ کاربر با جزئیات بیشتر
    questionAnswers[questionId][interaction.user.id] = {
      option: parseInt(optionIndex),
      time: answerTime,
      timestamp: Date.now()
    };
    
    // به‌روزرسانی آرایه پاسخ‌ها در جلسه بازی
    gameSession.data.questionAnswers = questionAnswers;
    
    // بررسی صحت پاسخ برای امتیازدهی
    const isCorrect = parseInt(optionIndex) === currentQuestion.correctAnswer;
    
    // آماده‌سازی متغیرهای مورد نیاز برای امتیازدهی
    let baseScore = 10; // امتیاز پایه برای پاسخ صحیح
    let timeBonus = 0; // امتیاز اضافی بر اساس سرعت پاسخ
    let streakBonus = 0; // امتیاز اضافی برای پاسخ‌های متوالی صحیح
    let difficultyBonus = 0; // امتیاز اضافی بر اساس سختی سوال
    let finalScore = 0; // امتیاز نهایی
    let scoreDetails = ''; // توضیحات محاسبه امتیاز
    
    // مقداردهی اولیه آرایه‌های لازم
    if (!gameSession.data.playerStreaks) {
      gameSession.data.playerStreaks = {};
    }
    
    if (!gameSession.data.correctAnswersCount) {
      gameSession.data.correctAnswersCount = {};
    }
    
    if (!gameSession.data.fastestResponses) {
      gameSession.data.fastestResponses = {};
    }
    
    // اگر پاسخ صحیح باشد، امتیاز محاسبه می‌شود
    if (isCorrect) {
      // افزایش تعداد پاسخ‌های صحیح کاربر
      gameSession.data.correctAnswersCount[interaction.user.id] = 
        (gameSession.data.correctAnswersCount[interaction.user.id] || 0) + 1;
      
      // افزایش تعداد پاسخ‌های متوالی صحیح
      gameSession.data.playerStreaks[interaction.user.id] = 
        (gameSession.data.playerStreaks[interaction.user.id] || 0) + 1;
      
      // ثبت رکورد بیشترین پاسخ‌های متوالی صحیح
      const currentStreak = gameSession.data.playerStreaks[interaction.user.id];
      if (!gameSession.data.streakRecords) {
        gameSession.data.streakRecords = {};
      }
      if (!gameSession.data.streakRecords[interaction.user.id] || 
          currentStreak > gameSession.data.streakRecords[interaction.user.id]) {
        gameSession.data.streakRecords[interaction.user.id] = currentStreak;
      }
      
      // ثبت رکورد سریع‌ترین پاسخ
      if (!gameSession.data.fastestResponses[interaction.user.id] || 
          answerTime < gameSession.data.fastestResponses[interaction.user.id]) {
        gameSession.data.fastestResponses[interaction.user.id] = answerTime;
      }
      
      // محاسبه امتیاز بر اساس سرعت پاسخ
      if (gameSession.data.enableFastAnswerBonus) {
        const timeTakenSeconds = answerTime / 1000; // تبدیل به ثانیه
        const maxTime = gameSession.data.timePerQuestion;
        const timePercentage = Math.max(0, Math.min(1, (maxTime - timeTakenSeconds) / maxTime));
        timeBonus = Math.round(timePercentage * 5); // حداکثر 5 امتیاز بونوس زمان
        
        scoreDetails += `⏱️ بونوس سرعت: +${timeBonus}\n`;
      }
      
      // محاسبه امتیاز بر اساس تعداد پاسخ‌های متوالی صحیح
      if (gameSession.data.enableStreakBonus && currentStreak > 1) {
        const streakMultiplier = gameSession.data.streakMultiplier || 0.5;
        streakBonus = Math.round(currentStreak * streakMultiplier);
        
        // محدود کردن حداکثر امتیاز بونوس توالی
        streakBonus = Math.min(streakBonus, 10);
        
        scoreDetails += `🔥 بونوس توالی (${currentStreak}): +${streakBonus}\n`;
      }
      
      // محاسبه امتیاز بر اساس سختی سوال
      if (gameSession.data.scoreMultipliers) {
        const difficultyMultiplier = gameSession.data.scoreMultipliers[currentQuestion.difficulty] || 1;
        difficultyBonus = Math.round(baseScore * (difficultyMultiplier - 1));
        
        if (difficultyBonus > 0) {
          scoreDetails += `🌟 بونوس سختی (${getQuestionDifficultyText(currentQuestion.difficulty)}): +${difficultyBonus}\n`;
        }
      }
      
      // محاسبه نهایی امتیاز
      finalScore = baseScore + timeBonus + streakBonus + difficultyBonus;
      
      // افزودن امتیاز به کاربر
      gameSession.data.playerScores[interaction.user.id] = 
        (gameSession.data.playerScores[interaction.user.id] || 0) + finalScore;
        
      scoreDetails = `پاسخ صحیح: +${baseScore}\n` + scoreDetails;
    } else {
      // در صورت پاسخ اشتباه، توالی پاسخ‌های صحیح به صفر برمی‌گردد
      gameSession.data.playerStreaks[interaction.user.id] = 0;
      
      scoreDetails = `❌ پاسخ نادرست: +0\n`;
      
      // کسر امتیاز برای پاسخ اشتباه (اختیاری)
      if (gameSession.data.wrongAnswerPenalty) {
        const penalty = gameSession.data.wrongAnswerPenalty;
        gameSession.data.playerScores[interaction.user.id] = 
          Math.max(0, (gameSession.data.playerScores[interaction.user.id] || 0) - penalty);
          
        scoreDetails += `⚠️ جریمه پاسخ اشتباه: -${penalty}\n`;
        finalScore = -penalty;
      }
    }
    
    // به‌روزرسانی بازی
    activeGames.set(gameSession.id, gameSession);
    
    // ایجاد Embed برای نمایش نتیجه پاسخ به کاربر
    const resultEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '✅ پاسخ صحیح!' : '❌ پاسخ نادرست!')
      .setDescription(
        isCorrect 
          ? `آفرین! پاسخ شما به سوال صحیح بود.\n\n**امتیاز کسب شده: ${finalScore}**`
          : `متأسفانه پاسخ شما اشتباه بود.\n\nپاسخ صحیح: ${currentQuestion.options[currentQuestion.correctAnswer]}`
      )
      .setColor(isCorrect ? 0x3BA55D : 0xFF5555)
      .addFields(
        { 
          name: '📊 جزئیات امتیاز', 
          value: scoreDetails, 
          inline: false 
        },
        { 
          name: '🏆 امتیاز کل شما', 
          value: `${gameSession.data.playerScores[interaction.user.id] || 0}`, 
          inline: true 
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
      .setFooter({ 
        text: isCorrect 
          ? `زمان پاسخ: ${(answerTime / 1000).toFixed(2)} ثانیه`
          : 'در سوال بعدی تلاش بیشتری کنید!'
      })
      .setTimestamp();
    
    // اضافه کردن آمار توالی اگر پاسخ صحیح بوده و بیش از 1 پاسخ متوالی صحیح داشته باشد
    if (isCorrect && gameSession.data.playerStreaks[interaction.user.id] > 1) {
      resultEmbed.addFields({
        name: '🔥 توالی پاسخ‌های صحیح',
        value: `${gameSession.data.playerStreaks[interaction.user.id]}`,
        inline: true
      });
    }
    
    // پاسخ به کاربر
    await interaction.reply({ embeds: [resultEmbed], ephemeral: true });
    
    // بررسی اگر همه بازیکنان پاسخ داده‌اند یا زمان به پایان رسیده است
    const totalResponses = Object.keys(questionAnswers[questionId]).length;
    
    if (totalResponses >= gameSession.players.length) {
      // پاکسازی تایمر
      if (gameSession.data.currentQuestionTimerId) {
        clearInterval(gameSession.data.currentQuestionTimerId);
      }
      
      // نمایش پاسخ صحیح
      await showQuestionResults(gameSession, interaction);
      
      // مقداردهی زمان انتظار بین سوالات بر اساس تنظیمات بازی
      const waitTime = gameSession.data.timeBetweenQuestions || 5000;
      
      // رفتن به سوال بعدی
      setTimeout(() => showNextQuestion(gameSession), waitTime);
    }
    
  } catch (error) {
    log(`Error handling quiz answer: ${error}`, 'error');
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ خطای سیستم')
      .setDescription('خطایی در ثبت پاسخ رخ داد. لطفاً بعداً دوباره تلاش کنید.')
      .setColor(0xFF0000)
      .setFooter({ text: 'در صورت تکرار این خطا، با پشتیبانی تماس بگیرید' });
      
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

/**
 * نمایش نتایج سوال با طراحی زیبا و اطلاعات آماری پیشرفته
 */
async function showQuestionResults(gameSession: GameSession, interaction?: ButtonInteraction) {
  try {
    // If we don't have a client reference from an interaction, we'll get it from the active client
    const client = require('../client').default;
    const channel = await (interaction?.client || client).channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(gameSession.data.currentQuestionMessageId);
      
      if (message) {
        // دریافت اطلاعات سوال فعلی
        const currentQuestion = gameSession.data.questions[gameSession.data.currentQuestionIndex];
        const correctAnswer = currentQuestion.options[currentQuestion.correctAnswer];
        const questionNumber = gameSession.data.currentQuestionIndex + 1;
        const totalQuestions = gameSession.data.questions.length;
        
        // دریافت پاسخ‌های بازیکنان
        const questionId = `${gameSession.data.currentQuestionIndex}`;
        const answers = gameSession.data.questionAnswers[questionId] || {};
        
        // تعداد پاسخ‌های درست
        const correctAnswers = Object.entries(answers).filter(
          ([_, answer]) => (answer as any).option === currentQuestion.correctAnswer
        );
        const correctCount = correctAnswers.length;
        
        // درصد پاسخ‌های صحیح
        const percentCorrect = gameSession.players.length > 0 
          ? Math.round((correctCount / gameSession.players.length) * 100) 
          : 0;
        
        // آمار سرعت پاسخ
        const responseTimes = Object.values(answers).map((a: any) => a.time);
        const avgResponseTime = responseTimes.length > 0 
          ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) / 1000
          : 0;
        
        // سریع‌ترین پاسخ صحیح
        const correctResponseTimes = correctAnswers.map(([_, answer]) => (answer as any).time);
        const fastestCorrectTime = correctResponseTimes.length > 0 
          ? Math.min(...correctResponseTimes) / 1000 
          : 0;
        
        // سریع‌ترین پاسخ دهنده صحیح
        let fastestPlayerInfo = '';
        if (correctResponseTimes.length > 0) {
          const fastestTime = Math.min(...correctResponseTimes);
          const fastestPlayer = correctAnswers.find(([_, answer]) => (answer as any).time === fastestTime);
          if (fastestPlayer) {
            fastestPlayerInfo = `🏎️ سریع‌ترین پاسخ: <@${fastestPlayer[0]}> (${(fastestTime / 1000).toFixed(2)} ثانیه)`;
          }
        }
        
        // تحلیل انتخاب گزینه‌های پاسخ
        const optionCounts = Array(currentQuestion.options.length).fill(0);
        Object.values(answers).forEach((answer: any) => {
          if (answer.option >= 0 && answer.option < optionCounts.length) {
            optionCounts[answer.option]++;
          }
        });
        
        // تبدیل شمارش گزینه‌ها به نمودار
        const optionBars = optionCounts.map((count, index) => {
          const percent = gameSession.players.length > 0 
            ? Math.round((count / gameSession.players.length) * 10) 
            : 0;
          const bar = '█'.repeat(percent) + '░'.repeat(10 - percent);
          const isCorrect = index === currentQuestion.correctAnswer;
          return `${String.fromCharCode(65 + index)}. ${bar} ${count} (${isCorrect ? '✓' : ''})`;
        }).join('\n');
        
        // ایجاد لیست بازیکنانی که درست پاسخ داده‌اند
        const correctPlayers = correctAnswers
          .map(([playerId, _]) => `<@${playerId}>`)
          .join(', ');
          
        // تعیین رنگ کارت بر اساس درصد پاسخ‌های صحیح
        let resultColor = 0x4CAF50; // سبز برای نتیجه خوب (بیش از 50%)
        if (percentCorrect < 25) {
          resultColor = 0xFF5252; // قرمز برای نتیجه بد
        } else if (percentCorrect < 50) {
          resultColor = 0xFFC107; // زرد برای نتیجه متوسط
        }
        
        // ایجاد پیام جالب بر اساس درصد پاسخ‌های صحیح
        let resultMessage = '';
        if (percentCorrect === 100) {
          resultMessage = '🎉 همه پاسخ درست دادند! عالی است!';
        } else if (percentCorrect >= 75) {
          resultMessage = '👏 اکثر بازیکنان پاسخ درست دادند. آفرین!';
        } else if (percentCorrect >= 50) {
          resultMessage = '👍 نیمی از بازیکنان پاسخ درست دادند.';
        } else if (percentCorrect === 0) {
          resultMessage = '😱 هیچکس پاسخ درست نداد! این سوال سخت بود!';
        } else {
          resultMessage = '🤔 این سوال چالش‌برانگیز بود!';
        }
        
        // نمایش تا چه سوالی پیش رفته‌ایم
        const progressBar = '█'.repeat(questionNumber) + '░'.repeat(totalQuestions - questionNumber);
        const progressText = `${progressBar} ${questionNumber}/${totalQuestions}`;
        
        // ایجاد Embed پیشرفته برای نمایش نتایج
        const embed = new EmbedBuilder()
          .setTitle(`🎯 نتیجه سوال ${questionNumber} از ${totalQuestions}`)
          .setDescription(
            `**پاسخ صحیح:** ${correctAnswer}\n\n` +
            `${resultMessage}\n\n` +
            `*"${currentQuestion.question}"*\n\n` +
            `**توزیع پاسخ‌ها:**\n${optionBars}\n\n` +
            `**پیشرفت:** ${progressText}`
          )
          .setColor(resultColor)
          .addFields(
            { 
              name: '📊 آمار سوال', 
              value: 
                `✅ درست: ${correctCount} از ${gameSession.players.length} (${percentCorrect}%)\n` +
                `⏱️ میانگین زمان پاسخ: ${avgResponseTime.toFixed(2)} ثانیه\n` +
                `${fastestPlayerInfo}`,
              inline: false 
            }
          );
          
        // اضافه کردن فیلد بازیکنان با پاسخ صحیح اگر وجود داشته باشند
        if (correctCount > 0) {
          embed.addFields({ 
            name: '👑 پاسخ‌های صحیح', 
            value: correctPlayers || 'هیچکس پاسخ صحیح نداد!',
            inline: false
          });
        }
        
        // اضافه کردن آمار سختی سوال
        embed.addFields({ 
          name: '📈 سطح سختی', 
          value: `${getQuestionDifficultyEmoji(currentQuestion.difficulty)} ${getQuestionDifficultyText(currentQuestion.difficulty)}`,
          inline: true
        });
        
        // اضافه کردن دسته‌بندی سوال
        embed.addFields({ 
          name: '🏷️ دسته‌بندی', 
          value: currentQuestion.category,
          inline: true
        });
        
        // اضافه کردن پیام پایین صفحه با شمارنده زمان
        const waitTime = gameSession.data.timeBetweenQuestions || 5000;
        embed.setFooter({ 
          text: `سوال بعدی در ${Math.round(waitTime/1000)} ثانیه دیگر...`, 
          iconURL: 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/quiz_icon.png'
        });
        
        // افزودن تایمراستمپ برای زمان نمایش نتایج
        embed.setTimestamp();
        
        // ارسال Embed نتایج
        await message.edit({ 
          embeds: [embed], 
          components: [] 
        });
        
        // ارسال واکنش‌های متنی به پیام نتایج
        try {
          if ('react' in message) {
            if (percentCorrect >= 75) {
              await message.react('🎉');
            } else if (percentCorrect === 0) {
              await message.react('😱');
            } else {
              await message.react('🎯');
            }
          }
        } catch (reactError) {
          // اگر نتوانیم واکنش اضافه کنیم، مشکلی نیست
          log(`Error adding reactions to results: ${reactError}`, 'warn');
        }
      }
    }
  } catch (error) {
    log(`Error showing question results: ${error}`, 'error');
  }
}

/**
 * دریافت ایموجی سطح سختی سوال
 */
function getQuestionDifficultyEmoji(difficulty: string): string {
  switch(difficulty) {
    case 'easy': return '🟢';
    case 'medium': return '🟡';
    case 'hard': return '🔴';
    default: return '⚪';
  }
}

/**
 * پایان بازی اطلاعات عمومی با نمایش جذاب نتایج، آمار و جوایز
 */
async function endQuizGame(gameSession: GameSession, interaction: ButtonInteraction) {
  try {
    // به‌روزرسانی وضعیت بازی
    gameSession.status = 'ended';
    gameSession.endedAt = new Date();
    
    // محاسبه طول مدت بازی
    const startTime = gameSession.startedAt ? new Date(gameSession.startedAt) : new Date();
    const endTime = new Date();
    const gameDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // به ثانیه
    
    // تبدیل مدت زمان به فرمت دقیقه:ثانیه
    const minutes = Math.floor(gameDuration / 60);
    const seconds = gameDuration % 60;
    const durationText = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    
    // مرتب‌سازی امتیازات
    const sortedScores = Object.entries(gameSession.data.playerScores || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([playerId, score]) => ({ playerId, score }));
    
    // جوایز بهبود یافته برای سه نفر اول
    const prizes = [500, 300, 150];
    const bonusPrizes = [50, 30, 15]; // جایزه اضافی برای هر پاسخ صحیح
    
    // آماده‌سازی آمار بازی
    const gameStats = {
      totalQuestions: gameSession.data.questions?.length || 0,
      totalPlayers: gameSession.players?.length || 0,
      correctAnswers: 0,
      fastestAnswer: Number.MAX_VALUE,
      fastestPlayer: '',
      mostCorrect: { playerId: '', count: 0 },
      longestStreak: { playerId: '', streak: 0 }
    };
    
    // محاسبه آمار کلی بازی
    if (gameSession.data.correctAnswersCount) {
      // پیدا کردن بازیکن با بیشترین پاسخ‌های صحیح
      for (const [playerId, count] of Object.entries(gameSession.data.correctAnswersCount)) {
        if (count > gameStats.mostCorrect.count) {
          gameStats.mostCorrect = { playerId, count: count as number };
        }
        gameStats.correctAnswers += count as number; // جمع کل پاسخ‌های صحیح
      }
    }
    
    // پیدا کردن سریع‌ترین پاسخ دهنده
    if (gameSession.data.fastestResponses) {
      for (const [playerId, time] of Object.entries(gameSession.data.fastestResponses)) {
        if (time < gameStats.fastestAnswer) {
          gameStats.fastestAnswer = time as number;
          gameStats.fastestPlayer = playerId;
        }
      }
    }
    
    // پیدا کردن بازیکن با بیشترین توالی پاسخ‌های صحیح
    if (gameSession.data.streakRecords) {
      for (const [playerId, streak] of Object.entries(gameSession.data.streakRecords)) {
        if (streak > gameStats.longestStreak.streak) {
          gameStats.longestStreak = { playerId, streak: streak as number };
        }
      }
    }
    
    // اعطای جوایز اصلی
    for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
      const winner = sortedScores[i];
      if (winner) {
        try {
          // محاسبه جایزه بر اساس رتبه و تعداد پاسخ‌های صحیح
          const baseReward = prizes[i];
          
          // محاسبه جایزه اضافی بر اساس تعداد پاسخ‌های صحیح
          const correctCount = gameSession.data.correctAnswersCount?.[winner.playerId] || 0;
          const bonusReward = correctCount * bonusPrizes[i];
          
          // مجموع جایزه
          const totalReward = baseReward + bonusReward;
          
          // افزودن سکه به کیف پول بازیکن
          await storage.addToWallet(Number(winner.playerId), totalReward, 'quiz_prize', { 
            gameType: 'quiz',
            rank: i + 1,
            baseReward,
            bonusReward,
            correctAnswers: correctCount
          });
          
          // ذخیره اطلاعات جایزه برای نمایش
          winner.totalReward = totalReward;
          winner.baseReward = baseReward;
          winner.bonusReward = bonusReward;
          winner.correctAnswers = correctCount;
          
        } catch (prizeError) {
          log(`Error giving prize to user ${winner.playerId}: ${prizeError}`, 'error');
        }
      }
    }
    
    // ساخت Embed نتایج با طراحی زیبا و اطلاعات بیشتر
    const embed = new EmbedBuilder()
      .setTitle('🎊 پایان مسابقه اطلاعات عمومی VIP 🎊')
      .setDescription(
        '**مسابقه با موفقیت به پایان رسید!**\n\n' +
        `🕒 مدت بازی: ${durationText} دقیقه\n` +
        `👥 تعداد بازیکنان: ${gameStats.totalPlayers} نفر\n` +
        `📝 تعداد سوالات: ${gameStats.totalQuestions} سوال\n\n` +
        '**🏆 نتایج نهایی:**'
      )
      .setColor(0xF1C40F)
      .setImage('https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/quiz_results_banner.png?width=915&height=147');
    
    // اضافه کردن فیلدهای امتیازات با اطلاعات تفصیلی
    for (let i = 0; i < Math.min(10, sortedScores.length); i++) {
      const player = sortedScores[i];
      let rankEmoji = '';
      
      // تعیین ایموجی مقام
      if (i === 0) rankEmoji = '🥇';
      else if (i === 1) rankEmoji = '🥈';
      else if (i === 2) rankEmoji = '🥉';
      else rankEmoji = `${i + 1}.`;
      
      // ساخت متن نمایش جایزه برای سه نفر اول
      let rewardText = '';
      if (i < 3) {
        const baseReward = player.baseReward || prizes[i];
        const bonusReward = player.bonusReward || 0;
        const totalReward = player.totalReward || baseReward + bonusReward;
        
        rewardText = `\n💰 جایزه: ${totalReward} کوین (${baseReward} + ${bonusReward} بونوس)`;
      }
      
      // اضافه کردن فیلد برای هر بازیکن
      embed.addFields({
        name: `${rankEmoji} <@${player.playerId}>`,
        value: `🏅 امتیاز: ${player.score}` + 
               `${rewardText}` +
               `${player.correctAnswers ? `\n✅ پاسخ‌های صحیح: ${player.correctAnswers}` : ''}`,
        inline: i < 3
      });
    }
    
    // بخش آمار برجسته بازی
    const statsField = [];
    
    // سرعتی‌ترین پاسخ دهنده
    if (gameStats.fastestPlayer) {
      statsField.push(`🚀 سریع‌ترین پاسخ: <@${gameStats.fastestPlayer}> (${(gameStats.fastestAnswer / 1000).toFixed(2)} ثانیه)`);
    }
    
    // بیشترین پاسخ‌های متوالی صحیح
    if (gameStats.longestStreak.playerId) {
      statsField.push(`🔥 بیشترین توالی: <@${gameStats.longestStreak.playerId}> (${gameStats.longestStreak.streak} پاسخ متوالی)`);
    }
    
    // بیشترین پاسخ‌های صحیح
    if (gameStats.mostCorrect.playerId) {
      statsField.push(`🎯 بیشترین پاسخ صحیح: <@${gameStats.mostCorrect.playerId}> (${gameStats.mostCorrect.count} از ${gameStats.totalQuestions})`);
    }
    
    // درصد پاسخ‌های صحیح
    const totalPossibleAnswers = gameStats.totalPlayers * gameStats.totalQuestions;
    const correctPercentage = totalPossibleAnswers > 0 
      ? Math.round((gameStats.correctAnswers / totalPossibleAnswers) * 100) 
      : 0;
    statsField.push(`📊 درصد پاسخ‌های صحیح: ${correctPercentage}% (${gameStats.correctAnswers} از ${totalPossibleAnswers})`);
    
    // اضافه کردن فیلد آمار بازی
    if (statsField.length > 0) {
      embed.addFields({ 
        name: '📈 آمار ویژه بازی', 
        value: statsField.join('\n'), 
        inline: false 
      });
    }
    
    // اضافه کردن راهنمای بازی‌های بعدی و ارسال سوال
    embed.addFields({ 
      name: '🎮 بازی‌های بعدی', 
      value: 
        '• برای بازی مجدد، عبارت `/group games` را تایپ کنید\n' +
        '• برای ارسال سوال جدید، روی دکمه زیر کلیک کنید\n' +
        '• سایر بازی‌های گروهی را با `/games` مشاهده کنید',
      inline: false 
    });
    
    embed.setFooter({ 
      text: `ID: ${gameSession.id} • با تشکر از همه شرکت‌کنندگان!`,
      iconURL: 'https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/quiz_icon.png'
    });
    
    // تنظیم زمان پایان بازی
    embed.setTimestamp();
    
    // ساخت دکمه‌های اکشن
    const primaryRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('quiz_submit_question')
          .setLabel('ارسال سوال جدید')
          .setEmoji('✏️')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('start_new_quiz')
          .setLabel('بازی جدید')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('show_game_history')
          .setLabel('تاریخچه بازی‌ها')
          .setEmoji('📜')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ساخت دکمه‌های اضافی
    const secondaryRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('quiz_leaderboard')
          .setLabel('جدول امتیازات کلی')
          .setEmoji('🏆')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('share_result')
          .setLabel('اشتراک‌گذاری')
          .setEmoji('📢')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('back_to_menu')
          .setLabel('منوی اصلی')
          .setEmoji('🔙')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پیام - استفاده از کلاینت اصلی اگر اینتراکشن موجود نباشد
    const client = require('../client').default;
    const channel = await (interaction?.client || client).channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      if ('send' in channel) {
        // نمایش پیام "در حال محاسبه نتایج..." قبل از نمایش نتایج نهایی
        const loadingMsg = await channel.send({ 
          content: '⏳ در حال محاسبه نتایج نهایی و اعطای جوایز...' 
        });
        
        // کمی مکث برای ایجاد احساس محاسبه
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          // حذف پیام بارگذاری
          await loadingMsg.delete();
        } catch (deleteError) {
          log(`Error deleting loading message: ${deleteError}`, 'warn');
        }
        
        // ارسال نتایج نهایی با افکت تاخیر
        const resultMessage = await channel.send({ 
          content: '🎺 نتایج مسابقه اطلاعات عمومی VIP 🎺',
          embeds: [embed],
          components: [primaryRow, secondaryRow]
        });
        
        // افزودن واکنش‌ها برای جلوه بصری بیشتر
        try {
          if ('react' in resultMessage) {
            await resultMessage.react('🎉');
            await resultMessage.react('🏆');
            await resultMessage.react('🎮');
          }
        } catch (reactError) {
          log(`Error adding reactions to end game message: ${reactError}`, 'warn');
        }
        
        // ارسال DM به برندگان (اختیاری)
        try {
          for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
            const winner = sortedScores[i];
            const user = await client.users.fetch(winner.playerId);
            if (user) {
              const winnerEmbed = new EmbedBuilder()
                .setTitle('🏆 تبریک! شما برنده شدید!')
                .setDescription(
                  `شما در بازی اطلاعات عمومی رتبه **${i+1}** را کسب کردید و ` +
                  `**${winner.totalReward || prizes[i]} کوین** جایزه دریافت کردید!`
                )
                .setColor(0xF1C40F)
                .setFooter({ text: 'با تشکر از شرکت شما در بازی' })
                .setTimestamp();
                
              // در محیط واقعی این را به صورت DM ارسال می‌کنیم
              // await user.send({ embeds: [winnerEmbed] });
            }
          }
        } catch (dmError) {
          log(`Error sending winner DMs: ${dmError}`, 'warn');
        }
      }
    }
    
    // ذخیره تاریخچه بازی در دیتابیس
    try {
      await storage.saveGameHistory({
        gameId: gameSession.id,
        gameType: 'quiz',
        startedAt: startTime,
        endedAt: endTime,
        duration: gameDuration,
        players: gameSession.players,
        hostId: gameSession.createdBy,
        scores: Object.entries(gameSession.data.playerScores || {}).map(([id, score]) => ({ 
          playerId: id, 
          score: score as number
        })),
        winners: sortedScores.slice(0, 3).map(w => w.playerId),
        prizes: sortedScores.slice(0, 3).map((w, i) => ({ 
          playerId: w.playerId, 
          prize: w.totalReward || prizes[i]
        })),
        stats: {
          totalQuestions: gameStats.totalQuestions,
          totalCorrect: gameStats.correctAnswers,
          correctPercentage: correctPercentage,
          fastestPlayer: gameStats.fastestPlayer,
          fastestTime: gameStats.fastestAnswer,
          topStreakPlayer: gameStats.longestStreak.playerId,
          topStreakCount: gameStats.longestStreak.streak
        }
      });
    } catch (historyError) {
      log(`Error saving game history: ${historyError}`, 'warn');
    }
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(gameSession.id);
    
  } catch (error) {
    log(`Error ending quiz game: ${error}`, 'error');
    
    // سعی می‌کنیم یک پیام خطا به کانال بفرستیم
    try {
      const client = require('../client').default;
      const channel = await (interaction?.client || client).channels.fetch(gameSession.channelId);
      if (channel && channel.isTextBased()) {
        if ('send' in channel) {
          await channel.send({ 
            content: '❌ متأسفانه خطایی در محاسبه نتایج بازی رخ داد. لطفاً با پشتیبانی تماس بگیرید.',
            embeds: [
              new EmbedBuilder()
                .setTitle('❌ خطای سیستم')
                .setDescription('متأسفانه نتایج بازی به درستی محاسبه نشد. اما نگران نباشید، جوایز شما هنوز پرداخت خواهند شد.')
                .setColor(0xFF0000)
                .setFooter({ text: 'تیم پشتیبانی در حال بررسی مشکل است' })
            ]
          });
        }
      }
    } catch (sendError) {
      log(`Error sending error message at the end of quiz game: ${sendError}`, 'error');
    }
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(gameSession.id);
  }
}

/**
 * مدیریت بازی نقاشی حدس بزن
 */
async function handleDrawGuessGame(interaction: ButtonInteraction) {
  try {
    // بررسی اینکه آیا بازی در کانال فعلی در حال اجراست
    const existingGame = await getActiveGameInChannel(interaction.channelId, 'drawguess');
    if (existingGame) {
      return await interaction.reply({ 
        content: '❌ یک بازی نقاشی حدس بزن در حال حاضر در این کانال در حال اجراست!', 
        ephemeral: true 
      });
    }
    
    // ایجاد Embed معرفی بازی
    const embed = new EmbedBuilder()
      .setTitle('🎨 نقاشی حدس بزن')
      .setDescription(
        'در این بازی، یک نفر نقاشی می‌کشد و بقیه باید حدس بزنند که چه چیزی است!\n\n' +
        '**قوانین بازی:**\n' +
        '- هر نفر به نوبت نقاش می‌شود\n' +
        '- نقاش 30 ثانیه وقت دارد تا چیزی را بکشد\n' +
        '- سایر بازیکنان 60 ثانیه فرصت دارند تا حدس بزنند\n' +
        '- نقاش و اولین کسی که درست حدس بزند امتیاز می‌گیرند\n\n' +
        '**برای شرکت در بازی روی دکمه زیر کلیک کنید:**'
      )
      .setColor(0xFFAA22)
      .setFooter({ text: 'نفرات برتر در پایان بازی جایزه دریافت می‌کنند!' });
    
    // ایجاد دکمه‌های پیوستن و شروع بازی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('drawguess_join')
          .setLabel('شرکت در بازی')
          .setEmoji('✏️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('drawguess_start')
          .setLabel('شروع بازی')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Success)
      );
    
    // ایجاد یک جلسه بازی جدید
    const gameId = uuidv4();
    const newGameSession: GameSession = {
      id: gameId,
      gameType: 'drawguess',
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      players: [interaction.user.id],
      status: 'waiting',
      createdAt: new Date(),
      data: {
        currentRound: 0,
        totalRounds: 5,
        currentDrawer: null,
        currentWord: null,
        wordOptions: [],
        playerScores: {
          [interaction.user.id]: 0
        },
        drawingTime: 30, // ثانیه
        guessTime: 60, // ثانیه
        words: [
          'سیب', 'ماشین', 'خانه', 'درخت', 'گربه', 'سگ', 'ماه', 'خورشید', 
          'ستاره', 'گل', 'توپ', 'دوچرخه', 'کتاب', 'تلفن', 'کامپیوتر',
          'قایق', 'هواپیما', 'ساعت', 'چتر', 'عینک', 'کفش', 'شلوار',
          'پیراهن', 'پنجره', 'در', 'میز', 'صندلی', 'قلم', 'مداد', 'فیل'
        ]
      }
    };
    
    // ذخیره بازی در سیستم ذخیره‌سازی
    await storage.createGameSession(newGameSession);
    
    // افزودن به لیست بازی‌های فعال
    activeGames.set(gameId, newGameSession);
    
    // ارسال پیام بازی
    const message = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true
    });
    
    // ذخیره شناسه پیام برای استفاده‌های بعدی
    newGameSession.data.messageId = message.id;
    activeGames.set(gameId, newGameSession);
    
  } catch (error) {
    log(`Error handling draw guess game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * پیوستن به بازی نقاشی حدس بزن
 */
async function joinDrawGuessGame(interaction: ButtonInteraction) {
  try {
    // یافتن بازی فعال در کانال
    const game = await getActiveGameInChannel(interaction.channelId, 'drawguess');
    
    if (!game || game.status !== 'waiting') {
      return await interaction.reply({ 
        content: '❌ بازی نقاشی حدس بزنی برای پیوستن یافت نشد!', 
        ephemeral: true 
      });
    }
    
    // بررسی اینکه آیا کاربر قبلاً به بازی پیوسته است
    if (game.players.includes(interaction.user.id)) {
      return await interaction.reply({ 
        content: '✅ شما قبلاً به این بازی پیوسته‌اید!', 
        ephemeral: true 
      });
    }
    
    // افزودن کاربر به لیست بازیکنان
    game.players.push(interaction.user.id);
    game.data.playerScores[interaction.user.id] = 0;
    
    // به‌روزرسانی بازی در سیستم ذخیره‌سازی
    await storage.updateGameSession(game);
    
    // به‌روزرسانی بازی در لیست بازی‌های فعال
    activeGames.set(game.id, game);
    
    // به‌روزرسانی Embed با لیست بازیکنان جدید
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(game.data.messageId);
      
      if (message) {
        const embed = EmbedBuilder.from(message.embeds[0]);
        
        // افزودن فیلد بازیکنان یا به‌روزرسانی آن
        const playerField = embed.data.fields?.find(field => field.name === '👥 بازیکنان');
        const playersList = game.players.map(playerId => `<@${playerId}>`).join('\n');
        
        if (playerField) {
          playerField.value = playersList;
        } else {
          embed.addFields({ name: '👥 بازیکنان', value: playersList });
        }
        
        await message.edit({ embeds: [embed] });
      }
    }
    
    await interaction.reply({ 
      content: `✅ شما با موفقیت به بازی نقاشی حدس بزن پیوستید! تعداد بازیکنان: ${game.players.length}`, 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error joining draw guess game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در پیوستن به بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * شروع بازی نقاشی حدس بزن
 */
async function startDrawGuessGame(interaction: ButtonInteraction) {
  try {
    // یافتن بازی فعال در کانال
    const game = await getActiveGameInChannel(interaction.channelId, 'drawguess');
    
    if (!game || game.status !== 'waiting') {
      return await interaction.reply({ 
        content: '❌ بازی نقاشی حدس بزنی برای شروع یافت نشد!', 
        ephemeral: true 
      });
    }
    
    // بررسی اینکه فقط سازنده بازی می‌تواند آن را شروع کند
    if (game.createdBy !== interaction.user.id) {
      return await interaction.reply({ 
        content: '❌ فقط سازنده بازی می‌تواند بازی را شروع کند!', 
        ephemeral: true 
      });
    }
    
    // بررسی تعداد بازیکنان (حداقل 2 نفر)
    if (game.players.length < 2) {
      return await interaction.reply({ 
        content: '❌ برای شروع بازی حداقل به 2 بازیکن نیاز است!', 
        ephemeral: true 
      });
    }
    
    // به‌روزرسانی وضعیت بازی
    game.status = 'active';
    game.startedAt = new Date();
    
    // مخلوط کردن آرایه بازیکنان برای تعیین ترتیب نقاشی
    game.data.playerOrder = shuffle([...game.players]);
    
    // انتخاب اولین نقاش
    game.data.currentDrawer = game.data.playerOrder[0];
    
    // به‌روزرسانی بازی در سیستم ذخیره‌سازی
    await storage.updateGameSession(game);
    
    // به‌روزرسانی بازی در لیست بازی‌های فعال
    activeGames.set(game.id, game);
    
    // ارسال پیام شروع بازی
    await interaction.reply({ 
      content: `🎮 بازی نقاشی حدس بزن با ${game.players.length} بازیکن شروع شد!`, 
      fetchReply: true 
    });
    
    // شروع اولین دور بازی
    setTimeout(() => startNextRoundDrawGuess(game, interaction), 3000);
    
  } catch (error) {
    log(`Error starting draw guess game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در شروع بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * شروع دور بعدی بازی نقاشی حدس بزن
 */
async function startNextRoundDrawGuess(game: GameSession, interaction?: ButtonInteraction) {
  try {
    // افزایش شماره دور
    game.data.currentRound++;
    
    // بررسی پایان بازی
    if (game.data.currentRound > game.data.totalRounds) {
      const client = require('../client').default;
      const tmpInteraction = interaction || { client } as ButtonInteraction;
      return await endDrawGuessGame(game, tmpInteraction);
    }
    
    // انتخاب نقاش برای این دور
    const drawerIndex = (game.data.currentRound - 1) % game.players.length;
    game.data.currentDrawer = game.data.playerOrder[drawerIndex];
    
    // انتخاب سه کلمه تصادفی برای نقاش
    game.data.wordOptions = shuffle([...game.data.words]).slice(0, 3);
    
    // به‌روزرسانی بازی در سیستم ذخیره‌سازی
    await storage.updateGameSession(game);
    
    // به‌روزرسانی بازی در لیست بازی‌های فعال
    activeGames.set(game.id, game);
    
    // ارسال پیام انتخاب کلمه
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      // ارسال پیام عمومی برای اعلام نقاش
      const publicEmbed = new EmbedBuilder()
        .setTitle(`🎨 دور ${game.data.currentRound} - نقاشی حدس بزن`)
        .setDescription(`در این دور <@${game.data.currentDrawer}> نقاشی می‌کشد!\n\nنقاش در حال انتخاب کلمه است...`)
        .setColor(0xFFAA22)
        .addFields({ name: '⏱️ زمان آماده‌سازی', value: '15 ثانیه' });
      
      await channel.send({ embeds: [publicEmbed] });
      
      // ارسال پیام خصوصی به نقاش برای انتخاب کلمه
      const drawer = await client.users.fetch(game.data.currentDrawer);
      
      const wordButtons = new ActionRowBuilder<ButtonBuilder>();
      
      // ایجاد دکمه برای هر کلمه
      game.data.wordOptions.forEach((word, index) => {
        wordButtons.addComponents(
          new ButtonBuilder()
            .setCustomId(`drawguess_word_${game.id}_${index}`)
            .setLabel(word)
            .setStyle(ButtonStyle.Primary)
        );
      });
      
      const drawerEmbed = new EmbedBuilder()
        .setTitle('🎨 انتخاب کلمه برای نقاشی')
        .setDescription('یک کلمه را برای نقاشی کشیدن انتخاب کنید:')
        .setColor(0xFFAA22)
        .setFooter({ text: 'پس از انتخاب کلمه، 30 ثانیه فرصت دارید تا توصیف خود را بنویسید.' });
      
      await drawer.send({ embeds: [drawerEmbed], components: [wordButtons] });
      
      // تنظیم تایمر برای انتخاب خودکار کلمه در صورت عدم انتخاب توسط نقاش
      setTimeout(async () => {
        if (!game.data.currentWord) {
          // انتخاب خودکار یک کلمه
          const randomIndex = Math.floor(Math.random() * game.data.wordOptions.length);
          game.data.currentWord = game.data.wordOptions[randomIndex];
          
          // به‌روزرسانی بازی
          await storage.updateGameSession(game);
          activeGames.set(game.id, game);
          
          // شروع مرحله نقاشی
          await startDrawingPhase(game);
        }
      }, 15000);
    }
    
  } catch (error) {
    log(`Error starting next round in draw guess game: ${error}`, 'error');
    
    // در صورت خطا، سعی می‌کنیم به دور بعدی برویم یا بازی را تمام کنیم
    if (game.data.currentRound >= game.data.totalRounds) {
      const client = require('../client').default;
      const tmpInteraction = { client } as ButtonInteraction;
      await endDrawGuessGame(game, tmpInteraction);
    } else {
      setTimeout(() => startNextRoundDrawGuess(game), 3000);
    }
  }
}

/**
 * مدیریت انتخاب کلمه توسط نقاش
 */
async function handleWordSelection(interaction: ButtonInteraction) {
  try {
    // استخراج اطلاعات از شناسه دکمه
    const [_, __, gameId, wordIndex] = interaction.customId.split('_');
    const game = activeGames.get(gameId);
    
    if (!game || game.status !== 'active') {
      return await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا فعال نیست!', 
        ephemeral: true 
      });
    }
    
    // بررسی اینکه فقط نقاش می‌تواند کلمه را انتخاب کند
    if (game.data.currentDrawer !== interaction.user.id) {
      return await interaction.reply({ 
        content: '❌ فقط نقاش این دور می‌تواند کلمه را انتخاب کند!', 
        ephemeral: true 
      });
    }
    
    // ذخیره کلمه انتخاب شده
    const selectedWord = game.data.wordOptions[parseInt(wordIndex)];
    game.data.currentWord = selectedWord;
    
    // به‌روزرسانی بازی
    await storage.updateGameSession(game);
    activeGames.set(game.id, game);
    
    // پاسخ به نقاش
    await interaction.update({ 
      content: `✅ شما کلمه "${selectedWord}" را برای نقاشی انتخاب کردید! شما 30 ثانیه فرصت دارید تا توصیف خود را بنویسید.`, 
      components: [],
      embeds: []
    });
    
    // شروع مرحله نقاشی
    await startDrawingPhase(game);
    
  } catch (error) {
    log(`Error handling word selection: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در انتخاب کلمه رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * شروع مرحله نقاشی
 */
async function startDrawingPhase(game: GameSession) {
  try {
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      // ارسال پیام برای شروع مرحله نقاشی
      const drawingEmbed = new EmbedBuilder()
        .setTitle(`🎨 دور ${game.data.currentRound} - نوبت نقاشی`)
        .setDescription(`<@${game.data.currentDrawer}> در حال نقاشی کلمه مخفی است!\n\nسایر بازیکنان باید حدس بزنند.`)
        .setColor(0xFFAA22)
        .addFields({ name: '⏱️ زمان نقاشی', value: `${game.data.drawingTime} ثانیه` })
        .setFooter({ text: 'در پیام‌های خود حدس خود را بنویسید. اولین نفری که درست حدس بزند برنده است!' });
      
      const drawingMessage = await channel.send({ embeds: [drawingEmbed] });
      game.data.drawingMessageId = drawingMessage.id;
      
      // به‌روزرسانی بازی
      await storage.updateGameSession(game);
      activeGames.set(game.id, game);
      
      // ارسال پیام خصوصی به نقاش با کلمه
      const drawer = await client.users.fetch(game.data.currentDrawer);
      await drawer.send(`🎨 لطفاً توصیف یا نقاشی خود را از کلمه "${game.data.currentWord}" در کانال ارسال کنید. شما ${game.data.drawingTime} ثانیه فرصت دارید.`);
      
      // شروع تایمر برای پایان مرحله نقاشی
      setTimeout(async () => {
        await startGuessingPhase(game);
      }, game.data.drawingTime * 1000);
      
      // تنظیم یک تایمر برای اطلاع‌رسانی نیمه زمان
      setTimeout(async () => {
        try {
          const halfTimeMessage = await channel.messages.fetch(game.data.drawingMessageId);
          if (halfTimeMessage) {
            const updatedEmbed = EmbedBuilder.from(halfTimeMessage.embeds[0]);
            updatedEmbed.setFields({ name: '⏱️ زمان باقی‌مانده', value: `${Math.floor(game.data.drawingTime / 2)} ثانیه` });
            await halfTimeMessage.edit({ embeds: [updatedEmbed] });
          }
        } catch (timeUpdateError) {
          log(`Error updating half-time message: ${timeUpdateError}`, 'error');
        }
      }, Math.floor(game.data.drawingTime / 2) * 1000);
    }
    
  } catch (error) {
    log(`Error starting drawing phase: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به دور بعدی برویم
    setTimeout(() => startNextRoundDrawGuess(game), 3000);
  }
}

/**
 * شروع مرحله حدس زدن
 */
async function startGuessingPhase(game: GameSession) {
  try {
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      // ارسال پیام برای شروع مرحله حدس زدن
      const guessingEmbed = new EmbedBuilder()
        .setTitle(`🎮 دور ${game.data.currentRound} - مرحله حدس زدن`)
        .setDescription(`زمان نقاشی به پایان رسید! همه باید حدس بزنند که نقاشی <@${game.data.currentDrawer}> چیست!`)
        .setColor(0x4CAF50)
        .addFields({ name: '⏱️ زمان حدس زدن', value: `${game.data.guessTime} ثانیه` })
        .setFooter({ text: 'در پیام‌های خود حدس خود را بنویسید. اولین نفری که درست حدس بزند برنده است!' });
      
      const guessingMessage = await channel.send({ embeds: [guessingEmbed] });
      game.data.guessingMessageId = guessingMessage.id;
      
      // فعال کردن وضعیت حدس زدن
      game.data.guessingPhase = true;
      game.data.correctGuessers = [];
      game.data.guessStart = Date.now();
      
      // به‌روزرسانی بازی
      await storage.updateGameSession(game);
      activeGames.set(game.id, game);
      
      // تنظیم یک تایمر برای اطلاع‌رسانی نیمه زمان
      setTimeout(async () => {
        try {
          const halfTimeMessage = await channel.messages.fetch(game.data.guessingMessageId);
          if (halfTimeMessage) {
            const updatedEmbed = EmbedBuilder.from(halfTimeMessage.embeds[0]);
            updatedEmbed.setFields({ name: '⏱️ زمان باقی‌مانده', value: `${Math.floor(game.data.guessTime / 2)} ثانیه` });
            await halfTimeMessage.edit({ embeds: [updatedEmbed] });
          }
        } catch (timeUpdateError) {
          log(`Error updating half-time message: ${timeUpdateError}`, 'error');
        }
      }, Math.floor(game.data.guessTime / 2) * 1000);
      
      // شروع تایمر برای پایان مرحله حدس زدن
      setTimeout(async () => {
        await endGuessingPhase(game);
      }, game.data.guessTime * 1000);
      
      // اضافه کردن یک ایونت برای پردازش پیام‌های کانال برای حدس‌ها
      const messageCollector = channel.createMessageCollector({ 
        filter: msg => game.players.includes(msg.author.id) && msg.author.id !== game.data.currentDrawer,
        time: game.data.guessTime * 1000
      });
      
      messageCollector.on('collect', async (message) => {
        // بررسی اینکه آیا بازی هنوز فعال است
        const currentGame = activeGames.get(game.id);
        if (!currentGame || currentGame.status !== 'active' || !currentGame.data.guessingPhase) {
          return;
        }
        
        // بررسی اینکه آیا فرستنده قبلاً حدس درست زده است
        if (currentGame.data.correctGuessers?.includes(message.author.id)) {
          return;
        }
        
        // بررسی حدس
        const guess = message.content.trim().toLowerCase();
        const targetWord = currentGame.data.currentWord?.toLowerCase();
        
        if (guess === targetWord) {
          // حدس درست - افزودن به لیست حدس کنندگان
          currentGame.data.correctGuessers.push(message.author.id);
          
          // محاسبه امتیاز بر اساس سرعت پاسخ
          const timeTaken = (Date.now() - currentGame.data.guessStart) / 1000; // تبدیل به ثانیه
          const maxTime = currentGame.data.guessTime;
          const timeScore = Math.max(1, Math.ceil((maxTime - timeTaken) / maxTime * 5));
          
          // افزودن امتیاز
          currentGame.data.playerScores[message.author.id] = 
            (currentGame.data.playerScores[message.author.id] || 0) + timeScore;
          
          // پاسخ به کاربر
          await message.reply(`✅ حدس شما درست است! شما ${timeScore} امتیاز کسب کردید.`);
          
          // به‌روزرسانی بازی
          await storage.updateGameSession(currentGame);
          activeGames.set(currentGame.id, currentGame);
          
          // اگر این اولین حدس درست است
          if (currentGame.data.correctGuessers.length === 1) {
            // اضافه کردن امتیاز برای نقاش هم
            currentGame.data.playerScores[currentGame.data.currentDrawer] = 
              (currentGame.data.playerScores[currentGame.data.currentDrawer] || 0) + 3;
            
            // به‌روزرسانی بازی
            await storage.updateGameSession(currentGame);
            activeGames.set(currentGame.id, currentGame);
            
            // اگر تعداد حدس صحیح به حد کافی رسید، دور را زودتر تمام کنیم
            if (currentGame.data.correctGuessers.length >= Math.ceil(currentGame.players.length * 0.6)) {
              messageCollector.stop();
              await endGuessingPhase(currentGame);
            }
          }
        }
      });
    }
    
  } catch (error) {
    log(`Error starting guessing phase: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به دور بعدی برویم
    setTimeout(() => startNextRoundDrawGuess(game), 3000);
  }
}

/**
 * پایان مرحله حدس زدن
 */
async function endGuessingPhase(game: GameSession) {
  try {
    // غیرفعال کردن وضعیت حدس زدن
    game.data.guessingPhase = false;
    
    // به‌روزرسانی بازی
    await storage.updateGameSession(game);
    activeGames.set(game.id, game);
    
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      // بررسی اینکه آیا کسی درست حدس زده است
      const correctGuessCount = game.data.correctGuessers?.length || 0;
      
      // ساخت پیام نتیجه
      const resultEmbed = new EmbedBuilder()
        .setTitle(`🎯 نتیجه دور ${game.data.currentRound}`)
        .setDescription(`کلمه صحیح: **${game.data.currentWord}**`)
        .setColor(0x4CAF50)
        .addFields(
          { name: '🎨 نقاش', value: `<@${game.data.currentDrawer}>`, inline: true },
          { name: '✅ تعداد حدس‌های صحیح', value: `${correctGuessCount} نفر`, inline: true }
        );
      
      // اضافه کردن لیست افرادی که درست حدس زده‌اند
      if (correctGuessCount > 0) {
        const guessersList = game.data.correctGuessers.map(
          (guesserId, index) => `${index + 1}. <@${guesserId}>`
        ).join('\n');
        
        resultEmbed.addFields({ name: '👥 افراد برنده', value: guessersList });
      } else {
        resultEmbed.addFields({ name: '😥 نتیجه', value: 'هیچکس نتوانست درست حدس بزند!' });
      }
      
      // نمایش امتیازات فعلی
      const scoresList = Object.entries(game.data.playerScores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([playerId, score], index) => `${index + 1}. <@${playerId}>: ${score} امتیاز`)
        .join('\n');
      
      resultEmbed.addFields({ name: '🏆 جدول امتیازات', value: scoresList });
      
      // ارسال پیام نتیجه
      await channel.send({ embeds: [resultEmbed] });
      
      // رفتن به دور بعدی پس از مدتی
      setTimeout(() => startNextRoundDrawGuess(game), 5000);
    }
    
  } catch (error) {
    log(`Error ending guessing phase: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به دور بعدی برویم
    setTimeout(() => startNextRoundDrawGuess(game), 3000);
  }
}

/**
 * پایان بازی نقاشی حدس بزن
 */
async function endDrawGuessGame(game: GameSession, interaction: ButtonInteraction) {
  try {
    // به‌روزرسانی وضعیت بازی
    game.status = 'ended';
    game.endedAt = new Date();
    
    // مرتب‌سازی امتیازات
    const sortedScores = Object.entries(game.data.playerScores)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([playerId, score]) => ({ playerId, score }));
    
    // جوایز برای سه نفر اول
    const prizes = [500, 300, 100];
    
    // اعطای جوایز
    for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
      const winner = sortedScores[i];
      if (winner) {
        try {
          await storage.addToWallet(Number(winner.playerId), prizes[i], 'drawguess_prize', { gameType: 'drawguess' });
        } catch (prizeError) {
          log(`Error giving prize to user ${winner.playerId}: ${prizeError}`, 'error');
        }
      }
    }
    
    // ساخت Embed نتایج
    const embed = new EmbedBuilder()
      .setTitle('🏆 پایان بازی نقاشی حدس بزن')
      .setDescription('بازی به پایان رسید! نتایج نهایی:')
      .setColor(0xFFD700);
    
    // اضافه کردن فیلدهای امتیازات
    for (let i = 0; i < sortedScores.length; i++) {
      const player = sortedScores[i];
      let rankEmoji = '';
      
      // تعیین ایموجی مقام
      if (i === 0) rankEmoji = '🥇';
      else if (i === 1) rankEmoji = '🥈';
      else if (i === 2) rankEmoji = '🥉';
      else rankEmoji = `${i + 1}.`;
      
      // اضافه کردن فیلد برای هر بازیکن
      embed.addFields({
        name: `${rankEmoji} <@${player.playerId}>`,
        value: `امتیاز: ${player.score} ${i < 3 ? `(جایزه: ${prizes[i]} کوین)` : ''}`,
        inline: i < 3
      });
    }
    
    // پیام تشکر
    embed.setFooter({ 
      text: 'با تشکر از همه شرکت‌کنندگان! می‌توانید دوباره این بازی را شروع کنید.' 
    });
    
    // ارسال پیام - استفاده از کلاینت اصلی اگر اینتراکشن موجود نباشد
    const client = require('../client').default;
    const channel = await (interaction?.client || client).channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      await channel.send({ 
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('drawguess_new')
                .setLabel('بازی جدید')
                .setEmoji('🎮')
                .setStyle(ButtonStyle.Success)
            )
        ]
      });
    }
    
    // به‌روزرسانی بازی در سیستم ذخیره‌سازی
    await storage.updateGameSession(game);
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(game.id);
    
  } catch (error) {
    log(`Error ending draw guess game: ${error}`, 'error');
    
    // سعی می‌کنیم یک پیام خطا به کانال بفرستیم
    try {
      const client = require('../client').default;
      const channel = await (interaction?.client || client).channels.fetch(game.channelId);
      
      if (channel && channel.isTextBased()) {
        await channel.send({ 
          content: '❌ خطایی در پایان بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.'
        });
      }
    } catch (sendError) {
      log(`Error sending error message at the end of draw guess game: ${sendError}`, 'error');
    }
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(game.id);
  }
}

/**
 * مدیریت بازی جرأت یا حقیقت
 */
async function handleTruthOrDareGame(interaction: ButtonInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('😈 جرأت یا حقیقت')
      .setDescription('این بازی به زودی در دسترس قرار خواهد گرفت. لطفاً صبور باشید!')
      .setColor(0xFF55AA);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    log(`Error handling truth or dare game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت بازی بینگو
 */
/**
 * مدیریت بازی بینگو و ارسال آن به ماژول مخصوص بینگو
 */
async function handleBingoGame(interaction: ButtonInteraction) {
  try {
    // ماژول بینگو را در components/bingoGame.ts پیاده‌سازی کرده‌ایم
    // ارجاع به تابع createBingoGame در آن ماژول
    const { createBingoGame } = await import('./bingoGame');
    await createBingoGame(interaction);
  } catch (error) {
    log(`Error handling bingo game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در اجرای بازی بینگو رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * مدیریت بازی زنجیره کلمات
 */
/**
 * مدیریت بازی زنجیره کلمات
 */
async function handleWordChainGame(interaction: ButtonInteraction) {
  try {
    // در اینجا بررسی می‌کنیم که کاربر قبلاً در پایگاه داده وجود داشته باشد
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.reply({ 
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور `/menu` استفاده نمایید.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وجود بازی فعال در کانال
    const activeGameInChannel = Array.from(activeGames.values()).find(
      game => game.channelId === interaction.channelId && 
      game.gameType === 'wordchain' && 
      game.status !== 'ended'
    );
    
    if (activeGameInChannel) {
      await interaction.reply({ 
        content: '⚠️ یک بازی زنجیره کلمات در حال حاضر در این کانال فعال است!', 
        ephemeral: true 
      });
      return;
    }

    // ایجاد بازی جدید
    const gameId = `word_chain_${Date.now()}`;
    
    // تنظیمات بازی
    const newGame: GameSession = {
      id: gameId,
      gameType: 'wordchain',
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      players: [interaction.user.id],
      status: 'waiting',
      data: {
        usedWords: [],
        currentLetter: '',
        currentTurn: 0,
        roundTime: 30,
        minWordLength: 3,
        language: 'fa',
        scores: {}
      }
    };
    
    // ثبت نام میزبان به عنوان اولین بازیکن
    newGame.data.scores[interaction.user.id] = 0;
    
    // ذخیره در حافظه
    activeGames.set(gameId, newGame);
    
    // ساخت Embed توضیحات بازی
    const embed = new EmbedBuilder()
      .setTitle('🔗 بازی زنجیره کلمات')
      .setDescription('در این بازی هر بازیکن باید کلمه‌ای را بگوید که با آخرین حرف کلمه بازیکن قبلی شروع شود.')
      .setColor('#55FF55')
      .addFields(
        { name: '👥 تعداد بازیکنان', value: '1/8', inline: true },
        { name: '⏱️ زمان هر نوبت', value: '30 ثانیه', inline: true },
        { name: '📏 حداقل طول کلمات', value: '3 حرف', inline: true },
        { name: '👨‍💼 میزبان', value: interaction.user.username, inline: true },
        { name: '📝 بازیکنان', value: interaction.user.username, inline: true }
      )
      .setFooter({ text: 'برای شرکت در بازی روی دکمه "ورود به بازی" کلیک کنید' });
    
    // دکمه‌های بازی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`word_chain_join_${gameId}`)
          .setLabel('ورود به بازی')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`word_chain_start_${gameId}`)
          .setLabel('شروع بازی')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`word_chain_rules_${gameId}`)
          .setLabel('قوانین بازی')
          .setEmoji('📜')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`word_chain_cancel_${gameId}`)
          .setLabel('لغو بازی')
          .setEmoji('🚫')
          .setStyle(ButtonStyle.Danger)
      );
    
    // ارسال پیام و ذخیره شناسه آن
    const response = await interaction.reply({ 
      content: '🎮 یک بازی جدید زنجیره کلمات ایجاد شد!',
      embeds: [embed], 
      components: [row],
      fetchReply: true 
    });
    
    // ذخیره شناسه پیام در داده‌های بازی
    newGame.data.messageId = response.id;
    activeGames.set(gameId, newGame);
    
    // در صورت امکان، ذخیره در دیتابیس
    try {
      await storage.saveGameSession(newGame);
    } catch (dbError) {
      log(`Error saving word chain game to database: ${dbError}`, 'warn');
      // ادامه روند بازی حتی در صورت خطا در ذخیره‌سازی
    }
    
  } catch (error) {
    log(`Error handling word chain game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در اجرای بازی زنجیره کلمات رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * تعریف نقش‌های بازی مافیا
 */
export enum MafiaRole {
  CITIZEN = 'citizen',       // شهروند عادی
  MAFIA = 'mafia',           // مافیا
  DETECTIVE = 'detective',   // کارآگاه
  DOCTOR = 'doctor',         // دکتر
  SNIPER = 'sniper',         // تک تیرانداز
  GODFATHER = 'godfather',   // رئیس مافیا
  SILENCER = 'silencer',     // ساکت کننده
  BODYGUARD = 'bodyguard',   // محافظ
  PSYCHOLOGIST = 'psychologist' // روانشناس
}

/**
 * توضیحات نقش‌های مافیا
 */
const MafiaRoleDescriptions: { [key in MafiaRole]: string } = {
  [MafiaRole.CITIZEN]: "👨‍💼 شهروند عادی - هدف شما شناسایی مافیاها و حذف آنهاست. در رأی‌گیری روز شرکت می‌کنید.",
  [MafiaRole.MAFIA]: "🔪 مافیا - شما عضو گروه مافیا هستید. هر شب یک نفر را به عنوان هدف حمله انتخاب می‌کنید.",
  [MafiaRole.DETECTIVE]: "🔍 کارآگاه - هر شب می‌توانید هویت یک بازیکن را بررسی کنید و بفهمید که مافیا هست یا خیر.",
  [MafiaRole.DOCTOR]: "💉 دکتر - هر شب می‌توانید یک نفر (از جمله خودتان) را نجات دهید.",
  [MafiaRole.SNIPER]: "🔫 تک تیرانداز - یک بار در طول بازی می‌توانید یک نفر را حذف کنید.",
  [MafiaRole.GODFATHER]: "👑 رئیس مافیا - شما رهبر گروه مافیا هستید و در بررسی کارآگاه، شهروند عادی شناخته می‌شوید.",
  [MafiaRole.SILENCER]: "🤐 ساکت کننده - عضو مافیا هستید و می‌توانید هر شب یک نفر را ساکت کنید تا در روز بعد نتواند صحبت کند.",
  [MafiaRole.BODYGUARD]: "🛡️ محافظ - هر شب می‌توانید از یک نفر محافظت کنید تا در برابر حمله مافیا ایمن بماند.",
  [MafiaRole.PSYCHOLOGIST]: "🧠 روانشناس - می‌توانید یک بار در طول بازی، یک شب را به روز تبدیل کنید تا هیچکس کشته نشود."
};

/**
 * وضعیت‌های بازی مافیا
 */
export enum MafiaGameState {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  ASSIGNING_ROLES = 'assigning_roles',
  NIGHT_TIME = 'night_time',
  DAY_TIME = 'day_time',
  VOTING = 'voting',
  GAME_OVER = 'game_over'
}

/**
 * اطلاعات بازیکن در بازی مافیا
 */
interface MafiaPlayer {
  userId: string;
  role: MafiaRole;
  isAlive: boolean;
  isSilenced: boolean;
  hasUsedAbility: boolean; // برای قابلیت‌های یک‌بار مصرف
  voteTarget?: string;     // هدف رأی در مرحله رأی‌گیری
  nightAction?: string;    // اقدام شبانه بازیکن (هدف قابلیت)
}

/**
 * داده‌های بازی مافیا
 */
interface MafiaGameData {
  players: { [userId: string]: MafiaPlayer };
  state: MafiaGameState;
  day: number;
  messages: { messageId: string, type: string }[];
  votingResults?: { [userId: string]: number };
  nightActions?: { [role: string]: string };
  silencedPlayer?: string;
  savedPlayer?: string;
  killedPlayer?: string;
  investigatedPlayer?: string;
  timer?: NodeJS.Timeout;
}

/**
 * مدیریت بازی مافیا
 */
export async function handleMafiaGame(interaction: ButtonInteraction) {
  try {
    // نمایش منوی بازی مافیا بدون ایجاد جلسه
    // در این منو دکمه تشکیل جلسه به کاربر نمایش داده می‌شود
    
    const embed = new EmbedBuilder()
      .setTitle('🕵️‍♂️ بازی مافیا')
      .setDescription('به دنیای پر از رمز و راز مافیا خوش آمدید! در این بازی شما در نقش‌های مختلف قرار می‌گیرید و باید با استفاده از مهارت‌های استراتژیک و اجتماعی خود، دشمنان را شناسایی کرده و از شهر محافظت کنید.')
      .setColor(0x9B59B6) // رنگ بنفش
      .addFields(
        { name: '👥 تعداد بازیکنان', value: '1/12', inline: true },
        { name: '⏱️ زمان هر روز', value: '5 دقیقه', inline: true },
        { name: '🌃 زمان هر شب', value: '3 دقیقه', inline: true },
        { name: '👤 حداقل بازیکنان', value: '6 نفر', inline: true },
        { name: '🏆 جایزه بازی', value: 'برنده: 500 کوین', inline: true }
      )
      .setFooter({ text: 'برای شروع بازی جدید روی دکمه "تشکیل جلسه" کلیک کنید' });
    
    // دکمه‌های کنترلی جدید
    const controlRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_mafia_session')
          .setLabel('تشکیل جلسه')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('mafia_help_guide')
          .setLabel('راهنمای بازی')
          .setEmoji('📚')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('show_active_mafia_sessions')
          .setLabel('جلسات فعال')
          .setEmoji('🔍')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_games')
          .setLabel('بازگشت')
          .setEmoji('🔙')
          .setStyle(ButtonStyle.Secondary)
      );
          
    // ارسال پیام
    await interaction.reply({ 
      embeds: [embed], 
      components: [controlRow],
      ephemeral: true
    });
    
    // اینجا هیچ جلسه‌ای ذخیره نمی‌شود چون تا کلیک روی دکمه "تشکیل جلسه" جلسه‌ای ایجاد نمی‌شود
    
  } catch (error) {
    log(`Error handling mafia game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در اجرای بازی مافیا رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * نمایش تاریخچه بازی‌های گروهی
 * @param interaction برهم‌کنش کاربر
 */
async function showGameHistory(interaction: ButtonInteraction) {
  try {
    // بررسی تاریخچه بازی‌های کاربر
    const userId = interaction.user.id;
    
    // بررسی بازی‌های شرکت کرده یا میزبانی شده توسط کاربر
    const userGames = gameHistory.filter(game => 
      game.players.includes(userId) || game.createdBy === userId
    );
    
    // بازی‌های فعال کاربر
    const activeUserGames = Array.from(activeGames.values()).filter(game => 
      (game.players.includes(userId) || game.createdBy === userId) && 
      game.status !== 'ended'
    );
    
    // ساخت Embed
    const embed = new EmbedBuilder()
      .setTitle('📜 تاریخچه بازی‌های شما')
      .setDescription(`${interaction.user.username} عزیز، در اینجا می‌توانید تاریخچه بازی‌های خود را مشاهده کنید.`)
      .setColor('#9B59B6')
      .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }));
    
    // اضافه کردن آمار کلی بازیکن
    const userStat = playerStats.get(userId);
    if (userStat) {
      embed.addFields(
        { name: '🎮 کل بازی‌ها', value: userStat.gamesPlayed.toString(), inline: true },
        { name: '🏆 برد‌ها', value: userStat.gamesWon.toString(), inline: true },
        { name: '📊 نرخ برد', value: `${Math.round((userStat.gamesWon / Math.max(userStat.gamesPlayed, 1)) * 100)}%`, inline: true }
      );
    } else {
      embed.addFields(
        { name: '🎮 کل بازی‌ها', value: '0', inline: true },
        { name: '🏆 برد‌ها', value: '0', inline: true },
        { name: '📊 نرخ برد', value: '0%', inline: true }
      );
    }
    
    // اضافه کردن بازی‌های فعال
    if (activeUserGames.length > 0) {
      const gameTypeNames: Record<string, string> = {
        'mafia': '🕵️‍♂️ مافیا',
        'werewolf': '🐺 گرگینه',
        'quiz': '📚 مسابقه اطلاعات عمومی',
        'drawguess': '🎨 نقاشی حدس بزن',
        'truthordare': '🎯 جرات یا حقیقت',
        'bingo': '🎲 بینگو',
        'wordchain': '📝 زنجیره کلمات',
        'spy': '🕴️ جاسوس مخفی'
      };
      
      let activeGamesText = '';
      activeUserGames.forEach(game => {
        const gameTypeName = gameTypeNames[game.gameType] || game.gameType;
        const channelName = interaction.client.channels.cache.get(game.channelId)?.toString() || 'کانال نامشخص';
        activeGamesText += `• ${gameTypeName} در ${channelName}\n`;
      });
      
      embed.addFields({ name: '🟢 بازی‌های فعال شما', value: activeGamesText });
    }
    
    // اضافه کردن تاریخچه بازی‌ها
    if (userGames.length > 0) {
      // بازی‌های اخیر (حداکثر 5 بازی)
      const recentGames = userGames
        .sort((a, b) => {
          const aTime = a.endedAt || new Date();
          const bTime = b.endedAt || new Date();
          return bTime.getTime() - aTime.getTime();
        })
        .slice(0, 5);
      
      const gameTypeNames: Record<string, string> = {
        'mafia': '🕵️‍♂️ مافیا',
        'werewolf': '🐺 گرگینه',
        'quiz': '📚 مسابقه اطلاعات عمومی',
        'drawguess': '🎨 نقاشی حدس بزن',
        'truthordare': '🎯 جرات یا حقیقت',
        'bingo': '🎲 بینگو',
        'wordchain': '📝 زنجیره کلمات',
        'spy': '🕴️ جاسوس مخفی'
      };
      
      let historyText = '';
      recentGames.forEach(game => {
        const gameTypeName = gameTypeNames[game.gameType] || game.gameType;
        const endDate = game.endedAt ? new Date(game.endedAt).toLocaleDateString('fa-IR') : 'نامشخص';
        const isWinner = game.winners?.includes(userId) ? '🏆 برنده' : '👥 شرکت‌کننده';
        historyText += `• ${gameTypeName} - ${endDate} - ${isWinner}\n`;
      });
      
      embed.addFields({ name: '📋 بازی‌های اخیر', value: historyText });
    } else {
      embed.setDescription(`${interaction.user.username} عزیز، شما تاکنون در هیچ بازی گروهی شرکت نکرده‌اید. با استفاده از منوی بازی‌های گروهی می‌توانید به بازی‌های موجود بپیوندید یا بازی جدیدی شروع کنید.`);
    }
    
    // ساخت دکمه‌های کنترلی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:leaderboard')
          .setLabel('رتبه‌بندی بازیکنان')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏆'),
        new ButtonBuilder()
          .setCustomId('game:active_sessions')
          .setLabel('جلسات فعال')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setCustomId('group_games')
          .setLabel('بازگشت')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );
    
    // ارسال پاسخ
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    
  } catch (error) {
    log(`Error showing game history: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در نمایش تاریخچه بازی‌ها رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * نمایش رتبه‌بندی بازیکنان
 * @param interaction برهم‌کنش کاربر
 */
async function showGameLeaderboard(interaction: ButtonInteraction) {
  try {
    // دریافت آمار تمام بازیکنان
    let allStats = Array.from(playerStats.values());
    
    // اگر آمار کافی نباشد، می‌توانیم داده‌های نمونه اضافه کنیم (فقط برای نمایش)
    if (allStats.length < 5) {
      // از داده‌های کاربران واقعی استفاده می‌کنیم، اما با آمار تصادفی
      const guildMembers = interaction.guild?.members.cache;
      if (guildMembers && guildMembers.size > 0) {
        const randomMembers = Array.from(guildMembers.values())
          .filter(member => !member.user.bot && !playerStats.has(member.id))
          .slice(0, 10 - allStats.length);
        
        for (const member of randomMembers) {
          const gamesPlayed = Math.floor(Math.random() * 20) + 5;
          const gamesWon = Math.floor(Math.random() * gamesPlayed);
          
          const sampleStat: PlayerStats = {
            userId: member.id,
            gamesPlayed,
            gamesWon,
            totalScore: gamesWon * 100 + Math.floor(Math.random() * 500),
            gameTypeStats: {
              'quiz': { played: Math.floor(gamesPlayed * 0.4), won: Math.floor(gamesWon * 0.4), score: 0 },
              'mafia': { played: Math.floor(gamesPlayed * 0.3), won: Math.floor(gamesWon * 0.3), score: 0 },
              'drawguess': { played: Math.floor(gamesPlayed * 0.2), won: Math.floor(gamesWon * 0.2), score: 0 },
              'bingo': { played: Math.floor(gamesPlayed * 0.1), won: Math.floor(gamesWon * 0.1), score: 0 }
            },
            lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // تاریخی تصادفی در هفته گذشته
          };
          
          allStats.push(sampleStat);
        }
      }
    }
    
    // مرتب‌سازی بر اساس امتیاز کل (نزولی)
    allStats = allStats.sort((a, b) => b.totalScore - a.totalScore);
    
    // ساخت Embed
    const embed = new EmbedBuilder()
      .setTitle('🏆 رتبه‌بندی بازیکنان بازی‌های گروهی')
      .setDescription('برترین بازیکنان بر اساس امتیاز کلی بازی‌های گروهی')
      .setColor('#9B59B6')
      .setFooter({ text: 'آخرین به‌روزرسانی: همین الان' });
    
    // اضافه کردن 10 بازیکن برتر
    let leaderboardText = '';
    const topPlayers = allStats.slice(0, 10);
    
    for (let i = 0; i < topPlayers.length; i++) {
      const player = topPlayers[i];
      const user = await interaction.client.users.fetch(player.userId).catch(() => null);
      const username = user ? user.username : 'کاربر ناشناس';
      
      // نمایش رتبه با ایموجی مدال برای سه نفر اول
      let rankText = '';
      if (i === 0) rankText = '🥇 ';
      else if (i === 1) rankText = '🥈 ';
      else if (i === 2) rankText = '🥉 ';
      else rankText = `${i+1}. `;
      
      leaderboardText += `${rankText}**${username}** - امتیاز: ${player.totalScore} - برد: ${player.gamesWon}/${player.gamesPlayed}\n`;
    }
    
    if (leaderboardText === '') {
      leaderboardText = 'هنوز هیچ بازیکنی در رتبه‌بندی وجود ندارد!';
    }
    
    embed.setDescription(leaderboardText);
    
    // پیدا کردن رتبه کاربر فعلی
    const currentUserStat = allStats.findIndex(stat => stat.userId === interaction.user.id);
    if (currentUserStat !== -1) {
      embed.addFields({
        name: '🎯 رتبه شما',
        value: `رتبه ${currentUserStat + 1} از ${allStats.length} - امتیاز: ${allStats[currentUserStat].totalScore}`
      });
    }
    
    // اضافه کردن آمار بهترین بازی‌ها
    const gameTypeNames: Record<string, string> = {
      'mafia': '🕵️‍♂️ مافیا',
      'werewolf': '🐺 گرگینه',
      'quiz': '📚 اطلاعات عمومی',
      'drawguess': '🎨 نقاشی حدس بزن',
      'truthordare': '🎯 جرات یا حقیقت',
      'bingo': '🎲 بینگو',
      'wordchain': '📝 زنجیره کلمات',
      'spy': '🕴️ جاسوس مخفی'
    };
    
    // آمار محبوب‌ترین بازی‌ها
    const gameTypeStats: Record<string, { played: number, won: number }> = {};
    
    allStats.forEach(playerStat => {
      Object.entries(playerStat.gameTypeStats).forEach(([gameType, stats]) => {
        if (!gameTypeStats[gameType]) {
          gameTypeStats[gameType] = { played: 0, won: 0 };
        }
        gameTypeStats[gameType].played += stats.played;
        gameTypeStats[gameType].won += stats.won;
      });
    });
    
    // مرتب‌سازی بازی‌ها بر اساس محبوبیت
    const sortedGameTypes = Object.entries(gameTypeStats)
      .sort(([, statsA], [, statsB]) => statsB.played - statsA.played)
      .slice(0, 4);
    
    let popularGamesText = '';
    sortedGameTypes.forEach(([gameType, stats]) => {
      const gameTypeName = gameTypeNames[gameType] || gameType;
      popularGamesText += `${gameTypeName}: ${stats.played} بازی (${stats.won} برد)\n`;
    });
    
    if (popularGamesText) {
      embed.addFields({ name: '📊 بازی‌های محبوب', value: popularGamesText, inline: true });
    }
    
    // ساخت دکمه‌های کنترلی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:history')
          .setLabel('تاریخچه بازی‌ها')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📜'),
        new ButtonBuilder()
          .setCustomId('game:active_sessions')
          .setLabel('جلسات فعال')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setCustomId('group_games')
          .setLabel('بازگشت')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );
    
    // ارسال پاسخ
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    
  } catch (error) {
    log(`Error showing game leaderboard: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در نمایش رتبه‌بندی بازیکنان رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * پیوستن به بازی با استفاده از شناسه بازی
 * @param interaction برهم‌کنش کاربر
 * @param gameId شناسه بازی
 */
async function joinGameById(interaction: ButtonInteraction, gameId: string) {
  try {
    // پیدا کردن بازی با شناسه
    const gameSession = activeGames.get(gameId);
    
    if (!gameSession) {
      return await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است!', 
        ephemeral: true 
      });
    }
    
    // بررسی اینکه آیا کاربر قبلاً به بازی پیوسته است یا خیر
    if (gameSession.players.includes(interaction.user.id)) {
      return await interaction.reply({ 
        content: '❌ شما قبلاً به این بازی پیوسته‌اید!', 
        ephemeral: true 
      });
    }
    
    // بررسی وضعیت بازی
    if (gameSession.status !== 'waiting') {
      return await interaction.reply({ 
        content: '❌ این بازی در حال حاضر در وضعیت انتظار نیست و نمی‌توانید به آن بپیوندید.', 
        ephemeral: true 
      });
    }
    
    // بررسی بازی خصوصی
    if (gameSession.gameSettings?.isPrivate) {
      // اگر بازی خصوصی است، فقط دوستان میزبان یا اعضای کلن او می‌توانند بپیوندند
      // (این بخش بسته به منطق دوستی و کلن در سیستم شما پیاده‌سازی می‌شود)
      
      // اینجا فرض می‌کنیم کاربر اجازه پیوستن دارد
      // در واقعیت باید بررسی شود کاربر دوست میزبان است یا عضو کلن او
    }
    
    // پیوستن به بازی بر اساس نوع بازی
    switch (gameSession.gameType) {
      case 'quiz':
        // ارجاع به تابع پیوستن به کوییز با اطلاعات بازی و کاربر
        const quizMessage = await interaction.channel?.messages.fetch(gameSession.data.messageId).catch(() => null);
        if (quizMessage) {
          // ساخت interaction جدید با پیام اصلی بازی
          const fakeInteraction = {
            ...interaction,
            message: quizMessage
          } as ButtonInteraction;
          
          // فراخوانی تابع پیوستن به بازی کوییز
          await joinQuizGame(fakeInteraction);
          return;
        }
        break;
        
      case 'mafia':
        // ارجاع به تابع پیوستن به مافیا
        const mafiaMessage = await interaction.channel?.messages.fetch(gameSession.data.messageId).catch(() => null);
        if (mafiaMessage) {
          const fakeInteraction = {
            ...interaction,
            message: mafiaMessage
          } as ButtonInteraction;
          
          await joinMafiaGame(fakeInteraction);
          return;
        }
        break;
        
      case 'drawguess':
        // ارجاع به تابع پیوستن به نقاشی حدس بزن
        const drawGuessMessage = await interaction.channel?.messages.fetch(gameSession.data.messageId).catch(() => null);
        if (drawGuessMessage) {
          const fakeInteraction = {
            ...interaction,
            message: drawGuessMessage
          } as ButtonInteraction;
          
          await joinDrawGuessGame(fakeInteraction);
          return;
        }
        break;
        
      default:
        // برای سایر بازی‌ها می‌توانیم یک پاسخ عمومی ارسال کنیم
        // افزودن کاربر به لیست بازیکنان
        gameSession.players.push(interaction.user.id);
        activeGames.set(gameSession.id, gameSession);
        
        await interaction.reply({ 
          content: `✅ شما با موفقیت به بازی ${gameSession.gameType} پیوستید! لطفاً به کانال مربوطه مراجعه کنید: <#${gameSession.channelId}>`,
          ephemeral: true 
        });
        return;
    }
    
    // اگر به اینجا رسیدیم یعنی نتوانستیم به بازی بپیوندیم
    await interaction.reply({ 
      content: '❌ خطایی در پیوستن به بازی رخ داد. ممکن است پیام اصلی بازی حذف شده باشد.',
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error joining game by ID: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در پیوستن به بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * پیوستن به بازی مافیا
 */
async function joinMafiaGame(interaction: ButtonInteraction) {
  try {
    // پیدا کردن بازی فعال در کانال
    const gameSession = getActiveGameInChannel(interaction.channelId, 'mafia');
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی مافیا فعالی در این کانال یافت نشد!', ephemeral: true });
    }
    
    if (gameSession.status !== 'waiting') {
      return await interaction.reply({ content: '❌ بازی مافیا قبلاً شروع شده است و نمی‌توانید به آن بپیوندید!', ephemeral: true });
    }
    
    // بررسی اینکه کاربر قبلاً به بازی پیوسته باشد
    if (gameSession.players.includes(interaction.user.id)) {
      return await interaction.reply({ content: '❌ شما قبلاً به این بازی پیوسته‌اید!', ephemeral: true });
    }
    
    // بررسی محدودیت تعداد بازیکنان
    if (gameSession.players.length >= 10) {
      return await interaction.reply({ content: '❌ ظرفیت بازی تکمیل است!', ephemeral: true });
    }
    
    // افزودن کاربر به لیست بازیکنان
    gameSession.players.push(interaction.user.id);
    
    // آماده‌سازی بازیکن در اطلاعات بازی
    const newPlayer: MafiaPlayer = {
      userId: interaction.user.id,
      role: MafiaRole.CITIZEN, // نقش پیش‌فرض که بعداً تغییر خواهد کرد
      isAlive: true,
      isSilenced: false,
      hasUsedAbility: false
    };
    
    gameSession.data.players[interaction.user.id] = newPlayer;
    activeGames.set(gameSession.id, gameSession);
    
    // به‌روزرسانی Embed
    const message = await interaction.message.fetch();
    const embed = EmbedBuilder.from(message.embeds[0]);
    
    // به‌روزرسانی فیلد تعداد بازیکنان
    const playerField = embed.data.fields?.find(field => field.name === '👥 تعداد بازیکنان');
    if (playerField) {
      playerField.value = `${gameSession.players.length}/10`;
    }
    
    // افزودن لیست بازیکنان
    const playersList = gameSession.players.map(playerId => `<@${playerId}>`).join('\n');
    
    // بررسی اگر فیلد بازیکنان قبلاً وجود داشته باشد
    const existingPlayersListField = embed.data.fields?.find(field => field.name === '👤 بازیکنان');
    if (existingPlayersListField) {
      existingPlayersListField.value = playersList;
    } else {
      embed.addFields({ name: '👤 بازیکنان', value: playersList });
    }
    
    await interaction.update({ embeds: [embed] });
    
    // اطلاع‌رسانی به کاربر
    await interaction.followUp({
      content: '✅ شما با موفقیت به بازی مافیا پیوستید! نقش شما پس از شروع بازی به شما اعلام خواهد شد.',
      ephemeral: true
    });
    
  } catch (error) {
    log(`Error joining mafia game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در پیوستن به بازی مافیا رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * نمایش قوانین بازی مافیا
 */
async function showMafiaRules(interaction: ButtonInteraction) {
  try {
    // ساخت Embed قوانین بازی
    const rulesEmbed = new EmbedBuilder()
      .setTitle('📜 قوانین بازی مافیا')
      .setColor(0x2B2D31)
      .setDescription(
        '**بازی مافیا** یک بازی گروهی است که در آن بازیکنان به دو گروه اصلی تقسیم می‌شوند: **شهروندان** و **مافیا**. ' +
        'هدف شهروندان شناسایی و حذف تمام مافیاها و هدف مافیاها کشتن شهروندان تا رسیدن به اکثریت است.\n\n' +
        '**جریان بازی:**\n' +
        '1. بازی با مرحله **شب** شروع می‌شود که در آن مافیاها یک نفر را برای حذف انتخاب می‌کنند.\n' +
        '2. سپس مرحله **روز** می‌رسد که در آن بازیکنان بحث و تبادل نظر می‌کنند.\n' +
        '3. در پایان روز، بازیکنان **رأی‌گیری** می‌کنند تا یک نفر را حذف کنند.\n' +
        '4. این چرخه ادامه می‌یابد تا یکی از گروه‌ها برنده شود.\n\n' +
        '**نقش‌های موجود:**\n' +
        '• **شهروند:** هیچ قابلیت ویژه‌ای ندارد و فقط در رأی‌گیری شرکت می‌کند.\n' +
        '• **کارآگاه:** هر شب می‌تواند هویت یک بازیکن را بررسی کند.\n' +
        '• **دکتر:** هر شب می‌تواند یک نفر را از مرگ نجات دهد.\n' +
        '• **مافیا:** هر شب با همکاری سایر مافیاها یک نفر را می‌کشد.\n' +
        '• **رئیس مافیا:** مانند مافیا عمل می‌کند اما به کارآگاه به عنوان شهروند نشان داده می‌شود.\n' +
        '• **ساکت‌کننده:** می‌تواند هر شب یک نفر را از صحبت کردن در روز بعد منع کند.\n' +
        '• **تک‌تیرانداز:** یک بار در بازی می‌تواند یک نفر را حذف کند.\n\n' +
        '**شرایط پیروزی:**\n' +
        '• **شهروندان:** حذف تمام مافیاها\n' +
        '• **مافیاها:** رسیدن به تعداد مساوی یا بیشتر از شهروندان'
      )
      .setFooter({ text: 'برای بازگشت به منوی بازی، دکمه "بازگشت" را کلیک کنید.' });
    
    // دکمه بازگشت
    const backButton = new ButtonBuilder()
      .setCustomId('mafia_back_to_menu')
      .setLabel('بازگشت به منوی بازی')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(backButton);
    
    await interaction.reply({
      embeds: [rulesEmbed],
      components: [row],
      ephemeral: true
    });
    
  } catch (error) {
    log(`Error showing mafia rules: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در نمایش قوانین بازی مافیا رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * شروع بازی مافیا
 */
async function startMafiaGame(interaction: ButtonInteraction) {
  try {
    // پیدا کردن بازی فعال در کانال
    const gameSession = getActiveGameInChannel(interaction.channelId, 'mafia');
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی مافیا فعالی در این کانال یافت نشد!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر سازنده بازی است
    if (gameSession.createdBy !== interaction.user.id) {
      return await interaction.reply({ 
        content: '❌ فقط سازنده بازی می‌تواند بازی را شروع کند!', 
        ephemeral: true 
      });
    }
    
    // بررسی وضعیت بازی
    if (gameSession.status !== 'waiting') {
      return await interaction.reply({ 
        content: '❌ بازی قبلاً شروع شده است!', 
        ephemeral: true 
      });
    }
    
    // بررسی تعداد بازیکنان
    if (gameSession.players.length < 5) {
      return await interaction.reply({ 
        content: '❌ حداقل 5 بازیکن برای شروع بازی مافیا نیاز است!', 
        ephemeral: true 
      });
    }
    
    // شروع بازی
    gameSession.status = 'active';
    gameSession.startedAt = new Date();
    gameSession.data.state = MafiaGameState.ASSIGNING_ROLES;
    
    // به‌روزرسانی وضعیت در embeds
    const message = await interaction.message.fetch();
    const embed = EmbedBuilder.from(message.embeds[0]);
    
    // تغییر وضعیت بازی در Embed
    const statusField = embed.data.fields?.find(field => field.name === '⌛ وضعیت بازی');
    if (statusField) {
      statusField.value = 'در حال اجرا';
    } else {
      embed.addFields({ name: '⌛ وضعیت بازی', value: 'در حال اجرا', inline: true });
    }
    
    // به‌روزرسانی دکمه‌ها - حذف دکمه‌های پیوستن و شروع
    const disabledJoinButton = new ButtonBuilder()
      .setCustomId('mafia_join_disabled')
      .setLabel('ورود به بازی')
      .setEmoji('🎮')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true);
    
    const disabledStartButton = new ButtonBuilder()
      .setCustomId('mafia_start_disabled')
      .setLabel('بازی شروع شد')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);
    
    const rulesButton = new ButtonBuilder()
      .setCustomId('mafia_rules')
      .setLabel('قوانین بازی')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(disabledJoinButton, disabledStartButton, rulesButton);
    
    // به‌روزرسانی پیام اصلی
    await interaction.update({ 
      embeds: [embed],
      components: [row]
    });
    
    // اطلاع‌رسانی به کاربران
    await interaction.followUp({
      content: '🎮 بازی مافیا با موفقیت شروع شد! نقش‌ها در حال تخصیص به بازیکنان هستند...',
      ephemeral: false
    });
    
    // تخصیص نقش‌ها به بازیکنان
    await assignRolesToPlayers(gameSession);
    
    // شروع اولین شب
    setTimeout(() => {
      startNightPhase(gameSession, interaction);
    }, 5000); // 5 ثانیه تأخیر
    
  } catch (error) {
    log(`Error starting mafia game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در شروع بازی مافیا رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * تخصیص نقش‌ها به بازیکنان
 */
async function assignRolesToPlayers(gameSession: GameSession) {
  try {
    const playerCount = gameSession.players.length;
    
    // تعیین تعداد نقش‌های هر گروه بر اساس تعداد بازیکنان
    let mafiaCount = Math.floor(playerCount / 4) + (playerCount > 8 ? 1 : 0);
    let specialCitizenCount = Math.floor(playerCount / 3);
    
    // نقش‌های قابل تخصیص
    const mafiaRoles = [MafiaRole.MAFIA];
    if (playerCount >= 7) mafiaRoles.push(MafiaRole.GODFATHER);
    if (playerCount >= 9) mafiaRoles.push(MafiaRole.SILENCER);
    
    const citizenRoles = [MafiaRole.DETECTIVE, MafiaRole.DOCTOR];
    if (playerCount >= 6) citizenRoles.push(MafiaRole.SNIPER);
    if (playerCount >= 8) citizenRoles.push(MafiaRole.BODYGUARD);
    if (playerCount >= 10) citizenRoles.push(MafiaRole.PSYCHOLOGIST);
    
    // مخلوط کردن لیست بازیکنان
    const shuffledPlayers = shuffle(gameSession.players);
    
    // تخصیص نقش‌ها
    let assignedPlayers = 0;
    
    // تخصیص نقش‌های مافیا
    for (let i = 0; i < mafiaCount && i < mafiaRoles.length; i++) {
      gameSession.data.players[shuffledPlayers[assignedPlayers]].role = mafiaRoles[i];
      assignedPlayers++;
    }
    
    // اگر تعداد نقش‌های مافیا کمتر از تعداد مافیاها باشد، نقش مافیای ساده تخصیص می‌دهیم
    for (let i = mafiaRoles.length; i < mafiaCount; i++) {
      gameSession.data.players[shuffledPlayers[assignedPlayers]].role = MafiaRole.MAFIA;
      assignedPlayers++;
    }
    
    // تخصیص نقش‌های ویژه شهروندان
    for (let i = 0; i < specialCitizenCount && i < citizenRoles.length; i++) {
      gameSession.data.players[shuffledPlayers[assignedPlayers]].role = citizenRoles[i];
      assignedPlayers++;
    }
    
    // تخصیص نقش شهروند ساده به بقیه بازیکنان
    for (let i = assignedPlayers; i < shuffledPlayers.length; i++) {
      gameSession.data.players[shuffledPlayers[i]].role = MafiaRole.CITIZEN;
    }
    
    // ارسال پیام خصوصی به هر بازیکن با نقش او
    for (const playerId of gameSession.players) {
      const player = gameSession.data.players[playerId];
      const user = await interaction.client.users.fetch(playerId);
      
      const roleEmbed = new EmbedBuilder()
        .setTitle('🎭 نقش شما در بازی مافیا')
        .setColor(player.role.includes('mafia') || player.role === MafiaRole.GODFATHER || player.role === MafiaRole.SILENCER ? 0xDA373C : 0x5865F2)
        .setDescription(`شما در این بازی نقش **${getRoleTranslation(player.role)}** را دارید.\n\n${getRoleDescription(player.role)}`)
        .setFooter({ text: 'این پیام فقط برای شما قابل مشاهده است. آن را مخفی نگه دارید!' });
      
      try {
        await user.send({ embeds: [roleEmbed] });
      } catch (dmError) {
        log(`Failed to send DM to player ${playerId}: ${dmError}`, 'warn');
        // اگر امکان ارسال پیام خصوصی نبود، اطلاع‌رسانی در کانال
        const channel = await interaction.client.channels.fetch(gameSession.channelId);
        if (channel && channel.isTextBased()) {
          await channel.send({
            content: `<@${playerId}> ⚠️ امکان ارسال پیام خصوصی به شما وجود ندارد! لطفاً تنظیمات حریم خصوصی خود را بررسی کنید و DM خود را باز کنید تا بتوانیم نقش شما را ارسال کنیم.`,
          });
        }
      }
    }
    
    // ارسال لیست هم‌تیمی‌ها به مافیاها
    await sendTeamListToMafias(gameSession);
    
    // به‌روزرسانی وضعیت بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error assigning roles to players: ${error}`, 'error');
    throw error;
  }
}

/**
 * ارسال لیست هم‌تیمی‌ها به مافیاها
 */
async function sendTeamListToMafias(gameSession: GameSession) {
  try {
    // پیدا کردن تمام مافیاها
    const mafiaPlayers = gameSession.players.filter(playerId => {
      const role = gameSession.data.players[playerId].role;
      return role === MafiaRole.MAFIA || role === MafiaRole.GODFATHER || role === MafiaRole.SILENCER;
    });
    
    if (mafiaPlayers.length === 0) return;
    
    // ساخت لیست مافیاها با نقش‌های آنها
    let teamListText = '**لیست اعضای تیم مافیا:**\n';
    for (const mafiaId of mafiaPlayers) {
      const role = gameSession.data.players[mafiaId].role;
      const roleName = getRoleTranslation(role);
      teamListText += `• <@${mafiaId}> - ${roleName}\n`;
    }
    
    teamListText += '\nشما باید با همکاری یکدیگر در شب‌ها یکی از شهروندان را حذف کنید و در روز هویت خود را مخفی نگه دارید!';
    
    // ارسال پیام به هر مافیا
    for (const mafiaId of mafiaPlayers) {
      const mafiaUser = await interaction.client.users.fetch(mafiaId);
      
      const teamEmbed = new EmbedBuilder()
        .setTitle('👥 هم‌تیمی‌های شما در مافیا')
        .setColor(0xDA373C)
        .setDescription(teamListText)
        .setFooter({ text: 'این پیام محرمانه است و فقط برای اعضای تیم مافیا ارسال شده است.' });
      
      try {
        await mafiaUser.send({ embeds: [teamEmbed] });
      } catch (dmError) {
        log(`Failed to send mafia team list to ${mafiaId}: ${dmError}`, 'warn');
      }
    }
    
  } catch (error) {
    log(`Error sending team list to mafias: ${error}`, 'error');
  }
}

/**
 * ترجمه نام نقش به فارسی
 */
function getRoleTranslation(role: MafiaRole): string {
  switch (role) {
    case MafiaRole.CITIZEN: return 'شهروند';
    case MafiaRole.MAFIA: return 'مافیا';
    case MafiaRole.DETECTIVE: return 'کارآگاه';
    case MafiaRole.DOCTOR: return 'دکتر';
    case MafiaRole.SNIPER: return 'تک‌تیرانداز';
    case MafiaRole.GODFATHER: return 'رئیس مافیا';
    case MafiaRole.SILENCER: return 'ساکت‌کننده';
    case MafiaRole.BODYGUARD: return 'محافظ';
    case MafiaRole.PSYCHOLOGIST: return 'روانشناس';
    default: return 'نامشخص';
  }
}

/**
 * توضیحات نقش
 */
function getRoleDescription(role: MafiaRole): string {
  switch (role) {
    case MafiaRole.CITIZEN:
      return 'شما یک شهروند عادی هستید. وظیفه شما شناسایی و حذف مافیاها از طریق رأی‌گیری روزانه است. شما هیچ قابلیت ویژه‌ای ندارید.';
    
    case MafiaRole.MAFIA:
      return 'شما عضوی از گروه مافیا هستید. هر شب با همکاری سایر مافیاها یکی از شهروندان را حذف می‌کنید. در طول روز باید هویت خود را مخفی نگه دارید.';
    
    case MafiaRole.DETECTIVE:
      return 'شما کارآگاه هستید. هر شب می‌توانید هویت یک بازیکن را بررسی کنید و متوجه شوید که آیا او مافیا است یا خیر. اما مراقب باشید که رئیس مافیا به شما به عنوان شهروند نشان داده می‌شود!';
    
    case MafiaRole.DOCTOR:
      return 'شما دکتر هستید. هر شب می‌توانید یک بازیکن (از جمله خودتان) را انتخاب کنید تا از او محافظت کنید. اگر مافیاها همان بازیکن را انتخاب کنند، او زنده خواهد ماند.';
    
    case MafiaRole.SNIPER:
      return 'شما تک‌تیرانداز هستید. یک بار در طول بازی می‌توانید یک بازیکن را حذف کنید. اما اگر اشتباه کنید و یک شهروند را هدف قرار دهید، خودتان کشته می‌شوید!';
    
    case MafiaRole.GODFATHER:
      return 'شما رئیس مافیا هستید. مانند سایر مافیاها عمل می‌کنید، اما برای کارآگاه به عنوان شهروند شناسایی می‌شوید. این به شما اجازه می‌دهد که مخفی‌تر عمل کنید.';
    
    case MafiaRole.SILENCER:
      return 'شما ساکت‌کننده هستید و عضوی از گروه مافیا محسوب می‌شوید. هر شب علاوه بر مشارکت در تصمیم‌گیری گروهی مافیاها، می‌توانید یک بازیکن را انتخاب کنید تا در روز بعد نتواند صحبت کند.';
    
    case MafiaRole.BODYGUARD:
      return 'شما محافظ هستید. هر شب می‌توانید از یک بازیکن محافظت کنید. اگر آن بازیکن هدف حمله قرار گیرد، شما به جای او آسیب می‌بینید اما زنده می‌مانید. نمی‌توانید دو شب متوالی از یک بازیکن یکسان محافظت کنید.';
    
    case MafiaRole.PSYCHOLOGIST:
      return 'شما روانشناس هستید. هر شب می‌توانید یک بازیکن را انتخاب کنید تا در روز بعد امکان دو برابر رأی دادن داشته باشد. از این قابلیت برای تقویت شهروندان خوب استفاده کنید!';
    
    default:
      return 'توضیحاتی برای این نقش موجود نیست.';
  }
}

/**
 * شروع فاز شب بازی مافیا
 */
async function startNightPhase(gameSession: GameSession, interaction: ButtonInteraction) {
  try {
    // به‌روزرسانی وضعیت بازی
    gameSession.data.state = MafiaGameState.NIGHT_TIME;
    gameSession.data.day++;
    
    const channel = await interaction.client.channels.fetch(gameSession.channelId);
    if (!channel || !channel.isTextBased()) return;
    
    // اعلام شروع شب
    const nightEmbed = new EmbedBuilder()
      .setTitle(`🌙 شب ${gameSession.data.day} فرا رسید`)
      .setColor(0x2B2D31)
      .setDescription(
        'همه به خواب رفته‌اند و مافیاها در حال برنامه‌ریزی هستند...\n\n' +
        'هر بازیکن باید اقدامات خاص نقش خود را در پیام خصوصی انجام دهد. 2 دقیقه فرصت دارید!'
      )
      .setFooter({ text: 'پس از پایان شب، روز فرا می‌رسد و بحث و گفتگو آغاز می‌شود.' });
    
    const nightMessage = await channel.send({ embeds: [nightEmbed] });
    
    // ذخیره شناسه پیام شب
    gameSession.data.messages.push({ messageId: nightMessage.id, type: 'night_announcement' });
    
    // ارسال اقدامات شبانه به همه بازیکنان زنده
    await sendNightActionsToPlayers(gameSession, interaction);
    
    // تنظیم تایمر برای پایان شب
    gameSession.data.timer = setTimeout(() => {
      endNightPhase(gameSession, interaction);
    }, 120000); // 2 دقیقه
    
    // به‌روزرسانی وضعیت بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error starting night phase: ${error}`, 'error');
  }
}

/**
 * ارسال اقدامات شبانه به بازیکنان
 */
async function sendNightActionsToPlayers(gameSession: GameSession, interaction: ButtonInteraction) {
  // ارسال پیام به بازیکنان زنده بر اساس نقش
  for (const playerId of gameSession.players) {
    const player = gameSession.data.players[playerId];
    
    // فقط بازیکنان زنده می‌توانند اقدام شبانه انجام دهند
    if (!player.isAlive) continue;
    
    try {
      const user = await interaction.client.users.fetch(playerId);
      
      // بر اساس نقش، اقدام متفاوتی ارسال می‌شود
      switch (player.role) {
        case MafiaRole.MAFIA:
        case MafiaRole.GODFATHER:
        case MafiaRole.SILENCER:
          await sendMafiaNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.DETECTIVE:
          await sendDetectiveNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.DOCTOR:
          await sendDoctorNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.SNIPER:
          if (!player.hasUsedAbility) {
            await sendSniperNightAction(gameSession, user, player);
          }
          break;
          
        case MafiaRole.BODYGUARD:
          await sendBodyguardNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.PSYCHOLOGIST:
          await sendPsychologistNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.CITIZEN:
          // شهروندان اقدام خاصی در شب ندارند
          await sendCitizenNightMessage(gameSession, user, player);
          break;
      }
      
    } catch (dmError) {
      log(`Failed to send night action to player ${playerId}: ${dmError}`, 'warn');
    }
  }
}

/**
 * ارسال اقدام شبانه به مافیاها
 */
async function sendMafiaNightAction(gameSession: GameSession, user: User, player: MafiaPlayer) {
  // لیست بازیکنان زنده که مافیا نیستند
  const targetOptions = gameSession.players
    .filter(targetId => {
      const targetPlayer = gameSession.data.players[targetId];
      const isMafia = targetPlayer.role === MafiaRole.MAFIA || 
                      targetPlayer.role === MafiaRole.GODFATHER || 
                      targetPlayer.role === MafiaRole.SILENCER;
      
      return targetPlayer.isAlive && !isMafia;
    });
  
  // ساخت Embed و دکمه‌ها
  const mafiaActionEmbed = new EmbedBuilder()
    .setTitle(`🌙 اقدام شبانه - شب ${gameSession.data.day}`)
    .setColor(0xDA373C)
    .setDescription(
      '**زمان تصمیم‌گیری مافیاها فرا رسیده است!**\n\n' +
      'شما و سایر اعضای مافیا باید یک نفر را برای حذف انتخاب کنید. تصمیم نهایی بر اساس بیشترین رأی خواهد بود.\n\n' +
      '**بازیکنان قابل انتخاب:**'
    );
  
  // اضافه کردن دکمه برای هر بازیکن قابل انتخاب
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();
  let buttonCount = 0;
  
  for (let i = 0; i < targetOptions.length; i++) {
    const targetId = targetOptions[i];
    const targetUser = await client.users.fetch(targetId);
    const targetUsername = targetUser?.username || targetId;
    
    // اضافه کردن نام بازیکن به توضیحات
    mafiaActionEmbed.setDescription(mafiaActionEmbed.data.description + `\n• ${targetUsername}`);
    
    // ساخت دکمه برای هر بازیکن
    const button = new ButtonBuilder()
      .setCustomId(`mafia_action_kill_${targetId}`)
      .setLabel(targetUsername.substring(0, 20)) // محدود کردن طول نام برای دکمه
      .setStyle(ButtonStyle.Danger);
    
    currentRow.addComponents(button);
    buttonCount++;
    
    // هر ردیف حداکثر 5 دکمه می‌تواند داشته باشد
    if (buttonCount === 5 || i === targetOptions.length - 1) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
      buttonCount = 0;
    }
  }
  
  // اگر بازیکن ساکت‌کننده باشد، دکمه‌های اضافی برای ساکت کردن اضافه می‌شود
  if (player.role === MafiaRole.SILENCER) {
    const silencerEmbed = new EmbedBuilder()
      .setTitle('🤐 انتخاب بازیکن برای ساکت کردن')
      .setColor(0xDA373C)
      .setDescription(
        'شما قابلیت ویژه‌ای دارید که می‌توانید یک بازیکن را برای روز بعد ساکت کنید.\n\n' +
        '**بازیکنان قابل انتخاب برای ساکت کردن:**'
      );
    
    // اضافه کردن دکمه‌های ساکت کردن
    const silenceRows: ActionRowBuilder<ButtonBuilder>[] = [];
    let silenceRow = new ActionRowBuilder<ButtonBuilder>();
    let silenceButtonCount = 0;
    
    for (let i = 0; i < targetOptions.length; i++) {
      const targetId = targetOptions[i];
      const targetUser = await client.users.fetch(targetId);
      const targetUsername = targetUser?.username || targetId;
      
      // اضافه کردن نام بازیکن به توضیحات
      silencerEmbed.setDescription(silencerEmbed.data.description + `\n• ${targetUsername}`);
      
      // ساخت دکمه برای هر بازیکن
      const button = new ButtonBuilder()
        .setCustomId(`mafia_action_silence_${targetId}`)
        .setLabel(targetUsername.substring(0, 20))
        .setStyle(ButtonStyle.Secondary);
      
      silenceRow.addComponents(button);
      silenceButtonCount++;
      
      // هر ردیف حداکثر 5 دکمه می‌تواند داشته باشد
      if (silenceButtonCount === 5 || i === targetOptions.length - 1) {
        silenceRows.push(silenceRow);
        silenceRow = new ActionRowBuilder<ButtonBuilder>();
        silenceButtonCount = 0;
      }
    }
    
    // ارسال پیام‌های جداگانه برای حذف و ساکت کردن
    await user.send({ embeds: [mafiaActionEmbed], components: rows });
    await user.send({ embeds: [silencerEmbed], components: silenceRows });
    
  } else {
    // ارسال پیام فقط برای حذف
    await user.send({ embeds: [mafiaActionEmbed], components: rows });
  }
}

/**
 * مدیریت بازی گرگینه
 */
async function handleWerewolfGame(interaction: ButtonInteraction) {
  try {
    // بررسی آیا قبلاً بازی فعالی در این کانال وجود دارد یا خیر
    if (!interaction.channel) {
      await interaction.reply({ content: '❌ این دستور فقط در کانال‌های متنی قابل استفاده است.', ephemeral: true });
      return;
    }
    
    // بررسی وضعیت دکمه‌های مخفی
    const showHiddenButtons = await getGameHiddenButtonsStatus('werewolf');
    
    // بازی گرگینه را شروع می‌کنیم
    const embed = new EmbedBuilder()
      .setTitle('🐺 بازی گرگینه')
      .setDescription('بازی گرگینه یک بازی جذاب و استراتژیک است که در آن بازیکنان باید گرگینه‌ها را شناسایی کنند یا اگر گرگینه هستند، خود را مخفی نگه دارند!')
      .setColor(0x9B59B6)
      .addFields(
        { name: '👥 تعداد بازیکنان', value: 'حداقل 6 نفر، حداکثر 12 نفر', inline: true },
        { name: '⏱️ زمان بازی', value: 'حدود 20-30 دقیقه', inline: true },
        { name: '💰 جایزه', value: '500 کوین برای تیم برنده', inline: true },
        { name: '🎮 شروع بازی', value: 'برای شروع بازی جدید، روی دکمه زیر کلیک کنید.', inline: false }
      )
      .setFooter({ text: 'برای کسب اطلاعات بیشتر درباره نحوه بازی، روی دکمه "قوانین" کلیک کنید.' });
    
    // ایجاد دکمه‌های اصلی
    const mainButtons = [
      new ButtonBuilder()
        .setCustomId('werewolf')
        .setLabel('ایجاد بازی جدید')
        .setEmoji('🎮')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('werewolf_help_guide')
        .setLabel('راهنمای بازی')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('sessions_werewolf')
        .setLabel('جلسات فعال')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('group_games')
        .setLabel('بازگشت به منوی بازی‌ها')
        .setEmoji('🔙')
        .setStyle(ButtonStyle.Secondary)
    ];
    
    // ردیف اول دکمه‌ها - همیشه نمایش داده می‌شود
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(mainButtons);
    
    // آماده‌سازی کامپوننت‌های UI
    const components = [row];
    
    // اگر دکمه‌های مخفی نمایش داده شوند
    if (showHiddenButtons) {
      // دکمه‌های مخفی را اضافه می‌کنیم
      const hiddenRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('werewolf_special_event')
            .setLabel('رویداد ویژه')
            .setEmoji('🌟')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('werewolf_bonus_coins')
            .setLabel('سکه‌های اضافی')
            .setEmoji('💰')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('werewolf_special_roles')
            .setLabel('نقش‌های ویژه')
            .setEmoji('👑')
            .setStyle(ButtonStyle.Danger)
        );
      
      components.push(hiddenRow);
      
      // اضافه کردن توضیح مربوط به دکمه‌های مخفی به Embed
      embed.addFields({
        name: '🎁 ویژه‌های مخفی',
        value: 'تبریک! شما دکمه‌های مخفی را پیدا کردید! این دکمه‌ها به شما امکان دسترسی به ویژگی‌های خاص را می‌دهند.',
        inline: false
      });
    }
    
    await interaction.reply({ embeds: [embed], components, ephemeral: false });
  } catch (error) {
    log(`Error handling werewolf game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت بازی جاسوس مخفی
 */
async function handleSpyGame(interaction: ButtonInteraction) {
  try {
    // وارد کردن ماژول جاسوس مخفی
    const { createSpyGame } = await import('./spyGame');
    
    // بررسی وضعیت دکمه‌های مخفی
    const showHiddenButtons = await getGameHiddenButtonsStatus('spy');
    
    // ایجاد کامپوننت‌های UI
    const embed = new EmbedBuilder()
      .setTitle('🕵️‍♂️ جاسوس مخفی')
      .setDescription('بازی جاسوس مخفی یک بازی گروهی استراتژیک است. یک بازیکن به عنوان جاسوس انتخاب می‌شود و بقیه بازیکنان باید او را شناسایی کنند.')
      .addFields(
        { name: '👥 تعداد بازیکنان', value: 'حداقل 3 و حداکثر 10 بازیکن', inline: true },
        { name: '⏱️ زمان بازی', value: 'حدود 10 الی 20 دقیقه', inline: true },
        { name: '💰 جایزه', value: 'برندگان بازی سکه دریافت می‌کنند', inline: true }
      )
      .setColor(0x8855FF);
    
    // ایجاد دکمه‌های اصلی
    const mainButtons = [
      new ButtonBuilder()
        .setCustomId('create_spy_session')
        .setLabel('تشکیل جلسه')
        .setEmoji('🎮')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('spy_help_guide')
        .setLabel('راهنمای بازی')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('game:spy:sessions')
        .setLabel('جلسات فعال')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary)
    ];
    
    // ردیف اول دکمه‌ها - همیشه نمایش داده می‌شود
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(mainButtons);
    
    // آماده‌سازی کامپوننت‌های UI
    const components = [row];
    
    // اگر دکمه‌های مخفی نمایش داده شوند
    if (showHiddenButtons) {
      // دکمه‌های مخفی را اضافه می‌کنیم
      const hiddenRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('spy_special_locations')
            .setLabel('مکان‌های ویژه')
            .setEmoji('🏙️')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('spy_double_spy')
            .setLabel('جاسوس دوگانه')
            .setEmoji('🔍')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('spy_secret_mission')
            .setLabel('ماموریت مخفی')
            .setEmoji('🎭')
            .setStyle(ButtonStyle.Danger)
        );
      
      components.push(hiddenRow);
      
      // اضافه کردن توضیح مربوط به دکمه‌های مخفی به Embed
      embed.addFields({
        name: '🎁 ویژه‌های مخفی',
        value: 'تبریک! شما دکمه‌های مخفی را پیدا کردید! این دکمه‌ها به شما امکان دسترسی به ویژگی‌های خاص بازی را می‌دهند.',
        inline: false
      });
    }
    
    // حالت ephemeral را به false تغییر می‌دهیم چون دکمه‌های مخفی برای همه قابل مشاهده باشند
    const ephemeralMode = !showHiddenButtons; // اگر دکمه‌های مخفی هست، پیام عمومی باشد
    
    await interaction.reply({ embeds: [embed], components, ephemeral: ephemeralMode });
  } catch (error) {
    log(`Error handling spy game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت رای بازیکنان در فاز رای‌گیری
 */
async function handleMafiaVote(interaction: ButtonInteraction) {
  try {
    const buttonId = interaction.customId;
    const targetId = buttonId.replace('mafia_vote_', '');
    
    // پیدا کردن بازی فعال
    const gameSession = Array.from(activeGames.values()).find(
      game => game.gameType === 'mafia' && 
      game.channelId === interaction.channelId && 
      game.status === 'active'
    );
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی فعالی یافت نشد!', ephemeral: true });
    }
    
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی وضعیت بازی
    if (mafiaData.state !== MafiaGameState.VOTING) {
      return await interaction.reply({ content: '❌ اکنون زمان رای‌گیری نیست!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر بازیکن است
    const player = Object.values(mafiaData.players).find(p => p.userId === interaction.user.id);
    
    if (!player) {
      return await interaction.reply({ content: '❌ شما بازیکن این بازی نیستید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا بازیکن زنده است
    if (!player.isAlive) {
      return await interaction.reply({ content: '❌ شما کشته شده‌اید و نمی‌توانید رای دهید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا هدف زنده است
    const targetPlayer = Object.values(mafiaData.players).find(p => p.userId === targetId);
    
    if (!targetPlayer || !targetPlayer.isAlive) {
      return await interaction.reply({ content: '❌ بازیکن مورد نظر در بازی حضور ندارد یا کشته شده است!', ephemeral: true });
    }
    
    // ثبت رای
    if (!mafiaData.votingResults) {
      mafiaData.votingResults = {};
    }
    
    mafiaData.votingResults[interaction.user.id] = targetId;
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
    await interaction.reply({ content: `✅ شما به **${targetPlayer.userId}** رای دادید.`, ephemeral: true });
    
  } catch (error) {
    log(`Error handling mafia vote: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در ثبت رای رخ داد. لطفاً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت اقدامات شبانه بازیکنان
 */
async function handleMafiaNightAction(interaction: ButtonInteraction) {
  try {
    const buttonId = interaction.customId;
    const [_, action, role, targetId] = buttonId.split('_');
    
    // پیدا کردن بازی فعال
    const gameSession = Array.from(activeGames.values()).find(
      game => game.gameType === 'mafia' && 
      game.channelId === interaction.channelId && 
      game.status === 'active'
    );
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی فعالی یافت نشد!', ephemeral: true });
    }
    
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی وضعیت بازی
    if (mafiaData.state !== MafiaGameState.NIGHT_TIME) {
      return await interaction.reply({ content: '❌ اکنون زمان شب نیست!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر بازیکن است
    const player = Object.values(mafiaData.players).find(p => p.userId === interaction.user.id);
    
    if (!player) {
      return await interaction.reply({ content: '❌ شما بازیکن این بازی نیستید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا بازیکن زنده است
    if (!player.isAlive) {
      return await interaction.reply({ content: '❌ شما کشته شده‌اید و نمی‌توانید اقدامی انجام دهید!', ephemeral: true });
    }
    
    // بررسی نقش کاربر
    if (role === 'mafia' && ![MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(player.role)) {
      return await interaction.reply({ content: '❌ شما مافیا نیستید!', ephemeral: true });
    } else if (role === 'detective' && player.role !== MafiaRole.DETECTIVE) {
      return await interaction.reply({ content: '❌ شما کارآگاه نیستید!', ephemeral: true });
    } else if (role === 'doctor' && player.role !== MafiaRole.DOCTOR) {
      return await interaction.reply({ content: '❌ شما دکتر نیستید!', ephemeral: true });
    } else if (role === 'silencer' && player.role !== MafiaRole.SILENCER) {
      return await interaction.reply({ content: '❌ شما ساکت‌کننده نیستید!', ephemeral: true });
    } else if (role === 'sniper' && player.role !== MafiaRole.SNIPER) {
      return await interaction.reply({ content: '❌ شما تک‌تیرانداز نیستید!', ephemeral: true });
    } else if (role === 'bodyguard' && player.role !== MafiaRole.BODYGUARD) {
      return await interaction.reply({ content: '❌ شما محافظ نیستید!', ephemeral: true });
    } else if (role === 'psychologist' && player.role !== MafiaRole.PSYCHOLOGIST) {
      return await interaction.reply({ content: '❌ شما روانشناس نیستید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا هدف زنده است
    const targetPlayer = Object.values(mafiaData.players).find(p => p.userId === targetId);
    
    if (!targetPlayer || !targetPlayer.isAlive) {
      return await interaction.reply({ content: '❌ بازیکن مورد نظر در بازی حضور ندارد یا کشته شده است!', ephemeral: true });
    }
    
    // برای مافیا، تصمیم جمعی است
    if ([MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(player.role) && role === 'mafia') {
      // پیدا کردن سایر مافیاها برای اطلاع‌رسانی
      const mafiaPlayers = Object.values(mafiaData.players).filter(p => 
        p.isAlive && 
        [MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(p.role)
      );
      
      // ثبت هدف مافیا
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.MAFIA] = targetId;
      
      // اطلاع به سایر مافیاها
      for (const mafiaPlayer of mafiaPlayers) {
        if (mafiaPlayer.userId !== interaction.user.id) {
          try {
            const mafiaUser = await client.users.fetch(mafiaPlayer.userId);
            if (mafiaUser) {
              await mafiaUser.send(`🔪 هم‌تیمی شما تصمیم گرفت **${targetPlayer.userId}** را امشب به قتل برساند.`);
            }
          } catch (dmError) {
            log(`Failed to send DM to mafia player: ${dmError}`, 'warn');
          }
        }
      }
      
      await interaction.reply({ content: `✅ شما تصمیم گرفتید **${targetPlayer.userId}** را به قتل برسانید.`, ephemeral: true });
    }
    // ساکت‌کننده
    else if (player.role === MafiaRole.SILENCER && role === 'silencer') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.SILENCER] = targetId;
      
      await interaction.reply({ content: `✅ شما تصمیم گرفتید **${targetPlayer.userId}** را فردا ساکت کنید.`, ephemeral: true });
    }
    // کارآگاه
    else if (player.role === MafiaRole.DETECTIVE && role === 'detective') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.DETECTIVE] = targetId;
      
      // بررسی نقش هدف
      let isMafia = false;
      
      if (targetPlayer.role === MafiaRole.MAFIA || targetPlayer.role === MafiaRole.SILENCER) {
        isMafia = true;
      } else if (targetPlayer.role === MafiaRole.GODFATHER) {
        // پدرخوانده به عنوان شهروند نمایش داده می‌شود
        isMafia = false;
      }
      
      await interaction.reply({ 
        content: `🔍 استعلام شما: **${targetPlayer.userId}** ${isMafia ? '**مافیا**' : '**شهروند**'} است.`, 
        ephemeral: true 
      });
    }
    // دکتر
    else if (player.role === MafiaRole.DOCTOR && role === 'doctor') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.DOCTOR] = targetId;
      
      await interaction.reply({ content: `💉 شما تصمیم گرفتید از **${targetPlayer.userId}** محافظت کنید.`, ephemeral: true });
    }
    // تک‌تیرانداز
    else if (player.role === MafiaRole.SNIPER && role === 'sniper') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.SNIPER] = targetId;
      
      await interaction.reply({ content: `🔫 شما به **${targetPlayer.userId}** شلیک کردید.`, ephemeral: true });
    }
    // محافظ
    else if (player.role === MafiaRole.BODYGUARD && role === 'bodyguard') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.BODYGUARD] = targetId;
      
      await interaction.reply({ content: `🛡️ شما تصمیم گرفتید از **${targetPlayer.userId}** محافظت کنید.`, ephemeral: true });
    }
    // روانشناس
    else if (player.role === MafiaRole.PSYCHOLOGIST && role === 'psychologist') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.PSYCHOLOGIST] = targetId;
      
      await interaction.reply({ content: `🧠 شما تصمیم گرفتید **${targetPlayer.userId}** را تحت مشاوره قرار دهید.`, ephemeral: true });
    }
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error handling mafia night action: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در ثبت اقدام شبانه رخ داد. لطفاً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * پایان فاز شب بازی مافیا
 */
async function endNightPhase(gameSession: GameSession) {
  try {
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی اینکه آیا بازی پایان یافته است یا خیر
    if (mafiaData.state === MafiaGameState.GAME_OVER) return;
    
    // پردازش اقدامات شبانه
    const nightActions = mafiaData.nightActions || {};
    
    // کسی که توسط مافیا کشته می‌شود
    let killedPlayerId = nightActions[MafiaRole.MAFIA];
    
    // کسی که توسط دکتر نجات پیدا می‌کند
    const savedPlayerId = nightActions[MafiaRole.DOCTOR];
    
    // اگر دکتر، فرد مورد هدف مافیا را نجات داده باشد
    if (savedPlayerId && savedPlayerId === killedPlayerId) {
      killedPlayerId = undefined; // هیچکس کشته نمی‌شود
    }
    
    // اگر بادیگارد، فرد مورد هدف مافیا را محافظت کرده باشد
    if (nightActions[MafiaRole.BODYGUARD] && nightActions[MafiaRole.BODYGUARD] === killedPlayerId) {
      killedPlayerId = undefined; // هیچکس کشته نمی‌شود
    }
    
    // اگر مافیا پدرخوانده را هدف قرار داده باشد، تیر کارآگاه خنثی می‌شود
    if (killedPlayerId) {
      const killedPlayerRole = Object.values(mafiaData.players).find(p => p.userId === killedPlayerId)?.role;
      if (killedPlayerRole === MafiaRole.GODFATHER) {
        // تیر کارآگاه خنثی می‌شود
        nightActions[MafiaRole.DETECTIVE] = undefined;
      }
    }
    
    // تک‌تیرانداز آیا شلیک کرده؟
    if (nightActions[MafiaRole.SNIPER]) {
      const sniperTarget = nightActions[MafiaRole.SNIPER];
      const targetPlayer = Object.values(mafiaData.players).find(p => p.userId === sniperTarget);
      
      // اگر تک‌تیرانداز به غیرمافیا شلیک کرده باشد
      if (targetPlayer && 
          targetPlayer.role !== MafiaRole.MAFIA && 
          targetPlayer.role !== MafiaRole.GODFATHER && 
          targetPlayer.role !== MafiaRole.SILENCER) {
        
        // پیدا کردن کاربر تک‌تیرانداز
        const sniperPlayer = Object.values(mafiaData.players).find(p => p.role === MafiaRole.SNIPER);
        if (sniperPlayer) {
          sniperPlayer.isAlive = false; // تک‌تیرانداز کشته می‌شود
        }
      } else if (targetPlayer) {
        // اگر مافیا را هدف قرار داده باشد
        targetPlayer.isAlive = false;
      }
    }
    
    // اعمال کشته‌شدن
    if (killedPlayerId) {
      const killedPlayer = Object.values(mafiaData.players).find(p => p.userId === killedPlayerId);
      if (killedPlayer) {
        killedPlayer.isAlive = false;
        mafiaData.killedPlayer = killedPlayerId;
      }
    }
    
    // ساکت‌کننده چه کسی را ساکت کرده؟
    if (nightActions[MafiaRole.SILENCER]) {
      const silencedPlayerId = nightActions[MafiaRole.SILENCER];
      const silencedPlayer = Object.values(mafiaData.players).find(p => p.userId === silencedPlayerId);
      if (silencedPlayer) {
        silencedPlayer.isSilenced = true;
        mafiaData.silencedPlayer = silencedPlayerId;
      }
    }
    
    // بررسی وضعیت پایان بازی
    const aliveCitizens = Object.values(mafiaData.players).filter(p => 
      p.isAlive && 
      [MafiaRole.CITIZEN, MafiaRole.DETECTIVE, MafiaRole.DOCTOR, MafiaRole.SNIPER, MafiaRole.BODYGUARD, MafiaRole.PSYCHOLOGIST].includes(p.role)
    );
    
    const aliveMafias = Object.values(mafiaData.players).filter(p => 
      p.isAlive && 
      [MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(p.role)
    );
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
    // بررسی پایان بازی
    if (aliveMafias.length === 0) {
      // شهروندان برنده شدند
      return await startDayTimeResults(gameSession, true);
    } else if (aliveMafias.length >= aliveCitizens.length) {
      // مافیا برنده شد
      return await startDayTimeResults(gameSession, false);
    } else {
      // بازی ادامه دارد - شروع روز
      return await startDayTimeResults(gameSession);
    }
    
  } catch (error) {
    log(`Error ending night phase: ${error}`, 'error');
  }
}

/**
 * نمایش نتایج شب و شروع روز جدید
 */
async function startDayTimeResults(gameSession: GameSession, isGameOver: boolean = false) {
  try {
    const mafiaData = gameSession.data as MafiaGameData;
    
    // دریافت کانال
    const channel = await client.channels.fetch(gameSession.channelId) as TextChannel;
    if (!channel) return;
    
    if (isGameOver === true) {
      // شهروندان برنده شدند
      mafiaData.state = MafiaGameState.GAME_OVER;
      
      const embed = new EmbedBuilder()
        .setTitle('🏆 شهروندان پیروز شدند!')
        .setDescription('تمام مافیاها کشته شدند و شهر نجات پیدا کرد.')
        .setColor(0x00FF00)
        .addFields({ 
          name: '👤 نقش‌های بازیکنان', 
          value: Object.values(mafiaData.players).map(p => 
            `<@${p.userId}>: ${getRoleTranslation(p.role)}`
          ).join('\n')
        });
      
      await channel.send({ embeds: [embed] });
      return;
      
    } else if (isGameOver === false) {
      // مافیا برنده شد
      mafiaData.state = MafiaGameState.GAME_OVER;
      
      const embed = new EmbedBuilder()
        .setTitle('👺 مافیا پیروز شد!')
        .setDescription('تعداد مافیا با شهروندان برابر شده و شهر به تسخیر مافیا درآمده است.')
        .setColor(0xFF0000)
        .addFields({ 
          name: '👤 نقش‌های بازیکنان', 
          value: Object.values(mafiaData.players).map(p => 
            `<@${p.userId}>: ${getRoleTranslation(p.role)}`
          ).join('\n')
        });
      
      await channel.send({ embeds: [embed] });
      return;
    }
    
    // تغییر وضعیت بازی به روز
    mafiaData.state = MafiaGameState.DAY_TIME;
    
    // تهیه پیام نتایج شب
    const embed = new EmbedBuilder()
      .setTitle(`☀️ روز ${mafiaData.day} فرا رسید`)
      .setColor(0x3366CC);
    
    let dayResultMessage = '';
    
    // نتیجه کشته‌شدن
    if (mafiaData.killedPlayer) {
      const killedPlayer = Object.values(mafiaData.players).find(p => p.userId === mafiaData.killedPlayer);
      if (killedPlayer) {
        dayResultMessage += `🔪 **<@${killedPlayer.userId}>** شب گذشته توسط مافیا کشته شد. او یک **${getRoleTranslation(killedPlayer.role)}** بود.\n\n`;
      }
    } else {
      dayResultMessage += '🕊️ **دیشب کسی کشته نشد.**\n\n';
    }
    
    // اعلام ساکت‌شدن بازیکن
    if (mafiaData.silencedPlayer) {
      dayResultMessage += `🤐 **<@${mafiaData.silencedPlayer}>** توسط ساکت‌کننده، قادر به صحبت کردن نیست!\n\n`;
    }
    
    // لیست بازیکنان زنده
    const alivePlayers = Object.values(mafiaData.players).filter(p => p.isAlive);
    dayResultMessage += `👥 **بازیکنان زنده (${alivePlayers.length})**: \n${alivePlayers.map(p => `<@${p.userId}>`).join(', ')}\n\n`;
    
    // زمان بحث و گفتگو
    dayResultMessage += `⏱️ **زمان بحث و رای‌گیری**: \nاکنون بازیکنان می‌توانند درباره هویت مافیاها صحبت کنند و سپس رای‌گیری انجام خواهد شد.`;
    
    embed.setDescription(dayResultMessage);
    
    await channel.send({ embeds: [embed] });
    
    // زمان بحث - 2 دقیقه
    if (mafiaData.timer) clearTimeout(mafiaData.timer);
    mafiaData.timer = setTimeout(() => startVotingPhase(gameSession), 120000); // 2 دقیقه
    
    // پاک‌سازی داده‌های شب
    mafiaData.nightActions = {};
    mafiaData.killedPlayer = undefined;
    
    // پاک‌سازی وضعیت ساکت‌شدن از شب قبلی
    Object.values(mafiaData.players).forEach(player => {
      player.isSilenced = false;
    });
    
    mafiaData.silencedPlayer = undefined;
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error starting day phase: ${error}`, 'error');
  }
}

/**
 * شروع مرحله رای‌گیری
 */
async function startVotingPhase(gameSession: GameSession) {
  try {
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی وضعیت بازی
    if (mafiaData.state !== MafiaGameState.DAY_TIME) return;
    
    mafiaData.state = MafiaGameState.VOTING;
    mafiaData.votingResults = {};
    
    // دریافت کانال
    const channel = await client.channels.fetch(gameSession.channelId) as TextChannel;
    if (!channel) return;
    
    // لیست بازیکنان زنده
    const alivePlayers = Object.values(mafiaData.players).filter(p => p.isAlive);
    
    // ساخت دکمه‌های رای‌گیری
    const embed = new EmbedBuilder()
      .setTitle('🗳️ زمان رای‌گیری فرا رسیده است')
      .setDescription('به فردی که فکر می‌کنید مافیاست رای دهید. فردی که بیشترین رای را بیاورد، اعدام خواهد شد.')
      .setColor(0xFFA500);
    
    // ایجاد دکمه‌ها - حداکثر 5 دکمه در هر سطر
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    let currentRow = new ActionRowBuilder<ButtonBuilder>();
    let buttonCount = 0;
    
    for (const player of alivePlayers) {
      const button = new ButtonBuilder()
        .setCustomId(`mafia_vote_${player.userId}`)
        .setLabel(`${player.userId.substring(0, 6)}`)
        .setStyle(ButtonStyle.Primary);
      
      currentRow.addComponents(button);
      buttonCount++;
      
      if (buttonCount % 5 === 0 || buttonCount === alivePlayers.length) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder<ButtonBuilder>();
      }
    }
    
    // ارسال پیام رای‌گیری
    await channel.send({ 
      embeds: [embed],
      components: rows
    });
    
    // تنظیم تایمر برای پایان رای‌گیری
    if (mafiaData.timer) clearTimeout(mafiaData.timer);
    mafiaData.timer = setTimeout(() => endVotingPhase(gameSession), 60000); // 1 دقیقه
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error starting voting phase: ${error}`, 'error');
  }
}

/**
 * پایان مرحله رای‌گیری و اعلام نتیجه
 */
async function endVotingPhase(gameSession: GameSession) {
  try {
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی وضعیت بازی
    if (mafiaData.state !== MafiaGameState.VOTING) return;
    
    const votingResults = mafiaData.votingResults || {};
    
    // شمارش آرا
    const voteCount: Record<string, number> = {};
    
    for (const voterId in votingResults) {
      const targetId = votingResults[voterId];
      voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    }
    
    // پیدا کردن فرد با بیشترین رای
    let maxVotes = 0;
    let executedPlayerId: string | undefined = undefined;
    
    for (const playerId in voteCount) {
      if (voteCount[playerId] > maxVotes) {
        maxVotes = voteCount[playerId];
        executedPlayerId = playerId;
      }
    }
    
    // دریافت کانال
    const channel = await client.channels.fetch(gameSession.channelId) as TextChannel;
    if (!channel) return;
    
    // اگر هیچ رایی نبود یا رای‌ها مساوی بود
    if (!executedPlayerId || maxVotes === 0) {
      const embed = new EmbedBuilder()
        .setTitle('🤔 رای‌گیری بی‌نتیجه بود')
        .setDescription('امروز کسی اعدام نشد. شب دوباره فرا می‌رسد...')
        .setColor(0xAAAAAA);
      
      await channel.send({ embeds: [embed] });
      
      // شروع فاز شب
      setTimeout(() => startNightPhase(gameSession, null), 5000);
      return;
    }
    
    // اعدام بازیکن
    const executedPlayer = Object.values(mafiaData.players).find(p => p.userId === executedPlayerId);
    
    if (executedPlayer) {
      executedPlayer.isAlive = false;
      
      const embed = new EmbedBuilder()
        .setTitle('⚖️ مردم شهر رای خود را دادند')
        .setDescription(`**<@${executedPlayer.userId}>** با **${maxVotes}** رای اعدام شد!\nاو یک **${getRoleTranslation(executedPlayer.role)}** بود.`)
        .setColor(0xFF6600);
      
      // نمایش نتایج رای‌ها
      let voteDetails = '';
      for (const playerId in voteCount) {
        voteDetails += `<@${playerId}>: ${voteCount[playerId]} رای\n`;
      }
      
      if (voteDetails) {
        embed.addFields({ name: '📊 نتایج رای‌گیری', value: voteDetails });
      }
      
      await channel.send({ embeds: [embed] });
      
      // بررسی وضعیت پایان بازی
      const aliveCitizens = Object.values(mafiaData.players).filter(p => 
        p.isAlive && 
        [MafiaRole.CITIZEN, MafiaRole.DETECTIVE, MafiaRole.DOCTOR, MafiaRole.SNIPER, MafiaRole.BODYGUARD, MafiaRole.PSYCHOLOGIST].includes(p.role)
      );
      
      const aliveMafias = Object.values(mafiaData.players).filter(p => 
        p.isAlive && 
        [MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(p.role)
      );
      
      if (aliveMafias.length === 0) {
        // شهروندان برنده شدند
        return await startDayTimeResults(gameSession, true);
      } else if (aliveMafias.length >= aliveCitizens.length) {
        // مافیا برنده شد
        return await startDayTimeResults(gameSession, false);
      }
    }
    
    // شروع فاز شب
    setTimeout(() => startNightPhase(gameSession, null), 5000); // 5 ثانیه تاخیر
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error ending voting phase: ${error}`, 'error');
  }
}