import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'uterms Policy',
};

/**
 * Terms of Service Page
 * 
 * Purpose: Legal terms and conditions for Hotel Etuna platform
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
              By visiting Hotel Etuna, making a reservation, or using our website and guest services, you agree to
              these Terms of Service ("Terms"). If you do not agree, please do not use our services.
            </p>
            <p>
              These Terms form a binding agreement between you and Hotel Etuna, located at 5544 Valley Street,
              Ongwediva, Namibia, and are governed by the laws of the Republic of Namibia.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Hotel Services</h2>
            <p>
              Hotel Etuna is a premium hotel property in Ongwediva. Subject to availability, we provide:
            </p>
            <ul>
              <li>Accommodation in Standard Room (Types A, B, and C), Executive Room, and Premiere Room</li>
              <li>On-site dining, including breakfast and dinner service hours as published</li>
              <li>Guest amenities such as WiFi, parking, pool access, and 24-hour security</li>
              <li>Support services, including concierge assistance and paid airport shuttle options</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Reservations, Check-In, and Check-Out</h2>
            <p>
              Guests and booking operators must provide accurate booking information, including guest names, stay
              dates, and contact details. By placing a booking, you confirm that all submitted information is correct.
            </p>
            <ul>
              <li>Standard check-in begins at 14:00</li>
              <li>Standard check-out is by 11:00</li>
              <li>Early check-in and late check-out are subject to approval and may incur additional charges</li>
              <li>Valid identification may be required at check-in</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the property or website for unlawful activity</li>
              <li>Damage hotel property or interfere with other guests&apos; comfort and safety</li>
              <li>Attempt unauthorized access to booking, payment, or hotel systems</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or misuse personal data of guests, staff, or operators without authorization</li>
              <li>Use the Platform to violate any third-party rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Rates, Payment, and Booking Policies</h2>
            <h3 className="text-xl font-semibold mb-3">5.1 Room Rates</h3>
            <p>
              Room rates are quoted in Namibian Dollars (NAD) and vary by room tier, occupancy, season, and package.
              Published rates may start from N$850 per night for selected stays.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Data Processing</h3>
            <p>
              Direct booking is available through approved Hotel Etuna channels. Payment terms, deposits, and
              cancellation conditions are shown at booking time and form part of your reservation terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Website and Service Availability</h2>
            <p>
              We aim to keep our website and guest services available at all times, but we do not guarantee
              uninterrupted operation. We may:
            </p>
            <ul>
              <li>Temporarily suspend website features for maintenance</li>
              <li>Adjust amenities, service hours, or operational procedures when required</li>
              <li>Update guest service offerings and booking functionality</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Guest and Operator Responsibilities</h2>
            <p>
              Guests are responsible for complying with house rules, payment obligations, and lawful conduct on
              property. Booking operators and staff users are responsible for maintaining accurate booking records and
              protecting credentials used to access hotel systems.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            <p>
              The Hotel Etuna brand, website content, visual assets, and service materials are owned by Hotel Etuna
              and protected by applicable intellectual property laws.
            </p>
            <p>
              You may not copy, modify, distribute, or commercially use these materials without prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law:
            </p>
            <ul>
              <li>Our website and services are provided on an "as available" basis</li>
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
              You agree to indemnify and hold harmless Hotel Etuna, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
            </p>
            <ul>
              <li>Your use of the property or website</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Misuse of our systems, facilities, or published content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p>
              We may cancel a booking, deny service, or suspend account access where reasonably necessary, including if you:
            </p>
            <ul>
              <li>Violate these Terms</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Fail to pay applicable fees</li>
              <li>Create safety or operational risk to guests, staff, or property</li>
            </ul>
            <p>
              Where applicable, refunds or penalties will follow the rate plan and booking terms accepted at
              reservation time.
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
              Continued use of our website, services, or stays after updates constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us:
            </p>
            <p>
              <strong>Hotel Etuna</strong><br />
              Email: admin@hoteletuna.com<br />
              Phone: +264 65 231 177<br />
              Address: 5544 Valley Street, Ongwediva, Namibia
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
              These Terms, together with our Privacy Policy and related legal notices, constitute the entire agreement
              between you and Hotel Etuna regarding your use of our website and hotel services.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
