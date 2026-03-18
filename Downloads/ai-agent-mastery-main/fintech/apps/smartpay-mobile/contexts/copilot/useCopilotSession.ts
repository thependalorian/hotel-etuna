/**
 * useCopilotSession – Smartpay Agentic Copilot.
 * Wires Copilot context from UserContext + wallets. Tools are registered via useCopilotTools.
 * Location: fintech/smartpay/contexts/copilot/useCopilotSession.ts
 */
import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getWallets, type Wallet } from '@/services/wallets';
import { useCopilotContext } from './CopilotContext';

export function useCopilotSession() {
  const { profile } = useUser();
  const { messages } = useCopilotContext();
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    let cancelled = false;
    getWallets().then((list) => {
      if (!cancelled) setWallets(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const context = useMemo(
    () => ({
      user: {
        id: profile?.id,
        firstName: profile?.firstName ?? '',
        lastName: profile?.lastName ?? '',
        locale: 'en',
      },
      wallets: wallets.map((w) => ({
        id: w.id,
        name: w.name,
        balance: w.balance,
        type: w.type,
        currency: w.currency,
        frozen: w.status === 'frozen',
      })),
      recentMessages: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    }),
    [messages, profile, wallets]
  );

  return { context };
}
