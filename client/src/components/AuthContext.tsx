import { createContext, useContext, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

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
  const { 
    ready,
    authenticated,
    user,
    login
  } = usePrivy();

  return (
    <AuthContext.Provider value={{ 
      user: authenticated ? user : null, 
      loading: !ready,
      login 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}