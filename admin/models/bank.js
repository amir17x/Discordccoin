/**
 * مدل بانک
 * 
 * این مدل برای مدیریت بانک‌ها و سیستم بانکی استفاده می‌شود.
 */

import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 3
  },
  interestInterval: {
    type: Number,
    default: 24 * 60 * 60 * 1000, // روزانه به میلی‌ثانیه
    min: 1 * 60 * 60 * 1000 // حداقل یک ساعت
  },
  minDeposit: {
    type: Number,
    default: 100,
    min: 0
  },
  maxDeposit: {
    type: Number,
    default: 1000000,
    min: 0
  },
  transactionFee: {
    deposit: {
      type: Number,
      default: 0,
      min: 0
    },
    withdraw: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    default: '🏦'
  },
  tier: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  requirements: {
    minLevel: {
      type: Number,
      default: 0
    },
    minReputation: {
      type: Number,
      default: 0
    }
  },
  accounts: {
    type: Number,
    default: 0
  },
  totalDeposits: {
    type: Number,
    default: 0
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
  collection: 'banks'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
bankSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Bank = mongoose.model('Bank', bankSchema);