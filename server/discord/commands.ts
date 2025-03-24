import { SlashCommandBuilder, Collection, Client, PermissionFlagsBits } from 'discord.js';
import { storage } from '../storage';
import { mainMenu } from './components/mainMenu';
import { adminMenu } from '../discord/components/adminMenu';

// Command to display the main menu
const menu = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('باز کردن منوی اصلی ربات بازی'),
  
  async execute(interaction: any) {
    try {
      // ارسال یک پاسخ تاخیری برای جلوگیری از تایم‌اوت
      await interaction.deferReply();
      
      // فراخوانی منوی اصلی
      await mainMenu(interaction);
    } catch (error) {
      console.error("Error in menu command:", error);
      // اطمینان از ارسال پاسخ حتی در صورت وقوع خطا
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "در حال بارگذاری منو...", ephemeral: true });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: "خطا در بارگذاری منو! لطفاً دوباره تلاش کنید." });
      }
    }
  }
};

// Command to show user balance
const balance = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('بررسی موجودی حساب شما'),
  
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
          content: `🎉 خوش آمدید! موجودی اولیه شما ${newUser.wallet} سکه در کیف پول و ${newUser.bank} سکه در بانک است.`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `💰 موجودی شما: ${user.wallet} سکه در کیف پول، ${user.bank} سکه در بانک، و ${user.crystals} کریستال 💎`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error in balance command:', error);
      await interaction.reply({
        content: '❌ متأسفانه در بررسی موجودی شما خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
};

// Command to claim daily reward
const daily = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('دریافت پاداش روزانه'),
  
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
          content: `🎉 خوش آمدید! شما اولین پاداش روزانه خود به مقدار 50 سکه را دریافت کردید!`,
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
            content: `⏳ شما قبلاً پاداش روزانه خود را دریافت کرده‌اید! پاداش بعدی در ${hours} ساعت و ${minutes} دقیقه دیگر قابل دریافت است.`,
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
        
        let message = `🎁 شما پاداش روزانه خود به مقدار ${reward} سکه را دریافت کردید!`;
        if (bonusMultiplier > 1.0) {
          message += ` (شامل امتیاز اضافی از آیتم‌های فعال)`;
        }
        if (streak >= 7) {
          message += ` (شامل پاداش ویژه 200 سکه‌ای برای 7 روز متوالی!)`;
        } else if (streak > 1) {
          message += ` روزهای متوالی فعالیت شما: ${streak} روز.`;
        }
        
        await interaction.reply({
          content: message,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error in daily command:', error);
      await interaction.reply({
        content: '❌ متأسفانه در دریافت پاداش روزانه شما خطایی رخ داد!',
        ephemeral: true
      });
    }
  }
};

// Command to show help
const help = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('نمایش راهنمای دستورات ربات'),
  
  async execute(interaction: any) {
    await interaction.reply({
      content: `
**🤖 دستورات ربات سی‌کوین**

**/menu** - باز کردن منوی اصلی با تمام امکانات ربات
**/balance** - بررسی موجودی حساب شما
**/daily** - دریافت پاداش روزانه
**/help** - نمایش این پیام راهنما
**/admin** - پنل مدیریت (فقط برای مدیران)

اکثر امکانات از طریق سیستم منو با استفاده از دکمه‌ها قابل دسترسی هستند.
      `,
      ephemeral: true
    });
  }
};

// Command for admin panel
const admin = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('باز کردن پنل مدیریت ادمین')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Requires administrator permission
  
  async execute(interaction: any) {
    try {
      // ارسال یک پاسخ تاخیری برای جلوگیری از تایم‌اوت
      await interaction.deferReply({ ephemeral: true });
      
      // Check if user has permission
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply({
          content: '⛔ شما دسترسی لازم برای استفاده از پنل ادمین را ندارید!'
        });
        return;
      }
      
      // فراخوانی منوی ادمین
      await adminMenu(interaction);
    } catch (error) {
      console.error("Error in admin command:", error);
      if (interaction.deferred) {
        await interaction.editReply({ content: "خطا در بارگذاری پنل ادمین! لطفاً دوباره تلاش کنید." });
      } else if (!interaction.replied) {
        await interaction.reply({ content: "خطا در بارگذاری پنل ادمین! لطفاً دوباره تلاش کنید.", ephemeral: true });
      }
    }
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
