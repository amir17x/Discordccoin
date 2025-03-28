import mongoose, { Document, Schema } from 'mongoose';

// تعریف ساختار پیام ناشناس
export interface IAnonymousMessage extends Document {
  chatId: string;
  senderAlias: string;
  content: string;
  timestamp: Date;
}

// طرح اسکیما برای پیام ناشناس
const AnonymousMessageSchema = new Schema<IAnonymousMessage>(
  {
    chatId: { type: String, required: true, ref: 'AnonymousChat' },
    senderAlias: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// تعریف ساختار گفتگوی ناشناس
export interface IAnonymousChat extends Document {
  createdAt: Date;
  lastActivity: Date;
  participants: string[];
  messages: IAnonymousMessage[];
}

// طرح اسکیما برای گفتگوی ناشناس
const AnonymousChatSchema = new Schema<IAnonymousChat>(
  {
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    participants: [{ type: String, required: true }],
    messages: [AnonymousMessageSchema]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایجاد ایندکس‌های مورد نیاز برای بهبود کارایی
AnonymousChatSchema.index({ participants: 1 });
AnonymousChatSchema.index({ lastActivity: -1 });
AnonymousChatSchema.index({ createdAt: -1 });

AnonymousMessageSchema.index({ chatId: 1 });
AnonymousMessageSchema.index({ timestamp: -1 });

// ایجاد و صادر کردن مدل
export const AnonymousMessageModel = mongoose.model<IAnonymousMessage>('AnonymousMessage', AnonymousMessageSchema);
export const AnonymousChatModel = mongoose.model<IAnonymousChat>('AnonymousChat', AnonymousChatSchema);

export default AnonymousChatModel;