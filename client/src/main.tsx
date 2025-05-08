
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { queryClient } from '@/lib/queryClient';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { SolanaProvider } from '@/components/WalletProvider';
import { AuthProvider } from './components/AuthContext';
import '@fontsource/inter';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
      }}
    >
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <SolanaProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </SolanaProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
