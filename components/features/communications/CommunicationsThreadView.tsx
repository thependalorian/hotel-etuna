/**
 * CommunicationsThreadView — single WhatsApp thread with staff reply composer.
 * Location: components/features/communications/CommunicationsThreadView.tsx
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

type ThreadMessage = {
  id: string;
  senderType: string;
  content: string;
  createdAt: string | null;
};

type ThreadDetail = {
  sessionId: string;
  status: string | null;
  guestPhone: string | null;
  assignedInbox: string | null;
  whatsappProvider: string | null;
  messages: ThreadMessage[];
};

type CommunicationsThreadViewProps = {
  sessionId: string;
};

export function CommunicationsThreadView({ sessionId }: CommunicationsThreadViewProps) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/communications/threads/${encodeURIComponent(sessionId)}`);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { thread?: ThreadDetail };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Failed to load thread');
      }
      setThread(json.data?.thread ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function assignInbox(inbox: 'frontdesk' | 'support') {
    const res = await fetch(`/api/communications/threads/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedInbox: inbox }),
    });
    if (res.ok) void load();
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/communications/threads/${encodeURIComponent(sessionId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Send failed');
      }
      setReply('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="alert alert-warning">
        <span>Thread not found.</span>
        <Link href="/communications" className="btn btn-sm rounded-full">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <Link href="/communications" className="link link-hover text-sm">
            ← All threads
          </Link>
          <h2 className="text-lg font-semibold mt-1">Guest {thread.guestPhone ?? '—'}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {thread.status === 'escalated' && (
              <span className="badge badge-warning">Escalated</span>
            )}
            {thread.whatsappProvider && (
              <span className="badge badge-outline">{thread.whatsappProvider}</span>
            )}
            {thread.assignedInbox && (
              <span className="badge badge-ghost">Assigned: {thread.assignedInbox}</span>
            )}
          </div>
        </div>
        <div className="join">
          <button
            type="button"
            className="btn btn-outline btn-sm join-item rounded-full"
            onClick={() => void assignInbox('frontdesk')}
          >
            Assign front desk
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm join-item rounded-full"
            onClick={() => void assignInbox('support')}
          >
            Assign support
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body gap-3 max-h-[28rem] overflow-y-auto">
          {thread.messages.map((m) => {
            const isGuest = m.senderType === 'USER';
            const isStaff = m.senderType === 'STAFF';
            return (
            <div
              key={m.id}
              className={`chat ${isGuest ? 'chat-start' : 'chat-end'}`}
            >
              <div className="chat-header text-xs opacity-70">{m.senderType}</div>
              <div
                className={`chat-bubble ${
                  isStaff ? 'chat-bubble-secondary' : ''
                }`}
              >
                {m.content}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={sendReply} className="flex flex-col sm:flex-row gap-2">
        <textarea
          className="textarea textarea-bordered flex-1 min-h-[88px]"
          placeholder="Reply to guest on WhatsApp…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          maxLength={4096}
          required
        />
        <Button
          type="submit"
          className="min-h-touch-mobile"
          isLoading={sending}
          disabled={!reply.trim()}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
