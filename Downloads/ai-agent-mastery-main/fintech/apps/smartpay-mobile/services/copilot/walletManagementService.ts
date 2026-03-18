/**
 * walletManagementService – Smartpay Agentic Copilot.
 * Handles wallet creation, editing, archiving, and type management.
 * Location: fintech/smartpay/services/copilot/walletManagementService.ts
 * 
 * ⚠️ SECURITY: All wallet operations verified server-side via JWT authentication
 * Client passes wallet IDs, server enforces ownership via requireAuth middleware
 */
import { getSecureItem } from '../secureStorage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export interface WalletType {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultColor: string;
  allowedCurrencies: string[];
}

export interface WalletIcon {
  id: string;
  name: string;
  ionicon: string;
  category: 'financial' | 'lifestyle' | 'travel' | 'shopping' | 'other';
}

export interface WalletColor {
  id: string;
  name: string;
  hex: string;
  gradient?: string[];
}

export interface CreateWalletInput {
  name: string;
  type: string;
  icon: string;
  color: string;
  currency?: string;
  description?: string;
}

export interface UpdateWalletInput {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface WalletDetails {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  currency: string;
  balance: number;
  status: 'active' | 'frozen' | 'archived';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getSecureItem('buffr_access_token');
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Get available wallet types with metadata
 */
export async function getWalletTypes(): Promise<WalletType[]> {
  // Predefined wallet types following PSD-3 e-money accounts
  // Server can override with GET /api/v1/mobile/wallets/types if needed
  return [
    {
      id: 'main',
      name: 'Main Wallet',
      description: 'Your primary spending account',
      icon: 'wallet-outline',
      defaultColor: '#2563eb',
      allowedCurrencies: ['NAD'],
    },
    {
      id: 'savings',
      name: 'Savings',
      description: 'Set money aside for future goals',
      icon: 'trending-up-outline',
      defaultColor: '#22c55e',
      allowedCurrencies: ['NAD'],
    },
    {
      id: 'bills',
      name: 'Bills',
      description: 'Dedicated for utilities and subscriptions',
      icon: 'receipt-outline',
      defaultColor: '#f59e0b',
      allowedCurrencies: ['NAD'],
    },
    {
      id: 'emergency',
      name: 'Emergency Fund',
      description: 'For unexpected expenses',
      icon: 'shield-checkmark-outline',
      defaultColor: '#ef4444',
      allowedCurrencies: ['NAD'],
    },
    {
      id: 'travel',
      name: 'Travel',
      description: 'Save for trips and adventures',
      icon: 'airplane-outline',
      defaultColor: '#8b5cf6',
      allowedCurrencies: ['NAD'],
    },
    {
      id: 'shopping',
      name: 'Shopping',
      description: 'Budget for purchases and treats',
      icon: 'cart-outline',
      defaultColor: '#ec4899',
      allowedCurrencies: ['NAD'],
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Create your own wallet category',
      icon: 'add-circle-outline',
      defaultColor: '#64748b',
      allowedCurrencies: ['NAD'],
    },
  ];
}

/**
 * Get available icons for wallet customization
 */
export function getWalletIcons(): WalletIcon[] {
  return [
    // Financial icons
    { id: 'wallet', name: 'Wallet', ionicon: 'wallet-outline', category: 'financial' },
    { id: 'cash', name: 'Cash', ionicon: 'cash-outline', category: 'financial' },
    { id: 'card', name: 'Card', ionicon: 'card-outline', category: 'financial' },
    { id: 'trending-up', name: 'Savings', ionicon: 'trending-up-outline', category: 'financial' },
    { id: 'receipt', name: 'Bills', ionicon: 'receipt-outline', category: 'financial' },
    { id: 'stats', name: 'Investments', ionicon: 'stats-chart-outline', category: 'financial' },
    
    // Lifestyle icons
    { id: 'shield', name: 'Emergency', ionicon: 'shield-checkmark-outline', category: 'lifestyle' },
    { id: 'home', name: 'Home', ionicon: 'home-outline', category: 'lifestyle' },
    { id: 'gift', name: 'Gifts', ionicon: 'gift-outline', category: 'lifestyle' },
    { id: 'heart', name: 'Healthcare', ionicon: 'heart-outline', category: 'lifestyle' },
    { id: 'fitness', name: 'Fitness', ionicon: 'fitness-outline', category: 'lifestyle' },
    { id: 'restaurant', name: 'Dining', ionicon: 'restaurant-outline', category: 'lifestyle' },
    
    // Travel icons
    { id: 'airplane', name: 'Travel', ionicon: 'airplane-outline', category: 'travel' },
    { id: 'car', name: 'Transport', ionicon: 'car-outline', category: 'travel' },
    { id: 'bicycle', name: 'Commute', ionicon: 'bicycle-outline', category: 'travel' },
    { id: 'bed', name: 'Accommodation', ionicon: 'bed-outline', category: 'travel' },
    
    // Shopping icons
    { id: 'cart', name: 'Shopping', ionicon: 'cart-outline', category: 'shopping' },
    { id: 'bag', name: 'Retail', ionicon: 'bag-outline', category: 'shopping' },
    { id: 'pricetag', name: 'Deals', ionicon: 'pricetag-outline', category: 'shopping' },
    
    // Other icons
    { id: 'school', name: 'Education', ionicon: 'school-outline', category: 'other' },
    { id: 'people', name: 'Family', ionicon: 'people-outline', category: 'other' },
    { id: 'star', name: 'Premium', ionicon: 'star-outline', category: 'other' },
    { id: 'rocket', name: 'Goals', ionicon: 'rocket-outline', category: 'other' },
    { id: 'add', name: 'Custom', ionicon: 'add-circle-outline', category: 'other' },
  ];
}

/**
 * Get available colors for wallet customization
 */
export function getWalletColors(): WalletColor[] {
  return [
    { id: 'blue', name: 'Ocean Blue', hex: '#2563eb' },
    { id: 'green', name: 'Forest Green', hex: '#22c55e' },
    { id: 'amber', name: 'Sunset Amber', hex: '#f59e0b' },
    { id: 'red', name: 'Ruby Red', hex: '#ef4444' },
    { id: 'purple', name: 'Royal Purple', hex: '#8b5cf6' },
    { id: 'pink', name: 'Rose Pink', hex: '#ec4899' },
    { id: 'cyan', name: 'Sky Cyan', hex: '#06b6d4' },
    { id: 'teal', name: 'Ocean Teal', hex: '#14b8a6' },
    { id: 'indigo', name: 'Deep Indigo', hex: '#6366f1' },
    { id: 'orange', name: 'Vibrant Orange', hex: '#f97316' },
    { id: 'lime', name: 'Fresh Lime', hex: '#84cc16' },
    { id: 'slate', name: 'Cool Slate', hex: '#64748b' },
  ];
}

/**
 * Validate wallet name
 */
export function validateWalletName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Wallet name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Wallet name must be at least 2 characters' };
  }
  
  if (name.length > 50) {
    return { valid: false, error: 'Wallet name must be less than 50 characters' };
  }
  
  // Check for special characters
  const invalidChars = /[<>{}[\]\\]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: 'Wallet name contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Create a new wallet
 * SERVER-SIDE: POST /api/v1/mobile/wallets
 * Security: JWT userId extracted, new wallet assigned to authenticated user
 */
export async function createWallet(input: CreateWalletInput): Promise<WalletDetails> {
  // Client-side validation
  const nameValidation = validateWalletName(input.name);
  if (!nameValidation.valid) {
    throw new Error(nameValidation.error);
  }
  
  if (!input.type) {
    throw new Error('Wallet type is required');
  }
  
  if (!input.icon) {
    throw new Error('Wallet icon is required');
  }
  
  if (!input.color) {
    throw new Error('Wallet color is required');
  }
  
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/v1/mobile/wallets`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: input.name.trim(),
        type: input.type,
        icon: input.icon,
        color: input.color,
        currency: input.currency || 'NAD',
        description: input.description?.trim(),
      }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to create wallet' }));
      throw new Error(errorData.error || errorData.message || 'Failed to create wallet');
    }
    
    const data = await res.json();
    return data.wallet || data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error while creating wallet');
  }
}

/**
 * Update an existing wallet
 * SERVER-SIDE: PATCH /api/v1/mobile/wallets/:id
 * Security: Server verifies wallet belongs to authenticated user via:
 *   SELECT * FROM wallets WHERE id = $1 AND user_id = $authenticatedUserId
 */
export async function updateWallet(walletId: string, updates: UpdateWalletInput): Promise<WalletDetails> {
  if (!walletId) {
    throw new Error('Wallet ID is required');
  }
  
  // Validate updates
  if (updates.name !== undefined) {
    const nameValidation = validateWalletName(updates.name);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }
  }
  
  // Ensure at least one field is being updated
  if (!updates.name && !updates.icon && !updates.color && !updates.description) {
    throw new Error('No updates provided');
  }
  
  try {
    const headers = await getAuthHeader();
    const body: Record<string, string> = {};
    
    if (updates.name !== undefined) body.name = updates.name.trim();
    if (updates.icon !== undefined) body.icon = updates.icon;
    if (updates.color !== undefined) body.color = updates.color;
    if (updates.description !== undefined) body.description = updates.description.trim();
    
    const res = await fetch(`${API_BASE}/api/v1/mobile/wallets/${walletId}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to update wallet' }));
      throw new Error(errorData.error || errorData.message || 'Failed to update wallet');
    }
    
    const data = await res.json();
    return data.wallet || data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error while updating wallet');
  }
}

/**
 * Archive a wallet (soft delete)
 * SERVER-SIDE: DELETE /api/v1/mobile/wallets/:id (or PATCH with status: archived)
 * Security: Server verifies wallet belongs to authenticated user
 * Note: Cannot archive wallet with balance > 0
 */
export async function archiveWallet(walletId: string): Promise<{ success: boolean; message: string }> {
  if (!walletId) {
    throw new Error('Wallet ID is required');
  }
  
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/v1/mobile/wallets/${walletId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to archive wallet' }));
      throw new Error(errorData.error || errorData.message || 'Failed to archive wallet');
    }
    
    const data = await res.json();
    return {
      success: true,
      message: data.message || 'Wallet archived successfully',
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error while archiving wallet');
  }
}

/**
 * Get wallet details by ID
 * SERVER-SIDE: GET /api/v1/mobile/wallets/:id
 * Security: Server verifies wallet belongs to authenticated user
 */
export async function getWalletDetails(walletId: string): Promise<WalletDetails> {
  if (!walletId) {
    throw new Error('Wallet ID is required');
  }
  
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/v1/mobile/wallets/${walletId}`, {
      headers,
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to fetch wallet' }));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch wallet');
    }
    
    const data = await res.json();
    return data.wallet || data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error while fetching wallet details');
  }
}
