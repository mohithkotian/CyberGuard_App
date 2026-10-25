import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { complaintsAPI } from '../services/api';
import { colors, globalStyles } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';

const { width } = Dimensions.get('window');
const STEPS = ['Incident Details', 'Victim & Suspect', 'Evidence Dossier', 'Review & File'];

export default function SubmitComplaintScreen({ route, navigation }) {
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

  const validateStep = () => {
    if (step === 0) {
      if (!form.title || form.title.trim().length < 8) {
        Alert.alert('Validation Error', 'Title requires at least 8 characters describing the incident.');
        return false;
      }
      if (!form.description || form.description.trim().length < 30) {
        Alert.alert('Validation Error', 'Description requires at least 30 characters for AI classification.');
        return false;
      }
      if (!form.incidentDate) {
        Alert.alert('Validation Error', 'Incident date is mandatory.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
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
        'Complaint Lodged Successfully! 🛡️',
        `Incident Docket: ${newCase?.complaintId || 'Registered'}\nAI Category: ${(newCase?.category || 'General Fraud').replace(/_/g, ' ')}\nStatus: Pending Investigation`,
        [
          {
            text: 'View Case Dossier',
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
    <View style={{ marginBottom: 12 }}>
      <Text style={globalStyles.label}>{label}</Text>
      <TextInput
        style={globalStyles.input}
        placeholderTextColor={colors.muted}
        value={form[k]}
        onChangeText={v => setField(k, v)}
        {...props}
      />
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(s => s - 1) : navigation.goBack())} style={styles.backBtn}>
          <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>FILE CYBER INCIDENT</Text>
          <Text style={styles.headerSub}>STEP {step + 1} OF 4 • {STEPS[step].toUpperCase()}</Text>
        </View>
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepperContainer}>
        {STEPS.map((s, idx) => (
          <View key={idx} style={[styles.stepBar, idx <= step && styles.stepBarActive]} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          
          {/* STEP 0: INCIDENT DETAILS */}
          {step === 0 && (
            <View style={globalStyles.glassCard}>
              <Text style={globalStyles.sectionTitle}>1. INCIDENT DOSSIER</Text>
              
              <Field
                k="title"
                label="Complaint Title *"
                placeholder="e.g. Unauthorized UPI transfer after fake APK install"
              />

              <Text style={globalStyles.label}>Description of Incident * (min 30 chars)</Text>
              <TextInput
                style={[globalStyles.input, { height: 110, textAlignVertical: 'top' }]}
                placeholderTextColor={colors.muted}
                multiline
                placeholder="Detail what happened, timestamps, suspect interactions, apps installed, or payment requests..."
                value={form.description}
                onChangeText={v => setField('description', v)}
              />
              <Text style={{ color: form.description.length >= 30 ? colors.success : colors.muted, fontSize: 11, marginBottom: 12 }}>
                {form.description.length}/30 characters minimum
              </Text>

              <Field
                k="incidentDate"
                label="Incident Date (YYYY-MM-DD) *"
                placeholder="2026-08-04"
              />

              {/* Anonymous Checkbox */}
              <TouchableOpacity
                onPress={() => setField('isAnonymous', !form.isAnonymous)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}
              >
                <View style={[styles.checkbox, form.isAnonymous && styles.checkboxActive]}>
                  {form.isAnonymous && <Text style={{ color: '#030A14', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                </View>
                <Text style={{ color: colors.text, fontSize: 13 }}>File Anonymously (Hide identity on public feed)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 1: VICTIM & SUSPECT INFO */}
          {step === 1 && (
            <View style={globalStyles.glassCard}>
              <Text style={globalStyles.sectionTitle}>2. FINANCIAL & SUSPECT INTELLIGENCE</Text>
              
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

              <Text style={[globalStyles.sectionTitle, { marginTop: 12 }]}>🚨 SUSPECT IDENTIFIERS (OPTIONAL)</Text>

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
            <View style={globalStyles.glassCard}>
              <Text style={globalStyles.sectionTitle}>3. ATTACH EVIDENCE ARTIFACTS</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 14 }}>
                Attach screenshots of transactions, fraudulent SMS, call logs, emails, or APK files (Max 5 files).
              </Text>

              <TouchableOpacity onPress={pickFile} style={styles.uploadBox}>
                <Text style={{ fontSize: 32, marginBottom: 6 }}>📎</Text>
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '800' }}>TAP TO ATTACH EVIDENCE</Text>
                <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>
                  Images, PDF, TXT, Logs (Max 10MB per file)
                </Text>
              </TouchableOpacity>

              {files.map((f, i) => (
                <View key={i} style={styles.fileCard}>
                  <Text style={{ fontSize: 16 }}>📄</Text>
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <TouchableOpacity onPress={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={{ color: colors.danger, fontSize: 16, padding: 4 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {files.length === 0 && (
                <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
                  Evidence is optional but accelerates officer triage.
                </Text>
              )}
            </View>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {step === 3 && (
            <View style={globalStyles.glassCard}>
              <Text style={globalStyles.sectionTitle}>4. REVIEW INCIDENT DOSSIER</Text>

              {[
                ['TITLE', form.title],
                ['DATE', form.incidentDate],
                ['FINANCIAL LOSS', form.financialLoss ? `₹${Number(form.financialLoss).toLocaleString()}` : 'None Reported'],
                ['LOCATION', `${form.district}, ${form.state}`],
                ['ANONYMOUS', form.isAnonymous ? 'YES' : 'NO'],
                ['EVIDENCE', `${files.length} artifact(s) attached`],
                ['SUSPECT REF', form.suspectPhone || form.suspectEmail || form.suspectBank || 'Not provided'],
              ].map(([k, v]) => (
                <View key={k} style={styles.reviewRow}>
                  <Text style={styles.reviewKey}>{k}</Text>
                  <Text style={styles.reviewVal}>{v}</Text>
                </View>
              ))}

              <View style={styles.neuralBanner}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
                <Text style={{ color: colors.accent, fontSize: 11, flex: 1 }}>
                  Neural ML Engine will automatically compute threat severity and triage this incident in MongoDB Atlas.
                </Text>
              </View>
            </View>
          )}

          {/* Navigation Controls */}
          <View style={{ gap: 10, marginTop: 20 }}>
            {step < STEPS.length - 1 ? (
              <TouchableOpacity
                style={globalStyles.btnPrimary}
                onPress={() => validateStep() && setStep(s => s + 1)}
              >
                <Text style={globalStyles.btnPrimaryText}>CONTINUE TO {STEPS[step + 1].toUpperCase()} →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[globalStyles.btnPrimary, { backgroundColor: colors.accent }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#030A14" />
                ) : (
                  <Text style={globalStyles.btnPrimaryText}>🚀 SUBMIT INCIDENT TO CLOUD DB</Text>
                )}
              </TouchableOpacity>
            )}

            {step > 0 && (
              <TouchableOpacity style={globalStyles.btnOutline} onPress={() => setStep(s => s - 1)}>
                <Text style={globalStyles.btnOutlineText}>← Back to Previous Step</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 255, 209, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 209, 0.3)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerSub: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  stepBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  stepBarActive: {
    backgroundColor: colors.accent,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accent,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 180, 255, 0.35)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 180, 255, 0.04)',
    marginBottom: 10,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 50, 0.9)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.2)',
  },
  fileName: {
    color: colors.text,
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  reviewKey: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  reviewVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  neuralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 255, 209, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 209, 0.25)',
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
  }
});
