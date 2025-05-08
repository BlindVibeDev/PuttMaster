import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLocalStorage, setLocalStorage } from '../utils';

interface LobbyState {
  userId: number;
  username: string;
  isLoggedIn: boolean;
  
  // Available games
  availableGames: GameLobbyInfo[];
  
  // Player stats
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number | null;
  
  // Actions
  setUser: (id: number, name: string) => void;
  updateUsername: (name: string) => void;
  logOut: () => void;
  setAvailableGames: (games: GameLobbyInfo[]) => void;
  updateStats: (played: number, won: number, bestScore: number | null) => void;
}

export interface GameLobbyInfo {
  id: number;
  name: string;
  hostId: number;
  hostName: string;
  mode: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
}

export const useLobby = create<LobbyState>()(
  persist(
    (set) => ({
      // Default state with guest user
      userId: Math.floor(Math.random() * 10000),
      username: `Guest${Math.floor(Math.random() * 1000)}`,
      isLoggedIn: false,
      availableGames: [],
      gamesPlayed: 0,
      gamesWon: 0,
      bestScore: null,
      
      // Actions
      setUser: (id: number, name: string) => set({
        userId: id,
        username: name,
        isLoggedIn: true
      }),
      
      updateUsername: (name: string) => set({ username: name }),
      
      logOut: () => set({
        isLoggedIn: false,
        userId: Math.floor(Math.random() * 10000),
        username: `Guest${Math.floor(Math.random() * 1000)}`
      }),
      
      setAvailableGames: (games: GameLobbyInfo[]) => set({ availableGames: games }),
      
      updateStats: (played: number, won: number, bestScore: number | null) => set({
        gamesPlayed: played,
        gamesWon: won,
        bestScore
      })
    }),
    {
      name: 'putt-putt-lobby',
      // Use our custom storage functions that match the required signature
      storage: {
        getItem: (name) => {
          const value = getLocalStorage(name);
          return value ? JSON.stringify(value) : null;
        },
        setItem: (name, value) => {
          setLocalStorage(name, JSON.parse(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
