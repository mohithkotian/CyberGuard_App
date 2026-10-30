import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { complaintsAPI } from '../services/api';
import { lookupThreatClient } from '../data/threatIntel';

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

const CAPTCHA_COLORS = ['#00FFD1', '#00B4FF', '#38EF7D', '#FFD166', '#FF6B8B', '#A78BFA'];

export default function SuspectSearch() {
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
      rotate: Math.floor(Math.random() * 26) - 13,
      translateY: Math.floor(Math.random() * 6) - 3,
      color: CAPTCHA_COLORS[Math.floor(Math.random() * CAPTCHA_COLORS.length)],
      fontWeight: Math.random() > 0.5 ? '700' : '900',
      fontSize: `${Math.floor(Math.random() * 4) + 19}px`
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

      // If backend gave 0 results or was offline, cross-check client threat intel
      if (finalResults.length === 0) {
        const localMatches = lookupThreatClient(cleanInput);
        finalResults = localMatches;
      }

      setResults(finalResults);
      setSearched(true);

      if (finalResults.length > 0) {
        toast.error(`Alert: Match found! Flagged as SCAM / Suspect in ${finalResults.length} record(s).`);
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
    <div style={{ 
      background: '#02060A', 
      minHeight: '100vh', 
      fontFamily: 'Inter, sans-serif',
      color: '#fff',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Liquid Atmospheric Accents */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 255, 170, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <main style={{ maxWidth: '1100px', margin: '50px auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        
        {/* Title Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '30px', background: 'rgba(0, 180, 255, 0.1)', border: '1px solid rgba(0, 180, 255, 0.3)', color: '#00B4FF', fontSize: '12px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '14px' }}>
            I4C CYBERCRIME INTELLIGENCE REGISTRY
          </div>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 800,
            fontFamily: 'Orbitron, monospace',
            background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 14px 0',
            letterSpacing: '-1px'
          }}>
            Suspect <span style={{ color: '#00B4FF' }}>Search</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', maxWidth: '680px', margin: '0 auto' }}>
            National Cybercrime Registry intelligence search engine for public safety and suspect credential verification.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px', 
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            padding: '36px'
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
            This repository of suspect identifiers has been created on the basis of multiple complaints filed by citizens for cybercrimes on this portal.
          </p>

          {/* Category Selector */}
          <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '12px 0 10px', marginBottom: '24px', scrollbarWidth: 'none' }}>
            {searchCategories.map(cat => {
              const isActive = activeCategory.id === cat.id;
              return (
                <div 
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat);
                    setInputValue('');
                    setSearched(false);
                    setResults([]);
                  }}
                  style={{
                    position: 'relative',
                    flex: '0 0 auto',
                    width: '120px',
                    height: '120px',
                    boxSizing: 'border-box',
                    padding: '16px 8px 10px',
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isActive ? '1px solid rgba(0, 180, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(0, 180, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isActive ? '0 10px 20px rgba(0, 180, 255, 0.15)' : 'none'
                  }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  {isActive && (
                    <div style={{ 
                      position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
                      background: '#00B4FF', color: '#fff', borderRadius: '50%',
                      width: '18px', height: '18px', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', fontSize: '10px',
                      fontWeight: 'bold', zIndex: 1, boxShadow: '0 0 10px rgba(0, 180, 255, 0.5)'
                    }}>
                      v
                    </div>
                  )}
          <img src={`/icons/cyberguard/${cat.icon}`} alt="" style={{ width: 42, height: 42, objectFit: 'contain', marginBottom: '8px' }} />
                  <div style={{ fontSize: '12px', color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', textAlign: 'center', fontWeight: isActive ? 'bold' : 'normal', padding: '0 5px' }}>
                    {cat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Demo Test Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Quick Test:</span>
            <button
              type="button"
              onClick={() => { setInputValue(activeCategory.sampleScam); setCaptchaValue(captchaCode); }}
              style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.4)', borderRadius: '8px', padding: '4px 10px', color: '#FF3B30', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
            >
              Fill Sample Scam ({activeCategory.sampleScam})
            </button>
            <button
              type="button"
              onClick={() => { setInputValue(activeCategory.sampleSafe); setCaptchaValue(captchaCode); }}
              style={{ background: 'rgba(0,255,170,0.1)', border: '1px solid rgba(0,255,170,0.3)', borderRadius: '8px', padding: '4px 10px', color: '#00FFAA', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Fill Sample Safe ({activeCategory.sampleSafe})
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSearch} style={{ marginBottom: '32px' }}>
            <div style={{ color: '#FF3B30', fontSize: '13px', marginBottom: '15px', fontWeight: '600', letterSpacing: '0.5px' }}>
              {activeCategory.warning}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {activeCategory.label} <span style={{ color: '#FF3B30' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder={`Enter ${activeCategory.label}...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px 16px', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.12)', 
                    borderRadius: '12px', fontSize: '14px', color: '#fff',
                    outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#00B4FF'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flex: 2, minWidth: '380px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Captcha <span style={{ color: '#FF3B30' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    
                    {/* Dynamic High-Tech Captcha Box */}
                    <div 
                      title="Security Captcha Verification"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.9) 0%, rgba(5, 20, 35, 0.95) 100%)', 
                        border: '1px solid rgba(0, 180, 255, 0.3)', 
                        padding: '4px 14px', 
                        fontFamily: 'monospace', 
                        borderRadius: '10px', 
                        height: '44px', 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        userSelect: 'none',
                        minWidth: '130px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 0 15px rgba(0, 180, 255, 0.15), 0 4px 12px rgba(0,0,0,0.5)',
                        backgroundImage: 'radial-gradient(rgba(0, 180, 255, 0.15) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '12px 12px, 8px 8px'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 180, 255, 0.08) 2px, rgba(0, 180, 255, 0.08) 4px)',
                        pointerEvents: 'none'
                      }} />

                      {captchaCode.split('').map((char, index) => {
                        const style = charStyles[index] || {};
                        return (
                          <span 
                            key={index}
                            style={{
                              display: 'inline-block',
                              transform: `rotate(${style.rotate || 0}deg) translateY(${style.translateY || 0}px)`,
                              color: style.color || '#00FFD1',
                              fontWeight: style.fontWeight || '800',
                              fontSize: style.fontSize || '20px',
                              letterSpacing: '2px',
                              textShadow: `0 0 8px ${style.color || '#00FFD1'}66`
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </div>

                    {/* Turn Arrow / Refresh Button */}
                    <motion.button
                      type="button"
                      onClick={refreshCaptcha}
                      title="Generate new Captcha"
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{ rotate: rotationDegrees }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                      style={{ 
                        background: 'rgba(0, 180, 255, 0.1)', 
                        border: '1px solid rgba(0, 180, 255, 0.3)',
                        borderRadius: '10px',
                        width: '44px',
                        height: '44px',
                        fontSize: '20px', 
                        cursor: 'pointer', 
                        color: '#00B4FF', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        flexShrink: 0,
                        outline: 'none',
                        boxShadow: '0 4px 10px rgba(0, 180, 255, 0.15)'
                      }}
                    >
                      ↻
                    </motion.button>

                    <input 
                      type="text" 
                      placeholder="Enter Captcha"
                      value={captchaValue}
                      onChange={(e) => setCaptchaValue(e.target.value)}
                      style={{ 
                        flex: 1, padding: '12px 14px', 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid rgba(255, 255, 255, 0.12)', 
                        borderRadius: '12px', fontSize: '14px', color: '#fff',
                        height: '44px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s',
                        letterSpacing: '1px'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#00B4FF'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  style={{ 
                    background: 'linear-gradient(135deg, #007AFF 0%, #00B4FF 100%)', 
                    color: '#fff', border: 'none', 
                    padding: '0 28px', height: '44px', borderRadius: '12px', 
                    fontSize: '13px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer',
                    letterSpacing: '1px', transition: 'all 0.3s',
                    boxShadow: '0 10px 20px rgba(0, 180, 255, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                  onMouseOver={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {loading ? 'SEARCHING...' : 'SEARCH'}
                </button>
              </div>
            </div>
          </form>

          {/* Search Query Results Display */}
          <AnimatePresence>
            {searched && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ marginBottom: '32px', textAlign: 'left' }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '16px',
                  padding: '0 4px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <h3 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 800, letterSpacing: '1px' }}>
                    SUSPECT REPOSITORY MATCHES ({results.length})
                  </h3>
                  {results.length > 0 ? (
                    <span style={{ 
                      color: '#FF3B30', 
                      fontSize: '12px', 
                      fontWeight: 800, 
                      letterSpacing: '1px',
                      background: 'rgba(255, 59, 48, 0.15)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 59, 48, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <img src="/icons/cyberguard/critical-threat.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> <strong>SCAM DETECTED:</strong> SUSPECT RECORD CONFIRMED IN DATABASE
                    </span>
                  ) : (
                    <span style={{ 
                      color: '#00FFAA', 
                      fontSize: '12px', 
                      fontWeight: 800, 
                      letterSpacing: '1px',
                      background: 'rgba(0, 255, 170, 0.12)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 255, 170, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <img src="/icons/cyberguard/verified-safe.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> <strong>SAFE:</strong> NO SUSPECT RECORD FOUND (CLEAN)
                    </span>
                  )}
                </div>

                {results.length === 0 ? (
                  <div style={{ 
                    background: 'rgba(0, 255, 170, 0.04)', 
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(0, 255, 170, 0.2)', 
                    borderRadius: '18px', 
                    padding: '36px 24px',
                    textAlign: 'center'
                  }}>
                    <img src="/icons/cyberguard/verified-safe.png" alt="Clean verification" style={{ width: 52, height: 52, objectFit: 'contain', marginBottom: '12px' }} />
                    <h4 style={{ color: '#00FFAA', fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>Clean Verification Record</h4>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '0 auto 12px', maxWidth: 600, lineHeight: 1.6 }}>
                      No reported cybercrime complaints, fraudulent vishing records, or scam flags currently match &quot;<strong style={{ color: '#fff' }}>{inputValue}</strong>&quot;.
                    </p>
                    <div style={{ display: 'inline-block', background: 'rgba(0, 255, 170, 0.1)', padding: '4px 14px', borderRadius: '16px', color: '#00FFAA', fontSize: '11px', fontWeight: 700 }}>
                      Safety Status: Verified Untainted
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {results.map((r, i) => (
                      <motion.div
                        key={r.complaintId || i}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          background: 'rgba(255, 59, 48, 0.04)',
                          backdropFilter: 'blur(30px)',
                          border: '1px solid rgba(255, 59, 48, 0.25)',
                          borderRadius: '16px',
                          padding: '20px 24px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#FF3B30', fontWeight: 800, letterSpacing: '1.5px', fontFamily: 'Orbitron, monospace' }}>
                              {r.complaintId}
                            </span>
                            <span style={{ fontSize: '10px', background: 'rgba(255,59,48,0.2)', color: '#FF3B30', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                              SCAM CONFIRMED
                            </span>
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                            {r.category}
                          </div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                            {r.details || `Logged on cybercrime suspect database.`}
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            Identifier: <span style={{ color: '#00B4FF', fontWeight: 600 }}>{r.identifier || inputValue}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            padding: '6px 12px', 
                            borderRadius: '8px',
                            background: 'rgba(255,59,48,0.15)',
                            color: '#FF3B30',
                            fontWeight: 800,
                            border: '1px solid rgba(255,59,48,0.4)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                          }}>
                            {(r.riskLevel || r.severity || 'HIGH').toUpperCase()} RISK
                          </span>
                          <span style={{ 
                            fontSize: '11px', 
                            padding: '6px 12px', 
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 700,
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                          }}>
                            {r.status || 'FLAGGED'}
                          </span>
                          <a 
                            href={r.complaintId.startsWith('CC-') ? `/track/${r.complaintId}` : '/forensics'} 
                            style={{ 
                              fontSize: '12px', 
                              color: '#00B4FF', 
                              textDecoration: 'none',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            DOSSIER →
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Disclaimer */}
          <div style={{ 
            background: 'rgba(255, 59, 48, 0.05)', 
            border: '1px solid rgba(255, 59, 48, 0.2)', 
            borderRadius: '12px',
            padding: '20px 24px'
          }}>
            <h4 style={{ color: '#FF3B30', margin: '0 0 8px 0', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Disclaimer *</h4>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.7', margin: 0, textAlign: 'justify' }}>
              This search database is created on the basis of cybercrime complaints received from the public and verified intelligence feeds. Indian Cybercrime Coordination Centre (I4C) does not certify the authenticity of complaints which are a matter of active investigation with law enforcement authorities.
            </p>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
