import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import { log } from '../vite';
import { botConfig } from './utils/config';

export async function deployCommands() {
  const config = botConfig.getConfig();
  const token = process.env.DISCORD_TOKEN || config.general.token;
  const clientId = process.env.DISCORD_CLIENT_ID || config.general.clientId;
  
  if (!token || !clientId) {
    log('Missing Discord token or client ID. Commands will not be deployed.', 'error');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    log('Started refreshing application (/) commands.', 'discord');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    log('Successfully reloaded application (/) commands.', 'discord');
  } catch (error) {
    log(`Error deploying commands: ${error}`, 'error');
    console.error("Command deployment error:", error);
    throw error;
  }
}
