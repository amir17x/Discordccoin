import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { deployCommands } from './deploy-commands';
import { loadCommands } from './commands';
import { handleButtonInteraction } from './handlers/buttonHandler';
import { handleSelectMenuInteraction } from './handlers/menuHandler';
import { handleModalSubmit } from './handlers/modalHandler';
import { log } from '../vite';
import { storage } from '../storage';
import { getLogger, LogType } from './utils/logger';
import { botConfig } from './utils/config';

/**
 * Helper function to create a button-like interaction from a modal interaction
 * This is needed because adminMenu and other components expect ButtonInteraction
 */
function createButtonLikeInteraction(interaction: any) {
  return {
    ...interaction,
    update: async (options: any) => {
      return await interaction.editReply(options);
    },
    // Add button component properties
    component: { type: 2 },
    componentType: 2,
  };
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize commands collection
client.commands = new Collection();

export async function initDiscordBot() {
  try {
    // Load commands
    await loadCommands(client);
    
    // Get token and client ID from config or environment variables
    const botSettings = botConfig.getConfig();
    const discordToken = process.env.DISCORD_TOKEN || botSettings.general.token;
    const discordClientId = process.env.DISCORD_CLIENT_ID || botSettings.general.clientId;
    
    if (discordToken && discordClientId) {
      try {
        await deployCommands();
      } catch (error) {
        log('Error deploying commands: ' + error, 'error');
        console.error('Failed to deploy commands:', error);
      }
    } else {
      log('Missing Discord token or client ID. Commands will not be deployed.', 'error');
    }

    // Ready event
    client.on(Events.ClientReady, () => {
      log(`Logged in as ${client.user?.tag}!`, 'discord');
      
      // Initialize Logger
      const logger = getLogger(client);
      
      // Set default log channel from config if exists
      const config = botConfig.getConfig();
      if (config.logChannels.default) {
        logger.setDefaultChannel(config.logChannels.default);
      }
      
      // Set specific log channels from config
      if (config.logChannels[LogType.TRANSACTION]) {
        logger.setChannels({
          [LogType.TRANSACTION]: config.logChannels[LogType.TRANSACTION]
        });
      }
      
      if (config.logChannels[LogType.GAME]) {
        logger.setChannels({
          [LogType.GAME]: config.logChannels[LogType.GAME]
        });
      }
      
      if (config.logChannels[LogType.USER]) {
        logger.setChannels({
          [LogType.USER]: config.logChannels[LogType.USER]
        });
      }
      
      if (config.logChannels[LogType.ADMIN]) {
        logger.setChannels({
          [LogType.ADMIN]: config.logChannels[LogType.ADMIN]
        });
      }
      
      if (config.logChannels[LogType.SECURITY]) {
        logger.setChannels({
          [LogType.SECURITY]: config.logChannels[LogType.SECURITY]
        });
      }
      
      if (config.logChannels[LogType.ERROR]) {
        logger.setChannels({
          [LogType.ERROR]: config.logChannels[LogType.ERROR]
        });
      }
      
      if (config.logChannels[LogType.SYSTEM]) {
        logger.setChannels({
          [LogType.SYSTEM]: config.logChannels[LogType.SYSTEM]
        });
      }
      
      // Log bot startup only if a system log channel or default channel is configured
      if (config.logChannels[LogType.SYSTEM] || config.logChannels.default) {
        logger.logSystem(
          'راه‌اندازی ربات',
          `ربات با موفقیت راه‌اندازی شد. نسخه: 1.0.0`,
          [{ name: '🤖 نام ربات', value: client.user?.tag || 'نامشخص', inline: true }]
        );
      }
    });

    // Command interaction
    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          const command = client.commands.get(interaction.commandName);
          if (!command) return;

          // Register user if not exists
          if (interaction.user && !interaction.user.bot) {
            const existingUser = await storage.getUserByDiscordId(interaction.user.id);
            if (!existingUser) {
              await storage.createUser({
                discordId: interaction.user.id,
                username: interaction.user.username,
              });
              log(`Created new user: ${interaction.user.username}`, 'discord');
            }
          }

          try {
            log(`Executing command: ${interaction.commandName}`, 'discord');
            
            // تنظیم مهلت زمانی برای پاسخگویی به دستور
            // اگر پس از 3 ثانیه پاسخی ارسال نشده باشد، یک پاسخ موقت ارسال می‌کنیم
            const replyTimeout = setTimeout(async () => {
              if (!interaction.replied && !interaction.deferred) {
                try {
                  await interaction.deferReply({ ephemeral: true });
                  log(`Deferred reply for command ${interaction.commandName} due to timeout`, 'discord');
                } catch (e) {
                  // اگر همزمان با این عملیات، دستور اصلی پاسخ داده باشد، ممکن است خطا رخ دهد که آن را نادیده می‌گیریم
                  log(`Failed to defer reply for command ${interaction.commandName}`, 'error');
                }
              }
            }, 3000);
            
            // اجرای دستور
            await command.execute(interaction);
            
            // پاسخ ارسال شد، پس مهلت زمانی را لغو می‌کنیم
            clearTimeout(replyTimeout);
            
            log(`Successfully executed command: ${interaction.commandName}`, 'discord');
          } catch (error: any) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            log(`Error executing command ${interaction.commandName}: ${error?.message || 'Unknown error'}`, 'error');
            
            try {
              if (interaction.replied) {
                await interaction.followUp({ content: 'خطایی در اجرای این دستور رخ داده است!', ephemeral: true });
              } else if (interaction.deferred) {
                await interaction.editReply({ content: 'خطایی در اجرای این دستور رخ داده است!' });
              } else {
                await interaction.reply({ content: 'خطایی در اجرای این دستور رخ داده است!', ephemeral: true });
              }
            } catch (followupError) {
              console.error(`Failed to send error message for ${interaction.commandName}:`, followupError);
            }
          }
        } else if (interaction.isButton()) {
          // Handle log detail buttons
          if (interaction.customId.startsWith('log_details_')) {
            const logId = interaction.customId.replace('log_details_', '');
            
            // Create a message with more detailed information
            await interaction.reply({
              content: `🔍 **نمایش جزئیات بیشتر**\nشناسه لاگ: \`${logId}\`\n\nایمنی داده‌ها را در نظر بگیرید. این اطلاعات فقط برای شما قابل مشاهده است.`,
              ephemeral: true
            });
            return;
          }
          
          // تنظیم مهلت زمانی برای پاسخگویی به تعامل دکمه
          const buttonReplyTimeout = setTimeout(async () => {
            if (!interaction.replied && !interaction.deferred) {
              try {
                await interaction.deferReply({ ephemeral: true });
                log(`Deferred reply for button interaction ${interaction.customId} due to timeout`, 'discord');
              } catch (e) {
                log(`Failed to defer reply for button interaction ${interaction.customId}`, 'error');
              }
            }
          }, 3000);
          
          // Handle regular button interactions
          try {
            await handleButtonInteraction(interaction);
            clearTimeout(buttonReplyTimeout);
          } catch (buttonError: any) {
            clearTimeout(buttonReplyTimeout);
            console.error(`Error handling button interaction ${interaction.customId}:`, buttonError);
            log(`Error in button handler: ${buttonError?.message || 'Unknown error'}`, 'error');
            
            try {
              if (interaction.replied) {
                await interaction.followUp({ content: 'خطایی در اجرای دکمه رخ داده است!', ephemeral: true });
              } else if (interaction.deferred) {
                await interaction.editReply({ content: 'خطایی در اجرای دکمه رخ داده است!' });
              } else {
                await interaction.reply({ content: 'خطایی در اجرای دکمه رخ داده است!', ephemeral: true });
              }
            } catch (followupError) {
              console.error(`Failed to send error message for button interaction:`, followupError);
            }
          }
        } else if (interaction.isStringSelectMenu()) {
          // تنظیم مهلت زمانی برای پاسخگویی به تعامل منوی انتخاب
          const menuReplyTimeout = setTimeout(async () => {
            if (!interaction.replied && !interaction.deferred) {
              try {
                await interaction.deferReply({ ephemeral: true });
                log(`Deferred reply for menu interaction ${interaction.customId} due to timeout`, 'discord');
              } catch (e) {
                log(`Failed to defer reply for menu interaction ${interaction.customId}`, 'error');
              }
            }
          }, 3000);
          
          try {
            await handleSelectMenuInteraction(interaction);
            clearTimeout(menuReplyTimeout);
          } catch (menuError: any) {
            clearTimeout(menuReplyTimeout);
            console.error(`Error handling menu interaction ${interaction.customId}:`, menuError);
            log(`Error in menu handler: ${menuError?.message || 'Unknown error'}`, 'error');
            
            try {
              if (interaction.replied) {
                await interaction.followUp({ content: 'خطایی در منوی انتخاب رخ داده است!', ephemeral: true });
              } else if (interaction.deferred) {
                await interaction.editReply({ content: 'خطایی در منوی انتخاب رخ داده است!' });
              } else {
                await interaction.reply({ content: 'خطایی در منوی انتخاب رخ داده است!', ephemeral: true });
              }
            } catch (followupError) {
              console.error(`Failed to send error message for menu interaction:`, followupError);
            }
          }
        } else if (interaction.isModalSubmit()) {
          // تنظیم مهلت زمانی برای پاسخگویی به تعامل مودال
          const modalReplyTimeout = setTimeout(async () => {
            if (!interaction.replied && !interaction.deferred) {
              try {
                await interaction.deferReply({ ephemeral: true });
                log(`Deferred reply for modal interaction ${interaction.customId} due to timeout`, 'discord');
              } catch (e) {
                log(`Failed to defer reply for modal interaction ${interaction.customId}`, 'error');
              }
            }
          }, 3000);
          
          try {
            // Handle special case for number guess to maintain backward compatibility
            if (interaction.customId === 'guess_number_modal') {
              const { handleNumberGuessModalSubmit } = await import('./games/numberGuess');
              await handleNumberGuessModalSubmit(interaction);
            }
            // Use the dedicated modal handler for all other cases
            else {
              await handleModalSubmit(interaction);
            }
            clearTimeout(modalReplyTimeout);
          } catch (modalError: any) {
            clearTimeout(modalReplyTimeout);
            console.error(`Error handling modal interaction ${interaction.customId}:`, modalError);
            log(`Error in modal handler: ${modalError?.message || 'Unknown error'}`, 'error');
            
            try {
              if (interaction.replied) {
                await interaction.followUp({ content: 'خطایی در فرم ورودی رخ داده است!', ephemeral: true });
              } else if (interaction.deferred) {
                await interaction.editReply({ content: 'خطایی در فرم ورودی رخ داده است!' });
              } else {
                await interaction.reply({ content: 'خطایی در فرم ورودی رخ داده است!', ephemeral: true });
              }
            } catch (followupError) {
              console.error(`Failed to send error message for modal interaction:`, followupError);
            }
          }
        }
      } catch (error) {
        console.error('Error handling interaction:', error);
      }
    });

    // Message event for passive XP, quest tracking, etc.
    client.on(Events.MessageCreate, async (message) => {
      // Ignore bot messages
      if (message.author.bot) return;

      try {
        // Register user if not exists
        const existingUser = await storage.getUserByDiscordId(message.author.id);
        if (!existingUser) {
          await storage.createUser({
            discordId: message.author.id,
            username: message.author.username,
          });
          log(`Created new user: ${message.author.username}`, 'discord');
        } else {
          // Update message-related quests
          const quests = await storage.getUserQuests(existingUser.id);
          for (const { quest, userQuest } of quests) {
            if (quest.requirement === 'message' && !userQuest.completed) {
              await storage.updateQuestProgress(
                existingUser.id,
                quest.id,
                userQuest.progress + 1
              );
            }
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Try to login with token
    try {
      // Login the client
      log('Attempting to login with Discord token...', 'discord');
      await client.login(discordToken);
      log('Successfully logged in to Discord', 'discord');
      return client;
    } catch (loginError) {
      log(`Failed to login: ${loginError}`, 'error');
      throw loginError;
    }
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error);
    throw error;
  }
}

export { client };
