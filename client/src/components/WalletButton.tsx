
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from './ui/button';

export function WalletButton({ className = '' }) {
  const { wallet, connect, disconnect, connected, select } = useWallet();

  if (!wallet) {
    return (
      <Button 
        onClick={() => select('phantom')}
        className={`${className} bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600`}
      >
        Connect Phantom Wallet
      </Button>
    );
  }

  return (
    <Button 
      onClick={connected ? disconnect : connect}
      className={className}
      variant={connected ? "outline" : "default"}
    >
      {connected ? 'Disconnect Wallet' : 'Connect Phantom Wallet'}
    </Button>
  );
}
