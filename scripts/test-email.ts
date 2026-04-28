/**
 * Test Script: Send Sofia Email
 * 
 * Purpose: Test email sending functionality by sending an email to a specified address
 * Usage: npx tsx scripts/test-email.ts
 * 
 * Environment Variables Required:
 * - Namecheap PrivateEmail defaults: IMAP 993, SMTP 465
 * - NAMECHEAP_EMAIL / NAMECHEAP_EMAIL_PASSWORD (preferred)
 * - EMAIL_ADDRESS / EMAIL_PASSWORD (supported)
 * - SMTP_USER / SMTP_PASS (legacy supported)
 * - EMAIL_SENDER_EMAIL (default: concierge@buffr.ai)
 * - EMAIL_SENDER_NAME (default: Sofia Concierge)
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.local first, then .env
const envLocalPath = resolve(__dirname, '../.env.local');
const envPath = resolve(__dirname, '../.env');
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config({ path: envPath });
}

import { EmailService } from '../lib/services/sofia/EmailService';
import { SofiaEmailTemplateGenerator } from '../lib/services/sofia/EmailTemplateGenerator';
import { db } from '../lib/db/connection';
import { tenants } from '../lib/db/schema';

// Test configuration
const TEST_CONFIG = {
  recipientEmail: 'pendanek@gmail.com',
  subject: 'Test Email from Sofia Concierge',
  emailBody: `
    <p>Hello!</p>
    <p>This is a test email from Sofia Concierge, the AI assistant for Hotel Etuna.</p>
    <p>If you're receiving this email, it means the email service is working correctly!</p>
    <p>Best regards,<br>Sofia Concierge</p>
  `,
  ctaLink: 'https://host.buffr.ai',
  ctaText: 'Visit Hotel Etuna',
};

async function testEmailSending() {
  console.log('🧪 Testing Sofia Email Service...\n');
  
  // Check environment variables
  const smtpUser =
    process.env.NAMECHEAP_EMAIL ??
    process.env.EMAIL_USERNAME ??
    process.env.EMAIL_ADDRESS ??
    process.env.EMAIL_SMTP_USER ??
    process.env.SMTP_USER;
  const smtpPass =
    process.env.NAMECHEAP_EMAIL_PASSWORD ??
    process.env.EMAIL_PASSWORD ??
    process.env.EMAIL_SMTP_PASS ??
    process.env.SMTP_PASS ??
    process.env.SMTP_PASSWORD;
  const missingVars: string[] = [];
  if (!smtpUser) missingVars.push('NAMECHEAP_EMAIL or EMAIL_ADDRESS/EMAIL_SMTP_USER or SMTP_USER');
  if (!smtpPass) missingVars.push('NAMECHEAP_EMAIL_PASSWORD or EMAIL_PASSWORD/EMAIL_SMTP_PASS or SMTP_PASS/SMTP_PASSWORD');
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these in your .env.local file or environment.');
    process.exit(1);
  }
  
  console.log('📧 Email Configuration:');
  console.log(`   SMTP Host: ${process.env.NAMECHEAP_SMTP_HOST || process.env.EMAIL_SMTP_HOST || process.env.SMTP_HOST || 'mail.privateemail.com'}`);
  console.log(`   SMTP Port: ${process.env.NAMECHEAP_SMTP_PORT || process.env.EMAIL_SMTP_PORT || process.env.SMTP_PORT || '465'}`);
  console.log(`   Sender: ${process.env.EMAIL_SENDER_EMAIL || 'concierge@buffr.ai'}`);
  console.log(`   Recipient: ${TEST_CONFIG.recipientEmail}\n`);
  
  try {
    // Initialize services
    const emailService = new EmailService();
    const templateGenerator = new SofiaEmailTemplateGenerator();
    
    // Generate email templates
    console.log('📝 Generating email templates...');
    const htmlContent = templateGenerator.generateHtmlTemplate({
      subject: TEST_CONFIG.subject,
      body: TEST_CONFIG.emailBody,
      ctaLink: TEST_CONFIG.ctaLink,
      ctaText: TEST_CONFIG.ctaText,
    });
    
    const textContent = templateGenerator.generateTextTemplate({
      subject: TEST_CONFIG.subject,
      body: TEST_CONFIG.emailBody,
      ctaLink: TEST_CONFIG.ctaLink,
      ctaText: TEST_CONFIG.ctaText,
    });
    
    console.log('✅ Templates generated\n');
    
    // Send email
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).limit(1);
    if (!tenant?.id) {
      throw new Error('No tenant found. Run `npm run test:seed:working` first.');
    }

    console.log(`🏢 Using tenant: ${tenant.id}`);
    console.log('📤 Sending email...');
    const result = await emailService.sendEmail(tenant.id, {
      to: TEST_CONFIG.recipientEmail,
      subject: TEST_CONFIG.subject,
      htmlContent,
      textContent,
    });
    
    console.log('\n✅ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Recipient: ${TEST_CONFIG.recipientEmail}`);
    console.log(`   Subject: ${TEST_CONFIG.subject}`);
    console.log(`   From: ${process.env.EMAIL_SENDER_EMAIL || 'concierge@buffr.ai'}\n`);
    
    console.log('📬 Please check the inbox at:', TEST_CONFIG.recipientEmail);
    console.log('   (Also check spam/junk folder if not found)\n');
    
    console.log('🎉 Test completed successfully!');
    console.log('   Note: Database logging may fail in script context, but email was sent.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testEmailSending();
