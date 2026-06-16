/**
 * Communications thread detail — staff reply to WhatsApp guest.
 * Location: app/(dashboard)/communications/[sessionId]/page.tsx
 */

import { CommunicationsThreadView } from '@/components/features/communications/CommunicationsThreadView';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function CommunicationsThreadPage({ params }: PageProps) {
  const { sessionId } = await params;
  return (
    <div className="space-y-6 animate-fade-in p-1">
      <CommunicationsThreadView sessionId={decodeURIComponent(sessionId)} />
    </div>
  );
}
