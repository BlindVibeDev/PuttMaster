import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { COURSE_HOLES } from '../courses';
import { GameMode, GameStatus, PlayerAction } from '@shared/schema';

// Player data structure
interface Player {
  id: number;
  username: string;
  team: number;
  score: Record<number, number>; // hole index -> strokes
  customization: {
    ballType: number;
    clubType: number;
  };
  position?: [number, number, number];
  isCurrentTurn: boolean;
}

interface GameState {
  // Game metadata
  gameId: string;
  mode: GameMode;
  courseStyle: number;
  gameStatus: GameStatus;
  
  // Course and players
  holes: typeof COURSE_HOLES;
  currentHole: number;
  players: Player[];
  myPlayerId: number | null;
  
  // Game flow
  isMyTurn: boolean;
  canSwing: boolean;
  holeComplete: boolean;
  
  // Ball positions
  ball_positions: Record<number, [number, number, number]>;
  
  // Shot parameters
  shotPower: number;
  shotAngle: number;
  
  // Actions
  initGame: (gameId: string, players: Player[], myPlayerId: number, mode: GameMode, courseStyle: number) => void;
  updatePlayers: (players: Player[]) => void;
  updateBallPosition: (playerId: number, position: [number, number, number]) => void;
  setShotPower: (power: number) => void;
  setShotAngle: (angle: number) => void;
  setCanSwing: (canSwing: boolean) => void;
  updateScore: (playerId: number, holeIndex: number, strokes: number) => void;
  nextHole: () => void;
  setHoleComplete: (isComplete: boolean) => void;
  resetShot: () => void;
  
  // Network actions
  sendAction: (action: PlayerAction) => void;
  setActionHandler: (handler: (action: PlayerAction) => void) => void;
}

export const useGameState = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gameId: '',
    mode: 'solo',
    courseStyle: 0,
    gameStatus: 'waiting',
    
    holes: COURSE_HOLES,
    currentHole: 0,
    players: [],
    myPlayerId: null,
    
    isMyTurn: false,
    canSwing: true,
    holeComplete: false,
    
    ball_positions: {},
    
    shotPower: 0,
    shotAngle: 0,
    
    // Action handler for network actions
    actionHandler: (action: PlayerAction) => {
      console.log('Default action handler', action);
    },
    
    // Initialize the game state
    initGame: (gameId, players, myPlayerId, mode, courseStyle) => {
      set({
        gameId,
        players,
        myPlayerId,
        mode,
        courseStyle,
        gameStatus: 'playing',
        isMyTurn: players.some(p => p.id === myPlayerId && p.isCurrentTurn),
        currentHole: 0
      });
    },
    
    // Update player data from server
    updatePlayers: (players) => {
      const { myPlayerId } = get();
      set({
        players,
        isMyTurn: players.some(p => p.id === myPlayerId && p.isCurrentTurn)
      });
    },
    
    // Update a ball position
    updateBallPosition: (playerId, position) => {
      set(state => ({
        ball_positions: {
          ...state.ball_positions,
          [playerId]: position
        }
      }));
    },
    
    // Set shot power
    setShotPower: (power) => {
      set({ shotPower: power });
    },
    
    // Set shot angle
    setShotAngle: (angle) => {
      set({ shotAngle: angle });
    },
    
    // Set whether player can swing
    setCanSwing: (canSwing) => {
      set({ canSwing });
    },
    
    // Update score for a player
    updateScore: (playerId, holeIndex, strokes) => {
      set(state => ({
        players: state.players.map(p => 
          p.id === playerId 
            ? { 
                ...p, 
                score: { ...p.score, [holeIndex]: strokes } 
              }
            : p
        )
      }));
    },
    
    // Move to the next hole
    nextHole: () => {
      set(state => {
        const nextHole = state.currentHole + 1;
        
        // Check if game is complete
        if (nextHole >= COURSE_HOLES.length) {
          return { 
            gameStatus: 'finished' as GameStatus,
            holeComplete: false
          };
        }
        
        return { 
          currentHole: nextHole,
          holeComplete: false
        };
      });
    },
    
    // Mark current hole as complete
    setHoleComplete: (isComplete) => {
      set({ holeComplete: isComplete });
    },
    
    // Reset shot parameters
    resetShot: () => {
      set({ 
        shotPower: 0,
        shotAngle: 0
      });
    },
    
    // Send an action to the server
    sendAction: (action) => {
      const { actionHandler } = get();
      actionHandler(action);
    },
    
    // Set the handler for network actions
    setActionHandler: (handler) => {
      set({ actionHandler: handler });
    }
  }))
);
