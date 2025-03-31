/**
 * سرویس اطلاع‌رسانی دزدی
 * این سرویس در زمان‌های مناسب به کاربران فعال اطلاع می‌دهد که فرصت دزدی وجود دارد
 */

import { Client, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ColorResolvable } from 'discord.js';
import { storage } from '../../storage';
import * as schedule from 'node-schedule';

// زمان‌بندی اجرای اطلاع‌رسانی (هر ۲ ساعت)
const NOTIFICATION_INTERVAL_HOURS = 2;
// مدت زمان فعال بودن فرصت دزدی (۲ دقیقه)
const OPPORTUNITY_DURATION_MINUTES = 2;
// حداقل مقدار پول برای اینکه کاربر به عنوان هدف تعیین شود
const MIN_WALLET_AMOUNT = 1000;

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
    // بررسی کنیم آیا کاربران فعالی که پول کافی دارند وجود دارند یا خیر
    const potentialTargets = await findPotentialRobberyTargets();
    
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
    
    // انتخاب تصادفی ۳ هدف از لیست اهداف ممکن (یا همه اهداف اگر کمتر از ۳ نفر هستند)
    const selectedTargets = selectRandomTargets(potentialTargets, Math.min(3, potentialTargets.length));
    
    // ساخت پیام اطلاع‌رسانی
    const embed = createRobberyOpportunityEmbed(selectedTargets);
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
    
    // بعد از OPPORTUNITY_DURATION_MINUTES دقیقه فرصت دزدی را ببندیم
    setTimeout(() => {
      // در صورت نیاز می‌توان مکانیزمی برای غیرفعال کردن دکمه‌ها یا ارسال پیام پایان فرصت اضافه کرد
      console.log('⌛ فرصت دزدی به پایان رسید!');
    }, OPPORTUNITY_DURATION_MINUTES * 60 * 1000);
    
  } catch (error) {
    console.error('Error in sendRobberyOpportunityNotifications:', error);
  }
}

/**
 * پیدا کردن کاربران مناسب برای هدف دزدی
 * @returns لیست کاربران مناسب برای هدف دزدی
 */
async function findPotentialRobberyTargets() {
  try {
    // جستجوی کاربرانی که پول کافی در کیف پول خود دارند
    const potentialTargets = await storage.getUsersWithMinWalletAmount(MIN_WALLET_AMOUNT);
    return potentialTargets;
  } catch (error) {
    console.error('Error finding potential robbery targets:', error);
    return [];
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
 * @returns امبد حاوی اطلاعات اهداف دزدی
 */
function createRobberyOpportunityEmbed(targets: any[]) {
  const embed = new EmbedBuilder()
    .setColor('#FF9800' as ColorResolvable) // نارنجی
    .setTitle('🕵️ فرصت دزدی پیدا شد!')
    .setDescription(`**فرصت طلایی برای دزدی!** 💰\nاین فرصت فقط برای **${OPPORTUNITY_DURATION_MINUTES} دقیقه** فعال است!`)
    .setThumbnail('https://img.icons8.com/fluency/96/radar.png')
    .addFields(
      { name: '⏱️ زمان باقی‌مانده', value: `${OPPORTUNITY_DURATION_MINUTES} دقیقه`, inline: true },
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