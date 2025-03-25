import { ModalSubmitInteraction, EmbedBuilder } from 'discord.js';
import { storage } from '../../storage';
import { processBuyStock, processSellStock } from '../components/stocksMenu';
import { processBuyLotteryTicket } from '../components/lotteryMenu';
import { buyGiveawayTickets } from '../components/giveawayBridge';
import { processTransfer } from '../components/economyMenu';
import { LogType, getLogger } from '../utils/logger';
import { botConfig } from '../utils/config';
import { adminMenu } from '../components/adminMenu';
import { clansMenu } from '../components/clansMenu';

/**
 * Handler for modal submissions
 * @param interaction Modal submission interaction
 */
export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  try {
    const customId = interaction.customId;
    
    // Handle stock purchasing modal
    if (customId.startsWith('buy_stock_')) {
      const stockId = parseInt(customId.split('_')[2]);
      const quantityInput = interaction.fields.getTextInputValue('stock_quantity');
      const quantity = parseInt(quantityInput);
      
      if (isNaN(quantity) || quantity <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای تعداد سهام وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      await processBuyStock(interaction, stockId, quantity);
      return;
    }
    
    // Handle stock selling modal
    if (customId.startsWith('sell_stock_')) {
      const stockId = parseInt(customId.split('_')[2]);
      const quantityInput = interaction.fields.getTextInputValue('stock_quantity');
      const quantity = parseInt(quantityInput);
      
      if (isNaN(quantity) || quantity <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای تعداد سهام وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      await processSellStock(interaction, stockId, quantity);
      return;
    }
    
    // Handle lottery ticket purchasing modal
    if (customId.startsWith('buy_lottery_')) {
      const lotteryId = parseInt(customId.split('_')[2]);
      const quantityInput = interaction.fields.getTextInputValue('lottery_quantity');
      const quantity = parseInt(quantityInput);
      
      if (isNaN(quantity) || quantity <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای تعداد بلیط وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      await processBuyLotteryTicket(interaction, lotteryId, quantity);
      return;
    }
    
    // Handle giveaway ticket purchasing modal
    if (customId === 'buy_giveaway_tickets') {
      const quantityInput = interaction.fields.getTextInputValue('ticket_quantity');
      const quantity = parseInt(quantityInput);
      
      if (isNaN(quantity) || quantity <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای تعداد بلیط وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      await buyGiveawayTickets(interaction, quantity);
      return;
    }
    
    // Handle coin transfer modal
    if (customId === 'transfer_modal') {
      const receiverId = interaction.fields.getTextInputValue('receiver_id');
      const amountInput = interaction.fields.getTextInputValue('amount');
      const message = interaction.fields.getTextInputValue('message');
      const amount = parseInt(amountInput);
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ لطفاً یک عدد مثبت برای مقدار سکه وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      await processTransfer(interaction, receiverId, amount, message);
      return;
    }
    
    // Handle log channel setting modal
    if (customId.startsWith('set_log_channel_')) {
      const logType = customId.replace('set_log_channel_', '') as LogType;
      const channelId = interaction.fields.getTextInputValue('channelId');
      
      // Validate channel ID (basic check)
      if (!channelId || channelId.trim() === '') {
        await interaction.reply({
          content: 'شناسه کانال نمی‌تواند خالی باشد!',
          ephemeral: true
        });
        return;
      }
      
      // Check if channel exists and is a text channel
      const channel = interaction.client.channels.cache.get(channelId);
      if (!channel) {
        await interaction.reply({
          content: 'کانالی با این شناسه یافت نشد!',
          ephemeral: true
        });
        return;
      }
      
      // Set the channel for the specified log type
      botConfig.setLogChannel(logType, channelId);
      
      // Update logger with new channel
      const logger = getLogger(interaction.client);
      logger.setChannels({ [logType]: channelId });
      
      await interaction.reply({
        content: `✅ کانال لاگ ${logType} با موفقیت تنظیم شد.`,
        ephemeral: true
      });
      
      return;
    }
    
    // Handle default log channel setting
    if (customId === 'set_default_log_channel') {
      const channelId = interaction.fields.getTextInputValue('channelId');
      
      // Validate channel ID (basic check)
      if (!channelId || channelId.trim() === '') {
        await interaction.reply({
          content: 'شناسه کانال نمی‌تواند خالی باشد!',
          ephemeral: true
        });
        return;
      }
      
      // Check if channel exists and is a text channel
      const channel = interaction.client.channels.cache.get(channelId);
      if (!channel) {
        await interaction.reply({
          content: 'کانالی با این شناسه یافت نشد!',
          ephemeral: true
        });
        return;
      }
      
      // Set the default channel for logs
      botConfig.setDefaultLogChannel(channelId);
      
      // Update logger with new default channel
      const logger = getLogger(interaction.client);
      logger.setDefaultChannel(channelId);
      
      await interaction.reply({
        content: '✅ کانال پیش‌فرض لاگ‌ها با موفقیت تنظیم شد.',
        ephemeral: true
      });
      
      return;
    }
    
    // Handle admin add coin modal
    if (customId === 'admin_add_coin_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const amountInput = interaction.fields.getTextInputValue('amount');
      const amount = parseInt(amountInput);
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ لطفاً مقدار معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // Add coins to wallet
      await storage.addToWallet(user.id, amount, 'admin_add');
      
      const embed = new EmbedBuilder()
        .setTitle('💰 افزودن سکه')
        .setColor('#00FF00')
        .setDescription(`سکه با موفقیت به کاربر اضافه شد.`)
        .addFields(
          { name: 'کاربر', value: user.username, inline: true },
          { name: 'مقدار', value: `${amount} سکه`, inline: true },
          { name: 'موجودی فعلی', value: `${user.wallet + amount} سکه`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      const logger = getLogger(interaction.client);
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'add_coin',
        `افزودن ${amount} سکه به کاربر ${user.username}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 1500);
      
      return;
    }
    
    // Handle admin remove coin modal
    if (customId === 'admin_remove_coin_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const amountInput = interaction.fields.getTextInputValue('amount');
      const amount = parseInt(amountInput);
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ لطفاً مقدار معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // Check if user has enough coins
      if (user.wallet < amount) {
        await interaction.reply({
          content: `❌ کاربر به اندازه کافی سکه ندارد. موجودی فعلی: ${user.wallet} سکه`,
          ephemeral: true
        });
        return;
      }
      
      // Remove coins from wallet
      await storage.addToWallet(user.id, -amount, 'admin_remove');
      
      const embed = new EmbedBuilder()
        .setTitle('💸 کاهش سکه')
        .setColor('#FF0000')
        .setDescription(`سکه با موفقیت از کاربر کسر شد.`)
        .addFields(
          { name: 'کاربر', value: user.username, inline: true },
          { name: 'مقدار', value: `${amount} سکه`, inline: true },
          { name: 'موجودی فعلی', value: `${user.wallet - amount} سکه`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      const logger = getLogger(interaction.client);
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'remove_coin',
        `کاهش ${amount} سکه از کاربر ${user.username}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 1500);
      
      return;
    }
    
    // Handle admin distribute coin modal
    if (customId === 'admin_distribute_coin_modal') {
      const amountInput = interaction.fields.getTextInputValue('amount');
      const reason = interaction.fields.getTextInputValue('reason');
      const amount = parseInt(amountInput);
      
      if (isNaN(amount) || amount <= 0) {
        await interaction.reply({
          content: '❌ لطفاً مقدار معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      await interaction.deferReply({ ephemeral: true });
      
      // Get all users
      const users = await storage.getAllUsers();
      let distributedCount = 0;
      
      // Distribute coins to all users
      for (const user of users) {
        await storage.addToWallet(user.id, amount, 'admin_distribute', {
          reason: reason
        });
        distributedCount++;
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🎁 توزیع سکه')
        .setColor('#FFD700')
        .setDescription(`سکه با موفقیت بین کاربران توزیع شد.`)
        .addFields(
          { name: 'تعداد کاربران', value: `${distributedCount}`, inline: true },
          { name: 'مقدار هر کاربر', value: `${amount} سکه`, inline: true },
          { name: 'مجموع', value: `${distributedCount * amount} سکه`, inline: true },
          { name: 'دلیل', value: reason }
        )
        .setTimestamp();
      
      await interaction.editReply({
        embeds: [embed]
      });
      
      // Log the action
      const logger = getLogger(interaction.client);
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'distribute_coin',
        `توزیع ${amount} سکه بین ${distributedCount} کاربر: ${reason}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 2000);
      
      return;
    }
    
    // Handle admin set interest rate modal
    if (customId === 'admin_set_interest_modal') {
      const rateInput = interaction.fields.getTextInputValue('rate');
      const rate = parseFloat(rateInput);
      
      if (isNaN(rate) || rate < 0) {
        await interaction.reply({
          content: '❌ لطفاً نرخ معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Set interest rate
      botConfig.setBankInterestRate(rate);
      
      const embed = new EmbedBuilder()
        .setTitle('📈 تنظیم نرخ سود بانکی')
        .setColor('#4CAF50')
        .setDescription(`نرخ سود بانکی با موفقیت تنظیم شد.`)
        .addFields(
          { name: 'نرخ جدید', value: `${rate}%`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      const logger = getLogger(interaction.client);
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'set_interest_rate',
        `تنظیم نرخ سود بانکی به ${rate}%`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 1500);
      
      return;
    }
    
    // Handle admin set tax rate modal
    if (customId === 'admin_set_tax_modal') {
      const rateInput = interaction.fields.getTextInputValue('rate');
      const rate = parseFloat(rateInput);
      
      if (isNaN(rate) || rate < 0) {
        await interaction.reply({
          content: '❌ لطفاً نرخ معتبری وارد کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Set transfer fee rate
      botConfig.setTransferFeeRate(rate);
      
      const embed = new EmbedBuilder()
        .setTitle('💸 تنظیم نرخ مالیات انتقال')
        .setColor('#9C27B0')
        .setDescription(`نرخ مالیات انتقال با موفقیت تنظیم شد.`)
        .addFields(
          { name: 'نرخ جدید', value: `${rate}%`, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      const logger = getLogger(interaction.client);
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'set_tax_rate',
        `تنظیم نرخ مالیات انتقال به ${rate}%`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'economy');
      }, 1500);
      
      return;
    }
    
    // Handle clan creation modal
    if (customId === 'create_clan_modal') {
      const clanName = interaction.fields.getTextInputValue('clan_name');
      const clanDescription = interaction.fields.getTextInputValue('clan_description') || '';
      
      // Check if user exists
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        await interaction.reply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
          ephemeral: true
        });
        return;
      }
      
      // Check if user already has a clan
      if (user.clanId) {
        await interaction.reply({
          content: '⚠️ شما در حال حاضر عضو یک کلن هستید و نمی‌توانید کلن جدیدی بسازید.',
          ephemeral: true
        });
        return;
      }
      
      // Check if user has enough Ccoin (2000)
      if (user.wallet < 2000) {
        await interaction.reply({
          content: '⚠️ شما حداقل به 2000 سکه برای ساخت کلن نیاز دارید.',
          ephemeral: true
        });
        return;
      }
      
      // Check if clan name is too short
      if (clanName.length < 3) {
        await interaction.reply({
          content: '⚠️ نام کلن باید حداقل 3 کاراکتر باشد.',
          ephemeral: true
        });
        return;
      }
      
      // Check if clan name already exists
      const existingClan = await storage.getClanByName(clanName);
      if (existingClan) {
        await interaction.reply({
          content: '⚠️ کلنی با این نام قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Create clan
      try {
        await interaction.deferReply({ ephemeral: true });
        
        // Deduct creation cost
        await storage.addToWallet(user.id, -2000, 'clan_create');
        
        // Create clan
        const clan = await storage.createClan({
          name: clanName,
          description: clanDescription,
          ownerId: user.discordId,
          level: 1,
          memberCount: 1,
          bank: 0,
          createdAt: new Date()
        });
        
        // Add user to clan
        await storage.updateUser(user.id, { clanId: clan.id });
        
        // Show success message
        const successEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🏰 کلن با موفقیت ساخته شد!')
          .setDescription(`تبریک! کلن **${clanName}** با موفقیت ساخته شد.`)
          .addFields(
            { name: '💰 هزینه ساخت', value: '2000 سکه', inline: true },
            { name: '👑 مالک', value: `<@${user.discordId}>`, inline: true },
            { name: '👥 اعضا', value: '1/10', inline: true },
            { name: '📝 توضیحات', value: clanDescription || 'بدون توضیحات', inline: false }
          )
          .setFooter({ text: 'برای مدیریت کلن خود، به منوی کلن‌ها بروید.' })
          .setTimestamp();
        
        await interaction.editReply({
          embeds: [successEmbed]
        });
        
        // Return to clans menu after a delay
        setTimeout(async () => {
          await clansMenu(interaction, true);
        }, 2500);
      } catch (error) {
        console.error('Error creating clan:', error);
        
        try {
          if (interaction.deferred) {
            await interaction.editReply({
              content: '❌ خطایی در ایجاد کلن رخ داد. لطفاً مجدداً تلاش کنید.'
            });
          } else {
            await interaction.reply({
              content: '❌ خطایی در ایجاد کلن رخ داد. لطفاً مجدداً تلاش کنید.',
              ephemeral: true
            });
          }
        } catch (e) {
          console.error('Error handling clan creation error:', e);
        }
      }
      
      return;
    }
    
    // Handle clan rankings display
    if (customId === 'clan_rankings') {
      try {
        // Get all clans
        const clans = await storage.getAllClans();
        
        if (clans.length === 0) {
          await interaction.reply({
            content: '⚠️ در حال حاضر هیچ کلنی وجود ندارد.',
            ephemeral: true
          });
          return;
        }
        
        // Sort clans by level and member count
        const sortedClans = clans.sort((a, b) => {
          if (b.level !== a.level) {
            return b.level - a.level;
          }
          return b.memberCount - a.memberCount;
        });
        
        // Create the rankings embed
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🏆 رتبه‌بندی کلن‌ها')
          .setDescription('کلن‌های برتر بر اساس سطح و تعداد اعضا')
          .setFooter({ text: 'برای پیوستن به کلن یا ساخت کلن جدید به منوی کلن‌ها بروید.' })
          .setTimestamp();
        
        // Add top clans to the embed
        sortedClans.slice(0, 10).forEach((clan, index) => {
          embed.addFields({
            name: `${index + 1}. ${clan.name}`,
            value: `👑 مالک: <@${clan.ownerId}>\n🏅 سطح: ${clan.level}\n👥 اعضا: ${clan.memberCount}/${10 * clan.level}\n💰 خزانه: ${clan.bank} Ccoin`,
            inline: false
          });
        });
        
        // Add buttons
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('clans')
              .setLabel('🔙 بازگشت به منوی کلن‌ها')
              .setStyle(ButtonStyle.Primary)
          );
        
        await interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      } catch (error) {
        console.error('Error displaying clan rankings:', error);
        await interaction.reply({
          content: '❌ خطایی در نمایش رتبه‌بندی کلن‌ها رخ داد. لطفاً مجدداً تلاش کنید.',
          ephemeral: true
        });
      }
      
      return;
    }
    
    // Handle admin search user modal
    if (customId === 'admin_search_user_modal') {
      const searchTerm = interaction.fields.getTextInputValue('userId');
      
      await interaction.deferReply({ ephemeral: true });
      
      // Search for user by ID or username
      const users = await storage.getAllUsers();
      let foundUser = null;
      
      for (const user of users) {
        if (user.discordId === searchTerm || user.username.toLowerCase().includes(searchTerm.toLowerCase())) {
          foundUser = user;
          break;
        }
      }
      
      if (!foundUser) {
        await interaction.editReply({
          content: '❌ کاربری با این مشخصات یافت نشد.',
        });
        return;
      }
      
      // Display user information
      const transactions = await storage.getUserTransactions(foundUser.id);
      const transactionCount = transactions.length;
      const lastTransaction = transactions.length > 0 ? 
        `${transactions[0].type} - ${transactions[0].amount} سکه` : 'ندارد';
      
      const embed = new EmbedBuilder()
        .setTitle(`👤 اطلاعات کاربر: ${foundUser.username}`)
        .setColor('#2196F3')
        .setDescription(`اطلاعات کامل کاربر ${foundUser.username}`)
        .addFields(
          { name: 'شناسه دیسکورد', value: foundUser.discordId, inline: true },
          { name: 'کیف پول', value: `${foundUser.wallet} سکه`, inline: true },
          { name: 'بانک', value: `${foundUser.bank} سکه`, inline: true },
          { name: 'کریستال', value: `${foundUser.crystals}`, inline: true },
          { name: 'سطح اقتصادی', value: `${foundUser.economyLevel}`, inline: true },
          { name: 'آخرین دریافت روزانه', value: foundUser.lastDaily ? new Date(foundUser.lastDaily).toLocaleString() : 'ندارد', inline: true },
          { name: 'تعداد تراکنش‌ها', value: `${transactionCount}`, inline: true },
          { name: 'آخرین تراکنش', value: lastTransaction, inline: true },
          { name: 'تاریخ عضویت', value: new Date(foundUser.createdAt).toLocaleString(), inline: true }
        )
        .setTimestamp();
      
      // Add action buttons
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`admin_add_coin_${foundUser.discordId}`)
            .setLabel('افزودن سکه')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`admin_remove_coin_${foundUser.discordId}`)
            .setLabel('کاهش سکه')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`admin_reset_user_${foundUser.discordId}`)
            .setLabel('ریست کاربر')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`admin_ban_user_${foundUser.discordId}`)
            .setLabel('مسدودسازی')
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });
      
      return;
    }
    
    // Handle admin ban user modal
    if (customId === 'admin_ban_user_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const reason = interaction.fields.getTextInputValue('reason');
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // Ban user (set isBanned to true)
      await storage.updateUser(user.id, { isBanned: true });
      
      const embed = new EmbedBuilder()
        .setTitle('🚫 مسدودسازی کاربر')
        .setColor('#F44336')
        .setDescription(`کاربر با موفقیت مسدود شد.`)
        .addFields(
          { name: 'کاربر', value: user.username, inline: true },
          { name: 'شناسه', value: user.discordId, inline: true },
          { name: 'دلیل', value: reason }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      const logger = getLogger(interaction.client);
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'ban_user',
        `مسدودسازی کاربر ${user.username}: ${reason}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'users');
      }, 1500);
      
      return;
    }
    
    // Handle admin reset user modal
    if (customId === 'admin_reset_user_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      const confirmText = interaction.fields.getTextInputValue('confirm');
      
      if (confirmText !== 'RESET') {
        await interaction.reply({
          content: '❌ عبارت تایید نادرست است. عملیات لغو شد.',
          ephemeral: true
        });
        return;
      }
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.reply({
          content: '❌ کاربری با این شناسه یافت نشد.',
          ephemeral: true
        });
        return;
      }
      
      // Reset user data (set wallet, bank, etc. to default values)
      await storage.updateUser(user.id, {
        wallet: 0,
        bank: 0,
        crystals: 0,
        economyLevel: 1,
        dailyStreak: 0,
        inventory: {},
        lastDaily: null,
        lastRob: null,
        lastWheelSpin: null,
        isBanned: false
      });
      
      const embed = new EmbedBuilder()
        .setTitle('🔄 ریست کاربر')
        .setColor('#795548')
        .setDescription(`اطلاعات کاربر با موفقیت ریست شد.`)
        .addFields(
          { name: 'کاربر', value: user.username, inline: true },
          { name: 'شناسه', value: user.discordId, inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      
      // Log the action
      const logger = getLogger(interaction.client);
      logger.logAdminAction(
        interaction.user.id,
        interaction.user.username,
        'reset_user',
        `ریست اطلاعات کاربر ${user.username}`
      );
      
      // Return to admin menu
      setTimeout(async () => {
        await adminMenu(interaction, 'users');
      }, 1500);
      
      return;
    }
    
    // Handle admin user logs modal
    if (customId === 'admin_user_logs_modal') {
      const userId = interaction.fields.getTextInputValue('userId');
      
      await interaction.deferReply({ ephemeral: true });
      
      // Find user
      const user = await storage.getUserByDiscordId(userId);
      if (!user) {
        await interaction.editReply({
          content: '❌ کاربری با این شناسه یافت نشد.'
        });
        return;
      }
      
      // Get user transactions
      const transactions = await storage.getUserTransactions(user.id);
      
      if (transactions.length === 0) {
        await interaction.editReply({
          content: `❌ هیچ تراکنشی برای کاربر ${user.username} یافت نشد.`
        });
        return;
      }
      
      // Display recent transactions (up to 10)
      const embed = new EmbedBuilder()
        .setTitle(`📝 لاگ تراکنش‌های کاربر: ${user.username}`)
        .setColor('#607D8B')
        .setDescription(`۱۰ تراکنش اخیر کاربر ${user.username}`)
        .setTimestamp();
      
      const recentTransactions = transactions.slice(0, 10);
      
      for (let i = 0; i < recentTransactions.length; i++) {
        const tx = recentTransactions[i];
        let typeStr = '';
        
        switch (tx.type) {
          case 'deposit': typeStr = '📥 واریز به کیف پول'; break;
          case 'withdraw': typeStr = '📤 برداشت از بانک'; break;
          case 'transfer_in': typeStr = '📲 دریافت انتقالی'; break;
          case 'transfer_out': typeStr = '📲 ارسال انتقالی'; break;
          case 'game_win': typeStr = '🎮 برد بازی'; break;
          case 'game_loss': typeStr = '🎮 باخت بازی'; break;
          case 'quest_reward': typeStr = '🎯 پاداش ماموریت'; break;
          case 'item_purchase': typeStr = '🛒 خرید آیتم'; break;
          default: typeStr = tx.type;
        }
        
        embed.addFields({
          name: `${i + 1}. ${typeStr}`,
          value: `💰 مقدار: ${tx.amount} سکه\n` +
                 `⏱️ تاریخ: ${new Date(tx.timestamp).toLocaleString()}\n` +
                 (tx.fee > 0 ? `💸 کارمزد: ${tx.fee} سکه\n` : '') +
                 (tx.targetName ? `👤 گیرنده: ${tx.targetName}\n` : '') +
                 (tx.sourceName ? `👤 فرستنده: ${tx.sourceName}\n` : '') +
                 (tx.gameType ? `🎮 نوع بازی: ${tx.gameType}\n` : '')
        });
      }
      
      await interaction.editReply({
        embeds: [embed]
      });
      
      return;
    }
    
    // If no handler matched, reply with error
    await interaction.reply({
      content: 'خطا: نوع فرم ارسالی پشتیبانی نمی‌شود.',
      ephemeral: true
    });
    
  } catch (error) {
    console.error('Error in modal submit handler:', error);
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ خطایی در پردازش فرم رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: '❌ خطایی در پردازش فرم رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error replying to modal interaction:', replyError);
    }
  }
}