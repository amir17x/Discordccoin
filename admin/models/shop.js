/**
 * مدل فروشگاه
 * 
 * این مدل برای مدیریت فروشگاه‌های مختلف در سیستم استفاده می‌شود.
 */

import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
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
    enum: ['general', 'premium', 'seasonal', 'special', 'limited', 'event'],
    default: 'general'
  },
  icon: {
    type: String,
    default: '🏪'
  },
  currency: {
    type: String,
    enum: ['coin', 'crystal', 'mixed'],
    default: 'coin'
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
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
    discount: {
      percent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      endDate: {
        type: Date
      }
    },
    stock: {
      type: Number,
      min: -1, // -1 for unlimited
      default: -1
    },
    featured: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  }],
  requirements: {
    minLevel: {
      type: Number,
      default: 0
    },
    minReputation: {
      type: Number,
      default: 0
    },
    roleIds: [{
      type: String
    }]
  },
  schedule: {
    open: {
      type: Boolean,
      default: true
    },
    openTime: {
      type: String,
      default: '00:00'
    },
    closeTime: {
      type: String,
      default: '23:59'
    },
    weekDays: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6] // 0 = یکشنبه
    }
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
  collection: 'shops'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
shopSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Shop = mongoose.model('Shop', shopSchema);