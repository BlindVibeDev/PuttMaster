
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from './ui/button';

export function WalletButton() {
  const { wallet, connect, disconnect, connected } = useWallet();

  if (!wallet) {
    return null;
  }

  return (
    <Button onClick={connected ? disconnect : connect}>
      {connected ? 'Disconnect' : 'Connect Wallet'}
    </Button>
  );
}
