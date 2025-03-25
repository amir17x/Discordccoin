import { SlashCommandBuilder, Collection, Client, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable } from 'discord.js';
import { storage } from '../storage';
import { mainMenu } from './components/mainMenu';
import { adminMenu } from '../discord/components/adminMenu';
import { friendsMainMenu } from './components/friendsMenu/friendsMainMenu';

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
                  '`/ping` - بررسی وضعیت اتصال به ربات'
          },
          { 
            name: '📜 **راهنمای کامل‌تر**', 
            value: 'برای مشاهده راهنمای کامل‌تر و جزئیات هر بخش، روی دکمه "راهنمای جامع" کلیک کنید.\n' +
                  'در آنجا می‌توانید با تمام ویژگی‌های ربات آشنا شوید! 📚'
          }
        )
        .setFooter({ 
          text: 'از Ccoin Bot v1.5.0 لذت ببرید! | برای شروع از /menu استفاده کنید', 
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

// Command for ping with simplified approach for better performance
const ping = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 سرعت اتصال ربات را نشان می‌دهد'),
  
  async execute(interaction: any) {
    try {
      // بجای دیفر و ادیت، مستقیماً پاسخ می‌دهیم تا از خطاهای همزمانی جلوگیری شود
      const apiPing = interaction.client.ws.ping;
      
      // زمان آنلاین ربات به ساعت و دقیقه
      const uptime = interaction.client.uptime;
      const hours = Math.floor(uptime / 3600000);
      const minutes = Math.floor((uptime % 3600000) / 60000);
      
      // وضعیت پینگ
      const pingStatus = apiPing < 200 ? '🟢 عالی' : apiPing < 500 ? '🟡 متوسط' : '🔴 ضعیف';
      
      // بررسی وضعیت interaction قبل از پاسخ
      if (interaction.replied || interaction.deferred) {
        console.log('Ping command: interaction already handled');
        return;
      }
      
      // ایجاد امبد ساده‌تر با اطلاعات ضروری
      const pingEmbed = new EmbedBuilder()
        .setColor('#00FFFF')
        .setTitle('🏓 پونگ!')
        .setDescription(`🚀 **پینگ شبکه:** \`${apiPing}ms\`\n⏱️ **زمان آنلاین ربات:** ${hours} ساعت و ${minutes} دقیقه\n🔄 **وضعیت:** ${pingStatus}`)
        .setFooter({ 
          text: '🎮 ربات Ccoin',
          iconURL: interaction.client.user.displayAvatarURL() 
        });
      
      // دکمه منوی اصلی
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu')
            .setLabel('🏠 منوی اصلی')
            .setStyle(ButtonStyle.Success)
        );
      
      try {
        // پاسخ مستقیم با امبد ساده‌تر - استفاده از try/catch برای مدیریت خطاهای احتمالی
        await interaction.reply({ 
          embeds: [pingEmbed],
          components: [row],
          ephemeral: true
        });
      } catch (e) {
        console.log('Failed to reply in ping command:', e);
      }
    } catch (error) {
      console.error('Error in ping command:', error);
      // در صورت خطا، پاسخ ساده می‌دهیم
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠️ خطا در اجرای دستور پینگ!',
          ephemeral: true
        });
      }
    }
  }
};

// دستور دوستان
const friends = {
  data: new SlashCommandBuilder()
    .setName('friends')
    .setDescription('مدیریت دوستان و چت ناشناس')
    .setDMPermission(false),
  
  async execute(interaction: any) {
    try {
      const user = await storage.getUserByDiscordId(interaction.user.id);
      if (!user) {
        return await interaction.reply({
          content: "❌ حساب کاربری شما یافت نشد. لطفاً با دستور `/start` یک حساب بسازید.",
          ephemeral: true
        });
      }
      
      // فراخوانی منوی اصلی دوستان
      await friendsMainMenu(interaction);
    } catch (error) {
      console.error('Error in friends command:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ خطایی در اجرای دستور رخ داد! لطفاً دوباره تلاش کنید.",
          ephemeral: true
        });
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
  client.commands.set(friends.data.name, friends);
}

export const commands = [
  menu.data.toJSON(),
  balance.data.toJSON(),
  daily.data.toJSON(),
  help.data.toJSON(),
  admin.data.toJSON(),
  ping.data.toJSON(),
  friends.data.toJSON()
];
