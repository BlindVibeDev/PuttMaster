
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  profileImage: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch('/__replauthuser', {
          credentials: 'include'
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // User is not authenticated
            setUser(null);
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const userData = await res.json();
        if (userData?.id) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to get user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    getUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
