import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Policy',
};

/**
 * Security Policy Page
 * 
 * Purpose: Comprehensive security policy for Hotel Etuna platform
 * Location: /app/legal/security/page.tsx
 * 
 * Compliance:
 * - Industry security standards
 * - Data protection requirements
 * - Hospitality industry security best practices
 * 
 * @module SecurityPolicyPage
 */

import React from 'react';
import Link from 'next/link';
import { brand } from '@/lib/copy/brand';

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-base-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="etuna-legal-content">
          <h1>Security Policy</h1>
          
          <p className="etuna-legal-meta">
            Last Updated: January 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Our Commitment to Security</h2>
            <p>
              Hotel Etuna is committed to protecting your data and maintaining the highest security standards. We implement industry-leading security measures to safeguard your information and ensure platform integrity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Data Encryption</h2>
            
            <h3 className="text-xl font-semibold mb-3">2.1 Data in Transit</h3>
            <p>
              All data transmitted between your device and our servers is encrypted using:
            </p>
            <ul>
              <li>TLS 1.3 (Transport Layer Security) for all connections</li>
              <li>Strong cipher suites and perfect forward secrecy</li>
              <li>Certificate pinning where applicable</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Data at Rest</h3>
            <p>
              All stored data is encrypted using:
            </p>
            <ul>
              <li>AES-256 encryption for databases</li>
              <li>Encrypted backups with separate encryption keys</li>
              <li>Secure key management systems</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Payment Data</h3>
            <p>
              Payment information is processed through PCI-DSS compliant payment processors. We do not store full credit card numbers on our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Access Controls</h2>
            
            <h3 className="text-xl font-semibold mb-3">3.1 Authentication</h3>
            <ul>
              <li>Strong password requirements (minimum complexity)</li>
              <li>Multi-factor authentication (MFA) available</li>
              <li>Session management with automatic timeout</li>
              <li>Secure password hashing (bcrypt with appropriate rounds)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Authorization</h3>
            <ul>
              <li>Role-based access control (RBAC)</li>
              <li>Principle of least privilege</li>
              <li>Property-scoped data isolation (Hotel Etuna hub + referral partners)</li>
              <li>Regular access reviews and audits</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Employee Access</h3>
            <ul>
              <li>Background checks for employees with data access</li>
              <li>Regular security training</li>
              <li>Access logging and monitoring</li>
              <li>Strict need-to-know access policies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Infrastructure Security</h2>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Hosting and Infrastructure</h3>
            <ul>
              <li>Enterprise-grade cloud infrastructure</li>
              <li>Regular security updates and patches</li>
              <li>Network segmentation and firewalls</li>
              <li>DDoS protection and mitigation</li>
              <li>Intrusion detection and prevention systems</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Monitoring and Logging</h3>
            <ul>
              <li>24/7 security monitoring</li>
              <li>Automated threat detection</li>
              <li>Comprehensive audit logs</li>
              <li>Real-time alerting for suspicious activity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Application Security</h2>
            
            <h3 className="text-xl font-semibold mb-3">5.1 Secure Development</h3>
            <ul>
              <li>Secure coding practices and standards</li>
              <li>Regular security code reviews</li>
              <li>Automated vulnerability scanning</li>
              <li>Penetration testing</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Protection Against Common Threats</h3>
            <ul>
              <li>SQL injection prevention (parameterized queries)</li>
              <li>Cross-site scripting (XSS) protection</li>
              <li>Cross-site request forgery (CSRF) tokens</li>
              <li>Input validation and sanitization</li>
              <li>Rate limiting and abuse prevention</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Backup and Recovery</h2>
            <ul>
              <li>Regular automated backups (daily)</li>
              <li>Encrypted backup storage</li>
              <li>Geographically distributed backups</li>
              <li>Regular backup restoration testing</li>
              <li>Disaster recovery procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Incident Response</h2>
            <p>
              In the event of a security incident, we:
            </p>
            <ul>
              <li>Immediately investigate and contain the threat</li>
              <li>Assess the scope and impact</li>
              <li>Notify affected users and authorities as required by law</li>
              <li>Remediate vulnerabilities</li>
              <li>Conduct post-incident review and improvements</li>
            </ul>
            <p>
              See our <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details on data breach notification procedures.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Security</h2>
            <p>
              We carefully vet all third-party service providers and require:
            </p>
            <ul>
              <li>Security certifications and compliance</li>
              <li>Data processing agreements (DPAs)</li>
              <li>Regular security assessments</li>
              <li>Compliance with applicable data protection laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Compliance and Certifications</h2>
            <p>
              We maintain compliance with:
            </p>
            <ul>
              <li>GDPR (General Data Protection Regulation)</li>
              <li>Namibia Data Protection Bill (when enacted)</li>
              <li>Namibia Electronic Transactions Act 2019</li>
              <li>Industry security best practices</li>
              <li>PCI-DSS standards (for payment processing)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Your Security Responsibilities</h2>
            <p>
              While we implement strong security measures, you also play a role in protecting your account:
            </p>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Enable multi-factor authentication (MFA)</li>
              <li>Keep your login credentials confidential</li>
              <li>Log out when using shared devices</li>
              <li>Report suspicious activity immediately</li>
              <li>Keep your devices and browsers updated</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Security Updates</h2>
            <p>
              We regularly update our security measures and will notify you of:
            </p>
            <ul>
              <li>Significant security improvements</li>
              <li>New security features</li>
              <li>Important security advisories</li>
              <li>Required actions on your part</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Reporting Security Issues</h2>
            <p>
              If you discover a security vulnerability, please report it responsibly:
            </p>
            <p>
              <strong>Email:</strong> {brand.emailSecurity}<br />
              <strong>Subject:</strong> Security Vulnerability Report
            </p>
            <p>
              Please include:
            </p>
            <ul>
              <li>Description of the vulnerability</li>
              <li>Steps to reproduce (if applicable)</li>
              <li>Potential impact</li>
              <li>Your contact information</li>
            </ul>
            <p>
              We appreciate responsible disclosure and will respond promptly. Please do not publicly disclose vulnerabilities until we have addressed them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              For security-related questions or concerns:
            </p>
            <p>
              <strong>Security Team</strong><br />
              Hotel Etuna<br />
              Email: {brand.emailSecurity}<br />
              Address: {brand.address}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Related Policies</h2>
            <p>
              This Security Policy should be read together with:
            </p>
            <ul>
              <li><Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link></li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}
