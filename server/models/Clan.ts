import mongoose, { Schema, Document } from 'mongoose';

/**
 * رابط کلن برای استفاده در تایپ‌اسکریپت
 */
export interface IClan extends Document {
  id: number;
  name: string;
  description: string | null;
  ownerId: string;
  bank: number;
  level: number;
  experience: number;
  memberCount: number;
  warWins: number;
  warLosses: number;
  createdAt: Date;
  coLeaderIds: string[];
  memberIds: string[];
  joinRequests: string[];
  maxMembers: number;
  lastActivity: Date | null;
  color: string | null;
  icon: string | null;
  banner: string | null;
}

/**
 * طرح داده‌ای کلن در MongoDB
 */
const ClanSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  ownerId: { type: String, required: true },
  bank: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  memberCount: { type: Number, default: 1 },
  warWins: { type: Number, default: 0 },
  warLosses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  coLeaderIds: { type: [String], default: [] },
  memberIds: { type: [String], default: [] },
  joinRequests: { type: [String], default: [] },
  maxMembers: { type: Number, default: 10 },
  lastActivity: { type: Date, default: null },
  color: { type: String, default: null },
  icon: { type: String, default: null },
  banner: { type: String, default: null }
}, { 
  timestamps: true,
  versionKey: false
});

export default mongoose.model<IClan>('Clan', ClanSchema);