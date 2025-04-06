/**
 * مدل کد هدیه
 * 
 * این مدل برای مدیریت کدهای هدیه و پاداش‌های آنها استفاده می‌شود.
 */

import mongoose from 'mongoose';

const giftCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['public', 'private', 'limited', 'event', 'promotion'],
    default: 'public'
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
  maxUses: {
    type: Number,
    default: 1 // 0 برای نامحدود
  },
  usesCount: {
    type: Number,
    default: 0
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  serversLimit: [{
    type: String
  }],
  usersLimit: [{
    type: String
  }],
  rolesLimit: [{
    roleId: String,
    serverId: String
  }],
  usedBy: [{
    userId: {
      type: String
    },
    username: {
      type: String
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  batchId: {
    type: String // برای دسته‌بندی کدهای تولید شده به صورت گروهی
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
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
  collection: 'gift_codes'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
giftCodeSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const GiftCode = mongoose.model('GiftCode', giftCodeSchema);