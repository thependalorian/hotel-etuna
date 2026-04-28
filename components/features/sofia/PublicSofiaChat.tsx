/**
 * Public Sofia Chat Component
 * 
 * Purpose: Sofia chat widget for public property pages
 * Location: /components/features/sofia/PublicSofiaChat.tsx
 * 
 * Features:
 * - No authentication required
 * - Property-specific context via slug
 * - Floating chat widget
 * - Mobile-responsive
 * 
 * Usage:
 * ```tsx
 * <PublicSofiaChat propertySlug="property-slug" />
 * ```
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { SofiaAvatar } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { apiUrl } from '@/lib/utils/api-url';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { MessageCircle, X, Minimize2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface PublicSofiaChatProps {
  propertySlug: string;
  className?: string;
}

export function PublicSofiaChat({ propertySlug, className }: PublicSofiaChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm Sofia, your AI concierge. I can help you with bookings, reservations, and any questions about this property. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [sessionId] = useState(() => `public_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const sendMessage = async () => {
    if (input.trim() === '' || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/public/sofia/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: propertySlug,
          message: userMessage.content,
          sessionId,
          ...(userEmail && { email: userEmail }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();
      
      // Check if email is needed
      if (data.intent === 'email_requested' && !userEmail) {
        setNeedsEmail(true);
      }
      
      // Extract email from user message if present
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const emailMatch = userMessage.content.match(emailRegex);
      if (emailMatch && !userEmail) {
        setUserEmail(emailMatch[0]);
        setNeedsEmail(false);
        setEmailInput('');
      }
      
      // Extract email from response if Sofia provides it
      if (data.entities?.email && !userEmail) {
        setUserEmail(data.entities.email as string);
        setNeedsEmail(false);
        setEmailInput('');
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact us directly.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-content',
          'shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110',
          'flex items-center justify-center',
          className
        )}
        aria-label="Open Sofia chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]',
        'transition-all duration-300',
        isMinimized ? 'h-16' : 'h-[600px]',
        className
      )}
    >
      <Card className="w-full h-full flex flex-col shadow-2xl border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-nude-600/10 to-nude-500/10 border-b border-base-300 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SofiaAvatar size="md" showStatus isOnline variant="gradient" />
              <div>
                <h3 className="font-semibold text-base-content">Sofia Concierge</h3>
                <p className="text-xs text-base-content/60">AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-base-200 rounded transition-colors"
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-base-200 rounded transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <SofiaAvatar size="sm" variant="gradient" className="flex-shrink-0" />
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2',
                      message.role === 'user'
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-200 text-base-content'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.timestamp && (
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">You</span>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <SofiaAvatar size="sm" variant="gradient" />
                  <div className="bg-base-200 rounded-lg px-4 py-2">
                    <LoadingSpinner size="sm" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="border-t border-base-300 flex-shrink-0 p-4">
              <div className="space-y-3 w-full">
                {/* Email input (shown when needed) */}
                {needsEmail && !userEmail && (
                  <div className="p-3 bg-base-200 rounded-lg">
                    <label className="text-sm font-medium mb-2 block text-base-content">
                      Email Address
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && emailInput.trim()) {
                            const email = emailInput.trim();
                            setUserEmail(email);
                            setNeedsEmail(false);
                            const emailMsg = `My email is ${email}`;
                            setEmailInput('');
                            setInput(emailMsg);
                            setTimeout(() => {
                              sendMessage();
                            }, 100);
                          }
                        }}
                        className="flex-1"
                        aria-label="Email input"
                      />
                      <Button
                        onClick={() => {
                          const email = emailInput.trim();
                          if (email) {
                            setUserEmail(email);
                            setNeedsEmail(false);
                            const emailMsg = `My email is ${email}`;
                            setEmailInput('');
                            setInput(emailMsg);
                            setTimeout(() => {
                              // Create a synthetic message to send
                              const syntheticMessage: ChatMessage = {
                                role: 'user',
                                content: emailMsg,
                                timestamp: new Date(),
                              };
                              setMessages((prev) => [...prev, syntheticMessage]);
                              // Trigger send
                              const event = new Event('submit');
                              // Use the actual sendMessage function
                              sendMessage();
                            }, 100);
                          }
                        }}
                        disabled={!emailInput.trim()}
                        size="sm"
                        aria-label="Submit email"
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Regular message input */}
                <div className="flex gap-2 w-full">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={loading}
                    className="flex-1"
                    aria-label="Message input"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="min-h-[44px]"
                    aria-label="Send message"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Send'}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
