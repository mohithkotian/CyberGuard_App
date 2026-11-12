import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, globalStyles, typography } from '../utils/theme';
import { lookupThreatClient } from '../data/threatIntel';
import { complaintsAPI } from '../services/api';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';

const SAMPLE_QUERIES = [
  '+91 98000 00001',
  'fast.loan.approval@paytm',
  'icicibank.com',
  '4099-8821-3310',
  '@Crypto_Wealth_Signals_VIP'
];

export default function ScamSearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async (overrideQuery) => {
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    if (!q) {
      Alert.alert('Search Required', 'Please enter a phone number, UPI ID, domain, or bank account to verify.');
      return;
    }
    if (overrideQuery !== undefined) setQuery(overrideQuery);

    setLoading(true);
    setSearched(true);
    try {
      // 1. Client-Side Threat Intelligence Database
      const localMatches = lookupThreatClient(q);

      // 2. Cloud Database Public Search (MongoDB Atlas)
      let cloudMatches = [];
      try {
        const { data } = await complaintsAPI.publicSearch(q);
        const rawList = data?.data?.results || data?.data?.complaints || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          cloudMatches = rawList.map(c => ({
            complaintId: c.complaintId || c._id,
            category: c.category?.replace(/_/g, ' ') || 'Incident Report',
            severity: c.severity || 'high',
            riskLevel: c.severity === 'critical' ? 'critical' : 'high',
            identifier: q,
            type: 'CLOUD_CASE',
            details: c.description || c.title || c.suspectInfo?.upiId || c.suspectInfo?.phone || 'Verified Threat Indicator',
            status: c.status || 'INVESTIGATING',
            createdAt: c.createdAt
          }));
        }
      } catch (cloudErr) {
        console.log('Public search fallback query:', cloudErr.message);
      }

      // Combine matches
      const combined = [...localMatches, ...cloudMatches];
      setResults(combined);
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Search Error', 'Unable to complete threat search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'PHONE':
        return 'phone';
      case 'WEBSITE':
      case 'DOMAIN':
        return 'globe';
      default:
        return 'warning';
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <CyberBackground />
      <ScreenHeader
        title="Scam & Suspect Radar"
        subtitle="Threat intelligence database lookup"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Search Console */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.label}>Verify Identifier</Text>
          <Text style={styles.cardSub}>
            Search suspect phone numbers, UPI handles, bank accounts, or suspicious links against verified threat intelligence records.
          </Text>

          <View style={styles.inputContainer}>
            <IconGlyph name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. 9800000001, paytm@upi, fake-bank.com"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => { setQuery(''); setSearched(false); setResults([]); }}
                style={styles.clearBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconGlyph name="close" size={16} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[globalStyles.btnPrimary, { marginTop: 12 }]}
            onPress={() => handleSearch()}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#070B12" />
            ) : (
              <>
                <IconGlyph name="search" size={18} color="#070B12" strokeWidth={2.4} />
                <Text style={globalStyles.btnPrimaryText}>Run Threat Scan</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Quick Query Pills */}
          <View style={styles.sampleSection}>
            <Text style={styles.sampleHeader}>DEMO THREAT SCENARIOS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleScroll}>
              {SAMPLE_QUERIES.map((sample, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.samplePill}
                  onPress={() => handleSearch(sample)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.sampleText}>{sample}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Results Stream */}
        {searched && (
          <View style={{ marginTop: 12 }}>
            <Text style={globalStyles.sectionTitle}>
              {results.length > 0 ? `Threat Signals Detected (${results.length})` : 'Verification Result'}
            </Text>

            {results.length === 0 ? (
              <View style={[globalStyles.card, styles.cleanRecordCard]}>
                <View style={styles.cleanIconWrap}>
                  <IconGlyph name="check" size={28} color={colors.success} strokeWidth={2.4} />
                </View>
                <Text style={styles.cleanTitle}>Clean Record</Text>
                <Text style={styles.cleanDesc}>
                  No active malicious reports or blacklist records found for "{query}". Standard vigilance is still recommended — never disclose OTPs or passwords.
                </Text>
                <TouchableOpacity
                  style={[globalStyles.btnOutline, { marginTop: 18, width: '100%' }]}
                  onPress={() => navigation.navigate('Submit', { prefillSuspect: query })}
                  activeOpacity={0.75}
                >
                  <IconGlyph name="report" size={16} color={colors.text} />
                  <Text style={globalStyles.btnOutlineText}>Report If You Suspect Fraud</Text>
                </TouchableOpacity>
              </View>
            ) : (
              results.map((r, i) => {
                const isCrit = r.riskLevel === 'critical' || r.severity === 'critical';
                const badgeColor = isCrit ? colors.danger : colors.warn;
                return (
                  <View key={i} style={[globalStyles.card, { borderColor: isCrit ? 'rgba(248, 113, 113, 0.4)' : 'rgba(251, 191, 36, 0.4)' }]}>
                    <View style={globalStyles.spaceBetween}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <IconGlyph name={getResultIcon(r.type)} size={16} color={badgeColor} />
                        <Text style={[globalStyles.mono, styles.resultDocket]}>
                          {r.complaintId}
                        </Text>
                      </View>
                      <View style={[globalStyles.badge, { backgroundColor: `${badgeColor}18`, borderColor: `${badgeColor}40`, borderWidth: 1 }]}>
                        <Text style={[styles.badgeText, { color: badgeColor }]}>
                          {(r.riskLevel || 'FLAGGED').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.resultIdentifier}>
                      {r.identifier}
                    </Text>

                    <Text style={styles.resultCategory}>
                      {r.category}
                    </Text>

                    <Text style={styles.resultDetails}>
                      {r.details}
                    </Text>

                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Submit', { prefillSuspect: r.identifier, prefillCategory: r.category })}
                        activeOpacity={0.8}
                      >
                        <IconGlyph name="report" size={15} color={colors.accent} strokeWidth={2.2} />
                        <Text style={styles.actionBtnText}>File Complaint With This Intel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
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
  cardSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  clearBtn: {
    padding: 4,
  },
  sampleSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  sampleHeader: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sampleScroll: {
    gap: 8,
  },
  samplePill: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.mono,
  },
  cleanRecordCard: {
    alignItems: 'center',
    padding: 24,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  cleanIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cleanTitle: {
    color: colors.success,
    fontSize: 17,
    fontWeight: '700',
  },
  cleanDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  resultDocket: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resultIdentifier: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  resultCategory: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  resultDetails: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  cardFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  actionBtn: {
    backgroundColor: 'rgba(61, 245, 192, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(61, 245, 192, 0.3)',
    borderRadius: 8,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
