export interface ConversationContext {
  tenantId: string;
  propertyId?: string;
  guestId?: string;
  bookingId?: string;
  sessionId: string;
}

/** Stored on ai_conversations.channel (aligned with EMAIL / WEB usage in codebase). */
export type AIConversationChannel = 'WEB' | 'EMAIL' | 'WHATSAPP' | 'PHONE';

export interface AIRequest {
  message: string;
  context: ConversationContext;
  language?: string; // 'en' or 'af' for Afrikaans
  /** When omitted, Sofia defaults to WEB. */
  channel?: AIConversationChannel;
  /** Set by email inbox pipeline for EMAIL channel context. */
  emailData?: { subject?: string; from_email?: string; message_id?: string };
  previousMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export interface AIResponse {
  response: string;
  confidence: number;
  intent: string;
  entities: Record<string, unknown>;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
}
