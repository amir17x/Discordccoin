import mongoose, { Document, Schema, Model } from 'mongoose';

// تعریف ساختار کاربر مسدود شده
export interface IBlockedUser extends Document {
  userId: string;
  blockedUserId: string;
  reason?: string;
  blockedAt: Date;
}

// تعریف متدهای استاتیک
interface IBlockedUserModel extends Model<IBlockedUser> {
  isBlocked(userId: string, blockedUserId: string): Promise<boolean>;
  blockUser(userId: string, blockedUserId: string, reason?: string): Promise<IBlockedUser>;
  unblockUser(userId: string, blockedUserId: string): Promise<boolean>;
  getBlockedUsers(userId: string, limit?: number, skip?: number): Promise<IBlockedUser[]>;
  countBlockedUsers(userId: string): Promise<number>;
  getBlockedBy(blockedUserId: string, limit?: number, skip?: number): Promise<IBlockedUser[]>;
  countBlockedBy(blockedUserId: string): Promise<number>;
  isMutuallyBlocked(user1Id: string, user2Id: string): Promise<boolean>;
  getBlockInfo(userId: string, blockedUserId: string): Promise<IBlockedUser | null>;
  updateBlockReason(userId: string, blockedUserId: string, reason: string): Promise<IBlockedUser | null>;
  getRecentlyBlockedUsers(userId: string, days?: number, limit?: number): Promise<IBlockedUser[]>;
}

// اسکیما برای کاربر مسدود شده
const BlockedUserSchema = new Schema<IBlockedUser>(
  {
    userId: { type: String, required: true },
    blockedUserId: { type: String, required: true },
    reason: { type: String },
    blockedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

// ایجاد ایندکس‌های ترکیبی برای بهبود کارایی
BlockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });
BlockedUserSchema.index({ userId: 1 });
BlockedUserSchema.index({ blockedUserId: 1 });
BlockedUserSchema.index({ blockedAt: -1 });

// متد استاتیک برای بررسی مسدود بودن کاربر
BlockedUserSchema.statics.isBlocked = async function(
  userId: string,
  blockedUserId: string
): Promise<boolean> {
  const count = await this.countDocuments({ userId, blockedUserId });
  return count > 0;
};

// متد استاتیک برای مسدود کردن کاربر
BlockedUserSchema.statics.blockUser = async function(
  userId: string,
  blockedUserId: string,
  reason?: string
): Promise<IBlockedUser> {
  // بررسی وجود مسدودیت قبلی
  const existingBlock = await this.findOne({ userId, blockedUserId });
  
  if (existingBlock) {
    // اگر کاربر قبلاً مسدود شده باشد، فقط دلیل را بروزرسانی می‌کنیم
    if (reason) {
      existingBlock.reason = reason;
      await existingBlock.save();
    }
    
    return existingBlock;
  }
  
  // ایجاد مسدودیت جدید
  const newBlock = await this.create({
    userId,
    blockedUserId,
    reason,
    blockedAt: new Date()
  });
  
  return newBlock;
};

// متد استاتیک برای رفع مسدودیت کاربر
BlockedUserSchema.statics.unblockUser = async function(
  userId: string,
  blockedUserId: string
): Promise<boolean> {
  const result = await this.deleteOne({ userId, blockedUserId });
  return result.deletedCount > 0;
};

// متد استاتیک برای دریافت لیست کاربران مسدود شده توسط یک کاربر
BlockedUserSchema.statics.getBlockedUsers = async function(
  userId: string,
  limit: number = 50,
  skip: number = 0
): Promise<IBlockedUser[]> {
  return await this.find({ userId })
    .sort({ blockedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// متد استاتیک برای دریافت تعداد کاربران مسدود شده توسط یک کاربر
BlockedUserSchema.statics.countBlockedUsers = async function(
  userId: string
): Promise<number> {
  return await this.countDocuments({ userId });
};

// متد استاتیک برای بررسی اینکه یک کاربر توسط چه کسانی مسدود شده است
BlockedUserSchema.statics.getBlockedBy = async function(
  blockedUserId: string,
  limit: number = 50,
  skip: number = 0
): Promise<IBlockedUser[]> {
  return await this.find({ blockedUserId })
    .sort({ blockedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// متد استاتیک برای دریافت تعداد کاربرانی که یک کاربر را مسدود کرده‌اند
BlockedUserSchema.statics.countBlockedBy = async function(
  blockedUserId: string
): Promise<number> {
  return await this.countDocuments({ blockedUserId });
};

// متد استاتیک برای بررسی مسدودیت متقابل بین دو کاربر
BlockedUserSchema.statics.isMutuallyBlocked = async function(
  user1Id: string,
  user2Id: string
): Promise<boolean> {
  // بررسی به صورت مستقیم بدون استفاده از متد isBlocked
  const user1BlockedUser2Count = await this.countDocuments({ userId: user1Id, blockedUserId: user2Id });
  const user2BlockedUser1Count = await this.countDocuments({ userId: user2Id, blockedUserId: user1Id });
  
  return user1BlockedUser2Count > 0 && user2BlockedUser1Count > 0;
};

// متد استاتیک برای دریافت اطلاعات مسدودیت
BlockedUserSchema.statics.getBlockInfo = async function(
  userId: string,
  blockedUserId: string
): Promise<IBlockedUser | null> {
  return await this.findOne({ userId, blockedUserId });
};

// متد استاتیک برای بروزرسانی دلیل مسدودیت
BlockedUserSchema.statics.updateBlockReason = async function(
  userId: string,
  blockedUserId: string,
  reason: string
): Promise<IBlockedUser | null> {
  return await this.findOneAndUpdate(
    { userId, blockedUserId },
    { reason },
    { new: true }
  );
};

// متد استاتیک برای دریافت لیست کاربرانی که اخیراً مسدود شده‌اند
BlockedUserSchema.statics.getRecentlyBlockedUsers = async function(
  userId: string,
  days: number = 7,
  limit: number = 10
): Promise<IBlockedUser[]> {
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - days);
  
  return await this.find({
    userId,
    blockedAt: { $gte: recentDate }
  })
    .sort({ blockedAt: -1 })
    .limit(limit);
};

// ایجاد و صادر کردن مدل
export const BlockedUserModel = mongoose.model<IBlockedUser, IBlockedUserModel>('BlockedUser', BlockedUserSchema);

export default BlockedUserModel;