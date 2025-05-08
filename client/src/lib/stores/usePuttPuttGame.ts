import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GameMode, GameStatus } from '@shared/schema';

export interface PuttPuttPlayer {
  id: number;
  username: string;
  team: number;
  ballType: number;
  clubType: number;
  score: Record<number, number>; // hole -> strokes
  position: [number, number, number]; // x, y, z
  isCurrentTurn: boolean;
}

interface PuttPuttGameState {
  // Game state
  gameId: string | null;
  mode: GameMode;
  status: GameStatus;
  players: PuttPuttPlayer[];
  currentPlayerId: number | null;
  currentHole: number;
  holeCompleted: boolean;
  courseStyle: number;
  
  // Ball physics
  ballInMotion: boolean;
  ballVelocity: [number, number, number];
  
  // Shot state
  aimDirection: number; // angle in degrees
  powerLevel: number; // 0-100
  isAiming: boolean;
  isChargingShot: boolean;
  
  // Game progression
  scores: Record<number, Record<number, number>>; // playerId -> hole -> strokes
  
  // Methods to control game
  setGameId: (id: string) => void;
  setPlayers: (players: PuttPuttPlayer[]) => void;
  setCurrentPlayer: (playerId: number) => void;
  moveToNextHole: () => void;
  setBallPosition: (playerId: number, position: [number, number, number]) => void;
  setAimDirection: (angle: number) => void;
  setPowerLevel: (power: number) => void;
  setIsAiming: (isAiming: boolean) => void;
  setIsChargingShot: (isCharging: boolean) => void;
  executeShot: () => void;
  setBallInMotion: (inMotion: boolean) => void;
  setBallVelocity: (velocity: [number, number, number]) => void;
  updateScore: (playerId: number, hole: number, strokes: number) => void;
  resetGame: () => void;
}

const initialState = {
  // Game state
  gameId: null,
  mode: 'solo' as GameMode,
  status: 'waiting' as GameStatus,
  players: [],
  currentPlayerId: null,
  currentHole: 0,
  holeCompleted: false,
  courseStyle: 0,
  
  // Ball physics
  ballInMotion: false,
  ballVelocity: [0, 0, 0] as [number, number, number],
  
  // Shot state
  aimDirection: 0,
  powerLevel: 0,
  isAiming: false,
  isChargingShot: false,
  
  // Game progression
  scores: {},
};

export const usePuttPuttGame = create<PuttPuttGameState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    setGameId: (id: string) => set({ gameId: id }),
    
    setPlayers: (players: PuttPuttPlayer[]) => set({ players }),
    
    setCurrentPlayer: (playerId: number) => set(state => ({
      currentPlayerId: playerId,
      players: state.players.map(p => ({
        ...p,
        isCurrentTurn: p.id === playerId
      }))
    })),
    
    moveToNextHole: () => set(state => {
      // If we're on the last hole, end the game
      if (state.currentHole >= 8) {
        return { 
          status: 'finished' as GameStatus,
          holeCompleted: false,
          currentHole: 0
        };
      }
      
      // Otherwise move to the next hole
      return { 
        currentHole: state.currentHole + 1,
        holeCompleted: false
      };
    }),
    
    setBallPosition: (playerId: number, position: [number, number, number]) => set(state => ({
      players: state.players.map(p => 
        p.id === playerId ? { ...p, position } : p
      )
    })),
    
    setAimDirection: (angle: number) => set({ aimDirection: angle }),
    
    setPowerLevel: (power: number) => set({ powerLevel: power }),
    
    setIsAiming: (isAiming: boolean) => set({ isAiming }),
    
    setIsChargingShot: (isCharging: boolean) => set({ isChargingShot: isCharging }),
    
    executeShot: () => {
      const { aimDirection, powerLevel, currentPlayerId } = get();
      
      if (currentPlayerId === null) return;
      
      // Convert aim angle and power to velocity
      const radians = (aimDirection * Math.PI) / 180;
      const power = powerLevel / 20; // Scale down power
      
      const velocityX = Math.cos(radians) * power;
      const velocityZ = Math.sin(radians) * power;
      
      set({ 
        ballInMotion: true,
        ballVelocity: [velocityX, 0, velocityZ],
        powerLevel: 0,
        isChargingShot: false
      });
      
      // Update the score for current player on current hole
      const { currentHole, scores } = get();
      const playerScores = scores[currentPlayerId] || {};
      const currentScore = playerScores[currentHole] || 0;
      
      set(state => ({
        scores: {
          ...state.scores,
          [currentPlayerId]: {
            ...playerScores,
            [currentHole]: currentScore + 1
          }
        }
      }));
    },
    
    setBallInMotion: (inMotion: boolean) => set({ ballInMotion: inMotion }),
    
    setBallVelocity: (velocity: [number, number, number]) => set({ ballVelocity: velocity }),
    
    updateScore: (playerId: number, hole: number, strokes: number) => set(state => ({
      scores: {
        ...state.scores,
        [playerId]: {
          ...(state.scores[playerId] || {}),
          [hole]: strokes
        }
      }
    })),
    
    resetGame: () => set({ ...initialState })
  }))
);
