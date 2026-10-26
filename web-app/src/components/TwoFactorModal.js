import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const TwoFactorModal = ({ isOpen, onClose, onEnabled }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: QR, 3: Verify
  const [setupData, setSetupData] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.generate2FA();
      setSetupData(data.data);
      setStep(2);
    } catch (err) {
      toast.error('Failed to initiate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) return toast.error('Enter 6-digit code');
    setLoading(true);
    try {
      await authAPI.verify2FA(token);
      toast.success('2FA enabled successfully!');
      onEnabled();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={s.overlay} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={s.modal} 
        onClick={e => e.stopPropagation()}
      >
        <div style={s.header}>
          <h3 style={s.title}>Secure Your Account</h3>
          <button style={s.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div style={s.content}>
          {step === 1 && (
            <div style={s.stepContent}>
              <div style={s.icon}>
                <img src="/icons/cyberguard/cyberguard-security-badge.png" alt="CyberGuard security badge" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <p style={s.text}>Two-factor authentication adds an extra layer of security. Every time you log in, you'll need to provide a code from your authenticator app.</p>
              <button style={s.btnPrimary} onClick={handleStartSetup} disabled={loading}>
                {loading ? 'Initializing...' : 'Get Started'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={s.stepContent}>
              <p style={s.instruction}>1. Scan this QR code with Google Authenticator or Authy:</p>
              <div style={s.qrWrapper}>
                {setupData?.otpauth && (
                  <QRCodeSVG 
                    value={setupData.otpauth} 
                    size={180} 
                    bgColor="transparent" 
                    fgColor="#000000" 
                    level="H"
                  />
                )}
              </div>
              <p style={s.manualLabel}>Manual Entry Key:</p>
              <code style={s.secretCode}>{setupData?.secret}</code>
              <button style={s.btnPrimary} onClick={() => setStep(3)}>Next Step</button>
            </div>
          )}

          {step === 3 && (
            <div style={s.stepContent}>
              <p style={s.instruction}>2. Enter the 6-digit code from your app to verify:</p>
              <input 
                style={s.tokenInput} 
                placeholder="000000" 
                maxLength={6}
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button style={s.btnPrimary} onClick={handleVerify} disabled={loading}>
                  {loading ? 'Verifying...' : 'Enable 2FA'}
                </button>
                <button style={s.btnSecondary} onClick={() => setStep(2)}>Back</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20
  },
  modal: {
    background: '#111827', width: '100%', maxWidth: 400,
    borderRadius: 20, border: '1px solid rgba(0, 180, 255, 0.2)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
  },
  header: {
    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { fontSize: 18, margin: 0, color: '#fff' },
  closeBtn: { background: 'none', border: 'none', color: '#8892B0', fontSize: 24, cursor: 'pointer' },
  content: { padding: '24px' },
  stepContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  icon: { fontSize: 48, marginBottom: 16 },
  text: { fontSize: 14, color: '#8892B0', lineHeight: 1.6, marginBottom: 24 },
  instruction: { fontSize: 14, color: '#fff', marginBottom: 16, fontWeight: 600 },
  qrWrapper: { padding: 12, background: '#fff', borderRadius: 12, marginBottom: 16 },
  manualLabel: { fontSize: 11, color: '#8892B0', textTransform: 'uppercase', marginBottom: 4 },
  secretCode: { background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 6, fontSize: 14, color: '#00B4FF', marginBottom: 24, letterSpacing: 1 },
  tokenInput: {
    width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0, 180, 255, 0.3)',
    borderRadius: 12, padding: '16px', fontSize: 24, textAlign: 'center', color: '#fff',
    fontFamily: 'monospace', letterSpacing: 8, outline: 'none'
  },
  btnPrimary: {
    width: '100%', background: '#00B4FF', color: '#fff', border: 'none',
    padding: '14px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
  },
  btnSecondary: {
    width: '100%', background: 'transparent', color: '#8892B0', border: '1px solid #334155',
    padding: '14px', borderRadius: 12, fontWeight: 600, cursor: 'pointer'
  }
};

export default TwoFactorModal;
