import { useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';

interface ScoreboardProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Scoreboard({ isExpanded, onToggle }: ScoreboardProps) {
  const { players, currentHole } = useGameState(state => ({
    players: state.players,
    currentHole: state.currentHole
  }));
  
  // Create an array of hole numbers for the header
  const holeNumbers = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => i + 1);
  }, []);
  
  // Get player with best score for this hole
  const getWinningPlayer = (holeIndex: number) => {
    let bestScore = Infinity;
    let bestPlayer = null;
    
    players.forEach(player => {
      const score = player.score[holeIndex] || 0;
      if (score > 0 && score < bestScore) {
        bestScore = score;
        bestPlayer = player;
      }
    });
    
    return bestPlayer;
  };
  
  // Calculate total score for each player
  const playerTotals = useMemo(() => {
    return players.map(player => {
      let total = 0;
      Object.values(player.score).forEach(score => {
        total += score;
      });
      return { id: player.id, total };
    });
  }, [players]);
  
  return (
    <div className={`absolute top-4 right-4 ${isExpanded ? 'w-96' : 'w-16'} transition-all duration-300`}>
      <div className="bg-white/90 rounded-lg shadow-lg p-2 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className={`font-bold text-lg ${isExpanded ? 'block' : 'hidden'}`}>Scoreboard</h3>
          <button 
            onClick={onToggle}
            className="bg-primary/80 text-white p-1 rounded-full w-8 h-8 flex items-center justify-center"
          >
            {isExpanded ? "×" : "🏆"}
          </button>
        </div>
        
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 text-left">Player</th>
                  {holeNumbers.map(num => (
                    <th key={`hole-${num}`} className="p-1 text-center w-8">
                      {num}
                    </th>
                  ))}
                  <th className="p-1 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id} className={`${player.isCurrentTurn ? 'bg-yellow-100' : ''}`}>
                    <td className="p-1 text-left">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getPlayerColor(player.id) }}
                        />
                        {player.username}
                        {player.isCurrentTurn && (
                          <span className="player-turn-indicator bg-primary/20 text-xs">
                            Turn
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {holeNumbers.map(holeNum => {
                      const score = player.score[holeNum - 1] || 0;
                      const isWinner = getWinningPlayer(holeNum - 1)?.id === player.id;
                      const isCurrent = holeNum - 1 === currentHole;
                      
                      return (
                        <td 
                          key={`${player.id}-hole-${holeNum}`} 
                          className={`p-1 text-center ${isWinner ? 'font-bold' : ''} ${isCurrent ? 'bg-blue-100' : ''}`}
                        >
                          {score > 0 ? score : '-'}
                        </td>
                      );
                    })}
                    
                    <td className="p-1 text-center font-bold">
                      {playerTotals.find(p => p.id === player.id)?.total || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
