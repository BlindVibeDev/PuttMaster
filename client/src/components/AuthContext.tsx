
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
  const { connected, connecting, select } = useWallet();

  return (
    <AuthContext.Provider value={{ 
      user: connected ? { connected: true } : null,
      loading: connecting,
      login: () => select('phantom')
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
