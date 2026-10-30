import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { complaintsAPI } from '../services/api';
import { onStatusUpdate, offStatusUpdate } from '../services/socket';
import useAuthStore from '../hooks/useAuthStore';

const STATUS_COLORS = {
  pending:'#FFD600', under_review:'#00B4FF', investigating:'#FF6B35',
  resolved:'#00C896', closed:'#5A6480', rejected:'#FF5252'
};

export default function OfficerDashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchComplaints = useCallback(async () => {
    try {
      const { data } = await complaintsAPI.getAll({ 
        status: statusFilter || undefined, 
        search: search || undefined,
        page: page,
        limit: 10
      });
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
  }, [statusFilter, search, page]);

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
    { label: 'Total Assigned/Pending',  value: stats.total,      color: '#00B4FF' },
    { label: 'Pending Assignment',      value: stats.pending,    color: '#FFD600' },
    { label: 'In Progress',  value: stats.inProgress, color: '#FF6B35' },
    { label: 'Resolved',     value: stats.resolved,   color: '#00C896' },
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
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(255, 167, 38, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 180, 255, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />
      
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '80px 24px',
        position: 'relative',
        zIndex: 1
      }}>

        <div style={{ marginBottom: 48 }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 800, 
            background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2.5px',
            margin: '0 0 12px 0'
          }}>Officer <span style={{ color: '#FFA726' }}>Dashboard</span></h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 500 }}>Monitor your assigned investigations and claim pending cases.</p>
        </div>

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
            placeholder="Search complaints…"
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
            <option value="">ALL STATUSES</option>
            {['pending','under_review','investigating','resolved', 'closed','rejected'].map(s =>
              <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
          </select>
        </div>

        {/* Complaint List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.5)' }}>LOADING ENCRYPTED DATA...</div>
        ) : complaints.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '100px 20px', 
            background: 'rgba(255,255,255,0.02)', borderRadius: '32px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <img src="/icons/cyberguard/evidence-folder.svg" alt="" style={{ width: 48, height: 48, marginBottom: 16, objectFit: "contain" }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: 8, color: '#fff' }}>NO RECORDS FOUND</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Your case list is currently empty.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {complaints.map((c, i) => (
              <motion.div 
                key={c.complaintId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/complaint/${c.complaintId}`)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '24px',
                  padding: '30px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: '0.3s',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.transform = 'translateX(10px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 167, 38, 0.3)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ 
                      background: 'rgba(0, 180, 255, 0.1)', 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      color: '#00B4FF', 
                      fontWeight: 800,
                      letterSpacing: '1px'
                    }}>
                      {c.complaintId}
                    </div>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                      {format(new Date(c.createdAt), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 8px 0', fontWeight: 800 }}>{c.category}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0, maxWidth: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.title}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  {c.assignedTo ? (
                    <div style={{ textAlign: 'right' }}>
                       <span style={{ fontSize: '10px', color: '#00C896', fontWeight: 800, textTransform: 'uppercase' }}>ASSIGNED TO YOU</span>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right' }}>
                       <span style={{ fontSize: '10px', color: '#FFD600', fontWeight: 800, textTransform: 'uppercase' }}>UNASSIGNED</span>
                    </div>
                  )}

                  <div style={{ 
                    background: (STATUS_COLORS[c.status] || '#00B4FF') + '15',
                    color: STATUS_COLORS[c.status] || '#00B4FF',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    border: `1px solid ${STATUS_COLORS[c.status]}33`,
                    minWidth: '120px',
                    textAlign: 'center'
                  }}>
                    {c.status.replace(/_/g,' ').toUpperCase()}
                  </div>
                  <div style={{ color: "#00B4FF", opacity: 0.5 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
