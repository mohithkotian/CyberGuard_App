import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { analyticsAPI } from '../services/api';

const COLORS = ['#3DF5C0', '#d8a43a', '#10b981', '#f2f0ea', '#8e8b84', '#d96464', '#55544f'];
const TT = { 
  background: '#141414', 
  border: '1px solid #3b3b38', 
  borderRadius: '12px',
  color: '#f2f0ea', 
  fontSize: '12px',
  padding: '12px'
};

export default function AdminAnalytics() {
  const [trends,    setTrends]    = useState([]);
  const [cats,      setCats]      = useState([]);
  const [geo,       setGeo]       = useState([]);
  const [financial, setFinancial] = useState({ data: [], total: 0 });
  const [months,    setMonths]    = useState(12);
  const [loading,   setLoading]   = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tr, ca, ge, fi] = await Promise.all([
        analyticsAPI.trends(months),
        analyticsAPI.byCategory(),
        analyticsAPI.geographic(),
        analyticsAPI.financial(),
      ]);
      setTrends(tr.data.data.trends);
      setCats(ca.data.data.categories.map(c => ({ name: c._id?.replace(/_/g,' ') || 'other', count: c.count, resolved: c.resolved })));
      setGeo(ge.data.data.geographic.map(g => ({ state: g._id, count: g.count })));
      setFinancial({ data: fi.data.data.financialAnalysis, total: fi.data.data.totalFinancialLoss });
    } catch { toast.error('Failed to load analytics'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [months]);

  const Section = ({ title, children, full = false }) => (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        gridColumn: full ? 'span 2' : 'span 1',
        background: '#0d0d0d',
        border: '1px solid #30302d',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 24px 70px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <h3 style={{ 
        fontSize: '12px', 
        color: '#8e8b84', 
        marginBottom: '28px', 
        fontWeight: 700, 
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: "'IBM Plex Sans', sans-serif",
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
        {title}
      </h3>
      {children}
    </motion.div>
  );

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

        <aside className="report-aside" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <p className="eyebrow" style={{ color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 10px' }}>
              THREAT LANDSCAPE & TELEMETRY
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
              Neural Intelligence Analytics
            </h1>
            <p style={{ color: '#8e8b84', fontSize: '15px', fontWeight: 500, margin: 0 }}>
              Global threat vectors, damage synthesis, and geographic distribution across all jurisdiction nodes.
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            background: '#0d0d0d', 
            padding: '4px', 
            borderRadius: '999px',
            border: '1px solid #30302d'
          }}>
            {[3, 6, 12].map(m => (
              <button 
                key={m} 
                onClick={() => setMonths(m)}
                style={{ 
                  padding: '8px 18px', 
                  fontSize: '12px', 
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  transition: 'all 0.16s ease',
                  background: months === m ? '#f2f0ea' : 'transparent',
                  border: 'none',
                  color: months === m ? '#070707' : '#8e8b84',
                  letterSpacing: '0.04em'
                }}>
                {m}M WINDOW
              </button>
            ))}
          </div>
        </aside>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 100, color: '#8e8b84', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            SYNTHESIZING NEURAL TELEMETRY...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Area trend */}
            <Section title="Complaint Intake & Resolution Velocity" full>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="gTotalDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f2f0ea" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f2f0ea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222220" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8e8b84', fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8e8b84', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                  <Tooltip contentStyle={TT} />
                  <Area type="monotone" dataKey="total" stroke="#f2f0ea" fill="url(#gTotalDark)" name="Total Reports" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="resolved" stroke="#3DF5C0" fill="transparent" name="Neutralized Cases" strokeWidth={2} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </Section>

            {/* Category horizontal bar */}
            <Section title="Threat Vector Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cats} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#d8d5ce', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }} width={130} />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="count" name="Case Count" fill="#30302d" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </Section>

            {/* Geographic */}
            <Section title="Regional Impact Clusters">
              <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 8 }}>
                {geo.slice(0, 15).map((g, i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>{g.state}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#EFEDE8', fontFamily: "'IBM Plex Mono', monospace" }}>{g.count} INCIDENTS</span>
                    </div>
                    <div style={{ background: '#141414', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.24, delay: i * 0.03, ease: 'easeOut' }}
                        style={{ 
                          width: `${geo[0]?.count ? (g.count / geo[0].count * 100).toFixed(0) : 0}%`,
                          transformOrigin: 'left center',
                          height: '100%', 
                          borderRadius: 999, 
                          background: '#3DF5C0' 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Financial */}
            <Section title={`Financial Damage Synthesis — ₹${financial.total?.toLocaleString('en-IN') || 0}`} full>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #262522' }}>
                      {['CRIME CATEGORY','TOTAL DAMAGE (₹)','AVG IMPACT (₹)','MAX IMPACT (₹)','ACTIVE CASES'].map(h => (
                        <th key={h} style={{ 
                          padding: '16px 20px', textAlign: 'left', fontSize: '10px',
                          color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {financial.data.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1a1a1a', transition: 'background-color 0.16s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#141414'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#f2f0ea', fontWeight: 700, textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                          {r._id?.replace(/_/g,' ')}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '14px', color: '#d96464', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                          ₹{r.totalLoss?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#d8a43a', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                          ₹{Math.round(r.avgLoss)?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#f2f0ea', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                          ₹{r.maxLoss?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ padding: '4px 10px', background: '#141414', border: '1px solid #30302d', borderRadius: '8px', color: '#EFEDE8', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                            {r.count} CASES
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
