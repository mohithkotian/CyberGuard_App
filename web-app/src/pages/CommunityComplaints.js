import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { UsersRound, ShieldCheck, ArrowRight, Lock, Search, Radio, AlertTriangle, ShieldAlert, Compass } from 'lucide-react';
import Navbar from '../components/Navbar';
import { complaintsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';

const STATUS_COLORS = {
  pending: '#d8a43a', under_review: '#3DF5C0', investigating: '#3DF5C0',
  resolved: '#10b981', closed: '#8e8b84', rejected: '#d96464'
};

const SEVERITY_COLORS = { high: '#d96464', medium: '#d8a43a', low: '#8e8b84' };

export default function CommunityComplaints() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'radar'
  const [radarData, setRadarData] = useState({ radarAlerts: [], summary: {} });
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarCity, setRadarCity] = useState('all');
  const [radarCategory, setRadarCategory] = useState('all');

  const fetchRadar = useCallback(async () => {
    try {
      setRadarLoading(true);
      const { data } = await complaintsAPI.getRadar({
        city: radarCity !== 'all' ? radarCity : undefined,
        category: radarCategory !== 'all' ? radarCategory : undefined
      });
      if (data?.data) {
        setRadarData(data.data);
      }
    } catch (e) {
      console.error('Failed to load radar data:', e);
    } finally {
      setRadarLoading(false);
    }
  }, [radarCity, radarCategory]);

  useEffect(() => {
    fetchRadar();
  }, [fetchRadar]);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        scope: 'public',
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 12,
      };
      // ── DEBUG: confirm what we are actually sending ──
      console.log('[CommunityComplaints] calling getAll with params:', params);
      const { data } = await complaintsAPI.getAll(params);
      console.log('[CommunityComplaints] received', data.data.complaints.length, 'complaints');
      setComplaints(data.data.complaints);
      const s = data.data.stats || {};
      setStats({
        total: data.data.pagination.total || 0,
        pending: s.pending || 0,
        inProgress: (s.under_review || 0) + (s.investigating || 0),
        resolved: s.resolved || 0,
      });
      setPagination(data.data.pagination);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load community complaints');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const statCards = [
    { label: 'Total Reports', value: stats.total, color: '#f2f0ea' },
    { label: 'Pending',       value: stats.pending,    color: '#d8a43a' },
    { label: 'In Progress',   value: stats.inProgress, color: '#3DF5C0' },
    { label: 'Resolved',      value: stats.resolved,   color: '#10b981' },
  ];

  return (
    <div className="page-shell" style={{
      minHeight: '100dvh',
      background: '#070707',
      color: '#f2f0ea',
      fontFamily: "'IBM Plex Sans', sans-serif",
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <Navbar />

      <main className="community-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 24px 100px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{
              background: '#141414',
              border: '1px solid #30302d',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#3DF5C0',
              letterSpacing: '0.08em',
              fontFamily: "'IBM Plex Sans', sans-serif",
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}>
              <UsersRound size={13} />
              PUBLIC COMMUNITY REGISTRY
            </span>
            <span style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}>
              ANONYMISED • PII PROTECTED
            </span>
          </div>

          <h1 style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            color: '#f2f0ea',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: '0 0 10px 0',
          }}>
            Community Incident Log
          </h1>
          <p style={{ color: '#8e8b84', fontSize: '15px', fontWeight: 500, margin: 0, maxWidth: 680 }}>
            Inspect anonymized cybercrime records across the national network. Personal details are scrubbed to preserve victim privacy.
          </p>
        </header>

        {/* Tab Switcher: Incident Registry vs Regional Scam Radar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, borderBottom: '1px solid #242422', paddingBottom: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            style={{
              background: activeTab === 'registry' ? '#141414' : 'transparent',
              border: `1px solid ${activeTab === 'registry' ? '#3a3936' : 'transparent'}`,
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              color: activeTab === 'registry' ? '#f2f0ea' : '#8e8b84',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.18s ease'
            }}
          >
            <UsersRound size={16} color={activeTab === 'registry' ? '#3DF5C0' : '#8e8b84'} />
            <span>INCIDENT REGISTRY</span>
            <span style={{ fontSize: '10px', background: '#1e1e1d', padding: '2px 6px', borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            style={{
              background: activeTab === 'radar' ? '#141414' : 'transparent',
              border: `1px solid ${activeTab === 'radar' ? '#3a3936' : 'transparent'}`,
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              color: activeTab === 'radar' ? '#f2f0ea' : '#8e8b84',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.18s ease'
            }}
          >
            <Radio size={16} color={activeTab === 'radar' ? '#d96464' : '#8e8b84'} />
            <span>REGIONAL SCAM RADAR</span>
            <span style={{ fontSize: '10px', background: '#261212', border: '1px solid #d96464', color: '#d96464', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
              LIVE
            </span>
          </button>
        </div>

        {activeTab === 'registry' ? (
          <>
            {/* Live Radar Advisory Alert Strip */}
            <div style={{
              background: '#0f0e0d',
              border: '1px solid #302a20',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px' }}>
                <AlertTriangle size={16} color="#d8a43a" />
                <span style={{ color: '#d8d5ce' }}>
                  <strong style={{ color: '#f2f0ea' }}>Regional Threat Feed:</strong> Active surges detected in fake utility disconnection SMS and customs video extortion.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('radar')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3DF5C0',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>OPEN SCAM RADAR</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: '#0d0d0d',
                border: '1px solid #242421',
                borderRadius: '24px',
                padding: '24px 28px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: s.color, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.02em' }}>
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#8e8b84' }} />
            <input
              placeholder="Search by keywords, threat category, or details..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                background: '#0d0d0d',
                border: '1px solid #30302d',
                borderRadius: '999px',
                padding: '14px 20px 14px 44px',
                color: '#f2f0ea',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              width: 180,
              background: '#0d0d0d',
              border: '1px solid #30302d',
              borderRadius: '999px',
              padding: '0 18px',
              color: '#f2f0ea',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'IBM Plex Sans', sans-serif",
              cursor: 'pointer',
              outline: 'none',
              letterSpacing: '0.04em'
            }}
          >
            <option value="">ALL STATUSES</option>
            {['pending', 'under_review', 'investigating', 'resolved', 'closed', 'rejected'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Privacy Notice Banner */}
        <div style={{
          background: '#0d0d0d',
          border: '1px solid #30302d',
          borderRadius: '16px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 28,
          fontSize: '13px',
          color: '#8e8b84',
        }}>
          <Lock size={16} color="#EFEDE8" style={{ flexShrink: 0 }} />
          <span>
            Evidentiary custody and complainant data are <strong style={{ color: '#EFEDE8' }}>cryptographically sanitized</strong>.
            Identifying markers are masked with generic placeholders (e.g. <code style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>PERSON_1</code>).
          </span>
        </div>

        {/* Complaints list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#8e8b84', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            INITIALIZING REPOSITORY QUERY...
          </div>
        ) : complaints.length === 0 ? (
          <div style={{
            background: '#0d0d0d',
            border: '1px solid #30302d',
            borderRadius: '16px',
            textAlign: 'center',
            padding: 64,
          }}>
            <p style={{ color: '#8e8b84', fontSize: '16px', fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif", margin: 0 }}>
              No complaints match the specified search parameters.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
              {complaints.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -1 }}
                  style={{
                    cursor: 'pointer',
                    background: '#0d0d0d',
                    border: '1px solid #262522',
                    borderRadius: '20px',
                    padding: '24px 28px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    transition: 'border-color 0.16s ease',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#3b3b38'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#262522'; }}
                  onClick={() => navigate(`/complaint/${c.complaintId}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#EFEDE8', letterSpacing: '0.04em', fontFamily: "'IBM Plex Mono', monospace" }}>
                          {c.complaintId}
                        </span>
                        <span style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                          background: '#141414',
                          color: STATUS_COLORS[c.status] || '#8e8b84',
                          border: '1px solid #30302d',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>
                          {c.status.replace('_', ' ')}
                        </span>
                        {c.severity && (
                          <span style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                            background: '#141414',
                            color: SEVERITY_COLORS[c.severity] || '#8e8b84',
                            border: '1px solid #30302d',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            fontFamily: "'IBM Plex Sans', sans-serif"
                          }}>
                            {c.severity}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                          {c.category?.replace(/_/g, ' ')}
                        </span>
                        {!c.description && (
                          <span style={{
                            padding: '3px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: 700,
                            background: '#141414',
                            color: '#d8a43a',
                            border: '1px solid #30302d',
                            letterSpacing: '0.06em',
                            fontFamily: "'IBM Plex Sans', sans-serif"
                          }}>
                            MASKED
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f2f0ea', margin: '0 0 6px 0', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        {c.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#8e8b84', margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>
                        FILED: {format(new Date(c.createdAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 14 }}>
                      {c.mlPrediction?.confidence && (
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#EFEDE8', fontFamily: "'IBM Plex Mono', monospace" }}>
                          CONFIDENCE: {(c.mlPrediction.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                      <div style={{
                        fontSize: '12px', color: '#f2f0ea', fontWeight: 700,
                        background: '#141414', border: '1px solid #30302d', padding: '6px 14px', borderRadius: '8px',
                        fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}>
                        INSPECT →
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                  style={{
                    padding: '10px 20px',
                    background: '#0d0d0d',
                    border: '1px solid #30302d',
                    borderRadius: '8px',
                    color: '#f2f0ea',
                    fontWeight: 700,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: 'pointer',
                    opacity: page <= 1 ? 0.3 : 1
                  }}
                >
                  PREVIOUS
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                      style={{
                        width: 38, height: 38, borderRadius: '999px', border: '1px solid',
                        borderColor: p === page ? '#f2f0ea' : '#30302d',
                        background: p === page ? '#f2f0ea' : '#0d0d0d',
                        color: p === page ? '#070707' : '#8e8b84',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                        fontFamily: "'IBM Plex Sans', sans-serif"
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                  style={{
                    padding: '10px 20px',
                    background: '#0d0d0d',
                    border: '1px solid #30302d',
                    borderRadius: '8px',
                    color: '#f2f0ea',
                    fontWeight: 700,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: 'pointer',
                    opacity: page >= pagination.pages ? 0.3 : 1
                  }}
                >
                  NEXT
                </button>
              </div>
            )}
          </>
        )}

          </>
        ) : (
          /* ── RADAR TAB CONTENT ── */
          <div>
            {/* Radar Header & Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Active Threat Alerts', value: radarData.summary?.totalActiveThreats || 0, color: '#f2f0ea' },
                { label: 'Surging Modus Operandi', value: radarData.summary?.surgingCount || 0, color: '#d96464' },
                { label: 'Monitored Regions', value: radarData.summary?.activeRegionsCount || 0, color: '#3DF5C0' }
              ].map((s, i) => (
                <div key={i} style={{ background: '#0d0d0d', border: '1px solid #242421', borderRadius: '16px', padding: '20px 24px' }}>
                  <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Region & Category Filter Controls */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#8e8b84', fontWeight: 700 }}>
                <Compass size={15} color="#3DF5C0" />
                <span>FILTER JURISDICTION:</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Jaipur'].map(cName => (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => setRadarCity(cName)}
                    style={{
                      background: radarCity === cName ? '#171716' : '#0d0d0d',
                      border: `1px solid ${radarCity === cName ? '#3DF5C0' : '#262522'}`,
                      color: radarCity === cName ? '#3DF5C0' : '#8e8b84',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {cName === 'all' ? 'All Metros' : cName}
                  </button>
                ))}
              </div>
            </div>

            {/* Radar Feed Cards */}
            {radarLoading ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#8e8b84', fontSize: '13px', fontWeight: 700 }}>
                COMPILING ACTIVE REGIONAL THREAT TELEMETRY...
              </div>
            ) : (radarData.radarAlerts || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: '#0d0d0d', border: '1px solid #262522', borderRadius: 16, color: '#8e8b84' }}>
                No active threat alerts for this region.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(radarData.radarAlerts || []).map((alert, idx) => {
                  const isSurging = alert.severity === 'SURGING';
                  const isHigh = alert.severity === 'HIGH';
                  const badgeColor = isSurging ? '#d96464' : isHigh ? '#d8a43a' : '#3DF5C0';

                  return (
                    <motion.div
                      key={alert.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      style={{
                        background: '#0d0d0d',
                        border: `1px solid ${isSurging ? '#3b1c1c' : '#242421'}`,
                        borderRadius: '16px',
                        padding: '24px 28px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              background: isSurging ? '#261212' : '#141414',
                              border: `1px solid ${badgeColor}`,
                              color: badgeColor,
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 4,
                              letterSpacing: '0.08em',
                              fontFamily: "'IBM Plex Mono', monospace"
                            }}>
                              {alert.severity}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f2f0ea' }}>
                              📍 {alert.city}, {alert.state}
                            </span>
                            <span style={{ fontSize: '11px', color: '#8e8b84' }}>
                              • {alert.region}
                            </span>
                            <span style={{ fontSize: '11px', color: '#8e8b84', marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace" }}>
                              {alert.timeWindow}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f2f0ea', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                            {alert.threatTitle}
                          </h3>
                          <div style={{ fontSize: '11px', color: '#8e8b84', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                            CATEGORY: {alert.category} • {alert.incidentCount} INCIDENTS RECORDED
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/submit')}
                          style={{
                            background: '#141414',
                            border: '1px solid #30302d',
                            color: '#f2f0ea',
                            borderRadius: 6,
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <ShieldAlert size={14} color="#3DF5C0" />
                          <span>REPORT SIMILAR INCIDENT</span>
                        </button>
                      </div>

                      {/* Modus Operandi Narrative */}
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#d8d5ce', margin: '0 0 16px 0' }}>
                        {alert.modusOperandi}
                      </p>

                      {/* Citizen Precautionary Directive */}
                      <div style={{
                        background: '#141414',
                        border: '1px solid #30302d',
                        borderRadius: 8,
                        padding: '12px 16px',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        color: '#d8d5ce'
                      }}>
                        <div style={{ fontSize: '10px', color: '#3DF5C0', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                          🛡️ CITIZEN PREVENTIVE DIRECTIVE:
                        </div>
                        {alert.citizenDirective}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '11px', color: '#68665f' }}>
                        <span>Source: {alert.verifiedBy || 'CyberGuard Threat Ingestion'}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>REF: {alert.id}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
