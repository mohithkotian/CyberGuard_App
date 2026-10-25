import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { complaintsAPI, chatsAPI } from '../services/api';
import { colors, globalStyles, statusColors, severityColors } from '../utils/theme';
import { format } from 'date-fns';
import CyberBackground from '../components/CyberBackground';
import useAuthStore from '../hooks/useAuthStore';

const { width } = Dimensions.get('window');

export default function ComplaintDetailScreen({ route, navigation }) {
  const { complaintId } = route.params;
  const { user } = useAuthStore();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [caseChats, setCaseChats] = useState([]);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  const loadData = async () => {
    try {
      const request = /^[0-9a-fA-F]{24}$/.test(complaintId) 
        ? complaintsAPI.getOne(complaintId)
        : complaintsAPI.track(complaintId);

      const { data } = await request;
      const comp = data.data?.complaint || data.data;
      setComplaint(comp);

      // Load case chat if available
      if (comp?._id) {
        try {
          const chatRes = await chatsAPI.getComplaintChats(comp._id);
          if (chatRes.data?.data?.chats) {
            setCaseChats(chatRes.data.data.chats);
          }
        } catch (e) {
          // Chat may be restricted or uninitialized
        }
      }
    } catch (err) {
      console.error('Load Error:', err.response?.data || err.message);
      Alert.alert('Error', 'Could not load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [complaintId]);

  const handleSendCaseChat = async () => {
    if (!chatText.trim() || !complaint?._id || sendingChat) return;
    setSendingChat(true);
    try {
      await chatsAPI.sendComplaintChat(complaint._id, { message: chatText.trim() });
      setChatText('');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not post note to case log.');
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[globalStyles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.muted, marginTop: 12, fontSize: 12 }}>DECRYPTING DOSSIER...</Text>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={[globalStyles.screen, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '900' }}>CASE NOT FOUND</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
          The requested complaint identifier could not be verified in the cloud database.
        </Text>
        <TouchableOpacity style={[globalStyles.btnOutline, { marginTop: 20 }]} onPress={() => navigation.goBack()}>
          <Text style={globalStyles.btnOutlineText}>← Return to Feed</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColor = statusColors[complaint.status] || colors.cyber;
  const severityColor = severityColors[complaint.severity] || colors.warn;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <CyberBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>INCIDENT DOSSIER</Text>
          <Text style={styles.headerSub}>{complaint.complaintId || complaint._id}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Core Case Card */}
        <View style={globalStyles.glassCard}>
          <View style={globalStyles.spaceBetween}>
            <Text style={[globalStyles.mono, { color: colors.cyber, fontSize: 12, fontWeight: '800' }]}>
              {complaint.complaintId}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={[globalStyles.badge, { backgroundColor: `${statusColor}20`, borderColor: statusColor, borderWidth: 1 }]}>
                <Text style={{ color: statusColor, fontSize: 10, fontWeight: '900' }}>
                  {(complaint.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
              {complaint.severity && (
                <View style={[globalStyles.badge, { backgroundColor: `${severityColor}20`, borderColor: severityColor, borderWidth: 1 }]}>
                  <Text style={{ color: severityColor, fontSize: 10, fontWeight: '900' }}>
                    {complaint.severity.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.titleText}>{complaint.title}</Text>
          <Text style={styles.descText}>{complaint.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CATEGORY</Text>
              <Text style={styles.infoValue}>{(complaint.category || 'General').replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>FINANCIAL LOSS</Text>
              <Text style={[styles.infoValue, { color: complaint.victimDetails?.financialLoss ? colors.danger : colors.text }]}>
                {complaint.victimDetails?.financialLoss ? `₹${Number(complaint.victimDetails.financialLoss).toLocaleString()}` : 'None Reported'}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>FILED ON</Text>
              <Text style={styles.infoValue}>
                {complaint.createdAt ? format(new Date(complaint.createdAt), 'dd MMM yyyy, hh:mm a') : 'Recent'}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>LOCATION</Text>
              <Text style={styles.infoValue}>
                {complaint.location?.district ? `${complaint.location.district}, ${complaint.location.state}` : 'Digital / Global'}
              </Text>
            </View>
          </View>
        </View>

        {/* AI Neural Classification */}
        {complaint.mlPrediction && (
          <View style={[globalStyles.glassCard, { borderColor: 'rgba(0, 255, 209, 0.3)' }]}>
            <Text style={globalStyles.sectionTitle}>🤖 AI NEURAL CLASSIFICATION</Text>
            <View style={globalStyles.spaceBetween}>
              <Text style={{ color: colors.text, fontSize: 13 }}>Predicted Category:</Text>
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '800' }}>
                {(complaint.mlPrediction.category || complaint.category)?.replace(/_/g, ' ')}
              </Text>
            </View>
            <View style={[globalStyles.spaceBetween, { marginTop: 8 }]}>
              <Text style={{ color: colors.text, fontSize: 13 }}>Model Confidence:</Text>
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '800' }}>
                {Math.round((complaint.mlPrediction.confidence || 0.95) * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* Suspect Identifiers */}
        {complaint.suspectInfo && (complaint.suspectInfo.phone || complaint.suspectInfo.email || complaint.suspectInfo.bankDetails) && (
          <View style={globalStyles.glassCard}>
            <Text style={globalStyles.sectionTitle}>🚨 SUSPECT IDENTIFIERS</Text>
            {complaint.suspectInfo.phone && (
              <View style={styles.suspectRow}>
                <Text style={styles.suspectLabel}>Phone:</Text>
                <Text style={styles.suspectVal}>{complaint.suspectInfo.phone}</Text>
              </View>
            )}
            {complaint.suspectInfo.email && (
              <View style={styles.suspectRow}>
                <Text style={styles.suspectLabel}>Email:</Text>
                <Text style={styles.suspectVal}>{complaint.suspectInfo.email}</Text>
              </View>
            )}
            {complaint.suspectInfo.bankDetails && (
              <View style={styles.suspectRow}>
                <Text style={styles.suspectLabel}>Financial Ref:</Text>
                <Text style={styles.suspectVal}>{complaint.suspectInfo.bankDetails}</Text>
              </View>
            )}
          </View>
        )}

        {/* Evidence Dossier */}
        {complaint.evidence && complaint.evidence.length > 0 && (
          <View style={globalStyles.glassCard}>
            <Text style={globalStyles.sectionTitle}>📁 ATTACHED EVIDENCE ({complaint.evidence.length})</Text>
            {complaint.evidence.map((ev, i) => (
              <View key={i} style={styles.evidenceItem}>
                <Text style={{ fontSize: 14 }}>📄</Text>
                <Text style={styles.evidenceName} numberOfLines={1}>
                  {ev.filename || ev.url?.split('/').pop() || `Evidence_File_${i+1}`}
                </Text>
                <Text style={{ color: colors.accent, fontSize: 11 }}>ATTACHED</Text>
              </View>
            ))}
          </View>
        )}

        {/* Timeline Stepper */}
        <View style={globalStyles.glassCard}>
          <Text style={globalStyles.sectionTitle}>⏳ INVESTIGATION TIMELINE</Text>
          {(complaint.timeline && complaint.timeline.length > 0 ? complaint.timeline : [
            { status: 'pending', message: 'Complaint registered and queued for neural categorization.', timestamp: complaint.createdAt },
            { status: 'under_review', message: 'Initial triage complete. Case dossier verified.', timestamp: complaint.createdAt }
          ]).map((t, i) => {
            const stepColor = statusColors[t.status] || colors.cyber;
            return (
              <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: `${stepColor}25`, borderWidth: 2, borderColor: stepColor, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Text style={{ fontSize: 10 }}>{t.status === 'resolved' ? '✓' : '●'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{t.message}</Text>
                  <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>
                    {t.timestamp ? format(new Date(t.timestamp), 'dd MMM yyyy, hh:mm a') : 'Logged'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Officer Case Notes & Citizen Comms */}
        <View style={globalStyles.glassCard}>
          <Text style={globalStyles.sectionTitle}>💬 CASE LOG & DIRECT OFFICER NOTES</Text>
          {caseChats.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', paddingVertical: 10 }}>
              No private officer notes on this case yet.
            </Text>
          ) : (
            caseChats.map((c, i) => (
              <View key={i} style={styles.caseChatBubble}>
                <View style={globalStyles.spaceBetween}>
                  <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800' }}>
                    {c.sender?.name || 'Investigating Officer'}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 9 }}>
                    {c.createdAt ? format(new Date(c.createdAt), 'hh:mm a') : ''}
                  </Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4 }}>{c.message}</Text>
              </View>
            ))
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TextInput
              style={[styles.chatInput, { flex: 1 }]}
              placeholder="Add remark or note to case file..."
              placeholderTextColor={colors.muted}
              value={chatText}
              onChangeText={setChatText}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, (!chatText.trim() || sendingChat) && { opacity: 0.5 }]} 
              onPress={handleSendCaseChat}
              disabled={!chatText.trim() || sendingChat}
            >
              <Text style={{ color: '#030A14', fontWeight: '900', fontSize: 13 }}>LOG</Text>
            </TouchableOpacity>
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 12,
    lineHeight: 22,
  },
  descText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
    marginTop: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  suspectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  suspectLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  suspectVal: {
    color: colors.warn,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  evidenceName: {
    color: colors.text,
    fontSize: 12,
    flex: 1,
  },
  caseChatBubble: {
    backgroundColor: 'rgba(15, 25, 50, 0.8)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.15)',
  },
  chatInput: {
    backgroundColor: 'rgba(15, 25, 50, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 12,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
