/**
 * Privacy Policy Page
 * 
 * Purpose: Comprehensive privacy policy compliant with Namibia and international regulations
 * Location: /app/legal/privacy/page.tsx
 * 
 * Compliance:
 * - Namibia Data Protection Bill (pending)
 * - Namibia Constitution Article 13 (Right to Privacy)
 * - GDPR (General Data Protection Regulation)
 * - Electronic Transactions Act 2019
 * - Hospitality industry data protection standards
 * 
 * @module PrivacyPolicyPage
 */

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-base-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="buffr-legal-content">
          <h1>Privacy Policy</h1>
          
          <p className="buffr-legal-meta">
            Last Updated: January 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Buffr Host ("we", "us", "our") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our hospitality management platform ("Platform").
            </p>
            <p>
              This policy complies with:
            </p>
            <ul>
              <li>Namibia Data Protection Bill (when enacted)</li>
              <li>Namibia Constitution Article 13 (Right to Privacy)</li>
              <li>General Data Protection Regulation (GDPR) for international users</li>
              <li>Namibia Electronic Transactions Act 2019</li>
              <li>Industry best practices for data protection</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Data Controller</h2>
            <p>
              Buffr Host is the data controller responsible for your personal data. For questions about this policy or your data rights, contact us:
            </p>
            <p>
              <strong>Buffr Host</strong><br />
              Email: privacy@buffrhost.com<br />
              Address: Windhoek, Namibia
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3">3.1 Account Information</h3>
            <p>When you register, we collect:</p>
            <ul>
              <li>Name and contact information (email, phone)</li>
              <li>Business information (property name, address)</li>
              <li>Account credentials (encrypted passwords)</li>
              <li>Payment information (processed securely through third-party providers)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Guest Data</h3>
            <p>As a property manager, you may collect and store guest information through the Platform:</p>
            <ul>
              <li>Guest names and contact details</li>
              <li>Booking and reservation information</li>
              <li>Payment information (processed securely)</li>
              <li>Preferences and special requests</li>
              <li>Communication history</li>
            </ul>
            <p>
              <strong>Important:</strong> You are responsible for ensuring you have lawful basis and consent to collect guest data in accordance with applicable data protection laws.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Usage Data</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>IP addresses and device information</li>
              <li>Browser type and version</li>
              <li>Platform usage patterns and analytics</li>
              <li>Error logs and performance data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.4 Cookies and Tracking</h3>
            <p>
              We use cookies and similar technologies. See our <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
            <p>We use your data for the following purposes:</p>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Service Provision</h3>
            <ul>
              <li>To provide and maintain the Platform</li>
              <li>To process bookings and reservations</li>
              <li>To enable AI concierge services (Sofia AI)</li>
              <li>To manage your account and properties</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Legal Basis (GDPR)</h3>
            <p>We process your data based on:</p>
            <ul>
              <li><strong>Contractual necessity:</strong> To fulfill our service agreement</li>
              <li><strong>Legal obligation:</strong> To comply with applicable laws</li>
              <li><strong>Legitimate interests:</strong> To improve our services and ensure security</li>
              <li><strong>Consent:</strong> Where you have provided explicit consent</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Communication</h3>
            <ul>
              <li>To send service-related notifications</li>
              <li>To respond to your inquiries</li>
              <li>To provide customer support</li>
              <li>To send important updates about the Platform</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.4 Analytics and Improvement</h3>
            <ul>
              <li>To analyze Platform usage and performance</li>
              <li>To improve our services and features</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal data. We may share data only in these circumstances:</p>
            
            <h3 className="text-xl font-semibold mb-3">5.1 Service Providers</h3>
            <p>We share data with trusted third-party service providers who:</p>
            <ul>
              <li>Host our infrastructure (with data processing agreements)</li>
              <li>Process payments (PCI-DSS compliant)</li>
              <li>Provide analytics services</li>
              <li>Deliver email and communication services</li>
            </ul>
            <p>All service providers are contractually bound to protect your data.</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Legal Requirements</h3>
            <p>We may disclose data when required by:</p>
            <ul>
              <li>Namibia laws and regulations</li>
              <li>Court orders or legal processes</li>
              <li>Government authorities</li>
              <li>To protect our rights, property, or safety</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Business Transfers</h3>
            <p>In the event of a merger, acquisition, or sale, your data may be transferred to the new entity, subject to the same privacy protections.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li><strong>Encryption:</strong> Data in transit (TLS/SSL) and at rest</li>
              <li><strong>Access Controls:</strong> Role-based access and authentication</li>
              <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
              <li><strong>Data Backup:</strong> Regular encrypted backups</li>
              <li><strong>Incident Response:</strong> Procedures for data breach response</li>
            </ul>
            <p>
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p>We retain your data only as long as necessary:</p>
            <ul>
              <li><strong>Account Data:</strong> While your account is active, plus 30 days after deletion</li>
              <li><strong>Guest Data:</strong> As determined by your data retention policies (you control this)</li>
              <li><strong>Legal Requirements:</strong> As required by applicable laws</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized data may be retained longer</li>
            </ul>
            <p>
              Upon account deletion, we will delete or anonymize your personal data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Your Data Rights</h2>
            <p>You have the following rights regarding your personal data:</p>
            
            <h3 className="text-xl font-semibold mb-3">8.1 Right to Access</h3>
            <p>You can request a copy of your personal data we hold.</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.2 Right to Rectification</h3>
            <p>You can request correction of inaccurate or incomplete data.</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.3 Right to Erasure</h3>
            <p>You can request deletion of your data, subject to legal retention requirements.</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.4 Right to Restrict Processing</h3>
            <p>You can request we limit how we process your data.</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.5 Right to Data Portability</h3>
            <p>You can request your data in a structured, machine-readable format.</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.6 Right to Object</h3>
            <p>You can object to processing based on legitimate interests.</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.7 Right to Withdraw Consent</h3>
            <p>Where processing is based on consent, you can withdraw it at any time.</p>

            <p className="mt-4">
              To exercise these rights, contact us at <strong>privacy@buffrhost.com</strong>. We will respond within 30 days (or as required by applicable law).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              Your data may be processed and stored outside Namibia, including in countries that may not have the same data protection laws. When we transfer data internationally, we ensure:
            </p>
            <ul>
              <li>Appropriate safeguards are in place (e.g., Standard Contractual Clauses for GDPR)</li>
              <li>Data is processed in accordance with this Privacy Policy</li>
              <li>Security measures are maintained</li>
            </ul>
            <p>
              For GDPR-covered transfers, we comply with Chapter V of the GDPR regarding international transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p>
              Our Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal data from children. If you believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Data Breach Notification</h2>
            <p>
              In the event of a data breach that poses a risk to your rights and freedoms, we will:
            </p>
            <ul>
              <li>Notify the relevant supervisory authority within 72 hours (GDPR requirement)</li>
              <li>Notify affected users without undue delay</li>
              <li>Provide information about the nature of the breach and steps taken</li>
              <li>Comply with Namibia data protection requirements when the Data Protection Bill is enacted</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via:
            </p>
            <ul>
              <li>Email notification to registered users</li>
              <li>Notice on the Platform</li>
              <li>Updated "Last Updated" date</li>
            </ul>
            <p>
              Continued use of the Platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              For questions, concerns, or to exercise your data rights, contact us:
            </p>
            <p>
              <strong>Data Protection Officer</strong><br />
              Buffr Host<br />
              Email: privacy@buffrhost.com<br />
              Address: Windhoek, Namibia
            </p>
            <p>
              For GDPR-related inquiries, you also have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Related Policies</h2>
            <p>
              This Privacy Policy should be read together with:
            </p>
            <ul>
              <li><Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link></li>
              <li><Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link></li>
              <li><Link href="/legal/security" className="text-primary hover:underline">Security Policy</Link></li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}
