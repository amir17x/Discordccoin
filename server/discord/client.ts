import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { deployCommands } from './deploy-commands';
import { loadCommands } from './commands';
import { handleButtonInteraction } from './handlers/buttonHandler';
import { handleSelectMenuInteraction } from './handlers/menuHandler';
import { log } from '../vite';
import { storage } from '../storage';

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
