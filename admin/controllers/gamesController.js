/**
 * کنترلر مدیریت بازی‌ها
 * 
 * این ماژول شامل توابع مدیریت بازی‌های مختلف از جمله بازی‌های قمار،
 * بازی‌های کارتی، رولت، اسلات، بلک‌جک و غیره است.
 */

import { GamblingGame } from '../models/gamblingGame.js';
import { CardGame } from '../models/cardGame.js';
import { GroupGame } from '../models/groupGame.js';
import { SlotSymbol } from '../models/slotSymbol.js';
import { GameReward } from '../models/gameReward.js';
import { GameStats } from '../models/gameStats.js';
import { GameSettings } from '../models/gameSettings.js';

/**
 * کنترلر بازی‌ها
 */
export const gamesController = {
  /**
   * نمایش داشبورد مدیریت بازی‌ها
   */
  showDashboard: async (req, res) => {
    try {
      // دریافت آمار بازی‌ها
      const gamblingGamesCount = await GamblingGame.countDocuments();
      const cardGamesCount = await CardGame.countDocuments();
      const groupGamesCount = await GroupGame.countDocuments();
      
      // دریافت تعداد بازی‌های انجام شده
      const totalGamesPlayed = await GameStats.aggregate([
        { $group: { _id: null, total: { $sum: "$gamesPlayed" } } }
      ]);
      
      // دریافت مجموع سکه‌های برده/باخته شده
      const coinsStats = await GameStats.aggregate([
        { $group: {
            _id: null,
            totalWon: { $sum: "$coinsWon" },
            totalLost: { $sum: "$coinsLost" }
          }
        }
      ]);
      
      // سود/زیان کل سیستم
      const houseProfit = coinsStats.length > 0 ? 
        coinsStats[0].totalLost - coinsStats[0].totalWon : 0;
      
      res.render('games/dashboard', {
        title: 'مدیریت بازی‌ها',
        stats: {
          gamblingGamesCount,
          cardGamesCount,
          groupGamesCount,
          totalGamesPlayed: totalGamesPlayed.length > 0 ? totalGamesPlayed[0].total : 0,
          houseProfit
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری داشبورد بازی‌ها: ${error.message}`);
      res.redirect('/admin/dashboard');
    }
  },

  /**
   * نمایش لیست بازی‌های قمار
   */
  showGamblingGames: async (req, res) => {
    try {
      const games = await GamblingGame.find().sort({ name: 1 });
      res.render('games/gambling/index', {
        title: 'مدیریت بازی‌های قمار',
        games
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری بازی‌های قمار: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * نمایش جزئیات بازی قمار
   */
  showGamblingGame: async (req, res) => {
    try {
      const game = await GamblingGame.findById(req.params.id);
      if (!game) {
        req.flash('error', 'بازی مورد نظر یافت نشد');
        return res.redirect('/admin/games/gambling');
      }
      
      res.render('games/gambling/edit', {
        title: `ویرایش بازی ${game.name}`,
        game
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات بازی: ${error.message}`);
      res.redirect('/admin/games/gambling');
    }
  },

  /**
   * به‌روزرسانی بازی قمار
   */
  updateGamblingGame: async (req, res) => {
    try {
      const {
        name, description, minBet, maxBet, houseEdge,
        winRate, minWinMultiplier, maxWinMultiplier
      } = req.body;
      
      await GamblingGame.findByIdAndUpdate(req.params.id, {
        name,
        description,
        minBet: parseInt(minBet) || 10,
        maxBet: parseInt(maxBet) || 1000,
        houseEdge: parseFloat(houseEdge) || 5,
        winRate: parseFloat(winRate) || 45,
        minWinMultiplier: parseFloat(minWinMultiplier) || 1.1,
        maxWinMultiplier: parseFloat(maxWinMultiplier) || 2.0
      });
      
      req.flash('success', 'بازی با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/gambling');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی بازی: ${error.message}`);
      res.redirect(`/admin/games/gambling/${req.params.id}`);
    }
  },

  /**
   * فعال/غیرفعال کردن بازی قمار
   */
  toggleGamblingGame: async (req, res) => {
    try {
      const game = await GamblingGame.findById(req.params.id);
      if (!game) {
        req.flash('error', 'بازی مورد نظر یافت نشد');
        return res.redirect('/admin/games/gambling');
      }
      
      // تغییر وضعیت فعال بودن
      await GamblingGame.findByIdAndUpdate(req.params.id, {
        isActive: !game.isActive
      });
      
      req.flash('success', `بازی ${game.name} ${game.isActive ? 'غیرفعال' : 'فعال'} شد`);
      res.redirect('/admin/games/gambling');
    } catch (error) {
      req.flash('error', `خطا در تغییر وضعیت بازی: ${error.message}`);
      res.redirect('/admin/games/gambling');
    }
  },

  /**
   * نمایش لیست بازی‌های کارتی
   */
  showCardGames: async (req, res) => {
    try {
      const games = await CardGame.find().sort({ name: 1 });
      res.render('games/card-games/index', {
        title: 'مدیریت بازی‌های کارتی',
        games
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری بازی‌های کارتی: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * نمایش جزئیات بازی کارتی
   */
  showCardGame: async (req, res) => {
    try {
      const game = await CardGame.findById(req.params.id);
      if (!game) {
        req.flash('error', 'بازی مورد نظر یافت نشد');
        return res.redirect('/admin/games/card-games');
      }
      
      res.render('games/card-games/edit', {
        title: `ویرایش بازی ${game.name}`,
        game
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات بازی: ${error.message}`);
      res.redirect('/admin/games/card-games');
    }
  },

  /**
   * به‌روزرسانی بازی کارتی
   */
  updateCardGame: async (req, res) => {
    try {
      const {
        name, description, minBet, maxBet, 
        deckCount, shuffleAfterRounds
      } = req.body;
      
      await CardGame.findByIdAndUpdate(req.params.id, {
        name,
        description,
        minBet: parseInt(minBet) || 10,
        maxBet: parseInt(maxBet) || 1000,
        deckCount: parseInt(deckCount) || 1,
        shuffleAfterRounds: parseInt(shuffleAfterRounds) || 5
      });
      
      req.flash('success', 'بازی با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/card-games');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی بازی: ${error.message}`);
      res.redirect(`/admin/games/card-games/${req.params.id}`);
    }
  },

  /**
   * فعال/غیرفعال کردن بازی کارتی
   */
  toggleCardGame: async (req, res) => {
    try {
      const game = await CardGame.findById(req.params.id);
      if (!game) {
        req.flash('error', 'بازی مورد نظر یافت نشد');
        return res.redirect('/admin/games/card-games');
      }
      
      // تغییر وضعیت فعال بودن
      await CardGame.findByIdAndUpdate(req.params.id, {
        isActive: !game.isActive
      });
      
      req.flash('success', `بازی ${game.name} ${game.isActive ? 'غیرفعال' : 'فعال'} شد`);
      res.redirect('/admin/games/card-games');
    } catch (error) {
      req.flash('error', `خطا در تغییر وضعیت بازی: ${error.message}`);
      res.redirect('/admin/games/card-games');
    }
  },

  /**
   * نمایش تنظیمات بازی رولت
   */
  showRouletteSettings: async (req, res) => {
    try {
      // یافتن تنظیمات رولت
      const settings = await GameSettings.findOne({ game: 'roulette' });
      
      res.render('games/roulette', {
        title: 'تنظیمات بازی رولت',
        settings: settings || {
          minBet: 10,
          maxBet: 500,
          houseEdge: 5.26,
          pockets: 37, // 0-36 (شامل 0)
          isActive: true
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات رولت: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * به‌روزرسانی تنظیمات بازی رولت
   */
  updateRouletteSettings: async (req, res) => {
    try {
      const {
        minBet, maxBet, houseEdge, pockets, isActive
      } = req.body;
      
      await GameSettings.findOneAndUpdate(
        { game: 'roulette' },
        {
          game: 'roulette',
          minBet: parseInt(minBet) || 10,
          maxBet: parseInt(maxBet) || 500,
          houseEdge: parseFloat(houseEdge) || 5.26,
          pockets: parseInt(pockets) || 37,
          isActive: isActive === 'on'
        },
        { upsert: true }
      );
      
      req.flash('success', 'تنظیمات رولت با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/roulette');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات رولت: ${error.message}`);
      res.redirect('/admin/games/roulette');
    }
  },

  /**
   * نمایش تنظیمات بازی اسلات
   */
  showSlotsSettings: async (req, res) => {
    try {
      // یافتن تنظیمات اسلات
      const settings = await GameSettings.findOne({ game: 'slots' });
      
      res.render('games/slots/settings', {
        title: 'تنظیمات بازی اسلات',
        settings: settings || {
          minBet: 5,
          maxBet: 200,
          payoutMultipliers: {
            threeOfAKind: 10,
            twoOfAKind: 3,
            jackpot: 50
          },
          reels: 3,
          isActive: true
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات اسلات: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * به‌روزرسانی تنظیمات بازی اسلات
   */
  updateSlotsSettings: async (req, res) => {
    try {
      const {
        minBet, maxBet, threeOfAKindMultiplier, 
        twoOfAKindMultiplier, jackpotMultiplier,
        reels, isActive
      } = req.body;
      
      await GameSettings.findOneAndUpdate(
        { game: 'slots' },
        {
          game: 'slots',
          minBet: parseInt(minBet) || 5,
          maxBet: parseInt(maxBet) || 200,
          payoutMultipliers: {
            threeOfAKind: parseInt(threeOfAKindMultiplier) || 10,
            twoOfAKind: parseInt(twoOfAKindMultiplier) || 3,
            jackpot: parseInt(jackpotMultiplier) || 50
          },
          reels: parseInt(reels) || 3,
          isActive: isActive === 'on'
        },
        { upsert: true }
      );
      
      req.flash('success', 'تنظیمات اسلات با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/slots');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات اسلات: ${error.message}`);
      res.redirect('/admin/games/slots');
    }
  },

  /**
   * نمایش نمادهای اسلات
   */
  showSlotSymbols: async (req, res) => {
    try {
      const symbols = await SlotSymbol.find().sort({ name: 1 });
      res.render('games/slots/symbols', {
        title: 'مدیریت نمادهای اسلات',
        symbols
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری نمادهای اسلات: ${error.message}`);
      res.redirect('/admin/games/slots');
    }
  },

  /**
   * ایجاد نماد جدید اسلات
   */
  createSlotSymbol: async (req, res) => {
    try {
      const { name, emoji, rarity, jackpot } = req.body;
      
      await SlotSymbol.create({
        name,
        emoji: emoji || '❓',
        rarity: parseFloat(rarity) || 1.0,
        isJackpot: jackpot === 'on'
      });
      
      req.flash('success', 'نماد جدید با موفقیت ایجاد شد');
      res.redirect('/admin/games/slots/symbols');
    } catch (error) {
      req.flash('error', `خطا در ایجاد نماد: ${error.message}`);
      res.redirect('/admin/games/slots/symbols');
    }
  },

  /**
   * به‌روزرسانی نماد اسلات
   */
  updateSlotSymbol: async (req, res) => {
    try {
      const { name, emoji, rarity, jackpot } = req.body;
      
      await SlotSymbol.findByIdAndUpdate(req.params.id, {
        name,
        emoji: emoji || '❓',
        rarity: parseFloat(rarity) || 1.0,
        isJackpot: jackpot === 'on'
      });
      
      req.flash('success', 'نماد با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/slots/symbols');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی نماد: ${error.message}`);
      res.redirect('/admin/games/slots/symbols');
    }
  },

  /**
   * حذف نماد اسلات
   */
  deleteSlotSymbol: async (req, res) => {
    try {
      await SlotSymbol.findByIdAndDelete(req.params.id);
      req.flash('success', 'نماد با موفقیت حذف شد');
      res.redirect('/admin/games/slots/symbols');
    } catch (error) {
      req.flash('error', `خطا در حذف نماد: ${error.message}`);
      res.redirect('/admin/games/slots/symbols');
    }
  },

  /**
   * نمایش تنظیمات بازی بلک جک
   */
  showBlackjackSettings: async (req, res) => {
    try {
      // یافتن تنظیمات بلک جک
      const settings = await GameSettings.findOne({ game: 'blackjack' });
      
      res.render('games/blackjack', {
        title: 'تنظیمات بازی بلک جک',
        settings: settings || {
          minBet: 20,
          maxBet: 1000,
          deckCount: 6,
          shuffleAfterRounds: 5,
          dealerStandSoft17: true,
          blackjackPayout: 1.5,
          allowSplit: true,
          allowDoubleDown: true,
          allowInsurance: true,
          isActive: true
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات بلک جک: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * به‌روزرسانی تنظیمات بازی بلک جک
   */
  updateBlackjackSettings: async (req, res) => {
    try {
      const {
        minBet, maxBet, deckCount, shuffleAfterRounds,
        dealerStandSoft17, blackjackPayout,
        allowSplit, allowDoubleDown, allowInsurance, isActive
      } = req.body;
      
      await GameSettings.findOneAndUpdate(
        { game: 'blackjack' },
        {
          game: 'blackjack',
          minBet: parseInt(minBet) || 20,
          maxBet: parseInt(maxBet) || 1000,
          deckCount: parseInt(deckCount) || 6,
          shuffleAfterRounds: parseInt(shuffleAfterRounds) || 5,
          dealerStandSoft17: dealerStandSoft17 === 'on',
          blackjackPayout: parseFloat(blackjackPayout) || 1.5,
          allowSplit: allowSplit === 'on',
          allowDoubleDown: allowDoubleDown === 'on',
          allowInsurance: allowInsurance === 'on',
          isActive: isActive === 'on'
        },
        { upsert: true }
      );
      
      req.flash('success', 'تنظیمات بلک جک با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/blackjack');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات بلک جک: ${error.message}`);
      res.redirect('/admin/games/blackjack');
    }
  },

  /**
   * نمایش تنظیمات بازی حکم
   */
  showHokmSettings: async (req, res) => {
    try {
      // یافتن تنظیمات حکم
      const settings = await GameSettings.findOne({ game: 'hokm' });
      
      res.render('games/hokm', {
        title: 'تنظیمات بازی حکم',
        settings: settings || {
          minBet: 50,
          maxBet: 1000,
          pointsToWin: 7,
          timePerMove: 30, // ثانیه
          maxPlayers: 4,
          isActive: true
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات حکم: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * به‌روزرسانی تنظیمات بازی حکم
   */
  updateHokmSettings: async (req, res) => {
    try {
      const {
        minBet, maxBet, pointsToWin,
        timePerMove, maxPlayers, isActive
      } = req.body;
      
      await GameSettings.findOneAndUpdate(
        { game: 'hokm' },
        {
          game: 'hokm',
          minBet: parseInt(minBet) || 50,
          maxBet: parseInt(maxBet) || 1000,
          pointsToWin: parseInt(pointsToWin) || 7,
          timePerMove: parseInt(timePerMove) || 30,
          maxPlayers: parseInt(maxPlayers) || 4,
          isActive: isActive === 'on'
        },
        { upsert: true }
      );
      
      req.flash('success', 'تنظیمات حکم با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/hokm');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات حکم: ${error.message}`);
      res.redirect('/admin/games/hokm');
    }
  },

  /**
   * نمایش لیست بازی‌های گروهی
   */
  showGroupGames: async (req, res) => {
    try {
      const games = await GroupGame.find().sort({ name: 1 });
      res.render('games/group-games/index', {
        title: 'مدیریت بازی‌های گروهی',
        games
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری بازی‌های گروهی: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * نمایش جزئیات بازی گروهی
   */
  showGroupGame: async (req, res) => {
    try {
      const game = await GroupGame.findById(req.params.id);
      if (!game) {
        req.flash('error', 'بازی مورد نظر یافت نشد');
        return res.redirect('/admin/games/group-games');
      }
      
      res.render('games/group-games/edit', {
        title: `ویرایش بازی ${game.name}`,
        game
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات بازی: ${error.message}`);
      res.redirect('/admin/games/group-games');
    }
  },

  /**
   * به‌روزرسانی بازی گروهی
   */
  updateGroupGame: async (req, res) => {
    try {
      const {
        name, description, minPlayers, maxPlayers,
        minBet, maxBet, timePerRound, entranceFee
      } = req.body;
      
      await GroupGame.findByIdAndUpdate(req.params.id, {
        name,
        description,
        minPlayers: parseInt(minPlayers) || 3,
        maxPlayers: parseInt(maxPlayers) || 10,
        minBet: parseInt(minBet) || 0,
        maxBet: parseInt(maxBet) || 0,
        timePerRound: parseInt(timePerRound) || 60,
        entranceFee: parseInt(entranceFee) || 0
      });
      
      req.flash('success', 'بازی با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/group-games');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی بازی: ${error.message}`);
      res.redirect(`/admin/games/group-games/${req.params.id}`);
    }
  },

  /**
   * فعال/غیرفعال کردن بازی گروهی
   */
  toggleGroupGame: async (req, res) => {
    try {
      const game = await GroupGame.findById(req.params.id);
      if (!game) {
        req.flash('error', 'بازی مورد نظر یافت نشد');
        return res.redirect('/admin/games/group-games');
      }
      
      // تغییر وضعیت فعال بودن
      await GroupGame.findByIdAndUpdate(req.params.id, {
        isActive: !game.isActive
      });
      
      req.flash('success', `بازی ${game.name} ${game.isActive ? 'غیرفعال' : 'فعال'} شد`);
      res.redirect('/admin/games/group-games');
    } catch (error) {
      req.flash('error', `خطا در تغییر وضعیت بازی: ${error.message}`);
      res.redirect('/admin/games/group-games');
    }
  },

  /**
   * نمایش لیست جوایز و پاداش‌ها
   */
  showRewards: async (req, res) => {
    try {
      const rewards = await GameReward.find().sort({ name: 1 });
      res.render('games/rewards/index', {
        title: 'مدیریت جوایز و پاداش‌ها',
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری جوایز: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * نمایش فرم ایجاد جایزه جدید
   */
  showCreateReward: (req, res) => {
    res.render('games/rewards/create', {
      title: 'ایجاد جایزه جدید'
    });
  },

  /**
   * ایجاد جایزه جدید
   */
  createReward: async (req, res) => {
    try {
      const {
        name, description, type, amount,
        currency, rarity, gameTypes
      } = req.body;
      
      await GameReward.create({
        name,
        description,
        type: type || 'currency',
        amount: parseInt(amount) || 100,
        currency: currency || 'coin',
        rarity: parseFloat(rarity) || 1.0,
        gameTypes: gameTypes ? gameTypes.split(',') : []
      });
      
      req.flash('success', 'جایزه جدید با موفقیت ایجاد شد');
      res.redirect('/admin/games/rewards');
    } catch (error) {
      req.flash('error', `خطا در ایجاد جایزه: ${error.message}`);
      res.redirect('/admin/games/rewards/new');
    }
  },

  /**
   * نمایش جزئیات جایزه
   */
  showReward: async (req, res) => {
    try {
      const reward = await GameReward.findById(req.params.id);
      if (!reward) {
        req.flash('error', 'جایزه مورد نظر یافت نشد');
        return res.redirect('/admin/games/rewards');
      }
      
      res.render('games/rewards/edit', {
        title: `ویرایش جایزه ${reward.name}`,
        reward
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات جایزه: ${error.message}`);
      res.redirect('/admin/games/rewards');
    }
  },

  /**
   * به‌روزرسانی جایزه
   */
  updateReward: async (req, res) => {
    try {
      const {
        name, description, type, amount,
        currency, rarity, gameTypes, isActive
      } = req.body;
      
      await GameReward.findByIdAndUpdate(req.params.id, {
        name,
        description,
        type: type || 'currency',
        amount: parseInt(amount) || 100,
        currency: currency || 'coin',
        rarity: parseFloat(rarity) || 1.0,
        gameTypes: gameTypes ? gameTypes.split(',') : [],
        isActive: isActive === 'on'
      });
      
      req.flash('success', 'جایزه با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/rewards');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی جایزه: ${error.message}`);
      res.redirect(`/admin/games/rewards/${req.params.id}`);
    }
  },

  /**
   * حذف جایزه
   */
  deleteReward: async (req, res) => {
    try {
      await GameReward.findByIdAndDelete(req.params.id);
      req.flash('success', 'جایزه با موفقیت حذف شد');
      res.redirect('/admin/games/rewards');
    } catch (error) {
      req.flash('error', `خطا در حذف جایزه: ${error.message}`);
      res.redirect('/admin/games/rewards');
    }
  },

  /**
   * نمایش صفحه تقلب (فقط برای آزمایش)
   */
  showCheats: (req, res) => {
    res.render('games/cheats', {
      title: 'ابزارهای آزمایش و تقلب',
      currentWinRate: parseFloat(req.query.winRate) || 50
    });
  },

  /**
   * تنظیم نرخ برد شانسی
   */
  setCheatsWinRate: (req, res) => {
    const { winRate } = req.body;
    const rate = parseFloat(winRate) || 50;
    
    // ذخیره در جلسه
    req.session.cheatWinRate = rate;
    
    req.flash('success', `نرخ برد برای بازی‌های شانسی به ${rate}% تغییر کرد`);
    res.redirect(`/admin/games/cheats?winRate=${rate}`);
  },

  /**
   * ریست تنظیمات تقلب
   */
  resetCheats: (req, res) => {
    // حذف تنظیمات تقلب از جلسه
    delete req.session.cheatWinRate;
    
    req.flash('success', 'تنظیمات تقلب با موفقیت ریست شد');
    res.redirect('/admin/games/cheats');
  },

  /**
   * نمایش آمار کلی بازی‌ها
   */
  showStats: async (req, res) => {
    try {
      // آمار کلی بازی‌ها
      const totalGamesPlayed = await GameStats.aggregate([
        { $group: { _id: null, total: { $sum: "$gamesPlayed" } } }
      ]);
      
      // آمار بازی‌های مختلف
      const gameStats = await GameStats.aggregate([
        { 
          $group: { 
            _id: "$gameId", 
            gamesPlayed: { $sum: "$gamesPlayed" },
            coinsWon: { $sum: "$coinsWon" },
            coinsLost: { $sum: "$coinsLost" }
          } 
        },
        { $sort: { gamesPlayed: -1 } }
      ]);
      
      // آمار بازیکنان برتر
      const topPlayers = await GameStats.aggregate([
        { 
          $group: { 
            _id: "$userId", 
            gamesPlayed: { $sum: "$gamesPlayed" },
            coinsWon: { $sum: "$coinsWon" },
            coinsLost: { $sum: "$coinsLost" },
            netProfit: { $sum: { $subtract: ["$coinsWon", "$coinsLost"] } }
          } 
        },
        { $sort: { netProfit: -1 } },
        { $limit: 10 }
      ]);
      
      res.render('games/stats/index', {
        title: 'آمار بازی‌ها',
        totalGamesPlayed: totalGamesPlayed.length > 0 ? totalGamesPlayed[0].total : 0,
        gameStats,
        topPlayers
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری آمار بازی‌ها: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * نمایش آمار یک بازی خاص
   */
  showGameStats: async (req, res) => {
    try {
      const { gameId } = req.params;
      
      // یافتن اطلاعات بازی
      const gamblingGame = await GamblingGame.findById(gameId);
      const cardGame = await CardGame.findById(gameId);
      const groupGame = await GroupGame.findById(gameId);
      
      const game = gamblingGame || cardGame || groupGame;
      if (!game) {
        req.flash('error', 'بازی مورد نظر یافت نشد');
        return res.redirect('/admin/games/stats');
      }
      
      // آمار کلی بازی
      const stats = await GameStats.findOne({ gameId });
      
      // آمار بازیکنان
      const playerStats = await GameStats.find({ gameId })
        .populate('userId')
        .sort({ gamesPlayed: -1 })
        .limit(20);
      
      res.render('games/stats/game', {
        title: `آمار بازی ${game.name}`,
        game,
        stats: stats || {
          gamesPlayed: 0,
          coinsWon: 0,
          coinsLost: 0
        },
        playerStats
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری آمار بازی: ${error.message}`);
      res.redirect('/admin/games/stats');
    }
  },

  /**
   * نمایش آمار یک کاربر خاص
   */
  showUserStats: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // یافتن اطلاعات کاربر
      const user = await User.findById(userId);
      if (!user) {
        req.flash('error', 'کاربر مورد نظر یافت نشد');
        return res.redirect('/admin/games/stats');
      }
      
      // آمار کلی کاربر
      const totalStats = await GameStats.aggregate([
        { $match: { userId } },
        { 
          $group: { 
            _id: null, 
            gamesPlayed: { $sum: "$gamesPlayed" },
            coinsWon: { $sum: "$coinsWon" },
            coinsLost: { $sum: "$coinsLost" },
            netProfit: { $sum: { $subtract: ["$coinsWon", "$coinsLost"] } }
          } 
        }
      ]);
      
      // آمار بازی‌های کاربر
      const gameStats = await GameStats.find({ userId })
        .sort({ gamesPlayed: -1 });
      
      res.render('games/stats/user', {
        title: `آمار بازی‌های ${user.username}`,
        user,
        totalStats: totalStats.length > 0 ? totalStats[0] : {
          gamesPlayed: 0,
          coinsWon: 0,
          coinsLost: 0,
          netProfit: 0
        },
        gameStats
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری آمار کاربر: ${error.message}`);
      res.redirect('/admin/games/stats');
    }
  },

  /**
   * استخراج آمار بازی‌ها
   */
  exportStats: async (req, res) => {
    try {
      const { gameId, format } = req.query;
      
      // آمار بازی
      let stats;
      if (gameId) {
        stats = await GameStats.find({ gameId })
          .populate('userId')
          .populate('gameId');
      } else {
        stats = await GameStats.find()
          .populate('userId')
          .populate('gameId');
      }
      
      if (format === 'csv') {
        // تبدیل به CSV
        let csv = 'نام بازی,نام کاربر,تعداد بازی,سکه‌های برده,سکه‌های باخته,سود/زیان\n';
        stats.forEach(stat => {
          const gameName = stat.gameId ? stat.gameId.name : 'نامشخص';
          const username = stat.userId ? stat.userId.username : 'ناشناس';
          const netProfit = stat.coinsWon - stat.coinsLost;
          
          csv += `${gameName},${username},${stat.gamesPlayed},${stat.coinsWon},${stat.coinsLost},${netProfit}\n`;
        });
        
        res.header('Content-Type', 'text/csv');
        res.attachment('game-stats.csv');
        res.send(csv);
      } else {
        // تبدیل به JSON
        res.json(stats);
      }
    } catch (error) {
      req.flash('error', `خطا در استخراج آمار: ${error.message}`);
      res.redirect('/admin/games/stats');
    }
  },

  /**
   * نمایش تنظیمات کلی بازی‌ها
   */
  showSettings: async (req, res) => {
    try {
      // یافتن تنظیمات کلی
      const settings = await GameSettings.findOne({ game: 'global' });
      
      res.render('games/settings', {
        title: 'تنظیمات کلی بازی‌ها',
        settings: settings || {
          dailyBetLimit: 10000,
          minPlayerAge: 7, // روز
          showLeaderboards: true,
          enableRewards: true,
          rewardProbability: 5 // درصد
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات: ${error.message}`);
      res.redirect('/admin/games');
    }
  },

  /**
   * به‌روزرسانی تنظیمات کلی بازی‌ها
   */
  updateSettings: async (req, res) => {
    try {
      const {
        dailyBetLimit, minPlayerAge, showLeaderboards,
        enableRewards, rewardProbability
      } = req.body;
      
      await GameSettings.findOneAndUpdate(
        { game: 'global' },
        {
          game: 'global',
          dailyBetLimit: parseInt(dailyBetLimit) || 10000,
          minPlayerAge: parseInt(minPlayerAge) || 7,
          showLeaderboards: showLeaderboards === 'on',
          enableRewards: enableRewards === 'on',
          rewardProbability: parseFloat(rewardProbability) || 5
        },
        { upsert: true }
      );
      
      req.flash('success', 'تنظیمات کلی بازی‌ها با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/games/settings');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات: ${error.message}`);
      res.redirect('/admin/games/settings');
    }
  }
};