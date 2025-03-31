import {
  User,
  InsertUser,
  Clan,
  InsertClan,
  Quest,
  InsertQuest,
  UserQuest,
  Achievement,
  UserAchievement,
  NotificationSettings,
  NotificationType,
  Notification,
  UserInteraction,
  Item,
  InsertItem,
  Game,
  InventoryItem,
  Transaction,
  TransactionType,
  TransferStats,
  InsertStock,
  Pet,
  Investment,
  UserStock,
  StockData
} from "@shared/schema";

// وارد کردن مدل شغل از فایل Job.ts
import { JobModel } from './models/economy/Job';

import { getCache, setCache, deleteCache } from './utils/cache';

// تعریف انواع داده‌های مورد نیاز برای دوستی
export interface Friend {
  id: string;
  userId: number;
  friendId: string;
  status: 'active' | 'blocked' | 'pending';
  createdAt: Date;
  lastInteraction: Date;
  friendshipLevel: number;
  friendshipXP: number;
  favoriteStatus: boolean;
  addedAt: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: number;
  toUserId: number;
  message?: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface BlockedUser {
  id: string;
  userId: number;
  blockedUserId: number;
  reason?: string;
  createdAt: Date;
}

export interface UserInterests {
  userId: number;
  gaming: string[];
  music: string[];
  movies: string[];
  sports: string[];
  books: string[];
  other: string[];
  lastUpdated: Date;
}

export interface PrivateChat {
  id: string;
  user1Id: number;
  user2Id: number;
  createdAt: Date;
  lastActivity: Date;
  messages: PrivateMessage[];
}

export interface PrivateMessage {
  id: string;
  chatId: string;
  senderId: number;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface AnonymousChat {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  participants: string[];
  messages: AnonymousMessage[];
}

export interface AnonymousMessage {
  id: string;
  chatId: string;
  senderAlias: string;
  content: string;
  timestamp: Date;
}

export interface Loan {
  id: string;
  borrowerId: number;
  lenderId: number;
  amount: number;
  interest: number;
  dueDate: Date;
  status: 'active' | 'repaid' | 'overdue';
  createdAt: Date;
  repaymentDate?: Date;
  description?: string;
}

export interface JobData {
  id: string;
  userId: number;
  jobType: string;
  income: number;
  cyclePeriod: number; // ساعت
  lastCollected: Date;
  level: number;
  xp: number;
  xpRequired: number;
  hiredAt: Date;
}

export interface AuctionData {
  id: number;
  sellerId: number;
  itemId: number | null;
  itemType: string;
  itemAmount?: number;
  startingBid: number;
  currentBid: number;
  highestBidderId?: number;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'ended' | 'cancelled';
  bids: AuctionBid[];
}

export interface AuctionBid {
  bidderId: number;
  amount: number;
  timestamp: Date;
}

export interface LotteryData {
  id: number;
  name: string;
  ticketPrice: number;
  jackpot: number;
  startTime: Date;
  endTime: Date;
  winner?: number;
  participants: LotteryParticipant[];
  status: 'active' | 'ended';
}

export interface LotteryParticipant {
  userId: number;
  tickets: number;
  joinedAt: Date;
}

// اضافه کردن مدل‌های جدید
import { 
  QuizQuestion, 
  QuizQuestionModel 
} from './models/QuizQuestion';
import { 
  GameSession, 
  GameSessionModel 
} from './models/GameSession';
import { 
  QuizReviewer, 
  QuizReviewerModel 
} from './models/QuizReviewer';

// تعریف تایپ تنظیمات کانال نکات
export interface TipChannelSettings {
  guildId: string;       // آیدی سرور
  channelId: string;     // آیدی کانال تنظیم شده
  interval: number;      // فاصله زمانی ارسال نکات (به ساعت)
  lastTipTime?: number;  // زمان آخرین نکته ارسال شده
  isActive: boolean;     // وضعیت فعال بودن سیستم نکات
}

// کلاس‌های موقت برای استاک که بعدا باید با اسکیما جایگزین شوند
type JobData = {
  id: string;
  userId: number;
  jobType: string;
  income: number;
  cyclePeriod: number; // به ساعت
  lastCollected: Date;
  level: number;
  xp: number;
  xpRequired: number;
  hiredAt: Date;
};

type StockData = {
  id: number;
  symbol: string;
  name: string;
  description: string;
  currentPrice: number;
  previousPrice: number;
  priceHistory: {
    timestamp: string;
    price: number;
  }[];
  volatility: number;
  trend: number;
  sector: string;
  totalShares: number;
  availableShares: number;
  updatedAt: Date;
};

type UserStockData = {
  id: number;
  userId: number;
  stockId: number;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
};

export interface IStorage {
  // User operations
  getUser(id: number | string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(limit?: number): Promise<User[]>;
  getUserCount(): Promise<number>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Game statistics
  incrementTotalGamesWon(userId: number): Promise<void>;
  incrementTotalGamesPlayed(userId: number): Promise<void>;
  getGameSession(gameId: string): Promise<GameSession | undefined>;
  
  // Notification operations
  getUserNotificationSettings(userId: number): Promise<NotificationSettings | undefined>;
  updateUserNotificationSettings(userId: number, updates: Partial<NotificationSettings>): Promise<NotificationSettings | undefined>;
  saveNotification(notification: Notification): Promise<Notification>;
  updateNotificationStatus(userId: number, type: NotificationType, relatedEntityId?: string): Promise<boolean>;
  getUserInteractionCount(userId: number, targetId: string): Promise<number>;
  getLastUserInteraction(userId: number, targetId: string): Promise<Date | undefined>;
  getUserEconomicActivity(userId: number): Promise<number>;
  
  // Economy operations
  addToWallet(userId: number, amount: number): Promise<User | undefined>;
  addToBank(userId: number, amount: number): Promise<User | undefined>;
  transferToBank(userId: number, amount: number): Promise<User | undefined>;
  transferToWallet(userId: number, amount: number): Promise<User | undefined>;
  addCrystals(userId: number, amount: number): Promise<User | undefined>;
  transferCoin(fromUserId: number, toUserId: number, amount: number): Promise<boolean>;
  
  // Item operations
  getAllItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  getItemById(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  buyItem(userId: number, itemId: number): Promise<{success: boolean; item?: Item; inventoryItem?: InventoryItem; message?: string}>;
  useItem(userId: number, inventoryItemId: string): Promise<{success: boolean; message?: string}>;
  getInventoryItems(userId: number): Promise<InventoryItem[]>;
  addItemToInventory(userId: number, itemId: number, quantity?: number): Promise<InventoryItem | undefined>;
  removeItemFromInventory(userId: number, itemId: number, quantity: number): Promise<boolean>;
  
  // Game operations
  recordGame(userId: number, type: string, bet: number, won: boolean, reward: number): Promise<Game>;
  getUserGames(userId: number): Promise<Game[]>;
  
  // Quest operations
  getAllQuests(): Promise<Quest[]>;
  getQuest(id: number): Promise<Quest | undefined>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  
  // Job operations
  getUserJob(userId: number): Promise<JobData | undefined>;
  getAvailableJobs(): Promise<{id: string, name: string, income: number, cyclePeriod: number, requirements: any}[]>;
  assignJob(userId: number, jobType: string): Promise<JobData>;
  collectJobIncome(userId: number): Promise<{amount: number, xpEarned: number, leveledUp: boolean}>;
  updateJobXP(userId: number, xpAmount: number): Promise<{leveledUp: boolean, newLevel?: number}>;
  updateQuest(id: number, updates: Partial<Quest>): Promise<Quest | undefined>;
  getUserQuests(userId: number): Promise<{quest: Quest, userQuest: UserQuest}[]>;
  updateQuestProgress(userId: number, questId: number, progress: number): Promise<boolean>;
  
  // Clan operations
  getAllClans(): Promise<Clan[]>;
  getClan(id: number): Promise<Clan | undefined>;
  createClan(clan: InsertClan): Promise<Clan>;
  updateClan(id: number, updates: Partial<Clan>): Promise<Clan | undefined>;
  getClanByName(name: string): Promise<Clan | undefined>;
  addUserToClan(userId: number, clanId: number): Promise<boolean>;
  removeUserFromClan(userId: number): Promise<boolean>;
  
  // Achievement operations
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<{achievement: Achievement, userAchievement: UserAchievement}[]>;
  updateAchievementProgress(userId: number, achievementId: number, progress: number): Promise<boolean>;
  
  // Stock operations
  getAllStocks(): Promise<StockData[]>;
  getUserStocks(userId: number): Promise<UserStockData[]>;
  getStockById(stockId: number): Promise<StockData | null>;
  updateStockPrice(stockId: number, newPrice: number): Promise<boolean>;
  addStockNews(stockId: number, news: StockNews): Promise<boolean>;
  getStockNews(stockId: number, limit?: number): Promise<StockNews[]>;
  getStockPriceHistory(stockId: number, limit?: number): Promise<StockPriceHistory[]>;
  
  // Pet operations
  getUserPets(userId: number): Promise<Pet[]>;
  buyPet(userId: number, petType: string, petName: string): Promise<Pet | null>;
  feedPet(userId: number, petId: string): Promise<Pet | null>;
  playWithPet(userId: number, petId: string): Promise<Pet | null>;
  activatePet(userId: number, petId: string): Promise<boolean>;
  renamePet(userId: number, petId: string, newName: string): Promise<Pet | null>;
  
  // Friends operations
  getFriends(userId: number): Promise<Friend[]>;
  getFriendship(userId: number, friendId: number): Promise<Friend | undefined>;
  getFriendRequests(userId: number): Promise<FriendRequest[]>;
  getPendingFriendRequest(fromUserId: number, toUserId: number): Promise<FriendRequest | undefined>;
  sendFriendRequest(fromUserId: number, toUserId: number, message?: string): Promise<boolean>;
  createFriendRequest(fromUserId: number, toUserId: number, message?: string): Promise<boolean>;
  acceptFriendRequest(requestId: string): Promise<boolean>;
  rejectFriendRequest(requestId: string): Promise<boolean>;
  removeFriend(userId: number, friendId: number): Promise<boolean>;
  getFriendshipLevel(userId: number, friendId: number): Promise<number>;
  updateFriendshipStatus(userId: number, friendId: string, updates: Partial<Friend>): Promise<boolean>;
  updateFriendshipXP(userId: number, friendId: string, xp: number): Promise<{ leveledUp: boolean, newLevel?: number }>;
  recordFriendshipActivity(userId: number, friendId: number, type: string, details: string, xpEarned: number): Promise<boolean>;
  getFriendshipActivities(userId: number, friendId: number, limit?: number): Promise<any[]>;
  getFriendshipLeaderboard(limit?: number): Promise<any[]>;
  hasSentDailyGift(userId: number, friendId: number): Promise<boolean>;
  recordDailyGift(userId: number, friendId: number): Promise<boolean>;
  updateClaimedRewards(userId: number, rewardType: string): Promise<boolean>;
  
  // Private & Anonymous Chat operations
  getPrivateChats(userId: number): Promise<PrivateChat[]>;
  getPrivateChat(chatId: string): Promise<PrivateChat | undefined>;
  createPrivateChat(user1Id: number, user2Id: number): Promise<PrivateChat>;
  addPrivateMessage(chatId: string, senderId: number, content: string): Promise<boolean>;
  markMessagesAsRead(chatId: string, userId: number): Promise<boolean>;
  
  // Blocked users operations
  getBlockedUsers(userId: number): Promise<BlockedUser[]>;
  blockUser(userId: number, blockedUserId: number, reason?: string): Promise<boolean>;
  unblockUser(userId: number, blockedUserId: string | number): Promise<boolean>;
  unblockAllUsers(userId: number): Promise<boolean>;
  isUserBlocked(userId: number, blockedUserId: number): Promise<boolean>;
  
  // User interests operations
  getUserInterests(userId: number): Promise<UserInterests | undefined>;
  updateUserInterests(userId: number, interests: Partial<UserInterests>): Promise<boolean>;
  findSimilarUsers(userId: number, limit?: number): Promise<User[]>;
  
  // Loan operations
  getUserLoans(userId: number): Promise<Loan[]>;
  getLoanById(loanId: string): Promise<Loan | undefined>;
  getOverdueLoans(): Promise<Loan[]>;
  createLoan(loan: Loan): Promise<Loan>;
  updateLoanStatus(loanId: string, status: 'active' | 'paid' | 'overdue' | 'confiscated', repaymentDate?: Date): Promise<boolean>;
  updateCreditScore(userId: number, amount: number): Promise<number>;
  
  // Job operations
  getUserJob(userId: number): Promise<JobData | undefined>;
  getAvailableJobs(): Promise<{id: string, name: string, income: number, cyclePeriod: number, requirements: any}[]>;
  assignJob(userId: number, jobType: string): Promise<JobData>;
  collectJobIncome(userId: number): Promise<{amount: number, xpEarned: number, leveledUp: boolean}>;
  updateJobXP(userId: number, xpAmount: number): Promise<{leveledUp: boolean, newLevel?: number}>;
  
  // Auction operations
  getActiveAuctions(): Promise<AuctionData[]>;
  getAuctionById(auctionId: number): Promise<AuctionData | undefined>;
  createAuction(sellerId: number, itemId: number | null, startingBid: number, duration: number, itemType: string, itemAmount?: number): Promise<AuctionData>;
  placeBid(auctionId: number, bidderId: number, amount: number): Promise<boolean>;
  endAuction(auctionId: number): Promise<{sellerId: number, highestBidderId?: number, amount?: number, itemId?: number, itemType: string, itemAmount?: number}>;
  
  // Tip Channel operations
  getTipChannelSettings(guildId: string): Promise<TipChannelSettings | undefined>;
  setTipChannelSettings(settings: TipChannelSettings): Promise<boolean>;
  getAllActiveTipChannelSettings(): Promise<TipChannelSettings[]>;
  
  // Market operations
  getMarketListings(listingType?: 'regular' | 'black_market'): Promise<any[]>;
  getMarketListingById(listingId: string): Promise<any | undefined>;
  getUserMarketListings(userId: string): Promise<any[]>;
  createMarketListing(listing: {
    sellerId: string, 
    sellerName: string, 
    itemId: number, 
    itemName: string,
    itemEmoji: string,
    quantity: number, 
    price: number, 
    description: string,
    listingType: 'regular' | 'black_market',
    expiresAt: Date
  }): Promise<any>;
  updateMarketListing(listingId: string, updates: {
    price?: number, 
    quantity?: number, 
    description?: string, 
    active?: boolean
  }): Promise<any | undefined>;
  deleteMarketListing(listingId: string): Promise<boolean>;
  buyFromMarket(buyerId: string, listingId: string, quantity: number): Promise<{
    success: boolean, 
    message?: string, 
    listing?: any, 
    item?: any
  }>;
  
  // Quiz Question operations
  saveQuizQuestion(question: QuizQuestion): Promise<QuizQuestion>;
  getQuizQuestion(questionId: string): Promise<QuizQuestion | undefined>;
  getApprovedQuizQuestions(category?: string, difficulty?: 'easy' | 'medium' | 'hard', limit?: number): Promise<QuizQuestion[]>;
  getPendingQuizQuestions(limit?: number): Promise<QuizQuestion[]>;
  approveQuizQuestion(questionId: string, reviewerId: string): Promise<QuizQuestion | undefined>;
  rejectQuizQuestion(questionId: string, reviewerId: string, reason?: string): Promise<boolean>;
  getUserSubmittedQuestions(userId: string): Promise<QuizQuestion[]>;
  
  // Quiz Reviewer operations
  addQuizReviewer(reviewer: QuizReviewer): Promise<QuizReviewer>;
  removeQuizReviewer(userId: string): Promise<boolean>;
  getAllQuizReviewers(): Promise<QuizReviewer[]>;
  getActiveQuizReviewers(): Promise<QuizReviewer[]>;
  isQuizReviewer(userId: string): Promise<boolean>;
  appointQuizReviewer(userId: string, username: string, appointedBy: string): Promise<QuizReviewer>;
  getQuizReviewerByUserId(userId: string): Promise<QuizReviewer | undefined>;
  
  // Game Session operations
  saveGameSession(session: {
    gameId: string;
    gameType: string;
    guildId: string;
    channelId: string;
    hostId: string;
    players: string[];
    status: string;
    settings: any;
    sessionNumber: number;
    startedAt?: Date;
    endedAt?: Date;
    scores: { playerId: string; score: number }[];
  }): Promise<boolean>;
  getActiveGameSessions(gameType: string): Promise<any[]>;
  getActiveGameSessionsInGuild(guildId: string): Promise<any[]>;
  getActiveGameSessionsInChannel(channelId: string): Promise<any[]>;
  getMaxGameSessionNumber(guildId: string, gameType: string): Promise<number>;
  getGameSessionsForUser(userId: string): Promise<any[]>;
  
  // AI Assistant operations
  getUserAIAssistantDetails(userId: number): Promise<{subscription: boolean, subscriptionTier: string, subscriptionExpires: Date | null, questionsRemaining: number, totalQuestions: number} | undefined>;
  useAIAssistantQuestion(userId: number): Promise<boolean>;
  subscribeToAIAssistant(userId: number, tier: 'weekly' | 'monthly', amountPaid: number): Promise<boolean>;
  resetAIAssistantQuestions(userId: number): Promise<boolean>;
  getUserAIAssistantUsage(userId: number): Promise<number>;
  
  // Game Session operations
  createGameSession(gameSession: GameSession): Promise<GameSession>;
  updateGameSession(sessionId: string, updates: Partial<GameSession>): Promise<GameSession | undefined>;
  getGameSession(sessionId: string): Promise<GameSession | undefined>;
  getActiveGameSessionInChannel(channelId: string): Promise<GameSession | undefined>;
  getAllActiveGameSessions(): Promise<GameSession[]>;
  getActiveGameSessions(channelId?: string): Promise<GameSession[]>;
  deleteGameSession(sessionId: string): Promise<boolean>;
  addPlayerToGameSession(sessionId: string, playerId: string): Promise<GameSession | undefined>;
  removePlayerFromGameSession(sessionId: string, playerId: string): Promise<GameSession | undefined>;
  
  // Truth or Dare and other game session operations
  saveGameSession(session: {
    gameId: string;
    gameType: string;
    guildId: string;
    channelId: string;
    hostId: string;
    players: string[];
    status: string;
    settings: any;
    sessionNumber: number;
    startedAt?: Date;
    endedAt?: Date;
    scores: { playerId: string; score: number }[];
  }): Promise<boolean>;
  getActiveGameSessionsByType(gameType: string): Promise<any[]>;
  getActiveGameSessionsInGuild(guildId: string): Promise<any[]>;
  getActiveGameSessionsInChannel(channelId: string): Promise<any[]>;
  getMaxGameSessionNumber(guildId: string, gameType: string): Promise<number>;
  getGameSessionsForUser(userId: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private items: Map<number, Item> = new Map();
  private clans: Map<number, Clan> = new Map();
  private quests: Map<number, Quest> = new Map();
  private userQuests: Map<number, UserQuest[]> = new Map();
  private achievements: Map<number, Achievement> = new Map();
  private userAchievements: Map<number, UserAchievement[]> = new Map();
  private games: Game[] = [];
  private stocks: Map<number, StockData> = new Map();
  private userStocks: Map<number, UserStockData[]> = new Map();
  private lotteries: Map<number, LotteryData> = new Map();
  private privateChats: Map<string, PrivateChat> = new Map();
  private anonymousChats: Map<string, AnonymousChat> = new Map();
  private loans: Map<string, Loan> = new Map();
  private jobs: Map<number, JobData> = new Map();
  private auctions: Map<number, AuctionData> = new Map();
  
  // اعلان‌های شخصی
  private notificationSettings: Map<number, NotificationSettings> = new Map();
  private notifications: Map<number, Notification[]> = new Map();
  private userInteractions: Map<string, UserInteraction> = new Map(); // کلید: `${userId}_${targetId}`
  
  // تنظیمات کانال نکات
  private tipChannelSettings: Map<string, TipChannelSettings> = new Map(); // کلید: guildId
  
  // ذخیره سازی داده‌های بازی گروهی
  private quizQuestions: Map<string, QuizQuestion> = new Map(); // کلید: id
  private quizReviewers: Map<string, QuizReviewer> = new Map(); // کلید: userId
  private gameSessions: Map<string, GameSession> = new Map(); // کلید: id
  // ذخیره سازی جلسات بازی فعال (برای truth or dare و بازی‌های دیگر)
  private activeGameSessions: Map<string, any> = new Map(); // کلید: gameId
  
  private currentLoanId = 1;
  private currentJobId = 1;
  private currentAuctionId = 1;
  
  private currentUserId = 1;
  private currentItemId = 1;
  private currentClanId = 1;
  private currentQuestId = 1;
  private currentAchievementId = 1;
  private currentGameId = 1;
  private currentUserQuestId = 1;
  private currentUserAchievementId = 1;
  private currentStockId = 1;
  private currentUserStockId = 1;
  private currentLotteryId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize default items
    const defaultItems: InsertItem[] = [
      {
        name: "Lottery Ticket",
        description: "Try your luck in the big draw!",
        price: 500,
        emoji: "🎟️",
        type: "consumable",
        rarity: "common",
      },
      {
        name: "Mystery Box Key",
        description: "Opens a mystery box with random rewards",
        price: 300,
        emoji: "🔑",
        type: "consumable",
        rarity: "common",
      },
      {
        name: "Special Role",
        description: "5% better robbery chance, 5% shop discount",
        price: 1000,
        emoji: "🎭",
        type: "role",
        duration: 168, // 7 days in hours
        rarity: "rare",
        effects: { robberyChance: 5, shopDiscount: 5 },
      },
      {
        name: "Legendary Role",
        description: "10% better robbery chance, 10% shop discount",
        emoji: "🎩",
        type: "role",
        price: 0, // Not purchasable with coins
        crystalPrice: 50,
        duration: 336, // 14 days in hours
        rarity: "legendary",
        effects: { robberyChance: 10, shopDiscount: 10, dailyBonus: 20, wheelChance: 5 },
      },
      {
        name: "Voice Booster",
        description: "Special sound effects for 24 hours",
        price: 700,
        emoji: "🎤",
        type: "consumable",
        duration: 24,
        rarity: "uncommon",
      },
      {
        name: "Wallet Lock",
        description: "Protect your wallet from theft for 24 hours",
        price: 200,
        emoji: "🔒",
        type: "consumable",
        duration: 24,
        rarity: "common",
      },
    ];

    defaultItems.forEach(item => this.createItem(item));

    // Initialize default quests
    const defaultQuests: InsertQuest[] = [
      {
        title: "Message Sender",
        description: "Send 10 messages",
        type: "daily",
        requirement: "message",
        targetAmount: 10,
        reward: 100,
        category: "communication",
      },
      {
        title: "Game Winner",
        description: "Win a game",
        type: "daily",
        requirement: "win",
        targetAmount: 1,
        reward: 50,
        category: "games",
      },
      {
        title: "Competitive Player",
        description: "Win 5 competitive games",
        type: "weekly",
        requirement: "competitive_win",
        targetAmount: 5,
        reward: 300,
        category: "games",
      },
      {
        title: "Saver",
        description: "Save 2000 Ccoin in the bank",
        type: "monthly",
        requirement: "bank",
        targetAmount: 2000,
        category: "economy",
        reward: 1000,
      },
    ];

    defaultQuests.forEach(quest => this.createQuest(quest));

    // Initialize default achievements
    const defaultAchievements: Achievement[] = [
      {
        id: this.currentAchievementId++,
        title: "Rich Person",
        description: "Have 10,000 Ccoin in the bank",
        requirement: "bank",
        targetAmount: 10000,
        reward: 500,
      },
      {
        id: this.currentAchievementId++,
        title: "Professional Gamer",
        description: "Win 50 competitive games",
        requirement: "competitive_win",
        targetAmount: 50,
        reward: 1000,
      },
      {
        id: this.currentAchievementId++,
        title: "World Explorer",
        description: "Complete 10 world missions",
        requirement: "world_mission",
        targetAmount: 10,
        reward: 500,
      },
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.discordId === discordId) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    
    const user: User = {
      id,
      discordId: insertUser.discordId,
      username: insertUser.username,
      wallet: 500, // Starting amount
      bank: 0,
      crystals: 0,
      economyLevel: 1,
      lastDaily: null,
      lastRob: null,
      lastWheelSpin: null,
      inventory: {},
      dailyStreak: 0,
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      clanId: null,
      // فیلدهای جدید برای ثبت تراکنش و آمار انتقال
      transactions: [{
        type: 'deposit',
        amount: 500,
        fee: 0,
        timestamp: now,
        gameType: 'welcome_bonus'
      }],
      transferStats: {
        dailyAmount: 0,
        lastReset: now,
        recipients: {}
      },
      createdAt: now,
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUserCount(): Promise<number> {
    return this.users.size;
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    // اگر فیلد تراکنش‌ها وجود نداشت، آرایه خالی برگردان
    if (!user.transactions) {
      user.transactions = [];
    }
    
    // مرتب‌سازی تراکنش‌ها از جدیدترین به قدیمی‌ترین
    return [...user.transactions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Economy operations
  async addToWallet(userId: number, amount: number, transactionType: string = 'deposit', metadata: any = {}): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.wallet += amount;
    
    // Record transaction
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: transactionType,
      amount: amount,
      fee: 0,
      timestamp: new Date(),
      ...metadata
    });
    
    return user;
  }

  async addToBank(userId: number, amount: number, transactionType: string = 'deposit', metadata: any = {}): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.bank += amount;
    
    // Record transaction
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: transactionType,
      amount: amount,
      fee: 0,
      timestamp: new Date(),
      ...metadata
    });
    
    return user;
  }

  async transferToBank(userId: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    // امنیت بیشتر: بررسی اینکه مقدار معتبر است
    if (!user || user.wallet < amount || amount <= 0 || isNaN(amount)) return undefined;

    // محاسبه کارمزد
    const fee = Math.ceil(amount * 0.01); // 1% fee
    const depositAmount = amount - fee;

    // اعمال تغییرات
    user.wallet -= amount;
    user.bank += depositAmount;
    
    // ثبت تراکنش
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: 'deposit',
      amount: amount,
      fee: fee,
      timestamp: new Date()
    });
    
    return user;
  }

  async transferToWallet(userId: number, amount: number, metadata: any = {}): Promise<User | undefined> {
    const user = this.users.get(userId);
    // امنیت بیشتر: بررسی اینکه مقدار معتبر است
    if (!user || user.bank < amount || amount <= 0 || isNaN(amount)) return undefined;

    // اعمال تغییرات
    user.bank -= amount;
    user.wallet += amount;
    
    // ثبت تراکنش
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: 'withdraw',
      amount: amount,
      fee: 0, // برداشت از بانک کارمزد ندارد
      timestamp: new Date(),
      ...metadata
    });
    
    return user;
  }

  async addCrystals(userId: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.crystals += amount;
    return user;
  }

  async transferCoin(fromUserId: number, toUserId: number, amount: number): Promise<boolean> {
    const fromUser = this.users.get(fromUserId);
    const toUser = this.users.get(toUserId);
    
    // امنیت بیشتر: بررسی معتبر بودن مقدار و کاربران
    if (!fromUser || !toUser || fromUser.wallet < amount || amount <= 0 || isNaN(amount)) return false;
    
    // بررسی انتقال به خود
    if (fromUserId === toUserId) return false;
    
    // محدودیت انتقال روزانه
    const now = new Date();
    const DAILY_TRANSFER_LIMIT = 5000; // محدودیت 5000 سکه در روز
    
    if (!fromUser.transferStats) {
      fromUser.transferStats = {
        dailyAmount: 0,
        lastReset: now,
        recipients: {}
      };
    }
    
    // اگر روز جدیدی شروع شده، ریست کنیم
    if (now.getTime() - fromUser.transferStats.lastReset.getTime() > 24 * 60 * 60 * 1000) {
      fromUser.transferStats.dailyAmount = 0;
      fromUser.transferStats.lastReset = now;
      fromUser.transferStats.recipients = {};
    }
    
    // بررسی محدودیت روزانه
    if (fromUser.transferStats.dailyAmount + amount > DAILY_TRANSFER_LIMIT) {
      return false;
    }
    
    // بررسی انتقال مکرر به یک کاربر (محدودیت 2000 سکه به هر کاربر در روز)
    const toUserIdStr = toUserId.toString();
    if (!fromUser.transferStats.recipients[toUserIdStr]) {
      fromUser.transferStats.recipients[toUserIdStr] = 0;
    }
    
    if (fromUser.transferStats.recipients[toUserIdStr] + amount > 2000) {
      return false;
    }
    
    // اعمال تغییرات و به‌روزرسانی آمار
    fromUser.wallet -= amount;
    toUser.wallet += amount;
    
    fromUser.transferStats.dailyAmount += amount;
    fromUser.transferStats.recipients[toUserIdStr] += amount;
    
    // ثبت تراکنش
    if (!fromUser.transactions) fromUser.transactions = [];
    fromUser.transactions.push({
      type: 'transfer_out',
      amount: amount,
      fee: 0,
      targetId: toUserId,
      timestamp: now
    });
    
    if (!toUser.transactions) toUser.transactions = [];
    toUser.transactions.push({
      type: 'transfer_in',
      amount: amount,
      fee: 0,
      sourceId: fromUserId,
      timestamp: now
    });
    
    return true;
  }

  // Item operations
  async getAllItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }
  
  async getItemById(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }
  
  async updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) {
      return undefined;
    }
    
    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.currentItemId++;
    const item: Item = {
      id,
      name: insertItem.name,
      description: insertItem.description,
      price: insertItem.price,
      crystalPrice: insertItem.crystalPrice || null,
      emoji: insertItem.emoji,
      type: insertItem.type,
      duration: insertItem.duration || null,
      rarity: insertItem.rarity,
      effects: insertItem.effects || {},
    };

    this.items.set(id, item);
    return item;
  }

  async buyItem(userId: number, itemId: number): Promise<boolean> {
    const user = this.users.get(userId);
    const item = this.items.get(itemId);
    
    if (!user || !item) return false;
    
    // Record transaction
    if (!user.transactions) user.transactions = [];
    const now = new Date();
    
    // Check if item can be purchased with coins or crystals
    if (item.price && user.wallet >= item.price) {
      user.wallet -= item.price;
      
      // Record coin transaction
      user.transactions.push({
        type: 'item_purchase',
        amount: item.price,
        fee: 0,
        timestamp: now,
        itemId: item.id,
        itemName: item.name
      });
    } else if (item.crystalPrice && user.crystals >= item.crystalPrice) {
      user.crystals -= item.crystalPrice;
      
      // Record crystal transaction
      user.transactions.push({
        type: 'item_purchase_crystal',
        amount: item.crystalPrice,
        fee: 0,
        timestamp: now,
        itemId: item.id,
        itemName: item.name
      });
    } else {
      return false; // Not enough currency
    }
    
    // Add to inventory
    return this.addItemToInventory(userId, itemId);
  }

  async useItem(userId: number, itemId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const inventory = user.inventory as Record<string, InventoryItem>;
    const itemIdStr = itemId.toString();
    
    if (!inventory[itemIdStr] || inventory[itemIdStr].quantity <= 0) {
      return false;
    }
    
    const item = this.items.get(itemId);
    if (!item) return false;
    
    // Handle item use based on type
    if (item.type === 'role') {
      // Set active status and expiration
      const expires = new Date();
      expires.setHours(expires.getHours() + (item.duration || 24));
      
      inventory[itemIdStr] = {
        ...inventory[itemIdStr],
        active: true,
        expires,
      };
    } else if (item.type === 'consumable') {
      // Remove one from inventory
      inventory[itemIdStr].quantity -= 1;
      if (inventory[itemIdStr].quantity <= 0) {
        delete inventory[itemIdStr];
      }
    }
    
    return true;
  }

  async getInventoryItems(userId: number): Promise<{item: Item, inventoryItem: InventoryItem}[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    const inventory = user.inventory as Record<string, InventoryItem>;
    const result: {item: Item, inventoryItem: InventoryItem}[] = [];
    
    for (const [itemIdStr, inventoryItem] of Object.entries(inventory)) {
      const itemId = parseInt(itemIdStr);
      const item = this.items.get(itemId);
      
      if (item) {
        result.push({ item, inventoryItem });
      }
    }
    
    return result;
  }

  async addItemToInventory(userId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const inventory = user.inventory as Record<string, InventoryItem>;
    const itemIdStr = itemId.toString();
    
    if (inventory[itemIdStr]) {
      inventory[itemIdStr].quantity += quantity;
    } else {
      inventory[itemIdStr] = {
        itemId,
        quantity,
      };
    }
    
    return true;
  }

  async removeItemFromInventory(userId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const inventory = user.inventory as Record<string, InventoryItem>;
    const itemIdStr = itemId.toString();
    
    // اگر آیتم در انبار موجود نباشد
    if (!inventory[itemIdStr]) {
      return false;
    }
    
    // اگر تعداد آیتم کمتر از مقدار درخواستی باشد
    if (inventory[itemIdStr].quantity < quantity) {
      return false;
    }
    
    // کاهش تعداد آیتم
    inventory[itemIdStr].quantity -= quantity;
    
    // اگر تعداد آیتم به صفر رسید، آیتم را از انبار حذف کنیم
    if (inventory[itemIdStr].quantity <= 0) {
      delete inventory[itemIdStr];
    }
    
    return true;
  }

  // Game operations
  async recordGame(userId: number, type: string, bet: number, won: boolean, reward: number): Promise<Game> {
    const now = new Date();
    const id = this.currentGameId++;
    const game: Game = {
      id,
      userId,
      type,
      bet,
      won,
      reward,
      playedAt: now,
    };
    
    this.games.push(game);
    
    // Update user stats
    const user = this.users.get(userId);
    if (user) {
      user.totalGamesPlayed += 1;
      
      // ثبت تراکنش برای بازی
      if (!user.transactions) user.transactions = [];
      
      if (won) {
        user.totalGamesWon += 1;
        user.wallet += reward;
        
        // ثبت برد در بازی
        user.transactions.push({
          type: 'game_win',
          amount: reward,
          fee: 0,
          timestamp: now,
          gameType: type
        });
      } else {
        // ثبت باخت در بازی
        user.transactions.push({
          type: 'game_loss',
          amount: bet,
          fee: 0,
          timestamp: now,
          gameType: type
        });
      }
    }
    
    return game;
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return this.games.filter(game => game.userId === userId);
  }

  // Quest operations
  async getAllQuests(): Promise<Quest[]> {
    return Array.from(this.quests.values());
  }

  async getQuest(id: number): Promise<Quest | undefined> {
    return this.quests.get(id);
  }

  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const id = this.currentQuestId++;
    const quest: Quest = {
      id,
      title: insertQuest.title,
      description: insertQuest.description,
      type: insertQuest.type,
      requirement: insertQuest.requirement,
      targetAmount: insertQuest.targetAmount,
      reward: insertQuest.reward,
      category: insertQuest.category || "general", // استفاده از مقدار پیش‌فرض اگر مقداری ارائه نشده باشد
      active: true,
    };
    
    this.quests.set(id, quest);
    return quest;
  }
  
  async updateQuest(id: number, updates: Partial<Quest>): Promise<Quest | undefined> {
    const quest = this.quests.get(id);
    if (!quest) return undefined;
    
    // به‌روزرسانی ماموریت با مقادیر جدید
    const updatedQuest = { ...quest, ...updates };
    this.quests.set(id, updatedQuest);
    
    return updatedQuest;
  }

  async getUserQuests(userId: number): Promise<{quest: Quest, userQuest: UserQuest}[]> {
    const userQuestsArray = this.userQuests.get(userId) || [];
    const result: {quest: Quest, userQuest: UserQuest}[] = [];
    
    for (const userQuest of userQuestsArray) {
      const quest = this.quests.get(userQuest.questId);
      if (quest) {
        result.push({ quest, userQuest });
      }
    }
    
    // If user doesn't have all active quests, add them
    const allQuests = await this.getAllQuests();
    for (const quest of allQuests) {
      if (quest.active && !result.some(q => q.quest.id === quest.id)) {
        // Create new user quest
        const userQuest: UserQuest = {
          id: this.currentUserQuestId++,
          userId,
          questId: quest.id,
          progress: 0,
          completed: false,
          updatedAt: new Date(),
        };
        
        // Add to user quests
        const userQuestsArray = this.userQuests.get(userId) || [];
        userQuestsArray.push(userQuest);
        this.userQuests.set(userId, userQuestsArray);
        
        result.push({ quest, userQuest });
      }
    }
    
    return result;
  }

  async updateQuestProgress(userId: number, questId: number, progress: number): Promise<boolean> {
    const userQuestsArray = this.userQuests.get(userId) || [];
    let userQuest = userQuestsArray.find(q => q.questId === questId);
    
    if (!userQuest) {
      // Create new user quest if it doesn't exist
      const quest = this.quests.get(questId);
      if (!quest) return false;
      
      userQuest = {
        id: this.currentUserQuestId++,
        userId,
        questId,
        progress: 0,
        completed: false,
        updatedAt: new Date(),
      };
      
      userQuestsArray.push(userQuest);
      this.userQuests.set(userId, userQuestsArray);
    }
    
    userQuest.progress = progress;
    
    // Check if quest is completed
    const quest = this.quests.get(questId);
    if (quest && progress >= quest.targetAmount) {
      userQuest.completed = true;
      
      // Add reward to user's wallet
      const user = this.users.get(userId);
      if (user) {
        user.wallet += quest.reward;
        
        // ثبت پاداش کوئست در تراکنش‌ها
        if (!user.transactions) user.transactions = [];
        user.transactions.push({
          type: 'quest_reward',
          amount: quest.reward,
          fee: 0,
          timestamp: new Date(),
          questId: questId
        });
      }
    }
    
    userQuest.updatedAt = new Date();
    return true;
  }

  // Clan operations
  async getAllClans(): Promise<Clan[]> {
    return Array.from(this.clans.values());
  }

  async getClan(id: number): Promise<Clan | undefined> {
    return this.clans.get(id);
  }

  async createClan(insertClan: InsertClan): Promise<Clan> {
    const id = this.currentClanId++;
    const clan: Clan = {
      id,
      name: insertClan.name,
      description: insertClan.description || null,
      ownerId: insertClan.ownerId,
      bank: 0,
      level: 1,
      memberCount: 1,
      createdAt: new Date(),
    };
    
    this.clans.set(id, clan);
    return clan;
  }

  async getClanByName(name: string): Promise<Clan | undefined> {
    for (const clan of this.clans.values()) {
      if (clan.name.toLowerCase() === name.toLowerCase()) {
        return clan;
      }
    }
    return undefined;
  }

  async addUserToClan(userId: number, clanId: number): Promise<boolean> {
    const user = this.users.get(userId);
    const clan = this.clans.get(clanId);
    
    if (!user || !clan) return false;
    
    // Remove from current clan if any
    if (user.clanId) {
      const currentClan = this.clans.get(user.clanId);
      if (currentClan) {
        currentClan.memberCount -= 1;
      }
    }
    
    user.clanId = clanId;
    clan.memberCount += 1;
    return true;
  }

  async removeUserFromClan(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.clanId) return false;
    
    const clan = this.clans.get(user.clanId);
    if (clan) {
      clan.memberCount -= 1;
    }
    
    user.clanId = null;
    return true;
  }
  
  async updateClan(id: number, updates: Partial<Clan>): Promise<Clan | undefined> {
    const clan = this.clans.get(id);
    if (!clan) return undefined;
    
    // Update the clan with the provided updates
    const updatedClan = { ...clan, ...updates };
    this.clans.set(id, updatedClan);
    
    return updatedClan;
  }

  // Achievement operations
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  // Stock market operations
  async getAllStocks(): Promise<StockData[]> {
    return Array.from(this.stocks.values());
  }
  
  async getUserStocks(userId: number): Promise<UserStockData[]> {
    return this.userStocks.get(userId) || [];
  }
  
  async getStockById(stockId: number): Promise<StockData | null> {
    const stock = this.stocks.get(stockId);
    return stock || null;
  }
  
  async updateStockPrice(stockId: number, newPrice: number): Promise<boolean> {
    const stock = this.stocks.get(stockId);
    if (!stock) return false;
    
    // نگهداری قیمت قبلی قبل از به‌روزرسانی
    const oldPrice = stock.currentPrice;
    stock.previousPrice = oldPrice;
    stock.currentPrice = newPrice;
    stock.updatedAt = new Date();
    
    // به‌روزرسانی تاریخچه قیمت (اگر موجود باشد)
    if (!stock.priceHistory) {
      stock.priceHistory = [];
    }
    
    // افزودن قیمت جدید به تاریخچه
    const priceHistoryEntry = {
      timestamp: new Date().toISOString(),
      price: newPrice
    };
    
    // افزودن به ابتدای آرایه برای دسترسی سریع‌تر به موارد جدید
    stock.priceHistory.unshift(priceHistoryEntry);
    
    // محدود کردن تعداد رکوردهای تاریخچه به 30 مورد
    if (stock.priceHistory.length > 30) {
      stock.priceHistory = stock.priceHistory.slice(0, 30);
    }
    
    this.stocks.set(stockId, stock);
    return true;
  }
  
  async addStockNews(stockId: number, news: StockNews): Promise<boolean> {
    const stock = this.stocks.get(stockId);
    if (!stock) return false;
    
    // ساخت آرایه اخبار اگر وجود نداشت
    if (!stock.news) {
      stock.news = [];
    }
    
    // افزودن خبر جدید به آرایه اخبار
    stock.news.unshift(news);
    
    // محدود کردن تعداد اخبار به 10 مورد
    if (stock.news.length > 10) {
      stock.news = stock.news.slice(0, 10);
    }
    
    this.stocks.set(stockId, stock);
    return true;
  }
  
  async getStockNews(stockId: number, limit: number = 5): Promise<StockNews[]> {
    const stock = this.stocks.get(stockId);
    if (!stock || !stock.news) return [];
    
    // برگرداندن آخرین اخبار با محدودیت تعداد
    return stock.news.slice(0, limit);
  }
  
  async getStockPriceHistory(stockId: number, limit: number = 30): Promise<StockPriceHistory[]> {
    const stock = this.stocks.get(stockId);
    if (!stock || !stock.priceHistory) return [];
    
    // تبدیل تاریخچه قیمت به فرمت مورد نظر
    const priceHistory: StockPriceHistory[] = stock.priceHistory.map(item => ({
      price: item.price,
      timestamp: new Date(item.timestamp)
    }));
    
    // برگرداندن تاریخچه قیمت با محدودیت تعداد
    return priceHistory.slice(0, limit);
  }

  async getUserAchievements(userId: number): Promise<{achievement: Achievement, userAchievement: UserAchievement}[]> {
    const userAchievementsArray = this.userAchievements.get(userId) || [];
    const result: {achievement: Achievement, userAchievement: UserAchievement}[] = [];
    
    for (const userAchievement of userAchievementsArray) {
      const achievement = this.achievements.get(userAchievement.achievementId);
      if (achievement) {
        result.push({ achievement, userAchievement });
      }
    }
    
    // If user doesn't have all achievements, add them
    const allAchievements = await this.getAllAchievements();
    for (const achievement of allAchievements) {
      if (!result.some(a => a.achievement.id === achievement.id)) {
        // Create new user achievement
        const userAchievement: UserAchievement = {
          id: this.currentUserAchievementId++,
          userId,
          achievementId: achievement.id,
          progress: 0,
          completed: false,
          updatedAt: new Date(),
        };
        
        // Add to user achievements
        const userAchievementsArray = this.userAchievements.get(userId) || [];
        userAchievementsArray.push(userAchievement);
        this.userAchievements.set(userId, userAchievementsArray);
        
        result.push({ achievement, userAchievement });
      }
    }
    
    return result;
  }

  async updateAchievementProgress(userId: number, achievementId: number, progress: number): Promise<boolean> {
    const userAchievementsArray = this.userAchievements.get(userId) || [];
    let userAchievement = userAchievementsArray.find(a => a.achievementId === achievementId);
    
    if (!userAchievement) {
      // Create new user achievement if it doesn't exist
      const achievement = this.achievements.get(achievementId);
      if (!achievement) return false;
      
      userAchievement = {
        id: this.currentUserAchievementId++,
        userId,
        achievementId,
        progress: 0,
        completed: false,
        updatedAt: new Date(),
      };
      
      userAchievementsArray.push(userAchievement);
      this.userAchievements.set(userId, userAchievementsArray);
    }
    
    userAchievement.progress = progress;
    
    // Check if achievement is completed
    const achievement = this.achievements.get(achievementId);
    if (achievement && progress >= achievement.targetAmount && !userAchievement.completed) {
      userAchievement.completed = true;
      
      // Add reward to user's wallet
      const user = this.users.get(userId);
      if (user) {
        user.wallet += achievement.reward;
        
        // ثبت پاداش دستاورد در تراکنش‌ها
        if (!user.transactions) user.transactions = [];
        user.transactions.push({
          type: 'quest_reward', // استفاده از همان نوع کوئست
          amount: achievement.reward,
          fee: 0,
          timestamp: new Date(),
          questId: achievementId // استفاده از شناسه دستاورد
        });
      }
    }
    
    userAchievement.updatedAt = new Date();
    return true;
  }

  // Stock market operations
  async getAllStocks(): Promise<StockData[]> {
    return Array.from(this.stocks.values());
  }

  async getStock(id: number): Promise<StockData | undefined> {
    return this.stocks.get(id);
  }

  async createStock(insertStock: InsertStock): Promise<StockData> {
    const id = this.currentStockId++;
    const now = new Date();
    
    const stock: StockData = {
      id,
      symbol: insertStock.symbol,
      name: insertStock.name,
      description: insertStock.description,
      currentPrice: insertStock.currentPrice,
      previousPrice: insertStock.previousPrice,
      priceHistory: [{
        timestamp: now.toISOString(),
        price: insertStock.currentPrice
      }],
      volatility: insertStock.volatility,
      trend: insertStock.trend,
      sector: insertStock.sector,
      totalShares: insertStock.totalShares,
      availableShares: insertStock.availableShares,
      updatedAt: now
    };
    
    this.stocks.set(id, stock);
    return stock;
  }
  
  async updateStock(id: number, updates: Partial<StockData>): Promise<StockData | undefined> {
    const stock = this.stocks.get(id);
    if (!stock) return undefined;
    
    // If price is being updated, record it in price history
    if (updates.currentPrice && updates.currentPrice !== stock.currentPrice) {
      if (!stock.priceHistory) stock.priceHistory = [];
      stock.priceHistory.push({
        timestamp: new Date().toISOString(),
        price: updates.currentPrice
      });
      
      // Keep only last 30 price records
      if (stock.priceHistory.length > 30) {
        stock.priceHistory = stock.priceHistory.slice(-30);
      }
      
      // Update previous price
      updates.previousPrice = stock.currentPrice;
    }
    
    const updatedStock = { ...stock, ...updates, updatedAt: new Date() };
    this.stocks.set(id, updatedStock);
    return updatedStock;
  }
  
  async getUserStocks(userId: number): Promise<UserStockData[]> {
    const userStockList = this.userStocks.get(userId) || [];
    return userStockList;
  }
  
  async buyStock(userId: number, stockId: number, quantity: number): Promise<boolean> {
    const user = this.users.get(userId);
    const stock = this.stocks.get(stockId);
    
    // Validate all parameters
    if (!user || !stock || quantity <= 0 || isNaN(quantity)) return false;
    
    // Check if enough shares are available
    if (stock.availableShares < quantity) return false;
    
    // Calculate total cost
    const totalCost = Math.ceil(stock.currentPrice * quantity);
    
    // Check if user has enough money
    if (user.wallet < totalCost) return false;
    
    // Create user stock record
    const userStockId = this.currentUserStockId++;
    const now = new Date();
    
    const userStock: UserStockData = {
      id: userStockId,
      userId,
      stockId,
      quantity,
      purchasePrice: stock.currentPrice,
      purchaseDate: now
    };
    
    // Get existing user stocks
    if (!this.userStocks.has(userId)) {
      this.userStocks.set(userId, []);
    }
    
    // Add to user stocks
    const userStocks = this.userStocks.get(userId)!;
    userStocks.push(userStock);
    
    // Update user's stocks array in user object
    if (!user.stocks) user.stocks = [];
    user.stocks.push({
      stockId: stockId.toString(),
      quantity,
      purchasePrice: stock.currentPrice,
      purchaseDate: now.toISOString()
    });
    
    // Update stock available shares
    stock.availableShares -= quantity;
    
    // Deduct money from wallet
    user.wallet -= totalCost;
    
    // Record transaction
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: 'stock_buy',
      amount: totalCost,
      fee: 0,
      timestamp: now,
      stockId,
      stockSymbol: stock.symbol,
      quantity
    });
    
    return true;
  }
  
  async sellStock(userId: number, stockId: number, quantity: number): Promise<boolean> {
    const user = this.users.get(userId);
    const stock = this.stocks.get(stockId);
    
    // Validate all parameters
    if (!user || !stock || quantity <= 0 || isNaN(quantity)) return false;
    
    // Get user's stocks
    const userStocks = user.stocks || [];
    
    // Find the stock in user's portfolio
    const userStockIndex = userStocks.findIndex(s => s.stockId === stockId.toString());
    if (userStockIndex === -1 || userStocks[userStockIndex].quantity < quantity) {
      return false; // User doesn't have enough of this stock
    }
    
    // Calculate total sale value
    const totalValue = Math.floor(stock.currentPrice * quantity);
    
    // Update user's wallet
    user.wallet += totalValue;
    
    // Update user's stocks
    if (userStocks[userStockIndex].quantity === quantity) {
      // Remove if selling all
      userStocks.splice(userStockIndex, 1);
    } else {
      // Reduce quantity
      userStocks[userStockIndex].quantity -= quantity;
    }
    
    // Update stock available shares
    stock.availableShares += quantity;
    
    // Update userStocks Map
    const userStockList = this.userStocks.get(userId) || [];
    const stockEntryIndex = userStockList.findIndex(s => s.stockId === stockId);
    
    if (stockEntryIndex !== -1) {
      if (userStockList[stockEntryIndex].quantity === quantity) {
        userStockList.splice(stockEntryIndex, 1);
      } else {
        userStockList[stockEntryIndex].quantity -= quantity;
      }
    }
    
    // Record transaction
    const now = new Date();
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: 'stock_sell',
      amount: totalValue,
      fee: 0,
      timestamp: now,
      stockId,
      stockSymbol: stock.symbol,
      quantity
    });
    
    return true;
  }
  
  async updateStockPrices(): Promise<void> {
    const now = new Date();
    
    for (const stock of this.stocks.values()) {
      // Calculate price change percent based on volatility and trend
      // Volatility 1-10, trend -5 to +5
      const volatilityFactor = stock.volatility / 10; // 0.1 to 1
      const trendInfluence = stock.trend / 10; // -0.5 to +0.5
      
      // Random factor -1 to +1
      const randomFactor = (Math.random() * 2) - 1;
      
      // Max percent change (weighted by volatility)
      const maxPercentChange = 0.05 * volatilityFactor; // 0.5% to 5%
      
      // Calculate percent change (random with trend bias)
      const percentChange = ((randomFactor + trendInfluence) * maxPercentChange);
      
      // Calculate new price
      let newPrice = stock.currentPrice * (1 + percentChange);
      
      // Ensure minimum price is 0.01
      newPrice = Math.max(0.01, newPrice);
      
      // Round to 2 decimal places
      newPrice = Math.round(newPrice * 100) / 100;
      
      // Update stock
      this.updateStock(stock.id, {
        previousPrice: stock.currentPrice,
        currentPrice: newPrice
      });
    }
  }
  
  async payDividends(): Promise<void> {
    const now = new Date();
    
    // Only pay dividends to 'finance' sector stocks with positive trend
    const eligibleStocks = Array.from(this.stocks.values())
      .filter(stock => stock.sector === 'finance' && stock.trend > 0);
    
    if (eligibleStocks.length === 0) return;
    
    // Get all users who own stocks
    for (const [userId, userStockList] of this.userStocks.entries()) {
      const user = this.users.get(userId);
      if (!user) continue;
      
      let totalDividends = 0;
      
      // Calculate dividends for each eligible stock
      for (const userStock of userStockList) {
        const stock = this.stocks.get(userStock.stockId);
        
        if (!stock || !eligibleStocks.includes(stock)) continue;
        
        // Calculate dividend as 0.5% to 2% of stock value based on trend
        const dividendRate = 0.005 + (stock.trend / 100); // 0.5% to 2%
        const stockValue = stock.currentPrice * userStock.quantity;
        const dividend = Math.floor(stockValue * dividendRate);
        
        if (dividend <= 0) continue;
        
        totalDividends += dividend;
        
        // Record individual stock transaction
        if (!user.transactions) user.transactions = [];
        user.transactions.push({
          type: 'stock_dividend',
          amount: dividend,
          fee: 0,
          timestamp: now,
          stockId: stock.id,
          stockSymbol: stock.symbol
        });
      }
      
      // Add dividends to user's bank account
      if (totalDividends > 0) {
        user.bank += totalDividends;
        user.lastDividendPayout = now;
      }
    }
  }
  
  // Lottery operations
  async getAllLotteries(): Promise<LotteryData[]> {
    return Array.from(this.lotteries.values());
  }
  
  async getLottery(id: number): Promise<LotteryData | undefined> {
    return this.lotteries.get(id);
  }
  
  async createLottery(insertLottery: InsertLottery): Promise<LotteryData> {
    const id = this.currentLotteryId++;
    
    const lottery: LotteryData = {
      id,
      name: insertLottery.name,
      description: insertLottery.description,
      ticketPrice: insertLottery.ticketPrice,
      jackpot: insertLottery.jackpot,
      startTime: insertLottery.startTime,
      endTime: insertLottery.endTime,
      winnerId: null,
      status: 'active',
      participants: []
    };
    
    this.lotteries.set(id, lottery);
    return lottery;
  }
  
  async buyLotteryTicket(userId: number, lotteryId: number, quantity: number): Promise<boolean> {
    const user = this.users.get(userId);
    const lottery = this.lotteries.get(lotteryId);
    
    // Validate parameters
    if (!user || !lottery || quantity <= 0 || isNaN(quantity)) return false;
    
    // Check if lottery is active and not expired
    if (lottery.status !== 'active' || new Date(lottery.endTime) < new Date()) {
      return false;
    }
    
    // Calculate total cost
    const totalCost = lottery.ticketPrice * quantity;
    
    // Check if user has enough money
    if (user.wallet < totalCost) return false;
    
    // Update user's wallet
    user.wallet -= totalCost;
    
    // Add to jackpot
    lottery.jackpot += Math.floor(totalCost * 0.8); // 80% goes to jackpot
    
    // Check if user already has tickets
    const participantIndex = lottery.participants.findIndex(p => p.userId === userId);
    if (participantIndex !== -1) {
      // Add to existing tickets
      lottery.participants[participantIndex].ticketCount += quantity;
    } else {
      // Add new participant
      lottery.participants.push({
        userId,
        ticketCount: quantity
      });
    }
    
    // Add to user's lottery tickets
    if (!user.lotteryTickets) user.lotteryTickets = [];
    
    const existingTicketIndex = user.lotteryTickets.findIndex(t => t.lotteryId === lotteryId.toString());
    if (existingTicketIndex !== -1) {
      // Add to existing tickets
      user.lotteryTickets[existingTicketIndex].tickets += quantity;
    } else {
      // Add new lottery entry
      user.lotteryTickets.push({
        lotteryId: lotteryId.toString(),
        tickets: quantity,
        purchaseDate: new Date().toISOString()
      });
    }
    
    // Record transaction
    const now = new Date();
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: 'lottery_ticket',
      amount: totalCost,
      fee: 0,
      timestamp: now,
      lotteryId,
      lotteryName: lottery.name,
      quantity
    });
    
    return true;
  }
  
  async drawLotteryWinner(lotteryId: number): Promise<number | undefined> {
    const lottery = this.lotteries.get(lotteryId);
    
    // Validate lottery exists and is active
    if (!lottery || lottery.status !== 'active') return undefined;
    
    // Check if lottery has participants
    if (lottery.participants.length === 0) return undefined;
    
    // Calculate total tickets
    let totalTickets = 0;
    for (const participant of lottery.participants) {
      totalTickets += participant.ticketCount;
    }
    
    // Generate random ticket number
    const winningTicket = Math.floor(Math.random() * totalTickets) + 1;
    
    // Find which participant has the winning ticket
    let ticketCounter = 0;
    for (const participant of lottery.participants) {
      ticketCounter += participant.ticketCount;
      if (ticketCounter >= winningTicket) {
        // Found winner
        lottery.winnerId = participant.userId;
        return participant.userId;
      }
    }
    
    return undefined; // Should never reach here
  }
  
  async finishLottery(lotteryId: number): Promise<boolean> {
    const lottery = this.lotteries.get(lotteryId);
    
    // Validate lottery exists and is active
    if (!lottery || lottery.status !== 'active') return false;
    
    // If no winner drawn yet, draw one
    if (!lottery.winnerId) {
      const winnerId = await this.drawLotteryWinner(lotteryId);
      if (!winnerId) {
        // No participants, no winner
        lottery.status = 'completed';
        return true;
      }
    }
    
    // Get winner
    const winner = this.users.get(lottery.winnerId!);
    if (!winner) return false;
    
    // Award jackpot to winner
    winner.wallet += lottery.jackpot;
    
    // Record transaction
    const now = new Date();
    if (!winner.transactions) winner.transactions = [];
    winner.transactions.push({
      type: 'lottery_win',
      amount: lottery.jackpot,
      fee: 0,
      timestamp: now,
      lotteryId,
      lotteryName: lottery.name
    });
    
    // Mark lottery as completed
    lottery.status = 'completed';
    
    return true;
  }
  
  // Pet operations
  private pets: Map<string, Pet> = new Map();
  private currentPetId = 1;
  
  async getUserPets(userId: number): Promise<Pet[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    // اگر کاربر دارای فیلد pets نیست، آن را اضافه می‌کنیم
    if (!user.pets) {
      user.pets = [];
    }
    
    return user.pets;
  }
  
  async buyPet(userId: number, petType: string, petName: string): Promise<Pet | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    // بررسی اعتبار نوع پت
    if (!['dog', 'cat', 'rabbit', 'dragon', 'phoenix'].includes(petType)) {
      return null;
    }
    
    // محاسبه قیمت پت
    let price = 0;
    let useCrystals = false;
    
    switch (petType) {
      case 'dog':
      case 'cat':
      case 'rabbit':
        price = 2000; // قیمت به سکه
        break;
      case 'dragon':
      case 'phoenix':
        price = 50; // قیمت به کریستال
        useCrystals = true;
        break;
    }
    
    // بررسی کافی بودن موجودی
    if (useCrystals) {
      if (user.crystals < price) {
        return null;
      }
    } else {
      if (user.wallet < price) {
        return null;
      }
    }
    
    // ایجاد پت جدید
    const now = new Date();
    const petId = `pet_${this.currentPetId++}_${Date.now()}`;
    
    // مقادیر پایه توانایی‌ها بر اساس نوع پت
    const abilities: any = {};
    
    switch (petType) {
      case 'dog':
        abilities.economyBoost = 5; // افزایش 5% درآمد
        break;
      case 'cat':
        abilities.luckBoost = 5; // افزایش 5% شانس
        break;
      case 'rabbit':
        abilities.expBoost = 5; // افزایش 5% تجربه
        break;
      case 'dragon':
        abilities.economyBoost = 8; // افزایش 8% درآمد
        abilities.defenseBoost = 10; // کاهش 10% احتمال دزدی
        break;
      case 'phoenix':
        abilities.luckBoost = 8; // افزایش 8% شانس
        abilities.expBoost = 8; // افزایش 8% تجربه
        break;
    }
    
    const newPet: Pet = {
      id: petId,
      name: petName,
      type: petType as any, // تبدیل به نوع مناسب
      level: 1,
      experience: 0,
      happiness: 100,
      hunger: 0,
      health: 100,
      lastFed: now.toISOString(),
      lastPlayed: now.toISOString(),
      acquiredDate: now.toISOString(),
      abilities: abilities,
      equipment: {},
      stats: {
        gamesPlayed: 0,
        treats: 0,
        wins: 0
      },
      active: true // پت جدید به صورت پیش‌فرض فعال است
    };
    
    // بروزرسانی موجودی کاربر
    if (useCrystals) {
      user.crystals -= price;
    } else {
      user.wallet -= price;
    }
    
    // غیرفعال کردن همه پت‌های قبلی
    if (!user.pets) {
      user.pets = [];
    } else {
      user.pets.forEach(pet => {
        pet.active = false;
      });
    }
    
    // افزودن پت جدید
    user.pets.push(newPet);
    
    // ثبت تراکنش خرید
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: useCrystals ? 'item_purchase_crystal' : 'item_purchase',
      amount: price,
      fee: 0,
      timestamp: now,
      itemName: `${petName} (${petType})`,
    });
    
    return newPet;
  }
  
  async feedPet(userId: number, petId: string): Promise<Pet | null> {
    const user = this.users.get(userId);
    if (!user || !user.pets) return null;
    
    // یافتن پت
    const petIndex = user.pets.findIndex(p => p.id === petId);
    if (petIndex === -1) return null;
    
    // بررسی هزینه غذا (50 سکه)
    const foodCost = 50;
    if (user.wallet < foodCost) return null;
    
    // بروزرسانی مقادیر پت
    const pet = user.pets[petIndex];
    
    // کاهش گرسنگی (حداقل 0)
    pet.hunger = Math.max(0, pet.hunger - 30);
    
    // افزایش سلامتی (حداکثر 100)
    pet.health = Math.min(100, pet.health + 10);
    
    // افزایش خوشحالی (حداکثر 100)
    pet.happiness = Math.min(100, pet.happiness + 5);
    
    // بروزرسانی زمان آخرین غذا
    pet.lastFed = new Date().toISOString();
    
    // افزایش آمار تشویقی‌ها
    pet.stats.treats++;
    
    // کم کردن هزینه غذا
    user.wallet -= foodCost;
    
    // ثبت تراکنش
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: 'item_purchase',
      amount: foodCost,
      fee: 0,
      timestamp: new Date(),
      itemName: `غذای پت (${pet.name})`,
    });
    
    return pet;
  }
  
  async playWithPet(userId: number, petId: string): Promise<Pet | null> {
    const user = this.users.get(userId);
    if (!user || !user.pets) return null;
    
    // یافتن پت
    const petIndex = user.pets.findIndex(p => p.id === petId);
    if (petIndex === -1) return null;
    
    const pet = user.pets[petIndex];
    
    // افزایش خوشحالی (حداکثر 100)
    pet.happiness = Math.min(100, pet.happiness + 20);
    
    // افزایش گرسنگی (حداکثر 100)
    pet.hunger = Math.min(100, pet.hunger + 10);
    
    // افزایش تجربه
    pet.experience += 10;
    
    // بررسی ارتقاء سطح (هر 100 تجربه به ازای هر سطح)
    const experienceNeeded = pet.level * 100;
    if (pet.experience >= experienceNeeded) {
      pet.level++;
      pet.experience -= experienceNeeded;
      
      // افزایش توانایی‌ها با ارتقاء سطح
      if (pet.abilities.economyBoost) {
        pet.abilities.economyBoost += 1;
      }
      if (pet.abilities.luckBoost) {
        pet.abilities.luckBoost += 1;
      }
      if (pet.abilities.expBoost) {
        pet.abilities.expBoost += 1;
      }
      if (pet.abilities.defenseBoost) {
        pet.abilities.defenseBoost += 1;
      }
    }
    
    // بروزرسانی زمان آخرین بازی
    pet.lastPlayed = new Date().toISOString();
    
    // افزایش آمار بازی‌ها
    pet.stats.gamesPlayed++;
    
    return pet;
  }
  
  async activatePet(userId: number, petId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.pets) return false;
    
    // یافتن پت
    const petIndex = user.pets.findIndex(p => p.id === petId);
    if (petIndex === -1) return false;
    
    // غیرفعال کردن تمام پت‌ها
    user.pets.forEach(p => {
      p.active = false;
    });
    
    // فعال کردن پت انتخاب شده
    user.pets[petIndex].active = true;
    
    return true;
  }
  
  async renamePet(userId: number, petId: string, newName: string): Promise<Pet | null> {
    const user = this.users.get(userId);
    if (!user || !user.pets) return null;
    
    // بررسی اعتبار نام جدید
    if (!newName || newName.length < 2 || newName.length > 20) {
      return null;
    }
    
    // یافتن پت
    const petIndex = user.pets.findIndex(p => p.id === petId);
    if (petIndex === -1) return null;
    
    // تغییر نام پت
    user.pets[petIndex].name = newName;
    
    return user.pets[petIndex];
  }

  // Friends system methods
  async getFriends(userId: number): Promise<Friend[]> {
    const user = this.users.get(userId);
    if (!user || !user.friends) return [];
    return user.friends;
  }
  
  async getFriendship(userId: number, friendId: number): Promise<Friend | undefined> {
    const user = this.users.get(userId);
    if (!user || !user.friends) return undefined;
    
    // Find the friendship either by friendId as number or string (handles Discord IDs)
    return user.friends.find(f => 
      f.userId === friendId || 
      f.friendId === friendId || 
      f.friendId === String(friendId) || 
      Number(f.friendId) === friendId
    );
  }

  async getFriendRequests(userId: number): Promise<FriendRequest[]> {
    const user = this.users.get(userId);
    if (!user || !user.friendRequests) return [];
    
    // فیلتر کردن درخواست‌های مربوط به کاربر (دریافتی یا ارسالی)
    return user.friendRequests.filter(req => 
      req.toUserId === user.discordId || req.fromUserId === user.discordId
    );
  }
  
  async getPendingFriendRequest(fromUserId: number, toUserId: number): Promise<FriendRequest | undefined> {
    const fromUser = this.users.get(fromUserId);
    const toUser = this.users.get(toUserId);
    
    if (!fromUser || !toUser || !toUser.friendRequests) return undefined;
    
    // Find pending request between these two users
    return toUser.friendRequests.find(req => 
      req.fromUserId === fromUser.discordId && 
      req.toUserId === toUser.discordId && 
      req.status === 'pending'
    );
  }

  async sendFriendRequest(fromUserId: number, toUserId: number, message?: string): Promise<boolean> {
    const fromUser = this.users.get(fromUserId);
    const toUser = this.users.get(toUserId);
    
    if (!fromUser || !toUser) return false;
    
    // بررسی آیا قبلاً درخواست فرستاده شده
    if (!toUser.friendRequests) {
      toUser.friendRequests = [];
    }
    
    const existingRequest = toUser.friendRequests.find(req => 
      req.fromUserId === fromUser.discordId && req.toUserId === toUser.discordId && req.status === 'pending'
    );
    
    if (existingRequest) return false;
    
    // بررسی آیا از قبل دوست هستند
    if (toUser.friends && toUser.friends.some(f => f.friendId === fromUser.discordId)) {
      return false;
    }
    
    // ایجاد درخواست جدید
    const newRequest: FriendRequest = {
      fromUserId: fromUser.discordId,
      toUserId: toUser.discordId,
      status: 'pending',
      message: message,
      timestamp: new Date().toISOString()
    };
    
    // اضافه کردن درخواست به هر دو کاربر
    toUser.friendRequests.push(newRequest);
    
    if (!fromUser.friendRequests) {
      fromUser.friendRequests = [];
    }
    fromUser.friendRequests.push(newRequest);
    
    return true;
  }
  
  async createFriendRequest(fromUserId: number, toUserId: number, message?: string): Promise<boolean> {
    // This is essentially the same as sendFriendRequest
    return this.sendFriendRequest(fromUserId, toUserId, message);
  }

  async acceptFriendRequest(requestId: string): Promise<boolean> {
    // پیدا کردن درخواست با جستجو در تمام کاربران
    let request: FriendRequest | undefined;
    let fromUser: User | undefined;
    let toUser: User | undefined;
    
    for (const user of this.users.values()) {
      if (user.friendRequests) {
        const foundRequest = user.friendRequests.find(req => 
          `${req.fromUserId}_${req.toUserId}` === requestId && req.status === 'pending'
        );
        
        if (foundRequest) {
          request = foundRequest;
          
          // پیدا کردن کاربر فرستنده و گیرنده
          for (const u of this.users.values()) {
            if (u.discordId === request.fromUserId) {
              fromUser = u;
            } else if (u.discordId === request.toUserId) {
              toUser = u;
            }
            
            if (fromUser && toUser) break;
          }
          
          break;
        }
      }
    }
    
    if (!request || !fromUser || !toUser) return false;
    
    // بروزرسانی وضعیت درخواست
    request.status = 'accepted';
    
    // اضافه کردن دوست به هر دو کاربر
    const now = new Date().toISOString();
    
    if (!fromUser.friends) fromUser.friends = [];
    if (!toUser.friends) toUser.friends = [];
    
    fromUser.friends.push({
      friendId: toUser.discordId,
      friendshipLevel: 1,
      friendshipXP: 0,
      addedAt: now,
      lastInteraction: now,
      favoriteStatus: false,
      isBestFriend: false
    });
    
    toUser.friends.push({
      friendId: fromUser.discordId,
      friendshipLevel: 1,
      friendshipXP: 0,
      addedAt: now,
      lastInteraction: now,
      favoriteStatus: false,
      isBestFriend: false
    });
    
    return true;
  }

  async rejectFriendRequest(requestId: string): Promise<boolean> {
    // جستجو در تمام کاربران برای یافتن درخواست
    for (const user of this.users.values()) {
      if (user.friendRequests) {
        const requestIndex = user.friendRequests.findIndex(req => 
          `${req.fromUserId}_${req.toUserId}` === requestId && req.status === 'pending'
        );
        
        if (requestIndex >= 0) {
          // تغییر وضعیت به رد شده
          user.friendRequests[requestIndex].status = 'rejected';
          
          // یافتن کاربر دیگر و بروزرسانی درخواست در آنجا هم
          const req = user.friendRequests[requestIndex];
          for (const otherUser of this.users.values()) {
            if (otherUser.friendRequests && otherUser.discordId !== user.discordId) {
              const otherRequestIndex = otherUser.friendRequests.findIndex(r => 
                r.fromUserId === req.fromUserId && r.toUserId === req.toUserId
              );
              
              if (otherRequestIndex >= 0) {
                otherUser.friendRequests[otherRequestIndex].status = 'rejected';
                return true;
              }
            }
          }
          
          return true;
        }
      }
    }
    
    return false;
  }

  async removeFriend(userId: number, friendId: number): Promise<boolean> {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    
    if (!user || !friend || !user.friends || !friend.friends) return false;
    
    // حذف دوست از لیست کاربر
    const userFriendIndex = user.friends.findIndex(f => f.friendId === friend.discordId);
    if (userFriendIndex >= 0) {
      user.friends.splice(userFriendIndex, 1);
    }
    
    // حذف کاربر از لیست دوست
    const friendUserIndex = friend.friends.findIndex(f => f.friendId === user.discordId);
    if (friendUserIndex >= 0) {
      friend.friends.splice(friendUserIndex, 1);
    }
    
    return userFriendIndex >= 0 || friendUserIndex >= 0;
  }

  async getFriendshipLevel(userId: number, friendId: number): Promise<number> {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    
    if (!user || !friend || !user.friends) return 0;
    
    const friendship = user.friends.find(f => f.friendId === friend.discordId);
    return friendship ? friendship.friendshipLevel : 0;
  }

  async updateFriendshipXP(userId: number, friendId: string, xp: number): Promise<{ leveledUp: boolean, newLevel?: number }> {
    const user = this.users.get(userId);
    // تبدیل friendId از string به number برای پیدا کردن کاربر
    let friendObject: User | undefined;
    
    // تلاش برای پیدا کردن کاربر با discordId یا با id
    for (const u of this.users.values()) {
      if (u.discordId === friendId || u.id.toString() === friendId) {
        friendObject = u;
        break;
      }
    }
    
    if (!user || !friendObject || !user.friends) {
      return { leveledUp: false };
    }
    
    const friendshipIndex = user.friends.findIndex(f => f.friendId === friendObject!.discordId);
    if (friendshipIndex < 0) {
      return { leveledUp: false };
    }
    
    const friendship = user.friends[friendshipIndex];
    
    // افزایش XP
    friendship.friendshipXP += xp;
    friendship.lastInteraction = new Date().toISOString();
    
    // بررسی ارتقای سطح
    const oldLevel = friendship.friendshipLevel;
    let newLevel = oldLevel;
    
    if (friendship.friendshipXP >= 5000) {
      newLevel = 5; // استاد دوستی
    } else if (friendship.friendshipXP >= 2000) {
      newLevel = 4; // حرفه‌ای
    } else if (friendship.friendshipXP >= 1000) {
      newLevel = 3; // پیشرفته
    } else if (friendship.friendshipXP >= 500) {
      newLevel = 2; // متوسط
    } else {
      newLevel = 1; // مبتدی
    }
    
    // اعمال سطح جدید
    friendship.friendshipLevel = newLevel;
    
    // بروزرسانی دوستی در لیست دوست هم
    if (friendObject.friends) {
      const reverseFriendshipIndex = friendObject.friends.findIndex(f => f.friendId === user.discordId);
      if (reverseFriendshipIndex >= 0) {
        friendObject.friends[reverseFriendshipIndex].friendshipXP = friendship.friendshipXP;
        friendObject.friends[reverseFriendshipIndex].friendshipLevel = newLevel;
        friendObject.friends[reverseFriendshipIndex].lastInteraction = friendship.lastInteraction;
      }
    }
    
    const leveledUp = newLevel > oldLevel;
    return { 
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined
    };
  }

  /**
   * بروزرسانی وضعیت دوستی بین دو کاربر
   * @param userId شناسه کاربر
   * @param friendId شناسه دوست (به صورت رشته - می‌تواند شناسه دیسکورد یا شناسه عددی کاربر باشد)
   * @param updates تغییراتی که باید در وضعیت دوستی اعمال شود
   * @returns آیا عملیات موفق بوده است
   */
  async updateFriendshipStatus(userId: number, friendId: string, updates: Partial<Friend>): Promise<boolean> {
    const user = this.users.get(userId);
    // یافتن کاربر دوست با شناسه دیسکورد یا شناسه عددی
    let friendObject: User | undefined;
    
    for (const u of this.users.values()) {
      if (u.discordId === friendId || u.id.toString() === friendId) {
        friendObject = u;
        break;
      }
    }
    
    if (!user || !friendObject || !user.friends) {
      return false;
    }
    
    // یافتن ایندکس دوستی در لیست دوستان کاربر
    const friendshipIndex = user.friends.findIndex(f => f.friendId === friendObject!.discordId);
    if (friendshipIndex < 0) {
      return false;
    }
    
    // اعمال تغییرات به دوستی
    user.friends[friendshipIndex] = {
      ...user.friends[friendshipIndex],
      ...updates,
      lastInteraction: new Date().toISOString() // به‌روزرسانی زمان آخرین تعامل
    };
    
    // اگر وضعیت متقابل هم نیاز به به‌روزرسانی دارد
    if (updates.isBestFriend !== undefined && friendObject.friends) {
      // در صورتی که وضعیت بهترین دوست تغییر کرده باشد
      const reverseFriendshipIndex = friendObject.friends.findIndex(f => f.friendId === user.discordId);
      if (reverseFriendshipIndex >= 0) {
        // اگر کاربر این دوست را به عنوان بهترین دوست انتخاب کرده، دوست هم باید مطلع شود
        // اما ما وضعیت بهترین دوست را در طرف مقابل تغییر نمی‌دهیم
        friendObject.friends[reverseFriendshipIndex].lastInteraction = new Date().toISOString();
      }
    }
    
    return true;
  }

  // Private & Anonymous Chat operations
  async getPrivateChats(userId: number): Promise<PrivateChat[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    const result: PrivateChat[] = [];
    for (const chat of this.privateChats.values()) {
      if (chat.participants.includes(user.discordId)) {
        result.push(chat);
      }
    }
    
    return result;
  }

  async getPrivateChat(chatId: string): Promise<PrivateChat | undefined> {
    return this.privateChats.get(chatId);
  }

  async createPrivateChat(user1Id: number, user2Id: number): Promise<PrivateChat> {
    const user1 = this.users.get(user1Id);
    const user2 = this.users.get(user2Id);
    
    if (!user1 || !user2) {
      throw new Error("One or both users not found");
    }
    
    // بررسی آیا چت قبلی وجود دارد
    for (const chat of this.privateChats.values()) {
      if (
        chat.participants.includes(user1.discordId) && 
        chat.participants.includes(user2.discordId)
      ) {
        return chat;
      }
    }
    
    // ایجاد چت جدید
    const chatId = `private_${user1.discordId}_${user2.discordId}_${Date.now()}`;
    const now = new Date().toISOString();
    
    const newChat: PrivateChat = {
      chatId,
      participants: [user1.discordId, user2.discordId],
      messages: [],
      createdAt: now,
      lastActivityAt: now
    };
    
    this.privateChats.set(chatId, newChat);
    return newChat;
  }

  async addPrivateMessage(chatId: string, senderId: number, content: string): Promise<boolean> {
    const chat = this.privateChats.get(chatId);
    const sender = this.users.get(senderId);
    
    if (!chat || !sender || !chat.participants.includes(sender.discordId)) {
      return false;
    }
    
    // افزودن پیام جدید
    const newMessage: PrivateMessage = {
      senderId: sender.discordId,
      content,
      timestamp: new Date().toISOString()
    };
    
    chat.messages.push(newMessage);
    chat.lastActivityAt = newMessage.timestamp;
    
    // ذخیره بروزرسانی
    this.privateChats.set(chatId, chat);
    
    return true;
  }

  async markMessagesAsRead(chatId: string, userId: number): Promise<boolean> {
    const chat = this.privateChats.get(chatId);
    const user = this.users.get(userId);
    
    if (!chat || !user || !chat.participants.includes(user.discordId)) {
      return false;
    }
    
    const now = new Date().toISOString();
    
    // علامت‌گذاری تمام پیام‌های خوانده نشده
    for (const message of chat.messages) {
      if (
        message.senderId !== user.discordId && // پیام از فرد دیگر است
        !message.readAt // هنوز خوانده نشده
      ) {
        message.readAt = now;
      }
    }
    
    // ذخیره بروزرسانی
    this.privateChats.set(chatId, chat);
    
    return true;
  }

  // Blocked users operations
  async getBlockedUsers(userId: number): Promise<BlockedUser[]> {
    const user = this.users.get(userId);
    if (!user || !user.blockedUsers) return [];
    
    return user.blockedUsers;
  }

  async blockUser(userId: number, blockedUserId: number, reason?: string): Promise<boolean> {
    const user = this.users.get(userId);
    const blockedUser = this.users.get(blockedUserId);
    
    if (!user || !blockedUser) return false;
    
    // اطمینان از وجود آرایه blockedUsers
    if (!user.blockedUsers) {
      user.blockedUsers = [];
    }
    
    // بررسی آیا قبلاً بلاک شده
    if (user.blockedUsers.some(b => b.userId === blockedUser.discordId)) {
      return false;
    }
    
    // افزودن به لیست بلاک
    user.blockedUsers.push({
      userId: blockedUser.discordId,
      reason,
      timestamp: new Date().toISOString()
    });
    
    return true;
  }

  async unblockUser(userId: number, blockedUserId: string | number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.blockedUsers) return false;
    
    // اگر شناسه به صورت عددی باشد، کاربر را پیدا کن
    if (typeof blockedUserId === 'number') {
      const blockedUser = this.users.get(blockedUserId);
      if (!blockedUser) return false;
      blockedUserId = blockedUser.discordId;
    }
    
    // حالا که شناسه دیسکورد را داریم، رفع مسدودیت را انجام می‌دهیم
    const index = user.blockedUsers.findIndex(b => b.userId === blockedUserId);
    if (index < 0) return false;
    
    user.blockedUsers.splice(index, 1);
    return true;
  }
  
  async unblockAllUsers(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // بررسی می‌کنیم آیا کاربر لیست مسدودی دارد
    if (!user.blockedUsers || user.blockedUsers.length === 0) return true;
    
    // همه کاربران مسدود شده را حذف می‌کنیم
    user.blockedUsers = [];
    return true;
  }

  async isUserBlocked(userId: number, blockedUserId: number): Promise<boolean> {
    const user = this.users.get(userId);
    const blockedUser = this.users.get(blockedUserId);
    
    if (!user || !blockedUser || !user.blockedUsers) return false;
    
    return user.blockedUsers.some(b => b.userId === blockedUser.discordId);
  }

  // User interests operations
  async getUserInterests(userId: number): Promise<UserInterests | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    return user.interests;
  }

  async updateUserInterests(userId: number, interests: Partial<UserInterests>): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // اطمینان از وجود فیلد interests
    if (!user.interests) {
      user.interests = {
        games: [],
        activities: [],
        topics: [],
        updatedAt: new Date().toISOString()
      };
    }
    
    // بروزرسانی فیلدها
    if (interests.games) user.interests.games = interests.games;
    if (interests.activities) user.interests.activities = interests.activities;
    if (interests.topics) user.interests.topics = interests.topics;
    
    user.interests.updatedAt = new Date().toISOString();
    
    return true;
  }

  async findSimilarUsers(userId: number, limit: number = 5): Promise<User[]> {
    const user = this.users.get(userId);
    if (!user || !user.interests) return [];
    
    const userInterests = user.interests;
    const similarUsers: {user: User, score: number}[] = [];
    
    // محاسبه امتیاز شباهت برای تمام کاربران
    for (const otherUser of this.users.values()) {
      if (
        otherUser.id === user.id || // خود کاربر نباشد
        !otherUser.interests // علایق تعریف نشده باشد
      ) {
        continue;
      }
      
      let score = 0;
      
      // محاسبه اشتراک در بازی‌ها
      for (const game of userInterests.games) {
        if (otherUser.interests.games.includes(game)) {
          score += 3;
        }
      }
      
      // محاسبه اشتراک در فعالیت‌ها
      for (const activity of userInterests.activities) {
        if (otherUser.interests.activities.includes(activity)) {
          score += 2;
        }
      }
      
      // محاسبه اشتراک در موضوعات
      for (const topic of userInterests.topics) {
        if (otherUser.interests.topics.includes(topic)) {
          score += 1;
        }
      }
      
      if (score > 0) {
        similarUsers.push({ user: otherUser, score });
      }
    }
    
    // مرتب‌سازی بر اساس امتیاز نزولی
    similarUsers.sort((a, b) => b.score - a.score);
    
    // برگرداندن کاربران مشابه با محدودیت تعداد
    return similarUsers.slice(0, limit).map(item => item.user);
  }
  
  async recordFriendshipActivity(userId: number, friendId: number, type: string, details: string, xpEarned: number): Promise<boolean> {
    const user = this.users.get(userId);
    const friendObject = this.users.get(friendId);
    
    if (!user || !friendObject) return false;
    
    // اطمینان از وجود آرایه فعالیت‌های دوستی
    if (!user.friendshipActivities) {
      user.friendshipActivities = [];
    }
    
    // ایجاد رکورد جدید
    const activity = {
      id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      details,
      xpEarned,
      timestamp: new Date().toISOString(),
      friendId: friendObject.discordId,
      friendName: friendObject.username
    };
    
    // افزودن به لیست فعالیت‌ها
    user.friendshipActivities.push(activity);
    
    // بروزرسانی XP دوستی
    const result = await this.updateFriendshipXP(userId, friendId.toString(), xpEarned);
    
    return true;
  }

  async getFriendshipActivities(userId: number, friendId: number, limit: number = 10): Promise<any[]> {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    
    if (!user || !friend || !user.friendshipActivities) return [];
    
    // فیلتر کردن فعالیت‌های مربوط به دوست مورد نظر
    const activities = user.friendshipActivities.filter(
      activity => activity.friendId === friend.discordId
    );
    
    // مرتب‌سازی از جدید به قدیم
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // اعمال محدودیت تعداد
    return activities.slice(0, limit);
  }

  async getFriendshipLeaderboard(limit: number = 10): Promise<any[]> {
    const leaderboard: {userId: number, username: string, totalFriendshipXP: number}[] = [];
    
    // محاسبه مجموع XP دوستی برای هر کاربر
    for (const user of this.users.values()) {
      if (!user.friends || user.friends.length === 0) continue;
      
      // محاسبه مجموع XP دوستی
      const totalXP = user.friends.reduce((sum, friend) => sum + friend.friendshipXP, 0);
      
      // اضافه کردن به لیدربورد
      leaderboard.push({
        userId: user.id,
        username: user.username,
        totalFriendshipXP: totalXP
      });
    }
    
    // مرتب‌سازی بر اساس XP دوستی (نزولی)
    leaderboard.sort((a, b) => b.totalFriendshipXP - a.totalFriendshipXP);
    
    // اعمال محدودیت تعداد
    return leaderboard.slice(0, limit);
  }

  async hasSentDailyGift(userId: number, friendId: number): Promise<boolean> {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    
    if (!user || !friend) return false;
    
    // بررسی آرایه هدایای روزانه
    if (!user.dailyGifts) {
      user.dailyGifts = {};
      return false;
    }
    
    const today = new Date().toDateString();
    return user.dailyGifts[friend.discordId] === today;
  }

  async recordDailyGift(userId: number, friendId: number): Promise<boolean> {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    
    if (!user || !friend) return false;
    
    // اطمینان از وجود آرایه هدایای روزانه
    if (!user.dailyGifts) {
      user.dailyGifts = {};
    }
    
    // ثبت تاریخ هدیه برای امروز
    const today = new Date().toDateString();
    user.dailyGifts[friend.discordId] = today;
    
    return true;
  }

  async updateClaimedRewards(userId: number, rewardType: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // اطمینان از وجود آرایه جوایز دریافت شده
    if (!user.claimedRewards) {
      user.claimedRewards = {};
    }
    
    // ثبت دریافت جایزه
    user.claimedRewards[rewardType] = new Date().toISOString();
    
    return true;
  }

  // ------------------------
  // پیاده سازی عملیات‌های سیستم وام
  // ------------------------

  /**
   * دریافت تمام وام‌های یک کاربر
   * @param userId شناسه کاربر
   * @returns لیست وام‌های کاربر
   */
  async getUserLoans(userId: number): Promise<Loan[]> {
    const userLoans: Loan[] = [];
    
    for (const loan of this.loans.values()) {
      if (loan.userId === userId) {
        userLoans.push(loan);
      }
    }
    
    // مرتب‌سازی وام‌ها از جدیدترین به قدیمی‌ترین بر اساس تاریخ درخواست
    return userLoans.sort((a, b) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  }

  /**
   * دریافت اطلاعات یک وام با شناسه
   * @param loanId شناسه وام
   * @returns اطلاعات وام یا undefined در صورت عدم وجود
   */
  async getLoanById(loanId: string): Promise<Loan | undefined> {
    return this.loans.get(loanId);
  }
  
  /**
   * دریافت تمام وام‌های سررسید شده (بیش از 7 روز گذشته و پرداخت نشده)
   * @returns لیست وام‌های سررسید شده
   */
  async getOverdueLoans(): Promise<Loan[]> {
    const overdueLoans: Loan[] = [];
    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000; // 7 روز به میلی‌ثانیه
    
    for (const loan of this.loans.values()) {
      if (loan.status === 'active') {
        const dueDate = new Date(loan.dueDate);
        if (now.getTime() - dueDate.getTime() > sevenDaysInMs) {
          overdueLoans.push(loan);
        }
      }
    }
    
    return overdueLoans;
  }

  /**
   * ایجاد وام جدید
   * @param loan اطلاعات وام جدید
   * @returns وام ایجاد شده
   */
  async createLoan(loan: Loan): Promise<Loan> {
    // اطمینان از وجود کاربر
    const user = this.users.get(loan.userId);
    if (!user) {
      throw new Error(`کاربر با شناسه ${loan.userId} یافت نشد`);
    }
    
    // افزودن مبلغ وام به کیف پول کاربر
    user.wallet += loan.amount;
    
    // ثبت تراکنش
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: 'loan_received',
      amount: loan.amount,
      fee: 0,
      timestamp: new Date(),
      loanId: loan.id
    });
    
    // ذخیره اطلاعات وام
    this.loans.set(loan.id, loan);
    
    return loan;
  }

  /**
   * به‌روزرسانی وضعیت وام
   * @param loanId شناسه وام
   * @param status وضعیت جدید وام
   * @param repaymentDate تاریخ بازپرداخت (اختیاری)
   * @returns آیا به‌روزرسانی موفق بود
   */
  async updateLoanStatus(loanId: string, status: 'active' | 'paid' | 'overdue' | 'confiscated', repaymentDate?: Date): Promise<boolean> {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    
    loan.status = status;
    
    if (repaymentDate) {
      loan.repaymentDate = repaymentDate;
    }
    
    return true;
  }

  /**
   * به‌روزرسانی نمره اعتباری کاربر
   * @param userId شناسه کاربر
   * @param amount مقدار تغییر (مثبت یا منفی)
   * @returns نمره اعتباری جدید کاربر
   */
  async updateCreditScore(userId: number, amount: number): Promise<number> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`کاربر با شناسه ${userId} یافت نشد`);
    
    // اگر فیلد نمره اعتباری وجود ندارد، آن را ایجاد می‌کنیم
    if (!user.creditScore) {
      user.creditScore = 500; // نمره اعتباری پایه
    }
    
    // اعمال تغییر و محدود کردن بین 0 تا 1000
    user.creditScore = Math.max(0, Math.min(1000, user.creditScore + amount));
    
    return user.creditScore;
  }
  // Notification operations
  async getUserNotificationSettings(userId: number): Promise<NotificationSettings | undefined> {
    // اگر تنظیمات وجود داشت، برگردان
    if (this.notificationSettings.has(userId)) {
      return this.notificationSettings.get(userId);
    }
    
    // اگر وجود نداشت، تنظیمات پیش‌فرض را برگردان
    const defaultSettings: NotificationSettings = {
      enabled: true,
      notifyPrivateChat: true,
      notifyAnonymousChat: true,
      notifyFriendRequest: true,
      notifyEconomy: true
    };
    
    // ذخیره تنظیمات پیش‌فرض
    this.notificationSettings.set(userId, defaultSettings);
    
    return defaultSettings;
  }
  
  async updateUserNotificationSettings(userId: number, updates: Partial<NotificationSettings>): Promise<NotificationSettings | undefined> {
    // دریافت تنظیمات فعلی
    const currentSettings = await this.getUserNotificationSettings(userId);
    
    if (!currentSettings) {
      return undefined;
    }
    
    // به‌روزرسانی تنظیمات
    const updatedSettings: NotificationSettings = {
      ...currentSettings,
      ...updates
    };
    
    // ذخیره تنظیمات جدید
    this.notificationSettings.set(userId, updatedSettings);
    
    return updatedSettings;
  }
  
  async saveNotification(notification: Notification): Promise<Notification> {
    // اضافه کردن شناسه یکتا به صورت دستی
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newNotification: Notification = {
      ...notification,
      id
    };
    
    // دریافت اعلان‌های کاربر
    let userNotifications = this.notifications.get(notification.userId) || [];
    
    // اضافه کردن اعلان جدید
    userNotifications.push(newNotification);
    
    // ذخیره اعلان‌ها
    this.notifications.set(notification.userId, userNotifications);
    
    return newNotification;
  }
  
  async updateNotificationStatus(userId: number, type: NotificationType, relatedEntityId?: string): Promise<boolean> {
    // دریافت اعلان‌های کاربر
    const userNotifications = this.notifications.get(userId) || [];
    
    // پیدا کردن اعلان مورد نظر
    const index = userNotifications.findIndex(notification => 
      notification.type === type && 
      (relatedEntityId ? notification.relatedEntityId === relatedEntityId : true) &&
      !notification.sent
    );
    
    if (index === -1) {
      return false;
    }
    
    // به‌روزرسانی وضعیت ارسال
    userNotifications[index].sent = true;
    
    // ذخیره تغییرات
    this.notifications.set(userId, userNotifications);
    
    return true;
  }
  
  async getUserInteractionCount(userId: number, targetId: string): Promise<number> {
    const key = `${userId}_${targetId}`;
    const interaction = this.userInteractions.get(key);
    
    return interaction ? interaction.interactionCount : 0;
  }
  
  async getLastUserInteraction(userId: number, targetId: string): Promise<Date | undefined> {
    const key = `${userId}_${targetId}`;
    const interaction = this.userInteractions.get(key);
    
    return interaction ? interaction.lastInteraction : undefined;
  }
  
  async getUserEconomicActivity(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    
    if (!user || !user.transactions) {
      return 0;
    }
    
    // بررسی تعداد تراکنش‌های اقتصادی در 30 روز گذشته
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = user.transactions.filter(tx => 
      new Date(tx.timestamp) >= thirtyDaysAgo &&
      ['deposit', 'withdraw', 'transfer_in', 'transfer_out', 'stock_buy', 
       'stock_sell', 'lottery_ticket', 'bank_interest', 'loan_received', 
       'loan_repayment', 'job_salary', 'auction_bid'].includes(tx.type)
    );
    
    return recentTransactions.length;
  }

  // Tip Channel operations
  async getTipChannelSettings(guildId: string): Promise<TipChannelSettings | undefined> {
    return this.tipChannelSettings.get(guildId);
  }
  
  async setTipChannelSettings(settings: TipChannelSettings): Promise<boolean> {
    try {
      this.tipChannelSettings.set(settings.guildId, settings);
      return true;
    } catch (error) {
      console.error("Error setting tip channel settings:", error);
      return false;
    }
  }
  
  async getAllActiveTipChannelSettings(): Promise<TipChannelSettings[]> {
    const activeSettings: TipChannelSettings[] = [];
    
    for (const settings of this.tipChannelSettings.values()) {
      if (settings.isActive) {
        activeSettings.push(settings);
      }
    }
    
    return activeSettings;
  }
  
  // Quiz Question operations
  async saveQuizQuestion(question: QuizQuestion): Promise<QuizQuestion> {
    if (!question.id) {
      question.id = `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    if (!question.createdAt) {
      question.createdAt = new Date();
    }
    
    this.quizQuestions.set(question.id, question);
    return question;
  }
  
  async getQuizQuestionById(id: string): Promise<QuizQuestion | undefined> {
    return this.quizQuestions.get(id);
  }
  
  async getApprovedQuizQuestions(limit: number = 100): Promise<QuizQuestion[]> {
    const approvedQuestions = Array.from(this.quizQuestions.values())
      .filter(q => q.approved)
      .sort(() => Math.random() - 0.5); // Randomize questions
    
    return approvedQuestions.slice(0, limit);
  }
  
  async getPendingQuizQuestions(limit: number = 100): Promise<QuizQuestion[]> {
    const pendingQuestions = Array.from(this.quizQuestions.values())
      .filter(q => !q.approved)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Oldest first
    
    return pendingQuestions.slice(0, limit);
  }
  
  async approveQuizQuestion(id: string, reviewerId: string): Promise<boolean> {
    const question = this.quizQuestions.get(id);
    if (!question) return false;
    
    question.approved = true;
    question.approvedBy = reviewerId;
    
    // Update reviewer stats
    const reviewer = this.quizReviewers.get(reviewerId);
    if (reviewer) {
      reviewer.totalReviewed += 1;
      reviewer.totalApproved += 1;
      reviewer.lastActivity = new Date();
    }
    
    return true;
  }
  
  async rejectQuizQuestion(id: string, reviewerId: string, reason?: string): Promise<boolean> {
    const question = this.quizQuestions.get(id);
    if (!question) return false;
    
    // Instead of deleting, we could mark as rejected and keep for records
    this.quizQuestions.delete(id);
    
    // Update reviewer stats
    const reviewer = this.quizReviewers.get(reviewerId);
    if (reviewer) {
      reviewer.totalReviewed += 1;
      reviewer.totalRejected += 1;
      reviewer.lastActivity = new Date();
    }
    
    return true;
  }
  
  // Quiz Reviewer operations
  async getQuizReviewers(): Promise<QuizReviewer[]> {
    return Array.from(this.quizReviewers.values());
  }
  
  async getQuizReviewerByUserId(userId: string): Promise<QuizReviewer | undefined> {
    return this.quizReviewers.get(userId);
  }
  
  // AI Assistant operations
  async getUserAIAssistantDetails(userId: number): Promise<{subscription: boolean, subscriptionTier: string, subscriptionExpires: Date | null, questionsRemaining: number, totalQuestions: number} | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    // اگر فیلد aiAssistant وجود نداشت، مقدار پیش‌فرض برگردان
    if (!user.aiAssistant) {
      user.aiAssistant = {
        subscription: false,
        subscriptionTier: 'free',
        subscriptionExpires: null,
        questionsRemaining: 5,
        totalQuestions: 5
      };
      
      // به‌روزرسانی کاربر
      this.users.set(userId, user);
    }
    
    return user.aiAssistant;
  }
  
  async useAIAssistantQuestion(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // مطمئن شویم که فیلد aiAssistant وجود دارد
    if (!user.aiAssistant) {
      user.aiAssistant = {
        subscription: false,
        subscriptionTier: 'free',
        subscriptionExpires: null,
        questionsRemaining: 5,
        totalQuestions: 5
      };
    }
    
    // بررسی اشتراک کاربر
    if (user.aiAssistant.subscription) {
      // بررسی تاریخ انقضای اشتراک
      if (user.aiAssistant.subscriptionExpires && new Date() > user.aiAssistant.subscriptionExpires) {
        // اشتراک منقضی شده
        user.aiAssistant.subscription = false;
        user.aiAssistant.subscriptionTier = 'free';
        user.aiAssistant.questionsRemaining = 5;
        user.aiAssistant.totalQuestions = 5;
      } else {
        // اشتراک معتبر است، کاربر می‌تواند بدون محدودیت سوال بپرسد
        return true;
      }
    }
    
    // کاربر اشتراک ندارد، بررسی تعداد سوالات باقی‌مانده
    if (user.aiAssistant.questionsRemaining <= 0) {
      return false; // سوالات تمام شده‌اند
    }
    
    // کم کردن یک سوال از تعداد سوالات باقی‌مانده
    user.aiAssistant.questionsRemaining--;
    
    // به‌روزرسانی کاربر
    this.users.set(userId, user);
    
    return true;
  }
  
  async subscribeToAIAssistant(userId: number, tier: 'weekly' | 'monthly', amountPaid: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // مطمئن شویم که فیلد aiAssistant وجود دارد
    if (!user.aiAssistant) {
      user.aiAssistant = {
        subscription: false,
        subscriptionTier: 'free',
        subscriptionExpires: null,
        questionsRemaining: 5,
        totalQuestions: 5
      };
    }
    
    // تنظیم تاریخ انقضا بر اساس نوع اشتراک
    const now = new Date();
    let expiresAt = new Date(now);
    
    if (tier === 'weekly') {
      // یک هفته اضافه می‌کنیم
      expiresAt.setDate(now.getDate() + 7);
    } else if (tier === 'monthly') {
      // یک ماه اضافه می‌کنیم
      expiresAt.setDate(now.getDate() + 30);
    }
    
    // به‌روزرسانی اطلاعات اشتراک
    user.aiAssistant.subscription = true;
    user.aiAssistant.subscriptionTier = tier;
    user.aiAssistant.subscriptionExpires = expiresAt;
    
    // ثبت تراکنش خرید اشتراک
    if (!user.transactions) user.transactions = [];
    user.transactions.push({
      type: 'ai_subscription',
      amount: amountPaid,
      fee: 0,
      timestamp: now,
      details: {
        tier: tier,
        expiresAt: expiresAt
      }
    });
    
    // به‌روزرسانی کاربر
    this.users.set(userId, user);
    
    return true;
  }
  
  async resetAIAssistantQuestions(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // مطمئن شویم که فیلد aiAssistant وجود دارد
    if (!user.aiAssistant) {
      user.aiAssistant = {
        subscription: false,
        subscriptionTier: 'free',
        subscriptionExpires: null,
        questionsRemaining: 5,
        totalQuestions: 5
      };
    } else {
      // ریست کردن تعداد سوالات رایگان
      user.aiAssistant.questionsRemaining = 5;
    }
    
    // به‌روزرسانی کاربر
    this.users.set(userId, user);
    
    return true;
  }
  
  async getUserAIAssistantUsage(userId: number): Promise<number> {
    const user = this.users.get(userId);
    if (!user || !user.aiAssistant) return 0;
    
    // محاسبه تعداد سوالات استفاده شده
    return user.aiAssistant.totalQuestions - user.aiAssistant.questionsRemaining;
  }
  
  // Job operations
  async getUserJob(userId: number): Promise<JobData | undefined> {
    return Array.from(this.jobs.values()).find(job => job.userId === userId);
  }
  
  async getAvailableJobs(): Promise<{id: string, name: string, income: number, cyclePeriod: number, requirements: any}[]> {
    return [
      { 
        id: 'miner', 
        name: '⛏️ کارگر معدن', 
        income: 200, 
        cyclePeriod: 12, 
        requirements: { ccoin: 0 } 
      },
      { 
        id: 'trader', 
        name: '🏪 تاجر', 
        income: 500, 
        cyclePeriod: 12, 
        requirements: { ccoin: 10000 } 
      },
      { 
        id: 'supporter', 
        name: '🤖 ساپورت ربات', 
        income: 300, 
        cyclePeriod: 24, 
        requirements: { ccoin: 5000 } 
      },
      { 
        id: 'hunter', 
        name: '🗺️ شکارچی گنج', 
        income: 250, 
        cyclePeriod: 24, 
        requirements: { ccoin: 5000 } 
      },
      { 
        id: 'reporter', 
        name: '📰 خبرنگار سرور', 
        income: 350, 
        cyclePeriod: 24, 
        requirements: { ccoin: 7000 } 
      },
      { 
        id: 'organizer', 
        name: '🎉 برگزارکننده رویداد', 
        income: 450, 
        cyclePeriod: 24, 
        requirements: { ccoin: 12000 } 
      },
      { 
        id: 'designer', 
        name: '🎲 طراح چالش', 
        income: 320, 
        cyclePeriod: 24, 
        requirements: { ccoin: 6000 } 
      },
      { 
        id: 'guardian', 
        name: '🛡️ نگهبان سرور', 
        income: 280, 
        cyclePeriod: 24, 
        requirements: { ccoin: 4000 } 
      },
      { 
        id: 'streamer', 
        name: '🎥 استریمر سرور', 
        income: 380, 
        cyclePeriod: 24, 
        requirements: { ccoin: 8000 } 
      },
      { 
        id: 'guide', 
        name: '👋 راهنمای تازه‌وارد', 
        income: 270, 
        cyclePeriod: 24, 
        requirements: { ccoin: 3000 } 
      },
      { 
        id: 'keeper', 
        name: '📊 متصدی حضور', 
        income: 310, 
        cyclePeriod: 24, 
        requirements: { ccoin: 5500 } 
      },
      { 
        id: 'auditor', 
        name: '🔍 ممیز پیام', 
        income: 290, 
        cyclePeriod: 24, 
        requirements: { ccoin: 4500 } 
      },
      { 
        id: 'coach', 
        name: '🎮 مربی مینی‌گیم', 
        income: 340, 
        cyclePeriod: 24, 
        requirements: { ccoin: 6500 } 
      },
      { 
        id: 'coordinator', 
        name: '💬 هماهنگ‌کننده چت', 
        income: 360, 
        cyclePeriod: 24, 
        requirements: { ccoin: 7500 } 
      }
    ];
  }
  
  async assignJob(userId: number, jobType: string): Promise<JobData> {
    // بررسی وجود کاربر
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }
    
    // بررسی آیا شغل درخواستی معتبر است
    const availableJobs = await this.getAvailableJobs();
    const jobInfo = availableJobs.find(job => job.id === jobType);
    
    if (!jobInfo) {
      throw new Error('شغل مورد نظر یافت نشد');
    }
    
    // بررسی پیش‌نیازهای شغل
    if (jobInfo.requirements.ccoin > 0 && user.wallet + user.bank < jobInfo.requirements.ccoin) {
      throw new Error(`برای این شغل نیاز به حداقل ${jobInfo.requirements.ccoin} سکه دارید`);
    }
    
    if (jobInfo.requirements.clan && (!user.clanId || user.clanId <= 0)) {
      throw new Error('برای این شغل نیاز به عضویت در یک کلن دارید');
    }
    
    // حذف شغل فعلی اگر وجود دارد
    const existingJob = await this.getUserJob(userId);
    if (existingJob) {
      this.jobs.delete(existingJob.id);
    }
    
    // ایجاد شغل جدید
    const now = new Date();
    const newJob: JobData = {
      id: `job_${this.currentJobId++}`,
      userId,
      jobType,
      income: jobInfo.income,
      cyclePeriod: jobInfo.cyclePeriod,
      lastCollected: now,
      level: 1,
      xp: 0,
      xpRequired: 50,
      hiredAt: now
    };
    
    this.jobs.set(newJob.id, newJob);
    
    // ذخیره تراکنش در تاریخچه
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: 'job_assigned',
      amount: 0,
      fee: 0,
      timestamp: now,
      gameType: jobInfo.name
    });
    
    return newJob;
  }
  
  async collectJobIncome(userId: number): Promise<{amount: number, xpEarned: number, leveledUp: boolean}> {
    // بررسی وجود کاربر
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }
    
    // بررسی آیا کاربر شغلی دارد
    const job = await this.getUserJob(userId);
    if (!job) {
      throw new Error('شما شغلی ندارید');
    }
    
    const now = new Date();
    const lastCollected = new Date(job.lastCollected);
    const cooldownHours = job.cyclePeriod;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    
    // بررسی آیا زمان کافی از آخرین دریافت حقوق گذشته است
    if (now.getTime() - lastCollected.getTime() < cooldownMs) {
      const remainingMs = cooldownMs - (now.getTime() - lastCollected.getTime());
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
      throw new Error(`شما باید ${remainingHours} ساعت دیگر صبر کنید`);
    }
    
    // محاسبه درآمد بر اساس سطح شغل
    let income = job.income;
    for (let i = 1; i < job.level; i++) {
      income += Math.floor(job.income * 0.1); // 10% افزایش برای هر سطح
    }
    
    // محاسبه مالیات (5%)
    const tax = Math.ceil(income * 0.05);
    const netIncome = income - tax;
    
    // بروزرسانی موجودی کاربر
    user.wallet += netIncome;
    
    // بروزرسانی زمان آخرین دریافت حقوق
    job.lastCollected = now;
    this.jobs.set(job.id, job);
    
    // اضافه کردن XP شغلی
    const xpEarned = 10;
    const levelUpResult = await this.updateJobXP(userId, xpEarned);
    
    // ذخیره تراکنش در تاریخچه
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: 'work',
      amount: netIncome,
      fee: tax,
      timestamp: now,
      gameType: job.jobType
    });
    
    return {
      amount: netIncome,
      xpEarned,
      leveledUp: levelUpResult.leveledUp
    };
  }
  
  async updateJobXP(userId: number, xpAmount: number): Promise<{leveledUp: boolean, newLevel?: number}> {
    // بررسی وجود کاربر
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }
    
    // بررسی آیا کاربر شغلی دارد
    const job = await this.getUserJob(userId);
    if (!job) {
      throw new Error('شما شغلی ندارید');
    }
    
    // اضافه کردن XP
    job.xp += xpAmount;
    
    // بررسی آیا ارتقای سطح اتفاق افتاده است
    let leveledUp = false;
    let newLevel = job.level;
    
    if (job.xp >= job.xpRequired && job.level < 5) { // حداکثر سطح 5
      job.level += 1;
      job.xp = 0; // ریست XP
      job.xpRequired = 50; // ریست مقدار XP مورد نیاز
      leveledUp = true;
      newLevel = job.level;
      
      // ذخیره تراکنش در تاریخچه
      user.transactions = user.transactions || [];
      user.transactions.push({
        type: 'job_level_up',
        amount: 0,
        fee: 0,
        timestamp: new Date(),
        gameType: job.jobType
      });
    }
    
    // بروزرسانی اطلاعات شغل در مپ
    this.jobs.set(job.id, job);
    
    return { leveledUp, newLevel: leveledUp ? newLevel : undefined };
  }
  
  async appointQuizReviewer(userId: string, username: string, appointedBy: string): Promise<QuizReviewer> {
    const now = new Date();
    
    const reviewer: QuizReviewer = {
      userId,
      username,
      appointedAt: now,
      appointedBy,
      totalReviewed: 0,
      totalApproved: 0,
      totalRejected: 0,
      isActive: true,
      lastActivity: now
    };
    
    this.quizReviewers.set(userId, reviewer);
    return reviewer;
  }
  
  async removeQuizReviewer(userId: string): Promise<boolean> {
    return this.quizReviewers.delete(userId);
  }
  
  // Game Session operations
  async createGameSession(session: GameSession): Promise<GameSession> {
    if (!session.id) {
      session.id = `gs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    if (!session.createdAt) {
      session.createdAt = new Date();
    }
    
    this.gameSessions.set(session.id, session);
    return session;
  }
  
  async getGameSessionById(id: string): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }
  
  async getGameSession(gameId: string): Promise<GameSession | undefined> {
    return this.gameSessions.get(gameId) || this.activeGameSessions.get(gameId);
  }
  
  async incrementTotalGamesWon(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.totalGamesWon = (user.totalGamesWon || 0) + 1;
      await this.updateUser(userId, { totalGamesWon: user.totalGamesWon });
    }
  }
  
  async incrementTotalGamesPlayed(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.totalGamesPlayed = (user.totalGamesPlayed || 0) + 1;
      await this.updateUser(userId, { totalGamesPlayed: user.totalGamesPlayed });
    }
  }
  
  async getActiveGameSessions(channelId?: string): Promise<GameSession[]> {
    let activeSessions = Array.from(this.gameSessions.values())
      .filter(s => s.status === 'active' || s.status === 'waiting');
    
    if (channelId) {
      activeSessions = activeSessions.filter(s => s.channelId === channelId);
    }
    
    return activeSessions;
  }
  
  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    const session = this.gameSessions.get(id);
    if (!session) return undefined;
    
    // اضافه کردن updatedAt به روزرسانی اگر ارائه نشده باشد
    if (!updates.updatedAt) {
      updates.updatedAt = new Date();
    }
    
    const updatedSession = { ...session, ...updates };
    this.gameSessions.set(id, updatedSession);
    
    return updatedSession;
  }
  
  async endGameSession(id: string): Promise<boolean> {
    const session = this.gameSessions.get(id);
    if (!session) return false;
    
    session.status = 'ended';
    session.endedAt = new Date();
    
    return true;
  }
}

// مدل‌های MongoDB
import mongoose from 'mongoose';
import UserModel from './models/User';
import ClanModel from './models/Clan';
import TipChannelModel from './models/TipChannel';
import QuizQuestionModel from './models/QuizQuestion';
import QuizReviewerModel from './models/QuizReviewer';
import GameSessionModel from './models/GameSession';
import { connectMongo } from './utils/connectMongo';
import ItemModel from './models/Item';
import QuestModel from './models/Quest';
import { FriendRequestModel, BlockedUserModel } from './models/friend';
import LoanModel from './models/Loan';
import MarketListingModel from './models/MarketListing';

export class MongoStorage implements IStorage {
  async getItemById(id: number): Promise<Item | undefined> {
    try {
      const item = await ItemModel.findOne({ id });
      if (!item) return undefined;
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        crystalPrice: item.crystalPrice,
        emoji: item.emoji,
        type: item.type,
        duration: item.duration,
        rarity: item.rarity,
        effects: item.effects || {},
      };
    } catch (error) {
      console.error('Error getting item by ID:', error);
      return undefined;
    }
  }
  
  async updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined> {
    try {
      const item = await ItemModel.findOneAndUpdate(
        { id },
        updates,
        { new: true }
      );
      
      if (!item) return undefined;
      
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        crystalPrice: item.crystalPrice,
        emoji: item.emoji,
        type: item.type,
        duration: item.duration,
        rarity: item.rarity,
        effects: item.effects || {},
      };
    } catch (error) {
      console.error('Error updating item:', error);
      return undefined;
    }
  }
  
  async deleteItem(id: number): Promise<boolean> {
    try {
      const result = await ItemModel.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }
  
  async incrementTotalGamesWon(userId: number): Promise<void> {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (user) {
        user.totalGamesWon = (user.totalGamesWon || 0) + 1;
        await user.save();
      }
    } catch (error) {
      console.error(`Error incrementing total games won for user ${userId}:`, error);
    }
  }
  
  // Friend system implementations for MongoDB storage
  async getFriendship(userId: number, friendId: number): Promise<Friend | undefined> {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (!user || !user.friends) return undefined;
      
      return user.friends.find(f => 
        f.friendId === String(friendId) || 
        Number(f.friendId) === friendId
      );
    } catch (error) {
      console.error(`Error getting friendship between users ${userId} and ${friendId}:`, error);
      return undefined;
    }
  }
  
  async getPendingFriendRequest(fromUserId: number, toUserId: number): Promise<FriendRequest | undefined> {
    try {
      const fromUser = await UserModel.findOne({ id: fromUserId });
      const toUser = await UserModel.findOne({ id: toUserId });
      
      if (!fromUser || !toUser || !toUser.friendRequests) return undefined;
      
      // Find pending request between these two users
      return toUser.friendRequests.find(req => 
        req.fromUserId === fromUser.discordId && 
        req.toUserId === toUser.discordId && 
        req.status === 'pending'
      );
    } catch (error) {
      console.error(`Error getting pending friend request between users ${fromUserId} and ${toUserId}:`, error);
      return undefined;
    }
  }
  
  async createFriendRequest(fromUserId: number, toUserId: number, message?: string): Promise<boolean> {
    // This uses the same implementation as sendFriendRequest
    return this.sendFriendRequest(fromUserId, toUserId, message);
  }
  
  // Blocked users implementations for MongoDB storage
  async getBlockedUsers(userId: number): Promise<BlockedUser[]> {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (!user || !user.blockedUsers) return [];
      
      return user.blockedUsers;
    } catch (error) {
      console.error(`Error getting blocked users for user ${userId}:`, error);
      return [];
    }
  }
  
  async blockUser(userId: number, blockedUserId: number, reason?: string): Promise<boolean> {
    try {
      const user = await UserModel.findOne({ id: userId });
      const blockedUser = await UserModel.findOne({ id: blockedUserId });
      
      if (!user || !blockedUser) return false;
      
      if (!user.blockedUsers) {
        user.blockedUsers = [];
      }
      
      // Check if already blocked
      if (user.blockedUsers.some(b => b.userId === blockedUser.discordId)) {
        return false;
      }
      
      // Add to block list
      user.blockedUsers.push({
        userId: blockedUser.discordId,
        reason,
        timestamp: new Date().toISOString()
      });
      
      await user.save();
      return true;
    } catch (error) {
      console.error(`Error blocking user ${blockedUserId} by user ${userId}:`, error);
      return false;
    }
  }
  
  async unblockUser(userId: number, blockedUserId: string | number): Promise<boolean> {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (!user || !user.blockedUsers) return false;
      
      // If ID is numeric, get the Discord ID
      if (typeof blockedUserId === 'number') {
        const blockedUser = await UserModel.findOne({ id: blockedUserId });
        if (!blockedUser) return false;
        blockedUserId = blockedUser.discordId;
      }
      
      // Find and remove the blocked user
      const index = user.blockedUsers.findIndex(b => b.userId === blockedUserId);
      if (index < 0) return false;
      
      user.blockedUsers.splice(index, 1);
      await user.save();
      return true;
    } catch (error) {
      console.error(`Error unblocking user by user ${userId}:`, error);
      return false;
    }
  }
  
  async unblockAllUsers(userId: number): Promise<boolean> {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (!user) return false;
      
      user.blockedUsers = [];
      await user.save();
      return true;
    } catch (error) {
      console.error(`Error unblocking all users for user ${userId}:`, error);
      return false;
    }
  }
  
  async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      // Find the request based on the requestId (format: 'fromUserId_toUserId')
      const [fromUserId, toUserId] = requestId.split('_');
      
      // Check if users exist
      const fromUser = await UserModel.findOne({ discordId: fromUserId });
      const toUser = await UserModel.findOne({ discordId: toUserId });
      
      if (!fromUser || !toUser) {
        console.error(`Error accepting friend request: user(s) not found for request ${requestId}`);
        return false;
      }
      
      // Find and update the request to 'accepted'
      const requestInFromUser = fromUser.friendRequests?.find(req => 
        req.fromUserId === fromUserId && req.toUserId === toUserId && req.status === 'pending'
      );
      
      const requestInToUser = toUser.friendRequests?.find(req => 
        req.fromUserId === fromUserId && req.toUserId === toUserId && req.status === 'pending'
      );
      
      if (!requestInFromUser || !requestInToUser) {
        console.error(`Error accepting friend request: request ${requestId} not found or not pending`);
        return false;
      }
      
      // Update request status
      requestInFromUser.status = 'accepted';
      requestInToUser.status = 'accepted';
      
      // Current timestamp
      const now = new Date().toISOString();
      
      // Initialize friends array if not exists
      if (!fromUser.friends) fromUser.friends = [];
      if (!toUser.friends) toUser.friends = [];
      
      // Add to friends list with initial friendship level
      fromUser.friends.push({
        friendId: toUser.discordId,
        friendshipLevel: 1,
        friendshipXP: 0,
        addedAt: now,
        lastInteraction: now,
        favoriteStatus: false,
        isBestFriend: false
      });
      
      toUser.friends.push({
        friendId: fromUser.discordId,
        friendshipLevel: 1,
        friendshipXP: 0,
        addedAt: now,
        lastInteraction: now,
        favoriteStatus: false,
        isBestFriend: false
      });
      
      // Save changes
      await fromUser.save();
      await toUser.save();
      
      return true;
    } catch (error) {
      console.error(`Error accepting friend request ${requestId}:`, error);
      return false;
    }
  }
  
  async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      // Find the request based on the requestId (format: 'fromUserId_toUserId')
      const [fromUserId, toUserId] = requestId.split('_');
      
      // Check if users exist
      const fromUser = await UserModel.findOne({ discordId: fromUserId });
      const toUser = await UserModel.findOne({ discordId: toUserId });
      
      if (!fromUser || !toUser) {
        console.error(`Error rejecting friend request: user(s) not found for request ${requestId}`);
        return false;
      }
      
      // Find and update the request to 'rejected'
      const requestInFromUser = fromUser.friendRequests?.find(req => 
        req.fromUserId === fromUserId && req.toUserId === toUserId && req.status === 'pending'
      );
      
      const requestInToUser = toUser.friendRequests?.find(req => 
        req.fromUserId === fromUserId && req.toUserId === toUserId && req.status === 'pending'
      );
      
      if (!requestInFromUser || !requestInToUser) {
        console.error(`Error rejecting friend request: request ${requestId} not found or not pending`);
        return false;
      }
      
      // Update request status
      requestInFromUser.status = 'rejected';
      requestInToUser.status = 'rejected';
      
      // Save changes
      await fromUser.save();
      await toUser.save();
      
      return true;
    } catch (error) {
      console.error(`Error rejecting friend request ${requestId}:`, error);
      return false;
    }
  }
  
  async incrementTotalGamesPlayed(userId: number): Promise<void> {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (user) {
        user.totalGamesPlayed = (user.totalGamesPlayed || 0) + 1;
        await user.save();
      }
    } catch (error) {
      console.error(`Error incrementing total games played for user ${userId}:`, error);
    }
  }
  
  async getGameSession(gameId: string): Promise<GameSession | undefined> {
    try {
      const gameSession = await GameSessionModel.findOne({ gameId });
      if (!gameSession) return undefined;
      return gameSession as unknown as GameSession;
    } catch (error) {
      console.error(`Error getting game session ${gameId} from MongoDB:`, error);
      return undefined;
    }
  }
  async getAllStocks(): Promise<StockData[]> {
    // پیاده‌سازی متد getAllStocks برای MongoDB
    try {
      const stocksCollection = await connectMongo('stocks');
      const stocks = await stocksCollection.find({}).toArray();
      return stocks as StockData[];
    } catch (error) {
      console.error('Error getting all stocks from MongoDB:', error);
      return [];
    }
  }
  
  /**
   * دریافت تمام وام‌های یک کاربر
   * @param userId شناسه کاربر
   * @returns لیست وام‌های کاربر
   */
  async getUserLoans(userId: number): Promise<Loan[]> {
    try {
      // بررسی وجود کاربر
      const user = await UserModel.findOne({ id: userId });
      if (!user) {
        console.error(`User ${userId} not found in MongoDB when getting loans`);
        return [];
      }
      
      // دریافت وام‌های کاربر از مانگو
      const loans = await LoanModel.find({ userId });
      
      // تبدیل به فرمت مناسب Loan
      return loans.map(loan => ({
        id: loan.id,
        userId: loan.userId,
        amount: loan.amount,
        interestRate: loan.interestRate,
        requestDate: loan.requestDate,
        dueDate: loan.dueDate,
        status: loan.status,
        type: loan.type
      }));
    } catch (error) {
      console.error(`Error getting loans for user ${userId} from MongoDB:`, error);
      return [];
    }
  }

  /**
   * دریافت اطلاعات یک وام با شناسه
   * @param loanId شناسه وام
   * @returns اطلاعات وام یا undefined در صورت عدم وجود
   */
  async getLoanById(loanId: string): Promise<Loan | undefined> {
    try {
      const loan = await LoanModel.findOne({ id: loanId });
      if (!loan) return undefined;
      
      return {
        id: loan.id,
        userId: loan.userId,
        amount: loan.amount,
        interestRate: loan.interestRate,
        requestDate: loan.requestDate,
        dueDate: loan.dueDate,
        status: loan.status,
        type: loan.type
      };
    } catch (error) {
      console.error(`Error getting loan ${loanId} from MongoDB:`, error);
      return undefined;
    }
  }
  
  /**
   * دریافت تمام وام‌های سررسید شده (بیش از 7 روز گذشته و پرداخت نشده)
   * @returns لیست وام‌های سررسید شده
   */
  async getOverdueLoans(): Promise<Loan[]> {
    try {
      const now = new Date();
      
      // یافتن همه وام‌های فعالی که از تاریخ سررسید آنها گذشته است
      const loans = await LoanModel.find({ 
        status: 'active',
        dueDate: { $lt: now }
      });
      
      return loans.map(loan => ({
        id: loan.id,
        userId: loan.userId,
        amount: loan.amount,
        interestRate: loan.interestRate,
        requestDate: loan.requestDate,
        dueDate: loan.dueDate,
        status: loan.status,
        type: loan.type
      }));
    } catch (error) {
      console.error('Error getting overdue loans from MongoDB:', error);
      return [];
    }
  }

  /**
   * ایجاد وام جدید
   * @param loan اطلاعات وام جدید
   * @returns وام ایجاد شده
   */
  async createLoan(loan: Loan): Promise<Loan> {
    try {
      // اطمینان از وجود کاربر
      const user = await UserModel.findOne({ id: loan.userId });
      if (!user) {
        throw new Error(`User ${loan.userId} not found when creating loan`);
      }
      
      // ساخت وام جدید
      const newLoan = new LoanModel({
        id: loan.id,
        userId: loan.userId,
        amount: loan.amount,
        interestRate: loan.interestRate,
        requestDate: loan.requestDate,
        dueDate: loan.dueDate,
        status: loan.status,
        type: loan.type
      });
      
      // ذخیره در دیتابیس
      await newLoan.save();
      
      // به‌روزرسانی موجودی کاربر
      user.wallet += loan.amount;
      
      // ثبت تراکنش
      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        type: 'loan_received',
        amount: loan.amount,
        fee: 0,
        timestamp: new Date()
      });
      
      await user.save();
      
      return loan;
    } catch (error) {
      console.error('Error creating loan in MongoDB:', error);
      throw error;
    }
  }

  /**
   * به‌روزرسانی وضعیت وام
   * @param loanId شناسه وام
   * @param status وضعیت جدید وام
   * @returns نتیجه به‌روزرسانی
   */
  async updateLoanStatus(loanId: string, status: 'active' | 'paid' | 'overdue' | 'confiscated'): Promise<boolean> {
    try {
      const result = await LoanModel.updateOne(
        { id: loanId },
        { $set: { status } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`Error updating loan status for ${loanId} in MongoDB:`, error);
      return false;
    }
  }
  
  async getStockById(stockId: number): Promise<StockData | null> {
    try {
      const stocksCollection = await connectMongo('stocks');
      const stock = await stocksCollection.findOne({ id: stockId });
      return stock as StockData || null;
    } catch (error) {
      console.error(`Error getting stock ${stockId} from MongoDB:`, error);
      return null;
    }
  }
  
  async updateStockPrice(stockId: number, newPrice: number): Promise<boolean> {
    try {
      const stocksCollection = await connectMongo('stocks');
      const stock = await stocksCollection.findOne({ id: stockId });
      
      if (!stock) return false;
      
      // ذخیره قیمت قبلی
      const oldPrice = stock.currentPrice;
      
      // به‌روزرسانی قیمت جدید
      await stocksCollection.updateOne(
        { id: stockId },
        { 
          $set: { 
            previousPrice: oldPrice,
            currentPrice: newPrice,
            updatedAt: new Date()
          }
        }
      );
      
      // ذخیره تاریخچه قیمت
      const now = new Date();
      await stocksCollection.updateOne(
        { id: stockId },
        { 
          $push: { 
            priceHistory: {
              price: newPrice,
              timestamp: now
            }
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error(`Error updating stock price for ${stockId} in MongoDB:`, error);
      return false;
    }
  }
  
  async addStockNews(stockId: number, news: StockNews): Promise<boolean> {
    try {
      const stocksCollection = await connectMongo('stocks');
      await stocksCollection.updateOne(
        { id: stockId },
        { $push: { news: news } }
      );
      return true;
    } catch (error) {
      console.error(`Error adding news for stock ${stockId} in MongoDB:`, error);
      return false;
    }
  }
  
  async getStockNews(stockId: number, limit?: number): Promise<StockNews[]> {
    try {
      const stocksCollection = await connectMongo('stocks');
      const stock = await stocksCollection.findOne({ id: stockId });
      
      if (!stock || !stock.news) return [];
      
      // اگر محدودیت تعیین شده، آخرین خبرها را برگردان
      if (limit && stock.news.length > limit) {
        return stock.news.slice(-limit);
      }
      
      return stock.news;
    } catch (error) {
      console.error(`Error getting news for stock ${stockId} from MongoDB:`, error);
      return [];
    }
  }
  
  async getStockPriceHistory(stockId: number, limit?: number): Promise<StockPriceHistory[]> {
    try {
      const stocksCollection = await connectMongo('stocks');
      const stock = await stocksCollection.findOne({ id: stockId });
      
      if (!stock || !stock.priceHistory) return [];
      
      // اگر محدودیت تعیین شده، آخرین قیمت‌ها را برگردان
      if (limit && stock.priceHistory.length > limit) {
        return stock.priceHistory.slice(-limit);
      }
      
      return stock.priceHistory;
    } catch (error) {
      console.error(`Error getting price history for stock ${stockId} from MongoDB:`, error);
      return [];
    }
  }
  
  // معادل getStockById برای سازگاری با کد قبلی
  async getStock(id: number): Promise<StockData | undefined> {
    const stock = await this.getStockById(id);
    return stock || undefined;
  }
  
  // برای به‌روزرسانی کلی سهام
  async updateStock(stockId: number, updates: Partial<StockData>): Promise<boolean> {
    try {
      const stocksCollection = await connectMongo('stocks');
      await stocksCollection.updateOne(
        { id: stockId },
        { $set: updates }
      );
      return true;
    } catch (error) {
      console.error(`Error updating stock ${stockId} in MongoDB:`, error);
      return false;
    }
  }
  
  // دریافت سهام‌های یک کاربر
  async getUserStocks(userId: number): Promise<UserStockData[]> {
    try {
      const userModel = await UserModel.findOne({ id: userId });
      if (!userModel || !userModel.stockPortfolio) return [];
      
      return userModel.stockPortfolio as UserStockData[];
    } catch (error) {
      console.error(`Error getting stocks for user ${userId} from MongoDB:`, error);
      return [];
    }
  }
  
  // خرید سهام توسط کاربر
  async buyStock(userId: number, stockId: number, quantity: number): Promise<boolean> {
    try {
      // دریافت اطلاعات سهام و کاربر
      const stock = await this.getStockById(stockId);
      const user = await UserModel.findOne({ id: userId });
      
      if (!stock || !user) return false;
      
      // محاسبه هزینه خرید
      const cost = stock.currentPrice * quantity;
      
      // بررسی کافی بودن موجودی
      if (user.wallet < cost) return false;
      
      // کم کردن هزینه از کیف پول کاربر
      user.wallet -= cost;
      
      // اضافه کردن سهام به پورتفولیو کاربر
      if (!user.stockPortfolio) user.stockPortfolio = [];
      
      // بررسی اگر کاربر از قبل این سهام را دارد
      const existingStock = user.stockPortfolio.find((s: any) => s.stockId === stockId);
      
      if (existingStock) {
        // افزایش تعداد سهام
        existingStock.quantity += quantity;
        existingStock.averagePrice = ((existingStock.averagePrice * (existingStock.quantity - quantity)) + (stock.currentPrice * quantity)) / existingStock.quantity;
      } else {
        // اضافه کردن سهام جدید به پورتفولیو
        user.stockPortfolio.push({
          stockId,
          quantity,
          averagePrice: stock.currentPrice,
          boughtAt: new Date()
        });
      }
      
      // ثبت تراکنش
      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        type: 'stock_purchase',
        amount: -cost,
        fee: 0,
        timestamp: new Date()
      });
      
      // ذخیره تغییرات
      await user.save();
      
      return true;
    } catch (error) {
      console.error(`Error buying stock ${stockId} for user ${userId} in MongoDB:`, error);
      return false;
    }
  }
  
  // فروش سهام توسط کاربر
  async sellStock(userId: number, stockId: number, quantity: number): Promise<boolean> {
    try {
      // دریافت اطلاعات سهام و کاربر
      const stock = await this.getStockById(stockId);
      const user = await UserModel.findOne({ id: userId });
      
      if (!stock || !user || !user.stockPortfolio) return false;
      
      // یافتن سهام در پورتفولیو کاربر
      const userStock = user.stockPortfolio.find((s: any) => s.stockId === stockId);
      
      if (!userStock || userStock.quantity < quantity) return false;
      
      // محاسبه مبلغ دریافتی از فروش
      const revenue = stock.currentPrice * quantity;
      
      // کم کردن تعداد سهام
      userStock.quantity -= quantity;
      
      // اگر تعداد به صفر رسید، حذف از پورتفولیو
      if (userStock.quantity === 0) {
        user.stockPortfolio = user.stockPortfolio.filter((s: any) => s.stockId !== stockId);
      }
      
      // اضافه کردن مبلغ به کیف پول کاربر
      user.wallet += revenue;
      
      // ثبت تراکنش
      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        type: 'stock_sale',
        amount: revenue,
        fee: 0,
        timestamp: new Date()
      });
      
      // ذخیره تغییرات
      await user.save();
      
      return true;
    } catch (error) {
      console.error(`Error selling stock ${stockId} for user ${userId} in MongoDB:`, error);
      return false;
    }
  }
  
  async recordGame(userId: number, type: string, bet: number, won: boolean, reward: number): Promise<Game> {
    try {
      // بررسی اگر در کش موجود است
      const cacheKey = `${userId}_${type}_${Date.now()}`;
      const cachedGame = getCache<Game>('games', cacheKey);
      if (cachedGame) return cachedGame;
      
      // استفاده از findOne به جای findById برای جلوگیری از خطای ObjectId
      let user;
      try {
        user = await UserModel.findOne({ id: userId });
        
        // اگر با id پیدا نشد، با discordId امتحان کنیم (شاید userId در واقع discordId است)
        if (!user && typeof userId === 'string') {
          user = await UserModel.findOne({ discordId: userId });
        }
      } catch (error) {
        console.error('Error finding user in recordGame:', error);
      }
      
      if (!user) return memStorage.recordGame(userId, type, bet, won, reward);
      
      const now = new Date();
      const id = Date.now();
      const game: Game = {
        id,
        userId,
        type,
        bet,
        won,
        reward,
        playedAt: now
      };
      
      // اگر آرایه بازی‌ها وجود ندارد، آن را ایجاد کنید
      if (!user.games) user.games = [];
      
      // افزودن بازی جدید
      user.games.push(game);
      
      // به‌روزرسانی آمار کاربر
      user.totalGamesPlayed = (user.totalGamesPlayed || 0) + 1;
      
      // ذخیره تراکنش مربوط به بازی
      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        type: won ? 'game_win' : 'game_loss',
        amount: won ? reward : -bet,
        fee: 0,
        timestamp: now
      });
      
      await user.save();
      
      console.log(`Game recorded for user ${userId}: ${type}, bet: ${bet}, won: ${won}, reward: ${reward}`);
      
      // ذخیره در کش
      setCache('games', cacheKey, game, 30 * 60 * 1000); // کش برای 30 دقیقه
      
      return game;
    } catch (error) {
      console.error('Error recording game in MongoDB:', error);
      return memStorage.recordGame(userId, type, bet, won, reward);
    }
  }
  // User operations
  async getUser(id: number | string): Promise<User | undefined> {
    try {
      // با امنیت بیشتر ابتدا با discordId جستجو می‌کنیم
      // برای حل مشکل نوع داده، از String(id) استفاده می‌کنیم
      let user = await UserModel.findOne({ discordId: String(id) });
      
      // اگر پیدا نشد، با id معمولی جستجو می‌کنیم
      if (!user) {
        user = await UserModel.findOne({ id });
      }
      
      if (!user) return undefined;
      
      // تبدیل سند به ساختاری که با تایپ User مطابقت دارد
      return this.convertMongoUserToUser(user);
    } catch (error) {
      console.error('Error getting user from MongoDB:', error);
      return undefined;
    }
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ discordId });
      if (!user) return undefined;
      return this.convertMongoUserToUser(user);
    } catch (error) {
      console.error('Error getting user by Discord ID from MongoDB:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // تنظیم داده‌های پیش‌فرض کاربر
      const now = new Date();
      const newUser = new UserModel({
        discordId: insertUser.discordId,
        username: insertUser.username,
        wallet: 500, // مقدار اولیه در کیف پول
        bank: 0,
        crystals: 0,
        economyLevel: 1,
        // سایر فیلدها با مقادیر پیش‌فرض تنظیم می‌شوند
      });
      
      const savedUser = await newUser.save();
      return this.convertMongoUserToUser(savedUser);
    } catch (error) {
      console.error('Error creating user in MongoDB:', error);
      // در صورت خطا، به MemStorage برمی‌گردیم
      return memStorage.createUser(insertUser);
    }
  }

  // متد کمکی برای تبدیل سند مانگو به ساختار User
  private convertMongoUserToUser(mongoUser: any): User {
    // تمام فیلدهای موجود در User را به شکل پیش‌فرض تنظیم می‌کنیم
    const user: Partial<User> = {
      id: mongoUser._id,
      discordId: mongoUser.discordId,
      username: mongoUser.username,
      displayName: mongoUser.displayName || null,
      wallet: mongoUser.wallet || 0,
      bank: mongoUser.bank || 0,
      crystals: mongoUser.crystals || 0,
      economyLevel: mongoUser.economyLevel || 1,
      points: mongoUser.points || 0,
      level: mongoUser.level || 1,
      experience: mongoUser.experience || 0,
      lastDaily: mongoUser.lastDaily || null,
      lastWeekly: mongoUser.lastWeekly || null,
      lastMonthly: mongoUser.lastMonthly || null,
      lastRob: mongoUser.lastRob || null,
      lastWork: mongoUser.lastWork || null,
      lastWheelSpin: mongoUser.lastWheelSpin || null,
      inventory: mongoUser.inventory || {},
      dailyStreak: mongoUser.dailyStreak || 0,
      achievements: mongoUser.achievements || [],
      itemsEquipped: mongoUser.itemsEquipped || [],
      isBot: mongoUser.isBot || false,
      isBanned: mongoUser.isBanned || false,
      isMuted: mongoUser.isMuted || false,
      joinedAt: mongoUser.joinedAt || new Date(),
      lastActivity: mongoUser.lastActivity || new Date(),
      reputation: mongoUser.reputation || 0,
      energyPoints: mongoUser.energyPoints || 100,
      lastEnergyRefill: mongoUser.lastEnergyRefill || null,
      xpBooster: mongoUser.xpBooster || {
        active: false,
        multiplier: 1,
        expiresAt: null
      },
      coinBooster: mongoUser.coinBooster || {
        active: false,
        multiplier: 1,
        expiresAt: null
      },
      nickname: mongoUser.nickname || null,
      avatarURL: mongoUser.avatarURL || null,
      roles: mongoUser.roles || [],
      badges: mongoUser.badges || [],
      skillPoints: mongoUser.skillPoints || 0,
      marketplaceListings: mongoUser.marketplaceListings || [],
      claimedRewards: mongoUser.claimedRewards || [],
      dailyGifts: mongoUser.dailyGifts || {
        giftsGiven: {},
        giftsReceived: {}
      },
      friendshipActivities: mongoUser.friendshipActivities || [],
      isVIP: mongoUser.isVIP || false,
      premiumUntil: mongoUser.premiumUntil || null,
      vipTier: mongoUser.vipTier || 0,
      stockPortfolio: mongoUser.stockPortfolio || [],
      clanId: mongoUser.clanId || null,
      clanRole: mongoUser.clanRole || null,
      messages: mongoUser.messages || 0,
      commands: mongoUser.commands || 0,
      warnings: mongoUser.warnings || [],
      notes: mongoUser.notes || null,
      totalGamesPlayed: mongoUser.totalGamesPlayed || 0,
      totalGamesWon: mongoUser.totalGamesWon || 0,
      transactions: mongoUser.transactions || [],
      transferStats: mongoUser.transferStats || {
        dailyAmount: 0,
        lastReset: new Date(),
        recipients: {}
      },
      createdAt: mongoUser.createdAt || new Date()
    };
    
    // اطمینان حاصل می‌کنیم که تمام فیلدهای نیاز شده در User وجود دارد
    return user as User;
  }

  // سایر متدها با الگوی مشابه پیاده‌سازی می‌شوند
  // در ابتدا، می‌توانیم تنها متدهای مهم را پیاده‌سازی کنیم
  // و برای بقیه از توابع MemStorage استفاده کنیم

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const user = await UserModel.findOneAndUpdate({ _id: id }, updates, { new: true });
      if (!user) return undefined;
      return this.convertMongoUserToUser(user);
    } catch (error) {
      console.error('Error updating user in MongoDB:', error);
      return memStorage.updateUser(id, updates);
    }
  }

  // برای سایر متدهای مهم، از memStorage استفاده می‌کنیم
  // در آینده می‌توان این متدها را نیز با MongoDB پیاده‌سازی کرد
  async getAllUsers(limit?: number): Promise<User[]> {
    try {
      const query = UserModel.find();
      if (limit) {
        query.limit(limit);
      }
      const users = await query.exec();
      return users.map(user => this.convertMongoUserToUser(user));
    } catch (error) {
      console.error('Error getting all users from MongoDB:', error);
      return memStorage.getAllUsers(limit);
    }
  }

  async getUserCount(): Promise<number> {
    try {
      return await UserModel.countDocuments();
    } catch (error) {
      console.error('Error getting user count from MongoDB:', error);
      return memStorage.getUserCount();
    }
  }
  
  // اضافه کردن متدهای مورد نیاز برای پنل مدیریت
  async createItem(item: InsertItem): Promise<Item> {
    try {
      // Get the highest item ID currently in the database
      const items = await ItemModel.find().sort({ id: -1 }).limit(1);
      const nextId = items.length > 0 ? items[0].id + 1 : 1;
      
      // Create the new item with the next available ID
      const newItem = new ItemModel({
        id: nextId,
        name: item.name,
        description: item.description,
        price: item.price,
        crystalPrice: item.crystalPrice || null,
        emoji: item.emoji,
        type: item.type, 
        duration: item.duration || null,
        rarity: item.rarity,
        effects: item.effects || {}
      });
      
      await newItem.save();
      
      return {
        id: newItem.id,
        name: newItem.name,
        description: newItem.description,
        price: newItem.price,
        crystalPrice: newItem.crystalPrice,
        emoji: newItem.emoji,
        type: newItem.type,
        duration: newItem.duration,
        rarity: newItem.rarity,
        effects: newItem.effects || {},
      };
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }
  
  async getAllItems(): Promise<Item[]> {
    try {
      const items = await ItemModel.find();
      return items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        price: item.price,
        crystalPrice: item.crystalPrice,
        emoji: item.emoji,
        duration: item.duration,
        rarity: item.rarity,
        effects: item.effects,
        category: item.category
      }));
    } catch (error) {
      console.error('Error getting all items from MongoDB:', error);
      return memStorage.getAllItems();
    }
  }
  
  async getItem(itemId: number): Promise<Item | undefined> {
    try {
      const item = await ItemModel.findOne({ id: itemId });
      if (!item) return undefined;
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        price: item.price,
        crystalPrice: item.crystalPrice,
        emoji: item.emoji,
        duration: item.duration,
        rarity: item.rarity,
        effects: item.effects,
        category: item.category
      };
    } catch (error) {
      console.error(`Error getting item ${itemId} from MongoDB:`, error);
      return memStorage.getItem(itemId);
    }
  }
  
  async getAllQuests(): Promise<Quest[]> {
    try {
      const quests = await QuestModel.find();
      return quests.map(quest => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        requirement: quest.requirement,
        targetAmount: quest.targetAmount,
        reward: quest.reward,
        category: quest.category,
        active: quest.active,
        minLevel: quest.minLevel
      }));
    } catch (error) {
      console.error('Error getting all quests from MongoDB:', error);
      return memStorage.getAllQuests();
    }
  }
  
  async getAllClans(): Promise<Clan[]> {
    try {
      const clans = await ClanModel.find();
      return clans.map(clan => ({
        id: clan.id,
        name: clan.name,
        description: clan.description,
        ownerId: clan.ownerId,
        bank: clan.bank,
        level: clan.level,
        experience: clan.experience || 0,
        memberCount: clan.memberCount,
        warWins: clan.warWins || 0,
        warLosses: clan.warLosses || 0,
        createdAt: clan.createdAt,
        coLeaderIds: clan.coLeaderIds || [],
        memberIds: clan.memberIds || [],
        joinRequests: clan.joinRequests || [],
        maxMembers: clan.maxMembers || 10,
        lastActivity: clan.lastActivity,
        color: clan.color,
        icon: clan.icon,
        banner: clan.banner
      }));
    } catch (error) {
      console.error('Error getting all clans from MongoDB:', error);
      return memStorage.getAllClans();
    }
  }
  
  async getClan(clanId: number): Promise<Clan | undefined> {
    try {
      const clan = await ClanModel.findOne({ id: clanId });
      if (!clan) return undefined;
      return {
        id: clan.id,
        name: clan.name,
        description: clan.description,
        ownerId: clan.ownerId,
        bank: clan.bank,
        level: clan.level,
        experience: clan.experience || 0,
        memberCount: clan.memberCount,
        warWins: clan.warWins || 0,
        warLosses: clan.warLosses || 0,
        createdAt: clan.createdAt,
        coLeaderIds: clan.coLeaderIds || [],
        memberIds: clan.memberIds || [],
        joinRequests: clan.joinRequests || [],
        maxMembers: clan.maxMembers || 10,
        lastActivity: clan.lastActivity,
        color: clan.color,
        icon: clan.icon,
        banner: clan.banner
      };
    } catch (error) {
      console.error(`Error getting clan ${clanId} from MongoDB:`, error);
      return memStorage.getClan(clanId);
    }
  }
  
  async getClanByName(name: string): Promise<Clan | undefined> {
    try {
      const clan = await ClanModel.findOne({ name: name });
      if (!clan) return undefined;
      return {
        id: clan.id,
        name: clan.name,
        description: clan.description,
        ownerId: clan.ownerId,
        bank: clan.bank,
        level: clan.level,
        experience: clan.experience || 0,
        memberCount: clan.memberCount,
        warWins: clan.warWins || 0,
        warLosses: clan.warLosses || 0,
        createdAt: clan.createdAt,
        coLeaderIds: clan.coLeaderIds || [],
        memberIds: clan.memberIds || [],
        joinRequests: clan.joinRequests || [],
        maxMembers: clan.maxMembers || 10,
        lastActivity: clan.lastActivity,
        color: clan.color,
        icon: clan.icon,
        banner: clan.banner
      };
    } catch (error) {
      console.error(`Error getting clan by name ${name} from MongoDB:`, error);
      return memStorage.getClanByName(name);
    }
  }
  
  async updateClan(clanId: number, updates: Partial<Clan>): Promise<Clan | undefined> {
    try {
      const clan = await ClanModel.findOneAndUpdate({ id: clanId }, updates, { new: true });
      if (!clan) return undefined;
      return {
        id: clan.id,
        name: clan.name,
        description: clan.description,
        ownerId: clan.ownerId,
        bank: clan.bank,
        level: clan.level,
        experience: clan.experience || 0,
        memberCount: clan.memberCount,
        warWins: clan.warWins || 0,
        warLosses: clan.warLosses || 0,
        createdAt: clan.createdAt,
        coLeaderIds: clan.coLeaderIds || [],
        memberIds: clan.memberIds || [],
        joinRequests: clan.joinRequests || [],
        maxMembers: clan.maxMembers || 10,
        lastActivity: clan.lastActivity,
        color: clan.color,
        icon: clan.icon,
        banner: clan.banner
      };
    } catch (error) {
      console.error(`Error updating clan ${clanId} in MongoDB:`, error);
      return memStorage.updateClan(clanId, updates);
    }
  }
  
  async createClan(insertClan: InsertClan): Promise<Clan> {
    try {
      // ایجاد یک ID جدید برای کلن
      const lastClan = await ClanModel.findOne().sort('-id');
      const newId = lastClan ? lastClan.id + 1 : 1;
      
      // ساخت کلن جدید
      const newClan = new ClanModel({
        id: newId,
        name: insertClan.name,
        description: insertClan.description || null,
        ownerId: insertClan.ownerId,
        bank: 0,
        level: 1,
        experience: 0,
        memberCount: 1,
        warWins: 0,
        warLosses: 0,
        createdAt: new Date(),
        coLeaderIds: [],
        memberIds: [insertClan.ownerId], // مالک کلن به عنوان عضو اول
        joinRequests: [],
        maxMembers: 10,
        lastActivity: new Date(),
        color: insertClan.color || '#FFD700', // رنگ پیش‌فرض طلایی
        icon: insertClan.icon || '🏰', // آیکون پیش‌فرض قلعه
        banner: insertClan.banner || null
      });
      
      // ذخیره کلن در دیتابیس
      await newClan.save();
      
      // یافتن کاربر و بروزرسانی اطلاعات کلن او
      await UserModel.findOneAndUpdate(
        { discordId: insertClan.ownerId },
        { clanId: newId, clanRole: 'owner' }
      );
      
      // برگرداندن اطلاعات کلن
      return {
        id: newClan.id,
        name: newClan.name,
        description: newClan.description,
        ownerId: newClan.ownerId,
        bank: newClan.bank,
        level: newClan.level,
        experience: newClan.experience || 0,
        memberCount: newClan.memberCount,
        warWins: newClan.warWins || 0,
        warLosses: newClan.warLosses || 0,
        createdAt: newClan.createdAt,
        coLeaderIds: newClan.coLeaderIds || [],
        memberIds: newClan.memberIds || [],
        joinRequests: newClan.joinRequests || [],
        maxMembers: newClan.maxMembers || 10,
        lastActivity: newClan.lastActivity,
        color: newClan.color,
        icon: newClan.icon,
        banner: newClan.banner
      };
    } catch (error) {
      console.error('Error creating clan in MongoDB:', error);
      return memStorage.createClan(insertClan);
    }
  }
  
  async addUserToClan(userId: number, clanId: number): Promise<boolean> {
    try {
      // بررسی وجود کاربر
      const user = await UserModel.findById(userId);
      if (!user) {
        console.log(`User not found with id ${userId}`);
        return memStorage.addUserToClan(userId, clanId);
      }
      
      // بررسی وجود کلن
      const clan = await ClanModel.findOne({ id: clanId });
      if (!clan) {
        console.log(`Clan not found with id ${clanId}`);
        return memStorage.addUserToClan(userId, clanId);
      }
      
      // خارج کردن کاربر از کلن فعلی اگر عضو کلنی باشد
      if (user.clanId) {
        const currentClan = await ClanModel.findOne({ id: user.clanId });
        if (currentClan) {
          // کاهش تعداد اعضای کلن قبلی
          currentClan.memberCount -= 1;
          
          // حذف کاربر از memberIds
          if (currentClan.memberIds && Array.isArray(currentClan.memberIds)) {
            currentClan.memberIds = currentClan.memberIds.filter(id => id !== user.discordId);
          }
          
          await currentClan.save();
        }
      }
      
      // افزودن کاربر به کلن جدید
      user.clanId = clanId;
      user.clanRole = 'member';
      
      // افزایش تعداد اعضای کلن جدید
      clan.memberCount += 1;
      
      // افزودن شناسه کاربر به memberIds
      if (!clan.memberIds) clan.memberIds = [];
      if (!clan.memberIds.includes(user.discordId)) {
        clan.memberIds.push(user.discordId);
      }
      
      // بروزرسانی زمان آخرین فعالیت کلن
      clan.lastActivity = new Date();
      
      // ذخیره تغییرات
      await user.save();
      await clan.save();
      
      console.log(`User ${user.username} (${user.discordId}) added to clan ${clan.name} (${clan.id})`);
      return true;
    } catch (error) {
      console.error('Error adding user to clan in MongoDB:', error);
      return memStorage.addUserToClan(userId, clanId);
    }
  }
  
  async removeUserFromClan(userId: number): Promise<boolean> {
    try {
      // بررسی وجود کاربر
      const user = await UserModel.findById(userId);
      if (!user || !user.clanId) {
        return memStorage.removeUserFromClan(userId);
      }
      
      // بررسی وجود کلن
      const clan = await ClanModel.findOne({ id: user.clanId });
      if (clan) {
        // کاهش تعداد اعضای کلن
        clan.memberCount = Math.max(0, clan.memberCount - 1);
        
        // حذف کاربر از memberIds
        if (clan.memberIds && Array.isArray(clan.memberIds)) {
          clan.memberIds = clan.memberIds.filter(id => id !== user.discordId);
        }
        
        // بررسی اگر مالک کلن است
        if (clan.ownerId === user.discordId) {
          // اگر هنوز اعضای دیگری در کلن هستند
          if (clan.memberIds && clan.memberIds.length > 0) {
            // انتخاب اولین معاون به عنوان مالک جدید یا اولین عضو اگر معاونی وجود ندارد
            if (clan.coLeaderIds && clan.coLeaderIds.length > 0) {
              clan.ownerId = clan.coLeaderIds[0];
              // حذف از لیست معاونان
              clan.coLeaderIds = clan.coLeaderIds.filter(id => id !== clan.ownerId);
            } else {
              clan.ownerId = clan.memberIds[0];
            }
            
            // بروزرسانی نقش کاربر جدید
            await UserModel.findOneAndUpdate(
              { discordId: clan.ownerId },
              { clanRole: 'owner' }
            );
          } else {
            // اگر کلن خالی است، آن را حذف کنید
            await ClanModel.deleteOne({ id: user.clanId });
            console.log(`Clan ${clan.name} (${clan.id}) has been deleted as it has no members left`);
            
            // clanId را از کاربر حذف کنید
            user.clanId = null;
            user.clanRole = null;
            await user.save();
            
            return true;
          }
        }
        
        // ذخیره تغییرات کلن
        await clan.save();
      }
      
      // بروزرسانی کاربر
      user.clanId = null;
      user.clanRole = null;
      await user.save();
      
      console.log(`User ${user.username} (${user.discordId}) removed from clan`);
      return true;
    } catch (error) {
      console.error('Error removing user from clan in MongoDB:', error);
      return memStorage.removeUserFromClan(userId);
    }
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return memStorage.getUserTransactions(userId);
  }

  async addToWallet(userId: number, amount: number, transactionType: string = 'deposit', metadata: any = {}): Promise<User | undefined> {
    try {
      // برای حل مشکل اعتبارسنجی از تابع جدید استفاده می‌کنیم
      return await this.safeAddToWallet(userId, amount, transactionType, metadata);
    } catch (error) {
      console.error('Error adding to wallet in MongoDB:', error);
      return memStorage.addToWallet(userId, amount, transactionType, metadata);
    }
  }
  
  /**
   * تابع ایمن برای افزودن سکه به کیف پول کاربر - این تابع برای اجتناب از مشکلات تبدیل نوع داده‌ها طراحی شده است
   * @param userId شناسه کاربر (می‌تواند هر نوعی باشد)
   * @param amount مقدار سکه
   * @param transactionType نوع تراکنش
   * @param metadata داده‌های اضافی
   * @returns 
   */
  async safeAddToWallet(userId: any, amount: number, transactionType: string = 'deposit', metadata: any = {}): Promise<User | undefined> {
    try {
      // سعی کنید با شناسه‌های مختلف پیدا کنید
      let user = null;
      
      // اول با شناسه دیسکورد جستجو کنیم
      if (typeof userId === 'string' && userId.length < 30) { // شناسه دیسکورد معمولاً بین 15 تا 20 کاراکتر است
        user = await UserModel.findOne({ discordId: userId });
        if (user) {
          console.log(`User found by discordId: ${userId}`);
        }
      }
      
      // اگر نتیجه نداد، با شناسه عددی یا رشته‌ای جستجو کنیم
      if (!user) {
        user = await UserModel.findOne({ id: userId });
        if (user) {
          console.log(`User found by id: ${userId}`);
        }
      }
      
      // اگر هنوز پیدا نشده، سعی کنیم با _id پیدا کنیم
      if (!user) {
        try {
          user = await UserModel.findById(userId);
          if (user) {
            console.log(`User found by _id: ${userId}`);
          }
        } catch (e) {
          // خطا را نادیده می‌گیریم - اگر شناسه معتبر MongoDB نباشد
        }
      }
      
      // اگر کاربر پیدا نشد، عملیات را روی حافظه انجام دهیم
      if (!user) {
        console.log(`No user found with id ${userId} in MongoDB, using memory storage`);
        const numericId = typeof userId === 'number' ? userId : parseInt(userId) || Date.now();
        return await memStorage.addToWallet(numericId, amount, transactionType, metadata);
      }
      
      // با Schema.Types.Mixed، نیازی به تبدیل نوع نداریم
      // اما اگر id خالی است، آن را با مقداری پر کنیم
      if (!user.id) {
        const newId = user._id?.toString() || user.discordId || Date.now().toString();
        
        try {
          await UserModel.updateOne(
            { _id: user._id },
            { $set: { id: newId } }
          );
          
          user.id = newId;
          console.log(`Updated user ${user.username} with id: ${newId}`);
        } catch (e) {
          console.warn(`Could not update user id for ${user.username}:`, e);
          // ادامه می‌دهیم حتی اگر به‌روزرسانی شناسه با مشکل مواجه شد
        }
      }
      
      // بروزرسانی کیف پول با روش ایمن updateOne به جای مدل save
      try {
        const updateResult = await UserModel.findOneAndUpdate(
          { discordId: user.discordId },
          { 
            $inc: { wallet: amount },
            $push: { 
              transactions: {
                type: transactionType,
                amount: amount,
                fee: 0,
                timestamp: new Date(),
                ...metadata
              }
            }
          },
          { new: true }
        );
        
        if (updateResult) {
          console.log(`Successfully added ${amount} to wallet of user ${updateResult.username} using findOneAndUpdate`);
          return this.convertMongoUserToUser(updateResult);
        }
      } catch (updateError) {
        console.warn(`Error updating user with findOneAndUpdate: ${updateError}`);
        // در صورت خطا، از روش جایگزین استفاده می‌کنیم
      }
      
      // اگر به هر دلیلی updateOne شکست خورد، از روش اصلی استفاده می‌کنیم
      user.wallet += amount;
      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        type: transactionType,
        amount: amount,
        fee: 0,
        timestamp: new Date(),
        ...metadata
      });
      
      console.log(`Adding ${amount} to wallet of user ${user.username} (${user.discordId}), wallet now: ${user.wallet}`);
      
      try {
        await user.save();
        console.log(`Successfully saved user ${user.username} after adding to wallet`);
        return this.convertMongoUserToUser(user);
      } catch (saveError) {
        console.error('Error saving user after adding to wallet:', saveError);
        return memStorage.addToWallet(user.id, amount, transactionType, metadata);
      }
    } catch (error) {
      console.error(`Error in safeAddToWallet: ${error}`);
      return undefined;
    }
  }

  async addToBank(userId: number, amount: number, transactionType: string = 'deposit', metadata: any = {}): Promise<User | undefined> {
    try {
      // سعی کنید با discordId پیدا کنید (اگر userId یک شناسه دیسکورد است)
      let user = null;
      
      // اگر userId یک رشته است، احتمالاً یک شناسه دیسکورد است
      if (typeof userId === 'string') {
        user = await UserModel.findOne({ discordId: userId });
      }
      
      // اگر هنوز کاربر پیدا نشده، با _id تلاش کنید
      if (!user) {
        try {
          user = await UserModel.findOne({ _id: userId });
        } catch (e) {
          // خطا را نادیده بگیرید
        }
      }
      
      // اگر هنوز پیدا نشد، با id عددی امتحان کنید
      if (!user) {
        user = await UserModel.findOne({ id: userId });
      }
      
      // اگر همچنان پیدا نشد، با UserModel.findById امتحان کنید
      if (!user) {
        try {
          user = await UserModel.findById(userId);
        } catch (e) {
          console.log('Error in findById:', e);
          // خطا را نادیده بگیرید و ادامه دهید
        }
      }
      
      if (!user) {
        console.log(`No user found with id ${userId} in MongoDB`);
        return memStorage.addToBank(userId, amount, transactionType, metadata);
      }
      
      // مطمئن شویم که فیلد id دارای مقدار است
      if (!user.id) {
        // اگر id تنظیم نشده، از _id استفاده کنیم
        if (user._id) {
          user.id = user._id.toString();
          console.log(`Setting missing id field for user ${user.username} to ${user.id}`);
        } else {
          // اگر هیچ شناسه‌ای موجود نیست، از شناسه دیسکورد استفاده کنیم
          user.id = parseInt(user.discordId) || Date.now();
          console.log(`Using fallback ID for user ${user.username}: ${user.id}`);
        }
      }
      
      user.bank += amount;
      
      // ثبت تراکنش
      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        type: transactionType,
        amount: amount,
        fee: 0,
        timestamp: new Date(),
        ...metadata
      });
      
      console.log(`Adding ${amount} to bank of user ${user.username} (${user.discordId}), bank now: ${user.bank}`);
      
      try {
        await user.save();
        console.log(`Successfully saved user ${user.username} after adding to bank`);
        return this.convertMongoUserToUser(user);
      } catch (saveError) {
        console.error('Error saving user after adding to bank:', saveError);
        
        // در صورت خطای اعتبارسنجی، تلاش کنیم با findOneAndUpdate عملیات را انجام دهیم
        console.log('Trying alternative update method...');
        const updatedUser = await UserModel.findOneAndUpdate(
          { discordId: user.discordId },
          { 
            $inc: { bank: amount },
            $push: { 
              transactions: {
                type: transactionType,
                amount: amount,
                fee: 0,
                timestamp: new Date(),
                ...metadata
              }
            }
          },
          { new: true }
        );
        
        if (updatedUser) {
          console.log(`Alternative method succeeded for user ${updatedUser.username}`);
          return this.convertMongoUserToUser(updatedUser);
        } else {
          throw saveError; // رها کردن خطای اصلی اگر روش جایگزین هم شکست خورد
        }
      }
    } catch (error) {
      console.error('Error adding to bank in MongoDB:', error);
      return memStorage.addToBank(userId, amount, transactionType, metadata);
    }
  }

  async transferToBank(userId: number, amount: number, metadata: any = {}): Promise<User | undefined> {
    try {
      // سعی کنید با discordId پیدا کنید (اگر userId یک شناسه دیسکورد است)
      let user = null;
      
      // اگر userId یک رشته است، احتمالاً یک شناسه دیسکورد است
      if (typeof userId === 'string') {
        user = await UserModel.findOne({ discordId: userId });
      }
      
      // اگر هنوز کاربر پیدا نشده، با _id تلاش کنید
      if (!user) {
        try {
          user = await UserModel.findOne({ _id: userId });
        } catch (e) {
          // خطا را نادیده بگیرید
        }
      }
      
      // اگر هنوز پیدا نشد، با id عددی امتحان کنید
      if (!user) {
        user = await UserModel.findOne({ id: userId });
      }
      
      // اگر همچنان پیدا نشد، با UserModel.findById امتحان کنید
      if (!user) {
        try {
          user = await UserModel.findById(userId);
        } catch (e) {
          console.log('Error in findById:', e);
          // خطا را نادیده بگیرید و ادامه دهید
        }
      }
      
      if (!user) {
        console.log(`No user found with id ${userId} in MongoDB`);
        return memStorage.transferToBank(userId, amount, metadata);
      }
      
      // مطمئن شویم که فیلد id دارای مقدار است
      if (!user.id) {
        // اگر id تنظیم نشده، از _id استفاده کنیم
        if (user._id) {
          user.id = user._id.toString();
          console.log(`Setting missing id field for user ${user.username} to ${user.id}`);
        } else {
          // اگر هیچ شناسه‌ای موجود نیست، از شناسه دیسکورد استفاده کنیم
          user.id = parseInt(user.discordId) || Date.now();
          console.log(`Using fallback ID for user ${user.username}: ${user.id}`);
        }
      }
      
      if (user.wallet < amount) {
        return memStorage.transferToBank(userId, amount, metadata);
      }
      
      // محاسبه کارمزد
      const fee = Math.ceil(amount * 0.01); // 1% fee
      const depositAmount = amount - fee;
      
      user.wallet -= amount;
      user.bank += depositAmount;
      
      // ثبت تراکنش
      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        type: 'deposit',
        amount: depositAmount,
        fee: fee,
        timestamp: new Date(),
        ...metadata
      });
      
      console.log(`Transferred ${depositAmount} from wallet to bank for user ${user.username} (${user.discordId}) with fee ${fee}`);
      
      try {
        await user.save();
        console.log(`Successfully saved user ${user.username} after transferring to bank`);
        return this.convertMongoUserToUser(user);
      } catch (saveError) {
        console.error('Error saving user after transferring to bank:', saveError);
        
        // در صورت خطای اعتبارسنجی، تلاش کنیم با findOneAndUpdate عملیات را انجام دهیم
        console.log('Trying alternative update method...');
        const updatedUser = await UserModel.findOneAndUpdate(
          { discordId: user.discordId },
          { 
            $inc: { 
              wallet: -amount,
              bank: depositAmount 
            },
            $push: { 
              transactions: {
                type: 'deposit',
                amount: depositAmount,
                fee: fee,
                timestamp: new Date(),
                ...metadata
              }
            }
          },
          { new: true }
        );
        
        if (updatedUser) {
          console.log(`Alternative method succeeded for user ${updatedUser.username}`);
          return this.convertMongoUserToUser(updatedUser);
        } else {
          throw saveError; // رها کردن خطای اصلی اگر روش جایگزین هم شکست خورد
        }
      }
    } catch (error) {
      console.error('Error transferring to bank in MongoDB:', error);
      return memStorage.transferToBank(userId, amount, metadata);
    }
  }

  async transferToWallet(userId: number, amount: number, metadata: any = {}): Promise<User | undefined> {
    try {
      // سعی کنید با discordId پیدا کنید (اگر userId یک شناسه دیسکورد است)
      let user = null;
      
      // اگر userId یک رشته است، احتمالاً یک شناسه دیسکورد است
      if (typeof userId === 'string') {
        user = await UserModel.findOne({ discordId: userId });
      }
      
      // اگر هنوز کاربر پیدا نشده، با _id تلاش کنید
      if (!user) {
        try {
          user = await UserModel.findOne({ _id: userId });
        } catch (e) {
          // خطا را نادیده بگیرید
        }
      }
      
      // اگر هنوز پیدا نشد، با id عددی امتحان کنید
      if (!user) {
        user = await UserModel.findOne({ id: userId });
      }
      
      // اگر همچنان پیدا نشد، با UserModel.findById امتحان کنید
      if (!user) {
        try {
          user = await UserModel.findById(userId);
        } catch (e) {
          console.log('Error in findById:', e);
          // خطا را نادیده بگیرید و ادامه دهید
        }
      }
      
      if (!user) {
        console.log(`No user found with id ${userId} in MongoDB`);
        return memStorage.transferToWallet(userId, amount, metadata);
      }
      
      // مطمئن شویم که فیلد id دارای مقدار است
      if (!user.id) {
        // اگر id تنظیم نشده، از _id استفاده کنیم
        if (user._id) {
          user.id = user._id.toString();
          console.log(`Setting missing id field for user ${user.username} to ${user.id}`);
        } else {
          // اگر هیچ شناسه‌ای موجود نیست، از شناسه دیسکورد استفاده کنیم
          user.id = parseInt(user.discordId) || Date.now();
          console.log(`Using fallback ID for user ${user.username}: ${user.id}`);
        }
      }
      
      if (user.bank < amount) {
        return memStorage.transferToWallet(userId, amount, metadata);
      }
      
      user.bank -= amount;
      user.wallet += amount;
      
      // ثبت تراکنش
      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        type: 'withdraw',
        amount: amount,
        fee: 0, // برداشت از بانک کارمزد ندارد
        timestamp: new Date(),
        ...metadata
      });
      
      console.log(`Transferred ${amount} from bank to wallet for user ${user.username} (${user.discordId})`);
      
      try {
        await user.save();
        console.log(`Successfully saved user ${user.username} after transferring to wallet`);
        return this.convertMongoUserToUser(user);
      } catch (saveError) {
        console.error('Error saving user after transferring to wallet:', saveError);
        
        // در صورت خطای اعتبارسنجی، تلاش کنیم با findOneAndUpdate عملیات را انجام دهیم
        console.log('Trying alternative update method...');
        const updatedUser = await UserModel.findOneAndUpdate(
          { discordId: user.discordId },
          { 
            $inc: { 
              bank: -amount,
              wallet: amount 
            },
            $push: { 
              transactions: {
                type: 'withdraw',
                amount: amount,
                fee: 0,
                timestamp: new Date(),
                ...metadata
              }
            }
          },
          { new: true }
        );
        
        if (updatedUser) {
          console.log(`Alternative method succeeded for user ${updatedUser.username}`);
          return this.convertMongoUserToUser(updatedUser);
        } else {
          throw saveError; // رها کردن خطای اصلی اگر روش جایگزین هم شکست خورد
        }
      }
    } catch (error) {
      console.error('Error transferring to wallet in MongoDB:', error);
      return memStorage.transferToWallet(userId, amount, metadata);
    }
  }

  // پیاده‌سازی متدهای مربوط به آیتم‌های کاربر و انبار
  async getInventoryItems(userId: number): Promise<InventoryItem[]> {
    try {
      // استفاده از کش برای بهبود عملکرد
      const cachedItems = getCache<InventoryItem[]>('users', `inventory_${userId}`);
      if (cachedItems) {
        return cachedItems;
      }
      
      const user = await UserModel.findById(userId);
      if (!user || !user.inventory || !Array.isArray(user.inventory)) {
        return [];
      }
      
      const result = user.inventory.map(item => ({
        id: item.id,
        itemId: item.itemId,
        quantity: item.quantity,
        purchasedAt: item.purchasedAt,
        expiresAt: item.expiresAt,
        isActive: item.isActive || false,
        activatedAt: item.activatedAt,
        uses: item.uses || 0,
        maxUses: item.maxUses
      }));
      
      // ذخیره در کش برای 5 دقیقه
      setCache('users', `inventory_${userId}`, result);
      
      return result;
    } catch (error) {
      console.error('Error getting inventory items from MongoDB:', error);
      // در صورت خطا، از نسخه حافظه استفاده می‌کنیم
      return memStorage.getInventoryItems(userId);
    }
  }
  
  async addItemToInventory(userId: number, itemId: number, quantity: number = 1): Promise<InventoryItem | undefined> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return undefined;
      
      // یافتن آیتم در دیتابیس
      const item = await ItemModel.findOne({ id: itemId });
      if (!item) return undefined;
      
      // اگر کاربر انبار ندارد، یک انبار خالی ایجاد کنید
      if (!user.inventory) {
        user.inventory = [];
      }
      
      // بررسی آیا آیتم قبلاً در انبار وجود دارد
      const existingItemIndex = user.inventory.findIndex(invItem => 
        invItem.itemId === itemId && (!invItem.expiresAt || new Date(invItem.expiresAt) > new Date()));
      
      let inventoryItem;
      
      if (existingItemIndex >= 0) {
        // به‌روزرسانی آیتم موجود
        user.inventory[existingItemIndex].quantity += quantity;
        inventoryItem = user.inventory[existingItemIndex];
      } else {
        // ایجاد آیتم جدید
        const now = new Date();
        let expiresAt = undefined;
        
        // محاسبه زمان انقضا اگر مدت زمان دارد
        if (item.duration && item.duration > 0) {
          expiresAt = new Date(now.getTime() + item.duration * 24 * 60 * 60 * 1000);
        }
        
        // ایجاد آیتم جدید برای انبار
        inventoryItem = {
          id: Date.now().toString(), // ایجاد ID منحصر به فرد
          itemId: itemId,
          quantity: quantity,
          purchasedAt: now,
          expiresAt: expiresAt,
          isActive: false,
          maxUses: item.maxUses || null,
          uses: 0
        };
        
        user.inventory.push(inventoryItem);
      }
      
      // ذخیره تغییرات
      await user.save();
      
      // پاکسازی کش
      deleteCache('users', `inventory_${userId}`);
      
      return inventoryItem;
    } catch (error) {
      console.error('Error adding item to inventory in MongoDB:', error);
      return memStorage.addItemToInventory(userId, itemId, quantity);
    }
  }
  
  async buyItem(userId: number, itemId: number): Promise<{ success: boolean; item?: Item; inventoryItem?: InventoryItem; message?: string }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return { success: false, message: 'کاربر یافت نشد.' };
      }
      
      const item = await ItemModel.findOne({ id: itemId });
      if (!item) {
        return { success: false, message: 'آیتم یافت نشد.' };
      }
      
      // بررسی قیمت و موجودی کاربر
      if (item.price && user.wallet < item.price) {
        return { success: false, message: `سکه کافی ندارید. این آیتم ${item.price} سکه قیمت دارد.` };
      }
      
      if (item.crystalPrice && (!user.crystals || user.crystals < item.crystalPrice)) {
        return { success: false, message: `کریستال کافی ندارید. این آیتم ${item.crystalPrice} کریستال قیمت دارد.` };
      }
      
      // کسر هزینه از کاربر
      if (item.price) {
        user.wallet -= item.price;
      }
      
      if (item.crystalPrice) {
        user.crystals = (user.crystals || 0) - item.crystalPrice;
      }
      
      // اضافه کردن آیتم به انبار
      const inventoryItem = await this.addItemToInventory(userId, itemId);
      
      // ذخیره تغییرات کاربر
      await user.save();
      
      // ثبت تراکنش
      if (item.price) {
        await this.createTransaction({
          userId: userId,
          amount: -item.price,
          type: 'purchase',
          description: `خرید ${item.name}`,
          timestamp: new Date()
        });
      }
      
      return { 
        success: true, 
        item: {
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description,
          price: item.price,
          crystalPrice: item.crystalPrice,
          emoji: item.emoji,
          duration: item.duration,
          rarity: item.rarity,
          effects: item.effects,
          category: item.category
        }, 
        inventoryItem 
      };
    } catch (error) {
      console.error('Error buying item in MongoDB:', error);
      return memStorage.buyItem(userId, itemId);
    }
  }
  
  async useItem(userId: number, inventoryItemId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.inventory) {
        return { success: false, message: 'کاربر یا انبار یافت نشد.' };
      }
      
      // پیدا کردن آیتم در انبار
      const inventoryItemIndex = user.inventory.findIndex(item => item.id === inventoryItemId);
      if (inventoryItemIndex === -1) {
        return { success: false, message: 'آیتم در انبار شما یافت نشد.' };
      }
      
      const inventoryItem = user.inventory[inventoryItemIndex];
      
      // بررسی مقدار
      if (inventoryItem.quantity <= 0) {
        return { success: false, message: 'تعداد آیتم صفر است.' };
      }
      
      // بررسی انقضا
      if (inventoryItem.expiresAt && new Date(inventoryItem.expiresAt) < new Date()) {
        return { success: false, message: 'این آیتم منقضی شده است.' };
      }
      
      // بررسی حداکثر استفاده
      if (inventoryItem.maxUses && inventoryItem.uses >= inventoryItem.maxUses) {
        return { success: false, message: 'حداکثر استفاده از این آیتم به پایان رسیده است.' };
      }
      
      // به روزرسانی وضعیت آیتم
      inventoryItem.isActive = true;
      inventoryItem.activatedAt = new Date();
      inventoryItem.uses = (inventoryItem.uses || 0) + 1;
      
      // کسر تعداد
      inventoryItem.quantity -= 1;
      
      // اگر تعداد صفر شد، آیتم را حذف کنید
      if (inventoryItem.quantity <= 0) {
        user.inventory.splice(inventoryItemIndex, 1);
      }
      
      // ذخیره تغییرات
      await user.save();
      
      // پاکسازی کش
      deleteCache('users', `inventory_${userId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error using item in MongoDB:', error);
      return memStorage.useItem(userId, inventoryItemId);
    }
  }
  
  // پیاده‌سازی متدهای مربوط به دوستی
  async getFriends(userId: number): Promise<Friend[]> {
    try {
      const cachedFriends = getCache<Friend[]>('users', `friends_${userId}`);
      if (cachedFriends) {
        return cachedFriends;
      }
      
      const user = await UserModel.findById(userId);
      if (!user || !user.friends || !Array.isArray(user.friends)) {
        return [];
      }
      
      const result = user.friends.map(f => ({
        id: f.id,
        userId: f.userId,
        friendId: f.friendId,
        status: f.status,
        createdAt: f.createdAt,
        lastInteraction: f.lastInteraction,
        level: f.level,
        xp: f.xp,
        isBestFriend: f.isBestFriend || false
      }));
      
      setCache('users', `friends_${userId}`, result);
      return result;
    } catch (error) {
      console.error('Error getting friends from MongoDB:', error);
      return memStorage.getFriends(userId);
    }
  }
  
  async recordFriendshipActivity(userId: number, friendId: number, type: string, details: string, xpEarned: number): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return false;
      
      if (!user.friendActivities) {
        user.friendActivities = [];
      }
      
      const activity = {
        id: Date.now().toString(),
        userId,
        friendId,
        type,
        details,
        xpEarned,
        timestamp: new Date()
      };
      
      user.friendActivities.push(activity);
      await user.save();
      
      // پاکسازی کش
      deleteCache('users', `friends_${userId}`);
      deleteCache('users', `friendship_activities_${userId}_${friendId}`);
      
      return true;
    } catch (error) {
      console.error('Error recording friendship activity in MongoDB:', error);
      return memStorage.recordFriendshipActivity(userId, friendId, type, details, xpEarned);
    }
  }
  
  async updateFriendshipXP(userId: number, friendId: string, xp: number): Promise<{ leveledUp: boolean, newLevel?: number }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.friends) {
        return { leveledUp: false };
      }
      
      const friendIndex = user.friends.findIndex(f => f.friendId.toString() === friendId);
      if (friendIndex === -1) {
        return { leveledUp: false };
      }
      
      // به‌روزرسانی XP
      const currentLevel = user.friends[friendIndex].level || 1;
      const currentXP = user.friends[friendIndex].xp || 0;
      const newXP = currentXP + xp;
      
      // محاسبه سطح جدید بر اساس XP
      // فرمول: هر سطح 100 * سطح فعلی XP نیاز دارد
      const xpForNextLevel = currentLevel * 100;
      const leveledUp = newXP >= xpForNextLevel;
      let newLevel = currentLevel;
      
      if (leveledUp) {
        newLevel = currentLevel + 1;
      }
      
      // به‌روزرسانی اطلاعات دوستی
      user.friends[friendIndex].xp = newXP;
      if (leveledUp) {
        user.friends[friendIndex].level = newLevel;
      }
      
      // ذخیره تغییرات
      await user.save();
      
      // پاکسازی کش
      deleteCache('users', `friends_${userId}`);
      
      return { leveledUp, newLevel: leveledUp ? newLevel : undefined };
    } catch (error) {
      console.error('Error updating friendship XP in MongoDB:', error);
      return memStorage.updateFriendshipXP(userId, friendId, xp);
    }
  }

  // متدهای مربوط به ماموریت‌های کاربر
  async getUserQuests(userId: number): Promise<{quest: Quest, userQuest: UserQuest}[]> {
    try {
      const cachedUserQuests = getCache<{quest: Quest, userQuest: UserQuest}[]>('users', `quests_${userId}`);
      if (cachedUserQuests) {
        return cachedUserQuests;
      }
      
      const user = await UserModel.findById(userId);
      if (!user || !user.quests || !Array.isArray(user.quests)) {
        return [];
      }
      
      // دریافت تمام ماموریت‌ها
      const allQuests = await QuestModel.find();
      const questMap = new Map<number, Quest>();
      allQuests.forEach(q => {
        questMap.set(q.id, {
          id: q.id,
          title: q.title,
          description: q.description,
          type: q.type,
          requirement: q.requirement,
          targetAmount: q.targetAmount,
          reward: q.reward,
          category: q.category,
          active: q.active,
          minLevel: q.minLevel
        });
      });
      
      // ترکیب ماموریت‌ها با پیشرفت کاربر
      const result = user.quests
        .filter(uq => questMap.has(uq.questId))
        .map(uq => ({
          quest: questMap.get(uq.questId)!,
          userQuest: {
            questId: uq.questId,
            progress: uq.progress,
            completed: uq.completed,
            claimed: uq.claimed,
            updatedAt: uq.updatedAt
          }
        }));
      
      setCache('users', `quests_${userId}`, result);
      return result;
    } catch (error) {
      console.error('Error getting user quests from MongoDB:', error);
      return memStorage.getUserQuests(userId);
    }
  }
  
  async updateQuestProgress(userId: number, questId: number, progress: number): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return false;
      
      // دریافت ماموریت برای بررسی هدف
      const quest = await QuestModel.findOne({ id: questId });
      if (!quest || !quest.active) return false;
      
      // اگر کاربر هنوز این ماموریت را ندارد، آن را اضافه کنید
      if (!user.quests) {
        user.quests = [];
      }
      
      const questIndex = user.quests.findIndex(q => q.questId === questId);
      let userQuest;
      
      if (questIndex >= 0) {
        userQuest = user.quests[questIndex];
        
        // اگر قبلاً تکمیل شده، نیازی به به‌روزرسانی نیست
        if (userQuest.completed && userQuest.claimed) {
          return true;
        }
        
        // به‌روزرسانی پیشرفت
        userQuest.progress += progress;
        userQuest.updatedAt = new Date();
        
        // بررسی تکمیل ماموریت
        if (userQuest.progress >= quest.targetAmount && !userQuest.completed) {
          userQuest.completed = true;
        }
      } else {
        // ایجاد رکورد جدید برای ماموریت کاربر
        userQuest = {
          questId: questId,
          progress: progress,
          completed: progress >= quest.targetAmount,
          claimed: false,
          updatedAt: new Date()
        };
        user.quests.push(userQuest);
      }
      
      // ذخیره تغییرات
      await user.save();
      
      // پاکسازی کش
      deleteCache('users', `quests_${userId}`);
      
      return true;
    } catch (error) {
      console.error('Error updating quest progress in MongoDB:', error);
      return memStorage.updateQuestProgress(userId, questId, progress);
    }
  }

  // برای سایر متدها، از نسخه MemStorage استفاده می‌کنیم
  // این امکان را می‌دهد که در آینده به تدریج به MongoDB منتقل شوند
  async addCrystals(userId: number, amount: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return undefined;
      
      user.crystals = (user.crystals || 0) + amount;
      await user.save();
      
      return this.convertMongoUserToUser(user);
    } catch (error) {
      console.error('Error adding crystals in MongoDB:', error);
      return memStorage.addCrystals(userId, amount);
    }
  }

  async transferCoin(fromUserId: number, toUserId: number, amount: number): Promise<boolean> {
    try {
      const fromUser = await UserModel.findById(fromUserId);
      const toUser = await UserModel.findById(toUserId);
      
      if (!fromUser || !toUser) return false;
      
      if (fromUser.wallet < amount) return false;
      
      // انجام انتقال
      fromUser.wallet -= amount;
      toUser.wallet += amount;
      
      // ذخیره تغییرات
      await fromUser.save();
      await toUser.save();
      
      // ثبت تراکنش‌ها
      await this.createTransaction({
        userId: fromUserId,
        amount: -amount,
        type: 'transfer_out',
        description: `انتقال به ${toUser.username}`,
        timestamp: new Date(),
        targetUserId: toUserId
      });
      
      await this.createTransaction({
        userId: toUserId,
        amount: amount,
        type: 'transfer_in',
        description: `دریافت از ${fromUser.username}`,
        timestamp: new Date(),
        targetUserId: fromUserId
      });
      
      return true;
    } catch (error) {
      console.error('Error transferring coin in MongoDB:', error);
      return memStorage.transferCoin(fromUserId, toUserId, amount);
    }
  }

  // ... سایر متدهای IStorage که فعلاً از memStorage استفاده می‌کنند
  async getTipChannelSettings(guildId: string): Promise<TipChannelSettings | undefined> {
    try {
      const settings = await TipChannelModel.findOne({ guildId });
      if (!settings) return undefined;
      
      return {
        guildId: settings.guildId,
        channelId: settings.channelId,
        interval: settings.interval,
        lastTipTime: settings.lastTipTime?.getTime(),
        isActive: settings.isActive
      };
    } catch (error) {
      console.error('Error getting tip channel settings from MongoDB:', error);
      return memStorage.getTipChannelSettings(guildId);
    }
  }

  async setTipChannelSettings(settings: TipChannelSettings): Promise<boolean> {
    try {
      await TipChannelModel.findOneAndUpdate(
        { guildId: settings.guildId }, 
        settings, 
        { upsert: true, new: true }
      );
      return true;
    } catch (error) {
      console.error('Error setting tip channel settings in MongoDB:', error);
      return memStorage.setTipChannelSettings(settings);
    }
  }

  async getAllActiveTipChannelSettings(): Promise<TipChannelSettings[]> {
    try {
      const settings = await TipChannelModel.find({ isActive: true });
      return settings.map(s => ({
        guildId: s.guildId,
        channelId: s.channelId,
        interval: s.interval,
        lastTipTime: s.lastTipTime?.getTime(),
        isActive: s.isActive
      }));
    } catch (error) {
      console.error('Error getting active tip channel settings from MongoDB:', error);
      return memStorage.getAllActiveTipChannelSettings();
    }
  }

  // تمام متدهای دیگر IStorage را اضافه کنید
  // برای حفظ طول کد، همه متدها را اینجا اضافه نکردیم
  // متدهای باقیمانده به memStorage ارجاع داده می‌شوند

  // ========================
  // متدهای مربوط به QuizQuestion
  // ========================
  
  async saveQuizQuestion(question: QuizQuestion): Promise<QuizQuestion> {
    try {
      const newQuestion = new QuizQuestionModel(question);
      await newQuestion.save();
      return newQuestion;
    } catch (error) {
      console.error('Error saving quiz question to MongoDB:', error);
      return memStorage.saveQuizQuestion(question);
    }
  }

  async getApprovedQuizQuestions(category?: string, difficulty?: 'easy' | 'medium' | 'hard', limit?: number): Promise<QuizQuestion[]> {
    try {
      let query = QuizQuestionModel.find({ approved: true });
      
      if (category) {
        query = query.where('category').equals(category);
      }
      
      if (difficulty) {
        query = query.where('difficulty').equals(difficulty);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query.exec();
    } catch (error) {
      console.error('Error getting approved quiz questions from MongoDB:', error);
      return memStorage.getApprovedQuizQuestions(category, difficulty, limit);
    }
  }

  async getPendingQuizQuestions(limit?: number): Promise<QuizQuestion[]> {
    try {
      let query = QuizQuestionModel.find({ approved: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query.exec();
    } catch (error) {
      console.error('Error getting pending quiz questions from MongoDB:', error);
      return memStorage.getPendingQuizQuestions(limit);
    }
  }

  async approveQuizQuestion(questionId: string, reviewerId: string): Promise<QuizQuestion | undefined> {
    try {
      const question = await QuizQuestionModel.findOne({ id: questionId });
      if (!question) return undefined;
      
      question.approved = true;
      question.approvedBy = reviewerId;
      
      await question.save();
      
      // اگر اضافه‌کننده وجود داشته باشد، پاداش به او داده می‌شود
      if (question.addedBy) {
        const user = await UserModel.findOne({ discordId: question.addedBy });
        if (user) {
          user.wallet += (question.reward || 50);
          await user.save();
        }
      }
      
      // به‌روزرسانی آمار داور
      const reviewer = await QuizReviewerModel.findOne({ userId: reviewerId });
      if (reviewer) {
        reviewer.totalReviewed += 1;
        reviewer.totalApproved += 1;
        reviewer.lastActivity = new Date();
        await reviewer.save();
      }
      
      return question;
    } catch (error) {
      console.error('Error approving quiz question in MongoDB:', error);
      return memStorage.approveQuizQuestion(questionId, reviewerId);
    }
  }

  async rejectQuizQuestion(questionId: string, reviewerId: string): Promise<boolean> {
    try {
      const question = await QuizQuestionModel.findOne({ id: questionId });
      if (!question) return false;
      
      await QuizQuestionModel.deleteOne({ id: questionId });
      
      // به‌روزرسانی آمار داور
      const reviewer = await QuizReviewerModel.findOne({ userId: reviewerId });
      if (reviewer) {
        reviewer.totalReviewed += 1;
        reviewer.totalRejected += 1;
        reviewer.lastActivity = new Date();
        await reviewer.save();
      }
      
      return true;
    } catch (error) {
      console.error('Error rejecting quiz question in MongoDB:', error);
      return memStorage.rejectQuizQuestion(questionId, reviewerId);
    }
  }

  async getQuizQuestion(questionId: string): Promise<QuizQuestion | undefined> {
    try {
      const question = await QuizQuestionModel.findOne({ id: questionId });
      return question || undefined;
    } catch (error) {
      console.error('Error getting quiz question from MongoDB:', error);
      return memStorage.getQuizQuestion(questionId);
    }
  }

  async getUserSubmittedQuestions(userId: string): Promise<QuizQuestion[]> {
    try {
      return await QuizQuestionModel.find({ addedBy: userId });
    } catch (error) {
      console.error('Error getting user submitted questions from MongoDB:', error);
      return memStorage.getUserSubmittedQuestions(userId);
    }
  }

  // ========================
  // متدهای مربوط به QuizReviewer
  // ========================
  
  async addQuizReviewer(reviewer: QuizReviewer): Promise<QuizReviewer> {
    try {
      const newReviewer = new QuizReviewerModel({
        userId: reviewer.userId,
        username: reviewer.username,
        appointedAt: reviewer.appointedAt || new Date(),
        appointedBy: reviewer.appointedBy,
        totalReviewed: 0,
        totalApproved: 0,
        totalRejected: 0,
        isActive: true,
        lastActivity: new Date()
      });
      
      await newReviewer.save();
      return newReviewer;
    } catch (error) {
      console.error('Error adding quiz reviewer to MongoDB:', error);
      return memStorage.addQuizReviewer(reviewer);
    }
  }

  async removeQuizReviewer(userId: string): Promise<boolean> {
    try {
      const result = await QuizReviewerModel.deleteOne({ userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error removing quiz reviewer from MongoDB:', error);
      return memStorage.removeQuizReviewer(userId);
    }
  }

  async getAllQuizReviewers(): Promise<QuizReviewer[]> {
    try {
      return await QuizReviewerModel.find();
    } catch (error) {
      console.error('Error getting all quiz reviewers from MongoDB:', error);
      return memStorage.getAllQuizReviewers();
    }
  }

  async getActiveQuizReviewers(): Promise<QuizReviewer[]> {
    try {
      return await QuizReviewerModel.find({ isActive: true });
    } catch (error) {
      console.error('Error getting active quiz reviewers from MongoDB:', error);
      return memStorage.getActiveQuizReviewers();
    }
  }

  async isQuizReviewer(userId: string): Promise<boolean> {
    try {
      const reviewer = await QuizReviewerModel.findOne({ userId, isActive: true });
      return !!reviewer;
    } catch (error) {
      console.error('Error checking if user is quiz reviewer in MongoDB:', error);
      return memStorage.isQuizReviewer(userId);
    }
  }

  // ========================
  // متدهای مربوط به GameSession
  // ========================
  
  async createGameSession(gameSession: GameSession): Promise<GameSession> {
    try {
      const newSession = new GameSessionModel(gameSession);
      await newSession.save();
      return newSession;
    } catch (error) {
      console.error('Error creating game session in MongoDB:', error);
      return memStorage.createGameSession(gameSession);
    }
  }

  async updateGameSession(sessionId: string, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    try {
      // اضافه کردن updatedAt به روزرسانی اگر ارائه نشده باشد
      if (!updates.updatedAt) {
        updates.updatedAt = new Date();
      }
      
      const session = await GameSessionModel.findOneAndUpdate(
        { gameId: sessionId },
        updates,
        { new: true }
      );
      return session || undefined;
    } catch (error) {
      console.error('Error updating game session in MongoDB:', error);
      return memStorage.updateGameSession(sessionId, updates);
    }
  }

  async getGameSession(sessionId: string): Promise<GameSession | undefined> {
    try {
      const session = await GameSessionModel.findOne({ id: sessionId });
      return session || undefined;
    } catch (error) {
      console.error('Error getting game session from MongoDB:', error);
      return memStorage.getGameSession(sessionId);
    }
  }

  async getActiveGameSessionInChannel(channelId: string): Promise<GameSession | undefined> {
    try {
      const session = await GameSessionModel.findOne({
        channelId,
        status: { $in: ['waiting', 'active'] }
      });
      return session || undefined;
    } catch (error) {
      console.error('Error getting active game session in channel from MongoDB:', error);
      return memStorage.getActiveGameSessionInChannel(channelId);
    }
  }

  async getAllActiveGameSessions(): Promise<GameSession[]> {
    try {
      return await GameSessionModel.find({ status: { $in: ['waiting', 'active'] } });
    } catch (error) {
      console.error('Error getting all active game sessions from MongoDB:', error);
      return memStorage.getAllActiveGameSessions();
    }
  }
  
  async getActiveGameSessions(channelId?: string): Promise<GameSession[]> {
    try {
      const query: any = { status: { $in: ['waiting', 'active'] } };
      if (channelId) {
        query.channelId = channelId;
      }
      return await GameSessionModel.find(query);
    } catch (error) {
      console.error('Error getting active game sessions from MongoDB:', error);
      return memStorage.getActiveGameSessions(channelId);
    }
  }

  async deleteGameSession(sessionId: string): Promise<boolean> {
    try {
      const result = await GameSessionModel.deleteOne({ id: sessionId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting game session from MongoDB:', error);
      return memStorage.deleteGameSession(sessionId);
    }
  }

  async addPlayerToGameSession(sessionId: string, playerId: string): Promise<GameSession | undefined> {
    try {
      const session = await GameSessionModel.findOne({ id: sessionId });
      if (!session) return undefined;
      
      if (!session.players.includes(playerId)) {
        session.players.push(playerId);
        await session.save();
      }
      
      return session;
    } catch (error) {
      console.error('Error adding player to game session in MongoDB:', error);
      return memStorage.addPlayerToGameSession(sessionId, playerId);
    }
  }

  async removePlayerFromGameSession(sessionId: string, playerId: string): Promise<GameSession | undefined> {
    try {
      const session = await GameSessionModel.findOne({ id: sessionId });
      if (!session) return undefined;
      
      session.players = session.players.filter(id => id !== playerId);
      await session.save();
      
      return session;
    } catch (error) {
      console.error('Error removing player from game session in MongoDB:', error);
      return memStorage.removePlayerFromGameSession(sessionId, playerId);
    }
  }

  async endGameSession(id: string): Promise<boolean> {
    try {
      const session = await GameSessionModel.findOne({ gameId: id });
      if (!session) return false;
      
      session.status = 'ended';
      session.endedAt = new Date();
      await session.save();
      
      return true;
    } catch (error) {
      console.error('Error ending game session in MongoDB:', error);
      return memStorage.endGameSession(id);
    }
  }

  async appointQuizReviewer(userId: string, username: string, appointedBy: string): Promise<QuizReviewer> {
    try {
      const newReviewer = new QuizReviewerModel({
        userId,
        username,
        appointedAt: new Date(),
        appointedBy,
        totalReviewed: 0,
        totalApproved: 0,
        totalRejected: 0,
        isActive: true,
        lastActivity: new Date()
      });
      
      await newReviewer.save();
      return newReviewer;
    } catch (error) {
      console.error('Error appointing quiz reviewer in MongoDB:', error);
      return memStorage.appointQuizReviewer(userId, username, appointedBy);
    }
  }

  async getQuizReviewerByUserId(userId: string): Promise<QuizReviewer | undefined> {
    try {
      const reviewer = await QuizReviewerModel.findOne({ userId });
      return reviewer || undefined;
    } catch (error) {
      console.error('Error getting quiz reviewer by user ID from MongoDB:', error);
      return memStorage.getQuizReviewerByUserId(userId);
    }
  }

  // AI Assistant operations - پیاده‌سازی متدهای مربوط به دستیار هوش مصنوعی
  async getUserAIAssistantDetails(userId: number | string): Promise<{subscription: boolean, subscriptionTier: string, subscriptionExpires: Date | null, questionsRemaining: number, totalQuestions: number} | undefined> {
    try {
      // لاگ برای دیباگ
      console.log(`Getting AI Assistant details for UserID type: ${typeof userId}, value: ${userId}`);
      
      // استفاده از فیلترهای مختلف برای یافتن کاربر
      const userIdStr = String(userId);
      const userQuery = {
        $or: [
          { discordId: userIdStr },
          { id: typeof userId === 'number' ? userId : parseInt(userIdStr, 10) }
        ]
      };
      
      // اگر ObjectId معتبر است، آن را نیز اضافه کنیم
      if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
        userQuery.$or.push({ _id: new mongoose.Types.ObjectId(userId) });
      }
      
      console.log('User query:', JSON.stringify(userQuery));
      let user = await UserModel.findOne(userQuery);
      
      if (!user) {
        console.warn(`User not found for AI assistant with ID ${userId}`);
        return undefined;
      }
      
      console.log(`User found: ${user.username} (ID: ${user._id}, DiscordID: ${user.discordId})`);
      
      // اگر فیلد aiAssistant وجود نداشت، مقدار پیش‌فرض برگردان
      if (!user.aiAssistant) {
        console.log(`Creating default AI assistant settings for user ${user.username}`);
        user.aiAssistant = {
          subscription: false,
          subscriptionTier: 'free',
          subscriptionExpires: null,
          questionsRemaining: 5,
          totalQuestions: 5
        };
        
        // ذخیره تغییرات
        await user.save();
      } else {
        // بررسی اعتبار اشتراک فعلی
        if (user.aiAssistant.subscription && user.aiAssistant.subscriptionExpires) {
          const now = new Date();
          if (now > user.aiAssistant.subscriptionExpires) {
            console.log(`Subscription expired for user ${user.username}. Expiry: ${user.aiAssistant.subscriptionExpires}`);
            // اشتراک منقضی شده است
            user.aiAssistant.subscription = false;
            user.aiAssistant.subscriptionTier = 'free';
            await user.save();
          } else {
            console.log(`Valid subscription found for user ${user.username}. Expires: ${user.aiAssistant.subscriptionExpires}`);
          }
        }
      }
      
      return user.aiAssistant;
    } catch (error) {
      console.error('Error getting AI assistant details from MongoDB:', error);
      return memStorage.getUserAIAssistantDetails(typeof userId === 'number' ? userId : parseInt(userId as string, 10));
    }
  }
  
  async useAIAssistantQuestion(userId: number | string): Promise<boolean> {
    try {
      // لاگ برای دیباگ
      console.log(`Using AI Assistant question for UserID type: ${typeof userId}, value: ${userId}`);
      
      // استفاده از فیلترهای مختلف برای یافتن کاربر
      const userIdStr = String(userId);
      const userQuery = {
        $or: [
          { discordId: userIdStr },
          { id: typeof userId === 'number' ? userId : parseInt(userIdStr, 10) }
        ]
      };
      
      // اگر ObjectId معتبر است، آن را نیز اضافه کنیم
      if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
        userQuery.$or.push({ _id: new mongoose.Types.ObjectId(userId) });
      }
      
      console.log('User query:', JSON.stringify(userQuery));
      let user = await UserModel.findOne(userQuery);
      
      if (!user) {
        console.warn(`User not found for AI assistant question with ID ${userId}`);
        return false;
      }
      
      console.log(`User found: ${user.username} (ID: ${user._id}, DiscordID: ${user.discordId})`);
      
      // مطمئن شویم که فیلد aiAssistant وجود دارد
      if (!user.aiAssistant) {
        console.log(`Creating default AI assistant settings for user ${user.username}`);
        user.aiAssistant = {
          subscription: false,
          subscriptionTier: 'free',
          subscriptionExpires: null,
          questionsRemaining: 5,
          totalQuestions: 5
        };
      }
      
      // بررسی اشتراک کاربر
      if (user.aiAssistant.subscription) {
        // بررسی تاریخ انقضای اشتراک
        if (user.aiAssistant.subscriptionExpires && new Date() > user.aiAssistant.subscriptionExpires) {
          console.log(`Subscription expired for user ${user.username}. Expiry: ${user.aiAssistant.subscriptionExpires}`);
          // اشتراک منقضی شده
          user.aiAssistant.subscription = false;
          user.aiAssistant.subscriptionTier = 'free';
          user.aiAssistant.questionsRemaining = 5;
          user.aiAssistant.totalQuestions = 5;
        } else {
          console.log(`User has valid subscription. Returning true.`);
          // اشتراک معتبر است، کاربر می‌تواند بدون محدودیت سوال بپرسد
          await user.save();
          return true;
        }
      }
      
      // کاربر اشتراک ندارد، بررسی تعداد سوالات باقی‌مانده
      if (user.aiAssistant.questionsRemaining <= 0) {
        console.log(`User has no remaining questions. Returning false.`);
        return false; // سوالات تمام شده‌اند
      }
      
      console.log(`User has ${user.aiAssistant.questionsRemaining} questions remaining. Decrementing by 1.`);
      // کم کردن یک سوال از تعداد سوالات باقی‌مانده
      user.aiAssistant.questionsRemaining--;
      
      // ذخیره تغییرات
      await user.save();
      console.log(`Updated questions remaining to ${user.aiAssistant.questionsRemaining}. Returning true.`);
      
      return true;
    } catch (error) {
      console.error('Error using AI assistant question in MongoDB:', error);
      return memStorage.useAIAssistantQuestion(typeof userId === 'number' ? userId : parseInt(userId as string, 10));
    }
  }
  
  async subscribeToAIAssistant(userId: number | string, tier: 'weekly' | 'monthly', amountPaid: number): Promise<boolean> {
    try {
      // ابتدا با discordId جستجو کنیم (این معمولاً همان userId است که از طرف دیسکورد می‌آید)
      let userQuery;
      const userIdStr = String(userId);
      
      // لاگ برای دیباگ
      console.log(`Subscribing to AI Assistant. UserID type: ${typeof userId}, value: ${userId}`);

      // استفاده از فیلترهای مختلف برای یافتن کاربر
      userQuery = {
        $or: [
          { discordId: userIdStr },
          { id: typeof userId === 'number' ? userId : parseInt(userIdStr, 10) }
        ]
      };
      
      // اگر ObjectId معتبر است، آن را نیز اضافه کنیم
      if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
        userQuery.$or.push({ _id: new mongoose.Types.ObjectId(userId) });
      }
      
      console.log('User query:', JSON.stringify(userQuery));
      let user = await UserModel.findOne(userQuery);
      
      if (!user) {
        console.warn(`User not found for AI assistant subscription with ID ${userId}`);
        return false;
      }
      
      console.log(`User found: ${user.username} (ID: ${user._id}, DiscordID: ${user.discordId})`);
      
      // مطمئن شویم که فیلد aiAssistant وجود دارد
      if (!user.aiAssistant) {
        user.aiAssistant = {
          subscription: false,
          subscriptionTier: 'free',
          subscriptionExpires: null,
          questionsRemaining: 5,
          totalQuestions: 5
        };
      }
      
      // تنظیم تاریخ انقضا بر اساس نوع اشتراک
      const now = new Date();
      let expiresAt = new Date(now);
      
      if (tier === 'weekly') {
        // یک هفته اضافه می‌کنیم
        expiresAt.setDate(now.getDate() + 7);
      } else if (tier === 'monthly') {
        // یک ماه اضافه می‌کنیم
        expiresAt.setDate(now.getDate() + 30);
      }
      
      console.log(`Setting subscription expiry to: ${expiresAt.toISOString()}`);
      
      // روش ۱: به‌روزرسانی با استفاده از updateOne برای اطمینان از اعمال تغییرات
      const updateResult = await UserModel.updateOne(
        { _id: user._id },
        { 
          $set: { 
            'aiAssistant.subscription': true,
            'aiAssistant.subscriptionTier': tier,
            'aiAssistant.subscriptionExpires': expiresAt
          },
          $push: {
            transactions: {
              type: 'ai_subscription',
              amount: -amountPaid,
              fee: 0,
              timestamp: now,
              details: {
                tier: tier,
                expiresAt: expiresAt
              }
            }
          },
          $inc: { wallet: -amountPaid }
        }
      );
      
      console.log('Update result:', JSON.stringify(updateResult));
      
      // روش ۲: همچنین به صورت مستقیم روی آبجکت عمل می‌کنیم (در صورتی که روش قبل با مشکل مواجه شود)
      user.aiAssistant.subscription = true;
      user.aiAssistant.subscriptionTier = tier;
      user.aiAssistant.subscriptionExpires = expiresAt;
      
      // ثبت تراکنش خرید اشتراک
      user.transactions = user.transactions || [];
      user.transactions.push({
        type: 'ai_subscription',
        amount: -amountPaid,
        fee: 0,
        timestamp: now,
        details: {
          tier: tier,
          expiresAt: expiresAt
        }
      });
      
      // کم کردن هزینه اشتراک از کیف پول کاربر
      user.wallet -= amountPaid;
      if (user.wallet < 0) {
        user.wallet = 0; // برای اطمینان از اینکه موجودی منفی نشود
      }
      
      // ذخیره تغییرات
      await user.save();
      
      // بررسی نهایی برای اطمینان از اعمال تغییرات
      const verifiedUser = await UserModel.findById(user._id);
      if (verifiedUser && verifiedUser.aiAssistant && verifiedUser.aiAssistant.subscription) {
        console.log('Subscription successfully verified after update');
        return true;
      } else {
        console.warn('Could not verify subscription update, but operation completed');
        return updateResult.modifiedCount > 0;
      }
    } catch (error) {
      console.error('Error subscribing to AI assistant in MongoDB:', error);
      return memStorage.subscribeToAIAssistant(typeof userId === 'number' ? userId : parseInt(String(userId), 10), tier, amountPaid);
    }
  }
  
  async resetAIAssistantQuestions(userId: number | string): Promise<boolean> {
    try {
      // لاگ برای دیباگ
      console.log(`Resetting AI Assistant questions for UserID type: ${typeof userId}, value: ${userId}`);
      
      // استفاده از فیلترهای مختلف برای یافتن کاربر
      const userIdStr = String(userId);
      const userQuery = {
        $or: [
          { discordId: userIdStr },
          { id: typeof userId === 'number' ? userId : parseInt(userIdStr, 10) }
        ]
      };
      
      // اگر ObjectId معتبر است، آن را نیز اضافه کنیم
      if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
        userQuery.$or.push({ _id: new mongoose.Types.ObjectId(userId) });
      }
      
      console.log('User query:', JSON.stringify(userQuery));
      let user = await UserModel.findOne(userQuery);
      
      if (!user) {
        console.warn(`User not found for AI assistant reset questions with ID ${userId}`);
        return false;
      }
      
      console.log(`User found: ${user.username} (ID: ${user._id}, DiscordID: ${user.discordId})`);
      
      // مطمئن شویم که فیلد aiAssistant وجود دارد
      if (!user.aiAssistant) {
        console.log(`Creating default AI assistant settings for user ${user.username}`);
        user.aiAssistant = {
          subscription: false,
          subscriptionTier: 'free',
          subscriptionExpires: null,
          questionsRemaining: 5,
          totalQuestions: 5
        };
      } else {
        // ریست کردن تعداد سوالات رایگان
        console.log(`Resetting questions for user ${user.username} from ${user.aiAssistant.questionsRemaining} to 5`);
        user.aiAssistant.questionsRemaining = 5;
      }
      
      // ذخیره تغییرات
      await user.save();
      console.log(`Successfully reset questions for user ${user.username}`);
      
      return true;
    } catch (error) {
      console.error('Error resetting AI assistant questions in MongoDB:', error);
      return memStorage.resetAIAssistantQuestions(typeof userId === 'number' ? userId : parseInt(userId as string, 10));
    }
  }
  
  async getUserAIAssistantUsage(userId: number | string): Promise<number> {
    try {
      // لاگ برای دیباگ
      console.log(`Getting AI Assistant usage for UserID type: ${typeof userId}, value: ${userId}`);
      
      // استفاده از فیلترهای مختلف برای یافتن کاربر
      const userIdStr = String(userId);
      const userQuery = {
        $or: [
          { discordId: userIdStr },
          { id: typeof userId === 'number' ? userId : parseInt(userIdStr, 10) }
        ]
      };
      
      // اگر ObjectId معتبر است، آن را نیز اضافه کنیم
      if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
        userQuery.$or.push({ _id: new mongoose.Types.ObjectId(userId) });
      }
      
      console.log('User query:', JSON.stringify(userQuery));
      let user = await UserModel.findOne(userQuery);
      
      if (!user) {
        console.warn(`User not found for AI assistant usage with ID ${userId}`);
        return 0;
      }
      
      console.log(`User found: ${user.username} (ID: ${user._id}, DiscordID: ${user.discordId})`);
      
      if (!user.aiAssistant) {
        console.log(`User ${user.username} has no AI assistant data. Returning 0.`);
        return 0;
      }
      
      // محاسبه تعداد سوالات استفاده شده
      const usedQuestions = user.aiAssistant.totalQuestions - user.aiAssistant.questionsRemaining;
      console.log(`User ${user.username} has used ${usedQuestions} questions out of ${user.aiAssistant.totalQuestions}.`);
      return usedQuestions;
    } catch (error) {
      console.error('Error getting AI assistant usage from MongoDB:', error);
      return memStorage.getUserAIAssistantUsage(typeof userId === 'number' ? userId : parseInt(userId as string, 10));
    }
  }

  // Job operations - پیاده‌سازی متدهای مربوط به سیستم شغل

  async getUserJob(userId: number): Promise<JobData | undefined> {
    try {
      const job = await JobModel.findOne({ userId });
      return job || undefined;
    } catch (error) {
      console.error('Error getting user job from MongoDB:', error);
      return memStorage.getUserJob(userId);
    }
  }
  
  async getAvailableJobs(): Promise<{id: string, name: string, income: number, cyclePeriod: number, requirements: any}[]> {
    try {
      // لیست شغل‌های موجود در سیستم
      return [
        { 
          id: 'miner', 
          name: '⛏️ کارگر معدن', 
          income: 200, 
          cyclePeriod: 12, 
          requirements: { ccoin: 0 } 
        },
        { 
          id: 'trader', 
          name: '💹 تاجر', 
          income: 500, 
          cyclePeriod: 12, 
          requirements: { ccoin: 10000 } 
        },
        { 
          id: 'supporter', 
          name: '🛠️ ساپورت ربات', 
          income: 300, 
          cyclePeriod: 24, 
          requirements: { ccoin: 5000 } 
        },
        { 
          id: 'hunter', 
          name: '🔍 شکارچی گنج', 
          income: 250, 
          cyclePeriod: 24, 
          requirements: { ccoin: 5000 } 
        },
        { 
          id: 'soldier', 
          name: '⚔️ سرباز کلن', 
          income: 400, 
          cyclePeriod: 24, 
          requirements: { clan: true } 
        },
        { 
          id: 'reporter', 
          name: '📰 خبرنگار سرور', 
          income: 350, 
          cyclePeriod: 24, 
          requirements: { ccoin: 7000 } 
        },
        { 
          id: 'organizer', 
          name: '🎪 برگزارکننده رویداد', 
          income: 450, 
          cyclePeriod: 24, 
          requirements: { ccoin: 12000 } 
        },
        { 
          id: 'designer', 
          name: '🎨 طراح چالش', 
          income: 320, 
          cyclePeriod: 24, 
          requirements: { ccoin: 6000 } 
        },
        { 
          id: 'guardian', 
          name: '🛡️ نگهبان سرور', 
          income: 280, 
          cyclePeriod: 24, 
          requirements: { ccoin: 4000 } 
        },
        { 
          id: 'streamer', 
          name: '🎙️ استریمر سرور', 
          income: 380, 
          cyclePeriod: 24, 
          requirements: { ccoin: 8000 } 
        }
      ];
    } catch (error) {
      console.error('Error getting available jobs from MongoDB:', error);
      return memStorage.getAvailableJobs();
    }
  }
  
  async assignJob(userId: number, jobType: string): Promise<JobData> {
    try {
      // بررسی وجود کاربر
      const user = await UserModel.findOne({ userId });
      if (!user) {
        throw new Error('کاربر یافت نشد');
      }
      
      // بررسی آیا شغل درخواستی معتبر است
      const availableJobs = await this.getAvailableJobs();
      const jobInfo = availableJobs.find(job => job.id === jobType);
      
      if (!jobInfo) {
        throw new Error('شغل مورد نظر یافت نشد');
      }
      
      // بررسی پیش‌نیازهای شغل
      if (jobInfo.requirements.ccoin > 0 && user.wallet + user.bank < jobInfo.requirements.ccoin) {
        throw new Error(`برای این شغل نیاز به حداقل ${jobInfo.requirements.ccoin} سکه دارید`);
      }
      
      if (jobInfo.requirements.clan && (!user.clanId || user.clanId <= 0)) {
        throw new Error('برای این شغل نیاز به عضویت در یک کلن دارید');
      }
      
      // حذف شغل فعلی اگر وجود دارد
      await JobModel.deleteOne({ userId });
      
      // ایجاد شغل جدید
      const now = new Date();
      const newJob: JobData = {
        id: `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId,
        jobType,
        income: jobInfo.income,
        cyclePeriod: jobInfo.cyclePeriod,
        lastCollected: now,
        level: 1,
        xp: 0,
        xpRequired: 50,
        hiredAt: now
      };
      
      await JobModel.create(newJob);
      
      // ذخیره تراکنش در تاریخچه
      await this.saveTransaction({
        id: `tr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId,
        type: 'job_assigned',
        amount: 0,
        description: `استخدام در شغل ${jobInfo.name}`,
        timestamp: now.toISOString()
      });
      
      return newJob;
    } catch (error) {
      console.error('Error assigning job in MongoDB:', error);
      return memStorage.assignJob(userId, jobType);
    }
  }
  
  async collectJobIncome(userId: number): Promise<{amount: number, xpEarned: number, leveledUp: boolean}> {
    try {
      // بررسی وجود کاربر
      const user = await UserModel.findOne({ userId });
      if (!user) {
        throw new Error('کاربر یافت نشد');
      }
      
      // بررسی آیا کاربر شغلی دارد
      const job = await JobModel.findOne({ userId });
      if (!job) {
        throw new Error('شما شغلی ندارید');
      }
      
      const now = new Date();
      const lastCollected = new Date(job.lastCollected);
      const cooldownHours = job.cyclePeriod;
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      
      // بررسی آیا زمان کافی از آخرین دریافت حقوق گذشته است
      if (now.getTime() - lastCollected.getTime() < cooldownMs) {
        const remainingMs = cooldownMs - (now.getTime() - lastCollected.getTime());
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
        throw new Error(`شما باید ${remainingHours} ساعت دیگر صبر کنید`);
      }
      
      // محاسبه درآمد بر اساس سطح شغل
      let income = job.income;
      for (let i = 1; i < job.level; i++) {
        income += Math.floor(job.income * 0.1); // 10% افزایش برای هر سطح
      }
      
      // محاسبه مالیات (5%)
      const tax = Math.ceil(income * 0.05);
      const netIncome = income - tax;
      
      // بروزرسانی موجودی کاربر
      await UserModel.updateOne(
        { userId },
        { $inc: { wallet: netIncome } }
      );
      
      // بروزرسانی زمان آخرین دریافت حقوق
      await JobModel.updateOne(
        { userId },
        { $set: { lastCollected: now } }
      );
      
      // اضافه کردن XP شغلی
      const xpEarned = 10;
      const levelUpResult = await this.updateJobXP(userId, xpEarned);
      
      // ذخیره تراکنش در تاریخچه
      await this.saveTransaction({
        id: `tr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId,
        type: 'work',
        amount: netIncome,
        description: `دریافت حقوق شغل ${job.jobType} (سطح ${job.level})`,
        timestamp: now.toISOString()
      });
      
      return {
        amount: netIncome,
        xpEarned,
        leveledUp: levelUpResult.leveledUp
      };
    } catch (error) {
      console.error('Error collecting job income in MongoDB:', error);
      return memStorage.collectJobIncome(userId);
    }
  }
  
  async updateJobXP(userId: number, xpAmount: number): Promise<{leveledUp: boolean, newLevel?: number}> {
    try {
      // بررسی وجود کاربر
      const user = await UserModel.findOne({ userId });
      if (!user) {
        throw new Error('کاربر یافت نشد');
      }
      
      // بررسی آیا کاربر شغلی دارد
      const job = await JobModel.findOne({ userId });
      if (!job) {
        throw new Error('شما شغلی ندارید');
      }
      
      // اضافه کردن XP
      let newXP = job.xp + xpAmount;
      
      // بررسی آیا ارتقای سطح اتفاق افتاده است
      let leveledUp = false;
      let newLevel = job.level;
      
      if (newXP >= job.xpRequired && job.level < 5) { // حداکثر سطح 5
        newLevel += 1;
        newXP = 0; // ریست XP
        leveledUp = true;
        
        // بروزرسانی اطلاعات شغل
        await JobModel.updateOne(
          { userId },
          { 
            $set: { 
              level: newLevel,
              xp: newXP,
              xpRequired: 50 // همیشه 50 برای ساده نگه داشتن سیستم
            } 
          }
        );
        
        // ذخیره تراکنش در تاریخچه
        await this.saveTransaction({
          id: `tr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userId,
          type: 'job_level_up',
          amount: 0,
          description: `ارتقای شغل ${job.jobType} به سطح ${newLevel}`,
          timestamp: new Date().toISOString()
        });
      } else {
        // فقط بروزرسانی XP
        await JobModel.updateOne(
          { userId },
          { $set: { xp: newXP } }
        );
      }
      
      return { leveledUp, newLevel: leveledUp ? newLevel : undefined };
    } catch (error) {
      console.error('Error updating job XP in MongoDB:', error);
      return memStorage.updateJobXP(userId, xpAmount);
    }
  }

  // ======= مدیریت جلسات بازی =======

  async saveGameSession(session: {
    gameId: string;
    gameType: string;
    guildId: string;
    channelId: string;
    hostId: string;
    players: string[];
    status: string;
    settings: any;
    sessionNumber: number;
    startedAt?: Date;
    endedAt?: Date;
    scores: { playerId: string; score: number }[];
  }): Promise<boolean> {
    try {
      await GameSessionModel.findOneAndUpdate(
        { gameId: session.gameId },
        session,
        { upsert: true, new: true }
      );
      return true;
    } catch (error) {
      console.error('Error saving game session to MongoDB:', error);
      return false;
    }
  }

  async getGameSession(gameId: string): Promise<any> {
    try {
      return await GameSessionModel.findOne({ gameId });
    } catch (error) {
      console.error('Error getting game session from MongoDB:', error);
      return null;
    }
  }

  async getActiveGameSessions(gameType: string): Promise<any[]> {
    try {
      return await GameSessionModel.find({
        gameType,
        status: { $in: ['waiting', 'active'] }
      });
    } catch (error) {
      console.error('Error getting active game sessions from MongoDB:', error);
      return [];
    }
  }

  async endGameSession(id: string): Promise<boolean> {
    try {
      await GameSessionModel.findOneAndUpdate(
        { gameId: id },
        { 
          status: 'ended',
          endedAt: new Date()
        }
      );
      return true;
    } catch (error) {
      console.error('Error ending game session in MongoDB:', error);
      return false;
    }
  }

  async getActiveGameSessionsInGuild(guildId: string): Promise<any[]> {
    try {
      return await GameSessionModel.find({
        guildId,
        status: { $in: ['waiting', 'active'] }
      });
    } catch (error) {
      console.error('Error getting active game sessions from MongoDB:', error);
      return [];
    }
  }

  async getActiveGameSessionsInChannel(channelId: string): Promise<any[]> {
    try {
      return await GameSessionModel.find({
        channelId,
        status: { $in: ['waiting', 'active'] }
      });
    } catch (error) {
      console.error('Error getting active game sessions from MongoDB:', error);
      return [];
    }
  }

  async getMaxGameSessionNumber(guildId: string, gameType: string): Promise<number> {
    try {
      const result = await GameSessionModel.findOne({
        guildId,
        gameType
      }).sort({ sessionNumber: -1 }).limit(1);
      
      return result ? result.sessionNumber : 0;
    } catch (error) {
      console.error('Error getting max game session number from MongoDB:', error);
      return 0;
    }
  }

  async getGameSessionsForUser(userId: string): Promise<any[]> {
    try {
      return await GameSessionModel.find({
        players: userId
      });
    } catch (error) {
      console.error('Error getting user game sessions from MongoDB:', error);
      return [];
    }
  }

  async isUserBlocked(userId: number, blockedUserId: number): Promise<boolean> {
    try {
      // تبدیل userId به رشته (چون در مدل MongoDB به صورت رشته ذخیره می‌شود)
      const user = await UserModel.findOne({ id: userId });
      const blockedUser = await UserModel.findOne({ id: blockedUserId });
      
      if (!user || !blockedUser) return false;
      
      // استفاده از متد استاتیک مدل BlockedUser برای بررسی مسدودیت
      return await BlockedUserModel.isBlocked(user.discordId, blockedUser.discordId);
    } catch (error) {
      console.error(`Error checking if user ${userId} blocked user ${blockedUserId}:`, error);
      return false;
    }
  }
  
  async getFriendRequests(userId: number): Promise<FriendRequest[]> {
    try {
      const user = await UserModel.findOne({ id: userId });
      if (!user) return [];
      
      // دریافت درخواست‌های ارسال شده و دریافت شده
      const sentRequests = await FriendRequestModel.getSentRequests(user.discordId, 'pending');
      const receivedRequests = await FriendRequestModel.getReceivedRequests(user.discordId, 'pending');
      
      // تبدیل به ساختار مورد نیاز در اینترفیس IStorage
      const friendRequests: FriendRequest[] = [];
      
      // تبدیل درخواست‌های ارسالی
      for (const request of sentRequests) {
        friendRequests.push({
          id: request._id.toString(),
          fromUserId: request.senderId,
          toUserId: request.receiverId,
          status: request.status,
          message: request.message || undefined,
          timestamp: request.createdAt,
          respondedAt: request.respondedAt
        });
      }
      
      // تبدیل درخواست‌های دریافتی
      for (const request of receivedRequests) {
        friendRequests.push({
          id: request._id.toString(),
          fromUserId: request.senderId,
          toUserId: request.receiverId,
          status: request.status,
          message: request.message || undefined,
          timestamp: request.createdAt,
          respondedAt: request.respondedAt
        });
      }
      
      return friendRequests;
    } catch (error) {
      console.error(`Error getting friend requests for user ${userId}:`, error);
      return [];
    }
  }
}

// Create instances
export const memStorage = new MemStorage();
export const mongoStorage = new MongoStorage();

// Add market-related methods to the MongoStorage class
MongoStorage.prototype.getMarketListings = async function(listingType?: 'regular' | 'black_market'): Promise<any[]> {
  try {
    const query: any = { active: true, expiresAt: { $gt: new Date() } };
    
    if (listingType) {
      query.listingType = listingType;
    }
    
    const listings = await MarketListingModel.find(query).sort({ createdAt: -1 });
    return listings;
  } catch (error) {
    console.error('Error getting market listings:', error);
    return [];
  }
};

MongoStorage.prototype.getMarketListingById = async function(listingId: string): Promise<any | undefined> {
  try {
    const listing = await MarketListingModel.findById(listingId);
    if (!listing) return undefined;
    return listing;
  } catch (error) {
    console.error(`Error getting market listing ${listingId}:`, error);
    return undefined;
  }
};

MongoStorage.prototype.getUserMarketListings = async function(userId: string): Promise<any[]> {
  try {
    const listings = await MarketListingModel.find({ 
      sellerId: userId,
      active: true
    }).sort({ createdAt: -1 });
    
    return listings;
  } catch (error) {
    console.error(`Error getting user market listings for user ${userId}:`, error);
    return [];
  }
};

MongoStorage.prototype.createMarketListing = async function(listing: {
  sellerId: string, 
  sellerName: string, 
  itemId: number, 
  itemName: string,
  itemEmoji: string,
  quantity: number, 
  price: number, 
  description: string,
  listingType: 'regular' | 'black_market',
  expiresAt: Date
}): Promise<any> {
  try {
    // Create new listing
    const newListing = new MarketListingModel({
      ...listing,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save to database
    await newListing.save();
    
    return newListing;
  } catch (error) {
    console.error('Error creating market listing:', error);
    throw error;
  }
};

MongoStorage.prototype.updateMarketListing = async function(listingId: string, updates: {
  price?: number, 
  quantity?: number, 
  description?: string, 
  active?: boolean
}): Promise<any | undefined> {
  try {
    // Update listing with provided changes
    const listing = await MarketListingModel.findByIdAndUpdate(
      listingId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!listing) return undefined;
    return listing;
  } catch (error) {
    console.error(`Error updating market listing ${listingId}:`, error);
    return undefined;
  }
};

MongoStorage.prototype.deleteMarketListing = async function(listingId: string): Promise<boolean> {
  try {
    const result = await MarketListingModel.findByIdAndDelete(listingId);
    return !!result;
  } catch (error) {
    console.error(`Error deleting market listing ${listingId}:`, error);
    return false;
  }
};

MongoStorage.prototype.buyFromMarket = async function(buyerId: string, listingId: string, quantity: number): Promise<{
  success: boolean, 
  message?: string, 
  listing?: any, 
  item?: any
}> {
  try {
    // Get the listing
    const listing = await MarketListingModel.findById(listingId);
    if (!listing) {
      return { success: false, message: 'آیتم مورد نظر یافت نشد.' };
    }
    
    // Check if listing is active and not expired
    if (!listing.active || listing.expiresAt < new Date()) {
      return { success: false, message: 'این آگهی دیگر فعال نیست.' };
    }
    
    // Check if desired quantity is available
    if (quantity > listing.quantity) {
      return { success: false, message: `تنها ${listing.quantity} عدد از این آیتم موجود است.` };
    }
    
    // Get buyer and seller
    const buyer = await UserModel.findOne({ discordId: buyerId });
    const seller = await UserModel.findOne({ discordId: listing.sellerId });
    
    if (!buyer || !seller) {
      return { success: false, message: 'خطا در یافتن خریدار یا فروشنده.' };
    }
    
    // Calculate total price
    const totalPrice = listing.price * quantity;
    
    // Check if buyer has enough money
    if (buyer.wallet < totalPrice) {
      return { success: false, message: `شما به اندازه کافی سکه در کیف پول خود ندارید. شما نیاز به ${totalPrice} سکه دارید.` };
    }
    
    // Get the item
    const item = await ItemModel.findOne({ id: listing.itemId });
    if (!item) {
      return { success: false, message: 'آیتم مورد نظر در سیستم یافت نشد.' };
    }
    
    // All checks passed, perform the transaction
    
    // Update buyer (deduct money and add item to inventory)
    buyer.wallet -= totalPrice;
    
    // Initialize inventory if needed
    if (!buyer.inventory) {
      buyer.inventory = {};
    }
    
    // Add item to buyer's inventory
    const itemKey = `item_${listing.itemId}`;
    if (!buyer.inventory[itemKey]) {
      buyer.inventory[itemKey] = {
        id: itemKey,
        itemId: listing.itemId,
        quantity: 0,
        acquiredAt: new Date()
      };
    }
    
    buyer.inventory[itemKey].quantity += quantity;
    
    // Record transaction
    if (!buyer.transactions) buyer.transactions = [];
    buyer.transactions.push({
      type: 'market_purchase',
      amount: totalPrice,
      fee: 0,
      timestamp: new Date(),
      details: `خرید ${quantity} عدد ${listing.itemName} از بازار`
    });
    
    // Update seller (add money)
    seller.wallet += totalPrice;
    
    // Record transaction
    if (!seller.transactions) seller.transactions = [];
    seller.transactions.push({
      type: 'market_sale',
      amount: totalPrice,
      fee: 0,
      timestamp: new Date(),
      details: `فروش ${quantity} عدد ${listing.itemName} در بازار`
    });
    
    // Update listing quantity or mark as inactive if all items sold
    if (quantity === listing.quantity) {
      listing.active = false;
    } else {
      listing.quantity -= quantity;
    }
    
    // Save everything to database
    await buyer.save();
    await seller.save();
    await listing.save();
    
    return {
      success: true,
      message: `شما با موفقیت ${quantity} عدد ${listing.itemName} خریداری کردید.`,
      listing,
      item
    };
  } catch (error) {
    console.error(`Error buying from market (buyer: ${buyerId}, listing: ${listingId}):`, error);
    return { success: false, message: 'خطای سیستمی در خرید از بازار.' };
  }
};

// Use MongoDB storage if we have a connection, otherwise fallback to in-memory
export const storage = process.env.MONGODB_URI ? mongoStorage : memStorage;
