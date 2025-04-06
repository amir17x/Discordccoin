/**
 * مدل چالش
 * 
 * این مدل برای مدیریت چالش‌های مختلف در سیستم استفاده می‌شود.
 */

import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'special', 'achievement', 'mission', 'quest'],
    default: 'special'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert', 'legendary'],
    default: 'medium'
  },
  requirements: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // این فیلد می‌تواند شامل اطلاعات مختلفی باشد، مثلاً:
    // { action: 'play_games', count: 5, gameType: 'gambling' }
    // { action: 'win_coins', amount: 1000 }
    // { action: 'use_items', itemId: 'some-id', count: 2 }
  },
  rewards: {
    coins: {
      type: Number,
      default: 0
    },
    crystals: {
      type: Number,
      default: 0
    },
    xp: {
      type: Number,
      default: 0
    },
    items: [{
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
      },
      quantity: {
        type: Number,
        default: 1
      }
    }]
  },
  duration: {
    type: Number, // به ساعت
    default: 24
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  maxParticipants: {
    type: Number,
    default: -1 // -1 برای نامحدود
  },
  participants: [{
    userId: {
      type: String,
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    rewardClaimed: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  image: {
    type: String
  },
  icon: {
    type: String
  },
  color: {
    type: String,
    default: '#5865F2'
  },
  serverId: {
    type: String
  },
  channelId: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
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
  seriesId: {
    type: String // برای دسته‌بندی چالش‌های مرتبط به هم
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
  collection: 'challenges'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
challengeSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Challenge = mongoose.model('Challenge', challengeSchema);