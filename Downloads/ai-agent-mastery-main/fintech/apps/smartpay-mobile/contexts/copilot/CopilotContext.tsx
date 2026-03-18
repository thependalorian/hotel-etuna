/**
 * CopilotContext – Smartpay Agentic Copilot.
 * Manages pending actions for user confirmation (2FA/confirm dialogs).
 * Location: fintech/smartpay/mobile/contexts/copilot/CopilotContext.tsx
 */
import React, { createContext, useCallback, useContext, useState } from 'react';

/**
 * Pending action types that require user confirmation.
 */
export type PendingActionType =
  | 'send_money'
  | 'cashout'
  | 'redeem_voucher'
  | 'apply_loan'
  | 'create_wallet'
  | 'pisp_payment'
  | 'create_group'
  | 'split_bill';

/**
 * Pending action interface for confirmation dialogs.
 */
export interface PendingAction {
  /** Type of action requiring confirmation */
  type: PendingActionType;
  /** User-friendly action label */
  label: string;
  /** Detailed description of the action */
  detail: string;
  /** Action-specific data payload */
  payload: Record<string, unknown>;
  /** Callback to resolve the action (true = confirmed, false = cancelled) */
  resolve: (confirmed: boolean) => void;
}

/**
 * Chat message interface.
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Message role (user or assistant) */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: string;
  /** Optional card type for assistant messages */
  cardType?: 'transaction' | 'map' | 'wallet_form' | 'error';
  /** Optional card data for assistant messages */
  cardData?: Record<string, unknown>;
}

/**
 * Copilot context state interface.
 */
interface CopilotState {
  /** Current pending action awaiting confirmation */
  pendingAction: PendingAction | null;
  /** Chat message history */
  messages: ChatMessage[];
  /** Whether copilot is currently sending a message */
  isSending: boolean;
}

/**
 * Copilot context value with state and actions.
 */
interface CopilotContextValue extends CopilotState {
  /** Set a new pending action */
  setPendingAction: (action: PendingAction | null) => void;
  /** Clear the current pending action */
  clearPendingAction: () => void;
  /** Append a message to the chat */
  appendMessage: (role: 'user' | 'assistant', content: string, cardType?: ChatMessage['cardType'], cardData?: Record<string, unknown>) => void;
  /** Set sending state */
  setIsSending: (isSending: boolean) => void;
  /** Clear all messages */
  clearMessages: () => void;
}

const CopilotContext = createContext<CopilotContextValue | undefined>(undefined);

/**
 * CopilotProvider component that manages copilot state.
 * @param children - Child components
 */
export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [pendingAction, setPendingActionState] = useState<PendingAction | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  /**
   * Sets a new pending action for user confirmation.
   * @param action - Pending action or null to clear
   */
  const setPendingAction = useCallback((action: PendingAction | null) => {
    setPendingActionState(action);
  }, []);

  /**
   * Clears the current pending action.
   */
  const clearPendingAction = useCallback(() => {
    setPendingActionState(null);
  }, []);

  /**
   * Appends a message to the chat history.
   * @param role - Message role (user or assistant)
   * @param content - Message content
   * @param cardType - Optional card type for assistant messages
   * @param cardData - Optional card data for assistant messages
   */
  const appendMessage = useCallback((
    role: 'user' | 'assistant',
    content: string,
    cardType?: ChatMessage['cardType'],
    cardData?: Record<string, unknown>
  ) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      cardType,
      cardData,
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  /**
   * Clears all messages from chat history.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value: CopilotContextValue = {
    pendingAction,
    setPendingAction,
    clearPendingAction,
    messages,
    appendMessage,
    isSending,
    setIsSending,
    clearMessages,
  };

  return (
    <CopilotContext.Provider value={value}>
      {children}
    </CopilotContext.Provider>
  );
}

/**
 * Hook to access copilot context.
 * @throws Error if used outside CopilotProvider
 */
export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) {
    throw new Error('useCopilot must be used within CopilotProvider');
  }
  return ctx;
}

/**
 * Alias for backwards compatibility.
 */
export const useCopilotContext = useCopilot;
