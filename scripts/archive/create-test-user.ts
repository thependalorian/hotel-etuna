/**
 * Create Test User
 * 
 * Purpose: Create a new test user with tenant for API testing
 * Location: /scripts/create-test-user.ts
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/create-test-user.ts
 * ```
 * 
 * Environment Variables:
 * - DATABASE_URL (required)
 * - TEST_USER_EMAIL (optional, defaults to test@example.com)
 * - TEST_USER_PASSWORD (optional, defaults to TestPassword123!)
 * - TEST_TENANT_NAME (optional, defaults to Test Tenant)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { hash } from 'bcryptjs';
import { prisma } from '../lib/database/connection';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

async function createTestUser() {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
  const tenantName = process.env.TEST_TENANT_NAME || 'Test Tenant';
  
  console.log('👤 Creating Test User');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`🏢 Tenant: ${tenantName}`);
  console.log('');
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log(`⚠️  User already exists: ${email}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log('');
      console.log('💡 Options:');
      console.log('   1. Use existing user: npx tsx scripts/reset-test-user.ts');
      console.log('   2. Delete and recreate (manual):');
      console.log(`      DELETE FROM "User" WHERE email = '${email}';`);
      process.exit(1);
    }
    
    // Create tenant first
    console.log('🏢 Creating tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        email: email,
      },
    });
    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);
    console.log('');
    
    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await hash(password, 10);
    console.log(`✅ Password hashed`);
    console.log('');
    
    // Create user
    console.log('👤 Creating user...');
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        tenant_id: tenant.id,
        role: 'owner',
        email_verified: true,
        emailVerified: new Date(),
        first_name: 'Test',
        last_name: 'User',
      },
    });
    
    console.log(`✅ User created: ${user.email} (${user.id})`);
    console.log('');
    
    // Summary
    console.log('📋 Summary');
    console.log('='.repeat(60));
    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Tenant: ${tenant.name} (${tenant.id})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify user: npx tsx scripts/verify-user.ts');
    console.log('2. Test authentication: npx tsx scripts/debug-auth.ts');
    console.log(`3. Run API tests: TEST_USER_EMAIL="${email}" TEST_USER_PASSWORD="${password}" npm run test:api`);
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Error creating test user:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.meta) {
      console.error(`   Error meta: ${JSON.stringify(error.meta)}`);
    }
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
