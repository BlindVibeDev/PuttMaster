
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from './ui/button';

export function WalletButton({ className = '' }) {
  const { wallet, connect, disconnect, connected } = useWallet();

  if (!wallet) {
    return null;
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
