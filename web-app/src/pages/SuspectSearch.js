import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { complaintsAPI } from '../services/api';
import { lookupThreatClient } from '../data/threatIntel';
import { ArrowLeft, RotateCw, ShieldCheck, AlertTriangle, Check } from 'lucide-react';

const searchCategories = [
  { id: 'mobile', label: 'Mobile', icon: 'mobile-phone.png', warning: 'Enter 10-digit Mobile number (e.g., 9800000001 or 555-0100)', sampleScam: '9800000001', sampleSafe: '9876543210' },
  { id: 'email', label: 'E-mail', icon: 'email-address.png', warning: 'Enter the complete email address', sampleScam: 'phishing-support@icicibank.com', sampleSafe: 'john.doe@gmail.com' },
  { id: 'bank', label: 'Bank Account', icon: 'bank-account.png', warning: 'Enter digits only without spaces or dashes', sampleScam: '9120000001234', sampleSafe: '5010034928192' },
  { id: 'social', label: 'Social Media', icon: 'social-handle.png', warning: 'Enter the profile URL or handle', sampleScam: '@crypto_giveaway_bot', sampleSafe: '@official_support' },
  { id: 'upi', label: 'UPI ID', icon: 'payment-card.png', warning: 'Enter valid VPA (e.g., name@bank)', sampleScam: 'paytm-refund@okaxis', sampleSafe: 'rahul@oksbi' },
  { id: 'app', label: 'Mobile App', icon: 'mobile-app.png', warning: 'Enter the exact App name or package', sampleScam: 'Fast Instant Loan 24x7', sampleSafe: 'Google Pay' },
  { id: 'website', label: 'Website URL', icon: 'phishing-url.png', warning: 'Enter domain or URL (e.g. graphicriver.net or icicibank.com)', sampleScam: 'graphicriver.net', sampleSafe: 'github.com/official' }
];

const generateCaptchaCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const CAPTCHA_COLORS = ['#f2f0ea', '#d8d5ce', '#3DF5C0', '#FFB800', '#FF6B8B', '#A78BFA'];

export default function SuspectSearch() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(searchCategories[0]);
  const [inputValue, setInputValue] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [charStyles, setCharStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]);

  const refreshCaptcha = useCallback(() => {
    let newCode = generateCaptchaCode();
    while (newCode === captchaCode) {
      newCode = generateCaptchaCode();
    }
    setCaptchaCode(newCode);
    setCaptchaValue('');
    setRotationDegrees(prev => prev + 360);

    const styles = newCode.split('').map(() => ({
      rotate: Math.floor(Math.random() * 20) - 10,
      translateY: Math.floor(Math.random() * 4) - 2,
      color: CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)],
      fontWeight: '700',
      fontSize: `${Math.floor(Math.random() * 4) + 18}px`
    }));
    setCharStyles(styles);
  }, [captchaCode]);

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    const cleanInput = inputValue.trim();
    if (!cleanInput) {
      toast.error(`Please enter a valid ${activeCategory.label}`);
      return;
    }

    if (cleanInput.length < 2) {
      toast.error('Search identifier must be at least 2 characters.');
      return;
    }

    if (!captchaValue.trim()) {
      toast.error('Please enter the security captcha shown.');
      return;
    }

    if (captchaValue.trim().toLowerCase() !== captchaCode.toLowerCase()) {
      toast.error('Incorrect captcha. A new code has been generated.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      let finalResults = [];
      try {
        const { data } = await complaintsAPI.publicSearch(cleanInput);
        if (data?.data?.results) {
          finalResults = data.data.results;
        }
      } catch (apiErr) {
        console.warn('API search warning, running local threat intelligence engine:', apiErr);
      }

      if (finalResults.length === 0) {
        const localMatches = lookupThreatClient(cleanInput);
        finalResults = localMatches;
      }

      setResults(finalResults);
      setSearched(true);

      if (finalResults.length > 0) {
        toast.error(`Alert: Match found! Flagged as SCAM in ${finalResults.length} record(s).`);
      } else {
        toast.success('Verified Safe: No suspect records found.');
      }
    } catch (err) {
      console.error(err);
      const fallback = lookupThreatClient(cleanInput);
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
            <p className="eyebrow">INTELLIGENCE REGISTRY</p>
            <h1>SUSPECT CREDENTIAL SEARCH</h1>
            <p>National Cybercrime Registry intelligence search engine for public safety and suspect credential verification.</p>
          </div>
          <div className="help-note">
            <p>Authenticated Query</p>
            <span>Verified across active citizen complaint dossiers and investigative indexes.</span>
          </div>
        </aside>

        {/* Content Workspace */}
        <div className="form-workspace">
          <div className="report-form" style={{ padding: 0 }}>
            {/* Form Intro Header */}
            <div className="form-intro">
              <div>
                <p className="step-label">VECTOR INVESTIGATION</p>
                <h2>Suspect Identity & Account Lookup</h2>
              </div>
              <p className="required-note">
                Captcha Protected
              </p>
            </div>

            <div style={{ padding: '36px 40px' }}>
              <p style={{ color: '#b8b8b0', fontSize: '14px', marginBottom: '24px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                This repository of suspect identifiers has been curated from multiple verified cybercrime reports lodged nationwide. Select a channel vector below to inspect:
              </p>

              {/* Category Selector Chips */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                gap: '12px', 
                marginBottom: '24px' 
              }}>
                {searchCategories.map(cat => {
                  const isActive = activeCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setInputValue('');
                        setSearched(false);
                        setResults([]);
                      }}
                      style={{
                        position: 'relative',
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isActive ? '#1c1c1a' : '#141414',
                        border: isActive ? '1px solid #f2f0ea' : '1px solid #30302d',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onMouseEnter={e => !isActive && (e.currentTarget.style.borderColor = '#444440')}
                      onMouseLeave={e => !isActive && (e.currentTarget.style.borderColor = '#30302d')}
                    >
                      {isActive && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px',
                          background: '#f2f0ea', 
                          color: '#070707', 
                          borderRadius: '50%',
                          width: '16px', 
                          height: '16px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center'
                        }}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                      <img 
                        src={`/icons/cyberguard/${cat.icon}`} 
                        alt="" 
                        style={{ width: 36, height: 36, objectFit: 'contain', marginBottom: '8px' }} 
                      />
                      <div style={{ 
                        fontSize: '13px', 
                        color: isActive ? '#f2f0ea' : '#888880', 
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontWeight: 700, 
                        letterSpacing: '0.5px' 
                      }}>
                        {cat.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Demo Test Buttons */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                flexWrap: 'wrap', 
                marginBottom: '24px', 
                padding: '12px 18px', 
                background: '#101010', 
                borderRadius: '12px', 
                border: '1px solid #242422' 
              }}>
                <span style={{ fontSize: '11px', color: '#888880', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Quick Test:
                </span>
                <button
                  type="button"
                  onClick={() => { setInputValue(activeCategory.sampleScam); setCaptchaValue(captchaCode); }}
                  style={{ 
                    background: '#1f1313', 
                    border: '1px solid #4a1f1f', 
                    borderRadius: '8px', 
                    padding: '4px 12px', 
                    color: '#d96464', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}
                >
                  Fill Sample Scam ({activeCategory.sampleScam})
                </button>
                <button
                  type="button"
                  onClick={() => { setInputValue(activeCategory.sampleSafe); setCaptchaValue(captchaCode); }}
                  style={{ 
                    background: '#0d1a14', 
                    border: '1px solid #1a382a', 
                    borderRadius: '8px', 
                    padding: '4px 12px', 
                    color: '#3DF5C0', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}
                >
                  Fill Sample Safe ({activeCategory.sampleSafe})
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSearch} style={{ marginBottom: '32px' }}>
                <div style={{ color: '#d96464', fontSize: '12px', marginBottom: '16px', fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {activeCategory.warning}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888880', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {activeCategory.label} Identifier <span style={{ color: '#d96464' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder={`Enter ${activeCategory.label}...`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '13px 18px', 
                        background: '#141414', 
                        border: '1px solid #30302d', 
                        borderRadius: '12px', 
                        fontSize: '14px', 
                        color: '#f2f0ea',
                        outline: 'none', 
                        boxSizing: 'border-box',
                        fontFamily: "'IBM Plex Sans', sans-serif"
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#f2f0ea'}
                      onBlur={e => e.currentTarget.style.borderColor = '#30302d'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888880', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      Security Captcha <span style={{ color: '#d96464' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div 
                        title="Security Captcha Verification"
                        style={{ 
                          background: '#101010',
                          border: '1px solid #30302d', 
                          padding: '0 16px', 
                          borderRadius: '12px', 
                          height: '46px', 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          userSelect: 'none',
                          minWidth: '120px'
                        }}
                      >
                        {captchaCode.split('').map((char, index) => {
                          const style = charStyles[index] || {};
                          return (
                            <span 
                              key={index}
                              style={{
                                display: 'inline-block',
                                transform: `rotate(${style.rotate || 0}deg) translateY(${style.translateY || 0}px)`,
                                color: style.color || '#f2f0ea',
                                fontWeight: '700',
                                fontSize: style.fontSize || '18px',
                                fontFamily: "'IBM Plex Mono', monospace"
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </div>

                      <motion.button
                        type="button"
                        onClick={refreshCaptcha}
                        title="Generate new Captcha"
                        animate={{ rotate: rotationDegrees }}
                        transition={{ duration: 0.4 }}
                        style={{ 
                          background: '#141414', 
                          border: '1px solid #30302d',
                          borderRadius: '12px',
                          width: '46px',
                          height: '46px',
                          cursor: 'pointer', 
                          color: '#b8b8b0', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <RotateCw size={16} />
                      </motion.button>

                      <input 
                        type="text" 
                        placeholder="Enter Code"
                        value={captchaValue}
                        onChange={(e) => setCaptchaValue(e.target.value)}
                        style={{ 
                          flex: 1, 
                          padding: '13px 16px', 
                          background: '#141414', 
                          border: '1px solid #30302d', 
                          borderRadius: '12px', 
                          fontSize: '14px', 
                          color: '#f2f0ea',
                          height: '46px', 
                          outline: 'none', 
                          boxSizing: 'border-box',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#f2f0ea'}
                        onBlur={e => e.currentTarget.style.borderColor = '#30302d'}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  style={{ 
                    background: '#f2f0ea',
                    color: '#070707',
                    border: 'none',
                    padding: '0 40px', 
                    height: '50px', 
                    borderRadius: '999px', 
                    fontSize: '14px', 
                    fontWeight: 800, 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    letterSpacing: '1px',
                    fontFamily: "'IBM Plex Sans', sans-serif"
                  }}
                >
                  {loading ? 'SEARCHING...' : 'VERIFY SUSPECT RECORD'}
                </button>
              </form>

              {/* Results View */}
              <AnimatePresence>
                {searched && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '32px', textAlign: 'left' }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <h3 style={{ fontSize: '12px', color: '#888880', margin: 0, fontWeight: 700, letterSpacing: '1px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                        SUSPECT REPOSITORY MATCHES ({results.length})
                      </h3>
                      {results.length > 0 ? (
                        <span style={{ 
                          color: '#d96464', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          background: '#1f1313',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid #4a1f1f',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>
                          <AlertTriangle size={14} /> SCAM CONFIRMED IN DATABASE
                        </span>
                      ) : (
                        <span style={{ 
                          color: '#3DF5C0', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          background: '#0d1a14',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid #1a382a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>
                          <ShieldCheck size={14} /> NO SUSPECT RECORD FOUND (CLEAN)
                        </span>
                      )}
                    </div>

                    {results.length === 0 ? (
                      <div style={{ 
                        background: '#141414', 
                        border: '1px solid #30302d', 
                        borderRadius: '24px', 
                        padding: '40px 24px',
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
                        <h4 style={{ color: '#f2f0ea', fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', fontFamily: "'IBM Plex Sans', sans-serif" }}>Clean Verification Record</h4>
                        <p style={{ color: '#b8b8b0', fontSize: '14px', margin: '0 auto 12px', maxWidth: 600, lineHeight: 1.6, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                          No reported cybercrime complaints, fraudulent vishing records, or scam flags currently match &quot;<strong style={{ color: '#f2f0ea' }}>{inputValue}</strong>&quot;.
                        </p>
                        <div style={{ display: 'inline-block', background: '#0d1a14', border: '1px solid #1a382a', padding: '4px 14px', borderRadius: '8px', color: '#3DF5C0', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                          STATUS: VERIFIED UNTAINTED
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
                              gap: '12px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#d96464', fontWeight: 700, letterSpacing: '1px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                  {r.complaintId}
                                </span>
                                <span style={{ fontSize: '10px', background: '#261212', color: '#d96464', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                  SCAM CONFIRMED
                                </span>
                              </div>
                              <div style={{ fontSize: '17px', fontWeight: 700, color: '#f2f0ea', marginBottom: '4px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                {r.category}
                              </div>
                              <div style={{ fontSize: '13px', color: '#b8b8b0', marginBottom: '4px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                {r.details || `Logged on cybercrime suspect database.`}
                              </div>
                              <div style={{ fontSize: '12px', color: '#777', fontFamily: "'IBM Plex Mono', monospace" }}>
                                Identifier: <span style={{ color: '#f2f0ea', fontWeight: 600 }}>{r.identifier || inputValue}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                                DOSSIER →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Disclaimer */}
              <div style={{ 
                background: '#101010', 
                border: '1px solid #242422', 
                borderRadius: '16px',
                padding: '20px 24px'
              }}>
                <h4 style={{ color: '#b8b8b0', margin: '0 0 8px 0', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Regulatory Disclaimer *
                </h4>
                <p style={{ color: '#888880', fontSize: '12px', lineHeight: '1.7', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  This search database is generated from citizen complaints and intelligence feeds. The Indian Cybercrime Coordination Centre (I4C) aggregates evidentiary data to protect users; formal determinations remain subject to active police investigation.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
