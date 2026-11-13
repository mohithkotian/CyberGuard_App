import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../hooks/useAuthStore';
import { colors, globalStyles, typography } from '../utils/theme';
import { getActiveApiUrl, setCustomApiUrl, resetApiUrl, checkApiHealth } from '../services/api';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuthStore();
  const [activeUrl, setActiveUrl] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [pingStatus, setPingStatus] = useState(null);
  const [testingPing, setTestingPing] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);

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
    Alert.alert('Role Switched', `Active role set to: ${newRole.toUpperCase()}`);
  };

  const handleConfirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of CyberGuard?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <CyberBackground />
      <ScreenHeader
        title="Profile & Settings"
        subtitle="Account and security settings"
        navigation={navigation}
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* User Identity Card */}
        <View style={globalStyles.card}>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <IconGlyph name="user" size={28} color={colors.accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name || 'Cyber Citizen'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'citizen@cyberguard.gov'}</Text>

              <View style={styles.badgeRow}>
                <View style={[globalStyles.badge, { backgroundColor: 'rgba(61, 245, 192, 0.12)', borderColor: colors.accent, borderWidth: 1 }]}>
                  <Text style={[styles.badgeText, { color: colors.accent }]}>
                    {(user?.role || 'citizen').toUpperCase()}
                  </Text>
                </View>
                <View style={[globalStyles.badge, { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: colors.neonBlue, borderWidth: 1 }]}>
                  <Text style={[styles.badgeText, { color: colors.neonBlue }]}>
                    VERIFIED CITIZEN
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Demo Role Switcher */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Role Preview (Demo)</Text>
          <Text style={styles.cardSub}>
            Switch roles to test citizen filing, officer triage command, or administrative oversight.
          </Text>

          <View style={styles.roleTabsRow}>
            {['citizen', 'officer', 'admin'].map(r => {
              const active = (user?.role || 'citizen') === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleTab, active && styles.roleTabActive]}
                  onPress={() => handleSwitchRole(r)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.roleTabText, active && styles.roleTabTextActive]}>
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Server & Connectivity Settings */}
        <View style={globalStyles.card}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowServerConfig(!showServerConfig)}
            activeOpacity={0.75}
          >
            <View style={{ flex: 1 }}>
              <Text style={globalStyles.sectionTitle}>Network & Server Diagnostics</Text>
              <Text style={styles.accordionSubtitle}>
                {activeUrl.replace('http://', '').replace('https://', '')}
              </Text>
            </View>
            <IconGlyph name={showServerConfig ? 'close' : 'edit'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverConfigBody}>
              <Text style={globalStyles.label}>Backend REST API Endpoint</Text>
              <TextInput
                style={[globalStyles.input, { fontFamily: typography.mono, fontSize: 13 }]}
                value={customInput}
                onChangeText={setCustomInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[globalStyles.btnPrimary, { flex: 1 }]}
                  onPress={handleSaveUrl}
                  activeOpacity={0.8}
                >
                  <Text style={globalStyles.btnPrimaryText}>Save Endpoint</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.btnOutline, { flex: 1 }]}
                  onPress={handleResetUrl}
                  activeOpacity={0.75}
                >
                  <Text style={globalStyles.btnOutlineText}>Auto-Detect</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[globalStyles.btnSecondary, { marginTop: 10 }]}
                onPress={handleTestPing}
                disabled={testingPing}
                activeOpacity={0.75}
              >
                {testingPing ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <>
                    <IconGlyph name="activity" size={16} color={colors.accent} />
                    <Text style={globalStyles.btnSecondaryText}>Test Latency</Text>
                  </>
                )}
              </TouchableOpacity>

              {pingStatus && (
                <View style={[
                  styles.pingResult,
                  { borderColor: pingStatus.ok ? colors.success : colors.danger }
                ]}>
                  <Text style={{ color: pingStatus.ok ? colors.success : colors.danger, fontSize: 13, fontWeight: '600' }}>
                    {pingStatus.ok ? `Connected (${pingStatus.latency}ms latency)` : `Error: ${pingStatus.error || 'Server Unreachable'}`}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Logout Action */}
        <TouchableOpacity
          style={[globalStyles.btnDanger, { marginTop: 6 }]}
          onPress={handleConfirmLogout}
          activeOpacity={0.8}
        >
          <IconGlyph name="logOut" size={18} color={colors.danger} strokeWidth={2.2} />
          <Text style={globalStyles.btnDangerText}>Sign Out of CyberGuard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(61, 245, 192, 0.1)',
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  roleTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  roleTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  roleTabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  roleTabTextActive: {
    color: '#070B12',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.mono,
    marginTop: 2,
  },
  serverConfigBody: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pingResult: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
});
