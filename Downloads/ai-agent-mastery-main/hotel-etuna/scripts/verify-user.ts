/**
 * Verify User Structure
 * 
 * Purpose: Verify test user has all required fields and tenant
 * Location: /scripts/verify-user.ts
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/verify-user.ts
 * ```
 * 
 * Environment Variables:
 * - DATABASE_URL (required)
 * - TEST_USER_EMAIL (optional, defaults to pendanek@gmail.com)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../lib/database/connection';
import bcryptjs from 'bcryptjs';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

async function verifyUser() {
  const email = process.env.TEST_USER_EMAIL || 'pendanek@gmail.com';
  const testPassword = process.env.TEST_USER_PASSWORD || '02Ally27PP123Lubi@';
  
  console.log('🔍 Verifying User Structure');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${email}`);
  console.log('');
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        tenant: true,
        properties: {
          take: 1,
          select: { id: true, name: true },
        },
      },
    });
    
    if (!user) {
      console.error('❌ User not found');
      console.error(`   Email: ${email}`);
      console.error('');
      console.error('💡 Solution: Create the user first');
      console.error('   Run: npx tsx scripts/create-test-user.ts');
      process.exit(1);
    }
    
    console.log('✅ User Found');
    console.log('─'.repeat(60));
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Not set');
    console.log(`   Role: ${user.role || 'Not set'}`);
    console.log('');
    
    // Check password hash
    console.log('🔐 Password Hash:');
    if (user.password_hash) {
      console.log(`   ✅ Set (length: ${user.password_hash.length})`);
      console.log(`   Preview: ${user.password_hash.substring(0, 30)}...`);
      
      // Test password comparison
      try {
        const passwordMatch = await bcryptjs.compare(testPassword, user.password_hash);
        if (passwordMatch) {
          console.log(`   ✅ Password matches test password`);
        } else {
          console.log(`   ❌ Password does NOT match test password`);
          console.log(`   💡 Run: npx tsx scripts/reset-test-user.ts`);
        }
      } catch (error: any) {
        console.log(`   ⚠️  Could not verify password: ${error.message}`);
      }
    } else {
      console.log(`   ❌ Missing`);
      console.log(`   💡 Run: npx tsx scripts/reset-test-user.ts`);
    }
    console.log('');
    
    // Check email verification
    console.log('📧 Email Verification:');
    console.log(`   Verified: ${user.email_verified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Verified At: ${user.emailVerified ? user.emailVerified.toISOString() : 'Not set'}`);
    console.log(`   OTP: ${user.email_verification_otp ? 'Set' : 'Not set'}`);
    console.log('');
    
    // Check tenant
    console.log('🏢 Tenant:');
    if (user.tenant) {
      console.log(`   ✅ Tenant found`);
      console.log(`   ID: ${user.tenant.id}`);
      console.log(`   Name: ${user.tenant.name}`);
      console.log(`   Email: ${user.tenant.email || 'Not set'}`);
    } else {
      console.log(`   ❌ No tenant assigned`);
      console.log(`   💡 User must have a tenant to authenticate`);
    }
    console.log('');
    
    // Check tenant_id
    console.log('🔗 Tenant ID:');
    if (user.tenant_id) {
      console.log(`   ✅ Set: ${user.tenant_id}`);
      if (user.tenant && user.tenant_id !== user.tenant.id) {
        console.log(`   ⚠️  WARNING: tenant_id doesn't match tenant.id`);
      }
    } else {
      console.log(`   ❌ Missing`);
    }
    console.log('');
    
    // Check properties
    console.log('🏨 Properties:');
    if (user.properties && user.properties.length > 0) {
      console.log(`   ✅ Found ${user.properties.length} property(ies)`);
      user.properties.forEach((prop: any) => {
        console.log(`      - ${prop.name} (${prop.id})`);
      });
    } else {
      console.log(`   ℹ️  No properties (this is OK for testing)`);
    }
    console.log('');
    
    // Overall status
    console.log('📊 Overall Status:');
    const checks = {
      'User exists': !!user,
      'Password hash set': !!user.password_hash,
      'Email verified': !!user.email_verified,
      'Tenant exists': !!user.tenant,
      'Tenant ID set': !!user.tenant_id,
    };
    
    const allPassed = Object.values(checks).every(v => v);
    
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    console.log('');
    
    if (allPassed) {
      console.log('🎉 All checks passed! User is ready for authentication.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Test authentication: npx tsx scripts/debug-auth.ts');
      console.log('2. Run API tests: TEST_USER_PASSWORD="' + testPassword + '" npm run test:api');
    } else {
      console.log('⚠️  Some checks failed. Please fix the issues above.');
      console.log('');
      console.log('Quick fixes:');
      if (!user.password_hash) {
        console.log('   - Reset password: npx tsx scripts/reset-test-user.ts');
      }
      if (!user.tenant) {
        console.log('   - User needs a tenant. Check database for tenant assignment.');
      }
    }
    
    // Also check tenant count
    const tenantCount = await prisma.tenant.count();
    console.log('');
    console.log(`📊 Database Stats:`);
    console.log(`   Total Tenants: ${tenantCount}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();
