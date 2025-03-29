/**
 * منوی تنظیمات هوش مصنوعی و امکانات آن در ربات Ccoin
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction
} from 'discord.js';
import { botConfig } from '../utils/config';
import { ccoinAIService } from '../services/ccoinAIService';
import { createBotAIPrompt } from '../utils/botGeminiPrompt';

/**
 * ایجاد منوی تنظیمات AI
 * @param interaction تعامل دریافتی (دکمه یا دستور)
 */
export async function showAISettingsMenu(interaction: ButtonInteraction | ChatInputCommandInteraction) {
  try {
    // دریافت تنظیمات فعلی AI
    const aiSettings = botConfig.getAISettings();
    
    // بررسی وضعیت ارتباط با CCOIN AI
    const pingResult = await ccoinAIService.pingCCOINAI();
    let statusText = '';
    let statusColor = '';
    
    if (pingResult > 0) {
      statusText = `✅ متصل (${pingResult}ms)`;
      statusColor = pingResult < 500 ? '🟢' : pingResult < 1000 ? '🟡' : '🟠';
    } else {
      statusText = '❌ عدم ارتباط';
      statusColor = '🔴';
      
      if (pingResult === -401) {
        statusText += ' (خطای احراز هویت)';
      } else if (pingResult === -429) {
        statusText += ' (محدودیت درخواست)';
      } else if (pingResult === -500) {
        statusText += ' (خطای سرور)';
      } else if (pingResult === -2) {
        statusText += ' (تایم‌اوت)';
      }
    }
    
    // ساخت امبد اصلی تنظیمات
    const embed = new EmbedBuilder()
      .setTitle('تنظیمات هوش مصنوعی Ccoin')
      .setDescription('در این بخش می‌توانید تنظیمات مربوط به سیستم هوش مصنوعی (AI) ربات را مدیریت کنید.')
      .setColor('#9B59B6')
      .addFields(
        { name: 'وضعیت ارتباط CCOIN AI', value: `${statusColor} ${statusText}`, inline: false },
        { name: '🤖 مدل فعال', value: aiSettings.googleModel || 'gemini-1.5-pro', inline: true },
        { name: '🧠 حالت پاسخگویی', value: aiSettings.responseStyle || 'متعادل', inline: true },
        { name: '⚙️ سیستم راهنما', value: 'فعال (CCOIN AI)', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Ccoin AI System' });
    
    // ایجاد منوی انتخاب مدل
    const modelSelect = new StringSelectMenuBuilder()
      .setCustomId('ai_model_select')
      .setPlaceholder('انتخاب مدل هوش مصنوعی')
      .addOptions([
        { label: 'CCOIN AI Pro', description: 'مدل قدرتمند CCOIN AI (توصیه شده)', value: 'gemini-1.5-pro', default: aiSettings.googleModel === 'gemini-1.5-pro' },
        { label: 'CCOIN AI Fast', description: 'مدل سریع CCOIN AI', value: 'gemini-1.5-flash', default: aiSettings.googleModel === 'gemini-1.5-flash' },
        { label: 'CCOIN AI Standard', description: 'مدل پایدار استاندارد', value: 'gemini-pro', default: aiSettings.googleModel === 'gemini-pro' }
      ]);
    
    // ایجاد منوی انتخاب سبک پاسخگویی
    const styleSelect = new StringSelectMenuBuilder()
      .setCustomId('ai_style_select')
      .setPlaceholder('انتخاب سبک پاسخگویی')
      .addOptions([
        { label: 'متعادل', description: 'سبک پاسخگویی عادی (پیش‌فرض)', value: 'balanced', default: aiSettings.responseStyle === 'متعادل' || !aiSettings.responseStyle },
        { label: 'خلاقانه', description: 'پاسخ‌های متنوع و خلاقانه‌تر', value: 'creative', default: aiSettings.responseStyle === 'خلاقانه' },
        { label: 'دقیق', description: 'پاسخ‌های دقیق‌تر و کمتر خلاقانه', value: 'precise', default: aiSettings.responseStyle === 'دقیق' },
        { label: 'طنزآمیز', description: 'پاسخ‌های شوخ و بامزه', value: 'funny', default: aiSettings.responseStyle === 'طنزآمیز' }
      ]);
    
    // ایجاد دکمه‌های کنترلی
    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ai_test')
          .setLabel('تست هوش مصنوعی')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🧪'),
        new ButtonBuilder()
          .setCustomId('ai_reset')
          .setLabel('بازنشانی تنظیمات')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔄'),
        new ButtonBuilder()
          .setCustomId('ai_help')
          .setLabel('راهنمای استفاده')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❓')
      );
    
    // ارسال منو به کاربر
    await interaction.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(modelSelect),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(styleSelect),
        buttons
      ],
      ephemeral: true // فقط برای خود کاربر قابل مشاهده باشد
    });
    
  } catch (error) {
    console.error('Error in AI settings menu:', error);
    await interaction.reply({
      content: '❌ خطا در نمایش منوی تنظیمات هوش مصنوعی.',
      ephemeral: true
    });
  }
}

/**
 * رسیدگی به انتخاب مدل هوش مصنوعی 
 * @param interaction تعامل منوی انتخاب
 */
export async function handleModelSelect(interaction: StringSelectMenuInteraction) {
  try {
    const modelId = interaction.values[0];
    const previousSettings = botConfig.getAISettings();
    
    // به‌روزرسانی تنظیمات با مدل جدید
    botConfig.updateAISettings({
      ...previousSettings,
      googleModel: modelId
    });
    
    // پیام تأیید
    await interaction.update({
      content: `✅ مدل هوش مصنوعی با موفقیت به \`${modelId}\` تغییر یافت.`,
      components: interaction.message.components
    });
    
  } catch (error) {
    console.error('Error in AI model selection:', error);
    await interaction.reply({
      content: '❌ خطا در تغییر مدل هوش مصنوعی.',
      ephemeral: true
    });
  }
}

/**
 * رسیدگی به انتخاب سبک پاسخگویی
 * @param interaction تعامل منوی انتخاب
 */
export async function handleStyleSelect(interaction: StringSelectMenuInteraction) {
  try {
    const style = interaction.values[0];
    const previousSettings = botConfig.getAISettings();
    
    // نام فارسی سبک
    let styleName = 'متعادل';
    if (style === 'creative') styleName = 'خلاقانه';
    else if (style === 'precise') styleName = 'دقیق';
    else if (style === 'funny') styleName = 'طنزآمیز';
    
    // به‌روزرسانی تنظیمات با سبک جدید
    botConfig.updateAISettings({
      ...previousSettings,
      responseStyle: styleName
    });
    
    // پیام تأیید
    await interaction.update({
      content: `✅ سبک پاسخگویی هوش مصنوعی با موفقیت به \`${styleName}\` تغییر یافت.`,
      components: interaction.message.components
    });
    
  } catch (error) {
    console.error('Error in AI style selection:', error);
    await interaction.reply({
      content: '❌ خطا در تغییر سبک پاسخگویی هوش مصنوعی.',
      ephemeral: true
    });
  }
}

/**
 * رسیدگی به دکمه تست هوش مصنوعی
 * @param interaction تعامل دکمه
 */
export async function handleTestAI(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const testPrompt = "سلام! لطفاً خودت رو معرفی کن و بگو چه کمکی می‌تونی به کاربران Ccoin بکنی؟";
    
    // استفاده از پرامپت راهنما برای ایجاد پاسخ با سبک فعلی
    const aiSettings = botConfig.getAISettings();
    const responseStyle = aiSettings.responseStyle || 'متعادل';
    const response = await ccoinAIService.generateResponse(testPrompt, responseStyle);
    
    const embed = new EmbedBuilder()
      .setTitle('🧪 تست هوش مصنوعی CCOIN AI')
      .setDescription('نتیجه تست ارتباط با هوش مصنوعی:')
      .setColor('#2ECC71')
      .addFields(
        { name: 'پرامپت تست:', value: testPrompt, inline: false },
        { name: 'پاسخ دریافتی:', value: response.length > 1024 ? response.substring(0, 1021) + '...' : response, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'CCOIN AI Test' });
    
    await interaction.editReply({
      embeds: [embed]
    });
    
  } catch (error) {
    console.error('Error in AI test:', error);
    await interaction.editReply({
      content: `❌ خطا در تست هوش مصنوعی: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
    });
  }
}

/**
 * رسیدگی به دکمه بازنشانی تنظیمات
 * @param interaction تعامل دکمه
 */
export async function handleResetAI(interaction: ButtonInteraction) {
  try {
    // بازنشانی تنظیمات به حالت پیش‌فرض
    botConfig.updateAISettings({
      googleModel: 'gemini-1.5-pro',
      responseStyle: 'متعادل'
    });
    
    await interaction.update({
      content: '✅ تنظیمات هوش مصنوعی به حالت پیش‌فرض بازنشانی شد.',
      components: interaction.message.components
    });
    
    // نمایش مجدد منو پس از چند ثانیه
    setTimeout(() => {
      showAISettingsMenu(interaction);
    }, 2000);
    
  } catch (error) {
    console.error('Error in AI settings reset:', error);
    await interaction.reply({
      content: '❌ خطا در بازنشانی تنظیمات هوش مصنوعی.',
      ephemeral: true
    });
  }
}

/**
 * رسیدگی به دکمه راهنمای هوش مصنوعی
 * @param interaction تعامل دکمه
 */
export async function handleAIHelp(interaction: ButtonInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('📚 راهنمای سیستم هوش مصنوعی Ccoin')
      .setDescription('آشنایی با امکانات و تنظیمات هوش مصنوعی ربات')
      .setColor('#3498DB')
      .addFields(
        { 
          name: '🤖 مدل‌های هوش مصنوعی', 
          value: 
            '• **CCOIN AI Pro**: مدل قدرتمند با توانایی پردازش متن و درک بالا (توصیه شده)\n' +
            '• **CCOIN AI Fast**: مدل سریع‌تر با کارایی بالا، مناسب برای پاسخ‌های سریع\n' +
            '• **CCOIN AI Standard**: نسخه استاندارد و پایدار'
        },
        { 
          name: '✏️ سبک‌های پاسخگویی', 
          value: 
            '• **متعادل**: سبک استاندارد با تعادل بین دقت و خلاقیت\n' +
            '• **خلاقانه**: پاسخ‌های متنوع‌تر با خلاقیت بیشتر\n' +
            '• **دقیق**: پاسخ‌های دقیق‌تر و کمتر متنوع\n' +
            '• **طنزآمیز**: پاسخ‌های با چاشنی شوخی و سرگرمی'
        },
        { 
          name: '🧠 سیستم راهنمای CCOIN AI', 
          value: 'دستیار هوشمند CCOIN AI با دانش کامل درباره ویژگی‌های ربات Ccoin، آماده پاسخگویی به سؤالات کاربران است. این سیستم به طور دقیق با ویژگی‌های اقتصادی، بازی‌ها، کلن‌ها و دیگر امکانات ربات آشنایی دارد.'
        },
        { 
          name: '📝 استفاده از هوش مصنوعی', 
          value: 'برای استفاده از دستیار هوشمند CCOIN AI، از دستور `/ai` استفاده کنید. توجه داشته باشید که استفاده از این ویژگی دارای محدودیت است و نیاز به خرید اشتراک دارد.'
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Ccoin AI System Guide' });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    
  } catch (error) {
    console.error('Error in AI help display:', error);
    await interaction.reply({
      content: '❌ خطا در نمایش راهنمای هوش مصنوعی.',
      ephemeral: true
    });
  }
}

// صادرات مستقیم متدها برای استفاده در سایر بخش‌ها
// توجه: فقط از یک روش صادرات استفاده می‌کنیم تا از خطای صادرات مضاعف جلوگیری شود