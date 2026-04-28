/**
 * Sofia AI Section Component
 * 
 * Purpose: Landing page section showcasing Sofia AI concierge capabilities
 * Location: /components/sections/landing/SofiaAISection.tsx
 * 
 * Features:
 * - Chat interface demo on left
 * - Feature list on right
 * - Status indicators (active/coming soon)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Gradient background: from-nude-600/10 via-base-100 to-nude-500/10
 * - Grid layout: lg:grid-cols-2
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic section element
 * 
 * @module SofiaAISection
 */

import { Phone, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import SofiaChatDemo from './cards/SofiaChatDemo';

const features = [
  { icon: Phone, title: 'Voice Capabilities', desc: 'Coming soon', status: 'coming' as const },
  { icon: MessageSquare, title: 'WhatsApp Integration', desc: 'Coming soon', status: 'coming' as const },
  { icon: CheckCircle2, title: '24/7 Availability', desc: 'Never miss a booking—chat, email, or phone', status: 'active' as const },
  { icon: Mail, title: 'Email Management', desc: 'Captures emails, sends quotations, CCs property owners', status: 'active' as const },
];

export default function SofiaAISection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-nude-600/10 via-base-100 to-nude-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Chat Interface Mockup */}
          <div className="relative">
            <SofiaChatDemo />
          </div>

          {/* Right: Features */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
              Meet Your Concierge
            </h2>
            <p className="text-xl text-base-content/90 mb-8 leading-relaxed">
              Sofia, your AI concierge, handles all guest inquiries 24/7—whether they come through chat, email, or phone. She captures guest information, responds instantly, sends quotations and confirmations via email, and converts inquiries into bookings automatically. Property owners are automatically CC'd on all email communications for transparency and oversight.
            </p>

            <div className="space-y-6">
              {features.map((feature, idx) => {
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
    </section>
  );
}
