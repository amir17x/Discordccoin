
import mongoose from 'mongoose';

// Schema for Mafia game player
const MafiaPlayerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['mafia', 'citizen', 'detective', 'doctor', 'sniper', 'psychologist', 'godfather', 'silencer', 'bodyguard'],
    required: true 
  },
  isAlive: { type: Boolean, default: true },
  isSilenced: { type: Boolean, default: false },
  hasUsedAbility: { type: Boolean, default: false },
  voteTarget: { type: String },
  nightAction: { type: String }
});

// Schema for Mafia game
const MafiaGameSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  hostId: { type: String, required: true },
  players: [MafiaPlayerSchema],
  state: {
    type: String,
    enum: ['waiting', 'assigning_roles', 'night', 'day', 'voting', 'ended'],
    default: 'waiting'
  },
  settings: {
    dayDuration: { type: Number, default: 300 }, // 5 minutes
    nightDuration: { type: Number, default: 180 }, // 3 minutes
    minPlayers: { type: Number, default: 6 },
    maxPlayers: { type: Number, default: 12 },
    prizeCoin: { type: Number, default: 500 }
  },
  currentDay: { type: Number, default: 0 },
  votingResults: { type: Map, of: Number },
  nightActions: { type: Map, of: String },
  messages: [{ messageId: String, type: String }],
  startedAt: { type: Date },
  endedAt: { type: Date },
  winners: [{ type: String }],
  voiceChannels: {
    category: { type: String },
    general: { type: String },
    mafia: { type: String }
  }
});

const MafiaGame = mongoose.model('MafiaGame', MafiaGameSchema);

export default MafiaGame;
