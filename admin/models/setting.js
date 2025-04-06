/**
 * مدل تنظیمات
 * 
 * این مدل برای مدیریت تنظیمات سیستم استفاده می‌شود.
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
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['economy', 'game', 'system', 'social', 'security', 'other'],
    default: 'system'
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
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
  collection: 'settings'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
settingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// متد استاتیک برای دریافت یک تنظیم با کلید مشخص
settingSchema.statics.getByKey = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// متد استاتیک برای ذخیره یا به‌روزرسانی یک تنظیم
settingSchema.statics.setByKey = async function(key, value, options = {}) {
  const { category = 'system', description = '', isPublic = false, updatedBy = null } = options;
  
  return await this.findOneAndUpdate(
    { key },
    {
      $set: { 
        value, 
        category, 
        description, 
        isPublic, 
        updatedBy,
        updatedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );
};

// متد استاتیک برای دریافت تمام تنظیمات یک دسته خاص
settingSchema.statics.getByCategory = async function(category, publicOnly = false) {
  const filter = { category };
  if (publicOnly) {
    filter.isPublic = true;
  }
  
  return await this.find(filter).sort({ key: 1 });
};

// ایجاد و صادر کردن مدل - از تعریف مجدد جلوگیری می‌کنیم
export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);