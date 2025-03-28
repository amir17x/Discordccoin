import mongoose, { Schema, Document } from 'mongoose';

/**
 * رابط کوئست برای استفاده در تایپ‌اسکریپت
 */
export interface IQuest extends Document {
  title: string;
  description: string;
  requirement: string;
  targetAmount: number;
  reward: number;
  type: string; // daily, weekly, monthly, special
  category: string; // economy, social, gameplay
  minLevel: number;
  active: boolean;
  expiresAt?: Date;
  image?: string;
  rewardType: string; // coins, items, crystals
  completions: {
    userId: string;
    completedAt: Date;
    rewardClaimed: boolean;
  }[];
}

/**
 * طرح داده‌ای کوئست در MongoDB
 */
const QuestSchema: Schema = new Schema({
  // اطلاعات پایه کوئست
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirement: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  reward: { type: Number, required: true },
  
  // نوع و دسته‌بندی
  type: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'special', 'achievement'],
    default: 'daily'
  },
  category: { 
    type: String, 
    enum: ['economy', 'social', 'gameplay', 'skills', 'exploration'],
    default: 'economy'
  },
  
  // محدودیت‌ها
  minLevel: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  
  // ظاهر و جایزه
  image: { type: String, default: null },
  rewardType: { 
    type: String, 
    enum: ['coins', 'items', 'crystals', 'xp', 'mixed'],
    default: 'coins'
  },
  
  // سوابق تکمیل
  completions: [{
    userId: String,
    completedAt: { type: Date, default: Date.now },
    rewardClaimed: { type: Boolean, default: true }
  }],
  
  // فیلدهای سیستمی
  createdAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  versionKey: false
});

const Quest = mongoose.model<IQuest>('Quest', QuestSchema);
export default Quest;