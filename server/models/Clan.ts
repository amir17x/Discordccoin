/**
 * مدل کلن
 * این فایل مدل مونگوی کلن را تعریف می‌کند
 */

import mongoose, { Schema, Document } from 'mongoose';

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
  lastActivity: Date;
  color: string | null;
  icon: string | null;
  banner: string | null;
  elderIds: string[];
  warStatus: 'inactive' | 'searching' | 'in_war';
  warOpponentId: number | null;
  warOpponentName: string | null;
  warStartTime: Date | null;
  warEndTime: Date | null;
  warPoints: number;
  warContributions: Record<string, number>;
  roles: Record<string, string>;
  announcement: string | null;
  inviteOnly: boolean;
  minLevel: number;
}

const clanSchema = new Schema<IClan>({
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
  lastActivity: { type: Date, default: Date.now },
  color: { type: String, default: null },
  icon: { type: String, default: null },
  banner: { type: String, default: null },
  elderIds: { type: [String], default: [] },
  warStatus: { type: String, enum: ['inactive', 'searching', 'in_war'], default: 'inactive' },
  warOpponentId: { type: Number, default: null },
  warOpponentName: { type: String, default: null },
  warStartTime: { type: Date, default: null },
  warEndTime: { type: Date, default: null },
  warPoints: { type: Number, default: 0 },
  warContributions: { type: Map, of: Number, default: {} },
  roles: { type: Map, of: String, default: {} },
  announcement: { type: String, default: null },
  inviteOnly: { type: Boolean, default: false },
  minLevel: { type: Number, default: 1 }
});

// اطمینان حاصل کنیم که مدل از قبل وجود ندارد
const ClanModel = mongoose.models.Clan || mongoose.model<IClan>('Clan', clanSchema);

export default ClanModel;