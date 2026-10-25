import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { complaintsAPI } from '../services/api';
import { colors, globalStyles, statusColors, severityColors } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';

const SAMPLE_IDS = ['CC-202504-000001', 'CC-202504-000002', 'CC-IN-9801'];

export default function TrackScreen({ navigation }) {
  const [id, setId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);

  const trackCase = async (overrideId) => {
    const searchId = (overrideId !== undefined ? overrideId : id).trim();
    if (!searchId) {
      Alert.alert('Identifier Required', 'Please enter a valid complaint tracking ID.');
      return;
    }
    if (overrideId !== undefined) setId(overrideId);

    setLoading(true);
    setComplaint(null);
    try {
      const { data } = await complaintsAPI.track(searchId);
      const res = data.data?.complaint || data.data;
      setComplaint(res);
    } catch (err) {
      console.log('Track error:', err.response?.data || err.message);
      Alert.alert('Docket Not Found', err.response?.data?.message || `No active case found matching ${searchId} in cloud database.`);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>TRACK INCIDENT DOSSIER</Text>
          <Text style={styles.headerSub}>PUBLIC TELEMETRY • NO LOGIN REQUIRED</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Search Console */}
        <View style={globalStyles.glassCard}>
          <Text style={globalStyles.label}>COMPLAINT IDENTIFIER / DOCKET ID</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
            Enter your tracking code or case ID to retrieve current investigation status and officer milestones.
          </Text>

          <TextInput
            style={[globalStyles.input, { fontFamily: 'monospace' }]}
            placeholder="e.g. CC-202504-000001"
            placeholderTextColor={colors.muted}
            value={id}
            onChangeText={setId}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => trackCase()}
          />

          <TouchableOpacity style={globalStyles.btnPrimary} onPress={() => trackCase()} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#030A14" />
            ) : (
              <Text style={globalStyles.btnPrimaryText}>🔍 RETRIEVE CASE STATUS</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Sample IDs */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>
              QUICK SAMPLE IDENTIFIERS:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SAMPLE_IDS.map(sample => (
                <TouchableOpacity key={sample} style={styles.sampleChip} onPress={() => trackCase(sample)}>
                  <Text style={styles.sampleChipText}>{sample}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Search Results Case Dossier */}
        {complaint && (
          <View style={{ marginTop: 10 }}>
            <Text style={globalStyles.sectionTitle}>📋 LIVE CASE DOSSIER</Text>

            <View style={globalStyles.glassCard}>
              <View style={globalStyles.spaceBetween}>
                <Text style={[globalStyles.mono, { color: colors.cyber, fontSize: 12, fontWeight: '800' }]}>
                  {complaint.complaintId}
                </Text>
                <View style={[globalStyles.badge, { backgroundColor: `${statusColors[complaint.status] || colors.cyber}20`, borderColor: statusColors[complaint.status] || colors.cyber, borderWidth: 1 }]}>
                  <Text style={{ color: statusColors[complaint.status] || colors.cyber, fontSize: 10, fontWeight: '900' }}>
                    {(complaint.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.caseTitle}>{complaint.title}</Text>
              <Text style={styles.caseCategory}>
                {(complaint.category || 'General').replace(/_/g, ' ').toUpperCase()} • {complaint.severity?.toUpperCase() || 'MEDIUM'} SEVERITY
              </Text>

              {/* Timeline Stepper */}
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
                <Text style={globalStyles.label}>INVESTIGATION MILESTONES</Text>

                {(complaint.timeline && complaint.timeline.length > 0 ? complaint.timeline : [
                  { status: 'pending', message: 'Incident registered in national database.', timestamp: complaint.createdAt },
                  { status: 'under_review', message: 'Assigned to Cyber Crime Cell for forensic verification.', timestamp: complaint.createdAt }
                ]).map((t, i) => {
                  const stepColor = statusColors[t.status] || colors.cyber;
                  return (
                    <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: `${stepColor}20`, borderWidth: 2, borderColor: stepColor, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10 }}>{t.status === 'resolved' ? '✓' : '●'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{t.message}</Text>
                        <Text style={{ color: colors.muted, fontSize: 10 }}>
                          {t.timestamp ? format(new Date(t.timestamp), 'dd MMM yyyy, hh:mm a') : 'Recent'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Detailed View Link */}
              <TouchableOpacity
                style={[globalStyles.btnOutline, { marginTop: 14 }]}
                onPress={() => navigation.navigate('ComplaintDetail', { complaintId: complaint._id || complaint.complaintId })}
              >
                <Text style={globalStyles.btnOutlineText}>Open Full Case File →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  sampleChip: {
    backgroundColor: 'rgba(0, 180, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sampleChipText: {
    color: colors.cyber,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  caseTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    lineHeight: 20,
  },
  caseCategory: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  }
});
