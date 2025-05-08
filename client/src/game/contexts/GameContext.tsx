import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSocket } from '../hooks/useGameSocket';
import { useGameState } from '../hooks/useGameState';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';

interface GameContextProps {
  gameId: string;
  loading: boolean;
  error: string | null;
  userId: number;
  isConnected: boolean;
}

const GameContext = createContext<GameContextProps | null>(null);

interface GameProviderProps {
  children: ReactNode;
  userId: number;
}

export function GameProvider({ children, userId }: GameProviderProps) {
  const { id: gameId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Fetch initial game data
  useEffect(() => {
    if (!gameId) {
      setError('Game ID is required');
      setLoading(false);
      return;
    }
    
    const fetchGame = async () => {
      try {
        const res = await apiRequest('GET', `/api/games/${gameId}`);
        const gameData = await res.json();
        
        // Check if user is part of this game
        const isUserInGame = gameData.players.some((p: any) => p.userId === userId);
        
        if (!isUserInGame) {
          setError('You are not a part of this game');
          toast.error('You are not a participant in this game');
          setTimeout(() => {
            navigate('/lobby');
          }, 3000);
          return;
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Failed to load game data');
        toast.error('Failed to load game data');
        setLoading(false);
      }
    };
    
    fetchGame();
  }, [gameId, userId, navigate]);
  
  // Connect to the game socket
  const { isConnected, error: socketError } = useGameSocket({ 
    gameId: gameId || '', 
    userId
  });
  
  // Update error state if socket has an error
  useEffect(() => {
    if (socketError) {
      setError(socketError);
      toast.error(`Connection error: ${socketError}`);
    }
  }, [socketError]);
  
  // Context value
  const value: GameContextProps = {
    gameId: gameId || '',
    loading,
    error: error || socketError,
    userId,
    isConnected
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use the game context
export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
