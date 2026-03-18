import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkContextValue {
  isOnline: boolean;
  isConnected: boolean;
  networkType: string | null;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

const defaultState: NetworkContextValue = {
  isOnline: true,
  isConnected: true,
  networkType: null,
};

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetworkContextValue>(defaultState);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      unsubscribe = NetInfo.addEventListener((netState: { isInternetReachable?: boolean; isConnected?: boolean; type?: string }) => {
        setState({
          isOnline: netState.isInternetReachable ?? false,
          isConnected: netState.isConnected ?? false,
          networkType: netState.type ?? null,
        });
      });
    } catch (_e) {
      setState(defaultState);
    }
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      else if (unsubscribe && typeof (unsubscribe as { remove?: () => void }).remove === 'function') (unsubscribe as { remove: () => void }).remove();
    };
  }, []);

  return <NetworkContext.Provider value={state}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
