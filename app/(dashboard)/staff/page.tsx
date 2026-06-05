import React from 'react';
import { StaffService } from '@/lib/services/staff/StaffService';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { AppError } from '@/lib/utils/errors';
import StaffList from '@/components/features/staff/StaffList';
import { Plus, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { securityLogger } from '@/lib/utils/security-logger.client';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

async function getStaffData(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const session = await getSessionWithTenantContext();
    if (!session || !session.user?.tenantId) {
      // Return empty data instead of throwing - let the page render with empty state
      return { staff: [], stats: null, properties: [] };
    }
    
    const staffService = new StaffService();
    const propertyService = new PropertyService();

    const filters = {
      search: searchParams.search as string,
      department: searchParams.department as string,
      propertyId: searchParams.propertyId as string,
    };

    try {
      const [staffData, statsData, propertiesData] = await Promise.all([
        staffService.getStaffByTenant(session.user.tenantId as string, filters).catch(() => []),
        staffService.getStaffStats(session.user.tenantId as string).catch(() => null),
        propertyService.getPropertiesByTenant(session.user.tenantId as string).catch(() => []),
      ]);

      return { 
        staff: Array.isArray(staffData) ? staffData : [], 
        stats: statsData || null, 
        properties: Array.isArray(propertiesData) ? propertiesData : [] 
      };
    } catch (serviceError) {
      securityLogger.error('[StaffPage] Service error:', serviceError);
      // Return empty data on service errors
      return { staff: [], stats: null, properties: [] };
    }
  } catch (error) {
    securityLogger.error('[StaffPage] Error:', error);
    // Always return empty data to prevent page crash
    return { staff: [], stats: null, properties: [] };
  }
}

const StaffPage = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const { staff, stats, properties } = await getStaffData(searchParams);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Staff Management"
        description="Manage your team members and their schedules"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/compliance/kyc" className="btn btn-outline min-h-[44px]">
              KYC / KYB queue
            </Link>
            <Link href="/staff/new">
              <button
                className="btn btn-primary gentle-lift min-h-[44px]"
                aria-label="Add new staff member"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Staff Member
              </button>
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Staff', value: stats.totalStaff, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Active Staff', value: stats.activeStaff, icon: Users, color: 'text-success', bg: 'bg-success/10', desc: `${stats.totalStaff > 0 ? ((stats.activeStaff / stats.totalStaff) * 100).toFixed(1) : 0}% active` },
            { label: 'Departments', value: stats.departments, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'New Hires', value: stats.newHiresThisMonth, icon: Calendar, color: 'text-warning', bg: 'bg-warning/10', desc: 'This month' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.label}
                className="card bg-base-100 shadow-lg card-hover animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-base-content/60 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-base-content mb-1">{stat.value}</p>
                      {stat.desc && (
                        <p className="text-xs text-base-content/50">{stat.desc}</p>
                      )}
                    </div>
                    <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StaffList initialStaff={staff} properties={properties} />
    </div>
  );
};

export default StaffPage;
