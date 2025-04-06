/**
 * مدل رویداد زمانی
 * 
 * این مدل برای مدیریت رویدادهای زمانی استفاده می‌شود.
 */

import mongoose from 'mongoose';

const timeEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  serverId: {
    type: String,
    required: true
  },
  channelId: {
    type: String
  },
  announcementMessageId: {
    type: String
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  rewards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventReward'
  }],
  multipliers: {
    coins: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 10.0
    },
    xp: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 10.0
    },
    drops: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 10.0
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom', 'none'],
    default: 'none'
  },
  recurringInterval: {
    type: Number,
    default: 0 // در صورت استفاده از custom، بر حسب ساعت
  },
  image: {
    type: String
  },
  color: {
    type: String,
    default: '#5865F2'
  },
  participants: [{
    userId: {
      type: String
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastRun: {
    type: Date
  },
  nextRun: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'time_events'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
timeEventSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const TimeEvent = mongoose.model('TimeEvent', timeEventSchema);