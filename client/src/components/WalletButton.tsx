import { Button } from './ui/button';

export function WalletButton({ className = '' }) {
  return (
    <Button 
      onClick={() => {}}
      className={`${className} bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600`}
    >
      Connect Wallet
    </Button>
  );
}