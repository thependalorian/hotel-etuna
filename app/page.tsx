/**
 * Hotel Etuna Landing Page
 * 
 * Purpose: Public-facing homepage with Hero, Story, Rooms, Dining, Tours, Reviews, Booking, Partners
 * Location: app/page.tsx
 * 
 * Design: Hotel Etuna branding (khaki/terracotta/sage), Playfair Display headings, responsive
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { 
  Sparkles, 
  Home, 
  Utensils, 
  Compass, 
  Star,
  Check,
  MapPin,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hotel Etuna – He Takes Care of Us',
  description: 'Welcome to Hotel Etuna in Ongwediva, Namibia. Experience authentic Namibian hospitality with 5 room types, on-site restaurant, pool, and curated tours.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-nude-200">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center text-white font-display font-bold">
              HE
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-terracotta-900">Hotel Etuna</span>
              <span className="text-xs text-terracotta-800">Ongwediva, Namibia</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="#rooms" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              Rooms
            </Link>
            <Link href="#dining" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              Dining
            </Link>
            <Link href="#tours" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              Tours
            </Link>
            <Link href="#about" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              About
            </Link>
            <Link href="#contact" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              Contact
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="#booking">Book Now</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 bg-gradient-to-b from-terracotta-900/60 via-terracotta-900/40 to-nude-900/60 z-10" />
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/hospitality/hero_hotel_lobby.jpeg')",
            }}
          />
          
          {/* Hero Content */}
          <div className="relative z-20 container mx-auto px-4 text-center text-white">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              He Takes Care of Us
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-95 animate-slide-up">
              Welcome to Hotel Etuna – your home in the heart of Ongwediva
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button asChild size="xl" className="bg-khaki-600 hover:bg-khaki-700">
                <Link href="#booking">
                  <Calendar className="w-5 h-5" />
                  Book Your Stay
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link href="#story">
                  <Sparkles className="w-5 h-5" />
                  Explore
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* The Etuna Story Section */}
        <section id="story" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-6">
                More than a hotel – a Namibian welcome
              </h2>
              <p className="text-lg text-terracotta-800 mb-8 leading-relaxed">
                <span className="font-display text-2xl text-khaki-600">"Etuna"</span> means{' '}
                <span className="font-semibold">"He takes care of us"</span> in Oshiwambo, reflecting our
                commitment to genuine Namibian hospitality. Located minutes from the Ongwediva Trade Fair,
                we offer 5 distinct room types, a refreshing pool, authentic on-site restaurant, and curated
                cultural tours that showcase the heart of Northern Namibia.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-2">5</div>
                  <div className="text-sm text-terracotta-800">Room Types</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-2">24/7</div>
                  <div className="text-sm text-terracotta-800">Service</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-2">1</div>
                  <div className="text-sm text-terracotta-800">Pool & Restaurant</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-2">10+</div>
                  <div className="text-sm text-terracotta-800">Tours Available</div>
                </div>
              </div>
              <Button asChild size="lg" className="mt-12">
                <Link href="/about">
                  Read Our Full Story
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Rooms Section */}
        <section id="rooms" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                Our Rooms
              </h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">
                Five distinct room types designed for comfort, each with air conditioning, mosquito nets, and authentic Namibian touches
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: 'Standard Room',
                  slug: 'standard',
                  image: '/images/hospitality/room_standard.jpeg',
                  price: 'From NAD 1,200/night',
                  amenities: ['Queen Bed', 'AC', 'Mosquito Net', 'WiFi'],
                },
                {
                  name: 'Luxury Room',
                  slug: 'luxury',
                  image: '/images/hospitality/room_luxury.jpeg',
                  price: 'From NAD 1,800/night',
                  amenities: ['King Bed', 'AC', 'Mini Bar', 'Bathtub'],
                },
                {
                  name: 'Family Suite',
                  slug: 'family',
                  image: '/images/hospitality/room_family.jpeg',
                  price: 'From NAD 2,500/night',
                  amenities: ['2 Bedrooms', 'Living Room', 'Kitchenette', 'WiFi'],
                },
                {
                  name: 'Executive Suite',
                  slug: 'executive',
                  image: '/images/hospitality/room_executive.jpeg',
                  price: 'From NAD 3,000/night',
                  amenities: ['King Bed', 'Work Desk', 'Lounge', 'Balcony'],
                },
                {
                  name: 'Premier Suite',
                  slug: 'premier',
                  image: '/images/hospitality/room_premier.jpeg',
                  price: 'From NAD 3,800/night',
                  amenities: ['Master Bedroom', 'Private Pool', 'Butler Service', 'Spa Bath'],
                },
              ].map((room) => (
                <Link
                  key={room.slug}
                  href={`/rooms/${room.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[4/3] relative bg-nude-200">
                    <Image
                      src={room.image}
                      alt={room.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">
                      {room.name}
                    </h3>
                    <p className="text-khaki-600 font-semibold mb-4">{room.price}</p>
                    <ul className="space-y-2 mb-4">
                      {room.amenities.map((amenity) => (
                        <li key={amenity} className="flex items-center gap-2 text-sm text-terracotta-800">
                          <Check className="w-4 h-4 text-sage" />
                          {amenity}
                        </li>
                      ))}
                    </ul>
                    <div className="text-khaki-600 font-semibold group-hover:text-khaki-700 flex items-center gap-2">
                      View Details
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Dining Section */}
        <section id="dining" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-6">
                  A Taste of Namibia
                </h2>
                <p className="text-lg text-terracotta-800 mb-6 leading-relaxed">
                  Our on-site restaurant serves authentic Namibian cuisine alongside international favorites.
                  Start your day with our buffet breakfast, enjoy traditional dishes for lunch, and savor
                  expertly prepared dinners under the African sky.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Buffet breakfast (6:00 - 10:00)',
                    'Traditional Namibian specialties',
                    'Fresh, locally-sourced ingredients',
                    'Vegetarian and dietary options',
                    'Outdoor dining area',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-terracotta-800">
                      <div className="w-2 h-2 rounded-full bg-sage" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg">
                  <Link href="/dining">
                    <Utensils className="w-5 h-5" />
                    View Full Menu
                  </Link>
                </Button>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-card">
                <Image
                  src="/images/hospitality/restaurant_dining.jpeg"
                  alt="Hotel Etuna Restaurant"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tours Section */}
        <section id="tours" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                Explore Ongwediva & Beyond
              </h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">
                Discover the cultural richness and natural beauty of Northern Namibia with our curated tours
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Cultural Heritage Tour',
                  description: 'Visit traditional villages, meet local artisans, and learn about Oshiwambo culture.',
                  icon: Compass,
                  duration: 'Half Day',
                },
                {
                  name: 'Nature & Wildlife',
                  description: 'Explore nearby nature reserves, spot local wildlife, and enjoy scenic landscapes.',
                  icon: Sparkles,
                  duration: 'Full Day',
                },
                {
                  name: 'City & Market Tour',
                  description: 'Experience Ongwediva\'s vibrant markets, Trade Fair grounds, and city highlights.',
                  icon: MapPin,
                  duration: '3-4 Hours',
                },
              ].map((tour) => (
                <div
                  key={tour.name}
                  className="bg-nude-50 rounded-2xl p-8 hover:shadow-card transition-shadow"
                >
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mb-4">
                    <tour.icon className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-3">
                    {tour.name}
                  </h3>
                  <p className="text-terracotta-800 mb-4">{tour.description}</p>
                  <div className="text-sm text-khaki-600 font-semibold">{tour.duration}</div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild size="lg">
                <Link href="/tours">
                  See All Tours & Activities
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Guest Reviews Section */}
        <section className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-sage/20 text-sage px-4 py-2 rounded-full mb-4">
                <Star className="w-5 h-5 fill-sage" />
                <span className="font-bold text-lg">9.0/10</span>
                <span className="text-sm">Exceptional</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                Guest Love
              </h2>
              <p className="text-lg text-terracotta-800">
                What our guests say about their experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Sarah M.',
                  location: 'Windhoek',
                  rating: 5,
                  comment: 'Exceptional hospitality! The staff went above and beyond to make our stay memorable. The restaurant serves amazing traditional food.',
                },
                {
                  name: 'John K.',
                  location: 'Cape Town',
                  rating: 5,
                  comment: 'Perfect location for the Trade Fair. Rooms are spotless, pool is refreshing, and breakfast is excellent. Will definitely return!',
                },
                {
                  name: 'Linda T.',
                  location: 'Germany',
                  rating: 5,
                  comment: 'A true gem in Ongwediva. The cultural tour was enlightening, and the staff\'s warmth made us feel like family. Highly recommend!',
                },
              ].map((review) => (
                <div key={review.name} className="bg-white rounded-2xl p-6 shadow-card">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-khaki-600 text-khaki-600" />
                    ))}
                  </div>
                  <p className="text-terracotta-800 mb-4 italic">"{review.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center text-white font-bold">
                      {review.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-terracotta-900">{review.name}</div>
                      <div className="text-sm text-terracotta-800">{review.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Widget Section */}
        <section id="booking" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-khaki-600 to-terracotta-800 rounded-3xl p-8 md:p-12 text-white">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-center">
                Book Your Stay
              </h2>
              <p className="text-center text-white/90 mb-8 text-lg">
                Experience authentic Namibian hospitality at Hotel Etuna
              </p>
              
              <div className="bg-white rounded-2xl p-6 md:p-8">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Guests
                    </label>
                    <select className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent">
                      <option>1 Guest</option>
                      <option>2 Guests</option>
                      <option>3 Guests</option>
                      <option>4+ Guests</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Room Type
                    </label>
                    <select className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent">
                      <option>Standard Room</option>
                      <option>Luxury Room</option>
                      <option>Family Suite</option>
                      <option>Executive Suite</option>
                      <option>Premier Suite</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Button size="xl" className="w-full bg-khaki-600 hover:bg-khaki-700">
                      <Calendar className="w-5 h-5" />
                      Check Availability
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Referral Partners Section */}
        <section id="partners" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                More Lodging in Windhoek Area
              </h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">
                Explore our trusted partner properties for alternative accommodation options
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  name: 'Jayla Accommodation',
                  slug: 'jayla',
                  image: '/images/hospitality/partner_jayla.jpeg',
                  description: 'Cozy guesthouse with 8-10 rooms, perfect for travelers seeking a homey atmosphere.',
                  location: 'Windhoek',
                },
                {
                  name: 'Aquarius Windhoek',
                  slug: 'aquarius',
                  image: '/images/hospitality/partner_aquarius.jpeg',
                  description: '15-20 apartment units ideal for extended stays and families.',
                  location: 'Windhoek',
                },
              ].map((partner) => (
                <Link
                  key={partner.slug}
                  href={`/partners/${partner.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="aspect-[16/9] relative bg-nude-200">
                    <Image
                      src={partner.image}
                      alt={partner.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">
                      {partner.name}
                    </h3>
                    <p className="text-terracotta-800 mb-3">{partner.description}</p>
                    <div className="flex items-center gap-2 text-sm text-khaki-600 font-semibold">
                      <MapPin className="w-4 h-4" />
                      {partner.location}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-terracotta-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center font-display font-bold">
                    HE
                  </div>
                  <span className="font-display text-xl font-bold">Hotel Etuna</span>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  He takes care of us – authentic Namibian hospitality in Ongwediva
                </p>
                <div className="flex gap-3">
                  <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-khaki-600 transition-colors">
                    f
                  </a>
                  <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-khaki-600 transition-colors">
                    in
                  </a>
                  <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-khaki-600 transition-colors">
                    ig
                  </a>
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/rooms" className="text-white/80 hover:text-khaki-600 transition-colors">Rooms</Link></li>
                  <li><Link href="/dining" className="text-white/80 hover:text-khaki-600 transition-colors">Dining</Link></li>
                  <li><Link href="/tours" className="text-white/80 hover:text-khaki-600 transition-colors">Tours</Link></li>
                  <li><Link href="/about" className="text-white/80 hover:text-khaki-600 transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="text-white/80 hover:text-khaki-600 transition-colors">Contact</Link></li>
                </ul>
              </div>
              
              {/* Contact */}
              <div>
                <h4 className="font-semibold mb-4">Contact Us</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80">123 Main Street, Ongwediva, Namibia</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <a href="tel:+26465123456" className="text-white/80 hover:text-khaki-600 transition-colors">
                      +264 65 123 456
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <a href="mailto:info@hoteletuna.com" className="text-white/80 hover:text-khaki-600 transition-colors">
                      info@hoteletuna.com
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Hours */}
              <div>
                <h4 className="font-semibold mb-4">Hours</h4>
                <ul className="space-y-2 text-sm text-white/80">
                  <li>Check-in: 2:00 PM</li>
                  <li>Check-out: 11:00 AM</li>
                  <li>Reception: 24/7</li>
                  <li>Restaurant: 6:00 AM - 10:00 PM</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
              <p>© 2026 Hotel Etuna. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
