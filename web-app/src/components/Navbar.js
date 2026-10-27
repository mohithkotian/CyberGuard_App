import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../hooks/useAuthStore';
import useTranslationStore from '../hooks/useTranslationStore';
import NotificationCenter from './NotificationCenter';
import DeveloperAccessScanner from './DeveloperAccessScanner';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin, isOfficer } = useAuthStore();
  const { t } = useTranslationStore();
  const containerRef = useRef(null);
  const helpBtnRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [helpMenuPos, setHelpMenuPos] = useState({ top: 0, left: 0 });

  const toggleHelpMenu = () => {
    if (!showHelpMenu && helpBtnRef.current) {
      const rect = helpBtnRef.current.getBoundingClientRect();
      setHelpMenuPos({ top: rect.bottom + 10, left: rect.left + rect.width / 2 });
    }
    setShowHelpMenu(!showHelpMenu);
  };

  const scroll = (direction) => {
    if (containerRef.current) {
      const { scrollLeft, clientWidth } = containerRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.5 
        : scrollLeft + clientWidth * 0.5;
      
      containerRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  const navLink = (to, label, category) => (
    <Link to={to} style={{
      color: location.pathname === to ? '#00B4FF' : '#8892B0',
      textDecoration: 'none', 
      fontSize: 11, 
      fontWeight: 700,
      fontFamily: 'Orbitron, monospace',
      letterSpacing: '1px',
      whiteSpace: 'nowrap',
      padding: '10px 20px',
      borderRadius: '8px',
      background: location.pathname === to ? 'rgba(0,180,255,0.1)' : 'rgba(255,255,255,0.03)',
      border: location.pathname === to ? '1px solid rgba(0,180,255,0.4)' : '1px solid rgba(255,255,255,0.05)',
      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      minWidth: 'fit-content'
    }}>
      <span style={{ fontSize: '8px', opacity: 0.6, color: '#00B4FF', textTransform: 'uppercase' }}>{category}</span>
      {label}
    </Link>
  );

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      <AnimatePresence>
        {showScanner && (
          <DeveloperAccessScanner 
            onClose={() => setShowScanner(false)}
            onVerified={() => {
              setShowScanner(false);
              navigate('/developer');
            }}
          />
        )}
      </AnimatePresence>

    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(3, 10, 15, 0.98)', 
      backdropFilter: 'blur(40px)',
      borderBottom: '1px solid rgba(0, 180, 255, 0.25)',
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 85,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
      userSelect: 'none'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <img src="/icons/cyberguard/cyberguard-white.png" alt="CyberGuard" style={{ display: 'block', width: 148, height: 38, objectFit: 'contain' }} />
        </Link>
      </div>

      {/* High-Performance Navigation Dock */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        margin: '0 20px', 
        position: 'relative',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        padding: '6px',
        border: '1px solid rgba(255,255,255,0.05)',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {/* Left Arrow */}
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,180,255,0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scroll('left')}
          style={{
            background: 'rgba(3,10,15,0.8)', border: '1px solid rgba(0,180,255,0.3)',
            borderRadius: '8px', width: 32, height: 48, color: '#00B4FF', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, position: 'absolute', left: 0, fontSize: 18, boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>

        <div 
          ref={containerRef}
          style={{ 
            flex: 1, 
            overflowX: 'scroll', 
            overflowY: 'hidden',
            display: 'flex',
            alignItems: 'center',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth',
            padding: '0 64px 0 36px',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: 'max-content' }}>
            
            {/* USER role navigation */}
            {!isAdmin() && !isOfficer() && (
              <>
                {navLink('/dashboard', t('NAVBAR.COMPLAINTS', 'MY COMPLAINTS'), t('NAVBAR.PERSONAL', 'PERSONAL'))}
                {navLink('/community', t('NAVBAR.COMMUNITY', 'COMMUNITY'), t('NAVBAR.BROWSE', 'BROWSE'))}
                {navLink('/submit', t('NAVBAR.REPORT', 'REPORT'), t('NAVBAR.ACTION', 'ACTION'))}
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
                {navLink('/scam-search', t('NAVBAR.SCAM_SEARCH', 'SCAM SEARCH'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/suspect-search', t('NAVBAR.SUSPECT_SEARCH', 'SUSPECT SEARCH'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/forensic-scanner', t('NAVBAR.NEURAL_SCAN', 'NEURAL SCAN'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/leak-monitor', t('NAVBAR.LEAK_MONITOR', 'LEAK MONITOR'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/threat-map', t('NAVBAR.HOTSPOTS', 'HOTSPOTS'), t('NAVBAR.INTEL', 'INTEL'))}
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
                {navLink('/chat', t('NAVBAR.COMMS', 'COMMS'), t('NAVBAR.NETWORK', 'NETWORK'))}
                {navLink('/learn', t('NAVBAR.LEARN', 'LEARN'), t('NAVBAR.AWARENESS', 'AWARENESS'))}
              </>
            )}

            {/* OFFICER role navigation */}
            {isOfficer() && (
              <>
                {navLink('/dashboard', t('NAVBAR.COMPLAINTS', 'COMPLAINTS'), t('NAVBAR.CORE', 'CORE'))}
                {navLink('/submit', t('NAVBAR.REPORT', 'REPORT'), t('NAVBAR.ACTION', 'ACTION'))}
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
                {navLink('/admin', t('NAVBAR.COMMAND_CENTER', 'COMMAND CENTER'), t('NAVBAR.OFFICER', 'OFFICER'))}
                {navLink('/admin/safety', t('NAVBAR.SAFETY', 'SAFETY'), t('NAVBAR.OFFICER', 'OFFICER'))}
                {navLink('/admin/database', t('NAVBAR.DATABASE', 'DATABASE'), t('NAVBAR.OFFICER', 'OFFICER'))}
                {navLink('/admin/link-analysis', t('NAVBAR.FORENSICS', 'FORENSICS'), t('NAVBAR.OFFICER', 'OFFICER'))}
                {navLink('/admin/map', t('NAVBAR.MAP', 'MAP'), t('NAVBAR.OFFICER', 'OFFICER'))}
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
                {navLink('/scam-search', t('NAVBAR.SCAM_SEARCH', 'SCAM SEARCH'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/suspect-search', t('NAVBAR.SUSPECT_SEARCH', 'SUSPECT SEARCH'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/forensic-scanner', t('NAVBAR.NEURAL_SCAN', 'NEURAL SCAN'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/chat', t('NAVBAR.COMMS', 'COMMS'), t('NAVBAR.NETWORK', 'NETWORK'))}
                {navLink('/learn', t('NAVBAR.LEARN', 'LEARN'), t('NAVBAR.AWARENESS', 'AWARENESS'))}
              </>
            )}

            {/* ADMIN role navigation */}
            {isAdmin() && (
              <>
                {navLink('/dashboard', t('NAVBAR.ALL_COMPLAINTS', 'ALL COMPLAINTS'), t('NAVBAR.ADMIN', 'ADMIN'))}
                {navLink('/submit', t('NAVBAR.REPORT', 'REPORT'), t('NAVBAR.ACTION', 'ACTION'))}
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
                {navLink('/admin', t('NAVBAR.COMMAND_CENTER', 'COMMAND CENTER'), t('NAVBAR.SYSTEM', 'SYSTEM'))}
                {navLink('/admin/users', t('NAVBAR.ACCOUNTS', 'ACCOUNTS'), t('NAVBAR.SYSTEM', 'SYSTEM'))}
                {navLink('/admin/mails', t('NAVBAR.MAIL', 'MAIL'), t('NAVBAR.SYSTEM', 'SYSTEM'))}
                {navLink('/admin/database', t('NAVBAR.DATABASE', 'DATABASE'), t('NAVBAR.SYSTEM', 'SYSTEM'))}
                {navLink('/admin/link-analysis', t('NAVBAR.FORENSICS', 'FORENSICS'), t('NAVBAR.SYSTEM', 'SYSTEM'))}
                {navLink('/admin/map', t('NAVBAR.MAP', 'MAP'), t('NAVBAR.SYSTEM', 'SYSTEM'))}
                {navLink('/admin/info', t('NAVBAR.INFO', 'INFO'), t('NAVBAR.SYSTEM', 'SYSTEM'))}
                {navLink('/admin/safety', t('NAVBAR.SAFETY', 'SAFETY'), t('NAVBAR.SYSTEM', 'SYSTEM'))}
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
                {navLink('/scam-search', t('NAVBAR.SCAM_SEARCH', 'SCAM SEARCH'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/suspect-search', t('NAVBAR.SUSPECT_SEARCH', 'SUSPECT SEARCH'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/forensic-scanner', t('NAVBAR.NEURAL_SCAN', 'NEURAL SCAN'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/leak-monitor', t('NAVBAR.LEAK_MONITOR', 'LEAK MONITOR'), t('NAVBAR.INTEL', 'INTEL'))}
                {navLink('/chat', t('NAVBAR.COMMS', 'COMMS'), t('NAVBAR.NETWORK', 'NETWORK'))}
                {navLink('/learn', t('NAVBAR.LEARN', 'LEARN'), t('NAVBAR.AWARENESS', 'AWARENESS'))}
              </>
            )}

            <div
              ref={helpBtnRef}
              onClick={toggleHelpMenu}
              style={{
                color: showHelpMenu ? '#00B4FF' : '#8892B0',
                textDecoration: 'none', 
                fontSize: 11, 
                fontWeight: 700,
                fontFamily: 'Orbitron, monospace',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
                padding: '10px 20px',
                borderRadius: '8px',
                background: showHelpMenu ? 'rgba(0,180,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: showHelpMenu ? '1px solid rgba(0,180,255,0.4)' : '1px solid rgba(255,255,255,0.05)',
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                minWidth: 'fit-content',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '8px', opacity: 0.6, color: '#00B4FF', textTransform: 'uppercase' }}>SUPPORT</span>
              HELP & FAQ
            </div>

            {showHelpMenu && createPortal(
                <div style={{
                  position: 'fixed',
                  top: helpMenuPos.top + 'px',
                  left: helpMenuPos.left + 'px',
                  transform: 'translateX(-50%)',
                  background: 'rgba(3, 10, 15, 0.98)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(0, 180, 255, 0.25)',
                  borderRadius: '12px',
                  padding: '10px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '150px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 99999
                }}>
                  <div
                    onClick={() => {
                      setShowHelpMenu(false);
                      window.open('/contactlist.pdf', '_blank');
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0,180,255,0.1)';
                      e.target.style.color = '#00B4FF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#fff';
                    }}
                    style={{ padding: '10px 20px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s', textAlign: 'center', fontFamily: 'Orbitron, monospace' }}
                  >
                    Contact Us
                  </div>
                  <div
                    onClick={() => {
                      setShowHelpMenu(false);
                      navigate('/feedback');
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0,180,255,0.1)';
                      e.target.style.color = '#00B4FF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#fff';
                    }}
                    style={{ padding: '10px 20px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s', textAlign: 'center', fontFamily: 'Orbitron, monospace' }}
                  >
                    Feedback
                  </div>
                  <div
                    onClick={() => {
                      setShowHelpMenu(false);
                      navigate('/faq');
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0,180,255,0.1)';
                      e.target.style.color = '#00B4FF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#fff';
                    }}
                    style={{ padding: '10px 20px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s', textAlign: 'center', fontFamily: 'Orbitron, monospace' }}
                  >
                    FAQ
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>

        {/* Right Arrow */}
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,180,255,0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scroll('right')}
          style={{
            background: 'rgba(3,10,15,0.8)', border: '1px solid rgba(0,180,255,0.3)',
            borderRadius: '8px', width: 32, height: 48, color: '#00B4FF', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, position: 'absolute', right: 0, fontSize: 18, boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>
      </div>

      {/* Right Controls Dock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, marginLeft: 'auto' }}>
        <motion.div 
          whileHover={{ rotate: 90, scale: 1.1, color: '#00B4FF' }}
          onClick={() => navigate('/settings')}
          style={{ 
            cursor: 'pointer', padding: '10px', borderRadius: '10px', color: '#8892B0',
            background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.05)', transition: '0.3s'
          }}
          title="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </motion.div>

        <NotificationCenter />

        <button onClick={handleLogout} 
          style={{ 
            background: 'linear-gradient(135deg, rgba(255,82,82,0.15), rgba(255,82,82,0.05))',
            border: '1px solid rgba(255,82,82,0.4)',
            color: '#FF5252',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'Orbitron, monospace',
            transition: '0.3s',
            letterSpacing: '1px',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,82,82,0.2)';
            e.target.style.borderColor = 'rgba(255,82,82,0.8)';
            e.target.style.boxShadow = '0 0 15px rgba(255,82,82,0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,82,82,0.15)';
            e.target.style.borderColor = 'rgba(255,82,82,0.4)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {t('NAVBAR.LOGOUT', 'DISCONNECT')}
        </button>
      </div>

      <style>{`
        ::-webkit-scrollbar { display: none !important; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .nav-link:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,180,255,0.2); }
      `}</style>
    </nav>
    </>
  );
}
