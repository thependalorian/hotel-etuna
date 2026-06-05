'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2 } from 'lucide-react';
import { SofiaAvatar, Avatar } from '@/components/ui';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Send welcome message when chat opens
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
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
      
      const assistantMessage: Message = {
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
      const errorMessage: Message = {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-NA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-base-content/60';
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-error';
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
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-base-200 text-base-content'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <div className="mt-1 shrink-0">
                        <SofiaAvatar size="sm" showStatus isOnline variant="gradient" />
                      </div>
                    )}
                    {message.role === 'user' && (
                      <div className="mt-1 shrink-0">
                        <Avatar size="sm" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                        {message.confidence !== undefined && (
                          <span className={`text-xs ${getConfidenceColor(message.confidence)}`}>
                            {Math.round(message.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs bg-base-300 hover:bg-base-400 rounded px-2 py-1 w-full text-left transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {message.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleActionClick(action)}
                              className="text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded px-2 py-1 w-full text-left transition-colors"
                            >
                              {action.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-base-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="shrink-0">
                      <SofiaAvatar size="sm" showStatus isOnline variant="gradient" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="shrink-0 input input-bordered input-sm min-h-[44px]"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="btn btn-primary btn-sm min-h-[44px]"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
