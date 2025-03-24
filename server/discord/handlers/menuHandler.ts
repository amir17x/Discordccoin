import { StringSelectMenuInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { storage } from '../../storage';
import { handleCoinFlip } from '../games/coinFlip';
import { handleRockPaperScissors } from '../games/rockPaperScissors';
import { handleNumberGuess } from '../games/numberGuess';
import { handleRobbery } from '../components/robberyMenu';
import { processInvestment } from '../components/investmentMenu';
import { processBuyStock, processSellStock } from '../components/stocksMenu';
import { processBuyLotteryTicket } from '../components/lotteryMenu';

// Select menu handler function
export async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction) {
  // Get the custom ID of the select menu
  const customId = interaction.customId;
  const selectedValue = interaction.values[0];

  // Standard format for menu IDs: menu:type
  const [prefix, type] = customId.split(':');

  try {
    if (prefix === 'menu') {
      if (type === 'game') {
        // Handle game selection
        switch (selectedValue) {
          case 'coinflip':
            await handleCoinFlip(interaction, 'start');
            break;
          case 'rps':
            await handleRockPaperScissors(interaction, 'start');
            break;
          case 'numberguess':
            await handleNumberGuess(interaction, 'start');
            break;
          default:
            await interaction.reply({
              content: 'This game is coming soon!',
              ephemeral: true
            });
        }
        return;
      }

      if (type === 'deposit') {
        // Handle deposit amount selection
        const amount = parseInt(selectedValue);
        await handleDeposit(interaction, amount);
        return;
      }

      if (type === 'withdraw') {
        // Handle withdraw amount selection
        const amount = parseInt(selectedValue);
        await handleWithdraw(interaction, amount);
        return;
      }
      
      if (customId === 'target_select') {
        // Handle robbery target selection
        const targetId = parseInt(selectedValue);
        await handleRobbery(interaction, targetId);
        return;
      }
    }
    
    if (prefix === 'invest') {
      // Handle investment selections
      const amount = parseInt(selectedValue);
      
      if (type === 'low_risk') {
        await processInvestment(interaction, 'low_risk', amount);
        return;
      } else if (type === 'medium_risk') {
        await processInvestment(interaction, 'medium_risk', amount);
        return;
      } else if (type === 'high_risk') {
        await processInvestment(interaction, 'high_risk', amount);
        return;
      }
    }
    
    // Handle stock market operations
    if (customId === 'stocks_select_buy') {
      // Selected value format: buy_stock_{stockId}
      const stockId = parseInt(selectedValue.split('_')[2]);
      
      // Create a modal for quantity input
      const modal = new ModalBuilder()
        .setCustomId(`buy_stock_${stockId}_modal`)
        .setTitle('خرید سهام');
        
      const quantityInput = new TextInputBuilder()
        .setCustomId('stock_quantity')
        .setLabel('تعداد سهام')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('مثال: 10')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(6);
        
      const actionRow = new ActionRowBuilder<TextInputBuilder>()
        .addComponents(quantityInput);
        
      modal.addComponents(actionRow);
      
      await interaction.showModal(modal);
      return;
    }
    
    if (customId === 'stocks_select_sell') {
      // Selected value format: sell_stock_{stockId}
      const stockId = parseInt(selectedValue.split('_')[2]);
      
      // Create a modal for quantity input
      const modal = new ModalBuilder()
        .setCustomId(`sell_stock_${stockId}_modal`)
        .setTitle('فروش سهام');
        
      const quantityInput = new TextInputBuilder()
        .setCustomId('stock_quantity')
        .setLabel('تعداد سهام')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('مثال: 5')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(6);
        
      const actionRow = new ActionRowBuilder<TextInputBuilder>()
        .addComponents(quantityInput);
        
      modal.addComponents(actionRow);
      
      await interaction.showModal(modal);
      return;
    }
    
    // Handle lottery operations
    if (customId === 'lottery_select_buy') {
      // Selected value format: buy_lottery_{lotteryId}
      const lotteryId = parseInt(selectedValue.split('_')[2]);
      
      // Create a modal for quantity input
      const modal = new ModalBuilder()
        .setCustomId(`buy_lottery_${lotteryId}_modal`)
        .setTitle('خرید بلیط لاتاری');
        
      const quantityInput = new TextInputBuilder()
        .setCustomId('lottery_quantity')
        .setLabel('تعداد بلیط')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('مثال: 5')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(3);
        
      const actionRow = new ActionRowBuilder<TextInputBuilder>()
        .addComponents(quantityInput);
        
      modal.addComponents(actionRow);
      
      await interaction.showModal(modal);
      return;
    }

    // If no handler matched, reply with an error
    await interaction.reply({
      content: 'Sorry, I could not process that selection. Please try again.',
      ephemeral: true
    });

  } catch (error) {
    console.error('Error handling select menu interaction:', error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while processing your request!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'There was an error while processing your request!',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error replying to select menu interaction:', replyError);
    }
  }
}

// Handler for depositing money to bank
async function handleDeposit(interaction: StringSelectMenuInteraction, amount: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    if (user.wallet < amount) {
      await interaction.reply({
        content: `You don't have enough Ccoin in your wallet. You have ${user.wallet} Ccoin.`,
        ephemeral: true
      });
      return;
    }
    
    // 1% fee
    const fee = Math.ceil(amount * 0.01);
    const depositAmount = amount - fee;
    
    await storage.transferToBank(user.id, amount);
    
    await interaction.reply({
      content: `✅ مبلغ ${depositAmount} سکه با موفقیت به حساب بانکی شما واریز شد. (کارمزد: ${fee} سکه)`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in deposit handler:', error);
    await interaction.reply({
      content: 'Sorry, there was an error processing your deposit!',
      ephemeral: true
    });
  }
}

// Handler for withdrawing money from bank
async function handleWithdraw(interaction: StringSelectMenuInteraction, amount: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    if (user.bank < amount) {
      await interaction.reply({
        content: `You don't have enough Ccoin in your bank. You have ${user.bank} Ccoin.`,
        ephemeral: true
      });
      return;
    }
    
    await storage.transferToWallet(user.id, amount);
    
    await interaction.reply({
      content: `✅ مبلغ ${amount} سکه با موفقیت از حساب بانکی شما برداشت شد.`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in withdraw handler:', error);
    await interaction.reply({
      content: 'Sorry, there was an error processing your withdrawal!',
      ephemeral: true
    });
  }
}
