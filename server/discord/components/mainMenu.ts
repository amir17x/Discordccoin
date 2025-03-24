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
  interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction,
  showOther: boolean = false
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
      .setTitle('🎮 ربات گیمینگ Ccoin')
      .setDescription('🎉 به ربات ما خوش اومدی! یه بخش رو انتخاب کن و لذت ببر! 😍')
      .setFooter({ text: `${interaction.user.username} | کیف پول: ${user.wallet} Ccoin | بانک: ${user.bank} Ccoin | کریستال: ${user.crystals} 💎` })
      .setTimestamp();
    
    let components = [];
    
    if (!showOther) {
      // منوی اصلی - دکمه‌های با اولویت بالاتر
      
      // Row 1: اصلی‌ترین ویژگی‌ها با بیشترین کاربرد
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
            .setStyle(ButtonStyle.Danger),
        );
      
      // Row 2: ویژگی‌های مهم و پرکاربرد دوم
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('profile')
            .setLabel('👤 پروفایل')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('inventory')
            .setLabel('🎒 کوله‌پشتی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('quests')
            .setLabel('🎯 ماموریت‌ها')
            .setStyle(ButtonStyle.Danger),
        );
      
      // Row 3: ویژگی‌های مهم ردیف سوم
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('clans')
            .setLabel('🏰 کلن‌ها')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('wheel')
            .setLabel('🎡 چرخ شانس')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('🕵️‍♂️ سرقت')
            .setStyle(ButtonStyle.Secondary),
        );
      
      // Row 4: راهنما و دکمه موارد دیگر
      const row4 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help')
            .setLabel('📜 راهنما')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('other_options')
            .setLabel('✨ موارد دیگر')
            .setStyle(ButtonStyle.Secondary),
        );
      
      components = [row1, row2, row3, row4];
    } else {
      // منوی موارد دیگر - دکمه‌های با اولویت کمتر
      
      // Row 1: ویژگی‌های کمتر استفاده شده - گروه اول
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('marketplace')
            .setLabel('🏪 بازار')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('tournaments')
            .setLabel('🏁 تورنمنت‌ها')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('achievements')
            .setLabel('🎖️ دستاوردها')
            .setStyle(ButtonStyle.Success),
        );
      
      // Row 2: ویژگی‌های کمتر استفاده شده - گروه دوم
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('seasons')
            .setLabel('🏆 فصل‌ها')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('parallel_worlds')
            .setLabel('🌀 جهان‌های موازی')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('calendar')
            .setLabel('📅 تقویم')
            .setStyle(ButtonStyle.Danger),
        );
      
      // Row 3: گزینه‌های جدید
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('stocks')
            .setLabel('📈 سهام')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('lottery')
            .setLabel('🎟️ قرعه‌کشی')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('pets')
            .setLabel('🐾 حیوانات خانگی')
            .setStyle(ButtonStyle.Primary),
        );
      
      // Row 4: دکمه بازگشت به منوی اصلی
      const row4 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت به منوی اصلی')
            .setStyle(ButtonStyle.Danger),
        );
      
      components = [row1, row2, row3, row4];
    }
    
    // Send or update the message
    if (interaction instanceof ChatInputCommandInteraction) {
      await interaction.reply({ embeds: [embed], components: components, ephemeral: false });
    } else if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ embeds: [embed], components: components });
      } catch (e) {
        // If update fails (might be due to deferred interaction), send a new message
        await interaction.reply({ embeds: [embed], components: components, ephemeral: false });
      }
    } else {
      await interaction.reply({ embeds: [embed], components: components, ephemeral: false });
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
