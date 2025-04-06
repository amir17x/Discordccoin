/**
 * مدل پاداش رویدادها
 * 
 * این مدل برای مدیریت پاداش‌های مختلف رویدادها استفاده می‌شود.
 */

import mongoose from 'mongoose';

const eventRewardSchema = new mongoose.Schema({
  name: {
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
    enum: ['coins', 'crystals', 'item', 'role', 'badge', 'xp', 'multiplier', 'mixed'],
    default: 'coins'
  },
  value: {
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
    multipliers: {
      coin: {
        type: Number,
        default: 1.0
      },
      xp: {
        type: Number,
        default: 1.0
      },
      drop: {
        type: Number,
        default: 1.0
      },
      duration: {
        type: Number, // در ساعت
        default: 1
      }
    }
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
  }],
  roles: [{
    roleId: {
      type: String
    },
    serverId: {
      type: String
    },
    duration: {
      type: Number, // در ساعت، 0 برای دائمی
      default: 0
    }
  }],
  badges: [{
    id: String,
    name: String,
    description: String,
    icon: String
  }],
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'special'],
    default: 'common'
  },
  icon: {
    type: String
  },
  image: {
    type: String
  },
  color: {
    type: String,
    default: '#5865F2'
  },
  animated: {
    type: Boolean,
    default: false
  },
  isLimited: {
    type: Boolean,
    default: false
  },
  maxClaims: {
    type: Number,
    default: -1 // -1 برای نامحدود
  },
  claimedCount: {
    type: Number,
    default: 0
  },
  expiresIn: {
    type: Number, // در ساعت، 0 برای عدم انقضا
    default: 0
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
  collection: 'event_rewards'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
eventRewardSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const EventReward = mongoose.model('EventReward', eventRewardSchema);