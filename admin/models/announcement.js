/**
 * مدل اعلان
 * 
 * این مدل برای مدیریت اعلانات و پیام‌های اطلاع‌رسانی استفاده می‌شود.
 */

import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'event', 'update', 'maintenance', 'warning', 'other'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  targetType: {
    type: String,
    enum: ['all', 'servers', 'users', 'roles'],
    default: 'all'
  },
  targets: {
    servers: [{
      type: String
    }],
    channels: [{
      serverId: String,
      channelId: String
    }],
    users: [{
      type: String
    }],
    roles: [{
      roleId: String,
      serverId: String
    }]
  },
  image: {
    type: String
  },
  color: {
    type: String,
    default: '#5865F2'
  },
  buttons: [{
    label: String,
    url: String,
    style: {
      type: String,
      enum: ['primary', 'secondary', 'success', 'danger', 'link'],
      default: 'primary'
    }
  }],
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    scheduledTime: {
      type: Date
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'daily'
    },
    recurringInterval: {
      type: Number,
      default: 1
    }
  },
  sentMessages: [{
    serverId: String,
    channelId: String,
    messageId: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'cancelled'],
    default: 'draft'
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  reactions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
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
  collection: 'announcements'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
announcementSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Announcement = mongoose.model('Announcement', announcementSchema);