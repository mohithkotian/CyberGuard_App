import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function RegisterChoice() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100dvh', 
      background: 'var(--bg)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '40px 24px',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text)'
    }}>
      {/* Liquid Atmospheric Accents */}
      
      
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'none', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

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



            letterSpacing: '-1.5px'
          }}>
            Join the <span style={{ color: '#EFEDE8' }}>Network</span>
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
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: '1px solid rgba(0, 255, 170, 0.15)',
              borderRadius: 'var(--radius-lg)',
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
   
              color: '#000', 
              fontWeight: 800,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: 'none',
              background: 'var(--primary)'
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
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: '1px solid rgba(255, 214, 0, 0.15)',
              borderRadius: 'var(--radius-lg)',
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
   
              color: '#000', 
              fontWeight: 800,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: 'none',
              background: 'rgba(255, 214, 0, 0.15)',
              border: '1px solid rgba(255, 214, 0, 0.35)',
              color: '#FFD600'
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
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: '1px solid rgba(0, 180, 255, 0.15)',
              borderRadius: 'var(--radius-lg)',
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
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#EFEDE8', marginBottom: 12 }}>Admin</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: 32, lineHeight: 1.6, flexGrow: 1 }}>
              Full system clearance for global oversight, trend analysis, and root-level operations.
            </p>
            <button style={{ 
              width: '100%', 
   
              color: '#fff', 
              fontWeight: 800,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: 'none',
              background: 'rgba(0, 180, 255, 0.15)',
              border: '1px solid rgba(0, 180, 255, 0.35)',
              color: '#28B7E8'
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
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: '1px solid rgba(168, 85, 247, 0.15)',
              borderRadius: 'var(--radius-lg)',
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
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#EFEDE8', marginBottom: 12 }}>Education</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: 32, lineHeight: 1.6, flexGrow: 1 }}>
              Training clearance for safety awareness, certifications, and academic resources.
            </p>
            <button style={{ 
              width: '100%', 
   
              color: '#fff', 
              fontWeight: 800,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: 'none',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              color: '#C084FC'
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
            borderRadius: 'var(--radius-md)',
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

