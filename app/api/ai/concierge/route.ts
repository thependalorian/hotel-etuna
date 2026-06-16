/**
 * @fileoverview API route //api/ai/concierge
 * Location: /app/api/ai/concierge/route.ts
 */

/**
 * AI concierge API — canonical authenticated Sofia endpoint.
 * Location: /app/api/ai/concierge/route.ts
 */

export {
  handleAuthenticatedSofiaPost as POST,
  handleAuthenticatedSofiaGet as GET,
} from '@/lib/services/ai/sofia-api-handlers';
