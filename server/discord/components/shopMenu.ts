import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the shop menu
export async function shopMenu(
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
    
    // Get all items
    const items = await storage.getAllItems();
    
    // Create the shop embed
    const embed = new EmbedBuilder()
      .setColor('#F1C40F')
      .setTitle('🛒 فروشگاه')
      .setDescription('خرید آیتم‌ها با سکه (Ccoin) و کریستال')
      .addFields(
        { name: '💰 موجودی شما', value: `${user.wallet} Ccoin`, inline: true },
        { name: '💎 کریستال شما', value: `${user.crystals}`, inline: true }
      )
      .setFooter({ text: `${interaction.user.username} | برای خرید روی دکمه کلیک کنید` })
      .setTimestamp();
    
    // Create item rows - max 3 items per page
    const itemsPerPage = 3;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    // Get page from customId if it exists
    let currentPage = 1;
    if (interaction.isButton()) {
      const match = interaction.customId.match(/shop_page_(\d+)/);
      if (match) {
        currentPage = parseInt(match[1]);
      }
    }
    
    // Get items for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    const pageItems = items.slice(startIndex, endIndex);
    
    // Add item fields to embed
    pageItems.forEach(item => {
      const price = item.crystalPrice 
        ? `${item.crystalPrice} 💎` 
        : `${item.price} Ccoin`;
      
      embed.addFields({
        name: `${item.emoji} ${item.name}`,
        value: `${item.description}\n**قیمت:** ${price}\n**نوع:** ${item.type === 'role' ? 'نقش' : 'مصرفی'}${item.duration ? ` (${item.duration} ساعت)` : ''}`,
        inline: false
      });
    });
    
    // Add page number
    embed.setDescription(`${embed.data.description}\n\nصفحه ${currentPage}/${totalPages}`);
    
    // Create buttons for each item
    const itemButtons: ActionRowBuilder<ButtonBuilder>[] = [];
    pageItems.forEach(item => {
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`buy:${item.id}`)
            .setLabel(`خرید ${item.name}`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(
              (item.price && user.wallet < item.price) || 
              (item.crystalPrice && user.crystals < item.crystalPrice)
            )
        );
      
      itemButtons.push(row);
    });
    
    // Create colorful navigation buttons
    const navRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`shop_page_${Math.max(1, currentPage - 1)}`)
          .setLabel('◀️ قبلی')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage <= 1),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`shop_page_${Math.min(totalPages, currentPage + 1)}`)
          .setLabel('بعدی ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage >= totalPages)
      );
    
    // Combine all rows
    const rows = [...itemButtons, navRow];
    
    // Send the shop menu
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components: rows, ephemeral: true });
    } else {
      await interaction.update({ embeds: [embed], components: rows });
    }
    
  } catch (error) {
    console.error('Error in shop menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'Sorry, there was an error displaying the shop menu!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Sorry, there was an error displaying the shop menu!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling shop menu failure:', e);
    }
  }
}
