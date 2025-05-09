import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WalletModalProps {
  className?: string;
}

// This component leverages the default WalletMultiButton from the adapter
// which provides a complete wallet workflow with modal selection
export const WalletModal: FC<WalletModalProps> = ({ className }) => {
  const { wallet, connected, connecting, publicKey } = useWallet();
  const [phantomInstalled, setPhantomInstalled] = useState<boolean>(false);
  
  // Check if Phantom is installed on component mount
  useEffect(() => {
    const checkPhantomInstallation = () => {
      const isPhantomInstalled = window.phantom?.solana?.isPhantom || false;
      setPhantomInstalled(isPhantomInstalled);
      
      if (!isPhantomInstalled) {
        console.log('Phantom wallet is not installed. Please install Phantom to use wallet features.');
      }
    };
    
    checkPhantomInstallation();
  }, []);
  
  // Display connection status changes
  useEffect(() => {
    if (connected && publicKey) {
      toast.success(`Connected to ${wallet?.adapter.name || 'wallet'}`);
    }
  }, [connected, publicKey, wallet]);

  return (
    <div className={cn('wallet-modal-wrapper', className)}>
      {!phantomInstalled && (
        <a 
          href="https://phantom.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block text-center text-blue-500 hover:text-blue-700 text-sm mb-2"
        >
          Install Phantom Wallet
        </a>
      )}
      <WalletMultiButton className="wallet-adapter-button-custom" />
      {connecting && <div className="text-sm text-gray-500 mt-2 text-center">Connecting to wallet...</div>}
    </div>
  );
};