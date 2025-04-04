import mongoose, { Document, Schema, Model } from 'mongoose';

// تعریف ساختار تعامل دوستی
export interface IFriendshipInteraction {
  type: string;
  timestamp: Date;
  details?: string;
}

// تعریف متدهای استاتیک برای مدل دوستی
interface IFriendModel extends Model<IFriend> {
  areFriends(user1Id: string, user2Id: string): Promise<boolean>;
  getFriendship(user1Id: string, user2Id: string): Promise<IFriend | null>;
  getFriendshipFromUserPerspective(userId: string, friendId: string): Promise<IFriend | null>;
  getFriends(userId: string, options?: any): Promise<IFriend[]>;
  countFriends(userId: string, options?: any): Promise<number>;
  getMutualFriends(user1Id: string, user2Id: string, limit?: number): Promise<string[]>;
  addFriend(userId: string, friendId: string): Promise<IFriend>;
  removeFriend(userId: string, friendId: string): Promise<boolean>;
  updateFavoriteStatus(userId: string, friendId: string, favoriteStatus: boolean): Promise<IFriend | null>;
  updateFriendshipLevel(userId: string, friendId: string): Promise<IFriend | null>;
  recordInteraction(userId: string, friendId: string, interactionType: string, details?: string, xpAmount?: number): Promise<IFriend | null>;
  getInteractionHistory(userId: string, friendId: string, limit?: number): Promise<IFriendshipInteraction[]>;
  hasBestFriend(userId: string, friendId: string): Promise<boolean>;
  getInactiveFriends(userId: string, daysThreshold?: number, limit?: number): Promise<IFriend[]>;
  suggestFriends(userId: string, limit?: number): Promise<{ friendId: string; mutualFriends: number }[]>;
}

// تعریف ساختار دوستی
export interface IFriend extends Document {
  userId: string;
  friendId: string;
  friendshipLevel: number;
  friendshipXP: number;
  addedAt: Date;
  lastInteraction: Date;
  isBestFriend: boolean;
  favoriteStatus: boolean;
  interactionCount: number;
  recentInteractions: IFriendshipInteraction[];
}

// اسکیما برای تعامل دوستی
const FriendshipInteractionSchema = new Schema<IFriendshipInteraction>({
  type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
}, { _id: false });

// اسکیما برای دوستی
const FriendSchema = new Schema<IFriend>(
  {
    userId: { type: String, required: true }, // بدون index: true
    friendId: { type: String, required: true },
    friendshipLevel: { type: Number, default: 1 },
    friendshipXP: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now },
    lastInteraction: { type: Date, default: Date.now },
    isBestFriend: { type: Boolean, default: false },
    favoriteStatus: { type: Boolean, default: false },
    interactionCount: { type: Number, default: 0 },
    recentInteractions: {
      type: [FriendshipInteractionSchema],
      default: [],
      validate: [(val: IFriendshipInteraction[]) => val.length <= 20, 'حداکثر 20 تعامل اخیر ذخیره می‌شود']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایجاد ایندکس‌های ترکیبی برای بهبود کارایی
FriendSchema.index({ userId: 1, friendId: 1 }, { unique: true });
FriendSchema.index({ userId: 1 });
FriendSchema.index({ friendId: 1 });
FriendSchema.index({ friendshipLevel: -1 });
FriendSchema.index({ addedAt: -1 });
FriendSchema.index({ lastInteraction: -1 });
FriendSchema.index({ isBestFriend: 1 });
FriendSchema.index({ favoriteStatus: 1 });

// تعریف مقادیر ثابت برای محاسبات سیستم دوستی
const FRIENDSHIP_XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 25000];
const FRIENDSHIP_LEVEL_CAP = 10;
const BEST_FRIEND_LEVEL_THRESHOLD = 7; // حداقل سطح برای دوست صمیمی شدن
const MAX_BEST_FRIENDS = 5; // حداکثر تعداد دوستان صمیمی
const MAX_DAILY_INTERACTIONS = 10; // حداکثر تعداد تعاملات روزانه با یک دوست
const MAX_RECENT_INTERACTIONS = 20; // حداکثر تعداد تعاملات اخیر برای ذخیره

// متد استاتیک برای بررسی دوستی بین دو کاربر
FriendSchema.statics.areFriends = async function(
  user1Id: string,
  user2Id: string
): Promise<boolean> {
  const count = await this.countDocuments({
    $or: [
      { userId: user1Id, friendId: user2Id },
      { userId: user2Id, friendId: user1Id }
    ]
  });
  
  return count > 0;
};

// متد استاتیک برای دریافت اطلاعات دوستی
FriendSchema.statics.getFriendship = async function(
  user1Id: string,
  user2Id: string
): Promise<IFriend | null> {
  return await this.findOne({
    $or: [
      { userId: user1Id, friendId: user2Id },
      { userId: user2Id, friendId: user1Id }
    ]
  });
};

// متد استاتیک برای دریافت اطلاعات دوستی از دید یک کاربر
FriendSchema.statics.getFriendshipFromUserPerspective = async function(
  userId: string,
  friendId: string
): Promise<IFriend | null> {
  return await this.findOne({ userId, friendId });
};

// متد استاتیک برای بدست آوردن لیست دوستان یک کاربر
FriendSchema.statics.getFriends = async function(
  userId: string,
  options: {
    sort?: string;
    limit?: number;
    skip?: number;
    isBestFriend?: boolean;
    favoriteStatus?: boolean;
    minLevel?: number;
    includeInactive?: boolean;
  } = {}
): Promise<IFriend[]> {
  const {
    sort = 'lastInteraction',
    limit = 50,
    skip = 0,
    isBestFriend,
    favoriteStatus,
    minLevel,
    includeInactive = true
  } = options;
  
  // ساخت کوئری با توجه به فیلترها
  const query: any = { userId };
  
  if (isBestFriend !== undefined) {
    query.isBestFriend = isBestFriend;
  }
  
  if (favoriteStatus !== undefined) {
    query.favoriteStatus = favoriteStatus;
  }
  
  if (minLevel !== undefined) {
    query.friendshipLevel = { $gte: minLevel };
  }
  
  if (!includeInactive) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query.lastInteraction = { $gte: thirtyDaysAgo };
  }
  
  // تعیین ترتیب مرتب‌سازی
  let sortOption: any = {};
  switch (sort) {
    case 'level':
      sortOption = { friendshipLevel: -1, friendshipXP: -1 };
      break;
    case 'recent':
      sortOption = { lastInteraction: -1 };
      break;
    case 'oldest':
      sortOption = { addedAt: 1 };
      break;
    case 'newest':
      sortOption = { addedAt: -1 };
      break;
    case 'name':
      sortOption = { friendId: 1 };
      break;
    case 'favorite':
      sortOption = { favoriteStatus: -1, lastInteraction: -1 };
      break;
    default:
      sortOption = { lastInteraction: -1 };
  }
  
  return await this.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);
};

// متد استاتیک برای شمارش دوستان یک کاربر
FriendSchema.statics.countFriends = async function(
  userId: string,
  options: {
    isBestFriend?: boolean;
    favoriteStatus?: boolean;
    minLevel?: number;
    includeInactive?: boolean;
  } = {}
): Promise<number> {
  const {
    isBestFriend,
    favoriteStatus,
    minLevel,
    includeInactive = true
  } = options;
  
  // ساخت کوئری با توجه به فیلترها
  const query: any = { userId };
  
  if (isBestFriend !== undefined) {
    query.isBestFriend = isBestFriend;
  }
  
  if (favoriteStatus !== undefined) {
    query.favoriteStatus = favoriteStatus;
  }
  
  if (minLevel !== undefined) {
    query.friendshipLevel = { $gte: minLevel };
  }
  
  if (!includeInactive) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query.lastInteraction = { $gte: thirtyDaysAgo };
  }
  
  return await this.countDocuments(query);
};

// متد استاتیک برای بدست آوردن دوستان مشترک
FriendSchema.statics.getMutualFriends = async function(
  user1Id: string,
  user2Id: string,
  limit: number = 50
): Promise<string[]> {
  // دریافت لیست دوستان هر دو کاربر
  const user1Friends = await this.find({ userId: user1Id });
  const user2Friends = await this.find({ userId: user2Id });
  
  // استخراج شناسه دوستان
  const user1FriendIds = user1Friends.map((f: IFriend) => f.friendId);
  const user2FriendIds = user2Friends.map((f: IFriend) => f.friendId);
  
  // یافتن اشتراک بین دو لیست
  const mutualFriendIds = user1FriendIds.filter((id: string) => user2FriendIds.includes(id));
  
  // محدود کردن تعداد نتایج
  return mutualFriendIds.slice(0, limit);
};

// متد استاتیک برای افزودن دوست جدید
FriendSchema.statics.addFriend = async function(
  userId: string,
  friendId: string
): Promise<IFriend> {
  // بررسی عدم وجود رابطه دوستی قبلی
  const existingFriendship = await this.findOne({
    $or: [
      { userId, friendId },
      { userId: friendId, friendId: userId }
    ]
  });
  
  if (existingFriendship) {
    throw new Error('رابطه دوستی قبلاً وجود دارد');
  }
  
  // ایجاد روابط دوستی دوطرفه
  const friendship1 = await this.create({
    userId,
    friendId,
    addedAt: new Date(),
    lastInteraction: new Date(),
    recentInteractions: [{
      type: 'add_friend',
      timestamp: new Date(),
      details: 'افزودن به عنوان دوست'
    }]
  });
  
  await this.create({
    userId: friendId,
    friendId: userId,
    addedAt: new Date(),
    lastInteraction: new Date(),
    recentInteractions: [{
      type: 'add_friend',
      timestamp: new Date(),
      details: 'افزودن به عنوان دوست'
    }]
  });
  
  return friendship1;
};

// متد استاتیک برای حذف دوستی
FriendSchema.statics.removeFriend = async function(
  userId: string,
  friendId: string
): Promise<boolean> {
  // حذف روابط دوستی دوطرفه
  const result1 = await this.deleteOne({ userId, friendId });
  const result2 = await this.deleteOne({ userId: friendId, friendId: userId });
  
  return result1.deletedCount > 0 || result2.deletedCount > 0;
};

// متد استاتیک برای بروزرسانی وضعیت علاقه‌مندی
FriendSchema.statics.updateFavoriteStatus = async function(
  userId: string,
  friendId: string,
  favoriteStatus: boolean
): Promise<IFriend | null> {
  return await this.findOneAndUpdate(
    { userId, friendId },
    { favoriteStatus },
    { new: true }
  );
};

// متد استاتیک برای بروزرسانی سطح دوستی (حفظ شده برای سازگاری با کدهای قبلی)
FriendSchema.statics.updateFriendshipLevel = async function(
  userId: string,
  friendId: string
): Promise<IFriend | null> {
  // دریافت اطلاعات دوستی
  const friendship = await this.findOne({ userId, friendId });
  // این متد دیگر استفاده نمی‌شود و منطق آن به recordInteraction منتقل شده است
  return friendship;
};

// متد استاتیک برای ثبت تعامل بین دوستان و افزایش XP
FriendSchema.statics.recordInteraction = async function(
  userId: string,
  friendId: string,
  interactionType: string,
  details?: string,
  xpAmount: number = 10
): Promise<IFriend | null> {
  // دریافت اطلاعات دوستی
  const friendship = await this.findOne({ userId, friendId });
  
  if (!friendship) {
    return null;
  }
  
  // بررسی محدودیت تعاملات روزانه
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayInteractions = friendship.recentInteractions.filter(
    (interaction: IFriendshipInteraction) => interaction.timestamp >= today
  );
  
  if (todayInteractions.length >= MAX_DAILY_INTERACTIONS) {
    // محدودیت تعاملات روزانه رعایت شده، XP کمتری می‌دهیم
    xpAmount = Math.floor(xpAmount / 2);
  }
  
  // بروزرسانی آخرین تعامل
  friendship.lastInteraction = new Date();
  friendship.interactionCount += 1;
  
  // افزودن XP
  friendship.friendshipXP += xpAmount;
  
  // افزودن تعامل به لیست تعاملات اخیر
  if (friendship.recentInteractions.length >= MAX_RECENT_INTERACTIONS) {
    friendship.recentInteractions.pop(); // حذف قدیمی‌ترین تعامل
  }
  
  friendship.recentInteractions.unshift({
    type: interactionType,
    timestamp: new Date(),
    details
  });
  
  // محاسبه سطح جدید با توجه به XP
  let newLevel = 1;
  for (let i = 1; i < FRIENDSHIP_LEVEL_CAP; i++) {
    if (friendship.friendshipXP >= FRIENDSHIP_XP_THRESHOLDS[i]) {
      newLevel = i + 1;
    } else {
      break;
    }
  }
  
  // اگر سطح تغییر کرده باشد، بروزرسانی می‌کنیم
  if (newLevel !== friendship.friendshipLevel) {
    friendship.friendshipLevel = newLevel;
    
    // اضافه کردن تعامل برای ارتقای سطح
    if (friendship.recentInteractions.length >= MAX_RECENT_INTERACTIONS) {
      friendship.recentInteractions.pop(); // حذف قدیمی‌ترین تعامل
    }
    
    friendship.recentInteractions.unshift({
      type: 'level_up',
      timestamp: new Date(),
      details: `ارتقا به سطح دوستی ${newLevel}`
    });
    
    // بررسی شرایط دوست صمیمی
    if (newLevel >= BEST_FRIEND_LEVEL_THRESHOLD && !friendship.isBestFriend) {
      // بررسی تعداد دوستان صمیمی فعلی
      const bestFriendsCount = await this.countDocuments({
        userId, isBestFriend: true
      });
      
      if (bestFriendsCount < MAX_BEST_FRIENDS) {
        friendship.isBestFriend = true;
        
        friendship.recentInteractions.unshift({
          type: 'best_friend',
          timestamp: new Date(),
          details: 'ارتقا به دوست صمیمی'
        });
      }
    }
  }
  
  await friendship.save();
  
  return friendship;
};

// متد استاتیک برای دریافت تاریخچه تعاملات
FriendSchema.statics.getInteractionHistory = async function(
  userId: string,
  friendId: string,
  limit: number = 20
): Promise<IFriendshipInteraction[]> {
  const friendship = await this.findOne({ userId, friendId });
  
  if (!friendship) {
    return [];
  }
  
  return friendship.recentInteractions.slice(0, limit);
};

// متد استاتیک برای بررسی وجود دوست صمیمی
FriendSchema.statics.hasBestFriend = async function(
  userId: string,
  friendId: string
): Promise<boolean> {
  const friendship = await this.findOne({ userId, friendId });
  
  if (!friendship) {
    return false;
  }
  
  return friendship.isBestFriend;
};

// متد استاتیک برای دریافت دوستان غیرفعال
FriendSchema.statics.getInactiveFriends = async function(
  userId: string,
  daysThreshold: number = 30,
  limit: number = 50
): Promise<IFriend[]> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
  
  return await this.find({
    userId,
    lastInteraction: { $lt: thresholdDate }
  })
  .sort({ lastInteraction: 1 })
  .limit(limit);
};

// متد استاتیک برای دریافت پیشنهاد دوستان
FriendSchema.statics.suggestFriends = async function(
  userId: string,
  limit: number = 10
): Promise<{ friendId: string; mutualFriends: number }[]> {
  // دریافت دوستان فعلی کاربر
  const userFriends = await this.find({ userId });
  const userFriendIds = userFriends.map((f: IFriend) => f.friendId);
  
  // اضافه کردن خود کاربر به لیست افرادی که نباید پیشنهاد شوند
  const excludeIds = [...userFriendIds, userId];
  
  // یافتن دوستانِ دوستان (که دوست کاربر نیستند)
  const friendsOfFriends = await this.aggregate([
    // یافتن دوستان کاربر
    { $match: { userId } },
    // یافتن دوستان هر یک از دوستان کاربر
    { $lookup: {
        from: 'friends',
        let: { friendId: '$friendId' },
        pipeline: [
          { $match: {
              $expr: { $eq: ['$userId', '$$friendId'] },
              'friendId': { $nin: excludeIds }
          }},
          { $project: { friendId: 1 } }
        ],
        as: 'friendsOfFriend'
    }},
    // جداسازی آرایه
    { $unwind: '$friendsOfFriend' },
    // گروه‌بندی و شمارش دوستان مشترک
    { $group: {
        _id: '$friendsOfFriend.friendId',
        mutualFriends: { $sum: 1 }
    }},
    // مرتب‌سازی بر اساس تعداد دوستان مشترک
    { $sort: { mutualFriends: -1 } },
    // محدود کردن نتایج
    { $limit: limit }
  ]);
  
  return friendsOfFriends.map(item => ({
    friendId: item._id,
    mutualFriends: item.mutualFriends
  }));
};

// ایجاد و صادر کردن مدل
export const FriendModel = mongoose.model<IFriend, IFriendModel>('Friend', FriendSchema);

export default FriendModel;