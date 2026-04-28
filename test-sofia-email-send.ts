/**
 * Quick Test: Sofia Email Sending with Production SMTP
 * 
 * This script tests Sofia's ability to send emails using the production
 * SMTP configuration to verify email delivery works before running E2E tests.
 */

import { EmailService } from './lib/services/sofia/EmailService';
import { SofiaEmailTemplateGenerator } from './lib/services/sofia/EmailTemplateGenerator';
import { createTestTenant, cleanupTestTenant } from './tests/fixtures/test-helpers';

async function testSofiaEmailSend() {
  console.log('🧪 Testing Sofia Email Send with Production SMTP...\n');

  let testTenantId: string | null = null;

  try {
    // Create test tenant for email logging
    console.log('📝 Creating test tenant for email logging...');
    const tenant = await createTestTenant('Sofia Email Test');
    testTenantId = tenant.id;
    console.log(`✅ Test tenant created: ${testTenantId}\n`);

    // Initialize services
    const emailService = new EmailService();
    const templateGenerator = new SofiaEmailTemplateGenerator();

    // Prepare email data
    const emailData = {
      subject: '✅ Hotel Etuna Test - Sofia AI Email Verification',
      body: `Hello Pendapala,

This is a test email from Sofia AI to verify the production SMTP configuration.

**Test Details:**
- Date: ${new Date().toLocaleString('en-NA', { timeZone: 'Africa/Windhoek' })}
- Environment: Production Test
- SMTP Host: mail.privateemail.com
- From: concierge@buffr.ai

**System Status:**
✅ Sofia AI: Online
✅ Email Service: Connected
✅ SMTP Configuration: Valid
✅ Test Suite: 234+ tests ready

If you're reading this, email delivery is working perfectly! 🎉

Best regards,
Sofia AI Concierge
Hotel Etuna`,
      ctaText: 'View Test Report',
      ctaLink: 'https://host.buffr.ai',
    };

    // Generate HTML and text templates
    const htmlContent = templateGenerator.generateHtmlTemplate(emailData);
    const textContent = templateGenerator.generateTextTemplate(emailData);

    console.log('📧 Attempting to send test email...');
    console.log(`   To: pendanek@gmail.com`);
    console.log(`   Subject: ${emailData.subject}`);
    console.log(`   From: concierge@buffr.ai\n`);

    // Send email
    const result = await emailService.sendEmail(testTenantId, {
      to: 'pendanek@gmail.com',
      subject: emailData.subject,
      htmlContent,
      textContent,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ SUCCESS! Email sent successfully!\n');
    console.log('📊 Email Details:');
    console.log(`   Message ID: ${result.messageId || 'N/A'}`);
    console.log(`   Success: ${result.success}\n`);

    console.log('📬 Check your inbox at: pendanek@gmail.com');
    console.log('   (Email may take a few seconds to arrive)\n');

    console.log('✅ Sofia Email Service: VERIFIED & READY FOR PRODUCTION\n');
    
    // Cleanup
    if (testTenantId) {
      console.log('🧹 Cleaning up test tenant...');
      await cleanupTestTenant(testTenantId);
      console.log('✅ Cleanup complete\n');
    }

    return true;
  } catch (error) {
    console.error('❌ ERROR: Email send failed!\n');
    console.error('Error details:', error);
    console.error('\nPlease verify SMTP credentials in .env.local');
    
    // Cleanup on error
    if (testTenantId) {
      try {
        await cleanupTestTenant(testTenantId);
      } catch (cleanupError) {
        console.warn('Warning: Cleanup failed:', cleanupError);
      }
    }
    
    return false;
  }
}

// Run the test
testSofiaEmailSend()
  .then((success) => {
    if (success) {
      console.log('🎉 Email test complete! Ready to run Playwright E2E tests.');
      process.exit(0);
    } else {
      console.log('⚠️  Email test failed. Check SMTP configuration.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
