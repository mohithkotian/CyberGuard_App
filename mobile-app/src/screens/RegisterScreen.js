import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../hooks/useAuthStore';
import { colors, globalStyles } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
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
      Alert.alert('Registration Failed', err.message || 'Could not complete citizen registration.');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
            <Text style={styles.brandTitle}>CITIZEN ENROLLMENT</Text>
            <Text style={styles.brandSub}>JOIN NATIONAL CYBER DEFENSE NETWORK</Text>
          </View>

          <View style={globalStyles.glassCard}>
            <Field k="name" label="FULL CITIZEN NAME *" placeholder="e.g. Ramesh Kumar" />
            <Field k="email" label="OFFICIAL EMAIL ADDRESS *" placeholder="citizen@domain.com" keyboardType="email-address" autoCapitalize="none" />
            <Field k="phone" label="PHONE NUMBER (FOR OTP/ALERTS)" placeholder="+91 9800000000" keyboardType="phone-pad" />
            <Field k="password" label="MASTER PASSWORD (MIN 8 CHARS) *" placeholder="••••••••••••" secureTextEntry />
            <Field k="confirm" label="CONFIRM PASSWORD *" placeholder="••••••••••••" secureTextEntry />

            <TouchableOpacity 
              style={[globalStyles.btnPrimary, { marginTop: 8 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#030A14" />
              ) : (
                <Text style={globalStyles.btnPrimaryText}>CREATE SECURE ACCOUNT →</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')} 
            style={{ marginTop: 20, alignItems: 'center' }}
          >
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Already registered? <Text style={{ color: colors.accent, fontWeight: '800' }}>Access System</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSub: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  }
});
