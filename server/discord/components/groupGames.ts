import { 
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ComponentType,
  Message,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  Client,
  TextChannel
} from 'discord.js';
import { storage } from '../../storage';
import { log } from '../../vite';
import { IUser as User } from '../../models/User';
import { v4 as uuidv4 } from 'uuid';
import { GameSessionModel } from '../../models/GameSession';

// تعریف client برای دسترسی به Discord API
// این متغیر باید از فایل اصلی bot.ts به این ماژول پاس داده شود
let client: Client;

/**
 * تنظیم نمونه کلاینت دیسکورد برای استفاده در ماژول بازی‌های گروهی
 * @param discordClient نمونه کلاینت دیسکورد
 */
export function setClient(discordClient: Client) {
  client = discordClient;
}
// Create utils functions locally since we can't find the utils module
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * بررسی وجود بازی فعال در کانال
 */
const getActiveGameInChannel = (channelId: string, gameType?: string): GameSession | undefined => {
  return Array.from(activeGames.values()).find(
    game => game.channelId === channelId && 
    game.status !== 'ended' && 
    (gameType ? game.gameType === gameType : true)
  );
};

/**
 * بهم‌ ریختن تصادفی آرایه
 * @param array آرایه ورودی
 * @returns آرایه بهم‌ریخته شده
 */
const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * مدل سوال برای بازی اطلاعات عمومی
 */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  addedBy?: string; // شناسه کاربر اضافه‌کننده
  approved: boolean; // وضعیت تأیید سوال
  approvedBy?: string; // شناسه کاربر تأیید‌کننده
  createdAt: Date;
}

/**
 * مدل اطلاعات بازی گروهی
 */
interface GameSession {
  id: string;
  gameType: 'quiz' | 'drawguess' | 'truthordare' | 'bingo' | 'wordchain' | 'mafia' | 'werewolf' | 'spy';
  channelId: string;
  createdBy: string;
  players: string[];
  status: 'waiting' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  data: any; // اطلاعات خاص هر بازی
}

// لیست موقت بازی‌های فعال (بعداً به دیتابیس منتقل می‌شود)
const activeGames: Map<string, GameSession> = new Map();

/**
 * ایجاد منوی اصلی بازی‌های گروهی
 */
export async function handleGroupGamesMenu(interaction: ChatInputCommandInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎮 بازی‌های گروهی')
      .setDescription('🎲 سرگرمی دسته‌جمعی با دوستان و اعضای سرور!\n\n🎯 این بازی‌ها برای 3 تا 10 نفر طراحی شده‌اند. هیچ هزینه‌ای برای شرکت در این بازی‌ها نیاز نیست و هدف اصلی سرگرمی است.')
      .setColor(0x2B2D31)
      .addFields(
        { name: '👥 بازیکنان حاضر', value: 'در حال بارگذاری...', inline: true },
        { name: '💰 موجودی', value: '600 Ccoin', inline: true }
      )
      .setImage('https://media.discordapp.net/attachments/1005948809465335931/1111362362733785190/group_games_banner.png?width=915&height=147')
      .setFooter({ text: 'برای انتخاب بازی از دکمه‌های زیر استفاده کنید' });

    const buttonsRow1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('group_quiz')
          .setLabel('مسابقه اطلاعات عمومی')
          .setEmoji('📚')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_drawguess')
          .setLabel('نقاشی حدس بزن')
          .setEmoji('🎨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_truthordare')
          .setLabel('جرأت یا حقیقت')
          .setEmoji('😈')
          .setStyle(ButtonStyle.Primary)
      );

    const buttonsRow2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('group_bingo')
          .setLabel('بینگو')
          .setEmoji('🎰')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_wordchain')
          .setLabel('زنجیره کلمات')
          .setEmoji('🔗')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_back')
          .setLabel('برگشت')
          .setEmoji('⬅️')
          .setStyle(ButtonStyle.Secondary)
      );

    const buttonsRow3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('group_mafia')
          .setLabel('مافیا')
          .setEmoji('🕵️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_werewolf')
          .setLabel('گرگینه')
          .setEmoji('🐺')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('group_spy')
          .setLabel('جاسوس مخفی')
          .setEmoji('🕵️‍♂️')
          .setStyle(ButtonStyle.Primary)
      );
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [buttonsRow1, buttonsRow2, buttonsRow3],
      ephemeral: false
    });
  } catch (error) {
    log(`Error handling group games menu: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در نمایش منوی بازی‌های گروهی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت کلیک روی دکمه‌های منوی بازی‌های گروهی
 */
export async function handleGroupGamesButton(interaction: ButtonInteraction) {
  try {
    const buttonId = interaction.customId;
    
    // پشتیبانی از فرمت جدید game:type:action
    if (buttonId.startsWith('game:')) {
      const [_, gameType, action] = buttonId.split(':');
      
      // مسیریابی براساس نوع بازی
      switch (gameType) {
        case 'mafia':
          await handleMafiaGame(interaction);
          break;
        case 'werewolf':
          await handleWerewolfGame(interaction);
          break;
        case 'quiz':
          await handleQuizGame(interaction);
          break;
        case 'pictionary':
        case 'drawguess':
          await handleDrawGuessGame(interaction);
          break;
        case 'truth_or_dare':
          await handleTruthOrDareGame(interaction);
          break;
        case 'bingo':
          await handleBingoGame(interaction);
          break;
        case 'word_chain':
          await handleWordChainGame(interaction);
          break;
        case 'spy':
        case 'spyfall':
          await handleSpyGame(interaction);
          break;
        default:
          await interaction.reply({
            content: '❌ این نوع بازی هنوز پیاده‌سازی نشده است. لطفاً بعداً دوباره امتحان کنید.',
            ephemeral: true
          });
      }
      return;
    }
    
    // بررسی نوع بازی انتخاب شده (فرمت قدیمی)
    switch (buttonId) {
      case 'group_quiz':
        await handleQuizGame(interaction);
        break;
      case 'group_drawguess':
        await handleDrawGuessGame(interaction);
        break;
      case 'group_truthordare':
        await handleTruthOrDareGame(interaction);
        break;
      case 'group_bingo':
        await handleBingoGame(interaction);
        break;
      case 'group_wordchain':
        await handleWordChainGame(interaction);
        break;
      case 'group_mafia':
        await handleMafiaGame(interaction);
        break;
      case 'group_werewolf':
        await handleWerewolfGame(interaction);
        break;
      case 'group_spy':
        await handleSpyGame(interaction);
        break;
        
      // دکمه‌های بازی مافیا  
      case 'mafia_join':
        await joinMafiaGame(interaction);
        break;
      case 'mafia_start':
        await startMafiaGame(interaction);
        break;
      case 'mafia_rules':
        await showMafiaRules(interaction);
        break;
      case 'mafia_back_to_menu':
        await interaction.update({ components: [], embeds: [] });
        break;
      case 'group_back':
        await interaction.update({ 
          content: 'این قابلیت هنوز در حال توسعه است و به زودی فعال خواهد شد.',
          embeds: [], 
          components: [] 
        });
        break;
      case 'quiz_join':
        await joinQuizGame(interaction);
        break;
      case 'quiz_start':
        await startQuizGame(interaction);
        break;
      case 'quiz_submit_question':
        await showSubmitQuestionModal(interaction);
        break;
      case 'drawguess_join':
        await joinDrawGuessGame(interaction);
        break;
      case 'drawguess_start':
        await startDrawGuessGame(interaction);
        break;
      case 'drawguess_new':
        await handleDrawGuessGame(interaction);
        break;
      case 'mafia_join':
        await joinMafiaGame(interaction);
        break;
      case 'mafia_start':
        await startMafiaGame(interaction);
        break;
      case 'mafia_rules':
        await showMafiaRules(interaction);
        break;
      default:
        if (buttonId.startsWith('quiz_answer_')) {
          await handleQuizAnswer(interaction);
        } else if (buttonId.startsWith('drawguess_word_')) {
          await handleWordSelection(interaction);
        } else {
          await interaction.reply({ content: '❌ دکمه نامعتبر است!', ephemeral: true });
        }
    }
  } catch (error) {
    log(`Error handling group games button: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در پردازش درخواست رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * نمایش فرم ارسال سوال جدید
 */
async function showSubmitQuestionModal(interaction: ButtonInteraction) {
  try {
    const modal = new ModalBuilder()
      .setCustomId('quiz_question_modal')
      .setTitle('ارسال سؤال جدید');

    const questionInput = new TextInputBuilder()
      .setCustomId('question')
      .setLabel('سؤال')
      .setPlaceholder('سؤال مورد نظر خود را بنویسید...')
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const option1Input = new TextInputBuilder()
      .setCustomId('option1')
      .setLabel('گزینه ۱ (پاسخ صحیح)')
      .setPlaceholder('گزینه صحیح را وارد کنید...')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const option2Input = new TextInputBuilder()
      .setCustomId('option2')
      .setLabel('گزینه ۲')
      .setPlaceholder('گزینه دوم را وارد کنید...')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const option3Input = new TextInputBuilder()
      .setCustomId('option3')
      .setLabel('گزینه ۳')
      .setPlaceholder('گزینه سوم را وارد کنید...')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const categoryInput = new TextInputBuilder()
      .setCustomId('category')
      .setLabel('دسته‌بندی')
      .setPlaceholder('مثلا: تاریخ، علم، ورزش، هنر و سرگرمی، جغرافیا')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const questionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(questionInput);
    const option1Row = new ActionRowBuilder<TextInputBuilder>().addComponents(option1Input);
    const option2Row = new ActionRowBuilder<TextInputBuilder>().addComponents(option2Input);
    const option3Row = new ActionRowBuilder<TextInputBuilder>().addComponents(option3Input);
    const categoryRow = new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput);

    modal.addComponents(questionRow, option1Row, option2Row, option3Row, categoryRow);
    await interaction.showModal(modal);
  } catch (error) {
    log(`Error showing submit question modal: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در نمایش فرم ارسال سؤال رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت ارسال فرم سوال جدید
 */
export async function handleQuizQuestionModalSubmit(interaction: ModalSubmitInteraction) {
  try {
    // دریافت اطلاعات ورودی کاربر
    const question = interaction.fields.getTextInputValue('question');
    const option1 = interaction.fields.getTextInputValue('option1');
    const option2 = interaction.fields.getTextInputValue('option2');
    const option3 = interaction.fields.getTextInputValue('option3');
    const category = interaction.fields.getTextInputValue('category');

    // ساخت سوال جدید
    const newQuestion: QuizQuestion = {
      id: `user_${Date.now()}`,
      question,
      options: [option1, option2, option3],
      correctAnswer: 0, // گزینه اول همیشه درست است
      category,
      difficulty: 'medium',
      addedBy: interaction.user.id,
      approved: false,
      createdAt: new Date()
    };

    // ذخیره سوال در دیتابیس (در اینجا فرض می‌کنیم دارای یک تابع saveUserQuestion در storage هستیم)
    await storage.saveQuizQuestion(newQuestion);

    // اطلاع به کاربر
    await interaction.reply({
      content: '✅ سؤال شما با موفقیت ثبت شد و برای بررسی به داوران ارسال شد. در صورت تأیید، سکه‌های پاداش به حساب شما واریز خواهد شد.',
      ephemeral: true
    });

    // اطلاع به کاربران دارای نقش داور سوالات
    try {
      // در اینجا می‌توانیم با پیدا کردن کاربران دارای نقش داور، به آنها اطلاع دهیم
      const guild = interaction.guild;
      if (guild) {
        // فرض می‌کنیم شناسه نقش داور سوالات را می‌دانیم 
        // (این را باید از تنظیمات بات یا دیتابیس بخوانیم)
        const quizReviewerRoleId = '123456789012345678'; // به عنوان مثال
        
        // ممکن است نیاز به اطلاع به کانال خاصی برای داوران باشد
        // const quizReviewChannel = guild.channels.cache.get('channel_id_for_reviewers');
      }
    } catch (notificationError) {
      log(`Error notifying quiz reviewers: ${notificationError}`, 'warn');
      // این خطا نباید جلوی موفقیت فرآیند اصلی را بگیرد
    }
  } catch (error) {
    log(`Error handling quiz question modal submit: ${error}`, 'error');
    await interaction.reply({
      content: '❌ خطایی در ثبت سؤال رخ داد. لطفاً بعداً دوباره تلاش کنید.',
      ephemeral: true
    });
  }
}

/**
 * مدیریت بازی اطلاعات عمومی
 */
async function handleQuizGame(interaction: ButtonInteraction) {
  try {
    let quizGameSession: GameSession = {
      id: `quiz_${Date.now()}`,
      gameType: 'quiz',
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      players: [],
      status: 'waiting',
      data: {
        currentQuestionIndex: -1,
        questions: [],
        playerScores: {},
        maxQuestions: 10,
        timePerQuestion: 20 // ثانیه
      }
    };
    
    // ذخیره در لیست موقت بازی‌ها
    activeGames.set(quizGameSession.id, quizGameSession);
    
    // ایجاد Embed و دکمه‌ها
    const embed = new EmbedBuilder()
      .setTitle('📚 مسابقه اطلاعات عمومی')
      .setDescription('به مسابقه اطلاعات عمومی خوش آمدید! در این بازی، به نوبت سوالاتی پرسیده می‌شود و شما باید در زمان مشخص شده پاسخ صحیح را انتخاب کنید.')
      .setColor(0x4F77AA)
      .addFields(
        { name: '👥 تعداد بازیکنان', value: '0/10', inline: true },
        { name: '⏱️ زمان هر سوال', value: '20 ثانیه', inline: true },
        { name: '📝 تعداد سوالات', value: '10 سوال', inline: true },
        { name: '🏆 جایزه نفر اول', value: '500 کوین', inline: true }
      )
      .setFooter({ text: 'برای شرکت در بازی روی دکمه "ورود به بازی" کلیک کنید' });
    
    const joinButton = new ButtonBuilder()
      .setCustomId('quiz_join')
      .setLabel('ورود به بازی')
      .setEmoji('🎮')
      .setStyle(ButtonStyle.Success);
    
    const startButton = new ButtonBuilder()
      .setCustomId('quiz_start')
      .setLabel('شروع بازی')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary);
    
    const submitQuestionButton = new ButtonBuilder()
      .setCustomId('quiz_submit_question')
      .setLabel('ارسال سوال جدید')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(joinButton, startButton, submitQuestionButton);
    
    const response = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true
    });
    
    // ذخیره شناسه پیام در اطلاعات بازی
    quizGameSession.data.messageId = response.id;
    activeGames.set(quizGameSession.id, quizGameSession);
    
  } catch (error) {
    log(`Error handling quiz game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در شروع بازی اطلاعات عمومی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * پیوستن به بازی اطلاعات عمومی
 */
async function joinQuizGame(interaction: ButtonInteraction) {
  try {
    // پیدا کردن بازی فعال در کانال جاری
    const gameSession = Array.from(activeGames.values()).find(
      game => game.gameType === 'quiz' && 
      game.channelId === interaction.channelId && 
      game.status === 'waiting'
    );
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی فعالی یافت نشد!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر قبلاً به بازی پیوسته است یا خیر
    if (gameSession.players.includes(interaction.user.id)) {
      return await interaction.reply({ content: '❌ شما قبلاً به این بازی پیوسته‌اید!', ephemeral: true });
    }
    
    // بررسی محدودیت تعداد بازیکنان
    if (gameSession.players.length >= 10) {
      return await interaction.reply({ content: '❌ ظرفیت بازی تکمیل است!', ephemeral: true });
    }
    
    // افزودن کاربر به لیست بازیکنان
    gameSession.players.push(interaction.user.id);
    activeGames.set(gameSession.id, gameSession);
    
    // آماده‌سازی امتیاز کاربر
    gameSession.data.playerScores[interaction.user.id] = 0;
    
    // به‌روزرسانی Embed
    const message = await interaction.message.fetch();
    const embed = EmbedBuilder.from(message.embeds[0]);
    
    // به‌روزرسانی فیلد تعداد بازیکنان
    const playerField = embed.data.fields?.find(field => field.name === '👥 تعداد بازیکنان');
    if (playerField) {
      playerField.value = `${gameSession.players.length}/10`;
    }
    
    // افزودن لیست بازیکنان
    const playersList = gameSession.players.map(playerId => `<@${playerId}>`).join('\n');
    
    // بررسی اگر فیلد بازیکنان قبلاً وجود داشته باشد
    const existingPlayersListField = embed.data.fields?.find(field => field.name === '👤 بازیکنان');
    if (existingPlayersListField) {
      existingPlayersListField.value = playersList;
    } else {
      embed.addFields({ name: '👤 بازیکنان', value: playersList });
    }
    
    await interaction.update({ embeds: [embed] });
    
  } catch (error) {
    log(`Error joining quiz game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در پیوستن به بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * تهیه و بارگذاری سوالات برای بازی
 */
async function loadQuestionsForQuiz(gameSession: GameSession) {
  try {
    // فرض می‌کنیم تابعی برای دریافت سوالات از دیتابیس داریم
    let questions = await storage.getApprovedQuizQuestions();
    
    // اگر سوالات به اندازه کافی موجود نبود، از سوالات پیش‌فرض استفاده می‌کنیم
    if (!questions || questions.length < gameSession.data.maxQuestions) {
      questions = [
        {
          id: '1',
          question: 'پایتخت ایران کدام شهر است؟',
          options: ['تهران', 'اصفهان', 'شیراز', 'تبریز'],
          correctAnswer: 0,
          category: 'جغرافیا',
          difficulty: 'easy',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '2',
          question: 'بلندترین قله ایران کدام است؟',
          options: ['دماوند', 'سبلان', 'علم کوه', 'تفتان'],
          correctAnswer: 0,
          category: 'جغرافیا',
          difficulty: 'medium',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '3',
          question: 'دریاچه ارومیه در کدام استان قرار دارد؟',
          options: ['آذربایجان غربی', 'آذربایجان شرقی', 'اردبیل', 'زنجان'],
          correctAnswer: 0,
          category: 'جغرافیا',
          difficulty: 'easy',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '4',
          question: 'کدام رود طولانی‌ترین رود ایران است؟',
          options: ['کارون', 'زاینده‌رود', 'سفیدرود', 'هیرمند'],
          correctAnswer: 0,
          category: 'جغرافیا',
          difficulty: 'medium',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '5',
          question: 'جمعیت ایران حدوداً چند میلیون نفر است؟',
          options: ['85 میلیون', '70 میلیون', '100 میلیون', '60 میلیون'],
          correctAnswer: 0,
          category: 'جغرافیا',
          difficulty: 'medium',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '6',
          question: 'فردوسی شاعر کدام کتاب معروف است؟',
          options: ['شاهنامه', 'بوستان', 'دیوان حافظ', 'مثنوی'],
          correctAnswer: 0,
          category: 'ادبیات',
          difficulty: 'easy',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '7',
          question: 'صائب تبریزی از شاعران کدام سبک ادبی است؟',
          options: ['سبک هندی', 'سبک خراسانی', 'سبک عراقی', 'سبک نو'],
          correctAnswer: 0,
          category: 'ادبیات',
          difficulty: 'hard',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '8',
          question: 'نام اثر معروف مولانا چیست؟',
          options: ['مثنوی معنوی', 'بوستان', 'گلستان', 'دیوان شمس'],
          correctAnswer: 0,
          category: 'ادبیات',
          difficulty: 'easy',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '9',
          question: 'کدام شهر به عنوان پایتخت فرهنگی ایران شناخته می‌شود؟',
          options: ['اصفهان', 'شیراز', 'تبریز', 'مشهد'],
          correctAnswer: 0,
          category: 'فرهنگ',
          difficulty: 'medium',
          approved: true,
          createdAt: new Date()
        },
        {
          id: '10',
          question: 'پاسارگاد مقبره کدام پادشاه است؟',
          options: ['کوروش', 'داریوش', 'خشایارشاه', 'اردشیر'],
          correctAnswer: 0,
          category: 'تاریخ',
          difficulty: 'easy',
          approved: true,
          createdAt: new Date()
        }
      ];
    }
    
    // انتخاب تصادفی تعداد مشخصی سوال
    if (questions.length > gameSession.data.maxQuestions) {
      // مخلوط کردن سوالات
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      
      // انتخاب تعداد مورد نیاز
      questions = questions.slice(0, gameSession.data.maxQuestions);
    }
    
    return questions;
  } catch (error) {
    log(`Error loading questions for quiz: ${error}`, 'error');
    return [];
  }
}

/**
 * شروع بازی اطلاعات عمومی
 */
async function startQuizGame(interaction: ButtonInteraction) {
  try {
    // پیدا کردن بازی فعال در کانال جاری
    const gameSession = Array.from(activeGames.values()).find(
      game => game.gameType === 'quiz' && 
      game.channelId === interaction.channelId && 
      game.status === 'waiting'
    );
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی فعالی یافت نشد!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر سازنده بازی است
    if (gameSession.createdBy !== interaction.user.id) {
      return await interaction.reply({ 
        content: '❌ فقط سازنده بازی می‌تواند بازی را شروع کند!', 
        ephemeral: true 
      });
    }
    
    // بررسی تعداد بازیکنان (حداقل 2 نفر)
    if (gameSession.players.length < 2) {
      return await interaction.reply({ 
        content: '❌ برای شروع بازی حداقل به 2 بازیکن نیاز است!', 
        ephemeral: true 
      });
    }
    
    // بارگذاری سوالات
    const questions = await loadQuestionsForQuiz(gameSession);
    if (questions.length === 0) {
      return await interaction.reply({ 
        content: '❌ خطایی در بارگذاری سوالات رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
        ephemeral: true 
      });
    }
    
    // به‌روزرسانی وضعیت بازی
    gameSession.status = 'active';
    gameSession.startedAt = new Date();
    gameSession.data.questions = questions;
    gameSession.data.currentQuestionIndex = -1;
    activeGames.set(gameSession.id, gameSession);
    
    // به‌روزرسانی پیام
    const embed = new EmbedBuilder()
      .setTitle('📚 مسابقه اطلاعات عمومی')
      .setDescription('مسابقه شروع شد! اولین سوال به زودی نمایش داده می‌شود...')
      .setColor(0x4F77AA)
      .addFields(
        { name: '👥 بازیکنان', value: gameSession.players.map(playerId => `<@${playerId}>`).join('\n') },
        { name: '⏱️ زمان هر سوال', value: `${gameSession.data.timePerQuestion} ثانیه`, inline: true },
        { name: '📝 تعداد سوالات', value: `${gameSession.data.questions.length} سوال`, inline: true }
      );
    
    await interaction.update({ 
      embeds: [embed], 
      components: [] 
    });
    
    // نمایش اولین سوال
    setTimeout(() => showNextQuestion(gameSession), 3000);
    
  } catch (error) {
    log(`Error starting quiz game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در شروع بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * نمایش سوال بعدی در بازی اطلاعات عمومی
 */
async function showNextQuestion(gameSession: GameSession) {
  try {
    // افزایش شاخص سوال فعلی
    gameSession.data.currentQuestionIndex++;
    
    // بررسی اتمام بازی
    if (gameSession.data.currentQuestionIndex >= gameSession.data.questions.length) {
      // استفاده از کلاینت اصلی برای دسترسی
      const client = require('../client').default;
      const tmpInteraction = { client } as ButtonInteraction;
      return await endQuizGame(gameSession, tmpInteraction);
    }
    
    // دریافت سوال فعلی
    const currentQuestion = gameSession.data.questions[gameSession.data.currentQuestionIndex];
    
    // ایجاد Embed برای سوال
    const embed = new EmbedBuilder()
      .setTitle(`📝 سوال ${gameSession.data.currentQuestionIndex + 1} از ${gameSession.data.questions.length}`)
      .setDescription(currentQuestion.question)
      .setColor(0x4F77AA)
      .addFields(
        { name: '🔢 شماره سوال', value: `${gameSession.data.currentQuestionIndex + 1}`, inline: true },
        { name: '🏷️ دسته‌بندی', value: currentQuestion.category, inline: true },
        { name: '⏱️ زمان باقی‌مانده', value: `${gameSession.data.timePerQuestion} ثانیه`, inline: true }
      )
      .setFooter({ text: 'لطفاً یکی از گزینه‌ها را انتخاب کنید' });
    
    // ایجاد دکمه‌های گزینه‌ها
    const buttons = new ActionRowBuilder<ButtonBuilder>();
    
    currentQuestion.options.forEach((option, index) => {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_answer_${gameSession.id}_${index}`)
          .setLabel(option)
          .setStyle(ButtonStyle.Primary)
      );
    });
    
    // ارسال پیام
    const client = require('../client').default;
    const channel = await client.channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      const questionMessage = await channel.send({ 
        embeds: [embed], 
        components: [buttons] 
      });
      
      // ذخیره شناسه پیام سوال فعلی
      gameSession.data.currentQuestionMessageId = questionMessage.id;
      activeGames.set(gameSession.id, gameSession);
      
      // شروع تایمر برای سوال
      startQuestionTimer(gameSession);
    }
  } catch (error) {
    log(`Error showing next question: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به سوال بعدی برویم
    setTimeout(() => showNextQuestion(gameSession), 3000);
  }
}

/**
 * شروع تایمر برای سوال فعلی
 */
function startQuestionTimer(gameSession: GameSession, interaction?: ButtonInteraction) {
  try {
    const totalTime = gameSession.data.timePerQuestion;
    let timeLeft = totalTime;
    
    // ذخیره زمان شروع سوال
    gameSession.data.currentQuestionStartTime = Date.now();
    activeGames.set(gameSession.id, gameSession);
    
    // تنظیم تایمر برای به‌روزرسانی زمان باقی‌مانده
    const timerInterval = setInterval(async () => {
      try {
        timeLeft--;
        
        // به‌روزرسانی Embed در نیمه زمان
        if (timeLeft === Math.floor(totalTime / 2)) {
          await updateQuestionTimeRemaining(gameSession, timeLeft);
        }
        
        // پایان زمان
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          // Get a client reference if interaction is not available
          const client = require('../client').default;
          const tmpInteraction = interaction || { client } as ButtonInteraction;
          await handleQuestionTimeout(gameSession, tmpInteraction);
        }
      } catch (intervalError) {
        log(`Error in question timer interval: ${intervalError}`, 'error');
        clearInterval(timerInterval);
      }
    }, 1000);
    
    // ذخیره شناسه تایمر
    gameSession.data.currentQuestionTimerId = timerInterval;
    activeGames.set(gameSession.id, gameSession);
  } catch (error) {
    log(`Error starting question timer: ${error}`, 'error');
  }
}

/**
 * به‌روزرسانی زمان باقی‌مانده در Embed سوال
 */
async function updateQuestionTimeRemaining(gameSession: GameSession, timeLeft: number) {
  try {
    // If we don't have a client reference from an interaction, we'll get it from the active client
    const client = require('../client').default;
    const channel = await client.channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(gameSession.data.currentQuestionMessageId);
      if (message) {
        const embed = EmbedBuilder.from(message.embeds[0]);
        
        // به‌روزرسانی فیلد زمان باقی‌مانده
        const timeField = embed.data.fields?.find(field => field.name === '⏱️ زمان باقی‌مانده');
        if (timeField) {
          timeField.value = `${timeLeft} ثانیه`;
        }
        
        await message.edit({ embeds: [embed] });
      }
    }
  } catch (error) {
    log(`Error updating question time remaining: ${error}`, 'error');
  }
}

/**
 * مدیریت پایان زمان سوال
 */
async function handleQuestionTimeout(gameSession: GameSession, interaction: ButtonInteraction) {
  try {
    // پاکسازی تایمر
    if (gameSession.data.currentQuestionTimerId) {
      clearInterval(gameSession.data.currentQuestionTimerId);
    }
    
    const client = require('../client').default;
    const channel = await (interaction?.client || client).channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(gameSession.data.currentQuestionMessageId);
      
      if (message) {
        const currentQuestion = gameSession.data.questions[gameSession.data.currentQuestionIndex];
        const correctAnswer = currentQuestion.options[currentQuestion.correctAnswer];
        
        const embed = EmbedBuilder.from(message.embeds[0])
          .setTitle(`⏱️ زمان تمام شد!`)
          .setColor(0xFF5555)
          .setFooter({ text: `پاسخ صحیح: ${correctAnswer}` });
        
        await message.edit({ 
          embeds: [embed], 
          components: [] 
        });
        
        // نمایش سوال بعدی پس از مدتی
        setTimeout(() => showNextQuestion(gameSession), 3000);
      }
    }
  } catch (error) {
    log(`Error handling question timeout: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به سوال بعدی برویم
    setTimeout(() => showNextQuestion(gameSession), 3000);
  }
}

/**
 * مدیریت پاسخ کاربر به سوال
 */
export async function handleQuizAnswer(interaction: ButtonInteraction) {
  try {
    // استخراج شناسه بازی و شماره گزینه از شناسه دکمه
    const [_, __, gameId, optionIndex] = interaction.customId.split('_');
    const gameSession = activeGames.get(gameId);
    
    if (!gameSession || gameSession.status !== 'active') {
      return await interaction.reply({ content: '❌ بازی مورد نظر یافت نشد یا فعال نیست!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر بازیکن است
    if (!gameSession.players.includes(interaction.user.id)) {
      return await interaction.reply({ content: '❌ شما بازیکن این بازی نیستید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر قبلاً به این سوال پاسخ داده است
    const currentQuestion = gameSession.data.questions[gameSession.data.currentQuestionIndex];
    const questionAnswers = gameSession.data.questionAnswers || {};
    const questionId = `${gameSession.data.currentQuestionIndex}`;
    
    if (!questionAnswers[questionId]) {
      questionAnswers[questionId] = {};
    }
    
    if (questionAnswers[questionId][interaction.user.id]) {
      return await interaction.reply({ content: '❌ شما قبلاً به این سوال پاسخ داده‌اید!', ephemeral: true });
    }
    
    // ذخیره پاسخ کاربر
    questionAnswers[questionId][interaction.user.id] = {
      option: parseInt(optionIndex),
      time: Date.now() - gameSession.data.currentQuestionStartTime
    };
    
    gameSession.data.questionAnswers = questionAnswers;
    
    // بررسی صحت پاسخ و اضافه کردن امتیاز
    const isCorrect = parseInt(optionIndex) === currentQuestion.correctAnswer;
    if (isCorrect) {
      // محاسبه امتیاز بر اساس سرعت پاسخ
      const timeTaken = questionAnswers[questionId][interaction.user.id].time / 1000; // تبدیل به ثانیه
      const maxTime = gameSession.data.timePerQuestion;
      const timeScore = Math.max(1, Math.ceil((maxTime - timeTaken) / maxTime * 5));
      
      // افزودن امتیاز
      gameSession.data.playerScores[interaction.user.id] = 
        (gameSession.data.playerScores[interaction.user.id] || 0) + timeScore;
    }
    
    // به‌روزرسانی بازی
    activeGames.set(gameSession.id, gameSession);
    
    // پاسخ به کاربر
    await interaction.reply({ 
      content: isCorrect ? '✅ پاسخ شما صحیح است!' : '❌ پاسخ شما اشتباه است!', 
      ephemeral: true 
    });
    
    // بررسی اگر همه بازیکنان پاسخ داده‌اند
    const totalResponses = Object.keys(questionAnswers[questionId]).length;
    if (totalResponses >= gameSession.players.length) {
      // پاکسازی تایمر
      if (gameSession.data.currentQuestionTimerId) {
        clearInterval(gameSession.data.currentQuestionTimerId);
      }
      
      // نمایش پاسخ صحیح
      await showQuestionResults(gameSession);
      
      // رفتن به سوال بعدی
      setTimeout(() => showNextQuestion(gameSession), 5000);
    }
    
  } catch (error) {
    log(`Error handling quiz answer: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در ثبت پاسخ رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * نمایش نتایج سوال
 */
async function showQuestionResults(gameSession: GameSession, interaction?: ButtonInteraction) {
  try {
    // If we don't have a client reference from an interaction, we'll get it from the active client
    const client = require('../client').default;
    const channel = await (interaction?.client || client).channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(gameSession.data.currentQuestionMessageId);
      
      if (message) {
        const currentQuestion = gameSession.data.questions[gameSession.data.currentQuestionIndex];
        const correctAnswer = currentQuestion.options[currentQuestion.correctAnswer];
        
        // دریافت پاسخ‌های بازیکنان
        const questionId = `${gameSession.data.currentQuestionIndex}`;
        const answers = gameSession.data.questionAnswers[questionId];
        
        // تعداد پاسخ‌های درست
        const correctCount = Object.entries(answers).filter(
          ([_, answer]) => (answer as any).option === currentQuestion.correctAnswer
        ).length;
        
        // لیست بازیکنانی که درست پاسخ داده‌اند
        const correctPlayers = Object.entries(answers)
          .filter(([_, answer]) => (answer as any).option === currentQuestion.correctAnswer)
          .map(([playerId, _]) => `<@${playerId}>`)
          .join('\n');
        
        const embed = EmbedBuilder.from(message.embeds[0])
          .setTitle(`🎯 نتیجه سوال ${gameSession.data.currentQuestionIndex + 1}`)
          .setColor(0x4CAF50)
          .setDescription(`پاسخ صحیح: **${correctAnswer}**`)
          .addFields(
            { name: '✅ تعداد پاسخ‌های صحیح', value: `${correctCount} از ${gameSession.players.length}`, inline: true },
            { name: '👤 پاسخ‌های صحیح', value: correctPlayers || 'هیچکس پاسخ صحیح نداد!' }
          )
          .setFooter({ text: 'سوال بعدی به زودی...' });
        
        await message.edit({ 
          embeds: [embed], 
          components: [] 
        });
      }
    }
  } catch (error) {
    log(`Error showing question results: ${error}`, 'error');
  }
}

/**
 * پایان بازی اطلاعات عمومی
 */
async function endQuizGame(gameSession: GameSession, interaction: ButtonInteraction) {
  try {
    // به‌روزرسانی وضعیت بازی
    gameSession.status = 'ended';
    gameSession.endedAt = new Date();
    
    // مرتب‌سازی امتیازات
    const sortedScores = Object.entries(gameSession.data.playerScores)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([playerId, score]) => ({ playerId, score }));
    
    // جوایز برای سه نفر اول
    const prizes = [500, 300, 100];
    
    // اعطای جوایز
    for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
      const winner = sortedScores[i];
      if (winner) {
        try {
          await storage.addToWallet(Number(winner.playerId), prizes[i], 'quiz_prize', { gameType: 'quiz' });
        } catch (prizeError) {
          log(`Error giving prize to user ${winner.playerId}: ${prizeError}`, 'error');
        }
      }
    }
    
    // ساخت Embed نتایج
    const embed = new EmbedBuilder()
      .setTitle('🏆 پایان مسابقه اطلاعات عمومی')
      .setDescription('مسابقه به پایان رسید! نتایج نهایی:')
      .setColor(0xFFD700);
    
    // اضافه کردن فیلدهای امتیازات
    for (let i = 0; i < sortedScores.length; i++) {
      const player = sortedScores[i];
      let rankEmoji = '';
      
      // تعیین ایموجی مقام
      if (i === 0) rankEmoji = '🥇';
      else if (i === 1) rankEmoji = '🥈';
      else if (i === 2) rankEmoji = '🥉';
      else rankEmoji = `${i + 1}.`;
      
      // اضافه کردن فیلد برای هر بازیکن
      embed.addFields({
        name: `${rankEmoji} <@${player.playerId}>`,
        value: `امتیاز: ${player.score} ${i < 3 ? `(جایزه: ${prizes[i]} کوین)` : ''}`,
        inline: i < 3
      });
    }
    
    // پیام تشکر و تبلیغ قابلیت ارسال سوال
    embed.setFooter({ 
      text: 'با تشکر از همه شرکت‌کنندگان! شما هم می‌توانید با دستور /quiz سوال جدید اضافه کنید.' 
    });
    
    // ارسال پیام - استفاده از کلاینت اصلی اگر اینتراکشن موجود نباشد
    const client = require('../client').default;
    const channel = await (interaction?.client || client).channels.fetch(gameSession.channelId);
    if (channel && channel.isTextBased()) {
      if ('send' in channel) {
        await channel.send({ 
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('quiz_submit_question')
                  .setLabel('ارسال سوال جدید')
                  .setEmoji('✏️')
                  .setStyle(ButtonStyle.Secondary)
              )
          ]
        });
      }
    }
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(gameSession.id);
    
  } catch (error) {
    log(`Error ending quiz game: ${error}`, 'error');
    
    // سعی می‌کنیم یک پیام خطا به کانال بفرستیم
    try {
      const client = require('../client').default;
      const channel = await (interaction?.client || client).channels.fetch(gameSession.channelId);
      if (channel && channel.isTextBased()) {
        if ('send' in channel) {
          await channel.send({ 
            content: '❌ خطایی در پایان بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.'
          });
        }
      }
    } catch (sendError) {
      log(`Error sending error message at the end of quiz game: ${sendError}`, 'error');
    }
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(gameSession.id);
  }
}

/**
 * مدیریت بازی نقاشی حدس بزن
 */
async function handleDrawGuessGame(interaction: ButtonInteraction) {
  try {
    // بررسی اینکه آیا بازی در کانال فعلی در حال اجراست
    const existingGame = await getActiveGameInChannel(interaction.channelId, 'drawguess');
    if (existingGame) {
      return await interaction.reply({ 
        content: '❌ یک بازی نقاشی حدس بزن در حال حاضر در این کانال در حال اجراست!', 
        ephemeral: true 
      });
    }
    
    // ایجاد Embed معرفی بازی
    const embed = new EmbedBuilder()
      .setTitle('🎨 نقاشی حدس بزن')
      .setDescription(
        'در این بازی، یک نفر نقاشی می‌کشد و بقیه باید حدس بزنند که چه چیزی است!\n\n' +
        '**قوانین بازی:**\n' +
        '- هر نفر به نوبت نقاش می‌شود\n' +
        '- نقاش 30 ثانیه وقت دارد تا چیزی را بکشد\n' +
        '- سایر بازیکنان 60 ثانیه فرصت دارند تا حدس بزنند\n' +
        '- نقاش و اولین کسی که درست حدس بزند امتیاز می‌گیرند\n\n' +
        '**برای شرکت در بازی روی دکمه زیر کلیک کنید:**'
      )
      .setColor(0xFFAA22)
      .setFooter({ text: 'نفرات برتر در پایان بازی جایزه دریافت می‌کنند!' });
    
    // ایجاد دکمه‌های پیوستن و شروع بازی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('drawguess_join')
          .setLabel('شرکت در بازی')
          .setEmoji('✏️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('drawguess_start')
          .setLabel('شروع بازی')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Success)
      );
    
    // ایجاد یک جلسه بازی جدید
    const gameId = uuidv4();
    const newGameSession: GameSession = {
      id: gameId,
      gameType: 'drawguess',
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      players: [interaction.user.id],
      status: 'waiting',
      createdAt: new Date(),
      data: {
        currentRound: 0,
        totalRounds: 5,
        currentDrawer: null,
        currentWord: null,
        wordOptions: [],
        playerScores: {
          [interaction.user.id]: 0
        },
        drawingTime: 30, // ثانیه
        guessTime: 60, // ثانیه
        words: [
          'سیب', 'ماشین', 'خانه', 'درخت', 'گربه', 'سگ', 'ماه', 'خورشید', 
          'ستاره', 'گل', 'توپ', 'دوچرخه', 'کتاب', 'تلفن', 'کامپیوتر',
          'قایق', 'هواپیما', 'ساعت', 'چتر', 'عینک', 'کفش', 'شلوار',
          'پیراهن', 'پنجره', 'در', 'میز', 'صندلی', 'قلم', 'مداد', 'فیل'
        ]
      }
    };
    
    // ذخیره بازی در سیستم ذخیره‌سازی
    await storage.createGameSession(newGameSession);
    
    // افزودن به لیست بازی‌های فعال
    activeGames.set(gameId, newGameSession);
    
    // ارسال پیام بازی
    const message = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true
    });
    
    // ذخیره شناسه پیام برای استفاده‌های بعدی
    newGameSession.data.messageId = message.id;
    activeGames.set(gameId, newGameSession);
    
  } catch (error) {
    log(`Error handling draw guess game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * پیوستن به بازی نقاشی حدس بزن
 */
async function joinDrawGuessGame(interaction: ButtonInteraction) {
  try {
    // یافتن بازی فعال در کانال
    const game = await getActiveGameInChannel(interaction.channelId, 'drawguess');
    
    if (!game || game.status !== 'waiting') {
      return await interaction.reply({ 
        content: '❌ بازی نقاشی حدس بزنی برای پیوستن یافت نشد!', 
        ephemeral: true 
      });
    }
    
    // بررسی اینکه آیا کاربر قبلاً به بازی پیوسته است
    if (game.players.includes(interaction.user.id)) {
      return await interaction.reply({ 
        content: '✅ شما قبلاً به این بازی پیوسته‌اید!', 
        ephemeral: true 
      });
    }
    
    // افزودن کاربر به لیست بازیکنان
    game.players.push(interaction.user.id);
    game.data.playerScores[interaction.user.id] = 0;
    
    // به‌روزرسانی بازی در سیستم ذخیره‌سازی
    await storage.updateGameSession(game);
    
    // به‌روزرسانی بازی در لیست بازی‌های فعال
    activeGames.set(game.id, game);
    
    // به‌روزرسانی Embed با لیست بازیکنان جدید
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(game.data.messageId);
      
      if (message) {
        const embed = EmbedBuilder.from(message.embeds[0]);
        
        // افزودن فیلد بازیکنان یا به‌روزرسانی آن
        const playerField = embed.data.fields?.find(field => field.name === '👥 بازیکنان');
        const playersList = game.players.map(playerId => `<@${playerId}>`).join('\n');
        
        if (playerField) {
          playerField.value = playersList;
        } else {
          embed.addFields({ name: '👥 بازیکنان', value: playersList });
        }
        
        await message.edit({ embeds: [embed] });
      }
    }
    
    await interaction.reply({ 
      content: `✅ شما با موفقیت به بازی نقاشی حدس بزن پیوستید! تعداد بازیکنان: ${game.players.length}`, 
      ephemeral: true 
    });
    
  } catch (error) {
    log(`Error joining draw guess game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در پیوستن به بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * شروع بازی نقاشی حدس بزن
 */
async function startDrawGuessGame(interaction: ButtonInteraction) {
  try {
    // یافتن بازی فعال در کانال
    const game = await getActiveGameInChannel(interaction.channelId, 'drawguess');
    
    if (!game || game.status !== 'waiting') {
      return await interaction.reply({ 
        content: '❌ بازی نقاشی حدس بزنی برای شروع یافت نشد!', 
        ephemeral: true 
      });
    }
    
    // بررسی اینکه فقط سازنده بازی می‌تواند آن را شروع کند
    if (game.createdBy !== interaction.user.id) {
      return await interaction.reply({ 
        content: '❌ فقط سازنده بازی می‌تواند بازی را شروع کند!', 
        ephemeral: true 
      });
    }
    
    // بررسی تعداد بازیکنان (حداقل 2 نفر)
    if (game.players.length < 2) {
      return await interaction.reply({ 
        content: '❌ برای شروع بازی حداقل به 2 بازیکن نیاز است!', 
        ephemeral: true 
      });
    }
    
    // به‌روزرسانی وضعیت بازی
    game.status = 'active';
    game.startedAt = new Date();
    
    // مخلوط کردن آرایه بازیکنان برای تعیین ترتیب نقاشی
    game.data.playerOrder = shuffle([...game.players]);
    
    // انتخاب اولین نقاش
    game.data.currentDrawer = game.data.playerOrder[0];
    
    // به‌روزرسانی بازی در سیستم ذخیره‌سازی
    await storage.updateGameSession(game);
    
    // به‌روزرسانی بازی در لیست بازی‌های فعال
    activeGames.set(game.id, game);
    
    // ارسال پیام شروع بازی
    await interaction.reply({ 
      content: `🎮 بازی نقاشی حدس بزن با ${game.players.length} بازیکن شروع شد!`, 
      fetchReply: true 
    });
    
    // شروع اولین دور بازی
    setTimeout(() => startNextRoundDrawGuess(game, interaction), 3000);
    
  } catch (error) {
    log(`Error starting draw guess game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در شروع بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * شروع دور بعدی بازی نقاشی حدس بزن
 */
async function startNextRoundDrawGuess(game: GameSession, interaction?: ButtonInteraction) {
  try {
    // افزایش شماره دور
    game.data.currentRound++;
    
    // بررسی پایان بازی
    if (game.data.currentRound > game.data.totalRounds) {
      const client = require('../client').default;
      const tmpInteraction = interaction || { client } as ButtonInteraction;
      return await endDrawGuessGame(game, tmpInteraction);
    }
    
    // انتخاب نقاش برای این دور
    const drawerIndex = (game.data.currentRound - 1) % game.players.length;
    game.data.currentDrawer = game.data.playerOrder[drawerIndex];
    
    // انتخاب سه کلمه تصادفی برای نقاش
    game.data.wordOptions = shuffle([...game.data.words]).slice(0, 3);
    
    // به‌روزرسانی بازی در سیستم ذخیره‌سازی
    await storage.updateGameSession(game);
    
    // به‌روزرسانی بازی در لیست بازی‌های فعال
    activeGames.set(game.id, game);
    
    // ارسال پیام انتخاب کلمه
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      // ارسال پیام عمومی برای اعلام نقاش
      const publicEmbed = new EmbedBuilder()
        .setTitle(`🎨 دور ${game.data.currentRound} - نقاشی حدس بزن`)
        .setDescription(`در این دور <@${game.data.currentDrawer}> نقاشی می‌کشد!\n\nنقاش در حال انتخاب کلمه است...`)
        .setColor(0xFFAA22)
        .addFields({ name: '⏱️ زمان آماده‌سازی', value: '15 ثانیه' });
      
      await channel.send({ embeds: [publicEmbed] });
      
      // ارسال پیام خصوصی به نقاش برای انتخاب کلمه
      const drawer = await client.users.fetch(game.data.currentDrawer);
      
      const wordButtons = new ActionRowBuilder<ButtonBuilder>();
      
      // ایجاد دکمه برای هر کلمه
      game.data.wordOptions.forEach((word, index) => {
        wordButtons.addComponents(
          new ButtonBuilder()
            .setCustomId(`drawguess_word_${game.id}_${index}`)
            .setLabel(word)
            .setStyle(ButtonStyle.Primary)
        );
      });
      
      const drawerEmbed = new EmbedBuilder()
        .setTitle('🎨 انتخاب کلمه برای نقاشی')
        .setDescription('یک کلمه را برای نقاشی کشیدن انتخاب کنید:')
        .setColor(0xFFAA22)
        .setFooter({ text: 'پس از انتخاب کلمه، 30 ثانیه فرصت دارید تا توصیف خود را بنویسید.' });
      
      await drawer.send({ embeds: [drawerEmbed], components: [wordButtons] });
      
      // تنظیم تایمر برای انتخاب خودکار کلمه در صورت عدم انتخاب توسط نقاش
      setTimeout(async () => {
        if (!game.data.currentWord) {
          // انتخاب خودکار یک کلمه
          const randomIndex = Math.floor(Math.random() * game.data.wordOptions.length);
          game.data.currentWord = game.data.wordOptions[randomIndex];
          
          // به‌روزرسانی بازی
          await storage.updateGameSession(game);
          activeGames.set(game.id, game);
          
          // شروع مرحله نقاشی
          await startDrawingPhase(game);
        }
      }, 15000);
    }
    
  } catch (error) {
    log(`Error starting next round in draw guess game: ${error}`, 'error');
    
    // در صورت خطا، سعی می‌کنیم به دور بعدی برویم یا بازی را تمام کنیم
    if (game.data.currentRound >= game.data.totalRounds) {
      const client = require('../client').default;
      const tmpInteraction = { client } as ButtonInteraction;
      await endDrawGuessGame(game, tmpInteraction);
    } else {
      setTimeout(() => startNextRoundDrawGuess(game), 3000);
    }
  }
}

/**
 * مدیریت انتخاب کلمه توسط نقاش
 */
async function handleWordSelection(interaction: ButtonInteraction) {
  try {
    // استخراج اطلاعات از شناسه دکمه
    const [_, __, gameId, wordIndex] = interaction.customId.split('_');
    const game = activeGames.get(gameId);
    
    if (!game || game.status !== 'active') {
      return await interaction.reply({ 
        content: '❌ بازی مورد نظر یافت نشد یا فعال نیست!', 
        ephemeral: true 
      });
    }
    
    // بررسی اینکه فقط نقاش می‌تواند کلمه را انتخاب کند
    if (game.data.currentDrawer !== interaction.user.id) {
      return await interaction.reply({ 
        content: '❌ فقط نقاش این دور می‌تواند کلمه را انتخاب کند!', 
        ephemeral: true 
      });
    }
    
    // ذخیره کلمه انتخاب شده
    const selectedWord = game.data.wordOptions[parseInt(wordIndex)];
    game.data.currentWord = selectedWord;
    
    // به‌روزرسانی بازی
    await storage.updateGameSession(game);
    activeGames.set(game.id, game);
    
    // پاسخ به نقاش
    await interaction.update({ 
      content: `✅ شما کلمه "${selectedWord}" را برای نقاشی انتخاب کردید! شما 30 ثانیه فرصت دارید تا توصیف خود را بنویسید.`, 
      components: [],
      embeds: []
    });
    
    // شروع مرحله نقاشی
    await startDrawingPhase(game);
    
  } catch (error) {
    log(`Error handling word selection: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در انتخاب کلمه رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * شروع مرحله نقاشی
 */
async function startDrawingPhase(game: GameSession) {
  try {
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      // ارسال پیام برای شروع مرحله نقاشی
      const drawingEmbed = new EmbedBuilder()
        .setTitle(`🎨 دور ${game.data.currentRound} - نوبت نقاشی`)
        .setDescription(`<@${game.data.currentDrawer}> در حال نقاشی کلمه مخفی است!\n\nسایر بازیکنان باید حدس بزنند.`)
        .setColor(0xFFAA22)
        .addFields({ name: '⏱️ زمان نقاشی', value: `${game.data.drawingTime} ثانیه` })
        .setFooter({ text: 'در پیام‌های خود حدس خود را بنویسید. اولین نفری که درست حدس بزند برنده است!' });
      
      const drawingMessage = await channel.send({ embeds: [drawingEmbed] });
      game.data.drawingMessageId = drawingMessage.id;
      
      // به‌روزرسانی بازی
      await storage.updateGameSession(game);
      activeGames.set(game.id, game);
      
      // ارسال پیام خصوصی به نقاش با کلمه
      const drawer = await client.users.fetch(game.data.currentDrawer);
      await drawer.send(`🎨 لطفاً توصیف یا نقاشی خود را از کلمه "${game.data.currentWord}" در کانال ارسال کنید. شما ${game.data.drawingTime} ثانیه فرصت دارید.`);
      
      // شروع تایمر برای پایان مرحله نقاشی
      setTimeout(async () => {
        await startGuessingPhase(game);
      }, game.data.drawingTime * 1000);
      
      // تنظیم یک تایمر برای اطلاع‌رسانی نیمه زمان
      setTimeout(async () => {
        try {
          const halfTimeMessage = await channel.messages.fetch(game.data.drawingMessageId);
          if (halfTimeMessage) {
            const updatedEmbed = EmbedBuilder.from(halfTimeMessage.embeds[0]);
            updatedEmbed.setFields({ name: '⏱️ زمان باقی‌مانده', value: `${Math.floor(game.data.drawingTime / 2)} ثانیه` });
            await halfTimeMessage.edit({ embeds: [updatedEmbed] });
          }
        } catch (timeUpdateError) {
          log(`Error updating half-time message: ${timeUpdateError}`, 'error');
        }
      }, Math.floor(game.data.drawingTime / 2) * 1000);
    }
    
  } catch (error) {
    log(`Error starting drawing phase: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به دور بعدی برویم
    setTimeout(() => startNextRoundDrawGuess(game), 3000);
  }
}

/**
 * شروع مرحله حدس زدن
 */
async function startGuessingPhase(game: GameSession) {
  try {
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      // ارسال پیام برای شروع مرحله حدس زدن
      const guessingEmbed = new EmbedBuilder()
        .setTitle(`🎮 دور ${game.data.currentRound} - مرحله حدس زدن`)
        .setDescription(`زمان نقاشی به پایان رسید! همه باید حدس بزنند که نقاشی <@${game.data.currentDrawer}> چیست!`)
        .setColor(0x4CAF50)
        .addFields({ name: '⏱️ زمان حدس زدن', value: `${game.data.guessTime} ثانیه` })
        .setFooter({ text: 'در پیام‌های خود حدس خود را بنویسید. اولین نفری که درست حدس بزند برنده است!' });
      
      const guessingMessage = await channel.send({ embeds: [guessingEmbed] });
      game.data.guessingMessageId = guessingMessage.id;
      
      // فعال کردن وضعیت حدس زدن
      game.data.guessingPhase = true;
      game.data.correctGuessers = [];
      game.data.guessStart = Date.now();
      
      // به‌روزرسانی بازی
      await storage.updateGameSession(game);
      activeGames.set(game.id, game);
      
      // تنظیم یک تایمر برای اطلاع‌رسانی نیمه زمان
      setTimeout(async () => {
        try {
          const halfTimeMessage = await channel.messages.fetch(game.data.guessingMessageId);
          if (halfTimeMessage) {
            const updatedEmbed = EmbedBuilder.from(halfTimeMessage.embeds[0]);
            updatedEmbed.setFields({ name: '⏱️ زمان باقی‌مانده', value: `${Math.floor(game.data.guessTime / 2)} ثانیه` });
            await halfTimeMessage.edit({ embeds: [updatedEmbed] });
          }
        } catch (timeUpdateError) {
          log(`Error updating half-time message: ${timeUpdateError}`, 'error');
        }
      }, Math.floor(game.data.guessTime / 2) * 1000);
      
      // شروع تایمر برای پایان مرحله حدس زدن
      setTimeout(async () => {
        await endGuessingPhase(game);
      }, game.data.guessTime * 1000);
      
      // اضافه کردن یک ایونت برای پردازش پیام‌های کانال برای حدس‌ها
      const messageCollector = channel.createMessageCollector({ 
        filter: msg => game.players.includes(msg.author.id) && msg.author.id !== game.data.currentDrawer,
        time: game.data.guessTime * 1000
      });
      
      messageCollector.on('collect', async (message) => {
        // بررسی اینکه آیا بازی هنوز فعال است
        const currentGame = activeGames.get(game.id);
        if (!currentGame || currentGame.status !== 'active' || !currentGame.data.guessingPhase) {
          return;
        }
        
        // بررسی اینکه آیا فرستنده قبلاً حدس درست زده است
        if (currentGame.data.correctGuessers?.includes(message.author.id)) {
          return;
        }
        
        // بررسی حدس
        const guess = message.content.trim().toLowerCase();
        const targetWord = currentGame.data.currentWord?.toLowerCase();
        
        if (guess === targetWord) {
          // حدس درست - افزودن به لیست حدس کنندگان
          currentGame.data.correctGuessers.push(message.author.id);
          
          // محاسبه امتیاز بر اساس سرعت پاسخ
          const timeTaken = (Date.now() - currentGame.data.guessStart) / 1000; // تبدیل به ثانیه
          const maxTime = currentGame.data.guessTime;
          const timeScore = Math.max(1, Math.ceil((maxTime - timeTaken) / maxTime * 5));
          
          // افزودن امتیاز
          currentGame.data.playerScores[message.author.id] = 
            (currentGame.data.playerScores[message.author.id] || 0) + timeScore;
          
          // پاسخ به کاربر
          await message.reply(`✅ حدس شما درست است! شما ${timeScore} امتیاز کسب کردید.`);
          
          // به‌روزرسانی بازی
          await storage.updateGameSession(currentGame);
          activeGames.set(currentGame.id, currentGame);
          
          // اگر این اولین حدس درست است
          if (currentGame.data.correctGuessers.length === 1) {
            // اضافه کردن امتیاز برای نقاش هم
            currentGame.data.playerScores[currentGame.data.currentDrawer] = 
              (currentGame.data.playerScores[currentGame.data.currentDrawer] || 0) + 3;
            
            // به‌روزرسانی بازی
            await storage.updateGameSession(currentGame);
            activeGames.set(currentGame.id, currentGame);
            
            // اگر تعداد حدس صحیح به حد کافی رسید، دور را زودتر تمام کنیم
            if (currentGame.data.correctGuessers.length >= Math.ceil(currentGame.players.length * 0.6)) {
              messageCollector.stop();
              await endGuessingPhase(currentGame);
            }
          }
        }
      });
    }
    
  } catch (error) {
    log(`Error starting guessing phase: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به دور بعدی برویم
    setTimeout(() => startNextRoundDrawGuess(game), 3000);
  }
}

/**
 * پایان مرحله حدس زدن
 */
async function endGuessingPhase(game: GameSession) {
  try {
    // غیرفعال کردن وضعیت حدس زدن
    game.data.guessingPhase = false;
    
    // به‌روزرسانی بازی
    await storage.updateGameSession(game);
    activeGames.set(game.id, game);
    
    const client = require('../client').default;
    const channel = await client.channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      // بررسی اینکه آیا کسی درست حدس زده است
      const correctGuessCount = game.data.correctGuessers?.length || 0;
      
      // ساخت پیام نتیجه
      const resultEmbed = new EmbedBuilder()
        .setTitle(`🎯 نتیجه دور ${game.data.currentRound}`)
        .setDescription(`کلمه صحیح: **${game.data.currentWord}**`)
        .setColor(0x4CAF50)
        .addFields(
          { name: '🎨 نقاش', value: `<@${game.data.currentDrawer}>`, inline: true },
          { name: '✅ تعداد حدس‌های صحیح', value: `${correctGuessCount} نفر`, inline: true }
        );
      
      // اضافه کردن لیست افرادی که درست حدس زده‌اند
      if (correctGuessCount > 0) {
        const guessersList = game.data.correctGuessers.map(
          (guesserId, index) => `${index + 1}. <@${guesserId}>`
        ).join('\n');
        
        resultEmbed.addFields({ name: '👥 افراد برنده', value: guessersList });
      } else {
        resultEmbed.addFields({ name: '😥 نتیجه', value: 'هیچکس نتوانست درست حدس بزند!' });
      }
      
      // نمایش امتیازات فعلی
      const scoresList = Object.entries(game.data.playerScores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([playerId, score], index) => `${index + 1}. <@${playerId}>: ${score} امتیاز`)
        .join('\n');
      
      resultEmbed.addFields({ name: '🏆 جدول امتیازات', value: scoresList });
      
      // ارسال پیام نتیجه
      await channel.send({ embeds: [resultEmbed] });
      
      // رفتن به دور بعدی پس از مدتی
      setTimeout(() => startNextRoundDrawGuess(game), 5000);
    }
    
  } catch (error) {
    log(`Error ending guessing phase: ${error}`, 'error');
    // در صورت خطا، سعی می‌کنیم به دور بعدی برویم
    setTimeout(() => startNextRoundDrawGuess(game), 3000);
  }
}

/**
 * پایان بازی نقاشی حدس بزن
 */
async function endDrawGuessGame(game: GameSession, interaction: ButtonInteraction) {
  try {
    // به‌روزرسانی وضعیت بازی
    game.status = 'ended';
    game.endedAt = new Date();
    
    // مرتب‌سازی امتیازات
    const sortedScores = Object.entries(game.data.playerScores)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([playerId, score]) => ({ playerId, score }));
    
    // جوایز برای سه نفر اول
    const prizes = [500, 300, 100];
    
    // اعطای جوایز
    for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
      const winner = sortedScores[i];
      if (winner) {
        try {
          await storage.addToWallet(Number(winner.playerId), prizes[i], 'drawguess_prize', { gameType: 'drawguess' });
        } catch (prizeError) {
          log(`Error giving prize to user ${winner.playerId}: ${prizeError}`, 'error');
        }
      }
    }
    
    // ساخت Embed نتایج
    const embed = new EmbedBuilder()
      .setTitle('🏆 پایان بازی نقاشی حدس بزن')
      .setDescription('بازی به پایان رسید! نتایج نهایی:')
      .setColor(0xFFD700);
    
    // اضافه کردن فیلدهای امتیازات
    for (let i = 0; i < sortedScores.length; i++) {
      const player = sortedScores[i];
      let rankEmoji = '';
      
      // تعیین ایموجی مقام
      if (i === 0) rankEmoji = '🥇';
      else if (i === 1) rankEmoji = '🥈';
      else if (i === 2) rankEmoji = '🥉';
      else rankEmoji = `${i + 1}.`;
      
      // اضافه کردن فیلد برای هر بازیکن
      embed.addFields({
        name: `${rankEmoji} <@${player.playerId}>`,
        value: `امتیاز: ${player.score} ${i < 3 ? `(جایزه: ${prizes[i]} کوین)` : ''}`,
        inline: i < 3
      });
    }
    
    // پیام تشکر
    embed.setFooter({ 
      text: 'با تشکر از همه شرکت‌کنندگان! می‌توانید دوباره این بازی را شروع کنید.' 
    });
    
    // ارسال پیام - استفاده از کلاینت اصلی اگر اینتراکشن موجود نباشد
    const client = require('../client').default;
    const channel = await (interaction?.client || client).channels.fetch(game.channelId);
    
    if (channel && channel.isTextBased()) {
      await channel.send({ 
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('drawguess_new')
                .setLabel('بازی جدید')
                .setEmoji('🎮')
                .setStyle(ButtonStyle.Success)
            )
        ]
      });
    }
    
    // به‌روزرسانی بازی در سیستم ذخیره‌سازی
    await storage.updateGameSession(game);
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(game.id);
    
  } catch (error) {
    log(`Error ending draw guess game: ${error}`, 'error');
    
    // سعی می‌کنیم یک پیام خطا به کانال بفرستیم
    try {
      const client = require('../client').default;
      const channel = await (interaction?.client || client).channels.fetch(game.channelId);
      
      if (channel && channel.isTextBased()) {
        await channel.send({ 
          content: '❌ خطایی در پایان بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.'
        });
      }
    } catch (sendError) {
      log(`Error sending error message at the end of draw guess game: ${sendError}`, 'error');
    }
    
    // حذف بازی از لیست بازی‌های فعال
    activeGames.delete(game.id);
  }
}

/**
 * مدیریت بازی جرأت یا حقیقت
 */
async function handleTruthOrDareGame(interaction: ButtonInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('😈 جرأت یا حقیقت')
      .setDescription('این بازی به زودی در دسترس قرار خواهد گرفت. لطفاً صبور باشید!')
      .setColor(0xFF55AA);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    log(`Error handling truth or dare game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت بازی بینگو
 */
async function handleBingoGame(interaction: ButtonInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎰 بینگو')
      .setDescription('این بازی به زودی در دسترس قرار خواهد گرفت. لطفاً صبور باشید!')
      .setColor(0x55AAFF);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    log(`Error handling bingo game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت بازی زنجیره کلمات
 */
async function handleWordChainGame(interaction: ButtonInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🔗 زنجیره کلمات')
      .setDescription('این بازی به زودی در دسترس قرار خواهد گرفت. لطفاً صبور باشید!')
      .setColor(0x55FF55);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    log(`Error handling word chain game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * تعریف نقش‌های بازی مافیا
 */
export enum MafiaRole {
  CITIZEN = 'citizen',       // شهروند عادی
  MAFIA = 'mafia',           // مافیا
  DETECTIVE = 'detective',   // کارآگاه
  DOCTOR = 'doctor',         // دکتر
  SNIPER = 'sniper',         // تک تیرانداز
  GODFATHER = 'godfather',   // رئیس مافیا
  SILENCER = 'silencer',     // ساکت کننده
  BODYGUARD = 'bodyguard',   // محافظ
  PSYCHOLOGIST = 'psychologist' // روانشناس
}

/**
 * توضیحات نقش‌های مافیا
 */
const MafiaRoleDescriptions: { [key in MafiaRole]: string } = {
  [MafiaRole.CITIZEN]: "👨‍💼 شهروند عادی - هدف شما شناسایی مافیاها و حذف آنهاست. در رأی‌گیری روز شرکت می‌کنید.",
  [MafiaRole.MAFIA]: "🔪 مافیا - شما عضو گروه مافیا هستید. هر شب یک نفر را به عنوان هدف حمله انتخاب می‌کنید.",
  [MafiaRole.DETECTIVE]: "🔍 کارآگاه - هر شب می‌توانید هویت یک بازیکن را بررسی کنید و بفهمید که مافیا هست یا خیر.",
  [MafiaRole.DOCTOR]: "💉 دکتر - هر شب می‌توانید یک نفر (از جمله خودتان) را نجات دهید.",
  [MafiaRole.SNIPER]: "🔫 تک تیرانداز - یک بار در طول بازی می‌توانید یک نفر را حذف کنید.",
  [MafiaRole.GODFATHER]: "👑 رئیس مافیا - شما رهبر گروه مافیا هستید و در بررسی کارآگاه، شهروند عادی شناخته می‌شوید.",
  [MafiaRole.SILENCER]: "🤐 ساکت کننده - عضو مافیا هستید و می‌توانید هر شب یک نفر را ساکت کنید تا در روز بعد نتواند صحبت کند.",
  [MafiaRole.BODYGUARD]: "🛡️ محافظ - هر شب می‌توانید از یک نفر محافظت کنید تا در برابر حمله مافیا ایمن بماند.",
  [MafiaRole.PSYCHOLOGIST]: "🧠 روانشناس - می‌توانید یک بار در طول بازی، یک شب را به روز تبدیل کنید تا هیچکس کشته نشود."
};

/**
 * وضعیت‌های بازی مافیا
 */
export enum MafiaGameState {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  ASSIGNING_ROLES = 'assigning_roles',
  NIGHT_TIME = 'night_time',
  DAY_TIME = 'day_time',
  VOTING = 'voting',
  GAME_OVER = 'game_over'
}

/**
 * اطلاعات بازیکن در بازی مافیا
 */
interface MafiaPlayer {
  userId: string;
  role: MafiaRole;
  isAlive: boolean;
  isSilenced: boolean;
  hasUsedAbility: boolean; // برای قابلیت‌های یک‌بار مصرف
  voteTarget?: string;     // هدف رأی در مرحله رأی‌گیری
  nightAction?: string;    // اقدام شبانه بازیکن (هدف قابلیت)
}

/**
 * داده‌های بازی مافیا
 */
interface MafiaGameData {
  players: { [userId: string]: MafiaPlayer };
  state: MafiaGameState;
  day: number;
  messages: { messageId: string, type: string }[];
  votingResults?: { [userId: string]: number };
  nightActions?: { [role: string]: string };
  silencedPlayer?: string;
  savedPlayer?: string;
  killedPlayer?: string;
  investigatedPlayer?: string;
  timer?: NodeJS.Timeout;
}

/**
 * مدیریت بازی مافیا
 */
async function handleMafiaGame(interaction: ButtonInteraction) {
  try {
    // بررسی اینکه آیا بازی در کانال فعلی در حال اجراست
    const existingGame = Array.from(activeGames.values()).find(
      game => game.gameType === 'mafia' && 
      game.channelId === interaction.channelId && 
      game.status === 'waiting'
    );
    
    if (existingGame) {
      return await interaction.reply({ 
        content: '❌ یک بازی مافیا در حال حاضر در این کانال در حال اجراست!', 
        ephemeral: true 
      });
    }
    
    // ایجاد بازی جدید
    const gameId = `mafia_${Date.now()}`;
    const gameData: MafiaGameData = {
      players: {},
      state: MafiaGameState.WAITING_FOR_PLAYERS,
      day: 0,
      messages: []
    };
    
    const newGame: GameSession = {
      id: gameId,
      gameType: 'mafia',
      channelId: interaction.channelId,
      createdBy: interaction.user.id,
      players: [],
      status: 'waiting',
      data: gameData
    };
    
    // ذخیره در لیست بازی‌ها
    activeGames.set(gameId, newGame);
    
    // ایجاد Embed برای نمایش اطلاعات بازی
    const embed = new EmbedBuilder()
      .setTitle('🕵️ بازی مافیا')
      .setDescription('به بازی مافیا خوش آمدید! در این بازی، شما در نقش‌های مختلف قرار می‌گیرید و باید با استفاده از مهارت‌های استراتژیک و اجتماعی خود، دشمنان را شناسایی کرده و از شهر محافظت کنید.')
      .setColor(0xFF5555)
      .addFields(
        { name: '👥 تعداد بازیکنان', value: '0/12', inline: true },
        { name: '⏱️ زمان هر روز', value: '5 دقیقه', inline: true },
        { name: '⏱️ زمان هر شب', value: '3 دقیقه', inline: true },
        { name: '👤 حداقل بازیکنان', value: '6 نفر', inline: true },
        { name: '🏆 جایزه بازی', value: 'برنده: 500 کوین', inline: true }
      )
      .setImage('https://img.icons8.com/color/452/mafia-game.png')
      .setFooter({ text: 'برای شرکت در بازی روی دکمه "ورود به بازی" کلیک کنید' });
    
    // دکمه‌های بازی
    const joinButton = new ButtonBuilder()
      .setCustomId('mafia_join')
      .setLabel('ورود به بازی')
      .setEmoji('🎮')
      .setStyle(ButtonStyle.Success);
    
    const startButton = new ButtonBuilder()
      .setCustomId('mafia_start')
      .setLabel('شروع بازی')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary);
      
    const rulesButton = new ButtonBuilder()
      .setCustomId('mafia_rules')
      .setLabel('قوانین بازی')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(joinButton, startButton, rulesButton);
    
    // ارسال پیام و ذخیره شناسه آن
    const response = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true
    });
    
    // ذخیره شناسه پیام در داده‌های بازی
    newGame.data.messageId = response.id;
    activeGames.set(gameId, newGame);
    
    // در صورت امکان، ذخیره در دیتابیس
    try {
      await storage.saveGameSession(newGame);
    } catch (dbError) {
      log(`Error saving mafia game to database: ${dbError}`, 'warn');
      // عدم ذخیره در دیتابیس، روند بازی را متوقف نمی‌کند
    }
    
  } catch (error) {
    log(`Error handling mafia game: ${error}`, 'error');
    await interaction.reply({ 
      content: '❌ خطایی در اجرای بازی مافیا رخ داد. لطفاً بعداً دوباره تلاش کنید.', 
      ephemeral: true 
    });
  }
}

/**
 * پیوستن به بازی مافیا
 */
async function joinMafiaGame(interaction: ButtonInteraction) {
  try {
    // پیدا کردن بازی فعال در کانال
    const gameSession = getActiveGameInChannel(interaction.channelId, 'mafia');
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی مافیا فعالی در این کانال یافت نشد!', ephemeral: true });
    }
    
    if (gameSession.status !== 'waiting') {
      return await interaction.reply({ content: '❌ بازی مافیا قبلاً شروع شده است و نمی‌توانید به آن بپیوندید!', ephemeral: true });
    }
    
    // بررسی اینکه کاربر قبلاً به بازی پیوسته باشد
    if (gameSession.players.includes(interaction.user.id)) {
      return await interaction.reply({ content: '❌ شما قبلاً به این بازی پیوسته‌اید!', ephemeral: true });
    }
    
    // بررسی محدودیت تعداد بازیکنان
    if (gameSession.players.length >= 10) {
      return await interaction.reply({ content: '❌ ظرفیت بازی تکمیل است!', ephemeral: true });
    }
    
    // افزودن کاربر به لیست بازیکنان
    gameSession.players.push(interaction.user.id);
    
    // آماده‌سازی بازیکن در اطلاعات بازی
    const newPlayer: MafiaPlayer = {
      userId: interaction.user.id,
      role: MafiaRole.CITIZEN, // نقش پیش‌فرض که بعداً تغییر خواهد کرد
      isAlive: true,
      isSilenced: false,
      hasUsedAbility: false
    };
    
    gameSession.data.players[interaction.user.id] = newPlayer;
    activeGames.set(gameSession.id, gameSession);
    
    // به‌روزرسانی Embed
    const message = await interaction.message.fetch();
    const embed = EmbedBuilder.from(message.embeds[0]);
    
    // به‌روزرسانی فیلد تعداد بازیکنان
    const playerField = embed.data.fields?.find(field => field.name === '👥 تعداد بازیکنان');
    if (playerField) {
      playerField.value = `${gameSession.players.length}/10`;
    }
    
    // افزودن لیست بازیکنان
    const playersList = gameSession.players.map(playerId => `<@${playerId}>`).join('\n');
    
    // بررسی اگر فیلد بازیکنان قبلاً وجود داشته باشد
    const existingPlayersListField = embed.data.fields?.find(field => field.name === '👤 بازیکنان');
    if (existingPlayersListField) {
      existingPlayersListField.value = playersList;
    } else {
      embed.addFields({ name: '👤 بازیکنان', value: playersList });
    }
    
    await interaction.update({ embeds: [embed] });
    
    // اطلاع‌رسانی به کاربر
    await interaction.followUp({
      content: '✅ شما با موفقیت به بازی مافیا پیوستید! نقش شما پس از شروع بازی به شما اعلام خواهد شد.',
      ephemeral: true
    });
    
  } catch (error) {
    log(`Error joining mafia game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در پیوستن به بازی مافیا رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * نمایش قوانین بازی مافیا
 */
async function showMafiaRules(interaction: ButtonInteraction) {
  try {
    // ساخت Embed قوانین بازی
    const rulesEmbed = new EmbedBuilder()
      .setTitle('📜 قوانین بازی مافیا')
      .setColor(0x2B2D31)
      .setDescription(
        '**بازی مافیا** یک بازی گروهی است که در آن بازیکنان به دو گروه اصلی تقسیم می‌شوند: **شهروندان** و **مافیا**. ' +
        'هدف شهروندان شناسایی و حذف تمام مافیاها و هدف مافیاها کشتن شهروندان تا رسیدن به اکثریت است.\n\n' +
        '**جریان بازی:**\n' +
        '1. بازی با مرحله **شب** شروع می‌شود که در آن مافیاها یک نفر را برای حذف انتخاب می‌کنند.\n' +
        '2. سپس مرحله **روز** می‌رسد که در آن بازیکنان بحث و تبادل نظر می‌کنند.\n' +
        '3. در پایان روز، بازیکنان **رأی‌گیری** می‌کنند تا یک نفر را حذف کنند.\n' +
        '4. این چرخه ادامه می‌یابد تا یکی از گروه‌ها برنده شود.\n\n' +
        '**نقش‌های موجود:**\n' +
        '• **شهروند:** هیچ قابلیت ویژه‌ای ندارد و فقط در رأی‌گیری شرکت می‌کند.\n' +
        '• **کارآگاه:** هر شب می‌تواند هویت یک بازیکن را بررسی کند.\n' +
        '• **دکتر:** هر شب می‌تواند یک نفر را از مرگ نجات دهد.\n' +
        '• **مافیا:** هر شب با همکاری سایر مافیاها یک نفر را می‌کشد.\n' +
        '• **رئیس مافیا:** مانند مافیا عمل می‌کند اما به کارآگاه به عنوان شهروند نشان داده می‌شود.\n' +
        '• **ساکت‌کننده:** می‌تواند هر شب یک نفر را از صحبت کردن در روز بعد منع کند.\n' +
        '• **تک‌تیرانداز:** یک بار در بازی می‌تواند یک نفر را حذف کند.\n\n' +
        '**شرایط پیروزی:**\n' +
        '• **شهروندان:** حذف تمام مافیاها\n' +
        '• **مافیاها:** رسیدن به تعداد مساوی یا بیشتر از شهروندان'
      )
      .setFooter({ text: 'برای بازگشت به منوی بازی، دکمه "بازگشت" را کلیک کنید.' });
    
    // دکمه بازگشت
    const backButton = new ButtonBuilder()
      .setCustomId('mafia_back_to_menu')
      .setLabel('بازگشت به منوی بازی')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(backButton);
    
    await interaction.reply({
      embeds: [rulesEmbed],
      components: [row],
      ephemeral: true
    });
    
  } catch (error) {
    log(`Error showing mafia rules: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در نمایش قوانین بازی مافیا رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * شروع بازی مافیا
 */
async function startMafiaGame(interaction: ButtonInteraction) {
  try {
    // پیدا کردن بازی فعال در کانال
    const gameSession = getActiveGameInChannel(interaction.channelId, 'mafia');
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی مافیا فعالی در این کانال یافت نشد!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر سازنده بازی است
    if (gameSession.createdBy !== interaction.user.id) {
      return await interaction.reply({ 
        content: '❌ فقط سازنده بازی می‌تواند بازی را شروع کند!', 
        ephemeral: true 
      });
    }
    
    // بررسی وضعیت بازی
    if (gameSession.status !== 'waiting') {
      return await interaction.reply({ 
        content: '❌ بازی قبلاً شروع شده است!', 
        ephemeral: true 
      });
    }
    
    // بررسی تعداد بازیکنان
    if (gameSession.players.length < 5) {
      return await interaction.reply({ 
        content: '❌ حداقل 5 بازیکن برای شروع بازی مافیا نیاز است!', 
        ephemeral: true 
      });
    }
    
    // شروع بازی
    gameSession.status = 'active';
    gameSession.startedAt = new Date();
    gameSession.data.state = MafiaGameState.ASSIGNING_ROLES;
    
    // به‌روزرسانی وضعیت در embeds
    const message = await interaction.message.fetch();
    const embed = EmbedBuilder.from(message.embeds[0]);
    
    // تغییر وضعیت بازی در Embed
    const statusField = embed.data.fields?.find(field => field.name === '⌛ وضعیت بازی');
    if (statusField) {
      statusField.value = 'در حال اجرا';
    } else {
      embed.addFields({ name: '⌛ وضعیت بازی', value: 'در حال اجرا', inline: true });
    }
    
    // به‌روزرسانی دکمه‌ها - حذف دکمه‌های پیوستن و شروع
    const disabledJoinButton = new ButtonBuilder()
      .setCustomId('mafia_join_disabled')
      .setLabel('ورود به بازی')
      .setEmoji('🎮')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true);
    
    const disabledStartButton = new ButtonBuilder()
      .setCustomId('mafia_start_disabled')
      .setLabel('بازی شروع شد')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);
    
    const rulesButton = new ButtonBuilder()
      .setCustomId('mafia_rules')
      .setLabel('قوانین بازی')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(disabledJoinButton, disabledStartButton, rulesButton);
    
    // به‌روزرسانی پیام اصلی
    await interaction.update({ 
      embeds: [embed],
      components: [row]
    });
    
    // اطلاع‌رسانی به کاربران
    await interaction.followUp({
      content: '🎮 بازی مافیا با موفقیت شروع شد! نقش‌ها در حال تخصیص به بازیکنان هستند...',
      ephemeral: false
    });
    
    // تخصیص نقش‌ها به بازیکنان
    await assignRolesToPlayers(gameSession);
    
    // شروع اولین شب
    setTimeout(() => {
      startNightPhase(gameSession, interaction);
    }, 5000); // 5 ثانیه تأخیر
    
  } catch (error) {
    log(`Error starting mafia game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در شروع بازی مافیا رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * تخصیص نقش‌ها به بازیکنان
 */
async function assignRolesToPlayers(gameSession: GameSession) {
  try {
    const playerCount = gameSession.players.length;
    
    // تعیین تعداد نقش‌های هر گروه بر اساس تعداد بازیکنان
    let mafiaCount = Math.floor(playerCount / 4) + (playerCount > 8 ? 1 : 0);
    let specialCitizenCount = Math.floor(playerCount / 3);
    
    // نقش‌های قابل تخصیص
    const mafiaRoles = [MafiaRole.MAFIA];
    if (playerCount >= 7) mafiaRoles.push(MafiaRole.GODFATHER);
    if (playerCount >= 9) mafiaRoles.push(MafiaRole.SILENCER);
    
    const citizenRoles = [MafiaRole.DETECTIVE, MafiaRole.DOCTOR];
    if (playerCount >= 6) citizenRoles.push(MafiaRole.SNIPER);
    if (playerCount >= 8) citizenRoles.push(MafiaRole.BODYGUARD);
    if (playerCount >= 10) citizenRoles.push(MafiaRole.PSYCHOLOGIST);
    
    // مخلوط کردن لیست بازیکنان
    const shuffledPlayers = shuffle(gameSession.players);
    
    // تخصیص نقش‌ها
    let assignedPlayers = 0;
    
    // تخصیص نقش‌های مافیا
    for (let i = 0; i < mafiaCount && i < mafiaRoles.length; i++) {
      gameSession.data.players[shuffledPlayers[assignedPlayers]].role = mafiaRoles[i];
      assignedPlayers++;
    }
    
    // اگر تعداد نقش‌های مافیا کمتر از تعداد مافیاها باشد، نقش مافیای ساده تخصیص می‌دهیم
    for (let i = mafiaRoles.length; i < mafiaCount; i++) {
      gameSession.data.players[shuffledPlayers[assignedPlayers]].role = MafiaRole.MAFIA;
      assignedPlayers++;
    }
    
    // تخصیص نقش‌های ویژه شهروندان
    for (let i = 0; i < specialCitizenCount && i < citizenRoles.length; i++) {
      gameSession.data.players[shuffledPlayers[assignedPlayers]].role = citizenRoles[i];
      assignedPlayers++;
    }
    
    // تخصیص نقش شهروند ساده به بقیه بازیکنان
    for (let i = assignedPlayers; i < shuffledPlayers.length; i++) {
      gameSession.data.players[shuffledPlayers[i]].role = MafiaRole.CITIZEN;
    }
    
    // ارسال پیام خصوصی به هر بازیکن با نقش او
    for (const playerId of gameSession.players) {
      const player = gameSession.data.players[playerId];
      const user = await interaction.client.users.fetch(playerId);
      
      const roleEmbed = new EmbedBuilder()
        .setTitle('🎭 نقش شما در بازی مافیا')
        .setColor(player.role.includes('mafia') || player.role === MafiaRole.GODFATHER || player.role === MafiaRole.SILENCER ? 0xDA373C : 0x5865F2)
        .setDescription(`شما در این بازی نقش **${getRoleTranslation(player.role)}** را دارید.\n\n${getRoleDescription(player.role)}`)
        .setFooter({ text: 'این پیام فقط برای شما قابل مشاهده است. آن را مخفی نگه دارید!' });
      
      try {
        await user.send({ embeds: [roleEmbed] });
      } catch (dmError) {
        log(`Failed to send DM to player ${playerId}: ${dmError}`, 'warn');
        // اگر امکان ارسال پیام خصوصی نبود، اطلاع‌رسانی در کانال
        const channel = await interaction.client.channels.fetch(gameSession.channelId);
        if (channel && channel.isTextBased()) {
          await channel.send({
            content: `<@${playerId}> ⚠️ امکان ارسال پیام خصوصی به شما وجود ندارد! لطفاً تنظیمات حریم خصوصی خود را بررسی کنید و DM خود را باز کنید تا بتوانیم نقش شما را ارسال کنیم.`,
          });
        }
      }
    }
    
    // ارسال لیست هم‌تیمی‌ها به مافیاها
    await sendTeamListToMafias(gameSession);
    
    // به‌روزرسانی وضعیت بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error assigning roles to players: ${error}`, 'error');
    throw error;
  }
}

/**
 * ارسال لیست هم‌تیمی‌ها به مافیاها
 */
async function sendTeamListToMafias(gameSession: GameSession) {
  try {
    // پیدا کردن تمام مافیاها
    const mafiaPlayers = gameSession.players.filter(playerId => {
      const role = gameSession.data.players[playerId].role;
      return role === MafiaRole.MAFIA || role === MafiaRole.GODFATHER || role === MafiaRole.SILENCER;
    });
    
    if (mafiaPlayers.length === 0) return;
    
    // ساخت لیست مافیاها با نقش‌های آنها
    let teamListText = '**لیست اعضای تیم مافیا:**\n';
    for (const mafiaId of mafiaPlayers) {
      const role = gameSession.data.players[mafiaId].role;
      const roleName = getRoleTranslation(role);
      teamListText += `• <@${mafiaId}> - ${roleName}\n`;
    }
    
    teamListText += '\nشما باید با همکاری یکدیگر در شب‌ها یکی از شهروندان را حذف کنید و در روز هویت خود را مخفی نگه دارید!';
    
    // ارسال پیام به هر مافیا
    for (const mafiaId of mafiaPlayers) {
      const mafiaUser = await interaction.client.users.fetch(mafiaId);
      
      const teamEmbed = new EmbedBuilder()
        .setTitle('👥 هم‌تیمی‌های شما در مافیا')
        .setColor(0xDA373C)
        .setDescription(teamListText)
        .setFooter({ text: 'این پیام محرمانه است و فقط برای اعضای تیم مافیا ارسال شده است.' });
      
      try {
        await mafiaUser.send({ embeds: [teamEmbed] });
      } catch (dmError) {
        log(`Failed to send mafia team list to ${mafiaId}: ${dmError}`, 'warn');
      }
    }
    
  } catch (error) {
    log(`Error sending team list to mafias: ${error}`, 'error');
  }
}

/**
 * ترجمه نام نقش به فارسی
 */
function getRoleTranslation(role: MafiaRole): string {
  switch (role) {
    case MafiaRole.CITIZEN: return 'شهروند';
    case MafiaRole.MAFIA: return 'مافیا';
    case MafiaRole.DETECTIVE: return 'کارآگاه';
    case MafiaRole.DOCTOR: return 'دکتر';
    case MafiaRole.SNIPER: return 'تک‌تیرانداز';
    case MafiaRole.GODFATHER: return 'رئیس مافیا';
    case MafiaRole.SILENCER: return 'ساکت‌کننده';
    case MafiaRole.BODYGUARD: return 'محافظ';
    case MafiaRole.PSYCHOLOGIST: return 'روانشناس';
    default: return 'نامشخص';
  }
}

/**
 * توضیحات نقش
 */
function getRoleDescription(role: MafiaRole): string {
  switch (role) {
    case MafiaRole.CITIZEN:
      return 'شما یک شهروند عادی هستید. وظیفه شما شناسایی و حذف مافیاها از طریق رأی‌گیری روزانه است. شما هیچ قابلیت ویژه‌ای ندارید.';
    
    case MafiaRole.MAFIA:
      return 'شما عضوی از گروه مافیا هستید. هر شب با همکاری سایر مافیاها یکی از شهروندان را حذف می‌کنید. در طول روز باید هویت خود را مخفی نگه دارید.';
    
    case MafiaRole.DETECTIVE:
      return 'شما کارآگاه هستید. هر شب می‌توانید هویت یک بازیکن را بررسی کنید و متوجه شوید که آیا او مافیا است یا خیر. اما مراقب باشید که رئیس مافیا به شما به عنوان شهروند نشان داده می‌شود!';
    
    case MafiaRole.DOCTOR:
      return 'شما دکتر هستید. هر شب می‌توانید یک بازیکن (از جمله خودتان) را انتخاب کنید تا از او محافظت کنید. اگر مافیاها همان بازیکن را انتخاب کنند، او زنده خواهد ماند.';
    
    case MafiaRole.SNIPER:
      return 'شما تک‌تیرانداز هستید. یک بار در طول بازی می‌توانید یک بازیکن را حذف کنید. اما اگر اشتباه کنید و یک شهروند را هدف قرار دهید، خودتان کشته می‌شوید!';
    
    case MafiaRole.GODFATHER:
      return 'شما رئیس مافیا هستید. مانند سایر مافیاها عمل می‌کنید، اما برای کارآگاه به عنوان شهروند شناسایی می‌شوید. این به شما اجازه می‌دهد که مخفی‌تر عمل کنید.';
    
    case MafiaRole.SILENCER:
      return 'شما ساکت‌کننده هستید و عضوی از گروه مافیا محسوب می‌شوید. هر شب علاوه بر مشارکت در تصمیم‌گیری گروهی مافیاها، می‌توانید یک بازیکن را انتخاب کنید تا در روز بعد نتواند صحبت کند.';
    
    case MafiaRole.BODYGUARD:
      return 'شما محافظ هستید. هر شب می‌توانید از یک بازیکن محافظت کنید. اگر آن بازیکن هدف حمله قرار گیرد، شما به جای او آسیب می‌بینید اما زنده می‌مانید. نمی‌توانید دو شب متوالی از یک بازیکن یکسان محافظت کنید.';
    
    case MafiaRole.PSYCHOLOGIST:
      return 'شما روانشناس هستید. هر شب می‌توانید یک بازیکن را انتخاب کنید تا در روز بعد امکان دو برابر رأی دادن داشته باشد. از این قابلیت برای تقویت شهروندان خوب استفاده کنید!';
    
    default:
      return 'توضیحاتی برای این نقش موجود نیست.';
  }
}

/**
 * شروع فاز شب بازی مافیا
 */
async function startNightPhase(gameSession: GameSession, interaction: ButtonInteraction) {
  try {
    // به‌روزرسانی وضعیت بازی
    gameSession.data.state = MafiaGameState.NIGHT_TIME;
    gameSession.data.day++;
    
    const channel = await interaction.client.channels.fetch(gameSession.channelId);
    if (!channel || !channel.isTextBased()) return;
    
    // اعلام شروع شب
    const nightEmbed = new EmbedBuilder()
      .setTitle(`🌙 شب ${gameSession.data.day} فرا رسید`)
      .setColor(0x2B2D31)
      .setDescription(
        'همه به خواب رفته‌اند و مافیاها در حال برنامه‌ریزی هستند...\n\n' +
        'هر بازیکن باید اقدامات خاص نقش خود را در پیام خصوصی انجام دهد. 2 دقیقه فرصت دارید!'
      )
      .setFooter({ text: 'پس از پایان شب، روز فرا می‌رسد و بحث و گفتگو آغاز می‌شود.' });
    
    const nightMessage = await channel.send({ embeds: [nightEmbed] });
    
    // ذخیره شناسه پیام شب
    gameSession.data.messages.push({ messageId: nightMessage.id, type: 'night_announcement' });
    
    // ارسال اقدامات شبانه به همه بازیکنان زنده
    await sendNightActionsToPlayers(gameSession, interaction);
    
    // تنظیم تایمر برای پایان شب
    gameSession.data.timer = setTimeout(() => {
      endNightPhase(gameSession, interaction);
    }, 120000); // 2 دقیقه
    
    // به‌روزرسانی وضعیت بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error starting night phase: ${error}`, 'error');
  }
}

/**
 * ارسال اقدامات شبانه به بازیکنان
 */
async function sendNightActionsToPlayers(gameSession: GameSession, interaction: ButtonInteraction) {
  // ارسال پیام به بازیکنان زنده بر اساس نقش
  for (const playerId of gameSession.players) {
    const player = gameSession.data.players[playerId];
    
    // فقط بازیکنان زنده می‌توانند اقدام شبانه انجام دهند
    if (!player.isAlive) continue;
    
    try {
      const user = await interaction.client.users.fetch(playerId);
      
      // بر اساس نقش، اقدام متفاوتی ارسال می‌شود
      switch (player.role) {
        case MafiaRole.MAFIA:
        case MafiaRole.GODFATHER:
        case MafiaRole.SILENCER:
          await sendMafiaNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.DETECTIVE:
          await sendDetectiveNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.DOCTOR:
          await sendDoctorNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.SNIPER:
          if (!player.hasUsedAbility) {
            await sendSniperNightAction(gameSession, user, player);
          }
          break;
          
        case MafiaRole.BODYGUARD:
          await sendBodyguardNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.PSYCHOLOGIST:
          await sendPsychologistNightAction(gameSession, user, player);
          break;
          
        case MafiaRole.CITIZEN:
          // شهروندان اقدام خاصی در شب ندارند
          await sendCitizenNightMessage(gameSession, user, player);
          break;
      }
      
    } catch (dmError) {
      log(`Failed to send night action to player ${playerId}: ${dmError}`, 'warn');
    }
  }
}

/**
 * ارسال اقدام شبانه به مافیاها
 */
async function sendMafiaNightAction(gameSession: GameSession, user: User, player: MafiaPlayer) {
  // لیست بازیکنان زنده که مافیا نیستند
  const targetOptions = gameSession.players
    .filter(targetId => {
      const targetPlayer = gameSession.data.players[targetId];
      const isMafia = targetPlayer.role === MafiaRole.MAFIA || 
                      targetPlayer.role === MafiaRole.GODFATHER || 
                      targetPlayer.role === MafiaRole.SILENCER;
      
      return targetPlayer.isAlive && !isMafia;
    });
  
  // ساخت Embed و دکمه‌ها
  const mafiaActionEmbed = new EmbedBuilder()
    .setTitle(`🌙 اقدام شبانه - شب ${gameSession.data.day}`)
    .setColor(0xDA373C)
    .setDescription(
      '**زمان تصمیم‌گیری مافیاها فرا رسیده است!**\n\n' +
      'شما و سایر اعضای مافیا باید یک نفر را برای حذف انتخاب کنید. تصمیم نهایی بر اساس بیشترین رأی خواهد بود.\n\n' +
      '**بازیکنان قابل انتخاب:**'
    );
  
  // اضافه کردن دکمه برای هر بازیکن قابل انتخاب
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();
  let buttonCount = 0;
  
  for (let i = 0; i < targetOptions.length; i++) {
    const targetId = targetOptions[i];
    const targetUser = await client.users.fetch(targetId);
    const targetUsername = targetUser?.username || targetId;
    
    // اضافه کردن نام بازیکن به توضیحات
    mafiaActionEmbed.setDescription(mafiaActionEmbed.data.description + `\n• ${targetUsername}`);
    
    // ساخت دکمه برای هر بازیکن
    const button = new ButtonBuilder()
      .setCustomId(`mafia_action_kill_${targetId}`)
      .setLabel(targetUsername.substring(0, 20)) // محدود کردن طول نام برای دکمه
      .setStyle(ButtonStyle.Danger);
    
    currentRow.addComponents(button);
    buttonCount++;
    
    // هر ردیف حداکثر 5 دکمه می‌تواند داشته باشد
    if (buttonCount === 5 || i === targetOptions.length - 1) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
      buttonCount = 0;
    }
  }
  
  // اگر بازیکن ساکت‌کننده باشد، دکمه‌های اضافی برای ساکت کردن اضافه می‌شود
  if (player.role === MafiaRole.SILENCER) {
    const silencerEmbed = new EmbedBuilder()
      .setTitle('🤐 انتخاب بازیکن برای ساکت کردن')
      .setColor(0xDA373C)
      .setDescription(
        'شما قابلیت ویژه‌ای دارید که می‌توانید یک بازیکن را برای روز بعد ساکت کنید.\n\n' +
        '**بازیکنان قابل انتخاب برای ساکت کردن:**'
      );
    
    // اضافه کردن دکمه‌های ساکت کردن
    const silenceRows: ActionRowBuilder<ButtonBuilder>[] = [];
    let silenceRow = new ActionRowBuilder<ButtonBuilder>();
    let silenceButtonCount = 0;
    
    for (let i = 0; i < targetOptions.length; i++) {
      const targetId = targetOptions[i];
      const targetUser = await client.users.fetch(targetId);
      const targetUsername = targetUser?.username || targetId;
      
      // اضافه کردن نام بازیکن به توضیحات
      silencerEmbed.setDescription(silencerEmbed.data.description + `\n• ${targetUsername}`);
      
      // ساخت دکمه برای هر بازیکن
      const button = new ButtonBuilder()
        .setCustomId(`mafia_action_silence_${targetId}`)
        .setLabel(targetUsername.substring(0, 20))
        .setStyle(ButtonStyle.Secondary);
      
      silenceRow.addComponents(button);
      silenceButtonCount++;
      
      // هر ردیف حداکثر 5 دکمه می‌تواند داشته باشد
      if (silenceButtonCount === 5 || i === targetOptions.length - 1) {
        silenceRows.push(silenceRow);
        silenceRow = new ActionRowBuilder<ButtonBuilder>();
        silenceButtonCount = 0;
      }
    }
    
    // ارسال پیام‌های جداگانه برای حذف و ساکت کردن
    await user.send({ embeds: [mafiaActionEmbed], components: rows });
    await user.send({ embeds: [silencerEmbed], components: silenceRows });
    
  } else {
    // ارسال پیام فقط برای حذف
    await user.send({ embeds: [mafiaActionEmbed], components: rows });
  }
}

/**
 * مدیریت بازی گرگینه
 */
async function handleWerewolfGame(interaction: ButtonInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🐺 گرگینه')
      .setDescription('این بازی به زودی در دسترس قرار خواهد گرفت. لطفاً صبور باشید!')
      .setColor(0xAA5555);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    log(`Error handling werewolf game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت بازی جاسوس مخفی
 */
async function handleSpyGame(interaction: ButtonInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🕵️‍♂️ جاسوس مخفی')
      .setDescription('این بازی به زودی در دسترس قرار خواهد گرفت. لطفاً صبور باشید!')
      .setColor(0x8855FF);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    log(`Error handling spy game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت رای بازیکنان در فاز رای‌گیری
 */
async function handleMafiaVote(interaction: ButtonInteraction) {
  try {
    const buttonId = interaction.customId;
    const targetId = buttonId.replace('mafia_vote_', '');
    
    // پیدا کردن بازی فعال
    const gameSession = Array.from(activeGames.values()).find(
      game => game.gameType === 'mafia' && 
      game.channelId === interaction.channelId && 
      game.status === 'active'
    );
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی فعالی یافت نشد!', ephemeral: true });
    }
    
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی وضعیت بازی
    if (mafiaData.state !== MafiaGameState.VOTING) {
      return await interaction.reply({ content: '❌ اکنون زمان رای‌گیری نیست!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر بازیکن است
    const player = Object.values(mafiaData.players).find(p => p.userId === interaction.user.id);
    
    if (!player) {
      return await interaction.reply({ content: '❌ شما بازیکن این بازی نیستید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا بازیکن زنده است
    if (!player.isAlive) {
      return await interaction.reply({ content: '❌ شما کشته شده‌اید و نمی‌توانید رای دهید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا هدف زنده است
    const targetPlayer = Object.values(mafiaData.players).find(p => p.userId === targetId);
    
    if (!targetPlayer || !targetPlayer.isAlive) {
      return await interaction.reply({ content: '❌ بازیکن مورد نظر در بازی حضور ندارد یا کشته شده است!', ephemeral: true });
    }
    
    // ثبت رای
    if (!mafiaData.votingResults) {
      mafiaData.votingResults = {};
    }
    
    mafiaData.votingResults[interaction.user.id] = targetId;
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
    await interaction.reply({ content: `✅ شما به **${targetPlayer.userId}** رای دادید.`, ephemeral: true });
    
  } catch (error) {
    log(`Error handling mafia vote: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در ثبت رای رخ داد. لطفاً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * مدیریت اقدامات شبانه بازیکنان
 */
async function handleMafiaNightAction(interaction: ButtonInteraction) {
  try {
    const buttonId = interaction.customId;
    const [_, action, role, targetId] = buttonId.split('_');
    
    // پیدا کردن بازی فعال
    const gameSession = Array.from(activeGames.values()).find(
      game => game.gameType === 'mafia' && 
      game.channelId === interaction.channelId && 
      game.status === 'active'
    );
    
    if (!gameSession) {
      return await interaction.reply({ content: '❌ بازی فعالی یافت نشد!', ephemeral: true });
    }
    
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی وضعیت بازی
    if (mafiaData.state !== MafiaGameState.NIGHT_TIME) {
      return await interaction.reply({ content: '❌ اکنون زمان شب نیست!', ephemeral: true });
    }
    
    // بررسی اینکه آیا کاربر بازیکن است
    const player = Object.values(mafiaData.players).find(p => p.userId === interaction.user.id);
    
    if (!player) {
      return await interaction.reply({ content: '❌ شما بازیکن این بازی نیستید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا بازیکن زنده است
    if (!player.isAlive) {
      return await interaction.reply({ content: '❌ شما کشته شده‌اید و نمی‌توانید اقدامی انجام دهید!', ephemeral: true });
    }
    
    // بررسی نقش کاربر
    if (role === 'mafia' && ![MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(player.role)) {
      return await interaction.reply({ content: '❌ شما مافیا نیستید!', ephemeral: true });
    } else if (role === 'detective' && player.role !== MafiaRole.DETECTIVE) {
      return await interaction.reply({ content: '❌ شما کارآگاه نیستید!', ephemeral: true });
    } else if (role === 'doctor' && player.role !== MafiaRole.DOCTOR) {
      return await interaction.reply({ content: '❌ شما دکتر نیستید!', ephemeral: true });
    } else if (role === 'silencer' && player.role !== MafiaRole.SILENCER) {
      return await interaction.reply({ content: '❌ شما ساکت‌کننده نیستید!', ephemeral: true });
    } else if (role === 'sniper' && player.role !== MafiaRole.SNIPER) {
      return await interaction.reply({ content: '❌ شما تک‌تیرانداز نیستید!', ephemeral: true });
    } else if (role === 'bodyguard' && player.role !== MafiaRole.BODYGUARD) {
      return await interaction.reply({ content: '❌ شما محافظ نیستید!', ephemeral: true });
    } else if (role === 'psychologist' && player.role !== MafiaRole.PSYCHOLOGIST) {
      return await interaction.reply({ content: '❌ شما روانشناس نیستید!', ephemeral: true });
    }
    
    // بررسی اینکه آیا هدف زنده است
    const targetPlayer = Object.values(mafiaData.players).find(p => p.userId === targetId);
    
    if (!targetPlayer || !targetPlayer.isAlive) {
      return await interaction.reply({ content: '❌ بازیکن مورد نظر در بازی حضور ندارد یا کشته شده است!', ephemeral: true });
    }
    
    // برای مافیا، تصمیم جمعی است
    if ([MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(player.role) && role === 'mafia') {
      // پیدا کردن سایر مافیاها برای اطلاع‌رسانی
      const mafiaPlayers = Object.values(mafiaData.players).filter(p => 
        p.isAlive && 
        [MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(p.role)
      );
      
      // ثبت هدف مافیا
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.MAFIA] = targetId;
      
      // اطلاع به سایر مافیاها
      for (const mafiaPlayer of mafiaPlayers) {
        if (mafiaPlayer.userId !== interaction.user.id) {
          try {
            const mafiaUser = await client.users.fetch(mafiaPlayer.userId);
            if (mafiaUser) {
              await mafiaUser.send(`🔪 هم‌تیمی شما تصمیم گرفت **${targetPlayer.userId}** را امشب به قتل برساند.`);
            }
          } catch (dmError) {
            log(`Failed to send DM to mafia player: ${dmError}`, 'warn');
          }
        }
      }
      
      await interaction.reply({ content: `✅ شما تصمیم گرفتید **${targetPlayer.userId}** را به قتل برسانید.`, ephemeral: true });
    }
    // ساکت‌کننده
    else if (player.role === MafiaRole.SILENCER && role === 'silencer') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.SILENCER] = targetId;
      
      await interaction.reply({ content: `✅ شما تصمیم گرفتید **${targetPlayer.userId}** را فردا ساکت کنید.`, ephemeral: true });
    }
    // کارآگاه
    else if (player.role === MafiaRole.DETECTIVE && role === 'detective') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.DETECTIVE] = targetId;
      
      // بررسی نقش هدف
      let isMafia = false;
      
      if (targetPlayer.role === MafiaRole.MAFIA || targetPlayer.role === MafiaRole.SILENCER) {
        isMafia = true;
      } else if (targetPlayer.role === MafiaRole.GODFATHER) {
        // پدرخوانده به عنوان شهروند نمایش داده می‌شود
        isMafia = false;
      }
      
      await interaction.reply({ 
        content: `🔍 استعلام شما: **${targetPlayer.userId}** ${isMafia ? '**مافیا**' : '**شهروند**'} است.`, 
        ephemeral: true 
      });
    }
    // دکتر
    else if (player.role === MafiaRole.DOCTOR && role === 'doctor') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.DOCTOR] = targetId;
      
      await interaction.reply({ content: `💉 شما تصمیم گرفتید از **${targetPlayer.userId}** محافظت کنید.`, ephemeral: true });
    }
    // تک‌تیرانداز
    else if (player.role === MafiaRole.SNIPER && role === 'sniper') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.SNIPER] = targetId;
      
      await interaction.reply({ content: `🔫 شما به **${targetPlayer.userId}** شلیک کردید.`, ephemeral: true });
    }
    // محافظ
    else if (player.role === MafiaRole.BODYGUARD && role === 'bodyguard') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.BODYGUARD] = targetId;
      
      await interaction.reply({ content: `🛡️ شما تصمیم گرفتید از **${targetPlayer.userId}** محافظت کنید.`, ephemeral: true });
    }
    // روانشناس
    else if (player.role === MafiaRole.PSYCHOLOGIST && role === 'psychologist') {
      if (!mafiaData.nightActions) mafiaData.nightActions = {};
      mafiaData.nightActions[MafiaRole.PSYCHOLOGIST] = targetId;
      
      await interaction.reply({ content: `🧠 شما تصمیم گرفتید **${targetPlayer.userId}** را تحت مشاوره قرار دهید.`, ephemeral: true });
    }
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error handling mafia night action: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در ثبت اقدام شبانه رخ داد. لطفاً دوباره تلاش کنید.', ephemeral: true });
  }
}

/**
 * پایان فاز شب بازی مافیا
 */
async function endNightPhase(gameSession: GameSession) {
  try {
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی اینکه آیا بازی پایان یافته است یا خیر
    if (mafiaData.state === MafiaGameState.GAME_OVER) return;
    
    // پردازش اقدامات شبانه
    const nightActions = mafiaData.nightActions || {};
    
    // کسی که توسط مافیا کشته می‌شود
    let killedPlayerId = nightActions[MafiaRole.MAFIA];
    
    // کسی که توسط دکتر نجات پیدا می‌کند
    const savedPlayerId = nightActions[MafiaRole.DOCTOR];
    
    // اگر دکتر، فرد مورد هدف مافیا را نجات داده باشد
    if (savedPlayerId && savedPlayerId === killedPlayerId) {
      killedPlayerId = undefined; // هیچکس کشته نمی‌شود
    }
    
    // اگر بادیگارد، فرد مورد هدف مافیا را محافظت کرده باشد
    if (nightActions[MafiaRole.BODYGUARD] && nightActions[MafiaRole.BODYGUARD] === killedPlayerId) {
      killedPlayerId = undefined; // هیچکس کشته نمی‌شود
    }
    
    // اگر مافیا پدرخوانده را هدف قرار داده باشد، تیر کارآگاه خنثی می‌شود
    if (killedPlayerId) {
      const killedPlayerRole = Object.values(mafiaData.players).find(p => p.userId === killedPlayerId)?.role;
      if (killedPlayerRole === MafiaRole.GODFATHER) {
        // تیر کارآگاه خنثی می‌شود
        nightActions[MafiaRole.DETECTIVE] = undefined;
      }
    }
    
    // تک‌تیرانداز آیا شلیک کرده؟
    if (nightActions[MafiaRole.SNIPER]) {
      const sniperTarget = nightActions[MafiaRole.SNIPER];
      const targetPlayer = Object.values(mafiaData.players).find(p => p.userId === sniperTarget);
      
      // اگر تک‌تیرانداز به غیرمافیا شلیک کرده باشد
      if (targetPlayer && 
          targetPlayer.role !== MafiaRole.MAFIA && 
          targetPlayer.role !== MafiaRole.GODFATHER && 
          targetPlayer.role !== MafiaRole.SILENCER) {
        
        // پیدا کردن کاربر تک‌تیرانداز
        const sniperPlayer = Object.values(mafiaData.players).find(p => p.role === MafiaRole.SNIPER);
        if (sniperPlayer) {
          sniperPlayer.isAlive = false; // تک‌تیرانداز کشته می‌شود
        }
      } else if (targetPlayer) {
        // اگر مافیا را هدف قرار داده باشد
        targetPlayer.isAlive = false;
      }
    }
    
    // اعمال کشته‌شدن
    if (killedPlayerId) {
      const killedPlayer = Object.values(mafiaData.players).find(p => p.userId === killedPlayerId);
      if (killedPlayer) {
        killedPlayer.isAlive = false;
        mafiaData.killedPlayer = killedPlayerId;
      }
    }
    
    // ساکت‌کننده چه کسی را ساکت کرده؟
    if (nightActions[MafiaRole.SILENCER]) {
      const silencedPlayerId = nightActions[MafiaRole.SILENCER];
      const silencedPlayer = Object.values(mafiaData.players).find(p => p.userId === silencedPlayerId);
      if (silencedPlayer) {
        silencedPlayer.isSilenced = true;
        mafiaData.silencedPlayer = silencedPlayerId;
      }
    }
    
    // بررسی وضعیت پایان بازی
    const aliveCitizens = Object.values(mafiaData.players).filter(p => 
      p.isAlive && 
      [MafiaRole.CITIZEN, MafiaRole.DETECTIVE, MafiaRole.DOCTOR, MafiaRole.SNIPER, MafiaRole.BODYGUARD, MafiaRole.PSYCHOLOGIST].includes(p.role)
    );
    
    const aliveMafias = Object.values(mafiaData.players).filter(p => 
      p.isAlive && 
      [MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(p.role)
    );
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
    // بررسی پایان بازی
    if (aliveMafias.length === 0) {
      // شهروندان برنده شدند
      return await startDayTimeResults(gameSession, true);
    } else if (aliveMafias.length >= aliveCitizens.length) {
      // مافیا برنده شد
      return await startDayTimeResults(gameSession, false);
    } else {
      // بازی ادامه دارد - شروع روز
      return await startDayTimeResults(gameSession);
    }
    
  } catch (error) {
    log(`Error ending night phase: ${error}`, 'error');
  }
}

/**
 * نمایش نتایج شب و شروع روز جدید
 */
async function startDayTimeResults(gameSession: GameSession, isGameOver: boolean = false) {
  try {
    const mafiaData = gameSession.data as MafiaGameData;
    
    // دریافت کانال
    const channel = await client.channels.fetch(gameSession.channelId) as TextChannel;
    if (!channel) return;
    
    if (isGameOver === true) {
      // شهروندان برنده شدند
      mafiaData.state = MafiaGameState.GAME_OVER;
      
      const embed = new EmbedBuilder()
        .setTitle('🏆 شهروندان پیروز شدند!')
        .setDescription('تمام مافیاها کشته شدند و شهر نجات پیدا کرد.')
        .setColor(0x00FF00)
        .addFields({ 
          name: '👤 نقش‌های بازیکنان', 
          value: Object.values(mafiaData.players).map(p => 
            `<@${p.userId}>: ${getRoleTranslation(p.role)}`
          ).join('\n')
        });
      
      await channel.send({ embeds: [embed] });
      return;
      
    } else if (isGameOver === false) {
      // مافیا برنده شد
      mafiaData.state = MafiaGameState.GAME_OVER;
      
      const embed = new EmbedBuilder()
        .setTitle('👺 مافیا پیروز شد!')
        .setDescription('تعداد مافیا با شهروندان برابر شده و شهر به تسخیر مافیا درآمده است.')
        .setColor(0xFF0000)
        .addFields({ 
          name: '👤 نقش‌های بازیکنان', 
          value: Object.values(mafiaData.players).map(p => 
            `<@${p.userId}>: ${getRoleTranslation(p.role)}`
          ).join('\n')
        });
      
      await channel.send({ embeds: [embed] });
      return;
    }
    
    // تغییر وضعیت بازی به روز
    mafiaData.state = MafiaGameState.DAY_TIME;
    
    // تهیه پیام نتایج شب
    const embed = new EmbedBuilder()
      .setTitle(`☀️ روز ${mafiaData.day} فرا رسید`)
      .setColor(0x3366CC);
    
    let dayResultMessage = '';
    
    // نتیجه کشته‌شدن
    if (mafiaData.killedPlayer) {
      const killedPlayer = Object.values(mafiaData.players).find(p => p.userId === mafiaData.killedPlayer);
      if (killedPlayer) {
        dayResultMessage += `🔪 **<@${killedPlayer.userId}>** شب گذشته توسط مافیا کشته شد. او یک **${getRoleTranslation(killedPlayer.role)}** بود.\n\n`;
      }
    } else {
      dayResultMessage += '🕊️ **دیشب کسی کشته نشد.**\n\n';
    }
    
    // اعلام ساکت‌شدن بازیکن
    if (mafiaData.silencedPlayer) {
      dayResultMessage += `🤐 **<@${mafiaData.silencedPlayer}>** توسط ساکت‌کننده، قادر به صحبت کردن نیست!\n\n`;
    }
    
    // لیست بازیکنان زنده
    const alivePlayers = Object.values(mafiaData.players).filter(p => p.isAlive);
    dayResultMessage += `👥 **بازیکنان زنده (${alivePlayers.length})**: \n${alivePlayers.map(p => `<@${p.userId}>`).join(', ')}\n\n`;
    
    // زمان بحث و گفتگو
    dayResultMessage += `⏱️ **زمان بحث و رای‌گیری**: \nاکنون بازیکنان می‌توانند درباره هویت مافیاها صحبت کنند و سپس رای‌گیری انجام خواهد شد.`;
    
    embed.setDescription(dayResultMessage);
    
    await channel.send({ embeds: [embed] });
    
    // زمان بحث - 2 دقیقه
    if (mafiaData.timer) clearTimeout(mafiaData.timer);
    mafiaData.timer = setTimeout(() => startVotingPhase(gameSession), 120000); // 2 دقیقه
    
    // پاک‌سازی داده‌های شب
    mafiaData.nightActions = {};
    mafiaData.killedPlayer = undefined;
    
    // پاک‌سازی وضعیت ساکت‌شدن از شب قبلی
    Object.values(mafiaData.players).forEach(player => {
      player.isSilenced = false;
    });
    
    mafiaData.silencedPlayer = undefined;
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error starting day phase: ${error}`, 'error');
  }
}

/**
 * شروع مرحله رای‌گیری
 */
async function startVotingPhase(gameSession: GameSession) {
  try {
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی وضعیت بازی
    if (mafiaData.state !== MafiaGameState.DAY_TIME) return;
    
    mafiaData.state = MafiaGameState.VOTING;
    mafiaData.votingResults = {};
    
    // دریافت کانال
    const channel = await client.channels.fetch(gameSession.channelId) as TextChannel;
    if (!channel) return;
    
    // لیست بازیکنان زنده
    const alivePlayers = Object.values(mafiaData.players).filter(p => p.isAlive);
    
    // ساخت دکمه‌های رای‌گیری
    const embed = new EmbedBuilder()
      .setTitle('🗳️ زمان رای‌گیری فرا رسیده است')
      .setDescription('به فردی که فکر می‌کنید مافیاست رای دهید. فردی که بیشترین رای را بیاورد، اعدام خواهد شد.')
      .setColor(0xFFA500);
    
    // ایجاد دکمه‌ها - حداکثر 5 دکمه در هر سطر
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    let currentRow = new ActionRowBuilder<ButtonBuilder>();
    let buttonCount = 0;
    
    for (const player of alivePlayers) {
      const button = new ButtonBuilder()
        .setCustomId(`mafia_vote_${player.userId}`)
        .setLabel(`${player.userId.substring(0, 6)}`)
        .setStyle(ButtonStyle.Primary);
      
      currentRow.addComponents(button);
      buttonCount++;
      
      if (buttonCount % 5 === 0 || buttonCount === alivePlayers.length) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder<ButtonBuilder>();
      }
    }
    
    // ارسال پیام رای‌گیری
    await channel.send({ 
      embeds: [embed],
      components: rows
    });
    
    // تنظیم تایمر برای پایان رای‌گیری
    if (mafiaData.timer) clearTimeout(mafiaData.timer);
    mafiaData.timer = setTimeout(() => endVotingPhase(gameSession), 60000); // 1 دقیقه
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error starting voting phase: ${error}`, 'error');
  }
}

/**
 * پایان مرحله رای‌گیری و اعلام نتیجه
 */
async function endVotingPhase(gameSession: GameSession) {
  try {
    const mafiaData = gameSession.data as MafiaGameData;
    
    // بررسی وضعیت بازی
    if (mafiaData.state !== MafiaGameState.VOTING) return;
    
    const votingResults = mafiaData.votingResults || {};
    
    // شمارش آرا
    const voteCount: Record<string, number> = {};
    
    for (const voterId in votingResults) {
      const targetId = votingResults[voterId];
      voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    }
    
    // پیدا کردن فرد با بیشترین رای
    let maxVotes = 0;
    let executedPlayerId: string | undefined = undefined;
    
    for (const playerId in voteCount) {
      if (voteCount[playerId] > maxVotes) {
        maxVotes = voteCount[playerId];
        executedPlayerId = playerId;
      }
    }
    
    // دریافت کانال
    const channel = await client.channels.fetch(gameSession.channelId) as TextChannel;
    if (!channel) return;
    
    // اگر هیچ رایی نبود یا رای‌ها مساوی بود
    if (!executedPlayerId || maxVotes === 0) {
      const embed = new EmbedBuilder()
        .setTitle('🤔 رای‌گیری بی‌نتیجه بود')
        .setDescription('امروز کسی اعدام نشد. شب دوباره فرا می‌رسد...')
        .setColor(0xAAAAAA);
      
      await channel.send({ embeds: [embed] });
      
      // شروع فاز شب
      setTimeout(() => startNightPhase(gameSession, null), 5000);
      return;
    }
    
    // اعدام بازیکن
    const executedPlayer = Object.values(mafiaData.players).find(p => p.userId === executedPlayerId);
    
    if (executedPlayer) {
      executedPlayer.isAlive = false;
      
      const embed = new EmbedBuilder()
        .setTitle('⚖️ مردم شهر رای خود را دادند')
        .setDescription(`**<@${executedPlayer.userId}>** با **${maxVotes}** رای اعدام شد!\nاو یک **${getRoleTranslation(executedPlayer.role)}** بود.`)
        .setColor(0xFF6600);
      
      // نمایش نتایج رای‌ها
      let voteDetails = '';
      for (const playerId in voteCount) {
        voteDetails += `<@${playerId}>: ${voteCount[playerId]} رای\n`;
      }
      
      if (voteDetails) {
        embed.addFields({ name: '📊 نتایج رای‌گیری', value: voteDetails });
      }
      
      await channel.send({ embeds: [embed] });
      
      // بررسی وضعیت پایان بازی
      const aliveCitizens = Object.values(mafiaData.players).filter(p => 
        p.isAlive && 
        [MafiaRole.CITIZEN, MafiaRole.DETECTIVE, MafiaRole.DOCTOR, MafiaRole.SNIPER, MafiaRole.BODYGUARD, MafiaRole.PSYCHOLOGIST].includes(p.role)
      );
      
      const aliveMafias = Object.values(mafiaData.players).filter(p => 
        p.isAlive && 
        [MafiaRole.MAFIA, MafiaRole.GODFATHER, MafiaRole.SILENCER].includes(p.role)
      );
      
      if (aliveMafias.length === 0) {
        // شهروندان برنده شدند
        return await startDayTimeResults(gameSession, true);
      } else if (aliveMafias.length >= aliveCitizens.length) {
        // مافیا برنده شد
        return await startDayTimeResults(gameSession, false);
      }
    }
    
    // شروع فاز شب
    setTimeout(() => startNightPhase(gameSession, null), 5000); // 5 ثانیه تاخیر
    
    // ذخیره بازی
    activeGames.set(gameSession.id, gameSession);
    
  } catch (error) {
    log(`Error ending voting phase: ${error}`, 'error');
  }
}