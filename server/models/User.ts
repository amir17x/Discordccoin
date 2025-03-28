import mongoose, { Schema, Document } from 'mongoose';
import { IFriend } from './friend/Friend';
import { IUserInterests } from './friend/UserInterests';
import { ITransaction } from './economy/Transaction';

/**
 * رابط کاربر برای استفاده در تایپ‌اسکریپت
 */
export interface IUser extends Document {
  discordId: string;
  username: string;
  displayName?: string;
  wallet: number;
  bank: number;
  crystals: number;
  economyLevel: number;
  points: number;
  level: number;
  experience: number;
  lastDaily: Date | null;
  lastWeekly: Date | null;
  lastMonthly: Date | null;
  lastRob: Date | null;
  lastWork: Date | null;
  lastWheelSpin: Date | null;
  inventory: Record<string, number>;
  dailyStreak: number;
  achievements: string[];
  itemsEquipped: string[];
  isBot: boolean;
  isBanned: boolean;
  isMuted: boolean;
  joinedAt: Date;
  lastActivity: Date;
  reputation: number;
  energyPoints: number;
  lastEnergyRefill: Date | null;
  xpBooster: {
    active: boolean;
    multiplier: number;
    expiresAt: Date | null;
  };
  coinBooster: {
    active: boolean;
    multiplier: number;
    expiresAt: Date | null;
  };
  nickname: string | null;
  avatarURL: string | null;
  roles: string[];
  badges: string[];
  skillPoints: number;
  marketplaceListings: any[]; // بعدا می‌توان این را به نوع دقیق‌تری تبدیل کرد
  claimedRewards: string[];
  dailyGifts: {
    giftsGiven: Record<string, Date>;
    giftsReceived: Record<string, Date>;
  };
  friendshipActivities: {
    userId: string;
    activity: string;
    timestamp: Date;
  }[];
  isVIP: boolean;
  premiumUntil: Date | null;
  vipTier: number;
  stockPortfolio: any[]; // بعدا می‌توان این را به نوع دقیق‌تری تبدیل کرد
  clanId: number | null;
  clanRole: string | null;
  messages: number;
  commands: number;
  warnings: {
    reason: string;
    issuedBy: string;
    timestamp: Date;
  }[];
  notes: string | null;
  createdAt: Date;
}

/**
 * طرح داده‌ای کاربر در MongoDB
 */
const UserSchema: Schema = new Schema({
  // اطلاعات پایه کاربر
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: { type: String, default: null },
  
  // اقتصادی
  wallet: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  crystals: { type: Number, default: 0 },
  economyLevel: { type: Number, default: 1 },
  
  // سطح و تجربه
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  
  // زمان‌های آخرین فعالیت
  lastDaily: { type: Date, default: null },
  lastWeekly: { type: Date, default: null },
  lastMonthly: { type: Date, default: null },
  lastRob: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  lastWheelSpin: { type: Date, default: null },
  
  // انبار و آیتم‌ها
  inventory: { type: Map, of: Number, default: {} },
  dailyStreak: { type: Number, default: 0 },
  achievements: { type: [String], default: [] },
  itemsEquipped: { type: [String], default: [] },
  
  // وضعیت کاربر
  isBot: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  
  // زمان‌ها
  joinedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  
  // ویژگی‌های اضافی
  reputation: { type: Number, default: 0 },
  energyPoints: { type: Number, default: 100 },
  lastEnergyRefill: { type: Date, default: null },
  
  // بوسترها
  xpBooster: {
    active: { type: Boolean, default: false },
    multiplier: { type: Number, default: 1 },
    expiresAt: { type: Date, default: null }
  },
  coinBooster: {
    active: { type: Boolean, default: false },
    multiplier: { type: Number, default: 1 },
    expiresAt: { type: Date, default: null }
  },
  
  // اطلاعات پروفایل
  nickname: { type: String, default: null },
  avatarURL: { type: String, default: null },
  roles: { type: [String], default: [] },
  badges: { type: [String], default: [] },
  
  // مهارت‌ها و جوایز
  skillPoints: { type: Number, default: 0 },
  marketplaceListings: { type: Array, default: [] },
  claimedRewards: { type: [String], default: [] },
  
  // سیستم هدیه روزانه
  dailyGifts: {
    giftsGiven: { type: Map, of: Date, default: {} },
    giftsReceived: { type: Map, of: Date, default: {} }
  },
  
  // فعالیت‌های دوستی
  friendshipActivities: [{
    userId: String,
    activity: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // ویژگی‌های ویژه
  isVIP: { type: Boolean, default: false },
  premiumUntil: { type: Date, default: null },
  vipTier: { type: Number, default: 0 },
  
  // سهام و سرمایه‌گذاری
  stockPortfolio: { type: Array, default: [] },
  
  // اطلاعات کلن
  clanId: { type: Number, default: null },
  clanRole: { type: String, default: null },
  
  // آمار
  messages: { type: Number, default: 0 },
  commands: { type: Number, default: 0 },
  
  // مدیریت
  warnings: [{
    reason: String,
    issuedBy: String,
    timestamp: { type: Date, default: Date.now }
  }],
  notes: { type: String, default: null },
  
  // فیلدهای سیستمی
  createdAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  versionKey: false
});

export default mongoose.model<IUser>('User', UserSchema);