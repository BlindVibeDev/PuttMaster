
import { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';

interface AuthCheckProps {
  children: ReactNode;
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Please sign in to continue</h1>
        <Button onClick={login}>Sign in with Privy</Button>
      </div>
    );
  }

  return <>{children}</>;
}
