/**
 * مدل تنظیمات رویدادها
 * 
 * این مدل برای ذخیره تنظیمات کلی سیستم رویدادها استفاده می‌شود.
 */

import mongoose from 'mongoose';

const eventSettingsSchema = new mongoose.Schema({
  giveaway: {
    defaultDuration: {
      type: Number, // به ساعت
      default: 24
    },
    defaultWinnerCount: {
      type: Number,
      default: 1
    },
    buttonColor: {
      type: String,
      default: '#5865F2'
    },
    emoji: {
      type: String,
      default: '🎉'
    },
    messageTemplate: {
      type: String
    },
    autoAnnounceWinners: {
      type: Boolean,
      default: true
    }
  },
  timeEvents: {
    defaultMultiplier: {
      type: Number,
      default: 1.5
    },
    notifyBefore: {
      type: Number, // به دقیقه
      default: 15
    },
    reminderInterval: {
      type: Number, // به دقیقه
      default: 60
    }
  },
  challenges: {
    dailyRefreshTime: {
      type: String, // زمان به صورت "HH:MM"
      default: '00:00'
    },
    weeklyRefreshDay: {
      type: Number, // 0 = یکشنبه، 6 = شنبه
      default: 0
    },
    maxDailyTasks: {
      type: Number,
      default: 3
    },
    maxWeeklyTasks: {
      type: Number,
      default: 7
    }
  },
  notifications: {
    defaultChannel: {
      type: String
    },
    announceNewEvents: {
      type: Boolean,
      default: true
    },
    announceBefore: {
      type: Number, // به دقیقه
      default: 30
    },
    mentionEveryone: {
      type: Boolean,
      default: false
    },
    mentionRoles: [{
      type: String
    }]
  },
  rewards: {
    defaultCoinReward: {
      type: Number,
      default: 100
    },
    defaultXpReward: {
      type: Number,
      default: 50
    },
    maxItemsPerReward: {
      type: Number,
      default: 3
    }
  },
  seasons: {
    currentSeason: {
      type: Number,
      default: 1
    },
    seasonStartDate: {
      type: Date,
      default: Date.now
    },
    seasonEndDate: {
      type: Date
    },
    seasonTheme: {
      type: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { 
  timestamps: true,
  collection: 'event_settings'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
eventSettingsSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const EventSettings = mongoose.model('EventSettings', eventSettingsSchema);