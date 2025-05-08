
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  profileImage: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkUser = async () => {
    try {
      const res = await fetch('/api/__replit/auth/user', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setUser(data?.id ? data : null);
    } catch (error) {
      console.error('Failed to get user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = () => {
    // Use Replit's built-in auth system
    window.location.href = '/__replauthlogin';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
