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
            .setDisabled(userClan.level < 3), // Available for level 3+ clans
          new ButtonBuilder()
            .setCustomId('clan_island')
            .setLabel('🏝️ جزیره کلن')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(userClan.level < 2), // Available for level 2+ clans
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
      
      // Handle clan island
      if (customId === 'clan_island') {
        if (!userClan) {
          await interaction.reply({
            content: 'شما عضو هیچ کلنی نیستید.',
            ephemeral: true
          });
          return;
        }
        
        // Check clan level
        if (userClan.level < 2) {
          await interaction.reply({
            content: 'برای دسترسی به جزیره کلن، سطح کلن باید حداقل 2 باشد.',
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
