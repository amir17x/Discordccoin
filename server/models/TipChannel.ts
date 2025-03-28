import mongoose, { Schema, Document } from 'mongoose';

/**
 * رابط کانال نکات برای استفاده در تایپ‌اسکریپت
 */
export interface ITipChannel extends Document {
  guildId: string;
  channelId: string;
  interval: number;
  lastTipTime: Date | null;
  isActive: boolean;
}

/**
 * طرح داده‌ای کانال نکات در MongoDB
 */
const TipChannelSchema: Schema = new Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  interval: { type: Number, default: 3600000 }, // پیش‌فرض هر یک ساعت
  lastTipTime: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true,
  versionKey: false
});

export default mongoose.model<ITipChannel>('TipChannel', TipChannelSchema);