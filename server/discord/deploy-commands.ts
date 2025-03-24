import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import { log } from '../vite';

export async function deployCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  
  if (!token || !clientId) {
    log('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID environment variables', 'error');
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
    console.error(error);
  }
}
