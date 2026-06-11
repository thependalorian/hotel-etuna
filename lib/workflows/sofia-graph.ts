/**
 * Sofia AI Tool-Calling Graph
 * 
 * LangGraph-based workflow orchestration for Sofia's concierge capabilities.
 * Ported patterns from langgraphjs/examples/streaming/src/agents/simple-tool-graph.ts
 * 
 * IMPORTANT: Do NOT import from buffr-host/source-codes/* at runtime
 * 
 * @module workflows/sofia-graph
 */

import { AIMessage, SystemMessage, HumanMessage } from '@langchain/core/messages';
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { LLMProviderRouter } from '@/lib/services/ai/LLMProviderRouter';
import { RAGSearchService } from '@/lib/services/documents/RAGSearchService';
import { db } from '@/lib/db';
import { properties, cmsMenuItems, restaurants } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Tool: Search Hotel Knowledge Base
 */
const searchKnowledgeBase = tool(
  async (input: unknown) => {
    const { query, propertyId } = input as { query: string; propertyId?: string };
    const ragSearch = new RAGSearchService();
    const chunks = await ragSearch.search(query, process.env.HUB_TENANT_ID!, {
      propertyId,
      limit: 3,
    });
    
    if (chunks.length === 0) {
      return 'No relevant information found in knowledge base.';
    }
    
    return chunks.map((c) => c.text).join('\n\n');
  },
  {
    name: 'searchKnowledgeBase',
    description: 'Search the hotel knowledge base for information about facilities, policies, or services',
    schema: z.object({
      query: z.string().describe('The search query'),
      propertyId: z.string().optional().describe('Optional property ID to filter results'),
    }),
  }
);

/**
 * Tool: Check Room Availability
 */
const checkRoomAvailability = tool(
  async (input: unknown) => {
    const { checkInDate, checkOutDate } = input as {
      checkInDate: string;
      checkOutDate: string;
      propertyId?: string;
    };
    // This is a simplified version - in production, integrate with actual availability service
    return `I would need to check our live inventory system for availability between ${checkInDate} and ${checkOutDate}. Let me connect you with our booking team to confirm exact room availability and rates.`;
  },
  {
    name: 'checkRoomAvailability',
    description: 'Check room availability for specific dates',
    schema: z.object({
      checkInDate: z.string().describe('Check-in date (YYYY-MM-DD)'),
      checkOutDate: z.string().describe('Check-out date (YYYY-MM-DD)'),
      propertyId: z.string().optional().describe('Property ID to check'),
    }),
  }
);

/**
 * Tool: Get Menu Information
 */
const getMenuInformation = tool(
  async (input: unknown) => {
    const { propertyId } = input as { propertyId?: string };
    if (!propertyId) {
      return 'I need a property ID to fetch menu information.';
    }

    const items = await db
      .select({
        name: cmsMenuItems.name,
        description: cmsMenuItems.description,
        price: cmsMenuItems.price,
      })
      .from(cmsMenuItems)
      .innerJoin(restaurants, eq(cmsMenuItems.restaurantId, restaurants.id))
      .where(
        and(
          eq(restaurants.propertyId, propertyId),
          eq(cmsMenuItems.isAvailable, true)
        )
      )
      .limit(10);

    if (items.length === 0) {
      return 'No menu items currently available.';
    }

    return `Available menu items:\n${items
      .map((item) => {
        const price = Number.parseFloat(String(item.price));
        const formatted = Number.isFinite(price) ? price.toFixed(2) : '0.00';
        return `- ${item.name}: ${item.description || ''} (N$${formatted})`;
      })
      .join('\n')}`;
  },
  {
    name: 'getMenuInformation',
    description: 'Get information about restaurant menu items',
    schema: z.object({
      propertyId: z.string().describe('Property ID to get menu for'),
    }),
  }
);

/**
 * Tool: Get Property Amenities
 */
const getPropertyAmenities = tool(
  async (input: unknown) => {
    const { propertyId } = input as { propertyId?: string };
    if (!propertyId) {
      return 'I need a property ID to fetch amenities.';
    }
    
    const [property] = await db
      .select({
        name: properties.name,
        amenities: properties.amenities,
        description: properties.description,
      })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
    
    if (!property) {
      return 'Property not found.';
    }
    
    const amenitiesList = Array.isArray(property.amenities) 
      ? (property.amenities as string[]).join(', ')
      : 'No amenities listed';
    
    return `${property.name}:\n${property.description || ''}\n\nAmenities: ${amenitiesList}`;
  },
  {
    name: 'getPropertyAmenities',
    description: 'Get information about property amenities and facilities',
    schema: z.object({
      propertyId: z.string().describe('Property ID to get amenities for'),
    }),
  }
);

// Initialize LLM with tools
const llmRouter = new LLMProviderRouter();

/**
 * Sofia AI Agent Node
 * 
 * Processes user messages and decides whether to use tools or respond directly.
 */
async function sofiaAgent(state: typeof MessagesAnnotation.State) {
  const systemMessage = new SystemMessage(
    `You are Sofia, the AI concierge for Hotel Etuna. You are helpful, friendly, and professional.
    
Use tools when needed to provide accurate information about:
- Hotel facilities and amenities
- Room availability
- Restaurant menu
- Policies and services

If you don't have information, use the searchKnowledgeBase tool first before admitting you don't know.
Keep responses concise but comprehensive.`
  );
  
  try {
    // Convert state messages to LLM format
    const messages = [
      { role: 'system' as const, content: systemMessage.content.toString() },
      ...state.messages.map((msg) => ({
        role: (msg instanceof HumanMessage ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content.toString(),
      })),
    ];
    
    const result = await llmRouter.chat(messages, {
      maxTokens: 500,
      temperature: 0.7,
    });
    
    // Check if we need to call tools
    // For now, we'll use simple keyword detection
    const content = result.content.toLowerCase();
    const needsTools = 
      content.includes('tool') || 
      content.includes('check availability') ||
      content.includes('menu') ||
      content.includes('amenities');
    
    return {
      messages: [new AIMessage({ content: result.content, tool_calls: needsTools ? [] : undefined })],
    };
  } catch (error) {
    return {
      messages: [
        new AIMessage(
          "I'm having technical difficulties. Let me connect you with a team member who can help."
        ),
      ],
    };
  }
}

// Tool node for executing tool calls
const tools = [
  searchKnowledgeBase,
  checkRoomAvailability,
  getMenuInformation,
  getPropertyAmenities,
];

const toolNode = new ToolNode(tools);

/**
 * Router function to determine next step
 * 
 * @param state - Current conversation state
 * @returns Next node to execute ('tools' or END)
 */
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const last = state.messages.at(-1);
  if (!last || !(last instanceof AIMessage)) {
    return END;
  }
  
  // If the AI message has tool calls, continue to tools node
  return last.tool_calls && last.tool_calls.length > 0 ? 'tools' : END;
}

/**
 * Sofia AI Graph
 * 
 * A ReAct-style loop: agent → tools → agent (repeat as needed)
 */
export const sofiaGraph = new StateGraph(MessagesAnnotation)
  .addNode('agent', sofiaAgent)
  .addNode('tools', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue, ['tools', END])
  .addEdge('tools', 'agent')
  .compile();

/**
 * Execute Sofia graph with a user message
 * 
 * @param message - User message
 * @param context - Conversation context
 * @returns AI response
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function executeSofiaGraph(
  message: string,
  context: {
    sessionId: string;
    tenantId: string;
    propertyId?: string;
    guestId?: string;
  }
) {
  if (!UUID_RE.test(context.tenantId)) {
    return {
      response: "I'm having technical difficulties. Let me connect you with a team member who can help.",
      confidence: 0.5,
      metadata: {
        graphExecution: false,
        error: 'Invalid tenant context',
      },
    };
  }

  try {
    const result = await sofiaGraph.invoke({
      messages: [new HumanMessage(message)],
    });
    
    const lastMessage = result.messages[result.messages.length - 1];
    return {
      response: lastMessage.content.toString(),
      confidence: 0.85,
      metadata: {
        graphExecution: true,
        toolsUsed: result.messages.filter((m) => m instanceof AIMessage && m.tool_calls?.length).length > 0,
      },
    };
  } catch (error) {
    return {
      response: "I'm having technical difficulties. Let me connect you with a team member who can help.",
      confidence: 0.5,
      metadata: {
        graphExecution: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
