
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { ReactNode, useMemo, useEffect } from 'react';
import { toast } from 'sonner';

// Import the wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaProviderProps {
  children: ReactNode;
}

export function SolanaProvider({ children }: SolanaProviderProps) {
  // Set the network to Devnet for development
  const network = WalletAdapterNetwork.Devnet;
  
  // Define the RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Check if Phantom is installed before creating the adapter
  const isPhantomInstalled = useMemo(() => {
    const installed = window.phantom?.solana?.isPhantom || false;
    if (!installed) {
      console.log('Phantom wallet is not installed');
    }
    return installed;
  }, []);
  
  // Configure supported wallets with error handling
  const wallets = useMemo(() => {
    try {
      // Only create the adapter if Phantom is installed
      return isPhantomInstalled ? [new PhantomWalletAdapter()] : [];
    } catch (error) {
      console.error('Error creating wallet adapters:', error);
      return [];
    }
  }, [isPhantomInstalled]);

  // Display a notification if Phantom is not installed
  useEffect(() => {
    if (!isPhantomInstalled) {
      toast.info(
        'Phantom wallet is not installed. Some features will be limited.',
        { id: 'phantom-missing', duration: 5000 }
      );
    }
  }, [isPhantomInstalled]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={isPhantomInstalled}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
