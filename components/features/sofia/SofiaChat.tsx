'use client';

/**
 * SofiaChat — staff dashboard widget using full concierge API (/api/sofia/chat).
 * Location: /components/features/sofia/SofiaChat.tsx
 */

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { SofiaAvatar } from '@/components/ui';
import { SofiaChatMessagePane } from '@/components/features/sofia/SofiaChatMessagePane';
import { SofiaChatInputRow } from '@/components/features/sofia/SofiaChatInputRow';
import { useSofiaAutoScroll } from '@/components/features/sofia/useSofiaAutoScroll';
import type { SofiaChatMessage } from '@/components/features/sofia/sofia-chat-types';
import { apiUrl } from '@/lib/utils/api-url';
import type { AIResponse } from '@/lib/types/ai';

export function SofiaChat() {
  const [messages, setMessages] = useState<SofiaChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am Sofia, your AI concierge. How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(
    () => `dash_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  );
  const messagesEndRef = useSofiaAutoScroll(messages.length, loading);

  const sendMessage = async () => {
    if (input.trim() === '' || loading) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/sofia/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${(errorData as { message?: string }).message || 'Failed to get response.'}`,
          },
        ]);
      } else {
        const data = (await response.json()) as AIResponse;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            suggestions: data.suggestions,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'An unexpected error occurred.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl h-[min(700px,calc(100dvh-8rem))] flex flex-col shadow-luxury-medium border-luxury-charlotte/20" variant="luxury">
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

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <SofiaChatMessagePane
          messages={messages}
          loading={loading}
          endRef={messagesEndRef}
          variant="luxury"
        />
      </CardContent>

      <CardFooter className="border-t border-luxury-charlotte/30 p-4 bg-gradient-to-r from-luxury-champagne/10 to-nude-50/10 backdrop-blur-sm">
        <SofiaChatInputRow
          value={input}
          onChange={setInput}
          onSend={() => void sendMessage()}
          loading={loading}
          placeholder="Ask Sofia anything..."
          variant="luxury"
        />
      </CardFooter>
    </Card>
  );
}
