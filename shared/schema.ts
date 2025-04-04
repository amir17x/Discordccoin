import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// تایپ‌های مربوط به سیستم اعلان‌های شخصی
export type NotificationType = 'private_chat' | 'anonymous_chat' | 'friend_request' | 'economy';

export interface NotificationSettings {
  enabled: boolean;
  notifyPrivateChat: boolean;
  notifyAnonymousChat: boolean;
  notifyFriendRequest: boolean;
  notifyEconomy: boolean;
}

export interface Notification {
  id?: string;
  userId: number;
  type: NotificationType;
  message: string;
  priority: number;
  relatedEntityId?: string;
  sent: boolean;
  timestamp: Date;
}

export interface UserInteraction {
  userId: number;
  targetId: string;
  interactionCount: number;
  lastInteraction: Date;
}

// سیستم وام
export interface Loan {
  id: string;
  userId: number;
  amount: number;
  interestRate: number;
  interest: number;
  requestDate: Date;
  dueDate: Date;
  status: 'active' | 'paid' | 'overdue' | 'confiscated';
  type: 'small' | 'medium' | 'large';
  remainingAmount: number;
}

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name"), // نام نمایشی کاربر (برای پنل مدیریت)
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
  lastActive: timestamp("last_active").defaultNow(), // آخرین زمان فعالیت برای پنل مدیریت
  inventory: jsonb("inventory").notNull().default({}),
  dailyStreak: integer("daily_streak").notNull().default(0),
  totalGamesPlayed: integer("total_games_played").notNull().default(0),
  totalGamesWon: integer("total_games_won").notNull().default(0),
  clanId: integer("clan_id"),
  // سوابق تراکنش‌های کاربر (واریز، برداشت، انتقال)
  transactions: jsonb("transactions").$type<Transaction[]>().default([]),
  // سرمایه‌گذاری‌های کاربر
  investments: jsonb("investments").$type<Investment[]>().default([]),
  // پت‌های (حیوانات خانگی) کاربر
  pets: jsonb("pets").$type<Pet[]>().default([]),
  // آمار انتقال سکه به کاربران دیگر
  transferStats: jsonb("transfer_stats").$type<TransferStats>().default({
    dailyAmount: 0,
    lastReset: new Date(),
    recipients: {}
  }),
  // سطح حساب بانکی (عادی، نقره‌ای، طلایی)
  bankLevel: text("bank_level").notNull().default("normal"),
  creditScore: integer("credit_score").notNull().default(50),
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
  // سیستم دوستان و چت
  friends: jsonb("friends").$type<Friend[]>().default([]),
  friendRequests: jsonb("friend_requests").$type<FriendRequest[]>().default([]),
  blockedUsers: jsonb("blocked_users").$type<BlockedUser[]>().default([]),
  interests: jsonb("interests").$type<UserInterests>().default({
    games: [],
    activities: [],
    topics: [],
    updatedAt: new Date().toISOString()
  }),
  
  // تنظیمات اطلاع‌رسانی دزدی
  robberyNotifications: jsonb("robbery_notifications").$type<{
    enabled: boolean;
    lastNotified: Date | null;
  }>().default({
    enabled: false,
    lastNotified: null
  }),
  
  // سطح حساب بانکی
  bankAccountTier: integer("bank_account_tier").default(0),
  bankAccountUpgradedAt: timestamp("bank_account_upgraded_at"),
  lastBankInterest: timestamp("last_bank_interest"),
  
  // فیلدهای مدیریتی
  banned: boolean("banned").notNull().default(false), // وضعیت مسدودیت
  banReason: text("ban_reason"), // دلیل مسدودیت
  role: text("role").default("user"), // نقش کاربر (user, admin, moderator)
  isPremium: boolean("is_premium").default(false), // آیا کاربر حساب ویژه دارد
  premiumUntil: timestamp("premium_until"), // تاریخ پایان حساب ویژه
  notes: text("notes"), // یادداشت‌های مدیریتی
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
  category: text("category").notNull().default("general"),
  minLevel: integer("min_level").notNull().default(1),
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
  category: text("category").notNull().default("general"),
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

// Stock News type
export interface StockNews {
  content: string;
  effect: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

// Stock Price History type
export interface StockPriceHistory {
  price: number;
  timestamp: Date;
}

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
  minPrice: integer("min_price"),
  maxPrice: integer("max_price"),
  updatedAt: timestamp("updated_at").defaultNow(),
  news: jsonb("news").$type<StockNews[]>().default([]),
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
  category: true,
  minLevel: true,
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

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type LoanData = typeof loans.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type JobData = typeof jobs.$inferSelect;

export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type AuctionData = typeof auctions.$inferSelect;

// Loans table
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  interest: integer("interest").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  jobType: varchar("job_type", { length: 50 }).notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  lastWork: timestamp("last_work"),
});

// Auctions table
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  itemId: integer("item_id"),
  startingBid: integer("starting_bid").notNull(),
  currentBid: integer("current_bid"),
  highestBidderId: integer("highest_bidder_id"),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  itemType: varchar("item_type", { length: 20 }).notNull(), // "item", "coin", "crystal"
  itemAmount: integer("item_amount"), // для количества монет или кристаллов
});

// Define insert schemas for new tables
export const insertLoanSchema = createInsertSchema(loans).pick({
  userId: true,
  amount: true,
  interest: true,
  dueDate: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  userId: true,
  jobType: true,
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  sellerId: true,
  itemId: true,
  startingBid: true,
  endTime: true,
  itemType: true,
  itemAmount: true,
});

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
        'stock_buy' | 'stock_sell' | 'stock_dividend' | 'lottery_ticket' | 'lottery_win' | 'bank_interest' |
        'loan_received' | 'loan_repayment' | 'job_salary' | 'auction_sale' | 'auction_bid' | 'auction_refund' |
        'transfer_sent' | 'transfer_received';
  amount: number;
  fee?: number;
  timestamp: Date;
  userId?: number;       // شناسه کاربر
  sourceId?: number;     // برای انتقال دریافتی یا سرقت
  targetId?: number;     // برای انتقال خروجی یا سرقت
  sourceName?: string;   // نام کاربر فرستنده
  targetName?: string;   // نام کاربر گیرنده
  senderName?: string;   // نام فرستنده
  receiverName?: string; // نام گیرنده
  receiverId?: string;   // شناسه گیرنده
  gameType?: string;     // برای تراکنش‌های بازی
  questId?: number;      // برای پاداش‌های کوئست
  description?: string;  // توضیحات تراکنش
  balance?: number;      // موجودی پس از تراکنش
  isSuccess?: boolean;   // آیا تراکنش موفق بوده
  currency?: string;     // نوع ارز (coins, crystals, items)
  itemId?: string | number;       // شناسه آیتم
  itemName?: string;     // نام آیتم
  itemQuantity?: number; // تعداد آیتم
  stockId?: number;      // شناسه سهام
  stockSymbol?: string;  // نماد سهام 
  quantity?: number;     // تعداد سهام یا بلیط لاتاری
  lotteryId?: number;    // شناسه لاتاری
  lotteryName?: string;  // نام لاتاری
  loanId?: string;       // شناسه وام
  jobId?: string;        // شناسه شغل
  auctionId?: string;    // شناسه حراج
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

/**
 * مدل داده برای پت‌های (حیوانات خانگی) کاربران
 */
export interface Pet {
  id: string;
  name: string;                    // نام پت
  type: 'dog' | 'cat' | 'rabbit' | 'dragon' | 'phoenix';  // نوع پت
  level: number;                   // سطح پت
  experience: number;              // تجربه پت
  happiness: number;               // میزان خوشحالی (0-100)
  hunger: number;                  // میزان گرسنگی (0-100)
  health: number;                  // میزان سلامتی (0-100)
  lastFed: string;                 // آخرین زمان غذا دادن
  lastPlayed: string;              // آخرین زمان بازی کردن
  acquiredDate: string;            // تاریخ به دست آوردن پت
  abilities: {                   // توانایی‌های ویژه پت
    economyBoost?: number;         // افزایش درصدی Ccoin دریافتی
    luckBoost?: number;            // افزایش شانس در بازی‌ها و چرخ شانس
    expBoost?: number;             // افزایش تجربه دریافتی
    defenseBoost?: number;         // کاهش احتمال دزدیده شدن سکه
  };
  equipment?: {                    // تجهیزات پت
    collar?: string;               // قلاده/گردنبند
    toy?: string;                  // اسباب بازی
    accessory?: string;            // لوازم جانبی
  };
  stats: {                         // آمار پت
    gamesPlayed: number;           // تعداد بازی‌ها
    treats: number;                // تعداد تشویقی‌ها
    wins: number;                  // تعداد پیروزی‌ها
  };
  active: boolean;                 // آیا پت فعال است
}

/**
 * مدل داده برای سیستم دوستان
 */
export interface Friend {
  friendId: string;                // شناسه دوست
  friendshipLevel: number;         // سطح دوستی
  friendshipXP: number;            // امتیاز دوستی
  addedAt: string;                 // تاریخ اضافه شدن
  lastInteraction: string;         // آخرین تعامل
  favoriteStatus: boolean;         // وضعیت علاقه‌مندی
  isBestFriend: boolean;           // وضعیت بهترین دوست
  notes?: string;                  // یادداشت‌های خصوصی
}

/**
 * مدل داده برای درخواست‌های دوستی
 */
export interface FriendRequest {
  fromUserId: string;              // شناسه فرستنده درخواست
  toUserId: string;                // شناسه گیرنده درخواست
  status: 'pending' | 'accepted' | 'rejected' | 'canceled';  // وضعیت درخواست
  message?: string;                // پیام همراه درخواست
  timestamp: string;               // زمان درخواست
}

/**
 * مدل داده برای کاربران بلاک شده
 */
export interface BlockedUser {
  userId: string;                  // شناسه کاربر بلاک شده
  reason?: string;                 // دلیل بلاک کردن
  timestamp: string;               // زمان بلاک کردن
}

/**
 * مدل داده برای چت خصوصی
 */
export interface PrivateChat {
  chatId: string;                  // شناسه چت
  participants: string[];          // شرکت‌کنندگان چت
  messages: PrivateMessage[];      // پیام‌های چت
  createdAt: string;               // زمان ایجاد چت
  lastActivityAt: string;          // آخرین فعالیت در چت
}

/**
 * مدل داده برای پیام‌های خصوصی
 */
export interface PrivateMessage {
  senderId: string;                // شناسه فرستنده
  content: string;                 // محتوای پیام
  timestamp: string;               // زمان ارسال
  readAt?: string;                 // زمان خوانده شدن
  attachments?: any[];             // فایل‌های پیوست
}

/**
 * مدل داده برای چت ناشناس
 */
export interface AnonymousChat {
  chatId: string;                  // شناسه چت
  user1Id: string;                 // شناسه کاربر اول
  user2Id: string;                 // شناسه کاربر دوم
  messages: AnonymousMessage[];    // پیام‌های چت
  createdAt: string;               // زمان ایجاد چت
  status: 'active' | 'ended';      // وضعیت چت
  lastMessageAt: string;           // زمان آخرین پیام
}

/**
 * مدل داده برای پیام‌های ناشناس
 */
export interface AnonymousMessage {
  sender: 'user1' | 'user2';       // فرستنده (بدون افشای هویت)
  content: string;                 // محتوای پیام
  timestamp: string;               // زمان ارسال
}

/**
 * سیستم علایق کاربر برای پیدا کردن دوستان مشابه
 */
export interface UserInterests {
  games: string[];                 // علاقه به بازی‌ها
  activities: string[];            // فعالیت‌های مورد علاقه
  topics: string[];                // موضوعات مورد علاقه
  updatedAt: string;               // آخرین بروزرسانی
}

/**
 * مدل داده برای سیستم وام و بدهی
 */
export interface Loan {
  id: string;                      // شناسه وام
  userId: number;                  // شناسه کاربر
  amount: number;                  // مقدار وام
  interest: number;                // سود وام
  dueDate: Date;                   // تاریخ سررسید
  status: 'active' | 'paid' | 'overdue' | 'confiscated'; // وضعیت وام
  requestDate: Date;               // تاریخ درخواست
  repaymentDate?: Date;            // تاریخ بازپرداخت
  remainingAmount: number;         // مقدار باقی‌مانده برای پرداخت
}

/**
 * مدل داده برای سیستم شغل و درآمد
 */
export interface Job {
  id: string;                      // شناسه شغل
  name: string;                    // نام شغل
  description: string;             // توضیحات شغل
  salaryBase: number;              // حقوق پایه
  salaryCurrency: 'ccoin' | 'crystal'; // نوع ارز پرداختی
  cooldown: number;                // زمان انتظار بین هر پرداخت (به ساعت)
  requirements: {                  // پیش‌نیازهای شغل
    minCoins?: number;             // حداقل سکه مورد نیاز
    minCrystals?: number;          // حداقل کریستال مورد نیاز
    minLevel?: number;             // حداقل سطح مورد نیاز
  };
  icon: string;                    // آیکون شغل (ایموجی)
}

/**
 * مدل داده برای شغل‌های کاربر
 */
export interface UserJob {
  userId: number;                  // شناسه کاربر
  jobId: string;                   // شناسه شغل
  level: number;                   // سطح شغلی کاربر
  xp: number;                      // تجربه شغلی
  lastWork: Date;                  // آخرین زمان دریافت حقوق
  totalEarned: number;             // کل درآمد از این شغل
}

/**
 * مدل داده برای سیستم حراج
 */
export interface Auction {
  id: string;                      // شناسه حراج
  sellerId: number;                // شناسه فروشنده
  itemType: 'item' | 'ccoin' | 'crystal'; // نوع آیتم حراجی
  itemId?: number;                 // شناسه آیتم (برای آیتم‌ها)
  quantity: number;                // تعداد آیتم یا مقدار سکه/کریستال
  startingBid: number;             // قیمت پایه
  currentBid: number;              // پیشنهاد فعلی
  highestBidderId?: number;        // شناسه بالاترین پیشنهاددهنده
  startTime: Date;                 // زمان شروع
  endTime: Date;                   // زمان پایان
  status: 'active' | 'completed' | 'cancelled'; // وضعیت حراج
  bids: AuctionBid[];              // تاریخچه پیشنهادها
}

/**
 * مدل داده برای پیشنهادهای حراج
 */
export interface AuctionBid {
  userId: number;                  // شناسه کاربر پیشنهاددهنده
  amount: number;                  // مقدار پیشنهاد
  timestamp: Date;                 // زمان پیشنهاد
}

/**
 * مدل داده برای بازار سیاه
 */
export interface BlackMarketItem {
  id: string;                      // شناسه آیتم
  name: string;                    // نام آیتم
  description: string;             // توضیحات آیتم
  price: number;                   // قیمت آیتم
  currency: 'ccoin' | 'crystal';   // نوع ارز
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; // نادر بودن
  risk: number;                    // ریسک خرید (0-100)
  effects: {                      // اثرات آیتم
    robberyBoost?: number;         // افزایش شانس سرقت
    xpBoost?: number;              // افزایش تجربه
    coinBoost?: number;            // افزایش سکه
    unlockFeature?: string;        // آزادسازی ویژگی خاص
  };
  available: boolean;              // آیا در دسترس است
  limitedStock?: number;           // تعداد محدود
  expiresAfter?: number;           // انقضا بعد از چند روز
  icon: string;                    // آیکون آیتم (ایموجی)
}

/**
 * مدل داده برای سرمایه‌گذاری کلن
 */
export interface ClanInvestment {
  id: string;                      // شناسه سرمایه‌گذاری
  clanId: number;                  // شناسه کلن
  type: 'business' | 'research' | 'expansion'; // نوع سرمایه‌گذاری
  name: string;                    // نام سرمایه‌گذاری
  description: string;             // توضیحات
  initialCost: number;             // هزینه اولیه
  currentValue: number;            // ارزش فعلی
  returnRate: number;              // نرخ بازگشت (درصد)
  dailyIncome: number;             // درآمد روزانه
  level: number;                   // سطح سرمایه‌گذاری
  upgradeCost: number;             // هزینه ارتقا
  lastCollection: Date;            // آخرین زمان جمع‌آوری سود
  contributors: {                  // مشارکت‌کنندگان
    userId: number;                // شناسه کاربر
    amount: number;                // مقدار مشارکت
    share: number;                 // درصد سهم
  }[];
  icon: string;                    // آیکون (ایموجی)
}
