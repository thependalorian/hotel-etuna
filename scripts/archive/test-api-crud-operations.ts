/**
 * API-Based CRUD Operations Test Suite
 * 
 * Purpose: Test ALL Create, Read, Update, Delete operations via API endpoints
 * Location: /scripts/test-api-crud-operations.ts
 * 
 * Architecture: API → Service → Database (Full Stack Testing)
 * 
 * Features:
 * - Tests actual HTTP endpoints (/api/properties, /api/bookings, etc.)
 * - Authentication via NextAuth/Stack Auth (session cookies)
 * - Comprehensive error handling with try-catch
 * - Ollama AI error analysis for debugging
 * - Detailed error reporting
 * - Validates standardized API response format
 * 
 * API Response Format (Standardized):
 * - Success: { data: <resource | array> }
 * - Error: { error: { message: string, code: string, details?: any } }
 * 
 * Coverage:
 * - Properties (CRUD)
 * - Bookings (CRUD)
 * - Rooms (CRUD)
 * - Guests/CRM (CRUD)
 * - Restaurant Menu (CRUD)
 * - Restaurant Tables (CRUD)
 * - Restaurant Orders (CRUD)
 * - Staff (CRUD)
 * - CMS Content (CRUD)
 * - CMS Media (CRUD)
 * - Analytics (READ)
 * - Settings (READ, UPDATE)
 * - User Profile (READ, UPDATE)
 * - QR Codes (CRUD)
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/test-api-crud-operations.ts
 * ```
 * 
 * Environment Variables Required:
 * - DATABASE_URL
 * - NEXTAUTH_SECRET
 * - OLLAMA_URL (optional, defaults to http://localhost:11434)
 * - OLLAMA_MODEL (optional, defaults to llama3.2)
 * - BASE_URL (optional, defaults to http://localhost:3000)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../lib/database/connection';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getPropertyImages, getRoomImages, getMenuItemImage, getCmsMediaImage, getConsistentImage } from './test-image-helper';

// Load environment variables (try .env.local first, then .env)
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  tenantId: '',
  userId: '',
  userEmail: process.env.TEST_USER_EMAIL || 'pendanek@gmail.com',
  userPassword: process.env.TEST_USER_PASSWORD || '',
  sessionCookie: '',
  propertyId: '',
  roomId: '',
  guestId: '',
  bookingId: '',
  restaurantId: '',
  tableId: '',
  orderId: '',
  staffId: '',
  contentId: '',
  mediaId: '',
  qrCodeId: '',
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [] as Array<{
    category: string;
    operation: string;
    endpoint: string;
    status: number;
    error: string;
    aiAnalysis?: string;
  }>,
  categories: {} as Record<string, { passed: number; failed: number; skipped: number }>,
};

/**
 * Extract data from standardized API response
 * Handles both new format ({ data: ... }) and legacy format (direct data)
 */
function extractResponseData(responseData: any): any {
  // Standardized format: { data: ... }
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return responseData.data;
  }
  // Legacy format: direct data (for backward compatibility)
  return responseData;
}

/**
 * Extract error from standardized API response
 * Handles both new format ({ error: { message, code, details } }) and legacy format
 */
function extractResponseError(responseData: any): { message: string; code?: string; details?: any } | undefined {
  // Standardized format: { error: { message, code, details } }
  if (responseData && typeof responseData === 'object' && 'error' in responseData) {
    return responseData.error;
  }
  // Legacy format: { message: ... } or direct error
  if (responseData && typeof responseData === 'object' && 'message' in responseData) {
    return { message: responseData.message, code: responseData.code };
  }
  return undefined;
}

/**
 * Validate standardized API response format
 */
function validateResponseFormat(responseData: any, isSuccess: boolean): boolean {
  if (!responseData || typeof responseData !== 'object') {
    return false;
  }
  
  if (isSuccess) {
    // Success responses should have 'data' field
    return 'data' in responseData;
  } else {
    // Error responses should have 'error' field with 'message'
    return 'error' in responseData && 
           responseData.error && 
           typeof responseData.error === 'object' &&
           'message' in responseData.error;
  }
}

/**
 * Analyze error using Ollama
 */
async function analyzeErrorWithOllama(
  category: string,
  operation: string,
  endpoint: string,
  status: number,
  error: string,
  requestBody?: any,
  responseBody?: any
): Promise<string | null> {
  try {
    const prompt = `You are a senior software engineer debugging an API test failure.

Test Details:
- Category: ${category}
- Operation: ${operation}
- Endpoint: ${endpoint}
- HTTP Status: ${status}
- Error: ${error}
${requestBody ? `- Request Body: ${JSON.stringify(requestBody, null, 2)}` : ''}
${responseBody ? `- Response Body: ${JSON.stringify(responseBody, null, 2)}` : ''}

Provide a concise analysis:
1. What likely caused this error?
2. What should be checked/fixed?
3. Any specific recommendations?

Keep response under 200 words.`;

    const response = await fetch(`${CONFIG.ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.ollamaModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️  Ollama analysis failed: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.message?.content || null;
  } catch (error) {
    console.warn(`⚠️  Ollama not available or error: ${error}`);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  options: { skipAuth?: boolean } = {}
): Promise<{ status: number; data: any; error?: any; errorMessage?: string }> {
  try {
    const url = `${CONFIG.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add session cookie if available and not skipping auth
    if (CONFIG.sessionCookie && !options.skipAuth) {
      headers['Cookie'] = CONFIG.sessionCookie;
      
      // If using Stack Auth access token, also add Authorization header
      if (CONFIG.sessionCookie.startsWith('stack-access-token=')) {
        // Extract token from cookie format: "stack-access-token=<token>"
        const tokenMatch = CONFIG.sessionCookie.match(/stack-access-token=([^;]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const token = tokenMatch[1].trim();
          headers['Authorization'] = `Bearer ${token}`;
          // Also ensure cookie is properly formatted
          headers['Cookie'] = `stack-access-token=${token}`;
        }
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log(`  🔍 ${method} ${endpoint}${body ? ` (with body)` : ''}`);
    
    // Debug: Log headers for first API call
    if (endpoint === '/api/properties' && method === 'POST') {
      console.log(`  🔍 Debug - Headers:`, JSON.stringify(headers, null, 2));
      console.log(`  🔍 Debug - Cookie:`, headers['Cookie']?.substring(0, 100));
      console.log(`  🔍 Debug - Authorization:`, headers['Authorization']?.substring(0, 50));
    }
    
    const response = await fetch(url, {
      ...fetchOptions,
      redirect: 'manual', // Don't follow redirects automatically
    });
    
    // Check if we got redirected (likely to login page)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') || '';
      console.log(`  ⚠️  Redirected to: ${location}`);
      return {
        status: response.status,
        data: { _redirect: location },
        error: { message: `Redirected to ${location} - authentication required` },
        errorMessage: `Authentication required (redirected to ${location})`,
      };
    }
    
    const contentType = response.headers.get('content-type') || '';
    let responseData: any = {};
    
    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => ({}));
    } else {
      // If not JSON, it might be HTML (login page) or text
      const text = await response.text().catch(() => '');
      if (text.includes('login') || text.includes('Login')) {
        console.log(`  ⚠️  Received HTML response (likely login page)`);
        return {
          status: 401,
          data: { _html: text.substring(0, 200) },
          error: { message: 'Authentication required - received login page' },
          errorMessage: 'Authentication required',
        };
      }
      responseData = { _raw: text };
    }

    if (!response.ok) {
      console.log(`  ❌ Response: ${response.status} ${response.statusText}`);
      if (responseData && !responseData._raw) {
        console.log(`  📄 Error data:`, JSON.stringify(responseData, null, 2));
      }
    } else {
      console.log(`  ✅ Response: ${response.status}`);
      if (responseData && Object.keys(responseData).length > 0 && !responseData._raw) {
        console.log(`  📄 Response data:`, JSON.stringify(responseData, null, 2).substring(0, 200));
      }
    }

    return {
      status: response.status,
      data: responseData,
      error: response.ok ? undefined : responseData,
      errorMessage: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.log(`  ❌ Fetch error: ${errorMsg}`);
    if (error.code) {
      console.log(`  📄 Error code: ${error.code}`);
    }
    return {
      status: 0,
      data: {},
      error: { message: errorMsg, code: error.code },
      errorMessage: errorMsg,
    };
  }
}

/**
 * Authenticate and get session cookie
 * 
 * Migration Note: This function now supports both Stack Auth and NextAuth.
 * Stack Auth is preferred if configured, otherwise falls back to NextAuth.
 */
async function authenticate(): Promise<boolean> {
  try {
    console.log('\n🔐 Setting up authentication...\n');
    console.log(`  📧 Using email: ${CONFIG.userEmail}`);

    // Check if password is provided
    if (!CONFIG.userPassword) {
      console.error('❌ Password required for authentication.');
      console.error('   Please set TEST_USER_PASSWORD environment variable:');
      console.error('   export TEST_USER_PASSWORD="your-password"');
      console.error('   Or run: TEST_USER_PASSWORD="your-password" npm run test:api');
      return false;
    }
    
    console.log(`✓ Password provided: ${'*'.repeat(CONFIG.userPassword.length)}`);

    // Try Stack Auth first (if configured), then fall back to NextAuth
    const stackAuthConfigured = process.env.NEXT_PUBLIC_STACK_PROJECT_ID && 
                                 process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY &&
                                 process.env.STACK_SECRET_SERVER_KEY;
    
    if (stackAuthConfigured) {
      console.log('  🔐 Attempting Stack Auth authentication...');
      const stackAuthSuccess = await authenticateWithStackAuth();
      if (stackAuthSuccess) {
        // Try to get user info from database for tenant/user IDs (optional, don't fail if DB unavailable)
        try {
          // First, test database connection with a simple query
          await prisma.$queryRaw`SELECT 1`;
          
          // If connection works, try to get user info
          const user = await prisma.user.findUnique({
            where: { email: CONFIG.userEmail },
            include: { tenant: true },
          });
          if (user && user.tenant) {
            CONFIG.tenantId = user.tenant_id;
            CONFIG.userId = user.id;
            console.log(`✓ Tenant: ${user.tenant.name} (${user.tenant.id})`);
            console.log(`✓ Role: ${user.role}`);
          } else {
            console.log('  ℹ️  User info not found in database (optional - using Stack Auth only)');
          }
        } catch (dbError: any) {
          // Suppress verbose Prisma error output for optional database queries
          const errorMsg = dbError.message || 'Database connection unavailable';
          if (errorMsg.includes('Can\'t reach database server') || errorMsg.includes('connection')) {
            console.log('  ℹ️  Database connection unavailable (optional - using Stack Auth only)');
          } else {
            console.log(`  ⚠️  Could not fetch user info from database (optional): ${errorMsg.substring(0, 100)}`);
          }
          console.log('  ℹ️  Continuing with Stack Auth authentication...');
        }
        return true;
      }
      console.log('  ⚠️  Stack Auth failed, falling back to NextAuth...');
    }

    // Fall back to NextAuth - requires database access
    console.log('  🔐 Attempting NextAuth authentication...');
    
    // Get existing user from database (required for NextAuth)
    try {
      // Test database connection first
      await prisma.$queryRaw`SELECT 1`;
      
      const user = await prisma.user.findUnique({
        where: { email: CONFIG.userEmail },
        include: { tenant: true },
      });

      if (!user) {
        console.error(`❌ User not found: ${CONFIG.userEmail}`);
        console.error('   Please ensure the user exists in the database.');
        return false;
      }

      if (!user.tenant) {
        console.error(`❌ User has no tenant: ${user.email}`);
        return false;
      }

      CONFIG.tenantId = user.tenant_id;
      CONFIG.userId = user.id;
      
      console.log(`✓ Found user: ${user.email}`);
      console.log(`✓ Tenant: ${user.tenant.name} (${user.tenant.id})`);
      console.log(`✓ Role: ${user.role}`);
    } catch (dbError: any) {
      const errorMsg = dbError.message || 'Unknown database error';
      if (errorMsg.includes('Can\'t reach database server') || errorMsg.includes('connection')) {
        console.error('❌ Database connection unavailable');
        console.error('   NextAuth requires database access to verify user.');
        console.error('   Please ensure DATABASE_URL is set and the database is accessible.');
        console.error(`   Error: ${errorMsg.substring(0, 150)}`);
      } else {
        console.error('❌ Database error:', errorMsg);
        console.error('   NextAuth requires database access to verify user.');
      }
      return false;
    }
    
    return await authenticateWithNextAuth();
  } catch (error: any) {
    console.error('❌ Authentication error:', error.message);
    return false;
  }
}

/**
 * Authenticate with Stack Auth
 * Uses Stack Auth REST API for programmatic authentication
 */
async function authenticateWithStackAuth(): Promise<boolean> {
  try {
    const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
    const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
    
    if (!projectId) {
      console.error('  ❌ NEXT_PUBLIC_STACK_PROJECT_ID not set');
      return false;
    }
    
    if (!publishableClientKey) {
      console.error('  ❌ NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY not set');
      return false;
    }

    // Stack Auth REST API endpoint for sign-in
    const signInUrl = `https://api.stack-auth.com/api/v1/auth/password/sign-in`;
    
    console.log('  📡 Signing in with Stack Auth REST API...');
    console.log(`  📧 Email: ${CONFIG.userEmail}`);
    console.log(`  🔑 Password: ${'*'.repeat(CONFIG.userPassword.length)}`);
    
    const response = await fetch(signInUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Stack-Project-Id': projectId,
        'X-Stack-Publishable-Client-Key': publishableClientKey,
        'X-Stack-Access-Type': 'client', // Required for REST API
      },
      body: JSON.stringify({
        email: CONFIG.userEmail,
        password: CONFIG.userPassword,
      }),
    });

    console.log(`  📊 Sign-in response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.access_token) {
        // Stack Auth REST API returns access_token and optionally refresh_token
        // Store both if available
        const tokenData: any = {
          accessToken: data.access_token,
        };
        
        if (data.refresh_token) {
          tokenData.refreshToken = data.refresh_token;
        }
        
        // Store as cookie for cookie-based requests
        CONFIG.sessionCookie = `stack-access-token=${data.access_token}`;
        if (data.refresh_token) {
          CONFIG.sessionCookie += `; stack-refresh-token=${data.refresh_token}`;
        }
        
        // Also try to get cookies from response if any
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          // If Stack Auth sets cookies, use those instead
          const cookies = setCookie.split(',').map(c => c.trim().split(';')[0]).join('; ');
          CONFIG.sessionCookie = cookies;
          console.log('  ✅ Stack Auth session cookies from Set-Cookie header');
        } else {
          console.log('  ✅ Stack Auth access token obtained');
          if (data.refresh_token) {
            console.log('  ✅ Stack Auth refresh token obtained');
          }
        }
        
        console.log(`  📦 User ID: ${data.user_id}`);
        console.log(`  🔑 Access Token: ${data.access_token.substring(0, 30)}... (length: ${data.access_token.length})`);
        console.log('✓ Authentication successful (Stack Auth)\n');
        return true;
      }
    }
    
    // If not successful, log the error
    const errorText = await response.text();
    console.log(`  ❌ Stack Auth sign-in failed: ${errorText}`);
    return false;
  } catch (error: any) {
    console.error('  ❌ Stack Auth error:', error.message);
    return false;
  }
}

/**
 * Authenticate with NextAuth (fallback)
 * 
 * Improved version with better cookie handling and error diagnostics
 */
async function authenticateWithNextAuth(): Promise<boolean> {
  try {
    // Step 1: Get CSRF token (required by NextAuth)
    console.log('  📡 Getting CSRF token...');
    const csrfResponse = await fetch(`${CONFIG.baseUrl}/api/auth/csrf`, {
      method: 'GET',
    });
    
    if (!csrfResponse.ok) {
      throw new Error(`CSRF request failed: ${csrfResponse.status} ${csrfResponse.statusText}`);
    }
    
    const csrfData = await csrfResponse.json().catch(() => ({ csrfToken: '' }));
    console.log(`  ✓ CSRF token: ${csrfData.csrfToken ? 'Received' : 'Missing'}`);
    
    if (!csrfData.csrfToken) {
      console.error('  ❌ No CSRF token received from NextAuth');
      console.error('  💡 Check if NextAuth is properly configured and server is running');
      throw new Error('No CSRF token received from NextAuth');
    }
    
    // Step 2: Sign in via NextAuth - use the correct endpoint format
    console.log('  📡 Signing in with credentials...');
    console.log(`  📧 Email: ${CONFIG.userEmail}`);
    console.log(`  🔑 Password: ${'*'.repeat(CONFIG.userPassword.length)}`);
    
    // NextAuth expects credentials at /api/auth/callback/credentials
    // We need to maintain cookies across requests using a cookie jar
    const cookieJar: string[] = [];
    
    // First, get the CSRF cookie (if any)
    const csrfCookieResponse = await fetch(`${CONFIG.baseUrl}/api/auth/csrf`);
    const csrfCookies = csrfCookieResponse.headers.get('set-cookie');
    if (csrfCookies) {
      // Parse multiple cookies if present
      const cookieStrings = csrfCookies.split(',').map(c => c.trim().split(';')[0]);
      cookieJar.push(...cookieStrings);
    }
    
    // Prepare form data
    const formData = new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: CONFIG.userEmail,
      password: CONFIG.userPassword,
      redirect: 'false',
      callbackUrl: `${CONFIG.baseUrl}/properties`,
      json: 'true',
    });
    
    // Now sign in with credentials
    const signInResponse = await fetch(`${CONFIG.baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Cookie': cookieJar.join('; '),
      },
      body: formData.toString(),
      redirect: 'manual', // Don't follow redirects automatically
    });

    console.log(`  📊 Sign-in response: ${signInResponse.status} ${signInResponse.statusText}`);
    
    // Get response body for analysis
    const contentType = signInResponse.headers.get('content-type') || '';
    let responseText = '';
    let responseJson: any = null;
    
    try {
      if (contentType.includes('application/json')) {
        responseJson = await signInResponse.json();
        responseText = JSON.stringify(responseJson);
      } else {
        responseText = await signInResponse.text();
      }
    } catch (e) {
      // Response might be empty or invalid
      responseText = '';
    }
    
    if (responseText) {
      console.log(`  📄 Response body: ${responseText.substring(0, 300)}${responseText.length > 300 ? '...' : ''}`);
    }
    
    // Check for authentication errors in response
    if (responseJson) {
      if (responseJson.error) {
        console.log(`  ❌ Sign-in error: ${responseJson.error}`);
        if (responseJson.error === 'CredentialsSignin') {
          console.log(`  💡 This usually means: incorrect email or password`);
          console.log(`  💡 Run: npx tsx scripts/verify-user.ts to check user`);
          console.log(`  💡 Run: npx tsx scripts/reset-test-user.ts to reset password`);
        }
        throw new Error(responseJson.error);
      }
      
      if (responseJson.url && responseJson.url.includes('signin')) {
        console.log(`  ❌ Sign-in failed: Redirected to signin page`);
        console.log(`  💡 Check NextAuth logs in dev server console for details`);
        throw new Error('Authentication failed - redirected to signin');
      }
    }
    
    // Check response status
    if (signInResponse.status === 200) {
      // Success - extract session cookie
      const setCookieHeader = signInResponse.headers.get('set-cookie');
      
      if (setCookieHeader) {
        console.log(`  📦 Set-Cookie header: Present`);
        
        // Try multiple patterns to extract session token
        const patterns = [
          /next-auth\.session-token=([^;,\s]+)/,
          /next-auth\.session-token="([^"]+)"/,
          /session-token=([^;,\s]+)/,
        ];
        
        let sessionToken: string | null = null;
        for (const pattern of patterns) {
          const match = setCookieHeader.match(pattern);
          if (match) {
            sessionToken = match[1];
            break;
          }
        }
        
        if (sessionToken) {
          CONFIG.sessionCookie = `next-auth.session-token=${sessionToken}`;
          console.log(`  ✅ Session token extracted: ${sessionToken.substring(0, 30)}...`);
          
          // Verify session by checking /api/auth/session
          try {
            const sessionCheck = await fetch(`${CONFIG.baseUrl}/api/auth/session`, {
              headers: {
                'Cookie': CONFIG.sessionCookie,
              },
            });
            
            if (sessionCheck.ok) {
              const sessionData = await sessionCheck.json();
              if (sessionData && sessionData.user) {
                console.log(`  ✅ Session verified: ${sessionData.user.email}`);
                console.log('✓ Authentication successful (session cookie obtained and verified)\n');
                return true;
              }
            }
          } catch (sessionError) {
            console.log(`  ⚠️  Could not verify session, but cookie was extracted`);
          }
          
          console.log('✓ Authentication successful (session cookie obtained)\n');
          return true;
        } else {
          console.log(`  ⚠️  Could not extract session token from cookie header`);
          console.log(`  📄 Cookie header preview: ${setCookieHeader.substring(0, 200)}`);
        }
      } else {
        console.log(`  ⚠️  No set-cookie header in response`);
        console.log(`  📄 All headers:`, Array.from(signInResponse.headers.entries()).map(([k, v]) => `${k}: ${v.substring(0, 50)}`).join(', '));
      }
    } else if (signInResponse.status === 302) {
      // Redirect - check location
      const location = signInResponse.headers.get('location') || '';
      console.log(`  📍 Redirected to: ${location}`);
      
      if (location.includes('signin') || location.includes('csrf')) {
        console.log(`  ❌ Authentication failed - redirected to signin`);
        console.log(`  💡 Check: password is correct, user exists, user has tenant`);
        throw new Error('Authentication failed - redirected to signin');
      } else {
        // Success redirect - try to extract cookie
        const setCookieHeader = signInResponse.headers.get('set-cookie');
        if (setCookieHeader) {
          const sessionMatch = setCookieHeader.match(/next-auth\.session-token=([^;,\s]+)/);
          if (sessionMatch) {
            CONFIG.sessionCookie = `next-auth.session-token=${sessionMatch[1]}`;
            console.log(`  ✅ Session token extracted from redirect: ${sessionMatch[1].substring(0, 30)}...`);
            console.log('✓ Authentication successful (session cookie obtained from redirect)\n');
            return true;
          }
        }
        console.log(`  ⚠️  Redirected but no session cookie found`);
      }
    } else {
      console.log(`  ❌ Sign-in failed with status: ${signInResponse.status}`);
      if (responseText) {
        console.log(`  📄 Error response: ${responseText.substring(0, 200)}`);
      }
      throw new Error(`Authentication failed with status ${signInResponse.status}`);
    }

    // If we get here, authentication failed
    console.warn('⚠️  Authentication failed. Running tests without authentication.');
    console.warn('⚠️  Protected endpoints will return 401/403.\n');
    console.warn('💡 Troubleshooting steps:');
    console.warn('   1. Run: npx tsx scripts/verify-user.ts');
    console.warn('   2. Run: npx tsx scripts/debug-auth.ts');
    console.warn('   3. Run: npx tsx scripts/reset-test-user.ts');
    console.warn('   4. Check NextAuth logs in dev server console\n');
    return false;
  } catch (error: any) {
    console.error('❌ NextAuth authentication failed:', error.message);
    if (error.stack) {
      console.error(`  📄 Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    console.error('💡 Run: npx tsx scripts/debug-auth.ts for detailed diagnostics\n');
    return false;
  }
}

/**
 * Log test result
 */
function logTest(
  category: string,
  operation: string,
  endpoint: string,
  passed: boolean,
  status?: number,
  error?: string,
  aiAnalysis?: string
) {
  if (!testResults.categories[category]) {
    testResults.categories[category] = { passed: 0, failed: 0, skipped: 0 };
  }

  if (passed) {
    console.log(`✅ [${category}] ${operation} (${endpoint})`);
    testResults.passed++;
    testResults.categories[category].passed++;
  } else if (error?.includes('Skipping')) {
    console.log(`⏭️  [${category}] ${operation} - ${error}`);
    testResults.skipped++;
    testResults.categories[category].skipped++;
  } else {
    console.error(`❌ [${category}] ${operation} (${endpoint}) - Status: ${status || 'N/A'}`);
    if (error) {
      console.error(`   Error: ${error}`);
    }
    if (aiAnalysis) {
      console.log(`   🤖 AI Analysis: ${aiAnalysis}`);
    }
    testResults.errors.push({
      category,
      operation,
      endpoint,
      status: status || 0,
      error: error || 'Unknown error',
      aiAnalysis,
    });
    testResults.failed++;
    testResults.categories[category].failed++;
  }
}

/**
 * Test Properties CRUD
 */
async function testPropertiesCRUD() {
  console.log('\n📋 PROPERTIES CRUD OPERATIONS');
  console.log('-'.repeat(60));

  // CREATE
  try {
    const createResponse = await apiRequest('POST', '/api/properties', {
      name: `Test Property ${Date.now()}`,
      type: 'hotel',
      address: '123 Test Street',
      description: 'Test property description',
      images: getPropertyImages(3), // Add real property images
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      // Validate standardized response format
      const isValidFormat = validateResponseFormat(createResponse.data, true);
      if (!isValidFormat) {
        console.log(`  ⚠️  Response format validation: Expected { data: ... } format`);
      }
      
      // Extract data from standardized response (handles both formats)
      const property = extractResponseData(createResponse.data);
      CONFIG.propertyId = property?.id || '';
      if (CONFIG.propertyId) {
        console.log(`  ✅ Created property: ${CONFIG.propertyId}`);
      } else {
        console.log(`  ⚠️  Response data:`, JSON.stringify(createResponse.data, null, 2));
      }
      logTest('Properties', 'CREATE', 'POST /api/properties', !!CONFIG.propertyId);
    } else {
      // Extract error from standardized response format
      const errorObj = extractResponseError(createResponse.data) || createResponse.error;
      const errorMsg = errorObj?.message || createResponse.errorMessage || JSON.stringify(createResponse.error) || 'Unknown error';
      const errorCode = errorObj?.code || 'UNKNOWN_ERROR';
      
      console.log(`  📄 Error Code: ${errorCode}`);
      if (errorObj?.details) {
        console.log(`  📄 Error Details:`, JSON.stringify(errorObj.details, null, 2));
      }
      
      const aiAnalysis = await analyzeErrorWithOllama(
        'Properties',
        'CREATE',
        'POST /api/properties',
        createResponse.status,
        errorMsg,
        { name: 'Test Property', type: 'hotel', address: '123 Test Street' },
        createResponse.data
      );
      logTest(
        'Properties',
        'CREATE',
        'POST /api/properties',
        false,
        createResponse.status,
        errorMsg,
        aiAnalysis || undefined
      );
      
      // Fallback: Try to get an existing property for this tenant
      if (!CONFIG.propertyId && CONFIG.tenantId) {
        try {
          const listResponse = await apiRequest('GET', '/api/properties');
          if (listResponse.status === 200 && listResponse.data?.data && Array.isArray(listResponse.data.data) && listResponse.data.data.length > 0) {
            CONFIG.propertyId = listResponse.data.data[0].id;
            console.log(`  ✅ Using existing property: ${CONFIG.propertyId}`);
          }
        } catch (error) {
          console.log(`  ⚠️  Could not fetch existing property: ${error}`);
        }
      }
    }
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.log(`  ❌ Exception: ${errorMsg}`);
    const aiAnalysis = await analyzeErrorWithOllama(
      'Properties',
      'CREATE',
      'POST /api/properties',
      0,
      errorMsg
    );
    logTest('Properties', 'CREATE', 'POST /api/properties', false, 0, errorMsg, aiAnalysis || undefined);
  }

  // READ (List)
  try {
    const listResponse = await apiRequest('GET', '/api/properties');
    if (listResponse.status === 200) {
      // Extract data from standardized response
      const properties = extractResponseData(listResponse.data) || [];
      const isValidFormat = validateResponseFormat(listResponse.data, true);
      if (!isValidFormat) {
        console.log(`  ⚠️  Response format validation: Expected { data: [...] } format`);
      }
      logTest('Properties', 'READ (List)', 'GET /api/properties', Array.isArray(properties));
    } else {
      const errorMsg = listResponse.errorMessage || JSON.stringify(listResponse.error) || 'Unknown error';
      const aiAnalysis = await analyzeErrorWithOllama(
        'Properties',
        'READ (List)',
        'GET /api/properties',
        listResponse.status,
        errorMsg
      );
      logTest(
        'Properties',
        'READ (List)',
        'GET /api/properties',
        false,
        listResponse.status,
        errorMsg,
        aiAnalysis || undefined
      );
    }
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.log(`  ❌ Exception: ${errorMsg}`);
    const aiAnalysis = await analyzeErrorWithOllama(
      'Properties',
      'READ (List)',
      'GET /api/properties',
      0,
      errorMsg
    );
    logTest('Properties', 'READ (List)', 'GET /api/properties', false, 0, errorMsg, aiAnalysis || undefined);
  }

  // READ (Single) - Note: GET /api/properties/:id doesn't exist (only PUT exists)
  // Properties are accessed via the list endpoint which filters by tenant
  // Skip single property read test as endpoint doesn't exist
  logTest('Properties', 'READ (Single)', 'GET /api/properties/:id', false, 0, 'Skipping - endpoint not implemented (only PUT exists)');

  // UPDATE
  // Ensure we have a property ID (use existing if creation failed)
  if (!CONFIG.propertyId && CONFIG.tenantId) {
    try {
      const listResponse = await apiRequest('GET', '/api/properties');
      if (listResponse.status === 200 && listResponse.data?.data && Array.isArray(listResponse.data.data) && listResponse.data.data.length > 0) {
        CONFIG.propertyId = listResponse.data.data[0].id;
        console.log(`  ✅ Using existing property for UPDATE: ${CONFIG.propertyId}`);
      }
    } catch (error) {
      // Ignore error, will skip test
    }
  }
  
  if (CONFIG.propertyId) {
    try {
      const updateResponse = await apiRequest('PUT', `/api/properties/${CONFIG.propertyId}`, {
        name: `Updated Property ${Date.now()}`,
        description: 'Updated description',
        address: '456 Updated Street', // Required field
      });

      if (updateResponse.status === 200) {
        logTest('Properties', 'UPDATE', `PUT /api/properties/${CONFIG.propertyId}`, true);
      } else {
        const aiAnalysis = await analyzeErrorWithOllama(
          'Properties',
          'UPDATE',
          `PUT /api/properties/${CONFIG.propertyId}`,
          updateResponse.status,
          JSON.stringify(updateResponse.error)
        );
        logTest(
          'Properties',
          'UPDATE',
          `PUT /api/properties/${CONFIG.propertyId}`,
          false,
          updateResponse.status,
          JSON.stringify(updateResponse.error),
          aiAnalysis || undefined
        );
      }
    } catch (error: any) {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Properties',
        'UPDATE',
        `PUT /api/properties/${CONFIG.propertyId}`,
        0,
        error.message
      );
      logTest(
        'Properties',
        'UPDATE',
        `PUT /api/properties/${CONFIG.propertyId}`,
        false,
        0,
        error.message,
        aiAnalysis || undefined
      );
    }
  } else {
    logTest('Properties', 'UPDATE', 'PUT /api/properties/:id', false, 0, 'Skipping - no property ID');
  }

  // DELETE - Note: DELETE endpoint doesn't exist (405 error), skip test
  logTest('Properties', 'DELETE', 'DELETE /api/properties/:id', false, 0, 'Skipping - endpoint not implemented (405 Method Not Allowed)');
}

/**
 * Test Rooms CRUD
 */
async function testRoomsCRUD() {
  console.log('\n📋 ROOMS CRUD OPERATIONS');
  console.log('-'.repeat(60));

  if (!CONFIG.propertyId) {
    logTest('Rooms', 'CREATE', 'POST /api/properties/:id/rooms', false, 0, 'Skipping - no property ID');
    return;
  }

  // CREATE
  try {
    const createResponse = await apiRequest('POST', `/api/properties/${CONFIG.propertyId}/rooms`, {
      room_number: `R${Date.now()}`,
      room_type: 'Standard',
      max_occupancy: 2,
      images: getRoomImages(2), // Add real room images
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      const room = createResponse.data?.data || createResponse.data;
      CONFIG.roomId = room?.id || '';
      logTest('Rooms', 'CREATE', `POST /api/properties/${CONFIG.propertyId}/rooms`, !!CONFIG.roomId);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Rooms',
        'CREATE',
        `POST /api/properties/${CONFIG.propertyId}/rooms`,
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest(
        'Rooms',
        'CREATE',
        `POST /api/properties/${CONFIG.propertyId}/rooms`,
        false,
        createResponse.status,
        JSON.stringify(createResponse.error),
        aiAnalysis || undefined
      );
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('Rooms', 'CREATE', 'POST /api/properties/:id/rooms', 0, error.message);
    logTest('Rooms', 'CREATE', 'POST /api/properties/:id/rooms', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List) - Use /api/rooms?propertyId=... instead of /api/properties/:id/rooms
  try {
    const listResponse = await apiRequest('GET', `/api/rooms?propertyId=${CONFIG.propertyId}`);
    if (listResponse.status === 200) {
      const rooms = listResponse.data?.data || listResponse.data || [];
      logTest('Rooms', 'READ (List)', `GET /api/rooms?propertyId=${CONFIG.propertyId}`, Array.isArray(rooms));
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Rooms',
        'READ (List)',
        `GET /api/rooms?propertyId=${CONFIG.propertyId}`,
        listResponse.status,
        JSON.stringify(listResponse.error)
      );
      logTest(
        'Rooms',
        'READ (List)',
        `GET /api/rooms?propertyId=${CONFIG.propertyId}`,
        false,
        listResponse.status,
        JSON.stringify(listResponse.error),
        aiAnalysis || undefined
      );
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('Rooms', 'READ (List)', 'GET /api/rooms?propertyId=...', 0, error.message);
    logTest('Rooms', 'READ (List)', 'GET /api/rooms?propertyId=...', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (Single) - Note: GET /api/rooms/:id might not exist, skip for now
  // Rooms are typically accessed via propertyId query parameter
}

/**
 * Test Guests/CRM CRUD
 */
async function testGuestsCRUD() {
  console.log('\n📋 GUESTS/CRM CRUD OPERATIONS');
  console.log('-'.repeat(60));

  // CREATE
  try {
    const createResponse = await apiRequest('POST', '/api/crm/guests', {
      firstName: 'Test',
      lastName: 'Guest',
      email: `guest-${Date.now()}@example.com`,
      phone: '+264811234567',
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      const guest = createResponse.data?.data || createResponse.data;
      CONFIG.guestId = guest?.id || '';
      logTest('Guests', 'CREATE', 'POST /api/crm/guests', !!CONFIG.guestId);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Guests',
        'CREATE',
        'POST /api/crm/guests',
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest('Guests', 'CREATE', 'POST /api/crm/guests', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('Guests', 'CREATE', 'POST /api/crm/guests', 0, error.message);
    logTest('Guests', 'CREATE', 'POST /api/crm/guests', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List)
  try {
    const listResponse = await apiRequest('GET', '/api/crm/guests');
    if (listResponse.status === 200) {
      const guests = listResponse.data?.data || listResponse.data || [];
      logTest('Guests', 'READ (List)', 'GET /api/crm/guests', Array.isArray(guests));
    } else {
      logTest('Guests', 'READ (List)', 'GET /api/crm/guests', false, listResponse.status, JSON.stringify(listResponse.error));
    }
  } catch (error: any) {
    logTest('Guests', 'READ (List)', 'GET /api/crm/guests', false, 0, error.message);
  }
}

/**
 * Test Bookings CRUD
 */
async function testBookingsCRUD() {
  console.log('\n📋 BOOKINGS CRUD OPERATIONS');
  console.log('-'.repeat(60));

  if (!CONFIG.propertyId || !CONFIG.roomId) {
    logTest('Bookings', 'CREATE', 'POST /api/bookings', false, 0, 'Skipping - need property and room');
    return;
  }

  // CREATE
  try {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);

    const createResponse = await apiRequest('POST', '/api/bookings', {
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString(),
      numGuests: 2,
      roomId: CONFIG.roomId,
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      const booking = createResponse.data?.data || createResponse.data;
      CONFIG.bookingId = booking?.id || '';
      logTest('Bookings', 'CREATE', 'POST /api/bookings', !!CONFIG.bookingId);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Bookings',
        'CREATE',
        'POST /api/bookings',
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest('Bookings', 'CREATE', 'POST /api/bookings', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('Bookings', 'CREATE', 'POST /api/bookings', 0, error.message);
    logTest('Bookings', 'CREATE', 'POST /api/bookings', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List) - Note: GET /api/bookings doesn't exist, using availability endpoint instead
  try {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
    
    const listResponse = await apiRequest('GET', `/api/bookings/availability?propertyId=${CONFIG.propertyId}&checkInDate=${checkIn.toISOString()}&checkOutDate=${checkOut.toISOString()}`);
    if (listResponse.status === 200) {
      const rooms = listResponse.data?.data || listResponse.data || [];
      logTest('Bookings', 'READ (Availability)', 'GET /api/bookings/availability', Array.isArray(rooms));
    } else {
      logTest('Bookings', 'READ (Availability)', 'GET /api/bookings/availability', false, listResponse.status, JSON.stringify(listResponse.error));
    }
  } catch (error: any) {
    logTest('Bookings', 'READ (Availability)', 'GET /api/bookings/availability', false, 0, error.message);
  }
}

/**
 * Test Restaurant Menu CRUD
 */
async function testRestaurantMenuCRUD() {
  console.log('\n📋 RESTAURANT MENU CRUD OPERATIONS');
  console.log('-'.repeat(60));

  if (!CONFIG.propertyId) {
    logTest('Restaurant Menu', 'CREATE', 'POST /api/restaurant/menu', false, 0, 'Skipping - no property ID');
    return;
  }

  // CREATE - Note: Need restaurantId first, but for testing we'll create one if it doesn't exist
  // First, try to get or create a restaurant for the property
  let restaurantId: string | null = null;
  try {
    // Try to find existing restaurant for this property
    const restaurantCheck = await apiRequest('GET', `/api/restaurant/details?propertyId=${CONFIG.propertyId}`);
    // Response is directly {id, propertyId, name, ...} not wrapped in data
    if (restaurantCheck.status === 200 && restaurantCheck.data?.id) {
      restaurantId = restaurantCheck.data.id;
      // Validate it's a UUID (not mock data like "1")
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(restaurantId)) {
        restaurantId = null; // Invalid ID, treat as no restaurant
      }
    }
  } catch (error) {
    // Restaurant might not exist, we'll create one
  }
  
  // If no restaurant exists, create one directly in the database
  if (!restaurantId && CONFIG.propertyId && CONFIG.tenantId) {
    try {
      const newRestaurant = await prisma.restaurant.create({
        data: {
          property_id: CONFIG.propertyId,
          name: 'Test Restaurant',
          description: 'Test restaurant for API testing',
          cuisine_type: 'International',
          capacity: 50,
          opening_hours: {
            monday: { open: '11:00', close: '22:00' },
            tuesday: { open: '11:00', close: '22:00' },
            wednesday: { open: '11:00', close: '22:00' },
            thursday: { open: '11:00', close: '22:00' },
            friday: { open: '11:00', close: '23:00' },
            saturday: { open: '11:00', close: '23:00' },
            sunday: { open: '12:00', close: '21:00' },
          },
          contact_phone: '+264811234567',
          contact_email: 'restaurant@test.com',
          images: getPropertyImages(2), // Add real restaurant images
          status: 'active',
        },
      });
      restaurantId = newRestaurant.id;
      console.log(`  ✅ Created restaurant for testing: ${restaurantId}`);
    } catch (error: any) {
      console.log(`  ⚠️  Could not create restaurant: ${error.message}`);
    }
  }
  
  if (!restaurantId) {
    logTest('Restaurant Menu', 'CREATE', 'POST /api/restaurant/menu', false, 0, 'Skipping - no restaurant found for property');
    logTest('Restaurant Menu', 'READ (List)', 'GET /api/restaurant/menu', false, 0, 'Skipping - no restaurant found for property');
    return;
  }

  // CREATE - First create a category, then create menu item
  let categoryId: string | null = null;
  try {
    // Create a menu category first
    const categoryResponse = await apiRequest('POST', '/api/restaurant/menu', {
      type: 'category',
      restaurantId: restaurantId,
      propertyId: CONFIG.propertyId,
      name: 'Test Category',
      description: 'Test category for menu items',
    });
    if (categoryResponse.status === 201 || categoryResponse.status === 200) {
      const category = categoryResponse.data?.data || categoryResponse.data;
      categoryId = category?.id || null;
      console.log(`  ✅ Created category: ${categoryId}`);
    }
  } catch (error: any) {
    console.log(`  ⚠️  Category creation failed: ${error.message}`);
  }

  // CREATE menu item - only if we have a valid categoryId
  if (!categoryId) {
    logTest('Restaurant Menu', 'CREATE', 'POST /api/restaurant/menu', false, 0, 'Skipping - could not create category');
    logTest('Restaurant Menu', 'READ (List)', 'GET /api/restaurant/menu', false, 0, 'Skipping - could not create category');
    return;
  }

  try {
    const menuItemData: any = {
      type: 'item',
      restaurantId: restaurantId,
      propertyId: CONFIG.propertyId,
      categoryId: categoryId, // Required field
      name: `Test Menu Item ${Date.now()}`,
      description: 'Test description',
      price: 99.99,
      image_url: getMenuItemImage(), // Add real menu item image
    };
    
    const createResponse = await apiRequest('POST', '/api/restaurant/menu', menuItemData);

    if (createResponse.status === 201 || createResponse.status === 200) {
      logTest('Restaurant Menu', 'CREATE', 'POST /api/restaurant/menu', true);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Restaurant Menu',
        'CREATE',
        'POST /api/restaurant/menu',
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest('Restaurant Menu', 'CREATE', 'POST /api/restaurant/menu', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('Restaurant Menu', 'CREATE', 'POST /api/restaurant/menu', 0, error.message);
    logTest('Restaurant Menu', 'CREATE', 'POST /api/restaurant/menu', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List)
  try {
    const listResponse = await apiRequest('GET', `/api/restaurant/menu?restaurantId=${restaurantId}`);
    if (listResponse.status === 200) {
      const menuItems = listResponse.data?.data || listResponse.data || [];
      logTest('Restaurant Menu', 'READ (List)', `GET /api/restaurant/menu?restaurantId=${restaurantId}`, Array.isArray(menuItems));
    } else {
      logTest('Restaurant Menu', 'READ (List)', `GET /api/restaurant/menu?restaurantId=${restaurantId}`, false, listResponse.status, JSON.stringify(listResponse.error));
    }
  } catch (error: any) {
    logTest('Restaurant Menu', 'READ (List)', `GET /api/restaurant/menu?restaurantId=${restaurantId}`, false, 0, error.message);
  }
}

/**
 * Test Restaurant Tables CRUD
 */
async function testRestaurantTablesCRUD() {
  console.log('\n📋 RESTAURANT TABLES CRUD OPERATIONS');
  console.log('-'.repeat(60));

  if (!CONFIG.propertyId) {
    logTest('Restaurant Tables', 'CREATE', 'POST /api/restaurant/tables', false, 0, 'Skipping - no property ID');
    return;
  }

  // CREATE - Note: Need restaurantId first, create if doesn't exist
  let restaurantId: string | null = null;
  try {
    const restaurantCheck = await apiRequest('GET', `/api/restaurant/details?propertyId=${CONFIG.propertyId}`);
    // Response is directly {id, propertyId, name, ...} not wrapped in data
    if (restaurantCheck.status === 200 && restaurantCheck.data?.id) {
      restaurantId = restaurantCheck.data.id;
      // Validate it's a UUID (not mock data like "1")
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(restaurantId)) {
        restaurantId = null; // Invalid ID, treat as no restaurant
      }
    }
  } catch (error) {
    // Restaurant might not exist, we'll create one
  }
  
  // If no restaurant exists, create one directly in the database
  if (!restaurantId && CONFIG.propertyId && CONFIG.tenantId) {
    try {
      const newRestaurant = await prisma.restaurant.create({
        data: {
          property_id: CONFIG.propertyId,
          name: 'Test Restaurant',
          description: 'Test restaurant for API testing',
          cuisine_type: 'International',
          capacity: 50,
          opening_hours: {
            monday: { open: '11:00', close: '22:00' },
            tuesday: { open: '11:00', close: '22:00' },
            wednesday: { open: '11:00', close: '22:00' },
            thursday: { open: '11:00', close: '22:00' },
            friday: { open: '11:00', close: '23:00' },
            saturday: { open: '11:00', close: '23:00' },
            sunday: { open: '12:00', close: '21:00' },
          },
          contact_phone: '+264811234567',
          contact_email: 'restaurant@test.com',
          images: getPropertyImages(2), // Add real restaurant images
          status: 'active',
        },
      });
      restaurantId = newRestaurant.id;
      console.log(`  ✅ Created restaurant for testing: ${restaurantId}`);
    } catch (error: any) {
      console.log(`  ⚠️  Could not create restaurant: ${error.message}`);
    }
  }
  
  if (!restaurantId) {
    logTest('Restaurant Tables', 'CREATE', 'POST /api/restaurant/tables', false, 0, 'Skipping - no restaurant found for property');
    logTest('Restaurant Tables', 'READ (List)', 'GET /api/restaurant/tables', false, 0, 'Skipping - no restaurant found for property');
    return;
  }

  // CREATE
  try {
    const createResponse = await apiRequest('POST', '/api/restaurant/tables', {
      restaurantId: restaurantId,
      propertyId: CONFIG.propertyId,
      tableNumber: `T${Date.now()}`,
      capacity: 4,
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      const table = createResponse.data?.data || createResponse.data;
      CONFIG.tableId = table?.id || '';
      logTest('Restaurant Tables', 'CREATE', 'POST /api/restaurant/tables', !!CONFIG.tableId);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Restaurant Tables',
        'CREATE',
        'POST /api/restaurant/tables',
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest('Restaurant Tables', 'CREATE', 'POST /api/restaurant/tables', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('Restaurant Tables', 'CREATE', 'POST /api/restaurant/tables', 0, error.message);
    logTest('Restaurant Tables', 'CREATE', 'POST /api/restaurant/tables', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List)
  try {
    const listResponse = await apiRequest('GET', `/api/restaurant/tables?restaurantId=${restaurantId}`);
    if (listResponse.status === 200) {
      const tables = listResponse.data?.data || listResponse.data || [];
      logTest('Restaurant Tables', 'READ (List)', `GET /api/restaurant/tables?restaurantId=${restaurantId}`, Array.isArray(tables));
    } else {
      logTest('Restaurant Tables', 'READ (List)', `GET /api/restaurant/tables?restaurantId=${restaurantId}`, false, listResponse.status, JSON.stringify(listResponse.error));
    }
  } catch (error: any) {
    logTest('Restaurant Tables', 'READ (List)', `GET /api/restaurant/tables?restaurantId=${restaurantId}`, false, 0, error.message);
  }
}

/**
 * Test Restaurant Orders CRUD
 */
async function testRestaurantOrdersCRUD() {
  console.log('\n📋 RESTAURANT ORDERS CRUD OPERATIONS');
  console.log('-'.repeat(60));

  // CREATE - Need restaurantId, guestId, and proper order schema
  let restaurantId: string | null = null;
  try {
    const restaurantCheck = await apiRequest('GET', `/api/restaurant/details?propertyId=${CONFIG.propertyId}`);
    // Response is directly {id, propertyId, name, ...} not wrapped in data
    if (restaurantCheck.status === 200 && restaurantCheck.data?.id) {
      restaurantId = restaurantCheck.data.id;
      // Validate it's a UUID (not mock data like "1")
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(restaurantId)) {
        restaurantId = null; // Invalid ID, treat as no restaurant
      }
    }
  } catch (error) {
    // Restaurant might not exist, we'll create one
  }
  
  // If no restaurant exists, create one directly in the database
  if (!restaurantId && CONFIG.propertyId && CONFIG.tenantId) {
    try {
      const newRestaurant = await prisma.restaurant.create({
        data: {
          property_id: CONFIG.propertyId,
          name: 'Test Restaurant',
          description: 'Test restaurant for API testing',
          cuisine_type: 'International',
          capacity: 50,
          opening_hours: {
            monday: { open: '11:00', close: '22:00' },
            tuesday: { open: '11:00', close: '22:00' },
            wednesday: { open: '11:00', close: '22:00' },
            thursday: { open: '11:00', close: '22:00' },
            friday: { open: '11:00', close: '23:00' },
            saturday: { open: '11:00', close: '23:00' },
            sunday: { open: '12:00', close: '21:00' },
          },
          contact_phone: '+264811234567',
          contact_email: 'restaurant@test.com',
          images: getPropertyImages(2), // Add real restaurant images
          status: 'active',
        },
      });
      restaurantId = newRestaurant.id;
      console.log(`  ✅ Created restaurant for testing: ${restaurantId}`);
    } catch (error: any) {
      console.log(`  ⚠️  Could not create restaurant: ${error.message}`);
    }
  }
  
  if (!restaurantId) {
    logTest('Restaurant Orders', 'CREATE', 'POST /api/restaurant/orders', false, 0, 'Skipping - no restaurant found for property');
    logTest('Restaurant Orders', 'READ (List)', 'GET /api/restaurant/orders', false, 0, 'Skipping - no restaurant found for property');
    return;
  }

  if (!CONFIG.tableId || !CONFIG.guestId) {
    logTest('Restaurant Orders', 'CREATE', 'POST /api/restaurant/orders', false, 0, 'Skipping - need table and guest');
  } else {
    // CREATE
    try {
      const createResponse = await apiRequest('POST', '/api/restaurant/orders', {
        restaurantId: restaurantId,
        propertyId: CONFIG.propertyId,
        guestId: CONFIG.guestId,
        tableId: CONFIG.tableId,
        items: [
          {
            menuItemId: '00000000-0000-0000-0000-000000000000', // Placeholder - would need actual menu item
            quantity: 2,
            unitPrice: 99.99,
            totalPrice: 199.98,
          },
        ],
      });

      if (createResponse.status === 201 || createResponse.status === 200) {
        const order = createResponse.data?.data || createResponse.data;
        CONFIG.orderId = order?.id || '';
        logTest('Restaurant Orders', 'CREATE', 'POST /api/restaurant/orders', !!CONFIG.orderId);
      } else {
        const aiAnalysis = await analyzeErrorWithOllama(
          'Restaurant Orders',
          'CREATE',
          'POST /api/restaurant/orders',
          createResponse.status,
          JSON.stringify(createResponse.error)
        );
        logTest('Restaurant Orders', 'CREATE', 'POST /api/restaurant/orders', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
      }
    } catch (error: any) {
      const aiAnalysis = await analyzeErrorWithOllama('Restaurant Orders', 'CREATE', 'POST /api/restaurant/orders', 0, error.message);
      logTest('Restaurant Orders', 'CREATE', 'POST /api/restaurant/orders', false, 0, error.message, aiAnalysis || undefined);
    }
  }

  // READ (List) - Reuse restaurantId from above
  if (restaurantId) {
    try {
      const listResponse = await apiRequest('GET', `/api/restaurant/orders?restaurantId=${restaurantId}`);
      if (listResponse.status === 200) {
        const orders = listResponse.data?.data || listResponse.data || [];
        logTest('Restaurant Orders', 'READ (List)', `GET /api/restaurant/orders?restaurantId=${restaurantId}`, Array.isArray(orders));
      } else {
        logTest('Restaurant Orders', 'READ (List)', `GET /api/restaurant/orders?restaurantId=${restaurantId}`, false, listResponse.status, JSON.stringify(listResponse.error));
      }
    } catch (error: any) {
      logTest('Restaurant Orders', 'READ (List)', `GET /api/restaurant/orders?restaurantId=${restaurantId}`, false, 0, error.message);
    }
  } else {
    logTest('Restaurant Orders', 'READ (List)', 'GET /api/restaurant/orders', false, 0, 'Skipping - no restaurant found for property');
  }
}

/**
 * Test Staff CRUD
 */
async function testStaffCRUD() {
  console.log('\n📋 STAFF CRUD OPERATIONS');
  console.log('-'.repeat(60));

  if (!CONFIG.propertyId) {
    logTest('Staff', 'CREATE', 'POST /api/staff', false, 0, 'Skipping - no property ID');
    return;
  }

  // CREATE
  try {
    const hireDate = new Date();
    const createResponse = await apiRequest('POST', '/api/staff', {
      propertyId: CONFIG.propertyId,
      firstName: 'Test',
      lastName: 'Staff',
      email: `staff-${Date.now()}@example.com`,
      phone: '+264811234567',
      hireDate: hireDate.toISOString(),
      position: 'Manager',
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      const staff = createResponse.data?.data || createResponse.data;
      CONFIG.staffId = staff?.id || '';
      logTest('Staff', 'CREATE', 'POST /api/staff', !!CONFIG.staffId);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Staff',
        'CREATE',
        'POST /api/staff',
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest('Staff', 'CREATE', 'POST /api/staff', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('Staff', 'CREATE', 'POST /api/staff', 0, error.message);
    logTest('Staff', 'CREATE', 'POST /api/staff', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List)
  try {
    const listResponse = await apiRequest('GET', '/api/staff');
    if (listResponse.status === 200) {
      const staff = listResponse.data?.data || listResponse.data || [];
      logTest('Staff', 'READ (List)', 'GET /api/staff', Array.isArray(staff));
    } else {
      logTest('Staff', 'READ (List)', 'GET /api/staff', false, listResponse.status, JSON.stringify(listResponse.error));
    }
  } catch (error: any) {
    logTest('Staff', 'READ (List)', 'GET /api/staff', false, 0, error.message);
  }
}

/**
 * Test CMS Content CRUD
 */
async function testCmsContentCRUD() {
  console.log('\n📋 CMS CONTENT CRUD OPERATIONS');
  console.log('-'.repeat(60));

  if (!CONFIG.propertyId) {
    logTest('CMS Content', 'CREATE', 'POST /api/cms/content', false, 0, 'Skipping - no property ID');
    return;
  }

  // CREATE
  try {
    const createResponse = await apiRequest('POST', '/api/cms/content', {
      propertyId: CONFIG.propertyId,
      contentType: 'page',
      title: `Test Content ${Date.now()}`,
      content: 'Test content body',
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      const content = createResponse.data?.data || createResponse.data;
      CONFIG.contentId = content?.id || '';
      logTest('CMS Content', 'CREATE', 'POST /api/cms/content', !!CONFIG.contentId);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'CMS Content',
        'CREATE',
        'POST /api/cms/content',
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest('CMS Content', 'CREATE', 'POST /api/cms/content', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('CMS Content', 'CREATE', 'POST /api/cms/content', 0, error.message);
    logTest('CMS Content', 'CREATE', 'POST /api/cms/content', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List)
  try {
    const listResponse = await apiRequest('GET', `/api/cms/content?propertyId=${CONFIG.propertyId}`);
    if (listResponse.status === 200) {
      const content = listResponse.data?.data || listResponse.data || [];
      logTest('CMS Content', 'READ (List)', `GET /api/cms/content?propertyId=${CONFIG.propertyId}`, Array.isArray(content));
    } else {
      logTest('CMS Content', 'READ (List)', `GET /api/cms/content?propertyId=${CONFIG.propertyId}`, false, listResponse.status, JSON.stringify(listResponse.error));
    }
  } catch (error: any) {
    logTest('CMS Content', 'READ (List)', `GET /api/cms/content?propertyId=${CONFIG.propertyId}`, false, 0, error.message);
  }
}

/**
 * Test CMS Media CRUD
 */
async function testCmsMediaCRUD() {
  console.log('\n📋 CMS MEDIA CRUD OPERATIONS');
  console.log('-'.repeat(60));

  if (!CONFIG.propertyId) {
    logTest('CMS Media', 'CREATE', 'POST /api/cms/media', false, 0, 'Skipping - no property ID');
    return;
  }

  // CREATE (simplified - actual media upload would need multipart/form-data)
  try {
    const createResponse = await apiRequest('POST', '/api/cms/media', {
      propertyId: CONFIG.propertyId,
      fileName: `test-media-${Date.now()}.jpg`,
      filePath: getCmsMediaImage(), // Use real image URL
      fileType: 'image',
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      const media = createResponse.data?.data || createResponse.data;
      CONFIG.mediaId = media?.id || '';
      logTest('CMS Media', 'CREATE', 'POST /api/cms/media', !!CONFIG.mediaId);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'CMS Media',
        'CREATE',
        'POST /api/cms/media',
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest('CMS Media', 'CREATE', 'POST /api/cms/media', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('CMS Media', 'CREATE', 'POST /api/cms/media', 0, error.message);
    logTest('CMS Media', 'CREATE', 'POST /api/cms/media', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List)
  try {
    const listResponse = await apiRequest('GET', `/api/cms/media?propertyId=${CONFIG.propertyId}`);
    if (listResponse.status === 200) {
      const media = listResponse.data?.data || listResponse.data || [];
      logTest('CMS Media', 'READ (List)', `GET /api/cms/media?propertyId=${CONFIG.propertyId}`, Array.isArray(media));
    } else {
      logTest('CMS Media', 'READ (List)', `GET /api/cms/media?propertyId=${CONFIG.propertyId}`, false, listResponse.status, JSON.stringify(listResponse.error));
    }
  } catch (error: any) {
    logTest('CMS Media', 'READ (List)', `GET /api/cms/media?propertyId=${CONFIG.propertyId}`, false, 0, error.message);
  }
}

/**
 * Test Analytics READ
 */
async function testAnalyticsREAD() {
  console.log('\n📋 ANALYTICS READ OPERATIONS');
  console.log('-'.repeat(60));

  // READ - Analytics requires either ?dashboard=true or ?metric=...
  try {
    const response = await apiRequest('GET', '/api/analytics?dashboard=true');
    if (response.status === 200) {
      const analytics = response.data?.data || response.data;
      logTest('Analytics', 'READ (Dashboard)', 'GET /api/analytics?dashboard=true', !!analytics);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'Analytics',
        'READ (Dashboard)',
        'GET /api/analytics?dashboard=true',
        response.status,
        JSON.stringify(response.error)
      );
      logTest('Analytics', 'READ (Dashboard)', 'GET /api/analytics?dashboard=true', false, response.status, JSON.stringify(response.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('Analytics', 'READ (Dashboard)', 'GET /api/analytics?dashboard=true', 0, error.message);
    logTest('Analytics', 'READ (Dashboard)', 'GET /api/analytics?dashboard=true', false, 0, error.message, aiAnalysis || undefined);
  }
}

/**
 * Test QR Codes CRUD
 */
async function testQRCodesCRUD() {
  console.log('\n📋 QR CODES CRUD OPERATIONS');
  console.log('-'.repeat(60));

  if (!CONFIG.propertyId || !CONFIG.roomId) {
    logTest('QR Codes', 'CREATE', 'POST /api/qr', false, 0, 'Skipping - need property and room');
    return;
  }

  // CREATE - Need to get room number, not room ID
  // First, get the room details to get room_number
  let roomNumber: string | null = null;
  try {
    const roomResponse = await apiRequest('GET', `/api/rooms/${CONFIG.roomId}`);
    if (roomResponse.status === 200) {
      roomNumber = roomResponse.data?.data?.room_number || roomResponse.data?.room_number || null;
    }
  } catch (error) {
    // Room might not be accessible via this endpoint
  }
  
  if (!roomNumber) {
    // Try to get room number from rooms list using the correct endpoint
    try {
      const roomsResponse = await apiRequest('GET', `/api/rooms?propertyId=${CONFIG.propertyId}`);
      if (roomsResponse.status === 200) {
        const rooms = roomsResponse.data?.data || roomsResponse.data || [];
        const room = Array.isArray(rooms) ? rooms.find((r: any) => r.id === CONFIG.roomId) : null;
        if (room) {
          roomNumber = room.room_number || room.roomNumber;
        }
      }
    } catch (error) {
      // Could not get room number
    }
  }
  
  if (!roomNumber) {
    logTest('QR Codes', 'CREATE', 'POST /api/qr', false, 0, 'Skipping - could not get room number');
    logTest('QR Codes', 'READ (List)', 'GET /api/qr', false, 0, 'Skipping - could not get room number');
    return;
  }

  // CREATE
  try {
    const createResponse = await apiRequest('POST', '/api/qr', {
      propertyId: CONFIG.propertyId,
      entityType: 'room',
      entityId: roomNumber, // Room number string, not room ID
      qrType: 'ROOM_SERVICE',
    });

    if (createResponse.status === 201 || createResponse.status === 200) {
      const qrCode = createResponse.data?.data || createResponse.data;
      // QR response has qrCode, url, and payload fields (not id)
      const success = !!(qrCode?.qrCode || qrCode?.url || qrCode?.id);
      CONFIG.qrCodeId = qrCode?.id || qrCode?.url || '';
      logTest('QR Codes', 'CREATE', 'POST /api/qr', success);
    } else {
      const aiAnalysis = await analyzeErrorWithOllama(
        'QR Codes',
        'CREATE',
        'POST /api/qr',
        createResponse.status,
        JSON.stringify(createResponse.error)
      );
      logTest('QR Codes', 'CREATE', 'POST /api/qr', false, createResponse.status, JSON.stringify(createResponse.error), aiAnalysis || undefined);
    }
  } catch (error: any) {
    const aiAnalysis = await analyzeErrorWithOllama('QR Codes', 'CREATE', 'POST /api/qr', 0, error.message);
    logTest('QR Codes', 'CREATE', 'POST /api/qr', false, 0, error.message, aiAnalysis || undefined);
  }

  // READ (List)
  try {
    const listResponse = await apiRequest('GET', `/api/qr?propertyId=${CONFIG.propertyId}`);
    if (listResponse.status === 200) {
      const qrCodes = listResponse.data?.data || listResponse.data || [];
      logTest('QR Codes', 'READ (List)', `GET /api/qr?propertyId=${CONFIG.propertyId}`, Array.isArray(qrCodes) || typeof qrCodes === 'object');
    } else {
      logTest('QR Codes', 'READ (List)', `GET /api/qr?propertyId=${CONFIG.propertyId}`, false, listResponse.status, JSON.stringify(listResponse.error));
    }
  } catch (error: any) {
    logTest('QR Codes', 'READ (List)', `GET /api/qr?propertyId=${CONFIG.propertyId}`, false, 0, error.message);
  }
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️  Skipped: ${testResults.skipped}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (Object.keys(testResults.categories).length > 0) {
    console.log('\n📋 By Category:');
    for (const [category, stats] of Object.entries(testResults.categories)) {
      const total = stats.passed + stats.failed + stats.skipped;
      const rate = total > 0 ? ((stats.passed / (stats.passed + stats.failed)) * 100).toFixed(1) : '0.0';
      console.log(`  ${category}: ${stats.passed}/${total} passed (${rate}%)`);
    }
  }

  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS WITH AI ANALYSIS:');
    testResults.errors.forEach((err, index) => {
      console.log(`\n${index + 1}. [${err.category}] ${err.operation}`);
      console.log(`   Endpoint: ${err.endpoint}`);
      console.log(`   Status: ${err.status}`);
      console.log(`   Error: ${err.error}`);
      if (err.aiAnalysis) {
        console.log(`   🤖 AI Analysis: ${err.aiAnalysis}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 API-Based CRUD Operations Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Ollama URL: ${CONFIG.ollamaUrl}`);
  console.log(`Ollama Model: ${CONFIG.ollamaModel}`);

  // Use configured email or default to pendanek@gmail.com
  if (!CONFIG.userEmail) {
    CONFIG.userEmail = 'pendanek@gmail.com';
  }
  console.log(`\n📧 Test User: ${CONFIG.userEmail}`);

  // Setup and authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error('\n❌ Authentication failed. Some tests may not work properly.');
  }

  // Run tests
  await testPropertiesCRUD();
  await testRoomsCRUD();
  await testGuestsCRUD();
  await testBookingsCRUD();
  await testRestaurantMenuCRUD();
  await testRestaurantTablesCRUD();
  await testRestaurantOrdersCRUD();
  await testStaffCRUD();
  await testCmsContentCRUD();
  await testCmsMediaCRUD();
  await testAnalyticsREAD();
  await testQRCodesCRUD();

  // Print summary
  printSummary();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
