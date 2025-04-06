/**
 * مدل ترجمه
 * 
 * این مدل برای مدیریت ترجمه‌های چندزبانه استفاده می‌شود.
 */

import mongoose from 'mongoose';

const translationSchema = new mongoose.Schema({
  locale: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true
  },
  group: {
    type: String,
    enum: ['general', 'commands', 'games', 'events', 'economy', 'admin', 'errors', 'notifications'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, { 
  timestamps: true,
  collection: 'translations'
});

// اضافه کردن ایندکس ترکیبی برای locale و key
translationSchema.index({ locale: 1, key: 1 }, { unique: true });

// قبل از به‌روزرسانی، فیلد lastUpdated را به‌روز می‌کنیم
translationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastUpdated: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Translation = mongoose.model('Translation', translationSchema);