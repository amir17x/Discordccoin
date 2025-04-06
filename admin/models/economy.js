/**
 * مدل اقتصاد
 * 
 * این مدل برای ذخیره اطلاعات مالی کاربران شامل سکه‌ها، کریستال‌ها،
 * سهام‌ها و سایر دارایی‌های آنها استفاده می‌شود.
 */

import mongoose from 'mongoose';

const economySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  coins: {
    type: Number,
    default: 0,
    min: 0
  },
  crystals: {
    type: Number,
    default: 0,
    min: 0
  },
  bank: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    lastInterestDate: {
      type: Date
    },
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bank'
    }
  },
  stocks: [{
    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stock'
    },
    symbol: String,
    purchasePrice: Number,
    quantity: Number,
    purchaseDate: {
      type: Date,
      default: Date.now
    }
  }],
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    quantity: {
      type: Number,
      default: 1
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    }
  }],
  lastDaily: {
    type: Date
  },
  lastWeekly: {
    type: Date
  },
  streak: {
    count: {
      type: Number,
      default: 0
    },
    lastClaimed: {
      type: Date
    }
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
  collection: 'economy'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
economySchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Economy = mongoose.model('Economy', economySchema);