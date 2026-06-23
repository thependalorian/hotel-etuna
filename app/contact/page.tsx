/**
 * Contact Page
 * 
 * Purpose: Contact form, location map, and contact information
 * Location: app/contact/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { ContactForm } from '@/components/features/contact/ContactForm';
import HotelEtunaTeamEmails from '@/components/shared/HotelEtunaTeamEmails';
import { brand } from '@/lib/copy/brand';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Hotel Etuna. We\'re here to help with reservations, inquiries, and any questions about your stay.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />

      <main>
        <PublicHero
          title="Get In Touch"
          subtitle="We're here to help with reservations, inquiries, and making your stay perfect."
          breadcrumbLabel="Contact"
        />

        {/* Contact Form & Info */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-white rounded-etuna-card p-8 ">
                <ContactForm />
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div className="bg-nude-50 rounded-etuna-card p-8">
                  <h2 className="font-display text-3xl font-bold text-ci-secondary-chocolate mb-6">
                    Contact Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-ci-primary rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ci-secondary-chocolate mb-1">Address</h3>
                        <p className="text-ink-700 whitespace-pre-line">
                          {brand.address.replace(/, /g, '\n')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-ci-primary rounded-full flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ci-secondary-chocolate mb-1">Phone</h3>
                        <p className="text-ink-700">
                          <a href="tel:+26465231177" className="hover:text-ci-primary transition-colors">
                            +264 65 231 177
                          </a>
                          <br />
                          <a href="tel:+264818024833" className="hover:text-ci-primary transition-colors">
                            +264 81 802 4833 (Mobile)
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4" id="emails">
                      <div className="w-12 h-12 bg-ci-primary rounded-full flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-ci-secondary-chocolate mb-2">Email</h3>
                        <p className="text-sm text-ink-600 mb-4">
                          Reach the right team at {brand.name}:
                        </p>
                        <HotelEtunaTeamEmails />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-ci-primary rounded-full flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ci-secondary-chocolate mb-1">Reception Hours</h3>
                        <p className="text-ink-700">
                          24/7 Front Desk Service<br />
                          <span className="text-sm text-ink-600">
                            Check-in: 14:00<br />
                            Check-out: 11:00
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-semantic-warning-light border-2 border-semantic-warning rounded-etuna-card p-6">
                  <h3 className="font-semibold text-ci-secondary-chocolate mb-3">Emergency Contact</h3>
                  <p className="text-ink-700 mb-2">
                    For urgent matters or emergencies during your stay:
                  </p>
                  <a 
                    href="tel:+264818024833"
                    className="text-xl font-bold text-semantic-warning-dark hover:text-semantic-warning transition-colors"
                  >
                    +264 81 802 4833
                  </a>
                  <p className="text-sm text-ink-600 mt-2">
                    Available 24/7
                  </p>
                </div>

                {/* Events & media */}
                <div className="bg-white rounded-etuna-card p-6 ">
                  <h3 className="font-semibold text-ci-secondary-chocolate mb-2">Events &amp; media</h3>
                  <p className="text-sm text-ink-600 mb-4">
                    Conference hall, campsite, and marketing enquiries:
                  </p>
                  <a
                    href={`mailto:${brand.emailMarketing}`}
                    className="btn btn-outline rounded-full px-6 border-ci-primary text-ci-primary hover:bg-ci-primary hover:text-ci-cream hover:border-ci-primary"
                  >
                    {brand.emailMarketing}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-display text-4xl font-bold text-ci-secondary-chocolate mb-8 text-center">
                Find Us
              </h2>
              
              <div className="rounded-etuna-card overflow-hidden h-[500px]">
                <iframe
                  title={`Map — ${brand.name}, Ongwediva`}
                  src="https://maps.google.com/maps?q=5544+Valley+Street,+Ongwediva,+Namibia&z=15&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <p className="text-center text-sm text-ink-600 mt-4">
                <a
                  href="https://maps.google.com/?q=5544+Valley+Street,+Ongwediva,+Namibia"
                  className="text-ci-accent-ochre hover:text-ci-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              </p>

              {/* Directions */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-etuna-card p-6">
                  <h3 className="font-semibold text-ci-secondary-chocolate mb-3">From Windhoek</h3>
                  <ol className="list-decimal list-inside space-y-2 text-ink-600 text-sm">
                    <li>Take the B1 North towards Oshakati (approx. 450km)</li>
                    <li>Continue through Otjiwarongo and Outjo</li>
                    <li>At Ongwediva, follow signs to Trade Fair</li>
                    <li>Hotel Etuna is 5 minutes from Trade Fair grounds</li>
                  </ol>
                </div>
                <div className="bg-white rounded-etuna-card p-6">
                  <h3 className="font-semibold text-ci-secondary-chocolate mb-3">From Oshakati</h3>
                  <ol className="list-decimal list-inside space-y-2 text-ink-600 text-sm">
                    <li>Head west on B1 towards Ongwediva (15 min)</li>
                    <li>Turn right at Ongwediva Trade Fair</li>
                    <li>Continue for 2km on Main Street</li>
                    <li>Hotel Etuna will be on your right</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-linear-to-br from-ci-accent-terracotta to-ci-secondary-chocolate text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-4xl font-bold mb-4">
              Ready to Book Your Stay?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Experience authentic Namibian hospitality at Hotel Etuna
            </p>
            <Button asChild size="xl" className="bg-white text-ci-secondary-chocolate hover:bg-nude-100">
              <Link href="/#booking">Check Availability</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
