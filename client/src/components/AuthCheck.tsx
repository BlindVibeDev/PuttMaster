import { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface AuthCheckProps {
  children: ReactNode;
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl">Please log in to continue</h1>
        <button
          onClick={() => {
            window.location.href = '/__replauthlogin';
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login with Replit
        </button>
      </div>
    );
  }

  return <>{children}</>;
}