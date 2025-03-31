import mongoose, { Schema, Document } from 'mongoose';

/**
 * رابط تراکنش برای استفاده در تایپ‌اسکریپت
 */
export interface ITransaction extends Document {
  userId: string;
  amount: number;
  type: string;
  description: string;
  senderName?: string;
  receiverName?: string;
  receiverId?: string;
  itemId?: string;
  itemName?: string;
  itemQuantity?: number;
  balance: number;
  timestamp: Date;
  guildId?: string;
  channelId?: string;
  isSuccess: boolean;
  currency: string; // 'coins', 'crystals', 'items'
  metadata?: Record<string, any>;
}

/**
 * طرح داده‌ای تراکنش در MongoDB
 */
const TransactionSchema: Schema = new Schema({
  // اطلاعات کاربر
  userId: { type: String, required: true, index: true },
  
  // اطلاعات مالی
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: [
      // بانک و انتقال
      'deposit', 'withdraw', 'bank_interest', 
      'transfer', 'transfer_sent', 'transfer_received',
      
      // دریافت‌های روزانه و کارها
      'daily', 'weekly', 'monthly', 'work', 'job_income',
      
      // اقتصاد و کسب و کار
      'quest_reward', 'shop_purchase', 'shop_sale', 'market_sale', 'market_purchase',
      'investment', 'investment_return', 'stock_buy', 'stock_sell', 'stock_dividend',
      
      // سرگرمی و قمار
      'casino_win', 'casino_loss', 'lottery_ticket', 'lottery_win', 'wheel_spin',
      'game_bet', 'game_win', 'game_reward',
      
      // رویدادهای دزدی
      'rob', 'steal_success', 'steal_failed', 'robbed',
      
      // کلن و اجتماعی
      'clan_contribution', 'clan_withdrawal', 'clan_reward',
      'gift', 'friend_bonus',
      
      // مدیریتی و سیستمی
      'admin_adjustment', 'tax', 'penalty', 'refund', 'loan', 'loan_repayment',
      'system', 'other'
    ],
    required: true 
  },
  description: { type: String, required: true },
  
  // اطلاعات طرف معامله (اختیاری)
  senderName: { type: String, default: null },
  receiverName: { type: String, default: null },
  receiverId: { type: String, default: null },
  
  // اطلاعات آیتم (اختیاری)
  itemId: { type: String, default: null },
  itemName: { type: String, default: null },
  itemQuantity: { type: Number, default: null },
  
  // اطلاعات مالی تکمیلی
  balance: { type: Number, required: true }, // موجودی بعد از تراکنش
  
  // زمان و مکان
  timestamp: { type: Date, default: Date.now, index: true },
  guildId: { type: String, default: null },
  channelId: { type: String, default: null },
  
  // وضعیت
  isSuccess: { type: Boolean, default: true },
  
  // نوع ارز
  currency: { 
    type: String, 
    enum: ['coins', 'crystals', 'items'],
    default: 'coins'
  },
  
  // اطلاعات اضافی
  metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
}, { 
  timestamps: true,
  versionKey: false
});

// ایجاد فهرست‌های ترکیبی (index) برای افزایش کارایی جستجو
TransactionSchema.index({ userId: 1, timestamp: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ guildId: 1 });

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;