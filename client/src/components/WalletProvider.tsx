
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
  
  // Configure supported wallets with error handling
  const wallets = useMemo(() => {
    try {
      return [new PhantomWalletAdapter()];
    } catch (error) {
      console.error('Error creating wallet adapters:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    // Check if Phantom is installed
    const isPhantomInstalled = window.phantom?.solana?.isPhantom;
    
    if (!isPhantomInstalled) {
      console.log('Phantom wallet is not installed');
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
