import { ButtonInteraction } from 'discord.js';
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
import { handleCoinFlip } from '../games/coinFlip';
import { handleRockPaperScissors } from '../games/rockPaperScissors';
import { handleNumberGuess } from '../games/numberGuess';

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

// Handler for claiming quest rewards
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
