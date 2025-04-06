/**
 * مدل نمادهای اسلات
 * 
 * این مدل برای ذخیره اطلاعات نمادهای مختلف بازی اسلات استفاده می‌شود.
 */

import mongoose from 'mongoose';

const slotSymbolSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  emoji: {
    type: String,
    required: true
  },
  rarity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 10
  },
  value: {
    type: Number,
    required: true,
    default: 1
  },
  multiplier: {
    type: Number,
    required: true,
    default: 1
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  specialEffect: {
    type: String,
    enum: ['none', 'wildcard', 'bonus', 'jackpot', 'double', 'free_spin'],
    default: 'none'
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
  collection: 'slotSymbols'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
slotSymbolSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const SlotSymbol = mongoose.model('SlotSymbol', slotSymbolSchema);