import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { complaintsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import SecureChat from '../components/SecureChat';

const STATUS_COLORS = {
  pending:'#FFD600', under_review:'#00B4FF', investigating:'#FF6B35',
  resolved:'#00C896', closed:'#5A6480', rejected:'#FF5252'
};

export default function ComplaintDetails() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const downloadEvidence = async (file) => {
    try {
      const response = await complaintsAPI.getEvidence(complaintId, file.filename);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (_) {
      toast.error('Evidence download was not authorized or is unavailable.');
    }
  };

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const { data } = await complaintsAPI.getOne(complaintId);
        setComplaint(data.data.complaint);
      } catch (err) {
        if (err.response?.status === 403) {
          setAccessDenied(true);
        } else {
          toast.error('Failed to load complaint details.');
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    if (complaintId) fetchComplaint();
  }, [complaintId, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#02060A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        LOADING SECURE DATA...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={{ minHeight: '100vh', background: '#02060A', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ color: '#FF3B30', fontSize: '2.5rem', marginBottom: '16px', fontWeight: 800 }}>ACCESS DENIED</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', marginBottom: '32px' }}>
          You don't have permission to view this complaint.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', 
            padding: '12px 24px', 
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          RETURN TO DASHBOARD
        </button>
      </div>
    );
  }

  if (!complaint) return null;

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
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(160, 32, 240, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />
      
      <div style={{ 
        maxWidth: 1000, 
        margin: '0 auto', 
        padding: '40px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', 
            padding: '10px 20px', 
            borderRadius: '12px',
            cursor: 'pointer',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          ❮ BACK
        </button>

        {/* Case Header */}
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
                <span>📅 {format(new Date(complaint.createdAt), 'dd MMM yyyy HH:mm')}</span>
                <span>📂 {complaint.category}</span>
                {complaint.source && <span>🌐 Source: {complaint.source.toUpperCase()}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ 
                background: (STATUS_COLORS[complaint.status] || '#00B4FF') + '15',
                color: STATUS_COLORS[complaint.status] || '#00B4FF',
                padding: '8px 20px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 800,
                border: `1px solid ${STATUS_COLORS[complaint.status]}33`,
                boxShadow: `0 0 20px ${STATUS_COLORS[complaint.status]}11`
              }}>
                {complaint.status.replace(/_/g,' ').toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Criticality: <span style={{ color: complaint.severity === 'high' ? '#FF3B30' : complaint.severity === 'medium' ? '#FF9500' : '#FFD600' }}>{complaint.severity.toUpperCase()}</span>
              </div>
              {complaint.assignedTo && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Assigned Officer: <span style={{ color: '#00C896' }}>{complaint.assignedTo.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Incident Details — ONE panel only, determined by what the backend returns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '32px',
              borderRadius: '24px',
              border: complaint.description
                ? '1px solid rgba(255,255,255,0.05)'
                : '1px dashed rgba(168,85,247,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', color: complaint.description ? '#00B4FF' : '#A855F7', fontWeight: 800, letterSpacing: '1.5px', margin: 0 }}>
                  INCIDENT BRIEF
                </h4>
                {!complaint.description && (
                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#A855F7', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '6px', padding: '2px 8px', letterSpacing: '1px' }}>🔒 MASKED</span>
                )}
              </div>
              <p style={{ fontSize: '15px', color: complaint.description ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                {complaint.description || complaint.maskedDescription || 'Content restricted.'}
              </p>
            </div>
          </div>

          {/* Victim & Suspect Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: '11px', color: '#FF3B30', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '16px' }}>VICTIM DETAILS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Name</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{complaint.victimDetails?.name || complaint.userId?.name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Phone</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{complaint.victimDetails?.mobile || complaint.userId?.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Location / Pincode</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{complaint.victimDetails?.location || 'N/A'} - {complaint.victimDetails?.pincode || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Incident Time</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{complaint.victimDetails?.incidentDate ? format(new Date(complaint.victimDetails.incidentDate), 'dd MMM yyyy') : format(new Date(complaint.createdAt), 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: '11px', color: '#FF9500', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '16px' }}>SUSPECT DETAILS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Name / Handle</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{complaint.suspectInfo?.name || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Other Details</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, whiteSpace: 'pre-wrap' }}>{complaint.suspectInfo?.details || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence & AI Analysis */}
        {(complaint.evidence?.length > 0 || complaint.mlPrediction || complaint.ocrData?.rawText) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            
            {/* Evidence List */}
            {complaint.evidence && complaint.evidence.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '16px' }}>SECURED EVIDENCE ({complaint.evidence.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {complaint.evidence.map((file, idx) => (
                    <button
                      key={idx} 
                      type="button"
                      onClick={() => downloadEvidence(file)}
                      style={{ 
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px', padding: '14px 20px', color: '#fff', textDecoration: 'none',
                        fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', transition: '0.3s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#00B4FF'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                      {file.originalName || `Evidence File ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI / ML Data */}
            {(complaint.mlPrediction || complaint.ocrData?.rawText) && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '11px', color: '#A855F7', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '16px' }}>AI ANALYSIS & OCR</h4>
                
                {complaint.mlPrediction && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Categorization Confidence</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round(complaint.mlPrediction.confidence * 100)}%`, background: '#A855F7', height: '100%' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#A855F7' }}>{Math.round(complaint.mlPrediction.confidence * 100)}%</span>
                    </div>
                  </div>
                )}

                {complaint.ocrData?.rawText && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>OCR Extracted Data (from Evidence)</div>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px',
                      fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace',
                      maxHeight: '150px', overflowY: 'auto'
                    }}>
                      {complaint.ocrData.rawText}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '32px',
          padding: '40px',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '12px', color: '#fff', marginBottom: '40px', fontWeight: 800, letterSpacing: '2px', textAlign: 'center' }}>
            CASE TIMELINE
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
                    background: isLast ? (STATUS_COLORS[t.status] || '#00B4FF') : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${isLast ? '#fff' : (STATUS_COLORS[t.status] || '#00B4FF')}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isLast ? `0 0 25px ${STATUS_COLORS[t.status] || '#00B4FF'}88` : 'none',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {t.status === 'resolved' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isLast ? "#fff" : "#00C896"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLast ? '#fff' : (STATUS_COLORS[t.status] || '#00B4FF') }} />
                    )}
                  </div>
                  <div style={{ paddingTop: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      {t.message}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, display: 'flex', gap: '8px' }}>
                      <span>{format(new Date(t.timestamp), 'dd MMM yyyy • HH:mm')}</span>
                      {t.updatedBy && <span>• by {t.updatedBy.name} ({t.updatedBy.role})</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Secure Chat */}
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

      </div>
    </div>
  );
}
