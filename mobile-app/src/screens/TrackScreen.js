import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { complaintsAPI } from '../services/api';
import { colors, globalStyles, statusColors, typography } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';

const SAMPLE_IDS = ['CMP-628504', 'CMP-888328', 'CMP-873967', 'CMP-299430'];

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
      Alert.alert('Case Not Found', err.response?.data?.message || `No active case found matching ${searchId}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <CyberBackground />
      <ScreenHeader
        title="Track Case"
        subtitle="Public status lookup"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Search Console */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.label}>Complaint Tracking ID</Text>
          <Text style={styles.helperText}>
            Enter your tracking code or case ID to check current investigation status and milestones.
          </Text>

          <TextInput
            style={[globalStyles.input, { fontFamily: typography.mono }]}
            placeholder="e.g. CC-202504-000001"
            placeholderTextColor={colors.muted}
            value={id}
            onChangeText={setId}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => trackCase()}
          />

          <TouchableOpacity
            style={globalStyles.btnPrimary}
            onPress={() => trackCase()}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#070B12" />
            ) : (
              <>
                <IconGlyph name="search" size={18} color="#070B12" strokeWidth={2.4} />
                <Text style={globalStyles.btnPrimaryText}>Check Case Status</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Quick Demo Sample IDs */}
          <View style={styles.samplesSection}>
            <Text style={styles.samplesLabel}>Sample Case IDs</Text>
            <View style={styles.samplesRow}>
              {SAMPLE_IDS.map(sample => (
                <TouchableOpacity
                  key={sample}
                  style={styles.sampleChip}
                  onPress={() => trackCase(sample)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.sampleChipText}>{sample}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Search Results Case Dossier */}
        {complaint && (
          <View style={{ marginTop: 8 }}>
            <Text style={globalStyles.sectionTitle}>Case Dossier</Text>

            <View style={globalStyles.card}>
              <View style={globalStyles.spaceBetween}>
                <Text style={[globalStyles.mono, styles.caseId]}>
                  {complaint.complaintId}
                </Text>
                <View style={[globalStyles.badge, {
                  backgroundColor: `${statusColors[complaint.status] || colors.accent}18`,
                  borderColor: `${statusColors[complaint.status] || colors.accent}45`,
                  borderWidth: 1,
                }]}>
                  <Text style={[styles.badgeText, { color: statusColors[complaint.status] || colors.accent }]}>
                    {(complaint.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.caseTitle}>{complaint.title}</Text>
              <Text style={styles.caseCategory}>
                {(complaint.category || 'General').replace(/_/g, ' ')} • {complaint.severity || 'Medium'} severity
              </Text>

              {/* Timeline Stepper */}
              <View style={styles.timelineSection}>
                <Text style={[globalStyles.label, { marginBottom: 14 }]}>Investigation Milestones</Text>

                {(complaint.timeline && complaint.timeline.length > 0 ? complaint.timeline : [
                  { status: 'pending', message: 'Incident registered in national database.', timestamp: complaint.createdAt },
                  { status: 'under_review', message: 'Assigned to Cyber Crime Cell for forensic verification.', timestamp: complaint.createdAt }
                ]).map((t, i) => {
                  const stepColor = statusColors[t.status] || colors.accent;
                  const isResolved = t.status === 'resolved';
                  return (
                    <View key={i} style={styles.timelineRow}>
                      <View style={[styles.timelineDot, { backgroundColor: `${stepColor}18`, borderColor: stepColor }]}>
                        <IconGlyph name={isResolved ? 'check' : 'clock'} size={13} color={stepColor} strokeWidth={2.4} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.timelineMessage}>{t.message}</Text>
                        <Text style={styles.timelineDate}>
                          {t.timestamp ? format(new Date(t.timestamp), 'dd MMM yyyy, hh:mm a') : 'Recent'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Detailed View Link */}
              <TouchableOpacity
                style={[globalStyles.btnOutline, { marginTop: 12 }]}
                onPress={() => navigation.navigate('ComplaintDetail', { complaintId: complaint._id || complaint.complaintId })}
                activeOpacity={0.75}
              >
                <Text style={globalStyles.btnOutlineText}>Open Full Case File</Text>
                <IconGlyph name="arrowRight" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  samplesSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  samplesLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  samplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleChip: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleChipText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.mono,
  },
  caseId: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  caseTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    lineHeight: 23,
  },
  caseCategory: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  timelineSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineMessage: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  timelineDate: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
