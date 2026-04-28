/**
 * About Hotel Etuna Page
 * 
 * Purpose: Tell the Hotel Etuna story, mission, and values
 * Location: app/about/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Heart, Users, Award, Leaf } from 'lucide-react';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Hotel Etuna - our story, mission, and commitment to authentic Namibian hospitality in Ongwediva.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />

      <main>
        <PublicHero
          title="He Takes Care of Us"
          subtitle="The story behind Hotel Etuna."
          breadcrumbLabel="About"
        />

        {/* The Meaning */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block bg-khaki-sand text-khaki-700 px-6 py-2 rounded-full text-sm font-semibold mb-6">
                OUR NAME
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-8">
                What Does "Etuna" Mean?
              </h2>
              <p className="text-xl text-terracotta-800 leading-relaxed mb-8">
                In Oshiwambo, <span className="font-semibold text-khaki-600">"Etuna"</span> translates to{' '}
                <span className="font-semibold">"He takes care of us."</span> This profound phrase embodies 
                our core philosophy: genuine care, authentic hospitality, and a commitment to making every 
                guest feel valued and protected.
              </p>
              <p className="text-lg text-terracotta-800 leading-relaxed">
                Just as a shepherd watches over his flock, we watch over our guests. This isn't just a hotel—it's 
                a sanctuary where Namibian warmth meets modern comfort, where every detail is considered, and where 
                you're not just a visitor, but part of our family.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-khaki-sand text-khaki-700 px-6 py-2 rounded-full text-sm font-semibold mb-6">
                  OUR STORY
                </div>
                <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-6">
                  A Vision Born from Community
                </h2>
                <div className="space-y-4 text-terracotta-800 leading-relaxed">
                  <p>
                    Hotel Etuna was founded with a simple yet powerful vision: to create a hospitality experience 
                    that truly reflects the spirit of Northern Namibia. Located in Ongwediva, we recognized the need 
                    for accommodation that combines international standards with authentic local character.
                  </p>
                  <p>
                    From our strategic location near the Ongwediva Trade Fair grounds, we serve business travelers, 
                    families, and tourists exploring this vibrant region. Our commitment goes beyond providing rooms—we're 
                    dedicated to showcasing Namibian culture, supporting local communities, and creating memorable experiences.
                  </p>
                  <p>
                    Every member of our team embodies the "Etuna" spirit, ensuring that from the moment you arrive until 
                    the day you depart, you experience the warmth and care that defines Namibian hospitality.
                  </p>
                </div>
              </div>
              <div className="aspect-4/3 relative rounded-2xl overflow-hidden shadow-card">
                <Image
                  src="/images/hospitality/hero_hotel_lobby.jpeg"
                  alt="Hotel Etuna Story"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block bg-khaki-sand text-khaki-700 px-6 py-2 rounded-full text-sm font-semibold mb-6">
                  OUR VALUES
                </div>
                <h2 className="font-display text-4xl font-bold text-terracotta-900">
                  What We Stand For
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: Heart,
                    title: 'Genuine Care',
                    description: 'Every interaction is infused with authentic warmth and attention to detail. Your comfort and satisfaction drive everything we do.',
                  },
                  {
                    icon: Users,
                    title: 'Community First',
                    description: 'We employ local staff, source from local suppliers, and actively support community initiatives that strengthen Ongwediva.',
                  },
                  {
                    icon: Award,
                    title: 'Excellence Always',
                    description: 'From room cleanliness to dining quality, we maintain the highest standards in every aspect of our service.',
                  },
                  {
                    icon: Leaf,
                    title: 'Sustainable Tourism',
                    description: "We are committed to environmental responsibility and preserving the natural beauty of Namibia for future generations.",
                  },
                ].map((value) => (
                  <div key={value.title} className="flex gap-4">
                    <div className="w-14 h-14 bg-sage/20 rounded-full flex items-center justify-center shrink-0">
                      <value.icon className="w-7 h-7 text-sage" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-terracotta-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-terracotta-800 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-12">
                Why Choose Hotel Etuna?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    stat: '5',
                    label: 'Room Types',
                    desc: 'From Standard to Premier Suite',
                  },
                  {
                    stat: '9.0/10',
                    label: 'Guest Rating',
                    desc: 'Consistently excellent reviews',
                  },
                  {
                    stat: '24/7',
                    label: 'Service',
                    desc: 'Always here when you need us',
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl p-6">
                    <div className="text-5xl font-display font-bold text-khaki-600 mb-2">
                      {item.stat}
                    </div>
                    <div className="font-semibold text-terracotta-900 mb-1">
                      {item.label}
                    </div>
                    <div className="text-sm text-terracotta-800">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block bg-khaki-sand text-khaki-700 px-6 py-2 rounded-full text-sm font-semibold mb-6">
                  OUR LOCATION
                </div>
                <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-4">
                  Perfectly Positioned in Ongwediva
                </h2>
                <p className="text-lg text-terracotta-800">
                  Strategically located near the Ongwediva Trade Fair and major business districts, 
                  Hotel Etuna offers easy access to everything Northern Namibia has to offer.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { distance: '5 min', location: 'Ongwediva Trade Fair' },
                  { distance: '15 min', location: 'Ongwediva Town Centre' },
                  { distance: '25 min', location: 'Oshakati' },
                  { distance: '1 hour', location: 'Windhoek (by road)' },
                ].map((item) => (
                  <div key={item.location} className="flex items-center gap-4 bg-nude-50 rounded-xl p-4">
                    <div className="font-display text-2xl font-bold text-khaki-600 min-w-20">
                      {item.distance}
                    </div>
                    <div className="text-terracotta-900 font-medium">
                      {item.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-linear-to-br from-terracotta-800 to-terracotta-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-4xl font-bold mb-4">
              Experience the Etuna Difference
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Let us take care of you during your stay in Ongwediva
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-nude-100">
                <Link href="/#booking">Book Your Stay</Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
