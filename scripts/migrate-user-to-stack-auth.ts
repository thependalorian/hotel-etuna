/**
 * Migrate User to Stack Auth
 * 
 * Purpose: Migrate existing Prisma users to Stack Auth
 * Location: /scripts/migrate-user-to-stack-auth.ts
 * 
 * This script:
 * 1. Reads user from Prisma database
 * 2. Creates user in Stack Auth with existing password hash (if compatible)
 * 3. Or creates user with temporary password requiring reset
 * 
 * Usage:
 *   tsx scripts/migrate-user-to-stack-auth.ts <email>
 *   Example: tsx scripts/migrate-user-to-stack-auth.ts pendanek@gmail.com
 */

// IMPORTANT: Load environment variables BEFORE importing stack.ts
// because stack.ts reads env vars at module load time
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables (load .env first, then .env.local to override)
const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath, override: true });

// Verify required environment variables
if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
  console.error('❌ NEXT_PUBLIC_STACK_PROJECT_ID is not set in environment variables');
  console.error(`   Checked: ${envPath}`);
  console.error(`   Checked: ${envLocalPath}`);
  process.exit(1);
}

// Now import stack.ts after env vars are loaded
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/database/connection';

async function migrateUserToStackAuth(email: string) {
  try {
    console.log(`\n🔄 Migrating user: ${email}\n`);

    // Step 1: Find user in Prisma database
    console.log('📋 Step 1: Finding user in database...');
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Tenant: ${user.tenant?.name || 'N/A'}`);
    console.log(`   Has password hash: ${!!user.password_hash}`);

    // Step 2: Check if user already exists in Stack Auth
    console.log('\n📋 Step 2: Checking if user exists in Stack Auth...');
    try {
      const existingUser = await stackServerApp.getUserByEmail(email);
      if (existingUser) {
        console.log(`⚠️  User already exists in Stack Auth:`);
        console.log(`   Stack Auth ID: ${existingUser.id}`);
        console.log(`   Email: ${existingUser.primaryEmail}`);
        console.log(`\n✅ User is already in Stack Auth. No migration needed.`);
        return;
      }
    } catch (error: any) {
      // User doesn't exist - that's fine, we'll create them
      console.log('✅ User does not exist in Stack Auth (will create)');
    }

    // Step 3: Create user in Stack Auth
    console.log('\n📋 Step 3: Creating user in Stack Auth...');
    console.log('⚠️  Note: Stack Auth only accepts plaintext passwords, not password hashes.');
    console.log('   We need the actual password to create the user.');
    
    // Check if password is provided as command line argument
    const providedPassword = process.argv[3];
    
    if (providedPassword) {
      console.log('✅ Password provided - creating user with actual password');
      
      // Verify password matches hash before creating in Stack Auth
      const bcryptjs = require('bcryptjs');
      const passwordMatch = await bcryptjs.compare(providedPassword, user.password_hash);
      
      if (!passwordMatch) {
        console.error('❌ Provided password does not match stored hash!');
        console.error('   Cannot create user in Stack Auth with incorrect password.');
        process.exit(1);
      }
      
      console.log('✅ Password verified - matches stored hash');
      
      // Create user with actual password
      // CRITICAL: primaryEmailAuthEnabled must be true for password login to work
      const stackUser = await stackServerApp.createUser({
        primaryEmail: user.email,
        displayName: user.name || user.email.split('@')[0],
        password: providedPassword,
        primaryEmailAuthEnabled: true, // REQUIRED for password authentication
        primaryEmailVerified: user.email_verified || false,
        clientMetadata: {
          tenant_id: user.tenant_id || undefined,
          role: user.role || undefined,
        },
      });

      console.log(`✅ User created in Stack Auth:`);
      console.log(`   Stack Auth ID: ${stackUser.id}`);
      console.log(`   Email: ${stackUser.primaryEmail}`);
      console.log(`   Display Name: ${stackUser.displayName}`);
      console.log(`\n🎉 Migration successful! User can now sign in with existing password.`);
    } else {
      console.log('⚠️  No password provided - creating user without password');
      console.log('   User will need to use "Forgot Password" to set password');
      
      // Create user without password (they'll need to reset)
      const stackUser = await stackServerApp.createUser({
        primaryEmail: user.email,
        displayName: user.name || user.email.split('@')[0],
        primaryEmailVerified: user.email_verified || false,
        clientMetadata: {
          tenant_id: user.tenant_id || undefined,
          role: user.role || undefined,
        },
      });

      console.log(`✅ User created in Stack Auth:`);
      console.log(`   Stack Auth ID: ${stackUser.id}`);
      console.log(`   Email: ${stackUser.primaryEmail}`);
      console.log(`   Display Name: ${stackUser.displayName}`);
      console.log(`\n⚠️  IMPORTANT: User must use "Forgot Password" to set password.`);
      console.log(`   Or run migration again with password: tsx scripts/migrate-user-to-stack-auth.ts ${email} <password>`);
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and optional password from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: tsx scripts/migrate-user-to-stack-auth.ts <email> [password]');
  console.error('   Example: tsx scripts/migrate-user-to-stack-auth.ts pendanek@gmail.com');
  console.error('   Example with password: tsx scripts/migrate-user-to-stack-auth.ts pendanek@gmail.com "password123"');
  console.error('');
  console.error('   Note: If password is provided, it will be verified against the stored hash');
  console.error('         before creating the user in Stack Auth.');
  process.exit(1);
}

// Run migration
migrateUserToStackAuth(email)
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
