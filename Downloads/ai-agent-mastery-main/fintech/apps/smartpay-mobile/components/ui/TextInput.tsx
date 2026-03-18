/**
 * TextInput Component - Figma Input/Large Spec
 * 
 * Location: mobile/components/ui/TextInput.tsx
 * Figma Node: 1417:42922 (Input/Large)
 * 
 * Specs:
 * - Height: 56px
 * - Border radius: 999 (pill-shaped)
 * - States: default, focused, error, disabled
 * - Border animation on focus
 * 
 * Features:
 * - Prefix/suffix support
 * - Error message display
 * - Clearable option
 * - Validation indicator
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps as RNTextInputProps,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  prefix?: string;
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  suffix?: string;
  suffixIcon?: keyof typeof Ionicons.glyphMap;
  clearable?: boolean;
  required?: boolean;
  showValidation?: boolean;
  isValid?: boolean;
}

export function TextInput({
  label,
  error,
  prefix,
  prefixIcon,
  suffix,
  suffixIcon,
  clearable = false,
  required = false,
  showValidation = false,
  isValid = false,
  value,
  onChangeText,
  style,
  editable = true,
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderWidthAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(borderWidthAnim, {
      toValue: isFocused ? 2 : 1,
      duration: DS.animations.fast,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleClear = () => {
    onChangeText?.('');
  };

  const hasError = !!error;
  const showClear = clearable && value && value.length > 0 && editable;
  const isDisabled = !editable;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          isDisabled && styles.inputContainerDisabled,
          { borderWidth: borderWidthAnim },
        ]}
      >
        {(prefix || prefixIcon) && (
          <View style={styles.prefixContainer}>
            {prefixIcon && (
              <Ionicons
                name={prefixIcon}
                size={20}
                color={hasError ? DS.colors.error : DS.colors.textSecondary}
              />
            )}
            {prefix && <Text style={styles.prefixText}>{prefix}</Text>}
          </View>
        )}

        <RNTextInput
          style={[styles.input, style]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={DS.colors.textPlaceholder}
          editable={editable}
          accessibilityLabel={label}
          accessibilityState={{ disabled: isDisabled }}
          {...props}
        />

        {showValidation && isValid && !hasError && (
          <Ionicons name="checkmark-circle" size={20} color={DS.colors.success} />
        )}

        {showClear && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Clear input"
          >
            <Ionicons name="close-circle" size={20} color={DS.colors.textSecondary} />
          </TouchableOpacity>
        )}

        {(suffix || suffixIcon) && (
          <View style={styles.suffixContainer}>
            {suffix && <Text style={styles.suffixText}>{suffix}</Text>}
            {suffixIcon && (
              <Ionicons
                name={suffixIcon}
                size={20}
                color={hasError ? DS.colors.error : DS.colors.textSecondary}
              />
            )}
          </View>
        )}
      </Animated.View>

      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={DS.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DS.spacing.md,
  },
  label: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.text,
    fontWeight: DS.typography.fontWeight.semibold,
    marginBottom: DS.spacing.xs,
  },
  required: {
    color: DS.colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.pill,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    gap: DS.spacing.sm,
  },
  inputContainerFocused: {
    borderColor: DS.colors.primary,
    backgroundColor: DS.colors.background,
    ...DS.shadows.sm,
  },
  inputContainerError: {
    borderColor: DS.colors.error,
    backgroundColor: DS.colors.background,
  },
  inputContainerDisabled: {
    backgroundColor: DS.colors.surfaceVariant,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.text,
    paddingVertical: 0,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.xs,
  },
  prefixText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    fontWeight: DS.typography.fontWeight.medium,
  },
  suffixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.xs,
  },
  suffixText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
  },
  clearButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.xs,
    marginTop: DS.spacing.xs,
    marginLeft: DS.spacing.md,
  },
  errorText: {
    fontSize: DS.typography.fontSize.xs,
    color: DS.colors.error,
    flex: 1,
  },
});
