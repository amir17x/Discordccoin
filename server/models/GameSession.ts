import mongoose, { Schema, Document } from 'mongoose';

/**
 * مدل جلسه بازی گروهی
 */
export interface GameSession extends Document {
  id: string;
  gameType: 'quiz' | 'drawguess' | 'truthordare' | 'bingo' | 'wordchain' | 'mafia' | 'werewolf' | 'spy';
  channelId: string;
  createdBy: string;
  players: string[];
  status: 'waiting' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  data: any; // اطلاعات خاص هر بازی
  createdAt: Date;
}

/**
 * اسکیمای جلسه بازی گروهی
 */
const GameSessionSchema = new Schema<GameSession>({
  id: { type: String, required: true, unique: true },
  gameType: { 
    type: String, 
    required: true,
    enum: ['quiz', 'drawguess', 'truthordare', 'bingo', 'wordchain', 'mafia', 'werewolf', 'spy']
  },
  channelId: { type: String, required: true },
  createdBy: { type: String, required: true },
  players: { type: [String], default: [] },
  status: { 
    type: String, 
    required: true,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  },
  startedAt: { type: Date },
  endedAt: { type: Date },
  data: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

// ایجاد یک ایندکس برای جستجوی سریع‌تر
GameSessionSchema.index({ channelId: 1, status: 1 });
GameSessionSchema.index({ gameType: 1, status: 1 });

// ساخت مدل
export const GameSessionModel = mongoose.model<GameSession>('GameSession', GameSessionSchema);

// صادر کردن مدل
export default GameSessionModel;