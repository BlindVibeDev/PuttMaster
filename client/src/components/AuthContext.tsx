
import { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { connected, connecting, publicKey } = useWallet();

  return (
    <AuthContext.Provider value={{ 
      user: connected ? { connected: true, id: publicKey?.toString() } : null,
      loading: connecting,
      login: () => {} // Wallet button handles connection now
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
