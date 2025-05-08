
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLobby } from '@/lib/stores/useLobby';

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { setUser } = useLobby();

  useEffect(() => {
    fetch('/api/auth/user')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(user => {
        setUser(user.id, user.name);
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  return <>{children}</>;
}
