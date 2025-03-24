import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertClanSchema, insertQuestSchema, insertItemSchema } from "@shared/schema";

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
      version: "1.0.0",
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
    const totalCcoin = users.reduce((sum, user) => sum + user.wallet + user.bank, 0);
    const totalCrystals = users.reduce((sum, user) => sum + user.crystals, 0);
    const totalClans = clans.length;
    
    res.status(200).json({
      totalUsers,
      totalCcoin,
      totalCrystals,
      totalClans
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
