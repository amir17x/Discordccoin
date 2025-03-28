import { 
  ButtonInteraction, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';
import { botConfig } from '../utils/config';

/**
 * منوی مدیریت هوش مصنوعی
 * @param interaction تعامل کاربر
 */
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
    const aiService = config.ai?.service || 'huggingface';
    
    // افزودن فیلدها به Embed با اطلاعات همه سرویس‌های موجود
    embed.addFields(
      { 
        name: '🤖 سرویس فعلی هوش مصنوعی', 
        value: getServiceDisplayName(aiService), 
        inline: false 
      },
      { 
        name: '📊 مقایسه سرویس‌های هوش مصنوعی', 
        value: 
        `**OpenAI (ChatGPT)**:\n` +
        `✅ کیفیت بالای پاسخ‌ها\n` +
        `✅ درک بهتر زبان فارسی\n` +
        `⚠️ محدودیت در تعداد درخواست‌ها\n` +
        `⚠️ هزینه بالاتر\n\n` +
        `**Hugging Face**:\n` +
        `✅ بدون محدودیت در تعداد درخواست‌ها\n` +
        `✅ هزینه کمتر\n` +
        `⚠️ کیفیت متوسط پاسخ‌ها\n` +
        `⚠️ درک محدودتر زبان فارسی\n\n` +
        `**Google AI (Gemini)**:\n` +
        `✅ کیفیت بالای پاسخ‌ها\n` +
        `✅ سرعت پاسخگویی بالا\n` +
        `⚠️ محدودیت مصرف ماهانه\n` +
        `⚠️ هزینه متوسط\n\n` +
        `**OpenRouter**:\n` +
        `✅ دسترسی به مدل‌های مختلف\n` +
        `✅ قابلیت انعطاف بالا\n` +
        `⚠️ محدودیت در تعداد توکن‌ها\n` +
        `⚠️ هزینه نسبتاً بالا\n\n` +
        `**Grok**:\n` +
        `✅ پاسخ‌های خلاقانه‌تر\n` +
        `✅ ویژگی‌های منحصر به فرد\n` +
        `⚠️ در حال توسعه\n` +
        `⚠️ محدودیت‌های دسترسی`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر سرویس - ردیف اول
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_switch_to_openai')
          .setLabel('OpenAI')
          .setEmoji('🤖')
          .setStyle(aiService === 'openai' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'openai'),
        new ButtonBuilder()
          .setCustomId('admin_switch_to_huggingface')
          .setLabel('Hugging Face')
          .setEmoji('🧠')
          .setStyle(aiService === 'huggingface' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'huggingface'),
        new ButtonBuilder()
          .setCustomId('admin_switch_to_googleai')
          .setLabel('Google AI')
          .setEmoji('🌐')
          .setStyle(aiService === 'googleai' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'googleai'),
      );
    
    // دکمه‌های تغییر سرویس - ردیف دوم
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_switch_to_openrouter')
          .setLabel('OpenRouter')
          .setEmoji('🔄')
          .setStyle(aiService === 'openrouter' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'openrouter'),
        new ButtonBuilder()
          .setCustomId('admin_switch_to_grok')
          .setLabel('Grok')
          .setEmoji('🧩')
          .setStyle(aiService === 'grok' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'grok'),
        new ButtonBuilder()
          .setCustomId('admin_test_ai')
          .setLabel('تست سرویس')
          .setEmoji('🧪')
          .setStyle(ButtonStyle.Secondary),
      );
    
    // دکمه‌های مدیریتی
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_view_ai_status')
          .setLabel('آمار هوش مصنوعی')
          .setEmoji('📊')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('admin_settings')
          .setLabel('🔙 بازگشت')
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

/**
 * دریافت نام نمایشی سرویس هوش مصنوعی
 * @param service نام سرویس
 * @returns نام نمایشی سرویس
 */
function getServiceDisplayName(service: string): string {
  switch (service) {
    case 'openai':
      return '**OpenAI (ChatGPT)** - کیفیت بالاتر با محدودیت بیشتر';
    case 'huggingface':
      return '**Hugging Face** - کیفیت متوسط بدون محدودیت';
    case 'googleai':
      return '**Google AI (Gemini)** - سرعت و کیفیت بالا';
    case 'openrouter':
      return '**OpenRouter** - دسترسی به مدل‌های مختلف';
    case 'grok':
      return '**Grok** - پاسخ‌های خلاقانه و متفاوت';
    default:
      return `**${service}** - سرویس نامشخص`;
  }
}