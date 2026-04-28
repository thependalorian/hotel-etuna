/**
 * Reset Test User Password
 * 
 * Purpose: Reset password for test user with proper bcrypt hash
 * Location: /scripts/reset-test-user.ts
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/reset-test-user.ts
 * ```
 * 
 * Environment Variables:
 * - DATABASE_URL (required)
 * - TEST_USER_EMAIL (optional, defaults to pendanek@gmail.com)
 * - TEST_USER_PASSWORD (optional, defaults to 02Ally27PP123Lubi@)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { hash } from 'bcryptjs';
import { prisma } from '../lib/database/connection';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

async function resetTestUserPassword() {
  const email = process.env.TEST_USER_EMAIL || 'pendanek@gmail.com';
  const newPassword = process.env.TEST_USER_PASSWORD || '02Ally27PP123Lubi@';
  
  console.log('🔐 Resetting Test User Password');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 New Password: ${newPassword}`);
  console.log('');
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.error('   Please ensure the user exists in the database.');
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Tenant: ${user.tenant ? user.tenant.name : '❌ No tenant'}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    
    if (!user.tenant) {
      console.error('❌ User has no tenant. Cannot proceed.');
      process.exit(1);
    }
    
    // Generate bcrypt hash with 10 rounds (same as NextAuth config)
    console.log('🔐 Generating bcrypt hash (10 rounds)...');
    const hashedPassword = await hash(newPassword, 10);
    console.log(`✅ Hash generated: ${hashedPassword.substring(0, 30)}...`);
    console.log('');
    
    // Update user in database
    console.log('💾 Updating user in database...');
    await prisma.user.update({
      where: { email },
      data: { 
        password_hash: hashedPassword,
        email_verified: true, // Mark email as verified
        emailVerified: new Date(), // Also set emailVerified timestamp
      },
    });
    
    console.log('✅ Password updated successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`   Hash: ${hashedPassword.substring(0, 30)}...`);
    console.log(`   Email Verified: ✅`);
    console.log('');
    console.log('🎉 Ready to test authentication!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npx tsx scripts/verify-user.ts');
    console.log('2. Run: npx tsx scripts/debug-auth.ts');
    console.log('3. Run: TEST_USER_PASSWORD="' + newPassword + '" npm run test:api');
    
  } catch (error: any) {
    console.error('❌ Error updating password:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestUserPassword();
