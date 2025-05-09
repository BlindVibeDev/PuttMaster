
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ 
      user: null,
      loading: false,
      login: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
