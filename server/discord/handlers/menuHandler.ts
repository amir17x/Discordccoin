import { StringSelectMenuInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { storage } from '../../storage';
import { handleCoinFlip } from '../games/coinFlip';
import { handleRockPaperScissors } from '../games/rockPaperScissors';
import { handleNumberGuess } from '../games/numberGuess';
import { handleRobbery } from '../components/robberyMenu';
import { processInvestment } from '../components/investmentMenu';
import { processBuyStock, processSellStock } from '../components/stocksMenu';
import { processBuyLotteryTicket } from '../components/lotteryMenu';
import { economyMenu } from '../components/economyMenu';

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
            await interaction.update({
              content: '⚠️ این بازی به زودی در دسترس قرار خواهد گرفت!',
              components: []
            });
            
            // Auto-disappear after 5 seconds
            setTimeout(async () => {
              try {
                // Show the games menu again
                await interaction.editReply({
                  content: null,
                  components: interaction.message.components
                });
              } catch (error) {
                console.error('Error refreshing menu after error message:', error);
              }
            }, 5000);
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

    // If no handler matched, update with an error
    await interaction.update({
      content: '⚠️ متأسفانه قادر به پردازش انتخاب شما نیستم. لطفاً مجدداً تلاش کنید.',
      components: []
    });
    
    // Auto-disappear after 5 seconds and show the original menu
    setTimeout(async () => {
      try {
        await interaction.editReply({
          content: null,
          components: interaction.message.components
        });
      } catch (error) {
        console.error('Error refreshing menu after error message:', error);
      }
    }, 5000);

  } catch (error) {
    console.error('Error handling select menu interaction:', error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ خطایی در پردازش درخواست شما رخ داد. لطفاً مجدداً تلاش کنید.',
          ephemeral: true
        });
      } else {
        await interaction.update({
          content: '❌ خطایی در پردازش درخواست شما رخ داد. لطفاً مجدداً تلاش کنید.',
          components: []
        });
        
        // Auto-disappear after 5 seconds and show the original menu
        setTimeout(async () => {
          try {
            await interaction.editReply({
              content: null,
              components: interaction.message.components
            });
          } catch (error) {
            console.error('Error refreshing menu after error message:', error);
          }
        }, 5000);
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
      await interaction.update({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        components: []
      });
      
      // Auto-disappear after 5 seconds and show economy menu
      setTimeout(async () => {
        try {
          const updatedUser = await storage.getUserByDiscordId(interaction.user.id);
          if (updatedUser) {
            await economyMenu(interaction, true);
          }
        } catch (error) {
          console.error('Error refreshing menu after error message:', error);
        }
      }, 5000);
      return;
    }
    
    if (user.wallet < amount) {
      await interaction.update({
        content: `⚠️ موجودی کیف پول شما کافی نیست. موجودی فعلی: ${user.wallet} سکه`,
        components: []
      });
      
      // Auto-disappear after 5 seconds and show economy menu
      setTimeout(async () => {
        try {
          await economyMenu(interaction, true);
        } catch (error) {
          console.error('Error refreshing menu after error message:', error);
        }
      }, 5000);
      return;
    }
    
    // 1% fee
    const fee = Math.ceil(amount * 0.01);
    const depositAmount = amount - fee;
    
    await storage.transferToBank(user.id, amount);
    
    // Show success message with auto-disappear functionality
    await interaction.update({
      content: `✅ مبلغ ${depositAmount} سکه با موفقیت به حساب بانکی شما واریز شد. (کارمزد: ${fee} سکه)`,
      components: []
    });
    
    // Auto-disappear after 5 seconds and refresh economy menu
    setTimeout(async () => {
      try {
        await economyMenu(interaction, true);
      } catch (error) {
        console.error('Error refreshing economy menu after deposit:', error);
      }
    }, 5000);
  } catch (error) {
    console.error('Error in deposit handler:', error);
    await interaction.update({
      content: '❌ متأسفانه در پردازش واریز شما خطایی رخ داد!',
      components: []
    });
    
    // Auto-disappear after 5 seconds and show economy menu
    setTimeout(async () => {
      try {
        await economyMenu(interaction, true);
      } catch (error) {
        console.error('Error refreshing menu after error message:', error);
      }
    }, 5000);
  }
}

// Handler for withdrawing money from bank
async function handleWithdraw(interaction: StringSelectMenuInteraction, amount: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.update({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        components: []
      });
      
      // Auto-disappear after 5 seconds and show economy menu
      setTimeout(async () => {
        try {
          const updatedUser = await storage.getUserByDiscordId(interaction.user.id);
          if (updatedUser) {
            await economyMenu(interaction, true);
          }
        } catch (error) {
          console.error('Error refreshing menu after error message:', error);
        }
      }, 5000);
      return;
    }
    
    if (user.bank < amount) {
      await interaction.update({
        content: `⚠️ موجودی بانکی شما کافی نیست. موجودی فعلی: ${user.bank} سکه`,
        components: []
      });
      
      // Auto-disappear after 5 seconds and show economy menu
      setTimeout(async () => {
        try {
          await economyMenu(interaction, true);
        } catch (error) {
          console.error('Error refreshing menu after error message:', error);
        }
      }, 5000);
      return;
    }
    
    await storage.transferToWallet(user.id, amount);
    
    // Show success message with auto-disappear functionality
    await interaction.update({
      content: `✅ مبلغ ${amount} سکه با موفقیت از حساب بانکی شما برداشت شد.`,
      components: []
    });
    
    // Auto-disappear after 5 seconds and refresh economy menu
    setTimeout(async () => {
      try {
        await economyMenu(interaction, true);
      } catch (error) {
        console.error('Error refreshing economy menu after withdraw:', error);
      }
    }, 5000);
  } catch (error) {
    console.error('Error in withdraw handler:', error);
    await interaction.update({
      content: '❌ متأسفانه در پردازش برداشت شما خطایی رخ داد!',
      components: []
    });
    
    // Auto-disappear after 5 seconds and show economy menu
    setTimeout(async () => {
      try {
        await economyMenu(interaction, true);
      } catch (error) {
        console.error('Error refreshing menu after error message:', error);
      }
    }, 5000);
  }
}
