/**
 * سرویس اطلاع‌رسانی دزدی
 * این سرویس در زمان‌های مناسب به کاربران فعال اطلاع می‌دهد که فرصت دزدی وجود دارد
 */

import { Client, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ColorResolvable, GatewayIntentBits, TextChannel } from 'discord.js';
import { storage } from '../../storage';
import * as schedule from 'node-schedule';
import { GlobalSettingsManager, GlobalSettingKeys } from '../utils/globalSettings';

// کانال‌های اطلاع‌رسانی عمومی دزدی (اختیاری)
const ROBBERY_ANNOUNCEMENT_CHANNELS = ['robbery-announcements', 'دزدی-و-سرقت', 'اطلاع-رسانی'];

// زمان‌بندی اجرای اطلاع‌رسانی (هر ۲ ساعت)
const NOTIFICATION_INTERVAL_HOURS = 2;
// مدت زمان فعال بودن فرصت دزدی (۲ دقیقه) - این مقدار از تنظیمات عمومی خوانده خواهد شد
const DEFAULT_OPPORTUNITY_DURATION_MINUTES = 2;
// حداقل مقدار پول برای اینکه کاربر به عنوان هدف تعیین شود - این مقدار از تنظیمات عمومی خوانده خواهد شد
const DEFAULT_MIN_WALLET_AMOUNT = 1000;

/**
 * راه‌اندازی سرویس اطلاع‌رسانی دزدی
 * @param client شیء کلاینت دیسکورد
 */
export function setupRobberyNotificationService(client: Client) {
  console.log('🕵️ راه‌اندازی سرویس اطلاع‌رسانی دزدی...');
  
  // تنظیم زمان‌بندی اجرای اطلاع‌رسانی (هر ۲ ساعت)
  schedule.scheduleJob(`0 */${NOTIFICATION_INTERVAL_HOURS} * * *`, async () => {
    try {
      await sendRobberyOpportunityNotifications(client);
    } catch (error) {
      console.error('Error in robbery notification schedule:', error);
    }
  });
  
  // اضافه کردن تصادفی‌سازی برای اطلاع‌رسانی‌های خارج از زمان‌بندی منظم
  scheduleRandomNotifications(client);
  
  console.log('🕵️ سرویس اطلاع‌رسانی دزدی راه‌اندازی شد!');
}

/**
 * ایجاد زمان‌بندی تصادفی برای اطلاع‌رسانی‌های دزدی
 * @param client شیء کلاینت دیسکورد
 */
function scheduleRandomNotifications(client: Client) {
  // هر ساعت بررسی کنیم که آیا اطلاع‌رسانی تصادفی انجام دهیم یا خیر
  schedule.scheduleJob('30 * * * *', async () => {
    try {
      // با احتمال ۳۰٪ یک اطلاع‌رسانی تصادفی ارسال کنیم
      if (Math.random() < 0.3) {
        console.log('🎲 اطلاع‌رسانی تصادفی دزدی فعال شد!');
        await sendRobberyOpportunityNotifications(client);
      }
    } catch (error) {
      console.error('Error in random robbery notification:', error);
    }
  });
}

/**
 * ارسال اطلاع‌رسانی فرصت دزدی به کاربران
 * @param client شیء کلاینت دیسکورد
 */
async function sendRobberyOpportunityNotifications(client: Client) {
  try {
    console.log('🔔 شروع فرآیند اطلاع‌رسانی دزدی...');
    
    // دریافت تنظیمات دزدی از تنظیمات عمومی
    const opportunityDurationMinutes = await GlobalSettingsManager.getNumber(
      GlobalSettingKeys.ROBBERY_WINDOW_MINUTES, 
      DEFAULT_OPPORTUNITY_DURATION_MINUTES
    );
    
    const maxTargets = await GlobalSettingsManager.getNumber(
      GlobalSettingKeys.ROBBERY_MAX_TARGETS, 
      3
    );
    
    // فعال کردن دسترسی به presence برای تشخیص کاربران آنلاین
    await enablePresenceIntent(client);
    
    // بررسی کنیم آیا کاربران آنلاین که پول کافی دارند وجود دارند یا خیر
    const potentialTargets = await findPotentialRobberyTargets(client);
    
    if (potentialTargets.length === 0) {
      console.log('⚠️ هیچ هدف مناسبی برای دزدی پیدا نشد!');
      return;
    }
    
    // دریافت کاربرانی که اطلاع‌رسانی دزدی برای آنها فعال است
    const subscribedUsers = await storage.getUsersWithRobberyNotificationsEnabled();
    
    if (subscribedUsers.length === 0) {
      console.log('ℹ️ هیچ کاربری اطلاع‌رسانی دزدی را فعال نکرده است!');
      return;
    }
    
    console.log(`🔔 ارسال اطلاع‌رسانی دزدی به ${subscribedUsers.length} کاربر...`);
    
    // انتخاب تصادفی هدف از لیست اهداف ممکن (یا همه اهداف اگر تعدادشان کمتر از maxTargets است)
    const selectedTargets = selectRandomTargets(potentialTargets, Math.min(maxTargets, potentialTargets.length));
    
    // ساخت پیام اطلاع‌رسانی
    const embed = createRobberyOpportunityEmbed(selectedTargets, opportunityDurationMinutes);
    const components = createRobberyActionButtons();
    
    // ارسال اطلاع‌رسانی به هر کاربر مشترک
    let sentCount = 0;
    for (const user of subscribedUsers) {
      try {
        // اطمینان از اینکه کاربر فعال است و توکن آن معتبر است
        const discordUser = await client.users.fetch(user.discordId);
        
        if (discordUser) {
          await discordUser.send({
            embeds: [embed],
            components: [components]
          });
          
          // به‌روزرسانی زمان آخرین اطلاع‌رسانی
          await storage.updateUser(user.id, {
            robberyNotifications: {
              enabled: true,
              lastNotified: new Date()
            }
          });
          
          sentCount++;
        }
      } catch (error) {
        console.error(`Error sending robbery notification to user ${user.id}:`, error);
      }
    }
    
    console.log(`✅ اطلاع‌رسانی دزدی به ${sentCount} کاربر از ${subscribedUsers.length} کاربر ارسال شد.`);
    
    // ارسال اطلاع‌رسانی به کانال‌های عمومی
    await sendAnnouncementToPublicChannels(client, selectedTargets, embed, opportunityDurationMinutes);
    
    // فعال کردن حالت دزدی برای مدت مشخص با استفاده از GlobalSettingsManager
    await GlobalSettingsManager.set('robberyActive', 'true');
    await GlobalSettingsManager.setArray('robberyTargets', selectedTargets.map(t => t.id));
    await GlobalSettingsManager.set('robberyEndTime', new Date(Date.now() + opportunityDurationMinutes * 60 * 1000).toISOString());
    
    // بعد از opportunityDurationMinutes دقیقه فرصت دزدی را ببندیم
    setTimeout(async () => {
      console.log('⌛ فرصت دزدی به پایان رسید!');
      
      // غیرفعال کردن حالت دزدی
      await GlobalSettingsManager.set('robberyActive', 'false');
      
      // ارسال پیام پایان به کانال‌های عمومی
      const endEmbed = new EmbedBuilder()
        .setColor('#F44336' as ColorResolvable)
        .setTitle('⏱️ پایان زمان دزدی!')
        .setDescription('فرصت دزدی به پایان رسید. کاربران آنلاین دیگر هدف دزدی نیستند.')
        .setFooter({ text: 'فرصت دزدی بعدی در زمان دیگری اعلام خواهد شد.' })
        .setTimestamp();
      
      await sendEndAnnouncementToPublicChannels(client, endEmbed);
      
    }, opportunityDurationMinutes * 60 * 1000);
    
  } catch (error) {
    console.error('Error in sendRobberyOpportunityNotifications:', error);
  }
}

/**
 * پیدا کردن کاربران مناسب برای هدف دزدی
 * فقط کاربران آنلاین با پول کافی انتخاب می‌شوند
 * @param client شیء کلاینت دیسکورد برای بررسی وضعیت آنلاین بودن
 * @returns لیست کاربران مناسب برای هدف دزدی
 */
async function findPotentialRobberyTargets(client: Client) {
  try {
    // دریافت حداقل مقدار پول برای هدف دزدی از تنظیمات عمومی یا مقدار پیش‌فرض
    const minAmount = await GlobalSettingsManager.getNumber(
      GlobalSettingKeys.ROBBERY_MIN_AMOUNT,
      DEFAULT_MIN_WALLET_AMOUNT
    );
    
    // جستجوی کاربرانی که پول کافی در کیف پول خود دارند
    const usersWithMoney = await storage.getUsersWithMinWalletAmount(minAmount);
    
    if (usersWithMoney.length === 0) {
      console.log(`⚠️ هیچ کاربری با پول کافی برای دزدی (حداقل ${minAmount} سکه) پیدا نشد!`);
      return [];
    }
    
    console.log(`🔍 یافتن کاربران آنلاین از بین ${usersWithMoney.length} کاربر با پول کافی...`);
    
    // فیلتر کردن فقط کاربران آنلاین
    const onlineUsers = [];
    
    for (const user of usersWithMoney) {
      try {
        // بررسی آیا کاربر در سرورهای مشترک آنلاین است
        const member = await findOnlineGuildMember(client, user.discordId);
        
        if (member) {
          console.log(`✅ کاربر ${user.username} (${user.discordId}) آنلاین است و ${user.wallet} سکه دارد.`);
          onlineUsers.push({
            ...user,
            member // اضافه کردن اطلاعات عضویت در گیلد برای استفاده‌های بعدی
          });
        }
      } catch (error) {
        console.error(`Error checking online status for user ${user.id}:`, error);
      }
    }
    
    console.log(`🎯 ${onlineUsers.length} کاربر آنلاین با پول کافی برای دزدی پیدا شد.`);
    return onlineUsers;
  } catch (error) {
    console.error('Error finding potential robbery targets:', error);
    return [];
  }
}

/**
 * پیدا کردن یک عضو آنلاین در گیلدهای مشترک
 * @param client شیء کلاینت دیسکورد
 * @param discordId شناسه کاربر دیسکورد
 * @returns عضو گیلد در صورت آنلاین بودن، در غیر این صورت null
 */
async function findOnlineGuildMember(client: Client, discordId: string) {
  try {
    // دریافت تمام گیلدهایی که بات در آنها عضو است
    const guilds = client.guilds.cache.values();
    
    for (const guild of guilds) {
      try {
        // تلاش برای دریافت کاربر در این گیلد
        const member = await guild.members.fetch(discordId).catch(() => null);
        
        // اگر کاربر عضو این گیلد است و آنلاین است
        if (member && member.presence && ['online', 'idle', 'dnd'].includes(member.presence.status)) {
          return member;
        }
      } catch (error) {
        // نادیده گرفتن خطای عدم عضویت کاربر در این گیلد
      }
    }
    
    // کاربر در هیچ گیلد مشترکی آنلاین نیست
    return null;
  } catch (error) {
    console.error(`Error finding online guild member for ${discordId}:`, error);
    return null;
  }
}

/**
 * انتخاب تصادفی تعدادی کاربر از لیست کاربران
 * @param targets لیست کاربران هدف
 * @param count تعداد کاربران مورد نیاز
 * @returns لیست کاربران انتخاب شده
 */
function selectRandomTargets(targets: any[], count: number) {
  // کپی از آرایه برای جلوگیری از تغییر آرایه اصلی
  const shuffled = [...targets];
  
  // بر هم زدن ترتیب آرایه به صورت تصادفی (الگوریتم Fisher-Yates)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // برگرداندن 'count' عنصر اول از آرایه بر هم زده شده
  return shuffled.slice(0, count);
}

/**
 * ایجاد امبد برای اطلاع‌رسانی فرصت دزدی
 * @param targets لیست کاربران هدف
 * @param durationMinutes مدت زمان فعال بودن فرصت دزدی به دقیقه
 * @returns امبد حاوی اطلاعات اهداف دزدی
 */
function createRobberyOpportunityEmbed(targets: any[], durationMinutes: number = DEFAULT_OPPORTUNITY_DURATION_MINUTES) {
  const embed = new EmbedBuilder()
    .setColor('#FF9800' as ColorResolvable) // نارنجی
    .setTitle('🕵️ فرصت دزدی پیدا شد!')
    .setDescription(`**فرصت طلایی برای دزدی!** 💰\nاین فرصت فقط برای **${durationMinutes} دقیقه** فعال است!`)
    .setThumbnail('https://img.icons8.com/fluency/96/radar.png')
    .addFields(
      { name: '⏱️ زمان باقی‌مانده', value: `${durationMinutes} دقیقه`, inline: true },
      { name: '👤 تعداد اهداف', value: `${targets.length} نفر`, inline: true }
    )
    .setFooter({ text: 'برای شروع دزدی، روی دکمه‌ی زیر کلیک کنید.' })
    .setTimestamp();
  
  // اضافه کردن اطلاعات اهداف
  targets.forEach((target, index) => {
    embed.addFields({
      name: `🎯 هدف ${index + 1}: ${target.username}`, 
      value: `💰 پول در کیف پول: ${target.wallet.toLocaleString()} سکه`, 
      inline: false
    });
  });
  
  return embed;
}

/**
 * ایجاد دکمه‌های کنش برای منوی دزدی
 * @returns سطر اکشن حاوی دکمه‌های دزدی
 */
function createRobberyActionButtons() {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('robbery')
        .setLabel('🕵️ منوی دزدی')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('robbery_quick')
        .setLabel('⚡ دزدی سریع')
        .setStyle(ButtonStyle.Danger)
    );
}

/**
 * فعال کردن دسترسی به Presence برای تشخیص وضعیت آنلاین کاربران
 * @param client شیء کلاینت دیسکورد
 */
async function enablePresenceIntent(client: Client) {
  try {
    // بررسی وجود Presence Intent
    if (!client.options.intents.has(GatewayIntentBits.GuildPresences)) {
      console.log('⚠️ GuildPresences intent فعال نیست! تلاش برای استفاده از روش جایگزین...');
      
      // در صورت نبود این intent، از وضعیت کاربران در گیلدها استفاده می‌کنیم
      // این روش ممکن است همه کاربران را پیدا نکند اما بهتر از هیچی است
      
      // دریافت تمام گیلدها
      await Promise.all(Array.from(client.guilds.cache.values()).map(guild => 
        guild.members.fetch().catch(() => {
          console.log(`⚠️ امکان دریافت اعضای گیلد ${guild.name} وجود ندارد.`);
          return null;
        })
      ));
      
      console.log('✅ اطلاعات اعضای گیلدها با موفقیت دریافت شد.');
    }
    
    return true;
  } catch (error) {
    console.error('Error enabling presence intent:', error);
    return false;
  }
}

/**
 * ارسال اطلاع‌رسانی به کانال‌های عمومی
 * @param client شیء کلاینت دیسکورد
 * @param targets اهداف دزدی
 * @param embed امبد حاوی اطلاعات دزدی
 * @param durationMinutes مدت زمان فعال بودن فرصت دزدی به دقیقه
 */
async function sendAnnouncementToPublicChannels(client: Client, targets: any[], embed: EmbedBuilder, durationMinutes: number = DEFAULT_OPPORTUNITY_DURATION_MINUTES) {
  try {
    const guilds = Array.from(client.guilds.cache.values());
    let sentCount = 0;
    
    // دریافت تنظیمات کانال‌های اعلان از تنظیمات عمومی یا مقدار پیش‌فرض
    const announcementChannels = await GlobalSettingsManager.getArray(
      GlobalSettingKeys.ROBBERY_ANNOUNCEMENT_CHANNELS,
      DEFAULT_ROBBERY_ANNOUNCEMENT_CHANNELS
    );
    
    // ایجاد نسخه عمومی امبد با اطلاعات محدودتر (برای کانال‌های عمومی)
    const publicEmbed = new EmbedBuilder()
      .setColor('#FF9800' as ColorResolvable)
      .setTitle('🚨 زمان دزدی فرا رسیده است!')
      .setDescription(`**فرصت طلایی برای دزدی!** 💰\nاکنون ${targets.length} کاربر آنلاین با کیف پول پر هدف دزدی هستند.\nاین فرصت فقط برای **${durationMinutes} دقیقه** فعال است!`)
      .setThumbnail('https://img.icons8.com/fluency/96/radar.png')
      .addFields(
        { name: '⏱️ زمان باقی‌مانده', value: `${durationMinutes} دقیقه`, inline: true },
        { name: '👤 تعداد اهداف', value: `${targets.length} نفر`, inline: true },
        { name: '🔍 نحوه دزدی', value: 'از دستور `/menu` استفاده کرده و به بخش دزدی بروید.', inline: false }
      )
      .setFooter({ text: 'برای فعال‌سازی اطلاع‌رسانی خصوصی از /timethief استفاده کنید!' })
      .setTimestamp();
    
    // ارسال به کانال‌های مناسب در هر گیلد
    for (const guild of guilds) {
      try {
        // جستجوی کانال‌های مناسب 
        const channels = guild.channels.cache.filter(channel => 
          channel.type === 0 && // TextChannel
          announcementChannels.some(name => 
            channel.name.toLowerCase().includes(name.toLowerCase())
          )
        );
        
        // ارسال اطلاع‌رسانی به کانال‌های مناسب
        for (const channel of channels.values()) {
          if (channel instanceof TextChannel) {
            await channel.send({ 
              content: '@everyone 🕵️ زمان دزدی فرا رسیده! کاربران آنلاین در خطر هستند!', 
              embeds: [publicEmbed] 
            });
            sentCount++;
          }
        }
      } catch (error) {
        console.error(`Error sending announcement to guild ${guild.name}:`, error);
      }
    }
    
    console.log(`✅ اطلاع‌رسانی دزدی به ${sentCount} کانال عمومی ارسال شد.`);
  } catch (error) {
    console.error('Error sending announcement to public channels:', error);
  }
}

/**
 * ارسال پیام پایان زمان دزدی به کانال‌های عمومی
 * @param client شیء کلاینت دیسکورد
 * @param embed امبد حاوی اطلاعات پایان دزدی
 */
async function sendEndAnnouncementToPublicChannels(client: Client, embed: EmbedBuilder) {
  try {
    const guilds = Array.from(client.guilds.cache.values());
    let sentCount = 0;
    
    // دریافت تنظیمات کانال‌های اعلان از تنظیمات عمومی یا مقدار پیش‌فرض
    const announcementChannels = await GlobalSettingsManager.getArray(
      GlobalSettingKeys.ROBBERY_ANNOUNCEMENT_CHANNELS,
      DEFAULT_ROBBERY_ANNOUNCEMENT_CHANNELS
    );
    
    // ارسال به کانال‌های مناسب در هر گیلد
    for (const guild of guilds) {
      try {
        // جستجوی کانال‌های مناسب
        const channels = guild.channels.cache.filter(channel => 
          channel.type === 0 && // TextChannel
          announcementChannels.some(name => 
            channel.name.toLowerCase().includes(name.toLowerCase())
          )
        );
        
        // ارسال اطلاع‌رسانی به کانال‌های مناسب
        for (const channel of channels.values()) {
          if (channel instanceof TextChannel) {
            await channel.send({ embeds: [embed] });
            sentCount++;
          }
        }
      } catch (error) {
        console.error(`Error sending end announcement to guild ${guild.name}:`, error);
      }
    }
    
    console.log(`✅ اطلاع‌رسانی پایان دزدی به ${sentCount} کانال عمومی ارسال شد.`);
  } catch (error) {
    console.error('Error sending end announcement to public channels:', error);
  }
}