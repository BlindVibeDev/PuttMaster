import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className = '' }: WalletButtonProps) {
  const { wallet, publicKey, connecting, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [phantomInstalled, setPhantomInstalled] = useState<boolean>(true);

  // Check if Phantom wallet is installed
  useEffect(() => {
    const isPhantomInstalled = window.phantom?.solana?.isPhantom || false;
    setPhantomInstalled(isPhantomInstalled);
    
    if (!isPhantomInstalled) {
      console.log('Phantom wallet is not installed');
    }
  }, []);

  // Update the displayed wallet address when connection changes
  useEffect(() => {
    if (publicKey) {
      const address = publicKey.toBase58();
      const truncatedAddress = address.length > 10 
        ? `${address.slice(0, 4)}...${address.slice(-4)}`
        : address;
      setWalletAddress(truncatedAddress);
    } else {
      setWalletAddress('');
    }
  }, [publicKey]);

  // Open Phantom wallet website if not installed
  const openPhantomWebsite = () => {
    window.open('https://phantom.app/', '_blank');
    toast.info('Please install Phantom wallet to continue');
  };

  // Connect wallet or disconnect if already connected
  const handleWalletAction = () => {
    if (!phantomInstalled) {
      openPhantomWebsite();
      return;
    }
    
    if (connected) {
      disconnect().catch(error => {
        console.error('Error disconnecting wallet:', error);
        toast.error('Failed to disconnect wallet');
      });
    } else {
      setVisible(true);
    }
  };

  return (
    <Button 
      onClick={handleWalletAction}
      className={`${className} ${
        connected 
          ? 'bg-green-600 hover:bg-green-700' 
          : phantomInstalled 
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
            : 'bg-orange-500 hover:bg-orange-600'
      }`}
      disabled={connecting}
    >
      {connecting ? (
        'Connecting...'
      ) : connected ? (
        <span>
          {wallet?.adapter.name}: {walletAddress}
        </span>
      ) : !phantomInstalled ? (
        'Install Phantom Wallet'
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
}