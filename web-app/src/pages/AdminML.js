import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function AdminML() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testText, setTestText] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await adminAPI.mlStatus();
      setStatus(data.data);
    } catch (e) {
      toast.error('Could not connect to ML Service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handlePredict = async () => {
    if (!testText.trim()) return;
    setPredicting(true);
    try {
      const { data } = await adminAPI.predict(testText);
      setPrediction(data.data);
    } catch (e) {
      const msg = e.response?.data?.message || 'Prediction failed';
      toast.error(msg);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="page-shell" style={{ 
      minHeight: '100dvh', 
      background: '#070707',
      color: '#f2f0ea',
      fontFamily: "'IBM Plex Sans', sans-serif"
    }}>
      <Navbar />
      
      <main className="report-layout" style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 24px 100px' }}>
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginBottom: 36 }}>
          <p className="eyebrow" style={{ color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 10px' }}>
            NEURAL INFERENCE PIPELINE
          </p>
          <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'clamp(2.2rem, 3.2vw, 3rem)', fontWeight: 800, color: '#f2f0ea', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Neural Engine Configuration
          </h1>
          <p style={{ color: '#8e8b84', fontSize: '15px', margin: 0 }}>
            Inspect and test the automated natural language classification model and vector embeddings.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          
          {/* Status Card */}
          <div style={{ 
            background: '#0d0d0d', 
            border: '1px solid #30302d', 
            borderRadius: '16px', 
            padding: 32,
            boxShadow: '0 24px 70px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ fontSize: 12, color: '#8e8b84', marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              INFERENCE SERVICE STATUS
            </h3>
            {loading ? (
              <p style={{ color: '#8e8b84', fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }}>Querying cluster health...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 10, height: 10, borderRadius: '50%', 
                    background: (status?.mlService?.status === 'online' || status?.mlService?.status === 'ok') ? '#3DF5C0' : '#d96464'
                  }} />
                  <span style={{ fontSize: 15, color: '#f2f0ea', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em' }}>
                    {(status?.mlService?.status === 'online' || status?.mlService?.status === 'ok') ? 'CLUSTER OPERATIONAL' : 'CLUSTER OFFLINE'}
                  </span>
                </div>
                
                <div style={{ background: '#141414', padding: 20, borderRadius: 16, border: '1px solid #262522' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: '#8e8b84', fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>MODEL VERSION</span>
                    <span style={{ color: '#f2f0ea', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>{status?.modelInfo?.version || 'v1.0.4-stable'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: '#8e8b84', fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>ALGORITHM</span>
                    <span style={{ color: '#f2f0ea', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>TF-IDF + Logistic Regression</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8e8b84', fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>TEST ACCURACY</span>
                    <span style={{ color: '#3DF5C0', fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{status?.modelInfo?.accuracy || '94.8'}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Model Testing */}
          <div style={{ 
            background: '#0d0d0d', 
            border: '1px solid #30302d', 
            borderRadius: '16px', 
            padding: 32,
            boxShadow: '0 24px 70px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ fontSize: 12, color: '#8e8b84', marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              INFERENCE PLAYGROUND
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <textarea 
                rows={4} 
                placeholder="Enter incident transcript or narrative to test classifier..."
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                style={{ 
                  resize: 'none', background: '#141414', border: '1px solid #30302d',
                  borderRadius: 16, padding: 16, color: '#f2f0ea', fontSize: 13,
                  outline: 'none', fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              />
              <button 
                onClick={handlePredict} 
                disabled={predicting || !testText.trim()}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: '999px',
                  background: '#f2f0ea', color: '#070707', border: 'none',
                  fontWeight: 700, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif",
                  letterSpacing: '0.04em', cursor: 'pointer',
                  opacity: predicting || !testText.trim() ? 0.4 : 1
                }}
              >
                {predicting ? 'INFERRING...' : 'RUN INFERENCE CLASSIFIER'}
              </button>
            </div>

            {prediction && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 20, padding: 18, background: '#141414', borderRadius: 16, border: '1px solid #30302d' }}
              >
                <div style={{ fontSize: 10, color: '#8e8b84', marginBottom: 4, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em', fontWeight: 700 }}>
                  Classification Output
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#EFEDE8', fontWeight: 700, fontSize: 16, fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>{prediction.category}</span>
                  <span style={{ color: '#f2f0ea', fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(prediction.confidence * 100)}% CONFIDENCE</span>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
