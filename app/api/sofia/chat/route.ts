/**
 * Sofia chat API — full concierge pipeline (alias of /api/ai/concierge).
 * Location: /app/api/sofia/chat/route.ts
 */

export {
  handleAuthenticatedSofiaPost as POST,
  handleAuthenticatedSofiaGet as GET,
} from '@/lib/services/ai/sofia-api-handlers';
