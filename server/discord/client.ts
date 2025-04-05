import { Client, GatewayIntentBits, Events, Collection, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction, CommandInteraction } from 'discord.js';
import { deployCommands } from './deploy-commands';
import { loadCommands } from './commands';
import { handleButtonInteraction } from './handlers/buttonHandler';
import { handleSelectMenuInteraction } from './handlers/menuHandler';
import { handleModalSubmit } from './handlers/modalHandler';
import { log } from '../vite';
import { storage } from '../storage';
import { getLogger, LogType } from './utils/logger';
import { botConfig } from './utils/config';
import { setupTipSystem } from './components/tipSystem';
import { setupAutoStatusUpdater } from './utils/aiStatusMessages';
import { setupAIMarketDynamics } from './utils/aiMarketDynamics';

// کش برای برهم‌کنش‌های پرتکرار
type InteractionCache = {
  timestamp: number;
  responseMessage: string;
};

// کش برای کاهش پردازش‌های تکراری
const interactionCache = new Map<string, InteractionCache>();
const INTERACTION_CACHE_TTL = 3000; // 3 ثانیه

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
  // تابع کمکی برای اجرای یک عملیات با مدیریت بهینه‌شده interaction
  /**
   * تابع جدید برای مدیریت تعاملات دیسکورد 
   * یک رویکرد کاملاً ساده و مستقیم بدون پیچیدگی‌های اضافی
   */
  const executeWithTimeout = async (
    interaction: any, 
    operation: () => Promise<void>, 
    type: string,
    errorMessage: string
  ) => {
    // فقط بررسی می‌کنیم که آیا قبلاً پاسخ داده شده
    if (interaction.replied || interaction.deferred) {
      console.log(`${type}: interaction already handled, skipping execution`);
      return;
    }
    
    try {
      // مستقیم اجرای عملیات - بدون تأخیر یا پاسخ اولیه
      await operation();
    } catch (error) {
      console.error(`Error in ${type}:`, error);
      
      // اگر هنوز پاسخی داده نشده، خطا را نمایش می‌دهیم
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: errorMessage,
            ephemeral: true
          });
        } catch (replyError) {
          console.error(`Failed to send error message for ${type}:`, replyError);
        }
      }
    }
  };

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
      
      // تنظیم کانال‌های لاگ به شکل بهینه
      const config = botConfig.getConfig();
      
      // تنظیم کانال پیش‌فرض
      if (config.logChannels.default) {
        logger.setDefaultChannel(config.logChannels.default);
      }
      
      // تنظیم همه کانال‌ها در یک مرحله
      const logChannels: Partial<Record<LogType, string>> = {};
      
      // تنظیم کانال‌ها در یک شی واحد
      Object.keys(config.logChannels).forEach(key => {
        if (key !== 'default' && key in LogType && config.logChannels[key as keyof typeof config.logChannels]) {
          logChannels[key as LogType] = config.logChannels[key as keyof typeof config.logChannels];
        }
      });
      
      // اعمال همه تنظیمات در یک مرحله
      if (Object.keys(logChannels).length > 0) {
        logger.setChannels(logChannels);
      }
      
      // Log bot startup only if a system log channel or default channel is configured
      if (config.logChannels[LogType.SYSTEM] || config.logChannels.default) {
        logger.logSystem(
          'راه‌اندازی ربات',
          `ربات با موفقیت راه‌اندازی شد. نسخه: 1.0.0`,
          [{ name: '🤖 نام ربات', value: client.user?.tag || 'نامشخص', inline: true }]
        );
      }
      
      // توجه: تنظیم پیام‌های watching توسط سیستم هوش مصنوعی در aiStatusMessages.ts مدیریت می‌شود
      
      // راه‌اندازی سیستم نکات
      try {
        setupTipSystem(client);
        log('سیستم نکات با موفقیت راه‌اندازی شد', 'discord');
      } catch (tipError) {
        console.error('Error setting up tip system:', tipError);
        log('خطا در راه‌اندازی سیستم نکات: ' + tipError, 'error');
      }
      
      // راه‌اندازی سیستم جملات طنز AI برای وضعیت Watching
      try {
        setupAutoStatusUpdater(client, 20); // هر 20 دقیقه به‌روزرسانی می‌شود
        log('سیستم جملات طنز هوش مصنوعی با موفقیت راه‌اندازی شد', 'discord');
      } catch (aiError) {
        console.error('Error setting up AI status messages:', aiError);
        log('خطا در راه‌اندازی سیستم جملات طنز هوش مصنوعی: ' + aiError, 'error');
      }
      
      // راه‌اندازی سیستم هوش مصنوعی بازار سهام
      try {
        setupAIMarketDynamics(60); // هر 60 دقیقه به‌روزرسانی می‌شود
        log('سیستم هوش مصنوعی بازار سهام با موفقیت راه‌اندازی شد', 'discord');
      } catch (marketError) {
        console.error('Error setting up AI market dynamics:', marketError);
        log('خطا در راه‌اندازی سیستم هوش مصنوعی بازار سهام: ' + marketError, 'error');
      }
      
      // راه‌اندازی سیستم مصادره اموال وام‌های معوق
      try {
        // اجرای اولیه پس از 2 دقیقه از راه‌اندازی
        setTimeout(async () => {
          try {
            const { handleLoanConfiscation } = await import('./components/bankMenu/loanMenu');
            await handleLoanConfiscation();
            log('بررسی اولیه وام‌های معوق با موفقیت انجام شد', 'discord');
          } catch (err) {
            log(`خطا در بررسی اولیه وام‌های معوق: ${err}`, 'error');
          }
        }, 2 * 60 * 1000);
        
        // بررسی روزانه وام‌های معوق
        const ONE_DAY = 24 * 60 * 60 * 1000; // 24 ساعت به میلی‌ثانیه
        setInterval(async () => {
          try {
            const { handleLoanConfiscation } = await import('./components/bankMenu/loanMenu');
            await handleLoanConfiscation();
            log('بررسی دوره‌ای وام‌های معوق با موفقیت انجام شد', 'discord');
          } catch (err) {
            log(`خطا در بررسی دوره‌ای وام‌های معوق: ${err}`, 'error');
          }
        }, ONE_DAY);
        
        log('سیستم مصادره اموال وام‌های معوق با موفقیت راه‌اندازی شد', 'discord');
      } catch (loanError) {
        console.error('Error setting up loan confiscation system:', loanError);
        log('خطا در راه‌اندازی سیستم مصادره اموال وام‌های معوق: ' + loanError, 'error');
      }
    });

    // Command interaction
    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        // ثبت کاربر جدید اگر وجود نداشته باشد
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
        
        // پردازش انواع برهم‌کنش
        if (interaction.isChatInputCommand()) {
          const command = client.commands.get(interaction.commandName);
          if (!command) return;
          
          // کش موقتاً غیرفعال شده برای بررسی مشکلات راه‌اندازی
  // این بخش در آینده دوباره فعال خواهد شد
  /*
          const cacheKey = `cmd_${interaction.commandName}_${interaction.user.id}`;
          const cachedData = interactionCache.get(cacheKey);
          const now = Date.now();
          
          if (cachedData && (now - cachedData.timestamp < INTERACTION_CACHE_TTL)) {
            // استفاده از کش برای جلوگیری از اجرای مکرر دستور
            await interaction.reply({
              content: cachedData.responseMessage || '⚠️ لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.',
              ephemeral: true
            });
            return;
          }
  */
          const now = Date.now(); // متغیر now برای استفاده بعدی
          
          log(`Executing command: ${interaction.commandName}`, 'discord');
          
          await executeWithTimeout(
            interaction,
            async () => { await command.execute(interaction); },
            `command ${interaction.commandName}`,
            'خطایی در اجرای این دستور رخ داده است!'
          );
          
          // ذخیره در کش موقتاً غیرفعال شده
          /*
          const cmdCacheKey = `cmd_${interaction.commandName}_${interaction.user.id}`;
          interactionCache.set(cmdCacheKey, {
            timestamp: now,
            responseMessage: '⚠️ لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.'
          });
          */
          
          log(`Successfully executed command: ${interaction.commandName}`, 'discord');
          
        } else if (interaction.isButton()) {
          // پردازش دکمه‌های جزئیات لاگ
          if (interaction.customId.startsWith('log_details_')) {
            const logId = interaction.customId.replace('log_details_', '');
            
            await interaction.reply({
              content: `🔍 **نمایش جزئیات بیشتر**\nشناسه لاگ: \`${logId}\`\n\nایمنی داده‌ها را در نظر بگیرید. این اطلاعات فقط برای شما قابل مشاهده است.`,
              ephemeral: true
            });
            return;
          }
          
          // بررسی کش برای دکمه‌های پر کاربرد - موقتاً غیرفعال
          /*
          const cacheKey = `btn_${interaction.customId}_${interaction.user.id}`;
          const cachedData = interactionCache.get(cacheKey);
          const now = Date.now();
          
          if (cachedData && (now - cachedData.timestamp < INTERACTION_CACHE_TTL)) {
            // از کش استفاده کنید تا از فشار بیش از حد بر API جلوگیری شود
            await interaction.reply({
              content: cachedData.responseMessage || '⚠️ لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.',
              ephemeral: true
            });
            return;
          }
          */
          // این متغیر در بخش کد فعلی استفاده نمی‌شود
          
          // پردازش سایر دکمه‌ها
          await executeWithTimeout(
            interaction,
            async () => { await handleButtonInteraction(interaction); },
            `button ${interaction.customId}`,
            'خطایی در اجرای دکمه رخ داده است!'
          );
          
          // ذخیره در کش موقتاً غیرفعال
          /*
          if (interaction.customId.includes('daily') || 
              interaction.customId.includes('wheel') || 
              interaction.customId.includes('game')) {
            const btnCacheKey = `btn_${interaction.customId}_${interaction.user.id}`;
            interactionCache.set(btnCacheKey, {
              timestamp: now,
              responseMessage: '⚠️ لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.'
            });
          }
          */
          
        } else if (interaction.isStringSelectMenu()) {
          try {
            // ثبت لاگ برای عیب‌یابی بهتر
            log(`Processing select menu interaction: ${interaction.customId} with values: ${interaction.values.join(', ')}`, 'info');
            
            // بررسی خاص برای منوی راهنما
            if (interaction.customId === 'help_category_select') {
              log(`Help menu category selected: ${interaction.values[0]}`, 'info');
              const { helpMenu } = await import('./components/helpMenu');
              
              // دریافت مقدار انتخاب شده
              const selectedCategory = interaction.values[0];
              
              try {
                // برای منوی راهنما از deferUpdate استفاده می‌کنیم
                if (!interaction.deferred && !interaction.replied) {
                  await interaction.deferUpdate();
                  log('Help menu interaction deferred successfully', 'info');
                }
                
                // اجرای مستقیم تابع helpMenu برای جلوگیری از مشکلات ناشی از executeWithTimeout
                await helpMenu(interaction as any, selectedCategory);
                log(`Help menu successfully processed for category: ${selectedCategory}`, 'info');
                return;
              } catch (helpError) {
                log(`Error in direct helpMenu call: ${helpError}`, 'error');
                if (!interaction.replied) {
                  await interaction.editReply({
                    content: '❌ خطایی در پردازش منوی راهنما رخ داد. لطفاً مجدداً تلاش کنید.'
                  }).catch(err => log(`Failed to send error message: ${err}`, 'error'));
                }
                return;
              }
            }
            
            // بررسی کش برای منوهای انتخاب - موقتاً غیرفعال
            /*
            const cacheKey = `menu_${interaction.customId}_${interaction.user.id}`;
            const cachedData = interactionCache.get(cacheKey);
            const now = Date.now();
            
            if (cachedData && (now - cachedData.timestamp < INTERACTION_CACHE_TTL)) {
              // استفاده از کش برای کاهش درخواست‌های تکراری به API
              await interaction.reply({
                content: cachedData.responseMessage || '⚠️ لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.',
                ephemeral: true
              });
              return;
            }
            */
            // این متغیر در بخش کد فعلی استفاده نمی‌شود
            
            // پردازش سایر منوهای انتخاب
            if (interaction.customId !== 'help_category_select') {
              log(`Handling other select menu through executeWithTimeout: ${interaction.customId}`, 'info');
              await executeWithTimeout(
                interaction,
                async () => { await handleSelectMenuInteraction(interaction); },
                `menu ${interaction.customId}`,
                'خطایی در منوی انتخاب رخ داده است!'
              );
            }
          } catch (selectMenuError) {
            log(`Critical error in select menu handling: ${selectMenuError}`, 'error');
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: '❌ خطایی در پردازش منوی انتخاب رخ داد. لطفاً مجدداً تلاش کنید.',
                ephemeral: true
              }).catch(console.error);
            } else if (interaction.deferred) {
              await interaction.editReply({
                content: '❌ خطایی در پردازش منوی انتخاب رخ داد. لطفاً مجدداً تلاش کنید.'
              }).catch(console.error);
            }
          }
          
          // ذخیره در کش فقط برای منوهای پرکاربرد
          if (interaction.customId.includes('shop') || 
              interaction.customId.includes('inventory') || 
              interaction.customId.includes('game_select')) {
            const menuNow = Date.now(); // استفاده از متغیر جداگانه برای این بخش
            const menuCacheKey = `menu_${interaction.customId}_${interaction.user.id}`;
            interactionCache.set(menuCacheKey, {
              timestamp: menuNow,
              responseMessage: '⚠️ لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.'
            });
          }
          
        } else if (interaction.isModalSubmit()) {
          // بررسی کش برای فرم‌های مودال (مخصوصا برای بازی حدس عدد که ممکن است اسپم شود)
          if (interaction.customId === 'guess_number_modal') {
            const cacheKey = `modal_guess_number_${interaction.user.id}`;
            const cachedData = interactionCache.get(cacheKey);
            const now = Date.now();
            
            if (cachedData && (now - cachedData.timestamp < INTERACTION_CACHE_TTL)) {
              // استفاده از کش برای کاهش درخواست‌های تکراری
              await interaction.reply({
                content: cachedData.responseMessage || '⚠️ لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.',
                ephemeral: true
              });
              return;
            }
            
            // اجرای عملیات و ذخیره در کش
            await executeWithTimeout(
              interaction,
              async () => {
                const { handleNumberGuessModalSubmit } = await import('./games/numberGuess');
                await handleNumberGuessModalSubmit(interaction);
              },
              `modal ${interaction.customId}`,
              'خطایی در فرم ورودی رخ داده است!'
            );
            
            // ذخیره در کش
            interactionCache.set(cacheKey, {
              timestamp: now,
              responseMessage: '⚠️ لطفاً بین حدس‌های خود کمی صبر کنید!'
            });
          } else {
            // پردازش عمومی برای سایر فرم‌ها
            await executeWithTimeout(
              interaction,
              async () => {
                await handleModalSubmit(interaction);
              },
              `modal ${interaction.customId}`,
              'خطایی در فرم ورودی رخ داده است!'
            );
          }
        }
      } catch (error) {
        // این خطاها قبلاً در executeWithTimeout مدیریت شده‌اند
        // فقط در صورت بروز خطا در بخش‌های دیگر اینجا لاگ می‌شود
        if (!interaction.isChatInputCommand() && 
            !interaction.isButton() && 
            !interaction.isStringSelectMenu() && 
            !interaction.isModalSubmit()) {
          console.error('Error handling interaction:', error);
        }
      }
    });

    // کش کاربران برای بهینه‌سازی عملکرد در رویداد پیام
    const userCache = new Map<string, { id: number, lastCheck: number }>();
    const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه TTL برای کش
    
    // Message event for passive XP, quest tracking, etc.
    client.on(Events.MessageCreate, async (message) => {
      // Ignore bot messages
      if (message.author.bot) return;

      try {
        const discordId = message.author.id;
        const now = Date.now();
        let userId: number;
        
        // کش کاربر را بررسی کنید
        const cachedUser = userCache.get(discordId);
        if (cachedUser && (now - cachedUser.lastCheck) < CACHE_TTL) {
          // اگر کاربر در کش باشد و TTL منقضی نشده باشد، از آن استفاده کنید
          userId = cachedUser.id;
        } else {
          // در غیر این صورت، کاربر را از دیتابیس دریافت کنید
          const existingUser = await storage.getUserByDiscordId(discordId);
          if (!existingUser) {
            // کاربر جدید ایجاد کنید
            const newUser = await storage.createUser({
              discordId: discordId,
              username: message.author.username,
            });
            userId = newUser.id;
            userCache.set(discordId, { id: userId, lastCheck: now });
            log(`Created new user: ${message.author.username}`, 'discord');
            return; // کاربران جدید نیازی به بررسی کوئست ندارند
          } else {
            // کاربر موجود را در کش ذخیره کنید
            userId = existingUser.id;
            userCache.set(discordId, { id: userId, lastCheck: now });
          }
          
          // فقط بررسی کوئست‌ها را برای کاربران فعال در چت انجام دهید
          // و با استفاده از پردازش تصادفی برای کاهش فشار
          if (Math.random() < 0.25) { // فقط ~25% از پیام‌ها را پردازش کنید
            // Update message-related quests
            const quests = await storage.getUserQuests(userId);
            for (const { quest, userQuest } of quests) {
              if (quest.requirement === 'message' && !userQuest.completed) {
                await storage.updateQuestProgress(
                  userId,
                  quest.id,
                  userQuest.progress + 1
                );
              }
            }
          }
        }
      } catch (error) {
        // کاهش لاگ‌ها برای کاهش فشار سیستم
        console.error('Error in MessageCreate handler');
      }
    });

    // اضافه کردن مکانیزم پاکسازی خودکار کش‌ها برای جلوگیری از نشت حافظه
    // این مکانیزم با تاخیر اجرا می‌شود تا از تاثیر منفی بر زمان راه‌اندازی جلوگیری شود
    setTimeout(() => {
      setInterval(() => {
        const now = Date.now();
        
        // پاکسازی کش برهم‌کنش‌ها - با پردازش محدود برای جلوگیری از تاثیر منفی بر عملکرد
        let count = 0;
        interactionCache.forEach((value, key) => {
          if (count > 100) return; // محدود کردن تعداد حذف‌ها در هر مرحله
          if (now - value.timestamp > INTERACTION_CACHE_TTL * 2) {
            interactionCache.delete(key);
            count++;
          }
        });
        
        // پاکسازی کش کاربران - با پردازش محدود 
        count = 0;
        userCache.forEach((value, key) => {
          if (count > 100) return; // محدود کردن تعداد حذف‌ها در هر مرحله
          if (now - value.lastCheck > CACHE_TTL * 2) {
            userCache.delete(key);
            count++;
          }
        });
      }, 30 * 60 * 1000); // هر 30 دقیقه پاکسازی شود برای کاهش سربار
    }, 60 * 1000); // تاخیر 60 ثانیه برای شروع اولین پاکسازی
    
    // Try to login with token
    try {
      // Login the client
      log('Attempting to login with Discord token...', 'discord');
      await client.login(discordToken);
      log('Successfully logged in to Discord', 'discord');
      return client;
    } catch (loginError) {
      log(`Failed to login to Discord. Bot will continue without Discord integration: ${loginError}`, 'error');
      console.error('Discord login failed:', loginError);
      return client; // بازگشت کلاینت حتی اگر ورود به دیسکورد ناموفق باشد
    }
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error);
    throw error;
  }
}

export { client };
