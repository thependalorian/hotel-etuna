/**
 * SelectMethod Component
 * 
 * Location: components/transfers/SelectMethod.tsx
 * Purpose: Screen to select payment method for adding money
 * 
 * Based on Select Method.svg design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'card' | 'bank' | 'wallet' | 'other';
  last4?: string;
  bankName?: string;
}

interface SelectMethodProps {
  methods: PaymentMethod[];
  onMethodSelected?: (methodId: string) => void;
  onAddNew?: () => void;
}

export default function SelectMethod({
  methods,
  onMethodSelected,
  onAddNew,
}: SelectMethodProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    onMethodSelected?.(methodId);
  };

  const getMethodIcon = (type: string, icon: string) => {
    return icon as React.ComponentProps<typeof FontAwesome>['name'];
  };

  return (
    <View style={defaultStyles.containerFull}>
      <View style={styles.header}>
        <Text style={defaultStyles.headerMedium}>Select Payment Method</Text>
        <Text style={defaultStyles.descriptionText}>
          Choose how you want to add money
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {methods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodItem,
              selectedMethod === method.id && styles.methodItemSelected,
            ]}
            onPress={() => handleSelect(method.id)}
          >
            <View style={styles.methodIcon}>
              <FontAwesome
                name={getMethodIcon(method.type, method.icon)}
                size={24}
                color={Colors.primary}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              {method.last4 && (
                <Text style={styles.methodDetails}>•••• {method.last4}</Text>
              )}
              {method.bankName && (
                <Text style={styles.methodDetails}>{method.bankName}</Text>
              )}
            </View>
            {selectedMethod === method.id && (
              <FontAwesome name="check-circle" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addMethodButton} onPress={onAddNew}>
          <FontAwesome name="plus-circle" size={24} color={Colors.primary} />
          <Text style={styles.addMethodText}>Add New Payment Method</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 16,
  },
  methodItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted + '20',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 4,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  methodDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 12,
  },
  addMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
});
