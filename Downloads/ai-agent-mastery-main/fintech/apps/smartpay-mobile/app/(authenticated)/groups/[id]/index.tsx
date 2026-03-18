/**
 * Group detail screen – Smartpay.
 * Shows group details, members, balance, pending splits, and actions.
 * Location: mobile/app/(authenticated)/groups/[id]/index.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designSystem } from '@/constants/designSystem';
import { getGroup, leaveGroup, paySplitShare, remindGroupMembers } from '@/services/groups';

const ds = designSystem;

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [currentUserId] = useState('user1');

  const { data: group, isLoading, error, refetch } = useQuery({
    queryKey: ['group', id],
    queryFn: () => getGroup(id),
    enabled: !!id,
  });

  const leaveGroupMutation = useMutation({
    mutationFn: () => leaveGroup(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        Alert.alert('Success', 'You have left the group', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to leave group');
      }
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ splitId, walletId }: { splitId: string; walletId: string }) =>
      paySplitShare(id, splitId, walletId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['group', id] });
        Alert.alert('Success', 'Payment successful!');
      } else {
        Alert.alert('Error', result.error || 'Payment failed');
      }
    },
  });

  const remindMutation = useMutation({
    mutationFn: (splitId: string) => remindGroupMembers(id, splitId),
    onSuccess: (result) => {
      if (result.success) {
        Alert.alert('Success', 'Reminders sent to group members');
      } else {
        Alert.alert('Error', result.error || 'Failed to send reminders');
      }
    },
  });

  const handleLeaveGroup = () => {
    const isAdmin = group?.members?.some((m) => m.userId === currentUserId && m.role === 'admin');
    
    if (isAdmin) {
      Alert.alert(
        'Cannot Leave',
        'Admins cannot leave the group. Please transfer admin rights first or delete the group.',
      );
      return;
    }

    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveGroupMutation.mutate() },
      ],
    );
  };

  const handlePaySplit = (splitId: string, amount: number) => {
    Alert.alert(
      'Pay Split',
      `Pay ${group?.currency} ${amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay', 
          onPress: () => payMutation.mutate({ splitId, walletId: group?.walletId || '' }) 
        },
      ],
    );
  };

  const renderHeader = () => {
    const isAdmin = group?.members?.some((m) => m.userId === currentUserId && m.role === 'admin');

    return (
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={ds.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {group?.name || 'Group'}
        </Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => Alert.alert('Settings', 'Group settings coming soon')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={24} color={ds.colors.text} />
          </TouchableOpacity>
        )}
        {!isAdmin && <View style={{ width: 40 }} />}
      </View>
    );
  };

  const renderBalanceCard = () => (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel}>Group Balance</Text>
        <Ionicons name="wallet-outline" size={24} color={ds.colors.primary} />
      </View>
      <Text style={styles.balanceAmount}>
        {group?.currency} {group?.walletBalance?.toFixed(2) ?? '0.00'}
      </Text>
      <View style={styles.balanceActions}>
        <TouchableOpacity 
          style={styles.balanceActionButton}
          onPress={() => Alert.alert('Contribute', 'Add money to group wallet')}
        >
          <Ionicons name="add-circle-outline" size={20} color={ds.colors.primary} />
          <Text style={styles.balanceActionText}>Contribute</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.balanceActionButton}
          onPress={() => Alert.alert('Pay', 'Pay from group wallet')}
        >
          <Ionicons name="card-outline" size={20} color={ds.colors.primary} />
          <Text style={styles.balanceActionText}>Pay from Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={styles.primaryAction}
        onPress={() => router.push(`/groups/${id}/split` as any)}
      >
        <Ionicons name="receipt-outline" size={22} color="#FFF" />
        <Text style={styles.primaryActionText}>Split a Bill</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMembersSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Members ({group?.memberCount})</Text>
        <TouchableOpacity onPress={() => Alert.alert('Manage', 'Manage members')}>
          <Text style={styles.sectionAction}>Manage</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.membersList}>
        {group?.members?.map((member) => (
          <View key={member.id || member.userId} style={styles.memberItem}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {member.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.name || member.phone}
              </Text>
              <Text style={styles.memberPhone}>{member.phone}</Text>
            </View>
            {member.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderPendingSplitsSection = () => {
    if (!group?.pendingSplits || group.pendingSplits.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Pending Splits ({group.pendingSplits.length})
          </Text>
        </View>
        <View style={styles.splitsList}>
          {group.pendingSplits?.map((split) => {
            const userShare = split.shares.find((s) => s.userId === currentUserId);
            const unpaidCount = split.shares.filter((s) => !s.isPaid).length;

            return (
              <View key={split.id} style={styles.splitCard}>
                <View style={styles.splitHeader}>
                  <View style={styles.splitInfo}>
                    <Text style={styles.splitDescription}>{split.description}</Text>
                    <Text style={styles.splitAmount}>
                      {group.currency} {split.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.splitBadge}>
                    <Text style={styles.splitBadgeText}>
                      {unpaidCount} unpaid
                    </Text>
                  </View>
                </View>

                <View style={styles.splitShares}>
                  {split.shares.map((share) => (
                    <View key={share.id} style={styles.shareItem}>
                      <View style={styles.shareInfo}>
                        <Text style={styles.shareName}>
                          {share.name || share.phone}
                        </Text>
                        <Text style={styles.shareAmount}>
                          {group.currency} {share.amount.toFixed(2)}
                        </Text>
                      </View>
                      {share.isPaid ? (
                        <View style={styles.paidBadge}>
                          <Ionicons name="checkmark-circle" size={18} color={ds.colors.success} />
                          <Text style={styles.paidText}>Paid</Text>
                        </View>
                      ) : share.userId === currentUserId ? (
                        <TouchableOpacity
                          style={styles.payButton}
                          onPress={() => handlePaySplit(split.id, share.amount)}
                          disabled={payMutation.isPending}
                        >
                          {payMutation.isPending ? (
                            <ActivityIndicator size="small" color={ds.colors.primary} />
                          ) : (
                            <Text style={styles.payButtonText}>Pay Now</Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.unpaidBadge}>
                          <Text style={styles.unpaidText}>Unpaid</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {unpaidCount > 0 && (
                  <TouchableOpacity
                    style={styles.remindButton}
                    onPress={() => remindMutation.mutate(split.id)}
                    disabled={remindMutation.isPending}
                  >
                    {remindMutation.isPending ? (
                      <ActivityIndicator size="small" color={ds.colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="notifications-outline" size={16} color={ds.colors.primary} />
                        <Text style={styles.remindButtonText}>Send Reminder</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderLeaveButton = () => {
    const isAdmin = group?.members?.some(m => m.userId === currentUserId && m.role === 'admin');
    
    if (isAdmin) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.leaveButton}
        onPress={handleLeaveGroup}
        disabled={leaveGroupMutation.isPending}
      >
        {leaveGroupMutation.isPending ? (
          <ActivityIndicator color={ds.colors.error} />
        ) : (
          <>
            <Ionicons name="exit-outline" size={20} color={ds.colors.error} />
            <Text style={styles.leaveButtonText}>Leave Group</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          {renderHeader()}
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={ds.colors.primary} />
            <Text style={styles.loadingText}>Loading group details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          {renderHeader()}
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={ds.colors.error} />
            <Text style={styles.errorText}>Failed to load group</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {renderHeader()}
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refetch()}
              tintColor={ds.colors.primary}
            />
          }
        >
          {renderBalanceCard()}
          {renderQuickActions()}
          {renderMembersSection()}
          {renderPendingSplitsSection()}
          {renderLeaveButton()}
        </ScrollView>
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
  settingsButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...ds.typography.textStyles.titleSm, color: ds.colors.text, flex: 1, textAlign: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: ds.spacing.xxl },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ds.spacing.smartpay.horizontalPadding },
  loadingText: { ...ds.typography.textStyles.body, color: ds.colors.textSecondary, marginTop: ds.spacing.md },
  errorText: { ...ds.typography.textStyles.body, color: ds.colors.error, marginTop: ds.spacing.md, marginBottom: ds.spacing.md },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: ds.colors.primary, borderRadius: ds.radius.md },
  retryButtonText: { ...ds.typography.textStyles.button, color: '#FFF' },
  balanceCard: {
    margin: ds.spacing.smartpay.horizontalPadding,
    padding: ds.spacing.lg,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.border,
    ...ds.shadows.md,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ds.spacing.sm },
  balanceLabel: { ...ds.typography.textStyles.body, color: ds.colors.textSecondary },
  balanceAmount: { ...ds.typography.textStyles.largeTitle, color: ds.colors.text, fontWeight: '700', marginBottom: ds.spacing.lg },
  balanceActions: { flexDirection: 'row', gap: ds.spacing.md },
  balanceActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ds.spacing.sm, paddingVertical: ds.spacing.md, backgroundColor: ds.colors.brand.primaryLight, borderRadius: ds.radius.md },
  balanceActionText: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.primary },
  quickActions: { paddingHorizontal: ds.spacing.smartpay.horizontalPadding, marginBottom: ds.spacing.lg },
  primaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ds.spacing.sm, paddingVertical: ds.spacing.md, backgroundColor: ds.colors.primary, borderRadius: ds.radius.md, ...ds.shadows.md },
  primaryActionText: { ...ds.typography.textStyles.button, color: '#FFF' },
  section: { paddingHorizontal: ds.spacing.smartpay.horizontalPadding, marginBottom: ds.spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ds.spacing.md },
  sectionTitle: { ...ds.typography.textStyles.h3, color: ds.colors.text },
  sectionAction: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.primary },
  membersList: { gap: ds.spacing.sm },
  memberItem: { flexDirection: 'row', alignItems: 'center', gap: ds.spacing.md, padding: ds.spacing.md, backgroundColor: ds.colors.surface, borderRadius: ds.radius.md, borderWidth: 1, borderColor: ds.colors.border },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: ds.colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { ...ds.typography.textStyles.body, fontWeight: '700', color: ds.colors.primary },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.text },
  memberPhone: { ...ds.typography.textStyles.caption, color: ds.colors.textSecondary },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: ds.colors.brand.primaryLight, borderRadius: ds.radius.sm },
  adminBadgeText: { fontSize: 12, fontWeight: '600', color: ds.colors.primary },
  splitsList: { gap: ds.spacing.md },
  splitCard: { padding: ds.spacing.md, backgroundColor: ds.colors.surface, borderRadius: ds.radius.md, borderWidth: 1, borderColor: ds.colors.border, gap: ds.spacing.md },
  splitHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: ds.spacing.md },
  splitInfo: { flex: 1, gap: 4 },
  splitDescription: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.text },
  splitAmount: { ...ds.typography.textStyles.h3, color: ds.colors.text },
  splitBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: ds.colors.error, borderRadius: ds.radius.sm },
  splitBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  splitShares: { gap: ds.spacing.sm },
  shareItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: ds.spacing.sm, borderBottomWidth: 1, borderBottomColor: ds.colors.border },
  shareInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: ds.spacing.md },
  shareName: { ...ds.typography.textStyles.body, color: ds.colors.text },
  shareAmount: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.text },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paidText: { fontSize: 14, fontWeight: '600', color: ds.colors.success },
  unpaidBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: ds.colors.neutral.muted, borderRadius: ds.radius.sm },
  unpaidText: { fontSize: 12, fontWeight: '600', color: ds.colors.textSecondary },
  payButton: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: ds.colors.brand.primaryLight, borderRadius: ds.radius.sm },
  payButtonText: { fontSize: 14, fontWeight: '600', color: ds.colors.primary },
  remindButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: ds.spacing.sm, marginTop: ds.spacing.sm, borderTopWidth: 1, borderTopColor: ds.colors.border },
  remindButtonText: { fontSize: 14, fontWeight: '600', color: ds.colors.primary },
  leaveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ds.spacing.sm, margin: ds.spacing.smartpay.horizontalPadding, paddingVertical: ds.spacing.md, backgroundColor: ds.colors.surface, borderWidth: 1, borderColor: ds.colors.error, borderRadius: ds.radius.md },
  leaveButtonText: { ...ds.typography.textStyles.button, color: ds.colors.error },
});
