/**
 * UserList Component
 *
 * Purpose: Route-level user listing wrapper used by platform admin pages.
 * Location: components/features/admin/platform/UserList.tsx
 */
'use client';

import UserManagement from '@/components/features/admin/platform/UserManagement';

interface UserWithTenant {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  tenant_id: string | null;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  tenant_name: string | null;
}

interface UserListProps {
  users: UserWithTenant[];
  userRole: string;
}

export default function UserList({ users, userRole }: UserListProps) {
  return <UserManagement users={users} userRole={userRole} />;
}
