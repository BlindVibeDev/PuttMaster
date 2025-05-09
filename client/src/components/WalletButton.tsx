
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';

export function WalletButton({ className = '' }) {
  const { wallet, disconnect, connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  if (!connected) {
    return (
      <Button 
        onClick={() => setVisible(true)}
        className={`${className} bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600`}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button 
      onClick={disconnect}
      className={className}
      variant="outline"
    >
      {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
    </Button>
  );
}
