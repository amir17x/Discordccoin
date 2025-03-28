import mongoose, { Schema, Document } from 'mongoose';

/**
 * رابط ماموریت برای استفاده در تایپ‌اسکریپت
 */
export interface IQuest extends Document {
  id: number;
  title: string;
  description: string;
  type: string;
  requirement: string;
  targetAmount: number;
  reward: number;
  category: string;
  active: boolean;
  minLevel: number;
}

/**
 * طرح داده‌ای ماموریت در MongoDB
 */
const QuestSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  requirement: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  reward: { type: Number, required: true },
  category: { type: String, required: true },
  active: { type: Boolean, default: true },
  minLevel: { type: Number, default: 1 }
}, { 
  timestamps: true,
  versionKey: false
});

export default mongoose.model<IQuest>('Quest', QuestSchema);