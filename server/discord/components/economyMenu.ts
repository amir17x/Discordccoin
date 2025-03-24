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
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
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
      .setFooter({ text: `${interaction.user.username} | رکورد روزانه: ${user.dailyStreak} روز` })
      .setTimestamp();
    
    // Daily reward button
    const dailyButton = new ButtonBuilder()
      .setCustomId('daily')
      .setLabel('🎁 جایزه روزانه')
      .setStyle(dailyAvailable ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!dailyAvailable);
    
    // Create colorful button rows
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        dailyButton,
        new ButtonBuilder()
          .setCustomId('bank_menu')
          .setLabel('🏦 سیستم بانکی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('transfer_menu')
          .setLabel('💱 انتقال سکه')
          .setStyle(ButtonStyle.Success)
      );
    
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('robbery')
          .setLabel('🕵️‍♂️ سرقت')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('exchange')
          .setLabel('💎 تبدیل سکه')
          .setStyle(ButtonStyle.Primary),
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
    
    // Create bank menu
    const bankEmbed = new EmbedBuilder()
      .setColor('#4169E1')
      .setTitle('🏦 سیستم بانکی پیشرفته Ccoin')
      .setDescription('مدیریت حساب بانکی و سرمایه‌گذاری‌های خود را انجام دهید')
      .addFields(
        { name: '💳 موجودی کیف پول', value: `${user.wallet} Ccoin`, inline: true },
        { name: '🏦 موجودی بانک', value: `${user.bank} Ccoin`, inline: true },
        { name: '📈 سود بانکی', value: `2% ماهانه`, inline: true },
        { name: '💸 کارمزد واریز', value: '1%', inline: true },
        { name: '🔐 برداشت بدون کارمزد', value: 'تا 10,000 Ccoin', inline: true },
        { name: '📊 وضعیت حساب', value: user.bank > 10000 ? '🟢 طلایی' : user.bank > 5000 ? '🔵 نقره‌ای' : '⚪ عادی', inline: true },
        { name: '💡 نکته ویژه', value: 'برای محافظت از سرقت، پول خود را در بانک نگهداری کنید! ضمناً با افزایش موجودی بانکی، سطح حساب شما ارتقا می‌یابد و امتیازات ویژه دریافت می‌کنید.' }
      )
      .setFooter({ text: `${interaction.user.username} | تاریخ آخرین سود: ${user.lastBankInterest ? new Date(user.lastBankInterest).toLocaleDateString('fa-IR') : 'هیچ‌وقت'}` })
      .setTimestamp();
    
    // Bank menu buttons
    const bankRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('deposit_menu')
          .setLabel('💸 واریز به بانک')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet <= 0),
        new ButtonBuilder()
          .setCustomId('withdraw_menu')
          .setLabel('💰 برداشت از بانک')
          .setStyle(ButtonStyle.Success)
          .setDisabled(user.bank <= 0),
        new ButtonBuilder()
          .setCustomId('bank_history')
          .setLabel('📋 تاریخچه تراکنش‌ها')
          .setStyle(ButtonStyle.Secondary)
      );
      
    const bankRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('investment_menu')
          .setLabel('📈 سرمایه‌گذاری')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('bank_upgrade')
          .setLabel('⬆️ ارتقای حساب')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.bank < 10000),
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );

    // Create transfer menu
    const transferEmbed = new EmbedBuilder()
      .setColor('#32CD32')
      .setTitle('💱 انتقال سکه به کاربران دیگر')
      .setDescription('می‌توانید به کاربران دیگر Ccoin انتقال دهید')
      .addFields(
        { name: '💳 موجودی کیف پول', value: `${user.wallet} Ccoin`, inline: true },
        { name: '💸 کارمزد انتقال', value: '1%', inline: true },
        { name: '⚠️ محدودیت روزانه', value: '5000 Ccoin', inline: true },
        { name: '📝 راهنمای انتقال', value: 'برای انتقال سکه، ابتدا کاربر مورد نظر را انتخاب کرده و سپس مقدار سکه را وارد کنید.' },
        { name: '🔐 نکته امنیتی', value: 'برای مبالغ بیش از 1000 سکه، کپچای امنیتی نمایش داده خواهد شد.' }
      )
      .setFooter({ text: `${interaction.user.username} | برای انتقال، از موجودی کیف پول شما کسر می‌شود` })
      .setTimestamp();
      
    // Transfer menu buttons
    const transferRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('transfer_user')
          .setLabel('👤 انتخاب کاربر')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet <= 0),
        new ButtonBuilder()
          .setCustomId('transfer_history')
          .setLabel('📋 تاریخچه انتقال‌ها')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
      
    // Exchange menu
    const exchangeEmbed = new EmbedBuilder()
      .setColor('#9932CC')
      .setTitle('💎 تبدیل سکه به کریستال')
      .setDescription('کریستال ارز ویژه Ccoin است که با آن می‌توانید آیتم‌های منحصر به فرد خریداری کنید')
      .addFields(
        { name: '💳 موجودی کیف پول', value: `${user.wallet} Ccoin`, inline: true },
        { name: '💎 موجودی کریستال', value: `${user.crystals}`, inline: true },
        { name: '📊 نرخ تبدیل', value: '1000 Ccoin = 10 کریستال', inline: true },
        { name: '💸 کارمزد تبدیل', value: '5%', inline: true },
        { name: '⚠️ نکته مهم', value: 'تبدیل سکه به کریستال غیرقابل بازگشت است!\nبا کریستال می‌توانید آیتم‌های ویژه از فروشگاه خریداری کنید.' }
      )
      .setFooter({ text: `${interaction.user.username} | کریستال‌ها قابل انتقال به کاربران دیگر نیستند` })
      .setTimestamp();
      
    // Exchange menu buttons
    const exchangeRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('exchange_10')
          .setLabel('💎 تبدیل به 10 کریستال')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet < 1050), // 1000 + 5% fee
        new ButtonBuilder()
          .setCustomId('exchange_50')
          .setLabel('💎 تبدیل به 50 کریستال')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(user.wallet < 5250), // 5000 + 5% fee
        new ButtonBuilder()
          .setCustomId('economy')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Check if this is a specific button interaction
    if (interaction.isButton()) {
      if (interaction.customId === 'deposit_menu') {
        state = 'deposit';
      } else if (interaction.customId === 'withdraw_menu') {
        state = 'withdraw';
      } else if (interaction.customId === 'bank_menu') {
        state = 'bank';
      } else if (interaction.customId === 'transfer_menu') {
        state = 'transfer';
      } else if (interaction.customId === 'exchange') {
        state = 'exchange';
      }
    }
    
    // Send the appropriate menu based on the state
    if (state === 'deposit') {
      if (followUp) {
        await interaction.followUp({ embeds: [bankEmbed], components: [depositOptions, bankRow2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [bankEmbed], components: [depositOptions, bankRow2] });
      }
    } else if (state === 'withdraw') {
      if (followUp) {
        await interaction.followUp({ embeds: [bankEmbed], components: [withdrawOptions, bankRow2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [bankEmbed], components: [withdrawOptions, bankRow2] });
      }
    } else if (state === 'bank') {
      if (followUp) {
        await interaction.followUp({ embeds: [bankEmbed], components: [bankRow1, bankRow2], ephemeral: true });
      } else {
        await interaction.update({ embeds: [bankEmbed], components: [bankRow1, bankRow2] });
      }
    } else if (state === 'transfer') {
      if (followUp) {
        await interaction.followUp({ embeds: [transferEmbed], components: [transferRow], ephemeral: true });
      } else {
        await interaction.update({ embeds: [transferEmbed], components: [transferRow] });
      }
    } else if (state === 'exchange') {
      if (followUp) {
        await interaction.followUp({ embeds: [exchangeEmbed], components: [exchangeRow], ephemeral: true });
      } else {
        await interaction.update({ embeds: [exchangeEmbed], components: [exchangeRow] });
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
          content: '❌ متأسفانه در نمایش منوی اقتصاد خطایی رخ داد!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ متأسفانه در نمایش منوی اقتصاد خطایی رخ داد!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling economy menu failure:', e);
    }
  }
}
