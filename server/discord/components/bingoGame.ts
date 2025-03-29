import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonInteraction, 
  ButtonStyle, 
  EmbedBuilder, 
  GuildMember, 
  MessageActionRowComponentBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
  User,
  VoiceChannel
} from 'discord.js';
import { storage } from '../../storage';
import { v4 as uuidv4 } from 'uuid';
import { bold, inlineCode } from '@discordjs/builders';
import type { GameSession } from '../../models/GameSession';

// بینگو کارت‌های بازیکنان
interface BingoCard {
  card: Array<Array<string | number>>;
  marks: boolean[][];
}

// وضعیت بازی بینگو
interface BingoGameState {
  gameId: string;
  channelId: string;
  hostId: string;
  players: string[];
  cards: Map<string, BingoCard>;
  calledNumbers: Set<number>;
  currentNumber: number | null;
  status: 'waiting' | 'active' | 'ended';
  lastUpdate: number;
  winners: string[];
  messageId: string | null;
  roundInterval: NodeJS.Timeout | null;
}

// مخزن بازی‌های فعال
const activeGames = new Map<string, BingoGameState>();

/**
 * ایجاد یک کارت بینگو جدید برای بازیکن
 * @returns کارت بینگو تولید شده
 */
function generateBingoCard(): BingoCard {
  // ایجاد یک آرایه از اعداد 1 تا 25
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  
  // مخلوط کردن ترتیب اعداد به صورت تصادفی
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  
  // ایجاد یک ماتریس 5×5 برای کارت بینگو
  const card: Array<Array<string | number>> = [];
  for (let i = 0; i < 5; i++) {
    const row: Array<string | number> = [];
    for (let j = 0; j < 5; j++) {
      const index = i * 5 + j;
      // ستاره در وسط کارت (خانه رایگان)
      if (i === 2 && j === 2) {
        row.push('⭐');
      } else {
        row.push(numbers[index]);
      }
    }
    card.push(row);
  }
  
  // ایجاد ماتریس برای ثبت علامت‌ها
  const marks = Array(5).fill(null).map(() => Array(5).fill(false));
  
  // علامت‌گذاری خانه وسط به عنوان رایگان
  marks[2][2] = true;
  
  return { card, marks };
}

/**
 * تولید نمایش متنی از کارت بینگو برای ارسال به کاربر
 * @param card کارت بینگو
 * @param marks ماتریس علامت‌گذاری‌ها
 * @returns متن قالب‌بندی شده کارت
 */
function displayBingoCard(card: Array<Array<string | number>>, marks: boolean[][]): string {
  let display = '```\n';
  
  // نمایش سربرگ کارت
  display += '  B    I    N    G    O  \n';
  display += '-------------------------\n';
  
  // نمایش سطرهای کارت
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      // نمایش عدد یا ستاره 
      let cell = card[i][j].toString().padStart(2, ' ');
      
      // اضافه کردن نشانگر برای خانه‌های علامت‌گذاری شده
      if (marks[i][j]) {
        cell = 'XX';
      }
      
      display += `|${cell}| `;
    }
    display += '\n';
  }
  
  display += '-------------------------\n';
  display += '```';
  
  return display;
}

/**
 * بررسی اینکه آیا کارت برنده است یا نه
 * یک کارت زمانی برنده است که یک سطر، ستون یا قطر کامل علامت‌گذاری شده باشد
 * @param marks ماتریس علامت‌گذاری‌ها
 * @returns آیا کارت برنده است؟
 */
function checkForBingo(marks: boolean[][]): boolean {
  // بررسی سطرها
  for (let i = 0; i < 5; i++) {
    if (marks[i].every(marked => marked)) {
      return true;
    }
  }
  
  // بررسی ستون‌ها
  for (let j = 0; j < 5; j++) {
    if (marks.every(row => row[j])) {
      return true;
    }
  }
  
  // بررسی قطر اصلی (بالا-چپ به پایین-راست)
  if (marks[0][0] && marks[1][1] && marks[2][2] && marks[3][3] && marks[4][4]) {
    return true;
  }
  
  // بررسی قطر فرعی (بالا-راست به پایین-چپ)
  if (marks[0][4] && marks[1][3] && marks[2][2] && marks[3][1] && marks[4][0]) {
    return true;
  }
  
  return false;
}

/**
 * علامت‌گذاری عدد در کارت بازیکن (اگر وجود داشته باشد)
 * @param card کارت بینگو
 * @param number عدد اعلام شده
 * @returns ماتریس به‌روزرسانی شده علامت‌گذاری‌ها
 */
function markNumberOnCard(bingoCard: BingoCard, number: number): BingoCard {
  const { card, marks } = bingoCard;
  const updatedMarks = [...marks.map(row => [...row])];
  
  // جستجو برای عدد در کارت
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (card[i][j] === number) {
        updatedMarks[i][j] = true;
      }
    }
  }
  
  return { card, marks: updatedMarks };
}

/**
 * ارسال کارت بینگو به بازیکن
 * @param user کاربر بازیکن
 * @param card کارت بینگو
 * @param gameId شناسه بازی
 * @returns موفقیت یا عدم موفقیت در ارسال
 */
async function sendBingoCardToPlayer(user: User, bingoCard: BingoCard, gameId: string): Promise<boolean> {
  try {
    const { card, marks } = bingoCard;
    
    // ساخت امبد برای نمایش کارت
    const embed = new EmbedBuilder()
      .setTitle('🎮 کارت بینگو شما')
      .setDescription(
        'اعداد اعلام شده در بازی به صورت خودکار روی کارت شما علامت‌گذاری می‌شوند.\n' +
        'وقتی یک سطر، ستون یا قطر کامل علامت‌گذاری شد، می‌توانید برنده شوید!'
      )
      .setColor('#00BCD4')
      .addFields(
        { name: '📋 کارت شما', value: displayBingoCard(card, marks), inline: false },
        { name: '🆔 شناسه بازی', value: gameId, inline: true }
      )
      .setFooter({ text: 'اعداد اعلام شده با XX مشخص می‌شوند' });
    
    // دکمه اعلام بینگو
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`bingo_claim_${gameId}`)
          .setLabel('اعلام بینگو!')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎯')
      );
    
    // ارسال پیام خصوصی به بازیکن
    await user.send({ embeds: [embed], components: [row] });
    return true;
  } catch (error) {
    console.error(`Error sending bingo card to player ${user.id}:`, error);
    return false;
  }
}

/**
 * به‌روزرسانی کارت بینگو برای بازیکن
 * @param user کاربر بازیکن
 * @param bingoCard کارت بینگو
 * @param gameId شناسه بازی
 * @param calledNumbers اعداد اعلام شده
 * @returns 
 */
async function updatePlayerCard(user: User, bingoCard: BingoCard, gameId: string, calledNumbers: Set<number>): Promise<void> {
  try {
    const { card, marks } = bingoCard;
    
    // ساخت امبد برای نمایش کارت
    const embed = new EmbedBuilder()
      .setTitle('🎮 کارت بینگو شما')
      .setDescription(
        'اعداد اعلام شده در بازی به صورت خودکار روی کارت شما علامت‌گذاری می‌شوند.\n' +
        'وقتی یک سطر، ستون یا قطر کامل علامت‌گذاری شد، می‌توانید برنده شوید!'
      )
      .setColor('#00BCD4')
      .addFields(
        { name: '📋 کارت شما', value: displayBingoCard(card, marks), inline: false },
        { name: '🔢 اعداد اعلام شده', value: Array.from(calledNumbers).sort((a, b) => a - b).join(', ') || 'هنوز عددی اعلام نشده', inline: false },
        { name: '🆔 شناسه بازی', value: gameId, inline: true }
      )
      .setFooter({ text: 'اعداد اعلام شده با XX مشخص می‌شوند' });
    
    // دکمه اعلام بینگو
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`bingo_claim_${gameId}`)
          .setLabel('اعلام بینگو!')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎯')
      );
    
    try {
      // ارسال پیام جدید به بازیکن
      await user.send({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error(`Could not send updated card to player ${user.id}:`, error);
    }
  } catch (error) {
    console.error(`Error updating bingo card for player ${user.id}:`, error);
  }
}

/**
 * به‌روزرسانی وضعیت بازی در کانال
 * @param gameState وضعیت بازی
 * @param channel کانال بازی
 */
async function updateGameStatus(gameState: BingoGameState, channel: TextChannel): Promise<void> {
  try {
    const {
      gameId,
      players,
      calledNumbers,
      currentNumber,
      status,
      winners
    } = gameState;
    
    // ساخت امبد برای نمایش وضعیت بازی
    const embed = new EmbedBuilder()
      .setTitle('🎲 بازی بینگو')
      .setColor('#9B59B6');
    
    if (status === 'waiting') {
      // وضعیت انتظار برای شروع بازی
      embed.setDescription(
        'منتظر پیوستن بازیکنان هستیم!\n' +
        'برای شرکت در بازی روی دکمه "ورود به بازی" کلیک کنید.\n' +
        'میزبان می‌تواند بازی را شروع کند.'
      )
      .addFields(
        { name: '👥 تعداد بازیکنان', value: `${players.length}/10`, inline: true },
        { name: '👤 حداقل بازیکنان', value: '3 نفر', inline: true },
        { name: '💰 جایزه بازی', value: 'برنده: 200 کوین', inline: true }
      )
      .setFooter({ text: `شناسه بازی: ${gameId} | برای شروع بازی حداقل 3 بازیکن نیاز است` });
      
      // دکمه‌های بازی
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`bingo_join_${gameId}`)
            .setLabel('ورود به بازی')
            .setStyle(ButtonStyle.Success)
            .setEmoji('👤'),
          new ButtonBuilder()
            .setCustomId(`bingo_start_${gameId}`)
            .setLabel('شروع بازی')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('▶️'),
          new ButtonBuilder()
            .setCustomId(`bingo_rules_${gameId}`)
            .setLabel('قوانین بازی')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📜'),
          new ButtonBuilder()
            .setCustomId(`bingo_cancel_${gameId}`)
            .setLabel('لغو بازی')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );
      
      if (gameState.messageId) {
        try {
          const message = await channel.messages.fetch(gameState.messageId);
          await message.edit({ embeds: [embed], components: [row] });
        } catch (error) {
          // پیام قبلی یافت نشد، پیام جدید ارسال می‌کنیم
          const message = await channel.send({ embeds: [embed], components: [row] });
          gameState.messageId = message.id;
        }
      } else {
        // اولین ارسال پیام
        const message = await channel.send({ embeds: [embed], components: [row] });
        gameState.messageId = message.id;
      }
      
    } else if (status === 'active') {
      // وضعیت بازی فعال
      embed.setDescription(
        '🎮 بازی بینگو در حال انجام است!\n' +
        'هر 30 ثانیه یک عدد جدید اعلام می‌شود.\n' +
        'وقتی یک خط کامل در کارت خود داشتید، روی دکمه "اعلام بینگو" در پیام خصوصی خود کلیک کنید.'
      )
      .addFields(
        { name: '👥 بازیکنان', value: `${players.length} نفر`, inline: true },
        { name: '🔢 عدد فعلی', value: currentNumber ? currentNumber.toString() : 'در حال قرعه‌کشی...', inline: true },
        { name: '📊 تعداد اعداد اعلام شده', value: calledNumbers.size.toString(), inline: true },
        { name: '📋 اعداد اعلام شده', value: Array.from(calledNumbers).sort((a, b) => a - b).join(', ') || 'هنوز عددی اعلام نشده', inline: false }
      )
      .setFooter({ text: `شناسه بازی: ${gameId} | هر 30 ثانیه یک عدد جدید اعلام می‌شود` });
      
      // دکمه‌های بازی
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`bingo_rules_${gameId}`)
            .setLabel('قوانین بازی')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📜'),
          new ButtonBuilder()
            .setCustomId(`bingo_end_${gameId}`)
            .setLabel('پایان بازی')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🛑')
        );
      
      if (gameState.messageId) {
        try {
          const message = await channel.messages.fetch(gameState.messageId);
          await message.edit({ embeds: [embed], components: [row] });
        } catch (error) {
          // پیام قبلی یافت نشد، پیام جدید ارسال می‌کنیم
          const message = await channel.send({ embeds: [embed], components: [row] });
          gameState.messageId = message.id;
        }
      } else {
        // اولین ارسال پیام
        const message = await channel.send({ embeds: [embed], components: [row] });
        gameState.messageId = message.id;
      }
      
    } else if (status === 'ended') {
      // وضعیت پایان بازی
      embed.setDescription(
        '🏁 بازی بینگو به پایان رسید!\n' +
        (winners.length > 0 ? `🏆 برنده: <@${winners.join('>, <@')}>` : 'هیچ برنده‌ای نداشتیم!')
      )
      .addFields(
        { name: '👥 تعداد بازیکنان', value: `${players.length} نفر`, inline: true },
        { name: '🔢 تعداد اعداد اعلام شده', value: calledNumbers.size.toString(), inline: true },
        { name: '💰 جایزه', value: winners.length > 0 ? `هر برنده: ${Math.floor(200 / winners.length)} کوین` : 'بدون جایزه', inline: true },
        { name: '📋 اعداد اعلام شده', value: Array.from(calledNumbers).sort((a, b) => a - b).join(', '), inline: false }
      )
      .setFooter({ text: `شناسه بازی: ${gameId} | بازی به پایان رسید` });
      
      // دکمه بازی جدید
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('bingo')
            .setLabel('بازی جدید')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎮')
        );
      
      if (gameState.messageId) {
        try {
          const message = await channel.messages.fetch(gameState.messageId);
          await message.edit({ embeds: [embed], components: [row] });
        } catch (error) {
          // پیام قبلی یافت نشد، پیام جدید ارسال می‌کنیم
          await channel.send({ embeds: [embed], components: [row] });
        }
      } else {
        // اولین ارسال پیام
        await channel.send({ embeds: [embed], components: [row] });
      }
      
      // پاک کردن بازی از لیست بازی‌های فعال
      setTimeout(() => {
        activeGames.delete(gameId);
      }, 60000); // یک دقیقه بعد پاک می‌شود
    }
    
  } catch (error) {
    console.error(`Error updating bingo game status:`, error);
  }
}

/**
 * انتخاب یک عدد تصادفی جدید که قبلاً اعلام نشده باشد
 * @param gameState وضعیت بازی
 * @returns عدد تصادفی جدید
 */
function drawNewNumber(gameState: BingoGameState): number {
  const { calledNumbers } = gameState;
  
  // یافتن اعدادی که هنوز اعلام نشده‌اند
  const availableNumbers = [];
  for (let i = 1; i <= 25; i++) {
    if (!calledNumbers.has(i)) {
      availableNumbers.push(i);
    }
  }
  
  // اگر همه اعداد اعلام شده باشند، بازی را به پایان می‌رسانیم
  if (availableNumbers.length === 0) {
    endBingoGame(gameState.gameId, "all_numbers_called");
    return 0;
  }
  
  // انتخاب یک عدد تصادفی
  const randomIndex = Math.floor(Math.random() * availableNumbers.length);
  return availableNumbers[randomIndex];
}

/**
 * اعلام یک عدد جدید در بازی بینگو
 * @param gameId شناسه بازی
 */
async function callNumber(gameId: string): Promise<void> {
  const gameState = activeGames.get(gameId);
  if (!gameState || gameState.status !== 'active') {
    return;
  }
  
  // انتخاب یک عدد تصادفی
  const newNumber = drawNewNumber(gameState);
  
  if (newNumber === 0) {
    return; // بازی به پایان رسیده (همه اعداد اعلام شده)
  }
  
  // به‌روزرسانی وضعیت بازی
  gameState.currentNumber = newNumber;
  gameState.calledNumbers.add(newNumber);
  gameState.lastUpdate = Date.now();
  
  try {
    // یافتن کانال
    const channel = await (await storage.discord.client.channels.fetch(gameState.channelId)) as TextChannel;
    if (!channel) {
      console.error(`Channel for game ${gameId} not found.`);
      return;
    }
    
    // اعلام عدد جدید در کانال
    await channel.send(`🔢 **عدد جدید اعلام شد: ${newNumber}**\nلطفاً کارت‌های خود را بررسی کنید!`);
    
    // به‌روزرسانی وضعیت بازی در کانال
    await updateGameStatus(gameState, channel);
    
    // به‌روزرسانی کارت‌های بازیکنان
    for (const playerId of gameState.players) {
      try {
        const player = await storage.discord.client.users.fetch(playerId);
        const playerCard = gameState.cards.get(playerId);
        
        if (player && playerCard) {
          // علامت‌گذاری عدد جدید روی کارت بازیکن
          const updatedCard = markNumberOnCard(playerCard, newNumber);
          gameState.cards.set(playerId, updatedCard);
          
          // ارسال کارت به‌روزرسانی شده به بازیکن
          await updatePlayerCard(player, updatedCard, gameId, gameState.calledNumbers);
          
          // بررسی برنده شدن بازیکن
          if (checkForBingo(updatedCard.marks)) {
            // بازیکن برنده شده است!
            await handleBingoClaim(player, gameId);
          }
        }
      } catch (error) {
        console.error(`Error updating card for player ${playerId}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error calling number for game ${gameId}:`, error);
  }
}

/**
 * تابع اصلی برای اجرای راند بعدی بازی
 * @param gameId شناسه بازی
 */
async function runBingoRound(gameId: string): Promise<void> {
  const gameState = activeGames.get(gameId);
  if (!gameState || gameState.status !== 'active') {
    return;
  }
  
  // اعلام عدد جدید
  await callNumber(gameId);
  
  // تنظیم تایمر برای راند بعدی (هر 30 ثانیه)
  gameState.roundInterval = setTimeout(() => runBingoRound(gameId), 30000);
}

/**
 * شروع بازی بینگو
 * @param gameId شناسه بازی
 */
async function startBingoGame(gameId: string): Promise<void> {
  const gameState = activeGames.get(gameId);
  if (!gameState || gameState.status !== 'waiting') {
    return;
  }
  
  // تغییر وضعیت بازی به فعال
  gameState.status = 'active';
  gameState.lastUpdate = Date.now();
  
  try {
    // یافتن کانال
    const channel = await (await storage.discord.client.channels.fetch(gameState.channelId)) as TextChannel;
    if (!channel) {
      console.error(`Channel for game ${gameId} not found.`);
      return;
    }
    
    // اعلام شروع بازی
    await channel.send({
      content: `🎮 **بازی بینگو شروع شد!**\n👥 تعداد بازیکنان: ${gameState.players.length}\n⏱️ هر 30 ثانیه یک عدد جدید اعلام می‌شود.\n📩 کارت بینگو برای هر بازیکن به صورت خصوصی ارسال شده است.`,
      allowedMentions: { parse: ['everyone'] }
    });
    
    // به‌روزرسانی وضعیت بازی در کانال
    await updateGameStatus(gameState, channel);
    
    // ثبت یک گزارش از بازی در پایگاه داده
    await storage.createGameSession({
      gameId,
      gameType: 'bingo',
      guildId: channel.guildId,
      channelId: channel.id,
      hostId: gameState.hostId,
      players: gameState.players,
      scores: [],
      status: 'active',
      settings: {
        timePerTurn: 30,
        isPrivate: false,
        allowSpectators: true,
        maxPlayers: 10,
        minPlayers: 3,
        prizeCoin: 200,
        language: 'fa'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // شروع بازی با اعلام اولین عدد
    runBingoRound(gameId);
    
  } catch (error) {
    console.error(`Error starting bingo game ${gameId}:`, error);
  }
}

/**
 * پایان دادن به بازی بینگو
 * @param gameId شناسه بازی
 * @param reason دلیل پایان بازی (برنده، لغو، زمان)
 */
async function endBingoGame(gameId: string, reason: 'winner' | 'cancelled' | 'timeout' | 'all_numbers_called'): Promise<void> {
  const gameState = activeGames.get(gameId);
  if (!gameState) {
    return;
  }
  
  // توقف تایمر راند
  if (gameState.roundInterval) {
    clearTimeout(gameState.roundInterval);
    gameState.roundInterval = null;
  }
  
  // تغییر وضعیت بازی به پایان یافته
  gameState.status = 'ended';
  gameState.lastUpdate = Date.now();
  
  try {
    // یافتن کانال
    const channel = await (await storage.discord.client.channels.fetch(gameState.channelId)) as TextChannel;
    if (!channel) {
      console.error(`Channel for game ${gameId} not found.`);
      return;
    }
    
    // پرداخت جایزه به برندگان
    if (gameState.winners.length > 0 && reason === 'winner') {
      const prizePerWinner = Math.floor(200 / gameState.winners.length);
      
      for (const winnerId of gameState.winners) {
        try {
          // افزایش موجودی برنده
          await storage.updateUserWallet(winnerId, prizePerWinner);
          
          // ثبت تراکنش
          await storage.createTransaction({
            userId: parseInt(winnerId),
            amount: prizePerWinner,
            type: 'game_win',
            description: `جایزه برنده شدن در بازی بینگو (شناسه بازی: ${gameId})`,
            createdAt: new Date()
          });
          
          // افزایش آمار بازی کاربر
          const user = await storage.getUserByDiscordId(winnerId);
          if (user) {
            await storage.updateUserById(user.id, {
              totalGamesPlayed: user.totalGamesPlayed + 1,
              totalGamesWon: user.totalGamesWon + 1
            });
          }
        } catch (error) {
          console.error(`Error awarding prize to winner ${winnerId}:`, error);
        }
      }
      
      // اعلام برندگان در کانال
      const winnersMention = gameState.winners.map(id => `<@${id}>`).join(', ');
      await channel.send({
        content: `🏆 **بازی بینگو به پایان رسید!**\n🎉 برندگان: ${winnersMention}\n💰 جایزه هر برنده: ${prizePerWinner} کوین`,
        allowedMentions: { users: gameState.winners }
      });
    } else {
      // پیام پایان بازی بدون برنده
      let endMessage = '';
      
      switch (reason) {
        case 'cancelled':
          endMessage = '❌ **بازی بینگو لغو شد!**';
          break;
        case 'timeout':
          endMessage = '⏱️ **بازی بینگو به دلیل عدم فعالیت به پایان رسید!**';
          break;
        case 'all_numbers_called':
          endMessage = '🔢 **تمام اعداد بینگو اعلام شدند و بازی به پایان رسید!**';
          break;
        default:
          endMessage = '🏁 **بازی بینگو به پایان رسید!**';
          break;
      }
      
      await channel.send(endMessage);
    }
    
    // به‌روزرسانی وضعیت نهایی بازی در کانال
    await updateGameStatus(gameState, channel);
    
    // به‌روزرسانی رکورد بازی در پایگاه داده
    await storage.endGameSession(gameId, {
      status: 'ended',
      endedAt: new Date()
    });
    
    // افزایش آمار بازی برای همه بازیکنان
    for (const playerId of gameState.players) {
      if (!gameState.winners.includes(playerId)) {
        try {
          const user = await storage.getUserByDiscordId(playerId);
          if (user) {
            await storage.updateUserById(user.id, {
              totalGamesPlayed: user.totalGamesPlayed + 1
            });
          }
        } catch (error) {
          console.error(`Error updating stats for player ${playerId}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error(`Error ending bingo game ${gameId}:`, error);
  }
}

/**
 * رسیدگی به اعلام بینگو توسط بازیکن
 * @param user کاربر بازیکن
 * @param gameId شناسه بازی
 */
async function handleBingoClaim(user: User, gameId: string): Promise<void> {
  const gameState = activeGames.get(gameId);
  if (!gameState || gameState.status !== 'active') {
    await user.send('❌ این بازی دیگر فعال نیست!');
    return;
  }
  
  // بررسی اینکه آیا بازیکن در این بازی شرکت دارد
  if (!gameState.players.includes(user.id)) {
    await user.send('❌ شما در این بازی شرکت ندارید!');
    return;
  }
  
  // بررسی اینکه آیا بازیکن قبلاً برنده شده است
  if (gameState.winners.includes(user.id)) {
    await user.send('✅ شما قبلاً در این بازی برنده شده‌اید!');
    return;
  }
  
  // دریافت کارت بازیکن
  const playerCard = gameState.cards.get(user.id);
  if (!playerCard) {
    await user.send('❌ کارت بینگو شما یافت نشد!');
    return;
  }
  
  // بررسی اعتبار بینگو
  const isValidBingo = checkForBingo(playerCard.marks);
  
  if (isValidBingo) {
    // اضافه کردن بازیکن به لیست برندگان
    gameState.winners.push(user.id);
    
    // ارسال پیام تبریک به بازیکن
    await user.send({
      content: '🎉 **تبریک! بینگوی شما تأیید شد!**\n💰 جایزه شما به زودی واریز می‌شود.',
      embeds: [
        new EmbedBuilder()
          .setTitle('🏆 کارت برنده بینگو')
          .setDescription(displayBingoCard(playerCard.card, playerCard.marks))
          .setColor('#FFD700')
      ]
    });
    
    try {
      // یافتن کانال
      const channel = await (await storage.discord.client.channels.fetch(gameState.channelId)) as TextChannel;
      if (channel) {
        // اعلام برنده جدید در کانال
        await channel.send({
          content: `🏆 **بینگو!** <@${user.id}> برنده شد!`,
          allowedMentions: { users: [user.id] }
        });
        
        // پایان دادن به بازی اگر این اولین برنده است
        if (gameState.winners.length === 1) {
          await endBingoGame(gameId, 'winner');
        } else {
          // به‌روزرسانی وضعیت بازی در کانال
          await updateGameStatus(gameState, channel);
        }
      }
    } catch (error) {
      console.error(`Error announcing bingo winner in channel:`, error);
    }
  } else {
    // بینگو نامعتبر بود
    await user.send({
      content: '❌ **بینگوی شما تأیید نشد!**\nشما هنوز یک خط کامل (سطر، ستون یا قطر) ندارید.',
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ کارت بینگو')
          .setDescription(displayBingoCard(playerCard.card, playerCard.marks))
          .setColor('#FF0000')
      ]
    });
  }
}

/**
 * ایجاد یک بازی بینگو جدید
 * @param interaction تعامل دکمه
 */
export async function createBingoGame(interaction: ButtonInteraction): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // بررسی اینکه کاربر ثبت‌نام کرده باشد
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.editReply('❌ شما باید ابتدا ثبت‌نام کنید! از دستور `/menu` استفاده کنید.');
      return;
    }
    
    // بررسی اینکه آیا کانال متنی است
    if (!interaction.channel || interaction.channel.type !== 0) {
      await interaction.editReply('❌ این دستور فقط در کانال‌های متنی قابل استفاده است!');
      return;
    }
    
    // بررسی اینکه آیا بازی فعالی در این کانال وجود دارد
    const existingGames = Array.from(activeGames.values())
      .filter(game => game.channelId === interaction.channelId && game.status !== 'ended');
    
    if (existingGames.length > 0) {
      await interaction.editReply('❌ یک بازی در حال انجام در این کانال وجود دارد! لطفاً منتظر پایان آن باشید یا از کانال دیگری استفاده کنید.');
      return;
    }
    
    // ایجاد شناسه منحصر به فرد برای بازی
    const gameId = uuidv4().substring(0, 8);
    
    // ایجاد وضعیت بازی جدید
    const gameState: BingoGameState = {
      gameId,
      channelId: interaction.channelId,
      hostId: interaction.user.id,
      players: [interaction.user.id], // میزبان به طور خودکار به عنوان بازیکن اضافه می‌شود
      cards: new Map(),
      calledNumbers: new Set(),
      currentNumber: null,
      status: 'waiting',
      lastUpdate: Date.now(),
      winners: [],
      messageId: null,
      roundInterval: null
    };
    
    // ایجاد کارت بینگو برای میزبان
    const hostCard = generateBingoCard();
    gameState.cards.set(interaction.user.id, hostCard);
    
    // ذخیره بازی در مخزن بازی‌های فعال
    activeGames.set(gameId, gameState);
    
    // ارسال کارت بینگو به میزبان
    await sendBingoCardToPlayer(interaction.user, hostCard, gameId);
    
    // به‌روزرسانی وضعیت بازی در کانال
    await updateGameStatus(gameState, interaction.channel as TextChannel);
    
    // اعلام موفقیت
    await interaction.editReply('✅ بازی بینگو جدید ایجاد شد! کارت بینگو برای شما ارسال شده است.');
    
    // تنظیم تایمر برای بررسی غیرفعال بودن بازی
    setTimeout(() => {
      const game = activeGames.get(gameId);
      if (game && game.status === 'waiting' && Date.now() - game.lastUpdate > 10 * 60 * 1000) {
        // اگر بازی 10 دقیقه در وضعیت انتظار باشد، آن را لغو می‌کنیم
        endBingoGame(gameId, 'timeout');
      }
    }, 10 * 60 * 1000);
    
  } catch (error) {
    console.error('Error creating bingo game:', error);
    
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply('❌ متأسفانه در ایجاد بازی خطایی رخ داد! لطفاً دوباره تلاش کنید.');
    }
  }
}

/**
 * پیوستن به یک بازی بینگو
 * @param interaction تعامل دکمه
 * @param gameId شناسه بازی
 */
export async function joinBingoGame(interaction: ButtonInteraction, gameId: string): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // بررسی اینکه کاربر ثبت‌نام کرده باشد
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.editReply('❌ شما باید ابتدا ثبت‌نام کنید! از دستور `/menu` استفاده کنید.');
      return;
    }
    
    // بررسی اینکه بازی وجود داشته باشد
    const gameState = activeGames.get(gameId);
    if (!gameState) {
      await interaction.editReply('❌ این بازی وجود ندارد یا به پایان رسیده است!');
      return;
    }
    
    // بررسی اینکه بازی در حالت انتظار باشد
    if (gameState.status !== 'waiting') {
      await interaction.editReply('❌ این بازی قبلاً شروع شده است و نمی‌توانید به آن بپیوندید!');
      return;
    }
    
    // بررسی اینکه بازیکن قبلاً در بازی شرکت نکرده باشد
    if (gameState.players.includes(interaction.user.id)) {
      await interaction.editReply('✅ شما قبلاً به این بازی پیوسته‌اید! کارت بینگو در پیام‌های خصوصی شما ارسال شده است.');
      return;
    }
    
    // بررسی اینکه ظرفیت بازی تکمیل نشده باشد
    if (gameState.players.length >= 10) {
      await interaction.editReply('❌ ظرفیت این بازی تکمیل شده است!');
      return;
    }
    
    // اضافه کردن بازیکن به بازی
    gameState.players.push(interaction.user.id);
    
    // ایجاد کارت بینگو برای بازیکن
    const playerCard = generateBingoCard();
    gameState.cards.set(interaction.user.id, playerCard);
    
    // به‌روزرسانی زمان آخرین تغییر
    gameState.lastUpdate = Date.now();
    
    // ارسال کارت بینگو به بازیکن
    const cardSent = await sendBingoCardToPlayer(interaction.user, playerCard, gameId);
    
    if (!cardSent) {
      // اگر ارسال کارت ناموفق بود، بازیکن را از بازی حذف می‌کنیم
      gameState.players = gameState.players.filter(id => id !== interaction.user.id);
      gameState.cards.delete(interaction.user.id);
      
      await interaction.editReply('❌ به دلیل محدودیت‌های پیام خصوصی، امکان ارسال کارت بینگو برای شما وجود ندارد! لطفاً تنظیمات پیام خصوصی خود را بررسی کنید.');
      return;
    }
    
    // به‌روزرسانی وضعیت بازی در کانال
    const channel = interaction.channel as TextChannel;
    await updateGameStatus(gameState, channel);
    
    // اعلام موفقیت
    await interaction.editReply('✅ شما با موفقیت به بازی بینگو پیوستید! کارت بینگو برای شما ارسال شده است.');
    
    // اعلام پیوستن بازیکن جدید
    await channel.send(`👤 <@${interaction.user.id}> به بازی بینگو پیوست! (${gameState.players.length}/10)`);
    
  } catch (error) {
    console.error(`Error joining bingo game ${gameId}:`, error);
    
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply('❌ متأسفانه در پیوستن به بازی خطایی رخ داد! لطفاً دوباره تلاش کنید.');
    }
  }
}

/**
 * شروع یک بازی بینگو
 * @param interaction تعامل دکمه
 * @param gameId شناسه بازی
 */
export async function startBingoGameCommand(interaction: ButtonInteraction, gameId: string): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // بررسی اینکه بازی وجود داشته باشد
    const gameState = activeGames.get(gameId);
    if (!gameState) {
      await interaction.editReply('❌ این بازی وجود ندارد یا به پایان رسیده است!');
      return;
    }
    
    // بررسی اینکه بازی در حالت انتظار باشد
    if (gameState.status !== 'waiting') {
      await interaction.editReply('❌ این بازی قبلاً شروع شده است!');
      return;
    }
    
    // بررسی اینکه کاربر میزبان بازی باشد
    if (interaction.user.id !== gameState.hostId) {
      await interaction.editReply('❌ فقط میزبان بازی می‌تواند بازی را شروع کند!');
      return;
    }
    
    // بررسی اینکه حداقل تعداد بازیکنان لازم وجود داشته باشد
    if (gameState.players.length < 3) {
      await interaction.editReply(`❌ برای شروع بازی حداقل به 3 بازیکن نیاز است! (${gameState.players.length}/3)`);
      return;
    }
    
    // شروع بازی
    await startBingoGame(gameId);
    
    // اعلام موفقیت
    await interaction.editReply('✅ بازی بینگو با موفقیت شروع شد!');
    
  } catch (error) {
    console.error(`Error starting bingo game ${gameId}:`, error);
    
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply('❌ متأسفانه در شروع بازی خطایی رخ داد! لطفاً دوباره تلاش کنید.');
    }
  }
}

/**
 * نمایش قوانین بازی بینگو
 * @param interaction تعامل دکمه
 * @param gameId شناسه بازی
 */
export async function showBingoRules(interaction: ButtonInteraction, gameId: string): Promise<void> {
  try {
    // ساخت امبد برای نمایش قوانین بازی
    const embed = new EmbedBuilder()
      .setTitle('📜 قوانین بازی بینگو')
      .setDescription('اینجا قوانین کامل بازی بینگو رو می‌تونی بخونی! 🔢')
      .setColor('#9B59B6')
      .addFields(
        { 
          name: '👥 شروع بازی و دریافت کارت',
          value: '🔹 هر بازیکن یک کارت 5×5 با اعداد تصادفی از 1 تا 25 دریافت می‌کند.\n' +
                '🔹 وسط کارت (موقعیت 3×3) یک ستاره ⭐ به عنوان خانه رایگان دارد.\n' +
                '🔹 کارت هر بازیکن به صورت خصوصی برایش ارسال می‌شود.',
          inline: false 
        },
        { 
          name: '🎲 اعلام اعداد',
          value: '🔹 ربات هر 30 ثانیه یک عدد تصادفی از 1 تا 25 اعلام می‌کند.\n' +
                '🔹 بازیکنان باید اعداد اعلام‌شده را با کارت خود چک کنند.\n' +
                '🔹 اگر عدد اعلام‌شده در کارت بازیکن باشد، به طور خودکار علامت‌گذاری می‌شود.',
          inline: false 
        },
        { 
          name: '✅ اعلام بینگو',
          value: '🔹 برای برنده شدن، باید یک خط کامل (افقی، عمودی یا قطری) از اعداد علامت‌گذاری شده داشته باشید.\n' +
                '🔹 وقتی یک خط کامل کردید، دکمه "اعلام بینگو" را بزنید.\n' +
                '🔹 ربات کارت شما را بررسی می‌کند و اگر درست باشد، شما برنده می‌شوید! 🏆',
          inline: false 
        },
        { 
          name: '🏁 پایان بازی',
          value: '🔹 بازی وقتی تمام می‌شود که یک بازیکن بینگو را اعلام کند و ربات تأیید کند.\n' +
                '🔹 اگر چند نفر همزمان بینگو کنند، جایزه بینشان تقسیم می‌شود.\n' +
                '🔹 جایزه (200 کوین) به برنده یا برندگان داده می‌شود. 🤑',
          inline: false 
        }
      )
      .setFooter({ text: 'برای بازگشت به منوی بازی، دکمه بازگشت را بزنید!' });
    
    // دکمه بازگشت
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`bingo_back_${gameId}`)
          .setLabel('بازگشت 🔙')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    
  } catch (error) {
    console.error(`Error showing bingo rules:`, error);
    await interaction.reply({ content: '❌ متأسفانه در نمایش قوانین خطایی رخ داد!', ephemeral: true });
  }
}

/**
 * لغو یک بازی بینگو
 * @param interaction تعامل دکمه
 * @param gameId شناسه بازی
 */
export async function cancelBingoGame(interaction: ButtonInteraction, gameId: string): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // بررسی اینکه بازی وجود داشته باشد
    const gameState = activeGames.get(gameId);
    if (!gameState) {
      await interaction.editReply('❌ این بازی وجود ندارد یا به پایان رسیده است!');
      return;
    }
    
    // بررسی اینکه کاربر میزبان بازی یا ادمین باشد
    const member = interaction.member as GuildMember;
    const hasAdminPermission = member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (interaction.user.id !== gameState.hostId && !hasAdminPermission) {
      await interaction.editReply('❌ فقط میزبان بازی یا ادمین سرور می‌تواند بازی را لغو کند!');
      return;
    }
    
    // لغو بازی
    await endBingoGame(gameId, 'cancelled');
    
    // اعلام موفقیت
    await interaction.editReply('✅ بازی بینگو با موفقیت لغو شد!');
    
  } catch (error) {
    console.error(`Error cancelling bingo game ${gameId}:`, error);
    
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply('❌ متأسفانه در لغو بازی خطایی رخ داد! لطفاً دوباره تلاش کنید.');
    }
  }
}

/**
 * پایان دادن به یک بازی بینگو فعال
 * @param interaction تعامل دکمه
 * @param gameId شناسه بازی
 */
export async function endBingoGameCommand(interaction: ButtonInteraction, gameId: string): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // بررسی اینکه بازی وجود داشته باشد
    const gameState = activeGames.get(gameId);
    if (!gameState) {
      await interaction.editReply('❌ این بازی وجود ندارد یا به پایان رسیده است!');
      return;
    }
    
    // بررسی اینکه بازی در حالت فعال باشد
    if (gameState.status !== 'active') {
      await interaction.editReply('❌ این بازی هنوز شروع نشده است!');
      return;
    }
    
    // بررسی اینکه کاربر میزبان بازی یا ادمین باشد
    const member = interaction.member as GuildMember;
    const hasAdminPermission = member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (interaction.user.id !== gameState.hostId && !hasAdminPermission) {
      await interaction.editReply('❌ فقط میزبان بازی یا ادمین سرور می‌تواند بازی را پایان دهد!');
      return;
    }
    
    // پایان دادن به بازی
    await endBingoGame(gameId, gameState.winners.length > 0 ? 'winner' : 'cancelled');
    
    // اعلام موفقیت
    await interaction.editReply('✅ بازی بینگو با موفقیت به پایان رسید!');
    
  } catch (error) {
    console.error(`Error ending bingo game ${gameId}:`, error);
    
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply('❌ متأسفانه در پایان دادن به بازی خطایی رخ داد! لطفاً دوباره تلاش کنید.');
    }
  }
}

/**
 * بررسی و ادعای بینگو
 * @param interaction تعامل دکمه
 * @param gameId شناسه بازی
 */
export async function claimBingo(interaction: ButtonInteraction, gameId: string): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // رسیدگی به ادعای بینگو
    await handleBingoClaim(interaction.user, gameId);
    
    // پاسخ به تعامل (اصل پاسخ در تابع handleBingoClaim انجام می‌شود)
    await interaction.editReply('✅ درخواست اعلام بینگو شما ثبت شد و در حال بررسی است...');
    
  } catch (error) {
    console.error(`Error claiming bingo for ${interaction.user.id} in game ${gameId}:`, error);
    
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply('❌ متأسفانه در بررسی ادعای بینگو خطایی رخ داد! لطفاً دوباره تلاش کنید.');
    }
  }
}

/**
 * مدیریت همه تعاملات بینگو
 * @param interaction تعامل دکمه
 * @returns آیا تعامل توسط این ماژول مدیریت شد؟
 */
export async function handleBingoInteraction(interaction: ButtonInteraction): Promise<boolean> {
  if (!interaction.isButton()) return false;
  
  const customId = interaction.customId;
  
  // بررسی دکمه ایجاد بازی جدید
  if (customId === 'bingo') {
    await createBingoGame(interaction);
    return true;
  }
  
  // دکمه‌های مرتبط با بازی‌های موجود
  // فرمت: bingo_action_gameId
  if (customId.startsWith('bingo_')) {
    const parts = customId.split('_');
    
    if (parts.length < 3) return false;
    
    const action = parts[1];
    const gameId = parts[2];
    
    switch (action) {
      case 'join':
        await joinBingoGame(interaction, gameId);
        return true;
      case 'start':
        await startBingoGameCommand(interaction, gameId);
        return true;
      case 'rules':
        await showBingoRules(interaction, gameId);
        return true;
      case 'cancel':
        await cancelBingoGame(interaction, gameId);
        return true;
      case 'end':
        await endBingoGameCommand(interaction, gameId);
        return true;
      case 'claim':
        await claimBingo(interaction, gameId);
        return true;
      case 'back':
        try {
          const gameState = activeGames.get(gameId);
          if (gameState && interaction.channelId === gameState.channelId) {
            // به‌روزرسانی وضعیت بازی در کانال
            const channel = await (await storage.discord.client.channels.fetch(gameState.channelId)) as TextChannel;
            await updateGameStatus(gameState, channel);
            await interaction.reply({ content: '✅ بازگشت به منوی بازی!', ephemeral: true });
          } else {
            await interaction.reply({ content: '✅ بازگشت به منوی بازی!', ephemeral: true });
          }
        } catch (error) {
          console.error(`Error handling back button:`, error);
          await interaction.reply({ content: '❌ خطا در بازگشت به منوی بازی!', ephemeral: true });
        }
        return true;
    }
  }
  
  return false;
}