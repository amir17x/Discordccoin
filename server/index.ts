import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initDiscordBot } from "./discord/client";
// سیستم نکات از client.ts اجرا می‌شود
import { connectToDatabase } from "./database";
import 'dotenv/config';

// حذف موقت ارتباط با پنل ادمین
// import { setupAdminPanel } from "./admin";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  log("Starting server with full functionality...", "info");
  
  // اتصال به دیتابیس MongoDB
  try {
    await connectToDatabase();
    log("Connected to MongoDB database", "success");
  } catch (error) {
    log(`Error connecting to MongoDB: ${error}`, "error");
    log("Continuing without database functionality...", "warn");
  }

  // راه‌اندازی ربات دیسکورد
  try {
    const client = await initDiscordBot();
    log("Discord bot initialized successfully", "success");
    
    // تنظیم client برای ماژول بازی‌های گروهی
    try {
      const { setClient } = await import("./discord/components/groupGames");
      setClient(client);
      log("Group games client initialized successfully", "success");
    } catch (groupGamesError) {
      log(`Error initializing group games client: ${groupGamesError}`, "error");
    }
    
    // سیستم نکات در رویداد ready بات دیسکورد راه‌اندازی می‌شود
    log("Tip system will be initialized when Discord bot is ready", "success");
  } catch (error) {
    log(`Error initializing Discord bot: ${error}`, "error");
    log("Continuing without Discord bot functionality", "warn");
  }

  // راه‌اندازی پنل ادمین - غیرفعال شده به صورت موقت
  // به درخواست کاربر، ارتباط بین ربات دیسکورد و پنل ادمین قطع شده است
  log("Admin panel temporarily disabled", "info");
  
  // const setupAdminPanel = await import("./admin").then(module => module.setupAdminPanel);
  
  // صفحه موقت ادمین
  app.get('/admin', (_req, res) => {
    res.send(`
      <html>
        <head>
          <title>Ccoin Admin Panel</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; text-align: center; }
            .notice { background: #f8f9fa; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Ccoin Admin Panel</h1>
          <div class="notice">پنل ادمین به صورت موقت غیرفعال شده است. بعداً مجدداً توسعه خواهد یافت.</div>
        </body>
      </html>
    `);
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    log(`Error: ${err.message}`, "error");
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server is running on port ${port}`);
  });
})();
