/**
 * مدل لاگ
 * 
 * این مدل برای ذخیره و مدیریت لاگ‌های سیستم استفاده می‌شود.
 */

import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'debug', 'critical'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['system', 'discord', 'game', 'economy', 'event', 'user', 'admin', 'security', 'api', 'db', 'other'],
    default: 'system'
  },
  source: {
    type: String,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  serverId: {
    type: String
  },
  userId: {
    type: String
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'logs'
});

// ایجاد ایندکس‌ها برای بهبود جستجو
logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ category: 1, timestamp: -1 });
logSchema.index({ serverId: 1, timestamp: -1 });
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ timestamp: -1 });

// متد استاتیک برای لاگ کردن سریع
logSchema.statics.logMessage = async function(level, message, category = 'system', details = {}) {
  try {
    return await this.create({
      level,
      message,
      category,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error creating log entry:', error);
    // برای جلوگیری از شکست برنامه در صورت خطا در سیستم لاگ
    return null;
  }
};

// متدهای آسان برای لاگ سطوح مختلف
logSchema.statics.info = function(message, category = 'system', details = {}) {
  return this.logMessage('info', message, category, details);
};

logSchema.statics.warning = function(message, category = 'system', details = {}) {
  return this.logMessage('warning', message, category, details);
};

logSchema.statics.error = function(message, category = 'system', details = {}) {
  return this.logMessage('error', message, category, details);
};

logSchema.statics.debug = function(message, category = 'system', details = {}) {
  return this.logMessage('debug', message, category, details);
};

logSchema.statics.critical = function(message, category = 'system', details = {}) {
  return this.logMessage('critical', message, category, details);
};

// ایجاد و صادر کردن مدل - از تعریف مجدد جلوگیری می‌کنیم
export const Log = mongoose.models.Log || mongoose.model('Log', logSchema);