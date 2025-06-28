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
const BET_AMOUNT = 40;
const REWARD_AMOUNT = 120;

interface ArcheryGame {
  round: number;
  maxRounds: number;
  shots: Array<{ score: number; zone: string }>;
  totalScore: number;
}

// Store active games
const activeGames: Record<string, ArcheryGame> = {};

// Archery scoring zones with probability
function takeShot(): { score: number; zone: string } {
  const random = Math.random();
  
  // Bullseye (center) - 5% chance
  if (random < 0.05) {
    return { score: 10, zone: 'Bullseye' };
  }
  // Inner gold - 10% chance
  else if (random < 0.15) {
    return { score: 9, zone: 'Inner Gold' };
  }
  // Outer gold - 15% chance
  else if (random < 0.3) {
    return { score: 8, zone: 'Outer Gold' };
  }
  // Inner red - 20% chance
  else if (random < 0.5) {
    return { score: 7, zone: 'Inner Red' };
  }
  // Outer red - 20% chance
  else if (random < 0.7) {
    return { score: 6, zone: 'Outer Red' };
  }
  // Inner blue - 15% chance
  else if (random < 0.85) {
    return { score: 5, zone: 'Inner Blue' };
  }
  // Outer blue - 10% chance
  else if (random < 0.95) {
    return { score: 4, zone: 'Outer Blue' };
  }
  // Miss - 5% chance
  else {
    return { score: 0, zone: 'Miss' };
  }
}

// Create target visualization
function createTargetDisplay(shots: Array<{ score: number; zone: string }>): string {
  let display = '🎯 **هدف تیراندازی**\n\n';
  display += '```\n';
  display += '    🟡 Bullseye (10)\n';
  display += '   🟡🟡 Inner Gold (9)\n';
  display += '  🟡🟡🟡 Outer Gold (8)\n';
  display += ' 🔴🔴🔴🔴 Inner Red (7)\n';
  display += '🔴🔴🔴🔴🔴 Outer Red (6)\n';
  display += '🔵🔵🔵🔵🔵🔵 Inner Blue (5)\n';
  display += '🔵🔵🔵🔵🔵🔵🔵 Outer Blue (4)\n';
  display += '```\n\n';
  
  if (shots.length > 0) {
    display += '**تیرهای شما:**\n';
    shots.forEach((shot, index) => {
      const emoji = shot.score === 10 ? '🎯' : 
                   shot.score >= 8 ? '🟡' :
                   shot.score >= 6 ? '🔴' :
                   shot.score >= 4 ? '🔵' : '❌';
      display += `${index + 1}. ${emoji} ${shot.zone} - **${shot.score} امتیاز**\n`;
    });
  }
  
  return display;
}

// Function to handle archery game
export async function handleArchery(
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
          .setTitle('🏹 تیراندازی هدف - خطا')
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
        round: 1,
        maxRounds: 5,
        shots: [],
        totalScore: 0
      };
      
      // Deduct bet amount
      await storage.addToWallet(user.id, -BET_AMOUNT);
      
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('🏹 تیراندازی هدف - شروع بازی')
        .setDescription('🎯 شما ۵ تیر دارید. هدف کنید و امتیاز کسب کنید!')
        .addFields(
          { name: '🎮 هدف', value: createTargetDisplay([]), inline: false },
          { name: '📊 امتیازبندی', value: 'Bullseye: 10 امتیاز\nGold: 8-9 امتیاز\nRed: 6-7 امتیاز\nBlue: 4-5 امتیاز\nMiss: 0 امتیاز', inline: false },
          { name: '💰 شرط', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `تا ${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '🏹 تیر', value: `${1}/5`, inline: true }
        )
        .setFooter({ text: 'روی دکمه تیراندازی کلیک کنید!' });
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:archery:shoot')
            .setLabel('🏹 تیراندازی')
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
      
    } else if (action === 'shoot') {
      const game = activeGames[interaction.user.id];
      
      if (!game) {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد! لطفاً دوباره شروع کنید.'
        });
        return;
      }
      
      // Take a shot
      const shot = takeShot();
      game.shots.push(shot);
      game.totalScore += shot.score;
      
      // Check if game is finished
      if (game.round >= game.maxRounds) {
        // Game finished, determine reward based on performance
        const averageScore = game.totalScore / game.maxRounds;
        let won = false;
        let rewardAmount = 0;
        
        // Win conditions based on average score
        if (averageScore >= 7) {
          won = true;
          // Bonus system based on performance
          const performanceMultiplier = Math.min(2, averageScore / 5); // Max 2x multiplier
          rewardAmount = Math.round(REWARD_AMOUNT * performanceMultiplier);
          await storage.addToWallet(user.id, rewardAmount);
        } else if (averageScore >= 5) {
          // Decent performance - return bet
          rewardAmount = BET_AMOUNT;
          await storage.addToWallet(user.id, BET_AMOUNT);
        }
        
        const resultEmbed = new EmbedBuilder()
          .setColor(won ? '#2ECC71' : averageScore >= 5 ? '#F1C40F' : '#E74C3C')
          .setTitle(`🏹 تیراندازی هدف - ${won ? 'برنده!' : averageScore >= 5 ? 'خوب!' : 'باخت'}`)
          .setDescription(won ? '🎉 عالی! شما یک تیرانداز ماهری هستید!' : averageScore >= 5 ? '👍 عملکرد خوبی داشتید!' : '😔 متأسفانه عملکرد شما کافی نبود!')
          .addFields(
            { name: '🎯 نتایج تیراندازی', value: createTargetDisplay(game.shots), inline: false },
            { name: '📊 آمار کلی', value: `**کل امتیاز:** ${game.totalScore}/50\n**میانگین:** ${averageScore.toFixed(1)}\n**بهترین تیر:** ${Math.max(...game.shots.map(s => s.score))}`, inline: true },
            { name: '🏆 آخرین تیر', value: `${shot.zone} - **${shot.score} امتیاز**`, inline: true },
            { name: '💰 نتیجه مالی', value: won ? `+${rewardAmount - BET_AMOUNT} Ccoin` : averageScore >= 5 ? `±0 Ccoin` : `-${BET_AMOUNT} Ccoin`, inline: false }
          )
          .setFooter({ text: 'آیا می‌خواهید دوباره بازی کنید؟' });
        
        // Record game
        await storage.recordGame(
          user.id,
          'archery',
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
              .setCustomId('game:archery:start')
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
          .setColor(shot.score >= 8 ? '#2ECC71' : shot.score >= 5 ? '#F39C12' : '#E74C3C')
          .setTitle('🏹 تیراندازی هدف - ادامه بازی')
          .setDescription(`${shot.score >= 8 ? '🎯 تیر عالی!' : shot.score >= 5 ? '👍 تیر خوب!' : shot.score > 0 ? '📍 تیر معمولی' : '❌ خطا!'}`)
          .addFields(
            { name: '🎯 نتایج تیراندازی', value: createTargetDisplay(game.shots), inline: false },
            { name: '📊 امتیاز فعلی', value: `${game.totalScore}/${game.maxRounds * 10}`, inline: true },
            { name: '🏆 آخرین تیر', value: `${shot.zone} - **${shot.score} امتیاز**`, inline: true },
            { name: '🏹 تیر', value: `${game.round}/5`, inline: true }
          )
          .setFooter({ text: 'روی دکمه تیراندازی کلیک کنید!' });
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('game:archery:shoot')
              .setLabel('🏹 تیر بعدی')
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
    console.error('Error in archery game:', error);
    
    try {
      const errorMessage = '❌ خطایی در بازی تیراندازی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling archery failure:', e);
    }
  }
}