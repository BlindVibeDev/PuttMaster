import { useState, useEffect, Suspense } from 'react';
import { AuthProvider } from './components/AuthContext';
import { Routes, Route, useNavigate, Navigate, BrowserRouter } from 'react-router-dom';
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
import NotFound from '@/pages/not-found';

// Audio setup
import { useAudio } from '@/lib/stores/useAudio';

import AuthCheck from './components/AuthCheck';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [walletConnected, setWalletConnected] = useState(false);
  
  // Initialize audio
  useEffect(() => {
    // Background music setup
    const bgMusic = new Audio('/sounds/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    
    const hitSound = new Audio('/sounds/hit.mp3');
    const successSound = new Audio('/sounds/success.mp3');
    
    // Add to the store
    useAudio.getState().setBackgroundMusic(bgMusic);
    useAudio.getState().setHitSound(hitSound);
    useAudio.getState().setSuccessSound(successSound);
    
    setIsLoading(false);
    
    // Cleanup
    return () => {
      bgMusic.pause();
      hitSound.pause();
      successSound.pause();
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
        <AuthProvider>
          <BrowserRouter future={{ 
            v7_relativeSplatPath: true,
            v7_startTransition: true 
          }}>
          <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<MainMenu />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/create-game" element={<CreateGame />} />
              <Route path="/pregame/:id" element={<PreGameLobby />} />
              <Route path="/game/:id" element={<GameView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" />
        </div>
        </BrowserRouter>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
