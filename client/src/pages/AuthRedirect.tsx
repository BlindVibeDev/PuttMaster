import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { useLobby } from '@/lib/stores/useLobby';
import { toast } from 'sonner';

export default function AuthRedirect() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { setUser: setLobbyUser } = useLobby();

  useEffect(() => {
    // Check if auth was successful after redirect
    if (!loading) {
      if (user) {
        // Update lobby store with user data
        setLobbyUser(user.id, user.username || user.name);
        console.log('Auth redirect successful, updated lobby user:', user.id, user.username || user.name);
        
        toast.success(`Welcome, ${user.name || user.username}!`);
        navigate('/lobby');
      } else {
        console.log('Auth redirect failed, no user data found');
        toast.error('Authentication failed');
        navigate('/');
      }
    }
  }, [user, loading, navigate, setLobbyUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-800 to-green-600">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <p className="text-gray-600 mb-6">Please wait while we complete your authentication.</p>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
      </div>
    </div>
  );
}