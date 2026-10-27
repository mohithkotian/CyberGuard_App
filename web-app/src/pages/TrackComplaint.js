import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { complaintsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import SecureChat from '../components/SecureChat';

const STATUS_COLOR = {
  pending:'#FFD600', under_review:'#00B4FF', investigating:'#FF6B35',
  resolved:'#00C896', closed:'#5A6480', rejected:'#FF5252'
};

export default function TrackComplaint() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [id,          setId]        = useState(complaintId || '');
  const [complaint,   setComplaint] = useState(null);
  const [loading,     setLoading]   = useState(false);
  const [error,       setError]     = useState('');

  const track = async (searchId) => {
    const q = (searchId || id).trim();
    if (!q) return;
    setLoading(true); setError(''); setComplaint(null);
    try {
      const { data } = await complaintsAPI.track(q);
      setComplaint(data.data.complaint);
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint not found. Please check the ID.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (complaintId) track(complaintId); }, [complaintId]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#02060A', 
      color: '#fff', 
      position: 'relative', 
      overflowX: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Liquid Background Accents */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        
        {/* Navigation & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 64 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <button 
                onClick={() => navigate('/')}
                style={{ 
                  width: 50, height: 50, borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.05)', 
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#00B4FF', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <div>
                <h1 style={{ 
                  fontSize: '2.4rem', 
                  margin: 0, 
                  fontWeight: 800,
                  background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-1px'
                }}>Track Status</h1>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>Encrypted Verification Node</span>
              </div>
            </div>
          </motion.div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: '12px', color: '#00FFD1', fontWeight: 800, letterSpacing: '1px' }}>TLS 1.3 SECURE</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>IDENTITY PROTECTED</div>
          </div>
        </div>

        {/* Search Section - Liquid Glass Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '32px',
            padding: '50px',
            marginBottom: 48,
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            textAlign: 'center'
          }}
        >
          <div style={{ maxWidth: 540, margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '12px', fontWeight: 700 }}>Reference Credentials</h3>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px', lineHeight: '1.6' }}>Enter the unique tracking hash provided during your encrypted report submission.</p>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <svg style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  style={{ 
                    width: '100%',
                    padding: '18px 24px 18px 56px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '18px',
                    color: '#fff',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    outline: 'none',
                    transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  className="liquid-input"
                  placeholder="CC-XXXX-XXXXXX"
                  value={id} 
                  onChange={e => setId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && track()}
                />
              </div>
              <button 
                onClick={() => track()} 
                disabled={loading}
                style={{ 
                  flex: '0 0 160px',
                  background: 'linear-gradient(135deg, #007AFF 0%, #00B4FF 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '18px',
                  height: '58px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 10px 25px rgba(0, 122, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 122, 255, 0.5)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 122, 255, 0.3)';
                }}
              >
                {loading ? 'SYNCING...' : 'PULL DATA'}
              </button>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#FF3B30', marginTop: '20px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </motion.div>
            )}
          </div>
        </motion.div>

        {!complaint && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { 
                t: 'Zero Knowledge', 
                d: 'Case details are encrypted. Only authenticated owners can track status.', 
                i: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00B4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> 
              },
              { 
                t: 'Liquid Sync', 
                d: 'Investigative updates are pushed instantly via secure WebSocket streams.', 
                i: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFD1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg> 
              },
              { 
                t: 'Neural Scan', 
                d: 'AI signatures are cross-referenced across global darknet threat feeds.', 
                i: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg> 
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                style={{ 
                  padding: '30px', 
                  background: 'rgba(255,255,255,0.02)', 
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.05)', 
                  borderRadius: '24px', 
                  textAlign: 'center',
                  transition: '0.4s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', opacity: 0.8 }}>{item.i}</div>
                <h4 style={{ fontSize: '14px', color: '#fff', marginBottom: '10px', fontWeight: 700 }}>{item.t}</h4>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>{item.d}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Result Container */}
        {complaint && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            {/* Case Header Card */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '32px',
              padding: '40px',
              marginBottom: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                <div style={{ flex: '1 1 400px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ 
                      background: 'rgba(0, 180, 255, 0.1)', 
                      padding: '6px 14px', 
                      borderRadius: '10px', 
                      fontSize: '11px', 
                      color: '#00B4FF', 
                      fontWeight: 800,
                      letterSpacing: '1px',
                      fontFamily: 'monospace' 
                    }}>
                      {complaint.complaintId}
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OFFICIAL RECORD</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', color: '#fff', margin: '0 0 16px 0', fontWeight: 800, letterSpacing: '-0.5px' }}>{complaint.title}</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    <span>▦ {format(new Date(complaint.createdAt), 'dd MMM yyyy')}</span>
                    <span>▤ {complaint.category}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                  <div style={{ 
                    background: (STATUS_COLOR[complaint.status] || '#00B4FF') + '15',
                    color: STATUS_COLOR[complaint.status] || '#00B4FF',
                    padding: '8px 20px',
                    borderRadius: '14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    border: `1px solid ${STATUS_COLOR[complaint.status]}33`,
                    boxShadow: `0 0 20px ${STATUS_COLOR[complaint.status]}11`
                  }}>
                    {complaint.status.replace(/_/g,' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Criticality: <span style={{ color: complaint.severity === 'high' ? '#FF3B30' : '#FFD600' }}>{complaint.severity.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline - Liquid Style */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '32px',
              padding: '40px',
              marginBottom: '48px'
            }}>
              <h3 style={{ fontSize: '12px', color: '#fff', marginBottom: '40px', fontWeight: 800, letterSpacing: '2px', textAlign: 'center' }}>
                IMMUTABLE CHAIN OF CUSTODY
              </h3>
              <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
                <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, rgba(0,180,255,0.5), rgba(0,180,255,0.05))' }} />
                {(complaint.timeline || []).map((t, i) => {
                  const isLast = i === (complaint.timeline.length - 1);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      style={{ display: 'flex', gap: '30px', marginBottom: '32px', position: 'relative' }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                        background: isLast ? (STATUS_COLOR[t.status] || '#00B4FF') : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${isLast ? '#fff' : (STATUS_COLOR[t.status] || '#00B4FF')}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isLast ? `0 0 25px ${STATUS_COLOR[t.status] || '#00B4FF'}88` : 'none',
                        backdropFilter: 'blur(10px)'
                      }}>
                        {t.status === 'resolved' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isLast ? "#fff" : "#00C896"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLast ? '#fff' : (STATUS_COLOR[t.status] || '#00B4FF') }} />
                        )}
                      </div>
                      <div style={{ paddingTop: '8px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                          {t.message}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                          {format(new Date(t.timestamp), 'dd MMM yyyy • HH:mm')}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Secure Chat */}
            {user && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FFD1', boxShadow: '0 0 10px #00FFD1' }} />
                  <h3 style={{ fontSize: '12px', color: '#fff', fontWeight: 800, letterSpacing: '2px' }}>
                    DIRECT AGENT COMMUNICATION
                  </h3>
                </div>
                <div style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  borderRadius: '32px', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  backdropFilter: 'blur(40px)'
                }}>
                  <SecureChat complaintId={complaint._id} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <style>
        {`
          .liquid-input:focus {
            background: rgba(255,255,255,0.06) !important;
            border-color: rgba(0, 122, 255, 0.5) !important;
            box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15), inset 0 2px 4px rgba(0,0,0,0.2) !important;
          }
        `}
      </style>
    </div>
  );
}
