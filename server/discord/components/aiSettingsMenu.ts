import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';
import { switchAIProvider, getAIServiceStatus, testAIService } from '../services/aiService';
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
        content: '⛔ شما دسترسی لازم برای استفاده از این بخش را ندارید.',
        ephemeral: true
      });
      return;
    }

    // دریافت وضعیت فعلی سرویس هوش مصنوعی
    const aiStatus = getAIServiceStatus();
    const currentService = aiStatus.service;

    // ساخت امبد با اطلاعات سرویس‌های هوش مصنوعی
    const embed = new EmbedBuilder()
      .setTitle('🤖 مدیریت سرویس‌های هوش مصنوعی')
      .setColor('#9B59B6')
      .setDescription(
        'در این بخش می‌توانید سرویس هوش مصنوعی مورد استفاده در ربات را مدیریت کنید.'
      )
      .addFields(
        {
          name: 'سرویس فعلی:',
          value: `${currentService === 'openai' ? '✅ OpenAI (ChatGPT)' : '⭕ OpenAI (ChatGPT)'}\n` + 
                 `${currentService === 'huggingface' ? '✅ Hugging Face' : '⭕ Hugging Face'}`
        },
        {
          name: 'آمار استفاده:',
          value: 
            `تعداد کل درخواست‌ها: \`${aiStatus.requestCount.toLocaleString()}\`\n` +
            `OpenAI: \`${aiStatus.providerStats.openai.toLocaleString()}\`\n` +
            `Hugging Face: \`${aiStatus.providerStats.huggingface.toLocaleString()}\`\n` +
            `میانگین زمان پاسخگویی: \`${aiStatus.averageLatency}ms\``
        },
        {
          name: 'نوع استفاده:',
          value:
            `پیام‌های وضعیت: \`${aiStatus.usageCounts.statusMessages.toLocaleString()}\`\n` +
            `تحلیل بازار: \`${aiStatus.usageCounts.marketAnalysis.toLocaleString()}\`\n` +
            `داستان‌های ماموریت: \`${aiStatus.usageCounts.questStories.toLocaleString()}\`\n` +
            `دستیار هوشمند: \`${aiStatus.usageCounts.aiAssistant.toLocaleString()}\`\n` +
            `سایر: \`${aiStatus.usageCounts.other.toLocaleString()}\``
        },
        {
          name: 'آخرین استفاده:',
          value: aiStatus.lastUsed ? new Date(aiStatus.lastUsed).toLocaleString('fa-IR') : 'هیچ'
        }
      )
      .setFooter({ text: 'هر سرویس نقاط قوت و ضعف مخصوص به خود را دارد.' });

    // ساخت دکمه‌ها برای انتخاب سرویس‌ها
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ai_switch_openai')
          .setLabel('تغییر به OpenAI')
          .setStyle(currentService === 'openai' ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(currentService === 'openai'),
        new ButtonBuilder()
          .setCustomId('ai_switch_huggingface')
          .setLabel('تغییر به Hugging Face')
          .setStyle(currentService === 'huggingface' ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(currentService === 'huggingface')
      );

    // دکمه‌های آزمایش و نمایش وضعیت
    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ai_test_service')
          .setLabel('آزمایش سرویس')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ai_view_status')
          .setLabel('نمایش وضعیت')
          .setStyle(ButtonStyle.Primary)
      );

    // دکمه بازگشت
    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_menu_settings')
          .setLabel('بازگشت به منوی تنظیمات')
          .setStyle(ButtonStyle.Danger)
      );

    // ارسال پاسخ
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        embeds: [embed],
        components: [row1, row2, row3]
      });
    } else {
      await interaction.reply({
        embeds: [embed],
        components: [row1, row2, row3],
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in AI settings menu:', error);
    
    // در صورت خطا
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ 
        content: 'خطایی در نمایش منوی تنظیمات هوش مصنوعی رخ داد.' 
      });
    } else {
      await interaction.reply({ 
        content: 'خطایی در نمایش منوی تنظیمات هوش مصنوعی رخ داد.',
        ephemeral: true
      });
    }
  }
}