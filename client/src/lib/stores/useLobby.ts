import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameLobbyInfo } from '@shared/schema';

interface LobbyState {
  userId: string;
  username: string;
  isLoggedIn: boolean;
  availableGames: GameLobbyInfo[];
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number | null;
  setUser: (id: string, name: string) => void;
  updateUsername: (name: string) => void;
  setAvailableGames: (games: GameLobbyInfo[]) => void;
  updateStats: (played: number, won: number, bestScore: number | null) => void;
}

export const useLobby = create<LobbyState>()(
  persist(
    (set) => ({
      userId: '',
      username: '',
      isLoggedIn: false,
      availableGames: [],
      gamesPlayed: 0,
      gamesWon: 0,
      bestScore: null,

      setUser: (id: string, name: string) => set({
        userId: id,
        username: name,
        isLoggedIn: true
      }),

      updateUsername: (name: string) => set({ username: name }),

      setAvailableGames: (games: GameLobbyInfo[]) => set({ availableGames: games }),

      updateStats: (played: number, won: number, bestScore: number | null) => set({
        gamesPlayed: played,
        gamesWon: won,
        bestScore
      })
    }),
    {
      name: 'putt-putt-lobby'
    }
  )
);