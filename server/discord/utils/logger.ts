import {
  Client, 
  TextChannel, 
  EmbedBuilder, 
  ColorResolvable,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType
} from 'discord.js';

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

/**
 * ثبت و نمایش لاگ‌ها
 * @param message پیام لاگ
 * @param level سطح لاگ
 */
export function log(message: string, level: LogLevel = 'info'): void {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  let prefix = '';
  switch (level) {
    case 'info':
      prefix = '\x1b[36m[info]\x1b[0m'; // Cyan
      break;
    case 'success':
      prefix = '\x1b[32m[success]\x1b[0m'; // Green
      break;
    case 'warn':
      prefix = '\x1b[33m[warn]\x1b[0m'; // Yellow
      break;
    case 'error':
      prefix = '\x1b[31m[error]\x1b[0m'; // Red
      break;
    case 'debug':
      prefix = '\x1b[35m[debug]\x1b[0m'; // Magenta
      break;
  }

  console.log(`${timestamp} ${prefix} ${message}`);
}