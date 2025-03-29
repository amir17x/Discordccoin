/**
 * بازی بینگو
 * 
 * در این بازی، هر بازیکن یک کارت ۵×۵ با اعداد تصادفی دریافت می‌کند
 * و ربات به صورت متناوب اعداد را اعلام می‌کند. اولین بازیکنی که بتواند
 * یک خط کامل (افقی، عمودی یا مورب) از اعداد را علامت بزند، برنده است.
 * 
 * @module bingoGame
 * @requires discord.js
 * @requires ../storage
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
  APIButtonComponent
} from 'discord.js';
import { Client } from 'discord.js';
import { log } from '../utils/logger';
import { storage } from '../../storage';
import { v4 as uuidv4 } from 'uuid';
import { GameSession } from '../../models/GameSession';
import { activeGames } from './groupGames';

/**
 * تنظیم کلاینت دیسکورد
 * @param discordClient نمونه کلاینت دیسکورد
 */
let client: Client;
export function setClient(discordClient: Client) {
  client = discordClient;
}

/**
 * تعریف ساختار کارت بینگو
 */
interface BingoCard {
  cardNumbers: number[][];
  markedNumbers: boolean[][];
}

/**
 * داده‌های اختصاصی بازی بینگو
 */
interface BingoGameData {
  cards: { [userId: string]: BingoCard };
  calledNumbers: number[];
  availableNumbers: number[];
  currentRound: number;
  maxRounds: number;
  timePerRound: number; // زمان هر دور به ثانیه
  winners: string[];
  lastNumberCalled?: number;
  lastNumberTime?: Date;
  timerInterval?: NodeJS.Timeout;
  waitingForNextNumber: boolean;
  bingoMessages: { messageId: string, channelId: string }[];
  reward: number;
  inProgress: boolean;
}

/**
 * تنظیمات پیش‌فرض بازی بینگو
 */
const DEFAULT_BINGO_SETTINGS = {
  timePerRound: 30, // ۳۰ ثانیه برای هر دور
  maxRounds: 25,    // حداکثر ۲۵ دور بازی
  reward: 200       // ۲۰۰ کوین جایزه
};

/**
 * رنگ‌های مورد استفاده در بازی بینگو
 */
const BINGO_COLORS = {
  primary: 0x9B59B6,      // بنفش برای رنگ اصلی
  success: 0x2ECC71,      // سبز برای موفقیت
  warning: 0xF1C40F,      // زرد برای هشدار
  danger: 0xE74C3C,       // قرمز برای خطر
  info: 0x3498DB,         // آبی برای اطلاعات
  waiting: 0xE67E22       // نارنجی برای حالت انتظار
};

/**
 * ساخت کارت بینگو با اعداد تصادفی
 * @returns کارت بینگو جدید
 */
function generateBingoCard(): BingoCard {
  // ایجاد آرایه‌ای از اعداد ۱ تا ۲۵
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  
  // تصادفی کردن اعداد
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  
  // ایجاد کارت ۵×۵
  const cardNumbers: number[][] = [];
  for (let i = 0; i < 5; i++) {
    cardNumbers.push(numbers.slice(i * 5, (i + 1) * 5));
  }
  
  // مرکز کارت به عنوان خانه رایگان (علامت‌زده شده) در نظر گرفته می‌شود
  const markedNumbers: boolean[][] = Array(5).fill(null).map(() => Array(5).fill(false));
  markedNumbers[2][2] = true; // مرکز کارت را علامت می‌زنیم
  
  return {
    cardNumbers,
    markedNumbers
  };
}

/**
 * بررسی وضعیت بینگو در کارت
 * @param card کارت بینگو
 * @returns آیا بازیکن بینگو دارد
 */
function checkForBingo(card: BingoCard): boolean {
  const { markedNumbers } = card;
  
  // بررسی سطرها
  for (let row = 0; row < 5; row++) {
    if (markedNumbers[row].every(marked => marked)) {
      return true;
    }
  }
  
  // بررسی ستون‌ها
  for (let col = 0; col < 5; col++) {
    let columnComplete = true;
    for (let row = 0; row < 5; row++) {
      if (!markedNumbers[row][col]) {
        columnComplete = false;
        break;
      }
    }
    if (columnComplete) {
      return true;
    }
  }
  
  // بررسی قطر اصلی
  let mainDiagonalComplete = true;
  for (let i = 0; i < 5; i++) {
    if (!markedNumbers[i][i]) {
      mainDiagonalComplete = false;
      break;
    }
  }
  if (mainDiagonalComplete) {
    return true;
  }
  
  // بررسی قطر فرعی
  let secondaryDiagonalComplete = true;
  for (let i = 0; i < 5; i++) {
    if (!markedNumbers[i][4 - i]) {
      secondaryDiagonalComplete = false;
      break;
    }
  }
  return secondaryDiagonalComplete;
}

/**
 * به‌روزرسانی کارت بینگو با عدد جدید
 * @param card کارت بینگو
 * @param calledNumber عدد اعلام‌شده
 * @returns کارت به‌روزرسانی شده
 */
function updateCard(card: BingoCard, calledNumber: number): BingoCard {
  const updatedCard = { ...card };
  
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (updatedCard.cardNumbers[row][col] === calledNumber) {
        updatedCard.markedNumbers[row][col] = true;
      }
    }
  }
  
  return updatedCard;
}

/**
 * تبدیل کارت بینگو به متن قابل نمایش
 * @param card کارت بینگو
 * @returns متن کارت بینگو برای نمایش
 */
function renderBingoCard(card: BingoCard): string {
  let cardText = '```\n';
  cardText += '┌─────┬─────┬─────┬─────┬─────┐\n';
  
  for (let row = 0; row < 5; row++) {
    cardText += '│';
    for (let col = 0; col < 5; col++) {
      const number = card.cardNumbers[row][col];
      const isMarked = card.markedNumbers[row][col];
      
      // نمایش اعداد علامت‌زده شده با ⭐ و بقیه با عدد
      const displayValue = isMarked ? 
        (row === 2 && col === 2 ? ' ⭐ ' : ' ✓' + number.toString().padStart(2, ' ')) : 
        ' ' + number.toString().padStart(3, ' ');
      
      cardText += displayValue + '│';
    }
    
    if (row < 4) {
      cardText += '\n├─────┼─────┼─────┼─────┼─────┤\n';
    } else {
      cardText += '\n└─────┴─────┴─────┴─────┴─────┘\n';
    }
  }
  
  cardText += '```';
  return cardText;
}

/**
 * ایجاد بازی بینگو جدید
 * @param interaction برهم‌کنش کاربر
 */
export async function createBingoGame(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی وجود بازی فعال در کانال
    const existingGame = Array.from(activeGames.values()).find(
      game => game.channelId === interaction.channelId && 
      (game.status === 'waiting' || game.status === 'active') &&
      game.gameType === 'bingo'
    );
    
    if (existingGame) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ یک بازی بینگو در حال حاضر فعال است!')
        .setDescription('لطفاً صبر کنید تا بازی فعلی به پایان برسد یا به آن بپیوندید.')
        .setColor(BINGO_COLORS.danger);
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      return;
    }
    
    // ایجاد شناسه منحصر به فرد برای بازی
    const gameId = uuidv4();
    
    // آماده‌سازی داده‌های بازی بینگو
    const gameData: BingoGameData = {
      cards: {},
      calledNumbers: [],
      availableNumbers: Array.from({ length: 25 }, (_, i) => i + 1),
      currentRound: 0,
      maxRounds: DEFAULT_BINGO_SETTINGS.maxRounds,
      timePerRound: DEFAULT_BINGO_SETTINGS.timePerRound,
      winners: [],
      waitingForNextNumber: false,
      bingoMessages: [],
      reward: DEFAULT_BINGO_SETTINGS.reward,
      inProgress: false
    };
    
    // ایجاد جلسه بازی
    const newGame: GameSession = {
      id: gameId,
      gameType: 'bingo',
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      players: [interaction.user.id],
      status: 'waiting',
      startedAt: undefined,
      endedAt: undefined,
      data: gameData,
      winners: undefined,
      rated: false,
      gameSettings: {
        isPrivate: false,
        allowSpectators: true,
        customRules: [],
      }
    };
    
    // ایجاد کارت برای کاربر ایجادکننده بازی
    gameData.cards[interaction.user.id] = generateBingoCard();
    
    // ذخیره بازی در لیست بازی‌های فعال
    activeGames.set(gameId, newGame);
    
    try {
      // ارسال کارت به کاربر ایجادکننده به صورت خصوصی
      const cardEmbed = new EmbedBuilder()
        .setTitle('🎲 کارت بینگو شما')
        .setDescription('این کارت بینگو شماست! اعداد اعلام‌شده را با کارت خود مطابقت دهید.')
        .setColor(BINGO_COLORS.primary)
        .addFields(
          { name: 'کارت شما', value: renderBingoCard(gameData.cards[interaction.user.id]) },
          { name: 'راهنما', value: '✓ = عدد علامت‌زده شده | ⭐ = خانه رایگان (مرکز کارت)' }
        )
        .setFooter({ text: `Game ID: ${gameId}` });
      
      await interaction.user.send({ embeds: [cardEmbed] });
    } catch (dmError) {
      log(`Failed to send bingo card DM to player ${interaction.user.id}: ${dmError}`, 'error');
      // در صورت خطا در ارسال پیام خصوصی، ادامه می‌دهیم اما پیام خطا ثبت می‌شود
    }
    
    // ایجاد اعلان بازی در کانال
    const gameEmbed = new EmbedBuilder()
      .setTitle('🎲 بازی بینگو')
      .setDescription('شانس خود را امتحان کنید! کارت خود را پر کنید و بینگو را ببرید! 🎉\nدر این بازی باید اعداد کارت خود را با اعداد اعلام‌شده تطبیق دهید و یک خط کامل ایجاد کنید!')
      .setColor(BINGO_COLORS.primary)
      .addFields(
        { name: '👥 تعداد بازیکنان', value: `${newGame.players.length}/10`, inline: true },
        { name: '⏱️ زمان هر دور', value: `${gameData.timePerRound} ثانیه`, inline: true },
        { name: '👤 حداقل بازیکنان', value: '2 نفر', inline: true },
        { name: '💰 جایزه بازی', value: `برنده ${gameData.reward} کوین 🤑`, inline: true }
      )
      .setFooter({ text: 'برای شرکت در بازی، روی دکمه ورود به بازی کلیک کنید! 🎮' });
      
    // ایجاد دکمه‌های بازی
    const gameButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`join_bingo_${gameId}`)
          .setLabel('ورود به بازی')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setCustomId(`start_bingo_${gameId}`)
          .setLabel('شروع بازی')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('▶️'),
        new ButtonBuilder()
          .setCustomId(`rules_bingo_${gameId}`)
          .setLabel('قوانین بازی')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📜'),
        new ButtonBuilder()
          .setCustomId(`cancel_bingo_${gameId}`)
          .setLabel('لغو بازی')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );
    
    // ارسال پیام به کانال
    const reply = await interaction.reply({ 
      embeds: [gameEmbed], 
      components: [gameButtons],
      fetchReply: true
    });
    
    // ذخیره شناسه پیام برای به‌روزرسانی‌های آینده
    if ('id' in reply) {
      gameData.bingoMessages.push({ 
        messageId: reply.id, 
        channelId: interaction.channelId 
      });
    }
    
    log(`Bingo game created with ID ${gameId} by ${interaction.user.tag}`, 'info');
    return gameId;
  } catch (error) {
    log(`Error creating bingo game: ${error}`, 'error');
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ خطا در ایجاد بازی')
      .setDescription('متأسفانه خطایی در ایجاد بازی بینگو رخ داد. لطفاً دوباره تلاش کنید.')
      .setColor(BINGO_COLORS.danger);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

/**
 * پیوستن به بازی بینگو
 * @param interaction برهم‌کنش کاربر
 * @param gameId شناسه بازی
 */
export async function joinBingoGame(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeGames.get(gameId);
    
    if (!game || game.gameType !== 'bingo') {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (game.status === 'active') {
      await interaction.reply({
        content: '⏱️ این بازی در حال اجراست و امکان پیوستن به آن وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    if (game.status === 'ended') {
      await interaction.reply({
        content: '🏁 این بازی به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }
    
    // بررسی این که آیا کاربر قبلاً در بازی شرکت کرده است
    if (game.players.includes(interaction.user.id)) {
      await interaction.reply({
        content: '✅ شما قبلاً به این بازی پیوسته‌اید!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی ظرفیت بازی
    if (game.players.length >= 10) {
      await interaction.reply({
        content: '❌ ظرفیت این بازی تکمیل شده است.',
        ephemeral: true
      });
      return;
    }
    
    // افزودن کاربر به لیست بازیکنان
    game.players.push(interaction.user.id);
    
    // ایجاد کارت بینگو برای کاربر جدید
    const bingoData = game.data as BingoGameData;
    bingoData.cards[interaction.user.id] = generateBingoCard();
    
    // ارسال کارت به کاربر
    try {
      const cardEmbed = new EmbedBuilder()
        .setTitle('🎲 کارت بینگو شما')
        .setDescription('این کارت بینگو شماست! اعداد اعلام‌شده را با کارت خود مطابقت دهید.')
        .setColor(BINGO_COLORS.primary)
        .addFields(
          { name: 'کارت شما', value: renderBingoCard(bingoData.cards[interaction.user.id]) },
          { name: 'راهنما', value: '✓ = عدد علامت‌زده شده | ⭐ = خانه رایگان (مرکز کارت)' }
        )
        .setFooter({ text: `Game ID: ${gameId}` });
      
      await interaction.user.send({ embeds: [cardEmbed] });
    } catch (dmError) {
      log(`Failed to send bingo card DM to player ${interaction.user.id}: ${dmError}`, 'error');
      // در صورت خطا در ارسال پیام خصوصی، کاربر را از بازی حذف می‌کنیم
      game.players = game.players.filter(id => id !== interaction.user.id);
      delete bingoData.cards[interaction.user.id];
      
      await interaction.reply({
        content: '❌ ما نمی‌توانیم برای شما پیام خصوصی ارسال کنیم. لطفاً امکان دریافت پیام از اعضای سرور را فعال کنید و دوباره تلاش کنید.',
        ephemeral: true
      });
      return;
    }
    
    // به‌روزرسانی پیام بازی
    await updateBingoGameMessage(game);
    
    // پاسخ به کاربر
    await interaction.reply({
      content: '✅ شما با موفقیت به بازی بینگو پیوستید! کارت بینگو شما از طریق پیام خصوصی ارسال شد.',
      ephemeral: true
    });
    
    log(`Player ${interaction.user.tag} joined bingo game ${gameId}`, 'info');
  } catch (error) {
    log(`Error joining bingo game: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در پیوستن به بازی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * به‌روزرسانی پیام بازی بینگو در کانال
 * @param game جلسه بازی
 */
async function updateBingoGameMessage(game: GameSession) {
  try {
    if (!client) return;
    
    const bingoData = game.data as BingoGameData;
    
    // ایجاد پیام به‌روز شده
    const updatedEmbed = new EmbedBuilder()
      .setTitle(game.status === 'active' ? '🎲 بازی بینگو در حال اجرا' : '🎲 بازی بینگو')
      .setDescription(
        game.status === 'active'
          ? `بازی بینگو در حال اجراست! اعداد اعلام‌شده تا کنون: ${bingoData.calledNumbers.join(', ') || 'هنوز عددی اعلام نشده'}`
          : 'شانس خود را امتحان کنید! کارت خود را پر کنید و بینگو را ببرید! 🎉\nدر این بازی باید اعداد کارت خود را با اعداد اعلام‌شده تطبیق دهید و یک خط کامل ایجاد کنید!'
      )
      .setColor(game.status === 'active' ? BINGO_COLORS.info : BINGO_COLORS.primary)
      .addFields(
        { name: '👥 تعداد بازیکنان', value: `${game.players.length}/10`, inline: true },
        { name: '⏱️ زمان هر دور', value: `${bingoData.timePerRound} ثانیه`, inline: true },
        { name: '👤 حداقل بازیکنان', value: '2 نفر', inline: true },
        { name: '💰 جایزه بازی', value: `برنده ${bingoData.reward} کوین 🤑`, inline: true }
      );
      
    // اضافه کردن اعداد اعلام‌شده در صورت وجود
    if (game.status === 'active' && bingoData.calledNumbers.length > 0) {
      updatedEmbed.addFields({
        name: '🔢 آخرین عدد اعلام‌شده',
        value: bingoData.lastNumberCalled ? `${bingoData.lastNumberCalled}` : 'هنوز عددی اعلام نشده',
        inline: true
      });
      
      updatedEmbed.addFields({
        name: '📊 پیشرفت بازی',
        value: `دور ${bingoData.currentRound}/${bingoData.maxRounds}`,
        inline: true
      });
    }
    
    // اضافه کردن لیست بازیکنان
    const playersList = game.players.map((playerId, index) => {
      return `${index + 1}. <@${playerId}>`;
    }).join('\n');
    
    updatedEmbed.addFields({
      name: '👥 بازیکنان',
      value: playersList || 'هنوز بازیکنی به بازی نپیوسته است.',
      inline: false
    });
    
    if (game.status === 'waiting') {
      updatedEmbed.setFooter({ text: 'برای شرکت در بازی، روی دکمه ورود به بازی کلیک کنید! 🎮' });
    }
    
    // به‌روزرسانی دکمه‌های بازی بر اساس وضعیت
    const gameButtons = new ActionRowBuilder<ButtonBuilder>();
    
    if (game.status === 'waiting') {
      gameButtons.addComponents(
        new ButtonBuilder()
          .setCustomId(`join_bingo_${game.id}`)
          .setLabel('ورود به بازی')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setCustomId(`start_bingo_${game.id}`)
          .setLabel('شروع بازی')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('▶️'),
        new ButtonBuilder()
          .setCustomId(`rules_bingo_${game.id}`)
          .setLabel('قوانین بازی')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📜'),
        new ButtonBuilder()
          .setCustomId(`cancel_bingo_${game.id}`)
          .setLabel('لغو بازی')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );
    } else if (game.status === 'active') {
      gameButtons.addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_bingo_${game.id}`)
          .setLabel('اعلام بینگو!')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎉'),
        new ButtonBuilder()
          .setCustomId(`view_card_bingo_${game.id}`)
          .setLabel('مشاهده کارت من')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎲'),
        new ButtonBuilder()
          .setCustomId(`rules_bingo_${game.id}`)
          .setLabel('قوانین بازی')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📜')
      );
    }
    
    // به‌روزرسانی تمام پیام‌های بازی در کانال
    for (const messageInfo of bingoData.bingoMessages) {
      try {
        const channel = await client.channels.fetch(messageInfo.channelId);
        if (channel && channel.type === ChannelType.GuildText) {
          const message = await channel.messages.fetch(messageInfo.messageId);
          if (message) {
            await message.edit({
              embeds: [updatedEmbed],
              components: gameButtons.components.length > 0 ? [gameButtons] : []
            });
          }
        }
      } catch (error) {
        log(`Failed to update bingo game message ${messageInfo.messageId}: ${error}`, 'error');
        // اگر به‌روزرسانی پیام با خطا مواجه شد، آن را از لیست حذف می‌کنیم
        bingoData.bingoMessages = bingoData.bingoMessages.filter(
          msg => msg.messageId !== messageInfo.messageId
        );
      }
    }
  } catch (error) {
    log(`Error updating bingo game message: ${error}`, 'error');
  }
}

/**
 * شروع بازی بینگو
 * @param interaction برهم‌کنش کاربر
 */
export async function startBingoGame(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeGames.get(gameId);
    
    if (!game || game.gameType !== 'bingo') {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی اینکه آیا کاربر سازنده بازی است
    if (game.createdBy !== interaction.user.id) {
      await interaction.reply({
        content: '⛔ فقط سازنده بازی می‌تواند بازی را شروع کند!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی وضعیت بازی
    if (game.status !== 'waiting') {
      await interaction.reply({
        content: '⏱️ این بازی قبلاً شروع شده یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }
    
    // بررسی تعداد بازیکنان
    if (game.players.length < 2) {
      await interaction.reply({
        content: '❌ برای شروع بازی به حداقل 2 بازیکن نیاز است!',
        ephemeral: true
      });
      return;
    }
    
    // به‌روزرسانی وضعیت بازی
    game.status = 'active';
    game.startedAt = new Date();
    const bingoData = game.data as BingoGameData;
    bingoData.inProgress = true;
    
    await interaction.reply({
      content: '🎲 بازی بینگو با موفقیت شروع شد! هر 30 ثانیه یک عدد جدید اعلام می‌شود.',
      ephemeral: true
    });
    
    // به‌روزرسانی پیام بازی
    await updateBingoGameMessage(game);
    
    // اعلام شروع بازی در کانال
    const startEmbed = new EmbedBuilder()
      .setTitle('🎮 بازی بینگو شروع شد!')
      .setDescription('بازی بینگو با موفقیت آغاز شد! 🎉\n\nهر 30 ثانیه یک عدد جدید اعلام می‌شود.\nکارت خود را بررسی کنید و اگر یک خط کامل داشتید، "اعلام بینگو" را بزنید!')
      .setColor(BINGO_COLORS.success)
      .setFooter({ text: `Game ID: ${gameId}` });
    
    const channel = await client.channels.fetch(game.channelId);
    if (channel && channel.type === ChannelType.GuildText) {
      await channel.send({ embeds: [startEmbed] });
    }
    
    // شروع روند اعلام اعداد
    runBingoNumberCaller(game);
    
    log(`Bingo game ${gameId} started by ${interaction.user.tag}`, 'info');
  } catch (error) {
    log(`Error starting bingo game: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در شروع بازی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * اجرای روند اعلام اعداد بینگو
 * @param game جلسه بازی
 */
function runBingoNumberCaller(game: GameSession) {
  try {
    const bingoData = game.data as BingoGameData;
    
    // تنظیم تایمر برای اعلام عدد جدید
    const announceNumber = async () => {
      try {
        // بررسی اینکه آیا بازی هنوز فعال است
        if (game.status !== 'active' || !bingoData.inProgress) {
          if (bingoData.timerInterval) {
            clearTimeout(bingoData.timerInterval);
          }
          return;
        }
        
        // افزایش شماره دور فعلی
        bingoData.currentRound++;
        
        // بررسی پایان بازی بر اساس تعداد دورها
        if (bingoData.currentRound > bingoData.maxRounds || bingoData.availableNumbers.length === 0) {
          await endBingoGameWithoutWinner(game);
          return;
        }
        
        // انتخاب یک عدد تصادفی که قبلاً اعلام نشده است
        const randomIndex = Math.floor(Math.random() * bingoData.availableNumbers.length);
        const calledNumber = bingoData.availableNumbers[randomIndex];
        
        // حذف عدد از لیست اعداد موجود
        bingoData.availableNumbers.splice(randomIndex, 1);
        
        // افزودن عدد به لیست اعداد اعلام‌شده
        bingoData.calledNumbers.push(calledNumber);
        bingoData.lastNumberCalled = calledNumber;
        bingoData.lastNumberTime = new Date();
        
        // به‌روزرسانی کارت‌های بازیکنان
        for (const playerId of game.players) {
          if (playerId in bingoData.cards) {
            bingoData.cards[playerId] = updateCard(bingoData.cards[playerId], calledNumber);
            
            // بررسی وضعیت بینگو برای هر بازیکن
            // توجه: ما این بررسی را اینجا انجام نمی‌دهیم، بلکه منتظر می‌مانیم تا بازیکن خودش اعلام کند
          }
        }
        
        // اعلام عدد جدید در کانال
        const channel = await client.channels.fetch(game.channelId);
        if (channel && channel.type === ChannelType.GuildText) {
          const numberEmbed = new EmbedBuilder()
            .setTitle('🔢 عدد جدید اعلام شد!')
            .setDescription(`**${calledNumber}**`)
            .setColor(BINGO_COLORS.info)
            .addFields(
              { 
                name: '🔢 اعداد اعلام‌شده', 
                value: bingoData.calledNumbers.join(', '), 
                inline: false 
              },
              { 
                name: '📊 پیشرفت بازی', 
                value: `دور ${bingoData.currentRound}/${bingoData.maxRounds}`, 
                inline: true 
              },
              { 
                name: '⏱️ عدد بعدی', 
                value: `${bingoData.timePerRound} ثانیه دیگر`, 
                inline: true 
              }
            )
            .setFooter({ text: 'کارت خود را بررسی کنید!' });

          // ارسال پیام اعلان عدد جدید
          const newMessage = await channel.send({ 
            embeds: [numberEmbed],
            components: [
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId(`claim_bingo_${game.id}`)
                    .setLabel('اعلام بینگو!')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎉'),
                  new ButtonBuilder()
                    .setCustomId(`view_card_bingo_${game.id}`)
                    .setLabel('مشاهده کارت من')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎲')
                )
            ]
          });
          
          // به‌روزرسانی پیام اصلی بازی نیز
          await updateBingoGameMessage(game);
          
          // به‌روزرسانی کارت‌ها برای بازیکنان
          await updatePlayerCards(game);
        }
        
        // تنظیم تایمر برای دور بعدی
        bingoData.timerInterval = setTimeout(announceNumber, bingoData.timePerRound * 1000);
      } catch (error) {
        log(`Error in bingo number caller: ${error}`, 'error');
        
        // در صورت خطا، سعی می‌کنیم دور بعدی را اجرا کنیم
        if (game.status === 'active' && bingoData.inProgress) {
          bingoData.timerInterval = setTimeout(announceNumber, bingoData.timePerRound * 1000);
        }
      }
    };
    
    // اعلام اولین عدد با یک تأخیر کوتاه
    bingoData.timerInterval = setTimeout(announceNumber, 5000);
  } catch (error) {
    log(`Error running bingo number caller: ${error}`, 'error');
  }
}

/**
 * به‌روزرسانی کارت‌های بازیکنان از طریق پیام خصوصی
 * @param game جلسه بازی
 */
async function updatePlayerCards(game: GameSession) {
  try {
    const bingoData = game.data as BingoGameData;
    
    for (const playerId of game.players) {
      try {
        const user = await client.users.fetch(playerId);
        if (!user) continue;
        
        // ایجاد Embed جدید برای کارت به‌روز شده
        const cardEmbed = new EmbedBuilder()
          .setTitle('🎲 کارت بینگو شما - به‌روز شده')
          .setDescription(`آخرین عدد اعلام‌شده: **${bingoData.lastNumberCalled}**\nکارت خود را بررسی کنید!`)
          .setColor(BINGO_COLORS.primary)
          .addFields(
            { name: 'کارت شما', value: renderBingoCard(bingoData.cards[playerId]) },
            { name: 'راهنما', value: '✓ = عدد علامت‌زده شده | ⭐ = خانه رایگان (مرکز کارت)' },
            { 
              name: '🔢 اعداد اعلام‌شده', 
              value: bingoData.calledNumbers.join(', ') || 'هنوز عددی اعلام نشده', 
              inline: false 
            }
          )
          .setFooter({ text: `Game ID: ${game.id}` });
        
        // افزودن دکمه اعلام بینگو
        const cardButtons = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`claim_bingo_${game.id}`)
              .setLabel('اعلام بینگو!')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🎉')
          );
        
        // ارسال پیام به کاربر - به جای ارسال پیام جدید، می‌توان از ویرایش آخرین پیام استفاده کرد
        // اما برای سادگی، فعلاً پیام جدید ارسال می‌کنیم
        await user.send({ embeds: [cardEmbed], components: [cardButtons] });
      } catch (dmError) {
        // لاگ خطا و ادامه با کاربر بعدی
        log(`Failed to update bingo card for player ${playerId}: ${dmError}`, 'warn');
      }
    }
  } catch (error) {
    log(`Error updating player cards: ${error}`, 'error');
  }
}

/**
 * نمایش قوانین بازی بینگو
 * @param interaction برهم‌کنش کاربر
 */
export async function showBingoRules(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    
    const rulesEmbed = new EmbedBuilder()
      .setTitle('📜 قوانین بازی بینگو')
      .setDescription('اینجا قوانین کامل بازی بینگو را می‌توانید بخوانید! 🔢')
      .setColor(BINGO_COLORS.primary)
      .addFields(
        { 
          name: '👥 شروع بازی و دریافت کارت', 
          value: '🔹 هر بازیکن یک کارت ۵×۵ با اعداد تصادفی از ۱ تا ۲۵ دریافت می‌کند.\n' + 
                 '🔹 وسط کارت (موقعیت ۳×۳) یک ستاره ⭐ به عنوان خانه رایگان دارد.\n' + 
                 '🔹 کارت هر بازیکن به صورت خصوصی برایش ارسال می‌شود.', 
          inline: false 
        },
        { 
          name: '🎲 اعلام اعداد', 
          value: '🔹 ربات هر ۳۰ ثانیه یک عدد تصادفی از ۱ تا ۲۵ اعلام می‌کند.\n' + 
                 '🔹 بازیکنان باید اعداد اعلام‌شده را با کارت خود چک کنند.\n' + 
                 '🔹 اگر عدد اعلام‌شده در کارت شما بود، آن به صورت خودکار علامت زده می‌شود.', 
          inline: false 
        },
        { 
          name: '✅ اعلام بینگو', 
          value: '🔹 برای برنده شدن، باید یک خط کامل (افقی، عمودی یا قطری) از اعداد علامت‌دار داشته باشید.\n' + 
                 '🔹 وقتی یک خط کامل کردید، دکمه «اعلام بینگو» را بزنید.\n' + 
                 '🔹 ربات کارت شما را بررسی می‌کند و اگر درست باشد، شما برنده می‌شوید! 🏆', 
          inline: false 
        },
        { 
          name: '🏁 پایان بازی', 
          value: '🔹 بازی وقتی تمام می‌شود که یک بازیکن بینگو را اعلام کند و ربات تأیید کند.\n' + 
                 '🔹 اگر چند نفر همزمان بینگو کنند، جایزه بینشان تقسیم می‌شود.\n' + 
                 '🔹 جایزه (۲۰۰ کوین) به برنده یا برندگان داده می‌شود. 🤑', 
          inline: false 
        }
      )
      .setFooter({ text: 'برای بازگشت به منوی بازی، روی دکمه بازگشت کلیک کنید! 🔙' });
    
    // ایجاد دکمه بازگشت
    const backButton = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`back_bingo_${gameId}`)
          .setLabel('بازگشت 🔙')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.reply({ embeds: [rulesEmbed], components: [backButton], ephemeral: true });
  } catch (error) {
    log(`Error showing bingo rules: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در نمایش قوانین بازی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * بازگشت به منوی بازی بینگو
 * @param interaction برهم‌کنش کاربر
 */
export async function backToBingoMenu(interaction: ButtonInteraction) {
  try {
    await interaction.deferUpdate();
    await interaction.deleteReply();
  } catch (error) {
    log(`Error going back to bingo menu: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در بازگشت به منوی بازی رخ داد.',
      ephemeral: true
    });
  }
}

/**
 * لغو بازی بینگو
 * @param interaction برهم‌کنش کاربر
 */
export async function cancelBingoGame(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeGames.get(gameId);
    
    if (!game || game.gameType !== 'bingo') {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی اینکه آیا کاربر سازنده بازی است
    if (game.createdBy !== interaction.user.id) {
      await interaction.reply({
        content: '⛔ فقط سازنده بازی می‌تواند بازی را لغو کند!',
        ephemeral: true
      });
      return;
    }
    
    // لغو تایمرها
    const bingoData = game.data as BingoGameData;
    if (bingoData.timerInterval) {
      clearTimeout(bingoData.timerInterval);
    }
    
    // به‌روزرسانی وضعیت بازی
    game.status = 'ended';
    game.endedAt = new Date();
    bingoData.inProgress = false;
    
    // به‌روزرسانی پیام بازی
    for (const messageInfo of bingoData.bingoMessages) {
      try {
        const channel = await client.channels.fetch(messageInfo.channelId);
        if (channel && channel.type === ChannelType.GuildText) {
          const message = await channel.messages.fetch(messageInfo.messageId);
          if (message) {
            const cancelEmbed = new EmbedBuilder()
              .setTitle('❌ بازی بینگو لغو شد')
              .setDescription(`این بازی توسط <@${interaction.user.id}> لغو شد.`)
              .setColor(BINGO_COLORS.danger)
              .setFooter({ text: `Game ID: ${gameId}` });
            
            await message.edit({ embeds: [cancelEmbed], components: [] });
          }
        }
      } catch (editError) {
        log(`Failed to update bingo game message on cancel: ${editError}`, 'error');
      }
    }
    
    // اعلام لغو بازی در کانال
    const channel = await client.channels.fetch(game.channelId);
    if (channel && channel.type === ChannelType.GuildText) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ بازی بینگو لغو شد')
            .setDescription(`بازی بینگو توسط <@${interaction.user.id}> لغو شد.`)
            .setColor(BINGO_COLORS.danger)
        ]
      });
    }
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(gameId);
    
    await interaction.reply({
      content: '✅ بازی بینگو با موفقیت لغو شد.',
      ephemeral: true
    });
    
    log(`Bingo game ${gameId} cancelled by ${interaction.user.tag}`, 'info');
  } catch (error) {
    log(`Error cancelling bingo game: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در لغو بازی رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مشاهده کارت بینگو
 * @param interaction برهم‌کنش کاربر
 */
export async function viewBingoCard(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[3];
    const game = activeGames.get(gameId);
    
    if (!game || game.gameType !== 'bingo') {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی اینکه آیا کاربر در بازی شرکت دارد
    if (!game.players.includes(interaction.user.id)) {
      await interaction.reply({
        content: '⛔ شما در این بازی شرکت ندارید!',
        ephemeral: true
      });
      return;
    }
    
    const bingoData = game.data as BingoGameData;
    
    if (!bingoData.cards[interaction.user.id]) {
      await interaction.reply({
        content: '❌ کارت بینگو شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // نمایش کارت بینگو کاربر
    const cardEmbed = new EmbedBuilder()
      .setTitle('🎲 کارت بینگو شما')
      .setDescription('این کارت بینگو شماست! اعداد اعلام‌شده را با کارت خود مطابقت دهید.')
      .setColor(BINGO_COLORS.primary)
      .addFields(
        { name: 'کارت شما', value: renderBingoCard(bingoData.cards[interaction.user.id]) },
        { name: 'راهنما', value: '✓ = عدد علامت‌زده شده | ⭐ = خانه رایگان (مرکز کارت)' },
        { 
          name: '🔢 اعداد اعلام‌شده', 
          value: bingoData.calledNumbers.join(', ') || 'هنوز عددی اعلام نشده', 
          inline: false 
        }
      )
      .setFooter({ text: `Game ID: ${gameId}` });
    
    // افزودن دکمه اعلام بینگو اگر بازی فعال است
    const cardButtons = new ActionRowBuilder<ButtonBuilder>();
    
    if (game.status === 'active') {
      cardButtons.addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_bingo_${gameId}`)
          .setLabel('اعلام بینگو!')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎉')
      );
    }
    
    await interaction.reply({
      embeds: [cardEmbed],
      components: cardButtons.components.length > 0 ? [cardButtons] : [],
      ephemeral: true
    });
  } catch (error) {
    log(`Error viewing bingo card: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در نمایش کارت بینگو رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * اعلام بینگو توسط بازیکن
 * @param interaction برهم‌کنش کاربر
 */
export async function claimBingo(interaction: ButtonInteraction) {
  try {
    const gameId = interaction.customId.split('_')[2];
    const game = activeGames.get(gameId);
    
    if (!game || game.gameType !== 'bingo') {
      await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا به پایان رسیده است.', 
        ephemeral: true 
      });
      return;
    }
    
    // بررسی اینکه آیا بازی فعال است
    if (game.status !== 'active') {
      await interaction.reply({
        content: '⏱️ این بازی فعال نیست یا به پایان رسیده است.',
        ephemeral: true
      });
      return;
    }
    
    // بررسی اینکه آیا کاربر در بازی شرکت دارد
    if (!game.players.includes(interaction.user.id)) {
      await interaction.reply({
        content: '⛔ شما در این بازی شرکت ندارید!',
        ephemeral: true
      });
      return;
    }
    
    const bingoData = game.data as BingoGameData;
    
    if (!bingoData.cards[interaction.user.id]) {
      await interaction.reply({
        content: '❌ کارت بینگو شما یافت نشد!',
        ephemeral: true
      });
      return;
    }
    
    // بررسی اینکه آیا کاربر واقعاً بینگو دارد
    const hasBingo = checkForBingo(bingoData.cards[interaction.user.id]);
    
    if (!hasBingo) {
      await interaction.reply({
        content: '❌ شما هنوز بینگو ندارید! باید یک خط کامل (افقی، عمودی یا قطری) از اعداد علامت‌زده شده داشته باشید.',
        ephemeral: true
      });
      return;
    }
    
    // پایان بازی با برنده
    await endBingoGameWithWinner(game, interaction.user.id, interaction);
    
  } catch (error) {
    log(`Error claiming bingo: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در اعلام بینگو رخ داد. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * پایان بازی بینگو با برنده
 * @param game جلسه بازی
 * @param winnerId شناسه برنده
 * @param interaction برهم‌کنش کاربر (اختیاری)
 */
async function endBingoGameWithWinner(game: GameSession, winnerId: string, interaction?: ButtonInteraction) {
  try {
    const bingoData = game.data as BingoGameData;
    
    // لغو تایمرها
    if (bingoData.timerInterval) {
      clearTimeout(bingoData.timerInterval);
    }
    
    // به‌روزرسانی وضعیت بازی
    game.status = 'ended';
    game.endedAt = new Date();
    bingoData.inProgress = false;
    bingoData.winners = [winnerId];
    game.winners = [winnerId];
    
    // ارسال پیام به کاربر برنده
    if (interaction) {
      const winnerEmbed = new EmbedBuilder()
        .setTitle('🎉 تبریک! شما برنده بازی بینگو شدید!')
        .setDescription(`شما با موفقیت یک خط کامل ایجاد کردید و برنده بازی بینگو شدید!\nجایزه شما: ${bingoData.reward} کوین 🪙`)
        .setColor(BINGO_COLORS.success)
        .addFields(
          { name: 'کارت برنده شما', value: renderBingoCard(bingoData.cards[winnerId]) }
        )
        .setFooter({ text: `Game ID: ${game.id}` });
      
      await interaction.reply({ embeds: [winnerEmbed], ephemeral: true });
    }
    
    // اعلام برنده در کانال
    const channel = await client.channels.fetch(game.channelId);
    if (channel && channel.type === ChannelType.GuildText) {
      const winnerAnnounceEmbed = new EmbedBuilder()
        .setTitle('🏆 برنده بازی بینگو!')
        .setDescription(`🎉 <@${winnerId}> برنده بازی بینگو شد! 🎉\n\nیک خط کامل ایجاد کرد و ${bingoData.reward} کوین جایزه گرفت! 🪙`)
        .setColor(BINGO_COLORS.success)
        .setImage('https://i.imgur.com/LPSH97T.gif')
        .setFooter({ text: `Game ID: ${game.id}` });
      
      await channel.send({ embeds: [winnerAnnounceEmbed] });
      
      // مشاهده کارت برنده
      const winnerCardEmbed = new EmbedBuilder()
        .setTitle('🎲 کارت برنده')
        .setDescription(`کارت برنده <@${winnerId}>:`)
        .setColor(BINGO_COLORS.success)
        .addFields(
          { name: 'کارت برنده', value: renderBingoCard(bingoData.cards[winnerId]) }
        )
        .setFooter({ text: `Game ID: ${game.id}` });
      
      await channel.send({ embeds: [winnerCardEmbed] });
    }
    
    // به‌روزرسانی پیام‌های بازی
    for (const messageInfo of bingoData.bingoMessages) {
      try {
        const channel = await client.channels.fetch(messageInfo.channelId);
        if (channel && channel.type === ChannelType.GuildText) {
          const message = await channel.messages.fetch(messageInfo.messageId);
          if (message) {
            const endGameEmbed = new EmbedBuilder()
              .setTitle('🏁 بازی بینگو به پایان رسید')
              .setDescription(`🎉 <@${winnerId}> برنده بازی بینگو شد! 🎉\n\nیک خط کامل ایجاد کرد و ${bingoData.reward} کوین جایزه گرفت! 🪙`)
              .setColor(BINGO_COLORS.success)
              .addFields(
                { name: '👥 تعداد بازیکنان', value: `${game.players.length}`, inline: true },
                { name: '🔢 اعداد اعلام‌شده', value: bingoData.calledNumbers.join(', '), inline: false }
              )
              .setFooter({ text: `Game ID: ${game.id}` });
            
            await message.edit({ embeds: [endGameEmbed], components: [] });
          }
        }
      } catch (editError) {
        log(`Failed to update bingo game message on end: ${editError}`, 'error');
      }
    }
    
    // پرداخت جایزه به برنده
    try {
      await storage.addCoins(winnerId, bingoData.reward, 'game_win');
      log(`Rewarded ${bingoData.reward} coins to ${winnerId} for winning bingo game ${game.id}`, 'info');
    } catch (rewardError) {
      log(`Error rewarding winner: ${rewardError}`, 'error');
    }
    
    // ثبت تاریخچه بازی
    try {
      if ('saveGameHistory' in storage) {
        await storage.saveGameHistory(game);
      }
    } catch (historyError) {
      log(`Error saving game history: ${historyError}`, 'warn');
    }
    
    // حذف بازی از لیست بازی‌های فعال
    setTimeout(() => {
      activeGames.delete(game.id);
    }, 30000); // حذف بازی بعد از 30 ثانیه
    
    log(`Bingo game ${game.id} ended with winner ${winnerId}`, 'info');
  } catch (error) {
    log(`Error ending bingo game with winner: ${error}`, 'error');
  }
}

/**
 * پایان بازی بینگو بدون برنده
 * @param game جلسه بازی
 */
async function endBingoGameWithoutWinner(game: GameSession) {
  try {
    const bingoData = game.data as BingoGameData;
    
    // لغو تایمرها
    if (bingoData.timerInterval) {
      clearTimeout(bingoData.timerInterval);
    }
    
    // به‌روزرسانی وضعیت بازی
    game.status = 'ended';
    game.endedAt = new Date();
    bingoData.inProgress = false;
    
    // اعلام پایان بازی در کانال
    const channel = await client.channels.fetch(game.channelId);
    if (channel && channel.type === ChannelType.GuildText) {
      const endGameEmbed = new EmbedBuilder()
        .setTitle('🏁 بازی بینگو به پایان رسید')
        .setDescription('همه اعداد اعلام شدند و هیچ‌کس بینگو نکرد! بازی بدون برنده تمام شد. 😔')
        .setColor(BINGO_COLORS.danger)
        .addFields(
          { name: '👥 تعداد بازیکنان', value: `${game.players.length}`, inline: true },
          { name: '🔢 اعداد اعلام‌شده', value: bingoData.calledNumbers.join(', '), inline: false }
        )
        .setFooter({ text: `Game ID: ${game.id}` });
      
      await channel.send({ embeds: [endGameEmbed] });
    }
    
    // به‌روزرسانی پیام‌های بازی
    for (const messageInfo of bingoData.bingoMessages) {
      try {
        const channel = await client.channels.fetch(messageInfo.channelId);
        if (channel && channel.type === ChannelType.GuildText) {
          const message = await channel.messages.fetch(messageInfo.messageId);
          if (message) {
            const endGameEmbed = new EmbedBuilder()
              .setTitle('🏁 بازی بینگو به پایان رسید')
              .setDescription('همه اعداد اعلام شدند و هیچ‌کس بینگو نکرد! بازی بدون برنده تمام شد. 😔')
              .setColor(BINGO_COLORS.danger)
              .addFields(
                { name: '👥 تعداد بازیکنان', value: `${game.players.length}`, inline: true },
                { name: '🔢 اعداد اعلام‌شده', value: bingoData.calledNumbers.join(', '), inline: false }
              )
              .setFooter({ text: `Game ID: ${game.id}` });
            
            await message.edit({ embeds: [endGameEmbed], components: [] });
          }
        }
      } catch (editError) {
        log(`Failed to update bingo game message on end: ${editError}`, 'error');
      }
    }
    
    // ثبت تاریخچه بازی
    try {
      if ('saveGameHistory' in storage) {
        await storage.saveGameHistory(game);
      }
    } catch (historyError) {
      log(`Error saving game history: ${historyError}`, 'warn');
    }
    
    // حذف بازی از لیست بازی‌های فعال
    setTimeout(() => {
      activeGames.delete(game.id);
    }, 30000); // حذف بازی بعد از 30 ثانیه
    
    log(`Bingo game ${game.id} ended without winner`, 'info');
  } catch (error) {
    log(`Error ending bingo game without winner: ${error}`, 'error');
  }
}

/**
 * پردازش برهم‌کنش‌های دکمه برای بازی بینگو
 * @param interaction برهم‌کنش دکمه
 * @returns آیا برهم‌کنش پردازش شد
 */
export async function handleBingoButtonInteraction(interaction: ButtonInteraction): Promise<boolean> {
  try {
    const customId = interaction.customId;
    
    // پردازش برهم‌کنش‌های مختلف بازی بینگو
    if (customId.startsWith('join_bingo_')) {
      await joinBingoGame(interaction);
      return true;
    } else if (customId.startsWith('start_bingo_')) {
      await startBingoGame(interaction);
      return true;
    } else if (customId.startsWith('rules_bingo_')) {
      await showBingoRules(interaction);
      return true;
    } else if (customId.startsWith('back_bingo_')) {
      await backToBingoMenu(interaction);
      return true;
    } else if (customId.startsWith('cancel_bingo_')) {
      await cancelBingoGame(interaction);
      return true;
    } else if (customId.startsWith('view_card_bingo_')) {
      await viewBingoCard(interaction);
      return true;
    } else if (customId.startsWith('claim_bingo_')) {
      await claimBingo(interaction);
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error handling bingo button interaction: ${error}`, 'error');
    return false;
  }
}

/**
 * برای استفاده در buttonHandler.ts
 * @param interaction برهم‌کنش دکمه
 * @returns آیا برهم‌کنش پردازش شد
 */
export async function handleBingoInteraction(interaction: ButtonInteraction): Promise<boolean> {
  return handleBingoButtonInteraction(interaction);
}