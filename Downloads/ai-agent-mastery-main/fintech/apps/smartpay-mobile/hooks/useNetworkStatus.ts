import { useNetwork } from '@/contexts/NetworkContext';

export function useNetworkStatus() {
  return useNetwork();
}
