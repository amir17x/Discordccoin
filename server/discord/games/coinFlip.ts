import { 
  ButtonInteraction, 
  MessageComponentInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} from 'discord.js';
import { storage } from '../../storage';
import { gamesMenu } from '../components/gamesMenu';

// Game constants
const BET_AMOUNT = 20;
const REWARD_AMOUNT = 40;

// Function to handle the coin flip game
export async function handleCoinFlip(
  interaction: MessageComponentInteraction,
  action: string
) {
  try {
    // برای جلوگیری از تایم‌اوت، ابتدا درخواست را معلق نگه می‌داریم اگر هنوز پاسخی ارسال نشده
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate();
    }
    
    // دریافت اطلاعات کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.'
        });
      } else if (interaction.replied) {
        await interaction.followUp({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
          ephemeral: true
        });
      }
      return;
    }
    
    // شروع بازی
    if (action === 'start') {
      // بررسی موجودی کافی
      if (user.wallet < BET_AMOUNT) {
        const errorContent = `❌ شما سکه کافی برای بازی ندارید. شما به ${BET_AMOUNT} سکه نیاز دارید اما فقط ${user.wallet} سکه دارید.`;
        
        if (interaction.deferred) {
          await interaction.editReply({ content: errorContent });
        } else if (interaction.replied) {
          await interaction.followUp({ content: errorContent, ephemeral: true });
        } else {
          await interaction.reply({ content: errorContent, ephemeral: true });
        }
        return;
      }
      
      // ساخت امبد بازی
      const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('🪙 بازی شیر یا خط')
        .setDescription(`یکی را انتخاب کن! اگر برنده شوی، ${REWARD_AMOUNT} سکه دریافت می‌کنی.`)
        .addFields(
          { name: '💰 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی', value: `${user.wallet} Ccoin`, inline: true }
        )
        .setFooter({ text: 'شیر یا خط را انتخاب کنید!' })
        .setTimestamp();
      
      // ساخت دکمه‌ها
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:coinflip:heads')
            .setLabel('🦁 شیر')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('game:coinflip:tails')
            .setLabel('🪙 خط')
            .setStyle(ButtonStyle.Success)
        );
      
      // دکمه بازگشت
      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      
      // ارسال پیام بازی بسته به وضعیت تعامل
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row, backRow] });
      } else if (interaction.replied) {
        await interaction.followUp({ embeds: [embed], components: [row, backRow], ephemeral: false });
      } else if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [embed], components: [row, backRow] });
        } catch (e) {
          await interaction.reply({ embeds: [embed], components: [row, backRow], ephemeral: false });
        }
      } else {
        await interaction.reply({ embeds: [embed], components: [row, backRow], ephemeral: false });
      }
      
      return;
    }
    
    // کاربر انتخاب کرده (شیر یا خط)
    
    // بررسی موجودی کافی
    if (user.wallet < BET_AMOUNT) {
      const errorContent = `❌ شما سکه کافی برای بازی ندارید. شما به ${BET_AMOUNT} سکه نیاز دارید اما فقط ${user.wallet} سکه دارید.`;
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorContent });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorContent, ephemeral: true });
      } else {
        await interaction.reply({ content: errorContent, ephemeral: true });
      }
      return;
    }
    
    // کسر مبلغ شرط از کیف پول
    await storage.addToWallet(user.id, -BET_AMOUNT);
    
    // تعیین نتیجه
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === action;
    
    // ساخت امبد نتیجه
    const resultEmbed = new EmbedBuilder()
      .setTitle('🪙 بازی شیر یا خط')
      .setTimestamp();
    
    // ساخت دکمه‌های رنگی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:coinflip:start')
          .setLabel('🔄 بازی مجدد')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('games')
          .setLabel('🔙 بازگشت به منوی بازی‌ها')
          .setStyle(ButtonStyle.Danger)
      );
    
    if (won) {
      // کاربر برنده شده
      await storage.addToWallet(user.id, REWARD_AMOUNT);
      
      resultEmbed
        .setColor('#2ECC71')
        .setDescription('🎉 تبریک! شما برنده شدید! 🎉')
        .addFields(
          { name: '🪙 نتیجه', value: action === 'heads' ? '🦁 شیر' : '🪙 خط', inline: true },
          { name: '💰 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی جدید', value: `${user.wallet + REWARD_AMOUNT - BET_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'برای بازی مجدد روی دکمه کلیک کنید' });
    } else {
      // کاربر باخته
      resultEmbed
        .setColor('#E74C3C')
        .setDescription('😔 متأسفانه این دفعه باختی!')
        .addFields(
          { name: '🪙 نتیجه', value: result === 'heads' ? '🦁 شیر' : '🪙 خط', inline: true },
          { name: '💰 از دست دادی', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی جدید', value: `${user.wallet - BET_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'می‌خواهی دوباره شانست رو امتحان کنی؟' });
    }
    
    // ثبت بازی
    await storage.recordGame(
      user.id,
      'coinflip',
      BET_AMOUNT,
      won,
      won ? REWARD_AMOUNT : 0
    );
    
    // بروزرسانی پیشرفت کوئست در صورت برنده شدن
    if (won) {
      const quests = await storage.getUserQuests(user.id);
      for (const { quest, userQuest } of quests) {
        if (quest.requirement === 'win' && !userQuest.completed) {
          await storage.updateQuestProgress(
            user.id,
            quest.id,
            userQuest.progress + 1
          );
        }
      }
    }
    
    // ارسال نتیجه
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [resultEmbed], components: [row] });
    } else if ('update' in interaction && typeof interaction.update === 'function') {
      try {
        await interaction.update({ embeds: [resultEmbed], components: [row] });
      } catch (e) {
        console.error("Error updating message:", e);
        if (!interaction.replied) {
          await interaction.reply({ embeds: [resultEmbed], components: [row], ephemeral: false });
        } else {
          await interaction.followUp({ embeds: [resultEmbed], components: [row], ephemeral: false });
        }
      }
    } else {
      if (!interaction.replied) {
        await interaction.reply({ embeds: [resultEmbed], components: [row], ephemeral: false });
      } else {
        await interaction.followUp({ embeds: [resultEmbed], components: [row], ephemeral: false });
      }
    }
    
  } catch (error) {
    console.error('Error in coin flip game:', error);
    
    try {
      const errorMessage = '❌ متأسفانه در اجرای بازی خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling coin flip failure:', e);
    }
  }
}
