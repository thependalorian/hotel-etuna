/**
 * Debug Authentication Flow
 * 
 * Purpose: Debug NextAuth authentication flow step by step
 * Location: /scripts/debug-auth.ts
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/debug-auth.ts
 * ```
 * 
 * Environment Variables:
 * - BASE_URL (optional, defaults to http://localhost:3000)
 * - TEST_USER_EMAIL (optional, defaults to pendanek@gmail.com)
 * - TEST_USER_PASSWORD (required)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as https from 'https';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const email = process.env.TEST_USER_EMAIL || 'pendanek@gmail.com';
const password = process.env.TEST_USER_PASSWORD || '';

// Create agent that ignores SSL errors (for localhost)
const agent = new https.Agent({ rejectUnauthorized: false });

async function debugAuth() {
  console.log('🔍 Debugging Authentication Flow');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password ? '*'.repeat(password.length) : '❌ NOT SET'}`);
  console.log('');
  
  if (!password) {
    console.error('❌ TEST_USER_PASSWORD is required');
    console.error('   Set it with: export TEST_USER_PASSWORD="your-password"');
    console.error('   Or run: TEST_USER_PASSWORD="your-password" npx tsx scripts/debug-auth.ts');
    process.exit(1);
  }
  
  // Step 1: Check if API is accessible
  console.log('1️⃣  Checking API Health...');
  console.log('─'.repeat(60));
  try {
    const health = await fetch(`${BASE_URL}/api/health`, { 
      agent: BASE_URL.startsWith('https') ? agent : undefined,
    } as any);
    console.log(`   Status: ${health.status} ${health.statusText}`);
    if (health.ok) {
      const data = await health.json().catch(() => ({}));
      console.log(`   ✅ API is accessible`);
      if (Object.keys(data).length > 0) {
        console.log(`   Response: ${JSON.stringify(data)}`);
      }
    } else {
      console.log(`   ⚠️  API returned non-OK status`);
    }
  } catch (error: any) {
    console.log(`   ❌ API not accessible: ${error.message}`);
    console.log(`   💡 Make sure the dev server is running: npm run dev`);
    return;
  }
  console.log('');
  
  // Step 2: Check CSRF endpoint
  console.log('2️⃣  Checking CSRF Token...');
  console.log('─'.repeat(60));
  let csrfToken: string | null = null;
  try {
    const csrf = await fetch(`${BASE_URL}/api/auth/csrf`, {
      agent: BASE_URL.startsWith('https') ? agent : undefined,
    } as any);
    console.log(`   Status: ${csrf.status} ${csrf.statusText}`);
    
    if (csrf.ok) {
      const csrfData = await csrf.json();
      csrfToken = csrfData.csrfToken || null;
      if (csrfToken) {
        console.log(`   ✅ CSRF Token received: ${csrfToken.substring(0, 20)}...`);
      } else {
        console.log(`   ❌ No CSRF token in response`);
        console.log(`   Response: ${JSON.stringify(csrfData)}`);
      }
    } else {
      const text = await csrf.text();
      console.log(`   ❌ CSRF request failed`);
      console.log(`   Response: ${text.substring(0, 200)}`);
    }
  } catch (error: any) {
    console.log(`   ❌ CSRF error: ${error.message}`);
  }
  console.log('');
  
  // Step 3: Try sign-in
  console.log('3️⃣  Attempting Sign-In...');
  console.log('─'.repeat(60));
  
  if (!csrfToken) {
    console.log('   ⚠️  Skipping sign-in - no CSRF token');
  } else {
    const formData = new URLSearchParams();
    formData.append('csrfToken', csrfToken);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('redirect', 'false');
    formData.append('callbackUrl', `${BASE_URL}/properties`);
    formData.append('json', 'true');
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        agent: BASE_URL.startsWith('https') ? agent : undefined,
        redirect: 'manual',
      } as any);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers:`);
      const headers = Object.fromEntries(response.headers.entries());
      Object.entries(headers).forEach(([key, value]) => {
        if (key.toLowerCase() === 'set-cookie') {
          console.log(`      ${key}: ${(value as string).substring(0, 100)}...`);
        } else {
          console.log(`      ${key}: ${value}`);
        }
      });
      console.log('');
      
      const contentType = response.headers.get('content-type') || '';
      let responseBody: any = {};
      
      if (contentType.includes('application/json')) {
        responseBody = await response.json();
        console.log(`   Response Body (JSON):`);
        console.log(JSON.stringify(responseBody, null, 2));
      } else {
        const text = await response.text();
        console.log(`   Response Body (Text, first 500 chars):`);
        console.log(text.substring(0, 500));
        if (text.length > 500) {
          console.log(`   ... (truncated, total length: ${text.length})`);
        }
      }
      console.log('');
      
      // Check for session cookie
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log('   🍪 Set-Cookie Header Found:');
        const sessionMatch = setCookie.match(/next-auth\.session-token=([^;,\s]+)/);
        if (sessionMatch) {
          const sessionToken = sessionMatch[1];
          console.log(`   ✅ Session token extracted: ${sessionToken.substring(0, 30)}...`);
          console.log(`   📋 Use this in tests: next-auth.session-token=${sessionToken}`);
        } else {
          console.log(`   ⚠️  Could not extract session token from cookie`);
          console.log(`   Cookie header: ${setCookie.substring(0, 200)}`);
        }
      } else {
        console.log('   ❌ No Set-Cookie header in response');
      }
      
      // Analyze response
      if (response.status === 200) {
        if (responseBody.error || responseBody.url?.includes('signin')) {
          console.log('');
          console.log('   ❌ Sign-in failed (redirected to signin)');
          console.log(`   Error: ${responseBody.error || 'Unknown error'}`);
          console.log(`   URL: ${responseBody.url || 'N/A'}`);
        } else {
          console.log('');
          console.log('   ✅ Sign-in appears successful!');
        }
      } else if (response.status === 302) {
        const location = response.headers.get('location') || '';
        console.log('');
        console.log(`   ⚠️  Redirected to: ${location}`);
        if (location.includes('signin') || location.includes('csrf')) {
          console.log('   ❌ Authentication failed - redirected to signin');
        } else {
          console.log('   ✅ Authentication successful - redirected to callback');
        }
      } else {
        console.log('');
        console.log(`   ❌ Unexpected status: ${response.status}`);
      }
      
    } catch (error: any) {
      console.log(`   ❌ Sign-in error: ${error.message}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
    }
  }
  console.log('');
  
  // Step 4: Check session
  console.log('4️⃣  Checking Session...');
  console.log('─'.repeat(60));
  try {
    const session = await fetch(`${BASE_URL}/api/auth/session`, {
      agent: BASE_URL.startsWith('https') ? agent : undefined,
    } as any);
    console.log(`   Status: ${session.status} ${session.statusText}`);
    
    if (session.ok) {
      const sessionData = await session.json();
      if (sessionData && sessionData.user) {
        console.log(`   ✅ Active session found`);
        console.log(`   User: ${sessionData.user.email || 'N/A'}`);
        console.log(`   Role: ${sessionData.user.role || 'N/A'}`);
        console.log(`   Tenant ID: ${sessionData.user.tenantId || 'N/A'}`);
        console.log(`   Full session: ${JSON.stringify(sessionData, null, 2)}`);
      } else {
        console.log(`   ⚠️  No active session`);
        console.log(`   Response: ${JSON.stringify(sessionData)}`);
      }
    } else {
      const text = await session.text();
      console.log(`   ❌ Session check failed`);
      console.log(`   Response: ${text.substring(0, 200)}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Session error: ${error.message}`);
  }
  console.log('');
  
  // Summary
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log('Next steps:');
  console.log('1. If authentication failed, check:');
  console.log('   - Password is correct: npx tsx scripts/verify-user.ts');
  console.log('   - Reset password: npx tsx scripts/reset-test-user.ts');
  console.log('   - Check NextAuth logs in dev server console');
  console.log('');
  console.log('2. If authentication succeeded, run:');
  console.log(`   TEST_USER_PASSWORD="${password}" npm run test:api`);
  console.log('');
}

debugAuth().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
