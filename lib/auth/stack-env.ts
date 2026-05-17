/**
 * Stack Auth environment validation — skip SDK when keys are missing or placeholders.
 * Location: lib/auth/stack-env.ts
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PLACEHOLDER_SUBSTRINGS = [
  'YOUR_',
  'YOUR-',
  'your_',
  'your-',
  'REPLACE',
  'CHANGEME',
  'INSERT_',
  'TODO',
  'example',
  'placeholder',
];

function normalizeEnvValue(value: string | undefined): string {
  if (!value) return '';
  return value.trim().replace(/^['"]|['"]$/g, '').trim();
}

export function isStackEnvPlaceholder(value: string | undefined): boolean {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return true;
  if (/^<[^>]+>$/.test(normalized)) return true;
  const upper = normalized.toUpperCase();
  return PLACEHOLDER_SUBSTRINGS.some((token) => upper.includes(token));
}

export type StackAuthEnv = {
  projectId: string;
  publishableClientKey: string;
  secretServerKey: string;
};

export function readStackAuthEnv(): StackAuthEnv {
  return {
    projectId: normalizeEnvValue(process.env.NEXT_PUBLIC_STACK_PROJECT_ID),
    publishableClientKey: normalizeEnvValue(
      process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
    ),
    secretServerKey: normalizeEnvValue(process.env.STACK_SECRET_SERVER_KEY),
  };
}

/** Browser + StackProvider — requires a real publishable client key. */
export function isStackAuthClientConfigured(env: StackAuthEnv = readStackAuthEnv()): boolean {
  if (!UUID_REGEX.test(env.projectId)) return false;
  if (isStackEnvPlaceholder(env.publishableClientKey)) return false;
  return env.publishableClientKey.length >= 16;
}

/** Server / middleware — requires publishable + secret keys. */
export function isStackAuthServerConfigured(env: StackAuthEnv = readStackAuthEnv()): boolean {
  if (!isStackAuthClientConfigured(env)) return false;
  if (isStackEnvPlaceholder(env.secretServerKey)) return false;
  return env.secretServerKey.length >= 16;
}
