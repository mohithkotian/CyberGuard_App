import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function RegisterChoice() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#02060A', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '40px 24px',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Liquid Atmospheric Accents */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 1200, position: 'relative', zIndex: 1, textAlign: 'center' }}
      >
        <div style={{ marginBottom: 64 }}>
          <h1 style={{ 
            fontSize: '3.4rem', 
            color: '#fff', 
            margin: '0 0 16px 0',
            fontWeight: 800,
            background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1.5px'
          }}>
            Join the <span style={{ color: '#00B4FF' }}>Network</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 400 }}>
            Establish your identity and clearance level below
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '30px', 
          width: '100%'
        }}>
          
          {/* USER CARD */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            style={{ 
              padding: '40px', 
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(0, 255, 170, 0.15)',
              borderRadius: '32px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={() => navigate('/register?role=user')}
          >
            <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(0, 255, 170, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <img src="/icons/cyberguard/citizen-shield.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#00ffaa', marginBottom: 12 }}>Citizen</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: 32, lineHeight: 1.6, flexGrow: 1 }}>
              Standard clearance for reporting crimes, tracking cases, and direct communication.
            </p>
            <button style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)', 
              color: '#000', 
              fontWeight: 800,
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(0, 200, 83, 0.3)'
            }}>
              INITIALIZE ACCESS
            </button>
          </motion.div>

          {/* OFFICER CARD */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            style={{ 
              padding: '40px', 
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 214, 0, 0.15)',
              borderRadius: '32px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={() => navigate('/register?role=officer')}
          >
            <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(255, 214, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <img src="/icons/cyberguard/police-badge.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#FFD600', marginBottom: 12 }}>Officer</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: 32, lineHeight: 1.6, flexGrow: 1 }}>
              Enforcement clearance for case management, evidence control, and investigations.
            </p>
            <button style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #FF8F00 0%, #FFD600 100%)', 
              color: '#000', 
              fontWeight: 800,
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(255, 143, 0, 0.3)'
            }}>
              OFFICER CREDENTIALS
            </button>
          </motion.div>

          {/* ADMIN CARD */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            style={{ 
              padding: '40px', 
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(0, 180, 255, 0.15)',
              borderRadius: '32px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={() => navigate('/register?role=admin')}
          >
            <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(0, 180, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <img src="/icons/cyberguard/admin-command.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#00B4FF', marginBottom: 12 }}>Admin</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: 32, lineHeight: 1.6, flexGrow: 1 }}>
              Full system clearance for global oversight, trend analysis, and root-level operations.
            </p>
            <button style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #007AFF 0%, #00B4FF 100%)', 
              color: '#fff', 
              fontWeight: 800,
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(0, 122, 255, 0.3)'
            }}>
              ADMIN PRIVILEGES
            </button>
          </motion.div>

          {/* EDUCATION CARD */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            style={{ 
              padding: '40px', 
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(168, 85, 247, 0.15)',
              borderRadius: '32px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={() => navigate('/register?role=education')}
          >
            <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <img src="/icons/cyberguard/cyber-educator.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#A855F7', marginBottom: 12 }}>Education</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: 32, lineHeight: 1.6, flexGrow: 1 }}>
              Training clearance for safety awareness, certifications, and academic resources.
            </p>
            <button style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)', 
              color: '#fff', 
              fontWeight: 800,
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)'
            }}>
              ENROLL IN ACADEMY
            </button>
          </motion.div>

        </div>

        <button 
          onClick={() => navigate('/')}
          style={{ 
            marginTop: 64, 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: 'rgba(255,255,255,0.5)', 
            fontSize: '13px', 
            fontWeight: 600,
            cursor: 'pointer',
            padding: '10px 24px',
            borderRadius: '20px',
            transition: '0.3s'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          Cancel and return home
        </button>
      </motion.div>

      <style>
        {`
          button:active { transform: scale(0.96); }
        `}
      </style>
    </div>
  );
}
