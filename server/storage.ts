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
  Item,
  InsertItem,
  Game,
  InventoryItem,
  Transaction,
  TransferStats,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
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
  createItem(item: InsertItem): Promise<Item>;
  buyItem(userId: number, itemId: number): Promise<boolean>;
  useItem(userId: number, itemId: number): Promise<boolean>;
  getInventoryItems(userId: number): Promise<{item: Item, inventoryItem: InventoryItem}[]>;
  addItemToInventory(userId: number, itemId: number, quantity?: number): Promise<boolean>;
  
  // Game operations
  recordGame(userId: number, type: string, bet: number, won: boolean, reward: number): Promise<Game>;
  getUserGames(userId: number): Promise<Game[]>;
  
  // Quest operations
  getAllQuests(): Promise<Quest[]>;
  getQuest(id: number): Promise<Quest | undefined>;
  createQuest(quest: InsertQuest): Promise<Quest>;
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
  
  private currentUserId = 1;
  private currentItemId = 1;
  private currentClanId = 1;
  private currentQuestId = 1;
  private currentAchievementId = 1;
  private currentGameId = 1;
  private currentUserQuestId = 1;
  private currentUserAchievementId = 1;

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
      },
      {
        title: "Game Winner",
        description: "Win a game",
        type: "daily",
        requirement: "win",
        targetAmount: 1,
        reward: 50,
      },
      {
        title: "Competitive Player",
        description: "Win 5 competitive games",
        type: "weekly",
        requirement: "competitive_win",
        targetAmount: 5,
        reward: 300,
      },
      {
        title: "Saver",
        description: "Save 2000 Ccoin in the bank",
        type: "monthly",
        requirement: "bank",
        targetAmount: 2000,
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

  async transferToWallet(userId: number, amount: number): Promise<User | undefined> {
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
      timestamp: new Date()
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
      active: true,
    };
    
    this.quests.set(id, quest);
    return quest;
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
}

export const storage = new MemStorage();
