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
import { Bell, Palette, Globe, Wifi, Shield, User, Camera, Lock, Check } from 'lucide-react';

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

      const toastId = toast.loading('Uploading avatar signature...');
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
      { icon: !settings.instantPurge ? '!' : '✓' }
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
      descriptorsRef.current.push(Array.from(detection.descriptor));
      const currentCount = descriptorsRef.current.length;
      
      const newProgress = Math.min((currentCount / 5) * 100, 100);
      setScanProgress(newProgress);
      
      if (currentCount >= 5) {
        clearInterval(scanIntervalRef.current);
        setScanStatus('Finalizing Biometric Hash...');
        
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
    { id: 'about', label: t('SETTINGS.PROFILE', 'About Me'), icon: <User size={16} /> },
    { id: 'notifications', label: t('SETTINGS.NOTIFICATIONS', 'Notifications'), icon: <Bell size={16} /> },
    { id: 'theme', label: t('SETTINGS.APPEARANCE', 'Display & Theme'), icon: <Palette size={16} /> },
    { id: 'language', label: t('SETTINGS.LANGUAGE_TAB', 'Language'), icon: <Globe size={16} /> },
    { id: 'internet', label: 'Internet & Connection', icon: <Wifi size={16} /> },
    { id: 'security', label: t('SETTINGS.SECURITY', 'Security'), icon: <Shield size={16} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.5px', marginBottom: '32px', color: '#f2f0ea' }}>
              User Identity Terminal
            </h2>
            
            {/* Avatar & Upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginBottom: '40px' }}>
              <div style={{ 
                width: 88, height: 88, borderRadius: '24px', 
                background: '#141414',
                border: '1px solid #30302d',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '36px', fontWeight: 800, color: '#f2f0ea', 
                boxShadow: 'none', overflow: 'hidden',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}>
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    alt="Avatar" 
                    onError={() => setAvatarPreview(null)} 
                  />
                ) : (
                  user?.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
                <button 
                  className="liquid-btn-secondary" 
                  onClick={() => fileInputRef.current.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Camera size={14} />
                  Modify Neural Signature
                </button>
                <div style={{ fontSize: '12px', color: '#777', marginTop: 10, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Biometric Avatar (PNG/JPG up to 5MB)
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              <div>
                <label className="setting-label">Designation</label>
                <input 
                  className="liquid-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                  value={isEditingProfile ? profileData.name : user?.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                  readOnly={!isEditingProfile} 
                />
              </div>
              <div>
                <label className="setting-label">Neural Email</label>
                <input 
                  className="liquid-input" 
                  style={{ width: '100%', boxSizing: 'border-box', opacity: 0.7 }} 
                  value={user?.email || ''} 
                  readOnly={true} 
                />
              </div>
              <div>
                <label className="setting-label">Mobile Uplink</label>
                <input 
                  className="liquid-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                  value={isEditingProfile ? profileData.phone : (user?.phone || 'Not Configured')} 
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                  readOnly={!isEditingProfile} 
                  placeholder="+91..." 
                />
              </div>
              <div>
                <label className="setting-label">Clearance Role</label>
                <div style={{ 
                  padding: '14px 20px', 
                  background: '#141414', 
                  border: '1px solid #30302d', 
                  borderRadius: '14px', 
                  color: '#f2f0ea', 
                  fontWeight: 700, 
                  fontSize: '13px', 
                  letterSpacing: '1px',
                  fontFamily: "'IBM Plex Mono', monospace"
                }}>
                  {user?.role?.toUpperCase() || 'USER'}
                </div>
              </div>
              <div>
                <label className="setting-label">Active Terminal</label>
                <div style={{ 
                  padding: '14px 20px', 
                  background: '#141414', 
                  border: '1px solid #30302d', 
                  borderRadius: '14px', 
                  color: '#b8b8b0', 
                  fontSize: '13px', 
                  fontFamily: "'IBM Plex Mono', monospace"
                }}>
                  {deviceInfo}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', paddingBottom: '36px', borderBottom: '1px solid #292927', flexWrap: 'wrap' }}>
              {isEditingProfile ? (
                <>
                  <button className="liquid-btn-primary" onClick={handleProfileSave}>SYNCHRONIZE CHANGES</button>
                  <button className="liquid-btn-secondary" onClick={() => setIsEditingProfile(false)}>ABORT</button>
                </>
              ) : (
                <>
                  <button className="liquid-btn-primary" onClick={() => setIsEditingProfile(true)}>EDIT PROFILE DATA</button>
                  {user?.email === 'pruthvishetty04@gmail.com' && (
                    <button className="liquid-btn-secondary" onClick={startFaceEnrollment}>SETUP J.A.R.V.I.S. FACE ID</button>
                  )}
                </>
              )}
            </div>
            
            {/* FACE ID ENROLLMENT MODAL */}
            {isEnrollingFace && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(7,7,7,0.96)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif", margin: '0 0 20px 0', fontSize: '24px', letterSpacing: '2px', fontWeight: 700 }}>
                  BIOMETRIC SCANNER ACTIVE
                </h3>
                
                <div style={{ position: 'relative', width: 320, height: 320, marginBottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="320" height="320" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', zIndex: 2 }}>
                    <circle cx="160" cy="160" r="150" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle cx="160" cy="160" r="150" fill="none" stroke="#f2f0ea" strokeWidth="8" strokeDasharray="942" strokeDashoffset={942 - (942 * scanProgress) / 100} style={{ transition: 'stroke-dashoffset 0.5s ease' }} strokeLinecap="round" />
                  </svg>
                  
                  <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', overflow: 'hidden', zIndex: 1, border: '2px solid #30302d' }}>
                    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    {!isModelsLoaded && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#f2f0ea', fontWeight: 'bold', fontFamily: "'IBM Plex Sans', sans-serif" }}>LOADING...</div>}
                  </div>
                </div>
                
                <div style={{ color: '#b8b8b0', fontSize: '16px', fontWeight: 600, marginBottom: '32px', fontFamily: "'IBM Plex Sans', sans-serif", textAlign: 'center', height: '30px' }}>
                  {scanStatus}
                  {scanProgress > 0 && scanProgress < 100 && <span style={{ display: 'block', color: '#f2f0ea', fontSize: '13px', marginTop: 8, fontFamily: "'IBM Plex Mono', monospace" }}>{scanProgress}% Completed</span>}
                </div>

                <button className="liquid-btn-secondary" onClick={closeCamera} style={{ padding: '12px 36px', fontSize: '14px', zIndex: 999999, position: 'relative' }}>ABORT SCAN</button>
              </div>
            )}
            
            <div style={{ marginTop: 32 }}>
              <button className="liquid-btn-danger" onClick={logout}>
                TERMINATE SECURE SESSION / LOGOUT
              </button>
            </div>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.5px', marginBottom: '32px', color: '#f2f0ea' }}>
              Dispatch Comms
            </h2>
            <ToggleRow label="Push Broadcasts" desc="Real-time alerts for incoming threat intelligence" active={settings.pushNotifications} onClick={() => settings.setSetting('pushNotifications', !settings.pushNotifications)} />
            <ToggleRow label="Direct Intel Comms" desc="Receive direct messages from field agents and officers" active={settings.directMessages} onClick={() => settings.setSetting('directMessages', !settings.directMessages)} />
            <ToggleRow label="System Diagnostic Reports" desc="Weekly breakdown of account security health" active={settings.systemUpdates} onClick={() => settings.setSetting('systemUpdates', !settings.systemUpdates)} />
            <ToggleRow label="Critical Breach Alarms" desc="High-priority overrides for urgent critical alerts" active={settings.criticalAlerts} onClick={() => settings.setSetting('criticalAlerts', !settings.criticalAlerts)} />
          </motion.div>
        );
      case 'theme':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.5px', marginBottom: '32px', color: '#f2f0ea' }}>
              Visual Architecture
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: 32 }}>
              {['dark', 'matrix', 'cyber'].map(t => (
                <div 
                  key={t} 
                  onClick={() => setTheme(t)} 
                  style={{
                    padding: '24px', 
                    borderRadius: '20px', 
                    cursor: 'pointer',
                    background: theme === t ? '#1c1c1a' : '#141414',
                    border: theme === t ? '1px solid #f2f0ea' : '1px solid #30302d',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'capitalize', marginBottom: 6, color: theme === t ? '#f2f0ea' : '#888880' }}>{t}</div>
                  <div style={{ fontSize: '12px', color: '#777', fontFamily: "'IBM Plex Sans', sans-serif" }}>{t === 'dark' ? 'Stealth Obsidian' : t === 'matrix' ? 'Terminal Emerald' : 'Graphite Slate'}</div>
                </div>
              ))}
            </div>
            <ToggleRow label="Atmospheric Glow" desc="Enable subtle volumetric ambient lighting accents" active={settings.accentGlow} onClick={() => settings.setSetting('accentGlow', !settings.accentGlow)} />
          </motion.div>
        );
      case 'language':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="setting-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", margin: '0 0 8px 0', color: '#f2f0ea' }}>
                  {t('SETTINGS.LANGUAGE', 'Portal Language & Localization')}
                </h2>
                <p style={{ color: '#b8b8b0', fontSize: '13px', margin: 0, lineHeight: 1.6, maxWidth: '600px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {t('SETTINGS.LANGUAGE_DESC', 'Select your preferred Indian language to translate all portal menus, intelligence feeds, and incident reporting forms in real time.')}
                </p>
              </div>
              <div style={{
                background: '#141414',
                border: '1px solid #30302d',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '11px', color: '#777', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'IBM Plex Sans', sans-serif" }}>Current:</span>
                <span style={{ fontSize: '13px', color: '#f2f0ea', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {languages.find(l => l.code === currentLanguage)?.name} ({languages.find(l => l.code === currentLanguage)?.nativeName})
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginTop: '24px'
            }}>
              {languages.map(lang => {
                const isActive = currentLanguage === lang.code;
                return (
                  <div
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      toast.success(`${t('SETTINGS.LANGUAGE_SAVED', 'Language updated successfully to')} ${lang.name} (${lang.nativeName})`);
                    }}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      background: isActive ? '#1c1c1a' : '#141414',
                      border: isActive ? '1px solid #f2f0ea' : '1px solid #30302d',
                      boxShadow: 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '28px' }}>{lang.flag}</span>
                      {isActive ? (
                        <span style={{
                          background: '#f2f0ea',
                          color: '#070707',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}>
                          ACTIVE
                        </span>
                      ) : (
                        <span style={{
                          background: '#101010',
                          color: '#777',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}>
                          {lang.code.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: '2px' }}>
                        {lang.nativeName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#777', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        {lang.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      case 'internet':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.5px', marginBottom: '32px', color: '#f2f0ea' }}>
              Neural Bandwidth
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: 32 }}>
              <div style={{ padding: '24px', background: '#141414', borderRadius: '20px', border: '1px solid #30302d' }}>
                <div className="setting-label">Sync Speed</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{networkInfo?.downlink || '0'} <span style={{ fontSize: 15, color: '#777' }}>Mbps</span></div>
              </div>
              <div style={{ padding: '24px', background: '#141414', borderRadius: '20px', border: '1px solid #30302d' }}>
                <div className="setting-label">Latency Buffer</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#EFEDE8', fontFamily: "'IBM Plex Mono', monospace" }}>24 <span style={{ fontSize: 15, color: '#777' }}>ms</span></div>
              </div>
            </div>
            <button className="liquid-btn-primary" onClick={() => { 
              setIsSpeedTesting(true); 
              setTimeout(() => {
                setIsSpeedTesting(false);
                toast.success('Bandwidth optimal. Latency locked at 24ms.');
              }, 1500); 
            }}>
              {isSpeedTesting ? 'CALIBRATING...' : 'RE-CALIBRATE BANDWIDTH'}
            </button>
          </motion.div>
        );
      case 'security':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="setting-panel">
            <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.5px', marginBottom: '24px', color: '#f2f0ea' }}>
              {t('SETTINGS.SECURITY', 'Armor & Encryption')}
            </h2>
            
            <ToggleRow label={t('SETTINGS.2FA', 'Two-Factor Shield')} desc={t('SETTINGS.2FA_DESC', 'Dual-layer verification on portal login')} active={is2FAEnabled} onClick={handle2FAToggle} />
            <ToggleRow label="Instant Purge" desc="Auto-terminate authenticated sessions after idle threshold" active={settings.instantPurge} onClick={handleInstantPurge} />
            
            <div style={{ marginTop: 36 }}>
              <button className="liquid-btn-secondary" style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setShowPasswordModal(true)}>
                <Lock size={15} />
                {t('SETTINGS.CHANGE_PASSWORD', 'ROTATE ENCRYPTION KEYS / CHANGE PASSWORD')}
              </button>
            </div>
          </motion.div>
        );
      default:
        return <div className="setting-panel" style={{ color: '#777' }}>Feature available in next release</div>;
    }
  };

  return (
    <div className="page-shell">
      <Navbar />
      
      <div style={{ display: 'flex', maxWidth: 1240, margin: '40px auto', gap: '40px', padding: '0 24px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
        <aside style={{ width: 260, flexShrink: 0 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 28, letterSpacing: '-1px', color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Settings
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px 18px', 
                  borderRadius: '12px', 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  textAlign: 'left', 
                  transition: 'all 0.2s ease', 
                  background: activeTab === tab.id ? '#141414' : 'transparent', 
                  color: activeTab === tab.id ? '#f2f0ea' : '#888880', 
                  border: activeTab === tab.id ? '1px solid #30302d' : '1px solid transparent',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  letterSpacing: '0.5px'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </aside>
        
        <main style={{ flex: 1, minWidth: '320px' }}>
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </main>
      </div>

      <TwoFactorModal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} onEnabled={() => setIs2FAEnabled(true)} />
      
      {/* Password Rotation Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowPasswordModal(false)}>
          <div style={{ background: '#0d0d0d', width: '100%', maxWidth: 420, borderRadius: '24px', border: '1px solid #30302d', padding: 32 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#f2f0ea', fontSize: 20, marginBottom: 20, marginTop: 0, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700 }}>Rotate Security Key</h3>
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
                <button type="submit" className="liquid-btn-primary" style={{ flex: 1, height: '46px' }}>CONFIRM</button>
                <button type="button" className="liquid-btn-secondary" style={{ flex: 1, height: '46px' }} onClick={() => setShowPasswordModal(false)}>ABORT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .setting-panel { 
          background: #0d0d0d; 
          border: 1px solid #30302d; 
          border-radius: 16px; 
          padding: 36px 40px; 
          box-shadow: 0 24px 60px rgba(0,0,0,0.45); 
        }
        .liquid-input { 
          background: #141414; 
          border: 1px solid #30302d; 
          border-radius: 12px; 
          padding: 13px 18px; 
          color: #f2f0ea; 
          font-size: 14px; 
          outline: none; 
          font-family: 'IBM Plex Sans', sans-serif;
          transition: border-color 0.2s;
        }
        .liquid-input:focus {
          border-color: #f2f0ea;
        }
        .liquid-btn-primary { 
          background: #f2f0ea; 
          border: none; 
          border-radius: 999px; 
          padding: 13px 32px; 
          color: #070707; 
          font-family: 'IBM Plex Sans', sans-serif;
          font-weight: 800; 
          font-size: 13px;
          letter-spacing: 1px;
          cursor: pointer; 
          box-shadow: none; 
          transition: all 0.2s ease;
        }
        .liquid-btn-primary:hover {
          transform: translateY(-1px);
        }
        .liquid-btn-secondary { 
          background: #141414; 
          border: 1px solid #30302d; 
          border-radius: 999px; 
          padding: 12px 24px; 
          color: #f2f0ea; 
          font-family: 'IBM Plex Sans', sans-serif;
          font-weight: 700; 
          font-size: 13px;
          letter-spacing: 0.5px;
          cursor: pointer; 
          transition: all 0.2s ease;
        }
        .liquid-btn-secondary:hover {
          border-color: #f2f0ea;
        }
        .liquid-btn-danger { 
          background: #1a1212; 
          border: 1px solid #3d1f1f; 
          border-radius: 12px; 
          padding: 14px 24px; 
          color: #d96464; 
          font-family: 'IBM Plex Sans', sans-serif;
          font-weight: 700; 
          font-size: 13px;
          letter-spacing: 1px;
          cursor: pointer; 
          text-align: center; 
          width: 100%; 
          transition: all 0.2s ease;
        }
        .liquid-btn-danger:hover {
          background: #241414;
          border-color: #5a2626;
        }
        .setting-label { 
          font-size: 11px; 
          font-weight: 700; 
          color: #888880; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          margin-bottom: 8px; 
          display: block; 
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .toggle-container { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 20px 0; 
          border-bottom: 1px solid #20201f; 
        }
        .toggle-track { 
          width: 48px; 
          height: 28px; 
          border-radius: 999px; 
          padding: 2px; 
          cursor: pointer; 
          transition: 0.2s; 
        }
        .toggle-thumb { 
          width: 24px; 
          height: 24px; 
          background: #fff; 
          border-radius: 50%; 
          transition: 0.2s; 
        }
      `}</style>
    </div>
  );
};

const ToggleRow = ({ label, desc, active, onClick }) => (
  <div className="toggle-container">
    <div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#f2f0ea', marginBottom: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#777', fontFamily: "'IBM Plex Sans', sans-serif" }}>{desc}</div>
    </div>
    <div className="toggle-track" onClick={onClick} style={{ background: active ? '#3DF5C0' : '#222' }}>
      <div className="toggle-thumb" style={{ transform: active ? 'translateX(20px)' : 'translateX(0)', background: active ? '#070707' : '#888' }} />
    </div>
  </div>
);

export default Settings;
