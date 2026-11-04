import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { complaintsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import SecureChat from '../components/SecureChat';
import { ArrowLeft, Search, Shield, RefreshCw, Cpu, Check, AlertCircle } from 'lucide-react';

const STATUS_COLOR = {
  pending: '#d8a43a',
  under_review: '#3DF5C0',
  investigating: '#3DF5C0',
  resolved: '#10b981',
  closed: '#8e8b84',
  rejected: '#d96464'
};

export default function TrackComplaint() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [id, setId] = useState(complaintId || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const track = async (searchId) => {
    const q = (searchId || id).trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setComplaint(null);
    try {
      const { data } = await complaintsAPI.track(q);
      setComplaint(data.data.complaint);
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint not found. Please verify the ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) track(complaintId);
  }, [complaintId]);

  return (
    <main className="page-shell">
      <div className="report-layout">
        {/* Subheader / Aside Row */}
        <aside className="report-aside">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate(-1)}
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back</span>
          </button>
          <div className="aside-copy">
            <p className="eyebrow">CASE STATUS TRACKING</p>
            <h1>INCIDENT VERIFICATION</h1>
            <p>Enter your tracking identifier to inspect evidentiary custody and real-time status.</p>
          </div>
          <div className="help-note">
            <p>Secure Portal</p>
            <span>TLS 1.3 encrypted query · Authenticated owners only.</span>
          </div>
        </aside>

        {/* Main Card Container */}
        <div className="form-workspace">
          <div className="report-form" style={{ padding: 0 }}>
            {/* Intro Header */}
            <div className="form-intro">
              <div>
                <p className="step-label">REFERENCE CREDENTIALS</p>
                <h2>Tracking Reference Key</h2>
              </div>
              <p className="required-note">
                <span aria-hidden="true">*</span> Required lookup hash
              </p>
            </div>

            {/* Input & Action Strip */}
            <div style={{ padding: '36px 48px', borderBottom: '1px solid #292927' }}>
              <div style={{ maxWidth: 640 }}>
                <p style={{
                  color: '#a6a39b',
                  fontSize: '14px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  margin: '0 0 16px',
                  letterSpacing: '0.02em'
                }}>
                  Enter the unique incident tracking code provided during your submission.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: '1 1 320px' }}>
                    <Search
                      size={18}
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#8E8B85',
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      id="tracking-reference"
                      type="text"
                      style={{
                        width: '100%',
                        height: '52px',
                        padding: '0 16px 0 46px',
                        background: '#141414',
                        border: '1px solid #3b3b38',
                        borderRadius: '8px',
                        color: '#f2f0ea',
                        fontSize: '15px',
                        fontFamily: "'IBM Plex Mono', monospace",
                        letterSpacing: '1px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      placeholder="e.g. CC-2026-XXXXXX"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && track()}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => track()}
                    disabled={loading}
                    className="primary-button"
                    style={{
                      height: '52px',
                      padding: '0 28px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'LOOKING UP...' : 'PULL STATUS'}
                  </button>
                </div>

                {error && (
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#d96464',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* If no complaint loaded yet: 3 Security Architecture Pillars */}
            {!complaint && !loading && (
              <div style={{
                padding: '40px 48px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px'
              }}>
                {[
                  {
                    t: 'ZERO-KNOWLEDGE QUERY',
                    d: 'Incident reports are encrypted end-to-end. Only authenticated owners can retrieve investigative data.',
                    icon: <Shield size={24} style={{ color: '#f2f0ea' }} />
                  },
                  {
                    t: 'IMMUTABLE TIMELINE',
                    d: 'Investigative milestones and officer dispatches are committed directly to the audit log.',
                    icon: <RefreshCw size={24} style={{ color: '#EFEDE8' }} />
                  },
                  {
                    t: 'FORENSIC VERIFICATION',
                    d: 'Evidence hashes and metadata are verified for legal chain-of-custody compliance.',
                    icon: <Cpu size={24} style={{ color: '#f2f0ea' }} />
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '24px',
                      background: '#111111',
                      border: '1px solid #242421',
                      borderRadius: '16px'
                    }}
                  >
                    <div style={{ marginBottom: '14px' }}>{item.icon}</div>
                    <h4 style={{
                      margin: '0 0 6px',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: '0.08em'
                    }}>
                      {item.t}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: '#8e8b84'
                    }}>
                      {item.d}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* When complaint data is retrieved */}
            {complaint && (
              <div>
                {/* Case Header Details Banner */}
                <div style={{
                  padding: '36px 48px',
                  borderBottom: '1px solid #292927',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '24px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{
                        padding: '4px 10px',
                        background: '#1c1c1a',
                        border: '1px solid #3b3b38',
                        borderRadius: '4px',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#f2f0ea'
                      }}>
                        #{complaint.complaintId}
                      </span>
                      <span style={{
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#8E8B85',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase'
                      }}>
                        OFFICIAL RECORD
                      </span>
                    </div>

                    <h3 style={{
                      margin: '0 0 10px',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '26px',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}>
                      {complaint.title}
                    </h3>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '13px',
                      color: '#8e8b84'
                    }}>
                      <span>Category: <strong style={{ color: '#d8d5ce' }}>{complaint.category}</strong></span>
                      <span>Filed: <strong style={{ color: '#d8d5ce' }}>{format(new Date(complaint.createdAt), 'dd MMM yyyy • HH:mm')}</strong></span>
                      <span>Criticality: <strong style={{ color: complaint.severity === 'high' ? '#d96464' : '#d8a43a' }}>{complaint.severity?.toUpperCase() || 'STANDARD'}</strong></span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: `1px solid ${STATUS_COLOR[complaint.status] || '#f2f0ea'}44`,
                    background: `${STATUS_COLOR[complaint.status] || '#f2f0ea'}18`,
                    color: STATUS_COLOR[complaint.status] || '#f2f0ea',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}>
                    {complaint.status?.replace(/_/g, ' ')}
                  </div>
                </div>

                
                {/* Multi-Stage Investigation Milestone Tracker */}
                {(() => {
                  const backendStage = complaint.milestone?.stage ? (complaint.milestone.stage - 1) : 0;
                  const currentStage = Math.max(0, Math.min(4, backendStage));

                  const stages = [
                    { title: 'Intake Sealed', desc: 'Complaint registered & encrypted with custody record.' },
                    { title: 'Sec 65B Audit', desc: 'Evidence checksums hashed and verified.' },
                    { title: 'Lien Dispatch', desc: 'Statutory bank notification & recall alerts.' },
                    { title: 'Officer Inquiry', desc: 'Active investigation & suspect correlation.' },
                    { title: 'Case Resolution', desc: 'Restitution report & final legal disposition.' }
                  ];

                  return (
                    <div style={{ padding: '32px 48px', borderBottom: '1px solid #292927', background: '#0a0a0a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#8e8b84', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                          INVESTIGATION MILESTONE PHASES
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                          PHASE {currentStage + 1} OF 5: {stages[currentStage].title.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {stages.map((st, idx) => {
                          const isPast = idx < currentStage;
                          const isCurrent = idx === currentStage;
                          return (
                            <div key={idx} style={{
                              background: isCurrent ? '#141414' : '#0e0e0e',
                              border: `1px solid ${isCurrent ? '#3DF5C0' : isPast ? '#292927' : '#1e1e1d'}`,
                              borderRadius: 8,
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              position: 'relative'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: isPast ? '#3DF5C0' : isCurrent ? '#3DF5C0' : '#1e1e1d',
                                  color: '#070707', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 800
                                }}>
                                  {isPast ? '✓' : idx + 1}
                                </span>
                                <span style={{
                                  fontSize: '10px',
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  color: isPast ? '#3DF5C0' : isCurrent ? '#3DF5C0' : '#8e8b84',
                                  fontWeight: 700
                                }}>
                                  {isPast ? 'COMPLETED' : isCurrent ? 'ACTIVE' : 'PENDING'}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: isCurrent || isPast ? '#f2f0ea' : '#777' }}>
                                {st.title}
                              </div>
                              <div style={{ fontSize: '11px', color: '#8e8b84', lineHeight: 1.4 }}>
                                {st.desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Chain of Custody Timeline */}
                <div style={{ padding: '36px 48px', borderBottom: '1px solid #292927' }}>
                  <div className="section-heading" style={{ marginBottom: 24 }}>
                    <p className="step-label" style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      color: '#8e8b84',
                      textTransform: 'uppercase',
                      margin: '0 0 6px'
                    }}>
                      AUDIT TRAIL
                    </p>
                    <h3 style={{
                      margin: 0,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}>
                      Chain of Custody Timeline
                    </h3>
                  </div>

                  <div style={{ position: 'relative', paddingLeft: '32px' }}>
                    {/* Continuous vertical line */}
                    <div style={{
                      position: 'absolute',
                      left: 10,
                      top: 12,
                      bottom: 12,
                      width: 2,
                      background: '#262522'
                    }} />

                    {(complaint.timeline || []).map((t, i) => {
                      const isLatest = i === complaint.timeline.length - 1;
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: '20px',
                            marginBottom: '28px',
                            position: 'relative'
                          }}
                        >
                          {/* Dot / Checkpoint badge */}
                          <div style={{
                            position: 'absolute',
                            left: -32,
                            top: 2,
                            width: 22,
                            height: 22,
                            display: 'grid',
                            placeItems: 'center',
                            background: isLatest ? '#f2f0ea' : '#141414',
                            color: isLatest ? '#070707' : '#8e8b84',
                            border: `1px solid ${isLatest ? '#f2f0ea' : '#3b3b38'}`,
                            borderRadius: '0',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            fontSize: '11px',
                            fontWeight: 700,
                            zIndex: 2
                          }}>
                            {isLatest ? <Check size={12} strokeWidth={3} /> : `0${i + 1}`}
                          </div>

                          <div>
                            <p style={{
                              margin: '0 0 4px',
                              fontFamily: "'IBM Plex Sans', sans-serif",
                              fontSize: '16px',
                              fontWeight: 700,
                              color: isLatest ? '#ffffff' : '#d8d5ce'
                            }}>
                              {t.message}
                            </p>
                            <span style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: '12px',
                              color: '#8E8B85'
                            }}>
                              {format(new Date(t.timestamp), 'dd MMM yyyy • HH:mm:ss')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Secure Direct Comms Channel */}
                {user && (
                  <div style={{ padding: '36px 48px' }}>
                    <div className="section-heading" style={{ marginBottom: 20 }}>
                      <p className="step-label" style={{
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        color: '#8e8b84',
                        textTransform: 'uppercase',
                        margin: '0 0 6px'
                      }}>
                        ENCRYPTED MESSAGING
                      </p>
                      <h3 style={{
                        margin: 0,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#ffffff'
                      }}>
                        Direct Investigator Comms
                      </h3>
                    </div>

                    <div style={{
                      background: '#111111',
                      border: '1px solid #292927',
                      borderRadius: '16px',
                      overflow: 'hidden'
                    }}>
                      <SecureChat complaintId={complaint._id} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
