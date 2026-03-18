/**
 * CopilotChatSurface - Smartpay Agentic Copilot Chat UI
 * 
 * Design Specs (from SKILL.md):
 * - Bot messages: Left-aligned, bot avatar (32px), surface background
 * - User messages: Right-aligned, brand background, white text
 * - Message bubbles: 16px radius, max-width 85%
 * - Suggestion chips: 36px height, pill-shaped
 * - Input bar: 48px height, pill-shaped input
 * - Cards: Transaction, Map, Wallet Form embedded in messages
 * 
 * Location: components/copilot/CopilotChatSurface.tsx
 */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CopilotSuggestionChips } from './CopilotSuggestionChips';
import { CopilotConfirmationCard } from './CopilotConfirmationCard';
import { CopilotErrorState } from './CopilotErrorState';
import { useCopilotSuggestions, type SuggestionChip } from '@/contexts/copilot/useCopilotSuggestions';
import { useCopilotContext, type ChatMessage } from '@/contexts/copilot/CopilotContext';
import { useCopilotTools } from '@/hooks/useCopilotTools';
import { designSystem } from '@/constants/designSystem';

const COPILOT_API_URL = process.env.EXPO_PUBLIC_COPILOT_API_URL ?? '';
const ds = designSystem;

export function CopilotChatSurface() {
  const { pendingAction, setPendingAction, messages, appendMessage, setIsSending } = useCopilotContext();
  useCopilotTools();

  const suggestions = useCopilotSuggestions();
  const listRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      appendMessage(
        'assistant',
        "Hi! I'm your Smartpay assistant. How can I help you today?"
      );
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    setError(null);
    appendMessage('user', text);
    setIsLoading(true);
    setIsSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    if (!COPILOT_API_URL) {
      setTimeout(() => {
        appendMessage(
          'assistant',
          "I understand you want to: \"" + text + "\". Use the suggestion chips below to check balance, send money, cash out, or redeem vouchers. Connect EXPO_PUBLIC_COPILOT_API_URL for full AI capabilities."
        );
        setIsLoading(false);
        setIsSending(false);
      }, 800);
    } else {
      setIsLoading(false);
      setIsSending(false);
    }
  }, [input, isLoading, appendMessage, setIsSending]);

  const handleSuggestion = useCallback(
    async (chip: SuggestionChip) => {
      setError(null);
      setInput('');
      appendMessage('user', chip.prompt);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      
      if (!COPILOT_API_URL) {
        setTimeout(() => {
          appendMessage(
            'assistant',
            `I can help you with "${chip.label}". Connect the backend API to enable real-time wallet operations.`
          );
        }, 600);
      }
    },
    [appendMessage]
  );

  const renderBotAvatar = () => (
    <View style={styles.botAvatar}>
      <Ionicons name="chatbubbles" size={16} color={ds.colors.brand.primary} />
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      
      return (
        <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
          {!isUser && renderBotAvatar()}
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={isUser ? styles.userText : styles.assistantText}>
              {item.content}
            </Text>
            
            {/* Optional card rendering based on cardType */}
            {item.cardType && item.cardData && (
              <View style={styles.cardContainer}>
                {/* Cards would be rendered here based on cardType */}
                <Text style={styles.cardPlaceholder}>
                  [Card: {item.cardType}]
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    },
    []
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {error && <CopilotErrorState message={error} onRetry={() => setError(null)} />}
      {pendingAction && (
        <CopilotConfirmationCard
          title="Confirm action"
          rows={[{ label: 'Action', value: pendingAction.label }]}
          onConfirm={() => {
            pendingAction.resolve(true);
            setPendingAction(null);
          }}
          onCancel={() => {
            pendingAction.resolve(false);
            setPendingAction(null);
          }}
        />
      )}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={48} color={ds.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptyText}>
              Ask me about your balance, send money, find agents, or redeem vouchers.
            </Text>
          </View>
        }
      />
      <CopilotSuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={ds.colors.textPlaceholder}
            value={input}
            onChangeText={setInput}
            editable={!isLoading}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: ds.colors.background,
  },
  listContent: { 
    padding: ds.spacing[4],
    paddingBottom: ds.spacing[2],
    flexGrow: 1,
  },
  empty: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ds.spacing[8],
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ds.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ds.spacing[6],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ds.text,
    marginBottom: ds.spacing[2],
    textAlign: 'center',
  },
  emptyText: {
    ...ds.typography.textStyles.body,
    color: ds.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 21,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ds.spacing[3],
    gap: ds.spacing[2],
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.brand50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: { 
    maxWidth: '75%',
    padding: ds.spacing[3],
    borderRadius: 16,
  },
  userBubble: { 
    backgroundColor: ds.brand,
    borderBottomRightRadius: 4,
  },
  assistantBubble: { 
    backgroundColor: ds.surface,
    borderBottomLeftRadius: 4,
  },
  userText: { 
    ...ds.typography.textStyles.body,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  assistantText: { 
    ...ds.typography.textStyles.body,
    color: ds.text,
    lineHeight: 22,
  },
  cardContainer: {
    marginTop: ds.spacing[2],
    padding: ds.spacing[2],
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: ds.radius.sm,
  },
  cardPlaceholder: {
    fontSize: 12,
    color: ds.textSecondary,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    padding: ds.spacing[3],
    gap: ds.spacing[2],
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: ds.border,
    backgroundColor: ds.background,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: ds.surface,
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.border,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    ...ds.typography.textStyles.body,
    paddingHorizontal: ds.spacing[4],
    paddingVertical: ds.spacing[3],
    color: ds.text,
    minHeight: 48,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ds.brand,
    ...ds.shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: ds.border,
    opacity: 0.6,
  },
});
