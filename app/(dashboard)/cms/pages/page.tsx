/**
 * CMS Pages List - Content Management System
 *
 * Purpose: List all CMS pages (drafts and published)
 * Location: /app/(dashboard)/cms/pages/page.tsx
 *
 * Features:
 * - View all pages for the current tenant
 * - Filter by status (draft, published)
 * - Create new pages
 * - Edit existing pages
 */

import React from 'react';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import { db, cmsPages, users } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CmsPagesListPage() {
  const session = await getSessionWithTenantContext();

  if (!session || !session.user?.tenantId) {
    redirect('/login');
  }

  const tenantId = session.user.tenantId;

  // Fetch all pages for this tenant
  const pages = await db
    .select({
      id: cmsPages.id,
      slug: cmsPages.slug,
      title: cmsPages.title,
      status: cmsPages.status,
      publishedAt: cmsPages.publishedAt,
      createdAt: cmsPages.createdAt,
      updatedAt: cmsPages.updatedAt,
      createdByName: users.name,
    })
    .from(cmsPages)
    .leftJoin(users, eq(cmsPages.createdBy, users.id))
    .where(eq(cmsPages.tenantId, tenantId))
    .orderBy(desc(cmsPages.updatedAt));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CMS Pages</h1>
          <p className="text-base-content/70 mt-2">
            Manage your website pages with the block editor
          </p>
        </div>
        <Link
          href="/cms/pages/new"
          className="btn btn-primary"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Page
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">No pages yet</h2>
            <p>Create your first page to get started with the block editor.</p>
            <div className="card-actions justify-center">
              <Link href="/cms/pages/new" className="btn btn-primary">
                Create First Page
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <div className="font-medium">{page.title}</div>
                  </td>
                  <td>
                    <code className="text-sm">/{page.slug}</code>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        page.status === 'published'
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td>{page.createdByName || 'Unknown'}</td>
                  <td>
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        href={`/cms/pages/${page.id}`}
                        className="btn btn-sm btn-ghost"
                      >
                        Edit
                      </Link>
                      {page.status === 'published' && (
                        <Link
                          href={`/${page.slug}`}
                          target="_blank"
                          className="btn btn-sm btn-ghost"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
