import { Document } from 'mongoose';

// تعریف اینترفیس برای اسکیما امتیازات بازی
export interface GameScore {
  playerId: string;
  score: number;
}

// تعریف اینترفیس برای اسکیما تنظیمات بازی
export interface GameSettings {
  timePerTurn: number;
  isPrivate: boolean;
  allowSpectators: boolean;
  maxPlayers: number;
  minPlayers: number;
  prizeCoin: number;
  language: 'fa' | 'en';
}

// تعریف اینترفیس برای اسکیما جلسه بازی
export interface GameSession extends Document {
  gameId: string;
  gameType: 'quiz' | 'truth_or_dare' | 'wordchain' | 'drawguess' | 'bingo' | 'mafia';
  guildId: string;
  channelId: string;
  hostId: string;
  players: string[];
  scores: GameScore[];
  status: 'waiting' | 'active' | 'ended';
  settings: GameSettings;
  sessionNumber: number;
  startedAt: Date;
  endedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}