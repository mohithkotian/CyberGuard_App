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
  Dimensions, 
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../hooks/useAuthStore';
import { colors, globalStyles } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';
import { getActiveApiUrl, setCustomApiUrl, testApiHealth } from '../services/api';

const { width } = Dimensions.get('window');

const DEMO_LOGINS = [
  { label: '👮 Officer Demo', email: 'officer@cyberguard.gov', pass: 'Officer@123' },
  { label: '🛡️ Admin Demo',   email: 'admin@cyberguard.gov',   pass: 'Admin@12345' },
  { label: '👤 Citizen Demo', email: 'citizen@test.com',       pass: 'Citizen@123' },
];

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      Alert.alert('Missing Credentials', 'Please enter your email and security password.');
      return;
    }

    try {
      await login(e, p);
    } catch (err) {
      const isTimeout = err.message.toLowerCase().includes('timeout') || err.message.toLowerCase().includes('network error');
      Alert.alert(
        'Authentication Failed', 
        err.message || 'Invalid credentials or server connection error.',
        isTimeout ? [
          { text: 'Cancel', style: 'cancel' },
          { text: '⚙️ Configure Server URL', onPress: () => setConfigModal(true) }
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
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
          
          {/* Brand Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={styles.brandTitle}>CYBER GUARD</Text>
            <Text style={styles.brandSub}>NATIONAL CRIME REPORTING & TRIAGE</Text>
            <View style={styles.brandDivider} />
          </View>

          {/* Server URL Status Pill */}
          <TouchableOpacity 
            style={styles.serverPill}
            onPress={() => {
              handleTestPing();
              setConfigModal(true);
            }}
          >
            <View style={[styles.statusDot, { backgroundColor: pingResult?.success ? colors.success : colors.cyber }]} />
            <Text style={styles.serverPillText} numberOfLines={1}>
              API: {activeUrl.replace('http://', '').replace('https://', '')}
            </Text>
            <Text style={styles.serverPillEdit}>⚙️ EDIT</Text>
          </TouchableOpacity>

          {/* Login Card */}
          <View style={globalStyles.glassCard}>
            <Text style={[globalStyles.sectionTitle, { textAlign: 'center', marginBottom: 18 }]}>
              SECURE ENCRYPTED ACCESS
            </Text>
            
            <View style={{ marginBottom: 14 }}>
              <Text style={globalStyles.label}>IDENTITY / EMAIL</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="pruthvishetty04@gmail.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={{ marginBottom: 18 }}>
              <Text style={globalStyles.label}>SECURITY KEY / PASSWORD</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={globalStyles.btnPrimary} 
              onPress={() => handleLogin()} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#030A14" />
              ) : (
                <Text style={globalStyles.btnPrimaryText}>AUTHENTICATE & ACCESS →</Text>
              )}
            </TouchableOpacity>

            {/* Demo Quick Logins */}
            <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>
                ONE-TAP DEMO ACCESS:
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                {DEMO_LOGINS.map((demo, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.demoChip}
                    onPress={() => fillDemo(demo)}
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
            style={{ marginTop: 22, alignItems: 'center' }}
          >
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              New to CyberGuard? <Text style={{ color: colors.accent, fontWeight: '800' }}>Register Citizen Profile</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Server Config Modal */}
      <Modal visible={configModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚡ BACKEND SERVER CONFIG</Text>
            <Text style={styles.modalDesc}>
              When using Personal Hotspot or remote networks, enter your Mac IP or Tunnel URL (e.g. http://192.0.0.2:5002/api or https://xxxx.loca.lt/api):
            </Text>

            <TextInput
              style={[globalStyles.input, { marginBottom: 12 }]}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.0.0.2:5002/api"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Ping Test Button */}
            <TouchableOpacity 
              style={[globalStyles.btnSecondary, { marginBottom: 16 }]}
              onPress={handleTestPing}
              disabled={testingPing}
            >
              {testingPing ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={globalStyles.btnSecondaryText}>
                  {pingResult ? (pingResult.success ? `✅ Online (${pingResult.latency}ms)` : `❌ Failed (${pingResult.error})`) : '📡 TEST PING & LATENCY'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[globalStyles.btnSecondary, { flex: 1 }]}
                onPress={() => setConfigModal(false)}
              >
                <Text style={globalStyles.btnSecondaryText}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[globalStyles.btnPrimary, { flex: 1 }]}
                onPress={handleSaveUrl}
              >
                <Text style={globalStyles.btnPrimaryText}>SAVE URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandSub: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  brandDivider: {
    width: 44,
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginTop: 12,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 180, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    maxWidth: '90%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  serverPillText: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },
  serverPillEdit: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 8,
  },
  demoChip: {
    backgroundColor: 'rgba(0, 180, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  demoChipText: {
    color: colors.cyber,
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 10, 20, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.3)',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  modalDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  }
});
