/**
 * مدل جوایز بازی
 * 
 * این مدل برای ذخیره اطلاعات جوایز مختلف بازی‌ها استفاده می‌شود.
 */

import mongoose from 'mongoose';

const gameRewardSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  gameId: {
    type: String,
    required: true,
    index: true
  },
  gameName: {
    type: String,
    required: true
  },
  rewardType: {
    type: String,
    enum: ['coins', 'item', 'badge', 'role', 'mixed'],
    default: 'coins'
  },
  coinsAmount: {
    type: Number,
    default: 0
  },
  itemId: {
    type: String
  },
  badgeId: {
    type: String
  },
  roleId: {
    type: String
  },
  requirements: {
    wins: Number,
    score: Number,
    achievements: [String],
    customRequirement: String
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
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
  collection: 'gameRewards'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
gameRewardSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const GameReward = mongoose.model('GameReward', gameRewardSchema);