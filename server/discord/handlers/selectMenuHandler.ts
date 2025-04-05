import { StringSelectMenuInteraction } from 'discord.js';
import { log } from '../../vite';

/**
 * پردازشگر اصلی برای تعاملات منوی انتخاب
 * @param interaction تعامل منوی انتخاب
 */
export async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction) {
  // دریافت شناسه سفارشی منوی انتخاب
  const customId = interaction.customId;
  
  try {
    // پردازش منوی راهنما
    if (customId === 'help_category_select') {
      // دریافت مقدار انتخاب شده
      const selectedCategory = interaction.values[0];
      log(`Help category selected: ${selectedCategory}`, 'info');
      
      // اگر تعامل هنوز پاسخ داده نشده، آن را به‌روزرسانی کنیم
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(err => {
          log(`Error deferring help menu update: ${err}`, 'error');
        });
      }
      
      // اضافه کردن log بیشتر برای دیباگ
      log(`Loading help menu for category: ${selectedCategory}`, 'info');
      
      try {
        // بجای import مستقیم در اینجا، می‌کنیم
        const { helpMenu } = await import('../components/helpMenu');
        log(`Help menu component loaded successfully`, 'info');
        
        // ایجاد Embed متناسب با دسته‌بندی
        await helpMenu(interaction as any, selectedCategory);
        log(`Help menu executed successfully for category: ${selectedCategory}`, 'info');
      } catch (helpError) {
        log(`Error in helpMenu: ${helpError}`, 'error');
        if (!interaction.replied) {
          await interaction.editReply({ 
            content: "❌ خطایی در بارگذاری منوی راهنما رخ داد. لطفاً دوباره تلاش کنید."
          }).catch(err => {
            log(`Error sending error message: ${err}`, 'error');
          });
        }
      }
      return;
    }
    
    // پردازش منوی انتخاب جاسوس مخفی برای رای‌گیری
    if (customId.startsWith('spy_vote_select_')) {
      const { processVote } = await import('../components/spyGame');
      await processVote(interaction);
      return;
    }
    
    // پردازش منوی انتخاب جاسوس مخفی برای حدس مکان
    if (customId.startsWith('spy_guess_location_')) {
      const { processSpyGuess } = await import('../components/spyGame');
      await processSpyGuess(interaction);
      return;
    }
    
    // پردازش منوی انتخاب جاسوس مخفی برای اخراج بازیکن
    if (customId.startsWith('spy_kick_select_')) {
      const { processSpyKickSelection } = await import('../components/spyGame');
      await processSpyKickSelection(interaction);
      return;
    }
    
    // حذف کدهای مربوط به بازی‌های فعلاً غیرفعال
    /*
    // پردازش منوی انتخاب گرگینه
    if (customId.startsWith('werewolf_vote_select_')) {
      const { processWerewolfVote } = await import('../components/werewolfGame');
      await processWerewolfVote(interaction);
      return;
    }
    
    // پردازش منوی انتخاب مافیا
    if (customId.startsWith('mafia_vote_select_')) {
      const { processMafiaVote } = await import('../components/mafiaGame');
      await processMafiaVote(interaction);
      return;
    }
    
    // پردازش منوی اصلی
    if (customId === 'main_menu_select') {
      const { handleMainMenuSelect } = await import('../components/mainMenu');
      const selectedOption = interaction.values[0];
      await handleMainMenuSelect(interaction, selectedOption);
      return;
    }
    */
    
    // پردازش منوی CCOIN AI
    if (customId === 'ccoin_ai_menu') {
      // دریافت مقدار انتخاب شده
      const selectedOption = interaction.values[0];
      log(`CCOIN AI menu option selected: ${selectedOption}`, 'info');
      
      // اگر تعامل هنوز پاسخ داده نشده، آن را به‌روزرسانی کنیم
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(err => {
          log(`Error deferring CCOIN AI menu update: ${err}`, 'error');
        });
      }
      
      try {
        // بارگذاری و فراخوانی توابع مناسب براساس گزینه انتخاب شده
        const { 
          showAIChatModal, 
          showImageAnalysisMenu, 
          showContentCreationModal,
          showCodeAssistantModal,
          showLearningAssistantModal 
        } = await import('../components/ccoinAIMenu');
        
        log(`CCOIN AI menu components loaded successfully`, 'info');
        
        // فراخوانی تابع مناسب براساس گزینه انتخاب شده
        switch (selectedOption) {
          case 'ai_chat':
            await showAIChatModal(interaction);
            log(`CCOIN AI chat modal shown successfully`, 'info');
            break;
          case 'image_analysis':
            await showImageAnalysisMenu(interaction);
            log(`CCOIN AI image analysis menu shown successfully`, 'info');
            break;
          case 'content_creation':
            await showContentCreationModal(interaction);
            log(`CCOIN AI content creation modal shown successfully`, 'info');
            break;
          case 'code_assistant':
            await showCodeAssistantModal(interaction);
            log(`CCOIN AI code assistant modal shown successfully`, 'info');
            break;
          case 'learning_assistant':
            await showLearningAssistantModal(interaction);
            log(`CCOIN AI learning assistant modal shown successfully`, 'info');
            break;
          default:
            log(`Unknown CCOIN AI menu option: ${selectedOption}`, 'warn');
            if (!interaction.replied) {
              await interaction.editReply({ 
                content: "❌ گزینه انتخاب شده نامعتبر است. لطفاً دوباره تلاش کنید."
              });
            }
        }
      } catch (aiError) {
        log(`Error in CCOIN AI menu: ${aiError}`, 'error');
        if (!interaction.replied) {
          await interaction.editReply({ 
            content: "❌ خطایی در پردازش منوی هوش مصنوعی رخ داد. لطفاً دوباره تلاش کنید."
          }).catch(err => {
            log(`Error sending error message: ${err}`, 'error');
          });
        }
      }
      return;
    }
    
    // اگر به اینجا رسیدیم، یعنی منو پردازش نشده است
    log(`Unhandled select menu interaction with customId: ${customId}`, 'warn');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ متأسفانه قادر به پردازش انتخاب شما نیستم. لطفاً مجدداً تلاش کنید.',
        ephemeral: true
      });
    }
    
  } catch (error) {
    log(`Error handling select menu interaction: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: '❌ متأسفانه خطایی در پردازش انتخاب شما رخ داد. لطفاً دوباره تلاش کنید.'
      }).catch(err => {
        log(`Error sending error message: ${err}`, 'error');
      });
    }
  }
}