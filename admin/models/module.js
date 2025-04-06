/**
 * مدل ماژول
 * 
 * این مدل برای مدیریت ماژول‌های مختلف سیستم استفاده می‌شود.
 */

import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['core', 'economy', 'game', 'event', 'utility', 'social', 'integration', 'other'],
    default: 'other'
  },
  version: {
    type: String,
    trim: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dependencies: [{
    type: String // نام ماژول‌های دیگر که این ماژول به آن‌ها وابسته است
  }],
  permissions: [{
    type: String // دسترسی‌های مربوط به این ماژول
  }],
  routes: [{
    path: String,
    method: String,
    handler: String,
    middleware: [String]
  }],
  isCore: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isInstalled: {
    type: Boolean,
    default: true
  },
  installDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date
  },
  icon: {
    type: String
  },
  author: {
    name: String,
    email: String,
    website: String
  },
  createdBy: {
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
  collection: 'modules'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
moduleSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Module = mongoose.model('Module', moduleSchema);