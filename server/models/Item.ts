/**
 * مدل آیتم
 * این فایل مدل مونگوی آیتم را تعریف می‌کند
 */

import mongoose, { Schema, Document } from 'mongoose';

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
  effects: any;
  category: string;
}

const itemSchema = new Schema<IItem>({
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
});

// اطمینان حاصل کنیم که مدل از قبل وجود ندارد
const ItemModel = mongoose.models.Item || mongoose.model<IItem>('Item', itemSchema);

export default ItemModel;