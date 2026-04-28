/**
 * Sofia Chat Demo Component
 * 
 * Purpose: Interactive chat interface mockup for Sofia AI demonstration
 * Location: /components/sections/landing/cards/SofiaChatDemo.tsx
 * 
 * Features:
 * - Chat header with Sofia avatar and status
 * - Message bubbles (Sofia and user)
 * - Interactive buttons in messages
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100, bg-base-200
 * - Card styling: shadow-2xl
 * - Avatar component: SofiaAvatar
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h3)
 * - ARIA labels for status indicators
 * 
 * @module SofiaChatDemo
 */

import { Button } from '@/components/ui/Button';
import { SofiaAvatar } from '@/components/ui';

export default function SofiaChatDemo() {
  return (
    <div className="card bg-base-100 shadow-2xl">
      <div className="card-body p-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-base-300">
          <SofiaAvatar size="lg" showStatus isOnline variant="gradient" />
          <div className="flex-1">
            <h3 className="text-xl font-semibold">Sofia Concierge</h3>
            <p className="text-sm text-base-content/80">Demo Hotel • Online</p>
          </div>
          <div className="flex items-center gap-2 text-success" aria-label="Online status">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-sm font-medium">Online now</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <SofiaAvatar size="sm" showStatus isOnline variant="gradient" />
            </div>
            <div className="flex-1 bg-base-200 rounded-lg p-4">
              <p className="text-base-content/90">
                "Hi! I'm Sofia, your AI concierge. I'm here to help with bookings, answer questions, and make your guests' stay unforgettable."
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <div className="flex-1 bg-primary text-primary-content rounded-lg p-4 max-w-md ml-auto">
              <p>I need a room for this weekend, Friday to Sunday. What do you have available?</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <SofiaAvatar size="sm" showStatus isOnline variant="gradient" />
            </div>
            <div className="flex-1 bg-base-200 rounded-lg p-4">
              <p className="text-base-content/90 mb-3">
                "Perfect! I have a few great options for you. We have a Deluxe Suite with city views for N$2,500/night, or our Executive Room with balcony for N$1,800/night."
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm">View Suite</Button>
                <Button variant="outline" size="sm">View Executive</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
