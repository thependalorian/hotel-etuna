/**
 * VerificationScreen Component
 * 
 * Location: components/onboarding/VerificationScreen.tsx
 * Purpose: Phone/email verification screen
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface VerificationScreenProps {
  phoneNumber?: string;
  email?: string;
  onVerified?: () => void;
  onResend?: () => void;
}

export default function VerificationScreen({
  phoneNumber,
  email,
  onVerified,
  onResend,
}: VerificationScreenProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digit

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every((digit) => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (verificationCode: string) => {
    // In production, verify code with backend
    if (verificationCode.length === 6) {
      onVerified?.();
    } else {
      Alert.alert('Error', 'Please enter the complete verification code');
    }
  };

  return (
    <View style={defaultStyles.containerCentered}>
      <Text style={defaultStyles.headerMedium}>Verify Your Account</Text>
      <Text style={defaultStyles.descriptionText}>
        We sent a verification code to {phoneNumber || email}
      </Text>

      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.codeInput}
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={defaultStyles.pillButton}
        onPress={() => handleVerify(code.join(''))}
      >
        <Text style={defaultStyles.buttonText}>Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton} onPress={onResend}>
        <Text style={styles.resendText}>Resend Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  codeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 32,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  resendButton: {
    marginTop: 24,
    padding: 8,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
});
