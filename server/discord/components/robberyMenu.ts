import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { storage } from '../../storage';

// Constants
const ROB_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
const BASE_SUCCESS_RATE = 0.4; // 40% base success rate

// Function to create and send the robbery menu
export async function robberyMenu(
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
    
    // Check cooldown
    const now = new Date();
    const lastRob = user.lastRob ? new Date(user.lastRob) : null;
    const canRob = !lastRob || (now.getTime() - lastRob.getTime() >= ROB_COOLDOWN);
    
    // Calculate cooldown time if applicable
    let cooldownText = '';
    if (!canRob && lastRob) {
      const nextRob = new Date(lastRob.getTime() + ROB_COOLDOWN);
      const hours = Math.floor((nextRob.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextRob.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      cooldownText = `⏳ زمان باقیمانده تا سرقت بعدی: ${hours}h ${minutes}m`;
    }
    
    // Get all users for target selection
    const allUsers = await storage.getAllUsers();
    
    // Filter out the current user and empty wallets
    const possibleTargets = allUsers.filter(u => 
      u.id !== user.id && 
      u.wallet > 0
    ).sort((a, b) => b.wallet - a.wallet).slice(0, 10); // Top 10 richest users
    
    // Create the robbery embed
    const embed = new EmbedBuilder()
      .setColor('#FF5733')
      .setTitle('🕵️‍♂️ سرقت')
      .setDescription('از کاربران دیگر سرقت کنید و سکه به دست آورید!\nاما مراقب باشید، اگر دستگیر شوید، جریمه خواهید شد!')
      .addFields(
        { name: '✨ نرخ موفقیت پایه', value: `${BASE_SUCCESS_RATE * 100}%`, inline: true },
        { name: '🔒 قفل زمانی', value: `${canRob ? 'آماده برای سرقت!' : cooldownText}`, inline: true },
        { name: '👛 موجودی شما', value: `${user.wallet} Ccoin`, inline: true }
      )
      .setFooter({ text: 'توجه: اگر دستگیر شوید، جریمه شما برابر مقدار سرقت خواهد بود!' })
      .setTimestamp();
    
    // Create target selection menu
    const targetMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('target_select')
          .setPlaceholder('هدف سرقت خود را انتخاب کنید')
          .addOptions(
            possibleTargets.map(target => 
              new StringSelectMenuOptionBuilder()
                .setLabel(`${target.username}`)
                .setValue(`${target.id}`)
                .setDescription(`کیف پول: ${target.wallet} Ccoin`)
                .setEmoji('👤')
            )
          )
          .setDisabled(!canRob || possibleTargets.length === 0)
      );
    
    // Create back button
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Components to show based on availability
    const components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[] = possibleTargets.length > 0 ? 
      [targetMenu, row] : 
      [row];
    
    // Send the robbery menu
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components, ephemeral: true });
    } else {
      await interaction.update({ embeds: [embed], components });
    }
    
  } catch (error) {
    console.error('Error in robbery menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'متأسفانه در نمایش منوی سرقت خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'متأسفانه در نمایش منوی سرقت خطایی رخ داد!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling robbery menu failure:', e);
    }
  }
}

// Function to handle the robbery attempt
export async function handleRobbery(
  interaction: MessageComponentInteraction,
  targetId: number
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
    
    // Check cooldown
    const now = new Date();
    const lastRob = user.lastRob ? new Date(user.lastRob) : null;
    const canRob = !lastRob || (now.getTime() - lastRob.getTime() >= ROB_COOLDOWN);
    
    if (!canRob) {
      const nextRob = new Date(lastRob!.getTime() + ROB_COOLDOWN);
      const hours = Math.floor((nextRob.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextRob.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      await interaction.reply({
        content: `باید ${hours}h ${minutes}m صبر کنید تا بتوانید دوباره سرقت کنید.`,
        ephemeral: true
      });
      return;
    }
    
    // Get target user
    const targetUser = await storage.getUser(targetId);
    
    if (!targetUser) {
      await interaction.reply({
        content: 'کاربر هدف پیدا نشد.',
        ephemeral: true
      });
      return;
    }
    
    // Check if target has money
    if (targetUser.wallet <= 0) {
      await interaction.reply({
        content: `${targetUser.username} هیچ سکه‌ای در کیف پول خود ندارد!`,
        ephemeral: true
      });
      return;
    }
    
    // Calculate success rate based on user's items and other factors
    let successRate = BASE_SUCCESS_RATE;
    
    // Check inventory for items that affect robbery chance
    const inventory = await storage.getInventoryItems(user.id);
    for (const item of inventory) {
      // @ts-ignore - This is a valid property in ItemEffects
      if (item.item.effects?.robberyChance) {
        // @ts-ignore - This is a valid property in ItemEffects
        successRate += item.item.effects.robberyChance;
      }
    }
    
    // Make the robbery attempt
    const robAmount = Math.min(Math.floor(targetUser.wallet * 0.2), 200); // Max 20% or 200 Ccoin
    const isSuccessful = Math.random() < successRate;
    
    // Update last rob time
    await storage.updateUser(user.id, { lastRob: now });
    
    if (isSuccessful) {
      // Robbery successful
      await storage.addToWallet(user.id, robAmount);
      await storage.addToWallet(targetUser.id, -robAmount);
      
      const successEmbed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('🕵️‍♂️ سرقت موفق!')
        .setDescription(`شما با موفقیت از ${targetUser.username} سرقت کردید!`)
        .addFields(
          { name: '💰 مقدار سرقت شده', value: `${robAmount} Ccoin`, inline: true },
          { name: '👛 موجودی جدید شما', value: `${user.wallet + robAmount} Ccoin`, inline: true }
        )
        .setFooter({ text: `${interaction.user.username} | ${new Date().toLocaleString()}` })
        .setTimestamp();
      
      await interaction.update({ embeds: [successEmbed], components: [] });
      
    } else {
      // Robbery failed - user gets fined
      await storage.addToWallet(user.id, -robAmount);
      
      const failedEmbed = new EmbedBuilder()
        .setColor('#F44336')
        .setTitle('🚨 سرقت ناموفق!')
        .setDescription(`شما هنگام سرقت از ${targetUser.username} دستگیر شدید!`)
        .addFields(
          { name: '💰 جریمه', value: `${robAmount} Ccoin`, inline: true },
          { name: '👛 موجودی جدید شما', value: `${user.wallet - robAmount} Ccoin`, inline: true }
        )
        .setFooter({ text: `${interaction.user.username} | ${new Date().toLocaleString()}` })
        .setTimestamp();
      
      await interaction.update({ embeds: [failedEmbed], components: [] });
    }
    
    // After a delay, return to the robbery menu
    setTimeout(async () => {
      try {
        await robberyMenu(interaction, true);
      } catch (e) {
        console.error('Error returning to robbery menu:', e);
      }
    }, 3000);
    
  } catch (error) {
    console.error('Error in robbery handler:', error);
    await interaction.reply({
      content: 'متأسفانه در انجام سرقت خطایی رخ داد!',
      ephemeral: true
    });
  }
}