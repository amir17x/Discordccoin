/**
 * میدلور احراز هویت
 * این فایل میدلورهای احراز هویت و دسترسی را تعریف می‌کند
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../discord/utils/logger.ts';
import UserModel from '../models/User.ts';

// افزودن نوع برای شی نشست
declare module 'express-session' {
  interface SessionData {
    isAuthenticated?: boolean;
    isAdmin?: boolean;
    user?: {
      id: string;
      discordId: string;
      username: string;
    };
  }
}

// میدلور برای بررسی احراز هویت کاربر
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session.isAuthenticated && req.session.user) {
      next();
    } else {
      log('Unauthorized access attempt to admin API', 'warn');
      
      return res.status(401).json({
        success: false,
        error: 'شما وارد نشده‌اید'
      });
    }
  } catch (error: any) {
    log(`Error in isAuthenticated middleware: ${error.message}`, 'error');
    
    return res.status(500).json({
      success: false,
      error: 'خطای داخلی سرور'
    });
  }
};

// میدلور برای بررسی دسترسی ادمین
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session.isAuthenticated || !req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'شما وارد نشده‌اید'
      });
    }

    if (req.session.isAdmin) {
      next();
      return;
    }

    // بررسی دسترسی ادمین از دیتابیس
    const user = await UserModel.findOne({ discordId: req.session.user.discordId });
    if (!user) {
      log(`Admin check failed: User ${req.session.user.discordId} not found`, 'warn');
      
      return res.status(401).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    // بررسی نقش ادمین (در پیاده‌سازی واقعی، باید بررسی شود که کاربر نقش ادمین را دارد)
    // برای این مثال، ما فقط یک فیلد isAdmin اضافه می‌کنیم
    // در پیاده‌سازی واقعی، باید از سیستم نقش‌ها استفاده شود
    
    // این یک ساده‌سازی است، در پیاده‌سازی واقعی باید لیست ادمین‌ها از کانفیگ یا دیتابیس خوانده شود
    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || [];
    const isAdmin = adminIds.includes(user.discordId);
    
    if (isAdmin) {
      // ذخیره وضعیت ادمین در نشست
      req.session.isAdmin = true;
      next();
    } else {
      log(`Admin access denied for user ${user.username} (${user.discordId})`, 'warn');
      
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی ادمین ندارید'
      });
    }
  } catch (error: any) {
    log(`Error in isAdmin middleware: ${error.message}`, 'error');
    
    return res.status(500).json({
      success: false,
      error: 'خطای داخلی سرور'
    });
  }
};