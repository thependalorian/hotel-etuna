/**
 * @fileoverview API route //api/debug/auth
 * Location: /app/api/debug/auth/route.ts
 */

/**
 * Debug Auth Endpoint
 * 
 * Purpose: Debug Stack Auth token verification (DEVELOPMENT ONLY)
 * Location: /app/api/debug/auth/route.ts
 * 
 * SECURITY: Disabled in production to prevent information disclosure
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';

export async function GET(request: NextRequest) {
  // Security: Disable debug endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const cookies = request.headers.get('cookie') || '';
  
  const debug: any = {
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer [token]' : authHeader) : null,
    hasCookie: !!cookies,
    cookieValue: cookies ? cookies.substring(0, 100) + '...' : null,
    stackAuthConfigured: !!(process.env.NEXT_PUBLIC_STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY),
  };
  
  // Try to get user from session cookies
  if (stackServerApp) {
    try {
      const sessionUser = await stackServerApp.getUser({ tokenStore: request });
      debug.sessionUser = sessionUser ? {
        id: sessionUser.id,
        primaryEmail: sessionUser.primaryEmail,
      } : null;
    } catch (error: any) {
      debug.sessionUserError = error.message;
    }
  } else {
    debug.sessionUserError = 'Stack Auth not configured';
  }
  
  // Try to extract and verify access token
  let accessToken: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.replace('Bearer ', '').trim();
  } else if (cookies) {
    const match = cookies.match(/stack-access-token=([^;\s]+)/);
    if (match && match[1]) {
      accessToken = decodeURIComponent(match[1].trim());
    }
  }
  
  debug.extractedToken = accessToken ? `${accessToken.substring(0, 20)}...` : null;
  
  if (accessToken) {
    try {
      const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!;
      const secretServerKey = process.env.STACK_SECRET_SERVER_KEY!;
      
      debug.tokenLength = accessToken.length;
      debug.tokenPrefix = accessToken.substring(0, 20);
      
      // Try JWT verification
      try {
        const { jwtVerify } = await import('jose');
        const { jwks } = await import('@/lib/auth/jwks');
        
        try {
          const { payload } = await jwtVerify(accessToken, jwks, {
            issuer: `https://api.stack-auth.com`,
          });
          debug.jwtVerification = 'success';
          debug.jwtPayload = {
            sub: payload.sub,
            email: payload.email,
            iss: payload.iss,
            exp: payload.exp,
            iat: payload.iat,
          };
        } catch (jwtError: any) {
          debug.jwtVerification = 'failed';
          debug.jwtError = {
            code: jwtError.code,
            message: jwtError.message,
          };
          
          // Try without issuer validation
          try {
            const { payload } = await jwtVerify(accessToken, jwks);
            debug.jwtVerificationWithoutIssuer = 'success';
            debug.jwtPayload = {
              sub: payload.sub,
              email: payload.email,
              iss: payload.iss,
              exp: payload.exp,
              iat: payload.iat,
            };
          } catch (jwtError2: any) {
            debug.jwtVerificationWithoutIssuer = 'failed';
            debug.jwtError2 = {
              code: jwtError2.code,
              message: jwtError2.message,
            };
          }
        }
      } catch (importError: any) {
        debug.jwtImportError = importError.message;
      }
      
      // Try REST API verification
      const userResponse = await fetch(`https://api.stack-auth.com/api/v1/users/me`, {
        method: 'GET',
        headers: {
          'X-Stack-Access-Type': 'server',
          'X-Stack-Project-Id': projectId,
          'X-Stack-Secret-Server-Key': secretServerKey,
          'X-Stack-Access-Token': accessToken,
        },
      });
      
      debug.restApiStatus = userResponse.status;
      debug.restApiStatusText = userResponse.statusText;
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        debug.restApiUser = {
          id: userData.id,
          primaryEmail: userData.primaryEmail,
        };
      } else {
        const errorText = await userResponse.text();
        debug.restApiError = errorText.substring(0, 500);
      }
    } catch (error: any) {
      debug.restApiException = error.message;
      debug.restApiExceptionStack = error.stack?.substring(0, 200);
    }
  }
  
  return NextResponse.json({ debug }, { status: 200 });
}
