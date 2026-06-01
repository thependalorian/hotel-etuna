/**
 * Create New CMS Page
 *
 * Purpose: Form to create a new CMS page
 * Location: /app/(dashboard)/cms/pages/new/page.tsx
 */

import React from 'react';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import CmsPageForm from '@/components/features/cms/CmsPageForm';

export const dynamic = 'force-dynamic';

export default async function NewCmsPagePage() {
  const session = await getSessionWithTenantContext();

  if (!session || !session.user?.tenantId) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Page</h1>
        <p className="text-base-content/70 mt-2">
          Fill in the basic details to create a new page
        </p>
      </div>

      <CmsPageForm />
    </div>
  );
}
