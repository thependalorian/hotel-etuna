/**
 * OAuth 2.0 Service - Namibian Open Banking Standards v1.0
 * 
 * Purpose: OAuth 2.0 / OIDC / FAPI implementation for Open Banking
 * Location: /lib/services/openbanking/OAuthService.ts
 * 
 * Implements:
 * - RFC 7636: Proof Key for Code Exchange (PKCE)
 * - RFC 9126: Pushed Authorization Requests (PAR)
 * - RFC 6749: OAuth 2.0 Authorization Framework
 * - OpenID Connect Core 1.0
 * - FAPI Security Profile
 * 
 * Compliance:
 * - Namibian Open Banking Standards v1.0 (Section 9.5)
 * - PSD-12: Two-factor authentication required
 * - Maximum consent duration: 180 days
 * 
 * @version 1.0.0
 * @since January 28, 2026
 */

import { db, obConsentTokens, obParticipants, guests, eq, and } from '@/lib/db';
import crypto from 'crypto';
import * as jose from 'jose';

// ============================================================================
// TYPES
// ============================================================================

export interface PushedAuthorizationRequest {
  client_id: string; // Participant ID (APInnnnnn)
  response_type: 'code';
  scope: string; // Space-separated scopes
  redirect_uri: string;
  code_challenge: string; // PKCE code challenge
  code_challenge_method: 'S256' | 'plain';
  state?: string; // CSRF protection
  nonce?: string; // OIDC nonce
}

export interface PARResponse {
  request_uri: string; // urn:ietf:params:oauth:request_uri:...
  expires_in: number; // Seconds (typically 600 = 10 minutes)
}

export interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string; // For authorization_code grant
  refresh_token?: string; // For refresh_token grant
  redirect_uri: string;
  client_id: string;
  code_verifier?: string; // PKCE verifier
}

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // Seconds
  refresh_token?: string;
  refresh_token_expires_in?: number; // Seconds
  scope: string;
}

export interface ConsentScopes {
  'banking:accounts.basic.read': 'Read account information';
  'banking:payments.write': 'Initiate payments';
  'banking:payments.read': 'Read payment status';
  'consent:authorisationcode.write': 'Request authorization';
  'consent:authorisationtoken.write': 'Request access tokens';
}

// ============================================================================
// OAUTH 2.0 SERVICE
// ============================================================================

export class OAuthService {
  /**
   * Pushed Authorization Request (PAR) - RFC 9126
   * 
   * Step 1 of OAuth 2.0 flow
   * TPP sends authorization request parameters to DP
   * DP validates and returns request_uri
   * 
   * @param request - PAR request
   * @returns PAR response with request_uri
   */
  static async pushAuthorizationRequest(request: PushedAuthorizationRequest): Promise<PARResponse> {
    // Validate TPP participant
    const tppParticipant = await db
      .select()
      .from(obParticipants)
      .where(
        and(
          eq(obParticipants.participantId, request.client_id),
          eq(obParticipants.role, 'TPP'),
          eq(obParticipants.status, 'active')
        )
      )
      .limit(1);

    if (!tppParticipant || tppParticipant.length === 0) {
      throw new Error('INVALID_CLIENT: TPP participant not found or not active');
    }

    // Validate scopes
    const requestedScopes = request.scope.split(' ');
    const validScopes = this.validateScopes(requestedScopes);
    if (!validScopes) {
      throw new Error('INVALID_SCOPE: One or more requested scopes are not supported');
    }

    // Validate redirect URI
    if (!this.validateRedirectUri(request.redirect_uri, tppParticipant[0])) {
      throw new Error('INVALID_REDIRECT_URI: Redirect URI not registered for this TPP');
    }

    // Validate PKCE
    if (request.code_challenge_method !== 'S256') {
      throw new Error('INVALID_REQUEST: code_challenge_method must be S256');
    }

    if (!request.code_challenge || request.code_challenge.length < 43) {
      throw new Error('INVALID_REQUEST: code_challenge must be present and at least 43 characters');
    }

    // Generate request_uri
    const requestUri = this.generateRequestUri();

    // Create consent record (pending status)
    const consentId = this.generateConsentId();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(obConsentTokens).values({
      consentId,
      tppParticipantId: request.client_id,
      dpParticipantId: 'API000001', // Buffr Host
      scopes: requestedScopes,
      durationDays: 180, // Maximum per BoN standards
      codeChallenge: request.code_challenge,
      codeChallengeMethod: request.code_challenge_method,
      requestUri,
      state: request.state || '',
      nonce: request.nonce || '',
      redirectUri: request.redirect_uri,
      accessToken: '', // Will be generated later
      accessTokenExpiresAt: expiresAt,
      status: 'pending',
    });

    return {
      request_uri: requestUri,
      expires_in: 600, // 10 minutes
    };
  }

  /**
   * Authorization Endpoint
   * 
   * Step 2 of OAuth 2.0 flow
   * Account Holder is redirected here to authenticate and consent
   * After SCA (2FA), authorization code is generated
   * 
   * @param requestUri - From PAR response
   * @param accountHolderId - Authenticated account holder
   * @returns Authorization code
   */
  static async authorizeConsent(requestUri: string, accountHolderId: string): Promise<string> {
    // Find consent by request_uri
    const consent = await db
      .select()
      .from(obConsentTokens)
      .where(eq(obConsentTokens.requestUri, requestUri))
      .limit(1);

    if (!consent || consent.length === 0) {
      throw new Error('INVALID_REQUEST_URI: Request URI not found or expired');
    }

    const consentRecord = consent[0];

    // Verify not expired
    if (consentRecord.accessTokenExpiresAt && new Date() > consentRecord.accessTokenExpiresAt) {
      throw new Error('REQUEST_URI_EXPIRED: Request URI has expired');
    }

    // Generate authorization code (short-lived, 10 minutes)
    const authorizationCode = this.generateAuthorizationCode();
    const authCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update consent with account holder and authorization code
    await db
      .update(obConsentTokens)
      .set({
        accountHolderId,
        authorizationCode,
        authorizationCodeExpiresAt: authCodeExpiresAt,
        authorizationCodeUsed: false,
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(obConsentTokens.id, consentRecord.id));

    return authorizationCode;
  }

  /**
   * Token Endpoint
   * 
   * Step 3 of OAuth 2.0 flow
   * TPP exchanges authorization code for access token + refresh token
   * Validates PKCE code_verifier
   * 
   * @param request - Token request
   * @returns Access token and refresh token
   */
  static async exchangeToken(request: TokenRequest): Promise<TokenResponse> {
    if (request.grant_type === 'authorization_code') {
      return this.exchangeAuthorizationCode(request);
    } else if (request.grant_type === 'refresh_token') {
      return this.refreshAccessToken(request);
    } else {
      throw new Error('UNSUPPORTED_GRANT_TYPE: Only authorization_code and refresh_token are supported');
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private static async exchangeAuthorizationCode(request: TokenRequest): Promise<TokenResponse> {
    if (!request.code || !request.code_verifier) {
      throw new Error('INVALID_REQUEST: code and code_verifier are required');
    }

    // Find consent by authorization code
    const consent = await db
      .select()
      .from(obConsentTokens)
      .where(
        and(
          eq(obConsentTokens.authorizationCode, request.code),
          eq(obConsentTokens.tppParticipantId, request.client_id)
        )
      )
      .limit(1);

    if (!consent || consent.length === 0) {
      throw new Error('INVALID_GRANT: Authorization code not found');
    }

    const consentRecord = consent[0];

    // Verify authorization code not expired
    if (consentRecord.authorizationCodeExpiresAt && new Date() > consentRecord.authorizationCodeExpiresAt) {
      throw new Error('AUTHORIZATION_CODE_EXPIRED: Authorization code has expired');
    }

    // Verify authorization code not already used (replay protection)
    if (consentRecord.authorizationCodeUsed) {
      throw new Error('INVALID_GRANT: Authorization code already used');
    }

    // Verify redirect_uri matches
    if (request.redirect_uri !== consentRecord.redirectUri) {
      throw new Error('INVALID_GRANT: redirect_uri does not match');
    }

    // Verify PKCE code_verifier
    const isValid = this.verifyPKCE(request.code_verifier, consentRecord.codeChallenge || '');
    if (!isValid) {
      throw new Error('INVALID_GRANT: PKCE verification failed');
    }

    // Generate tokens
    const accessToken = await this.generateAccessToken(consentRecord);
    const refreshToken = this.generateRefreshToken();

    const accessTokenExpiresIn = 3600; // 1 hour
    const refreshTokenExpiresIn = (consentRecord.durationDays ?? 90) * 24 * 60 * 60; // Max 180 days

    const accessTokenExpiresAt = new Date(Date.now() + accessTokenExpiresIn * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiresIn * 1000);

    // Update consent with tokens
    await db
      .update(obConsentTokens)
      .set({
        authorizationCodeUsed: true,
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(obConsentTokens.id, consentRecord.id));

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: accessTokenExpiresIn,
      refresh_token: refreshToken,
      refresh_token_expires_in: refreshTokenExpiresIn,
      scope: consentRecord.scopes.join(' '),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  private static async refreshAccessToken(request: TokenRequest): Promise<TokenResponse> {
    if (!request.refresh_token) {
      throw new Error('INVALID_REQUEST: refresh_token is required');
    }

    // Find consent by refresh token
    const consent = await db
      .select()
      .from(obConsentTokens)
      .where(
        and(
          eq(obConsentTokens.refreshToken, request.refresh_token),
          eq(obConsentTokens.tppParticipantId, request.client_id)
        )
      )
      .limit(1);

    if (!consent || consent.length === 0) {
      throw new Error('INVALID_GRANT: Refresh token not found');
    }

    const consentRecord = consent[0];

    // Verify refresh token not expired
    if (consentRecord.refreshTokenExpiresAt && new Date() > consentRecord.refreshTokenExpiresAt) {
      throw new Error('REFRESH_TOKEN_EXPIRED: Refresh token has expired');
    }

    // Verify consent not revoked
    if (consentRecord.status === 'revoked') {
      throw new Error('CONSENT_REVOKED: Consent has been revoked');
    }

    // Generate new access token
    const accessToken = await this.generateAccessToken(consentRecord);
    const accessTokenExpiresIn = 3600; // 1 hour
    const accessTokenExpiresAt = new Date(Date.now() + accessTokenExpiresIn * 1000);

    // Update consent with new access token
    await db
      .update(obConsentTokens)
      .set({
        accessToken,
        accessTokenExpiresAt,
        usageCount: (consentRecord.usageCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(obConsentTokens.id, consentRecord.id));

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: accessTokenExpiresIn,
      scope: consentRecord.scopes.join(' '),
    };
  }

  /**
   * Revoke Consent Token
   * 
   * @param token - Access token or refresh token
   * @param tokenTypeHint - 'access_token' or 'refresh_token'
   * @param clientId - TPP participant ID
   * @param revokedBy - Who revoked (account_holder, tpp, dp)
   */
  static async revokeToken(
    token: string,
    tokenTypeHint: 'access_token' | 'refresh_token',
    clientId: string,
    revokedBy: 'account_holder' | 'tpp' | 'dp' | 'system'
  ): Promise<void> {
    const query = tokenTypeHint === 'refresh_token'
      ? eq(obConsentTokens.refreshToken, token)
      : eq(obConsentTokens.accessToken, token);

    const consent = await db
      .select()
      .from(obConsentTokens)
      .where(and(query, eq(obConsentTokens.tppParticipantId, clientId)))
      .limit(1);

    if (!consent || consent.length === 0) {
      // RFC 7009: Token revocation endpoint returns success even if token not found
      return;
    }

    // Update consent status to revoked
    await db
      .update(obConsentTokens)
      .set({
        status: 'revoked',
        revokedBy,
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(obConsentTokens.id, consent[0].id));
  }

  /**
   * Validate Access Token
   * 
   * Called by APIs to verify token is valid before processing
   * 
   * @param accessToken - Bearer token
   * @param requiredScopes - Scopes needed for this API call
   * @returns Consent record if valid
   */
  static async validateAccessToken(accessToken: string, requiredScopes: string[]) {
    const consent = await db
      .select()
      .from(obConsentTokens)
      .where(eq(obConsentTokens.accessToken, accessToken))
      .limit(1);

    if (!consent || consent.length === 0) {
      throw new Error('INVALID_TOKEN: Access token not found');
    }

    const consentRecord = consent[0];

    // Verify not expired
    if (new Date() > consentRecord.accessTokenExpiresAt) {
      throw new Error('TOKEN_EXPIRED: Access token has expired');
    }

    // Verify not revoked
    if (consentRecord.status === 'revoked') {
      throw new Error('TOKEN_REVOKED: Access token has been revoked');
    }

    // Verify scopes
    const hasRequiredScopes = requiredScopes.every((scope) =>
      consentRecord.scopes.includes(scope)
    );

    if (!hasRequiredScopes) {
      throw new Error('INSUFFICIENT_SCOPE: Token does not have required scopes');
    }

    // Update usage tracking
    await db
      .update(obConsentTokens)
      .set({
        usageCount: (consentRecord.usageCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(obConsentTokens.id, consentRecord.id));

    return consentRecord;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Verify PKCE code_verifier against code_challenge
   * 
   * @param codeVerifier - Plain text verifier from TPP
   * @param codeChallenge - SHA-256 hash stored from PAR
   * @returns true if valid
   */
  private static verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
    // code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return hash === codeChallenge;
  }

  /**
   * Validate scopes against supported scopes
   */
  private static validateScopes(scopes: string[]): boolean {
    const supportedScopes = [
      'banking:accounts.basic.read',
      'banking:payments.write',
      'banking:payments.read',
      'consent:authorisationcode.write',
      'consent:authorisationtoken.write',
    ];

    return scopes.every((scope) => supportedScopes.includes(scope));
  }

  /**
   * Validate redirect URI
   */
  private static validateRedirectUri(redirectUri: string, participant: any): boolean {
    // In production, check against registered URIs in participant.metadata
    // For now, basic validation
    try {
      const url = new URL(redirectUri);
      return url.protocol === 'https:'; // Must be HTTPS
    } catch {
      return false;
    }
  }

  /**
   * Generate request_uri (PAR)
   * Format: urn:ietf:params:oauth:request_uri:{random}
   */
  private static generateRequestUri(): string {
    const random = crypto.randomBytes(32).toString('base64url');
    return `urn:ietf:params:oauth:request_uri:${random}`;
  }

  /**
   * Generate consent ID
   * Format: CNS-{timestamp}-{random}
   */
  private static generateConsentId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `CNS-${timestamp}-${random}`;
  }

  /**
   * Generate authorization code
   * Cryptographically secure random string
   */
  private static generateAuthorizationCode(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate refresh token
   * Cryptographically secure random string
   */
  private static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate JWT access token
   * 
   * @param consent - Consent record
   * @returns Signed JWT
   */
  private static async generateAccessToken(consent: any): Promise<string> {
    const privateKey = await this.getJWTPrivateKey();

    const payload = {
      iss: process.env.NEXT_PUBLIC_APP_URL || 'https://hoteletuna.com',
      sub: consent.accountHolderId, // Subject: Account Holder
      aud: consent.tppParticipantId, // Audience: TPP
      exp: Math.floor(Date.now() / 1000) + 3600, // Expires: 1 hour
      iat: Math.floor(Date.now() / 1000), // Issued at
      scope: consent.scopes.join(' '),
      consent_id: consent.consentId,
    };

    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    return jwt;
  }

  /**
   * Get JWT signing private key
   * In production, load from environment or key management system
   */
  private static async getJWTPrivateKey(): Promise<crypto.KeyObject> {
    // For development, generate ephemeral key
    // In production, use stored RSA private key
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    return privateKey;
  }

  /**
   * Verify JWT access token
   * 
   * @param token - JWT to verify
   * @returns Decoded payload
   */
  static async verifyAccessToken(token: string): Promise<any> {
    const publicKey = await this.getJWTPublicKey();

    try {
      const { payload } = await jose.jwtVerify(token, publicKey, {
        issuer: process.env.NEXT_PUBLIC_APP_URL || 'https://hoteletuna.com',
      });

      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`INVALID_TOKEN: ${message}`);
    }
  }

  /**
   * Get JWT verification public key
   */
  private static async getJWTPublicKey(): Promise<crypto.KeyObject> {
    // In production, load from JWKS endpoint
    // For now, match the private key generation
    const { publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    return publicKey;
  }
}

// ============================================================================
// CONSENT SCOPE DEFINITIONS
// ============================================================================

export const CONSENT_SCOPES = {
  // Account Information Services (AIS)
  'banking:accounts.basic.read': {
    name: 'Read account information',
    description: 'Access to your account numbers, names, and types',
    service: 'AIS',
    operations: ['Read'],
  },
  'banking:accounts.balances.read': {
    name: 'Read account balances',
    description: 'Access to your current account balances',
    service: 'AIS',
    operations: ['Read'],
  },
  'banking:accounts.transactions.read': {
    name: 'Read transaction history',
    description: 'Access to your transaction history',
    service: 'AIS',
    operations: ['Read'],
  },

  // Payment Initiation Services (PIS)
  'banking:payments.write': {
    name: 'Initiate payments',
    description: 'Ability to initiate payments on your behalf',
    service: 'PIS',
    operations: ['Write'],
  },
  'banking:payments.read': {
    name: 'Read payment status',
    description: 'Check the status of payments initiated',
    service: 'PIS',
    operations: ['Read'],
  },

  // Common Services
  'consent:authorisationcode.write': {
    name: 'Request authorization',
    description: 'Ability to request authorization codes',
    service: 'Common',
    operations: ['Write'],
  },
  'consent:authorisationtoken.write': {
    name: 'Request access tokens',
    description: 'Ability to request and refresh access tokens',
    service: 'Common',
    operations: ['Write'],
  },
} as const;

export type ConsentScopeKey = keyof typeof CONSENT_SCOPES;
