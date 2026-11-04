import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { complaintsAPI } from '../services/api';

const STATUSES = ['pending','under_review','investigating','resolved','closed','rejected'];

export default function AdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [filters,    setFilters]    = useState({ status:'', category:'', severity: '', page: 1 });
  const [total,      setTotal]      = useState(0);
  const [statusForm, setStatusForm] = useState({ status:'', message:'' });
  const [updating,   setUpdating]   = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { limit: 15, ...filters };
      const { data } = await complaintsAPI.getAll(params);
      setComplaints(data.data.complaints);
      setTotal(data.data.pagination.total);
    } catch { toast.error('Failed to load complaints'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, [filters]);

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return toast.error('Select a status');
    setUpdating(true);
    try {
      await complaintsAPI.updateStatus(selected._id, statusForm);
      toast.success('Status updated successfully');
      setSelected(null);
      setStatusForm({ status:'', message:'' });
      fetchComplaints();
    } catch { toast.error('Update failed'); }
    finally  { setUpdating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint? This cannot be undone.')) return;
    try {
      await complaintsAPI.delete(id);
      toast.success('Complaint deleted');
      fetchComplaints();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="page-shell" style={{ 
      minHeight: '100dvh', 
      background: '#070707', 
      color: '#f2f0ea',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: "'IBM Plex Sans', sans-serif"
    }}>
      <Navbar />
      
      <main className="report-layout" style={{ 
        maxWidth: 1360, 
        margin: '0 auto', 
        padding: '44px 32px 100px',
        position: 'relative',
        zIndex: 1
      }}>

        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginBottom: 36 }}>
          <p className="eyebrow" style={{ color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 10px' }}>
            NATIONAL REPOSITORY OVERSIGHT
          </p>
          <h1 style={{ 
            fontSize: 'clamp(2.2rem, 3.2vw, 3rem)', 
            fontWeight: 800, 
            color: '#f2f0ea',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontFamily: "'IBM Plex Sans', sans-serif",
            margin: '0 0 10px 0'
          }}>
            Forensic Incident Backlog
          </h1>
          <p style={{ color: '#8e8b84', fontSize: '15px', fontWeight: 500, margin: 0 }}>
            Global repository oversight: {total} active incidents indexed across all agency partitions.
          </p>
        </header>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <select 
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            style={{ 
              width: 190, background: '#0d0d0d', border: '1px solid #30302d',
              borderRadius: '8px', padding: '12px 20px', color: '#f2f0ea',
              fontSize: '13px', fontWeight: 700, outline: 'none', fontFamily: "'IBM Plex Sans', sans-serif",
              cursor: 'pointer'
            }}
          >
            <option value="">ALL STATUSES</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').toUpperCase()}</option>)}
          </select>
          <select 
            value={filters.category}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
            style={{ 
              width: 210, background: '#0d0d0d', border: '1px solid #30302d',
              borderRadius: '8px', padding: '12px 20px', color: '#f2f0ea',
              fontSize: '13px', fontWeight: 700, outline: 'none', fontFamily: "'IBM Plex Sans', sans-serif",
              cursor: 'pointer'
            }}
          >
            <option value="">ALL CATEGORIES</option>
            {['phishing','identity_theft','online_fraud','cyberbullying','hacking','ransomware',
              'social_media_crime','financial_fraud','data_breach','child_exploitation','other'
            ].map(c => <option key={c} value={c}>{c.replace(/_/g,' ').toUpperCase()}</option>)}
          </select>
          <select 
            value={filters.severity}
            onChange={e => setFilters(f => ({ ...f, severity: e.target.value, page: 1 }))}
            style={{ 
              width: 170, background: '#0d0d0d', border: '1px solid #30302d',
              borderRadius: '8px', padding: '12px 20px', color: '#f2f0ea',
              fontSize: '13px', fontWeight: 700, outline: 'none', fontFamily: "'IBM Plex Sans', sans-serif",
              cursor: 'pointer'
            }}
          >
            <option value="">ALL SEVERITY</option>
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
          </select>
        </div>

        {/* Table Container */}
        <div style={{ 
          background: '#0d0d0d',
          border: '1px solid #30302d',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0,0,0,0.5)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #262522' }}>
                  {['INCIDENT ID','OBJECTIVE','CATEGORY','THREAT LEVEL','STATUS','LOCATION','DATE','OPERATIONS'].map(h => (
                    <th key={h} style={{ 
                      padding: '20px 24px', textAlign: 'left', fontSize: '11px',
                      color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em',
                      fontFamily: "'IBM Plex Sans', sans-serif"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 100, textAlign: 'center', color: '#8e8b84', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono', monospace" }}>SYNCHRONIZING REPOSITORY...</td></tr>
                ) : complaints.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#8e8b84', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>No active incidents match current filter parameters.</td></tr>
                ) : complaints.map((c, i) => (
                  <motion.tr 
                    key={c._id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    whileHover={{ backgroundColor: '#141414' }}
                    style={{ borderBottom: '1px solid #1a1a1a', transition: 'background-color 0.16s ease' }}
                  >
                    <td style={{ 
                      padding: '18px 24px', fontSize: '12px', fontWeight: 700, 
                      color: '#EFEDE8',
                      letterSpacing: '0.04em',
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}>
                      {c.complaintId}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f2f0ea', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 500, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                        USER: {c.userId?.name || 'ANONYMOUS'}
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', fontSize: '11px', color: '#f2f0ea', fontWeight: 700, textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {c.category?.replace(/_/g,' ')}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                        background: '#141414',
                        color: c.severity === 'high' ? '#d96464' : c.severity === 'medium' ? '#d8a43a' : '#3DF5C0',
                        border: '1px solid #30302d',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        fontFamily: "'IBM Plex Sans', sans-serif"
                      }}>
                        {c.severity}
                      </span>
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                        background: '#141414',
                        color: c.status === 'resolved' ? '#10b981' : c.status === 'rejected' ? '#d96464' : '#3DF5C0',
                        border: '1px solid #30302d',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        fontFamily: "'IBM Plex Sans', sans-serif"
                      }}>
                        {c.status.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td style={{ padding: '18px 24px', fontSize: '12px', color: '#a6a39b', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {c.victimDetails?.pincode || 'N/A'}
                    </td>
                    <td style={{ padding: '18px 24px', fontSize: '12px', color: '#8e8b84', fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {format(new Date(c.createdAt), 'dd MMM yy')}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => navigate(`/complaint/${c.complaintId}`)}
                          style={{ background: '#141414', border: '1px solid #30302d',
                            color: '#f2f0ea', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer' }}>
                          VIEW
                        </button>
                        <button onClick={() => { setSelected(c); setStatusForm({ status: c.status, message: '' }); }}
                          style={{ background: '#141414', border: '1px solid #30302d',
                            color: '#EFEDE8', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer' }}>
                          UPDATE
                        </button>
                        <button onClick={() => handleDelete(c._id)}
                          style={{ background: '#141414', border: '1px solid #30302d',
                            color: '#d96464', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer' }}>
                          PURGE
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ 
            padding: '20px 28px', borderTop: '1px solid #262522',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#0d0d0d'
          }}>
            <span style={{ fontSize: '12px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              PAGE {filters.page} / {Math.ceil(total / 15) || 1}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                style={{ 
                  padding: '8px 18px', background: '#141414', border: '1px solid #30302d',
                  borderRadius: '8px', color: '#f2f0ea', fontWeight: 700, fontSize: '12px', fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer', opacity: filters.page <= 1 ? 0.3 : 1
                }}
              >PREV</button>
              <button 
                disabled={filters.page >= Math.ceil(total / 15)}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                style={{ 
                  padding: '8px 18px', background: '#141414', border: '1px solid #30302d',
                  borderRadius: '8px', color: '#f2f0ea', fontWeight: 700, fontSize: '12px', fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer', opacity: filters.page >= Math.ceil(total / 15) ? 0.3 : 1
                }}
              >NEXT</button>
            </div>
          </div>
        </div>

        {/* Status update modal */}
        <AnimatePresence>
          {selected && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,7,7,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 15 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                style={{ 
                  width: '100%', maxWidth: 520, background: '#0d0d0d',
                  border: '1px solid #30302d',
                  borderRadius: '16px', padding: '36px', boxShadow: '0 24px 70px rgba(0,0,0,0.7)'
                }}
              >
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f2f0ea', marginBottom: 6, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Update Case Protocol
                </h3>
                <p style={{ fontSize: '13px', color: '#8e8b84', marginBottom: 28, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {selected.complaintId} — {selected.title}
                </p>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b84', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    Target Status
                  </label>
                  <select 
                    value={statusForm.status}
                    onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
                    style={{ 
                      width: '100%', background: '#141414', border: '1px solid #30302d',
                      borderRadius: '8px', padding: '12px 18px', color: '#f2f0ea', fontSize: '13px', fontWeight: 700, outline: 'none',
                      fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer', boxSizing: 'border-box'
                    }}
                  >
                    <option value="">SELECT STATUS PROTOCOL...</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').toUpperCase()}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b84', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    Neutralization Summary (Optional)
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Enter forensic update for the source..."
                    value={statusForm.message}
                    onChange={e => setStatusForm(f => ({ ...f, message: e.target.value }))}
                    style={{ 
                      width: '100%', background: '#141414', border: '1px solid #30302d',
                      borderRadius: '16px', padding: '14px', color: '#f2f0ea', fontSize: '13px', outline: 'none', resize: 'none',
                      boxSizing: 'border-box', fontFamily: "'IBM Plex Sans', sans-serif"
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    style={{ 
                      flex: 1, padding: '14px', borderRadius: '999px', background: '#141414',
                      border: '1px solid #30302d', color: '#8e8b84', fontWeight: 700, fontSize: '13px', fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer'
                    }} 
                    onClick={() => setSelected(null)}
                  >
                    ABORT
                  </button>
                  <button 
                    style={{ 
                      flex: 1, padding: '14px', borderRadius: '999px', background: '#f2f0ea',
                      border: 'none', color: '#070707', fontWeight: 700, fontSize: '13px', fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer'
                    }}
                    onClick={handleStatusUpdate} 
                    disabled={updating}
                  >
                    {updating ? 'EXECUTING...' : 'COMMIT CHANGES'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
