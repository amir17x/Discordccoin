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
  ModalSubmitInteraction
} from 'discord.js';
import { storage } from '../../storage';
import { log } from '../../vite';
import { IUser as User } from '../../models/User';
// Create utils functions locally since we can't find the utils module
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
    
    // بررسی نوع بازی انتخاب شده
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
 * مدیریت بازی مافیا
 */
async function handleMafiaGame(interaction: ButtonInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🕵️ مافیا')
      .setDescription('این بازی به زودی در دسترس قرار خواهد گرفت. لطفاً صبور باشید!')
      .setColor(0xFF5555);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    log(`Error handling mafia game: ${error}`, 'error');
    await interaction.reply({ content: '❌ خطایی در اجرای بازی رخ داد. لطفاً بعداً دوباره تلاش کنید.', ephemeral: true });
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