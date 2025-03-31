import mongoose, { Schema, Document } from 'mongoose';

/**
 * رابط مشخصات دستاورد
 */
export interface IAchievement extends Document {
  id: string;             // شناسه یکتا
  title: string;          // عنوان دستاورد
  description: string;    // توضیحات دستاورد
  emoji: string;          // ایموجی نمایشی
  category: string;       // دسته‌بندی (اقتصادی، اجتماعی، بازی و...)
  requirement: string;    // شرایط دریافت (به صورت کد یا متن)
  reward: {               // پاداش دستاورد
    coins?: number;       // سکه
    crystals?: number;    // کریستال
    xp?: number;          // امتیاز تجربه
    items?: string[];     // آیتم‌های مختلف
  };
  rarityLevel: number;    // سطح کمیابی (1-5)
  image?: string;         // تصویر دستاورد (اختیاری)
  isHidden: boolean;      // آیا دستاورد مخفی است؟
  isLegacy: boolean;      // آیا این دستاورد قدیمی است؟
  createdAt: Date;        // تاریخ ایجاد
  updatedAt: Date;        // تاریخ بروزرسانی
}

/**
 * رابط مشخصات دستاورد کاربر
 */
export interface IUserAchievement extends Document {
  userId: string;         // شناسه کاربر
  achievementId: string;  // شناسه دستاورد
  earnedAt: Date;         // تاریخ دریافت
  progress?: number;      // پیشرفت (برای دستاوردهای مرحله‌ای)
  count?: number;         // تعداد دفعات دریافت (برای دستاوردهای تکرارپذیر)
}

/**
 * طرح دستاورد
 */
const AchievementSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  emoji: { type: String, required: true },
  category: { type: String, required: true },
  requirement: { type: String, required: true },
  reward: {
    coins: { type: Number, default: 0 },
    crystals: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    items: [{ type: String }]
  },
  rarityLevel: { type: Number, required: true, min: 1, max: 5 },
  image: { type: String },
  isHidden: { type: Boolean, default: false },
  isLegacy: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * طرح دستاورد کاربر
 */
const UserAchievementSchema: Schema = new Schema({
  userId: { type: String, required: true },
  achievementId: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
  count: { type: Number, default: 1 }
});

// ایجاد شاخص مرکب برای جلوگیری از دستاوردهای تکراری
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

/**
 * مدل دستاورد
 */
export const AchievementModel = mongoose.model<IAchievement>('Achievement', AchievementSchema);

/**
 * مدل دستاورد کاربر
 */
export const UserAchievementModel = mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);