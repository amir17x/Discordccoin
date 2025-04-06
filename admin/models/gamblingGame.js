/**
 * مدل بازی‌های قمار
 * 
 * این مدل برای ذخیره اطلاعات بازی‌های قمار مانند شرط‌بندی، رولت و غیره استفاده می‌شود.
 */

import mongoose from 'mongoose';

const gamblingGameSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  minBet: {
    type: Number,
    required: true,
    default: 10
  },
  maxBet: {
    type: Number,
    required: true,
    default: 1000
  },
  houseEdge: {
    type: Number,
    required: true,
    default: 5,  // درصد
    min: 0,
    max: 100
  },
  winRate: {
    type: Number,
    required: true,
    default: 45,  // درصد
    min: 0,
    max: 100
  },
  minWinMultiplier: {
    type: Number,
    required: true,
    default: 1.1
  },
  maxWinMultiplier: {
    type: Number,
    required: true,
    default: 2.0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  gameType: {
    type: String,
    enum: ['dice', 'roulette', 'coin_flip', 'general'],
    default: 'general'
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
  collection: 'gamblingGames'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
gamblingGameSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const GamblingGame = mongoose.model('GamblingGame', gamblingGameSchema);