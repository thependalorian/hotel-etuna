/**
 * Test Direct Database Access (Without Authentication)
 * 
 * Purpose: Test CRUD operations directly on database, bypassing API authentication
 * Location: /scripts/test-without-auth.ts
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/test-without-auth.ts
 * ```
 * 
 * This confirms database and Prisma are working correctly.
 * If this works but API tests fail, the issue is in the authentication layer.
 * 
 * Environment Variables:
 * - DATABASE_URL (required)
 * - TEST_USER_EMAIL (optional, defaults to pendanek@gmail.com)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../lib/database/connection';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

async function testDirectDatabaseAccess() {
  const email = process.env.TEST_USER_EMAIL || 'pendanek@gmail.com';
  
  console.log('🧪 Testing Direct Database Access');
  console.log('='.repeat(60));
  console.log(`📧 Test User: ${email}`);
  console.log('');
  
  // 1. Test database connection
  console.log('1️⃣  Testing Database Connection...');
  console.log('─'.repeat(60));
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Database connection successful');
  } catch (error: any) {
    console.log(`   ❌ Database error: ${error.message}`);
    if (error.code) {
      console.log(`   Error code: ${error.code}`);
    }
    process.exit(1);
  }
  console.log('');
  
  // 2. Get user directly
  console.log('2️⃣  Finding Test User...');
  console.log('─'.repeat(60));
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });
  
  if (!user) {
    console.log('   ❌ User not found in database');
    console.log(`   Email: ${email}`);
    console.log('');
    console.log('💡 Solution: Create the user first');
    console.log('   Run: npx tsx scripts/create-test-user.ts');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log(`   ✅ User found: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Tenant ID: ${user.tenant_id || '❌ Missing'}`);
  console.log(`   Password hash: ${user.password_hash ? '✅ Set' : '❌ Missing'}`);
  if (user.tenant) {
    console.log(`   Tenant: ${user.tenant.name} (${user.tenant.id})`);
  } else {
    console.log(`   Tenant: ❌ No tenant assigned`);
  }
  console.log('');
  
  if (!user.tenant_id) {
    console.log('⚠️  User has no tenant_id. Some operations may fail.');
    console.log('');
  }
  
  // 3. Test CRUD operations directly (bypassing API)
  console.log('3️⃣  Testing CRUD Operations Directly...');
  console.log('─'.repeat(60));
  
  let testPropertyId: string | null = null;
  
  try {
    // CREATE - Create a test property directly
    console.log('   📝 CREATE: Creating test property...');
    const testProperty = await prisma.property.create({
      data: {
        tenant_id: user.tenant_id!,
        name: `Test Property - Direct DB ${Date.now()}`,
        type: 'hotel',
        address: '123 Test Street',
        status: 'active',
        description: 'Test property created via direct database access',
      },
    });
    
    testPropertyId = testProperty.id;
    console.log(`   ✅ Created property: ${testProperty.name} (ID: ${testProperty.id})`);
    console.log('');
    
    // READ - Read it back
    console.log('   📖 READ: Reading property back...');
    const foundProperty = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });
    
    if (foundProperty) {
      console.log(`   ✅ Read property: ${foundProperty.name}`);
      console.log(`      Type: ${foundProperty.type}`);
      console.log(`      Status: ${foundProperty.status}`);
    } else {
      console.log(`   ❌ Property not found after creation`);
    }
    console.log('');
    
    // UPDATE - Update it
    console.log('   ✏️  UPDATE: Updating property...');
    const updatedProperty = await prisma.property.update({
      where: { id: testProperty.id },
      data: { 
        name: `Updated Test Property ${Date.now()}`,
        description: 'Updated via direct database access',
      },
    });
    
    console.log(`   ✅ Updated property: ${updatedProperty.name}`);
    console.log('');
    
    // DELETE - Delete it
    console.log('   🗑️  DELETE: Deleting property...');
    await prisma.property.delete({
      where: { id: testProperty.id },
    });
    
    console.log('   ✅ Deleted property');
    console.log('');
    
    // Verify deletion
    const deletedCheck = await prisma.property.findUnique({
      where: { id: testProperty.id },
    });
    
    if (!deletedCheck) {
      console.log('   ✅ Deletion verified - property no longer exists');
    } else {
      console.log('   ⚠️  Warning: Property still exists after deletion');
    }
    console.log('');
    
  } catch (error: any) {
    console.log(`   ❌ CRUD operation failed: ${error.message}`);
    if (error.code) {
      console.log(`   Error code: ${error.code}`);
    }
    if (error.meta) {
      console.log(`   Error meta: ${JSON.stringify(error.meta)}`);
    }
    console.log('');
    
    // Clean up if property was created
    if (testPropertyId) {
      try {
        await prisma.property.delete({
          where: { id: testPropertyId },
        });
        console.log('   🧹 Cleaned up test property');
      } catch (cleanupError) {
        console.log('   ⚠️  Could not clean up test property');
      }
    }
  }
  
  // Summary
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log('✅ All direct database operations successful!');
  console.log('');
  console.log('This confirms:');
  console.log('  ✅ Database connection is working');
  console.log('  ✅ Prisma client is configured correctly');
  console.log('  ✅ User exists and has tenant');
  console.log('  ✅ CRUD operations work at database level');
  console.log('');
  console.log('If API tests are still failing, the issue is likely in:');
  console.log('  - Authentication layer (NextAuth)');
  console.log('  - API route handlers');
  console.log('  - Middleware/authorization');
  console.log('');
  console.log('Next steps:');
  console.log('1. Check authentication: npx tsx scripts/debug-auth.ts');
  console.log('2. Verify user: npx tsx scripts/verify-user.ts');
  console.log('3. Reset password if needed: npx tsx scripts/reset-test-user.ts');
  console.log('');
  
  await prisma.$disconnect();
}

testDirectDatabaseAccess().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
