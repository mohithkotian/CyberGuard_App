import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { complaintsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import { colors, globalStyles, statusColors, severityColors } from '../utils/theme';
import CyberBackground from '../components/CyberBackground';
import ScreenHeader from '../components/ScreenHeader';
import IconGlyph from '../components/IconGlyph';

const STATUSES = ['pending', 'under_review', 'investigating', 'resolved', 'rejected'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export default function AdminScreen({ navigation }) {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchAdminComplaints = async () => {
    try {
      const { data } = await complaintsAPI.getAll({ limit: 50 });
      const list = data.data?.complaints || data.data || [];
      setComplaints(list);
    } catch (err) {
      console.log('Admin list fetch:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminComplaints();
  }, []);

  const openTriageModal = (item) => {
    setSelectedComp(item);
    setStatus(item.status || 'pending');
    setSeverity(item.severity || 'medium');
    setNotes('');
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!selectedComp) return;
    setUpdating(true);
    try {
      await complaintsAPI.updateStatus(selectedComp._id, {
        status,
        message: notes.trim() || `Status updated to ${status} by triage officer`,
      });

      if (severity !== selectedComp.severity) {
        await complaintsAPI.updatePriority(selectedComp._id, { priority: severity });
      }

      Alert.alert('Triage Saved', `Case ${selectedComp.complaintId || selectedComp._id} updated successfully.`);
      setModalVisible(false);
      fetchAdminComplaints();
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Could not update case triage.');
    } finally {
      setUpdating(false);
    }
  };

  const renderComplaintItem = ({ item }) => {
    const statusColor = statusColors[item.status] || colors.accent;
    const severityColor = severityColors[item.severity] || colors.warn;

    return (
      <View style={globalStyles.card}>
        <View style={globalStyles.spaceBetween}>
          <Text style={[globalStyles.mono, styles.caseId]}>
            {item.complaintId || item._id?.substring(0, 10)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={[globalStyles.badge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40`, borderWidth: 1 }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>
                {(item.status || 'pending').replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[globalStyles.badge, { backgroundColor: `${severityColor}18`, borderColor: `${severityColor}40`, borderWidth: 1 }]}>
              <Text style={[styles.badgeText, { color: severityColor }]}>
                {(item.severity || 'medium').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.descText} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[globalStyles.btnOutline, styles.actionBtn]}
            onPress={() => navigation.navigate('ComplaintDetail', { complaintId: item._id || item.complaintId })}
            activeOpacity={0.75}
          >
            <IconGlyph name="file" size={15} color={colors.text} />
            <Text style={globalStyles.btnOutlineText}>View Dossier</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.triageBtn, styles.actionBtn]}
            onPress={() => openTriageModal(item)}
            activeOpacity={0.8}
          >
            <IconGlyph name="edit" size={15} color={colors.accent} strokeWidth={2.2} />
            <Text style={styles.triageBtnText}>Triage Case</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <CyberBackground />
      <ScreenHeader
        title="Officer Command"
        subtitle="Incident triage and escalation desk"
        navigation={navigation}
      />

      <FlatList
        data={complaints}
        keyExtractor={item => item._id}
        renderItem={renderComplaintItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAdminComplaints(); }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={[globalStyles.card, styles.emptyContainer]}>
              <IconGlyph name="shield" size={32} color={colors.accent} />
              <Text style={styles.emptyTitle}>No Active Incidents Pending Triage</Text>
              <Text style={styles.emptySubtitle}>All incoming citizen reports have been reviewed and processed.</Text>
            </View>
          )
        }
      />

      {/* Triage Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[globalStyles.card, styles.modalContent]}>
            <View style={globalStyles.spaceBetween}>
              <View>
                <Text style={styles.modalHeading}>Case Triage Control</Text>
                <Text style={[globalStyles.mono, styles.modalSubId]}>
                  {selectedComp?.complaintId}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close triage dialog"
              >
                <IconGlyph name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Status Selector */}
            <Text style={[globalStyles.label, { marginTop: 16 }]}>Update Status</Text>
            <View style={styles.chipRow}>
              {STATUSES.map(s => {
                const isActive = status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, isActive && styles.statusChipActive]}
                    onPress={() => setStatus(s)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
                      {s.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Severity Selector */}
            <Text style={[globalStyles.label, { marginTop: 14 }]}>Threat Severity Level</Text>
            <View style={styles.chipRow}>
              {SEVERITIES.map(sev => {
                const isActive = severity === sev;
                return (
                  <TouchableOpacity
                    key={sev}
                    style={[styles.statusChip, isActive && styles.severityChipActive]}
                    onPress={() => setSeverity(sev)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.statusChipText, isActive && styles.severityChipTextActive]}>
                      {sev}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Officer Note */}
            <Text style={[globalStyles.label, { marginTop: 14 }]}>Officer Remark / Timeline Entry</Text>
            <TextInput
              style={[globalStyles.input, styles.noteInput]}
              placeholder="e.g. Transaction freeze notice submitted to nodal bank..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[globalStyles.btnPrimary, { marginTop: 14 }]}
              onPress={handleUpdate}
              disabled={updating}
              activeOpacity={0.8}
            >
              {updating ? (
                <ActivityIndicator color="#070B12" />
              ) : (
                <>
                  <IconGlyph name="check" size={18} color="#070B12" strokeWidth={2.4} />
                  <Text style={globalStyles.btnPrimaryText}>Save Case Updates</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  caseId: {
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
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    lineHeight: 22,
  },
  descText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  triageBtn: {
    backgroundColor: 'rgba(61, 245, 192, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61, 245, 192, 0.4)',
    borderRadius: 8,
    paddingVertical: 10,
  },
  triageBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    padding: 20,
    borderRadius: 14,
    borderColor: colors.borderLight,
    borderWidth: 1,
  },
  modalHeading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubId: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  statusChip: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statusChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusChipTextActive: {
    color: '#070B12',
    fontWeight: '700',
  },
  severityChipActive: {
    backgroundColor: colors.warn,
    borderColor: colors.warn,
  },
  severityChipTextActive: {
    color: '#070B12',
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 80,
    marginTop: 6,
    paddingTop: 10,
  },
});
