/**
 * مدل بازی‌های گروهی
 * 
 * این مدل برای ذخیره اطلاعات بازی‌های گروهی مانند مافیا، گرگینه و غیره استفاده می‌شود.
 */

import mongoose from 'mongoose';

const groupGameSchema = new mongoose.Schema({
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
    default: 5
  },
  maxPlayers: {
    type: Number,
    required: true,
    default: 15
  },
  entryFee: {
    type: Number,
    default: 0
  },
  rewardPool: {
    type: Number,
    default: 0
  },
  rules: {
    type: String,
    trim: true
  },
  roles: [{
    name: String,
    description: String,
    isGood: Boolean,
    abilities: [String]
  }],
  gameType: {
    type: String,
    enum: ['mafia', 'werewolf', 'spyfall', 'general'],
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
  collection: 'groupGames'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
groupGameSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const GroupGame = mongoose.model('GroupGame', groupGameSchema);