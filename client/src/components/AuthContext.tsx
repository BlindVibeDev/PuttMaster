
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
    const width = 350;
    const height = 500;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authWindow = window.open(
      `/api/__replit/auth/login?redirect=${encodeURIComponent(window.location.href)}`,
      '_blank',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    window.addEventListener('message', function authComplete(e) {
      if (e.data !== 'auth_complete') return;
      
      window.removeEventListener('message', authComplete);
      authWindow?.close();
      checkUser();
      navigate('/');
    });
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
