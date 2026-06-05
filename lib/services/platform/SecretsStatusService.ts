/**
 * Secrets / API key presence check — never exposes secret values.
 * Location: lib/services/platform/SecretsStatusService.ts
 */

export type SecretStatusRow = {
  key: string;
  category: string;
  required: boolean;
  configured: boolean;
  notes?: string;
};

const SECRET_DEFINITIONS: Array<Omit<SecretStatusRow, 'configured'>> = [
  { key: 'DATABASE_URL', category: 'Database', required: true, notes: 'Neon pooled connection' },
  { key: 'NEXTAUTH_SECRET', category: 'Auth', required: true },
  { key: 'DEEPSEEK_API_KEY', category: 'AI', required: true, notes: 'Sofia primary LLM' },
  { key: 'QDRANT_API_KEY', category: 'AI', required: false, notes: 'RAG when RAG_ENABLED=true' },
  { key: 'EMAIL_SMTP_PASS', category: 'Email', required: true },
  { key: 'ADUMO_JWT_SECRET', category: 'Payments', required: true },
  { key: 'CRON_SECRET', category: 'Ops', required: true },
  { key: 'ENCRYPTION_KEY', category: 'Security', required: true },
  { key: 'NEXT_PUBLIC_POSTHOG_KEY', category: 'Observability', required: false },
  { key: 'LINEAR_API_KEY', category: 'Deprecated', required: false, notes: 'Not used — internal escalation' },
];

function isConfigured(key: string): boolean {
  const v = process.env[key]?.trim();
  if (!v) return false;
  if (v.startsWith('your-') || v.includes('placeholder')) return false;
  return true;
}

export class SecretsStatusService {
  list(): SecretStatusRow[] {
    return SECRET_DEFINITIONS.map((def) => ({
      ...def,
      configured: isConfigured(def.key),
    }));
  }

  missingRequired(): string[] {
    return this.list()
      .filter((r) => r.required && !r.configured)
      .map((r) => r.key);
  }
}
