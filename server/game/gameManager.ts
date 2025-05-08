import { storage } from '../storage';
import { GameMode, GameStatus } from '@shared/schema';
import { COURSE_HOLES } from './courseData';
import { calculateBallPhysics } from './physics';

interface GamePlayer {
  id: number;
  userId: number;
  username: string;
  ready: boolean;
  team: number;
  score: Record<number, number>;
  customization: {
    ballType: number;
    clubType: number;
  };
  position?: [number, number, number];
  isCurrentTurn: boolean;
  strokes: number;
  finishedHole: boolean;
  connected: boolean;
}

interface Game {
  id: number;
  name: string;
  hostId: number;
  mode: GameMode;
  courseStyle: number;
  status: GameStatus;
  players: GamePlayer[];
  currentHole: number;
  currentPlayerIndex: number;
  startTime: Date;
  readyForNextHole: Set<number>;
}

class GameManager {
  private games: Map<number, Game>;
  
  constructor() {
    this.games = new Map();
  }
  
  // Create a new game instance
  async createGame(gameId: number): Promise<Game> {
    // Get game details from database
    const gameData = await storage.getGameById(gameId);
    
    if (!gameData) {
      throw new Error('Game not found');
    }
    
    // Get players for this game
    const players = await storage.getPlayersForGame(gameId);
    
    // Setup player data
    const gamePlayers: GamePlayer[] = players.map((player, index) => ({
      id: player.id,
      userId: player.userId,
      username: player.username || `Player ${index + 1}`,
      ready: player.ready,
      team: player.team,
      score: {},
      customization: {
        ballType: player.customization?.ballType || 0,
        clubType: player.customization?.clubType || 0
      },
      isCurrentTurn: index === 0, // First player gets first turn
      strokes: 0,
      finishedHole: false,
      connected: true
    }));
    
    // Create the game object
    const game: Game = {
      id: gameId,
      name: gameData.name,
      hostId: gameData.hostId,
      mode: gameData.mode as GameMode,
      courseStyle: gameData.courseStyle || 0,
      status: gameData.status as GameStatus,
      players: gamePlayers,
      currentHole: 0,
      currentPlayerIndex: 0,
      startTime: new Date(),
      readyForNextHole: new Set()
    };
    
    this.games.set(gameId, game);
    
    return game;
  }
  
  // Get a game
  getGame(gameId: number): Game | undefined {
    return this.games.get(gameId);
  }
  
  // Remove a game
  removeGame(gameId: number): void {
    this.games.delete(gameId);
  }
  
  // Get full game state
  async getGameState(gameId: number): Promise<any> {
    let game = this.games.get(gameId);
    
    if (!game) {
      // Try to create it if it doesn't exist
      game = await this.createGame(gameId);
    }
    
    return {
      id: game.id,
      mode: game.mode,
      status: game.status,
      currentHole: game.currentHole,
      courseStyle: game.courseStyle,
      players: game.players.map(player => ({
        id: player.userId,
        username: player.username,
        team: player.team,
        score: player.score,
        customization: player.customization,
        position: player.position,
        isCurrentTurn: player.isCurrentTurn
      }))
    };
  }
  
  // Set player ready status
  async setPlayerReady(gameId: number, userId: number, ready: boolean, customization?: any): Promise<void> {
    // Update in database
    await storage.updatePlayerReady(gameId, userId, ready);
    
    // Update customization in database if provided
    if (customization) {
      await storage.updatePlayerCustomization(gameId, userId, customization);
    }
    
    // Update in memory
    const game = this.games.get(gameId);
    
    if (game) {
      const player = game.players.find(p => p.userId === userId);
      
      if (player) {
        player.ready = ready;
        
        if (customization) {
          player.customization = {
            ballType: customization.ballType || 0,
            clubType: customization.clubType || 0
          };
        }
      }
    }
  }
  
  // Set player team
  async setPlayerTeam(gameId: number, userId: number, team: number): Promise<void> {
    // Update in database
    await storage.updatePlayerTeam(gameId, userId, team);
    
    // Update in memory
    const game = this.games.get(gameId);
    
    if (game) {
      const player = game.players.find(p => p.userId === userId);
      
      if (player) {
        player.team = team;
      }
    }
  }
  
  // Check if game can start
  async canStartGame(gameId: number): Promise<boolean> {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }
    
    // Solo mode can start with just the host ready
    if (game.mode === 'solo') {
      return game.players.some(p => p.userId === game.hostId && p.ready);
    }
    
    // For other modes, we need a minimum number of ready players
    const minPlayers = 
      game.mode === '2player' || game.mode === '2v2' ? 2 :
      game.mode === '3player' ? 3 : 4;
    
    const readyCount = game.players.filter(p => p.ready).length;
    
    return readyCount >= minPlayers;
  }
  
  // Start the game
  async startGame(gameId: number): Promise<void> {
    // Update in database
    await storage.updateGameStatus(gameId, 'playing');
    
    // Update in memory
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    game.status = 'playing';
    game.startTime = new Date();
    
    // Set up initial positions for players
    const currentHoleData = COURSE_HOLES[game.currentHole];
    
    game.players.forEach(player => {
      player.position = [...currentHoleData.start] as [number, number, number];
      player.strokes = 0;
      player.finishedHole = false;
    });
    
    // Determine the starting player
    game.currentPlayerIndex = 0;
    game.players.forEach((player, index) => {
      player.isCurrentTurn = index === 0;
    });
  }
  
  // Process a swing action
  async processSwing(gameId: number, userId: number, angle: number, power: number): Promise<void> {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Find the player
    const playerIndex = game.players.findIndex(p => p.userId === userId);
    
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }
    
    const player = game.players[playerIndex];
    
    // Verify it's this player's turn
    if (!player.isCurrentTurn) {
      throw new Error('Not your turn');
    }
    
    // Update stroke count
    player.strokes++;
    
    // Calculate ball physics with the provided angle and power
    // This would normally simulate the ball's movement and detect collisions
    // For this demo, we'll just update the position with a simple calculation
    const currentHoleData = COURSE_HOLES[game.currentHole];
    
    // Calculate new position based on physics
    const startPos = player.position || [...currentHoleData.start] as [number, number, number];
    const result = calculateBallPhysics(startPos, angle, power, currentHoleData);
    
    // Update player position
    player.position = result.position;
    
    // Check if the ball went in the hole
    if (result.inHole) {
      // Mark player as finished this hole
      player.finishedHole = true;
      
      // Update player's score for this hole
      player.score[game.currentHole] = player.strokes;
      
      // Save score to database
      await storage.updatePlayerScore(game.id, player.userId, game.currentHole, player.strokes);
    }
    
    // If not in hole, move to next player's turn
    if (!result.inHole) {
      // Reset current turn
      player.isCurrentTurn = false;
      
      // Move to next player
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
      game.players[game.currentPlayerIndex].isCurrentTurn = true;
    }
  }
  
  // Mark a player as finished the current hole
  async playerFinishedHole(gameId: number, userId: number): Promise<void> {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Find the player
    const player = game.players.find(p => p.userId === userId);
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    // Mark player as finished
    player.finishedHole = true;
    
    // Update player's score for this hole
    player.score[game.currentHole] = player.strokes;
    
    // Save score to database
    await updatePlayerScore(game.id, player.userId, game.currentHole, player.strokes);
    
    // If all players have finished the hole, get ready for the next hole
    const allFinished = await this.haveAllPlayersFinishedHole(gameId);
    
    if (allFinished) {
      // Reset ready for next hole flags
      game.readyForNextHole.clear();
    }
  }
  
  // Check if all players have finished the current hole
  async haveAllPlayersFinishedHole(gameId: number): Promise<boolean> {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }
    
    return game.players.every(p => p.finishedHole);
  }
  
  // Mark a player as ready for the next hole
  async playerReadyForNextHole(gameId: number, userId: number): Promise<void> {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    game.readyForNextHole.add(userId);
  }
  
  // Check if all players are ready to move to the next hole
  async areAllPlayersReadyForNextHole(gameId: number): Promise<boolean> {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }
    
    // All connected players should be ready
    const connectedPlayers = game.players.filter(p => p.connected);
    
    for (const player of connectedPlayers) {
      if (!game.readyForNextHole.has(player.userId)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Move to the next hole
  async moveToNextHole(gameId: number): Promise<void> {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Check if we've completed all 9 holes
    if (game.currentHole >= 8) {
      // Game is finished
      game.status = 'finished';
      await updateGameStatus(gameId, 'finished');
      return;
    }
    
    // Move to next hole
    game.currentHole++;
    
    // Reset player state for the new hole
    const currentHoleData = COURSE_HOLES[game.currentHole];
    
    game.players.forEach(player => {
      player.position = [...currentHoleData.start] as [number, number, number];
      player.strokes = 0;
      player.finishedHole = false;
    });
    
    // Reset ready flags
    game.readyForNextHole.clear();
    
    // Reset turn to player with worst score or first player
    if (game.players.length > 1) {
      // Calculate total scores
      const playerScores = game.players.map(player => {
        let totalScore = 0;
        
        for (let hole = 0; hole < game.currentHole; hole++) {
          totalScore += player.score[hole] || 0;
        }
        
        return { player, totalScore };
      });
      
      // Sort by score (highest goes first)
      playerScores.sort((a, b) => b.totalScore - a.totalScore);
      
      // Set turns
      game.players.forEach(p => p.isCurrentTurn = false);
      
      const firstPlayerIndex = game.players.findIndex(p => 
        p.userId === playerScores[0].player.userId
      );
      
      game.currentPlayerIndex = firstPlayerIndex;
      game.players[firstPlayerIndex].isCurrentTurn = true;
    } else {
      // Solo mode - reset to first player
      game.currentPlayerIndex = 0;
      game.players[0].isCurrentTurn = true;
    }
  }
  
  // Get current hole number
  async getCurrentHole(gameId: number): Promise<number> {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    return game.currentHole;
  }
  
  // Get player's stroke count for current hole
  async getPlayerStrokes(gameId: number, userId: number): Promise<number> {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    const player = game.players.find(p => p.userId === userId);
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    return player.strokes;
  }
  
  // Handle player disconnection
  async playerDisconnected(gameId: number, userId: number): Promise<void> {
    const game = this.games.get(gameId);
    
    if (!game) {
      return;
    }
    
    const player = game.players.find(p => p.userId === userId);
    
    if (!player) {
      return;
    }
    
    player.connected = false;
    
    // If it was this player's turn, move to the next player
    if (player.isCurrentTurn) {
      player.isCurrentTurn = false;
      
      // Find next connected player
      let nextPlayerFound = false;
      let nextIndex = game.currentPlayerIndex;
      
      // Try to find the next connected player
      for (let i = 1; i <= game.players.length; i++) {
        nextIndex = (game.currentPlayerIndex + i) % game.players.length;
        
        if (game.players[nextIndex].connected) {
          game.players[nextIndex].isCurrentTurn = true;
          game.currentPlayerIndex = nextIndex;
          nextPlayerFound = true;
          break;
        }
      }
      
      // If no connected players were found, the game is effectively paused
      if (!nextPlayerFound) {
        // Game will be cleaned up after a timeout
      }
    }
  }
  
  // Check if any players are still connected
  async anyPlayersConnected(gameId: number): Promise<boolean> {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }
    
    return game.players.some(p => p.connected);
  }
}

// Export singleton instance
export const gameManager = new GameManager();
