import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { storage } from '../../storage';
import { mainMenu } from '../components/mainMenu';
import { economyMenu } from '../components/economyMenu';
import { gamesMenu } from '../components/gamesMenu';
import { shopMenu } from '../components/shopMenu';
import { inventoryMenu } from '../components/inventoryMenu';
import { questsMenu } from '../components/questsMenu';
import { clansMenu } from '../components/clansMenu';
import { profileMenu } from '../components/profileMenu';
import { wheelOfFortuneMenu, spinWheel } from '../components/wheelOfFortuneMenu';
import { robberyMenu } from '../components/robberyMenu';
import { adminMenu } from '../components/adminMenu';
import { investmentMenu, processInvestment } from '../components/investmentMenu';
import { stocksMenu, processBuyStock, processSellStock } from '../components/stocksMenu';
import { lotteryMenu, processBuyLotteryTicket } from '../components/lotteryMenu';
import { giveawayBridgeMenu, buyGiveawayTickets, checkGiveawayBalance } from '../components/giveawayBridge';
import { handleCoinFlip } from '../games/coinFlip';
import { handleRockPaperScissors } from '../games/rockPaperScissors';
import { handleNumberGuess } from '../games/numberGuess';
import { getLogger, LogType } from '../utils/logger';
import { botConfig } from '../utils/config';

// Button handler function
export async function handleButtonInteraction(interaction: ButtonInteraction) {
  // Get the custom ID of the button
  const customId = interaction.customId;

  // Standard format for button IDs: action:param1:param2
  const [action, ...params] = customId.split(':');

  try {
    // Handle navigation buttons
    if (action === 'menu') {
      await mainMenu(interaction);
      return;
    }
    
    if (action === 'other_options') {
      await mainMenu(interaction, true);
      return;
    }

    if (action === 'economy') {
      await economyMenu(interaction);
      return;
    }

    if (action === 'games') {
      await gamesMenu(interaction);
      return;
    }

    if (action === 'shop') {
      await shopMenu(interaction);
      return;
    }

    if (action === 'inventory') {
      await inventoryMenu(interaction);
      return;
    }

    if (action === 'quests') {
      await questsMenu(interaction);
      return;
    }

    if (action === 'clans') {
      await clansMenu(interaction);
      return;
    }

    if (action === 'profile') {
      await profileMenu(interaction);
      return;
    }
    
    if (action === 'wheel') {
      await wheelOfFortuneMenu(interaction);
      return;
    }
    
    if (action === 'wheel_spin') {
      await spinWheel(interaction);
      return;
    }
    
    if (action === 'robbery') {
      await robberyMenu(interaction);
      return;
    }

    // Handle game buttons
    if (action === 'game') {
      const gameType = params[0];

      if (gameType === 'coinflip') {
        if (params[1] === 'start') {
          await handleCoinFlip(interaction, 'start');
        } else if (params[1] === 'heads') {
          await handleCoinFlip(interaction, 'heads');
        } else if (params[1] === 'tails') {
          await handleCoinFlip(interaction, 'tails');
        }
        return;
      }

      if (gameType === 'rps') {
        if (params[1] === 'start') {
          await handleRockPaperScissors(interaction, 'start');
        } else if (params[1] === 'rock') {
          await handleRockPaperScissors(interaction, 'rock');
        } else if (params[1] === 'paper') {
          await handleRockPaperScissors(interaction, 'paper');
        } else if (params[1] === 'scissors') {
          await handleRockPaperScissors(interaction, 'scissors');
        }
        return;
      }

      if (gameType === 'numberguess') {
        if (params[1] === 'start') {
          await handleNumberGuess(interaction, 'start');
        } else if (params[1] === 'guess') {
          const guess = parseInt(params[2]);
          await handleNumberGuess(interaction, 'guess', guess);
        }
        return;
      }
    }

    // Handle economy actions
    if (action === 'daily') {
      await handleDailyReward(interaction);
      return;
    }

    if (action === 'deposit') {
      const amount = parseInt(params[0]);
      await handleDeposit(interaction, amount);
      return;
    }

    if (action === 'withdraw') {
      const amount = parseInt(params[0]);
      await handleWithdraw(interaction, amount);
      return;
    }

    // Handle shop actions
    if (action === 'buy') {
      const itemId = parseInt(params[0]);
      await handleBuyItem(interaction, itemId);
      return;
    }

    // Handle inventory actions
    if (action === 'use') {
      const itemId = parseInt(params[0]);
      await handleUseItem(interaction, itemId);
      return;
    }

    if (action === 'sell') {
      const itemId = parseInt(params[0]);
      await handleSellItem(interaction, itemId);
      return;
    }

    // Handle quest actions
    if (action === 'claim') {
      const questId = parseInt(params[0]);
      await handleClaimQuest(interaction, questId);
      return;
    }
    
    // Handle investment menu
    if (action === 'investment_menu') {
      await investmentMenu(interaction);
      return;
    }
    
    // Handle investment actions
    if (action === 'invest_low' || action === 'invest_medium' || action === 'invest_high') {
      await investmentMenu(interaction);
      return;
    }
    
    // Handle bank menu
    if (action === 'bank_menu') {
      await economyMenu(interaction);
      return;
    }
    
    // Handle exchange actions
    if (action === 'exchange_10') {
      await handleExchange(interaction, 10);
      return;
    }
    
    if (action === 'exchange_50') {
      await handleExchange(interaction, 50);
      return;
    }
    
    // Handle stocks menu
    if (action === 'stocks') {
      const subMenu = params[0] || 'main';
      await stocksMenu(interaction, subMenu);
      return;
    }
    
    // Handle stocks menu actions
    if (action === 'stocks_market') {
      await stocksMenu(interaction, 'market');
      return;
    }
    
    if (action === 'stocks_portfolio') {
      await stocksMenu(interaction, 'portfolio');
      return;
    }
    
    if (action === 'stocks_info') {
      await stocksMenu(interaction, 'info');
      return;
    }
    
    // Handle lottery menu
    if (action === 'lottery') {
      const subMenu = params[0] || 'main';
      await lotteryMenu(interaction, subMenu);
      return;
    }
    
    // Handle lottery menu actions
    if (action === 'lottery_active') {
      await lotteryMenu(interaction, 'active');
      return;
    }
    
    if (action === 'lottery_history') {
      await lotteryMenu(interaction, 'history');
      return;
    }
    
    if (action === 'lottery_info') {
      await lotteryMenu(interaction, 'info');
      return;
    }
    
    // Handle giveaway bridge menu
    if (action === 'giveaway_bridge') {
      await giveawayBridgeMenu(interaction);
      return;
    }
    
    // Handle giveaway bridge actions
    if (action === 'giveaway_buy_tickets') {
      // Show modal for ticket purchase
      const modal = new ModalBuilder()
        .setCustomId('buy_giveaway_tickets')
        .setTitle('خرید بلیط قرعه‌کشی');
      
      const ticketQuantityInput = new TextInputBuilder()
        .setCustomId('ticket_quantity')
        .setLabel('تعداد بلیط')
        .setPlaceholder('تعداد بلیط مورد نظر را وارد کنید')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(3);
      
      const row = new ActionRowBuilder<TextInputBuilder>().addComponents(ticketQuantityInput);
      modal.addComponents(row);
      
      await interaction.showModal(modal);
      return;
    }
    
    if (action === 'giveaway_check_balance') {
      await checkGiveawayBalance(interaction);
      return;
    }
    
    // Handle admin actions
    if (action === 'admin') {
      const category = params[0];
      if (category) {
        await adminMenu(interaction, category);
      } else {
        await adminMenu(interaction);
      }
      return;
    }
    
    // Handle log settings
    if (action.startsWith('admin_set_') && action.endsWith('_log')) {
      // Extract the log type from the button ID (e.g., admin_set_transaction_log -> transaction)
      const logType = action.replace('admin_set_', '').replace('_log', '') as LogType;
      await handleSetLogChannel(interaction, logType);
      return;
    }
    
    // Handle default log channel setting
    if (action === 'admin_set_default_log') {
      await handleSetDefaultLogChannel(interaction);
      return;
    }
    
    // Test logs
    if (action === 'admin_test_logs') {
      await handleTestLogs(interaction);
      return;
    }
    
    // Clan resource gathering
    if (action === 'clan_gather') {
      const resourceType = params[0]; // 'materials' or 'labor'
      await handleClanGatherResources(interaction, resourceType);
      return;
    }
    
    // Clan building upgrade
    if (action === 'clan_upgrade_building') {
      const buildingId = params[0]; // 'hq', 'bank', 'barracks', etc.
      await handleClanBuildingUpgrade(interaction, buildingId);
      return;
    }
    
    // Clan start project
    if (action === 'clan_start_project') {
      const projectId = params[0]; // 'training_grounds', 'resource_center', etc.
      await handleClanStartProject(interaction, projectId);
      return;
    }
    
    // Clan contribute to project
    if (action === 'clan_contribute') {
      const projectId = params[0];
      const resourceType = params[1]; // 'coins', 'materials', 'labor'
      await handleClanContributeToProject(interaction, projectId, resourceType);
      return;
    }

    // If no handler matched, reply with an error
    await interaction.reply({
      content: 'Sorry, I could not process that button. Please try again.',
      ephemeral: true
    });

  } catch (error) {
    console.error('Error handling button interaction:', error);
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
      console.error('Error replying to button interaction:', replyError);
    }
  }
}

// Handler for daily reward
async function handleDailyReward(interaction: ButtonInteraction) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    // Check if daily reward already claimed
    const now = new Date();
    const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
    
    if (lastDaily && now.getTime() - lastDaily.getTime() < 24 * 60 * 60 * 1000) {
      const nextReset = new Date(lastDaily.getTime() + 24 * 60 * 60 * 1000);
      const hours = Math.floor((nextReset.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextReset.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      await interaction.reply({
        content: `You already claimed your daily reward! Next reward available in ${hours}h ${minutes}m.`,
        ephemeral: true
      });
      return;
    }
    
    // Check streak
    let streak = 0;
    if (lastDaily && now.getTime() - lastDaily.getTime() < 48 * 60 * 60 * 1000) {
      streak = user.dailyStreak + 1;
    } else {
      streak = 1;
    }
    
    // Calculate reward
    let reward = 50;
    if (streak >= 7) {
      reward += 200; // Bonus for 7-day streak
    }
    
    // Apply reward
    await storage.addToWallet(user.id, reward);
    await storage.updateUser(user.id, { lastDaily: now, dailyStreak: streak });
    
    let message = `You claimed your daily reward of ${reward} Ccoin!`;
    if (streak >= 7) {
      message += ` (Includes 7-day streak bonus of 200 Ccoin!)`;
    } else if (streak > 1) {
      message += ` Your current streak: ${streak} days.`;
    }
    
    await interaction.reply({
      content: message,
      ephemeral: true
    });
    
    // After a short delay, refresh the economy menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await economyMenu(interaction, true);
      }
    }, 1500);
  } catch (error) {
    console.error('Error in daily reward handler:', error);
    await interaction.reply({
      content: 'Sorry, there was an error claiming your daily reward!',
      ephemeral: true
    });
  }
}

// Handler for depositing money to bank
async function handleDeposit(interaction: ButtonInteraction, amount: number) {
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
      content: `Successfully deposited ${depositAmount} Ccoin to your bank. (Fee: ${fee} Ccoin)`,
      ephemeral: true
    });
    
    // After a short delay, refresh the economy menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await economyMenu(interaction, true);
      }
    }, 1500);
  } catch (error) {
    console.error('Error in deposit handler:', error);
    await interaction.reply({
      content: 'Sorry, there was an error processing your deposit!',
      ephemeral: true
    });
  }
}

// Handler for withdrawing money from bank
async function handleWithdraw(interaction: ButtonInteraction, amount: number) {
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
      content: `Successfully withdrew ${amount} Ccoin from your bank.`,
      ephemeral: true
    });
    
    // After a short delay, refresh the economy menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await economyMenu(interaction, true);
      }
    }, 1500);
  } catch (error) {
    console.error('Error in withdraw handler:', error);
    await interaction.reply({
      content: 'Sorry, there was an error processing your withdrawal!',
      ephemeral: true
    });
  }
}

// Handler for buying items
async function handleBuyItem(interaction: ButtonInteraction, itemId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    const item = await storage.getItem(itemId);
    
    if (!item) {
      await interaction.reply({
        content: 'This item does not exist.',
        ephemeral: true
      });
      return;
    }
    
    // Check if user has enough currency
    if (item.price && user.wallet < item.price) {
      await interaction.reply({
        content: `You don't have enough Ccoin. This item costs ${item.price} Ccoin.`,
        ephemeral: true
      });
      return;
    }
    
    if (item.crystalPrice && user.crystals < item.crystalPrice) {
      await interaction.reply({
        content: `You don't have enough crystals. This item costs ${item.crystalPrice} crystals.`,
        ephemeral: true
      });
      return;
    }
    
    // Buy the item
    const success = await storage.buyItem(user.id, itemId);
    
    if (success) {
      await interaction.reply({
        content: `You successfully purchased ${item.emoji} ${item.name}!`,
        ephemeral: true
      });
      
      // After a short delay, refresh the shop menu
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await shopMenu(interaction, true);
        }
      }, 1500);
    } else {
      await interaction.reply({
        content: 'Sorry, there was an error processing your purchase.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in buy item handler:', error);
    await interaction.reply({
      content: 'Sorry, there was an error processing your purchase!',
      ephemeral: true
    });
  }
}

// Handler for using items
async function handleUseItem(interaction: ButtonInteraction, itemId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    const item = await storage.getItem(itemId);
    
    if (!item) {
      await interaction.reply({
        content: 'This item does not exist.',
        ephemeral: true
      });
      return;
    }
    
    // Use the item
    const success = await storage.useItem(user.id, itemId);
    
    if (success) {
      let message = `You used ${item.emoji} ${item.name}!`;
      
      if (item.type === 'role') {
        // Calculate expiration time
        const expires = new Date();
        expires.setHours(expires.getHours() + (item.duration || 24));
        const expirationDate = expires.toLocaleString();
        
        message += ` It will be active until ${expirationDate}.`;
      }
      
      await interaction.reply({
        content: message,
        ephemeral: true
      });
      
      // After a short delay, refresh the inventory menu
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await inventoryMenu(interaction, true);
        }
      }, 1500);
    } else {
      await interaction.reply({
        content: `You don't have ${item.emoji} ${item.name} in your inventory.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in use item handler:', error);
    await interaction.reply({
      content: 'Sorry, there was an error using that item!',
      ephemeral: true
    });
  }
}

// Handler for selling items
async function handleSellItem(interaction: ButtonInteraction, itemId: number) {
  // TODO: Implement sell functionality
  await interaction.reply({
    content: 'Selling items will be available in a future update!',
    ephemeral: true
  });
}

// Handler for exchanging Ccoin to crystals
async function handleExchange(interaction: ButtonInteraction, crystalAmount: number) {
  try {
    // Get user data
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // Calculate Ccoin cost with 5% fee
    const ccoinPerCrystal = 100; // 100 Ccoin = 1 Crystal
    const baseCost = crystalAmount * ccoinPerCrystal;
    const fee = Math.ceil(baseCost * 0.05); // 5% fee
    const totalCost = baseCost + fee;
    
    // Check if user has enough Ccoin
    if (user.wallet < totalCost) {
      await interaction.reply({
        content: `❌ موجودی کیف پول شما کافی نیست! برای دریافت ${crystalAmount} کریستال به ${totalCost} سکه نیاز دارید (شامل 5% کارمزد).`,
        ephemeral: true
      });
      return;
    }
    
    // Deduct Ccoin from wallet
    user.wallet -= totalCost;
    
    // Add crystals
    user.crystals += crystalAmount;
    
    // Update user data
    await storage.updateUser(user.id, {
      wallet: user.wallet,
      crystals: user.crystals
    });
    
    // Log the transaction
    const logger = getLogger(interaction.client);
    logger.logTransaction(
      interaction.user.id,
      interaction.user.username,
      'exchange_crystal',
      -totalCost,
      `سکه به کریستال تبدیل کرد`,
      [
        { name: '💎 کریستال دریافتی', value: `${crystalAmount}`, inline: true },
        { name: '💰 سکه پرداختی', value: `${baseCost}`, inline: true },
        { name: '💸 کارمزد', value: `${fee}`, inline: true }
      ]
    );
    
    // Reply with success message
    await interaction.reply({
      content: `✅ تبدیل سکه به کریستال با موفقیت انجام شد!\n\n💰 سکه پرداخت شده: ${totalCost} (شامل ${fee} کارمزد)\n💎 کریستال دریافتی: ${crystalAmount}\n\nاکنون شما ${user.crystals} کریستال دارید!`,
      ephemeral: true
    });
    
    // Refresh economy menu after 2 seconds
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await economyMenu(interaction, true);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error in exchange handler:', error);
    await interaction.reply({
      content: '❌ متأسفانه در فرآیند تبدیل سکه به کریستال خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for setting log channels
export async function handleSetLogChannel(interaction: ButtonInteraction, logType: LogType) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for channel ID input
    const modal = new ModalBuilder()
      .setCustomId(`set_log_channel_${logType}`)
      .setTitle(`تنظیم کانال لاگ ${logType}`);
    
    // Add components to modal
    const channelIdInput = new TextInputBuilder()
      .setCustomId('channelId')
      .setLabel('آی‌دی کانال را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    // Add action row and components to modal
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(channelIdInput);
    modal.addComponents(firstRow);
    
    // Show the modal
    await interaction.showModal(modal);
  } catch (error) {
    console.error(`Error in set log channel for ${logType}:`, error);
    await interaction.reply({
      content: 'متاسفانه در تنظیم کانال لاگ خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for setting default log channel
export async function handleSetDefaultLogChannel(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for channel ID input
    const modal = new ModalBuilder()
      .setCustomId('set_default_log_channel')
      .setTitle('تنظیم کانال پیش‌فرض لاگ‌ها');
    
    // Add components to modal
    const channelIdInput = new TextInputBuilder()
      .setCustomId('channelId')
      .setLabel('آی‌دی کانال را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    // Add action row and components to modal
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(channelIdInput);
    modal.addComponents(firstRow);
    
    // Show the modal
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error in set default log channel:', error);
    await interaction.reply({
      content: 'متاسفانه در تنظیم کانال پیش‌فرض لاگ خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for testing logs
async function handleTestLogs(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Get logger instance
    const logger = getLogger(interaction.client);
    
    // Test all configured log types
    const config = botConfig.getConfig();
    let successCount = 0;
    let failures: string[] = [];
    
    // Test transaction log
    if (config.logChannels[LogType.TRANSACTION]) {
      try {
        await logger.logTransaction(
          interaction.user.id,
          interaction.user.username,
          'تست',
          100,
          'یک تراکنش تستی انجام داد'
        );
        successCount++;
      } catch (e) {
        failures.push('تراکنش');
      }
    }
    
    // Test game log
    if (config.logChannels[LogType.GAME]) {
      try {
        await logger.logGame(
          interaction.user.id,
          interaction.user.username,
          'شیر یا خط',
          'برد',
          50,
          100
        );
        successCount++;
      } catch (e) {
        failures.push('بازی');
      }
    }
    
    // Test user log
    if (config.logChannels[LogType.USER]) {
      try {
        await logger.logUserActivity(
          interaction.user.id,
          interaction.user.username,
          'تست',
          'یک فعالیت تستی انجام داد'
        );
        successCount++;
      } catch (e) {
        failures.push('کاربر');
      }
    }
    
    // Test admin log
    if (config.logChannels[LogType.ADMIN]) {
      try {
        await logger.logAdminAction(
          interaction.user.id,
          interaction.user.username,
          'تست',
          interaction.user.id,
          interaction.user.username,
          'یک عملیات تستی انجام داد'
        );
        successCount++;
      } catch (e) {
        failures.push('ادمین');
      }
    }
    
    // Test security log
    if (config.logChannels[LogType.SECURITY]) {
      try {
        await logger.logSecurity(
          interaction.user.id,
          interaction.user.username,
          'تست',
          'کم',
          'یک هشدار امنیتی تستی'
        );
        successCount++;
      } catch (e) {
        failures.push('امنیتی');
      }
    }
    
    // Test error log
    if (config.logChannels[LogType.ERROR]) {
      try {
        await logger.logError(
          'این یک خطای تستی است',
          'سیستم تست',
          interaction.user.id,
          interaction.user.username
        );
        successCount++;
      } catch (e) {
        failures.push('خطا');
      }
    }
    
    // Test system log
    if (config.logChannels[LogType.SYSTEM]) {
      try {
        await logger.logSystem(
          'تست',
          'یک رویداد سیستمی تستی',
          [{ name: 'آزمایش کننده', value: interaction.user.username, inline: true }]
        );
        successCount++;
      } catch (e) {
        failures.push('سیستم');
      }
    }
    
    // Report results
    let responseMessage = `تست لاگ‌ها انجام شد. ${successCount} لاگ با موفقیت ارسال شد.`;
    if (failures.length > 0) {
      responseMessage += `\nلاگ‌های با خطا: ${failures.join('، ')}`;
    }
    if (successCount === 0) {
      responseMessage = 'هیچ کانال لاگی تنظیم نشده است یا با خطا مواجه شد.';
    }
    
    await interaction.reply({
      content: responseMessage,
      ephemeral: true
    });
    
    // Return to logs settings menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await adminMenu(interaction, 'logs_settings');
      }
    }, 2000);
  } catch (error) {
    console.error('Error in test logs:', error);
    await interaction.reply({
      content: 'متاسفانه در تست لاگ‌ها خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleClaimQuest(interaction: ButtonInteraction, questId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'You need to create an account first. Use the /menu command.',
        ephemeral: true
      });
      return;
    }
    
    // Get user quests
    const userQuests = await storage.getUserQuests(user.id);
    const userQuest = userQuests.find(q => q.quest.id === questId);
    
    if (!userQuest) {
      await interaction.reply({
        content: 'This quest does not exist or is not available to you.',
        ephemeral: true
      });
      return;
    }
    
    // Check if quest is completed
    if (!userQuest.userQuest.completed && userQuest.userQuest.progress >= userQuest.quest.targetAmount) {
      // Mark as completed and give reward
      await storage.updateQuestProgress(user.id, questId, userQuest.userQuest.progress);
      
      await interaction.reply({
        content: `Quest completed! You received ${userQuest.quest.reward} Ccoin as a reward.`,
        ephemeral: true
      });
      
      // After a short delay, refresh the quests menu
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await questsMenu(interaction, true);
        }
      }, 1500);
    } else if (userQuest.userQuest.completed) {
      await interaction.reply({
        content: 'You have already claimed the reward for this quest.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `This quest is not completed yet. Progress: ${userQuest.userQuest.progress}/${userQuest.quest.targetAmount}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in claim quest handler:', error);
    await interaction.reply({
      content: 'Sorry, there was an error claiming your quest reward!',
      ephemeral: true
    });
  }
}

// Handler for clan resource gathering
async function handleClanGatherResources(interaction: ButtonInteraction, resourceType: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما باید اول یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (!user.clanId) {
      await interaction.reply({
        content: 'شما عضو هیچ کلنی نیستید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      await interaction.reply({
        content: 'کلن شما دیگر وجود ندارد.',
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
    const lastCollected = new Date(resources.lastCollected);
    const hoursSinceLastCollection = Math.floor((now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60));
    const cooldownHours = 6;
    
    if (hoursSinceLastCollection < cooldownHours) {
      const hoursRemaining = cooldownHours - hoursSinceLastCollection;
      await interaction.reply({
        content: `شما باید ${hoursRemaining} ساعت دیگر صبر کنید تا بتوانید مجدداً منابع جمع‌آوری کنید.`,
        ephemeral: true
      });
      return;
    }
    
    // Calculate resource amount (can be affected by clan buildings in the future)
    let amount = 10;
    
    // Check if clan has production buildings that increase resource gathering
    const buildings = clan.buildings || [];
    const marketBuilding = buildings.find(b => b.type === 'market');
    
    // Market gives bonus to resource production
    if (marketBuilding && marketBuilding.level > 0) {
      amount += marketBuilding.level * 2; // +2 resources per market level
    }
    
    // Update user's resources based on the type
    if (resourceType === 'materials') {
      resources.materials += amount;
      await interaction.reply({
        content: `شما ${amount} واحد مواد جمع‌آوری کردید! مواد فعلی: ${resources.materials}`,
        ephemeral: true
      });
    } else if (resourceType === 'labor') {
      resources.labor += amount;
      await interaction.reply({
        content: `شما ${amount} واحد نیروی کار جمع‌آوری کردید! نیروی کار فعلی: ${resources.labor}`,
        ephemeral: true
      });
    }
    
    // Update last collection time
    resources.lastCollected = now.toISOString();
    
    // Update user's resources in database
    await storage.updateUser(user.id, { clanResources: resources });
    
    // After a short delay, refresh the clan resources menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await clansMenu(interaction, true);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error in clan resource gathering handler:', error);
    await interaction.reply({
      content: 'متأسفانه خطایی در جمع‌آوری منابع رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for clan building upgrade
async function handleClanBuildingUpgrade(interaction: ButtonInteraction, buildingId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما باید اول یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (!user.clanId) {
      await interaction.reply({
        content: 'شما عضو هیچ کلنی نیستید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      await interaction.reply({
        content: 'کلن شما دیگر وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Check if user is clan leader or officer (only they can upgrade buildings)
    if (user.discordId !== clan.ownerId) {
      await interaction.reply({
        content: 'فقط رهبر کلن می‌تواند ساختمان‌ها را ارتقا دهد.',
        ephemeral: true
      });
      return;
    }
    
    // Default building types and their upgrade prices
    const defaultBuildings = [
      { id: 'hq', type: 'headquarters', name: 'ساختمان مرکزی', level: 1, upgradePrice: 5000 },
      { id: 'bank', type: 'bank', name: 'بانک', level: 0, upgradePrice: 2000 },
      { id: 'barracks', type: 'barracks', name: 'سربازخانه', level: 0, upgradePrice: 3000 },
      { id: 'market', type: 'market', name: 'بازار', level: 0, upgradePrice: 2500 }
    ];
    
    // Find the building to upgrade
    const buildings = clan.buildings || [];
    const defaultBuilding = defaultBuildings.find(b => b.id === buildingId);
    
    if (!defaultBuilding) {
      await interaction.reply({
        content: 'این ساختمان وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Find existing building or use default
    const existingBuilding = buildings.find(b => b.type === defaultBuilding.type);
    const buildingLevel = existingBuilding ? existingBuilding.level : defaultBuilding.level;
    const buildingName = existingBuilding ? existingBuilding.name : defaultBuilding.name;
    const upgradePrice = defaultBuilding.upgradePrice;
    
    // Check if clan has enough money
    if (clan.bank < upgradePrice) {
      await interaction.reply({
        content: `موجودی بانک کلن کافی نیست. شما نیاز به ${upgradePrice} Ccoin برای ${buildingLevel > 0 ? 'ارتقای' : 'ساخت'} ${buildingName} دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // Create or update building
    let updatedBuildings = [...buildings];
    
    if (existingBuilding) {
      // Update existing building
      updatedBuildings = buildings.map(b => {
        if (b.type === defaultBuilding.type) {
          return {
            ...b,
            level: b.level + 1,
            upgradeProgress: 0,
            upgradeTarget: 100
          };
        }
        return b;
      });
    } else {
      // Add new building
      updatedBuildings.push({
        id: defaultBuilding.id,
        type: defaultBuilding.type as 'headquarters' | 'bank' | 'training_camp' | 'market' | 'laboratory' | 'barracks' | 'wall' | 'tower',
        name: defaultBuilding.name,
        level: 1,
        upgradeProgress: 0,
        upgradeTarget: 100,
        effects: {}
      });
    }
    
    // Update clan bank balance and buildings
    const newBank = clan.bank - upgradePrice;
    await storage.updateClan(clan.id, {
      bank: newBank,
      buildings: updatedBuildings
    });
    
    const newLevel = existingBuilding ? existingBuilding.level + 1 : 1;
    
    await interaction.reply({
      content: `${buildingLevel > 0 ? 'ارتقای' : 'ساخت'} ${buildingName} با موفقیت انجام شد! سطح فعلی: ${newLevel}`,
      ephemeral: true
    });
    
    // After a short delay, refresh the clan buildings menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await clansMenu(interaction, true);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error in clan building upgrade handler:', error);
    await interaction.reply({
      content: 'متأسفانه خطایی در ارتقای ساختمان رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for starting clan projects
// Handler for contributing to clan projects
async function handleClanContributeToProject(interaction: ButtonInteraction, projectId: string, resourceType: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما باید اول یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (!user.clanId) {
      await interaction.reply({
        content: 'شما عضو هیچ کلنی نیستید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      await interaction.reply({
        content: 'کلن شما دیگر وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Get active projects
    const activeProjects = clan.activeProjects || [];
    const project = activeProjects.find(p => p.id === projectId);
    
    if (!project) {
      await interaction.reply({
        content: 'این پروژه وجود ندارد یا پایان یافته است.',
        ephemeral: true
      });
      return;
    }
    
    // Initialize default contribution amount
    let contributionAmount = 10;
    let remainingNeeded = 0;
    
    // Check contribution type and amount
    if (resourceType === 'coins') {
      // For coins, we contribute a larger amount
      contributionAmount = 500;
      remainingNeeded = project.resourcesRequired.coins - project.resourcesContributed.coins;
      
      // Check if user has enough coins
      if (user.wallet < contributionAmount) {
        await interaction.reply({
          content: `شما به اندازه کافی سکه در کیف پول خود ندارید. شما نیاز به حداقل ${contributionAmount} Ccoin دارید.`,
          ephemeral: true
        });
        return;
      }
      
      // Adjust contribution to not exceed what's needed
      if (remainingNeeded < contributionAmount) {
        contributionAmount = remainingNeeded;
      }
      
      // Don't allow contribution if nothing more is needed
      if (remainingNeeded <= 0) {
        await interaction.reply({
          content: 'این پروژه دیگر به سکه نیاز ندارد!',
          ephemeral: true
        });
        return;
      }
      
      // Update user's wallet
      await storage.addToWallet(user.id, -contributionAmount);
      
      // Update project's contribution
      project.resourcesContributed.coins += contributionAmount;
      
    } else if (resourceType === 'materials') {
      // Get user's resources
      const resources = (user as any).clanResources || { materials: 0, labor: 0 };
      remainingNeeded = project.resourcesRequired.materials - project.resourcesContributed.materials;
      
      // Check if user has enough materials
      if (resources.materials < contributionAmount) {
        await interaction.reply({
          content: `شما به اندازه کافی مواد ندارید. شما نیاز به حداقل ${contributionAmount} واحد مواد دارید.`,
          ephemeral: true
        });
        return;
      }
      
      // Adjust contribution to not exceed what's needed
      if (remainingNeeded < contributionAmount) {
        contributionAmount = remainingNeeded;
      }
      
      // Don't allow contribution if nothing more is needed
      if (remainingNeeded <= 0) {
        await interaction.reply({
          content: 'این پروژه دیگر به مواد نیاز ندارد!',
          ephemeral: true
        });
        return;
      }
      
      // Update user's resources
      resources.materials -= contributionAmount;
      await storage.updateUser(user.id, { clanResources: resources });
      
      // Update project's contribution
      project.resourcesContributed.materials += contributionAmount;
      
    } else if (resourceType === 'labor') {
      // Get user's resources
      const resources = (user as any).clanResources || { materials: 0, labor: 0 };
      remainingNeeded = project.resourcesRequired.labor - project.resourcesContributed.labor;
      
      // Check if user has enough labor
      if (resources.labor < contributionAmount) {
        await interaction.reply({
          content: `شما به اندازه کافی نیروی کار ندارید. شما نیاز به حداقل ${contributionAmount} واحد نیروی کار دارید.`,
          ephemeral: true
        });
        return;
      }
      
      // Adjust contribution to not exceed what's needed
      if (remainingNeeded < contributionAmount) {
        contributionAmount = remainingNeeded;
      }
      
      // Don't allow contribution if nothing more is needed
      if (remainingNeeded <= 0) {
        await interaction.reply({
          content: 'این پروژه دیگر به نیروی کار نیاز ندارد!',
          ephemeral: true
        });
        return;
      }
      
      // Update user's resources
      resources.labor -= contributionAmount;
      await storage.updateUser(user.id, { clanResources: resources });
      
      // Update project's contribution
      project.resourcesContributed.labor += contributionAmount;
    }
    
    // Calculate new progress
    const totalRequired = 
      project.resourcesRequired.coins + 
      project.resourcesRequired.materials + 
      project.resourcesRequired.labor;
      
    const totalContributed = 
      project.resourcesContributed.coins + 
      project.resourcesContributed.materials + 
      project.resourcesContributed.labor;
      
    project.progress = Math.min(100, (totalContributed / totalRequired) * 100);
    
    // Check if project is completed
    if (project.progress >= 100) {
      project.status = 'completed';
      project.completionTime = new Date().toISOString();
      
      // Update clan with completed project rewards (will be implemented in a separate function)
      // For now, just update the project status
    }
    
    // Update the clan's active projects
    const updatedProjects = activeProjects.map(p => 
      p.id === projectId ? project : p
    );
    
    // Update clan with the new projects
    await storage.updateClan(clan.id, {
      activeProjects: updatedProjects
    } as Partial<typeof clan>);
    
    // Send response to user
    await interaction.reply({
      content: `شما با موفقیت ${contributionAmount} واحد ${
        resourceType === 'coins' ? 'سکه' : 
        resourceType === 'materials' ? 'مواد' : 'نیروی کار'
      } به پروژه "${project.name}" اضافه کردید! پیشرفت فعلی: ${project.progress.toFixed(1)}%`,
      ephemeral: true
    });
    
    // After a short delay, refresh the clan projects menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await clansMenu(interaction, true);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error in clan contribute to project handler:', error);
    await interaction.reply({
      content: 'متأسفانه خطایی در کمک به پروژه رخ داد!',
      ephemeral: true
    });
  }
}

async function handleClanStartProject(interaction: ButtonInteraction, projectId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما باید اول یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (!user.clanId) {
      await interaction.reply({
        content: 'شما عضو هیچ کلنی نیستید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      await interaction.reply({
        content: 'کلن شما دیگر وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Check if user is clan leader (only they can start projects)
    if (user.discordId !== clan.ownerId) {
      await interaction.reply({
        content: 'فقط رهبر کلن می‌تواند پروژه‌های جدید را آغاز کند.',
        ephemeral: true
      });
      return;
    }
    
    // Get active projects
    const activeProjects = clan.activeProjects || [];
    
    // Check maximum simultaneous projects (2)
    if (activeProjects.length >= 2) {
      await interaction.reply({
        content: 'کلن شما در حال حاضر دو پروژه فعال دارد. ابتدا باید یکی از آن‌ها را تکمیل کنید.',
        ephemeral: true
      });
      return;
    }
    
    // Available projects
    const availableProjects = [
      {
        id: 'training_grounds',
        name: 'زمین تمرین',
        description: 'افزایش ظرفیت اعضای کلن و افزایش قدرت در جنگ‌های کلن',
        cost: 5000,
        resourcesRequired: {
          coins: 5000,
          materials: 50,
          labor: 30
        },
        rewards: {
          experience: 500,
          perkPoints: 1
        }
      },
      {
        id: 'resource_center',
        name: 'مرکز منابع',
        description: 'افزایش تولید منابع و کاهش زمان جمع‌آوری',
        cost: 3000,
        resourcesRequired: {
          coins: 3000,
          materials: 30,
          labor: 20
        },
        rewards: {
          experience: 300,
          perkPoints: 1
        }
      }
    ];
    
    // Find the project to start
    const projectConfig = availableProjects.find(p => p.id === projectId);
    
    if (!projectConfig) {
      await interaction.reply({
        content: 'این پروژه وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Check if clan has enough coins
    if (clan.bank < projectConfig.cost) {
      await interaction.reply({
        content: `موجودی بانک کلن کافی نیست. شما نیاز به ${projectConfig.cost} Ccoin برای شروع این پروژه دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // Create new project
    const now = new Date();
    const deadlineDate = new Date(now);
    deadlineDate.setDate(deadlineDate.getDate() + 7); // 7 days deadline
    
    const newProject = {
      id: projectConfig.id,
      name: projectConfig.name,
      description: projectConfig.description,
      resourcesRequired: projectConfig.resourcesRequired,
      resourcesContributed: {
        coins: 0,
        materials: 0,
        labor: 0
      },
      progress: 0,
      rewards: projectConfig.rewards,
      deadline: deadlineDate.toISOString(),
      status: 'active' as const
    };
    
    // Withdraw project cost from clan bank
    const newBank = clan.bank - projectConfig.cost;
    
    // Initialize resource contribution with bank amount
    newProject.resourcesContributed.coins = projectConfig.cost;
    
    // Calculate initial progress
    const totalResources = 
      projectConfig.resourcesRequired.coins + 
      projectConfig.resourcesRequired.materials + 
      projectConfig.resourcesRequired.labor;
      
    newProject.progress = (projectConfig.cost / totalResources) * 100;
    
    // Update clan with new project and bank balance
    const updatedProjects = [...activeProjects, newProject];
    await storage.updateClan(clan.id, {
      bank: newBank,
      activeProjects: updatedProjects
    } as Partial<typeof clan>);
    
    await interaction.reply({
      content: `پروژه "${projectConfig.name}" با موفقیت آغاز شد! هزینه اولیه ${projectConfig.cost} Ccoin از بانک کلن کسر شد.`,
      ephemeral: true
    });
    
    // After a short delay, refresh the clan projects menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await clansMenu(interaction, true);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error in clan start project handler:', error);
    await interaction.reply({
      content: 'متأسفانه خطایی در شروع پروژه رخ داد!',
      ephemeral: true
    });
  }
}
