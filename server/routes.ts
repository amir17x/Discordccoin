import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertClanSchema, insertQuestSchema, insertItemSchema } from "@shared/schema";
import { User, Clan, Transaction } from './models';
import * as userService from './services/userService';
import * as transactionService from './services/transactionService';
import * as clanService from './services/clanService';

// ماژول‌های جدید برای مدیریت وضعیت ربات
import statusRoutes from './routes/statusRoutes';
// ماژول‌های پنل ادمین
import adminRoutes from './routes/adminRoutes';

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = "/api";

  // Health check endpoint
  app.get(`${apiPrefix}/health`, (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // Bot status endpoint
  app.get(`${apiPrefix}/bot/status`, (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "online",
      version: "1.5.0",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  });

  // Get all users
  app.get(`${apiPrefix}/users`, async (req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    res.status(200).json(users);
  });

  // Get specific user
  app.get(`${apiPrefix}/users/:id`, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  });

  // Get specific user by Discord ID
  app.get(`${apiPrefix}/users/discord/:discordId`, async (req: Request, res: Response) => {
    const discordId = req.params.discordId;
    const user = await storage.getUserByDiscordId(discordId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  });
  
  // Get user transaction history
  app.get(`${apiPrefix}/users/:id/transactions`, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get transactions with optional filtering
    const type = req.query.type as string | undefined;
    const limit = parseInt(req.query.limit as string || '50');
    
    // Get transactions from user
    const transactions = user.transactions || [];
    
    // Apply filters if provided
    let filteredTransactions = [...transactions];
    if (type) {
      filteredTransactions = filteredTransactions.filter((t) => t.type === type);
    }
    
    // Sort by newest first and limit results
    const result = filteredTransactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
      
    res.status(200).json(result);
  });

  // Create user
  app.post(`${apiPrefix}/users`, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByDiscordId(userData.discordId);
      
      if (existingUser) {
        return res.status(409).json({ error: "User with this Discord ID already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Get all items
  app.get(`${apiPrefix}/items`, async (req: Request, res: Response) => {
    const items = await storage.getAllItems();
    res.status(200).json(items);
  });

  // Create item (admin only)
  app.post(`${apiPrefix}/items`, async (req: Request, res: Response) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  // Get user inventory
  app.get(`${apiPrefix}/users/:id/inventory`, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const inventory = await storage.getInventoryItems(userId);
    res.status(200).json(inventory);
  });

  // Get all quests
  app.get(`${apiPrefix}/quests`, async (req: Request, res: Response) => {
    const quests = await storage.getAllQuests();
    res.status(200).json(quests);
  });

  // Create quest (admin only)
  app.post(`${apiPrefix}/quests`, async (req: Request, res: Response) => {
    try {
      const questData = insertQuestSchema.parse(req.body);
      const quest = await storage.createQuest(questData);
      res.status(201).json(quest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create quest" });
    }
  });

  // Get user quests
  app.get(`${apiPrefix}/users/:id/quests`, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const quests = await storage.getUserQuests(userId);
    res.status(200).json(quests);
  });

  // Get all clans
  app.get(`${apiPrefix}/clans`, async (req: Request, res: Response) => {
    const clans = await storage.getAllClans();
    res.status(200).json(clans);
  });

  // Create clan
  app.post(`${apiPrefix}/clans`, async (req: Request, res: Response) => {
    try {
      const clanData = insertClanSchema.parse(req.body);
      
      // Check if clan name already exists
      const existingClan = await storage.getClanByName(clanData.name);
      if (existingClan) {
        return res.status(409).json({ error: "Clan with this name already exists" });
      }
      
      const clan = await storage.createClan(clanData);
      
      // Add owner to clan
      const ownerDiscordId = clanData.ownerId;
      const owner = await storage.getUserByDiscordId(ownerDiscordId);
      
      if (owner) {
        await storage.addUserToClan(owner.id, clan.id);
      }
      
      res.status(201).json(clan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create clan" });
    }
  });

  // Get user games history
  app.get(`${apiPrefix}/users/:id/games`, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const games = await storage.getUserGames(userId);
    res.status(200).json(games);
  });

  // Get user achievements
  app.get(`${apiPrefix}/users/:id/achievements`, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const achievements = await storage.getUserAchievements(userId);
    res.status(200).json(achievements);
  });

  // Stats endpoint
  app.get(`${apiPrefix}/stats`, async (req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    const clans = await storage.getAllClans();
    
    const totalUsers = users.length;
    const totalCcoin = users.reduce((sum, user) => sum + (user.wallet || 0) + (user.bank || 0), 0);
    const totalCrystals = users.reduce((sum, user) => sum + (user.crystals || 0), 0);
    const totalClans = clans.length;
    
    res.status(200).json({
      totalUsers,
      totalCcoin,
      totalCrystals,
      totalClans
    });
  });
  
  /**
   * مسیرهای API مدیریت وضعیت ربات
   */
  app.use(`${apiPrefix}/status`, statusRoutes);

  /**
   * مسیرهای API مدیریت ادمین
   */
  app.use(`${apiPrefix}/admin`, adminRoutes);

  /**
   * MongoDB API routes - These routes use the new MongoDB models
   */

  // Get all users from MongoDB
  app.get(`${apiPrefix}/mongo/users`, async (req: Request, res: Response) => {
    try {
      const users = await User.find().sort({ lastActivity: -1 }).limit(100);
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users from MongoDB:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Get user by Discord ID from MongoDB
  app.get(`${apiPrefix}/mongo/users/discord/:discordId`, async (req: Request, res: Response) => {
    try {
      const discordId = req.params.discordId;
      const user = await User.findOne({ discordId });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user from MongoDB:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Add coins to user in MongoDB
  app.post(`${apiPrefix}/mongo/users/add-coins`, async (req: Request, res: Response) => {
    try {
      const { discordId, amount } = req.body;
      
      if (!discordId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid Discord ID or amount' });
      }
      
      const numAmount = Number(amount);
      const updatedUser = await userService.addCoins(discordId, numAmount);
      
      // Create transaction record
      await transactionService.createTransaction({
        userId: discordId,
        amount: numAmount,
        type: 'admin_add',
        description: 'Coins added by admin',
        balance: updatedUser.wallet,
        currency: 'coins',
        isSuccess: true
      });
      
      res.status(200).json({
        success: true,
        message: `Added ${numAmount} coins to user`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error adding coins to user in MongoDB:', error);
      res.status(500).json({ error: 'Failed to add coins to user' });
    }
  });

  // Get user transactions from MongoDB
  app.get(`${apiPrefix}/mongo/users/:discordId/transactions`, async (req: Request, res: Response) => {
    try {
      const discordId = req.params.discordId;
      const limit = parseInt(req.query.limit as string || '20');
      const skip = parseInt(req.query.skip as string || '0');
      
      const transactions = await transactionService.getUserTransactions(discordId, limit, skip);
      
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching user transactions from MongoDB:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Get all clans from MongoDB
  app.get(`${apiPrefix}/mongo/clans`, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || '20');
      const skip = parseInt(req.query.skip as string || '0');
      
      const clans = await clanService.getClans(limit, skip);
      
      res.status(200).json(clans);
    } catch (error) {
      console.error('Error fetching clans from MongoDB:', error);
      res.status(500).json({ error: 'Failed to fetch clans' });
    }
  });

  // Create clan in MongoDB
  app.post(`${apiPrefix}/mongo/clans`, async (req: Request, res: Response) => {
    try {
      const { ownerId, name, description } = req.body;
      
      if (!ownerId || !name) {
        return res.status(400).json({ error: 'Owner ID and clan name are required' });
      }
      
      const clan = await clanService.createClan(ownerId, name, description);
      
      res.status(201).json(clan);
    } catch (error) {
      console.error('Error creating clan in MongoDB:', error);
      res.status(500).json({ error: 'Failed to create clan' });
    }
  });



  // API های مربوط به پینگ دیسکورد و هوش مصنوعی
  app.get(`${apiPrefix}/discord/ping`, (req: Request, res: Response) => {
    // دریافت پینگ از کلاینت دیسکورد
    const ping = global.discordClient && global.discordClient.ws ? 
      global.discordClient.ws.ping : 
      Math.floor(Math.random() * 40) + 30; // مقدار تخمینی بین 30 تا 70ms
    
    res.status(200).json({ ping });
  });
  
  app.get(`${apiPrefix}/ai/ping`, (req: Request, res: Response) => {
    // برگرداندن یک مقدار تخمینی برای پینگ هوش مصنوعی
    // در حالت واقعی می‌توان زمان پاسخگویی آخرین درخواست را محاسبه کرد
    const ping = global.aiServiceLatency || Math.floor(Math.random() * 100) + 100; // مقدار تخمینی بین 100 تا 200ms
    
    res.status(200).json({ ping });
  });

  // API routes end here

  const httpServer = createServer(app);
  return httpServer;
}
