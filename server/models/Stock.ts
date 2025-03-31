import mongoose, { Schema, Document } from 'mongoose';
import { StockData, StockNews, StockPriceHistory } from '../../shared/schema';

export interface StockDocument extends Document {
  id: number;
  symbol: string;
  name: string;
  description: string;
  currentPrice: number;
  previousPrice: number;
  priceHistory: StockPriceHistory[];
  volatility: number;
  trend: number;
  sector: string;
  totalShares: number;
  availableShares: number;
  news: StockNews[];
  updatedAt: Date;
}

const stockSchema = new Schema<StockDocument>({
  id: { type: Number, required: true, unique: true },
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  previousPrice: { type: Number, required: true },
  priceHistory: [{
    timestamp: { type: Date, required: true },
    price: { type: Number, required: true }
  }],
  volatility: { type: Number, required: true }, // میزان نوسان (از 1 تا 10)
  trend: { type: Number, required: true }, // روند قیمت (-5 تا +5)
  sector: { type: String, required: true },
  totalShares: { type: Number, required: true },
  availableShares: { type: Number, required: true },
  news: [{
    content: { type: String, required: true },
    effect: { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
    timestamp: { type: Date, required: true }
  }],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const StockModel = mongoose.model<StockDocument>('Stock', stockSchema);

// مدل برای نگهداری سهام‌های کاربر
export interface UserStockDocument extends Document {
  id: number;
  userId: number;
  stockId: number;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
}

const userStockSchema = new Schema<UserStockDocument>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  stockId: { type: Number, required: true },
  quantity: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now }
});

userStockSchema.index({ userId: 1, stockId: 1 });

export const UserStockModel = mongoose.model<UserStockDocument>('UserStock', userStockSchema);