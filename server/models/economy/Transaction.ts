import mongoose, { Document, Schema } from 'mongoose';

// تعریف انواع تراکنش
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  GAME_WIN = 'game_win',
  GAME_LOSS = 'game_loss',
  ITEM_PURCHASE = 'item_purchase',
  ITEM_SELL = 'item_sell',
  EXCHANGE = 'exchange',
  QUEST_REWARD = 'quest_reward',
  ACHIEVEMENT_REWARD = 'achievement_reward',
  TAX = 'tax',
  LOTTERY_TICKET = 'lottery_ticket',
  LOTTERY_WIN = 'lottery_win',
  AUCTION_BID = 'auction_bid',
  AUCTION_WIN = 'auction_win',
  AUCTION_SELL = 'auction_sell',
  SALARY = 'salary',
  LOAN_TAKE = 'loan_take',
  LOAN_REPAY = 'loan_repay',
  GIFT = 'gift',
  ROBBERY = 'robbery',
  ROBBERY_FAIL = 'robbery_fail',
  ADMIN_ADD = 'admin_add',
  ADMIN_REMOVE = 'admin_remove',
  INTEREST = 'interest',
  FINE = 'fine',
  CLAN_CONTRIBUTION = 'clan_contribution',
  CLAN_WITHDRAWAL = 'clan_withdrawal',
  OTHER = 'other'
}

// تعریف ساختار تراکنش
export interface ITransaction extends Document {
  userId: number;
  type: TransactionType;
  amount: number;
  fee?: number;
  description?: string;
  timestamp: Date;
  gameType?: string;
  targetUserId?: number;
}

// طرح اسکیما برای تراکنش
const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Number, required: true },
    type: { 
      type: String, 
      required: true,
      enum: Object.values(TransactionType)
    },
    amount: { type: Number, required: true },
    fee: { type: Number },
    description: { type: String },
    timestamp: { type: Date, default: Date.now },
    gameType: { type: String },
    targetUserId: { type: Number }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایجاد ایندکس‌های مورد نیاز برای بهبود کارایی
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ timestamp: -1 });
TransactionSchema.index({ targetUserId: 1 });
TransactionSchema.index({ userId: 1, timestamp: -1 });
TransactionSchema.index({ userId: 1, type: 1 });

// ایجاد و صادر کردن مدل
export const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default TransactionModel;