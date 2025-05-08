import { users, playerCustomizations, gameSessions, gamePlayers, type User, type InsertUser, type PlayerCustomization, type InsertPlayerCustomization, type GameSession, type InsertGameSession, type GamePlayer, type InsertGamePlayer, GameMode, GameStatus } from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Player customization operations
  getPlayerCustomization(userId: number): Promise<PlayerCustomization | undefined>;
  createPlayerCustomization(customization: InsertPlayerCustomization): Promise<PlayerCustomization>;
  updatePlayerCustomization(userId: number, data: { ballType?: number, clubType?: number }): Promise<PlayerCustomization>;
  
  // Game session operations
  getGameById(id: number): Promise<GameSession | undefined>;
  getActiveGames(): Promise<GameSession[]>;
  createGameSession(game: InsertGameSession): Promise<GameSession>;
  updateGameStatus(id: number, status: GameStatus): Promise<GameSession>;
  deleteGame(id: number): Promise<void>;
  
  // Game players operations
  getPlayersForGame(gameId: number): Promise<(GamePlayer & { username?: string, customization?: { ballType: number, clubType: number } })[]>;
  getPlayerById(id: number): Promise<User | undefined>;
  addPlayerToGame(player: InsertGamePlayer): Promise<GamePlayer>;
  updatePlayerReady(gameId: number, userId: number, ready: boolean): Promise<GamePlayer>;
  updatePlayerTeam(gameId: number, userId: number, team: number): Promise<GamePlayer>;
  updatePlayerCustomization(gameId: number, userId: number, customization: { ballType: number, clubType: number }): Promise<void>;
  updatePlayerScore(gameId: number, userId: number, holeIndex: number, strokes: number): Promise<void>;
  removePlayerFromGame(gameId: number, userId: number): Promise<void>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private customizations: Map<number, PlayerCustomization>;
  private games: Map<number, GameSession>;
  private players: Map<number, GamePlayer>;
  
  private userId: number;
  private customizationId: number;
  private gameId: number;
  private playerId: number;
  
  constructor() {
    this.users = new Map();
    this.customizations = new Map();
    this.games = new Map();
    this.players = new Map();
    
    this.userId = 1;
    this.customizationId = 1;
    this.gameId = 1;
    this.playerId = 1;
    
    // Add some example data
    this.createUser({ username: "Player1", password: "password" });
    this.createUser({ username: "Player2", password: "password" });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  // Player customization operations
  async getPlayerCustomization(userId: number): Promise<PlayerCustomization | undefined> {
    return Array.from(this.customizations.values()).find(
      (c) => c.userId === userId,
    );
  }
  
  async createPlayerCustomization(insertCustomization: InsertPlayerCustomization): Promise<PlayerCustomization> {
    const id = this.customizationId++;
    const now = new Date();
    const customization: PlayerCustomization = { 
      ...insertCustomization, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.customizations.set(id, customization);
    return customization;
  }
  
  async updatePlayerCustomization(userId: number, data: { ballType?: number, clubType?: number }): Promise<PlayerCustomization> {
    const customization = await this.getPlayerCustomization(userId);
    
    if (!customization) {
      throw new Error('Customization not found');
    }
    
    const updated: PlayerCustomization = { 
      ...customization,
      ...data,
      updatedAt: new Date()
    };
    
    this.customizations.set(customization.id, updated);
    return updated;
  }
  
  // Game session operations
  async getGameById(id: number): Promise<GameSession | undefined> {
    return this.games.get(id);
  }
  
  async getActiveGames(): Promise<GameSession[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.status !== 'finished',
    );
  }
  
  async createGameSession(insertGame: InsertGameSession): Promise<GameSession> {
    const id = this.gameId++;
    const now = new Date();
    const game: GameSession = { 
      ...insertGame, 
      id,
      status: 'waiting',
      createdAt: now,
      updatedAt: now
    };
    this.games.set(id, game);
    return game;
  }
  
  async updateGameStatus(id: number, status: GameStatus): Promise<GameSession> {
    const game = await this.getGameById(id);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    const updated: GameSession = { 
      ...game,
      status,
      updatedAt: new Date()
    };
    
    this.games.set(id, updated);
    return updated;
  }
  
  async deleteGame(id: number): Promise<void> {
    this.games.delete(id);
    
    // Delete all players for this game
    const playersToDelete = Array.from(this.players.values())
      .filter(p => p.gameId === id)
      .map(p => p.id);
    
    playersToDelete.forEach(id => this.players.delete(id));
  }
  
  // Game players operations
  async getPlayersForGame(gameId: number): Promise<(GamePlayer & { username?: string, customization?: { ballType: number, clubType: number } })[]> {
    const players = Array.from(this.players.values()).filter(
      (player) => player.gameId === gameId,
    );
    
    // Enhance with user data and customization
    const enhancedPlayers = await Promise.all(
      players.map(async (player) => {
        const user = await this.getUser(player.userId);
        const customization = await this.getPlayerCustomization(player.userId);
        
        return {
          ...player,
          username: user?.username,
          customization: customization ? {
            ballType: customization.ballType,
            clubType: customization.clubType
          } : {
            ballType: 0,
            clubType: 0
          }
        };
      })
    );
    
    return enhancedPlayers;
  }
  
  async getPlayerById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }
  
  async addPlayerToGame(insertPlayer: InsertGamePlayer): Promise<GamePlayer> {
    const id = this.playerId++;
    const now = new Date();
    const player: GamePlayer = { 
      ...insertPlayer, 
      id,
      ready: false,
      score: {},
      createdAt: now,
      updatedAt: now
    };
    this.players.set(id, player);
    return player;
  }
  
  async updatePlayerReady(gameId: number, userId: number, ready: boolean): Promise<GamePlayer> {
    const player = Array.from(this.players.values()).find(
      (p) => p.gameId === gameId && p.userId === userId,
    );
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    const updated: GamePlayer = { 
      ...player,
      ready,
      updatedAt: new Date()
    };
    
    this.players.set(player.id, updated);
    return updated;
  }
  
  async updatePlayerTeam(gameId: number, userId: number, team: number): Promise<GamePlayer> {
    const player = Array.from(this.players.values()).find(
      (p) => p.gameId === gameId && p.userId === userId,
    );
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    const updated: GamePlayer = { 
      ...player,
      team,
      updatedAt: new Date()
    };
    
    this.players.set(player.id, updated);
    return updated;
  }
  
  async updatePlayerCustomization(gameId: number, userId: number, customization: { ballType: number, clubType: number }): Promise<void> {
    const existingCustomization = await this.getPlayerCustomization(userId);
    
    if (existingCustomization) {
      // Update existing
      await this.updatePlayerCustomization(userId, customization);
    } else {
      // Create new
      await this.createPlayerCustomization({
        userId,
        ballType: customization.ballType,
        clubType: customization.clubType
      });
    }
  }
  
  async updatePlayerScore(gameId: number, userId: number, holeIndex: number, strokes: number): Promise<void> {
    const player = Array.from(this.players.values()).find(
      (p) => p.gameId === gameId && p.userId === userId,
    );
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    // Update score
    const updatedScore = { ...player.score };
    updatedScore[holeIndex] = strokes;
    
    const updated: GamePlayer = { 
      ...player,
      score: updatedScore,
      updatedAt: new Date()
    };
    
    this.players.set(player.id, updated);
  }
  
  async removePlayerFromGame(gameId: number, userId: number): Promise<void> {
    const player = Array.from(this.players.values()).find(
      (p) => p.gameId === gameId && p.userId === userId,
    );
    
    if (!player) {
      return; // Player not found, nothing to do
    }
    
    this.players.delete(player.id);
    
    // Check if there are any players left in the game
    const remainingPlayers = Array.from(this.players.values()).filter(
      (p) => p.gameId === gameId,
    );
    
    if (remainingPlayers.length === 0) {
      // No players left, delete the game
      await this.deleteGame(gameId);
    }
  }
}

// Export singleton instance
export const storage = new MemStorage();

// Helper function to get player by ID
export async function getPlayerById(id: number): Promise<User | undefined> {
  return storage.getUser(id);
}
