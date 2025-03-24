import { 
  ButtonInteraction, 
  MessageComponentInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} from 'discord.js';
import { storage } from '../../storage';
import { gamesMenu } from '../components/gamesMenu';

// Game constants
const BET_AMOUNT = 20;
const REWARD_AMOUNT = 40;

// Function to handle the coin flip game
export async function handleCoinFlip(
  interaction: MessageComponentInteraction,
  action: string
) {
  try {
    // Get user data
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    // Start the game
    if (action === 'start') {
      // Check if user has enough Ccoin
      if (user.wallet < BET_AMOUNT) {
        await interaction.reply({
          content: `You don't have enough Ccoin to play. You need ${BET_AMOUNT} Ccoin but you have ${user.wallet} Ccoin.`,
          ephemeral: true
        });
        return;
      }
      
      // Create the game embed
      const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('🪙 بازی شیر یا خط')
        .setDescription(`یکی را انتخاب کن! اگر برنده شوی، ${REWARD_AMOUNT} سکه دریافت می‌کنی.`)
        .addFields(
          { name: '💰 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی', value: `${user.wallet} Ccoin`, inline: true }
        )
        .setImage('https://cdn.discordapp.com/attachments/1234567890/1234567890/coin_animation.gif')
        .setFooter({ text: 'شیر یا خط را انتخاب کنید!' })
        .setTimestamp();
      
      // Create buttons with different colors
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:coinflip:heads')
            .setLabel('🦁 شیر')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('game:coinflip:tails')
            .setLabel('🪙 خط')
            .setStyle(ButtonStyle.Success)
        );
      
      // Back button
      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      
      // Send the game message
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], components: [row, backRow], ephemeral: false });
      } else {
        await interaction.update({ embeds: [embed], components: [row, backRow] });
      }
      
      return;
    }
    
    // User made a choice (heads or tails)
    
    // Check if user has enough Ccoin
    if (user.wallet < BET_AMOUNT) {
      await interaction.reply({
        content: `You don't have enough Ccoin to play. You need ${BET_AMOUNT} Ccoin but you have ${user.wallet} Ccoin.`,
        ephemeral: true
      });
      return;
    }
    
    // Deduct bet amount from user's wallet
    await storage.addToWallet(user.id, -BET_AMOUNT);
    
    // Determine the result
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === action;
    
    // Create the result embed
    const resultEmbed = new EmbedBuilder()
      .setTitle('🪙 بازی شیر یا خط')
      .setTimestamp();
    
    // Create colorful buttons for next actions
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:coinflip:start')
          .setLabel('🔄 بازی مجدد')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('games')
          .setLabel('🔙 بازگشت به منوی بازی‌ها')
          .setStyle(ButtonStyle.Danger)
      );
    
    if (won) {
      // User won
      await storage.addToWallet(user.id, REWARD_AMOUNT);
      
      resultEmbed
        .setColor('#2ECC71')
        .setDescription('🎉 تبریک! شما برنده شدید! 🎉')
        .addFields(
          { name: '🪙 نتیجه', value: action === 'heads' ? '🦁 شیر' : '🪙 خط', inline: true },
          { name: '💰 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی جدید', value: `${user.wallet + REWARD_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'برای بازی مجدد روی دکمه کلیک کنید' });
    } else {
      // User lost
      resultEmbed
        .setColor('#E74C3C')
        .setDescription('😔 متأسفانه این دفعه باختی!')
        .addFields(
          { name: '🪙 نتیجه', value: result === 'heads' ? '🦁 شیر' : '🪙 خط', inline: true },
          { name: '💰 از دست دادی', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی جدید', value: `${user.wallet - BET_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'می‌خواهی دوباره شانست رو امتحان کنی؟' });
    }
    
    // Record the game
    await storage.recordGame(
      user.id,
      'coinflip',
      BET_AMOUNT,
      won,
      won ? REWARD_AMOUNT : 0
    );
    
    // Update quest progress if user won
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
    
    // Send the result
    await interaction.update({ embeds: [resultEmbed], components: [row] });
    
  } catch (error) {
    console.error('Error in coin flip game:', error);
    
    try {
      await interaction.reply({
        content: 'Sorry, there was an error processing the game!',
        ephemeral: true
      });
    } catch (e) {
      console.error('Error handling coin flip failure:', e);
    }
  }
}
