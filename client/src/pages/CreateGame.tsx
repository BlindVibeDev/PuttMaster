import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';
import { useLobby } from '@/lib/stores/useLobby';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameMode } from '@shared/schema';

export default function CreateGame() {
  const navigate = useNavigate();
  const { userId, username } = useLobby();
  
  const [gameName, setGameName] = useState(`${username || 'Player'}'s Game`);
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [courseStyle, setCourseStyle] = useState('0');
  
  const [isCreating, setIsCreating] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameName.trim()) {
      toast.error('Please enter a game name');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await apiRequest('POST', '/api/games', {
        name: gameName,
        hostId: userId,
        mode: gameMode,
        courseStyle: parseInt(courseStyle)
      });
      
      const data = await response.json();
      
      toast.success('Game created successfully!');
      navigate(`/pregame/${data.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game');
      setIsCreating(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Create Game | Putt-Putt Multiplayer</title>
      </Helmet>
      
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Create a New Game</CardTitle>
            <CardDescription>Configure your Putt-Putt golf game</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Game Name */}
              <div className="space-y-2">
                <Label htmlFor="gameName">Game Name</Label>
                <Input
                  id="gameName"
                  value={gameName}
                  onChange={e => setGameName(e.target.value)}
                  placeholder="Enter a name for your game"
                />
              </div>
              
              {/* Game Mode */}
              <div className="space-y-2">
                <Label>Game Mode</Label>
                <RadioGroup 
                  defaultValue="solo"
                  value={gameMode}
                  onValueChange={value => setGameMode(value as GameMode)}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solo" id="solo" />
                    <Label htmlFor="solo" className="flex-1 cursor-pointer">Solo Play</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2player" id="2player" />
                    <Label htmlFor="2player" className="flex-1 cursor-pointer">2 Player</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3player" id="3player" />
                    <Label htmlFor="3player" className="flex-1 cursor-pointer">3 Player Cutthroat</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4player" id="4player" />
                    <Label htmlFor="4player" className="flex-1 cursor-pointer">4 Player Killstroke</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2v2" id="2v2" />
                    <Label htmlFor="2v2" className="flex-1 cursor-pointer">Army of 2 (2v2)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Course Style */}
              <div className="space-y-2">
                <Label htmlFor="courseStyle">Course Style</Label>
                <Select 
                  value={courseStyle}
                  onValueChange={setCourseStyle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Classic Green</SelectItem>
                    <SelectItem value="1">Sandy Dunes</SelectItem>
                    <SelectItem value="2">Urban Street</SelectItem>
                    <SelectItem value="3">Wooden Deck</SelectItem>
                    <SelectItem value="4">Forest Green</SelectItem>
                    <SelectItem value="5">Spring Meadow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Game Mode Description */}
              <div className="p-3 bg-muted rounded-md text-sm">
                {gameMode === 'solo' && (
                  <p>Solo Play: Practice mode for one player.</p>
                )}
                {gameMode === '2player' && (
                  <p>2 Player: Standard head-to-head match.</p>
                )}
                {gameMode === '3player' && (
                  <p>3 Player Cutthroat: Every player for themselves in a three-way battle.</p>
                )}
                {gameMode === '4player' && (
                  <p>4 Player Killstroke: Four players compete in a free-for-all match.</p>
                )}
                {gameMode === '2v2' && (
                  <p>Army of 2: Teams of two players compete for the best combined score.</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/lobby')}
              >
                Cancel
              </Button>
              
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Game'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}
