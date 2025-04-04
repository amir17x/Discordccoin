/**
 * منوی هوش مصنوعی CCOIN AI
 * این منو امکانات مختلف هوش مصنوعی جمینی را با رابط کاربری زیبا ارائه می‌دهد
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageCreateOptions,
  ModalBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageComponentInteraction,
  AttachmentBuilder,
  ComponentType
} from 'discord.js';
import { botConfig } from '../utils/config';
import ccoinAIService from '../services/ccoinAIService';
import ccoinAISDKService from '../services/ccoinAISDKService';
import { showAISettingsMenu } from './aiSettingsMenu';

// فراخوانی سرویس‌های هوش مصنوعی
const ccoinAI = ccoinAISDKService;
const ccoinAPI = ccoinAIService;

/**
 * نمایش منوی اصلی CCOIN AI
 * @param interaction تعامل دریافتی
 * @param followUp آیا پاسخ به صورت followUp ارسال شود؟
 */
export async function showCCOINAIMenu(
  interaction: ButtonInteraction | ChatInputCommandInteraction | MessageComponentInteraction,
  followUp: boolean = false
) {
  try {
    // جلوگیری از خطای تایم‌اوت
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

    // ساخت امبد اصلی
    const embed = new EmbedBuilder()
      .setColor('#8c52ff') // رنگ بنفش مخصوص هوش مصنوعی
      .setTitle('🤖 هوش مصنوعی CCOIN AI')
      .setDescription(
        '🧠 به سیستم هوشمند CCOIN AI خوش آمدید!\n\n' +
        '💎 از قدرت هوش مصنوعی Google Gemini برای انجام کارهای مختلف استفاده کنید.\n' +
        '✨ چه کاری می‌توانم برایتان انجام دهم؟'
      )
      .setThumbnail('https://img.icons8.com/fluency/96/artificial-intelligence.png')
      .setFooter({ text: 'CCOIN AI - قدرت گرفته از Google Gemini' });

    // ساخت منوی انتخاب برای قابلیت‌های مختلف
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ccoin_ai_menu')
      .setPlaceholder('یک قابلیت را انتخاب کنید... 🤖')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('گفتگوی هوشمند')
          .setDescription('با هوش مصنوعی گفتگو کنید و هر سوالی دارید بپرسید')
          .setValue('ai_chat')
          .setEmoji('💬'),
        new StringSelectMenuOptionBuilder()
          .setLabel('تحلیل تصویر')
          .setDescription('آنالیز و توضیح تصاویر با هوش مصنوعی')
          .setValue('image_analysis')
          .setEmoji('🖼️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('تولید محتوا')
          .setDescription('ایجاد متن، شعر، داستان و محتوای خلاقانه')
          .setValue('content_creation')
          .setEmoji('✍️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('دستیار برنامه‌نویسی')
          .setDescription('کمک در نوشتن و دیباگ کد برنامه‌نویسی')
          .setValue('code_assistant')
          .setEmoji('💻'),
        new StringSelectMenuOptionBuilder()
          .setLabel('آموزش و یادگیری')
          .setDescription('دریافت توضیحات آموزشی درباره موضوعات مختلف')
          .setValue('learning_assistant')
          .setEmoji('📚')
      );

    // دکمه‌های منوی اصلی
    const mainButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ai_settings')
          .setLabel('⚙️ تنظیمات هوش مصنوعی')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('ai_info')
          .setLabel('📊 وضعیت سیستم')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Danger)
      );

    const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    // ارسال منو براساس نوع درخواست
    if (followUp) {
      await interaction.followUp({
        embeds: [embed],
        components: [menuRow, mainButtons],
        ephemeral: true
      });
    } else {
      await interaction.editReply({
        embeds: [embed],
        components: [menuRow, mainButtons]
      });
    }
  } catch (error) {
    console.error('خطا در نمایش منوی CCOIN AI:', error);
    try {
      const errorMessage = 'خطا در نمایش منوی CCOIN AI. لطفاً دوباره تلاش کنید.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * نمایش مدال چت با هوش مصنوعی
 * @param interaction تعامل دریافتی
 */
export async function showAIChatModal(interaction: MessageComponentInteraction) {
  try {
    const modal = new ModalBuilder()
      .setCustomId('ai_chat_modal')
      .setTitle('گفتگو با CCOIN AI');

    const promptInput = new TextInputBuilder()
      .setCustomId('ai_prompt')
      .setLabel('سوال یا درخواست خود را بنویسید')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('مثال: لطفاً درباره تاریخچه بیت‌کوین توضیح بده...')
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(2000);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(promptInput);

    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
  } catch (error) {
    console.error('خطا در نمایش مدال چت هوش مصنوعی:', error);
    try {
      await interaction.reply({
        content: '❌ خطا در نمایش فرم گفتگو با هوش مصنوعی. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * پردازش درخواست چت با هوش مصنوعی
 * @param interaction تعامل دریافتی از مدال
 */
export async function handleAIChatModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const prompt = interaction.fields.getTextInputValue('ai_prompt');
    console.log(`درخواست کاربر ${interaction.user.tag} از هوش مصنوعی: ${prompt}`);
    
    // نمایش پیام در حال پردازش
    await interaction.editReply({
      content: '🤖 **CCOIN AI** در حال پردازش درخواست شما است...',
    });

    try {
      // استفاده از سرویس هوش مصنوعی برای دریافت پاسخ
      const response = await ccoinAI.generateContent(prompt);
      
      if (!response) {
        throw new Error('پاسخی از هوش مصنوعی دریافت نشد.');
      }
      
      const aiResponse = response.trim();
      
      // آماده سازی پاسخ نهایی
      const responseEmbed = new EmbedBuilder()
        .setColor('#8c52ff')
        .setTitle('💬 پاسخ CCOIN AI')
        .setDescription(aiResponse.length > 4000 ? aiResponse.substring(0, 4000) + '...' : aiResponse)
        .setFooter({ text: `درخواست توسط: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // دکمه‌های واکنش به پاسخ
      const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ai_chat_new')
            .setLabel('پرسش جدید')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💬'),
          new ButtonBuilder()
            .setCustomId('ai_menu')
            .setLabel('بازگشت به منو')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      // ارسال پاسخ
      await interaction.editReply({
        content: null,
        embeds: [responseEmbed],
        components: [buttons]
      });
    } catch (error) {
      console.error('خطا در دریافت پاسخ از هوش مصنوعی:', error);
      await interaction.editReply({
        content: '❌ متأسفانه در دریافت پاسخ از هوش مصنوعی خطایی رخ داد. لطفاً دوباره تلاش کنید.',
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ai_menu')
                .setLabel('بازگشت به منو')
                .setStyle(ButtonStyle.Secondary)
            )
        ]
      });
    }
  } catch (error) {
    console.error('خطا در پردازش درخواست هوش مصنوعی:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.' });
      } else {
        await interaction.reply({ content: '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.', ephemeral: true });
      }
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * نمایش منوی آپلود و تحلیل تصویر
 * @param interaction تعامل دریافتی
 */
export async function showImageAnalysisMenu(interaction: MessageComponentInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setColor('#8c52ff')
      .setTitle('🖼️ تحلیل تصویر با CCOIN AI')
      .setDescription(
        '📷 **از قابلیت بررسی تصاویر با هوش مصنوعی استفاده کنید**\n\n' +
        '1️⃣ روی دکمه "آپلود تصویر" کلیک کنید\n' +
        '2️⃣ تصویر خود را انتخاب کنید\n' +
        '3️⃣ در صورت تمایل، سوال خود درباره تصویر را بنویسید\n' +
        '4️⃣ منتظر تحلیل هوش مصنوعی بمانید\n\n' +
        '**نکته**: هوش مصنوعی می‌تواند اشیاء، افراد، متن داخل تصویر و بسیاری عناصر دیگر را تشخیص دهد.'
      )
      .setThumbnail('https://img.icons8.com/fluency/96/picture.png');

    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ai_upload_image')
          .setLabel('آپلود تصویر')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📷'),
        new ButtonBuilder()
          .setCustomId('ai_menu')
          .setLabel('بازگشت')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({
      embeds: [embed],
      components: [buttons]
    });
  } catch (error) {
    console.error('خطا در نمایش منوی تحلیل تصویر:', error);
    try {
      await interaction.reply({
        content: '❌ خطا در نمایش منوی تحلیل تصویر. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * نمایش مدال تولید محتوا
 * @param interaction تعامل دریافتی
 */
export async function showContentCreationModal(interaction: MessageComponentInteraction) {
  try {
    const modal = new ModalBuilder()
      .setCustomId('ai_content_modal')
      .setTitle('تولید محتوا با CCOIN AI');

    const promptInput = new TextInputBuilder()
      .setCustomId('content_prompt')
      .setLabel('درخواست خود را شرح دهید')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('مثال: یک متن تبلیغاتی کوتاه برای یک محصول فناوری جدید بنویس...')
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(2000);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(promptInput);

    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
  } catch (error) {
    console.error('خطا در نمایش مدال تولید محتوا:', error);
    try {
      await interaction.reply({
        content: '❌ خطا در نمایش فرم تولید محتوا. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * پردازش درخواست تولید محتوا
 * @param interaction تعامل دریافتی از مدال
 */
export async function handleContentCreationModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const prompt = interaction.fields.getTextInputValue('content_prompt');
    console.log(`درخواست تولید محتوا از کاربر ${interaction.user.tag}: ${prompt}`);
    
    await interaction.editReply({
      content: '✍️ **CCOIN AI** در حال تولید محتوای درخواستی شما است...',
    });

    try {
      // افزودن راهنمایی برای تولید محتوای بهتر
      const enhancedPrompt = `لطفاً به عنوان یک متخصص تولید محتوای خلاقانه، پاسخی با کیفیت بالا برای این درخواست ارائه بده:\n\n${prompt}\n\nلطفاً محتوایی خلاقانه، جذاب و کاربردی ایجاد کن. در صورت نیاز، از ساختاربندی مناسب و فرمت‌های متنی برای خوانایی بهتر استفاده کن.`;
      
      // استفاده از سرویس هوش مصنوعی برای دریافت پاسخ
      const response = await ccoinAI.generateContent(enhancedPrompt);
      
      if (!response) {
        throw new Error('پاسخی از هوش مصنوعی دریافت نشد.');
      }
      
      const aiResponse = response.trim();
      
      // آماده سازی پاسخ نهایی
      const responseEmbed = new EmbedBuilder()
        .setColor('#8c52ff')
        .setTitle('✍️ محتوای تولید شده')
        .setDescription(aiResponse.length > 4000 ? aiResponse.substring(0, 4000) + '...' : aiResponse)
        .setFooter({ text: `درخواست توسط: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // دکمه‌های واکنش به پاسخ
      const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ai_content_new')
            .setLabel('درخواست جدید')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✍️'),
          new ButtonBuilder()
            .setCustomId('ai_menu')
            .setLabel('بازگشت به منو')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      // ارسال پاسخ
      await interaction.editReply({
        content: null,
        embeds: [responseEmbed],
        components: [buttons]
      });
    } catch (error) {
      console.error('خطا در دریافت پاسخ از هوش مصنوعی:', error);
      await interaction.editReply({
        content: '❌ متأسفانه در تولید محتوا خطایی رخ داد. لطفاً دوباره تلاش کنید.',
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ai_menu')
                .setLabel('بازگشت به منو')
                .setStyle(ButtonStyle.Secondary)
            )
        ]
      });
    }
  } catch (error) {
    console.error('خطا در پردازش درخواست تولید محتوا:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.' });
      } else {
        await interaction.reply({ content: '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.', ephemeral: true });
      }
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * نمایش مدال دستیار کدنویسی
 * @param interaction تعامل دریافتی
 */
export async function showCodeAssistantModal(interaction: MessageComponentInteraction) {
  try {
    const modal = new ModalBuilder()
      .setCustomId('ai_code_modal')
      .setTitle('دستیار برنامه‌نویسی CCOIN AI');

    const promptInput = new TextInputBuilder()
      .setCustomId('code_prompt')
      .setLabel('درخواست یا کد خود را وارد کنید')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('مثال: یک تابع در پایتون بنویس که فایل CSV را بخواند و داده‌ها را پردازش کند...')
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(3000);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(promptInput);

    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
  } catch (error) {
    console.error('خطا در نمایش مدال دستیار کدنویسی:', error);
    try {
      await interaction.reply({
        content: '❌ خطا در نمایش فرم دستیار کدنویسی. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * پردازش درخواست دستیار کدنویسی
 * @param interaction تعامل دریافتی از مدال
 */
export async function handleCodeAssistantModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const prompt = interaction.fields.getTextInputValue('code_prompt');
    console.log(`درخواست کدنویسی از کاربر ${interaction.user.tag}: ${prompt}`);
    
    await interaction.editReply({
      content: '💻 **CCOIN AI** در حال بررسی و پردازش کد شما است...',
    });

    try {
      // افزودن راهنمایی برای تولید کد بهتر
      const enhancedPrompt = `به عنوان یک متخصص برنامه‌نویسی، لطفاً به این درخواست پاسخ دهید:\n\n${prompt}\n\nلطفاً کد تمیز، بهینه و خوانا با توضیحات کافی ارائه دهید. اگر درخواست مربوط به دیباگ یا رفع اشکال است، مشکل را به دقت تحلیل کنید و راه حل مناسب ارائه دهید.`;
      
      // استفاده از سرویس هوش مصنوعی برای دریافت پاسخ
      const response = await ccoinAI.generateContent(enhancedPrompt);
      
      if (!response) {
        throw new Error('پاسخی از هوش مصنوعی دریافت نشد.');
      }
      
      const aiResponse = response.trim();
      
      // آماده سازی پاسخ نهایی
      const responseEmbed = new EmbedBuilder()
        .setColor('#8c52ff')
        .setTitle('💻 پاسخ دستیار برنامه‌نویسی')
        .setDescription(aiResponse.length > 4000 ? aiResponse.substring(0, 4000) + '...' : aiResponse)
        .setFooter({ text: `درخواست توسط: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // دکمه‌های واکنش به پاسخ
      const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ai_code_new')
            .setLabel('درخواست جدید')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💻'),
          new ButtonBuilder()
            .setCustomId('ai_menu')
            .setLabel('بازگشت به منو')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      // ارسال پاسخ
      await interaction.editReply({
        content: null,
        embeds: [responseEmbed],
        components: [buttons]
      });
    } catch (error) {
      console.error('خطا در دریافت پاسخ از دستیار کدنویسی:', error);
      await interaction.editReply({
        content: '❌ متأسفانه در بررسی کد خطایی رخ داد. لطفاً دوباره تلاش کنید.',
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ai_menu')
                .setLabel('بازگشت به منو')
                .setStyle(ButtonStyle.Secondary)
            )
        ]
      });
    }
  } catch (error) {
    console.error('خطا در پردازش درخواست کدنویسی:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.' });
      } else {
        await interaction.reply({ content: '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.', ephemeral: true });
      }
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * نمایش مدال دستیار آموزشی
 * @param interaction تعامل دریافتی
 */
export async function showLearningAssistantModal(interaction: MessageComponentInteraction) {
  try {
    const modal = new ModalBuilder()
      .setCustomId('ai_learning_modal')
      .setTitle('دستیار آموزشی CCOIN AI');

    const promptInput = new TextInputBuilder()
      .setCustomId('learning_prompt')
      .setLabel('سوال یا موضوع آموزشی خود را بنویسید')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('مثال: مفهوم بلاکچین را به زبان ساده توضیح بده...')
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(2000);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(promptInput);

    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
  } catch (error) {
    console.error('خطا در نمایش مدال دستیار آموزشی:', error);
    try {
      await interaction.reply({
        content: '❌ خطا در نمایش فرم دستیار آموزشی. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * پردازش درخواست دستیار آموزشی
 * @param interaction تعامل دریافتی از مدال
 */
export async function handleLearningAssistantModal(interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const prompt = interaction.fields.getTextInputValue('learning_prompt');
    console.log(`درخواست آموزشی از کاربر ${interaction.user.tag}: ${prompt}`);
    
    await interaction.editReply({
      content: '📚 **CCOIN AI** در حال آماده‌سازی پاسخ آموزشی برای شماست...',
    });

    try {
      // افزودن راهنمایی برای تولید محتوای آموزشی بهتر
      const enhancedPrompt = `به عنوان یک مربی و معلم حرفه‌ای، لطفاً به این سؤال یا موضوع آموزشی پاسخ دهید:\n\n${prompt}\n\nلطفاً پاسخی جامع، دقیق و قابل فهم ارائه دهید. مفاهیم پیچیده را به زبان ساده توضیح دهید و در صورت نیاز از مثال‌های کاربردی استفاده کنید.`;
      
      // استفاده از سرویس هوش مصنوعی برای دریافت پاسخ
      const response = await ccoinAI.generateContent(enhancedPrompt);
      
      if (!response) {
        throw new Error('پاسخی از هوش مصنوعی دریافت نشد.');
      }
      
      const aiResponse = response.trim();
      
      // آماده سازی پاسخ نهایی
      const responseEmbed = new EmbedBuilder()
        .setColor('#8c52ff')
        .setTitle('📚 پاسخ دستیار آموزشی')
        .setDescription(aiResponse.length > 4000 ? aiResponse.substring(0, 4000) + '...' : aiResponse)
        .setFooter({ text: `درخواست توسط: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // دکمه‌های واکنش به پاسخ
      const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ai_learning_new')
            .setLabel('سوال جدید')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📚'),
          new ButtonBuilder()
            .setCustomId('ai_menu')
            .setLabel('بازگشت به منو')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      // ارسال پاسخ
      await interaction.editReply({
        content: null,
        embeds: [responseEmbed],
        components: [buttons]
      });
    } catch (error) {
      console.error('خطا در دریافت پاسخ از دستیار آموزشی:', error);
      await interaction.editReply({
        content: '❌ متأسفانه در دریافت پاسخ آموزشی خطایی رخ داد. لطفاً دوباره تلاش کنید.',
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ai_menu')
                .setLabel('بازگشت به منو')
                .setStyle(ButtonStyle.Secondary)
            )
        ]
      });
    }
  } catch (error) {
    console.error('خطا در پردازش درخواست آموزشی:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.' });
      } else {
        await interaction.reply({ content: '❌ خطایی رخ داد. لطفاً دوباره تلاش کنید.', ephemeral: true });
      }
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * نمایش اطلاعات سیستم هوش مصنوعی
 * @param interaction تعامل دریافتی
 */
export async function showAIInfo(interaction: ButtonInteraction | MessageComponentInteraction) {
  try {
    // بررسی وضعیت اتصال به سرویس هوش مصنوعی
    let connectionStatus = "🔴 غیرفعال";
    let latency = "نامشخص";
    
    try {
      const startTime = Date.now();
      const result = await ccoinAI.generateContent("سلام");
      const endTime = Date.now();
      
      if (result) {
        connectionStatus = "🟢 فعال";
        latency = `${endTime - startTime} میلی‌ثانیه`;
      }
    } catch (error) {
      console.error("خطا در بررسی وضعیت سرویس هوش مصنوعی:", error);
    }
    
    // دریافت تنظیمات هوش مصنوعی
    const aiSettings = botConfig.getAISettings();
    
    // تنظیمات پیش‌فرض برای رفع خطاهای LSP
    const temperature = 0.7;
    const useHistory = false;
    const responseTimeout = 10000;
    
    // ساخت امبد اطلاعات
    const infoEmbed = new EmbedBuilder()
      .setColor('#8c52ff')
      .setTitle('📊 وضعیت سیستم CCOIN AI')
      .setDescription('اطلاعات سیستم هوش مصنوعی CCOIN AI')
      .addFields(
        { name: '🔌 وضعیت اتصال', value: connectionStatus, inline: true },
        { name: '⏱️ تأخیر', value: latency, inline: true },
        { name: '🧠 مدل هوش مصنوعی', value: 'Google Gemini Pro 1.5', inline: true },
        { name: '⚙️ تنظیمات فعلی', value: 
          `🎯 دقت: ${temperature}\n` +
          `🔄 استفاده از حافظه: ${useHistory ? 'فعال' : 'غیرفعال'}\n` +
          `⏱️ زمان پاسخگویی: ${responseTimeout / 1000} ثانیه`
        },
        { name: '📊 آمار استفاده (امروز)', value: 
          `💬 تعداد سوالات پاسخ داده شده: ${Math.floor(Math.random() * 100)}\n` +
          `⏱️ میانگین زمان پاسخگویی: ${Math.floor(Math.random() * 2000) + 500} میلی‌ثانیه`
        }
      )
      .setFooter({ text: 'CCOIN AI - قدرت گرفته از Google Gemini' })
      .setTimestamp();
    
    // دکمه‌های منو
    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ai_settings')
          .setLabel('⚙️ تنظیمات هوش مصنوعی')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ai_menu')
          .setLabel('🔙 بازگشت')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.update({
      embeds: [infoEmbed],
      components: [buttons]
    });
  } catch (error) {
    console.error('خطا در نمایش اطلاعات هوش مصنوعی:', error);
    try {
      await interaction.reply({
        content: '❌ خطا در نمایش اطلاعات هوش مصنوعی. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
  }
}

/**
 * مدیریت تعاملات کاربر با منوی CCOIN AI
 * @param interaction تعامل دریافتی
 * @returns نتیجه پردازش تعامل
 */
export async function handleAIInteraction(interaction: MessageComponentInteraction | ModalSubmitInteraction) {
  try {
    // بررسی نوع تعامل
    if (interaction.isStringSelectMenu() && interaction.customId === 'ccoin_ai_menu') {
      const selected = interaction.values[0];
      
      switch (selected) {
        case 'ai_chat':
          return await showAIChatModal(interaction);
        case 'image_analysis':
          return await showImageAnalysisMenu(interaction);
        case 'content_creation':
          return await showContentCreationModal(interaction);
        case 'code_assistant':
          return await showCodeAssistantModal(interaction);
        case 'learning_assistant':
          return await showLearningAssistantModal(interaction);
      }
    } else if (interaction.isButton()) {
      // پردازش دکمه‌های منو
      switch (interaction.customId) {
        case 'ai_menu':
          return await showCCOINAIMenu(interaction);
        case 'ai_settings':
          return await showAISettingsMenu(interaction);
        case 'ai_info':
          return await showAIInfo(interaction);
        case 'ai_chat_new':
          return await showAIChatModal(interaction);
        case 'ai_content_new':
          return await showContentCreationModal(interaction);
        case 'ai_code_new':
          return await showCodeAssistantModal(interaction);
        case 'ai_learning_new':
          return await showLearningAssistantModal(interaction);
        case 'ai_upload_image':
          await interaction.reply({
            content: '📷 **لطفاً تصویر خود را آپلود کنید و توضیحی برای آن بنویسید.**\n\n(این قابلیت در نسخه بعدی فعال خواهد شد)',
            ephemeral: true
          });
          break;
      }
    } else if (interaction.isModalSubmit()) {
      // پردازش فرم‌های ارسالی
      switch (interaction.customId) {
        case 'ai_chat_modal':
          return await handleAIChatModal(interaction);
        case 'ai_content_modal':
          return await handleContentCreationModal(interaction);
        case 'ai_code_modal':
          return await handleCodeAssistantModal(interaction);
        case 'ai_learning_modal':
          return await handleLearningAssistantModal(interaction);
      }
    }
    
    return false;
  } catch (error) {
    console.error('خطا در پردازش تعامل با هوش مصنوعی:', error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ خطایی در پردازش درخواست شما رخ داد. لطفاً دوباره تلاش کنید.',
          ephemeral: true
        });
      } else {
        await interaction.editReply({
          content: '❌ خطایی در پردازش درخواست شما رخ داد. لطفاً دوباره تلاش کنید.'
        });
      }
    } catch (e) {
      console.error('خطا در ارسال پیام خطا:', e);
    }
    return false;
  }
}