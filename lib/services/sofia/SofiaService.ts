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
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const result = await this.llmRouter.chat(messages, {
        fallback: () => 'Sorry, I encountered an AI provider issue. Please try again or contact the team.',
      });
      return result.content;
    } catch (error) {
      handleServiceError(error, 'Error communicating with Sofia AI.');
      return 'Sorry, I encountered an error. Please try again.';
    }
  }
}
