/**
 * مدل آمار بازی‌ها
 * 
 * این مدل برای ذخیره آمار و اطلاعات بازی‌های انجام شده استفاده می‌شود.
 */

import mongoose from 'mongoose';

const gameStatsSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    index: true
  },
  gameName: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    enum: ['gambling', 'card', 'group', 'slot', 'other'],
    default: 'other'
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  uniquePlayers: {
    type: Number,
    default: 0
  },
  coinsWagered: {
    type: Number,
    default: 0
  },
  coinsWon: {
    type: Number,
    default: 0
  },
  coinsLost: {
    type: Number,
    default: 0
  },
  winRate: {
    type: Number,
    default: 0
  },
  playerStats: [{
    userId: String,
    username: String,
    gamesPlayed: Number,
    coinsWon: Number,
    coinsLost: Number,
    lastPlayed: Date
  }],
  dailyStats: [{
    date: Date,
    gamesPlayed: Number,
    coinsWagered: Number,
    coinsWon: Number,
    coinsLost: Number,
    uniquePlayers: Number
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'gameStats'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
gameStatsSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const GameStats = mongoose.model('GameStats', gameStatsSchema);