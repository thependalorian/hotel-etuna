/**
 * @fileoverview API route //api/sofia/voice/webhook
 * Location: /app/api/sofia/voice/webhook/route.ts
 */

/**
 * Voice webhook for Sofia (telephony STT/TTS bridge)
 *
 * Purpose: Authenticated POST endpoint for provider call events; delegates to `VoiceChannelAdapter`.
 * Location: /app/api/sofia/voice/webhook/route.ts
 *
 * Security: Set `VOICE_WEBHOOK_SECRET` and send matching `x-voice-webhook-secret` header (Vercel-compatible).
 */

import { NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';
import { VoiceChannelAdapter } from '@/lib/services/sofia/VoiceChannelAdapter';
import { entityId, entityIdNullableOptional } from '@/lib/validation/entity-ids';
import { securityLogger } from '@/lib/utils/security-logger';

const bodySchema = z.object({
  type: z.enum(['session.started', 'transcript.user', 'session.ended', 'handoff.requested']),
  tenantId: entityId(),
  propertyId: entityIdNullableOptional(),
  externalCallId: z.string().min(1).max(255),
  provider: z.string().max(64).optional(),
  text: z.string().max(8000).optional(),
  role: z.enum(['public', 'guest', 'admin']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const adapter = new VoiceChannelAdapter();

export async function POST(request: NextRequest) {
  const secret = process.env.VOICE_WEBHOOK_SECRET;
  if (!secret) {
    securityLogger.error('VOICE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ ok: false, error: 'Voice webhook not configured' }, { status: 503 });
  }

  const header = request.headers.get('x-voice-webhook-secret');
  if (header !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await adapter.handleEvent(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status ?? 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    securityLogger.error('[voice webhook]', e);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
