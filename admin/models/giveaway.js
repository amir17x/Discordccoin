/**
 * مدل قرعه‌کشی
 * 
 * این مدل برای مدیریت قرعه‌کشی‌ها و جوایز مربوط به آنها استفاده می‌شود.
 */

import mongoose from 'mongoose';

const giveawaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  serverId: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  messageId: {
    type: String
  },
  prize: {
    type: String,
    required: true
  },
  prizeType: {
    type: String,
    enum: ['coin', 'crystal', 'item', 'role', 'other'],
    default: 'other'
  },
  prizeAmount: {
    type: Number,
    default: 0
  },
  prizeItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  winnerCount: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  winners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  endedAt: {
    type: Date
  },
  rerolledAt: {
    type: Date
  },
  requirements: [{
    type: String
  }],
  image: {
    type: String
  },
  color: {
    type: String,
    default: '#5865F2'
  },
  thumbnail: {
    type: String
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
  collection: 'giveaways'
});

// قبل از به‌روزرسانی، فیلد updatedAt را به‌روز می‌کنیم
giveawaySchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ایجاد و صادر کردن مدل
export const Giveaway = mongoose.model('Giveaway', giveawaySchema);