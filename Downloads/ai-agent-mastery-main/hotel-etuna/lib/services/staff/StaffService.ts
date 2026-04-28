import { db } from '@/lib/db';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { sql } from 'drizzle-orm';
import type { Staff, NewStaff } from '@/lib/db/schema';

interface StaffFilters {
  search?: string;
  department?: string;
  propertyId?: string;
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  departments: number;
  newHiresThisMonth: number;
  byDepartment?: Record<string, number>;
}

export class StaffService {
  private mapStaffRow(row: Record<string, unknown>): Staff {
    return {
      id: row.id as string,
      tenantId: (row.tenantId as string) ?? (row.tenant_id as string) ?? null,
      propertyId: (row.propertyId as string) ?? (row.property_id as string) ?? null,
      userId: (row.userId as string) ?? (row.user_id as string) ?? null,
      employeeNumber: (row.employeeNumber as string) ?? (row.employee_number as string),
      firstName: (row.firstName as string) ?? (row.first_name as string),
      lastName: (row.lastName as string) ?? (row.last_name as string),
      email: (row.email as string) ?? null,
      phone: (row.phone as string) ?? null,
      position: row.position as string,
      department: (row.department as string) ?? null,
      employmentType: (row.employmentType as string) ?? (row.employment_type as string) ?? 'full_time',
      status: (row.status as string) ?? 'active',
      hireDate: (row.hireDate as string) ?? (row.hire_date as string),
      terminationDate: (row.terminationDate as string) ?? (row.termination_date as string) ?? null,
      hourlyRate: (row.hourlyRate as string) ?? (row.hourly_rate as string) ?? null,
      salary: (row.salary as string) ?? null,
      currency: (row.currency as string) ?? null,
      createdAt: (row.createdAt as Date) ?? (row.created_at as Date) ?? null,
      updatedAt: (row.updatedAt as Date) ?? (row.updated_at as Date) ?? null,
    };
  }
  /**
   * Get all staff for the current tenant.
   */
  async getStaff(tenantId: string): Promise<Staff[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, tenant_id, property_id, employee_number, first_name, last_name, email, phone, position, department, employment_type, status, hire_date, created_at, updated_at
        FROM staff
        WHERE tenant_id = ${tenantId}
      `);
      return rows.rows.map((row) => this.mapStaffRow(row as Record<string, unknown>));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching staff');
    }
  }

  /**
   * Get staff by tenant with optional filters.
   */
  async getStaffByTenant(tenantId: string, filters?: StaffFilters): Promise<Staff[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, tenant_id, property_id, employee_number, first_name, last_name, email, phone, position, department, employment_type, status, hire_date, created_at, updated_at
        FROM staff
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `);
      return rows.rows
        .map((row) => this.mapStaffRow(row as Record<string, unknown>))
        .filter((member) => {
          const search = filters?.search?.toLowerCase();
          const matchesSearch = search
            ? member.firstName?.toLowerCase().includes(search) ||
              member.lastName?.toLowerCase().includes(search) ||
              member.email?.toLowerCase().includes(search)
            : true;
          const matchesDepartment = filters?.department ? member.department === filters.department : true;
          const matchesProperty = filters?.propertyId ? member.propertyId === filters.propertyId : true;
          return matchesSearch && matchesDepartment && matchesProperty;
        });
    } catch (error) {
      throw handleServiceError(error, 'Error fetching staff by tenant');
    }
  }

  /**
   * Get staff statistics for the tenant.
   */
  async getStaffStats(tenantId: string): Promise<StaffStats> {
    try {
      const result = await db.execute(sql`
        SELECT department, status, hire_date
        FROM staff
        WHERE tenant_id = ${tenantId}
      `);
      const rows = result.rows as Array<{ department: string | null; status: string | null; hire_date: string | null }>;
      const totalStaff = rows.length;
      const activeStaff = rows.filter((r) => (r.status ?? '').toUpperCase() === 'ACTIVE').length;
      const byDepartment: Record<string, number> = {};
      let newHiresThisMonth = 0;
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      for (const row of rows) {
        if (row.department) {
          byDepartment[row.department] = (byDepartment[row.department] ?? 0) + 1;
        }
        if (row.hire_date && new Date(row.hire_date) >= monthStart) {
          newHiresThisMonth += 1;
        }
      }
      const departments = Object.keys(byDepartment).length;

      return {
        totalStaff,
        activeStaff,
        departments,
        newHiresThisMonth,
        byDepartment,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error fetching staff stats');
    }
  }

  /**
   * Create a new staff member.
   */
  async createStaff(tenantId: string, data: Partial<NewStaff>): Promise<Staff> {
    try {
      const employeeNumber = data.employeeNumber || `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const hireDate = data.hireDate
        ? (typeof data.hireDate === 'string' ? data.hireDate : new Date(data.hireDate).toISOString().slice(0, 10))
        : new Date().toISOString().slice(0, 10);
      const employment = String(data.employmentType ?? 'FULL_TIME').toUpperCase();
      const status = String(data.status ?? 'ACTIVE').toUpperCase();
      const insertedStaff = await db.execute(sql`
        INSERT INTO staff (
          id, tenant_id, property_id, employee_number, first_name, last_name, email, phone, position, department, employment_type, status, hire_date, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          ${tenantId},
          ${data.propertyId ?? null},
          ${employeeNumber},
          ${data.firstName ?? 'Test'},
          ${data.lastName ?? 'Staff'},
          ${data.email ?? null},
          ${data.phone ?? null},
          ${data.position ?? 'Staff'},
          ${data.department ?? null},
          ${employment},
          ${status},
          ${hireDate},
          NOW(),
          NOW()
        )
        RETURNING id, tenant_id, property_id, employee_number, first_name, last_name, email, phone, position, department, employment_type, status, hire_date, created_at, updated_at
      `);

      return this.mapStaffRow(insertedStaff.rows[0] as Record<string, unknown>);
    } catch (error) {
      throw handleServiceError(error, 'Error creating staff');
    }
  }
}
