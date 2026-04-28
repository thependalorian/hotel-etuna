import { handleServiceError } from '@/lib/utils/errors';
import { LLMProviderRouter } from '@/lib/services/ai/LLMProviderRouter';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class SofiaService {
  private llmRouter: LLMProviderRouter;

  constructor() {
    this.llmRouter = new LLMProviderRouter();
  }

  /**
   * Sends a message to Sofia through the configured multi-provider LLM router.
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
