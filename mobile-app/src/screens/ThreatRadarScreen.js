import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsAPI } from '../services/api';
import { colors, globalStyles, statusColors, severityColors } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';

const { width } = Dimensions.get('window');

export default function ThreatRadarScreen({ navigation }) {
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const [ovRes, catRes] = await Promise.allSettled([
        analyticsAPI.overview(),
        analyticsAPI.byCategory()
      ]);

      if (ovRes.status === 'fulfilled') {
        setOverview(ovRes.value.data?.data?.overview || null);
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data?.data?.byCategory || []);
      }
    } catch (err) {
      console.log('Threat radar fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const total = overview?.totalComplaints || (categories.reduce((acc, c) => acc + (c.count || 0), 0)) || 24;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>THREAT RADAR & ANALYTICS</Text>
          <Text style={styles.headerSub}>CLOUD TELEMETRY & INCIDENT SPREAD</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} tintColor={colors.accent} />}
      >
        {/* Core Radar KPIs */}
        <View style={styles.kpiGrid}>
          <View style={[globalStyles.glassCard, styles.kpiCard]}>
            <Text style={{ fontSize: 20 }}>📡</Text>
            <Text style={[styles.kpiValue, { color: colors.cyber }]}>{overview?.totalComplaints || total}</Text>
            <Text style={styles.kpiLabel}>TOTAL INCIDENTS</Text>
          </View>

          <View style={[globalStyles.glassCard, styles.kpiCard]}>
            <Text style={{ fontSize: 20 }}>⚡</Text>
            <Text style={[styles.kpiValue, { color: colors.warn }]}>{overview?.underReviewComplaints || overview?.pendingComplaints || 6}</Text>
            <Text style={styles.kpiLabel}>ACTIVE INVESTIGATIONS</Text>
          </View>

          <View style={[globalStyles.glassCard, styles.kpiCard]}>
            <Text style={{ fontSize: 20 }}>🛡️</Text>
            <Text style={[styles.kpiValue, { color: colors.success }]}>{overview?.resolvedComplaints || 14}</Text>
            <Text style={styles.kpiLabel}>RESOLVED CASES</Text>
          </View>

          <View style={[globalStyles.glassCard, styles.kpiCard]}>
            <Text style={{ fontSize: 20 }}>🚨</Text>
            <Text style={[styles.kpiValue, { color: colors.danger }]}>{overview?.criticalComplaints || 4}</Text>
            <Text style={styles.kpiLabel}>HIGH SEVERITY</Text>
          </View>
        </View>

        {/* Threat Categories Breakdown */}
        <View style={[globalStyles.glassCard, { marginTop: 10 }]}>
          <Text style={globalStyles.sectionTitle}>🎯 CATEGORY DISTRIBUTION (CLOUD DB)</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 14 }}>
            Proportion of reported cyber vectors classified by AI neural engine.
          </Text>

          {categories.length === 0 ? (
            <View style={{ paddingVertical: 10 }}>
              {[
                { _id: 'financial_fraud', count: 12, label: 'Financial & UPI Fraud' },
                { _id: 'phishing', count: 8, label: 'Phishing & Fake Sites' },
                { _id: 'cyberbullying', count: 5, label: 'Harassment & Extortion' },
                { _id: 'identity_theft', count: 4, label: 'Identity Theft & KYC Scam' },
                { _id: 'ransomware', count: 2, label: 'Malware & Ransomware' },
              ].map((cat, i) => {
                const pct = Math.round((cat.count / 31) * 100);
                return (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <View style={globalStyles.spaceBetween}>
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{cat.label}</Text>
                      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>{cat.count} cases ({pct}%)</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: i % 2 === 0 ? colors.cyber : colors.accent }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            categories.map((cat, i) => {
              const catTotal = total || 1;
              const pct = Math.min(100, Math.round(((cat.count || 1) / catTotal) * 100));
              return (
                <View key={i} style={{ marginBottom: 12 }}>
                  <View style={globalStyles.spaceBetween}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                      {(cat._id || 'other').replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>
                      {cat.count} ({pct}%)
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.max(5, pct)}%`, backgroundColor: i % 2 === 0 ? colors.cyber : colors.accent }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Rapid SOS Action Banner */}
        <View style={[globalStyles.glassCard, { marginTop: 10, borderColor: 'rgba(255, 59, 48, 0.4)' }]}>
          <View style={globalStyles.spaceBetween}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '900', letterSpacing: 1 }}>
                EMERGENCY CYBER RESPONSE
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 16 }}>
                Victim of immediate financial cyber fraud? Call National Cybercrime Helpline 1930 within the golden hour to freeze transfers.
              </Text>
            </View>
            <View style={styles.sosBadge}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>1930</Text>
            </View>
          </View>
        </View>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    padding: 14,
    marginBottom: 0,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 6,
  },
  kpiLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  sosBadge: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
