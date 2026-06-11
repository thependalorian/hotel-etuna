/**
 * @fileoverview StaffService — staff record CRUD and filtering (`staff`).
 * Location: lib/services/staff/StaffService.ts
 */
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

const STAFF_SELECT = sql`
  id, tenant_id, property_id, user_id, employee_number, first_name, last_name, email, phone,
  position, department, employment_type, status, hire_date, termination_date,
  hourly_rate, salary, currency, created_at, updated_at
`;

function normalizeStatus(status: string | undefined | null): string {
  const raw = String(status ?? 'active').toLowerCase().replace(/-/g, '_');
  if (raw === 'active' || raw === 'inactive' || raw === 'terminated' || raw === 'on_leave') {
    return raw;
  }
  return raw === 'pending_verification' ? 'pending_verification' : 'active';
}

function normalizeEmploymentType(value: string | undefined | null): string {
  const raw = String(value ?? 'full_time').toLowerCase().replace(/-/g, '_');
  return raw;
}

function isActiveStatus(status: string | null | undefined): boolean {
  const s = normalizeStatus(status);
  return s === 'active';
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
      employmentType:
        (row.employmentType as string) ?? (row.employment_type as string) ?? 'full_time',
      status: normalizeStatus((row.status as string) ?? 'active'),
      hireDate: (row.hireDate as string) ?? (row.hire_date as string),
      terminationDate: (row.terminationDate as string) ?? (row.termination_date as string) ?? null,
      hourlyRate: (row.hourlyRate as string) ?? (row.hourly_rate as string) ?? null,
      salary: (row.salary as string) ?? null,
      currency: (row.currency as string) ?? 'NAD',
      createdAt: (row.createdAt as Date) ?? (row.created_at as Date) ?? null,
      updatedAt: (row.updatedAt as Date) ?? (row.updated_at as Date) ?? null,
    };
  }

  async getStaff(tenantId: string): Promise<Staff[]> {
    try {
      const rows = await db.execute(sql`
        SELECT ${STAFF_SELECT}
        FROM staff
        WHERE tenant_id = ${tenantId}
      `);
      return rows.rows.map((row) => this.mapStaffRow(row as Record<string, unknown>));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching staff');
    }
  }

  async getStaffByTenant(tenantId: string, filters?: StaffFilters): Promise<Staff[]> {
    try {
      const rows = await db.execute(sql`
        SELECT ${STAFF_SELECT}
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
          const matchesDepartment = filters?.department
            ? member.department === filters.department
            : true;
          const matchesProperty = filters?.propertyId
            ? member.propertyId === filters.propertyId
            : true;
          return matchesSearch && matchesDepartment && matchesProperty;
        });
    } catch (error) {
      throw handleServiceError(error, 'Error fetching staff by tenant');
    }
  }

  async getStaffStats(tenantId: string): Promise<StaffStats> {
    try {
      const result = await db.execute(sql`
        SELECT department, status, hire_date
        FROM staff
        WHERE tenant_id = ${tenantId}
      `);
      const rows = result.rows as Array<{
        department: string | null;
        status: string | null;
        hire_date: string | null;
      }>;
      const totalStaff = rows.length;
      const activeStaff = rows.filter((r) => isActiveStatus(r.status)).length;
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

  async createStaff(tenantId: string, data: Partial<NewStaff>): Promise<Staff> {
    try {
      const employeeNumber =
        data.employeeNumber || `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const hireDate = data.hireDate
        ? typeof data.hireDate === 'string'
          ? data.hireDate
          : new Date(data.hireDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const employment = normalizeEmploymentType(data.employmentType as string);
      const status = normalizeStatus(data.status as string);
      const insertedStaff = await db.execute(sql`
        INSERT INTO staff (
          id, tenant_id, property_id, user_id, employee_number, first_name, last_name, email, phone,
          position, department, employment_type, status, hire_date, termination_date,
          hourly_rate, salary, currency, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          ${tenantId},
          ${data.propertyId ?? null},
          ${data.userId ?? null},
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
          ${data.terminationDate ? String(data.terminationDate).slice(0, 10) : null},
          ${data.hourlyRate ?? null},
          ${data.salary ?? null},
          ${data.currency ?? 'NAD'},
          NOW(),
          NOW()
        )
        RETURNING ${STAFF_SELECT}
      `);

      return this.mapStaffRow(insertedStaff.rows[0] as Record<string, unknown>);
    } catch (error) {
      throw handleServiceError(error, 'Error creating staff');
    }
  }

  async getStaffById(staffId: string, tenantId: string): Promise<Staff | null> {
    try {
      const rows = await db.execute(sql`
        SELECT ${STAFF_SELECT}
        FROM staff
        WHERE id = ${staffId} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      const row = rows.rows[0];
      return row ? this.mapStaffRow(row as Record<string, unknown>) : null;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching staff member');
    }
  }

  async updateStaff(staffId: string, tenantId: string, data: Partial<NewStaff>): Promise<Staff> {
    try {
      const existing = await this.getStaffById(staffId, tenantId);
      if (!existing) {
        throw new AppError(404, 'Staff member not found');
      }

      const employment = data.employmentType
        ? normalizeEmploymentType(data.employmentType as string)
        : undefined;
      const status = data.status ? normalizeStatus(data.status as string) : undefined;

      const rows = await db.execute(sql`
        UPDATE staff
        SET
          property_id = COALESCE(${data.propertyId ?? null}, property_id),
          user_id = COALESCE(${data.userId ?? null}, user_id),
          first_name = COALESCE(${data.firstName ?? null}, first_name),
          last_name = COALESCE(${data.lastName ?? null}, last_name),
          email = COALESCE(${data.email ?? null}, email),
          phone = COALESCE(${data.phone ?? null}, phone),
          position = COALESCE(${data.position ?? null}, position),
          department = COALESCE(${data.department ?? null}, department),
          employment_type = COALESCE(${employment ?? null}, employment_type),
          status = COALESCE(${status ?? null}, status),
          hire_date = COALESCE(${data.hireDate ? String(data.hireDate).slice(0, 10) : null}, hire_date),
          termination_date = COALESCE(${data.terminationDate ? String(data.terminationDate).slice(0, 10) : null}, termination_date),
          hourly_rate = COALESCE(${data.hourlyRate ?? null}, hourly_rate),
          salary = COALESCE(${data.salary ?? null}, salary),
          currency = COALESCE(${data.currency ?? null}, currency),
          updated_at = NOW()
        WHERE id = ${staffId} AND tenant_id = ${tenantId}
        RETURNING ${STAFF_SELECT}
      `);

      if (!rows.rows[0]) {
        throw new AppError(404, 'Staff member not found');
      }
      return this.mapStaffRow(rows.rows[0] as Record<string, unknown>);
    } catch (error) {
      throw handleServiceError(error, 'Error updating staff');
    }
  }

  async deleteStaff(staffId: string, tenantId: string): Promise<void> {
    try {
      const result = await db.execute(sql`
        DELETE FROM staff
        WHERE id = ${staffId} AND tenant_id = ${tenantId}
        RETURNING id
      `);
      if (!result.rows[0]) {
        throw new AppError(404, 'Staff member not found');
      }
    } catch (error) {
      throw handleServiceError(error, 'Error deleting staff');
    }
  }
}
