import mongoose, { Document, Schema } from 'mongoose';

// تعریف ساختار درخواست دوستی
export interface IFriendRequest extends Document {
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
}

// اسکیما برای درخواست دوستی
const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'rejected'], 
      default: 'pending',
      required: true 
    },
    message: { type: String },
    createdAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

// ایجاد ایندکس‌های ترکیبی برای بهبود کارایی
FriendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
FriendRequestSchema.index({ senderId: 1 });
FriendRequestSchema.index({ receiverId: 1 });
FriendRequestSchema.index({ status: 1 });
FriendRequestSchema.index({ createdAt: -1 });

// متد استاتیک برای بررسی وجود درخواست دوستی فعال بین دو کاربر
FriendRequestSchema.statics.hasActiveRequest = async function(
  user1Id: string,
  user2Id: string
): Promise<boolean> {
  const count = await this.countDocuments({
    $or: [
      { senderId: user1Id, receiverId: user2Id, status: 'pending' },
      { senderId: user2Id, receiverId: user1Id, status: 'pending' }
    ]
  });
  
  return count > 0;
};

// متد استاتیک برای یافتن درخواست دوستی فعال بین دو کاربر
FriendRequestSchema.statics.findActiveRequest = async function(
  user1Id: string,
  user2Id: string
): Promise<IFriendRequest | null> {
  return await this.findOne({
    $or: [
      { senderId: user1Id, receiverId: user2Id, status: 'pending' },
      { senderId: user2Id, receiverId: user1Id, status: 'pending' }
    ]
  });
};

// متد استاتیک برای یافتن درخواست دوستی توسط شناسه
FriendRequestSchema.statics.findRequestById = async function(
  requestId: string
): Promise<IFriendRequest | null> {
  return await this.findById(requestId);
};

// متد استاتیک برای ارسال درخواست دوستی جدید
FriendRequestSchema.statics.sendRequest = async function(
  senderId: string,
  receiverId: string,
  message?: string
): Promise<IFriendRequest> {
  // بررسی عدم وجود درخواست قبلی
  const existingRequest = await this.findOne({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId }
    ]
  });
  
  if (existingRequest) {
    // اگر درخواست قبلی وجود دارد و وضعیت آن رد شده است، آن را بروزرسانی می‌کنیم
    if (existingRequest.status === 'rejected') {
      existingRequest.status = 'pending';
      existingRequest.createdAt = new Date();
      existingRequest.message = message;
      existingRequest.respondedAt = undefined;
      await existingRequest.save();
      return existingRequest;
    }
    
    // در غیر این صورت، خطا برمی‌گردانیم
    throw new Error('درخواست دوستی قبلاً وجود دارد');
  }
  
  // ایجاد درخواست جدید
  const newRequest = await this.create({
    senderId,
    receiverId,
    status: 'pending',
    message,
    createdAt: new Date()
  });
  
  return newRequest;
};

// متد استاتیک برای پذیرفتن درخواست دوستی
FriendRequestSchema.statics.acceptRequest = async function(
  requestId: string,
  receiverId: string
): Promise<IFriendRequest> {
  // یافتن درخواست
  const request = await this.findById(requestId);
  
  if (!request) {
    throw new Error('درخواست دوستی یافت نشد');
  }
  
  // بررسی اینکه گیرنده فعلی باشد
  if (request.receiverId !== receiverId) {
    throw new Error('شما مجاز به پذیرش این درخواست نیستید');
  }
  
  // بررسی وضعیت درخواست
  if (request.status !== 'pending') {
    throw new Error('این درخواست قبلاً پاسخ داده شده است');
  }
  
  // پذیرش درخواست
  request.status = 'accepted';
  request.respondedAt = new Date();
  
  await request.save();
  
  return request;
};

// متد استاتیک برای رد کردن درخواست دوستی
FriendRequestSchema.statics.rejectRequest = async function(
  requestId: string,
  receiverId: string
): Promise<IFriendRequest> {
  // یافتن درخواست
  const request = await this.findById(requestId);
  
  if (!request) {
    throw new Error('درخواست دوستی یافت نشد');
  }
  
  // بررسی اینکه گیرنده فعلی باشد
  if (request.receiverId !== receiverId) {
    throw new Error('شما مجاز به رد این درخواست نیستید');
  }
  
  // بررسی وضعیت درخواست
  if (request.status !== 'pending') {
    throw new Error('این درخواست قبلاً پاسخ داده شده است');
  }
  
  // رد درخواست
  request.status = 'rejected';
  request.respondedAt = new Date();
  
  await request.save();
  
  return request;
};

// متد استاتیک برای لغو درخواست دوستی توسط فرستنده
FriendRequestSchema.statics.cancelRequest = async function(
  requestId: string,
  senderId: string
): Promise<boolean> {
  // یافتن درخواست
  const request = await this.findById(requestId);
  
  if (!request) {
    throw new Error('درخواست دوستی یافت نشد');
  }
  
  // بررسی اینکه فرستنده فعلی باشد
  if (request.senderId !== senderId) {
    throw new Error('شما مجاز به لغو این درخواست نیستید');
  }
  
  // بررسی وضعیت درخواست
  if (request.status !== 'pending') {
    throw new Error('این درخواست قبلاً پاسخ داده شده و قابل لغو نیست');
  }
  
  // حذف درخواست
  await this.findByIdAndDelete(requestId);
  
  return true;
};

// متد استاتیک برای دریافت درخواست‌های دوستی دریافتی
FriendRequestSchema.statics.getReceivedRequests = async function(
  userId: string,
  status?: 'pending' | 'accepted' | 'rejected',
  limit: number = 50,
  skip: number = 0
): Promise<IFriendRequest[]> {
  const query: any = { receiverId: userId };
  
  if (status) {
    query.status = status;
  }
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// متد استاتیک برای دریافت درخواست‌های دوستی ارسالی
FriendRequestSchema.statics.getSentRequests = async function(
  userId: string,
  status?: 'pending' | 'accepted' | 'rejected',
  limit: number = 50,
  skip: number = 0
): Promise<IFriendRequest[]> {
  const query: any = { senderId: userId };
  
  if (status) {
    query.status = status;
  }
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// متد استاتیک برای شمارش درخواست‌های دوستی دریافتی
FriendRequestSchema.statics.countReceivedRequests = async function(
  userId: string,
  status?: 'pending' | 'accepted' | 'rejected'
): Promise<number> {
  const query: any = { receiverId: userId };
  
  if (status) {
    query.status = status;
  }
  
  return await this.countDocuments(query);
};

// متد استاتیک برای شمارش درخواست‌های دوستی ارسالی
FriendRequestSchema.statics.countSentRequests = async function(
  userId: string,
  status?: 'pending' | 'accepted' | 'rejected'
): Promise<number> {
  const query: any = { senderId: userId };
  
  if (status) {
    query.status = status;
  }
  
  return await this.countDocuments(query);
};

// متد استاتیک برای پاک کردن درخواست‌های دوستی قدیمی
FriendRequestSchema.statics.cleanupOldRequests = async function(
  olderThanDays: number = 30,
  status?: 'rejected' | 'accepted'
): Promise<number> {
  const query: any = {};
  
  // تعیین تاریخ برش
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  // فقط درخواست‌های با وضعیت مشخص شده و قدیمی‌تر از تاریخ برش
  if (status) {
    query.status = status;
  } else {
    // اگر وضعیت مشخص نشده، فقط درخواست‌های پاسخ داده شده را حذف می‌کنیم
    query.status = { $ne: 'pending' };
  }
  
  query.createdAt = { $lt: cutoffDate };
  
  // حذف درخواست‌ها
  const result = await this.deleteMany(query);
  
  return result.deletedCount;
};

// ایجاد و صادر کردن مدل
export const FriendRequestModel = mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);

export default FriendRequestModel;