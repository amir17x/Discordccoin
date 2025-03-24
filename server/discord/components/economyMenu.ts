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

// Function to create and send the economy menu
export async function economyMenu(
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
    
    // Check if daily reward is available
    const now = new Date();
    const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
    const dailyAvailable = !lastDaily || (now.getTime() - lastDaily.getTime() >= 24 * 60 * 60 * 1000);
    
    // Create the economy embed
    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('💰 بخش اقتصاد')
      .setDescription('مدیریت سکه‌ها و اقتصاد شخصی')
      .addFields(
        { name: '💳 کیف پول', value: `${user.wallet} Ccoin`, inline: true },
        { name: '🏦 بانک', value: `${user.bank} Ccoin`, inline: true },
        { name: '💎 کریستال', value: `${user.crystals}`, inline: true },
        { name: '📊 لِوِل اقتصادی', value: `${user.economyLevel}`, inline: true },
        { name: '📈 سود بانکی', value: `2% ماهانه`, inline: true },
        { name: '💸 کارمزد انتقال', value: '1%', inline: true }
      )
      .setFooter({ text: `${interaction.user.username} | Daily Streak: ${user.dailyStreak} day(s)` })
      .setTimestamp();
    
    // Daily reward button
    const dailyButton = new ButtonBuilder()
      .setCustomId('daily')
      .setLabel('🎁 جایزه روزانه')
      .setStyle(dailyAvailable ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!dailyAvailable);
    
    // Create button rows
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        dailyButton,
        new ButtonBuilder()
          .setCustomId('deposit_menu')
          .setLabel('💸 واریز به بانک')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('withdraw_menu')
          .setLabel('💰 برداشت از بانک')
          .setStyle(ButtonStyle.Primary)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Create deposit options menu
    const depositOptions = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('menu:deposit')
          .setPlaceholder('مقدار واریز به بانک را انتخاب کنید')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('100 Ccoin')
              .setValue('100')
              .setDescription('واریز 100 Ccoin به بانک (کارمزد: 1 Ccoin)')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('500 Ccoin')
              .setValue('500')
              .setDescription('واریز 500 Ccoin به بانک (کارمزد: 5 Ccoin)')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('1000 Ccoin')
              .setValue('1000')
              .setDescription('واریز 1000 Ccoin به بانک (کارمزد: 10 Ccoin)')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('تمام موجودی')
              .setValue(`${user.wallet}`)
              .setDescription(`واریز ${user.wallet} Ccoin به بانک (کارمزد: ${Math.ceil(user.wallet * 0.01)} Ccoin)`)
              .setEmoji('💰')
          )
          .setDisabled(user.wallet <= 0)
      );
    
    // Create withdraw options menu
    const withdrawOptions = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('menu:withdraw')
          .setPlaceholder('مقدار برداشت از بانک را انتخاب کنید')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel('100 Ccoin')
              .setValue('100')
              .setDescription('برداشت 100 Ccoin از بانک')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('500 Ccoin')
              .setValue('500')
              .setDescription('برداشت 500 Ccoin از بانک')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('1000 Ccoin')
              .setValue('1000')
              .setDescription('برداشت 1000 Ccoin از بانک')
              .setEmoji('💰'),
            new StringSelectMenuOptionBuilder()
              .setLabel('تمام موجودی')
              .setValue(`${user.bank}`)
              .setDescription(`برداشت ${user.bank} Ccoin از بانک`)
              .setEmoji('💰')
          )
          .setDisabled(user.bank <= 0)
      );
    
    // Track what state we're in
    let state = 'main';
    
    // Check if this is a specific button interaction
    if (interaction.isButton()) {
      if (interaction.customId === 'deposit_menu') {
        state = 'deposit';
      } else if (interaction.customId === 'withdraw_menu') {
        state = 'withdraw';
      }
    }
    
    // Send the appropriate menu based on the state
    if (state === 'deposit') {
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [depositOptions, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [depositOptions, row2] });
      }
    } else if (state === 'withdraw') {
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [withdrawOptions, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [withdrawOptions, row2] });
      }
    } else {
      // Main economy menu
      if (followUp) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [embed], components: [row1, row2] });
      }
    }
    
  } catch (error) {
    console.error('Error in economy menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'Sorry, there was an error displaying the economy menu!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Sorry, there was an error displaying the economy menu!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling economy menu failure:', e);
    }
  }
}
