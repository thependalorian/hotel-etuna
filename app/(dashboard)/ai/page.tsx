/**
 * Sofia AI Concierge - Main Chat Interface
 * 
 * Purpose: AI-powered guest assistance and concierge services
 * Location: app/(dashboard)/ai/page.tsx
 * 
 * Features:
 * - Real-time chat with Sofia AI
 * - Conversation history
 * - Suggested actions
 * - Email integration (via sofia/email route)
 */

import React from 'react';
import SofiaConciergeChat from '@/components/features/ai/SofiaConciergeChat';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export default function AIPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <PageHeader
        title="Sofia AI Concierge"
        description="Your AI-powered assistant for guest inquiries and property management"
        actions={
          <Link 
            href="/sofia/email" 
            className="btn btn-outline btn-primary gentle-lift min-h-[44px]"
            aria-label="Open email tools"
          >
            Email Tools
          </Link>
        }
      />

      {/* AI Chat Interface */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <SofiaConciergeChat />
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-2">24/7 Availability</h3>
            <p className="text-sm text-base-content/70">
              Sofia is available around the clock to assist your guests
            </p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-2">Smart Responses</h3>
            <p className="text-sm text-base-content/70">
              Powered by Deepseek AI for intelligent, contextual responses
            </p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-2">Memory Enabled</h3>
            <p className="text-sm text-base-content/70">
              Remembers conversation context and guest preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
