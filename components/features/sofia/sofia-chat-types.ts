/**
 * Shared Sofia chat message types for staff, public, and concierge UIs.
 * Location: components/features/sofia/sofia-chat-types.ts
 */

export type SofiaChatRole = 'user' | 'assistant';

export type SofiaChatMessage = {
  id?: string;
  role: SofiaChatRole;
  content: string;
  timestamp?: Date;
  suggestions?: string[];
  confidence?: number;
  actions?: Array<{ type: string; data: Record<string, unknown> }>;
};
