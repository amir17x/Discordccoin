import mongoose, { Document, Schema } from 'mongoose';

// تعریف ساختار پیشنهاد مزایده
export interface IAuctionBid extends Document {
  bidderId: number;
  amount: number;
  timestamp: Date;
}

// طرح اسکیما برای پیشنهاد مزایده
const AuctionBidSchema = new Schema<IAuctionBid>(
  {
    bidderId: { type: Number, required: true },
    amount: { type: Number, required: true, min: 1 },
    timestamp: { type: Date, default: Date.now }
  },
  {
    _id: false, // بدون آیدی جداگانه برای هر پیشنهاد
    versionKey: false
  }
);

// تعریف ساختار مزایده
export interface IAuction extends Document {
  sellerId: number;
  itemId: number | null;
  itemType: string;
  itemAmount?: number;
  startingBid: number;
  currentBid: number;
  highestBidderId?: number;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'ended' | 'cancelled';
  bids: IAuctionBid[];
}

// طرح اسکیما برای مزایده
const AuctionSchema = new Schema<IAuction>(
  {
    sellerId: { type: Number, required: true },
    itemId: { type: Number, default: null },
    itemType: { type: String, required: true },
    itemAmount: { type: Number, min: 1 },
    startingBid: { type: Number, required: true, min: 1 },
    currentBid: { type: Number, required: true, min: 1 },
    highestBidderId: { type: Number },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ['active', 'ended', 'cancelled'],
      default: 'active'
    },
    bids: [AuctionBidSchema]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایجاد ایندکس‌های مورد نیاز برای بهبود کارایی
AuctionSchema.index({ sellerId: 1 });
AuctionSchema.index({ status: 1 });
AuctionSchema.index({ endTime: 1 });
AuctionSchema.index({ itemType: 1 });
AuctionSchema.index({ currentBid: -1 });
AuctionSchema.index({ highestBidderId: 1 });

// ایجاد و صادر کردن مدل
export const AuctionModel = mongoose.model<IAuction>('Auction', AuctionSchema);

export default AuctionModel;