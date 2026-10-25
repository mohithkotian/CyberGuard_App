import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, globalStyles, statusColors, severityColors } from '../utils/theme';
import { lookupThreatClient } from '../data/threatIntel';
import { complaintsAPI } from '../services/api';
import CyberBackground from '../components/CyberBackground';

const { width } = Dimensions.get('window');

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
        if (data?.data?.complaints) {
          cloudMatches = data.data.complaints.map(c => ({
            complaintId: c.complaintId || c._id,
            category: c.category?.replace(/_/g, ' ') || 'Incident Report',
            severity: c.severity || 'high',
            riskLevel: c.severity === 'critical' ? 'critical' : 'high',
            identifier: q,
            type: 'CLOUD_CASE',
            details: c.description || c.title,
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

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Home')}
          style={styles.backBtn}
        >
          <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>SCAM & SUSPECT RADAR</Text>
          <Text style={styles.headerSub}>GLOBAL THREAT INTELLIGENCE LOOKUP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Search Console */}
        <View style={globalStyles.glassCard}>
          <Text style={globalStyles.label}>VERIFY IDENTIFIER</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
            Search suspect phone numbers, UPI handles, bank accounts, or suspicious phishing links against live threat records.
          </Text>

          <View style={styles.inputContainer}>
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
              <TouchableOpacity onPress={() => { setQuery(''); setSearched(false); setResults([]); }} style={styles.clearBtn}>
                <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[globalStyles.btnPrimary, { marginTop: 10 }]} 
            onPress={() => handleSearch()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#030A14" />
            ) : (
              <Text style={globalStyles.btnPrimaryText}>🔍 RUN THREAT SCAN</Text>
            )}
          </TouchableOpacity>

          {/* Quick Query Pills */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }}>
              DEMO THREAT SCENARIOS:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SAMPLE_QUERIES.map((sample, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.samplePill}
                  onPress={() => handleSearch(sample)}
                >
                  <Text style={styles.sampleText}>{sample}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Results Stream */}
        {searched && (
          <View style={{ marginTop: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={globalStyles.sectionTitle}>
                {results.length > 0 ? `🚨 THREAT SIGNALS FOUND (${results.length})` : '🛡️ VERIFICATION RESULT'}
              </Text>
            </View>

            {results.length === 0 ? (
              <View style={[globalStyles.glassCard, { alignItems: 'center', padding: 24, borderColor: 'rgba(0, 200, 150, 0.3)' }]}>
                <View style={[styles.statusIconCircle, { backgroundColor: 'rgba(0, 200, 150, 0.15)', borderColor: colors.success }]}>
                  <Text style={{ fontSize: 32 }}>✓</Text>
                </View>
                <Text style={{ color: colors.success, fontSize: 16, fontWeight: '900', letterSpacing: 1.5, marginTop: 12 }}>
                  CLEAN RECORD
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
                  No high-risk malicious records found for "{query}". Still exercise standard caution and never share OTPs or passwords.
                </Text>
                <TouchableOpacity 
                  style={[globalStyles.btnOutline, { marginTop: 16, width: '100%' }]}
                  onPress={() => navigation.navigate('Submit', { prefillSuspect: query })}
                >
                  <Text style={globalStyles.btnOutlineText}>Report If You Suspect Fraud →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              results.map((r, i) => {
                const isCrit = r.riskLevel === 'critical' || r.severity === 'critical';
                const badgeColor = isCrit ? colors.danger : colors.warn;
                return (
                  <View key={i} style={[globalStyles.glassCard, { borderColor: isCrit ? 'rgba(255, 59, 48, 0.4)' : 'rgba(255, 159, 28, 0.4)' }]}>
                    <View style={globalStyles.spaceBetween}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14 }}>{r.type === 'PHONE' ? '📞' : r.type === 'WEBSITE' ? '🌐' : '⚠️'}</Text>
                        <Text style={[globalStyles.mono, { color: colors.cyber, fontSize: 12, fontWeight: '700' }]}>
                          {r.complaintId}
                        </Text>
                      </View>
                      <View style={[globalStyles.badge, { backgroundColor: `${badgeColor}20`, borderColor: badgeColor, borderWidth: 1 }]}>
                        <Text style={{ color: badgeColor, fontSize: 10, fontWeight: '900' }}>
                          {(r.riskLevel || 'FLAGGED').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 10 }}>
                      {r.identifier}
                    </Text>

                    <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' }}>
                      {r.category}
                    </Text>

                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
                      {r.details}
                    </Text>

                    <View style={styles.cardFooter}>
                      <TouchableOpacity 
                        style={styles.actionPill}
                        onPress={() => navigation.navigate('Submit', { prefillSuspect: r.identifier, prefillCategory: r.category })}
                      >
                        <Text style={styles.actionPillText}>🚨 File Complaint With This Intel</Text>
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
    letterSpacing: 1.5,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 50, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  clearBtn: {
    padding: 6,
  },
  samplePill: {
    backgroundColor: 'rgba(0, 180, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sampleText: {
    color: colors.cyber,
    fontSize: 11,
    fontWeight: '700',
  },
  statusIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  actionPill: {
    backgroundColor: 'rgba(0, 255, 209, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 209, 0.3)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionPillText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
