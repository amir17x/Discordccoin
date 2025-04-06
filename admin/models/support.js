/**
 * مدل پشتیبانی
 * 
 * این مدل برای مدیریت تیکت‌های پشتیبانی استفاده می‌شود.
 */

import mongoose from 'mongoose';

const supportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'bug', 'feature', 'billing', 'technical', 'account', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'],
    default: 'open'
  },
  userId: {
    type: String
  },
  userName: {
    type: String
  },
  userEmail: {
    type: String,
    required: true
  },
  serverId: {
    type: String
  },
  serverName: {
    type: String
  },
  replies: [{
    message: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      enum: ['user', 'admin', 'system'],
      default: 'user'
    },
    senderId: {
      type: String
    },
    senderName: {
      type: String
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastReplyAt: {
    type: Date
  },
  lastReplyBy: {
    type: String,
    enum: ['user', 'admin', 'system']
  },
  closedAt: {
    type: Date
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  reopenedAt: {
    type: Date
  },
  reopenedBy: {
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
  collection: 'support_tickets'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
supportSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Support = mongoose.model('Support', supportSchema);