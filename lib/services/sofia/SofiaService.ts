/**
 * @fileoverview SofiaService — thin chat-completion wrapper over LLMProviderRouter.
 * Location: lib/services/sofia/SofiaService.ts
 */
import { handleServiceError } from '@/lib/utils/errors';
import { LLMProviderRouter } from '@/lib/services/ai/LLMProviderRouter';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Thin LLM smoke-test client only.
 * Production chat MUST use `processSofiaConciergeMessage` / `/api/sofia/chat` / `/api/ai/concierge`.
 */
export class SofiaService {
  private llmRouter: LLMProviderRouter;

  constructor() {
    this.llmRouter = new LLMProviderRouter();
  }

  /**
   * Direct LLM call (no RAG, persistence, or role filtering) — tests and diagnostics only.
   */
  private contextualFallback(messages: ChatMessage[]): string {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() ?? '';
    if (/\b(food|menu|restaurant|cuisine|serve|dining)\b/.test(lastUser)) {
      return 'Our on-site restaurant serves breakfast, lunch, and dinner. I can help with the menu or a table reservation.';
    }
    if (/\b(book|room|stay|reservation)\b/.test(lastUser)) {
      return 'I can help you book a room at Hotel Etuna — share your dates and number of guests.';
    }
    return 'Sorry, I encountered an AI provider issue. Please try again or contact the team.';
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const result = await this.llmRouter.chat(messages, {
        fallback: () => this.contextualFallback(messages),
      });
      return result.content;
    } catch (error) {
      handleServiceError(error, 'Error communicating with Sofia AI.');
      return 'Sorry, I encountered an error. Please try again.';
    }
  }
}
