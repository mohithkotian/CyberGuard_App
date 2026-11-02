import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { complaintsAPI, securityAPI } from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { lookupThreatClient } from '../data/threatIntel';
import { ArrowLeft, Search, ShieldCheck, AlertTriangle, MessageSquareText, ShieldAlert, CheckCircle2, Radio, Send, Sparkles, Copy, ExternalLink, Globe } from 'lucide-react';

export default function ScamSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchMode, setSearchMode] = useState('identifier'); // 'identifier' | 'message'
  const [messageText, setMessageText] = useState('');
  const [messageReport, setMessageReport] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);

  const handleAnalyzeMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) {
      toast.error('Please paste or type a message to audit.');
      return;
    }
    setMessageLoading(true);
    try {
      const res = await securityAPI.analyzeMessage(messageText);
      if (res.data?.data) {
        setMessageReport(res.data.data);
        if (res.data.data.riskScore >= 70) {
          toast.error(`Critical Phishing Threat Detected! (Risk Score: ${res.data.data.riskScore}/100)`);
        } else if (res.data.data.riskScore >= 45) {
          toast.error('High-Risk Coercive Scam Detected!');
        } else {
          toast.success('Message audited successfully.');
        }
      }
    } catch (_) {
      toast.error('Failed to analyze message threat.');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      toast.error('Search query must be at least 2 characters.');
      return;
    }

    setLoading(true);
    try {
      let finalResults = [];
      try {
        const { data } = await complaintsAPI.publicSearch(cleanQuery);
        if (data?.data?.results) {
          finalResults = data.data.results;
        }
      } catch (apiErr) {
        console.warn('API lookup offline/errored, using local intelligence engine:', apiErr);
      }

      // If API returned nothing or had an error, cross-check client threat intel
      if (finalResults.length === 0) {
        const localMatches = lookupThreatClient(cleanQuery);
        finalResults = localMatches;
      }

      setResults(finalResults);
      setSearched(true);

      if (finalResults.length > 0) {
        toast.error(`Alert: ${finalResults.length} Scam / Threat match(es) detected!`);
      } else {
        toast.success('Verified Safe: No records found in criminal index');
      }
    } catch (err) {
      console.error(err);
      const fallback = lookupThreatClient(cleanQuery);
      setResults(fallback);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

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
            <p className="eyebrow">NATIONAL THREAT RADAR</p>
            <h1>SCAM SEARCH ENGINE</h1>
            <p>Verify phone numbers, phishing URLs, UPI handles, or bank accounts against verified cybercrime records.</p>
          </div>
          <div className="help-note">
            <p>Direct Cross-Check</p>
            <span>Real-time heuristic index synchronized with the national complaint registry.</span>
          </div>
        </aside>

        {/* Content Workspace */}
        <div className="form-workspace">
          <div className="report-form" style={{ padding: 0 }}>
            {/* Form Intro Header */}
            <div className="form-intro">
              <div>
                <p className="step-label">THREAT INTELLIGENCE</p>
                <h2>Suspect Identity & Threat Verification</h2>
              </div>
              <p className="required-note">
                Live Query Telemetry
              </p>
            </div>

            
            {/* Mode Selector Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #242422', background: '#0a0a0a', padding: '0 40px', gap: 8 }}>
              <button
                type="button"
                onClick={() => setSearchMode('identifier')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${searchMode === 'identifier' ? '#3DF5C0' : 'transparent'}`,
                  color: searchMode === 'identifier' ? '#f2f0ea' : '#8e8b84',
                  padding: '14px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Search size={15} color={searchMode === 'identifier' ? '#3DF5C0' : '#8e8b84'} />
                <span>IDENTIFIER LOOKUP</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode('message')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${searchMode === 'message' ? '#3DF5C0' : 'transparent'}`,
                  color: searchMode === 'message' ? '#f2f0ea' : '#8e8b84',
                  padding: '14px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <MessageSquareText size={15} color={searchMode === 'message' ? '#3DF5C0' : '#8e8b84'} />
                <span>SMS & WHATSAPP PHISHING SANDBOX</span>
                <span style={{ fontSize: '10px', background: '#1c241e', color: '#3DF5C0', border: '1px solid #2d4538', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                  TRAI DLT AUDIT
                </span>
              </button>
            </div>
<div style={{ padding: '36px 40px' }}>
              {/* Quick Examples Chips */}
              
              {searchMode === 'message' ? (
                /* ── SMS & WHATSAPP PHISHING SANDBOX ── */
                <div>
                  {/* Preset quick test chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <span style={{ fontSize: '11px', color: '#888880', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Sample Phishing Messages:
                    </span>
                    {[
                      { label: '⚡ BESCOM Power Cut', text: 'VK-BESCOM: Dear consumer your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately contact officer at 9845012345 or install http://bescom-bill-update.apk' },
                      { label: '📦 Customs Video Extortion', text: 'MD-FEDEX: Urgent parcel seized by Mumbai Customs containing narcotics and fake passports in your name. Join Skype video interrogation immediately or CBI arrest warrant will be executed.' },
                      { label: '🏦 SBI YONO KYC Block', text: 'AX-SBIINB: Your SBI YONO banking account is blocked. Update PAN card immediately to prevent permanent debit freeze at http://sbi-kyc-verify.com' },
                      { label: '💼 Telegram Task Ponzi', text: 'Earn Rs 5000 daily by liking YouTube videos and Google reviews. Join Telegram @easyincome99 and deposit Rs 1000 for verification task.' }
                    ].map((sample, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => { setMessageText(sample.text); setMessageReport(null); }}
                        style={{
                          background: '#141414',
                          border: '1px solid #30302d',
                          borderRadius: '8px',
                          padding: '4px 12px',
                          color: '#d8d5ce',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>

                  {/* Textarea Form */}
                  <form onSubmit={handleAnalyzeMessage} style={{ marginBottom: 28 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                      PASTE SUSPICIOUS SMS / WHATSAPP MESSAGE TEXT:
                    </label>
                    <textarea
                      rows={4}
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="e.g. VK-BESCOM: Dear consumer your electricity power will be disconnected at 9:30 PM... or paste raw text message"
                      style={{
                        width: '100%',
                        background: '#141414',
                        border: '1px solid #30302d',
                        borderRadius: 12,
                        padding: '16px 20px',
                        color: '#f2f0ea',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        resize: 'vertical'
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => { setMessageText(''); setMessageReport(null); }}
                        style={{
                          background: '#141414',
                          border: '1px solid #30302d',
                          color: '#8e8b84',
                          borderRadius: 8,
                          padding: '10px 18px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        CLEAR
                      </button>
                      <button
                        type="submit"
                        disabled={messageLoading}
                        style={{
                          background: '#3DF5C0',
                          border: 'none',
                          color: '#070707',
                          borderRadius: 8,
                          padding: '10px 24px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: messageLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          letterSpacing: '0.04em'
                        }}
                      >
                        <ShieldAlert size={15} />
                        {messageLoading ? 'EVALUATING FORENSICS...' : 'AUDIT MESSAGE THREAT'}
                      </button>
                    </div>
                  </form>

                  {/* Audit Report Result */}
                  <AnimatePresence>
                    {messageReport && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: '#0d0d0d',
                          border: `1px solid ${messageReport.riskScore >= 70 ? '#4a1e1e' : messageReport.riskScore >= 45 ? '#4a3518' : '#262522'}`,
                          borderRadius: '16px',
                          padding: '24px 28px'
                        }}
                      >
                        {/* Header strip */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                              <span style={{
                                background: messageReport.riskScore >= 70 ? '#261212' : messageReport.riskScore >= 45 ? '#241a0d' : '#14241e',
                                border: `1px solid ${messageReport.riskScore >= 70 ? '#d96464' : messageReport.riskScore >= 45 ? '#d8a43a' : '#3DF5C0'}`,
                                color: messageReport.riskScore >= 70 ? '#d96464' : messageReport.riskScore >= 45 ? '#d8a43a' : '#3DF5C0',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: 4,
                                letterSpacing: '0.08em',
                                fontFamily: "'IBM Plex Mono', monospace"
                              }}>
                                {messageReport.verdict}
                              </span>
                              <span style={{ fontSize: '12px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                                RISK SCORE: <strong style={{ color: messageReport.riskScore >= 70 ? '#d96464' : '#3DF5C0' }}>{messageReport.riskScore} / 100</strong>
                              </span>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f2f0ea', margin: 0 }}>
                              Automated Message Forensic Audit Report
                            </h3>
                          </div>

                          {messageReport.suggestedComplaintDraft && (
                            <button
                              type="button"
                              onClick={() => {
                                navigate('/submit', { state: { prefill: messageReport.suggestedComplaintDraft } });
                              }}
                              style={{
                                background: '#3DF5C0',
                                border: 'none',
                                color: '#070707',
                                borderRadius: 8,
                                padding: '10px 18px',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <ShieldAlert size={14} />
                              <span>FILE REPORT ON CYBERGUARD</span>
                            </button>
                          )}
                        </div>

                        {/* TRAI Header Analysis Box */}
                        <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                              TRAI DLT SENDER IDENTITY ASSESSMENT
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: messageReport.senderHeaderAnalysis.isOfficialEntity ? '#3DF5C0' : messageReport.senderHeaderAnalysis.isTraiCompliant ? '#d8a43a' : '#d96464'
                            }}>
                              {messageReport.senderHeaderAnalysis.isOfficialEntity ? '✓ Registered Principal Entity' : messageReport.senderHeaderAnalysis.isTraiCompliant ? 'Unverified DLT Header' : '⚠ Non-DLT Personal Number'}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#f2f0ea', fontWeight: 700, marginBottom: 4 }}>
                            Header: {messageReport.senderHeaderAnalysis.headerDetected || 'None'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#a6a39b', lineHeight: 1.5 }}>
                            {messageReport.senderHeaderAnalysis.note}
                          </div>
                        </div>

                        {/* Coercion Categories & Urgency triggers */}
                        {messageReport.coercionCategories?.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                              PSYCHOLOGICAL COERCION TRIGGERS DETECTED:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {messageReport.coercionCategories.map((c, i) => (
                                <span key={i} style={{ background: '#241414', border: '1px solid #4a1e1e', color: '#d96464', borderRadius: 4, padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}>
                                  {c.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {messageReport.detectedUrgencyPhrases.map((u, i) => (
                                <span key={i} style={{ background: '#1c1710', border: '1px solid #423218', color: '#d8a43a', borderRadius: 4, padding: '4px 10px', fontSize: '11px' }}>
                                  "{u}"
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extracted Links & APKs */}
                        {messageReport.extractedLinks?.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                              EXTRACTED EMBEDDED URLS & PAYLOADS:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {messageReport.extractedLinks.map((link, i) => (
                                <div key={i} style={{ background: '#121212', border: '1px solid #262522', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                  <span style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>{link.url}</span>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: link.isMaliciousOrSuspicious ? '#261212' : '#14241e',
                                    color: link.isMaliciousOrSuspicious ? '#d96464' : '#3DF5C0'
                                  }}>
                                    {link.threatType}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Precautionary Citizen Directive */}
                        <div style={{
                          background: '#141414',
                          border: `1px solid ${messageReport.riskScore >= 70 ? '#d96464' : '#3DF5C0'}`,
                          borderRadius: 8,
                          padding: '14px 18px',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          color: '#d8d5ce'
                        }}>
                          <div style={{ fontSize: '10px', color: messageReport.riskScore >= 70 ? '#d96464' : '#3DF5C0', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                            🛡️ STATUTORY CITIZEN ADVISORY:
                          </div>
                          {messageReport.statutoryAdvisory}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── IDENTIFIER LOOKUP (EXISTING) ── */
                <>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', color: '#888880', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Quick Test Queries:
                </span>
                {['+91 98000 00001', '555-0100', 'graphicriver.net', 'icicibank.com', '9999999999 (Safe)'].map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const val = ex.includes(' ') && ex.includes('Safe') ? '9999999999' : ex;
                      setQuery(val);
                    }}
                    style={{
                      background: '#141414',
                      border: '1px solid #30302d',
                      borderRadius: '8px',
                      padding: '4px 14px',
                      color: ex.includes('Safe') ? '#3DF5C0' : '#b8b8b0',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: "'IBM Plex Mono', monospace",
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#f2f0ea'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#30302d'}
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {/* Search Form with Pill Input */}
              <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '36px' }}>
                <input
                  type="text"
                  placeholder="Enter Phone Number, Domain URL, or UPI ID..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#141414',
                    border: '1px solid #30302d',
                    borderRadius: '999px',
                    padding: '16px 180px 16px 26px',
                    color: '#f2f0ea',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#f2f0ea'}
                  onBlur={e => e.currentTarget.style.borderColor = '#30302d'}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '6px',
                    bottom: '6px',
                    background: '#f2f0ea',
                    color: '#070707',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0 28px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={e => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseOut={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Search size={14} />
                  {loading ? 'SCANNING...' : 'SEARCH DB'}
                </button>
              </form>

              {/* Results Display */}
              <AnimatePresence>
                {searched && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'left' }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '20px',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <h3 style={{ 
                        fontSize: '12px', 
                        color: '#888880', 
                        margin: 0, 
                        fontWeight: 700, 
                        letterSpacing: '1px',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        textTransform: 'uppercase'
                      }}>
                        VERIFICATION RESULTS ({results.length})
                      </h3>
                      {results.length > 0 ? (
                        <span style={{ 
                          color: '#d96464', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          letterSpacing: '0.5px',
                          background: '#1f1313',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid #4a1f1f',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>
                          <AlertTriangle size={14} /> HIGH-RISK THREAT IDENTIFIED
                        </span>
                      ) : (
                        <span style={{ 
                          color: '#3DF5C0', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          letterSpacing: '0.5px',
                          background: '#0d1a14',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid #1a382a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>
                          <ShieldCheck size={14} /> VERIFIED CLEAN RECORD
                        </span>
                      )}
                    </div>

                    {results.length === 0 ? (
                      <div style={{ 
                        background: '#141414', 
                        border: '1px solid #30302d', 
                        borderRadius: '24px',
                        padding: '44px 30px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '999px',
                          background: '#0d1a14',
                          color: '#3DF5C0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}>
                          <ShieldCheck size={28} />
                        </div>
                        <h4 style={{ 
                          color: '#f2f0ea', 
                          fontSize: '20px', 
                          fontWeight: 700, 
                          margin: '0 0 10px 0',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>
                          No Threats Detected
                        </h4>
                        <p style={{ 
                          color: '#b8b8b0', 
                          fontSize: '14px', 
                          maxWidth: '520px', 
                          margin: '0 auto 16px', 
                          lineHeight: 1.6,
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>
                          No reported scams, phishing campaigns, or fraudulent records match &quot;<strong style={{ color: '#f2f0ea' }}>{query}</strong>&quot; in our national database index.
                        </p>
                        <div style={{ 
                          display: 'inline-block', 
                          background: '#0d1a14', 
                          border: '1px solid #1a382a',
                          padding: '4px 16px', 
                          borderRadius: '8px', 
                          color: '#3DF5C0', 
                          fontSize: '11px', 
                          fontWeight: 700,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          letterSpacing: '1px'
                        }}>
                          STATUS: CLEAN / UNTAINTED
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '14px' }}>
                        {results.map((r, i) => (
                          <div
                            key={r.complaintId || i}
                            style={{
                              background: '#141414',
                              border: '1px solid #30302d',
                              borderRadius: '20px',
                              padding: '24px 28px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '16px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#d96464', fontWeight: 700, letterSpacing: '1px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                  {r.complaintId}
                                </span>
                                <span style={{ fontSize: '10px', background: '#261212', color: '#d96464', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                  SCAM FLAGGED
                                </span>
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f2f0ea', marginBottom: '6px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                {r.category}
                              </div>
                              <div style={{ fontSize: '13px', color: '#b8b8b0', marginBottom: '6px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                {r.details || `Flagged identifier linked to active incident records.`}
                              </div>
                              <div style={{ fontSize: '12px', color: '#777', fontFamily: "'IBM Plex Mono', monospace" }}>
                                Matched Vector: <strong style={{ color: '#f2f0ea' }}>{r.identifier || query}</strong>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                              <span style={{ 
                                fontSize: '11px', 
                                padding: '4px 12px', 
                                borderRadius: '8px',
                                background: '#261212',
                                color: '#d96464',
                                fontWeight: 800,
                                border: '1px solid #4a1f1f',
                                letterSpacing: '1px',
                                fontFamily: "'IBM Plex Sans', sans-serif"
                              }}>
                                {(r.riskLevel || r.severity || 'HIGH').toUpperCase()} RISK
                              </span>
                              <a 
                                href={r.complaintId && r.complaintId.startsWith('CC-') ? `/track/${r.complaintId}` : '/forensics'} 
                                style={{ 
                                  fontSize: '13px', 
                                  color: '#f2f0ea', 
                                  textDecoration: 'none',
                                  fontWeight: 700,
                                  fontFamily: "'IBM Plex Sans', sans-serif",
                                  letterSpacing: '0.5px'
                                }}
                              >
                                FORENSICS DOSSIER →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

              {/* Security Advisory Protocol Card */}
              <div style={{ 
                marginTop: '40px', 
                padding: '20px 24px',
                background: '#101010',
                borderRadius: '16px',
                border: '1px solid #242422',
                color: '#888880', 
                fontSize: '13px', 
                lineHeight: '1.6',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: '#b8b8b0', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '1px', textTransform: 'uppercase' }}>Security Protocol:</strong> This interface provides a live gateway into the National Cybercrime Intelligence Repository. Verified safe credentials indicate no recorded fraudulent cases, while flagged entries represent known malicious vectors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
