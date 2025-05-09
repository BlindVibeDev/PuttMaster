import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLobby } from '@/lib/stores/useLobby';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Helmet } from 'react-helmet-async';
import { GameSession } from '@shared/schema';

export default function Lobby() {
  const navigate = useNavigate();
  const [activeGames, setActiveGames] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, username } = useLobby();
  
  // Fetch active games on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await apiRequest('GET', '/api/games');
        const data = await response.json();
        setActiveGames(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        toast.error('Failed to load games');
        setIsLoading(false);
      }
    };
    
    fetchGames();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchGames, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle creating a new game
  const handleCreateGame = () => {
    navigate('/create-game');
  };
  
  // Handle joining a game
  const handleJoinGame = async (gameId: number) => {
    try {
      setIsLoading(true);
      
      // Ensure we have a valid user ID
      if (!userId) {
        toast.error('User ID not found. Please try logging in again.');
        setIsLoading(false);
        return;
      }
      
      // Convert userId to number
      const userIdAsNumber = parseInt(userId, 10);
      
      // Validate that we have a valid number
      if (isNaN(userIdAsNumber)) {
        toast.error('Invalid user ID format. Please try logging in again.');
        setIsLoading(false);
        return;
      }
      
      const response = await apiRequest('POST', `/api/games/${gameId}/join`, {
        userId: userIdAsNumber
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join game');
      }
      
      await response.json();
      toast.success('Joined game successfully!');
      
      // Navigate to the pre-game lobby
      navigate(`/pregame/${gameId}`);
    } catch (error: any) {
      console.error('Error joining game:', error);
      toast.error(error.message || 'Failed to join game');
      setIsLoading(false);
    }
  };
  
  // Get game mode display name
  const getGameModeName = (mode: string): string => {
    switch (mode) {
      case 'solo': return 'Solo';
      case '2player': return '2 Player';
      case '3player': return '3 Player Cutthroat';
      case '4player': return '4 Player Killstroke';
      case '2v2': return 'Army of 2 (2v2)';
      default: return mode;
    }
  };
  
  // Get game status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Waiting</Badge>;
      case 'playing':
        return <Badge variant="outline" className="bg-green-100 text-green-800">In Progress</Badge>;
      case 'finished':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Finished</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Filter games by status
  const waitingGames = activeGames.filter(game => game.status === 'waiting');
  const inProgressGames = activeGames.filter(game => game.status === 'playing');
  
  // Check if a game is joinable
  const isJoinable = (game: GameSession) => {
    if (game.status !== 'waiting') return false;
    
    // Solo games can't be joined
    if (game.mode === 'solo') return false;
    
    // Count current players
    const maxPlayers = game.mode === '2player' ? 2 : 
                      game.mode === '3player' ? 3 : 
                      game.mode === '4player' ? 4 : 
                      game.mode === '2v2' ? 4 : 0;
                      
    // We don't have player count in the game object, so we'll assume all games are joinable
    // In a real implementation, we'd check against current player count
    
    return true;
  };
  
  return (
    <>
      <Helmet>
        <title>Game Lobby | Putt-Putt Multiplayer</title>
      </Helmet>
      
      <div className="min-h-screen bg-background p-6 flex flex-col">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-primary">Putt-Putt Multiplayer</h1>
          <p className="text-muted-foreground">Welcome, {username || 'Player'}</p>
        </header>
        
        <div className="flex gap-6 flex-1">
          {/* Game list */}
          <div className="flex-1">
            <Tabs defaultValue="waiting" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="waiting">Waiting ({waitingGames.length})</TabsTrigger>
                  <TabsTrigger value="inprogress">In Progress ({inProgressGames.length})</TabsTrigger>
                </TabsList>
                
                <Button onClick={handleCreateGame}>
                  Create New Game
                </Button>
              </div>
              
              <TabsContent value="waiting" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Games</CardTitle>
                    <CardDescription>Join an existing game or create your own</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">Loading games...</div>
                    ) : waitingGames.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No games available. Create one to get started!
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {waitingGames.map(game => (
                            <div key={game.id} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">{game.name}</h3>
                                  <div className="flex gap-2 mt-1">
                                    {getStatusBadge(game.status)}
                                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                      {getGameModeName(game.mode)}
                                    </Badge>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleJoinGame(game.id)}
                                  disabled={!isJoinable(game)}
                                >
                                  Join
                                </Button>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                Hosted by: Player {game.hostId}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="inprogress" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Games in Progress</CardTitle>
                    <CardDescription>Games currently being played</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">Loading games...</div>
                    ) : inProgressGames.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No games in progress.
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {inProgressGames.map(game => (
                            <div key={game.id} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">{game.name}</h3>
                                  <div className="flex gap-2 mt-1">
                                    {getStatusBadge(game.status)}
                                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                      {getGameModeName(game.mode)}
                                    </Badge>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" disabled>
                                  In Progress
                                </Button>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                Hosted by: Player {game.hostId}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <Card className="w-80">
            <CardHeader>
              <CardTitle>Player Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Username</h3>
                  <p>{username || 'Anonymous Player'}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium">Game Stats</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Games Played:</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Games Won:</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Best Score:</span>
                      <span>-</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/')}>Back to Menu</Button>
              <Button onClick={() => navigate('/profile')}>Edit Profile</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
