/**
 * Send Money Index - Redirects to select-recipient
 * 
 * This file serves as the entry point for the send-money flow.
 * It immediately redirects to the select-recipient screen.
 * 
 * Location: app/send-money/index.tsx
 * 
 * Navigation Flow:
 * /send-money → /send-money/select-recipient (immediate redirect)
 */

import { useEffect } from 'react';
import { router } from 'expo-router';

export default function SendMoneyIndex() {
  useEffect(() => {
    router.replace('/send-money/select-recipient');
  }, []);

  return null;
}
