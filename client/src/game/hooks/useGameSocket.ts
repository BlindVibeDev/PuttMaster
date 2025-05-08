import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameState } from './useGameState';
import { GameState, PlayerAction } from '@shared/schema';

interface UseGameSocketProps {
  gameId: string;
  userId: number;
}

interface UseGameSocketReturn {
  isConnected: boolean;
  error: string | null;
}

export function useGameSocket({ gameId, userId }: UseGameSocketProps): UseGameSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    initGame,
    updatePlayers,
    updateBallPosition,
    setHoleComplete,
    nextHole,
    setActionHandler,
    updateScore
  } = useGameState();
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('/', {
      query: {
        gameId,
        userId
      }
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [gameId, userId]);
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
      setError(`Connection error: ${err.message}`);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        setError('You were disconnected by the server');
      } else {
        setError('Connection lost. Attempting to reconnect...');
        socket.connect();
      }
    });
    
    // Game state events
    socket.on('game:state', (state: GameState) => {
      console.log('Received game state:', state);
      
      // Initialize game with received state
      initGame(
        state.id.toString(),
        state.players,
        userId,
        state.mode,
        state.courseStyle
      );
      
      // Update current hole
      if (state.currentHole !== undefined) {
        // Do something with currentHole
      }
    });
    
    socket.on('game:update_players', (players) => {
      console.log('Players updated:', players);
      updatePlayers(players);
    });
    
    socket.on('game:ball_moved', (playerId, position) => {
      console.log(`Ball moved for player ${playerId}:`, position);
      updateBallPosition(playerId, position);
    });
    
    socket.on('game:score_update', (playerId, holeIndex, strokes) => {
      console.log(`Score update for player ${playerId}, hole ${holeIndex}: ${strokes}`);
      updateScore(playerId, holeIndex, strokes);
    });
    
    socket.on('game:hole_complete', () => {
      console.log('Hole complete');
      setHoleComplete(true);
      
      // After a delay, move to next hole
      setTimeout(() => {
        nextHole();
      }, 3000);
    });
    
    socket.on('game:next_hole', (holeIndex) => {
      console.log(`Moving to hole ${holeIndex}`);
      // Any additional logic when server forces a hole change
    });
    
    socket.on('game:finished', () => {
      console.log('Game finished');
      // Handle game finished event
    });
    
    // Set up error handling
    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(`Error: ${err}`);
    });
    
    // Clean up event listeners
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('game:state');
      socket.off('game:update_players');
      socket.off('game:ball_moved');
      socket.off('game:score_update');
      socket.off('game:hole_complete');
      socket.off('game:next_hole');
      socket.off('game:finished');
      socket.off('error');
    };
  }, [socket, userId, initGame, updatePlayers, updateBallPosition, setHoleComplete, nextHole, updateScore]);
  
  // Set up action handler to send actions to the server
  useEffect(() => {
    if (!socket) return;
    
    const actionHandler = (action: PlayerAction) => {
      console.log('Sending action:', action);
      socket.emit('player:action', action);
    };
    
    setActionHandler(actionHandler);
  }, [socket, setActionHandler]);
  
  return { isConnected, error };
}
