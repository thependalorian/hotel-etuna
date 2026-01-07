/**
 * GroupView Component
 * 
 * Location: components/groups/GroupView.tsx
 * Purpose: Display group details and members
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  contribution: number;
}

interface GroupViewProps {
  groupId: string;
  groupName: string;
  totalAmount: number;
  members: GroupMember[];
  onAddMember?: () => void;
  onContribute?: () => void;
}

export default function GroupView({
  groupName,
  totalAmount,
  members,
  onAddMember,
  onContribute,
}: GroupViewProps) {
  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>{groupName}</Text>
      <Text style={styles.totalAmount}>N$ {totalAmount.toLocaleString()}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={defaultStyles.pillButton} onPress={onContribute}>
          <Text style={defaultStyles.buttonText}>Contribute</Text>
        </TouchableOpacity>
        <TouchableOpacity style={defaultStyles.buttonOutline} onPress={onAddMember}>
          <Text style={defaultStyles.buttonOutlineText}>Add Member</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
        {members.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={styles.memberAvatar}>
              <FontAwesome name="user" size={20} color={Colors.primary} />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberContribution}>
                Contributed: N$ {member.contribution.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  membersSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  memberContribution: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
