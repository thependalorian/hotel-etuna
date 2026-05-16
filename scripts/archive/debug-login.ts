/**
 * Debug Login Script
 * 
 * This script helps diagnose login issues by testing the authentication flow
 * and checking for common problems.
 */

import { prisma } from '../lib/database/connection';
import bcryptjs from 'bcryptjs';

async function debugLogin(email: string) {
  console.log('\n=== LOGIN DEBUGGING ===\n');
  console.log(`Email: ${email}\n`);

  try {
    // Step 1: Check if user exists
    console.log('Step 1: Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    console.log('✅ User found');

    // Step 2: Check tenant
    console.log('\nStep 2: Checking tenant...');
    if (!user.tenant) {
      console.log('❌ User has no tenant - THIS WILL BLOCK LOGIN');
      console.log(`   Tenant ID in user record: ${user.tenant_id}`);
      console.log('   Fix: Create or link a tenant for this user');
      return;
    }
    console.log('✅ Tenant exists:', user.tenant.name);

    // Step 3: Check email verification
    console.log('\nStep 3: Checking email verification...');
    console.log(`   Email Verified: ${user.email_verified ? '✅' : '❌'}`);
    console.log(`   Has OTP: ${user.email_verification_otp ? 'Yes' : 'No'}`);
    
    if (!user.email_verified && !user.email_verification_otp) {
      console.log('   ⚠️  Old account - will auto-verify on login');
    } else if (!user.email_verified) {
      console.log('   ⚠️  Email not verified - user needs to verify');
    }

    // Step 4: Check password hash
    console.log('\nStep 4: Checking password hash...');
    if (!user.password_hash) {
      console.log('❌ No password hash - user cannot login');
      return;
    }
    console.log('✅ Password hash exists');

    // Step 5: Check role
    console.log('\nStep 5: Checking user role...');
    console.log(`   Role: ${user.role}`);
    if (!user.role) {
      console.log('   ⚠️  No role set - default will be "owner"');
    }

    // Step 6: Check property (for owners)
    if (user.role === 'owner') {
      console.log('\nStep 6: Checking property (owner)...');
      const property = await prisma.property.findFirst({
        where: {
          owner_id: user.id,
          tenant_id: user.tenant_id,
        },
        select: { id: true },
      });
      if (property) {
        console.log('✅ Property found');
      } else {
        console.log('⚠️  No property found (optional for login)');
      }
    }

    // Step 7: Check environment variables
    console.log('\nStep 7: Checking environment variables...');
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    console.log(`   NEXTAUTH_SECRET: ${nextAuthSecret ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NEXTAUTH_URL: ${nextAuthUrl || 'Not set (will use default)'}`);

    if (!nextAuthSecret) {
      console.log('\n❌ NEXTAUTH_SECRET is missing - this will cause login failures!');
      console.log('   Fix: Set NEXTAUTH_SECRET in your .env.local file');
    }

    console.log('\n✅ All checks passed!');
    console.log('\nIf login still fails, check:');
    console.log('  1. Browser console for errors');
    console.log('  2. Server logs for [AUTH] messages');
    console.log('  3. Network tab for failed requests');
    console.log('  4. Cookies - check if session cookie is being set');

  } catch (error: any) {
    console.error('\n❌ Error during debugging:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'george@buffr.ai';
debugLogin(email);
