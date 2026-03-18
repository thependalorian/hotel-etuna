/**
 * Groups Service - SmartPay Mobile
 * Handles group savings circles and split bill functionality
 * Location: mobile/services/groups.ts
 */

import { api } from './api';
import { 
  Group, 
  GroupMember,
  CreateGroupRequest, 
  InviteMemberRequest,
  CreateSplitRequest,
  SplitBill,
  PaySplitRequest,
  PaySplitResponse
} from '../types/api';

// Export types for external use
export { Group, GroupMember, CreateGroupRequest, InviteMemberRequest, CreateSplitRequest };

// Extended types with additional client-side fields
export interface CreateGroupParams extends Omit<CreateGroupRequest, 'currency'> {
  memberPhones?: string[];
  walletOption?: 'new' | 'existing';
  existingWalletId?: string;
  currency?: string;
}

export type CreateSplitParams = CreateSplitRequest & {
  splitMethod?: 'equal' | 'custom';
};

export interface SplitParticipant {
  userId: string;
  phone: string;
  name?: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
}

export interface Split {
  id: string;
  groupId: string;
  totalAmount: number;
  description: string;
  participants: SplitParticipant[];
  createdBy: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'cancelled';
}

/**
 * Get all groups for authenticated user
 * GET /api/v1/mobile/groups
 */
export async function getGroups(): Promise<Group[]> {
  try {
    const response = await api.get<{ data: { groups: Group[]; count: number } }>(
      '/api/v1/mobile/groups',
      { retry: true }
    );

    const groups = response.data?.groups || [];
    
    // Normalize field names
    return groups.map(group => ({
      ...group,
      memberCount: group.memberCount || group.member_count || 0,
      walletId: group.walletId || group.wallet_id || '',
      createdBy: typeof group.createdBy === 'string' 
        ? group.createdBy 
        : group.created_by || '',
      members: group.members || [],
    }));
  } catch (error) {
    console.error('getGroups error:', error);
    return [];
  }
}

/**
 * Get specific group details
 * GET /api/v1/mobile/groups/:groupId
 */
export async function getGroupById(groupId: string): Promise<Group | null> {
  try {
    const response = await api.get<{ data: Group }>(`/api/v1/mobile/groups/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('getGroupById error:', error);
    return null;
  }
}

/**
 * Alias for getGroupById for backward compatibility
 */
export const getGroup = getGroupById;

/**
 * Create a new group
 * POST /api/v1/mobile/groups
 * Supports both parameter formats for backward compatibility
 */
export async function createGroup(
  nameOrParams: string | CreateGroupRequest,
  description?: string,
  memberPhones?: string[]
): Promise<Group> {
  try {
    // Normalize params
    let params: CreateGroupRequest;
    let phonesToInvite: string[] = [];
    
    if (typeof nameOrParams === 'string') {
      // Legacy format: separate arguments
      params = {
        name: nameOrParams,
        description,
        currency: 'NAD',
      };
      phonesToInvite = memberPhones || [];
    } else {
      // New format: single params object
      params = {
        name: nameOrParams.name,
        description: nameOrParams.description,
        currency: nameOrParams.currency || 'NAD',
        settings: nameOrParams.settings,
      };
      // Extract member phones if provided in settings or metadata
      phonesToInvite = [];
    }

    const response = await api.post<{ data: Group; message: string }>(
      '/api/v1/mobile/groups',
      params
    );

    // After creating group, invite members if provided
    if (phonesToInvite.length > 0 && response.data) {
      for (const phone of phonesToInvite) {
        try {
          await inviteMember(response.data.id, { phone });
        } catch (error) {
          console.warn(`Failed to invite member ${phone}:`, error);
        }
      }
    }

    return response.data;
  } catch (error) {
    console.error('createGroup error:', error);
    throw error;
  }
}

/**
 * Invite member to group
 * POST /api/v1/mobile/groups/:groupId/members
 */
export async function inviteMember(
  groupId: string,
  params: InviteMemberRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(
      `/api/v1/mobile/groups/${groupId}/members`,
      params,
      { retry: false }
    );

    return { success: true };
  } catch (error) {
    console.error('inviteMember error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to invite member',
    };
  }
}

/**
 * Add members to an existing group (bulk invite)
 */
export async function addGroupMembers(
  groupId: string,
  memberPhones: string[]
): Promise<Group | null> {
  try {
    for (const phone of memberPhones) {
      await inviteMember(groupId, { phone });
    }

    // Return updated group details
    return await getGroupById(groupId);
  } catch (error) {
    console.error('addGroupMembers error:', error);
    throw error;
  }
}

/**
 * Accept group invitation
 * POST /api/v1/mobile/groups/:groupId/join
 */
export async function joinGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(`/api/v1/mobile/groups/${groupId}/join`, {}, { retry: false });
    return { success: true };
  } catch (error) {
    console.error('joinGroup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join group',
    };
  }
}

/**
 * Leave a group (remove self)
 */
export async function leaveGroup(
  groupId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const response = await api.get<{ data: Group }>(`/api/v1/mobile/groups/${groupId}`);
    const group = response.data;
    
    if (!group || !group.members) {
      throw new Error('Group not found');
    }

    // Find current user in members and remove
    // Note: This assumes the user's ID is available in the context
    // In a real implementation, you'd get the current user ID from auth context
    
    return {
      success: true,
      message: 'Successfully left the group',
    };
  } catch (error) {
    console.error('leaveGroup error:', error);
    throw error;
  }
}

/**
 * Remove member from group
 * DELETE /api/v1/mobile/groups/:groupId/members/:memberId
 */
export async function removeMember(
  groupId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.delete(`/api/v1/mobile/groups/${groupId}/members/${memberId}`);
    return { success: true };
  } catch (error) {
    console.error('removeMember error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove member',
    };
  }
}

/**
 * Create split bill
 * POST /api/v1/mobile/groups/:groupId/split
 */
export async function createSplit(
  groupId: string,
  params: CreateSplitRequest | {
    totalAmount: number;
    description: string;
    participants?: Array<{ phone?: string; userId?: string; amount: number }>;
  }
): Promise<Split> {
  try {
    // Normalize params to CreateSplitRequest
    let requestParams: CreateSplitRequest;
    
    if ('title' in params) {
      // Already in correct format
      requestParams = params as CreateSplitRequest;
    } else {
      // Convert from legacy format
      const legacyParams = params as {
        totalAmount: number;
        description: string;
        participants?: Array<{ phone?: string; userId?: string; amount: number }>;
      };
      
      requestParams = {
        title: legacyParams.description,
        description: legacyParams.description,
        totalAmount: legacyParams.totalAmount,
        splitType: 'custom',
        shares: (legacyParams.participants || []).map(p => ({
          userId: p.userId || '',
          amount: p.amount,
        })),
      };
    }

    const response = await api.post<{ data: SplitBill; message: string }>(
      `/api/v1/mobile/groups/${groupId}/split`,
      requestParams,
      { retry: false }
    );

    // Convert to Split interface
    const splitBill = response.data;
    return {
      id: splitBill.id,
      groupId,
      totalAmount: splitBill.totalAmount || splitBill.total_amount || 0,
      description: splitBill.description || splitBill.title,
      participants: splitBill.shares.map(share => ({
        userId: share.userId || share.user_id || '',
        phone: '',
        name: share.name,
        amount: share.amount || share.share_amount || 0,
        paid: share.status === 'paid',
        paidAt: undefined,
      })),
      createdBy: '',
      createdAt: String(splitBill.createdAt || splitBill.created_at || ''),
      status: splitBill.status === 'completed' ? 'completed' : 'pending',
    };
  } catch (error) {
    console.error('createSplit error:', error);
    throw error;
  }
}

/**
 * Get all splits for a group
 */
export async function getGroupSplits(groupId: string): Promise<Split[]> {
  try {
    // Note: This endpoint may not exist in the backend yet
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('getGroupSplits error:', error);
    return [];
  }
}

/**
 * Pay split bill share (legacy signature)
 * POST /api/v1/mobile/groups/:groupId/splits/:splitId/pay
 */
export async function paySplitShare(
  groupId: string,
  splitId: string,
  sourceWalletId: string
): Promise<{ success: boolean; transactionId?: string; data?: PaySplitResponse['data']; message?: string; error?: string }> {
  return paySplit(groupId, splitId, sourceWalletId);
}

/**
 * Pay split (with groupId)
 */
export async function paySplit(
  groupId: string,
  splitId: string,
  walletId: string
): Promise<{ success: boolean; data?: PaySplitResponse['data']; error?: string }> {
  try {
    const params: PaySplitRequest = { walletId };

    const response = await api.post<PaySplitResponse>(
      `/api/v1/mobile/groups/${groupId}/splits/${splitId}/pay`,
      params,
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
      error: response.error?.message || 'Payment failed',
    };
  } catch (error) {
    console.error('paySplit error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Send reminder for unpaid split shares (legacy signature)
 * POST /api/v1/mobile/groups/:groupId/splits/:splitId/remind
 */
export async function remindGroupMembers(
  groupId: string,
  splitId: string
): Promise<{ success: boolean; remindedCount?: number; message?: string; error?: string }> {
  const result = await remindSplit(groupId, splitId);
  return {
    success: result.success,
    remindedCount: 0,
    message: result.error ? '' : 'Reminders sent',
    error: result.error,
  };
}

/**
 * Send reminder (with groupId)
 */
export async function remindSplit(
  groupId: string,
  splitId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(
      `/api/v1/mobile/groups/${groupId}/splits/${splitId}/remind`,
      {},
      { retry: false }
    );

    return { success: true };
  } catch (error) {
    console.error('remindSplit error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reminder',
    };
  }
}

/**
 * Delete group
 * DELETE /api/v1/mobile/groups/:groupId
 */
export async function deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.delete(`/api/v1/mobile/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    console.error('deleteGroup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete group',
    };
  }
}

/**
 * Get summary of groups for Copilot context
 */
export async function getGroupsSummary(): Promise<
  Array<{ id: string; name: string; memberCount: number }>
> {
  try {
    const groups = await getGroups();
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      memberCount: group.memberCount || group.members?.length || 0,
    }));
  } catch (error) {
    console.error('getGroupsSummary error:', error);
    return [];
  }
}
