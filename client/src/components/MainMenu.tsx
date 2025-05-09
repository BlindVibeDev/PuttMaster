import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useLobby } from '@/lib/stores/useLobby';
import { useAudio } from '@/lib/stores/useAudio';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/components/AuthContext';
import { WalletButton } from '@/components/WalletButton';

export default function MainMenu() {
  const navigate = useNavigate();
  const { username, updateUsername } = useLobby();
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [showCredits, setShowCredits] = useState(false);
  const { publicKey, connected } = useWallet();
  const { user, loading, login } = useAuth();

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

  // Handle play button click
  const handlePlay = () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!user) {
      toast.error('Please sign in with Replit first');
      return;
    }
    navigate('/lobby');
  };

  // Handle login with Replit
  const handleReplitLogin = () => {
    try {
      console.log("Initiating Replit login");
      if (loading) {
        toast.info("Authentication is in progress...");
        return;
      }
      
      login();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login with Replit");
    }
  };

  return (
    <>
      <Helmet>
        <title>Putt-Putt Multiplayer Golf</title>
      </Helmet>

      <div 
        className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 flex flex-col justify-center items-center p-4"
        style={{
          backgroundImage: "linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--primary) / 0.8)), url('/textures/grass.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-2">
            Putt-Putt Golf
          </h1>
          <p className="text-xl text-white/90 drop-shadow">
            Multiplayer Miniature Golf Challenge
          </p>
        </motion.div>

        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Auth Status Section */}
              <div className="flex flex-col gap-4 items-center mb-4">
                {/* Replit Auth Button */}
                {user ? (
                  <div className="w-full p-2 bg-gray-100 rounded-md text-center">
                    <span className="text-sm font-medium">
                      Signed in as: <span className="font-bold">{user.username || user.name}</span>
                    </span>
                  </div>
                ) : (
                  <Button 
                    onClick={handleReplitLogin} 
                    className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Sign in with Replit'}
                  </Button>
                )}

                {/* Wallet Button */}
                <WalletButton className="w-full py-4 text-lg" />

                {connected && publicKey && (
                  <p className="text-sm text-muted-foreground">
                    Wallet Connected: {publicKey.toString().slice(0, 8)}...
                  </p>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Button 
                  onClick={handlePlay} 
                  className="w-full py-6 text-xl font-bold"
                  disabled={!connected || !user}
                >
                  Play Now
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Button 
                  onClick={() => setShowNameDialog(true)} 
                  variant="outline" 
                  className="w-full"
                  disabled={!user}
                >
                  Change Username
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Button 
                  onClick={() => navigate('/customize')} 
                  variant="outline" 
                  className="w-full"
                  disabled={!user}
                >
                  Customize
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Button 
                  onClick={() => setShowCredits(true)} 
                  variant="ghost" 
                  className="w-full"
                >
                  Credits
                </Button>
              </motion.div>

              {/* Sound toggle button */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="flex justify-center mt-4"
              >
                <Button 
                  onClick={() => useAudio.getState().toggleMute()} 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {useAudio.getState().isMuted ? (
                    <>🔇 Sound Off</>
                  ) : (
                    <>🔊 Sound On</>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Username change dialog */}
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Username</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter a username"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNameDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (newUsername.trim()) {
                  updateUsername(newUsername.trim());
                  setShowNameDialog(false);
                  toast.success(`Username updated to ${newUsername}`);
                } else {
                  toast.error('Username cannot be empty');
                }
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credits dialog */}
        <Dialog open={showCredits} onOpenChange={setShowCredits}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Credits</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Developed By</h3>
                <p className="text-sm">Putt-Putt Multiplayer Team</p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Technologies Used</h3>
                <ul className="text-sm list-disc pl-5">
                  <li>React</li>
                  <li>Three.js & React Three Fiber</li>
                  <li>Express</li>
                  <li>Socket.io</li>
                  <li>Tailwind CSS</li>
                  <li>Solana Web3.js</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Special Thanks</h3>
                <p className="text-sm">To all miniature golf enthusiasts!</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowCredits(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
