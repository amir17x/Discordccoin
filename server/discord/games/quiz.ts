import { 
  ButtonInteraction, 
  MessageComponentInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} from 'discord.js';
import { storage } from '../../storage';

// Game constants
const BET_AMOUNT = 25;
const REWARD_AMOUNT = 100;

interface QuizGame {
  currentQuestion: number;
  correctAnswers: number;
  questions: QuizQuestion[];
  answered: boolean[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  category: string;
}

// Store active games
const activeGames: Record<string, QuizGame> = {};

// Sample quiz questions
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "پایتخت فرانسه کدام شهر است؟",
    options: ["لندن", "پاریس", "برلین", "رم"],
    correct: 1,
    category: "جغرافیا"
  },
  {
    question: "کدام سیاره به سیاره سرخ معروف است؟",
    options: ["زمین", "مریخ", "زهره", "مشتری"],
    correct: 1,
    category: "نجوم"
  },
  {
    question: "بزرگترین اقیانوس جهان کدام است؟",
    options: ["اطلس", "هند", "آرام", "شمالگان"],
    correct: 2,
    category: "جغرافیا"
  },
  {
    question: "کدام عنصر با نماد H نشان داده می‌شود؟",
    options: ["هلیوم", "هیدروژن", "فلوئور", "کربن"],
    correct: 1,
    category: "شیمی"
  },
  {
    question: "قاره آفریقا چند کشور دارد؟",
    options: ["52", "54", "56", "58"],
    correct: 1,
    category: "جغرافیا"
  },
  {
    question: "سریع‌ترین حیوان خشکی جهان کدام است؟",
    options: ["شیر", "یوزپلنگ", "کرگدن", "فیل"],
    correct: 1,
    category: "طبیعت"
  },
  {
    question: "متال نماد طلا در جدول تناوبی چیست؟",
    options: ["Go", "Au", "Ag", "Pt"],
    correct: 1,
    category: "شیمی"
  },
  {
    question: "کدام یک از اقیانوس‌ها کوچکترین است؟",
    options: ["اطلس", "هند", "شمالگان", "آرام"],
    correct: 2,
    category: "جغرافیا"
  },
  {
    question: "رودخانه نیل در کدام قاره واقع شده است؟",
    options: ["آسیا", "آفریقا", "اروپا", "آمریکا"],
    correct: 1,
    category: "جغرافیا"
  },
  {
    question: "کدام سیاره بیشترین ماه را دارد؟",
    options: ["زمین", "مریخ", "مشتری", "زحل"],
    correct: 2,
    category: "نجوم"
  }
];

// Select random questions for game
function selectRandomQuestions(count: number = 5): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to handle quiz game
export async function handleQuiz(
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
          .setTitle('❓ اطلاعات عمومی - خطا')
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
      const questions = selectRandomQuestions(5);
      activeGames[interaction.user.id] = {
        currentQuestion: 0,
        correctAnswers: 0,
        questions,
        answered: new Array(questions.length).fill(false)
      };
      
      // Deduct bet amount
      await storage.addToWallet(user.id, -BET_AMOUNT);
      
      // Show first question
      await showQuestion(interaction, activeGames[interaction.user.id]);
      
    } else if (action.startsWith('answer:')) {
      const answerIndex = parseInt(action.split(':')[1]);
      const game = activeGames[interaction.user.id];
      
      if (!game) {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد! لطفاً دوباره شروع کنید.'
        });
        return;
      }
      
      const currentQ = game.questions[game.currentQuestion];
      const isCorrect = answerIndex === currentQ.correct;
      
      if (isCorrect) {
        game.correctAnswers++;
      }
      
      game.answered[game.currentQuestion] = true;
      
      // Show answer result
      const resultEmbed = new EmbedBuilder()
        .setColor(isCorrect ? '#2ECC71' : '#E74C3C')
        .setTitle(`❓ اطلاعات عمومی - ${isCorrect ? 'درست!' : 'غلط!'}`)
        .setDescription(isCorrect ? '🎉 پاسخ شما درست بود!' : '😔 پاسخ شما غلط بود!')
        .addFields(
          { name: '❓ سوال', value: currentQ.question, inline: false },
          { name: '✅ پاسخ درست', value: currentQ.options[currentQ.correct], inline: true },
          { name: '👤 پاسخ شما', value: currentQ.options[answerIndex], inline: true },
          { name: '📊 امتیاز', value: `${game.correctAnswers}/${game.currentQuestion + 1}`, inline: true }
        )
        .setFooter({ text: isCorrect ? 'آفرین! ادامه دهید!' : 'نگران نباشید، سوال بعدی!' });
      
      // Check if game is finished
      if (game.currentQuestion >= game.questions.length - 1) {
        // Game finished
        const finalScore = game.correctAnswers;
        const percentage = Math.round((finalScore / game.questions.length) * 100);
        let won = false;
        let rewardAmount = 0;
        
        // Win conditions based on score
        if (finalScore >= 4) {
          won = true;
          rewardAmount = REWARD_AMOUNT + (finalScore * 20); // Bonus for perfect scores
          await storage.addToWallet(user.id, rewardAmount);
        } else if (finalScore >= 3) {
          // Decent performance - return bet
          rewardAmount = BET_AMOUNT;
          await storage.addToWallet(user.id, BET_AMOUNT);
        }
        
        resultEmbed
          .setTitle(`❓ اطلاعات عمومی - ${won ? 'برنده!' : finalScore >= 3 ? 'خوب!' : 'باخت'}`)
          .setDescription(won ? '🎉 عالی! شما یک دانشمند واقعی هستید!' : finalScore >= 3 ? '👍 عملکرد خوبی داشتید!' : '😔 باید بیشتر مطالعه کنید!')
          .spliceFields(0, 4,
            { name: '📊 نتیجه نهایی', value: `**${finalScore}/${game.questions.length}** پاسخ درست (${percentage}%)`, inline: false },
            { name: '🏆 رتبه', value: finalScore === 5 ? 'ممتاز' : finalScore === 4 ? 'خیلی خوب' : finalScore === 3 ? 'خوب' : finalScore === 2 ? 'متوسط' : 'ضعیف', inline: true },
            { name: '💰 نتیجه مالی', value: won ? `+${rewardAmount - BET_AMOUNT} Ccoin` : finalScore >= 3 ? `±0 Ccoin` : `-${BET_AMOUNT} Ccoin`, inline: true }
          );
        
        // Record game
        await storage.recordGame(
          user.id,
          'quiz',
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
              .setCustomId('game:quiz:start')
              .setLabel('🔄 بازی مجدد')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 بازگشت به بازی‌ها')
              .setStyle(ButtonStyle.Secondary)
          );
        
        // Clean up game
        delete activeGames[interaction.user.id];
        
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [resultEmbed], components: [row] });
        } else {
          await interaction.reply({ embeds: [resultEmbed], components: [row], ephemeral: true });
        }
        
      } else {
        // Continue to next question
        game.currentQuestion++;
        
        const continueRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('game:quiz:next')
              .setLabel('➡️ سوال بعدی')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('games')
              .setLabel('🔙 انصراف')
              .setStyle(ButtonStyle.Secondary)
          );
        
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [resultEmbed], components: [continueRow] });
        } else {
          await interaction.reply({ embeds: [resultEmbed], components: [continueRow], ephemeral: true });
        }
      }
      
    } else if (action === 'next') {
      const game = activeGames[interaction.user.id];
      
      if (!game) {
        await interaction.editReply({
          content: '❌ بازی‌ای یافت نشد! لطفاً دوباره شروع کنید.'
        });
        return;
      }
      
      await showQuestion(interaction, game);
    }
    
  } catch (error) {
    console.error('Error in quiz game:', error);
    
    try {
      const errorMessage = '❌ خطایی در بازی اطلاعات عمومی رخ داد! لطفاً دوباره تلاش کنید.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling quiz failure:', e);
    }
  }
}

// Helper function to show a question
async function showQuestion(interaction: MessageComponentInteraction, game: QuizGame) {
  const currentQ = game.questions[game.currentQuestion];
  
  const embed = new EmbedBuilder()
    .setColor('#3498DB')
    .setTitle('❓ اطلاعات عمومی')
    .setDescription(`**دسته:** ${currentQ.category}`)
    .addFields(
      { name: '❓ سوال', value: currentQ.question, inline: false },
      { name: '📊 پیشرفت', value: `سوال ${game.currentQuestion + 1}/${game.questions.length}`, inline: true },
      { name: '✅ پاسخ‌های درست', value: `${game.correctAnswers}`, inline: true }
    )
    .setFooter({ text: 'روی یکی از گزینه‌ها کلیک کنید!' });
  
  const optionRows: ActionRowBuilder<ButtonBuilder>[] = [];
  const buttons: ButtonBuilder[] = [];
  
  currentQ.options.forEach((option, index) => {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`game:quiz:answer:${index}`)
        .setLabel(`${String.fromCharCode(65 + index)}. ${option}`)
        .setStyle(ButtonStyle.Secondary)
    );
  });
  
  // Split into rows of max 2 buttons each
  for (let i = 0; i < buttons.length; i += 2) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents(...buttons.slice(i, i + 2));
    optionRows.push(row);
  }
  
  // Add back button
  const backRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('games')
        .setLabel('🔙 انصراف')
        .setStyle(ButtonStyle.Danger)
    );
  
  optionRows.push(backRow);
  
  if (interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: optionRows });
  } else {
    await interaction.reply({ embeds: [embed], components: optionRows, ephemeral: true });
  }
}