/**
 * Bridges Sofia conversations into graph memory + optional Mem0
 *
 * Purpose: Fire-and-forget after each saved turn; no user latency impact.
 * Location: lib/services/crm/CrmMemoryBridge.ts
 */

import { mem0AddTurn, mem0UserId, isMem0Configured } from '@/lib/integrations/mem0';
import { CrmGraphMemoryService } from '@/lib/services/crm/CrmGraphMemoryService';

const graph = new CrmGraphMemoryService();

export function scheduleCrmMemoryAfterSofiaTurn(input: {
  tenantId: string;
  guestId: string | undefined;
  propertyId: string | undefined;
  sessionId: string;
  userMessage: string;
  assistantMessage: string;
}): void {
  const { tenantId, guestId, propertyId, sessionId, userMessage, assistantMessage } = input;
  if (!guestId) return;

  void (async () => {
    try {
      if (propertyId) {
        await graph.ensureEdge({
          tenantId,
          srcType: 'guest',
          srcId: guestId,
          dstType: 'property',
          dstId: propertyId,
          relationType: 'engaged_with',
          metadata: { sessionId },
        });
      }

      if (isMem0Configured()) {
        await mem0AddTurn(
          mem0UserId(tenantId, guestId),
          userMessage.slice(0, 4000),
          assistantMessage.slice(0, 4000),
          { tenantId, guestId, sessionId }
        );
      }
    } catch (e) {
      console.error('[CrmMemoryBridge]', e);
    }
  })();
}
