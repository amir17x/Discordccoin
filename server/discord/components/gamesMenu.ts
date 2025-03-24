import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the games menu
export async function gamesMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    // Create the games embed
    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('🎮 بخش بازی‌ها')
      .setDescription('بازی‌های تک‌نفره، رقابتی و گروهی')
      .addFields(
        { name: '👤 آمار بازی‌های شما', value: `بازی‌های انجام شده: ${user.totalGamesPlayed}\nبازی‌های برنده شده: ${user.totalGamesWon}`, inline: false },
        { name: '💵 موجودی', value: `${user.wallet} Ccoin`, inline: true },
        { name: '💎 کریستال', value: `${user.crystals}`, inline: true }
      )
      .setFooter({ text: `${interaction.user.username} | Win Ratio: ${user.totalGamesPlayed > 0 ? Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100) : 0}%` })
      .setTimestamp();
    
    // Create button rows
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('solo_games')
          .setLabel('🎲 بازی‌های تک‌نفره')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('competitive_games')
          .setLabel('🏆 بازی‌های رقابتی')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('group_games')
          .setLabel('👥 بازی‌های گروهی')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true) // Not implemented yet
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Create solo games menu
    const soloGamesMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('menu:game')
          .setPlaceholder('انتخاب بازی')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('شیر یا خط')
              .setValue('coinflip')
              .setDescription('20 Ccoin ورودی، 40 Ccoin جایزه در صورت برد')
              .setEmoji('🪙'),
            new StringSelectMenuOptionBuilder()
              .setLabel('سنگ کاغذ قیچی')
              .setValue('rps')
              .setDescription('20 Ccoin ورودی، 40 Ccoin جایزه در صورت برد')
              .setEmoji('✂️'),
            new StringSelectMenuOptionBuilder()
              .setLabel('حدس عدد')
              .setValue('numberguess')
              .setDescription('30 Ccoin ورودی، 100 Ccoin جایزه در صورت برد')
              .setEmoji('🔢')
          )
      );
    
    // Track what state we're in
    let state = 'main';
    
    // Check if this is a specific button interaction
    if (interaction.isButton()) {
      if (interaction.customId === 'solo_games') {
        state = 'solo';
      } else if (interaction.customId === 'competitive_games') {
        state = 'competitive';
      } else if (interaction.customId === 'group_games') {
        state = 'group';
      }
    }
    
    // Send the appropriate menu based on the state
    if (state === 'solo') {
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [soloGamesMenu, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [soloGamesMenu, row2] });
      }
    } else if (state === 'competitive') {
      // Competitive games not implemented yet
      await interaction.reply({
        content: 'Competitive games will be available in a future update!',
        ephemeral: true
      });
      
      // Return to main games menu
      setTimeout(async () => {
        if (followUp) {
          await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
        } else {
          await interaction.update({ embeds: [embed], components: [row1, row2] });
        }
      }, 2000);
    } else if (state === 'group') {
      // Group games not implemented yet
      await interaction.reply({
        content: 'Group games will be available in a future update!',
        ephemeral: true
      });
      
      // Return to main games menu
      setTimeout(async () => {
        if (followUp) {
          await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
        } else {
          await interaction.update({ embeds: [embed], components: [row1, row2] });
        }
      }, 2000);
    } else {
      // Main games menu
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [row1, row2] });
      }
    }
    
  } catch (error) {
    console.error('Error in games menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'Sorry, there was an error displaying the games menu!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Sorry, there was an error displaying the games menu!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling games menu failure:', e);
    }
  }
}
