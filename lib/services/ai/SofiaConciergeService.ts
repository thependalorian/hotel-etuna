/**
 * @fileoverview SofiaConciergeService — Sofia AI concierge orchestration.
 *
 * Canonical Sofia service: conversation persistence (`ai_conversations`,
 * `ai_messages`), RAG search, intent resolution, restaurant reservation flow,
 * CRM memory bridging, and role-based data filtering.
 * Location: lib/services/ai/SofiaConciergeService.ts
 *
 * Intent/helpers: lib/services/sofia/sofia-intent.ts
 * Persistence: lib/services/sofia/sofia-conversation-store.ts
 * Email automation: lib/services/sofia/sofia-email-automation.ts
 */
import { db } from '@/lib/db';
import { properties, bookings, guests } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
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
import { SofiaConversationStore } from '@/lib/services/sofia/sofia-conversation-store';
import { SofiaEmailAutomation } from '@/lib/services/sofia/sofia-email-automation';
import { CrmGraphMemoryService } from '@/lib/services/crm/CrmGraphMemoryService';
import { scheduleCrmMemoryAfterSofiaTurn } from '@/lib/services/crm/CrmMemoryBridge';
import { SofiaConversationContextService } from '@/lib/services/sofia/SofiaConversationContextService';
import {
  RestaurantReservationFlowService,
  type RestaurantReservationFlowStateWithOtp,
} from '@/lib/services/sofia/RestaurantReservationFlowService';
import { RAGSearchService, type RagSearchChunk } from '@/lib/services/documents/RAGSearchService';
import { LLMProviderRouter, type LlmChatMessage } from '@/lib/services/ai/LLMProviderRouter';
import { FolioService } from '@/lib/services/folio/FolioService';
import { securityLogger } from '@/lib/utils/security-logger';
import {
  isAccommodationBookingKind,
  isFacilityBookingKind,
  bookingKindLabel,
} from '@/lib/bookings/booking-kind';
import {
  buildSofiaSystemPrompt,
  detectEmailIntent,
  extractEmail,
  extractEntities,
  extractIntent,
  generateFallbackResponse,
  generateSuggestions,
  requiresPolicyEscalation,
  resolveIntent,
} from '@/lib/services/sofia/sofia-intent';

export class SofiaConciergeService {
  private knowledgeBase: KnowledgeBaseService;
  private dataFilter: DataFilterService;
  private emailService: EmailService;
  private conversationStore: SofiaConversationStore;
  private emailAutomation: SofiaEmailAutomation;
  private crmGraphMemory: CrmGraphMemoryService;
  private ragSearch: RAGSearchService;
  private llmRouter: LLMProviderRouter;
  private conversationContext: SofiaConversationContextService;
  private restaurantFlow: RestaurantReservationFlowService;

  constructor() {
    this.knowledgeBase = new KnowledgeBaseService();
    this.dataFilter = new DataFilterService();
    this.emailService = new EmailService();
    this.conversationStore = new SofiaConversationStore();
    this.emailAutomation = new SofiaEmailAutomation();
    this.crmGraphMemory = new CrmGraphMemoryService();
    this.ragSearch = new RAGSearchService();
    this.llmRouter = new LLMProviderRouter();
    this.conversationContext = new SofiaConversationContextService();
    this.restaurantFlow = new RestaurantReservationFlowService();
  }

  /** Delegates to conversation store — used by tests and admin tooling. */
  async getConversationHistory(sessionId: string, tenantId: string) {
    return this.conversationStore.getConversationHistory(sessionId, tenantId);
  }

  async processMessage(request: AIRequest, userRole: UserRole = 'guest'): Promise<AIResponse> {
    try {
      const channel: AIConversationChannel = request.channel ?? 'WEB';
      const conversationHistory = await this.conversationStore.getConversationHistory(
        request.context.sessionId,
        request.context.tenantId
      );

      const emailFromMessage = extractEmail(request.message);
      const existingEmail = await this.conversationStore.getEmailFromConversation(
        request.context.sessionId,
        request.context.tenantId,
      );
      const guestEmail = emailFromMessage || existingEmail;

      if (guestEmail && !request.context.guestId) {
        const guest = await this.conversationStore.findOrCreateGuest(
          request.context.tenantId,
          guestEmail,
        );
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
      const emailIntent = detectEmailIntent(request.message, aiResponse.response);
      
      // Automatically send email if needed
      let emailSent = false;
      let emailConfirmation = '';
      if (emailIntent.needsEmail && guestEmail) {
        try {
          emailSent = await this.emailAutomation.sendEmailAutomatically(
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
          securityLogger.error('Error sending email automatically:', emailError);
          // Don't fail the entire request if email sending fails
        }
      }
      
      const confidence = aiResponse.confidence || 0.8;
      const needsHumanEscalation = confidence < 0.55 || requiresPolicyEscalation(request.message, aiResponse.response);

      // Combine AI response with email confirmation if email was sent.
      let finalResponse = emailSent && emailConfirmation 
        ? aiResponse.response + emailConfirmation 
        : emailIntent.needsEmail && !guestEmail
        ? aiResponse.response + " What's your email address? I'll send it there."
        : aiResponse.response;

      if (needsHumanEscalation) {
        finalResponse += ' I am going to flag this for a team member so they can confirm the next step.';
      }
      
      await this.conversationStore.saveConversation(
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
        await this.conversationStore.markConversationEscalated(
          request.context.sessionId,
          request.context.tenantId,
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

      const intent = resolveIntent(request.message, finalResponse);
      const flowState = await this.restaurantFlow.syncAfterTurn({
        tenantId: request.context.tenantId,
        sessionId: request.context.sessionId,
        guestId: request.context.guestId,
        propertyId: request.context.propertyId,
        stayBookingId: request.context.bookingId,
        userMessage: request.message,
        intent,
        guestEmail,
      });
      if (flowState?.bookingCode && guestEmail) {
        const otp = (flowState as RestaurantReservationFlowStateWithOtp)._otpPlaintextForEmail;
        const payPath = `/restaurant/reservation/pay?code=${encodeURIComponent(flowState.bookingCode)}`;
        try {
          await this.emailService.sendEmail(request.context.tenantId, {
            to: guestEmail,
            subject: `Restaurant reservation ${flowState.bookingCode}`,
            htmlContent: `<p>Your table reservation is held pending deposit (pay securely via Adumo — card details stay on Adumo&apos;s page).</p>
<p>Booking code: <strong>${flowState.bookingCode}</strong></p>
<p>Party: ${flowState.partySize} · ${flowState.reservationDate} at ${flowState.reservationTime}</p>
<p>Deposit: ${flowState.currency ?? 'NAD'} ${((flowState.depositCents ?? 0) / 100).toFixed(2)}</p>
<p><a href="${payPath}">Pay deposit with card (Adumo)</a></p>
${otp ? `<p>Cancellation OTP: <strong>${otp}</strong> (valid 24h)</p>` : ''}`,
            textContent: `Booking ${flowState.bookingCode}. Deposit ${flowState.currency ?? 'NAD'} ${((flowState.depositCents ?? 0) / 100).toFixed(2)}. Pay at ${payPath}.${otp ? ` Cancel OTP: ${otp}` : ''}`,
          });
        } catch (emailErr) {
          securityLogger.error('[SofiaConciergeService] restaurant reservation email:', emailErr);
        }
      }
      const entities = extractEntities(finalResponse);
      const suggestions = await generateSuggestions(intent);
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
            bookingKind: bookings.bookingKind,
            checkInDate: bookings.checkInDate,
            checkOutDate: bookings.checkOutDate,
            propertyName: properties.name,
          })
          .from(bookings)
          .innerJoin(properties, eq(bookings.propertyId, properties.id))
          .where(and(eq(bookings.id, context.bookingId), eq(bookings.tenantId, context.tenantId)))
          .limit(1);

        if (bookingRow) {
          const kind = bookingRow.bookingKind;
          contextString += `\nBooking: ${bookingRow.id}\n`;
          contextString += `Kind: ${bookingKindLabel(kind)}\n`;
          contextString += `Status: ${bookingRow.status}\n`;
          contextString += `Property: ${bookingRow.propertyName ?? 'Unknown'}\n`;
          if (bookingRow.checkInDate && bookingRow.checkOutDate) {
            contextString += `Dates: ${bookingRow.checkInDate} to ${bookingRow.checkOutDate}\n`;
          }

          if (isFacilityBookingKind(kind)) {
            contextString +=
              kind === 'conference'
                ? 'Facility booking — direct guests to /facilities/conference for changes or new sessions.\n'
                : 'Facility booking — direct guests to /facilities/campsite for changes or new hires.\n';
          } else if (
            isAccommodationBookingKind(kind) &&
            bookingRow.status === 'checked_in'
          ) {
            try {
              const folioService = new FolioService();
              const folio = await folioService.getFolio(bookingRow.id);
              contextString += `Folio balance due: ${folio.currency} ${folio.balanceDue.toFixed(2)}\n`;
              contextString += `Folio closed: ${folio.folioClosedAt ? 'yes' : 'no'}\n`;
              try {
                const { documentGenerationService } = await import(
                  '@/lib/services/documents/DocumentGenerationService'
                );
                const docs = await documentGenerationService.listForBooking(
                  context.tenantId,
                  bookingRow.id
                );
                if (docs.length > 0) {
                  contextString += 'Recent financial PDFs:\n';
                  for (const d of docs.slice(0, 4)) {
                    contextString += `- ${d.documentType}: ${d.referenceNumber}\n`;
                  }
                }
              } catch {
                /* non-fatal */
              }
              if (folio.balanceDue > 0) {
                contextString +=
                  'Guest can settle folio or order room service at /guest/stays/' +
                  bookingRow.id +
                  '\n';
              }
            } catch (folioErr) {
              securityLogger.error('[SofiaConciergeService] folio context:', folioErr);
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

      const flowCtx = await this.conversationContext.getContext(context.tenantId, context.sessionId);
      const flowPrompt = this.restaurantFlow.formatContextForPrompt(flowCtx);
      if (flowPrompt) {
        contextString += `\n${flowPrompt}\n`;
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
      const systemPrompt = buildSofiaSystemPrompt(message, context, history);
      const messages: LlmChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content }) satisfies LlmChatMessage),
        { role: 'user', content: message },
      ];

      const result = await this.llmRouter.chat(messages, {
        maxTokens: 500,
        temperature: 0.7,
        fallback: () => generateFallbackResponse(message, context),
      });

      return {
        response: result.content,
        confidence: result.degraded ? 0.65 : 0.85,
        intent: extractIntent(result.content),
        entities: {
          ...extractEntities(result.content),
          aiProvider: result.providerId,
          aiModel: result.model,
          aiProviderFallback: result.degraded,
          aiAttemptedProviders: result.attemptedProviders,
          ...(result.usage
            ? {
                tokenUsage: result.usage,
              }
            : {}),
        },
      };
    } catch (error) {
      securityLogger.error('[SofiaConciergeService] LLM provider router failed:', error);
      const response = generateFallbackResponse(message, context);
      return {
        response,
        confidence: 0.5,
        intent: extractIntent(response),
        entities: {
          aiProvider: 'local_fallback',
          aiProviderFallback: true,
        },
      };
    }
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
        if (entities.numbers && Array.isArray(entities.numbers)) {
          actions.push({
            type: 'restaurant_reservation_slots',
            data: {
              sessionId: context.sessionId,
              partySize: (entities.numbers as number[])[0],
              dates: entities.dates,
            },
          });
        }
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

  async getConversationStats(tenantId: string, propertyId?: string) {
    return this.conversationStore.getConversationStats(tenantId, propertyId);
  }
}

