'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { SofiaAvatar } from '@/components/ui';
import { SofiaChatMessagePane } from '@/components/features/sofia/SofiaChatMessagePane';
import { SofiaChatInputRow } from '@/components/features/sofia/SofiaChatInputRow';
import { useSofiaAutoScroll } from '@/components/features/sofia/useSofiaAutoScroll';
import type { SofiaChatMessage } from '@/components/features/sofia/sofia-chat-types';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface SofiaConciergeChatProps {
  propertyId?: string;
  guestId?: string;
  bookingId?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function SofiaConciergeChat({
  propertyId,
  guestId,
  bookingId,
  isOpen = false,
  onToggle,
}: SofiaConciergeChatProps) {
  const [messages, setMessages] = useState<SofiaChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useSofiaAutoScroll(messages.length, isLoading, isOpen && !isMinimized);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: SofiaChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm Sofia, your AI concierge. I'm here to help you with bookings, reservations, and any questions about our facilities. How can I assist you today?",
        timestamp: new Date(),
        confidence: 1.0,
        suggestions: ['Make a booking', 'View amenities', 'Check restaurant menu', 'Contact staff'],
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: SofiaChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/ai/concierge'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          sessionId,
          propertyId,
          guestId,
          bookingId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse = await response.json();
      
      const assistantMessage: SofiaChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        confidence: aiResponse.confidence,
        suggestions: aiResponse.suggestions,
        actions: aiResponse.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      securityLogger.error('Error sending message:', error);
      const errorMessage: SofiaChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment or contact our staff directly for immediate assistance.",
        timestamp: new Date(),
        confidence: 0,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleActionClick = async (action: { type: string; data: Record<string, unknown> }) => {
    switch (action.type) {
      case 'check_availability':
        // Navigate to booking page with pre-filled data
        window.location.href = `/bookings/new?propertyId=${action.data.propertyId}&dates=${(action.data.dates as string[]).join(',')}&guests=${action.data.guests}`;
        break;
      case 'show_menu':
        // Navigate to menu page
        window.location.href = `/menu?propertyId=${action.data.propertyId}`;
        break;
      case 'show_amenities':
        // Navigate to amenities page
        window.location.href = `/properties/${action.data.propertyId}`;
        break;
      default:
        securityLogger.warn('Unknown action', { actionType: action.type, actionData: action.data });
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary-focus transition-all duration-200 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-base-100 rounded-lg shadow-2xl z-50 transition-all duration-300 ${
      isMinimized ? 'w-16 h-16' : isExpanded ? 'w-96 h-[600px]' : 'w-80 h-[500px]'
    }`}>
      {/* Header */}
      <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SofiaAvatar size="sm" showStatus isOnline variant="gradient" />
          <span className="font-semibold">Sofia Concierge</span>
        </div>
        <div className="flex items-center space-x-2">
          {!isMinimized && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <SofiaChatMessagePane
            messages={messages}
            loading={isLoading}
            endRef={messagesEndRef}
            variant="concierge"
            className="h-[calc(100%-140px)]"
            onSuggestionClick={handleSuggestionClick}
            onActionClick={(action) => void handleActionClick(action)}
          />

          <div className="p-4 border-t">
            <SofiaChatInputRow
              value={inputMessage}
              onChange={setInputMessage}
              onSend={() => void handleSendMessage()}
              loading={isLoading}
              inputRef={inputRef}
              variant="default"
            />
          </div>
        </>
      )}
    </div>
  );
}
