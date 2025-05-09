
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface ReplitAuthUser {
  id: string;
  name: string;
  username: string;
  bio: string;
  isLoggedIn: boolean;
  roles: string[];
  profileImage: string;
}

interface AuthContextType {
  user: ReplitAuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ReplitAuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = () => {
    try {
      const replHost = window.location.host;
      // Make sure we properly encode the URL for the auth-redirect page
      const returnUrl = encodeURIComponent(`${window.location.origin}/auth-redirect`);
      
      // Log these values for debugging
      console.log('Login redirect parameters:', { replHost, returnUrl });
      
      // Replit auth URL
      const authUrl = `https://replit.com/auth_with_repl_site?domain=${replHost}&redirect=${returnUrl}`;
      console.log('Redirecting to auth URL:', authUrl);
      
      // Redirect to Replit auth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error during login redirect:', error);
      toast.error('Failed to redirect to login page');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        setUser(null);
        toast.success('Logged out successfully');
      } else {
        toast.error('Failed to log out');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
