import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import io, { Socket } from "socket.io-client";
import { useAudio } from "./useAudio";
import { GameState, PlayerAction } from "@shared/schema";

export type GamePhase = "ready" | "playing" | "paused" | "ended";

export type PowerState = "aiming" | "charging" | "swinging";

interface Ball {
  position: [number, number, number];
  velocity: [number, number, number];
  isMoving: boolean;
  inHole: boolean;
  inWater: boolean;
  inSand: boolean;
}

interface PlayerControls {
  angle: number;
  power: number;
  powerState: PowerState;
}

interface GameData {
  phase: GamePhase;
  gameId: number;
  currentPlayerId: number | null;
  currentHole: number;
  courseStyle: number;
  ball: Ball;
  controls: PlayerControls;
  strokes: number;
  totalStrokes: Record<number, number>;
  isConnected: boolean;
  socket: Socket | null;
  error: string | null;
  players: {
    id: number;
    username: string;
    team: number;
    score: Record<string, number>;
    position?: [number, number, number];
    isCurrentTurn: boolean;
    customization: {
      ballType: number;
      clubType: number;
    };
  }[];
  
  // Server-related actions
  connect: (gameId: number, userId: number) => void;
  disconnect: () => void;
  swing: (angle: number, power: number) => void;
  setReady: () => void;
  sendChat: (message: string) => void;
  
  // Local game state actions
  start: () => void;
  restart: () => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  setGameState: (newState: Partial<GameState>) => void;
  setAngle: (angle: number) => void;
  setPower: (power: number) => void;
  setPowerState: (state: PowerState) => void;
  setBallPosition: (position: [number, number, number]) => void;
  
  // Helper
  isMyTurn: (userId: number) => boolean;
}

export const useGame = create<GameData>()(
  subscribeWithSelector((set, get) => ({
    phase: "ready",
    gameId: 0,
    currentPlayerId: null,
    currentHole: 0,
    courseStyle: 0,
    ball: {
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      isMoving: false,
      inHole: false,
      inWater: false,
      inSand: false
    },
    controls: {
      angle: 0,
      power: 50,
      powerState: "aiming"
    },
    strokes: 0,
    totalStrokes: {},
    isConnected: false,
    socket: null,
    error: null,
    players: [],
    
    connect: (gameId: number, userId: number) => {
      const { socket } = get();
      
      // Clean up existing socket if any
      if (socket) {
        socket.disconnect();
      }
      
      try {
        // Create a new socket connection
        const newSocket = io("/", {
          query: {
            gameId: gameId.toString(),
            userId: userId.toString()
          }
        });
        
        // Setup socket event listeners
        newSocket.on("connect", () => {
          console.log("Socket connected to server");
          set({ isConnected: true, error: null });
        });
        
        newSocket.on("disconnect", () => {
          console.log("Socket disconnected from server");
          set({ isConnected: false });
        });
        
        newSocket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          set({ error: "Failed to connect to game server" });
        });
        
        newSocket.on("game:state", (gameState: GameState) => {
          console.log("Received game state:", gameState);
          set((state) => ({
            gameId: gameState.id,
            currentHole: gameState.currentHole,
            courseStyle: gameState.courseStyle,
            players: gameState.players,
            phase: gameState.status === "playing" ? "playing" : 
                   gameState.status === "finished" ? "ended" : "ready"
          }));
        });
        
        newSocket.on("game:turn", (playerId: number) => {
          set({ currentPlayerId: playerId });
          
          // Play sound if it's the user's turn
          if (playerId === userId) {
            useAudio.getState().playSuccess();
          }
        });
        
        newSocket.on("game:ball_position", (data: { 
          playerId: number, 
          position: [number, number, number],
          inHole: boolean,
          inWater: boolean,
          inSand: boolean
        }) => {
          // Update the ball position of the current player
          if (data.playerId === userId) {
            set({
              ball: {
                ...get().ball,
                position: data.position,
                isMoving: false,
                inHole: data.inHole,
                inWater: data.inWater,
                inSand: data.inSand
              }
            });
            
            // Play appropriate sound based on ball state
            if (data.inHole) {
              useAudio.getState().playSuccess();
            } else if (data.inWater) {
              useAudio.getState().playWater();
            } else {
              useAudio.getState().playBounce();
            }
          }
          
          // Update player positions in the game state
          set((state) => ({
            players: state.players.map(player => 
              player.id === data.playerId 
                ? { ...player, position: data.position }
                : player
            )
          }));
        });
        
        newSocket.on("game:score", (data: { playerId: number, hole: number, strokes: number }) => {
          if (data.playerId === userId) {
            set((state) => ({
              strokes: data.strokes,
              totalStrokes: {
                ...state.totalStrokes,
                [data.hole]: data.strokes
              }
            }));
          }
        });
        
        newSocket.on("error", (error: string) => {
          console.error("Game server error:", error);
          set({ error });
        });
        
        // Store the socket in state
        set({ socket: newSocket, gameId });
      } catch (error) {
        console.error("Failed to initialize socket connection:", error);
        set({ error: "Failed to connect to game server" });
      }
    },
    
    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ socket: null, isConnected: false });
      }
    },
    
    swing: (angle: number, power: number) => {
      const { socket } = get();
      if (socket) {
        const action: PlayerAction = {
          type: 'swing',
          angle,
          power
        };
        
        socket.emit('player:action', action);
        useAudio.getState().playSwing();
        
        set((state) => ({
          controls: {
            ...state.controls,
            powerState: "swinging"
          },
          ball: {
            ...state.ball,
            isMoving: true
          }
        }));
      }
    },
    
    setReady: () => {
      const { socket } = get();
      if (socket) {
        const action: PlayerAction = {
          type: 'ready'
        };
        
        socket.emit('player:action', action);
      }
    },
    
    sendChat: (message: string) => {
      const { socket } = get();
      if (socket && message.trim()) {
        const action: PlayerAction = {
          type: 'chat',
          message
        };
        
        socket.emit('player:action', action);
      }
    },
    
    start: () => {
      set((state) => {
        // Only transition from ready to playing
        if (state.phase === "ready") {
          return { phase: "playing" };
        }
        return {};
      });
    },
    
    restart: () => {
      set(() => ({ 
        phase: "ready",
        strokes: 0,
        ball: {
          position: [0, 0, 0],
          velocity: [0, 0, 0],
          isMoving: false,
          inHole: false,
          inWater: false,
          inSand: false
        },
        controls: {
          angle: 0,
          power: 50,
          powerState: "aiming"
        }
      }));
    },
    
    pause: () => {
      set((state) => {
        if (state.phase === "playing") {
          useAudio.getState().pauseBackgroundMusic();
          return { phase: "paused" };
        }
        return {};
      });
    },
    
    resume: () => {
      set((state) => {
        if (state.phase === "paused") {
          useAudio.getState().resumeBackgroundMusic();
          return { phase: "playing" };
        }
        return {};
      });
    },
    
    end: () => {
      set((state) => {
        // Only transition from playing to ended
        if (state.phase === "playing" || state.phase === "paused") {
          return { phase: "ended" };
        }
        return {};
      });
    },
    
    setGameState: (newState) => {
      set(newState);
    },
    
    setAngle: (angle: number) => {
      set((state) => ({
        controls: {
          ...state.controls,
          angle
        }
      }));
    },
    
    setPower: (power: number) => {
      set((state) => ({
        controls: {
          ...state.controls,
          power: Math.max(0, Math.min(100, power))
        }
      }));
    },
    
    setPowerState: (powerState: PowerState) => {
      set((state) => ({
        controls: {
          ...state.controls,
          powerState
        }
      }));
    },
    
    setBallPosition: (position: [number, number, number]) => {
      set((state) => ({
        ball: {
          ...state.ball,
          position
        }
      }));
    },
    
    isMyTurn: (userId: number) => {
      return get().currentPlayerId === userId;
    }
  }))
);
