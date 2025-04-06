/**
 * مدل تنظیمات بازی‌ها
 * 
 * این مدل برای ذخیره تنظیمات مختلف بازی‌ها استفاده می‌شود.
 */

import mongoose from 'mongoose';

const gameSettingsSchema = new mongoose.Schema({
  game: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  // تنظیمات عمومی
  isEnabled: {
    type: Boolean,
    default: true
  },
  minBet: {
    type: Number,
    default: 10
  },
  maxBet: {
    type: Number,
    default: 1000
  },
  cooldown: {
    type: Number,
    default: 60  // ثانیه
  },
  // تنظیمات خاص بازی‌ها (به صورت اختیاری)
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  updateHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    adminId: String,
    adminName: String,
    changes: mongoose.Schema.Types.Mixed
  }],
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
  collection: 'gameSettings'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
gameSettingsSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const GameSettings = mongoose.model('GameSettings', gameSettingsSchema);