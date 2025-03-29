import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} from 'discord.js';
import { botConfig } from '../../utils/config';

/**
 * سازنده دستور setFeedbackChannel
 */
export const setFeedbackChannelCommand = new SlashCommandBuilder()
  .setName('setfeedbackchannel')
  .setDescription('تنظیم کانال برای دریافت بازخوردهای کاربران')
  .addChannelOption(option => 
    option
      .setName('channel')
      .setDescription('کانال مورد نظر برای دریافت بازخوردها')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * اجرای دستور setFeedbackChannel
 * @param interaction تعامل کاربر
 */
export async function executeSetFeedbackChannel(interaction: ChatInputCommandInteraction) {
  try {
    // فقط ادمین‌ها مجاز به استفاده از این دستور هستند
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ شما دسترسی لازم برای استفاده از این دستور را ندارید! به ادمین سرور مراجعه کنید.',
        ephemeral: true
      });
      return;
    }
    
    // دریافت کانال انتخاب شده
    const channel = interaction.options.getChannel('channel', true);
    
    // بررسی نوع کانال
    if (channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: '❌ کانال انتخاب شده باید یک کانال متنی باشد.',
        ephemeral: true
      });
      return;
    }
    
    // ذخیره آی‌دی کانال در تنظیمات بات
    botConfig.setFeedbackChannel(channel.id);
    
    // ایجاد امبد تاییدیه
    const successEmbed = new EmbedBuilder()
      .setColor('#4B0082')
      .setTitle('✅ تنظیم کانال بازخورد')
      .setDescription(`کانال ${channel} با موفقیت به عنوان کانال بازخورد تنظیم شد.`)
      .addFields(
        { name: '📝 کاربرد', value: 'از این پس تمام بازخوردهای ارسالی توسط کاربران در این کانال ارسال خواهد شد.' },
        { name: '🔄 تغییر', value: 'برای تغییر کانال بازخورد، مجدداً از این دستور استفاده کنید.' }
      )
      .setFooter({ text: 'سیستم بازخورد Ccoin' })
      .setTimestamp();
    
    // ارسال تاییدیه
    await interaction.reply({
      embeds: [successEmbed],
      ephemeral: true
    });

    // ارسال پیام تست در کانال
    const testEmbed = new EmbedBuilder()
      .setColor('#4B0082')
      .setTitle('📢 راه‌اندازی سیستم بازخورد')
      .setDescription('این کانال با موفقیت به عنوان کانال بازخورد Ccoin تنظیم شد. از این پس تمام بازخوردهای ارسالی کاربران در این کانال دریافت خواهد شد.')
      .setFooter({ text: 'سیستم بازخورد Ccoin' })
      .setTimestamp();
    
    try {
      // ارسال پیام تست در کانال تنظیم شده
      // چک کردن اینکه کانال یک کانال متنی است و send دارد
      if ('send' in channel) {
        await channel.send({ embeds: [testEmbed] });
      } else {
        throw new Error('Channel does not support send method');
      }
    } catch (error) {
      console.error('Error sending test message to feedback channel:', error);
      await interaction.followUp({
        content: '⚠️ کانال با موفقیت تنظیم شد اما ربات مجوز ارسال پیام در آن را ندارد. لطفاً دسترسی‌های کانال را بررسی کنید.',
        ephemeral: true
      });
    }
    
  } catch (error) {
    console.error('Error in setFeedbackChannel command:', error);
    
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: '❌ خطایی در اجرای دستور رخ داد! لطفا مجدد تلاش کنید.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ خطایی در اجرای دستور رخ داد! لطفا مجدد تلاش کنید.',
        ephemeral: true
      });
    }
  }
}