import { db } from '@/lib/db';
import {
  aiConversations,
  aiMessages,
  properties,
  bookings,
  guests,
  type Guest,
} from '@/lib/db/schema';
import { and, eq, desc, asc, gte, inArray } from 'drizzle-orm';
import {
  ConversationContext,
  AIRequest,
  AIResponse,
  AIConversationChannel,
} from '@/lib/types/ai';
import { handleServiceError } from '@/lib/utils/errors';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { DataFilterService, UserRole } from './DataFilterService';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { SofiaEmailTemplateGenerator } from '@/lib/services/sofia/EmailTemplateGenerator';
import { CrmGraphMemoryService } from '@/lib/services/crm/CrmGraphMemoryService';
import { scheduleCrmMemoryAfterSofiaTurn } from '@/lib/services/crm/CrmMemoryBridge';
import { RAGSearchService, type RagSearchChunk } from '@/lib/services/documents/RAGSearchService';
import { LLMProviderRouter, type LlmChatMessage } from '@/lib/services/ai/LLMProviderRouter';
import { FolioService } from '@/lib/services/folio/FolioService';

export class SofiaConciergeService {
  private knowledgeBase: KnowledgeBaseService;
  private dataFilter: DataFilterService;
  private emailService: EmailService;
  private emailTemplateGenerator: SofiaEmailTemplateGenerator;
  private crmGraphMemory: CrmGraphMemoryService;
  private ragSearch: RAGSearchService;
  private llmRouter: LLMProviderRouter;

  constructor() {
    this.knowledgeBase = new KnowledgeBaseService();
    this.dataFilter = new DataFilterService();
    this.emailService = new EmailService();
    this.emailTemplateGenerator = new SofiaEmailTemplateGenerator();
    this.crmGraphMemory = new CrmGraphMemoryService();
    this.ragSearch = new RAGSearchService();
    this.llmRouter = new LLMProviderRouter();
  }

  async processMessage(request: AIRequest, userRole: UserRole = 'guest'): Promise<AIResponse> {
    try {
      const channel: AIConversationChannel = request.channel ?? 'WEB';
      const conversationHistory = await this.getConversationHistory(request.context.sessionId);
      
      // Extract email from message if present
      const emailFromMessage = this.extractEmail(request.message);
      
      // Get existing email from conversation metadata
      const existingEmail = await this.getEmailFromConversation(request.context.sessionId, request.context.tenantId);
      const guestEmail = emailFromMessage || existingEmail;
      
      // Update context with email if found
      if (guestEmail && !request.context.guestId) {
        // Try to find or create guest record
        const guest = await this.findOrCreateGuest(request.context.tenantId, guestEmail);
        if (guest) {
          request.context.guestId = guest.id;
        }
      }
      
      // Enhance context for email channel
      if (channel === 'EMAIL') {
        (request.context as ConversationContext & { emailChannel?: boolean }).emailChannel = true;
        if (request.emailData) {
          const emailData = request.emailData;
          (request.context as ConversationContext & { emailSubject?: string; emailFrom?: string }).emailSubject =
            emailData.subject;
          (request.context as ConversationContext & { emailFrom?: string }).emailFrom = emailData.from_email;
        }
      }
      
      const { contextString, ragChunks } = await this.buildContext(
        request.context,
        userRole,
        channel,
        request.message
      );
      const aiResponse = await this.callLlmProvider(request.message, contextString, conversationHistory);

      const rag: AIResponse['rag'] =
        ragChunks.length > 0
          ? {
              chunkCount: ragChunks.length,
              snippets: ragChunks.map((c) => c.text.slice(0, 280)),
              sources: ragChunks.map((c) => c.source).filter((s): s is string => Boolean(s)),
            }
          : undefined;

      // Detect if email sending is needed
      const emailIntent = this.detectEmailIntent(request.message, aiResponse.response);
      
      // Automatically send email if needed
      let emailSent = false;
      let emailConfirmation = '';
      if (emailIntent.needsEmail && guestEmail) {
        try {
          emailSent = await this.sendEmailAutomatically(
            request.context,
            emailIntent,
            guestEmail,
            conversationHistory,
            aiResponse
          );
          if (emailSent) {
            const ccMessage = request.context.propertyId 
              ? ". The property owner has been CC'd for their records" 
              : "";
            emailConfirmation = " I've sent the " + emailIntent.type + " to your email" + ccMessage + ".";
          }
        } catch (emailError) {
          console.error('Error sending email automatically:', emailError);
          // Don't fail the entire request if email sending fails
        }
      }
      
      const confidence = aiResponse.confidence || 0.8;
      const needsHumanEscalation = confidence < 0.55 || this.requiresPolicyEscalation(request.message, aiResponse.response);

      // Combine AI response with email confirmation if email was sent.
      let finalResponse = emailSent && emailConfirmation 
        ? aiResponse.response + emailConfirmation 
        : emailIntent.needsEmail && !guestEmail
        ? aiResponse.response + " What's your email address? I'll send it there."
        : aiResponse.response;

      if (needsHumanEscalation) {
        finalResponse += ' I am going to flag this for a team member so they can confirm the next step.';
      }
      
      await this.saveConversation(
        request.context,
        request.message,
        {
          ...aiResponse,
          response: finalResponse,
          ...(rag ? { rag } : {}),
        },
        guestEmail,
        channel
      );

      if (needsHumanEscalation) {
        await db
          .update(aiConversations)
          .set({ status: 'escalated', updatedAt: new Date() })
          .where(
            and(
              eq(aiConversations.sessionId, request.context.sessionId),
              eq(aiConversations.tenantId, request.context.tenantId)
            )
          );
      }

      scheduleCrmMemoryAfterSofiaTurn({
        tenantId: request.context.tenantId,
        guestId: request.context.guestId,
        propertyId: request.context.propertyId,
        sessionId: request.context.sessionId,
        userMessage: request.message,
        assistantMessage: finalResponse,
      });

      const intent = this.resolveIntent(request.message, finalResponse);
      const entities = this.extractEntities(finalResponse);
      const suggestions = await this.generateSuggestions(intent, entities, request.context);
      const actions = await this.determineActions(intent, entities, request.context);
      if (needsHumanEscalation) {
        actions.push({
          type: 'human_escalation_required',
          data: {
            reason: confidence < 0.55 ? 'low_confidence' : 'policy_bound',
            confidence,
            sessionId: request.context.sessionId,
            guestId: request.context.guestId ?? null,
          },
        });
      }

      return {
        response: finalResponse,
        confidence,
        intent: needsHumanEscalation ? 'human_escalation_required' : emailIntent.needsEmail ? 'email_requested' : intent,
        entities: {
          ...(aiResponse.entities ?? {}),
          ...entities,
          ...(guestEmail && { email: guestEmail }),
        },
        suggestions,
        actions,
        ...(rag ? { rag } : {}),
      };
    } catch (error) {
      return handleServiceError(error, 'Error processing AI message');
    }
  }

  private async getConversationHistory(sessionId: string) {
    try {
      const [conv] = await db
        .select({ id: aiConversations.id })
        .from(aiConversations)
        .where(eq(aiConversations.sessionId, sessionId))
        .limit(1);
      if (!conv) return [];

      const messages = await db
        .select({ senderType: aiMessages.senderType, content: aiMessages.content, createdAt: aiMessages.createdAt })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conv.id))
        .orderBy(asc(aiMessages.createdAt))
        .limit(20);

      return messages.map((msg) => ({
        role: (msg.senderType === 'ASSISTANT' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.createdAt ?? new Date(),
      }));
    } catch (error) {
      handleServiceError(error, 'Error fetching conversation history');
      return [];
    }
  }

  private requiresPolicyEscalation(userMessage: string, assistantResponse: string): boolean {
    const text = `${userMessage} ${assistantResponse}`.toLowerCase();
    return [
      'chargeback',
      'refund dispute',
      'legal',
      'lawsuit',
      'fraud',
      'data deletion',
      'consumer rights',
      'cyber incident',
      'breach',
    ].some((term) => text.includes(term));
  }

  private async buildContext(
    context: ConversationContext,
    userRole: UserRole = 'guest',
    channel: AIConversationChannel = 'WEB',
    userMessageForMemory?: string
  ): Promise<{ contextString: string; ragChunks: RagSearchChunk[] }> {
    let contextString = '';
    const ragChunksCollected: RagSearchChunk[] = [];

    try {
      // Add platform knowledge
      const platformKnowledge = this.knowledgeBase.getPlatformKnowledge();
      contextString += `Platform: ${platformKnowledge.name}\n`;
      contextString += `Description: ${platformKnowledge.description}\n`;
      contextString += `Currency: ${platformKnowledge.currency}\n`;
      contextString += `Location: ${platformKnowledge.location}\n\n`;

      if ((context as ConversationContext & { emailChannel?: boolean }).emailChannel) {
        contextString += `Channel: Email\n`;
        const cx = context as ConversationContext & { emailSubject?: string; emailFrom?: string };
        if (cx.emailSubject) {
          contextString += `Email Subject: ${cx.emailSubject}\n`;
        }
        if (cx.emailFrom) {
          contextString += `From: ${cx.emailFrom}\n`;
        }
        contextString += '\n';
      }

      if (channel === 'WHATSAPP') {
        contextString += `Channel: WhatsApp (guest messaging)\n\n`;
      }

      if (channel === 'PHONE') {
        contextString +=
          'Channel: Phone / voice reception. Keep answers concise for text-to-speech; confirm critical details aloud.\n\n';
      }

      if (context.propertyId) {
        const [property] = await db
          .select()
          .from(properties)
          .where(and(eq(properties.id, context.propertyId), eq(properties.tenantId, context.tenantId)))
          .limit(1);

        if (!property) {
          contextString += `Note: Property not found or access denied.\n\n`;
        } else {
          // Get comprehensive property knowledge
          const propertyKnowledge = await this.knowledgeBase.getPropertyKnowledge(
            context.propertyId,
            context.tenantId
          );

          if (propertyKnowledge) {
            contextString += this.knowledgeBase.formatPropertyKnowledge(propertyKnowledge);
            contextString += '\n';
          } else {
            // Fallback to basic property info
            contextString += `Property: ${property.name} (${property.type})\n`;
            contextString += `Description: ${property.description || 'No description available'}\n`;
            contextString += `Location: ${property.address}${property.city ? `, ${property.city}` : ''}\n\n`;
          }
        }
      }

      if (context.bookingId) {
        const [bookingRow] = await db
          .select({
            id: bookings.id,
            status: bookings.status,
            checkInDate: bookings.checkInDate,
            checkOutDate: bookings.checkOutDate,
            propertyName: properties.name,
          })
          .from(bookings)
          .innerJoin(properties, eq(bookings.propertyId, properties.id))
          .where(and(eq(bookings.id, context.bookingId), eq(bookings.tenantId, context.tenantId)))
          .limit(1);

        if (bookingRow) {
          contextString += `\nBooking: ${bookingRow.id}\n`;
          contextString += `Status: ${bookingRow.status}\n`;
          contextString += `Property: ${bookingRow.propertyName ?? 'Unknown'}\n`;
          if (bookingRow.checkInDate && bookingRow.checkOutDate) {
            contextString += `Dates: ${bookingRow.checkInDate} to ${bookingRow.checkOutDate}\n`;
          }

          if (bookingRow.status === 'checked_in') {
            try {
              const folioService = new FolioService();
              const folio = await folioService.getFolio(bookingRow.id);
              contextString += `Folio balance due: ${folio.currency} ${folio.balanceDue.toFixed(2)}\n`;
              contextString += `Folio closed: ${folio.folioClosedAt ? 'yes' : 'no'}\n`;
              if (folio.balanceDue > 0) {
                contextString +=
                  'Guest can settle folio or order room service at /guest/stays/' +
                  bookingRow.id +
                  '\n';
              }
            } catch (folioErr) {
              console.error('[SofiaConciergeService] folio context:', folioErr);
            }
          }
        }
      }

      // Guest context
      if (context.guestId) {
        const guestKnowledge = await this.knowledgeBase.getGuestKnowledge(
          context.guestId,
          context.tenantId
        );

        if (guestKnowledge) {
          contextString += '\n';
          contextString += this.knowledgeBase.formatGuestKnowledge(guestKnowledge);
        } else {
          const [guest] = await db
            .select({
              firstName: guests.firstName,
              lastName: guests.lastName,
              email: guests.email,
            })
            .from(guests)
            .where(and(eq(guests.id, context.guestId!), eq(guests.tenantId, context.tenantId)))
            .limit(1);

          if (guest) {
            contextString += `\nGuest: ${guest.firstName ?? ''} ${guest.lastName ?? ''}\n`;
            if (guest.email) {
              contextString += `Email: ${guest.email}\n`;
            }
          }
        }
      }

      if (context.guestId) {
        const crmAug = await this.crmGraphMemory.buildPromptAugmentation(
          context.tenantId,
          context.guestId,
          userMessageForMemory ?? ''
        );
        if (crmAug) {
          contextString += `\n${crmAug}\n`;
        }
      }

      const ragQuery = userMessageForMemory?.trim();
      if (ragQuery) {
        const chunks = await this.ragSearch.search(ragQuery, context.tenantId, {
          propertyId: context.propertyId,
          limit: 6,
        });
        ragChunksCollected.push(...chunks);
        if (chunks.length) {
          contextString += '\nProperty knowledge base (retrieved documents — use only for factual details; do not invent beyond this text):\n';
          for (const c of chunks) {
            contextString += `- ${c.text}${c.source ? ` [${c.source}]` : ''}\n`;
          }
        }
      }

      return { contextString, ragChunks: ragChunksCollected };
    } catch (error) {
      handleServiceError(error, 'Error building context');
      return { contextString: '', ragChunks: [] };
    }
  }

  private async callLlmProvider(
    message: string,
    context: string,
    history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  ): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildSofiaSystemPrompt(message, context, history);
      const messages: LlmChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content }) satisfies LlmChatMessage),
        { role: 'user', content: message },
      ];

      const result = await this.llmRouter.chat(messages, {
        maxTokens: 500,
        temperature: 0.7,
        fallback: () => this.generateFallbackResponse(message, context),
      });

      return {
        response: result.content,
        confidence: result.degraded ? 0.65 : 0.85,
        intent: this.extractIntent(result.content),
        entities: {
          ...this.extractEntities(result.content),
          aiProvider: result.providerId,
          aiModel: result.model,
          aiProviderFallback: result.degraded,
          aiAttemptedProviders: result.attemptedProviders,
        },
      };
    } catch (error) {
      console.error('[SofiaConciergeService] LLM provider router failed:', error);
      const response = this.generateFallbackResponse(message, context);
      return {
        response,
        confidence: 0.5,
        intent: this.extractIntent(response),
        entities: {
          aiProvider: 'local_fallback',
          aiProviderFallback: true,
        },
      };
    }
  }

  private buildSofiaSystemPrompt(
    message: string,
    context: string,
    history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  ): string {
    return `You are Sofia, the AI concierge for Hotel Etuna, a premium luxury guesthouse in Ongwediva, Namibia.
ABOUT HOTEL ETUNA:
- Hotel Etuna is located at 5544 Valley Street, Ongwediva, Namibia
- We offer five room tiers: Standard, Luxury, Family, Executive Suite, and Premier
- Room rates start from N$850 per night, with fair seasonal packages and direct booking support
- Check-in starts at 14:00 and check-out is by 11:00
- Key guest amenities include free WiFi, outdoor pool, free parking, on-site restaurant, and 24-hour security
- Support is available 24/7 via Sofia AI at concierge@hoteletuna.com
- We operate in Namibia and use NAD (Namibian Dollar) currency

YOUR ROLE:
- Help guests with hotel bookings, restaurant reservations, and general hospitality inquiries
- Provide accurate information about properties, rooms, amenities, menus, and services
- Assist with booking inquiries by asking for necessary details (dates, guests, preferences)
- Help with restaurant reservations by asking about date, time, party size, dietary restrictions
- Answer questions about property amenities, policies, and services
- Be helpful, friendly, and professional
- Respond in the language of the user (English, Oshiwambo, or Afrikaans)
- Use NAD currency and Namibian context in all responses
- If you don't know something, admit it and offer to connect with human staff
- Keep responses concise but comprehensive

CONTEXT INFORMATION:
${context}

GUIDELINES:
- Always use NAD currency (N$) when mentioning prices
- Reference specific property information from the context when available
- For booking inquiries, ask for: check-in date, check-out date, number of guests, room preferences
- For restaurant inquiries, ask for: date, time, number of guests, dietary restrictions, special requests
- Mention check-in/check-out times if available in property context
- Reference room types, amenities, and policies from the context
- If property has restaurant, mention menu categories and cuisine type
- Use guest preferences and booking history when available

Previous conversation:
${history.map((h) => `${h.role}: ${h.content}`).join('\n')}

Current user message: ${message}`;
  }

  private generateFallbackResponse(message: string, context: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('book') || lowerMessage.includes('reservation') || lowerMessage.includes('room')) {
      return "I'd be happy to help you with a booking! To get started, I'll need to know:\n• Your preferred check-in and check-out dates\n• Number of guests\n• Any specific room preferences\n\nWould you like to check availability for specific dates?";
    }

    if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('menu') || lowerMessage.includes('table')) {
      return "I can help you with restaurant reservations! Please let me know:\n• Preferred date and time\n• Number of guests\n• Any dietary restrictions or preferences\n\nWould you like to see our menu or make a reservation?";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return "Hello! I'm Sofia, your AI concierge. I can help you with:\n• Hotel room bookings\n• Restaurant reservations\n• Information about our facilities\n• General hospitality inquiries\n\nHow can I assist you today?";
    }

    if (lowerMessage.includes('amenities') || lowerMessage.includes('facilities') || lowerMessage.includes('wifi') || lowerMessage.includes('pool')) {
      return "I'd be happy to tell you about our amenities! Based on your property, we offer various facilities. For specific details about available amenities, could you let me know which property you're interested in or what specific facilities you're looking for?";
    }

    return "I'm here to help with your hospitality needs! I can assist with hotel bookings, restaurant reservations, and information about our facilities. Could you please let me know more specifically what you'd like help with?";
  }

  /**
   * Prefer explicit signals in the guest message; fall back to assistant wording
   * only when the guest message is vague (avoid topic drift from LLM replies).
   */
  private resolveIntent(userMessage: string, assistantResponse: string): string {
    const fromUser = this.extractIntent(userMessage);
    if (fromUser !== 'general_inquiry') {
      return fromUser;
    }

    const fromAssistant = this.extractIntent(assistantResponse);
    const assistantTopicDrift = ['pricing_inquiry', 'menu_inquiry', 'amenities_inquiry'] as const;
    if (assistantTopicDrift.includes(fromAssistant as (typeof assistantTopicDrift)[number])) {
      return 'general_inquiry';
    }
    return fromAssistant;
  }

  private extractIntent(text: string): string {
    const lower = text.toLowerCase();

    if (/\b(rate|rates|price|prices|cost|pricing)\b/.test(lower)) {
      return 'pricing_inquiry';
    }

    const wantsBooking =
      /\b(book|reserve|reservation)\b/.test(lower) ||
      lower.includes('table for') ||
      (lower.includes('table') && (lower.includes('dinner') || lower.includes('lunch')));

    if (wantsBooking) {
      if (lower.includes('room') || lower.includes('stay') || lower.includes('hotel room')) {
        return 'booking_room';
      }
      if (
        lower.includes('restaurant') ||
        lower.includes('table') ||
        lower.includes('dinner') ||
        lower.includes('lunch')
      ) {
        return 'booking_restaurant';
      }
      return 'booking_general';
    }

    if (lower.includes('amenities') || lower.includes('facilities')) {
      return 'amenities_inquiry';
    }

    if (lower.includes('menu') || lower.includes('food')) {
      return 'menu_inquiry';
    }

    if (lower.includes('cancellation') || lower.includes('policy')) {
      return 'booking_general';
    }

    if (lower.includes('help') || lower.includes('assist')) {
      return 'general_help';
    }

    return 'general_inquiry';
  }

  /**
   * Extract email address from message
   */
  private extractEmail(message: string): string | null {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = message.match(emailRegex);
    return match ? match[0] : null;
  }

  /**
   * Detect if user wants email sent
   */
  private detectEmailIntent(userMessage: string, aiResponse: string): {
    needsEmail: boolean;
    type: 'quotation' | 'confirmation' | 'details' | 'general';
  } {
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // Check for email-related keywords
    const emailKeywords = ['email', 'send to', 'send me', 'quotation', 'quote', 'quote me', 'details', 'information', 'confirm'];
    const hasEmailKeyword = emailKeywords.some(keyword => 
      lowerMessage.includes(keyword) || lowerResponse.includes(keyword)
    );

    if (!hasEmailKeyword) {
      return { needsEmail: false, type: 'general' };
    }

    // Determine email type
    if (lowerMessage.includes('quotation') || lowerMessage.includes('quote') || lowerMessage.includes('price')) {
      return { needsEmail: true, type: 'quotation' };
    }
    if (lowerMessage.includes('confirm') || lowerMessage.includes('booking')) {
      return { needsEmail: true, type: 'confirmation' };
    }
    if (lowerMessage.includes('details') || lowerMessage.includes('information')) {
      return { needsEmail: true, type: 'details' };
    }

    return { needsEmail: true, type: 'general' };
  }

  /**
   * Get email from conversation metadata
   */
  private async getEmailFromConversation(sessionId: string, tenantId: string): Promise<string | null> {
    try {
      const [conv] = await db
        .select({ id: aiConversations.id, guestId: aiConversations.guestId })
        .from(aiConversations)
        .where(and(eq(aiConversations.sessionId, sessionId), eq(aiConversations.tenantId, tenantId)))
        .limit(1);

      if (conv?.guestId) {
        const [g] = await db.select({ email: guests.email }).from(guests).where(eq(guests.id, conv.guestId)).limit(1);
        if (g?.email) return g.email;
      }

      if (!conv) return null;

      const messages = await db
        .select({ metadata: aiMessages.metadata })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conv.id))
        .orderBy(desc(aiMessages.createdAt))
        .limit(10);

      for (const message of messages) {
        const meta = message.metadata as Record<string, unknown> | null;
        if (meta && typeof meta === 'object' && 'guest_email' in meta) return meta.guest_email as string;
      }
      return null;
    } catch (error) {
      console.error('Error getting email from conversation:', error);
      return null;
    }
  }

  /**
   * Resolve guest by tenant + email, then insert with ON CONFLICT on global <code>email</code> (race-safe).
   */
  private async findOrCreateGuest(tenantId: string, email: string): Promise<Guest | null> {
    try {
      const [existing] = await db
        .select()
        .from(guests)
        .where(and(eq(guests.tenantId, tenantId), eq(guests.email, email)))
        .limit(1);
      if (existing) return existing;

      const [guest] = await db
        .insert(guests)
        .values({
          tenantId,
          email,
          isSignedUp: false,
        })
        .onConflictDoUpdate({
          target: guests.email,
          set: { updatedAt: new Date() },
        })
        .returning();

      if (guest) return guest;

      const [fallback] = await db.select().from(guests).where(eq(guests.email, email)).limit(1);
      return fallback ?? null;
    } catch (error) {
      console.error('Error finding or creating guest:', error);
      try {
        const [byEmail] = await db.select().from(guests).where(eq(guests.email, email)).limit(1);
        return byEmail ?? null;
      } catch {
        return null;
      }
    }
  }

  /**
   * Automatically send email based on intent
   */
  private async sendEmailAutomatically(
    context: ConversationContext,
    emailIntent: { needsEmail: boolean; type: string },
    guestEmail: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>,
    aiResponse: AIResponse
  ): Promise<boolean> {
    if (!emailIntent.needsEmail || !guestEmail) {
      return false;
    }

    try {
      // Generate email content based on type
      const emailContent = await this.generateEmailContent(
        emailIntent.type,
        context,
        conversationHistory,
        aiResponse
      );

      // Send email
      await this.emailService.sendEmail(context.tenantId, {
        to: guestEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        propertyId: context.propertyId,
        metadata: {
          intent: emailIntent.type,
          conversation_session_id: context.sessionId,
          sent_automatically: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Error sending email automatically:', error);
      return false;
    }
  }

  /**
   * Generate email content based on intent and conversation
   */
  private async generateEmailContent(
    emailType: string,
    context: ConversationContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>,
    aiResponse: AIResponse
  ): Promise<{ subject: string; html: string; text: string }> {
    // Get property name for personalization
    let propertyName = 'Hotel Etuna';
    if (context.propertyId) {
      try {
        const [property] = await db
          .select({ name: properties.name })
          .from(properties)
          .where(and(eq(properties.id, context.propertyId), eq(properties.tenantId, context.tenantId)))
          .limit(1);
        if (property) propertyName = property.name;
      } catch (error) {
        console.warn('Failed to fetch property name:', error);
      }
    }

    // Generate content based on type
    let subject = '';
    let body = '';

    switch (emailType) {
      case 'quotation':
        subject = `Quotation Request - ${propertyName}`;
        body = `Thank you for your interest in ${propertyName}!\n\n${aiResponse.response}\n\nIf you have any questions or would like to proceed with a booking, please don't hesitate to reach out. We look forward to hosting you!`;
        break;
      case 'confirmation':
        subject = `Booking Confirmation - ${propertyName}`;
        body = `Thank you for your booking with ${propertyName}!\n\n${aiResponse.response}\n\nWe look forward to welcoming you!`;
        break;
      case 'details':
        subject = `Information Request - ${propertyName}`;
        body = `Thank you for your inquiry about ${propertyName}!\n\n${aiResponse.response}\n\nIf you need any additional information, please feel free to contact us.`;
        break;
      default:
        subject = `Information from ${propertyName}`;
        body = `Thank you for contacting ${propertyName}!\n\n${aiResponse.response}\n\nWe're here to help with any questions you may have.`;
    }

    let recipientName: string | undefined;
    if (context.guestId) {
      try {
        const [guest] = await db
          .select({ firstName: guests.firstName, lastName: guests.lastName })
          .from(guests)
          .where(and(eq(guests.id, context.guestId), eq(guests.tenantId, context.tenantId)))
          .limit(1);
        if (guest) {
          recipientName = [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim() || undefined;
        }
      } catch {
        recipientName = undefined;
      }
    }

    const bodyHtml = `<p>${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

    const htmlContent = this.emailTemplateGenerator.generateHtmlTemplate({
      subject,
      body: bodyHtml,
      recipientName,
    });

    const textContent = this.emailTemplateGenerator.generateTextTemplate({
      subject,
      body,
      recipientName,
    });

    return {
      subject,
      html: htmlContent,
      text: textContent,
    };
  }

  private extractEntities(response: string): Record<string, unknown> {
    const entities: Record<string, unknown> = {};

    const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;
    const dates = response.match(datePattern);
    if (dates) {
      entities.dates = dates;
    }

    const numberPattern = /\b(\d+)\b/g;
    const numbers = response.match(numberPattern);
    if (numbers) {
      entities.numbers = numbers.map(Number);
    }

    const currencyPattern = /\b[N$]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\b/g;
    const amounts = response.match(currencyPattern);
    if (amounts) {
      entities.amounts = amounts;
    }

    return entities;
  }

  private async generateSuggestions(
    intent: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entities: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ConversationContext
  ): Promise<string[]> {
    const suggestions: string[] = [];

    switch (intent) {
      case 'booking_room':
        suggestions.push('Check room availability', 'View room types and prices', 'Make a booking');
        break;
      case 'booking_restaurant':
        suggestions.push('View menu', 'Check table availability', 'Make a reservation');
        break;
      case 'amenities_inquiry':
        suggestions.push('See all amenities', 'Check specific facilities', 'Get directions');
        break;
      case 'menu_inquiry':
        suggestions.push('View full menu', 'Check dietary options', 'See prices');
        break;
      case 'pricing_inquiry':
        suggestions.push('View room rates', 'Check restaurant prices', 'See special offers');
        break;
      default:
        suggestions.push('Make a booking', 'View amenities', 'Contact staff');
    }

    return suggestions;
  }

  private async determineActions(
    intent: string,
    entities: Record<string, unknown>,
    context: ConversationContext
  ): Promise<Array<{ type: string; data: Record<string, unknown> }>> {
    const actions: Array<{ type: string; data: Record<string, unknown> }> = [];

    switch (intent) {
      case 'booking_room':
        if (entities.dates && entities.numbers && Array.isArray(entities.numbers)) {
          actions.push({
            type: 'check_availability',
            data: {
              propertyId: context.propertyId,
              dates: entities.dates,
              guests: (entities.numbers as number[])[0] || 1,
            },
          });
        }
        break;

      case 'booking_restaurant':
        actions.push({
          type: 'show_menu',
          data: {
            propertyId: context.propertyId,
          },
        });
        break;

      case 'amenities_inquiry':
        actions.push({
          type: 'show_amenities',
          data: {
            propertyId: context.propertyId,
          },
        });
        break;
    }

    return actions;
  }

  private async saveConversation(
    context: ConversationContext,
    userMessage: string,
    aiResponse: AIResponse,
    guestEmail?: string | null,
    channel: AIConversationChannel = 'WEB'
  ): Promise<void> {
    try {
      let [conversation] = await db
        .select()
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.sessionId, context.sessionId),
            eq(aiConversations.tenantId, context.tenantId)
          )
        )
        .limit(1);

      if (!conversation) {
        const [created] = await db
          .insert(aiConversations)
          .values({
            sessionId: context.sessionId,
            tenantId: context.tenantId,
            guestId: context.guestId ?? null,
            propertyId: context.propertyId ?? null,
            channel,
            status: 'active',
          })
          .returning();
        conversation = created!;
      }

      const emailFromMessage = guestEmail ?? this.extractEmail(userMessage);
      const userMeta: Record<string, unknown> = {
        property_id: context.propertyId,
        booking_id: context.bookingId,
        ...(emailFromMessage && { guest_email: emailFromMessage }),
      };
      const assistantMeta: Record<string, unknown> = {
        confidence: aiResponse.confidence,
        intent: aiResponse.intent,
        entities: aiResponse.entities,
        property_id: context.propertyId,
        booking_id: context.bookingId,
        ...(emailFromMessage && { guest_email: emailFromMessage }),
        ...(aiResponse.rag ? { rag: aiResponse.rag } : {}),
      };

      await db.insert(aiMessages).values({
        conversationId: conversation.id,
        senderType: 'USER',
        content: userMessage,
        metadata: userMeta,
      });
      await db.insert(aiMessages).values({
        conversationId: conversation.id,
        senderType: 'ASSISTANT',
        content: aiResponse.response,
        metadata: assistantMeta,
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  async getConversationStats(tenantId: string, propertyId?: string) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const convConditions = [
        eq(aiConversations.tenantId, tenantId),
        ...(propertyId ? [eq(aiConversations.propertyId, propertyId)] : []),
      ];
      const convs = await db
        .select({ id: aiConversations.id })
        .from(aiConversations)
        .where(and(...convConditions, gte(aiConversations.createdAt, thirtyDaysAgo)));
      const convIds = convs.map((c) => c.id);
      if (convIds.length === 0) {
        return { totalConversations: 0, averageConfidence: 0 };
      }

      const assistantMessages = await db
        .select({ metadata: aiMessages.metadata })
        .from(aiMessages)
        .where(and(eq(aiMessages.senderType, 'ASSISTANT'), inArray(aiMessages.conversationId, convIds)));

      let totalConfidence = 0;
      let confidenceCount = 0;
      assistantMessages.forEach((msg) => {
        const meta = msg.metadata as Record<string, unknown> | null;
        if (meta && typeof meta.confidence === 'number') {
          totalConfidence += meta.confidence;
          confidenceCount++;
        }
      });

      const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

      return {
        totalConversations: convIds.length,
        avgConfidence,
        dailyStats: [], // Simplified for now
      };
    } catch (error) {
      handleServiceError(error, 'Error fetching conversation stats');
    }
  }
}

