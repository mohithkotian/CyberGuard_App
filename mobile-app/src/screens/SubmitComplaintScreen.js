import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { complaintsAPI } from '../services/api';
import { colors, globalStyles } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';
import useAuthStore from '../hooks/useAuthStore';

const STEPS = ['Incident Details', 'Suspect Info', 'Evidence', 'Review & File'];

export default function SubmitComplaintScreen({ route, navigation }) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    incidentDate: new Date().toISOString().split('T')[0],
    financialLoss: '',
    lossType: 'direct_debit',
    state: 'Maharashtra',
    district: 'Mumbai',
    suspectEmail: '',
    suspectPhone: '',
    suspectBank: '',
    isAnonymous: false,
  });

  useEffect(() => {
    if (route?.params) {
      const { prefillTitle, prefillDescription, prefillSuspect } = route.params;
      setForm(prev => ({
        ...prev,
        title: prefillTitle || prev.title,
        description: prefillDescription || prev.description,
        suspectPhone: prefillSuspect || prev.suspectPhone,
      }));
    }
  }, [route?.params]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pickFile = async () => {
    if (files.length >= 5) {
      Alert.alert('Upload Limit', 'A maximum of 5 evidence files is permitted.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setFiles(prev => [...prev, result.assets[0]]);
      }
    } catch (err) {
      Alert.alert('Picker Error', 'Could not open file selector.');
    }
  };

  const validateStep = (currentStep = step) => {
    if (currentStep === 0) {
      if (!form.title || form.title.trim().length < 8) {
        Alert.alert('Validation Error', 'Title requires at least 8 characters describing the incident.');
        return false;
      }
      if (!form.description || form.description.trim().length < 30) {
        Alert.alert('Validation Error', 'Description requires at least 30 characters for AI classification.');
        return false;
      }
      if (!form.incidentDate) {
        Alert.alert('Validation Error', 'Incident date is mandatory (YYYY-MM-DD).');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (step < STEPS.length - 1) {
      if (validateStep(step)) {
        setStep(s => s + 1);
      }
      return;
    }

    if (!form.title || form.title.trim().length < 8) {
      Alert.alert('Validation Error', 'Title requires at least 8 characters describing the incident.');
      setStep(0);
      return;
    }
    if (!form.description || form.description.trim().length < 30) {
      Alert.alert('Validation Error', 'Description requires at least 30 characters for AI classification.');
      setStep(0);
      return;
    }
    if (!form.incidentDate) {
      Alert.alert('Validation Error', 'Incident date is mandatory.');
      setStep(0);
      return;
    }

    if (!user) {
      Alert.alert(
        'Authentication Required',
        'To officially lodge a cybercrime incident and receive a trackable Case Docket ID, please sign in with your account or use 1-tap demo credentials.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In Now', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('source', 'mobile_app');
      fd.append('isAnonymous', String(form.isAnonymous));
      fd.append('victimDetails', JSON.stringify({
        financialLoss: parseFloat(form.financialLoss) || 0,
        lossType: form.lossType || 'none',
        incidentDate: form.incidentDate,
      }));
      fd.append('suspectInfo', JSON.stringify({
        email: form.suspectEmail || '',
        phone: form.suspectPhone || '',
        bankDetails: form.suspectBank || '',
      }));
      fd.append('location', JSON.stringify({
        state: form.state || 'Maharashtra',
        district: form.district || 'Mumbai',
      }));

      files.forEach((f, index) => {
        fd.append('evidence', {
          uri: f.uri,
          name: f.name || `evidence_${index}.jpg`,
          type: f.mimeType || 'application/octet-stream',
        });
      });

      const { data } = await complaintsAPI.create(fd);
      const newCase = data.data?.complaint || data.data;

      Alert.alert(
        'Complaint Lodged Successfully',
        `Incident Docket: ${newCase?.complaintId || 'Registered'}\nCategory: ${(newCase?.category || 'General Fraud').replace(/_/g, ' ')}\nStatus: Pending Investigation`,
        [
          {
            text: 'View Case File',
            onPress: () => navigation.navigate('ComplaintDetail', { complaintId: newCase?._id || newCase?.complaintId }),
          },
          {
            text: 'Back to Home',
            onPress: () => navigation.navigate('Home'),
          }
        ]
      );
    } catch (err) {
      console.error('Submission error:', err.response?.data || err.message);
      Alert.alert('Submission Failed', err.response?.data?.message || 'Could not submit complaint. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ k, label, ...props }) => (
    <View style={styles.fieldGroup}>
      <Text style={globalStyles.label}>{label}</Text>
      <TextInput
        style={[globalStyles.input, { marginBottom: 0 }]}
        placeholderTextColor={colors.muted}
        value={form[k]}
        onChangeText={v => setField(k, v)}
        {...props}
      />
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <CyberBackground />
      <ScreenHeader
        title="File Cyber Incident"
        subtitle={`Step ${step + 1} of 4: ${STEPS[step]}`}
        navigation={navigation}
        onBack={() => (step > 0 ? setStep(s => s - 1) : navigation.goBack())}
      />

      {/* Account Filing Status Banner */}
      <View style={{
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 8,
        backgroundColor: user ? 'rgba(61, 245, 192, 0.08)' : 'rgba(251, 191, 36, 0.1)',
        borderWidth: 1,
        borderColor: user ? 'rgba(61, 245, 192, 0.3)' : 'rgba(251, 191, 36, 0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <IconGlyph name={user ? "check" : "warning"} size={14} color={user ? colors.accent : colors.warn} />
          <Text style={{ fontSize: 12, color: colors.text, flex: 1 }} numberOfLines={1}>
            {user ? `Filing as ${user.name} (${user.email})` : 'Guest Mode — Sign in to link case to ledger'}
          </Text>
        </View>
        {!user && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepperContainer}>
        {STEPS.map((s, idx) => (
          <View key={idx} style={[styles.stepBar, idx <= step && styles.stepBarActive]} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* STEP 0: INCIDENT DETAILS */}
          {step === 0 && (
            <View style={globalStyles.card}>
              <Text style={styles.cardTitle}>1. Incident Details</Text>

              <Field
                k="title"
                label="Complaint Title *"
                placeholder="e.g. Unauthorized UPI transfer after fake APK install"
              />

              <View style={styles.fieldGroup}>
                <Text style={globalStyles.label}>Description of Incident * (min 30 characters)</Text>
                <TextInput
                  style={[globalStyles.input, styles.textArea]}
                  placeholderTextColor={colors.muted}
                  multiline
                  placeholder="Detail what happened, timestamps, suspect interactions, apps installed, or payment requests..."
                  value={form.description}
                  onChangeText={v => setField('description', v)}
                />
                <Text style={[styles.charCount, { color: form.description.length >= 30 ? colors.success : colors.muted }]}>
                  {form.description.length}/30 characters minimum
                </Text>
              </View>

              <Field
                k="incidentDate"
                label="Incident Date (YYYY-MM-DD) *"
                placeholder="2026-08-04"
              />

              {/* Anonymous Toggle Row */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.switchLabel}>File Anonymously</Text>
                  <Text style={styles.switchSub}>Hide your personal identity on public incident feeds</Text>
                </View>
                <Switch
                  value={form.isAnonymous}
                  onValueChange={v => setField('isAnonymous', v)}
                  trackColor={{ false: colors.surfaceElevated, true: colors.accent }}
                  thumbColor={form.isAnonymous ? '#070B12' : colors.textSecondary}
                />
              </View>
            </View>
          )}

          {/* STEP 1: FINANCIAL & SUSPECT INFO */}
          {step === 1 && (
            <View style={globalStyles.card}>
              <Text style={styles.cardTitle}>2. Financial & Suspect Info</Text>

              <Field
                k="financialLoss"
                label="Estimated Financial Loss (₹ INR)"
                placeholder="0"
                keyboardType="numeric"
              />

              <Field
                k="state"
                label="State / Province"
                placeholder="Maharashtra"
              />

              <Field
                k="district"
                label="District / City"
                placeholder="Mumbai"
              />

              <Text style={[styles.cardTitle, { marginTop: 12 }]}>Suspect Identifiers (Optional)</Text>

              <Field
                k="suspectPhone"
                label="Suspect Phone / Caller ID"
                placeholder="e.g. +91 9800000001"
                keyboardType="phone-pad"
              />

              <Field
                k="suspectEmail"
                label="Suspect Email / Social Handle"
                placeholder="e.g. scammer@fakebank.com"
                autoCapitalize="none"
              />

              <Field
                k="suspectBank"
                label="Suspect UPI / Bank Account / URL"
                placeholder="e.g. fraud@paytm or phishing link"
                autoCapitalize="none"
              />
            </View>
          )}

          {/* STEP 2: EVIDENCE UPLOAD */}
          {step === 2 && (
            <View style={globalStyles.card}>
              <Text style={styles.cardTitle}>3. Attach Evidence</Text>
              <Text style={styles.cardSub}>
                Attach screenshots of transactions, fraudulent SMS, call logs, emails, or APK files (Max 5 files).
              </Text>

              <TouchableOpacity onPress={pickFile} style={styles.uploadBox} activeOpacity={0.8}>
                <View style={styles.uploadIconWrap}>
                  <IconGlyph name="upload" size={28} color={colors.accent} />
                </View>
                <Text style={styles.uploadTitle}>Tap to Attach Evidence</Text>
                <Text style={styles.uploadSub}>Images, PDF, TXT, Logs (Max 10MB per file)</Text>
              </TouchableOpacity>

              {files.map((f, i) => (
                <View key={i} style={styles.fileCard}>
                  <IconGlyph name="file" size={18} color={colors.accent} />
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <TouchableOpacity
                    onPress={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    style={styles.fileRemoveBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Remove file"
                  >
                    <IconGlyph name="close" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              {files.length === 0 && (
                <Text style={styles.emptyEvidenceNote}>
                  Evidence is optional but accelerates officer triage.
                </Text>
              )}
            </View>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {step === 3 && (
            <View style={globalStyles.card}>
              <Text style={styles.cardTitle}>4. Review Incident Details</Text>

              {[
                ['Title', form.title],
                ['Date', form.incidentDate],
                ['Financial Loss', form.financialLoss ? `₹${Number(form.financialLoss).toLocaleString()}` : 'None Reported'],
                ['Location', `${form.district}, ${form.state}`],
                ['Anonymous', form.isAnonymous ? 'Yes' : 'No'],
                ['Evidence', `${files.length} artifact(s) attached`],
                ['Suspect Ref', form.suspectPhone || form.suspectEmail || form.suspectBank || 'Not provided'],
              ].map(([k, v]) => (
                <View key={k} style={styles.reviewRow}>
                  <Text style={styles.reviewKey}>{k}</Text>
                  <Text style={styles.reviewVal}>{v}</Text>
                </View>
              ))}

              <View style={styles.neuralBanner}>
                <IconGlyph name="shield" size={20} color={colors.accent} />
                <Text style={styles.neuralBannerText}>
                  AI classification engine will automatically determine threat severity and triage this incident for investigating officers.
                </Text>
              </View>
            </View>
          )}

          {/* Navigation Controls */}
          <View style={styles.controlsRow}>
            {step < STEPS.length - 1 ? (
              <TouchableOpacity
                style={globalStyles.btnPrimary}
                onPress={() => validateStep() && setStep(s => s + 1)}
                activeOpacity={0.8}
              >
                <Text style={globalStyles.btnPrimaryText}>Continue to {STEPS[step + 1]}</Text>
                <IconGlyph name="arrowRight" size={18} color="#070B12" strokeWidth={2.4} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={globalStyles.btnPrimary}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#070B12" />
                ) : (
                  <>
                    <IconGlyph name="check" size={18} color="#070B12" strokeWidth={2.4} />
                    <Text style={globalStyles.btnPrimaryText}>Submit Incident Report</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {step > 0 && (
              <TouchableOpacity
                style={[globalStyles.btnOutline, { marginTop: 10 }]}
                onPress={() => setStep(s => s - 1)}
                activeOpacity={0.75}
              >
                <IconGlyph name="arrowLeft" size={16} color={colors.text} />
                <Text style={globalStyles.btnOutlineText}>Back to Previous Step</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },
  stepBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 2,
  },
  stepBarActive: {
    backgroundColor: colors.accent,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 19,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    marginBottom: 12,
  },
  uploadIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(61, 245, 192, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
  },
  fileName: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
  },
  fileRemoveBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEvidenceNote: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewKey: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  reviewVal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  neuralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(61, 245, 192, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(61, 245, 192, 0.25)',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  neuralBannerText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  controlsRow: {
    marginTop: 16,
  },
});
