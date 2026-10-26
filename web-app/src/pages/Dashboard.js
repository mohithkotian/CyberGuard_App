import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { complaintsAPI } from '../services/api';
import { onStatusUpdate, offStatusUpdate } from '../services/socket';
import useAuthStore from '../hooks/useAuthStore';
import useTranslationStore from '../hooks/useTranslationStore';

const STATUS_COLORS = {
  pending:'#FFD600', under_review:'#00B4FF', investigating:'#FF6B35',
  resolved:'#00C896', closed:'#5A6480', rejected:'#FF5252'
};

function DashboardIcon({ name, size = 28 }) {
  const paths = {
    gamepad: <><rect x="3" y="7" width="18" height="11" rx="5" /><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01" /></>,
    arrow: <><path d="M5 12h13M13 7l5 5-5 5" /></>,
    inbox: <><path d="M4 5h16v14H4z" /><path d="M4 13h4l2 3h4l2-3h4" /></>
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const { t }     = useTranslationStore();
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchComplaints = useCallback(async () => {
    try {
      const params = { 
        status: statusFilter || undefined, 
        search: search || undefined,
        page: page,
        limit: 10
      };
      // User role: pass scope=own to see only their own complaints (MY COMPLAINTS)
      // Admin/Officer: no scope needed, they already see all
      if (user?.role === 'user') {
        params.scope = 'own';
      }
      const { data } = await complaintsAPI.getAll(params);
      setComplaints(data.data.complaints);
      
      const s = data.data.stats || {};
      setStats({
        total: data.data.pagination.total || 0,
        pending: s.pending || 0,
        inProgress: (s.under_review || 0) + (s.investigating || 0) + (s.in_progress || 0),
        resolved: s.resolved || 0
      });
      setPagination(data.data.pagination);
    } catch { toast.error('Failed to load complaints'); }
    finally  { setLoading(false); }
  }, [statusFilter, search, page, user?.role]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Real-time status updates
  useEffect(() => {
    const handler = ({ complaintId, status }) => {
      fetchComplaints();
      toast.success(`Complaint ${complaintId}: ${status.replace('_',' ')}`);
    };
    onStatusUpdate(handler);
    return () => offStatusUpdate(handler);
  }, [fetchComplaints]);

  const statCards = [
    { label: t('DASHBOARD.TOTAL_FILED', 'Total Filed'),  value: stats.total,      color: '#00B4FF' },
    { label: t('DASHBOARD.PENDING', 'Pending'),      value: stats.pending,    color: '#FFD600' },
    { label: t('DASHBOARD.IN_PROGRESS', 'In Progress'),  value: stats.inProgress, color: '#FF6B35' },
    { label: t('DASHBOARD.RESOLVED', 'Resolved'),     value: stats.resolved,   color: '#00C896' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#02060A', 
      color: '#fff',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Liquid Atmospheric Accents */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 255, 209, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />
      
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '80px 24px',
        position: 'relative',
        zIndex: 1
      }}>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 800, 
            background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2.5px',
            margin: '0 0 12px 0'
          }}>{user?.role === 'admin' || user?.role === 'officer' ? t('DASHBOARD.ALL_COMPLAINTS', 'All Complaints') : t('DASHBOARD.MY_COMPLAINTS', 'My Complaints')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 500 }}>
            {user?.role === 'admin' || user?.role === 'officer' ? t('DASHBOARD.SUBTITLE_ADMIN', 'Full system access — all complaints across all users.') : t('DASHBOARD.SUBTITLE', 'Monitor and regulate your secure filings within the CyberGuard network.')}
          </p>
        </div>

        {/* Gamified Cyber Awareness Hub Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 180, 255, 0.12) 0%, rgba(0, 255, 209, 0.05) 100%)',
            border: '1px solid rgba(0, 180, 255, 0.3)',
            borderRadius: '24px',
            padding: '24px 32px',
            marginBottom: '36px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
            boxShadow: '0 10px 30px rgba(0, 180, 255, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00B4FF, #00FFD1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 0 20px rgba(0, 180, 255, 0.4)'
            }}>
              <DashboardIcon name="gamepad" size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#00FFD1', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  NEW CITIZEN DEFENSE ARENA
                </span>
                <span style={{ background: 'rgba(255, 214, 0, 0.15)', color: '#FFD600', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                  EARN XP & BADGES
                </span>
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px 0', color: '#fff' }}>
                {t('LEARN.TITLE', 'Gamified Cyber Awareness Hub')}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 13, maxWidth: 620 }}>
                {t('LEARN.SUBTITLE', 'Master modern cyber defense in 1-minute interactive scenario quizzes and claim your official Cyber Defender Certificate.')}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/learn')}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00B4FF 0%, #007AFF 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: 12,
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 180, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <span>{t('LEARN.START_CHALLENGE', 'START 1-MIN DEFENDER QUIZ')}</span>
            <DashboardIcon name="arrow" size={18} />
          </button>
        </motion.div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 48 }}>
          {statCards.map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{ 
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '32px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ fontSize: '36px', fontWeight: 900, color: s.color, letterSpacing: '-1px' }}>
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
            className="liquid-input"
            placeholder={t('COMMON.SEARCH', 'Search complaints…')}
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ 
              flex: 1, 
              minWidth: 260,
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '16px 24px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none'
            }} 
          />
          <select 
            className="liquid-select"
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ 
              width: 200,
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '0 16px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">{t('DASHBOARD.ALL_STATUSES', 'ALL STATUSES')}</option>
            {['pending','under_review','investigating','resolved', 'closed','rejected'].map(s =>
              <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
          </select>
          <button 
            onClick={() => navigate('/chat')} 
            style={{ 
              whiteSpace: 'nowrap', 
              background: 'linear-gradient(135deg, #AF52DE 0%, #007AFF 100%)', 
              border: 'none',
              padding: '16px 28px',
              borderRadius: '20px',
              color: '#fff',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(175, 82, 222, 0.3)'
            }}
          >
            {t('NAVBAR.COMMS', 'NETWORK CHAT')}
          </button>
          <button 
            onClick={() => navigate('/submit')}
            style={{ 
              whiteSpace: 'nowrap',
              background: '#fff',
              border: 'none',
              padding: '16px 28px',
              borderRadius: '20px',
              color: '#000',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(255, 255, 255, 0.1)'
            }}
          >
            + {t('DASHBOARD.NEW_COMPLAINT', 'NEW FILING')}
          </button>
        </div>

        {/* Complaints list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 120, color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: 800, letterSpacing: '2px' }}>INITIALIZING DATA STREAM...</div>
        ) : complaints.length === 0 ? (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '32px',
            textAlign: 'center', 
            padding: 80 
          }}>
            <div style={{ fontSize: '64px', marginBottom: 24, color: 'rgba(255,255,255,0.4)' }}>
              <DashboardIcon name="inbox" size={64} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16, fontSize: '18px', fontWeight: 500 }}>
              {user?.role === 'user' ? "You haven't filed any complaints yet." : "No complaints found."}
            </p>
            {user?.role === 'user' && (
              <p style={{ color: 'rgba(255,255,255,0.25)', marginBottom: 32, fontSize: '14px' }}>
                Want to browse all reported incidents? Visit{' '}
                <span 
                  onClick={() => navigate('/community')} 
                  style={{ color: '#A855F7', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Community Complaints
                </span>.
              </p>
            )}
            <button className="liquid-btn-primary" onClick={() => navigate('/submit')}>FILE INITIAL REPORT</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
              {complaints.map((c, i) => (
                <motion.div 
                  key={c._id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  style={{ 
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                  }}
                  onClick={() => navigate(`/complaint/${c.complaintId}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#007AFF', letterSpacing: '1px' }}>
                          {c.complaintId}
                        </span>
                        <span style={{ 
                          padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 900,
                          background: `${STATUS_COLORS[c.status] || '#5A6480'}1A`,
                          color: STATUS_COLORS[c.status] || '#5A6480',
                          border: `1px solid ${STATUS_COLORS[c.status] || '#5A6480'}33`,
                          textTransform: 'uppercase', letterSpacing: '1px'
                        }}>
                          {c.status.replace('_',' ')}
                        </span>
                        {c.severity && (
                          <span style={{ 
                            padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 900,
                            background: c.severity === 'high' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                            color: c.severity === 'high' ? '#FF3B30' : '#FF9500',
                            border: `1px solid ${c.severity === 'high' ? '#FF3B3033' : '#FF950033'}`,
                            textTransform: 'uppercase', letterSpacing: '1px'
                          }}>
                            {c.severity}
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {c.category?.replace('_',' ')}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' }}>{c.title}</h3>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                        Filed on {format(new Date(c.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        width: 12, height: 12, borderRadius: '50%',
                        background: STATUS_COLORS[c.status] || '#5A6480',
                        boxShadow: `0 0 15px ${STATUS_COLORS[c.status] || '#5A6480'}`,
                        marginLeft: 'auto', marginBottom: 12
                      }} />
                      {c.mlPrediction?.confidence && (
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#00FFD1', letterSpacing: '1px' }}>
                          AI CONFIDENCE: {(c.mlPrediction.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 40, paddingBottom: 80 }}>
                <button 
                  disabled={page <= 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo(0,0); }}
                  style={{ 
                    padding: '12px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px', color: '#fff', fontWeight: 700, cursor: 'pointer', transition: '0.3s',
                    opacity: page <= 1 ? 0.3 : 1
                  }}
                >
                  PREVIOUS
                </button>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo(0,0); }}
                      style={{
                        width: 44, height: 44, borderRadius: '16px', border: '1px solid',
                        borderColor: p === page ? '#007AFF' : 'rgba(255,255,255,0.1)',
                        background: p === page ? 'rgba(0,122,255,0.1)' : 'transparent',
                        color: p === page ? '#007AFF' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer', fontSize: '14px', fontWeight: 800, transition: '0.3s'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button 
                  disabled={page >= pagination.pages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo(0,0); }}
                  style={{ 
                    padding: '12px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px', color: '#fff', fontWeight: 700, cursor: 'pointer', transition: '0.3s',
                    opacity: page >= pagination.pages ? 0.3 : 1
                  }}
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
