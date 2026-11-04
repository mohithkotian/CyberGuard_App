import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { complaintsAPI } from '../services/api';
import { onStatusUpdate, offStatusUpdate } from '../services/socket';
import useAuthStore from '../hooks/useAuthStore';
import {
  ShieldAlert,
  Clock,
  Landmark,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  X,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

const STATUS_COLORS = {
  pending: { text: '#d8a43a', bg: '#261b0c', border: '#4a3518' },
  under_review: { text: '#3DF5C0', bg: '#0d1a14', border: '#1a382a' },
  investigating: { text: '#38bdf8', bg: '#0c1b26', border: '#18364a' },
  resolved: { text: '#3DF5C0', bg: '#0d1a14', border: '#1a382a' },
  closed: { text: '#8e8b84', bg: '#171717', border: '#2e2e2e' },
  rejected: { text: '#f87171', bg: '#2b1414', border: '#4d2020' }
};

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'golden_hour', 'p0_safety', 'investigating'
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Multi-Case Batch Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBatchFreezeModal, setShowBatchFreezeModal] = useState(false);
  const [batchBankForm, setBatchBankForm] = useState({
    targetBank: 'State Bank of India',
    beneficiaryAccount: '',
    beneficiaryUpi: ''
  });
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Quick Triage Drawer
  const [triageComplaint, setTriageComplaint] = useState(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await complaintsAPI.getAll({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 20
      });
      setComplaints(data.data.complaints || []);

      const s = data.data.stats || {};
      setStats({
        total: data.data.pagination?.total || 0,
        pending: s.pending || 0,
        inProgress: (s.under_review || 0) + (s.investigating || 0) + (s.in_progress || 0),
        resolved: s.resolved || 0
      });
      setPagination(data.data.pagination || { total: 0, pages: 1 });
    } catch {
      toast.error('Failed to load investigation queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Real-time status updates via WebSocket
  useEffect(() => {
    const handler = ({ complaintId, status }) => {
      fetchComplaints();
      toast.success(`Complaint ${complaintId}: ${status.replace('_', ' ')}`);
    };
    onStatusUpdate(handler);
    return () => offStatusUpdate(handler);
  }, [fetchComplaints]);

  // Golden Hour helper: returns hours elapsed since incident/creation
  const getElapsedHours = (createdAt, incidentDate) => {
    const ref = incidentDate ? new Date(incidentDate) : new Date(createdAt);
    const diffMs = Date.now() - ref.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  // Filter complaints based on active quick filter tab
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      if (activeTab === 'golden_hour') {
        const isFinancial = c.lostMoney || (c.category && /financial|upi|bank|fraud/i.test(c.category));
        const hours = getElapsedHours(c.createdAt, c.victimDetails?.incidentDate);
        return isFinancial && hours <= 4 && c.status !== 'resolved' && c.status !== 'closed';
      }
      if (activeTab === 'p0_safety') {
        const isSafety = c.isImmediateAction || (c.category && /women|child|safety|domestic|extortion|harass/i.test(c.category));
        return isSafety;
      }
      if (activeTab === 'investigating') {
        return c.status === 'investigating' || c.status === 'under_review';
      }
      return true;
    });
  }, [complaints, activeTab]);

  // Count active golden hour and P0 complaints
  const goldenHourCount = useMemo(() => {
    return complaints.filter(c => {
      const isFinancial = c.lostMoney || (c.category && /financial|upi|bank|fraud/i.test(c.category));
      const hours = getElapsedHours(c.createdAt, c.victimDetails?.incidentDate);
      return isFinancial && hours <= 4 && c.status !== 'resolved';
    }).length;
  }, [complaints]);

  const p0SafetyCount = useMemo(() => {
    return complaints.filter(c => c.isImmediateAction || (c.category && /women|child|safety|extortion/i.test(c.category))).length;
  }, [complaints]);

  // Multi-select handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredComplaints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComplaints.map(c => c._id));
    }
  };

  // Batch Bank Freeze Dispatch
  const handleBatchFreezeSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setBatchSubmitting(true);
    try {
      const { data } = await complaintsAPI.batchEnforcement({
        complaintIds: selectedIds,
        actionType: 'BATCH_BANK_FREEZE',
        bankDetails: batchBankForm
      });
      toast.success(`Dispatched Section 106 BNSS freeze across ${data.data.affectedCount} complaints.`);
      setShowBatchFreezeModal(false);
      setSelectedIds([]);
      await fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Batch freeze enforcement failed.');
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (newStatus) => {
    if (selectedIds.length === 0) return;
    try {
      const { data } = await complaintsAPI.batchEnforcement({
        complaintIds: selectedIds,
        actionType: 'BATCH_STATUS_UPDATE',
        targetStatus: newStatus
      });
      toast.success(`Updated ${data.data.affectedCount} cases to ${newStatus.toUpperCase()}`);
      setSelectedIds([]);
      await fetchComplaints();
    } catch (err) {
      toast.error('Batch status update failed.');
    }
  };

  return (
    <div className="page-shell" style={{ minHeight: '100vh', background: '#070707', color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px' }}>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px 0', fontFamily: "'IBM Plex Mono', monospace" }}>
              STATE CYBER CRIME INVESTIGATION WING
            </p>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: '0 0 8px 0', color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              INVESTIGATING OFFICER COMMAND MATRIX
            </h1>
            <p style={{ color: '#8e8b84', fontSize: '14px', margin: 0, maxWidth: 650 }}>
              Triage active cyber complaints, enforce Golden-Hour debit freezes under Section 106 BNSS, and execute multi-case statutory directives.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#3DF5C0', background: 'rgba(61, 245, 192, 0.08)', border: '1px solid #24483a', padding: '6px 12px', borderRadius: 8, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
              OFFICER: {user?.name || 'ON DUTY'}
            </span>
          </div>
        </div>

        {/* Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={{ background: '#0d0d0d', border: '1px solid #242422', borderRadius: '12px', padding: '20px' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 4 }}>
              TOTAL ASSIGNED QUEUE
            </span>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
              {stats.total}
            </span>
          </div>

          <div style={{ background: '#1c150c', border: '1px solid #4a3518', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'block', fontSize: '11px', color: '#d8a43a', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 4 }}>
                GOLDEN-HOUR ACTIVE (&lt; 4H)
              </span>
              <Clock size={16} color="#d8a43a" />
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#d8a43a', fontFamily: "'IBM Plex Mono', monospace" }}>
              {goldenHourCount}
            </span>
          </div>

          <div style={{ background: '#241416', border: '1px solid #4a2024', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'block', fontSize: '11px', color: '#f87171', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 4 }}>
                PRIORITY ZERO (P0 SAFETY)
              </span>
              <ShieldAlert size={16} color="#f87171" />
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#f87171', fontFamily: "'IBM Plex Mono', monospace" }}>
              {p0SafetyCount}
            </span>
          </div>

          <div style={{ background: '#0d1a14', border: '1px solid #1a382a', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'block', fontSize: '11px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 4 }}>
                CASES RESOLVED
              </span>
              <CheckCircle2 size={16} color="#3DF5C0" />
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
              {stats.resolved}
            </span>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #242422', marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            { id: 'all', label: `ALL INCIDENTS (${complaints.length})` },
            { id: 'golden_hour', label: `⚡ GOLDEN HOUR ACTIVE (${goldenHourCount})` },
            { id: 'p0_safety', label: `🚨 PRIORITY ZERO (${p0SafetyCount})` },
            { id: 'investigating', label: `ACTIVE INVESTIGATION (${stats.inProgress})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setSelectedIds([]); }}
              style={{
                background: activeTab === tab.id ? '#141414' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3DF5C0' : '2px solid transparent',
                color: activeTab === tab.id ? '#3DF5C0' : '#8e8b84',
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by Complaint ID, UTR, suspect phone, or narrative..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                background: '#0d0d0d',
                border: '1px solid #30302d',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#f2f0ea',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              background: '#0d0d0d',
              border: '1px solid #30302d',
              borderRadius: '8px',
              padding: '0 16px',
              color: '#f2f0ea',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: "'IBM Plex Mono', monospace"
            }}
          >
            <option value="">STATUS: ALL</option>
            {['pending', 'under_review', 'investigating', 'resolved', 'closed', 'rejected'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Batch Action Toolbar (Visible when 1+ selected) */}
        {selectedIds.length > 0 && (
          <div style={{
            background: '#121212',
            border: '1px solid #3DF5C0',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                {selectedIds.length} CASES SELECTED
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                style={{ background: 'none', border: 'none', color: '#8e8b84', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear Selection
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowBatchFreezeModal(true)}
                style={{
                  background: '#d8a43a',
                  border: 'none',
                  color: '#070707',
                  padding: '8px 14px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Landmark size={14} />
                <span>BATCH SEC 106 BANK FREEZE</span>
              </button>

              <button
                type="button"
                onClick={() => handleBatchStatusUpdate('investigating')}
                style={{
                  background: '#141414',
                  border: '1px solid #30302d',
                  color: '#3DF5C0',
                  padding: '8px 14px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                MARK ACTIVE INVESTIGATION
              </button>
            </div>
          </div>
        )}

        {/* Complaint Table / Matrix */}
        <div style={{ background: '#0d0d0d', border: '1px solid #242422', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 140px 1.5fr 1fr 140px 160px',
            background: '#0a0a0a',
            borderBottom: '1px solid #242422',
            padding: '12px 18px',
            fontSize: '11px',
            color: '#8e8b84',
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            letterSpacing: '0.06em'
          }}>
            <div>
              <button type="button" onClick={handleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8b84', padding: 0 }}>
                {selectedIds.length === filteredComplaints.length && filteredComplaints.length > 0 ? (
                  <CheckSquare size={16} color="#3DF5C0" />
                ) : (
                  <Square size={16} />
                )}
              </button>
            </div>
            <div>COMPLAINT ID</div>
            <div>INCIDENT DOSSIER & VICTIM</div>
            <div>SUSPECT & AMOUNT</div>
            <div>STATUS</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8e8b84' }}>
              LOADING INVESTIGATION MATRIX...
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8e8b84' }}>
              <p style={{ margin: 0, fontSize: '13px' }}>No cases found matching the active criteria.</p>
            </div>
          ) : (
            filteredComplaints.map((c, idx) => {
              const statusStyle = STATUS_COLORS[c.status] || STATUS_COLORS.pending;
              const isSelected = selectedIds.includes(c._id);
              const elapsedHours = getElapsedHours(c.createdAt, c.victimDetails?.incidentDate);
              const isGoldenHour = (c.lostMoney || (c.category && /financial|upi|bank/i.test(c.category))) && elapsedHours <= 4 && c.status !== 'resolved';
              const isP0 = c.isImmediateAction || (c.category && /women|child|safety|extortion/i.test(c.category));

              return (
                <div
                  key={c._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 140px 1.5fr 1fr 140px 160px',
                    padding: '16px 18px',
                    borderBottom: idx < filteredComplaints.length - 1 ? '1px solid #1a1a1a' : 'none',
                    background: isSelected ? 'rgba(61, 245, 192, 0.04)' : '#0d0d0d',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}
                >
                  {/* Selection Checkbox */}
                  <div>
                    <button type="button" onClick={() => handleToggleSelect(c._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8b84', padding: 0 }}>
                      {isSelected ? <CheckSquare size={16} color="#3DF5C0" /> : <Square size={16} />}
                    </button>
                  </div>

                  {/* ID & Flags */}
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: '#f2f0ea', fontSize: '12px' }}>
                      {c.complaintId}
                    </div>
                    {isGoldenHour && (
                      <span style={{ fontSize: '9px', color: '#d8a43a', background: '#261b0c', border: '1px solid #4a3518', padding: '1px 5px', borderRadius: 4, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", display: 'inline-block', marginTop: 4 }}>
                        ⚡ GOLDEN HR (&lt;4H)
                      </span>
                    )}
                    {isP0 && (
                      <span style={{ fontSize: '9px', color: '#f87171', background: '#2b1414', border: '1px solid #4d2020', padding: '1px 5px', borderRadius: 4, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", display: 'inline-block', marginTop: 4 }}>
                        🚨 P0 EMERGENCY
                      </span>
                    )}
                  </div>

                  {/* Title & Category */}
                  <div style={{ paddingRight: 16 }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#f2f0ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {c.category}
                      </span>
                      <span style={{ fontSize: '10px', color: '#555' }}>•</span>
                      <span style={{ fontSize: '11px', color: '#8e8b84' }}>
                        {format(new Date(c.createdAt), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>

                  {/* Suspect & Financial Loss */}
                  <div>
                    {c.victimDetails?.amountLost || c.lostMoney ? (
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#d8a43a', fontFamily: "'IBM Plex Mono', monospace" }}>
                        INR {Number(c.victimDetails?.amountLost || 0).toLocaleString('en-IN')}/-
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#8e8b84' }}>Non-financial</span>
                    )}
                    <span style={{ fontSize: '11px', color: '#8e8b84', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.suspectInfo?.name || c.suspectInfo?.details || 'Suspect on Record'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: "'IBM Plex Mono', monospace",
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                      display: 'inline-block'
                    }}>
                      {c.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setTriageComplaint(c)}
                      style={{
                        background: '#141414',
                        border: '1px solid #30302d',
                        color: '#3DF5C0',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: "'IBM Plex Mono', monospace"
                      }}
                    >
                      FAST TRIAGE
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/complaint/${c.complaintId}`)}
                      style={{
                        background: '#141414',
                        border: '1px solid #30302d',
                        color: '#f2f0ea',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      DOSSIER →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── FAST TRIAGE DRAWER / MODAL ── */}
        <AnimatePresence>
          {triageComplaint && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                style={{
                  width: '100%',
                  maxWidth: '680px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  background: '#0d0d0d',
                  border: '1px solid #30302d',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.8)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #242422', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Layers size={18} color="#3DF5C0" />
                    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                      FAST CASE TRIAGE: {triageComplaint.complaintId}
                    </span>
                  </div>
                  <button type="button" onClick={() => setTriageComplaint(null)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#f2f0ea', margin: '0 0 8px 0', fontWeight: 700 }}>
                    {triageComplaint.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: '11px', color: '#8e8b84', background: '#141414', border: '1px solid #30302d', padding: '2px 8px', borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {triageComplaint.category}
                    </span>
                    {triageComplaint.victimDetails?.amountLost && (
                      <span style={{ fontSize: '11px', color: '#d8a43a', background: '#261b0c', border: '1px solid #4a3518', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                        LOST: INR {Number(triageComplaint.victimDetails.amountLost).toLocaleString('en-IN')}/-
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#a8a59d', lineHeight: 1.6, background: '#070707', border: '1px solid #1a1a1a', borderRadius: 8, padding: 14, margin: 0, maxHeight: '140px', overflowY: 'auto' }}>
                    {triageComplaint.description}
                  </p>
                </div>

                {/* Extracted IOCs & Suspect Intel */}
                <div style={{ background: '#121212', border: '1px solid #242422', borderRadius: 8, padding: 14, marginBottom: 20 }}>
                  <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>
                    SUSPECT IDENTIFIERS & BANKING TRACE:
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", color: '#d8d5ce', lineHeight: 1.7 }}>
                    <div><strong>Accused Handle :</strong> {triageComplaint.suspectInfo?.name || 'Unknown syndicate actor'}</div>
                    <div><strong>Contact Details :</strong> {triageComplaint.suspectInfo?.details || 'Under ongoing analysis'}</div>
                    {triageComplaint.victimDetails?.transactionReference && (
                      <div><strong>Transaction UTR:</strong> <span style={{ color: '#3DF5C0' }}>{triageComplaint.victimDetails.transactionReference}</span></div>
                    )}
                  </div>
                </div>

                {/* Rapid Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const id = triageComplaint.complaintId;
                      setTriageComplaint(null);
                      navigate(`/complaint/${id}`);
                    }}
                    style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px' }}
                  >
                    <span>OPEN FULL INVESTIGATION DOSSIER</span>
                    <ArrowRight size={14} />
                  </button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await complaintsAPI.updateStatus(triageComplaint._id, { status: 'investigating' });
                          toast.success('Status updated to Investigating');
                          setTriageComplaint(null);
                          await fetchComplaints();
                        } catch {
                          toast.error('Failed to escalate status');
                        }
                      }}
                      style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                    >
                      ESCALATE TO INVESTIGATING
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── BATCH BANK FREEZE MODAL ── */}
        <AnimatePresence>
          {showBatchFreezeModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  background: '#0d0d0d',
                  border: '1px solid #30302d',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.8)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #242422', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Landmark size={18} color="#d8a43a" />
                    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#d8a43a', fontFamily: "'IBM Plex Mono', monospace" }}>
                      BATCH SECTION 106 BNSS BANK DEBIT FREEZE
                    </span>
                  </div>
                  <button type="button" onClick={() => setShowBatchFreezeModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>

                <p style={{ fontSize: '13px', color: '#8e8b84', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                  Dispatch statutory debit freeze orders to the nodal bank command for all <strong>{selectedIds.length}</strong> selected complaints simultaneously.
                </p>

                <form onSubmit={handleBatchFreezeSubmit}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                      TARGET FINANCIAL INSTITUTION / BANK *
                    </label>
                    <input
                      type="text"
                      required
                      value={batchBankForm.targetBank}
                      onChange={e => setBatchBankForm({ ...batchBankForm, targetBank: e.target.value })}
                      placeholder="e.g. State Bank of India / HDFC Bank"
                      style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        BENEFICIARY ACCOUNT NUMBER
                      </label>
                      <input
                        type="text"
                        value={batchBankForm.beneficiaryAccount}
                        onChange={e => setBatchBankForm({ ...batchBankForm, beneficiaryAccount: e.target.value })}
                        placeholder="e.g. 918273645102"
                        style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        BENEFICIARY UPI / VPA
                      </label>
                      <input
                        type="text"
                        value={batchBankForm.beneficiaryUpi}
                        onChange={e => setBatchBankForm({ ...batchBankForm, beneficiaryUpi: e.target.value })}
                        placeholder="e.g. mulesyndicate@oksbi"
                        style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button type="button" onClick={() => setShowBatchFreezeModal(false)} style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                      CANCEL
                    </button>
                    <button type="submit" disabled={batchSubmitting} style={{ background: '#d8a43a', border: 'none', color: '#070707', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                      {batchSubmitting ? 'DISPATCHING...' : `DISPATCH FREEZE (${selectedIds.length} CASES)`}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
