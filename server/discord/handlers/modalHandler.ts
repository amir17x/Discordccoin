import { ModalSubmitInteraction } from 'discord.js';
import { storage } from '../../storage';
import { processBuyStock, processSellStock } from '../components/stocksMenu';
import { processBuyLotteryTicket } from '../components/lotteryMenu';
import { buyGiveawayTickets } from '../components/giveawayBridge';
import { processTransfer } from '../components/economyMenu';
import { LogType, getLogger } from '../utils/logger';
import { botConfig } from '../utils/config';

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