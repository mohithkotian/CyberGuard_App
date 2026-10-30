import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import useAuthStore from '../hooks/useAuthStore';
import useThemeStore from '../hooks/useThemeStore';
import useSettingsStore from '../hooks/useSettingsStore';
import useTranslationStore from '../hooks/useTranslationStore';
import TwoFactorModal from '../components/TwoFactorModal';
import { authAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';
import * as faceapi from '@vladmandic/face-api';
import { getAvatarUrl } from '../utils/avatar';

const Settings = () => {
  const { user, logout, syncUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { t, currentLanguage, setLanguage, languages } = useTranslationStore();
  const settings = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState('about');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [isSpeedTesting, setIsSpeedTesting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.isTwoFactorEnabled || false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });

  // Face ID State
  const [isEnrollingFace, setIsEnrollingFace] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('Position your face in the frame');
  const videoRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const descriptorsRef = useRef([]);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(getAvatarUrl(user.avatar, user.updatedAt));
    }
  }, [user]);

  useEffect(() => {
    if (navigator.connection) {
      setNetworkInfo({
        downlink: navigator.connection.downlink,
        effectiveType: navigator.connection.effectiveType,
        saveData: navigator.connection.saveData,
      });
    }
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (ua.indexOf('Win') !== -1) os = 'Windows';
    if (ua.indexOf('Mac') !== -1) os = 'macOS';
    if (ua.indexOf('X11') !== -1) os = 'UNIX';
    if (ua.indexOf('Linux') !== -1) os = 'Linux';
    setDeviceInfo(`${os} - ${navigator.platform}`);
  }, []);

  const handleProfileSave = async () => {
    try {
      const fd = new FormData();
      fd.append('name', profileData.name);
      if (profileData.phone) fd.append('phone', profileData.phone);
      const { data } = await userAPI.updateProfile(fd);
      if (data.status === 'success') {
        toast.success('Profile updated');
        await syncUser();
        setIsEditingProfile(false);
      }
    } catch (err) { toast.error('Update failed'); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);

      const toastId = toast.loading('Uploading neural signature...');
      try {
        const fd = new FormData();
        fd.append('avatar', file);
        const { data } = await userAPI.updateProfile(fd);
        if (data.status === 'success') {
          toast.success('Avatar updated', { id: toastId });
          await syncUser();
          if (data.data?.user?.avatar) {
            setAvatarPreview(getAvatarUrl(data.data.user.avatar, Date.now()));
          }
        }
      } catch (err) { 
        toast.error('Upload failed', { id: toastId }); 
      }
    }
  };

  const handle2FAToggle = async () => {
    if (is2FAEnabled) {
      if (window.confirm('Disable 2FA? Account security will be compromised.')) {
        try {
          await authAPI.disable2FA();
          setIs2FAEnabled(false);
          toast.success('2FA Disabled');
        } catch (err) { toast.error('Failed'); }
      }
    } else { setShow2FAModal(true); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authAPI.updatePassword(passData);
      if (data.status === 'success') {
        toast.success('Password updated successfully!');
        setShowPasswordModal(false);
        setPassData({ currentPassword: '', newPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    }
  };

  const handleInstantPurge = () => {
    settings.setSetting('instantPurge', !settings.instantPurge);
    toast(
      !settings.instantPurge 
        ? 'Instant Purge Activated: Sessions will self-destruct on idle.'
        : 'Instant Purge Deactivated.',
      { icon: !settings.instantPurge ? '!' : '◈' }
    );
  };

  const startFaceEnrollment = async () => {
    setIsEnrollingFace(true);
    setScanProgress(0);
    setScanStatus('Initializing Neural Vision Models...');
    descriptorsRef.current = [];
    
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setIsModelsLoaded(true);
      setScanStatus('Position your face in the frame');

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Start automated scanning loop
        scanIntervalRef.current = setInterval(performScan, 600);
      }
    } catch (err) {
      toast.error('Failed to access camera or models');
      closeCamera();
    }
  };

  const performScan = async () => {
    if (!videoRef.current) return;
    try {
      const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      if (!detection) {
        setScanStatus('Face not detected. Look at the camera.');
        return;
      }
      
      setScanStatus('Slowly turn your head in a circle...');
      
      // Save descriptor
      descriptorsRef.current.push(Array.from(detection.descriptor));
      const currentCount = descriptorsRef.current.length;
      
      // 5 captures for a complete profile
      const newProgress = Math.min((currentCount / 5) * 100, 100);
      setScanProgress(newProgress);
      
      if (currentCount >= 5) {
        clearInterval(scanIntervalRef.current);
        setScanStatus('Finalizing Biometric Hash...');
        
        // Average the 5 descriptors for a highly robust "iPhone style" hash
        let averagedDescriptor = new Array(128).fill(0);
        for (let desc of descriptorsRef.current) {
          for (let i = 0; i < 128; i++) {
            averagedDescriptor[i] += desc[i];
          }
        }
        averagedDescriptor = averagedDescriptor.map(val => val / 5);
        
        const res = await authAPI.enrollFace(averagedDescriptor);
        if (res.data.status === 'success') {
          setScanStatus('Face ID Enrolled Successfully!');
          toast.success('Face ID Enrolled Successfully!');
          setTimeout(closeCamera, 2000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeCamera = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsEnrollingFace(false);
  };

  const tabs = [
    { id: 'about', label: t('SETTINGS.PROFILE', 'About Me'), icon: <img src="/icons/cyberguard/profile-user.svg" alt="" style={{ width: 20, height: 20, objectFit: "contain", verticalAlign: "middle" }} /> },
    { id: 'notifications', label: t('SETTINGS.NOTIFICATIONS', 'Notifications'), icon: '•' },
    { id: 'theme', label: t('SETTINGS.APPEARANCE', 'Display & Theme'), icon: '◈' },
    { id: 'language', label: t('SETTINGS.LANGUAGE_TAB', 'Language'), icon: '◉' },
    { id: 'internet', label: 'Internet & Connection', icon: '⌁' },
    { id: 'security', label: t('SETTINGS.SECURITY', 'Security'), icon: '◈' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '40px' }}>User Identity Terminal</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '48px' }}>
              <div style={{ 
                width: 100, height: 100, borderRadius: '40px', 
                background: 'linear-gradient(135deg, #007AFF, #00FFD1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '40px', fontWeight: 900, color: '#fff', 
                boxShadow: '0 20px 40px rgba(0, 122, 255, 0.3)', overflow: 'hidden' 
              }}>
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    alt="Avatar" 
                    onError={() => setAvatarPreview(null)} 
                  />
                ) : (
                  user?.name?.[0]
                )}
              </div>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
                <button className="liquid-btn-secondary" onClick={() => fileInputRef.current.click()}>Modify Neural Signature</button>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: 12, fontWeight: 600 }}>Biometric Avatar (PNG/JPG up to 5MB)</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginBottom: '48px' }}>
              <div>
                <label className="setting-label">Designation</label>
                <input className="liquid-input" style={{ width: '100%', boxSizing: 'border-box' }} value={isEditingProfile ? profileData.name : user?.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} readOnly={!isEditingProfile} />
              </div>
              <div>
                <label className="setting-label">Neural Email</label>
                <input className="liquid-input" style={{ width: '100%', boxSizing: 'border-box' }} value={user?.email} readOnly={true} style={{ opacity: 0.7 }} />
              </div>
              <div>
                <label className="setting-label">Mobile Uplink</label>
                <input className="liquid-input" style={{ width: '100%', boxSizing: 'border-box' }} value={isEditingProfile ? profileData.phone : (user?.phone || 'Not Configured')} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} readOnly={!isEditingProfile} placeholder="+91..." />
              </div>
              <div>
                <label className="setting-label">Clearance Role</label>
                <div style={{ padding: '16px 20px', background: 'rgba(0, 122, 255, 0.1)', borderRadius: '16px', color: '#007AFF', fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}>{user?.role?.toUpperCase()}</div>
              </div>
              <div>
                <label className="setting-label">Active Terminal</label>
                <div style={{ padding: '16px 20px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600 }}>{deviceInfo}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', paddingBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
              {isEditingProfile ? (
                <>
                  <button className="liquid-btn-primary" onClick={handleProfileSave}>SYNCHRONIZE CHANGES</button>
                  <button className="liquid-btn-secondary" onClick={() => setIsEditingProfile(false)}>ABORT</button>
                </>
              ) : (
                <>
                  <button className="liquid-btn-primary" onClick={() => setIsEditingProfile(true)}>EDIT PROFILE DATA</button>
                  {user?.email === 'pruthvishetty04@gmail.com' && (
                    <button className="liquid-btn-secondary" onClick={startFaceEnrollment} style={{ border: '1px solid #00B4FF', color: '#00B4FF' }}>SETUP J.A.R.V.I.S. FACE ID</button>
                  )}
                </>
              )}
            </div>
            
            {/* FACE ID ENROLLMENT MODAL */}
            {isEnrollingFace && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2,6,10,0.95)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ color: '#00B4FF', fontFamily: 'Orbitron', margin: '0 0 20px 0', fontSize: '24px', letterSpacing: '2px' }}>BIOMETRIC SCANNER ACTIVE</h3>
                
                <div style={{ position: 'relative', width: 340, height: 340, marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* iPhone Style Circular Progress Ring */}
                  <svg width="340" height="340" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', zIndex: 2 }}>
                    <circle cx="170" cy="170" r="160" fill="none" stroke="rgba(0,180,255,0.1)" strokeWidth="10" />
                    <circle cx="170" cy="170" r="160" fill="none" stroke="#00B4FF" strokeWidth="10" strokeDasharray="1005" strokeDashoffset={1005 - (1005 * scanProgress) / 100} style={{ transition: 'stroke-dashoffset 0.5s ease' }} strokeLinecap="round" />
                  </svg>
                  
                  <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', overflow: 'hidden', zIndex: 1, boxShadow: '0 0 40px rgba(0,180,255,0.2)' }}>
                    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    {!isModelsLoaded && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#00B4FF', fontWeight: 'bold' }}>LOADING...</div>}
                  </div>
                </div>
                
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '40px', fontFamily: 'Inter', textAlign: 'center', height: '30px' }}>
                  {scanStatus}
                  {scanProgress > 0 && scanProgress < 100 && <span style={{ display: 'block', color: '#00B4FF', fontSize: '14px', marginTop: 10 }}>{scanProgress}% Completed</span>}
                </div>

                <button className="liquid-btn-secondary" onClick={closeCamera} style={{ padding: '12px 40px', fontSize: '16px', zIndex: 999999, position: 'relative' }}>ABORT SCAN</button>
              </div>
            )}
            
            <div style={{ marginTop: 40 }}>
              <button className="liquid-btn-danger" onClick={logout} style={{ background: 'rgba(255, 59, 48, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, letterSpacing: '1px' }}>TERMINATE SECURE SESSION / LOGOUT</button>
            </div>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '40px' }}>Dispatch Comms</h2>
            <ToggleRow label="Push Broadcasts" desc="Real-time alerts for incoming neural threats" active={settings.pushNotifications} onClick={() => settings.setSetting('pushNotifications', !settings.pushNotifications)} />
            <ToggleRow label="Direct Intel Comms" desc="Receive direct messages from field agents" active={settings.directMessages} onClick={() => settings.setSetting('directMessages', !settings.directMessages)} />
            <ToggleRow label="System Diagnostic Reports" desc="Weekly breakdown of security health" active={settings.systemUpdates} onClick={() => settings.setSetting('systemUpdates', !settings.systemUpdates)} />
            <ToggleRow label="Critical Breach Alarms" desc="High-priority overrides for critical alerts" active={settings.criticalAlerts} onClick={() => settings.setSetting('criticalAlerts', !settings.criticalAlerts)} />
          </motion.div>
        );
      case 'theme':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '40px' }}>Visual Architecture</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: 40 }}>
              {['dark', 'matrix', 'cyber'].map(t => (
                <div key={t} onClick={() => setTheme(t)} style={{
                  padding: '24px', borderRadius: '24px', cursor: 'pointer',
                  background: theme === t ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: theme === t ? '2px solid #007AFF' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: theme === t ? '0 10px 30px rgba(0, 122, 255, 0.3)' : 'none',
                  transition: '0.4s'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, textTransform: 'capitalize', marginBottom: 8, color: theme === t ? '#fff' : 'rgba(255,255,255,0.6)' }}>{t}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>{t === 'dark' ? 'Stealth Obsidian' : t === 'matrix' ? 'Terminal Emerald' : 'Neon Cyan'}</div>
                </div>
              ))}
            </div>
            <ToggleRow label="Atmospheric Glow" desc="Enable high-fidelity volumetric lighting effects" active={settings.accentGlow} onClick={() => settings.setSetting('accentGlow', !settings.accentGlow)} />
          </motion.div>
        );
      case 'language':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="setting-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', background: 'linear-gradient(135deg, #00B4FF, #00FFD1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('SETTINGS.LANGUAGE', 'Portal Language & Localization')}
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', margin: 0, lineHeight: 1.5, maxWidth: '600px' }}>
                  {t('SETTINGS.LANGUAGE_DESC', 'Cybercrime affects citizens across diverse linguistic regions. Select your preferred Indian language to translate all portal menus, intelligence feeds, and report forms in real time.')}
                </p>
              </div>
              <div style={{
                background: 'rgba(0, 180, 255, 0.1)',
                border: '1px solid rgba(0, 180, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '11px', color: '#8892B0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Current:</span>
                <span style={{ fontSize: '13px', color: '#00FFD1', fontWeight: 800 }}>
                  {languages.find(l => l.code === currentLanguage)?.name} ({languages.find(l => l.code === currentLanguage)?.nativeName})
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '28px'
            }}>
              {languages.map(lang => {
                const isActive = currentLanguage === lang.code;
                return (
                  <motion.div
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      toast.success(`${t('SETTINGS.LANGUAGE_SAVED', 'Language updated successfully to')} ${lang.name} (${lang.nativeName})`);
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '22px 20px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      background: isActive ? 'linear-gradient(135deg, rgba(0, 180, 255, 0.18), rgba(0, 255, 209, 0.08))' : 'rgba(255, 255, 255, 0.03)',
                      border: isActive ? '2px solid #00B4FF' : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isActive ? '0 0 25px rgba(0, 180, 255, 0.3)' : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '32px' }}>{lang.flag}</span>
                      {isActive ? (
                        <span style={{
                          background: 'linear-gradient(135deg, #00B4FF, #00FFD1)',
                          color: '#02060A',
                          fontSize: '10px',
                          fontWeight: 900,
                          padding: '3px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          ACTIVE
                        </span>
                      ) : (
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {lang.code.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: isActive ? '#00FFD1' : '#fff', letterSpacing: '0.3px', marginBottom: '2px' }}>
                        {lang.nativeName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>
                        {lang.name}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div style={{
              marginTop: '36px',
              padding: '20px 24px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '24px' }}>◈</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    Instant Real-Time Localization
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    Menus, cybercrime reporting forms, status trackers, and security alerts adapt instantly upon selection.
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#00B4FF',
                fontFamily: 'Orbitron, monospace',
                letterSpacing: '1px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 180, 255, 0.1)',
                border: '1px solid rgba(0, 180, 255, 0.3)'
              }}>
                PERSISTENT
              </div>
            </div>
          </motion.div>
        );
      case 'internet':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '40px' }}>Neural Bandwidth</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: 40 }}>
              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="setting-label">Sync Speed</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#007AFF' }}>{networkInfo?.downlink || '0'} <span style={{ fontSize: 16 }}>Mbps</span></div>
              </div>
              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="setting-label">Neural Latency</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#34C759' }}>24 <span style={{ fontSize: 16 }}>ms</span></div>
              </div>
            </div>
            <button className="liquid-btn-primary" onClick={() => { 
              setIsSpeedTesting(true); 
              setTimeout(() => {
                setIsSpeedTesting(false);
                toast.success('Bandwidth optimal. Latency locked at 24ms.');
              }, 2000); 
            }}>
              {isSpeedTesting ? 'CALIBRATING...' : 'RE-CALIBRATE BANDWIDTH'}
            </button>
          </motion.div>
        );
      case 'security':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>{t('SETTINGS.SECURITY', 'Armor & Encryption')}</h2>
            
            <ToggleRow label={t('SETTINGS.2FA', 'Two-Factor Shield')} desc={t('SETTINGS.2FA_DESC', 'Dual-layer biometric verification on login')} active={is2FAEnabled} onClick={handle2FAToggle} />
            <ToggleRow label="Instant Purge" desc="Auto-terminate sessions after inactivity" active={settings.instantPurge} onClick={handleInstantPurge} />
            
            <div style={{ marginTop: 40 }}>
              <button className="liquid-btn-secondary" style={{ width: '100%' }} onClick={() => setShowPasswordModal(true)}>
                {t('SETTINGS.CHANGE_PASSWORD', 'ROTATE ENCRYPTION KEYS / CHANGE PASSWORD')}
              </button>
            </div>
          </motion.div>
        );
      default:
        return <div className="setting-panel">Feature coming in v1.1.0</div>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#02060A', color: '#fff', position: 'relative', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Navbar />
      <div style={{ display: 'flex', maxWidth: 1300, margin: '60px auto', gap: '60px', padding: '0 40px', position: 'relative', zIndex: 1 }}>
        <aside style={{ width: 300, flexShrink: 0 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 48, letterSpacing: '-1.5px', background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Settings</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderRadius: '20px', border: '1px solid transparent', fontSize: '15px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)', background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.4)', boxShadow: activeTab === tab.id ? '0 10px 25px rgba(0,0,0,0.2)' : 'none', border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}>
                <span style={{ fontSize: 20 }}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </aside>
        <main style={{ flex: 1 }}>
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </main>
      </div>
      <TwoFactorModal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} onEnabled={() => setIs2FAEnabled(true)} />
      
      {/* Password Rotation Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPasswordModal(false)}>
          <div style={{ background: '#111827', width: '100%', maxWidth: 400, borderRadius: 20, border: '1px solid rgba(0, 180, 255, 0.2)', padding: 32 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', fontSize: 20, marginBottom: 24, marginTop: 0 }}>Rotate Encryption Keys</h3>
            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 16 }}>
                <label className="setting-label">Current Key</label>
                <input type="password" required className="liquid-input" style={{ width: '100%', boxSizing: 'border-box' }} value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="setting-label">New Secure Key</label>
                <input type="password" required className="liquid-input" style={{ width: '100%', boxSizing: 'border-box' }} value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="liquid-btn-primary" style={{ flex: 1, padding: '12px' }}>CONFIRM</button>
                <button type="button" className="liquid-btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => setShowPasswordModal(false)}>ABORT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .setting-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(40px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px; padding: 48px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        .liquid-input { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px 20px; color: #fff; font-size: 15px; outline: none; }
        .liquid-btn-primary { background: linear-gradient(135deg, #007AFF 0%, #00B4FF 100%); border: none; border-radius: 16px; padding: 16px 32px; color: #fff; font-weight: 800; cursor: pointer; box-shadow: 0 10px 25px rgba(0, 122, 255, 0.3); }
        .liquid-btn-secondary { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 12px 24px; color: #fff; font-weight: 700; cursor: pointer; }
        .liquid-btn-danger { background: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.2); border-radius: 16px; padding: 16px 24px; color: #FF3B30; font-weight: 700; cursor: pointer; text-align: left; width: 100%; }
        .setting-label { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
        .toggle-container { display: flex; justify-content: space-between; align-items: center; padding: 24px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .toggle-track { width: 52px; height: 32px; border-radius: 32px; padding: 2px; cursor: pointer; transition: 0.3s; }
        .toggle-thumb { width: 28px; height: 28px; background: #fff; border-radius: 50%; transition: 0.3s; }
      `}</style>
    </div>
  );
};

const ToggleRow = ({ label, desc, active, onClick }) => (
  <div className="toggle-container">
    <div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{desc}</div>
    </div>
    <div className="toggle-track" onClick={onClick} style={{ background: active ? '#34C759' : 'rgba(255,255,255,0.1)' }}>
      <div className="toggle-thumb" style={{ transform: active ? 'translateX(20px)' : 'translateX(0)' }} />
    </div>
  </div>
);

export default Settings;
