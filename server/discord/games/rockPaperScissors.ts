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

// Function to handle the rock paper scissors game
export async function handleRockPaperScissors(
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
          content: '⚠️ شما ابتدا باید یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.'
        });
      } else if (interaction.replied) {
        await interaction.followUp({
          content: '⚠️ شما ابتدا باید یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '⚠️ شما ابتدا باید یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
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
        .setColor('#3498DB')
        .setTitle('✂️ بازی سنگ کاغذ قیچی')
        .setDescription(`یکی را انتخاب کن! اگر برنده شوی، ${REWARD_AMOUNT} سکه دریافت می‌کنی.`)
        .addFields(
          { name: '💰 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی', value: `${user.wallet} Ccoin`, inline: true }
        )
        .setFooter({ text: 'سنگ، کاغذ یا قیچی را انتخاب کنید!' })
        .setTimestamp();
      
      // ساخت دکمه‌ها
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:rps:rock')
            .setLabel('🪨 سنگ')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('game:rps:paper')
            .setLabel('📄 کاغذ')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('game:rps:scissors')
            .setLabel('✂️ قیچی')
            .setStyle(ButtonStyle.Danger)
        );
      
      // دکمه بازگشت
      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Secondary)
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
    
    // User made a choice (rock, paper, or scissors)
    
    // Check if user has enough Ccoin
    if (user.wallet < BET_AMOUNT) {
      await interaction.reply({
        content: `💰 سکه‌های شما برای بازی کافی نیست. شما به ${BET_AMOUNT} سکه نیاز دارید اما ${user.wallet} سکه در کیف پول خود دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // Deduct bet amount from user's wallet
    await storage.addToWallet(user.id, -BET_AMOUNT);
    
    // Determine the bot's choice
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    
    // Determine the result
    let result: 'win' | 'lose' | 'draw';
    
    if (action === botChoice) {
      result = 'draw';
    } else if (
      (action === 'rock' && botChoice === 'scissors') ||
      (action === 'paper' && botChoice === 'rock') ||
      (action === 'scissors' && botChoice === 'paper')
    ) {
      result = 'win';
    } else {
      result = 'lose';
    }
    
    // Emoji mapping
    const choiceEmojis: Record<string, string> = {
      rock: '🪨',
      paper: '📄',
      scissors: '✂️'
    };
    
    // Persian names
    const choiceNames: Record<string, string> = {
      rock: 'سنگ',
      paper: 'کاغذ',
      scissors: 'قیچی'
    };
    
    // Create the result embed
    const resultEmbed = new EmbedBuilder()
      .setTitle('✂️ بازی سنگ کاغذ قیچی')
      .addFields(
        { name: '🎮 انتخاب شما', value: `${choiceEmojis[action]} ${choiceNames[action]}`, inline: true },
        { name: '🤖 انتخاب ربات', value: `${choiceEmojis[botChoice]} ${choiceNames[botChoice]}`, inline: true }
      )
      .setTimestamp();
    
    // Create colorful buttons for next actions
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:rps:start')
          .setLabel('🔄 بازی مجدد')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('games')
          .setLabel('🔙 بازگشت به منوی بازی‌ها')
          .setStyle(ButtonStyle.Danger)
      );
    
    let won = false;
    
    if (result === 'win') {
      // User won
      won = true;
      await storage.addToWallet(user.id, REWARD_AMOUNT);
      
      resultEmbed
        .setColor('#2ECC71')
        .setDescription('🎉 تبریک! شما برنده شدید! 🎉')
        .addFields(
          { name: '💰 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی جدید', value: `${user.wallet + REWARD_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'برای بازی مجدد روی دکمه کلیک کنید' });
    } else if (result === 'lose') {
      // User lost
      resultEmbed
        .setColor('#E74C3C')
        .setDescription('😔 متأسفانه این دفعه باختی!')
        .addFields(
          { name: '💰 از دست دادی', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی جدید', value: `${user.wallet - BET_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'می‌خواهی دوباره شانست رو امتحان کنی؟' });
    } else {
      // Draw
      await storage.addToWallet(user.id, BET_AMOUNT); // Return the bet
      
      resultEmbed
        .setColor('#F1C40F')
        .setDescription('🤝 مساوی شد!')
        .addFields(
          { name: '💰 برگشت هزینه', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی', value: `${user.wallet} Ccoin`, inline: true }
        )
        .setFooter({ text: 'می‌خواهی دوباره بازی کنی؟' });
    }
    
    // Record the game (don't record draws)
    if (result !== 'draw') {
      await storage.recordGame(
        user.id,
        'rps',
        BET_AMOUNT,
        won,
        won ? REWARD_AMOUNT : 0
      );
      
      // Update quest progress if user won
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
    }
    
    // Send the result
    await interaction.update({ embeds: [resultEmbed], components: [row] });
    
  } catch (error) {
    console.error('Error in rock paper scissors game:', error);
    
    try {
      await interaction.reply({
        content: '❌ متأسفانه در پردازش بازی خطایی رخ داد!',
        ephemeral: true
      });
    } catch (e) {
      console.error('Error handling rock paper scissors failure:', e);
    }
  }
}
