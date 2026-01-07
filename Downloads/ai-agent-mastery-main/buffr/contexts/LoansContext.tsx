/**
 * Loans Context
 * 
 * Location: contexts/LoansContext.tsx
 * Purpose: Global state management for loans
 * 
 * Provides loans data and methods to fetch, apply, pay, and manage loans
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Loan interfaces
export interface Loan {
  id: string;
  name?: string; // Loan name set by user
  icon?: string; // FontAwesome icon name
  type: 'personal' | 'emergency' | 'business' | 'quick';
  amount: number;
  remainingBalance: number;
  interestRate: number; // APR percentage
  status: 'active' | 'paid' | 'rejected' | 'pending' | 'starting';
  dueDate: Date;
  nextPaymentDate?: Date;
  nextPaymentAmount?: number;
  monthlyPayment: number;
  totalRepayment: number;
  repaymentPeriod: number; // months
  totalEMI: number; // Total number of EMIs
  paidEMI: number; // Number of EMIs paid
  purpose?: string;
  reference?: string; // Loan reference number
  createdAt: Date;
  applicationId?: string;
  autoPayEnabled?: boolean;
  autoPayAmount?: number;
}

export interface LoanOffer {
  id: string;
  name: string;
  type: 'pre-approved' | 'quick';
  maxAmount: number;
  minAmount: number;
  interestRate: number; // APR percentage
  minRepaymentPeriod: number; // months
  maxRepaymentPeriod: number; // months
  description?: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: Date;
  paymentMethod?: string;
}

interface LoansContextType {
  loans: Loan[];
  offers: LoanOffer[];
  availableCredit: number;
  loading: boolean;
  error: string | null;
  fetchLoans: () => Promise<void>;
  fetchOffers: () => Promise<void>;
  getLoanById: (id: string) => Loan | null;
  getLoanPayments: (loanId: string) => LoanPayment[];
  applyForLoan: (offerId: string, amount: number, repaymentPeriod: number, purpose: string, icon?: string, name?: string) => Promise<Loan>;
  payLoan: (loanId: string, amount: number, paymentMethod: string) => Promise<void>;
  refreshLoans: () => Promise<void>;
  calculateRepayment: (amount: number, interestRate: number, period: number) => { monthly: number; total: number };
}

const LoansContext = createContext<LoansContextType | undefined>(undefined);

// Mock API functions - Replace with actual API calls
const fetchLoansFromAPI = async (): Promise<Loan[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  const now = new Date();
  // Create a date for October 1, 2023 (matching design)
  const octoberDate = new Date(2023, 9, 1); // Month is 0-indexed, so 9 = October
  
  return [
    {
      id: 'loan-1',
      name: 'Vegetable Business',
      icon: 'pagelines', // Green sprout/plant icon (FontAwesome)
      type: 'business',
      amount: 1000.00,
      remainingBalance: 1000.00,
      interestRate: 5,
      status: 'starting', // New loan, just started
      dueDate: octoberDate,
      nextPaymentDate: octoberDate,
      nextPaymentAmount: 83.33,
      monthlyPayment: 83.33,
      totalRepayment: 1000.00,
      repaymentPeriod: 12,
      totalEMI: 12,
      paidEMI: 0,
      purpose: 'Vegetable Business',
      createdAt: new Date(2023, 8, 17), // September 17, 2023
      applicationId: 'APP123459',
      reference: '93739624139',
    },
    {
      id: 'loan-2',
      type: 'personal',
      amount: 2000.00,
      remainingBalance: 1500.00,
      interestRate: 5,
      status: 'active',
      dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      nextPaymentDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      nextPaymentAmount: 175.00,
      monthlyPayment: 175.00,
      totalRepayment: 2100.00,
      repaymentPeriod: 6,
      totalEMI: 6,
      paidEMI: 1,
      purpose: 'Personal expenses',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      applicationId: 'APP123456',
      reference: '93739624137',
    },
    {
      id: 'loan-3',
      type: 'emergency',
      amount: 1000.00,
      remainingBalance: 800.00,
      interestRate: 8,
      status: 'active',
      dueDate: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000), // 32 days from now
      nextPaymentDate: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000),
      nextPaymentAmount: 180.00,
      monthlyPayment: 180.00,
      totalRepayment: 1080.00,
      repaymentPeriod: 3,
      totalEMI: 3,
      paidEMI: 1,
      purpose: 'Emergency',
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      applicationId: 'APP123457',
      reference: '93739624138',
    },
  ];
};

const fetchOffersFromAPI = async (): Promise<LoanOffer[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  
  return [
    {
      id: 'offer-1',
      name: 'Pre-approved Loan',
      type: 'pre-approved',
      maxAmount: 3000.00,
      minAmount: 500.00,
      interestRate: 5,
      minRepaymentPeriod: 3,
      maxRepaymentPeriod: 12,
      description: 'Get instant approval for loans up to N$ 3,000',
    },
    {
      id: 'offer-2',
      name: 'Quick Loan',
      type: 'quick',
      maxAmount: 1000.00,
      minAmount: 200.00,
      interestRate: 8,
      minRepaymentPeriod: 1,
      maxRepaymentPeriod: 6,
      description: 'Fast approval for smaller amounts',
    },
  ];
};

const fetchAvailableCredit = async (): Promise<number> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return 5000.00; // Mock available credit
};

export function LoansProvider({ children }: { children: ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [availableCredit, setAvailableCredit] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLoansFromAPI();
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loans');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOffersFromAPI();
      setOffers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loan offers');
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableCreditAmount = useCallback(async () => {
    try {
      const credit = await fetchAvailableCredit();
      setAvailableCredit(credit);
    } catch (err) {
      console.error('Error fetching available credit:', err);
    }
  }, []);

  const getLoanById = useCallback((id: string): Loan | null => {
    return loans.find((loan) => loan.id === id) || null;
  }, [loans]);

  const getLoanPayments = useCallback((loanId: string): LoanPayment[] => {
    const loan = getLoanById(loanId);
    if (!loan) return [];

    const payments: LoanPayment[] = [];
    const startDate = loan.createdAt;
    
    for (let i = 0; i < loan.repaymentPeriod; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      
      const isPaid = i === 0; // Mock: first payment is paid
      payments.push({
        id: `payment-${loanId}-${i + 1}`,
        loanId,
        amount: loan.monthlyPayment,
        dueDate,
        status: isPaid ? 'paid' : 'pending',
        paidDate: isPaid ? new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000) : undefined,
      });
    }
    
    return payments;
  }, [getLoanById]);

  const calculateRepayment = useCallback((amount: number, interestRate: number, period: number): { monthly: number; total: number } => {
    // Simple interest calculation: Total = Principal + (Principal * Rate * Time)
    const totalInterest = amount * (interestRate / 100) * (period / 12);
    const total = amount + totalInterest;
    const monthly = total / period;
    
    return {
      monthly: Math.round(monthly * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, []);

  const applyForLoan = useCallback(async (
    offerId: string,
    amount: number,
    repaymentPeriod: number,
    purpose: string,
    icon?: string,
    name?: string
  ): Promise<Loan> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) {
        throw new Error('Loan offer not found');
      }

      const calculation = calculateRepayment(amount, offer.interestRate, repaymentPeriod);
      const now = new Date();
      const firstPaymentDate = new Date(now);
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

      // Generate reference number
      const reference = Math.floor(Math.random() * 100000000000).toString();

      const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        name: name || purpose,
        icon: icon || 'book',
        type: offer.type === 'pre-approved' ? 'personal' : 'quick',
        amount,
        remainingBalance: amount,
        interestRate: offer.interestRate,
        status: 'starting', // New loans start with 'starting' status
        dueDate: firstPaymentDate,
        nextPaymentDate: firstPaymentDate,
        nextPaymentAmount: calculation.monthly,
        monthlyPayment: calculation.monthly,
        totalRepayment: calculation.total,
        repaymentPeriod,
        totalEMI: repaymentPeriod,
        paidEMI: 0,
        purpose,
        reference,
        createdAt: now,
        applicationId: `APP${Date.now()}`,
      };

      setLoans((prev) => [...prev, newLoan]);
      return newLoan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply for loan';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [offers, calculateRepayment]);

  const payLoan = useCallback(async (loanId: string, amount: number, paymentMethod: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setLoans((prev) =>
        prev.map((loan) => {
          if (loan.id === loanId) {
            const newBalance = Math.max(0, loan.remainingBalance - amount);
            const isFullyPaid = newBalance === 0;
            
            return {
              ...loan,
              remainingBalance: newBalance,
              status: isFullyPaid ? 'paid' : loan.status,
            };
          }
          return loan;
        })
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pay loan';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLoans = useCallback(async () => {
    await Promise.all([fetchLoans(), fetchOffers(), fetchAvailableCreditAmount()]);
  }, [fetchLoans, fetchOffers, fetchAvailableCreditAmount]);

  // Initial fetch
  React.useEffect(() => {
    refreshLoans();
  }, [refreshLoans]);

  return (
    <LoansContext.Provider
      value={{
        loans,
        offers,
        availableCredit,
        loading,
        error,
        fetchLoans,
        fetchOffers,
        getLoanById,
        getLoanPayments,
        applyForLoan,
        payLoan,
        refreshLoans,
        calculateRepayment,
      }}
    >
      {children}
    </LoansContext.Provider>
  );
}

export function useLoans() {
  const context = useContext(LoansContext);
  if (context === undefined) {
    throw new Error('useLoans must be used within a LoansProvider');
  }
  return context;
}
