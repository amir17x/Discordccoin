import mongoose, { Schema, Document } from 'mongoose';

// نوع میشن‌های کلن
export interface ClanMission {
  id: number;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  reward: number;
  expiresAt: Date;
  completed: boolean;
}

/**
 * رابط کلن برای استفاده در تایپ‌اسکریپت
 */
export interface IClan extends Document {
  name: string;
  description: string | null;
  ownerId: string; // دیسکورد آیدی مالک
  bank: number;
  level: number;
  experience: number;
  memberCount: number;
  missions: ClanMission[] | null;
  maxMembers: number;
  warWins: number;
  warLosses: number;
  warDraws: number;
  motd: string | null; // پیام روز
  color: string; // کد رنگ به صورت هگز
  icon: string | null; // URL آیکون
  banner: string | null; // URL بنر
  isPublic: boolean;
  joinRequirements: {
    minLevel: number;
    minReputation: number;
    requiresApproval: boolean;
  };
  members: {
    userId: string;
    role: string;
    joinedAt: Date;
    contribution: number;
  }[];
  warHistory: {
    opponentId: number;
    result: 'win' | 'loss' | 'draw';
    points: number;
    date: Date;
  }[];
  announcements: {
    title: string;
    content: string;
    author: string;
    timestamp: Date;
  }[];
  boosts: {
    type: string;
    multiplier: number;
    expiresAt: Date;
    active: boolean;
  }[];
  achievements: string[];
  alliances: number[];
  rivals: number[];
  weeklyContribution: {
    userId: string;
    amount: number;
    lastContribution: Date;
  }[];
  createdAt: Date;
}

/**
 * طرح داده‌ای کلن در MongoDB
 */
const ClanSchema: Schema = new Schema({
  // اطلاعات پایه کلن
  name: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  ownerId: { type: String, required: true },
  
  // اقتصاد و سطح
  bank: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  
  // اعضا
  memberCount: { type: Number, default: 1 },
  maxMembers: { type: Number, default: 10 },
  
  // میشن‌ها
  missions: [{
    id: Number,
    title: String,
    description: String,
    targetAmount: Number,
    currentAmount: { type: Number, default: 0 },
    reward: Number,
    expiresAt: Date,
    completed: { type: Boolean, default: false }
  }],
  
  // آمار جنگ
  warWins: { type: Number, default: 0 },
  warLosses: { type: Number, default: 0 },
  warDraws: { type: Number, default: 0 },
  
  // ظاهر
  motd: { type: String, default: null },
  color: { type: String, default: '#7289DA' },
  icon: { type: String, default: null },
  banner: { type: String, default: null },
  
  // تنظیمات
  isPublic: { type: Boolean, default: true },
  joinRequirements: {
    minLevel: { type: Number, default: 1 },
    minReputation: { type: Number, default: 0 },
    requiresApproval: { type: Boolean, default: false }
  },
  
  // اعضا با جزئیات
  members: [{
    userId: String,
    role: { type: String, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    contribution: { type: Number, default: 0 }
  }],
  
  // تاریخچه جنگ
  warHistory: [{
    opponentId: Number,
    result: { type: String, enum: ['win', 'loss', 'draw'] },
    points: Number,
    date: { type: Date, default: Date.now }
  }],
  
  // اعلانات
  announcements: [{
    title: String,
    content: String,
    author: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // بوست‌ها
  boosts: [{
    type: String,
    multiplier: Number,
    expiresAt: Date,
    active: { type: Boolean, default: true }
  }],
  
  // دستاوردها و روابط
  achievements: { type: [String], default: [] },
  alliances: { type: [Number], default: [] },
  rivals: { type: [Number], default: [] },
  
  // میزان مشارکت هفتگی
  weeklyContribution: [{
    userId: String,
    amount: Number,
    lastContribution: { type: Date, default: Date.now }
  }],
  
  // فیلدهای سیستمی
  createdAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  versionKey: false
});

const Clan = mongoose.model<IClan>('Clan', ClanSchema);
export default Clan;