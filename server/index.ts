import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initDiscordBot } from "./discord/client";
import { setupAdminPanel } from "./admin";
// سیستم نکات از client.ts اجرا می‌شود
import { connectToDatabase } from "./database";
import 'dotenv/config';

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
    
    // سیستم نکات در رویداد ready بات دیسکورد راه‌اندازی می‌شود
    log("Tip system will be initialized when Discord bot is ready", "success");
  } catch (error) {
    log(`Error initializing Discord bot: ${error}`, "error");
    log("Continuing without Discord bot functionality", "warn");
  }

  // راه‌اندازی پنل ادمین
  try {
    setupAdminPanel(app);
    log("Admin panel initialized successfully", "success");
  } catch (error) {
    log(`Error initializing admin panel: ${error}`, "error");
    
    // صفحه موقت ادمین در صورت خطا
    app.get('/admin', (_req, res) => {
      res.send(`
        <html>
          <head>
            <title>Ccoin Admin Panel</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #333; text-align: center; }
              .notice { background: #f8f9fa; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
              .status { display: flex; flex-wrap: wrap; gap: 20px; }
              .status-item { background: #e9ecef; padding: 15px; border-radius: 5px; flex: 1; min-width: 200px; }
              .features { margin-top: 30px; }
              .feature { background: #f1f1f1; margin: 10px 0; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>Ccoin Admin Panel (Backup)</h1>
            <div class="notice">این یک نسخه پشتیبان از پنل ادمین است. در حال رفع مشکل ادمین پنل اصلی هستیم.</div>
            
            <div class="status">
              <div class="status-item">
                <h3>وضعیت سرور</h3>
                <p>✅ سرور فعال است</p>
              </div>
              <div class="status-item">
                <h3>وضعیت دیتابیس</h3>
                <p>⚠️ در حال بررسی اتصال</p>
              </div>
              <div class="status-item">
                <h3>وضعیت ربات Discord</h3>
                <p>⚠️ در حال بررسی اتصال</p>
              </div>
            </div>
            
            <div class="features">
              <h2>ویژگی‌های ربات</h2>
              <div class="feature">
                <h3>سیستم اقتصادی</h3>
                <p>سیستم مدیریت سکه و بانک برای کاربران Discord</p>
              </div>
              <div class="feature">
                <h3>سیستم مچ‌میکینگ</h3>
                <p>سیستم هوشمند برای دوئل و بازی بین کاربران</p>
              </div>
              <div class="feature">
                <h3>سیستم نکات</h3>
                <p>ارسال خودکار نکات آموزشی به کانال‌های تنظیم شده</p>
              </div>
            </div>
          </body>
        </html>
      `);
    });
  }

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
