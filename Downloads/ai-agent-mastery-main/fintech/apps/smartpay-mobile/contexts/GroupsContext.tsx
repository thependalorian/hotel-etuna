/**
 * GroupsContext – Smartpay Mobile Groups Provider.
 * Manages user groups, members, and group transactions.
 * Location: fintech/smartpay/mobile/contexts/GroupsContext.tsx
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from './UserContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/**
 * Group member interface.
 */
export interface GroupMember {
  /** User ID */
  userId: string;
  /** Member name */
  name: string;
  /** Member phone number */
  phone?: string;
  /** Member avatar URL */
  avatarUrl?: string;
  /** Member role in group */
  role: 'admin' | 'member';
  /** Join date */
  joinedAt: string;
}

/**
 * Group interface with complete type definitions.
 */
export interface Group {
  /** Unique group identifier */
  id: string;
  /** Group name */
  name: string;
  /** Group description */
  description?: string;
  /** Group type/category */
  type: 'savings' | 'social' | 'business' | 'family';
  /** Group avatar/icon URL */
  avatarUrl?: string;
  /** Total group balance */
  balance: number;
  /** Currency code */
  currency: 'NAD';
  /** Array of group members */
  members: GroupMember[];
  /** Whether current user is admin */
  isAdmin: boolean;
  /** Group creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Groups context state interface.
 */
interface GroupsState {
  /** Array of user groups */
  groups: Group[];
  /** Loading state */
  isLoading: boolean;
  /** Error message (if any) */
  error: string | null;
}

/**
 * Groups context value interface with state and actions.
 */
interface GroupsContextValue extends GroupsState {
  /** Refresh groups from API */
  refresh: () => Promise<void>;
  /** Get group by ID */
  getGroupById: (id: string) => Group | undefined;
}

const GroupsContext = createContext<GroupsContextValue | undefined>(undefined);

/**
 * GroupsProvider component that fetches and manages groups state.
 * @param children - Child components
 */
export function GroupsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser();
  
  const [state, setState] = useState<GroupsState>({
    groups: [],
    isLoading: true,
    error: null,
  });

  /**
   * Fetches groups from the API endpoint.
   */
  const loadGroups = useCallback(async () => {
    if (!isAuthenticated) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Mock data for development when API is not configured
      if (!API_BASE_URL) {
        const mockGroups: Group[] = [
          {
            id: 'grp-1',
            name: 'Family Savings',
            description: 'Family savings pool',
            type: 'family',
            balance: 150000,
            currency: 'NAD',
            members: [
              {
                userId: 'user-1',
                name: 'John Doe',
                role: 'admin',
                joinedAt: new Date().toISOString(),
              },
              {
                userId: 'user-2',
                name: 'Jane Doe',
                role: 'member',
                joinedAt: new Date().toISOString(),
              },
            ],
            isAdmin: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'grp-2',
            name: 'Weekend Trip',
            description: 'Saving for our weekend getaway',
            type: 'social',
            balance: 75000,
            currency: 'NAD',
            members: [
              {
                userId: 'user-1',
                name: 'John Doe',
                role: 'member',
                joinedAt: new Date().toISOString(),
              },
              {
                userId: 'user-3',
                name: 'Bob Smith',
                role: 'admin',
                joinedAt: new Date().toISOString(),
              },
            ],
            isAdmin: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        setState({
          groups: mockGroups,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Fetch from real API
      const res = await fetch(`${API_BASE_URL}/api/v1/mobile/groups`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await res.json();
      const groups: Group[] = data.groups ?? [];

      setState({
        groups,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading groups:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load groups',
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  /**
   * Refreshes groups data from API.
   */
  const refresh = useCallback(async () => {
    await loadGroups();
  }, [loadGroups]);

  /**
   * Gets a group by its ID.
   * @param id - Group ID
   * @returns Group object or undefined
   */
  const getGroupById = useCallback((id: string) => {
    return state.groups.find(g => g.id === id);
  }, [state.groups]);

  const value: GroupsContextValue = {
    ...state,
    refresh,
    getGroupById,
  };

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

/**
 * Hook to access groups context.
 * @throws Error if used outside GroupsProvider
 */
export function useGroups(): GroupsContextValue {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
}
