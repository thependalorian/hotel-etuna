/**
 * @fileoverview API route //api/admin/platform/support/tickets/[id]/linear
 * Location: /app/api/admin/platform/support/tickets/[id]/linear/route.ts
 */

/**
 * Legacy path — maps internal escalation response to linear_* field names.
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST as escalatePost } from '../escalate/route';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const res = await escalatePost(request, context);
  const json = (await res.json()) as {
    data?: {
      escalation_ref?: string;
      escalation_url?: string;
      alreadyLinked?: boolean;
      identifier?: string;
    };
    error?: string;
  };
  if (!res.ok) {
    return NextResponse.json(json, { status: res.status });
  }
  const d = json.data;
  return NextResponse.json({
    data: {
      ...d,
      linear_issue_id: d?.escalation_ref,
      linear_issue_url: d?.escalation_url,
    },
  });
}
