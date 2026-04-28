/**
 * Sofia CRUD Operations Test Script
 * 
 * Purpose: Test all Create, Read, Update, Delete operations for Sofia AI
 * Location: /scripts/test-sofia-crud.ts
 * 
 * Tests:
 * - AI Conversations (Create, Read, Update, Delete)
 * - AI Messages (Create, Read, Update, Delete)
 * - Sofia Email Logs (Create, Read)
 * - Knowledge Base (Read operations)
 * - Sofia Concierge Service (Message processing)
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/test-sofia-crud.ts
 * ```
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../lib/database/connection';
import { SofiaConciergeService } from '../lib/services/ai/SofiaConciergeService';
import { KnowledgeBaseService } from '../lib/services/ai/KnowledgeBaseService';
import { DataFilterService } from '../lib/services/ai/DataFilterService';
import { EmailService } from '../lib/services/sofia/EmailService';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

// Test configuration
const TEST_CONFIG = {
  tenantId: '00000000-0000-0000-0000-000000000000', // Test tenant ID
  propertyId: '', // Will be set from first property
  guestId: '', // Will be set from first guest
  sessionId: `test_session_${Date.now()}`,
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  errors: [] as string[],
};

function logTest(name: string, passed: boolean, error?: string) {
  if (passed) {
    console.log(`✅ ${name}`);
    testResults.passed++;
  } else {
    console.error(`❌ ${name}`);
    if (error) {
      console.error(`   Error: ${error}`);
      testResults.errors.push(`${name}: ${error}`);
    }
    testResults.failed++;
  }
}

async function testSetup() {
  console.log('\n🔧 Setting up test environment...\n');

  try {
    // Get first tenant or create test tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('⚠️  No tenant found, creating test tenant...');
      tenant = await prisma.tenant.create({
        data: {
          id: TEST_CONFIG.tenantId,
          name: 'Test Tenant',
          status: 'active',
        },
      });
      console.log(`✓ Created test tenant: ${tenant.name} (${tenant.id})`);
    } else {
      TEST_CONFIG.tenantId = tenant.id;
      console.log(`✓ Using tenant: ${tenant.name} (${tenant.id})`);
    }

    // Get first property
    const property = await prisma.property.findFirst({
      where: { tenant_id: TEST_CONFIG.tenantId },
    });
    if (property) {
      TEST_CONFIG.propertyId = property.id;
      console.log(`✓ Using property: ${property.name} (${property.id})`);
    } else {
      console.warn('⚠️  No property found, some tests will be skipped');
    }

    // Get first guest
    const guest = await prisma.guest.findFirst({
      where: { tenant_id: TEST_CONFIG.tenantId },
    });
    if (guest) {
      TEST_CONFIG.guestId = guest.id;
      console.log(`✓ Using guest: ${guest.first_name} ${guest.last_name} (${guest.id})`);
    } else {
      console.warn('⚠️  No guest found, some tests will be skipped');
    }

    console.log(`✓ Test session ID: ${TEST_CONFIG.sessionId}\n`);
    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

// ============================================
// CREATE OPERATIONS
// ============================================

async function testCreateConversation() {
  console.log('📝 Testing CREATE: AI Conversation...');
  try {
    const conversation = await prisma.aiConversation.create({
      data: {
        tenant_id: TEST_CONFIG.tenantId,
        guest_id: TEST_CONFIG.guestId || undefined,
        session_id: TEST_CONFIG.sessionId,
        channel: 'WEB',
        status: 'ACTIVE',
      },
    });

    logTest('Create AI Conversation', !!conversation.id);
    return conversation.id;
  } catch (error: any) {
    logTest('Create AI Conversation', false, error.message);
    return null;
  }
}

async function testCreateMessage(conversationId: string) {
  console.log('📝 Testing CREATE: AI Message...');
  try {
    const message = await prisma.aiMessage.create({
      data: {
        conversation_id: conversationId,
        sender_type: 'USER',
        sender_id: TEST_CONFIG.guestId || TEST_CONFIG.sessionId,
        content: 'Hello, Sofia! This is a test message.',
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      },
    });

    logTest('Create AI Message', !!message.id);
    return message.id;
  } catch (error: any) {
    logTest('Create AI Message', false, error.message);
    return null;
  }
}

async function testCreateEmailLog() {
  console.log('📝 Testing CREATE: Sofia Email Log...');
  try {
    // Check if table exists first
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sofia_email_logs'
      ) as exists
    `;

    if (!tableExists[0]?.exists) {
      logTest('Create Sofia Email Log', false, 'Table sofia_email_logs does not exist. Run migration first.');
      return null;
    }

    const emailLog = await prisma.sofiaEmailLog.create({
      data: {
        id: uuidv4(),
        tenant_id: TEST_CONFIG.tenantId,
        recipient_email: 'test@example.com',
        recipient_name: 'Test User',
        subject: 'Test Email from Sofia',
        html_content: '<p>This is a test email</p>',
        text_content: 'This is a test email',
        status: 'sent',
        sent_at: new Date(),
        metadata: {
          test: true,
        },
      },
    });

    logTest('Create Sofia Email Log', !!emailLog.id);
    return emailLog.id;
  } catch (error: any) {
    logTest('Create Sofia Email Log', false, error.message);
    return null;
  }
}

// ============================================
// READ OPERATIONS
// ============================================

async function testReadConversation(conversationId: string) {
  console.log('📖 Testing READ: AI Conversation...');
  try {
    const conversation = await prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          take: 5,
          orderBy: { sent_at: 'desc' },
        },
      },
    });

    logTest('Read AI Conversation', !!conversation);
    return conversation;
  } catch (error: any) {
    logTest('Read AI Conversation', false, error.message);
    return null;
  }
}

async function testReadMessages(conversationId: string) {
  console.log('📖 Testing READ: AI Messages...');
  try {
    const messages = await prisma.aiMessage.findMany({
      where: { conversation_id: conversationId },
      orderBy: { sent_at: 'asc' },
    });

    logTest('Read AI Messages', messages.length >= 0);
    return messages;
  } catch (error: any) {
    logTest('Read AI Messages', false, error.message);
    return [];
  }
}

async function testReadEmailLogs() {
  console.log('📖 Testing READ: Sofia Email Logs...');
  try {
    // Check if table exists first
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sofia_email_logs'
      ) as exists
    `;

    if (!tableExists[0]?.exists) {
      logTest('Read Sofia Email Logs', false, 'Table sofia_email_logs does not exist. Run migration first.');
      return [];
    }

    const emailLogs = await prisma.sofiaEmailLog.findMany({
      where: { tenant_id: TEST_CONFIG.tenantId },
      take: 10,
      orderBy: { created_at: 'desc' },
    });

    logTest('Read Sofia Email Logs', emailLogs.length >= 0);
    return emailLogs;
  } catch (error: any) {
    logTest('Read Sofia Email Logs', false, error.message);
    return [];
  }
}

async function testReadKnowledgeBase() {
  console.log('📖 Testing READ: Knowledge Base...');
  try {
    const kbService = new KnowledgeBaseService();

    // Test platform knowledge
    const platformKnowledge = kbService.getPlatformKnowledge();
    logTest('Read Platform Knowledge', !!platformKnowledge.name);

    // Test property knowledge (if property exists)
    if (TEST_CONFIG.propertyId) {
      const propertyKnowledge = await kbService.getPropertyKnowledge(
        TEST_CONFIG.propertyId,
        TEST_CONFIG.tenantId
      );
      logTest('Read Property Knowledge', !!propertyKnowledge);
    } else {
      console.log('⏭️  Skipping property knowledge test (no property)');
    }

    // Test guest knowledge (if guest exists)
    if (TEST_CONFIG.guestId) {
      const guestKnowledge = await kbService.getGuestKnowledge(
        TEST_CONFIG.guestId,
        TEST_CONFIG.tenantId
      );
      logTest('Read Guest Knowledge', !!guestKnowledge);
    } else {
      console.log('⏭️  Skipping guest knowledge test (no guest)');
    }

    return true;
  } catch (error: any) {
    logTest('Read Knowledge Base', false, error.message);
    return false;
  }
}

async function testReadConversationStats() {
  console.log('📖 Testing READ: Conversation Stats...');
  try {
    const sofiaService = new SofiaConciergeService();
    const stats = await sofiaService.getConversationStats(
      TEST_CONFIG.tenantId,
      TEST_CONFIG.propertyId || undefined
    );

    logTest('Read Conversation Stats', !!stats);
    return stats;
  } catch (error: any) {
    logTest('Read Conversation Stats', false, error.message);
    return null;
  }
}

// ============================================
// UPDATE OPERATIONS
// ============================================

async function testUpdateConversation(conversationId: string) {
  console.log('✏️  Testing UPDATE: AI Conversation...');
  try {
    const updated = await prisma.aiConversation.update({
      where: { id: conversationId },
      data: {
        status: 'COMPLETED',
        ended_at: new Date(),
      },
    });

    logTest('Update AI Conversation', updated.status === 'COMPLETED');
    return updated;
  } catch (error: any) {
    logTest('Update AI Conversation', false, error.message);
    return null;
  }
}

async function testUpdateMessage(messageId: string) {
  console.log('✏️  Testing UPDATE: AI Message...');
  try {
    const updated = await prisma.aiMessage.update({
      where: { id: messageId },
      data: {
        metadata: {
          updated: true,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    logTest('Update AI Message', !!updated);
    return updated;
  } catch (error: any) {
    logTest('Update AI Message', false, error.message);
    return null;
  }
}

async function testUpdateEmailLog(emailLogId: string) {
  console.log('✏️  Testing UPDATE: Sofia Email Log...');
  if (!emailLogId) {
    logTest('Update Sofia Email Log', false, 'No email log ID (table may not exist)');
    return null;
  }
  try {
    const updated = await prisma.sofiaEmailLog.update({
      where: { id: emailLogId },
      data: {
        status: 'delivered',
        delivered_at: new Date(),
      },
    });

    logTest('Update Sofia Email Log', updated.status === 'delivered');
    return updated;
  } catch (error: any) {
    logTest('Update Sofia Email Log', false, error.message);
    return null;
  }
}

// ============================================
// DELETE OPERATIONS
// ============================================

async function testDeleteMessage(messageId: string) {
  console.log('🗑️  Testing DELETE: AI Message...');
  try {
    await prisma.aiMessage.delete({
      where: { id: messageId },
    });

    logTest('Delete AI Message', true);
    return true;
  } catch (error: any) {
    logTest('Delete AI Message', false, error.message);
    return false;
  }
}

async function testDeleteConversation(conversationId: string) {
  console.log('🗑️  Testing DELETE: AI Conversation...');
  try {
    await prisma.aiConversation.delete({
      where: { id: conversationId },
    });

    logTest('Delete AI Conversation', true);
    return true;
  } catch (error: any) {
    logTest('Delete AI Conversation', false, error.message);
    return false;
  }
}

async function testDeleteEmailLog(emailLogId: string) {
  console.log('🗑️  Testing DELETE: Sofia Email Log...');
  if (!emailLogId) {
    logTest('Delete Sofia Email Log', false, 'No email log ID (table may not exist)');
    return false;
  }
  try {
    await prisma.sofiaEmailLog.delete({
      where: { id: emailLogId },
    });

    logTest('Delete Sofia Email Log', true);
    return true;
  } catch (error: any) {
    logTest('Delete Sofia Email Log', false, error.message);
    return false;
  }
}

// ============================================
// SERVICE OPERATIONS
// ============================================

async function testSofiaConciergeService() {
  console.log('🤖 Testing Sofia Concierge Service...');
  try {
    const sofiaService = new SofiaConciergeService();

    const response = await sofiaService.processMessage(
      {
        message: 'Hello, Sofia! Can you help me with a booking?',
        context: {
          tenantId: TEST_CONFIG.tenantId,
          propertyId: TEST_CONFIG.propertyId || undefined,
          guestId: TEST_CONFIG.guestId || undefined,
          sessionId: TEST_CONFIG.sessionId,
        },
        language: 'en',
      },
      'guest'
    );

    logTest('Sofia Concierge Service - Process Message', !!response.response);
    return response;
  } catch (error: any) {
    logTest('Sofia Concierge Service - Process Message', false, error.message);
    return null;
  }
}

async function testDataFilterService() {
  console.log('🔒 Testing Data Filter Service...');
  try {
    const filterService = new DataFilterService();

    const propertyData = {
      id: 'test-id',
      name: 'Test Property',
      type: 'HOTEL',
      description: 'Test description',
      address: '123 Test St',
      city: 'Test City',
      tenant_id: 'admin-only',
      revenue: 10000,
    };

    const publicData = filterService.filterPropertyData(propertyData, 'public');
    const adminData = filterService.filterPropertyData(propertyData, 'admin');

    const publicHasSensitive = 'tenant_id' in publicData || 'revenue' in publicData;
    const adminHasSensitive = 'tenant_id' in adminData && 'revenue' in adminData;

    logTest('Data Filter Service - Public Filter', !publicHasSensitive);
    logTest('Data Filter Service - Admin Filter', adminHasSensitive);
    return true;
  } catch (error: any) {
    logTest('Data Filter Service', false, error.message);
    return false;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('🚀 Starting Sofia CRUD Operations Test Suite\n');
  console.log('='.repeat(60));

  // Setup
  const setupSuccess = await testSetup();
  if (!setupSuccess) {
    console.error('\n❌ Setup failed. Exiting...\n');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST RESULTS\n');

  // CREATE Tests
  console.log('\n📝 CREATE OPERATIONS');
  console.log('-'.repeat(60));
  const conversationId = await testCreateConversation();
  const messageId = conversationId ? await testCreateMessage(conversationId) : null;
  const emailLogId = await testCreateEmailLog();

  // READ Tests
  console.log('\n📖 READ OPERATIONS');
  console.log('-'.repeat(60));
  if (conversationId) {
    await testReadConversation(conversationId);
    await testReadMessages(conversationId);
  }
  await testReadEmailLogs();
  await testReadKnowledgeBase();
  await testReadConversationStats();

  // UPDATE Tests
  console.log('\n✏️  UPDATE OPERATIONS');
  console.log('-'.repeat(60));
  if (conversationId) {
    await testUpdateConversation(conversationId);
  }
  if (messageId) {
    await testUpdateMessage(messageId);
  }
  if (emailLogId) {
    await testUpdateEmailLog(emailLogId);
  }

  // Service Tests
  console.log('\n🤖 SERVICE OPERATIONS');
  console.log('-'.repeat(60));
  await testSofiaConciergeService();
  await testDataFilterService();

  // DELETE Tests (cleanup)
  console.log('\n🗑️  DELETE OPERATIONS (Cleanup)');
  console.log('-'.repeat(60));
  if (messageId) {
    await testDeleteMessage(messageId);
  }
  if (conversationId) {
    await testDeleteConversation(conversationId);
  }
  if (emailLogId) {
    await testDeleteEmailLog(emailLogId);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error) => {
      console.log(`   - ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
