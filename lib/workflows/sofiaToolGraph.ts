/**
 * Sofia tool-calling LangGraph — ReAct-style tool loop for WEB concierge.
 *
 * Purpose: Orchestrate searchRag, getGuestProfile, and checkAvailability via LangGraph ToolNode.
 * Location: /lib/workflows/sofiaToolGraph.ts
 *
 * Ported patterns from langgraphjs/examples/streaming/src/agents/simple-tool-graph.ts (study only).
 * IMPORTANT: Do NOT import from buffr-host/source-codes/* at runtime.
 */

import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { RAGSearchService } from '@/lib/services/documents/RAGSearchService';
import { CustomerService } from '@/lib/services/crm/CustomerService';
import { AvailabilityService } from '@/lib/services/booking/AvailabilityService';
import { LLMProviderRouter } from '@/lib/services/ai/LLMProviderRouter';
import { db } from '@/lib/db';
import { guests, properties } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { documentGenerationService } from '@/lib/services/documents/DocumentGenerationService';

export type SofiaToolGraphContext = {
  sessionId: string;
  tenantId: string;
  propertyId?: string;
  guestId?: string;
  bookingId?: string;
  contextString?: string;
};

export type SofiaToolGraphDeps = {
  ragSearch: Pick<RAGSearchService, 'search'>;
  customerService: Pick<CustomerService, 'getGuestProfile'>;
  availabilityService: Pick<AvailabilityService, 'getAvailableRooms' | 'getRoomTypeAvailability'>;
  llmRouter: Pick<LLMProviderRouter, 'chat'>;
};

export type SofiaToolGraphResult = {
  response: string;
  confidence: number;
  toolsUsed: string[];
  toolGraphMs: number;
};

const MAX_TOOL_ITERATIONS = 3;

function parseDateOrNull(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Build LangChain tools bound to tenant/property/guest context. */
export function createSofiaTools(ctx: SofiaToolGraphContext, deps: SofiaToolGraphDeps) {
  const searchRag = tool(
    async (input: unknown) => {
      const { query } = input as { query: string };
      const chunks = await deps.ragSearch.search(query, ctx.tenantId, {
        propertyId: ctx.propertyId,
        limit: 4,
      });
      if (chunks.length === 0) {
        return 'No matching knowledge base entries found.';
      }
      return chunks.map((c) => c.text).join('\n\n');
    },
    {
      name: 'searchRag',
      description: 'Search the hotel knowledge base for policies, amenities, and services',
      schema: z.object({
        query: z.string().describe('Natural language search query'),
      }),
    }
  );

  const getGuestProfile = tool(
    async (input: unknown) => {
      const { guestId } = input as { guestId?: string };
      const resolvedGuestId = guestId ?? ctx.guestId;
      if (!resolvedGuestId) {
        return 'Guest ID is not available for this session.';
      }

      try {
        const profile = await deps.customerService.getGuestProfile(resolvedGuestId, ctx.tenantId);
        return JSON.stringify({
          loyaltyTier: profile.loyaltyTier,
          loyaltyPoints: profile.loyaltyPoints,
          preferredRoomType: profile.preferredRoomType,
          dietaryRestrictions: profile.dietaryRestrictions,
          accessibilityNeeds: profile.accessibilityNeeds,
        });
      } catch {
        const [guest] = await db
          .select({
            email: guests.email,
            firstName: guests.firstName,
            lastName: guests.lastName,
          })
          .from(guests)
          .where(and(eq(guests.id, resolvedGuestId), eq(guests.tenantId, ctx.tenantId)))
          .limit(1);

        if (!guest) {
          return 'Guest profile not found.';
        }

        return JSON.stringify({
          email: guest.email,
          name: [guest.firstName, guest.lastName].filter(Boolean).join(' ') || undefined,
        });
      }
    },
    {
      name: 'getGuestProfile',
      description: 'Load CRM guest profile (loyalty, preferences) when guest is known',
      schema: z.object({
        guestId: z.string().optional().describe('Guest UUID; defaults to session guest'),
      }),
    }
  );

  const checkAvailability = tool(
    async (input: unknown) => {
      const { checkInDate, checkOutDate, propertyId } = input as {
        checkInDate: string;
        checkOutDate: string;
        propertyId?: string;
      };
      const resolvedPropertyId = propertyId ?? ctx.propertyId;
      if (!resolvedPropertyId) {
        return 'Property ID is required to check room availability.';
      }

      const checkIn = parseDateOrNull(checkInDate);
      const checkOut = parseDateOrNull(checkOutDate);
      if (!checkIn || !checkOut || checkOut <= checkIn) {
        return 'Invalid dates. Use YYYY-MM-DD with check-out after check-in.';
      }

      const availableRooms = await deps.availabilityService.getAvailableRooms(
        resolvedPropertyId,
        checkIn,
        checkOut
      );
      const summary = await deps.availabilityService.getRoomTypeAvailability(
        resolvedPropertyId,
        checkIn,
        checkOut
      );

      return JSON.stringify({
        checkInDate,
        checkOutDate,
        availableRoomCount: availableRooms.length,
        roomTypes: summary.map((row) => ({
          roomType: row.roomType,
          availableRooms: row.availableRooms,
          totalRooms: row.totalRooms,
        })),
      });
    },
    {
      name: 'checkAvailability',
      description: 'Check guest-room availability for a property and date range',
      schema: z.object({
        checkInDate: z.string().describe('Check-in date YYYY-MM-DD'),
        checkOutDate: z.string().describe('Check-out date YYYY-MM-DD'),
        propertyId: z.string().optional().describe('Property UUID; defaults to session property'),
      }),
    }
  );

  const resendGuestDocument = tool(
    async (input: unknown) => {
      const { bookingId, documentType, transactionId } = input as {
        bookingId: string;
        documentType: 'quotation' | 'invoice' | 'receipt' | 'payment_notification';
        transactionId?: string;
      };
      const resolvedGuestId = ctx.guestId;
      if (!resolvedGuestId) {
        return 'Guest session required to resend documents.';
      }

      const [property] = await db
        .select({ ownerId: properties.ownerId })
        .from(properties)
        .where(eq(properties.tenantId, ctx.tenantId))
        .limit(1);

      const generatedBy = property?.ownerId ?? resolvedGuestId;

      await documentGenerationService.generateAndEmail({
        tenantId: ctx.tenantId,
        bookingId,
        documentType,
        generatedBy,
        transactionId,
      });

      return `Document ${documentType} queued for email to the guest.`;
    },
    {
      name: 'resendGuestDocument',
      description:
        'Email a financial PDF (quotation, invoice, receipt, payment notification) to the guest',
      schema: z.object({
        bookingId: z.string().describe('Booking UUID for the stay'),
        documentType: z.enum(['quotation', 'invoice', 'receipt', 'payment_notification']),
        transactionId: z.string().optional().describe('Required for receipt / payment notification'),
      }),
    }
  );

  return [searchRag, getGuestProfile, checkAvailability, resendGuestDocument] as const;
}

/** Heuristic tool planner when LLM bindTools is unavailable (LLMProviderRouter). */
function planToolCalls(
  message: string,
  ctx: SofiaToolGraphContext
): Array<{ id: string; name: string; args: Record<string, unknown> }> {
  const lower = message.toLowerCase();
  const calls: Array<{ id: string; name: string; args: Record<string, unknown> }> = [];
  let idx = 0;

  const needsRag =
    /\b(amenit|policy|wifi|breakfast|pool|spa|restaurant|service|facility|facilities|check-in|check-out)\b/.test(
      lower
    ) || lower.includes('tell me about') || lower.includes('what do you');

  if (needsRag) {
    calls.push({
      id: `call_${idx++}`,
      name: 'searchRag',
      args: { query: message },
    });
  }

  if (ctx.guestId && /\b(loyalty|preference|profile|remember|diet|accessibility)\b/.test(lower)) {
    calls.push({
      id: `call_${idx++}`,
      name: 'getGuestProfile',
      args: { guestId: ctx.guestId },
    });
  }

  const dateMatch = message.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/);
  const wantsAvailability =
    /\b(available|availability|room|book|reserve|stay)\b/.test(lower) || Boolean(dateMatch);

  if (
    ctx.guestId &&
    ctx.bookingId &&
    /\b(resend|send|email|copy of)\b/.test(lower) &&
    /\b(receipt|invoice|quotation|payment notification)\b/.test(lower)
  ) {
    calls.push({
      id: `call_${idx++}`,
      name: 'resendGuestDocument',
      args: {
        bookingId: ctx.bookingId,
        documentType: lower.includes('invoice')
          ? 'invoice'
          : lower.includes('quotation')
            ? 'quotation'
            : lower.includes('payment')
              ? 'payment_notification'
              : 'receipt',
      },
    });
  }

  if (wantsAvailability && ctx.propertyId) {
    const checkInDate = dateMatch?.[1] ?? new Date().toISOString().slice(0, 10);
    const checkOutDate =
      dateMatch?.[2] ??
      new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    calls.push({
      id: `call_${idx++}`,
      name: 'checkAvailability',
      args: { checkInDate, checkOutDate, propertyId: ctx.propertyId },
    });
  }

  return calls.slice(0, MAX_TOOL_ITERATIONS);
}

/**
 * Compile the Sofia tool graph (agent → tools loop → final response).
 * Exported for unit tests asserting graph compilation.
 */
export function compileSofiaToolGraph(
  ctx: SofiaToolGraphContext,
  deps: SofiaToolGraphDeps
) {
  const tools = createSofiaTools(ctx, deps);
  const toolNode = new ToolNode([...tools]);
  const toolNames = new Set(tools.map((t) => t.name));
  let iterations = 0;

  async function agentNode(state: typeof MessagesAnnotation.State) {
    const userMessage = [...state.messages]
      .reverse()
      .find((m) => m instanceof HumanMessage);

    const content =
      typeof userMessage?.content === 'string'
        ? userMessage.content
        : String(userMessage?.content ?? '');

    if (iterations >= MAX_TOOL_ITERATIONS) {
      return { messages: [new AIMessage({ content: 'Tool iteration limit reached.' })] };
    }

    const planned = planToolCalls(content, ctx).filter((c) => toolNames.has(c.name));
    if (planned.length === 0) {
      return { messages: [new AIMessage({ content: '' })] };
    }

    iterations += 1;
    return {
      messages: [
        new AIMessage({
          content: '',
          tool_calls: planned.map((c) => ({
            id: c.id,
            name: c.name,
            args: c.args,
          })),
        }),
      ],
    };
  }

  async function respondNode(state: typeof MessagesAnnotation.State) {
    const userMessage = [...state.messages]
      .reverse()
      .find((m) => m instanceof HumanMessage);
    const userText =
      typeof userMessage?.content === 'string'
        ? userMessage.content
        : String(userMessage?.content ?? '');

    const toolOutputs = state.messages
      .filter((m): m is ToolMessage => m instanceof ToolMessage)
      .map((m) => String(m.content))
      .join('\n\n');

    const systemPrompt = `You are Sofia, the AI concierge for Hotel Etuna in Namibia.
Use the tool results below when answering. Be helpful, accurate, and concise.

${ctx.contextString ? `Session context:\n${ctx.contextString}\n\n` : ''}${
      toolOutputs ? `Tool results:\n${toolOutputs}` : 'No tool results were retrieved.'
    }`;

    const result = await deps.llmRouter.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      { maxTokens: 500, temperature: 0.7 }
    );

    return {
      messages: [new AIMessage({ content: result.content })],
    };
  }

  function routeAfterAgent(state: typeof MessagesAnnotation.State) {
    const last = state.messages.at(-1);
    if (last instanceof AIMessage && last.tool_calls?.length) {
      return 'tools';
    }
    return 'respond';
  }

  return new StateGraph(MessagesAnnotation)
    .addNode('agent', agentNode)
    .addNode('tools', toolNode)
    .addNode('respond', respondNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', routeAfterAgent, ['tools', 'respond'])
    .addEdge('tools', 'respond')
    .addEdge('respond', END)
    .compile();
}

/** Default deps for production invocation. */
export function defaultSofiaToolGraphDeps(): SofiaToolGraphDeps {
  return {
    ragSearch: new RAGSearchService(),
    customerService: new CustomerService(),
    availabilityService: new AvailabilityService(),
    llmRouter: new LLMProviderRouter(),
  };
}

/**
 * Run the Sofia tool graph for a user message.
 */
export async function executeSofiaToolGraph(
  message: string,
  ctx: SofiaToolGraphContext,
  deps: SofiaToolGraphDeps = defaultSofiaToolGraphDeps()
): Promise<SofiaToolGraphResult> {
  const started = Date.now();
  const graph = compileSofiaToolGraph(ctx, deps);

  try {
    const result = await graph.invoke({
      messages: [new HumanMessage(message)],
    });

    const toolsUsed = result.messages
      .filter((m): m is ToolMessage => m instanceof ToolMessage)
      .map((m) => m.name ?? 'unknown');

    const lastAi = [...result.messages].reverse().find((m) => m instanceof AIMessage);
    const response =
      lastAi && typeof lastAi.content === 'string' && lastAi.content.trim()
        ? lastAi.content
        : "I'm here to help with Hotel Etuna. What would you like to know?";

    return {
      response,
      confidence: 0.88,
      toolsUsed,
      toolGraphMs: Date.now() - started,
    };
  } catch {
    return {
      response:
        "I'm having technical difficulties. Let me connect you with a team member who can help.",
      confidence: 0.5,
      toolsUsed: [],
      toolGraphMs: Date.now() - started,
    };
  }
}

export function isSofiaToolGraphEnabled(): boolean {
  return process.env.SOFIA_TOOL_GRAPH_ENABLED === 'true';
}
