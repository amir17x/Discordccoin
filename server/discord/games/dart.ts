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
const BET_AMOUNT = 35;
const REWARD_AMOUNT = 105;

interface DartGame {
  playerScore: number;
  computerScore: number;
  round: number;
  maxRounds: number;
  playerShots: number[];
  computerShots: number[];
}

// Store active games
const activeGames: Record<string, DartGame> = {};

// Simulate dart throw with different accuracy zones
function throwDart(): { score: number, zone: string } {
  const random = Math.random();
  
  // Bullseye (center) - 10% chance
  if (random < 0.1) {
    return { score: 50, zone: 'Bulls-eye' };
  }
  // Inner ring - 15% chance
  else if (random < 0.25) {
    return { score: 25, zone: 'Inner Ring' };
  }
  // Middle ring - 30% chance
  else if (random < 0.55) {
    const score = Math.floor(Math.random() * 15) + 10; // 10-24
    return { score, zone: 'Middle Ring' };
  }
  // Outer ring - 35% chance
  else if (random < 0.9) {
    const score = Math.floor(Math.random() * 10) + 1; // 1-10
    return { score, zone: 'Outer Ring' };
  }
  // Miss - 10% chance
  else {
    return { score: 0, zone: 'Miss' };
  }
}

// Computer throw with slight variation
function computerThrow(): { score: number, zone: string } {
  const random = Math.random();
  
  // Computer is slightly worse than perfect
  if (random < 0.08) {
    return { score: 50, zone: 'Bulls-eye' };
  }
  else if (random < 0.23) {
    return { score: 25, zone: 'Inner Ring' };
  }
  else if (random < 0.58) {
    const score = Math.floor(Math.random() * 15) + 10;
    return { score, zone: 'Middle Ring' };
  }
  else if (random < 0.92) {
    const score = Math.floor(Math.random() * 10) + 1;
    return { score, zone: 'Outer Ring' };
  }
  else {
    return { score: 0, zone: 'Miss' };
  }
}

// Function to handle dart game
export async function handleDart(
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
          .setTitle('🎯 دارت رقابتی - خطا')
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
        playerScore: 0,
        computerScore: 0,
        round: 1,
        maxRounds: 3,
        playerShots: [],
        computerShots: []
      };
      
      // Deduct bet amount
      await storage.addToWallet(user.id, -BET_AMOUNT);
      
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('🎯 دارت رقابتی - شروع بازی')
        .setDescription('🎲 بازی دارت شروع شد! شما سه پرتاب دارید.')
        .addFields(
          { name: '📊 امتیازبندی', value: 'Bulls-eye: 50 امتیاز\nInner Ring: 25 امتیاز\nMiddle Ring: 10-24 امتیاز\nOuter Ring: 1-10 امتیاز\nMiss: 0 امتیاز', inline: false },
          { name: '💰 شرط', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '🎯 دور', value: `${1}/${3}`, inline: true }
        )
        .setFooter({ text: 'روی دکمه پرتاب کلیک کنید!' });
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:dart:throw')
            .setLabel('🎯 پرتاب دارت')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Secondary)
        );
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }
      
    } else if (action === 'throw') {
      const game = activeGames[interaction.user.id];
      
      if (!game) {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد! لطفاً دوباره شروع کنید.'
        });
        return;
      }
      
      // Player throws dart
      const playerThrow = throwDart();
      game.playerScore += playerThrow.score;
      game.playerShots.push(playerThrow.score);
      
      // Computer throws dart
      const computerThrowResult = computerThrow();
      game.computerScore += computerThrowResult.score;
      game.computerShots.push(computerThrowResult.score);
      
      const currentRound = game.round;
      
      // Check if game is finished
      if (game.round >= game.maxRounds) {
        // Game finished, determine winner
        const won = game.playerScore > game.computerScore;
        let rewardAmount = 0;
        
        if (won) {
          rewardAmount = REWARD_AMOUNT;
          await storage.addToWallet(user.id, rewardAmount);
        } else if (game.playerScore === game.computerScore) {
          // Draw - return bet
          rewardAmount = BET_AMOUNT;
          await storage.addToWallet(user.id, BET_AMOUNT);
        }
        
        const resultEmbed = new EmbedBuilder()
          .setColor(won ? '#2ECC71' : game.playerScore === game.computerScore ? '#F1C40F' : '#E74C3C')
          .setTitle(`🎯 دارت رقابتی - ${won ? 'برنده!' : game.playerScore === game.computerScore ? 'مساوی!' : 'باخت'}`)
          .setDescription(won ? '🎉 شما برنده شدید!' : game.playerScore === game.computerScore ? '🤝 بازی مساوی شد!' : '😔 شما باختید!')
          .addFields(
            { name: '🎯 امتیاز شما', value: `${game.playerScore} (${game.playerShots.join(', ')})`, inline: true },
            { name: '🤖 امتیاز کامپیوتر', value: `${game.computerScore} (${game.computerShots.join(', ')})`, inline: true },
            { name: '🏆 آخرین پرتاب شما', value: `${playerThrow.score} - ${playerThrow.zone}`, inline: false },
            { name: '💰 نتیجه مالی', value: won ? `+${rewardAmount - BET_AMOUNT} Ccoin` : game.playerScore === game.computerScore ? `±0 Ccoin` : `-${BET_AMOUNT} Ccoin`, inline: false }
          )
          .setFooter({ text: 'آیا می‌خواهید دوباره بازی کنید؟' });
        
        // Record game
        await storage.recordGame(
          user.id,
          'dart',
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
              .setCustomId('game:dart:start')
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
        game.round++;
        
        const embed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🎯 دارت رقابتی - ادامه بازی')
          .setDescription(`🎲 دور ${currentRound} انجام شد!`)
          .addFields(
            { name: '🎯 امتیاز شما', value: `${game.playerScore}`, inline: true },
            { name: '🤖 امتیاز کامپیوتر', value: `${game.computerScore}`, inline: true },
            { name: '🏆 پرتاب شما', value: `${playerThrow.score} - ${playerThrow.zone}`, inline: false },
            { name: '🤖 پرتاب کامپیوتر', value: `${computerThrowResult.score} - ${computerThrowResult.zone}`, inline: false },
            { name: '🎯 دور', value: `${game.round}/${game.maxRounds}`, inline: true }
          )
          .setFooter({ text: 'روی دکمه پرتاب کلیک کنید تا ادامه دهید!' });
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('game:dart:throw')
              .setLabel('🎯 پرتاب بعدی')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 انصراف')
              .setStyle(ButtonStyle.Secondary)
          );
        
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
      }
    }
    
  } catch (error) {
    console.error('Error in dart game:', error);
    
    try {
      const errorMessage = '❌ خطایی در بازی دارت رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling dart failure:', e);
    }
  }
}