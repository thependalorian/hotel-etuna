/**
 * Fraud Detection Dashboard Page
 * 
 * Purpose: Main page for fraud detection system
 * Functionality: Display fraud monitoring dashboard with real-time updates
 * Location: app/(dashboard)/fraud/page.tsx
 */

import { FraudDashboard } from '@/components/features/fraud/FraudDashboard';

export const metadata = {
  title: 'Fraud Detection | Hotel Etuna',
  description: 'Real-time fraud detection and prevention dashboard',
};

// Mock tenant ID - In production, get from session
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function FraudDetectionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FraudDashboard tenantId={TENANT_ID} />
    </div>
  );
}
