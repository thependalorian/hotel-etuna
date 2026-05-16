/**
 * Authentication Flow Test Script
 * 
 * Purpose: Comprehensive testing of all authentication flows
 * Location: /scripts/test-auth-flow.ts
 * 
 * Tests:
 * 1. Account Registration
 * 2. Email Verification (OTP)
 * 3. Resend OTP
 * 4. Login
 * 5. Forgot Password
 * 6. Reset Password
 * 7. Password Change Notification
 * 
 * Usage: npx tsx scripts/test-auth-flow.ts
 */

import { prisma } from '../lib/database/connection';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@buffr-test.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, testFn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}...`);
    const result = await testFn();
    results.push({ test: name, passed: true, details: result });
    console.log(`✅ PASSED: ${name}`);
  } catch (error: any) {
    results.push({ test: name, passed: false, error: error.message });
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

async function cleanup(): Promise<void> {
  try {
    // Clean up test user
    const testUser = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (testUser) {
      // Delete related data
      await prisma.user.delete({
        where: { id: testUser.id },
      });
      console.log('🧹 Cleaned up test user');
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

async function main() {
  console.log('🚀 Starting Authentication Flow Tests\n');
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log(`Test Password: ${TEST_PASSWORD}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Account Registration
  await test('Account Registration', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Registration failed: ${data.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.requiresVerification) {
      throw new Error('Registration should require verification');
    }

    if (!data.user || !data.user.id) {
      throw new Error('User ID not returned');
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    if (!user.email_verification_otp) {
      throw new Error('OTP not generated');
    }

    if (!user.email_verification_otp_expires_at) {
      throw new Error('OTP expiration not set');
    }

    return {
      userId: data.user.id,
      email: data.user.email,
      hasOtp: !!user.email_verification_otp,
      otp: user.email_verification_otp,
    };
  });

  // Test 2: Check Email Verification Status
  let otp: string | null = null;
  await test('Check Email Verification Status', async () => {
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      select: {
        email_verified: true,
        email_verification_otp: true,
        email_verification_otp_expires_at: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.email_verified) {
      throw new Error('Email should not be verified yet');
    }

    if (!user.email_verification_otp) {
      throw new Error('OTP should exist');
    }

    otp = user.email_verification_otp;
    return {
      verified: user.email_verified,
      hasOtp: !!user.email_verification_otp,
      otpExpiresAt: user.email_verification_otp_expires_at,
    };
  });

  // Test 3: Email Verification
  await test('Email Verification with OTP', async () => {
    if (!otp) {
      throw new Error('OTP not available from previous test');
    }

    const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        otp: otp,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Verification failed: ${data.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.verified) {
      throw new Error('Email should be verified');
    }

    // Verify in database
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (!user?.email_verified) {
      throw new Error('Email not marked as verified in database');
    }

    if (user.email_verification_otp) {
      throw new Error('OTP should be cleared after verification');
    }

    return { verified: true };
  });

  // Test 4: Login (should work after verification)
  await test('Login After Verification', async () => {
    // Verify user is actually verified in database
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      include: { tenant: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.email_verified) {
      throw new Error('User should be verified after verification test');
    }

    // Test password comparison directly first
    const bcryptjs = await import('bcryptjs');
    const passwordMatch = await bcryptjs.default.compare(TEST_PASSWORD, user.password_hash);
    
    if (!passwordMatch) {
      throw new Error('Password comparison failed - password hash might be incorrect');
    }

    // Test the authorize function directly
    const { authOptions } = await import('../lib/auth/config');
    const credentialsProvider = authOptions.providers[0] as any;

    try {
      const result = await credentialsProvider.authorize({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }, {});

      if (!result) {
        // Check if user has tenant
        const userWithTenant = await prisma.user.findUnique({
          where: { email: TEST_EMAIL },
          include: { tenant: true },
        });
        throw new Error(`Login failed - authorize returned null. User has tenant: ${!!userWithTenant?.tenant}, Tenant ID: ${userWithTenant?.tenant_id}`);
      }
      
      if (!result.id || !result.email) {
        throw new Error('Invalid user object returned');
      }

      if (result.email !== TEST_EMAIL) {
        throw new Error('Email mismatch');
      }

      return {
        userId: result.id,
        email: result.email,
        role: result.role,
      };
    } catch (error: any) {
      throw new Error(`Authorize function error: ${error.message}`);
    }

    if (!result.id || !result.email) {
      throw new Error('Invalid user object returned');
    }

    if (result.email !== TEST_EMAIL) {
      throw new Error('Email mismatch');
    }

    return {
      userId: result.id,
      email: result.email,
      role: result.role,
    };
  });

  // Test 5: Resend OTP (for unverified account scenario)
  await test('Resend OTP', async () => {
    // Create a new test user for this
    const resendTestEmail = `resend-${Date.now()}@buffr-test.com`;
    
    // Register user
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Resend Test',
        email: resendTestEmail,
        password: TEST_PASSWORD,
      }),
    });

    // Get initial OTP
    const userBefore = await prisma.user.findUnique({
      where: { email: resendTestEmail },
    });
    const initialOtp = userBefore?.email_verification_otp;

    // Resend OTP
    const response = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: resendTestEmail,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Resend failed: ${data.message || response.statusText}`);
    }

    // Verify new OTP was generated
    const userAfter = await prisma.user.findUnique({
      where: { email: resendTestEmail },
    });

    if (!userAfter?.email_verification_otp) {
      throw new Error('New OTP not generated');
    }

    if (userAfter.email_verification_otp === initialOtp) {
      throw new Error('OTP should be different after resend');
    }

    // Cleanup
    await prisma.user.delete({
      where: { id: userAfter.id },
    });

    return { otpRegenerated: true };
  });

  // Test 6: Forgot Password
  let resetToken: string | null = null;
  await test('Forgot Password Request', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Forgot password failed: ${data.message || response.statusText}`);
    }

    // Verify reset token was generated
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (!user?.password_reset_token) {
      throw new Error('Reset token not generated');
    }

    if (!user.password_reset_token_expires_at) {
      throw new Error('Reset token expiration not set');
    }

    resetToken = user.password_reset_token;
    return { tokenGenerated: true };
  });

  // Test 7: Reset Password
  const NEW_PASSWORD = 'NewPassword123!';
  await test('Reset Password', async () => {
    if (!resetToken) {
      throw new Error('Reset token not available from previous test');
    }

    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: NEW_PASSWORD,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Reset password failed: ${data.message || response.statusText}`);
    }

    // Verify password was changed
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify reset token was cleared
    if (user.password_reset_token) {
      throw new Error('Reset token should be cleared after use');
    }

    // Verify password was changed by checking the hash changed
    const userAfterReset = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      select: { password_hash: true },
    });

    if (!userAfterReset) {
      throw new Error('User not found after reset');
    }

    // Verify password was changed by testing password comparison directly
    const bcryptjs = await import('bcryptjs');
    
    // Old password should NOT work
    const oldPasswordMatch = await bcryptjs.default.compare(TEST_PASSWORD, userAfterReset.password_hash);
    if (oldPasswordMatch) {
      throw new Error('Old password should not work after reset');
    }

    // New password SHOULD work
    const newPasswordMatch = await bcryptjs.default.compare(NEW_PASSWORD, userAfterReset.password_hash);
    if (!newPasswordMatch) {
      throw new Error('New password should work - password hash comparison failed');
    }

    // Also test via authorize function
    const { authOptions } = await import('../lib/auth/config');
    const credentialsProvider = authOptions.providers[0] as any;

    const oldPasswordResult = await credentialsProvider.authorize({
      email: TEST_EMAIL,
      password: TEST_PASSWORD, // Old password
    }, {});

    if (oldPasswordResult) {
      throw new Error('Old password should not work via authorize function');
    }

    // Verify new password works via authorize
    const newPasswordResult = await credentialsProvider.authorize({
      email: TEST_EMAIL,
      password: NEW_PASSWORD, // New password
    }, {});

    if (!newPasswordResult) {
      throw new Error('New password should work via authorize function');
    }

    return { passwordChanged: true };
  });

  // Test 8: Check Email Verified Status
  await test('Check Email Verified API', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/check-email-verified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Check failed: ${data.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.verified) {
      throw new Error('Email should be verified');
    }

    return data;
  });

  // Test 9: Invalid OTP
  await test('Invalid OTP Rejection', async () => {
    const invalidEmail = `invalid-${Date.now()}@buffr-test.com`;
    
    // Register user
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Test',
        email: invalidEmail,
        password: TEST_PASSWORD,
      }),
    });

    // Try invalid OTP
    const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: invalidEmail,
        otp: '000000', // Invalid OTP
      }),
    });

    if (response.ok) {
      throw new Error('Invalid OTP should be rejected');
    }

    // Cleanup
    const user = await prisma.user.findUnique({
      where: { email: invalidEmail },
    });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }

    return { invalidOtpRejected: true };
  });

  // Test 10: Expired OTP
  await test('Expired OTP Rejection', async () => {
    const expiredEmail = `expired-${Date.now()}@buffr-test.com`;
    
    // Register user
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Expired Test',
        email: expiredEmail,
        password: TEST_PASSWORD,
      }),
    });

    // Manually expire the OTP
    const user = await prisma.user.findUnique({
      where: { email: expiredEmail },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email_verification_otp_expires_at: new Date(Date.now() - 1000), // Expired
        },
      });

      // Try expired OTP
      const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: expiredEmail,
          otp: user.email_verification_otp || '000000',
        }),
      });

      if (response.ok) {
        throw new Error('Expired OTP should be rejected');
      }

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    }

    return { expiredOtpRejected: true };
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.test}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');

  // Cleanup
  await cleanup();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Test script error:', error);
  cleanup().finally(() => process.exit(1));
});
