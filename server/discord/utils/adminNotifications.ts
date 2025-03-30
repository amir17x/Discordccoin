import { EmbedBuilder, Client } from 'discord.js';
import { log } from './logger';

// We'll get the client from the parameter instead of importing it directly
let discordClient: Client | null = null;

/**
 * انواع اعلان‌های مدیریتی
 */
export type AdminNotificationType = 'add_coins' | 'remove_coins' | 'distribute_coins' | 'reset_economy' | 'reset_all_economy';

/**
 * اطلاعات اعلان مدیریت
 */
interface AdminNotificationData {
  amount?: number;
  adminName: string;
  reason?: string;
}

/**
 * تنظیم کلاینت دیسکورد برای سیستم اعلان‌ها
 * @param client کلاینت دیسکورد
 */
export function setDiscordClient(client: Client): void {
  discordClient = client;
}

/**
 * ارسال اعلان از طرف ادمین به کاربر
 * @param discordId شناسه دیسکورد کاربر
 * @param type نوع اعلان
 * @param data اطلاعات اضافی مورد نیاز
 * @param client کلاینت دیسکورد (اختیاری، اگر قبلاً با setDiscordClient تنظیم نشده باشد)
 */
export async function sendAdminNotification(
  discordId: string,
  type: AdminNotificationType,
  data: AdminNotificationData,
  client?: Client
): Promise<boolean> {
  try {
    // استفاده از کلاینت ارسال شده یا کلاینت ذخیره شده
    const activeClient = client || discordClient;
    
    if (!activeClient) {
      log('No Discord client available for admin notifications', 'error');
      return false;
    }
    
    // دریافت کاربر از دیسکورد
    const user = await activeClient.users.fetch(discordId).catch((error: any) => {
      log(`Error fetching user ${discordId} for admin notification: ${error}`, 'error');
      return null;
    });
    
    if (!user) {
      log(`User ${discordId} not found for admin notification`, 'error');
      return false;
    }
    
    let embed: EmbedBuilder;
    
    // انتخاب نوع امبد بر اساس نوع اعلان
    switch (type) {
      case 'add_coins':
        embed = createAddCoinsEmbed(data.amount || 0, data.adminName, data.reason);
        break;
      case 'remove_coins':
        embed = createRemoveCoinsEmbed(data.amount || 0, data.adminName, data.reason);
        break;
      case 'distribute_coins':
        embed = createDistributeCoinsEmbed(data.amount || 0, data.adminName, data.reason);
        break;
      case 'reset_economy':
        embed = createResetEconomyEmbed(data.adminName, data.reason);
        break;
      case 'reset_all_economy':
        embed = createResetAllEconomyEmbed(data.adminName, data.reason);
        break;
      default:
        log(`Invalid admin notification type: ${type}`, 'error');
        return false;
    }
    
    // ارسال پیام خصوصی به کاربر
    await user.send({ embeds: [embed] }).catch((error: any) => {
      log(`Error sending DM to user ${discordId}: ${error}`, 'error');
      return false;
    });
    
    log(`Admin notification sent to user ${user.username} (${discordId}) - Type: ${type}`, 'info');
    return true;
  } catch (error: any) {
    log(`Error in sendAdminNotification: ${error}`, 'error');
    return false;
  }
}

/**
 * ایجاد Embed برای اعلان افزودن سکه
 */
function createAddCoinsEmbed(amount: number, adminName: string, reason?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor('#4CAF50') // رنگ سبز
    .setTitle('💰 افزایش موجودی')
    .setDescription(`${amount} سکه به موجودی شما اضافه شد.`)
    .addFields(
      { name: '👤 ادمین', value: adminName, inline: true },
      { name: '📆 تاریخ', value: new Date().toLocaleDateString('fa-IR'), inline: true }
    )
    .setFooter({ text: 'سیستم اعلان Ccoin' })
    .setTimestamp();
  
  if (reason) {
    embed.addFields({ name: '📝 دلیل', value: reason });
  }
  
  return embed;
}

/**
 * ایجاد Embed برای اعلان کاهش سکه
 */
function createRemoveCoinsEmbed(amount: number, adminName: string, reason?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor('#F44336') // رنگ قرمز
    .setTitle('💸 کاهش موجودی')
    .setDescription(`${amount} سکه از موجودی شما کسر شد.`)
    .addFields(
      { name: '👤 ادمین', value: adminName, inline: true },
      { name: '📆 تاریخ', value: new Date().toLocaleDateString('fa-IR'), inline: true }
    )
    .setFooter({ text: 'سیستم اعلان Ccoin' })
    .setTimestamp();
  
  if (reason) {
    embed.addFields({ name: '📝 دلیل', value: reason });
  }
  
  return embed;
}

/**
 * ایجاد Embed برای اعلان توزیع سکه
 */
function createDistributeCoinsEmbed(amount: number, adminName: string, reason?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor('#2196F3') // رنگ آبی
    .setTitle('🎁 توزیع سکه')
    .setDescription(`${amount} سکه از طرف ادمین بین همه کاربران توزیع شد و به موجودی شما افزوده شد.`)
    .addFields(
      { name: '👤 ادمین', value: adminName, inline: true },
      { name: '📆 تاریخ', value: new Date().toLocaleDateString('fa-IR'), inline: true }
    )
    .setFooter({ text: 'سیستم اعلان Ccoin' })
    .setTimestamp();
  
  if (reason) {
    embed.addFields({ name: '📝 دلیل', value: reason });
  }
  
  return embed;
}

/**
 * ایجاد Embed برای اعلان ریست اقتصاد کاربر
 */
function createResetEconomyEmbed(adminName: string, reason?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor('#F44336') // رنگ قرمز
    .setTitle('🔄 ریست اقتصادی')
    .setDescription('حساب اقتصادی شما ریست شد. تمامی سکه‌ها و کریستال‌های شما به مقدار اولیه بازگشت.')
    .addFields(
      { name: '👤 ادمین', value: adminName, inline: true },
      { name: '📆 تاریخ', value: new Date().toLocaleDateString('fa-IR'), inline: true }
    )
    .setFooter({ text: 'سیستم اعلان Ccoin' })
    .setTimestamp();
  
  if (reason) {
    embed.addFields({ name: '📝 دلیل', value: reason });
  }
  
  return embed;
}

/**
 * ایجاد Embed برای اعلان ریست اقتصاد کلی
 */
function createResetAllEconomyEmbed(adminName: string, reason?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor('#F44336') // رنگ قرمز
    .setTitle('⚠️ ریست کلی اقتصاد')
    .setDescription('اقتصاد ربات ریست شد. تمامی سکه‌ها و کریستال‌های همه کاربران به مقدار اولیه بازگشت.')
    .addFields(
      { name: '👤 ادمین', value: adminName, inline: true },
      { name: '📆 تاریخ', value: new Date().toLocaleDateString('fa-IR'), inline: true }
    )
    .setFooter({ text: 'سیستم اعلان Ccoin' })
    .setTimestamp();
  
  if (reason) {
    embed.addFields({ name: '📝 دلیل', value: reason });
  }
  
  return embed;
}