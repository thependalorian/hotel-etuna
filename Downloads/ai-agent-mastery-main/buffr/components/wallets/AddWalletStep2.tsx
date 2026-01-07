/**
 * Add Wallet Step 2 Component
 * 
 * Location: components/wallets/AddWalletStep2.tsx
 * Purpose: Second step of wallet creation - Card design selection
 * 
 * Based on card design selection before wallet appears on home page
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import CardFrame from '@/components/cards/CardFrame';

// Available card frame designs (from Buffr Card Design folder)
const AVAILABLE_FRAMES = [2, 3, 6, 7, 8, 9, 12, 15, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

interface AddWalletStep2Props {
  walletName: string;
  selectedCardDesign: number;
  onCardDesignChange: (design: number) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function AddWalletStep2({
  walletName,
  selectedCardDesign,
  onCardDesignChange,
  onComplete,
  onBack,
}: AddWalletStep2Props) {
  const [localSelectedDesign, setLocalSelectedDesign] = useState(selectedCardDesign);

  const handleSelectDesign = (design: number) => {
    setLocalSelectedDesign(design);
    onCardDesignChange(design);
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Design</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <CardFrame
              frameNumber={localSelectedDesign}
              cardNumber="1234 5678 9012 3456"
              cardholderName={walletName.trim() || 'CARDHOLDER NAME'}
              expiryDate="12/25"
            />
          </View>
        </View>

        {/* Design Selection */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Choose Your Card Design</Text>
          <Text style={styles.sectionDescription}>
            Select a design that matches your style
          </Text>

          <FlatList
            data={AVAILABLE_FRAMES}
            numColumns={2}
            keyExtractor={(item) => item.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.designOption,
                  localSelectedDesign === item && styles.designOptionSelected,
                ]}
                onPress={() => handleSelectDesign(item)}
              >
                <CardFrame
                  frameNumber={item}
                  cardNumber="1234 5678 9012 3456"
                  cardholderName={walletName.trim() || 'CARDHOLDER'}
                  expiryDate="12/25"
                />
                {localSelectedDesign === item && (
                  <View style={styles.selectedBadge}>
                    <FontAwesome name="check-circle" size={24} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.designsList}
          />
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  previewSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  previewCard: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1.586, // Standard card ratio
  },
  selectionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  designsList: {
    gap: 16,
  },
  designOption: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    aspectRatio: 1.586,
  },
  designOptionSelected: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
});
