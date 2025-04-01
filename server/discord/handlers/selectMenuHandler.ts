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
    
    // اگر به اینجا رسیدیم، یعنی منو پردازش نشده است
    log(`Unhandled select menu interaction with customId: ${customId}`, 'warn');
    await interaction.reply({
      content: '❌ این گزینه در حال حاضر فعال نیست یا قابل پردازش نمی‌باشد.',
      ephemeral: true
    });
    
  } catch (error) {
    log(`Error handling select menu interaction: ${error}`, 'error');
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.',
        ephemeral: true
      });
    }
  }
}