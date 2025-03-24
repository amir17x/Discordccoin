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
