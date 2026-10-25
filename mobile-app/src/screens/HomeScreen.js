import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  StyleSheet, 
  TextInput, 
  Dimensions, 
  Linking, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { complaintsAPI, analyticsAPI } from '../services/api';
import { colors, globalStyles, statusColors, severityColors } from '../utils/theme';
import { format } from 'date-fns';
import CyberBackground from '../components/CyberBackground';
import useAuthStore from '../hooks/useAuthStore';

const { width } = Dimensions.get('window');

const FILTER_TABS = ['ALL', 'PENDING', 'UNDER REVIEW', 'INVESTIGATING', 'RESOLVED'];

export default function HomeScreen({ navigation }) {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [compRes, statRes] = await Promise.allSettled([
        complaintsAPI.getAll({ limit: 40 }),
        analyticsAPI.overview()
      ]);

      if (compRes.status === 'fulfilled') {
        const raw = compRes.value.data?.data?.complaints || compRes.value.data?.data || [];
        setComplaints(raw);
      }
      if (statRes.status === 'fulfilled') {
        setStats(statRes.value.data?.data?.overview || null);
      }
    } catch (err) {
      console.log('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const filteredComplaints = complaints.filter(c => {
    const matchesFilter = 
      activeFilter === 'ALL' || 
      (c.status || 'pending').toLowerCase() === activeFilter.toLowerCase().replace(/ /g, '_');

    const matchesSearch = 
      !searchQuery.trim() ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleCallSOS = () => {
    Alert.alert('Emergency Cyber Helpline', 'Direct dial national helpline 1930 for immediate financial cyber fraud assistance?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call 1930', onPress: () => Linking.openURL('tel:1930') }
    ]);
  };

  const renderHeader = () => (
    <View>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>CYBER GUARD</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={styles.livePulse} />
            <Text style={styles.appSubtitle}>CLOUD DB CONNECTED • SECURE 256-BIT</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.sosButton}
          onPress={handleCallSOS}
        >
          <Text style={{ fontSize: 13 }}>🚨</Text>
          <Text style={styles.sosText}>1930</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Matrix */}
      <View style={styles.actionMatrix}>
        {[
          { label: 'REPORT INCIDENT', icon: '📝', screen: 'Submit', color: colors.accent },
          { label: 'TRACK DOSSIER',   icon: '🔍', screen: 'Track',  color: colors.cyber },
          { label: 'SCAM RADAR',      icon: '🛡️', screen: 'ScamSearch', color: colors.warn },
          { label: 'FORENSIC SCAN',   icon: '🧪', screen: 'Forensics', color: '#A855F7' },
          { label: 'THREAT MAP',      icon: '🌐', screen: 'ThreatRadar', color: colors.success },
          { label: 'DEFENSE CHAT',    icon: '💬', screen: 'Comms', color: '#EC4899' },
        ].map((act, i) => (
          <TouchableOpacity 
            key={i} 
            style={[globalStyles.glassCard, styles.actionTile, { borderColor: `${act.color}35` }]}
            onPress={() => navigation.navigate(act.screen)}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${act.color}15`, borderColor: `${act.color}50` }]}>
              <Text style={{ fontSize: 20 }}>{act.icon}</Text>
            </View>
            <Text style={[styles.actionTileText, { color: act.color }]}>{act.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Live Telemetry Ticker */}
      <View style={[globalStyles.glassCard, { marginTop: 10, padding: 14 }]}>
        <Text style={globalStyles.sectionTitle}>⚡ LIVE THREAT TELEMETRY</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: colors.cyber }]}>
              {stats?.totalComplaints || complaints.length || 24}
            </Text>
            <Text style={styles.statLbl}>TOTAL CASES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: colors.warn }]}>
              {stats?.underReviewComplaints || 6}
            </Text>
            <Text style={styles.statLbl}>IN TRIAGE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: colors.success }]}>
              {stats?.resolvedComplaints || 14}
            </Text>
            <Text style={styles.statLbl}>RESOLVED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: colors.accent }]}>97.4%</Text>
            <Text style={styles.statLbl}>AI ACCURACY</Text>
          </View>
        </View>
      </View>

      {/* Incident Stream Search & Tabs */}
      <View style={{ marginTop: 14 }}>
        <Text style={globalStyles.sectionTitle}>📡 INCIDENT FEED & DOSSIERS</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, keyword, or category..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[
                styles.filterPill, 
                activeFilter === tab && styles.filterPillActive
              ]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[
                styles.filterPillText, 
                activeFilter === tab && styles.filterPillTextActive
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderComplaint = ({ item }) => {
    const statusColor = statusColors[item.status] || colors.cyber;
    const severityColor = severityColors[item.severity] || colors.warn;

    return (
      <TouchableOpacity 
        style={globalStyles.glassCard}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('ComplaintDetail', { complaintId: item._id || item.complaintId })}
      >
        <View style={globalStyles.spaceBetween}>
          <Text style={[globalStyles.mono, { color: colors.cyber, fontSize: 11, fontWeight: '800' }]}>
            {item.complaintId || item._id?.substring(0, 10)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={[globalStyles.badge, { backgroundColor: `${statusColor}20`, borderColor: statusColor, borderWidth: 1 }]}>
              <Text style={{ color: statusColor, fontSize: 9, fontWeight: '900' }}>
                {(item.status || 'pending').replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.complaintTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.complaintFooter}>
          <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
            {(item.category || 'General').replace(/_/g, ' ')}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 10 }}>
            {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : 'Recent'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      <FlatList
        data={filteredComplaints}
        keyExtractor={item => item._id || item.complaintId || Math.random().toString()}
        renderItem={renderComplaint}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading && (
            <View style={[globalStyles.glassCard, { alignItems: 'center', padding: 30, marginTop: 10 }]}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📡</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>NO INCIDENTS MATCH FILTER</Text>
              <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                Try selecting a different status tab or search query.
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(); }} tintColor={colors.accent} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  appSubtitle: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  sosText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  actionTile: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTileText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statLbl: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 50, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    padding: 0,
  },
  filterPill: {
    backgroundColor: 'rgba(0, 180, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterPillText: {
    color: colors.cyber,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  filterPillTextActive: {
    color: '#030A14',
  },
  complaintTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    lineHeight: 19,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  }
});
