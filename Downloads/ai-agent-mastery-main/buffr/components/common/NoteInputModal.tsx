/**
 * Note Input Modal Component
 * 
 * Location: components/common/NoteInputModal.tsx
 * Purpose: Modal for entering payment notes/messages
 * 
 * Used in: Send Money flow, Payment screens
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import PillButton from './PillButton';

interface NoteInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  initialNote?: string;
  title?: string;
  placeholder?: string;
  maxLength?: number;
}

export default function NoteInputModal({
  visible,
  onClose,
  onSave,
  initialNote = '',
  title = 'Add Note',
  placeholder = 'Enter a note for this payment...',
  maxLength = 200,
}: NoteInputModalProps) {
  const [note, setNote] = useState(initialNote);

  // Reset note when modal opens/closes or initialNote changes
  useEffect(() => {
    if (visible) {
      setNote(initialNote);
    }
  }, [visible, initialNote]);

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  const handleCancel = () => {
    setNote(initialNote);
    onClose();
  };

  const characterCount = note.length;
  const isMaxLength = characterCount >= maxLength;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <FontAwesome name="times" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Note Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.noteInput,
                isMaxLength && styles.noteInputMaxLength,
              ]}
              placeholder={placeholder}
              placeholderTextColor={Colors.textSecondary}
              value={note}
              onChangeText={(text) => {
                if (text.length <= maxLength) {
                  setNote(text);
                }
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={maxLength}
              autoFocus
            />
            <View style={styles.characterCount}>
              <Text
                style={[
                  styles.characterCountText,
                  isMaxLength && styles.characterCountTextMax,
                ]}
              >
                {characterCount}/{maxLength}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <PillButton
              label="Cancel"
              variant="outline"
              onPress={handleCancel}
              style={styles.cancelButton}
            />
            <PillButton
              label="Save"
              variant="primary"
              onPress={handleSave}
              style={styles.saveButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  noteInput: {
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  noteInputMaxLength: {
    borderColor: Colors.error,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  characterCountTextMax: {
    color: Colors.error,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
