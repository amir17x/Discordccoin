import { 
  ButtonInteraction, 
  CommandInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  Message,
  ChatInputCommandInteraction,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the main menu
export async function mainMenu(
  interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction
) {
  try {
    // Check if user exists, create if not
    let user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      user = await storage.createUser({
        discordId: interaction.user.id,
        username: interaction.user.username,
      });
    }
    
    // Create the main embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎮 Gaming Bot Menu')
      .setDescription('🎉 به ربات ما خوش اومدی! یه بخش رو انتخاب کن و لذت ببر! 😍')
      .setFooter({ text: `${interaction.user.username} | Wallet: ${user.wallet} Ccoin | Bank: ${user.bank} Ccoin | 💎: ${user.crystals}` })
      .setTimestamp();
    
    // Create button rows with more options and appropriate colors
    // Row 1: Economy, Games, Shop
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('💰 اقتصاد')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('games')
          .setLabel('🎮 بازی‌ها')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('shop')
          .setLabel('🛒 فروشگاه')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // Row 2: Marketplace, Inventory, Quests
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('marketplace')
          .setLabel('🏪 بازار')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('inventory')
          .setLabel('🎒 کوله‌پشتی')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('quests')
          .setLabel('🎯 ماموریت‌ها')
          .setStyle(ButtonStyle.Danger),
      );
    
    // Row 3: Clans, Tournaments, Achievements
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('clans')
          .setLabel('🏰 کلن‌ها')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('tournaments')
          .setLabel('🏁 تورنمنت‌ها')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('achievements')
          .setLabel('🎖️ دستاوردها')
          .setStyle(ButtonStyle.Success),
      );
      
    // Row 4: Profile, Wheel, Seasons
    const row4 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('profile')
          .setLabel('👤 پروفایل')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('wheel')
          .setLabel('🎡 چرخ شانس')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('seasons')
          .setLabel('🏆 فصل‌ها')
          .setStyle(ButtonStyle.Success),
      );
    
    // Row 5: Parallel Worlds, Calendar, Help, Exit
    const row5 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('parallel_worlds')
          .setLabel('🌀 جهان‌های موازی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('calendar')
          .setLabel('📅 تقویم')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help')
          .setLabel('📜 راهنما')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('exit')
          .setLabel('🔙 خروج')
          .setStyle(ButtonStyle.Danger),
      );
    
    // Send or update the message
    if (interaction instanceof ChatInputCommandInteraction) {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: false });
    } else {
      try {
        await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
      } catch (e) {
        // If update fails (might be due to deferred interaction), send a new message
        await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: false });
      }
    }
    
  } catch (error) {
    console.error('Error in main menu:', error);
    
    try {
      if (interaction instanceof ChatInputCommandInteraction) {
        await interaction.reply({
          content: 'Sorry, there was an error displaying the menu!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Sorry, there was an error updating the menu!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling main menu failure:', e);
    }
  }
}
