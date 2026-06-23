/**
 * SofiaChatInputRow — shared message input + send control for Sofia chat surfaces.
 * Location: components/features/sofia/SofiaChatInputRow.tsx
 */

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Send } from 'lucide-react';
import type { RefObject } from 'react';

type SofiaChatInputRowProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  variant?: 'luxury' | 'default' | 'compact';
  sendLabel?: string;
  className?: string;
};

export function SofiaChatInputRow({
  value,
  onChange,
  onSend,
  loading,
  placeholder = 'Type your message...',
  inputRef,
  variant = 'default',
  sendLabel = 'Send',
  className = '',
}: SofiaChatInputRowProps) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  if (variant === 'luxury') {
    return (
      <div className={`flex gap-3 w-full ${className}`}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="flex-1 min-h-[52px] border-luxury-charlotte/30 focus:border-luxury-charlotte focus:ring-luxury-charlotte/20"
          disabled={loading}
        />
        <Button
          type="button"
          onClick={onSend}
          disabled={loading || !value.trim()}
          variant="luxury"
          size="lg"
          className="min-h-[52px] px-8 shadow-luxury-soft "
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              {sendLabel}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </>
          )}
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex gap-2 w-full ${className}`}>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1"
          aria-label="Message input"
        />
        <Button
          type="button"
          onClick={onSend}
          disabled={loading || !value.trim()}
          className="min-h-[44px]"
          aria-label="Send message"
        >
          {loading ? <LoadingSpinner size="sm" /> : sendLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex space-x-2 ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="shrink-0 input input-bordered input-sm min-h-[44px] flex-1"
        disabled={loading}
        aria-label="Message input"
      />
      <Button
        type="button"
        onClick={onSend}
        disabled={!value.trim() || loading}
        size="sm"
        className="min-h-[44px]"
        aria-label="Send message"
      >
        {loading ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
}
