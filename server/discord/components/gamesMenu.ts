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
    // راه‌اندازی پاسخ با تاخیر (defer) تا از خطای تایم‌اوت جلوگیری شود
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
    
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.'
        });
      } else {
        await interaction.reply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
          ephemeral: true
        });
      }
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
      .setFooter({ text: `${interaction.user.username} | نرخ برد: ${user.totalGamesPlayed > 0 ? Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100) : 0}%` })
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
    
    // Create solo games buttons (matching the UI in the screenshots)
    const soloGameRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:coinflip:start')
          .setLabel('🪙 شیر یا خط')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('game:rps:start')
          .setLabel('✂️ سنگ کاغذ قیچی')
          .setStyle(ButtonStyle.Success)
      );
      
    const soloGameRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:numberguess:start')
          .setLabel('🔢 حدس عدد')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('game:wheel:start')
          .setLabel('🎡 گردونه شانس')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true) // Not implemented yet
      );
      
    const soloGameRow3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Track what state we're in
    let state = 'main';
    
    // Check what custom ID we have to determine state
    const customId = interaction.customId;
    if (customId === 'solo_games') {
      state = 'solo';
    } else if (customId === 'competitive_games') {
      state = 'competitive';
    } else if (customId === 'group_games') {
      state = 'group';
    }
    
    // Send the appropriate menu based on the state
    if (state === 'solo') {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3] });
      } else if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: true });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: false });
          } else {
            await interaction.followUp({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: false });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: false });
        } else {
          await interaction.followUp({ embeds: [embed], components: [soloGameRow1, soloGameRow2, soloGameRow3], ephemeral: false });
        }
      }
    } else if (state === 'competitive') {
      // Competitive games not implemented yet
      const notImplementedMessage = '🔜 بازی‌های رقابتی در به‌روزرسانی‌های آینده اضافه خواهند شد!';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: notImplementedMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: notImplementedMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: notImplementedMessage, ephemeral: true });
      }
      
      // Return to main games menu
      setTimeout(async () => {
        try {
          if (interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [row1, row2] });
          } else if (followUp) {
            await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
          } else if ('update' in interaction && typeof interaction.update === 'function') {
            await interaction.update({ embeds: [embed], components: [row1, row2] });
          }
        } catch (e) {
          console.error("Error returning to main games menu:", e);
        }
      }, 2000);
    } else if (state === 'group') {
      // Group games not implemented yet
      const notImplementedMessage = '🔜 بازی‌های گروهی در به‌روزرسانی‌های آینده اضافه خواهند شد!';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: notImplementedMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: notImplementedMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: notImplementedMessage, ephemeral: true });
      }
      
      // Return to main games menu
      setTimeout(async () => {
        try {
          if (interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [row1, row2] });
          } else if (followUp) {
            await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
          } else if ('update' in interaction && typeof interaction.update === 'function') {
            await interaction.update({ embeds: [embed], components: [row1, row2] });
          }
        } catch (e) {
          console.error("Error returning to main games menu:", e);
        }
      }, 2000);
    } else {
      // Main games menu
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row1, row2] });
      } else if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: [row1, row2] });
        } catch (e) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: false });
          } else {
            await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: false });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: false });
        } else {
          await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: false });
        }
      }
    }
    
  } catch (error) {
    console.error('Error in games menu:', error);
    
    try {
      const errorMessage = '❌ متأسفانه در نمایش منوی بازی‌ها خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling games menu failure:', e);
    }
  }
}