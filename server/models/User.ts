/**
 * مدل کاربر
 * این فایل مدل مونگوی کاربر را تعریف می‌کند
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: number;
  discordId: string;
  username: string;
  displayName: string | null;
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
  achievements: any[];
  itemsEquipped: any[];
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
  // اعلانات شخصی ذخیره شده
  personalNotifications: {
    notifications: string[];
    lastUpdated: Date;
  };
  nickname: string | null;
  avatarURL: string | null;
  roles: string[];
  badges: string[];
  skillPoints: number;
  marketplaceListings: any[];
  claimedRewards: any[];
  dailyGifts: {
    giftsGiven: Record<string, any>;
    giftsReceived: Record<string, any>;
  };
  friendshipActivities: any[];
  isVIP: boolean;
  premiumUntil: Date | null;
  vipTier: number;
  aiAssistant: {
    subscription: boolean;
    subscriptionTier: string;
    subscriptionExpires: Date | null;
    questionsRemaining: number;
    totalQuestions: number;
  };
  stockPortfolio: any[];
  clanId: number | null;
  clanRole: string | null;
  messages: number;
  commands: number;
  warnings: any[];
  notes: string | null;
  totalGamesPlayed: number;
  totalGamesWon: number;
  transactions: any[];
  transferStats: {
    dailyAmount: number;
    lastReset: Date;
    recipients: Record<string, number>;
  };
  games: any[];
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  id: { type: Number, required: true, unique: true },
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: { type: String, default: null },
  wallet: { type: Number, default: 500 },
  bank: { type: Number, default: 0 },
  crystals: { type: Number, default: 0 },
  economyLevel: { type: Number, default: 1 },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastWeekly: { type: Date, default: null },
  lastMonthly: { type: Date, default: null },
  lastRob: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  lastWheelSpin: { type: Date, default: null },
  inventory: { type: Map, of: Number, default: {} },
  dailyStreak: { type: Number, default: 0 },
  achievements: { type: Array, default: [] },
  itemsEquipped: { type: Array, default: [] },
  isBot: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  reputation: { type: Number, default: 0 },
  energyPoints: { type: Number, default: 100 },
  lastEnergyRefill: { type: Date, default: null },
  xpBooster: {
    type: Object,
    default: {
      active: false,
      multiplier: 1,
      expiresAt: null
    }
  },
  coinBooster: {
    type: Object,
    default: {
      active: false,
      multiplier: 1,
      expiresAt: null
    }
  },
  nickname: { type: String, default: null },
  avatarURL: { type: String, default: null },
  roles: { type: [String], default: [] },
  badges: { type: [String], default: [] },
  skillPoints: { type: Number, default: 0 },
  marketplaceListings: { type: Array, default: [] },
  claimedRewards: { type: Array, default: [] },
  dailyGifts: {
    type: Object,
    default: {
      giftsGiven: {},
      giftsReceived: {}
    }
  },
  friendshipActivities: { type: Array, default: [] },
  isVIP: { type: Boolean, default: false },
  premiumUntil: { type: Date, default: null },
  vipTier: { type: Number, default: 0 },
  aiAssistant: {
    type: Object,
    default: {
      subscription: false,
      subscriptionTier: 'none',
      subscriptionExpires: null,
      questionsRemaining: 5,
      totalQuestions: 5
    }
  },
  stockPortfolio: { type: Array, default: [] },
  clanId: { type: Number, default: null },
  clanRole: { type: String, default: null },
  messages: { type: Number, default: 0 },
  commands: { type: Number, default: 0 },
  warnings: { type: Array, default: [] },
  notes: { type: String, default: null },
  totalGamesPlayed: { type: Number, default: 0 },
  totalGamesWon: { type: Number, default: 0 },
  transactions: { type: Array, default: [] },
  transferStats: {
    type: Object,
    default: {
      dailyAmount: 0,
      lastReset: Date.now,
      recipients: {}
    }
  },
  games: { type: Array, default: [] },
  personalNotifications: {
    type: Object,
    default: {
      notifications: [],
      lastUpdated: Date.now
    }
  },
  createdAt: { type: Date, default: Date.now }
});

// اطمینان حاصل کنیم که مدل از قبل وجود ندارد
const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default UserModel;