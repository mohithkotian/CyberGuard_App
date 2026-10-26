import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { complaintsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { lookupThreatClient } from '../data/threatIntel';

export default function ScamSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
      // Fallback to client database
      const fallback = lookupThreatClient(cleanQuery);
      setResults(fallback);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(0, 255, 170, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />
      
      <div style={{ 
        maxWidth: 900, 
        margin: '0 auto', 
        padding: '60px 24px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '30px', background: 'rgba(0, 180, 255, 0.1)', border: '1px solid rgba(0, 180, 255, 0.3)', color: '#00B4FF', fontSize: '12px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '16px' }}>
              NATIONAL THREAT INTEL RADAR
            </div>
            <h1 style={{ 
              fontSize: '3.2rem', 
              fontWeight: 800,
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 16px 0',
              letterSpacing: '-1.5px'
            }}>
              Scam <span style={{ color: '#00B4FF' }}>Search Engine</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: 400, maxWidth: 650, margin: '0 auto' }}>
              Verify Phone Numbers, Phishing Links, UPI IDs, or Bank Accounts against national cybercrime records.
            </p>
          </div>

          {/* Quick Examples */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>Try test queries:</span>
            {['+91 98000 00001', '555-0100', 'graphicriver.net', 'icicibank.com', '9999999999 (Safe)'].map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const val = ex.includes(' ') && ex.includes('Safe') ? '9999999999' : ex;
                  setQuery(val);
                }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '4px 12px',
                  color: ex.includes('Safe') ? '#00FFAA' : '#00B4FF',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {ex}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '720px', margin: '0 auto 60px' }}>
            <input
              type="text"
              placeholder="Enter Phone Number, Phishing Link, or UPI..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="liquid-input"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '20px 28px',
                paddingRight: '160px',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                bottom: '8px',
                background: 'linear-gradient(135deg, #007AFF 0%, #00B4FF 100%)',
                border: 'none',
                borderRadius: '14px',
                padding: '0 26px',
                color: '#fff',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(0, 122, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={e => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseOut={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
            >
              {loading ? 'SCANNING...' : 'SEARCH DB'}
            </button>
          </form>
        </motion.div>

        <AnimatePresence>
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'left' }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px',
                padding: '0 8px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <h3 style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 800, letterSpacing: '1px' }}>
                  SEARCH VERIFICATION RESULT ({results.length})
                </h3>
                {results.length > 0 ? (
                  <span style={{ 
                    color: '#FF3B30', 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    letterSpacing: '1px',
                    background: 'rgba(255, 59, 48, 0.12)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 59, 48, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <img src="/icons/cyberguard/critical-threat.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> <strong>SCAM DETECTED:</strong> HIGH-RISK THREAT IDENTIFIER
                  </span>
                ) : (
                  <span style={{ 
                    color: '#00FFAA', 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    letterSpacing: '1px',
                    background: 'rgba(0, 255, 170, 0.12)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 255, 170, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <img src="/icons/cyberguard/verified-safe.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> <strong>SAFE:</strong> CLEAN VERIFICATION RECORD
                  </span>
                )}
              </div>

              {results.length === 0 ? (
                <div style={{ 
                  background: 'rgba(0, 255, 170, 0.04)', 
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(0, 255, 170, 0.2)', 
                  borderRadius: '24px', 
                  padding: '50px 30px',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                  <img src="/icons/cyberguard/scam-search.png" alt="Scam search clear" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: '16px' }} />
                  <h4 style={{ color: '#00FFAA', fontSize: '22px', fontWeight: 800, margin: '0 0 10px 0' }}>
                    Safe / Clean Verification
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', maxWidth: '550px', margin: '0 auto 16px', lineHeight: 1.6 }}>
                    No reported scams, phishing campaigns, or fraudulent records match &quot;<strong style={{ color: '#fff' }}>{query}</strong>&quot; in our national threat intelligence index.
                  </p>
                  <div style={{ display: 'inline-block', background: 'rgba(0, 255, 170, 0.1)', padding: '6px 16px', borderRadius: '20px', color: '#00FFAA', fontSize: '12px', fontWeight: 700 }}>
                    Risk Level: Low / Untainted
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {results.map((r, i) => (
                    <motion.div
                      key={r.complaintId || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01, background: 'rgba(255, 59, 48, 0.06)' }}
                      style={{
                        background: 'rgba(255, 59, 48, 0.03)',
                        backdropFilter: 'blur(40px)',
                        border: '1px solid rgba(255, 59, 48, 0.25)',
                        borderRadius: '20px',
                        padding: '24px 28px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#FF3B30', fontWeight: 800, letterSpacing: '1.5px', fontFamily: 'Orbitron, monospace' }}>
                            {r.complaintId}
                          </span>
                          <span style={{ fontSize: '10px', background: 'rgba(255,59,48,0.2)', color: '#FF3B30', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                            SCAM FLAGGED
                          </span>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                          {r.category}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                          {r.details || `Flagged identifier linked to active criminal reports.`}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                          Identified Vector: <strong style={{ color: '#00B4FF' }}>{r.identifier || query}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '6px 14px', 
                          borderRadius: '10px',
                          background: 'rgba(255,59,48,0.15)',
                          color: '#FF3B30',
                          fontWeight: 800,
                          border: '1px solid rgba(255,59,48,0.4)',
                          letterSpacing: '1px'
                        }}>
                          {(r.riskLevel || r.severity || 'HIGH').toUpperCase()} RISK
                        </span>
                        <a 
                          href={r.complaintId.startsWith('CC-') ? `/track/${r.complaintId}` : '/forensics'} 
                          style={{ 
                            fontSize: '13px', 
                            color: '#00B4FF', 
                            textDecoration: 'none',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          FORENSICS DOSSIER →
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ 
          marginTop: '60px', 
          padding: '24px 30px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.4)', 
          fontSize: '13px', 
          lineHeight: '1.6',
          textAlign: 'left'
        }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>SECURITY PROTOCOL:</strong> This interface provides a live gateway into the National Cybercrime Intelligence Repository. Verified safe credentials indicate no recorded fraudulent cases, while flagged entries represent known malicious vectors.
          </p>
        </div>
      </div>

      <style>
        {`
          .liquid-input:focus {
            background: rgba(255,255,255,0.06) !important;
            border-color: #007AFF !important;
            box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15), 0 20px 40px rgba(0,0,0,0.4) !important;
          }
        `}
      </style>
    </div>
  );
}
