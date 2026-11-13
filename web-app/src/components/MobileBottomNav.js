import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../hooks/useAuthStore';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isOfficer } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Active path checker
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#3DF5C0' : '#8E8B85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      path: '/submit',
      label: 'Report',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#3DF5C0' : '#8E8B85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      )
    },
    {
      path: '/track',
      label: 'Track',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#3DF5C0' : '#8E8B85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      )
    },
    {
      path: '/dashboard',
      label: user ? 'Cases' : 'Dashboard',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#3DF5C0' : '#8E8B85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"/>
          <rect x="14" y="3" width="7" height="5"/>
          <rect x="14" y="12" width="7" height="9"/>
          <rect x="3" y="16" width="7" height="5"/>
        </svg>
      )
    },
    {
      isMenu: true,
      label: 'More',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#3DF5C0' : '#8E8B85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      )
    }
  ];

  return (
    <>
      <nav 
        className="mobile-bottom-nav"
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(10, 10, 10, 0.94)',
          borderTop: '1px solid #242422',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 9990,
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
      >
        {navItems.map((item, idx) => {
          if (item.isMenu) {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open more options"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  background: 'transparent',
                  border: 'none',
                  color: drawerOpen ? '#3DF5C0' : '#8E8B85',
                  cursor: 'pointer',
                  padding: '6px 0',
                  minHeight: 48,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                {item.icon(drawerOpen)}
                <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em' }}>
                  {item.label}
                </span>
              </button>
            );
          }

          const active = isActive(item.path);

          return (
            <Link
              key={idx}
              to={item.path}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                textDecoration: 'none',
                color: active ? '#3DF5C0' : '#8E8B85',
                padding: '6px 0',
                minHeight: 48,
                fontFamily: "'IBM Plex Sans', sans-serif",
                position: 'relative',
              }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: 24,
                    height: 2,
                    background: '#3DF5C0',
                    borderRadius: 1,
                  }}
                />
              )}
              {item.icon(active)}
              <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, letterSpacing: '0.04em', color: active ? '#EFEDE8' : '#8E8B85' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Slide-Up Bottom Drawer for "More" */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              zIndex: 9998,
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More navigation links"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#0D0D0D',
              borderTop: '1px solid #292927',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: '16px 20px calc(24px + env(safe-area-inset-bottom, 12px))',
              zIndex: 9999,
              maxHeight: '75dvh',
              overflowY: 'auto',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.65)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
                <span style={{ color: '#EFEDE8', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  CyberGuard Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
                style={{
                  background: '#1C1C1A',
                  border: '1px solid #2C2B28',
                  borderRadius: 6,
                  color: '#EFEDE8',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { to: '/learn', label: 'Awareness', sub: 'Knowledge' },
                { to: '/scam-search', label: 'Scam Radar', sub: 'Intel' },
                { to: '/suspect-search', label: 'Suspect Intel', sub: 'Lookup' },
                { to: '/forensic-scanner', label: 'Neural Scan', sub: 'Analysis' },
                { to: '/leak-monitor', label: 'Leak Monitor', sub: 'Dark Web' },
                { to: '/threat-map', label: 'Threat Map', sub: 'Hotspots' },
                { to: '/chat', label: 'Comms', sub: 'Encrypted' },
                { to: '/feedback', label: 'Feedback', sub: 'Support' },
                { to: '/faq', label: 'Help & FAQ', sub: 'Guide' },
                { to: '/settings', label: 'Settings', sub: 'Preferences' },
              ].map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate(item.to);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 14px',
                    background: '#141414',
                    border: '1px solid #242422',
                    borderRadius: 10,
                    color: '#EFEDE8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 10, color: '#8E8B85', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.sub}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{item.label}</span>
                </button>
              ))}
            </div>

            {isAdmin && isAdmin() && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #242422' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate('/admin');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(61, 245, 192, 0.08)',
                    border: '1px solid rgba(61, 245, 192, 0.25)',
                    borderRadius: 8,
                    color: '#3DF5C0',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  ⚡ COMMAND CENTER (ADMIN)
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

