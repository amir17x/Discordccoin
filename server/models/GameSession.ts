import mongoose from 'mongoose';

// اسکیما امتیازات بازی
const GameScoreSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  score: { type: Number, default: 0 }
});

// اسکیما تنظیمات بازی
const GameSettingsSchema = new mongoose.Schema({
  timePerTurn: { type: Number, default: 60 },
  isPrivate: { type: Boolean, default: false },
  allowSpectators: { type: Boolean, default: true },
  maxPlayers: { type: Number, default: 10 },
  minPlayers: { type: Number, default: 3 },
  prizeCoin: { type: Number, default: 100 },
  language: { type: String, enum: ['fa', 'en'], default: 'fa' },
  dayDuration: { type: Number }, // Added for werewolf game
  nightDuration: { type: Number }, // Added for werewolf game
  votingSystem: { type: String } // Added for voting system configuration
}, { _id: false });

// اسکیما جلسه بازی
const GameSessionSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true, index: true },
  gameType: { 
    type: String, 
    required: true, 
    enum: ['quiz', 'truth_or_dare', 'wordchain', 'drawguess', 'bingo', 'mafia', 'werewolf'] 
  },
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  hostId: { type: String, required: true },
  players: [{ type: String }],
  scores: [GameScoreSchema],
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'ended'], 
    default: 'waiting' 
  },
  settings: { 
    type: GameSettingsSchema, 
    default: () => ({}) 
  },
  data: { type: mongoose.Schema.Types.Mixed }, // Added for game-specific data
  sessionNumber: { type: Number, default: 1 },
  startedAt: { type: Date },
  endedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ایندکس‌ها برای جستجوی سریع
GameSessionSchema.index({ guildId: 1, gameType: 1 });
GameSessionSchema.index({ status: 1 });
GameSessionSchema.index({ gameType: 1, status: 1 });

// مدل مونگوس
const GameSessionModel = mongoose.model('GameSession', GameSessionSchema);

// Define type for a game session document
export interface GameSession {
  gameId: string;
  gameType: 'quiz' | 'truth_or_dare' | 'wordchain' | 'drawguess' | 'bingo' | 'mafia' | 'werewolf';
  guildId: string;
  channelId: string;
  hostId: string;
  players: string[];
  scores: { playerId: string; score: number }[];
  status: 'waiting' | 'active' | 'ended';
  settings: {
    timePerTurn: number;
    isPrivate: boolean;
    allowSpectators: boolean;
    maxPlayers: number;
    minPlayers: number;
    prizeCoin: number;
    language: 'fa' | 'en';
    dayDuration?: number; // Added for werewolf game
    nightDuration?: number; // Added for werewolf game
    votingSystem?: string; // Added for voting system configuration
  };
  data?: any; // Added for storing game-specific data
  sessionNumber?: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export { GameSessionModel };
export default GameSessionModel;