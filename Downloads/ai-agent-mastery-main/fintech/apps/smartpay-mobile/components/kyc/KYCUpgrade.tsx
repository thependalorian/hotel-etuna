// =====================================================
// MOBILE UI FLOWS FOR KYC UPGRADE
// React Native Implementation
// Compliant with Bank of Namibia PSN 2025 Table 4
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Camera } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// =====================================================
// 1. KYC UPGRADE PROMPT (Triggered on Limit Exceeded)
// =====================================================

interface KYCUpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentTier: 'LITE' | 'FULL';
  walletType: 'INDIVIDUAL' | 'BUSINESS';
  reason: 'LIMIT_EXCEEDED' | 'PROACTIVE';
  limitDetails?: {
    currentLimit: number;
    attemptedAmount: number;
  };
}

export const KYCUpgradePrompt: React.FC<KYCUpgradePromptProps> = ({
  visible,
  onClose,
  onUpgrade,
  currentTier,
  walletType,
  reason,
  limitDetails
}) => {
  
  const benefits = walletType === 'INDIVIDUAL' ? [
    { icon: '💰', text: 'Increase daily limit to N$20,000' },
    { icon: '📊', text: 'Hold up to N$50,000 in your wallet' },
    { icon: '⚡', text: 'Access premium features' },
    { icon: '🚀', text: 'Faster transaction processing' }
  ] : [
    { icon: '💼', text: 'Increase daily limit to N$50,000' },
    { icon: '📈', text: 'Hold up to N$100,000 in your wallet' },
    { icon: '👥', text: 'Accept larger payments' },
    { icon: '📊', text: 'Access business analytics' }
  ];
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {reason === 'LIMIT_EXCEEDED' ? '⚠️ Transaction Limit Reached' : '🎯 Upgrade Your Account'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          {/* Limit Details (if exceeded) */}
          {reason === 'LIMIT_EXCEEDED' && limitDetails && (
            <View style={styles.limitAlert}>
              <Text style={styles.limitAlertText}>
                You tried to send N${limitDetails.attemptedAmount.toFixed(2)}, but your current limit is N${limitDetails.currentLimit.toFixed(2)}.
              </Text>
            </View>
          )}
          
          {/* Current Status */}
          <View style={styles.currentStatus}>
            <Text style={styles.currentStatusLabel}>Current Tier</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{currentTier} KYC</Text>
            </View>
          </View>
          
          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Upgrade to Full KYC and unlock:</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>
          
          {/* Requirements */}
          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>Required Documents:</Text>
            <Text style={styles.requirementText}>• National ID or Passport</Text>
            <Text style={styles.requirementText}>• Proof of Residence (utility bill, bank statement)</Text>
            <Text style={styles.requirementText}>• Selfie with ID</Text>
            {walletType === 'BUSINESS' && (
              <Text style={styles.requirementText}>• Business Registration Certificate</Text>
            )}
          </View>
          
          {/* Time Estimate */}
          <View style={styles.timeEstimate}>
            <Text style={styles.timeEstimateText}>⏱️ Verification usually takes 24-48 hours</Text>
          </View>
          
          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// =====================================================
// 2. KYC UPGRADE FLOW (Step-by-Step Form)
// =====================================================

interface KYCUpgradeFlowProps {
  onComplete: () => void;
  onCancel: () => void;
  walletType: 'INDIVIDUAL' | 'BUSINESS';
}

export const KYCUpgradeFlow: React.FC<KYCUpgradeFlowProps> = ({
  onComplete,
  onCancel,
  walletType
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data (PSN 2025 Table 4 - Full KYC requirements)
  const [formData, setFormData] = useState({
    // Basic info (already have from Lite KYC)
    fullName: '',
    nationality: '',
    nationalIdNumber: '',
    passportNumber: '',
    
    // Full KYC additional fields
    residentialAddress: '',
    telephoneNumber: '',
    mobileNumber: '',
    contactEmail: '',
    
    // Business-specific
    isBusiness: walletType === 'BUSINESS',
    companyRegistrationNumber: '',
    natureOfBusiness: '',
    businessLocation: '',
    
    // Documents
    idDocumentFront: null as any,
    idDocumentBack: null as any,
    proofOfResidence: null as any,
    selfieWithId: null as any,
    businessCertificate: null as any
  });
  
  const totalSteps = walletType === 'BUSINESS' ? 4 : 3;
  
  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Step 1: Submit personal information
      const kycResponse = await fetch('/api/v1/kyc/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          national_id_number: formData.nationalIdNumber,
          passport_number: formData.passportNumber,
          residential_address: formData.residentialAddress,
          telephone_number: formData.telephoneNumber,
          mobile_number: formData.mobileNumber,
          contact_email: formData.contactEmail,
          is_business: formData.isBusiness,
          company_registration_number: formData.companyRegistrationNumber,
          nature_of_business: formData.natureOfBusiness,
          business_location: formData.businessLocation
        })
      });
      
      if (!kycResponse.ok) {
        throw new Error('Failed to submit KYC application');
      }
      
      const kycData = await kycResponse.json();
      
      // Step 2: Upload documents
      const formDataUpload = new FormData();
      formDataUpload.append('kyc_id', kycData.kyc_application.id);
      
      if (formData.idDocumentFront) {
        formDataUpload.append('id_document_front', {
          uri: formData.idDocumentFront.uri,
          type: 'image/jpeg',
          name: 'id_front.jpg'
        } as any);
      }
      
      if (formData.idDocumentBack) {
        formDataUpload.append('id_document_back', {
          uri: formData.idDocumentBack.uri,
          type: 'image/jpeg',
          name: 'id_back.jpg'
        } as any);
      }
      
      if (formData.proofOfResidence) {
        formDataUpload.append('proof_of_residence', {
          uri: formData.proofOfResidence.uri,
          type: formData.proofOfResidence.type,
          name: formData.proofOfResidence.name
        } as any);
      }
      
      if (formData.selfieWithId) {
        formDataUpload.append('selfie_with_id', {
          uri: formData.selfieWithId.uri,
          type: 'image/jpeg',
          name: 'selfie.jpg'
        } as any);
      }
      
      if (formData.businessCertificate && walletType === 'BUSINESS') {
        formDataUpload.append('business_certificate', {
          uri: formData.businessCertificate.uri,
          type: formData.businessCertificate.type,
          name: formData.businessCertificate.name
        } as any);
      }
      
      const uploadResponse = await fetch('/api/v1/kyc/upload-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: formDataUpload
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload documents');
      }
      
      Alert.alert(
        'Success!',
        'Your KYC upgrade application has been submitted. You will be notified within 24-48 hours.',
        [{ text: 'OK', onPress: onComplete }]
      );
      
    } catch (error) {
      console.error('Error submitting KYC:', error);
      Alert.alert('Error', 'Failed to submit KYC application. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressStep,
              index + 1 <= step && styles.progressStepActive
            ]}
          />
        ))}
      </View>
      
      <ScrollView style={styles.formContainer}>
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Step1PersonalInfo
            formData={formData}
            setFormData={setFormData}
          />
        )}
        
        {/* Step 2: Contact & Address */}
        {step === 2 && (
          <Step2ContactAddress
            formData={formData}
            setFormData={setFormData}
          />
        )}
        
        {/* Step 3: Document Upload */}
        {step === 3 && (
          <Step3Documents
            formData={formData}
            setFormData={setFormData}
            walletType={walletType}
          />
        )}
        
        {/* Step 4: Business Information (if applicable) */}
        {step === 4 && walletType === 'BUSINESS' && (
          <Step4BusinessInfo
            formData={formData}
            setFormData={setFormData}
          />
        )}
      </ScrollView>
      
      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.nextButton, step === 1 && styles.nextButtonFull]} 
          onPress={nextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === totalSteps ? 'Submit' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

// =====================================================
// 3. FORM STEPS COMPONENTS
// =====================================================

const Step1PersonalInfo: React.FC<any> = ({ formData, setFormData }) => (
  <View style={styles.stepContainer}>
    <Text style={styles.stepTitle}>Personal Information</Text>
    <Text style={styles.stepDescription}>
      Please provide your identification details as per PSN 2025 requirements.
    </Text>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Full Name *</Text>
      <input
        style={styles.textInput}
        value={formData.fullName}
        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
        placeholder="Enter your full name"
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Nationality *</Text>
      <input
        style={styles.textInput}
        value={formData.nationality}
        onChangeText={(text) => setFormData({ ...formData, nationality: text })}
        placeholder="e.g., Namibian"
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>National ID Number</Text>
      <input
        style={styles.textInput}
        value={formData.nationalIdNumber}
        onChangeText={(text) => setFormData({ ...formData, nationalIdNumber: text })}
        placeholder="13-digit ID number"
        keyboardType="numeric"
        maxLength={13}
      />
    </View>
    
    <Text style={styles.orText}>OR</Text>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Passport Number</Text>
      <input
        style={styles.textInput}
        value={formData.passportNumber}
        onChangeText={(text) => setFormData({ ...formData, passportNumber: text })}
        placeholder="Passport number"
      />
    </View>
  </View>
);

const Step2ContactAddress: React.FC<any> = ({ formData, setFormData }) => (
  <View style={styles.stepContainer}>
    <Text style={styles.stepTitle}>Contact & Address</Text>
    <Text style={styles.stepDescription}>
      This information is required for Full KYC verification (PSN 2025 Table 4).
    </Text>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Residential Address *</Text>
      <input
        style={[styles.textInput, styles.textArea]}
        value={formData.residentialAddress}
        onChangeText={(text) => setFormData({ ...formData, residentialAddress: text })}
        placeholder="Street address, city, region"
        multiline
        numberOfLines={3}
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Mobile Number *</Text>
      <input
        style={styles.textInput}
        value={formData.mobileNumber}
        onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
        placeholder="+264 81 123 4567"
        keyboardType="phone-pad"
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Telephone Number</Text>
      <input
        style={styles.textInput}
        value={formData.telephoneNumber}
        onChangeText={(text) => setFormData({ ...formData, telephoneNumber: text })}
        placeholder="+264 61 123 456"
        keyboardType="phone-pad"
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Email Address *</Text>
      <input
        style={styles.textInput}
        value={formData.contactEmail}
        onChangeText={(text) => setFormData({ ...formData, contactEmail: text })}
        placeholder="your@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </View>
  </View>
);

const Step3Documents: React.FC<any> = ({ formData, setFormData, walletType }) => {
  const pickDocument = async (documentType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        setFormData({ ...formData, [documentType]: result });
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };
  
  const takeSelfie = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    
    if (status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });
      
      if (!result.canceled) {
        setFormData({ ...formData, selfieWithId: result.assets[0] });
      }
    } else {
      Alert.alert('Permission Required', 'Camera permission is required to take a selfie.');
    }
  };
  
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      <Text style={styles.stepDescription}>
        Please upload clear, readable copies of the following documents:
      </Text>
      
      <DocumentUploadCard
        title="National ID/Passport (Front)"
        required
        document={formData.idDocumentFront}
        onUpload={() => pickDocument('idDocumentFront')}
      />
      
      <DocumentUploadCard
        title="National ID (Back)"
        required={false}
        document={formData.idDocumentBack}
        onUpload={() => pickDocument('idDocumentBack')}
      />
      
      <DocumentUploadCard
        title="Proof of Residence"
        subtitle="Utility bill, bank statement, or lease (dated within 3 months)"
        required
        document={formData.proofOfResidence}
        onUpload={() => pickDocument('proofOfResidence')}
      />
      
      <DocumentUploadCard
        title="Selfie with ID"
        subtitle="Take a selfie holding your ID"
        required
        document={formData.selfieWithId}
        onUpload={takeSelfie}
        isSelfie
      />
      
      {walletType === 'BUSINESS' && (
        <DocumentUploadCard
          title="Business Registration Certificate"
          required
          document={formData.businessCertificate}
          onUpload={() => pickDocument('businessCertificate')}
        />
      )}
      
      <View style={styles.documentTips}>
        <Text style={styles.documentTipsTitle}>📌 Tips for best results:</Text>
        <Text style={styles.documentTipsText}>• Ensure good lighting</Text>
        <Text style={styles.documentTipsText}>• Avoid glare and shadows</Text>
        <Text style={styles.documentTipsText}>• Make sure all text is readable</Text>
        <Text style={styles.documentTipsText}>• Use original documents (not photocopies)</Text>
      </View>
    </View>
  );
};

const Step4BusinessInfo: React.FC<any> = ({ formData, setFormData }) => (
  <View style={styles.stepContainer}>
    <Text style={styles.stepTitle}>Business Information</Text>
    <Text style={styles.stepDescription}>
      Additional details required for business accounts (PSN 2025 Table 4).
    </Text>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Company Registration Number *</Text>
      <input
        style={styles.textInput}
        value={formData.companyRegistrationNumber}
        onChangeText={(text) => setFormData({ ...formData, companyRegistrationNumber: text })}
        placeholder="Company registration number"
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Nature of Business *</Text>
      <input
        style={[styles.textInput, styles.textArea]}
        value={formData.natureOfBusiness}
        onChangeText={(text) => setFormData({ ...formData, natureOfBusiness: text })}
        placeholder="Describe your business activities"
        multiline
        numberOfLines={3}
      />
    </View>
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Business Location *</Text>
      <input
        style={styles.textInput}
        value={formData.businessLocation}
        onChangeText={(text) => setFormData({ ...formData, businessLocation: text })}
        placeholder="Physical address of business"
      />
    </View>
  </View>
);

// =====================================================
// 4. DOCUMENT UPLOAD CARD COMPONENT
// =====================================================

interface DocumentUploadCardProps {
  title: string;
  subtitle?: string;
  required: boolean;
  document: any;
  onUpload: () => void;
  isSelfie?: boolean;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  subtitle,
  required,
  document,
  onUpload,
  isSelfie = false
}) => (
  <View style={styles.documentCard}>
    <View style={styles.documentCardHeader}>
      <View>
        <Text style={styles.documentCardTitle}>
          {title} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        {subtitle && <Text style={styles.documentCardSubtitle}>{subtitle}</Text>}
      </View>
      {document && <Text style={styles.documentCardCheck}>✓</Text>}
    </View>
    
    <TouchableOpacity style={styles.uploadButton} onPress={onUpload}>
      <Text style={styles.uploadButtonText}>
        {document ? 'Replace' : (isSelfie ? '📸 Take Selfie' : '📁 Upload')}
      </Text>
    </TouchableOpacity>
    
    {document && (
      <Text style={styles.documentName} numberOfLines={1}>
        {document.name || 'Selfie captured'}
      </Text>
    )}
  </View>
);

// =====================================================
// 5. KYC STATUS SCREEN
// =====================================================

export const KYCStatusScreen: React.FC = () => {
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchKYCStatus();
  }, []);
  
  const fetchKYCStatus = async () => {
    try {
      const response = await fetch('/api/v1/kyc/status', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      const data = await response.json();
      setKycStatus(data);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>KYC Verification Status</Text>
      </View>
      
      {/* Current Tier */}
      <View style={styles.tierCard}>
        <Text style={styles.tierCardLabel}>Current Tier</Text>
        <View style={[styles.tierBadge, styles.tierBadgeLarge]}>
          <Text style={styles.tierBadgeTextLarge}>{kycStatus.current_tier} KYC</Text>
        </View>
        <Text style={styles.tierCardStatus}>Status: {kycStatus.kyc_status}</Text>
      </View>
      
      {/* Current Limits */}
      <View style={styles.limitsCard}>
        <Text style={styles.limitsCardTitle}>Your Transaction Limits</Text>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Single Transaction</Text>
          <Text style={styles.limitValue}>N${kycStatus.current_limits.max_single_transaction}</Text>
        </View>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Daily Limit</Text>
          <Text style={styles.limitValue}>N${kycStatus.current_limits.max_daily_transaction}</Text>
        </View>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Monthly Balance</Text>
          <Text style={styles.limitValue}>N${kycStatus.current_limits.max_monthly_balance}</Text>
        </View>
      </View>
      
      {/* Upgrade Section */}
      {kycStatus.can_upgrade && (
        <View style={styles.upgradeSection}>
          <Text style={styles.upgradeSectionTitle}>Want Higher Limits?</Text>
          <Text style={styles.upgradeSectionText}>
            Upgrade to Full KYC to unlock:
          </Text>
          {kycStatus.upgrade_benefits && (
            <View style={styles.upgradeStats}>
              <View style={styles.upgradeStat}>
                <Text style={styles.upgradeStatValue}>
                  {kycStatus.upgrade_benefits.limits.max_daily_transaction}
                </Text>
                <Text style={styles.upgradeStatLabel}>Daily Limit</Text>
              </View>
              <View style={styles.upgradeStat}>
                <Text style={styles.upgradeStatValue}>
                  {kycStatus.upgrade_benefits.limits.max_monthly_balance}
                </Text>
                <Text style={styles.upgradeStatLabel}>Monthly Balance</Text>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.upgradeActionButton}>
            <Text style={styles.upgradeActionButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function getAuthToken(): Promise<string> {
  // TODO: Implement token retrieval from secure storage
  return 'mock-token';
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 4
  },
  closeButtonText: {
    fontSize: 32,
    color: '#999'
  },
  limitAlert: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  limitAlertText: {
    color: '#856404',
    fontSize: 14
  },
  currentStatus: {
    marginBottom: 20
  },
  currentStatusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  tierBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  tierBadgeText: {
    color: '#0066CC',
    fontWeight: '600',
    fontSize: 14
  },
  benefitsSection: {
    marginBottom: 20
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    flex: 1
  },
  requirementsSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4
  },
  timeEstimate: {
    alignItems: 'center',
    marginBottom: 20
  },
  timeEstimateText: {
    fontSize: 13,
    color: '#666'
  },
  modalActions: {
    gap: 12
  },
  upgradeButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  laterButton: {
    padding: 16,
    alignItems: 'center'
  },
  laterButtonText: {
    color: '#666',
    fontSize: 14
  },
  
  // Form Styles
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  progressBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2
  },
  progressStepActive: {
    backgroundColor: '#0066CC'
  },
  formContainer: {
    flex: 1,
    padding: 16
  },
  stepContainer: {
    flex: 1
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333'
  } as any,
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  orText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 12,
    fontSize: 14
  },
  documentCard: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  documentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  documentCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  requiredStar: {
    color: '#FF0000'
  },
  documentCardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  documentCardCheck: {
    fontSize: 24,
    color: '#4CAF50'
  },
  uploadButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  uploadButtonText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '600'
  },
  documentName: {
    fontSize: 12,
    color: '#666',
    marginTop: 8
  },
  documentTips: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 8
  },
  documentTipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  documentTipsText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center'
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  nextButtonFull: {
    flex: 1
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14
  },
  
  // Status Screen Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusHeader: {
    padding: 16
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  tierCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center'
  },
  tierCardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  tierBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  tierBadgeTextLarge: {
    fontSize: 20,
    color: '#0066CC',
    fontWeight: 'bold'
  },
  tierCardStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 8
  },
  limitsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD'
  },
  limitsCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333'
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  limitLabel: {
    fontSize: 14,
    color: '#666'
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  upgradeSection: {
    margin: 16,
    padding: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 12
  },
  upgradeSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0066CC'
  },
  upgradeSectionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  upgradeStats: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16
  },
  upgradeStat: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  upgradeStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4
  },
  upgradeStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  upgradeActionButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  upgradeActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default { KYCUpgradePrompt, KYCUpgradeFlow, KYCStatusScreen };
