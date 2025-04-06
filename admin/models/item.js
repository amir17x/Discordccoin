/**
 * مدل آیتم
 * 
 * این مدل برای مدیریت آیتم‌های قابل خرید و فروش در سیستم استفاده می‌شود.
 */

import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
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
    enum: ['consumable', 'collectible', 'role', 'badge', 'boost', 'tool', 'cosmetic', 'other'],
    default: 'other'
  },
  emoji: {
    type: String,
    default: '📦'
  },
  image: {
    type: String
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'special'],
    default: 'common'
  },
  price: {
    coin: {
      type: Number,
      default: 0
    },
    crystal: {
      type: Number,
      default: 0
    }
  },
  tradeable: {
    type: Boolean,
    default: true
  },
  usable: {
    type: Boolean,
    default: false
  },
  useEffect: {
    type: mongoose.Schema.Types.Mixed
  },
  durability: {
    type: Number,
    min: -1, // -1 for infinite
    default: -1
  },
  cooldown: {
    type: Number, // in seconds
    default: 0
  },
  category: {
    type: String,
    enum: ['food', 'weapon', 'armor', 'accessory', 'material', 'potion', 'scroll', 'key', 'gift', 'other'],
    default: 'other'
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  requirement: {
    minLevel: {
      type: Number,
      default: 0
    },
    minReputation: {
      type: Number,
      default: 0
    },
    questId: {
      type: String
    }
  },
  expiresIn: {
    type: Number, // in days, 0 for never
    default: 0
  },
  stackable: {
    type: Boolean,
    default: true
  },
  maxStack: {
    type: Number,
    default: 99
  },
  isActive: {
    type: Boolean,
    default: true
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
  collection: 'items'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
itemSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل - از تعریف مجدد جلوگیری می‌کنیم
export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);