/**
 * دستورات مربوط به مدیریت سیستم دزدی
 * این فایل شامل دستورات فعال‌سازی و غیرفعال‌سازی اطلاع‌رسانی دزدی است
 */

import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { storage } from '../../../storage';

// دستور فعال‌سازی اطلاع‌رسانی زمان دزدی
export const timeThiefCommand = new SlashCommandBuilder()
  .setName('timethief')
  .setDescription('🕵️ فعال‌سازی اطلاع‌رسانی زمان‌های مناسب برای دزدی');

// دستور غیرفعال‌سازی اطلاع‌رسانی زمان دزدی
export const unTimeThiefCommand = new SlashCommandBuilder()
  .setName('untimethief')
  .setDescription('🔕 غیرفعال‌سازی اطلاع‌رسانی زمان‌های دزدی');

// اجرای دستور فعال‌سازی اطلاع‌رسانی
export async function executeTimeThief(interaction: CommandInteraction) {
  try {
    // بررسی وجود کاربر در دیتابیس
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما ابتدا باید یک حساب کاربری ایجاد کنید. لطفاً از دستور `/menu` استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    // فعال‌سازی اطلاع‌رسانی
    await storage.updateUser(user.id, {
      robberyNotifications: {
        enabled: true,
        lastNotified: null
      }
    });
    
    // ایجاد امبد برای نمایش تاییدیه
    const embed = new EmbedBuilder()
      .setColor('#9C27B0') // بنفش
      .setTitle('🕵️ اطلاع‌رسانی دزدی فعال شد')
      .setDescription(`**${interaction.user.username}** عزیز، از این پس در زمان‌های مناسب برای دزدی به شما اطلاع‌رسانی خواهد شد!`)
      .setThumbnail('https://img.icons8.com/fluency/48/radar.png')
      .addFields(
        { name: '📡 نحوه کارکرد', value: 'در زمان‌های تصادفی (حدود هر ۲ ساعت) از وجود کاربران آنلاین با پول قابل دزدی مطلع خواهید شد.', inline: false },
        { name: '⏱️ مدت زمان فعال بودن', value: 'هر فرصت دزدی فقط برای ۲ دقیقه فعال است. سریع عمل کنید!', inline: false },
        { name: '❓ غیرفعال‌سازی', value: 'برای غیرفعال‌سازی اطلاع‌رسانی از دستور `/untimethief` استفاده کنید.', inline: false }
      )
      .setFooter({ text: 'با کمک این سیستم، بهترین زمان‌های دزدی را از دست نخواهید داد!' })
      .setTimestamp();
    
    // دکمه برای رفتن به منوی سرقت
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('robbery')
          .setLabel('🕵️ منوی دزدی')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    
  } catch (error) {
    console.error('Error in timethief command:', error);
    await interaction.reply({
      content: '❌ خطا در فعال‌سازی اطلاع‌رسانی دزدی! لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

// اجرای دستور غیرفعال‌سازی اطلاع‌رسانی
export async function executeUnTimeThief(interaction: CommandInteraction) {
  try {
    // بررسی وجود کاربر در دیتابیس
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما ابتدا باید یک حساب کاربری ایجاد کنید. لطفاً از دستور `/menu` استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    // غیرفعال‌سازی اطلاع‌رسانی
    await storage.updateUser(user.id, {
      robberyNotifications: {
        enabled: false,
        lastNotified: null
      }
    });
    
    // ایجاد امبد برای نمایش تاییدیه
    const embed = new EmbedBuilder()
      .setColor('#607D8B') // خاکستری آبی
      .setTitle('🔕 اطلاع‌رسانی دزدی غیرفعال شد')
      .setDescription(`**${interaction.user.username}** عزیز، اطلاع‌رسانی زمان‌های دزدی برای شما غیرفعال شد.`)
      .setThumbnail('https://img.icons8.com/fluency/48/do-not-disturb.png')
      .addFields(
        { name: '📝 یادآوری', value: 'شما همچنان می‌توانید با استفاده از منوی دزدی، شخصاً اقدام به دزدی کنید.', inline: false },
        { name: '❓ فعال‌سازی مجدد', value: 'برای فعال‌سازی مجدد اطلاع‌رسانی از دستور `/timethief` استفاده کنید.', inline: false }
      )
      .setFooter({ text: 'موفق باشید!' })
      .setTimestamp();
    
    // دکمه برای رفتن به منوی سرقت
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('robbery')
          .setLabel('🕵️ منوی دزدی')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    
  } catch (error) {
    console.error('Error in untimethief command:', error);
    await interaction.reply({
      content: '❌ خطا در غیرفعال‌سازی اطلاع‌رسانی دزدی! لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}