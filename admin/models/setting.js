/**
 * مدل تنظیمات
 * 
 * این مدل برای مدیریت تنظیمات سیستم استفاده می‌شود.
 * هر تنظیم شامل یک کلید و یک مقدار است.
 */

import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'discord', 'bot', 'database', 'security', 'notification', 'localization', 'maintenance'],
    default: 'general'
  },
  isSystemSetting: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'json', 'array'],
    default: 'string'
  },
  options: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, { 
  timestamps: true,
  collection: 'settings'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
settingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// روش برای تبدیل مقدار به فرمت صحیح بر اساس نوع داده
settingSchema.methods.getValueAsType = function() {
  switch (this.dataType) {
    case 'number':
      return Number(this.value);
    case 'boolean':
      return this.value === 'true';
    case 'date':
      return new Date(this.value);
    case 'json':
      try {
        return JSON.parse(this.value);
      } catch (e) {
        return {};
      }
    case 'array':
      try {
        return this.value.split(',').map(item => item.trim());
      } catch (e) {
        return [];
      }
    default:
      return this.value;
  }
};

// ایجاد و صادر کردن مدل
export const Setting = mongoose.model('Setting', settingSchema);