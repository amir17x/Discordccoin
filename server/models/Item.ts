import mongoose, { Schema, Document } from 'mongoose';

/**
 * رابط آیتم برای استفاده در تایپ‌اسکریپت
 */
export interface IItem extends Document {
  id: number;
  name: string;
  type: string;
  description: string;
  price: number;
  crystalPrice: number | null;
  emoji: string;
  duration: number | null;
  rarity: string;
  effects: any; // می‌توان بعداً به یک نوع دقیق‌تر تبدیل کرد
  category: string;
}

/**
 * طرح داده‌ای آیتم در MongoDB
 */
const ItemSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  crystalPrice: { type: Number, default: null },
  emoji: { type: String, required: true },
  duration: { type: Number, default: null },
  rarity: { type: String, required: true },
  effects: { type: Schema.Types.Mixed, default: {} },
  category: { type: String, required: true }
}, { 
  timestamps: true,
  versionKey: false
});

export default mongoose.model<IItem>('Item', ItemSchema);