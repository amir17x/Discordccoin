import mongoose, { Document, Schema } from 'mongoose';

// تعریف ساختار شرکت‌کننده در قرعه‌کشی
export interface ILotteryParticipant extends Document {
  userId: number;
  tickets: number;
  joinedAt: Date;
}

// طرح اسکیما برای شرکت‌کننده در قرعه‌کشی
const LotteryParticipantSchema = new Schema<ILotteryParticipant>(
  {
    userId: { type: Number, required: true },
    tickets: { type: Number, required: true, min: 1, default: 1 },
    joinedAt: { type: Date, default: Date.now }
  },
  {
    _id: false, // بدون آیدی جداگانه برای هر شرکت‌کننده
    versionKey: false
  }
);

// تعریف ساختار قرعه‌کشی
export interface ILottery extends Document {
  name: string;
  ticketPrice: number;
  jackpot: number;
  startTime: Date;
  endTime: Date;
  winner?: number;
  participants: ILotteryParticipant[];
  status: 'active' | 'ended';
}

// طرح اسکیما برای قرعه‌کشی
const LotterySchema = new Schema<ILottery>(
  {
    name: { type: String, required: true },
    ticketPrice: { type: Number, required: true, min: 1 },
    jackpot: { type: Number, required: true, default: 0, min: 0 },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, required: true },
    winner: { type: Number },
    participants: [LotteryParticipantSchema],
    status: {
      type: String,
      required: true,
      enum: ['active', 'ended'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایجاد ایندکس‌های مورد نیاز برای بهبود کارایی
LotterySchema.index({ status: 1 });
LotterySchema.index({ endTime: 1 });
LotterySchema.index({ startTime: 1 });
LotterySchema.index({ 'participants.userId': 1 });

// ایجاد و صادر کردن مدل
export const LotteryModel = mongoose.model<ILottery>('Lottery', LotterySchema);

export default LotteryModel;