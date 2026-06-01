/**
 * Corporate Account Service
 * 
 * Purpose: Manage corporate B2B accounts for bill-to-company bookings and AR invoicing
 * Location: /lib/services/crm/CorporateAccountService.ts
 * 
 * Features:
 * - Corporate account CRUD operations
 * - Corporate contact management
 * - Credit limit checking
 * - Account balance management
 * - Tenant isolation
 * 
 * Agent A7 - Corporate Billing Feature
 */

import { db } from '@/lib/db';
import { corporateAccounts, corporateContacts, bookings } from '@/lib/db/schema';
import { eq, desc, and, ilike, sql } from 'drizzle-orm';
import type { CorporateAccount, CorporateContact } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';

export interface CorporateAccountData {
  companyName: string;
  companyRegistration?: string;
  vatNumber?: string;
  billingAddress?: string;
  billingCity?: string;
  billingCountry?: string;
  billingPostalCode?: string;
  paymentTermsDays?: number;
  creditLimit?: string;
  accountStatus?: string;
  billingEmail?: string;
  billingPhone?: string;
  notes?: string;
}

export interface CorporateContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  isPrimary?: boolean;
  canAuthorizeBookings?: boolean;
}

export class CorporateAccountService {
  /**
   * Create a new corporate account
   */
  async createAccount(tenantId: string, data: CorporateAccountData): Promise<CorporateAccount> {
    try {
      const [account] = await db
        .insert(corporateAccounts)
        .values({
          tenantId,
          companyName: data.companyName,
          companyRegistration: data.companyRegistration,
          vatNumber: data.vatNumber,
          billingAddress: data.billingAddress,
          billingCity: data.billingCity,
          billingCountry: data.billingCountry ?? 'Namibia',
          billingPostalCode: data.billingPostalCode,
          paymentTermsDays: data.paymentTermsDays ?? 30,
          creditLimit: data.creditLimit ?? '0.00',
          currentBalance: '0.00',
          accountStatus: data.accountStatus ?? 'active',
          billingEmail: data.billingEmail,
          billingPhone: data.billingPhone,
          notes: data.notes,
        })
        .returning();

      if (!account) {
        throw new Error('Insert did not return account');
      }
      
      return account;
    } catch (error) {
      return handleServiceError(error, 'Error creating corporate account');
    }
  }

  /**
   * Get all corporate accounts for a tenant
   */
  async getAccountsByTenant(tenantId: string): Promise<CorporateAccount[]> {
    try {
      return await db
        .select()
        .from(corporateAccounts)
        .where(eq(corporateAccounts.tenantId, tenantId))
        .orderBy(desc(corporateAccounts.createdAt));
    } catch (error) {
      handleServiceError(error, 'Error fetching corporate accounts');
      return [];
    }
  }

  /**
   * Search corporate accounts by company name
   */
  async searchAccountsByName(tenantId: string, searchTerm: string): Promise<CorporateAccount[]> {
    try {
      return await db
        .select()
        .from(corporateAccounts)
        .where(
          and(
            eq(corporateAccounts.tenantId, tenantId),
            ilike(corporateAccounts.companyName, `%${searchTerm}%`)
          )
        )
        .orderBy(corporateAccounts.companyName)
        .limit(10);
    } catch (error) {
      handleServiceError(error, 'Error searching corporate accounts');
      return [];
    }
  }

  /**
   * Get a single corporate account by ID
   */
  async getAccountById(accountId: string, tenantId: string): Promise<CorporateAccount> {
    try {
      const [account] = await db
        .select()
        .from(corporateAccounts)
        .where(eq(corporateAccounts.id, accountId))
        .limit(1);

      if (!account || account.tenantId !== tenantId) {
        throw new AppError(404, 'Corporate account not found');
      }

      return account;
    } catch (error) {
      return handleServiceError(error, 'Error fetching corporate account');
    }
  }

  /**
   * Update a corporate account
   */
  async updateAccount(
    accountId: string,
    tenantId: string,
    data: Partial<CorporateAccountData>
  ): Promise<CorporateAccount> {
    try {
      await this.getAccountById(accountId, tenantId);

      const [updatedAccount] = await db
        .update(corporateAccounts)
        .set({
          ...data,
          updatedAt: sql`now()`,
        })
        .where(eq(corporateAccounts.id, accountId))
        .returning();

      if (!updatedAccount) {
        throw new Error('Update did not return account');
      }

      return updatedAccount;
    } catch (error) {
      return handleServiceError(error, 'Error updating corporate account');
    }
  }

  /**
   * Delete a corporate account (soft delete by status)
   */
  async deleteAccount(accountId: string, tenantId: string): Promise<void> {
    try {
      await this.getAccountById(accountId, tenantId);

      await db
        .update(corporateAccounts)
        .set({ accountStatus: 'inactive', updatedAt: sql`now()` })
        .where(eq(corporateAccounts.id, accountId));
    } catch (error) {
      handleServiceError(error, 'Error deleting corporate account');
    }
  }

  /**
   * Create a contact for a corporate account
   */
  async createContact(
    accountId: string,
    tenantId: string,
    data: CorporateContactData
  ): Promise<CorporateContact> {
    try {
      await this.getAccountById(accountId, tenantId);

      const [contact] = await db
        .insert(corporateContacts)
        .values({
          corporateAccountId: accountId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          jobTitle: data.jobTitle,
          isPrimary: data.isPrimary ?? false,
          canAuthorizeBookings: data.canAuthorizeBookings ?? false,
        })
        .returning();

      if (!contact) {
        throw new Error('Insert did not return contact');
      }

      return contact;
    } catch (error) {
      return handleServiceError(error, 'Error creating corporate contact');
    }
  }

  /**
   * Get contacts for a corporate account
   */
  async getContactsByAccount(accountId: string, tenantId: string): Promise<CorporateContact[]> {
    try {
      await this.getAccountById(accountId, tenantId);

      return await db
        .select()
        .from(corporateContacts)
        .where(eq(corporateContacts.corporateAccountId, accountId))
        .orderBy(desc(corporateContacts.isPrimary), corporateContacts.lastName);
    } catch (error) {
      handleServiceError(error, 'Error fetching corporate contacts');
      return [];
    }
  }

  /**
   * Update a contact
   */
  async updateContact(
    contactId: string,
    accountId: string,
    tenantId: string,
    data: Partial<CorporateContactData>
  ): Promise<CorporateContact> {
    try {
      await this.getAccountById(accountId, tenantId);

      const [updatedContact] = await db
        .update(corporateContacts)
        .set({
          ...data,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(corporateContacts.id, contactId),
            eq(corporateContacts.corporateAccountId, accountId)
          )
        )
        .returning();

      if (!updatedContact) {
        throw new AppError(404, 'Contact not found');
      }

      return updatedContact;
    } catch (error) {
      return handleServiceError(error, 'Error updating corporate contact');
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string, accountId: string, tenantId: string): Promise<void> {
    try {
      await this.getAccountById(accountId, tenantId);

      const result = await db
        .delete(corporateContacts)
        .where(
          and(
            eq(corporateContacts.id, contactId),
            eq(corporateContacts.corporateAccountId, accountId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new AppError(404, 'Contact not found');
      }
    } catch (error) {
      handleServiceError(error, 'Error deleting corporate contact');
    }
  }

  /**
   * Get bookings for a corporate account
   */
  async getBookingsByAccount(accountId: string, tenantId: string) {
    try {
      await this.getAccountById(accountId, tenantId);

      return await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.corporateAccountId, accountId),
            eq(bookings.tenantId, tenantId)
          )
        )
        .orderBy(desc(bookings.createdAt));
    } catch (error) {
      handleServiceError(error, 'Error fetching corporate bookings');
      return [];
    }
  }

  /**
   * Check if corporate account has available credit
   */
  async hasAvailableCredit(accountId: string, tenantId: string, amount: number): Promise<boolean> {
    try {
      const account = await this.getAccountById(accountId, tenantId);
      const creditLimit = parseFloat(account.creditLimit || '0');
      const currentBalance = parseFloat(account.currentBalance || '0');
      const availableCredit = creditLimit - currentBalance;

      return availableCredit >= amount;
    } catch (error) {
      handleServiceError(error, 'Error checking credit availability');
      return false;
    }
  }

  /**
   * Update account balance (for AR invoicing)
   */
  async updateBalance(accountId: string, tenantId: string, amount: number): Promise<void> {
    try {
      await this.getAccountById(accountId, tenantId);

      await db
        .update(corporateAccounts)
        .set({
          currentBalance: sql`current_balance + ${amount}`,
          updatedAt: sql`now()`,
        })
        .where(eq(corporateAccounts.id, accountId));
    } catch (error) {
      handleServiceError(error, 'Error updating account balance');
    }
  }
}
