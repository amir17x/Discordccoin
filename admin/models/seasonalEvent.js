/**
 * مدل رویداد فصلی
 * 
 * این مدل برای مدیریت رویدادهای فصلی در سیستم استفاده می‌شود.
 */

import mongoose from 'mongoose';

const seasonalEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  season: {
    type: String,
    enum: ['spring', 'summer', 'fall', 'winter', 'custom'],
    default: 'custom'
  },
  theme: {
    type: String,
    trim: true
  },
  serverId: {
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
  activities: [{
    title: String,
    description: String,
    requirements: [String],
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventReward'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  specialItems: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  participants: [{
    userId: {
      type: String,
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    completedActivities: [{
      activityId: String,
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    joinedAt: {
      type: Date,
      default: Date.now
    }
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
  image: {
    type: String
  },
  color: {
    type: String,
    default: '#5865F2'
  },
  isActive: {
    type: Boolean,
    default: true
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
  collection: 'seasonal_events'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
seasonalEventSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const SeasonalEvent = mongoose.model('SeasonalEvent', seasonalEventSchema);