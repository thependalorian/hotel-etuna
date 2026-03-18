/**
 * Open Banking Service - OAuth 2.0 with PKCE
 * 
 * Implements Namibia Open Banking Standards v1.0 (OBS 2025)
 * - AIS (Account Information Service)
 * - PISP (Payment Initiation Service Provider)
 * - OAuth 2.0 with PKCE
 * - Secure token storage
 * 
 * Location: services/openBanking.ts
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { getAuthHeader } from './auth';

WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type NamibianBank = 
  | 'fnb'
  | 'bank_windhoek'
  | 'standard_bank'
  | 'nedbank'
  | 'nampost';

export interface BankConfig {
  id: NamibianBank;
  name: string;
  logo?: string;
  color: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint: string;
  apiBaseUrl: string;
  clientId: string;
  scopes: string[];
  isTestMode: boolean;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

export interface LinkedBankAccount {
  id: string;
  bankId: NamibianBank;
  bankName: string;
  accountId: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'transmission' | 'credit';
  accountName?: string;
  currency: string;
  linkedAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface AccountBalance {
  accountId: string;
  available: number;
  current: number;
  currency: string;
  lastUpdated: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  reference?: string;
  category?: string;
}

export interface ConsentRequest {
  permissions: string[];
  expirationDateTime: string;
  transactionFromDateTime?: string;
  transactionToDateTime?: string;
}

export interface OAuthState {
  bankId: NamibianBank;
  codeVerifier: string;
  state: string;
  returnTo?: string;
}

// ═══════════════════════════════════════════════════════════
// BANK CONFIGURATIONS
// ═══════════════════════════════════════════════════════════

export const NAMIBIAN_BANKS: Record<NamibianBank, BankConfig> = {
  fnb: {
    id: 'fnb',
    name: 'FNB Namibia',
    color: '#003D7A',
    authorizationEndpoint: 'https://openapi.fnb.com.na/oauth/authorize',
    tokenEndpoint: 'https://openapi.fnb.com.na/oauth/token',
    revokeEndpoint: 'https://openapi.fnb.com.na/oauth/revoke',
    apiBaseUrl: 'https://openapi.fnb.com.na/v1',
    clientId: process.env.EXPO_PUBLIC_FNB_CLIENT_ID || 'smartpay-test-client',
    scopes: ['accounts', 'balances', 'transactions'],
    isTestMode: !process.env.EXPO_PUBLIC_FNB_CLIENT_ID,
  },
  bank_windhoek: {
    id: 'bank_windhoek',
    name: 'Bank Windhoek',
    color: '#00A859',
    authorizationEndpoint: 'https://openbanking.bankwindhoek.com.na/authorize',
    tokenEndpoint: 'https://openbanking.bankwindhoek.com.na/token',
    revokeEndpoint: 'https://openbanking.bankwindhoek.com.na/revoke',
    apiBaseUrl: 'https://openbanking.bankwindhoek.com.na/api/v1',
    clientId: process.env.EXPO_PUBLIC_BANK_WINDHOEK_CLIENT_ID || 'smartpay-test-client',
    scopes: ['accounts', 'balances', 'transactions'],
    isTestMode: !process.env.EXPO_PUBLIC_BANK_WINDHOEK_CLIENT_ID,
  },
  standard_bank: {
    id: 'standard_bank',
    name: 'Standard Bank Namibia',
    color: '#003F87',
    authorizationEndpoint: 'https://api.standardbank.com.na/oauth2/authorize',
    tokenEndpoint: 'https://api.standardbank.com.na/oauth2/token',
    revokeEndpoint: 'https://api.standardbank.com.na/oauth2/revoke',
    apiBaseUrl: 'https://api.standardbank.com.na/openbanking/v1',
    clientId: process.env.EXPO_PUBLIC_STANDARD_BANK_CLIENT_ID || 'smartpay-test-client',
    scopes: ['accounts', 'balances', 'transactions'],
    isTestMode: !process.env.EXPO_PUBLIC_STANDARD_BANK_CLIENT_ID,
  },
  nedbank: {
    id: 'nedbank',
    name: 'Nedbank Namibia',
    color: '#007A3D',
    authorizationEndpoint: 'https://openapi.nedbank.com.na/oauth/authorize',
    tokenEndpoint: 'https://openapi.nedbank.com.na/oauth/token',
    revokeEndpoint: 'https://openapi.nedbank.com.na/oauth/revoke',
    apiBaseUrl: 'https://openapi.nedbank.com.na/api/v1',
    clientId: process.env.EXPO_PUBLIC_NEDBANK_CLIENT_ID || 'smartpay-test-client',
    scopes: ['accounts', 'balances', 'transactions'],
    isTestMode: !process.env.EXPO_PUBLIC_NEDBANK_CLIENT_ID,
  },
  nampost: {
    id: 'nampost',
    name: 'NamPost Savings Bank',
    color: '#ED1C24',
    authorizationEndpoint: 'https://api.nampost.com.na/oauth/authorize',
    tokenEndpoint: 'https://api.nampost.com.na/oauth/token',
    revokeEndpoint: 'https://api.nampost.com.na/oauth/revoke',
    apiBaseUrl: 'https://api.nampost.com.na/openbanking/v1',
    clientId: process.env.EXPO_PUBLIC_NAMPOST_CLIENT_ID || 'smartpay-test-client',
    scopes: ['accounts', 'balances', 'transactions'],
    isTestMode: !process.env.EXPO_PUBLIC_NAMPOST_CLIENT_ID,
  },
};

// ═══════════════════════════════════════════════════════════
// SECURE STORAGE KEYS
// ═══════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  OAUTH_STATE: 'openbanking_oauth_state',
  TOKENS: (bankId: string) => `openbanking_tokens_${bankId}`,
  LINKED_ACCOUNTS: 'openbanking_linked_accounts',
};

// ═══════════════════════════════════════════════════════════
// PKCE UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Generate PKCE code verifier (43-128 characters)
 */
async function generateCodeVerifier(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return base64UrlEncode(randomBytes);
}

/**
 * Generate PKCE code challenge from verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return base64UrlEncode(hash);
}

/**
 * Base64 URL encoding (RFC 4648)
 */
function base64UrlEncode(str: string | Uint8Array): string {
  const base64 = typeof str === 'string' 
    ? btoa(str) 
    : btoa(String.fromCharCode(...Array.from(str)));
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate random state parameter
 */
async function generateState(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return base64UrlEncode(randomBytes);
}

// ═══════════════════════════════════════════════════════════
// OAUTH FLOW
// ═══════════════════════════════════════════════════════════

/**
 * Initiate OAuth consent flow with PKCE
 * Opens bank's OAuth page in browser
 */
export async function initiateConsent(
  bankId: NamibianBank,
  returnTo?: string
): Promise<AuthSession.AuthSessionResult> {
  const bank = NAMIBIAN_BANKS[bankId];
  
  if (bank.isTestMode) {
    return handleTestModeConsent(bankId, returnTo);
  }

  try {
    // Generate PKCE parameters
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = await generateState();

    // Store OAuth state securely
    const oauthState: OAuthState = {
      bankId,
      codeVerifier,
      state,
      returnTo,
    };
    await SecureStore.setItemAsync(
      STORAGE_KEYS.OAUTH_STATE,
      JSON.stringify(oauthState)
    );

    // Build authorization URL
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'smartpay',
      path: 'oauth-callback',
    });

    const authUrl = `${bank.authorizationEndpoint}?` + 
      new URLSearchParams({
        response_type: 'code',
        client_id: bank.clientId,
        redirect_uri: redirectUri,
        scope: bank.scopes.join(' '),
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      }).toString();

    // Open OAuth page in browser
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      redirectUri
    );

    return result;
  } catch (error) {
    console.error('initiateConsent error:', error);
    throw new Error('Failed to initiate consent flow');
  }
}

/**
 * Handle OAuth callback and exchange authorization code for tokens
 */
export async function handleOAuthCallback(
  url: string
): Promise<{
  success: boolean;
  bankId?: NamibianBank;
  accountId?: string;
  error?: string;
}> {
  try {
    // Parse callback URL
    const { queryParams } = AuthSession.parseAuthSessionResult(url, { url });
    
    if (!queryParams?.code || !queryParams?.state) {
      return { success: false, error: 'Missing authorization code or state' };
    }

    // Retrieve stored OAuth state
    const stateJson = await SecureStore.getItemAsync(STORAGE_KEYS.OAUTH_STATE);
    if (!stateJson) {
      return { success: false, error: 'OAuth state not found' };
    }

    const oauthState: OAuthState = JSON.parse(stateJson);

    // Verify state parameter
    if (queryParams.state !== oauthState.state) {
      return { success: false, error: 'State mismatch - possible CSRF attack' };
    }

    const bank = NAMIBIAN_BANKS[oauthState.bankId];

    // Exchange authorization code for tokens
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'smartpay',
      path: 'oauth-callback',
    });

    const tokenResponse = await fetch(bank.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: queryParams.code,
        redirect_uri: redirectUri,
        client_id: bank.clientId,
        code_verifier: oauthState.codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return { success: false, error: 'Failed to exchange authorization code' };
    }

    const tokenData = await tokenResponse.json();

    // Store tokens securely
    const tokens: OAuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      scope: tokenData.scope,
    };

    await SecureStore.setItemAsync(
      STORAGE_KEYS.TOKENS(oauthState.bankId),
      JSON.stringify(tokens)
    );

    // Fetch linked accounts
    const accounts = await fetchAccountsFromBank(oauthState.bankId, tokens.accessToken);
    
    if (accounts.length > 0) {
      // Save linked accounts
      await saveLinkedAccounts(accounts);
      
      // Sync with backend
      if (API_BASE_URL) {
        await syncLinkedAccountsWithBackend(accounts);
      }

      // Clean up OAuth state
      await SecureStore.deleteItemAsync(STORAGE_KEYS.OAUTH_STATE);

      return {
        success: true,
        bankId: oauthState.bankId,
        accountId: accounts[0].id,
      };
    }

    return { success: false, error: 'No accounts found' };
  } catch (error) {
    console.error('handleOAuthCallback error:', error);
    return { success: false, error: 'Failed to complete OAuth flow' };
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(bankId: NamibianBank): Promise<OAuthTokens | null> {
  try {
    const tokensJson = await SecureStore.getItemAsync(STORAGE_KEYS.TOKENS(bankId));
    if (!tokensJson) return null;

    const tokens: OAuthTokens = JSON.parse(tokensJson);
    const bank = NAMIBIAN_BANKS[bankId];

    const response = await fetch(bank.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: bank.clientId,
      }).toString(),
    });

    if (!response.ok) {
      console.error('Token refresh failed');
      return null;
    }

    const data = await response.json();

    const newTokens: OAuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
    };

    await SecureStore.setItemAsync(
      STORAGE_KEYS.TOKENS(bankId),
      JSON.stringify(newTokens)
    );

    return newTokens;
  } catch (error) {
    console.error('refreshAccessToken error:', error);
    return null;
  }
}

/**
 * Get valid access token (refresh if expired)
 */
async function getValidAccessToken(bankId: NamibianBank): Promise<string | null> {
  try {
    const tokensJson = await SecureStore.getItemAsync(STORAGE_KEYS.TOKENS(bankId));
    if (!tokensJson) return null;

    const tokens: OAuthTokens = JSON.parse(tokensJson);

    // Check if token is expired (with 5min buffer)
    if (tokens.expiresAt < Date.now() + (5 * 60 * 1000)) {
      const newTokens = await refreshAccessToken(bankId);
      return newTokens?.accessToken || null;
    }

    return tokens.accessToken;
  } catch (error) {
    console.error('getValidAccessToken error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// ACCOUNT INFORMATION SERVICE (AIS)
// ═══════════════════════════════════════════════════════════

/**
 * Fetch accounts from bank's Open Banking API
 */
async function fetchAccountsFromBank(
  bankId: NamibianBank,
  accessToken: string
): Promise<LinkedBankAccount[]> {
  const bank = NAMIBIAN_BANKS[bankId];

  try {
    const response = await fetch(`${bank.apiBaseUrl}/accounts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const data = await response.json();

    return data.accounts.map((acc: any) => ({
      id: `${bankId}_${acc.accountId}`,
      bankId,
      bankName: bank.name,
      accountId: acc.accountId,
      accountNumber: acc.accountNumber,
      accountType: acc.accountType,
      accountName: acc.accountName,
      currency: acc.currency || 'NAD',
      linkedAt: new Date().toISOString(),
      status: 'active',
    }));
  } catch (error) {
    console.error('fetchAccountsFromBank error:', error);
    return [];
  }
}

/**
 * Get all linked bank accounts
 */
export async function getLinkedAccounts(): Promise<LinkedBankAccount[]> {
  try {
    const accountsJson = await SecureStore.getItemAsync(STORAGE_KEYS.LINKED_ACCOUNTS);
    if (!accountsJson) return [];

    const accounts: LinkedBankAccount[] = JSON.parse(accountsJson);
    
    // Filter active accounts
    return accounts.filter(acc => acc.status === 'active');
  } catch (error) {
    console.error('getLinkedAccounts error:', error);
    return [];
  }
}

/**
 * Get account balances for a linked account
 */
export async function getAccountBalances(
  accountId: string
): Promise<AccountBalance | null> {
  try {
    const accounts = await getLinkedAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    const accessToken = await getValidAccessToken(account.bankId);
    if (!accessToken) {
      throw new Error('No valid access token');
    }

    const bank = NAMIBIAN_BANKS[account.bankId];

    const response = await fetch(
      `${bank.apiBaseUrl}/accounts/${account.accountId}/balances`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch balances');
    }

    const data = await response.json();

    return {
      accountId: account.id,
      available: data.balances.available.amount,
      current: data.balances.current.amount,
      currency: data.balances.available.currency,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('getAccountBalances error:', error);
    return null;
  }
}

/**
 * Get account transactions
 */
export async function getAccountTransactions(
  accountId: string,
  fromDate?: string,
  toDate?: string
): Promise<BankTransaction[]> {
  try {
    const accounts = await getLinkedAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    const accessToken = await getValidAccessToken(account.bankId);
    if (!accessToken) {
      throw new Error('No valid access token');
    }

    const bank = NAMIBIAN_BANKS[account.bankId];

    const url = new URL(`${bank.apiBaseUrl}/accounts/${account.accountId}/transactions`);
    if (fromDate) url.searchParams.append('fromDate', fromDate);
    if (toDate) url.searchParams.append('toDate', toDate);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();

    return data.transactions.map((txn: any) => ({
      id: txn.transactionId,
      accountId: account.id,
      date: txn.bookingDateTime,
      description: txn.transactionInformation,
      amount: Math.abs(txn.amount.amount),
      type: txn.creditDebitIndicator === 'Credit' ? 'credit' : 'debit',
      balance: txn.balanceAfterTransaction?.amount || 0,
      reference: txn.transactionReference,
      category: txn.proprietaryBankTransactionCode?.code,
    }));
  } catch (error) {
    console.error('getAccountTransactions error:', error);
    return [];
  }
}

/**
 * Disconnect bank account (revoke consent)
 */
export async function disconnectBank(accountId: string): Promise<boolean> {
  try {
    const accounts = await getLinkedAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    const accessToken = await getValidAccessToken(account.bankId);
    const bank = NAMIBIAN_BANKS[account.bankId];

    // Revoke OAuth token
    if (accessToken) {
      await fetch(bank.revokeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: accessToken,
          client_id: bank.clientId,
        }).toString(),
      });
    }

    // Delete stored tokens
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKENS(account.bankId));

    // Update account status
    const updatedAccounts = accounts.map(acc =>
      acc.id === accountId ? { ...acc, status: 'revoked' as const } : acc
    );
    await SecureStore.setItemAsync(
      STORAGE_KEYS.LINKED_ACCOUNTS,
      JSON.stringify(updatedAccounts)
    );

    // Notify backend
    if (API_BASE_URL) {
      const authHeader = await getAuthHeader();
      await fetch(`${API_BASE_URL}/api/v1/mobile/banking/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ accountId }),
      });
    }

    return true;
  } catch (error) {
    console.error('disconnectBank error:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Save linked accounts to secure storage
 */
async function saveLinkedAccounts(accounts: LinkedBankAccount[]): Promise<void> {
  try {
    const existingJson = await SecureStore.getItemAsync(STORAGE_KEYS.LINKED_ACCOUNTS);
    const existing: LinkedBankAccount[] = existingJson ? JSON.parse(existingJson) : [];

    // Merge with existing accounts (avoid duplicates)
    const merged = [...existing];
    for (const account of accounts) {
      const index = merged.findIndex(acc => acc.id === account.id);
      if (index >= 0) {
        merged[index] = account;
      } else {
        merged.push(account);
      }
    }

    await SecureStore.setItemAsync(
      STORAGE_KEYS.LINKED_ACCOUNTS,
      JSON.stringify(merged)
    );
  } catch (error) {
    console.error('saveLinkedAccounts error:', error);
  }
}

/**
 * Sync linked accounts with backend
 */
async function syncLinkedAccountsWithBackend(
  accounts: LinkedBankAccount[]
): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    await fetch(`${API_BASE_URL}/api/v1/mobile/banking/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ accounts }),
    });
  } catch (error) {
    console.error('syncLinkedAccountsWithBackend error:', error);
  }
}

/**
 * Test mode consent (for development without real banks)
 */
async function handleTestModeConsent(
  bankId: NamibianBank,
  returnTo?: string
): Promise<AuthSession.AuthSessionResult> {
  const bank = NAMIBIAN_BANKS[bankId];
  
  // Generate mock tokens
  const tokens: OAuthTokens = {
    accessToken: `test_access_token_${bankId}_${Date.now()}`,
    refreshToken: `test_refresh_token_${bankId}_${Date.now()}`,
    expiresAt: Date.now() + (3600 * 1000),
    scope: bank.scopes.join(' '),
  };

  await SecureStore.setItemAsync(
    STORAGE_KEYS.TOKENS(bankId),
    JSON.stringify(tokens)
  );

  // Generate mock linked accounts
  const mockAccounts: LinkedBankAccount[] = [
    {
      id: `${bankId}_test_acc_1`,
      bankId,
      bankName: bank.name,
      accountId: `TEST_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
      accountType: 'savings',
      currency: 'NAD',
      linkedAt: new Date().toISOString(),
      status: 'active',
    },
  ];

  await saveLinkedAccounts(mockAccounts);

  return {
    type: 'success',
    url: `smartpay://oauth-callback?code=test_code&state=test_state`,
  };
}

/**
 * Get available banks
 */
export function getAvailableBanks(): BankConfig[] {
  return Object.values(NAMIBIAN_BANKS);
}

/**
 * Check if bank linking is available
 */
export function isBankLinkingAvailable(): boolean {
  return true; // Always available (test mode fallback)
}
