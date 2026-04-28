/**
 * Email Template Service
 * 
 * Purpose: Comprehensive email template system for all user actions and notifications
 * Location: /lib/services/sofia/EmailTemplateService.ts
 * 
 * Features:
 * - Pre-built templates for all common scenarios
 * - Personalization support
 * - Brand-consistent styling
 * - HTML and plain text versions
 * 
 * Email Scenarios Covered:
 * 1. Email Verification (OTP)
 * 2. Password Reset
 * 3. Welcome Email
 * 4. Booking Confirmation
 * 5. Booking Cancellation
 * 6. Booking Modification
 * 7. Payment Receipt
 * 8. Password Change Notification
 * 9. Account Security Alert
 * 10. Staff Invitation
 * 11. Pre-Arrival Reminder
 * 12. Check-in Confirmation
 * 13. Post-Stay Feedback Request
 * 14. Important Notifications
 */

import { SofiaEmailTemplateGenerator } from './EmailTemplateGenerator';

export interface EmailTemplateOptions {
  recipientName?: string;
  recipientEmail?: string;
  propertyName?: string;
  bookingReference?: string;
  checkInDate?: string;
  checkOutDate?: string;
  amount?: string;
  currency?: string;
  otp?: string;
  resetLink?: string;
  invitationLink?: string;
  feedbackLink?: string;
  customMessage?: string;
  [key: string]: any; // Allow additional custom fields
}

export class EmailTemplateService {
  private templateGenerator: SofiaEmailTemplateGenerator;

  constructor() {
    this.templateGenerator = new SofiaEmailTemplateGenerator();
  }

  /**
   * 1. Email Verification Template
   */
  generateVerificationEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'there';
    const otp = options.otp || '000000';
    
    const body = `Welcome to Hotel Etuna, ${firstName}!

Thank you for creating your account. To complete your registration and verify your email address, please use the following verification code:

<strong style="font-size: 28px; letter-spacing: 6px; color: #b8704a; display: block; text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 8px; margin: 20px 0;">${otp}</strong>

This code will expire in 15 minutes.

If you didn't create this account, please ignore this email.`;

    return {
      subject: 'Verify Your Hotel Etuna Account - Welcome from Sofia!',
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Verify Your Hotel Etuna Account',
        body,
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Verify Your Hotel Etuna Account',
        body: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      }),
    };
  }

  /**
   * 2. Password Reset Template
   */
  generatePasswordResetEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'there';
    const resetLink = options.resetLink || '#';
    
    const body = `Hello ${firstName},

You requested to reset your password for your Hotel Etuna account. Click the button below to create a new password:

<strong style="color: #b8704a;">This link will expire in 1 hour.</strong>

If you didn't request a password reset, please ignore this email or contact support if you have concerns.`;

    return {
      subject: 'Reset Your Hotel Etuna Password',
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Reset Your Password',
        body,
        ctaLink: resetLink,
        ctaText: 'Reset Password',
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Reset Your Password',
        body: body.replace(/<[^>]*>/g, ''),
        ctaLink: resetLink,
        ctaText: 'Reset Password',
      }),
    };
  }

  /**
   * 3. Welcome Email (After Verification)
   */
  generateWelcomeEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'there';
    
    const body = `Welcome to Hotel Etuna, ${firstName}!

Your email has been verified and your account is now active. You're all set to start managing your hospitality business with AI-powered Sofia.

<strong>What's Next?</strong>
• Set up your first property
• Configure Sofia AI for 24/7 guest inquiries
• Start accepting direct bookings
• Manage your entire operation from one platform

Need help getting started? Our support team is here for you.`;

    return {
      subject: 'Welcome to Hotel Etuna - Your Account is Ready!',
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Welcome to Hotel Etuna',
        body,
        ctaLink: `${process.env.NEXTAUTH_URL || 'https://hoteletuna.com'}/dashboard`,
        ctaText: 'Go to Dashboard',
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Welcome to Hotel Etuna',
        body: body.replace(/<[^>]*>/g, ''),
        ctaLink: `${process.env.NEXTAUTH_URL || 'https://hoteletuna.com'}/dashboard`,
        ctaText: 'Go to Dashboard',
      }),
    };
  }

  /**
   * 4. Booking Confirmation Template
   */
  generateBookingConfirmationEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'Guest';
    const propertyName = options.propertyName || 'our property';
    const bookingRef = options.bookingReference || 'N/A';
    const checkIn = options.checkInDate || 'TBD';
    const checkOut = options.checkOutDate || 'TBD';
    const amount = options.amount || '0';
    const currency = options.currency || 'NAD';
    
    const body = `Dear ${firstName},

Your booking has been confirmed! We're excited to host you at ${propertyName}.

<strong>Booking Details:</strong>
• Booking Reference: <strong>${bookingRef}</strong>
• Check-in: ${checkIn}
• Check-out: ${checkOut}
• Total Amount: ${currency} ${amount}

We look forward to welcoming you. If you have any questions or special requests, please don't hesitate to reach out.

Safe travels!`;

    return {
      subject: `Booking Confirmed - ${bookingRef} | ${propertyName}`,
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Booking Confirmation',
        body,
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Booking Confirmation',
        body: body.replace(/<[^>]*>/g, ''),
      }),
    };
  }

  /**
   * 5. Booking Cancellation Template
   */
  generateBookingCancellationEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'Guest';
    const bookingRef = options.bookingReference || 'N/A';
    const propertyName = options.propertyName || 'our property';
    
    const body = `Dear ${firstName},

We're sorry to see you cancel your booking at ${propertyName}.

<strong>Cancellation Details:</strong>
• Booking Reference: ${bookingRef}
• Status: Cancelled

${options.customMessage || 'If you cancelled by mistake or would like to rebook, please contact us. We hope to welcome you in the future.'}`;

    return {
      subject: `Booking Cancelled - ${bookingRef}`,
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Booking Cancellation',
        body,
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Booking Cancellation',
        body: body.replace(/<[^>]*>/g, ''),
      }),
    };
  }

  /**
   * 6. Payment Receipt Template
   */
  generatePaymentReceiptEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'Guest';
    const amount = options.amount || '0';
    const currency = options.currency || 'NAD';
    const bookingRef = options.bookingReference || 'N/A';
    
    const body = `Dear ${firstName},

Thank you for your payment. Here's your receipt:

<strong>Payment Details:</strong>
• Booking Reference: ${bookingRef}
• Amount Paid: <strong style="font-size: 20px; color: #b8704a;">${currency} ${amount}</strong>
• Payment Date: ${new Date().toLocaleDateString()}
• Status: Confirmed

This email serves as your receipt. Please keep it for your records.`;

    return {
      subject: `Payment Receipt - ${currency} ${amount}`,
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Payment Receipt',
        body,
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Payment Receipt',
        body: body.replace(/<[^>]*>/g, ''),
      }),
    };
  }

  /**
   * 7. Password Change Notification Template
   */
  generatePasswordChangeNotificationEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'there';
    const timestamp = new Date().toLocaleString();
    
    const body = `Hello ${firstName},

Your password was successfully changed on ${timestamp}.

<strong style="color: #d18b5c;">If you didn't make this change, please contact support immediately.</strong>

For your security, we recommend:
• Using a strong, unique password
• Enabling two-factor authentication (if available)
• Not sharing your password with anyone`;

    return {
      subject: 'Password Changed - Security Notification',
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Password Changed',
        body,
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Password Changed',
        body: body.replace(/<[^>]*>/g, ''),
      }),
    };
  }

  /**
   * 8. Account Security Alert Template
   */
  generateSecurityAlertEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'there';
    const alertType = options.customMessage || 'unusual activity';
    const timestamp = new Date().toLocaleString();
    
    const body = `Hello ${firstName},

We detected ${alertType} on your Hotel Etuna account at ${timestamp}.

<strong style="color: #ef4444;">If this wasn't you, please secure your account immediately:</strong>
• Change your password
• Review your account activity
• Contact support if you notice any unauthorized access

If this was you, you can safely ignore this email.`;

    return {
      subject: 'Security Alert - Unusual Activity Detected',
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Security Alert',
        body,
        ctaLink: `${process.env.NEXTAUTH_URL || 'https://hoteletuna.com'}/settings`,
        ctaText: 'Review Account Settings',
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Security Alert',
        body: body.replace(/<[^>]*>/g, ''),
        ctaLink: `${process.env.NEXTAUTH_URL || 'https://hoteletuna.com'}/settings`,
        ctaText: 'Review Account Settings',
      }),
    };
  }

  /**
   * 9. Staff Invitation Template
   */
  generateStaffInvitationEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'there';
    const invitationLink = options.invitationLink || '#';
    const propertyName = options.propertyName || 'our team';
    
    const body = `Hello ${firstName},

You've been invited to join ${propertyName} on Hotel Etuna as a staff member.

<strong>What you can do:</strong>
• Manage shifts and schedules
• Process orders and bookings
• Access staff dashboard
• View assigned tasks

Click the button below to accept the invitation and create your account.`;

    return {
      subject: `You've Been Invited to Join ${options.propertyName || 'Hotel Etuna'}`,
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Staff Invitation',
        body,
        ctaLink: invitationLink,
        ctaText: 'Accept Invitation',
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Staff Invitation',
        body: body.replace(/<[^>]*>/g, ''),
        ctaLink: invitationLink,
        ctaText: 'Accept Invitation',
      }),
    };
  }

  /**
   * 10. Pre-Arrival Reminder Template
   */
  generatePreArrivalReminderEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'Guest';
    const propertyName = options.propertyName || 'our property';
    const checkIn = options.checkInDate || 'soon';
    
    const body = `Dear ${firstName},

We're excited to welcome you to ${propertyName}!

<strong>Your stay is coming up:</strong>
• Check-in: ${checkIn}
• Property: ${propertyName}

<strong>Before you arrive:</strong>
• Review check-in instructions
• Confirm your arrival time
• Let us know of any special requests

We're here to make your stay exceptional. If you need anything, just ask!`;

    return {
      subject: `Pre-Arrival Reminder - ${propertyName}`,
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Pre-Arrival Reminder',
        body,
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Pre-Arrival Reminder',
        body: body.replace(/<[^>]*>/g, ''),
      }),
    };
  }

  /**
   * 11. Check-in Confirmation Template
   */
  generateCheckInConfirmationEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'Guest';
    const propertyName = options.propertyName || 'our property';
    
    const body = `Dear ${firstName},

Welcome to ${propertyName}! We're delighted to have you with us.

<strong>During your stay:</strong>
• Our team is available 24/7 to assist you
• Sofia AI can answer questions anytime via chat
• Need anything? Just ask!

We hope you have a wonderful stay. Enjoy your time with us!`;

    return {
      subject: `Welcome to ${propertyName} - Check-in Confirmed`,
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Check-in Confirmation',
        body,
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Check-in Confirmation',
        body: body.replace(/<[^>]*>/g, ''),
      }),
    };
  }

  /**
   * 12. Post-Stay Feedback Request Template
   */
  generateFeedbackRequestEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'Guest';
    const propertyName = options.propertyName || 'our property';
    const feedbackLink = options.feedbackLink || '#';
    
    const body = `Dear ${firstName},

Thank you for staying with us at ${propertyName}!

We hope you had a wonderful experience. Your feedback helps us improve and serve you better.

<strong>We'd love to hear from you:</strong>
• How was your stay?
• What did you enjoy most?
• Any suggestions for improvement?

Your opinion matters to us!`;

    return {
      subject: `How Was Your Stay at ${propertyName}?`,
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Share Your Feedback',
        body,
        ctaLink: feedbackLink,
        ctaText: 'Leave Feedback',
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Share Your Feedback',
        body: body.replace(/<[^>]*>/g, ''),
        ctaLink: feedbackLink,
        ctaText: 'Leave Feedback',
      }),
    };
  }

  /**
   * 13. Important Notification Template (Generic)
   */
  generateNotificationEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'there';
    const message = options.customMessage || 'You have an important update.';
    
    const body = `Hello ${firstName},

${message}

${options.ctaLink ? 'Click below for more details:' : ''}`;

    return {
      subject: options.subject || 'Important Notification from Hotel Etuna',
      html: this.templateGenerator.generateHtmlTemplate({
        subject: options.subject || 'Important Notification',
        body,
        ctaLink: options.ctaLink,
        ctaText: options.ctaText || 'View Details',
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: options.subject || 'Important Notification',
        body: body.replace(/<[^>]*>/g, ''),
        ctaLink: options.ctaLink,
        ctaText: options.ctaText || 'View Details',
      }),
    };
  }

  /**
   * 14. Resend OTP Template
   */
  generateResendOTPEmail(options: EmailTemplateOptions) {
    const firstName = options.recipientName?.split(' ')[0] || 'there';
    const otp = options.otp || '000000';
    
    const body = `Hello ${firstName}!

You requested a new verification code for your Hotel Etuna account. Please use the following code to verify your email address:

<strong style="font-size: 28px; letter-spacing: 6px; color: #b8704a; display: block; text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 8px; margin: 20px 0;">${otp}</strong>

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.`;

    return {
      subject: 'Verify Your Hotel Etuna Account - New Code',
      html: this.templateGenerator.generateHtmlTemplate({
        subject: 'Verify Your Hotel Etuna Account',
        body,
      }),
      text: this.templateGenerator.generateTextTemplate({
        subject: 'Verify Your Hotel Etuna Account',
        body: body.replace(/<[^>]*>/g, ''),
      }),
    };
  }
}
