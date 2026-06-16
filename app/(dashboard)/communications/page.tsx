/**
 * Communications hub — WhatsApp threads for front desk and support.
 * Location: app/(dashboard)/communications/page.tsx
 */

import PageHeader from '@/components/shared/PageHeader';
import { CommunicationsHubList } from '@/components/features/communications/CommunicationsHubList';

export default function CommunicationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Communications"
        description="WhatsApp guest threads — Sofia AI and human handoff for front desk and support"
      />
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <CommunicationsHubList />
        </div>
      </div>
    </div>
  );
}
