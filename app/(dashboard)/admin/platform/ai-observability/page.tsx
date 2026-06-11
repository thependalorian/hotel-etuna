/**
 * Platform Admin — AI observability (tokens, evals, confidence).
 * Location: app/(dashboard)/admin/platform/ai-observability/page.tsx
 */

import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import PlatformAiObservability from '@/components/features/admin/platform/PlatformAiObservability';

export default async function PlatformAiObservabilityPage() {
  const user = await getCurrentPlatformAdmin();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="etuna-page-title mb-2">AI observability</h1>
        <p className="text-base-content/70">
          Sofia token usage, provider fallbacks, and low-confidence samples for quality review.
        </p>
      </div>
      <PlatformAiObservability />
    </div>
  );
}
