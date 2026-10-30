import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../hooks/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI, complaintsAPI } from '../services/api';
import JarvisAssistant from '../components/JarvisAssistant';
import HolographicBuildMode from '../components/HolographicBuildMode';

const JsonView = ({ obj }) => (
  <div style={{ 
    fontFamily: '"Fira Code", monospace', 
    fontSize: 13, 
    lineHeight: 1.6, 
    color: '#A9B1D6', 
    paddingLeft: 20,
    borderLeft: '1px solid rgba(255,255,255,0.05)'
  }}>
    {Object.entries(obj).map(([key, value]) => (
      <div key={key} style={{ marginBottom: 4 }}>
        <span style={{ color: '#00B4FF', fontWeight: 600 }}>{key}</span>: 
        {typeof value === 'object' && value !== null ? (
          <JsonView obj={value} />
        ) : (
          <span style={{ 
            color: typeof value === 'number' ? '#FF9E64' : 
                   typeof value === 'boolean' ? '#BB9AF7' : 
                   '#9ECE6A',
            marginLeft: 8 
          }}>
            {JSON.stringify(value)}
          </span>
        )}
      </div>
    ))}
  </div>
);

export default function DeveloperPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jarvis'); // jarvis, database, accounts, ai
  const [dbData, setDbData] = useState({ users: [], complaints: [] });
  
  // AI Assistant state
  const [aiInput, setAiInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Welcome Developer. I am FRIDAY, your personal God-Mode Assistant. I have full read/write access to the entire CyberGuard infrastructure. How can I assist you today?' }
  ]);
  const jarvisSpoken = useRef(false);

  // Codebase state
  const [codebaseTree, setCodebaseTree] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCodebase, setShowCodebase] = useState(false);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  const handleAccessCodebase = async () => {
    setShowCodebase(true);
    if (codebaseTree) return; 
    setIsLoadingCode(true);
    try {
      const res = await adminAPI.getCodebase();
      setCodebaseTree(res.data.data.codebase);
    } catch (err) {
      console.error(err);
      toast.error('Failed to access secure codebase');
    } finally {
      setIsLoadingCode(false);
    }
  };

  const renderFileTree = (nodes, pad = 0) => {
    if (!nodes) return null;
    return nodes.map((node, i) => (
      <div key={node.name + i} style={{ paddingLeft: pad, marginBottom: 5 }}>
        {node.type === 'directory' ? (
          <div>
            <span style={{ color: '#00B4FF', marginRight: 5 }}>▤</span>
            <span style={{ color: '#A9B1D6', fontFamily: 'monospace', fontSize: 13 }}>{node.name}</span>
            <div>{renderFileTree(node.children, pad + 15)}</div>
          </div>
        ) : (
          <div 
            onClick={() => setSelectedFile(node)}
            style={{ 
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              background: selectedFile?.name === node.name ? 'rgba(0,255,136,0.2)' : 'transparent',
              padding: '2px 5px', borderRadius: 4
            }}
          >
            <span style={{ color: '#00FF88', marginRight: 5 }}>▤</span>
            <span style={{ color: selectedFile?.name === node.name ? '#00FF88' : '#888', fontFamily: 'monospace', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
          </div>
        )}
      </div>
    ));
  };

  useEffect(() => {
    if (user?.email !== 'pruthvishetty04@gmail.com') {
      toast.error('UNAUTHORIZED: SEVERE VIOLATION LOGGED');
      navigate('/');
    } else {
      fetchSystemData();
      if (!jarvisSpoken.current) {
        const startupAudio = new Audio('/voices/startup.mp3');
        startupAudio.volume = 0.6;
        startupAudio.play().catch(e => console.log('Audio blocked:', e));
        jarvisSpoken.current = true;
      }
    }
  }, [user, navigate]);

  const fetchSystemData = async () => {
    try {
      const [usersRes, complaintsRes] = await Promise.all([
        adminAPI.getUsers({ limit: 1000 }),
        complaintsAPI.getAll({ limit: 1000 })
      ]);
      setDbData({
        users: usersRes.data?.data?.users || [],
        complaints: complaintsRes.data?.data?.complaints || []
      });
    } catch (error) {
      console.error('Failed to fetch god mode data', error);
      toast.error('System synchronization failed.');
    }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', text: aiInput }];
    setChatHistory(newHistory);
    setAiInput('');
    setIsTyping(true);

    // Simulate AI response based on queries
    setTimeout(() => {
      let response = "I have processed your request. System logs updated.";
      const lowerInput = newHistory[newHistory.length - 1].text.toLowerCase();
      
      if (lowerInput.includes('monitor') || lowerInput.includes('who is online')) {
        response = `Currently monitoring ${dbData.users.length} registered nodes. Traffic is nominal. 3 active sessions detected.`;
      } else if (lowerInput.includes('purge') || lowerInput.includes('delete')) {
        response = `WARNING: Destructive action requested. Awaiting Developer physical confirmation key.`;
      } else if (lowerInput.includes('database') || lowerInput.includes('records')) {
        response = `Database integrity is at 100%. Total records: ${dbData.complaints.length} incidents, ${dbData.users.length} identities.`;
      } else if (lowerInput.includes('recent') || lowerInput.includes('new complaint')) {
        if (dbData.complaints.length > 0) {
          const latest = dbData.complaints[dbData.complaints.length - 1];
          response = `The most recent incident registered is ID: ${latest.complaintId || latest._id}. Category: ${latest.category || 'N/A'}. Status: ${latest.status || 'N/A'}.`;
        } else {
          response = `There are no new complaints registered in the system database at this time.`;
        }
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        response = `Greetings, Developer. All neural links are active and systems are green.`;
      } else {
        response = `Developer, I have processed your input regarding "${newHistory[newHistory.length - 1].text}". Analyzing system logs for related anomalies... All systems green. How else can I assist?`;
      }

      setChatHistory([...newHistory, { role: 'ai', text: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await adminAPI.updateRole(userId, newRole);
      toast.success('Identity authorization updated.');
      fetchSystemData();
    } catch (error) {
      toast.error('Update failed.');
    }
  };

  if (user?.email !== 'pruthvishetty04@gmail.com') return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#02060A',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* HEADER */}
      <header style={{
        height: '70px',
        borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 30px',
        justifyContent: 'space-between',
        background: 'rgba(0, 255, 136, 0.02)',
        boxShadow: '0 4px 30px rgba(0, 255, 136, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{ width: 30, height: 30, border: '2px dashed #00FF88', borderRadius: '50%' }}
          />
          <h1 style={{ margin: 0, fontSize: '20px', fontFamily: 'Orbitron, monospace', letterSpacing: '3px', color: '#00FF88' }}>
            DEVELOPER OVERRIDE <span style={{ color: '#fff', opacity: 0.5 }}>// ROOT ACCESS</span>
          </h1>
        </div>
        <button onClick={() => navigate('/admin')} style={{
          background: 'transparent',
          border: '1px solid #00FF88',
          color: '#00FF88',
          padding: '8px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'Orbitron, monospace'
        }}>
          EXIT GOD MODE
        </button>
      </header>

      {/* MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div style={{
          width: '250px',
          borderRight: '1px solid rgba(0, 255, 136, 0.1)',
          background: 'rgba(255, 255, 255, 0.01)',
          padding: '20px 0'
        }}>
          {['jarvis', 'database', 'accounts', 'developer', 'ai', 'build'].map(tab => (
            <div 
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'jarvis') {
                  const startupAudio = new Audio('/voices/startup.mp3');
                  startupAudio.volume = 0.6;
                  startupAudio.play().catch(e => console.log('Audio blocked:', e));
                }
              }}
              style={{
                padding: '15px 30px',
                cursor: 'pointer',
                fontFamily: 'Orbitron, monospace',
                fontSize: '14px',
                letterSpacing: '1px',
                background: activeTab === tab ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                borderLeft: activeTab === tab ? '4px solid #00FF88' : '4px solid transparent',
                color: activeTab === tab ? '#00FF88' : '#888',
                transition: '0.2s',
                textTransform: 'uppercase'
              }}
            >
              {tab === 'ai' ? 'FRIDAY ASSISTANT' : tab === 'jarvis' ? 'J.A.R.V.I.S.' : tab === 'developer' ? 'DEVELOPER' : tab === 'build' ? 'HOLOGRAPHIC BUILD' : `SYSTEM ${tab}`}
            </div>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {activeTab === 'database' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontFamily: 'Orbitron, monospace', color: '#00FF88', marginTop: 0 }}>RAW DATABASE METRICS</h2>
              <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: 30, borderRadius: 12, border: '1px solid rgba(0,255,136,0.1)' }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#fff' }}>{dbData.users.length}</div>
                  <div style={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Total Identities</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: 30, borderRadius: 12, border: '1px solid rgba(0,255,136,0.1)' }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#fff' }}>{dbData.complaints.length}</div>
                  <div style={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Total Incidents</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: 30, borderRadius: 12, border: '1px solid rgba(0,255,136,0.1)' }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#00FF88' }}>100%</div>
                  <div style={{ color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>System Integrity</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: 20, borderRadius: 12, border: '1px solid rgba(0,255,136,0.1)' }}>
                <div style={{ fontFamily: 'monospace', color: '#00FF88', marginBottom: 20 }}>> SELECT * FROM core_matrix WHERE status='active';</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {dbData.complaints.map((c, i) => (
                    <motion.div 
                      key={c._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ 
                        padding: 0, 
                        overflow: 'hidden', 
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ 
                        padding: '12px 24px', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FFD1', boxShadow: '0 0 10px #00FFD1' }} />
                          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 12, color: '#fff' }}>RECORD: {c.complaintId || c._id}</span>
                        </div>
                        <span style={{ fontSize: 10, color: '#5A6480', fontFamily: 'monospace' }}>_id: {c._id}</span>
                      </div>
                      
                      <div style={{ padding: 24 }}>
                        <JsonView obj={c} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'developer' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h2 style={{ fontFamily: 'Orbitron, monospace', color: '#00FFD1', margin: 0, textShadow: '0 0 10px rgba(0, 255, 209, 0.5)' }}>SYSTEM ARCHITECTURE // BLOCK DIAGRAM</h2>
                <button 
                  onClick={() => showCodebase ? setShowCodebase(false) : handleAccessCodebase()}
                  style={{
                    background: showCodebase ? 'rgba(255,0,85,0.1)' : 'rgba(0,255,136,0.1)',
                    border: showCodebase ? '1px solid #FF0055' : '1px solid #00FF88',
                    color: showCodebase ? '#FF0055' : '#00FF88',
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'Orbitron, monospace', fontSize: 12
                  }}
                >
                  {showCodebase ? 'EXIT CODEBASE' : 'ACCESS CODEBASE'}
                </button>
              </div>
              
              {showCodebase ? (
                <div style={{ flex: 1, display: 'flex', gap: 20, overflow: 'hidden', height: 600 }}>
                  {/* Left Pane - File Tree */}
                  <div style={{ 
                    width: '300px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,180,255,0.3)',
                    borderRadius: 12, padding: 15, overflowY: 'auto', display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ color: '#00B4FF', fontFamily: 'Orbitron, monospace', marginBottom: 15, borderBottom: '1px solid rgba(0,180,255,0.2)', paddingBottom: 10 }}>SYSTEM REPOSITORY</div>
                    {isLoadingCode ? (
                      <div style={{ color: '#00B4FF', fontFamily: 'monospace', fontSize: 12, marginTop: 20 }}>Scanning secure sectors...</div>
                    ) : (
                      <div style={{ flex: 1 }}>{renderFileTree(codebaseTree)}</div>
                    )}
                  </div>

                  {/* Right Pane - Code Viewer */}
                  <div style={{ 
                    flex: 1, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,255,136,0.3)',
                    borderRadius: 12, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ color: '#00FF88', fontFamily: 'Orbitron, monospace', marginBottom: 15, borderBottom: '1px solid rgba(0,255,136,0.2)', paddingBottom: 10 }}>
                      {selectedFile ? `VIEWING: ${selectedFile.name}` : 'AWAITING FILE SELECTION...'}
                    </div>
                    {selectedFile ? (
                      <pre style={{ margin: 0, fontFamily: '"Fira Code", monospace', fontSize: 13, color: '#A9B1D6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {selectedFile.content}
                      </pre>
                    ) : (
                      <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 14, marginTop: 40, textAlign: 'center' }}>
                        No file selected. Click a document in the repository to view its raw neural structure.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: 600, background: 'radial-gradient(circle at center, rgba(0, 180, 255, 0.05) 0%, transparent 70%)', border: '1px solid rgba(0, 180, 255, 0.2)', borderRadius: 20, overflow: 'hidden' }}>
                  {/* SVG Connections with data packets (pipelining) */}
                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <defs>
                      <filter id="neonGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Flow Lines */}
                    <path id="path-web-api" d="M 280 200 C 350 200 350 300 420 300" fill="none" stroke="rgba(0, 180, 255, 0.3)" strokeWidth="3" filter="url(#neonGlow)"/>
                    <path id="path-mob-api" d="M 280 400 C 350 400 350 300 420 300" fill="none" stroke="rgba(0, 180, 255, 0.3)" strokeWidth="3" filter="url(#neonGlow)"/>
                    <path id="path-api-ml"  d="M 580 300 C 650 300 650 200 720 200" fill="none" stroke="rgba(255, 0, 85, 0.3)" strokeWidth="3" filter="url(#neonGlow)"/>
                    <path id="path-api-db"  d="M 580 300 C 650 300 650 400 720 400" fill="none" stroke="rgba(0, 255, 136, 0.3)" strokeWidth="3" filter="url(#neonGlow)"/>
                    
                    {/* Animated Data Packets (Pipelining) */}
                    <circle r="5" fill="#fff" filter="url(#neonGlow)">
                      <animateMotion dur="2s" repeatCount="indefinite" path="M 280 200 C 350 200 350 300 420 300" />
                    </circle>
                    <circle r="5" fill="#fff" filter="url(#neonGlow)">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path="M 280 400 C 350 400 350 300 420 300" />
                    </circle>
                    <circle r="5" fill="#FF0055" filter="url(#neonGlow)">
                      <animateMotion dur="1.5s" repeatCount="indefinite" path="M 580 300 C 650 300 650 200 720 200" />
                    </circle>
                    <circle r="5" fill="#00FF88" filter="url(#neonGlow)">
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M 580 300 C 650 300 650 400 720 400" />
                    </circle>
                  </svg>

                  {/* WEB APP BLOCK */}
                  <div style={{ position: 'absolute', top: 200, left: 200, transform: 'translate(-50%, -50%)', width: 160, height: 80, background: 'rgba(3, 15, 25, 0.9)', border: '2px solid #00B4FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 180, 255, 0.3)', flexDirection: 'column', zIndex: 2 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'Orbitron', letterSpacing: 1 }}>WEB APP</div>
                    <div style={{ color: '#00B4FF', fontSize: 10, marginTop: 4 }}>REACT.JS</div>
                  </div>

                  {/* MOBILE APP BLOCK */}
                  <div style={{ position: 'absolute', top: 400, left: 200, transform: 'translate(-50%, -50%)', width: 160, height: 80, background: 'rgba(3, 15, 25, 0.9)', border: '2px solid #00B4FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 180, 255, 0.3)', flexDirection: 'column', zIndex: 2 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'Orbitron', letterSpacing: 1 }}>MOBILE APP</div>
                    <div style={{ color: '#00B4FF', fontSize: 10, marginTop: 4 }}>REACT NATIVE</div>
                  </div>

                  {/* BACKEND API BLOCK */}
                  <div style={{ position: 'absolute', top: 300, left: 500, transform: 'translate(-50%, -50%)', width: 180, height: 100, background: 'rgba(3, 15, 25, 0.95)', border: '3px solid #00B4FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(0, 180, 255, 0.5)', flexDirection: 'column', zIndex: 2 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'Orbitron', fontSize: 16, letterSpacing: 1 }}>BACKEND CORE</div>
                    <div style={{ color: '#00B4FF', fontSize: 12, marginTop: 4 }}>NODE.JS / EXPRESS</div>
                    <div style={{ color: '#888', fontSize: 10, marginTop: 10 }}>THROUGHPUT: 12ms</div>
                  </div>

                  {/* ML SERVICES BLOCK */}
                  <div style={{ position: 'absolute', top: 200, left: 800, transform: 'translate(-50%, -50%)', width: 160, height: 80, background: 'rgba(3, 15, 25, 0.9)', border: '2px solid #FF0055', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255, 0, 85, 0.3)', flexDirection: 'column', zIndex: 2 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'Orbitron', letterSpacing: 1 }}>ML SERVICES</div>
                    <div style={{ color: '#FF0055', fontSize: 10, marginTop: 4 }}>PYTHON / TENSORFLOW</div>
                  </div>

                  {/* DATABASE BLOCK */}
                  <div style={{ position: 'absolute', top: 400, left: 800, transform: 'translate(-50%, -50%)', width: 160, height: 80, background: 'rgba(3, 15, 25, 0.9)', border: '2px solid #00FF88', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)', flexDirection: 'column', zIndex: 2 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'Orbitron', letterSpacing: 1 }}>DATABASE</div>
                    <div style={{ color: '#00FF88', fontSize: 10, marginTop: 4 }}>MONGODB</div>
                  </div>
                  
                  {/* Floating Metrics Overlay */}
                  <div style={{ position: 'absolute', top: 30, left: 30, background: 'rgba(0,0,0,0.7)', padding: '15px 20px', borderLeft: '4px solid #00B4FF', fontFamily: 'monospace', color: '#00B4FF', borderRadius: 4, backdropFilter: 'blur(10px)', zIndex: 3 }}>
                    <div style={{ marginBottom: 5 }}>SERVER LOAD: <span style={{ color: '#fff', fontWeight: 'bold' }}>24%</span></div>
                    <div style={{ marginBottom: 5 }}>ACTIVE SOCKETS: <span style={{ color: '#fff', fontWeight: 'bold' }}>142</span></div>
                    <div>UPTIME: <span style={{ color: '#fff', fontWeight: 'bold' }}>99.99%</span></div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontFamily: 'Orbitron, monospace', color: '#00FF88', marginTop: 0 }}>GLOBAL IDENTITY MANAGEMENT</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,255,136,0.2)', color: '#888', textAlign: 'left', fontFamily: 'Orbitron, monospace', fontSize: 12 }}>
                    <th style={{ padding: '15px' }}>ID</th>
                    <th style={{ padding: '15px' }}>NAME / EMAIL</th>
                    <th style={{ padding: '15px' }}>CURRENT ROLE</th>
                    <th style={{ padding: '15px' }}>OVERRIDE ROLE</th>
                  </tr>
                </thead>
                <tbody>
                  {dbData.users.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '15px', fontFamily: 'monospace', color: '#888' }}>{u._id.substring(0,8)}</td>
                      <td style={{ padding: '15px' }}>
                        <div>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold',
                          background: u.role === 'admin' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                          color: u.role === 'admin' ? '#00FF88' : '#fff'
                        }}>{u.role.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <select 
                          value={u.role}
                          onChange={(e) => updateUserRole(u._id, e.target.value)}
                          style={{
                            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.3)',
                            color: '#fff', padding: '5px 10px', borderRadius: 4, outline: 'none'
                          }}
                        >
                          <option value="user">USER</option>
                          <option value="officer">OFFICER</option>
                          <option value="education">EDUCATION</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontFamily: 'Orbitron, monospace', color: '#00FF88', marginTop: 0 }}>FRIDAY: DEVELOPER ASSISTANT</h2>
              <div style={{ 
                flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,255,136,0.1)', 
                borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 20 }}>
                  {chatHistory.map((msg, i) => (
                    <div key={i} style={{ 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%', display: 'flex', gap: 15
                    }}>
                      {msg.role === 'ai' && (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: '1px solid #00FF88', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00FF88', fontFamily: 'Orbitron, monospace', fontWeight: 'bold' }}>
                          F
                        </div>
                      )}
                      <div style={{
                        background: msg.role === 'user' ? 'rgba(0,180,255,0.1)' : 'rgba(255,255,255,0.03)',
                        border: msg.role === 'user' ? '1px solid rgba(0,180,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                        padding: '15px 20px', borderRadius: '12px', color: '#fff',
                        lineHeight: 1.5
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div style={{ color: '#00FF88', fontFamily: 'monospace', fontSize: 12 }}>FRIDAY is typing...</div>
                  )}
                </div>

                <form onSubmit={handleAiSubmit} style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <input 
                    type="text" 
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Command FRIDAY..."
                    style={{
                      flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.2)',
                      padding: '15px 20px', borderRadius: '8px', color: '#fff', outline: 'none',
                      fontFamily: 'monospace', fontSize: 14
                    }}
                  />
                  <button type="submit" style={{
                    background: '#00FF88', color: '#000', border: 'none', padding: '0 30px',
                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                    fontFamily: 'Orbitron, monospace', letterSpacing: 1
                  }}>
                    EXECUTE
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'jarvis' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ height: '100%' }}>
              <JarvisAssistant dbData={dbData} />
            </motion.div>
          )}

          {activeTab === 'build' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ height: '100%', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
              <HolographicBuildMode />
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
