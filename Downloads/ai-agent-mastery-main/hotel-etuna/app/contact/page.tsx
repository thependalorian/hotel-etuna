/**
 * Contact Page
 * 
 * Purpose: Contact form, location map, and contact information
 * Location: app/contact/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';

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
              <div className="bg-white rounded-2xl p-8 shadow-card">
                <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-6">
                  Send Us a Message
                </h2>
                
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                      placeholder="+264 81 234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Subject *
                    </label>
                    <select
                      required
                      className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      <option value="reservation">Reservation Inquiry</option>
                      <option value="tour">Tour Booking</option>
                      <option value="restaurant">Restaurant Reservation</option>
                      <option value="event">Event/Conference Inquiry</option>
                      <option value="general">General Question</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-nude-300 focus:ring-2 focus:ring-khaki-600 focus:border-transparent resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    <Send className="w-5 h-5" />
                    Send Message
                  </Button>

                  <p className="text-sm text-terracotta-800 text-center">
                    We typically respond within 24 hours
                  </p>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div className="bg-nude-50 rounded-2xl p-8">
                  <h2 className="font-display text-3xl font-bold text-terracotta-900 mb-6">
                    Contact Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-khaki-600 rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-terracotta-900 mb-1">Address</h3>
                        <p className="text-terracotta-800">
                          5544 Valley of the Leopard Street<br />
                          Ongwediva, Namibia
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-khaki-600 rounded-full flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-terracotta-900 mb-1">Phone</h3>
                        <p className="text-terracotta-800">
                          <a href="tel:+26465231177" className="hover:text-khaki-600 transition-colors">
                            +264 65 231 177
                          </a>
                          <br />
                          <a href="tel:+264818024833" className="hover:text-khaki-600 transition-colors">
                            +264 81 802 4833 (Mobile)
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-khaki-600 rounded-full flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-terracotta-900 mb-1">Email</h3>
                        <p className="text-terracotta-800">
                          <a href="mailto:info@hoteletuna.com" className="hover:text-khaki-600 transition-colors">
                            info@hoteletuna.com
                          </a>
                          <br />
                          <a href="mailto:reservations@hoteletuna.com" className="hover:text-khaki-600 transition-colors">
                            reservations@hoteletuna.com
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-khaki-600 rounded-full flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-terracotta-900 mb-1">Reception Hours</h3>
                        <p className="text-terracotta-800">
                          24/7 Front Desk Service<br />
                          <span className="text-sm text-terracotta-800">
                            Check-in: 14:00<br />
                            Check-out: 11:00
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-semantic-warning-light border-2 border-semantic-warning rounded-2xl p-6">
                  <h3 className="font-semibold text-terracotta-900 mb-3">Emergency Contact</h3>
                  <p className="text-terracotta-800 mb-2">
                    For urgent matters or emergencies during your stay:
                  </p>
                  <a 
                    href="tel:+264818024833"
                    className="text-xl font-bold text-semantic-warning-dark hover:text-semantic-warning transition-colors"
                  >
                    +264 81 802 4833
                  </a>
                  <p className="text-sm text-terracotta-800 mt-2">
                    Available 24/7
                  </p>
                </div>

                {/* Social Media */}
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h3 className="font-semibold text-terracotta-900 mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    {['facebook', 'instagram', 'linkedin', 'twitter'].map((platform) => (
                      <a
                        key={platform}
                        href={`#${platform}`}
                        className="w-12 h-12 bg-nude-100 hover:bg-khaki-600 rounded-full flex items-center justify-center text-terracotta-900 hover:text-white transition-colors"
                        aria-label={`Follow us on ${platform}`}
                      >
                        {platform[0].toUpperCase()}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-8 text-center">
                Find Us
              </h2>
              
              {/* Map Placeholder */}
              <div className="bg-nude-200 rounded-2xl h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-terracotta-800 mx-auto mb-4" />
                  <p className="text-terracotta-900 font-semibold text-lg mb-2">
                    5544 Valley of the Leopard Street, Ongwediva, Namibia
                  </p>
                  <p className="text-terracotta-800">
                    5 minutes from Ongwediva Trade Fair
                  </p>
                  <p className="text-sm text-terracotta-800 mt-4">
                    Interactive map integration coming soon
                  </p>
                </div>
              </div>

              {/* Directions */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-semibold text-terracotta-900 mb-3">From Windhoek</h3>
                  <ol className="list-decimal list-inside space-y-2 text-terracotta-800 text-sm">
                    <li>Take the B1 North towards Oshakati (approx. 450km)</li>
                    <li>Continue through Otjiwarongo and Outjo</li>
                    <li>At Ongwediva, follow signs to Trade Fair</li>
                    <li>Hotel Etuna is 5 minutes from Trade Fair grounds</li>
                  </ol>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-semibold text-terracotta-900 mb-3">From Oshakati</h3>
                  <ol className="list-decimal list-inside space-y-2 text-terracotta-800 text-sm">
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
        <section className="py-16 bg-linear-to-br from-terracotta-800 to-terracotta-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-4xl font-bold mb-4">
              Ready to Book Your Stay?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Experience authentic Namibian hospitality at Hotel Etuna
            </p>
            <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-nude-100">
              <Link href="/#booking">Check Availability</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
