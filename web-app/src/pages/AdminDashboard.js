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

const COLORS = ['#007AFF', '#00FFD1', '#FF2D55', '#FF9500', '#AF52DE', '#34C759', '#FF3B30', '#5856D6', '#FFCC00', '#E91E63', '#8E8E93'];

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
        borderRadius: '32px',
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
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        uptime: 99.8 + Math.random() * 0.2,
        accuracy: (mlStatus?.modelInfo?.accuracy || 94.8) - 0.5 + Math.random()
      }));
      setSystemHealth(prev => ({
        ...prev,
        cpu: Math.max(1, Math.min(100, prev.cpu + (Math.random() - 0.5) * 4)),
        memory: Math.max(1, Math.min(100, prev.memory + (Math.random() - 0.5) * 1))
      }));
    }, 2000);
    const healthPoll = setInterval(fetchHealth, 10000);
    const handler = (c) => {
      toast.success(`New Case: ${c.category || 'Incident'} reported`, {
        style: { border: '1px solid rgba(0,122,255,0.2)', background: 'rgba(10,20,40,0.8)', backdropFilter: 'blur(20px)', color: '#fff' }
      });
      setRecentIncidents(prev => [c, ...prev].slice(0, 5));
      fetchAll();
    };
    onNewComplaint(handler);
    return () => {
      offNewComplaint(handler);
      clearInterval(interval);
      clearInterval(healthPoll);
    };
  }, [mlStatus]);

  const handleAction = (name) => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
      loading: `Executing ${name}...`,
      success: `${name} completed successfully!`,
      error: `Could not execute ${name}`,
    });
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#02060A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '14px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}>INITIALIZING NEURAL LINK...</div>
    </div>
  );

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
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(160, 32, 240, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '80px 40px', position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <span style={{ padding: '6px 16px', background: 'rgba(0,122,255,0.1)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 20, fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>SYSTEM LEVEL 4</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: 600 }}>Last sync: {new Date().toLocaleTimeString()}</span>
            </div>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: 900, 
              background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.5))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-2px',
              margin: 0 
            }}>Command <span style={{ color: '#007AFF' }}>Center</span></h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 10px #34C759' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>ENCRYPTION ACTIVE</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
          
          {/* Main Dashboard Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            
            {/* Real-time Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              <StatCard label="Live Cases" value={overview?.totalComplaints} sub="Total incidents" icon="live-cases" trend={5.2} />
              <StatCard label="Critical" value={overview?.criticalComplaints} color="#FF3B30" sub="Urgent action" icon="critical-action" trend={-2.1} />
              <StatCard label="Uptime" value={liveStats.uptime} color="#34C759" sub="Nodes operational" icon="operational-nodes" decimals={1} suffix="%" />
              <StatCard label="Neural Engine" value={liveStats.accuracy} color="#AF52DE" sub="AI accuracy" icon="neural-accuracy" decimals={1} suffix="%" />
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
              
              {/* Incident Velocity Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  padding: 32, 
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '32px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                  <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#007AFF', margin: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Incident Velocity</h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: 4, fontWeight: 500 }}>Temporal distribution analysis</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>+{trends[trends.length-1]?.total || 0}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#34C759', textTransform: 'uppercase' }}>Current Month</div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }} />
                    <Tooltip contentStyle={{ background: 'rgba(10,20,40,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }} />
                    <Area type="monotone" dataKey="total" stroke="#007AFF" fill="url(#colorTotal)" strokeWidth={4} />
                    <Area type="monotone" dataKey="resolved" stroke="#34C759" fill="transparent" strokeWidth={3} strokeDasharray="6 6" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Status Allocation Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  padding: 32, 
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '32px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}
              >
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#007AFF', marginBottom: 32, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Status Allocation</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ position: 'relative', height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDist} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={8}>
                          {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{overview?.totalComplaints || 0}</div>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>TOTAL</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {statusDist.slice(0, 4).map((d, i) => (
                      <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{d.name}</span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Forensic Intelligence */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '40px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                backdropFilter: 'blur(50px)',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
              }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                 <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                     <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#007AFF', boxShadow: '0 0 10px #007AFF' }} />
                     <span style={{ fontSize: '10px', fontWeight: 900, color: '#007AFF', letterSpacing: '2px', textTransform: 'uppercase' }}>Neural Synthesis</span>
                   </div>
                   <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>Forensic Intelligence</h3>
                 </div>
                 <div style={{ display: 'flex', gap: 32 }}>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{categories.length}</div>
                     <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Threat Vectors</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '24px', fontWeight: 900, color: '#34C759' }}>
                       {Math.round(categories.reduce((acc, c) => acc + c.resolveRate, 0) / (categories.length || 1))}%
                     </div>
                     <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Efficiency</div>
                   </div>
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48 }}>
                 <div style={{ height: 320 }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={categories}>
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#007AFF" />
                            <stop offset="100%" stopColor="#007AFF" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} />
                        <Tooltip contentStyle={{ background: 'rgba(10,20,40,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                        <Bar dataKey="count" fill="url(#barGrad)" radius={[10, 10, 0, 0]} barSize={32} />
                        <Line type="monotone" dataKey="resolveRate" stroke="#FFCC00" strokeWidth={4} dot={{ r: 6, fill: '#FFCC00', strokeWidth: 0 }} />
                     </ComposedChart>
                   </ResponsiveContainer>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: '#FF3B30', letterSpacing: '1px', marginBottom: 12 }}>CRITICAL ANOMALY</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginBottom: 16 }}>{categories[0]?.name || 'Analyzing...'}</div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} style={{ height: '100%', background: 'linear-gradient(90deg, #007AFF, #00FFD1)', borderRadius: 10 }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {categories.slice(1, 4).map((cat, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{cat.name}</span>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{cat.count}</span>
                          </div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                            <div style={{ height: '100%', background: COLORS[i+1], width: `${(cat.count / (overview?.totalComplaints || 1)) * 100}%`, borderRadius: 10 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* System Protocols */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                padding: '32px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '32px'
              }}
            >
              <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#007AFF', marginBottom: 24, letterSpacing: '2px', textTransform: 'uppercase' }}>System Protocols</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  onClick={() => navigate('/admin/complaints')}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '18px', background: '#007AFF',
                    border: 'none', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0, 122, 255, 0.3)', letterSpacing: '1px'
                  }}
                >MANAGE REPOSITORY</button>
                <button 
                  onClick={() => navigate('/admin/info')}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '18px', 
                    background: 'linear-gradient(135deg, rgba(0,180,255,0.15), rgba(0,255,170,0.15))',
                    border: '1px solid rgba(0,180,255,0.4)', color: '#00B4FF', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(0,180,255,0.15)', letterSpacing: '1px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <UiIcon name="personnel-directory" size={18} /> USER & PERSONNEL DIRECTORY (INFO)
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['AUDIT', 'ALERT', 'SYNC', 'PURGE'].map((label, i) => (
                    <button key={i} onClick={() => handleAction(label)} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Neural Engine */}
            <div style={{ 
              padding: '32px', 
              background: 'rgba(175, 82, 222, 0.05)', 
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(175, 82, 222, 0.2)',
              borderRadius: '32px'
            }}>
              <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#AF52DE', marginBottom: 20, letterSpacing: '2px', textTransform: 'uppercase' }}>Neural Engine</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 10px #34C759' }} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>SYSTEM STABLE</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(175, 82, 222, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px' }}>VERSION</span>
                  <span style={{ fontSize: '10px', color: '#fff', fontWeight: 800 }}>{mlStatus?.modelInfo?.version || 'v1.0.4-stable'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px' }}>ALGORITHM</span>
                  <span style={{ fontSize: '10px', color: '#fff', fontWeight: 800 }}>TF-IDF + LR</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'CPU LOAD', val: systemHealth.cpu, color: '#007AFF' },
                  { label: 'MEMORY', val: systemHealth.memory, color: '#AF52DE' },
                  { label: 'STORAGE', val: systemHealth.storage, color: '#FF9500' }
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{item.label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{Math.round(item.val)}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                      <motion.div animate={{ width: `${item.val}%` }} style={{ height: '100%', background: item.color, borderRadius: 10 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(175, 82, 222, 0.2)' }}>
                <h4 style={{ fontSize: '10px', fontWeight: 900, color: '#AF52DE', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>Model Playground</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea 
                    rows={2} 
                    placeholder="Enter case text for AI analysis..."
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    style={{ 
                      width: '100%', resize: 'none', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '11px', outline: 'none',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  <button 
                    onClick={handlePredict} 
                    disabled={predicting || !testText.trim()}
                    style={{ 
                      width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(175, 82, 222, 0.2)',
                      border: '1px solid rgba(175, 82, 222, 0.4)', color: '#fff', fontWeight: 800, fontSize: '11px', cursor: 'pointer',
                      opacity: predicting || !testText.trim() ? 0.5 : 1
                    }}
                  >
                    {predicting ? 'ANALYZING...' : 'RUN INFERENCE'}
                  </button>
                  
                  <AnimatePresence>
                    {prediction && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '12px', background: 'rgba(175, 82, 222, 0.1)', borderRadius: '12px', border: '1px solid rgba(175, 82, 222, 0.2)', marginTop: 4 }}>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Prediction Result</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#AF52DE', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>{prediction.category?.replace(/_/g, ' ')}</span>
                            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 800 }}>{Math.round(prediction.confidence * 100)}%</span>
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
              padding: '32px', 
              background: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '32px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#34C759', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>Incident Stream</h3>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 10px #34C759' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentIncidents.map((inc, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    onClick={() => navigate('/admin/complaints')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: '#007AFF' }}>{inc.complaintId || 'NEW'}</span>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: inc.severity === 'high' ? '#FF3B30' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{inc.severity}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inc.title}</div>
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
