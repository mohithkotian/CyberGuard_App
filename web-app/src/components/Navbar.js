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
  const helpMenuRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [helpMenuPos, setHelpMenuPos] = useState({ top: 0, left: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateHelpMenuPos = () => {
    if (!helpBtnRef.current) return;
    const rect = helpBtnRef.current.getBoundingClientRect();
    const menuHalfWidth = 85;
    const viewportW = window.innerWidth || 1200;
    const clampedLeft = Math.max(menuHalfWidth + 12, Math.min(viewportW - menuHalfWidth - 12, rect.left + rect.width / 2));
    setHelpMenuPos({ top: rect.bottom + 10, left: clampedLeft });
  };

  const toggleHelpMenu = () => {
    if (!showHelpMenu) {
      updateHelpMenuPos();
    }
    setShowHelpMenu((prev) => !prev);
  };

  useEffect(() => {
    if (!showHelpMenu) return undefined;

    const handleOutside = (e) => {
      if (
        helpBtnRef.current?.contains(e.target) ||
        helpMenuRef.current?.contains(e.target)
      ) {
        return;
      }
      setShowHelpMenu(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowHelpMenu(false);
        helpBtnRef.current?.focus();
      }
    };

    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('touchstart', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateHelpMenuPos);
    window.addEventListener('scroll', updateHelpMenuPos, true);

    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateHelpMenuPos);
      window.removeEventListener('scroll', updateHelpMenuPos, true);
    };
  }, [showHelpMenu]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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

  // Auto-scroll active link into view so navigation never hides or jumps away from the active tab
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [location.pathname]);

  const navLink = (to, label, category) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} data-active={isActive ? 'true' : 'false'} style={{
        color: isActive ? '#f2f0ea' : '#8e8b84',
        textDecoration: 'none', 
        fontSize: 12, 
        fontWeight: 700,
        fontFamily: "'IBM Plex Sans', sans-serif",
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        padding: '8px 16px',
        borderRadius: '8px',
        background: isActive ? '#141414' : 'transparent',
        border: isActive ? '1px solid #3b3b38' : '1px solid transparent',
        boxShadow: isActive ? '0 0 0 1px rgba(242, 240, 234, 0.18)' : 'none',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        minWidth: 'fit-content'
      }}>
        <span style={{ fontSize: '9px', fontWeight: 600, color: isActive ? '#d8d5ce' : '#5a5852', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{category}</span>
        {label}
      </Link>
    );
  };

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
      background: '#070707', 
      borderBottom: '1px solid #292927',
      padding: '0 28px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 74,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
      userSelect: 'none'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <img 
            src="/icons/cyberguard/cyberguard-white.png" 
            alt="CyberGuard" 
            onError={(e) => {
              if (!e.target.dataset.triedSvg) {
                e.target.dataset.triedSvg = 'true';
                e.target.src = '/icons/cyberguard/cyberguard-white.svg';
              }
            }}
            style={{ display: 'block', width: 148, height: 38, objectFit: 'contain' }} 
          />
        </Link>
      </div>

      {/* High-Performance Navigation Dock */}
      <div className="nav-scroll-dock" style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        margin: '0 20px', 
        position: 'relative',
        background: '#0d0d0d',
        borderRadius: '12px',
        padding: '6px',
        border: '1px solid #242421',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {/* Left Arrow */}
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: '#1c1c1a' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scroll('left')}
          style={{
            background: '#141414', border: '1px solid #30302d',
            borderRadius: '8px', width: 32, height: 44, color: '#f2f0ea', 
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
            {isOfficer() && !isAdmin() && (
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

            <button
              type="button"
              ref={helpBtnRef}
              aria-haspopup="menu"
              aria-expanded={showHelpMenu}
              onClick={toggleHelpMenu}
              style={{
                color: (location.pathname === '/faq' || location.pathname === '/feedback' || showHelpMenu) ? '#f2f0ea' : '#8e8b84',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'IBM Plex Sans', sans-serif",
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                padding: '8px 16px',
                borderRadius: '8px',
                background: (location.pathname === '/faq' || location.pathname === '/feedback' || showHelpMenu) ? '#141414' : 'transparent',
                border: (location.pathname === '/faq' || location.pathname === '/feedback' || showHelpMenu) ? '1px solid #3b3b38' : '1px solid transparent',
                boxShadow: (location.pathname === '/faq' || location.pathname === '/feedback' || showHelpMenu) ? '0 0 0 1px rgba(242, 240, 234, 0.18)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                minWidth: 'fit-content',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 600, color: (location.pathname === '/faq' || location.pathname === '/feedback' || showHelpMenu) ? '#d8d5ce' : '#5a5852', textTransform: 'uppercase', letterSpacing: '0.12em' }}>SUPPORT</span>
              HELP & FAQ
            </button>

            {showHelpMenu && createPortal(
              <div
                ref={helpMenuRef}
                role="menu"
                aria-label="Help and FAQ options"
                style={{
                  position: 'fixed',
                  top: helpMenuPos.top + 'px',
                  left: helpMenuPos.left + 'px',
                  transform: 'translateX(-50%)',
                  background: '#0d0d0d',
                  border: '1px solid #292927',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '166px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                  zIndex: 99999
                }}
              >
                {[
                  { label: 'Contact Us', action: () => window.open('/contactlist.pdf', '_blank', 'noopener,noreferrer') },
                  { label: 'Feedback', action: () => navigate('/feedback') },
                  { label: 'FAQ', action: () => navigate('/faq') }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowHelpMenu(false);
                      item.action();
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1c1c1a';
                      e.currentTarget.style.color = '#f2f0ea';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#fff';
                    }}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderRadius: '8px', padding: '10px 16px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em', transition: 'all 0.2s', textAlign: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
        </div>

        {/* Right Arrow */}
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: '#1c1c1a' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scroll('right')}
          style={{
            background: '#141414', border: '1px solid #30302d',
            borderRadius: '8px', width: 32, height: 44, color: '#f2f0ea', 
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
        {/* National Cyber Fraud Helpline SOS 1930 */}
        <a
          href="tel:1930"
          className="nav-sos-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: 'rgba(248, 113, 113, 0.12)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            borderRadius: '8px',
            color: '#F87171',
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)';
            e.currentTarget.style.borderColor = '#F87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.35)';
          }}
          title="National Cyber Fraud Helpline 1930"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>SOS 1930</span>
        </a>

        {/* Settings - hidden on small mobile */}
        <motion.div 
          className="nav-settings-btn"
          whileHover={{ rotate: 90, scale: 1.05, color: '#f2f0ea' }}
          onClick={() => navigate('/settings')}
          style={{ 
            cursor: 'pointer', padding: '10px', borderRadius: '8px', color: '#8E8B84',
            background: '#141414', display: 'flex', alignItems: 'center',
            border: '1px solid #242422', transition: 'all 0.2s ease'
          }}
          title="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </motion.div>

        <NotificationCenter />

        <button onClick={handleLogout} 
          className="nav-logout-btn"
          style={{ 
            background: '#1C1C1A',
            border: '1px solid #242422',
            color: '#D96464',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
            transition: '0.3s',
            letterSpacing: '1px',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#242422';
            e.target.style.borderColor = '#2C2B28';
            e.target.style.boxShadow = 'none';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#1C1C1A';
            e.target.style.borderColor = '#242422';
            e.target.style.boxShadow = 'none';
          }}
        >
          {t('NAVBAR.LOGOUT', 'DISCONNECT')}
        </button>

        {/* Hamburger – shown on mobile only via CSS */}
        <button
          className="nav-hamburger-btn"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          style={{
            display: 'none',
            background: '#141414',
            border: '1px solid #3b3b38',
            borderRadius: '8px',
            color: '#f2f0ea',
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <style>{`
        ::-webkit-scrollbar { display: none !important; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .nav-link:hover { transform: translateY(-2px); }

        @media (max-width: 860px) {
          .nav-scroll-dock { display: none !important; }
          .nav-hamburger-btn { display: flex !important; }
          .nav-logout-btn { display: none !important; }
          .nav-settings-btn { display: none !important; }
        }
        @media (max-width: 480px) {
          nav[style] { padding-inline: 14px !important; height: 60px !important; }
        }
      `}</style>
    </nav>

    {/* ════════ MOBILE DRAWER (authenticated) ════════ */}
    {mobileOpen && createPortal(
      <>
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 199 }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 'min(82vw, 320px)',
            background: '#0a0a0a',
            borderRight: '1px solid #242422',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '20px 0 32px',
          }}
        >
          {/* Drawer header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 20px', borderBottom: '1px solid #242422', marginBottom: 12 }}>
            <img src="/icons/cyberguard/cyberguard-white.png" alt="CyberGuard"
              style={{ width: 120, height: 32, objectFit: 'contain' }}
              onError={e => { if (!e.target.dataset.tried) { e.target.dataset.tried='true'; e.target.src='/icons/cyberguard/cyberguard-white.svg'; }}}
            />
            <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}
              style={{ background: '#141414', border: '1px solid #3b3b38', borderRadius: '8px', color: '#f2f0ea', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Emergency Helpline SOS 1930 */}
          <a
            href="tel:1930"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              margin: '0 12px 14px',
              padding: '12px 16px',
              background: 'rgba(248, 113, 113, 0.14)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              borderRadius: '8px',
              color: '#F87171',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>EMERGENCY SOS 1930</span>
          </a>

          {/* Drawer links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 }}>
            {/* User links */}
            {!isAdmin() && !isOfficer() && (<>
              {[
                { to: '/dashboard', label: t('NAVBAR.COMPLAINTS', 'MY COMPLAINTS'), cat: t('NAVBAR.PERSONAL', 'PERSONAL') },
                { to: '/community', label: t('NAVBAR.COMMUNITY', 'COMMUNITY'), cat: t('NAVBAR.BROWSE', 'BROWSE') },
                { to: '/submit', label: t('NAVBAR.REPORT', 'REPORT'), cat: t('NAVBAR.ACTION', 'ACTION') },
                { to: '/scam-search', label: t('NAVBAR.SCAM_SEARCH', 'SCAM SEARCH'), cat: t('NAVBAR.INTEL', 'INTEL') },
                { to: '/suspect-search', label: t('NAVBAR.SUSPECT_SEARCH', 'SUSPECT SEARCH'), cat: t('NAVBAR.INTEL', 'INTEL') },
                { to: '/forensic-scanner', label: t('NAVBAR.NEURAL_SCAN', 'NEURAL SCAN'), cat: t('NAVBAR.INTEL', 'INTEL') },
                { to: '/leak-monitor', label: t('NAVBAR.LEAK_MONITOR', 'LEAK MONITOR'), cat: t('NAVBAR.INTEL', 'INTEL') },
                { to: '/threat-map', label: t('NAVBAR.HOTSPOTS', 'HOTSPOTS'), cat: t('NAVBAR.INTEL', 'INTEL') },
                { to: '/chat', label: t('NAVBAR.COMMS', 'COMMS'), cat: t('NAVBAR.NETWORK', 'NETWORK') },
                { to: '/learn', label: t('NAVBAR.LEARN', 'LEARN'), cat: t('NAVBAR.AWARENESS', 'AWARENESS') },
              ].map(({ to, label, cat }) => (
                <Link key={to} to={to} data-active={location.pathname === to ? 'true' : 'false'}
                  style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', color: location.pathname === to ? '#f2f0ea' : '#8e8b84', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', fontFamily: "'IBM Plex Sans', sans-serif", background: location.pathname === to ? '#141414' : 'transparent', border: location.pathname === to ? '1px solid #3b3b38' : '1px solid transparent' }}>
                  <span style={{ fontSize: '9px', color: location.pathname === to ? '#d8d5ce' : '#5a5852', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{cat}</span>
                  {label}
                </Link>
              ))}
            </>)}

            {/* Officer links */}
            {isOfficer() && !isAdmin() && (<>
              {[
                { to: '/dashboard', label: t('NAVBAR.COMPLAINTS', 'COMPLAINTS'), cat: t('NAVBAR.CORE', 'CORE') },
                { to: '/submit', label: t('NAVBAR.REPORT', 'REPORT'), cat: t('NAVBAR.ACTION', 'ACTION') },
                { to: '/admin', label: t('NAVBAR.COMMAND_CENTER', 'COMMAND CENTER'), cat: t('NAVBAR.OFFICER', 'OFFICER') },
                { to: '/admin/safety', label: t('NAVBAR.SAFETY', 'SAFETY'), cat: t('NAVBAR.OFFICER', 'OFFICER') },
                { to: '/admin/database', label: t('NAVBAR.DATABASE', 'DATABASE'), cat: t('NAVBAR.OFFICER', 'OFFICER') },
                { to: '/admin/link-analysis', label: t('NAVBAR.FORENSICS', 'FORENSICS'), cat: t('NAVBAR.OFFICER', 'OFFICER') },
                { to: '/admin/map', label: t('NAVBAR.MAP', 'MAP'), cat: t('NAVBAR.OFFICER', 'OFFICER') },
                { to: '/scam-search', label: t('NAVBAR.SCAM_SEARCH', 'SCAM SEARCH'), cat: t('NAVBAR.INTEL', 'INTEL') },
                { to: '/learn', label: t('NAVBAR.LEARN', 'LEARN'), cat: t('NAVBAR.AWARENESS', 'AWARENESS') },
              ].map(({ to, label, cat }) => (
                <Link key={to} to={to} data-active={location.pathname === to ? 'true' : 'false'}
                  style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', color: location.pathname === to ? '#f2f0ea' : '#8e8b84', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', fontFamily: "'IBM Plex Sans', sans-serif", background: location.pathname === to ? '#141414' : 'transparent', border: location.pathname === to ? '1px solid #3b3b38' : '1px solid transparent' }}>
                  <span style={{ fontSize: '9px', color: location.pathname === to ? '#d8d5ce' : '#5a5852', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{cat}</span>
                  {label}
                </Link>
              ))}
            </>)}

            {/* Admin links */}
            {isAdmin() && (<>
              {[
                { to: '/dashboard', label: t('NAVBAR.ALL_COMPLAINTS', 'ALL COMPLAINTS'), cat: t('NAVBAR.ADMIN', 'ADMIN') },
                { to: '/submit', label: t('NAVBAR.REPORT', 'REPORT'), cat: t('NAVBAR.ACTION', 'ACTION') },
                { to: '/admin', label: t('NAVBAR.COMMAND_CENTER', 'COMMAND CENTER'), cat: t('NAVBAR.SYSTEM', 'SYSTEM') },
                { to: '/admin/users', label: t('NAVBAR.ACCOUNTS', 'ACCOUNTS'), cat: t('NAVBAR.SYSTEM', 'SYSTEM') },
                { to: '/admin/mails', label: t('NAVBAR.MAIL', 'MAIL'), cat: t('NAVBAR.SYSTEM', 'SYSTEM') },
                { to: '/admin/database', label: t('NAVBAR.DATABASE', 'DATABASE'), cat: t('NAVBAR.SYSTEM', 'SYSTEM') },
                { to: '/admin/link-analysis', label: t('NAVBAR.FORENSICS', 'FORENSICS'), cat: t('NAVBAR.SYSTEM', 'SYSTEM') },
                { to: '/admin/map', label: t('NAVBAR.MAP', 'MAP'), cat: t('NAVBAR.SYSTEM', 'SYSTEM') },
                { to: '/scam-search', label: t('NAVBAR.SCAM_SEARCH', 'SCAM SEARCH'), cat: t('NAVBAR.INTEL', 'INTEL') },
                { to: '/learn', label: t('NAVBAR.LEARN', 'LEARN'), cat: t('NAVBAR.AWARENESS', 'AWARENESS') },
              ].map(({ to, label, cat }) => (
                <Link key={to} to={to} data-active={location.pathname === to ? 'true' : 'false'}
                  style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', color: location.pathname === to ? '#f2f0ea' : '#8e8b84', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', fontFamily: "'IBM Plex Sans', sans-serif", background: location.pathname === to ? '#141414' : 'transparent', border: location.pathname === to ? '1px solid #3b3b38' : '1px solid transparent' }}>
                  <span style={{ fontSize: '9px', color: location.pathname === to ? '#d8d5ce' : '#5a5852', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{cat}</span>
                  {label}
                </Link>
              ))}
            </>)}

            {/* Help / FAQ sub-items */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 4px' }} />
            {[
              { label: 'Contact Us', action: () => { setMobileOpen(false); window.open('/contactlist.pdf', '_blank', 'noopener,noreferrer'); } },
              { label: 'Feedback', action: () => { setMobileOpen(false); navigate('/feedback'); } },
              { label: 'FAQ', action: () => { setMobileOpen(false); navigate('/faq'); } },
            ].map(item => (
              <button key={item.label} type="button" onClick={item.action}
                style={{ display: 'block', width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid transparent', color: '#8e8b84', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'pointer', textAlign: 'left' }}>
                {item.label}
              </button>
            ))}
          </div>

          {/* Drawer footer */}
          <div style={{ padding: '16px 20px 0', borderTop: '1px solid #242422', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => { setMobileOpen(false); navigate('/settings'); }}
              style={{ padding: '12px 16px', background: '#141414', border: '1px solid #242422', color: '#f2f0ea', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", textAlign: 'left' }}>
              ⚙ Settings
            </button>
            <button onClick={async () => { setMobileOpen(false); await handleLogout(); }}
              style={{ padding: '12px 16px', background: 'rgba(217,100,100,0.1)', border: '1px solid rgba(217,100,100,0.3)', color: '#D96464', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {t('NAVBAR.LOGOUT', 'DISCONNECT')}
            </button>
          </div>
        </div>
      </>,
      document.body
    )}
    </>
  );
}
