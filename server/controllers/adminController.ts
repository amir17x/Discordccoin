/**
 * کنترلر ادمین
 * این کنترلر مسئول مدیریت API ادمین است
 */

import { Request, Response } from 'express';
import UserModel, { IUser } from '../models/User.ts';
import { sendAdminNotification } from '../discord/utils/adminNotifications.ts';
import { log } from '../discord/utils/logger.ts';

/**
 * دریافت لیست کاربران
 * @param req درخواست
 * @param res پاسخ
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string === 'asc' ? 1 : -1;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
          { discordId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder;

    const skip = (page - 1) * limit;

    const users = await UserModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('id discordId username displayName wallet bank crystals level isVIP isBanned lastActivity');

    const total = await UserModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    log(`Error in getUsers: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در دریافت لیست کاربران رخ داد'
    });
  }
};

/**
 * دریافت اطلاعات یک کاربر
 * @param req درخواست
 * @param res پاسخ
 */
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    let user;
    if (userId.match(/^\d+$/)) {
      // اگر فقط شامل ارقام است احتمالا discordId است
      user = await UserModel.findOne({ discordId: userId });
    } else {
      // در غیر این صورت از id استفاده می‌کنیم
      user = await UserModel.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    log(`Error in getUserDetails: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در دریافت اطلاعات کاربر رخ داد'
    });
  }
};

/**
 * بروزرسانی اطلاعات کاربر
 * @param req درخواست
 * @param res پاسخ
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // فیلدهای حساس را حذف می‌کنیم تا نتوانند تغییر کنند
    const protectedFields = ['_id', 'id', 'discordId', 'createdAt'];
    protectedFields.forEach(field => delete updateData[field]);

    let user;
    if (userId.match(/^\d+$/)) {
      // اگر فقط شامل ارقام است احتمالا discordId است
      user = await UserModel.findOneAndUpdate(
        { discordId: userId },
        { $set: updateData },
        { new: true }
      );
    } else {
      // در غیر این صورت از id استفاده می‌کنیم
      user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    log(`User ${user.username} (${user.discordId}) updated by API`, 'info');

    return res.status(200).json({
      success: true,
      data: user,
      message: 'اطلاعات کاربر با موفقیت بروزرسانی شد'
    });
  } catch (error: any) {
    log(`Error in updateUser: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در بروزرسانی اطلاعات کاربر رخ داد'
    });
  }
};

/**
 * افزودن سکه به کاربر
 * @param req درخواست
 * @param res پاسخ
 */
export const addCoins = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let { amount, reason, adminName, notifyUser = true } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'مقدار سکه باید بیشتر از صفر باشد'
      });
    }

    // اگر نام ادمین ارسال نشده، از نام کاربر در جلسه استفاده می‌کنیم
    if (!adminName && req.session.user) {
      adminName = req.session.user.username || 'Admin';
    } else if (!adminName) {
      adminName = 'Admin'; // نام پیش‌فرض
    }

    let user;
    if (userId.match(/^\d+$/)) {
      // اگر فقط شامل ارقام است احتمالا discordId است
      user = await UserModel.findOneAndUpdate(
        { discordId: userId },
        { $inc: { wallet: amount } },
        { new: true }
      );
    } else {
      // در غیر این صورت از id استفاده می‌کنیم
      user = await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { wallet: amount } },
        { new: true }
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    // ثبت تراکنش
    const transaction = {
      type: 'admin_add',
      amount: amount,
      timestamp: new Date(),
      description: reason || 'افزایش سکه توسط ادمین',
      adminName: adminName
    };

    await UserModel.findByIdAndUpdate(
      user._id,
      { $push: { transactions: transaction } }
    );

    // ارسال اعلان به کاربر
    if (notifyUser) {
      await sendAdminNotification(
        user.discordId,
        'add_coins',
        {
          amount: amount,
          adminName: adminName,
          reason: reason
        }
      );
    }

    log(`${amount} coins added to user ${user.username} (${user.discordId}) by admin ${adminName}`, 'info');

    return res.status(200).json({
      success: true,
      data: user,
      message: `${amount} سکه با موفقیت به کاربر ${user.username} اضافه شد`
    });
  } catch (error: any) {
    log(`Error in addCoins: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در افزودن سکه به کاربر رخ داد'
    });
  }
};

/**
 * کم کردن سکه از کاربر
 * @param req درخواست
 * @param res پاسخ
 */
export const removeCoins = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let { amount, reason, adminName, notifyUser = true } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'مقدار سکه باید بیشتر از صفر باشد'
      });
    }

    // اگر نام ادمین ارسال نشده، از نام کاربر در جلسه استفاده می‌کنیم
    if (!adminName && req.session.user) {
      adminName = req.session.user.username || 'Admin';
    } else if (!adminName) {
      adminName = 'Admin'; // نام پیش‌فرض
    }

    let user;
    let query;
    if (userId.match(/^\d+$/)) {
      // اگر فقط شامل ارقام است احتمالا discordId است
      query = { discordId: userId };
    } else {
      // در غیر این صورت از id استفاده می‌کنیم
      query = { _id: userId };
    }

    // ابتدا کاربر را پیدا می‌کنیم تا موجودی را بررسی کنیم
    user = await UserModel.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    // بررسی موجودی کافی
    if (user.wallet < amount) {
      return res.status(400).json({
        success: false,
        error: 'موجودی کاربر کافی نیست'
      });
    }

    // کم کردن سکه از کیف پول
    user = await UserModel.findOneAndUpdate(
      query,
      { $inc: { wallet: -amount } },
      { new: true }
    );

    // ثبت تراکنش
    const transaction = {
      type: 'admin_remove',
      amount: -amount,
      timestamp: new Date(),
      description: reason || 'کاهش سکه توسط ادمین',
      adminName: adminName
    };

    await UserModel.findByIdAndUpdate(
      user!._id,
      { $push: { transactions: transaction } }
    );

    // ارسال اعلان به کاربر
    if (notifyUser) {
      await sendAdminNotification(
        user!.discordId,
        'remove_coins',
        {
          amount: amount,
          adminName: adminName,
          reason: reason
        }
      );
    }

    log(`${amount} coins removed from user ${user!.username} (${user!.discordId}) by admin ${adminName}`, 'info');

    return res.status(200).json({
      success: true,
      data: user,
      message: `${amount} سکه با موفقیت از کاربر ${user!.username} کم شد`
    });
  } catch (error: any) {
    log(`Error in removeCoins: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در کم کردن سکه از کاربر رخ داد'
    });
  }
};

/**
 * ریست اقتصاد یک کاربر
 * @param req درخواست
 * @param res پاسخ
 */
export const resetUserEconomy = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let { reason, adminName, notifyUser = true } = req.body;

    // اگر نام ادمین ارسال نشده، از نام کاربر در جلسه استفاده می‌کنیم
    if (!adminName && req.session.user) {
      adminName = req.session.user.username || 'Admin';
    } else if (!adminName) {
      adminName = 'Admin'; // نام پیش‌فرض
    }

    let user;
    if (userId.match(/^\d+$/)) {
      // اگر فقط شامل ارقام است احتمالا discordId است
      user = await UserModel.findOneAndUpdate(
        { discordId: userId },
        { 
          $set: { 
            wallet: 500, 
            bank: 0,
            crystals: 0,
            economyLevel: 1,
          } 
        },
        { new: true }
      );
    } else {
      // در غیر این صورت از id استفاده می‌کنیم
      user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            wallet: 500, 
            bank: 0,
            crystals: 0,
            economyLevel: 1,
          } 
        },
        { new: true }
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    // ثبت تراکنش
    const transaction = {
      type: 'admin_reset',
      timestamp: new Date(),
      description: reason || 'ریست اقتصاد توسط ادمین',
      adminName: adminName
    };

    await UserModel.findByIdAndUpdate(
      user._id,
      { $push: { transactions: transaction } }
    );

    // ارسال اعلان به کاربر
    if (notifyUser) {
      await sendAdminNotification(
        user.discordId,
        'reset_economy',
        {
          adminName: adminName,
          reason: reason
        }
      );
    }

    log(`Economy reset for user ${user.username} (${user.discordId}) by admin ${adminName}`, 'info');

    return res.status(200).json({
      success: true,
      data: user,
      message: `اقتصاد کاربر ${user.username} با موفقیت ریست شد`
    });
  } catch (error: any) {
    log(`Error in resetUserEconomy: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در ریست اقتصاد کاربر رخ داد'
    });
  }
};

/**
 * ریست اقتصاد تمام کاربران
 * @param req درخواست
 * @param res پاسخ
 */
export const resetAllEconomy = async (req: Request, res: Response) => {
  try {
    let { reason, adminName, notifyUsers = true } = req.body;

    // اگر نام ادمین ارسال نشده، از نام کاربر در جلسه استفاده می‌کنیم
    if (!adminName && req.session.user) {
      adminName = req.session.user.username || 'Admin';
    } else if (!adminName) {
      adminName = 'Admin'; // نام پیش‌فرض
    }

    // ریست اقتصاد تمام کاربران
    await UserModel.updateMany({}, { 
      $set: { 
        wallet: 500, 
        bank: 0,
        crystals: 0,
        economyLevel: 1,
      } 
    });

    // ثبت تراکنش برای همه
    const transaction = {
      type: 'admin_reset_all',
      timestamp: new Date(),
      description: reason || 'ریست کلی اقتصاد توسط ادمین',
      adminName: adminName
    };
    
    await UserModel.updateMany({}, {
      $push: { transactions: transaction }
    });

    // ارسال اعلان به کاربران
    if (notifyUsers) {
      const users = await UserModel.find({}).select('discordId');
      
      for (const user of users) {
        await sendAdminNotification(
          user.discordId,
          'reset_all_economy',
          {
            adminName: adminName,
            reason: reason
          }
        );
      }
    }

    log(`All user economies reset by admin ${adminName}`, 'info');

    return res.status(200).json({
      success: true,
      message: 'اقتصاد تمام کاربران با موفقیت ریست شد'
    });
  } catch (error: any) {
    log(`Error in resetAllEconomy: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در ریست اقتصاد تمام کاربران رخ داد'
    });
  }
};

/**
 * توزیع سکه بین همه کاربران
 * @param req درخواست
 * @param res پاسخ
 */
export const distributeCoins = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    let { reason, adminName, notifyUsers = true } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'مقدار سکه باید بیشتر از صفر باشد'
      });
    }

    // اگر نام ادمین ارسال نشده، از نام کاربر در جلسه استفاده می‌کنیم
    if (!adminName && req.session.user) {
      adminName = req.session.user.username || 'Admin';
    } else if (!adminName) {
      adminName = 'Admin'; // نام پیش‌فرض
    }

    // توزیع سکه بین تمام کاربران
    await UserModel.updateMany({}, { $inc: { wallet: amount } });

    // ثبت تراکنش برای همه
    const transaction = {
      type: 'admin_distribute',
      amount: amount,
      timestamp: new Date(),
      description: reason || 'توزیع سکه توسط ادمین',
      adminName: adminName
    };
    
    await UserModel.updateMany({}, {
      $push: { transactions: transaction }
    });

    // ارسال اعلان به کاربران
    if (notifyUsers) {
      const users = await UserModel.find({}).select('discordId');
      
      for (const user of users) {
        await sendAdminNotification(
          user.discordId,
          'distribute_coins',
          {
            amount: amount,
            adminName: adminName,
            reason: reason
          }
        );
      }
    }

    log(`${amount} coins distributed to all users by admin ${adminName}`, 'info');

    return res.status(200).json({
      success: true,
      message: `${amount} سکه با موفقیت بین تمام کاربران توزیع شد`
    });
  } catch (error: any) {
    log(`Error in distributeCoins: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در توزیع سکه بین کاربران رخ داد'
    });
  }
};

/**
 * مسدود/آزاد کردن کاربر
 * @param req درخواست
 * @param res پاسخ
 */
export const toggleUserBan = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let { reason, adminName } = req.body;

    // اگر نام ادمین ارسال نشده، از نام کاربر در جلسه استفاده می‌کنیم
    if (!adminName && req.session.user) {
      adminName = req.session.user.username || 'Admin';
    } else if (!adminName) {
      adminName = 'Admin'; // نام پیش‌فرض
    }

    let user;
    if (userId.match(/^\d+$/)) {
      // اگر فقط شامل ارقام است احتمالا discordId است
      user = await UserModel.findOne({ discordId: userId });
    } else {
      // در غیر این صورت از id استفاده می‌کنیم
      user = await UserModel.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    // تغییر وضعیت بن
    const isBanned = !user.isBanned;
    
    if (userId.match(/^\d+$/)) {
      user = await UserModel.findOneAndUpdate(
        { discordId: userId },
        { $set: { isBanned } },
        { new: true }
      );
    } else {
      user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { isBanned } },
        { new: true }
      );
    }

    // لاگ عملیات
    const action = isBanned ? 'banned' : 'unbanned';
    log(`User ${user!.username} (${user!.discordId}) ${action} by admin ${adminName}`, 'info');

    return res.status(200).json({
      success: true,
      data: user,
      message: isBanned 
        ? `کاربر ${user!.username} با موفقیت مسدود شد` 
        : `مسدودیت کاربر ${user!.username} با موفقیت رفع شد`
    });
  } catch (error: any) {
    log(`Error in toggleUserBan: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در تغییر وضعیت مسدودیت کاربر رخ داد'
    });
  }
};

/**
 * دریافت تراکنش‌های کاربر
 * @param req درخواست
 * @param res پاسخ
 */
export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    let user;
    if (userId.match(/^\d+$/)) {
      // اگر فقط شامل ارقام است احتمالا discordId است
      user = await UserModel.findOne({ discordId: userId });
    } else {
      // در غیر این صورت از id استفاده می‌کنیم
      user = await UserModel.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد'
      });
    }

    // دریافت تراکنش‌های کاربر
    const transactions = user.transactions || [];
    
    // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
    transactions.sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // پیاده‌سازی پیجینیشن
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    
    return res.status(200).json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total: transactions.length,
          pages: Math.ceil(transactions.length / limit)
        }
      }
    });
  } catch (error: any) {
    log(`Error in getUserTransactions: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در دریافت تراکنش‌های کاربر رخ داد'
    });
  }
};

/**
 * دریافت کاربران برتر
 * @param req درخواست
 * @param res پاسخ
 */
export const getTopUsers = async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string || 'wealth';
    const limit = parseInt(req.query.limit as string) || 10;
    
    let sort: any = {};
    
    switch (category) {
      case 'wealth':
        // بر اساس مجموع پول در کیف پول و بانک
        sort = { wallet: -1, bank: -1 };
        break;
      case 'level':
        // بر اساس سطح
        sort = { level: -1, experience: -1 };
        break;
      case 'vip':
        // کاربران VIP بر اساس سطح VIP
        sort = { vipTier: -1 };
        break;
      case 'active':
        // بر اساس آخرین فعالیت
        sort = { lastActivity: -1 };
        break;
      default:
        sort = { wallet: -1, bank: -1 };
    }

    let filter = {};
    if (category === 'vip') {
      filter = { isVIP: true };
    }

    const topUsers = await UserModel.find(filter)
      .sort(sort)
      .limit(limit)
      .select('id discordId username displayName wallet bank level experience isVIP vipTier lastActivity');

    return res.status(200).json({
      success: true,
      data: topUsers
    });
  } catch (error: any) {
    log(`Error in getTopUsers: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در دریافت کاربران برتر رخ داد'
    });
  }
};

/**
 * دریافت آمار کلی
 * @param req درخواست
 * @param res پاسخ
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    // تعداد کل کاربران
    const totalUsers = await UserModel.countDocuments();
    
    // تعداد کاربران فعال در 7 روز گذشته
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await UserModel.countDocuments({
      lastActivity: { $gte: sevenDaysAgo }
    });
    
    // مجموع سکه‌ها
    const users = await UserModel.find();
    let totalCoins = 0;
    let totalCrystals = 0;
    
    users.forEach(user => {
      totalCoins += (user.wallet || 0) + (user.bank || 0);
      totalCrystals += user.crystals || 0;
    });
    
    // تعداد کاربران VIP
    const vipUsers = await UserModel.countDocuments({ isVIP: true });
    
    // تعداد کاربران مسدود شده
    const bannedUsers = await UserModel.countDocuments({ isBanned: true });
    
    // آمار تراکنش‌ها
    // اینجا فقط یک نمونه ساده ارائه می‌دهیم
    // در یک پیاده‌سازی واقعی باید محاسبات پیچیده‌تری انجام شود
    let totalTransactions = 0;
    users.forEach(user => {
      totalTransactions += (user.transactions || []).length;
    });
    
    return res.status(200).json({
      success: true,
      data: {
        userStats: {
          totalUsers,
          activeUsers,
          vipUsers,
          bannedUsers
        },
        economyStats: {
          totalCoins,
          totalCrystals,
          averageCoinsPerUser: totalUsers > 0 ? Math.floor(totalCoins / totalUsers) : 0
        },
        activityStats: {
          totalTransactions
        }
      }
    });
  } catch (error: any) {
    log(`Error in getStats: ${error.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'مشکلی در دریافت آمار رخ داد'
    });
  }
};