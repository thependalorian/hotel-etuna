'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { SofiaAvatar } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function SofiaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am Sofia, your AI concierge. How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/sofia/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${errorData.message || 'Failed to get response.'}` },
        ]);
      } else {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'An unexpected error occurred.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl h-[700px] flex flex-col shadow-luxury-medium border-luxury-charlotte/20" variant="luxury">
      {/* Header with AI Glow */}
      <CardHeader className="bg-gradient-to-r from-luxury-champagne/30 to-nude-100/30 border-b border-luxury-charlotte/30 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <SofiaAvatar size="lg" showStatus isOnline variant="gradient" />
            <div className="absolute inset-0 rounded-full animate-ai-pulse" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-display text-2xl font-bold text-nude-900">Sofia AI Concierge</CardTitle>
            <p className="text-sm text-nude-600 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse-soft" />
              Online and ready to assist
            </p>
          </div>
        </div>
      </CardHeader>
      
      {/* Messages Container */}
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-gradient-to-b from-nude-50/30 to-white">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={cn(
              'flex animate-slide-up',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                'max-w-[80%] p-4 rounded-2xl transition-all duration-200',
                msg.role === 'user' 
                  ? 'bg-nude-600 text-white shadow-nude-soft rounded-br-sm' 
                  : 'bg-white text-nude-900 rounded-bl-sm border border-luxury-charlotte/30 shadow-luxury-soft animate-ai-pulse'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-luxury-charlotte/20">
                  <SofiaAvatar size="sm" variant="gradient" />
                  <span className="text-xs font-semibold text-luxury-charlotte">Sofia</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[80%] p-4 rounded-2xl rounded-bl-sm bg-white text-nude-900 border border-luxury-charlotte/30 shadow-luxury-soft animate-ai-pulse">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-luxury-charlotte animate-bounce-subtle" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-luxury-charlotte animate-bounce-subtle" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-luxury-charlotte animate-bounce-subtle" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-nude-600">Sofia is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      {/* Input Area */}
      <CardFooter className="border-t border-luxury-charlotte/30 p-4 bg-gradient-to-r from-luxury-champagne/10 to-nude-50/10 backdrop-blur-sm">
        <div className="flex gap-3 w-full">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
            placeholder="Ask Sofia anything..."
            className="flex-1 min-h-[52px] border-luxury-charlotte/30 focus:border-luxury-charlotte focus:ring-luxury-charlotte/20"
            disabled={loading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            variant="luxury"
            size="lg"
            className="min-h-[52px] px-8 shadow-luxury-soft hover:shadow-luxury-medium"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                Send
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
