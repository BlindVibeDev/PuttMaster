import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '@/lib/stores/useAudio';
import { useGameState } from '../hooks/useGameState';
import Scoreboard from './Scoreboard';

interface GameUIProps {
  gameId: string;
}

export default function GameUI({ gameId }: GameUIProps) {
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showHoleComplete, setShowHoleComplete] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  
  const { 
    currentHole, 
    players, 
    isMyTurn, 
    gameStatus,
    holeComplete,
    shotPower,
    setHoleComplete
  } = useGameState(state => ({
    currentHole: state.currentHole,
    players: state.players,
    isMyTurn: state.isMyTurn,
    gameStatus: state.gameStatus,
    holeComplete: state.holeComplete,
    shotPower: state.shotPower,
    setHoleComplete: state.setHoleComplete
  }));
  
  // Handle game over logic
  useEffect(() => {
    if (gameStatus === 'finished') {
      navigate(`/game/${gameId}/results`);
    }
  }, [gameStatus, navigate, gameId]);
  
  // Handle hole complete overlay
  useEffect(() => {
    if (holeComplete) {
      setShowHoleComplete(true);
      // Start a countdown to hide the overlay and move to next hole
      setCountdown(3);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowHoleComplete(false);
            setHoleComplete(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [holeComplete, setHoleComplete]);
  
  // Get the current player name
  const currentPlayer = players.find(p => p.isCurrentTurn);
  
  // Toggle audio
  const toggleAudio = () => {
    useAudio.getState().toggleMute();
  };
  
  return (
    <>
      {/* Player turn indicator */}
      <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg backdrop-blur-sm">
        <h3 className="font-bold">Hole {currentHole + 1}</h3>
        <div className="text-sm mt-1">
          {currentPlayer ? (
            <div className="flex items-center gap-2">
              <span>Current Turn:</span>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getPlayerColor(currentPlayer.id) }}
              />
              <span className="font-semibold">{currentPlayer.username}</span>
              {isMyTurn && <span className="text-xs bg-primary/20 p-1 rounded">You</span>}
            </div>
          ) : (
            <span>Waiting for players...</span>
          )}
        </div>
      </div>
      
      {/* Power meter and controls appear in PlayerControls component */}
      
      {/* Scoreboard */}
      <Scoreboard 
        isExpanded={showScoreboard}
        onToggle={() => setShowScoreboard(!showScoreboard)}
      />
      
      {/* Sound toggle */}
      <button 
        onClick={toggleAudio}
        className="absolute bottom-4 right-4 bg-white/70 p-2 rounded-full shadow-lg"
      >
        {useAudio.getState().isMuted ? "🔇" : "🔊"}
      </button>
      
      {/* Hole complete overlay */}
      {showHoleComplete && (
        <div className="hole-complete-overlay">
          <div className="text-4xl font-bold mb-4">Hole Complete!</div>
          <div className="text-2xl mb-8">
            Moving to hole {currentHole + 2} in {countdown}...
          </div>
          
          {/* Player scores for this hole */}
          <div className="bg-white/20 p-4 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-2 text-center">Hole {currentHole + 1} Results</h3>
            {players.map(player => (
              <div key={player.id} className="flex justify-between items-center mb-1 p-1 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPlayerColor(player.id) }}
                  />
                  <span>{player.username}</span>
                </div>
                <span className="font-bold">{player.score[currentHole] || '-'} strokes</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to get consistent colors for players
function getPlayerColor(playerId: number): string {
  const colors = [
    '#4285f4', // Blue
    '#ea4335', // Red
    '#34a853', // Green
    '#fbbc05', // Yellow
    '#9c27b0', // Purple
    '#00acc1', // Cyan
  ];
  
  return colors[playerId % colors.length];
}
