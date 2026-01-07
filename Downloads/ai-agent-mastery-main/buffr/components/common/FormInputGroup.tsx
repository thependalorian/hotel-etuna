/**
 * FormInputGroup Component
 * 
 * Location: components/common/FormInputGroup.tsx
 * Purpose: Reusable form input with label and error handling
 * 
 * Features:
 * - Label text
 * - Pill-shaped input (borderRadius: 25, height: 50)
 * - Error message display
 * - Consistent styling across forms
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

interface FormInputGroupProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: object;
  inputStyle?: object;
}

export default function FormInputGroup({
  label,
  error,
  containerStyle,
  inputStyle,
  ...textInputProps
}: FormInputGroupProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={defaultStyles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          inputStyle,
        ]}
        placeholderTextColor={Colors.textSecondary}
        {...textInputProps}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  input: {
    ...defaultStyles.input,
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
