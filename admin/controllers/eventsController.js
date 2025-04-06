/**
 * کنترلر مدیریت رویدادها
 * 
 * این ماژول شامل توابع مدیریت رویدادها، قرعه‌کشی‌ها، رویدادهای زمانی،
 * رویدادهای فصلی، چالش‌ها، جوایز، کدهای هدیه و اعلانات است.
 */

import { Giveaway } from '../models/giveaway.js';
import { TimeEvent } from '../models/timeEvent.js';
import { SeasonalEvent } from '../models/seasonalEvent.js';
import { Challenge } from '../models/challenge.js';
import { EventReward } from '../models/eventReward.js';
import { GiftCode } from '../models/giftCode.js';
import { Announcement } from '../models/announcement.js';
import { EventSettings } from '../models/eventSettings.js';
import { User } from '../models/user.js';
import { Server } from '../models/server.js';

/**
 * کنترلر رویدادها
 */
export const eventsController = {
  /**
   * نمایش داشبورد مدیریت رویدادها
   */
  showDashboard: async (req, res) => {
    try {
      // آمار کلی رویدادها
      const giveawaysCount = await Giveaway.countDocuments();
      const activeGiveaways = await Giveaway.countDocuments({ isActive: true });
      
      const timeEventsCount = await TimeEvent.countDocuments();
      const activeTimeEvents = await TimeEvent.countDocuments({ isActive: true });
      
      const seasonalEventsCount = await SeasonalEvent.countDocuments();
      const activeSeasonalEvents = await SeasonalEvent.countDocuments({ isActive: true });
      
      const challengesCount = await Challenge.countDocuments();
      const activeChallenges = await Challenge.countDocuments({ isActive: true });
      
      const giftCodesCount = await GiftCode.countDocuments();
      const unusedGiftCodes = await GiftCode.countDocuments({ isUsed: false });
      
      const announcementsCount = await Announcement.countDocuments();
      
      // رویدادهای اخیر
      const recentGiveaways = await Giveaway.find()
        .sort({ createdAt: -1 })
        .limit(5);
      
      const upcomingEvents = await TimeEvent.find({
        isActive: true,
        startTime: { $gte: new Date() }
      })
        .sort({ startTime: 1 })
        .limit(5);
      
      res.render('events/dashboard', {
        title: 'مدیریت رویدادها',
        stats: {
          giveawaysCount,
          activeGiveaways,
          timeEventsCount,
          activeTimeEvents,
          seasonalEventsCount,
          activeSeasonalEvents,
          challengesCount,
          activeChallenges,
          giftCodesCount,
          unusedGiftCodes,
          announcementsCount
        },
        recentGiveaways,
        upcomingEvents
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری داشبورد رویدادها: ${error.message}`);
      res.redirect('/admin/dashboard');
    }
  },

  /**
   * نمایش لیست قرعه‌کشی‌ها
   */
  showGiveaways: async (req, res) => {
    try {
      const giveaways = await Giveaway.find().sort({ createdAt: -1 });
      res.render('events/giveaways/index', {
        title: 'مدیریت قرعه‌کشی‌ها',
        giveaways
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری قرعه‌کشی‌ها: ${error.message}`);
      res.redirect('/admin/events');
    }
  },

  /**
   * نمایش فرم ایجاد قرعه‌کشی جدید
   */
  showCreateGiveaway: async (req, res) => {
    try {
      const servers = await Server.find().sort({ name: 1 });
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/giveaways/create', {
        title: 'ایجاد قرعه‌کشی جدید',
        servers,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری فرم ایجاد قرعه‌کشی: ${error.message}`);
      res.redirect('/admin/events/giveaways');
    }
  },

  /**
   * ایجاد قرعه‌کشی جدید
   */
  createGiveaway: async (req, res) => {
    try {
      const {
        title, description, serverId, channelId,
        prize, winnerCount, duration, requirements
      } = req.body;
      
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + parseInt(duration || 24));
      
      await Giveaway.create({
        title,
        description,
        serverId,
        channelId,
        prize,
        winnerCount: parseInt(winnerCount) || 1,
        endTime,
        requirements: requirements ? requirements.split(',') : [],
        createdBy: req.session.user._id,
        isActive: true
      });
      
      req.flash('success', 'قرعه‌کشی جدید با موفقیت ایجاد شد');
      res.redirect('/admin/events/giveaways');
    } catch (error) {
      req.flash('error', `خطا در ایجاد قرعه‌کشی: ${error.message}`);
      res.redirect('/admin/events/giveaways/new');
    }
  },

  /**
   * نمایش جزئیات قرعه‌کشی
   */
  showGiveaway: async (req, res) => {
    try {
      const giveaway = await Giveaway.findById(req.params.id)
        .populate('participants')
        .populate('winners')
        .populate('createdBy');
      
      if (!giveaway) {
        req.flash('error', 'قرعه‌کشی مورد نظر یافت نشد');
        return res.redirect('/admin/events/giveaways');
      }
      
      const servers = await Server.find().sort({ name: 1 });
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/giveaways/edit', {
        title: `ویرایش قرعه‌کشی: ${giveaway.title}`,
        giveaway,
        servers,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات قرعه‌کشی: ${error.message}`);
      res.redirect('/admin/events/giveaways');
    }
  },

  /**
   * به‌روزرسانی قرعه‌کشی
   */
  updateGiveaway: async (req, res) => {
    try {
      const {
        title, description, serverId, channelId,
        prize, winnerCount, endTime, requirements, isActive
      } = req.body;
      
      await Giveaway.findByIdAndUpdate(req.params.id, {
        title,
        description,
        serverId,
        channelId,
        prize,
        winnerCount: parseInt(winnerCount) || 1,
        endTime: new Date(endTime),
        requirements: requirements ? requirements.split(',') : [],
        isActive: isActive === 'on'
      });
      
      req.flash('success', 'قرعه‌کشی با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/events/giveaways');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی قرعه‌کشی: ${error.message}`);
      res.redirect(`/admin/events/giveaways/${req.params.id}`);
    }
  },

  /**
   * حذف قرعه‌کشی
   */
  deleteGiveaway: async (req, res) => {
    try {
      await Giveaway.findByIdAndDelete(req.params.id);
      req.flash('success', 'قرعه‌کشی با موفقیت حذف شد');
      res.redirect('/admin/events/giveaways');
    } catch (error) {
      req.flash('error', `خطا در حذف قرعه‌کشی: ${error.message}`);
      res.redirect('/admin/events/giveaways');
    }
  },

  /**
   * پایان دادن به قرعه‌کشی و انتخاب برندگان
   */
  endGiveaway: async (req, res) => {
    try {
      const giveaway = await Giveaway.findById(req.params.id)
        .populate('participants');
      
      if (!giveaway) {
        req.flash('error', 'قرعه‌کشی مورد نظر یافت نشد');
        return res.redirect('/admin/events/giveaways');
      }
      
      if (giveaway.participants.length === 0) {
        req.flash('error', 'این قرعه‌کشی هیچ شرکت‌کننده‌ای ندارد');
        return res.redirect(`/admin/events/giveaways/${req.params.id}`);
      }
      
      // انتخاب تصادفی برندگان
      const participants = [...giveaway.participants];
      const winners = [];
      
      for (let i = 0; i < Math.min(giveaway.winnerCount, participants.length); i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        winners.push(participants[randomIndex]._id);
        participants.splice(randomIndex, 1);
      }
      
      // به‌روزرسانی قرعه‌کشی
      await Giveaway.findByIdAndUpdate(req.params.id, {
        winners,
        isActive: false,
        endedAt: new Date()
      });
      
      req.flash('success', `قرعه‌کشی با موفقیت پایان یافت و ${winners.length} برنده انتخاب شد`);
      res.redirect(`/admin/events/giveaways/${req.params.id}`);
    } catch (error) {
      req.flash('error', `خطا در پایان دادن به قرعه‌کشی: ${error.message}`);
      res.redirect(`/admin/events/giveaways/${req.params.id}`);
    }
  },

  /**
   * انتخاب مجدد برندگان قرعه‌کشی
   */
  rerollGiveaway: async (req, res) => {
    try {
      const giveaway = await Giveaway.findById(req.params.id)
        .populate('participants');
      
      if (!giveaway) {
        req.flash('error', 'قرعه‌کشی مورد نظر یافت نشد');
        return res.redirect('/admin/events/giveaways');
      }
      
      if (giveaway.participants.length === 0) {
        req.flash('error', 'این قرعه‌کشی هیچ شرکت‌کننده‌ای ندارد');
        return res.redirect(`/admin/events/giveaways/${req.params.id}`);
      }
      
      // انتخاب تصادفی برندگان جدید
      const participants = [...giveaway.participants];
      const winners = [];
      
      for (let i = 0; i < Math.min(giveaway.winnerCount, participants.length); i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        winners.push(participants[randomIndex]._id);
        participants.splice(randomIndex, 1);
      }
      
      // به‌روزرسانی قرعه‌کشی
      await Giveaway.findByIdAndUpdate(req.params.id, {
        winners,
        rerolledAt: new Date()
      });
      
      req.flash('success', `برندگان جدید قرعه‌کشی با موفقیت انتخاب شدند (${winners.length} نفر)`);
      res.redirect(`/admin/events/giveaways/${req.params.id}`);
    } catch (error) {
      req.flash('error', `خطا در انتخاب مجدد برندگان: ${error.message}`);
      res.redirect(`/admin/events/giveaways/${req.params.id}`);
    }
  },

  /**
   * نمایش لیست رویدادهای زمانی
   */
  showTimeEvents: async (req, res) => {
    try {
      const events = await TimeEvent.find().sort({ startTime: 1 });
      res.render('events/time-events/index', {
        title: 'مدیریت رویدادهای زمانی',
        events
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری رویدادهای زمانی: ${error.message}`);
      res.redirect('/admin/events');
    }
  },

  /**
   * نمایش فرم ایجاد رویداد زمانی جدید
   */
  showCreateTimeEvent: async (req, res) => {
    try {
      const servers = await Server.find().sort({ name: 1 });
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/time-events/create', {
        title: 'ایجاد رویداد زمانی جدید',
        servers,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری فرم ایجاد رویداد زمانی: ${error.message}`);
      res.redirect('/admin/events/time-events');
    }
  },

  /**
   * ایجاد رویداد زمانی جدید
   */
  createTimeEvent: async (req, res) => {
    try {
      const {
        title, description, serverId, channelId,
        startTime, endTime, rewards, multipliers, isRecurring,
        recurringType, recurringInterval
      } = req.body;
      
      await TimeEvent.create({
        title,
        description,
        serverId,
        channelId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        rewards: rewards ? rewards.split(',') : [],
        multipliers: {
          coins: parseFloat(multipliers?.coins) || 1.0,
          xp: parseFloat(multipliers?.xp) || 1.0,
          drops: parseFloat(multipliers?.drops) || 1.0
        },
        isRecurring: isRecurring === 'on',
        recurringType: recurringType || 'none',
        recurringInterval: parseInt(recurringInterval) || 0,
        createdBy: req.session.user._id,
        isActive: true
      });
      
      req.flash('success', 'رویداد زمانی جدید با موفقیت ایجاد شد');
      res.redirect('/admin/events/time-events');
    } catch (error) {
      req.flash('error', `خطا در ایجاد رویداد زمانی: ${error.message}`);
      res.redirect('/admin/events/time-events/new');
    }
  },

  /**
   * نمایش جزئیات رویداد زمانی
   */
  showTimeEvent: async (req, res) => {
    try {
      const event = await TimeEvent.findById(req.params.id)
        .populate('createdBy');
      
      if (!event) {
        req.flash('error', 'رویداد زمانی مورد نظر یافت نشد');
        return res.redirect('/admin/events/time-events');
      }
      
      const servers = await Server.find().sort({ name: 1 });
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/time-events/edit', {
        title: `ویرایش رویداد زمانی: ${event.title}`,
        event,
        servers,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات رویداد زمانی: ${error.message}`);
      res.redirect('/admin/events/time-events');
    }
  },

  /**
   * به‌روزرسانی رویداد زمانی
   */
  updateTimeEvent: async (req, res) => {
    try {
      const {
        title, description, serverId, channelId,
        startTime, endTime, rewards, 
        coinsMultiplier, xpMultiplier, dropsMultiplier,
        isRecurring, recurringType, recurringInterval, isActive
      } = req.body;
      
      await TimeEvent.findByIdAndUpdate(req.params.id, {
        title,
        description,
        serverId,
        channelId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        rewards: rewards ? rewards.split(',') : [],
        multipliers: {
          coins: parseFloat(coinsMultiplier) || 1.0,
          xp: parseFloat(xpMultiplier) || 1.0,
          drops: parseFloat(dropsMultiplier) || 1.0
        },
        isRecurring: isRecurring === 'on',
        recurringType: recurringType || 'none',
        recurringInterval: parseInt(recurringInterval) || 0,
        isActive: isActive === 'on'
      });
      
      req.flash('success', 'رویداد زمانی با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/events/time-events');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی رویداد زمانی: ${error.message}`);
      res.redirect(`/admin/events/time-events/${req.params.id}`);
    }
  },

  /**
   * حذف رویداد زمانی
   */
  deleteTimeEvent: async (req, res) => {
    try {
      await TimeEvent.findByIdAndDelete(req.params.id);
      req.flash('success', 'رویداد زمانی با موفقیت حذف شد');
      res.redirect('/admin/events/time-events');
    } catch (error) {
      req.flash('error', `خطا در حذف رویداد زمانی: ${error.message}`);
      res.redirect('/admin/events/time-events');
    }
  },

  /**
   * فعال/غیرفعال کردن رویداد زمانی
   */
  toggleTimeEvent: async (req, res) => {
    try {
      const event = await TimeEvent.findById(req.params.id);
      
      if (!event) {
        req.flash('error', 'رویداد زمانی مورد نظر یافت نشد');
        return res.redirect('/admin/events/time-events');
      }
      
      // تغییر وضعیت فعال بودن
      await TimeEvent.findByIdAndUpdate(req.params.id, {
        isActive: !event.isActive
      });
      
      req.flash('success', `رویداد زمانی ${event.isActive ? 'غیرفعال' : 'فعال'} شد`);
      res.redirect('/admin/events/time-events');
    } catch (error) {
      req.flash('error', `خطا در تغییر وضعیت رویداد زمانی: ${error.message}`);
      res.redirect('/admin/events/time-events');
    }
  },

  /**
   * نمایش لیست رویدادهای فصلی
   */
  showSeasonalEvents: async (req, res) => {
    try {
      const events = await SeasonalEvent.find().sort({ startTime: 1 });
      res.render('events/seasonal/index', {
        title: 'مدیریت رویدادهای فصلی',
        events
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری رویدادهای فصلی: ${error.message}`);
      res.redirect('/admin/events');
    }
  },

  /**
   * نمایش فرم ایجاد رویداد فصلی جدید
   */
  showCreateSeasonalEvent: async (req, res) => {
    try {
      const servers = await Server.find().sort({ name: 1 });
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/seasonal/create', {
        title: 'ایجاد رویداد فصلی جدید',
        servers,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری فرم ایجاد رویداد فصلی: ${error.message}`);
      res.redirect('/admin/events/seasonal');
    }
  },

  /**
   * ایجاد رویداد فصلی جدید
   */
  createSeasonalEvent: async (req, res) => {
    try {
      const {
        title, description, season, 
        startTime, endTime, rewards, 
        themeColor, themeEmoji, servers
      } = req.body;
      
      await SeasonalEvent.create({
        title,
        description,
        season: season || 'spring',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        rewards: rewards ? rewards.split(',') : [],
        themeColor: themeColor || '#ffffff',
        themeEmoji: themeEmoji || '🎉',
        servers: servers ? servers.split(',') : [],
        createdBy: req.session.user._id,
        isActive: true
      });
      
      req.flash('success', 'رویداد فصلی جدید با موفقیت ایجاد شد');
      res.redirect('/admin/events/seasonal');
    } catch (error) {
      req.flash('error', `خطا در ایجاد رویداد فصلی: ${error.message}`);
      res.redirect('/admin/events/seasonal/new');
    }
  },

  /**
   * نمایش جزئیات رویداد فصلی
   */
  showSeasonalEvent: async (req, res) => {
    try {
      const event = await SeasonalEvent.findById(req.params.id)
        .populate('createdBy');
      
      if (!event) {
        req.flash('error', 'رویداد فصلی مورد نظر یافت نشد');
        return res.redirect('/admin/events/seasonal');
      }
      
      const servers = await Server.find().sort({ name: 1 });
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/seasonal/edit', {
        title: `ویرایش رویداد فصلی: ${event.title}`,
        event,
        servers,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات رویداد فصلی: ${error.message}`);
      res.redirect('/admin/events/seasonal');
    }
  },

  /**
   * به‌روزرسانی رویداد فصلی
   */
  updateSeasonalEvent: async (req, res) => {
    try {
      const {
        title, description, season, 
        startTime, endTime, rewards, 
        themeColor, themeEmoji, servers, isActive
      } = req.body;
      
      await SeasonalEvent.findByIdAndUpdate(req.params.id, {
        title,
        description,
        season: season || 'spring',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        rewards: rewards ? rewards.split(',') : [],
        themeColor: themeColor || '#ffffff',
        themeEmoji: themeEmoji || '🎉',
        servers: servers ? servers.split(',') : [],
        isActive: isActive === 'on'
      });
      
      req.flash('success', 'رویداد فصلی با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/events/seasonal');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی رویداد فصلی: ${error.message}`);
      res.redirect(`/admin/events/seasonal/${req.params.id}`);
    }
  },

  /**
   * حذف رویداد فصلی
   */
  deleteSeasonalEvent: async (req, res) => {
    try {
      await SeasonalEvent.findByIdAndDelete(req.params.id);
      req.flash('success', 'رویداد فصلی با موفقیت حذف شد');
      res.redirect('/admin/events/seasonal');
    } catch (error) {
      req.flash('error', `خطا در حذف رویداد فصلی: ${error.message}`);
      res.redirect('/admin/events/seasonal');
    }
  },

  /**
   * فعال/غیرفعال کردن رویداد فصلی
   */
  toggleSeasonalEvent: async (req, res) => {
    try {
      const event = await SeasonalEvent.findById(req.params.id);
      
      if (!event) {
        req.flash('error', 'رویداد فصلی مورد نظر یافت نشد');
        return res.redirect('/admin/events/seasonal');
      }
      
      // تغییر وضعیت فعال بودن
      await SeasonalEvent.findByIdAndUpdate(req.params.id, {
        isActive: !event.isActive
      });
      
      req.flash('success', `رویداد فصلی ${event.isActive ? 'غیرفعال' : 'فعال'} شد`);
      res.redirect('/admin/events/seasonal');
    } catch (error) {
      req.flash('error', `خطا در تغییر وضعیت رویداد فصلی: ${error.message}`);
      res.redirect('/admin/events/seasonal');
    }
  },

  /**
   * نمایش لیست چالش‌ها
   */
  showChallenges: async (req, res) => {
    try {
      const challenges = await Challenge.find().sort({ createdAt: -1 });
      res.render('events/challenges/index', {
        title: 'مدیریت چالش‌ها',
        challenges
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری چالش‌ها: ${error.message}`);
      res.redirect('/admin/events');
    }
  },

  /**
   * نمایش فرم ایجاد چالش جدید
   */
  showCreateChallenge: async (req, res) => {
    try {
      const servers = await Server.find().sort({ name: 1 });
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/challenges/create', {
        title: 'ایجاد چالش جدید',
        servers,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری فرم ایجاد چالش: ${error.message}`);
      res.redirect('/admin/events/challenges');
    }
  },

  /**
   * ایجاد چالش جدید
   */
  createChallenge: async (req, res) => {
    try {
      const {
        title, description, servers,
        type, goal, reward, startTime, 
        endTime, difficulty
      } = req.body;
      
      await Challenge.create({
        title,
        description,
        servers: servers ? servers.split(',') : [],
        type: type || 'message',
        goal: parseInt(goal) || 10,
        reward,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null,
        difficulty: difficulty || 'medium',
        createdBy: req.session.user._id,
        isActive: true
      });
      
      req.flash('success', 'چالش جدید با موفقیت ایجاد شد');
      res.redirect('/admin/events/challenges');
    } catch (error) {
      req.flash('error', `خطا در ایجاد چالش: ${error.message}`);
      res.redirect('/admin/events/challenges/new');
    }
  },

  /**
   * نمایش جزئیات چالش
   */
  showChallenge: async (req, res) => {
    try {
      const challenge = await Challenge.findById(req.params.id)
        .populate('createdBy')
        .populate('reward');
      
      if (!challenge) {
        req.flash('error', 'چالش مورد نظر یافت نشد');
        return res.redirect('/admin/events/challenges');
      }
      
      // شرکت‌کنندگان چالش
      const participants = await User.find({
        'challenges.challengeId': challenge._id
      }).limit(100);
      
      // تعداد کاربرانی که چالش را کامل کرده‌اند
      const completedCount = await User.countDocuments({
        'challenges.challengeId': challenge._id,
        'challenges.completed': true
      });
      
      const servers = await Server.find().sort({ name: 1 });
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/challenges/edit', {
        title: `ویرایش چالش: ${challenge.title}`,
        challenge,
        participants,
        completedCount,
        servers,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات چالش: ${error.message}`);
      res.redirect('/admin/events/challenges');
    }
  },

  /**
   * به‌روزرسانی چالش
   */
  updateChallenge: async (req, res) => {
    try {
      const {
        title, description, servers,
        type, goal, reward, startTime, 
        endTime, difficulty, isActive
      } = req.body;
      
      await Challenge.findByIdAndUpdate(req.params.id, {
        title,
        description,
        servers: servers ? servers.split(',') : [],
        type: type || 'message',
        goal: parseInt(goal) || 10,
        reward,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null,
        difficulty: difficulty || 'medium',
        isActive: isActive === 'on'
      });
      
      req.flash('success', 'چالش با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/events/challenges');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی چالش: ${error.message}`);
      res.redirect(`/admin/events/challenges/${req.params.id}`);
    }
  },

  /**
   * حذف چالش
   */
  deleteChallenge: async (req, res) => {
    try {
      await Challenge.findByIdAndDelete(req.params.id);
      req.flash('success', 'چالش با موفقیت حذف شد');
      res.redirect('/admin/events/challenges');
    } catch (error) {
      req.flash('error', `خطا در حذف چالش: ${error.message}`);
      res.redirect('/admin/events/challenges');
    }
  },

  /**
   * فعال/غیرفعال کردن چالش
   */
  toggleChallenge: async (req, res) => {
    try {
      const challenge = await Challenge.findById(req.params.id);
      
      if (!challenge) {
        req.flash('error', 'چالش مورد نظر یافت نشد');
        return res.redirect('/admin/events/challenges');
      }
      
      // تغییر وضعیت فعال بودن
      await Challenge.findByIdAndUpdate(req.params.id, {
        isActive: !challenge.isActive
      });
      
      req.flash('success', `چالش ${challenge.isActive ? 'غیرفعال' : 'فعال'} شد`);
      res.redirect('/admin/events/challenges');
    } catch (error) {
      req.flash('error', `خطا در تغییر وضعیت چالش: ${error.message}`);
      res.redirect('/admin/events/challenges');
    }
  },

  /**
   * نمایش لیست جوایز
   */
  showRewards: async (req, res) => {
    try {
      const rewards = await EventReward.find().sort({ name: 1 });
      res.render('events/rewards/index', {
        title: 'مدیریت جوایز',
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری جوایز: ${error.message}`);
      res.redirect('/admin/events');
    }
  },

  /**
   * نمایش فرم ایجاد جایزه جدید
   */
  showCreateReward: (req, res) => {
    res.render('events/rewards/create', {
      title: 'ایجاد جایزه جدید'
    });
  },

  /**
   * ایجاد جایزه جدید
   */
  createReward: async (req, res) => {
    try {
      const {
        name, description, type,
        amount, currency, itemId, roleId
      } = req.body;
      
      await EventReward.create({
        name,
        description,
        type: type || 'coins',
        amount: parseInt(amount) || 0,
        currency: currency || 'coin',
        itemId,
        roleId,
        createdBy: req.session.user._id
      });
      
      req.flash('success', 'جایزه جدید با موفقیت ایجاد شد');
      res.redirect('/admin/events/rewards');
    } catch (error) {
      req.flash('error', `خطا در ایجاد جایزه: ${error.message}`);
      res.redirect('/admin/events/rewards/new');
    }
  },

  /**
   * نمایش جزئیات جایزه
   */
  showReward: async (req, res) => {
    try {
      const reward = await EventReward.findById(req.params.id)
        .populate('createdBy');
      
      if (!reward) {
        req.flash('error', 'جایزه مورد نظر یافت نشد');
        return res.redirect('/admin/events/rewards');
      }
      
      res.render('events/rewards/edit', {
        title: `ویرایش جایزه: ${reward.name}`,
        reward
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات جایزه: ${error.message}`);
      res.redirect('/admin/events/rewards');
    }
  },

  /**
   * به‌روزرسانی جایزه
   */
  updateReward: async (req, res) => {
    try {
      const {
        name, description, type,
        amount, currency, itemId, roleId, isActive
      } = req.body;
      
      await EventReward.findByIdAndUpdate(req.params.id, {
        name,
        description,
        type: type || 'coins',
        amount: parseInt(amount) || 0,
        currency: currency || 'coin',
        itemId,
        roleId,
        isActive: isActive === 'on'
      });
      
      req.flash('success', 'جایزه با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/events/rewards');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی جایزه: ${error.message}`);
      res.redirect(`/admin/events/rewards/${req.params.id}`);
    }
  },

  /**
   * حذف جایزه
   */
  deleteReward: async (req, res) => {
    try {
      await EventReward.findByIdAndDelete(req.params.id);
      req.flash('success', 'جایزه با موفقیت حذف شد');
      res.redirect('/admin/events/rewards');
    } catch (error) {
      req.flash('error', `خطا در حذف جایزه: ${error.message}`);
      res.redirect('/admin/events/rewards');
    }
  },

  /**
   * نمایش لیست کدهای هدیه
   */
  showGiftCodes: async (req, res) => {
    try {
      const codes = await GiftCode.find().sort({ createdAt: -1 });
      res.render('events/gift-codes/index', {
        title: 'مدیریت کدهای هدیه',
        codes
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری کدهای هدیه: ${error.message}`);
      res.redirect('/admin/events');
    }
  },

  /**
   * نمایش فرم ایجاد کد هدیه جدید
   */
  showCreateGiftCode: async (req, res) => {
    try {
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/gift-codes/create', {
        title: 'ایجاد کد هدیه جدید',
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری فرم ایجاد کد هدیه: ${error.message}`);
      res.redirect('/admin/events/gift-codes');
    }
  },

  /**
   * ایجاد کد هدیه جدید
   */
  createGiftCode: async (req, res) => {
    try {
      const {
        code, description, reward,
        expiresAt, maxUses, isMultiUse, isPrivate
      } = req.body;
      
      await GiftCode.create({
        code: code || generateRandomCode(),
        description,
        reward,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: parseInt(maxUses) || 1,
        isMultiUse: isMultiUse === 'on',
        isPrivate: isPrivate === 'on',
        createdBy: req.session.user._id
      });
      
      req.flash('success', 'کد هدیه جدید با موفقیت ایجاد شد');
      res.redirect('/admin/events/gift-codes');
    } catch (error) {
      req.flash('error', `خطا در ایجاد کد هدیه: ${error.message}`);
      res.redirect('/admin/events/gift-codes/new');
    }
  },

  /**
   * نمایش جزئیات کد هدیه
   */
  showGiftCode: async (req, res) => {
    try {
      const giftCode = await GiftCode.findById(req.params.id)
        .populate('reward')
        .populate('createdBy')
        .populate('redeemedBy');
      
      if (!giftCode) {
        req.flash('error', 'کد هدیه مورد نظر یافت نشد');
        return res.redirect('/admin/events/gift-codes');
      }
      
      const rewards = await EventReward.find().sort({ name: 1 });
      
      res.render('events/gift-codes/edit', {
        title: `ویرایش کد هدیه: ${giftCode.code}`,
        giftCode,
        rewards
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات کد هدیه: ${error.message}`);
      res.redirect('/admin/events/gift-codes');
    }
  },

  /**
   * به‌روزرسانی کد هدیه
   */
  updateGiftCode: async (req, res) => {
    try {
      const {
        code, description, reward,
        expiresAt, maxUses, isMultiUse, isPrivate, isActive
      } = req.body;
      
      await GiftCode.findByIdAndUpdate(req.params.id, {
        code,
        description,
        reward,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: parseInt(maxUses) || 1,
        isMultiUse: isMultiUse === 'on',
        isPrivate: isPrivate === 'on',
        isActive: isActive === 'on'
      });
      
      req.flash('success', 'کد هدیه با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/events/gift-codes');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی کد هدیه: ${error.message}`);
      res.redirect(`/admin/events/gift-codes/${req.params.id}`);
    }
  },

  /**
   * حذف کد هدیه
   */
  deleteGiftCode: async (req, res) => {
    try {
      await GiftCode.findByIdAndDelete(req.params.id);
      req.flash('success', 'کد هدیه با موفقیت حذف شد');
      res.redirect('/admin/events/gift-codes');
    } catch (error) {
      req.flash('error', `خطا در حذف کد هدیه: ${error.message}`);
      res.redirect('/admin/events/gift-codes');
    }
  },

  /**
   * ایجاد کدهای هدیه به صورت گروهی
   */
  createBulkGiftCodes: async (req, res) => {
    try {
      const {
        count, prefix, reward,
        expiresAt, maxUses, isMultiUse, isPrivate
      } = req.body;
      
      const numCount = parseInt(count) || 1;
      const codes = [];
      
      for (let i = 0; i < numCount; i++) {
        codes.push({
          code: `${prefix || ''}${generateRandomCode(8)}`,
          description: `کد هدیه گروهی #${i + 1}`,
          reward,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          maxUses: parseInt(maxUses) || 1,
          isMultiUse: isMultiUse === 'on',
          isPrivate: isPrivate === 'on',
          createdBy: req.session.user._id
        });
      }
      
      await GiftCode.insertMany(codes);
      
      req.flash('success', `${numCount} کد هدیه با موفقیت ایجاد شد`);
      res.redirect('/admin/events/gift-codes');
    } catch (error) {
      req.flash('error', `خطا در ایجاد کدهای هدیه گروهی: ${error.message}`);
      res.redirect('/admin/events/gift-codes');
    }
  },

  /**
   * استخراج کدهای هدیه
   */
  exportGiftCodes: async (req, res) => {
    try {
      const { status, format } = req.query;
      
      let query = {};
      
      // فیلتر بر اساس وضعیت
      if (status === 'active') {
        query.isActive = true;
        query.isUsed = false;
        query.$or = [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ];
      } else if (status === 'used') {
        query.isUsed = true;
      } else if (status === 'expired') {
        query.expiresAt = { $lt: new Date() };
        query.isUsed = false;
      }
      
      const codes = await GiftCode.find(query)
        .sort({ createdAt: -1 })
        .populate('reward');
      
      if (format === 'csv') {
        // تبدیل به CSV
        let csv = 'کد,توضیحات,نوع جایزه,مقدار,تاریخ انقضا,استفاده شده,حداکثر استفاده\n';
        codes.forEach(code => {
          const expiresAt = code.expiresAt ? code.expiresAt.toLocaleDateString('fa-IR') : 'نامحدود';
          const rewardName = code.reward ? code.reward.name : 'نامشخص';
          
          csv += `${code.code},${code.description},${rewardName},${code.reward?.amount || ''},${expiresAt},${code.isUsed ? 'بله' : 'خیر'},${code.maxUses}\n`;
        });
        
        res.header('Content-Type', 'text/csv');
        res.attachment('gift-codes.csv');
        res.send(csv);
      } else {
        // تبدیل به JSON
        res.json(codes);
      }
    } catch (error) {
      req.flash('error', `خطا در استخراج کدهای هدیه: ${error.message}`);
      res.redirect('/admin/events/gift-codes');
    }
  },

  /**
   * نمایش لیست اعلانات
   */
  showAnnouncements: async (req, res) => {
    try {
      const announcements = await Announcement.find().sort({ createdAt: -1 });
      res.render('events/announcements/index', {
        title: 'مدیریت اعلانات',
        announcements
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اعلانات: ${error.message}`);
      res.redirect('/admin/events');
    }
  },

  /**
   * نمایش فرم ایجاد اعلان جدید
   */
  showCreateAnnouncement: async (req, res) => {
    try {
      const servers = await Server.find().sort({ name: 1 });
      
      res.render('events/announcements/create', {
        title: 'ایجاد اعلان جدید',
        servers
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری فرم ایجاد اعلان: ${error.message}`);
      res.redirect('/admin/events/announcements');
    }
  },

  /**
   * ایجاد اعلان جدید
   */
  createAnnouncement: async (req, res) => {
    try {
      const {
        title, content, servers, channels,
        color, image, scheduledFor, isPinned, isImportant
      } = req.body;
      
      await Announcement.create({
        title,
        content,
        servers: servers ? servers.split(',') : [],
        channels: channels ? channels.split(',') : [],
        color: color || '#5865F2',
        image,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isPinned: isPinned === 'on',
        isImportant: isImportant === 'on',
        createdBy: req.session.user._id
      });
      
      req.flash('success', 'اعلان جدید با موفقیت ایجاد شد');
      res.redirect('/admin/events/announcements');
    } catch (error) {
      req.flash('error', `خطا در ایجاد اعلان: ${error.message}`);
      res.redirect('/admin/events/announcements/new');
    }
  },

  /**
   * نمایش جزئیات اعلان
   */
  showAnnouncement: async (req, res) => {
    try {
      const announcement = await Announcement.findById(req.params.id)
        .populate('createdBy');
      
      if (!announcement) {
        req.flash('error', 'اعلان مورد نظر یافت نشد');
        return res.redirect('/admin/events/announcements');
      }
      
      const servers = await Server.find().sort({ name: 1 });
      
      res.render('events/announcements/edit', {
        title: `ویرایش اعلان: ${announcement.title}`,
        announcement,
        servers
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری اطلاعات اعلان: ${error.message}`);
      res.redirect('/admin/events/announcements');
    }
  },

  /**
   * به‌روزرسانی اعلان
   */
  updateAnnouncement: async (req, res) => {
    try {
      const {
        title, content, servers, channels,
        color, image, scheduledFor, isPinned, isImportant
      } = req.body;
      
      await Announcement.findByIdAndUpdate(req.params.id, {
        title,
        content,
        servers: servers ? servers.split(',') : [],
        channels: channels ? channels.split(',') : [],
        color: color || '#5865F2',
        image,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isPinned: isPinned === 'on',
        isImportant: isImportant === 'on'
      });
      
      req.flash('success', 'اعلان با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/events/announcements');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی اعلان: ${error.message}`);
      res.redirect(`/admin/events/announcements/${req.params.id}`);
    }
  },

  /**
   * حذف اعلان
   */
  deleteAnnouncement: async (req, res) => {
    try {
      await Announcement.findByIdAndDelete(req.params.id);
      req.flash('success', 'اعلان با موفقیت حذف شد');
      res.redirect('/admin/events/announcements');
    } catch (error) {
      req.flash('error', `خطا در حذف اعلان: ${error.message}`);
      res.redirect('/admin/events/announcements');
    }
  },

  /**
   * ارسال اعلان به کانال‌های مشخص شده
   */
  sendAnnouncement: async (req, res) => {
    try {
      const announcement = await Announcement.findById(req.params.id);
      
      if (!announcement) {
        req.flash('error', 'اعلان مورد نظر یافت نشد');
        return res.redirect('/admin/events/announcements');
      }
      
      // در اینجا کد ارسال اعلان به دیسکورد اجرا می‌شود
      // به عنوان مثال، یک تابع ارسال اعلان از سرویس دیسکورد فراخوانی می‌شود
      
      // به‌روزرسانی وضعیت اعلان
      await Announcement.findByIdAndUpdate(req.params.id, {
        sentAt: new Date(),
        isSent: true
      });
      
      req.flash('success', 'اعلان با موفقیت ارسال شد');
      res.redirect('/admin/events/announcements');
    } catch (error) {
      req.flash('error', `خطا در ارسال اعلان: ${error.message}`);
      res.redirect('/admin/events/announcements');
    }
  },

  /**
   * نمایش تنظیمات رویدادها
   */
  showSettings: async (req, res) => {
    try {
      // یافتن تنظیمات رویدادها
      const settings = await EventSettings.findOne();
      
      res.render('events/settings', {
        title: 'تنظیمات رویدادها',
        settings: settings || {
          defaultGiveawayDuration: 24,
          autoPublishEvents: true,
          allowCommunityEvents: false,
          enableSeasonalEvents: true,
          announcementPrefix: '📢'
        }
      });
    } catch (error) {
      req.flash('error', `خطا در بارگذاری تنظیمات رویدادها: ${error.message}`);
      res.redirect('/admin/events');
    }
  },

  /**
   * به‌روزرسانی تنظیمات رویدادها
   */
  updateSettings: async (req, res) => {
    try {
      const {
        defaultGiveawayDuration, autoPublishEvents,
        allowCommunityEvents, enableSeasonalEvents,
        announcementPrefix, defaultAnnouncementColor
      } = req.body;
      
      await EventSettings.findOneAndUpdate(
        {},
        {
          defaultGiveawayDuration: parseInt(defaultGiveawayDuration) || 24,
          autoPublishEvents: autoPublishEvents === 'on',
          allowCommunityEvents: allowCommunityEvents === 'on',
          enableSeasonalEvents: enableSeasonalEvents === 'on',
          announcementPrefix: announcementPrefix || '📢',
          defaultAnnouncementColor: defaultAnnouncementColor || '#5865F2'
        },
        { upsert: true }
      );
      
      req.flash('success', 'تنظیمات رویدادها با موفقیت به‌روزرسانی شد');
      res.redirect('/admin/events/settings');
    } catch (error) {
      req.flash('error', `خطا در به‌روزرسانی تنظیمات رویدادها: ${error.message}`);
      res.redirect('/admin/events/settings');
    }
  }
};

/**
 * تولید کد تصادفی برای کدهای هدیه
 * @param {number} length طول کد
 * @returns {string} کد تصادفی
 */
function generateRandomCode(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}