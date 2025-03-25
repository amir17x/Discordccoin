import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  wallet: integer("wallet").notNull().default(0),
  bank: integer("bank").notNull().default(0),
  crystals: integer("crystals").notNull().default(0),
  economyLevel: integer("economy_level").notNull().default(1),
  points: integer("points").notNull().default(0), // امتیاز کاربر برای رتبه‌بندی
  level: integer("level").notNull().default(1), // سطح کاربر
  experience: integer("experience").notNull().default(0), // تجربه کاربر
  lastDaily: timestamp("last_daily"),
  lastRob: timestamp("last_rob"),
  lastWheelSpin: timestamp("last_wheel_spin"),
  lastBankInterest: timestamp("last_bank_interest"), // تاریخ آخرین پرداخت سود بانکی
  lastSeen: timestamp("last_seen").defaultNow(), // آخرین زمان فعالیت
  inventory: jsonb("inventory").notNull().default({}),
  dailyStreak: integer("daily_streak").notNull().default(0),
  totalGamesPlayed: integer("total_games_played").notNull().default(0),
  totalGamesWon: integer("total_games_won").notNull().default(0),
  clanId: integer("clan_id"),
  // سوابق تراکنش‌های کاربر (واریز، برداشت، انتقال)
  transactions: jsonb("transactions").$type<Transaction[]>().default([]),
  // سرمایه‌گذاری‌های کاربر
  investments: jsonb("investments").$type<Investment[]>().default([]),
  // آمار انتقال سکه به کاربران دیگر
  transferStats: jsonb("transfer_stats").$type<TransferStats>().default({
    dailyAmount: 0,
    lastReset: new Date(),
    recipients: {}
  }),
  // سطح حساب بانکی (عادی، نقره‌ای، طلایی)
  bankLevel: text("bank_level").notNull().default("normal"),
  // منابع کلن برای کاربر
  clanResources: jsonb("clan_resources").$type<{
    materials: number,
    labor: number,
    lastCollected: string
  }>().default({
    materials: 0,
    labor: 0,
    lastCollected: new Date(0).toISOString()
  }),
  // سهام کاربر
  stocks: jsonb("stocks").$type<UserStock[]>().default([]),
  // لاتاری کاربر
  lotteryTickets: jsonb("lottery_tickets").$type<UserLottery[]>().default([]),
  // تاریخ آخرین پرداخت سود سهام
  lastDividendPayout: timestamp("last_dividend_payout"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Items table
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  crystalPrice: integer("crystal_price"),
  emoji: text("emoji").notNull(),
  type: text("type").notNull(),
  duration: integer("duration"), // Duration in hours, if applicable
  rarity: text("rarity").notNull().default("common"),
  effects: jsonb("effects").default({}),
});

// Clans table
export const clans = pgTable("clans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  ownerId: text("owner_id").notNull(),
  bank: integer("bank").notNull().default(0),
  level: integer("level").notNull().default(1),
  memberCount: integer("member_count").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  
  // آمار جنگ کلن‌ها
  warWins: integer("war_wins").notNull().default(0),
  warLosses: integer("war_losses").notNull().default(0),
  
  // اطلاعات مدیریت اعضا (استایل Clash of Clans)
  coLeaderIds: jsonb("co_leader_ids").$type<string[]>().default([]),
  elderIds: jsonb("elder_ids").$type<string[]>().default([]),
  
  // فیلدهای مربوط به وار کلن
  warStatus: text("war_status").default('none'), // none, preparation, active, ended
  warOpponentId: integer("war_opponent_id"),
  warOpponentName: text("war_opponent_name"),
  warScore: integer("war_score").default(0),
  warOpponentScore: integer("war_opponent_score").default(0),
  warStartTime: timestamp("war_start_time"),
  warEndTime: timestamp("war_end_time"),
  warPreparationEndTime: timestamp("war_preparation_end_time"),
  warReadyMembers: integer("war_ready_members").default(0),
  
  // ویژگی‌های جزیره کلن
  hasIsland: boolean("has_island").default(false),
  islandLevel: integer("island_level").notNull().default(0),
  buildings: jsonb("buildings").$type<ClanBuilding[]>().default([]),
  lastResourceCollection: timestamp("last_resource_collection"),
  
  // پروژه‌های فعلی
  activeProjects: jsonb("active_projects").$type<ClanProject[]>().default([]),
  
  // امکانات و قابلیت‌های فعال
  perks: jsonb("perks").$type<ClanPerk[]>().default([]),
  
  // ماموریت‌های کلن
  missions: jsonb("missions").$type<ClanMission[]>().default([]),
  
  // پرچم و آواتار کلن
  banner: text("banner"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quests table
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // daily, weekly, monthly
  requirement: text("requirement").notNull(),
  targetAmount: integer("target_amount").notNull(),
  reward: integer("reward").notNull(),
  active: boolean("active").notNull().default(true),
});

// User Quests table
export const userQuests = pgTable("user_quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questId: integer("quest_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirement: text("requirement").notNull(),
  targetAmount: integer("target_amount").notNull(),
  reward: integer("reward").notNull(),
});

// User Achievements table
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  bet: integer("bet").notNull(),
  won: boolean("won").notNull(),
  reward: integer("reward").notNull(),
  playedAt: timestamp("played_at").defaultNow(),
});

// Stocks table
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  currentPrice: real("current_price").notNull(),
  previousPrice: real("previous_price").notNull(),
  priceHistory: jsonb("price_history").$type<{
    timestamp: string;
    price: number;
  }[]>().default([]),
  volatility: integer("volatility").notNull(), // میزان نوسان (از 1 تا 10)
  trend: integer("trend").notNull(), // روند قیمت (-5 تا +5)
  sector: text("sector").notNull(),
  totalShares: integer("total_shares").notNull(),
  availableShares: integer("available_shares").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Stocks table
export const userStocks = pgTable("user_stocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockId: integer("stock_id").notNull(),
  quantity: integer("quantity").notNull(),
  purchasePrice: real("purchase_price").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
});

// Lottery table
export const lotteries = pgTable("lotteries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ticketPrice: integer("ticket_price").notNull(),
  jackpot: integer("jackpot").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  winnerId: integer("winner_id"),
  status: text("status").notNull().default("active"),
  participants: jsonb("participants").$type<{
    userId: number;
    ticketCount: number;
  }[]>().default([]),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  discordId: true,
  username: true,
});

export const insertClanSchema = createInsertSchema(clans).pick({
  name: true,
  description: true,
  ownerId: true,
});

export const insertQuestSchema = createInsertSchema(quests).pick({
  title: true,
  description: true,
  type: true,
  requirement: true,
  targetAmount: true,
  reward: true,
});

export const insertItemSchema = createInsertSchema(items).pick({
  name: true,
  description: true,
  price: true,
  crystalPrice: true,
  emoji: true,
  type: true,
  duration: true,
  rarity: true,
  effects: true,
});

export const insertStockSchema = createInsertSchema(stocks).pick({
  symbol: true,
  name: true,
  description: true,
  currentPrice: true,
  previousPrice: true,
  volatility: true,
  trend: true,
  sector: true,
  totalShares: true,
  availableShares: true,
});

export const insertLotterySchema = createInsertSchema(lotteries).pick({
  name: true,
  description: true,
  ticketPrice: true,
  jackpot: true,
  startTime: true,
  endTime: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClan = z.infer<typeof insertClanSchema>;
export type Clan = typeof clans.$inferSelect;

export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type Game = typeof games.$inferSelect;
export type UserQuest = typeof userQuests.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertStock = z.infer<typeof insertStockSchema>;
export type StockData = typeof stocks.$inferSelect;

export type InsertLottery = z.infer<typeof insertLotterySchema>;
export type LotteryData = typeof lotteries.$inferSelect;
export type UserStockData = typeof userStocks.$inferSelect;

// Define game types
export type GameType = "coinflip" | "rps" | "numberguess";

// Define inventory item
export interface InventoryItem {
  itemId: number;
  quantity: number;
  expires?: Date;
  active?: boolean;
}

// Define effects
export interface ItemEffects {
  robberyChance?: number;
  shopDiscount?: number;
  dailyBonus?: number;
  wheelChance?: number;
}

// Define Transaction
export interface Transaction {
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out' | 'game_win' | 'game_loss' | 'quest_reward' | 
        'steal_success' | 'steal_victim' | 'steal_failed' | 'item_purchase' | 'item_purchase_crystal' | 'welcome_bonus' |
        'stock_buy' | 'stock_sell' | 'stock_dividend' | 'lottery_ticket' | 'lottery_win' | 'bank_interest';
  amount: number;
  fee: number;
  timestamp: Date;
  sourceId?: number;     // برای انتقال دریافتی یا سرقت
  targetId?: number;     // برای انتقال خروجی یا سرقت
  sourceName?: string;   // نام کاربر فرستنده
  targetName?: string;   // نام کاربر گیرنده
  gameType?: string;     // برای تراکنش‌های بازی
  questId?: number;      // برای پاداش‌های کوئست
  itemId?: number;       // شناسه آیتم خریداری شده
  itemName?: string;     // نام آیتم خریداری شده
  stockId?: number;      // شناسه سهام
  stockSymbol?: string;  // نماد سهام 
  quantity?: number;     // تعداد سهام یا بلیط لاتاری
  lotteryId?: number;    // شناسه لاتاری
  lotteryName?: string;  // نام لاتاری
}

// Define Transfer Statistics
export interface TransferStats {
  dailyAmount: number;
  lastReset: Date;
  recipients: Record<string, number>; // مقدار انتقال به هر کاربر
}

// Define Investment
export interface Investment {
  id: string;
  type: 'low_risk' | 'medium_risk' | 'high_risk';
  amount: number;
  expectedReturn: number;
  startDate: string;
  endDate: string;
  riskRate: number;
  status: 'active' | 'completed' | 'failed';
}

// تعریف سیستم سهام
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  description: string;
  currentPrice: number;
  previousPrice: number;
  priceHistory: {
    timestamp: string;
    price: number;
  }[];
  volatility: number; // میزان نوسان (از 1 تا 10)
  trend: number; // روند قیمت (-5 تا +5)
  sector: 'tech' | 'finance' | 'energy' | 'consumer' | 'industrial';
  totalShares: number;
  availableShares: number;
}

export interface UserStock {
  stockId: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
}

// تعریف سیستم لاتاری
export interface Lottery {
  id: string;
  name: string;
  description: string;
  ticketPrice: number;
  jackpot: number;
  startTime: string;
  endTime: string;
  winnerId?: number;
  status: 'active' | 'completed';
  participants: {
    userId: number;
    ticketCount: number;
  }[];
}

export interface UserLottery {
  lotteryId: string;
  tickets: number;
  purchaseDate: string;
}

// تعریف ساختمان‌های کلن
export interface ClanBuilding {
  id: string;
  type: 'headquarters' | 'bank' | 'training_camp' | 'market' | 'laboratory' | 'barracks' | 'wall' | 'tower';
  name: string;
  level: number;
  upgradeProgress: number;
  upgradeTarget: number;
  completionTime?: string;
  effects: {
    bankBonus?: number;
    memberCapacityBonus?: number;
    attackBonus?: number;
    defenseBonus?: number;
    productionBonus?: number;
    researchBonus?: number;
  };
}

// تعریف پروژه‌های کلن
export interface ClanProject {
  id: string;
  name: string;
  description: string;
  resourcesRequired: {
    coins: number;
    materials: number;
    labor: number;
  };
  resourcesContributed: {
    coins: number;
    materials: number;
    labor: number;
  };
  progress: number;
  rewards: {
    experience: number;
    perkPoints: number;
    buildingId?: string;
  };
  deadline?: string;
  completionTime?: string;
  status: 'active' | 'completed' | 'failed';
}

// تعریف قابلیت‌های کلن
export interface ClanPerk {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effects: {
    bankInterestBonus?: number;
    memberCapacity?: number;
    dailyRewardBonus?: number;
    shopDiscountBonus?: number;
    combatBonus?: number;
    resourceProductionBonus?: number;
  };
  activationTime: string;
  expirationTime?: string; // اگر مقدار نداشته باشد، دائمی است
  active: boolean;
}

// تعریف ماموریت‌های کلن
export interface ClanMission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'season';
  requirement: {
    type: 'win_games' | 'deposit_coins' | 'collect_items' | 'upgrade_buildings' | 'win_wars';
    targetAmount: number;
  };
  progress: number;
  rewards: {
    coins: number;
    experience: number;
    materials?: number;
    specialItem?: {
      id: number;
      name: string;
    };
  };
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'failed';
}
