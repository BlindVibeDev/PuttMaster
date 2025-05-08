import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { apiRequest } from '@/lib/queryClient';
import { useLobby } from '@/lib/stores/useLobby';
import { useCustomization } from '@/lib/stores/useCustomization';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CustomizationPanel from '@/components/CustomizationPanel';
import { GameMode, GameStatus } from '@shared/schema';

interface Player {
  id: number;
  userId: number;
  username: string;
  ready: boolean;
  team: number;
  customization: {
    ballType: number;
    clubType: number;
  };
}

interface GameDetails {
  id: number;
  name: string;
  hostId: number;
  mode: GameMode;
  courseStyle: number;
  status: GameStatus;
  players: Player[];
}

export default function PreGameLobby() {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, username } = useLobby();
  const { ballType, clubType } = useCustomization();
  
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [showCustomization, setShowCustomization] = useState(false);
  
  // Connect to socket
  useEffect(() => {
    const newSocket = io('/', {
      query: {
        gameId,
        userId
      }
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Socket connected to pre-game lobby');
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(`Connection error: ${err.message}`);
    });
    
    newSocket.on('pregame:update', (updatedGame: GameDetails) => {
      console.log('Game updated:', updatedGame);
      setGameDetails(updatedGame);
      
      // Check if the current player's ready status changed
      const currentPlayer = updatedGame.players.find(p => p.userId === userId);
      if (currentPlayer) {
        setIsReady(currentPlayer.ready);
      }
    });
    
    newSocket.on('game:starting', () => {
      toast.success('All players ready! Starting game...');
      setTimeout(() => {
        navigate(`/game/${gameId}`);
      }, 2000);
    });
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [gameId, userId, navigate]);
  
  // Fetch initial game data
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await apiRequest('GET', `/api/games/${gameId}`);
        const data = await response.json();
        setGameDetails(data);
        
        // Check if current player is ready
        const currentPlayer = data.players.find((p: Player) => p.userId === userId);
        if (currentPlayer) {
          setIsReady(currentPlayer.ready);
          setSelectedTeam(currentPlayer.team);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching game details:', error);
        setError('Failed to load game details');
        setIsLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [gameId, userId]);
  
  // Toggle ready status
  const toggleReady = async () => {
    if (!socket) return;
    
    try {
      // Send customization data along with ready status
      socket.emit('player:ready', {
        ready: !isReady,
        customization: {
          ballType,
          clubType
        }
      });
      
      setIsReady(!isReady);
    } catch (error) {
      console.error('Error toggling ready status:', error);
      toast.error('Failed to update ready status');
    }
  };
  
  // Leave the game
  const leaveGame = async () => {
    try {
      await apiRequest('DELETE', `/api/games/${gameId}/players/${userId}`);
      
      if (socket) {
        socket.disconnect();
      }
      
      toast.success('Left the game');
      navigate('/lobby');
    } catch (error) {
      console.error('Error leaving game:', error);
      toast.error('Failed to leave the game');
    }
  };
  
  // Change team (for 2v2 mode)
  const changeTeam = async (team: number) => {
    if (!socket) return;
    
    try {
      socket.emit('player:team', { team });
      setSelectedTeam(team);
    } catch (error) {
      console.error('Error changing team:', error);
      toast.error('Failed to change team');
    }
  };
  
  // Get the max players for the current game mode
  const getMaxPlayers = (mode: GameMode): number => {
    switch (mode) {
      case 'solo': return 1;
      case '2player': return 2;
      case '3player': return 3;
      case '4player': return 4;
      case '2v2': return 4;
      default: return 1;
    }
  };
  
  // Get player list by team
  const getPlayersByTeam = () => {
    if (!gameDetails) return { team0: [], team1: [] };
    
    return {
      team0: gameDetails.players.filter(p => p.team === 0),
      team1: gameDetails.players.filter(p => p.team === 1)
    };
  };
  
  // Are all players ready?
  const allPlayersReady = (): boolean => {
    if (!gameDetails) return false;
    return gameDetails.players.every(p => p.ready);
  };
  
  // Is the current user the host?
  const isHost = (): boolean => {
    if (!gameDetails) return false;
    return gameDetails.hostId === userId;
  };
  
  // Can the game start?
  const canStart = (): boolean => {
    if (!gameDetails) return false;
    
    // Solo mode can start right away
    if (gameDetails.mode === 'solo') return true;
    
    // For other modes, need at least 2 players and all must be ready
    const minPlayers = gameDetails.mode === '2player' || gameDetails.mode === '2v2' ? 2 : 
                      gameDetails.mode === '3player' ? 3 : 4;
                      
    return gameDetails.players.length >= minPlayers && allPlayersReady();
  };
  
  // Get mode display name
  const getGameModeName = (mode: GameMode): string => {
    switch (mode) {
      case 'solo': return 'Solo Play';
      case '2player': return '2 Player';
      case '3player': return '3 Player Cutthroat';
      case '4player': return '4 Player Killstroke';
      case '2v2': return 'Army of 2 (2v2)';
      default: return mode;
    }
  };
  
  // Start the game (host only)
  const startGame = async () => {
    if (!socket || !isHost() || !canStart()) return;
    
    try {
      socket.emit('game:start');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start the game');
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-primary">Loading game lobby...</div>
      </div>
    );
  }
  
  if (error || !gameDetails) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-2xl text-destructive mb-4">Error: {error || 'Game not found'}</div>
        <Button onClick={() => navigate('/lobby')}>Return to Lobby</Button>
      </div>
    );
  }
  
  const { team0, team1 } = getPlayersByTeam();
  const maxPlayers = getMaxPlayers(gameDetails.mode);
  
  return (
    <>
      <Helmet>
        <title>Pre-Game Lobby | {gameDetails.name}</title>
      </Helmet>
      
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{gameDetails.name}</CardTitle>
                  <CardDescription>
                    Waiting for players ({gameDetails.players.length}/{maxPlayers})
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {getGameModeName(gameDetails.mode)}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    Course Style {gameDetails.courseStyle + 1}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {showCustomization ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Customize Your Equipment</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCustomization(false)}
                    >
                      Back to Lobby
                    </Button>
                  </div>
                  
                  <CustomizationPanel />
                </div>
              ) : (
                <>
                  {/* Player list */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Players</h3>
                    
                    {gameDetails.mode === '2v2' ? (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Team 1 */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Team 1</h4>
                          {team0.length === 0 ? (
                            <div className="text-muted-foreground text-sm">No players</div>
                          ) : (
                            <ul className="space-y-2">
                              {team0.map(player => (
                                <li key={player.userId} className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2" 
                                      style={{ backgroundColor: getBallColor(player.customization.ballType) }}
                                    />
                                    <span>{player.username}</span>
                                    {player.userId === userId && <span className="text-xs ml-2">(You)</span>}
                                    {player.userId === gameDetails.hostId && <span className="text-xs ml-2">(Host)</span>}
                                  </div>
                                  <Badge variant={player.ready ? "success" : "outline"}>{player.ready ? "Ready" : "Not Ready"}</Badge>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        
                        {/* Team 2 */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Team 2</h4>
                          {team1.length === 0 ? (
                            <div className="text-muted-foreground text-sm">No players</div>
                          ) : (
                            <ul className="space-y-2">
                              {team1.map(player => (
                                <li key={player.userId} className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2" 
                                      style={{ backgroundColor: getBallColor(player.customization.ballType) }}
                                    />
                                    <span>{player.username}</span>
                                    {player.userId === userId && <span className="text-xs ml-2">(You)</span>}
                                    {player.userId === gameDetails.hostId && <span className="text-xs ml-2">(Host)</span>}
                                  </div>
                                  <Badge variant={player.ready ? "success" : "outline"}>{player.ready ? "Ready" : "Not Ready"}</Badge>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <ul className="space-y-2">
                          {gameDetails.players.map(player => (
                            <li key={player.userId} className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: getBallColor(player.customization.ballType) }}
                                />
                                <span>{player.username}</span>
                                {player.userId === userId && <span className="text-xs ml-2">(You)</span>}
                                {player.userId === gameDetails.hostId && <span className="text-xs ml-2">(Host)</span>}
                              </div>
                              <Badge variant={player.ready ? "success" : "outline"}>{player.ready ? "Ready" : "Not Ready"}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Team selection for 2v2 mode */}
                  {gameDetails.mode === '2v2' && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-md font-semibold mb-2">Select Your Team</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant={selectedTeam === 0 ? "default" : "outline"}
                          onClick={() => changeTeam(0)}
                          disabled={isReady}
                        >
                          Team 1
                        </Button>
                        <Button 
                          variant={selectedTeam === 1 ? "default" : "outline"}
                          onClick={() => changeTeam(1)}
                          disabled={isReady}
                        >
                          Team 2
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Game rules reminder */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-md font-semibold mb-2">Game Rules: {getGameModeName(gameDetails.mode)}</h3>
                    {gameDetails.mode === 'solo' && (
                      <p className="text-sm">Practice mode for one player. Complete all 9 holes with the lowest score.</p>
                    )}
                    {gameDetails.mode === '2player' && (
                      <p className="text-sm">Head-to-head match. Take turns putting and the player with the lowest score wins.</p>
                    )}
                    {gameDetails.mode === '3player' && (
                      <p className="text-sm">Every player for themselves in a three-way battle. Lowest combined score after 9 holes wins.</p>
                    )}
                    {gameDetails.mode === '4player' && (
                      <p className="text-sm">Four player free-for-all. Compete to get the lowest score across all 9 holes.</p>
                    )}
                    {gameDetails.mode === '2v2' && (
                      <p className="text-sm">Teams of two players. Your team's score is the sum of both players. Lowest team score wins.</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={leaveGame}>Leave Game</Button>
                {!showCustomization && (
                  <Button variant="secondary" onClick={() => setShowCustomization(true)}>
                    Customize
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {!isHost() ? (
                  <Button 
                    onClick={toggleReady}
                    variant={isReady ? "destructive" : "default"}
                  >
                    {isReady ? "Cancel Ready" : "Ready Up"}
                  </Button>
                ) : (
                  <Button 
                    onClick={startGame}
                    disabled={!canStart()}
                  >
                    Start Game
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}

// Helper to get consistent ball colors
function getBallColor(ballType: number): string {
  const colors = [
    '#ffffff', // White
    '#ff5555', // Red
    '#5555ff', // Blue
    '#55ff55', // Green
    '#ffff55', // Yellow
    '#ff55ff', // Pink
  ];
  
  return colors[ballType % colors.length];
}
