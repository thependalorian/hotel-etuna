/**
 * JWKS Configuration for Stack Auth
 * 
 * Purpose: Verify Stack Auth JWT tokens using JWKS
 * Location: /lib/auth/jwks.ts
 * 
 * Uses jose library for JWT verification with automatic JWKS caching
 */

import { createRemoteJWKSet } from 'jose';

const PROJECT_ID = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

if (!PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_STACK_PROJECT_ID is required for JWT verification');
}

// JWKS URL for Stack Auth
const jwksUrl = new URL(
  `https://api.stack-auth.com/api/v1/projects/${PROJECT_ID}/.well-known/jwks.json`
);

// Create remote JWKS set with automatic caching
// This handles key rotation and caching internally
export const jwks = createRemoteJWKSet(jwksUrl);
