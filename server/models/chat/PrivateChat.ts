import mongoose, { Document, Schema } from 'mongoose';

// تعریف ساختار پیام خصوصی
export interface IPrivateMessage extends Document {
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments: string[];
  reactions: Record<string, string[]>;
}

// اسکیما برای پیام خصوصی
const PrivateMessageSchema = new Schema<IPrivateMessage>(
  {
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    attachments: { type: [String], default: [] },
    reactions: { 
      type: Map, 
      of: [String],
      default: () => new Map()
    }
  },
  {
    _id: true,
    versionKey: false
  }
);

// تعریف ساختار چت خصوصی
export interface IPrivateChat extends Document {
  user1Id: string;
  user2Id: string;
  lastActivity: Date;
  messages: IPrivateMessage[];
  isBlocked: boolean;
  blockedBy?: string;
}

// اسکیما برای چت خصوصی
const PrivateChatSchema = new Schema<IPrivateChat>(
  {
    user1Id: { type: String, required: true },
    user2Id: { type: String, required: true },
    lastActivity: { type: Date, default: Date.now },
    messages: [PrivateMessageSchema],
    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: String }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایجاد ایندکس‌های ترکیبی برای بهبود کارایی
PrivateChatSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
PrivateChatSchema.index({ user1Id: 1 });
PrivateChatSchema.index({ user2Id: 1 });
PrivateChatSchema.index({ lastActivity: -1 });
PrivateChatSchema.index({ isBlocked: 1 });

// متد استاتیک برای بررسی وجود چت خصوصی بین دو کاربر
PrivateChatSchema.statics.findChat = async function(
  user1Id: string,
  user2Id: string
): Promise<IPrivateChat | null> {
  return await this.findOne({
    $or: [
      { user1Id, user2Id },
      { user1Id: user2Id, user2Id: user1Id }
    ]
  });
};

// متد استاتیک برای ایجاد چت خصوصی جدید
PrivateChatSchema.statics.createChat = async function(
  user1Id: string,
  user2Id: string
): Promise<IPrivateChat> {
  // اطمینان از اینکه کاربران به ترتیب الفبایی مرتب شوند برای جلوگیری از ایجاد چت‌های تکراری
  const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort();
  
  const chat = await this.create({
    user1Id: sortedUser1,
    user2Id: sortedUser2,
    lastActivity: new Date(),
    messages: []
  });
  
  return chat;
};

// متد استاتیک برای یافتن یا ایجاد چت خصوصی
PrivateChatSchema.statics.findOrCreateChat = async function(
  user1Id: string,
  user2Id: string
): Promise<IPrivateChat> {
  // بررسی وجود چت
  const existingChat = await this.findChat(user1Id, user2Id);
  
  if (existingChat) {
    return existingChat;
  }
  
  // ایجاد چت جدید
  return await this.createChat(user1Id, user2Id);
};

// متد استاتیک برای افزودن پیام جدید به چت
PrivateChatSchema.statics.addMessage = async function(
  chatId: string,
  senderId: string,
  content: string,
  attachments: string[] = []
): Promise<IPrivateChat | null> {
  // بررسی وجود چت
  const chat = await this.findById(chatId);
  
  if (!chat) {
    return null;
  }
  
  // بررسی مسدود بودن چت
  if (chat.isBlocked) {
    throw new Error('این چت مسدود شده است');
  }
  
  // بررسی اینکه فرستنده یکی از دو طرف چت باشد
  if (chat.user1Id !== senderId && chat.user2Id !== senderId) {
    throw new Error('شما مجاز به ارسال پیام در این چت نیستید');
  }
  
  // ایجاد پیام جدید
  const newMessage = {
    senderId,
    content,
    timestamp: new Date(),
    isRead: false,
    attachments,
    reactions: {}
  };
  
  // افزودن پیام به چت
  chat.messages.push(newMessage);
  chat.lastActivity = new Date();
  
  await chat.save();
  
  return chat;
};

// متد استاتیک برای علامت‌گذاری پیام‌ها به عنوان خوانده شده
PrivateChatSchema.statics.markAsRead = async function(
  chatId: string,
  userId: string
): Promise<boolean> {
  // بررسی وجود چت
  const chat = await this.findById(chatId);
  
  if (!chat) {
    return false;
  }
  
  // بررسی اینکه کاربر یکی از دو طرف چت باشد
  if (chat.user1Id !== userId && chat.user2Id !== userId) {
    throw new Error('شما مجاز به دسترسی به این چت نیستید');
  }
  
  // علامت‌گذاری پیام‌های خوانده نشده که توسط کاربر دیگر ارسال شده‌اند
  let updated = false;
  for (const message of chat.messages) {
    if (!message.isRead && message.senderId !== userId) {
      message.isRead = true;
      updated = true;
    }
  }
  
  if (updated) {
    await chat.save();
  }
  
  return updated;
};

// متد استاتیک برای افزودن واکنش به پیام
PrivateChatSchema.statics.addReaction = async function(
  chatId: string,
  messageId: string,
  userId: string,
  reaction: string
): Promise<IPrivateChat | null> {
  // بررسی وجود چت
  const chat = await this.findById(chatId);
  
  if (!chat) {
    return null;
  }
  
  // بررسی اینکه کاربر یکی از دو طرف چت باشد
  if (chat.user1Id !== userId && chat.user2Id !== userId) {
    throw new Error('شما مجاز به دسترسی به این چت نیستید');
  }
  
  // یافتن پیام مورد نظر
  const message = chat.messages.id(messageId);
  
  if (!message) {
    throw new Error('پیام مورد نظر یافت نشد');
  }
  
  // افزودن واکنش
  if (!message.reactions[reaction]) {
    message.reactions[reaction] = [];
  }
  
  // بررسی تکراری نبودن واکنش
  if (!message.reactions[reaction].includes(userId)) {
    message.reactions[reaction].push(userId);
    await chat.save();
  }
  
  return chat;
};

// متد استاتیک برای حذف واکنش از پیام
PrivateChatSchema.statics.removeReaction = async function(
  chatId: string,
  messageId: string,
  userId: string,
  reaction: string
): Promise<IPrivateChat | null> {
  // بررسی وجود چت
  const chat = await this.findById(chatId);
  
  if (!chat) {
    return null;
  }
  
  // بررسی اینکه کاربر یکی از دو طرف چت باشد
  if (chat.user1Id !== userId && chat.user2Id !== userId) {
    throw new Error('شما مجاز به دسترسی به این چت نیستید');
  }
  
  // یافتن پیام مورد نظر
  const message = chat.messages.id(messageId);
  
  if (!message) {
    throw new Error('پیام مورد نظر یافت نشد');
  }
  
  // حذف واکنش
  if (message.reactions[reaction]) {
    const index = message.reactions[reaction].indexOf(userId);
    if (index !== -1) {
      message.reactions[reaction].splice(index, 1);
      
      // اگر آرایه واکنش خالی شد، کلید را حذف می‌کنیم
      if (message.reactions[reaction].length === 0) {
        delete message.reactions[reaction];
      }
      
      await chat.save();
    }
  }
  
  return chat;
};

// متد استاتیک برای مسدود کردن چت
PrivateChatSchema.statics.blockChat = async function(
  chatId: string,
  userId: string
): Promise<IPrivateChat | null> {
  // بررسی وجود چت
  const chat = await this.findById(chatId);
  
  if (!chat) {
    return null;
  }
  
  // بررسی اینکه کاربر یکی از دو طرف چت باشد
  if (chat.user1Id !== userId && chat.user2Id !== userId) {
    throw new Error('شما مجاز به دسترسی به این چت نیستید');
  }
  
  // مسدود کردن چت
  chat.isBlocked = true;
  chat.blockedBy = userId;
  
  await chat.save();
  
  return chat;
};

// متد استاتیک برای رفع مسدودیت چت
PrivateChatSchema.statics.unblockChat = async function(
  chatId: string,
  userId: string
): Promise<IPrivateChat | null> {
  // بررسی وجود چت
  const chat = await this.findById(chatId);
  
  if (!chat) {
    return null;
  }
  
  // بررسی اینکه کاربر مسدودکننده چت باشد
  if (chat.blockedBy !== userId) {
    throw new Error('فقط کاربری که چت را مسدود کرده می‌تواند مسدودیت را بردارد');
  }
  
  // رفع مسدودیت چت
  chat.isBlocked = false;
  chat.blockedBy = undefined;
  
  await chat.save();
  
  return chat;
};

// متد استاتیک برای دریافت چت‌های یک کاربر
PrivateChatSchema.statics.getUserChats = async function(
  userId: string,
  limit: number = 50,
  skip: number = 0
): Promise<IPrivateChat[]> {
  return await this.find({
    $or: [
      { user1Id: userId },
      { user2Id: userId }
    ]
  })
  .sort({ lastActivity: -1 })
  .skip(skip)
  .limit(limit);
};

// متد استاتیک برای دریافت چت‌های خوانده نشده یک کاربر
PrivateChatSchema.statics.getUnreadChats = async function(
  userId: string
): Promise<{ chatId: string; unreadCount: number }[]> {
  const chats = await this.find({
    $or: [
      { user1Id: userId },
      { user2Id: userId }
    ]
  });
  
  const unreadChats = [];
  
  for (const chat of chats) {
    // شمارش پیام‌های خوانده نشده که توسط کاربر دیگر ارسال شده‌اند
    const unreadCount = chat.messages.filter(
      (msg: IPrivateMessage) => !msg.isRead && msg.senderId !== userId
    ).length;
    
    if (unreadCount > 0) {
      unreadChats.push({
        chatId: chat._id,
        unreadCount
      });
    }
  }
  
  return unreadChats;
};

// متد استاتیک برای شمارش کل پیام‌های خوانده نشده یک کاربر
PrivateChatSchema.statics.countTotalUnreadMessages = async function(
  userId: string
): Promise<number> {
  const chats = await this.find({
    $or: [
      { user1Id: userId },
      { user2Id: userId }
    ]
  });
  
  let totalUnread = 0;
  
  for (const chat of chats) {
    // شمارش پیام‌های خوانده نشده که توسط کاربر دیگر ارسال شده‌اند
    const unreadCount = chat.messages.filter(
      (msg: IPrivateMessage) => !msg.isRead && msg.senderId !== userId
    ).length;
    
    totalUnread += unreadCount;
  }
  
  return totalUnread;
};

// متد استاتیک برای حذف یک پیام
PrivateChatSchema.statics.deleteMessage = async function(
  chatId: string,
  messageId: string,
  userId: string
): Promise<IPrivateChat | null> {
  // بررسی وجود چت
  const chat = await this.findById(chatId);
  
  if (!chat) {
    return null;
  }
  
  // یافتن پیام مورد نظر
  const message = chat.messages.id(messageId);
  
  if (!message) {
    throw new Error('پیام مورد نظر یافت نشد');
  }
  
  // بررسی اینکه کاربر فرستنده پیام باشد
  if (message.senderId !== userId) {
    throw new Error('فقط فرستنده پیام می‌تواند آن را حذف کند');
  }
  
  // حذف پیام
  chat.messages.id(messageId).remove();
  
  // بروزرسانی زمان آخرین فعالیت
  if (chat.messages.length > 0) {
    // اگر پیام دیگری وجود دارد، آخرین فعالیت را با آخرین پیام تنظیم می‌کنیم
    const lastMessage = chat.messages[chat.messages.length - 1];
    chat.lastActivity = lastMessage.timestamp;
  }
  
  await chat.save();
  
  return chat;
};

// متد استاتیک برای حذف کامل چت
PrivateChatSchema.statics.deleteChat = async function(
  chatId: string,
  userId: string
): Promise<boolean> {
  // بررسی وجود چت
  const chat = await this.findById(chatId);
  
  if (!chat) {
    return false;
  }
  
  // بررسی اینکه کاربر یکی از دو طرف چت باشد
  if (chat.user1Id !== userId && chat.user2Id !== userId) {
    throw new Error('شما مجاز به دسترسی به این چت نیستید');
  }
  
  // حذف چت
  await this.findByIdAndDelete(chatId);
  
  return true;
};

// متد استاتیک برای جستجو در پیام‌های چت
PrivateChatSchema.statics.searchMessages = async function(
  userId: string,
  searchTerm: string,
  limit: number = 50
): Promise<{ chatId: string; message: IPrivateMessage }[]> {
  // یافتن چت‌های کاربر
  const chats = await this.find({
    $or: [
      { user1Id: userId },
      { user2Id: userId }
    ]
  });
  
  const results = [];
  
  // جستجو در پیام‌های هر چت
  for (const chat of chats) {
    // یافتن پیام‌های منطبق با عبارت جستجو
    const matchingMessages = chat.messages.filter(
      (msg: IPrivateMessage) => msg.content.includes(searchTerm)
    );
    
    // افزودن نتایج به آرایه نهایی
    for (const message of matchingMessages) {
      results.push({
        chatId: chat._id,
        message
      });
      
      // محدود کردن تعداد نتایج
      if (results.length >= limit) {
        break;
      }
    }
    
    // محدود کردن تعداد نتایج
    if (results.length >= limit) {
      break;
    }
  }
  
  return results;
};

// ایجاد و صادر کردن مدل‌ها
export const PrivateChatModel = mongoose.model<IPrivateChat>('PrivateChat', PrivateChatSchema);

export default PrivateChatModel;