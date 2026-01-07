/**
 * Cards Context
 * 
 * Location: contexts/CardsContext.tsx
 * Purpose: Global state management for linked payment cards
 * 
 * Provides card data and methods to add, update, and manage linked cards
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Card interface
export interface Card {
  id: string;
  cardNumber: string; // Full card number (stored securely, displayed as last 4)
  last4: string; // Last 4 digits for display
  expiryDate: string; // Format: MM/YY
  cvv?: string; // CVV (only stored temporarily during setup)
  cardholderName: string;
  cardType: 'debit' | 'credit';
  network: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  bankName?: string;
  isDefault?: boolean; // Default payment method
  isVerified: boolean; // Card verification status
  isActive: boolean; // Card active status
  createdAt: Date;
  lastUsedAt?: Date;
}

interface CardsContextType {
  cards: Card[];
  loading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  getCardById: (id: string) => Card | null;
  addCard: (cardData: Omit<Card, 'id' | 'last4' | 'isVerified' | 'isActive' | 'createdAt'>) => Promise<Card>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  setDefaultCard: (id: string) => Promise<void>;
  refreshCards: () => Promise<void>;
  getDefaultCard: () => Card | null;
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

// Helper function to detect card network from number
const detectCardNetwork = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'other' => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'visa';
  if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
  if (cleaned.startsWith('3')) return 'amex';
  if (cleaned.startsWith('6')) return 'discover';
  return 'other';
};

// Helper function to detect card type (debit/credit) - simplified logic
const detectCardType = (cardNumber: string): 'debit' | 'credit' => {
  // In production, this would be determined by the card issuer
  // For now, we'll use a simple heuristic or default to debit
  const cleaned = cardNumber.replace(/\s/g, '');
  // Visa/Mastercard starting with 4 or 5 are often debit
  // This is a simplified check - in production, use card issuer API
  return cleaned.length === 16 ? 'debit' : 'credit';
};

// Mock API function - Replace with actual API call
const fetchCardsFromAPI = async (): Promise<Card[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Mock data - Replace with actual API call
  return [
    {
      id: 'card-1',
      cardNumber: '4111111111111234',
      last4: '1234',
      expiryDate: '12/25',
      cardholderName: 'John Doe',
      cardType: 'debit',
      network: 'visa',
      bankName: 'Bank Windhoek',
      isDefault: true,
      isVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-15'),
      lastUsedAt: new Date(),
    },
    {
      id: 'card-2',
      cardNumber: '5555555555555678',
      last4: '5678',
      expiryDate: '06/26',
      cardholderName: 'John Doe',
      cardType: 'credit',
      network: 'mastercard',
      bankName: 'Nedbank',
      isDefault: false,
      isVerified: true,
      isActive: true,
      createdAt: new Date('2024-02-01'),
      lastUsedAt: new Date(Date.now() - 86400000),
    },
  ];
};

interface CardsProviderProps {
  children: ReactNode;
}

export function CardsProvider({ children }: CardsProviderProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCardsFromAPI();
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCards = useCallback(async () => {
    await fetchCards();
  }, [fetchCards]);

  const getCardById = useCallback(
    (id: string): Card | null => {
      return cards.find((card) => card.id === id) || null;
    },
    [cards]
  );

  const getDefaultCard = useCallback((): Card | null => {
    return cards.find((card) => card.isDefault) || cards[0] || null;
  }, [cards]);

  const addCard = useCallback(
    async (
      cardData: Omit<Card, 'id' | 'last4' | 'isVerified' | 'isActive' | 'createdAt'>
    ): Promise<Card> => {
      setLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const cardNumber = cardData.cardNumber.replace(/\s/g, '');
        const last4 = cardNumber.slice(-4);
        const network = detectCardNetwork(cardNumber);
        const cardType = cardData.cardType || detectCardType(cardNumber);

        // If this is the first card, make it default
        const isFirstCard = cards.length === 0;

        const newCard: Card = {
          ...cardData,
          id: `card-${Date.now()}`,
          last4,
          network,
          cardType,
          isDefault: isFirstCard,
          isVerified: true, // In production, this would be set after verification
          isActive: true,
          createdAt: new Date(),
        };

        // If this card is set as default, unset other defaults
        if (newCard.isDefault) {
          setCards((prev) =>
            prev.map((card) => ({ ...card, isDefault: false }))
          );
        }

        setCards((prev) => [...prev, newCard]);
        return newCard;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add card';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cards]
  );

  const updateCard = useCallback(async (id: string, updates: Partial<Card>) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        setCards((prev) =>
          prev.map((card) => (card.id === id ? { ...card, ...updates, isDefault: true } : { ...card, isDefault: false }))
        );
      } else {
        setCards((prev) =>
          prev.map((card) => (card.id === id ? { ...card, ...updates } : card))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update card');
      console.error('Error updating card:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      const cardToDelete = cards.find((card) => card.id === id);
      const wasDefault = cardToDelete?.isDefault;

      setCards((prev) => prev.filter((card) => card.id !== id));

      // If deleted card was default, set first remaining card as default
      if (wasDefault) {
        setCards((prev) => {
          if (prev.length > 0) {
            return prev.map((card, index) => ({
              ...card,
              isDefault: index === 0,
            }));
          }
          return prev;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete card');
      console.error('Error deleting card:', err);
    } finally {
      setLoading(false);
    }
  }, [cards]);

  const setDefaultCard = useCallback(async (id: string) => {
    await updateCard(id, { isDefault: true });
  }, [updateCard]);

  const value: CardsContextType = {
    cards,
    loading,
    error,
    fetchCards,
    getCardById,
    addCard,
    updateCard,
    deleteCard,
    setDefaultCard,
    refreshCards,
    getDefaultCard,
  };

  return (
    <CardsContext.Provider value={value}>
      {children}
    </CardsContext.Provider>
  );
}

export function useCards() {
  const context = useContext(CardsContext);
  if (context === undefined) {
    throw new Error('useCards must be used within a CardsProvider');
  }
  return context;
}
