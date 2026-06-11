/**
 * Platform Admin — secrets / API key presence (no values shown).
 * Location: app/(dashboard)/admin/platform/secrets/page.tsx
 */

import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import PlatformSecretsStatus from '@/components/features/admin/platform/PlatformSecretsStatus';

export default async function PlatformSecretsPage() {
  const user = await getCurrentPlatformAdmin();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="etuna-page-title mb-2">Secrets &amp; API keys</h1>
        <p className="text-base-content/70">
          Environment configuration status for production. Values are never displayed here.
        </p>
      </div>
      <PlatformSecretsStatus />
    </div>
  );
}
