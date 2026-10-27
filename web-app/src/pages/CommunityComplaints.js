import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { complaintsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';

const STATUS_COLORS = {
  pending: '#FFD600', under_review: '#00B4FF', investigating: '#FF6B35',
  resolved: '#00C896', closed: '#5A6480', rejected: '#FF5252'
};

const SEVERITY_COLORS = { high: '#FF3B30', medium: '#FF9500', low: '#FFD600' };

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
    { label: 'Total Reports', value: stats.total, color: '#00B4FF' },
    { label: 'Pending',       value: stats.pending,    color: '#FFD600' },
    { label: 'In Progress',   value: stats.inProgress, color: '#FF6B35' },
    { label: 'Resolved',      value: stats.resolved,   color: '#00C896' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#02060A',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Atmospheric accents */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '55%', height: '55%', background: 'radial-gradient(circle, rgba(160,32,240,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '55%', height: '55%', background: 'radial-gradient(circle, rgba(0,180,255,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(160,32,240,0.2), rgba(0,180,255,0.2))',
              border: '1px solid rgba(160,32,240,0.4)',
              borderRadius: '14px',
              padding: '8px 16px',
              fontSize: '10px',
              fontWeight: 900,
              color: '#A855F7',
              letterSpacing: '2px',
            }}>
              ◉ PUBLIC BROWSER
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '1px' }}>
              ANONYMISED • PII PROTECTED
            </div>
          </div>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2.5px',
            margin: '0 0 12px 0',
          }}>
            Community <span style={{ color: '#A855F7' }}>Complaints</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 500 }}>
            Browse all reported incidents across the CyberGuard network. Personal data is masked to protect privacy.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 48 }}>
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '32px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: s.color, letterSpacing: '-1px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 8 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <input
            placeholder="Search complaints…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1, minWidth: 260,
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '16px 24px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
            }}
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              width: 200,
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '0 16px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">ALL STATUSES</option>
            {['pending', 'under_review', 'investigating', 'resolved', 'closed', 'rejected'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Privacy notice banner */}
        <div style={{
          background: 'rgba(168,85,247,0.08)',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: '16px',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 32,
          fontSize: '13px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          <span style={{ fontSize: '18px' }}>◇</span>
          <span>
            All personal information in community complaints is <strong style={{ color: '#A855F7' }}>masked by the server</strong> before reaching your browser.
            You will see <strong style={{ color: '#A855F7' }}>PERSON_1</strong>, <strong style={{ color: '#A855F7' }}>PHONE_1</strong>, etc. instead of real PII.
            Only the complaint owner or an Admin can view the original data.
          </span>
        </div>

        {/* Complaints list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 120, color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: 800, letterSpacing: '2px' }}>
            LOADING COMMUNITY DATA...
          </div>
        ) : complaints.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '32px',
            textAlign: 'center',
            padding: 80,
          }}>
            <div style={{ fontSize: '64px', marginBottom: 24 }}>▤</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 500 }}>
              No complaints found in the community registry.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
              {complaints.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.005, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  style={{
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '24px',
                    padding: '28px 32px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => navigate(`/complaint/${c.complaintId}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#A855F7', letterSpacing: '1px' }}>
                          {c.complaintId}
                        </span>
                        <span style={{
                          padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 900,
                          background: `${STATUS_COLORS[c.status] || '#5A6480'}1A`,
                          color: STATUS_COLORS[c.status] || '#5A6480',
                          border: `1px solid ${STATUS_COLORS[c.status] || '#5A6480'}33`,
                          textTransform: 'uppercase', letterSpacing: '1px',
                        }}>
                          {c.status.replace('_', ' ')}
                        </span>
                        {c.severity && (
                          <span style={{
                            padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 900,
                            background: `${SEVERITY_COLORS[c.severity] || '#FFD600'}1A`,
                            color: SEVERITY_COLORS[c.severity] || '#FFD600',
                            border: `1px solid ${SEVERITY_COLORS[c.severity] || '#FFD600'}33`,
                            textTransform: 'uppercase', letterSpacing: '1px',
                          }}>
                            {c.severity}
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {c.category?.replace('_', ' ')}
                        </span>
                        {/* Masked indicator badge */}
                        {!c.description && (
                          <span style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: 900,
                            background: 'rgba(168,85,247,0.15)',
                            color: '#A855F7',
                            border: '1px solid rgba(168,85,247,0.3)',
                            letterSpacing: '1px',
                          }}>
                            ◇ MASKED
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.3px' }}>
                        {c.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                        Filed on {format(new Date(c.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: STATUS_COLORS[c.status] || '#5A6480',
                        boxShadow: `0 0 12px ${STATUS_COLORS[c.status] || '#5A6480'}`,
                      }} />
                      {c.mlPrediction?.confidence && (
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#00FFD1', letterSpacing: '1px' }}>
                          AI: {(c.mlPrediction.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                      <div style={{
                        fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                        background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '8px',
                      }}>
                        VIEW →
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 40, paddingBottom: 80 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                  style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: page <= 1 ? 0.3 : 1 }}
                >
                  PREVIOUS
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                      style={{
                        width: 44, height: 44, borderRadius: '16px', border: '1px solid',
                        borderColor: p === page ? '#A855F7' : 'rgba(255,255,255,0.1)',
                        background: p === page ? 'rgba(168,85,247,0.1)' : 'transparent',
                        color: p === page ? '#A855F7' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                  style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: page >= pagination.pages ? 0.3 : 1 }}
                >
                  NEXT
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
