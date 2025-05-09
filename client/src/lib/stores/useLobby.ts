import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameSession } from '@shared/schema';

// Define GameLobbyInfo as a simplified version of GameSession
interface GameLobbyInfo extends Pick<GameSession, 'id' | 'name' | 'hostId' | 'mode' | 'status'> {
  playerCount: number;
}

interface LobbyState {
  userId: string; // Could be a Replit user ID or wallet address
  username: string;
  isLoggedIn: boolean;
  availableGames: GameLobbyInfo[];
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number | null;
  authMethod: 'replit' | 'wallet' | null;
  walletAddress?: string;
  
  // Actions
  setUser: (id: string, name: string, method?: 'replit' | 'wallet') => void;
  updateUsername: (name: string) => void;
  setAvailableGames: (games: GameLobbyInfo[]) => void;
  updateStats: (played: number, won: number, bestScore: number | null) => void;
  logout: () => void;
  setWalletAddress: (address: string) => void;
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
      authMethod: null,
      walletAddress: undefined,

      setUser: (id: string, name: string, method = 'replit') => set({
        userId: id,
        username: name,
        isLoggedIn: true,
        authMethod: method,
        // If it's a wallet login, also store the wallet address
        ...(method === 'wallet' ? { walletAddress: id } : {})
      }),

      updateUsername: (name: string) => set({ username: name }),

      setAvailableGames: (games: GameLobbyInfo[]) => set({ availableGames: games }),

      updateStats: (played: number, won: number, bestScore: number | null) => set({
        gamesPlayed: played,
        gamesWon: won,
        bestScore
      }),

      logout: () => set({
        isLoggedIn: false,
        authMethod: null,
        // We don't clear userId/username to allow for easy re-login
      }),

      setWalletAddress: (address: string) => set((state) => ({
        walletAddress: address,
        // If already logged in with wallet, this updates the userId too
        ...(state.authMethod === 'wallet' ? { userId: address } : {})
      }))
    }),
    {
      name: 'putt-putt-lobby'
    }
  )
);