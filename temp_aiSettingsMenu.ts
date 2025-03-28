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
    
    // افزودن فیلدها به Embed
    embed.addFields(
      { 
        name: '🤖 سرویس فعلی هوش مصنوعی', 
        value: aiService === 'openai' ? 
          '**OpenAI (ChatGPT)** - کیفیت بالاتر با محدودیت بیشتر' : 
          '**Hugging Face** - کیفیت متوسط بدون محدودیت', 
        inline: false 
      },
      { 
        name: '📊 مقایسه سرویس‌ها', 
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
        `⚠️ درک محدودتر زبان فارسی`, 
        inline: false 
      }
    );
    
    // دکمه‌های تغییر سرویس
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_switch_to_openai')
          .setLabel('استفاده از OpenAI')
          .setEmoji('🤖')
          .setStyle(aiService === 'openai' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'openai'),
        new ButtonBuilder()
          .setCustomId('admin_switch_to_huggingface')
          .setLabel('استفاده از Hugging Face')
          .setEmoji('🧠')
          .setStyle(aiService === 'huggingface' ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(aiService === 'huggingface'),
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