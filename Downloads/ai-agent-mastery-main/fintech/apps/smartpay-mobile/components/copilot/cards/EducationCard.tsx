/**
 * EducationCard - Financial Literacy Content Display
 * Location: fintech/smartpay/components/copilot/cards/EducationCard.tsx
 * Reference: PRD §4.6.3 - Educational Content System
 * 
 * Displays educational content, diagrams, examples, and FAQs in an accessible,
 * easy-to-understand format. Optimized for users with varying literacy levels.
 * 
 * Features:
 * - Clear typography and spacing (23 coding rules compliance)
 * - Expandable sections for progressive disclosure
 * - Related articles navigation
 * - "Learn more" actions
 * - Accessibility support (screen readers, high contrast)
 * - Multi-language support (future)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { designSystem } from '@/constants/designSystem';
import type { EducationalContent } from '@/services/copilot/knowledgeBaseService';

export interface EducationCardProps {
  content: EducationalContent;
  onLearnMore?: (topicId: string) => void;
  onRelatedTopicPress?: (topicId: string) => void;
  compact?: boolean;
}

/**
 * EducationCard Component
 * 
 * Displays financial literacy educational content with examples, FAQs, and related topics.
 * 
 * @param content - Educational content to display
 * @param onLearnMore - Callback when user wants to learn more about this topic
 * @param onRelatedTopicPress - Callback when user selects a related topic
 * @param compact - If true, shows condensed view with expandable sections
 * 
 * @example
 * ```tsx
 * <EducationCard
 *   content={walletContent}
 *   onLearnMore={(topicId) => console.log('Learn more:', topicId)}
 *   onRelatedTopicPress={(topicId) => console.log('Related topic:', topicId)}
 * />
 * ```
 */
export function EducationCard({
  content,
  onLearnMore,
  onRelatedTopicPress,
  compact = false,
}: EducationCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(compact ? [] : ['content', 'examples', 'faqs', 'related'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {content.title}
        </Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{getLevelLabel(content.level)}</Text>
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.summary} accessibilityLabel={`Summary: ${content.summary}`}>
        {content.summary}
      </Text>

      {/* Main Content Section */}
      <CollapsibleSection
        title="Learn About This"
        isExpanded={isExpanded('content')}
        onToggle={() => toggleSection('content')}
        icon="📖"
      >
        <Text style={styles.contentText} accessibilityLabel={`Detailed explanation: ${content.content}`}>
          {content.content}
        </Text>
      </CollapsibleSection>

      {/* Examples Section */}
      {content.examples && content.examples.length > 0 && (
        <CollapsibleSection
          title="Examples"
          isExpanded={isExpanded('examples')}
          onToggle={() => toggleSection('examples')}
          icon="💡"
        >
          <View style={styles.examplesContainer}>
            {content.examples.map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <Text style={styles.exampleBullet}>•</Text>
                <Text style={styles.exampleText} accessibilityLabel={`Example ${index + 1}: ${example}`}>
                  {example}
                </Text>
              </View>
            ))}
          </View>
        </CollapsibleSection>
      )}

      {/* FAQs Section */}
      {content.faqs && content.faqs.length > 0 && (
        <CollapsibleSection
          title="Frequently Asked Questions"
          isExpanded={isExpanded('faqs')}
          onToggle={() => toggleSection('faqs')}
          icon="❓"
        >
          <View style={styles.faqsContainer}>
            {content.faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <Text style={styles.faqQuestion} accessibilityRole="header">
                  Q: {faq.question}
                </Text>
                <Text style={styles.faqAnswer} accessibilityLabel={`Answer: ${faq.answer}`}>
                  A: {faq.answer}
                </Text>
              </View>
            ))}
          </View>
        </CollapsibleSection>
      )}

      {/* Related Topics Section */}
      {content.relatedTopics && content.relatedTopics.length > 0 && (
        <CollapsibleSection
          title="Related Topics"
          isExpanded={isExpanded('related')}
          onToggle={() => toggleSection('related')}
          icon="🔗"
        >
          <View style={styles.relatedTopicsContainer}>
            {content.relatedTopics.map((topicId, index) => (
              <TouchableOpacity
                key={index}
                style={styles.relatedTopicChip}
                onPress={() => onRelatedTopicPress?.(topicId)}
                accessibilityRole="button"
                accessibilityLabel={`Explore related topic: ${getTopicTitle(topicId)}`}
              >
                <Text style={styles.relatedTopicText}>{getTopicTitle(topicId)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </CollapsibleSection>
      )}

      {/* Footer with Actions */}
      <View style={styles.footer}>
        <Text style={styles.sourceText} accessibilityLabel={`Source: ${content.source}`}>
          Source: {content.source}
        </Text>
        
        {onLearnMore && (
          <TouchableOpacity
            style={styles.learnMoreButton}
            onPress={() => onLearnMore(content.id)}
            accessibilityRole="button"
            accessibilityLabel="Learn more about this topic"
          >
            <Text style={styles.learnMoreText}>Learn More →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * CollapsibleSection Component
 * 
 * Reusable collapsible section with icon and toggle functionality
 */
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  icon: string;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  icon,
  children,
}: CollapsibleSectionProps) {
  return (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${title} section`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
      </Pressable>
      
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

/**
 * Helper Functions
 */

function getLevelLabel(level: 'basic' | 'intermediate' | 'advanced'): string {
  const labels = {
    basic: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  return labels[level];
}

function getTopicTitle(topicId: string): string {
  // Convert topic ID to readable title
  // e.g., "topic-wallet-basics" -> "Wallet Basics"
  return topicId
    .replace(/^topic-/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Styles
 */

const styles = StyleSheet.create({
  card: {
    backgroundColor: designSystem.colors.neutral.surface,
    borderRadius: designSystem.radius.lg,
    padding: designSystem.spacing.md,
    marginVertical: designSystem.spacing.sm,
    marginHorizontal: designSystem.spacing.md,
    ...designSystem.shadows.md,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
  },
  title: {
    ...designSystem.typography.textStyles.h2,
    color: designSystem.colors.neutral.text,
    flex: 1,
    marginRight: designSystem.spacing.sm,
  },
  levelBadge: {
    backgroundColor: designSystem.colors.brand.primaryLight,
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: designSystem.radius.sm,
  },
  levelText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.brand.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  
  // Summary Styles
  summary: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.textSecondary,
    marginBottom: designSystem.spacing.md,
    lineHeight: 22,
  },
  
  // Section Styles
  section: {
    marginTop: designSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.neutral.border,
    paddingTop: designSystem.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.xs,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: designSystem.spacing.sm,
  },
  sectionTitle: {
    ...designSystem.typography.textStyles.h3,
    color: designSystem.colors.neutral.text,
    flex: 1,
  },
  expandIcon: {
    fontSize: 12,
    color: designSystem.colors.neutral.textSecondary,
  },
  sectionContent: {
    marginTop: designSystem.spacing.sm,
  },
  
  // Content Styles
  contentText: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.text,
    lineHeight: 24,
  },
  
  // Examples Styles
  examplesContainer: {
    gap: designSystem.spacing.sm,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: designSystem.spacing.xs,
  },
  exampleBullet: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.brand.primary,
    marginRight: designSystem.spacing.sm,
    fontWeight: '700',
  },
  exampleText: {
    ...designSystem.typography.textStyles.bodySmall,
    color: designSystem.colors.neutral.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  
  // FAQs Styles
  faqsContainer: {
    gap: designSystem.spacing.md,
  },
  faqItem: {
    backgroundColor: designSystem.colors.neutral.muted,
    borderRadius: designSystem.radius.md,
    padding: designSystem.spacing.md,
  },
  faqQuestion: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.text,
    fontWeight: '600',
    marginBottom: designSystem.spacing.xs,
  },
  faqAnswer: {
    ...designSystem.typography.textStyles.bodySmall,
    color: designSystem.colors.neutral.textSecondary,
    lineHeight: 22,
  },
  
  // Related Topics Styles
  relatedTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designSystem.spacing.sm,
  },
  relatedTopicChip: {
    backgroundColor: designSystem.colors.brand.primaryLight,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    borderRadius: designSystem.radius.full,
    borderWidth: 1,
    borderColor: designSystem.colors.brand.primaryMuted,
  },
  relatedTopicText: {
    ...designSystem.typography.textStyles.bodySmall,
    color: designSystem.colors.brand.primary,
    fontWeight: '600',
  },
  
  // Footer Styles
  footer: {
    marginTop: designSystem.spacing.lg,
    paddingTop: designSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.neutral.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textTertiary,
    flex: 1,
  },
  learnMoreButton: {
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.brand.primary,
    borderRadius: designSystem.radius.md,
  },
  learnMoreText: {
    ...designSystem.typography.textStyles.bodySmall,
    color: '#ffffff',
    fontWeight: '600',
  },
});
