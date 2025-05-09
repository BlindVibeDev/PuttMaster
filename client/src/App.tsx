
import { useState, useEffect, Suspense } from 'react';
import { AuthProvider } from './components/AuthContext';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import '@fontsource/inter';

// Components
import MainMenu from '@/components/MainMenu';
import Lobby from '@/pages/Lobby';
import GameView from '@/pages/GameView';
import CreateGame from '@/pages/CreateGame';
import PreGameLobby from '@/pages/PreGameLobby';
import AuthRedirect from '@/pages/AuthRedirect';
import NotFound from '@/pages/not-found';
import { SolanaProvider } from '@/components/WalletProvider';
import AuthCheck from './components/AuthCheck';

// Audio setup
import { useAudio } from '@/lib/stores/useAudio';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize audio
  useEffect(() => {
    // Background music setup
    const bgMusic = new Audio('/sounds/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;

    // Game sounds
    const hitSound = new Audio('/sounds/hit.mp3');
    const successSound = new Audio('/sounds/success.mp3');
    const swingSound = new Audio('/sounds/swing.mp3');
    const waterSound = new Audio('/sounds/water.mp3');
    const bounceSound = new Audio('/sounds/bounce.mp3');

    // Add to the store
    const { 
      setBackgroundMusic,
      setHitSound,
      setSuccessSound,
      setSwingSound,
      setWaterSound,
      setBounceSound
    } = useAudio.getState();

    setBackgroundMusic(bgMusic);
    setHitSound(hitSound);
    setSuccessSound(successSound);
    setSwingSound(swingSound);
    setWaterSound(waterSound);
    setBounceSound(bounceSound);

    setIsLoading(false);

    // Cleanup
    return () => {
      bgMusic.pause();
      hitSound.pause();
      successSound.pause();
      swingSound.pause();
      waterSound.pause();
      bounceSound.pause();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl font-bold text-primary">Loading Putt-Putt Golf...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <SolanaProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/" element={<MainMenu />} />
                  <Route path="/auth-redirect" element={<AuthRedirect />} />
                  <Route 
                    path="/lobby" 
                    element={
                      <AuthCheck>
                        <Lobby />
                      </AuthCheck>
                    } 
                  />
                  <Route 
                    path="/create-game" 
                    element={
                      <AuthCheck>
                        <CreateGame />
                      </AuthCheck>
                    } 
                  />
                  <Route 
                    path="/pregame/:id" 
                    element={
                      <AuthCheck>
                        <PreGameLobby />
                      </AuthCheck>
                    } 
                  />
                  <Route 
                    path="/game/:id" 
                    element={
                      <AuthCheck>
                        <GameView />
                      </AuthCheck>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Toaster position="top-right" />
            </div>
          </AuthProvider>
        </SolanaProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
