/**
 * SofiaChatMessagePane — scrollable message list + typing indicator for Sofia chats.
 * Location: components/features/sofia/SofiaChatMessagePane.tsx
 */

import { SofiaAvatar } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/lib/formatters';
import { SofiaTypingIndicator } from '@/components/features/sofia/SofiaTypingIndicator';
import type { SofiaChatMessage } from '@/components/features/sofia/sofia-chat-types';
import type { RefObject } from 'react';

type SofiaChatMessagePaneProps = {
  messages: SofiaChatMessage[];
  loading: boolean;
  endRef: RefObject<HTMLDivElement | null>;
  variant?: 'luxury' | 'public' | 'concierge';
  className?: string;
  onSuggestionClick?: (suggestion: string) => void;
  onActionClick?: (action: { type: string; data: Record<string, unknown> }) => void;
};

export function SofiaChatMessagePane({
  messages,
  loading,
  endRef,
  variant = 'public',
  className,
  onSuggestionClick,
  onActionClick,
}: SofiaChatMessagePaneProps) {
  if (variant === 'luxury') {
    return (
      <div className={cn('flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-gradient-to-b from-nude-50/30 to-white', className)}>
        {messages.map((msg, index) => (
          <div
            key={msg.id ?? index}
            className={cn('flex animate-slide-up', msg.role === 'user' ? 'justify-end' : 'justify-start')}
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
        {loading && <SofiaTypingIndicator variant="luxury" />}
        <div ref={endRef} />
      </div>
    );
  }

  if (variant === 'concierge') {
    return (
      <div className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}>
        {messages.map((message) => (
          <div
            key={message.id ?? message.content}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3',
                message.role === 'user' ? 'bg-primary text-white' : 'bg-base-200 text-base-content'
              )}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <div className="mt-1 shrink-0">
                    <SofiaAvatar size="sm" showStatus isOnline variant="gradient" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    {message.timestamp && (
                      <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                    )}
                    {message.confidence !== undefined && (
                      <span
                        className={cn(
                          'text-xs',
                          message.confidence >= 0.8
                            ? 'text-success'
                            : message.confidence >= 0.6
                              ? 'text-warning'
                              : 'text-error'
                        )}
                      >
                        {Math.round(message.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  {message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
                    <div className="mt-3 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => onSuggestionClick(suggestion)}
                          className="text-xs bg-base-300 hover:bg-base-400 rounded px-2 py-1 w-full text-left transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.actions && message.actions.length > 0 && onActionClick && (
                    <div className="mt-3 space-y-1">
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => onActionClick(action)}
                          className="text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded px-2 py-1 w-full text-left transition-colors"
                        >
                          {action.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && <SofiaTypingIndicator variant="default" />}
        <div ref={endRef} />
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide', className)}>
      {messages.map((message, index) => (
        <div
          key={message.id ?? index}
          className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
        >
          {message.role === 'assistant' && (
            <SofiaAvatar size="sm" variant="gradient" className="flex-shrink-0" />
          )}
          <div
            className={cn(
              'max-w-[80%] rounded-lg px-4 py-2',
              message.role === 'user' ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            {message.timestamp && (
              <p className="text-xs opacity-60 mt-1">{formatTime(message.timestamp)}</p>
            )}
          </div>
          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">You</span>
            </div>
          )}
        </div>
      ))}
      {loading && <SofiaTypingIndicator variant="compact" />}
      <div ref={endRef} />
    </div>
  );
}
