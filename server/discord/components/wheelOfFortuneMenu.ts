import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Wheel constants
const SPIN_COST = 50; // Cost to spin the wheel
const WHEEL_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours cooldown

// Function to create and send the wheel of fortune menu
export async function wheelOfFortuneMenu(
  interaction: ButtonInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'برای استفاده از چرخ شانس ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    // Check user's wallet
    if (user.wallet < SPIN_COST) {
      await interaction.reply({
        content: `برای چرخاندن چرخ شانس به ${SPIN_COST} سکه Ccoin نیاز دارید، اما شما فقط ${user.wallet} سکه در کیف پول خود دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // Check cooldown
    const now = new Date();
    // @ts-ignore - lastWheelSpin is now added to the schema
    const lastSpin = user.lastWheelSpin ? new Date(user.lastWheelSpin) : null;
    const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime() >= WHEEL_COOLDOWN);
    
    // Calculate cooldown time if applicable
    let cooldownText = '';
    if (!canSpin && lastSpin) {
      const nextSpin = new Date(lastSpin.getTime() + WHEEL_COOLDOWN);
      const hours = Math.floor((nextSpin.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextSpin.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      cooldownText = `⏳ زمان باقیمانده تا چرخش بعدی: ${hours}h ${minutes}m`;
    }
    
    // Get inventory to check for wheel spin tickets
    const inventory = await storage.getInventoryItems(user.id);
    const ticketCount = countInventoryTickets(inventory);
    
    // Create the wheel embed
    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎡 چرخ شانس')
      .setDescription('چرخ شانس را بچرخانید و جوایز هیجان‌انگیز ببرید!\nشما می‌توانید سکه، کریستال، آیتم‌های مختلف و حتی جوایز ویژه برنده شوید.')
      .setThumbnail('https://img.icons8.com/fluency/48/wheel-of-fortune.png') // آیکون wheel-of-fortune برای چرخ شانس
      .addFields(
        { name: '💰 هزینه چرخاندن', value: `${SPIN_COST} Ccoin`, inline: true },
        { name: '👛 موجودی شما', value: `${user.wallet} Ccoin`, inline: true },
        { name: '🎫 بلیط‌های رایگان', value: `${ticketCount} عدد`, inline: true },
        { name: '🏆 جوایز ممکن', value: 'سکه (5-500 Ccoin), کریستال (1-10), آیتم‌های ویژه', inline: false }
      )
      .setFooter({ text: `${interaction.user.username} | ${canSpin ? 'می‌توانید چرخ را بچرخانید!' : cooldownText}` })
      .setTimestamp();
    
    // Create spin button
    const spinButton = new ButtonBuilder()
      .setCustomId('wheel_spin')
      .setLabel('🎡 چرخاندن چرخ شانس')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!canSpin && ticketCount === 0);
    
    // Back button
    const backButton = new ButtonBuilder()
      .setCustomId('menu')
      .setLabel('🔙 بازگشت')
      .setStyle(ButtonStyle.Secondary);
    
    // Create button row
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(spinButton, backButton);
    
    // Send the wheel menu
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
    } else {
      await interaction.update({ embeds: [embed], components: [row] });
    }
    
  } catch (error) {
    console.error('Error in wheel of fortune menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'متأسفانه در نمایش منوی چرخ شانس خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'متأسفانه در نمایش منوی چرخ شانس خطایی رخ داد!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling wheel menu failure:', e);
    }
  }
}

// Function to spin the wheel and give rewards
export async function spinWheel(
  interaction: MessageComponentInteraction
) {
  try {
    // Check if user exists
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'برای استفاده از چرخ شانس ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    // Get inventory to check for wheel spin tickets
    const inventory = await storage.getInventoryItems(user.id);
    const ticketCount = countInventoryTickets(inventory);
    
    // Check if they can spin (either have ticket or meet cooldown + have enough money)
    const now = new Date();
    // @ts-ignore - lastWheelSpin is now added to the schema
    const lastSpin = user.lastWheelSpin ? new Date(user.lastWheelSpin) : null;
    const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime() >= WHEEL_COOLDOWN);
    
    let usingTicket = false;
    
    if (!canSpin && ticketCount > 0) {
      // Use a ticket instead
      usingTicket = true;
    } else if (!canSpin) {
      // Can't spin and has no tickets
      const nextSpin = new Date(lastSpin!.getTime() + WHEEL_COOLDOWN);
      const hours = Math.floor((nextSpin.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextSpin.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      await interaction.reply({
        content: `باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره چرخ شانس را بچرخانید یا از بلیط استفاده کنید.`,
        ephemeral: true
      });
      return;
    } else if (user.wallet < SPIN_COST && !usingTicket) {
      // Not enough money and not using ticket
      await interaction.reply({
        content: `برای چرخاندن چرخ شانس به ${SPIN_COST} سکه Ccoin نیاز دارید، اما شما فقط ${user.wallet} سکه در کیف پول خود دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // Charge the user or use a ticket
    if (usingTicket) {
      // Find wheel ticket item and remove one from inventory
      const wheelTicketItem = inventory.find(item => item.item.type === 'ticket' && item.item.name.includes('Wheel'));
      if (wheelTicketItem) {
        // Remove one ticket
        const ticketId = wheelTicketItem.item.id;
        const ticketInventoryItem = wheelTicketItem.inventoryItem;
        
        // Update inventory with one less ticket
        if (ticketInventoryItem.quantity > 1) {
          // Reduce quantity by 1
          ticketInventoryItem.quantity -= 1;
          // Save updated inventory
          // We need to create a proper inventory object that matches the structure expected by storage
          const updatedInventory = { ...user.inventory as Record<string, any> };
          updatedInventory[ticketId] = ticketInventoryItem;
          await storage.updateUser(user.id, { inventory: updatedInventory });
        } else {
          // Remove the ticket item completely if it was the last one
          const newInventory = { ...user.inventory as Record<string, any> };
          delete newInventory[ticketId];
          await storage.updateUser(user.id, { inventory: newInventory });
        }
      }
    } else {
      // Deduct spin cost
      await storage.addToWallet(user.id, -SPIN_COST);
      
      // Update last spin time
      // @ts-ignore - lastWheelSpin is now added to the schema
      await storage.updateUser(user.id, { lastWheelSpin: now });
    }
    
    // Determine the reward
    const reward = getRandomReward();
    
    // Create result embed
    const resultEmbed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎡 چرخ شانس')
      .setDescription(`🎊 *چرخ شانس در حال چرخش است...* 🎊\n\n**تبریک!**\nشما برنده **${reward.description}** شدید!`)
      .setThumbnail('https://img.icons8.com/fluency/48/wheel-of-fortune.png') // آیکون wheel-of-fortune برای چرخ شانس
      .setTimestamp();
    
    // Apply the reward
    if (reward.type === 'ccoin') {
      await storage.addToWallet(user.id, reward.amount);
      resultEmbed.addFields({ name: '💰 سکه جدید', value: `${user.wallet + reward.amount} Ccoin`, inline: true });
    } else if (reward.type === 'crystal') {
      await storage.addCrystals(user.id, reward.amount);
      resultEmbed.addFields({ name: '💎 کریستال جدید', value: `${user.crystals + reward.amount}`, inline: true });
    } else if (reward.type === 'item' && reward.itemId) {
      await storage.addItemToInventory(user.id, reward.itemId);
      const item = await storage.getItem(reward.itemId);
      if (item) {
        resultEmbed.addFields({ name: '🎁 آیتم دریافتی', value: `${item.emoji} ${item.name}`, inline: true });
      }
    }
    
    // Create button to spin again or go back
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('wheel')
          .setLabel('🔄 چرخاندن مجدد')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت به منو')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Send the result
    await interaction.update({ embeds: [resultEmbed], components: [row] });
    
  } catch (error) {
    console.error('Error in spin wheel handler:', error);
    await interaction.reply({
      content: 'متأسفانه در چرخاندن چرخ شانس خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Function to get a random reward
function getRandomReward() {
  const random = Math.random();
  
  if (random < 0.40) {
    // 40% chance to get coins (10-100)
    const amount = Math.floor(Math.random() * 91) + 10;
    return {
      type: 'ccoin',
      amount,
      description: `${amount} سکه Ccoin`
    };
  } else if (random < 0.70) {
    // 30% chance to get coins (100-300)
    const amount = Math.floor(Math.random() * 201) + 100;
    return {
      type: 'ccoin',
      amount,
      description: `${amount} سکه Ccoin`
    };
  } else if (random < 0.85) {
    // 15% chance to get 1-3 crystals
    const amount = Math.floor(Math.random() * 3) + 1;
    return {
      type: 'crystal',
      amount,
      description: `${amount} کریستال 💎`
    };
  } else if (random < 0.95) {
    // 10% chance to get 300-500 coins
    const amount = Math.floor(Math.random() * 201) + 300;
    return {
      type: 'ccoin',
      amount,
      description: `${amount} سکه Ccoin`
    };
  } else if (random < 0.98) {
    // 3% chance to get 3-5 crystals
    const amount = Math.floor(Math.random() * 3) + 3;
    return {
      type: 'crystal',
      amount,
      description: `${amount} کریستال 💎`
    };
  } else {
    // 2% chance to get a special item (jackpot)
    // Here you would return a specific item ID from your database
    return {
      type: 'item',
      itemId: 1, // Replace with actual special item ID
      amount: 1,
      description: `آیتم ویژه!`
    };
  }
}

// Helper function to count wheel spin tickets in inventory
function countInventoryTickets(inventory: Array<{item: any, inventoryItem: any}>): number {
  for (const item of inventory) {
    if (item.item.type === 'ticket' && item.item.name.includes('Wheel')) {
      return item.inventoryItem.quantity;
    }
  }
  return 0;
}