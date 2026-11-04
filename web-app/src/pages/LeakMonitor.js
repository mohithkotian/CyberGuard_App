import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import { securityAPI } from '../services/api';

export default function LeakMonitor() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [telemetry, setTelemetry] = useState(null);

  const checkBreach = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await securityAPI.breachCheck(email);
      setTelemetry(res.data.data);
      setHasSearched(true);
      toast.success('Breach surveillance audit completed.');
    } catch (err) {
      console.error('Breach check failed:', err);
      toast.error(err.response?.data?.message || 'Failed to complete breach audit.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'SUSPICIOUS DOMAIN':
      case 'CRITICAL EXPOSURE':
        return { text: '#d96464', bg: '#2b1414', border: '#4d2020' };
      case 'ELEVATED EXPOSURE':
        return { text: '#e5a442', bg: '#261b0c', border: '#4a3518' };
      case 'MODERATE RISK':
        return { text: '#d8a43a', bg: '#241a0d', border: '#453319' };
      default:
        return { text: '#3DF5C0', bg: '#0d1a14', border: '#1a382a' };
    }
  };

  const riskStyle = telemetry ? getRiskColor(telemetry.riskLevel) : null;

  return (
    <div className="page-shell">
      <Navbar />

      <main className="report-layout">
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
            <p className="eyebrow">BREACH SURVEILLANCE</p>
            <h1>CREDENTIAL LEAK MONITOR</h1>
            <p>Scan public data breaches, pastebins, and dark web credential dumps to identify exposed personal accounts.</p>
          </div>
          <div className="help-note">
            <p>Zero-Knowledge Audit</p>
            <span>Searches use SHA-1 k-anonymity protocol. Full credentials are never logged or stored.</span>
          </div>
        </aside>

        {/* Content Workspace */}
        <div className="form-workspace">
          <div className="report-form" style={{ padding: 0 }}>
            {/* Form Intro Header */}
            <div className="form-intro">
              <div>
                <p className="step-label">IDENTITY VERIFICATION</p>
                <h2>Dark Web Exposure Audit</h2>
              </div>
              <p className="required-note">
                Live Telemetry
              </p>
            </div>

            <div style={{ padding: '36px 40px' }}>
              {/* Search Bar Form */}
              <form onSubmit={checkBreach} style={{ position: 'relative', marginBottom: '32px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address (e.g. name@example.com)..."
                  style={{
                    width: '100%',
                    background: '#141414',
                    border: '1px solid #30302d',
                    borderRadius: '999px',
                    padding: '16px 140px 16px 24px',
                    color: '#f2f0ea',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: "'IBM Plex Sans', sans-serif"
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '6px',
                    bottom: '6px',
                    padding: '0 24px',
                    borderRadius: '999px',
                    fontSize: '13px'
                  }}
                >
                  {loading ? 'AUDITING...' : 'SCAN LEAKS'}
                </button>
              </form>

              {/* Dynamic Results Display */}
              <AnimatePresence>
                {hasSearched && telemetry && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Header Strip */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                        AUDITED TARGET: <strong style={{ color: '#f2f0ea' }}>{telemetry.searchedEmail}</strong>
                      </span>
                      <button
                        onClick={() => { setHasSearched(false); setEmail(''); setTelemetry(null); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#8e8b84',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textDecoration: 'underline'
                        }}
                      >
                        New Lookup
                      </button>
                    </div>

                    {/* Summary Exposure Card */}
                    <div style={{ background: '#141414', border: '1px solid #30302d', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                            Identity Exposure Summary
                          </h3>
                          <span style={{ fontSize: '12px', color: '#8e8b84', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                            Evaluated across active leak repositories and domain security registers.
                          </span>
                        </div>
                        <div style={{
                          border: `1px solid ${riskStyle.border}`,
                          color: riskStyle.text,
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: riskStyle.bg,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          fontWeight: 800,
                          letterSpacing: '1px'
                        }}>
                          {telemetry.isExposed ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />} {telemetry.riskLevel}
                        </div>
                      </div>

                      {/* Metrics grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                        <div style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ color: '#8e8b84', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700 }}>
                            Exposure Risk Score
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: 800, color: riskStyle.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                            {telemetry.riskScore} <span style={{ fontSize: '13px', color: '#8e8b84' }}>/ 100</span>
                          </div>
                        </div>

                        <div style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ color: '#8e8b84', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700 }}>
                            Correlated Breaches
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                            {telemetry.breachCount}
                          </div>
                        </div>

                        <div style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ color: '#8e8b84', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700 }}>
                            Domain MX Status
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: telemetry.mxVerified ? '#10b981' : '#d96464', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {telemetry.mxVerified ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            {telemetry.mxVerified ? 'Verified Active MX' : 'Unverified Server'}
                          </div>
                        </div>

                        <div style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ color: '#8e8b84', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700 }}>
                            k-Anonymity Hash Prefix
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace", marginTop: '6px' }}>
                            {telemetry.sha1Prefix}
                          </div>
                        </div>
                      </div>

                      {/* Breach list if any */}
                      {telemetry.breaches && telemetry.breaches.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#f2f0ea', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                            Correlated Data Breaches
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {telemetry.breaches.map((b, idx) => (
                              <div key={idx} style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '10px', padding: '14px 18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#f2f0ea' }}>{b.name}</span>
                                  <span style={{ fontSize: '12px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>{b.year}</span>
                                </div>
                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#8e8b84', lineHeight: '1.4' }}>{b.description}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {b.exposedData.map((d, dIdx) => (
                                    <span key={dIdx} style={{ fontSize: '11px', background: '#1c1c1a', border: '1px solid #30302d', padding: '2px 8px', borderRadius: '6px', color: '#b8b5ad', fontFamily: "'IBM Plex Mono', monospace" }}>
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Advisory & Recommendations */}
                      <div style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <Lock size={15} color="#3DF5C0" />
                          <strong style={{ color: '#f2f0ea', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' }}>
                            FORENSIC SECURITY ADVISORY
                          </strong>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#b8b5ad', fontSize: '13px', lineHeight: '1.6' }}>
                          {telemetry.recommendations.map((rec, rIdx) => (
                            <li key={rIdx} style={{ marginBottom: '4px' }}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
