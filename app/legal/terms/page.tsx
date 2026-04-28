/**
 * Terms of Service Page
 * 
 * Purpose: Legal terms and conditions for Buffr Host platform
 * Location: /app/legal/terms/page.tsx
 * 
 * Compliance:
 * - Namibia Electronic Transactions Act 2019
 * - Namibia Data Protection Bill (pending)
 * - GDPR (for international users)
 * - Hospitality industry standards
 * 
 * @module TermsOfServicePage
 */

import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-base-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="buffr-legal-content">
          <h1>Terms of Service</h1>
          
          <p className="buffr-legal-meta">
            Last Updated: January 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using Buffr Host ("the Platform", "we", "us", "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Platform.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and Buffr Host, governed by the laws of the Republic of Namibia and the Electronic Transactions Act 2019.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Buffr Host is a hospitality management platform that provides:
            </p>
            <ul>
              <li>Property management system (PMS) for hotels and restaurants</li>
              <li>AI-powered concierge services (Sofia AI)</li>
              <li>Booking and reservation management</li>
              <li>Guest relationship management (CRM)</li>
              <li>Content management system (CMS)</li>
              <li>Restaurant management features</li>
              <li>Business intelligence and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>
            <p>
              To use the Platform, you must:
            </p>
            <ul>
              <li>Be at least 18 years of age or have parental consent</li>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any illegal purpose or in violation of any laws</li>
              <li>Transmit any harmful code, viruses, or malicious software</li>
              <li>Attempt to gain unauthorized access to the Platform or related systems</li>
              <li>Interfere with or disrupt the Platform's operation</li>
              <li>Use automated systems to access the Platform without authorization</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or store personal data of other users without consent</li>
              <li>Use the Platform to violate any third-party rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data and Content</h2>
            <h3 className="text-xl font-semibold mb-3">5.1 Your Content</h3>
            <p>
              You retain ownership of all content you upload to the Platform. By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and display your content solely for the purpose of providing the Platform services.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Data Processing</h3>
            <p>
              We process your data in accordance with our Privacy Policy and applicable data protection laws, including:
            </p>
            <ul>
              <li>Namibia Data Protection Bill (when enacted)</li>
              <li>General Data Protection Regulation (GDPR) for international users</li>
              <li>Namibia Electronic Transactions Act 2019</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Service Availability and Modifications</h2>
            <p>
              We strive to maintain Platform availability but do not guarantee uninterrupted access. We reserve the right to:
            </p>
            <ul>
              <li>Modify, suspend, or discontinue any part of the Platform</li>
              <li>Perform maintenance that may temporarily affect availability</li>
              <li>Update features and functionality</li>
            </ul>
            <p>
              We will provide reasonable notice of significant changes that may affect your use of the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Pricing and Payment</h2>
            <p>
              The core Platform is available at no cost. Premium features and add-ons may be subject to fees, which will be clearly disclosed before purchase.
            </p>
            <p>
              For payment processing services, transaction fees (2-3%) apply as disclosed at the time of transaction.
            </p>
            <p>
              All prices are in Namibian Dollars (NAD) unless otherwise stated. We reserve the right to modify pricing with 30 days' notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            <p>
              The Platform, including its design, features, and functionality, is owned by Buffr Host and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or lease any part of the Platform without our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law:
            </p>
            <ul>
              <li>The Platform is provided "as is" without warranties of any kind</li>
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount you paid us in the 12 months preceding the claim</li>
              <li>We are not responsible for third-party services or integrations</li>
            </ul>
            <p>
              This limitation does not affect your rights under Namibia consumer protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Buffr Host, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
            </p>
            <ul>
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Content you upload to the Platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice, if you:
            </p>
            <ul>
              <li>Violate these Terms</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Fail to pay applicable fees</li>
              <li>Request account deletion</li>
            </ul>
            <p>
              Upon termination, your right to use the Platform ceases immediately. We may delete your account and data in accordance with our data retention policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms shall be resolved through:
            </p>
            <ol>
              <li>Good faith negotiation between parties</li>
              <li>Mediation in Windhoek, Namibia, if negotiation fails</li>
              <li>Binding arbitration in accordance with Namibia Arbitration Act, if mediation fails</li>
            </ol>
            <p>
              These Terms are governed by the laws of the Republic of Namibia. The courts of Namibia shall have exclusive jurisdiction over any disputes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be communicated via:
            </p>
            <ul>
              <li>Email notification to registered users</li>
              <li>Notice on the Platform</li>
              <li>Updated "Last Updated" date on this page</li>
            </ul>
            <p>
              Continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us:
            </p>
            <p>
              <strong>Buffr Host</strong><br />
              Email: legal@buffrhost.com<br />
              Address: Windhoek, Namibia
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Buffr Host regarding the use of the Platform.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
