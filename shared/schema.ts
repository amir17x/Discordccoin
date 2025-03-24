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
  lastDaily: timestamp("last_daily"),
  lastRob: timestamp("last_rob"),
  lastWheelSpin: timestamp("last_wheel_spin"),
  inventory: jsonb("inventory").notNull().default({}),
  dailyStreak: integer("daily_streak").notNull().default(0),
  totalGamesPlayed: integer("total_games_played").notNull().default(0),
  totalGamesWon: integer("total_games_won").notNull().default(0),
  clanId: integer("clan_id"),
  // سوابق تراکنش‌های کاربر (واریز، برداشت، انتقال)
  transactions: jsonb("transactions").$type<Transaction[]>().default([]),
  // آمار انتقال سکه به کاربران دیگر
  transferStats: jsonb("transfer_stats").$type<TransferStats>().default({
    dailyAmount: 0,
    lastReset: new Date(),
    recipients: {}
  }),
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
        'steal_success' | 'steal_victim' | 'steal_failed' | 'item_purchase' | 'item_purchase_crystal' | 'welcome_bonus';
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
}

// Define Transfer Statistics
export interface TransferStats {
  dailyAmount: number;
  lastReset: Date;
  recipients: Record<string, number>; // مقدار انتقال به هر کاربر
}
