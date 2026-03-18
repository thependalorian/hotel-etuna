import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from './UserContext';
import { WalletsProvider } from './WalletsContext';
import { NetworkProvider } from './NetworkContext';
import { NotificationsProvider } from './NotificationsContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <UserProvider>
          <WalletsProvider>
            <NotificationsProvider>
              {children}
            </NotificationsProvider>
          </WalletsProvider>
        </UserProvider>
      </NetworkProvider>
    </QueryClientProvider>
  );
}
