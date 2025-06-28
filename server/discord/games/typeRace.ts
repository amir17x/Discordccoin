import { 
  ButtonInteraction, 
  MessageComponentInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction
} from 'discord.js';
import { storage } from '../../storage';

// Game constants
const BET_AMOUNT = 40;
const REWARD_AMOUNT = 120;
const TIME_LIMIT = 30; // seconds

// Sample texts for typing race
const TEXTS = [
  'برنامه‌نویسی یکی از مهارت‌های مهم قرن بیست و یکم محسوب می‌شود',
  'هوش مصنوعی آینده‌ای روشن برای بشریت به ارمغان خواهد آورد',
  'یادگیری زبان‌های برنامه‌نویسی جدید همیشه مفید و سودمند است',
  'تکنولوژی باعث تسهیل زندگی روزمره انسان‌ها شده است',
  'ربات‌های هوشمند می‌توانند کارهای پیچیده‌ای را انجام دهند',
  'طراحی وب یکی از حوزه‌های پردرآمد برنامه‌نویسی محسوب می‌شود',
  'امنیت سایبری اهمیت بسیاری در دنیای مدرن پیدا کرده است',
  'توسعه موبایل بازار بزرگی از کاربران را پوشش می‌دهد'
];

interface TypeRaceGame {
  text: string;
  startTime: number;
  timeLimit: number;
  finished: boolean;
}

// Store active games
const activeGames: Record<string, TypeRaceGame> = {};

// Calculate typing speed and accuracy
function calculateResults(originalText: string, typedText: string, timeSpent: number): {
  wpm: number;
  accuracy: number;
  errors: number;
} {
  const wordsTyped = typedText.trim().split(' ').length;
  const wpm = Math.round((wordsTyped / timeSpent) * 60);
  
  let errors = 0;
  const minLength = Math.min(originalText.length, typedText.length);
  
  for (let i = 0; i < minLength; i++) {
    if (originalText[i] !== typedText[i]) {
      errors++;
    }
  }
  
  // Add length difference as errors
  errors += Math.abs(originalText.length - typedText.length);
  
  const accuracy = Math.max(0, Math.round(((originalText.length - errors) / originalText.length) * 100));
  
  return { wpm, accuracy, errors };
}

// Function to handle type race game
export async function handleTypeRace(
  interaction: MessageComponentInteraction,
  action: string
) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
    
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      const errorMessage = '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
      return;
    }
    
    if (action === 'start') {
      // Check if user has enough money
      if (user.wallet < BET_AMOUNT) {
        const embed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('⌨️ مسابقه سرعت تایپ - خطا')
          .setDescription('💰 موجودی شما کافی نیست!')
          .addFields(
            { name: '💵 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
            { name: '👛 موجودی شما', value: `${user.wallet} Ccoin`, inline: true }
          )
          .setFooter({ text: 'برای کسب درآمد، از سایر بازی‌ها یا کارها استفاده کنید!' });
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 بازگشت به بازی‌ها')
              .setStyle(ButtonStyle.Secondary)
          );
        
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
        return;
      }
      
      // Start new game
      const text = TEXTS[Math.floor(Math.random() * TEXTS.length)];
      
      activeGames[interaction.user.id] = {
        text,
        startTime: Date.now(),
        timeLimit: TIME_LIMIT,
        finished: false
      };
      
      // Deduct bet amount
      await storage.addToWallet(user.id, -BET_AMOUNT);
      
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('⌨️ مسابقه سرعت تایپ')
        .setDescription('🎯 متن زیر را تا جایی که می‌توانید سریع و دقیق تایپ کنید!')
        .addFields(
          { name: '📝 متن برای تایپ', value: `\`\`\`${text}\`\`\``, inline: false },
          { name: '⏱️ زمان', value: `${TIME_LIMIT} ثانیه`, inline: true },
          { name: '💰 شرط', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `تا ${REWARD_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'روی دکمه شروع کلیک کنید و شروع به تایپ کنید!' });
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:type_race:type')
            .setLabel('🚀 شروع تایپ')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Secondary)
        );
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }
      
    } else if (action === 'type') {
      const game = activeGames[interaction.user.id];
      
      if (!game) {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد! لطفاً دوباره شروع کنید.'
        });
        return;
      }
      
      // Show typing modal
      const modal = new ModalBuilder()
        .setCustomId('type_race_modal')
        .setTitle('⌨️ مسابقه سرعت تایپ');
      
      const textInput = new TextInputBuilder()
        .setCustomId('typed_text')
        .setLabel('متن را اینجا تایپ کنید:')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('متن را دقیقاً همانطور که بالا نوشته شده تایپ کنید...')
        .setRequired(true)
        .setMaxLength(500);
      
      const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
      modal.addComponents(actionRow);
      
      // Reset start time when modal opens
      game.startTime = Date.now();
      
      await interaction.showModal(modal);
    }
    
  } catch (error) {
    console.error('Error in type race game:', error);
    
    try {
      const errorMessage = '❌ خطایی در بازی مسابقه تایپ رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling type race failure:', e);
    }
  }
}

// Handle modal submission for type race
export async function handleTypeRaceModal(
  interaction: ModalSubmitInteraction
) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما ابتدا باید یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    const game = activeGames[interaction.user.id];
    
    if (!game) {
      await interaction.reply({
        content: '❌ بازی‌ای یافت نشد! لطفاً دوباره شروع کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (game.finished) {
      await interaction.reply({
        content: '❌ این بازی قبلاً تمام شده است!',
        ephemeral: true
      });
      return;
    }
    
    const typedText = interaction.fields.getTextInputValue('typed_text');
    const endTime = Date.now();
    const timeSpent = (endTime - game.startTime) / 1000; // Convert to seconds
    
    // Mark game as finished
    game.finished = true;
    
    // Check if time limit exceeded
    if (timeSpent > TIME_LIMIT) {
      const embed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('⌨️ مسابقه سرعت تایپ - زمان تمام شد')
        .setDescription('⏰ متأسفانه زمان شما تمام شد!')
        .addFields(
          { name: '⏱️ زمان صرف شده', value: `${timeSpent.toFixed(1)} ثانیه`, inline: true },
          { name: '⏰ حد زمان', value: `${TIME_LIMIT} ثانیه`, inline: true },
          { name: '💸 ضرر', value: `${BET_AMOUNT} Ccoin`, inline: true }
        )
        .setFooter({ text: 'سعی کنید سریع‌تر تایپ کنید!' });
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:type_race:start')
            .setLabel('🔄 بازی مجدد')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 بازگشت به بازی‌ها')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // Record the game as loss
      await storage.recordGame(
        user.id,
        'type_race',
        BET_AMOUNT,
        false,
        0
      );
      
      // Clean up game
      delete activeGames[interaction.user.id];
      
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      return;
    }
    
    // Calculate results
    const results = calculateResults(game.text, typedText, timeSpent);
    
    // Determine if user won based on accuracy and speed
    const won = results.accuracy >= 80 && results.wpm >= 20; // At least 80% accuracy and 20 WPM
    let rewardAmount = 0;
    
    if (won) {
      // Calculate reward based on performance
      const speedBonus = Math.max(0, results.wpm - 20) * 2; // 2 coins per WPM above 20
      const accuracyBonus = Math.max(0, results.accuracy - 80) * 1; // 1 coin per % above 80%
      rewardAmount = REWARD_AMOUNT + speedBonus + accuracyBonus;
      
      await storage.addToWallet(user.id, rewardAmount);
    }
    
    const resultEmbed = new EmbedBuilder()
      .setColor(won ? '#2ECC71' : '#E74C3C')
      .setTitle(`⌨️ مسابقه سرعت تایپ - ${won ? 'برنده!' : 'باخت'}`)
      .setDescription(won ? '🎉 عالی! شما با موفقیت چالش را پشت سر گذاشتید!' : '😔 متأسفانه عملکرد شما کافی نبود!')
      .addFields(
        { name: '⚡ سرعت', value: `${results.wpm} کلمه در دقیقه`, inline: true },
        { name: '🎯 دقت', value: `${results.accuracy}%`, inline: true },
        { name: '❌ خطاها', value: `${results.errors} خطا`, inline: true },
        { name: '⏱️ زمان', value: `${timeSpent.toFixed(1)} ثانیه`, inline: true },
        { name: '💰 نتیجه مالی', value: won ? `+${rewardAmount - BET_AMOUNT} Ccoin` : `-${BET_AMOUNT} Ccoin`, inline: true }
      )
      .setFooter({ text: won ? 'آیا می‌خواهید دوباره بازی کنید؟' : 'برای بهتر شدن، بیشتر تمرین کنید!' });
    
    // Record game
    await storage.recordGame(
      user.id,
      'type_race',
      BET_AMOUNT,
      won,
      won ? rewardAmount - BET_AMOUNT : 0
    );
    
    // Update quest progress if won
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
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('game:type_race:start')
          .setLabel('🔄 بازی مجدد')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('games')
          .setLabel('🔙 بازگشت به بازی‌ها')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Clean up game
    delete activeGames[interaction.user.id];
    
    await interaction.reply({ embeds: [resultEmbed], components: [row], ephemeral: true });
    
  } catch (error) {
    console.error('Error in type race modal:', error);
    await interaction.reply({
      content: '❌ خطایی در پردازش نتایج تایپ رخ داد! لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}