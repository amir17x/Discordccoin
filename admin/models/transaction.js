/**
 * مدل تراکنش‌ها
 * 
 * این مدل برای ثبت و مدیریت تمام تراکنش‌های مالی در سیستم استفاده می‌شود.
 */

import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'admin_add', 'admin_deduct', 'admin_reset',
      'daily', 'weekly', 'streak_bonus',
      'game_win', 'game_lose', 'game_refund',
      'transfer_send', 'transfer_receive',
      'shop_purchase', 'item_use', 'item_sell',
      'bank_deposit', 'bank_withdraw', 'bank_interest',
      'stock_buy', 'stock_sell', 'stock_dividend',
      'mission_reward', 'event_reward', 'referral_bonus',
      'robbery_steal', 'robbery_victim', 'robbery_fine',
      'lottery_ticket', 'lottery_win', 'system'
    ]
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['coin', 'crystal', 'item', 'stock'],
    default: 'coin'
  },
  description: {
    type: String,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Transaction'
  },
  gameId: {
    type: String
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item'
  },
  stockId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Stock'
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin'
  },
  ip: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: true,
  collection: 'transactions'
});

// ایجاد و صادر کردن مدل - از تعریف مجدد جلوگیری می‌کنیم
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);