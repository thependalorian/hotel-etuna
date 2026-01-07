/**
 * CreateGroup Component
 * 
 * Location: components/groups/CreateGroup.tsx
 * Purpose: Form to create a new group
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface CreateGroupProps {
  onGroupCreated?: (data: { name: string; description?: string }) => void;
  onCancel?: () => void;
}

export default function CreateGroup({ onGroupCreated, onCancel }: CreateGroupProps) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    onGroupCreated?.({
      name: groupName.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <ScrollView style={defaultStyles.container} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Create Group</Text>
      <Text style={defaultStyles.descriptionText}>
        Create a group to save money together
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={defaultStyles.label}>Group Name</Text>
          <TextInput
            style={defaultStyles.input}
            placeholder="e.g., Vacation Fund"
            placeholderTextColor={Colors.textSecondary}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={30}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={defaultStyles.label}>Description (Optional)</Text>
          <TextInput
            style={[defaultStyles.input, styles.textArea]}
            placeholder="What is this group for?"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={100}
          />
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[defaultStyles.buttonOutline, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={defaultStyles.buttonOutlineText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={defaultStyles.pillButton} onPress={handleSubmit}>
            <Text style={defaultStyles.buttonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  form: {
    marginTop: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
});
