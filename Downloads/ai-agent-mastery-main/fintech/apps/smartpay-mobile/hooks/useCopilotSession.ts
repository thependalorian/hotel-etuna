/**
 * useCopilotSession – Smartpay Agentic Copilot.
 * Manages copilot session state, including wallet data, user context, and conversation history.
 * Provides methods to initialize, reset, and update the session.
 * Location: fintech/smartpay/hooks/useCopilotSession.ts
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getWallets, type Wallet } from '@/services/wallets';
import { useCopilotContext } from '@/contexts/copilot/CopilotContext';

export interface CopilotSessionData {
  /** User's wallets */
  wallets: Wallet[];
  /** Total balance across all wallets */
  totalBalance: number;
  /** Session initialized timestamp */
  sessionStarted: string | null;
  /** Last data refresh timestamp */
  lastRefresh: string | null;
  /** Whether session is actively loading data */
  isLoading: boolean;
  /** Error message if session initialization failed */
  error: string | null;
}

export interface UseCopilotSessionReturn {
  /** Current session data */
  sessionData: CopilotSessionData;
  /** Initialize or reinitialize the copilot session */
  initializeSession: () => Promise<void>;
  /** Refresh wallet data without resetting the conversation */
  refreshWallets: () => Promise<void>;
  /** Clear session data and conversation history */
  resetSession: () => void;
  /** Whether the session is ready for interactions */
  isSessionReady: boolean;
}

/**
 * useCopilotSession hook - Manages copilot session lifecycle.
 * Automatically initializes when mounted and provides methods to refresh data.
 * 
 * @returns Session management interface with data and methods
 * 
 * @example
 * ```tsx
 * function MyCopilotScreen() {
 *   const { sessionData, isSessionReady, refreshWallets } = useCopilotSession();
 *   
 *   if (!isSessionReady) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   return (
 *     <View>
 *       <Text>Total Balance: N${sessionData.totalBalance}</Text>
 *       <Button onPress={refreshWallets}>Refresh</Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useCopilotSession(): UseCopilotSessionReturn {
  const { profile } = useUser();
  const { clearSession, startCopilotSession } = useCopilotContext();
  const isMountedRef = useRef(true);

  const [sessionData, setSessionData] = useState<CopilotSessionData>({
    wallets: [],
    totalBalance: 0,
    sessionStarted: null,
    lastRefresh: null,
    isLoading: false,
    error: null,
  });

  /**
   * Fetch wallet data and update session state.
   * Handles errors gracefully and updates loading state.
   */
  const fetchWalletData = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    setSessionData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const wallets = await getWallets();
      const totalBalance = wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);

      if (isMountedRef.current) {
        setSessionData((prev) => ({
          ...prev,
          wallets,
          totalBalance,
          lastRefresh: new Date().toISOString(),
          isLoading: false,
          error: null,
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load wallet data';
        console.error('useCopilotSession fetchWalletData error:', error);
        setSessionData((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    }
  }, []);

  /**
   * Initialize the copilot session.
   * Fetches wallet data and sets up the session context.
   */
  const initializeSession = useCallback(async (): Promise<void> => {
    if (!profile?.id) {
      console.warn('useCopilotSession: Cannot initialize without authenticated user');
      return;
    }

    setSessionData((prev) => ({
      ...prev,
      sessionStarted: new Date().toISOString(),
      isLoading: true,
      error: null,
    }));

    startCopilotSession();
    await fetchWalletData();
  }, [profile?.id, startCopilotSession, fetchWalletData]);

  /**
   * Refresh wallet data without resetting the conversation.
   * Useful after transactions or when user manually requests a refresh.
   */
  const refreshWallets = useCallback(async (): Promise<void> => {
    await fetchWalletData();
  }, [fetchWalletData]);

  /**
   * Clear session data and conversation history.
   * Called when user logs out or explicitly resets the copilot.
   */
  const resetSession = useCallback((): void => {
    clearSession();
    setSessionData({
      wallets: [],
      totalBalance: 0,
      sessionStarted: null,
      lastRefresh: null,
      isLoading: false,
      error: null,
    });
  }, [clearSession]);

  /**
   * Auto-initialize session when user becomes authenticated.
   */
  useEffect(() => {
    if (profile?.id && !sessionData.sessionStarted) {
      initializeSession();
    }
  }, [profile?.id, sessionData.sessionStarted, initializeSession]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isSessionReady = Boolean(
    profile?.id && 
    sessionData.sessionStarted && 
    !sessionData.isLoading && 
    !sessionData.error
  );

  return {
    sessionData,
    initializeSession,
    refreshWallets,
    resetSession,
    isSessionReady,
  };
}
