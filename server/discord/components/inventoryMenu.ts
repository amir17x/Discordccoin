import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the inventory menu
export async function inventoryMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's inventory
    const inventoryItems = await storage.getInventoryItems(user.id);
    
    // Create the inventory embed with backpack image
    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎒 کوله‌پشتی')
      .setDescription('مدیریت آیتم‌های شما')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/8769/8769823.png') // آیکون fi-sr-backpack برای بخش کوله‌پشتی
      .setFooter({ text: `${interaction.user.username} | برای استفاده از آیتم روی دکمه کلیک کنید` })
      .setTimestamp();
    
    // Check if inventory is empty
    if (inventoryItems.length === 0) {
      embed.setDescription('کوله‌پشتی شما خالی است! از فروشگاه آیتم خریداری کنید.');
    } else {
      // Create item rows - max 5 items per page
      const itemsPerPage = 5;
      const totalPages = Math.ceil(inventoryItems.length / itemsPerPage);
      
      // Get page from customId if it exists
      let currentPage = 1;
      if (interaction.isButton()) {
        const match = interaction.customId.match(/inventory_page_(\d+)/);
        if (match) {
          currentPage = parseInt(match[1]);
        }
      }
      
      // Get items for current page
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, inventoryItems.length);
      const pageItems = inventoryItems.slice(startIndex, endIndex);
      
      // Add page number
      embed.setDescription(`${embed.data.description}\n\nصفحه ${currentPage}/${totalPages}`);
      
      // Add item fields to embed
      pageItems.forEach(({ item, inventoryItem }) => {
        const now = new Date();
        const expires = inventoryItem.expires ? new Date(inventoryItem.expires) : null;
        let status = '';
        
        if (inventoryItem.active && expires) {
          if (expires > now) {
            // Calculate remaining time
            const diffHours = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
            status = `🟢 فعال (${diffHours} ساعت باقیمانده)`;
          } else {
            status = '🔴 منقضی شده';
          }
        } else if (item.type === 'role' || item.type === 'consumable' && item.duration) {
          status = '⚪ غیرفعال';
        } else {
          status = '';
        }
        
        embed.addFields({
          name: `${item.emoji} ${item.name} (x${inventoryItem.quantity})`,
          value: `${item.description}${status ? `\n**وضعیت:** ${status}` : ''}`,
          inline: false
        });
      });
    }
    
    // Create buttons for each item
    const itemButtons: ActionRowBuilder<ButtonBuilder>[] = [];
    if (inventoryItems.length > 0) {
      // Get page from customId if it exists
      let currentPage = 1;
      if (interaction.isButton()) {
        const match = interaction.customId.match(/inventory_page_(\d+)/);
        if (match) {
          currentPage = parseInt(match[1]);
        }
      }
      
      const itemsPerPage = 5;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, inventoryItems.length);
      const pageItems = inventoryItems.slice(startIndex, endIndex);
      
      pageItems.forEach(({ item, inventoryItem }) => {
        // Check if item is already active
        const now = new Date();
        const expires = inventoryItem.expires ? new Date(inventoryItem.expires) : null;
        const isActive = inventoryItem.active && expires && expires > now;
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`use:${item.id}`)
              .setLabel(`استفاده از ${item.name}`)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(isActive) // Disable if already active
          );
        
        itemButtons.push(row);
      });
      
      // Create navigation buttons
      const totalPages = Math.ceil(inventoryItems.length / itemsPerPage);
      
      const navRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`inventory_page_${Math.max(1, currentPage - 1)}`)
            .setLabel('◀️ قبلی')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage <= 1),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`inventory_page_${Math.min(totalPages, currentPage + 1)}`)
            .setLabel('بعدی ▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage >= totalPages)
        );
      
      itemButtons.push(navRow);
    } else {
      // Just show back button
      const navRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      itemButtons.push(navRow);
    }
    
    // Send the inventory menu
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components: itemButtons, ephemeral: true });
    } else {
      await interaction.update({ embeds: [embed], components: itemButtons });
    }
    
  } catch (error) {
    console.error('Error in inventory menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'متأسفانه در نمایش منوی کوله‌پشتی خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'متأسفانه در نمایش منوی کوله‌پشتی خطایی رخ داد!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling inventory menu failure:', e);
    }
  }
}
