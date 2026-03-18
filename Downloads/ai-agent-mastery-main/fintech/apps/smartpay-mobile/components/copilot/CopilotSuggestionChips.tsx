/**
 * CopilotSuggestionChips - Suggestion pills for quick actions
 * 
 * Design Specs (from SKILL.md):
 * - Height: 36px pills
 * - Border radius: pill (999)
 * - Horizontal scroll
 * - Surface background with border
 * 
 * Location: components/copilot/CopilotSuggestionChips.tsx
 */
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { SuggestionChip } from '@/contexts/copilot/useCopilotSuggestions';
import { designSystem as DS } from '@/constants/designSystem';

interface CopilotSuggestionChipsProps {
  suggestions: SuggestionChip[];
  onSelect?: (chip: SuggestionChip) => void;
}

export function CopilotSuggestionChips({ suggestions, onSelect }: CopilotSuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {suggestions.map((chip) => (
        <TouchableOpacity
          key={chip.id}
          style={styles.chip}
          onPress={() => onSelect?.(chip)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={chip.label}
        >
          <Text style={styles.chipText} numberOfLines={1}>
            {chip.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { 
    maxHeight: 52,
    flexGrow: 0,
  },
  container: { 
    paddingHorizontal: DS.spacing[4],
    paddingVertical: DS.spacing[2],
    gap: DS.spacing[2],
    flexDirection: 'row',
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  chipText: { 
    fontSize: 14,
    fontWeight: '500',
    color: DS.colors.text,
  },
});
