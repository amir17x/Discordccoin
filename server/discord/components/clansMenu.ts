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
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // Get all clans
    const clans = await storage.getAllClans();
    
    // Get user's clan if they're in one
    const userClan = user.clanId ? await storage.getClan(user.clanId) : null;
    
    // Create the clans embed - با رنگ طلایی به سبک Clash of Clans
    const embed = new EmbedBuilder()
      .setColor('#FFD700') // رنگ طلایی برای حس قدرت و ارزش
      .setTitle('🏰 بخش کلن‌ها')
      .setDescription(userClan 
        ? `به کلن **${userClan.name}** خوش آمدید! 🌟\nبا دوستانت متحد شو، وار بزن و کلنت رو به اوج برسون! 🚀`
        : '🏰 به بخش کلن‌ها خوش اومدی! 🌟\nبا دوستات متحد شو، وار بزن و کلنت رو به اوج برسون! 🚀')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/9041/9041123.png') // آیکون fi-rr-castle برای بخش کلن ها
      .setFooter({ text: `${interaction.user.username} | موجودی: ${user.wallet} Ccoin` })
      .setTimestamp();
    
    if (userClan) {
      // اطلاعات کلن - با سبک جدید و حرفه‌ای تر
      embed.addFields(
        { 
          name: '🏰 کلن من: ' + userClan.name, 
          value: `🆔 آیدی: #CLAN-${userClan.id}\n📊 لِوِل: ${userClan.level} (امتیاز: ${userClan.level * 5000 - 3000}/${userClan.level * 5000})\n👥 اعضا: ${userClan.memberCount}/${10 * userClan.level} نفر`, 
          inline: false 
        },
        { 
          name: '🏦 بانک کلن', 
          value: `${userClan.bank} Ccoin`, 
          inline: true 
        },
        { 
          name: '👑 بنیانگذار', 
          value: `<@${userClan.ownerId}>`, 
          inline: true 
        },
        { 
          name: '🏆 مقام کاربر', 
          value: user.discordId === userClan.ownerId ? 'Leader' : (userClan.elderIds && userClan.elderIds.includes(user.discordId) ? 'Elder' : 'Member'), 
          inline: true 
        }
      );

      // نمایش اطلاعات جزیره کلن اگر وجود داشته باشد
      if (userClan.hasIsland) {
        const islandLevel = userClan.islandLevel || 1;
        embed.addFields({
          name: '🏝️ جزیره کلن',
          value: `لِوِل ${islandLevel} (سود روزانه: ${islandLevel * 100} Ccoin)`,
          inline: true
        });
      }
      
      // نمایش وضعیت وار اگر در وار هستند
      if (userClan.warStatus && userClan.warStatus !== 'none') {
        const warOpponentName = userClan.warOpponentName || 'کلن رقیب';
        embed.addFields({
          name: '⚔️ وضعیت وار',
          value: `در حال وار با ${warOpponentName}`,
          inline: true
        });
      }
    } else {
      // Show some clans if there are any - with improved formatting
      if (clans.length > 0) {
        const topClans = clans
          .sort((a, b) => b.level - a.level || b.memberCount - a.memberCount)
          .slice(0, 3);
        
        const clanList = topClans.map(clan => 
          `**${clan.name}** 🏰\n👑 بنیانگذار: <@${clan.ownerId}>\n👥 اعضا: ${clan.memberCount}/${10 * clan.level}\n🌟 لِوِل: ${clan.level}`
        ).join('\n\n');
        
        embed.addFields({ 
          name: '🔍 کلن‌های برتر', 
          value: clanList || 'هنوز کلنی ساخته نشده است.', 
          inline: false 
        });
        
        // توضیحات برای ایجاد انگیزه
        embed.addFields({ 
          name: '💡 نکته طلایی', 
          value: 'پیوستن به کلن‌ها علاوه بر امکان وار، به شما پاداش‌های روزانه و ماموریت‌های گروهی می‌دهد!', 
          inline: false 
        });
      }
    }
    
    // Create buttons based on whether user is in a clan - با تغییرات گرافیکی و عملکردی
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    
    if (userClan) {
      // User is in a clan - colorful buttons with improved layout
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
      
      // Additional clan features with improved tooltips
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('clan_war')
            .setLabel('⚔️ وار کلن')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(userClan.level < 3), // Available for level 3+ clans
          new ButtonBuilder()
            .setCustomId('clan_island')
            .setLabel('🏝️ جزیره کلن')
            .setStyle(ButtonStyle.Success)
            .setDisabled(userClan.level < 2), // Available for level 2+ clans
          new ButtonBuilder()
            .setCustomId('clan_settings')
            .setLabel('⚙️ تنظیمات کلن')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(user.discordId !== userClan.ownerId && (!userClan.coLeaderIds || !userClan.coLeaderIds.includes(user.discordId))) // Only available to leader/co-leader
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
            .setStyle(ButtonStyle.Secondary)
        );
      
      rows.push(row3);
    } else {
      // User is not in a clan - با دکمه‌های جذاب‌تر
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
      
      // راهنمای ساخت کلن و دکمه رتبه‌بندی کلن‌ها
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('clan_rankings')
            .setLabel('📊 رتبه‌بندی کلن‌ها')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
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
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // فرض می‌کنیم داده‌های مربوط به Co-Leader و Elder در کلن ذخیره شده‌اند
        const coLeaderIds = userClan.coLeaderIds || [];
        const elderIds = userClan.elderIds || [];
        
        // فرض می‌کنیم لیست اعضا را در دیتابیس داریم
        // برای این نمونه، فرض می‌کنیم کل اعضا را می‌توانیم بدست آوریم
        const allUsers = await storage.getAllUsers();
        const clanMembers = allUsers.filter(u => u.clanId === userClan.id);
        
        // ایمبد اطلاعات اعضای کلن - با طراحی Clash of Clans
        const membersEmbed = new EmbedBuilder()
          .setColor('#FFD700') // رنگ طلایی
          .setTitle(`👥 اعضای کلن ${userClan.name} 🏰`)
          .setDescription(`تعداد اعضا: ${userClan.memberCount}/${10 * userClan.level} نفر`)
          .setFooter({ text: 'برای ارتقاء یا اخراج اعضا، دکمه‌های زیر را استفاده کنید' })
          .setTimestamp();
        
        // دسته بندی اعضا بر اساس مقام
        let leaderInfo = '';
        let coLeadersInfo = '';
        let eldersInfo = '';
        let membersInfo = '';
        
        // افزودن Leader
        const leaderUser = clanMembers.find(u => u.discordId === userClan.ownerId);
        if (leaderUser) {
          leaderInfo = `👑 **${leaderUser.username}** (<@${leaderUser.discordId}>)\n`;
        } else {
          leaderInfo = `👑 **بنیانگذار** (<@${userClan.ownerId}>)\n`;
        }
        
        // افزودن Co-Leaders
        if (coLeaderIds.length > 0) {
          coLeadersInfo = '🛡️ **معاونین کلن (Co-Leader):**\n';
          coLeaderIds.forEach(coId => {
            const coLeader = clanMembers.find(u => u.discordId === coId);
            if (coLeader) {
              coLeadersInfo += `- ${coLeader.username} (<@${coLeader.discordId}>)\n`;
            } else {
              coLeadersInfo += `- <@${coId}>\n`;
            }
          });
        }
        
        // افزودن Elders
        if (elderIds.length > 0) {
          eldersInfo = '⚔️ **بزرگان کلن (Elder):**\n';
          elderIds.forEach(elderId => {
            const elder = clanMembers.find(u => u.discordId === elderId);
            if (elder) {
              eldersInfo += `- ${elder.username} (<@${elder.discordId}>)\n`;
            } else {
              eldersInfo += `- <@${elderId}>\n`;
            }
          });
        }
        
        // افزودن Members
        const regularMembers = clanMembers.filter(
          u => u.discordId !== userClan.ownerId && 
               !coLeaderIds.includes(u.discordId) && 
               !elderIds.includes(u.discordId)
        );
        
        if (regularMembers.length > 0) {
          membersInfo = '🧑‍🤝‍🧑 **اعضای عادی (Member):**\n';
          regularMembers.forEach(member => {
            membersInfo += `- ${member.username} (<@${member.discordId}>)\n`;
          });
        }
        
        // افزودن فیلدها به امبد
        membersEmbed.addFields(
          { name: 'رهبر کلن', value: leaderInfo || 'بدون رهبر', inline: false }
        );
        
        if (coLeadersInfo) {
          membersEmbed.addFields({ name: 'معاونین کلن', value: coLeadersInfo, inline: false });
        }
        
        if (eldersInfo) {
          membersEmbed.addFields({ name: 'بزرگان کلن', value: eldersInfo, inline: false });
        }
        
        if (membersInfo) {
          membersEmbed.addFields({ name: 'اعضای عادی', value: membersInfo, inline: false });
        }
        
        // تعیین اینکه آیا کاربر دسترسی مدیریت اعضا را دارد
        const canManageMembers = user.discordId === userClan.ownerId || coLeaderIds.includes(user.discordId);
        
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        
        // دکمه‌های دعوت و مدیریت
        if (canManageMembers) {
          const manageRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('clan_promote_member')
                .setLabel('🔼 ارتقاء عضو')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('clan_demote_member')
                .setLabel('🔽 تنزل عضو')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('clan_kick_member')
                .setLabel('🚫 اخراج عضو')
                .setStyle(ButtonStyle.Danger)
            );
          
          rows.push(manageRow);
        }
        
        // دکمه دعوت عضو و بازگشت
        const inviteRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_invite_member')
              .setLabel('📨 دعوت عضو')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!canManageMembers),
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Secondary)
          );
        
        rows.push(inviteRow);
        
        await interaction.update({ 
          embeds: [membersEmbed], 
          components: rows,
          content: null
        });
        
        return;
      }
      
      // پردازش دکمه ارتقاء عضو
      if (customId === 'clan_promote_member') {
        if (!userClan) {
          await interaction.reply({
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی دسترسی
        const coLeaderIds = userClan.coLeaderIds || [];
        const canManageMembers = user.discordId === userClan.ownerId || coLeaderIds.includes(user.discordId);
        
        if (!canManageMembers) {
          await interaction.reply({
            content: '⚠️ شما دسترسی لازم برای ارتقاء اعضا را ندارید.',
            ephemeral: true
          });
          return;
        }
        
        // نمایش مودال برای انتخاب کاربر
        const modal = new ModalBuilder()
          .setCustomId('promote_clan_member_modal')
          .setTitle('ارتقاء عضو کلن');
        
        const memberIdInput = new TextInputBuilder()
          .setCustomId('member_id')
          .setLabel('آیدی کاربر')
          .setPlaceholder('آیدی عددی کاربر یا @mention او را وارد کنید')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);
        
        const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(memberIdInput);
        modal.addComponents(modalRow);
        
        await interaction.showModal(modal);
        return;
      }
      
      // پردازش دکمه تنزل عضو
      if (customId === 'clan_demote_member') {
        if (!userClan) {
          await interaction.reply({
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی دسترسی
        const coLeaderIds = userClan.coLeaderIds || [];
        const canManageMembers = user.discordId === userClan.ownerId || coLeaderIds.includes(user.discordId);
        
        if (!canManageMembers) {
          await interaction.reply({
            content: '⚠️ شما دسترسی لازم برای تنزل اعضا را ندارید.',
            ephemeral: true
          });
          return;
        }
        
        // نمایش مودال برای انتخاب کاربر
        const modal = new ModalBuilder()
          .setCustomId('demote_clan_member_modal')
          .setTitle('تنزل عضو کلن');
        
        const memberIdInput = new TextInputBuilder()
          .setCustomId('member_id')
          .setLabel('آیدی کاربر')
          .setPlaceholder('آیدی عددی کاربر یا @mention او را وارد کنید')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);
        
        const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(memberIdInput);
        modal.addComponents(modalRow);
        
        await interaction.showModal(modal);
        return;
      }
      
      // پردازش دکمه اخراج عضو
      if (customId === 'clan_kick_member') {
        if (!userClan) {
          await interaction.reply({
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی دسترسی
        const coLeaderIds = userClan.coLeaderIds || [];
        const canManageMembers = user.discordId === userClan.ownerId || coLeaderIds.includes(user.discordId);
        
        if (!canManageMembers) {
          await interaction.reply({
            content: '⚠️ شما دسترسی لازم برای اخراج اعضا را ندارید.',
            ephemeral: true
          });
          return;
        }
        
        // نمایش مودال برای انتخاب کاربر
        const modal = new ModalBuilder()
          .setCustomId('kick_clan_member_modal')
          .setTitle('اخراج عضو کلن');
        
        const memberIdInput = new TextInputBuilder()
          .setCustomId('member_id')
          .setLabel('آیدی کاربر')
          .setPlaceholder('آیدی عددی کاربر یا @mention او را وارد کنید')
          .setRequired(true)
          .setStyle(TextInputStyle.Short);
        
        const reasonInput = new TextInputBuilder()
          .setCustomId('kick_reason')
          .setLabel('دلیل اخراج')
          .setPlaceholder('دلیل اخراج عضو را وارد کنید')
          .setRequired(false)
          .setStyle(TextInputStyle.Paragraph);
        
        const memberRow = new ActionRowBuilder<TextInputBuilder>().addComponents(memberIdInput);
        const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
        modal.addComponents(memberRow, reasonRow);
        
        await interaction.showModal(modal);
        return;
      }
      
      // Handle clan bank
      if (customId === 'clan_bank') {
        if (!userClan) {
          await interaction.reply({
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی دسترسی برای برداشت از بانک
        const coLeaderIds = userClan.coLeaderIds || [];
        const canWithdraw = user.discordId === userClan.ownerId || coLeaderIds.includes(user.discordId);
        
        // محاسبه کارمزد
        const depositFee = 2; // 2% for deposit
        const withdrawFee = 5; // 5% for withdraw
        
        // Show clan bank info with improved design - Clash of Clans style
        const bankEmbed = new EmbedBuilder()
          .setColor('#FFD700') // Gold color
          .setTitle(`🏦 بانک کلن ${userClan.name}`)
          .setDescription(`💰 **موجودی فعلی: ${userClan.bank.toLocaleString('fa-IR')} Ccoin**\n\nبانک کلن برای خرید آیتم، ارتقاء جزیره و شرکت در وار استفاده می‌شود. هر عضو می‌تواند به بانک کلن واریز کند، اما فقط Leader و Co-Leader می‌توانند برداشت کنند.`)
          .addFields(
            { 
              name: '📊 اطلاعات تراکنش', 
              value: `💸 **کارمزد واریز**: ${depositFee}%\n💸 **کارمزد برداشت**: ${withdrawFee}%\n👛 **موجودی شما**: ${user.wallet.toLocaleString('fa-IR')} Ccoin`, 
              inline: false 
            },
            {
              name: '💡 آیتم‌های قابل خرید',
              value: '🛡️ **سپر کلن**: 5,000 Ccoin (محافظت از وار برای 24 ساعت)\n⚡ **بوست وار**: 3,000 Ccoin (+10% شانس برد وار)\n🎁 **جعبه کلن**: 2,000 Ccoin (جایزه تصادفی برای همه اعضا)',
              inline: false
            }
          )
          .setFooter({ text: `هر واریز به بانک کلن ${userClan.name} به شما امتیاز فعالیت می‌دهد` })
          .setTimestamp();
        
        // Create deposit buttons with improved UI
        const depositRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_deposit:100')
              .setLabel('💰 واریز 100 Ccoin')
              .setStyle(ButtonStyle.Success)
              .setDisabled(user.wallet < 100),
            new ButtonBuilder()
              .setCustomId('clan_deposit:500')
              .setLabel('💰 واریز 500 Ccoin')
              .setStyle(ButtonStyle.Success)
              .setDisabled(user.wallet < 500),
            new ButtonBuilder()
              .setCustomId('clan_deposit:1000')
              .setLabel('💰 واریز 1000 Ccoin')
              .setStyle(ButtonStyle.Success)
              .setDisabled(user.wallet < 1000)
          );
        
        // Create withdraw buttons - only available for Leader/Co-Leader
        const withdrawRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_withdraw:500')
              .setLabel('🏧 برداشت 500 Ccoin')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!canWithdraw || userClan.bank < 500),
            new ButtonBuilder()
              .setCustomId('clan_withdraw:1000')
              .setLabel('🏧 برداشت 1000 Ccoin')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!canWithdraw || userClan.bank < 1000),
            new ButtonBuilder()
              .setCustomId('clan_withdraw:5000')
              .setLabel('🏧 برداشت 5000 Ccoin')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!canWithdraw || userClan.bank < 5000)
          );
        
        // Create item shop buttons
        const shopRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_buy_item:shield')
              .setLabel('🛡️ خرید سپر کلن (5000)')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(!canWithdraw || userClan.bank < 5000),
            new ButtonBuilder()
              .setCustomId('clan_buy_item:boost')
              .setLabel('⚡ بوست وار (3000)')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(!canWithdraw || userClan.bank < 3000),
            new ButtonBuilder()
              .setCustomId('clan_buy_item:box')
              .setLabel('🎁 جعبه کلن (2000)')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(!canWithdraw || userClan.bank < 2000)
          );
          
        // Back button
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Secondary)
          );
        
        // نمایش دکمه‌های مناسب بر اساس نقش کاربر
        const components = canWithdraw 
          ? [depositRow, withdrawRow, shopRow, backRow]
          : [depositRow, backRow];
        
        await interaction.update({ embeds: [bankEmbed], components: components });
        return;
      }
      
      // Handle clan deposit
      if (customId.startsWith('clan_deposit:')) {
        if (!userClan) {
          await interaction.reply({
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        const amount = parseInt(customId.split(':')[1]);
        if (isNaN(amount) || amount <= 0) {
          await interaction.reply({
            content: '⚠️ مقدار نامعتبر برای واریز.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی موجودی کاربر
        if (user.wallet < amount) {
          await interaction.reply({
            content: `⚠️ موجودی شما کافی نیست. شما ${user.wallet} Ccoin دارید اما ${amount} Ccoin نیاز است.`,
            ephemeral: true
          });
          return;
        }
        
        // محاسبه کارمزد (2%)
        const fee = Math.floor(amount * 0.02);
        const netAmount = amount - fee;
        
        // انجام تراکنش
        try {
          // کم کردن از کیف پول کاربر
          await storage.addToWallet(user.id, -amount);
          
          // به‌روزرسانی بانک کلن
          const updatedClan = { ...userClan, bank: userClan.bank + netAmount };
          await storage.updateClan(userClan.id, updatedClan);
          
          // اضافه کردن امتیاز به کاربر (آپدیت activity score)
          // در اینجا منطق مربوط به activity score و پیاده‌سازی آن بستگی به ساختار دیتابیس شما دارد
          
          // نمایش پیام موفقیت
          await interaction.reply({
            content: `✅ مبلغ ${amount} Ccoin از کیف پول شما کسر شد و ${netAmount} Ccoin (پس از کسر کارمزد ${fee} Ccoin) به بانک کلن ${userClan.name} اضافه شد.`,
            ephemeral: true
          });
          
          // بازگشت به منوی بانک بعد از تاخیر
          setTimeout(async () => {
            // استفاده از کاستوم آیدی 'clan_bank' برای بازگشت به منوی بانک
            const customId = 'clan_bank';
            // رسیدن به اینجا یعنی کاربر با بانک کلن تعامل داشته است
            const updatedUser = await storage.getUserByDiscordId(interaction.user.id);
            if (updatedUser) {
              // این خط رو جایگزین متغیر user می‌کنیم تا تغییرات اعمال شده در تراکنش رو نشون بده
              if ('update' in interaction && typeof interaction.update === 'function') {
                try {
                  // دوباره رندر کردن منوی بانک
                  const updatedClan = await storage.getClan(userClan.id);
                  if (updatedClan) {
                    // همون منطق تعریف شده برای clan_bank رو اینجا استفاده می‌کنیم
                    const coLeaderIds = updatedClan.coLeaderIds || [];
                    const canWithdraw = updatedUser.discordId === updatedClan.ownerId || coLeaderIds.includes(updatedUser.discordId);
                    
                    const bankEmbed = new EmbedBuilder()
                      .setColor('#FFD700')
                      .setTitle(`🏦 بانک کلن ${updatedClan.name}`)
                      .setDescription(`💰 **موجودی فعلی: ${updatedClan.bank.toLocaleString('fa-IR')} Ccoin**\n\nبانک کلن برای خرید آیتم، ارتقاء جزیره و شرکت در وار استفاده می‌شود.`)
                      .addFields(
                        { 
                          name: '📊 اطلاعات تراکنش', 
                          value: `💸 **کارمزد واریز**: 2%\n💸 **کارمزد برداشت**: 5%\n👛 **موجودی شما**: ${updatedUser.wallet.toLocaleString('fa-IR')} Ccoin`, 
                          inline: false 
                        }
                      )
                      .setFooter({ text: 'واریز موفق انجام شد! ✓' })
                      .setTimestamp();
                    
                    const depositRow = new ActionRowBuilder<ButtonBuilder>()
                      .addComponents(
                        new ButtonBuilder()
                          .setCustomId('clan_deposit:100')
                          .setLabel('💰 واریز 100 Ccoin')
                          .setStyle(ButtonStyle.Success)
                          .setDisabled(updatedUser.wallet < 100),
                        new ButtonBuilder()
                          .setCustomId('clan_deposit:500')
                          .setLabel('💰 واریز 500 Ccoin')
                          .setStyle(ButtonStyle.Success)
                          .setDisabled(updatedUser.wallet < 500),
                        new ButtonBuilder()
                          .setCustomId('clan_deposit:1000')
                          .setLabel('💰 واریز 1000 Ccoin')
                          .setStyle(ButtonStyle.Success)
                          .setDisabled(updatedUser.wallet < 1000)
                      );
                    
                    const backRow = new ActionRowBuilder<ButtonBuilder>()
                      .addComponents(
                        new ButtonBuilder()
                          .setCustomId('clans')
                          .setLabel('🔙 بازگشت')
                          .setStyle(ButtonStyle.Secondary)
                      );
                    
                    // نمایش دکمه‌های مناسب
                    const components = [depositRow, backRow];
                    
                    await interaction.followUp({ 
                      embeds: [bankEmbed], 
                      components: components,
                      ephemeral: true
                    });
                  }
                } catch (error) {
                  console.error("Error updating clan bank view after deposit:", error);
                }
              }
            }
          }, 1500);
          
        } catch (error) {
          console.error("Error processing clan deposit:", error);
          await interaction.reply({
            content: '❌ خطایی در انجام تراکنش رخ داد. لطفاً دوباره تلاش کنید.',
            ephemeral: true
          });
        }
        
        return;
      }
      
      // Handle clan withdraw
      if (customId.startsWith('clan_withdraw:')) {
        if (!userClan) {
          await interaction.reply({
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی دسترسی برای برداشت
        const coLeaderIds = userClan.coLeaderIds || [];
        const canWithdraw = user.discordId === userClan.ownerId || coLeaderIds.includes(user.discordId);
        
        if (!canWithdraw) {
          await interaction.reply({
            content: '⚠️ فقط Leader و Co-Leader می‌توانند از بانک کلن برداشت کنند.',
            ephemeral: true
          });
          return;
        }
        
        const amount = parseInt(customId.split(':')[1]);
        if (isNaN(amount) || amount <= 0) {
          await interaction.reply({
            content: '⚠️ مقدار نامعتبر برای برداشت.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی موجودی کلن
        if (userClan.bank < amount) {
          await interaction.reply({
            content: `⚠️ موجودی بانک کلن کافی نیست. بانک کلن ${userClan.bank} Ccoin دارد اما ${amount} Ccoin درخواست شده است.`,
            ephemeral: true
          });
          return;
        }
        
        // محاسبه کارمزد (5%)
        const fee = Math.floor(amount * 0.05);
        const netAmount = amount - fee;
        
        // انجام تراکنش
        try {
          // کم کردن از بانک کلن
          const updatedClan = { ...userClan, bank: userClan.bank - amount };
          await storage.updateClan(userClan.id, updatedClan);
          
          // اضافه کردن به کیف پول کاربر
          await storage.addToWallet(user.id, netAmount);
          
          // نمایش پیام موفقیت
          await interaction.reply({
            content: `✅ مبلغ ${amount} Ccoin از بانک کلن ${userClan.name} برداشت شد و ${netAmount} Ccoin (پس از کسر کارمزد ${fee} Ccoin) به کیف پول شما اضافه شد.`,
            ephemeral: true
          });
          
          // بازگشت به منوی بانک بعد از تاخیر
          setTimeout(async () => {
            await clansMenu(interaction, true);
          }, 1500);
          
        } catch (error) {
          console.error("Error processing clan withdraw:", error);
          await interaction.reply({
            content: '❌ خطایی در انجام تراکنش رخ داد. لطفاً دوباره تلاش کنید.',
            ephemeral: true
          });
        }
        
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
      
      // Handle clan war
      if (customId === 'clan_war') {
        if (!userClan) {
          await interaction.reply({
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی سطح کلن
        if (userClan.level < 3) {
          await interaction.reply({
            content: '⚠️ برای شرکت در وار کلن، سطح کلن باید حداقل 3 باشد.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی دسترسی
        const coLeaderIds = userClan.coLeaderIds || [];
        const canManageWar = user.discordId === userClan.ownerId || coLeaderIds.includes(user.discordId);
        
        // وضعیت فعلی وار
        const warStatus = userClan.warStatus || 'none';
        
        // تنظیم ایمبد با طراحی Clash of Clans style
        const warEmbed = new EmbedBuilder()
          .setColor('#FF5733') // نارنجی-قرمز برای حس حرارت جنگ
          .setTitle(`⚔️ وار کلن ${userClan.name}`)
          .setTimestamp();
        
        let components: ActionRowBuilder<ButtonBuilder>[] = [];
        
        if (warStatus === 'none') {
          // کلن در وار نیست
          warEmbed.setDescription('کلن شما در حال حاضر در هیچ واری شرکت ندارد. می‌توانید یک وار جدید شروع کنید یا منتظر دعوت از کلن‌های دیگر بمانید.');
          warEmbed.addFields(
            { 
              name: '💡 درباره وار کلن', 
              value: 'وار کلن یک رقابت 48 ساعته بین دو کلن است. اعضای هر کلن با شرکت در بازی‌ها، واریز به بانک کلن و تکمیل ماموریت‌ها امتیاز جمع می‌کنند. کلنی که امتیاز بیشتری جمع کند برنده می‌شود.', 
              inline: false 
            },
            { 
              name: '🏆 جوایز', 
              value: '🥇 **برنده**: 10,000 Ccoin + 5,000 امتیاز برای لِوِل کلن\n🥈 **بازنده**: 2,000 Ccoin + 1,000 امتیاز', 
              inline: false 
            },
            { 
              name: '💰 هزینه شرکت', 
              value: 'شروع وار کلن نیاز به 5,000 Ccoin از بانک کلن دارد.', 
              inline: false 
            }
          );
          
          // دکمه‌های شروع وار - فقط برای Leader و Co-Leader
          if (canManageWar) {
            const warStartRow = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('clan_war_start')
                  .setLabel('🔥 شروع وار جدید')
                  .setStyle(ButtonStyle.Danger)
                  .setDisabled(userClan.bank < 5000),
                new ButtonBuilder()
                  .setCustomId('clan_war_search')
                  .setLabel('🔍 جستجوی حریف')
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(userClan.bank < 5000)
              );
            
            components.push(warStartRow);
          }
        } else if (warStatus === 'preparation') {
          // مرحله آماده‌سازی
          const opponentName = userClan.warOpponentName || 'کلن رقیب';
          const preparationEndTime = userClan.warPreparationEndTime || new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 ساعت
          const timeRemaining = Math.max(0, Math.floor((new Date(preparationEndTime).getTime() - Date.now()) / (1000 * 60 * 60)));
          
          warEmbed.setDescription(`کلن شما در مرحله آماده‌سازی برای وار با **${opponentName}** است. زمان باقی‌مانده تا شروع وار: **${timeRemaining} ساعت**`);
          warEmbed.addFields(
            { 
              name: '👥 اعضای آماده', 
              value: `${userClan.warReadyMembers || 0}/${userClan.memberCount} نفر`, 
              inline: true 
            },
            { 
              name: '⚔️ وضعیت', 
              value: 'مرحله آماده‌سازی', 
              inline: true 
            },
            { 
              name: '💰 جایزه', 
              value: '10,000 Ccoin', 
              inline: true 
            },
            { 
              name: '💡 نکته', 
              value: 'در مرحله آماده‌سازی، همه اعضای کلن باید با انتخاب "اعلام آمادگی" در وار شرکت کنند تا بیشترین امتیاز را کسب کنید.', 
              inline: false 
            }
          );
          
          // دکمه اعلام آمادگی برای همه اعضا
          const readyRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('clan_war_ready')
                .setLabel('🙋‍♂️ اعلام آمادگی')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('clan_war_info')
                .setLabel('📊 اطلاعات وار')
                .setStyle(ButtonStyle.Primary)
            );
          
          components.push(readyRow);
          
          // برای لیدر و معاونین، دکمه لغو وار نیز نمایش داده می‌شود
          if (canManageWar) {
            const adminRow = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('clan_war_remind')
                  .setLabel('📣 یادآوری به اعضا')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId('clan_war_cancel')
                  .setLabel('❌ لغو وار')
                  .setStyle(ButtonStyle.Danger)
              );
            
            components.push(adminRow);
          }
        } else if (warStatus === 'active') {
          // وار در حال انجام
          const opponentName = userClan.warOpponentName || 'کلن رقیب';
          const warEndTime = userClan.warEndTime || new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 ساعت
          const timeRemaining = Math.max(0, Math.floor((new Date(warEndTime).getTime() - Date.now()) / (1000 * 60 * 60)));
          
          // امتیازات فرضی - در نسخه نهایی باید از دیتابیس خوانده شود
          const clanScore = userClan.warScore || 500;
          const opponentScore = userClan.warOpponentScore || 450;
          
          warEmbed.setDescription(`⚔️ **وار در حال انجام**\n\n${userClan.name} (${clanScore}) vs ${opponentName} (${opponentScore})\n\nزمان باقی‌مانده: **${timeRemaining} ساعت**`);
          warEmbed.addFields(
            { 
              name: '🏆 وضعیت فعلی', 
              value: clanScore > opponentScore ? 
                `🟢 **درحال برد** (+${clanScore - opponentScore})` : 
                (clanScore < opponentScore ? 
                 `🔴 **درحال باخت** (-${opponentScore - clanScore})` : 
                 '🟡 **مساوی**'), 
              inline: false 
            },
            { 
              name: '💡 کسب امتیاز', 
              value: '• هر برد در بازی رقابتی: 10 امتیاز\n• هر 1000 Ccoin واریز به بانک: 5 امتیاز\n• تکمیل ماموریت کلن: 50 امتیاز', 
              inline: false 
            }
          );
          
          // دکمه‌های منوی وار فعال
          const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('clan_war_score')
                .setLabel('📊 مشاهده جزئیات')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('clan_war_boost')
                .setLabel('⚡ بوست امتیاز')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(userClan.bank < 3000 || !canManageWar)
            );
          
          components.push(actionRow);
        } else if (warStatus === 'ended') {
          // وار به پایان رسیده
          const opponentName = userClan.warOpponentName || 'کلن رقیب';
          const clanScore = userClan.warScore || 800;
          const opponentScore = userClan.warOpponentScore || 750;
          const isWinner = clanScore > opponentScore;
          
          warEmbed.setDescription(isWinner ? 
            `🎉 **تبریک!** کلن شما در وار مقابل **${opponentName}** پیروز شد!` : 
            `😔 متأسفانه کلن شما در وار مقابل **${opponentName}** شکست خورد.`);
          
          warEmbed.addFields(
            { 
              name: '📊 نتیجه نهایی', 
              value: `${userClan.name}: **${clanScore}**\n${opponentName}: **${opponentScore}**`, 
              inline: false 
            },
            { 
              name: isWinner ? '🏆 جایزه برد' : '🥈 جایزه مشارکت', 
              value: isWinner ? 
                '• 10,000 Ccoin به بانک کلن\n• 5,000 امتیاز برای پیشرفت کلن' : 
                '• 2,000 Ccoin به بانک کلن\n• 1,000 امتیاز برای پیشرفت کلن', 
              inline: false 
            },
            { 
              name: '🔝 برترین بازیکنان', 
              value: '1. [نام کاربر 1] - 150 امتیاز\n2. [نام کاربر 2] - 120 امتیاز\n3. [نام کاربر 3] - 100 امتیاز', 
              inline: false 
            }
          );
          
          // دکمه دریافت جایزه فقط برای لیدر
          if (user.discordId === userClan.ownerId) {
            const claimRow = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('clan_war_claim_reward')
                  .setLabel('🎁 دریافت جایزه')
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId('clan_war_history')
                  .setLabel('📜 تاریخچه وار')
                  .setStyle(ButtonStyle.Secondary)
              );
            
            components.push(claimRow);
          } else {
            const historyRow = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('clan_war_history')
                  .setLabel('📜 تاریخچه وار')
                  .setStyle(ButtonStyle.Secondary)
              );
            
            components.push(historyRow);
          }
        }
        
        // دکمه بازگشت در همه حالت‌ها نمایش داده می‌شود
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Secondary)
          );
        
        components.push(backRow);
        
        await interaction.update({ embeds: [warEmbed], components: components });
        return;
      }
      
      // Handle clan island
      if (customId === 'clan_island') {
        if (!userClan) {
          await interaction.reply({
            content: '⚠️ شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Check clan level
        if (userClan.level < 2) {
          await interaction.reply({
            content: '⚠️ برای دسترسی به جزیره کلن، سطح کلن باید حداقل 2 باشد.',
            ephemeral: true
          });
          return;
        }
        
        // Create island embed
        const islandEmbed = new EmbedBuilder()
          .setColor('#4ECDC4')
          .setTitle(`🏝️ جزیره کلن ${userClan.name}`)
          .setDescription(`به جزیره اختصاصی کلن **${userClan.name}** خوش آمدید! در اینجا می‌توانید ساختمان‌های کلن را مشاهده و ارتقا دهید، پروژه‌های جدید را آغاز کنید و منابع گردآوری کنید.`)
          .addFields(
            { name: '🏛️ سطح جزیره', value: `${userClan.islandLevel || 1}`, inline: true },
            { name: '💰 بانک کلن', value: `${userClan.bank} Ccoin`, inline: true },
            { name: '👥 ظرفیت اعضا', value: `${userClan.memberCount}/${10 * userClan.level}`, inline: true }
          )
          .setFooter({ text: 'با ارتقای ساختمان‌ها و تکمیل پروژه‌ها، جزیره کلن خود را توسعه دهید' })
          .setTimestamp();
        
        // Create building row
        const buildings = userClan.buildings || [];
        // Add default buildings if none exist
        if (buildings.length === 0) {
          islandEmbed.addFields({ 
            name: '🏗️ ساختمان‌های موجود', 
            value: 'تنها ساختمان مرکزی (سطح 1) وجود دارد. از دکمه‌های زیر برای ساخت ساختمان‌های جدید استفاده کنید.', 
            inline: false 
          });
        } else {
          const buildingList = buildings.map(b => `**${b.name}** (سطح ${b.level})`).join('\n');
          islandEmbed.addFields({ 
            name: '🏗️ ساختمان‌های موجود', 
            value: buildingList, 
            inline: false 
          });
        }
        
        // Create buildings button row
        const buildingRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_buildings')
              .setLabel('🏛️ ساختمان‌ها و ارتقا')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('clan_projects')
              .setLabel('📋 پروژه‌های کلن')
              .setStyle(ButtonStyle.Success)
          );
          
        // Create resources button row
        const resourceRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_gather_resources')
              .setLabel('⛏️ جمع‌آوری منابع')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('clan_shop')
              .setLabel('🛒 فروشگاه کلن')
              .setStyle(ButtonStyle.Success)
          );
        
        // Back button row
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({ embeds: [islandEmbed], components: [buildingRow, resourceRow, backRow] });
        return;
      }
      
      // Handle clan buildings
      if (customId === 'clan_buildings') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Create buildings embed
        const buildingsEmbed = new EmbedBuilder()
          .setColor('#4ECDC4')
          .setTitle(`🏛️ ساختمان‌های کلن ${userClan.name}`)
          .setDescription('ساختمان‌های موجود در جزیره کلن شما. برای ارتقای هر ساختمان، روی دکمه مربوطه کلیک کنید.')
          .setFooter({ text: `سکه کلن: ${userClan.bank} Ccoin` })
          .setTimestamp();
          
        // Add buildings info
        const defaultBuildings = [
          { id: 'hq', type: 'headquarters', name: 'ساختمان مرکزی', level: 1, upgradePrice: 5000 },
          { id: 'bank', type: 'bank', name: 'بانک', level: 0, upgradePrice: 2000 },
          { id: 'barracks', type: 'barracks', name: 'سربازخانه', level: 0, upgradePrice: 3000 },
          { id: 'market', type: 'market', name: 'بازار', level: 0, upgradePrice: 2500 }
        ];
        
        // Merge with existing buildings
        const buildings = userClan.buildings || [];
        
        // Add each building to embed
        defaultBuildings.forEach(building => {
          // Find existing building of this type
          const existingBuilding = buildings.find(b => b.type === building.type);
          const currentLevel = existingBuilding ? existingBuilding.level : building.level;
          const buildingName = existingBuilding ? existingBuilding.name : building.name;
          
          buildingsEmbed.addFields({
            name: `${buildingName} (سطح ${currentLevel})`,
            value: currentLevel > 0 
              ? `ارتقا به سطح ${currentLevel + 1}: ${building.upgradePrice} Ccoin`
              : `ساخت: ${building.upgradePrice} Ccoin`,
            inline: false
          });
        });
        
        // Create upgrade buttons
        const upgradeRows: ActionRowBuilder<ButtonBuilder>[] = [];
        
        // Create rows with max 2 buttons each
        for (let i = 0; i < defaultBuildings.length; i += 2) {
          const row = new ActionRowBuilder<ButtonBuilder>();
          const rowBuildings = defaultBuildings.slice(i, i + 2);
          
          rowBuildings.forEach((building) => {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`clan_upgrade:${building.id}`)
                .setLabel(`${building.level > 0 ? 'ارتقای' : 'ساخت'} ${building.name}`)
                .setStyle(building.level > 0 ? ButtonStyle.Primary : ButtonStyle.Success)
                .setDisabled(userClan.bank < building.upgradePrice)
            );
          });
          
          upgradeRows.push(row);
        }
        
        // Back button row
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_island')
              .setLabel('🔙 بازگشت به جزیره')
              .setStyle(ButtonStyle.Danger)
          );
        
        upgradeRows.push(backRow);
        
        await interaction.update({ embeds: [buildingsEmbed], components: upgradeRows });
        return;
      }
      
      // Handle clan projects
      if (customId === 'clan_projects') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Create projects embed
        const projectsEmbed = new EmbedBuilder()
          .setColor('#4ECDC4')
          .setTitle(`📋 پروژه‌های کلن ${userClan.name}`)
          .setDescription('پروژه‌های فعال و در دسترس کلن شما. با مشارکت اعضا در تکمیل پروژه‌ها، کلن خود را توسعه دهید.')
          .setFooter({ text: `سکه کلن: ${userClan.bank} Ccoin` })
          .setTimestamp();
        
        // Get active projects
        const activeProjects = userClan.activeProjects || [];
        
        // Check if there are active projects
        if (activeProjects.length === 0) {
          projectsEmbed.addFields({
            name: '🚧 پروژه‌های فعال',
            value: 'در حال حاضر هیچ پروژه فعالی وجود ندارد. می‌توانید از دکمه‌های زیر برای شروع پروژه‌های جدید استفاده کنید.',
            inline: false
          });
        } else {
          // Add each active project to embed
          activeProjects.forEach(project => {
            projectsEmbed.addFields({
              name: `${project.name} (${Math.floor(project.progress)}%)`,
              value: `${project.description}\n` +
                `**منابع مورد نیاز:**\n` +
                `سکه: ${project.resourcesContributed.coins}/${project.resourcesRequired.coins} Ccoin\n` +
                `مواد: ${project.resourcesContributed.materials}/${project.resourcesRequired.materials} واحد\n` +
                `نیروی کار: ${project.resourcesContributed.labor}/${project.resourcesRequired.labor} واحد\n` +
                `**جایزه:** ${project.rewards.experience} تجربه`,
              inline: false
            });
          });
        }
        
        // Available projects
        const availableProjects = [
          {
            id: 'training_grounds',
            name: 'زمین تمرین',
            description: 'افزایش ظرفیت اعضای کلن و افزایش قدرت در جنگ‌های کلن',
            cost: 5000,
            disabled: userClan.bank < 5000 || activeProjects.length >= 2
          },
          {
            id: 'resource_center',
            name: 'مرکز منابع',
            description: 'افزایش تولید منابع و کاهش زمان جمع‌آوری',
            cost: 3000,
            disabled: userClan.bank < 3000 || activeProjects.length >= 2
          }
        ];
        
        // Add available projects section if no projects are active or fewer than 2
        if (activeProjects.length < 2) {
          projectsEmbed.addFields({
            name: '📝 پروژه‌های در دسترس',
            value: 'پروژه‌های زیر را می‌توانید آغاز کنید (حداکثر 2 پروژه همزمان):',
            inline: false
          });
        }
        
        // Create project buttons
        const projectRows: ActionRowBuilder<ButtonBuilder>[] = [];
        
        // Contribute buttons for active projects
        if (activeProjects.length > 0) {
          const contributeRow = new ActionRowBuilder<ButtonBuilder>();
          activeProjects.forEach((project, index) => {
            contributeRow.addComponents(
              new ButtonBuilder()
                .setCustomId(`clan_contribute:${index}`)
                .setLabel(`مشارکت در ${project.name}`)
                .setStyle(ButtonStyle.Primary)
            );
          });
          projectRows.push(contributeRow);
        }
        
        // Start new project buttons
        if (activeProjects.length < 2) {
          const newProjectsRow = new ActionRowBuilder<ButtonBuilder>();
          availableProjects.forEach(project => {
            newProjectsRow.addComponents(
              new ButtonBuilder()
                .setCustomId(`clan_start_project:${project.id}`)
                .setLabel(`شروع ${project.name} (${project.cost} Ccoin)`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(project.disabled)
            );
          });
          projectRows.push(newProjectsRow);
        }
        
        // Back button row
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_island')
              .setLabel('🔙 بازگشت به جزیره')
              .setStyle(ButtonStyle.Danger)
          );
        
        projectRows.push(backRow);
        
        await interaction.update({ embeds: [projectsEmbed], components: projectRows });
        return;
      }
      
      // Handle clan resource gathering
      if (customId === 'clan_gather_resources') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Get user's resources
        const resources = (user as any).clanResources || {
          materials: 0,
          labor: 0,
          lastCollected: new Date(0).toISOString()
        };
        
        // Check cooldown (6 hours)
        const now = new Date();
        const lastCollected = new Date((resources as any).lastCollected);
        const hoursSinceLastCollection = Math.floor((now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60));
        const cooldownHours = 6;
        
        // Create resources embed
        const resourcesEmbed = new EmbedBuilder()
          .setColor('#4ECDC4')
          .setTitle(`⛏️ جمع‌آوری منابع کلن ${userClan.name}`)
          .setDescription('منابع کلن برای ساخت و ارتقای ساختمان‌ها و تکمیل پروژه‌های کلن استفاده می‌شوند.')
          .addFields(
            { name: '🧱 مواد شما', value: `${(resources as any).materials} واحد`, inline: true },
            { name: '👷 نیروی کار شما', value: `${(resources as any).labor} واحد`, inline: true }
          )
          .setFooter({ text: 'هر 6 ساعت یکبار می‌توانید منابع جمع‌آوری کنید' })
          .setTimestamp();
        
        // Add cooldown info
        if (hoursSinceLastCollection < cooldownHours) {
          const hoursRemaining = cooldownHours - hoursSinceLastCollection;
          resourcesEmbed.addFields({ 
            name: '⏰ زمان انتظار', 
            value: `شما باید ${hoursRemaining} ساعت دیگر صبر کنید تا بتوانید مجدداً منابع جمع‌آوری کنید.`, 
            inline: false 
          });
        } else {
          resourcesEmbed.addFields({ 
            name: '✅ آماده برای جمع‌آوری', 
            value: 'شما می‌توانید منابع جدید جمع‌آوری کنید!', 
            inline: false 
          });
        }
        
        // Create gather buttons
        const gatherRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_gather_materials')
              .setLabel('جمع‌آوری مواد')
              .setStyle(ButtonStyle.Success)
              .setDisabled(hoursSinceLastCollection < cooldownHours),
            new ButtonBuilder()
              .setCustomId('clan_gather_labor')
              .setLabel('جمع‌آوری نیروی کار')
              .setStyle(ButtonStyle.Success)
              .setDisabled(hoursSinceLastCollection < cooldownHours)
          );
          
        // Contribute to project buttons
        const contributeRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_contribute_materials')
              .setLabel('اهدای مواد به پروژه')
              .setStyle(ButtonStyle.Primary)
              .setDisabled((resources as any).materials <= 0 || (userClan.activeProjects || []).length === 0),
            new ButtonBuilder()
              .setCustomId('clan_contribute_labor')
              .setLabel('اهدای نیروی کار به پروژه')
              .setStyle(ButtonStyle.Primary)
              .setDisabled((resources as any).labor <= 0 || (userClan.activeProjects || []).length === 0)
          );
          
        // Back button row
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_island')
              .setLabel('🔙 بازگشت به جزیره')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({ embeds: [resourcesEmbed], components: [gatherRow, contributeRow, backRow] });
        return;
      }
      
      // Handle clan shop
      if (customId === 'clan_shop') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Create shop embed
        const shopEmbed = new EmbedBuilder()
          .setColor('#4ECDC4')
          .setTitle(`🛒 فروشگاه کلن ${userClan.name}`)
          .setDescription('در فروشگاه کلن می‌توانید آیتم‌های ویژه‌ای برای کلن خود خریداری کنید. این آیتم‌ها به افزایش سرعت پیشرفت پروژه‌ها و بهبود عملکرد ساختمان‌های کلن کمک می‌کنند.')
          .setFooter({ text: `موجودی بانک کلن: ${userClan.bank} Ccoin` })
          .setTimestamp();
          
        // Shop items
        const shopItems = [
          {
            id: 'blueprint',
            name: 'نقشه ساختمان',
            description: 'با استفاده از این آیتم، زمان ارتقای یکی از ساختمان‌های کلن به نصف کاهش می‌یابد.',
            price: 1500,
            disabled: userClan.bank < 1500
          },
          {
            id: 'resource_boost',
            name: 'تقویت منابع',
            description: 'تولید منابع کلن را به مدت 24 ساعت دو برابر می‌کند.',
            price: 2000,
            disabled: userClan.bank < 2000
          },
          {
            id: 'clan_banner',
            name: 'پرچم کلن',
            description: 'یک بنر زیبا برای کلن شما که تجربه دریافتی از فعالیت‌های کلن را 10% افزایش می‌دهد.',
            price: 5000,
            disabled: userClan.bank < 5000
          }
        ];
        
        // Add items to embed
        shopItems.forEach(item => {
          shopEmbed.addFields({
            name: `${item.name} - ${item.price} Ccoin`,
            value: item.description,
            inline: false
          });
        });
        
        // Create purchase buttons
        const shopRows: ActionRowBuilder<ButtonBuilder>[] = [];
        
        // Split items into rows
        for (let i = 0; i < shopItems.length; i += 2) {
          const row = new ActionRowBuilder<ButtonBuilder>();
          const rowItems = shopItems.slice(i, i + 2);
          
          rowItems.forEach(item => {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`clan_shop_buy:${item.id}`)
                .setLabel(`خرید ${item.name}`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(item.disabled)
            );
          });
          
          shopRows.push(row);
        }
        
        // Back button row
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_island')
              .setLabel('🔙 بازگشت به جزیره')
              .setStyle(ButtonStyle.Danger)
          );
        
        shopRows.push(backRow);
        
        await interaction.update({ embeds: [shopEmbed], components: shopRows });
        return;
      }
      
      // Handle clan war
      if (customId === 'clan_war') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Check clan level
        if (userClan.level < 3) {
          await interaction.reply({
            content: 'برای دسترسی به وار کلن، سطح کلن باید حداقل 3 باشد.',
            ephemeral: true
          });
          return;
        }
        
        // Create war embed
        const warEmbed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle(`⚔️ وار کلن ${userClan.name}`)
          .setDescription('در این بخش می‌توانید با سایر کلن‌ها به جنگ بپردازید. هر پیروزی در جنگ کلن‌ها، جوایز ارزشمندی به همراه دارد و تجربه کلن شما را افزایش می‌دهد.')
          .addFields(
            { name: '🏆 آمار جنگ‌ها', value: `پیروزی‌ها: ${userClan.warWins || 0}\nشکست‌ها: ${userClan.warLosses || 0}`, inline: false },
            { name: '⚡ وضعیت فعلی', value: 'هیچ جنگی در جریان نیست.', inline: false }
          )
          .setFooter({ text: 'برای جنگ با کلن‌های دیگر، از دکمه‌های زیر استفاده کنید' })
          .setTimestamp();
        
        // Create war buttons
        const warRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clan_find_opponents')
              .setLabel('🔍 یافتن حریف')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('clan_war_history')
              .setLabel('📜 تاریخچه جنگ‌ها')
              .setStyle(ButtonStyle.Secondary)
          );
        
        // Back button row
        const backRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.update({ embeds: [warEmbed], components: [warRow, backRow] });
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
