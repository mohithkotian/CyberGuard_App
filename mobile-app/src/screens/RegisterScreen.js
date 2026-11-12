import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../hooks/useAuthStore';
import { colors, globalStyles } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name.trim()) return Alert.alert('Validation Error', 'Full Name is required.');
    if (form.name.trim().length < 2) return Alert.alert('Validation Error', 'Name must be at least 2 characters.');
    if (!form.email.includes('@')) return Alert.alert('Validation Error', 'A valid email address is required.');
    if (form.password.length < 8) return Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
    if (form.password !== form.confirm) return Alert.alert('Validation Error', 'Passwords do not match.');

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Could not complete registration.');
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      <ScreenHeader
        title="Create Account"
        subtitle="Citizen enrollment"
        navigation={navigation}
        onBack={() => navigation.navigate('Login')}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={globalStyles.card}>
            <View style={styles.fieldGroup}>
              <Text style={globalStyles.label}>Full Name *</Text>
              <TextInput
                style={[globalStyles.input, { marginBottom: 0 }]}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={colors.muted}
                value={form.name}
                onChangeText={v => setField('name', v)}
                textContentType="name"
                autoComplete="name"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={globalStyles.label}>Email Address *</Text>
              <TextInput
                style={[globalStyles.input, { marginBottom: 0 }]}
                placeholder="citizen@domain.com"
                placeholderTextColor={colors.muted}
                value={form.email}
                onChangeText={v => setField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={globalStyles.label}>Phone Number (for alerts)</Text>
              <TextInput
                style={[globalStyles.input, { marginBottom: 0 }]}
                placeholder="+91 9800000000"
                placeholderTextColor={colors.muted}
                value={form.phone}
                onChangeText={v => setField('phone', v)}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={globalStyles.label}>Password (min 8 chars) *</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a strong password"
                  placeholderTextColor={colors.muted}
                  value={form.password}
                  onChangeText={v => setField('password', v)}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
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

            <View style={styles.fieldGroup}>
              <Text style={globalStyles.label}>Confirm Password *</Text>
              <TextInput
                style={[globalStyles.input, { marginBottom: 0 }]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.muted}
                value={form.confirm}
                onChangeText={v => setField('confirm', v)}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity
              style={[globalStyles.btnPrimary, { marginTop: 8 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#070B12" />
              ) : (
                <>
                  <Text style={globalStyles.btnPrimaryText}>Create Account</Text>
                  <IconGlyph name="arrowRight" size={18} color="#070B12" strokeWidth={2.4} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.footerLink}
            activeOpacity={0.7}
          >
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerTextAccent}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
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
  footerLink: {
    marginTop: 16,
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
});
