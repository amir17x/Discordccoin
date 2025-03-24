import { 
  ButtonInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  MessageComponentInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { storage } from '../../storage';

// Function to create and send the clans menu
export async function clansMenu(
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
    
    // Get all clans
    const clans = await storage.getAllClans();
    
    // Get user's clan if they're in one
    const userClan = user.clanId ? await storage.getClan(user.clanId) : null;
    
    // Create the clans embed
    const embed = new EmbedBuilder()
      .setColor('#696969')
      .setTitle('🏰 کلن‌ها')
      .setDescription(userClan 
        ? `عضو کلن **${userClan.name}** هستید.`
        : 'به یک کلن بپیوندید یا کلن جدید بسازید.')
      .setFooter({ text: `${interaction.user.username} | موجودی: ${user.wallet} Ccoin` })
      .setTimestamp();
    
    if (userClan) {
      embed.addFields(
        { name: '📊 نمای کلی', value: `**نام کلن:** ${userClan.name}\n**اعضا:** ${userClan.memberCount}\n**بانک کلن:** ${userClan.bank} Ccoin\n**لِوِل کلن:** ${userClan.level}`, inline: false },
        { name: '👑 رهبر کلن', value: `<@${userClan.ownerId}>`, inline: true },
        { name: '🏦 بانک کلن', value: `${userClan.bank} Ccoin`, inline: true },
        { name: '🌟 لِوِل کلن', value: `${userClan.level}`, inline: true }
      );
    } else {
      // Show some clans if there are any
      if (clans.length > 0) {
        const clanList = clans.slice(0, 3).map(clan => 
          `**${clan.name}** - اعضا: ${clan.memberCount} - لول: ${clan.level}`
        ).join('\n');
        
        embed.addFields({ name: '🔍 کلن‌های موجود', value: clanList, inline: false });
      }
    }
    
    // Create buttons based on whether user is in a clan
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    
    if (userClan) {
      // User is in a clan - colorful buttons
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('clan_members')
            .setLabel('👥 اعضا')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('clan_bank')
            .setLabel('🏦 بانک کلن')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('clan_missions')
            .setLabel('🎯 ماموریت کلن')
            .setStyle(ButtonStyle.Secondary)
        );
      
      rows.push(row1);
      
      // Additional clan features (some are disabled as they're not fully implemented)
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('clan_war')
            .setLabel('⚔️ وار کلن')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true), // Not implemented yet
          new ButtonBuilder()
            .setCustomId('clan_island')
            .setLabel('🏝️ جزیره کلن')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true), // Not implemented yet
          new ButtonBuilder()
            .setCustomId('clan_settings')
            .setLabel('⚙️ تنظیمات کلن')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(user.discordId !== userClan.ownerId) // Only available to clan owner
        );
      
      rows.push(row2);
      
      // Leave clan button with colorful back button
      const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('clan_leave')
            .setLabel('🚪 خروج از کلن')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Danger)
        );
      
      rows.push(row3);
    } else {
      // User is not in a clan
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('clan_search')
            .setLabel('🔍 جستجوی کلن')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('clan_create')
            .setLabel('➕ ساخت کلن')
            .setStyle(ButtonStyle.Success)
            .setDisabled(user.wallet < 2000) // Creating a clan costs 2000 Ccoin
        );
      
      rows.push(row1);
      
      // Back button with color
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Danger)
        );
      
      rows.push(row2);
    }
    
    // Handle clan action buttons
    if (interaction.isButton()) {
      const customId = interaction.customId;
      
      // Handle clan creation
      if (customId === 'clan_create') {
        // Check if user has enough Ccoin
        if (user.wallet < 2000) {
          await interaction.reply({
            content: 'شما حداقل به 2000 سکه برای ساخت کلن نیاز دارید.',
            ephemeral: true
          });
          return;
        }
        
        // Show clan creation modal
        const modal = new ModalBuilder()
          .setCustomId('create_clan_modal')
          .setTitle('ساخت کلن جدید');
        
        const clanNameInput = new TextInputBuilder()
          .setCustomId('clan_name')
          .setLabel('نام کلن')
          .setPlaceholder('نام کلن را وارد کنید')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);
        
        const clanDescriptionInput = new TextInputBuilder()
          .setCustomId('clan_description')
          .setLabel('توضیحات کلن')
          .setPlaceholder('توضیحات کلن را وارد کنید')
          .setRequired(false)
          .setStyle(TextInputStyle.Paragraph);
        
        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(clanNameInput);
        const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(clanDescriptionInput);
        
        modal.addComponents(firstActionRow, secondActionRow);
        
        await interaction.showModal(modal);
        return;
      }
      
      // Handle clan search
      if (customId === 'clan_search') {
        // Get all clans for display
        if (clans.length === 0) {
          await interaction.reply({
            content: 'هیچ کلنی وجود ندارد. می‌توانید اولین کلن را بسازید!',
            ephemeral: true
          });
          return;
        }
        
        const searchEmbed = new EmbedBuilder()
          .setColor('#696969')
          .setTitle('🔍 جستجوی کلن')
          .setDescription('برای مشاهده اطلاعات بیشتر و پیوستن به کلن، روی دکمه کلیک کنید.')
          .setFooter({ text: 'برای پیوستن به کلن کافیست روی دکمه مربوطه کلیک کنید' })
          .setTimestamp();
        
        // Add clans to embed (max 10)
        const displayClans = clans.slice(0, 10);
        displayClans.forEach((clan, index) => {
          searchEmbed.addFields({
            name: `${index + 1}. ${clan.name}`,
            value: `**رهبر:** <@${clan.ownerId}>\n**اعضا:** ${clan.memberCount}/${10 * clan.level} نفر\n**سطح:** ${clan.level}\n**توضیحات:** ${clan.description || 'بدون توضیحات'}`,
            inline: false
          });
        });
        
        // Create buttons for joining clans
        const joinRows: ActionRowBuilder<ButtonBuilder>[] = [];
        
        // Split clans into rows of 5 buttons
        for (let i = 0; i < displayClans.length; i += 5) {
          const row = new ActionRowBuilder<ButtonBuilder>();
          const rowClans = displayClans.slice(i, i + 5);
          
          rowClans.forEach(clan => {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`clan_join:${clan.id}`)
                .setLabel(`پیوستن به ${clan.name}`)
                .setStyle(ButtonStyle.Success)
            );
          });
          
          joinRows.push(row);
        }
        
        // Add back button with color
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Danger)
          );
        
        joinRows.push(backRow);
        
        await interaction.update({ embeds: [searchEmbed], components: joinRows });
        return;
      }
      
      // Handle clan join
      if (customId.startsWith('clan_join:')) {
        const clanId = parseInt(customId.split(':')[1]);
        const clan = await storage.getClan(clanId);
        
        if (!clan) {
          await interaction.reply({
            content: 'این کلن دیگر وجود ندارد.',
            ephemeral: true
          });
          return;
        }
        
        // Check if clan is full (10 members per level)
        if (clan.memberCount >= 10 * clan.level) {
          await interaction.reply({
            content: 'این کلن پر است. لطفاً کلن دیگری را انتخاب کنید.',
            ephemeral: true
          });
          return;
        }
        
        // Join clan
        const success = await storage.addUserToClan(user.id, clanId);
        
        if (success) {
          await interaction.reply({
            content: `شما به کلن **${clan.name}** پیوستید!`,
            ephemeral: true
          });
          
          // Refresh clans menu after a delay
          setTimeout(async () => {
            await clansMenu(interaction, true);
          }, 1500);
        } else {
          await interaction.reply({
            content: 'خطا در پیوستن به کلن. لطفاً دوباره تلاش کنید.',
            ephemeral: true
          });
        }
        
        return;
      }
      
      // Handle clan leave
      if (customId === 'clan_leave') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Check if user is the owner
        if (user.discordId === userClan.ownerId) {
          await interaction.reply({
            content: 'شما رهبر کلن هستید و نمی‌توانید آن را ترک کنید. ابتدا باید رهبری را به شخص دیگری واگذار کنید.',
            ephemeral: true
          });
          return;
        }
        
        // Leave clan
        const success = await storage.removeUserFromClan(user.id);
        
        if (success) {
          await interaction.reply({
            content: `شما کلن **${userClan.name}** را ترک کردید.`,
            ephemeral: true
          });
          
          // Refresh clans menu after a delay
          setTimeout(async () => {
            await clansMenu(interaction, true);
          }, 1500);
        } else {
          await interaction.reply({
            content: 'خطا در ترک کلن. لطفاً دوباره تلاش کنید.',
            ephemeral: true
          });
        }
        
        return;
      }
      
      // Handle clan members
      if (customId === 'clan_members') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Show placeholder message for clan members (would need additional storage methods for full implementation)
        await interaction.reply({
          content: `**اعضای کلن ${userClan.name}**\n\n👑 <@${userClan.ownerId}> (رهبر)\n\nتعداد کل اعضا: ${userClan.memberCount}`,
          ephemeral: true
        });
        
        return;
      }
      
      // Handle clan bank
      if (customId === 'clan_bank') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Show clan bank info
        const bankEmbed = new EmbedBuilder()
          .setColor('#696969')
          .setTitle(`🏦 بانک کلن ${userClan.name}`)
          .setDescription(`موجودی فعلی: **${userClan.bank} Ccoin**`)
          .addFields(
            { name: '💰 واریز به بانک کلن', value: 'از دکمه‌های زیر برای واریز به بانک کلن استفاده کنید.', inline: false }
          )
          .setFooter({ text: `موجودی شما: ${user.wallet} Ccoin` })
          .setTimestamp();
        
        // Create deposit buttons
        const depositRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_deposit:100')
              .setLabel('واریز 100 Ccoin')
              .setStyle(ButtonStyle.Success)
              .setDisabled(user.wallet < 100),
            new ButtonBuilder()
              .setCustomId('clan_deposit:500')
              .setLabel('واریز 500 Ccoin')
              .setStyle(ButtonStyle.Success)
              .setDisabled(user.wallet < 500),
            new ButtonBuilder()
              .setCustomId('clan_deposit:1000')
              .setLabel('واریز 1000 Ccoin')
              .setStyle(ButtonStyle.Success)
              .setDisabled(user.wallet < 1000)
          );
        
        // Back button with color
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({ embeds: [bankEmbed], components: [depositRow, backRow] });
        return;
      }
      
      // Handle clan missions
      if (customId === 'clan_missions') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Show placeholder for clan missions (would need additional storage methods for full implementation)
        const missionsEmbed = new EmbedBuilder()
          .setColor('#696969')
          .setTitle(`🎯 ماموریت‌های کلن ${userClan.name}`)
          .setDescription('با تکمیل ماموریت‌های کلن، سکه و تجربه برای کلن خود کسب کنید.')
          .addFields(
            { name: '⚡ ماموریت فعلی', value: '50 بازی را ببرید - جایزه: 5000 Ccoin\nپیشرفت: 0/50', inline: false },
            { name: '⏰ زمان باقیمانده', value: '6 روز و 12 ساعت', inline: false }
          )
          .setFooter({ text: 'این بخش در حال توسعه است' })
          .setTimestamp();
        
        // Back button with color
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({ embeds: [missionsEmbed], components: [backRow] });
        return;
      }
    }
    
    // Send the clans menu
    if (followUp) {
      await interaction.followUp({ embeds: [embed], components: rows, ephemeral: true });
    } else {
      await interaction.update({ embeds: [embed], components: rows });
    }
    
  } catch (error) {
    console.error('Error in clans menu:', error);
    
    try {
      if (followUp) {
        await interaction.followUp({
          content: 'Sorry, there was an error displaying the clans menu!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Sorry, there was an error displaying the clans menu!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error handling clans menu failure:', e);
    }
  }
}
