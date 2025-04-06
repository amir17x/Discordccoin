/**
 * مدل بازی‌های کارتی
 * 
 * این مدل برای ذخیره اطلاعات بازی‌های کارتی مانند بلک‌جک، پوکر و غیره استفاده می‌شود.
 */

import mongoose from 'mongoose';

const cardGameSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  minPlayers: {
    type: Number,
    required: true,
    default: 1
  },
  maxPlayers: {
    type: Number,
    required: true,
    default: 4
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
    default: 2,  // درصد
    min: 0,
    max: 100
  },
  rules: {
    type: String,
    trim: true
  },
  gameType: {
    type: String,
    enum: ['blackjack', 'poker', 'hokm', 'general'],
    default: 'general'
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
  collection: 'cardGames'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
cardGameSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const CardGame = mongoose.model('CardGame', cardGameSchema);