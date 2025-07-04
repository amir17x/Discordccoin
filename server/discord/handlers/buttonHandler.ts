import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuInteraction, ModalActionRowComponentBuilder } from 'discord.js';
import { storage } from '../../storage';
import { Transaction } from '@shared/schema';
import { mainMenu } from '../components/mainMenu';
import { economyMenu, transferUser } from '../components/economyMenu';
import { economicStatusMenu, economicStatusDetail } from '../components/economicStatusMenu';
import { bankUpgradeMenu, processBankAccountUpgrade } from '../components/bankUpgradeMenu';
import { gamesMenu } from '../components/gamesMenu';
import { shopMenu } from '../components/shopMenu';
import { inventoryMenu } from '../components/inventoryMenu';
import { questsMenu } from '../components/questsMenu';
import { clansMenu } from '../components/clansMenu';
import { profileMenu } from '../components/profileMenu';
import { wheelOfFortuneMenu, spinWheel } from '../components/wheelOfFortuneMenu';
import { robberyMenu, selectRobberyTarget, handleRobbery } from '../components/robberyMenu';
import { adminMenu } from '../components/adminMenu';
import { achievementsMenu, showCategoryAchievements, showEarnedAchievements, showProgressAchievements } from '../components/achievementsMenu';
import { getLogger } from '../utils/logger';
import { 
  handleGroupGamesButton, 
  handleQuizQuestionModalSubmit, 
  handleQuizAnswer,
  handleMafiaGame,
  showActiveSessionsMenu
} from '../components/groupGames';
import { handleBingoInteraction } from '../components/bingoGame';
import {
  startDuel,
  acceptDuel,
  declineDuel,
  performAttack,
  performDefense,
  surrenderDuel,
  showItemsMenu,
  cancelItemsMenu
} from '../components/duelGame';
import { 
  createMafiaGame, 
  joinMafiaGame, 
  showMafiaRules, 
  backToMafiaMenu, 
  cancelMafiaGame, 
  startMafiaGame, 
  dayVoting as mafiaVoting, 
  votePlayer as mafiaVotePlayer, 
  mafiaKill, 
  killTarget, 
  detectiveCheck, 
  checkTarget, 
  doctorSave, 
  saveTarget 
} from '../components/mafiaGame';
import {
  createWerewolfGame,
  joinWerewolfGame,
  showWerewolfRules,
  backToWerewolfMenu,
  cancelWerewolfGame,
  startWerewolfGame,
  werewolfDayVoting,
  werewolfVotePlayer,
  handleSeerCheck,
  handleDoctorSave,
  handleBodyguardProtect,
  handleWerewolfKill
} from '../components/werewolfGame';
import { handleSwitchAIService, handleTestAIService, handleViewAIStatus } from './aiHandlers';
import { showAISettingsMenu, handleModelSelect, handleStyleSelect, handleTestAI, handleResetAI, handleAIHelp } from '../components/aiSettingsMenu';
import { loanMenu, handleLoanRequest, handleLoanConfirmation, handleLoanApproval, handleLoanStatus, handleLoanRepayment, handleLoanCalculator, handleLoanHistory } from '../components/bankMenu/loanMenu';
import { bankUpgradeMenu, processBankAccountUpgrade } from '../components/bankUpgradeMenu';
import { 
  itemManagementMenu,
  questManagementMenu,
  clanManagementMenu,
  broadcastMenu,
  backupMenu,
  botSettingsMenu,
  botStatsMenu,
  generalSettingsMenu,
  economySettingsMenu,
  gamesSettingsMenu,
  clansSettingsMenu,
  levelsSettingsMenu,
  securitySettingsMenu,
  permissionsSettingsMenu,
  aiSettingsMenuLegacy,
  loggingSettingsMenu
} from '../components/adminMenuExtended';
import { investmentMenu, processInvestment } from '../components/investmentMenu';
import { stocksMenu, processBuyStock, processSellStock, processStockAnalysis } from '../components/stocksMenu';
import { lotteryMenu, processBuyLotteryTicket } from '../components/lotteryMenu';
import { giveawayBridgeMenu, buyGiveawayTickets, checkGiveawayBalance } from '../components/giveawayBridge';
import { tournamentsMenu, processJoinTournament } from '../components/tournamentsMenu';
import { seasonsMenu } from '../components/seasonsMenu';
import { parallelWorldsMenu } from '../components/parallelWorldsMenu';
import { petMenu, buyNewPet, feedPet, playWithPet, activatePet, renamePetModal } from '../components/petMenu';
import { friendsMainMenu, friendsList, friendRequests } from '../components/friendsMenu/friendsMainMenu';
import { showFriendshipDetails } from '../components/friendsMenu/friendshipLevelMenu';
import { blockedUsersList, searchUserToBlock, unblockUser, processUnblockUser, cancelUnblockProcess } from '../components/friendsMenu/blockedUsersMenu';
import { showFriendRequestForm, searchUserForFriendRequest, sendFriendRequest } from '../components/friendsMenu/friendRequestForm';
import { AnonymousChatMenu } from '../components/anonymousChatMenu/anonymousChatMenu';
import { personalNotificationsMenu, toggleNotifications, showAdvancedNotificationSettings, toggleNotificationType, sendTestNotification } from '../components/personalNotificationsMenu';
import { showMarketMenu, showRegularMarket, showBlackMarket, showMyListings, startNewListing, buyItem } from '../components/marketMenu';

import { handleCoinFlip } from '../games/coinFlip';
import { handleRockPaperScissors } from '../games/rockPaperScissors';
import { handleNumberGuess } from '../games/numberGuess';
import { handleDiceDuel } from '../games/diceDuel';
import { handleQuickPoker } from '../games/quickPoker';
import { handleTypeRace } from '../games/typeRace';
import { handleDart } from '../games/dart';
import { handleBomb } from '../games/bomb';
import { handlePenalty } from '../games/penalty';
import { handleArchery } from '../games/archery';
import { handleQuiz } from '../games/quiz';
import { showMatchmakingMenu, startRandomMatchmaking, showInviteOpponentMenu, cancelMatchmaking } from '../games/matchmaking';
import { log } from '../utils/logger';
import { botConfig } from '../utils/config';
import { helpMenu } from '../components/helpMenu';

/**
 * نمایش مودال فرم بازخورد
 * @param interaction تعامل دکمه 
 */
async function showFeedbackModal(interaction: ButtonInteraction) {
  try {
    // ایجاد مودال فرم بازخورد
    const modal = new ModalBuilder()
      .setCustomId('feedback_modal')
      .setTitle('💬 ارسال بازخورد به توسعه‌دهندگان');
    
    // ورودی متنی عنوان بازخورد
    const titleInput = new TextInputBuilder()
      .setCustomId('feedback_title')
      .setLabel('موضوع بازخورد')
      .setPlaceholder('مثال: پیشنهاد برای بهبود بازی سنگ کاغذ قیچی')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(50);
    
    // ورودی متنی توضیحات بازخورد
    const descriptionInput = new TextInputBuilder()
      .setCustomId('feedback_description')
      .setLabel('توضیحات بازخورد')
      .setPlaceholder('لطفاً بازخورد، پیشنهاد یا گزارش مشکل خود را با جزئیات وارد کنید')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(1000);
    
    // ورودی متنی اطلاعات تماس (اختیاری)
    const contactInput = new TextInputBuilder()
      .setCustomId('feedback_contact')
      .setLabel('اطلاعات تماس (اختیاری)')
      .setPlaceholder('ایمیل یا هر راه ارتباطی دیگر برای پیگیری')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(100);
    
    // اضافه کردن فیلدها به مودال
    const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    const descriptionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
    const contactRow = new ActionRowBuilder<TextInputBuilder>().addComponents(contactInput);
    
    modal.addComponents(titleRow, descriptionRow, contactRow);
    
    // نمایش مودال به کاربر
    await interaction.showModal(modal);
    
  } catch (error) {
    console.error('Error showing feedback modal:', error);
    await interaction.reply({
      content: '❌ متأسفانه در نمایش فرم بازخورد خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// زمان انتظار دزدی - تعریف شده در robberyMenu.ts
const ROB_COOLDOWN = 4 * 60 * 60 * 1000; // 4 ساعت

// Button handler function
// Handler for investment history
async function handleInvestmentHistory(interaction: ButtonInteraction) {
  try {
    // وارد کردن توابع فرمت‌کننده از فایل formatters
    const { formatNumber, formatDate, timeAgo } = require('../utils/formatters');
    
    // برای اطمینان از عدم تایم‌اوت، یک پاسخ با تاخیر ارسال می‌کنیم
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }
    
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      const message = '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    // بررسی سرمایه‌گذاری‌های کاربر
    const investments = user.investments || [];
    
    if (investments.length === 0) {
      const message = '📈 شما هیچ سرمایه‌گذاری فعالی ندارید. می‌توانید از منوی سرمایه‌گذاری، پول خود را سرمایه‌گذاری کنید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      
      // بعد از مدت کوتاهی، منوی سرمایه‌گذاری را نمایش می‌دهیم
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await investmentMenu(interaction, true);
        }
      }, 2000);
      
      return;
    }
    
    // محاسبه کل مبلغ سرمایه‌گذاری‌ها
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalReturns = investments.reduce((sum, inv) => sum + (inv.expectedReturn - inv.amount), 0);
    
    // ایجاد امبد برای نمایش تاریخچه سرمایه‌گذاری‌ها با طراحی بهبود یافته
    const embed = new EmbedBuilder()
      .setColor('#9370DB')
      .setTitle('💼 پورتفولیو سرمایه‌گذاری‌های شما')
      .setDescription(`شما در حال حاضر **${investments.length}** سرمایه‌گذاری فعال دارید.`)
      .setThumbnail('https://img.icons8.com/fluency/48/investment-portfolio.png')
      .addFields(
        { name: '💰 کل سرمایه‌گذاری', value: `${formatNumber(totalInvested)} Ccoin`, inline: true },
        { name: '📈 سود پیش‌بینی شده', value: `${formatNumber(totalReturns)} Ccoin`, inline: true },
        { name: '📊 بازدهی کلی', value: `${Math.round((totalReturns / totalInvested) * 100)}%`, inline: true }
      )
      .setFooter({ text: 'Ccoin Investment System', iconURL: interaction.client.user?.displayAvatarURL() })
      .setTimestamp();
    
    // دسته‌بندی سرمایه‌گذاری‌ها براساس نوع ریسک
    const investmentsByRisk = {
      low_risk: investments.filter(inv => inv.type === 'low_risk'),
      medium_risk: investments.filter(inv => inv.type === 'medium_risk'),
      high_risk: investments.filter(inv => inv.type === 'high_risk')
    };
    
    // افزودن فیلدهای مربوط به هر نوع سرمایه‌گذاری
    if (investmentsByRisk.low_risk.length > 0) {
      embed.addFields({ 
        name: '🔵 سرمایه‌گذاری‌های کم ریسک', 
        value: '─────────────────────', 
        inline: false 
      });
    }
    
    // افزودن سرمایه‌گذاری‌ها به امبد با فرمت بهبود یافته
    investments.forEach((investment, index) => {
      const startDate = new Date(investment.startDate).toLocaleDateString('fa-IR');
      const endDate = new Date(investment.endDate).toLocaleDateString('fa-IR');
      const daysLeft = Math.ceil((new Date(investment.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      // محاسبه درصد پیشرفت
      const totalDays = Math.ceil((new Date(investment.endDate).getTime() - new Date(investment.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = totalDays - daysLeft;
      const progressPercent = Math.round((daysPassed / totalDays) * 100);
      
      // نمایش نوار پیشرفت
      let progressBar = '';
      const barLength = 10;
      const filledLength = Math.round((progressPercent / 100) * barLength);
      for (let i = 0; i < barLength; i++) {
        progressBar += i < filledLength ? '🟩' : '⬜';
      }
      
      // تعیین ایموجی و رنگ براساس نوع ریسک
      let riskEmoji, riskLabel;
      if (investment.type === 'low_risk') {
        riskEmoji = '🔵';
        riskLabel = 'کم ریسک';
      } else if (investment.type === 'medium_risk') {
        riskEmoji = '🟡';
        riskLabel = 'ریسک متوسط';
      } else {
        riskEmoji = '🔴';
        riskLabel = 'پرریسک';
      }
      
      const profit = investment.expectedReturn - investment.amount;
      const profitPercent = Math.round((investment.expectedReturn/investment.amount - 1) * 100);
      
      embed.addFields({ 
        name: `${index + 1}. ${riskEmoji} سرمایه‌گذاری ${riskLabel}`, 
        value: `💰 **مبلغ:** ${formatNumber(investment.amount)} Ccoin\n` +
               `💸 **سود انتظاری:** ${formatNumber(profit)} Ccoin (${profitPercent}%)\n` +
               `📆 **شروع:** ${startDate} | **پایان:** ${endDate}\n` +
               `⏳ **زمان باقیمانده:** ${daysLeft} روز (${progressPercent}%)\n` +
               `${progressBar}`,
        inline: false 
      });
    });
    
    // ایجاد دکمه بازگشت به منوی سرمایه‌گذاری
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('investment_menu')
          .setLabel('🔙 بازگشت به منوی سرمایه‌گذاری')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in investment history handler:', error);
    try {
      const errorMessage = '❌ متأسفانه در نمایش تاریخچه سرمایه‌گذاری شما خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling investment history failure:', e);
    }
  }
}

/**
 * نمایش تاریخچه معاملات سهام کاربر
 * @param interaction تعامل دکمه 
 */
async function handleStockHistory(interaction: ButtonInteraction) {
  try {
    // وارد کردن توابع فرمت‌کننده
    const { formatNumber, formatDate, timeAgo, formatTransactionType, getSectorEmoji, getSectorName } = require('../utils/formatters');
    
    // پاسخ با تاخیر برای جلوگیری از تایم‌اوت
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }
    
    // دریافت اطلاعات کاربر
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      const message = '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    // بررسی موجودی سهام کاربر
    const userStocks = await storage.getUserStocks(user.id);
    
    // دریافت تراکنش‌های مربوط به سهام
    const transactions = await storage.getUserTransactions(Number(user.id));
    const stockTransactions = transactions.filter(tx => 
      tx.type === 'stock_buy' || tx.type === 'stock_sell' || tx.type === 'stock_dividend'
    );
    
    if (stockTransactions.length === 0) {
      const message = '📊 شما هنوز هیچ معامله سهامی انجام نداده‌اید. می‌توانید از منوی بازار سهام، به خرید و فروش سهام بپردازید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      
      // بعد از مدت کوتاهی، منوی سهام را نمایش می‌دهیم
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await stocksMenu(interaction);
        }
      }, 2000);
      
      return;
    }
    
    // محاسبه آمار کلی معاملات سهام
    let totalBought = 0;
    let totalSold = 0;
    let totalDividend = 0;
    const buyTransactions = stockTransactions.filter(tx => tx.type === 'stock_buy');
    const sellTransactions = stockTransactions.filter(tx => tx.type === 'stock_sell');
    const dividendTransactions = stockTransactions.filter(tx => tx.type === 'stock_dividend');
    
    buyTransactions.forEach(tx => totalBought += Math.abs(tx.amount));
    sellTransactions.forEach(tx => totalSold += tx.amount);
    dividendTransactions.forEach(tx => totalDividend += tx.amount);
    
    // محاسبه سود/زیان کل
    const totalProfit = totalSold + totalDividend - totalBought;
    const profitPercent = totalBought > 0 ? ((totalProfit / totalBought) * 100).toFixed(2) : '0.00';
    
    // ایجاد امبد برای نمایش تاریخچه معاملات سهام
    const embed = new EmbedBuilder()
      .setColor('#00A86B')
      .setTitle('📊 تاریخچه معاملات سهام')
      .setDescription(`تاریخچه معاملات سهام شما در بازار بورس Ccoin`)
      .setThumbnail('https://img.icons8.com/fluency/48/stocks-growth.png')
      .addFields(
        { name: '💰 کل خرید', value: `${formatNumber(totalBought)} Ccoin`, inline: true },
        { name: '💸 کل فروش', value: `${formatNumber(totalSold)} Ccoin`, inline: true },
        { name: '💲 سود سهام', value: `${formatNumber(totalDividend)} Ccoin`, inline: true },
        { 
          name: totalProfit >= 0 ? '📈 سود خالص' : '📉 زیان خالص', 
          value: `${formatNumber(totalProfit)} Ccoin (${profitPercent}%)`, 
          inline: false 
        }
      )
      .setFooter({ text: `سبد سهام فعلی: ${userStocks.length} سهم | کیف پول: ${formatNumber(user.wallet)} Ccoin` })
      .setTimestamp();
    
    // افزودن بخش تراکنش‌های اخیر
    if (stockTransactions.length > 0) {
      embed.addFields({ 
        name: '📋 تراکنش‌های اخیر', 
        value: '10 تراکنش آخر مرتبط با سهام شما', 
        inline: false 
      });
      
      // مرتب‌سازی تراکنش‌ها از جدیدترین به قدیمی‌ترین
      stockTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // نمایش 10 تراکنش آخر
      const recentTransactions = stockTransactions.slice(0, 10);
      
      recentTransactions.forEach((tx, index) => {
        // تعیین ایموجی و قالب‌بندی مناسب
        let emoji = '';
        let stockName = '';
        let details = '';
        
        const metadata = tx.metadata as Record<string, any> | undefined;
        
        if (metadata && metadata.stockSymbol) {
          stockName = metadata.stockSymbol;
        } else if (tx.description) {
          // استخراج نام سهام از توضیحات
          const match = tx.description.match(/سهام (.+?) /);
          if (match) stockName = match[1];
        }
        
        if (tx.type === 'stock_buy') {
          emoji = '🔴';
          details = `خرید${stockName ? ` سهام ${stockName}` : ''} به مبلغ ${formatNumber(Math.abs(tx.amount))} Ccoin`;
          if (metadata && metadata.quantity) {
            details += ` (${metadata.quantity} سهم)`;
          }
        } else if (tx.type === 'stock_sell') {
          emoji = '🟢';
          details = `فروش${stockName ? ` سهام ${stockName}` : ''} به مبلغ ${formatNumber(tx.amount)} Ccoin`;
          if (metadata && metadata.quantity) {
            details += ` (${metadata.quantity} سهم)`;
          }
          if (metadata && typeof metadata.profit === 'number') {
            const profit = metadata.profit;
            details += ` - ${profit >= 0 ? 'سود' : 'ضرر'}: ${formatNumber(profit)} Ccoin`;
          }
        } else if (tx.type === 'stock_dividend') {
          emoji = '💲';
          details = `دریافت سود سهام${stockName ? ` ${stockName}` : ''} به مبلغ ${formatNumber(tx.amount)} Ccoin`;
        }
        
        // زمان تراکنش
        const txTime = timeAgo(tx.timestamp);
        
        embed.addFields({ 
          name: `${emoji} معامله #${index + 1} - ${txTime}`, 
          value: details, 
          inline: false 
        });
      });
    }
    
    // ایجاد دکمه‌های کنترلی
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('stocks_portfolio')
          .setLabel('💼 مشاهده پورتفولیو')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('stocks_market')
          .setLabel('🏢 بازار سهام')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('stocks')
          .setLabel('🔙 بازگشت به منوی سهام')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  } catch (error) {
    console.error('Error in stock history handler:', error);
    try {
      const errorMessage = '❌ متأسفانه در نمایش تاریخچه معاملات سهام شما خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling stock history failure:', e);
    }
  }
}

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  // Get the custom ID of the button
  const customId = interaction.customId;
  
  // پردازش دکمه‌های بازی بینگو
  if (customId === 'bingo' || customId.startsWith('bingo_')) {
    // سعی در پردازش دکمه‌های بینگو
    if (await handleBingoInteraction(interaction)) {
      return;
    }
  }
  
  // پردازش دکمه‌های زنجیره کلمات
  if (customId === 'word_chain' || customId.startsWith('word_chain_')) {
    // ارسال به پردازشگر بازی‌های گروهی
    await handleGroupGamesButton(interaction);
    return;
  }
  
  // پردازش دکمه‌های جرأت یا حقیقت
  if (customId === 'truth_or_dare' || customId.startsWith('truth_or_dare_')) {
    // ارسال به پردازشگر بازی‌های گروهی
    await handleGroupGamesButton(interaction);
    return;
  }
  
  // پردازش دکمه‌های بازی دوئل
  if (customId === 'game:duel:start') {
    // شروع بازی دوئل جدید
    await startDuel(interaction);
    return;
  }
  
  // پردازش دکمه‌های بازی گرگینه - سیستم مدیریت جلسه
  if (customId === 'create_werewolf_session') {
    // ایجاد جلسه جدید گرگینه
    await createWerewolfGame(interaction);
    return;
  }
  
  // پردازش دکمه‌های با الگوی werewolf در آن‌ها
  if (customId.includes('werewolf')) {
    // واردات متغیرها و توابع لازم از ماژول werewolfGame
    const { werewolfHandlers } = await import('../components/werewolfGame');
    
    // بررسی الگوی دکمه با رجکس
    for (const handler of werewolfHandlers) {
      if (handler.regex) {
        if (customId.match(new RegExp(handler.id))) {
          await handler.handler(interaction);
          return;
        }
      } else if (customId === handler.customId) {
        await handler.handler(interaction);
        return;
      }
    }
  }
  
  // پردازش دکمه‌های بازی جاسوس مخفی
  if (customId === 'spy_help_guide') {
    // نمایش راهنمای بازی جاسوس مخفی
    const embed = new EmbedBuilder()
      .setTitle('📚 راهنمای بازی جاسوس مخفی')
      .setDescription('بازی جاسوس مخفی یک بازی گروهی استراتژیک است که در آن یک نفر به عنوان جاسوس مخفی شده است و باید مکان بازی را حدس بزند. بقیه بازیکنان باید جاسوس را شناسایی کنند.')
      .setColor(0x8855FF)
      .addFields(
        { name: '👤 نقش‌ها', value: 'جاسوس (باید مکان را حدس بزند)، شهروندان (باید جاسوس را پیدا کنند)', inline: false },
        { name: '🎮 روش بازی', value: 'هر بازیکن به نوبت یک سوال از بازیکن دیگر می‌پرسد و پاسخ را دریافت می‌کند. جاسوس باید طوری پاسخ دهد که لو نرود.', inline: false },
        { name: '⏱️ زمان بازی', value: 'هر دور معمولاً 3 دقیقه طول می‌کشد و پس از آن رای‌گیری انجام می‌شود.', inline: false },
        { name: '🏆 برنده بازی', value: 'اگر جاسوس شناسایی نشود یا مکان را درست حدس بزند، جاسوس برنده می‌شود. اگر شناسایی شود و نتواند مکان را حدس بزند، شهروندان برنده می‌شوند.', inline: false },
        { name: '💰 جوایز', value: 'برندگان بازی سکه دریافت می‌کنند. جاسوس اگر برنده شود جایزه بیشتری دریافت می‌کند.', inline: false }
      )
      .setFooter({ text: 'برای شروع بازی به منوی جاسوس مخفی برگردید و روی "تشکیل جلسه" کلیک کنید.' });
      
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('spy')
          .setLabel('بازگشت به منوی جاسوس مخفی')
          .setEmoji('🔙')
          .setStyle(ButtonStyle.Secondary)
      );
      
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    return;
  }
  
  if (customId === 'create_spy_session' || customId.includes('spy_')) {
    // واردات متغیرها و توابع لازم از ماژول spyGame
    const { spyHandlers } = await import('../components/spyGame');
    
    // بررسی الگوی دکمه با رجکس
    for (const handler of spyHandlers) {
      if (handler.regex) {
        if (customId.match(new RegExp(handler.id))) {
          await handler.handler(interaction);
          return;
        }
      } else if (customId === handler.customId) {
        await handler.handler(interaction);
        return;
      }
    }
  }
  
  if (customId.startsWith('duel_accept_')) {
    // پذیرش درخواست دوئل
    await acceptDuel(interaction);
    return;
  } else if (customId.startsWith('duel_decline_')) {
    // رد درخواست دوئل
    await declineDuel(interaction);
    return;
  } else if (customId.startsWith('duel_attack_')) {
    // انجام حمله در دوئل
    await performAttack(interaction);
    return;
  } else if (customId.startsWith('duel_defense_')) {
    // انجام دفاع در دوئل
    await performDefense(interaction);
    return;
  } else if (customId.startsWith('duel_surrender_')) {
    // تسلیم شدن در دوئل
    await surrenderDuel(interaction);
    return;
  } else if (customId.startsWith('duel_items_')) {
    // نمایش منوی آیتم‌ها
    await showItemsMenu(interaction);
    return;
  } else if (customId.startsWith('duel_cancel_items_')) {
    // بازگشت از منوی آیتم‌ها
    await cancelItemsMenu(interaction);
    return;
  }
  
  // پردازش دکمه‌های بازی گرگینه
  if (customId === 'werewolf') {
    // ایجاد بازی گرگینه جدید
    await createWerewolfGame(interaction);
    return;
  } else if (customId === 'werewolf_help_guide') {
    // نمایش راهنمای بازی گرگینه
    const embed = new EmbedBuilder()
      .setTitle('📚 راهنمای بازی گرگینه')
      .setDescription('بازی گرگینه یک بازی گروهی استراتژیک است که در آن بازیکنان به دو گروه روستاییان و گرگینه‌ها تقسیم می‌شوند. هدف روستاییان شناسایی و حذف گرگینه‌ها و هدف گرگینه‌ها حذف روستاییان است.')
      .setColor(0x9B59B6)
      .addFields(
        { name: '🌙 فاز شب', value: 'در فاز شب، گرگینه‌ها یک نفر را برای کشتن انتخاب می‌کنند و نقش‌های ویژه مانند پیشگو، محافظ و ... اقدامات خود را انجام می‌دهند.', inline: false },
        { name: '☀️ فاز روز', value: 'در فاز روز، بازیکنان با یکدیگر بحث می‌کنند و سعی می‌کنند گرگینه‌ها را شناسایی کنند.', inline: false },
        { name: '🗳️ فاز رای‌گیری', value: 'پس از بحث، بازیکنان رای می‌دهند و فردی که بیشترین رای را بیاورد از بازی حذف می‌شود.', inline: false },
        { name: '👥 نقش‌های گرگینه', value: 'گرگینه معمولی (در شب یک نفر را می‌کشد)، گرگینه آلفا (رهبر گروه گرگینه‌ها، قدرت دو برابر)، توله گرگ (در شب نمی‌تواند بکشد اما با گرگینه‌ها همراه است)', inline: false },
        { name: '👥 نقش‌های روستا', value: 'پیشگو (می‌تواند هویت افراد را بررسی کند)، جادوگر (می‌تواند یک نفر را از مرگ نجات دهد)، شکارچی (می‌تواند یک نفر را در طول بازی بکشد)، دختر روستایی (اگر پیشگو کشته شود، جایگزین او می‌شود)', inline: false }
      )
      .setFooter({ text: 'برای شروع بازی به منوی گرگینه برگردید و روی "ایجاد بازی جدید" کلیک کنید.' });
      
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('werewolf')
          .setLabel('بازگشت به منوی گرگینه')
          .setEmoji('🔙')
          .setStyle(ButtonStyle.Secondary)
      );
      
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    return;
  } else if (customId.startsWith('join_werewolf_')) {
    // پیوستن به بازی گرگینه
    await joinWerewolfGame(interaction);
    return;
  } else if (customId.startsWith('rules_werewolf_')) {
    // نمایش قوانین بازی گرگینه
    await showWerewolfRules(interaction);
    return;
  } else if (customId.startsWith('back_to_werewolf_')) {
    // بازگشت به منوی اصلی گرگینه
    await backToWerewolfMenu(interaction);
    return;
  } else if (customId.startsWith('cancel_werewolf_')) {
    // لغو بازی گرگینه
    await cancelWerewolfGame(interaction);
    return;
  } else if (customId.startsWith('start_werewolf_')) {
    // شروع بازی گرگینه
    await startWerewolfGame(interaction);
    return;
  } else if (customId.startsWith('werewolf_vote_day_')) {
    // رأی‌گیری در فاز روز بازی گرگینه
    await werewolfDayVoting(interaction);
    return;
  } else if (customId.startsWith('werewolf_vote_')) {
    // رأی دادن به بازیکن در بازی گرگینه
    await werewolfVotePlayer(interaction as unknown as StringSelectMenuInteraction);
    return;
  } else if (customId === 'mafia') {
    // نمایش منوی بازی مافیا بدون ایجاد جلسه
    await handleMafiaGame(interaction);
    return;
  } else if (customId === 'sessions_mafia') {
    // نمایش جلسات فعال بازی مافیا
    await showActiveSessionsMenu(interaction, 'mafia');
    return;
  } else if (customId === 'sessions_werewolf') {
    // نمایش جلسات فعال بازی گرگینه
    await showActiveSessionsMenu(interaction, 'werewolf');
    return;
  } else if (customId === 'sessions_spy') {
    // نمایش جلسات فعال بازی جاسوس مخفی
    await showActiveSessionsMenu(interaction, 'spy');
    return;
  } else if (customId === 'mafia_help_guide') {
    // نمایش راهنمای بازی مافیا
    const embed = new EmbedBuilder()
      .setTitle('📚 راهنمای بازی مافیا')
      .setDescription('بازی مافیا یک بازی گروهی استراتژیک است که در آن بازیکنان به دو گروه شهروندان و مافیا تقسیم می‌شوند. هدف شهروندان شناسایی و حذف مافیاها و هدف مافیا حذف شهروندان است.')
      .setColor(0x9B59B6)
      .addFields(
        { name: '🌙 فاز شب', value: 'در فاز شب، مافیاها یک نفر را برای کشتن انتخاب می‌کنند و نقش‌های ویژه مانند دکتر، کارآگاه و ... اقدامات خود را انجام می‌دهند.', inline: false },
        { name: '☀️ فاز روز', value: 'در فاز روز، بازیکنان با یکدیگر بحث می‌کنند و سعی می‌کنند مافیاها را شناسایی کنند.', inline: false },
        { name: '🗳️ فاز رای‌گیری', value: 'پس از بحث، بازیکنان رای می‌دهند و فردی که بیشترین رای را بیاورد از بازی حذف می‌شود.', inline: false },
        { name: '👥 نقش‌های مافیا', value: 'مافیا (قاتل)، پدرخوانده (در استعلام کارآگاه شناسایی نمی‌شود)، ساکت‌کننده (می‌تواند یک نفر را برای یک روز ساکت کند)', inline: false },
        { name: '👥 نقش‌های شهروندی', value: 'کارآگاه (می‌تواند هویت افراد را بررسی کند)، دکتر (می‌تواند یک نفر را از مرگ نجات دهد)، تک‌تیرانداز (می‌تواند یک نفر را در طول بازی بکشد)، محافظ (از یک شخص محافظت می‌کند)، روانشناس (ساکت‌شدن را خنثی می‌کند)', inline: false }
      )
      .setFooter({ text: 'برای شروع بازی به منوی مافیا برگردید و روی "تشکیل جلسه" کلیک کنید.' });
      
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('mafia')
          .setLabel('بازگشت به منوی مافیا')
          .setEmoji('🔙')
          .setStyle(ButtonStyle.Secondary)
      );
      
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    return;
  } else if (customId === 'create_mafia_session') {
    // ایجاد جلسه جدید مافیا با کلیک روی دکمه "تشکیل جلسه"
    await createMafiaGame(interaction);
    return;
  } else if (customId === 'show_active_mafia_sessions') {
    // نمایش لیست جلسات فعال مافیا
    await showActiveSessionsMenu(interaction);
    return;
  } else if (customId.startsWith('join_mafia_')) {
    // پیوستن به بازی مافیا
    await joinMafiaGame(interaction);
    return;
  } else if (customId.startsWith('rules_mafia_')) {
    // نمایش قوانین بازی مافیا
    await showMafiaRules(interaction);
    return;
  } else if (customId.startsWith('back_to_mafia_')) {
    // بازگشت به منوی اصلی مافیا
    await backToMafiaMenu(interaction);
    return;
  } else if (customId.startsWith('cancel_mafia_')) {
    // لغو بازی مافیا
    await cancelMafiaGame(interaction);
    return;
  } else if (customId.startsWith('start_mafia_')) {
    // شروع بازی مافیا
    await startMafiaGame(interaction);
    return;
  } else if (customId.startsWith('vote_day_')) {
    // رأی‌گیری در فاز روز
    await mafiaVoting(interaction);
    return;
  } else if (customId.startsWith('vote_player_')) {
    // رأی به یک بازیکن
    await mafiaVotePlayer(interaction);
    return;
  } else if (customId.startsWith('mafia_kill_')) {
    // انتخاب قربانی توسط مافیا
    await mafiaKill(interaction);
    return;
  } else if (customId.startsWith('kill_target_')) {
    // انتخاب هدف برای کشتن
    await killTarget(interaction);
    return;
  } else if (customId.startsWith('detective_check_')) {
    // بررسی هویت توسط کارآگاه
    await detectiveCheck(interaction);
    return;
  } else if (customId.startsWith('check_target_')) {
    // انتخاب هدف برای بررسی هویت
    await checkTarget(interaction);
    return;
  } else if (customId.startsWith('doctor_save_')) {
    // محافظت توسط دکتر
    await doctorSave(interaction);
    return;
  } else if (customId.startsWith('save_target_')) {
    // انتخاب هدف برای محافظت
    await saveTarget(interaction);
    return;
  }
  

    
  // اجرای منوی بازی‌های گروهی
  if (customId.startsWith('group_') || customId.startsWith('quiz_') || customId.startsWith('drawguess_')) {
    if (customId === 'group_games') {
      // اگر دکمه "بازی‌های گروهی" در منوی اصلی انتخاب شده، به منوی بازی‌ها با حالت گروهی برو
      await gamesMenu(interaction, false, 'group');
    } else {
      // اجرای سایر دکمه‌های بازی‌های گروهی
      await handleGroupGamesButton(interaction);
    }
    return;
  }
  
  // پشتیبانی از دکمه‌های بازی‌های جدید با فرمت game:gametype:action
  if (customId.startsWith('game:')) {
    // دکمه نمایش جلسات فعال بازی
    if (customId === 'game:active_sessions') {
      const { showActiveSessionsMenu } = await import('../components/groupGames');
      await showActiveSessionsMenu(interaction);
      return;
    }
    
    await handleGroupGamesButton(interaction);
    return;
  }

  // Standard format for button IDs: action:param1:param2
  const [action, ...params] = customId.split(':');

  try {
    
    // Handle help category select menu
    if (action === 'help_category_select') {
      // Procesar el menú desplegable de categorías de ayuda
      if (interaction.isStringSelectMenu() || interaction instanceof StringSelectMenuInteraction) {
        const selectedCategory = (interaction as StringSelectMenuInteraction).values[0];
        
        try {
          // Intentar actualizar la respuesta con la categoría seleccionada
          await helpMenu(interaction, selectedCategory);
        } catch (e) {
          console.error(`Error updating help menu for category ${selectedCategory}:`, e);
          
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
              content: `❌ خطایی در نمایش راهنمای دسته "${selectedCategory}" رخ داد. لطفاً دوباره تلاش کنید.`, 
              ephemeral: true 
            });
          }
        }
      }
      return;
    }
    
    // Handle navigation buttons
    if (action === 'menu' || action === 'main_menu') {
      // اطمینان از اینکه از update استفاده می‌شود به جای reply جدید
      if ('update' in interaction && typeof interaction.update === 'function') {
        // اگر قابلیت update وجود دارد، تلاش برای به‌روزرسانی پیام فعلی
        try {
          await mainMenu(interaction);
        } catch (e) {
          console.error("Error updating menu:", e);
          // در صورت بروز خطا، پیام جدید ارسال می‌شود
          await interaction.reply({ content: "منوی اصلی در حال بارگذاری...", ephemeral: true });
          await mainMenu(interaction);
        }
      } else {
        // اگر تعامل قابلیت update ندارد، از روش قدیمی استفاده می‌شود
        await mainMenu(interaction);
      }
      return;
    }
    
    if (action === 'other_options') {
      // اطمینان از اینکه از update استفاده می‌شود به جای reply جدید
      if ('update' in interaction && typeof interaction.update === 'function') {
        // اگر قابلیت update وجود دارد، تلاش برای به‌روزرسانی پیام فعلی
        try {
          await mainMenu(interaction, true);
        } catch (e) {
          console.error("Error updating other options menu:", e);
          // در صورت بروز خطا، پیام جدید ارسال می‌شود
          await interaction.reply({ content: "منوی امکانات بیشتر در حال بارگذاری...", ephemeral: true });
          await mainMenu(interaction, true);
        }
      } else {
        // اگر تعامل قابلیت update ندارد، از روش قدیمی استفاده می‌شود
        await mainMenu(interaction, true);
      }
      return;
    }
    
    // مدیریت دکمه دستیار هوشمند و CCOIN AI
    // پردازش دکمه‌های مربوط به دستیار هوش مصنوعی
    
    // پردازش دکمه منوی CCOIN AI
    if (customId === 'ccoin_ai') {
      try {
        const { showCCOINAIMenu } = await import('../components/ccoinAIMenu');
        await showCCOINAIMenu(interaction);
        return;
      } catch (error) {
        console.error('خطا در اجرای منوی هوش مصنوعی CCOIN AI:', error);
        await interaction.reply({
          content: 'با عرض پوزش، در حال حاضر امکان دسترسی به منوی هوش مصنوعی وجود ندارد. لطفاً کمی بعد دوباره تلاش کنید.',
          ephemeral: true
        });
        return;
      }
    }
    
    // (بخش‌های دیگر در پایین فایل دوباره تعریف شده و کامل‌تر است)
    
    // پردازش خرید اشتراک هفتگی دستیار هوش مصنوعی
    if (action === 'ai_sub_weekly') {
      try {
        // دریافت اطلاعات کاربر
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '❌ اطلاعات کاربری شما یافت نشد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی موجودی کاربر
        const WEEKLY_SUBSCRIPTION_PRICE = 8500;
        if (user.wallet < WEEKLY_SUBSCRIPTION_PRICE) {
          await interaction.reply({
            content: `❌ موجودی کیف پول شما کافی نیست. برای اشتراک هفتگی به ${WEEKLY_SUBSCRIPTION_PRICE} سکه نیاز دارید.`,
            ephemeral: true
          });
          return;
        }
        
        // نمایش پیام در حال پردازش
        await interaction.deferReply({ ephemeral: true });
        
        // کسر هزینه اشتراک از کیف پول
        await storage.addToWallet(user.id, -WEEKLY_SUBSCRIPTION_PRICE, 'subscription_purchase', {
          subscriptionType: 'ai_weekly'
        });
        
        // فعال‌سازی اشتراک
        await storage.subscribeToAIAssistant(user.id, 'weekly', WEEKLY_SUBSCRIPTION_PRICE);
        
        // دریافت اطلاعات به‌روز اشتراک
        const aiDetails = await storage.getUserAIAssistantDetails(user.id);
        const expireDate = aiDetails?.subscriptionExpires;
        const expireDateStr = expireDate ? new Date(expireDate).toLocaleDateString('fa-IR') : 'نامشخص';
        
        // ساخت امبد تایید خرید
        const successEmbed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('🎉 اشتراک دستیار هوشمند فعال شد!')
          .setDescription(`اشتراک هفتگی شما با موفقیت فعال شد. اکنون می‌توانید بدون محدودیت از دستیار هوشمند استفاده کنید.`)
          .addFields(
            { name: '💰 هزینه پرداخت شده', value: `${WEEKLY_SUBSCRIPTION_PRICE} سکه`, inline: true },
            { name: '⏳ تاریخ انقضا', value: expireDateStr, inline: true }
          )
          .setFooter({ 
            text: `می‌توانید با کلیک بر روی دکمه زیر، سؤال خود را بپرسید.`,
            iconURL: interaction.client.user?.displayAvatarURL()
          })
          .setTimestamp();
        
        // ساخت دکمه پرسش سوال
        const askButton = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('ai_assistant')
              .setLabel('پرسیدن سوال جدید')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🧠')
          );
        
        // ارسال پاسخ به کاربر
        await interaction.editReply({
          embeds: [successEmbed],
          components: [askButton]
        });
      } catch (error) {
        console.error('Error handling AI weekly subscription purchase:', error);
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ خطایی در فعال‌سازی اشتراک رخ داد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.'
          });
        } else {
          await interaction.reply({
            content: '❌ خطایی در فعال‌سازی اشتراک رخ داد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.',
            ephemeral: true
          });
        }
      }
      return;
    }
    
    // پردازش خرید اشتراک ماهانه دستیار هوش مصنوعی
    if (action === 'ai_sub_monthly') {
      try {
        // دریافت اطلاعات کاربر
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '❌ اطلاعات کاربری شما یافت نشد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی موجودی کاربر
        const MONTHLY_SUBSCRIPTION_PRICE = 25000;
        if (user.wallet < MONTHLY_SUBSCRIPTION_PRICE) {
          await interaction.reply({
            content: `❌ موجودی کیف پول شما کافی نیست. برای اشتراک ماهانه به ${MONTHLY_SUBSCRIPTION_PRICE} سکه نیاز دارید.`,
            ephemeral: true
          });
          return;
        }
        
        // نمایش پیام در حال پردازش
        await interaction.deferReply({ ephemeral: true });
        
        // کسر هزینه اشتراک از کیف پول
        await storage.addToWallet(user.id, -MONTHLY_SUBSCRIPTION_PRICE, 'subscription_purchase', {
          subscriptionType: 'ai_monthly'
        });
        
        // فعال‌سازی اشتراک
        await storage.subscribeToAIAssistant(user.id, 'monthly', MONTHLY_SUBSCRIPTION_PRICE);
        
        // دریافت اطلاعات به‌روز اشتراک
        const aiDetails = await storage.getUserAIAssistantDetails(user.id);
        const expireDate = aiDetails?.subscriptionExpires;
        const expireDateStr = expireDate ? new Date(expireDate).toLocaleDateString('fa-IR') : 'نامشخص';
        
        // ساخت امبد تایید خرید
        const successEmbed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('🎉 اشتراک دستیار هوشمند فعال شد!')
          .setDescription(`اشتراک ماهانه شما با موفقیت فعال شد. اکنون می‌توانید بدون محدودیت از دستیار هوشمند استفاده کنید.`)
          .addFields(
            { name: '💰 هزینه پرداخت شده', value: `${MONTHLY_SUBSCRIPTION_PRICE} سکه`, inline: true },
            { name: '⏳ تاریخ انقضا', value: expireDateStr, inline: true }
          )
          .setFooter({ 
            text: `می‌توانید با کلیک بر روی دکمه زیر، سؤال خود را بپرسید.`,
            iconURL: interaction.client.user?.displayAvatarURL()
          })
          .setTimestamp();
        
        // ساخت دکمه پرسش سوال
        const askButton = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('ai_assistant')
              .setLabel('پرسیدن سوال جدید')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🧠')
          );
        
        // ارسال پاسخ به کاربر
        await interaction.editReply({
          embeds: [successEmbed],
          components: [askButton]
        });
      } catch (error) {
        console.error('Error handling AI monthly subscription purchase:', error);
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ خطایی در فعال‌سازی اشتراک رخ داد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.'
          });
        } else {
          await interaction.reply({
            content: '❌ خطایی در فعال‌سازی اشتراک رخ داد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.',
            ephemeral: true
          });
        }
      }
      return;
    }
    
    if (action === 'ai_assistant') {
      try {
        // بررسی حساب کاربری
        const user = await storage.getUserByDiscordId(interaction.user.id);
        if (!user) {
          await interaction.reply({
            content: '❌ برای استفاده از دستیار هوشمند، ابتدا باید یک حساب کاربری در ربات داشته باشید. از دستور /menu استفاده کنید.',
            ephemeral: true
          });
          return;
        }
        
        // بررسی وضعیت استفاده از دستیار هوشمند
        const aiDetails = await storage.getUserAIAssistantDetails(user.id);
        
        // بررسی اشتراک کاربر و تاریخ انقضا
        let isSubscriptionActive = false;
        
        if (aiDetails?.subscription && aiDetails?.subscriptionExpires) {
          // بررسی معتبر بودن تاریخ انقضا
          const now = new Date();
          const expiryDate = new Date(aiDetails.subscriptionExpires);
          
          if (expiryDate > now) {
            isSubscriptionActive = true;
          }
        }
        
        // اگر کاربر اشتراک فعال ندارد و سوالات رایگان تمام شده، پیام خطا
        if (!isSubscriptionActive && (aiDetails?.questionsRemaining === undefined || aiDetails?.questionsRemaining <= 0)) {
          const subscriptionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ai_sub_weekly')
                .setLabel('اشتراک هفتگی (8,500 سکه)')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔮'),
              new ButtonBuilder()
                .setCustomId('ai_sub_monthly')
                .setLabel('اشتراک ماهانه (25,000 سکه)')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💫')
            );
          
          await interaction.reply({
            content: `❌ شما به حداکثر تعداد سوالات رایگان (${aiDetails?.totalQuestions || 5} سوال) رسیده‌اید!\nبرای استفاده نامحدود از دستیار هوشمند، یکی از گزینه‌های اشتراک را انتخاب کنید:`,
            components: [subscriptionRow],
            ephemeral: true
          });
          return;
        }
      
        // ایجاد مودال برای دریافت سوال کاربر
        const modal = new ModalBuilder()
          .setCustomId('ai_assistant_modal')
          .setTitle('🧠 دستیار هوشمند Ccoin');
        
        // افزودن فیلدهای ورودی به مودال
        const promptInput = new TextInputBuilder()
          .setCustomId('prompt')
          .setLabel('سوال یا درخواست خود را بنویسید')
          .setPlaceholder('مثال: چطور می‌توانم سکه‌های بیشتری در بازی Ccoin به دست بیاورم؟')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMinLength(5)
          .setMaxLength(1000);
        
        // افزودن فیلدها به مودال
        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(promptInput);
        modal.addComponents(firstActionRow);
        
        // نمایش مودال به کاربر
        await interaction.showModal(modal);
        return;
      } catch (error) {
        console.error('Error handling AI assistant modal:', error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ خطایی در پردازش درخواست شما رخ داد. لطفاً دوباره تلاش کنید.',
            ephemeral: true
          });
        }
        return;
      }
    }

    if (action === 'economy') {
      await economyMenu(interaction);
      return;
    }
    
    // Handle economic status buttons
    if (customId === 'economic_status') {
      await economicStatusMenu(interaction);
      return;
    } else if (customId === 'economic_status_detail') {
      await economicStatusDetail(interaction);
      return;
    }

    if (action === 'balance') {
      try {
        // Get user data
        const user = await storage.getUserByDiscordId(interaction.user.id);
        
        if (!user) {
          // Create new user if not exists
          const newUser = await storage.createUser({
            discordId: interaction.user.id,
            username: interaction.user.username,
          });
          
          // ایجاد Embed برای کاربر جدید
          const newUserEmbed = new EmbedBuilder()
            .setColor('#2ECC71') // سبز روشن
            .setTitle('🎉 به دنیای Ccoin خوش آمدید!')
            .setDescription(`**${interaction.user.username}** عزیز، حساب شما با موفقیت ساخته شد.`)
            .setThumbnail(interaction.user.displayAvatarURL() || interaction.client.user?.displayAvatarURL())
            .addFields(
              { name: '💰 موجودی کیف پول', value: `\`${newUser.wallet} Ccoin\``, inline: true },
              { name: '🏦 موجودی بانک', value: `\`${newUser.bank} Ccoin\``, inline: true },
              { name: '💎 کریستال', value: `\`${newUser.crystals}\``, inline: true }
            )
            .setFooter({ text: '📌 برای دریافت جایزه روزانه از دستور /daily استفاده کنید!' })
            .setTimestamp();
          
          // دکمه برای دسترسی به منوی اصلی
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('menu')
                .setLabel('🏠 منوی اصلی')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('daily')
                .setLabel('🎁 دریافت جایزه روزانه')
                .setStyle(ButtonStyle.Primary)
            );
          
          await interaction.update({
            embeds: [newUserEmbed],
            components: [row]
          });
        } else {
          // ایجاد امبد برای کاربر موجود
          const balanceEmbed = new EmbedBuilder()
            .setColor('#F1C40F') // زرد طلایی
            .setTitle('💰 اطلاعات حساب کاربری')
            .setDescription(`**${interaction.user.username}** عزیز، اطلاعات حساب شما به شرح زیر است:`)
            .setThumbnail(interaction.user.displayAvatarURL() || interaction.client.user?.displayAvatarURL())
            .addFields(
              { name: '💰 موجودی کیف پول', value: `\`${user.wallet} Ccoin\``, inline: true },
              { name: '🏦 موجودی بانک', value: `\`${user.bank} Ccoin\``, inline: true },
              { name: '💎 کریستال', value: `\`${user.crystals}\``, inline: true },
              { name: '🏆 امتیاز', value: `\`${user.points || 0}\``, inline: true },
              { name: '🌟 سطح', value: `\`${user.level || 1}\``, inline: true },
              { name: '📊 مجموع دارایی', value: `\`${user.wallet + user.bank} Ccoin\``, inline: true }
            )
            .setFooter({ text: '📌 برای مشاهده جزئیات بیشتر، از منوی اصلی بخش اقتصاد را انتخاب کنید!' })
            .setTimestamp();
          
          // ساخت دکمه برای دسترسی به منوی اقتصاد
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('economy')
                .setLabel('💰 منوی اقتصاد')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('deposit_menu')
                .setLabel('🏦 انتقال به بانک')
                .setStyle(ButtonStyle.Primary)
            );
          
          await interaction.update({
            embeds: [balanceEmbed],
            components: [row]
          });
        }
      } catch (error) {
        console.error('Error in balance button handler:', error);
        
        try {
          await interaction.update({
            content: '⚠️ خطا در بررسی موجودی! لطفاً دوباره تلاش کنید.',
            embeds: [],
            components: []
          });
        } catch (followUpError) {
          console.error('Error sending error message for balance button:', followUpError);
        }
      }
      return;
    }

    if (action === 'games') {
      await gamesMenu(interaction);
      return;
    }
    
    if (action === 'wheel') {
      await wheelOfFortuneMenu(interaction);
      return;
    }
    
    if (action === 'wheel_spin') {
      await spinWheel(interaction);
      return;
    }
    
    if (action === 'solo_games') {
      await gamesMenu(interaction);
      return;
    }
    
    if (action === 'competitive_games') {
      await gamesMenu(interaction);
      return;
    }
    
    if (action === 'group_games') {
      await gamesMenu(interaction, false, 'group');
      return;
    }

    if (action === 'shop') {
      await shopMenu(interaction);
      return;
    }
    
    // Handle shop pagination
    if (action.startsWith('shop_page_')) {
      await shopMenu(interaction);
      return;
    }

    if (action === 'inventory') {
      await inventoryMenu(interaction);
      return;
    }

    if (action === 'quests') {
      await questsMenu(interaction);
      return;
    }

    // پردازش دکمه‌های بخش کلن‌ها
    if (action === 'clans' || action.startsWith('clan_')) {
      await clansMenu(interaction);
      return;
    }

    if (action === 'profile') {
      await profileMenu(interaction);
      return;
    }
    
    // Handle profile menu buttons
    if (action === 'profile_stats' || action === 'profile_achievements' || 
        action === 'profile_items' || action === 'profile_transactions') {
      await profileMenu(interaction);
      return;
    }
    
    if (action === 'robbery') {
      await robberyMenu(interaction);
      return;
    }
    
    if (action === 'feedback') {
      // نمایش مودال فرم بازخورد
      await showFeedbackModal(interaction);
      return;
    }
    
    if (action === 'help') {
      // استفاده از منوی راهنمای جامع به جای ساخت راهنمای ساده
      try {
        // اطمینان از اینکه از update استفاده می‌شود به جای reply جدید
        if ('update' in interaction && typeof interaction.update === 'function') {
          try {
            // تلاش برای به‌روزرسانی پیام فعلی
            await helpMenu(interaction);
          } catch (e) {
            console.error("Error updating help menu:", e);
            // در صورت بروز خطا، پیام جدید ارسال می‌شود
            await interaction.reply({ content: "راهنمای جامع در حال بارگذاری...", ephemeral: true });
            await helpMenu(interaction);
          }
        } else {
          // اگر تعامل قابلیت update ندارد، از روش قدیمی استفاده می‌شود
          await helpMenu(interaction);
        }
      } catch (error) {
        console.error("Error showing help menu:", error);
        
        // در صورت بروز خطا، پیام خطا را نمایش می‌دهیم
        if (interaction.deferred) {
          await interaction.editReply({ content: "❌ خطایی در نمایش راهنما رخ داد. لطفاً دوباره تلاش کنید." });
        } else if (!interaction.replied) {
          await interaction.reply({ content: "❌ خطایی در نمایش راهنما رخ داد. لطفاً دوباره تلاش کنید.", ephemeral: true });
        }
      }
      return;
    }
    
    // پردازش دکمه‌های راهنمای دسته‌بندی شده
    if (action.startsWith('help_view_')) {
      const category = action.replace('help_view_', '');
      
      try {
        // اطمینان از اینکه از update استفاده می‌شود به جای reply جدید
        if ('update' in interaction && typeof interaction.update === 'function') {
          try {
            // تلاش برای به‌روزرسانی پیام فعلی با دسته‌بندی مشخص شده
            await helpMenu(interaction, category);
          } catch (e) {
            console.error(`Error updating help menu for category ${category}:`, e);
            // در صورت بروز خطا، پیام جدید ارسال می‌شود
            await interaction.reply({ content: `راهنمای دسته "${category}" در حال بارگذاری...`, ephemeral: true });
            await helpMenu(interaction, category);
          }
        } else {
          // اگر تعامل قابلیت update ندارد، از روش قدیمی استفاده می‌شود
          await helpMenu(interaction, category);
        }
      } catch (error) {
        console.error(`Error showing help menu for category ${category}:`, error);
        
        // در صورت بروز خطا، پیام خطا را نمایش می‌دهیم
        if (interaction.deferred) {
          await interaction.editReply({ content: "❌ خطایی در نمایش راهنما رخ داد. لطفاً دوباره تلاش کنید." });
        } else if (!interaction.replied) {
          await interaction.reply({ content: "❌ خطایی در نمایش راهنما رخ داد. لطفاً دوباره تلاش کنید.", ephemeral: true });
        }
      }
      return;
    }

    // Handle game buttons
    if (action === 'game') {
      const gameType = params[0];

      // تک نفره
      if (gameType === 'coinflip') {
        if (params[1] === 'start') {
          await handleCoinFlip(interaction, 'start');
        } else if (params[1] === 'heads') {
          await handleCoinFlip(interaction, 'heads');
        } else if (params[1] === 'tails') {
          await handleCoinFlip(interaction, 'tails');
        }
        return;
      }

      if (gameType === 'rps') {
        if (params[1] === 'start') {
          await handleRockPaperScissors(interaction, 'start');
        } else if (params[1] === 'rock') {
          await handleRockPaperScissors(interaction, 'rock');
        } else if (params[1] === 'paper') {
          await handleRockPaperScissors(interaction, 'paper');
        } else if (params[1] === 'scissors') {
          await handleRockPaperScissors(interaction, 'scissors');
        }
        return;
      }

      if (gameType === 'numberguess') {
        if (params[1] === 'start') {
          await handleNumberGuess(interaction, 'start');
        } else if (params[1] === 'guess') {
          const guess = parseInt(params[2]);
          await handleNumberGuess(interaction, 'guess', guess);
        }
        return;
      }
      
      // بازی‌های جدید تک‌نفره
      if (gameType === 'quick_poker') {
        await handleQuickPoker(interaction, params[1]);
        return;
      }
      
      if (gameType === 'type_race') {
        await handleTypeRace(interaction, params[1]);
        return;
      }
      
      if (gameType === 'dart') {
        await handleDart(interaction, params[1]);
        return;
      }
      
      if (gameType === 'bomb') {
        await handleBomb(interaction, params[1] + (params[2] ? ':' + params[2] : ''));
        return;
      }
      
      if (gameType === 'penalty') {
        await handlePenalty(interaction, params[1]);
        return;
      }
      
      if (gameType === 'archery') {
        await handleArchery(interaction, params[1]);
        return;
      }
      
      if (gameType === 'quiz') {
        await handleQuiz(interaction, params[1] + (params[2] ? ':' + params[2] : ''));
        return;
      }
      
      // بازی‌های رقابتی - نمایش منوی matchmaking
      
      // تاس دو نفره
      if (gameType === 'dice_duel') {
        if (params[1] === 'start') {
          // نمایش منوی matchmaking
          await showMatchmakingMenu(interaction, 'dice_duel', '🎲 تاس دو نفره');
        } else if (params[1] === 'invite') {
          const targetId = params[2];
          await handleDiceDuel(interaction, 'invite', targetId);
        } else if (params[1] === 'accept') {
          const inviterId = params[2];
          await handleDiceDuel(interaction, 'accept', inviterId);
        } else if (params[1] === 'reject') {
          const inviterId = params[2];
          await handleDiceDuel(interaction, 'reject', inviterId);
        } else if (params[1] === 'roll') {
          const gameId = params[2];
          await handleDiceDuel(interaction, 'roll', gameId);
        }
        return;
      }
      
      // دوئل
      if (gameType === 'duel') {
        if (params[1] === 'start') {
          await showMatchmakingMenu(interaction, 'duel', '⚔️ دوئل');
        } else if (params[1] === 'weapon') {
          const gameAndWeapon = params[2] + ':' + params[3];
          const { handleDuel } = await import('../games/duel');
          await handleDuel(interaction, 'weapon', gameAndWeapon);
        } else if (params[1] === 'attack') {
          const gameId = params[2];
          const { handleDuel } = await import('../games/duel');
          await handleDuel(interaction, 'attack', gameId);
        }
        return;
      }
      
      // پوکر سریع
      if (gameType === 'quick_poker') {
        if (params[1] === 'start') {
          await showMatchmakingMenu(interaction, 'quick_poker', '🃏 پوکر سریع');
        }
        return;
      }
      
      // مسابقه سرعت تایپ
      if (gameType === 'type_race') {
        if (params[1] === 'start') {
          await showMatchmakingMenu(interaction, 'type_race', '⌨️ مسابقه سرعت تایپ');
        }
        return;
      }
      
      // دارت رقابتی
      if (gameType === 'dart') {
        if (params[1] === 'start') {
          await showMatchmakingMenu(interaction, 'dart', '🎯 دارت رقابتی');
        }
        return;
      }
      
      // مافیا
      if (gameType === 'mafia') {
        if (params[1] === 'start') {
          await showMatchmakingMenu(interaction, 'mafia', '🕵️‍♂️ مافیا');
        }
        return;
      }
      
      // بمب زمان‌دار
      if (gameType === 'bomb') {
        if (params[1] === 'start') {
          await showMatchmakingMenu(interaction, 'bomb', '💣 بمب زمان‌دار');
        }
        return;
      }
      
      // پنالتی شانس
      if (gameType === 'penalty') {
        if (params[1] === 'start') {
          await showMatchmakingMenu(interaction, 'penalty', '⚽ پنالتی شانس');
        }
        return;
      }
      
      // تیراندازی هدف
      if (gameType === 'archery') {
        if (params[1] === 'start') {
          await showMatchmakingMenu(interaction, 'archery', '🏹 تیراندازی هدف');
        }
        return;
      }
    }
    
    // Handle matchmaking actions
    if (action === 'matchmaking') {
      const matchmakingType = params[0];
      const gameType = params[1];
      
      // جستجوی تصادفی
      if (matchmakingType === 'random') {
        await startRandomMatchmaking(interaction, gameType);
        return;
      }
      
      // دعوت رقیب
      if (matchmakingType === 'invite') {
        await showInviteOpponentMenu(interaction, gameType);
        return;
      }
      
      // لغو جستجو
      if (matchmakingType === 'cancel') {
        await cancelMatchmaking(interaction, gameType);
        return;
      }
    }

    // Handle economy actions
    if (action === 'daily') {
      await handleDailyReward(interaction);
      return;
    }

    if (action === 'deposit') {
      const amount = parseInt(params[0]);
      await handleDeposit(interaction, amount);
      return;
    }

    if (action === 'withdraw') {
      const amount = parseInt(params[0]);
      await handleWithdraw(interaction, amount);
      return;
    }

    // Handle shop actions
    if (action === 'buy') {
      const itemId = parseInt(params[0]);
      await handleBuyItem(interaction, itemId);
      return;
    }

    // Handle inventory actions
    if (action === 'use') {
      const itemId = parseInt(params[0]);
      await handleUseItem(interaction, itemId);
      return;
    }

    if (action === 'sell') {
      const itemId = parseInt(params[0]);
      await handleSellItem(interaction, itemId);
      return;
    }

    // Handle quest actions
    if (action === 'claim') {
      const questId = parseInt(params[0]);
      await handleClaimQuest(interaction, questId);
      return;
    }
    
    // Handle investment menu
    if (action === 'investment_menu') {
      await investmentMenu(interaction);
      return;
    }
    
    // Handle investment actions
    if (action === 'invest_low' || action === 'invest_medium' || action === 'invest_high') {
      await investmentMenu(interaction);
      return;
    }
    
    // Handle investment history
    if (action === 'investment_history') {
      await handleInvestmentHistory(interaction);
      return;
    }
    
    // Handle bank menu
    if (action === 'bank_menu') {
      await economyMenu(interaction);
      return;
    }
    
    // Handle bank account upgrade menu
    if (action === 'bank_upgrade') {
      await bankUpgradeMenu(interaction);
      return;
    }
    
    // Handle bank account upgrade process
    if (action.startsWith('upgrade_bank_')) {
      const targetTier = parseInt(action.replace('upgrade_bank_', ''));
      await processBankAccountUpgrade(interaction, targetTier);
      return;
    }
    
    // Handle loan menu and operations
    if (action === 'loan_menu') {
      await loanMenu(interaction);
      return;
    }
    
    // درخواست وام
    if (action === 'loan_request') {
      await handleLoanRequest(interaction);
      return;
    }
    
    // محاسبه‌گر وام
    if (action === 'loan_calculator') {
      await handleLoanCalculator(interaction);
      return;
    }
    
    // وضعیت وام
    if (action === 'loan_status') {
      await handleLoanStatus(interaction);
      return;
    }
    
    // بازپرداخت وام
    if (action === 'loan_repay') {
      await handleLoanRepayment(interaction);
      return;
    }
    
    // تاریخچه وام‌ها
    if (action === 'loan_history') {
      await handleLoanHistory(interaction);
      return;
    }
    
    // تأیید اولیه وام
    if (action.startsWith('loan_confirm_')) {
      const amount = parseInt(action.replace('loan_confirm_', ''));
      await handleLoanConfirmation(interaction, amount);
      return;
    }
    
    // تأیید نهایی و دریافت وام
    if (action.startsWith('loan_approve_')) {
      const amount = parseInt(action.replace('loan_approve_', ''));
      await handleLoanApproval(interaction, amount);
      return;
    }
    
    // لغو درخواست وام
    if (action === 'loan_cancel') {
      await loanMenu(interaction);
      return;
    }
    
    // Handle deposit menu
    if (action === 'deposit_menu') {
      await economyMenu(interaction);
      return;
    }
    
    // Handle withdraw menu
    if (action === 'withdraw_menu') {
      await economyMenu(interaction);
      return;
    }
    
    // Handle transfer menu
    if (action === 'transfer_menu') {
      await economyMenu(interaction);
      return;
    }
    
    // Handle bank transaction history or transaction_history
    if (action === 'bank_history' || action === 'transaction_history') {
      // دریافت کاربر
      const user = await storage.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({ content: '❌ کاربر یافت نشد!', ephemeral: true });
        return;
      }
      
      // دریافت تراکنش‌های کاربر
      const transactions = await storage.getUserTransactions(user.id);
      
      // تعیین نوع نمایش تراکنش‌ها
      const showBankOnly = action === 'bank_history';
      
      // واردسازی ابزارهای مدیریت تراکنش‌ها
      const { createTransactionHistoryEmbed, createTransactionControlButtons, TransactionFilters, TransactionIcons } = require('../utils/transactionUtils');
      const { formatNumber } = require('../utils/formatters');
      
      // تعیین فیلتر مناسب
      const filter = showBankOnly ? TransactionFilters.bankTransactions : null;
      
      // انتخاب آیکون مناسب
      const thumbnailUrl = showBankOnly ? TransactionIcons.bank : TransactionIcons.all;
      
      // ایجاد امبد برای نمایش تراکنش‌ها با استفاده از ابزار جدید
      const embed = createTransactionHistoryEmbed(
        transactions,
        showBankOnly ? '📋 تاریخچه تراکنش‌های بانکی' : '📊 تاریخچه تمام تراکنش‌ها',
        showBankOnly ? 'آخرین تراکنش‌های شما در سیستم بانکی' : 'گزارش کامل تمام فعالیت‌های مالی اخیر شما',
        thumbnailUrl,
        interaction.user.username,
        filter,
        {
          showFee: true,
          showDescription: true,
          showDetails: true,
          maxTransactions: showBankOnly ? 10 : 15
        }
      );
      
      // اضافه کردن خلاصه وضعیت مالی در ابتدای امبد (فقط برای تاریخچه کامل)
      if (!showBankOnly && transactions.length > 0) {
        // اضافه کردن فیلد خلاصه مالی در اول امبد
        embed.spliceFields(0, 0, {
          name: '💰 خلاصه وضعیت مالی',
          value: `💳 کیف پول: \`${formatNumber(user.wallet)} Ccoin\`\n🏦 بانک: \`${formatNumber(user.bank)} Ccoin\`\n💎 کریستال: \`${formatNumber(user.crystals)}\``,
          inline: false
        });
      }
      
      // ایجاد دکمه‌های کنترل
      const row = createTransactionControlButtons(
        showBankOnly ? 'bank_menu' : 'economy',
        showBankOnly ? '🔙 بازگشت به منوی بانک' : '🔙 بازگشت به منوی اقتصاد',
        showBankOnly ? 'transaction_history' : 'bank_history',
        showBankOnly ? '📊 نمایش همه تراکنش‌ها' : '🏦 فقط تراکنش‌های بانکی'
      );
      
      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
      return;
    }
    
    // Handle transfer history button (نمایش تاریخچه انتقال‌های سکه)
    if (action === 'transfer_history') {
      // دریافت کاربر
      const user = await storage.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({ content: '❌ کاربر یافت نشد!', ephemeral: true });
        return;
      }
      
      // دریافت تراکنش‌های کاربر
      const transactions = await storage.getUserTransactions(user.id);
      
      // ایجاد امبد برای نمایش تراکنش‌های انتقال وجه
      const embed = new EmbedBuilder()
        .setColor('#32CD32')
        .setTitle('📋 تاریخچه انتقال‌های سکه')
        .setDescription('آخرین تراکنش‌های انتقال سکه شما')
        .setThumbnail('https://img.icons8.com/fluency/48/money-transfer.png')
        .setFooter({ text: `${interaction.user.username} | صفحه 1` })
        .setTimestamp();
      
      // فیلتر کردن تراکنش‌های انتقال
      const transferTransactions = transactions.filter((t: Transaction) => 
        ['transfer_sent', 'transfer_received'].includes(t.type)
      ).slice(0, 10);
      
      if (transferTransactions.length === 0) {
        embed.setDescription('شما هنوز هیچ انتقال سکه‌ای انجام نداده‌اید یا دریافت نکرده‌اید.');
      } else {
        // وارد کردن توابع فرمت‌کننده از فایل formatters
        const { getTransactionTypeInfo, formatTransactionAmount, formatNumber } = require('../utils/formatters');
        
        transferTransactions.forEach((tx: Transaction, index: number) => {
          // دریافت اطلاعات نمایشی تراکنش
          const typeInfo = getTransactionTypeInfo(tx.type);
          
          const date = new Date(tx.timestamp).toLocaleDateString('fa-IR');
          const time = new Date(tx.timestamp).toLocaleTimeString('fa-IR');
          
          // فرمت کردن مبلغ
          const amountStr = formatTransactionAmount(tx.amount, tx.type);
          
          // ایجاد متن اضافی
          const detailText = tx.description && tx.description.trim() ? `**توضیحات:** ${tx.description}\n` : '';
          const personText = tx.type === 'transfer_sent' 
            ? `**گیرنده:** ${tx.recipientName || 'ناشناس'}` 
            : `**فرستنده:** ${tx.senderName || 'ناشناس'}`;
            
          embed.addFields({
            name: `${typeInfo.emoji} ${typeInfo.label} - ${date} ${time}`,
            value: `${typeInfo.color} **${amountStr}** Ccoin\n` +
                   `${detailText}${personText}\n` +
                   `**شناسه تراکنش:** ${tx.id || 'نامشخص'}`
          });
        });
      }
      
      // دکمه بازگشت
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('transfer_menu')
            .setLabel('🔙 بازگشت به منوی انتقال')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
      return;
    }
    
    // Handle transfer user button (نمایش مودال انتقال سکه)
    if (action === 'transfer_user') {
      await transferUser(interaction);
      return;
    }
    
    // Handle exchange actions
    if (action === 'exchange_10') {
      await handleExchange(interaction, 10);
      return;
    }
    
    if (action === 'exchange_50') {
      await handleExchange(interaction, 50);
      return;
    }
    
    if (action === 'exchange_100') {
      await handleExchange(interaction, 100);
      return;
    }
    
    // Handle exchange menu (تبدیل سکه به کریستال)
    if (action === 'exchange') {
      // دریافت کاربر
      const user = await storage.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({ content: '❌ کاربر یافت نشد!', ephemeral: true });
        return;
      }
      
      // ایجاد امبد برای نمایش منوی تبدیل سکه
      const embed = new EmbedBuilder()
        .setColor('#9932CC')
        .setTitle('💎 تبدیل سکه به کریستال')
        .setDescription('کریستال ارز ویژه Ccoin است که با آن می‌توانید آیتم‌های منحصر به فرد خریداری کنید')
        .setThumbnail('https://img.icons8.com/fluency/48/exchange.png') // آیکون exchange برای تبدیل ارز
        .addFields(
          { name: '💳 موجودی کیف پول', value: `${user.wallet} Ccoin`, inline: true },
          { name: '💎 موجودی کریستال', value: `${user.crystals}`, inline: true },
          { name: '📊 نرخ تبدیل', value: '1000 Ccoin = 10 کریستال', inline: true },
          { name: '💸 کارمزد تبدیل', value: '5%', inline: true },
          { name: '🔥 تخفیف ویژه', value: '۱۰۰ کریستال با ۵٪ تخفیف: فقط ۱۱۸٬۷۵۰ سکه (به جای ۱۲۵٬۰۰۰)', inline: false },
          { name: '⚠️ نکته مهم', value: 'تبدیل سکه به کریستال غیرقابل بازگشت است!\nبا کریستال می‌توانید آیتم‌های ویژه از فروشگاه خریداری کنید.' }
        )
        .setFooter({ text: `${interaction.user.username} | کریستال‌ها قابل انتقال به کاربران دیگر نیستند` })
        .setTimestamp();
      
      // دکمه‌های تبدیل
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('exchange_10')
            .setLabel('💎 تبدیل به 10 کریستال')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(user.wallet < 12500), // 12500 (نرخ جدید)
          new ButtonBuilder()
            .setCustomId('exchange_50')
            .setLabel('💎 تبدیل به 50 کریستال')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(user.wallet < 62500), // 62500 (نرخ جدید)
          new ButtonBuilder()
            .setCustomId('exchange_100')
            .setLabel('💎 تبدیل به 100 کریستال')
            .setStyle(ButtonStyle.Success)
            .setDisabled(user.wallet < 118750), // 125,000 - 5% تخفیف
          new ButtonBuilder()
            .setCustomId('economy')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
      return;
    }
    
    // Handle stocks menu
    if (action === 'stocks') {
      const subMenu = params[0] || 'main';
      await stocksMenu(interaction, subMenu);
      return;
    }
    
    // Handle stocks menu actions
    if (action === 'stocks_market') {
      await stocksMenu(interaction, 'market');
      return;
    }
    
    // Handle robbery menu buttons
    if (action === 'rob_radar') {
      // رادار دزدی - اسکن کاربران برای دزدی
      const users = await storage.getAllUsers();
      const potentialTargets = users.filter(u => 
        u.discordId !== interaction.user.id && 
        u.wallet > 0
      );
      
      // انتخاب 3 تا 5 کاربر تصادفی از بین کاربران با کیف پول غیر خالی
      const targets = [];
      const usedIndexes = new Set();
      const targetCount = Math.min(5, potentialTargets.length);
      
      for (let i = 0; i < targetCount; i++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * potentialTargets.length);
        } while (usedIndexes.has(randomIndex));
        
        usedIndexes.add(randomIndex);
        targets.push(potentialTargets[randomIndex]);
      }
      
      // ساخت دکمه‌های انتخاب هدف
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      let currentRow = new ActionRowBuilder<ButtonBuilder>();
      
      targets.forEach((target, index) => {
        currentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`rob_target_${target.id}`)
            .setLabel(`🎯 ${target.username}`)
            .setStyle(ButtonStyle.Danger)
        );
        
        // حداکثر 3 دکمه در هر ردیف
        if ((index + 1) % 3 === 0 || index === targets.length - 1) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder<ButtonBuilder>();
        }
      });
      
      // افزودن دکمه بازگشت
      const backRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      rows.push(backRow);
      
      const embed = new EmbedBuilder()
        .setColor('#800080')
        .setTitle('📡 رادار دزدی')
        .setDescription('🔍 کاربران زیر برای دزدی شناسایی شدند:')
        .setThumbnail('https://img.icons8.com/fluency/48/radar.png')
        .setTimestamp();
      
      if (targets.length > 0) {
        targets.forEach((target, index) => {
          embed.addFields({ 
            name: `${index + 1}️⃣ ${target.username}`, 
            value: `موجودی کیف پول: ${target.wallet} Ccoin`, 
            inline: true 
          });
        });
        
        embed.setFooter({ text: '✅ برای انتخاب هدف، روی دکمه با نام کاربر کلیک کنید!' });
      } else {
        embed.setDescription('⚠️ هیچ کاربر مناسبی برای دزدی پیدا نشد! بعداً دوباره امتحان کنید.');
      }
      
      try {
        await interaction.update({ embeds: [embed], components: rows });
      } catch (e) {
        await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
      }
      return;
    }
    
    if (action === 'rob_help') {
      // راهنمای دزدی
      const helpEmbed = new EmbedBuilder()
        .setColor('#800080')
        .setTitle('📘 راهنمای دزدی')
        .setDescription('در این بخش می‌توانید از کاربران دیگر Ccoin دزدی کنید.')
        .setThumbnail('https://img.icons8.com/fluency/48/help.png') // آیکون help برای راهنما
        .addFields(
          { name: '📡 رادار', value: 'کاربران را برای دزدی اسکن می‌کند و سه تا پنج هدف تصادفی نمایش می‌دهد.', inline: false },
          { name: '📊 آماردزدی', value: 'آمار دزدی‌های شما را نمایش می‌دهد.', inline: false },
          { name: '🎭 تغییر چهره', value: 'با هزینه 50 کریستال، شانس موفقیت دزدی را افزایش می‌دهد.', inline: false },
          { name: '🛡️ آیتم‌های دزدی', value: 'آیتم‌های مخصوص دزدی را مشاهده و مدیریت کنید.', inline: false },
          { name: '⚠️ نکات مهم', value: 'حداکثر مقدار دزدی 100 Ccoin است.\nدر صورت شکست، 200 Ccoin جریمه می‌شوید.\nبعد از هر دزدی، 4 ساعت باید صبر کنید.', inline: false }
        )
        .setFooter({ text: 'برای بازگشت به منوی دزدی، دکمه بازگشت را بزنید.' })
        .setTimestamp();
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [helpEmbed], components: [row] });
        } catch (e) {
          await interaction.reply({ embeds: [helpEmbed], components: [row], ephemeral: true });
        }
      } else {
        await interaction.reply({ embeds: [helpEmbed], components: [row], ephemeral: true });
      }
      return;
    }
    
    if (action === 'rob_stats') {
      // آمار دزدی
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        await interaction.reply({
          content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
          ephemeral: true
        });
        return;
      }
      
      // شمارش تعداد تراکنش‌های سرقت
      const transactions = await storage.getUserTransactions(user.id);
      const successfulRobs = transactions.filter(t => t.type === 'steal_success').length;
      const failedRobs = transactions.filter(t => t.type === 'steal_failed').length;
      const totalRobs = successfulRobs + failedRobs;
      
      // محاسبه مجموع مبالغ دزدیده شده و جریمه‌ها
      const totalStolen = transactions
        .filter(t => t.type === 'steal_success')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalPenalties = transactions
        .filter(t => t.type === 'steal_failed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const netProfit = totalStolen - totalPenalties;
      
      // ایجاد Embed آمار
      const statsEmbed = new EmbedBuilder()
        .setColor('#800080')
        .setTitle('📊 آمار دزدی')
        .setThumbnail('https://img.icons8.com/fluency/48/statistics.png') // آیکون statistics برای آمار
        .setTimestamp();
      
      if (totalRobs > 0) {
        statsEmbed.addFields(
          { name: '🕵️ تعداد کل دزدی‌ها', value: `${totalRobs}`, inline: true },
          { name: '✅ دزدی‌های موفق', value: `${successfulRobs}`, inline: true },
          { name: '❌ دزدی‌های ناموفق', value: `${failedRobs}`, inline: true },
          { name: '💰 کل Ccoin دزدیده شده', value: `${totalStolen} Ccoin`, inline: true },
          { name: '💸 کل جریمه‌ها', value: `${totalPenalties} Ccoin`, inline: true },
          { name: '📈 سود/زیان خالص', value: `${netProfit} Ccoin`, inline: true }
        );
        
        const successRate = totalRobs > 0 ? ((successfulRobs / totalRobs) * 100).toFixed(1) : '0';
        statsEmbed.setDescription(`نرخ موفقیت شما در دزدی: ${successRate}%`);
      } else {
        statsEmbed.setDescription('⚠️ هنوز هیچ دزدی‌ای انجام نداده‌اید! با رادار شروع کنید!');
      }
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('🔙 بازگشت')
            .setStyle(ButtonStyle.Secondary)
        );
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [statsEmbed], components: [row] });
        } catch (e) {
          await interaction.reply({ embeds: [statsEmbed], components: [row], ephemeral: true });
        }
      } else {
        await interaction.reply({ embeds: [statsEmbed], components: [row], ephemeral: true });
      }
      return;
    }
    
    if (action === 'rob_select') {
      // نمایش فرم انتخاب هدف دزدی
      await selectRobberyTarget(interaction);
      return;
    }
    
    if (action.startsWith('rob_target_')) {
      // پردازش انتخاب هدف دزدی از لیست رادار
      const targetId = parseInt(action.replace('rob_target_', ''));
      if (isNaN(targetId)) {
        await interaction.reply({
          content: '❌ شناسه کاربر هدف نامعتبر است!',
          ephemeral: true
        });
        return;
      }
      
      // دریافت اطلاعات کاربر هدف
      const targetUser = await storage.getUser(targetId);
      if (!targetUser) {
        await interaction.reply({
          content: '❌ کاربر هدف یافت نشد!',
          ephemeral: true
        });
        return;
      }
      
      // نمایش تأییدیه دزدی
      const confirmEmbed = new EmbedBuilder()
        .setColor('#800080')
        .setTitle('🔒 تأیید دزدی')
        .setDescription(`آیا مطمئن هستید که می‌خواهید از **${targetUser.username}** دزدی کنید؟`)
        .addFields(
          { name: '👛 موجودی کیف پول هدف', value: `${targetUser.wallet} Ccoin`, inline: true },
          { name: '💰 حداکثر مقدار قابل دزدی', value: `${Math.min(targetUser.wallet, MAX_ROB_AMOUNT)} Ccoin`, inline: true },
          { name: '⚠️ هشدار', value: 'در صورت شکست، 200 Ccoin جریمه خواهید شد!', inline: false }
        )
        .setThumbnail('https://img.icons8.com/fluency/48/warning-shield.png')
        .setTimestamp();
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rob_confirm_${targetId}`)
            .setLabel('✅ تأیید دزدی')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('❌ انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.update({ embeds: [confirmEmbed], components: [row] });
      return;
    }
    
    if (action.startsWith('rob_confirm_')) {
      // پردازش تأیید دزدی
      const targetId = parseInt(action.replace('rob_confirm_', ''));
      if (isNaN(targetId)) {
        await interaction.reply({
          content: '❌ شناسه کاربر هدف نامعتبر است!',
          ephemeral: true
        });
        return;
      }
      
      // انجام دزدی
      await handleRobbery(interaction, targetId);
      return;
    }
    
    if (action === 'rob_cancel') {
      // لغو دزدی
      await robberyMenu(interaction);
      return;
    }
    
    if (action === 'rob_items') {
      // آیتم‌های دزدی
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        await interaction.reply({
          content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
          ephemeral: true
        });
        return;
      }
      
      // دریافت آیتم‌های مرتبط با دزدی
      const items = await storage.getAllItems();
      const robberyItems = items.filter(item => 
        (item.type === 'robbery' || item.type === 'tool') && 
        item.effects && typeof item.effects === 'object' && 
        'robberyChance' in (item.effects as any)
      );
      
      // دریافت آیتم‌های کاربر
      const inventoryItems = await storage.getInventoryItems(user.id);
      
      // ایجاد Embed آیتم‌ها
      const itemsEmbed = new EmbedBuilder()
        .setColor('#800080')
        .setTitle('🛡️ آیتم‌های دزدی')
        .setDescription('آیتم‌های مخصوص دزدی که می‌توانید از فروشگاه خریداری کنید:')
        .setThumbnail('https://img.icons8.com/fluency/48/open-box.png') // آیکون open-box برای آیتم‌ها
        .setTimestamp();
      
      if (robberyItems.length > 0) {
        robberyItems.forEach(item => {
          const userHasItem = inventoryItems.some(invItem => invItem.item.id === item.id);
          const itemEffect = item.effects ? `(افزایش شانس: ${(item.effects as any).robberyChance * 100}%)` : '';
          
          itemsEmbed.addFields({
            name: `${userHasItem ? '✅' : '⬜'} ${item.name}`,
            value: `قیمت: ${item.price} Ccoin یا ${item.crystalPrice} کریستال\n${item.description} ${itemEffect}`,
            inline: false
          });
        });
      } else {
        itemsEmbed.setDescription('هیچ آیتم مخصوص دزدی یافت نشد!');
      }
      
      const rows = [
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('shop')
              .setLabel('🛒 فروشگاه')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('inventory')
              .setLabel('🎒 کوله پشتی')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('robbery')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Secondary)
          )
      ];
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [itemsEmbed], components: rows });
        } catch (e) {
          await interaction.reply({ embeds: [itemsEmbed], components: rows, ephemeral: true });
        }
      } else {
        await interaction.reply({ embeds: [itemsEmbed], components: rows, ephemeral: true });
      }
      return;
    }
    
    if (action === 'rob_disguise') {
      // تغییر چهره - افزایش شانس موفقیت برای یک دزدی
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        await interaction.reply({
          content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
          ephemeral: true
        });
        return;
      }
      
      if (user.crystals < 50) {
        await interaction.reply({
          content: '❌ شما به 50 کریستال برای تغییر چهره نیاز دارید!',
          ephemeral: true
        });
        return;
      }
      
      // بررسی زمان دزدی
      const now = new Date();
      const lastRob = user.lastRob ? new Date(user.lastRob) : null;
      const canRob = !lastRob || (now.getTime() - lastRob.getTime() >= ROB_COOLDOWN);
      
      if (!canRob) {
        await interaction.reply({
          content: '❌ شما باید ابتدا منتظر پایان کول‌داون دزدی بمانید!',
          ephemeral: true
        });
        return;
      }
      
      // نمایش تایید برای استفاده از تغییر چهره
      const confirmEmbed = new EmbedBuilder()
        .setColor('#800080')
        .setTitle('🎭 تغییر چهره')
        .setDescription('با استفاده از تغییر چهره، شانس موفقیت دزدی بعدی شما 25% افزایش می‌یابد.')
        .addFields(
          { name: '💎 هزینه', value: '50 کریستال', inline: true },
          { name: '💎 موجودی شما', value: `${user.crystals} کریستال`, inline: true },
          { name: '⚠️ توجه', value: 'این افزایش شانس فقط برای یک بار دزدی معتبر است.', inline: false }
        )
        .setThumbnail('https://img.icons8.com/fluency/48/theater-mask.png') // آیکون theater-mask برای تغییر چهره
        .setTimestamp();
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('rob_disguise_confirm')
            .setLabel('✅ تایید و پرداخت 50 کریستال')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('❌ انصراف')
            .setStyle(ButtonStyle.Danger)
        );
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [confirmEmbed], components: [row] });
        } catch (e) {
          await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
        }
      } else {
        await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
      }
      return;
    }
    
    if (action === 'rob_disguise_confirm') {
      // اجرای تغییر چهره
      const user = await storage.getUserByDiscordId(interaction.user.id);
      
      if (!user) {
        await interaction.reply({
          content: 'شما ابتدا باید یک حساب ایجاد کنید. از دستور /menu استفاده کنید.',
          ephemeral: true
        });
        return;
      }
      
      if (user.crystals < 50) {
        await interaction.reply({
          content: '❌ شما به 50 کریستال برای تغییر چهره نیاز دارید!',
          ephemeral: true
        });
        return;
      }
      
      // کسر کریستال و اعمال بافر روی شانس دزدی
      await storage.addCrystals(user.id, -50);
      
      // افزودن آیتم موقت تغییر چهره به کوله پشتی (با اثر +25% شانس)
      await storage.addItemToInventory(user.id, -999, 1); // آیدی منفی برای آیتم مجازی
      
      const successEmbed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('✅ تغییر چهره موفق!')
        .setDescription('تغییر چهره با موفقیت انجام شد. شانس موفقیت دزدی بعدی شما 25% افزایش یافت!')
        .setThumbnail('https://img.icons8.com/fluency/48/task-completed.png') // آیکون task-completed برای موفقیت
        .addFields(
          { name: '💎 موجودی جدید کریستال', value: `${user.crystals - 50} کریستال`, inline: true },
          { name: '🎯 شانس جدید موفقیت', value: '65% (40% + 25%)', inline: true }
        )
        .setFooter({ text: 'اکنون می‌توانید با خیال راحت‌تر دزدی کنید!' })
        .setTimestamp();
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('robbery')
            .setLabel('🔙 بازگشت به منوی دزدی')
            .setStyle(ButtonStyle.Secondary)
        );
      
      if ('update' in interaction && typeof interaction.update === 'function') {
        try {
          await interaction.update({ embeds: [successEmbed], components: [row] });
        } catch (e) {
          await interaction.reply({ embeds: [successEmbed], components: [row], ephemeral: true });
        }
      } else {
        await interaction.reply({ embeds: [successEmbed], components: [row], ephemeral: true });
      }
      return;
    }

    if (action === 'stocks_portfolio') {
      await stocksMenu(interaction, 'portfolio');
      return;
    }
    
    if (action === 'stocks_info') {
      await stocksMenu(interaction, 'info');
      return;
    }
    
    if (action === 'stocks_analysis') {
      await stocksMenu(interaction, 'analysis');
      return;
    }
    
    if (action === 'stocks_history') {
      await handleStockHistory(interaction);
      return;
    }
    
    // Handle lottery menu
    if (action === 'lottery') {
      const subMenu = params[0] || 'main';
      await lotteryMenu(interaction, subMenu);
      return;
    }
    
    // Handle lottery menu actions
    if (action === 'lottery_active') {
      await lotteryMenu(interaction, 'active');
      return;
    }
    
    if (action === 'lottery_history') {
      await lotteryMenu(interaction, 'history');
      return;
    }
    
    if (action === 'lottery_info') {
      await lotteryMenu(interaction, 'info');
      return;
    }
    
    // ---- منوهای جدید اضافه شده ----
    
    // منوی تورنمنت‌ها
    if (action === 'tournaments') {
      await tournamentsMenu(interaction);
      return;
    }
    
    // پیوستن به تورنمنت
    if (action === 'join_tournament') {
      const tournamentId = params[0];
      await processJoinTournament(interaction, tournamentId);
      return;
    }
    
    // منوی دستاوردها
    if (action === 'achievements') {
      await achievementsMenu(interaction);
      return;
    }
    
    // مشاهده دستاوردهای یک دسته خاص
    if (action === 'achievements_category') {
      const category = params[0];
      await showCategoryAchievements(interaction, category);
      return;
    }
    
    // نمایش دستاوردهای کسب شده
    if (action === 'achievements_earned') {
      await showEarnedAchievements(interaction);
      return;
    }
    
    // نمایش دستاوردهای در حال پیشرفت
    if (action === 'achievements_progress') {
      await showProgressAchievements(interaction);
      return;
    }
    
    // منوی فصل‌ها
    if (action === 'seasons') {
      await seasonsMenu(interaction);
      return;
    }
    
    // منوی جهان‌های موازی
    if (action === 'parallel_worlds') {
      await parallelWorldsMenu(interaction);
      return;
    }
    
    // منوی حیوانات خانگی
    if (action === 'pets') {
      await petMenu(interaction);
      return;
    }
    
    // Handle giveaway bridge menu
    if (action === 'giveaway_bridge') {
      await giveawayBridgeMenu(interaction);
      return;
    }
    
    // Handle giveaway bridge actions
    if (action === 'giveaway_buy_tickets') {
      // Show modal for ticket purchase
      const modal = new ModalBuilder()
        .setCustomId('buy_giveaway_tickets')
        .setTitle('خرید بلیط قرعه‌کشی');
      
      const ticketQuantityInput = new TextInputBuilder()
        .setCustomId('ticket_quantity')
        .setLabel('تعداد بلیط')
        .setPlaceholder('تعداد بلیط مورد نظر را وارد کنید')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(3);
      
      const row = new ActionRowBuilder<TextInputBuilder>().addComponents(ticketQuantityInput);
      modal.addComponents(row);
      
      await interaction.showModal(modal);
      return;
    }
    
    if (action === 'giveaway_check_balance') {
      await checkGiveawayBalance(interaction);
      return;
    }
    
    // منوی دوستان
    if (action === 'friends') {
      await friendsMainMenu(interaction);
      return;
    }
    
    // بازگشت به منوی دوستان
    if (action === 'friends_menu') {
      await friendsMainMenu(interaction);
      return;
    }
    
    // لیست دوستان
    if (action === 'friends_list') {
      await friendsList(interaction);
      return;
    }
    
    // درخواست‌های دوستی
    if (action === 'friend_requests') {
      await friendRequests(interaction);
      return;
    }
    
    // نمایش جزئیات دوستی
    if (action === 'friend_details') {
      const friendId = params[0];
      await showFriendshipDetails(interaction, friendId);
      return;
    }
    
    // تنظیم بهترین دوست
    if (action === 'best_friend_set') {
      const friendId = params[0];
      await handleBestFriend(interaction, friendId, 'set');
      return;
    }
    
    // حذف بهترین دوست
    if (action === 'best_friend_remove') {
      const friendId = params[0];
      await handleBestFriend(interaction, friendId, 'remove');
      return;
    }
    
    // نمایش فرم ارسال درخواست دوستی
    if (action === 'friend_request_form') {
      await showFriendRequestForm(interaction);
      return;
    }
    
    // ارسال درخواست دوستی (از چت ناشناس و منوی دوستان)
    if (customId.startsWith('send_friend_request_')) {
      const targetUserId = customId.split('_').pop() || '0';
      if (targetUserId) {
        await sendFriendRequest(interaction, targetUserId);
      }
      return;
    }
    
    // نمایش لیست کاربران مسدود شده
    if (action === 'blocked_users') {
      await blockedUsersList(interaction);
      return;
    }
    
    // جستجوی کاربر برای مسدود کردن
    if (action === 'search_to_block') {
      await searchUserToBlock(interaction);
      return;
    }
    
    // لغو عملیات رفع بلاک
    if (action === 'cancel_unblock') {
      await cancelUnblockProcess(interaction);
      return;
    }
    
    // تأیید رفع بلاک کاربر
    if (customId.startsWith('confirm_unblock_')) {
      const targetUserId = customId.replace('confirm_unblock_', '');
      await processUnblockUser(interaction, targetUserId);
      return;
    }
    
    // رفع مسدودیت کاربر
    if (action === 'unblock_user') {
      const blockedUserId = params[0];
      await unblockUser(interaction, blockedUserId);
      return;
    }
    
    // منوی چت ناشناس (از هر منویی)
    if (action === 'anonymous_chat') {
      await AnonymousChatMenu.showMainMenu(interaction);
      return;
    }
    
    // شروع چت ناشناس
    if (action === 'start_anonymous_chat') {
      await AnonymousChatMenu.handleInteraction(interaction);
      return;
    }
    
    // مشاهده چت ناشناس
    if (action === 'view_anonymous_chat') {
      await AnonymousChatMenu.handleInteraction(interaction);
      return;
    }
    
    // پایان چت ناشناس
    if (action === 'end_anonymous_chat') {
      await AnonymousChatMenu.handleInteraction(interaction);
      return;
    }
    
    // منوی چت ناشناس (برای بازگشت به منوی اصلی چت ناشناس)
    if (action === 'anonymous_chat_menu') {
      await AnonymousChatMenu.showMainMenu(interaction);
      return;
    }
    
    // لغو جستجوی چت ناشناس
    if (action === 'cancel_anonymous_chat_search') {
      await AnonymousChatMenu.cancelChatSearch(interaction);
      return;
    }
    
    // فاش کردن هویت در چت ناشناس
    if (action === 'reveal_identity') {
      await AnonymousChatMenu.handleInteraction(interaction);
      return;
    }
    
    // تایید فاش کردن هویت
    if (action === 'confirm_reveal_identity') {
      await AnonymousChatMenu.handleInteraction(interaction);
      return;
    }
    
    // تازه‌سازی چت فعال
    if (action === 'refresh_chat') {
      await AnonymousChatMenu.handleInteraction(interaction);
      return;
    }
    
    // منوی اعلان‌های شخصی
    if (action === 'notifications_menu') {
      await personalNotificationsMenu(interaction);
      return;
    }
    
    // منوی بازار
    if (action === 'market_menu') {
      const response = await showMarketMenu(interaction.user.id, interaction.user.username);
      await interaction.update(response);
      return;
    }
    
    // بازار عادی
    if (action === 'market_regular') {
      // نمایش بازار عادی با صفحه 0 (اولین صفحه)
      const response = await showRegularMarket(interaction.user.id, interaction.user.username);
      await interaction.update(response);
      return;
    }
    
    // بازار سیاه
    if (action === 'market_black') {
      // نمایش بازار سیاه با صفحه 0 (اولین صفحه)
      const response = await showBlackMarket(interaction.user.id, interaction.user.username);
      await interaction.update(response);
      return;
    }
    
    // آگهی‌های من
    if (action === 'market_my_listings') {
      // نمایش آگهی‌های کاربر با صفحه 0 (اولین صفحه)
      const response = await showMyListings(interaction.user.id, interaction.user.username);
      await interaction.update(response);
      return;
    }
    
    // ثبت آگهی جدید
    if (action === 'market_new_listing') {
      // شروع فرآیند ثبت آگهی جدید
      const response = await startNewListing(interaction.user.id, interaction.user.username);
      await interaction.update(response);
      return;
    }
    
    // صفحه‌بندی بازار عادی
    if (action.startsWith('market_regular_page_')) {
      const page = parseInt(action.replace('market_regular_page_', ''));
      const response = await showRegularMarket(interaction.user.id, interaction.user.username, page);
      await interaction.update(response);
      return;
    }
    
    // صفحه‌بندی بازار سیاه
    if (action.startsWith('market_black_page_')) {
      const page = parseInt(action.replace('market_black_page_', ''));
      const response = await showBlackMarket(interaction.user.id, interaction.user.username, page);
      await interaction.update(response);
      return;
    }
    
    // صفحه‌بندی آگهی‌های من
    if (action.startsWith('market_mylistings_page_')) {
      const page = parseInt(action.replace('market_mylistings_page_', ''));
      const response = await showMyListings(interaction.user.id, interaction.user.username, page);
      await interaction.update(response);
      return;
    }
    
    // خرید آیتم از بازار
    if (action === 'market_buy_item') {
      // نمایش مودال خرید
      const modal = new ModalBuilder()
        .setCustomId('market_buy_modal')
        .setTitle('🛒 خرید آیتم از بازار');
      
      // فیلد شناسه آیتم
      const listingIdInput = new TextInputBuilder()
        .setCustomId('listing_id')
        .setLabel('شناسه آیتم (کپی از آگهی)')
        .setPlaceholder('مثال: 6126f3c6e8b7a2c9f3e8b7a2')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      
      // فیلد تعداد
      const quantityInput = new TextInputBuilder()
        .setCustomId('quantity')
        .setLabel('تعداد')
        .setPlaceholder('مثال: 1')
        .setValue('1')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      
      // افزودن فیلدها به مودال
      const listingIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(listingIdInput);
      const quantityRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput);
      
      modal.addComponents(listingIdRow, quantityRow);
      
      // نمایش مودال
      await interaction.showModal(modal);
      return;
    }
    
    // حذف آگهی
    if (action === 'market_remove_listing') {
      // نمایش مودال حذف آگهی
      const modal = new ModalBuilder()
        .setCustomId('market_remove_modal')
        .setTitle('🗑️ حذف آگهی');
      
      // فیلد شناسه آگهی
      const listingIdInput = new TextInputBuilder()
        .setCustomId('listing_id')
        .setLabel('شناسه آگهی (کپی از آگهی)')
        .setPlaceholder('مثال: 6126f3c6e8b7a2c9f3e8b7a2')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      
      // افزودن فیلد به مودال
      const listingIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(listingIdInput);
      
      modal.addComponents(listingIdRow);
      
      // نمایش مودال
      await interaction.showModal(modal);
      return;
    }
    
    // ویرایش آگهی
    if (action === 'market_edit_listing') {
      // نمایش مودال ویرایش آگهی
      const modal = new ModalBuilder()
        .setCustomId('market_edit_modal')
        .setTitle('✏️ ویرایش آگهی');
      
      // فیلد شناسه آگهی
      const listingIdInput = new TextInputBuilder()
        .setCustomId('listing_id')
        .setLabel('شناسه آگهی (کپی از آگهی)')
        .setPlaceholder('مثال: 6126f3c6e8b7a2c9f3e8b7a2')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      
      // فیلد قیمت جدید
      const priceInput = new TextInputBuilder()
        .setCustomId('price')
        .setLabel('قیمت جدید (به سکه)')
        .setPlaceholder('مثال: 1000')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      
      // فیلد توضیحات
      const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('توضیحات جدید (اختیاری)')
        .setPlaceholder('توضیحات خود را وارد کنید')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);
      
      // افزودن فیلدها به مودال
      const listingIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(listingIdInput);
      const priceRow = new ActionRowBuilder<TextInputBuilder>().addComponents(priceInput);
      const descriptionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
      
      modal.addComponents(listingIdRow, priceRow, descriptionRow);
      
      // نمایش مودال
      await interaction.showModal(modal);
      return;
    }
    
    // فعال‌سازی اعلان‌ها
    if (action === 'enable_notifications') {
      await toggleNotifications(interaction, true);
      return;
    }
    
    // غیرفعال‌سازی اعلان‌ها
    if (action === 'disable_notifications') {
      await toggleNotifications(interaction, false);
      return;
    }
    
    // تنظیمات پیشرفته اعلان‌ها
    if (action === 'notification_settings') {
      await showAdvancedNotificationSettings(interaction);
      return;
    }
    
    // تغییر وضعیت اعلان چت خصوصی
    if (action === 'toggle_private_chat') {
      await toggleNotificationType(interaction, 'private_chat');
      return;
    }
    
    // تغییر وضعیت اعلان چت ناشناس
    if (action === 'toggle_anonymous_chat') {
      await toggleNotificationType(interaction, 'anonymous_chat');
      return;
    }
    
    // تغییر وضعیت اعلان درخواست دوستی
    if (action === 'toggle_friend_request') {
      await toggleNotificationType(interaction, 'friend_request');
      return;
    }
    
    // تغییر وضعیت اعلان اقتصادی
    if (action === 'toggle_economy') {
      await toggleNotificationType(interaction, 'economy');
      return;
    }
    
    // ارسال اعلان تست برای کاربر
    if (action === 'test_notification') {
      await sendTestNotification(interaction);
      return;
    }
    
    // Handle other options menu buttons that are not yet implemented
    if (action === 'marketplace' || action === 'calendar') {
      await interaction.reply({
        content: '🔜 این ویژگی هنوز در حال توسعه است و به زودی اضافه خواهد شد!',
        ephemeral: true
      });
      
      // After a short delay, return to main menu
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await mainMenu(interaction, true);
        }
      }, 2000);
      return;
    }
    
    // Handle admin actions
    if (action === 'admin') {
      const category = params[0];
      if (category) {
        await adminMenu(interaction, category);
      } else {
        await adminMenu(interaction);
      }
      return;
    }
    
    // Handle admin menu navigation
    if (action.startsWith('admin_')) {
      // Extract the category from the button ID (e.g., admin_economy -> economy)
      const category = action.replace('admin_', '');
      
      // Handle economy management buttons
      if (action === 'admin_add_coin') {
        await handleAdminAddCoin(interaction);
        return;
      }
      
      if (action === 'admin_remove_coin') {
        await handleAdminRemoveCoin(interaction);
        return;
      }
      
      if (action === 'admin_distribute') {
        await handleAdminDistributeCoin(interaction);
        return;
      }
      
      if (action === 'admin_set_interest') {
        await handleAdminSetInterest(interaction);
        return;
      }
      
      if (action === 'admin_set_tax') {
        await handleAdminSetTax(interaction);
        return;
      }
      
      if (action === 'admin_economy_reset') {
        await adminMenu(interaction, 'economy_reset');
        return;
      }
      
      if (action === 'admin_reset_user_economy') {
        await handleAdminResetUserEconomy(interaction);
        return;
      }
      
      if (action === 'admin_reset_all_economy') {
        await handleAdminResetAllEconomy(interaction);
        return;
      }
      
      // User management buttons
      if (action === 'admin_search_user') {
        await handleAdminSearchUser(interaction);
        return;
      }
      
      if (action === 'admin_ban_user') {
        await handleAdminBanUser(interaction);
        return;
      }
      
      if (action === 'admin_reset_user') {
        await handleAdminResetUser(interaction);
        return;
      }
      
      if (action === 'admin_top_users') {
        await handleAdminTopUsers(interaction);
        return;
      }
      
      if (action === 'admin_inactive_users') {
        await handleAdminInactiveUsers(interaction);
        return;
      }
      
      if (action === 'admin_user_logs') {
        await handleAdminUserLogs(interaction);
        return;
      }
      
      // Item management buttons - NEW
      if (action === 'admin_items') {
        await itemManagementMenu(interaction);
        return;
      }
      
      // Item management sub-menus
      if (action === 'admin_add_item') {
        // ایجاد فرم افزودن آیتم جدید
        const { showAddItemForm } = await import('../components/adminMenuExtended');
        await showAddItemForm(interaction);
        return;
      }
      
      if (action === 'admin_edit_item') {
        // ایجاد فرم ویرایش آیتم
        const { showEditItemSelectForm } = await import('../components/adminMenuExtended');
        await showEditItemSelectForm(interaction);
        return;
      }
      
      if (action === 'admin_remove_item') {
        // حذف آیتم
        const { showRemoveItemSelectForm } = await import('../components/adminMenuExtended');
        await showRemoveItemSelectForm(interaction);
        return;
      }
      
      if (action === 'admin_list_items') {
        // نمایش لیست آیتم‌ها
        const { showItemsList } = await import('../components/adminMenuExtended');
        await showItemsList(interaction);
        return;
      }
      
      if (action === 'admin_item_stats') {
        // نمایش آمار فروش آیتم‌ها
        await itemManagementMenu(interaction); // موقتاً برگشت به منوی اصلی آیتم‌ها
        return;
      }
      
      if (action === 'admin_item_categories') {
        // مدیریت دسته‌بندی‌های آیتم‌ها
        await itemManagementMenu(interaction); // موقتاً برگشت به منوی اصلی آیتم‌ها
        return;
      }
      
      if (action === 'admin_featured_items') {
        // مدیریت آیتم‌های ویژه
        await itemManagementMenu(interaction); // موقتاً برگشت به منوی اصلی آیتم‌ها
        return;
      }
      
      if (action === 'admin_item_prices') {
        // مدیریت قیمت‌گذاری آیتم‌ها
        await itemManagementMenu(interaction); // موقتاً برگشت به منوی اصلی آیتم‌ها
        return;
      }
      
      // Quest management buttons - NEW
      if (action === 'admin_quests') {
        await questManagementMenu(interaction);
        return;
      }
      
      // Clan management buttons - NEW
      if (action === 'admin_clans') {
        await clanManagementMenu(interaction);
        return;
      }
      
      // Broadcast announcements - NEW
      if (action === 'admin_broadcast') {
        await broadcastMenu(interaction);
        return;
      }
      
      // Backup system - NEW
      if (action === 'admin_backup') {
        await backupMenu(interaction);
        return;
      }
      
      // Bot settings - NEW
      if (action === 'admin_bot_settings') {
        await botSettingsMenu(interaction);
        return;
      }
      
      // مدیریت دکمه‌های تنظیمات هوش مصنوعی
      if (action === 'admin_ai_settings') {
        await showAISettingsMenu(interaction);
        return;
      }
      
      // تغییر سرویس هوش مصنوعی به OpenAI
      if (action === 'admin_switch_to_openai') {
        await handleSwitchAIService(interaction, 'openai');
        return;
      }
      
      // تغییر سرویس هوش مصنوعی به Hugging Face
      if (action === 'admin_switch_to_huggingface') {
        await handleSwitchAIService(interaction, 'huggingface');
        return;
      }
      
      // تغییر سرویس هوش مصنوعی به CCOIN AI
      if (action === 'admin_switch_to_googleai') {
        await handleSwitchAIService(interaction, 'googleai');
        return;
      }
      
      // تغییر سرویس هوش مصنوعی به OpenRouter
      if (action === 'admin_switch_to_openrouter') {
        await handleSwitchAIService(interaction, 'openrouter');
        return;
      }
      
      // تغییر سرویس هوش مصنوعی به Grok
      if (action === 'admin_switch_to_grok') {
        await handleSwitchAIService(interaction, 'grok');
        return;
      }
      
      // تست سرویس هوش مصنوعی فعلی
      if (action === 'admin_test_ai') {
        await handleTestAIService(interaction);
        return;
      }
      
      // نمایش وضعیت سرویس هوش مصنوعی
      if (action === 'admin_view_ai_status') {
        await handleViewAIStatus(interaction);
        return;
      }
      
      // Bot Stats - NEW
      if (action === 'admin_stats') {
        await botStatsMenu(interaction);
        return;
      }
      
      // Settings Main Menu - NEW
      if (action === 'admin_settings') {
        // این منو باید گزینه‌های تنظیمات مختلف را نمایش دهد
        // ایجاد امبد تنظیمات
        const embed = new EmbedBuilder()
          .setColor('#FF5733')
          .setTitle('⚙️ تنظیمات ربات Ccoin')
          .setDescription('لطفاً بخش مورد نظر را از تنظیمات انتخاب کنید')
          .setFooter({ text: `مدیر: ${interaction.user.username} | ${new Date().toLocaleString()}` })
          .setThumbnail('https://img.icons8.com/fluency/48/settings.png')
          .setTimestamp();

        // ایجاد دکمه‌های تنظیمات
        const row1 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('admin_settings_general')
              .setLabel('🔧 تنظیمات عمومی')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('admin_settings_economy')
              .setLabel('💰 تنظیمات اقتصاد')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('admin_settings_games')
              .setLabel('🎮 تنظیمات بازی‌ها')
              .setStyle(ButtonStyle.Danger)
          );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('admin_settings_clans')
              .setLabel('🏰 تنظیمات کلن‌ها')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('admin_settings_levels')
              .setLabel('📊 تنظیمات سطح')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('admin_settings_security')
              .setLabel('🔒 تنظیمات امنیت')
              .setStyle(ButtonStyle.Danger)
          );

        const row3 = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('admin_settings_permissions')
              .setLabel('🛡️ مجوزها')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('admin_settings_logging')
              .setLabel('📝 سیستم لاگ')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('admin_menu')
              .setLabel('🔙 بازگشت')
              .setStyle(ButtonStyle.Secondary)
          );

        await interaction.update({
          embeds: [embed],
          components: [row1, row2, row3]
        });
        return;
      }
      
      // Settings menus - NEW
      if (action === 'admin_settings_general' || 
          action === 'admin_settings_economy' ||
          action === 'admin_settings_games' ||
          action === 'admin_settings_clans' ||
          action === 'admin_settings_levels' ||
          action === 'admin_settings_ai' ||
          action === 'admin_settings_security' ||
          action === 'admin_settings_permissions' ||
          action === 'admin_settings_logging') {
        // تشخیص نوع منوی تنظیمات و فراخوانی تابع مربوطه
        const settingType = action.replace('admin_settings_', '');
        
        switch (settingType) {
          case 'general':
            await generalSettingsMenu(interaction);
            break;
          case 'economy':
            await economySettingsMenu(interaction);
            break;
          case 'games':
            await gamesSettingsMenu(interaction);
            break;
          case 'clans':
            await clansSettingsMenu(interaction);
            break;
          case 'levels':
            await levelsSettingsMenu(interaction);
            break;
          case 'security':
            await securitySettingsMenu(interaction);
            break;
          case 'permissions':
            await permissionsSettingsMenu(interaction);
            break;
          case 'logging':
            await loggingSettingsMenu(interaction);
            break;
          case 'ai':
            // ارجاع به منوی جدید تنظیمات هوش مصنوعی
            await showAISettingsMenu(interaction);
            break;
          default:
            await botSettingsMenu(interaction);
        }
        return;
      }
      
      // Stats buttons - NEW
      if (action === 'admin_economy_stats' || 
          action === 'admin_game_stats' ||
          action === 'admin_export_stats') {
        // همه این دکمه‌ها فعلاً به همان منوی آمار اصلی منتقل می‌شوند
        // در نسخه‌های بعدی، می‌توان برای هر کدام بخش مجزا ایجاد کرد
        await botStatsMenu(interaction);
        return;
      }
      
      // If it's a regular category navigation
      if (category === 'menu') {
        // Return to main admin menu
        await adminMenu(interaction);
      } else {
        // Navigate to specific admin submenu
        await adminMenu(interaction, category);
      }
      return;
    }
    
    // Handle log settings
    if (action.startsWith('admin_set_') && action.endsWith('_log')) {
      // Extract the log type from the button ID (e.g., admin_set_transaction_log -> transaction)
      const logType = action.replace('admin_set_', '').replace('_log', '');
      await handleSetLogChannel(interaction, logType);
      return;
    }
    
    // Handle default log channel setting
    if (action === 'admin_set_default_log') {
      await handleSetDefaultLogChannel(interaction);
      return;
    }
    
    // رسیدگی به انتخاب مدل هوش مصنوعی
    if (action === 'ai_model_select') {
      await handleModelSelect(interaction as StringSelectMenuInteraction);
      return;
    }
    
    // رسیدگی به انتخاب سبک پاسخگویی هوش مصنوعی
    if (action === 'ai_style_select') {
      await handleStyleSelect(interaction as StringSelectMenuInteraction);
      return;
    }
    
    // رسیدگی به دکمه تست هوش مصنوعی
    if (action === 'ai_test') {
      await handleTestAI(interaction);
      return;
    }
    
    // رسیدگی به دکمه بازنشانی تنظیمات هوش مصنوعی
    if (action === 'ai_reset') {
      await handleResetAI(interaction);
      return;
    }
    
    // رسیدگی به دکمه راهنمای هوش مصنوعی
    if (action === 'ai_help') {
      await handleAIHelp(interaction);
      return;
    }
    
    // کد مربوط به تنظیمات AI به صورت دکمه‌های admin_ در بالا اضافه شده است
    // لذا این بخش حذف می‌شود تا از تکرار جلوگیری شود
    
    // کد تست لاگ‌ها حذف شد - بهینه‌سازی کد
    
    // Clan resource gathering
    if (action === 'clan_gather') {
      const resourceType = params[0]; // 'materials' or 'labor'
      await handleClanGatherResources(interaction, resourceType);
      return;
    }
    
    // Clan building upgrade
    if (action === 'clan_upgrade_building') {
      const buildingId = params[0]; // 'hq', 'bank', 'barracks', etc.
      await handleClanBuildingUpgrade(interaction, buildingId);
      return;
    }
    
    // Clan start project
    if (action === 'clan_start_project') {
      const projectId = params[0]; // 'training_grounds', 'resource_center', etc.
      await handleClanStartProject(interaction, projectId);
      return;
    }
    
    // Clan contribute to project
    if (action === 'clan_contribute') {
      const projectId = params[0];
      const resourceType = params[1]; // 'coins', 'materials', 'labor'
      await handleClanContributeToProject(interaction, projectId, resourceType);
      return;
    }

    // If no handler matched, reply with an error
    await interaction.reply({
      content: '❌ متأسفانه نتوانستم این دکمه را پردازش کنم. لطفاً دوباره تلاش کنید.',
      ephemeral: true
    });

  } catch (error) {
    console.error('Error handling button interaction:', error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ خطایی هنگام پردازش درخواست شما رخ داد!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ خطایی هنگام پردازش درخواست شما رخ داد!',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error replying to button interaction:', replyError);
    }
  }
}

// Handler for daily reward
async function handleDailyReward(interaction: ButtonInteraction) {
  try {
    // برای جلوگیری از خطای interaction، ابتدا بررسی می‌کنیم که آیا قبلاً پاسخ داده شده است
    if (interaction.replied || interaction.deferred) {
      console.log('Daily reward interaction already replied or deferred');
      return;
    }

    // بجای defer، مستقیماً به interaction پاسخ می‌دهیم تا از خطای timeout جلوگیری شود
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // بررسی آیا جایزه روزانه قبلاً دریافت شده است
    const now = new Date();
    const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
    
    if (lastDaily && now.getTime() - lastDaily.getTime() < 24 * 60 * 60 * 1000) {
      const nextReset = new Date(lastDaily.getTime() + 24 * 60 * 60 * 1000);
      const hours = Math.floor((nextReset.getTime() - now.getTime()) / (60 * 60 * 1000));
      const minutes = Math.floor(((nextReset.getTime() - now.getTime()) % (60 * 60 * 1000)) / (60 * 1000));
      
      const message = `⏳ شما قبلاً جایزه روزانه خود را دریافت کرده‌اید! جایزه بعدی در ${hours} ساعت و ${minutes} دقیقه دیگر قابل دریافت است.`;
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    // بررسی زنجیره روزانه
    let streak = 0;
    if (lastDaily && now.getTime() - lastDaily.getTime() < 48 * 60 * 60 * 1000) {
      streak = user.dailyStreak + 1;
    } else {
      streak = 1;
    }
    
    // محاسبه جایزه
    let reward = 50;
    if (streak >= 7) {
      reward += 200; // جایزه اضافی برای زنجیره 7 روزه
    }
    
    // اعمال جایزه
    await storage.addToWallet(user.id, reward);
    await storage.updateUser(user.id, { lastDaily: now, dailyStreak: streak });
    
    let message = `🎁 شما جایزه روزانه خود به مقدار ${reward} سکه را دریافت کردید!`;
    if (streak >= 7) {
      message += ` (شامل جایزه ویژه زنجیره ۷ روزه به مقدار ۲۰۰ سکه!)`;
    } else if (streak > 1) {
      message += ` زنجیره فعلی شما: ${streak} روز.`;
    }
    
    // ساخت دکمه‌های دسترسی به منوهای دیگر
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('balance')
          .setLabel('💰 مشاهده موجودی')
          .setStyle(ButtonStyle.Primary)
      );
    
    if (interaction.deferred) {
      await interaction.editReply({ 
        content: message,
        components: [row]
      });
    } else {
      await interaction.reply({ 
        content: message, 
        components: [row],
        ephemeral: true 
      });
    }
  } catch (error) {
    console.error('Error in daily reward handler:', error);
    try {
      const errorMessage = '❌ متأسفانه در دریافت جایزه روزانه شما خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling daily reward failure:', e);
    }
  }
}

// Handler for depositing money to bank
async function handleDeposit(interaction: ButtonInteraction, amount: number) {
  try {
    // برای جلوگیری از خطای interaction، ابتدا بررسی می‌کنیم که آیا قبلاً پاسخ داده شده است
    if (interaction.replied || interaction.deferred) {
      console.log('Deposit interaction already replied or deferred');
      return;
    }
    
    // مستقیماً کاربر را دریافت و بررسی می‌کنیم
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    if (user.wallet < amount) {
      const message = `⚠️ موجودی کیف پول شما کافی نیست. موجودی فعلی: ${user.wallet} سکه`;
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    // 1% fee
    const fee = Math.ceil(amount * 0.01);
    const depositAmount = amount - fee;
    
    await storage.transferToBank(user.id, amount);
    
    const message = `✅ مبلغ ${depositAmount} سکه با موفقیت به حساب بانکی شما واریز شد. (کارمزد: ${fee} سکه)`;
    if (interaction.deferred) {
      await interaction.editReply({ content: message });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
    
    // After a short delay, refresh the economy menu
    setTimeout(async () => {
      try {
        await economyMenu(interaction, true);
      } catch (e) {
        console.error('Error refreshing economy menu after deposit:', e);
      }
    }, 1500);
  } catch (error) {
    console.error('Error in deposit handler:', error);
    
    const errorMessage = '❌ متأسفانه در پردازش واریز شما خطایی رخ داد!';
    if (interaction.deferred) {
      await interaction.editReply({ content: errorMessage });
    } else if (!interaction.replied) {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
}

// Handler for withdrawing money from bank
async function handleWithdraw(interaction: ButtonInteraction, amount: number) {
  try {
    // برای جلوگیری از خطای interaction، ابتدا بررسی می‌کنیم که آیا قبلاً پاسخ داده شده است
    if (interaction.replied || interaction.deferred) {
      console.log('Withdraw interaction already replied or deferred');
      return;
    }
    
    // مستقیماً کاربر را دریافت و بررسی می‌کنیم
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    if (user.bank < amount) {
      const message = `⚠️ موجودی حساب بانکی شما کافی نیست. موجودی فعلی: ${user.bank} سکه`;
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    await storage.transferToWallet(user.id, amount);
    
    const message = `✅ مبلغ ${amount} سکه با موفقیت از حساب بانکی شما برداشت شد.`;
    if (interaction.deferred) {
      await interaction.editReply({ content: message });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
    
    // بعد از مدت کوتاهی، منوی اقتصاد را به‌روزرسانی می‌کنیم
    setTimeout(async () => {
      try {
        await economyMenu(interaction, true);
      } catch (e) {
        console.error('Error refreshing economy menu after withdraw:', e);
      }
    }, 1500);
  } catch (error) {
    console.error('Error in withdraw handler:', error);
    
    const errorMessage = '❌ متأسفانه در پردازش برداشت شما خطایی رخ داد!';
    if (interaction.deferred) {
      await interaction.editReply({ content: errorMessage });
    } else if (!interaction.replied) {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
}

// Handler for buying items
async function handleBuyItem(interaction: ButtonInteraction, itemId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    const item = await storage.getItem(itemId);
    
    if (!item) {
      await interaction.reply({
        content: '❌ این آیتم وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Check if user has enough currency
    if (item.price && user.wallet < item.price) {
      await interaction.reply({
        content: `❌ سکه‌های شما کافی نیست. این آیتم ${item.price} سکه قیمت دارد.`,
        ephemeral: true
      });
      return;
    }
    
    if (item.crystalPrice && user.crystals < item.crystalPrice) {
      await interaction.reply({
        content: `❌ کریستال‌های شما کافی نیست. این آیتم ${item.crystalPrice} کریستال قیمت دارد.`,
        ephemeral: true
      });
      return;
    }
    
    // Buy the item
    const success = await storage.buyItem(user.id, itemId);
    
    if (success) {
      await interaction.reply({
        content: `✅ شما با موفقیت آیتم ${item.emoji} ${item.name} را خریداری کردید!`,
        ephemeral: true
      });
      
      // After a short delay, refresh the shop menu
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await shopMenu(interaction, true);
        }
      }, 1500);
    } else {
      await interaction.reply({
        content: '❌ متأسفانه در پردازش خرید شما خطایی رخ داد.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in buy item handler:', error);
    await interaction.reply({
      content: '❌ متأسفانه در پردازش خرید شما خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for using items
async function handleUseItem(interaction: ButtonInteraction, itemId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    const item = await storage.getItem(itemId);
    
    if (!item) {
      await interaction.reply({
        content: '❌ این آیتم وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Use the item
    const success = await storage.useItem(user.id, itemId);
    
    if (success) {
      let message = `✅ شما از آیتم ${item.emoji} ${item.name} استفاده کردید!`;
      
      if (item.type === 'role') {
        // Calculate expiration time
        const expires = new Date();
        expires.setHours(expires.getHours() + (item.duration || 24));
        const expirationDate = expires.toLocaleString();
        
        message += ` این آیتم تا ${expirationDate} فعال خواهد بود.`;
      }
      
      await interaction.reply({
        content: message,
        ephemeral: true
      });
      
      // After a short delay, refresh the inventory menu
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await inventoryMenu(interaction, true);
        }
      }, 1500);
    } else {
      await interaction.reply({
        content: `❌ شما آیتم ${item.emoji} ${item.name} را در کوله‌پشتی خود ندارید.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in use item handler:', error);
    await interaction.reply({
      content: '❌ متأسفانه در استفاده از آیتم خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for selling items
async function handleSellItem(interaction: ButtonInteraction, itemId: number) {
  // TODO: Implement sell functionality
  await interaction.reply({
    content: '🔜 فروش آیتم‌ها در به‌روزرسانی‌های آینده در دسترس خواهد بود!',
    ephemeral: true
  });
}

// Handler for exchanging Ccoin to crystals
async function handleExchange(interaction: ButtonInteraction, crystalAmount: number) {
  try {
    // برای اطمینان از عدم تایم‌اوت، یک پاسخ با تاخیر ارسال می‌کنیم
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }
    
    // Get user data
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      const message = '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    // Calculate Ccoin cost with 5% fee
    const ccoinPerCrystal = 125; // 125 Ccoin = 1 Crystal (نرخ جدید)
    let baseCost = crystalAmount * ccoinPerCrystal;
    let fee = Math.ceil(baseCost * 0.05); // کارمزد 5%
    let totalCost = baseCost + fee;
    
    // اعمال تخفیف 5% برای خرید 100 کریستال
    if (crystalAmount === 100) {
      // اعمال 5% تخفیف روی کل مبلغ (اصل + کارمزد)
      totalCost = Math.floor(totalCost * 0.95);
      // محاسبه کارمزد جدید برای نمایش در پیام
      fee = totalCost - baseCost;
      if (fee < 0) fee = 0; // برای اطمینان که کارمزد منفی نباشد
    }
    
    // Check if user has enough Ccoin
    if (user.wallet < totalCost) {
      const message = `❌ موجودی کیف پول شما کافی نیست! برای دریافت ${crystalAmount} کریستال به ${totalCost} سکه نیاز دارید (شامل 5% کارمزد).`;
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    // Deduct Ccoin from wallet and add crystals
    await storage.addToWallet(user.id, -totalCost);
    await storage.addCrystals(user.id, crystalAmount);
    
    // Log the transaction
    const logger = getLogger(interaction.client);
    logger.logEconomy(
      interaction.user.id,
      interaction.user.username,
      'تبدیل سکه به کریستال',
      -totalCost,
      `💎 کریستال دریافتی: ${crystalAmount} | 💰 سکه پرداختی: ${baseCost} | 💸 کارمزد: ${fee}`
    );
    
    // Reply with success message
    const message = `✅ تبدیل سکه به کریستال با موفقیت انجام شد!\n\n💰 سکه پرداخت شده: ${totalCost} (شامل ${fee} کارمزد)\n💎 کریستال دریافتی: ${crystalAmount}\n\nاکنون شما ${user.crystals + crystalAmount} کریستال دارید!`;
    if (interaction.deferred) {
      await interaction.editReply({ content: message });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
    
    // Refresh economy menu after 2 seconds
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await economyMenu(interaction, true);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error in exchange handler:', error);
    try {
      // بررسی وضعیت پاسخ تعامل برای جلوگیری از ارسال پاسخ تکراری
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ متأسفانه در فرآیند تبدیل سکه به کریستال خطایی رخ داد!',
          ephemeral: true
        });
      } else if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ متأسفانه در فرآیند تبدیل سکه به کریستال خطایی رخ داد!'
        });
      } else {
        await interaction.followUp({
          content: '❌ متأسفانه در فرآیند تبدیل سکه به کریستال خطایی رخ داد!',
          ephemeral: true
        });
      }
    } catch (secondError) {
      console.error('Error handling exchange error:', secondError);
    }
  }
}

// Handler for setting log channels
export async function handleSetLogChannel(interaction: ButtonInteraction, logType: string) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for channel ID input
    const modal = new ModalBuilder()
      .setCustomId(`set_log_channel_${logType}`)
      .setTitle(`تنظیم کانال لاگ ${logType}`);
    
    // Add components to modal
    const channelIdInput = new TextInputBuilder()
      .setCustomId('channelId')
      .setLabel('آی‌دی کانال را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    // Add action row and components to modal
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(channelIdInput);
    modal.addComponents(firstRow);
    
    // Show the modal
    await interaction.showModal(modal);
  } catch (error) {
    console.error(`Error in set log channel for ${logType}:`, error);
    await interaction.reply({
      content: 'متاسفانه در تنظیم کانال لاگ خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for setting default log channel
export async function handleSetDefaultLogChannel(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for channel ID input
    const modal = new ModalBuilder()
      .setCustomId('set_default_log_channel')
      .setTitle('تنظیم کانال پیش‌فرض لاگ‌ها');
    
    // Add components to modal
    const channelIdInput = new TextInputBuilder()
      .setCustomId('channelId')
      .setLabel('آی‌دی کانال را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    // Add action row and components to modal
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(channelIdInput);
    modal.addComponents(firstRow);
    
    // Show the modal
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error in set default log channel:', error);
    await interaction.reply({
      content: 'متاسفانه در تنظیم کانال پیش‌فرض لاگ خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for managing best friend status
async function handleBestFriend(interaction: ButtonInteraction, friendId: string, action: 'set' | 'remove') {
  try {
    // برای جلوگیری از خطای interaction، ابتدا بررسی می‌کنیم که آیا قبلاً پاسخ داده شده است
    if (interaction.replied || interaction.deferred) {
      console.log('Best Friend interaction already replied or deferred');
      return;
    }
    
    // مستقیماً کاربر را دریافت و بررسی می‌کنیم
    const user = await storage.getUserByDiscordId(interaction.user.id);
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور `/menu` استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // بررسی وجود دوست
    const friends = await storage.getFriends(user.id);
    const friend = friends.find(f => f.friendId === friendId);
    
    if (!friend) {
      const message = '❌ این کاربر در لیست دوستان شما وجود ندارد!';
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    // تنظیم یا حذف وضعیت بهترین دوست
    let result = true;
    let responseMessage = '';
    
    // یافتن شناسه کاربر دوست (با استفاده از discordId)
    let friendUserId = 0;
    const allUsers = await storage.getAllUsers();
    for (const u of allUsers) {
      if (u.discordId === friendId) {
        friendUserId = u.id;
        break;
      }
    }
    
    if (friendUserId === 0) {
      const message = '❌ کاربر دوست یافت نشد!';
      if (interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
      return;
    }
    
    if (action === 'set') {
      // بررسی اینکه آیا کاربر قبلاً بهترین دوست دارد
      const existingBestFriend = friends.find(f => f.isBestFriend);
      
      if (existingBestFriend && existingBestFriend.friendId !== friendId) {
        // ثبت فعالیت مربوط به تغییر بهترین دوست
        await storage.recordFriendshipActivity(
          user.id,
          Number(friendUserId),
          'best_friend',
          'تغییر به بهترین دوست',
          25
        );
        
        // بروزرسانی XP دوستی
        await storage.updateFriendshipXP(user.id, friendId, 25);
        
        responseMessage = `💖 کاربر با موفقیت به عنوان بهترین دوست شما انتخاب شد! دوست قبلی از حالت بهترین دوست خارج شد.`;
      } else if (existingBestFriend && existingBestFriend.friendId === friendId) {
        responseMessage = `💖 این کاربر در حال حاضر بهترین دوست شماست!`;
      } else {
        // ثبت فعالیت مربوط به انتخاب بهترین دوست جدید
        await storage.recordFriendshipActivity(
          user.id,
          Number(friendUserId),
          'best_friend',
          'انتخاب به عنوان بهترین دوست',
          50
        );
        
        // بروزرسانی XP دوستی
        await storage.updateFriendshipXP(user.id, friendId, 50);
        
        responseMessage = `💖 کاربر با موفقیت به عنوان بهترین دوست شما انتخاب شد!`;
      }
    } else if (action === 'remove') {
      // ثبت فعالیت مربوط به حذف بهترین دوست
      await storage.recordFriendshipActivity(
        user.id,
        Number(friendUserId),
        'best_friend_remove',
        'حذف از بهترین دوست',
        0
      );
      
      responseMessage = `💔 کاربر دیگر بهترین دوست شما نیست.`;
    }
    
    // ارسال پاسخ
    if (interaction.deferred) {
      await interaction.editReply({ content: responseMessage });
    } else {
      await interaction.reply({ content: responseMessage, ephemeral: true });
    }
    
    // بروزرسانی نمایش جزئیات دوستی
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await showFriendshipDetails(interaction, friendId);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Error in best friend handler:', error);
    try {
      const errorMessage = '❌ متأسفانه در انجام عملیات خطایی رخ داد! لطفاً دوباره تلاش کنید.';
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (e) {
      console.error('Error handling best friend failure:', e);
    }
  }
}

// Handler for testing logs
async function handleTestLogs(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Get logger from utils/logger
    const logger = { 
      logTransaction: (userId, username, type, amount, description) => log(`Transaction: ${username} (${userId}) - ${type}: ${amount} - ${description}`),
      logGame: (userId, username, gameType, result, bet, reward) => log(`Game: ${username} (${userId}) - ${gameType} - ${result} - Bet: ${bet} - Reward: ${reward}`),
      logUserActivity: (userId, username, activity, details) => log(`User Activity: ${username} (${userId}) - ${activity} - ${details}`),
      logAdminAction: (adminId, adminName, action, targetId, targetName, details) => log(`Admin Action: ${adminName} (${adminId}) - ${action} - Target: ${targetName} (${targetId}) - ${details}`),
      logSecurity: (userId, username, eventType, severity, details) => log(`Security: ${username} (${userId}) - ${eventType} - Severity: ${severity} - ${details}`),
      logError: (error, module, userId, username) => log(`Error in ${module}: ${error}${userId ? ` - User: ${username} (${userId})` : ''}`),
      logSystem: (eventType, details, fields) => log(`System: ${eventType} - ${details}`)
    };
    
    // Simple log function
    const log = (message: string) => console.log(`[LOG] ${message}`);
    
    // Test all configured log types
    const config = botConfig.getConfig();
    let successCount = 0;
    let failures: string[] = [];
    
    // Test transaction log
    if (config.logChannels['transaction']) {
      try {
        await logger.logTransaction(
          interaction.user.id,
          interaction.user.username,
          'تست',
          100,
          'یک تراکنش تستی انجام داد'
        );
        successCount++;
      } catch (e) {
        failures.push('تراکنش');
      }
    }
    
    // Test game log
    if (config.logChannels['game']) {
      try {
        await logger.logGame(
          interaction.user.id,
          interaction.user.username,
          'شیر یا خط',
          'برد',
          50,
          100
        );
        successCount++;
      } catch (e) {
        failures.push('بازی');
      }
    }
    
    // Test user log
    if (config.logChannels['user']) {
      try {
        await logger.logUserActivity(
          interaction.user.id,
          interaction.user.username,
          'تست',
          'یک فعالیت تستی انجام داد'
        );
        successCount++;
      } catch (e) {
        failures.push('کاربر');
      }
    }
    
    // Test admin log
    if (config.logChannels['admin']) {
      try {
        await logger.logAdminAction(
          interaction.user.id,
          interaction.user.username,
          'تست',
          interaction.user.id,
          interaction.user.username,
          'یک عملیات تستی انجام داد'
        );
        successCount++;
      } catch (e) {
        failures.push('ادمین');
      }
    }
    
    // Test security log
    if (config.logChannels['security']) {
      try {
        await logger.logSecurity(
          interaction.user.id,
          interaction.user.username,
          'تست',
          'کم',
          'یک هشدار امنیتی تستی'
        );
        successCount++;
      } catch (e) {
        failures.push('امنیتی');
      }
    }
    
    // Test error log
    if (config.logChannels['error']) {
      try {
        await logger.logError(
          'این یک خطای تستی است',
          'سیستم تست',
          interaction.user.id,
          interaction.user.username
        );
        successCount++;
      } catch (e) {
        failures.push('خطا');
      }
    }
    
    // Test system log
    if (config.logChannels['system']) {
      try {
        await logger.logSystem(
          'تست',
          'یک رویداد سیستمی تستی',
          [{ name: 'آزمایش کننده', value: interaction.user.username, inline: true }]
        );
        successCount++;
      } catch (e) {
        failures.push('سیستم');
      }
    }
    
    // Report results
    let responseMessage = `تست لاگ‌ها انجام شد. ${successCount} لاگ با موفقیت ارسال شد.`;
    if (failures.length > 0) {
      responseMessage += `\nلاگ‌های با خطا: ${failures.join('، ')}`;
    }
    if (successCount === 0) {
      responseMessage = 'هیچ کانال لاگی تنظیم نشده است یا با خطا مواجه شد.';
    }
    
    await interaction.reply({
      content: responseMessage,
      ephemeral: true
    });
    
    // Return to logs settings menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await adminMenu(interaction, 'logs_settings');
      }
    }, 2000);
  } catch (error) {
    console.error('Error in test logs:', error);
    await interaction.reply({
      content: 'متاسفانه در تست لاگ‌ها خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleClaimQuest(interaction: ButtonInteraction, questId: number) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: '⚠️ شما باید ابتدا یک حساب کاربری ایجاد کنید. از دستور /menu استفاده نمایید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user quests
    const userQuests = await storage.getUserQuests(user.id);
    const userQuest = userQuests.find(q => q.quest.id === questId);
    
    if (!userQuest) {
      await interaction.reply({
        content: '❌ این ماموریت وجود ندارد یا برای شما در دسترس نیست.',
        ephemeral: true
      });
      return;
    }
    
    // Check if quest is completed
    if (!userQuest.userQuest.completed && userQuest.userQuest.progress >= userQuest.quest.targetAmount) {
      // Mark as completed and give reward
      await storage.updateQuestProgress(user.id, questId, userQuest.userQuest.progress);
      
      await interaction.reply({
        content: `🎉 ماموریت تکمیل شد! شما ${userQuest.quest.reward} سکه به عنوان پاداش دریافت کردید.`,
        ephemeral: true
      });
      
      // After a short delay, refresh the quests menu
      setTimeout(async () => {
        if (interaction.replied || interaction.deferred) {
          await questsMenu(interaction, true);
        }
      }, 1500);
    } else if (userQuest.userQuest.completed) {
      await interaction.reply({
        content: '⚠️ شما قبلاً پاداش این ماموریت را دریافت کرده‌اید.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `⏳ این ماموریت هنوز تکمیل نشده است. پیشرفت: ${userQuest.userQuest.progress}/${userQuest.quest.targetAmount}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in claim quest handler:', error);
    await interaction.reply({
      content: '❌ متأسفانه در دریافت پاداش ماموریت خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for clan resource gathering
async function handleClanGatherResources(interaction: ButtonInteraction, resourceType: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما باید اول یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (!user.clanId) {
      await interaction.reply({
        content: 'شما عضو هیچ کلنی نیستید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      await interaction.reply({
        content: 'کلن شما دیگر وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's resources
    const resources = (user as any).clanResources || {
      materials: 0,
      labor: 0,
      lastCollected: new Date(0).toISOString()
    };
    
    // Check cooldown (6 hours)
    const now = new Date();
    const lastCollected = new Date(resources.lastCollected);
    const hoursSinceLastCollection = Math.floor((now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60));
    const cooldownHours = 6;
    
    if (hoursSinceLastCollection < cooldownHours) {
      const hoursRemaining = cooldownHours - hoursSinceLastCollection;
      await interaction.reply({
        content: `شما باید ${hoursRemaining} ساعت دیگر صبر کنید تا بتوانید مجدداً منابع جمع‌آوری کنید.`,
        ephemeral: true
      });
      return;
    }
    
    // Calculate resource amount (can be affected by clan buildings in the future)
    let amount = 10;
    
    // Check if clan has production buildings that increase resource gathering
    const buildings = clan.buildings || [];
    const marketBuilding = buildings.find(b => b.type === 'market');
    
    // Market gives bonus to resource production
    if (marketBuilding && marketBuilding.level > 0) {
      amount += marketBuilding.level * 2; // +2 resources per market level
    }
    
    // Update user's resources based on the type
    if (resourceType === 'materials') {
      resources.materials += amount;
      await interaction.reply({
        content: `شما ${amount} واحد مواد جمع‌آوری کردید! مواد فعلی: ${resources.materials}`,
        ephemeral: true
      });
    } else if (resourceType === 'labor') {
      resources.labor += amount;
      await interaction.reply({
        content: `شما ${amount} واحد نیروی کار جمع‌آوری کردید! نیروی کار فعلی: ${resources.labor}`,
        ephemeral: true
      });
    }
    
    // Update last collection time
    resources.lastCollected = now.toISOString();
    
    // Update user's resources in database
    await storage.updateUser(user.id, { clanResources: resources });
    
    // After a short delay, refresh the clan resources menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await clansMenu(interaction, true);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error in clan resource gathering handler:', error);
    await interaction.reply({
      content: 'متأسفانه خطایی در جمع‌آوری منابع رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for clan building upgrade
async function handleClanBuildingUpgrade(interaction: ButtonInteraction, buildingId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما باید اول یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (!user.clanId) {
      await interaction.reply({
        content: 'شما عضو هیچ کلنی نیستید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      await interaction.reply({
        content: 'کلن شما دیگر وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Check if user is clan leader or officer (only they can upgrade buildings)
    if (user.discordId !== clan.ownerId) {
      await interaction.reply({
        content: 'فقط رهبر کلن می‌تواند ساختمان‌ها را ارتقا دهد.',
        ephemeral: true
      });
      return;
    }
    
    // Default building types and their upgrade prices
    const defaultBuildings = [
      { id: 'hq', type: 'headquarters', name: 'ساختمان مرکزی', level: 1, upgradePrice: 5000 },
      { id: 'bank', type: 'bank', name: 'بانک', level: 0, upgradePrice: 2000 },
      { id: 'barracks', type: 'barracks', name: 'سربازخانه', level: 0, upgradePrice: 3000 },
      { id: 'market', type: 'market', name: 'بازار', level: 0, upgradePrice: 2500 }
    ];
    
    // Find the building to upgrade
    const buildings = clan.buildings || [];
    const defaultBuilding = defaultBuildings.find(b => b.id === buildingId);
    
    if (!defaultBuilding) {
      await interaction.reply({
        content: 'این ساختمان وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Find existing building or use default
    const existingBuilding = buildings.find(b => b.type === defaultBuilding.type);
    const buildingLevel = existingBuilding ? existingBuilding.level : defaultBuilding.level;
    const buildingName = existingBuilding ? existingBuilding.name : defaultBuilding.name;
    const upgradePrice = defaultBuilding.upgradePrice;
    
    // Check if clan has enough money
    if (clan.bank < upgradePrice) {
      await interaction.reply({
        content: `موجودی بانک کلن کافی نیست. شما نیاز به ${upgradePrice} Ccoin برای ${buildingLevel > 0 ? 'ارتقای' : 'ساخت'} ${buildingName} دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // Create or update building
    let updatedBuildings = [...buildings];
    
    if (existingBuilding) {
      // Update existing building
      updatedBuildings = buildings.map(b => {
        if (b.type === defaultBuilding.type) {
          return {
            ...b,
            level: b.level + 1,
            upgradeProgress: 0,
            upgradeTarget: 100
          };
        }
        return b;
      });
    } else {
      // Add new building
      updatedBuildings.push({
        id: defaultBuilding.id,
        type: defaultBuilding.type as 'headquarters' | 'bank' | 'training_camp' | 'market' | 'laboratory' | 'barracks' | 'wall' | 'tower',
        name: defaultBuilding.name,
        level: 1,
        upgradeProgress: 0,
        upgradeTarget: 100,
        effects: {}
      });
    }
    
    // Update clan bank balance and buildings
    const newBank = clan.bank - upgradePrice;
    await storage.updateClan(clan.id, {
      bank: newBank,
      buildings: updatedBuildings
    });
    
    const newLevel = existingBuilding ? existingBuilding.level + 1 : 1;
    
    await interaction.reply({
      content: `${buildingLevel > 0 ? 'ارتقای' : 'ساخت'} ${buildingName} با موفقیت انجام شد! سطح فعلی: ${newLevel}`,
      ephemeral: true
    });
    
    // After a short delay, refresh the clan buildings menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await clansMenu(interaction, true);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error in clan building upgrade handler:', error);
    await interaction.reply({
      content: 'متأسفانه خطایی در ارتقای ساختمان رخ داد!',
      ephemeral: true
    });
  }
}

// Handler for starting clan projects
// Handler for contributing to clan projects
async function handleClanContributeToProject(interaction: ButtonInteraction, projectId: string, resourceType: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما باید اول یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (!user.clanId) {
      await interaction.reply({
        content: 'شما عضو هیچ کلنی نیستید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      await interaction.reply({
        content: 'کلن شما دیگر وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Get active projects
    const activeProjects = clan.activeProjects || [];
    const project = activeProjects.find(p => p.id === projectId);
    
    if (!project) {
      await interaction.reply({
        content: 'این پروژه وجود ندارد یا پایان یافته است.',
        ephemeral: true
      });
      return;
    }
    
    // Initialize default contribution amount
    let contributionAmount = 10;
    let remainingNeeded = 0;
    
    // Check contribution type and amount
    if (resourceType === 'coins') {
      // For coins, we contribute a larger amount
      contributionAmount = 500;
      remainingNeeded = project.resourcesRequired.coins - project.resourcesContributed.coins;
      
      // Check if user has enough coins
      if (user.wallet < contributionAmount) {
        await interaction.reply({
          content: `شما به اندازه کافی سکه در کیف پول خود ندارید. شما نیاز به حداقل ${contributionAmount} Ccoin دارید.`,
          ephemeral: true
        });
        return;
      }
      
      // Adjust contribution to not exceed what's needed
      if (remainingNeeded < contributionAmount) {
        contributionAmount = remainingNeeded;
      }
      
      // Don't allow contribution if nothing more is needed
      if (remainingNeeded <= 0) {
        await interaction.reply({
          content: 'این پروژه دیگر به سکه نیاز ندارد!',
          ephemeral: true
        });
        return;
      }
      
      // Update user's wallet
      await storage.addToWallet(user.id, -contributionAmount);
      
      // Update project's contribution
      project.resourcesContributed.coins += contributionAmount;
      
    } else if (resourceType === 'materials') {
      // Get user's resources
      const resources = (user as any).clanResources || { materials: 0, labor: 0 };
      remainingNeeded = project.resourcesRequired.materials - project.resourcesContributed.materials;
      
      // Check if user has enough materials
      if (resources.materials < contributionAmount) {
        await interaction.reply({
          content: `شما به اندازه کافی مواد ندارید. شما نیاز به حداقل ${contributionAmount} واحد مواد دارید.`,
          ephemeral: true
        });
        return;
      }
      
      // Adjust contribution to not exceed what's needed
      if (remainingNeeded < contributionAmount) {
        contributionAmount = remainingNeeded;
      }
      
      // Don't allow contribution if nothing more is needed
      if (remainingNeeded <= 0) {
        await interaction.reply({
          content: 'این پروژه دیگر به مواد نیاز ندارد!',
          ephemeral: true
        });
        return;
      }
      
      // Update user's resources
      resources.materials -= contributionAmount;
      await storage.updateUser(user.id, { clanResources: resources });
      
      // Update project's contribution
      project.resourcesContributed.materials += contributionAmount;
      
    } else if (resourceType === 'labor') {
      // Get user's resources
      const resources = (user as any).clanResources || { materials: 0, labor: 0 };
      remainingNeeded = project.resourcesRequired.labor - project.resourcesContributed.labor;
      
      // Check if user has enough labor
      if (resources.labor < contributionAmount) {
        await interaction.reply({
          content: `شما به اندازه کافی نیروی کار ندارید. شما نیاز به حداقل ${contributionAmount} واحد نیروی کار دارید.`,
          ephemeral: true
        });
        return;
      }
      
      // Adjust contribution to not exceed what's needed
      if (remainingNeeded < contributionAmount) {
        contributionAmount = remainingNeeded;
      }
      
      // Don't allow contribution if nothing more is needed
      if (remainingNeeded <= 0) {
        await interaction.reply({
          content: 'این پروژه دیگر به نیروی کار نیاز ندارد!',
          ephemeral: true
        });
        return;
      }
      
      // Update user's resources
      resources.labor -= contributionAmount;
      await storage.updateUser(user.id, { clanResources: resources });
      
      // Update project's contribution
      project.resourcesContributed.labor += contributionAmount;
    }
    
    // Calculate new progress
    const totalRequired = 
      project.resourcesRequired.coins + 
      project.resourcesRequired.materials + 
      project.resourcesRequired.labor;
      
    const totalContributed = 
      project.resourcesContributed.coins + 
      project.resourcesContributed.materials + 
      project.resourcesContributed.labor;
      
    project.progress = Math.min(100, (totalContributed / totalRequired) * 100);
    
    // Check if project is completed
    if (project.progress >= 100) {
      project.status = 'completed';
      project.completionTime = new Date().toISOString();
      
      // Update clan with completed project rewards (will be implemented in a separate function)
      // For now, just update the project status
    }
    
    // Update the clan's active projects
    const updatedProjects = activeProjects.map(p => 
      p.id === projectId ? project : p
    );
    
    // Update clan with the new projects
    await storage.updateClan(clan.id, {
      activeProjects: updatedProjects
    } as Partial<typeof clan>);
    
    // Send response to user
    await interaction.reply({
      content: `شما با موفقیت ${contributionAmount} واحد ${
        resourceType === 'coins' ? 'سکه' : 
        resourceType === 'materials' ? 'مواد' : 'نیروی کار'
      } به پروژه "${project.name}" اضافه کردید! پیشرفت فعلی: ${project.progress.toFixed(1)}%`,
      ephemeral: true
    });
    
    // After a short delay, refresh the clan projects menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await clansMenu(interaction, true);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error in clan contribute to project handler:', error);
    await interaction.reply({
      content: 'متأسفانه خطایی در کمک به پروژه رخ داد!',
      ephemeral: true
    });
  }
}

async function handleClanStartProject(interaction: ButtonInteraction, projectId: string) {
  try {
    const user = await storage.getUserByDiscordId(interaction.user.id);
    
    if (!user) {
      await interaction.reply({
        content: 'شما باید اول یک حساب کاربری ایجاد کنید. از دستور /menu استفاده کنید.',
        ephemeral: true
      });
      return;
    }
    
    if (!user.clanId) {
      await interaction.reply({
        content: 'شما عضو هیچ کلنی نیستید.',
        ephemeral: true
      });
      return;
    }
    
    // Get user's clan
    const clan = await storage.getClan(user.clanId);
    
    if (!clan) {
      await interaction.reply({
        content: 'کلن شما دیگر وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Check if user is clan leader (only they can start projects)
    if (user.discordId !== clan.ownerId) {
      await interaction.reply({
        content: 'فقط رهبر کلن می‌تواند پروژه‌های جدید را آغاز کند.',
        ephemeral: true
      });
      return;
    }
    
    // Get active projects
    const activeProjects = clan.activeProjects || [];
    
    // Check maximum simultaneous projects (2)
    if (activeProjects.length >= 2) {
      await interaction.reply({
        content: 'کلن شما در حال حاضر دو پروژه فعال دارد. ابتدا باید یکی از آن‌ها را تکمیل کنید.',
        ephemeral: true
      });
      return;
    }
    
    // Available projects
    const availableProjects = [
      {
        id: 'training_grounds',
        name: 'زمین تمرین',
        description: 'افزایش ظرفیت اعضای کلن و افزایش قدرت در جنگ‌های کلن',
        cost: 5000,
        resourcesRequired: {
          coins: 5000,
          materials: 50,
          labor: 30
        },
        rewards: {
          experience: 500,
          perkPoints: 1
        }
      },
      {
        id: 'resource_center',
        name: 'مرکز منابع',
        description: 'افزایش تولید منابع و کاهش زمان جمع‌آوری',
        cost: 3000,
        resourcesRequired: {
          coins: 3000,
          materials: 30,
          labor: 20
        },
        rewards: {
          experience: 300,
          perkPoints: 1
        }
      }
    ];
    
    // Find the project to start
    const projectConfig = availableProjects.find(p => p.id === projectId);
    
    if (!projectConfig) {
      await interaction.reply({
        content: 'این پروژه وجود ندارد.',
        ephemeral: true
      });
      return;
    }
    
    // Check if clan has enough coins
    if (clan.bank < projectConfig.cost) {
      await interaction.reply({
        content: `موجودی بانک کلن کافی نیست. شما نیاز به ${projectConfig.cost} Ccoin برای شروع این پروژه دارید.`,
        ephemeral: true
      });
      return;
    }
    
    // Create new project
    const now = new Date();
    const deadlineDate = new Date(now);
    deadlineDate.setDate(deadlineDate.getDate() + 7); // 7 days deadline
    
    const newProject = {
      id: projectConfig.id,
      name: projectConfig.name,
      description: projectConfig.description,
      resourcesRequired: projectConfig.resourcesRequired,
      resourcesContributed: {
        coins: 0,
        materials: 0,
        labor: 0
      },
      progress: 0,
      rewards: projectConfig.rewards,
      deadline: deadlineDate.toISOString(),
      status: 'active' as const
    };
    
    // Withdraw project cost from clan bank
    const newBank = clan.bank - projectConfig.cost;
    
    // Initialize resource contribution with bank amount
    newProject.resourcesContributed.coins = projectConfig.cost;
    
    // Calculate initial progress
    const totalResources = 
      projectConfig.resourcesRequired.coins + 
      projectConfig.resourcesRequired.materials + 
      projectConfig.resourcesRequired.labor;
      
    newProject.progress = (projectConfig.cost / totalResources) * 100;
    
    // Update clan with new project and bank balance
    const updatedProjects = [...activeProjects, newProject];
    await storage.updateClan(clan.id, {
      bank: newBank,
      activeProjects: updatedProjects
    } as Partial<typeof clan>);
    
    await interaction.reply({
      content: `پروژه "${projectConfig.name}" با موفقیت آغاز شد! هزینه اولیه ${projectConfig.cost} Ccoin از بانک کلن کسر شد.`,
      ephemeral: true
    });
    
    // After a short delay, refresh the clan projects menu
    setTimeout(async () => {
      if (interaction.replied || interaction.deferred) {
        await clansMenu(interaction, true);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error in clan start project handler:', error);
    await interaction.reply({
      content: 'متأسفانه خطایی در شروع پروژه رخ داد!',
      ephemeral: true
    });
  }
}

// Admin functions for economy management
async function handleAdminAddCoin(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for user ID, amount, and reason input
    const modal = new ModalBuilder()
      .setCustomId('admin_add_coin_modal')
      .setTitle('افزودن سکه به کاربر');
    
    const userIdInput = new TextInputBuilder()
      .setCustomId('userId')
      .setLabel('آی‌دی کاربر را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    const amountInput = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('مقدار سکه را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1000')
      .setRequired(true);
      
    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('دلیل افزودن سکه')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('مثال: پاداش شرکت در ایونت')
      .setRequired(false);
    
    const userIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    const amountRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
    
    modal.addComponents(userIdRow, amountRow, reasonRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing add coin modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم افزودن سکه خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleAdminRemoveCoin(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for user ID, amount, and reason input
    const modal = new ModalBuilder()
      .setCustomId('admin_remove_coin_modal')
      .setTitle('کاهش سکه کاربر');
    
    const userIdInput = new TextInputBuilder()
      .setCustomId('userId')
      .setLabel('آی‌دی کاربر را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    const amountInput = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('مقدار سکه را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1000')
      .setRequired(true);
      
    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('دلیل کاهش سکه')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('مثال: جریمه تخلف در بازی')
      .setRequired(false);
    
    const userIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    const amountRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
    
    modal.addComponents(userIdRow, amountRow, reasonRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing remove coin modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم کاهش سکه خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleAdminDistributeCoin(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for amount input
    const modal = new ModalBuilder()
      .setCustomId('admin_distribute_coin_modal')
      .setTitle('توزیع سکه بین کاربران');
    
    const amountInput = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('مقدار سکه برای هر کاربر')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 100')
      .setRequired(true);
    
    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('دلیل توزیع سکه')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('مثال: هدیه مناسبتی')
      .setRequired(true);
    
    const amountRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
    const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
    
    modal.addComponents(amountRow, reasonRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing distribute coin modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم توزیع سکه خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleAdminSetInterest(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for rate input
    const modal = new ModalBuilder()
      .setCustomId('admin_set_interest_modal')
      .setTitle('تنظیم نرخ سود بانکی');
    
    const rateInput = new TextInputBuilder()
      .setCustomId('rate')
      .setLabel('نرخ سود بانکی (درصد)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 5')
      .setRequired(true);
    
    const rateRow = new ActionRowBuilder<TextInputBuilder>().addComponents(rateInput);
    
    modal.addComponents(rateRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing set interest modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم تنظیم نرخ سود خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleAdminSetTax(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for rate input
    const modal = new ModalBuilder()
      .setCustomId('admin_set_tax_modal')
      .setTitle('تنظیم نرخ مالیات');
    
    const rateInput = new TextInputBuilder()
      .setCustomId('rate')
      .setLabel('نرخ مالیات بر انتقال (درصد)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 2')
      .setRequired(true);
    
    const rateRow = new ActionRowBuilder<TextInputBuilder>().addComponents(rateInput);
    
    modal.addComponents(rateRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing set tax modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم تنظیم نرخ مالیات خطایی رخ داد!',
      ephemeral: true
    });
  }
}

/**
 * مدیریت ریست اقتصاد کاربر خاص
 */
async function handleAdminResetUserEconomy(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for user input
    const modal = new ModalBuilder()
      .setCustomId('admin_reset_user_economy_modal')
      .setTitle('ریست اقتصاد کاربر');
    
    // User ID input
    const userIdInput = new TextInputBuilder()
      .setCustomId('userId')
      .setLabel('شناسه کاربر (Discord ID)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('شناسه دیسکورد کاربر را وارد کنید')
      .setRequired(true);
    
    // Reason input
    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('دلیل ریست (اختیاری)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('دلیل ریست اقتصاد این کاربر چیست؟')
      .setRequired(false)
      .setMaxLength(1000);
    
    // Add inputs to modal
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
    
    modal.addComponents(firstActionRow, secondActionRow);
    
    // Show the modal
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error in user economy reset:', error);
    await interaction.reply({
      content: 'متاسفانه در انجام عملیات خطایی رخ داد!',
      ephemeral: true
    });
  }
}

/**
 * مدیریت ریست کل اقتصاد
 */
async function handleAdminResetAllEconomy(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create confirmation buttons
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('admin_reset_all_economy_confirm')
          .setLabel('بله، ریست کن')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('admin_economy')
          .setLabel('خیر، لغو کن')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.reply({
      content: '⚠️ **هشدار جدی:** این عملیات تمام سکه‌ها و داده‌های اقتصادی تمام کاربران را ریست می‌کند و قابل بازگشت نیست. آیا مطمئن هستید؟',
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in reset economy:', error);
    await interaction.reply({
      content: 'متاسفانه در انجام عملیات خطایی رخ داد!',
      ephemeral: true
    });
  }
}

/**
 * این تابع خالی شده و به دو تابع جدید تقسیم شده است
 */
async function handleAdminResetEconomy(interaction: ButtonInteraction) {
  try {
    // ارجاع به منوی جدید
    await adminMenu(interaction, 'economy_reset');
  } catch (error) {
    console.error('Error in reset economy:', error);
    await interaction.reply({
      content: 'متاسفانه در انجام عملیات خطایی رخ داد!',
      ephemeral: true
    });
  }
}

// Admin functions for user management
async function handleAdminSearchUser(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for user ID input
    const modal = new ModalBuilder()
      .setCustomId('admin_search_user_modal')
      .setTitle('جستجوی کاربر');
    
    const userIdInput = new TextInputBuilder()
      .setCustomId('userId')
      .setLabel('آی‌دی کاربر یا نام کاربری را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789 یا username#1234')
      .setRequired(true);
    
    const userIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    
    modal.addComponents(userIdRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing search user modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم جستجوی کاربر خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleAdminBanUser(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for user ID and reason input
    const modal = new ModalBuilder()
      .setCustomId('admin_ban_user_modal')
      .setTitle('مسدود کردن کاربر');
    
    const userIdInput = new TextInputBuilder()
      .setCustomId('userId')
      .setLabel('آی‌دی کاربر را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('دلیل مسدودسازی')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('مثال: تقلب در بازی')
      .setRequired(true);
    
    const userIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
    
    modal.addComponents(userIdRow, reasonRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing ban user modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم مسدودسازی کاربر خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleAdminResetUser(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for user ID input
    const modal = new ModalBuilder()
      .setCustomId('admin_reset_user_modal')
      .setTitle('ریست کاربر');
    
    const userIdInput = new TextInputBuilder()
      .setCustomId('userId')
      .setLabel('آی‌دی کاربر را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    const confirmInput = new TextInputBuilder()
      .setCustomId('confirm')
      .setLabel('برای تایید عبارت "RESET" را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('RESET')
      .setRequired(true);
    
    const userIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    const confirmRow = new ActionRowBuilder<TextInputBuilder>().addComponents(confirmInput);
    
    modal.addComponents(userIdRow, confirmRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing reset user modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم ریست کاربر خطایی رخ داد!',
      ephemeral: true
    });
  }
}

async function handleAdminTopUsers(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    // Get all users and sort them by total balance
    const users = await storage.getAllUsers();
    const topUsers = users
      .sort((a, b) => (b.wallet + b.bank) - (a.wallet + a.bank))
      .slice(0, 10);
    
    const embed = new EmbedBuilder()
      .setTitle('🏆 لیست کاربران برتر (بر اساس ثروت)')
      .setColor('#FFD700')
      .setDescription('لیست ۱۰ کاربر برتر بر اساس مجموع سکه‌ها')
      .setTimestamp();
    
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      embed.addFields({
        name: `${i + 1}. ${user.username}`,
        value: `💰 مجموع: ${user.wallet + user.bank} سکه\n` +
               `👛 کیف پول: ${user.wallet} سکه\n` +
               `🏦 بانک: ${user.bank} سکه\n` +
               `💎 کریستال: ${user.crystals}`
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in top users handler:', error);
    await interaction.editReply({
      content: 'متاسفانه در دریافت لیست کاربران برتر خطایی رخ داد!'
    });
  }
}

async function handleAdminInactiveUsers(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    // Get all users and find inactive ones (no activity in last 30 days)
    const users = await storage.getAllUsers();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const inactiveUsers = users.filter(user => {
      // Check lastSeen or createdAt date
      const lastActivity = user.lastSeen || user.createdAt;
      return lastActivity && new Date(lastActivity) < thirtyDaysAgo;
    }).slice(0, 10);
    
    const embed = new EmbedBuilder()
      .setTitle('⏰ لیست کاربران غیرفعال')
      .setColor('#808080')
      .setDescription('لیست کاربرانی که در ۳۰ روز گذشته فعالیتی نداشته‌اند')
      .setTimestamp();
    
    if (inactiveUsers.length === 0) {
      embed.setDescription('هیچ کاربر غیرفعالی یافت نشد!');
    } else {
      for (let i = 0; i < inactiveUsers.length; i++) {
        const user = inactiveUsers[i];
        const lastActivity = user.lastSeen || user.createdAt;
        const daysSinceActivity = lastActivity ? 
          Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) : 
          'نامشخص';
        
        embed.addFields({
          name: `${i + 1}. ${user.username}`,
          value: `🆔 آی‌دی: ${user.discordId}\n` +
                 `⏱️ آخرین فعالیت: ${daysSinceActivity} روز پیش\n` +
                 `💰 مجموع سکه‌ها: ${user.wallet + user.bank}`
        });
      }
    }
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in inactive users handler:', error);
    await interaction.editReply({
      content: 'متاسفانه در دریافت لیست کاربران غیرفعال خطایی رخ داد!'
    });
  }
}

async function handleAdminUserLogs(interaction: ButtonInteraction) {
  try {
    // Check if user has admin permissions
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const adminRoleId = botConfig.getConfig().general.adminRoleId;
    
    if (!member?.roles.cache.has(adminRoleId)) {
      await interaction.reply({
        content: 'شما دسترسی لازم برای این عملیات را ندارید!',
        ephemeral: true
      });
      return;
    }
    
    // Create a modal for user ID input
    const modal = new ModalBuilder()
      .setCustomId('admin_user_logs_modal')
      .setTitle('مشاهده لاگ کاربر');
    
    const userIdInput = new TextInputBuilder()
      .setCustomId('userId')
      .setLabel('آی‌دی کاربر را وارد کنید')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('مثال: 1234567890123456789')
      .setRequired(true);
    
    const userIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
    
    modal.addComponents(userIdRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing user logs modal:', error);
    await interaction.reply({
      content: 'متاسفانه در نمایش فرم مشاهده لاگ کاربر خطایی رخ داد!',
      ephemeral: true
    });
  }
}
