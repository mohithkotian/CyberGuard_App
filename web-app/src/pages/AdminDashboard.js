import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { animate } from "framer-motion";
import Navbar from '../components/Navbar';
import UiIcon from '../components/UiIcon';
import api, { analyticsAPI, adminAPI } from '../services/api';
import { onNewComplaint, offNewComplaint } from '../services/socket';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

const COLORS = ['#3DF5C0', '#d8a43a', '#10b981', '#f2f0ea', '#8e8b84', '#d96464', '#55544f'];

/* ─────────────────────────────────────────────────────────────
   COMPONENT: COUNTER (Smooth Number Transitions)
   ───────────────────────────────────────────────────────────── */
function Counter({ from, to, decimals = 0, suffix = "" }) {
  const nodeRef = useRef();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(from, to, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = value.toFixed(decimals) + suffix;
      }
    });
    return () => controls.stop();
  }, [from, to, decimals, suffix]);

  return <span ref={nodeRef}>{from.toFixed(decimals) + suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT: STAT CARD
   ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon, trend, decimals, suffix }) {
  const [prevValue, setPrevValue] = useState(0);

  useEffect(() => {
    if (value !== undefined) {
      setPrevValue(parseFloat(value) || 0);
    }
  }, [value]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.35 }}><UiIcon name={icon} size={34} /></div>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 800 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: 0 }}>
          <Counter from={prevValue} to={parseFloat(value) || 0} decimals={decimals} suffix={suffix} />
        </h2>
        {trend && <span style={{ fontSize: '12px', fontWeight: 800, color: trend > 0 ? '#34C759' : '#FF3B30' }}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
      </div>
      <p style={{ fontSize: '12px', color: color || 'rgba(255,255,255,0.3)', marginTop: 8, fontWeight: 600 }}>{sub}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [mlStatus, setMlStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [systemHealth, setSystemHealth] = useState({ cpu: 24, memory: 68, storage: 41 });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [liveStats, setLiveStats] = useState({ uptime: 99.9, accuracy: 94.8 });
  const [testText, setTestText] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const handlePredict = async () => {
    if (!testText.trim()) return;
    setPredicting(true);
    try {
      const { data } = await adminAPI.predict(testText);
      setPrediction(data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const fetchHealth = async () => {
    if (!isAdmin()) return;
    try {
      const { data } = await adminAPI.systemStats();
      setSystemHealth(data.data.health);
    } catch (e) { console.error("Health sync failed", e); }
  };

  const fetchAll = async () => {
    if (!isAdmin()) return;
    try {
      const [ov, cat, tr, sd] = await Promise.all([
        analyticsAPI.overview(),
        analyticsAPI.byCategory(),
        analyticsAPI.trends(6),
        analyticsAPI.statusDist(),
      ]);

      setOverview(ov.data.data.overview);
      setCategories(cat.data.data.categories.map(c => ({ 
        name: c._id?.replace(/_/g, ' ') || 'Other', 
        count: c.count,
        resolved: c.resolved,
        resolveRate: c.count > 0 ? Math.round((c.resolved / c.count) * 100) : 0
      })));
      setTrends(tr.data.data.trends);
      setStatusDist(sd.data.data.distribution.map(d => ({ name: d._id?.replace(/_/g, ' '), value: d.count })));

      if (isAdmin()) {
        try {
          const [ml, recent] = await Promise.all([
            adminAPI.mlStatus(),
            api.get('/complaints', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } })
          ]);
          setMlStatus(ml.data.data);
          setRecentIncidents(recent.data.data.complaints);
          if (ml.data.data.modelInfo?.accuracy) setLiveStats(prev => ({ ...prev, accuracy: ml.data.data.modelInfo.accuracy }));
          await fetchHealth();
        } catch (mlErr) { console.error("Sidebar sync failed", mlErr); }
      }
    } catch (e) {
      console.error(e);
      toast.error('Data sync failed. Check your permissions.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      const { syncUser } = useAuthStore.getState();
      await syncUser();
      fetchAll();
    };
    init();

    const healthPoll = setInterval(fetchHealth, 30000);
    const handler = (c) => {
      toast.success(`New Case: ${c.category || 'Incident'} reported`, {
        style: { border: '1px solid #30302d', background: '#0d0d0d', color: '#f2f0ea' }
      });
      setRecentIncidents(prev => [c, ...prev].slice(0, 5));
      fetchAll();
    };
    onNewComplaint(handler);
    return () => {
      offNewComplaint(handler);
      clearInterval(healthPoll);
    };
  }, []);

  const handleAction = (name) => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
      loading: `Executing ${name}...`,
      success: `${name} completed successfully!`,
      error: `Could not execute ${name}`,
    });
  };

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#8e8b84', letterSpacing: '0.12em', textTransform: 'uppercase' }}>INITIALIZING COMMAND INTERFACE...</div>
    </div>
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

      <main className="report-layout" style={{ maxWidth: 1360, margin: '0 auto', padding: '44px 32px 100px', position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <aside className="report-aside" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ padding: '4px 12px', background: '#141414', color: '#EFEDE8', border: '1px solid #30302d', borderRadius: '8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                COMMAND PROTOCOL
              </span>
              <span style={{ color: '#8e8b84', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>
                SYNC: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <h1 style={{ 
              fontSize: 'clamp(2.2rem, 3.2vw, 3rem)', 
              fontWeight: 800, 
              color: '#f2f0ea',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontFamily: "'IBM Plex Sans', sans-serif",
              margin: 0 
            }}>
              Operations Command Center
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: '#0d0d0d', borderRadius: '8px', border: '1px solid #30302d' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f2f0ea', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              GOVERNANCE NETWORK ACTIVE
            </span>
          </div>
        </aside>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 32 }}>
          
          {/* Main Dashboard Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Real-time Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <StatCard label="Live Cases" value={overview?.totalComplaints} sub="Total incidents filed" icon="live-cases" trend={5.2} />
              <StatCard label="Critical" value={overview?.criticalComplaints} color="#d96464" sub="Immediate response required" icon="critical-action" trend={-2.1} />
              <StatCard label="System Uptime" value={liveStats.uptime} color="#3DF5C0" sub="All cluster nodes active" icon="operational-nodes" decimals={1} suffix="%" />
              <StatCard label="Neural Engine" value={liveStats.accuracy} color="#3DF5C0" sub="Model inference accuracy" icon="neural-accuracy" decimals={1} suffix="%" />
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 24 }}>
              
              {/* Incident Velocity Card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  padding: 28, 
                  background: '#0d0d0d',
                  border: '1px solid #30302d',
                  borderRadius: '16px',
                  boxShadow: '0 24px 70px rgba(0,0,0,0.4)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#8e8b84', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      Incident Temporal Velocity
                    </h3>
                    <p style={{ fontSize: '13px', color: '#a6a39b', marginTop: 4, marginBottom: 0 }}>
                      Intake vs resolution telemetry
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      +{trends[trends.length-1]?.total || 0}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#8E8B85', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      Current Cycle
                    </div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorTotalDark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f2f0ea" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f2f0ea" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222220" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8e8b84', fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8e8b84', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                    <Tooltip contentStyle={{ background: '#141414', border: '1px solid #3b3b38', borderRadius: '12px', color: '#f2f0ea' }} />
                    <Area type="monotone" dataKey="total" stroke="#f2f0ea" fill="url(#colorTotalDark)" strokeWidth={2.5} isAnimationActive={false} />
                    <Area type="monotone" dataKey="resolved" stroke="#3DF5C0" fill="transparent" strokeWidth={2} strokeDasharray="4 4" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Status Allocation Card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  padding: 28, 
                  background: '#0d0d0d',
                  border: '1px solid #30302d',
                  borderRadius: '16px',
                  boxShadow: '0 24px 70px rgba(0,0,0,0.4)'
                }}
              >
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#8e8b84', marginBottom: 24, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Status Allocation
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ position: 'relative', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDist} dataKey="value" innerRadius={55} outerRadius={75} paddingAngle={6} isAnimationActive={false}>
                          {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{overview?.totalComplaints || 0}</div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#8e8b84', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>TOTAL CASES</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {statusDist.slice(0, 4).map((d, i) => (
                      <div key={i} style={{ padding: '10px 14px', background: '#141414', borderRadius: '12px', border: '1px solid #262522' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8e8b84', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>{d.name}</span>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Forensic Intelligence */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '36px', 
                background: '#0d0d0d', 
                borderRadius: '16px',
                border: '1px solid #30302d',
                boxShadow: '0 24px 70px rgba(0,0,0,0.4)'
              }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                 <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
                     <span style={{ fontSize: '11px', fontWeight: 700, color: '#EFEDE8', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                       Neural Synthesis
                     </span>
                   </div>
                   <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f2f0ea', letterSpacing: '0.02em', fontFamily: "'IBM Plex Sans', sans-serif", margin: 0 }}>
                     Forensic Vector Intelligence
                   </h3>
                 </div>
                 <div style={{ display: 'flex', gap: 24 }}>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '20px', fontWeight: 800, color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>{categories.length}</div>
                     <div style={{ fontSize: '10px', fontWeight: 700, color: '#8e8b84', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>Vectors</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '20px', fontWeight: 800, color: '#EFEDE8', fontFamily: "'IBM Plex Mono', monospace" }}>
                       {Math.round(categories.reduce((acc, c) => acc + c.resolveRate, 0) / (categories.length || 1))}%
                     </div>
                     <div style={{ fontSize: '10px', fontWeight: 700, color: '#8e8b84', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>Resolution Rate</div>
                   </div>
                 </div>
               </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 36 }}>
                 <div style={{ height: 300, minWidth: 0 }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={categories}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222220" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8e8b84', fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif" }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8e8b84', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} />
                        <Tooltip contentStyle={{ background: '#141414', border: '1px solid #3b3b38', borderRadius: '12px', color: '#f2f0ea' }} />
                        <Bar dataKey="count" fill="#30302d" radius={[8, 8, 0, 0]} barSize={28} isAnimationActive={false} />
                        <Line type="monotone" dataKey="resolveRate" stroke="#3DF5C0" strokeWidth={3} dot={{ r: 4, fill: '#3DF5C0', strokeWidth: 0 }} isAnimationActive={false} />
                     </ComposedChart>
                   </ResponsiveContainer>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ padding: '20px', background: '#141414', borderRadius: '16px', border: '1px solid #30302d' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#d96464', letterSpacing: '0.08em', marginBottom: 8, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        PRIMARY THREAT ANOMALY
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#f2f0ea', marginBottom: 12, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        {categories[0]?.name || 'Analyzing telemetry...'}
                      </div>
                      <div style={{ height: 6, background: '#0d0d0d', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '85%', background: '#d96464', borderRadius: 999 }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {categories.slice(1, 4).map((cat, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#8e8b84' }}>{cat.name}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{cat.count}</span>
                          </div>
                          <div style={{ height: 4, background: '#141414', borderRadius: 999 }}>
                            <div style={{ height: '100%', background: '#3DF5C0', width: `${(cat.count / (overview?.totalComplaints || 1)) * 100}%`, borderRadius: 999 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* System Protocols */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '28px', 
                background: '#0d0d0d', 
                border: '1px solid #30302d',
                borderRadius: '16px'
              }}
            >
              <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                System Protocols
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button 
                  onClick={() => navigate('/admin/complaints')}
                  style={{ 
                    width: '100%', padding: '14px', borderRadius: '999px', background: '#f2f0ea',
                    border: 'none', color: '#070707', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em'
                  }}
                >
                  MANAGE REPOSITORY
                </button>
                <button 
                  onClick={() => navigate('/admin/info')}
                  style={{ 
                    width: '100%', padding: '12px', borderRadius: '999px', 
                    background: '#141414', border: '1px solid #30302d', color: '#d8d5ce', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <UiIcon name="personnel-directory" size={16} /> USER DIRECTORY
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['AUDIT', 'ALERT', 'SYNC', 'PURGE'].map((label, i) => (
                    <button key={i} onClick={() => handleAction(label)} style={{ padding: '10px', borderRadius: '999px', background: '#141414', border: '1px solid #30302d', color: '#8e8b84', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Neural Engine */}
            <div style={{ 
              padding: '28px', 
              background: '#0d0d0d', 
              border: '1px solid #30302d',
              borderRadius: '16px'
            }}>
              <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Neural Engine Monitor
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>INFERENCE CLUSTER STABLE</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #242421' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>VERSION</span>
                  <span style={{ fontSize: '10px', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{mlStatus?.modelInfo?.version || 'v1.0.4-stable'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>ALGORITHM</span>
                  <span style={{ fontSize: '10px', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>TF-IDF + LR</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'CPU LOAD', val: systemHealth.cpu, color: '#3DF5C0' },
                  { label: 'MEMORY', val: systemHealth.memory, color: '#d8a43a' },
                  { label: 'STORAGE', val: systemHealth.storage, color: '#8e8b84' }
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#8e8b84', fontFamily: "'IBM Plex Sans', sans-serif" }}>{item.label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(item.val)}%</span>
                    </div>
                    <div style={{ height: 4, background: '#141414', borderRadius: 999 }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, item.val))}%`, height: '100%', background: item.color, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #242421' }}>
                <h4 style={{ fontSize: '10px', fontWeight: 700, color: '#8e8b84', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Model Playground
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea 
                    rows={2} 
                    placeholder="Enter case text for inference test..."
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    style={{ 
                      width: '100%', resize: 'none', background: '#141414', border: '1px solid #30302d',
                      borderRadius: '12px', padding: '10px', color: '#f2f0ea', fontSize: '12px', outline: 'none',
                      boxSizing: 'border-box', fontFamily: "'IBM Plex Sans', sans-serif"
                    }}
                  />
                  <button 
                    onClick={handlePredict} 
                    disabled={predicting || !testText.trim()}
                    style={{ 
                      width: '100%', padding: '10px', borderRadius: '999px', background: '#f2f0ea',
                      border: 'none', color: '#070707', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                      fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em',
                      opacity: predicting || !testText.trim() ? 0.5 : 1
                    }}
                  >
                    {predicting ? 'INFERRING...' : 'RUN INFERENCE'}
                  </button>
                  
                  <AnimatePresence>
                    {prediction && (
                      <motion.div 
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: 'easeOut' }}
                      >
                        <div style={{ padding: '10px', background: '#141414', borderRadius: '12px', border: '1px solid #30302d', marginTop: 4 }}>
                          <div style={{ fontSize: '9px', color: '#8e8b84', textTransform: 'uppercase', marginBottom: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>Prediction Result</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#EFEDE8', fontWeight: 700, fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                              {prediction.category?.replace(/_/g, ' ')}
                            </span>
                            <span style={{ color: '#f2f0ea', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                              {Math.round(prediction.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Incident Stream */}
            <div style={{ 
              padding: '28px', 
              background: '#0d0d0d', 
              border: '1px solid #30302d',
              borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b84', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Realtime Case Stream
                </h3>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentIncidents.map((inc, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -1 }}
                    style={{ padding: '14px', background: '#141414', borderRadius: '14px', border: '1px solid #262522', cursor: 'pointer' }}
                    onClick={() => navigate('/admin/complaints')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#EFEDE8', fontFamily: "'IBM Plex Mono', monospace" }}>{inc.complaintId || 'NEW'}</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: inc.severity === 'high' ? '#d96464' : '#8e8b84', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>{inc.severity}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f2f0ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'IBM Plex Sans', sans-serif" }}>{inc.title}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
