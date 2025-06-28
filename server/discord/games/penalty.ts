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
const BET_AMOUNT = 45;
const REWARD_AMOUNT = 135;

interface PenaltyGame {
  playerChoice: string | null;
  computerChoice: string | null;
  rounds: number;
  playerScore: number;
  computerScore: number;
  maxRounds: number;
}

// Store active games
const activeGames: Record<string, PenaltyGame> = {};

// Penalty zones
const ZONES = ['left', 'center', 'right'];
const ZONE_NAMES = {
  'left': 'چپ',
  'center': 'وسط', 
  'right': 'راست'
};

// Computer AI for choosing zones (slightly random)
function getComputerChoice(): string {
  const random = Math.random();
  // Computer tends to go center more often
  if (random < 0.4) return 'center';
  else if (random < 0.7) return 'left';
  else return 'right';
}

// Check penalty result
function checkPenaltyResult(playerChoice: string, computerChoice: string): 'goal' | 'save' {
  return playerChoice !== computerChoice ? 'goal' : 'save';
}

// Function to handle penalty game
export async function handlePenalty(
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
          .setTitle('⚽ پنالتی شانس - خطا')
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
      activeGames[interaction.user.id] = {
        playerChoice: null,
        computerChoice: null,
        rounds: 0,
        playerScore: 0,
        computerScore: 0,
        maxRounds: 5
      };
      
      // Deduct bet amount
      await storage.addToWallet(user.id, -BET_AMOUNT);
      
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('⚽ پنالتی شانس - شروع بازی')
        .setDescription('🥅 شما ضربات پنالتی می‌زنید! دروازه‌بان کامپیوتری سعی می‌کند گلتان را مهار کند.')
        .addFields(
          { name: '📊 قوانین', value: '• ۵ ضربه پنالتی\n• هر گل: ۱ امتیاز\n• برای برد باید حداقل ۳ گل بزنید', inline: false },
          { name: '💰 شرط', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '⚽ دور', value: `${1}/5`, inline: true }
        )
        .setFooter({ text: 'روی یکی از گوشه‌ها کلیک کنید!' });
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:penalty:left')
            .setLabel('⬅️ چپ')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('game:penalty:center')
            .setLabel('🎯 وسط')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('game:penalty:right')
            .setLabel('➡️ راست')
            .setStyle(ButtonStyle.Primary)
        );
      
      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Secondary)
        );
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row, backRow] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row, backRow], ephemeral: true });
      }
      
    } else if (['left', 'center', 'right'].includes(action)) {
      const game = activeGames[interaction.user.id];
      
      if (!game) {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد! لطفاً دوباره شروع کنید.'
        });
        return;
      }
      
      // Process penalty shot
      game.playerChoice = action;
      game.computerChoice = getComputerChoice();
      game.rounds++;
      
      const result = checkPenaltyResult(game.playerChoice, game.computerChoice);
      
      if (result === 'goal') {
        game.playerScore++;
      }
      
      // Create result visualization
      let goalVisualization = '🥅\n';
      
      // Show where player shot and where keeper went
      for (const zone of ZONES) {
        let zoneDisplay = '';
        if (zone === game.playerChoice && zone === game.computerChoice) {
          zoneDisplay = '🧤⚽'; // Keeper saved the ball
        } else if (zone === game.playerChoice) {
          zoneDisplay = '⚽'; // Goal!
        } else if (zone === game.computerChoice) {
          zoneDisplay = '🧤'; // Keeper went here but no ball
        } else {
          zoneDisplay = '  ';
        }
        
        if (zone === 'left') goalVisualization += `[${zoneDisplay}]`;
        else if (zone === 'center') goalVisualization += `[${zoneDisplay}]`;
        else goalVisualization += `[${zoneDisplay}]`;
      }
      
      // Check if game is finished
      if (game.rounds >= game.maxRounds) {
        // Game finished
        const won = game.playerScore >= 3;
        let rewardAmount = 0;
        
        if (won) {
          rewardAmount = REWARD_AMOUNT;
          await storage.addToWallet(user.id, rewardAmount);
        }
        
        const resultEmbed = new EmbedBuilder()
          .setColor(won ? '#2ECC71' : '#E74C3C')
          .setTitle(`⚽ پنالتی شانس - ${won ? 'برنده!' : 'باخت'}`)
          .setDescription(won ? '🎉 عالی! شما در ضربات پنالتی پیروز شدید!' : '😔 متأسفانه عملکرد شما کافی نبود!')
          .addFields(
            { name: '🥅 ضربه آخر', value: goalVisualization, inline: false },
            { name: '📊 نتیجه نهایی', value: `شما: ${game.playerScore}/5 گل`, inline: true },
            { name: `${result === 'goal' ? '⚽ گل!' : '🧤 مهار!'}`, value: `شما: ${ZONE_NAMES[game.playerChoice]} | دروازه‌بان: ${ZONE_NAMES[game.computerChoice]}`, inline: false },
            { name: '💰 نتیجه مالی', value: won ? `+${rewardAmount - BET_AMOUNT} Ccoin` : `-${BET_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'آیا می‌خواهید دوباره بازی کنید؟' });
        
        // Record game
        await storage.recordGame(
          user.id,
          'penalty',
          BET_AMOUNT,
          won,
          won ? rewardAmount - BET_AMOUNT : 0
        );
        
        // Update quest progress if won
        if (won) {
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
        }
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('game:penalty:start')
              .setLabel('🔄 بازی مجدد')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 بازگشت به بازی‌ها')
              .setStyle(ButtonStyle.Secondary)
          );
        
        // Clean up game
        delete activeGames[interaction.user.id];
        
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [resultEmbed], components: [row] });
        } else {
          await interaction.reply({ embeds: [resultEmbed], components: [row], ephemeral: true });
        }
        
      } else {
        // Continue game
        const embed = new EmbedBuilder()
          .setColor(result === 'goal' ? '#2ECC71' : '#F39C12')
          .setTitle('⚽ پنالتی شانس - ادامه بازی')
          .setDescription(`${result === 'goal' ? '⚽ گل زدید!' : '🧤 دروازه‌بان مهار کرد!'}`)
          .addFields(
            { name: '🥅 نمایش ضربه', value: goalVisualization, inline: false },
            { name: '📊 امتیاز فعلی', value: `${game.playerScore}/${game.maxRounds} گل`, inline: true },
            { name: `${result === 'goal' ? '⚽ گل!' : '🧤 مهار!'}`, value: `شما: ${ZONE_NAMES[game.playerChoice]} | دروازه‌بان: ${ZONE_NAMES[game.computerChoice]}`, inline: false },
            { name: '⚽ دور', value: `${game.rounds + 1}/5`, inline: true }
          )
          .setFooter({ text: 'روی یکی از گوشه‌ها کلیک کنید!' });
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('game:penalty:left')
              .setLabel('⬅️ چپ')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('game:penalty:center')
              .setLabel('🎯 وسط')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('game:penalty:right')
              .setLabel('➡️ راست')
              .setStyle(ButtonStyle.Primary)
          );
        
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 انصراف')
              .setStyle(ButtonStyle.Secondary)
          );
        
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed], components: [row, backRow] });
        } else {
          await interaction.reply({ embeds: [embed], components: [row, backRow], ephemeral: true });
        }
      }
    }
    
  } catch (error) {
    console.error('Error in penalty game:', error);
    
    try {
      const errorMessage = '❌ خطایی در بازی پنالتی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling penalty failure:', e);
    }
  }
}