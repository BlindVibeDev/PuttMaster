import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, OrbitControls, Sky, Stars } from '@react-three/drei';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { apiRequest } from '@/lib/queryClient';
import { useAudio } from '@/lib/stores/useAudio';
import { useLobby } from '@/lib/stores/useLobby';
import { GameProvider, useGameContext } from '@/game/contexts/GameContext';

// Game components
import Course from '@/game/components/Course';
import Ball from '@/game/components/Ball';
import Club from '@/game/components/Club';
import PlayerControls from '@/game/components/PlayerControls';
import GameUI from '@/game/components/GameUI';
import { useGameState } from '@/game/hooks/useGameState';

// Define keyboard controls
enum Controls {
  left = 'left',
  right = 'right',
  increase = 'increase',
  decrease = 'decrease',
  swing = 'swing',
}

const keyMap = [
  { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
  { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.increase, keys: ['ArrowUp', 'KeyW'] },
  { name: Controls.decrease, keys: ['ArrowDown', 'KeyS'] },
  { name: Controls.swing, keys: ['Space'] },
];

// Provide a wrapper component that handles the game context
function GameViewWrapper() {
  const { userId } = useLobby();

  return (
    <GameProvider userId={userId}>
      <GameViewContent />
    </GameProvider>
  );
}

// Main game view content
function GameViewContent() {
  const { gameId, loading, error, isConnected } = useGameContext();
  const navigate = useNavigate();

  // Get values from game state
  const { 
    players, 
    currentHole, 
    holes, 
    courseStyle, 
    isMyTurn,
    myPlayerId,
    ball_positions
  } = useGameState(state => ({
    players: state.players,
    currentHole: state.currentHole,
    holes: state.holes,
    courseStyle: state.courseStyle,
    isMyTurn: state.isMyTurn,
    myPlayerId: state.myPlayerId,
    ball_positions: state.ball_positions
  }));

  // Start background music
  useEffect(() => {
    const { backgroundMusic, isMuted } = useAudio.getState();
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(err => {
        console.log('Auto-play prevented. User must interact first.', err);
      });
    }

    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, []);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-primary">Loading game...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-2xl text-destructive mb-4">Error: {error}</div>
        <button 
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => navigate('/lobby')}
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  // Show connection status
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-2xl text-amber-500 mb-4">Connecting to game server...</div>
        <div className="text-sm text-muted-foreground">This may take a few moments</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Putt-Putt Golf - Hole {currentHole + 1}</title>
      </Helmet>

      <KeyboardControls map={keyMap}>
        <div className="w-full h-screen">
          <Canvas shadows camera={{ position: [0, 10, 15], fov: 45 }}>
            {/* Environment */}
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize={[2048, 2048]}
            />
            <Sky sunPosition={[10, 5, 10]} />
            <Stars />

            {/* Game elements */}
            <Suspense fallback={null}>
              <Course courseStyle={courseStyle} />

              {/* Render all player balls */}
              {players.map(player => {
                const currentHoleData = holes[currentHole];
                const initialPosition = ball_positions[player.id] || 
                  (currentHoleData ? currentHoleData.start : [0, 0, 0]);

                return (
                  <Ball 
                    key={`ball-${player.id}`}
                    playerId={player.id}
                    initialPosition={initialPosition}
                    isCurrentPlayer={player.isCurrentTurn}
                    designIndex={player.customization.ballType}
                    onBallStop={() => {
                      console.log(`Ball stopped for player ${player.id}`);
                    }}
                    onBallInHole={() => {
                      console.log(`Ball in hole for player ${player.id}!`);
                      useGameState.getState().sendAction({ 
                        type: 'ready', 
                      });
                    }}
                  />
                );
              })}

              {/* Only render club for current player */}
              {players.map(player => {
                if (!player.isCurrentTurn) return null;

                const position = ball_positions[player.id] || [0, 0, 0];

                return (
                  <Club 
                    key={`club-${player.id}`}
                    clubType={player.customization.clubType}
                    ballPosition={position}
                    isCurrentPlayer={player.isCurrentTurn && player.id === myPlayerId}
                    isSwinging={useGameState.getState().shotPower > 0}
                  />
                );
              })}

              {/* Debug controls */}
              <OrbitControls />
            </Suspense>
          </Canvas>

          {/* UI elements */}
          <PlayerControls />
          <GameUI gameId={gameId} />
        </div>
      </KeyboardControls>
    </>
  );
}

export default GameViewWrapper;