
import MafiaGame from '../models/MafiaGame';
import { Client, TextChannel, VoiceChannel, CategoryChannel } from 'discord.js';
import { userService } from './userService';

export const mafiaService = {
  async createGame(channelId: string, hostId: string) {
    const gameId = `mafia_${Date.now()}`;
    const game = new MafiaGame({
      gameId,
      channelId,
      hostId,
      state: 'waiting'
    });
    return await game.save();
  },

  async joinGame(gameId: string, userId: string) {
    const game = await MafiaGame.findOne({ gameId });
    if (!game || game.state !== 'waiting') return null;

    if (!game.players.find(p => p.userId === userId)) {
      game.players.push({ userId, role: 'unassigned' });
      await game.save();
    }
    return game;
  },

  async startGame(gameId: string, client: Client) {
    const game = await MafiaGame.findOne({ gameId });
    if (!game || game.players.length < game.settings.minPlayers) return null;

    // Assign roles
    const roles = this.generateRoles(game.players.length);
    game.players.forEach((player, index) => {
      player.role = roles[index];
    });

    game.state = 'night';
    game.currentDay = 1;
    game.startedAt = new Date();
    
    await game.save();
    return game;
  },

  private generateRoles(playerCount: number): string[] {
    const roles = ['mafia', 'mafia', 'citizen', 'citizen', 'detective', 'doctor'];
    while (roles.length < playerCount) roles.push('citizen');
    return this.shuffle(roles);
  },

  private shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
};
