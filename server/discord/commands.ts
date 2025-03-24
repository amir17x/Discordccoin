import { SlashCommandBuilder, Collection, Client, PermissionFlagsBits } from 'discord.js';
import { storage } from '../storage';
import { mainMenu } from './components/mainMenu';
import { adminMenu } from './components/adminMenu';

// Command to display the main menu
const menu = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Open the gaming bot main menu'),
  
  async execute(interaction: any) {
    await mainMenu(interaction);
  }
};

// Command to show user balance
const balance = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your current balance'),
  
  async execute(interaction: any) {
    try {
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        // Create new user if not exists
        const newUser = await storage.createUser({
          discordId: interaction.user.id,
          username: interaction.user.username,
        });
        
        await interaction.reply({
          content: `Welcome! Your starting balance is ${newUser.wallet} Ccoin in wallet and ${newUser.bank} Ccoin in bank.`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `Your balance: ${user.wallet} Ccoin in wallet, ${user.bank} Ccoin in bank, and ${user.crystals} crystals 💎`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error in balance command:', error);
      await interaction.reply({
        content: 'Sorry, there was an error checking your balance!',
        ephemeral: true
      });
    }
  }
};

// Command to claim daily reward
const daily = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),
  
  async execute(interaction: any) {
    try {
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        // Create new user if not exists
        const newUser = await storage.createUser({
          discordId: interaction.user.id,
          username: interaction.user.username,
        });
        
        // Give daily reward
        await storage.addToWallet(newUser.id, 50);
        await storage.updateUser(newUser.id, { lastDaily: new Date(), dailyStreak: 1 });
        
        await interaction.reply({
          content: `Welcome! You claimed your first daily reward of 50 Ccoin!`,
          ephemeral: true
        });
      } else {
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
        
        // Apply bonuses from active items
        const inventory = user.inventory as Record<string, any>;
        let bonusMultiplier = 1.0;
        
        // Check for active items with dailyBonus effect
        for (const itemIdStr in inventory) {
          const inventoryItem = inventory[itemIdStr];
          if (inventoryItem.active && inventoryItem.expires) {
            const expires = new Date(inventoryItem.expires);
            if (expires > now) {
              const item = await storage.getItem(parseInt(itemIdStr));
              if (item && item.effects && typeof item.effects === 'object') {
                const effects = item.effects as Record<string, any>;
                if (effects.dailyBonus) {
                  bonusMultiplier += effects.dailyBonus / 100;
                }
              }
            }
          }
        }
        
        reward = Math.floor(reward * bonusMultiplier);
        
        // Apply reward
        await storage.addToWallet(user.id, reward);
        await storage.updateUser(user.id, { lastDaily: now, dailyStreak: streak });
        
        let message = `You claimed your daily reward of ${reward} Ccoin!`;
        if (bonusMultiplier > 1.0) {
          message += ` (Includes bonus from active items)`;
        }
        if (streak >= 7) {
          message += ` (Includes 7-day streak bonus of 200 Ccoin!)`;
        } else if (streak > 1) {
          message += ` Your current streak: ${streak} days.`;
        }
        
        await interaction.reply({
          content: message,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error in daily command:', error);
      await interaction.reply({
        content: 'Sorry, there was an error claiming your daily reward!',
        ephemeral: true
      });
    }
  }
};

// Command to show help
const help = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with bot commands'),
  
  async execute(interaction: any) {
    await interaction.reply({
      content: `
**Gaming Bot Commands**

**/menu** - Open the main menu with all bot features
**/balance** - Check your current balance
**/daily** - Claim your daily reward
**/help** - Show this help message
**/admin** - Admin control panel (for administrators only)

Most features are accessible through the menu system using buttons.
      `,
      ephemeral: true
    });
  }
};

// Command for admin panel
const admin = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Open admin control panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Requires administrator permission
  
  async execute(interaction: any) {
    // Check if user has permission
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از پنل ادمین را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    await adminMenu(interaction);
  }
};

// Export function to load commands
export async function loadCommands(client: Client) {
  // Add commands to the collection
  client.commands.set(menu.data.name, menu);
  client.commands.set(balance.data.name, balance);
  client.commands.set(daily.data.name, daily);
  client.commands.set(help.data.name, help);
  client.commands.set(admin.data.name, admin);
}

// Export the command data for deployment
export const commands = [
  menu.data.toJSON(),
  balance.data.toJSON(),
  daily.data.toJSON(),
  help.data.toJSON(),
  admin.data.toJSON()
];
