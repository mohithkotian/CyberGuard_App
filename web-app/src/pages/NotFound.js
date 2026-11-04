import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ 
      minHeight: '100dvh', 
      background: 'var(--bg)', 
      display: 'flex',
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 20,
      fontFamily: 'var(--font-sans)',
      color: 'var(--text)'
    }}>
      <div style={{ fontSize: 80, color: 'rgba(0,180,255,0.15)', fontWeight: 900 }}>404</div>
      <h1 style={{ fontSize: 22, color: 'var(--primary)', margin: 0 }}>PAGE NOT FOUND</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>The page you are looking for does not exist.</p>
      <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '12px 32px' }}>
        Back to Home
      </button>
    </div>
  );
}
