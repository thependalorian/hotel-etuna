/**
 * PayrollService — Namibia PAYE/SSC payroll runs for Hotel Etuna staff.
 * Location: lib/services/payroll/PayrollService.ts
 *
 * Expected tables (migrations pending):
 * - payroll_periods(id, tenant_id, period_label, start_date, end_date, pay_date, status, created_at, updated_at)
 * - payroll_runs(id, tenant_id, period_id, status, run_number, total_gross, total_paye, total_ssc_employee,
 *     total_ssc_employer, total_net, approved_by, approved_at, created_at, updated_at)
 * - payroll_lines(id, tenant_id, run_id, staff_id, employee_number, staff_name, basic_wage, taxable_earnings,
 *     annual_taxable, paye_amount, ssc_employee, ssc_employer, gross_pay, net_pay, created_at)
 * - payslips(id, tenant_id, run_id, line_id, staff_id, period_id, payslip_number, issued_at, payload, created_at)
 * - statutory_filings(id, tenant_id, period_id, filing_type, file_format, generated_at, content_hash, row_count, created_at)
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import {
  computeMonthlyPaye,
  computeSsc,
  NAMIBIA_PAYROLL_EMPLOYER_REF,
  PAYE_FY_LABEL,
} from '@/lib/platform/namibia-payroll';

export type PayrollPeriod = {
  id: string;
  tenantId: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type PayrollRun = {
  id: string;
  tenantId: string;
  periodId: string;
  status: string;
  runNumber: number;
  totalGross: number;
  totalPaye: number;
  totalSscEmployee: number;
  totalSscEmployer: number;
  totalNet: number;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type PayrollLine = {
  id: string;
  tenantId: string;
  runId: string;
  staffId: string;
  employeeNumber: string;
  staffName: string;
  basicWage: number;
  taxableEarnings: number;
  annualTaxable: number;
  payeAmount: number;
  sscEmployee: number;
  sscEmployer: number;
  grossPay: number;
  netPay: number;
};

export type PayslipRecord = {
  id: string;
  tenantId: string;
  runId: string;
  lineId: string;
  staffId: string;
  periodId: string;
  payslipNumber: string;
  issuedAt: Date | null;
  payload: Record<string, unknown>;
};

export type CreatePeriodInput = {
  periodLabel: string;
  startDate: string;
  endDate: string;
  payDate: string;
};

function parseDecimal(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function mapPeriodRow(row: Record<string, unknown>): PayrollPeriod {
  return {
    id: row.id as string,
    tenantId: (row.tenant_id as string) ?? (row.tenantId as string),
    periodLabel: (row.period_label as string) ?? (row.periodLabel as string),
    startDate: String(row.start_date ?? row.startDate),
    endDate: String(row.end_date ?? row.endDate),
    payDate: String(row.pay_date ?? row.payDate),
    status: (row.status as string) ?? 'open',
    createdAt: (row.created_at as Date) ?? (row.createdAt as Date) ?? null,
    updatedAt: (row.updated_at as Date) ?? (row.updatedAt as Date) ?? null,
  };
}

function mapRunRow(row: Record<string, unknown>): PayrollRun {
  return {
    id: row.id as string,
    tenantId: (row.tenant_id as string) ?? (row.tenantId as string),
    periodId: (row.period_id as string) ?? (row.periodId as string),
    status: (row.status as string) ?? 'draft',
    runNumber: Number(row.run_number ?? row.runNumber ?? 1),
    totalGross: parseDecimal(row.total_gross ?? row.totalGross),
    totalPaye: parseDecimal(row.total_paye ?? row.totalPaye),
    totalSscEmployee: parseDecimal(row.total_ssc_employee ?? row.totalSscEmployee),
    totalSscEmployer: parseDecimal(row.total_ssc_employer ?? row.totalSscEmployer),
    totalNet: parseDecimal(row.total_net ?? row.totalNet),
    approvedBy: (row.approved_by as string) ?? (row.approvedBy as string) ?? null,
    approvedAt: (row.approved_at as Date) ?? (row.approvedAt as Date) ?? null,
    createdAt: (row.created_at as Date) ?? (row.createdAt as Date) ?? null,
    updatedAt: (row.updated_at as Date) ?? (row.updatedAt as Date) ?? null,
  };
}

function mapLineRow(row: Record<string, unknown>): PayrollLine {
  return {
    id: row.id as string,
    tenantId: (row.tenant_id as string) ?? (row.tenantId as string),
    runId: (row.run_id as string) ?? (row.runId as string),
    staffId: (row.staff_id as string) ?? (row.staffId as string),
    employeeNumber: String(row.employee_number ?? row.employeeNumber ?? ''),
    staffName: String(row.staff_name ?? row.staffName ?? ''),
    basicWage: parseDecimal(row.basic_wage ?? row.basicWage),
    taxableEarnings: parseDecimal(row.taxable_earnings ?? row.taxableEarnings),
    annualTaxable: parseDecimal(row.annual_taxable ?? row.annualTaxable),
    payeAmount: parseDecimal(row.paye_amount ?? row.payeAmount),
    sscEmployee: parseDecimal(row.ssc_employee ?? row.sscEmployee),
    sscEmployer: parseDecimal(row.ssc_employer ?? row.sscEmployer),
    grossPay: parseDecimal(row.gross_pay ?? row.grossPay),
    netPay: parseDecimal(row.net_pay ?? row.netPay),
  };
}

function mapPayslipRow(row: Record<string, unknown>): PayslipRecord {
  return {
    id: row.id as string,
    tenantId: (row.tenant_id as string) ?? (row.tenantId as string),
    runId: (row.run_id as string) ?? (row.runId as string),
    lineId: (row.line_id as string) ?? (row.lineId as string),
    staffId: (row.staff_id as string) ?? (row.staffId as string),
    periodId: (row.period_id as string) ?? (row.periodId as string),
    payslipNumber: String(row.payslip_number ?? row.payslipNumber ?? ''),
    issuedAt: (row.issued_at as Date) ?? (row.issuedAt as Date) ?? null,
    payload: (row.payload as Record<string, unknown>) ?? {},
  };
}

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class PayrollService {
  /**
   * List payroll periods for a tenant (newest first).
   */
  async listPeriods(tenantId: string): Promise<PayrollPeriod[]> {
    try {
      const result = await db.execute(sql`
        SELECT id, tenant_id, period_label, start_date, end_date, pay_date, status, created_at, updated_at
        FROM payroll_periods
        WHERE tenant_id = ${tenantId}
        ORDER BY start_date DESC
      `);
      return result.rows.map((row) => mapPeriodRow(row as Record<string, unknown>));
    } catch (error) {
      throw handleServiceError(error, 'Failed to list payroll periods');
    }
  }

  /**
   * Create an open payroll period.
   */
  async createPeriod(tenantId: string, input: CreatePeriodInput): Promise<PayrollPeriod> {
    try {
      const result = await db.execute(sql`
        INSERT INTO payroll_periods (tenant_id, period_label, start_date, end_date, pay_date, status)
        VALUES (
          ${tenantId},
          ${input.periodLabel},
          ${input.startDate}::date,
          ${input.endDate}::date,
          ${input.payDate}::date,
          'open'
        )
        RETURNING id, tenant_id, period_label, start_date, end_date, pay_date, status, created_at, updated_at
      `);
      const row = result.rows[0];
      if (!row) {
        throw new AppError(500, 'Failed to create payroll period');
      }
      return mapPeriodRow(row as Record<string, unknown>);
    } catch (error) {
      throw handleServiceError(error, 'Failed to create payroll period');
    }
  }

  /**
   * Create a draft payroll run for a period.
   */
  async createDraftRun(tenantId: string, periodId: string): Promise<PayrollRun> {
    try {
      const periodCheck = await db.execute(sql`
        SELECT id FROM payroll_periods
        WHERE id = ${periodId} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      if (!periodCheck.rows[0]) {
        throw new AppError(404, 'Payroll period not found');
      }

      const countResult = await db.execute(sql`
        SELECT COALESCE(MAX(run_number), 0) + 1 AS next_run
        FROM payroll_runs
        WHERE tenant_id = ${tenantId} AND period_id = ${periodId}
      `);
      const nextRun = Number(
        (countResult.rows[0] as { next_run?: number })?.next_run ?? 1
      );

      const result = await db.execute(sql`
        INSERT INTO payroll_runs (
          tenant_id, period_id, status, run_number,
          total_gross, total_paye, total_ssc_employee, total_ssc_employer, total_net
        )
        VALUES (${tenantId}, ${periodId}, 'draft', ${nextRun}, 0, 0, 0, 0, 0)
        RETURNING
          id, tenant_id, period_id, status, run_number,
          total_gross, total_paye, total_ssc_employee, total_ssc_employer, total_net,
          approved_by, approved_at, created_at, updated_at
      `);
      const row = result.rows[0];
      if (!row) {
        throw new AppError(500, 'Failed to create payroll run');
      }
      return mapRunRow(row as Record<string, unknown>);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Failed to create draft payroll run');
    }
  }

  /**
   * Compute payroll lines for active staff and persist totals on the run.
   */
  async computeRunLines(tenantId: string, runId: string): Promise<PayrollLine[]> {
    try {
      const runResult = await db.execute(sql`
        SELECT id, period_id, status
        FROM payroll_runs
        WHERE id = ${runId} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      const runRow = runResult.rows[0] as { id: string; period_id: string; status: string } | undefined;
      if (!runRow) {
        throw new AppError(404, 'Payroll run not found');
      }
      if (runRow.status === 'approved') {
        throw new AppError(400, 'Cannot recompute an approved payroll run');
      }

      await db.execute(sql`
        DELETE FROM payroll_lines
        WHERE run_id = ${runId} AND tenant_id = ${tenantId}
      `);

      const staffResult = await db.execute(sql`
        SELECT id, employee_number, first_name, last_name, salary, hourly_rate, status
        FROM staff
        WHERE tenant_id = ${tenantId} AND LOWER(status) = 'active'
        ORDER BY employee_number
      `);

      const lines: PayrollLine[] = [];
      let totalGross = 0;
      let totalPaye = 0;
      let totalSscEmployee = 0;
      let totalSscEmployer = 0;
      let totalNet = 0;

      for (const staffRow of staffResult.rows) {
        const row = staffRow as Record<string, unknown>;
        const staffId = row.id as string;
        const employeeNumber = String(row.employee_number ?? '');
        const staffName = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
        const salary = parseDecimal(row.salary);
        const hourlyRate = parseDecimal(row.hourly_rate);
        // Monthly basic: prefer salary; fallback hourly × 160h if no salary recorded.
        const basicWage = salary > 0 ? salary : hourlyRate * 160;
        const taxableEarnings = basicWage;
        const annualTaxable = taxableEarnings * 12;
        const payeAmount = computeMonthlyPaye(annualTaxable);
        const ssc = computeSsc(basicWage);
        const grossPay = basicWage;
        const netPay = Math.round((grossPay - payeAmount - ssc.employeeContribution) * 100) / 100;

        const insertResult = await db.execute(sql`
          INSERT INTO payroll_lines (
            tenant_id, run_id, staff_id, employee_number, staff_name,
            basic_wage, taxable_earnings, annual_taxable,
            paye_amount, ssc_employee, ssc_employer, gross_pay, net_pay
          )
          VALUES (
            ${tenantId}, ${runId}, ${staffId}, ${employeeNumber}, ${staffName},
            ${basicWage}, ${taxableEarnings}, ${annualTaxable},
            ${payeAmount}, ${ssc.employeeContribution}, ${ssc.employerContribution},
            ${grossPay}, ${netPay}
          )
          RETURNING
            id, tenant_id, run_id, staff_id, employee_number, staff_name,
            basic_wage, taxable_earnings, annual_taxable,
            paye_amount, ssc_employee, ssc_employer, gross_pay, net_pay
        `);
        const inserted = insertResult.rows[0];
        if (inserted) {
          lines.push(mapLineRow(inserted as Record<string, unknown>));
        }

        totalGross += grossPay;
        totalPaye += payeAmount;
        totalSscEmployee += ssc.employeeContribution;
        totalSscEmployer += ssc.employerContribution;
        totalNet += netPay;
      }

      await db.execute(sql`
        UPDATE payroll_runs
        SET
          status = 'computed',
          total_gross = ${totalGross},
          total_paye = ${totalPaye},
          total_ssc_employee = ${totalSscEmployee},
          total_ssc_employer = ${totalSscEmployer},
          total_net = ${totalNet},
          updated_at = NOW()
        WHERE id = ${runId} AND tenant_id = ${tenantId}
      `);

      return lines;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Failed to compute payroll run lines');
    }
  }

  /**
   * Approve a computed run and issue payslips.
   */
  async approveRun(
    tenantId: string,
    runId: string,
    approvedBy: string
  ): Promise<{ run: PayrollRun; payslips: PayslipRecord[] }> {
    try {
      const runResult = await db.execute(sql`
        SELECT r.id, r.period_id, r.status, r.run_number, p.period_label
        FROM payroll_runs r
        JOIN payroll_periods p ON p.id = r.period_id
        WHERE r.id = ${runId} AND r.tenant_id = ${tenantId}
        LIMIT 1
      `);
      const runMeta = runResult.rows[0] as
        | { id: string; period_id: string; status: string; run_number: number; period_label: string }
        | undefined;
      if (!runMeta) {
        throw new AppError(404, 'Payroll run not found');
      }
      if (runMeta.status === 'approved') {
        throw new AppError(400, 'Payroll run is already approved');
      }
      if (runMeta.status !== 'computed') {
        throw new AppError(400, 'Payroll run must be computed before approval');
      }

      const linesResult = await db.execute(sql`
        SELECT
          id, tenant_id, run_id, staff_id, employee_number, staff_name,
          basic_wage, taxable_earnings, annual_taxable,
          paye_amount, ssc_employee, ssc_employer, gross_pay, net_pay
        FROM payroll_lines
        WHERE run_id = ${runId} AND tenant_id = ${tenantId}
      `);
      if (linesResult.rows.length === 0) {
        throw new AppError(400, 'No payroll lines to approve');
      }

      const payslips: PayslipRecord[] = [];

      for (const lineRow of linesResult.rows) {
        const line = mapLineRow(lineRow as Record<string, unknown>);
        const payslipNumber = `PS-${runMeta.period_label}-R${runMeta.run_number}-${line.employeeNumber}`;
        const payload = {
          fy: PAYE_FY_LABEL,
          employerRef: NAMIBIA_PAYROLL_EMPLOYER_REF,
          line,
        };

        const slipResult = await db.execute(sql`
          INSERT INTO payslips (
            tenant_id, run_id, line_id, staff_id, period_id,
            payslip_number, issued_at, payload
          )
          VALUES (
            ${tenantId}, ${runId}, ${line.id}, ${line.staffId}, ${runMeta.period_id},
            ${payslipNumber}, NOW(), ${JSON.stringify(payload)}::jsonb
          )
          RETURNING id, tenant_id, run_id, line_id, staff_id, period_id, payslip_number, issued_at, payload
        `);
        const slipRow = slipResult.rows[0];
        if (slipRow) {
          payslips.push(mapPayslipRow(slipRow as Record<string, unknown>));
        }
      }

      const updateResult = await db.execute(sql`
        UPDATE payroll_runs
        SET status = 'approved', approved_by = ${approvedBy}, approved_at = NOW(), updated_at = NOW()
        WHERE id = ${runId} AND tenant_id = ${tenantId}
        RETURNING
          id, tenant_id, period_id, status, run_number,
          total_gross, total_paye, total_ssc_employee, total_ssc_employer, total_net,
          approved_by, approved_at, created_at, updated_at
      `);
      const updatedRun = updateResult.rows[0];
      if (!updatedRun) {
        throw new AppError(500, 'Failed to approve payroll run');
      }

      return {
        run: mapRunRow(updatedRun as Record<string, unknown>),
        payslips,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Failed to approve payroll run');
    }
  }

  /**
   * Fetch payslips for a tenant, optionally filtered by period or run.
   */
  async getPayslips(
    tenantId: string,
    filters?: { periodId?: string; runId?: string }
  ): Promise<PayslipRecord[]> {
    try {
      let result;
      if (filters?.runId) {
        result = await db.execute(sql`
          SELECT id, tenant_id, run_id, line_id, staff_id, period_id, payslip_number, issued_at, payload
          FROM payslips
          WHERE tenant_id = ${tenantId} AND run_id = ${filters.runId}
          ORDER BY payslip_number
        `);
      } else if (filters?.periodId) {
        result = await db.execute(sql`
          SELECT id, tenant_id, run_id, line_id, staff_id, period_id, payslip_number, issued_at, payload
          FROM payslips
          WHERE tenant_id = ${tenantId} AND period_id = ${filters.periodId}
          ORDER BY payslip_number
        `);
      } else {
        result = await db.execute(sql`
          SELECT id, tenant_id, run_id, line_id, staff_id, period_id, payslip_number, issued_at, payload
          FROM payslips
          WHERE tenant_id = ${tenantId}
          ORDER BY issued_at DESC
          LIMIT 200
        `);
      }
      return result.rows.map((row) => mapPayslipRow(row as Record<string, unknown>));
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch payslips');
    }
  }

  /**
   * Get a payroll run with its lines.
   */
  async getRunWithLines(
    tenantId: string,
    runId: string
  ): Promise<{ run: PayrollRun; lines: PayrollLine[] }> {
    try {
      const runResult = await db.execute(sql`
        SELECT
          id, tenant_id, period_id, status, run_number,
          total_gross, total_paye, total_ssc_employee, total_ssc_employer, total_net,
          approved_by, approved_at, created_at, updated_at
        FROM payroll_runs
        WHERE id = ${runId} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      const runRow = runResult.rows[0];
      if (!runRow) {
        throw new AppError(404, 'Payroll run not found');
      }

      const linesResult = await db.execute(sql`
        SELECT
          id, tenant_id, run_id, staff_id, employee_number, staff_name,
          basic_wage, taxable_earnings, annual_taxable,
          paye_amount, ssc_employee, ssc_employer, gross_pay, net_pay
        FROM payroll_lines
        WHERE run_id = ${runId} AND tenant_id = ${tenantId}
        ORDER BY employee_number
      `);

      return {
        run: mapRunRow(runRow as Record<string, unknown>),
        lines: linesResult.rows.map((row) => mapLineRow(row as Record<string, unknown>)),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Failed to fetch payroll run');
    }
  }

  /**
   * Export PAYE remittance CSV for an approved period (latest approved run).
   */
  async exportPayeCsv(tenantId: string, periodId: string): Promise<string> {
    try {
      const periodResult = await db.execute(sql`
        SELECT period_label, start_date, end_date
        FROM payroll_periods
        WHERE id = ${periodId} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      const period = periodResult.rows[0] as
        | { period_label: string; start_date: string; end_date: string }
        | undefined;
      if (!period) {
        throw new AppError(404, 'Payroll period not found');
      }

      const linesResult = await db.execute(sql`
        SELECT pl.employee_number, pl.staff_name, pl.taxable_earnings, pl.paye_amount, pl.gross_pay
        FROM payroll_lines pl
        JOIN payroll_runs pr ON pr.id = pl.run_id
        WHERE pl.tenant_id = ${tenantId}
          AND pr.period_id = ${periodId}
          AND pr.status = 'approved'
        ORDER BY pl.employee_number
      `);

      const header = [
        'employer_ref',
        'tax_year',
        'period_label',
        'period_start',
        'period_end',
        'employee_number',
        'employee_name',
        'gross_pay',
        'taxable_earnings',
        'paye_amount',
      ].join(',');

      const rows = linesResult.rows.map((row) => {
        const r = row as Record<string, unknown>;
        return [
          csvEscape(NAMIBIA_PAYROLL_EMPLOYER_REF),
          csvEscape(PAYE_FY_LABEL),
          csvEscape(period.period_label),
          csvEscape(String(period.start_date)),
          csvEscape(String(period.end_date)),
          csvEscape(String(r.employee_number ?? '')),
          csvEscape(String(r.staff_name ?? '')),
          csvEscape(parseDecimal(r.gross_pay)),
          csvEscape(parseDecimal(r.taxable_earnings)),
          csvEscape(parseDecimal(r.paye_amount)),
        ].join(',');
      });

      const csv = [header, ...rows].join('\n');
      await this.recordStatutoryFiling(tenantId, periodId, 'paye', csv, rows.length);
      return csv;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Failed to export PAYE CSV');
    }
  }

  /**
   * Export SSC remittance CSV for an approved period.
   */
  async exportSscCsv(tenantId: string, periodId: string): Promise<string> {
    try {
      const periodResult = await db.execute(sql`
        SELECT period_label, start_date, end_date
        FROM payroll_periods
        WHERE id = ${periodId} AND tenant_id = ${tenantId}
        LIMIT 1
      `);
      const period = periodResult.rows[0] as
        | { period_label: string; start_date: string; end_date: string }
        | undefined;
      if (!period) {
        throw new AppError(404, 'Payroll period not found');
      }

      const linesResult = await db.execute(sql`
        SELECT pl.employee_number, pl.staff_name, pl.basic_wage, pl.ssc_employee, pl.ssc_employer
        FROM payroll_lines pl
        JOIN payroll_runs pr ON pr.id = pl.run_id
        WHERE pl.tenant_id = ${tenantId}
          AND pr.period_id = ${periodId}
          AND pr.status = 'approved'
        ORDER BY pl.employee_number
      `);

      const header = [
        'employer_ref',
        'period_label',
        'period_start',
        'period_end',
        'employee_number',
        'employee_name',
        'basic_wage',
        'ssc_employee',
        'ssc_employer',
        'ssc_total',
      ].join(',');

      const rows = linesResult.rows.map((row) => {
        const r = row as Record<string, unknown>;
        const employee = parseDecimal(r.ssc_employee);
        const employer = parseDecimal(r.ssc_employer);
        return [
          csvEscape(NAMIBIA_PAYROLL_EMPLOYER_REF),
          csvEscape(period.period_label),
          csvEscape(String(period.start_date)),
          csvEscape(String(period.end_date)),
          csvEscape(String(r.employee_number ?? '')),
          csvEscape(String(r.staff_name ?? '')),
          csvEscape(parseDecimal(r.basic_wage)),
          csvEscape(employee),
          csvEscape(employer),
          csvEscape(employee + employer),
        ].join(',');
      });

      const csv = [header, ...rows].join('\n');
      await this.recordStatutoryFiling(tenantId, periodId, 'ssc', csv, rows.length);
      return csv;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Failed to export SSC CSV');
    }
  }

  private async recordStatutoryFiling(
    tenantId: string,
    periodId: string,
    filingType: 'paye' | 'ssc',
    csv: string,
    rowCount: number
  ): Promise<void> {
    const contentHash = Buffer.from(csv).toString('base64').slice(0, 64);
    await db.execute(sql`
      INSERT INTO statutory_filings (
        tenant_id, period_id, filing_type, file_format, generated_at, content_hash, row_count
      )
      VALUES (
        ${tenantId}, ${periodId}, ${filingType}, 'csv', NOW(), ${contentHash}, ${rowCount}
      )
    `);
  }
}
