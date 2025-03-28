import mongoose, { Schema, Document } from 'mongoose';

/**
 * رابط تنظیمات کانال نکات برای استفاده در تایپ‌اسکریپت
 */
export interface ITipChannelSettings extends Document {
  guildId: string;
  channelId: string;
  interval: number; // فاصله زمانی ارسال نکات به ساعت
  isActive: boolean;
  lastTipTime: number | null; // زمان آخرین ارسال نکته (timestamp)
  customTips?: string[]; // نکات سفارشی اختیاری
}

/**
 * طرح داده‌ای تنظیمات کانال نکات در MongoDB
 */
const TipChannelSettingsSchema: Schema = new Schema({
  // اطلاعات پایه
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  interval: { type: Number, required: true, min: 1, max: 24 },
  isActive: { type: Boolean, default: true },
  lastTipTime: { type: Number, default: null },
  
  // نکات سفارشی (اختیاری)
  customTips: { type: [String], default: [] },
  
  // فیلدهای سیستمی
  createdAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  versionKey: false
});

// ایجاد فهرست ترکیبی (index) برای افزایش کارایی جستجو
TipChannelSettingsSchema.index({ guildId: 1 });
TipChannelSettingsSchema.index({ isActive: 1 });

const TipChannelSettings = mongoose.model<ITipChannelSettings>('TipChannelSettings', TipChannelSettingsSchema);
export default TipChannelSettings;