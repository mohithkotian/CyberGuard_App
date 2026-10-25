import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../hooks/useAuthStore';
import { colors, globalStyles } from '../utils/theme';
import { getActiveApiUrl, setCustomApiUrl, resetApiUrl, checkApiHealth } from '../services/api';
import CyberBackground from '../components/CyberBackground';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuthStore();
  const [activeUrl, setActiveUrl] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [pingStatus, setPingStatus] = useState(null);
  const [testingPing, setTestingPing] = useState(false);

  useEffect(() => {
    loadNetworkInfo();
  }, []);

  const loadNetworkInfo = async () => {
    const url = await getActiveApiUrl();
    setActiveUrl(url);
    setCustomInput(url);
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    setPingStatus(null);
    try {
      const res = await checkApiHealth();
      setPingStatus(res);
    } catch (err) {
      setPingStatus({ ok: false, error: err.message });
    } finally {
      setTestingPing(false);
    }
  };

  const handleSaveUrl = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid URL', 'Please enter a valid backend API URL.');
      return;
    }
    await setCustomApiUrl(trimmed);
    await loadNetworkInfo();
    Alert.alert('URL Updated', 'Active backend endpoint updated. Running latency test...');
    handleTestPing();
  };

  const handleResetUrl = async () => {
    await resetApiUrl();
    await loadNetworkInfo();
    Alert.alert('Reset Complete', 'Restored automatic endpoint discovery.');
    handleTestPing();
  };

  const handleSwitchRole = (newRole) => {
    if (!user) return;
    updateUser({ ...user, role: newRole });
    Alert.alert('Role Switched', `Active user profile set to: ${newRole.toUpperCase()}`);
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>USER PROFILE & NETWORK</Text>
          <Text style={styles.headerSub}>SECURITY CREDENTIALS & UPLINK CONFIG</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* User Identity Card */}
        <View style={globalStyles.glassCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={styles.avatarCircle}>
              <Text style={{ fontSize: 24 }}>🛡️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>
                {user?.name || 'Cyber Citizen'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                {user?.email || 'citizen@cyberguard.gov'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <View style={[globalStyles.badge, { backgroundColor: 'rgba(0, 255, 209, 0.15)', borderColor: colors.accent, borderWidth: 1 }]}>
                  <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900' }}>
                    {(user?.role || 'citizen').toUpperCase()}
                  </Text>
                </View>
                <View style={[globalStyles.badge, { backgroundColor: 'rgba(0, 180, 255, 0.15)', borderColor: colors.cyber, borderWidth: 1 }]}>
                  <Text style={{ color: colors.cyber, fontSize: 9, fontWeight: '900' }}>
                    LEVEL 4 CLEARANCE
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Demo Role Switcher */}
        <View style={globalStyles.glassCard}>
          <Text style={globalStyles.sectionTitle}>⚡ QUICK ROLE TESTER (DEMO)</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 10 }}>
            Switch roles to preview citizen filing, officer triage command, or full system admin privileges.
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['citizen', 'officer', 'admin'].map(r => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleTab,
                  (user?.role || 'citizen') === r && styles.roleTabActive
                ]}
                onPress={() => handleSwitchRole(r)}
              >
                <Text style={[
                  styles.roleTabText,
                  (user?.role || 'citizen') === r && styles.roleTabTextActive
                ]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Network & Cloud Uplink Manager */}
        <View style={globalStyles.glassCard}>
          <Text style={globalStyles.sectionTitle}>🌐 CLOUD BACKEND CONNECTIVITY</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 10 }}>
            Configure the REST API endpoint for physical devices or Expo Go tunnels.
          </Text>

          <Text style={globalStyles.label}>ACTIVE ENDPOINT URL</Text>
          <TextInput
            style={[globalStyles.input, { fontFamily: 'monospace', fontSize: 11 }]}
            value={customInput}
            onChangeText={setCustomInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity style={[globalStyles.btnPrimary, { flex: 1, paddingVertical: 10 }]} onPress={handleSaveUrl}>
              <Text style={[globalStyles.btnPrimaryText, { fontSize: 11 }]}>SAVE URL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.btnOutline, { flex: 1, paddingVertical: 10 }]} onPress={handleResetUrl}>
              <Text style={[globalStyles.btnOutlineText, { fontSize: 11 }]}>AUTO-DETECT</Text>
            </TouchableOpacity>
          </View>

          {/* Latency Tester */}
          <TouchableOpacity 
            style={[styles.pingBtn, { marginTop: 12 }]} 
            onPress={handleTestPing} 
            disabled={testingPing}
          >
            {testingPing ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Text style={styles.pingBtnText}>📡 TEST UPLINK LATENCY</Text>
            )}
          </TouchableOpacity>

          {pingStatus && (
            <View style={[
              styles.pingResult, 
              { borderColor: pingStatus.ok ? colors.success : colors.danger }
            ]}>
              <Text style={{ color: pingStatus.ok ? colors.success : colors.danger, fontSize: 11, fontWeight: '800' }}>
                {pingStatus.ok ? `✓ CONNECTED (${pingStatus.latency}ms latency)` : `✕ ERROR: ${pingStatus.error || 'Server Unreachable'}`}
              </Text>
            </View>
          )}
        </View>

        {/* Session Actions */}
        <TouchableOpacity style={[globalStyles.btnDanger, { marginTop: 10 }]} onPress={logout}>
          <Text style={globalStyles.btnDangerText}>TERMINATE SESSION & LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>
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
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 255, 209, 0.15)',
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 180, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.25)',
    alignItems: 'center',
  },
  roleTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  roleTabText: {
    color: colors.cyber,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  roleTabTextActive: {
    color: '#030A14',
  },
  pingBtn: {
    backgroundColor: 'rgba(0, 180, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.3)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingBtnText: {
    color: colors.cyber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pingResult: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
  }
});
