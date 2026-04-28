/**
 * Platform Overview Section Component - CONSOLIDATED
 * 
 * Purpose: Comprehensive platform showcase combining all features
 * Location: /components/sections/landing/PlatformOverview.tsx
 * 
 * Features:
 * - Sofia AI demo and capabilities
 * - Core platform features (including Accommodation & F&B Management)
 * - Dashboard mockup
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Section padding: py-20 md:py-32
 * - Responsive grids throughout
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2, h3)
 * - Semantic section element
 * - Alt text for images
 * 
 * @module PlatformOverview
 */

import { BarChart3, FileText, Bot, Mail, Phone, MessageSquare, CheckCircle2, Home, Utensils } from 'lucide-react';
import { ImagePlaceholder } from '@/components/ui';
import FeatureCard from './cards/FeatureCard';
import SofiaChatDemo from './cards/SofiaChatDemo';

const coreFeatures = [
  {
    icon: Bot,
    title: 'Sofia AI Concierge',
    description: '24/7 availability across all channels. Handles chat, email, and phone inquiries instantly. Captures guest information, sends quotations via email, and property owners are automatically CC\'d on all communications.',
    features: ['24/7 chat, email, and phone support', 'Automatic email capture and sending', 'Quotations and confirmations via email', 'Property owners CC\'d on all emails'],
  },
  {
    icon: BarChart3,
    title: 'Business Intelligence',
    description: 'Get instant insights into occupancy, revenue, guest satisfaction, and operational performance.',
    features: ['Live revenue dashboards', 'Guest satisfaction tracking', 'Staff performance analytics', 'Multi-property comparison'],
  },
  {
    icon: FileText,
    title: 'Content Management',
    description: 'Easily manage your property\'s content, menus, rooms, and services with our intuitive CMS.',
    features: ['Drag-and-drop editor', 'Room and service management', 'Real-time updates', 'Image and media management'],
  },
  {
    icon: Home,
    title: 'Accommodation Management',
    description: 'Comprehensive property management for every type of accommodation business—from vacation rentals to AirBnB and guest houses.',
    features: [
      'Vacation Rentals: Self check-in, cleaning management, guest communication, dynamic pricing',
      'AirBnB & Lodges: Multiple restaurants, activities management, spa services, tour bookings',
      'Guest Houses: Breakfast management, housekeeping, local tours, personal service'
    ],
  },
  {
    icon: Utensils,
    title: 'Food & Beverage Management',
    description: 'Complete F&B management solutions for restaurants and bars of all sizes, with or without accommodation.',
    features: [
      'Standalone Restaurants: Menu management, table booking, order management, staff scheduling',
      'Bars & Lounges: Bar management, bottle service, order tracking, staff scheduling'
    ],
  },
];

const sofiaFeatures = [
  { icon: Phone, title: 'Voice Capabilities', desc: 'Coming soon', status: 'coming' as const },
  { icon: MessageSquare, title: 'WhatsApp Integration', desc: 'Coming soon', status: 'coming' as const },
  { icon: CheckCircle2, title: '24/7 Availability', desc: 'Never miss a booking—chat, email, or phone', status: 'active' as const },
  { icon: Mail, title: 'Email Management', desc: 'Captures emails, sends quotations, CCs property owners', status: 'active' as const },
];

interface PlatformOverviewProps {
  id?: string;
}

export default function PlatformOverview({ id }: PlatformOverviewProps) {
  return (
    <section id={id} className="py-20 md:py-32 bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            More Than Just AI—Complete Hospitality Management
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Unlike phone-only solutions, Hotel Etuna provides everything you need in one integrated platform. No external PMS required. No fragmented systems. Everything works together seamlessly.
          </p>
        </div>

        {/* Dashboard Image */}
        <div className="mb-16">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-base-200">
            <ImagePlaceholder
              src="/images/buffr/dashboard_booking.jpeg"
              alt="Hotel Etuna Dashboard"
              fill
              className="object-cover"
              quality={75}
              sizes="100vw"
              aspectRatio="video"
            />
          </div>
        </div>

        {/* Sofia AI Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold font-display mb-4 text-balance">
              Meet Your AI Concierge
            </h3>
            <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
              Sofia handles all guest inquiries 24/7—whether they come through chat, email, or phone. She captures guest information, responds instantly, sends quotations and confirmations via email, and converts inquiries into bookings automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Chat Demo */}
            <div className="relative">
              <SofiaChatDemo />
            </div>

            {/* Right: Features */}
            <div>
              <div className="space-y-6">
                {sofiaFeatures.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-lg bg-base-100 shadow-sm">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        feature.status === 'active' ? 'bg-success/10' : 'bg-base-200'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          feature.status === 'active' ? 'text-success' : 'text-base-content/80'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-base-content">{feature.title}</p>
                        <p className="text-sm text-base-content/80">{feature.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Core Features Grid */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold font-display mb-4 text-balance">
              Core Platform Features
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
