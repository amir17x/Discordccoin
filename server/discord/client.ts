import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { deployCommands } from './deploy-commands';
import { loadCommands } from './commands';
import { handleButtonInteraction } from './handlers/buttonHandler';
import { handleSelectMenuInteraction } from './handlers/menuHandler';
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
    // Load and deploy commands
    await loadCommands(client);
    await deployCommands();

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
            await command.execute(interaction);
          } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
              await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
          }
        } else if (interaction.isButton()) {
          await handleButtonInteraction(interaction);
        } else if (interaction.isStringSelectMenu()) {
          await handleSelectMenuInteraction(interaction);
        } else if (interaction.isModalSubmit()) {
          // Handle modal submissions
          const customId = interaction.customId;
          
          // Check if this is a log channel setting modal
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
            logger.setChannels({
              [logType]: channelId
            });
            
            await interaction.reply({
              content: `کانال لاگ ${logType} با موفقیت تنظیم شد!`,
              ephemeral: true
            });
            
            // Log the action to admin log if it exists
            if (logType !== LogType.ADMIN && 
                (botConfig.getConfig().logChannels[LogType.ADMIN] || botConfig.getConfig().logChannels.default)) {
              logger.logAdminAction(
                interaction.user.id,
                interaction.user.username,
                'تنظیم کانال لاگ',
                channelId,
                `کانال <#${channelId}>`,
                `کانال لاگ نوع ${logType} را تنظیم کرد`
              );
            }
            
            // Return to logs settings menu after a delay
            setTimeout(async () => {
              try {
                if (interaction.replied || interaction.deferred) {
                  const { adminMenu } = await import('./components/adminMenu');
                  const buttonLikeInteraction = createButtonLikeInteraction(interaction);
                  await adminMenu(buttonLikeInteraction, 'logs_settings');
                }
              } catch (error) {
                console.error('Error returning to logs menu:', error);
              }
            }, 1500);
          }
          
          // Check if this is the default log channel setting modal
          else if (customId === 'set_default_log_channel') {
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
            
            // Set the default channel
            botConfig.setDefaultLogChannel(channelId);
            
            // Update logger with new default channel
            const logger = getLogger(interaction.client);
            logger.setDefaultChannel(channelId);
            
            await interaction.reply({
              content: `کانال پیش‌فرض لاگ‌ها با موفقیت تنظیم شد!`,
              ephemeral: true
            });
            
            // Log the action to admin log if it exists
            const config = botConfig.getConfig();
            if (config.logChannels[LogType.ADMIN]) {
              logger.logAdminAction(
                interaction.user.id,
                interaction.user.username,
                'تنظیم کانال پیش‌فرض لاگ',
                channelId,
                `کانال <#${channelId}>`,
                `کانال پیش‌فرض لاگ را تنظیم کرد`
              );
            }
            
            // Return to logs settings menu after a delay
            setTimeout(async () => {
              try {
                if (interaction.replied || interaction.deferred) {
                  const { adminMenu } = await import('./components/adminMenu');
                  const buttonLikeInteraction = createButtonLikeInteraction(interaction);
                  await adminMenu(buttonLikeInteraction, 'logs_settings');
                }
              } catch (error) {
                console.error('Error returning to logs menu:', error);
              }
            }, 1500);
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

    // Login the client
    await client.login(process.env.DISCORD_TOKEN);
    return client;
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error);
    throw error;
  }
}

export { client };
