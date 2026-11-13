import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../hooks/useAuthStore';
import { colors, globalStyles, typography } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';
import IconGlyph from '../components/IconGlyph';
import { getActiveApiUrl, setCustomApiUrl, testApiHealth } from '../services/api';

const DEMO_LOGINS = [
  { label: 'Officer', email: 'officer@cyberguard.gov', pass: 'Officer@123' },
  { label: 'Admin',   email: 'admin@cyberguard.gov',   pass: 'Admin@12345' },
  { label: 'Citizen', email: 'citizen@test.com',       pass: 'Citizen@123' },
];

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Server Endpoint State
  const [activeUrl, setActiveUrl] = useState('');
  const [configModal, setConfigModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [pingResult, setPingResult] = useState(null);
  const [testingPing, setTestingPing] = useState(false);

  useEffect(() => {
    loadUrl();
  }, []);

  const loadUrl = async () => {
    const url = await getActiveApiUrl();
    setActiveUrl(url);
    setInputUrl(url);
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    setPingResult(null);
    const res = await testApiHealth();
    setPingResult(res);
    setTestingPing(false);
  };

  const handleSaveUrl = async () => {
    await setCustomApiUrl(inputUrl);
    await loadUrl();
    setConfigModal(false);
    Alert.alert('Server Configured', `Backend API URL updated to:\n${inputUrl}`);
  };

  const handleLogin = async (overrideEmail, overridePass) => {
    const e = (overrideEmail || email).trim().toLowerCase();
    const p = overridePass || password;

    if (!e || !p) {
      Alert.alert('Missing Credentials', 'Please enter your email and password.');
      return;
    }

    try {
      await login(e, p);
    } catch (err) {
      const isTimeout = err.message.toLowerCase().includes('timeout') || err.message.toLowerCase().includes('network error');
      Alert.alert(
        'Sign In Failed',
        err.message || 'Invalid credentials or server connection error.',
        isTimeout ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Configure Server', onPress: () => setConfigModal(true) }
        ] : [{ text: 'OK' }]
      );
    }
  };

  const fillDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    handleLogin(demo.email, demo.pass);
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandIconWrap}>
              <IconGlyph name="shield" size={28} color={colors.accent} strokeWidth={2} />
            </View>
            <Text style={styles.brandTitle}>CyberGuard</Text>
            <Text style={styles.brandSub}>National Crime Reporting & Triage</Text>
          </View>

          {/* Server URL Status Pill */}
          <TouchableOpacity
            style={styles.serverPill}
            onPress={() => {
              handleTestPing();
              setConfigModal(true);
            }}
            activeOpacity={0.75}
            accessibilityLabel="Configure server URL"
          >
            <View style={[styles.statusDot, { backgroundColor: pingResult?.success ? colors.success : colors.accent }]} />
            <Text style={styles.serverPillText} numberOfLines={1}>
              {activeUrl.replace('http://', '').replace('https://', '')}
            </Text>
            <IconGlyph name="edit" size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Login Card */}
          <View style={globalStyles.card}>
            <Text style={styles.cardHeading}>Sign in to your account</Text>

            <View style={styles.fieldGroup}>
              <Text style={globalStyles.label}>Email address</Text>
              <TextInput
                style={[globalStyles.input, { marginBottom: 0 }]}
                placeholder="name@example.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={globalStyles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <IconGlyph name={showPassword ? 'eyeOff' : 'eye'} size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[globalStyles.btnPrimary, { marginTop: 6 }]}
              onPress={() => handleLogin()}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#070B12" />
              ) : (
                <>
                  <Text style={globalStyles.btnPrimaryText}>Sign In</Text>
                  <IconGlyph name="arrowRight" size={18} color="#070B12" strokeWidth={2.4} />
                </>
              )}
            </TouchableOpacity>

            {/* Demo Quick Logins */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Quick Demo Access</Text>
              <View style={styles.demoRow}>
                {DEMO_LOGINS.map((demo, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.demoChip}
                    onPress={() => fillDemo(demo)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.demoChipText}>{demo.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Footer Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.footerLink}
            activeOpacity={0.7}
          >
            <Text style={styles.footerText}>
              New to CyberGuard? <Text style={styles.footerTextAccent}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Server Config Modal */}
      <Modal visible={configModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Server Configuration</Text>
              <TouchableOpacity
                onPress={() => setConfigModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close server settings"
              >
                <IconGlyph name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              Enter the backend API URL (e.g. https://cybercrime-backend.onrender.com/api or http://192.168.1.X:5002/api).
            </Text>

            <TextInput
              style={[globalStyles.input, { fontFamily: typography.mono, fontSize: 13 }]}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.0.0.2:5002/api"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Ping Test Button */}
            <TouchableOpacity
              style={[globalStyles.btnSecondary, { marginBottom: 14 }]}
              onPress={handleTestPing}
              disabled={testingPing}
              activeOpacity={0.75}
            >
              {testingPing ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <>
                  <IconGlyph
                    name={pingResult ? (pingResult.success ? 'check' : 'warning') : 'activity'}
                    size={16}
                    color={pingResult ? (pingResult.success ? colors.success : colors.danger) : colors.accent}
                  />
                  <Text style={globalStyles.btnSecondaryText}>
                    {pingResult
                      ? (pingResult.success ? `Connected (${pingResult.latency}ms)` : `Failed: ${pingResult.error}`)
                      : 'Test Connection'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[globalStyles.btnSecondary, { flex: 1 }]}
                onPress={() => setConfigModal(false)}
                activeOpacity={0.75}
              >
                <Text style={globalStyles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.btnPrimary, { flex: 1 }]}
                onPress={handleSaveUrl}
                activeOpacity={0.8}
              >
                <Text style={globalStyles.btnPrimaryText}>Save URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(61, 245, 192, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61, 245, 192, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandSub: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
    maxWidth: '90%',
    minHeight: 36,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.mono,
    flexShrink: 1,
  },
  cardHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    minHeight: 48,
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  eyeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoSection: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  demoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  demoChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  footerLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerTextAccent: {
    color: colors.accent,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
});
