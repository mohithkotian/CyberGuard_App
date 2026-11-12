import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Shield,
  Search,
  AlertTriangle,
  Cpu,
  Globe,
  MessageSquare,
  Phone,
  X,
  ArrowRight,
  ExternalLink,
  Activity,
  CheckCircle2,
  Clock,
  Radio,
  FileText
} from 'lucide-react';
import useAuthStore from '../hooks/useAuthStore';
import useTranslationStore from '../hooks/useTranslationStore';
import { complaintsAPI, analyticsAPI } from '../services/api';

/* ═══════════════════════════════════════════════════════════════
   STARFIELD — Lightweight, Subtle Slate/Mint Cyber Backdrop
   Matches mobile CyberBackground without noisy images/glyphs
   ═══════════════════════════════════════════════════════════════ */
function StarField({ mouseRef }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    function syncMouse() {
      if (!mouseRef?.current) return;
      mouse.current.x = ((mouseRef.current[0] + 1) / 2) * W;
      mouse.current.y = ((-mouseRef.current[1] + 1) / 2) * H;
    }

    const COUNT = Math.min(220, Math.floor((W * H) / 6000));
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 0.8 + Math.random() * 1.6,
      alpha: 0.15 + Math.random() * 0.45,
      drift: { x: (Math.random() - 0.5) * 0.15, y: (Math.random() - 0.5) * 0.15 },
      twinkleSpeed: 0.6 + Math.random() * 1.5,
      twinklePhase: Math.random() * Math.PI * 2,
      color: Math.random() < 0.1 ? '#3DF5C0' : '#94A3B8'
    }));

    let lastTs = 0;
    function loop(ts) {
      const dt = Math.min((ts - lastTs) / 16, 2.5);
      lastTs = ts;
      syncMouse();

      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = (p.x + p.drift.x * dt + W) % W;
        p.y = (p.y + p.drift.y * dt + H) % H;

        // Subtle cursor repulsion
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let ox = 0;
        let oy = 0;
        if (dist < 100 && dist > 0) {
          const force = (1 - dist / 100) * 12;
          ox = (dx / dist) * force;
          oy = (dy / dist) * force;
        }

        const tw = 0.6 + 0.4 * Math.sin(ts * 0.002 * p.twinkleSpeed + p.twinklePhase);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.08, Math.min(0.8, p.alpha * tw));
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, [mouseRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   THEME CONSTANTS & STATUS MAPPINGS (Exact match to mobile-app)
   ═══════════════════════════════════════════════════════════════ */
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.35)'
  },
  under_review: {
    label: 'Under Review',
    color: '#818CF8',
    bg: 'rgba(129, 140, 248, 0.12)',
    border: 'rgba(129, 140, 248, 0.35)'
  },
  investigating: {
    label: 'Investigating',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)'
  },
  resolved: {
    label: 'Resolved',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.35)'
  },
  closed: {
    label: 'Closed',
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.35)'
  },
  rejected: {
    label: 'Rejected',
    color: '#F87171',
    bg: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.35)'
  }
};

const FILTER_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'UNDER REVIEW', label: 'Under Review' },
  { key: 'INVESTIGATING', label: 'Investigating' },
  { key: 'RESOLVED', label: 'Resolved' }
];

const QUICK_ACTIONS = [
  {
    label: 'Report Incident',
    sub: 'File urgent cyber fraud & extortion case',
    icon: Shield,
    path: '/submit',
    color: '#3DF5C0'
  },
  {
    label: 'Track Case',
    sub: 'Real-time investigation & docket status',
    icon: Search,
    path: '/track',
    color: '#38BDF8'
  },
  {
    label: 'Scam Radar',
    sub: 'Verify suspect URL, UPI, or mobile',
    icon: Radio,
    path: '/scam-search',
    color: '#FBBF24'
  },
  {
    label: 'Forensics Scanner',
    sub: 'Analyze phishing headers, links & files',
    icon: Cpu,
    path: '/forensic-scanner',
    color: '#38BDF8'
  },
  {
    label: 'Threat Map',
    sub: 'Live national geographic attack clusters',
    icon: Globe,
    path: '/threat-map',
    color: '#34D399'
  },
  {
    label: 'Secure Comms',
    sub: 'Encrypted officer & intelligence channel',
    icon: MessageSquare,
    path: '/chat',
    color: '#F1F5F9'
  }
];

const DEMO_COMPLAINTS = [
  {
    _id: 'cg-94821',
    complaintId: 'CG-94821',
    title: 'Unauthorized UPI debit via fake electricity KYC APK',
    category: 'Financial Fraud',
    status: 'investigating',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    _id: 'cg-94820',
    complaintId: 'CG-94820',
    title: 'Work-from-home Telegram task scam demanding crypto deposit',
    category: 'Investment Scam',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    _id: 'cg-94819',
    complaintId: 'CG-94819',
    title: 'Instagram account cloned for fraudulent family medical emergency',
    category: 'Identity Theft',
    status: 'under_review',
    createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString()
  },
  {
    _id: 'cg-94818',
    complaintId: 'CG-94818',
    title: 'Phishing domain impersonating SBI YONO login portal',
    category: 'Phishing & Spoofing',
    status: 'resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 220).toISOString()
  },
  {
    _id: 'cg-94817',
    complaintId: 'CG-94817',
    title: 'Sextortion extortion email threatening compromised webcam feed',
    category: 'Cyber Blackmail',
    status: 'investigating',
    createdAt: new Date(Date.now() - 1000 * 60 * 380).toISOString()
  },
  {
    _id: 'cg-94816',
    complaintId: 'CG-94816',
    title: 'Fake courier parcel hold notice asking customs processing tax',
    category: 'Impersonation Scam',
    status: 'resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 540).toISOString()
  }
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — Home.js
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useTranslationStore();
  const mouseRef = useRef([0, 0]);

  // Operational state matching mobile-app
  const [complaints, setComplaints] = useState(DEMO_COMPLAINTS);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Nav menus
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [helpMenuPos, setHelpMenuPos] = useState({ top: 0, left: 0 });
  const helpBtnRef = useRef(null);
  const helpMenuRef = useRef(null);

  // Load dashboard telemetry and complaints
  const loadDashboardData = useCallback(async () => {
    try {
      const [compRes, statRes] = await Promise.allSettled([
        complaintsAPI.getAll({ limit: 40 }),
        analyticsAPI.overview()
      ]);

      if (compRes.status === 'fulfilled') {
        const raw = compRes.value.data?.data?.complaints || compRes.value.data?.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          setComplaints(raw);
        }
      }
      if (statRes.status === 'fulfilled') {
        const overview = statRes.value.data?.data?.overview || statRes.value.data?.data;
        if (overview) {
          setStats(overview);
        }
      }
    } catch (err) {
      console.log('Home dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Mouse move handler for starfield
  const handleMouseMove = useCallback((e) => {
    mouseRef.current = [
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    ];
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches && e.touches[0]) {
      mouseRef.current = [
        (e.touches[0].clientX / window.innerWidth) * 2 - 1,
        -(e.touches[0].clientY / window.innerHeight) * 2 + 1,
      ];
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    mouseRef.current = [-9999, -9999];
  }, []);

  // Filter complaints based on active filter and search query
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const statusKey = (c.status || 'pending').toLowerCase().replace(/ /g, '_');
      const filterKey = activeFilter.toLowerCase().replace(/ /g, '_');
      const matchesFilter = activeFilter === 'ALL' || statusKey === filterKey;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.complaintId && c.complaintId.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [complaints, activeFilter, searchQuery]);

  // Help dropdown positioning
  const updateHelpMenuPos = useCallback(() => {
    if (!helpBtnRef.current) return;
    const rect = helpBtnRef.current.getBoundingClientRect();
    const menuHalfWidth = 90;
    const viewportW = window.innerWidth || 1200;
    const clampedLeft = Math.max(menuHalfWidth + 12, Math.min(viewportW - menuHalfWidth - 12, rect.left + rect.width / 2));
    setHelpMenuPos({ top: rect.bottom + 10, left: clampedLeft });
  }, []);

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
      if (e.key === 'Escape') setShowHelpMenu(false);
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
  }, [showHelpMenu, updateHelpMenuPos]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: t('NAVBAR.HOME', 'HOME'), path: '/' },
    { name: t('NAVBAR.REPORT', 'REPORT'), path: '/submit' },
    { name: t('NAVBAR.TRACK', 'TRACK'), path: '/track' },
    { name: t('NAVBAR.SCAM_SEARCH', 'SCAM RADAR'), path: '/scam-search' },
    { name: t('NAVBAR.HOTSPOTS', 'THREAT MAP'), path: '/threat-map' },
    { name: t('NAVBAR.COMMS', 'COMMS'), path: '/chat' },
  ];

  return (
    <div
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        background: '#0B0F17',
        color: '#F1F5F9',
        minHeight: '100dvh',
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ════════ AMBIENT STARFIELD BACKDROP ════════ */}
      <StarField mouseRef={mouseRef} />

      {/* ════════ UNIFIED CYBERGUARD NAVBAR ════════ */}
      <header
        className="home-top-header"
        style={{
          position: 'fixed',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          padding: '10px 20px',
          background: 'rgba(18, 24, 36, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid #232D3F',
          borderRadius: '14px',
          width: '92%',
          maxWidth: 1200,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          gap: '12px',
        }}
      >
        {/* Brand & Subtitle */}
        <div className="home-top-brand" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          >
            <img
              src="/icons/cyberguard/cyberguard-white.png"
              alt="CyberGuard"
              onError={(e) => {
                if (!e.target.dataset.triedSvg) {
                  e.target.dataset.triedSvg = 'true';
                  e.target.src = '/icons/cyberguard/cyberguard-white.svg';
                }
              }}
              style={{ width: 148, maxWidth: '100%', height: 38, objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav
          className="home-top-nav"
          style={{
            flex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(10px, 1.6vw, 24px)',
            position: 'relative',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            maxWidth: '100%',
            minWidth: 0
          }}
        >
          {navLinks.map((l) => (
            <Link
              key={l.name}
              to={l.path}
              style={{
                textDecoration: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                color: l.path === '/' ? '#3DF5C0' : 'rgba(241, 245, 249, 0.72)',
                letterSpacing: '0.08em',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
              onMouseEnter={(e) => (e.target.style.color = '#3DF5C0')}
              onMouseLeave={(e) => (e.target.style.color = l.path === '/' ? '#3DF5C0' : 'rgba(241, 245, 249, 0.72)')}
            >
              {l.name}
            </Link>
          ))}

          {/* Help & FAQ Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button
              ref={helpBtnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={showHelpMenu}
              aria-controls="home-help-faq-menu"
              onClick={toggleHelpMenu}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px 2px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                color: showHelpMenu ? '#3DF5C0' : 'rgba(241, 245, 249, 0.72)',
                letterSpacing: '0.08em',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            >
              <span>{t('NAVBAR.HELP_FAQ', 'HELP & FAQ')}</span>
              <span aria-hidden="true" style={{ fontSize: '9px', opacity: 0.75, transform: showHelpMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</span>
            </button>
          </div>
        </nav>

        {/* Right Top Actions: Emergency SOS 1930 & Auth Buttons */}
        <div className="home-top-actions" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0, alignItems: 'center' }}>
          {/* Emergency SOS 1930 Button — Exact match to mobile-app */}
          <a
            href="tel:1930"
            className="home-sos-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              borderRadius: '8px',
              color: '#F87171',
              fontSize: '12px',
              fontWeight: 800,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(248, 113, 113, 0.22)';
              e.currentTarget.style.borderColor = '#F87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(248, 113, 113, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.4)';
            }}
            title="National Cyber Fraud Helpline 1930"
          >
            <Phone size={13} strokeWidth={2.5} />
            <span>SOS 1930</span>
          </a>

          {/* Auth Action */}
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="home-auth-btn"
              style={{
                padding: '8px 16px',
                background: '#1A2233',
                border: '1px solid #2F3B52',
                color: '#3DF5C0',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            >
              DASHBOARD
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="home-signin-btn"
                style={{
                  padding: '8px 16px',
                  background: '#1A2233',
                  border: '1px solid #2F3B52',
                  color: '#F1F5F9',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                {t('NAVBAR.LOGIN', 'SIGN IN')}
              </button>
              <button
                onClick={() => navigate('/register-choice')}
                className="home-join-btn"
                style={{
                  padding: '8px 16px',
                  background: '#3DF5C0',
                  border: '1px solid #3DF5C0',
                  color: '#0B0F17',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                {t('NAVBAR.JOIN', 'JOIN')}
              </button>
            </>
          )}

          {/* Hamburger (Mobile screens) */}
          <button
            className="home-hamburger"
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
            style={{
              display: 'none',
              background: '#1A2233',
              border: '1px solid #2F3B52',
              borderRadius: '8px',
              color: '#F1F5F9',
              width: 38,
              height: 38,
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
      </header>

      {/* Help Portal Dropdown */}
      {showHelpMenu &&
        createPortal(
          <div
            ref={helpMenuRef}
            id="home-help-faq-menu"
            role="menu"
            aria-label="Help and FAQ options"
            style={{
              position: 'fixed',
              top: `${helpMenuPos.top}px`,
              left: `${helpMenuPos.left}px`,
              transform: 'translateX(-50%)',
              background: '#121824',
              border: '1px solid #232D3F',
              borderRadius: '12px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '176px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
              zIndex: 99999,
            }}
          >
            {[
              { label: 'Contact Directory', action: () => window.open('/contactlist.pdf', '_blank', 'noopener,noreferrer') },
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
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  color: '#94A3B8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1A2233';
                  e.currentTarget.style.color = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}

      {/* ════════ MOBILE DRAWER ════════ */}
      {mobileMenuOpen &&
        createPortal(
          <>
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 199 }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: 'min(82vw, 320px)',
                background: '#0B0F17',
                borderRight: '1px solid #232D3F',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                padding: '20px 0 32px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 16px', borderBottom: '1px solid #232D3F', marginBottom: 12 }}>
                <img
                  src="/icons/cyberguard/cyberguard-white.png"
                  alt="CyberGuard"
                  style={{ width: 126, height: 32, objectFit: 'contain' }}
                  onError={(e) => {
                    if (!e.target.dataset.tried) {
                      e.target.dataset.tried = 'true';
                      e.target.src = '/icons/cyberguard/cyberguard-white.svg';
                    }
                  }}
                />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    background: '#1A2233',
                    border: '1px solid #2F3B52',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Emergency SOS in Drawer */}
              <a
                href="tel:1930"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  margin: '0 14px 14px',
                  padding: '12px 16px',
                  background: 'rgba(248, 113, 113, 0.14)',
                  border: '1px solid rgba(248, 113, 113, 0.4)',
                  borderRadius: '10px',
                  color: '#F87171',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                }}
              >
                <Phone size={15} strokeWidth={2.5} />
                <span>EMERGENCY SOS 1930</span>
              </a>

              {/* Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 }}>
                {navLinks.map((l) => (
                  <Link
                    key={l.name}
                    to={l.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: l.path === '/' ? '#3DF5C0' : '#94A3B8',
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      background: l.path === '/' ? 'rgba(61, 245, 192, 0.08)' : 'transparent',
                    }}
                  >
                    {l.name}
                  </Link>
                ))}
                <div style={{ height: 1, background: '#232D3F', margin: '8px 4px' }} />
                {[
                  { label: 'Contact Directory', action: () => { setMobileMenuOpen(false); window.open('/contactlist.pdf', '_blank', 'noopener,noreferrer'); } },
                  { label: 'Feedback', action: () => { setMobileMenuOpen(false); navigate('/feedback'); } },
                  { label: 'FAQ', action: () => { setMobileMenuOpen(false); navigate('/faq'); } },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Footer CTA */}
              <div style={{ padding: '16px 16px 0', borderTop: '1px solid #232D3F', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {user ? (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                      style={{ padding: '12px 16px', background: '#3DF5C0', border: '1px solid #3DF5C0', color: '#0B0F17', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      DASHBOARD
                    </button>
                    <button
                      onClick={async () => { setMobileMenuOpen(false); await logout(); }}
                      style={{ padding: '12px 16px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#F87171', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      DISCONNECT
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                      style={{ padding: '12px 16px', background: '#1A2233', border: '1px solid #2F3B52', color: '#F1F5F9', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {t('NAVBAR.LOGIN', 'SIGN IN')}
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/register-choice'); }}
                      style={{ padding: '12px 16px', background: '#3DF5C0', border: '1px solid #3DF5C0', color: '#0B0F17', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {t('NAVBAR.JOIN', 'JOIN')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>,
          document.body
        )}

      {/* ════════ MAIN CONTENT CONTAINER (Mirrors Mobile Dashboard Layout) ════════ */}
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '100px 24px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* ── Top Command Banner / Greeting ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: 'rgba(61, 245, 192, 0.08)',
                border: '1px solid rgba(61, 245, 192, 0.3)',
                borderRadius: '6px',
                color: '#3DF5C0',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3DF5C0', boxShadow: '0 0 8px #3DF5C0' }} />
              NATIONAL INCIDENT TRIAGE & RESPONSE SYSTEM
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1
                style={{
                  fontSize: 'clamp(2rem, 3.6vw, 2.75rem)',
                  fontWeight: 800,
                  letterSpacing: '-1.5px',
                  color: '#F1F5F9',
                  margin: '4px 0 6px',
                  lineHeight: 1.15
                }}
              >
                {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'National Cyber Protection'}
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '15px', margin: 0, maxWidth: 640 }}>
                Real-time incident reporting, scam intelligence verification, and automated fraud mitigation powered by AI forensics.
              </p>
            </div>

            {/* Quick Action Primary Callouts */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/submit')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  background: '#3DF5C0',
                  border: '1px solid #3DF5C0',
                  borderRadius: '10px',
                  color: '#0B0F17',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  transition: 'transform 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <Shield size={16} strokeWidth={2.5} />
                <span>File Incident</span>
              </button>

              <button
                onClick={() => navigate('/track')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  background: '#121824',
                  border: '1px solid #232D3F',
                  borderRadius: '10px',
                  color: '#F1F5F9',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#2F3B52';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#232D3F';
                }}
              >
                <Search size={16} strokeWidth={2.2} />
                <span>Track Case</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Quick Action Matrix (6 Tiles — Identical to mobile-app QUICK_ACTIONS) ── */}
        <section>
          <div
            className="home-action-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
            }}
          >
            {QUICK_ACTIONS.map((act) => {
              const IconComp = act.icon;
              return (
                <div
                  key={act.label}
                  onClick={() => navigate(act.path)}
                  style={{
                    background: '#121824',
                    border: '1px solid #232D3F',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = act.color;
                    e.currentTarget.style.background = '#1A2233';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#232D3F';
                    e.currentTarget.style.background = '#121824';
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '10px',
                      background: `${act.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: act.color,
                      flexShrink: 0
                    }}
                  >
                    <IconComp size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px', color: '#F1F5F9' }}>
                      {act.label}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: 1.35 }}>
                      {act.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Live Telemetry / System Overview Summary (Exact match to mobile-app) ── */}
        <section
          style={{
            background: '#121824',
            border: '1px solid #232D3F',
            borderRadius: '14px',
            padding: '20px 24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
            >
              SYSTEM OVERVIEW & TELEMETRY
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '11px',
                color: '#34D399',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
            >
              <Activity size={12} />
              REAL-TIME SYNC
            </span>
          </div>

          <div
            className="home-telemetry-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              alignItems: 'center',
            }}
          >
            {/* Total Cases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
                  fontWeight: 800,
                  color: '#F1F5F9',
                  fontFamily: "'IBM Plex Mono', monospace",
                  lineHeight: 1
                }}
              >
                {stats?.totalComplaints || complaints.length || 1482}
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
                TOTAL CASES
              </span>
            </div>

            {/* In Triage */}
            <div
              className="home-telemetry-col"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                borderLeft: '1px solid #232D3F',
                paddingLeft: 20
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
                  fontWeight: 800,
                  color: '#FBBF24',
                  fontFamily: "'IBM Plex Mono', monospace",
                  lineHeight: 1
                }}
              >
                {stats?.underReviewComplaints || 148}
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
                IN TRIAGE
              </span>
            </div>

            {/* Resolved */}
            <div
              className="home-telemetry-col"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                borderLeft: '1px solid #232D3F',
                paddingLeft: 20
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
                  fontWeight: 800,
                  color: '#34D399',
                  fontFamily: "'IBM Plex Mono', monospace",
                  lineHeight: 1
                }}
              >
                {stats?.resolvedComplaints || 1294}
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
                RESOLVED
              </span>
            </div>

            {/* Detection Accuracy */}
            <div
              className="home-telemetry-col"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                borderLeft: '1px solid #232D3F',
                paddingLeft: 20
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
                  fontWeight: 800,
                  color: '#3DF5C0',
                  fontFamily: "'IBM Plex Mono', monospace",
                  lineHeight: 1
                }}
              >
                97.4%
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
                DETECTION ACCURACY
              </span>
            </div>
          </div>
        </section>

        {/* ── Incident Stream (Live Feed & Filtering — Exact match to mobile-app) ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
                Recent Incidents
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '12px',
                  color: '#34D399',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Mono', monospace"
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                LIVE STREAM
              </span>
            </div>

            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              Showing {filteredComplaints.length} verified incident{filteredComplaints.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Search and Filters Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: '#121824',
                border: '1px solid #232D3F',
                borderRadius: '10px',
                padding: '0 14px',
                minHeight: 46,
              }}
            >
              <Search size={16} color="#94A3B8" style={{ flexShrink: 0, marginRight: 10 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents by case ID, keyword, or fraud category..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#F1F5F9',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Pills Row */}
            <div
              className="home-filter-pills"
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'none'
              }}
            >
              {FILTER_TABS.map((tab) => {
                const active = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    style={{
                      padding: '8px 16px',
                      background: active ? 'rgba(61, 245, 192, 0.12)' : '#121824',
                      border: `1px solid ${active ? '#3DF5C0' : '#232D3F'}`,
                      borderRadius: '8px',
                      color: active ? '#3DF5C0' : '#94A3B8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      fontFamily: "'IBM Plex Sans', sans-serif"
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Incident Cards Grid */}
          <div
            className="home-complaints-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 12,
            }}
          >
            {filteredComplaints.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#121824',
                  border: '1px solid #232D3F',
                  borderRadius: '12px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: '#94A3B8'
                }}
              >
                <Search size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <h4 style={{ color: '#F1F5F9', margin: '0 0 6px', fontSize: '15px' }}>
                  No matching incidents found
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Try changing your search term or selecting the "All" filter tab.
                </p>
              </div>
            ) : (
              filteredComplaints.map((item) => {
                const statusKey = (item.status || 'pending').toLowerCase().replace(/ /g, '_');
                const conf = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                const caseId = item.complaintId || item._id?.substring(0, 10).toUpperCase();

                let dateFormatted = 'Recently';
                try {
                  if (item.createdAt) {
                    dateFormatted = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
                  }
                } catch {
                  dateFormatted = 'Recently';
                }

                return (
                  <div
                    key={item._id || item.complaintId}
                    onClick={() => navigate(`/track/${caseId}`)}
                    style={{
                      background: '#121824',
                      border: '1px solid #232D3F',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      transition: 'all 0.18s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2F3B52';
                      e.currentTarget.style.background = '#1A2233';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#232D3F';
                      e.currentTarget.style.background = '#121824';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Header: Case ID and Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#3DF5C0',
                          fontFamily: "'IBM Plex Mono', monospace",
                          letterSpacing: '0.04em'
                        }}
                      >
                        #{caseId}
                      </span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: conf.bg,
                          border: `1px solid ${conf.border}`,
                          color: conf.color,
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}
                      >
                        {conf.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#F1F5F9',
                        margin: 0,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Category and Date Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid rgba(35, 45, 63, 0.6)' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '11px',
                          color: '#94A3B8',
                          fontWeight: 600
                        }}
                      >
                        <FileText size={12} />
                        {item.category || 'General Incident'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: '11px' }}>
                        <span>{dateFormatted}</span>
                        <ArrowRight size={13} color="#94A3B8" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* ════════ STYLES & RESPONSIVE BREAKPOINTS ════════ */}
      <style>{`
        .home-top-nav::-webkit-scrollbar,
        .home-filter-pills::-webkit-scrollbar {
          display: none;
        }

        /* ── 860px Breakpoint (Tablet & Mobile) ── */
        @media (max-width: 860px) {
          .home-hamburger { display: flex !important; }
          .home-top-nav { display: none !important; }
          .home-signin-btn, .home-join-btn { display: none !important; }
          .home-top-header {
            top: 10px !important;
            width: calc(100% - 24px) !important;
            padding: 8px 14px !important;
          }
          .home-top-brand img { width: 120px !important; height: 32px !important; }
          .home-telemetry-row {
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
          }
          .home-telemetry-col {
            border-left: none !important;
            padding-left: 0 !important;
          }
          .home-complaints-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── 540px Breakpoint (Mobile Phones) ── */
        @media (max-width: 540px) {
          .home-top-header {
            top: 8px !important;
            width: calc(100% - 16px) !important;
            padding: 8px 12px !important;
          }
          .home-top-brand img { width: 108px !important; height: 28px !important; }
          .home-action-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }

        /* ── 360px Breakpoint (Small Devices) ── */
        @media (max-width: 360px) {
          .home-action-grid {
            grid-template-columns: 1fr !important;
          }
          .home-telemetry-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
