import { FC } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';

interface WalletModalProps {
  className?: string;
}

// This component leverages the default WalletMultiButton from the adapter
// which provides a complete wallet workflow with modal selection
export const WalletModal: FC<WalletModalProps> = ({ className }) => {
  return (
    <div className={cn('wallet-modal-wrapper', className)}>
      <WalletMultiButton className="wallet-adapter-button-custom" />
    </div>
  );
};