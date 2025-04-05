import { SlashCommandBuilder, Collection, Client, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable } from 'discord.js';
import { storage } from '../storage';
import { mainMenu } from './components/mainMenu';
import { adminMenu } from '../discord/components/adminMenu';
import { setupTipSystem, addTipChannel, removeTipChannel, toggleTipChannel, updateTipChannel, updateTipInterval, sendImmediateTip } from './components/tipSystem';
import { handleGroupGamesMenu } from './components/groupGames';
import { botConfig } from './utils/config';
import { pingCurrentAIService, generateAIResponse } from './services/aiService';
import axios from 'axios';
import { setFeedbackChannelCommand, executeSetFeedbackChannel } from './commands/admin/setFeedbackChannel';
import { timeThiefCommand, unTimeThiefCommand, executeTimeThief, executeUnTimeThief } from './commands/economy/robberyCommands';

// Command to display the main menu
const menu = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('باز کردن منوی اصلی ربات بازی'),
  
  async execute(interaction: any) {
    try {
      // برای جلوگیری از خطای Unknown interaction، از یک پاسخ مستقیم استفاده می‌کنیم
      // به جای defer که گاهی باعث گیر کردن در حالت "thinking" می‌شود
      
      // بررسی وضعیت تعامل
      if (interaction.replied || interaction.deferred) {
        console.log('Menu command: interaction already handled');
        return;
      }
      
      // ارسال پاسخ اولیه سریع
      try {
        await interaction.reply({ 
          content: "🏠 در حال بارگذاری منوی اصلی...",
          ephemeral: true 
        });
      } catch (replyError) {
        console.error("Failed to send initial reply for menu:", replyError);
        throw replyError; // نمی‌توانیم بدون پاسخ اولیه ادامه دهیم
      }
      
      // کمی صبر کنیم و سپس منوی اصلی را نمایش دهیم
      setTimeout(async () => {
        try {
          await mainMenu(interaction);
        } catch (menuError) {
          console.error("Error in showing main menu:", menuError);
          await interaction.editReply({ 
            content: "⚠️ خطا در بارگذاری منو! لطفاً دوباره تلاش کنید." 
          }).catch(() => {/* نادیده گرفتن خطاهای احتمالی */});
        }
      }, 100); // تاخیر کوتاه برای اطمینان از اینکه پاسخ اولیه ثبت شده است
      
    } catch (error) {
      console.error("Critical error in menu command:", error);
      
      // آخرین تلاش برای پاسخ دادن
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: "❌ خطای سیستمی! لطفاً چند لحظه دیگر تلاش کنید.", 
            ephemeral: true 
          });
        }
      } catch (finalError) {
        // نمی‌توانیم کاری بکنیم، احتمالاً تعامل منقضی شده است
        console.log("Menu command interaction completely failed");
      }
    }
  }
};

// Command to show user balance
const balance = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('💰 بررسی موجودی حساب شما'),
  
  async execute(interaction: any) {
    try {
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        // Create new user if not exists
        const newUser = await storage.createUser({
          discordId: interaction.user.id,
          username: interaction.user.username,
        });
        
        // ایجاد Embed برای کاربر جدید
        const newUserEmbed = new EmbedBuilder()
          .setColor('#2ECC71') // سبز روشن
          .setTitle('🎉 به دنیای Ccoin خوش آمدید!')
          .setDescription(`**${interaction.user.username}** عزیز، حساب شما با موفقیت ساخته شد.`)
          .setThumbnail(interaction.user.displayAvatarURL() || interaction.client.user?.displayAvatarURL())
          .addFields(
            { name: '💰 موجودی کیف پول', value: `\`${newUser.wallet} Ccoin\``, inline: true },
            { name: '🏦 موجودی بانک', value: `\`${newUser.bank} Ccoin\``, inline: true },
            { name: '💎 کریستال', value: `\`${newUser.crystals}\``, inline: true }
          )
          .setFooter({ text: '📌 برای دریافت جایزه روزانه از دستور /daily استفاده کنید!' })
          .setTimestamp();
        
        // دکمه برای دسترسی به منوی اصلی
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('menu')
              .setLabel('🏠 منوی اصلی')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('daily')
              .setLabel('🎁 دریافت جایزه روزانه')
              .setStyle(ButtonStyle.Primary)
          );
        
        await interaction.reply({
          embeds: [newUserEmbed],
          components: [row],
          ephemeral: true
        });
      } else {
        // ایجاد امبد برای کاربر موجود
        const balanceEmbed = new EmbedBuilder()
          .setColor('#F1C40F') // زرد طلایی
          .setTitle('💰 اطلاعات حساب کاربری')
          .setDescription(`**${interaction.user.username}** عزیز، اطلاعات حساب شما به شرح زیر است:`)
          .setThumbnail(interaction.user.displayAvatarURL() || interaction.client.user?.displayAvatarURL())
          .addFields(
            { name: '💰 موجودی کیف پول', value: `\`${user.wallet} Ccoin\``, inline: true },
            { name: '🏦 موجودی بانک', value: `\`${user.bank} Ccoin\``, inline: true },
            { name: '💎 کریستال', value: `\`${user.crystals}\``, inline: true },
            { name: '🏆 امتیاز', value: `\`${user.points || 0}\``, inline: true },
            { name: '🌟 سطح', value: `\`${user.level || 1}\``, inline: true },
            { name: '📊 مجموع دارایی', value: `\`${user.wallet + user.bank} Ccoin\``, inline: true }
          )
          .setFooter({ text: '📌 برای مشاهده جزئیات بیشتر، از منوی اصلی بخش اقتصاد را انتخاب کنید!' })
          .setTimestamp();
        
        // ساخت دکمه برای دسترسی به منوی اقتصاد
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('economy')
              .setLabel('💰 منوی اقتصاد')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('deposit_menu')
              .setLabel('🏦 انتقال به بانک')
              .setStyle(ButtonStyle.Primary)
          );
        
        await interaction.reply({
          embeds: [balanceEmbed],
          components: [row],
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error in balance command:', error);
      await interaction.reply({
        content: '⚠️ خطا در بررسی موجودی! لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
};

// Command to claim daily reward
const daily = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('🎁 دریافت پاداش روزانه'),
  
  async execute(interaction: any) {
    try {
      // استفاده از reply مستقیم به جای editReply
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
        
        // ایجاد Embed برای کاربر جدید
        const newUserEmbed = new EmbedBuilder()
          .setColor('#E91E63') // صورتی
          .setTitle('🎁 پاداش روزانه دریافت شد!')
          .setDescription(`**${interaction.user.username}** عزیز، خوش آمدید! اولین پاداش روزانه شما دریافت شد.`)
          .setThumbnail('https://img.icons8.com/fluency/48/gift.png') // آیکون جعبه هدیه با سبک Fluency
          .addFields(
            { name: '💰 جایزه دریافتی', value: `\`50 Ccoin\``, inline: true },
            { name: '🔄 استریک روزانه', value: `\`1 روز\``, inline: true },
            { name: '⏰ جایزه بعدی', value: '`24 ساعت دیگر`', inline: true }
          )
          .setFooter({ text: '📌 برای افزایش مقدار پاداش، هر روز وارد شوید!' })
          .setTimestamp();
        
        // دکمه برای دسترسی به منوی اصلی
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('menu')
              .setLabel('🏠 منوی اصلی')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('balance')
              .setLabel('💰 مشاهده موجودی')
              .setStyle(ButtonStyle.Primary)
          );
        
        await interaction.reply({
          embeds: [newUserEmbed],
          components: [row]
        });
      } else {
        // Check if daily reward already claimed
        const now = new Date();
        const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
        
        if (lastDaily && now.getTime() - lastDaily.getTime() < 24 * 60 * 60 * 1000) {
          const nextReset = new Date(lastDaily.getTime() + 24 * 60 * 60 * 1000);
          const hours = Math.floor((nextReset.getTime() - now.getTime()) / (60 * 60 * 1000));
          const minutes = Math.floor(((nextReset.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
          
          // ایجاد امبد برای زمان باقی‌مانده
          const cooldownEmbed = new EmbedBuilder()
            .setColor('#F39C12') // نارنجی
            .setTitle('⏳ پاداش روزانه در دسترس نیست')
            .setDescription(`**${interaction.user.username}** عزیز، شما قبلاً پاداش روزانه خود را دریافت کرده‌اید!`)
            .setThumbnail('https://img.icons8.com/fluency/48/hourglass.png') // آیکون ساعت شنی با سبک Fluency
            .addFields(
              { name: '⏱️ زمان باقی‌مانده', value: `\`${hours} ساعت و ${minutes} دقیقه\``, inline: false },
              { name: '📆 استریک فعلی', value: `\`${user.dailyStreak} روز\``, inline: true },
              { name: '⚠️ توجه', value: 'برای حفظ استریک خود، فراموش نکنید فردا دوباره مراجعه کنید!', inline: false }
            )
            .setFooter({ text: 'استریک‌های بالاتر، جوایز بیشتری دارند!' })
            .setTimestamp();
          
          // دکمه برای دسترسی به منوی اصلی
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('menu')
                .setLabel('🏠 منوی اصلی')
                .setStyle(ButtonStyle.Success)
            );
          
          await interaction.reply({
            embeds: [cooldownEmbed],
            components: [row]
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
        let streakBonus = 0;
        
        if (streak >= 7) {
          streakBonus = 200; // Bonus for 7-day streak
          reward += streakBonus;
        } else if (streak >= 3) {
          streakBonus = 50; // Smaller bonus for 3-day streak
          reward += streakBonus;
        }
        
        // Apply bonuses from active items
        const inventory = user.inventory as Record<string, any>;
        let bonusMultiplier = 1.0;
        let bonusFromItems = 0;
        
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
        
        const baseReward = reward;
        reward = Math.floor(reward * bonusMultiplier);
        bonusFromItems = reward - baseReward;
        
        // Apply reward
        await storage.addToWallet(user.id, reward);
        await storage.updateUser(user.id, { lastDaily: now, dailyStreak: streak });
        
        // اُپن از نوع جایزه برای Embed
        let rewardColor = '#2ECC71'; // سبز
        let rewardTitle = '🎁 پاداش روزانه دریافت شد!';
        let rewardThumbnail = 'https://img.icons8.com/fluency/48/gift.png'; // آیکون جعبه هدیه با سبک Fluency
        
        if (streak >= 7) {
          rewardColor = '#9B59B6'; // بنفش برای استریک های بالا
          rewardTitle = '🌟 پاداش روزانه ویژه دریافت شد!';
          rewardThumbnail = 'https://img.icons8.com/fluency/48/prize.png'; // آیکون جایزه ویژه با سبک Fluency
        }
        
        // ایجاد امبد برای دریافت جایزه
        const rewardEmbed = new EmbedBuilder()
          .setColor(rewardColor as ColorResolvable)
          .setTitle(rewardTitle)
          .setDescription(`**${interaction.user.username}** عزیز، پاداش روزانه شما با موفقیت دریافت شد!`)
          .setThumbnail(rewardThumbnail)
          .addFields(
            { name: '💰 جایزه پایه', value: `\`${baseReward - streakBonus} Ccoin\``, inline: true },
            { name: '🌟 پاداش استریک', value: `\`${streakBonus} Ccoin\``, inline: streakBonus > 0 },
            { name: '🔮 بونوس آیتم ها', value: `\`${bonusFromItems} Ccoin\``, inline: bonusFromItems > 0 },
            { name: '📊 مجموع جایزه', value: `\`${reward} Ccoin\``, inline: false },
            { name: '🔄 استریک فعلی', value: `\`${streak} روز\``, inline: true },
            { name: '⏰ جایزه بعدی', value: '`24 ساعت دیگر`', inline: true }
          )
          .setFooter({ text: streak >= 7 ? '🎊 تبریک! شما به استریک 7 روزه رسیده‌اید و پاداش ویژه دریافت کردید!' : '📌 برای دریافت پاداش ویژه، استریک 7 روزه را حفظ کنید!' })
          .setTimestamp();
        
        // دکمه های دسترسی
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('menu')
              .setLabel('🏠 منوی اصلی')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('balance')
              .setLabel('💰 مشاهده موجودی')
              .setStyle(ButtonStyle.Primary)
          );
        
        await interaction.reply({
          embeds: [rewardEmbed],
          components: [row]
        });
      }
    } catch (error) {
      console.error('Error in daily command:', error);
      
      // بررسی وضعیت پاسخ
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠️ خطا در دریافت جایزه روزانه! لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
    }
  }
};

// Command to show help
const help = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('نمایش راهنمای جامع ربات Ccoin'),
  
  async execute(interaction: any) {
    try {
      // ایجاد Embed زیبا و مدرن برای راهنما
      const helpEmbed = new EmbedBuilder()
        .setColor('#8A2BE2') // رنگ بنفش تیره برای ظاهر جذاب‌تر
        .setTitle('✨ راهنمای جامع ربات Ccoin 🌠')
        .setDescription('**به دنیای اقتصاد و سرگرمی پیشرفته Ccoin خوش آمدید!** 🚀\nاز دستورات زیر برای دسترسی به امکانات متنوع ربات استفاده کنید:')
        .setThumbnail('https://img.icons8.com/fluency/96/treasure-chest.png')
        .addFields(
          { 
            name: '🎮 **دستورات اصلی بازی**', 
            value: '```yml\n/menu ⭐ منوی اصلی با تمام امکانات (کامل‌ترین روش)\n/balance 💰 بررسی سریع موجودی حساب\n/daily 🎁 دریافت پاداش روزانه (هر 24 ساعت)\n/help 📋 نمایش این راهنما\n```'
          },
          { 
            name: '🧠 **هوش مصنوعی و ابزارها**', 
            value: '```yml\n/askai 🤖 گفتگو با هوش مصنوعی هوشمند CCOIN AI\n/ping 📡 بررسی وضعیت اتصال و سلامت سیستم\n/admin 🛡️ پنل مدیریت (ویژه ادمین‌ها)\n```'
          },
          { 
            name: '🔥 **ویژگی‌های جدید**', 
            value: '• **بازی گرگینه**: مبارزه هیجان‌انگیز گروهی با نقش‌های متنوع 🐺\n• **سیستم دوستی پیشرفته**: تعامل بیشتر و پاداش‌های ویژه دوستان 👥\n• **هوش مصنوعی CCOIN AI**: دستیار شخصی با قابلیت‌های پیشرفته 🧠\n• **بخش گروه‌بازی‌ها**: ورود آسان‌تر و تجربه گیم‌پلی روان‌تر 🎯'
          },
          { 
            name: '📚 **راهنمای تعاملی**', 
            value: 'برای مشاهده راهنمای کامل و تعاملی، روی دکمه **"راهنمای جامع"** کلیک کنید.\nدر آنجا می‌توانید به‌صورت دسته‌بندی شده با تمام قابلیت‌های ربات آشنا شوید! 🌟'
          }
        )
        .setImage('https://img.icons8.com/fluency/96/shooting-stars.png')
        .setFooter({ 
          text: 'از Ccoin Bot v1.5.0 با هوش مصنوعی اختصاصی CCOIN AI لذت ببرید! | برای شروع از /menu استفاده کنید', 
          iconURL: interaction.client.user?.displayAvatarURL() 
        })
        .setTimestamp();
      
      // ساخت دکمه‌های زیبا برای دسترسی به راهنمای کامل و منو
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help')
            .setLabel('✨ راهنمای کامل')
            .setEmoji('📚')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('بازگشت به منوی اصلی')
            .setEmoji('🏠')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('feedback')
            .setLabel('ارسال بازخورد')
            .setEmoji('💬')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // استفاده از reply مستقیم به جای editReply
      await interaction.reply({
        embeds: [helpEmbed],
        components: [row]
      });
    } catch (error) {
      console.error('Error in help command:', error);
      
      // بررسی وضعیت پاسخ
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠️ خطا در نمایش راهنما! لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
    }
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
      
      // بررسی دسترسی کاربر - اطمینان از اینکه کاربر ادمین است
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        console.log(`User ${interaction.user.username} (${interaction.user.id}) attempted to access admin panel without permission`);
        await interaction.editReply({
          content: '⛔ شما دسترسی لازم برای استفاده از پنل ادمین را ندارید! این دستور فقط برای ادمین‌های سرور قابل استفاده است.'
        });
        return;
      }
      
      // لاگ کردن استفاده از پنل ادمین برای امنیت بیشتر
      console.log(`Admin panel accessed by ${interaction.user.username} (${interaction.user.id})`);
      
      
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

// Command for ping with comprehensive monitoring approach
// پیش‌تر وارد شده است

const ping = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 نمایش وضعیت سیستم و اتصالات ربات'),
  
  async execute(interaction: any) {
    try {
      // برای بررسی دقیق‌تر استفاده می‌کنیم - از flags استفاده می‌کنیم به جای ephemeral
      await interaction.deferReply({ flags: 64 }); // 64 معادل Ephemeral flag است
      
      // بررسی سرعت اتصال دیسکورد
      let discordPing = interaction.client.ws.ping;
      
      // اطمینان از معتبر بودن مقدار پینگ
      if (discordPing < 0 || isNaN(discordPing)) {
        discordPing = 0; // مقدار پیش‌فرض در صورت نامعتبر بودن
      }
      
      // زمان آنلاین ربات به ساعت و دقیقه
      const uptime = interaction.client.uptime;
      const days = Math.floor(uptime / 86400000);
      const hours = Math.floor((uptime % 86400000) / 3600000);
      const minutes = Math.floor((uptime % 3600000) / 60000);
      
      // وضعیت پینگ دیسکورد با آستانه‌های بهینه‌سازی شده
      const discordStatus = discordPing === 0 ? '⚫ نامشخص' :
                        discordPing < 120 ? '🟢 عالی' : 
                        discordPing < 250 ? '🟡 متوسط' : 
                        discordPing < 750 ? '🟠 ضعیف' : 
                        '⚫ ناپایدار';
      
      // بررسی اتصال به مونگو دی‌بی با تایمینگ
      let mongoStatus = '⚫ نامشخص';
      let mongoPing = -1;
      
      try {
        const startTime = Date.now();
        // بررسی اتصال به دیتابیس با واکشی یک مورد ساده
        await storage.getAllUsers(1); // فقط یک کاربر برای تست سرعت
        const endTime = Date.now();
        mongoPing = endTime - startTime;
        
        // وضعیت پینگ مونگو با آستانه‌های بهینه‌سازی شده
        mongoStatus = mongoPing < 120 ? '🟢 عالی' : 
                     mongoPing < 250 ? '🟡 متوسط' : 
                     mongoPing < 750 ? '🟠 ضعیف' : 
                     '⚫ ناپایدار';
      } catch (dbError) {
        console.error('MongoDB ping test failed:', dbError);
        mongoStatus = '🔴 قطع';
        mongoPing = -1;
      }
      
      // تست سرعت پاسخ‌گویی هوش مصنوعی
      let aiStatus = '⚫ نامشخص';
      let aiPing = -1;
      let aiErrorMessage = '';
      
      // انجام تست پینگ سرویس فعال هوش مصنوعی (CCOIN AI)
      aiPing = await pingCurrentAIService();
      
      // نام نمایشی سرویس هوش مصنوعی
      const aiServiceDisplayName = 'CCOIN AI';
      
      // بررسی وضعیت پینگ هوش مصنوعی با آستانه‌های جدید و بهبود یافته
      if (aiPing > 0) {
        // پینگ موفق با آستانه‌های بهینه‌سازی شده
        // طبقه‌بندی دقیق‌تر برای نمایش بهتر وضعیت
        if (aiPing < 80) {
          aiStatus = '🟢 عالی';
        } else if (aiPing < 170) {
          aiStatus = '🟢 خوب';
        } else if (aiPing < 300) {
          aiStatus = '🟡 متوسط';
        } else if (aiPing < 600) {
          aiStatus = '🟠 ضعیف';
        } else {
          aiStatus = '⚫ کند';
        }
      } else if (aiPing === -2) {
        // خطای تایم‌اوت در درخواست
        aiStatus = '⚫ تایم‌اوت';
        aiErrorMessage = `درخواست به سرویس ${aiServiceDisplayName} با تایم‌اوت مواجه شد`;
      } else if (aiPing === -429) {
        // خطای محدودیت تعداد درخواست‌ها یا اتمام اعتبار
        aiStatus = '🔴 خطا در اتصال';
        aiErrorMessage = `محدودیت استفاده از API ${aiServiceDisplayName} به پایان رسیده است`;
      } else if (aiPing === -401) {
        // خطای احراز هویت
        aiStatus = '🔴 خطا در اتصال';
        aiErrorMessage = `مشکل در احراز هویت API ${aiServiceDisplayName}`;
      } else if (aiPing === -500) {
        // خطای سرور
        aiStatus = '🔴 خطا در اتصال';
        aiErrorMessage = `سرورهای ${aiServiceDisplayName} با مشکل مواجه هستند`;
      } else {
        // سایر خطاها
        aiStatus = '🔴 خطا در اتصال';
        aiErrorMessage = `مشکل نامشخص در ارتباط با سرویس هوش مصنوعی ${aiServiceDisplayName}`;
      }
      
      // حذف پینگ API طبق درخواست کاربر
      
      // وضعیت کلی سیستم
      let overallStatus = '';
      
      // متغیر apiPing حذف شده است - فقط پینگ دیسکورد، دیتابیس و هوش مصنوعی نمایش داده می‌شود
      
      if (discordPing < 120 && mongoPing < 120 && aiPing > 0 && aiPing < 250) {
        overallStatus = '✅ همه سیستم‌ها آنلاین و پایدار هستند';
      } else if (mongoPing === -1) {
        overallStatus = '❌ اتصال به دیتابیس با مشکل مواجه است';
      } else if (aiPing === -2) {
        overallStatus = '❌ درخواست به سرویس هوش مصنوعی با تایم‌اوت مواجه شده است';
      } else if (aiPing === -429) {
        overallStatus = '❌ محدودیت استفاده از API هوش مصنوعی به پایان رسیده است';
      } else if (aiPing === -401) {
        overallStatus = '❌ خطای احراز هویت در سرویس هوش مصنوعی';
      } else if (aiPing === -500) {
        overallStatus = '❌ سرورهای CCOIN AI با مشکل مواجه هستند';
      } else if (aiPing < 0) {
        overallStatus = '❌ اتصال به سرویس هوش مصنوعی با مشکل مواجه است';
      } else if (discordPing > 750 || mongoPing > 750) {
        overallStatus = '⚫ ناپایداری در سیستم‌ها - نیاز به رفع مشکل';
      } else if (discordPing > 250 || mongoPing > 250) {
        overallStatus = '⚠️ تاخیر بیش از حد در بعضی سرویس‌ها';
      } else {
        overallStatus = '✓ سیستم‌ها در حال کار هستند';
      }
      
      // ایجاد یک امبد زیبا و کامل
      const pingEmbed = new EmbedBuilder()
        .setColor('#4B0082') // رنگ بنفش تیره برای جلوه بصری بهتر
        .setTitle('🏓 وضعیت سیستم Ccoin')
        .setDescription(`${overallStatus}\n\n**◼️ اطلاعات اتصال و پینگ:**`)
        .addFields([
          { 
            name: '🚀 پینگ دیسکورد', 
            value: discordPing > 0 ? `\`${discordPing}ms\` ${discordStatus}` : `\`نامشخص\` ${discordStatus}`, 
            inline: true 
          },
          { 
            name: '🗄️ پینگ دیتابیس', 
            value: mongoPing !== -1 ? `\`${mongoPing}ms\` ${mongoStatus}` : '`خطا در اتصال` 🔴', 
            inline: true 
          },

          { 
            name: '🧠 پینگ هوش مصنوعی', 
            value: aiPing > 0 ? `\`${aiPing}ms\` ${aiStatus}` : `\`${aiErrorMessage}\` ${aiStatus}`, 
            inline: true 
          },
          { 
            name: '⏱️ زمان آنلاین ربات', 
            value: `\`${days}\` روز \`${hours}\` ساعت \`${minutes}\` دقیقه`,
            inline: false 
          }
        ])
        .setThumbnail('https://img.icons8.com/fluency/96/radar.png')
        .setFooter({ 
          text: `🎮 ربات Ccoin | درخواست شده توسط ${interaction.user.username}`,
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();
      
      // دکمه منوی اصلی
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🏠 منوی اصلی')
            .setStyle(ButtonStyle.Primary)
        );
      
      // پاسخ به کاربر
      await interaction.editReply({ 
        embeds: [pingEmbed],
        components: [row]
      });
    } catch (error) {
      console.error('Error in ping command:', error);
      // در صورت خطا، پاسخ ساده می‌دهیم
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '⚠️ خطا در بررسی وضعیت سیستم!',
          });
        } else if (!interaction.replied) {
          await interaction.reply({
            content: '⚠️ خطا در اجرای دستور پینگ!',
            flags: 64 // استفاده از flags به جای ephemeral
          });
        }
      } catch (replyError) {
        console.error('Error while sending ping error response:', replyError);
      }
    }
  }
};

// Command to set up a tip channel
const tipChannel = {
  data: new SlashCommandBuilder()
    .setName('tipchannel')
    .setDescription('راه‌اندازی کانال برای ارسال خودکار نکات و راهنمایی‌ها')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // نیاز به دسترسی ادمین
    .addChannelOption(option => 
      option.setName('channel')
            .setDescription('کانال مورد نظر برای ارسال نکات')
            .setRequired(true))
    .addIntegerOption(option => 
      option.setName('interval')
            .setDescription('فاصله زمانی ارسال نکات (ساعت)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(24)),
  
  async execute(interaction: any) {
    try {
      // فقط ادمین‌ها می‌توانند از این دستور استفاده کنند
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        console.log(`User ${interaction.user.username} (${interaction.user.id}) attempted to use tipchannel command without permission`);
        await interaction.reply({
          content: '⛔ شما دسترسی لازم برای استفاده از این دستور را ندارید! این دستور فقط برای ادمین‌های سرور قابل استفاده است.',
          ephemeral: true
        });
        return;
      }
      
      // لاگ کردن استفاده از دستور برای امنیت بیشتر
      console.log(`Tip channel setup attempted by ${interaction.user.username} (${interaction.user.id})`);
      
      const channel = interaction.options.getChannel('channel');
      const interval = interaction.options.getInteger('interval');
      
      // بررسی معتبر بودن کانال
      // ChannelType.GuildText = 0 در دیسکورد جدید
      if (!channel || (channel.type !== 0 && channel.type !== 'GUILD_TEXT')) { // 0 = GUILD_TEXT
        await interaction.reply({
          content: '❌ لطفاً یک کانال متنی معتبر انتخاب کنید.',
          ephemeral: true
        });
        return;
      }
      
      // تبدیل ساعت به دقیقه برای استفاده در interval
      const intervalMinutes = interval * 60; // تبدیل ساعت به دقیقه
      
      // افزودن کانال به سیستم نکات
      try {
        const success = await addTipChannel(interaction.guildId, channel.id, intervalMinutes);
        
        if (!success) {
          await interaction.reply({
            content: '❌ خطا در تنظیم کانال نکات. لطفاً دوباره تلاش کنید.',
            ephemeral: true
          });
          return;
        }
      } catch (error) {
        console.error('Error setting up tip channel:', error);
        await interaction.reply({
          content: '❌ خطا در تنظیم کانال نکات. لطفاً با ادمین تماس بگیرید.',
          ephemeral: true
        });
        return;
      }
      const result = `کانال ${channel} با موفقیت برای ارسال نکات هر ${interval} ساعت تنظیم شد.`;
      
      // ایجاد Embed برای نمایش نتیجه
      const resultEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💡 سیستم نکات راه‌اندازی شد')
        .setDescription(result)
        .addFields(
          { name: '📋 کانال', value: `<#${channel.id}>`, inline: true },
          { name: '⏰ فاصله زمانی', value: `هر ${interval} ساعت`, inline: true }
        )
        .setFooter({ text: 'نکات آموزشی و راهنمایی‌های کاربردی به صورت خودکار در این کانال ارسال خواهند شد.' })
        .setTimestamp();
      
      await interaction.reply({
        embeds: [resultEmbed]
      });
    } catch (error) {
      console.error('Error in tipchannel command:', error);
      await interaction.reply({
        content: '⚠️ خطا در تنظیم کانال نکات! لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
};

// Command to disable tip channel
const unTipChannel = {
  data: new SlashCommandBuilder()
    .setName('untipchannel')
    .setDescription('غیرفعال کردن ارسال خودکار نکات')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // نیاز به دسترسی ادمین
  
  async execute(interaction: any) {
    try {
      // فقط ادمین‌ها می‌توانند از این دستور استفاده کنند
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        console.log(`User ${interaction.user.username} (${interaction.user.id}) attempted to use untipchannel command without permission`);
        await interaction.reply({
          content: '⛔ شما دسترسی لازم برای استفاده از این دستور را ندارید! این دستور فقط برای ادمین‌های سرور قابل استفاده است.',
          ephemeral: true
        });
        return;
      }
      
      // لاگ کردن استفاده از دستور برای امنیت بیشتر
      console.log(`Tip channel removal attempted by ${interaction.user.username} (${interaction.user.id})`);
      
      // غیرفعال کردن کانال نکات
      try {
        const success = await removeTipChannel(interaction.guildId);
        
        if (!success) {
          await interaction.reply({
            content: '❌ خطا در غیرفعال کردن سیستم نکات. لطفاً دوباره تلاش کنید.',
            ephemeral: true
          });
          return;
        }
      } catch (error) {
        console.error('Error removing tip channel:', error);
        await interaction.reply({
          content: '❌ خطا در غیرفعال کردن سیستم نکات. لطفاً با ادمین تماس بگیرید.',
          ephemeral: true
        });
        return;
      }
      const result = `سیستم ارسال خودکار نکات برای این سرور غیرفعال شد.`;
      
      // ایجاد Embed برای نمایش نتیجه
      const resultEmbed = new EmbedBuilder()
        .setColor('#FF9900')
        .setTitle('🔕 سیستم نکات غیرفعال شد')
        .setDescription(result)
        .setFooter({ text: 'برای فعال‌سازی مجدد از دستور /tipchannel استفاده کنید.' })
        .setTimestamp();
      
      await interaction.reply({
        embeds: [resultEmbed]
      });
    } catch (error) {
      console.error('Error in untipchannel command:', error);
      await interaction.reply({
        content: '⚠️ خطا در غیرفعال کردن کانال نکات! لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
};

// دستور گروه حذف شد و با منوی بازی‌ها یکپارچه شد

/**
 * تحلیل تصویر با استفاده از CCOIN AI
 * @param imageUrl آدرس تصویر
 * @param prompt درخواست برای تحلیل تصویر
 * @returns پاسخ هوش مصنوعی
 */
async function handleImageAnalysis(imageUrl: string, prompt: string): Promise<string> {
  try {
    // استفاده از سرویس CCOIN AI برای تحلیل تصویر
    const aiSettings = botConfig.getAISettings();
    const apiKey = aiSettings.apiKey;
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-vision-latest:generateContent";
    
    // ارسال درخواست به API
    const response = await axios.post(
      `${apiUrl}?key=${apiKey}`,
      {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: {
                mime_type: "image/jpeg",
                data: (await axios.get(imageUrl, { responseType: 'arraybuffer' }))
                  .data.toString('base64')
              }
            }
          ]
        }],
        generation_config: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 64
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // پردازش پاسخ API
    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const generatedText = response.data.candidates[0].content.parts[0].text;
      return generatedText;
    } else {
      throw new Error('ساختار پاسخ API غیرمنتظره');
    }
  } catch (error) {
    console.error('خطا در تحلیل تصویر:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      
      if (status === 400) {
        throw new Error('خطا در درخواست: فرمت تصویر نامعتبر یا حجم آن بیش از حد مجاز است');
      } else if (status === 401) {
        throw new Error('خطای احراز هویت: کلید API نامعتبر است');
      } else if (status === 429) {
        throw new Error('محدودیت نرخ API: تعداد درخواست‌ها بیش از حد مجاز است');
      } else if (status >= 500) {
        throw new Error(`خطای سرور API (${status})`);
      }
    }
    
    throw new Error(`خطای نامشخص در تحلیل تصویر: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
  }
}
// کاربران حالا می‌توانند از طریق منوی بازی‌ها به بازی‌های گروهی دسترسی داشته باشند

// Command for AI image analysis
const imageAnalyze = {
  data: new SlashCommandBuilder()
    .setName('image-analyze')
    .setDescription('🖼️ تحلیل و توصیف تصاویر با هوش مصنوعی')
    .addAttachmentOption(option => 
      option.setName('image')
            .setDescription('تصویری که می‌خواهید تحلیل شود')
            .setRequired(true)),
  
  async execute(interaction: any) {
    try {
      // نمایش "در حال تایپ" برای تعامل طولانی مدت
      await interaction.deferReply();
      
      // دریافت تصویر آپلود شده
      const attachment = interaction.options.getAttachment('image');
      
      // بررسی نوع فایل
      if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
        await interaction.editReply({
          content: '❌ لطفاً یک فایل تصویری معتبر (JPG، PNG، GIF و...) آپلود کنید.'
        });
        return;
      }
      
      // دریافت سرویس فعال هوش مصنوعی و پینگ برای بررسی وضعیت اتصال
      const aiPing = await pingCurrentAIService();
      
      // بررسی وضعیت اتصال به سرویس هوش مصنوعی
      if (aiPing < 0) {
        // تنظیم پیام خطا بر اساس کد پینگ
        let errorMessage = 'سرویس هوش مصنوعی در حال حاضر در دسترس نیست.';
        
        await interaction.editReply({
          content: `❌ ${errorMessage} لطفاً کمی بعد دوباره امتحان کنید.`
        });
        return;
      }
      
      // نمایش پیام در حال پردازش به کاربر
      await interaction.editReply({
        content: '🔍 **CCOIN AI** در حال تحلیل تصویر شما است... لطفاً چند لحظه صبر کنید.'
      });
      
      try {
        // استفاده از هوش مصنوعی برای تحلیل تصویر
        const prompt = "لطفاً این تصویر را به طور کامل توصیف کن. جزئیات را شرح بده، اشیاء را شناسایی کن و اگر متنی در تصویر وجود دارد، آن را استخراج کن. توضیحات را به صورت کامل و در پاراگراف‌های مجزا برای هر بخش از تصویر بنویس. پاسخ به فارسی باشد.";
        
        // فراخوانی سرویس هوش مصنوعی برای تصویر
        const imageUrl = attachment.url;
        const response = await handleImageAnalysis(imageUrl, prompt);
        
        // ایجاد امبد برای نمایش نتیجه
        const resultEmbed = new EmbedBuilder()
          .setColor('#4169E1')
          .setTitle('🔍 تحلیل تصویر با CCOIN AI')
          .setDescription(response)
          .setThumbnail(attachment.url)
          .setFooter({ 
            text: `درخواست شده توسط ${interaction.user.tag}`, 
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        // اضافه کردن تصویر به عنوان فیلد در امبد
        resultEmbed.setImage(attachment.url);
        
        // ارسال نتیجه به کاربر
        await interaction.editReply({
          content: null,
          embeds: [resultEmbed]
        });
        
      } catch (error) {
        console.error("Error analyzing image:", error);
        
        // پیام خطا به کاربر
        await interaction.editReply({
          content: `❌ خطا در تحلیل تصویر: ${error instanceof Error ? error.message : 'خطای نامشخص'}. لطفاً دوباره تلاش کنید یا از تصویر دیگری استفاده کنید.`
        });
      }
    } catch (error) {
      console.error('Error in image-analyze command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: '⚠️ خطا در اجرای دستور! لطفاً دوباره تلاش کنید.'
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ خطا در اجرای دستور! لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
    }
  }
};

// Command for content generation
const contentGenerate = {
  data: new SlashCommandBuilder()
    .setName('content-generate')
    .setDescription('📝 تولید محتوای متنی اختصاصی با هوش مصنوعی')
    .addStringOption(option => 
      option.setName('topic')
            .setDescription('موضوع یا درخواست شما برای تولید محتوا')
            .setRequired(true))
    .addStringOption(option => 
      option.setName('style')
            .setDescription('سبک مورد نظر برای محتوا')
            .setRequired(false)
            .addChoices(
              { name: 'استاندارد', value: 'standard' },
              { name: 'خلاقانه', value: 'creative' },
              { name: 'آکادمیک', value: 'academic' },
              { name: 'طنز', value: 'funny' },
              { name: 'رسمی', value: 'formal' }
            )),
  
  async execute(interaction: any) {
    try {
      // نمایش "در حال تایپ" برای تعامل طولانی مدت
      await interaction.deferReply();
      
      // دریافت موضوع و سبک
      const topic = interaction.options.getString('topic');
      const style = interaction.options.getString('style') || 'standard';
      
      // دریافت سرویس فعال هوش مصنوعی و پینگ برای بررسی وضعیت اتصال
      const aiPing = await pingCurrentAIService();
      
      // بررسی وضعیت اتصال به سرویس هوش مصنوعی
      if (aiPing < 0) {
        // تنظیم پیام خطا بر اساس کد پینگ
        let errorMessage = 'سرویس هوش مصنوعی در حال حاضر در دسترس نیست.';
        
        await interaction.editReply({
          content: `❌ ${errorMessage} لطفاً کمی بعد دوباره امتحان کنید.`
        });
        return;
      }
      
      // نمایش پیام در حال پردازش به کاربر
      await interaction.editReply({
        content: '✍️ **CCOIN AI** در حال تولید محتوا برای شما است... لطفاً چند لحظه صبر کنید.'
      });
      
      try {
        // تنظیم پرامپت براساس سبک انتخاب شده
        let stylePrompt = '';
        let temperature = 0.7;
        
        switch (style) {
          case 'creative':
            stylePrompt = 'محتوایی خلاقانه، جذاب و نوآورانه با زبانی شاعرانه تولید کن.';
            temperature = 0.9;
            break;
          case 'academic':
            stylePrompt = 'محتوایی آکادمیک، رسمی و علمی با ارجاعات مناسب تولید کن.';
            temperature = 0.3;
            break;
          case 'funny':
            stylePrompt = 'محتوایی طنزآمیز، سرگرم‌کننده و شوخ‌طبعانه تولید کن.';
            temperature = 0.95;
            break;
          case 'formal':
            stylePrompt = 'محتوایی رسمی، حرفه‌ای و مناسب برای محیط کار تولید کن.';
            temperature = 0.4;
            break;
          default:
            stylePrompt = 'محتوایی استاندارد، متعادل و کاربردی تولید کن.';
            temperature = 0.7;
        }
        
        // ایجاد پرامپت نهایی
        const finalPrompt = `
لطفاً در مورد موضوع "${topic}" ${stylePrompt}
محتوا باید منسجم، ساختاریافته و جامع باشد.
لطفاً از عنوان‌بندی مناسب، پاراگراف‌بندی صحیح و نشانه‌گذاری استفاده کن.
در صورت نیاز از بولت‌پوینت‌ها و شماره‌گذاری استفاده کن تا خوانایی بهبود یابد.
محتوا باید به زبان فارسی باشد.`;
        
        // فراخوانی سرویس هوش مصنوعی
        const response = await generateAIResponse(finalPrompt, 'aiAssistant', style === 'funny' ? 'طنزآمیز' : (style === 'creative' ? 'خلاقانه' : 'دقیق'));
        
        // ایجاد امبد برای نمایش نتیجه
        const resultEmbed = new EmbedBuilder()
          .setColor('#4169E1')
          .setTitle(`📝 محتوای تولید شده: ${topic.length > 50 ? topic.substring(0, 50) + '...' : topic}`)
          .setDescription(response.length > 4000 ? response.substring(0, 4000) + '...' : response)
          .setFooter({ 
            text: `تولید شده توسط CCOIN AI | سبک: ${style === 'standard' ? 'استاندارد' : style === 'creative' ? 'خلاقانه' : style === 'academic' ? 'آکادمیک' : style === 'funny' ? 'طنز' : 'رسمی'}`, 
            iconURL: interaction.client.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        // ارسال نتیجه به کاربر
        await interaction.editReply({
          content: null,
          embeds: [resultEmbed]
        });
        
      } catch (error) {
        console.error("Error generating content:", error);
        
        // پیام خطا به کاربر
        await interaction.editReply({
          content: `❌ خطا در تولید محتوا: ${error instanceof Error ? error.message : 'خطای نامشخص'}. لطفاً دوباره تلاش کنید.`
        });
      }
    } catch (error) {
      console.error('Error in content-generate command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: '⚠️ خطا در اجرای دستور! لطفاً دوباره تلاش کنید.'
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ خطا در اجرای دستور! لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
    }
  }
};

// Command for code assistance
const codeAssistant = {
  data: new SlashCommandBuilder()
    .setName('code-assistant')
    .setDescription('💻 کمک در نوشتن و دیباگ کد برنامه‌نویسی')
    .addStringOption(option => 
      option.setName('language')
            .setDescription('زبان برنامه‌نویسی')
            .setRequired(true)
            .addChoices(
              { name: 'JavaScript', value: 'javascript' },
              { name: 'Python', value: 'python' },
              { name: 'Java', value: 'java' },
              { name: 'C++', value: 'cpp' },
              { name: 'C#', value: 'csharp' },
              { name: 'PHP', value: 'php' },
              { name: 'Go', value: 'go' },
              { name: 'TypeScript', value: 'typescript' },
              { name: 'Ruby', value: 'ruby' },
              { name: 'Swift', value: 'swift' },
              { name: 'Kotlin', value: 'kotlin' },
              { name: 'Rust', value: 'rust' },
              { name: 'SQL', value: 'sql' },
              { name: 'HTML/CSS', value: 'html' },
              { name: 'سایر', value: 'other' }
            ))
    .addStringOption(option => 
      option.setName('query')
            .setDescription('درخواست یا کد شما')
            .setRequired(true))
    .addStringOption(option => 
      option.setName('task')
            .setDescription('نوع وظیفه')
            .setRequired(false)
            .addChoices(
              { name: 'نوشتن کد', value: 'writing' },
              { name: 'دیباگ', value: 'debugging' },
              { name: 'بهینه‌سازی', value: 'optimization' },
              { name: 'توضیح کد', value: 'explanation' },
              { name: 'تبدیل کد', value: 'conversion' }
            )),
  
  async execute(interaction: any) {
    try {
      // نمایش "در حال تایپ" برای تعامل طولانی مدت
      await interaction.deferReply();
      
      // دریافت زبان، درخواست و وظیفه
      const language = interaction.options.getString('language');
      const query = interaction.options.getString('query');
      const task = interaction.options.getString('task') || 'writing';
      
      // دریافت سرویس فعال هوش مصنوعی و پینگ برای بررسی وضعیت اتصال
      const aiPing = await pingCurrentAIService();
      
      // بررسی وضعیت اتصال به سرویس هوش مصنوعی
      if (aiPing < 0) {
        // تنظیم پیام خطا بر اساس کد پینگ
        let errorMessage = 'سرویس هوش مصنوعی در حال حاضر در دسترس نیست.';
        
        await interaction.editReply({
          content: `❌ ${errorMessage} لطفاً کمی بعد دوباره امتحان کنید.`
        });
        return;
      }
      
      // نمایش پیام در حال پردازش به کاربر
      await interaction.editReply({
        content: '💻 **CCOIN AI** در حال کار روی کد شما است... لطفاً چند لحظه صبر کنید.'
      });
      
      try {
        // تنظیم پرامپت براساس وظیفه انتخاب شده
        let taskPrompt = '';
        
        switch (task) {
          case 'debugging':
            taskPrompt = 'مشکلات این کد را پیدا کن و راه‌حل‌های رفع آن‌ها را با توضیحات کامل ارائه بده.';
            break;
          case 'optimization':
            taskPrompt = 'این کد را برای بهبود کارایی و خوانایی بهینه‌سازی کن و بهبودهای اعمال شده را توضیح بده.';
            break;
          case 'explanation':
            taskPrompt = 'این کد را خط به خط با جزئیات کامل توضیح بده تا درک آن برای افراد مبتدی آسان باشد.';
            break;
          case 'conversion':
            taskPrompt = 'این کد را به بهترین شکل ممکن به زبان‌های برنامه‌نویسی دیگر تبدیل کن (حداقل یک زبان دیگر).';
            break;
          default:
            taskPrompt = 'کد مناسب را براساس درخواست نوشته و با توضیحات کامل ارائه بده.';
        }
        
        // ایجاد پرامپت نهایی
        const finalPrompt = `
لطفاً به عنوان یک متخصص برنامه‌نویسی حرفه‌ای در زبان ${language}، به این درخواست پاسخ بده:

${query}

${taskPrompt}

در پاسخ خود:
1. کد را داخل بلوک‌های مناسب \`\`\` قرار بده.
2. توضیحات کاملی درباره منطق و رویکرد حل مسئله ارائه بده.
3. اگر چند رویکرد مختلف وجود دارد، بهترین رویکرد را با ذکر مزایا و معایب پیشنهاد بده.
4. در صورت امکان، مثال‌هایی از نحوه استفاده از کد ارائه بده.
5. بهترین شیوه‌های برنامه‌نویسی را در پاسخ خود رعایت کن.

لطفاً پاسخ را به زبان فارسی ارائه بده.`;
        
        // فراخوانی سرویس هوش مصنوعی
        const response = await generateAIResponse(finalPrompt, 'aiAssistant', 'دقیق');
        
        // ایجاد امبد برای نمایش نتیجه
        const resultEmbed = new EmbedBuilder()
          .setColor('#4169E1')
          .setTitle(`💻 دستیار کد: ${task === 'writing' ? 'نوشتن کد' : task === 'debugging' ? 'دیباگ کد' : task === 'optimization' ? 'بهینه‌سازی کد' : task === 'explanation' ? 'توضیح کد' : 'تبدیل کد'}`)
          .setDescription(response.length > 4000 ? response.substring(0, 4000) + '\n\n*محتوا به دلیل طولانی بودن کوتاه شده است*' : response)
          .setFooter({ 
            text: `زبان: ${language} | تولید شده توسط CCOIN AI`, 
            iconURL: interaction.client.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        // ارسال نتیجه به کاربر
        await interaction.editReply({
          content: null,
          embeds: [resultEmbed]
        });
        
      } catch (error) {
        console.error("Error in code assistant:", error);
        
        // پیام خطا به کاربر
        await interaction.editReply({
          content: `❌ خطا در پردازش درخواست کد: ${error instanceof Error ? error.message : 'خطای نامشخص'}. لطفاً دوباره تلاش کنید.`
        });
      }
    } catch (error) {
      console.error('Error in code-assistant command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: '⚠️ خطا در اجرای دستور! لطفاً دوباره تلاش کنید.'
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ خطا در اجرای دستور! لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
    }
  }
};

// Command for learning assistant
const learn = {
  data: new SlashCommandBuilder()
    .setName('learn')
    .setDescription('📚 دریافت آموزش در موضوعات مختلف')
    .addStringOption(option => 
      option.setName('topic')
            .setDescription('موضوع مورد نظر برای یادگیری')
            .setRequired(true))
    .addStringOption(option => 
      option.setName('level')
            .setDescription('سطح آموزش')
            .setRequired(false)
            .addChoices(
              { name: 'مبتدی', value: 'beginner' },
              { name: 'متوسط', value: 'intermediate' },
              { name: 'پیشرفته', value: 'advanced' }
            )),
  
  async execute(interaction: any) {
    try {
      // نمایش "در حال تایپ" برای تعامل طولانی مدت
      await interaction.deferReply();
      
      // دریافت موضوع و سطح
      const topic = interaction.options.getString('topic');
      const level = interaction.options.getString('level') || 'beginner';
      
      // دریافت سرویس فعال هوش مصنوعی و پینگ برای بررسی وضعیت اتصال
      const aiPing = await pingCurrentAIService();
      
      // بررسی وضعیت اتصال به سرویس هوش مصنوعی
      if (aiPing < 0) {
        // تنظیم پیام خطا بر اساس کد پینگ
        let errorMessage = 'سرویس هوش مصنوعی در حال حاضر در دسترس نیست.';
        
        await interaction.editReply({
          content: `❌ ${errorMessage} لطفاً کمی بعد دوباره امتحان کنید.`
        });
        return;
      }
      
      // نمایش پیام در حال پردازش به کاربر
      await interaction.editReply({
        content: '📚 **CCOIN AI** در حال آماده‌سازی محتوای آموزشی برای شما است... لطفاً چند لحظه صبر کنید.'
      });
      
      try {
        // تنظیم پرامپت براساس سطح انتخاب شده
        let levelPrompt = '';
        
        switch (level) {
          case 'beginner':
            levelPrompt = 'مبتدی (بدون نیاز به دانش قبلی، با مفاهیم پایه و اساسی شروع کن)';
            break;
          case 'intermediate':
            levelPrompt = 'متوسط (با فرض آشنایی با مفاهیم پایه، جزئیات بیشتر و نکات کاربردی را توضیح بده)';
            break;
          case 'advanced':
            levelPrompt = 'پیشرفته (با فرض تسلط بر مفاهیم پایه و متوسط، به تکنیک‌های پیشرفته و دانش عمیق بپرداز)';
            break;
          default:
            levelPrompt = 'مبتدی (بدون نیاز به دانش قبلی، با مفاهیم پایه و اساسی شروع کن)';
        }
        
        // ایجاد پرامپت نهایی
        const finalPrompt = `
لطفاً یک آموزش جامع و ساختارمند در مورد "${topic}" در سطح ${levelPrompt} ارائه بده.

لطفاً این آموزش را به صورت زیر ساختاربندی کن:
1. **مقدمه**: توضیح کوتاهی در مورد اهمیت و کاربردهای موضوع
2. **مفاهیم اصلی**: معرفی و توضیح مفاهیم کلیدی با ترتیب منطقی
3. **نکات کاربردی**: نکات عملی و کاربردی مرتبط با موضوع
4. **مثال‌ها**: ارائه مثال‌های روشن و قابل درک
5. **منابع تکمیلی**: پیشنهاد منابع و ابزارهای مفید برای یادگیری بیشتر

از عنوان‌بندی مناسب، پاراگراف‌بندی منظم، و عناصر بصری مثل بولت‌پوینت‌ها و لیست‌های شماره‌دار استفاده کن.
محتوا باید به زبان فارسی و با استفاده از اصطلاحات تخصصی در کنار معادل‌های انگلیسی باشد.`;
        
        // فراخوانی سرویس هوش مصنوعی
        const response = await generateAIResponse(finalPrompt, 'aiAssistant', 'دقیق');
        
        // ایجاد امبد برای نمایش نتیجه
        const resultEmbed = new EmbedBuilder()
          .setColor('#4169E1')
          .setTitle(`📚 آموزش: ${topic}`)
          .setDescription(response.length > 4000 ? response.substring(0, 4000) + '\n\n*محتوا به دلیل طولانی بودن کوتاه شده است*' : response)
          .setFooter({ 
            text: `سطح: ${level === 'beginner' ? 'مبتدی' : level === 'intermediate' ? 'متوسط' : 'پیشرفته'} | تولید شده توسط CCOIN AI`, 
            iconURL: interaction.client.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        // ارسال نتیجه به کاربر
        await interaction.editReply({
          content: null,
          embeds: [resultEmbed]
        });
        
      } catch (error) {
        console.error("Error in learning assistant:", error);
        
        // پیام خطا به کاربر
        await interaction.editReply({
          content: `❌ خطا در تولید محتوای آموزشی: ${error instanceof Error ? error.message : 'خطای نامشخص'}. لطفاً دوباره تلاش کنید.`
        });
      }
    } catch (error) {
      console.error('Error in learn command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: '⚠️ خطا در اجرای دستور! لطفاً دوباره تلاش کنید.'
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ خطا در اجرای دستور! لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      }
    }
  }
};

// Command for AI interaction
const hf = {
  data: new SlashCommandBuilder()
    .setName('askai')
    .setDescription('🧠 گفتگو با هوش مصنوعی پیشرفته')
    .addStringOption(option => 
      option.setName('prompt')
            .setDescription('سوال یا درخواست خود را به فارسی یا انگلیسی وارد کنید')
            .setRequired(true)),
  
  async execute(interaction: any) {
    try {
      // نمایش "در حال تایپ" برای تعامل طولانی مدت
      await interaction.deferReply();
      
      // دریافت سرویس فعال هوش مصنوعی و پینگ برای بررسی وضعیت اتصال
      const activeService = botConfig.getActiveAIService();
      const aiPing = await pingCurrentAIService();
      
      // تعیین نام نمایشی سرویس هوش مصنوعی - CCOIN AI
      const aiServiceDisplayName = 'CCOIN AI';
      
      // بررسی وضعیت اتصال بر اساس پینگ
      if (aiPing < 0) {
        // تنظیم پیام خطا بر اساس کد پینگ
        let errorMessage = '';
        let statusCode = 0;
        
        if (aiPing === -2) {
          errorMessage = `درخواست به سرویس ${aiServiceDisplayName} با تایم‌اوت مواجه شد`;
          statusCode = 408; // Request Timeout
        } else if (aiPing === -429) {
          errorMessage = `محدودیت استفاده از API ${aiServiceDisplayName} به پایان رسیده است`;
          statusCode = 429;
        } else if (aiPing === -401) {
          errorMessage = `مشکل در احراز هویت API ${aiServiceDisplayName}`;
          statusCode = 401;
        } else if (aiPing === -500) {
          errorMessage = `سرورهای ${aiServiceDisplayName} با مشکل مواجه هستند`;
          statusCode = 500;
        } else {
          errorMessage = `مشکل نامشخص در ارتباط با سرویس هوش مصنوعی ${aiServiceDisplayName}`;
          statusCode = 400;
        }
        
        // ایموجی و رنگ متناسب با نوع خطا
        let errorIcon = '⚠️'; // ایموجی پیش‌فرض
        let errorColor = '#FF0000'; // رنگ پیش‌فرض (قرمز)
        let secondaryIcon = '🔄';
        
        // تنظیم ایموجی و رنگ بر اساس نوع خطا
        if (statusCode === 429) {
          errorIcon = '⏰';
          secondaryIcon = '💸';
          errorColor = '#FF9800'; // نارنجی
        } else if (statusCode === 408) {
          errorIcon = '⌛';
          secondaryIcon = '🔌';
          errorColor = '#795548'; // قهوه‌ای
        } else if (statusCode === 401) {
          errorIcon = '🔒';
          secondaryIcon = '🔑';
          errorColor = '#9C27B0'; // بنفش
        } else if (statusCode === 500) {
          errorIcon = '🔥';
          secondaryIcon = '🛠️';
          errorColor = '#F44336'; // قرمز روشن
        }
        
        // خط تزئینی با ایموجی‌ها
        const decorativeLine = `${secondaryIcon} ${secondaryIcon} ${secondaryIcon} ${errorIcon} ${secondaryIcon} ${secondaryIcon} ${secondaryIcon}`;
        
        // نمایش خطا به کاربر
        const errorEmbed = new EmbedBuilder()
          .setColor(errorColor as ColorResolvable)
          .setTitle(`${errorIcon} سرویس هوش مصنوعی در دسترس نیست ${errorIcon}`)
          .setDescription(`${decorativeLine}\n\n${errorMessage}\n\n${decorativeLine}`)
          .addFields([
            {
              name: `${secondaryIcon} راه حل پیشنهادی ${secondaryIcon}`,
              value: statusCode === 429 
                ? '```سهمیه API به پایان رسیده است. لطفاً با مدیر سیستم تماس بگیرید تا نسبت به شارژ یا تمدید حساب کاربری اقدام نماید.```'
                : '```لطفاً بعداً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.```'
            }
          ])
          .setFooter({ 
            text: `درخواست: ${interaction.user.username} | از هوش مصنوعی Ccoin`,
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }
      
      // دریافت پرسش کاربر
      const prompt = interaction.options.getString('prompt');
      
      // ارسال درخواست به سرویس هوش مصنوعی فعال
      const response = await generateAIResponse(prompt, "aiAssistant");
      
      // بررسی اینکه آیا پاسخ حاوی پیام خطا است
      if (response.startsWith('⚠️')) {
        // ایموجی و رنگ متناسب با نوع خطا
        let errorIcon = '⚠️'; // ایموجی پیش‌فرض
        let errorColor = '#FF0000'; // رنگ پیش‌فرض (قرمز)
        let secondaryIcon = '🔄';
        
        // تعیین نوع خطا بر اساس محتوای پیام
        if (response.includes('محدودیت') || response.includes('حداکثر')) {
          errorIcon = '⏰';
          secondaryIcon = '💸';
          errorColor = '#FF9800'; // نارنجی
        } else if (response.includes('زمان') || response.includes('تایم')) {
          errorIcon = '⌛';
          secondaryIcon = '🔌';
          errorColor = '#795548'; // قهوه‌ای
        } else if (response.includes('دسترسی') || response.includes('اجازه')) {
          errorIcon = '🔒';
          secondaryIcon = '🔑';
          errorColor = '#9C27B0'; // بنفش
        } else if (response.includes('سرور') || response.includes('خدمات')) {
          errorIcon = '🔥';
          secondaryIcon = '🛠️';
          errorColor = '#F44336'; // قرمز روشن
        }
        
        // خط تزئینی با ایموجی‌ها
        const decorativeLine = `${secondaryIcon} ${secondaryIcon} ${secondaryIcon} ${errorIcon} ${secondaryIcon} ${secondaryIcon} ${secondaryIcon}`;
        
        // اگر پیام با علامت خطا شروع شود، به عنوان خطا نمایش دهیم
        const errorEmbed = new EmbedBuilder()
          .setColor(errorColor as ColorResolvable)
          .setTitle(`${errorIcon} خطا در سرویس هوش مصنوعی ${errorIcon}`)
          .setDescription(`${decorativeLine}\n\n${response}\n\n${decorativeLine}`)
          .setFooter({ 
            text: `درخواست: ${interaction.user.username} | از هوش مصنوعی Ccoin`,
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        // تعیین ایموجی‌ها و رنگ متناسب با محتوای پاسخ
        let mainEmoji = '🧠'; // ایموجی پیش‌فرض
        let secondaryEmoji = '✨'; 
        let embedColor = '#8A2BE2'; // رنگ پیش‌فرض (بنفش تیره)
        
        // تشخیص نوع محتوا و تنظیم ایموجی و رنگ مناسب
        if (response.includes('اقتصاد') || response.includes('سکه') || response.includes('بانک') || response.includes('پول')) {
          mainEmoji = '💰';
          secondaryEmoji = '📊';
          embedColor = '#FFD700'; // رنگ طلایی
        } else if (response.includes('بازی') || response.includes('گرگینه') || response.includes('مافیا') || response.includes('بینگو')) {
          mainEmoji = '🎮';
          secondaryEmoji = '🎲';
          embedColor = '#00CED1'; // فیروزه‌ای
        } else if (response.includes('کلن') || response.includes('گروه') || response.includes('تیم')) {
          mainEmoji = '🏰';
          secondaryEmoji = '👥';
          embedColor = '#A52A2A'; // قهوه‌ای
        } else if (response.includes('دوست') || response.includes('اجتماعی') || response.includes('چت')) {
          mainEmoji = '👥';
          secondaryEmoji = '💌';
          embedColor = '#FF1493'; // صورتی تیره
        } else if (response.includes('دستور') || response.includes('کمک') || response.includes('راهنما')) {
          mainEmoji = '📚';
          secondaryEmoji = '❓';
          embedColor = '#1E90FF'; // آبی روشن
        }
        
        // افزودن خط تزئینی با ایموجی‌ها
        const decorativeLine = `${secondaryEmoji} ${secondaryEmoji} ${secondaryEmoji} ${mainEmoji} ${secondaryEmoji} ${secondaryEmoji} ${secondaryEmoji}`;
        
        // ایجاد Embed برای پاسخ با ظاهر جذاب‌تر
        const chatEmbed = new EmbedBuilder()
          .setColor(embedColor as ColorResolvable)
          .setTitle(`${mainEmoji} هوش مصنوعی Ccoin (${aiServiceDisplayName}) ${mainEmoji}`)
          .setDescription(`${decorativeLine}\n\n${response}\n\n${decorativeLine}`)
          .addFields([{
            name: `${secondaryEmoji} پرسش شما ${secondaryEmoji}`,
            value: `\`\`\`${prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt}\`\`\``
          }])
          .setFooter({ 
            text: `درخواست توسط: ${interaction.user.username} | با قدرت هوش مصنوعی پیشرفته Ccoin`,
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        // پاسخ به کاربر
        await interaction.editReply({ embeds: [chatEmbed] });
      }
    } catch (error: any) {
      console.error('Error in hf command:', error);
      
      // پیام خطای مناسب بر اساس نوع خطا
      let errorMessage = '⚠️ خطا در ارتباط با هوش مصنوعی! لطفاً بعداً دوباره تلاش کنید.';
      let errorTitle = '⚠️ خطا در سرویس هوش مصنوعی';
      
      // بررسی نوع خطا
      if (error instanceof Error) {
        const errorStr = error.toString().toLowerCase();
        const activeService = botConfig.getActiveAIService();
        
        if (errorStr.includes('429') || errorStr.includes('exceeded your current quota')) {
          errorMessage = `⚠️ محدودیت استفاده از سرویس ${activeService} به پایان رسیده است. لطفاً این موضوع را به مدیر سیستم اطلاع دهید.`;
          errorTitle = '⚠️ محدودیت API به پایان رسیده است';
        } else if (errorStr.includes('401') || errorStr.includes('403') || errorStr.includes('auth')) {
          errorMessage = `⚠️ خطا در دسترسی به سرویس ${activeService}. کلید API نامعتبر است یا دسترسی ندارد.`;
          errorTitle = `⚠️ خطای احراز هویت در سرویس ${activeService}`;
        } else if (errorStr.includes('500')) {
          errorMessage = `⚠️ سرورهای ${activeService} در حال حاضر با مشکل مواجه هستند. لطفاً بعداً دوباره تلاش کنید.`;
          errorTitle = `⚠️ خطای سرور ${activeService}`;
        }
      }
      
      // ایموجی و رنگ متناسب با نوع خطا
      let errorIcon = '⚠️'; // ایموجی پیش‌فرض
      let errorColor = '#FF0000'; // رنگ پیش‌فرض (قرمز)
      let secondaryIcon = '🔄';
      
      // تعیین ایموجی و رنگ بر اساس نوع خطا
      const errorString = error.toString().toLowerCase();
      if (errorString.includes('429') || errorString.includes('quota')) {
        errorIcon = '⏰';
        secondaryIcon = '💸';
        errorColor = '#FF9800'; // نارنجی
      } else if (errorString.includes('timeout') || errorString.includes('time')) {
        errorIcon = '⌛';
        secondaryIcon = '🔌';
        errorColor = '#795548'; // قهوه‌ای
      } else if (errorString.includes('401') || errorString.includes('403') || errorString.includes('auth')) {
        errorIcon = '🔒';
        secondaryIcon = '🔑';
        errorColor = '#9C27B0'; // بنفش
      } else if (errorString.includes('500')) {
        errorIcon = '🔥';
        secondaryIcon = '🛠️';
        errorColor = '#F44336'; // قرمز روشن
      }
      
      // خط تزئینی با ایموجی‌ها
      const decorativeLine = `${secondaryIcon} ${secondaryIcon} ${secondaryIcon} ${errorIcon} ${secondaryIcon} ${secondaryIcon} ${secondaryIcon}`;
      
      // ایجاد Embed برای خطا
      const errorEmbed = new EmbedBuilder()
        .setColor(errorColor as ColorResolvable)
        .setTitle(`${errorIcon} ${errorTitle} ${errorIcon}`)
        .setDescription(`${decorativeLine}\n\n${errorMessage}\n\n${decorativeLine}`)
        .setFooter({ 
          text: `درخواست: ${interaction.user.username} | از هوش مصنوعی Ccoin`,
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else if (!interaction.replied) {
          await interaction.reply({
            embeds: [errorEmbed],
            flags: 64 // استفاده از flags به جای ephemeral
          });
        }
      } catch (replyError) {
        console.error('Error while sending hf error response:', replyError);
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
  client.commands.set(ping.data.name, ping);
  client.commands.set(tipChannel.data.name, tipChannel);
  client.commands.set(unTipChannel.data.name, unTipChannel);
  // کامند بازی‌های گروهی حذف شد و با منوی بازی‌ها یکپارچه شد
  client.commands.set(hf.data.name, hf); // Add the CCOIN AI command
  client.commands.set(imageAnalyze.data.name, imageAnalyze); // Add image analysis command
  client.commands.set(contentGenerate.data.name, contentGenerate); // Add content generation command
  client.commands.set(codeAssistant.data.name, codeAssistant); // Add code assistant command
  client.commands.set(learn.data.name, learn); // Add learning assistant command
  
  // تنظیم کانال بازخورد
  const setFeedbackChannel = {
    data: setFeedbackChannelCommand,
    execute: executeSetFeedbackChannel
  };
  client.commands.set(setFeedbackChannelCommand.name, setFeedbackChannel);
  
  // دستورات مربوط به سیستم دزدی
  const timeThief = {
    data: timeThiefCommand,
    execute: executeTimeThief
  };
  const unTimeThief = {
    data: unTimeThiefCommand,
    execute: executeUnTimeThief
  };
  client.commands.set('timethief', timeThief);
  client.commands.set('untimethief', unTimeThief);
}

export const commands = [
  menu.data.toJSON(),
  balance.data.toJSON(),
  daily.data.toJSON(),
  help.data.toJSON(),
  admin.data.toJSON(),
  ping.data.toJSON(),
  tipChannel.data.toJSON(),
  unTipChannel.data.toJSON(),
  // کامند بازی‌های گروهی حذف شد و با منوی بازی‌ها یکپارچه شد
  hf.data.toJSON(), // Add the CCOIN AI command to slash commands
  imageAnalyze.data.toJSON(), // دستور تحلیل تصاویر با هوش مصنوعی
  contentGenerate.data.toJSON(), // دستور تولید محتوا با هوش مصنوعی
  codeAssistant.data.toJSON(), // دستور کمک در برنامه‌نویسی با هوش مصنوعی
  learn.data.toJSON(), // دستور دریافت آموزش از هوش مصنوعی
  timeThiefCommand.toJSON(), // کامند فعال‌سازی اطلاع‌رسانی دزدی 
  unTimeThiefCommand.toJSON(), // کامند غیرفعال‌سازی اطلاع‌رسانی دزدی
  setFeedbackChannelCommand.toJSON() // کامند تنظیم کانال بازخورد
];
