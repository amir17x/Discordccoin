/**
 * منوی مدیریت هوش مصنوعی
 * @param interaction تعامل کاربر
 */
import { botConfig } from './server/discord/utils/config';
import { ButtonInteraction, ChatInputCommandInteraction, PermissionFlagsBits, 
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export async function aiSettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // بررسی دسترسی ادمین
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید!',
        ephemeral: true
      });
      return;
    }

    // دریافت تنظیمات فعلی
    const config = botConfig.getConfig();
    
    // ایجاد Embed برای نمایش تنظیمات هوش مصنوعی
    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle('🤖 مدیریت هوش مصنوعی')
      .setDescription('در این بخش می‌توانید تنظیمات هوش مصنوعی ربات را مشاهده و ویرایش کنید.')
      .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setThumbnail('https://img.icons8.com/fluency/48/artificial-intelligence.png')
      .setTimestamp();
    
    // تنظیمات هوش مصنوعی فعلی
    const aiService = config.ai?.service || 'geminialt';
    
    // تعیین نام سرویس
    let serviceDisplay = '';
    switch (aiService) {
      case 'googleai':
        serviceDisplay = '**CCOIN AI (Free)** - مدل استاندارد CCOIN';
        break;
      case 'vertexai':
        serviceDisplay = '**Vertex AI (Google Cloud)** - مدل حرفه‌ای با API کلید';
        break;
      case 'geminialt':
        serviceDisplay = '**Gemini API (مستقیم)** - دسترسی مستقیم به API جمینای';
        break;
      default:
        serviceDisplay = '**Gemini API** - سرویس پیش‌فرض';
    }
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { 
        name: '🤖 سرویس فعلی هوش مصنوعی', 
        value: serviceDisplay, 
        inline: false 
      },
      { 
        name: '📊 مقایسه سرویس‌ها', 
        value: 
        `**CCOIN AI (Free)**:\n` +
        `✅ دسترسی رایگان و آسان\n` +
        `✅ بدون نیاز به اعتبارسنجی پیچیده\n` +
        `⚠️ محدودیت در تعداد درخواست‌ها (سهمیه روزانه)\n` +
        `⚠️ محدودیت در اندازه درخواست‌ها\n\n` +
        
        `**Vertex AI (Cloud)**:\n` +
        `✅ کیفیت بالاتر با مدل‌های پیشرفته‌تر\n` +
        `✅ محدودیت‌های کمتر با اعتبار گوگل کلود\n` +
        `⚠️ نیاز به تنظیم حساب Google Cloud\n` +
        `⚠️ ممکن است هزینه داشته باشد\n\n` +
        
        `**Gemini API (مستقیم)**:\n` +
        `✅ دسترسی مستقیم به API و بدون واسطه\n` +
        `✅ کنترل بیشتر بر روی پارامترها\n` +
        `⚠️ نیاز به کلید API معتبر\n` +
        `⚠️ محدودیت‌های سهمیه مشابه CCOIN AI`,
        
        inline: false 
      }
    );
    
    // دکمه‌های تغییر سرویس
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_switch_to_googleai')
          .setLabel('CCOIN AI (Free)')
          .setEmoji('🔄')
          .setStyle(aiService === 'googleai' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'googleai'),
        new ButtonBuilder()
          .setCustomId('admin_switch_to_vertexai')
          .setLabel('Vertex AI (Cloud)')
          .setEmoji('☁️')
          .setStyle(aiService === 'vertexai' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'vertexai'),
        new ButtonBuilder()
          .setCustomId('admin_switch_to_geminialt')
          .setLabel('Gemini API (مستقیم)')
          .setEmoji('🤖')
          .setStyle(aiService === 'geminialt' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'geminialt'),
      );
    
    // دکمه‌های تست و مشاهده وضعیت
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_test_ai')
          .setLabel('تست سرویس هوش مصنوعی')
          .setEmoji('🧪')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_view_ai_status')
          .setLabel('مشاهده آمار هوش مصنوعی')
          .setEmoji('📊')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // دکمه بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    }
    
  } catch (error) {
    console.error('Error in AI settings menu:', error);
    try {
      const errorMessage = '❌ خطایی در نمایش منوی مدیریت هوش مصنوعی رخ داد!';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}