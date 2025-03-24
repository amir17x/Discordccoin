import { Request, Response } from "express";
import { storage } from "./storage";
import { mainMenu } from "./discord/components/mainMenu";
import { economyMenu } from "./discord/components/economyMenu";
import { shopMenu } from "./discord/components/shopMenu";
import { profileMenu } from "./discord/components/profileMenu";
import { gamesMenu } from "./discord/components/gamesMenu";
import { handleButtonInteraction } from "./discord/handlers/buttonHandler";
import { investmentMenu } from "./discord/components/investmentMenu";
import { clansMenu } from "./discord/components/clansMenu";
import { questsMenu } from "./discord/components/questsMenu";
import { handleCoinFlip } from "./discord/games/coinFlip";
import { handleRockPaperScissors } from "./discord/games/rockPaperScissors";
import { handleNumberGuess } from "./discord/games/numberGuess";
import { lotteryMenu } from "./discord/components/lotteryMenu";
import { wheelOfFortuneMenu } from "./discord/components/wheelOfFortuneMenu";
import { stocksMenu } from "./discord/components/stocksMenu";
import { robberyMenu } from "./discord/components/robberyMenu";
import { giveawayBridgeMenu } from "./discord/components/giveawayBridge";
import { inventoryMenu } from "./discord/components/inventoryMenu";
import { adminMenu } from "./discord/components/adminMenu";

/**
 * کلاس شبیه‌ساز برهم‌کنش با کاربر
 * این کلاس برای تست کامپوننت‌های مختلف ربات بدون نیاز به دیسکورد استفاده می‌شود
 */
class MockInteraction {
  user: any;
  customId: string;
  replied: boolean = false;
  deferred: boolean = false;
  ephemeral: boolean = false;
  response: any = {
    content: null,
    embeds: [],
    components: []
  };
  commandName?: string;

  constructor(userId: string, username: string, customId: string = '') {
    this.user = {
      id: userId,
      username: username,
      discordId: userId
    };
    this.customId = customId;
  }

  async deferReply(options: any = {}) {
    this.deferred = true;
    this.ephemeral = options.ephemeral || false;
    return this;
  }

  async reply(options: any) {
    this.replied = true;
    this.ephemeral = options.ephemeral || false;
    
    if (typeof options === 'string') {
      this.response.content = options;
    } else {
      this.response.content = options.content || null;
      this.response.embeds = options.embeds || [];
      this.response.components = options.components || [];
    }
    
    return this;
  }

  async editReply(options: any) {
    if (typeof options === 'string') {
      this.response.content = options;
    } else {
      this.response.content = options.content || this.response.content;
      this.response.embeds = options.embeds || this.response.embeds;
      this.response.components = options.components || this.response.components;
    }
    
    return this;
  }

  async followUp(options: any) {
    // در شبیه‌ساز، followUp همانند reply عمل می‌کند
    return this.reply(options);
  }

  async update(options: any) {
    // در شبیه‌ساز، update همانند editReply عمل می‌کند
    return this.editReply(options);
  }
}

/**
 * شبیه‌ساز برهم‌کنش دکمه
 */
class MockButtonInteraction extends MockInteraction {
  constructor(userId: string, username: string, customId: string) {
    super(userId, username, customId);
  }
}

/**
 * شبیه‌ساز برهم‌کنش دستور
 */
class MockCommandInteraction extends MockInteraction {
  constructor(userId: string, username: string, commandName: string) {
    super(userId, username);
    this.commandName = commandName;
  }
}

/**
 * شبیه‌سازی اجرای یک دستور
 */
export async function simulateCommand(req: Request, res: Response) {
  try {
    const { userId, username, command } = req.body;
    
    if (!userId || !username || !command) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // ایجاد شبیه‌ساز برهم‌کنش
    const interaction = new MockCommandInteraction(userId, username, command);
    
    // ثبت لاگ کمک‌کننده
    console.log(`[Simulator] Processing command: ${command} for user ${username} (${userId})`);
    
    try {
      // بررسی اینکه کاربر در دیتابیس وجود دارد، در غیر این صورت ایجاد می‌شود
      let user = await storage.getUserByDiscordId(userId);
      if (!user) {
        user = await storage.createUser({
          discordId: userId,
          username: username
        });
        console.log(`[Simulator] Created new user: ${username}`);
      } else {
        console.log(`[Simulator] Found existing user: ${username}`);
      }
      
      // اجرای کامند مناسب بر اساس نام دستور
      switch (command) {
        case 'ccoin':
        case 'main':
          console.log('[Simulator] Executing mainMenu');
          await mainMenu(interaction as any);
          break;
        case 'economy':
          console.log('[Simulator] Executing economyMenu');
          await economyMenu(interaction as any);
          break;
        case 'shop':
          console.log('[Simulator] Executing shopMenu');
          await shopMenu(interaction as any);
          break;
        case 'profile':
          console.log('[Simulator] Executing profileMenu');
          await profileMenu(interaction as any);
          break;
        case 'games':
          console.log('[Simulator] Executing gamesMenu');
          await gamesMenu(interaction as any);
          break;
        case 'investment':
          console.log('[Simulator] Executing investmentMenu');
          await investmentMenu(interaction as any);
          break;
        case 'clan':
          console.log('[Simulator] Executing clansMenu');
          await clansMenu(interaction as any);
          break;
        case 'quests':
          console.log('[Simulator] Executing questsMenu');
          await questsMenu(interaction as any);
          break;
        case 'lottery':
          console.log('[Simulator] Executing lotteryMenu');
          await lotteryMenu(interaction as any);
          break;
        case 'wheel':
          console.log('[Simulator] Executing wheelOfFortuneMenu');
          await wheelOfFortuneMenu(interaction as any);
          break;
        case 'stocks':
          console.log('[Simulator] Executing stocksMenu');
          await stocksMenu(interaction as any);
          break;
        case 'rob':
          console.log('[Simulator] Executing robberyMenu');
          await robberyMenu(interaction as any);
          break;
        case 'giveaway':
          console.log('[Simulator] Executing giveawayBridgeMenu');
          await giveawayBridgeMenu(interaction as any);
          break;
        case 'inventory':
          console.log('[Simulator] Executing inventoryMenu');
          await inventoryMenu(interaction as any);
          break;
        case 'admin':
          console.log('[Simulator] Executing adminMenu');
          await adminMenu(interaction as any);
          break;
        default:
          console.log(`[Simulator] Command not found: ${command}`);
          interaction.reply({ content: `❌ دستور \`${command}\` یافت نشد.`, ephemeral: true });
      }
      
      console.log('[Simulator] Command executed successfully');
    } catch (err) {
      console.error(`[Simulator] Error executing command: ${err}`);
      // در صورت خطا، یک پاسخ ساده برگردانده می‌شود
      interaction.reply({ 
        content: `❌ خطایی در اجرای دستور رخ داد: ${err}`, 
        ephemeral: true 
      });
    }
    
    // ارسال پاسخ
    res.status(200).json(interaction.response);
  } catch (error) {
    console.error('Error in simulateCommand:', error);
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
}

/**
 * شبیه‌سازی کلیک روی یک دکمه
 */
export async function simulateButtonClick(req: Request, res: Response) {
  try {
    const { userId, username, customId } = req.body;
    
    if (!userId || !username || !customId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // ایجاد شبیه‌ساز برهم‌کنش دکمه
    const interaction = new MockButtonInteraction(userId, username, customId);
    
    // ثبت لاگ کمک‌کننده
    console.log(`[Simulator] Processing button click: ${customId} for user ${username} (${userId})`);
    
    try {
      // بررسی اینکه کاربر در دیتابیس وجود دارد، در غیر این صورت ایجاد می‌شود
      let user = await storage.getUserByDiscordId(userId);
      if (!user) {
        user = await storage.createUser({
          discordId: userId,
          username: username
        });
        console.log(`[Simulator] Created new user: ${username}`);
      } else {
        console.log(`[Simulator] Found existing user: ${username}`);
      }
      
      // پردازش کلیک دکمه
      console.log(`[Simulator] Handling button interaction: ${customId}`);
      await handleButtonInteraction(interaction as any);
      console.log('[Simulator] Button interaction handled successfully');
    } catch (err) {
      console.error(`[Simulator] Error handling button: ${err}`);
      // در صورت خطا، یک پاسخ ساده برگردانده می‌شود
      interaction.reply({ 
        content: `❌ خطایی در اجرای دکمه رخ داد: ${err}`, 
        ephemeral: true 
      });
    }
    
    // ارسال پاسخ
    res.status(200).json(interaction.response);
  } catch (error) {
    console.error('Error in simulateButtonClick:', error);
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
}