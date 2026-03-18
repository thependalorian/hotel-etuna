/**
 * useCopilotSuggestions – Smartpay Agentic Copilot.
 * Returns context-aware suggestion chips (balance, send money, cash out, redeem voucher, etc.).
 * Location: fintech/smartpay/contexts/copilot/useCopilotSuggestions.ts
 */
import { useMemo, useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getWallets } from '@/services/wallets';
import { useCopilotContext } from './CopilotContext';

export interface SuggestionChip {
  id: string;
  label: string;
  prompt: string;
}

export function useCopilotSuggestions(): SuggestionChip[] {
  const { profile } = useUser();
  const { messages } = useCopilotContext();
  const [walletCount, setWalletCount] = useState(0);
  const [proofOfLifeDue, setProofOfLifeDue] = useState(false);

  useEffect(() => {
    getWallets().then((w) => setWalletCount(w.length));
  }, []);

  useEffect(() => {
    const due = profile?.proofOfLifeDueDate
      ? new Date(profile.proofOfLifeDueDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      : false;
    setProofOfLifeDue(Boolean(profile?.proofOfLifeDueDate && due));
  }, [profile]);

  return useMemo(() => {
    const list: SuggestionChip[] = [
      { id: 'balance', label: 'Check my balance', prompt: 'How much money do I have?' },
      { id: 'send', label: 'Send money', prompt: 'I want to send money to someone.' },
      { id: 'cashout', label: 'Cash out', prompt: 'Help me withdraw cash.' },
      { id: 'voucher', label: 'Redeem voucher', prompt: 'Redeem my voucher to my wallet.' },
    ];
    if (walletCount > 1) {
      list.push({ id: 'wallets', label: 'Show my wallets', prompt: 'Show all my wallets and balances.' });
    }
    if (proofOfLifeDue) {
      list.push({ id: 'pol', label: 'Verify proof of life', prompt: 'I want to do my proof-of-life verification.' });
    }
    list.push({ id: 'loan', label: 'Loan options', prompt: 'How much can I borrow against my grant?' });
    list.push({ id: 'activity', label: 'Recent activity', prompt: 'What did I spend last month?' });
    return list;
  }, [walletCount, proofOfLifeDue, messages.length]);
}
