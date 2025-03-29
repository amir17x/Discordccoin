import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { switchAIProvider, getAIServiceStatus, testAIService, AIService } from '../services/aiService';
import { botConfig } from '../utils/config';

/**
 * تغییر سرویس هوش مصنوعی
 * @param interaction تعامل دکمه
 * @param serviceName نام سرویس (openai, huggingface, googleai, grok, openrouter)
 */
export async function handleSwitchAIService(
  interaction: ButtonInteraction, 
  serviceName: AIService
) {
  try {
    // دیفر کردن پاسخ برای جلوگیری از خطای تایم‌اوت
    await interaction.deferUpdate();
    
    // بررسی تنظیمات فعلی
    const aiSettings = botConfig.getAISettings();
    const currentService = aiSettings.service || 'huggingface';
    
    // دریافت نام نمایشی سرویس
    const serviceDisplayName = 
      serviceName === 'googleai' ? 'CCOIN AI' :
      serviceName === 'vertexai' ? 'CCOIN AI (Cloud)' :
      serviceName === 'ccoinai' ? 'CCOIN AI' :
      'نامشخص';
    
    // اگر سرویس از قبل فعال بود، پیام دهیم و برگردیم
    if (currentService === serviceName) {
      await interaction.editReply({
        content: `⚠️ سرویس ${serviceDisplayName} در حال حاضر فعال است.`
      });
      return;
    }
    
    // سرویس را تغییر دهیم
    const switched = switchAIProvider(serviceName);
    
    if (switched) {
      // پیام موفقیت
      const successEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('✅ تغییر سرویس هوش مصنوعی انجام شد')
        .setDescription(`سرویس هوش مصنوعی با موفقیت به ${serviceDisplayName} تغییر یافت.
        
تمام سیستم‌های هوش مصنوعی ربات از این پس از این سرویس استفاده خواهند کرد.`)
        .setFooter({ text: `درخواست‌دهنده: ${interaction.user.username} | ${new Date().toLocaleString()}` })
        .setTimestamp();
      
      await interaction.editReply({ content: '', embeds: [successEmbed] });
      
      // بعد از مدتی به منوی مدیریت هوش مصنوعی برگردیم
      setTimeout(async () => {
        try {
          // کدی که از منوی aiSettingsMenu استفاده می‌کند
          const { aiSettingsMenu } = require('../components/aiSettingsMenu');
          await aiSettingsMenu(interaction);
        } catch (error) {
          console.error('Error returning to AI settings menu:', error);
        }
      }, 3000);
    } else {
      // پیام خطا
      await interaction.editReply({
        content: '❌ تغییر سرویس هوش مصنوعی با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
      });
    }
  } catch (error) {
    console.error('Error handling AI service switch:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در تغییر سرویس هوش مصنوعی رخ داد.',
        ephemeral: true
      });
    } else {
      await interaction.editReply({
        content: '❌ خطایی در تغییر سرویس هوش مصنوعی رخ داد.'
      });
    }
  }
}

/**
 * انجام تست سرویس هوش مصنوعی
 * @param interaction تعامل دکمه
 */
export async function handleTestAIService(interaction: ButtonInteraction) {
  try {
    // دیفر کردن پاسخ برای جلوگیری از خطای تایم‌اوت
    await interaction.deferUpdate();
    
    // ارسال پیام انتظار
    await interaction.editReply({
      content: '🔄 در حال تست سرویس هوش مصنوعی... لطفاً صبر کنید (ممکن است تا 30 ثانیه طول بکشد).'
    });
    
    // انجام تست (با یک پرامپت ساده برای آزمایش)
    const testPrompt = 'یک جمله انگیزشی کوتاه به زبان فارسی بنویس (حداکثر 100 کاراکتر)';
    const testResult = await testAIService(testPrompt);
    
    // دریافت نام سرویس فعلی
    const aiSettings = botConfig.getAISettings();
    const serviceName = aiSettings.service === 'googleai' ? 'CCOIN AI' :
                   aiSettings.service === 'vertexai' ? 'CCOIN AI (Cloud)' :
                   aiSettings.service === 'ccoinai' ? 'CCOIN AI' :
                   'نامشخص';
    
    // ساخت امبد نتیجه
    const resultEmbed = new EmbedBuilder()
      .setColor(testResult.success ? '#2ECC71' : '#E74C3C')
      .setTitle(testResult.success ? '✅ تست هوش مصنوعی موفقیت‌آمیز بود' : '❌ تست هوش مصنوعی ناموفق بود')
      .setDescription(`**نتیجه تست سرویس ${serviceName}:**

${testResult.success ? `پاسخ دریافتی: "${testResult.response}"` : `خطا: ${testResult.error}`}

**زمان پاسخگویی:** ${testResult.latency}ms`)
      .setFooter({ text: `درخواست‌دهنده: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setTimestamp();
    
    await interaction.editReply({ content: '', embeds: [resultEmbed] });
  } catch (error) {
    console.error('Error testing AI service:', error);
    await interaction.editReply({
      content: '❌ خطایی در تست سرویس هوش مصنوعی رخ داد.'
    });
  }
}

/**
 * نمایش وضعیت و آمار هوش مصنوعی
 * @param interaction تعامل دکمه
 */
export async function handleViewAIStatus(interaction: ButtonInteraction) {
  try {
    // دیفر کردن پاسخ برای جلوگیری از خطای تایم‌اوت
    await interaction.deferUpdate();
    
    // دریافت وضعیت
    const aiStatus = getAIServiceStatus();
    
    // ساخت امبد آمار و وضعیت
    const statusEmbed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('📊 آمار و وضعیت هوش مصنوعی')
      .setDescription(`آمار استفاده از سرویس‌های هوش مصنوعی در ربات Ccoin`)
      .addFields(
        { 
          name: '🤖 سرویس فعلی', 
          value: aiStatus.service === 'googleai' ? 'CCOIN AI' :
                 aiStatus.service === 'vertexai' ? 'CCOIN AI (Cloud)' :
                 aiStatus.service === 'ccoinai' ? 'CCOIN AI' :
                 'نامشخص', 
          inline: true 
        },
        { 
          name: '📅 آخرین استفاده', 
          value: aiStatus.lastUsed ? new Date(aiStatus.lastUsed).toLocaleString() : 'هیچ وقت', 
          inline: true 
        },
        { 
          name: '🔢 تعداد کل درخواست‌ها', 
          value: aiStatus.requestCount.toLocaleString(), 
          inline: true 
        },
        { 
          name: '📊 درخواست‌های CCOIN AI', 
          value: aiStatus.providerStats.googleai ? aiStatus.providerStats.googleai.toLocaleString() : '0', 
          inline: true 
        },
        { 
          name: '📊 درخواست‌های CCOIN AI (Cloud)', 
          value: aiStatus.providerStats.vertexai ? aiStatus.providerStats.vertexai.toLocaleString() : '0', 
          inline: true 
        },
        { 
          name: '📊 درخواست‌های CCOIN AI (نسخه پایه)', 
          value: aiStatus.providerStats.ccoinai ? aiStatus.providerStats.ccoinai.toLocaleString() : '0', 
          inline: true 
        },
        { 
          name: '⏱️ میانگین زمان پاسخ', 
          value: `${aiStatus.averageLatency}ms`, 
          inline: true 
        },
        { 
          name: '📋 موارد استفاده', 
          value: 
`• تولید پیام‌های وضعیت (Status): ${aiStatus.usageCounts.statusMessages || 0}
• تحلیل بازار سهام: ${aiStatus.usageCounts.marketAnalysis || 0}
• تولید داستان ماموریت‌ها: ${aiStatus.usageCounts.questStories || 0}
• دستیار هوشمند: ${aiStatus.usageCounts.aiAssistant || 0}
• سایر موارد: ${aiStatus.usageCounts.other || 0}`,
          inline: false 
        }
      )
      .setFooter({ text: `درخواست‌دهنده: ${interaction.user.username} | ${new Date().toLocaleString()}` })
      .setTimestamp();
    
    await interaction.editReply({ content: '', embeds: [statusEmbed] });
  } catch (error) {
    console.error('Error viewing AI status:', error);
    await interaction.editReply({
      content: '❌ خطایی در نمایش وضعیت هوش مصنوعی رخ داد.'
    });
  }
}