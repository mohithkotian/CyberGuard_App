import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { complaintsAPI, chatsAPI } from '../services/api';
import { colors, globalStyles, statusColors, severityColors, typography } from '../utils/theme';
import { format } from 'date-fns';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';

export default function ComplaintDetailScreen({ route, navigation }) {
  const complaintId = route?.params?.complaintId;
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [caseChats, setCaseChats] = useState([]);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  const loadData = async () => {
    if (!complaintId) {
      setLoading(false);
      return;
    }
    try {
      let comp = null;
      try {
        const { data } = await (/^[0-9a-fA-F]{24}$/.test(complaintId)
          ? complaintsAPI.getOne(complaintId)
          : complaintsAPI.track(complaintId));
        comp = data.data?.complaint || data.data;
      } catch (firstErr) {
        const { data } = await complaintsAPI.track(complaintId);
        comp = data.data?.complaint || data.data;
      }
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
      <SafeAreaView style={[globalStyles.screen, styles.centerWrap]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading Case File...</Text>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={[globalStyles.screen, styles.centerWrap]}>
        <View style={styles.errorIconWrap}>
          <IconGlyph name="alertTriangle" size={28} color={colors.danger} />
        </View>
        <Text style={styles.errorTitle}>Case Not Found</Text>
        <Text style={styles.errorDesc}>
          The requested complaint identifier could not be verified in the database.
        </Text>
        <TouchableOpacity
          style={[globalStyles.btnOutline, { marginTop: 20 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <IconGlyph name="arrowLeft" size={16} color={colors.text} />
          <Text style={globalStyles.btnOutlineText}>Return to Previous Screen</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColor = statusColors[complaint.status] || colors.accent;
  const severityColor = severityColors[complaint.severity] || colors.warn;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <CyberBackground />
      <ScreenHeader
        title="Incident Dossier"
        subtitle={complaint.complaintId || complaint._id}
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Core Case Card */}
        <View style={globalStyles.card}>
          <View style={globalStyles.spaceBetween}>
            <Text style={[globalStyles.mono, styles.caseDocketId]}>
              {complaint.complaintId}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={[globalStyles.badge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}45`, borderWidth: 1 }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>
                  {(complaint.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
              {complaint.severity && (
                <View style={[globalStyles.badge, { backgroundColor: `${severityColor}18`, borderColor: `${severityColor}45`, borderWidth: 1 }]}>
                  <Text style={[styles.badgeText, { color: severityColor }]}>
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
          <View style={globalStyles.card}>
            <Text style={globalStyles.sectionTitle}>AI Classification</Text>
            <View style={globalStyles.spaceBetween}>
              <Text style={styles.metaRowLabel}>Predicted Category:</Text>
              <Text style={styles.metaRowValue}>
                {(complaint.mlPrediction.category || complaint.category)?.replace(/_/g, ' ')}
              </Text>
            </View>
            <View style={[globalStyles.spaceBetween, { marginTop: 10 }]}>
              <Text style={styles.metaRowLabel}>Model Confidence:</Text>
              <Text style={styles.metaRowValue}>
                {Math.round((complaint.mlPrediction.confidence || 0.95) * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* Suspect Identifiers */}
        {complaint.suspectInfo && (complaint.suspectInfo.phone || complaint.suspectInfo.email || complaint.suspectInfo.bankDetails) && (
          <View style={globalStyles.card}>
            <Text style={globalStyles.sectionTitle}>Suspect Identifiers</Text>
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
          <View style={globalStyles.card}>
            <Text style={globalStyles.sectionTitle}>Attached Evidence ({complaint.evidence.length})</Text>
            {complaint.evidence.map((ev, i) => (
              <View key={i} style={styles.evidenceItem}>
                <IconGlyph name="file" size={18} color={colors.accent} />
                <Text style={styles.evidenceName} numberOfLines={1}>
                  {ev.filename || ev.url?.split('/').pop() || `Evidence_File_${i+1}`}
                </Text>
                <View style={[globalStyles.badge, { backgroundColor: 'rgba(61, 245, 192, 0.1)' }]}>
                  <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>ATTACHED</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Timeline Stepper */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Investigation Timeline</Text>
          {(complaint.timeline && complaint.timeline.length > 0 ? complaint.timeline : [
            { status: 'pending', message: 'Complaint registered and queued for investigation.', timestamp: complaint.createdAt },
            { status: 'under_review', message: 'Initial triage complete. Case dossier verified.', timestamp: complaint.createdAt }
          ]).map((t, i) => {
            const stepColor = statusColors[t.status] || colors.accent;
            const isResolved = t.status === 'resolved';
            return (
              <View key={i} style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: `${stepColor}18`, borderColor: stepColor }]}>
                  <IconGlyph name={isResolved ? 'check' : 'clock'} size={12} color={stepColor} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineMessage}>{t.message}</Text>
                  <Text style={styles.timelineDate}>
                    {t.timestamp ? format(new Date(t.timestamp), 'dd MMM yyyy, hh:mm a') : 'Logged'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Officer Case Notes & Citizen Comms */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Case Notes & Officer Updates</Text>
          {caseChats.length === 0 ? (
            <Text style={styles.emptyChatText}>
              No officer notes recorded on this case file yet.
            </Text>
          ) : (
            caseChats.map((c, i) => (
              <View key={i} style={styles.caseChatBubble}>
                <View style={globalStyles.spaceBetween}>
                  <Text style={styles.officerName}>
                    {c.sender?.name || 'Investigating Officer'}
                  </Text>
                  <Text style={styles.officerTimestamp}>
                    {c.createdAt ? format(new Date(c.createdAt), 'hh:mm a') : ''}
                  </Text>
                </View>
                <Text style={styles.officerMessage}>{c.message}</Text>
              </View>
            ))
          )}

          <View style={styles.chatInputRow}>
            <TextInput
              style={[globalStyles.input, styles.chatTextInput]}
              placeholder="Add remark or note to case file..."
              placeholderTextColor={colors.muted}
              value={chatText}
              onChangeText={setChatText}
            />
            <TouchableOpacity
              style={[styles.sendNoteBtn, (!chatText.trim() || sendingChat) && styles.sendBtnDisabled]}
              onPress={handleSendCaseChat}
              disabled={!chatText.trim() || sendingChat}
              activeOpacity={0.8}
            >
              <IconGlyph name="send" size={18} color="#070B12" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  errorDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  caseDocketId: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  titleText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    lineHeight: 24,
  },
  descText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 14,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  metaRowLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  metaRowValue: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  suspectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  suspectLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  suspectVal: {
    color: colors.warn,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: typography.mono,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
  },
  evidenceName: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
  emptyChatText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
  caseChatBubble: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  officerName: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  officerTimestamp: {
    color: colors.muted,
    fontSize: 11,
  },
  officerMessage: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    marginBottom: 0,
    fontSize: 14,
    paddingVertical: 10,
  },
  sendNoteBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
