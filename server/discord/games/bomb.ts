import { 
  ButtonInteraction, 
  MessageComponentInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} from 'discord.js';
import { storage } from '../../storage';

// Game constants
const BET_AMOUNT = 60;
const REWARD_AMOUNT = 200;
const BOMB_COUNT = 3;
const SAFE_COUNT = 12;
const TOTAL_TILES = BOMB_COUNT + SAFE_COUNT;

interface BombGame {
  bombs: number[];
  revealed: number[];
  gameState: 'playing' | 'won' | 'lost';
  safeFound: number;
  multiplier: number;
}

// Store active games
const activeGames: Record<string, BombGame> = {};

// Generate random bomb positions
function generateBombPositions(): number[] {
  const positions: number[] = [];
  while (positions.length < BOMB_COUNT) {
    const pos = Math.floor(Math.random() * TOTAL_TILES);
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
  }
  return positions;
}

// Calculate multiplier based on safe tiles found
function calculateMultiplier(safeFound: number): number {
  const multipliers = [1, 1.2, 1.5, 2, 2.8, 4, 6, 9, 13, 19, 28, 42, 63];
  return multipliers[Math.min(safeFound, multipliers.length - 1)] || 1;
}

// Create game board display
function createGameBoard(game: BombGame): string {
  let board = '';
  for (let i = 0; i < TOTAL_TILES; i++) {
    if (game.revealed.includes(i)) {
      if (game.bombs.includes(i)) {
        board += '💥 ';
      } else {
        board += '💎 ';
      }
    } else {
      board += '🔲 ';
    }
    
    if ((i + 1) % 5 === 0) {
      board += '\n';
    }
  }
  return board;
}

// Function to handle bomb game
export async function handleBomb(
  interaction: MessageComponentInteraction,
  action: string
) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
    
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      const errorMessage = '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
      return;
    }
    
    if (action === 'start') {
      // Check if user has enough money
      if (user.wallet < BET_AMOUNT) {
        const embed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('💣 بمب زمان‌دار - خطا')
          .setDescription('💰 موجودی شما کافی نیست!')
          .addFields(
            { name: '💵 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
            { name: '👛 موجودی شما', value: `${user.wallet} Ccoin`, inline: true }
          )
          .setFooter({ text: 'برای کسب درآمد، از سایر بازی‌ها یا کارها استفاده کنید!' });
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 بازگشت به بازی‌ها')
              .setStyle(ButtonStyle.Secondary)
          );
        
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
        return;
      }
      
      // Start new game
      const bombs = generateBombPositions();
      activeGames[interaction.user.id] = {
        bombs,
        revealed: [],
        gameState: 'playing',
        safeFound: 0,
        multiplier: 1
      };
      
      // Deduct bet amount
      await storage.addToWallet(user.id, -BET_AMOUNT);
      
      const game = activeGames[interaction.user.id];
      
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('💣 بمب زمان‌دار - شروع بازی')
        .setDescription('🎲 پیدا کردن خزانه‌ها و اجتناب از بمب‌ها!')
        .addFields(
          { name: '🎮 تابلو بازی', value: createGameBoard(game), inline: false },
          { name: '💎 خزانه‌های امن', value: `${SAFE_COUNT}`, inline: true },
          { name: '💣 بمب‌ها', value: `${BOMB_COUNT}`, inline: true },
          { name: '📈 ضریب فعلی', value: `×${game.multiplier}`, inline: true },
          { name: '💰 شرط', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه فعلی', value: `${Math.round(BET_AMOUNT * game.multiplier)} Ccoin`, inline: true }
        )
        .setFooter({ text: 'روی کادرها کلیک کنید تا آنها را کشف کنید!' });
      
      // Create buttons for tiles
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let row = 0; row < 3; row++) {
        const actionRow = new ActionRowBuilder<ButtonBuilder>();
        for (let col = 0; col < 5; col++) {
          const tileIndex = row * 5 + col;
          actionRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`game:bomb:reveal:${tileIndex}`)
              .setLabel('🔲')
              .setStyle(ButtonStyle.Secondary)
          );
        }
        rows.push(actionRow);
      }
      
      // Add cash out and back buttons
      const controlRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:bomb:cashout')
            .setLabel('💰 برداشت')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true), // Disabled until at least one safe tile is found
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      
      rows.push(controlRow);
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: rows });
      } else {
        await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
      }
      
    } else if (action.startsWith('reveal:')) {
      const tileIndex = parseInt(action.split(':')[1]);
      const game = activeGames[interaction.user.id];
      
      if (!game || game.gameState !== 'playing') {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد یا بازی تمام شده است!'
        });
        return;
      }
      
      // Check if tile already revealed
      if (game.revealed.includes(tileIndex)) {
        await interaction.editReply({
          content: '❌ این کادر قبلاً کشف شده است!'
        });
        return;
      }
      
      // Reveal tile
      game.revealed.push(tileIndex);
      
      // Check if it's a bomb
      if (game.bombs.includes(tileIndex)) {
        // Game over - hit bomb
        game.gameState = 'lost';
        
        // Reveal all bombs
        game.revealed = [...game.revealed, ...game.bombs];
        
        const loseEmbed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('💣 بمب زمان‌دار - انفجار!')
          .setDescription('💥 متأسفانه روی بمب کلیک کردید!')
          .addFields(
            { name: '🎮 تابلو نهایی', value: createGameBoard(game), inline: false },
            { name: '💎 خزانه‌های پیدا شده', value: `${game.safeFound}/${SAFE_COUNT}`, inline: true },
            { name: '💸 ضرر', value: `${BET_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'آیا می‌خواهید دوباره بازی کنید؟' });
        
        // Record the game as loss
        await storage.recordGame(
          user.id,
          'bomb',
          BET_AMOUNT,
          false,
          0
        );
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('game:bomb:start')
              .setLabel('🔄 بازی مجدد')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 بازگشت به بازی‌ها')
              .setStyle(ButtonStyle.Secondary)
          );
        
        // Clean up game
        delete activeGames[interaction.user.id];
        
        await interaction.editReply({ embeds: [loseEmbed], components: [row] });
        return;
      }
      
      // Safe tile found
      game.safeFound++;
      game.multiplier = calculateMultiplier(game.safeFound);
      
      // Check if all safe tiles found (win condition)
      if (game.safeFound === SAFE_COUNT) {
        game.gameState = 'won';
        
        const rewardAmount = Math.round(BET_AMOUNT * game.multiplier);
        await storage.addToWallet(user.id, rewardAmount);
        
        const winEmbed = new EmbedBuilder()
          .setColor('#2ECC71')
          .setTitle('💣 بمب زمان‌دار - برنده!')
          .setDescription('🎉 عالی! تمام خزانه‌ها را پیدا کردید!')
          .addFields(
            { name: '🎮 تابلو نهایی', value: createGameBoard(game), inline: false },
            { name: '💎 خزانه‌های پیدا شده', value: `${game.safeFound}/${SAFE_COUNT}`, inline: true },
            { name: '📈 ضریب نهایی', value: `×${game.multiplier}`, inline: true },
            { name: '💰 جایزه', value: `+${rewardAmount - BET_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'آیا می‌خواهید دوباره بازی کنید؟' });
        
        // Record the game as win
        await storage.recordGame(
          user.id,
          'bomb',
          BET_AMOUNT,
          true,
          rewardAmount - BET_AMOUNT
        );
        
        // Update quest progress
        const quests = await storage.getUserQuests(user.id);
        for (const { quest, userQuest } of quests) {
          if (quest.requirement === 'win' && !userQuest.completed) {
            await storage.updateQuestProgress(
              user.id,
              quest.id,
              userQuest.progress + 1
            );
          }
        }
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('game:bomb:start')
              .setLabel('🔄 بازی مجدد')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 بازگشت به بازی‌ها')
              .setStyle(ButtonStyle.Secondary)
          );
        
        // Clean up game
        delete activeGames[interaction.user.id];
        
        await interaction.editReply({ embeds: [winEmbed], components: [row] });
        return;
      }
      
      // Continue game
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('💣 بمب زمان‌دار - ادامه بازی')
        .setDescription('💎 خزانه پیدا کردید! ادامه دهید یا برداشت کنید.')
        .addFields(
          { name: '🎮 تابلو بازی', value: createGameBoard(game), inline: false },
          { name: '💎 خزانه‌های پیدا شده', value: `${game.safeFound}/${SAFE_COUNT}`, inline: true },
          { name: '📈 ضریب فعلی', value: `×${game.multiplier}`, inline: true },
          { name: '🏆 جایزه فعلی', value: `${Math.round(BET_AMOUNT * game.multiplier)} Ccoin`, inline: true }
        )
        .setFooter({ text: 'ادامه دهید یا برداشت کنید!' });
      
      // Recreate buttons for remaining tiles
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let row = 0; row < 3; row++) {
        const actionRow = new ActionRowBuilder<ButtonBuilder>();
        for (let col = 0; col < 5; col++) {
          const tileIndex = row * 5 + col;
          const isRevealed = game.revealed.includes(tileIndex);
          const isBomb = game.bombs.includes(tileIndex);
          
          actionRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`game:bomb:reveal:${tileIndex}`)
              .setLabel(isRevealed ? (isBomb ? '💥' : '💎') : '🔲')
              .setStyle(isRevealed ? (isBomb ? ButtonStyle.Danger : ButtonStyle.Success) : ButtonStyle.Secondary)
              .setDisabled(isRevealed)
          );
        }
        rows.push(actionRow);
      }
      
      // Add cash out and back buttons
      const controlRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:bomb:cashout')
            .setLabel(`💰 برداشت (${Math.round(BET_AMOUNT * game.multiplier)} Ccoin)`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      
      rows.push(controlRow);
      
      await interaction.editReply({ embeds: [embed], components: rows });
      
    } else if (action === 'cashout') {
      const game = activeGames[interaction.user.id];
      
      if (!game || game.gameState !== 'playing') {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد یا بازی تمام شده است!'
        });
        return;
      }
      
      if (game.safeFound === 0) {
        await interaction.editReply({
          content: '❌ برای برداشت باید حداقل یک خزانه پیدا کنید!'
        });
        return;
      }
      
      const rewardAmount = Math.round(BET_AMOUNT * game.multiplier);
      await storage.addToWallet(user.id, rewardAmount);
      
      const cashoutEmbed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('💣 بمب زمان‌دار - برداشت')
        .setDescription('💰 شما با موفقیت پول خود را برداشت کردید!')
        .addFields(
          { name: '🎮 تابلو بازی', value: createGameBoard(game), inline: false },
          { name: '💎 خزانه‌های پیدا شده', value: `${game.safeFound}/${SAFE_COUNT}`, inline: true },
          { name: '📈 ضریب', value: `×${game.multiplier}`, inline: true },
          { name: '💰 جایزه', value: `+${rewardAmount - BET_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'آیا می‌خواهید دوباره بازی کنید؟' });
      
      // Record the game as win (cashout)
      await storage.recordGame(
        user.id,
        'bomb',
        BET_AMOUNT,
        true,
        rewardAmount - BET_AMOUNT
      );
      
      // Update quest progress
      const quests = await storage.getUserQuests(user.id);
      for (const { quest, userQuest } of quests) {
        if (quest.requirement === 'win' && !userQuest.completed) {
          await storage.updateQuestProgress(
            user.id,
            quest.id,
            userQuest.progress + 1
          );
        }
      }
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:bomb:start')
            .setLabel('🔄 بازی مجدد')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 بازگشت به بازی‌ها')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // Clean up game
      delete activeGames[interaction.user.id];
      
      await interaction.editReply({ embeds: [cashoutEmbed], components: [row] });
    }
    
  } catch (error) {
    console.error('Error in bomb game:', error);
    
    try {
      const errorMessage = '❌ خطایی در بازی بمب زمان‌دار رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling bomb failure:', e);
    }
  }
}