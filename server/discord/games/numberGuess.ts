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
import { gamesMenu } from '../components/gamesMenu';

// Game constants
const BET_AMOUNT = 30;
const REWARD_AMOUNT = 100;
const MAX_NUMBER = 10;
const MAX_ATTEMPTS = 3;

// Store active games
const activeGames: Record<string, {
  number: number;
  attempts: number;
  guesses: number[];
}> = {};

// Handler for modal submissions in number guess game
export async function handleNumberGuessModalSubmit(
  interaction: ModalSubmitInteraction
) {
  try {
    // Get user data
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما ابتدا باید یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    // User made a guess via modal
    if (interaction.customId === 'guess_number_modal') {
      const gameState = activeGames[interaction.user.id];
      
      if (!gameState) {
        await interaction.reply({
          content: 'بازی فعالی پیدا نشد. لطفاً دوباره شروع کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Check if first attempt to deduct coins
      if (gameState.attempts === 0) {
        // Check if user has enough Ccoin
        if (user.wallet < BET_AMOUNT) {
          await interaction.reply({
            content: `💰 سکه‌های شما برای بازی کافی نیست. شما به ${BET_AMOUNT} سکه نیاز دارید اما ${user.wallet} سکه در کیف پول خود دارید.`,
            ephemeral: true
          });
          
          // Reset game
          delete activeGames[interaction.user.id];
          return;
        }
        
        // Deduct bet amount from user's wallet
        await storage.addToWallet(user.id, -BET_AMOUNT);
      }
      
      // Get the guess from modal submission
      const guessValue = interaction.fields.getTextInputValue('guess_input');
      const userGuess = parseInt(guessValue);
      
      if (isNaN(userGuess) || userGuess < 1 || userGuess > MAX_NUMBER) {
        await interaction.reply({
          content: `لطفاً یک عدد معتبر بین 1 تا ${MAX_NUMBER} وارد کنید.`,
          ephemeral: true
        });
        return;
      }
      
      // Update game state
      gameState.attempts++;
      gameState.guesses.push(userGuess);
      
      // Create result embed
      const resultEmbed = new EmbedBuilder()
        .setTitle('🔢 بازی حدس عدد')
        .setTimestamp();
      
      // Check if the guess is correct
      const correctNumber = gameState.number;
      const isCorrect = userGuess === correctNumber;
      const remainingAttempts = MAX_ATTEMPTS - gameState.attempts;
      const isGameOver = isCorrect || remainingAttempts <= 0;
      
      // Generate hint
      let hint = '';
      if (!isCorrect && !isGameOver) {
        hint = userGuess > correctNumber 
          ? `عدد مورد نظر **کوچکتر** از ${userGuess} است.` 
          : `عدد مورد نظر **بزرگتر** از ${userGuess} است.`;
      }
      
      // Create colorful buttons for next actions
      const row = new ActionRowBuilder<ButtonBuilder>();
      
      if (isGameOver) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('game:numberguess:start')
            .setLabel('🔄 بازی مجدد')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 بازگشت به منوی بازی‌ها')
            .setStyle(ButtonStyle.Danger)
        );
      } else {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('game:numberguess:guess_button')
            .setLabel('🎯 حدس بعدی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      }
      
      // Handle correct guess
      if (isCorrect) {
        // User won
        await storage.addToWallet(user.id, REWARD_AMOUNT);
        
        resultEmbed
          .setColor('#2ECC71')
          .setDescription(`🎉 تبریک! عدد ${correctNumber} درست است! 🎉`)
          .addFields(
            { name: '🎲 حدس‌های شما', value: gameState.guesses.join(', '), inline: true },
            { name: '🔄 تعداد تلاش', value: gameState.attempts.toString(), inline: true },
            { name: '💰 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
            { name: '👛 موجودی جدید', value: `${user.wallet - BET_AMOUNT + REWARD_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'برای بازی مجدد روی دکمه کلیک کنید' });
        
        // Record the game
        await storage.recordGame(
          user.id,
          'numberguess',
          BET_AMOUNT,
          true,
          REWARD_AMOUNT
        );
        
        // Update quest progress
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
        
        // Reset game
        delete activeGames[interaction.user.id];
      } 
      // Handle game over
      else if (remainingAttempts <= 0) {
        resultEmbed
          .setColor('#E74C3C')
          .setDescription(`😔 فرصت‌های شما تمام شد! عدد صحیح ${correctNumber} بود.`)
          .addFields(
            { name: '🎲 حدس‌های شما', value: gameState.guesses.join(', '), inline: true },
            { name: '💰 از دست دادی', value: `${BET_AMOUNT} Ccoin`, inline: true },
            { name: '👛 موجودی جدید', value: `${user.wallet - BET_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'می‌خواهی دوباره شانست رو امتحان کنی؟' });
        
        // Record the game
        await storage.recordGame(
          user.id,
          'numberguess',
          BET_AMOUNT,
          false,
          0
        );
        
        // Reset game
        delete activeGames[interaction.user.id];
      } 
      // Game continues
      else {
        resultEmbed
          .setColor('#9B59B6')
          .setDescription(`حدس شما: ${userGuess}\n${hint}\n\nشما ${remainingAttempts} فرصت دیگر دارید.`)
          .addFields(
            { name: '🎲 حدس‌های شما', value: gameState.guesses.join(', '), inline: true },
            { name: '💰 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
            { name: '🏆 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'حدس بعدی را بزنید یا انصراف دهید' });
      }
      
      // Send the result
      await interaction.reply({ embeds: [resultEmbed], components: [row] });
    }
  } catch (error) {
    console.error('Error in number guess modal submit:', error);
    
    try {
      await interaction.reply({
        content: '❌ متأسفانه در پردازش بازی خطایی رخ داد!',
        ephemeral: true
      });
    } catch (e) {
      console.error('Error handling number guess modal failure:', e);
    }
  }
}

// Function to handle the number guess game for button interactions
export async function handleNumberGuess(
  interaction: MessageComponentInteraction,
  action: 'start' | 'guess',
  guess?: number
) {
  try {
    // Get user data
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما ابتدا باید یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    // Start the game
    if (action === 'start') {
      // Check if user has enough Ccoin
      if (user.wallet < BET_AMOUNT) {
        await interaction.reply({
          content: `💰 سکه‌های شما برای بازی کافی نیست. شما به ${BET_AMOUNT} سکه نیاز دارید اما ${user.wallet} سکه در کیف پول خود دارید.`,
          ephemeral: true
        });
        return;
      }
      
      // Generate a random number
      const randomNumber = Math.floor(Math.random() * MAX_NUMBER) + 1;
      
      // Store the game state
      activeGames[interaction.user.id] = {
        number: randomNumber,
        attempts: 0,
        guesses: []
      };
      
      // Create the game embed
      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('🔢 بازی حدس عدد')
        .setDescription(`یک عدد بین 1 تا ${MAX_NUMBER} در نظر گرفته شده است. آن را حدس بزن!\nشما ${MAX_ATTEMPTS} فرصت برای حدس زدن دارید.`)
        .addFields(
          { name: '💰 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
          { name: '🏆 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
          { name: '👛 موجودی', value: `${user.wallet} Ccoin`, inline: true },
          { name: '🎲 حدس‌های شما', value: 'هنوز حدسی نزده‌اید', inline: false }
        )
        .setFooter({ text: `عددی بین 1 تا ${MAX_NUMBER} را حدس بزنید` })
        .setTimestamp();
      
      // Create colorful guess button
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('game:numberguess:guess_button')
            .setLabel('🎯 حدس زدن')
            .setStyle(ButtonStyle.Success)
        );
      
      // Back button
      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      
      // Send the game message
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], components: [row, backRow], ephemeral: false });
      } else {
        await interaction.update({ embeds: [embed], components: [row, backRow] });
      }
      
      return;
    }
    
    // Button to open guess modal
    if (interaction.isButton() && interaction.customId === 'game:numberguess:guess_button') {
      const modal = new ModalBuilder()
        .setCustomId('guess_number_modal')
        .setTitle('حدس عدد');
      
      const guessInput = new TextInputBuilder()
        .setCustomId('guess_input')
        .setLabel(`عددی بین 1 تا ${MAX_NUMBER} را وارد کنید`)
        .setPlaceholder('عدد')
        .setRequired(true)
        .setStyle(TextInputStyle.Short);
      
      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(guessInput);
      modal.addComponents(firstActionRow);
      
      await interaction.showModal(modal);
      return;
    }
    
    // Handle direct guess (from button with predefined guess)
    if (action === 'guess' && guess !== undefined) {
      const gameState = activeGames[interaction.user.id];
      
      if (!gameState) {
        await interaction.reply({
          content: 'بازی فعالی پیدا نشد. لطفاً دوباره شروع کنید.',
          ephemeral: true
        });
        return;
      }
      
      // Check if first attempt to deduct coins
      if (gameState.attempts === 0) {
        // Check if user has enough Ccoin
        if (user.wallet < BET_AMOUNT) {
          await interaction.reply({
            content: `💰 سکه‌های شما برای بازی کافی نیست. شما به ${BET_AMOUNT} سکه نیاز دارید اما ${user.wallet} سکه در کیف پول خود دارید.`,
            ephemeral: true
          });
          
          // Reset game
          delete activeGames[interaction.user.id];
          return;
        }
        
        // Deduct bet amount from user's wallet
        await storage.addToWallet(user.id, -BET_AMOUNT);
      }
      
      // Update game state
      gameState.attempts++;
      gameState.guesses.push(guess);
      
      // Create result embed
      const resultEmbed = new EmbedBuilder()
        .setTitle('🔢 بازی حدس عدد')
        .setTimestamp();
      
      // Check if the guess is correct
      const correctNumber = gameState.number;
      const isCorrect = guess === correctNumber;
      const remainingAttempts = MAX_ATTEMPTS - gameState.attempts;
      const isGameOver = isCorrect || remainingAttempts <= 0;
      
      // Generate hint
      let hint = '';
      if (!isCorrect && !isGameOver) {
        hint = guess > correctNumber 
          ? `عدد مورد نظر **کوچکتر** از ${guess} است.` 
          : `عدد مورد نظر **بزرگتر** از ${guess} است.`;
      }
      
      // Create colorful buttons for next actions
      const row = new ActionRowBuilder<ButtonBuilder>();
      
      if (isGameOver) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('game:numberguess:start')
            .setLabel('🔄 بازی مجدد')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 بازگشت به منوی بازی‌ها')
            .setStyle(ButtonStyle.Danger)
        );
      } else {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('game:numberguess:guess_button')
            .setLabel('🎯 حدس بعدی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('games')
            .setLabel('🔙 انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      }
      
      // Handle correct guess
      if (isCorrect) {
        // User won
        await storage.addToWallet(user.id, REWARD_AMOUNT);
        
        resultEmbed
          .setColor('#2ECC71')
          .setDescription(`🎉 تبریک! عدد ${correctNumber} درست است! 🎉`)
          .addFields(
            { name: '🎲 حدس‌های شما', value: gameState.guesses.join(', '), inline: true },
            { name: '🔄 تعداد تلاش', value: gameState.attempts.toString(), inline: true },
            { name: '💰 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true },
            { name: '👛 موجودی جدید', value: `${user.wallet - BET_AMOUNT + REWARD_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'برای بازی مجدد روی دکمه کلیک کنید' });
        
        // Record the game
        await storage.recordGame(
          user.id,
          'numberguess',
          BET_AMOUNT,
          true,
          REWARD_AMOUNT
        );
        
        // Update quest progress
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
        
        // Reset game
        delete activeGames[interaction.user.id];
      } 
      // Handle game over
      else if (remainingAttempts <= 0) {
        resultEmbed
          .setColor('#E74C3C')
          .setDescription(`😔 فرصت‌های شما تمام شد! عدد صحیح ${correctNumber} بود.`)
          .addFields(
            { name: '🎲 حدس‌های شما', value: gameState.guesses.join(', '), inline: true },
            { name: '💰 از دست دادی', value: `${BET_AMOUNT} Ccoin`, inline: true },
            { name: '👛 موجودی جدید', value: `${user.wallet - BET_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'می‌خواهی دوباره شانست رو امتحان کنی؟' });
        
        // Record the game
        await storage.recordGame(
          user.id,
          'numberguess',
          BET_AMOUNT,
          false,
          0
        );
        
        // Reset game
        delete activeGames[interaction.user.id];
      } 
      // Game continues
      else {
        resultEmbed
          .setColor('#9B59B6')
          .setDescription(`حدس شما: ${guess}\n${hint}\n\nشما ${remainingAttempts} فرصت دیگر دارید.`)
          .addFields(
            { name: '🎲 حدس‌های شما', value: gameState.guesses.join(', '), inline: true },
            { name: '💰 هزینه بازی', value: `${BET_AMOUNT} Ccoin`, inline: true },
            { name: '🏆 جایزه', value: `${REWARD_AMOUNT} Ccoin`, inline: true }
          )
          .setFooter({ text: 'حدس بعدی را بزنید یا انصراف دهید' });
      }
      
      // Send the result
      await interaction.update({ embeds: [resultEmbed], components: [row] });
    }
    
  } catch (error) {
    console.error('Error in number guess game:', error);
    
    try {
      await interaction.reply({
        content: '❌ متأسفانه در پردازش بازی خطایی رخ داد!',
        ephemeral: true
      });
    } catch (e) {
      console.error('Error handling number guess failure:', e);
    }
  }
}
