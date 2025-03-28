/**
 * مدل استیکرهای دستاورد
 * این فایل مدل مونگوی استیکرهای دستاورد را تعریف می‌کند
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * شناسه‌های رتبه‌بندی کمیابی
 */
export enum RarityLevel {
  COMMON = 'common',       // معمولی
  UNCOMMON = 'uncommon',   // غیرمعمولی
  RARE = 'rare',           // کمیاب
  EPIC = 'epic',           // حماسی
  LEGENDARY = 'legendary', // افسانه‌ای
  MYTHIC = 'mythic',       // اسطوره‌ای
  EVENT = 'event'          // رویداد ویژه
}

/**
 * دسته‌بندی‌های استیکر
 */
export enum StickerCategory {
  ECONOMY = 'economy',     // اقتصادی
  SOCIAL = 'social',       // اجتماعی
  GAMES = 'games',         // بازی‌ها
  ACHIEVEMENTS = 'achievements', // دستاوردها
  EVENTS = 'events',       // رویدادها
  SPECIAL = 'special'      // ویژه
}

/**
 * رابط استیکر برای استفاده در تایپ‌اسکریپت
 */
export interface ISticker extends Document {
  id: number;                       // شناسه یکتا
  name: string;                     // نام استیکر
  description: string;              // توضیحات استیکر
  imageUrl: string;                 // آدرس تصویر استیکر
  animatedUrl?: string;             // آدرس تصویر متحرک (اختیاری)
  rarity: RarityLevel;              // سطح کمیابی
  category: StickerCategory;        // دسته‌بندی
  unlockRequirement: string;        // شرط باز شدن
  unlockRequirementType: string;    // نوع شرط (دستاورد، پایان رویداد، خرید و غیره)
  unlockRequirementValue: number;   // مقدار شرط (تعداد یا شناسه مورد نیاز)
  isShareable: boolean;             // قابلیت اشتراک‌گذاری
  createdAt: Date;                  // تاریخ ایجاد
  isActive: boolean;                // فعال بودن
  specialEffects?: any;             // افکت‌های ویژه (اختیاری)
  limitedEdition: boolean;          // آیا محدود است؟
  totalSupply: number;              // تعداد کل (برای استیکرهای محدود)
  currentSupply: number;            // تعداد فعلی در دسترس
}

/**
 * طرح داده‌ای استیکر در MongoDB
 */
const StickerSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  animatedUrl: { type: String, default: null },
  rarity: { 
    type: String, 
    enum: Object.values(RarityLevel),
    required: true,
    default: RarityLevel.COMMON
  },
  category: { 
    type: String, 
    enum: Object.values(StickerCategory),
    required: true,
    default: StickerCategory.ACHIEVEMENTS
  },
  unlockRequirement: { type: String, required: true },
  unlockRequirementType: { type: String, required: true },
  unlockRequirementValue: { type: Number, required: true },
  isShareable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  specialEffects: { type: Object, default: null },
  limitedEdition: { type: Boolean, default: false },
  totalSupply: { type: Number, default: 0 },  // 0 یعنی نامحدود
  currentSupply: { type: Number, default: 0 }
}, { 
  timestamps: true,
  versionKey: false
});

// ایندکس‌ها برای بهبود کارایی پرس‌و‌جوها
StickerSchema.index({ id: 1 }, { unique: true });
StickerSchema.index({ rarity: 1 });
StickerSchema.index({ category: 1 });
StickerSchema.index({ isActive: 1 });
StickerSchema.index({ limitedEdition: 1 });

/**
 * متد استاتیک برای بررسی محدودیت تعداد استیکر
 */
StickerSchema.statics.isAvailable = async function(stickerId: number): Promise<boolean> {
  const sticker = await this.findOne({ id: stickerId });
  if (!sticker) return false;
  
  if (!sticker.limitedEdition) return true;
  return sticker.currentSupply < sticker.totalSupply;
};

/**
 * متد استاتیک برای کاهش تعداد استیکرهای محدود
 */
StickerSchema.statics.decreaseSupply = async function(stickerId: number): Promise<boolean> {
  const sticker = await this.findOne({ id: stickerId });
  if (!sticker) return false;
  
  if (!sticker.limitedEdition) return true;
  if (sticker.currentSupply >= sticker.totalSupply) return false;
  
  await this.updateOne({ id: stickerId }, { $inc: { currentSupply: 1 } });
  return true;
};

/**
 * متد استاتیک برای دریافت استیکرهای یک دسته‌بندی
 */
StickerSchema.statics.getByCategoryAndRarity = async function(
  category: StickerCategory,
  rarity?: RarityLevel
): Promise<ISticker[]> {
  const query: any = { category, isActive: true };
  if (rarity) query.rarity = rarity;
  return await this.find(query).sort({ id: 1 });
};

// ایجاد مدل
export const StickerModel = mongoose.models.Sticker || mongoose.model<ISticker>('Sticker', StickerSchema);

export default StickerModel;