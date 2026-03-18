/**
 * CompactEducationCard - Inline Educational Content Display
 * Location: fintech/smartpay/components/copilot/cards/CompactEducationCard.tsx
 * Reference: PRD §4.6.3 - Educational Content System
 * 
 * Compact version of EducationCard for displaying educational content
 * inline within copilot chat messages. Shows summary with "Learn more" action.
 * 
 * Features:
 * - Condensed layout for chat bubbles
 * - Quick access to full content
 * - Accessibility support
 * - Responsive to screen sizes
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { designSystem } from '@/constants/designSystem';
import type { EducationalContent } from '@/services/copilot/knowledgeBaseService';

export interface CompactEducationCardProps {
  content: EducationalContent;
  onExpand?: (contentId: string) => void;
}

/**
 * CompactEducationCard Component
 * 
 * Displays a condensed preview of educational content with option to expand.
 * Designed to fit within copilot chat messages.
 * 
 * @param content - Educational content to display
 * @param onExpand - Callback when user wants to see full content
 * 
 * @example
 * ```tsx
 * <CompactEducationCard
 *   content={walletContent}
 *   onExpand={(id) => console.log('Expand:', id)}
 * />
 * ```
 */
export function CompactEducationCard({ content, onExpand }: CompactEducationCardProps) {
  return (
    <View style={styles.card}>
      {/* Icon and Title */}
      <View style={styles.header}>
        <Text style={styles.icon}>📚</Text>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {content.title}
          </Text>
          <Text style={styles.levelBadge}>{getLevelLabel(content.level)}</Text>
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.summary} numberOfLines={3}>
        {content.summary}
      </Text>

      {/* Tags */}
      {content.tags && content.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {content.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {content.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{content.tags.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Action Button */}
      {onExpand && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => onExpand(content.id)}
          accessibilityRole="button"
          accessibilityLabel={`Learn more about ${content.title}`}
        >
          <Text style={styles.expandButtonText}>Learn More</Text>
          <Text style={styles.expandButtonIcon}>→</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Helper Functions
 */

function getLevelLabel(level: 'basic' | 'intermediate' | 'advanced'): string {
  const labels = {
    basic: '🟢 Beginner',
    intermediate: '🟡 Intermediate',
    advanced: '🔴 Advanced',
  };
  return labels[level];
}

/**
 * Styles
 */

const styles = StyleSheet.create({
  card: {
    backgroundColor: designSystem.colors.neutral.surface,
    borderRadius: designSystem.radius.md,
    padding: designSystem.spacing.md,
    marginVertical: designSystem.spacing.xs,
    borderWidth: 1,
    borderColor: designSystem.colors.brand.primaryMuted,
    ...designSystem.shadows.sm,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
  },
  icon: {
    fontSize: 24,
    marginRight: designSystem.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...designSystem.typography.textStyles.h3,
    color: designSystem.colors.neutral.text,
    marginBottom: 4,
  },
  levelBadge: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
    fontSize: 12,
  },

  // Summary Styles
  summary: {
    ...designSystem.typography.textStyles.bodySmall,
    color: designSystem.colors.neutral.textSecondary,
    marginBottom: designSystem.spacing.sm,
    lineHeight: 20,
  },

  // Tags Styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designSystem.spacing.xs,
    marginBottom: designSystem.spacing.sm,
  },
  tag: {
    backgroundColor: designSystem.colors.neutral.muted,
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: designSystem.radius.sm,
  },
  tagText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.brand.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  moreTagsText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textTertiary,
    paddingVertical: 4,
    fontSize: 11,
  },

  // Button Styles
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designSystem.colors.brand.primary,
    paddingVertical: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.md,
    borderRadius: designSystem.radius.sm,
    marginTop: designSystem.spacing.xs,
  },
  expandButtonText: {
    ...designSystem.typography.textStyles.button,
    color: '#ffffff',
    marginRight: designSystem.spacing.xs,
    fontSize: 14,
  },
  expandButtonIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
