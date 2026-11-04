import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { complaintsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDatabase() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await complaintsAPI.getAll({ limit: 100 });
      setData(res.data.data.complaints);
    } catch (err) {
      toast.error('Failed to sync database records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Database exported successfully');
  };

  const filteredData = data.filter(item => 
    item.complaintId.toLowerCase().includes(search.toLowerCase()) ||
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const JsonView = ({ obj }) => (
    <div style={{ 
      fontFamily: "'IBM Plex Mono', monospace", 
      fontSize: 12, 
      lineHeight: 1.6, 
      color: '#d8d5ce', 
      paddingLeft: 16,
      borderLeft: '1px solid #262522'
    }}>
      {Object.entries(obj).map(([key, value]) => (
        <div key={key} style={{ marginBottom: 4 }}>
          <span style={{ color: '#EFEDE8', fontWeight: 600 }}>{key}</span>: 
          {typeof value === 'object' && value !== null ? (
            <JsonView obj={value} />
          ) : (
            <span style={{ 
              color: typeof value === 'number' ? '#d8a43a' : 
                     typeof value === 'boolean' ? '#3DF5C0' : 
                     '#f2f0ea',
              marginLeft: 8 
            }}>
              {JSON.stringify(value)}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="page-shell" style={{ 
      minHeight: '100dvh', 
      background: '#070707',
      color: '#f2f0ea',
      fontFamily: "'IBM Plex Sans', sans-serif"
    }}>
      <Navbar />
      
      <main className="report-layout" style={{ maxWidth: 1360, margin: '0 auto', padding: '44px 32px 100px' }}>
        <aside className="report-aside" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <p className="eyebrow" style={{ color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 10px' }}>
              INTELLIGENCE REPOSITORY
            </p>
            <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'clamp(2.2rem, 3.2vw, 3rem)', fontWeight: 800, color: '#f2f0ea', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
              Core Database Lake
            </h1>
            <p style={{ color: '#8e8b84', fontSize: '15px', marginTop: 4, marginBottom: 0 }}>
              Live intelligence lake query engine and raw evidentiary object inspection.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button 
              onClick={handleDownload} 
              style={{ padding: '10px 22px', borderRadius: '8px', background: '#f2f0ea', color: '#070707', border: 'none', fontWeight: 700, fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer', letterSpacing: '0.04em' }}>
              EXPORT JSON
            </button>
            <input 
              placeholder="Filter by reference ID or title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 260, background: '#0d0d0d', border: '1px solid #30302d', borderRadius: '8px', padding: '10px 18px', color: '#f2f0ea', fontSize: '13px', outline: 'none', fontFamily: "'IBM Plex Sans', sans-serif" }}
            />
            <button 
              onClick={fetchData} 
              style={{ padding: '10px 20px', borderRadius: '8px', background: '#141414', border: '1px solid #30302d', color: '#d8d5ce', fontWeight: 700, fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer', letterSpacing: '0.04em' }}>
              SYNC
            </button>
          </div>
        </aside>

        {loading ? (
          <div style={{ padding: 100, textAlign: 'center', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>
            QUERYING DATA LAKE REPOSITORY...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredData.map((record, i) => (
              <motion.div 
                key={record._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ 
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  background: '#0d0d0d',
                  border: '1px solid #30302d',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ 
                  padding: '14px 24px', 
                  background: '#141414', 
                  borderBottom: '1px solid #262522',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, color: '#f2f0ea' }}>RECORD: {record.complaintId}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>OBJECT ID: {record._id}</span>
                </div>
                
                <div style={{ padding: 24, background: '#0d0d0d' }}>
                  <JsonView obj={record} />
                </div>
              </motion.div>
            ))}

            {filteredData.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center', border: '1px solid #30302d', borderRadius: 24, background: '#0d0d0d' }}>
                <p style={{ color: '#8e8b84', fontSize: 14, margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>No database records match your filter criteria.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
