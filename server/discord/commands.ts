import { SlashCommandBuilder, Collection, Client, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable } from 'discord.js';
import { storage } from '../storage';
import { mainMenu } from './components/mainMenu';
import { adminMenu } from '../discord/components/adminMenu';
import { setupTipSystem, addTipChannel, removeTipChannel, toggleTipChannel, updateTipChannel, updateTipInterval, sendImmediateTip } from './components/tipSystem';
import { handleGroupGamesMenu } from './components/groupGames';
import { huggingFaceService } from './services/huggingface';

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
      // ایجاد Embed زیبا برای راهنما
      const helpEmbed = new EmbedBuilder()
        .setColor('#FFFF99') // رنگ زرد روشن برای حس شادابی و انرژی
        .setTitle('📖 راهنمای جامع ربات Ccoin 🌟')
        .setDescription('به دنیای مجازی اقتصاد و سرگرمی Ccoin خوش اومدی! برای استفاده از ربات می‌تونی از دستورات زیر استفاده کنی:')
        .setThumbnail(interaction.client.user?.displayAvatarURL() || '')
        .addFields(
          { 
            name: '🔸 **دستورات اصلی**', 
            value: '`/menu` - منوی اصلی با تمام امکانات (اقتصاد، بازی‌ها، فروشگاه و...)\n' +
                  '`/balance` - بررسی سریع موجودی حساب\n' +
                  '`/daily` - دریافت پاداش روزانه (هر 24 ساعت یکبار)\n' +
                  '`/help` - نمایش این راهنما\n' +
                  '`/admin` - پنل مدیریت (مخصوص ادمین‌ها)\n' +
                  '`/ping` - بررسی وضعیت اتصال به ربات\n' +
                  '`/hf` - گفتگو با هوش مصنوعی Hugging Face و دریافت پاسخ هوشمند'
          },
          { 
            name: '📜 **راهنمای کامل‌تر**', 
            value: 'برای مشاهده راهنمای کامل‌تر و جزئیات هر بخش، روی دکمه "راهنمای جامع" کلیک کنید.\n' +
                  'در آنجا می‌توانید با تمام ویژگی‌های ربات آشنا شوید! 📚'
          }
        )
        .setFooter({ 
          text: 'از Ccoin Bot v1.5.0 با پشتیبانی هوش مصنوعی Hugging Face لذت ببرید! | برای شروع از /menu استفاده کنید', 
          iconURL: interaction.client.user?.displayAvatarURL() 
        })
        .setTimestamp();
      
      // ساخت دکمه برای دسترسی به راهنمای کامل
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help')
            .setLabel('📚 راهنمای جامع')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🏠 منوی اصلی')
            .setStyle(ButtonStyle.Success)
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

// Command for ping with comprehensive monitoring approach
// پیش‌تر وارد شده است

const ping = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 نمایش وضعیت سیستم و اتصالات ربات'),
  
  async execute(interaction: any) {
    try {
      // برای بررسی دقیق‌تر استفاده می‌کنیم
      await interaction.deferReply({ ephemeral: true });
      
      // بررسی سرعت اتصال دیسکورد
      const discordPing = interaction.client.ws.ping;
      
      // زمان آنلاین ربات به ساعت و دقیقه
      const uptime = interaction.client.uptime;
      const days = Math.floor(uptime / 86400000);
      const hours = Math.floor((uptime % 86400000) / 3600000);
      const minutes = Math.floor((uptime % 3600000) / 60000);
      
      // وضعیت پینگ دیسکورد
      const discordStatus = discordPing < 100 ? '🟢 عالی' : discordPing < 300 ? '🟡 متوسط' : '🔴 ضعیف';
      
      // بررسی اتصال به مونگو دی‌بی با تایمینگ
      let mongoStatus = '⚫ نامشخص';
      let mongoPing = -1;
      
      try {
        const startTime = Date.now();
        // بررسی اتصال به دیتابیس با واکشی یک مورد ساده
        await storage.getAllUsers(1); // فقط یک کاربر برای تست سرعت
        const endTime = Date.now();
        mongoPing = endTime - startTime;
        
        // وضعیت پینگ مونگو
        mongoStatus = mongoPing < 100 ? '🟢 عالی' : mongoPing < 300 ? '🟡 متوسط' : '🔴 ضعیف';
      } catch (dbError) {
        console.error('MongoDB ping test failed:', dbError);
        mongoStatus = '🔴 قطع';
        mongoPing = -1;
      }
      
      // تست سرعت پاسخ‌گویی هوش مصنوعی
      let aiStatus = '⚫ نامشخص';
      let aiPing = -1;
      let aiErrorMessage = '';
      
      // انجام تست پینگ Hugging Face
      aiPing = await huggingFaceService.pingHuggingFace();
      
      // بررسی وضعیت پینگ هوش مصنوعی با توجه به کدهای خطای جدید
      if (aiPing > 0) {
        // پینگ موفق
        aiStatus = aiPing < 1000 ? '🟢 عالی' : aiPing < 3000 ? '🟡 متوسط' : '🔴 ضعیف';
      } else if (aiPing === -429) {
        // خطای محدودیت تعداد درخواست‌ها یا اتمام اعتبار
        aiStatus = '🔴 خطا در اتصال';
        aiErrorMessage = 'محدودیت استفاده از API به پایان رسیده است';
      } else if (aiPing === -401) {
        // خطای احراز هویت
        aiStatus = '🔴 خطا در اتصال';
        aiErrorMessage = 'مشکل در احراز هویت API';
      } else if (aiPing === -500) {
        // خطای سرور
        aiStatus = '🔴 خطا در اتصال';
        aiErrorMessage = 'سرورهای Hugging Face با مشکل مواجه هستند';
      } else {
        // سایر خطاها
        aiStatus = '🔴 خطا در اتصال';
        aiErrorMessage = 'مشکل نامشخص در ارتباط با سرویس هوش مصنوعی';
      }
      
      // زمان پاسخگویی کلی سیستم
      const apiPing = Date.now() - interaction.createdTimestamp;
      const apiStatus = apiPing < 200 ? '🟢 عالی' : apiPing < 500 ? '🟡 متوسط' : '🔴 ضعیف';
      
      // وضعیت کلی سیستم - اکنون شامل Hugging Face هم می‌شود
      let overallStatus = '';
      
      if (discordPing < 300 && mongoPing < 300 && apiPing < 500 && aiPing > 0) {
        overallStatus = '✅ همه سیستم‌ها آنلاین و پایدار هستند';
      } else if (mongoPing === -1) {
        overallStatus = '❌ اتصال به دیتابیس با مشکل مواجه است';
      } else if (aiPing === -429) {
        overallStatus = '❌ محدودیت استفاده از API هوش مصنوعی به پایان رسیده است';
      } else if (aiPing === -401) {
        overallStatus = '❌ خطای احراز هویت در سرویس هوش مصنوعی';
      } else if (aiPing === -500) {
        overallStatus = '❌ سرورهای Hugging Face با مشکل مواجه هستند';
      } else if (aiPing < 0) {
        overallStatus = '❌ اتصال به سرویس هوش مصنوعی با مشکل مواجه است';
      } else if (discordPing > 500 || mongoPing > 500 || apiPing > 800 || aiPing > 5000) {
        overallStatus = '⚠️ تاخیر بیش از حد در بعضی سرویس‌ها';
      } else {
        overallStatus = '✓ سیستم کار می‌کند اما تاخیر وجود دارد';
      }
      
      // ایجاد یک امبد زیبا و کامل
      const pingEmbed = new EmbedBuilder()
        .setColor('#4B0082') // رنگ بنفش تیره برای جلوه بصری بهتر
        .setTitle('🏓 وضعیت سیستم Ccoin')
        .setDescription(`${overallStatus}\n\n**◼️ اطلاعات اتصال و پینگ:**`)
        .addFields([
          { 
            name: '🚀 پینگ دیسکورد', 
            value: `\`${discordPing}ms\` ${discordStatus}`, 
            inline: true 
          },
          { 
            name: '🗄️ پینگ دیتابیس', 
            value: mongoPing !== -1 ? `\`${mongoPing}ms\` ${mongoStatus}` : '`خطا در اتصال` 🔴', 
            inline: true 
          },
          { 
            name: '⚡ پینگ API', 
            value: `\`${apiPing}ms\` ${apiStatus}`, 
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
            ephemeral: true
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
        await interaction.reply({
          content: '⛔ شما دسترسی لازم برای استفاده از این دستور را ندارید!',
          ephemeral: true
        });
        return;
      }
      
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
        await interaction.reply({
          content: '⛔ شما دسترسی لازم برای استفاده از این دستور را ندارید!',
          ephemeral: true
        });
        return;
      }
      
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

// بازی های گروهی - دستور برای نمایش منوی بازی های گروهی
const groupGames = {
  data: new SlashCommandBuilder()
    .setName('group')
    .setDescription('🎮 منوی بازی‌های گروهی و سرگرمی دسته‌جمعی'),
  
  async execute(interaction: any) {
    try {
      await handleGroupGamesMenu(interaction);
    } catch (error) {
      console.error('Error in group games command:', error);
      await interaction.reply({
        content: '⚠️ خطا در نمایش منوی بازی‌های گروهی! لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
};

// Command for Hugging Face AI interaction
const hf = {
  data: new SlashCommandBuilder()
    .setName('hf')
    .setDescription('🧠 گفتگو با هوش مصنوعی Hugging Face')
    .addStringOption(option => 
      option.setName('prompt')
            .setDescription('سوال یا درخواست شما از هوش مصنوعی')
            .setRequired(true)),
  
  async execute(interaction: any) {
    try {
      // نمایش "در حال تایپ" برای تعامل طولانی مدت
      await interaction.deferReply();
      
      // بررسی وضعیت اتصال به سرویس Hugging Face قبل از ارسال درخواست
      const connectionStatus = await huggingFaceService.checkConnectionStatus();
      
      // اگر سرویس در دسترس نیست، پیام خطای مناسب را نمایش دهیم
      if (!connectionStatus.isAvailable) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000') // رنگ قرمز برای خطا
          .setTitle('⚠️ سرویس هوش مصنوعی در دسترس نیست')
          .setDescription(connectionStatus.message)
          .addFields([
            {
              name: '📝 راه حل پیشنهادی',
              value: connectionStatus.statusCode === 429 
                ? 'سهمیه API به پایان رسیده است. لطفاً با مدیر سیستم تماس بگیرید تا نسبت به شارژ یا تمدید حساب کاربری اقدام نماید.'
                : 'لطفاً بعداً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.'
            }
          ])
          .setFooter({ 
            text: `درخواست: ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        await interaction.editReply({
          embeds: [errorEmbed]
        });
        return;
      }
      
      // دریافت پرسش کاربر
      const prompt = interaction.options.getString('prompt');
      
      // ارسال درخواست به Hugging Face
      const response = await huggingFaceService.getAIResponse(prompt, {
        maxTokens: 300, // افزایش طول پاسخ قابل دریافت
        temperature: 0.7 // تنظیم خلاقیت پاسخ
      });
      
      // بررسی اینکه آیا پاسخ حاوی پیام خطا است
      if (response.startsWith('⚠️')) {
        // اگر پیام با علامت خطا شروع شود، به عنوان خطا نمایش دهیم
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000') // رنگ قرمز برای خطا
          .setTitle('⚠️ خطا در سرویس هوش مصنوعی')
          .setDescription(response)
          .setFooter({ 
            text: `درخواست: ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        await interaction.editReply({
          embeds: [errorEmbed]
        });
      } else {
        // ایجاد Embed برای پاسخ
        const chatEmbed = new EmbedBuilder()
          .setColor('#8A2BE2') // رنگ بنفش تیره
          .setTitle('🤖 پاسخ هوش مصنوعی')
          .setDescription(response)
          .setFooter({ 
            text: `درخواست: ${interaction.user.username} | با استفاده از Hugging Face`,
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        // پاسخ به کاربر
        await interaction.editReply({
          embeds: [chatEmbed]
        });
      }
    } catch (error) {
      console.error('Error in hf command:', error);
      
      // پیام خطای مناسب بر اساس نوع خطا
      let errorMessage = '⚠️ خطا در ارتباط با هوش مصنوعی! لطفاً بعداً دوباره تلاش کنید.';
      let errorTitle = '⚠️ خطا در سرویس هوش مصنوعی';
      
      // بررسی نوع خطا
      if (error instanceof Error) {
        const errorStr = error.toString().toLowerCase();
        
        if (errorStr.includes('429') || errorStr.includes('exceeded your current quota')) {
          errorMessage = '⚠️ محدودیت استفاده از سرویس Hugging Face به پایان رسیده است. لطفاً این موضوع را به مدیر سیستم اطلاع دهید.';
          errorTitle = '⚠️ محدودیت API به پایان رسیده است';
        } else if (errorStr.includes('401') || errorStr.includes('403') || errorStr.includes('auth')) {
          errorMessage = '⚠️ خطا در دسترسی به سرویس Hugging Face. کلید API نامعتبر است یا دسترسی ندارد.';
          errorTitle = '⚠️ خطای احراز هویت در سرویس Hugging Face';
        } else if (errorStr.includes('500')) {
          errorMessage = '⚠️ سرورهای Hugging Face در حال حاضر با مشکل مواجه هستند. لطفاً بعداً دوباره تلاش کنید.';
          errorTitle = '⚠️ خطای سرور Hugging Face';
        }
      }
      
      // ایجاد Embed برای خطا
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000') // رنگ قرمز برای خطا
        .setTitle(errorTitle)
        .setDescription(errorMessage)
        .setFooter({ 
          text: `درخواست: ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            embeds: [errorEmbed]
          });
        } else if (!interaction.replied) {
          await interaction.reply({
            embeds: [errorEmbed],
            ephemeral: true
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
  client.commands.set(groupGames.data.name, groupGames);
  client.commands.set(hf.data.name, hf); // Add the Hugging Face AI command
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
  groupGames.data.toJSON(),
  hf.data.toJSON() // Add the Hugging Face AI command to slash commands
];
