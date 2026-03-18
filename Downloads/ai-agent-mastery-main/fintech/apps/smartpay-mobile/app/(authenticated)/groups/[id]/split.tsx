/**
 * Split bill screen – Smartpay.
 * Create and split bills among group members.
 * Location: mobile/app/(authenticated)/groups/[id]/split.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { designSystem } from '@/constants/designSystem';
import { getGroup, createSplit, CreateSplitParams } from '@/services/groups';

const ds = designSystem;

interface ParticipantSelection {
  userId: string;
  name: string;
  phone: string;
  isSelected: boolean;
  customAmount?: string;
}

export default function SplitBillScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<ParticipantSelection[]>([]);

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => getGroup(id),
    enabled: !!id,
  });

  // Initialize participants when group data loads
  React.useEffect(() => {
    if (group && group.members && participants.length === 0) {
      setParticipants(
        group.members.map((member) => ({
          userId: member.userId,
          name: member.name || member.phone,
          phone: member.phone,
          isSelected: true,
          customAmount: '',
        }))
      );
    }
  }, [group, participants.length]);

  const createSplitMutation = useMutation({
    mutationFn: (params: CreateSplitParams) => createSplit(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      Alert.alert('Success', 'Bill split created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'An unexpected error occurred');
    },
  });

  const toggleParticipant = (userId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, isSelected: !p.isSelected } : p
      )
    );
  };

  const updateCustomAmount = (userId: string, amount: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, customAmount: amount } : p
      )
    );
  };

  const calculateSplit = () => {
    const selectedParticipants = participants.filter((p) => p.isSelected);
    const total = parseFloat(totalAmount) || 0;

    if (splitMethod === 'equal') {
      return selectedParticipants.length > 0
        ? total / selectedParticipants.length
        : 0;
    }

    return 0;
  };

  const validateAndSubmit = () => {
    const total = parseFloat(totalAmount);
    
    if (!totalAmount || isNaN(total) || total <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid total amount');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const selectedParticipants = participants.filter((p) => p.isSelected);
    
    if (selectedParticipants.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one participant');
      return;
    }

    if (splitMethod === 'custom') {
      const customAmounts: Record<string, number> = {};
      let sum = 0;

      for (const p of selectedParticipants) {
        const amount = parseFloat(p.customAmount || '0');
        if (isNaN(amount) || amount <= 0) {
          Alert.alert('Validation Error', `Please enter a valid amount for ${p.name}`);
          return;
        }
        customAmounts[p.userId] = amount;
        sum += amount;
      }

      if (Math.abs(sum - total) > 0.01) {
        Alert.alert(
          'Validation Error',
          `Custom amounts (${group?.currency} ${sum.toFixed(2)}) must equal total amount (${group?.currency} ${total.toFixed(2)})`
        );
        return;
      }

      const params: CreateSplitParams = {
        title: description.trim(),
        description: description.trim(),
        totalAmount: total,
        splitType: 'custom',
        shares: selectedParticipants.map((p) => ({
          userId: p.userId,
          amount: customAmounts[p.userId] || 0,
        })),
      };

      createSplitMutation.mutate(params);
    } else {
      const equalAmount = total / selectedParticipants.length;
      const params: CreateSplitParams = {
        title: description.trim(),
        description: description.trim(),
        totalAmount: total,
        splitType: 'equal',
        shares: selectedParticipants.map((p) => ({
          userId: p.userId,
          amount: equalAmount,
        })),
      };

      createSplitMutation.mutate(params);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={24} color={ds.colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Split Bill</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          {renderHeader()}
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={ds.colors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const equalSplitAmount = calculateSplit();
  const selectedCount = participants.filter((p) => p.isSelected).length;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {renderHeader()}
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Total Amount <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.amountInput}>
                  <Text style={styles.currency}>{group?.currency}</Text>
                  <TextInput
                    style={styles.amountValue}
                    placeholder="0.00"
                    placeholderTextColor={ds.colors.textTertiary}
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Description <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Dinner at The Bistro"
                  placeholderTextColor={ds.colors.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Split Method</Text>
              
              <View style={styles.methodToggle}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    splitMethod === 'equal' && styles.methodButtonActive,
                  ]}
                  onPress={() => setSplitMethod('equal')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="people"
                    size={20}
                    color={splitMethod === 'equal' ? '#FFF' : ds.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.methodButtonText,
                      splitMethod === 'equal' && styles.methodButtonTextActive,
                    ]}
                  >
                    Split Equally
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    splitMethod === 'custom' && styles.methodButtonActive,
                  ]}
                  onPress={() => setSplitMethod('custom')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calculator"
                    size={20}
                    color={splitMethod === 'custom' ? '#FFF' : ds.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.methodButtonText,
                      splitMethod === 'custom' && styles.methodButtonTextActive,
                    ]}
                  >
                    Custom Split
                  </Text>
                </TouchableOpacity>
              </View>

              {splitMethod === 'equal' && selectedCount > 0 && totalAmount && (
                <View style={styles.equalSplitInfo}>
                  <Text style={styles.equalSplitText}>
                    Each person pays: {group?.currency} {equalSplitAmount.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Participants ({selectedCount}/{participants.length})
              </Text>
              
              <View style={styles.participantsList}>
                {participants.map((participant) => (
                  <View key={participant.userId} style={styles.participantItem}>
                    <View style={styles.participantLeft}>
                      <Switch
                        value={participant.isSelected}
                        onValueChange={() => toggleParticipant(participant.userId)}
                        trackColor={{
                          false: ds.colors.border,
                          true: ds.colors.brand.primaryMuted,
                        }}
                        thumbColor={participant.isSelected ? ds.colors.primary : '#f4f3f4'}
                      />
                      
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{participant.name}</Text>
                        <Text style={styles.participantPhone}>{participant.phone}</Text>
                      </View>
                    </View>

                    {participant.isSelected && (
                      <View style={styles.participantAmount}>
                        {splitMethod === 'equal' ? (
                          <Text style={styles.participantAmountText}>
                            {group?.currency} {equalSplitAmount.toFixed(2)}
                          </Text>
                        ) : (
                          <View style={styles.customAmountInput}>
                            <Text style={styles.currencySmall}>{group?.currency}</Text>
                            <TextInput
                              style={styles.customAmountValue}
                              placeholder="0.00"
                              placeholderTextColor={ds.colors.textTertiary}
                              value={participant.customAmount}
                              onChangeText={(text) =>
                                updateCustomAmount(participant.userId, text)
                              }
                              keyboardType="decimal-pad"
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              createSplitMutation.isPending && styles.submitButtonDisabled,
            ]}
            onPress={validateAndSubmit}
            disabled={createSplitMutation.isPending}
            activeOpacity={0.8}
          >
            {createSplitMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.submitButtonText}>Create Split</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ds.colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.smartpay.horizontalPadding,
    paddingVertical: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...ds.typography.textStyles.titleSm, color: ds.colors.text },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  form: { padding: ds.spacing.smartpay.horizontalPadding, gap: ds.spacing.xl },
  section: { gap: ds.spacing.md },
  sectionTitle: { ...ds.typography.textStyles.h3, color: ds.colors.text, marginBottom: ds.spacing.sm },
  inputGroup: { gap: ds.spacing.sm },
  label: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.text },
  required: { color: ds.colors.error },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    paddingHorizontal: ds.spacing.md,
  },
  currency: { ...ds.typography.textStyles.h2, color: ds.colors.textSecondary, marginRight: ds.spacing.sm },
  amountValue: { flex: 1, ...ds.typography.textStyles.h1, color: ds.colors.text, paddingVertical: ds.spacing.md },
  input: {
    ...ds.typography.textStyles.body,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    color: ds.colors.text,
  },
  methodToggle: { flexDirection: 'row', gap: ds.spacing.md },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.sm,
    paddingVertical: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
  },
  methodButtonActive: {
    backgroundColor: ds.colors.primary,
    borderColor: ds.colors.primary,
  },
  methodButtonText: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.textSecondary },
  methodButtonTextActive: { color: '#FFF' },
  equalSplitInfo: {
    padding: ds.spacing.md,
    backgroundColor: ds.colors.brand.primaryLight,
    borderRadius: ds.radius.md,
  },
  equalSplitText: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.primary, textAlign: 'center' },
  participantsList: { gap: ds.spacing.sm },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
  },
  participantLeft: { flexDirection: 'row', alignItems: 'center', gap: ds.spacing.md, flex: 1 },
  participantInfo: { flex: 1, gap: 2 },
  participantName: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.text },
  participantPhone: { ...ds.typography.textStyles.caption, color: ds.colors.textSecondary },
  participantAmount: { marginLeft: ds.spacing.md },
  participantAmountText: { ...ds.typography.textStyles.body, fontWeight: '700', color: ds.colors.text },
  customAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.sm,
    paddingHorizontal: ds.spacing.sm,
    minWidth: 100,
  },
  currencySmall: { fontSize: 14, color: ds.colors.textSecondary, marginRight: 4 },
  customAmountValue: { flex: 1, fontSize: 16, fontWeight: '600', color: ds.colors.text, paddingVertical: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: ds.spacing.smartpay.horizontalPadding,
    paddingBottom: ds.spacing.lg,
    backgroundColor: ds.colors.surface,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
    ...ds.shadows.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.sm,
    height: 56,
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.md,
    ...ds.shadows.md,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { ...ds.typography.textStyles.button, color: '#FFF', fontSize: 17 },
});
