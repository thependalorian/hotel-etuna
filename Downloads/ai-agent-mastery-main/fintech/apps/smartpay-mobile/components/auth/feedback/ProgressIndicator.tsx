/**
 * ProgressIndicator - Multi-step progress indicator
 * Location: fintech/smartpay/components/auth/feedback/ProgressIndicator.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number[];
  labels?: string[];
  testID?: string;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  completedSteps = [],
  labels,
  testID = 'progress-indicator',
}: ProgressIndicatorProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.steps}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.includes(index);
          const isPast = index < currentStep;

          return (
            <React.Fragment key={index}>
              <View style={styles.stepContainer}>
                <View
                  style={[
                    styles.step,
                    isActive && styles.stepActive,
                    (isCompleted || isPast) && styles.stepCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepText,
                      isActive && styles.stepTextActive,
                      (isCompleted || isPast) && styles.stepTextCompleted,
                    ]}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </Text>
                </View>
                {labels && labels[index] && (
                  <Text style={[styles.label, isActive && styles.labelActive]}>
                    {labels[index]}
                  </Text>
                )}
              </View>
              
              {index < totalSteps - 1 && (
                <View
                  style={[
                    styles.connector,
                    isPast && styles.connectorCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, radius } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: neutral.border,
    backgroundColor: neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    borderColor: brand.primary,
    backgroundColor: brand.primaryLight,
  },
  stepCompleted: {
    borderColor: brand.primary,
    backgroundColor: brand.primary,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: neutral.textSecondary,
  },
  stepTextActive: {
    color: brand.primary,
  },
  stepTextCompleted: {
    color: '#fff',
  },
  label: {
    fontSize: 12,
    color: neutral.textSecondary,
  },
  labelActive: {
    color: brand.primary,
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: neutral.border,
    marginHorizontal: spacing.xs,
  },
  connectorCompleted: {
    backgroundColor: brand.primary,
  },
});
