/**
 * Sofia AI Pipeline Service
 * 
 * Multi-stage AI processing pipeline inspired by JackTheButler/src/core/pipeline/index.ts
 * Ported patterns: stage-based execution, context enrichment, memory integration
 * 
 * IMPORTANT: Do NOT import from buffr-host/source-codes/* at runtime
 * 
 * @module services/sofia/SofiaPipelineService
 */

import { securityLogger } from '@/lib/utils/security-logger';
import { RAGSearchService } from '@/lib/services/documents/RAGSearchService';
import { CrmGraphMemoryService } from '@/lib/services/crm/CrmGraphMemoryService';
import { LLMProviderRouter } from '@/lib/services/ai/LLMProviderRouter';
import { db } from '@/lib/db';
import { aiConversations, aiMessages, sofiaPipelineRuns } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import {
  executeSofiaToolGraph,
  isSofiaToolGraphEnabled,
} from '@/lib/workflows/sofiaToolGraph';

/**
 * Pipeline context - enriched as it flows through stages
 */
export interface PipelineContext {
  // Input
  userMessage: string;
  sessionId: string;
  tenantId: string;
  propertyId?: string;
  guestId?: string;
  bookingId?: string;
  channel: 'WEB' | 'EMAIL' | 'WHATSAPP' | 'PHONE';
  
  // Enriched during pipeline
  conversationId?: string;
  guestEmail?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  ragChunks?: Array<{ text: string; source?: string }>;
  memoryAugmentation?: string;
  contextString?: string;
  
  // AI response
  aiResponse?: string;
  confidence?: number;
  intent?: string;
  
  // Metadata
  startTime: number;
  stageTimings: Record<string, number>;
  errors: Array<{ stage: string; error: string }>;
  toolGraphUsed?: boolean;
  toolsUsed?: string[];
}

/**
 * Pipeline stage - processes and enriches context
 */
export type PipelineStage = (ctx: PipelineContext) => Promise<PipelineContext>;

/**
 * Sofia Pipeline Service
 * 
 * Orchestrates multi-stage AI conversation processing with:
 * - Conversation history loading
 * - RAG knowledge retrieval
 * - Guest memory integration
 * - LLM generation
 * - Conversation persistence
 */
export class SofiaPipelineService {
  private ragSearch: RAGSearchService;
  private memoryService: CrmGraphMemoryService;
  private llmRouter: LLMProviderRouter;
  
  constructor() {
    this.ragSearch = new RAGSearchService();
    this.memoryService = new CrmGraphMemoryService();
    this.llmRouter = new LLMProviderRouter();
  }
  
  /**
   * Execute the full pipeline
   * 
   * @param input - User message and context
   * @returns AI response with metadata
   */
  async process(input: {
    message: string;
    sessionId: string;
    tenantId: string;
    propertyId?: string;
    guestId?: string;
    bookingId?: string;
    channel?: 'WEB' | 'EMAIL' | 'WHATSAPP' | 'PHONE';
  }) {
    const ctx: PipelineContext = {
      userMessage: input.message,
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      guestId: input.guestId,
      bookingId: input.bookingId,
      channel: input.channel || 'WEB',
      intent: this.extractIntent(input.message),
      startTime: Date.now(),
      stageTimings: {},
      errors: [],
    };
    
    try {
      // Stage 1: Load conversation
      const stage1 = await this.stageLoadConversation(ctx);
      
      // Stage 2: Retrieve RAG knowledge
      const stage2 = await this.stageRetrieveKnowledge(stage1);
      
      // Stage 3: Load guest memory
      const stage3 = await this.stageLoadMemory(stage2);
      
      // Stage 4: Build context string
      const stage4 = await this.stageBuildContext(stage3);
      
      // Stage 5: Generate response
      const stage5 = await this.stageGenerateResponse(stage4);
      
      // Stage 6: Persist conversation
      const stage6 = await this.stageSaveConversation(stage5);

      const totalTime = Date.now() - stage6.startTime;
      const status = stage6.errors.length > 0 ? 'completed_with_errors' : 'completed';

      this.persistPipelineRun({
        sessionId: stage6.sessionId,
        tenantId: stage6.tenantId,
        stages: {
          timings: stage6.stageTimings,
          errors: stage6.errors,
          toolGraphUsed: stage6.toolGraphUsed ?? false,
          toolsUsed: stage6.toolsUsed ?? [],
          channel: stage6.channel,
          intent: stage6.intent,
        },
        totalMs: totalTime,
        status,
      });

      return {
        response: stage6.aiResponse || 'I apologize, but I encountered an issue processing your request.',
        confidence: stage6.confidence || 0.5,
        intent: stage6.intent || 'general_inquiry',
        metadata: {
          pipelineTimings: stage6.stageTimings,
          totalTime,
          errors: stage6.errors,
          ragChunks: stage6.ragChunks?.length || 0,
          memoryUsed: Boolean(stage6.memoryAugmentation),
          toolGraphUsed: stage6.toolGraphUsed ?? false,
          toolsUsed: stage6.toolsUsed ?? [],
        },
      };
    } catch (error) {
      securityLogger.error('[SofiaPipeline] Fatal error:', error);
      return {
        response: "I'm experiencing technical difficulties. Please try again or contact support.",
        confidence: 0.3,
        intent: 'error',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  
  /**
   * Stage 1: Load Conversation History
   * 
   * Retrieves last 20 messages from the conversation
   */
  private async stageLoadConversation(ctx: PipelineContext): Promise<PipelineContext> {
    const stageStart = Date.now();
    
    try {
      const [conv] = await db
        .select({ id: aiConversations.id, guestId: aiConversations.guestId })
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.sessionId, ctx.sessionId),
            eq(aiConversations.tenantId, ctx.tenantId)
          )
        )
        .limit(1);
      
      if (!conv) {
        ctx.stageTimings.loadConversation = Date.now() - stageStart;
        return ctx;
      }
      
      ctx.conversationId = conv.id;
      if (conv.guestId) {
        ctx.guestId = conv.guestId;
      }
      
      const messages = await db
        .select({
          senderType: aiMessages.senderType,
          content: aiMessages.content,
        })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conv.id))
        .orderBy(desc(aiMessages.createdAt))
        .limit(20);
      
      ctx.conversationHistory = messages
        .reverse()
        .map((m) => ({
          role: (m.senderType === 'ASSISTANT' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content,
        }));
      
      ctx.stageTimings.loadConversation = Date.now() - stageStart;
      return ctx;
    } catch (error) {
      ctx.errors.push({
        stage: 'loadConversation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      ctx.stageTimings.loadConversation = Date.now() - stageStart;
      return ctx;
    }
  }
  
  /**
   * Stage 2: Retrieve Knowledge Base
   * 
   * Searches RAG vector database for relevant property knowledge
   */
  private async stageRetrieveKnowledge(ctx: PipelineContext): Promise<PipelineContext> {
    const stageStart = Date.now();
    
    try {
      const chunks = await this.ragSearch.search(ctx.userMessage, ctx.tenantId, {
        propertyId: ctx.propertyId,
        limit: 6,
      });
      
      ctx.ragChunks = chunks.map((c) => ({
        text: c.text,
        source: c.source,
      }));
      
      ctx.stageTimings.retrieveKnowledge = Date.now() - stageStart;
      return ctx;
    } catch (error) {
      ctx.errors.push({
        stage: 'retrieveKnowledge',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      ctx.stageTimings.retrieveKnowledge = Date.now() - stageStart;
      return ctx;
    }
  }
  
  /**
   * Stage 3: Load Guest Memory
   * 
   * Retrieves personalized guest facts from CRM memory graph
   */
  private async stageLoadMemory(ctx: PipelineContext): Promise<PipelineContext> {
    const stageStart = Date.now();
    
    try {
      if (!ctx.guestId) {
        ctx.stageTimings.loadMemory = Date.now() - stageStart;
        return ctx;
      }
      
      const memoryPrompt = await this.memoryService.buildPromptAugmentation(
        ctx.tenantId,
        ctx.guestId,
        ctx.userMessage
      );
      
      if (memoryPrompt) {
        ctx.memoryAugmentation = memoryPrompt;
      }
      
      ctx.stageTimings.loadMemory = Date.now() - stageStart;
      return ctx;
    } catch (error) {
      ctx.errors.push({
        stage: 'loadMemory',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      ctx.stageTimings.loadMemory = Date.now() - stageStart;
      return ctx;
    }
  }
  
  /**
   * Stage 4: Build Context String
   * 
   * Assembles all context into a single prompt string
   */
  private async stageBuildContext(ctx: PipelineContext): Promise<PipelineContext> {
    const stageStart = Date.now();
    
    try {
      const contextParts: string[] = [];
      
      // Channel context
      if (ctx.channel === 'EMAIL') {
        contextParts.push('Channel: Email communication');
      } else if (ctx.channel === 'WHATSAPP') {
        contextParts.push('Channel: WhatsApp messaging');
      } else if (ctx.channel === 'PHONE') {
        contextParts.push('Channel: Phone/voice (keep responses concise for TTS)');
      }
      
      // Guest memory
      if (ctx.memoryAugmentation) {
        contextParts.push(`Guest profile:\n${ctx.memoryAugmentation}`);
      }
      
      // RAG knowledge
      if (ctx.ragChunks && ctx.ragChunks.length > 0) {
        contextParts.push(
          'Hotel knowledge base:',
          ...ctx.ragChunks.map((c) => `- ${c.text}${c.source ? ` [${c.source}]` : ''}`)
        );
      }
      
      ctx.contextString = contextParts.join('\n\n');
      ctx.stageTimings.buildContext = Date.now() - stageStart;
      return ctx;
    } catch (error) {
      ctx.errors.push({
        stage: 'buildContext',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      ctx.stageTimings.buildContext = Date.now() - stageStart;
      return ctx;
    }
  }
  
  /**
   * Stage 5: Generate AI Response
   * 
   * Calls LLM with full context to generate response
   */
  private async stageGenerateResponse(ctx: PipelineContext): Promise<PipelineContext> {
    const stageStart = Date.now();

    try {
      const useToolGraph =
        isSofiaToolGraphEnabled() &&
        (ctx.channel === 'WEB' ||
          (ctx.channel === 'EMAIL' && ctx.guestId && ctx.bookingId));

      if (useToolGraph) {
        const toolResult = await executeSofiaToolGraph(ctx.userMessage, {
          sessionId: ctx.sessionId,
          tenantId: ctx.tenantId,
          propertyId: ctx.propertyId,
          guestId: ctx.guestId,
          bookingId: ctx.bookingId,
          contextString: ctx.contextString,
        });

        ctx.aiResponse = toolResult.response;
        ctx.confidence = toolResult.confidence;
        ctx.intent = this.extractIntent(ctx.userMessage);
        ctx.toolGraphUsed = true;
        ctx.toolsUsed = toolResult.toolsUsed;
        ctx.stageTimings.toolGraph = toolResult.toolGraphMs;
        ctx.stageTimings.generateResponse = Date.now() - stageStart;
        return ctx;
      }

      const systemPrompt = `You are Sofia, the AI concierge for Hotel Etuna in Namibia.

${ctx.contextString || ''}

Be helpful, friendly, and professional. Use the context provided to give accurate information.
If you don't know something, admit it and offer to connect with staff.`;
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...(ctx.conversationHistory || []),
        { role: 'user' as const, content: ctx.userMessage },
      ];
      
      const result = await this.llmRouter.chat(messages, {
        maxTokens: 500,
        temperature: 0.7,
      });
      
      ctx.aiResponse = result.content;
      ctx.confidence = result.degraded ? 0.65 : 0.85;
      ctx.intent = this.extractIntent(ctx.userMessage);
      
      ctx.stageTimings.generateResponse = Date.now() - stageStart;
      return ctx;
    } catch (error) {
      ctx.errors.push({
        stage: 'generateResponse',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      ctx.aiResponse = "I'm having technical difficulties. Let me connect you with a team member.";
      ctx.confidence = 0.5;
      ctx.intent = ctx.intent ?? this.extractIntent(ctx.userMessage);
      ctx.stageTimings.generateResponse = Date.now() - stageStart;
      return ctx;
    }
  }
  
  /**
   * Stage 6: Save Conversation
   * 
   * Persists user message and AI response to database
   */
  private async stageSaveConversation(ctx: PipelineContext): Promise<PipelineContext> {
    const stageStart = Date.now();
    
    try {
      // Create conversation if it doesn't exist
      if (!ctx.conversationId) {
        const [conv] = await db
          .insert(aiConversations)
          .values({
            sessionId: ctx.sessionId,
            tenantId: ctx.tenantId,
            guestId: ctx.guestId ?? null,
            propertyId: ctx.propertyId ?? null,
            channel: ctx.channel,
            status: 'active',
          })
          .returning();
        
        ctx.conversationId = conv.id;
      }
      
      // Save user message
      await db.insert(aiMessages).values({
        conversationId: ctx.conversationId,
        senderType: 'USER',
        content: ctx.userMessage,
        metadata: {
          propertyId: ctx.propertyId,
        },
      });
      
      // Save assistant message
      await db.insert(aiMessages).values({
        conversationId: ctx.conversationId,
        senderType: 'ASSISTANT',
        content: ctx.aiResponse || '',
        metadata: {
          confidence: ctx.confidence,
          intent: ctx.intent,
          ragChunks: ctx.ragChunks?.length || 0,
          memoryUsed: Boolean(ctx.memoryAugmentation),
          pipelineTimings: ctx.stageTimings,
        },
      });
      
      ctx.stageTimings.saveConversation = Date.now() - stageStart;
      return ctx;
    } catch (error) {
      ctx.errors.push({
        stage: 'saveConversation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      ctx.stageTimings.saveConversation = Date.now() - stageStart;
      return ctx;
    }
  }
  
  /**
   * Extract intent from user message
   */
  private extractIntent(message: string): string {
    const lower = message.toLowerCase();
    
    if (/\b(book|booking|reserve|reservation)\b/.test(lower)) {
      if (lower.includes('room') || lower.includes('hotel')) {
        return 'booking_room';
      }
      if (lower.includes('restaurant') || lower.includes('table')) {
        return 'booking_restaurant';
      }
      return 'booking_general';
    }
    
    if (/\b(rate|rates|price|prices|cost|costs|how much)\b/.test(lower)) {
      return 'pricing_inquiry';
    }
    
    if (lower.includes('menu') || lower.includes('food')) {
      return 'menu_inquiry';
    }
    
    if (lower.includes('amenities') || lower.includes('facilities')) {
      return 'amenities_inquiry';
    }
    
    return 'general_inquiry';
  }

  /**
   * Best-effort pipeline telemetry — never blocks the user response path.
   */
  private persistPipelineRun(input: {
    sessionId: string;
    tenantId: string;
    stages: Record<string, unknown>;
    totalMs: number;
    status: string;
  }): void {
    void db
      .insert(sofiaPipelineRuns)
      .values({
        sessionId: input.sessionId,
        tenantId: input.tenantId,
        stages: input.stages,
        totalMs: input.totalMs,
        status: input.status,
      })
      .catch((error) => {
        securityLogger.warn('[SofiaPipeline] Failed to persist pipeline run:', error);
      });
  }
}
