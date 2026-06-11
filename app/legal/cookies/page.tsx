import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
};

/**
 * Cookie Policy Page
 * 
 * Purpose: Comprehensive cookie policy compliant with Namibia and international regulations
 * Location: /app/legal/cookies/page.tsx
 * 
 * Compliance:
 * - GDPR Cookie Consent requirements
 * - Namibia Electronic Transactions Act 2019
 * - Industry best practices
 * 
 * @module CookiePolicyPage
 */

import React from 'react';
import Link from 'next/link';
import { brand } from '@/lib/copy/brand';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-base-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="etuna-legal-content">
          <h1>Cookie Policy</h1>
          
          <p className="etuna-legal-meta">
            Last Updated: January 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience.
            </p>
            <p>
              Hotel Etuna uses cookies and similar technologies to provide, protect, and improve our Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold mb-3">2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the Platform to function. They cannot be disabled.
            </p>
            <ul>
              <li><strong>Authentication:</strong> Remember your login session</li>
              <li><strong>Security:</strong> Protect against fraud and unauthorized access</li>
              <li><strong>Preferences:</strong> Remember your language and region settings</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Functional Cookies</h3>
            <p>
              These cookies enhance functionality and personalization.
            </p>
            <ul>
              <li><strong>User Preferences:</strong> Remember your dashboard layout and settings</li>
              <li><strong>Chat History:</strong> Maintain Sofia AI conversation context</li>
              <li><strong>Form Data:</strong> Remember partially completed forms</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Analytics Cookies</h3>
            <p>
              These cookies help us understand how you use the Platform (with your consent).
            </p>
            <ul>
              <li><strong>Usage Analytics:</strong> Track page views and user interactions</li>
              <li><strong>Performance Monitoring:</strong> Identify and fix technical issues</li>
              <li><strong>Feature Usage:</strong> Understand which features are most used</li>
            </ul>
            <p>
              <strong>Note:</strong> Analytics data is aggregated and anonymized. We do not track individual users without consent.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.4 Third-Party Cookies</h3>
            <p>
              Some third-party services we use may set their own cookies:
            </p>
            <ul>
              <li><strong>Payment Processors:</strong> For secure payment processing</li>
              <li><strong>Analytics Services:</strong> For platform analytics (with consent)</li>
              <li><strong>Support Tools:</strong> For customer support features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cookie Duration</h2>
            
            <h3 className="text-xl font-semibold mb-3">3.1 Session Cookies</h3>
            <p>
              Temporary cookies that expire when you close your browser. Used for:
            </p>
            <ul>
              <li>Maintaining your login session</li>
              <li>Storing temporary form data</li>
              <li>Security tokens</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Persistent Cookies</h3>
            <p>
              Cookies that remain on your device for a set period. Used for:
            </p>
            <ul>
              <li>Remembering your preferences (up to 1 year)</li>
              <li>Analytics tracking (up to 2 years, with consent)</li>
              <li>Authentication tokens (up to 30 days)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Browser Settings</h3>
            <p>
              You can control cookies through your browser settings:
            </p>
            <ul>
              <li><strong>Chrome:</strong> Settings, Privacy and Security, Cookies</li>
              <li><strong>Firefox:</strong> Options, Privacy and Security, Cookies</li>
              <li><strong>Safari:</strong> Preferences, Privacy, Cookies</li>
              <li><strong>Edge:</strong> Settings, Privacy, Cookies</li>
            </ul>
            <p>
              <strong>Note:</strong> Disabling essential cookies may affect Platform functionality.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Platform Cookie Settings</h3>
            <p>
              You can manage non-essential cookies through our cookie consent banner or your account settings. Essential cookies cannot be disabled as they are required for the Platform to function.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Third-Party Opt-Out</h3>
            <p>
              For third-party cookies, you can opt out through:
            </p>
            <ul>
              <li>Individual service provider opt-out pages</li>
              <li>Your browser's third-party cookie blocking settings</li>
              <li>Privacy-focused browser extensions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Cookie Consent (GDPR)</h2>
            <p>
              For users covered by GDPR, we:
            </p>
            <ul>
              <li>Request explicit consent for non-essential cookies</li>
              <li>Provide clear information about cookie purposes</li>
              <li>Allow you to withdraw consent at any time</li>
              <li>Respect "Do Not Track" browser signals where technically feasible</li>
            </ul>
            <p>
              Essential cookies do not require consent as they are necessary for service provision.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Specific Cookies We Use</h2>
            
            <div className="w-full overflow-x-auto scrollbar-thin -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="min-w-full border border-base-300">
                <thead>
                  <tr className="bg-base-200">
                    <th className="border border-base-300 px-4 py-2 text-left">Cookie Name</th>
                    <th className="border border-base-300 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-base-300 px-4 py-2 text-left">Duration</th>
                    <th className="border border-base-300 px-4 py-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-base-300 px-4 py-2">auth.session</td>
                    <td className="border border-base-300 px-4 py-2">Maintains login session</td>
                    <td className="border border-base-300 px-4 py-2">Session</td>
                    <td className="border border-base-300 px-4 py-2">Essential</td>
                  </tr>
                  <tr>
                    <td className="border border-base-300 px-4 py-2">user.preferences</td>
                    <td className="border border-base-300 px-4 py-2">Stores user preferences</td>
                    <td className="border border-base-300 px-4 py-2">1 year</td>
                    <td className="border border-base-300 px-4 py-2">Functional</td>
                  </tr>
                  <tr>
                    <td className="border border-base-300 px-4 py-2">cookie.consent</td>
                    <td className="border border-base-300 px-4 py-2">Remembers cookie preferences</td>
                    <td className="border border-base-300 px-4 py-2">1 year</td>
                    <td className="border border-base-300 px-4 py-2">Essential</td>
                  </tr>
                  <tr>
                    <td className="border border-base-300 px-4 py-2">analytics.session</td>
                    <td className="border border-base-300 px-4 py-2">Tracks user session (with consent)</td>
                    <td className="border border-base-300 px-4 py-2">Session</td>
                    <td className="border border-base-300 px-4 py-2">Analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Material changes will be communicated via:
            </p>
            <ul>
              <li>Updated cookie consent banner</li>
              <li>Notice on the Platform</li>
              <li>Updated "Last Updated" date</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p>
              For questions about our use of cookies, contact us:
            </p>
            <p>
              <strong>Hotel Etuna</strong><br />
              Email: {brand.emailPrivacy}<br />
              Address: {brand.address}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Related Policies</h2>
            <p>
              This Cookie Policy should be read together with:
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
