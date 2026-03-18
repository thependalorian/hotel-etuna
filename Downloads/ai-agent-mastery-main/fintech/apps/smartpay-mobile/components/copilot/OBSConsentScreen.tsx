/**
 * OBS 2025 §9.6.3: Full mandatory text consent screen for AIS/PISP.
 * Location: fintech/smartpay/components/copilot/OBSConsentScreen.tsx
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { OBS_MANDATORY_TEXT, OBS_SCOPES_PLAIN_LANGUAGE } from '@/constants/obsConsentText';
import { designSystem } from '@/constants/designSystem';

interface OBSConsentScreenProps {
  tppName: string;
  tppParticipantId: string;
  dataProviderName: string;
  schemeName: string;
  schemeUrl: string;
  scopes: string[];
  durationDays: number;
  onAccept: () => void;
  onDecline: () => void;
}

export function OBSConsentScreen({
  tppName,
  tppParticipantId,
  dataProviderName,
  schemeName,
  schemeUrl,
  scopes,
  durationDays,
  onAccept,
  onDecline,
}: OBSConsentScreenProps) {
  const expiryDate = new Date(Date.now() + durationDays * 86400000).toLocaleDateString('en-NA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>{OBS_MANDATORY_TEXT.schemeStatement(schemeName)}</Text>
      </View>

      <Text style={styles.body}>
        {OBS_MANDATORY_TEXT.tppParticipationStatement(tppName, tppParticipantId, schemeName)}
      </Text>

      <View style={styles.consentBox}>
        <Text style={styles.heading}>You are about to share:</Text>
        {scopes.map((scope) => (
          <View key={scope} style={styles.scopeRow}>
            <Text style={styles.scopeIcon}>✓</Text>
            <Text style={styles.scopeText}>{OBS_SCOPES_PLAIN_LANGUAGE[scope] ?? scope}</Text>
          </View>
        ))}
        <Text style={styles.duration}>
          With: <Text style={styles.bold}>{dataProviderName}</Text>
        </Text>
        <Text style={styles.duration}>
          Until: <Text style={styles.bold}>{expiryDate}</Text>
        </Text>
      </View>

      <View style={styles.scaNotice}>
        <Text style={styles.scaText}>🔒 {OBS_MANDATORY_TEXT.scaNotice()}</Text>
      </View>

      <Text style={styles.smallText}>{OBS_MANDATORY_TEXT.dataUseStatement()}</Text>
      <Text style={styles.smallText}>{OBS_MANDATORY_TEXT.consentRevokeNote()}</Text>

      <Text style={styles.link}>{OBS_MANDATORY_TEXT.schemeWebpageLink(schemeUrl)}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptText}>Continue to {dataProviderName}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designSystem.colors.neutral.background },
  content: { padding: 20, paddingBottom: 40 },
  notice: {
    backgroundColor: designSystem.colors.brand.primary + '15',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: designSystem.colors.brand.primary,
    marginBottom: 16,
  },
  noticeText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.brand.primary,
  },
  heading: { ...designSystem.typography.textStyles.h3, marginBottom: 12 },
  body: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.textSecondary,
    marginBottom: 12,
  },
  consentBox: {
    backgroundColor: designSystem.colors.neutral.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  scopeIcon: { color: '#22C55E', fontWeight: 'bold' },
  scopeText: { ...designSystem.typography.textStyles.body, flex: 1 },
  duration: { ...designSystem.typography.textStyles.body, marginTop: 8 },
  bold: { fontWeight: '700' },
  scaNotice: {
    backgroundColor: '#F59E0B15',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  scaText: { ...designSystem.typography.textStyles.body, color: '#92400E' },
  smallText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
    marginBottom: 8,
  },
  link: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.brand.primary,
    marginBottom: 24,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  declineButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: designSystem.colors.neutral.border,
    alignItems: 'center',
  },
  acceptButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: designSystem.colors.brand.primary,
    alignItems: 'center',
  },
  declineText: {
    ...designSystem.typography.textStyles.button,
    color: designSystem.colors.neutral.text,
  },
  acceptText: { ...designSystem.typography.textStyles.button, color: '#fff' },
});
