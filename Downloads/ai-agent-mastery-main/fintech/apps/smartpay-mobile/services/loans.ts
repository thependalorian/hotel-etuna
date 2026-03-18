/**
 * Loans Service - SmartPay Mobile
 * Handles loan eligibility checking and applications
 * Location: mobile/services/loans.ts
 */

import { api } from './api';
import { 
  LoanEligibility, 
  LoanApplicationRequest, 
  LoanApplicationResponse,
  Loan,
  LoansResponse 
} from '../types/api';

export { Loan, LoanEligibility };

/**
 * Check loan eligibility
 * GET /api/v1/mobile/loans/eligibility
 */
export async function checkLoanEligibility(): Promise<LoanEligibility | null> {
  try {
    const response = await api.get<{ data: LoanEligibility }>(
      '/api/v1/mobile/loans/eligibility',
      { retry: true }
    );

    return response.data;
  } catch (error) {
    console.error('checkLoanEligibility error:', error);
    return null;
  }
}

/**
 * Apply for a loan
 * POST /api/v1/mobile/loans/apply
 */
export async function applyForLoan(request: LoanApplicationRequest): Promise<{
  success: boolean;
  data?: LoanApplicationResponse['data'];
  error?: string;
}> {
  try {
    const response = await api.post<LoanApplicationResponse>(
      '/api/v1/mobile/loans/apply',
      request,
      { retry: false }
    );

    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      error: response.error?.message || 'Loan application failed',
    };
  } catch (error) {
    console.error('applyForLoan error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get user's loan history
 * GET /api/v1/mobile/loans
 */
export async function getLoans(): Promise<Loan[]> {
  try {
    const response = await api.get<LoansResponse>('/api/v1/mobile/loans', { retry: true });
    
    return response.data?.loans || [];
  } catch (error) {
    console.error('getLoans error:', error);
    return [];
  }
}

/**
 * Get specific loan details
 * GET /api/v1/mobile/loans/:id
 */
export async function getLoanById(loanId: string): Promise<Loan | null> {
  try {
    const response = await api.get<{ data: Loan }>(`/api/v1/mobile/loans/${loanId}`);
    return response.data;
  } catch (error) {
    console.error('getLoanById error:', error);
    return null;
  }
}
