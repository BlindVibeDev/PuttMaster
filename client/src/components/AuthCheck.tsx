
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useLobby } from '@/lib/stores/useLobby';
import { Button } from './ui/button';
import { WalletButton } from './WalletButton';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Separator } from './ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';

interface AuthCheckProps {
  children: ReactNode;
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const { user, loading, login } = useAuth();
  const { isLoggedIn } = useLobby();
  const { connected, publicKey, connecting } = useWallet();
  const [walletLoading, setWalletLoading] = useState(false);

  // Handle wallet connection/disconnection
  useEffect(() => {
    // Skip if we're already logged in or the wallet isn't connected
    // This prevents unnecessary auth attempts
    if (isLoggedIn || !connected || !publicKey) {
      return;
    }
    
    let isMounted = true;
    
    async function authenticateWithWallet() {
      try {
        setWalletLoading(true);
        
        // Get the wallet public key as a string
        const walletAddress = publicKey.toString();
        
        console.log('Wallet connected, attempting auth:', walletAddress);
        
        // Send a request to the server to authenticate with this wallet
        const response = await apiRequest('POST', '/api/auth/wallet', {
          walletAddress
        });
        
        if (!response.ok) {
          throw new Error('Failed to authenticate with wallet');
        }
        
        const userData = await response.json();
        
        // Only update state if the component is still mounted
        if (isMounted) {
          // Set the user in the lobby store with the wallet method
          const { setUser } = useLobby.getState();
          setUser(userData.id, userData.username, 'wallet');
          
          toast.success('Authenticated via Solana wallet');
          console.log('Authenticated with wallet:', userData);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Wallet authentication error:', error);
          toast.error('Failed to authenticate with wallet');
        }
      } finally {
        if (isMounted) {
          setWalletLoading(false);
        }
      }
    }
    
    authenticateWithWallet();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [connected, publicKey, isLoggedIn]);
  
  // Handle wallet disconnection - this effect runs separately
  useEffect(() => {
    const state = useLobby.getState();
    
    // Only run the logout if we're using wallet auth and the wallet disconnected
    if (state.authMethod === 'wallet' && !connected && !loading) {
      // Use a function reference to avoid capturing outdated state
      state.logout();
      
      // Only show toast for deliberate disconnects, not during loading
      if (!loading) {
        toast.info('Wallet disconnected');
      }
    }
  }, [connected, loading]);

  // Either loading from Auth context or wallet is connecting
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If we're logged in (from either source), proceed to children
  if (user || isLoggedIn || connected) {
    return <>{children}</>;
  }

  // If not logged in at all, show login options
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 bg-gradient-to-b from-green-900 to-green-700">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Sign in to play Putt-Putt</h1>
        
        <div className="flex flex-col gap-4">
          <Button 
            onClick={login} 
            className="bg-blue-600 hover:bg-blue-700 py-6 text-lg"
          >
            Sign in with Replit
          </Button>
          
          <div className="flex items-center gap-2 my-2">
            <Separator className="flex-1" />
            <span className="text-sm text-gray-500">OR</span>
            <Separator className="flex-1" />
          </div>
          
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 rounded-md py-6 text-lg" />
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          You can use either Replit authentication or connect your Solana wallet
        </p>
      </div>
    </div>
  );
}
